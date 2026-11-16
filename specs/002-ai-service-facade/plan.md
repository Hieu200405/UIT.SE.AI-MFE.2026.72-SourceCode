# Facade — Plan nghiệm thu

Giữ contract v0.5, HTTP/SSE qua facade-client, rule-first, SQLite tùy cấu hình. T205 ghi lại endpoint thực tế và thay đổi so với tài liệu Word v0.1 trong docs/acceptance/api-contract.md.

T206: validator là cổng vào dữ liệu UI; kiểm tra cả suggestedTerms.call/self, regionalNote, assumptions và options. Dữ liệu sai trả null/false; không ép kiểu hay suy đoán dữ liệu. Regression test mô phỏng giá trị object, number, null và mảng sai kiểu trước khi vào renderer.

T209: contract additive opt-in, registry scenario_form, catalog typed tại interactive.ts. Mọi input là dữ liệu, không thực thi HTML/URL/action từ LLM. Phạm vi tại ../003-chat-remote/tasks.md.

T210 thay pipeline T209: parser ui bounded, schema strict, opaque ID, active form lưu trong UserRecord (tương thích dữ liệu cũ). Commit schema/history khi done; abort/superseded không commit. Prompt LLM chứa UI protocol và thao tác ở role user. Test provider giả trả UI khác nhau/no UI/malformed; không dùng fixture trong production.

T211: launcher PowerShell nhận base URL/model không bí mật, nhập khóa bằng secure prompt vào environment của process con; không lưu file. Playwright chạy trực tiếp browser với server đã bật, không route mock và không khởi tạo fixture. Đang chờ người dùng chọn provider/model trước khi cấu hình/gọi API.

T211 đổi default launcher sang Gemini API sau lỗi đăng ký Groq. Dùng protocol tương thích hiện có, không thêm SDK. Vẫn yêu cầu nghiệm thu bằng response thật và thao tác web sau khi user cấu hình key.
