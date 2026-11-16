import '@testing-library/react-native/matchers';

// expo-router: chỉ cần useRouter / useFocusEffect trong test màn hình (điều hướng thật được kiểm bằng Metro bundle + chạy máy thật).
jest.mock('expo-router', () => {
  const React = require('react');
  const router = { push: jest.fn(), back: jest.fn() };
  return { __router: router, useRouter: () => router, useFocusEffect: (cb) => React.useEffect(cb, [cb]), useLocalSearchParams: () => ({ id: 'renting' }) };
});
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Keep React warnings visible: tests must await their asynchronous UI work.
