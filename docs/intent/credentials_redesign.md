# BẢN ĐẶC TẢ THIẾT KẾ: VĂN BẰNG & CỔNG ĐỐI SOÁT CHỨNG CHỈ SỐ NEXA AI (V7 - Tối Ưu Hóa Tinh Gọn Văn Bản)

## 1. Tinh gọn văn bản trang Quản trị Admin (`/admin/credentials`)
- **Mô tả trang:** Rút gọn từ `Quản lý chứng nhận năng lực số, đối soát mã băm SHA-256 và xử lý thu hồi.` thành: **`Quản lý chứng nhận năng lực số.`**
- **Tiêu đề khung Preview:** Rút gọn từ `Xem trước phôi chứng chỉ trực tiếp (Live Preview)` thành: **`Xem trước phôi chứng chỉ trực tiếp`** (bỏ chữ `(Live Preview)`).
- **Ghi chú dưới chân phôi:** Đã xóa bỏ hoàn toàn dòng mô tả dài `Phôi văn bằng chuẩn tiếng Anh quốc tế, đồng bộ theo thời gian thực khi bạn chỉnh sửa thông số bên trái.`.

---

## 2. Tinh gọn Modal Xem trước phôi trang Cá nhân (`/personal/credentials`)
- **Tiêu đề Modal:** Rút gọn thành **`Phôi chứng chỉ mẫu`** (đã bỏ chữ `Mẫu Chuẩn Hóa` và bỏ dòng mô tả phụ `Mẫu phôi văn bằng số chính thức do Hội đồng Khảo thí NEXA AI phát hành`).
- **Loại bỏ 3 card giải thích dư thừa:** Đã xóa bỏ hoàn toàn 3 khối card phía dưới (Mộc đỏ & Chữ ký số, Không thời hạn Lifetime, Xác thực SHA-256 kép), giúp người dùng khi mở Modal chỉ tập trung trọn vẹn vào trải nghiệm phôi chứng chỉ sang trọng, tinh tế.

---

## 3. Hệ thống Viền Hoàng Gia & Auto-Scaling Canvas
- **Khung viền đôi mạ vàng thanh mảnh:** Hai đường viền vàng kim (`#C5A059` & `#D4AF37`) chạy bao quanh kết nối mượt mà với 4 hoa văn góc vintage mạ vàng.
- **Hero Name (Tâm điểm học viên):** Cỡ chữ thư pháp Alex Brush **`64px`**, sải rộng 65% bề ngang chứng chỉ.
- **Đoạn văn công nhận:** Trải rộng **680px**, dòng chữ dàn đều sang hai bên đầy đặn.
- **Chân chứng chỉ:**
  - Bên trái: Mã QR **80px** viền vàng kim đôi + nhãn `CREDENTIAL ID` và mã ngắn gọn `XXXXXX` (đã bỏ chữ Scan QR và bỏ tiền tố CERT-2026).
  - Giữa: Hai viên thuốc `Issue Date: October 15, 2026` và `Validity: Lifetime` (đã bỏ chữ trong ngoặc).
  - Bên phải: Chữ ký thư pháp + Con dấu mộc đỏ vector SVG 96px đóng đè 1/3, nằm hoàn toàn trên nền trắng sáng.
