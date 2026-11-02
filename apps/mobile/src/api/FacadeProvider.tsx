import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { createFacadeClient, getAnonymousIdAsync } from '@app/facade-client';
import type { FacadeClient } from '@app/facade-client';
import { C } from '../theme';

// Địa chỉ Facade: biến EXPO_PUBLIC_FACADE_URL (được Expo nhúng lúc build/start).
//  - iOS Simulator: http://localhost:4000 · Android Emulator: http://10.0.2.2:4000 · điện thoại thật: http://<IP máy tính>:4000
export const FACADE_URL = process.env.EXPO_PUBLIC_FACADE_URL ?? 'http://localhost:4000';
const IDLE_TIMEOUT_MS = 15_000;

export interface FacadeCtx { client: FacadeClient; idleTimeoutMs: number }
export const FacadeContext = createContext<FacadeCtx | null>(null);
export function useFacade(): FacadeCtx {
  const v = useContext(FacadeContext);
  if (!v) throw new Error('useFacade phải nằm trong <FacadeProvider>');
  return v;
}

/** Tạo client dùng `expo/fetch` (hỗ trợ đọc luồng SSE trên native) và ID ẩn danh lưu trong AsyncStorage. */
export function FacadeProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { void getAnonymousIdAsync(AsyncStorage).then(setId); }, []);
  const value = useMemo<FacadeCtx | null>(() => id
    ? { client: createFacadeClient({ baseUrl: FACADE_URL, anonymousId: id, fetchImpl: expoFetch as unknown as typeof fetch }), idleTimeoutMs: IDLE_TIMEOUT_MS } : null, [id]);
  if (!value) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}><ActivityIndicator color={C.teal} /><Text style={{ color: C.mut, marginTop: 8 }}>Starting…</Text></View>;
  return <FacadeContext.Provider value={value}>{children}</FacadeContext.Provider>;
}
