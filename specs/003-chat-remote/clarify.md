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

## 2026-11-11 — Ưu tiên UI tương tác của Agent (chờ xác nhận hướng)

Người dùng muốn tạm ưu tiên UI tương tác vì trải nghiệm hiện giống chatbot. Kiểm tra code: có thẻ address/cultural_note, chip làm rõ và reply suggestions; thẻ sửa xưng hô còn chỉ đọc, luồng chính vẫn là danh sách tin nhắn.

Câu hỏi cần chốt trước khi tạo task triển khai:
- Hướng A (đề xuất): workspace luyện tập có mục tiêu, trạng thái thật, thẻ sửa câu với thao tác đưa vào ô soạn, gợi ý theo ngữ cảnh và phần tổng kết phiên; dùng registry/Facade hiện có. Tiến độ mục tiêu do người học xác nhận, không giả lập Agent đã đánh giá.
- Hướng B: Agent tạo biểu mẫu/chọn lựa theo tình huống và xử lý kết quả tương tác qua Facade; cần mở rộng contract và registry được cho phép trong AGENTS.md.
- Làm web trước hay đồng thời web + Android Expo Go?

Đây là thay đổi ưu tiên, chưa phải duyệt nội dung D1–D4 hoặc duyệt mở rộng registry. Chờ người dùng chọn hướng; chưa thay runtime.

## T209 — Đã chốt
Người dùng chọn hướng 2, web trước và yêu cầu triển khai ngay. Cho phép mở rộng registry đóng với scenario_form và contract trả kết quả tương tác qua Facade. Luồng hai bước chuẩn bị/luyện câu theo cả 8 tình huống, tiếp tục hội thoại tự do; không đổi nội dung văn hóa đang chờ duyệt.

## T210 — Đã chốt, thay luồng T209
Người dùng xác nhận giá trị cốt lõi là AI quyết định UI theo hội thoại và nhận thao tác rồi tiếp tục; triển khai web ngay. T209 biểu mẫu cố định được thay, không phải mô tả sản phẩm cuối.
