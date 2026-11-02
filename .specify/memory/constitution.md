# Constitution – UIT.SE.AI-MFE.2026.72

Nguyên tắc bất biến. Agent không được phá vỡ. Sửa Constitution cần cả 2 thành viên đồng ý.

| # | Nguyên tắc | Nguồn |
|---|-----------|-------|
| 1 | React/react-dom là singleton qua Module Federation (`singleton: true`); đồng bộ version giữa các package.json; không Remote nào tự nâng version. | Charter – Standards |
| 2 | Mỗi MFE cô lập style (CSS Modules/Tailwind scoping có prefix); cấm selector global (button, h1, *). | Charter – Standards; Architecture §7 |
| 3 | Mỗi Remote được bọc Error Boundary độc lập tại Host; lỗi async xử lý bằng try/catch. | Charter – Standards; Architecture §6 |
| 4 | Mọi lời gọi LLM/Web Speech đi qua AI Service Facade. | Charter – Standards |
| 5 | Remote không import chéo; giao tiếp qua event bus (Pub/Sub) + shared-types. Event chỉ là tín hiệu, dữ liệu chuẩn lấy từ Facade. | Architecture §3 |
| 6 | Quy tắc xưng hô/văn hóa là dữ liệu có cấu trúc, có trường nguồn; LLM chỉ diễn giải, không đặt quy tắc. | Setup §5; Charter – Risk |
| 7 | Bộ 15 ca xưng hô (TC-XH-01…15) phải pass trước khi merge thay đổi prompt/quy tắc; chạy không cần LLM. | Charter – Control Procedures |
| 8 | Không secret trong repo/prompt/bundle; không có UI cấu hình API key. | Charter – Exclusions |
| 9 | Không làm ngoài Exclusions: gamification trang trí, CEFR, chấm phát âm, đăng nhập đầy đủ, leaderboard/badge. | Charter; Đặc tả §1.2 |
| 10 | Agent chỉ sửa file trong phạm vi task; không tự thêm dependency; mơ hồ thì ghi clarify.md, không đoán. | Setup §5 |
| 11 | UI động chỉ dựng từ registry đóng; type lạ/schema sai → fallback văn bản, không crash. | Architecture §5.3 |
| 12 | Mọi sự kiện stream gắn requestId; bỏ sự kiện muộn của request đã hủy. | API Contract §4 |
| 13 | Nội dung văn hóa chưa đối chiếu nguồn phải gắn nhãn "Sample/chưa kiểm chứng" và không vào bản demo. | Setup §7.2 |
