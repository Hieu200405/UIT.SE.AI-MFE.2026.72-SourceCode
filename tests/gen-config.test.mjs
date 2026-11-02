import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (env) => {
  const dir = mkdtempSync(join(tmpdir(), 'cfg-')); const out = join(dir, 'config.json');
  const r = spawnSync('node', ['scripts/gen-config.cjs', out], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
  const json = r.status === 0 ? JSON.parse(readFileSync(out, 'utf8')) : null; rmSync(dir, { recursive: true, force: true });
  return { status: r.status, json, stderr: r.stderr };
};

test('gen-config: không đặt biến → mặc định localhost (khớp config.default.json)', () => {
  const r = run({});
  assert.equal(r.status, 0);
  assert.deepEqual(r.json, JSON.parse(readFileSync('apps/host/config.default.json', 'utf8')));
});
test('gen-config: biến môi trường ghi đè từng URL', () => {
  const r = run({ FACADE_PUBLIC_URL: 'https://api.app.dev', REMOTE_CHAT_URL: 'https://chat.app.dev/remoteEntry.js' });
  assert.equal(r.json.facadeUrl, 'https://api.app.dev'); assert.equal(r.json.remotes.chat, 'https://chat.app.dev/remoteEntry.js');
  assert.equal(r.json.remotes.progress, 'http://localhost:3002/remoteEntry.js');
});
test('gen-config: URL không hợp lệ → thoát mã 1 và nêu tên biến (fail fast)', () => {
  for (const bad of ['javascript:alert(1)', 'chat.app.dev', 'ftp://x/y.js']) {
    const r = run({ REMOTE_CHAT_URL: bad }); assert.equal(r.status, 1, bad); assert.ok(r.stderr.includes('REMOTE_CHAT_URL'), bad);
  }
});
