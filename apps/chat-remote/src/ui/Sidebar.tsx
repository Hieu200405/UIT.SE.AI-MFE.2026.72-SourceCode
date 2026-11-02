import React, { useState } from 'react';
import type { Profile, Scenario, ScenarioStatus } from '@app/shared-types';
import { Icon } from './Icons';

export const ICON: Record<string, string> = { home: 'home', medical: 'medical', document: 'document', bank: 'bank', basket: 'basket', people: 'people', heart: 'heart', bowl: 'bowl' };

export function Sidebar({ scenario, profile, status, onChange, onToggleDone, doneError }: {
  scenario: Scenario; profile: Profile | null; status: ScenarioStatus; onChange: () => void; onToggleDone: () => void; doneError: string | null;
}) {
  const c = scenario.character;
  const [ticked, setTicked] = useState<Record<string, boolean>>({}); // chỉ là checklist gợi ý (clarify #12), không đánh giá tự động
  return (
    <aside className="chat:hidden chat:w-64 chat:shrink-0 chat:flex-col chat:gap-3 chat:border-r chat:border-stone-200 chat:bg-white chat:p-4 chat:md:flex">
      <div>
        <div className="chat:text-xs chat:text-stone-500">Scenario</div>
        <h2 data-testid="scenario-title" className="chat:text-xl chat:font-bold">{scenario.title}</h2>
        <p className="chat:text-sm chat:text-stone-600">{scenario.summary}</p>
      </div>
      <div className="chat:flex chat:items-center chat:gap-3 chat:rounded-xl chat:bg-stone-100 chat:p-3">
        <span className="chat:flex chat:h-9 chat:w-9 chat:items-center chat:justify-center chat:rounded-full chat:bg-teal-50 chat:text-teal-700"><Icon name="user" size={18} /></span>
        <div><div className="chat:text-xs chat:text-stone-500">AI character</div><div data-testid="character" className="chat:text-sm chat:font-semibold">{c.roleLabel}, {c.gender}, ~{c.ageApprox}</div></div>
      </div>
      <div>
        <div className="chat:mb-1 chat:text-xs chat:text-stone-500">Your context</div>
        <div className="chat:flex chat:flex-wrap chat:gap-2">
          {profile?.age != null && <span data-testid="ctx-age" className="chat:rounded-full chat:bg-teal-50 chat:px-3 chat:py-1 chat:text-sm chat:font-semibold chat:text-teal-800">You: {profile.age}</span>}
          <span data-testid="ctx-rel" className="chat:rounded-full chat:bg-teal-50 chat:px-3 chat:py-1 chat:text-sm chat:font-semibold chat:text-teal-800">Relationship: {c.relationship.replace(/_/g, ' ')}</span>
        </div>
      </div>
      <div data-testid="objectives">
        <div className="chat:mb-1 chat:text-xs chat:text-stone-500">Goals (just a guide)</div>
        {scenario.objectives.map((o) => (
          <label key={o} className="chat:flex chat:items-start chat:gap-2 chat:py-0.5 chat:text-sm">
            <input type="checkbox" checked={!!ticked[o]} onChange={(e) => setTicked({ ...ticked, [o]: e.target.checked })} className="chat:mt-1" />{o}
          </label>))}
        <button data-testid="mark-done" disabled={status === 'new'} onClick={onToggleDone}
          className="chat:mt-2 chat:w-full chat:rounded-lg chat:border chat:border-teal-700 chat:px-3 chat:py-2 chat:font-semibold chat:text-teal-800 chat:disabled:opacity-50">
          {status === 'done' ? '✓ Marked as done (undo)' : 'Mark as done'}
        </button>
        {status === 'new' && <p className="chat:mt-1 chat:text-xs chat:text-stone-500">Available after your first completed turn.</p>}
        {doneError && <p role="alert" className="chat:mt-1 chat:text-xs chat:text-red-700">{doneError}</p>}
      </div>
      <button onClick={onChange} className="chat:mt-auto chat:rounded-xl chat:border chat:border-stone-300 chat:bg-white chat:px-3 chat:py-2 chat:font-semibold">Change scenario</button>
    </aside>
  );
}
