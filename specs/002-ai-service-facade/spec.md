# 002 – AI Service Facade & Contract v0.2 – spec

## T219
Phần vi được giữ tới khi đóng thẻ hoặc EOF để kiểm tra hệ chữ và câu kết generic lặp. Chỉ phần đã qua kiểm tra được hiển thị. Chất lượng không đạt trước khi hiển thị được regenerate một lần, chia sẻ hai attempts với empty/network; không tự thay lời bằng template. Giữ UI do model quyết định. Đây là kiểm tra hẹp, không chứng minh mọi câu tự nhiên/đúng nội dung.

## T217
T218: model có thể chọn presentation comparison và facts theo schema chung; không ép so sánh mỗi lượt. Prompt lời thoại ngắn theo vai, phân biệt ý định và hành động hoàn tất; UI và speech không tự xác nhận giao dịch thật.
Khi provider trả 429, Facade tôn trọng Retry-After và chia sẻ cooldown qua limiter của process. Trong thời gian chờ mọi lượt LLM (kể cả repair/recovery) bị chặn trước khi gọi provider. Người dùng nhận số giây chờ còn lại. Không tự gửi lại, không cộng lượt/commit UI lỗi. Cooldown in-memory không đảm bảo đồng bộ nhiều replica hoặc qua restart.

## T216
Thay chính sách T215 cho network: cho phép một lần phục hồi network trước lời thoại, không replay khi đã xuất lời thoại; chia sẻ giới hạn hai attempts với empty recovery. Lựa chọn bằng text và UI đều là dữ liệu hội thoại cần nhớ trong giới hạn. Không ép câu hỏi/UI ở cuối mọi lượt, không hỏi lại quyết định đã trả lời hoặc liên tục nhắc câu chưa trả lời khi người học đang hỏi việc khác.

## T215
Output thành công ở transport nhưng không có lời thoại được phục hồi tối đa một lần qua cùng provider/limiter/budget; output UI/translation của lần rỗng không xuất hiện hoặc commit. Không tự retry HTTP/429/network.
Lượt chỉ hoàn tất khi provider xác nhận kết thúc thành công. EOF bất ngờ, content_filter/tool_calls ngoài protocol và lỗi giữa stream không commit. Mỗi lời gọi có idle timeout và deadline tổng 60s mặc định. Các lựa chọn UI đã gửi được giữ dưới dạng dữ liệu user trong cửa sổ lịch sử bounded, không phải chỉ dẫn system; đây không phải bộ nhớ dài hạn vô hạn.

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
- AC-validation: `suggestedTerms.call/self` chỉ là chuỗi hoặc null; `regionalNote` tùy chọn phải là chuỗi; `needs_clarification.assumptions/options` tùy chọn phải là mảng chuỗi. Trường sai kiểu bị từ chối trước khi UI dùng `.map()` hoặc render thành React child (T206).
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

## T209
Định nghĩa và xác thực form do Facade sở hữu; từ chối field/option/formId sai trước SSE. Chuẩn bị không tính lượt luyện; chỉ câu thực hành hoàn tất được tính. Form là hướng dẫn học ngôn ngữ, không tư vấn y tế/pháp lý hoặc giao dịch thật.

## T210 (thay T209)
Sinh UI do LLM quyết định ở open/message của web opt-in, không catalog form theo scenario. Giữ rule-first và dữ liệu văn hóa kiểm soát. UI không hợp lệ → giữ lời thoại và nhắc trả lời bằng chat; không render JSON/HTML. Submission chỉ hợp lệ với schema do Facade phát cho chính user/scenario; stale/forged → 409, field/value sai → 400. Thao tác UI không tính là câu luyện tiếng Việt; chỉ tin nhắn tự gõ hoàn tất tính lượt. Không tự chấm Done.

## T211
Nghiệm thu thật phải xác nhận health mode llm, không fallback mock; browser thao tác qua Facade thật. Không đọc/ghi .env hoặc secret trong phiên agent; người dùng nhập khóa qua secure prompt tại máy.

## T213
WHAT: phân biệt lỗi dịch vụ/quota/token cắt/UI hỏng; lượt lỗi không commit form/history; giữ UI tùy chọn theo hội thoại. Lời nhân vật đời thường, không lịch sự rập khuôn; xưng hô giữ rule-first. Lịch sử đưa vào model có giới hạn dung lượng.

## T220
Báo giá đã nói phải còn trong ngữ cảnh dù vượt sáu tin gần nhất. Câu hỏi chỉ về tổng không được tự đổi báo giá duy nhất ngay trước đó. Nhãn/mô tả/tiêu chí UI dành cho người học dùng tiếng Anh; tên lựa chọn/tên món giữ nguyên. Không thay đổi registry hoặc ép trình tự biểu mẫu.

## T221
Agent trả lời nhu cầu hiện tại, không mặc định kết thúc mỗi lượt bằng câu hỏi. Thanh toán chỉ thành câu hỏi/UI chọn phương thức khi người học chủ động hỏi phương thức. Hỏi tổng hoặc thông báo trả tiền mặt không phải yêu cầu chọn phương thức. Câu hỏi đã hỏi gần đây hoặc thông tin người học đã trả lời rõ không được hỏi lại trừ yêu cầu nhắc lại/đổi lựa chọn. Giữ lựa chọn UI tự sinh trong registry.

## T222
Lời kết phải phù hợp vai và việc vừa trao đổi; không quảng cáo dịch vụ, cảm ơn sự tin tưởng/lựa chọn hay tự nhận vinh hạnh phục vụ. Chào kết ngắn như hẹn gặp lại/cảm ơn vẫn hợp lệ. Khi người học kết thúc rõ ràng, không mở câu hỏi hay biểu mẫu mới; không bịa hẹn gặp, giao dịch hoặc cam kết. Kiểm chứng nhiều tình huống thay vì chỉ gọi món.
