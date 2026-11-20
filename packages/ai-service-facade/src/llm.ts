
/** Adapter cho API chuẩn OpenAI (`/chat/completions`, stream). Groq, Cerebras, OpenRouter, Mistral, Gemini (endpoint tương thích)… đều dùng được: đổi nhà cung cấp = đổi biến môi trường. */
export interface LlmConfig { baseUrl: string; apiKey: string; model: string; timeoutMs?: number; totalTimeoutMs?: number; temperature?: number; maxTokens?: number }
export interface LlmMessage { role: 'system' | 'user' | 'assistant'; content: string }

export class LlmError extends Error {
  code: string; retryable: boolean; status?: number; retryAfterMs?: number;
  constructor(code: string, retryable: boolean, status?: number, retryAfterMs?: number) { super(code); this.code = code; this.retryable = retryable; this.status = status; this.retryAfterMs = retryAfterMs; }
  /** Thông điệp an toàn cho người dùng: không lộ chi tiết nhà cung cấp, khóa hay nội dung phản hồi. */
  publicMessage(): string {
    if (this.code === 'daily_budget') return 'The configured daily AI budget has been reached';
    if (this.code === 'rate_limit' || this.status === 429) return `Too many AI requests. Please try again in ${Math.max(1, Math.ceil((this.retryAfterMs ?? 60000) / 1000))} seconds`;
    if (this.code === 'truncated') return 'The AI reply was cut short. Please retry';
    if (this.code === 'interrupted') return 'The AI connection ended before the reply was complete. Please retry';
    if (this.code === 'invalid_ui') return 'The interactive reply was incomplete. Please retry or answer in chat';
    if (this.code === 'empty') return 'The AI returned no dialogue. Please retry';
    if (this.code === 'dialogue_quality') return 'The AI reply needs rephrasing. Please retry or write a new message';
    if (this.code === 'timeout') return 'The AI took too long to respond. Please retry';
    if (this.code === 'network') return 'The connection to the AI service was lost. Please retry';
    if (this.status === 401 || this.status === 403) return 'The AI service isn’t set up correctly';
    return this.retryable ? 'The AI service is busy' : 'The AI service couldn’t answer';
  }
}

const joinUrl = (base: string, path: string) => base.replace(/\/+$/, '') + path;
export function retryAfterDelay(value: string | null, now = Date.now()): number {
  const raw = value?.trim() ?? '';
  const delay = /^\d+$/.test(raw) ? Number(raw) * 1000 :
    /^[A-Za-z]{3}, /.test(raw) ? Date.parse(raw) - now : NaN;
  return Number.isFinite(delay) && delay >= 0 ? Math.min(86400000, Math.max(1000, delay)) : 60000;
}
function networkError(error: unknown, phase: 'connect' | 'stream'): LlmError {
  const e = error as { code?: unknown; cause?: { code?: unknown } } | null;
  const code = e?.cause?.code ?? e?.code;
  const allowed = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT'];
  console.warn(`[facade] network: ${phase}/${typeof code === 'string' && allowed.includes(code) ? code : 'unknown'}`);
  return new LlmError('network', true);
}

export async function* streamCompletion(cfg: LlmConfig, messages: LlmMessage[], signal?: AbortSignal, fetchImpl: typeof fetch = fetch): AsyncGenerator<string> {
  if (signal?.aborted) return;
  const ac = new AbortController();
  const onAbort = () => ac.abort();
  signal?.addEventListener('abort', onAbort);
  let timedOut = false; let timer: ReturnType<typeof setTimeout> | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const deadline = setTimeout(() => { timedOut = true; ac.abort(); }, cfg.totalTimeoutMs ?? 60_000);
  const arm = () => { clearTimeout(timer); timer = setTimeout(() => { timedOut = true; ac.abort(); }, cfg.timeoutMs ?? 20_000); };
  arm();
  try {
    const groqOss = new URL(cfg.baseUrl).hostname === 'api.groq.com' && ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'].includes(cfg.model);
    const limits = groqOss ? { max_completion_tokens: cfg.maxTokens ?? 220, reasoning_effort: 'low', include_reasoning: false } : { max_tokens: cfg.maxTokens ?? 220 };
    let res: Response;
    try {
      res = await fetchImpl(joinUrl(cfg.baseUrl, '/chat/completions'), {
        method: 'POST', signal: ac.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ model: cfg.model, messages, stream: true, temperature: cfg.temperature ?? 0.7, ...limits }),
      });
    } catch (err) { if (signal?.aborted) return; throw timedOut ? new LlmError('timeout', true) : networkError(err, 'connect'); }
    if (!res.ok || !res.body) {
      void res.body?.cancel().catch(() => {});
      throw new LlmError(`http_${res.status}`, res.status === 429 || res.status >= 500, res.status, res.status === 429 ? retryAfterDelay(res.headers.get('retry-after')) : undefined);
    }
    reader = res.body.getReader(); const dec = new TextDecoder();
    let wire = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      arm();
      wire += dec.decode(value, { stream: true });
      // Normalize only after joining chunks: CR and LF may arrive separately.
      wire = wire.replace(/\r\n/g, '\n');
      let boundary: number;
      while ((boundary = wire.indexOf('\n\n')) >= 0) {
        const block = wire.slice(0, boundary); wire = wire.slice(boundary + 2);
        const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        if (data === '[DONE]') return;
        let obj: { error?: unknown; choices?: Array<{ finish_reason?: string; delta?: { content?: unknown } }> };
        try { obj = JSON.parse(data); } catch { throw new LlmError('interrupted', true); }
        if (!obj || typeof obj !== 'object' || obj.error) throw new LlmError('interrupted', true);
        const finish = obj.choices?.[0]?.finish_reason;
        if (finish === 'length') throw new LlmError('truncated', true);
        if (finish && finish !== 'stop') throw new LlmError('interrupted', true);
        const delta = obj.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) yield delta;
        if (finish === 'stop') return;
      }
      if (wire.length > 131072) throw new LlmError('interrupted', true);
    }
    throw new LlmError('interrupted', true);
  } catch (e) {
    if (e instanceof LlmError) throw e;
    if (signal?.aborted) return;                                   // client đã hủy: kết thúc êm
    throw timedOut ? new LlmError('timeout', true) : networkError(e, 'stream');
  } finally {
    clearTimeout(timer); clearTimeout(deadline); signal?.removeEventListener('abort', onAbort);
    ac.abort();
    if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  }
}

/** Giới hạn số request/phút (free tier có hạn mức RPM). */
export class RateLimiter {
  private blockedUntil = 0;
  private hits: number[] = []; private max: number; private now: () => number;
  constructor(maxPerMinute: number, now: () => number = Date.now) { this.max = maxPerMinute; this.now = now; }
  blockFor(ms: number): void {
    if (Number.isFinite(ms) && ms > 0) this.blockedUntil = Math.max(this.blockedUntil, this.now() + Math.min(ms, 86400000));
  }
  retryAfterMs(): number {
    const t = this.now(); this.hits = this.hits.filter((x) => t - x < 60_000);
    const rpmWait = this.hits.length >= this.max ? Math.max(1, (this.hits[0] ?? t) + 60000 - t) : 0;
    return Math.max(0, this.blockedUntil - t, rpmWait);
  }
  tryAcquire(): boolean {
    if (this.retryAfterMs() > 0) return false;
    const t = this.now(); this.hits = this.hits.filter((x) => t - x < 60_000);
    if (this.hits.length >= this.max) return false;
    this.hits.push(t); return true;
  }
}
/** Ngân sách token/ngày (ước lượng ~3 ký tự/token), reset theo ngày UTC. 0 = không giới hạn. */
export class DailyBudget {
  private used = 0; private day = ''; private max: number; private now: () => number;
  constructor(maxTokens: number, now: () => number = Date.now) { this.max = maxTokens; this.now = now; }
  tryReserve(chars: number): boolean {
    const d = new Date(this.now()).toISOString().slice(0, 10);
    if (d !== this.day) { this.day = d; this.used = 0; }
    const est = Math.ceil(chars / 3);
    if (this.max > 0 && this.used + est > this.max) return false;
    this.used += est; return true;
  }
}
