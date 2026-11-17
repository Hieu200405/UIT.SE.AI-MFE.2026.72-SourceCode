# 008 — Tasks

T201, T202: phạm vi Files và acceptance criteria tại `../000-master/tasks.md`. Người dùng đã duyệt triển khai ngày 2026-11-11.

## T214 — Sửa CI cài dependency
- User giao sửa CI; Agent Codex; branch codex/t214-fix-ci-install.
- Files: .github/workflows/ci.yml; Dockerfile; specs/008-cicd-docker/{spec,plan,tasks}.md; docs/acceptance/ci-install-fix.md.
- AC: sửa nguyên nhân npm ci EUSAGE trong verify/mobile và Docker build; giữ lockfile/dependencies và quality gates; kiểm tra clean install, YAML, Docker consistency; ghi rõ chưa có run GitHub mới nếu chưa push.
- Trạng thái: đang triển khai.

T214 kiểm chứng local hoàn tất 2026-11-17: clean install npm 10.9.9 web 128 packages / Mobile 846 packages đều exit 0, lockfile không đổi; YAML hợp lệ, Docker consistency 7/7, diff check pass. Chưa push/run GitHub mới; không tuyên bố toàn pipeline Linux/Docker xanh. Chi tiết docs/acceptance/ci-install-fix.md.
