# AGENTS.md — Quy tắc chung cho mọi AI agent (OpenCode, Cline, Cursor, ...)

## Dự án
Nền tảng AI Agent hỗ trợ người nước ngoài sinh sống và hòa nhập tại Việt Nam.
Kiến trúc: Micro Frontend (React + Module Federation) + AI Service Facade + Mobile companion (React Native).
Tài liệu gốc: `docs/feature-spec.md` (tính năng), `specs/000-master/master-spec.md` (chia spec).

## Bắt buộc đọc trước khi làm
1. `.specify/memory/constitution.md`
2. `specs/<spec-hiện-tại>/spec.md`, `plan.md`, `tasks.md`
Thiếu file nào → DỪNG và báo, không tự suy đoán.

## Cấu trúc repo
- `apps/host`, `apps/remote-chat`, `apps/remote-progress`, `apps/remote-personalization`, `apps/mobile`
- `packages/ai-facade` (điểm truy cập LLM/Web Speech duy nhất), `packages/shared-types`, `packages/content` (tình huống, quy tắc xưng hô, ghi chú văn hóa)
- `specs/NNN-*` (spec/plan/tasks theo từng tính năng), `docs/`

## Lệnh
`pnpm install` | `pnpm lint` | `pnpm test` | `pnpm build` (từng package: `pnpm --filter <tên> <lệnh>`)

## Cách làm việc
- Mỗi lần chỉ làm ĐÚNG MỘT task trong `tasks.md` (ID dạng T001).
- Chỉ sửa file thuộc phạm vi task. Cần sửa ngoài phạm vi → dừng và hỏi.
- Không thêm dependency mới khi chưa được duyệt; nếu cần, đề xuất kèm lý do.
- Không bịa API/thư viện. Không chắc → nói rõ "không chắc" và chỉ ra tài liệu cần kiểm tra.
- Trước khi báo hoàn thành: chạy lint + test (thêm build nếu đụng cấu hình). Báo kết quả thật.
- Commit theo Conventional Commits: `feat(chat): T012 render correction card`.

## Ngoài phạm vi (không tự làm)
Gamification/bảng xếp hạng, chấm điểm phát âm chính xác, chứng chỉ/CEFR, đăng nhập đầy đủ,
nội dung học theo giáo trình, tính năng Should-have/Nice-to-have khi spec chưa yêu cầu.

## Ngôn ngữ
Code, identifier, commit: tiếng Anh. Tài liệu spec/plan/tasks: tiếng Việt (giữ thuật ngữ kỹ thuật tiếng Anh).
