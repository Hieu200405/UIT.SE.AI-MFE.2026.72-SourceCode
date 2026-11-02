# AGENTS.md

## Bối cảnh
Monorepo Micro Frontend React: Host + 3 Remote (Chat, Progress, Personalization) + AI Service Facade + Mobile (RN, Giai đoạn II).
Sản phẩm: nền tảng AI Agent hỗ trợ người nước ngoài học giao tiếp thực tế tại Việt Nam.
Wireframe tham chiếu: docs/wireframes/Vietnamese_for_Real_Life_Wireframes.pdf

## Trước khi làm bất kỳ việc gì
1. Đọc .specify/memory/constitution.md (nguyên tắc bất biến).
2. Đọc specs/<module>/spec.md, plan.md, tasks.md của module đang làm.
3. Chỉ làm đúng task được giao (mã Txxx). Không làm task khác.

## Được phép / Không được phép
- Chỉ sửa file trong phạm vi "Files" của task.
- KHÔNG thêm dependency mới khi chưa được duyệt.
- KHÔNG gọi LLM/Web Speech trực tiếp; luôn qua packages/ai-service-facade.
- KHÔNG import chéo giữa các Remote.
- KHÔNG tự đặt quy tắc xưng hô/văn hóa; dùng packages/rules-xung-ho.
- KHÔNG đọc/ghi .env hoặc secret.
- KHÔNG render HTML tùy ý từ AI; chỉ dựng thẻ trong UI registry (address, cultural_note, reply_suggestion).
- KHÔNG gán giới tính người học khi dữ liệu là "Prefer not to say"/chưa có.

## Khi mơ hồ
Dừng lại, ghi câu hỏi vào specs/<module>/clarify.md, chờ người trả lời.

## Định nghĩa "xong"
Build + lint + test pass; acceptance criteria của task được kiểm chứng; PR ghi rõ mã task, file đã sửa, cách kiểm tra.
