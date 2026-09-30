# Tài liệu Đặc tả Tính năng Hệ thống
## Nền tảng AI Agent hỗ trợ người nước ngoài sinh sống & hòa nhập tại Việt Nam

**Document Id**: UIT.SE.AI-MFE.2026.72 - Feature Specification
**Liên kết với**: Project Charter UIT.SE.AI-MFE.2026.72
**Phiên bản**: 1.0

---

## 1. Bối cảnh và Nguyên tắc thiết kế

### 1.1 Người dùng mục tiêu

| Nhóm | Đặc điểm | Mức độ cần tiếng Việt |
|---|---|---|
| Du lịch dài ngày / Định cư | Cần xử lý sinh hoạt, hành chính, giao tiếp hàng ngày | Cao – dùng thật ngay lập tức |
| Tìm hiểu văn hóa – con người Việt Nam | Muốn hiểu cách ứng xử, tránh phạm phải điều cấm kỵ | Trung bình – thiên về hiểu hơn nói |

### 1.2 Nguyên tắc thiết kế tính năng

Toàn bộ tính năng trong tài liệu này được lựa chọn theo 3 nguyên tắc, nhằm đảm bảo giá trị thực tế và tránh việc "làm cho có":

1. **Ưu tiên tình huống sống thật** thay vì giáo trình ngôn ngữ hàn lâm (không dạy "màu sắc, con vật, số đếm").
2. **Ưu tiên rào cản đặc thù của tiếng Việt** mà không ngôn ngữ nào tương đồng – cụ thể là **hệ thống xưng hô** – vì đây vừa là giá trị thực tế cao nhất, vừa là điểm khó sao chép từ các app học ngôn ngữ đại trà (Duolingo, Anki...).
3. **Không làm tính năng "cao siêu nhưng vô dụng"**: loại bỏ gamification trang trí, chấm điểm phát âm chính xác tuyệt đối, chứng chỉ/CEFR tracking – những thứ không phục vụ mục tiêu "giao tiếp và hòa nhập được" của đúng persona.

### 1.3 Phân loại mức độ ưu tiên

- 🔴 **Bắt buộc (Core)** – quyết định giá trị cốt lõi của sản phẩm, không được cắt giảm.
- 🟡 **Nên có (Should-have)** – tăng giá trị đáng kể, triển khai nếu còn thời gian.
- 🟢 **Có thể có (Nice-to-have)** – bổ sung trải nghiệm, làm sau cùng hoặc bỏ nếu thiếu thời gian.

---

## 2. Tổng quan kiến trúc tính năng theo module (Remote App)

```
Host Shell App (Layout, Navigation, Error Boundary)
   ├── Remote 1: Trợ lý Hội thoại Tình huống ──┐
   ├── Remote 2: Theo dõi Tiến độ Hòa nhập ────┼──> AI Service Facade
   └── Remote 3: Cá nhân hóa Lộ trình ─────────┘        ^
                                                          |
                          Mobile Companion (React Native)─┘
```

---

## 3. Remote 1 — Trợ lý Hội thoại Tình huống (Module lõi)

Đây là module quan trọng nhất, chiếm phần lớn giá trị sản phẩm và thời gian phát triển.

### 3.1 Danh sách tính năng

| # | Tính năng | Mô tả | Ưu tiên |
|---|---|---|---|
| 1.1 | Thư viện tình huống thực tế | Danh sách tình huống chọn sẵn: thuê nhà, khám bệnh, làm tạm trú/gia hạn visa, ra ngân hàng, đi chợ/mặc cả, gặp hàng xóm, dự đám cưới/đám giỗ, ăn uống quán vỉa hè | 🔴 Core |
| 1.2 | Hội thoại đóng vai (Roleplay) với AI | Agent đóng vai người Việt trong tình huống đã chọn (chủ nhà, bác sĩ, cán bộ, người bán hàng...), người dùng luyện phản xạ hội thoại thời gian thực (streaming) | 🔴 Core |
| 1.3 | Trợ lý xưng hô theo ngữ cảnh | Dựa trên tuổi tác, giới tính, quan hệ, ngữ cảnh (đã khai báo hoặc suy ra từ hội thoại), hệ thống gợi ý cách xưng hô đúng (anh/chị/em/cô/chú/bác/con...) | 🔴 Core |
| 1.4 | Phát hiện & giải thích lỗi xưng hô | Sau mỗi lượt hội thoại, agent chỉ ra nếu người dùng xưng hô sai và giải thích ngắn gọn lý do (tuổi tác, vai vế, mức độ thân mật) | 🔴 Core |
| 1.5 | Ghi chú văn hóa theo ngữ cảnh | Khi hội thoại chạm tới tình huống có yếu tố văn hóa (đưa tiền, nhận quà, từ chối lời mời, lễ nghi), hiển thị "tip nhỏ" giải thích cách ứng xử phù hợp | 🔴 Core |
| 1.6 | Hiển thị câu trả lời dạng streaming có định dạng | Câu trả lời của agent hiện dần theo thời gian thực; định dạng lại để tối ưu cho hội thoại (không cần code block/markdown kỹ thuật như chatbot lập trình) | 🔴 Core |
| 1.7 | Gợi ý câu trả lời khi người dùng bí | Nút "gợi ý" hiển thị 1-2 cách trả lời mẫu phù hợp tình huống, giúp người mới không bị "đứng hình" | 🟡 Should-have |
| 1.8 | Luyện nghe theo giọng vùng miền | Cho phép chọn giọng đọc Bắc/Trung/Nam khi agent phát âm mẫu, phù hợp với nơi người dùng đang sinh sống | 🟡 Should-have |
| 1.9 | Chế độ phản hồi (Strategy) | Chọn giữa "sửa lỗi nghiêm túc" (chỉ ra mọi lỗi) và "khích lệ" (ưu tiên duy trì hội thoại, chỉ sửa lỗi nghiêm trọng) | 🟢 Nice-to-have |

### 3.2 Ngoài phạm vi (Out of scope) của Remote 1

- Không chấm điểm phát âm chính xác tuyệt đối theo chuẩn ngữ âm học.
- Không dạy ngữ pháp hàn lâm tách rời khỏi tình huống hội thoại.
- Không tự huấn luyện mô hình AI riêng cho tiếng Việt – sử dụng LLM có sẵn qua prompt engineering chuyên biệt.

---

## 4. Remote 2 — Theo dõi Tiến độ Hòa nhập

Thay vì đo lường kỹ thuật thuần túy (token usage), module này đo lường **năng lực hòa nhập thực tế**.

| # | Tính năng | Mô tả | Ưu tiên |
|---|---|---|---|
| 2.1 | Bản đồ tình huống đã luyện | Hiển thị trực quan các tình huống đã hoàn thành / đang luyện / chưa thử, theo nhóm (Hành chính – Sinh hoạt – Xã giao) | 🔴 Core |
| 2.2 | Biểu đồ cải thiện lỗi xưng hô theo thời gian | Theo dõi tần suất mắc lỗi xưng hô giảm dần qua các buổi luyện tập | 🔴 Core |
| 2.3 | Chỉ số "mức độ tự tin" theo nhóm tình huống | Ước lượng dựa trên số lần hoàn thành thành công + số lỗi giảm dần, hiển thị dạng thang đo trực quan (không dùng thang điểm CEFR học thuật) | 🟡 Should-have |
| 2.4 | Nhật ký ghi chú văn hóa đã học | Danh sách các "tip văn hóa" đã gặp trong quá trình hội thoại, có thể xem lại | 🟢 Nice-to-have |
| 2.5 | Streak luyện tập hàng ngày | Đếm số ngày liên tục có luyện tập, khuyến khích duy trì thói quen | 🟢 Nice-to-have |

### 4.1 Ngoài phạm vi

- Không xây dựng hệ thống bảng xếp hạng (leaderboard) hay huy hiệu (badge) mang tính trang trí thuần túy.
- Không cấp chứng chỉ hoàn thành khóa học.

---

## 5. Remote 3 — Cá nhân hóa Lộ trình

| # | Tính năng | Mô tả | Ưu tiên |
|---|---|---|---|
| 3.1 | Khai báo mục đích cư trú | Chọn: du lịch dài ngày / định cư / tìm hiểu văn hóa – hệ thống ưu tiên gợi ý tình huống phù hợp (định cư → nhiều hành chính; tìm hiểu văn hóa → nhiều lễ nghi/ứng xử) | 🔴 Core |
| 3.2 | Khai báo thông tin cá nhân cơ bản | Tuổi, giới tính (phục vụ tính năng gợi ý xưng hô chính xác hơn) | 🔴 Core |
| 3.3 | Chọn khu vực sinh sống | Bắc / Trung / Nam – ưu tiên giọng đọc và từ vựng địa phương tương ứng | 🟡 Should-have |
| 3.4 | Chọn chủ đề quan tâm | Cho phép người dùng tự thêm tình huống muốn luyện ngoài danh sách có sẵn | 🟢 Nice-to-have |

---

## 6. Mobile Companion App (React Native) — Yếu tố Pervasive Computing

Mobile app **không lặp lại** toàn bộ tính năng web, mà tập trung vào tính chất "len lỏi vào đời sống hàng ngày" – dùng ngay tại thời điểm cần, không cần chủ động mở app học bài.

| # | Tính năng | Mô tả | Ưu tiên |
|---|---|---|---|
| 4.1 | Gợi ý câu nói theo bối cảnh thời gian thực | Dựa trên thời gian trong ngày / dịp lễ (gần giờ ăn → gợi ý câu gọi món; gần Tết → gợi ý câu chúc Tết) hiển thị qua thông báo đẩy (push notification) | 🔴 Core |
| 4.2 | Tra cứu nhanh cách xưng hô | Nhập nhanh tuổi/quan hệ của người đối diện → nhận gợi ý xưng hô ngay lập tức, dùng khi đang giao tiếp trực tiếp | 🔴 Core |
| 4.3 | Ôn tập ngắt quãng (Spaced Repetition) | Nhắc ôn lại các mẫu câu/tình huống đã luyện trên web, đúng thời điểm sắp quên | 🟡 Should-have |
| 4.4 | Chụp ảnh dịch nhanh (OCR) | Chụp ảnh menu, biển báo, giấy tờ đơn giản → dịch và giải thích ngắn gọn | 🟡 Should-have |
| 4.5 | Widget màn hình chính | Hiển thị "câu nói/tình huống gợi ý trong ngày" ngay trên home-screen, không cần mở app | 🟢 Nice-to-have |

### 6.1 Nguyên tắc kỹ thuật

Mobile app tái sử dụng **AI Service Facade** dùng chung với web (cùng logic gọi LLM, cùng dữ liệu tình huống/xưng hô), tránh xây dựng lại backend riêng — tối ưu thời gian phát triển.

---

## 7. Bảng tổng hợp mức độ ưu tiên (để lập kế hoạch thời gian)

| Mức độ | Số lượng tính năng (tổng 23) | Ghi chú |
|---|---|---|
| 🔴 Core | 12 | Bắt buộc hoàn thành, quyết định điểm số và giá trị sản phẩm |
| 🟡 Should-have | 6 | Triển khai nếu tiến độ cho phép, có thể lùi sang cuối lộ trình |
| 🟢 Nice-to-have | 5 | Cắt bỏ đầu tiên nếu thiếu thời gian, không ảnh hưởng giá trị lõi |

**Thứ tự cắt giảm khi thiếu thời gian** (từ dễ cắt nhất đến khó cắt nhất):
1. Toàn bộ nhóm 🟢 Nice-to-have.
2. Giọng đọc vùng miền (1.8, 3.3) nếu chất lượng giọng đọc có sẵn không đảm bảo.
3. OCR dịch nhanh trên mobile (4.4) nếu vượt quá thời gian cho phép.
4. **Không cắt**: Trợ lý xưng hô (1.3, 1.4), thư viện tình huống thực tế (1.1, 1.2), ghi chú văn hóa (1.5) — đây là 3 nhóm tính năng tạo nên giá trị khác biệt cốt lõi của sản phẩm.

---

## 8. Ràng buộc kỹ thuật liên quan đến tính năng

- **Âm thanh (nghe/nói)**: sử dụng Web Speech API (trình duyệt) cho web và API tương đương trên React Native, không tự xây dựng mô hình STT/TTS riêng.
- **Dữ liệu văn hóa và xưng hô**: xây dựng dưới dạng bộ quy tắc/prompt template có cấu trúc (không phải mô hình AI riêng), dễ kiểm chứng và mở rộng.
- **LLM backend**: sử dụng API bên thứ ba hoặc mock service chất lượng cao, không tự huấn luyện mô hình.
