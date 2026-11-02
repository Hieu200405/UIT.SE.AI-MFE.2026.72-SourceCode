# Đối chiếu wireframe ↔ tài liệu nguồn

## Khớp tốt
- 8 tình huống = danh sách 1.1; 3 nhóm lọc = Hành chính/Sinh hoạt/Xã giao.
- Thẻ Address term có "Usage may vary by region/family" (đúng tiêu chí Pass TC-XH).
- Gender có "Prefer not to say" và gợi ý dùng "cháu" (không gán giới tính người học).
- Cultural note gắn "Sample text", Progress chart gắn "Placeholder chart" (đúng Constitution #13).
- Có nút Stop (hủy request), con trỏ streaming, màn lỗi Progress + Retry (TP7).
- Màn lỗi nói rõ "conversations and profile are not affected" – đúng cô lập lỗi.

## Khoảng trống cần xử lý
| ID | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| G1 | Mọi tin nhắn có bản dịch EN, nhưng `text_delta` chỉ có `text` | Contract thiếu | Thêm `translation` (hoặc part riêng) vào AgentMessage; cập nhật shared-types + contract test |
| G2 | Thẻ Address hiển thị "You said / Suggested / Reason" | AddressingFeedback chỉ có suggestedTerms/isCorrection/explanation | Thêm originalText, suggestedText |
| G3 | Reply suggestion có VN + EN | Schema chỉ `suggestions` | Mỗi gợi ý {text, translation} |
| G4 | Chưa có UI cho `needsClarification` (TC-XH-15) | Thiếu trạng thái | Thiết kế thẻ hỏi làm rõ / chip chọn nhanh |
| G5 | Chưa có UI stream lỗi/timeout/retry trong Chat | FT-02, SSE-04 | Thêm trạng thái failed + nút Gửi lại |
| G6 | Tiêu chí New/In progress/Done chưa định nghĩa; badge ở Practice cần dữ liệu tiến độ | Chat không được import Progress | Chat đọc GET /progress qua Facade |
| G7 | Nút micro chưa có trong Đặc tả | Scope creep | Thêm vào Đặc tả (Should) hoặc bỏ khỏi wireframe |
| G8 | Wireframe mobile là responsive web (bottom nav); app React Native (4.1 gợi ý theo bối cảnh + thông báo, 4.2 tra cứu nhanh xưng hô) chưa có wireframe | Thiếu thiết kế Giai đoạn II | Vẽ 2 màn RN: Quick address lookup; Notification/phrase of the moment |
| G9 | Có 2 lối vào gợi ý (dải suggestions + Need a hint?) | Mơ hồ 1.7 | Chốt ở clarify #8 |
| G10 | Hình wireframe có Should-have (suggestions, Confidence, vùng miền) | Cần sẵn sàng cắt | Ẩn bằng feature flag |
| G11 | Chưa có empty/loading state cho Practice, Progress | Thiếu | Bổ sung skeleton/empty |

## Lỗi nhỏ trong tài liệu nguồn (nên sửa)
- Test Strategy §8: bảng nhóm 15 ca ánh xạ sai (vd. TC-XH-09 là em trai của bạn, TC-XH-10 là hàng xóm, TC-XH-11 là thiếu dữ kiện).
- Architecture đề xuất endpoint cụ thể, API Contract nói chưa chốt: nên thống nhất một nơi.

## Trạng thái xử lý (cập nhật sau khi 2 thành viên xác nhận)
| ID | Trạng thái | Nơi xử lý |
|---|---|---|
| G1 | Đã xử lý | shared-types v0.2 (`translation` trong text_delta/AgentPart), specs/002 |
| G2 | Đã xử lý | AddressCardData: originalText, suggestedText, suggestedTerms |
| G3 | Đã xử lý | ReplySuggestionData: {text, translation}; Chọn → điền ô nhập |
| G4 | Đã xử lý | Event `needs_clarification` + wireframe A (ui-states.html) |
| G5 | Đã xử lý | FR-11, AC-7 + wireframe B/C |
| G6 | Đã chốt | Chat đọc qua Facade; In progress/Done định nghĩa ở clarify #6 |
| G7 | Đã chốt | Micro UI-only, flag `ui.micButton` |
| G8 | Một phần | 4 màn mobile đã ghi nhận ở 006; còn thiếu 4.1/4.2 – cần xác nhận hướng bổ sung |
| G9 | Đã chốt | Hint mở dải suggestions |
| G10 | Đã chốt | Feature flag `ui.hint`, `ui.micButton` |
| G11 | Đã xử lý | Wireframe D–I (loading/empty/error) |

## Cập nhật sau khi hiện thực UI Chat
| ID | Trạng thái |
|---|---|
| G1–G5, G9–G11 | Đã hiện thực và có test (xem specs/003/tasks.md) |
| G6 | Chat đọc badge và gợi ý qua Facade `GET /progress` |
| G7 | Micro hiển thị, vô hiệu (flag `?mic=0` để ẩn) |
| G8 | Mobile web đã có bottom-nav, composer theo wireframe mobile; app React Native chưa làm |
| G12 | Đã xử lý: Facade gửi `user_translation` (mock chỉ dịch câu có trong từ điển) |
| G13 | Đã xử lý: biểu đồ 2.2 (SVG tự viết, theo buổi luyện thay vì theo tuần) và Confidence 2.3 (công thức đề xuất) |
Lỗi UI phát hiện nhờ kiểm thử thật: composer bị ép trong cột hẹp (nút Gửi 18px); bấm Stop trước khi có chữ không có phản hồi → đã thêm ghi chú "Reply stopped".
