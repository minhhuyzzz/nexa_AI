# Danh Sách Nhiệm Vụ: Tối Ưu Personal Dashboard UX & Chuẩn Hóa 5 Miền Năng Lực

> Quy chuẩn theo kỹ năng `planning-and-task-breakdown`.  
> Căn cứ: `NEXA_PERSONAL_DASHBOARD_UX_PRODUCT_REVIEW_2026-10-30 (1).md` và `AGENTS.md`.

---

## Giai Đoạn 1: Nền Tảng Dữ Liệu 5 Miền, Tách XP & Tinh Gọn Sidebar

- [x] **Task 1.1: Chuẩn hóa `CompetencyAggregationService` & API Năng Lực về đúng 5 Miền (PERS-04)**
  - **Mô tả:** Cập nhật `CompetencyAggregationService.ts`, `/api/personal/competency-profile`, `/api/personal/competency-radar` để chỉ trả về đúng 5 miền DigComp. Phân biệt rõ ràng giữa `score = null` (chưa có bằng chứng) và `score = 0` (đã thi và bị 0 điểm). Loại bỏ hoàn toàn việc tính toán hoặc trả về chỉ số 21 kỹ năng thành phần ở tầng API công khai.
  - **Tiêu chuẩn nghiệm thu:**
    1. Response của `/api/personal/competency-profile` và `/api/personal/competency-radar` chỉ chứa 5 domains, không có danh sách 21 skills điểm số.
    2. Miền chưa có bài làm có `score: null` và `status: 'INSUFFICIENT_DATA'`, không bị gán thành `0%` hay `NEEDS_IMPROVEMENT`.
    3. Ngưỡng chuẩn mục tiêu thống nhất là `70%`.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/competency/services/competency-aggregation.service.test.ts`
  - **Phụ thuộc:** Không có
  - **Files:** `src/features/competency/services/competency-aggregation.service.ts`, `src/app/api/personal/competency-profile/route.ts`, `src/app/api/personal/competency-radar/route.ts`
  - **Size:** M (3 files, ~120 dòng)

- [x] **Task 1.2: Tách Rời Gamification XP Khỏi Quyền Cấp Master Certificate (PERS-05, PERS-07)**
  - **Mô tả:** Trong `src/app/api/personal/profile-stats/route.ts`, xóa bỏ điều kiện `points >= 450` để mở khóa Master Certificate. `points` chỉ đại diện cho điểm tích lũy hoạt động (XP) và level học tập (Level 1..4). Trạng thái `isCertificateUnlocked` chỉ `true` khi người dùng có chứng chỉ thật trong bảng `credentials` (không bị revoked).
  - **Tiêu chuẩn nghiệm thu:**
    1. Người dùng có 1000 điểm tích lũy nhưng chưa thi/chưa có chứng chỉ thì `isCertificateUnlocked = false`.
    2. Điểm tích lũy và Level được ghi rõ là "Cấp độ hoạt động / XP", không gọi là "Chứng chỉ Level 4".
  - **Lệnh kiểm chứng:** `npx vitest run src/app/api/personal/profile-stats/route.test.ts`
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/api/personal/profile-stats/route.ts`
  - **Size:** S (1 file, ~40 dòng)

- [x] **Task 1.3: Tái Cấu Trúc `PersonalSidebar.tsx` Theo 3 Khối Chuẩn & Bỏ Chấm Bài/Gói khỏi Cấp 1 (PERS-01)**
  - **Mô tả:** Cập nhật `PersonalSidebar.tsx` theo cấu trúc IA mới: (1) HỌC TẬP & PHÁT TRIỂN (Tổng quan, Bài đánh giá, Hồ sơ năng lực, Lộ trình của tôi, Chứng chỉ); (2) NHÓM & CÔNG VIỆC (Nhóm của tôi, Bài được giao); (3) CÔNG CỤ TẠO & TỔ CHỨC (Đề đánh giá của tôi, Ngân hàng câu hỏi, Phòng thi trực tiếp). Loại bỏ `Bàn chấm bài` và `Gói & Nâng cấp` khỏi sidebar cấp 1. Chuyển nút "Góp đề thi cộng đồng" thành liên kết phụ thay vì nút đen chiếm đỉnh sidebar.
  - **Tiêu chuẩn nghiệm thu:**
    1. Sidebar hiển thị đúng 3 nhóm chức năng với tên nhãn thân thiện.
    2. Không còn item `Bàn chấm bài` và `Gói & Nâng cấp` ở menu chính (route `/personal/grading` và `/personal/billing` vẫn hoạt động khi truy cập trực tiếp hoặc từ ngữ cảnh).
    3. Giữ nguyên tính năng thu gọn/mở rộng sidebar và hỗ trợ phím tắt điều hướng.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không có
  - **Files:** `src/components/dashboard/personal/PersonalSidebar.tsx`
  - **Size:** M (1 file, ~100 dòng)

- [x] **Task 1.4: Nâng Cấp `personal/dashboard/page.tsx` Theo 4 Trạng Thái & Khắc Phục Onboarding Catalog Rỗng (PERS-02, PERS-03)**
  - **Mô tả:** Tái cấu trúc Dashboard cá nhân theo 4 trạng thái động (Người mới chưa có baseline, Đã có baseline, Có việc gần hạn, Có bài cần chấm). Khi chưa có dữ liệu khảo thí, không vẽ 0% đa giác Radar giả mà hiển thị card tóm tắt "0/5 miền đã đánh giá" kèm nút CTA "Bắt đầu làm bài đánh giá đầu vào". Đảm bảo API `/api/assessments` luôn trả về ít nhất 1 bài đánh giá baseline DigComp công khai (hoặc seed sẵn nếu DB trống).
  - **Tiêu chuẩn nghiệm thu:**
    1. Người dùng mới thấy rõ CTA duy nhất: "Làm bài đánh giá đầu vào".
    2. Radar chỉ hiển thị khi có dữ liệu từ 5 miền; nếu chưa có thì hiển thị Empty State lịch thiệp, không vẽ đa giác 0%.
    3. Bấm "Bắt đầu làm bài" mở ra trang Bài đánh giá có sẵn bài thi baseline khả dụng.
  - **Lệnh kiểm chứng:** `npm run typecheck` và kiểm tra route `/personal/dashboard`
  - **Phụ thuộc:** Task 1.1, Task 1.2, Task 1.3
  - **Files:** `src/app/(dashboard)/personal/dashboard/page.tsx`, `src/app/(dashboard)/personal/competency/page.tsx`, `src/app/api/assessments/route.ts`
  - **Size:** M (3 files, ~150 dòng)

- [x] **Checkpoint 1: Hoàn tất Giai đoạn 1**
  - Chạy `npm test` và `npm run typecheck` xác nhận 0 lỗi. Toàn bộ sidebar, dashboard và 5 miền năng lực hoạt động đồng bộ.

---

## Giai Đoạn 2: Kho Khóa Học Tuyển Chọn & Lộ Trình 4 Bước

- [x] **Task 2.1: Tạo Bảng `course_catalog` & Seed Dữ Liệu Khóa Học Tuyển Chọn Theo 5 Miền (PERS-13)**
  - **Mô tả:** Viết migration SQL `24_create_course_catalog.sql` tạo bảng `course_catalog` lưu trữ danh mục khóa học được tuyển chọn (không phải sàn bán khóa học). Viết seed SQL cung cấp ít nhất 10 khóa học uy tín (miễn phí/chất lượng cao từ Coursera, edX, Google Digital Garage, Vinschool, MOOCs) phân bổ đều cho 5 miền năng lực số DigComp.
  - **Tiêu chuẩn nghiệm thu:**
    1. Migration tạo bảng `course_catalog` với các trường: `id`, `title`, `provider`, `official_url`, `domain_ids`, `level`, `language`, `price_type`, `review_status`, `short_description`.
    2. RLS policy cho phép người dùng đọc danh mục khóa học đã duyệt (`review_status = 'APPROVED'`).
    3. Endpoint `/api/courses` trả về danh sách khóa học theo `domain_id`.
  - **Lệnh kiểm chứng:** Gọi GET `/api/courses?domain=DIGCOMP_D1` trả về các khóa học tương ứng.
  - **Phụ thuộc:** Checkpoint 1
  - **Files:** `src/database/migrations/24_create_course_catalog.sql`, `src/database/seeds/06_course_catalog_seed.sql`, `src/app/api/courses/route.ts`
  - **Size:** M (3 files, ~150 dòng)

- [x] **Task 2.2: Tái Thiết Kế Trang `personal/learning-path/page.tsx` Theo Miền Ưu Tiên & Khóa Tuyển Chọn (PERS-05)**
  - **Mô tả:** Viết lại trang `/personal/learning-path` để thực thi đúng vòng lặp 4 bước: (1) Nhận diện miền < 70% từ kết quả khảo thí; (2) Hiển thị 2 lựa chọn song song: Học liệu trong NEXA hoặc Khóa học tuyển chọn bên ngoài (có link chính thức, ghi rõ chi phí); (3) Cho phép người dùng lưu vào lộ trình hoặc đánh dấu đã học; (4) Nút CTA "Đánh giá lại miền này".
  - **Tiêu chuẩn nghiệm thu:**
    1. Trang hiển thị các khối theo từng miền cần cải thiện (score < 70%).
    2. Khóa học hiển thị đầy đủ: Tên, Đơn vị cung cấp, Thời lượng, Nhãn miễn phí/có phí, và link trực tiếp sang trang nguồn.
    3. Đánh dấu đã học lưu trạng thái vào CSDL và không tự động cấp chứng chỉ năng lực khi chưa thi lại.
  - **Lệnh kiểm chứng:** Kiểm tra route `/personal/learning-path` với tài khoản có miền < 70%.
  - **Phụ thuộc:** Task 2.1
  - **Files:** `src/app/(dashboard)/personal/learning-path/page.tsx`, `src/app/api/personal/learning-plan/route.ts`
  - **Size:** M (2 files, ~180 dòng)

- [x] **Task 2.3: Ràng Buộc AI Recommender Chỉ Gợi Ý `course_id` Hợp Lệ từ Catalog Đã Duyệt (PERS-06, PERS-13)**
  - **Mô tả:** Trong service gợi ý AI (`/api/ai/analyze-competency` và `gemini.adapter.ts`), cung cấp danh sách ID các khóa học đã được duyệt từ `course_catalog` vào prompt context. Kiểm tra kết quả trả về của AI: nếu AI sinh ID không tồn tại trong database, backend tự động lọc bỏ và thay bằng khóa học phù hợp nhất theo quy tắc deterministic. Tuyệt đối không để AI tự bịa URL hoặc tên khóa học.
  - **Tiêu chuẩn nghiệm thu:**
    1. AI chỉ trả về `recommendedCourseIds[]` và giải thích lý do vì sao miền đó cần học khóa này.
    2. Server loại bỏ mọi ID ảo không có trong bảng `course_catalog`.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/ai-gateway/adapters/gemini.adapter.test.ts`
  - **Phụ thuộc:** Task 2.1, Task 2.2
  - **Files:** `src/features/ai-gateway/adapters/gemini.adapter.ts`, `src/app/api/ai/analyze-competency/route.ts`
  - **Size:** S (2 files, ~80 dòng)

- [x] **Checkpoint 2: Hoàn tất Giai đoạn 2**
  - Chạy `npm test` và `npm run typecheck`. Xác nhận vòng lặp: Đánh giá 5 miền -> Gợi ý khóa tuyển chọn -> Tiến độ -> Đánh giá lại hoạt động liền mạch.

---

## Giai Đoạn 3: Quản Lý Tác Vụ, Chấm Bài & Bảng Xếp Hạng

- [x] **Task 3.1: Đổi Tab Mặc Định Thành `Cần xử lý` trong `personal/submissions/page.tsx` (PERS-10)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/submissions/page.tsx`, đổi tab mặc định từ "Sắp tới" thành "Cần xử lý" (`action_required`). Ưu tiên hiển thị các bài tập đã quá hạn (Overdue) hoặc sát hạn nộp lên đầu danh sách để học viên không bị bỏ sót bài cần làm.
  - **Tiêu chuẩn nghiệm thu:**
    1. Vào trang `/personal/submissions`, tab "Cần xử lý" được chọn mặc định.
    2. Nếu có bài quá hạn, xuất hiện badge cảnh báo màu cam/đỏ tinh tế và nút "Nộp ngay".
  - **Lệnh kiểm chứng:** Mở trang `/personal/submissions` và kiểm tra tab hiển thị đầu tiên.
  - **Phụ thuộc:** Checkpoint 2
  - **Files:** `src/app/(dashboard)/personal/submissions/page.tsx`
  - **Size:** S (1 file, ~40 dòng)

- [x] **Task 3.2: Tích Hợp Nút Chấm Bài Theo Ngữ Cảnh Vào Đề Thi & Nhóm Lớp (PERS-08)**
  - **Mô tả:** Vì `Bàn chấm bài` đã được rút khỏi sidebar cấp 1, thêm các entry point ngữ cảnh: (1) Trên Dashboard: Card "Bài chờ chấm (n)" khi người dùng có quyền chấm bài trong lớp học; (2) Trong trang quản lý đề (`/personal/authoring`): Nút "Xem bài nộp / Bàn chấm"; (3) Trong chi tiết lớp học (`/personal/groups/[groupId]`): Nút "Chấm bài" cạnh từng bài tập đã giao.
  - **Tiêu chuẩn nghiệm thu:**
    1. Giảng viên/Người tạo đề dễ dàng mở Bàn chấm bài trực tiếp từ đề thi hoặc lớp học của mình.
    2. URL chuyển tiếp truyền kèm query param `?assignmentId=...` hoặc `?assessmentId=...` để Bàn chấm lọc đúng ngữ cảnh.
  - **Lệnh kiểm chứng:** Kiểm tra các liên kết dẫn đến `/personal/grading` từ `authoring` và `groups`.
  - **Phụ thuộc:** Task 1.3
  - **Files:** `src/app/(dashboard)/personal/authoring/page.tsx`, `src/app/(dashboard)/personal/groups/[groupId]/page.tsx`, `src/app/(dashboard)/personal/dashboard/page.tsx`
  - **Size:** M (3 files, ~80 dòng)

- [x] **Task 3.3: Dọn Dẹp Mock Data & Thu Gọn Gamification trong `personal/leaderboard/page.tsx` (PERS-09)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/leaderboard/page.tsx`, loại bỏ `fallbackLeaderboard` chứa danh sách người dùng mẫu khi API lỗi hoặc rỗng. Hiển thị thông báo rỗng hoặc lỗi trung thực kèm nút tải lại. Ghi rõ nhãn "Bảng xếp hạng Điểm Tích Lũy (XP)" để phân biệt với Năng lực số. Thu gọn bục vinh danh (Podium) để tránh chiếm diện tích vô ích.
  - **Tiêu chuẩn nghiệm thu:**
    1. Khi API trả rỗng hoặc lỗi, hiển thị Empty/Error state trang nhã, không sinh ra người dùng giả mạo.
    2. Giao diện ghi rõ tiêu chí xếp hạng là XP/Hoạt động.
  - **Lệnh kiểm chứng:** Kiểm tra trang `/personal/leaderboard`.
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/(dashboard)/personal/leaderboard/page.tsx`
  - **Size:** S (1 file, ~60 dòng)

- [x] **Checkpoint 3: Hoàn tất Giai đoạn 3**
  - Chạy `npm test` và `npm run typecheck`. Toàn bộ luồng tác vụ, chấm bài ngữ cảnh và leaderboard sạch dữ liệu mẫu.

---

## Giai Đoạn 4: Thanh Toán Checkout Trang Riêng (payOS) & Đánh Bóng UI

- [x] **Task 4.1: Xây Dựng Chuỗi Trang Billing Checkout Trang Riêng Thay Thế QR Modal (PERS-08, PERS-09)**
  - **Mô tả:** Xóa bỏ `showQrModal` trong `src/app/(dashboard)/personal/billing/page.tsx`. Xây dựng trang riêng `/personal/checkout/[orderId]/page.tsx` hiển thị mã QR VietQR từ payOS, số tiền thanh toán chính xác từ backend, mã đơn hàng, và đồng hồ đếm ngược. Xây dựng trang kết quả `/personal/billing/result/page.tsx` phục vụ việc hiển thị trạng thái sau khi quét mã thanh toán.
  - **Tiêu chuẩn nghiệm thu:**
    1. Bấm chọn gói tại `/personal/billing` điều hướng sang `/personal/checkout/[orderId]`.
    2. Trang checkout hiển thị VietQR do payOS cung cấp và tự động kiểm tra trạng thái thanh toán qua polling `/api/billing/status`.
    3. F5 trang checkout giữ nguyên phiên đơn hàng, không tạo order trùng lặp.
    4. Thanh toán thành công chuyển hướng sang `/personal/billing/result?orderId=...`.
  - **Lệnh kiểm chứng:** Chạy thử luồng tạo order và render trang checkout.
  - **Phụ thuộc:** Checkpoint 3
  - **Files:** `src/app/(dashboard)/personal/billing/page.tsx`, `src/app/(dashboard)/personal/checkout/[orderId]/page.tsx`, `src/app/(dashboard)/personal/billing/result/page.tsx`
  - **Size:** M (3 files, ~200 dòng)

- [x] **Task 4.2: Tích Hợp Link "Gói & Nâng Cấp" Vào User Avatar Menu & Đánh Bóng Toàn Diện UI (PERS-12)**
  - **Mô tả:** Thêm mục "Gói dịch vụ & Thanh toán" vào `PersonalAvatarMenu.tsx`. Rà soát toàn bộ giao diện theo chuẩn `AGENTS.md`: phông chữ `JetBrains Mono` cho điểm số/tiền/mã PIN, viền mỏng 1px `border-slate-200`, không dùng emoji trong JSX, 100% icon nét mảnh từ `lucide-react`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Người dùng truy cập Billing từ Avatar menu góc trên bên phải hoặc khi hết lượt AI.
    2. Không có icon/emoji vi phạm `AGENTS.md`.
    3. Độ tương phản chữ và trợ năng WCAG AA đạt chuẩn.
  - **Lệnh kiểm chứng:** `npm run typecheck` và `npm run build`
  - **Phụ thuộc:** Task 4.1
  - **Files:** `src/components/dashboard/personal/PersonalAvatarMenu.tsx`, `src/components/dashboard/personal/PersonalTopbar.tsx`
  - **Size:** S (2 files, ~50 dòng)

- [x] **Checkpoint 4: Kiểm Thử Toàn Trình & Nghiệm Thu Sản Phẩm**
  - **Tiêu chuẩn nghiệm thu:**
    1. `npm run typecheck` đạt 0 lỗi.
    2. `npm test` vượt qua 100% test suites.
    3. Tất cả 4 giai đoạn hoàn thành theo đúng tiêu chí trong `tasks/plan.md`.
