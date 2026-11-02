import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { chartGeometry, trendSummary } from '@app/chart-geometry';
import type { ProgressSnapshot, Scenario, ScenarioGroup, ScenarioStatus } from '@app/shared-types';
import { useFacade } from '../api/FacadeProvider';
import { C, radius } from '../theme';

const GROUPS: Array<[ScenarioGroup, string]> = [['administrative', 'Administrative'], ['daily_life', 'Daily life'], ['social', 'Social']];
const LABEL: Record<ScenarioStatus, string> = { done: 'Done', in_progress: 'Practicing', new: 'Not tried' };

function Card({ children, testID }: { children: React.ReactNode; testID?: string }) {
  return <View testID={testID} style={{ backgroundColor: C.card, borderRadius: radius.card, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 12 }}>{children}</View>;
}

function MistakesChart({ sessions }: { sessions: ProgressSnapshot['sessions'] }) {
  const shown = sessions.slice(-8); const values = shown.map((s) => s.addressingErrors);
  if (!values.length) return <Text testID="chart-empty" style={{ color: C.faint, marginTop: 8 }}>Your chart appears after your first completed practice session.</Text>;
  const W = 480, H = 220, g = chartGeometry(values, W, H); const summary = trendSummary(values);
  return (
    <View style={{ marginTop: 8 }}>
      <View accessible accessibilityRole="image" accessibilityLabel={`Address-term mistakes per practice session: ${values.join(', ')}. ${summary}`}>
        <Svg testID="mistakes-chart" width="100%" height={200} viewBox={`0 0 ${W} ${H}`}>
          {g.yTicks.map((t) => (<React.Fragment key={t.label}><Line x1={32} x2={W - 12} y1={t.y} y2={t.y} stroke={C.line} /><SvgText x={26} y={t.y + 4} fontSize={11} fill={C.faint} textAnchor="end">{t.label}</SvgText></React.Fragment>))}
          <Path d={g.areaPath} fill={C.tealBg} /><Path d={g.linePath} fill="none" stroke={C.teal} strokeWidth={2.5} />
          {g.points.map((p, i) => (<React.Fragment key={shown[i].index}><Circle testID="chart-point" cx={p.x} cy={p.y} r={4.5} fill="#fff" stroke={C.teal} strokeWidth={2} />
            <SvgText x={p.x} y={H - 8} fontSize={11} fill={C.faint} textAnchor="middle">{shown[i].index}</SvgText></React.Fragment>))}
        </Svg>
      </View>
      <Text style={{ color: C.faint, fontSize: 12 }}>Mistakes per practice session (x: session number). <Text testID="chart-summary">{summary}</Text></Text>
    </View>
  );
}

export default function ProgressScreen() {
  const { client } = useFacade();
  const [dev, setDev] = useState(false);
  const [data, setData] = useState<{ scenarios: Scenario[]; progress: ProgressSnapshot } | 'loading' | 'error'>('loading');
  const load = useCallback(() => { Promise.all([client.getScenarios(), client.getProgress()]).then(([scenarios, progress]) => setData({ scenarios, progress })).catch(() => setData('error')); }, [client]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { client.getHealth().then((h) => setDev(h.dev)).catch(() => setDev(false)); }, [client]);
  const seed = () => client.dev.seed().then(load).catch(() => setData('error'));

  const shell = (c: React.ReactNode) => <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 56 }}>{c}</ScrollView>;
  if (data === 'loading') return shell(<View testID="progress-loading"><Text style={{ fontSize: 28, fontWeight: '800' }}>Progress</Text><View style={{ height: 120, backgroundColor: C.line, borderRadius: radius.card, marginTop: 12 }} /></View>);
  if (data === 'error') return shell(
    <View testID="progress-error" accessibilityRole="alert" style={{ backgroundColor: C.card, borderRadius: radius.card, padding: 24, alignItems: 'center' }}>
      <Text style={{ fontWeight: '700', fontSize: 16 }}>Progress is temporarily unavailable</Text>
      <Text style={{ color: C.mut, textAlign: 'center', marginVertical: 6 }}>We couldn’t load this section. Your practice conversations and profile are not affected.</Text>
      <Pressable accessibilityRole="button" onPress={load} style={{ backgroundColor: C.teal, borderRadius: radius.field, paddingHorizontal: 20, paddingVertical: 10 }}><Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text></Pressable></View>);

  const status = Object.fromEntries(data.progress.scenarios.map((s) => [s.scenarioId, s.status]));
  const { turns, addressingErrors } = data.progress.totals;
  return shell(<>
    <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', color: C.ink, marginBottom: 10 }}>Progress</Text>
    {turns === 0 && <View testID="progress-empty" style={{ backgroundColor: C.stoneBg, borderRadius: 10, padding: 10, marginBottom: 12 }}>
      <Text>No practice yet. Finish one conversation to see your map and trends.</Text>
      {dev && <Pressable testID="seed-demo" accessibilityRole="button" onPress={seed} style={{ marginTop: 8, borderColor: C.teal, borderWidth: 1, borderRadius: radius.field, padding: 8, alignSelf: 'flex-start' }}><Text style={{ color: C.tealDark, fontWeight: '600' }}>Load demo data (development only)</Text></Pressable>}
    </View>}
    <Card>
      <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Scenario map</Text>
      {GROUPS.map(([g, label]) => (
        <View key={g} style={{ marginBottom: 8 }}>
          <Text style={{ color: C.tealDark, fontWeight: '700', marginBottom: 4 }}>{label}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {data.scenarios.filter((s) => s.group === g).map((s) => { const st = status[s.id] ?? 'new';
              return <View key={s.id} testID={`map-${s.id}`} accessibilityLabel={`${s.title}: ${LABEL[st]}`} {...({ 'data-status': st } as object)}
                style={{ borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: st === 'new' ? 1 : 1.5, borderStyle: st === 'new' ? 'dashed' : 'solid', borderColor: st === 'new' ? C.faint : C.teal, backgroundColor: st === 'done' ? C.teal : st === 'in_progress' ? C.tealBg2 : 'transparent' }}>
                <Text style={{ color: st === 'done' ? '#fff' : C.ink, fontWeight: st === 'new' ? '400' : '600' }}>{st === 'done' ? '✓ ' : ''}{s.title}</Text></View>; })}
          </View>
        </View>))}
    </Card>
    <Card><Text style={{ fontWeight: '800', fontSize: 16 }}>Address-term mistakes over time</Text><MistakesChart sessions={data.progress.sessions} /></Card>
    <Card testID="confidence">
      <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Confidence</Text>
      {GROUPS.map(([g, label]) => { const v = data.progress.confidence[g] ?? 0; return (
        <View key={g} style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>{label}</Text>
          <View testID={`confidence-${g}`} accessibilityRole="progressbar" accessibilityLabel={`${label} confidence`} accessibilityValue={{ min: 0, max: 100, now: v }} style={{ height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden', marginTop: 4 }}>
            <View style={{ width: `${v}%`, height: 8, backgroundColor: C.teal }} /></View>
        </View>); })}
      <Text style={{ color: C.faint, fontSize: 12 }}>Estimated from scenarios you’ve practiced and how often you picked the right term.</Text>
    </Card>
    <Text testID="progress-turns" style={{ color: C.mut }}>Turns completed: {turns} · Address-term mistakes so far: {addressingErrors}</Text>
  </>);
}
