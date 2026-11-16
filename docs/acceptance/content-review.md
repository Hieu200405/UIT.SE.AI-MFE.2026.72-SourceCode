# Nội dung cần đối chiếu trước nghiệm thu

Ngày rà: 2026-11-11. T207 đã bổ sung [nguồn tham khảo, đối chiếu 18 rule và bản thảo 3 tip](content-sources.md), gồm quyết định D1–D4 chờ người dùng duyệt. **Không coi đây là nội dung đã được duyệt để demo.** Test pass chỉ chứng minh code trả kết quả kỳ vọng, không chứng minh quy tắc đúng với mọi vùng/gia đình.

## Quy tắc xưng hô

Nguồn dữ liệu: `packages/rules-xung-ho/data/rules.json`. Có 18 quy tắc, tất cả `unverified`.

| Nhóm | Rule ID | Căn cứ hiện tại | Việc cần duyệt |
|---|---|---|---|
| Giảng viên | R-LECT-M, R-LECT-F, R-LECT-UNK | TC-XH-06/07; UNKNOWN là suy ra | Trường hợp không biết giới người đối diện |
| Bác sĩ | R-DOCTOR | TC-XH-12 | Danh xưng nghề và cách tự xưng trung tính |
| Người lớn tuổi, người quen | R-ELDER-NEIGHBOR-M, R-FRIEND-MOTHER, R-FRIEND-YOUNGER-SIB | TC-XH-08/09/10, wireframe Renting | Tuổi tương đối và cách gia đình muốn được gọi |
| Thiếu dữ kiện | R-CLINIC-PHONE, R-CUSTOMER-UNK | TC-XH-11/14 | Không suy đoán tuổi/giới |
| Bạn bè, đồng nghiệp | R-PEER, R-COLLEAGUE | TC-XH-05/13 | Mức độ thân mật và bối cảnh |
| Quy tắc theo tuổi | G-FEMALE-MUCH-OLDER, G-MALE-MUCH-OLDER, G-FEMALE-SIMILAR-OLDER, G-YOUNGER | TC-XH-01/02/03/04 | Ngưỡng tuổi chỉ là mô hình đề xuất |
| Quy tắc suy ra | G-SIMILAR, G-MALE-OLDER, G-FEMALE-OLDER | Suy ra; thiếu ca riêng được nhóm duyệt | Cần nguồn và ca kiểm thử trước xác nhận |

TC-XH-15 là fallback hỏi làm rõ, không phải một quy tắc xưng hô xác định. Không đổi `verified` chỉ vì test xanh.

## Ghi chú văn hóa

Nguồn code: `packages/ai-service-facade/src/scripts.ts` (SCRIPTS và CULTURAL_NOTES).

| Nội dung mẫu hiện tại | Ngữ cảnh hiện có | Điểm cần xác minh |
|---|---|---|
| Handing over money: đưa tiền bằng hai tay hoặc tay phải được tay trái đỡ | Thuê nhà, chợ, ăn uống, ngân hàng | Không biến cách biểu thị lịch sự thành quy tắc tuyệt đối; cần nguồn và người đối chiếu |
| Polite invitations: “Ăn cơm chưa?” có thể là lời chào; từ chối bằng lời cảm ơn | Hàng xóm | Phân biệt lời chào với lời mời thực; diễn đạt tùy hoàn cảnh |
| Wedding gifts: tiền trong thiệp/phong bì thay quà gói | Đám cưới | Khác biệt vùng miền/gia đình và loại sự kiện |

CUL-02 (nhận quà) và CUL-03 (từ chối lời mời) trong Test Strategy chưa có bộ ca độc lập đủ bằng chứng. Không mở rộng nội dung văn hóa khi chưa có nguồn được duyệt.

## Danh mục tình huống

8 tình huống còn `status: draft`. Tuổi nhân vật, mục tiêu, giá tiền, thủ tục và lời thoại là dữ liệu đóng vai. Các ví dụ về bệnh viện, visa, ngân hàng không được trình bày như hướng dẫn y tế/pháp lý/tài chính thật. Mock trả lời theo lượt, không hiểu mọi câu tự do; adapter LLM là lựa chọn riêng qua Facade.

## Mẫu ghi nhận duyệt

Mỗi mục cần: ID, nội dung được chấp nhận/sửa, nguồn cụ thể (tên và trang/URL), người đối chiếu, ngày đối chiếu, phạm vi áp dụng. Sau đó tạo task cập nhật dữ liệu/test; chưa có đủ thông tin thì giữ `unverified`/`draft` và không nghiệm thu nội dung.
