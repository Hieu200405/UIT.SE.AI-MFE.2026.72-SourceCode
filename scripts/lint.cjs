// Project architecture lint using the already approved TypeScript parser.
// Type correctness is checked separately by `npm run typecheck`.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const roots = ['apps/host/src', 'apps/chat-remote/src', 'apps/progress-remote/src', 'apps/personalization-remote/src', 'apps/mobile/src', 'apps/mobile/app', 'packages'];
const skip = new Set(['node_modules', 'dist', 'test', '__tests__', 'data']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && !skip.has(entry.name)) walk(file);
    else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(file)) files.push(file);
  }
}
roots.forEach(walk);
let failures = 0;
for (const file of files) {
  const normalized = file.replaceAll('\\', '/');
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const owner = normalized.match(/^apps\/([^/]+-remote)\//)?.[1];
  const facade = normalized.startsWith('packages/ai-service-facade/');
  function report(node, message) {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    console.error(`${normalized}:${line + 1}: ${message}`); failures++;
  }
  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require')) specifier = node.arguments[0];
    if (specifier && ts.isStringLiteralLike(specifier)) {
      const name = specifier.text;
      if (owner && /(?:chat|progress|personalization)-remote/.test(name) && !name.includes(owner)) report(node, 'Remote must communicate through Facade/event bus, not import another Remote.');
      if (!facade && /^(?:openai|@anthropic-ai\/sdk|@google\/generative-ai|expo-speech)(?:\/|$)/.test(name)) report(node, 'AI/Speech provider access belongs in ai-service-facade.');
    }
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'dangerouslySetInnerHTML') report(node, 'Render AI data through the closed UI registry.');
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && ['innerHTML', 'outerHTML'].includes(node.left.name.text)) report(node, 'Arbitrary HTML assignment is forbidden.');
    if (!facade && ts.isIdentifier(node) && ['speechSynthesis', 'SpeechRecognition', 'webkitSpeechRecognition', 'SpeechSynthesisUtterance'].includes(node.text)) report(node, 'Speech access belongs in ai-service-facade.');
    if (!facade && ts.isStringLiteralLike(node) && /^https?:\/\/[^/]*(?:openai\.com|anthropic\.com|groq\.com)(?:\/|$)/i.test(node.text)) report(node, 'LLM provider URLs belong in ai-service-facade.');
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (failures) process.exitCode = 1;
else console.log(`Architecture lint passed (${files.length} source files). CSS isolation runs separately.`);
