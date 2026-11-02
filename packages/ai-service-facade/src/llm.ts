import { SseParser } from '@app/shared-types';

/** Adapter cho API chuẩn OpenAI (`/chat/completions`, stream). Groq, Cerebras, OpenRouter, Mistral, Gemini (endpoint tương thích)… đều dùng được: đổi nhà cung cấp = đổi biến môi trường. */
export interface LlmConfig { baseUrl: string; apiKey: string; model: string; timeoutMs?: number; temperature?: number; maxTokens?: number }
export interface LlmMessage { role: 'system' | 'user' | 'assistant'; content: string }

export class LlmError extends Error {
  code: string; retryable: boolean; status?: number;
  constructor(code: string, retryable: boolean, status?: number) { super(code); this.code = code; this.retryable = retryable; this.status = status; }
  /** Thông điệp an toàn cho người dùng: không lộ chi tiết nhà cung cấp, khóa hay nội dung phản hồi. */
  publicMessage(): string {
    if (this.status === 401 || this.status === 403) return 'The AI service isn’t set up correctly';
    return this.retryable ? 'The AI service is busy' : 'The AI service couldn’t answer';
  }
}

const joinUrl = (base: string, path: string) => base.replace(/\/+$/, '') + path;

export async function* streamCompletion(cfg: LlmConfig, messages: LlmMessage[], signal?: AbortSignal, fetchImpl: typeof fetch = fetch): AsyncGenerator<string> {
  const ac = new AbortController();
  const onAbort = () => ac.abort();
  signal?.addEventListener('abort', onAbort);
  let timedOut = false; let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => { clearTimeout(timer); timer = setTimeout(() => { timedOut = true; ac.abort(); }, cfg.timeoutMs ?? 20_000); };
  arm();
  try {
    let res: Response;
    try {
      res = await fetchImpl(joinUrl(cfg.baseUrl, '/chat/completions'), {
        method: 'POST', signal: ac.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ model: cfg.model, messages, stream: true, temperature: cfg.temperature ?? 0.7, max_tokens: cfg.maxTokens ?? 220 }),
      });
    } catch { throw new LlmError(timedOut ? 'timeout' : 'network', true); }
    if (!res.ok || !res.body) {
      void res.body?.cancel().catch(() => {});
      throw new LlmError(`http_${res.status}`, res.status === 429 || res.status >= 500, res.status);
    }
    const reader = res.body.getReader(); const dec = new TextDecoder(); const parser = new SseParser();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      arm();
      for (const obj of parser.push(dec.decode(value, { stream: true }))) { // "[DONE]" không phải JSON nên bị bỏ qua
        const delta = (obj as { choices?: Array<{ delta?: { content?: unknown } }> }).choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) yield delta;
      }
    }
  } catch (e) {
    if (e instanceof LlmError) throw e;
    if (signal?.aborted) return;                                   // client đã hủy: kết thúc êm
    throw new LlmError(timedOut ? 'timeout' : 'network', true);
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); }
}

/** Giới hạn số request/phút (free tier có hạn mức RPM). */
export class RateLimiter {
  private hits: number[] = []; private max: number; private now: () => number;
  constructor(maxPerMinute: number, now: () => number = Date.now) { this.max = maxPerMinute; this.now = now; }
  tryAcquire(): boolean {
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
