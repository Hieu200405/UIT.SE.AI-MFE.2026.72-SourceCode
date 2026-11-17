import http from 'node:http';
import { formatSseEvent, validateChatRequest, validateProfile } from '@app/shared-types';
import type { Scenario, ScenarioFormData, StreamEvent } from '@app/shared-types';
import type { AddressRule } from '../../rules-xung-ho/src/index.ts';
import { runTurn } from './engine.ts';
import { interactionMessage, validInteraction } from './interactive.ts';
import type { EngineOptions } from './engine.ts';
import { Store, buildSnapshot, pushHistory, recordTurn, seedDemo, startSession } from './store.ts';

const json = (res: http.ServerResponse, cors: Record<string, string>, code: number, body: unknown) => {
  res.writeHead(code, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify(body));
};
const readJson = (req: http.IncomingMessage): Promise<unknown> => new Promise((resolve, reject) => {
  let raw = ''; req.on('data', (c) => { raw += c; if (raw.length > 10_000) { reject(new Error('too large')); req.destroy(); } });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('bad json')); } });
  req.on('error', reject);
});

export interface FacadeOptions {
  scenarios: Scenario[]; rules: AddressRule[]; delayScale?: number; dev?: boolean;
  store?: Store;                 // mặc định: bộ nhớ; production: SqliteStore
  engine?: EngineOptions;        // có `llm` → chế độ LLM thật
  corsOrigin?: string;           // mặc định '*' (dev); production: origin của Host
}

/** Facade: điểm truy cập duy nhất tới LLM + rule engine + store (Constitution #4). Không lộ stack trace, khóa hay chi tiết nhà cung cấp. */
export function createFacade(opts: FacadeOptions): http.Server {
  const store = opts.store ?? new Store();
  const scale = opts.delayScale ?? 1;
  const mode = opts.engine?.llm ? 'llm' : 'mock';
  const activeTurns = new Map<string, AbortController>();
  const CORS = {
    'Access-Control-Allow-Origin': opts.corsOrigin ?? '*',
    'Access-Control-Allow-Headers': 'content-type, x-anonymous-id',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    Vary: 'Origin',
  };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms * scale));
  const reply = (res: http.ServerResponse, code: number, body: unknown) => json(res, CORS, code, body);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
      const url = new URL(req.url ?? '/', 'http://x');
      const id = String(req.headers['x-anonymous-id'] ?? '');
      if (url.pathname === '/health') return reply(res, 200, { ok: true, dev: !!opts.dev, mode }); // không chứa khóa/cấu hình nhạy cảm
      if (!/^[\w-]{8,64}$/.test(id)) return reply(res, 400, { error: 'missing_or_invalid_anonymous_id' });
      const user = store.get(id);

      if (req.method === 'GET' && url.pathname === '/scenarios') return reply(res, 200, { scenarios: opts.scenarios });
      if (url.pathname === '/profile') {
        if (req.method === 'GET') return reply(res, 200, { profile: user.profile });
        if (req.method === 'PUT') {
          const body = (await readJson(req)) as { profile?: unknown };
          if (!validateProfile(body.profile)) return reply(res, 400, { error: 'invalid_profile' });
          user.profile = body.profile; store.save(id); return reply(res, 200, { profile: user.profile });
        }
      }
      if (req.method === 'POST' && url.pathname === '/dev/seed') { // CHỈ môi trường phát triển; phải bỏ khỏi bản chạy thật
        if (!opts.dev) return reply(res, 404, { error: 'not_found' });
        seedDemo(user); store.save(id); return reply(res, 200, buildSnapshot(opts.scenarios, user));
      }
      if (req.method === 'GET' && url.pathname === '/progress') return reply(res, 200, buildSnapshot(opts.scenarios, user));
      const m = url.pathname.match(/^\/progress\/scenarios\/([\w-]+)\/done$/);
      if (m && req.method === 'PUT') {
        if (!opts.scenarios.some((s) => s.id === m[1])) return reply(res, 404, { error: 'unknown_scenario' });
        const body = (await readJson(req)) as { done?: unknown };
        if (typeof body.done !== 'boolean') return reply(res, 400, { error: 'invalid_body' });
        if (body.done && (user.turns[m[1]] ?? 0) < 1) return reply(res, 409, { error: 'not_started' }); // chỉ đánh dấu sau ≥ 1 lượt
        if (body.done) user.markedDone.add(m[1]); else user.markedDone.delete(m[1]);
        store.save(id); return reply(res, 200, buildSnapshot(opts.scenarios, user));
      }

      if (req.method === 'POST' && url.pathname === '/chat/stream') {
        const body = await readJson(req);
        if (!validateChatRequest(body)) return reply(res, 400, { error: 'invalid_request' });
        const scenario = opts.scenarios.find((s) => s.id === body.scenarioId);
        if (!scenario) return reply(res, 404, { error: 'unknown_scenario' });
        const form = user.activeForms[scenario.id];
        if (body.interaction) {
          if (!body.interactive || !form || form.formId !== body.interaction.formId) return reply(res, 409, { error: 'expired_interaction' });
          if (!validInteraction(form, body.interaction)) return reply(res, 400, { error: 'invalid_interaction' });
        }
        const input = body.interaction ? interactionMessage(form, body.interaction.values) : body.message ?? '';
        const turnKey = `${id}:${scenario.id}`;
        activeTurns.get(turnKey)?.abort();
        const ac = new AbortController();
        activeTurns.set(turnKey, ac);
        if (body.kind === 'open') { startSession(user, scenario.id); store.save(id); }

        res.on('close', () => ac.abort());                        // client đóng/hủy → hủy cả lời gọi LLM
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', ...CORS });
        // SSE comments reset transport idle timeout while the provider thinks; never fake UI/text.
        const heartbeat = setInterval(() => { if (!ac.signal.aborted && !res.writableEnded) res.write(': keep-alive\n\n'); }, 4000);
        const clearHeartbeat = () => clearInterval(heartbeat);
        ac.signal.addEventListener('abort', clearHeartbeat, { once: true });
        const shown = new Set(user.notesShown[scenario.id] ?? []);
        const ctx = { scenario, profile: user.profile, turnIndex: user.turns[scenario.id] ?? 0, rules: opts.rules, devTriggers: !!opts.dev,
          history: user.history[scenario.id] ?? [], notesShown: shown };
        let corrections = 0; let replyText = ''; let generatedForm: ScenarioFormData | undefined;
        try {
          for await (const step of runTurn({ ...body, message: input }, ctx, opts.engine ?? {}, ac.signal)) {
            if ('stall' in step) {
              if (!ac.signal.aborted) await new Promise<void>((resolve) => ac.signal.addEventListener('abort', () => resolve(), { once: true }));
              res.end(); return;
            }
            await sleep(step.delayMs);
            if (ac.signal.aborted) { res.end(); return; }             // client hủy: dừng, KHÔNG tính lượt
            const e: StreamEvent = step.event;
            if (e.type === 'ui_card' && e.card.type === 'address' && e.card.data.isCorrection) corrections++;
            if (e.type === 'text_delta' && e.partId === 'p1') replyText += e.text;
            if (e.type === 'ui_card' && e.card.type === 'scenario_form') generatedForm = e.card.data;
            if (e.type === 'done' && body.kind !== 'hint') {
              if (body.kind === 'message' && !body.interaction) recordTurn(user, scenario.id, corrections);
              if (generatedForm) user.activeForms[scenario.id] = generatedForm;
              else delete user.activeForms[scenario.id];
              const uiContext = generatedForm ? { title: generatedForm.title, description: generatedForm.description, submitLabel: generatedForm.submitLabel, ...(generatedForm.summary ? { summary: generatedForm.summary } : {}), fields: generatedForm.fields } : null;
              const assistantText = replyText.trim() + (uiContext ? `\nInteractive question: ${JSON.stringify(uiContext)}` : '');
              if (body.kind === 'message' || body.interactive) pushHistory(user, scenario.id, [...(body.kind === 'message' ? [{ role: 'user' as const, text: input }] : []), { role: 'assistant', text: assistantText }]);
              user.notesShown[scenario.id] = [...shown]; store.save(id);
            }
            res.write(formatSseEvent(e));
          }
          return void res.end();
        } finally {
          clearHeartbeat(); ac.signal.removeEventListener('abort', clearHeartbeat);
          if (activeTurns.get(turnKey) === ac) activeTurns.delete(turnKey);
        }
      }
      reply(res, 404, { error: 'not_found' });
    } catch (err) {
      if (!res.headersSent) reply(res, 500, { error: 'internal_error' }); else res.end(); // không lộ chi tiết lỗi
      console.error('[facade]', err instanceof Error ? err.message : err);
    }
  });
  server.on('close', () => store.close());
  return server;
}
