# ĐẶC TẢ NGĂN XẾP CÔNG NGHỆ & QUYẾT ĐỊNH KIẾN TRÚC (TECHNOLOGY STACK SPECIFICATION)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-TECH-STACK`
- **Phiên bản:** `v3.2.0`
- **Mục tiêu:** Đảm bảo hiệu năng cao, chi phí vận hành tối ưu cho Chủ nền tảng, dễ dàng tùy biến AI và xuất dữ liệu nghiên cứu chuẩn xác.

---

## 1. MA TRẬN NGĂN XẾP CÔNG NGHỆ CỐT LÕI (CORE TECH MATRIX)

| Tầng Kiến trúc | Công nghệ lựa chọn | Phiên bản | Vai trò & Mục đích sử dụng trong NEXA |
| :--- | :--- | :---: | :--- |
| **Full-stack Framework** | **Next.js (App Router)** | `16.3.5` | Xử lý đồng thời giao diện React Server Components (RSC), định tuyến 3 Portal và hệ thống RESTful API Route Handlers. |
| **Ngôn ngữ lập trình** | **TypeScript** | `5.x` | Bật chế độ `strict: true`, đảm bảo an toàn kiểu dữ liệu 100% từ Database lên tới giao diện. |
| **UI Core & Styling** | **React 19 + Tailwind CSS** | `v4.x` | Thiết kế giao diện tối giản khoa học (Monochrome Slate + 1 Accent), tốc độ tải trang cực nhanh. |
| **UI Components & Icons** | **Shadcn UI (Radix) + Lucide** | Mới nhất | Hệ thống component đạt chuẩn khả năng tiếp cận WCAG 2.2 AA và bộ icon vector nét mảnh đồng bộ. |
| **Cơ sở dữ liệu chính** | **Supabase PostgreSQL** | `15+` | Lưu trữ 30 bảng vật lý (Khung năng lực động, Câu hỏi 4 hình thức, Bài làm, Điểm (point), Nhận xét nhóm) với **100% RLS**. |
| **Xác thực & Lưu trữ tệp** | **Supabase Auth & Storage** | Mới nhất | Quản lý đăng ký cố định vai trò, OTP, Session Cookie và lưu trữ tệp sản phẩm minh chứng số (`PDF`, `PNG`, `ZIP`). |
| **Bộ đệm & Thời gian thực** | **Upstash Redis** | Mới nhất | Quản lý mã PIN/Link phòng thi trực tiếp, Auto-save 15s, Rate Limiting và Cache Bảng xếp hạng Top 100+. |
| **Động cơ AI Đa mô hình** | **Google GenAI / OpenAI / Claude** | Mới nhất | Tầng Adapter hỗ trợ chuyển đổi linh hoạt giữa `@google/genai` (`gemini-2.5-flash`), `openai` (`gpt-4o`) và `@anthropic-ai/sdk`. |
| **Đồ thị & Trực quan hóa** | **Recharts (SVG Custom)** | `2.x` | Xây dựng duy nhất `RadarChart.tsx` (Biểu đồ mạng nhện năng lực) và `HeatmapChart.tsx` (Bản đồ nhiệt kỹ năng nhóm). |
| **Xuất dữ liệu & Chứng chỉ** | **SheetJS (`xlsx`) + PDFKit + `qrcode`** | Mới nhất | Xuất bảng điểm và Bộ dữ liệu nghiên cứu ra `.xlsx` / `.csv`; kết xuất Chứng chỉ số PDF Vector kèm mã QR động. |
| **Kiểm tra dữ liệu & State** | **Zod + React Hook Form + Zustand** | `5.x` | Kiểm tra chặt chẽ cấu trúc JSON 4 dạng câu hỏi, tổng trọng số Rubric = 100% và quản lý trạng thái phòng thi Zen Mode. |
| **Kiểm thử tự động** | **Vitest + Playwright** | Mới nhất | Kiểm thử đơn vị (Unit Test), kiểm thử tích hợp API và kiểm thử toàn trình (E2E). |

---

## 2. GIẢI TRÌNH CÁC QUYẾT ĐỊNH KIẾN TRÚC TRỌNG YẾU (ARCHITECTURAL TRADE-OFFS)

### 2.1. Tại sao dùng Kiến trúc Khung Năng lực Động trong PostgreSQL thay vì cấu hình tĩnh?

- **Vấn đề:** Nếu định nghĩa cứng các miền năng lực và kỹ năng trong file cấu hình code, mỗi khi khung tiêu chuẩn năng lực số cập nhật hoặc tổ chức muốn đánh giá theo bộ tiêu chí mới, lập trình viên phải sửa code và deploy lại.
- **Giải pháp:** Lưu trữ toàn bộ cấu trúc Khung năng lực (`assessment_frameworks`), Miền năng lực (`competency_domains`) và Kỹ năng (`competencies`) trong PostgreSQL có gắn phiên bản (`version`). Chủ nền tảng (Admin) có thể thêm/sửa/nâng cấp khung năng lực trực tiếp trên giao diện `/admin/framework-engine` mà vẫn bảo toàn nguyên vẹn lịch sử điểm số của các phiên bản trước.

### 2.2. Tại sao dùng Adapter Đa mô hình AI kết hợp Pipeline 2 Lần Gọi (2-Call Pipeline)?

- **Vấn đề:** Nếu gắn chết vào 1 hãng AI, hệ thống sẽ gặp rủi ro khi API hãng đó bảo trì hoặc thay đổi giá. Mặt khác, nếu tách 5 ứng dụng AI thành 5 lần gọi API rời rạc, thời gian chờ sẽ kéo dài 15–20 giây và tốn gấp 3 lần chi phí Token.
- **Giải pháp:**
  1. Thiết kế `AIProviderAdapter` cho phép đổi qua lại giữa Gemini, OpenAI và Claude ngay trong trang Admin.
  2. Gom 5 ứng dụng AI thành **đúng 2 lần gọi API**: Lần 1 chấm điểm Rubric cho các câu thực hành/minh chứng; sau khi code cộng điểm với phần trắc nghiệm và lấy danh sách học liệu thật từ DB, Lần 2 thực hiện đồng thời cả 4 việc (Phân tích mạnh/yếu + Khoảng trống năng lực + Phản hồi cá nhân hóa + Sắp xếp lộ trình học tập). Thời gian xử lý giảm xuống chỉ còn **3–5 giây**.

### 2.3. Tại sao Bảng xếp hạng Top 100+ và Điểm tích lũy (point) hoàn toàn không làm nặng hệ thống?

- Điểm tích lũy (`points`) chỉ được tính toán và cập nhật đúng tại thời điểm phát sinh sự kiện (nộp bài thi hoặc hoàn thành học liệu).
- Trang Bảng xếp hạng (`/learner/leaderboard`) đọc danh sách Top 100+ từ bộ nhớ đệm **Upstash Redis** (được làm mới mỗi 5 phút từ chỉ mục `idx_profiles_points_desc` của PostgreSQL), giúp hàng ngàn người học cùng xem bảng xếp hạng mà không tốn tài nguyên tính toán của cơ sở dữ liệu.

### 2.4. Tại sao tách biệt hoàn toàn 3 Bộ Shell Dashboard (Zero-Shared Shell)?

- Người học (`Learner`), Người đánh giá (`Evaluator`) và Chủ nền tảng (`Admin`) có mục tiêu sử dụng, danh mục menu và công cụ trên thanh Topbar hoàn toàn khác nhau.
- Việc tách thành 3 bộ `Sidebar`, `Topbar`, `AvatarMenu` độc lập giúp code từng phân hệ cực kỳ sạch sẽ, không chứa các khối `if (role === ...)` phức tạp và ngăn chặn triệt để nguy cơ lộ menu quản trị sang giao diện người học.
