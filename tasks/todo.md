# Danh Sách Nhiệm Vụ Triển Khai: Nâng Cấp 2 Dashboard (/admin & /personal/dashboard)

## Phase 1: Platform Admin Dashboard (/admin/dashboard)
- [x] **Task 1.1: Visual Hierarchy Header & Action Bar**
  - **Mô tả:** Đặt 1 nút Primary CTA xanh `#2563EB` cho hành động "Duyệt hồ sơ B2B", nút "Phân tích BI 5 miền" chuyển thành secondary outline. Nâng chiều cao nút đạt tối thiểu 44px trên mobile (`min-h-[44px] sm:min-h-0`).
  - **Chấp nhận:** Phân cấp rõ rệt, người quản trị nhận diện ngay hành động trọng tâm.
- [x] **Task 1.2: Chuẩn hóa 4 KPI Cards & 4 Queue Cards theo 5 mã màu**
  - **Mô tả:** Đồng nhất icon container về monochrome/xanh, xóa bỏ gradient rườm rà, số liệu `font-mono tabular-nums`.
  - **Chấp nhận:** 4 thẻ KPI và 4 thẻ hàng đợi cân đối, thanh lịch, đồng bộ với Dashboard B2B.
- [x] **Task 1.3: Responsive Phễu năng lực & Bảng Nhật ký hoạt động**
  - **Mô tả:** Chuyển bảng nhật ký hoạt động thành các card xếp chồng trên màn hình $< 768px$, đảm bảo không có thanh cuộn ngang `overflow-x` trên 390px.
  - **Chấp nhận:** Hiển thị mượt mà trên 390px, 768px và 1440px.
- [x] **Task 1.4: Tối ưu Form Modal Quản trị B2B (AddOrgModal)**
  - **Mô tả:** Rà soát modal thêm tổ chức B2B: bố cục 1 cột, nhãn phía trên, validate on blur, câu báo lỗi có hướng dẫn sửa, đủ 4 trạng thái tương tác (`focus-ring`, `disabled`, `loading`, `error`).
  - **Chấp nhận:** Trải nghiệm tạo tổ chức mượt mà, tỷ lệ hoàn thành cao.

## Checkpoint 1: Platform Admin Dashboard Hoàn Tất
- [x] Visual hierarchy rõ nét, phân cấp 1 nút Primary CTA duy nhất.
- [x] Đồng nhất 5 mã màu chủ đạo, loại bỏ hoàn toàn màu cầu vồng.
- [x] Bảng hoạt động chuyển thành stacked cards ở $< 768px$.
- [x] `tsc --noEmit` xanh.

## Phase 2: Personal Learner Dashboard (/personal/dashboard)
- [x] **Task 2.1: Tinh gọn Visual Hierarchy Hero Banner & Streak Tracker**
  - **Mô tả:** Giữ bố cục luxury silk ribbon nhưng tinh chỉnh độ tương phản, đặt 1 nút Primary CTA "Bắt đầu khảo sát đầu vào / Học tiếp lộ trình" nổi bật, chuỗi streak tối ưu vùng bấm di động $\ge 44px$.
  - **Chấp nhận:** Header và Hero banner gọn gàng, vùng chạm $\ge 44px$.
- [x] **Task 2.2: Chuẩn hóa 4 Bento Metric Cards**
  - **Mô tả:** Thay thế các dải gradient đa sắc ngẫu nhiên (`from-blue-50/40`, `from-emerald-50/40`, `from-amber-50/40`, `from-blue-50/80 via-sky-50`) bằng nền thẻ sạch `#F8FAFC` (Dark `#111114`), viền `#E2E8F0` (Dark `#27272A`), số liệu `font-mono tabular-nums`.
  - **Chấp nhận:** 4 thẻ đo lường năng lực số cân xứng, tinh tế, sang trọng, tránh "AI slop".
- [x] **Task 2.3: Tối ưu Responsive Radar Chart & Khung 5 Miền Năng Lực**
  - **Mô tả:** Đảm bảo trên 390px biểu đồ Radar và 5 thanh tiến độ xếp chồng cân đối, các bước tiến độ tự động co giãn không tràn màn hình.
  - **Chấp nhận:** Không có `overflow-x` trên mobile, giữ nguyên bố cục 2 cột trên 1440px.
- [x] **Task 2.4: Tối ưu Form/Modal Khảo Sát Chẩn Đoán Đầu Vào (BaselineDiagnosticModal)**
  - **Mô tả:** Chuẩn hóa form khảo sát: bố cục 1 cột rõ ràng, nhãn trên, validate on blur, thông báo lỗi chỉ dẫn cụ thể, đủ 4 trạng thái focus/disabled/loading/error.
  - **Chấp nhận:** Trải nghiệm khảo sát đầu vào mượt mà, dễ chịu, không gây ức chế.

## Checkpoint 2: Personal Learner Dashboard Hoàn Tất
- [x] Xóa bỏ toàn bộ gradient cầu vồng ở 4 thẻ chỉ số cá nhân.
- [x] Chuỗi streak và các bước lộ trình hiển thị trơn tru trên 390px.
- [x] Modal khảo sát chẩn đoán chuẩn hóa 1 cột và blur validation.
- [x] `tsc --noEmit` xanh.

## Phase 3: Accessibility WCAG 2.2 AA & Bảng Đối Soát Tổng Thể
- [x] **Task 3.1: Nâng cấp tương phản màu toàn bộ text phụ**
  - **Mô tả:** Rà soát và thay thế toàn bộ `text-slate-400` (#94A3B8) thành `text-slate-500` (#64748B) trên cả 2 dashboard để đạt tỷ lệ tương phản $\ge 4.5:1$ theo WCAG AA.
  - **Chấp nhận:** 100% văn bản đạt chuẩn độ tương phản WCAG 2.2 AA.
- [x] **Task 3.2: Bổ sung aria-labels, viền focus bàn phím & Reduced Motion**
  - **Mô tả:** Thêm `aria-label` cho tất cả các nút icon (đóng modal, sao chép, mũi tên), bổ sung `focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none`, tích hợp `motion-reduce:transition-none`.
  - **Chấp nhận:** Thao tác bằng phím Tab trơn tru, screen reader đọc chuẩn ngữ nghĩa.
- [x] **Task 3.3: Lập Bảng Đối Soát Tiếp Cận Toàn Diện và Kiểm Thử Tự Động**
  - **Mô tả:** Tổng hợp bảng đối chiếu chi tiết Trước / Sau cho cả 2 màn hình; chạy kiểm thử `tsc --noEmit` và test suite.
  - **Chấp nhận:** Bảng đối soát minh bạch, build và test xanh.

## Checkpoint 3: Hoàn Tất Toàn Bộ 3 Dashboard Hệ Thống
- [x] Cả 3 Dashboard (Org B2B, Admin, Personal) đồng nhất 100% hệ thống 5 màu.
- [x] Toàn bộ form 1 cột, top label, validate on blur.
- [x] Đạt chuẩn responsive 390px, 768px, 1440px và WCAG 2.2 AA.
- [x] Toàn bộ test suite (90/90 files, 1.429 tests) và build Next.js vượt qua thành công.
