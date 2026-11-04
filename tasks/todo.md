# Tasks To-Do: Chuẩn Hóa Toàn Diện Personal Workspace (`/personal/*`), Trang Giá & Bảng Xếp Hạng

## Phase 1: Bảo toàn Dữ liệu & An Toàn Bảo Mật (Foundation & Security)
- [x] Task 1: Xóa bỏ Chứng chỉ giả lập & Chuẩn hóa cấp phát chứng chỉ thật (`/api/credentials/[id]/pdf`, `credentials/page.tsx`, `MasterCertificateCard.tsx`)
- [x] Task 2: Chuẩn hóa Lịch tuần chuyên cần 7 ngày động theo ngày thực tế trên Dashboard (`dashboard/page.tsx`)
- [x] Checkpoint 1: Xác minh dữ liệu thật, chặn chứng chỉ khống và chạy test credentials

## Phase 2: Chuẩn hóa 5 Miền & Biểu đồ Radar (Competency & Radar Honesty)
- [x] Task 3: Xử lý trung thực `null` vs `0` trong `CompetencyRadarChart.tsx` & đổi token Cobalt Blue `#2563EB`
- [x] Task 4: Loại bỏ 21 kỹ năng thành phần & đồng nhất ngưỡng 70% tại `competency/page.tsx` và domain service
- [x] Checkpoint 2: Xác minh 5 miền năng lực không lộ sub-skills và radar chart không vẽ góc 0% giả

## Phase 3: Đồng bộ Phân hạng Gói & Điều hướng (Tiers & Navigation)
- [x] Task 5: Đổi triệt để nhãn "VIP" thành "PRO" trên Thư viện đề `assessments/page.tsx` và màn hình làm bài `take/[id]/page.tsx`
- [x] Task 6: Bổ sung link "Hồ sơ năng lực" trên `PersonalSidebar.tsx` và tạo redirect dọn dẹp các route mồ côi (`exams`, `item-bank`, `live-pin`)
- [x] Checkpoint 3: Xác minh điều hướng Sidebar và bộ lọc phân hạng Pro

## Phase 4: Chuẩn hóa Giao diện Dark Mode & Màu Sắc AGENTS.md
- [x] Task 7: Bổ sung Dark Mode bản địa cho module Năng lực (`competency`, `analysis`), Thanh toán (`billing`) và `checkout/[orderId]`
- [x] Task 8: Bổ sung Dark Mode bản địa cho Bảng xếp hạng (`leaderboard`) và Bàn chấm bài (`grading`)
- [x] Task 9: Tinh chỉnh Token Theme trong `globals.css` và `personal/layout.tsx` (gỡ bỏ override cưỡng bức `!important`, chuẩn hóa background True Black)
- [x] Checkpoint 4: Chạy `npx tsc --noEmit` (0 lỗi), `npx vitest run` pass 100% (407/407 tests), nghiệm thu giao diện

## Nâng cấp Giao Diện & Tính Năng Bảng Xếp Hạng (`/personal/leaderboard`)
- [x] Bổ sung bộ lọc mốc thời gian: **Tuần này (`week`)**, **Tháng này (`month`)**, **Tất cả (`all`)** đồng bộ URL query và API `/api/leaderboard?period=...`.
- [x] Tạo bộ SVG vector đồ họa cao cấp độc quyền tại `LeaderboardGraphics.tsx`:
  - `LeaderboardHeroIllustration`: Cúp vinh danh học thuật với hiệu ứng tỏa sáng và bệ đa tầng.
  - `LaurelWreathGold`: Vòng nguyệt quế và vương miện hoàng gia cho Quán Quân (Rank 1).
  - `LaurelWreathSilver`: Vòng nguyệt quế và huy hiệu sao tinh tế cho Á Quân (Rank 2).
  - `LaurelWreathBronze`: Vòng nguyệt quế và khiên danh dự cho Quý Quân (Rank 3).
  - `PodiumPedestalBase`: Bục vinh danh kiến trúc dập nổi số La Mã I, II, III dưới chân từng card Top 3.
  - `TableMedalBadge`: Huy chương đúc kim loại kèm dải ruy băng vinh danh cho các hàng trong bảng xếp hạng.
  - `EmptyLeaderboardIllustration`: Minh họa vector trang trọng khi chưa có dữ liệu trong tuần/tháng.
- [x] Loại bỏ hoàn toàn cảm giác "vibecoding", nâng tầm UI/UX theo tiêu chuẩn SaaS giáo dục cao cấp của AGENTS.md.
