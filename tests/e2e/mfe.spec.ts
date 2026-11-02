import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';

let progressServer: ChildProcess | null = null;
const startProgress = async () => {
  progressServer = spawn('node', ['scripts/poc-serve.cjs', 'progress-remote=3002'], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { if ((await fetch('http://localhost:3002/remoteEntry.js')).ok) return; } catch {} await new Promise((r) => setTimeout(r, 100)); }
  throw new Error('progress server did not start');
};
test.afterAll(() => { progressServer?.kill(); });
test.describe.configure({ mode: 'serial' });

const pick = (page: Page, id: string) => page.getByTestId(`scenario-${id}`).click();
const say = async (page: Page, text: string) => { await page.getByLabel('Your reply').fill(text); await page.getByTestId('send-button').click(); };
const lastAgentDone = (page: Page) => expect(page.getByTestId('replying')).toHaveCount(0);

// ---------------------------------------------------------------- Host / MFE
test('routing: "/" → /chat; nav; refresh trực tiếp; 404; Back; mobile dùng bottom-nav', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole('heading', { name: 'What do you want to practice today?' })).toBeVisible();
  await page.getByRole('link', { name: 'Profile' }).first().click();
  await expect(page).toHaveURL(/\/personalization$/);
  await expect(page.getByTestId('profile')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/chat$/);
  await page.goto('/personalization');
  await expect(page.getByTestId('profile')).toBeVisible();
  await page.goto('/khong-co');
  await expect(page.getByTestId('not-found')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/chat');
  await expect(page.getByTestId('bottom-nav')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
});

test('singleton: một instance React, Remote không tải React riêng, không lỗi Hook', async ({ page }) => {
  const reqs: string[] = []; const errors: string[] = [];
  page.on('request', (r) => reqs.push(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/lab');
  await expect(page.getByTestId('practice-screen')).toBeVisible();
  await expect(page.getByTestId('profile')).toBeVisible();
  expect(await page.evaluate(() => new Set(window.__reactCopies).size)).toBe(1);
  expect(await page.evaluate(() => window.__reactCopies!.length)).toBeGreaterThanOrEqual(3);
  expect(reqs.filter((u) => /:300[13]\//.test(u) && u.includes('node_modules_react'))).toEqual([]);
  expect(errors.filter((e) => e.includes('Invalid hook call'))).toEqual([]);
});

test('lỗi: Progress tắt → fallback đúng vùng; Chat vẫn dùng được; bật lại + Retry', async ({ page }) => {
  await page.goto('/lab');
  const fb = page.getByTestId('progress-fallback');
  await expect(fb).toBeVisible();
  await expect(fb).toContainText('Progress is temporarily unavailable');
  await expect(fb).toContainText('Your practice conversations and profile are not affected');
  await pick(page, 'renting');
  await expect(page.getByTestId('agent-text').first()).toContainText('Chào cháu');
  await startProgress();
  await fb.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByTestId('progress')).toBeVisible();
});

test('lỗi render trong Chat ("/crash") → Error Boundary cô lập; Retry khôi phục', async ({ page }) => {
  await page.goto('/lab');
  await pick(page, 'renting');
  await page.getByLabel('Your reply').fill('/crash');
  await page.getByTestId('send-button').click();
  await expect(page.getByTestId('chat-fallback')).toBeVisible();
  await expect(page.getByTestId('profile')).toBeVisible();
  await expect(page.getByTestId('progress')).toBeVisible();
  await page.getByTestId('chat-fallback').getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByTestId('practice-screen')).toBeVisible();
});

// ---------------------------------------------------------------- Practice
test('Practice: 8 tình huống, lọc theo nhóm, Recommended (Renting + Meeting neighbors), badge New', async ({ page }) => {
  await page.goto('/chat');
  await expect(page.locator('[data-testid^="scenario-"]')).toHaveCount(8);
  await expect(page.getByTestId('scenario-renting')).toHaveAttribute('data-recommended', 'true');
  await expect(page.getByTestId('scenario-neighbors')).toHaveAttribute('data-recommended', 'true');
  await expect(page.locator('[data-recommended="true"]')).toHaveCount(2);
  await expect(page.getByTestId('scenario-doctor').getByTestId('badge')).toHaveText('New');
  await page.getByRole('button', { name: 'Social' }).click();
  await expect(page.locator('[data-testid^="scenario-"]')).toHaveCount(2);
});

test('Practice: Facade tắt → thông báo lỗi + Retry (Host và nav không ảnh hưởng)', async ({ page }) => {
  await page.goto('/chat?facade=http://localhost:4999');
  await expect(page.getByTestId('practice-error')).toContainText('Scenarios are temporarily unavailable');
  await expect(page.getByTestId('host-title')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});

// ---------------------------------------------------------------- Chat theo wireframe
test('hội thoại Renting theo wireframe: nhân vật, ngữ cảnh, thẻ Address, bản dịch, ghi chú văn hóa "Sample", Mark as done', async ({ page }) => {
  await page.goto('/chat');
  await pick(page, 'renting');
  await expect(page.getByTestId('character')).toHaveText('Landlord, male, ~60');
  await expect(page.getByTestId('ctx-age')).toHaveText('You: 28');
  await expect(page.getByTestId('ctx-rel')).toHaveText('Relationship: landlord');
  await expect(page.getByTestId('agent-text').first()).toHaveText('Chào cháu, cháu muốn hỏi gì về căn phòng?');
  await expect(page.getByTestId('agent-translation').first()).toHaveText('Hello, what would you like to ask about the room?');
  await expect(page.getByTestId('mark-done')).toBeDisabled();

  await say(page, 'Bạn ơi, tiền điện bao nhiêu?');
  await expect(page.getByTestId('user-translation')).toHaveText('Hey, how much is the electricity?');   // Facade dịch tin của người học
  await expect(page.getByTestId('address-suggested')).toHaveText('Bác ơi, tiền điện bao nhiêu ạ?');
  await expect(page.getByTestId('card-address')).toContainText('Usage may vary by region/family.');
  await expect(page.getByTestId('card-address')).toContainText('use bác and refer to yourself as cháu');
  await expect(page.getByTestId('agent-text').nth(1)).toHaveText('Điện ba nghìn rưỡi một số. Cháu đặt cọc một tháng nhé?');
  await expect(page.getByTestId('agent-translation').nth(1)).toContainText('3,500 VND per unit');
  await expect(page.getByTestId('card-cultural')).toContainText('Handing over money');
  await expect(page.getByTestId('sample-badge')).toBeVisible();
  await lastAgentDone(page);

  await expect(page.getByTestId('mark-done')).toBeEnabled();      // sau ≥ 1 lượt hoàn tất
  await page.getByTestId('mark-done').click();
  await expect(page.getByTestId('mark-done')).toContainText('Marked as done');
  await page.getByRole('button', { name: 'Change scenario' }).click();
  await expect(page.getByTestId('scenario-renting').getByTestId('badge')).toHaveText('Done');
  await expect(page.getByTestId('scenario-renting')).toHaveAttribute('data-recommended', 'false'); // Done thì không gợi ý nữa
});

test('"Need a hint?" → 2 gợi ý; chọn một → điền vào ô nhập, KHÔNG gửi', async ({ page }) => {
  await page.goto('/chat');
  await pick(page, 'renting');
  await expect(page.getByTestId('agent-text').first()).toBeVisible(); await lastAgentDone(page);
  await expect(page.getByTestId('suggestions')).toHaveCount(0);
  await page.getByTestId('hint-button').click();
  await expect(page.getByTestId('suggestions').getByRole('button')).toHaveCount(2);
  await page.getByTestId('suggestions').getByRole('button').nth(1).click();
  await expect(page.getByLabel('Your reply')).toHaveValue('Bác cho cháu xin giấy biên nhận ạ.');
  await expect(page.getByTestId('msg-user')).toHaveCount(0);
});

test('thiếu ngữ cảnh (TC-XH-15) → thẻ hỏi làm rõ; chọn chip → gửi như câu trả lời', async ({ page }) => {
  await page.goto('/chat');
  await pick(page, 'renting'); await lastAgentDone(page);
  await say(page, 'Tôi muốn hỏi người đó nên gọi thế nào');
  const card = page.getByTestId('card-clarify');
  await expect(card).toContainText('Người đó khoảng tuổi nào so với bạn và hai người đang ở trong tình huống nào?');
  await expect(page.getByLabel('Your reply')).toBeEnabled();
  await card.getByRole('button', { name: 'Older than me' }).click();
  await expect(page.getByTestId('msg-user').last()).toHaveText('Older than me');
  await expect(card.getByRole('button')).toHaveCount(0); // đã trả lời
});

test('nút micro: chỉ hiển thị, vô hiệu; ?mic=0 ẩn đi', async ({ page }) => {
  await page.goto('/chat');
  await pick(page, 'renting');
  await expect(page.getByTestId('mic-button')).toBeDisabled();
  await page.goto('/chat?mic=0'); await pick(page, 'renting');
  await expect(page.getByTestId('mic-button')).toHaveCount(0);
});

test('nút Stop: dừng giữa chừng, giữ phần đã nhận, không tính lượt, gửi tiếp được', async ({ page }) => {
  await page.goto('/chat?facade=http://localhost:4001');
  await pick(page, 'renting');
  await expect(page.getByTestId('agent-text').first()).toContainText('Chào cháu', { timeout: 15_000 }); await lastAgentDone(page);
  await say(page, 'Bác ơi, tiền điện bao nhiêu ạ?');
  await expect(page.getByTestId('replying')).toBeVisible();
  await page.getByRole('button', { name: /Stop/ }).click();
  await expect(page.getByTestId('replying')).toHaveCount(0);
  await expect(page.getByTestId('stopped')).toBeVisible();
  await expect(page.getByLabel('Your reply')).toBeEnabled();
  await expect(page.getByTestId('mark-done')).toBeDisabled();         // lượt bị hủy không được tính
  await page.waitForTimeout(1500);                                    // sự kiện muộn không được làm đổi nội dung
  await expect(page.getByTestId('agent-text').last()).not.toContainText('đặt cọc');
});

test('lỗi stream ("/error") → banner + Retry; vẫn gõ được tin mới', async ({ page }) => {
  await page.goto('/chat');
  await pick(page, 'renting'); await lastAgentDone(page);
  await say(page, '/error');
  const banner = page.getByTestId('chat-error');
  await expect(banner).toContainText('Reply interrupted');
  await expect(page.getByText('Incomplete reply')).toBeVisible();
  await expect(page.getByLabel('Your reply')).toBeEnabled();
  await banner.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByTestId('chat-error')).toBeVisible();          // Facade mock lỗi lại: Retry đã gửi request mới
  await expect(page.getByTestId('msg-user')).toHaveCount(1);           // không nhân đôi tin nhắn của người học
  await say(page, 'Bác ơi, tiền điện bao nhiêu ạ?');
  await expect(page.getByTestId('chat-error')).toHaveCount(0);
  await expect(page.getByTestId('agent-text').last()).toContainText('đặt cọc');
});

test('treo luồng ("/timeout") → hết idle timeout thì báo lỗi, không chờ vô hạn', async ({ page }) => {
  await page.goto('/chat?streamTimeout=1500');
  await pick(page, 'renting'); await lastAgentDone(page);
  await say(page, '/timeout');
  await expect(page.getByTestId('replying')).toBeVisible();
  await expect(page.getByTestId('chat-error')).toContainText('No data from the server for 1500 ms', { timeout: 6000 });
  await expect(page.getByTestId('replying')).toHaveCount(0);
});


test('câu tự gõ mà Facade mock chưa dịch được → chỉ hiện tiếng Việt, không lỗi', async ({ page }) => {
  await page.goto('/chat');
  await pick(page, 'renting'); await lastAgentDone(page);
  await say(page, 'Xin chào, tôi mới đến');
  await expect(page.getByTestId('msg-user')).toHaveText('Xin chào, tôi mới đến');
  await expect(page.getByTestId('user-translation')).toHaveCount(0);
  await expect(page.getByTestId('agent-text').last()).toBeVisible();
});

test('Progress: rỗng → nạp dữ liệu demo → biểu đồ 8 điểm giảm dần, Confidence, bản đồ tình huống như wireframe', async ({ page }) => {
  await page.goto('/progress');
  await expect(page.getByTestId('progress-empty')).toBeVisible();
  await expect(page.getByTestId('chart-empty')).toBeVisible();
  await page.getByTestId('seed-demo').click();
  await expect(page.getByTestId('chart-point')).toHaveCount(8);
  expect(await page.getByTestId('chart-point').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-value'))))).toEqual([7, 6, 6, 4, 4, 3, 2, 1]);
  await expect(page.getByTestId('chart-summary')).toHaveText('Down from 7 to 1 mistakes over 8 sessions.');
  await expect(page.getByTestId('mistakes-chart')).toHaveAttribute('aria-label', /7, 6, 6, 4, 4, 3, 2, 1/);
  const first = await page.getByTestId('chart-point').first().boundingBox(); const last = await page.getByTestId('chart-point').last().boundingBox();
  expect(last!.y).toBeGreaterThan(first!.y);                                  // lỗi giảm → điểm cuối thấp hơn điểm đầu
  expect(last!.x).toBeGreaterThan(first!.x);
  for (const [id, st] of [['banking', 'done'], ['street_food', 'done'], ['renting', 'in_progress'], ['market', 'in_progress'], ['neighbors', 'new']])
    await expect(page.getByTestId(`map-${id}`)).toHaveAttribute('data-status', st);
  const conf = async (g: string) => Number(await page.getByTestId(`confidence-${g}`).getAttribute('data-value'));
  expect(await conf('administrative')).toBeGreaterThan(0); expect(await conf('social')).toBe(0);
  for (const g of ['administrative', 'daily_life', 'social']) { const v = await conf(g); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
  await expect(page.getByTestId('progress-empty')).toHaveCount(0);
});

// ---------------------------------------------------------------- Liên Remote
test('event-bus + Facade xuyên Remote: Chat → Progress; Personalization → Chat; lưu hồ sơ qua Facade', async ({ page }) => {
  await page.goto('/lab');
  await expect(page.getByTestId('progress')).toBeVisible();
  await expect(page.getByTestId('progress-empty')).toBeVisible();
  await pick(page, 'renting'); await lastAgentDone(page);
  await say(page, 'Bác ơi, tiền điện bao nhiêu ạ?');
  await expect(page.getByTestId('progress-turns')).toContainText('Turns completed: 1');
  await expect(page.getByTestId('map-renting')).toHaveAttribute('data-status', 'in_progress');
  await expect(page.getByTestId('chart-point')).toHaveCount(1);                           // buổi luyện đầu tiên xuất hiện trên biểu đồ
  await lastAgentDone(page);
  await page.getByTestId('mark-done').click();
  await expect(page.getByTestId('map-renting')).toHaveAttribute('data-status', 'done');   // scenarioStatusChanged → Progress tải lại

  await expect(page.getByTestId('ctx-age')).toHaveText('You: 28');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('profile-msg')).toHaveText('No changes');
  await page.getByLabel('Age').fill('70');
  await page.getByRole('button', { name: 'North' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('profile-msg')).toHaveText('Saved (v1)');
  await expect(page.getByTestId('ctx-age')).toHaveText('You: 70');                        // profileUpdated → Chat lấy lại từ Facade
  await page.reload();                                                                    // Facade giữ hồ sơ theo anonymousId
  await expect(page.getByLabel('Age')).toHaveValue('70');
  await expect(page.getByRole('button', { name: 'North' })).toHaveAttribute('aria-pressed', 'true');
});

test('Personalization: tuổi không hợp lệ bị chặn; lỗi Facade khi lưu → thông báo, không mất dữ liệu nhập', async ({ page }) => {
  await page.goto('/personalization');
  await page.getByLabel('Age').fill('abc');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('profile-msg')).toContainText('between 5 and 120');
  await page.getByLabel('Age').fill('35');
  await page.route('**/profile', (r) => (r.request().method() === 'PUT' ? r.abort() : r.continue()));
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('profile-msg')).toContainText('Couldn’t save');
  await expect(page.getByLabel('Age')).toHaveValue('35');
});


// ---------------------------------------------------------------- Cấu hình theo môi trường (/config.json)
const CFG = { facadeUrl: 'http://localhost:4000', remotes: { chat: 'http://localhost:3001/remoteEntry.js', progress: 'http://localhost:3002/remoteEntry.js', personalization: 'http://localhost:3003/remoteEntry.js' } };
const serveConfig = (page: Page, cfg: object | number) => page.route('**/config.json', (r) => (typeof cfg === 'number' ? r.fulfill({ status: cfg, body: 'nope' }) : r.fulfill({ json: cfg })));

test('config.json: URL Remote lấy từ cấu hình – trỏ Chat tới cổng chết → fallback đúng vùng, Profile vẫn chạy', async ({ page }) => {
  await serveConfig(page, { ...CFG, remotes: { ...CFG.remotes, chat: 'http://localhost:3999/remoteEntry.js' } });
  await page.goto('/lab');
  await expect(page.getByTestId('chat-fallback')).toBeVisible();
  await expect(page.getByTestId('profile')).toBeVisible();
  await expect(page.getByTestId('config-warning')).toHaveCount(0);        // cấu hình hợp lệ → không cảnh báo
});
test('config.json: facadeUrl lấy từ cấu hình – trỏ tới cổng chết → Practice báo lỗi + Retry, Host vẫn chạy', async ({ page }) => {
  await serveConfig(page, { ...CFG, facadeUrl: 'http://localhost:4999' });
  await page.goto('/chat');
  await expect(page.getByTestId('practice-error')).toBeVisible();
  await expect(page.getByTestId('host-title')).toBeVisible();
});
test('config.json sai (javascript:) → cảnh báo, dùng mặc định cho trường đó, ứng dụng vẫn chạy', async ({ page }) => {
  await serveConfig(page, { ...CFG, remotes: { ...CFG.remotes, chat: 'javascript:alert(1)' } });
  await page.goto('/chat');
  await expect(page.getByTestId('config-warning')).toContainText('remotes.chat');
  await expect(page.getByTestId('practice-screen')).toBeVisible();        // dùng URL mặc định hợp lệ
});
test('config.json không có (404) → cảnh báo, dùng mặc định, ứng dụng vẫn chạy', async ({ page }) => {
  await serveConfig(page, 404);
  await page.goto('/chat');
  await expect(page.getByTestId('config-warning')).toContainText('config.json not found');
  await expect(page.getByTestId('practice-screen')).toBeVisible();
});

// ---------------------------------------------------------------- CSS
test('CSS: Host reset toàn cục; style Remote không đè nhau (cùng token màu, khác prefix)', async ({ page }) => {
  await page.goto('/lab');
  await pick(page, 'renting');
  await expect(page.getByTestId('profile')).toBeVisible();
  const bg = (loc: ReturnType<typeof page.getByRole>) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
  const send = await bg(page.getByTestId('send-button'));
  const save = await bg(page.getByRole('button', { name: 'Save' }));
  expect(send).toBe('oklch(0.511 0.096 186.391)');   // teal-700 (Tailwind v4 trả oklch)
  expect(save).toBe(send);
  expect(await page.evaluate(() => getComputedStyle(document.body).margin)).toBe('0px');
  expect(await page.getByRole('link', { name: 'Practice' }).first().evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('none');
});
