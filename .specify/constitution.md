# Constitution
1. React và react-dom là singleton qua Module Federation; không remote nào tự bundle bản riêng.
2. Mỗi Remote chạy độc lập; không import chéo giữa các remote. Giao tiếp qua event bus / shared store ở host.
3. Không CSS toàn cục; dùng Tailwind có scope hoặc CSS Modules.
4. Mọi lời gọi LLM và Web Speech phải đi qua packages/ai-facade. Cấm gọi trực tiếp từ UI.
5. Mỗi Remote bọc Error Boundary; lỗi một remote không làm sập host.
6. TypeScript strict; không dùng `any` nếu chưa có lý do ghi chú.
7. Dữ liệu xưng hô/văn hóa nằm trong packages/content, có test đi kèm; không hard-code trong component.
8. Chỉ làm tính năng thuộc spec đang thực hiện; ưu tiên Core, không tự thêm Should-have/Nice-to-have.
9. Mỗi task = 1 commit nhỏ, thông điệp theo Conventional Commits; mỗi spec = 1 branch.