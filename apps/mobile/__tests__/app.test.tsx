import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FacadeProvider, useFacade } from '../src/api/FacadeProvider';
import ChatRoute from '../app/chat/[id]';
import { makeClient, withFacade } from './helpers';

const { __router } = require('expo-router');
function ShowId() { return <Text testID="id">{useFacade().client.anonymousId}</Text>; }

describe('FacadeProvider', () => {
  test('tạo ID ẩn danh, lưu vào AsyncStorage và dùng lại ở lần mở sau', async () => {
    await AsyncStorage.clear();
    const first = await render(<FacadeProvider><ShowId /></FacadeProvider>);
    const id = (await screen.findByTestId('id')).props.children as string;
    expect(id).toMatch(/^[\w-]{8,64}$/); expect(await AsyncStorage.getItem('anonymousId')).toBe(id);
    await first.unmount();
    await render(<FacadeProvider><ShowId /></FacadeProvider>);
    expect((await screen.findByTestId('id')).props.children).toBe(id);
  });
  test('useFacade ngoài Provider → lỗi rõ ràng', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<ShowId />)).rejects.toThrow('useFacade phải nằm trong <FacadeProvider>'); spy.mockRestore();
  });
});

describe('Route /chat/[id]', () => {
  test('id hợp lệ (renting) → nạp tình huống rồi mở màn Chat', async () => {
    await render(withFacade(makeClient(), <ChatRoute />));
    expect(await screen.findByTestId('scenario-title')).toHaveTextContent('Renting a place');
  });
  test('tình huống không tồn tại / Facade lỗi → màn lỗi có Retry và Back', async () => {
    await render(withFacade(makeClient({ getScenarios: jest.fn(async () => []) }), <ChatRoute />));
    expect(await screen.findByTestId('chat-route-error')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Back')); expect(__router.back).toHaveBeenCalled();
  });
});
