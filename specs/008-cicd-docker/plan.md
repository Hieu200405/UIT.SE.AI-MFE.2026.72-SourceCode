# 008 — Plan

Dùng TypeScript AST có sẵn để kiểm tra ranh giới import, provider và HTML; CSS dùng test PostCSS hiện có. Không giả định đây là ESLint tổng quát. CI chạy cùng lệnh local. T201 bảo vệ dữ liệu nguồn bằng git check-ignore, không đọc secret.

## T214
Log run 43886495569: verify/mobile fail npm ci EUSAGE vì npm tự resolve peer ngoài lockfile. Local npm config get legacy-peer-deps = true; dry-run có --legacy-peer-deps pass cho cả hai. Ghi tường minh cờ tại npm ci trong workflow và Dockerfile để thống nhất, không regenerate lockfile/upgrade package hoặc bỏ audit. Thêm workflow_dispatch để chạy kiểm tra thủ công; lưu artifact E2E khi lỗi. Kiểm chứng clean install trong thư mục tạm chỉ chép manifests/workspaces, không sao chép .env.
