# Personalization — Plan

Form sở hữu state cục bộ và gọi facade-client GET/PUT profile. Sau khi lưu, phát event profileVersion/changedFields; không truyền toàn bộ profile qua event bus. Facade là nguồn chuẩn. Giữ dependency/contract hiện tại; kiểm thử liên module bằng E2E.
