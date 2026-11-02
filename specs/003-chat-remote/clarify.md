# Clarify – 003 Chat Remote — ĐÃ CHỐT (cả 2 thành viên xác nhận)

| # | Quyết định |
|---|---|
| 1 | Tuổi người đối diện chọn theo khoảng: dưới 20 / 20–35 / 35–50 / trên 50. Nhân vật trong tình huống có tuổi cố định (vd. chủ nhà ~60). |
| 2 | Thiếu thông tin: dùng mặc định + hiển thị giả định. Chỉ hỏi lại khi thiếu hoàn toàn (TC-XH-15). |
| 3 | Khác biệt vùng miền tách sang 3.3 (Should-have), không xử lý trong 1.3. |
| 4 | Quan hệ nghề nghiệp dùng danh xưng nghề (vd. "bác sĩ", TC-XH-12). |
| 5 | Bản dịch EN do Facade trả về; trường `translation` nằm trong part văn bản (shared-types v0.2). |
| 6 | "In progress" = ≥1 lượt hoàn tất; "Done" = hoàn thành mục tiêu kịch bản (mục tiêu định nghĩa trong dữ liệu tình huống). |
| 7 | Nút micro: chỉ hiển thị trong giao diện, KHÔNG có chức năng (không STT). Bật/tắt bằng feature flag `ui.micButton`. |
| 8 | "Need a hint?" và dải Reply suggestions là cùng tính năng 1.7; dải gợi ý chỉ hiện sau khi bấm hint. |
| 9 | Chọn một gợi ý → điền vào ô nhập để người dùng sửa rồi gửi, không gửi ngay. |
| 10 | Chat đọc dữ liệu badge (New/In progress/Done) qua Facade `GET /progress`, không import từ Progress Remote. |
| 11 | Wireframe mobile (4 màn cuối PDF) được dùng làm thiết kế của app mobile (xem 006). |
| 12 | "Đạt mục tiêu" do **người học tự đánh dấu** (nút "Mark as done" ở mức tình huống); `objectives` chỉ là checklist gợi ý, không đánh giá tự động. Chỉ đánh dấu được khi đã hoàn tất ≥ 1 lượt. |
| 13 | `recommendedFor`: settling = Renting, Visa, Banking, Meeting neighbors; long_term_travel = Market, Street-food; learning_culture = Meeting neighbors, Weddings. Hiển thị: chỉ tình huống chưa Done, ưu tiên đang dở, tối đa 2 thẻ, mỗi nhóm 1 thẻ trước. |
| 14 | Mobile: phương án A (CR-001) – baseline = 4 màn wireframe; 4.1/4.2 làm thêm nếu còn thời gian. |
| 15 | **ĐÃ CHỐT:** Facade gửi sự kiện `user_translation {requestId, translation}` sau khi nhận tin. Facade mock chỉ dịch được các câu có trong từ điển (gợi ý, câu mẫu wireframe); câu lạ → không có bản dịch, UI chỉ hiện tiếng Việt. LLM thật sẽ dịch mọi câu. |
