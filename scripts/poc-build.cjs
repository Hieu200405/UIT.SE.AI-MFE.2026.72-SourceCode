const webpack = require('webpack');
const fs = require('node:fs');
const path = require('node:path');
const apps = ['host', 'chat-remote', 'progress-remote', 'personalization-remote'];
let failed = false;
(async () => {
  for (const a of apps) {
    const cfg = require(path.resolve(__dirname, '..', 'apps', a, 'webpack.config.cjs'));
    await new Promise((res) => webpack(cfg, (err, stats) => {
      if (err || stats.hasErrors()) { failed = true; console.error(a, 'FAILED', err || stats.toString({ all: false, errors: true })); }
      else {
        fs.copyFileSync(path.resolve(__dirname, '..', 'apps', a, 'index.html'), path.join(cfg.output.path, 'index.html'));
        if (a === 'host') fs.copyFileSync(path.resolve(__dirname, '..', 'apps', 'host', 'config.default.json'), path.join(cfg.output.path, 'config.json')); // cấu hình mặc định cho dev
        console.log(a, 'ok');
      }
      res();
    }));
  }
  process.exit(failed ? 1 : 0);
})();
