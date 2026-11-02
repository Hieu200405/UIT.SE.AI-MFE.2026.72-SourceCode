import React, { Suspense, useMemo, useState } from 'react';
import { loadRemote } from './loadRemote';
import { getRemoteProps, getRemotes } from './config';
import type { RemoteName } from './appConfig';

// Error Boundary cấp Remote (Constitution #3). Chỉ bắt lỗi render/lazy-load, KHÔNG bắt lỗi async/event handler.
class ErrorBoundary extends React.Component<{ name: string; fallback: () => React.ReactNode; children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.warn(`[MFE:${this.props.name}]`, error.message); }
  render() { return this.state.error ? this.props.fallback() : this.props.children; }
}

export function RemoteSlot({ name }: { name: RemoteName }) {
  const [attempt, setAttempt] = useState(0);
  const def = getRemotes()[name];
  const Remote = useMemo(() => React.lazy(() => loadRemote(def)), [attempt, def]); // Retry => lazy mới
  const fallback = () => (
    <div role="alert" data-testid={`${name}-fallback`} className="host:flex host:flex-col host:items-center host:gap-2 host:p-10 host:text-center">
      <strong className="host:text-lg">{def.label} is temporarily unavailable</strong>
      <p className="host:text-stone-600">We couldn’t load this section. Your practice conversations and profile are not affected.</p>
      <button className="host:rounded-lg host:bg-teal-700 host:px-5 host:py-2 host:text-white" onClick={() => setAttempt(attempt + 1)}>Retry</button>
    </div>
  );
  return (
    <div data-testid={`${name}-slot`} className="host:rounded-2xl host:border host:border-stone-200 host:bg-white">
      <ErrorBoundary key={attempt} name={name} fallback={fallback}>
        <Suspense fallback={<p className="host:p-4 host:text-stone-500">Loading {def.label}…</p>}><Remote {...getRemoteProps()} /></Suspense>
      </ErrorBoundary>
    </div>
  );
}
