# NEXA SaaS Business v3.0 — Bộ bàn giao mô hình sản phẩm và UI

## Nội dung

1. `NEXA_PRODUCT_MODEL_BUSINESS_V3.md` — tài liệu chuẩn mô hình sản phẩm (31+ mục/phần, luồng đăng ký → kích hoạt → gia hạn, quyền, điều hướng, DB/API và nghiệm thu).
2. `NEXA_SAAS_BUSINESS_V3_PROTOTYPE.html` — prototype có tương tác, **mặc định nền trắng**, không phụ thuộc Internet.
3. `NEXA_BUSINESS_V3_CONTACT_SHEET.png` — ảnh tổng hợp 6 trạng thái quan trọng.
4. Các ảnh PNG riêng — overview, thành viên, gói và gia hạn, NEXA Admin, form kích hoạt và Personal.

## Cách xem

Mở file `.html` bằng Chrome/Edge. Menu bên trái dùng chuyển các trang Organization. Click avatar phía trên phải để chuyển mô phỏng **Organization / Personal / NEXA Platform Admin**. Ở trang **Gói Business**, bấm **Gia hạn gói** để xem form và thử trạng thái chờ. Ở màn hình **Yêu cầu Business** của Platform Admin, bấm **Kích hoạt** ở một yêu cầu.

## Điều cần lưu ý

- Bản prototype dùng **dữ liệu minh họa**, không kết nối API và không ghi database.
- Các thao tác thử chỉ thay đổi trạng thái trong bộ nhớ trình duyệt, tải lại trang sẽ reset.
- Không có tính năng thanh toán Business thật trong prototype; Gia hạn mô phỏng **gửi yêu cầu gia hạn đến NEXA**, không giả vờ thanh toán thành công.
- Không có bước ký hợp đồng bắt buộc.
- Không sửa hoặc push repository trong quá trình thực hiện bộ thiết kế.
- Tài liệu `.md` là nguồn tham chiếu khi thiết kế migration, backend, phân quyền và UI thực tế.
