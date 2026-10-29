# KẾ HOẠCH TỐI ƯU HÓA & KHÔI PHỤC DASHBOARD NGUYÊN BẢN CỦA NEXA AI

## Bối Cảnh & Vấn Đề
Người dùng đã rất ưng ý với giao diện Dashboard nguyên bản của `learner` (860 dòng code hoàn chỉnh gồm Chuỗi ngày học Streak, Cấp bậc năng lực số Level Modal, Điểm thưởng đăng nhập hàng ngày, Radar 5 Miền DigComp, Bài thi thực tế MCQ/Scenario/Thực hành, Bảng xếp hạng, Chứng chỉ số).
Việc tạo thêm thư mục mới `dashboard/` và `personal/` với giao diện tối giản đã làm mất đi trải nghiệm trực quan ban đầu người dùng thích, đồng thời sinh ra các component trùng lặp (`PersonalSidebar`, `PersonalTopbar`).

---

## Mục Tiêu & Giải Pháp
1. **Khôi phục 100% Giao Diện Dashboard Nguyên Bản**:
   - Sử dụng trực tiếp `LearnerDashboardPage` (toàn bộ logic streak, level modal, radar chart, bài khảo thí, leaderboard) làm trang tổng quan mặc định cho cả `/dashboard` và `/learner/dashboard`.
   - Giữ nguyên `LearnerSidebar` và `LearnerTopbar` làm shell chính thống của Không gian Cá nhân.

2. **Tích Hợp Tối Giản Vào Shell Hiện Có**:
   - Đặt `WorkspaceSwitcher` trực tiếp vào `LearnerTopbar`.
   - Bổ sung nhóm mục "Tạo đề & Nhóm" vào `LearnerSidebar` để người dùng cá nhân có thể tạo đề thi, mở phòng thi Live và quản lý lớp học trong hạn mức mà không bị mất bất kỳ mục học tập nào.

3. **Dọn Sạch Các File & Thư Mục Trùng Lặp**:
   - Xóa bỏ thư mục `src/components/dashboard/personal/` (`PersonalSidebar.tsx`, `PersonalTopbar.tsx`).
   - Chuẩn hóa `src/app/(dashboard)/dashboard/layout.tsx` và `page.tsx` sử dụng trực tiếp layout và view của `learner`.

4. **Tối Ưu & Dọn Dẹp CSDL (Supabase)**:
   - Dọn sạch bảng thừa `test_ping`.
   - Kiểm tra các bản ghi rác trong `organizations`, `user_organizations` đảm bảo tính toàn vẹn.

5. **Nghiệm Thu**:
   - Đảm bảo `npx tsc --noEmit` đạt 0 lỗi.
   - Toàn bộ 53 tests trong bộ vitest passed 100%.
   - `npm run build` thành công tuyệt đối (exit code 0).
