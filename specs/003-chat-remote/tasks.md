# 003 – Tasks (DO). P = song song được. Mỗi task: 1 Agent – 1 branch – 1 PR.

T204 (2026-11-11): kiểm thử nghiệm thu và cô lập server E2E; phạm vi Files/AC tại `../000-master/tasks.md`. Được người dùng duyệt trong đợt hoàn tất baseline.

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

## T209 — Agent biểu mẫu tương tác trên web (người dùng giao 2026-11-11)
- Files: specs/003-chat-remote/{spec,plan,tasks,clarify}.md; specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/shared-types/src/index.ts; packages/shared-types/test/contract.test.ts; packages/ai-service-facade/src/{interactive,engine,server}.ts; packages/ai-service-facade/test/facade.test.ts; apps/chat-remote/src/useChat.ts; apps/chat-remote/src/ui/{ChatScreen,MessageList,cards,ScenarioForm}.tsx; tests/e2e/mfe.spec.ts; docs/acceptance/interactive-agent.md.
- AC: cả 8 tình huống có biểu mẫu riêng; chọn mục tiêu + ngữ cảnh → Facade trả bước luyện → gửi câu luyện → Agent hướng dẫn tiếp; validate schema/giá trị ở server; retry giữ payload; chặn gửi trùng, form cũ, form stream lỗi/hủy; keyboard/responsive; mobile cũ không nhận form khi không opt-in. Không tự chấm đạt mục tiêu hoặc tự tạo quy tắc văn hóa.
- Trạng thái: đã triển khai, kiểm chứng local; bằng chứng tại docs/acceptance/interactive-agent.md. Không thêm dependency.

T209 đã triển khai và kiểm chứng local. Bằng chứng, giới hạn mock/LLM và hướng dẫn chạy tại ../../docs/acceptance/interactive-agent.md. Chưa tạo commit/PR; không đánh dấu toàn đồ án đã nghiệm thu.

## T210 — UI do AI quyết định theo hội thoại (thay T209)
- Người dùng giao triển khai web: LLM quyết định có/không có UI, trường/câu hỏi/lựa chọn; thao tác quay về LLM để quyết định tiếp, không chuỗi biểu mẫu cố định.
- Files: specs/003-chat-remote/{spec,plan,tasks,clarify}.md; specs/002-ai-service-facade/{spec,plan,tasks}.md; packages/shared-types/{src/index.ts,test/contract.test.ts}; packages/ai-service-facade/src/{interactive,engine,server,prompt,reply-parser,store}.ts; packages/ai-service-facade/test/{facade,llm}.test.ts; packages/facade-client/src/index.ts; apps/chat-remote/src/ui/{ChatScreen,MessageList,cards,ScenarioForm}.tsx; tests/e2e/mfe.spec.ts; tests/fixtures/generative-provider.ts; docs/acceptance/interactive-agent.md.
- AC: UI từ output LLM, không catalog theo scenario/keyword trong production; choices/select/text/textarea qua schema đóng; tối đa 1 UI/turn, không bắt buộc có; input đối chiếu schema đã phát theo người dùng/scenario, form cũ/giả bị từ chối; hủy/lỗi không commit UI hay lượt; Retry giữ payload; UI JSON lỗi/truncated/quá lớn fallback text; LLM nhận câu hỏi+giá trị và lịch sử. Mock không giả là AI sinh UI. Build/lint/typecheck/tests/E2E pass.
- Trạng thái: đã triển khai và kiểm chứng local ngày 2026-11-12. Build/lint/typecheck pass; npm test 151 ca, E2E 26/26, Mobile 29/29. Sau chỉnh prompt/lưu lịch sử cuối: Facade 21/21, LLM 27/27 và typecheck pass lại. Chưa kiểm chứng model thật. Bằng chứng: docs/acceptance/interactive-agent.md. Không thêm dependency, không đổi văn hóa hoặc đọc secret.

## T212 — Nâng cấp trải nghiệm Agent web (người dùng giao)
- Files: specs/003-chat-remote/{spec,plan,tasks}.md; apps/chat-remote/src/ui/{ScenarioForm,MessageList,ChatScreen,Composer}.tsx; apps/chat-remote/src/styles.css; tests/e2e/mfe.spec.ts; docs/acceptance/agent-ui-polish.md.
- AC: UI lựa chọn dạng thẻ, select/input phù hợp schema AI; form cũ thu gọn thành biên nhận, phân biệt đã gửi và tiếp tục bằng chat; không gửi lại form hết hạn; keyboard, focus, responsive 390px và reduced motion; không wizard/catalog theo tình huống, không HTML AI hoặc dependency mới. Build/lint/typecheck và E2E hồi quy pass. Kiểm tra ảnh desktop/mobile.
- Trạng thái: đang triển khai. Giữ nguyên contract/prompt và Facade đã kiểm chứng LLM thật.

T212 hoàn tất: build 4 apps, lint/CSS 8 ca, typecheck và E2E 27/27 pass. Sau chỉnh composer mobile và biểu tượng, build/lint/typecheck và 5/5 bài Generative Agent UI pass lại; đã xem ảnh desktop/mobile. Bằng chứng và giới hạn ở docs/acceptance/agent-ui-polish.md. Chưa commit/PR; không gọi lại Gemini trong lượt này.
