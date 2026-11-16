# T211 — Cấu hình Gemini và nghiệm thu LLM thật

Cập nhật 2026-11-12. **Chưa gọi LLM thật: chờ người dùng tạo API key và nhập tại máy.**

## Nhà cung cấp được chọn

Google AI Studio / Gemini Developer API; model `gemini-3.8-flash`; base URL `https://generativelanguage.googleapis.com/v1beta/openai`.

Căn cứ chính thức đã đọc:
- [Pricing](https://aistudio.google.com/docs/pricing#gemini-3.8-flash): input/output của model có Free Tier, giới hạn theo quota; nội dung free tier có thể được dùng để cải thiện sản phẩm. Bài thử dùng tình huống giả định, không dữ liệu cá nhân.
- [Available regions](https://aistudio.google.com/docs/available-regions): có Việt Nam.
- [API keys](https://aistudio.google.com/docs/api-key): người dùng mới có thể được tạo project/key mặc định sau khi chấp nhận điều khoản; project có sẵn cần import, có thể cần xác minh cho free tier.
- [OpenAI compatibility](https://aistudio.google.com/docs/openai): endpoint trên hỗ trợ chat completions và streaming. Dùng adapter hiện có, không cài SDK mới.

Không bảo đảm mọi tài khoản đều được duyệt hoặc luôn có quota. Chỉ xác nhận quyền truy cập model sau khi gọi API thật.

## Tạo key và chạy

1. Mở https://aistudio.google.com/apikey và đăng nhập tài khoản Google.
2. Chấp nhận điều khoản nếu được hỏi. Dùng project/key mặc định nếu có; nếu chưa có, chọn Create API key và tạo/chọn project. Kiểm tra quota tier là Free Tier; chưa bật billing hoặc nâng cấp gói trả phí để chạy bài thử này.
3. Mở terminal PowerShell tại thư mục SourceCode và chạy:

```powershell
.\scripts\start-live-llm.ps1
```

Default của script đã là Gemini theo cấu hình trên. Nhập khóa tại prompt `API key` (ẩn ký tự), không gửi khóa vào chat. Giữ terminal mở trong khi thử.

Lệnh tương đương nếu muốn ghi rõ tham số:

```powershell
.\scripts\start-live-llm.ps1 -BaseUrl https://generativelanguage.googleapis.com/v1beta/openai -Model gemini-3.8-flash
```

4. Báo “Facade đã chạy”. Agent sẽ kiểm tra health, gọi browser thật và xem bằng chứng.

Launcher không tải/ghi .env, không in hoặc lưu khóa. Key được truyền vào environment của process con; khi script kết thúc sẽ xóa biến key trong phiên launcher. Facade bật fallback=error, dev=false, store bộ nhớ. Giới hạn nội bộ: 10 request/phút, 30.000 token ước lượng/ngày, không phải quota/billing limit của Google. Khởi động lại process sẽ reset bộ đếm và dữ liệu bộ nhớ.

## Web và bài nghiệm thu

Host đang trả HTTP 200 tại http://localhost:3000 trong lần kiểm tra gần nhất. Nếu server đã dừng, từ terminal khác chạy `npm run poc:serve` (build hiện có đã hoàn tất ở T210).

Sau khi Facade chạy:

```powershell
Invoke-RestMethod http://localhost:4000/health
```

Kết quả cần có `ok=true`, `mode=llm`, `dev=false`. Health này mới xác nhận cấu hình, chưa chứng minh key/model hoạt động.

Agent chạy bài browser thật bằng:

```powershell
$env:PW_CHROMIUM_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node scripts/verify-live-ui.cjs
```

Không interception/mock/fixture. Bài thử vào tình huống gọi món, gửi câu hội thoại, kiểm tra UI do model trả, chọn/điền form rồi nhận phản hồi tiếp. Artifact dự kiến: `test-results/live-llm/report.json`, `generated-ui.png`, `after-interaction.png`. Xem lại câu trả lời để xác nhận model thực sự dùng lựa chọn; assertion tự động chỉ kiểm tra cơ chế.

Nếu gặp 401/403: kiểm tra key/project/quyền truy cập ở AI Studio; nếu 429: kiểm tra quota của project, không tự bật billing. Nếu model không sinh UI hoặc trả schema lỗi, ghi đúng kết quả rồi chỉnh protocol khi có bằng chứng; không thay bằng provider giả để báo pass.

## Trạng thái chuẩn bị ban đầu (đã được thay thế bởi kết quả bên dưới)

- Launcher và live browser script đã kiểm tra cú pháp; git diff --check pass.
- Web HTTP 200; Facade cổng 4000 chưa kết nối được.
- Chưa gọi Gemini, chưa có kết quả nghiệm thu LLM thật.
- Groq được thay do người dùng gặp signup_blocked. Không sửa .env.example hoặc đọc .env.
- Lần trước cơ chế tự duyệt đã chặn mở terminal nhập khóa với “blocked by policy”. Người dùng chạy script tại terminal riêng; agent không lặp thao tác đã bị chặn.

## Kiểm chứng 2026-11-13

Người dùng xác nhận log provider: `[facade] LLM lỗi: http_503`. Theo tài liệu Gemini troubleshooting, 503 UNAVAILABLE là lỗi tạm thời có thể retry với backoff giới hạn; chưa đủ bằng chứng kết luận key/model sai hoặc quota hết. Nguồn: https://ai.google.dev/gemini-api/docs/troubleshooting.

Lần chạy browser thật trước đó: health mode=llm/dev=false; ban đầu client timeout 15 giây, sau khi bài thử tăng streamTimeout=45000 thì UI báo “The AI service is busy”. Không có UI sinh thành công, chưa đạt nghiệm thu. Các report thất bại lưu ở test-results/live-llm/.

Kiểm tra mới: Host 3000 và Facade 4000 đều không kết nối được. Agent đã khởi động lại Host/Remote; người dùng cần khởi động lại launcher Facade và nhập key riêng trên máy trước khi thử provider thật tiếp. Không thay model hoặc giả lập kết quả dựa riêng vào mã 503.

### Lần thử sau khởi động lại

Host/Facade HTTP200 và mode llm/dev=false. Hai lần browser thật cách nhau 10 giây đều báo “The AI service is busy”; chưa nhận được lời chào hay form. Bản ghi: test-results/live-llm/report-restart-attempt1.json và report.json. Mã HTTP cụ thể của hai lần này không có trong public response; http_503 là log user đã cung cấp trước đó.

Bước tiếp theo: dừng launcher bằng Ctrl+C rồi chạy `.\scripts\start-live-llm.ps1 -Model gemini-3.5-flash-lite`, nhập lại key tại máy. Đây là thử model khác để khoanh vùng, không bảo đảm khắc phục lỗi dịch vụ. Model có free tier theo https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite. Chưa đổi default hoặc tuyên bố nghiệm thu đạt.

### Kết quả với model mới — 2026-11-13

Người dùng xác nhận đã chạy model mới theo lệnh trên. Bài `node scripts/verify-live-ui.cjs` exit 0, status passed; health `mode=llm`, `dev=false`. Browser gọi Facade đang chạy, không interception hoặc provider fixture. Health không công bố tên model; tên model dựa trên lệnh khởi động được người dùng xác nhận.

Luồng đã quan sát và đối chiếu ảnh chụp:
- AI chào và sinh UI chọn món (Bánh mì / Phở / Bún bò).
- Người dùng gửi yêu cầu luyện gọi món và chọn độ cay; AI đề xuất bánh mì, sinh UI `Customize your Bánh mì` gồm ba mức cay.
- Browser chọn `Không cay (Not spicy)` và gửi. AI trả “Dạ, bánh mì không cay của bạn đây…” rồi sinh UI `Payment` với tiền mặt/chuyển khoản. Đây là hội thoại đóng vai, không có giao dịch thanh toán thật.

Bằng chứng: `test-results/live-llm/report.json`, `generated-ui.png`, `after-interaction.png`. Ảnh cuối đã được kiểm tra trực quan: tiếng Việt hiển thị đúng, lựa chọn đã gửi bị khóa, form tiếp theo thao tác được. SSE ghi trong report không đầy đủ mọi lượt; kết quả lượt cuối được đối chiếu bằng DOM và ảnh.

Đạt kiểm chứng cơ chế T211 cho một luồng gọi món với LLM thật. Chưa đánh giá độ ổn định nhiều lượt/nhiều tình huống. Ghi chú văn hóa vẫn có nhãn Sample và chưa được nghiệm thu nội dung, nên chưa coi đây là bản demo chính thức. Form chọn món bị thay thế bằng chat đang hiện nhãn Submitted dù chưa gửi form đó; ghi nhận điểm cần cải thiện UX, ngoài phạm vi cấu hình T211.

Launcher mặc định chuyển sang `gemini-3.5-flash-lite` để lần chạy tiếp dùng cấu hình vừa kiểm chứng. Không sửa .env hay lưu khóa.

### Groq — 2026-11-16
User yêu cầu khởi chạy bằng .env đã tự nhập. Không mở/in/sửa .env; Node nạp file vào runtime theo yêu cầu. Khởi chạy web và Facade dev=false/fallback=error, store bộ nhớ.
- Cấu hình ban đầu log model llama-3.3-70b-versatile, browser lỗi; Facade log http_404.
- Thử override runtime LLM_BASE_URL=https://api.groq.com/openai/v1 và LLM_MODEL=openai/gpt-oss-120b theo https://console.groq.com/docs/deprecations. Không sửa file cấu hình của user.
- Browser thật scripts/verify-live-ui.cjs exit 0, status passed; health llm/dev=false. AI sinh UI chọn món và độ cay; chọn Phở bò + Không cay, AI nhắc đúng lựa chọn và sinh UI Payment method. Không provider giả hoặc fallback mock.
- Bằng chứng test-results/live-llm/report.json và after-interaction.png. Server giữ chạy localhost:3000 và :4000. Muốn giữ model mới sau restart, user cần đặt LLM_MODEL=openai/gpt-oss-120b trong cấu hình riêng; phiên agent không sửa .env.
