# 008 — Quality gates

T202: mỗi PR kiểm tra dữ liệu nguồn, lint kiến trúc/CSS, kiểu, unit/contract, build, E2E và Mobile. Không thêm dependency. Build/test local không đồng nghĩa Docker/CI đã chạy thành công.

AC: `npm run test:repository`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run poc:build` và các job hiện có thực thi độc lập; nguồn rules/scenarios phải có trong bản clone.
