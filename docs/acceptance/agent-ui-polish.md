# T212 — Agent web UI

## Thay đổi
- Choice do model cung cấp được dựng thành thẻ có trạng thái chọn, hover/focus; select/text/textarea giữ native semantics và style đồng bộ.
- Form gửi rồi thu gọn thành biên nhận giá trị, có thể mở xem lại. Form bị thay bởi chat ghi Continued in chat / Closed, không giả là Submitted. Biên nhận Sent chỉ xác nhận gửi, không xác nhận provider xử lý thành công; Retry vẫn qua banner lỗi.
- Hội thoại giảm khung viền, phân cấp lời thoại/bản dịch, bỏ bản dịch lặp đúng nội dung người dùng; composer, heading và trạng thái được chỉnh thống nhất.
- Chuyển động ngắn và tôn trọng prefers-reduced-motion. Mobile dùng composer trong luồng trang để không chồng thanh điều hướng dưới.
- Không thay prompt/contract/Facade, không catalog theo scenario, không wizard. AI vẫn quyết định khi nào phát UI và nội dung fields/options; renderer chỉ quyết định hình thức theo kind.
- Không thêm dependency; không đọc hoặc ghi secret. Không cung cấp sửa trực tiếp form cũ vì server đã hết hạn form; người dùng có thể nói lại trong chat.

## Kiểm chứng
- Build 4 apps, typecheck và architecture/CSS lint pass.
- E2E 27/27 pass: hồi quy Chat/MFE, chọn bằng bàn phím, submit hai lần, Retry giữ dữ liệu, Stop, UI sai fallback, form đóng đúng nghĩa, layout 390px và reduced motion.
- Sau chỉnh composer mobile/biểu tượng: chạy lại 5 bài Generative Agent UI, build/lint/typecheck.
- Ảnh kiểm tra: test-results/agent-polish-desktop.png, agent-polish-mobile.png, generative-ui-narrow.png, generative-ui-desktop.png.
- E2E dùng provider fixture tất định để kiểm tra hồi quy, không tuyên bố đây là lần gọi Gemini mới. T211 đã kiểm chứng Gemini thật ở lượt trước. Đầu phiên này không có Facade thật lắng nghe cổng 4000; không truy cập khóa để khởi động thay người dùng.
- Nội dung văn hóa vẫn thuộc cổng nghiệm thu riêng. Chưa commit/PR.
