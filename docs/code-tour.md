# Bản đồ mã nguồn (đọc trước khi bảo vệ)

Mục đích: giúp cả nhóm tự đọc, tự giải thích được hệ thống. Mã trong repo do AI hỗ trợ viết theo quy trình SDD trong tài liệu Setup; nhóm chịu trách nhiệm hiểu và kiểm chứng.

## Đọc theo thứ tự
1. `AGENTS.md` và `.specify/memory/constitution.md` — luật chơi (React singleton, Facade duy nhất, rule-first, registry đóng…).
2. `docs/adr/` (ADR-001…004) — các quyết định kiến trúc kèm bằng chứng đã thử.
3. `specs/003-chat-remote/` (spec, clarify, plan, tasks, analyze) — cách đi từ yêu cầu đến task.
4. Chạy thử: `npm run poc:build && npm run dev`, mở http://localhost:3000.

## Bản đồ thư mục
| Nơi | Làm gì | Mở file nào |
|---|---|---|
| apps/host | Vỏ ứng dụng: route, nav, nạp Remote lúc chạy, Error Boundary | `loadRemote.ts` (Dynamic Remotes), `RemoteSlot.tsx`, `router.ts` |
| apps/chat-remote | Practice + Chat | `state/chatState.ts` (máy trạng thái lượt), `useChat.ts`, `ui/cards.tsx` |
| apps/progress-remote | Bản đồ tình huống, biểu đồ, Confidence | `chartGeometry.ts`, `ProgressApp.tsx` |
| apps/personalization-remote | Hồ sơ | `PersonalizationApp.tsx` |
| packages/shared-types | Contract dùng chung (nguồn sự thật) + validator + parser SSE | `src/index.ts` |
| packages/event-bus | Pub/Sub singleton, bỏ qua event sai schema | `src/index.ts` |
| packages/facade-client | Client duy nhất gọi Facade (SSE, abort, timeout) | `src/index.ts` |
| packages/ai-service-facade | Facade mock: pipeline rule-first, kịch bản, tiến độ | `mock-llm.ts`, `server.ts`, `store.ts`, `progress.ts` |
| packages/rules-xung-ho | Rule engine xưng hô (hàm thuần) + dữ liệu quy tắc | `engine.ts`, `data/rules.json` |
| apps/mobile | App Expo (4 màn), dùng chung logic với web | `src/screens/*`, `src/useChat.ts`, `metro.config.js` |
| packages/chat-state, chart-geometry | Reducer lượt hội thoại, hình học biểu đồ (dùng chung web + mobile) | `src/index.ts` |
| packages/ai-service-facade (LLM) | `engine.ts` (rule-first → gọi LLM), `llm.ts` (adapter OpenAI-compatible), `reply-parser.ts`, `prompt.ts`, `sqlite-store.ts` | cả 5 file |
| Dockerfile, docker-compose.yml, scripts/gen-config.cjs | Mỗi module một image; cấu hình theo môi trường | `Dockerfile` (các stage `AS ...`) |
| scripts/webpack.base.cjs | Cấu hình Module Federation dùng chung (singleton) | toàn bộ file (~30 dòng) |
| tests/ | e2e Playwright, kiểm tra cô lập CSS, 15 ca xưng hô | `e2e/mfe.spec.ts` |

## Một lượt hội thoại đi qua đâu
1. `ui/ChatScreen.tsx` → `useChat.send` → dispatch `send` (reducer) + `facade-client.streamChat`.
2. Facade `server.ts` kiểm tra `ChatRequest` → `mock-llm.planTurn`.
3. `planTurn` gọi `rules-xung-ho.resolveAddressTerms` TRƯỚC (rule-first) → thẻ `address` nếu gọi sai.
4. Sự kiện SSE (`user_translation`, `ui_card`, `text_delta`…, `done`) → `SseParser` → `parseStreamEvent` (bỏ event sai schema).
5. Reducer chỉ nhận event đúng `requestId` và đúng lượt → UI vẽ từ registry đóng 3 loại thẻ.
6. `done` → Facade ghi store → Chat phát `conversationTurnCompleted` → Progress tải lại từ Facade.

## Câu hỏi bảo vệ thường gặp → bằng chứng
| Câu hỏi | Trả lời ở đâu |
|---|---|
| Vì sao Module Federation, không iframe/monolith? | Tài liệu "Mô hình hóa" mục 3.3 + ADR-001 |
| React singleton hoạt động thế nào, chứng minh? | `scripts/webpack.base.cjs`; e2e "singleton" (cùng instance, Remote không tải React riêng); đã thử phá cấu hình → test fail |
| Một Remote lỗi thì sao? | `RemoteSlot.tsx`; e2e "Progress tắt", "/crash"; ADR-001 (vì sao Retry cần Dynamic Remotes) |
| Vì sao rule-first cho xưng hô? | Constitution #6–7; `rules-xung-ho` + 15 ca chạy không cần LLM |
| Chống thực thi nội dung AI? | Registry đóng (`cards.tsx`), `validateUICard`, test contract |
| Hủy request và event đến muộn? | `chatState.ts` + test; e2e "Stop"; ADR-003 |
| Cô lập CSS? | ADR-002 + `tests/css-isolation.test.mjs` |
| Event bus giữa Remote? | `packages/event-bus`; e2e "event-bus xuyên Remote"; thử bỏ khỏi shared → fail |

## Cái gì là mock / nháp (nói thật khi bảo vệ)
Facade mặc định chạy mock (chưa gọi LLM thật cho tới khi bạn cấu hình khóa); câu thoại, ghi chú văn hóa (`Sample`), `rules.json`, `scenarios.json`, công thức Confidence và ngưỡng tuổi đều chưa kiểm chứng; `/error`, `/timeout`, `/crash`, `/dev/seed` chỉ để thử nghiệm; CI GitHub chưa chạy thật; mobile React Native chưa làm.
