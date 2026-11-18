# T218 — UI so sánh và hội thoại tự nhiên

Ngày 2026-11-18, branch codex/t218-rich-agent-ui. Giữ thay đổi T216/T217 chưa commit.

## Hiện thực
- Contract v0.9 additive: choice presentation comparison; optionDetails.facts 2–4 tiêu chí bounded, nhãn/thứ tự giống nhau giữa mọi option. So sánh thiếu dữ liệu/mismatched labels bị từ chối qua validator chung. Không HTML/URL/component tùy ý từ AI.
- Thẻ chọn so sánh hiển thị tiêu chí, trạng thái selected; responsive một cột ở 390px; native radio/keyboard; preview lựa chọn chưa gửi; receipt vẫn phân biệt gửi và tiếp tục bằng chat. Ô chat không nổi đè form đang mở.
- Prompt yêu cầu model dùng comparison khi cần so sánh, compact/cards/text-only ở trường hợp khác. Không thêm wizard/catalog cố định. Mô tả facts bằng tiếng Anh; tên món/câu luyện tiếng Việt được giữ.
- Lời thoại theo vai, ngắn, tránh xác nhận hành chính/câu đóng hội thoại lặp; phân biệt ý định với hành động đã hoàn tất. Nói sẽ trả tiền mặt không đồng nghĩa đã giao/nhận tiền.

## Kiểm chứng
- Schema so sánh hợp lệ/sai thiếu option, đảo nhãn, nhãn trùng, value object/quá dài/placeholder; provider fixture → comparison → submit → model nhận lựa chọn.
- E2E cuối 28/28 pass (43.8s); keyboard, preview, thay đổi lựa chọn, mobile, reduced motion. Đã xem ảnh desktop/mobile và phát hiện composer sticky che form desktop; sửa position static khi form đang mở, regression kiểm tra composer static pass.
- Build 4 apps/lint, typecheck web/mobile pass. Full test cuối 179/179, LLM 53/53, contract 20/20; git diff --check pass. Ca test submit ban đầu gửi message rỗng không hợp contract trả400; đã sửa fixture gửi summary hợp lệ, không nới validator production.
- Groq thật (openai/gpt-oss-120b), Node nạp key runtime, dev=false/fallback=error; t218-live sinh comparison Phở bò/Bánh mì thịt với Texture/Serving và submit thành công. Mô tả ban đầu bằng Việt dù labels Anh; đã tăng chỉ dẫn English facts. Lần này chưa đại diện prompt English cuối.

## Bằng chứng Groq và hình ảnh
- `test-results/t218-live/report.json`: pass open → yêu cầu so sánh → submit → 4 followups, không Retry. Thêm rau, hỏi tổng, chọn tiền mặt, xin khăn giấy. Khi chọn tiền mặt trả “Tiền mặt nhé, cảm ơn bạn!”, không khẳng định đã nhận tiền.
- Còn lỗi chất lượng ở followup cuối lần đầu: câu chứa ký tự 給 và câu kết “Bạn còn muốn gì nữa không?”. Status pass của script là pass luồng/contract, KHÔNG phải duyệt ngôn ngữ toàn bộ. Chưa có guard/repair riêng cho lỗi ngôn ngữ này; không coi naturalness hoàn tất.
- `test-results/t218-live-final/report.json`: bản prompt English và CSS composer cuối, pass open → comparison → submit, recoveredErrors=[]; không chạy lại 4 followups ở lần cuối. Labels, description và facts của Phở bò/Bánh mì thịt bằng English; lựa chọn Phở bò được dùng trong câu tiếp “Được, mình ghi phở bò không cay cho bạn.”
- Đã xem ảnh thật desktop `test-results/t218-live-final/generated-ui.png` và mobile `comparison-mobile.png`: 2 thẻ cạnh nhau trên desktop, xếp dọc 390px, tiêu chí và preview đọc được, nút submit không bị composer che. Mobile bottom navigation cố định có thể xuất hiện giữa ảnh chụp toàn form dài; kiểm tra viewport không tràn ngang pass.
- Tất cả live chạy nhịp 30 giây, cùng model/key, không mock/route interception. Không suy diễn độ ổn định tải cao từ các lượt thử này. Đã dừng server thử sau kiểm chứng.

## Giới hạn
Facts/lời thoại là dữ liệu model cho đóng vai, không phải dữ liệu văn hóa được duyệt. Schema xác nhận cấu trúc, không xác nhận mọi nhận xét là đúng. Không thêm dữ liệu quy tắc xưng hô/văn hóa. Naturalness phải xem transcript nhiều tình huống, không suy ra chỉ từ unit tests. Không đọc/ghi .env, không dependency mới, chưa commit/push/PR.
