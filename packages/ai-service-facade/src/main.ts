import { readFileSync } from 'node:fs';
import type { Scenario } from '@app/shared-types';
import { loadRules } from '../../rules-xung-ho/src/load-node.ts';
import { DailyBudget, RateLimiter } from './llm.ts';
import { createFacade } from './server.ts';
import { SqliteStore } from './sqlite-store.ts';

const env = process.env;
const scenarios: Scenario[] = JSON.parse(readFileSync(new URL('../data/scenarios.json', import.meta.url), 'utf-8')).scenarios;
const port = Number(env.PORT ?? 4000);

// Chế độ LLM chỉ bật khi có ĐỦ cả 3 biến. Khóa chỉ nằm trong biến môi trường (Constitution #8), không bao giờ ghi log.
const llm = env.LLM_API_KEY && env.LLM_BASE_URL && env.LLM_MODEL
  ? { baseUrl: env.LLM_BASE_URL, apiKey: env.LLM_API_KEY, model: env.LLM_MODEL, timeoutMs: Number(env.LLM_TIMEOUT_MS ?? 20_000) } : undefined;

const server = createFacade({
  scenarios, rules: loadRules(),
  delayScale: Number(env.FACADE_DELAY_SCALE ?? 1), dev: env.FACADE_DEV === '1', corsOrigin: env.CORS_ORIGIN || '*',
  store: env.FACADE_DB ? new SqliteStore(env.FACADE_DB) : undefined,
  engine: { llm, fallback: env.LLM_FALLBACK === 'mock' ? 'mock' : 'error',
    limiter: new RateLimiter(Number(env.LLM_MAX_RPM ?? 20)),            // dưới hạn mức 30 RPM của free tier
    budget: new DailyBudget(Number(env.LLM_DAILY_TOKEN_BUDGET ?? 0)) }, // 0 = không giới hạn
});
server.listen(port, () => console.log(
  `Facade http://localhost:${port} · chế độ: ${llm ? `LLM (${llm.model})` : 'mock'} · lưu trữ: ${env.FACADE_DB ? env.FACADE_DB : 'bộ nhớ'}` +
  `${env.FACADE_DEV === '1' ? ' · DEV' : ''}${llm && env.LLM_FALLBACK === 'mock' ? ' · fallback=mock' : ''}`));
