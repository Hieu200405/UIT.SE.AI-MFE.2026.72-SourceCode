# Kế hoạch hoàn tất baseline — 2026-11-11

Người dùng đã xác nhận: hoàn tất 10 Core + Mobile 4 màn theo CR-001; cho phép cập nhật spec/plan/tasks và triển khai lần lượt. Không thêm dependency, không mở rộng Should/Nice, không thay đổi Constitution.

1. Đối chiếu Charter, Setup SDD, tài liệu nền tảng, mô hình hóa, Tech Stack và tài liệu dự trữ với code. Các ví dụ/hướng nghiên cứu trong tài liệu không phải yêu cầu triển khai mới.
2. Khôi phục khả năng tái lập từ Git: dữ liệu nguồn phải được quản lý phiên bản, dữ liệu SQLite và secret vẫn bị loại.
3. Bổ sung kiểm tra kiến trúc tự động không thêm thư viện; chạy typecheck, unit/contract, build, E2E và mobile.
4. Sửa lỗi tái hiện được trong phạm vi task. Giữ các chỉnh sửa có sẵn của người dùng.
5. Lập ma trận yêu cầu–code–test và hồ sơ nghiệm thu trung thực. Kiểm thử local không thay thế CI/Docker thật, thiết bị mobile, demo online hoặc duyệt nội dung.

Nguồn chuẩn hiện tại: 001-host-shell, 002-ai-service-facade, 003-chat-remote, 004-progress-remote, 006-personalization, 006-mobile-companion, 008-cicd-docker. Các thư mục spec rỗng còn lại là scaffold cũ; không dùng chúng để kết luận đã hoàn thành.

Kết quả và giới hạn ghi tại docs/acceptance/. Không tự đổi trạng thái nội dung thành verified, không merge/publish khi chưa có đủ bằng chứng và nơi triển khai.

Tiếp tục T207/T208: người dùng giao tìm nguồn/soạn đối chiếu để duyệt, xác nhận hiện chỉ local và sẽ thử Android với Expo Go. Ưu tiên tài liệu giảng dạy đại học, nghiên cứu gốc và nguồn tổ chức; trích đúng phần hỗ trợ, không lấy ngưỡng tuổi trong code làm quy tắc ngôn ngữ. Hướng dẫn Android dùng SDK từ package hiện tại đối chiếu tài liệu Expo; không tự nâng SDK, cài dependency, mở firewall hoặc phát hành.
