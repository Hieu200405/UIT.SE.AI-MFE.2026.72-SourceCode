# Thử bốn màn trên Android với Expo Go

T208 — người dùng xác nhận có điện thoại Android, dự án hiện chỉ local. Đây là hướng dẫn và phiếu ghi kết quả; chưa phải bằng chứng đã chạy trên điện thoại. Không cần tài khoản hosting hay API key để thử mock.

## 1. Kiểm tra phiên bản Expo Go

Repo khai báo Expo `~57.0.28` (SDK 57). Ngày tra cứu 2026-11-11, [trang Expo Go](https://expo.dev/go) hiển thị SDK 58 là mới nhất. Chọn **SDK 57 → Android** trên trang chính thức để lấy bản tương thích. Nếu không còn lựa chọn phù hợp, báo lỗi/phiên bản đang thấy; không tự sửa dependency hoặc chạy `expo install --fix`.

Theo [hướng dẫn Expo về phiên bản SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), Expo Go mới nhất chỉ hỗ trợ SDK mới nhất, và Android có thể cài phiên bản Expo Go cụ thể. README cũ nói SDK 58 chưa được Expo Go hỗ trợ là nhận định theo thời điểm cũ, không dùng làm hướng dẫn hiện tại.

## 2. Kết nối mạng

Điện thoại và máy tính dùng cùng Wi-Fi. Expo hướng dẫn mở app bằng QR từ development server và kiểm tra cùng mạng khi có lỗi kết nối. [Expo: Start developing](https://docs.expo.dev/get-started/start-developing/)

Mở PowerShell tại root repo. Xem IPv4 của card Wi-Fi đang dùng:

```powershell
Get-NetIPConfiguration | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway
```

Dùng địa chỉ Wi-Fi thực của máy tính, không dùng IP VPN/WSL/ảo. Ví dụ dưới đây dùng `192.168.1.20` chỉ để minh họa; phải thay bằng địa chỉ vừa kiểm tra. `localhost` trên điện thoại là chính điện thoại, không phải máy tính chạy Facade.

## 3. Terminal A — Facade mock riêng

Từ root repo, chạy trực tiếp Node để không nạp file `.env`. Dùng cổng 4010 để tách khỏi cổng 4000 của phiên phát triển web; dữ liệu thử nằm trong bộ nhớ và mất khi server dừng.

```powershell
$env:PORT = '4010'
$env:FACADE_DEV = '0'
$env:FACADE_DELAY_SCALE = '1'
$env:FACADE_DB = ''
$env:LLM_API_KEY = ''
$env:LLM_BASE_URL = ''
$env:LLM_MODEL = ''
$env:CORS_ORIGIN = '*'
node --experimental-strip-types --no-warnings packages/ai-service-facade/src/main.ts
```

Các phép gán chỉ tác động môi trường terminal, không đọc/ghi file secret. Dòng khởi động phải báo mock và lưu trữ bộ nhớ. Nếu cổng bận, dừng phiên thử do bạn mở hoặc chọn cổng khác và sửa URL tương ứng ở bước sau.

Trên trình duyệt điện thoại, mở `http://192.168.1.20:4010/health` (thay IP). Phải nhận JSON có `ok: true`, `mode: "mock"`, `dev: false` trước khi thử app.

Nếu không mở được health: kiểm tra IP/cùng mạng, guest Wi-Fi có cô lập thiết bị hay không, và quyền Windows Firewall cho Node trên mạng Private. Không tắt toàn bộ firewall. Chưa cần sửa mã mobile khi điện thoại chưa truy cập được Facade.

## 4. Terminal B — Metro cho Expo Go

Mở terminal thứ hai tại root repo rồi chạy:

```powershell
Set-Location -LiteralPath 'apps/mobile'
$env:EXPO_NO_DOTENV = '1'
$env:EXPO_NO_TELEMETRY = '1'
$env:EXPO_PUBLIC_FACADE_URL = 'http://192.168.1.20:4010'
npm run start -- --go --lan --clear
```

Thay IP trước khi chạy. Lệnh dùng Expo đã cài trong dự án, không tự tải package mới. `EXPO_NO_DOTENV=1` tắt tự nạp `.env`; EXPO_PUBLIC_FACADE_URL là URL công khai được nhúng vào app, không đặt bí mật vào biến này. [Expo: Environment variables](https://docs.expo.dev/guides/environment-variables/)

Mở Expo Go tương thích SDK 57 trên Android, quét QR trong terminal. Hai terminal phải tiếp tục chạy. Khi đổi URL, khởi động lại Metro và mở lại app.

Không dùng `--tunnel` để chữa lỗi Facade LAN: tunnel của Expo phục vụ Metro, không tự công khai service cổng 4010. Không cài ngrok hoặc dependency khác trong bước thử này.

## 5. Kịch bản và phiếu ghi nhận

Điền thiết bị, phiên bản Android, phiên bản Expo Go/SDK, ngày và người thử. Đây là thử nghiệm nội bộ có nhãn Sample; chưa demo nghiệm thu nội dung.

| ID | Thao tác | Kỳ vọng | Kết quả thực tế |
|---|---|---|---|
| AND-01 | Mở app → Practice | Có 8 tình huống; lọc nhóm hoạt động | Chưa chạy |
| AND-02 | Renting → gửi “Bạn ơi, tiền điện bao nhiêu?” | Có streaming, bản dịch và thẻ Address; chữ tiếng Việt nguyên vẹn | Chưa chạy |
| AND-03 | Gửi tin rồi bấm Stop ngay | Dừng, có Reply stopped; gửi tiếp được | Chưa chạy |
| AND-04 | Rời Chat khi đang trả lời rồi mở lại | Không có nội dung cũ chen vào phiên mới | Chưa chạy |
| AND-05 | Sau một lượt → Goals → Mark as done → Progress | Trạng thái Done; biểu đồ có buổi luyện | Chưa chạy |
| AND-06 | Profile → lưu tuổi/mục đích, Prefer not to say → mở lại app | Hồ sơ được đọc lại khi Facade vẫn chạy; không tự gán giới | Chưa chạy |
| AND-07 | Mở bàn phím, nhập tin dài, cuộn và gửi | Composer không bị che, cuộn/chạm được | Chưa chạy |
| AND-08 | Dừng Facade, gửi tin; chạy lại và Retry | Báo lỗi, không streaming vô hạn; Retry dùng được khi server hoạt động | Chưa chạy |

AND-03 nếu phản hồi kết thúc quá nhanh: dừng Terminal A, đặt FACADE_DELAY_SCALE='8' rồi chạy lại Node. Sau thử đưa về '1'. AND-08 có thể làm mất tiến độ do mock đang lưu bộ nhớ; không báo đó là lỗi persistence của SQLite.

Mẫu gửi lại: `Thiết bị … / Android … / Expo Go …; health: pass/fail; AND-01…08: …; lỗi đầu tiên: …`. Không gửi token/API key. Dừng hai terminal bằng Ctrl+C khi xong.

## 6. Ranh giới nghiệm thu

Chạy thành công hướng dẫn này chỉ đóng bằng chứng Android local. Chưa có URL công khai, Docker thật, CI cho commit cuối hoặc bản Android phát hành. Chưa thay đổi lựa chọn hosting; cần task triển khai riêng sau khi nội dung và cấu hình phát hành sẵn sàng.
