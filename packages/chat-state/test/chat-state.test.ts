import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatReducer, initialChatState, isBusy } from '../src/index.ts';
import type { ChatAction, ChatState } from '../src/index.ts';
import type { StreamEvent } from '@app/shared-types';

const run = (actions: ChatAction[], s: ChatState = initialChatState) => actions.reduce(chatReducer, s);
const ev = (event: StreamEvent): ChatAction => ({ type: 'event', event });
const delta = (rid: string, text: string, translation?: string): ChatAction => ev({ type: 'text_delta', requestId: rid, partId: 'p1', text, translation });
const addr = (rid: string) => ev({ type: 'ui_card', requestId: rid, card: { type: 'address', data: { originalText: 'a', suggestedText: 'b', suggestedTerms: { call: 'bác', self: 'cháu' }, isCorrection: true, explanation: 'x' } } });
const agent = (s: ChatState) => s.items.find((i) => i.kind === 'agent') as any;

test('luồng đầy đủ: send → thẻ → text (nối đúng thứ tự) → dịch → done', () => {
  const s = run([{ type: 'send', requestId: 'r1', text: 'Bạn ơi' }, addr('r1'), delta('r1', 'Điện '), delta('r1', 'ba nghìn.'), delta('r1', '', 'Electricity is '), delta('r1', '', '3,500'), ev({ type: 'done', requestId: 'r1' })]);
  assert.equal(s.current!.state, 'completed');
  assert.equal(s.current!.corrections, 1);
  const a = agent(s);
  assert.equal(a.status, 'complete');
  assert.equal(a.parts[0].kind, 'card');                       // thẻ đứng trước câu trả lời
  assert.equal(a.parts[1].text, 'Điện ba nghìn.');
  assert.equal(a.parts[1].translation, 'Electricity is 3,500');
  assert.equal(s.items[0].kind, 'user');
});
test('đang streaming thì không gửi tin mới (chống lẫn lượt)', () => {
  const s = run([{ type: 'send', requestId: 'r1', text: 'a' }, { type: 'send', requestId: 'r2', text: 'b' }]);
  assert.equal(s.items.filter((i) => i.kind === 'user').length, 1); assert.equal(s.current!.requestId, 'r1'); assert.ok(isBusy(s));
});
test('sự kiện muộn của request đã hủy bị bỏ; giữ phần đã nhận, đánh dấu "stopped"', () => {
  const s = run([{ type: 'send', requestId: 'r1', text: 'a' }, delta('r1', 'Xin '), { type: 'stop' }, delta('r1', 'chào'), ev({ type: 'done', requestId: 'r1' })]);
  assert.equal(s.current!.state, 'cancelled'); assert.equal(agent(s).status, 'stopped'); assert.equal(agent(s).parts[0].text, 'Xin ');
});
test('hủy rồi gửi lượt mới: event cũ không chen vào lượt mới', () => {
  let s = run([{ type: 'send', requestId: 'r1', text: 'a' }, delta('r1', 'cũ '), { type: 'stop' }, { type: 'send', requestId: 'r2', text: 'b' }]);
  s = run([delta('r1', 'MUỘN'), delta('r2', 'mới')], s);
  const agents = s.items.filter((i) => i.kind === 'agent') as any[];
  assert.equal(agents.length, 2); assert.equal(agents[0].parts[0].text, 'cũ '); assert.equal(agents[1].parts[0].text, 'mới');
});
test('error → failed (giữ nội dung dang dở, "interrupted"); retry tạo requestId mới, bỏ phần dang dở, giữ tin người học', () => {
  let s = run([{ type: 'send', requestId: 'r1', text: 'Bạn ơi' }, delta('r1', 'Xin '), ev({ type: 'error', requestId: 'r1', error: { message: 'boom', retryable: true } })]);
  assert.equal(s.current!.state, 'failed'); assert.equal(agent(s).status, 'interrupted'); assert.equal(s.current!.error!.retryable, true);
  s = run([{ type: 'retry', requestId: 'r2' }], s);
  assert.equal(s.current!.state, 'streaming'); assert.equal(s.current!.requestId, 'r2'); assert.equal(s.current!.text, 'Bạn ơi');
  assert.equal(s.items.filter((i) => i.kind === 'agent').length, 0); assert.equal(s.items.filter((i) => i.kind === 'user').length, 1);
  s = run([delta('r1', 'MUỘN từ lượt lỗi')], s);                 // event muộn của request cũ
  assert.equal(s.items.filter((i) => i.kind === 'agent').length, 0);
});
test('fail từ client (timeout/mất kết nối) giống error; bỏ qua nếu lượt đã kết thúc', () => {
  let s = run([{ type: 'send', requestId: 'r1', text: 'a' }, { type: 'fail', requestId: 'r1', message: 'timeout', retryable: true }]);
  assert.equal(s.current!.state, 'failed');
  s = run([{ type: 'send', requestId: 'r1', text: 'a' }, ev({ type: 'done', requestId: 'r1' }), { type: 'fail', requestId: 'r1', message: 'late', retryable: true }]);
  assert.equal(s.current!.state, 'completed');
});
test('needs_clarification → trạng thái clarifying; gửi tin tiếp theo đánh dấu đã trả lời', () => {
  let s = run([{ type: 'send', requestId: 'r1', text: 'nên gọi thế nào' }, ev({ type: 'needs_clarification', requestId: 'r1', question: 'Q?', assumptions: ['A'], options: ['Older'] })]);
  assert.equal(s.current!.state, 'clarifying'); assert.ok(!isBusy(s));
  assert.equal((s.items.at(-1) as any).kind, 'clarify'); assert.equal((s.items.at(-1) as any).answered, false);
  s = run([{ type: 'send', requestId: 'r2', text: 'Older than me' }], s);
  assert.equal((s.items.find((i) => i.kind === 'clarify') as any).answered, true);
});
test('hint: thẻ reply_suggestion vào `suggestions`, không thành tin nhắn; tin mới xóa gợi ý', () => {
  let s = run([{ type: 'hint', requestId: 'h1' }, ev({ type: 'ui_card', requestId: 'h1', card: { type: 'reply_suggestion', data: { suggestions: [{ text: 'Dạ', translation: 'Yes' }] } } }), ev({ type: 'done', requestId: 'h1' })]);
  assert.equal(s.suggestions!.length, 1); assert.equal(s.items.length, 0);
  s = run([{ type: 'send', requestId: 'r1', text: 'Dạ' }], s);
  assert.equal(s.suggestions, null);
});
test('open: không có tin nhắn của người học; completed khi done', () => {
  const s = run([{ type: 'open', requestId: 'o1' }, delta('o1', 'Chào cháu'), ev({ type: 'done', requestId: 'o1' })]);
  assert.equal(s.items.filter((i) => i.kind === 'user').length, 0); assert.equal(s.current!.kind, 'open'); assert.equal(s.current!.state, 'completed');
});
test('sự kiện khi chưa có lượt nào hoặc lượt đã completed bị bỏ qua', () => {
  assert.equal(run([delta('x', 'a')]), initialChatState);
  const s = run([{ type: 'send', requestId: 'r1', text: 'a' }, ev({ type: 'done', requestId: 'r1' }), delta('r1', 'thừa')]);
  assert.equal(s.items.filter((i) => i.kind === 'agent').length, 0);
});

test('user_translation gắn vào tin nhắn của người học (đúng lượt); event muộn của lượt cũ bị bỏ', () => {
  let s = run([{ type: 'send', requestId: 'r1', text: 'Bạn ơi, tiền điện bao nhiêu?' }, ev({ type: 'user_translation', requestId: 'r1', translation: 'Hey, how much is the electricity?' })]);
  assert.equal((s.items[0] as any).translation, 'Hey, how much is the electricity?');
  s = run([{ type: 'stop' }, { type: 'send', requestId: 'r2', text: 'Dạ' }, ev({ type: 'user_translation', requestId: 'r1', translation: 'MUỘN' })], s);
  assert.equal((s.items[1] as any).translation, undefined);
});
