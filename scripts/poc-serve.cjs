// Server tĩnh tối giản. Dùng: node scripts/poc-serve.cjs host=3000 chat-remote=3001 ...
// Đường dẫn không có đuôi file => trả index.html (refresh trực tiếp /progress vẫn về entry của Host, Architecture §7).
const http = require('node:http'); const fs = require('node:fs'); const path = require('node:path');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
for (const arg of process.argv.slice(2)) {
  const [app, port] = arg.split('='); const root = path.resolve(__dirname, '..', 'apps', app, 'dist');
  http.createServer((req, res) => {
    let p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (p.endsWith(path.sep)) p += 'index.html';
    if (!path.extname(p) && !fs.existsSync(p)) p = path.join(root, 'index.html');
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*', ...(p.endsWith('config.json') ? { 'Cache-Control': 'no-store' } : {}) });
    fs.createReadStream(p).pipe(res);
  }).listen(Number(port), () => console.log(app, 'http://localhost:' + port));
}
