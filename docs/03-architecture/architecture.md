# KIẾN TRÚC HỆ THỐNG TOÀN DIỆN (SYSTEM ARCHITECTURE SPECIFICATION)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-ARCHITECTURE`
- **Phiên bản:** `v3.2.1` (Kiến trúc 4 Lớp Sạch, Adapter Đa Mô Hình AI, Kích hoạt AI Theo Yêu Cầu On-Demand & Khung Năng Lực Động)
- **Mô hình kiến trúc:** Modular Monolith theo định hướng Feature-Driven Development (FDD) trên Next.js App Router

---

## 1. TỔNG QUAN KIẾN TRÚC 4 LỚP (4-LAYER CLEAN ARCHITECTURE)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LỚP 1: TRÌNH DIỄN & ĐỊNH TUYẾN (Presentation Layer - src/app/)                         │
│ • (public)/ : /, /features, /framework, /pricing, /faq, /contact-us                    │
│ • (auth)/   : /login, /register (Chọn cố định Learner/Evaluator), /reset-password      │
│ • (dashboard)/learner/*, evaluator/*, admin/* (3 Bộ Shell Độc lập - Không có Footer)   │
│ • verify/[credentialId] : Trang Kiosk xác thực QR chứng chỉ độc lập                    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ (Gọi Server Actions / REST API Handlers)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LỚP 2: NGHIỆP VỤ CỐT LÕI (Domain Logic Layer - src/features/ - 7 Modules)              │
│ 1. identity-access        2. assessment-engine       3. ai-gateway (On-Demand AI)      │
│ 4. learning-content       5. credentialing-portfolio 6. billing-finance                │
│ 7. admin-governance (Khung năng lực động, Privacy NĐ 13 & Xuất dữ liệu nghiên cứu)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ (Sử dụng Adapters, Clients & Shared UI)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LỚP 3: HẠ TẦNG KỸ THUẬT & GIAO DIỆN DÙNG CHUNG (Infrastructure - src/lib/, components/)│
│ • src/lib/supabase/ (Auth & DB Client), src/lib/redis/ (Upstash PIN, Auto-save, Rank)  │
│ • src/components/shared/ (sidebar/, topbar/, avatar-menu/, header/, footer/)           │
│ • src/components/charts/ (RadarChart.tsx duy nhất, HeatmapChart.tsx)                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ (Truy vấn bảo mật qua RLS Policies)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LỚP 4: DỮ LIỆU & DỊCH VỤ NGOẠI VI (Data & External Providers Layer)                    │
│ • Supabase PostgreSQL 15+ (30 Bảng vật lý, 100% bật RLS) & Supabase Storage            │
│ • Upstash Redis (Lưu phiên phòng thi Link/PIN/QR, Auto-save 15s, Cache Top 100+ Điểm (point))    │
│ • Multi-Model AI Providers (Google Gemini / OpenAI / Anthropic Claude) & VietQR        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. KIẾN TRÚC CỔNG AI ĐA MÔ HÌNH, ON-DEMAND TRIGGER & HUẤN LUYỆN 3 TẦNG (`ai-gateway`)

Phân hệ `src/features/ai-gateway/` được thiết kế theo mẫu **Strategy & Adapter Pattern**, chỉ thực thi khi người dùng bấm nút yêu cầu (On-Demand):

```text
                    ┌──────────────────────────────────────────────┐
                    │   AIOrchestratorService (On-Demand Trigger)  │
                    │  • Nút 1: gradeSubmissionByRubric()          │
                    │  • Nút 2: analyzeCompetencyAndPathway()      │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │     ContextBuilder & 3-Layer Grounding       │
                    │  1. Khử sạch PII (Họ tên, Email, SĐT)        │
                    │  2. Nạp tiêu chí Khung năng lực động từ DB   │
                    │  3. Nạp Ma trận Rubric 100% + Gold Samples   │
                    └──────────────────────┬───────────────────────┘
                                           │ (Đọc cấu hình active_provider từ DB)
                    ┌──────────────────────┼───────────────────────┐
                    ▼                      ▼                       ▼
     ┌─────────────────────────┐┌─────────────────────┐┌─────────────────────────┐
     │   GeminiModelAdapter    ││ OpenAIModelAdapter  ││   ClaudeModelAdapter    │
     │ (@google/genai SDK)     ││ (openai SDK)        ││ (@anthropic-ai/sdk)     │
     │ • gemini-2.5-flash/pro  ││ • gpt-4o / 4o-mini  ││ • claude-3-5-sonnet     │
     └─────────────────────────┘└─────────────────────┘└─────────────────────────┘
```

1. **Tách biệt hoàn toàn Nộp bài và Gọi AI:**
   - Khi nộp bài (`POST /api/assessments/[id]/submit`), hệ thống chỉ chạy `grading.service.ts` để chấm tức thì các câu `MCQ` và nhánh chọn `SCENARIO` bằng thuật toán máy chủ (`0.01s`).
   - Khi Learner hoặc Evaluator chủ động bấm nút kích hoạt AI trên giao diện, `AIOrchestratorService` mới kiểm tra lượt Credit và gọi tới Adapter đang kích hoạt.
2. **Chuyển đổi mô hình nóng (Hot-swappable Provider):** Khi Chủ nền tảng (Admin) đổi mô hình AI trên màn hình `/admin/ai-gateway`, bảng `ai_configurations` cập nhật `active_provider` và `model_name`.
3. **Cơ chế Huấn luyện 3 Tầng (3-Layer Calibration):**
   - **Tầng 1 (Khung năng lực động):** Lấy mô tả kỹ năng và chỉ báo hành vi từ bảng `competencies` hiện hành đưa vào System Prompt.
   - **Tầng 2 (Rubric 100%):** Khóa chặt thang điểm từng tiêu chí và bắt buộc trích dẫn bằng chứng (`evidenceQuote`).
   - **Tầng 3 (Bài mẫu chuẩn - Few-shot Gold Samples):** Truy vấn tối đa 3 bài làm đã được chuyên gia chấm duyệt và gắn cờ `is_gold_sample = true` của câu hỏi đó để đưa vào Prompt làm chuẩn đối sánh.

---

## 3. KIẾN TRÚC PHÒNG THI TRỰC TIẾP (MỞ / THEO NHÓM) & BẢNG XẾP HẠNG TRÊN REDIS

Hệ thống sử dụng **Upstash Redis** để xử lý 3 tác vụ thời gian thực có tần suất đọc/ghi cao:

1. **Quản lý Phòng thi Trực tiếp (`live:room:{pin_code}` — TTL 2 giờ):**
   - Lưu thông tin phòng thi: `assessment_id`, `evaluator_id`, `access_mode` (`OPEN` — không cần nhóm hoặc `GROUP_ONLY` — bắt buộc thuộc nhóm), trạng thái (`WAITING`, `IN_PROGRESS`, `CLOSED`) và mốc giờ máy chủ `started_at`.
   - Hỗ trợ người học tham gia tức thì qua cả 3 cách: bấm Link `?pin=849201`, quét QR hoặc nhập PIN.
2. **Bộ đệm Tự động lưu nháp 15 giây (`exam:draft:{session_id}` — TTL 3 giờ):**
   - Lưu trạng thái trả lời 4 hình thức câu hỏi của thí sinh mỗi 15 giây. Khi thí sinh bấm Nộp bài (hoặc hết giờ), dữ liệu được đồng bộ một lần xuống bảng `session_answers` của PostgreSQL.
3. **Bộ đệm Bảng xếp hạng Top 100+ (`leaderboard:global` & `leaderboard:group:{group_id}` — TTL 5 phút):**
   - Lưu danh sách 100+ người học có `points` cao nhất, giúp trang `/learner/leaderboard` phản hồi trong dưới `10ms`.
