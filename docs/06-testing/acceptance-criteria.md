# TIÊU CHÍ NGHIỆM THU & ĐỊNH NGHĨA HOÀN THÀNH (ACCEPTANCE CRITERIA & DoD)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-ACCEPTANCE-CRITERIA`
- **Phiên bản:** `v3.2.0`
- **Khung tiêu chuẩn:** Definition of Ready (DoR), Definition of Done (DoD) & Release Readiness
- **Áp dụng:** Toàn bộ 7 phân hệ nghiệp vụ và 3 Portal (`Learner`, `Evaluator`, `Admin`)

---

## 1. TIÊU CHUẨN SẴN SÀNG TRƯỚC KHI LẬP TRÌNH (DEFINITION OF READY - DoR)

Một tính năng (Vertical Slice) chỉ được phép bắt đầu viết code khi thỏa mãn đủ 5 điều kiện:

1. **Nghiệp vụ tường minh:** Đã có Use Case trong `use-cases.md` và kịch bản Gherkin (`Given - When - Then`) trong `user-stories.md`.
2. **Thiết kế giao diện tối giản rõ ràng:** Đã được định nghĩa bố cục trong `ui-spec.md` và tuân thủ quy tắc màu **90-8-2 Monochrome Slate + 1 Accent (`#0284C7`)** của `design-system.md`.
3. **Hợp đồng API & Schema đã chốt:** Đã xác định rõ Request/Response trong `api.md` và cấu trúc Zod Schema tương ứng.
4. **Cấu trúc CSDL & RLS đã sẵn sàng:** Đã ánh xạ vào đúng bảng trong 30 bảng vật lý của `database.md` kèm chính sách bảo mật Row Level Security (RLS).
5. **Đường dẫn định tuyến đồng bộ:** Đường dẫn URL khớp 100% giữa `folder-structure.md`, `ux-flow.md` và `ui-spec.md`.

---

## 2. TIÊU CHUẨN HOÀN THÀNH TÍNH NĂNG (DEFINITION OF DONE - DoD)

Một tính năng chỉ được nghiệm thu hoàn thành (`Done`) khi vượt qua toàn bộ các chốt chặn sau:

### 2.1. Kiến trúc, Mã nguồn & Giao diện (Khử sạch "Mùi AI")

- [ ] Tuân thủ nghiêm ngặt TypeScript `strict: true`, không chứa từ khóa `any` (Zero-any Policy).
- [ ] Tuân thủ 100% **6 Quy ước Kiến trúc Bất biến**:
  1. Chỉ dùng duy nhất Supabase Auth (`@supabase/ssr`) + PostgreSQL RLS.
  2. Chỉ dùng duy nhất 1 component `src/components/charts/RadarChart.tsx`.
  3. Tách riêng tuyệt đối 3 bộ Shell (`Sidebar`, `Topbar`, `AvatarMenu`) cho 3 Dashboard; **không có Footer trong Dashboard**; **không đặt ô tra cứu QR trên Landing Page hay `PublicHeader`**.
  4. Thực thi bảo vệ dữ liệu cá nhân và khử PII qua `privacy.service.ts`.
  5. Phân định rõ Global Types (`src/types/`) và Feature Types (`src/features/*/types/`).
  6. Khóa cứng vai trò tĩnh (`1 Email = 1 Static Role`) và đọc động Khung năng lực số từ CSDL.
- [ ] Giao diện sạch sẽ, nghiêm túc: **Tuyệt đối không** dùng màu tím neon, dải màu chuyển sắc (gradient), 5 màu cầu vồng trên thẻ kỹ năng hay biểu tượng cảm xúc (emoji) trong JSX.

### 2.2. Kiểm thử & CI/CD

- [ ] Vượt qua `npm run lint` và `npx tsc --noEmit` với **0 lỗi**.
- [ ] Đạt độ bao phủ kiểm thử (Code Coverage) $\ge 85\%$ đối với các Domain Services.
- [ ] Chạy thành công `npm run build` ở chế độ Production.

---

## 3. TIÊU CHÍ NGHIỆM THU NGHIỆP VỤ THEO 7 PHÂN HỆ

### 3.1. Phân hệ `identity-access`

- Khách vãng lai đăng ký tại `/register` tự chọn cố định 1 trong 2 vai trò (`LEARNER` hoặc `EVALUATOR`), tích chọn đồng thuận Nghị định 13/2023/NĐ-CP và được ghi nhận vào bảng `consent_logs`.
- Người đăng ký vai trò `EVALUATOR` sau khi xác thực OTP được vào thẳng `/evaluator/dashboard` ở gói Free để sử dụng ngay mà không bị chặn màn hình chờ.
- Trigger `trg_lock_static_role` chặn tuyệt đối mọi hành vi đổi vai trò sau khi tài khoản đã khởi tạo.

### 3.2. Phân hệ `assessment-engine` (4 Hình thức Thi, Nhóm & Phòng thi Trực tiếp)

- Hỗ trợ biên soạn và làm bài trơn tru cả **4 hình thức**: (1) Câu hỏi trắc nghiệm (`MCQ`), (2) Câu hỏi tình huống (`SCENARIO`), (3) Nhiệm vụ thực hành (`PRACTICAL_TASK`), (4) Sản phẩm và minh chứng số (`DIGITAL_EVIDENCE`).
- Chặn lưu câu hỏi tự luận/thực hành/minh chứng nếu tổng trọng số Rubric khác `100%`.
- Chặn nộp câu hỏi `DIGITAL_EVIDENCE` nếu thiếu tệp/link minh chứng hoặc văn bản giải trình ngắn hơn `30 từ`.
- **Tham gia Nhóm (`/learner/groups`):** Gia nhập thành công qua cả 3 cách: bấm Link `?join=CODE`, nhập mã nhóm hoặc quét QR. Người đánh giá gửi được lời nhận xét định kỳ cho học viên và học viên đọc được ngay trên Dashboard.
- **Phòng thi trực tiếp (`/evaluator/live-room` & `/learner/live-pin`):** Mở được ở cả **Chế độ Mở (`OPEN` — không cần nhóm)** lẫn **Chế độ Theo nhóm (`GROUP_ONLY`)**; thí sinh vào thi được qua Link `?pin=849201`, Mã PIN 6 số hoặc mã QR; tự động lưu nháp mỗi 15 giây lên Redis và cưỡng chế thu bài khi hết giờ.

### 3.3. Phân hệ `ai-gateway` (Đa mô hình, 3 Tầng Huấn luyện & 5 Ứng dụng AI)

- Chuyển đổi linh hoạt giữa các nhà cung cấp AI (`GEMINI`, `OPENAI`, `CLAUDE`) từ trang cấu hình `/admin/ai-gateway` thông qua `AIProviderAdapter`.
- 100% dữ liệu bài làm được khử sạch thông tin định danh cá nhân (PII) trước khi gửi tới AI.
- Hoàn tất **Pipeline 2 lần gọi API** trả về đúng cấu trúc JSON Schema cho cả **5 ứng dụng AI**:
  1. *Hỗ trợ chấm điểm:* Trả về điểm từng tiêu chí Rubric, câu trích dẫn bằng chứng (`evidenceQuote`) và `confidenceScore` (ngưỡng chuẩn `0.85`).
  2. *Phân tích điểm mạnh và điểm yếu:* Bóc tách các kỹ năng đạt tốt ($\ge 80\%$) và các mặt hạn chế.
  3. *Nhận diện khoảng trống năng lực:* Liệt kê chính xác các kỹ năng đạt $< 60\%$ kèm phân tích hệ quả thực tế.
  4. *Tạo phản hồi cá nhân hóa:* Sinh lời khuyên sư phạm cá nhân hóa toàn diện.
  5. *Đề xuất lộ trình phát triển năng lực:* Sắp xếp các học liệu có thật từ CSDL thành 3 chặng học tập ưu tiên.
- Hỗ trợ đánh dấu bài làm đã duyệt làm **Bài mẫu chuẩn (`is_gold_sample = true`)** để đưa vào ngữ cảnh huấn luyện AI tầng 3.

### 3.4. Phân hệ `learning-content` (Chu trình Lộ trình 4 Bước)

- Hiển thị rõ lộ trình 3 chặng tại `/learner/learning-path` từ các học liệu có thật trong `learning_content_items` (tuyệt đối không có khóa học ảo do AI tự bịa).
- Khi người học bấm hoàn thành học liệu lần đầu, hệ thống cộng `+30 điểm (point)` và khi hoàn thành đủ các học liệu của kỹ năng bị hổng thì mở khóa nút **"Đánh giá lại kỹ năng"**.

### 3.5. Phân hệ `credentialing-portfolio` (Chứng chỉ QR & Bảng xếp hạng Top 100+)

- Xuất chứng chỉ PDF Vector (chuẩn PDF/A-1b) lưu đủ 2 mã băm SHA-256 (`data_hash` & `file_hash`). Quét mã QR trên chứng chỉ mở đúng trang độc lập `/verify/[credentialId]` hiển thị trạng thái Hợp lệ (`VALID`) hoặc Đã thu hồi (`REVOKED`).
- Bảng xếp hạng `/learner/leaderboard` hiển thị chính xác **Top 100+ Người học** theo `points` với thời gian tải $< 100\text{ms}$ nhờ bộ đệm Upstash Redis.

### 3.6. Phân hệ `billing-finance` & `admin-governance` (Gói dịch vụ, Khung động & Xuất dữ liệu nghiên cứu)

- Sinh mã VietQR động và xử lý Webhook `HMAC-SHA512` chống trùng lặp (`Idempotent`) để nâng cấp gói dịch vụ (`Learner Pro`, `Evaluator Pro`, `Enterprise`).
- Chủ nền tảng (Admin) cập nhật hoặc thêm phiên bản Khung năng lực số mới tại `/admin/framework-engine` mà không làm ảnh hưởng đến dữ liệu lịch sử.
- Evaluator xuất được bảng điểm nhóm ra `.xlsx`/`.csv`/`.pdf`; Admin xuất được **Bộ dữ liệu Nghiên cứu ẩn danh (`Research Dataset Export`)** ra `CSV / Excel / JSON` phục vụ phân tích trên SPSS, R, Python, Power BI.
