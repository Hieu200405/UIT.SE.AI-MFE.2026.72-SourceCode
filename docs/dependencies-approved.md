# Dependency đã duyệt (AGENTS.md: không tự thêm)

| Gói | Phiên bản (ghim) | Loại | Lý do / ghi chú |
|---|---|---|---|
| react, react-dom | 18.3.1 | dependencies | Ghim React 18 theo `requiredVersion: '^18.0.0'` (Architecture) |
| webpack | 5.111.1 | dependencies | Module Federation; dùng qua Node API |
| typescript | 5.9.3 | dev | **Không dùng 7.x**: `ts-loader` lỗi `fileExists` với TS 7.0.2 (đã thử) |
| ts-loader | 9.6.2 | dev | TS + JSX; `transpileOnly`, kiểm kiểu bằng `tsc --noEmit` |
| @types/react, @types/react-dom | 18.3.31 / 18.3.7 | dev | Khớp React 18 (bản 19.x không khớp) |
| tailwindcss, @tailwindcss/postcss | 4.3.3 | dev | Cô lập bằng `prefix()` + chỉ import theme/utilities ở Remote |
| postcss | 8.5.29 | dev | |
| postcss-loader, css-loader, style-loader | 8.2.1 / 7.1.5 / 4.0.0 | dev | Xử lý CSS trong webpack |
| @playwright/test | 1.64.0 | dev | e2e chính thức. Cục bộ: `PW_CHROMIUM_PATH`; CI: `npx playwright install chromium` |

Quản lý gói: npm + npm workspaces (`packages/*`). Facade và Docker không thêm dependency npm (dùng `node:http`, `node:sqlite`, `fetch` có sẵn trong Node 22).

## Mobile (apps/mobile – cài riêng; đã duyệt theo docs/mobile-dependencies-proposal.md, danh sách "nên duyệt")
expo ~57.0.28 (cài 57.0.31), react 19.2.3, react-native 0.86.3, expo-router ~57.0.26, react-native-screens ~4.26.0, react-native-safe-area-context ~5.7.0, expo-status-bar ~57.0.1, expo-constants ~57.0.21, expo-linking ~57.0.12, react-native-svg 15.15.4, @react-native-async-storage/async-storage 2.2.0.
Dev: jest ~29.7.0, jest-expo ~57.0.6, @testing-library/react-native 14.1.0, @types/react ~19.2.2, typescript ~5.9.3.
Chưa duyệt/chưa dùng: expo-notifications (4.1), expo-speech (1.8), NativeWind.

## Hạ tầng (không phải dependency npm, cần nhóm chấp nhận)
Docker base image `node:22-slim`. Nhà cung cấp LLM mặc định đề xuất: Groq free (OpenAI-compatible); đổi nhà cung cấp chỉ bằng biến môi trường.

## Chưa duyệt
webpack-cli, webpack-dev-server, html-webpack-plugin, pnpm, react-router (Host dùng router tối giản tự viết), Zustand.
