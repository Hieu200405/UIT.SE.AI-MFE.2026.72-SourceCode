import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { ProgressSnapshot, Scenario, ScenarioGroup, ScenarioStatus } from '@app/shared-types';
import { useFacade } from '../api/FacadeProvider';
import { C, radius } from '../theme';
import { Icon } from '../ui/Icon';

const GROUPS: Array<[ScenarioGroup, string]> = [['administrative', 'Administrative'], ['daily_life', 'Daily life'], ['social', 'Social']];

function Badge({ status }: { status: ScenarioStatus }) {
  const label = status === 'done' ? '✓ Done' : status === 'in_progress' ? 'In progress' : 'New';
  const bg = status === 'in_progress' ? C.tealBg2 : status === 'done' ? C.card : C.stoneBg;
  return <View testID="badge" style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: status === 'done' ? 1 : 0, borderColor: C.field }}>
    <Text style={{ fontSize: 12, fontWeight: '600', color: status === 'in_progress' ? C.tealDark : C.mut }}>{label}</Text></View>;
}

export default function PracticeScreen() {
  const { client } = useFacade(); const router = useRouter();
  const [data, setData] = useState<{ scenarios: Scenario[]; progress: ProgressSnapshot | null } | 'loading' | 'error'>('loading');
  const [filter, setFilter] = useState<Set<ScenarioGroup>>(new Set());

  const load = useCallback(() => {
    Promise.all([client.getScenarios(), client.getProgress().catch(() => null)]) // lỗi tiến độ: ẩn badge, vẫn chọn được tình huống
      .then(([scenarios, progress]) => setData({ scenarios, progress })).catch(() => setData('error'));
  }, [client]);
  useFocusEffect(useCallback(() => { load(); }, [load]));  // quay lại từ Chat → cập nhật badge/gợi ý

  const toggle = (g: ScenarioGroup) => { const n = new Set(filter); if (n.has(g)) n.delete(g); else n.add(g); setFilter(n); };
  const card = (s: Scenario, status: Record<string, ScenarioStatus>, rec: boolean, hasProgress: boolean) => (
    <Pressable key={s.id} testID={`scenario-${s.id}`} accessibilityRole="button" accessibilityLabel={s.title} onPress={() => router.push(`/chat/${s.id}`)}
      style={{ backgroundColor: C.card, borderRadius: radius.card, padding: 14, marginBottom: 10, borderWidth: rec ? 2 : 1, borderColor: rec ? C.teal : C.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.tealBg, alignItems: 'center', justifyContent: 'center' }}><Icon name={s.icon} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>{s.title}</Text>
        <Text style={{ color: C.mut, fontSize: 13 }} numberOfLines={1}>{s.summary}</Text>
      </View>
      {hasProgress && <Badge status={status[s.id] ?? 'new'} />}
    </Pressable>
  );

  let body: React.ReactNode;
  if (data === 'loading') body = <View testID="practice-loading">{[0, 1, 2, 3].map((i) => <View key={i} style={{ height: 68, borderRadius: radius.card, backgroundColor: C.line, marginBottom: 10 }} />)}</View>;
  else if (data === 'error') body = (
    <View testID="practice-error" accessibilityRole="alert" style={{ backgroundColor: C.card, borderRadius: radius.card, padding: 24, alignItems: 'center' }}>
      <Text style={{ fontWeight: '700', fontSize: 16 }}>Scenarios are temporarily unavailable</Text>
      <Text style={{ color: C.mut, marginVertical: 6, textAlign: 'center' }}>Your progress and profile are not affected.</Text>
      <Pressable onPress={load} accessibilityRole="button" style={{ backgroundColor: C.teal, borderRadius: radius.field, paddingHorizontal: 20, paddingVertical: 10 }}><Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text></Pressable>
    </View>);
  else {
    const status = Object.fromEntries((data.progress?.scenarios ?? []).map((s) => [s.scenarioId, s.status]));
    const recIds = new Set(data.progress?.recommended ?? []);
    const shown = data.scenarios.filter((s) => filter.size === 0 || filter.has(s.group));
    const rec = shown.filter((s) => recIds.has(s.id)); const rest = shown.filter((s) => !recIds.has(s.id));
    body = shown.length === 0 ? (
      <View testID="practice-empty" style={{ backgroundColor: C.card, borderRadius: radius.card, padding: 24, alignItems: 'center' }}>
        <Text style={{ fontWeight: '700' }}>No scenarios here yet</Text><Text style={{ color: C.mut, marginVertical: 6 }}>Try another group.</Text>
        <Pressable onPress={() => setFilter(new Set())} accessibilityRole="button"><Text style={{ color: C.tealDark, fontWeight: '600' }}>Clear filter</Text></Pressable>
      </View>
    ) : (
      <View>
        {rec.length > 0 && (<><Text style={{ color: C.tealDark, fontWeight: '700', marginBottom: 6 }}>Recommended for you</Text>{rec.map((s) => card(s, status, true, !!data.progress))}</>)}
        {rest.length > 0 && (<><Text style={{ color: C.faint, fontWeight: '700', marginVertical: 6 }}>All scenarios</Text>{rest.map((s) => card(s, status, false, !!data.progress))}</>)}
      </View>);
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
      <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', color: C.ink }}>What do you want to practice today?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 14 }}>
        {GROUPS.map(([g, label]) => (
          <Pressable key={g} accessibilityRole="button" accessibilityState={{ selected: filter.has(g) }} onPress={() => toggle(g)}
            style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: C.teal, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: filter.has(g) ? C.teal : C.tealBg }}>
            <Text style={{ fontWeight: '600', color: filter.has(g) ? '#fff' : C.tealDark }}>{label}</Text></Pressable>))}
      </View>
      {body}
    </ScrollView>
  );
}
