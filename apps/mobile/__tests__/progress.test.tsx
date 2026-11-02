import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ProgressScreen from '../src/screens/ProgressScreen';
import { SCENARIOS, makeClient, snapshot, sub, withFacade } from './helpers';

const sessions = [7, 6, 6, 4, 4, 3, 2, 1].map((e, i) => ({ index: i + 1, scenarioId: 'renting', startedAt: '2026-10-01T00:00:00Z', turns: 8, addressingErrors: e }));
const seeded = () => snapshot({
  scenarios: SCENARIOS.map((s) => ({ scenarioId: s.id, status: (['banking', 'street_food'].includes(s.id) ? 'done' : ['renting', 'market'].includes(s.id) ? 'in_progress' : 'new') as 'done' | 'in_progress' | 'new' })),
  totals: { turns: 64, addressingErrors: 33 }, sessions, confidence: { administrative: 40, daily_life: 55, social: 0 },
});

describe('ProgressScreen', () => {
  test('bản đồ tình huống (Done / Practicing / Not tried), biểu đồ 8 điểm giảm dần, Confidence, tổng', async () => {
    await render(withFacade(makeClient({ getProgress: jest.fn(async () => seeded()) }), <ProgressScreen />));
    expect(await screen.findByText('Scenario map')).toBeOnTheScreen();
    expect(screen.getByLabelText('Banking: Done')).toBeOnTheScreen(); expect(screen.getByLabelText('Renting a place: Practicing')).toBeOnTheScreen();
    expect(screen.getByLabelText('Meeting neighbors: Not tried')).toBeOnTheScreen();
    expect(screen.getAllByTestId('chart-point')).toHaveLength(8);
    expect(screen.getByTestId('chart-summary')).toHaveTextContent('Down from 7 to 1 mistakes over 8 sessions.');
    expect(screen.getByLabelText(sub('7, 6, 6, 4, 4, 3, 2, 1'))).toBeOnTheScreen();    // mô tả cho trình đọc màn hình
    expect(screen.getByLabelText('Administrative confidence').props.accessibilityValue).toMatchObject({ min: 0, max: 100, now: 40 });
    expect(screen.getByLabelText('Social confidence').props.accessibilityValue.now).toBe(0);
    expect(screen.getByTestId('progress-turns')).toHaveTextContent('Turns completed: 64 · Address-term mistakes so far: 33');
    expect(screen.queryByTestId('progress-empty')).not.toBeOnTheScreen();
  });
  test('chưa luyện: thông báo rỗng, chưa có biểu đồ; KHÔNG có nút demo khi Facade không ở chế độ dev', async () => {
    await render(withFacade(makeClient(), <ProgressScreen />));
    expect(await screen.findByTestId('progress-empty')).toBeOnTheScreen(); expect(screen.getByTestId('chart-empty')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByTestId('seed-demo')).not.toBeOnTheScreen());
  });
  test('Facade ở chế độ dev: nút "Load demo data" nạp dữ liệu rồi hiển thị biểu đồ', async () => {
    let data = snapshot();
    const client = makeClient({ getHealth: jest.fn(async () => ({ ok: true, dev: true })), getProgress: jest.fn(async () => data) });
    (client.dev.seed as jest.Mock<any>).mockImplementation(async () => { data = seeded(); return data; });
    await render(withFacade(client, <ProgressScreen />));
    await fireEvent.press(await screen.findByTestId('seed-demo'));
    expect(client.dev.seed).toHaveBeenCalledTimes(1);
    expect(await screen.findAllByTestId('chart-point')).toHaveLength(8);
    expect(screen.queryByTestId('progress-empty')).not.toBeOnTheScreen();
  });
  test('Facade lỗi → thông báo theo wireframe + Retry nạp lại', async () => {
    const getProgress = jest.fn<any>().mockRejectedValueOnce(new Error('down')).mockResolvedValue(seeded());
    await render(withFacade(makeClient({ getProgress }), <ProgressScreen />));
    expect(await screen.findByTestId('progress-error')).toHaveTextContent(sub('Progress is temporarily unavailable'));
    expect(screen.getByTestId('progress-error')).toHaveTextContent(sub('Your practice conversations and profile are not affected'));
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Scenario map')).toBeOnTheScreen();
  });
});
