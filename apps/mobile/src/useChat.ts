import { useCallback, useEffect, useReducer, useRef } from 'react';
import { FacadeError } from '@app/facade-client';
import type { FacadeClient } from '@app/facade-client';
import { chatReducer, initialChatState } from '@app/chat-state';
import type { ChatRequest } from '@app/shared-types';

/** Cùng reducer với web (packages/chat-state): quy tắc hủy / sự kiện muộn / lỗi / retry không bị viết lại. */
export function useChat(opts: { client: FacadeClient; scenarioId: string; idleTimeoutMs?: number; onTurnCompleted?: () => void }) {
  const { client, scenarioId, idleTimeoutMs } = opts;
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const abortRef = useRef<AbortController | null>(null);
  const counter = useRef(0);
  const onDone = useRef(opts.onTurnCompleted); onDone.current = opts.onTurnCompleted;
  const newId = () => `req-${Date.now().toString(36)}-${++counter.current}`;

  const run = useCallback(async (req: ChatRequest) => {
    abortRef.current?.abort();
    const ac = new AbortController(); abortRef.current = ac;
    try { await client.streamChat(req, { signal: ac.signal, idleTimeoutMs, onEvent: (event) => dispatch({ type: 'event', event }) }); }
    catch (err) {
      dispatch({ type: 'fail', requestId: req.requestId, message: err instanceof Error ? err.message : 'Connection lost', retryable: err instanceof FacadeError ? err.retryable : true });
    }
  }, [client, idleTimeoutMs]);

  useEffect(() => {
    dispatch({ type: 'reset' });
    const requestId = newId(); dispatch({ type: 'open', requestId }); void run({ requestId, scenarioId, kind: 'open' });
    return () => abortRef.current?.abort();
  }, [scenarioId, run]);

  const published = useRef<string | null>(null);
  useEffect(() => {
    const c = state.current;
    if (c && c.kind === 'message' && c.state === 'completed' && published.current !== c.requestId) { published.current = c.requestId; onDone.current?.(); }
  }, [state.current]);

  const send = useCallback((text: string, translation?: string) => {
    const message = text.trim(); if (!message) return;
    const requestId = newId(); dispatch({ type: 'send', requestId, text: message, translation }); void run({ requestId, scenarioId, kind: 'message', message });
  }, [run, scenarioId]);
  const requestHint = useCallback(() => { const requestId = newId(); dispatch({ type: 'hint', requestId }); void run({ requestId, scenarioId, kind: 'hint' }); }, [run, scenarioId]);
  const stop = useCallback(() => { abortRef.current?.abort(); dispatch({ type: 'stop' }); }, []);
  const retry = useCallback(() => {
    const c = state.current; if (!c || c.state !== 'failed') return;
    const requestId = newId(); dispatch({ type: 'retry', requestId });
    void run({ requestId, scenarioId, kind: c.kind, ...(c.kind === 'message' ? { message: c.text } : {}) });
  }, [run, scenarioId, state.current]);
  return { state, send, stop, retry, requestHint };
}
