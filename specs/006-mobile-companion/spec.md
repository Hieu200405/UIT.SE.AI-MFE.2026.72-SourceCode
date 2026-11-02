# 006 – Mobile (React Native) – spec v0.3

Phương án A (CR-001): sản phẩm tối thiểu Giai đoạn II = 4 màn wireframe mobile. 4.1/4.2 = Should-have, chưa làm.

## Hiện thực (apps/mobile, Expo SDK 57 – ADR-005)
- FR-M1 Practice: danh sách theo mục "Recommended for you" / "All scenarios", lọc nhóm, badge, loading/empty/error. ✅
- FR-M2 Chat: streaming, thẻ Address, bản dịch (agent và người học), ghi chú văn hóa "Sample" thu gọn/mở, gợi ý (Hint → điền ô nhập), clarify, Stop, banner lỗi + Retry, "Mark as done" (trong mục Goals), micro chỉ hiển thị. ✅
- FR-M3 Progress: bản đồ tình huống, biểu đồ lỗi xưng hô (react-native-svg), Confidence, trạng thái rỗng/lỗi, nút dữ liệu demo (chỉ dev). ✅
- FR-M4 Profile: hồ sơ qua Facade, kiểm tra tuổi, trạng thái lưu/lỗi. ✅
- Dùng chung với web: shared-types, facade-client, chat-state, chart-geometry.

## Kiểm chứng
29 test jest-expo + tsc + `expo export` Android/iOS (xem README mobile). **Chưa chạy trên thiết bị/giả lập.**

## Chưa làm
4.1 thông báo theo bối cảnh (expo-notifications), 4.2 tra cứu nhanh xưng hô, 4.3 ôn tập ngắt quãng, 4.4 OCR, 4.5 widget; cấu hình Facade trong ứng dụng (hiện qua biến EXPO_PUBLIC_FACADE_URL); build bản phát hành (EAS) và cleartext HTTP trên Android.
