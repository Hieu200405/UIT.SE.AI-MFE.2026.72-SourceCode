# Mobile (Expo SDK 57 / React Native 0.86) – phương án A (CR-001)

4 màn theo wireframe mobile: **Practice, Chat, Progress, Profile** (bottom tabs). Dùng lại logic của web qua các package dùng chung: `@app/shared-types`, `@app/facade-client` (SSE, abort, timeout), `@app/chat-state` (reducer lượt hội thoại), `@app/chart-geometry` (biểu đồ vẽ bằng `react-native-svg`).
Tính năng 4.1 (thông báo) và 4.2 (tra cứu nhanh xưng hô) là Should-have, **chưa làm**.

## Chạy thử
```
cd apps/mobile
npm install                                   # cài tách khỏi workspace gốc (mobile dùng React 19, web dùng React 18)
# ở thư mục gốc: npm run dev (Facade mock :4000)  hoặc  docker compose up
EXPO_PUBLIC_FACADE_URL=http://<IP máy tính>:4000 npx expo start
```
Địa chỉ Facade (`EXPO_PUBLIC_FACADE_URL`): iOS Simulator `http://localhost:4000` · Android Emulator `http://10.0.2.2:4000` · điện thoại thật `http://<IP LAN máy tính>:4000` (cùng mạng Wi-Fi).
Dùng **Expo Go bản SDK 57** (SDK 58 mới ra 19/10/2026; Expo Go trên cửa hàng chưa hỗ trợ).

## Kiểm thử
```
npm test              # 29 test giao diện (jest-expo + Testing Library 14, Facade giả ở mức client)
npm run typecheck     # tsc, gồm cả test
npm run bundle        # Metro đóng gói Android thật (xác nhận mọi import, kể cả package dùng chung ngoài apps/mobile)
```
## CHƯA kiểm chứng (cần máy thật/giả lập)
- Chạy trên điện thoại/giả lập: bố cục thực tế, bàn phím, cuộn, điều hướng tab, hiệu năng.
- Luồng SSE qua `expo/fetch` trên thiết bị thật (bộ giải mã UTF-8 tăng dần đã được test ở Node, nhưng chưa thử trên Hermes).
- HTTP không mã hóa (cleartext) tới Facade trong mạng LAN: Android bản release có thể chặn; dev bằng Expo Go thường cho phép, cần xác nhận.
- Nút micro chỉ hiển thị (vô hiệu), không chức năng.
