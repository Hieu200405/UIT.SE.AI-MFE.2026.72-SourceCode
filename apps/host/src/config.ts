import type { RemoteProps } from '@app/shared-types';
import { DEFAULT_CONFIG } from './appConfig';
import type { AppConfig, RemoteName } from './appConfig';
import { REMOTE_META } from './remotes.config';
import type { RemoteDef } from './remotes.config';

// Cấu hình hiện hành: được đặt MỘT lần ở bootstrap, sau khi nạp /config.json.
let current: { config: AppConfig; errors: string[] } = { config: DEFAULT_CONFIG, errors: [] };
export function setAppConfig(config: AppConfig, errors: string[]) { current = { config, errors }; }
export const getConfigErrors = () => current.errors;

export function getRemotes(): Record<RemoteName, RemoteDef> {
  const r = current.config.remotes;
  return Object.fromEntries((Object.keys(REMOTE_META) as RemoteName[]).map((k) => [k, { ...REMOTE_META[k], url: r[k] }])) as Record<RemoteName, RemoteDef>;
}

// Tham số URL chỉ để phát triển/kiểm thử; ?facade= chỉ được chấp nhận khi chạy trên localhost.
const q = new URLSearchParams(window.location.search);
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
export function getRemoteProps(): RemoteProps {
  return {
    facadeUrl: (isLocal && q.get('facade')) || current.config.facadeUrl,
    flags: { hint: q.get('hint') !== '0', micButton: q.get('mic') !== '0' },   // ?mic=0 ẩn nút micro, ?hint=0 ẩn "Need a hint?"
    streamIdleTimeoutMs: Number(q.get('streamTimeout')) || 15_000,
  };
}
