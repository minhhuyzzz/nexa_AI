# Danh Sách Nhiệm Vụ Triển Khai: Chuẩn Hóa Văn Bản & Tối Ưu SEO Toàn Hệ Thống

## Slice 1: SEO, Metadata & Trang Công Khai (Landing Page, Header, Footer, Auth)
- [x] **Task 1.1: Chuẩn hóa Root Metadata & SEO Tags**
  - **Mô tả:** Cập nhật Title, Meta Description, Keywords, OpenGraph chuẩn SEO tại `src/app/layout.tsx` và `src/app/page.tsx` với từ khóa trọng tâm: đánh giá năng lực số, 5 miền năng lực số, chuẩn hóa kỹ năng số.
  - **Chấp nhận:** Thẻ meta súc tích, giàu từ khóa, không quá 160 ký tự mô tả.
  - **Files:** `src/app/layout.tsx`, `src/app/page.tsx`
- [x] **Task 1.2: Tinh giản Hero Section**
  - **Mô tả:** Rút gọn tiêu đề và mô tả chính thành 1 câu sắc bén; loại bỏ `divide-y` (viền ngang mobile) ở thanh giá trị nổi bật.
  - **Chấp nhận:** Không có viền ngang, mô tả dưới 18 từ, CTA 2–3 từ.
  - **File:** `src/components/landing/HeroSection.tsx`
- [x] **Task 1.3: Tinh giản Core Highlights Section**
  - **Mô tả:** Rút gọn 3 thẻ giá trị bồi dưỡng thành các câu súc tích; loại bỏ `border-b` ở header mockup lộ trình.
  - **Chấp nhận:** Không còn viền ngang, mô tả ngắn gọn trực diện.
  - **File:** `src/components/landing/CoreHighlightsSection.tsx`
- [x] **Task 1.4: Tinh giản Header & Footer**
  - **Mô tả:** Rút gọn các nhãn điều hướng và mô tả chân trang; loại bỏ tiếng Anh/văn mẫu thừa.
  - **Chấp nhận:** Chân trang và thanh điều hướng thanh thoát, chuẩn tiếng Việt.
  - **Files:** `src/components/public/PublicHeader.tsx`, `src/components/public/PublicFooter.tsx`

---

## Slice 2: Không Gian Cá Nhân (Personal Dashboard `/personal/*`)
- [x] **Task 2.1: Tinh giản Tổng quan Cá nhân (`/personal/dashboard`)**
  - **Mô tả:** Bỏ `(PTS)` trên card điểm tích lũy; chuẩn hóa `Level 1: Basic` thành tiếng Việt; rút gọn banner khảo thí đầu vào và mô tả 4 thẻ chỉ số; loại bỏ các `border-b` phân cách.
  - **Chấp nhận:** Giao diện thoáng, sạch bóng tiếng Anh trong ngoặc và viền ngang.
  - **File:** `src/app/(dashboard)/personal/dashboard/page.tsx`
- [x] **Task 2.2: Tinh giản Lộ trình Bồi dưỡng (`/personal/learning-path`)**
  - **Mô tả:** Đổi tên cấp độ `Basic`, `Intermediate`, `Advanced`, `Highly Advanced` thành `Cơ bản`, `Trung cấp`, `Nâng cao`, `Chuyên sâu`; bỏ chữ `(PRO)` thừa; loại bỏ `border-b`.
  - **Chấp nhận:** Chuẩn hóa toàn bộ tên cấp độ sang tiếng Việt, không còn nhãn tiếng Anh trong ngoặc.
  - **File:** `src/app/(dashboard)/personal/learning-path/page.tsx`
- [x] **Task 2.3: Tinh giản Hồ sơ Năng lực & Kho Đề (`/personal/profile`, `/personal/assessments`)**
  - **Mô tả:** Tinh gọn các tiêu đề bài thi, trạng thái làm bài, rút ngắn mô tả.
  - **Chấp nhận:** Không còn văn mẫu dài dòng.
  - **Files:** `src/app/(dashboard)/personal/profile/page.tsx`, `src/app/(dashboard)/personal/assessments/page.tsx`

---

## Slice 3: Không Gian Tổ Chức (Organization Business `/org/[slug]/*`)
- [x] **Task 3.1: Tinh giản Tổng quan Tổ chức (`/org/[slug]/page.tsx`, `OrgTodoCenter.tsx`)**
  - **Mô tả:** Rút gọn tiêu đề KPI, danh sách việc cần xử lý ngắn gọn dưới 10 từ; bỏ viền ngang phân cách.
  - **Chấp nhận:** Giao diện quản trị vào thẳng số liệu và hành động.
  - **Files:** `src/app/(dashboard)/org/[slug]/page.tsx`, `src/components/dashboard/org/org-ui/OrgTodoCenter.tsx`
- [x] **Task 3.2: Tinh giản Ngân hàng Đề & Đợt thi (`/org/[slug]/assessments`, `/campaigns`)**
  - **Mô tả:** Rút gọn nhãn trạng thái đợt thi, các nút thao tác tạo đề/giao đề; loại bỏ tiếng Anh thừa.
  - **Chấp nhận:** Text nút 2-3 từ, trạng thái rõ ràng.
  - **Files:** `src/components/dashboard/org/assessments/OrgAssessmentsListView.tsx`, `src/app/(dashboard)/org/[slug]/campaigns/page.tsx`
- [x] **Task 3.3: Tinh giản Bàn chấm bài & Lớp học (`/org/[slug]/grading`, `/classes`)**
  - **Mô tả:** Tinh gọn hướng dẫn chấm bài, rubric tiêu chí, trạng thái nộp bài.
  - **Chấp nhận:** Bàn chấm bài trực diện, tập trung vào minh chứng và điểm số.
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/OrgGradingClientView.tsx`, `src/app/(dashboard)/org/[slug]/classes/page.tsx`

---

## Slice 4: Không Gian Quản Trị Nền Tảng (Platform Admin `/admin/*`)
- [x] **Task 4.1: Tinh giản Khảo thí Đầu vào & Đề chuẩn (`/admin/baseline`, `/admin/content`)**
  - **Mô tả:** Bỏ các nhãn `(PRO)`, `(VIP)` thừa; chuẩn hóa thành `Miễn phí` vs `Gói Chuyên sâu`; loại bỏ văn mẫu dài dòng trong chi tiết đề thi.
  - **Chấp nhận:** Không còn tiếng Anh trong ngoặc, tiêu đề chuẩn SEO nội bộ.
  - **Files:** `src/app/(dashboard)/admin/baseline/page.tsx`, `src/app/(dashboard)/admin/content/page.tsx`
- [x] **Task 4.2: Tinh giản Quản trị Gói & Tổ chức (`/admin/plans`, `/admin/organizations`, `/admin/users`)**
  - **Mô tả:** Tinh gọn tên gói dịch vụ và các nút phê duyệt.
  - **Chấp nhận:** Nhãn ngắn gọn, súc tích.
  - **Files:** `src/app/(dashboard)/admin/plans/page.tsx`, `src/app/(dashboard)/admin/organizations/page.tsx`, `src/app/(dashboard)/admin/users/page.tsx`

---

## Slice 5: Kiểm Thử Toàn Diện & Đảm Bảo Tính Toàn Vẹn
- [x] **Task 5.1: Chạy kiểm thử tự động `npx vitest run`**
  - **Chấp nhận:** 100% test suites (17 test files, 117 tests) đều pass.
- [x] **Task 5.2: Kiểm tra kiểu TypeScript `npm run typecheck`**
  - **Chấp nhận:** 0 lỗi TypeScript trên toàn bộ codebase.
- [x] **Task 5.3: Cập nhật Knowledge Graph `graphify update .`**
  - **Chấp nhận:** Đồ thị tri thức được cập nhật với toàn bộ thay đổi mới nhất.
