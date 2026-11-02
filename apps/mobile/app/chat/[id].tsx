import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Scenario } from '@app/shared-types';
import { useFacade } from '../../src/api/FacadeProvider';
import ChatScreen from '../../src/screens/ChatScreen';
import { C } from '../../src/theme';

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client } = useFacade(); const router = useRouter();
  const [state, setState] = useState<Scenario | 'loading' | 'error'>('loading');
  const load = () => { setState('loading'); client.getScenarios().then((all) => { const s = all.find((x) => x.id === id); setState(s ?? 'error'); }).catch(() => setState('error')); };
  useEffect(load, [client, id]);
  if (state === 'loading') return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.teal} /></View>;
  if (state === 'error') return (
    <View testID="chat-route-error" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }}>
      <Text style={{ fontWeight: '700' }}>This scenario couldn’t be loaded</Text>
      <Pressable accessibilityRole="button" onPress={load}><Text style={{ color: C.tealDark, fontWeight: '700' }}>Retry</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.back()}><Text>Back</Text></Pressable>
    </View>);
  return <ChatScreen scenario={state} />;
}
