# HỆ THỐNG TÀI LIỆU DỰ ÁN NEXA (DOCUMENTATION REPOSITORY)

## NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO

*(AI-Powered Digital Competency Assessment, Certification & Adaptive Development Platform)*

---

- **Tên nền tảng:** NEXA Platform
- **Mô hình vận hành:** SaaS Đa phân khúc — **B2C** (Người học tự đánh giá & phát triển) + **B2B2C** (Người đánh giá độc lập) + **B2B** (Tổ chức, Trường học & Doanh nghiệp)
- **Khung năng lực cốt lõi:** **Khung Năng lực Số Chuẩn Động** (Tham chiếu chuẩn quốc tế EU DigComp, hỗ trợ cập nhật đa phiên bản linh hoạt)
- **Tiêu chuẩn pháp lý:** Nghị định 13/2023/NĐ-CP (Bảo vệ Dữ liệu Cá nhân) & GDPR
- **Phiên bản đặc tả:** **`v3.2.0` — HOÀN THIỆN & ĐỒNG BỘ 100% (25/25 Tài liệu)**

---

## BẢN ĐỒ CẤU TRÚC HỆ THỐNG TÀI LIỆU (9 NHÓM CHUYÊN SÂU)

```text
docs/
├── README.md                          # Bản đồ điều hướng toàn bộ 25 tài liệu dự án
├── 00-project-context.md              # Bối cảnh, mô hình B2C/B2B, 4 hình thức thi, 5 ứng dụng AI & Rank Top 100+
│
├── 01-product/                        # PHÂN HỆ SẢN PHẨM & NGHIỆP VỤ (PRODUCT MANAGEMENT)
│   ├── prd.md                         # PRD Master Spec (7 Capability Modules, 3 Portals, 6 Guardrails)
│   ├── requirements.md                # 55 Quy tắc Nghiệp vụ Bất biến (Business Rules Catalog)
│   ├── use-cases.md                   # 50 Use Cases chi tiết cho Guest, Learner, Evaluator, Admin & AI
│   └── user-stories.md                # Danh mục User Stories chuẩn Agile Gherkin (Given - When - Then)
│
├── 02-design/                         # THIẾT KẾ TRẢI NGHIỆM & GIAO DIỆN TỐI GIẢN (UI/UX DESIGN)
│   ├── ux-flow.md                     # Sơ đồ Master Routing, Ma trận URL & 15 Luồng nghiệp vụ chi tiết
│   ├── ui-spec.md                     # Đặc tả từng màn hình 4 Trang ngoài & 3 Dashboard tách biệt Shell
│   └── design-system.md               # Design Tokens Monochrome + 1 Accent (Khử mùi AI), Typography & Layout
│
├── 03-architecture/                   # KIẾN TRÚC KỸ THUẬT & CƠ SỞ DỮ LIỆU (SYSTEM ARCHITECTURE)
│   ├── architecture.md                # Mô hình C4 4 mức, Kiến trúc 4 lớp sạch & Luồng dữ liệu trọng yếu
│   ├── tech-stack.md                  # Ngăn xếp Next.js 16, Tailwind v4, Supabase, Redis, Model-Agnostic AI
│   ├── database.md                    # 30 Bảng CSDL vật lý, JSONB Schema 4 dạng câu hỏi, RLS 100% & Indexes
│   └── api.md                         # Chuẩn RESTful Resource-oriented API, RFC 7807 Error & Rate Limiting
│
├── 04-development/                    # QUY CHUẨN LẬP TRÌNH & PHÁT TRIỂN (ENGINEERING GUIDELINES)
│   ├── coding-guidelines.md           # Chuẩn TypeScript Strict, Zero-any, Naming conventions & Clean Code
│   ├── folder-structure.md            # Cây thư mục dự án đồng bộ 100% Routes & 5 Ranh giới import cấm kỵ
│   └── development-rules.md           # 6 Quy ước kiến trúc bất biến, Phân định Types & Cổng kiểm soát CI
│
├── 05-ai/                             # HỆ THỐNG TRÍ TUỆ NHÂN TẠO ĐA MÔ HÌNH (AI ENGINE & WORKFLOW)
│   ├── ai-rules.md                    # Đạo đức AI, Huấn luyện 3 tầng, Kiểm soát ảo giác & Khử định danh PII
│   ├── agent-workflow.md              # Pipeline 2 lần gọi AI đáp ứng 5 ứng dụng AI & Cơ chế Lộ trình 4 bước
│   └── prompts.md                     # Kho System Prompts & JSON Schemas chuẩn hóa cho chấm điểm & lộ trình
│
├── 06-testing/                        # ĐẢM BẢO CHẤT LƯỢNG & KIỂM THỬ (QUALITY ASSURANCE)
│   ├── testing-strategy.md            # Kim tự tháp kiểm thử Vitest & Playwright, TDD & Độ bao phủ 85%
│   ├── test-cases.md                  # Ma trận 28 Test Cases tự động trọng yếu bao phủ toàn bộ tính năng
│   └── acceptance-criteria.md         # Tiêu chí nghiệm thu DoR, DoD từng phân hệ & Release Readiness
│
├── 07-deployment/                     # VẬN HÀNH & TRIỂN KHAI HẠ TẦNG (DEVOPS & INFRASTRUCTURE)
│   ├── deployment.md                  # Kiến trúc triển khai Vercel + Supabase Cloud + Upstash Redis & CI/CD
│   └── environment.md                 # Ma trận biến môi trường, Cấu hình AI đa nhà cung cấp & Zod Validation
│
└── 08-project-management/             # QUẢN TRỊ DỰ ÁN & TIẾN ĐỘ (PROJECT MANAGEMENT)
    ├── roadmap.md                     # Lộ trình phát triển 4 giai đoạn & Chỉ số thành công then chốt (OKRs)
    └── changelog.md                   # Nhật ký phiên bản Semantic Versioning (Cập nhật v3.2.0)
```

---

## DANH MỤC TRUY CẬP NHANH 25 TÀI LIỆU ĐẶC TẢ

| STT | Nhóm thư mục | Tệp tài liệu | Trọng tâm nội dung chuẩn hóa (`v3.2.0`) |
| :-: | :--- | :--- | :--- |
| **01** | `Root` | `00-project-context.md` | Định vị B2C + B2B, 4 hình thức thi, 5 ứng dụng AI, Huấn luyện AI 3 tầng, Lộ trình 4 bước, Rank Top 100+ & Xuất dữ liệu nghiên cứu. |
| **02** | `01-product` | `prd.md` | Bản đặc tả tổng thể PRD Master: 7 Capability Modules, 3 Portals, 6 Guardrails kiến trúc. |
| **03** | `01-product` | `requirements.md` | 55 Quy tắc nghiệp vụ bất biến (`BR-AUTH` $\rightarrow$ `BR-GAME`, `BR-EXPORT`). |
| **04** | `01-product` | `user-stories.md` | Hệ thống User Stories chuẩn Gherkin (`Given - When - Then`) cho Guest, Learner, Evaluator, Admin. |
| **05** | `01-product` | `use-cases.md` | 50 Use Cases chi tiết chuẩn công nghiệp, làm rõ phòng thi Link/PIN/QR và nhận xét trong nhóm. |
| **06** | `02-design` | `ux-flow.md` | Sơ đồ Master Routing đồng bộ 100% URL và 15 Luồng quy trình nghiệp vụ. |
| **07** | `02-design` | `ui-spec.md` | Đặc tả giao diện 4 Trang ngoài (không có Verify QR trên Header) & 3 Dashboard tách biệt hoàn toàn Shell. |
| **08** | `02-design` | `design-system.md` | Bảng màu Tối giản Khoa học (Monochrome Slate + 1 Accent, loại bỏ hoàn toàn màu lòe loẹt kiểu AI). |
| **09** | `03-architecture` | `architecture.md` | Mô hình C4 4 mức, Kiến trúc 4 lớp sạch & Luồng xử lý dữ liệu thời gian thực. |
| **10** | `03-architecture` | `tech-stack.md` | Ngăn xếp công nghệ Next.js 16.3.5, Tailwind v4, Supabase, Upstash Redis & AI Adapter đa mô hình. |
| **11** | `03-architecture` | `database.md` | 30 Bảng CSDL vật lý, JSONB Schema cho 4 hình thức câu hỏi, Điểm tích lũy (point), Nhận xét nhóm & RLS 100%. |
| **12** | `03-architecture` | `api.md` | Chuẩn RESTful API theo tài nguyên, bổ sung API Leaderboard, Group Feedback & Research Data Export. |
| **13** | `04-development` | `coding-guidelines.md` | Tiêu chuẩn TypeScript Strict, Zero-any, Naming Conventions, RSC First & Clean Code. |
| **14** | `04-development` | `folder-structure.md` | Cây thư mục dự án khớp 100% với bảng định tuyến URL của `ui-spec.md` và `ux-flow.md`. |
| **15** | `04-development` | `development-rules.md` | 6 Guardrails kiến trúc, Quy chuẩn phân định Types, Git Workflow & 4 Chốt chặn CI/CD. |
| **16** | `05-ai` | `ai-rules.md` | Cơ chế đổi mô hình AI linh hoạt, 3 tầng huấn luyện/chuẩn hóa AI, chống ảo giác & ẩn danh PII. |
| **17** | `05-ai` | `agent-workflow.md` | Thiết kế Pipeline 2 lần gọi API AI giải quyết trọn vẹn 5 ứng dụng AI và cơ chế Lộ trình 4 bước. |
| **18** | `05-ai` | `prompts.md` | Kho System Prompts và Native JSON Schemas cho chấm điểm Rubric, phân tích năng lực & ghép lộ trình. |
| **19** | `06-testing` | `testing-strategy.md` | Kim tự tháp kiểm thử phần mềm Vitest & Playwright, chiến lược Mocking & Độ bao phủ $\ge 85\%$. |
| **20** | `06-testing` | `test-cases.md` | Ma trận 28 Test Cases tự động trọng yếu (P1/P2/P3) bao phủ toàn bộ 7 phân hệ. |
| **21** | `06-testing` | `acceptance-criteria.md` | Tiêu chí nghiệm thu DoR, DoD và tiêu chuẩn phát hành sản phẩm. |
| **22** | `07-deployment` | `deployment.md` | Kiến trúc triển khai Serverless (Vercel + Supabase + Upstash Redis) & GitHub Actions CI/CD. |
| **23** | `07-deployment` | `environment.md` | Ma trận biến môi trường hỗ trợ đa nhà cung cấp AI (Gemini/OpenAI/Claude) & Zod Validation. |
| **24** | `08-project-management` | `roadmap.md` | Lộ trình phát triển sản phẩm theo 4 giai đoạn và chỉ số đo lường hiệu quả (OKRs). |
| **25** | `08-project-management` | `changelog.md` | Nhật ký thay đổi toàn dự án theo chuẩn Semantic Versioning (`v3.2.0`). |
