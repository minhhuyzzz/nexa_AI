# KẾ HOẠCH TRIỂN KHAI VÀ BÀN GIAO NỀN TẢNG NEXA (FULL-STACK IMPLEMENTATION PLAN)

## 1. TỔNG QUAN & HIỆN TRẠNG DỰ ÁN
Dự án **NEXA** (*Nền tảng đánh giá và chứng nhận phát triển năng lực số dựa trên trí tuệ nhân tạo*) phiên bản v3.2.0-spec đã được triển khai hoàn chỉnh **100% mã nguồn full-stack** theo cấu trúc Next.js App Router (React 19, TypeScript strict mode) kết nối cơ sở dữ liệu Supabase live và Upstash Redis.

Kế hoạch này hệ thống hóa 10 Lát cắt dọc (Vertical Phases 0 đến 9), chuẩn hóa cấu trúc thư mục, quy tắc giao diện và cơ chế bảo mật theo đúng **7 Quy tắc Kiến trúc Bất biến** trong [`AGENTS.md`](file:///c:/nexa/AGENTS.md).

---

## 2. BẢY NGUYÊN TẮC KIẾN TRÚC BẤT BIẾN (ARCHITECTURAL GUARDRAILS)

1. **1 Email = 1 Vai trò Tĩnh Cố Định (`LEARNER` | `EVALUATOR` | `ADMIN`):**
   - Đăng ký tại `/register` chỉ chọn `LEARNER` hoặc `EVALUATOR`. Không hỗ trợ chuyển đổi vai trò sau khi tạo tài khoản. Vai trò `ADMIN` dành riêng cho Quản trị viên nền tảng.
2. **3 Bộ Shell Dashboard Tách Biệt Hoàn Toàn (`Zero-Shared Shell`):**
   - `src/app/(dashboard)/learner/layout.tsx` $\rightarrow$ `LearnerSidebar`, `LearnerTopbar`, `LearnerAvatarMenu`.
   - `src/app/(dashboard)/evaluator/layout.tsx` $\rightarrow$ `EvaluatorSidebar`, `EvaluatorTopbar`, `EvaluatorAvatarMenu`.
   - `src/app/(dashboard)/admin/layout.tsx` $\rightarrow$ `AdminSidebar`, `AdminTopbar`, `AdminAvatarMenu`.
   - **Tuyệt đối KHÔNG có Footer trong bất kỳ màn hình Dashboard nào.**
   - Các trang công khai ngoài Dashboard (`/`, `/framework`, `/pricing`, `/faq`) dùng chung bộ `PublicHeader` và `PublicFooter` học thuật toàn diện.
3. **Không đặt ô tra cứu QR lên Landing Page hay `PublicHeader`:**
   - 4 Trang ngoài chỉ gồm: `/` (Trang chủ), `/framework` (Khung năng lực), `/pricing` (Bảng giá), `/faq` (Hướng dẫn).
   - Trang `/verify/[credentialId]` là trang Kiosk độc lập chỉ mở ra khi quét mã QR trên chứng chỉ PDF.
4. **Khung Năng Lực Số Động (Dynamic Competency Framework):**
   - Toàn bộ Miền năng lực và Kỹ năng thành phần được nạp động từ CSDL (`assessment_frameworks`, `competency_domains`, `competencies`), không ghi cứng trong code giao diện.
5. **Cổng AI Đa Mô Hình & Khử Dữ Liệu Cá Nhân (AI Gateway & PII Scrubbing):**
   - Toàn bộ các lệnh gọi mô hình được bọc qua Adapter pattern (`src/features/ai-gateway/adapters/`).
   - 100% thông tin định danh cá nhân (Email, SĐT, CCCD, Thẻ ngân hàng) được bóc tách và mã hóa bởi `PIIScrubberService` trước khi gửi sang Google Gemini API (Tuân thủ Nghị định 13/2023/NĐ-CP).
6. **Cơ Chế Kích Hoạt AI Theo Yêu Cầu (On-Demand AI Trigger — CẤM tự động gọi khi nộp bài):**
   - Khi nộp bài (`POST /api/assessments/[id]/submit`): Chấm tự động tức thì bằng code thuần trong **0.01s** (0 Token AI lãng phí).
   - AI chỉ kích hoạt khi người dùng bấm nút:
     1. `POST /api/ai/grade-submission`: Chấm Rubric 100%, trích dẫn bằng chứng `evidenceQuote`, tính `confidenceScore`:
        - **Cờ Xanh (`GREEN`) $\ge 85\%$:** Độ tin cậy cao, tự động duyệt.
        - **Cờ Cam (`AMBER`) $60\% - 84\%$:** Đạt yêu cầu nhưng cần lưu ý.
        - **Cờ Đỏ (`RED`) $< 60\%$:** Rủi ro cao, bắt buộc chuyển qua Bàn chấm Chuyên gia Evaluator kiểm tra thủ công.
     2. `POST /api/ai/analyze-competency`: Gộp 4 ứng dụng trong 1 lần gọi (Radar 5 Miền DigComp 2.2, Skill Gaps $< 60\%$, Phản hồi sư phạm, Lộ trình học 4 bước).
7. **TypeScript Strict & Zero-any:**
   - 100% Zero-any, xác thực schema đầu vào và đầu ra qua thư viện `zod`.

---

## 3. LỘ TRÌNH TRIỂN KHAI 10 PHASES (VERTICAL SLICES)

### Phase 0: Project Foundation & Tooling (Hoàn thành 100%)
- Khởi tạo Next.js App Router, React 19, Tailwind CSS v4, Lucide React, TypeScript strict mode.
- Cấu hình Design System Tokens (Academic Slate `#F8FAFC`, `#0F172A`, `#0284C7`).
- Xây dựng Singleton Clients:
  - `src/lib/supabase/client.ts` (Client Components)
  - `src/lib/supabase/server.ts` (Server Actions / Route Handlers)
  - `src/lib/redis/client.ts` (Upstash REST client)

### Phase 1: Core Database Migrations & Dynamic Framework (Hoàn thành 100%)
- Thiết lập CSDL Supabase với 100% RLS Policies: `profiles`, `organizations`, `assessment_frameworks`, `competency_domains`, `competencies`.
- Nạp bộ dữ liệu chuẩn Khung Năng lực Số Việt Nam (5 Miền, 21 Kỹ năng thành phần theo chuẩn DigComp 2.2).
- API Route `GET /api/frameworks/active` kết xuất động toàn bộ cây năng lực.

### Phase 2: Static Role Auth & Zero-Shared Shell Layouts (Hoàn thành 100%)
- Trang `/register` cố định vai trò `LEARNER` hoặc `EVALUATOR` kèm cam kết bảo vệ dữ liệu theo Nghị định 13/2023.
- Trang `/login` & Middleware RBAC chặn truy cập chéo vai trò.
- 3 Shell Dashboard riêng biệt không Footer:
  - Shell Learner: `LearnerSidebar`, `LearnerTopbar`, `LearnerAvatarMenu`.
  - Shell Evaluator: `EvaluatorSidebar`, `EvaluatorTopbar`, `EvaluatorAvatarMenu`.
  - Shell Admin: `AdminSidebar`, `AdminTopbar`, `AdminAvatarMenu`.

### Phase 3: MCQ Assessment Engine & Zero-AI Instant Grading (Hoàn thành 100%)
- Schema CSDL: `assessments`, `assessment_items`, `item_options`, `assessment_submissions`, `submission_answers`.
- Phòng thi Zen Mode `/learner/take/[id]` với đồng hồ đếm ngược server và cơ chế tự động lưu 15s.
- API nộp bài `POST /api/assessments/[id]/submit`: Chấm tự động 100% bằng code trong **0.01s** (0 Token AI), cộng ngay `+50 điểm (point)`.
- Trang kết quả chi tiết `/learner/assessments/[id]/result` kèm giải thích phương án đúng/sai.

### Phase 4: Scenario Assessment & Rubric AI Trigger (Hoàn thành 100%)
- Câu hỏi tình huống `SCENARIO` (Nhánh quyết định tự chấm + Phần tự luận giải trình).
- Schema CSDL Rubric 3 tiêu chí: `rubrics`, `rubric_criteria`, `rubric_levels`, `ai_evaluations`.
- Adapter `GeminiAdapter` tích hợp `PIIScrubberService` và Zod validation.
- API `POST /api/ai/grade-submission` (Nút "Chấm bài thực hành bằng AI", Rubric 100%, trích dẫn `evidenceQuote`, cờ Xanh/Cam/Đỏ).

### Phase 5: Practical Tasks, Digital Evidence & Evaluator Grading Desk (Hoàn thành 100%)
- Nhiệm vụ thực hành `PRACTICAL_TASK` và nộp minh chứng `DIGITAL_EVIDENCE` (ràng buộc giải trình $\ge 30$ từ).
- Tích hợp Supabase Storage upload an toàn file PDF/PNG/ZIP (giới hạn 10MB, kiểm tra MIME type).
- Bàn chấm Split-view cho Chuyên gia tại `/evaluator/grading` (chấm tay tốn 0 token hoặc bấm nút nhờ AI gợi ý).

### Phase 6: AI Competency Analysis, 4-Step Pathway & Redis Leaderboard (Hoàn thành 100%)
- API `POST /api/ai/analyze-competency` (Gộp Ứng dụng AI 2, 3, 4, 5: Radar 5 Miền DigComp 2.2, Skill Gaps $< 60\%$, Phản hồi sư phạm, Lộ trình 4 bước).
- Trang phân tích năng lực `/learner/competency/analysis` hiển thị trực quan biểu đồ SVG Radar.
- Cơ chế học tập nhận `+30 điểm (point)` khi hoàn thành bài học tại `/api/learning/complete`, mở khóa nút "Đánh giá lại kỹ năng" (Re-take).
- Bảng xếp hạng Top 100+ học viên (`/learner/leaderboard`) lưu đệm qua Upstash Redis phản hồi nhanh $< 100$ms.

### Phase 7: Digital Certificate (PDF Vector) & Kiosk QR Verification (Hoàn thành 100%)
- Kết xuất chứng chỉ số PDF Vector A4 Landscape chuẩn học thuật (`CertificateGeneratorService`).
- Chữ ký điện tử SHA-256 kép (Content Metadata Hash + PDF Binary Stream Integrity Hash).
- Trang Kiosk độc lập `/verify/[credentialId]` phục vụ quét mã QR từ điện thoại (Không đặt ô tra cứu trên Header/Landing Page).
- Trang quản lý văn bằng `/learner/credentials` cho phép tải PDF Vector và mở cổng tra cứu.

### Phase 8: Evaluator Live Exam Rooms & Academic Research Export (Hoàn thành 100%)
- Mở phòng thi trực tiếp qua Mã PIN 6 số (`JetBrains Mono tabular-nums`) hoặc Link tại `/evaluator/live-room`.
- Thí sinh vào `/learner/live-pin` nhập PIN 6 số để vào thẳng phòng thi Zen Mode.
- Trích xuất bộ dữ liệu nghiên cứu 26 biến số định dạng CSV (UTF-8 BOM cho SPSS/R/Python) tại `/evaluator/analytics`, khử sạch PII theo Nghị định 13/2023.

### Phase 9: Admin Master Control & Comprehensive Quality Gate (Hoàn thành 100%)
- Admin Portal: Framework Engine Editor (`/admin/frameworks`), Quản trị Ngân hàng Đề & Học liệu (`/admin/content`), Cấu hình AI Gateway & Quota (`/admin/ai-gateway`).
- Bộ kiểm thử tự động Vitest (`vitest.config.mts`): 100% test cases passed (PII Scrubber, Certificate Dual-hash, Competency Type Safety).
- 37/37 static và dynamic routes Next.js biên dịch thành công (`npm run build` Exit code 0).

---

## 4. CẤU TRÚC THƯ MỤC CHUẨN CỦA DỰ ÁN (CANONICAL DIRECTORY TREE)

```
c:/nexa/
├── src/
│   ├── app/
│   │   ├── (auth)/                       # Phân hệ Xác thực
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/                  # 3 Shell Dashboard độc lập (Không Footer)
│   │   │   ├── learner/
│   │   │   │   ├── layout.tsx            # Learner Shell
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── assessments/
│   │   │   │   ├── take/[id]/page.tsx    # Zen Mode
│   │   │   │   ├── competency/analysis/
│   │   │   │   ├── learning-path/
│   │   │   │   ├── leaderboard/
│   │   │   │   ├── credentials/
│   │   │   │   └── live-pin/
│   │   │   ├── evaluator/
│   │   │   │   ├── layout.tsx            # Evaluator Shell
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── live-room/page.tsx
│   │   │   │   ├── grading/page.tsx      # Split-view Grading Desk
│   │   │   │   └── analytics/page.tsx    # SPSS/R/Python 26-variable Export
│   │   │   └── admin/
│   │   │       ├── layout.tsx            # Admin Shell
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── frameworks/page.tsx   # Dynamic Framework Engine
│   │   │       ├── content/page.tsx      # Questions & Learning Repository
│   │   │       └── ai-gateway/page.tsx   # Model Configuration & Quota
│   │   ├── api/                          # Backend Route Handlers
│   │   │   ├── ai/                       # grade-submission, analyze-competency
│   │   │   ├── assessments/              # submit (0.01s instant grading)
│   │   │   ├── credentials/              # PDF generation & verification
│   │   │   ├── evaluator/                # rooms, grading, export
│   │   │   ├── frameworks/               # active dynamic framework
│   │   │   ├── leaderboard/              # Redis cached leaderboard
│   │   │   └── learning/                 # complete step (+30 points)
│   │   ├── verify/[credentialId]/        # Kiosk tra cứu QR độc lập
│   │   ├── framework/                    # 5 Miền năng lực số DigComp 2.2
│   │   ├── pricing/                      # Bảng giá dịch vụ minh bạch
│   │   ├── faq/                          # Trung tâm Hướng dẫn & FAQ
│   │   ├── layout.tsx                    # Root Layout
│   │   └── page.tsx                      # Modular Landing Page
│   ├── components/
│   │   ├── public/                       # Dùng chung cho các trang công khai
│   │   │   ├── PublicHeader.tsx          # Thanh điều hướng công khai (Không ô QR)
│   │   │   └── PublicFooter.tsx          # Chân trang học thuật toàn diện 4 cột
│   │   ├── landing/                      # Các phân đoạn độc lập của Trang chủ
│   │   │   ├── HeroSection.tsx
│   │   │   ├── CompetencyFrameworkSection.tsx
│   │   │   ├── AssessmentFormatsSection.tsx
│   │   │   ├── AiWorkflowSection.tsx
│   │   │   ├── DualHashVerifySection.tsx
│   │   │   └── CtaBannerSection.tsx
│   │   ├── dashboard/                    # Shell components theo từng vai trò
│   │   │   ├── learner/                  # Sidebar, Topbar, AvatarMenu
│   │   │   ├── evaluator/                # Sidebar, Topbar, AvatarMenu
│   │   │   └── admin/                    # Sidebar, Topbar, AvatarMenu
│   │   └── assessment/
│   │       └── AIGradingCard.tsx         # Thẻ kích hoạt AI On-Demand
│   ├── features/
│   │   ├── ai-gateway/                   # Gemini Adapter, PII Scrubber, Schemas
│   │   └── credentials/                  # PDF/A-1b Vector Generator, SHA-256
│   └── lib/
│       ├── supabase/                     # client.ts & server.ts
│       └── redis/                        # Upstash Redis client.ts
├── tasks/
│   ├── plan.md                           # Kế hoạch chi tiết 10 Phases
│   └── todo.md                           # Danh mục kiểm tra tiến độ (100% Passed)
└── AGENTS.md                             # 7 Luật kiến trúc bất biến
```

---

## 5. KẾT QUẢ NGHIỆM THU CHẤT LƯỢNG (QUALITY GATES)

1. **Kiểm thử Kiểu dữ liệu (TypeScript Strict):**
   - Lệnh thực thi: `npx tsc --noEmit`
   - Kết quả: **0 lỗi** (Exit code: 0, 100% Zero-any).
2. **Kiểm thử Đơn vị & Tích hợp (Vitest):**
   - Lệnh thực thi: `npm run test`
   - Kết quả: **3 test suites, 8 tests passed 100%** (PIIScrubber, DualHash PDF, Zod schemas).
3. **Biên dịch Môi trường Production (Next.js Build):**
   - Lệnh thực thi: `npm run build`
   - Kết quả: **37/37 routes tĩnh và động biên dịch thành công 100%** (Exit code: 0).
4. **Cơ sở dữ liệu Supabase Live (`rfbudggycfhbzgxhytlo`):**
   - 22 bảng CSDL hoạt động ổn định, bật 100% RLS policies.
   - Nạp thành công Khung Năng lực Số (5 Miền, 21 Kỹ năng) và Ngân hàng đề thi Benchmark.