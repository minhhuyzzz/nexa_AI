# Kế Hoạch Triển Khai: Chuẩn Hóa Toàn Diện Personal Workspace (`/personal/*`)

> **Căn cứ:**
> - Báo cáo rà soát hiện trạng: [`NEXA_PERSONAL_DASHBOARD_COMPREHENSIVE_AUDIT.md`](file:///C:/Users/CPS/.gemini/antigravity/brain/ced6f4b2-5e80-4edf-9ac7-a62328626f49/NEXA_PERSONAL_DASHBOARD_COMPREHENSIVE_AUDIT.md)
> - Quy chuẩn kiến trúc & giao diện: [`AGENTS.md`](file:///c:/nexa/AGENTS.md)
> - Kỹ năng áp dụng: `planning-and-task-breakdown`

---

## 1. Mục Tiêu & Nguyên Tắc Thiết Kế

1. **Bảo mật & Dữ liệu thật (Honest Data & Anti-Mocking):**
   * Xóa bỏ hoàn toàn cơ chế tự sinh chứng chỉ ảo 100% khi người dùng nhập mã bắt đầu bằng `NX-`.
   * Thay thế mảng lịch tuần tĩnh (hardcode 26-31, 1) bằng logic tính 7 ngày tuần thực tế (Thứ 2 đến Chủ nhật) dựa trên `last_login_date` và `login_streak`.
2. **Chuẩn hóa 5 Miền Năng Lực Số (DigComp Parity):**
   * Biểu đồ Radar không kéo điểm `null` về góc 0% gây hiểu lầm học viên bị điểm liệt.
   * Xóa bỏ thông tin "kỹ năng thành phần" trên UI `/personal/competency` theo AGENTS.md §2.1.
   * Đồng nhất ngưỡng chẩn đoán khoảng trống (Gap) tại mốc $\ge 70\%$.
3. **Đồng bộ Gói dịch vụ & Điều hướng (Tiers & Navigation):**
   * Đổi toàn bộ nhãn `VIP` thành `PRO` trên Thư viện đề và Màn hình làm bài.
   * Đưa "Hồ sơ năng lực" (`/personal/competency`) lên Sidebar nhóm "Học tập & Phát triển".
   * Tạo chuyển hướng an toàn cho các route mồ côi (`/personal/exams`, `/personal/item-bank`, `/personal/live-pin`).
4. **Chuẩn hóa Chế độ Tối (True Black & Dark Mode AA):**
   * Trang bị class `dark:` bản địa cho các trang đang thiếu 100%: `competency`, `grading`, `checkout`, `billing`, `leaderboard`.
   * Dọn dẹp override cưỡng chế `!important` trong `globals.css`.

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết (Work Breakdown Structure)

### Phase 1: Bảo toàn Dữ liệu & An Toàn Bảo Mật (Foundation & Security)

#### Task 1: Xóa bỏ Chứng chỉ giả lập & Chuẩn hóa Cấp phát Chứng chỉ
- **Mô tả:** Chặn đứng lỗ hổng tự động tạo chứng chỉ PDF giả lập khi người dùng gõ mã `NX-` tùy ý tại API `/api/credentials/[id]/pdf/route.ts`. Loại bỏ fallback mã chứng chỉ giả `NX-2026-MASTER-8F3A2B` tại Frontend.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] API `/api/credentials/[id]/pdf` trả về 404 Not Found nếu mã chứng chỉ không tồn tại trong bảng `credentials` của DB.
  - [ ] Không sinh PDF khống cho mã `NX-` bất kỳ khi chưa có bản ghi thật.
  - [ ] Frontend `credentials/page.tsx` và `MasterCertificateCard.tsx` hiển thị trạng thái "Chưa cấp" trung thực khi người dùng chưa đủ điều kiện.
- **Tệp chỉnh sửa:**
  - `src/app/api/credentials/[id]/pdf/route.ts`
  - `src/app/(dashboard)/personal/credentials/page.tsx`
  - `src/components/dashboard/personal/MasterCertificateCard.tsx`
- **Quy mô:** Medium (3 files)

#### Task 2: Chuẩn hóa Lịch tuần Chuyên cần 7 ngày Động trên Dashboard
- **Mô tả:** Thay thế mảng tĩnh 7 ngày (hardcode ngày 26-31 và 1) bằng hàm tính toán 7 ngày trong tuần hiện tại (Thứ 2 đến Chủ nhật) dựa trên múi giờ Việt Nam, hiển thị chính xác ngày dương lịch và trạng thái check-in thật.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Ngày trong tuần hiển thị đúng ngày thực tế của tuần hiện tại (ví dụ: ngày 2 đến ngày 8 của tháng hiện hành).
  - [ ] Cột ngày hôm nay được đánh dấu `today: true`.
  - [ ] Các ngày trước đó được tick xanh tương ứng với `loginStreak` và `last_login_date` thực tế trong CSDL.
- **Tệp chỉnh sửa:**
  - `src/app/(dashboard)/personal/dashboard/page.tsx`
- **Quy mô:** Small (1 file)

---

### Checkpoint 1: Xác minh Dữ liệu Thật & Bảo Mật
- [ ] Chạy vitest xác minh các test credentials và profile stats: `npx vitest run personal`
- [ ] Test API `/api/credentials/NX-TEST-FAKE/pdf` trả về đúng 404 thay vì PDF giả lập.
- [ ] Màn hình Dashboard hiển thị đúng ngày tuần hiện tại.

---

### Phase 2: Chuẩn hóa 5 Miền & Biểu đồ Radar (Competency & Radar Honesty)

#### Task 3: Xử lý Trung thực `null` vs `0` trong `CompetencyRadarChart.tsx` & Màu Cobalt Blue
- **Mô tả:** Tách bạch dữ liệu `score === null` (chưa đánh giá) và `score === 0` (đã thi và đạt 0 điểm). Miền chưa đánh giá không bị kéo đỉnh về 0 tạo đa giác méo. Cập nhật màu nhấn từ Sky Blue `#0284C7` sang Cobalt Blue `#2563EB`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Đa giác điểm (score polygon) chỉ nối qua các đỉnh có điểm hợp lệ (`score !== null`).
  - [ ] Đỉnh chưa đánh giá hiển thị biểu tượng/vòng tròn rỗng hoặc nét đứt biểu thị chưa có dữ liệu.
  - [ ] Màu sắc nét vẽ và gradient chuyển sang Cobalt Blue `#2563EB`.
- **Tệp chỉnh sửa:**
  - `src/components/dashboard/personal/CompetencyRadarChart.tsx`
- **Quy mô:** Small (1 file)

#### Task 4: Loại bỏ 21 Kỹ năng Thành phần & Đồng nhất Ngưỡng 70% tại `competency/page.tsx`
- **Mô tả:** Xóa dòng chữ đo đếm 21 kỹ năng thành phần trên giao diện theo quy chuẩn AGENTS.md §2.1. Thống nhất ngưỡng chẩn đoán khoảng trống (Gap) tại mức 70%.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Giao diện chỉ thể hiện tiến độ và điểm số theo 5 Miền năng lực số.
  - [ ] Xóa bỏ câu "Đã khảo thí X/Y kỹ năng thành phần".
  - [ ] Ngưỡng phân loại màu sắc đồng bộ: $\ge 70\%$ Đạt chuẩn (Cobalt Blue/Emerald), $< 70\%$ Cần củng cố (Amber).
- **Tệp chỉnh sửa:**
  - `src/app/(dashboard)/personal/competency/page.tsx`
  - `src/features/competency/services/domain-assessment-summary.service.ts`
- **Quy mô:** Small (2 files)

---

### Checkpoint 2: Xác minh 5 Miền & Biểu đồ Radar
- [ ] Chạy `npx vitest run personal` bảo đảm tất cả test 5 miền năng lực đều pass.
- [ ] Kiểm tra biểu đồ radar hiển thị đúng khi có 0 bài thi, 1 bài thi và 5 bài thi.

---

### Phase 3: Đồng bộ Phân hạng Gói & Điều hướng (Tiers & Navigation)

#### Task 5: Đổi Triệt Để Nhãn "VIP" thành "PRO" trên Thư viện Đề & Màn hình Làm bài
- **Mô tả:** Loại bỏ toàn bộ từ khóa `VIP` trong code và UI, thay bằng chuẩn phân hạng `PRO` (Free vs Pro).
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Thư viện đề `/personal/assessments`: Bộ lọc phân hạng hiển thị `Tất cả`, `Miễn phí (FREE)`, `Nâng cao (PRO)`.
  - [ ] Thẻ đề thi Pro hiển thị huy hiệu `PRO` có biểu tượng ổ khóa.
  - [ ] Màn hình làm bài `/personal/take/[id]`: Thông báo yêu cầu nâng cấp gói ghi rõ "Gói PRO".
- **Tệp chỉnh sửa:**
  - `src/app/(dashboard)/personal/assessments/page.tsx`
  - `src/app/(dashboard)/personal/take/[id]/page.tsx`
- **Quy mô:** Medium (2 files)

#### Task 6: Bổ sung Link Hồ Sơ Năng Lực trên Sidebar & Dọn dẹp Route Mồ côi
- **Mô tả:** Thêm mục "Hồ sơ năng lực" (`/personal/competency`) vào Sidebar. Tạo redirect cho `/personal/exams` $\rightarrow$ `/personal/authoring`, `/personal/item-bank` $\rightarrow$ `/personal/authoring`, `/personal/live-pin` $\rightarrow$ `/personal/live-room`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] `PersonalSidebar.tsx` có mục "Hồ sơ năng lực" nằm ngay sau "Tổng quan".
  - [ ] Truy cập `/personal/exams` tự động chuyển về `/personal/authoring`.
  - [ ] Truy cập `/personal/item-bank` tự động chuyển về `/personal/authoring`.
  - [ ] Truy cập `/personal/live-pin` tự động chuyển về `/personal/live-room`.
- **Tệp chỉnh sửa:**
  - `src/components/dashboard/personal/PersonalSidebar.tsx`
  - `src/app/(dashboard)/personal/exams/page.tsx`
  - `src/app/(dashboard)/personal/item-bank/page.tsx`
  - `src/app/(dashboard)/personal/live-pin/page.tsx`
- **Quy mô:** Medium (4 files)

---

### Checkpoint 3: Xác minh Điều hướng & Phân hạng
- [ ] Sidebar xuất hiện mục Hồ sơ năng lực và active đúng trạng thái.
- [ ] Bộ lọc Pro hoạt động chuẩn xác, không còn sót chữ VIP trên UI.
- [ ] Các URL mồ côi redirect trơn tru.

---

### Phase 4: Chuẩn hóa Giao diện Dark Mode & Màu Sắc AGENTS.md

#### Task 7: Bổ sung Dark Mode Bản địa cho Module Năng lực, Thanh toán & Checkout
- **Mô tả:** Viết class `dark:` trực tiếp cho `competency/page.tsx`, `competency/analysis/page.tsx`, `billing/page.tsx`, `checkout/[orderId]/page.tsx` theo chuẩn nền đen thật `#000000`, card `#111114`, viền `#27272A`, chữ `#F5F5F5` / `#E4E4E7`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 4 trang hiển thị hoàn hảo ở Dark Mode mà không bị chói sáng hoặc chữ chìm vào nền.
  - [ ] Khung quét mã QR VietQR và thẻ thông tin chuyển khoản rõ ràng, sắc nét.
- **Tệp chỉnh sửa:**
  - `src/app/(dashboard)/personal/competency/page.tsx`
  - `src/app/(dashboard)/personal/competency/analysis/page.tsx`
  - `src/app/(dashboard)/personal/billing/page.tsx`
  - `src/app/(dashboard)/personal/checkout/[orderId]/page.tsx`
- **Quy mô:** Large (4 files)

#### Task 8: Bổ sung Dark Mode Bản địa cho Bảng Xếp Hạng & Bàn Chấm Bài
- **Mô tả:** Bổ sung class `dark:` cho `leaderboard/page.tsx` (bục vinh danh Vàng/Bạc/Đồng, bảng xếp hạng) và `grading/page.tsx` (Bàn chấm Rubric, Drawer AI).
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Bục vinh danh Top 3 hiển thị sang trọng trên nền tối mà không bị mảng trắng chói.
  - [ ] Bàn chấm Rubric hiển thị rõ chữ, ô điểm và nút hành động trên nền `#111114`.
- **Tệp chỉnh sửa:**
  - `src/app/(dashboard)/personal/leaderboard/page.tsx`
  - `src/app/(dashboard)/personal/grading/page.tsx`
- **Quy mô:** Large (2 files)

#### Task 9: Tinh chỉnh Token Theme & Gỡ bỏ CSS Cưỡng chế `globals.css`
- **Mô tả:** Loại bỏ khối override `html.dark .dashboard-shell ... !important` gây giòn gãy CSS trong `globals.css`. Kiểm tra lại toàn bộ shell layout Personal.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Giao diện chuyển đổi Light / Dark mượt mà, không bị nhấp nháy hoặc mất màu.
  - [ ] Đạt chuẩn tương phản WCAG AA cho chữ và các biểu tượng tương tác.
- **Tệp chỉnh sửa:**
  - `src/app/globals.css`
  - `src/app/(dashboard)/personal/layout.tsx`
- **Quy mô:** Small (2 files)

---

### Checkpoint 4: Tổng Kiểm Thử & Nghiệm Thu
- [ ] TypeScript Check: `npx tsc --noEmit` không có lỗi (0 errors).
- [ ] Toàn bộ Vitest Suite: `npx vitest run` pass 100%.
- [ ] Kiểm tra thực tế trên trình duyệt: Chuyển đổi Light/Dark mode trên tất cả các trang Personal.
