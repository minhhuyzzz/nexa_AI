# NGUYÊN TẮC VẬN HÀNH, ĐA MÔ HÌNH & HUẤN LUYỆN TRÍ TUỆ NHÂN TẠO (AI RULES & GOVERNANCE)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-AI-RULES`
- **Phiên bản:** `v3.2.0` (Chuẩn hóa Kiến trúc Đa Mô Hình Linh Hoạt, Cơ chế Huấn luyện 3 Tầng, Kiểm soát Ảo giác & Bảo mật PII)
- **Tiêu chuẩn tham chiếu:** Chuẩn Khảo thí Quốc tế (ITC Guidelines on AI in Assessment) & Nghị định 13/2023/NĐ-CP

---

## 1. KIẾN TRÚC ĐA MÔ HÌNH LINH HOẠT (MODEL-AGNOSTIC ADAPTER)

Hệ thống NEXA **không phụ thuộc cố định vào một nhà cung cấp AI duy nhất**. Toàn bộ giao tiếp giữa lõi nghiệp vụ và mô hình ngôn ngữ lớn được thực hiện qua giao diện chuẩn `IAIProviderAdapter` tại `src/features/ai-gateway/adapters/`:

| Nhà cung cấp (`provider`) | Adapter thực thi | Mô hình khuyên dùng | Thế mạnh trong khảo thí năng lực số |
| :--- | :--- | :--- | :--- |
| **`GEMINI`** *(Mặc định)* | `gemini.adapter.ts` | `gemini-2.5-flash` / `gemini-2.5-pro` | Hỗ trợ đọc trực tiếp tệp PDF/Ảnh minh chứng (Multimodal), ép kiểu JSON Schema gốc, tốc độ nhanh và chi phí tối ưu. |
| **`OPENAI`** *(Tùy chọn)* | `openai.adapter.ts` | `gpt-4o` / `gpt-4o-mini` | Khả năng phân tích lập luận tình huống sắc bén, hỗ trợ `Structured Outputs` chuẩn xác 100%. |
| **`CLAUDE`** *(Tùy chọn)* | `claude.adapter.ts` | `claude-3-5-sonnet` | Văn phong nhận xét sư phạm tự nhiên, sâu sắc, đánh giá tốt các bài giải trình dài. |

> **Quyền điều khiển của Chủ nền tảng (Admin):** Tại màn hình `/admin/ai-gateway`, Admin có thể chuyển đổi nhà cung cấp AI đang hoạt động (`active_provider`), thay đổi tên mô hình (`model_name`) hoặc cập nhật khóa API mà không cần sửa đổi mã nguồn hay khởi động lại hệ thống.

---

## 2. CƠ CHẾ "HUẤN LUYỆN" & CHUẨN HÓA AI KHẢO THÍ QUA 3 TẦNG (3-LAYER AI CALIBRATION)

Thay vì để mô hình AI chấm điểm tự do theo tri thức đại trà dễ dẫn đến cảm tính, NEXA "huấn luyện" và đóng khung hành vi chấm điểm của AI qua **3 tầng dữ liệu chuẩn hóa** trong mỗi lần gọi:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│              CƠ CHẾ HUẤN LUYỆN & KIỂM SOÁT CHẤT LƯỢNG AI 3 TẦNG (NEXA)                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TẦNG 1: TRI THỨC KHUNG NĂNG LỰC SỐ ĐỘNG (Dynamic Framework Grounding)                  │
│ • Truy vấn từ bảng `competencies`: Tên kỹ năng, mô tả chuẩn đầu ra và danh sách các    │
│   chỉ báo hành vi (`behavioral_indicators`) của phiên bản khung năng lực đang bật.     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TẦNG 2: MA TRẬN TIÊU CHÍ RUBRIC 100% (Strict Rubric Matrix Lock)                       │
│ • Truy vấn từ bảng `questions.rubric_matrix`: Các tiêu chí chấm điểm có tổng trọng số  │
│   đúng bằng 100%, kèm mô tả rõ mức Chưa đạt / Đạt / Xuất sắc.                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TẦNG 3: HỌC TỪ BÀI CHẤM MẪU CỦA CHUYÊN GIA (Few-Shot Gold Standard Samples)            │
│ • Truy vấn từ bảng `manual_reviews WHERE is_gold_sample = TRUE`: Đính kèm 2-3 bài làm  │
│   thực tế đã được Admin hoặc Người đánh giá chấm chuẩn cho câu hỏi đó để AI đối sánh.  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. KIỂM SOÁT ẢO GIÁC & BẮT BUỘC TRÍCH DẪN BẰNG CHỨNG (ZERO HALLUCINATION)

1. **Ép buộc Cấu trúc Đầu ra JSON (Strict JSON Schema Enforcement):**
   - Tuyệt đối không cho phép AI trả về văn bản tự do. Mọi phản hồi từ Gemini, OpenAI hay Claude đều phải tuân thủ nghiêm ngặt `responseSchema` đã định nghĩa.
2. **Quy tắc "Không bằng chứng = Không điểm" (Evidence-Based Scoring):**
   - Với mỗi tiêu chí trong bảng Rubric, AI bắt buộc phải trích xuất nguyên văn câu chữ hoặc mô tả chi tiết thực tế từ tệp sản phẩm của người học vào trường `evidenceQuote`.
   - Nếu người học không đề cập đến nội dung của tiêu chí đó, trường `awardedScore` bắt buộc bằng `0` và `evidenceQuote` ghi rõ: *"Không tìm thấy dẫn chứng trong bài làm"*.
3. **Quy tắc Không tự bịa Khóa học trong Lộ trình phát triển:**
   - Khi thực hiện ứng dụng AI số 5 (*Đề xuất lộ trình phát triển năng lực*), hệ thống chỉ truyền vào danh sách các học liệu có thật truy vấn từ bảng `learning_content_items`. AI chỉ được phép chọn và sắp xếp thứ tự từ danh sách ID có sẵn này.

---

## 4. HỆ THỐNG 3 CỜ ĐỘ TIN CẬY (`CONFIDENCE FLAGS`) & PHÂN LUỒNG B2C / B2B

Mỗi lượt AI chấm điểm thực hành/minh chứng đều trả về chỉ số `confidenceScore` (từ `0.00` đến `1.00`):

| Mức Cờ | Ngưỡng `confidenceScore` | Ý nghĩa khảo thí | Xử lý ở Chế độ Tự đánh giá (B2C) | Xử lý ở Chế độ Nhóm/Lớp (B2B) |
| :--- | :---: | :--- | :--- | :--- |
| **Cờ Xanh (Cao)** | `>= 0.85` | Lập luận rõ ràng, dẫn chứng khớp hoàn toàn với Rubric. | Tự động chốt điểm (`GRADED`) và cấp chứng chỉ ngay nếu đạt điểm sàn. | Hiển thị chấm tròn Xanh trên bàn chấm để Evaluator bấm **"Duyệt nhanh"**. |
| **Cờ Cam (Trung bình)** | `0.70 - 0.84` | Có ý đúng nhưng diễn đạt ngắn gọn hoặc minh chứng cần xem thêm. | Công bố điểm tạm thời; nếu là bài thi lấy chứng chỉ thì chuyển Admin hậu kiểm. | Hiển thị chấm tròn Cam nhắc Evaluator rà soát trước khi duyệt. |
| **Cờ Đỏ (Thấp)** | `< 0.70` | Bài làm mơ hồ, lạc đề, nghi vấn sao chép hoặc tệp đính kèm không rõ. | Bật cờ `needs_manual_review = true`, đẩy về hàng đợi của Admin. | Bật cờ Đỏ bắt buộc Evaluator đọc chi tiết và tự quyết định điểm số. |

---

## 5. BẢO VỆ DỮ LIỆU CÁ NHÂN TRƯỚC KHI GỬI SANG AI (PII STRIPPING — NĐ 13/2023)

Trước khi bất kỳ dữ liệu bài làm nào được gửi ra ngoài qua `IAIProviderAdapter`, bộ lọc `sanitizeSubmissionForAI()` bắt buộc thực thi:

1. Không bao giờ gửi `full_name`, `email`, `phone_number` của người học trong payload.
2. Dùng biểu thức chính quy (Regex) quét và thay thế mọi chuỗi email, số điện thoại hoặc số CCCD vô tình xuất hiện trong văn bản giải trình của người học thành nhãn `[REDACTED_PII]`.
