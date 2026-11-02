import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveAddressTerms, deriveRelativeAge } from '../src/index.ts';
import { loadRules } from '../src/load-node.ts';

const rules = loadRules();
const cases = JSON.parse(readFileSync(new URL('../../../tests/scenarios/xung-ho/cases.json', import.meta.url), 'utf-8')).cases;

for (const c of cases) {
  test(`${c.id}`, () => {
    const r = resolveAddressTerms(c.input, rules);
    const e = c.expected;
    assert.equal(r.mode, e.mode, `mode (rule ${r.ruleId})`);
    if ('callTerm' in e) assert.equal(r.callTerm, e.callTerm, 'callTerm');
    if ('selfTerm' in e) assert.equal(r.selfTerm, e.selfTerm, 'selfTerm');
    for (const a of e.alternatives ?? []) assert.ok(r.alternatives.includes(a), `thiếu alternative: ${a}`);
    if (e.openingExample) assert.equal(r.openingExample, e.openingExample);
    if (e.clarifyQuestion) assert.equal(r.clarifyQuestion, e.clarifyQuestion);
    for (const m of c.mustNot ?? []) {
      const term = String(m).replace(/\(.*?\)/g, '').trim();
      if (term.split(' ').length > 2) continue; // mô tả hành vi, đã kiểm bằng mode
      assert.notEqual(r.callTerm, term, `callTerm không được là ${term}`);
      assert.notEqual(r.selfTerm, term, `selfTerm không được là ${term}`);
    }
    assert.ok(r.regionalNote.length > 0);
  });
}

test('không suy đoán giới tính người học: không ca nào tự xưng anh/chị khi gender=unknown', () => {
  for (const c of cases) {
    const r = resolveAddressTerms(c.input, rules);
    assert.ok(r.selfTerm !== 'anh' && r.selfTerm !== 'chị', c.id);
  }
});
test('biết giới người học thì chọn từ tự xưng (TC-XH-04 biến thể)', () => {
  const c = cases.find((x: any) => x.id === 'TC-XH-04').input;
  assert.equal(resolveAddressTerms({ ...c, learner: { gender: 'male' } }, rules).selfTerm, 'anh');
  assert.equal(resolveAddressTerms({ ...c, learner: { gender: 'female' } }, rules).selfTerm, 'chị');
});
test('wireframe: người học 28, chủ nhà nam over50 → bác/cháu', () => {
  const r = resolveAddressTerms({ learner: { age: 28, gender: 'unknown' }, counterpart: { gender: 'male', ageRange: 'over50' }, relationship: 'landlord' }, rules);
  assert.equal(r.callTerm, 'bác'); assert.equal(r.selfTerm, 'cháu'); assert.equal(r.ruleId, 'R-ELDER-NEIGHBOR-M');
});
test('deriveRelativeAge (ngưỡng đề xuất)', () => {
  assert.equal(deriveRelativeAge(28, 'over50'), 'much_older');
  assert.equal(deriveRelativeAge(28, '20-35'), 'similar');
  assert.equal(deriveRelativeAge(28, 'under20'), 'younger');
});
test('tất định: cùng input → cùng output', () => {
  const c = cases[1].input;
  assert.deepEqual(resolveAddressTerms(c, rules), resolveAddressTerms(c, rules));
});
