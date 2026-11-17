import type { ChatRequest, StreamEvent } from '@app/shared-types';
import { LlmError, streamCompletion } from './llm.ts';
import type { DailyBudget, LlmConfig, RateLimiter } from './llm.ts';
import { addressCardStep, analyzeMessage, planTurn, scriptedReplySteps } from './mock-llm.ts';
import type { PlanStep, TurnContext } from './mock-llm.ts';
import { buildMessages } from './prompt.ts';
import type { HistoryItem } from './prompt.ts';
import { ReplyParser } from './reply-parser.ts';
import { pickCulturalNote } from './scripts.ts';
import { MAX_UI_CHARS, parseGeneratedForm } from './interactive.ts';

export interface EngineOptions {
  llm?: LlmConfig; limiter?: RateLimiter; budget?: DailyBudget;
  fallback?: 'error' | 'mock';
  fetchImpl?: typeof fetch;
}
export interface EngineContext extends TurnContext { history: HistoryItem[]; notesShown: Set<string> }
const step = (event: StreamEvent, delayMs = 0): PlanStep => ({ event, delayMs });

/** LLM chooses optional UI from conversation. Rules/cultural content remain app-controlled. */
export async function* runTurn(req: ChatRequest, ctx: EngineContext, opts: EngineOptions, signal?: AbortSignal): AsyncGenerator<PlanStep> {
  const rid = req.requestId;
  const interactive = req.interactive === true;
  if (!opts.llm || req.kind === 'hint' || (req.kind === 'open' && !interactive)) { yield* planTurn(req, ctx); return; }
  const msg = req.kind === 'open' ? 'Begin this practice conversation. Decide whether a helpful interaction is needed now.' : (req.message ?? '').trim();
  // Form selections are metadata, not a Vietnamese utterance to correct or a dev command.
  const a = analyzeMessage(req.interaction || req.kind === 'open' ? '' : msg, ctx);
  if (a.kind !== 'normal') { yield* planTurn(req, ctx); return; }
  if (a.fix) yield addressCardStep(rid, a.fix, 0);

  const messages = buildMessages({ scenario: ctx.scenario, profile: ctx.profile, result: a.result, history: ctx.history, userMessage: msg, interactive });
  const chars = messages.reduce((n, m) => n + m.content.length, 0);
  const outputLimit = opts.llm.maxTokens ?? (interactive ? 2400 : 220);
  let started = false;
  try {
    if (!(opts.limiter?.tryAcquire() ?? true)) throw new LlmError('rate_limit', true, 429);
    if (!(opts.budget?.tryReserve(chars + outputLimit * 4) ?? true)) throw new LlmError('daily_budget', false, 429);
    const parser = new ReplyParser(); let userEn = ''; let vi = ''; let ui = ''; let uiTooLarge = false; let lastUiPulse = Date.now();
    const flushUserEn = function* (): Generator<PlanStep> {
      if (userEn.trim() && req.kind === 'message' && !req.interaction) yield step({ type: 'user_translation', requestId: rid, translation: userEn.trim() });
      userEn = '';
    };
    const handle = function* (pieces: ReturnType<ReplyParser['push']>): Generator<PlanStep> {
      for (const p of pieces) {
        if (p.section === 'ui') {
          if (ui.length + p.text.length > MAX_UI_CHARS) uiTooLarge = true;
          if (!uiTooLarge) ui += p.text;
          if (Date.now() - lastUiPulse >= 1000) {
            lastUiPulse = Date.now();
            yield step({ type: 'text_delta', requestId: rid, partId: 'p1', text: '' });
          }
          continue; // Never leak partial JSON into dialogue/translation.
        }
        if (p.section === 'user_en') { userEn += p.text; continue; }
        yield* flushUserEn();
        if (p.section === 'vi') { started = true; vi += p.text; yield step({ type: 'text_delta', requestId: rid, partId: 'p1', text: p.text }); }
        else yield step({ type: 'text_delta', requestId: rid, partId: 'p1', text: '', translation: p.text });
      }
    };
    for await (const delta of streamCompletion({ ...opts.llm, maxTokens: outputLimit }, messages, signal, opts.fetchImpl)) yield* handle(parser.push(delta));
    yield* handle(parser.end());
    yield* flushUserEn();
    if (signal?.aborted) return;
    if (!vi.trim()) throw new LlmError('empty', true);
    const note = pickCulturalNote(ctx.scenario.id, [req.interaction ? '' : msg, vi], ctx.notesShown);
    if (note) { ctx.notesShown.add(note.id); yield step({ type: 'ui_card', requestId: rid, card: { type: 'cultural_note', data: { ...note.note, verified: false } } }, 60); }
    if (interactive && parser.uiStarted > 0) {
      const complete = !uiTooLarge && parser.uiStarted === 1 && parser.uiCompleted === 1;
      let form = complete ? parseGeneratedForm(ui) : null;
      let intentionalNull = complete && ui.trim() === 'null';
      if (!form && !intentionalNull && !uiTooLarge) {
        // One bounded schema repair through the same provider, subject to the same budgets.
        const repairMessages = [...messages,
          { role: 'assistant' as const, content: `<vi>${vi}</vi><ui>${ui}</ui>` },
          { role: 'user' as const, content: 'Your UI failed schema validation. Return ONLY a corrected JSON object matching the UI schema above, no tags or markdown. Keep the same question and choices. Use English labels. Use 1-5 fields, choice/select options must be strings. Omit optional metadata if uncertain. If no input is useful, return null. Do not repeat dialogue.' }];
        const repairChars = repairMessages.reduce((n, m) => n + m.content.length, 0);
        if (!(opts.limiter?.tryAcquire() ?? true)) throw new LlmError('rate_limit', true, 429);
        if (!(opts.budget?.tryReserve(repairChars + outputLimit * 4) ?? true)) throw new LlmError('daily_budget', false, 429);
        let repaired = '';
        for await (const delta of streamCompletion({ ...opts.llm, maxTokens: outputLimit }, repairMessages, signal, opts.fetchImpl)) {
          repaired += delta;
          if (repaired.length > MAX_UI_CHARS) throw new LlmError('invalid_ui', true);
        }
        if (signal?.aborted) return;
        form = parseGeneratedForm(repaired); intentionalNull = repaired.trim() === 'null';
      }
      if (form) yield step({ type: 'ui_card', requestId: rid, card: { type: 'scenario_form', data: form } });
      else if (!intentionalNull) {
        yield step({ type: 'text_delta', requestId: rid, partId: 'ui-fallback', text: 'The interactive question could not be displayed. You can answer in the chat instead.' });
        throw new LlmError('invalid_ui', true);
      }
    }
    yield step({ type: 'done', requestId: rid });
  } catch (err) {
    if (signal?.aborted) return;
    const e = err instanceof LlmError ? err : new LlmError('internal', true);
    console.error(`[facade] LLM lỗi: ${e.code}`);
    if (!started && opts.fallback === 'mock') {
      if (interactive) yield step({ type: 'text_delta', requestId: rid, partId: 'fallback-mode', text: 'The AI service is unavailable. This is a sample scripted reply; interactive questions are unavailable for this turn.' });
      yield* scriptedReplySteps(rid, ctx); return;
    }
    yield step({ type: 'error', requestId: rid, error: { message: e.publicMessage(), retryable: e.retryable } });
  }
}
