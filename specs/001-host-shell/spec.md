# 001 – Host Shell – spec nháp v0.1

## FR
- FR-1 Layout + thanh điều hướng (Practice / Progress / My Profile) và route cấp ứng dụng /chat, /progress, /personalization (Architecture §7).
- FR-2 Nạp Remote bằng Dynamic Remotes (ADR-001); URL theo môi trường.
- FR-3 Mỗi Remote nằm trong `RemoteSlot`: Suspense (loading) + Error Boundary (fallback + Retry) độc lập.
- FR-4 Fallback theo wireframe: "Progress is temporarily unavailable … practice conversations and profile are not affected." + Retry.
- FR-5 Truyền cấu hình ban đầu cho Remote qua props: feature flags `ui.hint`, `ui.micButton`, base path.
- FR-6 Shared: react, react-dom (singleton, ^18), event-bus, shared-types (singleton).
- FR-7 Không chứa logic nghiệp vụ của Remote.

## AC (đã kiểm chứng ở mức PoC, xem tests/e2e-poc/smoke.py)
AC-1 Host nạp Chat ở port 3001 · AC-2 React singleton, Hook chạy xuyên MFE · AC-3 Remote tắt → fallback, phần còn lại chạy · AC-4 Lỗi render → Error Boundary cô lập · AC-5 Retry nạp lại không reload trang.
Chưa làm: route thật, event-bus, feature flags, CSS isolation, CI.
