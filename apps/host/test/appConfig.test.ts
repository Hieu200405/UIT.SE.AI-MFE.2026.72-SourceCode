import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, loadAppConfig, parseAppConfig } from '../src/appConfig.ts';

const ok = { facadeUrl: 'https://api.example.com/', remotes: { chat: 'https://chat.example.com/remoteEntry.js', progress: 'https://p.example.com/remoteEntry.js', personalization: 'https://u.example.com/remoteEntry.js' } };

test('config hợp lệ: giữ nguyên, bỏ dấu "/" cuối của facadeUrl, không có lỗi', () => {
  const r = parseAppConfig(ok);
  assert.deepEqual(r.errors, []); assert.equal(r.config.facadeUrl, 'https://api.example.com'); assert.equal(r.config.remotes.chat, 'https://chat.example.com/remoteEntry.js');
});
test('chặn scheme nguy hiểm (javascript:, data:, file:) – URL Remote quyết định mã nào được nạp', () => {
  for (const bad of ['javascript:alert(1)', 'data:text/javascript,alert(1)', 'file:///etc/passwd', '//evil.com/remoteEntry.js', 'not a url']) {
    const r = parseAppConfig({ ...ok, remotes: { ...ok.remotes, chat: bad } });
    assert.equal(r.config.remotes.chat, DEFAULT_CONFIG.remotes.chat, bad); assert.ok(r.errors.some((e) => e.startsWith('remotes.chat')), bad);
  }
});
test('Remote phải trỏ tới file .js', () => {
  const r = parseAppConfig({ ...ok, remotes: { ...ok.remotes, progress: 'https://p.example.com/' } });
  assert.ok(r.errors[0].includes('remotes.progress'));
});
test('thiếu trường → dùng mặc định cho trường đó và BÁO LỖI (tránh trỏ nhầm localhost khi deploy)', () => {
  const r = parseAppConfig({ facadeUrl: ok.facadeUrl, remotes: { chat: ok.remotes.chat } });
  assert.deepEqual(r.errors, ['remotes.progress: missing', 'remotes.personalization: missing']);
  assert.equal(r.config.remotes.chat, ok.remotes.chat); assert.equal(r.config.remotes.progress, DEFAULT_CONFIG.remotes.progress);
});
test('không phải object / null / mảng → toàn bộ mặc định + lỗi, không throw', () => {
  for (const raw of [null, 'x', [], 42, undefined]) { const r = parseAppConfig(raw); assert.ok(r.errors.length > 0); assert.deepEqual(r.config, DEFAULT_CONFIG); }
});
test('loadAppConfig: 404, lỗi mạng, JSON hỏng đều không throw; 200 hợp lệ → dùng config', async () => {
  assert.ok((await loadAppConfig(async () => new Response('', { status: 404 }))).errors[0].includes('404'));
  assert.ok((await loadAppConfig(async () => { throw new Error('offline'); })).errors[0].includes('could not be loaded'));
  assert.ok((await loadAppConfig(async () => new Response('{hỏng', { status: 200 }))).errors.length === 1);
  const good = await loadAppConfig(async (_u, init) => { assert.equal((init as RequestInit).cache, 'no-store'); return new Response(JSON.stringify(ok)); });
  assert.deepEqual(good.errors, []); assert.equal(good.config.facadeUrl, 'https://api.example.com');
});
