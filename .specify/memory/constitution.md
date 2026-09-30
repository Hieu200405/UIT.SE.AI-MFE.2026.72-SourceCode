# Constitution — VN Integration Platform

## Nguyên tắc kiến trúc
1. **Singleton React**: `react` và `react-dom` là singleton qua Module Federation; không remote nào tự bundle bản riêng.
2. **Remote độc lập**: không import chéo giữa các remote; giao tiếp qua event bus / shared store do host cung cấp.
3. **Cô lập style**: không CSS toàn cục; dùng Tailwind có scope hoặc CSS Modules.
4. **Chịu lỗi**: mỗi remote được bọc Error Boundary; lỗi một remote không được làm sập host.
5. **Một cổng AI**: mọi lời gọi LLM và Web Speech đi qua `packages/ai-facade`. UI không gọi trực tiếp.
6. **Dữ liệu tách khỏi code**: tình huống, quy tắc xưng hô, ghi chú văn hóa nằm trong `packages/content`, có test đi kèm; không hard-code trong component.

## Chất lượng
7. TypeScript strict; không dùng `any` nếu không có comment giải thích.
8. Mỗi task phải có kiểm chứng (test/lint/build) trước khi coi là xong.
9. Bộ kịch bản kiểm thử xưng hô (tối thiểu 15 ca) phải chạy lại sau mỗi thay đổi prompt hoặc dữ liệu quy tắc.

## Phạm vi và quy trình
10. Chỉ làm tính năng thuộc spec đang thực hiện; ưu tiên Core, không tự thêm Should-have/Nice-to-have.
11. Mỗi spec một branch; mỗi task một commit nhỏ (Conventional Commits). Không push thẳng `main`.
12. Mọi thay đổi yêu cầu đi theo chuỗi: spec → plan → tasks → code → test → review. Thay đổi lớn cần con người duyệt.

## Ràng buộc kỹ thuật
- Không tự huấn luyện mô hình; dùng LLM API bên thứ ba hoặc mock.
- Không tự xây STT/TTS; dùng Web Speech API (web) và API tương đương (mobile).

**Version**: 1.0 | **Ratified**: 2026-09-28
