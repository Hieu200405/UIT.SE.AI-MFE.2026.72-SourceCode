import React, { useRef } from 'react';
import type { RemoteFlags } from '@app/shared-types';
import { Icon } from './Icons';

export function Composer({ draft, setDraft, busy, flags, onSend, onHint }: {
  draft: string; setDraft: (v: string) => void; busy: boolean; flags: RemoteFlags; onSend: () => void; onHint: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="chat:flex chat:flex-wrap chat:items-center chat:gap-2">
      <input ref={input} aria-label="Your reply" value={draft} placeholder="Type your reply in Vietnamese…" disabled={busy}
        onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        className="chat:min-w-28 chat:flex-1 chat:rounded-full chat:border chat:border-stone-300 chat:bg-white chat:px-4 chat:py-2 chat:disabled:bg-stone-100" />
      {flags.micButton && (
        // Chỉ hiển thị (clarify #7): không có chức năng, không gọi Web Speech.
        <button type="button" disabled aria-label="Voice input – coming soon" title="Voice input – coming soon" data-testid="mic-button"
          className="chat:flex chat:h-10 chat:w-10 chat:shrink-0 chat:items-center chat:justify-center chat:rounded-full chat:border chat:border-stone-300 chat:bg-white chat:text-stone-700 chat:opacity-60"><Icon name="mic" size={18} /></button>)}
      {flags.hint && (
        <button type="button" disabled={busy} onClick={onHint} data-testid="hint-button"
          aria-label="Need a hint?" className="chat:order-first chat:sm:order-none chat:inline-flex chat:shrink-0 chat:items-center chat:gap-1 chat:whitespace-nowrap chat:rounded-full chat:border chat:border-stone-300 chat:bg-white chat:px-3 chat:py-2 chat:font-semibold chat:text-teal-800 chat:disabled:opacity-50"><Icon name="bulb" size={16} /><span className="chat:sm:hidden">Hint</span><span className="chat:hidden chat:sm:inline">Need a hint?</span></button>)}
      <button type="button" aria-label="Send" disabled={busy || !draft.trim()} onClick={onSend} data-testid="send-button"
        className="chat:flex chat:h-10 chat:w-10 chat:shrink-0 chat:items-center chat:justify-center chat:rounded-full chat:bg-teal-700 chat:text-white chat:disabled:opacity-50"><Icon name="send" size={18} /></button>
    </div>
  );
}
