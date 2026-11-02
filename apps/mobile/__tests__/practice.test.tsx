import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PracticeScreen from '../src/screens/PracticeScreen';
import { SCENARIOS, makeClient, snapshot, withFacade, sub } from './helpers';

const { __router } = require('expo-router');

describe('PracticeScreen', () => {
  test('tiêu đề, 8 tình huống; "Recommended for you" tách khỏi "All scenarios"; badge New', async () => {
    await render(withFacade(makeClient(), <PracticeScreen />));
    expect(await screen.findByText('What do you want to practice today?')).toBeOnTheScreen();
    for (const s of SCENARIOS) expect(await screen.findByTestId(`scenario-${s.id}`)).toBeOnTheScreen();
    expect(screen.getByText('Recommended for you')).toBeOnTheScreen(); expect(screen.getByText('All scenarios')).toBeOnTheScreen();
    expect(screen.getAllByTestId('badge')).toHaveLength(8);
  });
  test('badge theo tiến độ: Done / In progress / New', async () => {
    const progress = snapshot({ scenarios: SCENARIOS.map((s) => ({ scenarioId: s.id, status: s.id === 'banking' ? 'done' : s.id === 'renting' ? 'in_progress' : 'new' })), recommended: ['renting', 'neighbors'] });
    await render(withFacade(makeClient({ getProgress: jest.fn(async () => progress) }), <PracticeScreen />));
    expect(await screen.findByTestId('scenario-banking')).toHaveTextContent(sub('✓ Done'));
    expect(screen.getByTestId('scenario-renting')).toHaveTextContent(sub('In progress'));
    expect(screen.getByTestId('scenario-doctor')).toHaveTextContent(sub('New'));
  });
  test('lọc theo nhóm: Social → 2 tình huống; bấm lại để bỏ lọc', async () => {
    await render(withFacade(makeClient(), <PracticeScreen />));
    await screen.findByTestId('scenario-renting');
    await fireEvent.press(screen.getByRole('button', { name: 'Social' }));
    expect(screen.getByTestId('scenario-neighbors')).toBeOnTheScreen(); expect(screen.getByTestId('scenario-weddings')).toBeOnTheScreen();
    expect(screen.queryByTestId('scenario-renting')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Social' }));
    expect(screen.getByTestId('scenario-renting')).toBeOnTheScreen();
  });
  test('trạng thái rỗng khi bộ lọc không có kết quả → "Clear filter" khôi phục', async () => {
    const only = SCENARIOS.filter((s) => s.group === 'administrative');
    await render(withFacade(makeClient({ getScenarios: jest.fn(async () => only) }), <PracticeScreen />));
    await screen.findByTestId('scenario-renting');
    await fireEvent.press(screen.getByRole('button', { name: 'Social' }));
    expect(await screen.findByTestId('practice-empty')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Clear filter'));
    expect(screen.getByTestId('scenario-renting')).toBeOnTheScreen();
  });
  test('Facade lỗi → thông báo + Retry nạp lại được', async () => {
    const getScenarios = jest.fn<any>().mockRejectedValueOnce(new Error('down')).mockResolvedValue(SCENARIOS);
    await render(withFacade(makeClient({ getScenarios }), <PracticeScreen />));
    expect(await screen.findByTestId('practice-error')).toHaveTextContent(sub('Scenarios are temporarily unavailable'));
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('scenario-renting')).toBeOnTheScreen();
  });
  test('lỗi tiến độ nhưng catalog ổn → vẫn chọn được tình huống, ẩn badge và gợi ý', async () => {
    await render(withFacade(makeClient({ getProgress: jest.fn(async () => { throw new Error('x'); }) }), <PracticeScreen />));
    expect(await screen.findByTestId('scenario-renting')).toBeOnTheScreen();
    expect(screen.queryAllByTestId('badge')).toHaveLength(0); expect(screen.queryByText('Recommended for you')).not.toBeOnTheScreen();
  });
  test('bấm một tình huống → điều hướng sang /chat/<id>', async () => {
    await render(withFacade(makeClient(), <PracticeScreen />));
    await fireEvent.press(await screen.findByTestId('scenario-market'));
    expect(__router.push).toHaveBeenCalledWith('/chat/market');
  });
});
