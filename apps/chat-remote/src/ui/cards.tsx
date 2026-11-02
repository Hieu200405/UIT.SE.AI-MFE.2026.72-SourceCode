import React, { useState } from 'react';
import type { AddressCardData, CulturalNoteData, UICardSpec } from '@app/shared-types';
import { Icon } from './Icons';
import type { ChatItem, Suggestion } from '@app/chat-state';

export function AddressCard({ data }: { data: AddressCardData }) {
  return (
    <div data-testid="card-address" className="chat:ml-auto chat:w-full chat:max-w-md chat:rounded-2xl chat:border chat:border-blue-200 chat:bg-blue-50 chat:p-3 chat:text-blue-900">
      <div className="chat:mb-2 chat:flex chat:items-center chat:gap-2 chat:text-sm chat:font-semibold"><Icon name="speech" size={16} />Address term</div>
      <div className="chat:text-xs chat:font-semibold">You said</div>
      <div className="chat:mb-2 chat:text-sm chat:line-through">{data.originalText}</div>
      <div className="chat:text-xs chat:font-semibold">Suggested</div>
      <div data-testid="address-suggested" className="chat:mb-2 chat:rounded-lg chat:border chat:border-blue-200 chat:bg-white chat:px-3 chat:py-2 chat:font-semibold">{data.suggestedText}</div>
      <p className="chat:text-sm"><strong>Reason:</strong> {data.explanation}</p>
      {data.assumptions?.map((a) => <p key={a} data-testid="address-assumption" className="chat:mt-1 chat:text-xs">Assumption: {a}</p>)}
      <p className="chat:mt-1 chat:text-xs chat:text-blue-700">Usage may vary by region/family.</p>
    </div>
  );
}

export function CulturalNoteCard({ data }: { data: CulturalNoteData }) {
  const [open, setOpen] = useState(() => (typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 768px)').matches : true));
  return (
    <div data-testid="card-cultural" className="chat:w-full chat:max-w-md chat:rounded-2xl chat:border chat:border-amber-200 chat:bg-amber-50 chat:p-3 chat:text-amber-900">
      <button className="chat:flex chat:w-full chat:items-center chat:gap-2 chat:text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="bulb" size={16} /><span className="chat:text-sm chat:font-semibold">{open ? 'Cultural note' : data.title}</span>
        {!data.verified && <span data-testid="sample-badge" className="chat:ml-auto chat:rounded-full chat:bg-amber-200 chat:px-2 chat:text-xs chat:font-medium">Sample text</span>}
        <Icon name="chevron" size={16} className={(data.verified ? 'chat:ml-auto ' : '') + (open ? 'chat:rotate-180' : '')} />
      </button>
      {open && (<><div className="chat:mt-2 chat:font-semibold">{data.title}</div><p className="chat:text-sm">{data.explanation}</p></>)}
    </div>
  );
}

export function renderCard(card: UICardSpec): React.ReactNode {
  // UI registry đóng (Constitution #11): chỉ 3 loại; loại lạ đã bị client lọc, đây là lớp phòng thủ cuối.
  switch (card.type) {
    case 'address': return <AddressCard data={card.data} />;
    case 'cultural_note': return <CulturalNoteCard data={card.data} />;
    default: return null; // reply_suggestion hiển thị ở dải gợi ý, không nằm trong luồng tin nhắn
  }
}

export function ClarifyCard({ item, disabled, onPick }: { item: Extract<ChatItem, { kind: 'clarify' }>; disabled: boolean; onPick: (text: string) => void }) {
  return (
    <div data-testid="card-clarify" className="chat:w-full chat:max-w-md chat:rounded-2xl chat:bg-blue-50 chat:p-3 chat:text-blue-900">
      <div className="chat:text-sm chat:font-semibold">Quick question</div>
      <p className="chat:text-sm">{item.question}</p>
      {!item.answered && (
        <div className="chat:mt-2 chat:flex chat:flex-wrap chat:gap-2">
          {item.options.map((o) => (
            <button key={o} disabled={disabled} onClick={() => onPick(o)} className="chat:rounded-full chat:border chat:border-teal-700 chat:px-3 chat:py-1 chat:text-sm chat:font-semibold chat:text-teal-700 chat:disabled:opacity-50">{o}</button>))}
        </div>)}
      {item.assumptions.map((a) => <p key={a} className="chat:mt-2 chat:text-xs">Assumption for now: {a}</p>)}
    </div>
  );
}

export function SuggestionsStrip({ suggestions, onPick }: { suggestions: Suggestion[]; onPick: (s: Suggestion) => void }) {
  return (
    <div data-testid="suggestions" className="chat:rounded-2xl chat:border chat:border-green-200 chat:bg-green-50 chat:p-3">
      <div className="chat:mb-2 chat:flex chat:items-center chat:gap-1 chat:text-sm chat:font-semibold chat:text-green-900"><Icon name="check" size={14} />Reply suggestions</div>
      <div className="chat:flex chat:gap-2 chat:overflow-x-auto">
        {suggestions.map((s) => (
          <button key={s.text} onClick={() => onPick(s)} className="chat:min-w-48 chat:flex-1 chat:rounded-lg chat:border chat:border-green-200 chat:bg-white chat:px-3 chat:py-2 chat:text-left">
            <div className="chat:text-sm chat:font-semibold chat:text-green-900">{s.text}</div>
            <div className="chat:text-xs chat:text-stone-500">{s.translation}</div>
          </button>))}
      </div>
    </div>
  );
}

export function ErrorBanner({ message, retryable, onRetry }: { message: string; retryable: boolean; onRetry: () => void }) {
  return (
    <div role="alert" data-testid="chat-error" className="chat:rounded-2xl chat:bg-red-50 chat:p-3 chat:text-red-900">
      <div className="chat:flex chat:items-center chat:gap-2 chat:font-semibold"><Icon name="alert" size={16} />Reply interrupted</div>
      <p className="chat:text-sm">{message}. Your practice isn’t affected.</p>
      <div className="chat:mt-2 chat:flex chat:items-center chat:gap-3">
        {retryable && <button onClick={onRetry} className="chat:inline-flex chat:items-center chat:gap-1 chat:rounded-lg chat:bg-teal-700 chat:px-3 chat:py-1 chat:text-white"><Icon name="refresh" size={14} />Retry</button>}
        <span className="chat:text-xs">or type a new message</span>
      </div>
    </div>
  );
}
