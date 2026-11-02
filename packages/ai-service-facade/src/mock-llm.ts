import type { AddressCardData, ChatRequest, Profile, Scenario, StreamEvent } from '@app/shared-types';
import { resolveAddressTerms } from '../../rules-xung-ho/src/index.ts';
import type { AddressRule, AddressingResult } from '../../rules-xung-ho/src/index.ts';
import { SCRIPTS, translateLearnerMessage } from './scripts.ts';

/** Một bước phát: sự kiện + độ trễ trước khi phát, hoặc `stall` (giữ kết nối, không gửi gì nữa – mô phỏng treo). */
export type PlanStep = { event: StreamEvent; delayMs: number } | { stall: true };
export interface TurnContext {
  scenario: Scenario; profile: Profile; turnIndex: number; rules: AddressRule[];
  devTriggers?: boolean;            // /error, /timeout chỉ có hiệu lực khi bật (môi trường phát triển)
}

const CLARIFY_RE = /nên gọi (người đó )?thế nào|how (should|do) i (address|call)/i;
const CLARIFY_OPTIONS = ['Younger than me', 'Similar age', 'Older than me', 'Much older'];

export function chunkWords(s: string): string[] {
  return s.split(/(?<=\s)/).filter(Boolean); // giữ khoảng trắng ở cuối mỗi từ
}

export function addressContext(ctx: TurnContext, withCounterpart: boolean) {
  const c = ctx.scenario.character;
  return {
    learner: { age: ctx.profile.age ?? undefined, gender: ctx.profile.gender },
    counterpart: withCounterpart ? { gender: c.gender, ageRange: c.ageRange } : {},
    relationship: withCounterpart ? c.relationship : null,
    setting: null,
  };
}

/**
 * Phát hiện lỗi xưng hô đơn giản: người học gọi "bạn" trong khi quy tắc yêu cầu từ khác.
 * Quyết định xưng hô luôn do rule engine; hàm này chỉ dựng câu gợi ý.
 */
export function detectAddressCorrection(message: string, r: AddressingResult): AddressCardData | null {
  if (r.mode === 'clarify' || !r.callTerm || r.callTerm === 'bạn' || !/\bbạn\b/i.test(message)) return null;
  const call = r.callTerm;
  let suggested = message.replace(/\bbạn\b/i, (m, offset: number) => (offset === 0 ? call.charAt(0).toUpperCase() + call.slice(1) : call));
  const polite = r.selfTerm === 'cháu' || r.selfTerm === 'em';
  if (polite && !/ạ\s*[?.!]*$/.test(suggested)) suggested = suggested.replace(/\s*([?.!]*)$/, ' ạ$1');
  return {
    originalText: message, suggestedText: suggested,
    suggestedTerms: { call: r.callTerm, self: r.selfTerm },
    isCorrection: true, explanation: r.reason, assumptions: r.assumptions.length ? r.assumptions : undefined,
  };
}

/** Phân tích tin nhắn của người học – dùng chung cho mock và LLM thật (rule-first, TRƯỚC khi gọi LLM). */
export type Analysis =
  | { kind: 'dev-error' } | { kind: 'dev-timeout' }
  | { kind: 'clarify'; result: AddressingResult }
  | { kind: 'normal'; result: AddressingResult; fix: AddressCardData | null };

export function analyzeMessage(msg: string, ctx: TurnContext): Analysis {
  if (ctx.devTriggers && msg === '/error') return { kind: 'dev-error' };
  if (ctx.devTriggers && msg === '/timeout') return { kind: 'dev-timeout' };
  if (CLARIFY_RE.test(msg)) return { kind: 'clarify', result: resolveAddressTerms(addressContext(ctx, false), ctx.rules) };
  const result = resolveAddressTerms(addressContext(ctx, true), ctx.rules);
  return { kind: 'normal', result, fix: detectAddressCorrection(msg, result) };
}

export const addressCardStep = (rid: string, fix: AddressCardData, delayMs = 80): PlanStep =>
  ({ delayMs, event: { type: 'ui_card', requestId: rid, card: { type: 'address', data: fix } } });

/** Câu trả lời theo kịch bản (mock, hoặc dự phòng khi LLM lỗi) + ghi chú văn hóa theo kịch bản + done. */
export function scriptedReplySteps(rid: string, ctx: TurnContext): PlanStep[] {
  const script = SCRIPTS[ctx.scenario.id];
  const reply = script.replies[Math.min(ctx.turnIndex, script.replies.length - 1)];
  const steps: PlanStep[] = [];
  for (const w of chunkWords(reply.vi)) steps.push({ delayMs: 25, event: { type: 'text_delta', requestId: rid, partId: 'p1', text: w } });
  steps.push({ delayMs: 40, event: { type: 'text_delta', requestId: rid, partId: 'p1', text: '', translation: reply.en } });
  if (reply.note) steps.push({ delayMs: 80, event: { type: 'ui_card', requestId: rid, card: { type: 'cultural_note', data: { ...reply.note, verified: false } } } });
  steps.push({ delayMs: 20, event: { type: 'done', requestId: rid } });
  return steps;
}

export function planTurn(req: ChatRequest, ctx: TurnContext): PlanStep[] {
  const script = SCRIPTS[ctx.scenario.id];
  const rid = req.requestId;
  const steps: PlanStep[] = [];
  const say = (vi: string, en: string) => {
    for (const w of chunkWords(vi)) steps.push({ delayMs: 25, event: { type: 'text_delta', requestId: rid, partId: 'p1', text: w } });
    steps.push({ delayMs: 40, event: { type: 'text_delta', requestId: rid, partId: 'p1', text: '', translation: en } });
  };

  if (req.kind === 'open') {
    say(script.opening.vi, script.opening.en);
    steps.push({ delayMs: 20, event: { type: 'done', requestId: rid } });
    return steps;
  }
  if (req.kind === 'hint') {
    steps.push({ delayMs: 60, event: { type: 'ui_card', requestId: rid, card: { type: 'reply_suggestion', data: { suggestions: script.hints } } } });
    steps.push({ delayMs: 10, event: { type: 'done', requestId: rid } });
    return steps;
  }

  const msg = (req.message ?? '').trim();
  const a = analyzeMessage(msg, ctx);
  if (a.kind === 'dev-error') {
    say('Xin lỗi, ', '');
    steps.push({ delayMs: 30, event: { type: 'error', requestId: rid, error: { message: 'Mock service error', retryable: true } } });
    return steps;
  }
  if (a.kind === 'dev-timeout') { say('Để bác xem… ', ''); steps.push({ stall: true }); return steps; }
  if (a.kind === 'clarify') { // thiếu hoàn toàn ngữ cảnh (TC-XH-15): hỏi làm rõ, không đoán
    steps.push({ delayMs: 60, event: { type: 'needs_clarification', requestId: rid, question: a.result.clarifyQuestion ?? '', assumptions: a.result.assumptions, options: CLARIFY_OPTIONS } });
    return steps;
  }
  const tr = translateLearnerMessage(msg);
  if (tr) steps.push({ delayMs: 40, event: { type: 'user_translation', requestId: rid, translation: tr } });
  if (a.fix) steps.push(addressCardStep(rid, a.fix));
  steps.push(...scriptedReplySteps(rid, ctx));
  return steps;
}
