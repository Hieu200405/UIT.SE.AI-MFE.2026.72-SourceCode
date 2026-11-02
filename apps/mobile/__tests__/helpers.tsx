import React from 'react';
import { readFileSync } from 'node:fs';
import { jest } from '@jest/globals';
import type { ChatRequest, Profile, ProgressSnapshot, Scenario, StreamEvent } from '@app/shared-types';
import { DEFAULT_PROFILE } from '@app/shared-types';
import type { FacadeClient, StreamOptions, StreamOutcome } from '@app/facade-client';
import { FacadeContext } from '../src/api/FacadeProvider';

// Danh mục tình huống thật của Facade (nguồn dữ liệu duy nhất)
export const SCENARIOS: Scenario[] = JSON.parse(readFileSync(`${__dirname}/../../../packages/ai-service-facade/data/scenarios.json`, 'utf-8')).scenarios;
export const scenario = (id: string) => SCENARIOS.find((s) => s.id === id)!;

export const snapshot = (over: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  scenarios: SCENARIOS.map((s) => ({ scenarioId: s.id, status: 'new' as const })), recommended: ['renting', 'neighbors'],
  totals: { turns: 0, addressingErrors: 0 }, sessions: [], confidence: { administrative: 0, daily_life: 0, social: 0 }, ...over,
});

export type StreamScript = (req: ChatRequest, opts: StreamOptions) => Promise<StreamOutcome>;
export interface FakeClient extends FacadeClient { streamChat: jest.Mock<StreamScript>; setScenarioDone: jest.Mock<any>; putProfile: jest.Mock<any>; getProgress: jest.Mock<any>; getProfile: jest.Mock<any>; getScenarios: jest.Mock<any>; getHealth: jest.Mock<any>; dev: { seed: jest.Mock<any> } }

/** Facade giả ở mức client: phát các sự kiện theo kịch bản (giống Facade thật) để kiểm tra giao diện + reducer. */
export function makeClient(over: Partial<Record<keyof FakeClient, unknown>> = {}): FakeClient {
  const c = {
    anonymousId: 'test-user-12345',
    getScenarios: jest.fn(async () => SCENARIOS), getProfile: jest.fn(async () => ({ ...DEFAULT_PROFILE } as Profile)), putProfile: jest.fn(async (p: Profile) => p),
    getProgress: jest.fn(async () => snapshot()), setScenarioDone: jest.fn(async () => snapshot()), getHealth: jest.fn(async () => ({ ok: true, dev: false })),
    dev: { seed: jest.fn(async () => snapshot()) },
    streamChat: jest.fn<StreamScript>(async (req, opts) => script(req, opts)),
    ...over,
  };
  return c as unknown as FakeClient;
}
export const emit = (opts: StreamOptions, ...events: StreamEvent[]) => events.forEach((e) => opts.onEvent(e));
const tick = () => new Promise((r) => setTimeout(r, 0));

/** Kịch bản mặc định: tình huống Renting như wireframe. */
export const script: StreamScript = async (req, opts) => {
  const rid = req.requestId;
  if (req.kind === 'open') {
    emit(opts, { type: 'text_delta', requestId: rid, partId: 'p1', text: 'Chào cháu, cháu muốn hỏi gì về căn phòng?' }, { type: 'text_delta', requestId: rid, partId: 'p1', text: '', translation: 'Hello, what would you like to ask about the room?' }, { type: 'done', requestId: rid });
    return 'done';
  }
  if (req.kind === 'hint') { emit(opts, { type: 'ui_card', requestId: rid, card: { type: 'reply_suggestion', data: { suggestions: [{ text: 'Dạ, cảm ơn bác ạ.', translation: 'Thank you.' }, { text: 'Bác cho cháu xin giấy biên nhận ạ.', translation: 'Could I have a receipt, please?' }] } } }, { type: 'done', requestId: rid }); return 'done'; }
  emit(opts,
    { type: 'user_translation', requestId: rid, translation: 'Hey, how much is the electricity?' },
    { type: 'ui_card', requestId: rid, card: { type: 'address', data: { originalText: req.message!, suggestedText: 'Bác ơi, tiền điện bao nhiêu ạ?', suggestedTerms: { call: 'bác', self: 'cháu' }, isCorrection: true, explanation: 'He is much older — use bác and refer to yourself as cháu.' } } },
    { type: 'text_delta', requestId: rid, partId: 'p1', text: 'Điện ba nghìn rưỡi một số. ' }, { type: 'text_delta', requestId: rid, partId: 'p1', text: 'Cháu đặt cọc nhé?' },
    { type: 'text_delta', requestId: rid, partId: 'p1', text: '', translation: 'Electricity is 3,500 VND per unit.' },
    { type: 'ui_card', requestId: rid, card: { type: 'cultural_note', data: { title: 'Handing over money', explanation: 'Pass cash with both hands.', verified: false } } },
    { type: 'done', requestId: rid });
  await tick(); return 'done';
};

export const withFacade = (client: FacadeClient, ui: React.ReactElement) => <FacadeContext.Provider value={{ client, idleTimeoutMs: 1000 }}>{ui}</FacadeContext.Provider>;

/** toHaveTextContent(chuỗi) của RNTL 14 so khớp TOÀN BỘ nội dung; dùng sub() để kiểm tra chứa một đoạn. */
export const sub = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
