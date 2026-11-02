import type { AddressContext, AddressRule, AddressingResult, AgeRange } from './types.ts';

const REGIONAL = 'Usage may vary by region/family.';
const FALLBACK_QUESTION = 'Người đó khoảng tuổi nào so với bạn và hai người đang ở trong tình huống nào?';

// ĐỀ XUẤT (chưa kiểm chứng): ước lượng tuổi giữa của khoảng và ngưỡng chênh lệch.
const RANGE_MID: Record<AgeRange, number> = { under20: 17, '20-35': 28, '35-50': 43, over50: 60 };

export function deriveRelativeAge(learnerAge: number, range: AgeRange): string {
  const d = RANGE_MID[range] - learnerAge;
  if (d >= 20) return 'much_older';
  if (d >= 8) return 'older';
  if (d >= 3) return 'slightly_older';
  if (d >= -2) return 'similar';
  if (d >= -12) return 'younger';
  return 'much_younger';
}

function matches(rule: AddressRule, ctx: AddressContext, relativeAge: string): boolean {
  const w = rule.when;
  if (w.relationship && !w.relationship.includes(ctx.relationship ?? 'unknown')) return false;
  if (w.counterpartGender && !w.counterpartGender.includes(ctx.counterpart.gender ?? 'unknown')) return false;
  if (w.relativeAge && !w.relativeAge.includes(relativeAge)) return false;
  return true;
}

/** Hàm thuần, tất định, không gọi LLM. Rule đầu tiên khớp thắng. */
export function resolveAddressTerms(ctx: AddressContext, rules: AddressRule[]): AddressingResult {
  let relativeAge = ctx.counterpart.relativeAge ?? 'unknown';
  if (relativeAge === 'unknown' && ctx.learner.age !== undefined && ctx.counterpart.ageRange) {
    relativeAge = deriveRelativeAge(ctx.learner.age, ctx.counterpart.ageRange);
  }
  const rule = rules.find((r) => matches(r, ctx, relativeAge));
  if (!rule) {
    return {
      mode: 'clarify', callTerm: null, selfTerm: null, alternatives: [],
      clarifyQuestion: FALLBACK_QUESTION,
      reason: 'Not enough information to choose address terms.',
      assumptions: [], regionalNote: REGIONAL, ruleId: 'FALLBACK-CLARIFY', sourceStatus: 'verified',
    };
  }
  const r = rule.result;
  const assumptions: string[] = [];
  let selfTerm: string | null = r.selfTerm ?? null;
  let alternatives = [...(r.alternatives ?? [])];

  if (selfTerm === '@byLearnerGender') {
    const g = ctx.learner.gender ?? 'unknown';
    if (g === 'male') selfTerm = 'anh';
    else if (g === 'female') selfTerm = 'chị';
    else {
      selfTerm = null;
      alternatives = ['anh', 'chị'];
      assumptions.push('Learner gender not provided: no self-term is assumed; use a sentence without one.');
    }
  }
  if (r.mode === 'conditional' && relativeAge === 'unknown') {
    assumptions.push('Age of the other person not provided: result depends on how old they are.');
  }
  return {
    mode: r.mode, callTerm: r.callTerm ?? null, selfTerm, alternatives,
    openingExample: r.openingExample, clarifyQuestion: r.clarifyQuestion,
    reason: rule.reason, assumptions, regionalNote: REGIONAL,
    ruleId: rule.id, sourceStatus: rule.source.status,
  };
}
