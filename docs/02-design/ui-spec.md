# ĐẶC TẢ GIAO DIỆN NGƯỜI DÙNG TOÀN DIỆN (UI SPECIFICATION)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-UI-SPEC`
- **Phiên bản:** `v3.2.1` (Đã khử trùng lặp nội dung, Thiết kế Tối giản Khoa học Khử Mùi AI & Tích hợp Nút Kích hoạt AI On-Demand)
- **Triết lý thẩm mỹ:** **Strict Monochrome & Data-First** (Phong cách Linear, Stripe, Kaggle — Nền trắng tinh khiết `#FFFFFF`, khung viền mảnh `1px solid #E2E8F0`, chữ đen than `#0F172A`, **1 màu nhấn duy nhất `#0284C7`**, tuyệt đối không dùng gradient tím lòe loẹt, không dùng 5 màu cầu vồng trên thẻ, không dùng emoji).

---

## 1. KIẾN TRÚC 3 BỘ SHELL DASHBOARD TÁCH BIỆT & QUY TẮC TRANG NGOÀI

### 1.1. Quy tắc Khu vực Trang Ngoài (`Public Layout` — Trước khi vào Dashboard)

- **Thanh điều hướng công khai (`PublicHeader.tsx`):** Gồm Logo NEXA (bên trái), các liên kết điều hướng ở giữa (`Trang chủ /`, `Tính năng /features`, `Khung năng lực /framework`, `Bảng giá /pricing`, `FAQ /faq`, `Liên hệ /contact-us`) và 2 nút hành động bên phải (`Đăng nhập`, `Bắt đầu đánh giá`).
- **Tuyệt đối không đặt ô hay liên kết "Tra cứu chứng chỉ QR" trên Landing Page hoặc PublicHeader.** Trang `/verify/[credentialId]` là trang Kiosk độc lập chỉ mở ra khi người dùng quét mã QR in trên chứng chỉ PDF.

### 1.2. Kiến trúc 3 Bộ Shell Độc lập (Zero-Shared Shell) & Không có Footer trong Dashboard

- Mỗi Dashboard (`Learner`, `Evaluator`, `Admin`) sở hữu bộ 3 component riêng biệt trong `src/components/shared/`:
  - `sidebar/`: `LearnerSidebar.tsx` (9 mục), `EvaluatorSidebar.tsx` (8 mục), `AdminSidebar.tsx` (11 mục). Chiều cao `100vh` cố định bên trái (`w-64`), Logo NEXA nằm trên đỉnh Sidebar.
  - `topbar/`: `LearnerTopbar.tsx`, `EvaluatorTopbar.tsx`, `AdminTopbar.tsx`. Cao `56px` (`h-14`), nền trắng phẳng, không lặp lại Logo, chứa Breadcrumb, công cụ thao tác nhanh, Chuông thông báo và AvatarMenu.
  - `avatar-menu/`: `LearnerAvatarMenu.tsx`, `EvaluatorAvatarMenu.tsx`, `AdminAvatarMenu.tsx`. Hiển thị Vai trò cố định, Gói dịch vụ hiện tại, Số lượt AI Credit còn lại, Chuyển đổi Sáng/Tối, Hồ sơ và Đăng xuất.
- **Tuyệt đối không có Footer trong toàn bộ các màn hình Dashboard.**

---

## 2. ĐẶC TẢ KHU VỰC CÔNG KHAI & XÁC THỰC (`PUBLIC & AUTH PAGES`)

### 2.1. Trang Chủ Công Khai (`/`) — Bố cục 7 Khối Tối Giản, Sắc Nét (Không màu mè AI)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PUBLIC HEADER: [NEXA]   Trang chủ  Tính năng  Khung năng lực  Bảng giá  FAQ  [Đăng nhập]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. HERO SECTION (Nền trắng #FFFFFF, lưới viền mảnh kỹ thuật)                           │
│ ┌──────────────────────────────────────────────────┬─────────────────────────────────┐ │
│ │ NỀN TẢNG ĐÁNH GIÁ & CHỨNG NHẬN NĂNG LỰC SỐ       │ [KHUNG MÔ PHỎNG BÁO CÁO SỐ LIỆU]│ │
│ │ Đo lường năng lực thực chất qua 4 hình thức      │ • Biểu đồ Radar đơn sắc tinh tế │ │
│ │ khảo thí kết hợp phân tích chuyên sâu bằng AI.   │ • Điểm tổng: 84/100 (Nâng cao)  │ │
│ │ [Bắt đầu đánh giá ngay]   [Vào phòng thi PIN/QR] │ • Lộ trình đề xuất: 3 học phần  │ │
│ └──────────────────────────────────────────────────┴─────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. BỐN HÌNH THỨC ĐÁNH GIÁ ĐA PHƯƠNG THỨC (4 cột phẳng, viền 1px #E2E8F0, icon đơn sắc) │
│ [01. Câu hỏi trắc nghiệm] [02. Câu hỏi tình huống] [03. Nhiệm vụ thực hành] [04. Sản phẩm & Minh chứng]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. NĂM ỨNG DỤNG TRÍ TUỆ NHÂN TẠO TRONG KHẢO THÍ & PHÁT TRIỂN (Split Preview)           │
│ • Hỗ trợ chấm điểm theo Rubric  • Phân tích điểm mạnh & điểm yếu  • Nhận diện khoảng trống│
│ • Tạo phản hồi cá nhân hóa      • Đề xuất lộ trình phát triển năng lực 4 bước          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. CẤU TRÚC KHUNG NĂNG LỰC SỐ CHUẨN (Bảng học thuật sạch sẽ, đánh mã số 1.1 -> 5.4)    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. HAI CHẾ ĐỘ SỬ DỤNG: CÁ NHÂN TỰ ĐÁNH GIÁ (B2C) & TỔ CHỨC KHẢO THÍ THEO NHÓM (B2B)    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 6. TÓM TẮT GÓI DỊCH VỤ (Learner Free/Pro & Evaluator Free/Pro/Enterprise)              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 7. PUBLIC FOOTER: Bản quyền NEXA • Tuân thủ Nghị định 13/2023/NĐ-CP • Liên hệ          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Trang Đăng ký (`/register`) — Chọn Vai trò Cố định

- Form đăng ký gồm: Họ và tên, Email, Mật khẩu, và **2 thẻ lựa chọn vai trò rõ ràng** (có ghi chú *"Vai trò được cố định vĩnh viễn sau khi đăng ký"*):
  - **Thẻ 1 — Người học (`LEARNER`):** Tự đánh giá năng lực số, học theo lộ trình AI, nhận chứng chỉ và đua bảng xếp hạng.
  - **Thẻ 2 — Người đánh giá (`EVALUATOR`):** Tạo nhóm lớp, mở phòng thi trực tiếp, ra đề 4 hình thức và chấm bài cùng AI.
- Hộp kiểm bắt buộc đồng ý điều khoản bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.

---

## 3. ĐẶC TẢ GIAO DIỆN PHÂN HỆ NGƯỜI HỌC (`LEARNER PORTAL`)

### 3.1. Khung Bố cục & 9 Mục Menu Điều hướng (`LearnerSidebar.tsx`)

```text
┌────────────────────┬───────────────────────────────────────────────────────────────────┐
│ NEXA      [Learner]│ LearnerTopbar: Breadcrumb | [Nhập PIN / Mã nhóm] [Chuông] [Avatar]│
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ 1. Tổng quan       │ KHU VỰC NỘI DUNG CHÍNH (MAIN VIEWPORT - Nền #F8FAFC / Thẻ #FFFFFF)│
│ 2. Bài đánh giá    │ ┌───────────────────────────────┬───────────────────────────────┐ │
│ 3. Phòng thi PIN   │ │ HỒ SƠ & THỨ HẠNG CÁ NHÂN      │ BIỂU ĐỒ NĂNG LỰC SỐ (RADAR)   │ │
│ 4. Nhóm học tập    │ │ Điểm TB: 78.5 • Bậc: Nâng cao │ (Vẽ 1 màu nhấn #0284C7 sắc nét│ │
│ 5. Lịch sử bài thi │ │ Điểm (point): 1,450 điểm (point) (Hạng #42)  │  trên lưới đa giác xám mảnh)  │ │
│ 6. Lộ trình học    │ └───────────────────────────────┴───────────────────────────────┘ │
│ 7. Bảng xếp hạng   │ ┌───────────────────────────────────────────────────────────────┐ │
│ 8. Chứng chỉ & Hồ sơ│ │ NHẬN XÉT MỚI TỪ NGƯỜI ĐÁNH GIÁ & TIẾN ĐỘ LỘ TRÌNH HỌC TẬP    │ │
│ 9. Gói dịch vụ     │ └───────────────────────────────────────────────────────────────┘ │
└────────────────────┴───────────────────────────────────────────────────────────────────┘
```

### 3.2. Chi tiết các Màn hình Trọng tâm của Người học

1. **Màn hình Phòng thi Trực tiếp (`/learner/live-pin`):**
   - Tự động đọc tham số `?pin=xxxxxx` trên URL nếu người học bấm vào Link hoặc quét QR từ giảng viên (đưa thẳng vào phòng chờ).
   - Nếu truy cập trực tiếp, hiển thị 6 ô nhập mã PIN (`font-mono`) kèm nút quét mã QR bằng camera thiết bị.
2. **Màn hình Nhóm học tập & Nhận xét của Người đánh giá (`/learner/groups`):**
   - Tự động đọc tham số `?join=CODE` trên URL để gia nhập nhóm ngay khi bấm link, hoặc nhập mã nhóm vào ô.
   - Bên trong mỗi nhóm hiển thị 2 tab:
     - **Tab 1 (Bài đánh giá của nhóm):** Danh sách các đề thi hoặc phòng thi trực tiếp do Người đánh giá giao.
     - **Tab 2 (Nhận xét từ Người đánh giá):** Hiển thị toàn bộ các lời nhận xét định kỳ, góp ý chuyên môn và hướng dẫn do Người đánh giá gửi riêng cho người học.
3. **Màn hình Làm bài 4 Hình thức (`/learner/take/[id]` — Zen Focus Mode):**
   - Tự động ẩn Sidebar; thanh trạng thái trên cùng hiển thị Đồng hồ đếm ngược, Chỉ báo *"Đã lưu tự động (15s)"* và danh sách số thứ tự câu hỏi.
   - Giao diện câu hỏi tự động thích ứng theo 4 hình thức: `MCQ`, `SCENARIO`, `PRACTICAL_TASK`, và `DIGITAL_EVIDENCE` (khung tải tệp $\le 25\text{MB}$ hoặc dán Link + ô bắt buộc nhập văn bản giải trình $\ge 30$ từ).
4. **Màn hình Báo cáo Kết quả & 2 Nút Kích hoạt AI Chủ động (`/learner/results/[id]`):**
   - Ngay khi bấm Nộp bài, trang này hiển thị tức thì (`0.01s`) điểm số phần câu hỏi khách quan (`MCQ` & nhánh chọn `SCENARIO`) cùng `RadarChart.tsx`.
   - **Khu vực Trợ lý AI Theo Yêu cầu (On-Demand AI Trigger):**
     - **Nút 1 — `[Kích hoạt AI Chấm bài Thực hành & Minh chứng]`:** Khi bấm mới gọi `POST /api/ai/grade-submission` để chấm theo Rubric 100%, hiển thị điểm từng tiêu chí và trích dẫn bằng chứng (`evidenceQuote`).
     - **Nút 2 — `[Kích hoạt AI Phân tích Năng lực & Tạo Lộ trình 4 Bước]`:** Khi bấm mới gọi `POST /api/ai/analyze-competency` để hiển thị Điểm mạnh/Điểm yếu, bảng Khoảng trống năng lực (`< 60%`), Phản hồi cá nhân hóa và tạo lộ trình học.
   - **Khối Nhận xét của Người đánh giá (nếu thi trong nhóm):** Hiển thị nổi bật lời phê chuyên môn và điểm chốt của giảng viên.
5. **Màn hình Lộ trình Phát triển Năng lực 4 Bước (`/learner/learning-path`):**
   - Hiển thị 3 chặng học liệu chuẩn được AI lắp ráp từ CSDL, nút *"Mở học liệu"*, nút *"Đánh dấu hoàn thành (+30 điểm (point))"* và nút *"Làm bài đánh giá lại kỹ năng"*.
6. **Màn hình Bảng xếp hạng Rank Top 100+ (`/learner/leaderboard`):**
   - Hiển thị thẻ Thứ hạng của bản thân và bảng xếp hạng Top 100+ (lọc theo Toàn hệ thống hoặc Trong Nhóm).

---

## 4. ĐẶC TẢ GIAO DIỆN PHÂN HỆ NGƯỜI ĐÁNH GIÁ (`EVALUATOR PORTAL`)

### 4.1. Cấu trúc 8 Mục Menu Điều hướng (`EvaluatorSidebar.tsx`)

1. **Tổng quan (`/evaluator/dashboard`):** Thống kê nhóm, học viên, bài nộp chờ duyệt và hồ sơ chuyên gia.
2. **Quản lý nhóm & Nhận xét (`/evaluator/groups`):** Chia sẻ nhóm qua **Link (`?join=CODE`)**, **Mã nhóm**, **QR Code** và bấm nút **"Gửi nhận xét cho học viên"**.
3. **Ngân hàng câu hỏi (`/evaluator/item-bank`):** Biên soạn câu hỏi 4 hình thức và trình dựng Ma trận Rubric kiểm tra tổng trọng số = 100%.
4. **Quản lý đề thi (`/evaluator/exams`):** Tổ hợp đề thi, giao bài cho nhóm hoặc mở Phòng thi trực tiếp.
5. **Phòng thi trực tiếp (`/evaluator/live-room`):** Mở được cả **Phòng thi Mở (Không cần nhóm)** và **Phòng thi theo Nhóm**; trình chiếu Link vào thi, Mã PIN 6 số và Mã QR lớn; giám sát cảnh báo rời tab.
6. **Chấm & Thẩm định (`/evaluator/grading` — Split-view Studio):**
   - Cột trái: Xem trực tiếp tệp PDF/Ảnh sản phẩm và văn bản giải trình của người học.
   - Cột phải: Người đánh giá có thể **Tự chấm thủ công (tốn 0 lượt AI)** hoặc chủ động bấm nút **`[Nhờ AI chấm gợi ý bài này]`** (hoặc chạy AI cho các bài đã chọn ở danh sách ngoài) để xem điểm gợi ý, trích dẫn bằng chứng (`evidenceQuote`), chấm tròn Cờ tin cậy (Xanh $\ge 0.85$, Cam $0.70 - 0.84$, Đỏ $< 0.70$), viết nhận xét gửi cho người học và đánh dấu *"Bài mẫu chuẩn (`Gold Sample`)"*.
7. **Phân tích & Xuất dữ liệu (`/evaluator/analytics`):** Biểu đồ Radar nhóm, Bản đồ nhiệt kỹ năng (`HeatmapChart.tsx`), chỉ số $P, D$ và nút **"Xuất dữ liệu khảo thí (Excel / CSV / PDF)"**.
8. **Gói dịch vụ & Hạn mức (`/evaluator/billing`):** Quản lý gói Free / Pro / Enterprise và thanh toán VietQR.

---

## 5. ĐẶC TẢ GIAO DIỆN CHỦ NỀN TẢNG (`SUPER ADMIN PORTAL`)

Bao gồm 11 mục quản trị toàn sàn trên `AdminSidebar.tsx`:

1. **Tổng quan vận hành (`/admin/dashboard`)**
2. **Quản lý người dùng (`/admin/users`)**
3. **Quản lý tổ chức B2B (`/admin/organizations`)**
4. **Xét duyệt chuyên gia (`/admin/evaluator-vetting`)**
5. **Khung năng lực số động (`/admin/framework-engine`)**
6. **Ngân hàng đề chuẩn NEXA (`/admin/benchmark-bank`)**
7. **Kho học liệu chuẩn (`/admin/learning-content`)**
8. **Gói dịch vụ & Đối soát (`/admin/pricing-plans`)**
9. **Quản lý & Thu hồi chứng chỉ (`/admin/credentials`)**
10. **Cấu hình AI Đa mô hình (`/admin/ai-gateway`)**
11. **Xuất dữ liệu nghiên cứu & Audit (`/admin/analytics`, `/admin/audit-logs`, `/admin/settings`)**
