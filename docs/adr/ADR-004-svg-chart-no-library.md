# ADR-004 – Biểu đồ lỗi xưng hô vẽ bằng SVG tự viết (không thêm thư viện biểu đồ)

Trạng thái: Chấp nhận. Căn cứ: AGENTS.md (không tự thêm dependency), Charter (bundle size, tối ưu cho đồ án).

## Quyết định
- Một biểu đồ đường duy nhất → hàm thuần `chartGeometry` (tính toạ độ, trục "đẹp", đường và vùng tô) + một component SVG ~40 dòng.
- Thông tin truy cập: `role="img"` + `aria-label` liệt kê giá trị, `<title>` cho từng điểm, câu tóm tắt xu hướng dạng chữ.
- Hình học là hàm thuần nên kiểm thử bằng node (5 test) mà không cần trình duyệt; e2e kiểm tra giá trị và thứ tự điểm.

## Đánh đổi
Không có tooltip/zoom/animation, chỉ một loại biểu đồ. Nếu sau này cần nhiều loại biểu đồ hoặc tương tác phức tạp, xem xét lại và xin duyệt một thư viện (mỗi Remote nạp riêng sẽ làm tăng bundle trừ khi đưa vào shared).

## Dữ liệu
"Buổi luyện" = mỗi lần vào tình huống (Chat gửi `open`). Confidence dùng công thức đề xuất trong specs/002 (chưa kiểm chứng).
