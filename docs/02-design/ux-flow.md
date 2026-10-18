# THIẾT KẾ LUỒNG TRẢI NGHIỆM NGƯỜI DÙNG & QUY TRÌNH NGHIỆP VỤ (UX FLOW & PROCESS WORKFLOWS)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-UX-FLOW`
- **Phiên bản:** `v3.2.0` (Đồng bộ 100% Đường dẫn URL, 50 Use Cases, Mô hình B2C/B2B & 15 Luồng Nghiệp vụ)
- **Khung tham chiếu:** Khung Năng lực Số Chuẩn Động & Nghị định 13/2023/NĐ-CP
- **Phương pháp trực quan:** Sơ đồ khối văn bản (ASCII Box-Drawing) và luồng tiến trình rẽ nhánh (`──▶`, `▼`)

---

## I. BẢN ĐỒ KIẾN TRÚC ĐIỀU HƯỚNG TỔNG THỂ (MASTER SITEMAP & ROUTING FLOW)

```text
                      ┌──────────────────────────────────────────────────┐
                      │         KHU VỰC CÔNG KHAI (PUBLIC PAGES)         │
                      │   URL: / | /framework | /pricing | /faq          │
                      ├──────────────────────────────────────────────────┤
                      │ • Giới thiệu giải pháp đánh giá 4 hình thức      │
                      │ • 5 Ứng dụng AI & Biểu đồ năng lực mẫu           │
                      │ • Cấu trúc Khung năng lực số & Bảng giá B2C/B2B  │
                      │ (Không đặt ô tra cứu QR trên Header/Landing Page)│
                      └────────────────────────┬─────────────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               │ [Bấm: Đăng ký]                                                │ [Bấm: Đăng nhập]
               ▼                                                               ▼
┌──────────────────────────────────────────────┐               ┌──────────────────────────────────────────────┐
│           TRANG ĐĂNG KÝ HỆ THỐNG             │               │           TRANG ĐĂNG NHẬP HỆ THỐNG           │
│               URL: /register                 │               │                  URL: /login                 │
├──────────────────────────────────────────────┤               ├──────────────────────────────────────────────┤
│ 1. Nhập Họ tên, Email, Mật khẩu              │               │ 1. Đăng nhập Email + Mật khẩu                │
│ 2. CHỌN CỐ ĐỊNH 1 VAI TRÒ: Learner / Eval   │               │ 2. Hoặc đăng nhập nhanh Google OAuth         │
│ 3. Tích đồng thuận NĐ 13 & Xác thực OTP 6 số │               │ 3. Quên mật khẩu (/reset-password)           │
└──────────────────────┬───────────────────────┘               └──────────────────────┬───────────────────────┘
                       │                                                              │
                       └───────────────────────────────┬──────────────────────────────┘
                                                       │
                                                       ▼
                       ┌──────────────────────────────────────────────────────────────┐
                       │         CỔNG ĐIỀU PHỐI & PHÂN QUYỀN (SUPABASE MIDDLEWARE)    │
                       │       Kiểm tra Session & Vai trò tĩnh (1 Email = 1 Role)     │
                       └───────────────┬───────────────┬───────────────┬──────────────┘
                                       │               │               │
         ┌─────────────────────────────┘               │               └─────────────────────────────┐
         │ (ROLE_LEARNER)                              │ (ROLE_EVALUATOR)                            │ (ROLE_ADMIN - Chủ nền tảng)
         ▼                                             ▼                                             ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│       PHÂN HỆ NGƯỜI HỌC         │     │     PHÂN HỆ NGƯỜI ĐÁNH GIÁ      │     │     PHÂN HỆ CHỦ NỀN TẢNG        │
│        (LEARNER PORTAL)         │     │       (EVALUATOR PORTAL)        │     │      (SUPER ADMIN PORTAL)       │
│         URL: /learner/*         │     │        URL: /evaluator/*        │     │          URL: /admin/*          │
├─────────────────────────────────┤     ├─────────────────────────────────┤     ├─────────────────────────────────┤
│ 1. Tổng quan                    │     │ 1. Tổng quan khảo thí           │     │ 1. Tổng quan vận hành           │
│    /learner/dashboard           │     │    /evaluator/dashboard         │     │    /admin/dashboard             │
│ 2. Thư viện bài đánh giá (B2C)  │     │ 2. Quản lý nhóm & Nhận xét      │     │ 2. Quản lý người dùng           │
│    /learner/assessments         │     │    /evaluator/groups            │     │    /admin/users                 │
│ 3. Phòng thi trực tiếp (PIN/QR) │     │ 3. Ngân hàng câu hỏi (4 dạng)   │     │ 3. Quản lý tổ chức B2B          │
│    /learner/live-pin            │     │    /evaluator/item-bank         │     │    /admin/organizations         │
│ 4. Nhóm học tập & Nhận xét      │     │ 4. Quản lý đề thi & Giao bài    │     │ 4. Xét duyệt chuyên gia         │
│    /learner/groups              │     │    /evaluator/exams             │     │    /admin/evaluator-vetting     │
│ 5. Lịch sử thi & Tiến bộ        │     │ 5. Phòng thi trực tiếp (Mở/Nhóm)│     │ 5. Khung năng lực số động       │
│    /learner/submissions         │     │    /evaluator/live-room         │     │    /admin/framework-engine      │
│ 6. Lộ trình phát triển (4 bước) │     │ 6. Chấm & Thẩm định (Split-view)│     │ 6. Ngân hàng đề chuẩn NEXA      │
│    /learner/learning-path       │     │    /evaluator/grading           │     │    /admin/benchmark-bank        │
│ 7. Bảng xếp hạng (Top 100+ Điểm (point))  │     │ 7. Phân tích & Xuất dữ liệu     │     │ 7. Kho học liệu chuẩn           │
│    /learner/leaderboard         │     │    /evaluator/analytics         │     │    /admin/learning-content      │
│ 8. Chứng chỉ số & Hồ sơ         │     │ 8. Gói dịch vụ & Hạn mức        │     │ 8. Gói dịch vụ & Đối soát QR    │
│    /learner/credentials         │     │    /evaluator/billing           │     │    /admin/pricing-plans         │
│ 9. Gói dịch vụ cá nhân          │     │                                 │     │ 9. Quản lý & Thu hồi chứng chỉ  │
│    /learner/billing             │     │                                 │     │    /admin/credentials           │
│ ─────────────────────────────── │     │                                 │     │ 10. Cấu hình AI Đa mô hình      │
│ • Làm bài: /learner/take/[id]   │     │                                 │     │     /admin/ai-gateway           │
│ • Kết quả: /learner/results/[id]│     │                                 │     │ 11. Xuất dữ liệu nghiên cứu &   │
│ • Hồ sơ:   /learner/profile     │     │                                 │     │     Audit: /admin/analytics     │
└─────────────────────────────────┘     └─────────────────────────────────┘     └─────────────────────────────────┘
```

*(Ghi chú: Trang `/verify/[credentialId]` là trang Kiosk độc lập chỉ mở ra khi quét mã QR trên chứng chỉ số PDF).*

---

## II. MA TRẬN ĐỒNG BỘ ĐƯỜNG DẪN URL, MENU SIDEBAR & 50 USE CASES

| Phân hệ | STT Menu | Tên Menu / Màn hình | Đường dẫn URL chuẩn (`src/app/`) | Mã Use Case ánh xạ |
| :--- | :-: | :--- | :--- | :--- |
| **Public & Auth** | - | Trang chủ, Khung năng lực, Bảng giá, FAQ | `/`, `/framework`, `/pricing`, `/faq`,`/features`,`/contact-us`,.... | `UC-GST-001` |
| | - | Đăng ký (Chọn cố định Learner / Evaluator) | `/register` | `UC-GST-002` |
| | - | Đăng nhập hệ thống | `/login` | `UC-GST-003` |
| | - | Đặt lại mật khẩu | `/reset-password` | `UC-GST-004` |
`UC-LEA-014` |
| **Learner Portal** | 1 | Tổng quan năng lực | `/learner/dashboard` | `UC-LEA-001` |
| | 2 | Thư viện đánh giá (B2C) | `/learner/assessments` | `UC-LEA-003` |
| | 3 | Phòng thi trực tiếp (Link / PIN / QR) | `/learner/live-pin` | `UC-LEA-005` |
| | 4 | Nhóm học tập & Nhận xét | `/learner/groups` | `UC-LEA-004` |
| | 5 | Lịch sử bài thi & Tiến bộ | `/learner/submissions` | `UC-LEA-008`, `UC-LEA-012` |
| | 6 | Lộ trình phát triển (4 bước) | `/learner/learning-path` | `UC-LEA-011` |
| | 7 | Bảng xếp hạng (Rank Top 100+) | `/learner/leaderboard` | `UC-LEA-013` |
| | 8 | Chứng chỉ & Hồ sơ năng lực | `/learner/credentials` | `UC-LEA-014`, `UC-LEA-015` |
| | 9 | Gói dịch vụ cá nhân | `/learner/billing` | `UC-LEA-016` |
| | *(Sub)* | Phòng làm bài Zen Mode (4 hình thức) | `/learner/take/[id]` | `UC-LEA-006`, `UC-LEA-007` |
| | *(Sub)* | Báo cáo kết quả, 5 ứng dụng AI & Nhận xét | `/learner/results/[id]` | `UC-LEA-009`, `UC-LEA-010` |
| | *(Sub)* | Cài đặt tài khoản & Quyền riêng tư NĐ 13 | `/learner/profile` | `UC-LEA-002` |
| **Evaluator Portal** | 1 | Tổng quan khảo thí | `/evaluator/dashboard` | `UC-EVA-001`, `UC-EVA-002` |
| | 2 | Quản lý nhóm & Nhận xét học viên | `/evaluator/groups` | `UC-EVA-003`, `UC-EVA-004` |
| | 3 | Ngân hàng câu hỏi (4 hình thức & Rubric) | `/evaluator/item-bank` | `UC-EVA-005`, `UC-EVA-006` |
| | 4 | Quản lý đề thi & Giao bài | `/evaluator/exams` | `UC-EVA-007`, `UC-EVA-008` |
| | 5 | Phòng thi trực tiếp (Mở / Theo nhóm) | `/evaluator/live-room` | `UC-EVA-009`, `UC-EVA-010` |
| | 6 | Chấm & Thẩm định (Split-view Studio) | `/evaluator/grading` | `UC-EVA-011` $\rightarrow$ `014` |
| | 7 | Phân tích Heatmap & Xuất dữ liệu | `/evaluator/analytics` | `UC-EVA-015` |
| | 8 | Gói dịch vụ & Hạn mức | `/evaluator/billing` | `UC-EVA-016` |
| **Admin Portal** | 1 | Tổng quan vận hành sàn | `/admin/dashboard` | `UC-ADM-001` |
| | 2 | Quản lý người dùng | `/admin/users` | `UC-ADM-002` |
| | 3 | Quản lý tổ chức B2B | `/admin/organizations` | `UC-ADM-003` |
| | 4 | Xét duyệt chuyên gia | `/admin/evaluator-vetting` | `UC-ADM-004` |
| | 5 | Khung năng lực số động | `/admin/framework-engine` | `UC-ADM-005` |
| | 6 | Ngân hàng đề chuẩn NEXA | `/admin/benchmark-bank` | `UC-ADM-006` |
| | 7 | Kho học liệu chuẩn | `/admin/learning-content` | `UC-ADM-007` |
| | 8 | Gói dịch vụ & Đối soát VietQR | `/admin/pricing-plans` | `UC-ADM-008` |
| | 9 | Quản lý & Thu hồi chứng chỉ | `/admin/credentials` | `UC-ADM-009` |
| | 10 | Cấu hình AI Đa mô hình & Prompt | `/admin/ai-gateway` | `UC-ADM-010` |
| | 11 | Xuất dữ liệu nghiên cứu & Audit Logs | `/admin/analytics`, `/admin/audit-logs`, `/admin/settings` | `UC-ADM-011` |

---

## III. CHI TIẾT 15 LUỒNG QUY TRÌNH NGHIỆP VỤ TOÀN HỆ THỐNG (15 CORE WORKFLOWS)

### 1. `FLOW-01`: Khách vãng lai tự đăng ký & Khóa cứng vai trò (`LEARNER` hoặc `EVALUATOR`)

```text
[Khách vào /register] ──▶ Nhập Họ tên, Email, Mật khẩu ──▶ Chọn 1 vai trò cố định: [Người học] hoặc [Người đánh giá]
       │
       ▼
[Tích đồng ý NĐ 13/2023] ──▶ Lưu consent_logs ──▶ Gửi OTP 6 số qua Email ──▶ Nhập đúng OTP
       │
       ├──▶ Nếu chọn LEARNER: Khởi tạo gói Learner Free (3 lượt thi) ──▶ Vào /learner/dashboard
       └──▶ Nếu chọn EVALUATOR: Khởi tạo gói Evaluator Free (1 nhóm, 20 lượt AI) ──▶ Vào thẳng /evaluator/dashboard
```

### 2. `FLOW-02`: Tham gia Nhóm học tập qua Link tự động, Mã nhóm hoặc QR Code & Nhận nhận xét

```text
NGƯỜI ĐÁNH GIÁ (/evaluator/groups)                          NGƯỜI HỌC (/learner/groups)
──────────────────────────────────                          ───────────────────────────
[1. Tạo nhóm lớp mới]
  ├─ Sinh Mã nhóm: "K24DIG"
  ├─ Sinh Link: ".../learner/groups?join=K24DIG"
  └─ Sinh Mã QR của nhóm
         │
         ├─────── Chia sẻ Link / Mã / QR ──────────────────▶ [2. Bấm Link / Quét QR / Nhập mã]
         │                                                     └─ Tự động ghi danh vào nhóm "K24DIG"
         │                                                     └─ Thấy danh sách bài đánh giá của nhóm
[3. Xem tiến độ & Gửi nhận xét cho học viên]
  └─ Nhập lời nhận xét định kỳ / góp ý chuyên môn ─────────▶ [4. Nhận thông báo chuông Topbar]
                                                               └─ Đọc lịch sử nhận xét của giảng viên ngay trong nhóm
```

### 3. `FLOW-03`: Tổ chức Phòng thi trực tiếp (`Live Room`) ở cả 2 chế độ: Mở (Không cần nhóm) & Theo Nhóm

```text
[Evaluator chọn đề thi tại /evaluator/exams] ──▶ Bấm "Mở Phòng Thi Trực Tiếp"
       │
       ├──► Tùy chọn A: PHÒNG THI MỞ (Open Room - Không yêu cầu thí sinh thuộc nhóm trước)
       │      └─ Sinh PIN 6 số (849201) + Link trực tiếp (.../learner/live-pin?pin=849201) + Mã QR lớn
       │      └─ Bất kỳ người học nào bấm Link / quét QR / nhập PIN đều vào được Phòng chờ
       │
       └──► Tùy chọn B: PHÒNG THI NỘI BỘ NHÓM (Group Room - Chỉ dành cho thành viên nhóm đã chọn)
              └─ Kiểm tra thí sinh thuộc group_members + Hiển thị thông báo mời thi ngay trong nhóm
                     │
                     ▼
       [Evaluator bấm "Bắt đầu tính giờ (START_EXAM)"] ──▶ Đồng bộ Server Clock tới toàn bộ thí sinh
```

### 4. `FLOW-04`: Thực hiện Bài đánh giá 4 Hình thức & Tự động lưu nháp 15 giây

```text
[Thí sinh vào /learner/take/[id] (Zen Mode - Ẩn Sidebar)]
       │
       ├──► Hình thức 1 (MCQ): Chọn đáp án đơn / đa lựa chọn / ghép nối
       ├──► Hình thức 2 (SCENARIO): Đọc bối cảnh tình huống thực tế ──▶ Chọn quyết định / Viết hướng xử lý
       ├──► Hình thức 3 (PRACTICAL_TASK): Thực hiện bài tập thao tác trực tiếp theo bảng tiêu chí Rubric
       └──► Hình thức 4 (DIGITAL_EVIDENCE): Tải tệp sản phẩm (PDF/Ảnh/ZIP) hoặc Link + Viết giải trình (>= 30 từ)
              │
              ▼ (Mỗi 15 giây lưu ngầm lên Upstash Redis)
       [Bấm "Nộp bài" hoặc Hết giờ 00:00 cưỡng chế thu bài] ──▶ Lưu vào PostgreSQL (status = SUBMITTED)
```

### 5. `FLOW-05`: Pipeline 2 Lần Gọi AI (Đa mô hình) Giải quyết Trọn vẹn 5 Ứng dụng AI

```text
[Bài thi chuyển sang trạng thái SUBMITTED]
       │
       ├──► BƯỚC 1 (Code thuần - 0.01s): Tự động chấm điểm toàn bộ câu Trắc nghiệm (MCQ) & Nhánh chọn Tình huống
       │
       ├──► BƯỚC 2 (AI CALL #1 - Ứng dụng AI số 1: Hỗ trợ chấm điểm):
       │      • Khử định danh PII ──▶ Gửi câu Tình huống tự luận + Thực hành + Tệp minh chứng + Giải trình
       │        kèm Ma trận Rubric 100% và Bài mẫu chuẩn (Gold Samples) qua AIProviderAdapter.
       │      • Nhận JSON: Điểm từng tiêu chí, câu trích dẫn bằng chứng (evidenceQuote), nhận xét câu & confidenceScore.
       │
       ├──► BƯỚC 3 (Code thuần): Tổng hợp điểm Bước 1 + Bước 2 theo trọng số ──▶ Tính điểm 5 Miền & các Kỹ năng
       │      • Lọc các kỹ năng có điểm < 60% (Khoảng trống năng lực)
       │      • Truy vấn bảng learning_content_items lấy danh sách học liệu có thật ứng với các kỹ năng < 60%
       │
       └──► BƯỚC 4 (AI CALL #2 - Ứng dụng AI số 2, 3, 4, 5):
              • Gửi Bảng điểm kỹ năng + Danh sách học liệu từ DB sang AI.
              • Nhận JSON tổng hợp lưu vào CSDL:
                  1. [Ứng dụng 2] Điểm mạnh (>= 80%) & Điểm yếu (strengthsAndWeaknesses)
                  2. [Ứng dụng 3] Nhận diện khoảng trống năng lực (skillGaps)
                  3. [Ứng dụng 4] Phản hồi cá nhân hóa toàn diện (personalizedFeedback)
                  4. [Ứng dụng 5] Lộ trình phát triển năng lực từng chặng (recommendedPathway)
```

### 6. `FLOW-06`: Phân luồng Công bố Kết quả theo Ngữ cảnh B2C (Tự đánh giá) và B2B (Theo Nhóm/Lớp)

```text
[Hoàn tất Pipeline 2 Lần Gọi AI]
       │
       ├──► NGỮ CẢNH 1: ĐỀ TỰ ĐÁNH GIÁ CHUẨN NEXA (Mô hình B2C)
       │      ├─ Công bố ngay kết quả, Biểu đồ Radar, 5 ứng dụng AI và cộng điểm tích lũy (point) cho người học.
       │      └─ Nếu đủ điểm cấp Chứng chỉ NEXA:
       │           ├─ Confidence >= 0.85 (Cờ Xanh): Tự động xuất PDF Vector + QR Code tức thì.
       │           └─ Confidence < 0.85 (Cờ Cam/Đỏ): Đẩy về hàng đợi /admin/credentials để Chủ nền tảng duyệt.
       │
       └──► NGỮ CẢNH 2: ĐỀ THI TRONG NHÓM / PHÒNG THI CỦA EVALUATOR (Mô hình B2B)
              └─ Đưa vào bàn chấm Split-view (/evaluator/grading) kèm Cờ tin cậy AI (Xanh / Cam / Đỏ)
              └─ Evaluator duyệt nhanh (Cờ Xanh) hoặc sửa điểm + viết nhận xét chuyên môn ──▶ Bấm "Phê duyệt công bố"
```

### 7. `FLOW-07`: Chu trình 4 Bước của Lộ trình Phát triển Năng lực & Đánh giá lại

```text
[Bước 1: Admin nạp Kho học liệu chuẩn gắn nhãn Kỹ năng]
       │
       ▼
[Bước 2: Bài thi phát hiện Kỹ năng X đạt < 60 điểm (Khoảng trống năng lực)]
       │
       ▼
[Bước 3: AI lắp ráp các học liệu của Kỹ năng X thành Chặng 1 ➔ Chặng 2 ➔ Chặng 3 tại /learner/learning-path]
       │
       ▼
[Bước 4: Người học mở học từng bài ──▶ Bấm "Hoàn thành" (+30 điểm (point)) ──▶ Mở khóa "Đánh giá lại Kỹ năng X"]
       │
       └──▶ Làm bài đánh giá lại ──▶ Điểm Kỹ năng X tăng lên 80/100 ──▶ Cập nhật Biểu đồ Pre/Post Radar Diff (+100 điểm (point))
```

### 8. `FLOW-08`: Tích lũy Điểm tích lũy (point) & Đua Top 100+ Bảng xếp hạng (`/learner/leaderboard`)

```text
[Hoạt động của Người học]
  ├─ Hoàn thành bài đánh giá: +50 điểm (point) (+ Điểm thưởng theo kết quả)
  ├─ Hoàn thành học liệu lần đầu: +30 điểm (point)
  └─ Cải thiện kỹ năng yếu qua bài đánh giá lại: +100 điểm (point)
         │
         ▼
[Cập nhật cột points & rank_tier trong bảng profiles]
         │
         ▼
[Upstash Redis Cache cập nhật Bảng xếp hạng Top 100+ (Tuần / Tháng / Toàn sàn / Theo Nhóm)]
```

### 9. `FLOW-09`: Xuất Dữ liệu Phân tích Nhóm (Evaluator) & Xuất Bộ Dữ liệu Nghiên cứu (Admin)

```text
• Tại /evaluator/analytics:
  Evaluator chọn Nhóm / Đợt thi ──▶ Bấm "Xuất Excel / CSV / PDF" ──▶ Tải bảng điểm, Radar nhóm, Heatmap & Nhận xét.

• Tại /admin/analytics (Dành cho Chủ nền tảng nghiên cứu khoa học):
  Admin chọn khoảng thời gian & biến số ──▶ Hệ thống tự động khử PII (băm SHA-256 User ID)
  ──▶ Xuất file CSV / Excel chuẩn hóa chứa: Điểm 4 dạng câu hỏi, Điểm các miền & kỹ năng, Thời gian làm bài,
      Độ khó (P), Độ phân biệt (D), Điểm Pre-test & Post-test ──▶ Đưa thẳng vào SPSS / R / Python / Power BI.
```

# THIẾT KẾ LUỒNG TRẢI NGHIỆM NGƯỜI DÙNG & QUY TRÌNH NGHIỆP VỤ (UX FLOW & PROCESS WORKFLOWS)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-UX-FLOW`
- **Phiên bản:** `v3.2.1` (Cập nhật Luồng Nộp Bài Tức Thì 0.01s & Bấm Nút Kích Hoạt AI Theo Yêu Cầu - On-Demand AI)

---

## I. SƠ ĐỒ ĐIỀU HƯỚNG TỔNG THỂ (MASTER ROUTING FLOW)

- **4 Trang ngoài công khai (`Public Layout`):** `/` (Trang chủ), `/framework` (Khung năng lực), `/pricing` (Bảng giá), `/faq` (Hướng dẫn). Không đặt ô tra cứu QR trên Header/Landing Page; đường dẫn `/verify/[credentialId]` chỉ mở khi quét QR trên chứng chỉ.
- **3 Cổng xác thực (`Auth Layout`):** `/login`, `/register` (Chọn cố định 1 vai trò `LEARNER` hoặc `EVALUATOR`), `/reset-password`.
- **3 Cổng Dashboard tách biệt hoàn toàn Shell (`Zero-Shared Shell`):**
  1. **Learner Portal (`/learner/*` — 9 Menu):** `dashboard`, `assessments`, `live-pin`, `groups`, `submissions`, `learning-path`, `leaderboard`, `credentials`, `billing` (kèm trang con `take/[id]`, `results/[id]`, `profile`).
  2. **Evaluator Portal (`/evaluator/*` — 8 Menu):** `dashboard`, `groups`, `item-bank`, `exams`, `live-room`, `grading`, `analytics`, `billing`.
  3. **Admin Portal (`/admin/*` — 11 Menu):** `dashboard`, `users`, `organizations`, `evaluator-vetting`, `framework-engine`, `benchmark-bank`, `learning-content`, `pricing-plans`, `credentials`, `ai-gateway`, `analytics` (kèm `audit-logs`, `settings`).

---

## II. CÁC LUỒNG NGHIỆP VỤ TRỌNG TÂM ĐÃ CHUẨN HÓA ON-DEMAND AI

### 1. `FLOW-01`: Đăng ký Cố định Vai trò (`LEARNER` hoặc `EVALUATOR`)

```text
[Khách vào /register] ──▶ Nhập thông tin + Chọn cố định [Learner] hoặc [Evaluator] + Tích NĐ 13
       │
       ▼
[Xác thực OTP 6 số] ──▶ Khóa cứng vai trò trong DB (trg_lock_static_role)
       ├──▶ LEARNER   ──▶ Cấp gói Learner Free ──▶ Vào thẳng /learner/dashboard
       └──▶ EVALUATOR ──▶ Cấp gói Evaluator Free ──▶ Vào thẳng /evaluator/dashboard
```

### 2. `FLOW-02`: Tham gia Nhóm & Phòng thi Trực tiếp qua Link, Mã PIN, QR (Có nhóm hoặc Không nhóm)

```text
• THAM GIA NHÓM (/learner/groups):
  Bấm Link (?join=K24DIG) / Quét QR / Nhập mã ──▶ Gia nhập nhóm ──▶ Làm đề nhóm & Nhận nhận xét từ Evaluator.

• VÀO PHÒNG THI TRỰC TIẾP (/learner/live-pin):
  ├─ Chế độ Phòng Mở (OPEN - Không cần vào nhóm trước): Bấm Link (?pin=849201) / Quét QR / Nhập PIN ──▶ Vào thi ngay.
  └─ Chế độ Phòng Nhóm (GROUP_ONLY): Kiểm tra thành viên nhóm ──▶ Vào phòng chờ đồng bộ Server Clock.
```

### 3. `FLOW-03`: Nộp bài Tức thì (`0.01s`) & Bấm nút Kích hoạt AI Theo Yêu cầu (On-Demand AI)

```text
[Thí sinh làm bài 4 hình thức tại /learner/take/[id] (Auto-save 15s lên Redis)]
       │
       ▼
[Bấm nút "NỘP BÀI" (POST /api/assessments/[id]/submit)]
       │
       ├──► Thực thi tức thì (0.01 giây - Tốn 0 Token AI):
       │      • Code máy chủ tự chấm 100% câu hỏi Trắc nghiệm (MCQ) & Nhánh chọn Tình huống (SCENARIO).
       │      • Lưu câu trả lời Thực hành & Sản phẩm minh chứng vào PostgreSQL.
       │      • Cộng +50 điểm (point) hoàn thành bài thi & Mở ngay trang Kết quả (/learner/results/[id]).
       │
       ▼
[TẠI TRANG KẾT QUẢ HOẶC BÀN CHẤM - NGƯỜI DÙNG CHỦ ĐỘNG BẤM NÚT KHI CẦN AI]
       │
       ├──► Nút bấm 1: [Chấm bài thực hành bằng AI] (POST /api/ai/grade-submission)
       │      └─ Kiểm tra & trừ 1 lượt AI ──▶ Khử PII ──▶ Đối chiếu 3 tầng (Khung + Rubric 100% + Bài mẫu)
       │      └─ Trả về: Điểm từng tiêu chí Rubric, trích dẫn bằng chứng (evidenceQuote) & Cờ tin cậy.
       │
       └──► Nút bấm 2: [Phân tích năng lực & Đề xuất lộ trình bằng AI] (POST /api/ai/analyze-competency)
              └─ Truy vấn các học liệu có thật trong DB ứng với các kỹ năng đạt < 60%
              └─ Trả về: Điểm mạnh/yếu + Khoảng trống năng lực + Phản hồi cá nhân hóa + Lộ trình 4 bước.
```

### 4. `FLOW-04`: Chấm bài tại Evaluator Portal (Tự chấm tay `0 AI` hoặc Bấm nút Gợi ý AI)

```text
[Học viên nộp bài trong Nhóm/Phòng thi] ──▶ Bài làm xuất hiện tại /evaluator/grading
       │
       ├──► Lựa chọn A (Chấm thủ công - Tốn 0 lượt AI):
       │      Evaluator xem tệp minh chứng & giải trình ──▶ Tự nhập điểm Rubric + Viết nhận xét ──▶ Bấm "Công bố".
       │
       └──► Lựa chọn B (Bấm nút "Nhờ AI chấm gợi ý bài này" hoặc "Chạy AI các bài đã chọn"):
              AI chấm theo Rubric + gắn Cờ tin cậy (Xanh >= 0.85 / Cam / Đỏ)
              ──▶ Evaluator duyệt nhanh hoặc sửa điểm + viết thêm lời khuyên ──▶ Bấm "Công bố".
```
