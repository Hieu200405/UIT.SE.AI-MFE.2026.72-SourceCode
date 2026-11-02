export type Gender = 'male' | 'female' | 'unknown';
export type AgeRange = 'under20' | '20-35' | '35-50' | 'over50'; // clarify #1

export interface AddressContext {
  learner: { age?: number; gender?: Gender };
  counterpart: { gender?: Gender; relativeAge?: string; ageRange?: AgeRange };
  relationship?: string | null;
  setting?: string | null;
}

export type ResultMode = 'direct' | 'conditional' | 'neutral' | 'clarify';

export interface AddressingResult {
  mode: ResultMode;
  callTerm: string | null;
  selfTerm: string | null;
  alternatives: string[];
  openingExample?: string;
  clarifyQuestion?: string;
  reason: string;
  assumptions: string[];
  regionalNote: string;
  ruleId: string;
  sourceStatus: 'unverified' | 'verified';
}

export interface AddressRule {
  id: string;
  when: { relationship?: string[]; counterpartGender?: Gender[]; relativeAge?: string[] };
  result: {
    mode: ResultMode;
    callTerm?: string | null;
    selfTerm?: string | null; // hoặc "@byLearnerGender" = anh/chị theo giới người học
    alternatives?: string[];
    openingExample?: string;
    clarifyQuestion?: string;
  };
  reason: string;
  source: { ref: string; status: 'unverified' | 'verified'; verifiedBy?: string };
}
