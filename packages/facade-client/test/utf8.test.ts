import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Utf8StreamDecoder, createFacadeClient, getAnonymousIdAsync } from '../src/index.ts';
import { formatSseEvent } from '@app/shared-types';
import type { StreamEvent } from '@app/shared-types';

const enc = new TextEncoder();
const decodeAll = (bytes: Uint8Array, cuts: number[]) => { const d = new Utf8StreamDecoder(); let out = ''; let prev = 0;
  for (const c of [...cuts, bytes.length]) { out += d.decode(bytes.slice(prev, c)); prev = c; } return out + d.flush(); };

const SAMPLES = ['Điện ba nghìn rưỡi một số. Cháu đặt cọc một tháng nhé?', 'Bác ơi, tiền điện bao nhiêu ạ?', 'ASCII only', 'Xin chào 👋 世界 ñ', '', 'ở ợ ẫ ự'];

test('Utf8StreamDecoder: kết quả y hệt chuỗi gốc với MỌI điểm cắt một và hai chỗ (tiếng Việt, emoji, CJK)', () => {
  for (const s of SAMPLES) {
    const b = enc.encode(s);
    for (let i = 0; i <= b.length; i++) {
      assert.equal(decodeAll(b, [i]), s, `cắt tại ${i}: ${s}`);
      for (let j = i; j <= b.length; j += 3) assert.equal(decodeAll(b, [i, j]), s);
    }
    const byByte = [...Array(b.length).keys()].slice(1); assert.equal(decodeAll(b, byByte), s, 'từng byte một');
  }
});
test('Utf8StreamDecoder: byte sai/cụt thành U+FFFD giống TextDecoder (không throw)', () => {
  const td = new TextDecoder();
  for (const raw of [[0xff, 0x41], [0xc3], [0xe1, 0xbb], [0x80, 0x41], [0xe1, 0x41, 0x42], [0xf0, 0x9f, 0x98]]) {
    const u = Uint8Array.from(raw); assert.equal(decodeAll(u, []), td.decode(u), JSON.stringify(raw));
  }
});
test('streamChat: chữ tiếng Việt bị cắt giữa ký tự ở ranh giới chunk vẫn nguyên vẹn (rủi ro TextDecoder trên native)', async () => {
  const ev: StreamEvent[] = [{ type: 'text_delta', requestId: 'r', partId: 'p', text: 'Điện ba nghìn rưỡi, cháu đặt cọc nhé?' }, { type: 'done', requestId: 'r' }];
  const wire = enc.encode(ev.map(formatSseEvent).join(''));
  const body = new ReadableStream<Uint8Array>({ start(c) { for (let i = 0; i < wire.length; i += 5) c.enqueue(wire.slice(i, i + 5)); c.close(); } }); // 5 byte/chunk: cắt giữa ký tự 2–3 byte
  const client = createFacadeClient({ baseUrl: 'http://x', anonymousId: 'test-user-12345', fetchImpl: async () => new Response(body) });
  const got: StreamEvent[] = []; const outcome = await client.streamChat({ requestId: 'r', scenarioId: 'renting', kind: 'open' }, { onEvent: (e) => got.push(e) });
  assert.equal(outcome, 'done'); assert.equal((got[0] as any).text, 'Điện ba nghìn rưỡi, cháu đặt cọc nhé?');
});
test('getAnonymousIdAsync: tạo và lưu ID; dùng lại ID hợp lệ; ID hỏng bị thay; lưu lỗi vẫn trả ID', async () => {
  const mem = new Map<string, string>(); const kv = { getItem: async (k: string) => mem.get(k) ?? null, setItem: async (k: string, v: string) => void mem.set(k, v) };
  const a = await getAnonymousIdAsync(kv); assert.match(a, /^[\w-]{8,64}$/); assert.equal(await getAnonymousIdAsync(kv), a);
  mem.set('anonymousId', 'x'); assert.notEqual(await getAnonymousIdAsync(kv), 'x');
  const broken = { getItem: async () => { throw new Error('io'); }, setItem: async () => { throw new Error('io'); } };
  assert.match(await getAnonymousIdAsync(broken), /^[\w-]{8,64}$/);
});
