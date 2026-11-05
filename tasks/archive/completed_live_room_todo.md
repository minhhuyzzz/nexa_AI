Created At: 2026-11-04T21:59:47+07:00
Completed At: 2026-11-04T22:15:00+07:00

# Tasks To-Do: Nâng Cấp Hệ Thống Phòng Thi Trực Tiếp (Live Exam Room Arena)

## Phase 1: Dashboard Điều Phối Tổ Chức (Org Live Dashboard - Chuẩn Ảnh 5)
- [x] Task 1.1: Tái cấu trúc Header & 4 Thẻ KPI điều phối phòng thi tổ chức (`/org/[slug]/live-room`)
- [x] Task 1.2: Xây dựng Thanh Tab trạng thái có đếm số lượng động & Toolbar tìm kiếm/bộ lọc
- [x] Task 1.3: Cải tạo Bảng danh sách phòng thi (hiển thị mã PIN dưới tên phòng, lớp phụ trách, nút thao tác Giám sát/Chi tiết/Kết quả)
- [x] Task 1.4: Tích hợp Cột phải (Khối tạo phòng nhanh 3 bước + Khối tính năng giám sát & chống gian lận)

## Phase 2: Dashboard Phòng Thi Cá Nhân (Personal Live Dashboard - Chuẩn Ảnh 1)
- [x] Task 2.1: Chuẩn hóa 3 thẻ KPI tinh gọn & Nút mở phòng mới (`/personal/live-room`)
- [x] Task 2.2: Tích hợp Bảng phòng thi cá nhân kèm Cột phải "Mẫu đề gần đây" & "Mẹo tạo phòng"

## Phase 3: Trình Tạo Phòng Thi Tương Tác Sống Động (Wizard Live Room Studio - Chuẩn Ảnh 2 & Mockup)
- [x] Task 3.1: Nâng cấp API nạp danh sách đề thi đảm bảo luôn có sẵn đề chuẩn hóa 5 miền năng lực số (không bao giờ để trống)
- [x] Task 3.2: Tái thiết kế Bước 1 (Bộ chọn đề dạng Card trực quan có số câu, thời lượng, thumbnail 5 miền)
- [x] Task 3.3: Tích hợp Sảnh chờ Xem trước (Live Room Arena Preview) với Mã PIN 6 số lớn, link nexa.ai/live và trạng thái phát đề
- [x] Task 3.4: Bổ sung cụm công tắc cấu hình nhanh (Khóa phòng sau khi bắt đầu, Bật bảng điểm realtime, Tự động nộp bài khi hết giờ)
- [x] Task 3.5: Giữ đúng ngữ cảnh Workspace khi mở từ Organization (giữ nguyên OrgSidebar/OrgTopbar, không nhảy văng sang Personal)

## Phase 4: Bàn Giám Sát Thời Gian Thực (Host Live Monitor - Chuẩn Ảnh 4)
- [x] Task 4.1: Bố cục 3 cột điều hành (Danh sách thí sinh | Sơ đồ bàn thi Seat Matrix & Dòng sự kiện | Cảnh báo & Điều khiển nhanh)
- [x] Task 4.2: Tích hợp các thao tác can thiệp: Gửi thông báo, Gia hạn 5 phút, Khóa bài thí sinh vi phạm, Mời giám thị phụ

## Phase 5: Kiểm Thử & Nghiệm Thu Kỹ Thuật
- [x] Task 5.1: Chạy `npx tsc --noEmit` đạt 0 lỗi biên dịch
- [x] Task 5.2: Chạy `npx vitest run` đảm bảo 100% test files passed (59/59 files, 409 tests passed)
- [x] Task 5.3: Kiểm tra tương thích Dark Mode & Light Mode chuẩn AGENTS.md
