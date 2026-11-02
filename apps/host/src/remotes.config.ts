// Metadata cố định của từng Remote. URL thật lấy từ config lúc chạy (config.ts → getRemotes).
export interface RemoteDef { scope: string; url: string; module: string; label: string }
export const REMOTE_META = {
  chat: { scope: 'chat', module: './ChatApp', label: 'Practice' },
  progress: { scope: 'progress', module: './ProgressApp', label: 'Progress' },
  personalization: { scope: 'personalization', module: './PersonalizationApp', label: 'My Profile' },
} as const;
