# T201–T206 Hoàn thiện kiểm tra baseline và hồ sơ nghiệm thu

Bản clone mới thiếu rules/scenarios vì Git bỏ qua thư mục data; validator còn cho phép payload address/clarify sai kiểu vào UI. Thay đổi đưa hai catalog nguồn vào phạm vi quản lý phiên bản, bổ sung regression tests, siết validator, tách E2E khỏi server/dữ liệu phát triển và sửa teardown Mobile. Thêm lint kiến trúc/CSS vào CI và hồ sơ truy vết 10 Core + Mobile 4 màn.

## Task và Files

- T201: .gitignore, package.json, tests/repository-data.test.mjs; hai catalog JSON giữ nguyên nội dung, trở thành file có thể commit.
- T202: scripts/lint.cjs, package.json, .github/workflows/ci.yml và specs/008-cicd-docker.
- T203: apps/mobile/jest.setup.js, apps/mobile/__tests__/app.test.tsx và plan/tasks Mobile.
- T204: playwright.config.ts và plan/tasks Chat.
- T205: docs/acceptance, README, master spec/plan/tasks/clarify và spec scaffolds tương ứng.
- T206: packages/shared-types/src/index.ts, test/contract.test.ts và spec/plan/tasks Facade.

## Kiểm chứng

141 test nền, 22 E2E, 29 Mobile, 6 image-layout; typecheck web/Mobile, architecture/CSS lint và build web/Android export. Hai ca contract mới fail trước khi sửa và pass sau sửa. Chi tiết và kết quả cuối tại README hồ sơ nghiệm thu.

## Giới hạn review

Nội dung vẫn unverified/draft/sample, chưa được phê duyệt để demo. CI/Docker thật, thiết bị Mobile và URL demo chưa có bằng chứng mới. Không thêm dependency. Không đánh dấu đồ án đạt 100%; không tự merge.

Workspace đã có thay đổi package/lock/mock/test từ trước; người mở PR cần phân biệt chúng với T201–T206. File này là mô tả PR chuẩn bị tại local, chưa được gửi lên GitHub.
