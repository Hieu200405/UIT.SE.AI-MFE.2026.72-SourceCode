import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Scenario } from '../../shared-types/src/index.ts';
import { resolveAddressTerms } from '../../rules-xung-ho/src/index.ts';
import { loadRules } from '../../rules-xung-ho/src/load-node.ts';
import { deriveScenarioStatus, pickRecommended } from '../src/progress.ts';

const scenarios: Scenario[] = JSON.parse(readFileSync(new URL('../data/scenarios.json', import.meta.url), 'utf-8')).scenarios;
const rules = loadRules();

test('≥ 6 tình huống (Charter), wireframe có 8', () => {
  assert.ok(scenarios.length >= 6);
  assert.equal(scenarios.length, 8);
});
test('id duy nhất; đủ 3 nhóm; mỗi tình huống ≥ 2 mục tiêu', () => {
  assert.equal(new Set(scenarios.map((s) => s.id)).size, scenarios.length);
  for (const g of ['administrative', 'daily_life', 'social']) assert.ok(scenarios.some((s) => s.group === g), g);
  for (const s of scenarios) assert.ok(s.objectives.length >= 2, s.id);
});
test('nhóm khớp màn Progress của wireframe', () => {
  const by = (g: string) => scenarios.filter((s) => s.group === g).map((s) => s.id).sort();
  assert.deepEqual(by('administrative'), ['banking', 'renting', 'visa']);
  assert.deepEqual(by('daily_life'), ['doctor', 'market', 'street_food']);
  assert.deepEqual(by('social'), ['neighbors', 'weddings']);
});
test('nhãn nhân vật khớp wireframe: "Landlord, male, ~60"', () => {
  const c = scenarios.find((s) => s.id === 'renting')!.character;
  assert.equal(`${c.roleLabel}, ${c.gender}, ~${c.ageApprox}`, 'Landlord, male, ~60');
});
test('ageRange nhất quán với ageApprox', () => {
  for (const { id, character: c } of scenarios) {
    const r = c.ageApprox < 20 ? 'under20' : c.ageApprox <= 35 ? '20-35' : c.ageApprox <= 50 ? '35-50' : 'over50';
    assert.equal(c.ageRange, r, id);
  }
});
test('settling gắn: Renting, Visa, Banking, Meeting neighbors (hành chính + hàng xóm)', () => {
  assert.deepEqual(scenarios.filter((s) => s.recommendedFor.includes('settling')).map((s) => s.id).sort(), ['banking', 'neighbors', 'renting', 'visa']);
});
test('mỗi mục đích đều có ít nhất 1 tình huống gợi ý', () => {
  for (const p of ['settling', 'long_term_travel', 'learning_culture'])
    assert.ok(scenarios.some((s) => s.recommendedFor.includes(p as any)), p);
});
test('mọi nhân vật đều ra được cách xưng hô (không rơi vào fallback) với người học 28 tuổi', () => {
  for (const s of scenarios) {
    const r = resolveAddressTerms({ learner: { age: 28, gender: 'unknown' },
      counterpart: { gender: s.character.gender, ageRange: s.character.ageRange }, relationship: s.character.relationship }, rules);
    assert.notEqual(r.ruleId, 'FALLBACK-CLARIFY', `${s.id}: ${r.reason}`);
    assert.notEqual(r.mode, 'clarify', s.id);
  }
});
test('Renting → bác/cháu (khớp thẻ Address của wireframe)', () => {
  const c = scenarios.find((s) => s.id === 'renting')!.character;
  const r = resolveAddressTerms({ learner: { age: 28 }, counterpart: { gender: c.gender, ageRange: c.ageRange }, relationship: c.relationship }, rules);
  assert.equal(r.callTerm, 'bác'); assert.equal(r.selfTerm, 'cháu');
});

const wireframeStatus: Record<string, any> = { renting: 'in_progress', market: 'in_progress', banking: 'done', street_food: 'done' };
test('pickRecommended với dữ liệu như wireframe → Renting + Meeting neighbors', () => {
  assert.deepEqual(pickRecommended(scenarios, wireframeStatus, 'settling'), ['renting', 'neighbors']);
});
test('pickRecommended: bỏ tình huống Done, tối đa 2, ưu tiên đang dở', () => {
  const r = pickRecommended(scenarios, { renting: 'done', banking: 'done', visa: 'in_progress' }, 'settling');
  assert.deepEqual(r, ['visa', 'neighbors']);
  assert.ok(pickRecommended(scenarios, {}, 'settling', 3).length <= 3);
});
test('deriveScenarioStatus: new → in_progress → done (chỉ khi đã luyện ≥ 1 lượt)', () => {
  assert.equal(deriveScenarioStatus({ completedTurns: 0, markedDone: false }), 'new');
  assert.equal(deriveScenarioStatus({ completedTurns: 0, markedDone: true }), 'new');
  assert.equal(deriveScenarioStatus({ completedTurns: 2, markedDone: false }), 'in_progress');
  assert.equal(deriveScenarioStatus({ completedTurns: 2, markedDone: true }), 'done');
});
