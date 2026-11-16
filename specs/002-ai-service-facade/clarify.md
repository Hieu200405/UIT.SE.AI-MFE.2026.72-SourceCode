
## T211 — 2026-11-12
Cần người dùng cho biết provider/model (hoặc local endpoint) và đã có key chưa. Không gửi key vào chat. Chưa có cấu hình LLM ở environment của agent, chưa có live Facade/local model đang chạy. Chỉ đang chuẩn bị công cụ, chưa nghiệm thu LLM thật.

T211 cập nhật: người dùng chỉ `.env.example`; xác định Groq/llama-3.3-70b-versatile, key trống. Người dùng xác nhận chưa có API key Groq. Đã chuẩn bị launcher nhập ẩn và browser live check, syntax pass; web đang chạy. Chờ người dùng tạo key và nhập tại terminal riêng; chưa gọi provider thật. Tự mở terminal bị policy chặn, không lặp lại thao tác.

Đã đối chiếu nguồn chính thức Groq: llama-3.3-70b-versatile deprecated từ 16/08/2026 (Enterprise được liệt kê riêng); lệnh T211 đổi sang openai/gpt-oss-120b theo model thay thế được Groq đề xuất. Không sửa file mẫu. Chờ API key do người dùng tự tạo/nhập tại máy.

T211 provider hiện hành: Gemini API, base URL https://generativelanguage.googleapis.com/v1beta/openai, model gemini-3.8-flash. User giao agent chọn provider có free tier. Tài liệu Google xác nhận model có free tier, endpoint streaming tương thích, Việt Nam được hỗ trợ. Quyền truy cập/quota dự án thực tế chỉ kiểm chứng sau khi user cấp key qua terminal riêng.
