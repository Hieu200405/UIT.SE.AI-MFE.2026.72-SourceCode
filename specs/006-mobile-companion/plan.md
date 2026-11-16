# Mobile baseline — Plan

Giữ ADR-005 và CR-001 phương án A: Expo 4 màn, dùng Facade, shared-types, chat-state, chart-geometry; không thêm dependency.

T203 kiểm tra teardown của test async: chờ stream kết thúc, unmount trong act/cleanup; không lọc console để che lỗi. Chạy Jest, tsc và Metro export với EXPO_NO_DOTENV=1. Export không thay thế thử trên thiết bị/giả lập.

T208: thiết bị người dùng chọn là Android thật/Expo Go. Soạn quy trình LAN, Facade mock riêng cổng 4010, Metro SDK 57, vô hiệu dotenv, và phiếu AND-01…08. Chưa thực hiện thay người dùng thao tác điện thoại; không đánh dấu pass từ kết quả export.
