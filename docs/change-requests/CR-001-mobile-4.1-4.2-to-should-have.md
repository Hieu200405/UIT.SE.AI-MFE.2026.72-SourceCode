# CR-001 – Chuyển 4.1 và 4.2 (mobile) từ Core sang Should-have

Trạng thái: ĐÃ CHỌN phương án A (mobile baseline = 4 màn wireframe; 4.1/4.2 làm thêm nếu còn thời gian); các tài liệu gốc (.docx) CHƯA được sửa – cần chủ tài liệu cập nhật theo bảng dưới.

## Thay đổi
| Mã | Tính năng | Trước | Sau |
|---|---|---|---|
| 4.1 | Gợi ý câu nói theo bối cảnh thời gian thực (push notification) | Core | Should-have |
| 4.2 | Tra cứu nhanh cách xưng hô | Core | Should-have |
| 1.10 | Nút micro (chỉ hiển thị, không chức năng, flag `ui.micButton`) | – | Should-have (UI-only) – tính năng mới |

Số lượng: Core 12 → **10**; Should-have 6 → **9** (thêm 4.1, 4.2, 1.10); Nice-to-have 5 (giữ nguyên).

## Tài liệu cần sửa
| Tài liệu | Vị trí | Sửa thành |
|---|---|---|
| Project Charter | Success Criteria: "Hoàn thành toàn bộ 12 tính năng Core" | "…10 tính năng Core" |
| Project Charter | Success Criteria: "Ứng dụng di động RN … tối thiểu 2 tính năng Core (gợi ý câu nói…, tra cứu nhanh…)" | Viết lại theo phương án mobile ở mục "Quyết định cần xác nhận" |
| Project Charter | Objectives (mobile), Inclusions (Giai đoạn II), Milestone Ngày 75, Risk (chi phí RN) | Đổi "tính năng Core" của mobile thành Should-have / khung mobile |
| Đặc tả tính năng | §6 (bảng 4.1, 4.2) | Ưu tiên = Should-have |
| Đặc tả tính năng | §7 (bảng tổng hợp) | Core 10, Should-have 9, Nice 5 |
| Đặc tả tính năng | §7 (thứ tự cắt giảm) | Đề xuất: Nice → 1.8/3.3 → 4.4 OCR → 4.3 → 4.1 → 4.2 → 1.10 (4.2 rẻ và giá trị cao nên cắt sau cùng) |
| Đặc tả tính năng | §3 | Thêm dòng 1.10 (UI-only) |
| Mô hình hóa | Bảng 1: P02, P03 cột Tính năng (4.2 không còn Core) | P02/P03 vẫn Core nhờ 1.3, 3.2; ghi 4.2 là Should-have |

## Hệ quả cần chú ý
- Sau thay đổi, mobile không còn tính năng Core nào. Nếu không có khung mobile, Giai đoạn II có thể bị cắt hoàn toàn mà vẫn "đạt" tiêu chí Core.
- 4 màn mobile trong wireframe (Practice, Chat, Progress, Profile) là bản chuyển thể của web, đi ngược nguyên tắc Đặc tả §6 "mobile không lặp lại web".

## Quyết định cần xác nhận (nhóm chọn một)
- **A (đề xuất):** Mobile baseline = 4 màn wireframe, dùng Facade + shared-types, là sản phẩm tối thiểu của Giai đoạn II (tiêu chí nghiệm thu: chạy trên thiết bị/giả lập, chat streaming được, dùng chung Facade). 4.1, 4.2 làm thêm nếu còn thời gian.
- **B:** Mobile chỉ gồm 4.1 + 4.2 (đúng tinh thần pervasive) và bỏ 4 màn wireframe mobile; cần vẽ lại wireframe.
- **C:** Bỏ mobile khỏi phạm vi bắt buộc, chỉ giữ như mục mở rộng.
