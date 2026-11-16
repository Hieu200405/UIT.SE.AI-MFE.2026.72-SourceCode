# Tasks hoàn tất baseline — 2026-11-11

Được người dùng giao trong chat: Core + Mobile 4 màn, kiểm thử, hồ sơ nghiệm thu. Mỗi task thực hiện tuần tự bởi Codex; các chỉnh sửa có sẵn không được hoàn tác. Trạng thái chỉ cập nhật từ bằng chứng chạy thật.

| ID | Công việc và acceptance criteria | Files | Trạng thái |
|---|---|---|---|
| T201 | Dữ liệu rules/scenarios không bị Git bỏ qua; kiểm tra tự động phát hiện mất dữ liệu nguồn | .gitignore; packages/rules-xung-ho/data/rules.json; packages/ai-service-facade/data/scenarios.json; tests/repository-data.test.mjs; package.json | Đã kiểm chứng local |
| T202 | Lint kiến trúc không thêm dependency: cấm import chéo Remote, HTML tùy ý, gọi LLM/Speech ngoài Facade; nối vào CI | scripts/lint.cjs; package.json; .github/workflows/ci.yml; specs/008-cicd-docker/{spec,plan,tasks}.md | Đã kiểm chứng local |
| T203 | Mobile: sửa teardown nếu tái hiện; 29 test và typecheck/bundle chạy; không che cảnh báo | apps/mobile/jest.setup.js; apps/mobile/__tests__/*; specs/006-mobile-companion/{spec,plan,tasks}.md | Đã kiểm chứng local |
| T204 | Chạy E2E; sửa lỗi cấu hình kiểm thử trên Windows nếu tái hiện; mock không tải .env | playwright.config.ts; tests/e2e/mfe.spec.ts; specs/003-chat-remote/{spec,plan,tasks}.md | Đã kiểm chứng local |
| T205 | Hồ sơ đối chiếu nguồn, traceability Core, API, kiến trúc/đánh đổi, kịch bản nghiệm thu và kết quả thật; ghi rõ phần cần người duyệt | docs/acceptance/*; README.md; specs/000-master/{spec,plan,tasks,clarify}.md; specs/006-personalization/{spec,plan,tasks}.md; specs/002-ai-service-facade/{plan,tasks}.md; specs/004-progress-remote/{plan,tasks}.md; specs/001-host-shell/plan.md | Hồ sơ đã lập; cổng nghiệm thu còn mở |
| T206 | Payload address/clarify sai kiểu bị từ chối trước khi render; giữ hỗ trợ null và trường tùy chọn hợp lệ | packages/shared-types/src/index.ts; packages/shared-types/test/contract.test.ts; specs/002-ai-service-facade/{spec,plan,tasks}.md | Đã kiểm chứng local |

Nội dung văn hóa chưa kiểm chứng, demo online, CI Docker thật và chạy mobile trên thiết bị là cổng nghiệm thu riêng. Không đánh dấu toàn đồ án hoàn tất chỉ vì unit test pass.

## Tiếp tục theo trả lời của người dùng

| ID | Công việc và acceptance criteria | Files | Trạng thái |
|---|---|---|---|
| T207 | Tìm/đọc nguồn, đối chiếu đủ 18 rule và 3 tip; phân biệt nguồn hỗ trợ trực tiếp, suy luận và khoảng trống; soạn nội dung đề xuất để người dùng duyệt, không đổi dữ liệu runtime | docs/acceptance/content-sources.md; docs/acceptance/content-review.md; docs/acceptance/README.md; specs/000-master/{spec,plan,tasks,clarify}.md | Đã soạn và kiểm tra; chờ duyệt D1–D4 |
| T208 | Hướng dẫn nghiệm thu Android thật qua Expo Go bằng PowerShell, mock Facade không đọc .env; xác minh yêu cầu tương thích SDK; ghi rõ chưa có demo online | apps/mobile/README.md; docs/acceptance/android-local.md; docs/acceptance/demo-runbook.md; docs/acceptance/README.md; specs/006-mobile-companion/{plan,tasks}.md; specs/000-master/{plan,tasks,clarify}.md | Hướng dẫn đã kiểm tra; chờ kết quả Android thật |
