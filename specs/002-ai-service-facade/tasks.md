# Facade — Tasks nghiệm thu

## T215 — Ổn định hội thoại Agent (user giao 2026-11-17)
- Files: specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/ai-service-facade/src/{llm,prompt,store,engine}.ts; packages/ai-service-facade/test/llm.test.ts; docs/acceptance/agent-stability.md.
- AC: ngắt SSE không có terminal không được done/commit; stream có heartbeat vẫn hết hạn tổng; abort trước request không gọi provider; dọn reader khi lỗi/hủy; lựa chọn UI đã commit còn trong context sau hơn 6 tin, bounded và không nâng thành system instruction; reset phiên xóa lịch sử; build/lint/typecheck/test pass. Kiểm chứng LLM thật nếu môi trường sẵn sàng, ghi rõ giới hạn.
- Không thêm dependency, không đọc secret, không đổi registry/quy tắc văn hóa, không tự retry 429 hoặc thay provider bằng mock.
- Branch: codex/t215-agent-stability. Trạng thái: đang triển khai.
- Bổ sung sau live test: provider trả UI nhưng không có vi sau submit; cho phép đúng một lần phục hồi empty qua cùng provider, cùng limiter/budget. Không hiển thị UI/translation của output rỗng, không retry HTTP/429, lỗi cả hai lần không commit. Thêm regression tương ứng.
- Kết quả: triển khai xong đợt sửa; npm test 167/167, LLM 42/42, E2E cuối 27/27, build/lint/typecheck pass. Live Groq sinh UI/submit và 4 followups, sau đó network; chưa nghiệm thu 10 followups. Bằng chứng/giới hạn: docs/acceptance/agent-stability.md. Chưa commit/push/PR.

T205 và T206: Files/AC tại `../000-master/tasks.md`. T206 hiện thực yêu cầu FR-1, Constitution #11 và Chat AC-4; không thay đổi schema hợp lệ hoặc thêm loại thẻ.
T209: xem Files/AC và trạng thái tại ../003-chat-remote/tasks.md.
T210: Files/AC tại ../003-chat-remote/tasks.md; thay biểu mẫu cố định T209.

## T211 — Cấu hình và nghiệm thu LLM thật trên web
- Người dùng yêu cầu chạy provider thật, không giả lập. Phiên hiện chưa có biến LLM_API_KEY/LLM_BASE_URL/LLM_MODEL; health 4000/4010 và local model 11434/1234 không kết nối được.
- Files: scripts/start-live-llm.ps1; scripts/verify-live-ui.cjs; docs/acceptance/live-llm.md; specs/002-ai-service-facade/{spec,plan,tasks,clarify}.md.
- AC: người dùng chọn provider/model; khóa nhập riêng trên máy, không vào chat/file/log; Facade chạy mode llm, fallback=error, dev=false; trình duyệt thật gửi hội thoại, nhận UI model, thao tác rồi nhận phản hồi tiếp; lưu bằng chứng thật và giới hạn. Không tuyên bố pass khi chưa gọi provider thật.
- Trạng thái: chuẩn bị công cụ; chờ provider/model và cấu hình khóa tại máy.

T211: công cụ đã chuẩn bị; chưa nghiệm thu do người dùng chưa có key Groq (đã xác nhận). Bằng chứng và bước tiếp theo: docs/acceptance/live-llm.md. Không đánh dấu hoàn tất LLM thật.

T211 tiếp tục 2026-11-12: user giao chọn nhà cung cấp miễn phí thay Groq signup_blocked. Chọn Gemini API qua Google AI Studio, gemini-3.8-flash theo pricing/docs hiện hành. Phạm vi Files T211 giữ nguyên; launcher đặt default Gemini nhưng vẫn nhận tham số override. Chờ người dùng tự tạo/nhập key; không giả lập hoặc coi cấu hình là bằng chứng LLM thật đã chạy.

T211 2026-11-13: có key do user nhập tại máy, đã quan sát health llm/dev=false; nghiệm thu thật chưa pass do lỗi provider http_503 (user xác nhận log). Hiện process Facade không còn chạy; cần user mở lại launcher, không còn ở trạng thái chưa tạo key. Host đã được khởi động lại. Chưa có bằng chứng UI do model thật sinh.

T211 kiểm tra lại sau user khởi động Facade (2026-11-13): Host HTTP200, health {ok:true,dev:false,mode:llm}. Chạy browser thật hai lần, chờ 10 giây giữa hai lần; cả hai dừng ở lời chào với thông báo “The AI service is busy”. Chưa có UI/interaction pass. Không suy diễn mã HTTP mới từ thông báo chung; mã http_503 là log user cung cấp ở lượt trước. Đề xuất thử gemini-3.5-flash-lite bằng tham số launcher trong cùng tài khoản; chưa chạy model đó, chưa đổi default.

T211 hoàn tất kiểm chứng cơ chế ngày 2026-11-13: sau user chạy model mới, browser thật exit 0/status passed, health llm/dev=false. AI sinh chọn món, độ cay; chọn Không cay được phản ánh trong câu trả lời, sau đó AI sinh UI Payment. Đã đối chiếu ảnh và DOM. Launcher mặc định gemini-3.5-flash-lite; tên model dựa trên lệnh user xác nhận, health không công bố model. Bằng chứng/giới hạn tại docs/acceptance/live-llm.md. Không đồng nghĩa nghiệm thu toàn sản phẩm hoặc nội dung văn hóa.

T211 kiểm chứng Groq 2026-11-16 theo yêu cầu user: Node nạp .env tại runtime, agent không mở/in/sửa secret. llama-3.3-70b-versatile trả http_404; override runtime Groq base URL + openai/gpt-oss-120b, live browser passed với UI chọn món/độ cay và phản hồi đúng rồi UI thanh toán. Chi tiết docs/acceptance/live-llm.md.

T213: phạm vi Files/AC/Analyze tại ../003-chat-remote/tasks.md. Facade/prompt/schema và test thực hiện trên codex/t213-agent-quality.

T213: parser preamble, bounded UI repair, heartbeat và lỗi phân biệt đã kiểm chứng hồi quy. Groq dài còn mở (empty/http_429); xem docs/acceptance/agent-quality.md. Không tuyên bố provider ổn định tuyệt đối.
