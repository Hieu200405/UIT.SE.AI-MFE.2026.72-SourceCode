# 000 – Master Spec (Spec of Specs)

Liên kết wireframe ↔ module ↔ tính năng ↔ kiểm thử. Wireframe: docs/wireframes/Vietnamese_for_Real_Life_Wireframes.pdf

| Màn hình wireframe | Thuộc | Tính năng (Đặc tả) | Ưu tiên | Kiểm thử chính |
|---|---|---|---|---|
| Top nav: Practice / Progress / My Profile | 001-host-shell | Layout, route /chat /progress /personalization | Core | MFE-01 |
| Practice – thư viện 8 tình huống, lọc 3 nhóm | 003-chat-remote | 1.1 | Core | E2E chọn tình huống |
| Practice – nhãn "Recommended for you" | 003 + 005 | 3.1 (ưu tiên theo mục đích cư trú) | Core | AC-04 |
| Practice – nhãn New / In progress / Done | 003 (đọc GET /progress) | 2.1 | Core | đã chốt: In progress = ≥1 lượt, Done = hoàn thành mục tiêu |
| Chat – hội thoại + streaming + nút Stop | 003 | 1.2, 1.6 | Core | SSE-01…05 |
| Chat – thẻ Address term (You said / Suggested / Reason) | 003 | 1.3, 1.4 | Core | TC-XH-01…15, AI-02/03 |
| Chat – thẻ Cultural note | 003 | 1.5 | Core | CUL-01…04 |
| Chat – Reply suggestions, "Need a hint?" | 003 | 1.7 | Should | AI-04 |
| Chat – nút micro | 003 | 1.10 – UI-only, không chức năng; flag `ui.micButton` | Should | AC-10 |
| Progress – Scenario map | 004 | 2.1 | Core | AC-04 |
| Progress – Address-term mistakes over time | 004 | 2.2 | Core | AC-04 |
| Progress – Confidence | 004 | 2.3 | Should | – |
| Progress – lỗi "temporarily unavailable" + Retry | 001 + 004 | Fault isolation | Core | MFE-02, FT-01 |
| My Profile – mục đích, tuổi, giới tính | 005 | 3.1, 3.2 | Core | MFE-04 |
| My Profile – khu vực Bắc/Trung/Nam | 005 | 3.3 | Should | – |
| Mobile: 4 màn cuối PDF (Practice/Chat/Progress/Profile) | 006 | khung app RN; 4.1, 4.2 = Should-have (CR-001) | chờ chốt A/B/C | xem specs/006 |
| Trạng thái: clarify, lỗi stream, loading/empty | 003/004/005 | FR-7, FR-11, FR-12 | Core | docs/wireframes/ui-states.html |

## Luồng dữ liệu xuyên Remote
- Chat → (conversationTurnCompleted) → Progress; Progress đọc lại GET /progress.
- Personalization → (profileUpdated) → Chat; Facade luôn nạp profile mới nhất.
- Practice badges (New/In progress/Done) lấy từ GET /progress qua Facade, KHÔNG import từ Progress Remote.

## Số lượng tính năng sau CR-001
Core 10 · Should-have 9 (1.7, 1.8, 1.10, 2.3, 3.3, 4.1, 4.2, 4.3, 4.4) · Nice-to-have 5.
