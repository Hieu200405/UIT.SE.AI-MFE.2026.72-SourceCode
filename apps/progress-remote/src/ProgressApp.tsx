import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { eventBus } from '@app/event-bus';
import { createFacadeClient } from '@app/facade-client';
import type { ProgressSnapshot, RemoteProps, Scenario, ScenarioGroup, ScenarioStatus } from '@app/shared-types';
import { chartGeometry, trendSummary } from '@app/chart-geometry';
import './styles.css';

(window.__reactCopies ||= []).push(React);

const GROUPS: Array<[ScenarioGroup, string]> = [['administrative', 'Administrative'], ['daily_life', 'Daily life'], ['social', 'Social']];
const MARK: Record<ScenarioStatus, string> = {
  done: 'progress:border-teal-700 progress:bg-teal-700 progress:text-white',
  in_progress: 'progress:border-teal-700 progress:bg-teal-50',
  new: 'progress:border-dashed progress:border-stone-400',
};
const LABEL: Record<ScenarioStatus, string> = { done: 'Done', in_progress: 'Practicing', new: 'Not tried' };

export default function ProgressApp(props: Partial<RemoteProps>) {
  const facadeUrl = props.facadeUrl ?? 'http://localhost:4000';
  const client = useMemo(() => createFacadeClient({ baseUrl: facadeUrl }), [facadeUrl]);
  const [dev, setDev] = useState(false);
  const [data, setData] = useState<{ scenarios: Scenario[]; progress: ProgressSnapshot } | 'loading' | 'error'>('loading');

  const load = useCallback(() => {
    Promise.all([client.getScenarios(), client.getProgress()]).then(([scenarios, progress]) => setData({ scenarios, progress })).catch(() => setData('error'));
  }, [client]);
  useEffect(load, [load]);
  useEffect(() => { client.getHealth().then((h) => setDev(h.dev)).catch(() => setDev(false)); }, [client]);
  const seed = () => client.dev.seed().then(load).catch(() => setData('error'));
  // Event chỉ là tín hiệu; dữ liệu chuẩn lấy lại từ Facade (Constitution #5)
  useEffect(() => eventBus.subscribe('conversationTurnCompleted', load), [load]);
  useEffect(() => eventBus.subscribe('scenarioStatusChanged', load), [load]);

  if (data === 'loading') return (
    <section data-testid="progress-loading" className="progress:flex progress:flex-col progress:gap-3 progress:p-4">
      <div className="progress:h-6 progress:w-40 progress:rounded progress:bg-stone-200" /><div className="progress:h-24 progress:rounded progress:bg-stone-200" />
    </section>);
  if (data === 'error') return (
    <section role="alert" data-testid="progress-error" className="progress:p-10 progress:text-center">
      <strong className="progress:text-lg">Progress is temporarily unavailable</strong>
      <p className="progress:text-stone-600">We couldn’t load this section. Your practice conversations and profile are not affected.</p>
      <button onClick={load} className="progress:mt-3 progress:rounded-lg progress:bg-teal-700 progress:px-5 progress:py-2 progress:text-white">Retry</button>
    </section>);

  const status = Object.fromEntries(data.progress.scenarios.map((s) => [s.scenarioId, s.status]));
  const { turns, addressingErrors } = data.progress.totals;
  return (
    <section data-testid="progress" className="progress:flex progress:flex-col progress:gap-4 progress:p-4">
      <div><h2 className="progress:text-2xl progress:font-bold">Your progress</h2>
        <p className="progress:text-stone-600">See where you’ve practiced and how your address terms are improving.</p></div>
      {turns === 0 && (
        <div data-testid="progress-empty" className="progress:flex progress:flex-wrap progress:items-center progress:gap-3 progress:rounded-lg progress:bg-stone-100 progress:p-3 progress:text-sm">
          <span>No practice yet. Finish one conversation to see your map and trends.</span>
          {dev && <button data-testid="seed-demo" onClick={seed} className="progress:rounded-lg progress:border progress:border-teal-700 progress:px-3 progress:py-1 progress:font-semibold progress:text-teal-800">Load demo data (development only)</button>}
        </div>)}
      <div className="progress:rounded-2xl progress:border progress:border-stone-200 progress:bg-white progress:p-4">
        <div className="progress:mb-2 progress:flex progress:items-center progress:justify-between"><h3 className="progress:font-bold">Scenario map</h3>
          <span className="progress:text-xs progress:text-stone-500">Done · Practicing · Not tried</span></div>
        <div className="progress:grid progress:gap-3 progress:md:grid-cols-3">
          {GROUPS.map(([g, label]) => (
            <div key={g} className="progress:rounded-xl progress:bg-stone-100 progress:p-3">
              <strong className="progress:text-teal-800">{label}</strong>
              <ul>{data.scenarios.filter((s) => s.group === g).map((s) => {
                const st = status[s.id] ?? 'new';
                return (<li key={s.id} data-testid={`map-${s.id}`} data-status={st} className="progress:flex progress:items-center progress:gap-2 progress:py-1">
                  <span aria-label={LABEL[st]} className={'progress:flex progress:h-5 progress:w-5 progress:items-center progress:justify-center progress:rounded-full progress:border-2 progress:text-xs ' + MARK[st]}>{st === 'done' ? '✓' : ''}</span>{s.title}</li>);
              })}</ul>
            </div>))}
        </div>
      </div>
      <div className="progress:grid progress:gap-4 progress:md:grid-cols-3">
        <div className="progress:rounded-2xl progress:border progress:border-stone-200 progress:bg-white progress:p-4 progress:md:col-span-2">
          <h3 className="progress:font-bold">Address-term mistakes over time</h3>
          <MistakesChart sessions={data.progress.sessions} />
        </div>
        <div data-testid="confidence" className="progress:rounded-2xl progress:border progress:border-stone-200 progress:bg-white progress:p-4">
          <h3 className="progress:font-bold">Confidence</h3>
          <div className="progress:mt-3 progress:flex progress:flex-col progress:gap-3">
            {GROUPS.map(([g, label]) => {
              const v = data.progress.confidence[g] ?? 0;
              return (<div key={g}>
                <div className="progress:text-sm progress:font-semibold">{label}</div>
                <div role="progressbar" aria-label={`${label} confidence`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} data-testid={`confidence-${g}`} data-value={v}
                  className="progress:mt-1 progress:h-2 progress:overflow-hidden progress:rounded-full progress:bg-stone-200">
                  <div className="progress:h-full progress:rounded-full progress:bg-teal-700" style={{ width: `${v}%` }} /></div>
              </div>);
            })}
          </div>
          <p className="progress:mt-3 progress:text-xs progress:text-stone-500">Estimated from scenarios you’ve practiced and how often you picked the right term.</p>
        </div>
      </div>
      <p data-testid="progress-turns" className="progress:text-sm progress:text-stone-600">Turns completed: {turns} · Address-term mistakes so far: {addressingErrors}</p>
    </section>
  );
}

function MistakesChart({ sessions }: { sessions: ProgressSnapshot['sessions'] }) {
  const shown = sessions.slice(-8);                       // 8 buổi gần nhất (như wireframe 8 mốc)
  const values = shown.map((x) => x.addressingErrors);
  if (!values.length) return <p data-testid="chart-empty" className="progress:mt-3 progress:text-sm progress:text-stone-500">Your chart appears after your first completed practice session.</p>;
  const W = 480, H = 220, g = chartGeometry(values, W, H);
  const summary = trendSummary(values);
  return (
    <figure className="progress:mt-2">
      <svg data-testid="mistakes-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Address-term mistakes per practice session: ${values.join(', ')}. ${summary}`} className="progress:h-auto progress:w-full">
        {g.yTicks.map((t) => (<g key={t.label}>
          <line x1={32} x2={W - 12} y1={t.y} y2={t.y} className="progress:stroke-stone-200" />
          <text x={26} y={t.y + 4} textAnchor="end" className="progress:fill-stone-500 progress:text-[11px]">{t.label}</text></g>))}
        <path d={g.areaPath} className="progress:fill-teal-50" />
        <path d={g.linePath} fill="none" className="progress:stroke-teal-700 progress:stroke-2" />
        {g.points.map((p, i) => (<g key={shown[i].index}>
          <circle data-testid="chart-point" data-value={p.value} cx={p.x} cy={p.y} r={4} className="progress:fill-white progress:stroke-teal-700 progress:stroke-2">
            <title>{`Session ${shown[i].index}: ${p.value} mistake${p.value === 1 ? '' : 's'} (${new Date(shown[i].startedAt).toLocaleDateString()})`}</title></circle>
          <text x={p.x} y={H - 8} textAnchor="middle" className="progress:fill-stone-500 progress:text-[11px]">{shown[i].index}</text></g>))}
      </svg>
      <figcaption className="progress:text-xs progress:text-stone-500">Mistakes per practice session (x: session number), using the wrong term for the person you’re talking to. <span data-testid="chart-summary">{summary}</span></figcaption>
    </figure>
  );
}
