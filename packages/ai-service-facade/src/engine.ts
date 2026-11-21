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
import { dialogueIssue, uiConversationIssue } from './dialogue-quality.ts';
import { changedQuote, uiNeedsEnglish } from './response-quality.ts';

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
  const acquire = () => {
    if (!(opts.limiter?.tryAcquire() ?? true)) throw new LlmError('rate_limit', true, 429, opts.limiter?.retryAfterMs());
  };
  try {
    acquire();
    if (!(opts.budget?.tryReserve(chars + outputLimit * 4) ?? true)) throw new LlmError('daily_budget', false, 429);
    let parser = new ReplyParser(); let userEn = ''; let vi = ''; let ui = ''; let uiTooLarge = false; let lastUiPulse = Date.now();
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
    let qualityReason = '';
    let recovery: 'empty' | 'network' | 'quality' = 'empty';
    for (let attempt = 0; attempt < 2; attempt++) {
      const attemptMessages = attempt && recovery !== 'network' ? [...messages, { role: 'user' as const, content: recovery === 'quality'
        ? `Previous issue: ${qualityReason}. Do not ask a payment question or generate payment UI unless I explicitly asked how I can pay. Do not re-ask a recent question or a detail I just supplied. Avoid administrative confirmations such as ghi nhận and corporate closings such as Rất vui được phục vụ, hân hạnh, cảm ơn sự tin tưởng. If I am saying goodbye, end briefly in character without a question or UI; use a complete farewell phrase, not a bare address term plus nhé (such as Cháu nhé); only refer to a next step actually agreed in the conversation. Prefer answering my last point with a short statement; no closing question is required. ` + 'Rewrite the reply to my last message. Your previous attempt failed dialogue quality: use only the Latin-based Vietnamese alphabet, do not mix other writing systems, and do not repeat a generic anything-else question from recent replies. Answer directly in one or two short sentences, preserving agreed facts and address terms. Do not change the previously quoted price when the learner only asks for the total. If several items were ordered, compute quantity times each agreed unit price and sum; never invent a surcharge. Return <vi>Vietnamese reply</vi><en>English translation</en> and optional valid <ui>JSON</ui>; do not discuss the correction.'
        : 'The previous generation contained no spoken reply. Answer the last learner message or submitted choices now. Begin with <vi>one short Vietnamese in-character reply</vi><en>its English translation</en>. Only then optionally append a valid <ui> block. Do not output UI alone.' }] : messages;
      if (attempt) {
        acquire();
        if (!(opts.budget?.tryReserve(attemptMessages.reduce((sum, m) => sum + m.content.length, 0) + outputLimit * 4) ?? true)) throw new LlmError('daily_budget', false, 429);
        parser = new ReplyParser(); userEn = ''; vi = ''; ui = ''; uiTooLarge = false;
      }
      let pending: PlanStep[] = []; let released = false;
      const emit = function* (pieces: ReturnType<ReplyParser['push']>, complete = false): Generator<PlanStep> {
        for (const event of handle(pieces)) pending.push(event);
        if (vi.length > 4000) throw new LlmError('dialogue_quality', true);
        if (vi.trim() && (released || parser.viCompleted > 0 || complete)) {
          qualityReason = dialogueIssue(vi, ctx.history, msg) ?? (changedQuote(vi, ctx.history, msg) ? 'changed_quote' : '');
          if (qualityReason) throw new LlmError('dialogue_quality', true);
          released = true; yield* pending; pending = [];
        }
      };
      try {
        for await (const delta of streamCompletion({ ...opts.llm, maxTokens: outputLimit }, attemptMessages, signal, opts.fetchImpl)) yield* emit(parser.push(delta));
        yield* emit(parser.end(), true);
      } catch (err) {
        if (attempt === 0 && !released && !signal?.aborted && err instanceof LlmError && err.code === 'dialogue_quality') {
          recovery = 'quality'; console.info('[facade] LLM recovery: dialogue_quality'); continue;
        }
        if (attempt === 0 && !vi.trim() && !signal?.aborted && err instanceof LlmError && err.code === 'network') {
          recovery = 'network';
          console.info('[facade] LLM recovery: network_before_dialogue');
          await new Promise<void>((resolve) => {
            const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', finish); resolve(); };
            const timer = setTimeout(finish, 750);
            signal?.addEventListener('abort', finish, { once: true });
            if (signal?.aborted) finish();
          });
          if (signal?.aborted) return;
          continue;
        }
        if (!signal?.aborted && !released && vi.trim() && !dialogueIssue(vi, ctx.history, msg) && !changedQuote(vi, ctx.history, msg)) yield* emit([], true);
        throw err;
      }
      if (signal?.aborted) return;
      if (vi.trim()) { yield* flushUserEn(); break; }
    }
    if (signal?.aborted) return;
    if (!vi.trim()) throw new LlmError('empty', true);
    const note = pickCulturalNote(ctx.scenario.id, [req.interaction ? '' : msg, vi], ctx.notesShown);
    if (note) { ctx.notesShown.add(note.id); yield step({ type: 'ui_card', requestId: rid, card: { type: 'cultural_note', data: { ...note.note, verified: false } } }, 60); }
    if (interactive && parser.uiStarted > 0) {
      const complete = !uiTooLarge && parser.uiStarted === 1 && parser.uiCompleted === 1;
      let form = complete ? parseGeneratedForm(ui) : null;
      const formIssue = (candidate: NonNullable<ReturnType<typeof parseGeneratedForm>>) => uiNeedsEnglish(candidate, ctx.history) ? 'ui_language' : uiConversationIssue(candidate, ctx.history, msg);
      const uiIssue = form ? formIssue(form) : 'ui_schema';
      if (uiIssue) form = null;
      let intentionalNull = complete && ui.trim() === 'null';
      if (!form && !intentionalNull && !uiTooLarge) {
        // One bounded schema repair through the same provider, subject to the same budgets.
        const repairMessages = [...messages,
          { role: 'assistant' as const, content: `<vi>${vi}</vi><ui>${ui}</ui>` },
          { role: 'user' as const, content: `Detected issue: ${uiIssue}. ` + 'Your UI failed schema, language or conversation validation. Do not ask for payment unless the last learner message explicitly asks how to pay. If the learner clearly says goodbye, return null. Never ask again for a choice just submitted or a question asked recently; if no new input is needed return null. Return ONLY a corrected JSON object matching the UI schema above, no tags or markdown. Keep the question and choices only if they are still needed; otherwise return null. Translate ALL titles, descriptions, labels, badges and fact label/value text into English. Preserve Vietnamese option names and exact option strings. For example, Noodles mềm becomes Soft noodles and Ăn trong bát becomes Served in a bowl. Preserve agreed prices and choices. Use 1-5 fields, choice/select options must be strings. Omit optional metadata if uncertain. If no input is useful, return null. Do not repeat dialogue.' }];
        const repairChars = repairMessages.reduce((n, m) => n + m.content.length, 0);
        acquire();
        if (!(opts.budget?.tryReserve(repairChars + outputLimit * 4) ?? true)) throw new LlmError('daily_budget', false, 429);
        console.info(`[facade] UI repair: ${uiIssue}`);
        let repaired = '';
        for await (const delta of streamCompletion({ ...opts.llm, maxTokens: outputLimit }, repairMessages, signal, opts.fetchImpl)) {
          repaired += delta;
          if (repaired.length > MAX_UI_CHARS) throw new LlmError('invalid_ui', true);
        }
        if (signal?.aborted) return;
        form = parseGeneratedForm(repaired);
        const repairedIssue = form ? formIssue(form) : (repaired.trim() === 'null' ? null : 'ui_schema');
        if (repairedIssue) { console.info(`[facade] UI rejected: ${repairedIssue}`); form = null; }
        intentionalNull = repaired.trim() === 'null';
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
    if (e.code === 'http_429') opts.limiter?.blockFor(e.retryAfterMs ?? 60000);
    console.error(`[facade] LLM lỗi: ${e.code}`);
    if (!started && opts.fallback === 'mock') {
      if (interactive) yield step({ type: 'text_delta', requestId: rid, partId: 'fallback-mode', text: 'The AI service is unavailable. This is a sample scripted reply; interactive questions are unavailable for this turn.' });
      yield* scriptedReplySteps(rid, ctx); return;
    }
    yield step({ type: 'error', requestId: rid, error: { message: e.publicMessage(), retryable: e.retryable } });
  }
}
