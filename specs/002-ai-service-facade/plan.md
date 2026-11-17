# Facade — Plan nghiệm thu

## T215
Output không có lời thoại: buffer các event dịch/UI cho tới khi có vi; nếu EOF thành công nhưng vi rỗng, bỏ toàn bộ parser state và gọi lại đúng một lần với chỉ dẫn format, vẫn tính limiter/budget. Không retry transport/HTTP, không gửi lại lời thoại đã xuất hiện. Schema repair vẫn tối đa một lần riêng.
Parse terminal SSE [DONE]/finish_reason stop, xử lý CRLF qua ranh giới chunk; hủy reader trong finally. Deadline tổng độc lập idle timer, không bị heartbeat kéo dài. Store giữ tối đa 48 tin; prompt giữ 6 tin gần nhất trong 7000 ký tự và tối đa 3000 ký tự lựa chọn UI cũ, nguyên bản, mới nhất trước khi giới hạn, không tóm tắt bằng LLM hoặc suy ra lựa chọn. Bổ sung regression cho ngắt luồng/abort/deadline và lựa chọn cũ.

Giữ contract v0.5, HTTP/SSE qua facade-client, rule-first, SQLite tùy cấu hình. T205 ghi lại endpoint thực tế và thay đổi so với tài liệu Word v0.1 trong docs/acceptance/api-contract.md.

T206: validator là cổng vào dữ liệu UI; kiểm tra cả suggestedTerms.call/self, regionalNote, assumptions và options. Dữ liệu sai trả null/false; không ép kiểu hay suy đoán dữ liệu. Regression test mô phỏng giá trị object, number, null và mảng sai kiểu trước khi vào renderer.

T209: contract additive opt-in, registry scenario_form, catalog typed tại interactive.ts. Mọi input là dữ liệu, không thực thi HTML/URL/action từ LLM. Phạm vi tại ../003-chat-remote/tasks.md.

T210 thay pipeline T209: parser ui bounded, schema strict, opaque ID, active form lưu trong UserRecord (tương thích dữ liệu cũ). Commit schema/history khi done; abort/superseded không commit. Prompt LLM chứa UI protocol và thao tác ở role user. Test provider giả trả UI khác nhau/no UI/malformed; không dùng fixture trong production.

T211: launcher PowerShell nhận base URL/model không bí mật, nhập khóa bằng secure prompt vào environment của process con; không lưu file. Playwright chạy trực tiếp browser với server đã bật, không route mock và không khởi tạo fixture. Đang chờ người dùng chọn provider/model trước khi cấu hình/gọi API.

T211 đổi default launcher sang Gemini API sau lỗi đăng ký Groq. Dùng protocol tương thích hiện có, không thêm SDK. Vẫn yêu cầu nghiệm thu bằng response thật và thao tác web sau khi user cấu hình key.

## T213
HOW: heartbeat SSE comment mỗi 4s (không giả text/UI), clear khi hoàn tất/hủy; kiểm tra finish_reason length; tách rate_limit/daily_budget thông báo; output budget UI 2400, lịch sử tối đa 6 tin và 10000 ký tự. UI sai/truncated báo retryable sau lời thoại, không done; valid null vẫn done. Prompt bỏ khuôn lễ phép quá mức, giữ vai và đại từ rule engine, không bịa cultural rule. Contract additive rich presentation.

T213 cập nhật sau kiểm chứng Groq: tái hiện lỗi UI và raw protocol tags trong lời thoại khi model có prose trước thẻ. Parser giữ preamble bounded tới khi gặp tag hoặc EOF; một lần repair JSON qua cùng provider, cùng quota/budget, không stream raw repair. Không tự dựng form khi model lỗi. Nếu repair vẫn sai → error Retry, không commit. Spec/Files T213 bổ sung reply-parser.ts.

T213 Groq GPT-OSS: dùng max_completion_tokens, reasoning_effort=low, include_reasoning=false theo https://console.groq.com/docs/reasoning và /docs/api-reference. Profile chỉ áp dụng api.groq.com + hai model GPT-OSS, provider khác giữ protocol cũ. Summary từ chối template placeholder {{...}}/${...}. Empty output có thông báo riêng.
