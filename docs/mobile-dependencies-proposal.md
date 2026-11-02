# Đề xuất gói cho app mobile React Native (ĐÃ DUYỆT nhóm "Nên duyệt" và đã cài trong apps/mobile – xem ADR-005)

Nguồn phiên bản: `bundledNativeModules.json` của `expo@57.0.28` (danh sách chính thức của Expo SDK 57), tra ngày 26/10/2026.

## Chọn SDK nào
**Expo SDK 57** (React Native 0.86.3, React 19.2.3), chưa dùng SDK 58 vì: SDK 58 mới ra 19/10/2026 (7 ngày), và Expo Go trên cửa hàng ứng dụng "vài tuần nữa" mới hỗ trợ SDK 58; chọn SDK 57 thì chạy được ngay bằng Expo Go. Nâng lên SDK 58 sau bằng `npx expo install expo@^58.0.0 --fix`.

## Nên duyệt (baseline: 4 màn Practice, Chat, Progress, Profile)
| Gói | Phiên bản | Để làm gì |
|---|---|---|
| expo | ~57.0.28 | nền tảng; có sẵn `expo/fetch` hỗ trợ streaming (đọc SSE) |
| react / react-native | 19.2.3 / 0.86.3 | |
| expo-router | ~57.0.26 | điều hướng + bottom tabs (Expo khuyến nghị thay cho dùng trực tiếp @react-navigation) |
| react-native-screens, react-native-safe-area-context | ~4.26.0, ~5.7.0 | phụ thuộc bắt buộc của router |
| expo-status-bar, expo-constants, expo-linking | ~57.0.1, ~57.0.21, ~57.0.12 | phụ thuộc của router/template |
| react-native-svg | 15.15.4 | vẽ biểu đồ (dùng lại `chartGeometry`) và icon (dùng lại path SVG) |
| @react-native-async-storage/async-storage | 2.2.0 | lưu `anonymousId` |
| typescript, @types/react | theo template Expo | |

## Chỉ khi làm tính năng Should-have
| Gói | Phiên bản | Tính năng |
|---|---|---|
| expo-notifications | ~57.0.22 | 4.1 gợi ý theo bối cảnh: dùng **thông báo cục bộ theo lịch**, không cần server push |
| expo-speech | ~57.0.3 | 1.8 đọc mẫu (giọng vi-VN phụ thuộc thiết bị) |

## Kiểm thử (nên có)
jest-expo ~57.0.6, @testing-library/react-native 14.1.0 (cài bằng `npx expo install` để Expo chọn đúng peer), e2e: Maestro (công cụ ngoài, không phải gói npm).

## Không khuyến nghị
NativeWind (bản 4.2.7 dựa trên Tailwind v3, web đang dùng v4; thêm cấu hình Babel/Metro) → dùng `StyleSheet` + token màu dùng chung. react-native-reanimated / gesture-handler / worklets (không cần cho baseline). Redux/Zustand/axios (đã có reducer + facade-client). Bộ UI kit (Paper, Elements…). Polyfill fetch riêng (`expo/fetch` đã đủ).

## Rủi ro đã biết (cần thử trên máy thật)
1. `TextDecoder` trên native "không đúng chuẩn" (docs Expo): tiếng Việt là UTF-8 nhiều byte, chunk SSE có thể cắt giữa ký tự → cần bộ giải mã UTF-8 tăng dần trong `facade-client` (có test).
2. RN không có `localStorage`/`crypto.randomUUID`: `getAnonymousId` hiện đồng bộ → cần bản bất đồng bộ dùng AsyncStorage.
3. Mobile dùng React 19 còn web dùng React 18.3.1 → app mobile phải cài **tách khỏi** npm workspace gốc; dùng lại `@app/shared-types`, `@app/facade-client` (chỉ TypeScript thuần) qua cấu hình Metro `watchFolders`.
4. Không có giả lập/thiết bị trong môi trường làm việc này: phần chạy trên điện thoại/giả lập phải do nhóm kiểm tra.
