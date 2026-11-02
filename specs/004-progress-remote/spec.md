# 004 – Progress Remote – spec v0.1

## FR
- FR-1 Bản đồ tình huống theo 3 nhóm với 3 trạng thái Done / Practicing / Not tried (2.1, Core). Dữ liệu từ Facade `GET /progress`.
- FR-2 Biểu đồ "Address-term mistakes over time" (2.2, Core): mỗi điểm = một buổi luyện (lỗi xưng hô trong buổi), tối đa 8 buổi gần nhất; trục Y 0–8 bước 2 (tự co giãn khi lớn hơn); kèm câu tóm tắt xu hướng và mô tả cho trình đọc màn hình.
- FR-3 Confidence theo nhóm (2.3, Should-have): thanh trực quan, không CEFR; chú thích cách ước lượng.
- FR-4 Tải lại dữ liệu khi nhận `conversationTurnCompleted` hoặc `scenarioStatusChanged` (event chỉ là tín hiệu).
- FR-5 Trạng thái: loading (skeleton), rỗng ("No practice yet…"), lỗi ("Progress is temporarily unavailable" + Retry).
- FR-6 (dev) Nút "Load demo data" khi Facade ở chế độ dev và chưa có dữ liệu.

## AC
AC-1 Dữ liệu demo → 8 điểm [7,6,6,4,4,3,2,1], điểm sau thấp hơn điểm đầu · AC-2 Sau 1 lượt hoàn tất, biểu đồ có 1 điểm · AC-3 Buổi không có lượt hoàn tất không xuất hiện · AC-4 Lỗi Facade không làm sập Host (Retry tại chỗ) · AC-5 Không gọi Chat/Personalization trực tiếp.

## Khác biệt so với wireframe
Wireframe dùng trục tuần (Wk 1–8, nhãn "Placeholder chart"); bản hiện thực dùng **buổi luyện** vì dữ liệu thật phát sinh theo buổi. Cần xác nhận nếu muốn gộp theo tuần.
## Kiểm thử
apps/progress-remote/test (hình học biểu đồ, 5), packages/ai-service-facade/test (buổi luyện, Confidence, seed), tests/e2e (biểu đồ, Confidence, bản đồ).
