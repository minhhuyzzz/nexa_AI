# Kế Hoạch Triển Khai: Đơn Giản Hóa Trải Nghiệm Live Room & Sửa Lỗi Sảnh Chờ / Chọn Đề

> **Căn cứ yêu cầu người dùng:**
> 1. Trải nghiệm mở phòng Live cần đơn giản, trực quan như Quizizz/Kahoot: Chọn đề -> Mở phòng vào sảnh chờ ngay. Không bắt qua Bước 2 điền form ngày giờ rườm rà.
> 2. Bỏ bộ lọc thời lượng kỳ cục (15p, 30p, 45p, 60p+).
> 3. Sửa triệt để bug: Chọn đề của tôi nhưng lại nhảy sang đề hệ thống chuẩn 5 miền.
> 4. Toàn bộ cài đặt phòng (thời gian làm bài tùy chỉnh, chọn theme giao diện, quy chế làm bài) nằm ngay tại Sảnh Chờ (Lobby) trước khi Host bấm phát đề thi.
> 5. Sảnh chờ có nút [ ← Quay lại ] về danh sách phòng, và danh sách phòng có nút [ Vào lại phòng ] để tiếp tục sảnh chờ.
> 6. Sửa lỗi vỡ cột bảng danh sách phòng ở `/personal/live-room` (chữ bị ngắt dòng dọc từng ký tự).
> 7. Phong cách thiết kế: Industrial Brutalism & Swiss typographic print (chắc chắn, rõ ràng, tối ưu trải nghiệm).

---

## 1. Bản Đồ Phụ Thuộc (Dependency Graph)

```
CreateLiveRoomWizardView.tsx (Chọn đề -> Mở phòng tức thì, bỏ Bước 2 & bỏ lọc thời lượng)
   │
   ├── LiveRoomControlPage (/live/control - Sảnh chờ Lobby có nút Quay lại, Panel Setup thời gian/theme/quy chế)
   │
   └── PersonalLiveRoomDashboardView.tsx (/personal/live-room - Sửa vỡ cột bảng, tính đúng KPI, nút "Vào lại phòng")
```

---

## 2. Kế Hoạch Nhiệm Vụ Chi Tiết

### Task 1: Sửa bug chọn đề & Tinh giản quy trình tạo phòng (`CreateLiveRoomWizardView.tsx`)
- Bỏ bộ lọc thời lượng dropdown (15p, 30p, 45p...).
- Bỏ hoàn toàn Bước 2 form ngày giờ phức tạp; quy trình trở thành 1 bước: **Chọn đề & Tinh chỉnh nhanh thời gian -> [ 🚀 Mở phòng thi ngay ]**.
- Sửa dependency array và logic state để không bao giờ bị nhảy đề hay fallback nhầm đề.
- Chuyển hướng ngay sang `/live/control?roomId=...` sau khi bấm mở phòng.

### Task 2: Nâng cấp Sảnh Chờ Khảo Thí (`src/app/live/control/page.tsx`) theo chuẩn Quizizz
- Thêm nút **[ ← Quay lại danh sách ]** rõ ràng ở góc trên bên trái.
- Tích hợp **Panel Cài Đặt Sảnh Chờ (Lobby Settings)** trực tiếp trước khi bắt đầu:
  * Cho phép chỉnh thời lượng làm bài tùy ý (ô nhập số phút tự do + nút chọn nhanh).
  * Bộ chọn Chủ đề giao diện (Theme Selector): Minimal White, Space Blue, Cyber Aurora, Dark Professional.
  * Toggles quy chế: Tự động nộp bài khi hết giờ, Khóa vào muộn sau khi bắt đầu, Âm thanh thông báo.
- Nút CTA trung tâm lớn: **`[ 🚀 Bắt đầu phát đề thi ]`** áp dụng các cài đặt và kích hoạt làm bài.

### Task 3: Sửa lỗi vỡ layout bảng và KPI (`PersonalLiveRoomDashboardView.tsx`)
- Sửa CSS bảng: áp dụng `min-width` cố định và `truncate` chuẩn xác cho các cột Tên phòng và Đề khảo thí, xóa bỏ hoàn toàn tình trạng chữ bị bẻ dọc từng ký tự.
- Sửa lại tính toán 3 thẻ KPI: đếm chính xác số phòng `WAITING` vào thẻ Sắp diễn ra/Phòng chờ.
- Đảm bảo các phòng ở trạng thái `WAITING` có nút rõ ràng: **`[ Vào lại phòng ]`** dẫn tới `/live/control?roomId=...`.

### Task 4: Kiểm thử toàn diện & Xác nhận
- Chạy `npx tsc --noEmit` (đảm bảo 0 lỗi biên dịch).
- Chạy `npx vitest run` (đảm bảo 100% test pass).
