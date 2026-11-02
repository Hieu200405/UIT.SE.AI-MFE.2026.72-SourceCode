# 003 – Chat Remote (Trợ lý Hội thoại Tình huống) – spec v0.2

Chỉ chứa WHAT/WHY. Clarify đã chốt: xem clarify.md. Contract: packages/shared-types (v0.2).

## User stories
- US-1 (1.1) Chọn một tình huống đời sống thật để luyện đúng thứ sắp gặp.
- US-2 (1.2, 1.6) Trò chuyện đóng vai với nhân vật AI, thấy câu trả lời hiện dần, dừng được.
- US-3 (1.3, 1.4) Được báo ngay khi gọi sai người đối diện, kèm lý do và câu gợi ý.
- US-4 (1.5) Thấy mẹo văn hóa đúng lúc.
- US-5 (1.7, Should) Khi bí, bấm "Need a hint?" để xem 1–2 câu mẫu, chọn để điền vào ô nhập.

## Functional requirements
- FR-1 Thư viện ≥ 6 tình huống (wireframe: 8), lọc Administrative / Daily life / Social; thẻ "Recommended for you" theo hồ sơ (3.1).
- FR-2 Badge New / In progress / Done lấy từ Facade (`GET /progress`); quy tắc: In progress = ≥1 lượt hoàn tất, Done = hoàn thành mục tiêu kịch bản.
- FR-3 Sidebar/header hiển thị nhân vật AI (vd. "Landlord, male, ~60") và ngữ cảnh người học (tuổi, quan hệ).
- FR-4 Streaming + nút Stop; lượt mới/hủy không lẫn nội dung cũ; sự kiện muộn bị bỏ.
- FR-5 Mỗi tin nhắn tiếng Việt kèm bản dịch EN (`translation`); nếu chưa có thì chỉ hiện tiếng Việt, không chặn.
- FR-6 Thẻ Address: `originalText` (gạch ngang), `suggestedText`, `explanation`, danh sách giả định (`assumptions`) nếu có, disclaimer "Usage may vary by region/family" (luôn hiển thị).
- FR-7 Thiếu hoàn toàn dữ kiện → nhận `needs_clarification`: hiển thị câu hỏi + giả định + chip lựa chọn; trả lời bằng chip hoặc gõ tự do.
- FR-8 Thẻ Cultural note: `verified=false` → nhãn "Sample"; trên mobile thu gọn/mở rộng được.
- FR-9 (Should) "Need a hint?" mở dải Reply suggestions (≤2, mỗi cái có text + translation); chọn → điền ô nhập.
- FR-10 Nút micro chỉ hiển thị (disabled, aria-label "Voice input – coming soon"), điều khiển bởi feature flag `ui.micButton`; không gọi Web Speech.
- FR-11 Lỗi stream/timeout/Facade lỗi → trạng thái `failed`: banner lỗi, giữ lại nội dung nhận được đã đánh dấu "chưa hoàn tất", nút "Retry" (nếu `retryable`) và vẫn gõ được tin mới.
- FR-12 Màn Practice: loading (skeleton thẻ), empty (không có tình huống / lọc không ra kết quả → nút "Clear filter"), lỗi tải (Retry).
- FR-13 Hoàn tất lượt → phát conversationTurnCompleted.
- FR-14 Nút "Mark as done" (tắt khi chưa hoàn tất lượt nào) + checklist `objectives` gợi ý; bấm → Facade `setScenarioDone` → phát `scenarioStatusChanged`; bấm lại để bỏ đánh dấu.

## Trạng thái giao diện (bổ sung theo G3–G5) – xem docs/wireframes/ui-states.html
| Trạng thái | Khi nào | Hành vi |
|---|---|---|
| Streaming | nhận text_delta | cursor + "Landlord is replying" + Stop |
| Clarifying | nhận needs_clarification | thẻ hỏi, ô nhập sẵn sàng, Stop ẩn |
| Completed | done | bật hint/suggestions, gửi event |
| Cancelled | Stop | giữ phần đã nhận, nhãn "Stopped" |
| Failed | error / timeout / mất SSE | banner + Retry |
| Practice loading / empty / error | tải danh sách | skeleton / empty message / Retry |

## Acceptance criteria
- AC-1 Chủ nhà nam ~60, người dùng 28 gõ "Bạn ơi, tiền điện bao nhiêu?" → thẻ Address gợi ý "Bác ơi, tiền điện bao nhiêu ạ?", dùng bác/cháu, có disclaimer.
- AC-2 Giới tính "Prefer not to say" → không suy đoán; dùng câu không cần tự xưng hoặc hỏi thêm (TC-XH-04, 09).
- AC-3 Bấm Stop → dừng, trạng thái cancelled; event muộn cùng requestId bị bỏ.
- AC-4 ui_card type lạ/schema sai → không dựng, hiển thị văn bản thường.
- AC-5 Progress Remote lỗi → Chat vẫn dùng được.
- AC-6 Không có ngữ cảnh (TC-XH-15) → hiện thẻ hỏi làm rõ, không trả cách xưng hô chắc chắn.
- AC-7 Stream đứt giữa chừng → không chờ vô hạn; hiện lỗi + Retry; Retry gửi lại cùng nội dung với requestId mới.
- AC-8 Chọn một Reply suggestion → ô nhập được điền, chưa gửi.
- AC-9 Badge Practice khớp dữ liệu `GET /progress` mà không import Progress Remote.
- AC-11 Chưa có lượt hoàn tất → "Mark as done" bị vô hiệu; sau ≥ 1 lượt bấm được → badge Practice đổi sang Done và Progress cập nhật.
- AC-12 Practice hiển thị tối đa 2 thẻ Recommended, bỏ tình huống Done (dữ liệu wireframe → Renting + Meeting neighbors).
- AC-10 Micro button không gọi API nào khi bấm; flag tắt → ẩn nút.

## Out of scope
Chấm điểm phát âm; STT/nhập giọng nói; ngữ pháp tách rời tình huống; đăng nhập; cấu hình API key; leaderboard/badge trang trí.

## Cập nhật v0.3
- FR-5 mở rộng: tin của người học cũng có bản dịch EN khi Facade gửi `user_translation` (không bắt buộc).
- FR-15 Sau khi dừng (Stop), hiện ghi chú "Reply stopped…" (kể cả khi chưa nhận được chữ nào).
