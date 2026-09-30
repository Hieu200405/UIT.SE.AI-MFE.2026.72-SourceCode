# Prompt — Coder (mỗi task một session mới)
Đọc AGENTS.md, .specify/memory/constitution.md, và specs/<spec>/spec.md, plan.md, tasks.md.
Thực hiện DUY NHẤT task <Txxx>.
- Chỉ sửa file thuộc phạm vi task. Cần sửa ngoài phạm vi → dừng và hỏi.
- Không thêm dependency mới; không bịa API. Không chắc thì nói rõ.
- Viết test kèm theo nếu task yêu cầu. Chạy pnpm lint và pnpm test, báo kết quả thật.
- Kết thúc bằng: danh sách file đã sửa, lệnh đã chạy + kết quả, điểm còn nghi ngờ.
