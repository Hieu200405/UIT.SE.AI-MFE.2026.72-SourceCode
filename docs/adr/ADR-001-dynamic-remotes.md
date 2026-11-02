# ADR-001 – Host nạp Remote bằng Dynamic Remotes (không khai báo `remotes` tĩnh)

Trạng thái: Chấp nhận (PoC, Ngày 15).

## Bối cảnh
Cần Retry khi Remote tắt/lỗi (Charter: Error Boundary, tổng duyệt rớt mạng; Architecture §6; Test FT-01, MFE-02).

## Thử nghiệm
- Cấu hình `remotes: { progress: 'progress@http://localhost:3002/remoteEntry.js' }` + `React.lazy(() => import('progress/ProgressApp'))`: khi Remote tắt lúc Host khởi động → fallback đúng vùng, NHƯNG sau khi bật lại Remote, nút Retry vẫn lỗi (webpack giữ kết quả lỗi của remote tĩnh). Kết quả: 11/12 check đạt.
- Chuyển sang loader động (`apps/host/src/loadRemote.js`: tải `remoteEntry.js` bằng `<script>` → `init(shareScope)` → `get(module)`): Retry nạp được Remote mà không reload trang. 12/12 check đạt.

## Quyết định
Dùng Dynamic Remotes cho mọi Remote. URL lấy từ `remotes.config.js` (sau này theo biến môi trường dev/staging/prod). `RemoteSlot` tạo `React.lazy` mới mỗi lần Retry.

## Hệ quả
- Tốt: Retry thật sự; URL theo môi trường; không phụ thuộc remote tại thời điểm build.
- Đánh đổi: tự quản lý vòng đời tải/handshake; mất kiểm tra kiểu của import tĩnh (khi dùng TypeScript cần khai báo `declare module`).
- Singleton React được xác nhận bằng trình duyệt thật: cùng một instance, Remote không tải bản React riêng; bỏ `shared` ở Remote thì Chat không render được trong Host.
- Error Boundary chỉ bắt lỗi render/lazy-load, không bắt lỗi async hay event handler (đúng ghi chú của Architecture §6).
