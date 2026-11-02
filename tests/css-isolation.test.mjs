// Constitution #2: mỗi MFE cô lập style. Biên dịch styles.css của từng app bằng đúng pipeline Tailwind/PostCSS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const build = async (app) => {
  const file = new URL(`../apps/${app}/src/styles.css`, import.meta.url).pathname;
  const out = await postcss([tailwind()]).process(readFileSync(file, 'utf8'), { from: file });
  const selectors = [], vars = new Set(), leaks = [];
  out.root.walkRules((r) => {
    if (r.parent?.type === 'atrule' && /keyframes/.test(r.parent.name)) return; // "from/to/%" không phải selector
    r.selectors.forEach((s) => selectors.push(s));
    // Tailwind v4 sinh `:root`, `*`, `::before` chỉ để khai báo biến CSS (--tw-*, --<prefix>-*).
    // Chấp nhận selector toàn cục NẾU mọi khai báo trong rule đều là biến CSS (không rò rỉ style hiển thị).
    const global = r.selectors.some((s) => !/^\.[\w-]+\\:/.test(s));
    if (global) r.walkDecls((d) => { if (!d.prop.startsWith('--')) leaks.push(`${r.selector} { ${d.prop} }`); });
  });
  out.root.walkDecls((d) => { if (d.prop.startsWith('--')) vars.add(d.prop); });
  return { css: out.css, selectors, vars: [...vars], leaks };
};

for (const [app, prefix] of [['chat-remote', 'chat'], ['progress-remote', 'progress'], ['personalization-remote', 'profile']]) {
  test(`${app}: không preflight, không selector trần, selector toàn cục chỉ chứa biến CSS, class và biến theme có prefix "${prefix}"`, async () => {
    const { css, selectors, vars, leaks } = await build(app);
    assert.ok(css.length > 500, 'có sinh utilities');
    assert.ok(!/button, input|::after, ::before|html, :host/.test(css), 'không chứa preflight');
    assert.deepEqual(leaks, [], 'selector không prefix chứa thuộc tính hiển thị: ' + leaks.slice(0, 5).join(' | '));
    const bare = selectors.filter((s) => /^(html|body|h[1-6]|button|input|a|p|ul|li|div|span)\b/.test(s));
    assert.deepEqual(bare, [], 'selector thẻ trần: ' + bare.join(' | '));
    assert.ok(selectors.filter((s) => s.startsWith('.')).every((s) => s.startsWith(`.${prefix}\\:`)), 'mọi class selector phải có prefix');
    const badVars = vars.filter((v) => !v.startsWith(`--${prefix}-`) && !v.startsWith('--tw-'));
    assert.deepEqual(badVars, [], 'biến CSS không có prefix: ' + badVars.slice(0, 5).join(' | '));
  });
}

test('host: là nơi duy nhất có preflight; utilities có prefix "host"', async () => {
  const { css, selectors } = await build('host');
  assert.ok(/::after, ::before/.test(css), 'Host có preflight');
  const utilities = selectors.filter((s) => s.startsWith('.'));
  assert.ok(utilities.length > 0 && utilities.every((s) => s.startsWith('.host\\:')), 'utilities của Host có prefix');
});

// Class gõ sai (vd. sai thứ tự prefix/variant) bị Tailwind bỏ qua âm thầm → UI mất style mà không báo lỗi.
const sourceFiles = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith('.tsx') ? [p] : []; });
const unescape = (sel) => sel.replace(/\\(.)/g, '$1').replace(/^\./, '');

for (const [app, prefix] of [['host', 'host'], ['chat-remote', 'chat'], ['progress-remote', 'progress'], ['personalization-remote', 'profile']]) {
  test(`${app}: mọi class "${prefix}:…" trong mã nguồn đều được sinh CSS`, async () => {
    const { selectors } = await build(app);
    const generated = selectors.map(unescape);
    const dir = new URL(`../apps/${app}/src`, import.meta.url).pathname;
    const tokens = new Set(sourceFiles(dir).flatMap((f) => readFileSync(f, 'utf8').match(new RegExp(`(?<![\\w-])${prefix}:[^\\s"'\`{}]+`, 'g')) ?? []));
    assert.ok(tokens.size > 5, 'tìm thấy class trong mã nguồn');
    const missing = [...tokens].filter((t) => !generated.some((g) => g === t || g.startsWith(t + ':') || g.startsWith(t + ' ')));
    assert.deepEqual(missing, [], 'class không sinh CSS: ' + missing.join(' '));
  });
}
