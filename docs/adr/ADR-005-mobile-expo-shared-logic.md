# ADR-005 – App mobile Expo (SDK 57) tách khỏi workspace gốc, dùng lại logic qua package dùng chung

Trạng thái: Chấp nhận. Căn cứ: CR-001 phương án A; Charter (tái sử dụng Facade và logic với web).

## Quyết định
- **Expo SDK 57** (RN 0.86.3, React 19.2.3), không dùng SDK 58 (ra 19/10/2026; Expo Go chưa hỗ trợ). Điều hướng bằng `expo-router`; biểu đồ bằng `react-native-svg` (dùng lại `chartGeometry`).
- **Cài tách** (`apps/mobile` có package.json/lock riêng, không nằm trong `workspaces`): web dùng React 18.3.1, mobile React 19.2.3. Metro `watchFolders` + `extraNodeModules` trỏ tới `packages/*`, nên chỉ chia sẻ mã TypeScript thuần (không React).
- Đã tách `@app/chat-state` (reducer lượt) và `@app/chart-geometry` khỏi các Remote web để cả hai nền tảng dùng chung quy tắc hủy / sự kiện muộn / retry.
- `facade-client`: thay `TextDecoder` bằng `Utf8StreamDecoder` (Expo ghi chú TextDecoder native không đúng chuẩn; tiếng Việt là UTF-8 nhiều byte, chunk SSE có thể cắt giữa ký tự); thêm `getAnonymousIdAsync` cho AsyncStorage; mobile truyền `expo/fetch` (hỗ trợ streaming) qua `fetchImpl`.
- Không dùng NativeWind (dựa trên Tailwind v3, web dùng v4), reanimated, Redux/Zustand.

## Kiểm chứng đã làm (môi trường không có thiết bị)
tsc sạch (gồm test); 29 test jest-expo; `expo export` đóng gói Android + iOS thành công; test đột biến (bỏ hủy luồng khi rời màn hình) bị bắt.
## Chưa kiểm chứng
Chạy trên thiết bị/giả lập (xem apps/mobile/README.md).

## Đánh đổi
Hai lần cài đặt (gốc + mobile); `jest` cần ánh xạ `@babel/runtime` cho mã nằm ngoài apps/mobile; Facade phải truy cập được từ điện thoại (LAN/IP), nên cần cấu hình `EXPO_PUBLIC_FACADE_URL`.
