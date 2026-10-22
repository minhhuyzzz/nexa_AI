# DỮ LIỆU HẠT GIỐNG CHUẨN HÓA (MASTER SEED DATA CONTENT)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

Tài liệu này cung cấp bộ dữ liệu thực tế ban đầu để nạp vào tệp `supabase/seed.sql`, giúp hệ thống ngay sau khi khởi chạy đã có sẵn: **Khung năng lực số chuẩn**, **Gói dịch vụ B2C/B2B**, **Hệ thống Rank/Huy hiệu**, **Kho học liệu chuẩn**, và **Bộ đề đánh giá mẫu đủ 4 hình thức câu hỏi**.

---

## 1. DỮ LIỆU KHUNG NĂNG LỰC SỐ CHUẨN MẶC ĐỊNH (5 MIỀN & 21 KỸ NĂNG)

- **Bản ghi `assessment_frameworks` mặc định:**
  - `code`: `'NEXA_CORE_FRAMEWORK_V1'`
  - `title`: `'Khung Năng lực Số Chuẩn Toàn diện'`
  - `version`: `'1.0'`
  - `status`: `'ACTIVE'`

### Bảng 5 Miền Năng lực (`competency_domains`) & 21 Kỹ năng Thành phần (`competencies`)

| Miền (`domain_index`) | Mã kỹ năng (`skill_code`) | Tên Kỹ năng Thành phần (`title`) | Trọng tâm Đo lường & Chỉ báo Hành vi (`behavioral_indicators` cho AI) |
| :-: | :-: | :--- | :--- |
| **Miền 01: Thông tin và Dữ liệu số** *(20%)* | `1.1` | Tìm kiếm, duyệt và lọc dữ liệu số | Xác định nhu cầu thông tin, sử dụng truy vấn tìm kiếm nâng cao, lọc kết quả chính xác. |
| | `1.2` | Đánh giá độ tin cậy của dữ liệu và thông tin số | Kiểm chứng nguồn tin, phân biệt tin giả/tin do AI tạo sai lệch (hallucination), đối chiếu đa nguồn. |
| | `1.3` | Quản lý, lưu trữ và truy xuất dữ liệu số | Tổ chức cây thư mục khoa học, sao lưu đám mây ( quy tắc 3-2-1), chuẩn hóa tên tệp và cấu trúc dữ liệu. |
| **Miền 02: Giao tiếp và Cộng tác số** *(20%)* | `2.1` | Tương tác qua các công nghệ số | Lựa chọn kênh giao tiếp số phù hợp với ngữ cảnh công việc (Email, Chat, Video Conference). |
| | `2.2` | Chia sẻ thông tin và nội dung số an toàn | Phân quyền chia sẻ tài liệu đám mây đúng vai trò (Viewer/Commenter/Editor), trích dẫn nguồn rõ ràng. |
| | `2.3` | Tham gia dịch vụ công và trách nhiệm công dân số | Sử dụng dịch vụ số trực tuyến, định danh điện tử và tuân thủ quy định pháp luật trên không gian mạng. |
| | `2.4` | Hợp tác và làm việc nhóm trên nền tảng số | Sử dụng công cụ quản lý dự án, đồng biên tập tài liệu thời gian thực và kiểm soát lịch sử phiên bản. |
| | `2.5` | Chuẩn mực ứng xử và giao tiếp số (Netiquette) | Viết thông điệp chuyên nghiệp, tôn trọng sự khác biệt, xử lý xung đột văn minh trên môi trường số. |
| | `2.6` | Quản lý danh tính và dấu vết số cá nhân | Kiểm soát thông tin công khai, bảo vệ uy tín nghề nghiệp và quản lý dấu vết dữ liệu (Digital Footprint). |
| **Miền 03: Sáng tạo Nội dung số & AI** *(20%)* | `3.1` | Phát triển nội dung số đa định dạng | Tạo văn bản, bảng biểu, bài trình chiếu, sơ đồ trực quan và nội dung đa phương tiện chuẩn mực. |
| | `3.2` | Tích hợp, biên tập và cộng tác cùng AI tạo sinh | Thiết kế câu lệnh (Prompt Engineering) hiệu quả, tinh chỉnh và kiểm chứng đầu ra do AI sinh ra. |
| | `3.3` | Bản quyền, giấy phép số và đạo đức sử dụng AI | Phân biệt các giấy phép Creative Commons, nguồn mở, tôn trọng sở hữu trí tuệ và minh bạch khi dùng AI. |
| | `3.4` | Tư duy thuật toán và tự động hóa quy trình | Phân rã bài toán thành các bước logic, thiết lập quy tắc tự động hóa công việc lặp lại hoặc viết script/hàm. |
| **Miền 04: An toàn và Sức khỏe số** *(20%)* | `4.1` | Bảo vệ thiết bị và hạ tầng kết nối | Thiết lập mật khẩu mạnh, xác thực đa yếu tố (2FA/MFA), cập nhật bản vá bảo mật và phòng chống mã độc. |
| | `4.2` | Bảo vệ dữ liệu cá nhân và quyền riêng tư | Nhận diện tấn công lừa đảo (Phishing/Social Engineering), mã hóa dữ liệu nhạy cảm và tuân thủ Nghị định 13. |
| | `4.3` | Bảo vệ sức khỏe thể chất và tâm lý số | Cân bằng thời gian sử dụng màn hình, công thái học làm việc và phòng tránh quá tải thông tin. |
| | `4.4` | Sử dụng công nghệ số bền vững với môi trường | Tối ưu hóa lưu trữ đám mây, giảm rác thải dữ liệu và tiết kiệm năng lượng thiết bị số. |
| **Miền 05: Giải quyết Vấn đề số** *(20%)* | `5.1` | Xác định và khắc phục sự cố kỹ thuật | Chẩn đoán nguyên nhân lỗi phần mềm, kết nối mạng hoặc thiết bị và tìm giải pháp xử lý hiệu quả. |
| | `5.2` | Xác định nhu cầu và lựa chọn công cụ công nghệ | Đánh giá ưu/nhược điểm và chọn đúng phần mềm, công cụ số hoặc mô hình AI phù hợp cho bài toán thực tế. |
| | `5.3` | Ứng dụng sáng tạo công nghệ số vào giải quyết vấn đề | Kết hợp dữ liệu và các công cụ số để tối ưu hóa quy trình học tập, nghiên cứu hoặc vận hành công việc. |
| | `5.4` | Tự nhận diện khoảng trống năng lực số và học tập liên tục | Biết tự đánh giá điểm yếu kỹ năng số của bản thân và chủ động cập nhật công nghệ mới. |

---
