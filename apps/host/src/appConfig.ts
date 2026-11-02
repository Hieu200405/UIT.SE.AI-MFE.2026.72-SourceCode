// Cấu hình chạy của Host, nạp từ /config.json lúc khởi động (Architecture §8: URL Remote theo môi trường dev/staging/prod).
// Cùng một image/bản build dùng cho mọi môi trường; chỉ file config.json thay đổi (sinh từ biến môi trường: scripts/gen-config.cjs).
export type RemoteName = 'chat' | 'progress' | 'personalization';
export interface AppConfig { facadeUrl: string; remotes: Record<RemoteName, string> }

export const DEFAULT_CONFIG: AppConfig = {
  facadeUrl: 'http://localhost:4000',
  remotes: { chat: 'http://localhost:3001/remoteEntry.js', progress: 'http://localhost:3002/remoteEntry.js', personalization: 'http://localhost:3003/remoteEntry.js' },
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Chỉ http/https (chặn javascript:, data:, file:…) vì URL Remote quyết định mã nào được nạp. */
const httpUrl = (v: unknown): URL | null => { if (typeof v !== 'string') return null; try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' ? u : null; } catch { return null; } };

/** Mỗi trường sai/thiếu → dùng giá trị mặc định và ghi lỗi (không làm sập ứng dụng; Host hiển thị cảnh báo). */
export function parseAppConfig(raw: unknown): { config: AppConfig; errors: string[] } {
  const errors: string[] = [];
  const o = isObj(raw) ? raw : (errors.push('config.json must be a JSON object'), {} as Record<string, unknown>);
  const remotesRaw = isObj(o.remotes) ? o.remotes : (o.remotes === undefined ? {} : (errors.push('remotes: must be an object'), {}));

  const facade = httpUrl(o.facadeUrl);
  if (!facade) errors.push(o.facadeUrl === undefined ? 'facadeUrl: missing' : 'facadeUrl: must be an http(s) URL');
  const remotes = { ...DEFAULT_CONFIG.remotes };
  for (const name of Object.keys(remotes) as RemoteName[]) {
    const u = httpUrl((remotesRaw as Record<string, unknown>)[name]);
    if (u && u.pathname.endsWith('.js')) remotes[name] = u.toString();
    else errors.push(`remotes.${name}: ${(remotesRaw as Record<string, unknown>)[name] === undefined ? 'missing' : 'must be an http(s) URL ending in .js'}`);
  }
  return { config: { facadeUrl: facade ? facade.toString().replace(/\/+$/, '') : DEFAULT_CONFIG.facadeUrl, remotes }, errors };
}

export async function loadAppConfig(fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<{ config: AppConfig; errors: string[] }> {
  try {
    const res = await fetchImpl('/config.json', { cache: 'no-store' });
    if (!res.ok) return { config: DEFAULT_CONFIG, errors: [`config.json not found (HTTP ${res.status})`] };
    return parseAppConfig(await res.json());
  } catch {
    return { config: DEFAULT_CONFIG, errors: ['config.json could not be loaded'] };
  }
}
