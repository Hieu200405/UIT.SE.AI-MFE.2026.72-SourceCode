# T217 — Provider cooldown

Ngày 2026-11-18, branch codex/t217-provider-cooldown. Kế thừa các thay đổi T216 chưa commit, không ghi đè/bỏ các thay đổi đó.

## Kết quả triển khai
- HTTP429 được đọc Retry-After dạng số giây hoặc HTTP-date; header thiếu/sai/quá khứ dùng 60s, tối thiểu 1s, tối đa 24h. Không đưa header/response thô vào lỗi hiển thị.
- RateLimiter giữ cooldown dùng chung cho process Facade, đồng thời giữ giới hạn request/phút. Cooldown mới không rút ngắn cooldown đang có. Chỉ hết cả hai giới hạn mới gọi provider tiếp.
- Initial request, empty/network recovery và schema repair đi qua cùng acquire. Khi cooldown còn hiệu lực không gửi HTTP tới provider, không reserve daily budget; thông báo số giây còn lại tại thời điểm gửi request.
- Không auto retry429 hoặc bật fallback mock. Với cấu hình LLM thật fallback=error, lượt lỗi không cộng tiến độ; form lỗi còn retry được sau cooldown. Chế độ mock được cấu hình rõ ràng từ trước vẫn giữ hành vi cũ.

## Kiểm chứng
- LLM 52/52 pass, gồm 4 ca T217: parse date/seconds và biên; cooldown/RPM/không rút ngắn; 429 chặn user khác và budget, rồi phục hồi; 429 trong repair cũng chặn tiếp.
- Ca form retry đã kiểm tra bị chặn trong cooldown rồi submit thành công sau khi fake clock hết hạn; form chỉ bị tiêu thụ khi lượt thành công.
- Full test 177/177, build 4 apps, lint/CSS, typecheck và git diff --check pass. E2E 27/27 pass (40.1s), Edge local; output test-results/t217-e2e.
- Không chủ động tạo lỗi quota trên Groq thật. Đây là kiểm chứng tất định của cơ chế giới hạn, không phải một lần nghiệm thu hội thoại Groq mới; bằng chứng Groq T216 giữ riêng.

## Giới hạn
Cooldown ở bộ nhớ process, mất khi restart và chưa chia sẻ nhiều replica. Chặn những request bắt đầu sau khi nhận429; request đã bay trước đó không bị thu hồi. Nút Retry chưa có countdown sống/disabled; bấm sớm nhận thời gian còn lại, không gọi LLM. Cooldown không làm tăng quota hoặc bảo đảm provider có thể phục vụ ngay khi hết hạn.

## Review
Files/AC trong specs/002-ai-service-facade/tasks.md. Không dependency mới, không đổi UI registry hoặc dữ liệu văn hóa, không đọc/ghi secret, chưa commit/push/PR.
