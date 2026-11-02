// Chạy toàn bộ hệ thống cục bộ: Host+3 Remote (tĩnh) + Facade mock. Cần `npm run poc:build` trước.
const { spawn } = require('node:child_process');
const kids = [
  spawn('node', ['scripts/poc-serve.cjs', 'host=3000', 'chat-remote=3001', 'progress-remote=3002', 'personalization-remote=3003'], { stdio: 'inherit' }),
  spawn('node', ['--experimental-strip-types', '--no-warnings', 'packages/ai-service-facade/src/main.ts'], { stdio: 'inherit', env: { ...process.env, PORT: '4000', FACADE_DEV: '1' } }),
];
const stop = () => { kids.forEach((k) => k.kill()); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
console.log('\nMở http://localhost:3000  (Ctrl+C để dừng)');
