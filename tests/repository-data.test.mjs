import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// These are source fixtures, not runtime database files. A local-only copy
// makes every fresh checkout fail even when tests pass on the author's machine.
for (const [file, key] of [
  ['packages/rules-xung-ho/data/rules.json', 'rules'],
  ['packages/ai-service-facade/data/scenarios.json', 'scenarios'],
]) {
  test(`source catalog is present and eligible for Git: ${file}`, () => {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    assert.ok(Array.isArray(data[key]) && data[key].length > 0);
    const result = spawnSync('git', ['check-ignore', '--no-index', '--quiet', file]);
    assert.equal(result.status, 1, `${file} must not be ignored (git required)`);
  });
}

test('runtime databases and the local environment remain ignored', () => {
  // Check path rules only; never open environment files or databases.
  for (const file of ['.env', 'data/facade.db', 'data/facade.db-wal']) {
    assert.equal(spawnSync('git', ['check-ignore', '--quiet', file]).status, 0);
  }
});
