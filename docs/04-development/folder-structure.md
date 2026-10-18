# ĐẶC TẢ CẤU TRÚC THƯ MỤC DỰ ÁN TOÀN DIỆN (FOLDER STRUCTURE SPECIFICATION)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-FOLDER-STRUCTURE`
- **Phiên bản:** `v3.2.0` (Đồng bộ 100% Đường dẫn URL với `ux-flow.md` & `ui-spec.md`)
- **Kiến trúc:** Feature-Driven Development (FDD) & 4-Layer Clean Architecture

---

## 1. CÂY THƯ MỤC TỔNG THỂ CHUẨN HÓA (`src/` & `supabase/`)

```text
nexa/
├── docs/                                    # Bộ 25 tài liệu đặc tả chuẩn hóa (v3.2.0)
├── public/                                  # Tài nguyên tĩnh (Logo vector, mẫu phôi chứng chỉ)
│
├── src/
│   ├── app/                                 # LỚP 1: TRÌNH DIỄN & ROUTING (Next.js 16 App Router)
│   │   ├── (public)/                        # 4 Trang ngoài công khai (Bọc PublicHeader + PublicFooter)
│   │   │   ├── layout.tsx                   # PublicLayout (Không chứa ô tra cứu QR trên Header)
│   │   │   ├── page.tsx                     # Trang chủ (/) - Ghép 6 Section tối giản
│   │   │   ├── framework/page.tsx           # Giới thiệu Khung năng lực số & Phương pháp (/framework)
│   │   │   ├── pricing/page.tsx             # Bảng giá gói dịch vụ B2C & B2B (/pricing)
│   │   │   └── faq/page.tsx                 # Hướng dẫn sử dụng & Giải đáp (/faq)
│   │   │
│   │   ├── (auth)/                          # Cổng xác thực & Đăng ký cố định vai trò
│   │   │   ├── login/page.tsx               # Đăng nhập (/login)
│   │   │   ├── register/page.tsx            # Đăng ký cố định Learner hoặc Evaluator + NĐ 13 (/register)
│   │   │   └── reset-password/page.tsx      # Khôi phục mật khẩu (/reset-password)
│   │   │
│   │   ├── (dashboard)/                     # 3 Cổng Dashboard tách biệt Shell (TUYỆT ĐỐI KHÔNG CÓ FOOTER)
│   │   │   ├── learner/                     # 1. PORTAL NGƯỜI HỌC (9 Menu + 3 Trang con)
│   │   │   │   ├── layout.tsx               # LearnerLayout (LearnerSidebar + LearnerTopbar)
│   │   │   │   ├── dashboard/page.tsx       # Tổng quan năng lực, Điểm (point) & Nhận xét mới
│   │   │   │   ├── assessments/page.tsx     # Thư viện bài đánh giá chuẩn NEXA (B2C)
│   │   │   │   ├── live-pin/page.tsx        # Vào phòng thi trực tiếp qua Link (?pin=), Mã PIN, QR
│   │   │   │   ├── groups/page.tsx          # Tham gia nhóm (?join=) & Xem nhận xét từ Người đánh giá
│   │   │   │   ├── submissions/page.tsx     # Lịch sử bài thi, Nộp lại & So sánh tiến bộ Pre/Post
│   │   │   │   ├── learning-path/page.tsx   # Lộ trình phát triển năng lực 4 bước & Đánh giá lại
│   │   │   │   ├── leaderboard/page.tsx     # Bảng xếp hạng Rank Top 100+ (Tuần / Tháng / Nhóm)
│   │   │   │   ├── credentials/page.tsx     # Chứng chỉ số QR, Huy hiệu & Hồ sơ năng lực (Portfolio)
│   │   │   │   ├── billing/page.tsx         # Nâng cấp gói Learner Pro & Lịch sử VietQR
│   │   │   │   ├── take/[id]/page.tsx       # Phòng làm bài Zen Mode (4 hình thức + Auto-save 15s)
│   │   │   │   ├── results/[id]/page.tsx    # Báo cáo kết quả, Radar, 5 ứng dụng AI & Nhận xét
│   │   │   │   └── profile/page.tsx         # Cài đặt tài khoản & Quyền riêng tư NĐ 13
│   │   │   │
│   │   │   ├── evaluator/                   # 2. PORTAL NGƯỜI ĐÁNH GIÁ (8 Menu)
│   │   │   │   ├── layout.tsx               # EvaluatorLayout (EvaluatorSidebar + EvaluatorTopbar)
│   │   │   │   ├── dashboard/page.tsx       # Tổng quan khảo thí, Hàng đợi chấm & Hồ sơ chuyên gia
│   │   │   │   ├── groups/page.tsx          # Quản lý nhóm (Link/Mã/QR) & Gửi nhận xét cho học viên
│   │   │   │   ├── item-bank/page.tsx       # Ngân hàng câu hỏi 4 hình thức & Rubric 100% Builder
│   │   │   │   ├── exams/page.tsx           # Thiết kế đề đánh giá & Giao bài cho nhóm
│   │   │   │   ├── live-room/page.tsx       # Mở & Giám sát phòng thi trực tiếp (Phòng Mở / Theo nhóm)
│   │   │   │   ├── grading/page.tsx         # Bàn chấm Split-view, Cờ tin cậy AI & Đánh dấu Bài mẫu
│   │   │   │   ├── analytics/page.tsx       # Bản đồ nhiệt (Skill Heatmap) & Xuất dữ liệu Excel/CSV/PDF
│   │   │   │   └── billing/page.tsx         # Quản lý gói Evaluator Free/Pro/Enterprise
│   │   │   │
│   │   │   └── admin/                       # 3. PORTAL CHỦ NỀN TẢNG - SUPER ADMIN (11 Menu)
│   │   │       ├── layout.tsx               # AdminLayout (AdminSidebar + AdminTopbar)
│   │   │       ├── dashboard/page.tsx       # Vận hành tổng thể sàn, Doanh thu & Lưu lượng AI
│   │   │       ├── users/page.tsx           # Quản trị tài khoản người dùng
│   │   │       ├── organizations/page.tsx   # Quản lý khách hàng Tổ chức B2B
│   │   │       ├── evaluator-vetting/page.tsx # Duyệt cấp tích xác thực Chuyên gia
│   │   │       ├── framework-engine/page.tsx  # Quản trị Khung năng lực số động (Đa phiên bản)
│   │   │       ├── benchmark-bank/page.tsx  # Biên soạn & Xuất bản Ngân hàng đề chuẩn NEXA
│   │   │       ├── learning-content/page.tsx# Quản trị Kho học liệu chuẩn gắn nhãn kỹ năng
│   │   │       ├── pricing-plans/page.tsx   # Thiết lập gói dịch vụ B2C/B2B & Đối soát VietQR
│   │   │       ├── credentials/page.tsx     # Quản lý mẫu phôi, Hậu kiểm B2C & Thu hồi chứng chỉ
│   │   │       ├── ai-gateway/page.tsx      # Đổi mô hình AI (Gemini/GPT/Claude), Prompt & Bài mẫu
│   │   │       ├── analytics/page.tsx       # Xuất Bộ dữ liệu Nghiên cứu ẩn danh (CSV/Excel/JSON)
│   │   │       ├── audit-logs/page.tsx      # Tra cứu Nhật ký kiểm toán bất biến
│   │   │       └── settings/page.tsx        # Cấu hình hệ thống & Thực thi quyền riêng tư NĐ 13
│   │   │
│   │   ├── verify/[credentialId]/page.tsx   # Trang Kiosk độc lập khi quét mã QR trên chứng chỉ PDF
│   │   │
│   │   └── api/                             # RESTful Resource-Oriented API Route Handlers
│   │       ├── auth/                        # register, login, consent
│   │       ├── questions/                   # CRUD câu hỏi 4 hình thức & Rubric
│   │       ├── assessments/                 # public-library, save-draft, submit, results
│   │       ├── groups/                      # join (Link/Mã/QR) & [id]/feedbacks (Nhận xét nhóm)
│   │       ├── live-sessions/               # open (OPEN / GROUP_ONLY), join, [pin]/monitor
│   │       ├── ai/                          # evaluate-session (Pipeline 2 lần gọi AI)
│   │       ├── learning/                    # pathways & [id]/complete (+30 điểm (point))
│   │       ├── leaderboard/                 # Bảng xếp hạng Top 100+
│   │       ├── credentials/                 # issue, verify/[id], revoke
│   │       ├── analytics/                   # Xuất dữ liệu nhóm cho Evaluator
│   │       ├── billing/                     # plans, create-vietqr, webhook
│   │       └── admin/                       # frameworks, ai-configurations, research-export
│   │
│   ├── features/                            # LỚP 2: 7 PHÂN HỆ NGHIỆP VỤ CỐT LÕI (Domain Logic)
│   │   ├── identity-access/                 # Auth, Static Role Guard, Consent NĐ 13, Organizations
│   │   ├── assessment-engine/               # 4 Hình thức câu hỏi, Rubric, Nhóm, Nhận xét, Phòng PIN
│   │   ├── ai-gateway/                      # Adapters (Gemini/OpenAI/Claude), 2-Call Pipeline, Prompts
│   │   ├── learning-content/                # Kho học liệu chuẩn & Vòng lặp Lộ trình 4 bước
│   │   ├── credentialing-portfolio/         # PDF Vector, SHA-256 kép, QR, Huy hiệu, Điểm (point) & Leaderboard
│   │   ├── billing-finance/                 # Gói dịch vụ B2C/B2B, VietQR & Webhook Idempotent
│   │   └── admin-governance/                # Khung năng lực động, Privacy Service & Xuất dữ liệu nghiên cứu
│   │
│   ├── components/                          # LỚP 3A: GIAO DIỆN DÙNG CHUNG
│   │   ├── landing/                         # Các Section tối giản của Trang chủ
│   │   ├── shared/                          # 3 Bộ Shell tách biệt: sidebar/, topbar/, avatar-menu/, header/, footer/
│   │   ├── charts/                          # RadarChart.tsx (Duy nhất toàn dự án) & HeatmapChart.tsx
│   │   └── ui/                              # Shadcn UI Primitives (Button, Card, Table, Dialog, Tabs...)
│   │
│   ├── lib/                                 # LỚP 3B: HẠ TẦNG KỸ THUẬT
│   │   ├── supabase/                        # client.ts, server.ts, middleware.ts
│   │   ├── redis/                           # redis-client.ts (Live PIN, Auto-save, Leaderboard Cache)
│   │   └── utils/                           # cn.ts, sha256.ts, csv-exporter.ts
│   │
│   ├── types/                               # GLOBAL TYPES (database.types.ts, framework.types.ts, common.types.ts)
│   └── config/                              # env.ts (Zod validation) & constants.ts
│
├── supabase/                                # LỚP 4: QUẢN TRỊ CSDL VERSIONED
│   ├── migrations/                          # Các tệp SQL khởi tạo 30 bảng, RLS, Triggers, Indexes
│   └── seed.sql                             # Dữ liệu hạt giống: Khung năng lực chuẩn, Tài khoản Admin, Gói cước
│
└── tests/                                   # KIỂM THỬ TỰ ĐỘNG (unit/, integration/, e2e/)
```

---

## 2. NĂM RANH GIỚI PHỤ THUỘC BẮT BUỘC (5 DEPENDENCY BOUNDARIES)

1. **Tầng `src/app/` chỉ chứa Thin Pages:** Không viết truy vấn SQL hay thuật toán tính điểm trong `page.tsx`; mọi xử lý phải gọi qua `src/features/[module]/services/`.
2. **Không import chéo Component nội bộ giữa các Feature:** Các thành phần dùng chung giữa nhiều phân hệ (như `RadarChart.tsx`) phải đặt tại `src/components/`.
3. **Cách ly tuyệt đối 3 Bộ Shell Dashboard:** `learner/layout.tsx` chỉ được import `LearnerSidebar`, `LearnerTopbar`, `LearnerAvatarMenu` (tương tự cho `evaluator` và `admin`).
4. **Cách ly SDK AI bên trong `ai-gateway/adapters/`:** Các phân hệ khác chỉ giao tiếp với `aiOrchestratorService`, không gọi trực tiếp thư viện Gemini/OpenAI/Claude.
5. **Không định nghĩa trùng lặp Domain Types ra ngoài `src/types/`:** `src/types/` chỉ chứa đúng 3 tệp toàn cục.
