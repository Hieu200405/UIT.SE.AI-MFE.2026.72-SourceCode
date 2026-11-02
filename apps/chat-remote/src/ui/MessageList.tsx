import React, { useEffect, useRef } from 'react';
import type { ChatItem } from '@app/chat-state';
import { ClarifyCard, renderCard } from './cards';
import { Icon } from './Icons';

function Avatar() {
  return <span className="chat:mt-1 chat:flex chat:h-8 chat:w-8 chat:shrink-0 chat:items-center chat:justify-center chat:rounded-full chat:bg-teal-50 chat:text-teal-700"><Icon name="user" size={16} /></span>;
}

export function MessageList({ items, busy, roleLabel, onStop, onPick }: {
  items: ChatItem[]; busy: boolean; roleLabel: string; onStop: () => void; onPick: (text: string) => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }); }, [items, busy]);
  const lastAgentIdx = items.map((i) => i.kind).lastIndexOf('agent');

  return (
    <div data-testid="messages" className="chat:flex chat:flex-col chat:gap-3" aria-live="polite">
      {items.map((item, idx) => {
        if (item.kind === 'user') {
          return (
            <div key={item.id} data-testid="msg-user" className="chat:ml-auto chat:max-w-md chat:rounded-2xl chat:bg-teal-700 chat:px-4 chat:py-2 chat:text-white">
              <div className="chat:font-semibold">{item.text}</div>
              {item.translation && <div data-testid="user-translation" className="chat:text-sm chat:text-teal-50">{item.translation}</div>}
            </div>);
        }
        if (item.kind === 'clarify') return <ClarifyCard key={item.requestId} item={item} disabled={busy} onPick={onPick} />;
        const streaming = item.status === 'streaming' && busy;
        return (
          <div key={item.requestId} data-testid="msg-agent" className="chat:flex chat:flex-col chat:gap-2">
            {item.parts.map((p, i) => {
              if (p.kind === 'card') return <React.Fragment key={i}>{renderCard(p.card)}</React.Fragment>;
              const isLastPart = i === item.parts.length - 1;
              return (
                <div key={p.partId} className="chat:flex chat:gap-2">
                  <Avatar />
                  <div className="chat:max-w-md chat:rounded-2xl chat:border chat:border-stone-200 chat:bg-white chat:px-4 chat:py-2">
                    <div data-testid="agent-text" className="chat:font-semibold">{p.text}{streaming && isLastPart && <span aria-hidden="true" className="chat:ml-1 chat:inline-block chat:h-4 chat:w-1.5 chat:animate-pulse chat:rounded-sm chat:bg-teal-700 chat:align-middle" />}</div>
                    {p.translation ? <div data-testid="agent-translation" className="chat:text-sm chat:text-stone-500">{p.translation}</div>
                      : streaming && isLastPart ? <div className="chat:mt-1 chat:h-2 chat:w-32 chat:rounded chat:bg-stone-200" /> : null}
                    {item.status === 'interrupted' && isLastPart && <div className="chat:text-xs chat:text-red-700">Incomplete reply</div>}
                  </div>
                </div>);
            })}
            {streaming && idx === lastAgentIdx && null}
          </div>);
      })}
      {busy && (
        <div data-testid="replying" className="chat:ml-10 chat:flex chat:items-center chat:gap-3 chat:text-sm chat:text-stone-500">
          <span className="chat:flex chat:gap-1" aria-hidden="true">{[0, 1, 2].map((d) => <span key={d} className="chat:h-1.5 chat:w-1.5 chat:animate-pulse chat:rounded-full chat:bg-teal-700" />)}</span>
          {roleLabel} is replying
          <button onClick={onStop} className="chat:rounded-full chat:border chat:border-stone-300 chat:bg-white chat:px-3 chat:py-1 chat:font-semibold chat:text-stone-800">▢ Stop</button>
        </div>)}
      <div ref={end} />
    </div>
  );
}
