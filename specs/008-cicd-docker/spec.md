# 008 — Quality gates

T202: mỗi PR kiểm tra dữ liệu nguồn, lint kiến trúc/CSS, kiểu, unit/contract, build, E2E và Mobile. Không thêm dependency. Build/test local không đồng nghĩa Docker/CI đã chạy thành công.

AC: `npm run test:repository`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run poc:build` và các job hiện có thực thi độc lập; nguồn rules/scenarios phải có trong bản clone.

## T214
CI phải cài đúng lockfile đã kiểm chứng, dùng cùng chế độ peer dependency như môi trường phát triển; không đổi dependencies hoặc bỏ quality gate. Docker build cũng phải cài bằng chế độ đó. AC: clean-install web/mobile thành công với lockfile không đổi; workflow hợp lệ; nguyên nhân log Actions được ghi nhận.
