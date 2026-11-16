# Kiến trúc hiện thực và đánh đổi

Host sở hữu route/layout và tải public entry của ba Remote qua Module Federation. Mỗi Remote có bootstrap để chạy riêng; RemoteSlot bọc Error Boundary và cho Retry. Loader thực hiện script → share scope → container.init → container.get → factory. React/react-dom và event-bus dùng singleton ở web; Mobile React riêng theo ADR-005, chỉ chia sẻ logic TypeScript thuần.

Chat sở hữu ô nhập và trạng thái request. Facade sở hữu hồ sơ/tiến độ; rule engine quyết định xưng hô trước adapter mock/LLM. Facade gửi SSE về facade-client, parser kiểm tra event, reducer chỉ áp dụng request hiện hành, UI dựng thẻ bằng registry. Khi lượt kết thúc, Chat phát event để Progress đọc lại Facade. Nếu mất event, lần nạp lại vẫn lấy dữ liệu chuẩn từ service.

State bền vững dùng SqliteStore khi có cấu hình FACADE_DB; chế độ bộ nhớ phù hợp kiểm thử nhưng mất dữ liệu khi khởi động lại. Event bus là tín hiệu trong trình duyệt, không phải đồng bộ đa thiết bị. Thiết bị dùng anonymousId khác nhau không tự chia sẻ hồ sơ; baseline không có đăng nhập đầy đủ.

## So sánh cho báo cáo

| Tiêu chí | Hiện thực Module Federation | React SPA nguyên khối | Single-SPA (phương án lý thuyết, chưa benchmark) |
|---|---|---|---|
| Đơn vị phát hành | Host/3 Remote riêng, config URL runtime | Thường một artifact frontend | Có lifecycle nhiều app; còn cần cơ chế bundle/share |
| React dùng chung | Shared singleton, đã kiểm tra E2E | Một dependency graph thường đơn giản hơn | Phải thiết kế cách chia sẻ và tương thích |
| Ranh giới lỗi | Boundary riêng + lỗi tải remote + lỗi SSE | Có thể có boundary theo khu vực | Cần boundary theo framework/app |
| State | Facade + Pub/Sub có schema | Có thể gọi cùng API hoặc dùng state chung | Cần contract giao tiếp xuyên app |
| Chi phí | Loader, version, CORS, CI nhiều artifact | Ít cấu hình hơn cho nhóm nhỏ | Lifecycle và tích hợp nhiều framework |

Không kết luận MFE tự động nhanh hơn, nhẹ hơn hoặc an toàn hơn SPA. Giá trị của đồ án là chứng minh ranh giới triển khai/runtime và xử lý lỗi trong một use-case cụ thể. Nhóm hai người chịu chi phí cấu hình lớn hơn để nghiên cứu kiến trúc này.

## Giới hạn đo lường

Chưa có bản SPA đối chứng cùng chức năng và cấu hình production, nên chưa có số liệu công bằng về bundle size, số request, thời gian tải và cold/warm cache. Webpack hiện build mode development; không dùng kích thước đó để tuyên bố hiệu năng production. So sánh định lượng cần task riêng có cùng bộ dữ liệu, trình duyệt, chế độ build và quy trình đo. Không đưa số cải thiện giả vào báo cáo.
