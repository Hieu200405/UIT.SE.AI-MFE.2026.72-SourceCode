# Ma trận nghiệm thu Core và Mobile

Baseline do người dùng xác nhận 2026-11-11: 10 Core web và 4 màn Mobile. “Có test” dưới đây chứng minh hành vi kỹ thuật; nội dung học tập và nghiệm thu triển khai còn các cổng riêng ở README.

| Feature / yêu cầu | Hiện thực | Bằng chứng |
|---|---|---|
| 1.1 Thư viện tình huống | scenarios.json; PracticeScreen web/mobile | test:scenarios; E2E Practice 8 tình huống/lọc/badge; mobile practice |
| 1.2 Hội thoại đóng vai | mock-llm, engine, scripts; ChatScreen | test:facade/test:llm; E2E Renting; mobile chat; mock giới hạn theo kịch bản |
| 1.3 Trợ lý xưng hô | rules-xung-ho engine; Facade analyzeMessage | TC-XH-01…15, biến thể gender unknown; nội dung chưa được người duyệt |
| 1.4 Phát hiện/giải thích lỗi | addressCardStep; UI address | E2E Bạn ơi → Bác ơi; test:facade; mobile card; không tuyên bố phát hiện mọi câu tiếng Việt |
| 1.5 Văn hóa theo ngữ cảnh | SCRIPTS/CULTURAL_NOTES; UI cultural_note | test:llm pickCulturalNote; E2E/mobile Sample; **chưa đạt duyệt nội dung, CUL-02/03 chưa đủ ca độc lập** |
| 1.6 Streaming có định dạng | shared-types, facade-client, chat-state | Contract, UTF-8, reducer; E2E Stop/error/timeout/Retry; mobile Stop/late event |
| 2.1 Bản đồ tình huống | Facade progress/store; ProgressApp | test:scenarios/test:facade; E2E Mark as done/event bus; mobile progress |
| 2.2 Biểu đồ lỗi theo buổi | chart-geometry; sessions trong Facade | test:chart; E2E 8 buổi; mobile progress; dữ liệu demo không phải số liệu người học thật |
| 3.1 Mục đích cư trú | Profile, pickRecommended | test:scenarios; E2E profile→chat; mobile profile |
| 3.2 Tuổi/giới tính | validateProfile, Profile UI, rule engine | Contract; E2E tuổi sai/lưu lỗi; mobile profile; không tự gán gender |
| Mobile Practice | PracticeScreen | 7 ca practice.test.tsx |
| Mobile Chat | ChatScreen + useChat + shared reducer | 9 ca chat.test.tsx, route test; chưa có thiết bị |
| Mobile Progress | ProgressScreen + chartGeometry | progress.test.tsx |
| Mobile Profile | ProfileScreen + AsyncStorage ID | profile.test.tsx, app.test.tsx |
| Host và 3 Remote | loader, RemoteSlot, webpack shared | E2E routing, React singleton, Remote tắt/Retry, Error Boundary |
| Registry an toàn | validateUICard/parseStreamEvent | 16 contract tests sau T206; 2 ca mới fail trước sửa |
| Tái lập từ repo | catalog ngoại lệ Git, repository tests | 3 test:repository; còn cần commit các file mới và CI trên clone thật |
| CI/Docker | ci.yml, Dockerfile, Compose | test:docker + test:images; **chưa chứng minh Docker engine thật hoặc CI cho diff hiện tại** |

Các Should-have đã có (hint, Confidence, region, micro UI) được giữ nguyên; không mở rộng speech/notification/OCR. Chọn vùng hiện lưu hồ sơ, không chứng minh đã có giọng đọc vùng miền.
