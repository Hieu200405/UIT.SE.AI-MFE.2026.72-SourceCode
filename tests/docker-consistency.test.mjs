// Docker không chạy được trong môi trường phát triển này → kiểm tra nhất quán giữa Dockerfile, docker-compose.yml, .env.example, mã nguồn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const df = readFileSync('Dockerfile', 'utf8'), compose = readFileSync('docker-compose.yml', 'utf8');
const envEx = readFileSync('.env.example', 'utf8'), ignore = readFileSync('.dockerignore', 'utf8').split('\n').map((l) => l.trim());
const envKeys = new Set([...envEx.matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]));
const stages = new Set([...df.matchAll(/^FROM .* AS ([\w-]+)$/gm)].map((m) => m[1]));
// tách compose thành các service (khối thụt 2 dấu cách dưới `services:`)
const svcBlock = (name) => compose.match(new RegExp(`^  ${name}:\\n((?:    .*\\n|\\n)+)`, 'm'))?.[1] ?? '';
const SERVICES = { facade: 4000, 'chat-remote': 3001, 'progress-remote': 3002, 'personalization-remote': 3003, host: 3000 };

test('mỗi `target:` trong compose là một stage có thật trong Dockerfile', () => {
  for (const name of Object.keys(SERVICES)) { assert.ok(stages.has(name), `thiếu stage ${name}`); assert.match(svcBlock(name), new RegExp(`target: ${name}\\b`), `service ${name} phải build target ${name}`); }
});
test('cổng: compose, EXPOSE/CMD trong Dockerfile và healthcheck khớp nhau', () => {
  for (const [name, port] of Object.entries(SERVICES)) {
    const blk = svcBlock(name);
    assert.match(blk, new RegExp(`ports: \\["${port}:${port}"\\]`), `${name}: ports`);
    assert.match(blk, new RegExp(`localhost:${port}/`), `${name}: healthcheck đúng cổng`);
    const stage = df.split(/^FROM /m).find((s) => s.includes(` AS ${name}\n`)) ?? '';
    assert.match(stage, new RegExp(`EXPOSE ${port}\\b`), `${name}: EXPOSE`);
    if (name !== 'facade') assert.match(stage, new RegExp(`${name}=${port}`), `${name}: CMD phục vụ đúng cổng`);
  }
});
test('mọi ${BIẾN} dùng trong compose đều có trong .env.example', () => {
  const used = [...compose.matchAll(/\$\{([A-Z0-9_]+)/g)].map((m) => m[1]);
  assert.ok(used.length > 10);
  assert.deepEqual([...new Set(used)].filter((v) => !envKeys.has(v)), []);
});
test('biến mà gen-config.cjs đọc đều được truyền cho service host; biến mà Facade main.ts đọc đều được tài liệu hóa', () => {
  const gen = readFileSync('scripts/gen-config.cjs', 'utf8');
  const genVars = [...new Set([...gen.matchAll(/\b([A-Z_]+_URL):/g)].map((m) => m[1]))];
  assert.ok(genVars.length >= 4);
  for (const v of genVars) assert.match(svcBlock('host'), new RegExp(`^\\s+${v}:`, 'm'), `host thiếu ${v}`);
  const main = readFileSync('packages/ai-service-facade/src/main.ts', 'utf8');
  const used = [...new Set([...main.matchAll(/env\.([A-Z0-9_]+)/g)].map((m) => m[1]))].filter((v) => v !== 'FACADE_DELAY_SCALE' && v !== 'PORT');
  assert.deepEqual(used.filter((v) => !envKeys.has(v)), [], 'biến Facade chưa có trong .env.example');
  for (const v of used.filter((v) => v !== 'FACADE_DB')) assert.match(svcBlock('facade'), new RegExp(`^\\s+${v}:`, 'm'), `facade compose thiếu ${v}`);
});
test('mọi đường dẫn COPY nguồn (không phải --from) trong Dockerfile đều tồn tại và không bị .dockerignore loại', () => {
  const srcs = [...df.matchAll(/^COPY (?!--from)(?:--chown=\S+ )?(.+?) (?:\.\/|\.\/\S*|\.)\S*$/gm)].flatMap((m) => m[1].split(/\s+/));
  assert.ok(srcs.length >= 5);
  for (const s of srcs) { const p = s.replace(/^\.\//, ''); if (p === '.') continue; assert.ok(existsSync(p), `không tồn tại: ${p}`); assert.ok(!ignore.includes(p), `${p} bị .dockerignore loại`); }
  for (const needed of ['scripts', 'packages', 'apps', 'package-lock.json']) assert.ok(!ignore.includes(needed), `.dockerignore không được loại ${needed}`);
});
test('.env.example: URL mặc định khớp apps/host/config.default.json; khóa API để trống (không commit bí mật)', () => {
  const cfg = JSON.parse(readFileSync('apps/host/config.default.json', 'utf8'));
  const get = (k) => envEx.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].split('#')[0].trim();
  assert.equal(get('FACADE_PUBLIC_URL'), cfg.facadeUrl); assert.equal(get('REMOTE_CHAT_URL'), cfg.remotes.chat);
  assert.equal(get('REMOTE_PROGRESS_URL'), cfg.remotes.progress); assert.equal(get('REMOTE_PERSONALIZATION_URL'), cfg.remotes.personalization);
  assert.equal(get('LLM_API_KEY'), '', 'LLM_API_KEY phải để trống trong .env.example');
  assert.ok(readFileSync('.gitignore', 'utf8').split('\n').includes('.env'));
});
test('container không chạy bằng root (USER node) và Facade lưu dữ liệu ở volume', () => {
  assert.ok((df.match(/^USER node$/gm) ?? []).length >= 2);
  assert.match(svcBlock('facade'), /facade-data:\/data/); assert.match(df, /FACADE_DB=\/data\/facade\.db/);
});
