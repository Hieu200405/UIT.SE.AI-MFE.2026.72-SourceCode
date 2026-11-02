import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { isBusy } from '@app/chat-state';
import type { ChatItem } from '@app/chat-state';
import type { Profile, Scenario, ScenarioStatus } from '@app/shared-types';
import { useFacade } from '../api/FacadeProvider';
import { C, radius } from '../theme';
import { ClarifyCard, ErrorBanner, SuggestionsStrip, renderCard } from '../ui/cards';
import { Icon } from '../ui/Icon';
import { useChat } from '../useChat';

const MIC_ENABLED = false; // Nút micro: chỉ hiển thị, không chức năng (clarify #7). Đặt true để hiện nút.
const SHOW_MIC_BUTTON = true;

export default function ChatScreen({ scenario }: { scenario: Scenario }) {
  const { client, idleTimeoutMs } = useFacade(); const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<ScenarioStatus>('new');
  const [doneError, setDoneError] = useState<string | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');
  const list = useRef<FlatList<ChatItem>>(null);

  const loadStatus = useCallback(() => { client.getProgress().then((p) => setStatus(p.scenarios.find((s) => s.scenarioId === scenario.id)?.status ?? 'new')).catch(() => {}); }, [client, scenario.id]);
  const { state, send, stop, retry, requestHint } = useChat({ client, scenarioId: scenario.id, idleTimeoutMs, onTurnCompleted: loadStatus });
  useEffect(() => { client.getProfile().then(setProfile).catch(() => setProfile(null)); loadStatus(); }, [client, loadStatus]);

  const busy = isBusy(state); const cur = state.current;
  const c = scenario.character;
  const submit = () => { const t = draft.trim(); if (!t || busy) return; setDraft(''); send(t); };
  const toggleDone = async () => {
    setDoneError(null);
    try { const snap = await client.setScenarioDone(scenario.id, status !== 'done'); setStatus(snap.scenarios.find((s) => s.scenarioId === scenario.id)?.status ?? 'new'); }
    catch { setDoneError('Couldn’t update this scenario. Please try again.'); }
  };
  const back = () => router.back();

  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.kind === 'user') return (
      <View testID="msg-user" style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: C.teal, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{item.text}</Text>
        {item.translation ? <Text testID="user-translation" style={{ color: C.tealBg2, fontSize: 13 }}>{item.translation}</Text> : null}
      </View>);
    if (item.kind === 'clarify') return <ClarifyCard item={item} disabled={busy} onPick={(t) => send(t)} />;
    return (
      <View testID="msg-agent" style={{ gap: 8 }}>
        {item.parts.map((p, i) => p.kind === 'card' ? <View key={i}>{renderCard(p.card)}</View> : (
          <View key={p.partId} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.tealBg, alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={16} /></View>
            <View style={{ flexShrink: 1, maxWidth: '85%', backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text testID="agent-text" style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>{p.text}{item.status === 'streaming' && busy && i === item.parts.length - 1 ? ' ▍' : ''}</Text>
              {p.translation ? <Text testID="agent-translation" style={{ color: C.faint, fontSize: 13 }}>{p.translation}</Text> : null}
              {item.status === 'interrupted' && i === item.parts.length - 1 ? <Text style={{ color: C.redInk, fontSize: 12 }}>Incomplete reply</Text> : null}
            </View>
          </View>))}
      </View>);
  };

  const footer = (
    <View style={{ gap: 10, paddingTop: 10 }}>
      {busy && <View testID="replying" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 38 }}>
        <Text style={{ color: C.faint }}>{c.roleLabel} is replying</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Stop" onPress={stop} style={{ borderColor: C.field, borderWidth: 1, borderRadius: radius.pill, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4 }}><Text style={{ fontWeight: '700' }}>▢ Stop</Text></Pressable></View>}
      {cur?.state === 'cancelled' && <Text testID="stopped" style={{ color: C.faint, marginLeft: 38 }}>Reply stopped. You can send a new message.</Text>}
      {cur?.state === 'failed' && cur.error && <ErrorBanner message={cur.error.message} retryable={cur.error.retryable} onRetry={retry} />}
    </View>);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: C.card, paddingTop: 52, paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} hitSlop={10}><Icon name="back" color={C.ink} /></Pressable>
          <View style={{ flex: 1 }}>
            <Text testID="scenario-title" style={{ fontWeight: '800', fontSize: 17, color: C.ink }}>{scenario.title}</Text>
            <Text testID="character" style={{ color: C.faint, fontSize: 12 }}>{c.roleLabel}, {c.gender}, ~{c.ageApprox}{profile?.age != null ? ` · You: ${profile.age}` : ''}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setGoalsOpen(!goalsOpen)}><Text style={{ color: C.tealDark, fontWeight: '700' }}>Goals</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={back}><Text style={{ color: C.tealDark, fontWeight: '700' }}>Change</Text></Pressable>
        </View>
        {goalsOpen && <View testID="goals" style={{ paddingVertical: 8 }}>
          {scenario.objectives.map((o) => <Pressable key={o} accessibilityRole="checkbox" accessibilityState={{ checked: !!ticked[o] }} onPress={() => setTicked({ ...ticked, [o]: !ticked[o] })}>
            <Text style={{ paddingVertical: 2 }}>{ticked[o] ? '☑' : '☐'} {o}</Text></Pressable>)}
          <Pressable testID="mark-done" accessibilityRole="button" disabled={status === 'new'} onPress={toggleDone}
            style={{ marginTop: 6, borderColor: C.teal, borderWidth: 1, borderRadius: radius.field, padding: 8, alignItems: 'center', opacity: status === 'new' ? 0.5 : 1 }}>
            <Text style={{ color: C.tealDark, fontWeight: '700' }}>{status === 'done' ? '✓ Marked as done (undo)' : 'Mark as done'}</Text></Pressable>
          {status === 'new' && <Text style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>Available after your first completed turn.</Text>}
          {doneError && <Text accessibilityRole="alert" style={{ color: C.redInk, fontSize: 12 }}>{doneError}</Text>}
        </View>}
      </View>

      <FlatList ref={list} testID="messages" data={state.items} keyExtractor={(i, idx) => (i.kind === 'user' ? i.id : `${i.requestId}-${idx}`)} renderItem={renderItem}
        contentContainerStyle={{ padding: 12, gap: 10 }} ItemSeparatorComponent={() => <View style={{ height: 4 }} />} ListFooterComponent={footer}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })} />

      <View style={{ padding: 10, gap: 8, backgroundColor: C.bg }}>
        {state.suggestions && <SuggestionsStrip suggestions={state.suggestions} onPick={(s) => setDraft(s.text)} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable testID="hint-button" accessibilityRole="button" accessibilityLabel="Need a hint?" disabled={busy} onPress={requestHint}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderColor: C.field, borderWidth: 1, borderRadius: radius.pill, backgroundColor: '#fff', paddingHorizontal: 12, height: 40, opacity: busy ? 0.5 : 1 }}>
            <Icon name="bulb" size={16} /><Text style={{ color: C.tealDark, fontWeight: '700' }}>Hint</Text></Pressable>
          <TextInput testID="reply-input" accessibilityLabel="Your reply" value={draft} onChangeText={setDraft} editable={!busy} placeholder="Reply in Vietnamese…" onSubmitEditing={submit} returnKeyType="send"
            style={{ flex: 1, minWidth: 80, height: 40, borderRadius: radius.pill, borderColor: C.field, borderWidth: 1, backgroundColor: busy ? C.stoneBg : '#fff', paddingHorizontal: 14 }} />
          {SHOW_MIC_BUTTON && <Pressable testID="mic-button" accessibilityRole="button" accessibilityLabel="Voice input – coming soon" accessibilityState={{ disabled: !MIC_ENABLED }} disabled={!MIC_ENABLED}
            style={{ width: 40, height: 40, borderRadius: 20, borderColor: C.field, borderWidth: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}><Icon name="mic" size={18} color={C.ink} /></Pressable>}
          <Pressable testID="send-button" accessibilityRole="button" accessibilityLabel="Send" disabled={busy || !draft.trim()} onPress={submit}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', opacity: busy || !draft.trim() ? 0.5 : 1 }}><Icon name="send" size={18} color="#fff" /></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
