# Bản xác nhận mục tiêu: Tinh gọn tiêu đề và loại bỏ mô tả phụ (Header Clean & Title Synchronization)

## 1. Thông tin chung
* **Ngày tạo:** 2026-11-21
* **Trạng thái:** Đã xác nhận (Confirmed)

## 2. Tuyên bố mục tiêu (Statement of Intent)
* **Outcome:** Loại bỏ toàn bộ các dòng mô tả phụ dài dòng dưới tiêu đề (H1) và rút gọn tiêu đề trang cho ngắn gọn, đồng nhất chính xác với nhãn menu thanh điều hướng trên toàn bộ 3 không gian (**Tổ chức**, **Cá nhân**, **Admin**).
* **User:** Người học, Quản lý tổ chức và Quản trị viên hệ thống có giao diện thoáng sạch, chuẩn SaaS chuyên nghiệp (Operate mode), tập trung vào thao tác chính mà không bị phân tán.
* **Why now:** Khắc phục tình trạng các trang còn nhiều câu mô tả hiển nhiên thừa thãi và tiêu đề H1 chưa đồng nhất với Sidebar (ví dụ: *"Quản lý Đề khảo thí"* vs *"Kho đề thi"*).
* **Success Criteria:**
  1. Xóa bỏ toàn bộ các thẻ `<p>` mô tả phụ bên dưới tiêu đề trang tại các trang chính của Organization, Personal và Admin.
  2. Chuẩn hóa tiêu đề H1 ngắn gọn, khớp 1:1 với nhãn Sidebar (ví dụ: *"Kho đề thi"*, *"Chấm bài"*, *"Thành viên"*, *"Phòng thi trực tiếp"*, v.v.).
  3. Bố cục Header gọn gàng, giữ nguyên Breadcrumb và các nút bấm thao tác (Action Buttons).
  4. Tuân thủ tuyệt đối quy tắc UI của dự án: không dùng `<hr>`, thay `&` thành `và`.
  5. Đạt kiểm tra kiểu dữ liệu (`tsc --noEmit`) 100% không lỗi.
* **Constraint:** Giữ nguyên logic xử lý, router, quyền truy cập và dữ liệu hiển thị.
* **Out of scope:** Không thay đổi cấu trúc bảng/card nội dung phía dưới, không can thiệp API backend.
