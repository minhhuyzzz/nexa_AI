# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-API`
- **Phiên bản:** `v3.2.1` (Chuẩn hóa Tách biệt API Nộp Bài Tức Thì & 2 API Bấm Nút Kích Hoạt AI On-Demand)
- **Kiến trúc thiết kế:** Resource-Oriented RESTful API (Next.js App Router Route Handlers)
- **Định dạng phản hồi lỗi:** Chuẩn quốc tế RFC 7807 (`Problem Details for HTTP APIs`)

---

## 1. CẤU TRÚC ĐÓNG GÓI DỮ LIỆU CHUẨN (STANDARD ENVELOPES)

### 1.1. Phản hồi Thành công (`200 OK` / `201 Created`)

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 1.2. Phản hồi Lỗi chuẩn RFC 7807 (`400`, `401`, `403`, `404`, `422`, `429`)

```json
{
  "success": false,
  "error": {
    "type": "[https://nexa.vn/errors/insufficient-ai-credits](https://nexa.vn/errors/insufficient-ai-credits)",
    "title": "Hết lượt kích hoạt AI",
    "status": 422,
    "detail": "Bạn cần ít nhất 1 lượt AI Credit để kích hoạt chấm điểm và phân tích chuyên sâu.",
    "instance": "/api/ai/grade-submission"
  }
}
```

---

## 2. DANH MỤC API ENDPOINTS TOÀN HỆ THỐNG

### 2.1. Phân hệ Xác thực & Vai trò Cố định (`/api/auth`)

| Phương thức & Endpoint | Quyền truy cập | Mô tả chức năng & Payload chính |
| :--- | :---: | :--- |
| `POST /api/auth/register` | Public | Đăng ký tài khoản mới, chọn cố định `role` (`'LEARNER'` hoặc `'EVALUATOR'`), ghi `consent_logs` theo NĐ 13 và gửi OTP 6 số. |
| `POST /api/auth/login` | Public | Đăng nhập qua Supabase Auth, trả về hồ sơ và đường dẫn điều hướng theo vai trò tĩnh. |
| `POST /api/auth/consent` | Authenticated | Cập nhật trạng thái đồng thuận xử lý dữ liệu cá nhân. |

---

### 2.2. Phân hệ Nhóm học tập, Nhận xét Nhóm & Phòng thi Trực tiếp (`/api/groups`, `/api/live-sessions`)

| Phương thức & Endpoint | Quyền truy cập | Mô tả chức năng & Payload chính |
| :--- | :---: | :--- |
| `GET, POST /api/groups` | `LEARNER`, `EVALUATOR` | Lấy danh sách nhóm hoặc tạo nhóm mới (tự động sinh `inviteCode`, Link `?join=CODE` và dữ liệu QR). |
| `POST /api/groups/join` | `LEARNER` | Tham gia nhóm qua Link tự động, Mã nhóm hoặc quét QR (`{ "inviteCode": "K24DIG", "via": "LINK" }`). |
| `GET, POST /api/groups/[id]/feedbacks` | `EVALUATOR` (POST), `LEARNER` (GET) | **Người đánh giá gửi lời nhận xét chuyên môn / đánh giá định kỳ** cho người học trong nhóm; Người học đọc danh sách nhận xét. |
| `POST /api/live-sessions/open` | `EVALUATOR` | Mở phòng thi trực tiếp ở chế độ **Mở (`accessMode: 'OPEN'`)** hoặc **Theo nhóm (`accessMode: 'GROUP_ONLY'`)**; trả về `pinCode` 6 số, `joinUrl` và `qrPayload`. |
| `POST /api/live-sessions/join` | `LEARNER` | Thí sinh vào phòng thi trực tiếp qua Link `?pin=849201`, nhập PIN hoặc quét QR. |
| `GET /api/live-sessions/[pin]/monitor` | `EVALUATOR` | Giám sát thời gian thực tiến độ làm bài và cảnh báo chuyển tab của thí sinh trong phòng thi. |

---

### 2.3. Phân hệ Câu hỏi 4 Hình thức, Đề thi & Nộp bài Tức thì (`/api/questions`, `/api/assessments`)

| Phương thức & Endpoint | Quyền truy cập | Mô tả chức năng & Payload chính |
| :--- | :---: | :--- |
| `GET, POST /api/questions` | `EVALUATOR`, `ADMIN` | Tạo và lọc câu hỏi theo 4 hình thức (`MCQ`, `SCENARIO`, `PRACTICAL_TASK`, `DIGITAL_EVIDENCE`); kiểm tra Zod đảm bảo tổng Rubric = 100%. |
| `GET /api/assessments/public-library` | `LEARNER` | Lấy danh sách các bộ đề đánh giá chuẩn của NEXA phục vụ người học tự đánh giá (B2C). |
| `GET, POST /api/assessments` | `EVALUATOR`, `ADMIN` | Tạo bộ đề đánh giá mới, cấu hình thời gian, điểm đạt và giao cho nhóm. |
| `POST /api/assessments/[id]/save-draft` | `LEARNER` | Tự động lưu nháp câu trả lời 4 hình thức lên Upstash Redis mỗi 15 giây (`204 No Content`). |
| `POST /api/assessments/[id]/submit` | `LEARNER` | **Nộp bài tức thì (`0.01s`, KHÔNG gọi AI):** Chấm ngay các câu `MCQ` và nhánh chọn `SCENARIO` bằng code thuần, lưu câu trả lời thực hành/minh chứng vào CSDL, cộng điểm (point) hoàn thành bài thi và trả kết quả ngay lập tức. |
| `GET /api/assessments/[id]/results` | `LEARNER`, `EVALUATOR` | Trả về báo cáo kết quả hiện tại: Điểm phần khách quan, dữ liệu `RadarChart`, trạng thái các câu thực hành và kết quả AI (nếu đã bấm kích hoạt). |

---

### 2.4. Phân hệ Kích hoạt AI Theo Yêu cầu (On-Demand AI), Lộ trình & Bảng xếp hạng (`/api/ai`, `/api/learning`, `/api/leaderboard`)

| Phương thức & Endpoint | Quyền truy cập | Mô tả chức năng & Payload chính |
| :--- | :---: | :--- |
| `POST /api/ai/grade-submission` | `LEARNER`, `EVALUATOR` | **[Bấm nút Kích hoạt AI #1 — Hỗ trợ chấm điểm]:** Chỉ chạy khi người học (chế độ B2C) hoặc Người đánh giá (trên bàn chấm) bấm nút. Gọi `AIProviderAdapter` chấm các câu Tình huống tự luận, Thực hành, Sản phẩm minh chứng theo Rubric 100%, trả về điểm từng tiêu chí, `evidenceQuote` và `confidenceScore`. |
| `POST /api/ai/analyze-competency` | `LEARNER`, `EVALUATOR` | **[Bấm nút Kích hoạt AI #2 — Phân tích & Lộ trình]:** Chỉ chạy khi người dùng bấm nút yêu cầu phân tích sâu. Sinh đồng thời: (2) Điểm mạnh & Điểm yếu, (3) Khoảng trống năng lực (`< 60%`), (4) Phản hồi cá nhân hóa, và (5) Lộ trình phát triển 4 bước từ Kho học liệu chuẩn. |
| `POST /api/grading/manual-review` | `EVALUATOR`, `ADMIN` | Người đánh giá tự chấm điểm thủ công (tốn 0 lượt AI) hoặc duyệt/ghi đè điểm gợi ý của AI, gửi lời nhận xét cho học viên và tùy chọn đánh dấu làm Bài mẫu chuẩn (`isGoldSample`). |
| `GET /api/learning/pathways` | `LEARNER` | Lấy lộ trình phát triển năng lực 4 bước của người học. |
| `POST /api/learning/pathways/[id]/complete` | `LEARNER` | Đánh dấu hoàn thành học liệu, cộng `+30 điểm (point)` (lần đầu) và kiểm tra mở khóa bài đánh giá lại kỹ năng. |
| `GET /api/leaderboard` | `LEARNER` | **Lấy Bảng xếp hạng Top 100+ Người học** (lọc theo `scope=GLOBAL` hoặc `scope=GROUP`, chu kỳ `WEEKLY` / `MONTHLY` / `ALL_TIME`). |

---

### 2.5. Phân hệ Xuất Dữ liệu Phân tích & Nghiên cứu Khoa học (`/api/analytics`, `/api/admin`)

| Phương thức & Endpoint | Quyền truy cập | Mô tả chức năng & Payload chính |
| :--- | :---: | :--- |
| `GET /api/analytics/groups/[groupId]/export` | `EVALUATOR` | **Xuất dữ liệu khảo thí của nhóm/lớp** ra tệp `.xlsx`, `.csv` hoặc `.pdf`. |
| `GET /api/admin/research-export` | `ADMIN` (Chủ nền tảng) | **Xuất Bộ dữ liệu Nghiên cứu ẩn danh (`CSV / Excel / JSON`)** phục vụ phân tích thống kê trên SPSS, R, Python, Power BI. |
| `GET, PUT /api/admin/frameworks` | `ADMIN` | Quản trị Khung năng lực số động đa phiên bản. |
| `GET, PUT /api/admin/ai-configurations` | `ADMIN` | Chuyển đổi nhà cung cấp AI (`GEMINI` / `OPENAI` / `CLAUDE`), cập nhật System Prompts và quản lý kho Bài mẫu chuẩn. |
