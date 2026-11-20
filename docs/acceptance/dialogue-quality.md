# T219 — Kiểm tra lời thoại trước hiển thị

Ngày 2026-11-19. Branch codex/t219-dialogue-quality.

## Thay đổi
- Phần vi ngắn được buffer đến đóng thẻ hoặc EOF, rồi kiểm tra chữ cái ngoài hệ Latin và nhóm câu hỏi generic lặp trong ba reply gần nhất. Không thay câu bằng template hoặc tự đổi quy tắc văn hóa/xưng hô.
- Chất lượng lỗi trước khi hiển thị: regenerate một lần qua cùng provider/limiter/budget, chung giới hạn hai attempts với empty/network. Reply vẫn lỗi → error Retry, không done/commit, không phát phần dịch/UI từ attempt lỗi.
- Streaming tiếp tục sau khi phần vi qua kiểm tra; UI vẫn do model sinh và validate qua registry. Heartbeat giữ kết nối trong thời gian chờ. Đổi lại token vi đầu tiên xuất hiện chậm hơn trước.
- Lỗi transport với phần vi dở hợp lệ vẫn hiển thị phần dở rồi error, không auto-replay khi đã có vi. Abort không flush. Test Stop được điều chỉnh để hủy khi request provider đã bắt đầu, không phụ thuộc token vi đầu tiên vốn nay được buffer.
- Script browser kiểm tra thêm hệ chữ và câu kết generic lặp, lưu checkedSpeech; không coi chỉ có done là nghiệm thu chất lượng.

## Phạm vi và giới hạn
Đây là kiểm tra hẹp: không đánh giá đầy đủ ngữ pháp/ý nghĩa/tính tự nhiên, không nhận diện mọi câu lặp hoặc paraphrase. Câu hỏi nghiệp vụ lặp không tự động bị chặn; yêu cầu nhắc lại rõ ràng được miễn kiểm tra generic closer. Dấu tổ hợp tiếng Việt, số, emoji được giữ. Tên riêng viết bằng hệ chữ khác cũng có thể bị yêu cầu viết lại dạng Latin; sản phẩm hiện luyện hội thoại tiếng Việt, không phải công cụ luyện đa ngôn ngữ.

## Kiểm chứng
- LLM 58 ca: giữ dấu/emoji, mixed script chia chunk không leak, generic closer regenerate, hai lần lỗi không commit, quality recovery chịu limiter; hồi quy timeout/Stop/network/429/UI.
- Full test 184/184, build4apps/lint/typecheck pass; LLM cuối58/58 sau tinh chỉnh nhận diện yêu cầu nhắc lại. E2E28/28 pass (1.2m), gồm Stop/Retry/schema fallback/comparison. Không dependency mới, không đọc/ghi secret.
- Groq thật: web→Facade4010, openai/gpt-oss-120b, dev=false/fallback=error, pacing30s. `test-results/t219-live/report.json` status passed, 7 checkedSpeech (open, comparison, submit, 4 followups), recoveredErrors=[]; không thấy recovery/error log ở Facade trong phiên này. Model sinh comparison và dùng lựa chọn; không mock/route interception.
- Bảy phản hồi không có chữ ngoài Latin hoặc generic closer lặp theo kiểm tra hẹp. Tiền mặt → “Tiền mặt nhé, mình ghi nhận.”; xin khăn giấy → “Được, mình cho thêm khăn giấy.” Không tuyên bố đây là bằng chứng repair thật đã được kích hoạt: recovery được kiểm chứng bằng tests tất định; phiên Groq này không cần repair.
- Còn lỗi nội dung ngoài gate T219: giá45.000 ở lượt thêm rau chuyển thành tổng95.000 ở lượt kế tiếp, không có giải thích rõ; facts comparison còn trộn English/Vietnamese dù prompt yêu cầu English. Câu “mình ghi nhận” vẫn có tính hành chính. Không coi status passed của script là nghiệm thu toàn bộ ngữ nghĩa/naturalness. Ưu tiên tiếp theo là giữ nhất quán chi tiết đã chốt và chất lượng ngôn ngữ UI.
- Đã dừng các server thử; bằng chứng ảnh/transcript ở test-results/t219-live. Không kiểm chứng tải cao hoặc tốc độ gửi nhanh.

## Review
Files/AC tại specs/002-ai-service-facade/tasks.md. Chưa commit/push/PR; không thay dữ liệu văn hóa hoặc mở rộng registry trong task này.
