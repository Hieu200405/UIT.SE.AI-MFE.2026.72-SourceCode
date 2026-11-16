# Làm rõ phạm vi — 2026-11-11

## Đã xác nhận trong chat

1. Hoàn tất Core + Mobile 4 màn, kiểm thử và hồ sơ nghiệm thu trước. CR-001 phương án A tiếp tục áp dụng, không khôi phục 4.1/4.2 thành Core theo Charter cũ.
2. Cho phép cập nhật spec/plan/tasks, tạo task Txxx còn thiếu rồi triển khai lần lượt trong phạm vi trên.

## Cổng nghiệm thu chưa có bằng chứng

- Nội dung xưng hô/văn hóa: rules.json vẫn unverified; scripts.ts là sample. Cần người đối chiếu nguồn và xác nhận nội dung trước demo; không tự đánh dấu verified.
- Nơi triển khai demo, CI trên GitHub và thiết bị/giả lập mobile: cần xác định khả năng chạy thực tế sau các kiểm tra local.

Các mục này không ngăn sửa lỗi kỹ thuật đã xác định trong T201–T204; chúng ngăn tuyên bố nghiệm thu 100%.

## Câu hỏi đã được trả lời

1. Chưa có nguồn/người đối chiếu: người dùng giao tìm nguồn và soạn bản đối chiếu để duyệt (T207).
2. Chưa có URL/nơi triển khai, hiện chỉ local. Chưa được chọn nhà cung cấp hoặc tài khoản hosting.
3. Thiết bị nghiệm thu: điện thoại Android với Expo Go (T208).

Đã hoàn tất kiểm tra kỹ thuật độc lập; chưa sửa trạng thái nội dung, chưa phát hành và chưa tuyên bố nghiệm thu thiết bị.

## Đang chờ duyệt sau đối chiếu nguồn

T207: quyết định D1–D4 tại docs/acceptance/content-sources.md. Các nguồn hỗ trợ nguyên tắc, không xác nhận toàn bộ ngưỡng tuổi/predicate của engine. Cần người dùng chấp nhận/chỉnh bản thảo và ghi người đối chiếu; không tự đánh dấu 18 rule là verified. Kết quả Android thực tế ghi theo AND-01…08, không suy ra từ bundle.
