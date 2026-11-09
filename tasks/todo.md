# Danh Sách Nhiệm Vụ Triển Khai: Tái Cấu Trúc Không Gian Tổ Chức Tinh Gọn (Phương Án A)

## Slice 1: Dọn Dẹp Trang Thừa & Tinh Gọn Sidebar / Menu
- [x] **Task 1.1: Xóa mục "Tổ chức của tôi" trên PersonalSidebar**
  - **Mô tả:** Trong `PersonalSidebar.tsx`, đưa `workNavItems` về 2 mục tiêu chuẩn: `Lớp & Nhóm` và `Bài được giao`.
  - **Chấp nhận:** Sidebar cá nhân chỉ hiển thị `Lớp & Nhóm` và `Bài được giao`, không còn mục trang thừa.
- [x] **Task 1.2: Xóa mục "Tổ chức của tôi" trên PersonalAvatarMenu**
  - **Mô tả:** Trong `PersonalAvatarMenu.tsx`, xóa bỏ dòng link dẫn đến `/personal/organizations`.
  - **Chấp nhận:** Menu Avatar không còn dòng link dư thừa này.
- [x] **Task 1.3: Chuyển hướng an toàn `/personal/organizations` về `/personal/groups`**
  - **Mô tả:** Đổi `src/app/(dashboard)/personal/organizations/page.tsx` thành server component thực hiện `redirect('/personal/groups')`.
  - **Chấp nhận:** Bất kỳ truy cập nào vào `/personal/organizations` đều tự động chuyển về `/personal/groups`.

---

## Slice 2: Tích Hợp Quản Lý Tổ Chức Trực Thuộc Vào `personal/groups`
- [x] **Task 2.1: Thêm Banner hiển thị Tổ chức trực thuộc tại `personal/groups`**
  - **Mô tả:** Nếu học viên thuộc tổ chức (như Trường FPT Polytechnic), hiển thị 1 banner tinh gọn ở đầu: Tên trường, Mã đơn vị, huy hiệu Thành viên chính thức.
  - **Chấp nhận:** Học viên biết rõ mình đang thuộc trường nào ngay trong không gian lớp học.
- [x] **Task 2.2: Bổ sung nút "Tham gia tổ chức" trên thanh công cụ**
  - **Mô tả:** Thêm nút mở `JoinOrgModal` (đã tinh gọn 1-step, chỉ 1 ô nhập mã) ngay cạnh nút "Tham gia lớp bằng mã".
  - **Chấp nhận:** Học viên có thể gia nhập trường nhanh chóng từ trang Lớp & Nhóm.

---

## Slice 3: Tinh Chỉnh Menu Avatar Chuẩn Vai Trò
- [x] **Task 3.1: Hoàn thiện AvatarWorkspaceSection**
  - **Mô tả:** Đảm bảo với Quản lý (Owner/Admin/Assessor) thì hiện nút chuyển sang `/org/[slug]` kèm nhãn vai trò chính xác ("Chủ sở hữu", "Quản trị viên", "Khảo thí viên"); với Member thì hiện thông tin trực thuộc và nút "+ Tham gia tổ chức khác" (mở modal trực tiếp).
  - **Chấp nhận:** Menu Avatar chuẩn xác theo vai trò, không có link rác.

---

## Slice 4: Kiểm Thử & Hoàn Thiện Luồng Admin B2B (`/admin/organizations`)
- [x] **Task 4.1: Sửa email typo và kích hoạt tổ chức HUY cho Bồng Bình**
  - **Mô tả:** Cập nhật email `minhhuy868762@gmai.com` thành `minhhuy868762@gmail.com` trong DB; kích hoạt `Tổ chức của Huy` (HUY) gán quyền `ORG_OWNER` cho Bồng Bình.
  - **Chấp nhận:** Bảng `organizations` có trạng thái `ACTIVE` cho HUY, Bồng Bình nhận quyền Owner và chuyển được sang `/org/huy`.
- [x] **Task 4.2: Kiểm thử toàn diện End-to-End**
  - **Mô tả:** Kiểm tra các luồng:
    1. Sidebar & Menu sạch sẽ, không trang thừa.
    2. Vào `personal/groups` thấy trường trực thuộc và các lớp.
    3. Thử nghiệm nút Tham gia trường bằng mã.
    4. Thử nghiệm tài khoản Owner chuyển đổi workspace sang Dashboard tổ chức.
  - **Chấp nhận:** Toàn bộ hệ thống vận hành trơn tru 100%.
