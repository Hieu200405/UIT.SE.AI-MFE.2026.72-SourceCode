# Kịch bản tổng duyệt và cổng phát hành

Đây là kịch bản kiểm thử nội bộ. Chưa dùng làm demo nghiệm thu bên ngoài khi nội dung vẫn chưa được xác minh.

## Chuẩn bị không cần LLM

1. Cài đúng lock tại root và apps/mobile. Không thay phiên bản tự động để khớp ví dụ trong tài liệu cũ.
2. Chạy `npm run lint`, `npm run typecheck`, `npm test`, `npm run poc:build`, `npm run test:images`.
3. Chạy `npm run test:e2e`. Trên Windows đang dùng, đặt `$env:PW_CHROMIUM_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'` trước lệnh. E2E từ chối dùng server có sẵn: cần cổng 3000/3001/3002/3003/4000/4001 trống.
4. Chạy `npm --prefix apps/mobile test -- --runInBand`, `npm run typecheck:mobile`, và bundle với `EXPO_NO_DOTENV=1`, `EXPO_NO_TELEMETRY=1`, `EXPO_OFFLINE=1`.

## Luồng trình diễn 10–15 phút sau khi nội dung được duyệt

1. Practice: 8 tình huống, lọc Administrative/Daily life/Social; chọn Renting.
2. Chat: quan sát lời mở đầu streaming; nhập “Bạn ơi, tiền điện bao nhiêu?”; xem thẻ sửa xưng hô và bản dịch.
3. Chứng minh kiểm soát của người học: Stop, gửi lại; hint chỉ điền ô nhập; không tự gửi.
4. Mark as done chỉ bật sau lượt hoàn tất; chuyển Progress xem trạng thái và điểm biểu đồ theo buổi.
5. Profile: thay mục đích/tuổi, chọn Prefer not to say; quay lại Chat chứng minh profile mới được dùng mà không import chéo Remote.
6. Fault tolerance bằng E2E hoặc môi trường thử riêng: tắt Progress → fallback đúng vùng; bật lại → Retry; thử stream mất kết nối/timeout.
7. Mobile: Practice → Chat → Progress → Profile; quay lại app; thử tiếng Việt dấu/emoji và bàn phím.

## Biên bản thiết bị Mobile còn phải điền

Thiết bị: người dùng chọn điện thoại Android với Expo Go; model/OS/phiên bản runtime chưa ghi nhận. Có [hướng dẫn LAN, SDK và phiếu AND-01…08](android-local.md). Facade URL không chứa secret: chưa xác định. Người thử/ngày: chưa xác định.

- [ ] Bốn màn điều hướng và layout đúng trên thiết bị.
- [ ] SSE hiện dần qua expo/fetch/Hermes, dấu tiếng Việt không hỏng.
- [ ] Stop/rời màn hình hủy request; sự kiện muộn không chen vào lượt mới.
- [ ] Bàn phím không che composer; cuộn tin nhắn hoạt động.
- [ ] Profile giữ sau khi đóng/mở; ghi rõ chế độ lưu trữ Facade.
- [ ] Mất mạng có lỗi/Retry; kết nối lại hoạt động.

## Demo online / CI / Docker

Cần URL Host, ba Remote và Facade; tài khoản hạ tầng do nhóm kiểm soát; không đưa key vào chat/repo/bundle. Remote/Facade phải có URL trình duyệt truy cập được, CORS phù hợp, cấu hình Host sinh đúng môi trường. Tắt FACADE_DEV trên bản công khai. Cần volume SQLite nếu muốn giữ tiến độ sau restart. Xác nhận cơ chế nội dung đã duyệt trước khi phát hành.

Lưu URL run GitHub Actions và kết quả ba job verify/docker/mobile cho commit cuối; chạy Docker smoke thực tế. `test:images` mô phỏng cấu trúc file, không chứng minh base image, quyền container, mạng Docker hoặc volume production.
