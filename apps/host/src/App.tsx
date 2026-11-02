import React from 'react';
import { RemoteSlot } from './RemoteSlot';
import { getConfigErrors } from './config';
import { useRoute } from './router';

const TABS = [
  { path: '/chat', label: 'Practice' },
  { path: '/progress', label: 'Progress' },
  { path: '/personalization', label: 'Profile' },
];

export function App() {
  const { path, navigate } = useRoute();
  let content: React.ReactNode;
  if (path === '/chat') content = <RemoteSlot name="chat" />;
  else if (path === '/progress') content = <RemoteSlot name="progress" />;
  else if (path === '/personalization') content = <RemoteSlot name="personalization" />;
  else if (path === '/lab') content = ( // Dev: nhiều Remote cùng lúc (kiểm thử CSS/event-bus, Architecture §7)
    <div className="host:flex host:flex-col host:gap-4">
      <RemoteSlot name="chat" /><RemoteSlot name="progress" /><RemoteSlot name="personalization" />
    </div>);
  else if (path === '/') content = null;
  else content = <p data-testid="not-found" className="host:p-10 host:text-center">Page not found.</p>;

  const link = (t: { path: string; label: string }, cls: (on: boolean) => string) => (
    <a key={t.path} href={t.path} aria-current={path === t.path ? 'page' : undefined}
       onClick={(e) => { e.preventDefault(); navigate(t.path); }} className={cls(path === t.path)}>{t.label}</a>);

  return (
    <div className="host:min-h-screen host:bg-[#f4f4f2] host:text-stone-900">
      <header className="host:flex host:items-center host:gap-8 host:border-b host:border-stone-200 host:bg-white host:px-6">
        <span data-testid="host-title" className="host:py-4 host:font-bold">Vietnamese for real life</span>
        <nav aria-label="Main" className="host:hidden host:gap-6 host:md:flex">
          {TABS.map((t) => link(t, (on) => 'host:py-4 ' + (on ? 'host:border-b-2 host:border-teal-700 host:font-semibold host:text-teal-800' : 'host:text-stone-600')))}
        </nav>
      </header>
      {getConfigErrors().length > 0 && (
        <p role="alert" data-testid="config-warning" className="host:bg-amber-100 host:px-6 host:py-2 host:text-sm host:text-amber-900">
          Configuration problem – using default values. {getConfigErrors().join('; ')}
        </p>)}
      <main className="host:mx-auto host:max-w-6xl host:p-4 host:pb-24 host:md:p-6 host:md:pb-6">{content}</main>
      <nav aria-label="Bottom" data-testid="bottom-nav" className="host:fixed host:inset-x-0 host:bottom-0 host:flex host:border-t host:border-stone-200 host:bg-white host:md:hidden">
        {TABS.map((t) => link(t, (on) => 'host:flex-1 host:py-3 host:text-center ' + (on ? 'host:font-semibold host:text-teal-800' : 'host:text-stone-600')))}
      </nav>
    </div>
  );
}
