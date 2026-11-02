import { DEFAULT_PROFILE } from '@app/shared-types';
import type { Profile, ProgressSnapshot, Scenario } from '@app/shared-types';
import { computeConfidence, deriveScenarioStatus, pickRecommended } from './progress.ts';
import type { SessionRecord } from './progress.ts';
import type { HistoryItem } from './prompt.ts';

export interface UserRecord {
  profile: Profile; turns: Record<string, number>; markedDone: Set<string>; addressingErrors: number; sessions: SessionRecord[];
  history: Record<string, HistoryItem[]>;     // lịch sử hội thoại theo tình huống (cho LLM); reset khi vào lại tình huống
  notesShown: Record<string, string[]>;       // ghi chú văn hóa đã hiện trong buổi hiện tại
}

export const newUser = (): UserRecord => ({ profile: { ...DEFAULT_PROFILE }, turns: {}, markedDone: new Set(), addressingErrors: 0, sessions: [], history: {}, notesShown: {} });

export const serializeUser = (u: UserRecord): string => JSON.stringify({ ...u, markedDone: [...u.markedDone] });
export function deserializeUser(json: string): UserRecord {
  const o = JSON.parse(json) as Partial<Omit<UserRecord, 'markedDone'>> & { markedDone?: string[] };
  return { ...newUser(), ...o, markedDone: new Set(o.markedDone ?? []) };
}

/** Store nhẹ trong bộ nhớ, khóa theo anonymousId (Architecture §3). `save` là no-op; SqliteStore ghi xuống đĩa. */
export class Store {
  protected users = new Map<string, UserRecord>();
  get(id: string): UserRecord {
    let u = this.users.get(id);
    if (!u) { u = this.load(id) ?? newUser(); this.users.set(id, u); }
    return u;
  }
  protected load(_id: string): UserRecord | null { return null; }
  save(_id: string): void { /* bộ nhớ: không làm gì */ }
  close(): void { /* bộ nhớ: không làm gì */ }
}

export function buildSnapshot(catalog: Scenario[], u: UserRecord): ProgressSnapshot {
  const scenarios = catalog.map((s) => ({ scenarioId: s.id, status: deriveScenarioStatus({ completedTurns: u.turns[s.id] ?? 0, markedDone: u.markedDone.has(s.id) }) }));
  const status = Object.fromEntries(scenarios.map((s) => [s.scenarioId, s.status]));
  return {
    scenarios, recommended: pickRecommended(catalog, status, u.profile.purpose),
    totals: { turns: Object.values(u.turns).reduce((a, b) => a + b, 0), addressingErrors: u.addressingErrors },
    sessions: u.sessions.filter((x) => x.turns > 0).map((x, i) => ({ index: i + 1, ...x })),
    confidence: computeConfidence(catalog, status, u.sessions),
  };
}

/** Mỗi lần vào tình huống (kind 'open') là một buổi luyện mới; lịch sử hội thoại và ghi chú đã hiện được đặt lại. */
export function startSession(u: UserRecord, scenarioId: string, now = new Date()) {
  u.sessions.push({ scenarioId, startedAt: now.toISOString(), turns: 0, addressingErrors: 0 });
  u.history[scenarioId] = []; u.notesShown[scenarioId] = [];
}
/** Lượt hoàn tất: cộng vào buổi gần nhất của tình huống đó (tạo buổi mới nếu chưa có). */
export function recordTurn(u: UserRecord, scenarioId: string, corrections: number, now = new Date()) {
  u.turns[scenarioId] = (u.turns[scenarioId] ?? 0) + 1; u.addressingErrors += corrections;
  let cur = [...u.sessions].reverse().find((x) => x.scenarioId === scenarioId);
  if (!cur) { startSession(u, scenarioId, now); cur = u.sessions[u.sessions.length - 1]; }
  cur.turns += 1; cur.addressingErrors += corrections;
}
export function pushHistory(u: UserRecord, scenarioId: string, items: HistoryItem[], max = 12) {
  u.history[scenarioId] = [...(u.history[scenarioId] ?? []), ...items].slice(-max);
}

/** DỮ LIỆU DEMO (chỉ môi trường phát triển): 8 buổi luyện với số lỗi giảm dần, trạng thái giống wireframe. */
export function seedDemo(u: UserRecord) {
  const plan: Array<[string, number]> = [['renting', 7], ['renting', 6], ['market', 6], ['banking', 4], ['banking', 4], ['street_food', 3], ['street_food', 2], ['renting', 1]];
  u.turns = {}; u.sessions = []; u.addressingErrors = 0; u.markedDone = new Set(['banking', 'street_food']); u.history = {}; u.notesShown = {};
  const day = 86_400_000; const t0 = Date.now() - plan.length * day;
  plan.forEach(([id, errors], i) => {
    startSession(u, id, new Date(t0 + i * day));
    for (let k = 0; k < 8; k++) recordTurn(u, id, k < errors ? 1 : 0, new Date(t0 + i * day));
  });
}
