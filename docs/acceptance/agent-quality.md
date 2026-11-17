# T213 Chất lượng Agent và giao diện Việt Nam

Ngày: 2026-11-16. Branch: codex/t213-agent-quality. Agent: Codex.

## Yêu cầu và quy trình
Đối chiếu Setup AI Agent Assistant.docx (mục 2, 5–8), Constitution và spec/plan/tasks của Chat/Facade trước khi sửa. User đã cho phép cập nhật spec/plan/tasks và triển khai. WHAT, HOW, DO và phạm vi Files T213 được lưu trong specs/003-chat-remote và specs/002-ai-service-facade. Không thêm dependency, không sửa dữ liệu xưng hô/văn hóa, không đọc/in/sửa .env. Node nạp .env tại runtime theo ủy quyền chạy Groq của user.

## Thay đổi
1. Contract 0.8.0 bổ sung metadata tùy chọn trong scenario_form: presentation cards/compact, optionDetails (description, badge, icon trong registry) và summary có giới hạn. Model tự quyết định có UI hay không, nội dung và hình thức; không catalog/wizard cố định. UI cũ vẫn hợp lệ.
2. UI so sánh có mô tả/icon/nhãn; lựa chọn ngắn dạng chip; summary là dữ liệu tĩnh để xem lại các chi tiết đã trao đổi. Không URL ảnh/HTML/code do model cung cấp. Template {{...}}/${...} trong summary bị từ chối.
3. Minh họa SVG gốc tại VietnamScene.tsx: phố với mái ngói, phở, cà phê, bánh mì, xe đạp. Đây là minh họa, không ảnh địa điểm thật hay tài liệu văn hóa. Dùng trên Practice và sidebar; màu giấy/ngói/xanh lá, chữ tiếng Việt có dấu. Không tài sản ngoài hoặc dependency ảnh.
4. Prompt: lời ngắn theo vai; tránh cảm ơn/xin chào/dạ/vâng lặp, không ép đại từ ở mọi câu; vẫn giữ đại từ từ rules-xung-ho. UI labels tiếng Anh, nội dung luyện nói có thể tiếng Việt.
5. Heartbeat SSE comment 4 giây trong lúc chờ model; dọn timer khi hủy/kết thúc; không tạo lời thoại hoặc UI giả. Context bị chặn cả số tin (6) và dung lượng (10000 ký tự).
6. Phát hiện finish_reason=length; phân biệt output rỗng, timeout, rate limit, daily budget, UI lỗi. UI lỗi không commit form/history/tiến độ; có Retry. Một lần sửa schema qua chính provider, vẫn chịu rate/budget limit; không lặp vô hạn. Model không cần UI thì null/no UI vẫn hợp lệ.
7. Parser không còn chuyển vĩnh viễn sang plain mode khi thấy prose trước protocol; giữ preamble bounded, đọc thẻ ở chunk sau, không đưa tag/UI JSON của trường hợp này ra lời thoại.
8. Groq GPT-OSS dùng max_completion_tokens, reasoning_effort=low, include_reasoning=false. Áp dụng đúng hostname/model; provider khác giữ tham số cũ. Căn cứ: https://console.groq.com/docs/reasoning và https://console.groq.com/docs/api-reference.

## Bằng chứng kiểm thử
- npm test pass trước lượt tinh chỉnh parser/Groq cuối; sau đó test:llm 34/34, test:contract 19/19 pass. Bao gồm 14 lượt liên tục, history lớn, schema repair, tag chia mọi chunk, length termination, heartbeat với provider chậm.
- test:xungho 20/20 gồm TC-XH-01…15 pass; dữ liệu quy tắc không đổi.
- Build 4 apps, architecture lint 70 source files, CSS isolation 8/8, typecheck web và mobile pass.
- E2E cuối 27/27 pass (39.9s) sau parser/Groq changes. Keyboard, responsive 390px, reduced motion, Retry/Stop, schema fallback, rich option descriptions, summary và ảnh Việt Nam.
- Ảnh: test-results/vietnam-practice.png, agent-polish-desktop.png, agent-polish-mobile.png, generative-ui-narrow.png. Đã kiểm tra trực quan ảnh mobile và desktop.

## Groq thật và giới hạn
Đã gọi qua Facade thật (dev=false, fallback=error), không provider giả. Bài browser dài tái hiện UI sai và prose trước tag (report-before-parser-fix.json). Sau sửa parser có phản hồi rỗng (report-empty-reply.json). Test trực tiếp qua Facade nhận rich cards món ăn, mô tả và compact choices độ cay; submit được dùng trong câu trả lời: “Mì xào nhẹ, 45.000₫. Bạn muốn thêm gì không? …” (giá trong hội thoại đóng vai, không giá tham khảo).

Lượt browser 10 followups tiếp theo gặp output rỗng và http_429 từ Groq; bài kiểm tra bị dừng khi chờ quá lâu, KHÔNG tính pass. Script bổ sung timeout locator và retry có giới hạn (opt-in LIVE_RETRY_ONCE=1), ghi recoveredErrors; không gửi tiếp để né quota. Chưa đạt nghiệm thu 13 lượt liên tục với Groq thật. Test 14 lượt pass là provider tất định, không thay thế bằng chứng model thật.

Lời thoại đã bớt khuôn mẫu trong mẫu quan sát nhưng độ tự nhiên còn cần người dùng đánh giá nhiều tình huống. Model từng đưa placeholder summary và giá thay đổi khi thêm món; không coi chất lượng nội dung là được bảo đảm chỉ nhờ schema. Các ghi chú văn hóa vẫn Sample và chưa qua cổng nguồn/người duyệt. Không tuyên bố đồ án đã nghiệm thu toàn bộ.

## Review
Không commit/push/merge. PR khi tạo cần gắn T213, danh sách Files trong tasks.md, cách kiểm chứng nêu trên và ghi rõ nghiệm thu Groq dài còn mở. Không đụng các thay đổi có sẵn ngoài phạm vi T213.
