import { SseParser, parseStreamEvent } from '@app/shared-types';
import type { ChatRequest, Profile, ProgressSnapshot, Scenario, StreamEvent } from '@app/shared-types';
import { Utf8StreamDecoder } from './utf8.ts';
export { Utf8StreamDecoder } from './utf8.ts';

/** Client duy nhất để Remote nói chuyện với AI Service Facade (Constitution #4). */
export class FacadeError extends Error {
  status?: number; retryable: boolean;
  constructor(message: string, opts: { status?: number; retryable?: boolean } = {}) { super(message); this.status = opts.status; this.retryable = opts.retryable ?? true; }
}
export class StreamTimeoutError extends FacadeError {
  constructor(ms: number) { super(`No data from the server for ${ms} ms`, { retryable: true }); }
}
export type StreamOutcome = 'done' | 'error' | 'clarifying' | 'aborted';
export interface StreamOptions { onEvent: (e: StreamEvent) => void; signal?: AbortSignal; idleTimeoutMs?: number }

type KV = Pick<Storage, 'getItem' | 'setItem'>;
const memory = new Map<string, string>();
const fallbackStore: KV = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v) };

/** Định danh ẩn danh (Charter: không đăng nhập). Lưu localStorage, có try/catch vì có thể bị chặn. */
export function getAnonymousId(storage?: KV): string {
  let s: KV = fallbackStore;
  try { s = storage ?? (globalThis as { localStorage?: Storage }).localStorage ?? fallbackStore; } catch { /* bị chặn */ }
  try { const cur = s.getItem('anonymousId'); if (cur && /^[\w-]{8,64}$/.test(cur)) return cur; } catch { /* bỏ qua */ }
  const id = globalThis.crypto?.randomUUID?.() ?? `anon-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  try { s.setItem('anonymousId', id); } catch { /* không lưu được: id chỉ sống trong phiên */ }
  return id;
}

export interface AsyncKV { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void> }
/** Bản bất đồng bộ cho React Native (AsyncStorage). Không có crypto.randomUUID → dùng ngẫu nhiên + thời gian (ID không phải bí mật). */
export async function getAnonymousIdAsync(storage: AsyncKV): Promise<string> {
  try { const cur = await storage.getItem('anonymousId'); if (cur && /^[\w-]{8,64}$/.test(cur)) return cur; } catch { /* bỏ qua */ }
  const rnd = () => Math.random().toString(36).slice(2, 10);
  const id = globalThis.crypto?.randomUUID?.() ?? `anon-${rnd()}${rnd()}-${Date.now().toString(36)}`;
  try { await storage.setItem('anonymousId', id); } catch { /* không lưu được: ID chỉ sống trong phiên */ }
  return id;
}

export function createFacadeClient(cfg: { baseUrl: string; anonymousId?: string; fetchImpl?: typeof fetch }) {
  const f = cfg.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const anonymousId = cfg.anonymousId ?? getAnonymousId();
  const headers = (extra: Record<string, string> = {}) => ({ 'x-anonymous-id': anonymousId, ...extra });

  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try { res = await f(cfg.baseUrl + path, { ...init, headers: headers(init?.body ? { 'content-type': 'application/json' } : {}) }); }
    catch { throw new FacadeError('Cannot reach the server', { retryable: true }); }
    if (!res.ok) throw new FacadeError(`Server returned ${res.status}`, { status: res.status, retryable: res.status >= 500 });
    return res.json() as Promise<T>;
  }

  return {
    anonymousId,
    getScenarios: () => call<{ scenarios: Scenario[] }>('/scenarios').then((r) => r.scenarios),
    getProfile: () => call<{ profile: Profile }>('/profile').then((r) => r.profile),
    putProfile: (profile: Profile) => call<{ profile: Profile }>('/profile', { method: 'PUT', body: JSON.stringify({ profile }) }).then((r) => r.profile),
    getHealth: () => call<{ ok: boolean; dev: boolean }>('/health'),
    /** Chỉ môi trường phát triển (Facade bật FACADE_DEV=1). Phải bỏ khỏi bản chạy thật. */
    dev: { seed: () => call<ProgressSnapshot>('/dev/seed', { method: 'POST', body: '{}' }) },
    getProgress: () => call<ProgressSnapshot>('/progress'),
    setScenarioDone: (id: string, done: boolean) => call<ProgressSnapshot>(`/progress/scenarios/${encodeURIComponent(id)}/done`, { method: 'PUT', body: JSON.stringify({ done }) }),

    /**
     * Mở luồng SSE. Hủy bằng `signal` (resolve 'aborted'). Không có dữ liệu quá `idleTimeoutMs` → StreamTimeoutError.
     * Luồng đóng mà chưa có done/error/needs_clarification → FacadeError (mất kết nối).
     * Event sai schema bị bỏ qua (Constitution #11) – không làm sập luồng.
     */
    async streamChat(req: ChatRequest, opts: StreamOptions): Promise<StreamOutcome> {
      const idleMs = opts.idleTimeoutMs ?? 15_000;
      const ac = new AbortController();
      let timedOut = false; let timer: ReturnType<typeof setTimeout> | undefined;
      const arm = () => { clearTimeout(timer); timer = setTimeout(() => { timedOut = true; ac.abort(); }, idleMs); };
      const onAbort = () => ac.abort();
      if (opts.signal?.aborted) return 'aborted';
      opts.signal?.addEventListener('abort', onAbort);
      arm();
      let outcome: StreamOutcome | null = null;
      try {
        const res = await f(cfg.baseUrl + '/chat/stream', { method: 'POST', headers: headers({ 'content-type': 'application/json' }), body: JSON.stringify(req), signal: ac.signal });
        if (!res.ok || !res.body) throw new FacadeError(`Server returned ${res.status}`, { status: res.status, retryable: res.status >= 500 });
        const reader = res.body.getReader(); const dec = new Utf8StreamDecoder(); const parser = new SseParser();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          arm();
          for (const raw of parser.push(dec.decode(value))) {
            const e = parseStreamEvent(raw);
            if (!e) { console.warn('[facade-client] bỏ qua event sai schema', raw); continue; }
            opts.onEvent(e);
            if (e.type === 'done') outcome = 'done'; else if (e.type === 'error') outcome = 'error'; else if (e.type === 'needs_clarification') outcome = 'clarifying';
          }
          if (outcome) { void reader.cancel().catch(() => {}); break; }
        }
        if (!outcome) throw new FacadeError('Connection lost before the reply finished', { retryable: true });
        return outcome;
      } catch (err) {
        if (timedOut) throw new StreamTimeoutError(idleMs);
        if (opts.signal?.aborted) return 'aborted';
        if (err instanceof FacadeError) throw err;
        throw new FacadeError('Connection lost before the reply finished', { retryable: true });
      } finally {
        clearTimeout(timer); opts.signal?.removeEventListener('abort', onAbort);
      }
    },
  };
}
export type FacadeClient = ReturnType<typeof createFacadeClient>;
