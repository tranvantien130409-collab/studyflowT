# Kế hoạch Tích hợp Gia sư T&T AI vào AI Assistant

Tích hợp **Gia sư T&T AI** thành trợ lý gia sư học tập toàn diện trực tiếp trong mục **AI Assistant**, loại bỏ giao diện carousel cũ của "Gia Sư các môn", tối ưu hóa giao diện tối giản tập trung cao độ vào khung chat giải đáp bài tập từng bước và công thức khoa học (LaTeX).

## Quyết định đã xác nhận với người dùng

> [!IMPORTANT]
> Dưới đây là các định hướng đã được xác nhận qua phần khảo sát:
> - **Vị trí**: Tích hợp thành trợ lý gia sư toàn diện trong AI Assistant (thay thế và nâng cấp tab "Gia Sư Các Môn" thành tab "Gia sư T&T AI").
> - **Tính năng trọng tâm**:
>   1. Giải đáp và hỗ trợ mọi môn học trong chương trình giáo dục phổ thông (Toán, Vật lý, Hóa học, Sinh học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lý, Tin học, GDCD).
>   2. Giải bài tập chi tiết từng bước, tự động định dạng công thức toán/lý/hóa chuẩn LaTeX ($...$ và $$...$$).
> - **Phong cách giao diện**: Giao diện tối giản, thanh lịch, tập trung vào khung chat hỏi đáp với trải nghiệm người dùng mượt mà, loại bỏ các chi tiết vụn vặt rườm rà.

---

## 1. Tổng quan & Mục tiêu

- **Mục tiêu**: Xóa bỏ thành phần "Gia Sư các môn" cũ (vốn sử dụng thanh carousel môn học kèm các thẻ số liệu rườm rà) và thay thế bằng phân hệ **Gia sư T&T AI** thông minh, hiện đại.
- **Trải nghiệm học tập**: Học sinh có thể nhanh chóng chọn hoặc chuyển đổi môn học cần hỗ trợ, nhập bài tập hoặc câu hỏi lý thuyết, và nhận ngay lời giải sư phạm chuẩn mực, phân tích phương pháp, bản chất kiến thức và các bước suy luận logic với công thức toán/lý/hóa hiển thị rõ ràng.

---

## 2. Thiết kế Giao diện & Trải nghiệm Người dùng (UX/UI)

### Bố cục & Giao diện Tối giản (Minimalist Focused Layout)
- **Header Gia sư T&T AI**:
  - Logo/Icon đại diện tinh tế cho Gia sư T&T AI với chỉ báo trạng thái sẵn sàng.
  - Tiêu đề "Gia sư T&T AI – Trợ lý Gia sư Học tập Toàn diện" và khẩu hiệu sư phạm ngắn gọn.
  - Nút làm mới đoạn chat (*Reset*) và tùy chọn chọn khối lớp (Lớp 10, 11, 12, hoặc THCS).
- **Bộ chọn Môn học Tinh gọn (Segmented Subject Selector)**:
  - Thay vì carousel cồng kềnh với nút cuộn trái/phải, thiết kế thanh chọn môn học dạng pill cuộn ngang mượt mà hoặc danh sách nhanh các môn trọng tâm (Tất cả môn, Toán, Lý, Hóa, Sinh, Văn, Anh, Sử, Địa, Tin).
- **Gợi ý Câu hỏi & Tác vụ Nhanh (Smart Prompt Suggestions)**:
  - Các nút gợi ý thông minh được cá nhân hóa theo từng môn học đã chọn (ví dụ: *Giải bài tập có công thức*, *Giải thích định lý & bản chất*, *Dàn ý bài văn nghị luận*, *Phân biệt ngữ pháp tiếng Anh*).
- **Khung Chat & Hiển thị Bài giải**:
  - Bong bóng tin nhắn AI và người dùng rộng rãi, tương phản chuẩn WCAG AA.
  - Tích hợp bộ giải mã Markdown, công thức toán KaTeX (`remark-math` + `rehype-katex`) hiển thị phương trình đẹp mắt.
  - Bộ công cụ tương tác trên tin nhắn: Sao chép lời giải nhanh, Đánh giá câu trả lời (Thích / Chưa thích), hiển thị nhãn môn học.
- **Thanh Nhập Liệu Thông Minh**:
  - Ô nhập liệu đa dòng co giãn hoặc input linh hoạt, phím tắt Enter gửi nhanh.
  - Hiển thị trạng thái đang xử lý suy luận của Gia sư T&T AI với hiệu ứng nhẹ nhàng, không gây giật lag.

---

## 3. Kiến trúc Kỹ thuật & Luồng Dữ liệu

```
┌────────────────────────────────────────────────────────┐
│              StudyFlow AI Assistant View               │
│                                                        │
│  [🌸 Tâm Lý]  [🎓 Gia sư T&T AI]  [🎬 Tóm Tắt]  [⚡ Quiz] │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────▼─────────────┐
               │  Gia sư T&T AI Container │
               │  - Subject Quick Selector│
               │  - Smart Fast Prompts    │
               │  - Minimalist Chat Flow  │
               └────────────┬─────────────┘
                            │
               ┌────────────▼─────────────┐
               │  Gemini AI API & Proxy   │
               │  (/api/ai/chatgpt)       │
               │  - System Prompt T&T AI  │
               │  - GDPT 2018 Standards   │
               │  - LaTeX Equation Engine │
               └──────────────────────────┘
```

### Các bước Triển khai Cụ thể:
1. **Dọn dẹp `AIHubView.tsx`**:
   - Loại bỏ các biến, hàm và carousel `TUTOR_SUBJECTS` cũ, các nhãn hiển thị rườm rà.
   - Cập nhật tab chuyển đổi sang **Gia sư T&T AI** với icon và định dạng nhận diện thương hiệu thống nhất.
2. **Xây dựng Giao diện Gia sư T&T AI Mới**:
   - Tối giản hóa bố cục, loại bỏ các nút cuộn ngang mũi tên và các thẻ số câu hỏi giả lập.
   - Bổ sung bộ chọn môn học nhanh tiện lợi (Toán học, Vật lý, Hóa học, Sinh học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lý, Tin học, Tất cả các môn).
   - Thiết lập các mẫu câu hỏi và bài tập thực tế thường gặp cho từng môn.
3. **Nâng cấp System Prompt cho Gia sư T&T AI**:
   - Tối ưu hóa prompt dành cho Gia sư T&T AI: chuyên sâu giải bài tập từng bước, giải thích bản chất, tự kiểm tra tính đúng đắn của công thức trước khi xuất ra, sử dụng chuẩn LaTeX $...$ và $$...$$.
4. **Kiểm thử & Biên dịch**:
   - Chạy `compile_applet` để đảm bảo không có lỗi TypeScript/Vite và kiểm tra trải nghiệm mượt mà trên cả giao diện sáng (light) và tối (dark).
