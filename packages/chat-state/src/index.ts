import type { AgentPart, ChatKind, StreamEvent, TurnState } from '@app/shared-types';

/** Reducer thuần cho một cuộc hội thoại (Plan 003). Mọi sự kiện gắn requestId; sự kiện không khớp lượt hiện hành bị bỏ (Constitution #12). */
export type Suggestion = { text: string; translation: string };
export type ChatItem =
  | { kind: 'user'; id: string; text: string; translation?: string }
  | { kind: 'agent'; requestId: string; parts: AgentPart[]; status: 'streaming' | 'complete' | 'interrupted' | 'stopped' }
  | { kind: 'clarify'; requestId: string; question: string; assumptions: string[]; options: string[]; answered: boolean };

export interface CurrentTurn {
  requestId: string; kind: ChatKind; state: TurnState;
  text?: string; translation?: string;            // để Retry gửi lại
  error?: { message: string; retryable: boolean };
  corrections: number;                            // số thẻ sửa lỗi xưng hô trong lượt (→ addressingErrorCount)
}
export interface ChatState { items: ChatItem[]; current: CurrentTurn | null; suggestions: Suggestion[] | null }

export const initialChatState: ChatState = { items: [], current: null, suggestions: null };

export type ChatAction =
  | { type: 'send'; requestId: string; text: string; translation?: string }
  | { type: 'open'; requestId: string }
  | { type: 'hint'; requestId: string }
  | { type: 'event'; event: StreamEvent }
  | { type: 'stop' }
  | { type: 'fail'; requestId: string; message: string; retryable: boolean }
  | { type: 'retry'; requestId: string }
  | { type: 'reset' };

export const isBusy = (s: ChatState) => s.current?.state === 'streaming';

function withAgent(items: ChatItem[], requestId: string, f: (a: Extract<ChatItem, { kind: 'agent' }>) => Extract<ChatItem, { kind: 'agent' }>): ChatItem[] {
  const i = items.findIndex((x) => x.kind === 'agent' && x.requestId === requestId);
  if (i < 0) return [...items, f({ kind: 'agent', requestId, parts: [], status: 'streaming' })];
  return items.map((x, j) => (j === i ? f(x as Extract<ChatItem, { kind: 'agent' }>) : x));
}
function setAgentStatus(items: ChatItem[], requestId: string, status: 'complete' | 'interrupted' | 'stopped'): ChatItem[] {
  return items.map((x) => (x.kind === 'agent' && x.requestId === requestId ? { ...x, status } : x));
}

export function chatReducer(s: ChatState, a: ChatAction): ChatState {
  switch (a.type) {
    case 'reset': return initialChatState;
    case 'send': {
      if (isBusy(s)) return s;
      const items = s.items.map((x): ChatItem => (x.kind === 'clarify' ? { ...x, answered: true } : x));
      return { items: [...items, { kind: 'user', id: a.requestId, text: a.text, translation: a.translation }], suggestions: null,
        current: { requestId: a.requestId, kind: 'message', state: 'streaming', text: a.text, translation: a.translation, corrections: 0 } };
    }
    case 'open':
      return { ...s, current: { requestId: a.requestId, kind: 'open', state: 'streaming', corrections: 0 } };
    case 'hint':
      if (isBusy(s)) return s;
      return { ...s, current: { requestId: a.requestId, kind: 'hint', state: 'streaming', corrections: 0 } };
    case 'stop': {
      if (!s.current || s.current.state !== 'streaming') return s;
      return { ...s, current: { ...s.current, state: 'cancelled' }, items: setAgentStatus(s.items, s.current.requestId, 'stopped') };
    }
    case 'fail': {
      if (!s.current || s.current.requestId !== a.requestId || s.current.state !== 'streaming') return s;
      return { ...s, current: { ...s.current, state: 'failed', error: { message: a.message, retryable: a.retryable } }, items: setAgentStatus(s.items, a.requestId, 'interrupted') };
    }
    case 'retry': {
      if (!s.current || s.current.state !== 'failed') return s;
      // bỏ phần trả lời dang dở của lượt cũ để không lặp nội dung; giữ tin nhắn của người học
      return { ...s, items: s.items.filter((x) => !(x.kind === 'agent' && x.requestId === s.current!.requestId)),
        current: { ...s.current, requestId: a.requestId, state: 'streaming', error: undefined, corrections: 0 } };
    }
    case 'event': {
      const e = a.event; const cur = s.current;
      if (!cur || e.requestId !== cur.requestId || cur.state !== 'streaming') return s; // sự kiện muộn / đã hủy / không khớp
      switch (e.type) {
        case 'text_delta': {
          const items = withAgent(s.items, e.requestId, (ag) => {
            const i = ag.parts.findIndex((p) => p.kind === 'text' && p.partId === e.partId);
            if (i < 0) return { ...ag, parts: [...ag.parts, { kind: 'text', partId: e.partId, text: e.text, translation: e.translation }] };
            const p = ag.parts[i] as Extract<AgentPart, { kind: 'text' }>;
            const parts = ag.parts.slice(); parts[i] = { ...p, text: p.text + e.text, translation: e.translation === undefined ? p.translation : (p.translation ?? '') + e.translation };
            return { ...ag, parts };
          });
          return { ...s, items };
        }
        case 'ui_card': {
          if (cur.kind === 'hint') {
            return e.card.type === 'reply_suggestion' ? { ...s, suggestions: e.card.data.suggestions } : s;
          }
          const items = withAgent(s.items, e.requestId, (ag) => ({ ...ag, parts: [...ag.parts, { kind: 'card', card: e.card }] }));
          const corrections = cur.corrections + (e.card.type === 'address' && e.card.data.isCorrection ? 1 : 0);
          return { ...s, items, current: { ...cur, corrections } };
        }
        case 'user_translation':
          // Chỉ áp cho tin nhắn của chính lượt này; kind khác (open/hint) không có tin của người học
          return cur.kind === 'message'
            ? { ...s, items: s.items.map((x) => (x.kind === 'user' && x.id === e.requestId ? { ...x, translation: e.translation } : x)) }
            : s;
        case 'needs_clarification':
          return { ...s, current: { ...cur, state: 'clarifying' }, items: [...setAgentStatus(s.items, e.requestId, 'complete'),
            { kind: 'clarify', requestId: e.requestId, question: e.question, assumptions: e.assumptions ?? [], options: e.options ?? [], answered: false }] };
        case 'done':
          return { ...s, current: { ...cur, state: 'completed' }, items: setAgentStatus(s.items, e.requestId, 'complete') };
        case 'error':
          return { ...s, current: { ...cur, state: 'failed', error: e.error }, items: setAgentStatus(s.items, e.requestId, 'interrupted') };
      }
    }
  }
}
