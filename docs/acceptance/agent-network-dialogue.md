# T216 — Network và câu hỏi lặp

Ngày 2026-11-18; branch codex/t216-network-dialogue.

## Thay đổi
- Network trước khi có lời thoại: chờ 750ms rồi thử lại tối đa một lần, cùng limiter/budget; backoff hủy được. Chia sẻ hai attempts với empty recovery. Network sau khi đã phát lời thoại báo lỗi, không tự replay hoặc double commit. Không retry HTTP/429/timeout. Thông báo network phân biệt với service busy.
- Log network chỉ ghi phase connect/stream và mã lỗi trong allowlist (ECONNRESET/UND_ERR_SOCKET/...); không log exception text/URL/header/key. Browser retry opt-in chỉ áp dụng lỗi kết nối, không 429; report tách recoveredErrors.
- Giữ câu trả lời text cũ cùng UI submissions trong cửa sổ memory có giới hạn; ví dụ quyết định tiền mặt không mất chỉ vì được gõ thay vì chọn form. Dữ liệu ở role user, mới nhất được ưu tiên, không đặt lại quy tắc văn hóa.
- Prompt yêu cầu trả lời câu hỏi hiện tại, cho phép câu khẳng định không có UI; không liên tục nhắc câu chưa trả lời khi người học chuyển chủ đề, không hỏi lại phương thức thanh toán đã chọn. Không tạo workflow/payment keyword router cố định.
- Sau transcript live phát hiện model chép `Interactive question: {fields...}` từ lịch sử vào lời thoại: chuyển UI lịch sử thành context ngắn chỉ chứa câu hỏi/lựa chọn/chi tiết đã biết, không template form đầy đủ. Script live từ chối protocol/fields JSON trong speech thay vì chỉ coi hết lượt là pass.
- Lần sau hết leakage nhưng vẫn hỏi payment ở followups 1/3/4. Dừng bài sau khi đã thấy thất bại nội dung (progress ở t216-live-final). Siết policy: không chủ động checkout; hỏi tổng chỉ trả tổng; chỉ bàn phương thức khi learner hỏi cách trả; lựa chọn đã nói được ghi nhớ. Không form/payment router cố định. Chạy lại t216-live-checkout-policy.
- Script live có thư mục bằng chứng riêng và pacing cấu hình được; lấy đủ response bodies trước khi đóng browser.

## Kiểm chứng và giới hạn
- Test network recover, lỗi cả hai lần, lỗi sau partial speech, abort trong backoff, limiter/shared attempt cap, memory text sau 14 lượt và biểu diễn UI lịch sử. npm test 173/173, LLM 48/48 pass sau thay đổi cuối, gồm 15 ca xưng hô bắt buộc.
- Build 4 apps, lint/CSS, typecheck pass. Không dependency mới, không đọc/ghi .env; Node nạp key tại runtime theo ủy quyền chạy Groq.
- Lần live đầu: Groq openai/gpt-oss-120b, Facade 4010, dev=false/fallback=error; sinh UI và submit thành công, sau đó provider http_429 ở followup đầu. Không retry browser. Report test-results/t216-live/report.json.
- Lần paced: đủ 10 followups không network/429, sau lựa chọn tiền mặt không hỏi lại thanh toán. Tuy nhiên trước đó còn hỏi lặp và lộ UI JSON ở lượt 3/4; status script passed chỉ chứng minh luồng chạy, KHÔNG nghiệm thu nội dung. Bằng chứng test-results/t216-live-paced/report.json. Đã sửa biểu diễn history và thêm kiểm tra leakage, chạy lại vào test-results/t216-live-final.
- Lỗi network cũ chỉ có mã tổng quát, không đủ chứng cứ kết luận DNS/TLS/socket cụ thể. Bản sửa cung cấp phục hồi transient có giới hạn, không cam kết giải quyết mọi lỗi hạ tầng. Chất lượng chống lặp của model phải được xem trong transcript thật, không suy ra từ test prompt.
- t216-live-checkout-policy: lượt đầu không thúc thanh toán; lượt tiếp theo lỗi network. Không đánh dấu pass. Chạy thêm t216-live-recovery với browser Retry tối đa một lần/lượt chỉ cho network, giữ nhịp 30s và cùng model; mọi phục hồi phải ghi nhận.

## Kết quả Groq cuối
`test-results/t216-live-recovery/report.json`: status passed, 10/10 followups sau open/request UI/submit, recoveredErrors=[]; không cần browser Retry, process Facade không log network recovery/error trong lần này. Model openai/gpt-oss-120b, mode llm/dev=false/fallback=error. Nhịp 30 giây giữa thao tác, không chứng minh tải cao hoặc gửi liên tục nhanh.

- Model sinh UI chọn món/độ cay; lựa chọn quay lại lời thoại. Lượt 9 sinh UI chọn hai món để so sánh.
- Hỏi phương thức thanh toán một lần ở lượt 3; lượt 4 hỏi tổng chỉ trả 60.000₫. Lượt 5 nhận tiền mặt, lượt 6–10 không hỏi lại thanh toán. Không leakage JSON/protocol trong speech theo script và transcript.
- Lượt 10 giữ phở bò không cay. Đây là một phiên thành công, không bảo đảm model luôn tuân thủ: vẫn chủ động hỏi thanh toán lần đầu dù prompt yêu cầu chờ learner; câu xã giao “còn gì nữa không” vẫn có thể lặp. Nội dung văn hóa vẫn Sample và ngoài nghiệm thu T216.
- Ảnh: test-results/t216-live-recovery/{generated-ui,after-interaction,long-conversation}.png. Các lần failed phía trên được giữ riêng, không xóa/đổi thành pass.
- E2E cuối 27/27 pass (1.0m), Edge local qua PW_CHROMIUM_PATH. Không commit/push/PR. Đã dừng các server thử sau kiểm chứng.
