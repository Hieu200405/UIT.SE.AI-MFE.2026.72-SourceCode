# T214 Sửa cài dependency trong CI

Ngày kiểm chứng: 2026-11-17. Branch: codex/t214-fix-ci-install.

## Nguyên nhân đã xác nhận
Run https://github.com/Hieu200405/UIT.SE.AI-MFE.2026.72-SourceCode/actions/runs/43886495569 của commit df1b45e33b38f20d4daf0cbd5b3100725151c2d3 thất bại ở npm ci cho cả verify và mobile. Runner dùng Node 22.23.4 / npm 10.9.9. Verify báo Missing webpack@5.112.2; Mobile báo thiếu các peer test-renderer, expo-font, react-native-worklets và các gói liên quan. Các bước test/build chưa chạy; Docker bị skipped do phụ thuộc verify.

Local npm config get legacy-peer-deps trả true, trong khi workflow/Docker không ghi chế độ này. Vì vậy npm trên runner resolve thêm peer ngoài lockfile. npm ci --legacy-peer-deps --dry-run pass với cả lockfile web và Mobile.

## Bản sửa
- .github/workflows/ci.yml: cả verify và mobile dùng npm ci --legacy-peer-deps; thêm workflow_dispatch; upload test-results khi job lỗi để có bằng chứng E2E.
- Dockerfile: dùng cùng cờ cho npm ci tại build stage.
- Giữ npm ci, lockfile và toàn bộ cổng kiểm thử/audit. Không thay phiên bản hay thêm package. Cờ này đồng bộ resolver với cách tạo lockfile hiện tại, không phải xác nhận mọi peer tương thích; build/test vẫn kiểm tra code thực tế.

## Kiểm chứng
- YAML parse và hai install steps hợp lệ.
- Docker consistency 7/7 pass; git diff --check pass.
- npm audit --audit-level=high: 0 vulnerabilities (lượt kiểm tra trước).
- Clean install với npm 10.9.9 được chạy trong thư mục tạm chỉ chứa manifests/workspace manifests, không sao chép .env. Kết quả cuối được bổ sung bên dưới.

Chưa commit/push hoặc kích hoạt một run GitHub chứa bản sửa. Chỉ rerun run cũ sẽ vẫn dùng workflow cũ. Cần đưa bản sửa vào nhánh PR để GitHub kiểm tra Linux và Docker thật; kết quả local không thay thế CI xanh.

Kết quả tiếp tục ngày 2026-11-17: web clean install bằng npm 10.9.9 exit 0 (128 packages, 56s); SHA-256 lockfile bản thử khớp repo. Mobile được tạo thư mục thử mới sau khi phát hiện manifest thư mục tạm cũ không còn; clean install mới exit 0 (846 packages, 3 phút). Runtime local là Node 24.21.0 trên Windows; CI dùng Node 22.23.4 trên Ubuntu, nên kiểm chứng local chỉ xác nhận resolver/lockfile, không thay thế run Linux.
