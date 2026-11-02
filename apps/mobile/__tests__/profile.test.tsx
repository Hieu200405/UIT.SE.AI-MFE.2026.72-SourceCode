import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ProfileScreen from '../src/screens/ProfileScreen';
import { makeClient, withFacade } from './helpers';

const press = async (name: string) => fireEvent.press(screen.getByRole('button', { name }));

describe('ProfileScreen', () => {
  test('nạp hồ sơ từ Facade (giá trị mẫu wireframe): Settling, 28, Prefer not to say, South', async () => {
    await render(withFacade(makeClient(), <ProfileScreen />));
    expect(await screen.findByTestId('profile')).toBeOnTheScreen();
    expect(screen.getByTestId('age-input').props.value).toBe('28');
    expect(screen.getByRole('button', { name: 'Settling in Vietnam' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: 'Prefer not to say' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: 'South' }).props.accessibilityState.selected).toBe(true);
  });
  test('lưu: gửi đúng hồ sơ mới lên Facade, báo "Saved"; lưu lại khi không đổi → "No changes"', async () => {
    const client = makeClient(); await render(withFacade(client, <ProfileScreen />)); await screen.findByTestId('profile');
    await press('Learning the culture'); await press('Female'); await press('North'); await fireEvent.changeText(screen.getByTestId('age-input'), '40');
    await fireEvent.press(screen.getByTestId('save-button'));
    expect(client.putProfile).toHaveBeenCalledWith({ purpose: 'learning_culture', age: 40, gender: 'female', region: 'north' });
    expect(await screen.findByText('Saved')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('save-button'));
    expect(await screen.findByText('No changes')).toBeOnTheScreen(); expect(client.putProfile).toHaveBeenCalledTimes(1);
  });
  test('tuổi không hợp lệ bị chặn ở máy khách (không gọi Facade); để trống = chưa khai báo', async () => {
    const client = makeClient(); await render(withFacade(client, <ProfileScreen />)); await screen.findByTestId('profile');
    for (const bad of ['abc', '3', '200', '12.5']) { await fireEvent.changeText(screen.getByTestId('age-input'), bad); await fireEvent.press(screen.getByTestId('save-button')); expect(await screen.findByText('Enter an age between 5 and 120.')).toBeOnTheScreen(); }
    expect(client.putProfile).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('age-input'), ''); await fireEvent.press(screen.getByTestId('save-button'));
    expect(client.putProfile).toHaveBeenCalledWith(expect.objectContaining({ age: null }));
  });
  test('lưu lỗi → thông báo, không mất dữ liệu đã nhập; nạp lỗi → Retry', async () => {
    const client = makeClient({ putProfile: jest.fn(async () => { throw new Error('offline'); }) });
    await render(withFacade(client, <ProfileScreen />)); await screen.findByTestId('profile');
    await fireEvent.changeText(screen.getByTestId('age-input'), '35'); await fireEvent.press(screen.getByTestId('save-button'));
    expect(await screen.findByText('Couldn’t save your profile. Please try again.')).toBeOnTheScreen();
    expect(screen.getByTestId('age-input').props.value).toBe('35');
  });
  test('Facade lỗi lúc nạp → thông báo + Retry', async () => {
    const getProfile = jest.fn<any>().mockRejectedValueOnce(new Error('down')).mockResolvedValue({ purpose: 'settling', age: 28, gender: 'unknown', region: 'south' });
    await render(withFacade(makeClient({ getProfile }), <ProfileScreen />));
    expect(await screen.findByTestId('profile-error')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('profile')).toBeOnTheScreen();
  });
});
