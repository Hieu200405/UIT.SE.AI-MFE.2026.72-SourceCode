# Nguồn tham khảo và đối chiếu nội dung chờ duyệt

Ngày tra cứu: 2026-11-11. Task T207. Người soạn đối chiếu: Codex; người duyệt nội dung: **chưa xác nhận**. Đây là đề xuất biên tập để người dùng duyệt, chưa sửa rules.json/scripts.ts và chưa đổi bất kỳ cờ verified nào.

## Nguồn đã đọc và giới hạn sử dụng

| Mã | Nguồn, vị trí kiểm tra | Có thể dùng để đối chiếu | Giới hạn |
|---|---|---|---|
| S1 | Northern Illinois University, SEAsite, [Lesson 1, B1](https://seasite.niu.edu/vietnamese/uniLesson1/L1_grammar.htm) | Cách gọi thầy/cô; các từ anh/chị/em | Bài học nhập môn, không phải bảng quyết định theo số tuổi |
| S2 | NIU, [Lesson 8, “Note on kin terms and personal reference”](https://seasite.niu.edu/vietnamese/uniLesson8/L8_grammar.htm) | Quan hệ ảnh hưởng xưng hô; ví dụ sinh viên xưng em hoặc tôi với giảng viên; bác với cha mẹ bạn; mình mang sắc thái thân mật | Nguồn có lỗi mã hóa/chính tả cũ; chỉ dùng đoạn đọc rõ, không suy ra ngưỡng tuổi |
| S3 | Vietnam Tourism, [Vietnamese etiquette for travellers, “Learn the correct salutations” và “Use your hands wisely”](https://vietnam.travel/things-to-do/vietnamese-etiquette-travellers/) | Cách gọi theo tuổi tương đối; trao đồ bằng tay phải hoặc hai tay | Hướng dẫn du lịch khái quát; khuyến nghị “bạn ơi” khi không chắc không đủ để áp dụng cho mọi người lớn tuổi |
| S4 | Nguyen, D. T. & Le Khac, C. (2021), [The Vietnamese greetings in Mekong Delta, Vietnam](https://sloap.org/journals/index.php/ijllc/article/view/1353), DOI 10.21744/ijllc.v7n2.1353; [PDF, tr. 85–86, §3.2](https://sloap.org/journals/index.php/ijllc/article/download/1353/1608/2089) | Nghiên cứu ghi nhận lời hỏi chuyện và lời mời có chức năng chào; có ví dụ hỏi về bữa ăn | Dữ liệu vùng Mekong; không đủ kết luận mọi lời mời đều xã giao hoặc phải từ chối |
| S5 | Peter Cowan (04/04/2019), Việt Nam News, [A survival guide for Vietnamese weddings, “Gifts”](https://vietnamnews.vn/life-style/expat-corner/518325/expat-corner-a-survival-guide-for-vietnamese-weddings.html) | Mô tả khách mừng cưới bằng tiền trong phong bì | Chuyên mục trải nghiệm, không phải quy phạm; không lấy khuyến nghị số tiền/trang phục/đồ uống của bài làm luật |
| S6 | Sidnell, J. & Shohet, M. (2013), [The problem of peers in Vietnamese interaction](https://doi.org/10.1111/1467-9655.12053), JRAI 19(3), 618–638, **Abstract** | Người ngang hàng có nhiều cách gọi, kể cả tên riêng; tuổi không phải cơ chế duy nhất | Chỉ dùng abstract đã truy cập; không tuyên bố đã đọc toàn bài hoặc bài xác nhận riêng cặp mình–bạn |
| S7 | BS Hồ Mạnh Tường (01/03/2025), Tuổi Trẻ, [Cách xưng hô với bác sĩ, trong góc nhìn của bác sĩ](https://tuoitre.vn/cach-xung-ho-voi-bac-si-trong-goc-nhin-cua-bac-si-20250228103307262.htm), mục gọi bác sĩ là “bác” | Góc nhìn người trong nghề về danh xưng bác sĩ và sự tôn trọng | Ý kiến tác giả, không đại diện mọi bác sĩ; không chứng minh “tôi” luôn phù hợp |

Không lấy snippet tìm kiếm làm bằng chứng duyệt. Bài Vietnam Airlines về đám cưới xuất hiện trong kết quả nhưng URL trả 404 khi mở, nên không dùng làm nguồn quyết định. Bảng NIU pronounA có lỗi mã hóa, không dùng để xác nhận từ tiếng Việt. Không dùng Reddit/blog tổng hợp làm nguồn chuẩn.

## Cách đọc bảng

“Một phần” nghĩa là nguồn hỗ trợ nguyên tắc/từ gọi nhưng **chưa xác nhận toàn bộ predicate và output của rule**. “Thiết kế sản phẩm” là cách xử lý thiếu dữ kiện do nhóm quyết định, không phải một quy luật văn hóa tìm được trên web. Các nhận xét và câu đề xuất dưới đây là phân tích của người soạn từ nguồn và code, chưa phải kết luận của người duyệt.

## Đối chiếu đủ 18 rule

| Rule ID | Output hiện tại | Nguồn / mức hỗ trợ | Đề xuất để duyệt |
|---|---|---|---|
| R-LECT-M | thầy/em | [S1](https://seasite.niu.edu/vietnamese/uniLesson1/L1_grammar.htm), [S2](https://seasite.niu.edu/vietnamese/uniLesson8/L8_grammar.htm): một phần | Giữ mẫu cho sinh viên trong bối cảnh đã chốt; lời giải thích tránh bắt buộc mọi người học xưng em |
| R-LECT-F | cô/em | S1, S2: một phần | Cùng giới hạn trên; xét thêm người học lớn tuổi hơn giảng viên |
| R-LECT-UNK | hỏi nam hay nữ | S1 hỗ trợ phân biệt từ gọi; câu hỏi là thiết kế sản phẩm | Đề xuất hỏi “Người dạy muốn được gọi như thế nào?”; không bắt buộc khai báo nhị nguyên để tiếp tục |
| R-DOCTOR | bác sĩ/tôi; em tùy tuổi | [S7](https://tuoitre.vn/cach-xung-ho-voi-bac-si-trong-goc-nhin-cua-bac-si-20250228103307262.htm): một phần | Giữ danh xưng nghề; thay khẳng định “safe self-term” bằng mẫu hội thoại có điều kiện; cần người duyệt cách tự xưng |
| R-ELDER-NEIGHBOR-M | bác/cháu | S2: một phần | Tách điều kiện “hơn tuổi cha mẹ” khỏi much_older; chưa duyệt cách biến chênh 20 tuổi thành bác |
| R-FRIEND-MOTHER | cô/cháu; bác thay thế | S2: một phần | Giữ nhiều lựa chọn; hỏi người bạn/gia đình muốn được gọi thế nào; không mặc định cô cho mọi mẹ của bạn |
| R-FRIEND-YOUNGER-SIB | em; anh/chị theo người học | S2: một phần | “Em trai của bạn” không bảo đảm nhỏ hơn người học; phải kiểm tra tuổi tương đối. Giữ không suy đoán giới người học |
| R-CLINIC-PHONE | không gọi đối phương; xưng tôi | Thiết kế sản phẩm; S1 chỉ hỗ trợ tôi là từ tự xưng | Mẫu “Xin chào, tôi muốn đặt lịch khám…” giữ như câu mẫu, không coi là quy tắc phổ quát |
| R-CUSTOMER-UNK | call=null, ví dụ có “bạn” | Thiết kế sản phẩm; mâu thuẫn nội bộ | Đề xuất “Xin chào, tôi có thể hỗ trợ gì ạ?”; mô tả “không chọn từ gọi đối phương”, không viết “không dùng đại từ” |
| R-PEER | bạn/mình; tớ–cậu | [S6](https://doi.org/10.1111/1467-9655.12053), S2: một phần | Giữ là gợi ý cho bối cảnh ngang hàng thân thiện; chưa đủ căn cứ cho tớ–cậu mọi vùng. Có thể tạm bỏ alternative này |
| R-COLLEAGUE | anh/chị–em | S3: một phần về tuổi; chưa xác nhận ngữ cảnh công sở | Giữ có điều kiện; chức danh và cách người đối diện tự giới thiệu có thể cần ưu tiên |
| G-FEMALE-MUCH-OLDER | cô/cháu | [S3](https://vietnam.travel/things-to-do/vietnamese-etiquette-travellers/): một phần | Đổi lời giải thích chắc chắn thành gợi ý; không áp dụng cho mọi thế hệ lớn tuổi hơn |
| G-MALE-MUCH-OLDER | chú/cháu; bác thay thế | S3, S2: một phần | Không duyệt “a lot older” như ranh giới đủ chọn bác; cần quan hệ/thế hệ hoặc hỏi lại |
| G-FEMALE-SIMILAR-OLDER | chị/em; bạn/mình hoặc lược bỏ | S3: một phần | Phải thể hiện nhánh “nếu lớn tuổi hơn”; không khẳng định người xấp xỉ tuổi chắc chắn lớn hơn |
| G-YOUNGER | em; anh/chị theo người học | S3, S2: một phần | Giữ điều kiện biết tuổi tương đối; bỏ/để trống tự xưng khi người học không cung cấp giới, như Constitution |
| G-SIMILAR | bạn/mình; anh/chị như lựa chọn lịch sự | S6: chỉ hỗ trợ tính đa dạng ở người ngang hàng | Bỏ hàm ý anh/chị luôn “trang trọng hơn”; giữ mẫu trong ngữ cảnh cụ thể, không làm fallback mọi quan hệ |
| G-MALE-OLDER | anh/em | S3: một phần | Hạn chế ở khoảng thế hệ phù hợp; ngưỡng số tuổi vẫn chưa có nguồn |
| G-FEMALE-OLDER | chị/em | S3: một phần | Cùng giới hạn trên; không suy rộng tới mọi người phụ nữ lớn tuổi hơn |

Các ô S1–S7 dẫn tới nguồn đầy đủ ở bảng đầu. Không rule nào được tự chuyển thành verified trong T207.

## Vấn đề thuật toán cần tách khỏi duyệt từ ngữ

`deriveRelativeAge` đang lấy tuổi đại diện 17/28/43/60 cho bốn khoảng rồi so chênh lệch tại 20, 8, 3, −2, −12. **Chưa tìm được nguồn được đọc ở trên xác nhận các con số này.** Đây là heuristic của code, không phải chuẩn ngôn ngữ. Sửa lời giải thích không đủ làm heuristic thành verified.

Đề xuất D1: ở demo nghiệm thu, dùng tuổi/quan hệ nhân vật cụ thể đã được người duyệt xem; biểu thị giả định của khoảng tuổi và cho hỏi lại khi không chắc. Giữ ngưỡng hiện tại chỉ trong thử nghiệm nội bộ cho tới khi có task điều chỉnh và ca hồi quy. Không tự thay ngưỡng bằng số khác.

Đề xuất D2: sửa R-FRIEND-YOUNGER-SIB để kiểm tra tuổi tương đối với **người học**, và sửa ví dụ R-CUSTOMER-UNK cho nhất quán. Chờ duyệt rồi tạo task dữ liệu/engine/test riêng.

Đề xuất D3: giảm khẳng định tuyệt đối trong lời giải thích, cho phép cách gọi mong muốn của người đối diện; các lựa chọn thiếu căn cứ tiếp tục chờ xác minh. Nguồn du lịch không được ghi đè yêu cầu tránh suy đoán của bộ TC-XH.

## Ba thẻ văn hóa đề xuất thay thế

Các câu tiếng Anh là bản biên tập cho UI để duyệt, không phải trích nguyên văn nguồn. Mỗi thẻ tiếp tục hiện Sample cho tới khi được phê duyệt và triển khai theo task.

### C1 — Handing over money

**Đề xuất:** “When handing over money, using both hands can be a considerate gesture. Customs vary with the situation and relationship.”

Căn cứ: S3 khuyến nghị cách trao đồ; áp dụng riêng cho tiền là suy luận của bản biên tập. Bỏ chi tiết tay trái đỡ tay phải vì chưa có căn cứ đủ rõ trong nguồn được chọn. Không dùng từ khóa “tiền” một mình để kết luận đang **trao tiền**: hỏi giá chưa chắc là ngữ cảnh phù hợp. [S3](https://vietnam.travel/things-to-do/vietnamese-etiquette-travellers/)

### C2 — Greetings and invitations

**Đề xuất:** “A question about whether you have eaten can be a friendly greeting. An invitation to come over may be genuine—listen to the context. If you cannot join, thank the host and decline politely.”

Căn cứ: S4 ghi nhận chào bằng lời hỏi và lời mời, gồm ví dụ bữa ăn tại tr. 86. Cảnh báo không mặc định lời mời là xã giao là giới hạn do bản biên tập đặt để tránh suy rộng. Code hiện nói cả “Qua nhà cô ăn cơm nhé”; không nên dạy người học rằng câu đó chắc chắn không phải lời mời thật. [S4](https://sloap.org/journals/index.php/ijllc/article/download/1353/1608/2089)

### C3 — Wedding gifts

**Đề xuất:** “Money in an envelope is a common wedding gift. Ask the couple or someone close to the family about their preferences.”

Căn cứ: S5 mô tả quà tiền/phong bì. Câu hỏi sở thích gia đình là đề xuất giao tiếp của bản biên tập. Không quy định số tiền, màu phong bì hay cấm quà hiện vật. Chỉ áp dụng đám cưới, không suy ra nghi lễ đám giỗ. [S5](https://vietnamnews.vn/life-style/expat-corner/518325/expat-corner-a-survival-guide-for-vietnamese-weddings.html)

Đề xuất D4: duyệt C1–C3 làm nội dung để triển khai, cùng giới hạn nguồn và trigger. CUL-02 nhận quà chưa có thẻ riêng được đối chiếu; không đánh dấu đã được phủ bằng thẻ quà cưới. CUL-03 từ chối lời mời cần ca riêng với C2 sau khi duyệt.

## Quyết định cần người dùng ghi nhận

- D1: không coi ngưỡng tuổi heuristic là kiến thức đã kiểm chứng; demo chỉ dùng ngữ cảnh đã duyệt.
- D2: sửa hai điểm không nhất quán về tuổi người học và mẫu khách hàng.
- D3: lời giải thích có điều kiện, không ép đại từ/giới tính khi chưa đủ dữ kiện.
- D4: chấp nhận hoặc chỉnh ba bản thảo C1–C3 và giới hạn ngữ cảnh.

Mẫu trả lời: “D1…D4: đồng ý / sửa mục …; người đối chiếu: …; ngày: …”. Duyệt hướng sửa không đồng nghĩa mọi rule hiện có đã verified. Sau khi có phản hồi, tạo task thực thi theo từng mục và chạy lại bộ TC-XH/contract/Facade/UI liên quan.
