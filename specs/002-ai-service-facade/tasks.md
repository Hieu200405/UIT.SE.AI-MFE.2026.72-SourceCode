# Facade — Tasks nghiệm thu

## T219 — Kiểm tra chất lượng lời thoại trước khi hiển thị (2026-11-19)
- Files: specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/ai-service-facade/src/{dialogue-quality,engine,prompt,reply-parser,llm}.ts; packages/ai-service-facade/test/llm.test.ts; scripts/verify-live-ui.cjs; docs/acceptance/dialogue-quality.md.
- AC: chữ ngoài Latin trong vi không bị stream ra; câu kết generic lặp gần đây được yêu cầu viết lại, không chặn câu hỏi nghiệp vụ hoặc yêu cầu nhắc lại; tối đa một recovery chung với empty/network, cùng limiter/budget; không commit lượt/UI lỗi; Stop/partial failure giữ hành vi có kiểm chứng; test hồi quy, build/lint/typecheck/E2E và Groq web thật. Không dependency/secret/quy tắc văn hóa mới.
- Kết quả: 184/184 test, LLM cuối58/58, E2E28/28, build/lint/typecheck pass. Groq thật comparison→submit→4 followups pass kiểm tra hệ chữ/generic closer, không Retry; còn lỗi tổng tiền/ngôn ngữ facts ngoài gate. Bằng chứng/giới hạn: docs/acceptance/dialogue-quality.md. Chưa commit/push/PR.

T218: UI so sánh và lời thoại tự nhiên, Files/AC tại ../003-chat-remote/tasks.md; triển khai trên codex/t218-rich-agent-ui, giữ các thay đổi T216/T217 chưa commit.

## T217 — Tôn trọng thời gian chờ của provider (2026-11-18)
- Files: specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/ai-service-facade/src/{llm,engine}.ts; packages/ai-service-facade/test/llm.test.ts; docs/acceptance/provider-cooldown.md.
- AC: HTTP429 đọc Retry-After dạng giây/ngày HTTP; header thiếu/sai dùng 60s, giới hạn tối đa 24h; limiter dùng chung giữ cooldown, không gọi provider hoặc reserve budget khi bị chặn; hết hạn gọi được; message thời gian còn lại; không tự retry429, không commit lượt lỗi. Test deterministic, build/lint/typecheck/E2E. Không gây 429 thật để kiểm thử, không secret/dependency mới.
- Kết quả: 177/177 tests (LLM 52/52), E2E 27/27, build/lint/typecheck pass. Bằng chứng/giới hạn tại docs/acceptance/provider-cooldown.md. Không gọi Groq mới trong T217, không commit/push; giữ thay đổi T216 có sẵn.

## T216 — Network recovery và tránh hỏi lặp (2026-11-18)
- Files: specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/ai-service-facade/src/{engine,prompt,llm}.ts; packages/ai-service-facade/test/llm.test.ts; scripts/verify-live-ui.cjs; docs/acceptance/agent-network-dialogue.md.
- AC: retry network tối đa một lần trước khi xuất lời thoại, chung ngân sách recovery empty, delay hủy được, không retry HTTP/429/timeout hoặc partial speech; không double commit. Giữ câu trả lời text cũ trong ngân sách memory, prompt không ép hỏi tiếp/thanh toán khi người học hỏi khác. Test hồi quy và browser Groq 10 followups, ghi rõ lỗi và giới hạn nếu có.
- Kết quả: npm test 173/173, LLM 48/48; Groq cuối 10/10 followups, không Retry/error, không hỏi lại thanh toán sau chọn tiền mặt, không lộ UI JSON; chi tiết và các lần live thất bại giữ tại docs/acceptance/agent-network-dialogue.md. Chưa commit/push/PR.

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

## T220 — Nhất quán báo giá và tiếng Anh trong UI (2026-11-19)
- Files: specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/ai-service-facade/src/{response-quality,engine,prompt}.ts; packages/ai-service-facade/test/llm.test.ts; scripts/verify-live-ui.cjs; docs/acceptance/quote-ui-quality.md.
- AC: giữ báo giá cũ trong memory bounded; khi chỉ hỏi lại tổng sau một báo giá duy nhất, không xuất số tiền mới vô cớ; UI explanatory fields có tiếng Việt có dấu bị repair trước render, giữ tên món/options; một repair qua limiter/budget, thất bại không commit. Test hồi quy và Groq thật trên web; ghi rõ giới hạn heuristic, không coi đây là ledger giao dịch thật. Không dependency/secret mới.

- T220 kết quả chốt 2026-11-20: npm test 192/192; LLM sau tinh chỉnh cuối 66/66; E2E chạy lại đầy đủ 28/28; build/lint/typecheck pass. Groq thật trên web sinh UI, nhận lựa chọn và 6 followups; tổng 55.000đ rồi 100.000đ đúng, mô tả UI kiểm tra bằng DOM là tiếng Anh. Giới hạn bộ kiểm tra và lỗi hỏi thanh toán còn sót ghi tại docs/acceptance/quote-ui-quality.md. Hoàn tất phạm vi AC T220; chưa commit/push/PR.

## T221 — Không tự chuyển thanh toán; giảm hỏi lặp (2026-11-20)
- Files: specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/ai-service-facade/src/{dialogue-quality,engine,prompt}.ts; packages/ai-service-facade/test/llm.test.ts; scripts/verify-live-ui.cjs; docs/acceptance/natural-dialogue.md.
- AC: chặn câu hỏi/UI thanh toán khi người học chưa yêu cầu chọn cách trả; trả lời hỏi tổng không kéo sang checkout; chặn câu hỏi trùng gần đây và hỏi lại số lượng/độ cay/ăn tại chỗ đã cung cấp rõ; cho phép người học yêu cầu nhắc lại/đổi lựa chọn. Recovery bounded, cùng limiter/budget, không commit output lỗi, không thay bằng hội thoại cố định. Kiểm thử hồi quy và hội thoại dài Groq thật; công bố giới hạn nhận diện.

- T221 kết quả: 199/199 tests (LLM 73/73), E2E 28/28, build/lint/typecheck pass. Groq thật 13 phản hồi, gồm chọn UI/gửi lựa chọn + 10 followups, không Retry thủ công; không hỏi/UI thanh toán ngoài yêu cầu, không hỏi lại sau chọn tiền mặt trong phiên kiểm chứng. Một recovery chất lượng tự động. Giới hạn heuristic và lời kết còn khuôn mẫu ghi tại docs/acceptance/natural-dialogue.md. Hoàn tất đợt T221, chưa commit/push/PR.

## T222 — Câu kết theo ngữ cảnh, kiểm chứng đa tình huống (2026-11-20)
- Files: specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/ai-service-facade/src/{dialogue-quality,engine,prompt}.ts; packages/ai-service-facade/test/llm.test.ts; scripts/verify-live-scenarios.cjs; docs/acceptance/contextual-closings.md.
- AC: câu kết quảng cáo/chăm sóc khách hàng rập khuôn được yêu cầu viết lại; lời chào kết thông thường vẫn hợp lệ; người học kết thúc rõ thì không thêm câu hỏi/UI mới; giữ ngoại lệ nhắc lại và thông tin đã thống nhất. Kiểm chứng Groq web thật ở thuê nhà, đi chợ, gặp hàng xóm; UI vẫn do model quyết định. Recovery bounded, test/build/lint/typecheck/E2E, ghi rõ giới hạn; không thêm dependency/secret/quy tắc văn hóa.

- T222 kết quả 2026-11-21: 203/203 tests (LLM77), E2E28/28, build/lint/typecheck pass. Groq web thật kiểm tra 3 tình huống qua hai báo cáo, tổng17 phản hồi và2 lần gửi UI; câu kết không có cụm corporate/câu hỏi/UI mới. Lần chạy tổng trước đó bị rate limit khi mở market; continuation market+neighbors đã pass cổng tự động. Đã hoàn tất đợt triển khai/kiểm chứng câu kết; chưa nghiệm thu nội dung hội thoại toàn diện: market đổi kg thành trái và tự thêm phí túi, một số diễn đạt còn gượng. Bằng chứng/giới hạn tại docs/acceptance/contextual-closings.md. Không commit/push/PR.
