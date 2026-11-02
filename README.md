# AI-MFE – Vietnamese for real life

```
npm install
npm test                  # unit + contract + facade + reducer + biểu đồ + CSS isolation
npm run typecheck
npm run poc:build         # build Host + 3 Remote
npm run dev               # http://localhost:3000 (Host, Remote 3001–3003, Facade mock :4000, dev mode)
PW_CHROMIUM_PATH=<đường dẫn chromium> npx playwright test   # e2e; hoặc: npx playwright install chromium
```
Thử nhanh: Practice → Renting a place → gõ "Bạn ơi, tiền điện bao nhiêu?" (thẻ sửa xưng hô + bản dịch); "Need a hint?"; "Mark as done"; Progress → "Load demo data".
Chỉ dùng khi phát triển: `/error`, `/timeout`, `/crash`; `?mic=0`, `?hint=0`, `?streamTimeout=1500`, `?facade=http://localhost:4001`.

**Docker:** `cp .env.example .env` (điền `LLM_API_KEY` nếu muốn dùng LLM thật; để trống = chế độ mock) rồi `docker compose up --build` → http://localhost:3000. Cùng một image Host dùng cho mọi môi trường: URL Remote/Facade lấy từ biến môi trường (sinh `config.json` lúc khởi động). `npm run test:images` dựng lại cấu trúc từng image trong thư mục tạm và chạy thử (không thay thế `docker compose build`, xem CI).
**LLM thật:** đặt `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` trong `.env` (mặc định đề xuất Groq free; nhà cung cấp OpenAI-compatible nào cũng được). `LLM_FALLBACK=mock` cho ngày demo. Dữ liệu người dùng lưu SQLite (`FACADE_DB`).
**Mobile:** xem apps/mobile/README.md (cài riêng; `npm run test:mobile`, `npm run bundle:mobile`).

Đọc trước: docs/code-tour.md, AGENTS.md, .specify/memory/constitution.md, docs/dependencies-approved.md, docs/adr/.
