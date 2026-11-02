import type { Scenario, ScenarioStatus, ResidencePurpose } from '../../shared-types/src/index.ts';

/** new → in_progress (≥1 lượt hoàn tất) → done (người học tự đánh dấu, chỉ khi đã có ≥1 lượt). */
export function deriveScenarioStatus(input: { completedTurns: number; markedDone: boolean }): ScenarioStatus {
  if (input.completedTurns < 1) return 'new';
  return input.markedDone ? 'done' : 'in_progress';
}

/**
 * Gợi ý "Recommended for you": chỉ tình huống chưa Done, ưu tiên đang dở, tối đa `max`,
 * ưu tiên đa dạng nhóm (mỗi nhóm 1 thẻ trước). Quy tắc do nhóm đề xuất, chưa kiểm chứng với người dùng.
 */
export function pickRecommended(scenarios: Scenario[], status: Record<string, ScenarioStatus>, purpose: ResidencePurpose, max = 2): string[] {
  const rank = (s: Scenario) => (status[s.id] === 'in_progress' ? 0 : 1);
  const cands = scenarios
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.recommendedFor.includes(purpose) && status[s.id] !== 'done')
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .map(({ s }) => s);
  const picked: Scenario[] = [];
  const groups = new Set<string>();
  for (const s of cands) if (picked.length < max && !groups.has(s.group)) { picked.push(s); groups.add(s.group); }
  for (const s of cands) if (picked.length < max && !picked.includes(s)) picked.push(s);
  return picked.map((s) => s.id);
}

export interface SessionRecord { scenarioId: string; startedAt: string; turns: number; addressingErrors: number }

/**
 * Confidence 2.3 theo nhóm (0–100). CÔNG THỨC ĐỀ XUẤT, chưa kiểm chứng với người dùng (không phải CEFR):
 *   coverage = (số tình huống Done + 0,5 × số đang luyện) / số tình huống trong nhóm
 *   accuracy = 1 − (lỗi xưng hô / số lượt) trên tối đa 5 buổi gần nhất của nhóm
 *   confidence = 100 × coverage × (0,5 + 0,5 × accuracy); chưa có lượt nào → 0
 */
export function computeConfidence(
  catalog: Scenario[], status: Record<string, ScenarioStatus>, sessions: SessionRecord[],
): Record<'administrative' | 'daily_life' | 'social', number> {
  const out = { administrative: 0, daily_life: 0, social: 0 } as Record<'administrative' | 'daily_life' | 'social', number>;
  for (const g of ['administrative', 'daily_life', 'social'] as const) {
    const inGroup = catalog.filter((s) => s.group === g);
    if (!inGroup.length) continue;
    const ids = new Set(inGroup.map((s) => s.id));
    const recent = sessions.filter((x) => ids.has(x.scenarioId) && x.turns > 0).slice(-5);
    const turns = recent.reduce((a, x) => a + x.turns, 0);
    if (turns === 0) continue;
    const errors = recent.reduce((a, x) => a + x.addressingErrors, 0);
    const accuracy = 1 - Math.min(1, errors / turns);
    const coverage = inGroup.reduce((a, s) => a + (status[s.id] === 'done' ? 1 : status[s.id] === 'in_progress' ? 0.5 : 0), 0) / inGroup.length;
    out[g] = Math.round(100 * coverage * (0.5 + 0.5 * accuracy));
  }
  return out;
}
