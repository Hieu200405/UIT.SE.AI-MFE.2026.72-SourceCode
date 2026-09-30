# Master Spec — chia tính năng thành các spec nhỏ

Nguồn yêu cầu: `docs/feature-spec.md`. Mỗi spec dưới đây chạy trọn vòng SDD riêng
(specify → clarify → plan → tasks → analyze → implement → review).

| Spec | Nội dung | Tính năng (ID) | Giai đoạn | Phụ thuộc |
|---|---|---|---|---|
| 001-mfe-foundation | Host + 1 Remote, singleton React, Error Boundary, event bus/shared store, CI tối thiểu | (hạ tầng) | I – chặng 1–2 | — |
| 002-ai-facade | AI Service Facade + mock streaming; sau đó nối LLM thật | (nền cho 1.x–4.x) | I – chặng 2 | 001 |
| 003-situational-chat | Thư viện tình huống, roleplay streaming, thông điệp có cấu trúc | 1.1, 1.2, 1.6 (Core); 1.7, 1.8 (Should); 1.9 (Nice) | I – chặng 2–3 | 001, 002 |
| 004-address-terms-culture | Trợ lý xưng hô, phát hiện/giải thích lỗi, ghi chú văn hóa, bộ ≥15 ca test | 1.3, 1.4, 1.5 (Core) | I – chặng 3 | 002, 003 |
| 005-progress | Bản đồ tình huống, biểu đồ lỗi xưng hô theo thời gian | 2.1, 2.2 (Core); 2.3 (Should); 2.4, 2.5 (Nice) | I – chặng 3 | 003, 004 |
| 006-personalization | Mục đích cư trú, tuổi/giới tính, khu vực | 3.1, 3.2 (Core); 3.3 (Should); 3.4 (Nice) | I – chặng 3 | 001 |
| 007-mobile-companion | React Native: gợi ý câu theo bối cảnh, tra cứu xưng hô | 4.1, 4.2 (Core); 4.3, 4.4 (Should); 4.5 (Nice) | II | 002, 004 |
| 008-cicd-docker | GitHub Actions hoàn chỉnh, Docker từng module, demo online | (hạ tầng) | I–II | 001 |

## Quyết định còn mở (chốt trong plan.md của spec tương ứng)
- Bundler cho Module Federation: Webpack 5 (nhiều tài liệu/ví dụ, model ít sai hơn) hay Vite plugin — chốt ở 001.
- Ngôn ngữ giao diện: đề xuất giao diện tiếng Anh, nội dung luyện là tiếng Việt — chốt ở 003.
- LLM cho bản chạy thật (không phải LLM dùng để viết code) và nơi host Facade (serverless/Node) — chốt ở 002.
- Lưu trữ tiến độ (local/anonymous profile) và cách đồng bộ web–mobile — chốt ở 002/005.
