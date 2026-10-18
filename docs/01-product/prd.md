# TÀI LIỆU ĐẶC TẢ SẢN PHẨM CHI TIẾT (PRODUCT REQUIREMENTS DOCUMENT - PRD)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-PRD`
- **Phiên bản:** `v3.2.1` (Đã khử trùng lặp nội dung & Đồng bộ Cơ chế Kích hoạt AI Theo Yêu Cầu - On-Demand AI)
- **Trạng thái:** Chuẩn hóa Triển khai (Production-Ready Specification)
- **Chủ sở hữu vận hành hệ thống (`Super Admin`):** Chủ nền tảng NEXA

---

## 1. BẢN ĐỒ 7 PHÂN HỆ NĂNG LỰC & THỨ TỰ TRIỂN KHAI (CAPABILITY MAP)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 7. admin-governance (Khung năng lực động, Đề chuẩn, Xuất DL nghiên cứu)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Cung cấp Khung chuẩn & Cấu hình)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. identity-access (Supabase Auth, 1 Email = 1 Role tĩnh, Tổ chức B2B) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Ủy quyền truy cập)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. assessment-engine (4 Hình thức thi, Rubric 100%, Phòng Link/PIN/QR) │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │ (Bấm nút kích hoạt On-Demand AI)       │ (Điểm khách quan & Điểm (point))
                ▼                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│ 3. ai-gateway (Model-Agnostic)│        │ 5. credentialing-portfolio    │
│ • Đổi model: Gemini/GPT/Claude│        │ • Chứng chỉ PDF Vector + QR   │
│ • Nút 1: AI Chấm Rubric       │        │ • Huy hiệu & Bảng xếp hạng    │
│ • Nút 2: AI Phân tích & Lộ trình│      │   Rank Top 100+ (Point Engine)   │
└───────────────┬───────────────┘        └───────────────────────────────┘
                │ (Ánh xạ kỹ năng yếu < 60%)
                ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. learning-content (Kho học liệu chuẩn & Lộ trình phát triển 4 bước)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Nâng cấp gói Free / Pro / B2B)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 6. billing-finance (Gói dịch vụ B2C/B2B, VietQR động, Webhook HMAC)    │
└────────────────────────────────────────────────────────────────────────┘
```

### Bảng Phân bổ Trách nhiệm 7 Phân hệ Nghiệp vụ (`src/features/`)

| Module ID | Trách nhiệm Nghiệp vụ Cốt lõi | Quan hệ Dữ liệu & Tác nghiệp |
| :--- | :--- | :--- |
| **`identity-access`** | Đăng ký (chọn cố định `LEARNER` hoặc `EVALUATOR`), Đăng nhập, OTP Email, Google SSO qua Supabase Auth; Quản lý thành viên Tổ chức B2B (`user_organizations`); Lưu trữ đồng thuận dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP (`consent_logs`). | Khởi tạo định danh và phân quyền tĩnh cho toàn bộ hệ thống. |
| **`assessment-engine`** | Quản lý câu hỏi 4 hình thức (`MCQ`, `SCENARIO`, `PRACTICAL_TASK`, `DIGITAL_EVIDENCE`), Ma trận Rubric 100%; Quản lý Nhóm (`assessment_groups`), Nhận xét của Người đánh giá gửi cho học viên (`group_feedbacks`); Phòng thi trực tiếp qua Link/PIN/QR (chế độ Mở không cần nhóm hoặc Theo nhóm); Auto-save 15s lên Redis; Nộp bài chấm câu hỏi khách quan tức thì (`0.01s`); Xuất dữ liệu khảo thí Excel/CSV. | Tiếp nhận bài nộp, tự chấm phần khách quan và kết nối với `ai-gateway` khi người dùng bấm nút kích hoạt AI. |
| **`ai-gateway`** | Cổng AI Đa mô hình (`AIProviderAdapter` hỗ trợ Gemini, OpenAI, Claude); Cơ chế huấn luyện 3 tầng (Khung năng lực + Rubric 100% + Bài mẫu chuẩn); Thực thi **2 tác vụ AI theo yêu cầu (On-Demand)** giải quyết đủ 5 ứng dụng AI: (1) Hỗ trợ chấm điểm, (2) Điểm mạnh/yếu, (3) Khoảng trống năng lực, (4) Phản hồi cá nhân hóa, (5) Đề xuất lộ trình. | Chỉ kích hoạt và tiêu tốn Token khi Learner hoặc Evaluator chủ động bấm nút yêu cầu. |
| **`learning-content`** | Quản lý Kho học liệu chuẩn hóa (`learning_content_items`) gắn nhãn theo các kỹ năng của Khung năng lực số; Vận hành vòng lặp **Lộ trình phát triển 4 bước** (`learning_pathways`); Cộng `+30 điểm (point)` khi hoàn thành bài học và mở khóa đánh giá lại kỹ năng. | Nhận danh sách kỹ năng yếu ($<60\%$) sau khi chạy phân tích AI. |
| **`credentialing-portfolio`** | Kết xuất Chứng chỉ số PDF Vector chuẩn PDF/A-1b, bảo đảm toàn vẹn 2 tầng bằng SHA-256 (`data_hash` & `file_hash`), tạo QR dẫn tới trang Kiosk độc lập `/verify/[id]`; Quản lý Thu hồi chứng chỉ; Quản lý Huy hiệu, Điểm tích lũy (`points`) và **Bảng xếp hạng Top 100+ (`Leaderboard`)**. | Cấp chứng chỉ và cập nhật thứ hạng điểm (point) khi phiên thi hoàn tất đạt chuẩn. |
| **`billing-finance`** | Quản lý biểu phí các gói dịch vụ thương mại (`Learner Free/Pro`, `Evaluator Free/Pro`, `Enterprise`), sinh mã thanh toán VietQR động, xác thực chữ ký Webhook `HMAC-SHA512` chống trùng lặp (`Idempotent`), cấp phát hạn mức (`Credits` / `Quota`). | Kiểm soát hạn mức tài nguyên cho cả khách hàng B2C và B2B. |
| **`admin-governance`** | Bảng điều khiển dành riêng cho Chủ nền tảng (Admin): Quản trị Khung năng lực số động đa phiên bản, xuất bản Ngân hàng đề chuẩn NEXA, duyệt hồ sơ chuyên gia, quản lý mẫu phôi chứng chỉ, cấu hình AI Gateway, Nhật ký kiểm toán (`audit_logs`), `privacy.service.ts` và **Xuất Bộ dữ liệu Nghiên cứu ẩn danh (CSV/Excel/JSON)**. | Cung cấp khung tiêu chuẩn gốc, đề chuẩn và quản trị toàn sàn. |

---

## 2. ĐẶC TẢ NGHIỆP VỤ TRỌNG TÂM (CORE PRODUCT SPECIFICATIONS)

### 2.1. Cấu trúc 4 Không gian Hệ thống

1. **Không gian Công khai (`Public Pages`):** Bao gồm Trang chủ (`/`), Tính năng (`/features`), Khung năng lực & Phương pháp (`/framework`), Bảng giá (`/pricing`), Hướng dẫn & FAQ (`/faq`), Liên hệ (`/contact-us`). **Tuyệt đối không đặt ô tra cứu chứng chỉ QR trên Landing Page hoặc `PublicHeader`** (trang `/verify/[credentialId]` chỉ mở khi quét mã QR trên chứng chỉ).
2. **Không gian Người học (`Learner Portal - /learner/*`):** Phục vụ người học tự đánh giá (B2C) và thí sinh trong nhóm/phòng thi.
3. **Không gian Người đánh giá (`Evaluator Portal - /evaluator/*`):** Khách vãng lai tự đăng ký vai trò `EVALUATOR` vào thẳng gói Free để tạo nhóm, ra đề, mở phòng thi và chấm bài ngay.
4. **Không gian Chủ nền tảng (`Super Admin Portal - /admin/*`):** Dành riêng cho Chủ sở hữu hệ thống NEXA.

### 2.2. Bốn Hình thức Đánh giá & Cơ chế Kích hoạt 5 Ứng dụng AI Theo Yêu cầu (On-Demand AI)

- **Khi bấm nút "Nộp bài":** Hệ thống chấm tự động tức thì (`0.01 giây`, tốn `0 Token AI`) toàn bộ các câu hỏi **Trắc nghiệm (`MCQ`)** và nhánh chọn **Tình huống (`SCENARIO`)**, đồng thời lưu câu trả lời **Nhiệm vụ thực hành (`PRACTICAL_TASK`)** và **Sản phẩm minh chứng số (`DIGITAL_EVIDENCE`)** vào CSDL.
- **Khi người dùng chủ động bấm nút kích hoạt AI:**
  1. **Nút bấm 1 (`POST /api/ai/grade-submission` — Ứng dụng AI số 1):** Chấm điểm các câu Tình huống tự luận, Thực hành và Sản phẩm minh chứng theo Ma trận Rubric 100%, trích dẫn bằng chứng (`evidenceQuote`) và trả về Cờ tin cậy (`>= 0.85` Cờ Xanh, `0.70 - 0.84` Cờ Cam, `< 0.70` Cờ Đỏ).
  2. **Nút bấm 2 (`POST /api/ai/analyze-competency` — Ứng dụng AI số 2, 3, 4, 5):** Phân tích Điểm mạnh/Điểm yếu, Nhận diện Khoảng trống năng lực (`< 60%`), Tạo Phản hồi cá nhân hóa và Sắp xếp Lộ trình phát triển 4 bước từ Kho học liệu chuẩn.
- **Quyền chủ động của Người đánh giá (`/evaluator/grading`):** Có thể tự chấm điểm thủ công hoàn toàn (tốn `0 lượt AI`) hoặc bấm nút nhờ AI chấm gợi ý cho từng bài / nhóm bài đã chọn.

---

## 3. BẢY QUY ƯỚC KIẾN TRÚC BẤT BIẾN (7 IMMUTABLE GUARDRAILS)

1. **Xác thực đơn nhất qua Supabase Auth:** Sử dụng 100% `@supabase/ssr` và PostgreSQL RLS trên toàn bộ 30 bảng vật lý.
2. **Khử trùng lặp Biểu đồ:** Toàn dự án chỉ sử dụng duy nhất 1 component `src/components/charts/RadarChart.tsx` và 1 `HeatmapChart.tsx`.
3. **Kiến trúc Zero-Shared Shell & Không có Footer trong Dashboard:** Tách riêng hoàn toàn `Sidebar`, `Topbar`, `AvatarMenu` cho 3 cổng (`Learner`, `Evaluator`, `Admin`). Không đặt Footer trong bất kỳ màn hình Dashboard nào.
4. **Giao diện Tối giản Khoa học (Khử sạch "Mùi AI"):** Áp dụng quy tắc màu 90-8-2 Monochrome Slate (`#FFFFFF`, `#F8FAFC`, `#0F172A`, `#E2E8F0`) + 1 màu nhấn duy nhất (`#0284C7`); cấm dùng màu tím neon, gradient lòe loẹt, 5 màu cầu vồng trên thẻ và cấm dùng emoji trong JSX.
5. **Dịch vụ Quyền riêng tư & Xuất dữ liệu An toàn (`privacy.service.ts`):** Khử sạch PII trước khi gửi sang AI và trước khi xuất Bộ dữ liệu nghiên cứu (`Research Dataset Export`).
6. **Phân định Global Types vs Feature Types:** `src/types/` chỉ chứa `database.types.ts`, `framework.types.ts`, `common.types.ts`.
7. **Vai trò Tĩnh Bất biến (`1 Email = 1 Static Role`), Khung Năng lực Động & On-Demand AI:** Khóa cứng vai trò sau khi đăng ký; đọc động Khung năng lực số và nhà cung cấp AI từ CSDL; chỉ gọi API AI khi người dùng bấm nút kích hoạt.

---

## 4. LỆNH THỰC THI & TIÊU CHÍ NGHIỆM THU TỔNG THỂ

```bash
npm install               # Cài đặt thư viện phụ thuộc
npm run dev               # Chạy môi trường phát triển (http://localhost:3000)
npm run lint              # Kiểm tra quy chuẩn mã nguồn ESLint
npx tsc --noEmit          # Kiểm tra kiểu TypeScript nghiêm ngặt (Strict Mode)
npm test -- --coverage    # Chạy Unit & Integration Tests (Coverage >= 85%)
npm run build             # Đóng gói Production
```

- [ ] Vận hành mượt mà cả 4 hình thức câu hỏi, nộp bài chấm trắc nghiệm tức thì (`0.01s`) và 2 nút bấm kích hoạt AI đáp ứng đủ 5 ứng dụng AI.
- [ ] Tham gia Nhóm và Phòng thi trực tiếp (chế độ Mở không cần nhóm & chế độ Nhóm) qua Link, Mã PIN 6 số và QR Code.
- [ ] Hiển thị Nhận xét của Người đánh giá gửi cho Người học, Bảng xếp hạng Top 100+ Điểm (point) và công cụ Xuất dữ liệu nghiên cứu (`CSV/Excel/JSON`).
