# Kế Hoạch Triển Khai: Nâng Cấp Hệ Thống Phòng Thi Trực Tiếp (Live Exam Room Arena)

> **Căn cứ:**
> - Bộ giao diện tham khảo thực tế (Ảnh 1 - 5) được người dùng cung cấp.
> - Bản thiết kế ý tưởng: [`nexa_live_exam_arena_mockup.jpg`](file:///C:/Users/CPS/.gemini/antigravity/brain/fcefad32-e914-4a65-89ad-9e64d94b4af1/nexa_live_exam_arena_mockup_1793801143743.jpg)
> - Quy chuẩn kiến trúc & giao diện: [`AGENTS.md`](file:///c:/nexa/AGENTS.md) (Phân lập Personal vs Organization; Light trắng #FFFFFF / Dark đen #000000; Không dùng thuật ngữ giáo điều DigComp)
> - Kỹ năng áp dụng: `planning-and-task-breakdown`

---

## 1. Phân Tích & Định Vị Nghiệp Vụ: Personal vs. Organization Live Room

| Đặc điểm | Personal Live Room (`/personal/live-room/*`) | Organization Live Room (`/org/[slug]/live-room/*`) |
| :--- | :--- | :--- |
| **Mục đích** | Phòng thi linh hoạt, tự học, kiểm tra nhanh nhóm nhỏ hoặc lớp gia sư. | Kỳ thi chính thức, ca thi học phần, khảo sát năng lực số diện rộng của trường. |
| **Chủ thể sở hữu** | Cá nhân người dùng (`created_by = user.id`). | Tổ chức cụ thể (`organization_id = org.id`), gắn với `class_id` hoặc `campaign_id`. |
| **Phân quyền** | Host (chủ phòng) và Người tham gia (thí sinh). | Admin trường điều phối chung; Giám thị được phân công ca trực; Thí sinh thuộc danh sách lớp. |
| **Nguồn đề thi** | Đề do cá nhân tạo hoặc đề công khai của hệ thống. | Đề nội bộ của tổ chức hoặc đề chuẩn hóa 5 miền được trường phê duyệt. |
| **Giám sát & Chống gian lận**| Theo dõi danh sách ai đang làm bài, điểm danh thời gian thực. | Giám sát chuyên sâu (Sơ đồ bàn thi, cảnh báo rời tab, mạng yếu, khóa bài thí sinh vi phạm). |
| **Đồng bộ kết quả** | Lưu vào lịch sử làm bài của thí sinh và kết quả phiên của Host. | Tự động ghi vào **Bảng điểm lớp học** và tích lũy vào **Hồ sơ năng lực 5 miền toàn trường**. |

---

## 2. Kế Hoạch Nhiệm Vụ Chi Tiết (Vertical Slices)

### Task 1: Tái Cấu Trúc Dashboard Phòng Thi Tổ Chức (`/org/[slug]/live-room`) theo Mẫu Ảnh 5
**Mô tả:** Thiết kế lại trang trung tâm điều phối phòng thi của trường học theo phong cách Ảnh 5 (chuẩn SaaS B2B cao cấp).
**Tiêu chí nghiệm thu (Acceptance Criteria):**
- [ ] 4 thẻ KPI trên cùng: `Tổng phòng thi`, `Đang diễn ra` (pulsing green), `Sắp diễn ra`, `Đã kết thúc`.
- [ ] Thanh tab lọc trạng thái có số đếm động (`Tất cả`, `Sắp diễn ra`, `Đang diễn ra`, `Đã kết thúc`).
- [ ] Bảng dữ liệu phòng thi rõ ràng:
  - Tên phòng thi hiển thị kèm **mã PIN 6 số** (`font-mono tabular-nums`) ngay phía dưới tên phòng.
  - Cột Loại bài thi (badge tinh tế), Lớp học / Đơn vị trực thuộc.
  - Cột Thời gian và Người tham gia (`128/150`).
  - Nút thao tác thông minh: `Giám sát` (khi phòng đang diễn ra), `Chi tiết` (khi sắp diễn ra), `Kết quả` (khi đã kết thúc).
- [ ] Cột bên phải:
  - Khối **Tạo phòng thi trực tiếp** (3 bước hướng dẫn) kèm nút CTA xanh Cobalt lớn `+ Bắt đầu tạo phòng`.
  - Khối **Tính năng nổi bật** (Giám sát trực tiếp, Chống gian lận tab/thiết bị, Chấm tự động, Báo cáo tức thì).
- [ ] Giữ nguyên 100% ngữ cảnh Org Topbar & Sidebar của trường, không bị nhảy sang Personal.
**Tệp chỉnh sửa:**
- `src/app/(dashboard)/org/[slug]/live-room/page.tsx`
- `src/components/dashboard/live-room/LiveRoomDashboardView.tsx`

---

### Task 2: Chuẩn Hóa Dashboard Phòng Trực Tiếp Cá Nhân (`/personal/live-room`) theo Mẫu Ảnh 1
**Mô tả:** Nâng cấp trang danh sách phòng thi cá nhân cho giáo viên/người học tự do theo Ảnh 1.
**Tiêu chí nghiệm thu (Acceptance Criteria):**
- [ ] Header cá nhân: `Phòng trực tiếp` với mô tả tổ chức kiểm tra và tự học.
- [ ] 3 thẻ KPI tinh gọn: `Sắp diễn ra`, `Đang diễn ra`, `Đã kết thúc`.
- [ ] Nút thao tác nhanh: `+ Mở phòng mới`, `Nhân bản từ mẫu`.
- [ ] Bảng phòng thi cá nhân có nút sao chép mã PIN nhanh, trạng thái và nút Vào phòng.
- [ ] Cột bên phải: Danh sách **Mẫu gần đây** (Kiểm tra 15 phút, Ôn tập chương...) cho phép tái sử dụng nhanh.
**Tệp chỉnh sửa:**
- `src/app/(dashboard)/personal/live-room/page.tsx`
- `src/components/dashboard/personal/live-room/PersonalLiveRoomListView.tsx` (nếu tách component)

---

### Task 3: Tái Thiết Kế Trình Tạo Phòng Thi Trực Tiếp (Wizard Create Room) theo Mẫu Ảnh 2 & Mockup Studio
**Mô tả:** Thay thế form trống rỗng hiện tại (`Bước 1: Không tìm thấy đề thi phù hợp`) bằng trình tạo phòng thi tương tác sống động.
**Tiêu chí nghiệm thu (Acceptance Criteria):**
- [ ] Tự động tải và hiển thị danh mục đề thi chuẩn hóa 5 miền năng lực số (không bao giờ để màn hình trống rỗng).
- [ ] Mỗi đề thi hiển thị dưới dạng Card trực quan: Tên đề, nhãn chuẩn hóa, thời lượng, số câu, thang 100đ, thumbnail Radar 5 miền.
- [ ] Cột bên phải hiển thị ngay **Xem trước sảnh chờ (Live Room Arena Preview)**:
  - Mã PIN 6 số siêu lớn (`849 201`).
  - Mã QR quét thi điện thoại (`nexa.ai/live`).
  - Số lượng thí sinh và avatar học viên tham gia.
- [ ] Giữ đúng ngữ cảnh workspace:
  - Nếu tạo từ Org: Breadcrumb `← Quay lại Phòng thi tổ chức`, lưu `organizationId` và gán lớp `classId`.
  - Nếu tạo từ Personal: Breadcrumb `← Quay lại Phòng trực tiếp`.
- [ ] Cụm công tắc cấu hình nhanh: Khóa phòng sau khi bắt đầu, Bật bảng điểm realtime, Tự động nộp bài khi hết giờ.
**Tệp chỉnh sửa:**
- `src/app/(dashboard)/personal/live-room/new/page.tsx`
- `src/app/api/assessments/route.ts` (đảm bảo query đề chuẩn hóa fallback)

---

### Task 4: Nâng Cấp Bàn Giám Sát Phòng Thi Đang Diễn Ra (Live Monitor Console) theo Mẫu Ảnh 4
**Mô tả:** Xây dựng màn hình điều hành phòng thi thời gian thực chuyên nghiệp cho giám thị và host.
**Tiêu chí nghiệm thu (Acceptance Criteria):**
- [ ] Header phiên thi: Tên phòng, Mã PIN lớn, Thời gian đếm ngược, Tổng thí sinh (`32/35`).
- [ ] Bố cục 3 cột điều hành chuyên sâu:
  - **Cột 1: Danh sách thí sinh** (Lọc: Đang làm, Chưa vào, Tạm ngắt; hiển thị thời gian làm bài của từng bạn).
  - **Cột 2: Sơ đồ bàn thi (Desk/Seat Matrix)** trực quan với các ô số ghế đổi màu theo trạng thái + **Dòng sự kiện realtime** (vào muộn, mất kết nối, rời tab).
  - **Cột 3: Bảng Cảnh báo cần chú ý** + **Bộ điều khiển nhanh** (Gửi thông báo toàn phòng, Gia hạn 5 phút, Khóa bài thí sinh).
**Tệp chỉnh sửa:**
- `src/app/(dashboard)/personal/live-room/[id]/host/page.tsx`
- `src/app/live/control/page.tsx`

---

### Task 5: Kiểm Thử Toàn Diện & Đảm Bảo Chuẩn Bực
**Tiêu chí nghiệm thu (Acceptance Criteria):**
- [ ] TypeScript check `npx tsc --noEmit` đạt 0 lỗi.
- [ ] Vitest test suite đạt 100% pass.
- [ ] Hỗ trợ đầy đủ Light Mode (trắng #FFFFFF) và Dark Mode (đen #000000) chuẩn WCAG AA.
- [ ] Không lộ thuật ngữ kỹ thuật DigComp ra UI.
