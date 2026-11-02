import React, { useCallback, useEffect, useState } from 'react';
import { eventBus } from '@app/event-bus';
import type { FacadeClient } from '@app/facade-client';
import type { Profile, RemoteFlags, Scenario, ScenarioStatus } from '@app/shared-types';
import { useChat } from '../useChat';
import { isBusy } from '@app/chat-state';
import { Composer } from './Composer';
import { ErrorBanner, SuggestionsStrip } from './cards';
import { MessageList } from './MessageList';
import { Sidebar } from './Sidebar';
import { Icon } from './Icons';

export function ChatScreen({ client, scenario, flags, idleTimeoutMs, onBack, onCrash }: {
  client: FacadeClient; scenario: Scenario; flags: RemoteFlags; idleTimeoutMs?: number; onBack: () => void; onCrash: () => void;
}) {
  const { state, send, stop, retry, requestHint } = useChat({ client, scenarioId: scenario.id, idleTimeoutMs });
  const [draft, setDraft] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<ScenarioStatus>('new');
  const [doneError, setDoneError] = useState<string | null>(null);
  const busy = isBusy(state);

  const loadProfile = useCallback(() => { client.getProfile().then(setProfile).catch(() => setProfile(null)); }, [client]);
  const loadStatus = useCallback(() => {
    client.getProgress().then((p) => setStatus(p.scenarios.find((s) => s.scenarioId === scenario.id)?.status ?? 'new')).catch(() => {});
  }, [client, scenario.id]);

  useEffect(loadProfile, [loadProfile]);
  useEffect(loadStatus, [loadStatus]);
  useEffect(() => eventBus.subscribe('profileUpdated', loadProfile), [loadProfile]);   // event chỉ là tín hiệu → lấy lại từ Facade
  useEffect(() => { if (state.current?.state === 'completed' && state.current.kind === 'message') loadStatus(); }, [state.current?.state, state.current?.requestId, loadStatus]);

  const toggleDone = async () => {
    setDoneError(null);
    try {
      const snap = await client.setScenarioDone(scenario.id, status !== 'done');
      const next = snap.scenarios.find((s) => s.scenarioId === scenario.id)?.status ?? 'new';
      setStatus(next);
      eventBus.publish({ type: 'scenarioStatusChanged', payload: { scenarioId: scenario.id, status: next } });
    } catch { setDoneError('Couldn’t update this scenario. Please try again.'); }
  };
  const submit = () => {
    const text = draft.trim(); if (!text || busy) return;
    if (text === '/crash') return onCrash();            // chỉ dùng để thử Error Boundary khi phát triển
    setDraft(''); send(text);
  };
  const cur = state.current;

  return (
    <div data-testid="chat-screen" className="chat:flex chat:min-h-[32rem] chat:flex-col chat:md:flex-row">
      <header className="chat:flex chat:items-center chat:gap-2 chat:border-b chat:border-stone-200 chat:bg-white chat:px-3 chat:py-2 chat:md:hidden">
        <button aria-label="Back" onClick={onBack}><Icon name="back" /></button>
        <div className="chat:flex-1"><div className="chat:font-bold">{scenario.title}</div><div className="chat:text-xs chat:text-stone-500">{scenario.character.roleLabel}, {scenario.character.gender}, ~{scenario.character.ageApprox}{profile?.age != null ? ` · You: ${profile.age}` : ''}</div></div>
        <button onClick={onBack} className="chat:font-semibold chat:text-teal-800">Change</button>
      </header>
      <Sidebar scenario={scenario} profile={profile} status={status} onChange={onBack} onToggleDone={toggleDone} doneError={doneError} />
      <section className="chat:flex chat:min-w-0 chat:flex-1 chat:flex-col chat:gap-3 chat:p-3 chat:md:p-4">
        <div className="chat:mx-auto chat:flex chat:w-full chat:max-w-2xl chat:flex-1 chat:flex-col chat:gap-3">
          <div className="chat:flex-1">
            <MessageList items={state.items} busy={busy} roleLabel={scenario.character.roleLabel} onStop={stop} onPick={(t) => send(t)} />
          </div>
          {cur?.state === 'cancelled' && <p data-testid="stopped" role="status" className="chat:ml-10 chat:text-sm chat:text-stone-500">Reply stopped. You can send a new message.</p>}
          {cur?.state === 'failed' && cur.error && <ErrorBanner message={cur.error.message} retryable={cur.error.retryable} onRetry={retry} />}
          {state.suggestions && <SuggestionsStrip suggestions={state.suggestions} onPick={(s) => setDraft(s.text)} />}
          <Composer draft={draft} setDraft={setDraft} busy={busy} flags={flags} onSend={submit} onHint={requestHint} />
        </div>
      </section>
    </div>
  );
}
