# 000 – Master Spec (Spec of Specs)

## Baseline được người dùng xác nhận ngày 2026-11-11

Hoàn tất 10 Core + Mobile 4 màn theo CR-001 phương án A, kiểm thử và hồ sơ nghiệm thu. Không bao gồm việc tự bổ sung Should-have/Nice-to-have. Quyền cập nhật spec/plan/tasks và triển khai task bổ sung đã được xác nhận trong chat và ghi ở clarify.md.

**Danh mục module hiện hành:** 001-host-shell; 002-ai-service-facade; 003-chat-remote; 004-progress-remote; 006-personalization; 006-mobile-companion; 008-cicd-docker. Số 005 cho Personalization trong bảng lịch sử dưới đây là tên cũ. Các scaffold rỗng không phải nguồn chuẩn.

AC nghiệm thu: build/lint/test, 15 ca xưng hô, tích hợp xuyên Remote và Mobile; nội dung văn hóa có nguồn/người đối chiếu; bằng chứng CI/Docker, thiết bị Mobile và demo online. Không đánh dấu toàn đồ án hoàn tất khi còn cổng chưa kiểm chứng. Ma trận hiện hành: `docs/acceptance/traceability.md`; báo cáo: `docs/acceptance/README.md`.

T207/T208: bổ sung bản đối chiếu nguồn chờ duyệt và quy trình thử Android/Expo Go theo trả lời mới của người dùng. Chỉ thay tài liệu trong hai task này; dữ liệu runtime vẫn unverified và demo online chưa có.

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
