/**
 * @app/shared-types – contract v0.2 (DRAFT, nguồn sự thật duy nhất cho StreamEvent/UICardSpec)
 * Thay đổi so với API Contract v0.1: translation, originalText/suggestedText,
 * reply suggestion có translation, needs_clarification, error có retryable.
 */

export const CONTRACT_VERSION = '0.7.0';

export interface ScenarioFormData {
  formId: string;
  title: string;
  description: string;
  submitLabel: string;
  fields: Array<{ id: string; label: string; kind: 'choice' | 'select' | 'text' | 'textarea'; required: boolean; options?: string[] }>;
}
export interface FormInteraction { formId: string; values: Record<string, string> }

// ---------- Thẻ UI (registry đóng; scenario_form được web opt-in từ v0.6) ----------
export interface AddressCardData {
  originalText: string;            // "You said"
  suggestedText: string;           // "Suggested"
  suggestedTerms: { call: string | null; self: string | null };
  isCorrection: boolean;
  explanation: string;             // "Reason"
  assumptions?: string[];          // giả định đã dùng khi thiếu dữ kiện (clarify #2)
  regionalNote?: string;           // client luôn hiển thị disclaimer mặc định nếu thiếu
}
export interface CulturalNoteData {
  title: string;
  explanation: string;
  verified: boolean;               // false => UI gắn nhãn "Sample"
}
export interface ReplySuggestionData {
  suggestions: Array<{ text: string; translation: string }>; // 1–2 phần tử
}

export type UICardSpec =
  | { type: 'scenario_form'; data: ScenarioFormData }
  | { type: 'address'; data: AddressCardData }
  | { type: 'cultural_note'; data: CulturalNoteData }
  | { type: 'reply_suggestion'; data: ReplySuggestionData };

export const UI_REGISTRY_TYPES = ['address', 'cultural_note', 'reply_suggestion', 'scenario_form'] as const;

// ---------- SSE ----------
export interface TextDeltaEvent { type: 'text_delta'; requestId: string; partId: string; text: string; translation?: string }
export interface UICardEvent { type: 'ui_card'; requestId: string; card: UICardSpec }
export interface NeedsClarificationEvent {
  type: 'needs_clarification'; requestId: string;
  question: string; assumptions?: string[]; options?: string[];
}
/** Bản dịch EN cho tin nhắn của NGƯỜI HỌC (clarify #15). Facade có thể không gửi nếu không dịch được. */
export interface UserTranslationEvent { type: 'user_translation'; requestId: string; translation: string }
export interface DoneEvent { type: 'done'; requestId: string }
export interface ErrorEvent { type: 'error'; requestId: string; error: { message: string; retryable: boolean } }
export type StreamEvent = TextDeltaEvent | UICardEvent | UserTranslationEvent | NeedsClarificationEvent | DoneEvent | ErrorEvent;

// ---------- Agent message & trạng thái ----------
export type AgentPart =
  | { kind: 'text'; partId: string; text: string; translation?: string }
  | { kind: 'card'; card: UICardSpec };
export interface AgentMessage { requestId: string; parts: AgentPart[] }
export type TurnState = 'streaming' | 'completed' | 'cancelled' | 'failed' | 'clarifying';

// ---------- Event bus ----------
export interface ConversationTurnCompleted {
  type: 'conversationTurnCompleted';
  payload: { scenarioId: string; requestId: string; turnId?: string; completedAt?: string; addressingErrorCount?: number };
}
export interface ProfileUpdated {
  type: 'profileUpdated';
  payload: { profileVersion: number; changedFields: string[] };
}

// ---------- Validators (không phụ thuộc thư viện ngoài) ----------
const isStr = (v: unknown): v is string => typeof v === 'string';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const optionalStrings = (v: unknown): boolean => v === undefined || (Array.isArray(v) && v.every(isStr));
const boundedText = (v: unknown, max: number): v is string => isStr(v) && v.trim().length > 0 && v.length <= max;
const onlyKeys = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).every((k) => keys.includes(k));

/** Strict schema shared by the LLM boundary and renderer; no arbitrary props. */
export function validateScenarioForm(v: unknown): v is ScenarioFormData {
  if (!isObj(v) || !onlyKeys(v, ['formId', 'title', 'description', 'submitLabel', 'fields']) ||
    !boundedText(v.formId, 100) || !boundedText(v.title, 120) || !boundedText(v.description, 500) || !boundedText(v.submitLabel, 60) ||
    !Array.isArray(v.fields) || v.fields.length < 1 || v.fields.length > 5) return false;
  return new Set(v.fields.map((f) => isObj(f) ? f.id : null)).size === v.fields.length && v.fields.every((f) => {
    if (!isObj(f) || !onlyKeys(f, ['id', 'label', 'kind', 'required', 'options']) ||
      !isStr(f.id) || !/^[a-z][a-z0-9_]{0,30}$/.test(f.id) || ['constructor', 'prototype', '__proto__'].includes(f.id) ||
      !boundedText(f.label, 160) || typeof f.required !== 'boolean') return false;
    if (f.kind === 'text' || f.kind === 'textarea') return f.options === undefined;
    return (f.kind === 'select' || f.kind === 'choice') && Array.isArray(f.options) && f.options.length >= 2 && f.options.length <= 8 &&
      f.options.every((o) => boundedText(o, 120)) && new Set(f.options).size === f.options.length;
  });
}

export function validateUICard(v: unknown): v is UICardSpec {
  if (!isObj(v) || !isObj(v.data) || !isStr(v.type)) return false;
  const d = v.data;
  switch (v.type) {
    case 'scenario_form':
      return validateScenarioForm(d);
    case 'address':
      return isStr(d.originalText) && isStr(d.suggestedText) && isStr(d.explanation) &&
        typeof d.isCorrection === 'boolean' && isObj(d.suggestedTerms) &&
        (d.suggestedTerms.call === null || isStr(d.suggestedTerms.call)) &&
        (d.suggestedTerms.self === null || isStr(d.suggestedTerms.self)) &&
        (d.regionalNote === undefined || isStr(d.regionalNote)) && optionalStrings(d.assumptions);
    case 'cultural_note':
      return isStr(d.title) && isStr(d.explanation) && typeof d.verified === 'boolean';
    case 'reply_suggestion':
      return Array.isArray(d.suggestions) && d.suggestions.length >= 1 && d.suggestions.length <= 2 &&
        d.suggestions.every((s) => isObj(s) && isStr(s.text) && isStr(s.translation));
    default:
      return false; // type lạ => UI hạ cấp về văn bản
  }
}

export function parseStreamEvent(v: unknown): StreamEvent | null {
  if (!isObj(v) || !isStr(v.type) || !isStr(v.requestId)) return null;
  switch (v.type) {
    case 'text_delta':
      return isStr(v.partId) && isStr(v.text) && (v.translation === undefined || isStr(v.translation)) ? (v as unknown as TextDeltaEvent) : null;
    case 'ui_card':
      return validateUICard(v.card) ? (v as unknown as UICardEvent) : null;
    case 'user_translation':
      return isStr(v.translation) && v.translation.length > 0 ? (v as unknown as UserTranslationEvent) : null;
    case 'needs_clarification':
      return isStr(v.question) && optionalStrings(v.assumptions) && optionalStrings(v.options) ? (v as unknown as NeedsClarificationEvent) : null;
    case 'done':
      return v as unknown as DoneEvent;
    case 'error':
      return isObj(v.error) && isStr(v.error.message) && typeof v.error.retryable === 'boolean' ? (v as unknown as ErrorEvent) : null;
    default:
      return null;
  }
}

// ---------- Tình huống & tiến độ (v0.2.2) ----------
export type ScenarioGroup = 'administrative' | 'daily_life' | 'social';
export type ResidencePurpose = 'long_term_travel' | 'settling' | 'learning_culture';
export type ScenarioStatus = 'new' | 'in_progress' | 'done';

export interface ScenarioCharacter {
  roleLabel: string;               // "Landlord"
  relationship: string;            // khóa dùng cho rules-xung-ho
  gender: 'male' | 'female' | 'unknown';
  ageApprox: number;               // hiển thị "~60"
  ageRange: 'under20' | '20-35' | '35-50' | 'over50';
}
export interface Scenario {
  id: string; title: string; group: ScenarioGroup; summary: string; icon: string;
  character: ScenarioCharacter;
  objectives: string[];            // "Done" = đạt hết mục tiêu (clarify #6)
  recommendedFor: ResidencePurpose[];
  status: 'draft' | 'reviewed';
}
export interface ScenarioProgress { scenarioId: string; status: ScenarioStatus }

// ---------- Người học tự đánh dấu "Done" (v0.3.0, clarify #12) ----------
// Facade op logic: setScenarioDone(scenarioId, done:boolean). Không có đánh giá tự động mục tiêu.
export interface ScenarioStatusChanged {
  type: 'scenarioStatusChanged';
  payload: { scenarioId: string; status: ScenarioStatus };
}

// ---------- Event bus: union + validator (v0.3.1) ----------
export type BusEvent = ConversationTurnCompleted | ProfileUpdated | ScenarioStatusChanged;
export type BusEventType = BusEvent['type'];

export function parseBusEvent(v: unknown): BusEvent | null {
  if (!isObj(v) || !isStr(v.type) || !isObj(v.payload)) return null;
  const p = v.payload;
  switch (v.type) {
    case 'conversationTurnCompleted':
      return isStr(p.scenarioId) && isStr(p.requestId) ? (v as unknown as BusEvent) : null;
    case 'profileUpdated':
      return typeof p.profileVersion === 'number' && Array.isArray(p.changedFields) && p.changedFields.every(isStr) ? (v as unknown as BusEvent) : null;
    case 'scenarioStatusChanged':
      return isStr(p.scenarioId) && (p.status === 'new' || p.status === 'in_progress' || p.status === 'done') ? (v as unknown as BusEvent) : null;
    default:
      return null;
  }
}

declare global { interface Window { __reactCopies?: unknown[] } }

// ---------- Profile, Progress, Chat request, props Remote (v0.4.0) ----------
export type ProfileGender = 'unknown' | 'male' | 'female';
export type Region = 'north' | 'central' | 'south';
export interface Profile { purpose: ResidencePurpose; age: number | null; gender: ProfileGender; region: Region }
/** Giá trị mẫu của wireframe (My Profile). */
export const DEFAULT_PROFILE: Profile = { purpose: 'settling', age: 28, gender: 'unknown', region: 'south' };

export function validateProfile(v: unknown): v is Profile {
  if (!isObj(v)) return false;
  return (v.purpose === 'long_term_travel' || v.purpose === 'settling' || v.purpose === 'learning_culture') &&
    (v.age === null || (typeof v.age === 'number' && Number.isInteger(v.age) && v.age >= 5 && v.age <= 120)) &&
    (v.gender === 'unknown' || v.gender === 'male' || v.gender === 'female') &&
    (v.region === 'north' || v.region === 'central' || v.region === 'south');
}

/** Một buổi luyện = một lần vào tình huống (Chat gửi `open`), chỉ tính các buổi có ≥ 1 lượt hoàn tất. */
export interface SessionSummary { index: number; scenarioId: string; startedAt: string; turns: number; addressingErrors: number }
export interface ProgressSnapshot {
  scenarios: ScenarioProgress[];
  recommended: string[];                       // tối đa 2 id, đã bỏ tình huống Done
  totals: { turns: number; addressingErrors: number };
  sessions: SessionSummary[];                  // theo thứ tự thời gian; biểu đồ 2.2
  confidence: Record<ScenarioGroup, number>;   // 0–100 theo nhóm; 2.3 (công thức đề xuất, chưa kiểm chứng)
}

export type ChatKind = 'open' | 'message' | 'hint';
export interface ChatRequest { requestId: string; scenarioId: string; kind: ChatKind; message?: string; interactive?: boolean; interaction?: FormInteraction }
export function validateChatRequest(v: unknown): v is ChatRequest {
  return isObj(v) && isStr(v.requestId) && v.requestId.length > 0 && isStr(v.scenarioId) &&
    (v.interactive === undefined || typeof v.interactive === 'boolean') &&
    (v.interaction === undefined || (v.kind === 'message' && isObj(v.interaction) && isStr(v.interaction.formId) &&
      isObj(v.interaction.values) && !Array.isArray(v.interaction.values) && Object.keys(v.interaction.values).length <= 5 &&
      Object.values(v.interaction.values).every((x) => isStr(x) && x.length <= 300))) &&
    (v.kind === 'open' || v.kind === 'message' || v.kind === 'hint') &&
    (v.message === undefined || (isStr(v.message) && v.message.length <= 500)) &&
    (v.kind !== 'message' || (isStr(v.message) && v.message.trim().length > 0));
}

/** Host truyền cho mọi Remote (Architecture §2: API nhỏ, có kiểu). */
export interface RemoteFlags { hint: boolean; micButton: boolean }
export interface RemoteProps { facadeUrl: string; flags: RemoteFlags; streamIdleTimeoutMs?: number }

// ---------- SSE (dùng chung Facade và client) ----------
export function formatSseEvent(e: StreamEvent): string {
  return `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`;
}
/** Parser tăng dần: nhận chunk bất kỳ (kể cả cắt giữa event), trả về các object JSON đã đủ. */
export class SseParser {
  private buf = '';
  push(chunk: string): unknown[] {
    this.buf += chunk.replace(/\r\n/g, '\n');
    const out: unknown[] = [];
    let i: number;
    while ((i = this.buf.indexOf('\n\n')) >= 0) {
      const block = this.buf.slice(0, i); this.buf = this.buf.slice(i + 2);
      const data = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n');
      if (!data) continue;
      try { out.push(JSON.parse(data)); } catch { /* bỏ qua event hỏng */ }
    }
    return out;
  }
}
