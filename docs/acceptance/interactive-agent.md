# T210 — UI do AI điều phối theo hội thoại (web)

Cập nhật: 2026-11-12. T210 thay luồng biểu mẫu cố định T209.

## Hành vi hiện tại

Người học vào tình huống và trò chuyện bình thường. LLM quyết định có cần UI trong từng lượt hay không; nếu cần, model tạo câu hỏi, tiêu đề, trường nhập và lựa chọn phù hợp với nội dung hội thoại. Web có thể dựng lựa chọn nhanh (radio), danh sách chọn, ô nhập ngắn hoặc ô trả lời nhiều dòng. Không có bước chọn mục tiêu bắt buộc, catalog biểu mẫu cho 8 tình huống, hoặc nhánh từ khóa chọn form trong code production.

Khi người học thao tác, Facade gửi lại câu hỏi gốc, nhãn trường và giá trị đã chọn dưới dạng user message. Model có thể hỏi tiếp bằng UI khác hoặc tiếp tục bằng lời. Gõ vào chat luôn là lựa chọn thay thế. Các thẻ xưng hô/văn hóa tiếp tục đi qua cơ chế dữ liệu kiểm soát hiện có.

Ví dụ mong đợi khi dùng LLM: “I want to practice ordering food” → model có thể hỏi món ăn bằng lựa chọn → người học chọn → model dùng lựa chọn đó để tiếp tục và có thể hỏi mức cay. Model quyết định nội dung cụ thể, nên không bảo đảm mọi lần đều sinh cùng một form.

## Ranh giới giữa LLM và mock

- Chế độ `llm`: open/message của web opt-in thực sự gọi adapter LLM. Prompt yêu cầu lời thoại và block UI tùy chọn. Nội dung form đến từ output model, không từ fixture hoặc catalog.
- Chế độ `mock`: chỉ có hội thoại mẫu; không tự chèn form. Web hiển thị “Sample conversation · AI-generated questions are unavailable in this mode.”
- Bộ kiểm thử dùng provider giả, đi qua Facade/HTTP/SSE/parser thật. `tests/fixtures/generative-provider.ts` chỉ thuộc kiểm thử và không được import vào ứng dụng.
- Chưa xác minh chất lượng đầu ra với một model/dịch vụ thật trong đợt này; không đọc hoặc sửa `.env`, không sử dụng khóa thật. Prompt tuân thủ schema cần được nghiệm thu với model được chọn.

## Contract v0.7 và vòng tương tác

1. Web gửi `interactive: true` trong `ChatRequest`.
2. LLM stream `<user_en>…</user_en><vi>…</vi><en>…</en>` và tùy chọn `<ui>JSON</ui>` hoặc `<ui>null</ui>`.
3. JSON UI chỉ gồm `title`, `description`, `submitLabel`, `fields`. Mỗi field gồm `id`, `label`, `kind`, `required`; choice/select có `options`. Không nhận prop tùy ý, HTML, action URL hoặc component ngoài registry.
4. Parser tách UI khỏi lời thoại; Facade giữ buffer tối đa 12.000 ký tự, yêu cầu đúng một block hoàn chỉnh. UI sai schema/truncated/quá lớn → giữ lời thoại và hiển thị thông báo trả lời bằng chat, không để JSON lọt vào nội dung.
5. Schema giới hạn 1–5 field, 2–8 option duy nhất cho lựa chọn, độ dài nhãn/nội dung; có validator chung trước khi render. Một lượt có thể không có UI. Trong lúc nhận UI dài, Facade gửi delta rỗng định kỳ để giữ kết nối client.
6. Facade cấp formId ngẫu nhiên; chỉ commit form đang hoạt động vào Store của đúng anonymous user/scenario khi nhận done. UserRecord cũ không có activeForms vẫn đọc được; SQLite dùng cùng cơ chế lưu UserRecord hiện có.
7. Client gửi `interaction: { formId, values }`. Facade kiểm tra identity, field, required, độ dài tối đa 300 ký tự/giá trị và lựa chọn trong schema đã phát. ID cũ/giả/khác user/scenario → 409; giá trị sai → 400, trước khi gọi provider.
8. Đưa question/context/answers vào role user; không nội suy input vào system prompt. Lịch sử giữ cả UI đã hỏi và câu trả lời để model tiếp tục đúng ngữ cảnh.
9. Turn mới hoàn tất thay thế hoặc xóa form cũ. Form đang stream, đã gửi hoặc đã có tin nhắn người học mới bị khóa trên web. Retry giữ payload với requestId mới; request mới hủy request cũ cùng user/scenario. Hủy/lỗi không commit UI mới.

Chỉ tin nhắn tự gõ hoàn tất được tính là lượt thực hành trong Progress; chọn/điền UI không tự được xem là câu luyện tiếng Việt đã đạt yêu cầu. Done vẫn do người học đánh dấu. Không mở rộng Mobile UI trong T210; client không opt-in không được phát form mới.

## Files và phạm vi

- `packages/shared-types/src/index.ts`: schema/validator choice/select/text/textarea, contract version.
- `packages/ai-service-facade/src/interactive.ts`: parse/validate UI do model sinh và dựng thông điệp phản hồi; đã bỏ catalog cố định.
- `engine.ts`, `prompt.ts`, `reply-parser.ts`: protocol LLM, stream lời thoại/UI, giới hạn output, fallback.
- `server.ts`, `store.ts`: active form, ràng buộc user/scenario, hủy request trước, commit khi done và lịch sử.
- `packages/facade-client/src/index.ts`: kiểu mode trong health.
- `apps/chat-remote/src/ui/{ChatScreen,MessageList,cards,ScenarioForm}.tsx`: renderer generic, lựa chọn nhanh, summary theo nhãn động, trạng thái mode.
- `packages/shared-types/test/contract.test.ts`, `packages/ai-service-facade/test/{facade,llm}.test.ts`, `tests/e2e/mfe.spec.ts`, `tests/fixtures/generative-provider.ts`: kiểm thử.
- Specs 002/003 và tài liệu này: quyết định, task, phạm vi và kết quả. Không thêm dependency hoặc đổi dữ liệu văn hóa.

## Kiểm chứng

- Build 4 ứng dụng web pass; lint 69 file + CSS isolation pass; typecheck web/Mobile pass.
- npm test: 151 ca pass, bao gồm 15 ca xưng hô bắt buộc. Contract 18; Facade 21; LLM/parser/provider giả 27.
- E2E: 26/26 pass (48,7 giây): 22 ca nền + 4 ca generative UI. Kiểm tra cùng scenario nhận UI khác nhau theo output provider, thao tác sinh câu hỏi kế tiếp, text-only, Retry giữ giá trị, chống gửi trùng, Stop, UI lỗi, bàn phím và viewport 390px không tràn ngang.
- Mobile regression: 29/29 pass (55,907 giây).
- Đã xem ảnh Playwright desktop và màn hình hẹp. Các ảnh minh họa là output từ provider kiểm thử.
- Chưa chạy model thật, thiết bị Android thật, CI/Docker thật hoặc deploy online trong task này.

## Chạy trên máy

Build từ thư mục repo:

```powershell
npm run poc:build
```

Ở terminal đã được cấu hình ba biến môi trường `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, chạy Facade bằng lệnh không tải `.env`:

```powershell
$env:PORT='4000'
$env:FACADE_DEV='0'
node --experimental-strip-types --no-warnings packages/ai-service-facade/src/main.ts
```

Không gửi khóa vào chat hoặc đưa khóa vào frontend. Nếu ba biến chưa có, Facade chạy mock và chưa thể thử UI do AI sinh. Có thể kiểm tra chế độ bằng `/health` (chỉ trả trạng thái):

```powershell
Invoke-RestMethod 'http://localhost:4000/health'
```

Ở terminal khác:

```powershell
npm run poc:serve
```

Mở http://localhost:3000/chat. Khi health là `llm`, chọn tình huống rồi trò chuyện; quan sát UI do model quyết định. Không dùng fixture kiểm thử như một bản demo AI thật.

Sau chỉnh cuối ở prompt và commit lịch sử: chạy lại Facade 21/21, LLM 27/27 và typecheck web đều pass; git diff --check pass. T209 được thay bởi T210; chưa commit/push/PR/deploy trong đợt này.
