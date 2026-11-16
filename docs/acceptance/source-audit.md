# Đối chiếu bộ tài liệu và quy trình phát triển

Rà ngày 2026-11-11, từ 6 thư mục người dùng cung cấp: 13 tài liệu Word và 1 workbook. Đã trích xuất văn bản/bảng; các hình nhúng trong Word và bố cục PDF chưa được kiểm tra trực quan trong đợt này. Tài liệu nền tảng được dùng để hiểu thiết kế; ví dụ code, công cụ và hướng nghiên cứu không tự trở thành yêu cầu triển khai.

| Thư mục/tài liệu | Vai trò | Kết luận cho baseline |
|---|---|---|
| 1. Lập kế hoạch / Project Charter | Mục tiêu, scope, nghiệm thu, rủi ro | Host + 3 Remote, SSE, rule-first, CI/Docker, demo online và so sánh kiến trúc là bằng chứng cần có |
| 2. Setup AI Agent Assistant | Quy trình Spec → Clarify → Plan → Tasks → Analyze → Implement → Test/Review → Converge | Duy trì task có Files và truy vết; model/tool nêu trong tài liệu là phân vai tham khảo |
| 3. Củng cố nền tảng / Củng cố nền tảng | So sánh cách chia và tích hợp frontend | MFE là đánh đổi có chủ đích, không khẳng định luôn nhanh/nhẹ hơn monolith |
| 3 / Module Federation, Host, Remote, Shared | Async bootstrap, shared scope, handshake | Code loader và E2E singleton là minh chứng triển khai |
| 3 / Interactive UI for AI Agent | Agent UI, kiểm soát của người dùng, UI trong vòng tương tác | Stop, clarify, chọn hint và registry đóng; không thêm quiz/tool arbitrary vì ví dụ lý thuyết |
| 4. Mô hình hóa Vấn đề + Giải pháp | Pain point → capability → feature; TP1–TP9 | Không tuyên bố giải quyết toàn bộ 17 pain point: một số chỉ được đáp ứng một phần |
| 5. Lên Tech Stack / Tech Stack.xlsx | Danh sách lựa chọn công nghệ | React/webpack/MF phù hợp; Router, Redux, Express, Cypress là lựa chọn tài liệu, không phải dependency đã duyệt |
| 11 / Đặc tả tính năng hệ thống | 12 Core ban đầu, Should/Nice | CR-001 và xác nhận hiện tại: 10 Core + Mobile 4 màn, 4.1/4.2 không bắt buộc |
| 11 / API & Integration Contract | Ranh giới, event, schema | v0.1 chưa chốt endpoint; shared-types v0.5 và code là contract hiện thực, xem api-contract.md |
| 11 / Architecture System Design | Facade, Pub/Sub, state, CSS, fault isolation | Event chỉ là tín hiệu; store tại Facade là nguồn chuẩn |
| 11 / Bộ 15 ca xưng hô | Bộ hồi quy TC-XH-01…15 | Có test chạy không cần LLM; chưa thay cho đối chiếu nguồn/người duyệt |
| 11 / Test Strategy & Test Design | MFE/SSE/AI/CUL/FT/AC | Truy vết theo từng ca gốc; bảng nhóm ở §8 có ánh xạ sai (09/10/11), không lấy bảng đó làm oracle |
| 11 / Pain Point đã nghiên cứu | 17 vấn đề người học | Baseline tập trung roleplay, xưng hô, văn hóa; không thêm phát âm/CEFR |
| 11 / Vấn đề kĩ thuật khi triển khai | 9 câu hỏi nghiên cứu | Đối chiếu bằng loader, protocol, reducer, event bus, CSS, tests; ví dụ quiz/menu không thuộc registry được duyệt |

## Xung đột và quyết định

- Charter/Đặc tả Word vẫn ghi 12 Core và Mobile pervasive; CR-001 + clarify #14 chuyển sang 10 Core và 4 màn. Người dùng đã tái xác nhận phương án A ngày 2026-11-11; không sửa tài liệu nguồn ngoài repo.
- Master cũ trỏ Personalization tới 005, nhưng code và scaffold hiện dùng 006-personalization; danh mục chuẩn được ghi lại trong master. Những thư mục rỗng được giữ để tránh xóa lịch sử nhưng không được coi là spec hoàn chỉnh.
- Tech Stack nói React Router/Express/Cypress; danh sách dependency đã duyệt và ADR thực tế dùng router nhỏ, node:http, Playwright. Không cài thêm công cụ chỉ để khớp danh sách lựa chọn ban đầu.
- Tasks cũ đánh dấu hoàn tất nhưng có ghi chú lỗi thời: Docker, bottom-nav, persistence, biểu đồ, user_translation và Mobile nay có code. Trạng thái nghiệm thu phải lấy từ kiểm tra mới, không từ dấu ✅ cũ.
- Constitution yêu cầu nội dung chưa kiểm chứng không vào demo; code hiện phát Sample. Đây là cổng nội dung còn mở, không được hợp thức hóa bằng việc đổi nhãn.

## Những lỗi được xử lý trong đợt này

- T201: `data/` làm Git bỏ qua hai catalog bắt buộc; clone mới sẽ thiếu dữ liệu dù máy tác giả chạy được. Thêm ngoại lệ chính xác và kiểm tra hồi quy.
- T202: thiếu lệnh lint dù Definition of Done đòi lint. Thêm lint kiến trúc bằng TypeScript đã có và kiểm tra CSS hiện hữu; nối CI. Đây không phải ESLint đầy đủ.
- T203: test route Mobile chỉ chờ tiêu đề rồi kết thúc trong khi Chat còn mount/stream. Chờ hoàn tất và unmount; bỏ code lọc console warning.
- T204: Playwright có thể tái sử dụng server phát triển hoặc thừa hưởng cấu hình LLM/SQLite. Tách mock server do test sở hữu, vô hiệu cấu hình dịch vụ thật và persistence trong test.
- T206: validator chấp nhận suggestedTerms thiếu trường và clarify options/assumptions sai kiểu. Hai regression test đã fail trước sửa; thêm kiểm tra trước khi dữ liệu vào UI.

Không thêm dependency. Không đọc/sửa `.env`, không gọi LLM thật, không thay nội dung quy tắc. Các chỉnh sửa package/lock/test có sẵn được giữ nguyên.
