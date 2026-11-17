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

## T204 — Kiểm thử nghiệm thu 2026-11-11

Playwright sở hữu server thử nghiệm, không tái sử dụng server đang chạy của người phát triển. Facade test dùng bộ nhớ và mock, vô hiệu cấu hình LLM/SQLite kế thừa từ môi trường; không đọc .env. Chạy 22 ca trên Chromium hoặc Edge có sẵn qua PW_CHROMIUM_PATH.

## T209
Registry thêm scenario_form được user duyệt. Facade sở hữu định nghĩa form cho 8 scenario; client chỉ render select/text/textarea. ChatRequest có interactive và interaction; retry dùng nguyên payload với requestId mới. Mobile không opt-in nên giữ luồng cũ. Files/AC tại tasks.md.

## T210 — Kiến trúc hiện hành (thay T209)
LLM stream lời thoại và block <ui> JSON tùy chọn. Facade buffer/validate block trước ui_card; server cấp formId và lưu schema được phát ở turn done. Client render generic registry, không biết trường goal/detail/sentence cố định. Khi submit, server đối chiếu active form theo user/scenario, dựng structured user message từ labels+values đã validate. UI cũ hết hạn sau turn mới; hủy/lỗi giữ khả năng Retry. Không thêm dependency. Files/AC tại tasks.md.

## T212
Giữ contract hiện tại: model vẫn quyết định kind/fields/options/title và có thể không sinh UI. Renderer chọn cách trình bày theo kind, không tra tên scenario/từ khóa. Dùng CSS prefix chat, motion giảm theo prefers-reduced-motion, native inputs cho bàn phím. Form inactive thu gọn với details xem lại; sent ref phân biệt thao tác gửi thật và form bị thay bằng chat. Không thêm sửa form đã hết hạn (server chỉ chấp nhận active form). Không đổi rules/culture.

## T213
HOW: mở rộng scenario_form tương thích ngược bằng metadata được validate; model chọn presentation, mô tả option và summary. Render icon registry + summary dl; không HTML hay ảnh URL từ model. Minh họa SVG React tự vẽ (phố, xe đạp, hàng quán, mái ngói), palette giấy/ngói/xanh, dùng ở Practice và Sidebar/header. Không đổi shell/Remote khác. Lỗi UI chuyển sang error retryable; giữ text đã nhận, Retry dùng request cũ.
