import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AddressCardData, CulturalNoteData, UICardSpec } from '@app/shared-types';
import type { ChatItem, Suggestion } from '@app/chat-state';
import { C, radius } from '../theme';
import { Icon } from './Icon';

export function AddressCard({ data }: { data: AddressCardData }) {
  return (
    <View testID="card-address" style={{ backgroundColor: C.blueBg, borderColor: C.blueLine, borderWidth: 1, borderRadius: radius.card, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}><Icon name="speech" size={16} color={C.blueInk} /><Text style={{ color: C.blueInk, fontWeight: '700' }}>Address term</Text></View>
      <Text style={{ color: C.blueInk, fontSize: 12, fontWeight: '700' }}>You said</Text>
      <Text style={{ color: C.blueInk, textDecorationLine: 'line-through', marginBottom: 6 }}>{data.originalText}</Text>
      <Text style={{ color: C.blueInk, fontSize: 12, fontWeight: '700' }}>Suggested</Text>
      <View style={{ backgroundColor: '#fff', borderColor: C.blueLine, borderWidth: 1, borderRadius: 10, padding: 10, marginVertical: 4 }}>
        <Text testID="address-suggested" style={{ color: C.blueInk, fontWeight: '700', fontSize: 16 }}>{data.suggestedText}</Text></View>
      <Text style={{ color: C.blueInk }}><Text style={{ fontWeight: '700' }}>Reason: </Text>{data.explanation}</Text>
      {data.assumptions?.map((a) => <Text key={a} testID="address-assumption" style={{ color: C.blueInk, fontSize: 12, marginTop: 4 }}>Assumption: {a}</Text>)}
      <Text style={{ color: '#1d4ed8', fontSize: 12, marginTop: 4 }}>Usage may vary by region/family.</Text>
    </View>
  );
}

export function CulturalNoteCard({ data }: { data: CulturalNoteData }) {
  const [open, setOpen] = useState(false); // thu gọn mặc định trên mobile (theo wireframe)
  return (
    <View testID="card-cultural" style={{ backgroundColor: C.amberBg, borderColor: C.amberLine, borderWidth: 1, borderRadius: radius.card, padding: 12 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="bulb" size={16} color={C.amberInk} /><Text style={{ color: C.amberInk, fontWeight: '700', flex: 1 }}>{data.title}</Text>
        {!data.verified && <View testID="sample-badge" style={{ backgroundColor: C.amberChip, borderRadius: radius.pill, paddingHorizontal: 8 }}><Text style={{ color: C.amberInk, fontSize: 12 }}>Sample</Text></View>}
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}><Icon name="chevron" size={16} color={C.amberInk} /></View>
      </Pressable>
      {open && <Text style={{ color: C.amberInk, marginTop: 8 }}>{data.explanation}</Text>}
    </View>
  );
}

export function renderCard(card: UICardSpec): React.ReactNode {
  switch (card.type) { // registry đóng: chỉ 3 loại (Constitution #11)
    case 'address': return <AddressCard data={card.data} />;
    case 'cultural_note': return <CulturalNoteCard data={card.data} />;
    default: return null;
  }
}

export function ClarifyCard({ item, disabled, onPick }: { item: Extract<ChatItem, { kind: 'clarify' }>; disabled: boolean; onPick: (t: string) => void }) {
  return (
    <View testID="card-clarify" style={{ backgroundColor: C.blueBg, borderRadius: radius.card, padding: 12 }}>
      <Text style={{ color: C.blueInk, fontWeight: '700' }}>Quick question</Text>
      <Text style={{ color: C.blueInk }}>{item.question}</Text>
      {!item.answered && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {item.options.map((o) => <Pressable key={o} disabled={disabled} accessibilityRole="button" onPress={() => onPick(o)}
          style={{ borderColor: C.teal, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: C.teal, fontWeight: '600' }}>{o}</Text></Pressable>)}
      </View>}
      {item.assumptions.map((a) => <Text key={a} style={{ color: C.blueInk, fontSize: 12, marginTop: 6 }}>Assumption for now: {a}</Text>)}
    </View>
  );
}

export function SuggestionsStrip({ suggestions, onPick }: { suggestions: Suggestion[]; onPick: (s: Suggestion) => void }) {
  return (
    <View testID="suggestions" style={{ backgroundColor: C.greenBg, borderColor: C.greenLine, borderWidth: 1, borderRadius: radius.card, padding: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}><Icon name="check" size={14} color={C.greenInk} /><Text style={{ color: C.greenInk, fontWeight: '700' }}>Reply suggestions</Text></View>
      <View style={{ gap: 8 }}>
        {suggestions.map((s) => <Pressable key={s.text} accessibilityRole="button" accessibilityLabel={s.text} onPress={() => onPick(s)}
          style={{ backgroundColor: '#fff', borderColor: C.greenLine, borderWidth: 1, borderRadius: 10, padding: 10 }}>
          <Text style={{ color: C.greenInk, fontWeight: '700' }}>{s.text}</Text><Text style={{ color: C.faint, fontSize: 12 }}>{s.translation}</Text></Pressable>)}
      </View>
    </View>
  );
}

export function ErrorBanner({ message, retryable, onRetry }: { message: string; retryable: boolean; onRetry: () => void }) {
  return (
    <View testID="chat-error" accessibilityRole="alert" style={{ backgroundColor: C.redBg, borderRadius: radius.card, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="alert" size={16} color={C.redInk} /><Text style={{ color: C.redInk, fontWeight: '700' }}>Reply interrupted</Text></View>
      <Text style={{ color: C.redInk }}>{message}. Your practice isn’t affected.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
        {retryable && <Pressable accessibilityRole="button" onPress={onRetry} style={{ backgroundColor: C.teal, borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 6 }}><Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text></Pressable>}
        <Text style={{ color: C.redInk, fontSize: 12 }}>or type a new message</Text>
      </View>
    </View>
  );
}
