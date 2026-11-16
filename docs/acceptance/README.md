# Hồ sơ nghiệm thu baseline 2026-11-11

**Kết luận: đã sửa các lỗi kỹ thuật xác định được và kiểm chứng baseline local; chưa nghiệm thu toàn đồ án.** Phạm vi được người dùng xác nhận là 10 Core + Mobile 4 màn, theo CR-001 phương án A. Các cổng nội dung, thiết bị và triển khai bên dưới còn mở.

Mốc repo khi bắt đầu: commit `afddd1a`, branch `HieuDev`. Kết quả áp dụng cho working tree sau T201–T206, chưa phải một commit đã được CI xác nhận.

## Tài liệu bàn giao

- [Đối chiếu 6 thư mục tài liệu và quy trình SDD](source-audit.md)
- [Ma trận yêu cầu–hiện thực–kiểm thử](traceability.md)
- [Contract HTTP/SSE/event bus hiện thực](api-contract.md)
- [Kiến trúc và đánh đổi với SPA/Single-SPA](architecture.md)
- [Danh sách nội dung cần nguồn/người đối chiếu](content-review.md)
- [Nguồn và bản đối chiếu D1–D4 chờ duyệt](content-sources.md)
- [Hướng dẫn thử Android thật bằng Expo Go](android-local.md)
- [Kịch bản tổng duyệt và phiếu thử Mobile](demo-runbook.md)
- [Mô tả thay đổi để mở PR](pr-description.md)
- [Task T201–T206](../../specs/000-master/tasks.md)

## Kết quả đã chạy

| Kiểm tra | Kết quả local |
|---|---|
| `npm run typecheck` | Pass |
| `npm run typecheck:mobile` | Pass |
| `npm run lint` | Pass: 67 file source + 8 ca CSS |
| `npm test` | 141/141 pass; 14 nhóm, gồm 15 ca TC-XH bắt buộc |
| `npm run poc:build` | Host + cả 3 Remote pass |
| `npm run test:images` | 6/6 pass; mô phỏng cấu trúc image, không chạy Docker engine |
| `npm run test:e2e` với Edge qua PW_CHROMIUM_PATH | 22/22 pass sau sửa contract cuối (44,2 giây) |
| `npm --prefix apps/mobile test -- --runInBand` | 29/29 pass sau sửa teardown, không lọc console warning |
| `npm run bundle:mobile` với EXPO_NO_DOTENV=1 | Android export pass; không tương đương cài/chạy trên thiết bị |
| `git diff --check` | Pass |

Lần kiểm tra cuối sau T206: E2E 22/22, Mobile 29/29 (27,969 giây), Android export thành công (`entry-0539aa7e648926574d36caa0d408d0a3.hbc`). Không còn cảnh báo React act/worker trong lần Jest này. Build/kiểm tra local sử dụng dependencies đã có trong workspace; chưa xác nhận cài sạch trên CI.

`npm test`: repository 3, xưng hô 20, contract 16, scenarios 12, Facade 19, LLM giả lập 21, event bus 6, CSS 8, chat-state 11, chart 5, host config 6, config generator 3, Docker consistency 7, UTF-8/client 4. Cảnh báo/lỗi mô phỏng trong test fault-tolerance là hành vi kiểm thử, không phải gọi LLM thật.

E2E lần đầu không chạy vì thiếu Chromium của Playwright; đã dùng Microsoft Edge có sẵn, không cài dependency mới. Jest ban đầu có cảnh báo VirtualizedList/worker; đã bỏ lọc cảnh báo, chờ Chat hoàn tất và unmount trong route test; chạy lại pass sạch.

## Các cổng còn mở

| Cổng | Bằng chứng còn thiếu | Trạng thái |
|---|---|---|
| Chất lượng nội dung Core 1.3–1.5 | 18 rule unverified, 8 scenario draft, 3 tip sample; người duyệt; ca CUL-02/03 độc lập | T207 có 7 nguồn và bản đối chiếu D1–D4; đang chờ duyệt, chưa sửa runtime |
| Chạy Mobile thật | Thiết bị/OS, SSE/Hermes, bàn phím/cuộn, mạng LAN/release | Người dùng chọn Android thật/Expo Go; có hướng dẫn T208, chưa có kết quả thiết bị |
| Demo online | URL Host/Remote/Facade và quyết định hạ tầng | Người dùng xác nhận hiện chỉ local, chưa có hosting |
| CI + Docker thật | Run URL cho commit chứa các file mới, jobs verify/docker/mobile pass | Chưa chạy cho working tree hiện tại; Docker không có trong PATH |
| Review/merge | Diff đã duyệt, commit/PR và người review | Chưa commit, push hay merge |

Không có phần trăm “100%” hợp lệ khi các cổng này chưa đóng. Báo cáo hiện là hồ sơ kỹ thuật/kiểm thử có thể review, chưa phải biên bản nghiệm thu được ký hoặc báo cáo/slide cuối đã được giảng viên duyệt.

## Bảo toàn workspace

Các thay đổi có sẵn ở root/mobile package lock, mobile package.json, mobile __mocks__, tests/css-isolation.test.mjs, tests/docker-consistency.test.mjs và tests/image-layout.test.mjs được giữ nguyên, không nhận là thay đổi do đợt này tạo ra. Không thêm dependency; không sửa Constitution; không đọc/sửa `.env`. Hai catalog nguồn chỉ được bỏ ignore, giữ nguyên nội dung và trạng thái chưa kiểm chứng; cần đưa vào commit để clone khác nhận được.

## Kiểm tra tài liệu T207/T208

Ngày 2026-11-11: bản đối chiếu có đủ 18/18 mã rule; liên kết Markdown nội bộ trong docs/acceptance hợp lệ; git diff --check pass. Expo CLI hiện có xác nhận hỗ trợ --go, --lan, --clear qua lệnh help với EXPO_NO_DOTENV=1. Không khởi chạy trên điện thoại và không coi kiểm tra CLI là nghiệm thu thiết bị. Hai task chỉ đổi tài liệu nên không chạy lại bộ kiểm thử runtime đã ghi ở trên. Nội dung đề xuất vẫn chờ người dùng duyệt.
