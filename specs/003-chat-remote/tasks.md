# 003 – Tasks (DO). P = song song được. Mỗi task: 1 Agent – 1 branch – 1 PR.

| ID | P | Task | Files | Phụ thuộc | Agent gợi ý |
|---|---|---|---|---|---|
| T101 ✅ | | Schema + dữ liệu quy tắc xưng hô (có trường nguồn, tất cả 'unverified') | packages/rules-xung-ho/schema, data | – | Cline |
| T102 ✅ | P | Test runner đọc tests/scenarios/xung-ho/cases.json (script `test:xungho`) | tests/scenarios/xung-ho, package.json (script) | T101 | OpenCode |
| T103 ✅ | | Cài `resolveAddressTerms` (hàm thuần) + unit test, đạt 15 ca | packages/rules-xung-ho/src | T101,T102 | Cline |
| T104 ✅ | P | Mock Facade stream (text_delta+translation, ui_card, needs_clarification, error, done) | packages/ai-service-facade/src/mock | shared-types | OpenCode |
| T105 ✅ | | Reducer `TurnState` + xử lý abort/event muộn + unit test | apps/chat-remote/src/state | shared-types | Cline |
| T106 ✅ | P | Component Practice: lưới tình huống, lọc, badge, loading/empty/error | apps/chat-remote/src/practice | T104 | Cursor |
| T107 ✅ | P | Component tin nhắn + bản dịch + streaming cursor + Stop | apps/chat-remote/src/chat | T105 | Cursor |
| T108 ✅ | | UI registry + 3 thẻ (address, cultural_note, reply_suggestion) + fallback text | apps/chat-remote/src/cards | T105 | Cursor |
| T109 ✅ | | Thẻ needs_clarification (câu hỏi, giả định, chip) | apps/chat-remote/src/cards | T105 | Cursor |
| T110 ✅ | | Banner lỗi + Retry (requestId mới) | apps/chat-remote/src/chat | T105 | Cline |
| T111 ✅ | | Hint → dải gợi ý → điền ô nhập; micro button (UI-only, flag) | apps/chat-remote/src/composer | T108 | Cursor |
| T112 ✅ | | Phát conversationTurnCompleted sau `done` | apps/chat-remote/src/events | T105 | Cline |
| T113 ✅ | | Integration test: mock stream → UI; hủy; muộn; lỗi; type lạ | apps/chat-remote/test | T107–T110 | OpenCode |
| T114 ✅ | P | Mock + client cho `GET /progress` (trạng thái tình huống new/in_progress/done) phục vụ badge Practice | packages/ai-service-facade/src/mock, apps/chat-remote/src/api | shared-types | OpenCode |
| T115 ✅ | | Client SSE: mở/đóng kết nối, abort, timeout, parse bằng parseStreamEvent | apps/chat-remote/src/api | T104 | Cline |
| T116 ✅ | | Facade: nối `resolveAddressTerms` → thẻ `address` (originalText/suggestedText/assumptions) hoặc `needs_clarification` | packages/ai-service-facade/src | T103,T104 | Cline |
| T117 ✅ | | Nút "Mark as done" + checklist objectives; gọi `setScenarioDone`; phát `scenarioStatusChanged` | apps/chat-remote/src/chat | T105,T114 | Cursor |
| T118 ✅ | | Logic `deriveScenarioStatus`, `pickRecommended` + test (đã xong, 8 test trong scenarios.test.ts) | packages/ai-service-facade/src/progress.ts | – | Cline |

## Ghi chú thực hiện
- T104 → packages/ai-service-facade/src/{scripts,mock-llm,server}.ts (Facade mock chạy `npm run facade`, port 4000; `npm run dev` chạy cả hệ thống).
- T105 → apps/chat-remote/src/state/chatState.ts (10 test). T115 → packages/facade-client (fetch streaming + SseParser, abort, idle-timeout).
- T113 → tests/e2e/mfe.spec.ts (16 test, gồm Stop, /error, /timeout, clarify, hint, Mark as done, event-bus, CSS).
- Kích hoạt lỗi chỉ có ở mock: tin nhắn `/error`, `/timeout`; `/crash` (UI) ném lỗi render để thử Error Boundary; câu chứa "nên gọi thế nào" → needs_clarification.
- Chưa làm: bản dịch EN cho tin nhắn của NGƯỜI HỌC (xem clarify #15); biểu đồ "Address-term mistakes" thật và "Confidence" (2.3) ở Progress.
