# Analyze – 003 (spec ↔ plan ↔ tasks ↔ Constitution)

## Kết quả
| # | Phát hiện | Mức | Xử lý |
|---|---|---|---|
| A1 | Clarify #2 yêu cầu "hiển thị giả định" nhưng `AddressCardData` không có trường giả định | Cao | Đã thêm `assumptions?` (contract v0.2.1) + test |
| A2 | FR-2 (badge từ `GET /progress`) không có task | Cao | Thêm T114 |
| A3 | Không có task cho client SSE (abort, timeout, parse) dù AC-3/AC-7 phụ thuộc | Cao | Thêm T115 |
| A4 | Không có task nối rule engine vào Facade để sinh thẻ address / needs_clarification | Cao | Thêm T116 |
| A5 | FR-3 (sidebar nhân vật AI + ngữ cảnh người học) chưa gắn task rõ | Trung | Gộp vào T107; cần dữ liệu tình huống (nhân vật, tuổi, mục tiêu "Done") – chưa có spec |
| A6 | Feature flag `ui.hint`/`ui.micButton` do Host truyền: chưa có spec 001 | Trung | Ghi vào spec 001 khi viết |
| A7 | Plan/Constitution: không phát hiện vi phạm (Facade duy nhất, không import chéo, registry đóng) | – | – |
| A8 | Mobile 006 thiếu 4.1/4.2 trên wireframe | Trung | Chờ xác nhận hướng bổ sung |
| A9 | Thiếu dữ liệu tình huống (8 kịch bản: nhân vật, ngữ cảnh, mục tiêu, nhóm) | Cao | Cần spec dữ liệu tình huống (đề xuất bước kế tiếp) |

## Độ phủ FR → Task
FR-1 T106 · FR-2 T114,T106 · FR-3 T107 · FR-4 T105,T107,T115 · FR-5 T107,T116 · FR-6 T103,T108,T116 · FR-7 T109,T116 · FR-8 T108 · FR-9 T111 · FR-10 T111 · FR-11 T110,T115 · FR-12 T106 · FR-13 T112
