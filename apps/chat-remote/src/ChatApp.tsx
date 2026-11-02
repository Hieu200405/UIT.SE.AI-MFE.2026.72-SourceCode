import React, { useMemo, useState } from 'react';
import { createFacadeClient } from '@app/facade-client';
import type { RemoteProps, Scenario } from '@app/shared-types';
import { ChatScreen } from './ui/ChatScreen';
import { PracticeScreen } from './ui/PracticeScreen';
import './styles.css';

(window.__reactCopies ||= []).push(React); // chỉ để kiểm chứng singleton trong test

const DEFAULTS: RemoteProps = { facadeUrl: 'http://localhost:4000', flags: { hint: true, micButton: true } };

export default function ChatApp(props: Partial<RemoteProps>) {
  const cfg = { ...DEFAULTS, ...props };
  const client = useMemo(() => createFacadeClient({ baseUrl: cfg.facadeUrl }), [cfg.facadeUrl]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [crash, setCrash] = useState(false);
  if (crash) throw new Error('chat render error (demo)');   // kích hoạt bằng gõ "/crash"
  return (
    <section data-testid="chat" className="chat:text-stone-900">
      {scenario
        ? <ChatScreen client={client} scenario={scenario} flags={cfg.flags} idleTimeoutMs={cfg.streamIdleTimeoutMs} onBack={() => setScenario(null)} onCrash={() => setCrash(true)} />
        : <PracticeScreen client={client} onPick={setScenario} />}
    </section>
  );
}
