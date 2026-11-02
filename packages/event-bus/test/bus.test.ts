import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/index.ts';

const turn = { type: 'conversationTurnCompleted', payload: { scenarioId: 'renting', requestId: 'r1' } };

test('publish → subscriber nhận đúng event', () => {
  const bus = new EventBus(); const got: string[] = [];
  bus.subscribe('conversationTurnCompleted', (e) => got.push(e.payload.scenarioId));
  assert.ok(bus.publish(turn)); assert.deepEqual(got, ['renting']);
});
test('chỉ nhận loại event đã đăng ký', () => {
  const bus = new EventBus(); let n = 0; bus.subscribe('profileUpdated', () => n++);
  bus.publish(turn); assert.equal(n, 0);
});
test('unsubscribe (unmount) thì không nhận nữa', () => {
  const bus = new EventBus(); let n = 0; const off = bus.subscribe('conversationTurnCompleted', () => n++);
  bus.publish(turn); off(); bus.publish(turn); assert.equal(n, 1);
});
test('payload sai schema bị bỏ qua, không throw', () => {
  const bus = new EventBus(); let n = 0; bus.subscribe('profileUpdated', () => n++);
  assert.equal(bus.publish({ type: 'profileUpdated', payload: { profileVersion: 'x' } }), false);
  assert.equal(bus.publish({ type: 'unknown', payload: {} }), false);
  assert.equal(bus.publish(null), false); assert.equal(n, 0);
});
test('handler lỗi không chặn handler khác', () => {
  const bus = new EventBus(); let ok = 0;
  bus.subscribe('conversationTurnCompleted', () => { throw new Error('boom'); });
  bus.subscribe('conversationTurnCompleted', () => ok++);
  bus.publish(turn); assert.equal(ok, 1);
});
test('scenarioStatusChanged: status phải hợp lệ', () => {
  const bus = new EventBus();
  assert.ok(bus.publish({ type: 'scenarioStatusChanged', payload: { scenarioId: 'renting', status: 'done' } }));
  assert.equal(bus.publish({ type: 'scenarioStatusChanged', payload: { scenarioId: 'renting', status: 'finished' } }), false);
});
