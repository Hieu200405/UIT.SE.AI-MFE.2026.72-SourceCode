import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FacadeError } from '@app/facade-client';
import type { StreamOptions } from '@app/facade-client';
import ChatScreen from '../src/screens/ChatScreen';
import { emit, makeClient, scenario, script, snapshot, withFacade, sub } from './helpers';

const { __router } = require('expo-router');
const open = async (client = makeClient()) => { await render(withFacade(client, <ChatScreen scenario={scenario('renting')} />)); await screen.findByText('Chào cháu, cháu muốn hỏi gì về căn phòng?'); return client; };
const typeAndSend = async (text: string) => { await fireEvent.changeText(screen.getByTestId('reply-input'), text); await fireEvent.press(screen.getByTestId('send-button')); };

describe('ChatScreen (Renting, như wireframe mobile)', () => {
  test('header: tên, nhân vật "Landlord, male, ~60", "You: 28"; câu mở đầu + bản dịch', async () => {
    await open();
    expect(screen.getByTestId('scenario-title')).toHaveTextContent(sub('Renting a place'));
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent(sub('Landlord, male, ~60 · You: 28')));
    expect(screen.getByTestId('agent-translation')).toHaveTextContent(sub('Hello, what would you like to ask about the room?'));
  });
  test('gửi "Bạn ơi…" → bản dịch tin người học, thẻ Address, câu trả lời + dịch, ghi chú văn hóa "Sample" (thu gọn rồi mở)', async () => {
    const client = await open();
    await typeAndSend('Bạn ơi, tiền điện bao nhiêu?');
    expect(await screen.findByTestId('user-translation')).toHaveTextContent(sub('Hey, how much is the electricity?'));
    expect(screen.getByTestId('address-suggested')).toHaveTextContent(sub('Bác ơi, tiền điện bao nhiêu ạ?'));
    expect(screen.getByTestId('card-address')).toHaveTextContent(sub('Usage may vary by region/family.'));
    await waitFor(() => expect(screen.getAllByTestId('agent-text')[1]).toHaveTextContent(sub('Điện ba nghìn rưỡi một số. Cháu đặt cọc nhé?')));
    expect(screen.getAllByTestId('agent-translation')[1]).toHaveTextContent(sub('Electricity is 3,500 VND per unit.'));
    expect(screen.getByTestId('sample-badge')).toBeOnTheScreen();
    expect(screen.queryByText('Pass cash with both hands.')).not.toBeOnTheScreen();     // thu gọn mặc định trên mobile
    await fireEvent.press(screen.getByText('Handing over money'));
    expect(screen.getByText('Pass cash with both hands.')).toBeOnTheScreen();
    expect(client.streamChat).toHaveBeenCalledTimes(2);                                   // open + message
    expect(client.streamChat.mock.calls[1][0]).toMatchObject({ kind: 'message', message: 'Bạn ơi, tiền điện bao nhiêu?', scenarioId: 'renting' });
  });
  test('Mark as done: tắt khi chưa có lượt; sau lượt hoàn tất bật lên; bấm → setScenarioDone(renting, true)', async () => {
    let status = 'new';
    const client = makeClient({ getProgress: jest.fn(async () => snapshot({ scenarios: [{ scenarioId: 'renting', status }] as any })), setScenarioDone: jest.fn(async () => { status = 'done'; return snapshot({ scenarios: [{ scenarioId: 'renting', status }] as any }); }) });
    await open(client);
    await fireEvent.press(screen.getByText('Goals'));
    expect(screen.getByTestId('mark-done')).toBeDisabled(); expect(screen.getByText('Available after your first completed turn.')).toBeOnTheScreen();
    status = 'in_progress';
    await typeAndSend('Bác ơi, tiền điện bao nhiêu ạ?');
    await waitFor(() => expect(screen.getByTestId('mark-done')).toBeEnabled());
    await fireEvent.press(screen.getByTestId('mark-done'));
    expect(client.setScenarioDone).toHaveBeenCalledWith('renting', true);
    expect(await screen.findByText('✓ Marked as done (undo)')).toBeOnTheScreen();
  });
  test('"Hint" → 2 gợi ý; chọn một → điền vào ô nhập, KHÔNG gửi', async () => {
    const client = await open();
    await fireEvent.press(screen.getByTestId('hint-button'));
    expect(await screen.findByTestId('suggestions')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Bác cho cháu xin giấy biên nhận ạ.'));
    expect(screen.getByTestId('reply-input').props.value).toBe('Bác cho cháu xin giấy biên nhận ạ.');
    expect(screen.queryAllByTestId('msg-user')).toHaveLength(0);
    expect(client.streamChat.mock.calls.filter(([r]) => r.kind === 'message')).toHaveLength(0);
  });
  test('thiếu ngữ cảnh → thẻ hỏi làm rõ; chọn chip → gửi chip như câu trả lời', async () => {
    const client = makeClient({ streamChat: jest.fn(async (req: any, opts: StreamOptions) => {
      if (req.kind === 'message' && req.message.includes('nên gọi')) { emit(opts, { type: 'needs_clarification', requestId: req.requestId, question: 'How old is the person?', assumptions: ['Using neutral wording'], options: ['Older than me', 'Younger than me'] }); return 'clarifying'; }
      return script(req, opts);
    }) });
    await open(client);
    await typeAndSend('Tôi muốn hỏi người đó nên gọi thế nào');
    expect(await screen.findByTestId('card-clarify')).toHaveTextContent(sub('How old is the person?'));
    expect(screen.getByTestId('card-clarify')).toHaveTextContent(sub('Assumption for now: Using neutral wording'));
    await fireEvent.press(screen.getByRole('button', { name: 'Older than me' }));
    await waitFor(() => expect(client.streamChat.mock.calls.some(([r]) => r.kind === 'message' && r.message === 'Older than me')).toBe(true));
  });
  test('Stop: dừng giữa chừng, ghi chú "Reply stopped", sự kiện muộn bị bỏ, gửi tiếp được', async () => {
    let release: () => void = () => {}; let late: (() => void) | null = null;
    const client = makeClient({ streamChat: jest.fn(async (req: any, opts: StreamOptions) => {
      if (req.kind !== 'message') return script(req, opts);
      emit(opts, { type: 'text_delta', requestId: req.requestId, partId: 'p1', text: 'Điện ' });
      await new Promise<void>((r) => { release = r; opts.signal?.addEventListener('abort', () => r()); });
      late = () => emit(opts, { type: 'text_delta', requestId: req.requestId, partId: 'p1', text: 'MUỘN' });
      return 'aborted';
    }) });
    await open(client);
    await typeAndSend('Bác ơi, giá ạ?');
    expect(await screen.findByTestId('replying')).toHaveTextContent(sub('Landlord is replying'));
    await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
    expect(await screen.findByTestId('stopped')).toBeOnTheScreen(); expect(screen.queryByTestId('replying')).not.toBeOnTheScreen();
    await act(async () => { late?.(); release(); });
    expect(screen.queryByText(/MUỘN/)).not.toBeOnTheScreen();
    expect(screen.getByTestId('send-button')).toBeDisabled();                           // ô nhập trống → chưa gửi được
    await fireEvent.changeText(screen.getByTestId('reply-input'), 'Dạ'); expect(screen.getByTestId('send-button')).toBeEnabled();
  });
  test('lỗi (mất kết nối) → banner + Retry gửi lại ĐÚNG tin cũ với requestId mới; không nhân đôi tin nhắn người học', async () => {
    let calls = 0;
    const client = makeClient({ streamChat: jest.fn(async (req: any, opts: StreamOptions) => {
      if (req.kind === 'message' && ++calls === 1) { emit(opts, { type: 'text_delta', requestId: req.requestId, partId: 'p1', text: 'Điện ' }); throw new FacadeError('Connection lost before the reply finished', { retryable: true }); }
      return script(req, opts);
    }) });
    await open(client);
    await typeAndSend('Bác ơi, giá ạ?');
    expect(await screen.findByTestId('chat-error')).toHaveTextContent(sub('Connection lost before the reply finished'));
    expect(screen.getByText('Incomplete reply')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByTestId('chat-error')).not.toBeOnTheScreen());
    const msgs = client.streamChat.mock.calls.map(([r]) => r).filter((r) => r.kind === 'message');
    expect(msgs).toHaveLength(2); expect(msgs[1].message).toBe('Bác ơi, giá ạ?'); expect(msgs[1].requestId).not.toBe(msgs[0].requestId);
    expect(screen.getAllByTestId('msg-user')).toHaveLength(1);
  });
  test('nút micro: hiển thị nhưng vô hiệu; nút Back/Change quay về danh sách', async () => {
    await open();
    expect(screen.getByTestId('mic-button')).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' })); await fireEvent.press(screen.getByText('Change'));
    expect(__router.back).toHaveBeenCalledTimes(2);
  });
  test('hủy luồng khi rời màn hình (unmount)', async () => {
    let signal: AbortSignal | undefined;
    const client = makeClient({ streamChat: jest.fn(async (req: any, opts: StreamOptions) => { signal = opts.signal; await new Promise<void>((r) => opts.signal?.addEventListener('abort', () => r())); return 'aborted'; }) });
    const { unmount } = await render(withFacade(client, <ChatScreen scenario={scenario('renting')} />));
    await waitFor(() => expect(signal).toBeDefined());
    await unmount();
    expect(signal!.aborted).toBe(true);
  });
});
