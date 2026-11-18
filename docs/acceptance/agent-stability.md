# T215 — Ổn định Agent

Ngày 2026-11-17. Branch `codex/t215-agent-stability`.

## Phạm vi
Theo yêu cầu user: ưu tiên ổn định Agent; bỏ qua tài liệu lệch đề tài. Files/AC tại specs/002-ai-service-facade/tasks.md. Không thêm dependency, không sửa văn hóa/registry hoặc đọc/ghi secret.

## Thay đổi
- Adapter chỉ chấp nhận terminal SSE `[DONE]` hoặc `finish_reason: stop`. EOF bất ngờ, JSON transport hỏng, provider error trong stream, content_filter/tool_calls ngoài protocol không trở thành lượt thành công. Giữ xử lý token bị cắt.
- Deadline tổng 60 giây cho mỗi lời gọi provider, độc lập idle timeout. Heartbeat không kéo dài deadline. Abort trước request không gọi provider; reader được hủy/dọn khi dừng hoặc lỗi.
- Store giữ tối đa 48 tin của phiên; prompt giữ tối đa 6 tin gần nhất trong 7000 ký tự, bổ sung tối đa khoảng 3000 ký tự lựa chọn UI cũ. Dữ liệu được giữ nguyên trong role user, không tóm tắt/suy diễn hoặc đưa vào system. Lựa chọn mới được ưu tiên qua thứ tự hội thoại. Vào lại tình huống reset bộ nhớ.
- UI-only/empty dialogue: đúng một lần phục hồi qua LLM thật, dưới cùng limiter/budget; bỏ translation/UI của lần rỗng, không double-commit. Không retry HTTP/429 hoặc network tự động.

## Giới hạn
Đây là cửa sổ bộ nhớ bounded, chưa phải bộ nhớ dài hạn: chi tiết chỉ nói bằng văn bản ở ngoài cửa sổ gần nhất vẫn có thể bị quên; sau 48 tin hoặc hết ngân sách context, lựa chọn cũ bị loại. Model vẫn cần nghiệm thu tính nhất quán thực tế. Không tự retry 429, không cam kết loại bỏ lỗi/quota nhà cung cấp. Một lượt có thể có tối đa ba lời gọi (initial, empty recovery, schema repair), mỗi lời gọi chịu deadline riêng và cùng limiter/budget.

## Kiểm chứng
- LLM regression 42/42, gồm 8 ca mới: lựa chọn sau 14 lượt và reset; abort sớm; terminal chia CRLF/chunk và cleanup; heartbeat liên tục hết deadline; EOF/provider error không commit history/UI/progress; phục hồi empty; dừng sau hai lần empty; recovery chịu rate limiter.
- npm test 167/167 pass sau engine recovery, gồm 15 ca xưng hô bắt buộc; typecheck, lint/CSS và build 4 apps pass.
- E2E sau thay đổi cuối 27/27 pass (44.5s). Playwright bundled browser chưa có, dùng Edge local qua PW_CHROMIUM_PATH; không thêm dependency.
- Cấu hình runtime hiện có trả http_404 cho llama-3.3-70b-versatile. Chạy thử Groq openai/gpt-oss-120b bằng override process trên port 4010, fallback=error/dev=false. Node nạp khóa tại runtime, agent không mở/sửa .env.
- Browser thật lần đầu sinh form chọn món/độ cay nhưng submit gặp empty (UI-only); bằng chứng test-results/live-llm/report-before-empty-recovery.json. Sau sửa: browser qua form và submit, thêm 4 followups rồi dừng lỗi network ở lượt kế tiếp. report.json và failure.png cùng thư mục. Không retry browser, không mock. Nội dung quan sát giữ món phở bò, thêm rau/trà đá và tổng 70k, nhưng lặp câu hỏi thanh toán. Nghiệm thu 10 followups vẫn CHƯA PASS; một lượt thành công không chứng minh ổn định mọi phiên.
