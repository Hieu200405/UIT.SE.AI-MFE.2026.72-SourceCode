// Dynamic Remote loader (ADR-001): cho phép Retry thật sự khi Remote tắt/lỗi lúc khởi động.
// Quy trình: tải remoteEntry.js -> init(shareScope) -> get(module) -> factory().
import type { ComponentType } from 'react';
import type { RemoteProps } from '@app/shared-types';
import type { RemoteDef } from './remotes.config';

const inited = new Set<string>();

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    s.onload = () => resolve();
    s.onerror = () => { s.remove(); reject(new Error('Cannot load remote entry: ' + url)); };
    document.head.appendChild(s);
  });
}

export async function loadRemote(def: RemoteDef): Promise<{ default: ComponentType<Partial<RemoteProps>> }> {
  if (!window[def.scope]) await loadScript(def.url);
  await __webpack_init_sharing__('default');                  // Host khởi tạo Shared Scope
  const container = window[def.scope];
  if (!inited.has(def.scope)) { await container.init(__webpack_share_scopes__.default); inited.add(def.scope); } // handshake
  const factory = await container.get(def.module);            // chunk thật được tải ở đây
  return factory();
}
