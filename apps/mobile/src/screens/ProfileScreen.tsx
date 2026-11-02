import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Profile, ProfileGender, Region, ResidencePurpose } from '@app/shared-types';
import { useFacade } from '../api/FacadeProvider';
import { C, radius } from '../theme';

const PURPOSES: Array<[ResidencePurpose, string]> = [['long_term_travel', 'Long-term travel'], ['settling', 'Settling in Vietnam'], ['learning_culture', 'Learning the culture']];
const REGIONS: Array<[Region, string]> = [['north', 'North'], ['central', 'Central'], ['south', 'South']];
const GENDERS: Array<[ProfileGender, string]> = [['unknown', 'Prefer not to say'], ['female', 'Female'], ['male', 'Male']];

function Choice({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}
    style={{ borderRadius: radius.field, borderWidth: on ? 2 : 1, borderColor: on ? C.teal : C.field, backgroundColor: on ? C.tealBg : '#fff', paddingHorizontal: 14, paddingVertical: 10 }}>
    <Text style={{ fontWeight: on ? '700' : '400', color: on ? C.tealDark : C.ink }}>{label}</Text></Pressable>;
}

export default function ProfileScreen() {
  const { client } = useFacade();
  const [saved, setSaved] = useState<Profile | null>(null); const [p, setP] = useState<Profile | null>(null); const [age, setAge] = useState('');
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null); const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(() => { setLoad('loading'); client.getProfile().then((x) => { setSaved(x); setP(x); setAge(x.age == null ? '' : String(x.age)); setLoad('ready'); }).catch(() => setLoad('error')); }, [client]);
  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const shell = (c: React.ReactNode) => <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 56 }} keyboardShouldPersistTaps="handled">{c}</ScrollView>;
  if (load === 'loading') return shell(<View testID="profile-loading"><Text style={{ fontSize: 28, fontWeight: '800' }}>My Profile</Text><View style={{ height: 160, backgroundColor: C.line, borderRadius: radius.card, marginTop: 12 }} /></View>);
  if (load === 'error' || !p || !saved) return shell(
    <View testID="profile-error" accessibilityRole="alert" style={{ backgroundColor: C.card, borderRadius: radius.card, padding: 24, alignItems: 'center' }}>
      <Text style={{ fontWeight: '700', fontSize: 16 }}>Your profile is temporarily unavailable</Text>
      <Pressable accessibilityRole="button" onPress={fetchProfile} style={{ marginTop: 10, backgroundColor: C.teal, borderRadius: radius.field, paddingHorizontal: 20, paddingVertical: 10 }}><Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text></Pressable></View>);

  const save = async () => {
    const parsed = age.trim() === '' ? null : Number(age);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 5 || parsed > 120)) return setMsg({ kind: 'err', text: 'Enter an age between 5 and 120.' });
    const next: Profile = { ...p, age: parsed };
    if ((Object.keys(next) as Array<keyof Profile>).every((k) => next[k] === saved[k])) return setMsg({ kind: 'info', text: 'No changes' });
    setSaving(true); setMsg(null);
    try { const stored = await client.putProfile(next); setSaved(stored); setP(stored); setMsg({ kind: 'ok', text: 'Saved' }); }
    catch { setMsg({ kind: 'err', text: 'Couldn’t save your profile. Please try again.' }); }
    finally { setSaving(false); }
  };
  return shell(
    <View testID="profile" style={{ backgroundColor: C.card, borderRadius: radius.card, borderWidth: 1, borderColor: C.line, padding: 16, gap: 14 }}>
      <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800' }}>My Profile</Text>
      <Text style={{ color: C.mut }}>Tell us a little about your stay so practice feels relevant.</Text>
      <View style={{ gap: 8 }}><Text style={{ fontWeight: '700', color: C.mut }}>Purpose of stay</Text>
        {PURPOSES.map(([v, l]) => <Choice key={v} label={l} on={p.purpose === v} onPress={() => setP({ ...p, purpose: v })} />)}</View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: C.mut, marginBottom: 6 }}>Age</Text>
          <TextInput testID="age-input" accessibilityLabel="Age" keyboardType="number-pad" value={age} onChangeText={setAge} style={{ borderWidth: 1, borderColor: C.field, borderRadius: radius.field, paddingHorizontal: 12, height: 44 }} /></View>
      </View>
      <View style={{ gap: 8 }}><Text style={{ fontWeight: '700', color: C.mut }}>Gender</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{GENDERS.map(([v, l]) => <Choice key={v} label={l} on={p.gender === v} onPress={() => setP({ ...p, gender: v })} />)}</View></View>
      <View style={{ gap: 8 }}><Text style={{ fontWeight: '700', color: C.mut }}>Region you live in</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{REGIONS.map(([v, l]) => <Choice key={v} label={l} on={p.region === v} onPress={() => setP({ ...p, region: v })} />)}</View>
        <Text style={{ color: C.faint, fontSize: 13 }}>Affects voice and local words.</Text></View>
      <Pressable testID="save-button" accessibilityRole="button" disabled={saving} onPress={save} style={{ backgroundColor: C.teal, borderRadius: radius.field, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.6 : 1 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{saving ? 'Saving…' : 'Save'}</Text></Pressable>
      <Text style={{ color: C.faint, textAlign: 'center' }}>Used to suggest scenarios and address terms.</Text>
      {msg && <Text testID="profile-msg" accessibilityRole={msg.kind === 'err' ? 'alert' : 'text'} style={{ color: msg.kind === 'err' ? C.redInk : C.tealDark, textAlign: 'center' }}>{msg.text}</Text>}
    </View>);
}
