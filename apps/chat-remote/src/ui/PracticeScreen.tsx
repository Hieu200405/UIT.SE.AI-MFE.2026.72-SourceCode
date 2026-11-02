import React, { useCallback, useEffect, useState } from 'react';
import { eventBus } from '@app/event-bus';
import type { FacadeClient } from '@app/facade-client';
import type { ProgressSnapshot, Scenario, ScenarioGroup, ScenarioStatus } from '@app/shared-types';
import { Icon } from './Icons';
import { ICON } from './Sidebar';

const GROUPS: Array<[ScenarioGroup, string]> = [['administrative', 'Administrative'], ['daily_life', 'Daily life'], ['social', 'Social']];

function Badge({ status }: { status: ScenarioStatus }) {
  if (status === 'done') return <span data-testid="badge" className="chat:inline-flex chat:items-center chat:gap-1 chat:rounded-full chat:border chat:border-stone-300 chat:bg-white chat:px-2 chat:text-xs chat:font-semibold"><Icon name="check" size={12} />Done</span>;
  if (status === 'in_progress') return <span data-testid="badge" className="chat:rounded-full chat:bg-teal-50 chat:px-2 chat:text-xs chat:font-semibold chat:text-teal-800">In progress</span>;
  return <span data-testid="badge" className="chat:rounded-full chat:bg-stone-100 chat:px-2 chat:text-xs chat:font-semibold chat:text-stone-600">New</span>;
}

export function PracticeScreen({ client, onPick }: { client: FacadeClient; onPick: (s: Scenario) => void }) {
  const [data, setData] = useState<{ scenarios: Scenario[]; progress: ProgressSnapshot | null } | 'loading' | 'error'>('loading');
  const [filter, setFilter] = useState<Set<ScenarioGroup>>(new Set());

  const load = useCallback(() => {
    setData((d) => (typeof d === 'string' ? 'loading' : d));
    // Catalog là bắt buộc; tiến độ là phụ: lỗi tiến độ → ẩn badge, vẫn chọn được tình huống
    Promise.all([client.getScenarios(), client.getProgress().catch(() => null)])
      .then(([scenarios, progress]) => setData({ scenarios, progress })).catch(() => setData('error'));
  }, [client]);
  useEffect(load, [load]);
  useEffect(() => eventBus.subscribe('scenarioStatusChanged', load), [load]);

  const toggle = (g: ScenarioGroup) => { const n = new Set(filter); n.has(g) ? n.delete(g) : n.add(g); setFilter(n); };

  let body: React.ReactNode;
  if (data === 'loading') {
    body = (<div data-testid="practice-loading" className="chat:grid chat:gap-4 chat:sm:grid-cols-2 chat:lg:grid-cols-4">{[0, 1, 2, 3].map((i) => (
      <div key={i} className="chat:rounded-2xl chat:border chat:border-stone-200 chat:bg-white chat:p-4"><div className="chat:h-9 chat:w-9 chat:rounded-lg chat:bg-stone-200" /><div className="chat:mt-3 chat:h-3 chat:w-2/3 chat:rounded chat:bg-stone-200" /><div className="chat:mt-2 chat:h-3 chat:rounded chat:bg-stone-200" /></div>))}</div>);
  } else if (data === 'error') {
    body = (<div role="alert" data-testid="practice-error" className="chat:rounded-2xl chat:border chat:border-stone-200 chat:bg-white chat:p-10 chat:text-center"><strong className="chat:text-lg">Scenarios are temporarily unavailable</strong>
      <p className="chat:text-stone-600">Your progress and profile are not affected.</p>
      <button onClick={load} className="chat:mt-3 chat:rounded-lg chat:bg-teal-700 chat:px-5 chat:py-2 chat:text-white">Retry</button></div>);
  } else {
    const status = Object.fromEntries((data.progress?.scenarios ?? []).map((s) => [s.scenarioId, s.status]));
    const rec = new Set(data.progress?.recommended ?? []);
    const shown = data.scenarios.filter((s) => filter.size === 0 || filter.has(s.group));
    body = shown.length === 0 ? (
      <div data-testid="practice-empty" className="chat:rounded-2xl chat:border chat:border-stone-200 chat:bg-white chat:p-10 chat:text-center"><strong>No scenarios here yet</strong>
        <p className="chat:text-stone-600">Try another group.</p><button onClick={() => setFilter(new Set())} className="chat:mt-3 chat:rounded-lg chat:border chat:border-teal-700 chat:px-4 chat:py-2 chat:font-semibold chat:text-teal-800">Clear filter</button></div>
    ) : (
      <div className="chat:grid chat:gap-4 chat:sm:grid-cols-2 chat:lg:grid-cols-4">
        {shown.map((s) => (
          <button key={s.id} data-testid={`scenario-${s.id}`} data-recommended={rec.has(s.id)} onClick={() => onPick(s)}
            className={'chat:flex chat:flex-col chat:gap-2 chat:rounded-2xl chat:bg-white chat:p-4 chat:text-left chat:hover:shadow-md ' + (rec.has(s.id) ? 'chat:border-2 chat:border-teal-700' : 'chat:border chat:border-stone-200')}>
            {rec.has(s.id) && <span className="chat:text-xs chat:font-semibold chat:text-teal-800">Recommended for you</span>}
            <span className="chat:flex chat:w-full chat:items-start chat:justify-between">
              <span className="chat:flex chat:h-9 chat:w-9 chat:items-center chat:justify-center chat:rounded-lg chat:bg-teal-50 chat:text-teal-700"><Icon name={ICON[s.icon] ?? 'speech'} /></span>
              {data.progress && <Badge status={status[s.id] ?? 'new'} />}
            </span>
            <span className="chat:font-bold">{s.title}</span>
            <span className="chat:text-sm chat:text-stone-600">{s.summary}</span>
          </button>))}
      </div>);
  }
  return (
    <div data-testid="practice-screen" className="chat:flex chat:flex-col chat:gap-4 chat:p-4">
      <div><h2 className="chat:text-3xl chat:font-bold">What do you want to practice today?</h2>
        <p className="chat:text-stone-600">Pick a real-life situation. You’ll chat with an AI character and get tips as you go.</p></div>
      <div className="chat:flex chat:flex-wrap chat:gap-2" role="group" aria-label="Filter by group">
        {GROUPS.map(([g, label]) => (
          <button key={g} aria-pressed={filter.has(g)} onClick={() => toggle(g)}
            className={'chat:rounded-full chat:border chat:border-teal-700 chat:px-4 chat:py-1 chat:font-semibold ' + (filter.has(g) ? 'chat:bg-teal-700 chat:text-white' : 'chat:bg-teal-50 chat:text-teal-800')}>{label}</button>))}
      </div>
      {body}
    </div>
  );
}
