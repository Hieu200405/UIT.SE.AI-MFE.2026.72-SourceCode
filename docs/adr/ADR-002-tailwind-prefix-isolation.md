# ADR-002 – Cô lập style bằng Tailwind v4 `prefix()` + preflight chỉ ở Host

Trạng thái: Chấp nhận. Căn cứ: Constitution #2, Architecture §7.

## Quyết định
- Mỗi Remote có prefix riêng (`chat:`, `progress:`, `profile:`); `styles.css` chỉ import `theme.css` và `utilities.css` (có `prefix(...)`), KHÔNG import preflight.
- Host là nơi duy nhất import `preflight.css` (reset toàn cục) và dùng prefix `host:`.
- Remote không viết CSS thủ công ở selector thẻ/`*`.

## Kiểm chứng
- tests/css-isolation.test.mjs biên dịch bằng đúng pipeline: không preflight; không selector thẻ trần; mọi class có prefix; biến theme có prefix.
- Phát hiện: Tailwind v4 vẫn sinh `:root`, `*`, `::before` chỉ để khai báo biến CSS (`--tw-*`, `--<prefix>-*`). Chấp nhận nếu rule chỉ chứa biến CSS (không rò rỉ style hiển thị); test chặn mọi thuộc tính hiển thị trong selector không prefix.
- Lỗi đã bắt được nhờ test: prefix trong `styles.css` của Personalization (`personalization`) lệch với class dùng trong component (`profile:`) → utilities không được sinh.
- e2e: nút của Chat và Profile cùng màu (teal-700) dù khác prefix; Host reset (`body margin 0`).

## Đánh đổi
Cần 6 gói CSS/PostCSS; class dài hơn do prefix; biến `--tw-*` dùng chung tên giữa các Remote (cùng giá trị khởi tạo, không rò rỉ hiển thị).
