import type { ChatRequest, StreamEvent } from '@app/shared-types';
import { LlmError, streamCompletion } from './llm.ts';
import type { DailyBudget, LlmConfig, RateLimiter } from './llm.ts';
import { addressCardStep, analyzeMessage, planTurn, scriptedReplySteps } from './mock-llm.ts';
import type { PlanStep, TurnContext } from './mock-llm.ts';
import { buildMessages } from './prompt.ts';
import type { HistoryItem } from './prompt.ts';
import { ReplyParser } from './reply-parser.ts';
import { pickCulturalNote } from './scripts.ts';

export interface EngineOptions {
  llm?: LlmConfig; limiter?: RateLimiter; budget?: DailyBudget;
  fallback?: 'error' | 'mock';        // 'mock': LLM lỗi trước khi có chữ nào → dùng câu trả lời theo kịch bản (cho ngày demo)
  fetchImpl?: typeof fetch;
}
export interface EngineContext extends TurnContext { history: HistoryItem[]; notesShown: Set<string> }

const step = (event: StreamEvent, delayMs = 0): PlanStep => ({ event, delayMs });

/**
 * Chế độ mock: toàn bộ theo kịch bản. Chế độ LLM: chỉ lượt `message` bình thường gọi LLM;
 * câu mở đầu, gợi ý, hỏi làm rõ và thẻ xưng hô luôn do dữ liệu/rule engine quyết định (rule-first, LLM chỉ diễn giải).
 */
export async function* runTurn(req: ChatRequest, ctx: EngineContext, opts: EngineOptions, signal?: AbortSignal): AsyncGenerator<PlanStep> {
  const rid = req.requestId;
  if (!opts.llm || req.kind !== 'message') { yield* planTurn(req, ctx); return; }
  const msg = (req.message ?? '').trim();
  const a = analyzeMessage(msg, ctx);
  if (a.kind !== 'normal') { yield* planTurn(req, ctx); return; }

  if (a.fix) yield addressCardStep(rid, a.fix, 0);          // thẻ sửa xưng hô hiện ngay, không phụ thuộc LLM

  const messages = buildMessages({ scenario: ctx.scenario, profile: ctx.profile, result: a.result, history: ctx.history, userMessage: msg });
  const chars = messages.reduce((n, m) => n + m.content.length, 0);
  let started = false;
  try {
    if (!(opts.limiter?.tryAcquire() ?? true) || !(opts.budget?.tryReserve(chars + 600) ?? true)) throw new LlmError('quota', true, 429);
    const parser = new ReplyParser(); let userEn = ''; let vi = '';
    const flushUserEn = function* (): Generator<PlanStep> { if (userEn.trim()) { yield step({ type: 'user_translation', requestId: rid, translation: userEn.trim() }); } userEn = ''; };
    const handle = function* (pieces: ReturnType<ReplyParser['push']>): Generator<PlanStep> {
      for (const p of pieces) {
        if (p.section === 'user_en') { userEn += p.text; continue; }
        yield* flushUserEn();
        if (p.section === 'vi') { started = true; vi += p.text; yield step({ type: 'text_delta', requestId: rid, partId: 'p1', text: p.text }); }
        else yield step({ type: 'text_delta', requestId: rid, partId: 'p1', text: '', translation: p.text });
      }
    };
    for await (const delta of streamCompletion(opts.llm, messages, signal, opts.fetchImpl)) yield* handle(parser.push(delta));
    yield* handle(parser.end());
    yield* flushUserEn();
    if (signal?.aborted) return;
    if (!vi.trim()) throw new LlmError('empty', true);
    const note = pickCulturalNote(ctx.scenario.id, [msg, vi], ctx.notesShown);
    if (note) { ctx.notesShown.add(note.id); yield step({ type: 'ui_card', requestId: rid, card: { type: 'cultural_note', data: { ...note.note, verified: false } } }, 60); }
    yield step({ type: 'done', requestId: rid });
  } catch (err) {
    if (signal?.aborted) return;
    const e = err instanceof LlmError ? err : new LlmError('internal', true);
    console.error(`[facade] LLM lỗi: ${e.code}`);                 // không ghi nội dung lỗi/khóa
    if (!started && opts.fallback === 'mock') { yield* scriptedReplySteps(rid, ctx); return; }
    yield step({ type: 'error', requestId: rid, error: { message: e.publicMessage(), retryable: e.retryable } });
  }
}
