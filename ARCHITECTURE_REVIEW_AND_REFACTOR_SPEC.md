# TÀI LIỆU REVIEW KIẾN TRÚC & ĐẶC TẢ TÁI CẤU TRÚC HỆ THỐNG KHẢO THÍ NEXA
> **Vai trò tài liệu:** Bản chỉ dẫn kỹ thuật bắt buộc (Single Source of Truth) dành cho AI Coding Agent.
> **Mục tiêu:** Đập bỏ toàn bộ giao diện "AI Slop" (thẻ thống kê giả, modal chật hẹp, chia tab vô nghĩa), sửa triệt để lỗi đứt gãy luồng dữ liệu giữa **Admin – Evaluator – Learner**, và xây dựng lại luồng **Assessment Studio + Phòng Thi Live (Live Room)** theo chuẩn SaaS thực chiến.

---

## PHẦN 1: CHẨN ĐOÁN LỖI HIỆN TẠNG (ROOT CAUSE ANALYSIS)

Qua kiểm tra mã nguồn dự án và giao diện thực tế đang chạy trên `localhost:3000`, hệ thống hiện tại đang mắc các lỗi nghiêm trọng về cả UX lẫn kiến trúc dữ liệu:

### 1. Hội chứng "Giao diện mùi AI" (AI Slop UI Anti-Patterns) — CẦN XÓA BỎ NGAY
* **Thẻ KPI giả tạo (Fake/Static Metric Cards):**
  * Tại `/evaluator/assessments` (`src/app/(dashboard)/evaluator/assessments/page.tsx`), giao diện đang hiển thị 3 khối thẻ lớn chiếm diện tích vô ích: `"Tổng số bài khảo thí: 1"`, `"Hình thức câu hỏi tích hợp: 4 / 4"`, `"Phòng thi PIN trực tiếp: Sẵn sàng"`.
  * Tại `/evaluator/assessments/new` (`src/app/(dashboard)/evaluator/assessments/new/page.tsx`), đầu trang lại lặp lại 4 ô trạng thái (`0 câu`, `0 điểm`, `45 phút`, `Giám sát chuyển tab`) trùng lặp hoàn toàn với form nhập liệu bên dưới.
* **Chia Tab bất hợp lý khi soạn đề:**
  * Trang tạo đề `/evaluator/assessments/new` tách rời `"1. Cấu Hình Chung & 5 Miền Năng Lực"` và `"2. Ma Trận Câu Hỏi & Nạp Đề (0)"` thành 2 tab riêng biệt, bắt người dùng cuộn một trang form dài rồi mới được bấm sang tab kia để thêm câu hỏi.
* **Nút CTA trùng lặp vô duyên:**
  * Tại `/learner/assessments` (`src/app/(dashboard)/learner/assessments/page.tsx`), nút `"+ Góp đề thi cộng đồng"` xuất hiện tới 2 lần ngay trên cùng một màn hình (1 nút ở Sidebar trái, 1 nút ở Header phải cạnh nút `"Nhập mã PIN phòng thi"`).

### 2. Đứt gãy luồng dữ liệu & Sai lệch vai trò (Admin vs. Evaluator vs. Learner)
* **Admin sai hoàn toàn chức năng điều phối kho đề:**
  * Admin (`src/app/(dashboard)/admin/content/page.tsx` và `admin-assessment-bank-client.tsx`) hiện đang ôm cả tab "Học liệu bồi dưỡng" dư thừa nhưng lại thiếu bộ công cụ chuẩn hóa đề thi hệ thống (thiếu nút gạt Publish nhanh, thiếu phân loại bài thi, thiếu cấu hình thời gian/điểm chuẩn/phân hạng FREE-VIP trực quan và thiếu Full-Page Studio).
* **Learner không thấy đề thi nào (`Hiển thị 0 bài khảo thí`):**
  * Trên `/learner/assessments`, người học nhận thông báo `"Chưa có bài khảo thí nào / Hiện chưa có bài thi nào được mở công khai"`, trong khi trong Database đã có đề `ASM-A00000` (`"Đánh Giá Năng Lực Số Chuẩn Quốc Gia & EU DigComp"`). Nguyên nhân là đề đang ở trạng thái `"Bản nháp"` (`is_published = false`) nhưng không có luồng kích hoạt phát hành rõ ràng từ Admin sang Learner.
* **Evaluator bị lẫn lộn quyền hạn với Admin:**
  * Trong trang `/evaluator/assessments/new`, nút hành động chính lại ghi là `"Phát Hành Cho Người Học"`. Evaluator (Giảng viên/HR) chỉ được phép lưu đề vào kho cá nhân để **Mở phòng thi Live** hoặc **Giao cho Lớp học (`Groups`)**, tuyệt đối không được tự ý đẩy đề nháp cá nhân ra chợ đề công khai của toàn hệ thống (vốn thuộc quyền của Admin).
  * Bảng danh sách đề tại `/evaluator/assessments` chỉ có duy nhất 1 nút `"Mở phòng"` ở cột Thao tác; thiếu hoàn toàn nút **Sửa đề/Câu hỏi**, **Giao cho lớp**, **Nhân bản**, và **Xóa đề**.

### 3. Luồng Phòng Thi Trực Tiếp (`/evaluator/live-room`) rườm rà và đầy rác dữ liệu
* Tại `src/app/(dashboard)/evaluator/live-room/page.tsx`, việc bắt người dùng tạo phòng thủ công bằng tên tự gõ sinh ra các thẻ phòng rác như `"ádfsadf"` (PIN `591 119`) và `"ádfasfd"` (PIN `935 204`).
* Phòng `935 204` mang trạng thái `"ĐANG THI (IN PROGRESS)"` nhưng có `"0 thí sinh"` — lỗi logic nghiêm trọng do cho phép bấm bắt đầu thi khi chưa có học viên nào trong phòng.
* Trên mỗi thẻ phòng thi không có nút **Đóng phòng / Xóa phòng**, và giảng viên phải bấm thêm một bước trung gian `"VÀO PHÒNG ĐIỀU PHỐI TOÀN MÀN HÌNH (LIVE CONTROL)"` rất mất thời gian.

---

## PHẦN 2: QUY TẮC THIẾT KẾ UI/UX BẮT BUỘC CHO AGENT (DESIGN GUARDRAILS)

Khi viết hoặc sửa code React/Next.js + TailwindCSS trong dự án này, Agent **BẮT BUỘC** tuân thủ 5 nguyên tắc sau:

1. **CẤM tạo Fake KPI Cards:** Không vẽ các ô thống kê vô nghĩa kiểu `"4/4 Hình thức tích hợp"` hay `"Hệ thống: Sẵn sàng"`. Nếu hiển thị số liệu, chỉ dùng một thanh **Compact Status Bar** mỏng (chiều cao tối đa `40px`) hiển thị số thật từ DB.
2. **CẤM dùng Modal nhỏ để tạo/sửa đề thi:** Toàn bộ thao tác tạo mới và chỉnh sửa đề thi của cả Admin lẫn Evaluator phải dùng chung một kiến trúc **Full-Page 3-Pane Assessment Studio** (Bố cục 3 cột trên 1 màn hình, không cuộn trang dài, không chia tab Cấu hình riêng - Câu hỏi riêng).
3. **Mật độ thông tin cao, sắc nét (Linear / Vercel Aesthetic):** Sử dụng nền sáng chuẩn `#FFFFFF` / `#F8FAFC`, viền mảnh `border-slate-200`, font chữ rõ ràng, dùng `font-mono` (JetBrains Mono) cho các mã đề (`ASM-A00000`), mã PIN (`591 119`), thời gian và điểm số.
4. **Hành động trực tiếp (Direct Manipulation):** Mọi dòng trong bảng (Table Row) phải có đầy đủ Action thực tế: `Switch Toggle` để bật/tắt trạng thái, nút `Sửa`, `Mở phòng Live`, `Giao bài`, `Xóa`. Không làm bảng cụt.
5. **Zero-Any & Strict TypeScript:** Mọi thay đổi phải vượt qua `npm run build` mà không phát sinh lỗi Type hay ESLint.

---

## PHẦN 3: KIẾN TRÚC PHÂN QUYỀN & LUỒNG NGHIỆP VỤ CHUẨN (ROLE MATRIX)

Hệ thống phân tách rõ 3 vai trò với phạm vi dữ liệu (`scope`) độc lập:

| Thuộc tính / Luồng | 1. ADMIN (`/admin/content`) | 2. EVALUATOR (`/evaluator/assessments`) | 3. LEARNER (`/learner/assessments`) |
| :--- | :--- | :--- | :--- |
| **Vai trò cốt lõi** | Quản trị **Kho Đề Chuẩn Hệ Thống** (Quốc gia / EU DigComp). | Quản lý **Đề Kiểm Tra Cá Nhân** & **Tổ Chức Thi Lớp Học**. | Khám phá đề công khai để tự luyện/thi lấy chứng chỉ, hoặc vào phòng thi theo PIN/Lớp. |
| **Phạm vi hiển thị đề** | Đề của Admin khi bật `is_published = true` sẽ xuất hiện công khai tại `/learner/assessments`. | Đề của Evaluator chỉ phục vụ cho chính Evaluator đó để **Mở Phòng Live** hoặc **Giao vào Nhóm/Lớp (`Groups`)**. | Chỉ nhìn thấy đề Hệ thống đã `Published` tại Kho đề, và các đề được Evaluator giao trong Lớp / Phòng PIN. |
| **Cấu hình trên Đề thi** | • Tiêu đề, Mô tả<br>• **Loại đánh giá:** `Sát hạch Chứng chỉ` / `Luyện theo Miền` / `Chẩn đoán đầu vào`<br>• **Miền DigComp:** Chọn `1..5` hoặc `Đa miền`<br>• **Thời lượng (phút)** & **Điểm đạt (%)**<br>• **Phân hạng:** `FREE` hoặc `VIP`<br>• **Chống gian lận:** Bật/Tắt giám sát tab<br>• **Trạng thái:** `Nháp` ↔ `Công khai (Published)` | • Tiêu đề, Mô tả<br>• **Miền DigComp:** Chọn `1..5` hoặc `Đa miền`<br>• **Thời lượng (phút)** & **Điểm đạt (%)**<br>• **Chống gian lận:** Bật/Tắt giám sát tab<br>• **Cấu hình ca thi:** Trộn câu hỏi, Cho xem đáp án sau khi nộp<br>• **Trạng thái:** `Nháp` ↔ `Sẵn sàng tổ chức` | Không có quyền cấu hình. Xem thông tin quy chế thi rõ ràng trước khi bấm `"Bắt đầu làm bài"`. |

---

## PHẦN 4: ĐẶC TẢ CHI TIẾT CÁC MODULE CẦN TÁI CẤU TRÚC (IMPLEMENTATION SPEC)

### MODULE 1: Chuẩn Hóa Bộ Nạp CSV/Excel 3 Dạng Bài & 5 Miền DigComp
**File tác động:**
* `[MODIFY]` `src/features/assessments/utils/csv-helper.ts`
* `[MODIFY]` `src/features/assessments/utils/csv-helper.test.ts`
* `[MODIFY]` `src/app/api/admin/assessments/[id]/import/route.ts`

**Yêu cầu kỹ thuật:**
1. **Chuẩn hóa cột `domain`:** Chỉ cần nhập số nguyên `1`, `2`, `3`, `4`, `5` (tương ứng 5 Miền năng lực DigComp) hoặc chuỗi phân cách bằng dấu chấm phẩy/phẩy `"1;2"` cho câu hỏi đa miền. Không bắt buộc nhập mã kỹ năng con (`1.1`, `2.1`).
2. **Tách biệt 3 Template & 3 Parser rõ ràng:**
   * `downloadMCQTemplate()` & `parseMCQCSV(text)`: Cột `domain, question, option_a, option_b, option_c, option_d, correct_option, explanation, points`.
   * `downloadScenarioTemplate()` & `parseScenarioCSV(text)`: Cột `domain, scenario_context, question, option_a, option_b, option_c, option_d, best_option, explanation, points`.
   * `downloadPracticalTemplate()` & `parsePracticalCSV(text)`: Cột `domain, task_title, task_description, submission_type (FILE/LINK/BOTH), criterion_1_name, criterion_1_weight, criterion_2_name, criterion_2_weight, criterion_3_name, criterion_3_weight, points`.
3. Đảm bảo thêm BOM `\uFEFF` khi xuất file CSV để mở bằng Microsoft Excel trên Windows không bị lỗi font tiếng Việt.

---

### MODULE 2: Xây Dựng Shared Component "3-Pane Assessment Studio" (Dùng Chung Cho Admin & Evaluator)
**File tác động:**
* `[NEW]` `src/features/assessments/components/AssessmentStudio.tsx`
* `[NEW]` `src/app/(dashboard)/admin/content/assessments/new/page.tsx`
* `[MODIFY]` `src/app/(dashboard)/admin/content/assessments/[id]/page.tsx`
* `[MODIFY]` `src/app/(dashboard)/admin/content/assessments/[id]/assessment-detail-client.tsx`
* `[MODIFY]` `src/app/(dashboard)/evaluator/assessments/new/page.tsx`
* `[NEW]` `src/app/(dashboard)/evaluator/assessments/[id]/page.tsx`

**Yêu cầu thiết kế giao diện (3-Column Split-Pane Studio):**
Xóa bỏ hoàn toàn giao diện 2 Tab cũ ở `/evaluator/assessments/new` và các modal tạo đề nhỏ lẻ. Thay bằng bố cục 3 cột cố định chiều cao màn hình (`h-[calc(100vh-4rem)] overflow-hidden flex flex-col`):

1. **Top Action Bar (Thanh công cụ trên cùng - cố định):**
   * Bên trái: Nút `[← Quay lại]`, Ô nhập trực tiếp `Tiêu đề đề khảo thí` (Inline editable input lớn), Badge trạng thái (`Bản nháp` / `Đã phát hành`).
   * Bên phải:
     * Nếu `role === 'ADMIN'`: Nút `[Lưu bản nháp]` và Nút chính `[Công khai sang Người học (Publish)]`.
     * Nếu `role === 'EVALUATOR'`: Nút `[Lưu đề thi]` và Nút chính `[Lưu & Mở Phòng Live Ngay]`.
2. **Cột Trái (Question Navigator - rộng `280px`, cuộn độc lập):**
   * 3 nút thêm nhanh câu hỏi: `[+ Trắc nghiệm]`, `[+ Tình huống]`, `[+ Thực hành]`.
   * Nút `[📥 Nạp hàng loạt từ Excel]` -> Mở Modal gọn có 3 tab tương ứng 3 dạng bài (`MCQ`, `Scenario`, `Practical`) kèm nút tải file mẫu tương ứng.
   * Danh sách câu hỏi dạng thẻ gọn (`Câu 01 [MCQ] - Miền 1`, `Câu 02 [TH] - Miền 2`...). Bấm vào câu nào sẽ focus câu đó ở Cột Giữa; hỗ trợ đổi thứ tự và xóa câu hỏi.
3. **Cột Giữa (Live Question Editor Canvas - `flex-1`, cuộn độc lập):**
   * Hiển thị trình soạn thảo chi tiết của câu hỏi đang chọn ở Cột Trái:
     * Nếu là **MCQ**: Ô nhập câu hỏi, 4 phương án A/B/C/D (click chọn radio đáp án đúng), giải thích đáp án.
     * Nếu là **SCENARIO**: Ô nhập bối cảnh tình huống thực tế (Context Box), câu hỏi xử lý, các phương án hành động và giải thích.
     * Nếu là **PRACTICAL**: Ô nhập đề bài sản phẩm thực hành, chọn hình thức nộp bài cho phép (`Tải tệp tin`, `Dán liên kết số`, hoặc `Cả hai`), và bảng cấu hình tiêu chí chấm **Rubric** (Tên tiêu chí + Trọng số điểm).
4. **Cột Phải (Assessment & Question Settings Inspector - rộng `320px`, cuộn độc lập):**
   * **Khối 1 - Cấu hình chung của Đề thi:**
     * `Miền năng lực (1..5 / Đa miền)`: Các chip chọn nhanh `Miền 01` .. `Miền 05` hoặc `Chọn cả 5 Miền`.
     * `Thời gian làm bài (phút)`: Input số (VD: `30`, `45`, `60`).
     * `Điểm chuẩn đạt (%)`: Input số (VD: `70%`).
     * `Loại bài đánh giá` *(Chỉ hiện với Admin)*: `Sát hạch cấp Chứng chỉ` | `Luyện tập theo Miền` | `Chẩn đoán đầu vào`.
     * `Phân hạng truy cập` *(Chỉ hiện với Admin)*: Toggle `FREE` / `VIP`.
     * `Chế độ giám sát (Anti-cheat)`: Toggle Bật/Tắt cảnh báo chuyển tab (Mặc định chỉ khóa ở câu MCQ/Scenario, tự động mở ở câu Practical).
   * **Khối 2 - Thuộc tính của Câu hỏi đang chọn:**
     * Gán câu hỏi thuộc Miền năng lực nào (`1..5`).
     * Điểm số của câu hỏi (VD: `1.0 điểm`).
     * Mức độ nhận thức: `Cơ bản` | `Trung cấp` | `Nâng cao`.

---

### MODULE 3: Làm Lại Hoàn Toàn Trang Quản Lý Đề Của Admin (`/admin/content`)
**File tác động:**
* `[MODIFY]` `src/app/(dashboard)/admin/content/page.tsx`
* `[MODIFY]` `src/app/(dashboard)/admin/content/admin-assessment-bank-client.tsx`
* `[MODIFY]` `src/app/api/admin/assessments/route.ts`
* `[MODIFY]` `src/app/api/admin/assessments/[id]/route.ts`

**Yêu cầu kỹ thuật:**
1. **Xóa bỏ 100% tab "Module học liệu bồi dưỡng"** và bỏ truy vấn bảng `learning_modules` tại `/admin/content/page.tsx`.
2. **Thanh lọc & Thống kê 1 dòng (Compact Filter Bar):**
   * Tìm kiếm theo tên/mã đề, lọc theo 5 Miền DigComp, lọc theo Phân hạng (`FREE`/`VIP`), lọc theo Trạng thái (`Đã công khai` / `Bản nháp`).
   * Nút chính góc phải: `[+ Tạo Đề Chuẩn Mới]` dẫn thẳng sang `/admin/content/assessments/new` (Full-Page Studio).
3. **Bảng Quản Trị Đề Chuẩn Hệ Thống:**
   * Hiển thị rõ các cột:
     1. `Đề khảo thí` (Tên đề + Mã đề `ASM-...` + Loại bài đánh giá).
     2. `Miền DigComp` (Badge `Miền 01`..`05` hoặc `Đa miền`).
     3. `Cấu trúc & Thời lượng` (VD: `20 câu (15 MCQ • 3 TH • 2 Thực hành) • 45 phút`).
     4. `Điểm đạt` (VD: `70%`).
     5. `Phân hạng` (Badge `FREE` xanh lá hoặc `VIP` tím; cho phép click đổi nhanh).
     6. `Phát hành (Public)` (**Switch Toggle trực tiếp trên dòng**): Khi Admin gạt bật (`is_published = true`), gọi API `PATCH /api/admin/assessments/[id]` cập nhật ngay lập tức để đề xuất hiện bên trang `/learner/assessments` của Người học.
     7. `Thao tác`: `[Sửa trong Studio]`, `[Xem thử]`, `[Xóa]`.

---

### MODULE 4: Tinh Gọn Quản Lý Đề Của Evaluator (`/evaluator/assessments`)
**File tác động:**
* `[MODIFY]` `src/components/dashboard/evaluator/EvaluatorSidebar.tsx`
* `[MODIFY]` `src/app/(dashboard)/evaluator/assessments/page.tsx`

**Yêu cầu kỹ thuật:**
1. **Dọn dẹp Sidebar (`EvaluatorSidebar.tsx`):** Xóa bỏ mục menu `"Ngân hàng câu hỏi"` (`/evaluator/item-bank`) rời rạc; hợp nhất toàn bộ việc soạn câu hỏi và đề thi vào mục `"Quản lý Đề thi"` (`/evaluator/assessments`).
2. **Xóa 3 thẻ KPI giả tạo** ở đầu trang `/evaluator/assessments/page.tsx` và xóa nút ẩn/hiện đáp án vô nghĩa.
3. **Nâng cấp Bảng/Danh sách Đề thi của Evaluator:**
   * Mỗi đề thi hiển thị rõ: Tên đề, Mã đề, Miền năng lực, Số lượng câu hỏi theo từng dạng (`MCQ / Tình huống / Thực hành`), Thời gian làm bài, Chuẩn đạt.
   * **Cột Thao tác phải có đủ 4 hành động rõ ràng:**
     1. **`[Phát sóng Live]` (Primary Button):** Bấm 1 click là tạo phiên phòng thi trực tiếp từ đề này và chuyển thẳng vào màn hình Điều phối Phòng chờ Live Room (không bắt nhập tên phòng thủ công).
     2. **`[Giao cho lớp]`:** Mở popover/modal chọn Lớp học (`Groups`) và chọn `Hạn nộp (Deadline)` để giao bài về nhà.
     3. **`[Sửa đề]`:** Dẫn vào `/evaluator/assessments/[id]` (3-Pane Studio) để thêm/sửa câu hỏi.
     4. **`[Xóa]`:** Xóa đề nháp không dùng tới (có confirm).

---

### MODULE 5: Tái Thiết Kế Phòng Thi Trực Tiếp & Phòng Chờ Space Light (`/evaluator/live-room` & `/learner/live-pin`)
**File tác động:**
* `[MODIFY]` `src/app/(dashboard)/evaluator/live-room/page.tsx`
* `[MODIFY]` `src/app/api/evaluator/rooms/route.ts`
* `[MODIFY]` `src/app/api/rooms/join/route.ts`
* `[MODIFY]` `src/app/(dashboard)/learner/live-pin/page.tsx`
* `[NEW]` `src/app/(dashboard)/learner/live-pin/waiting-room/page.tsx`

**Yêu cầu kỹ thuật cho Luồng Giảng Viên (`/evaluator/live-room`):**
1. **Quản lý danh sách phòng gọn & sạch:**
   * Cho phép **Đóng / Xóa** ngay các phòng thi rác hoặc phòng đã kết thúc (cung cấp nút `[Kết thúc / Xóa phòng]` ngay trên thẻ phòng để dọn sạch các phòng test như `ádfsadf`).
   * Khi tạo phòng mới từ một Đề khảo thí, tự động lấy tên đề làm tên phiên thi (hoặc gợi ý tên chuẩn `[Tên đề] - Ca thi [Giờ]`), sinh **Mã PIN 6 số**, **QR Code**, và **Direct Link** (`/learner/live-pin?pin=XXXXXX`).
2. **Màn hình Điều Phối Phòng Thi (Live Host Console) gồm 2 chế độ tự động chuyển đổi:**
   * **Chế độ 1 - Khi phòng đang `WAITING` (Lobby Máy Chiếu):**
     * Hiển thị **Mã PIN 6 số** cỡ cực lớn (`text-6xl font-mono font-bold tracking-widest`), **Mã QR Code** sắc nét bên cạnh để học viên quét từ xa, và nút `[Sao chép Link tham gia]`.
     * Khu vực Sàn diễn Thí sinh: Hiển thị thời gian thực các bong bóng (`Avatar + Tên học viên`) vừa vào phòng kèm bộ đếm `"X thí sinh đã sẵn sàng"`.
     * Nút **`[BẮT ĐẦU BÀI THI CHO CẢ LỚP]`**: Bắt buộc **Disable** nếu số thí sinh `= 0` (chặn lỗi phòng `IN_PROGRESS` mà `0 thí sinh`).
   * **Chế độ 2 - Khi phòng chuyển sang `IN_PROGRESS` (Live Proctoring Matrix):**
     * Hiển thị đồng hồ đếm ngược thời gian làm bài của cả phòng + Nút `[Kết thúc & Thu bài]`.
     * Hiển thị bảng theo dõi học viên trực tiếp: Tên học viên, trạng thái (`Đang làm bài` / `Đã nộp bài`), điểm trắc nghiệm tức thì khi vừa nộp, và số lần cảnh báo rời tab (`⚠️ Vi phạm chuyển tab: X/3`).

**Yêu cầu kỹ thuật cho Luồng Người Học (`/learner/live-pin` & `/waiting-room`):**
1. **3 Cách Vào Phòng Mượt Mà:**
   * Học viên có thể: (a) Tự gõ mã PIN 6 số tại `/learner/live-pin`; (b) Quét mã QR; hoặc (c) Bấm vào Link trực tiếp `/learner/live-pin?pin=XXXXXX` (trang tự động đọc `searchParams.get('pin')`, tự điền và gọi API join phòng).
   * **Xử lý người vào muộn (Late Joiner):** Nếu khi học viên join mà trạng thái phòng đã là `IN_PROGRESS`, đẩy thẳng học viên vào trang làm bài `/learner/take/[assessmentId]?roomId=[roomId]` thay vì giữ ở phòng chờ.
2. **Giao diện Phòng Chờ Không Gian Sáng (`waiting-room/page.tsx` - Space Light Aesthetic):**
   * Nền sáng thanh thoát (`bg-slate-50/80` kết hợp lưới chấm mờ `radial-gradient`), thẻ thông tin đề thi ở trung tâm.
   * Các bong bóng thí sinh (`Avatar tròn + Tên`) nổi nhẹ nhàng bằng CSS keyframe float animation (giới hạn render tối đa 35 bong bóng trên DOM để mượt trên mobile, số dư hiển thị dạng `"+N bạn khác"`). Bong bóng của chính mình được tô viền xanh nổi bật (`ring-2 ring-sky-500`).
   * Lắng nghe tín hiệu Realtime (Supabase Realtime / Polling 2s): Ngay khi Evaluator bấm `"BẮT ĐẦU BÀI THI"` (`status === 'IN_PROGRESS'`), toàn bộ màn hình phòng chờ của học viên tự động chuyển hướng sang `/learner/take/[assessmentId]?roomId=[roomId]`.

---

### MODULE 6: Kho Đề Người Học & Màn Hình Thi Chống Gian Lận Thông Minh (`/learner/assessments` & `/learner/take/[id]`)
**File tác động:**
* `[MODIFY]` `src/app/(dashboard)/learner/assessments/page.tsx`
* `[MODIFY]` `src/app/api/assessments/route.ts`
* `[MODIFY]` `src/app/(dashboard)/learner/take/[id]/page.tsx`

**Yêu cầu kỹ thuật:**
1. **Sửa trang Kho Bài Khảo Thí (`/learner/assessments/page.tsx`):**
   * Xóa nút `"+ Góp đề thi cộng đồng"` bị lặp ở góc trên bên phải (chỉ giữ lại nút `"Nhập mã PIN phòng thi →"`).
   * Đảm bảo truy vấn lấy toàn bộ các bài khảo thí có `is_published = true` từ Admin và lọc chính xác theo **5 Miền năng lực DigComp** (`1..5`), **Dạng bài**, và **Phân hạng (`FREE`/`VIP`)**.
2. **Cơ chế Giám sát Chuyển Tab Thông minh (Context-Aware Smart Proctoring tại `/learner/take/[id]/page.tsx`):**
   * Lắng nghe sự kiện `document.addEventListener('visibilitychange')` (kèm debounce để tránh bắt nhầm thông báo hệ thống).
   * **Khi thí sinh đang ở câu hỏi Trắc nghiệm (`MCQ`) hoặc Tình huống (`SCENARIO`):**
     * Thanh trạng thái hiển thị badge: `"🛡️ Chế độ Giám sát Nghiêm ngặt: Không rời khỏi màn hình thi"`.
     * Nếu thí sinh chuyển tab, tăng biến đếm vi phạm và hiện modal cảnh báo rõ ràng: `"Cảnh báo: Bạn vừa rời khỏi màn hình thi (Lần X/3)"`. Quá 3 lần sẽ tự động khóa và nộp phần bài trắc nghiệm.
   * **Khi thí sinh chuyển sang câu hỏi Thực hành (`PRACTICAL`):**
     * Hệ thống **TẠM DỪNG** bộ đếm vi phạm chuyển tab.
     * Thanh trạng thái đổi sang màu xanh ngọc: `"🛠️ Phần Thực hành: Cho phép mở phần mềm/công cụ ngoài (Canva, Figma, Sheets, Docs...) để hoàn thiện sản phẩm"`.
3. **Khung Nộp Bài Thực Hành 3-trong-1 & Chấm Điểm Tức Thì:**
   * Hiển thị rõ đề bài + Bảng tiêu chí chấm **Rubric** ngay bên dưới đề.
   * Cung cấp khung nộp bài gồm: (1) Ô tải tệp minh chứng (`PDF, DOCX, ZIP, PNG, JPG`), (2) Ô dán liên kết số (`Google Drive, Figma, Canva, GitHub...`), và (3) Khung viết thuyết minh giải pháp.
   * Khi bấm **Nộp bài**: Chấm điểm phần `MCQ` & `SCENARIO` ngay lập tức (`0.01s`), trả về trang Kết quả kèm nút chủ động kích hoạt AI (`"Nhờ AI chấm bài Thực hành theo Rubric"` và `"Phân tích lộ trình năng lực bằng AI"`).

---

## PHẦN 5: TRÌNH TỰ THỰC THI DÀNH CHO AGENT (EXECUTION PLAN)

Agent hãy thực hiện lần lượt theo 5 bước sau và kiểm tra kiểu dữ liệu sau mỗi bước:

- [ ] **Bước 1:** Cập nhật `src/features/assessments/utils/csv-helper.ts` và unit test `csv-helper.test.ts` để hỗ trợ 5 Miền (`1..5`) và 3 bộ hàm Template/Parser (`MCQ`, `Scenario`, `Practical`).
- [ ] **Bước 2:** Xây dựng component dùng chung `src/features/assessments/components/AssessmentStudio.tsx` theo bố cục **3-Pane Split Screen** (Cột trái: Danh sách câu hỏi + Bulk Import 3 tab; Cột giữa: Live Editor; Cột phải: Cấu hình Đề & Câu hỏi).
- [ ] **Bước 3:** Tái cấu trúc luồng **Admin** (`/admin/content/page.tsx`, `admin-assessment-bank-client.tsx`, `/admin/content/assessments/new/page.tsx`, `/admin/content/assessments/[id]/page.tsx`) -> Xóa tab Học liệu, gắn Switch Toggle Publish 1-click và kết nối với `/learner/assessments/page.tsx` để Learner thấy ngay các đề đã Publish.
- [ ] **Bước 4:** Tái cấu trúc luồng **Evaluator** (`EvaluatorSidebar.tsx`, `/evaluator/assessments/page.tsx`, `/evaluator/assessments/new/page.tsx`) -> Xóa 3 thẻ KPI giả, xóa menu Ngân hàng câu hỏi rời, bổ sung đủ nút `[Phát sóng Live]`, `[Giao cho lớp]`, `[Sửa đề]`, `[Xóa]`.
- [ ] **Bước 5:** Nâng cấp cụm **Live Room & Exam Runner** (`/evaluator/live-room/page.tsx`, `/learner/live-pin/page.tsx`, `/learner/live-pin/waiting-room/page.tsx`, `/learner/take/[id]/page.tsx`) -> Hoàn thiện Phòng chờ Space Light bong bóng nổi, chặn lỗi mở phòng 0 thí sinh, gắn nút xóa/đóng phòng và kích hoạt Smart Proctoring theo ngữ cảnh câu hỏi.
- [ ] **Bước 6:** Chạy `npm run test` và `npm run build` để đảm bảo **0 TypeScript Errors** và **0 Build Errors**.