import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import type http from 'node:http';
import type { Scenario, StreamEvent } from '@app/shared-types';
import { createFacadeClient, StreamTimeoutError, FacadeError } from '@app/facade-client';
import { createFacade } from '../src/server.ts';
import { detectAddressCorrection } from '../src/mock-llm.ts';
import { computeConfidence } from '../src/progress.ts';
import { translateLearnerMessage } from '../src/scripts.ts';
import { resolveAddressTerms } from '../../rules-xung-ho/src/index.ts';
import { loadRules } from '../../rules-xung-ho/src/load-node.ts';

const scenarios: Scenario[] = JSON.parse(readFileSync(new URL('../data/scenarios.json', import.meta.url), 'utf-8')).scenarios;
const rules = loadRules();
let server: http.Server; let devServer: http.Server; let devBase = ''; let base = ''; let n = 0;
before(async () => { devServer = createFacade({ scenarios, rules, delayScale: 0, dev: true }); await new Promise<void>((r) => devServer.listen(0, r)); devBase = `http://localhost:${(devServer.address() as AddressInfo).port}`;
  server = createFacade({ scenarios, rules, delayScale: 0 }); await new Promise<void>((r) => server.listen(0, r)); base = `http://localhost:${(server.address() as AddressInfo).port}`; });
after(() => { for (const x of [server, devServer]) { x.closeAllConnections?.(); x.close(); } });

const user = () => createFacadeClient({ baseUrl: base, anonymousId: `test-user-${++n}-abcdef` });
const devUser = () => createFacadeClient({ baseUrl: devBase, anonymousId: `dev-user-${++n}-abcdef` });
const run = async (c: ReturnType<typeof user>, req: Parameters<typeof c.streamChat>[0], opts: { idleTimeoutMs?: number; signal?: AbortSignal } = {}) => {
  const events: StreamEvent[] = []; const outcome = await c.streamChat(req, { onEvent: (e) => events.push(e), ...opts }); return { events, outcome };
};
const msg = (text: string, id = 'r' + ++n) => ({ requestId: id, scenarioId: 'renting', kind: 'message' as const, message: text });

test('GET /scenarios trả 8 tình huống; thiếu anonymous id → 400', async () => {
  assert.equal((await user().getScenarios()).length, 8);
  assert.equal((await fetch(base + '/scenarios')).status, 400);
});
test('wireframe: "Bạn ơi, tiền điện bao nhiêu?" → thẻ Address, trả lời có bản dịch, ghi chú văn hóa "Sample", done', async () => {
  const { events, outcome } = await run(user(), msg('Bạn ơi, tiền điện bao nhiêu?'));
  assert.equal(outcome, 'done');
  const card = events.find((e) => e.type === 'ui_card' && e.card.type === 'address') as any;
  assert.equal(card.card.data.suggestedText, 'Bác ơi, tiền điện bao nhiêu ạ?');
  assert.deepEqual(card.card.data.suggestedTerms, { call: 'bác', self: 'cháu' });
  const text = events.filter((e) => e.type === 'text_delta').map((e: any) => e.text).join('');
  assert.equal(text, 'Điện ba nghìn rưỡi một số. Cháu đặt cọc một tháng nhé?');
  assert.ok(events.some((e: any) => e.type === 'text_delta' && e.translation?.includes('3,500')));
  const note = events.find((e) => e.type === 'ui_card' && e.card.type === 'cultural_note') as any;
  assert.equal(note.card.data.verified, false);
  assert.equal(events.at(-1)?.type, 'done');
  assert.ok(events.every((e) => e.requestId === events[0].requestId));
});
test('đã dùng đúng "Bác ơi…" → không có thẻ sửa lỗi', async () => {
  const { events } = await run(user(), msg('Bác ơi, tiền điện bao nhiêu ạ?'));
  assert.ok(!events.some((e) => e.type === 'ui_card' && e.card.type === 'address'));
});
test('opening: không tính lượt; hint: reply_suggestion 2 gợi ý có translation', async () => {
  const c = user();
  const open = await run(c, { requestId: 'o1', scenarioId: 'renting', kind: 'open' });
  assert.equal(open.outcome, 'done');
  assert.equal((await c.getProgress()).scenarios.find((s) => s.scenarioId === 'renting')!.status, 'new');
  const hint = await run(c, { requestId: 'h1', scenarioId: 'renting', kind: 'hint' });
  const card = hint.events.find((e) => e.type === 'ui_card') as any;
  assert.equal(card.card.type, 'reply_suggestion'); assert.equal(card.card.data.suggestions.length, 2);
});
test('thiếu hoàn toàn ngữ cảnh (TC-XH-15) → needs_clarification, không done, không tính lượt', async () => {
  const c = user();
  const { events, outcome } = await run(c, msg('Tôi muốn hỏi người đó nên gọi thế nào'));
  assert.equal(outcome, 'clarifying');
  const e = events[0] as any;
  assert.equal(e.type, 'needs_clarification');
  assert.equal(e.question, 'Người đó khoảng tuổi nào so với bạn và hai người đang ở trong tình huống nào?');
  assert.equal((await c.getProgress()).totals.turns, 0);
});
test('ngoài chế độ dev, "/error" và "/timeout" chỉ là tin nhắn bình thường', async () => {
  for (const t of ['/error', '/timeout']) { const r = await run(user(), msg(t), { idleTimeoutMs: 2000 }); assert.equal(r.outcome, 'done'); }
});
test('/error (dev) → sự kiện error có cấu trúc (retryable), không lộ stack trace', async () => {
  const { events, outcome } = await run(devUser(), msg('/error'));
  assert.equal(outcome, 'error');
  const err = events.at(-1) as any;
  assert.equal(err.error.retryable, true); assert.ok(!JSON.stringify(err).includes('at '));
});
test('/timeout (dev) → client báo StreamTimeoutError sau idle timeout', async () => {
  await assert.rejects(run(devUser(), msg('/timeout'), { idleTimeoutMs: 300 }), (e: unknown) => e instanceof StreamTimeoutError);
});
test('hủy giữa chừng → outcome "aborted", server không tính lượt', async () => {
  const slow = createFacade({ scenarios, rules, delayScale: 2 }); await new Promise<void>((r) => slow.listen(0, r));
  const c = createFacadeClient({ baseUrl: `http://localhost:${(slow.address() as AddressInfo).port}`, anonymousId: 'abort-user-123456' });
  const ac = new AbortController(); const got: StreamEvent[] = [];
  const p = c.streamChat(msg('Bạn ơi, tiền điện bao nhiêu?'), { onEvent: (e) => { got.push(e); if (got.length === 2) ac.abort(); }, signal: ac.signal });
  assert.equal(await p, 'aborted');
  await new Promise((r) => setTimeout(r, 400));
  assert.equal((await c.getProgress()).totals.turns, 0);
  slow.closeAllConnections?.(); slow.close();
});
test('mất kết nối trước khi done → FacadeError retryable', async () => {
  const c = createFacadeClient({ baseUrl: base, anonymousId: 'fake-user-1234567', fetchImpl: async () =>
    new Response(new ReadableStream({ start(ctl) { ctl.enqueue(new TextEncoder().encode('event: text_delta\ndata: {"type":"text_delta","requestId":"r","partId":"p","text":"Xin "}\n\n')); ctl.close(); } })) });
  await assert.rejects(run(c, msg('xin chào')), (e: unknown) => e instanceof FacadeError && e.retryable);
});
test('tiến độ: new → in_progress → done (tự đánh dấu); bỏ khỏi gợi ý; chỉ đánh dấu sau ≥ 1 lượt', async () => {
  const c = user();
  await assert.rejects(c.setScenarioDone('renting', true), (e: any) => e.status === 409);
  await run(c, msg('Bác ơi, tiền điện bao nhiêu ạ?'));
  let p = await c.getProgress();
  assert.equal(p.scenarios.find((s) => s.scenarioId === 'renting')!.status, 'in_progress');
  assert.deepEqual(p.recommended, ['renting', 'neighbors']); // đúng như wireframe (hồ sơ mặc định: settling)
  p = await c.setScenarioDone('renting', true);
  assert.equal(p.scenarios.find((s) => s.scenarioId === 'renting')!.status, 'done');
  assert.ok(!p.recommended.includes('renting'));
  p = await c.setScenarioDone('renting', false);
  assert.equal(p.scenarios.find((s) => s.scenarioId === 'renting')!.status, 'in_progress');
});
test('thống kê lỗi xưng hô được cộng khi lượt hoàn tất', async () => {
  const c = user(); await run(c, msg('Bạn ơi, tiền điện bao nhiêu?')); await run(c, msg('Bạn ơi, cọc bao nhiêu?'));
  assert.deepEqual((await c.getProgress()).totals, { turns: 2, addressingErrors: 2 });
});
test('profile: lưu theo anonymous id; dữ liệu sai bị từ chối; tuổi đổi → xưng hô đổi', async () => {
  const c = user(); const p = await c.getProfile();
  assert.equal(p.age, 28);
  await c.putProfile({ ...p, age: 70, gender: 'female' });
  assert.equal((await c.getProfile()).age, 70);
  assert.equal((await user().getProfile()).age, 28);
  await assert.rejects(c.putProfile({ ...p, age: 'x' as any }), (e: any) => e.status === 400);
  const { events } = await run(c, msg('Bạn ơi, tiền điện bao nhiêu?')); // người học 70, chủ nhà ~60 → không còn "much_older"
  const card = events.find((e) => e.type === 'ui_card' && e.card.type === 'address') as any;
  assert.notEqual(card?.card.data.suggestedTerms.call, 'bác');
});
test('detectAddressCorrection: bạn giữa câu → thay tại chỗ; call term là "bạn" thì không sửa', () => {
  const r = resolveAddressTerms({ learner: { age: 28 }, counterpart: { gender: 'female', ageRange: 'over50' }, relationship: 'seller' }, rules); // cô/cháu
  assert.equal(detectAddressCorrection('Xin hỏi, bạn bán bao nhiêu?', r)!.suggestedText, 'Xin hỏi, cô bán bao nhiêu ạ?');
  const peer = resolveAddressTerms({ learner: { age: 28 }, counterpart: { gender: 'female', ageRange: '20-35' }, relationship: 'seller' }, rules);
  assert.equal(detectAddressCorrection('Bạn ơi, bao nhiêu?', peer), null);
});
test('CORS: OPTIONS trả header cho phép origin Remote', async () => {
  const r = await fetch(base + '/chat/stream', { method: 'OPTIONS' });
  assert.equal(r.status, 204); assert.ok(r.headers.get('access-control-allow-headers')!.includes('x-anonymous-id'));
});

test('bản dịch tin của người học: câu biết trước có user_translation (đứng trước thẻ); câu lạ thì không', async () => {
  const known = await run(user(), msg('Bạn ơi, tiền điện bao nhiêu?'));
  const i = known.events.findIndex((e) => e.type === 'user_translation');
  assert.equal((known.events[i] as any).translation, 'Hey, how much is the electricity?');
  assert.ok(i < known.events.findIndex((e) => e.type === 'ui_card'));
  const unknown = await run(user(), msg('Xin chào, tôi mới đến'));
  assert.ok(!unknown.events.some((e) => e.type === 'user_translation'));
  assert.equal(translateLearnerMessage('Bác cho cháu xin giấy biên nhận ạ'), 'Could I have a receipt, please?'); // bỏ dấu câu cuối vẫn khớp
});
test('buổi luyện: mỗi lần "open" là buổi mới; buổi không có lượt hoàn tất không nằm trong biểu đồ', async () => {
  const c = user();
  await run(c, { requestId: 'o1', scenarioId: 'renting', kind: 'open' });
  await run(c, msg('Bạn ơi, tiền điện bao nhiêu?'));
  await run(c, msg('Bác ơi, tiền điện bao nhiêu ạ?'));
  await run(c, { requestId: 'o2', scenarioId: 'market', kind: 'open' });           // vào tình huống khác, chưa gửi gì
  await run(c, { requestId: 'o3', scenarioId: 'renting', kind: 'open' });
  await run(c, msg('Bạn ơi, cọc bao nhiêu?'));
  const p = await c.getProgress();
  assert.deepEqual(p.sessions.map((s) => [s.index, s.scenarioId, s.turns, s.addressingErrors]), [[1, 'renting', 2, 1], [2, 'renting', 1, 1]]);
});
test('Confidence: 0 khi chưa luyện; tăng theo độ phủ và độ chính xác (công thức đề xuất)', () => {
  const none = computeConfidence(scenarios, {}, []);
  assert.deepEqual(none, { administrative: 0, daily_life: 0, social: 0 });
  const sessions = (errors: number) => [{ scenarioId: 'banking', startedAt: '', turns: 8, addressingErrors: errors }];
  const st = { banking: 'done' } as any;                       // 1/3 nhóm hành chính đã Done
  const perfect = computeConfidence(scenarios, st, sessions(0)).administrative;   // 100 × (1/3) × 1
  const sloppy = computeConfidence(scenarios, st, sessions(8)).administrative;    // 100 × (1/3) × 0,5
  assert.equal(perfect, 33); assert.equal(sloppy, 17); assert.ok(perfect > sloppy);
  assert.equal(computeConfidence(scenarios, st, sessions(0)).social, 0);          // nhóm khác không bị ảnh hưởng
});
test('/dev/seed: chỉ có khi bật dev; dữ liệu demo giống wireframe (8 buổi, lỗi giảm dần, Banking+Street-food Done)', async () => {
  assert.equal((await fetch(base + '/dev/seed', { method: 'POST', headers: { 'x-anonymous-id': 'seed-user-1234567' } })).status, 404);
  assert.equal(((await (await fetch(devBase + '/health')).json()) as any).dev, true);
  const r = await fetch(devBase + '/dev/seed', { method: 'POST', headers: { 'x-anonymous-id': 'seed-user-1234567' } });
  const p: any = await r.json();
  assert.deepEqual(p.sessions.map((s: any) => s.addressingErrors), [7, 6, 6, 4, 4, 3, 2, 1]);
  const st = Object.fromEntries(p.scenarios.map((s: any) => [s.scenarioId, s.status]));
  assert.equal(st.banking, 'done'); assert.equal(st.street_food, 'done'); assert.equal(st.renting, 'in_progress'); assert.equal(st.market, 'in_progress'); assert.equal(st.neighbors, 'new');
  assert.ok(p.confidence.administrative > 0 && p.confidence.social === 0);
  assert.deepEqual(p.recommended, ['neighbors', 'renting'].sort((a, b) => (a === 'renting' ? -1 : 1))); // đang dở ưu tiên trước
});
