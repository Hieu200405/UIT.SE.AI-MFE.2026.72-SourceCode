// Sinh apps/host/dist/config.json từ biến môi trường (chạy lúc khởi động container Host).
// Dùng: node scripts/gen-config.cjs [đường-dẫn-ra]. Sai URL → thoát mã 1 (fail fast, không chạy với cấu hình sai).
const fs = require('node:fs'); const path = require('node:path');
const env = process.env;
const DEFAULTS = { FACADE_PUBLIC_URL: 'http://localhost:4000', REMOTE_CHAT_URL: 'http://localhost:3001/remoteEntry.js',
  REMOTE_PROGRESS_URL: 'http://localhost:3002/remoteEntry.js', REMOTE_PERSONALIZATION_URL: 'http://localhost:3003/remoteEntry.js' };
const val = (k) => (env[k] && env[k].trim()) || DEFAULTS[k];
const bad = [];
for (const k of Object.keys(DEFAULTS)) { try { const u = new URL(val(k)); if (!/^https?:$/.test(u.protocol)) throw 0; } catch { bad.push(k); } }
if (bad.length) { console.error('Biến môi trường không phải URL http(s) hợp lệ: ' + bad.join(', ')); process.exit(1); }
const out = process.argv[2] || path.resolve(__dirname, '..', 'apps', 'host', 'dist', 'config.json');
const cfg = { facadeUrl: val('FACADE_PUBLIC_URL'), remotes: { chat: val('REMOTE_CHAT_URL'), progress: val('REMOTE_PROGRESS_URL'), personalization: val('REMOTE_PERSONALIZATION_URL') } };
fs.writeFileSync(out, JSON.stringify(cfg, null, 2) + '\n');
console.log('config.json ->', out);
