import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStreamEvent, validateUICard } from '../src/index.ts';

test('text_delta có translation hợp lệ', () => {
  const e = parseStreamEvent({ type: 'text_delta', requestId: 'r1', partId: 'p1', text: 'Chào cháu', translation: 'Hello' });
  assert.equal(e?.type, 'text_delta');
});
test('text_delta thiếu partId bị từ chối', () => {
  assert.equal(parseStreamEvent({ type: 'text_delta', requestId: 'r1', text: 'x' }), null);
});
test('thẻ address đủ originalText/suggestedText', () => {
  assert.ok(validateUICard({ type: 'address', data: {
    originalText: 'Bạn ơi, tiền điện bao nhiêu?', suggestedText: 'Bác ơi, tiền điện bao nhiêu ạ?',
    suggestedTerms: { call: 'bác', self: 'cháu' }, isCorrection: true, explanation: 'Chủ nhà lớn tuổi hơn nhiều.' } }));
});
test('thẻ address thiếu suggestedText bị từ chối', () => {
  assert.equal(validateUICard({ type: 'address', data: { originalText: 'a', suggestedTerms: {}, isCorrection: true, explanation: 'x' } }), false);
});
test('reply_suggestion cần translation và tối đa 2 gợi ý', () => {
  const s = (n: number) => ({ type: 'reply_suggestion', data: { suggestions: Array.from({ length: n }, () => ({ text: 'Dạ', translation: 'Yes' })) } });
  assert.ok(validateUICard(s(2)));
  assert.equal(validateUICard(s(3)), false);
  assert.equal(validateUICard({ type: 'reply_suggestion', data: { suggestions: [{ text: 'Dạ' }] } }), false);
});
test('cultural_note chưa verified vẫn hợp lệ (UI gắn Sample)', () => {
  assert.ok(validateUICard({ type: 'cultural_note', data: { title: 't', explanation: 'e', verified: false } }));
});
test('type lạ bị từ chối để UI hạ cấp văn bản', () => {
  assert.equal(validateUICard({ type: 'delete_all', data: {} }), false);
  assert.equal(parseStreamEvent({ type: 'ui_card', requestId: 'r', card: { type: 'x', data: {} } }), null);
});
test('needs_clarification và error', () => {
  assert.ok(parseStreamEvent({ type: 'needs_clarification', requestId: 'r', question: 'Người đó khoảng tuổi nào?' }));
  assert.ok(parseStreamEvent({ type: 'error', requestId: 'r', error: { message: 'timeout', retryable: true } }));
  assert.equal(parseStreamEvent({ type: 'error', requestId: 'r', error: { message: 'x' } }), null);
});

test('address card: assumptions phải là mảng chuỗi', () => {
  const base = { originalText: 'a', suggestedText: 'b', suggestedTerms: { call: 'em', self: null }, isCorrection: false, explanation: 'x' };
  assert.ok(validateUICard({ type: 'address', data: { ...base, assumptions: ['Chưa biết giới tính người học'] } }));
  assert.equal(validateUICard({ type: 'address', data: { ...base, assumptions: [1] } }), false);
});

import { SseParser, formatSseEvent, validateProfile, validateChatRequest, DEFAULT_PROFILE } from '../src/index.ts';
import type { StreamEvent } from '../src/index.ts';

test('SSE: format → parse khứ hồi, chịu được chunk bị cắt giữa chừng', () => {
  const evs: StreamEvent[] = [
    { type: 'text_delta', requestId: 'r1', partId: 'p1', text: 'Chào cháu', translation: 'Hello' },
    { type: 'done', requestId: 'r1' },
  ];
  const wire = evs.map(formatSseEvent).join('');
  const p = new SseParser(); const got: unknown[] = [];
  for (let i = 0; i < wire.length; i += 7) got.push(...p.push(wire.slice(i, i + 7))); // 7 ký tự/chunk
  assert.deepEqual(got, evs);
});
test('SSE: event hỏng bị bỏ qua, event sau vẫn nhận', () => {
  const p = new SseParser();
  const got = p.push('event: x\ndata: {hỏng\n\n' + formatSseEvent({ type: 'done', requestId: 'r' }));
  assert.equal(got.length, 1);
});
test('Profile: mặc định hợp lệ; tuổi/giá trị sai bị từ chối', () => {
  assert.ok(validateProfile(DEFAULT_PROFILE));
  assert.ok(validateProfile({ ...DEFAULT_PROFILE, age: null }));
  assert.equal(validateProfile({ ...DEFAULT_PROFILE, age: '28' }), false);
  assert.equal(validateProfile({ ...DEFAULT_PROFILE, age: 3 }), false);
  assert.equal(validateProfile({ ...DEFAULT_PROFILE, region: 'east' }), false);
});
test('ChatRequest: message bắt buộc khi kind=message; open/hint không cần', () => {
  assert.ok(validateChatRequest({ requestId: 'r', scenarioId: 'renting', kind: 'open' }));
  assert.ok(validateChatRequest({ requestId: 'r', scenarioId: 'renting', kind: 'message', message: 'Xin chào' }));
  assert.equal(validateChatRequest({ requestId: 'r', scenarioId: 'renting', kind: 'message' }), false);
  assert.equal(validateChatRequest({ requestId: 'r', scenarioId: 'renting', kind: 'message', message: '   ' }), false);
});

test('user_translation: cần requestId và translation không rỗng', () => {
  assert.ok(parseStreamEvent({ type: 'user_translation', requestId: 'r', translation: 'Hello' }));
  assert.equal(parseStreamEvent({ type: 'user_translation', requestId: 'r', translation: '' }), null);
  assert.equal(parseStreamEvent({ type: 'user_translation', requestId: 'r' }), null);
});
