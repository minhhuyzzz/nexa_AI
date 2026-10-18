# QUY TRÌNH ĐIỀU PHỐI TRÍ TUỆ NHÂN TẠO THEO YÊU CẦU & LỘ TRÌNH 4 BƯỚC (ON-DEMAND AI WORKFLOW)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-AI-AGENT-WORKFLOW`
- **Phiên bản:** `v3.2.1` (Chuyển sang Cơ chế Kích hoạt AI Theo Yêu Cầu - On-Demand Trigger, Tiết kiệm tối đa Token & Chống nghẽn khi nộp bài)
- **Nguyên tắc cốt lõi:** **Nộp bài = Chấm câu hỏi khách quan tức thì (`0.01s`, tốn `0 Token`)**. Người dùng (Learner hoặc Evaluator) cần tính năng AI nào thì bấm nút kích hoạt tính năng đó.

---

## 1. TỔNG QUAN LUỒNG TÁCH BIỆT: NỘP BÀI TỨC THÌ & 2 NÚT KÍCH HOẠT AI CHỦ ĐỘNG

Thay vì tự động gọi AI ngầm cho mọi bài nộp gây lãng phí tài nguyên đối với các bài nộp nháp hoặc bài chỉ cần chấm trắc nghiệm, hệ thống tách thành **1 bước nộp bài tức thì** và **2 tác vụ AI kích hoạt theo nút bấm (On-Demand)**:

```text
[1. NGƯỜI HỌC BẤM "NỘP BÀI ĐÁNH GIÁ" (POST /api/assessments/[id]/submit)]
       │
       ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BƯỚC NỘP BÀI TỨC THÌ (0.01 giây - Thuật toán Máy chủ - Tốn 0 Token AI)                 │
│ • Chấm ngay toàn bộ câu hỏi Trắc nghiệm (`MCQ`) và nhánh chọn quyết định (`SCENARIO`). │
│ • Lưu nội dung Thực hành (`PRACTICAL_TASK`) & Minh chứng (`DIGITAL_EVIDENCE`) vào DB.  │
│ • Tính điểm sơ bộ các kỹ năng khách quan & chuyển ngay tới trang Kết quả (hoặc chờ chấm)│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
         ┌──────────────────────────────────┴──────────────────────────────────┐
         │ (Khi người dùng cần AI hỗ trợ thì chủ động bấm nút trên giao diện)  │
         ▼                                                                     ▼
┌─────────────────────────────────────────────┐       ┌─────────────────────────────────────────────┐
│ TÁC VỤ AI #1 (ON-DEMAND BUTTON 1)           │       │ TÁC VỤ AI #2 (ON-DEMAND BUTTON 2)           │
│ [Bấm: "Chấm bài thực hành bằng AI"]         │       │ [Bấm: "Phân tích sâu & Tạo lộ trình bằng AI"]│
│ Endpoint: POST /api/ai/grade-submission     │       │ Endpoint: POST /api/ai/analyze-competency   │
├─────────────────────────────────────────────┤       ├─────────────────────────────────────────────┤
│ • Đáp ứng: [ỨNG DỤNG AI SỐ 1]               │       │ • Đáp ứng đồng thời 4 ứng dụng:             │
│   Hỗ trợ chấm điểm theo Rubric 100%.        │       │   - [ỨNG DỤNG AI 2]: Điểm mạnh & Điểm yếu.  │
│ • Ai được bấm kích hoạt?                    │       │   - [ỨNG DỤNG AI 3]: Khoảng trống (< 60%).  │
│   - Người học (với đề tự đánh giá B2C).     │       │   - [ỨNG DỤNG AI 4]: Phản hồi cá nhân hóa.  │
│   - Người đánh giá (bấm chấm gợi ý 1 bài    │       │   - [ỨNG DỤNG AI 5]: Lộ trình học 4 bước    │
│     hoặc các bài đã chọn trên bàn chấm).    │       │     (ghép từ Kho học liệu chuẩn trong DB).  │
│ • Đầu ra: Điểm từng tiêu chí, trích dẫn     │       │ • Ai được bấm kích hoạt?                    │
│   bằng chứng (`evidenceQuote`) & Cờ tin cậy.│       │   - Người học hoặc Người đánh giá.          │
└─────────────────────────────────────────────┘       └─────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT QUY TRÌNH XỬ LÝ CỦA 2 TÁC VỤ AI KHI NGƯỜI DÙNG BẤM NÚT

### 2.1. Tác vụ AI #1 (`POST /api/ai/grade-submission`) — Ứng dụng AI số 1: Hỗ trợ chấm điểm

1. **Kiểm tra điều kiện & Hạn mức:**
   - Kiểm tra phiên thi có câu hỏi tự luận tình huống, nhiệm vụ thực hành hoặc sản phẩm minh chứng chưa được AI chấm hay không.
   - Nếu đã có kết quả AI chấm từ trước cho phiên bản bài nộp này $\rightarrow$ Trả về ngay kết quả trong DB (không gọi lại API gây tốn tiền).
   - Kiểm tra và trừ `1 lượt AI` trong hạn mức của người bấm kích hoạt.
2. **Chuẩn bị dữ liệu 3 tầng & Khử PII:**
   - Chạy `sanitizeSubmissionForAI()` xóa sạch họ tên, email, SĐT.
   - Đính kèm 3 tầng dữ liệu: (1) Chỉ báo hành vi của kỹ năng từ Khung năng lực động, (2) Ma trận Rubric 100%, (3) Tối đa 3 Bài mẫu chuẩn (`is_gold_sample = true`) của câu hỏi đó.
3. **Gọi `AIProviderAdapter` & Lưu kết quả:**
   - Lưu JSON trả về vào bảng `ai_evaluation_logs` (gồm điểm từng tiêu chí, `evidenceQuote`, `pedagogicalNote` và `confidenceScore`).
   - Nếu là bài tự đánh giá B2C và `confidenceScore >= 0.85`: Tự động cộng điểm thực hành vào `total_score` và cập nhật biểu đồ `RadarChart`.

### 2.2. Tác vụ AI #2 (`POST /api/ai/analyze-competency`) — Ứng dụng AI số 2, 3, 4, 5

1. **Kiểm tra điều kiện:**
   - Đảm bảo toàn bộ câu hỏi trong bài thi đã có điểm (hoặc người học muốn phân tích ngay trên bảng điểm hiện tại).
   - Nếu cột `assessment_sessions.ai_analysis` đã có dữ liệu và điểm số không thay đổi $\rightarrow$ Trả về ngay dữ liệu đã lưu.
2. **Truy vấn Kho học liệu thật từ CSDL:**
   - Xác định các kỹ năng có điểm $< 60.0$ (Khoảng trống năng lực).
   - Truy vấn bảng `learning_content_items` lấy danh sách các bài học/video/bài tập có thật ứng với các kỹ năng $< 60.0$ đó.
3. **Gọi `AIProviderAdapter` & Lưu kết quả:**
   - Sinh đồng thời: Điểm mạnh & Điểm yếu (Ứng dụng 2), Khoảng trống năng lực (Ứng dụng 3), Phản hồi cá nhân hóa (Ứng dụng 4) lưu vào `assessment_sessions.ai_analysis`.
   - Sinh Lộ trình phát triển 3 chặng (Ứng dụng 5) lưu vào bảng `learning_pathways`.

---

## 3. CHU TRÌNH 4 BƯỚC CỦA LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC (SAU KHI KÍCH HOẠT AI #2)

1. **Bước 1 (Kho học liệu chuẩn do Admin quản lý):** Các bài đọc, video, bài tập được gắn nhãn kỹ năng sẵn trong bảng `learning_content_items`.
2. **Bước 2 (Phát hiện kỹ năng yếu $< 60$ điểm):** Hệ thống lọc chính xác các kỹ năng người học chưa đạt chuẩn.
3. **Bước 3 (AI lắp ráp thành 3 Chặng học tập):** Khi người học bấm nút *"Phân tích năng lực & Đề xuất lộ trình bằng AI"*, AI sắp xếp các học liệu có sẵn theo thứ tự Chặng 1 (Cấp bách) $\rightarrow$ Chặng 2 (Thực hành) $\rightarrow$ Chặng 3 (Nâng cao) kèm lý do cần học.
4. **Bước 4 (Học tập, Nhận `+30 điểm (point)` & Đánh giá lại):** Người học hoàn thành từng bài tại `/learner/learning-path`, tích lũy điểm (point) lên Bảng xếp hạng Top 100+ và mở khóa bài đánh giá lại để nâng điểm Radar.
