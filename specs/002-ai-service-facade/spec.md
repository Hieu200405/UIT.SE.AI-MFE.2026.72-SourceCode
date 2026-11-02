# 002 – AI Service Facade & Contract v0.2 – spec

## Mục đích
Điểm truy cập duy nhất tới LLM/rule engine/store cho web và mobile. Contract nằm ở packages/shared-types (nguồn sự thật).

## Thay đổi contract (v0.1 → v0.2) – đóng G1, G2, G3, G4
| Thay đổi | Chi tiết |
|---|---|
| `text_delta` | thêm `partId` và `translation?` (delta tiếng Anh, nối như `text`) |
| thẻ `address` | thêm `originalText`, `suggestedText`, `suggestedTerms{call,self}`, `assumptions?` (v0.2.1, từ Analyze) |
| thẻ `cultural_note` | thêm `verified` (false → UI nhãn "Sample") |
| thẻ `reply_suggestion` | mỗi gợi ý `{text, translation}`, 1–2 phần tử |
| sự kiện mới `needs_clarification` | `question`, `assumptions?`, `options?` (không phải thẻ; registry vẫn 3 loại) |
| `error` | `error{message, retryable}` (chưa quy định mã lỗi/HTTP status) |

## FR
- FR-1 Chuẩn hóa mọi output LLM/mock về StreamEvent hợp lệ trước khi gửi; payload sai → event `error`, không lộ stack trace.
- FR-2 Tính xưng hô bằng rule engine trước khi gọi LLM; thiếu hoàn toàn dữ kiện → `needs_clarification`.
- FR-3 Cung cấp dữ liệu tiến độ cho Chat/Progress: trạng thái từng tình huống (new/in_progress/done) và thống kê lỗi xưng hô theo thời gian.
- FR-4 Hủy request bằng đóng kết nối; hỗ trợ timeout phía server.
- FR-5 Giai đoạn đầu dùng mock stream cho test và demo.

## Chưa chốt (ghi Clarify khi vào plan)
Đường dẫn endpoint cuối cùng, mã lỗi, chính sách retry (API Contract hiện để mở; Architecture chỉ "đề xuất").

## Danh mục tình huống (Scenario catalog) – v0.1 draft
- Dữ liệu: packages/ai-service-facade/data/scenarios.json; kiểu: `Scenario` trong shared-types (v0.2.2).
- 8 tình huống đúng wireframe, chia 3 nhóm (administrative: renting, visa, banking · daily_life: doctor, market, street_food · social: neighbors, weddings).
- Mỗi tình huống có nhân vật AI (roleLabel, relationship, gender, ageApprox, ageRange), `objectives` (≥ 2) và `recommendedFor`.
- `GET /progress` trả `ScenarioProgress[]` với `status` new | in_progress | done (in_progress = ≥ 1 lượt hoàn tất; done = đạt hết `objectives`).
- Kiểm thử: `npm run test:scenarios` (8 test) gồm: khớp wireframe, mọi nhân vật đều ra được cách xưng hô (không fallback), Renting → bác/cháu.

## Chưa chốt (cần Clarify)
1. Ai xác định "đạt mục tiêu" (objective): rule theo từ khóa/ý định, LLM, hay người học tự đánh dấu? Contract hiện chưa có tín hiệu này.
2. `status: draft` → cần người rà nhân vật/mục tiêu trước khi coi là nội dung chính thức.
3. `recommendedFor` ngoài "settling" là phỏng đoán của nhóm (wireframe chỉ cho thấy "settling").

## Cập nhật theo quyết định (v0.3.0)
- "Done" do người học tự đánh dấu: op logic `setScenarioDone(scenarioId, done)`; event bus `scenarioStatusChanged {scenarioId, status}` (đề xuất mới, ngoài API Contract v0.1 – cần cập nhật tài liệu Contract).
- Trạng thái: `deriveScenarioStatus` (new → in_progress khi ≥ 1 lượt → done khi đã đánh dấu và có ≥ 1 lượt).
- Gợi ý: `pickRecommended` (bỏ Done, ưu tiên đang dở, tối đa 2, đa dạng nhóm). Mục "Chưa chốt" #1 và #3 ở trên đã đóng.

## Endpoint đã hiện thực trong Facade mock (đề xuất – API Contract v0.1 chưa chốt endpoint)
Header bắt buộc: `x-anonymous-id` (8–64 ký tự, sinh ở client, lưu localStorage). CORS mở cho dev.
| Endpoint | Mục đích |
|---|---|
| GET /health | kiểm tra sống |
| GET /scenarios | danh mục 8 tình huống |
| GET, PUT /profile | hồ sơ theo anonymousId (validate bằng `validateProfile`) |
| GET /progress | `ProgressSnapshot` (trạng thái từng tình huống, gợi ý, tổng) |
| PUT /progress/scenarios/:id/done `{done}` | tự đánh dấu Done; 409 nếu chưa có lượt nào |
| POST /chat/stream `ChatRequest` | SSE: open / message / hint |
Quy tắc: lượt chỉ được tính khi gửi `done` (hủy giữa chừng không tính); lỗi trả JSON `{error}` không lộ stack trace; payload sai → 400.
Kích hoạt mô phỏng (chỉ mock): `/error`, `/timeout`, câu chứa "nên gọi thế nào" → needs_clarification.
Cần cập nhật tài liệu API & Integration Contract: translation, assumptions, needs_clarification, scenarioStatusChanged, các endpoint trên.

## Cập nhật contract v0.5.0
- Thêm SSE `user_translation {requestId, translation}` (bản dịch tin của người học; có thể không gửi).
- `ProgressSnapshot` thêm `sessions[]` (buổi luyện = mỗi lần `open`; chỉ tính buổi có ≥ 1 lượt hoàn tất) và `confidence{administrative,daily_life,social}` (0–100).
- Facade: `GET /health` → `{ok, dev}`; `POST /dev/seed` (chỉ khi `FACADE_DEV=1`) nạp dữ liệu demo 8 buổi như wireframe. **Phải bỏ khỏi bản chạy thật.**
- Công thức Confidence (đề xuất, chưa kiểm chứng): `100 × coverage × (0,5 + 0,5 × accuracy)`; coverage = (Done + 0,5 × đang luyện)/số tình huống trong nhóm; accuracy = 1 − lỗi/lượt trên ≤ 5 buổi gần nhất của nhóm.
