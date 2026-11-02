# 003 – Plan (HOW) – cần người duyệt trước khi tạo tasks

| Quyết định | Lý do | Phương án đã loại |
|---|---|---|
| Rule-first: `resolveAddressTerms(context)` hàm thuần trong packages/rules-xung-ho; LLM chỉ diễn giải lý do và dịch EN, qua Facade. | Kiểm thử tất định bằng 15 ca, không tốn quota. | Giao LLM quyết định xưng hô. |
| Mô hình trạng thái lượt (`TurnState`) dùng reducer thuần theo requestId. | Dễ test hủy/muộn/lỗi; không lẫn lượt. | Nhiều useState rải rác. |
| Parse mọi SSE bằng `parseStreamEvent` (shared-types); null → bỏ qua + log, không crash. | Contract test được; an toàn (Constitution #11). | Tin payload trực tiếp. |
| UI registry là map `type → component` (3 loại); không có component hành động nhạy cảm. | Không thực thi nội dung AI. | Render HTML từ AI. |
| Practice badge lấy từ `GET /progress` qua Facade client; cache ngắn, refetch khi nhận event cục bộ. | Không import chéo Remote (Constitution #5). | Import selector từ Progress. |
| Retry = tạo requestId mới + gửi lại nội dung cũ; abort request cũ. | Tránh sự kiện muộn của request lỗi. | Dùng lại requestId. |
| Feature flag đọc từ config Host truyền qua props: `ui.hint`, `ui.micButton`. | Cắt giảm nhanh Should-have. | Hard-code. |
| Strategy cho chế độ phản hồi (1.9) chỉ đặt sẵn interface, chưa làm UI. | Nice-to-have. | – |

Rủi ro: streaming + abort (test với mock stream trước); MF cấu hình (PoC Ngày 15).
