# Kế Hoạch Triển Khai: Chuẩn Hóa Văn Bản & Tối Ưu SEO Toàn Hệ Thống (SaaS Anti-Bloat Plan)

## 1. Mục Tiêu & Nguyên Tắc Tinh Gọn (Core Principles)

Hệ thống NEXA đang gặp phải vấn đề câu từ dài dòng, lạm dụng từ tiếng Anh trong ngoặc, các đoạn giải thích lý thuyết thừa thãi làm loãng trọng tâm thao tác và giảm hiệu quả SEO. Kế hoạch này áp dụng triệt để nguyên tắc **(A) Rút gọn triệt để theo chuẩn SaaS hiện đại**:

### Bộ quy tắc chuẩn hóa văn bản (Copywriting Standards)
1. **Tiêu đề (Headings):** Độ dài từ 3 đến 5 từ, trực diện, nhấn mạnh giá trị hoặc hành động chính.
2. **Mô tả bổ trợ (Subtitles / Descriptions):** Tối đa đúng 1 câu ngắn gọn (< 15 từ). Nếu tiêu đề đã tự giải thích rõ ràng thì lược bỏ mô tả.
3. **Nút bấm / Thao tác (CTAs):** Chỉ gồm 2–3 từ hành động mạnh (VD: "Bắt đầu thi", "Tạo đề mới", "Lưu thay đổi", "Giao bài").
4. **Cấm tuyệt đối (Strict Ban):**
   - Không dùng từ tiếng Anh trong ngoặc (VD: `(FREE)`, `(PRO)`, `(VIP)`, `(Tab-Switch Guard)`, `(Active Warning)`, `(Dynamic Watermark)`).
   - Không hiển thị số hiệu học thuật (`DigComp`, `DigComp 2.2`, `DigComp 3.0`) ra ngoài UI. Chỉ dùng: *"5 miền năng lực số"* hoặc *"Khung năng lực số 5 miền"*.
   - Không đánh số cơ học kiểu lập trình (`T1..T11`, `Nhóm 1`, `Nhóm 2`).
   - Không dùng văn mẫu giải thích dông dài ("Đây là nơi người dùng có thể...", "Học viên sẽ có đúng thời gian này...").
5. **Quy chuẩn giao diện `AGENTS.md`:**
   - **Không sử dụng đường viền ngang** (`border-b`, `border-t`, `divide-y`, `<hr />`). Dùng spacing (`space-y-*`, `gap-*`) và màu nền lớp tương phản nhẹ.
   - Nền sáng `#FFFFFF`, nền tối `#000000`, chữ than trung tính `#171717` / `#F5F5F5`, điểm nhấn Cobalt Blue `#2563EB`.

---

## 2. Phân Tách Nhiệm Vụ Theo Vertical Slices

```
Toàn hệ thống NEXA
  │
  ├── Slice 1: SEO, Metadata & Trang Công Khai (Landing Page, Header, Footer, Auth)
  │
  ├── Slice 2: Không Gian Cá Nhân (Personal Dashboard, 5 Miền, Lộ Trình, Khảo Thí)
  │
  ├── Slice 3: Không Gian Tổ Chức (Organization Business Dashboard, Đề Thi, Lớp, Chấm Bài)
  │
  ├── Slice 4: Không Gian Quản Trị Nền Tảng (Platform Admin Baseline, Content, Users, Gói)
  │
  └── Slice 5: Kiểm Thử Toàn Diện & Đảm Bảo Tính Toàn Vẹn (QA & Verification)
```

---

### Slice 1: SEO, Metadata & Trang Công Khai (Landing Page, Footer, Auth)
- **Task 1.1: Chuẩn hóa Root Metadata & SEO Tags (`src/app/layout.tsx`, `page.tsx`)**
  - Cập nhật Title, Meta Description, Keywords, OpenGraph chuẩn SEO cho từ khóa: Đánh giá năng lực số, 5 miền năng lực số, khảo thí AI.
- **Task 1.2: Tinh giản Hero Section (`src/components/landing/HeroSection.tsx`)**
  - Rút gọn tiêu đề và mô tả chính thành 1 câu đắt giá.
  - Bỏ `divide-y` (viền ngang mobile) ở thanh giá trị nổi bật.
- **Task 1.3: Tinh giản Core Highlights (`src/components/landing/CoreHighlightsSection.tsx`)**
  - Rút gọn 3 thẻ giá trị thành các câu ngắn gọn, súc tích.
  - Bỏ `border-b` ở header mockup lộ trình.
- **Task 1.4: Tinh giản Header & Footer (`PublicHeader.tsx`, `PublicFooter.tsx`, Auth Pages)**
  - Tinh gọn nhãn điều hướng và mô tả chân trang.

---

### Slice 2: Không Gian Cá Nhân (Personal Dashboard `/personal/*`)
- **Task 2.1: Tinh giản Tổng quan Cá nhân (`src/app/(dashboard)/personal/dashboard/page.tsx`)**
  - Bỏ `(PTS)` trên card điểm tích lũy, đổi `Level 1: Basic` thành tiếng Việt chuẩn.
  - Rút gọn banner "Thiết lập Hồ sơ Năng lực Số Ban Đầu" và mô tả 4 thẻ chỉ số.
  - Bỏ `border-b` trong các vùng phân cách.
- **Task 2.2: Tinh giản Lộ trình Bồi dưỡng (`src/app/(dashboard)/personal/learning-path/page.tsx`)**
  - Đổi tên các cấp độ `Basic`, `Intermediate`, `Advanced`, `Highly Advanced` thành `Cơ bản`, `Trung cấp`, `Nâng cao`, `Chuyên sâu`.
  - Bỏ chữ `(PRO)` trong các nhãn trạng thái chặng học, đổi thành `ĐÃ MỞ`, `GÓI CHUYÊN SÂU`.
  - Bỏ các viền ngang `border-b`.
- **Task 2.3: Tinh giản Hồ sơ Năng lực & Kho Đề Cá nhân (`/personal/profile`, `/personal/assessments`)**
  - Rút gọn mô tả các bài thi, loại bỏ nhãn tiếng Anh thừa.

---

### Slice 3: Không Gian Tổ Chức (Organization Business `/org/[slug]/*`)
- **Task 3.1: Tinh giản Tổng quan Tổ chức (`/org/[slug]/page.tsx`, `OrgTodoCenter.tsx`)**
  - Tinh gọn KPI cards, tiêu đề việc cần xử lý.
- **Task 3.2: Tinh giản Quản lý Đề & Đợt thi (`/org/[slug]/assessments`, `/campaigns`)**
  - Chuẩn hóa text tiếng Việt cho các nút hành động, trạng thái đợt thi.
- **Task 3.3: Tinh giản Quản lý Lớp & Bàn chấm bài (`/org/[slug]/classes`, `/grading`)**
  - Tinh gọn hướng dẫn chấm bài, tiêu chuẩn rubric.

---

### Slice 4: Không Gian Quản Trị Nền Tảng (Platform Admin `/admin/*`)
- **Task 4.1: Tinh giản Khảo thí Đầu vào & Đề chuẩn (`/admin/baseline`, `/admin/content`)**
  - Bỏ các nhãn `(PRO)`, `(VIP)` thừa, chuẩn hóa thành `Miễn phí` vs `Gói Chuyên sâu`.
- **Task 4.2: Tinh giản Quản trị Gói & Tổ chức (`/admin/plans`, `/admin/organizations`, `/admin/users`)**
  - Chuẩn hóa bảng phân quyền và gói dịch vụ.

---

### Slice 5: Kiểm Thử Toàn Diện & Đảm Bảo Tính Toàn Vẹn
- **Task 5.1: Chạy kiểm thử tự động `vitest`**
  - Đảm bảo 100% test suites (117+ tests) đều pass.
- **Task 5.2: Kiểm tra kiểu TypeScript `npm run typecheck`**
  - Đảm bảo 0 lỗi TypeScript trên toàn bộ project.
- **Task 5.3: Cập nhật Knowledge Graph `graphify update .`**
  - Đồng bộ lại đồ thị mã nguồn sau khi hoàn tất chỉnh sửa.
