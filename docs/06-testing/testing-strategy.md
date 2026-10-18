# CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN (AUTOMATED TESTING STRATEGY)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-TESTING-STRATEGY`
- **Phiên bản:** `v3.2.0`
- **Công cụ kiểm thử:** **Vitest** (Unit & Integration Tests) + **Playwright** (End-to-End Tests)
- **Mục tiêu độ bao phủ (Code Coverage):** $\ge 85\%$ đối với toàn bộ các Domain Services trong `src/features/*/services/`.

---

## 1. KIM TỰ THÁP KIỂM THỬ NEXA (TESTING PYRAMID)

```text
                    /\
                   /  \         15% E2E Tests (Playwright)
                  / E2E\        • Luồng B2C tự đánh giá, Phòng thi Link/PIN/QR,
                 /------\         Chấm bài Split-view & Xuất dữ liệu nghiên cứu.
                /        \
               / TÍCH HỢP \     35% Integration Tests (Vitest + Mock Supabase/Redis)
              / (API & RLS)\    • Kiểm thử Route Handlers, RLS Policies, Khóa cứng Role,
             /--------------\     Nhận xét nhóm & Webhook VietQR Idempotent.
            /                \
           /  KIỂM THỬ ĐƠN VỊ \ 50% Unit Tests (Vitest)
          /    (Unit Tests)    \• Công thức tính điểm 4 hình thức, Tổng Rubric = 100%,
         /----------------------\ Quy đổi 4 bậc năng lực, Cộng điểm (point) & Khử PII.
```

---

## 2. CHIẾN LƯỢC KIỂM THỬ ĐƠN VỊ (UNIT TESTING — VITEST)

Tập trung kiểm thử chặt chẽ các hàm tính toán nghiệp vụ thuần túy:

1. **Kiểm thử Động cơ Tính điểm 4 Hình thức (`grading.service.test.ts`):**
   - Kiểm tra chấm tự động câu hỏi `MCQ` (1 lựa chọn, nhiều lựa chọn, ghép nối) và nhánh chọn `SCENARIO`.
   - Kiểm tra công thức kết hợp điểm câu hỏi khách quan với điểm Rubric của `PRACTICAL_TASK` và `DIGITAL_EVIDENCE` ra điểm kỹ năng thành phần và điểm miền năng lực (`BR-RUBRIC-02`).
   - Kiểm tra hàm quy đổi điểm số (`0–100`) sang 4 bậc thành thạo (`FOUNDATION`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`).
2. **Kiểm thử Ràng buộc Ma trận Rubric & Giải trình Minh chứng (`rubric.schema.test.ts`):**
   - Đảm bảo Zod Schema chặn mọi câu hỏi có tổng trọng số Rubric $\neq 100\%$.
   - Đảm bảo câu trả lời `DIGITAL_EVIDENCE` bị từ chối nếu thiếu tệp/link minh chứng hoặc văn bản giải trình ngắn hơn 30 từ (`BR-EXAM-04`).
3. **Kiểm thử Bộ lọc Khử định danh PII & Điểm tích lũy (point) (`privacy-and-points.test.ts`):**
   - Kiểm tra hàm `sanitizeSubmissionForAI()` xóa sạch email/SĐT trước khi gửi tới Adapter AI.
   - Kiểm tra hàm cộng điểm (point) chỉ cộng `+30 điểm (point)` cho lần hoàn thành học liệu đầu tiên (`BR-RANK-01`).

---

## 3. CHIẾN LƯỢC GIẢ LẬP ĐA MÔ HÌNH AI (MOCKING MULTI-MODEL AI ADAPTER)

Trong quá trình chạy kiểm thử tự động CI/CD, hệ thống không gọi trực tiếp API thật của Google Gemini, OpenAI hay Claude để tránh phát sinh chi phí Token và độ trễ mạng:

- Sử dụng `MockAIProviderAdapter` cài đặt sẵn giao diện `IAIProviderAdapter`.
- Giả lập cả 3 kịch bản phản hồi của `AI Call #1`:
  1. Kịch bản Cờ Xanh (`confidenceScore = 0.92 >= 0.85`).
  2. Kịch bản Cờ Cam/Đỏ (`confidenceScore = 0.65 < 0.85` $\rightarrow$ bật `needsManualReview = true`).
  3. Kịch bản lỗi mạng `HTTP 429` để kiểm tra cơ chế thử lại (Retry) và chuyển đổi dự phòng (Fallback).
