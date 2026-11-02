// Dựng lại đúng cấu trúc thư mục của từng image trong thư mục tạm (không có node_modules gốc) rồi chạy thật.
// Bắt lỗi "thiếu file trong image" mà không cần Docker. Cần `npm run poc:build` trước. KHÔNG kiểm chứng: base image, USER/quyền, mạng Docker.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const procs = [], dirs = [];
after(() => { procs.forEach((p) => p.kill()); dirs.forEach((d) => rmSync(d, { recursive: true, force: true })); });
const freePort = () => new Promise((res) => { const s = createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'img-')); dirs.push(d); return d; };
const waitUp = async (url, init) => { for (let i = 0; i < 60; i++) { try { const r = await fetch(url, init); if (r.status < 500) return; } catch {} await new Promise((r) => setTimeout(r, 100)); } throw new Error('không khởi động: ' + url); };
const start = (cmd, args, opts) => { const p = spawn(cmd, args, { stdio: 'ignore', ...opts }); procs.push(p); return p; };
const needDist = (app) => assert.ok(existsSync(`apps/${app}/dist/index.html`), `thiếu apps/${app}/dist – chạy npm run poc:build trước`);

test('image host: scripts + dist, gen-config sinh config.json từ biến môi trường rồi phục vụ (cả SPA fallback)', async () => {
  needDist('host'); const d = tmp(), port = await freePort();
  mkdirSync(join(d, 'scripts')); mkdirSync(join(d, 'apps/host'), { recursive: true });
  for (const f of ['poc-serve.cjs', 'gen-config.cjs']) cpSync(`scripts/${f}`, join(d, 'scripts', f));
  cpSync('apps/host/dist', join(d, 'apps/host/dist'), { recursive: true });
  rmSync(join(d, 'apps/host/dist/config.json'));                                  // image thật không chứa config; nó được sinh lúc khởi động
  start('sh', ['-c', `node scripts/gen-config.cjs && node scripts/poc-serve.cjs host=${port}`], { cwd: d, env: { PATH: process.env.PATH, FACADE_PUBLIC_URL: 'https://api.demo.dev', REMOTE_CHAT_URL: 'https://chat.demo.dev/remoteEntry.js' } });
  await waitUp(`http://localhost:${port}/config.json`);
  const cfg = await (await fetch(`http://localhost:${port}/config.json`)).json();
  assert.equal(cfg.facadeUrl, 'https://api.demo.dev'); assert.equal(cfg.remotes.chat, 'https://chat.demo.dev/remoteEntry.js'); assert.equal(cfg.remotes.progress, 'http://localhost:3002/remoteEntry.js');
  assert.equal((await fetch(`http://localhost:${port}/config.json`)).headers.get('cache-control'), 'no-store');
  assert.match(await (await fetch(`http://localhost:${port}/progress`)).text(), /<div id="root">/);   // refresh trực tiếp route con
  assert.equal((await fetch(`http://localhost:${port}/main.js`)).status, 200);
});
test('image host: biến URL sai → tiến trình thoát mã 1, KHÔNG phục vụ với cấu hình sai', () => {
  const d = tmp(); mkdirSync(join(d, 'scripts')); mkdirSync(join(d, 'apps/host/dist'), { recursive: true });
  for (const f of ['poc-serve.cjs', 'gen-config.cjs']) cpSync(`scripts/${f}`, join(d, 'scripts', f));
  const r = spawnSync('sh', ['-c', 'node scripts/gen-config.cjs && node scripts/poc-serve.cjs host=1'], { cwd: d, env: { PATH: process.env.PATH, REMOTE_CHAT_URL: 'javascript:alert(1)' }, encoding: 'utf8', timeout: 5000 });
  assert.equal(r.status, 1); assert.ok(r.stderr.includes('REMOTE_CHAT_URL'));
});
for (const app of ['chat-remote', 'progress-remote', 'personalization-remote']) {
  test(`image ${app}: chỉ scripts/poc-serve.cjs + dist riêng, phục vụ remoteEntry.js kèm CORS`, async () => {
    needDist(app); const d = tmp(), port = await freePort();
    mkdirSync(join(d, 'scripts')); mkdirSync(join(d, 'apps', app), { recursive: true });
    cpSync('scripts/poc-serve.cjs', join(d, 'scripts/poc-serve.cjs')); cpSync(`apps/${app}/dist`, join(d, 'apps', app, 'dist'), { recursive: true });
    start('node', ['scripts/poc-serve.cjs', `${app}=${port}`], { cwd: d });
    await waitUp(`http://localhost:${port}/remoteEntry.js`);
    const r = await fetch(`http://localhost:${port}/remoteEntry.js`);
    assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), '*');
  });
}
test('image facade: chỉ thư mục packages + symlink @app/shared-types (KHÔNG có node_modules gốc) vẫn chạy; dữ liệu lưu bền ở /data', async () => {
  const d = tmp(), port = await freePort();
  cpSync('packages', join(d, 'packages'), { recursive: true, filter: (s) => !s.includes('node_modules') });
  mkdirSync(join(d, 'node_modules/@app'), { recursive: true }); symlinkSync('../../packages/shared-types', join(d, 'node_modules/@app/shared-types'));
  mkdirSync(join(d, 'data'));
  const env = { PATH: process.env.PATH, PORT: String(port), FACADE_DB: join(d, 'data/facade.db'), CORS_ORIGIN: 'https://app.demo.dev' };
  start('node', ['--experimental-strip-types', '--no-warnings', 'packages/ai-service-facade/src/main.ts'], { cwd: d, env });
  await waitUp(`http://localhost:${port}/health`);
  const h = await (await fetch(`http://localhost:${port}/health`)).json(); assert.deepEqual(h, { ok: true, dev: false, mode: 'mock' });
  const id = { 'x-anonymous-id': 'layout-user-12345' };
  const sc = await (await fetch(`http://localhost:${port}/scenarios`, { headers: id })).json(); assert.equal(sc.scenarios.length, 8);
  const res = await fetch(`http://localhost:${port}/chat/stream`, { method: 'POST', headers: { ...id, 'content-type': 'application/json' }, body: JSON.stringify({ requestId: 'r1', scenarioId: 'renting', kind: 'message', message: 'Bạn ơi, tiền điện bao nhiêu?' }) });
  const body = await res.text(); assert.ok(body.includes('Bác ơi, tiền điện bao nhiêu ạ?') && body.includes('event: done'));
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://app.demo.dev');
  assert.ok(existsSync(join(d, 'data/facade.db')), 'SQLite phải tạo file ở FACADE_DB');
});
