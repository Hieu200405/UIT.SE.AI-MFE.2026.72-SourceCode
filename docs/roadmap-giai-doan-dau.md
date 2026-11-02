# Thứ tự thực hiện

Đã xong: Constitution/AGENTS.md; contract v0.5.0; rule engine; Host + 3 Remote (ADR-001, 002); event-bus; Facade (mock + chế độ LLM OpenAI-compatible, SQLite, giới hạn tần suất, dự phòng mock); SSE client + reducer lượt (ADR-003); Progress đầy đủ (ADR-004); cấu hình Host theo môi trường (`config.json`) + Docker Compose + job CI Docker; app mobile Expo 4 màn (ADR-005).

NHÓM CẦN LÀM (mình không làm thay được):
1. Chạy `docker compose up --build` lần đầu, xem CI `docker` job xanh.
2. Lấy API key LLM (Groq), đặt vào `.env`, thử hội thoại thật; rà chất lượng tiếng Việt và ghi chú văn hóa.
3. Chạy app mobile trên điện thoại/giả lập (Expo Go SDK 57), thử luồng SSE thật.
4. Rà nội dung tiếng Việt: rules.json, scenarios.json, scripts.ts, ngưỡng tuổi, công thức Confidence; cập nhật tài liệu .docx.

Còn lại (đề xuất): mobile 4.2 tra cứu nhanh xưng hô và 4.1 thông báo (cần duyệt expo-notifications); deploy thật (Vercel/Netlify cho static, dịch vụ chạy Node cho Facade); số liệu so sánh bundle với SPA nguyên khối cho báo cáo.
