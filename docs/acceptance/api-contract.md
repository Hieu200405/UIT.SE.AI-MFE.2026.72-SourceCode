# Contract hiện thực v0.5.0

Nguồn chuẩn: `packages/shared-types/src/index.ts`, `packages/ai-service-facade/src/server.ts`, `packages/facade-client/src/index.ts`. Đây là bản ghi nhận triển khai, bổ sung API & Integration Contract Word v0.1; không đổi endpoint trong đợt nghiệm thu.

## HTTP

Trừ health/OPTIONS, request cần header `x-anonymous-id` gồm 8–64 ký tự chữ, số, `_` hoặc `-`. Đây là định danh ẩn danh, không phải hệ thống đăng nhập. Web lưu ID tại localStorage, Mobile tại AsyncStorage; hai ID khác nhau có dữ liệu khác nhau. Dùng chung Facade không đồng nghĩa tự đồng bộ danh tính giữa hai thiết bị.

| Method và path | Request | Response thành công |
|---|---|---|
| GET /health | Không cần ID | `{ok, dev, mode}`; mode mock/llm |
| GET /scenarios | Header ID | `{scenarios: Scenario[]}` |
| GET /profile | Header ID | `{profile: Profile}` |
| PUT /profile | `{profile: {purpose, age, gender, region}}` | `{profile}` |
| GET /progress | Header ID | `ProgressSnapshot`: scenarios, recommended, totals, sessions, confidence |
| PUT /progress/scenarios/:id/done | `{done: boolean}` | ProgressSnapshot; 409 nếu chưa có lượt hoàn tất |
| POST /chat/stream | `{requestId, scenarioId, kind, message?}` | text/event-stream |
| POST /dev/seed | Header ID, chỉ FACADE_DEV=1 | ProgressSnapshot; 404 ngoài dev |

kind = open/message/hint. Message phải có nội dung sau trim, tối đa 500 ký tự. Age = null hoặc số nguyên 5–120; gender unknown/male/female. `unknown` không được suy thành nam hoặc nữ.

HTTP lỗi JSON `{error}`: 400 payload/ID sai, 404 endpoint/tình huống không có, 409 đánh dấu Done quá sớm, 500 lỗi nội bộ. Lỗi khi stream đã mở được chuyển thành SSE error hoặc kết thúc kết nối; client phải xử lý cả hai.

## SSE và UI

Mỗi event có `requestId`. Text có `partId`, `text`, `translation?`; user_translation có `translation`; ui_card có `card`; needs_clarification có `question`, `assumptions?`, `options?`; error có `{message,retryable}`; done hoàn tất lượt.

UI chỉ dựng address, cultural_note, reply_suggestion. Validator từ chối type lạ và trường sai kiểu. T206 bổ sung kiểm tra trường lồng nhau và mảng clarify. Các chuỗi được render như text, không HTML. Không đổi ý nghĩa `verified: false` của dữ liệu mẫu.

Client dùng fetch streaming, không EventSource vì cần POST body/header. Hủy bằng AbortController/đóng kết nối. Reducer bỏ event của request đã hủy/kết thúc; Retry tạo requestId mới. Facade ghi tiến độ trước khi gửi done, chỉ tính kind=message thành công; open, hint, lỗi, hủy không tăng lượt.

## Event bus

| Event | Payload chính | Consumer |
|---|---|---|
| conversationTurnCompleted | scenarioId, requestId; metadata tùy chọn | Progress/Practice đọc lại Facade |
| profileUpdated | profileVersion, changedFields[] | Chat cập nhật ngữ cảnh; Facade nạp hồ sơ mới |
| scenarioStatusChanged | scenarioId, status | Progress/Practice đọc lại Facade |

Event không thay thế store và không mang toàn bộ lịch sử/hồ sơ. Web chia sẻ event-bus singleton; Mobile dùng lại API/logic, không nhúng Remote web.

## Giới hạn cần nêu khi bảo vệ

Mock là kịch bản theo lượt, dịch được câu trong từ điển; không có năng lực hội thoại tự do của LLM. Adapter LLM đã được test qua server giả, không có bằng chứng gọi nhà cung cấp thật trong đợt này. Done là người học tự đánh dấu sau ít nhất một lượt; Confidence là ước lượng, không CEFR hay kết quả đo lường đã thẩm định.
