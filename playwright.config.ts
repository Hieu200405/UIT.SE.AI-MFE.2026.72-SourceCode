import { defineConfig } from '@playwright/test';

// PW_CHROMIUM_PATH: dùng Chromium có sẵn (môi trường không tải được trình duyệt). Trên CI: `npx playwright install chromium`.
export default defineConfig({
  testDir: 'tests/e2e', timeout: 30_000, workers: 1, reporter: 'list',
  use: { baseURL: 'http://localhost:3000', launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined } },
  webServer: [
    { // Host + Remote tĩnh. Progress (3002) cố ý KHÔNG chạy sẵn: test tự bật/tắt để kiểm tra cô lập lỗi và Retry.
      command: 'node scripts/poc-serve.cjs host=3000 chat-remote=3001 personalization-remote=3003',
      url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 15_000 },
    { // Facade mock nhanh
      command: 'node --experimental-strip-types packages/ai-service-facade/src/main.ts',
      env: { PORT: '4000', FACADE_DELAY_SCALE: '0.2', FACADE_DEV: '1' }, url: 'http://localhost:4000/health', reuseExistingServer: !process.env.CI, timeout: 15_000 },
    { // Facade mock chậm (để thử nút Stop)
      command: 'node --experimental-strip-types packages/ai-service-facade/src/main.ts',
      env: { PORT: '4001', FACADE_DELAY_SCALE: '12' }, url: 'http://localhost:4001/health', reuseExistingServer: !process.env.CI, timeout: 15_000 },
  ],
});
