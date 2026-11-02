# 001 – Tasks

| ID | Task | Files | Trạng thái |
|---|---|---|---|
| H001 | PoC Module Federation Host + Remote, singleton, kiểm chứng trình duyệt | apps/* | ✅ |
| H002 | Dynamic Remotes + RemoteSlot + Retry (ADR-001) | apps/host/src | ✅ |
| H003 | Personalization Remote (form theo wireframe, phát `profileUpdated`) | apps/personalization-remote | ✅ (chưa lưu qua Facade) |
| H004 | Router cấp Host (/chat, /progress, /personalization, /lab), nav theo wireframe, fallback theo wireframe, SPA fallback ở server | apps/host/src, scripts/poc-serve.cjs | ✅ (router tự viết; mobile bottom-nav chưa làm) |
| H005 | `@app/event-bus` singleton + validate payload (`parseBusEvent`) + xuyên Remote | packages/event-bus | ✅ |
| H006 | Cô lập CSS Tailwind prefix (ADR-002) + test | apps/*/src/styles.css, tests/css-isolation.test.mjs | ✅ |
| H007 | TypeScript + typecheck CI + Playwright e2e trong CI | tsconfig.json, .github/workflows/ci.yml | ✅ (CI chưa chạy thật trên GitHub) |
| H008 | Docker Compose (3000–3003, 4000) | docker-compose.yml | Chưa |
| H009 | Bottom-nav responsive cho mobile web; feature flags qua props | apps/host/src | Chưa |
| H010 | URL Remote theo biến môi trường (dev/staging/prod) | apps/host/src/remotes.config.ts | Chưa |

## Kết quả kiểm chứng (npm test + npx playwright test)
Unit/contract: xưng hô 20, contract 9, tình huống 12, event-bus 6, CSS 4. e2e: 6/6 (routing, singleton, lỗi+Retry, Error Boundary, event-bus xuyên Remote, CSS).
Đột biến đã thử (đều bị test bắt): bỏ `shared` ở Remote; bỏ `@app/event-bus` khỏi shared.
