# ADR-003 – SSE qua fetch streaming, reducer lượt hội thoại, lượt chỉ tính khi `done`

Trạng thái: Chấp nhận. Căn cứ: Architecture §5, API Contract §4, Constitution #11–#12.

## Quyết định
- Client dùng `fetch` + `ReadableStream` + `SseParser` (EventSource không gửi được POST body và header). Hủy bằng `AbortController`.
- Idle timeout (mặc định 15 s, cấu hình qua props Host): quá hạn không có dữ liệu → `StreamTimeoutError` → trạng thái `failed` + Retry. Luồng đóng trước `done/error/needs_clarification` → coi là mất kết nối.
- Event sai schema bị bỏ qua + log; `ui_card` chỉ dựng 3 loại trong registry.
- Trạng thái lượt nằm trong reducer thuần (`chatState.ts`): sự kiện khác requestId hoặc sau khi hủy/kết thúc bị bỏ; Retry tạo requestId mới và bỏ phần trả lời dang dở.
- Facade chỉ tăng bộ đếm lượt khi ghi `done` (và ghi store TRƯỚC khi gửi `done`), nên hủy giữa chừng không tính và `GET /progress` sau `done` luôn nhất quán.
- Event bus chỉ là tín hiệu: Progress và Chat lấy lại dữ liệu từ Facade khi nhận event.

## Kiểm chứng
packages/ai-service-facade/test/facade.test.ts (14), apps/chat-remote/test/chatState.test.ts (10), tests/e2e/mfe.spec.ts (16: Stop, /error, /timeout, clarify…).

## Đánh đổi
Tự viết parser SSE (nhỏ, có test); Facade mock lưu trong bộ nhớ (mất khi khởi động lại); `/crash`, `/error`, `/timeout` là cơ chế thử nghiệm phải bỏ khỏi bản chạy thật.
