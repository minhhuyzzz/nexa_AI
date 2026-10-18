# ĐẶC TẢ XUẤT DỮ LIỆU NGHIÊN CỨU & BỐ CỤC CHỨNG CHỈ SỐ (DATA EXPORT & CERTIFICATE SPEC)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

Tài liệu này quy định chính xác danh sách các cột dữ liệu khi xuất tệp `.csv` / `.xlsx` (phục vụ Người đánh giá và Chủ nền tảng nghiên cứu khoa học trên SPSS, R, Python, Excel, Power BI) cùng bố cục chuẩn của tệp Chứng chỉ số PDF Vector.

---

## 1. ĐẶC TẢ CẤU TRÚC CỘT CỦA BỘ DỮ LIỆU NGHIÊN CỨU (`RESEARCH DATASET EXPORT` — DÀNH CHO ADMIN)

- **Đường dẫn API:** `GET /api/admin/research-export?format=csv|xlsx|json`
- **Nguyên tắc ẩn danh hóa (NĐ 13/2023):** Tuyệt đối không xuất Họ tên, Email hay Số điện thoại. Mã người học được băm một chiều: `participant_hash = SHA256(learner_id + RESEARCH_EXPORT_SALT).slice(0, 12)`.

### Bảng 26 Biến số Chuẩn hóa trong File CSV / Excel Xuất ra

| STT | Tên cột (Header chuẩn cho SPSS/R/Python) | Kiểu dữ liệu | Mô tả ý nghĩa biến số nghiên cứu |
| :-: | :--- | :---: | :--- |
| **01** | `session_id` | `String (UUID)` | Mã phiên đánh giá duy nhất. |
| **02** | `participant_hash` | `String (12 chars)` | Mã định danh ẩn danh của người tham gia (dùng để ghép cặp dữ liệu dọc Longitudinal Pre/Post). |
| **03** | `specialization_group` | `String` | Nhóm ngành học / Lĩnh vực công tác của người tham gia (biến phân nhóm ANOVA / t-test). |
| **04** | `assessment_mode` | `String` | `'B2C_SELF_PACED'` (Tự đánh giá) hoặc `'EVALUATOR_LED'` (Thi theo nhóm/lớp). |
| **05** | `attempt_phase` | `String` | `'PRE_PATHWAY'` (Thi lần đầu) hoặc `'POST_PATHWAY'` (Thi đánh giá lại sau khi học lộ trình). |
| **06** | `framework_version` | `String` | Phiên bản khung năng lực số áp dụng tại thời điểm đánh giá. |
| **07** | `duration_seconds` | `Integer` | Tổng thời gian làm bài thực tế tính bằng giây. |
| **08** | `score_format_mcq` | `Numeric (0-100)` | Điểm trung bình nhóm **Câu hỏi trắc nghiệm** (`MCQ`). |
| **09** | `score_format_scenario` | `Numeric (0-100)` | Điểm trung bình nhóm **Câu hỏi tình huống** (`SCENARIO`). |
| **10** | `score_format_practical` | `Numeric (0-100)` | Điểm trung bình nhóm **Nhiệm vụ thực hành** (`PRACTICAL_TASK`). |
| **11** | `score_format_evidence` | `Numeric (0-100)` | Điểm trung bình nhóm **Sản phẩm và minh chứng số** (`DIGITAL_EVIDENCE`). |
| **12** | `score_domain_1` | `Numeric (0-100)` | Điểm Miền 1: Thông tin và dữ liệu số. |
| **13** | `score_domain_2` | `Numeric (0-100)` | Điểm Miền 2: Giao tiếp và cộng tác số. |
| **14** | `score_domain_3` | `Numeric (0-100)` | Điểm Miền 3: Sáng tạo nội dung số & AI. |
| **15** | `score_domain_4` | `Numeric (0-100)` | Điểm Miền 4: An toàn và sức khỏe số. |
| **16** | `score_domain_5` | `Numeric (0-100)` | Điểm Miền 5: Giải quyết vấn đề số. |
| **17** | `total_score` | `Numeric (0-100)` | Điểm tổng kết toàn bài đánh giá. |
| **18** | `mastery_level` | `Categorical` | Bậc năng lực đạt được (`BELOW_FOUNDATION`, `FOUNDATION`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`). |
| **19** | `ai_provider_used` | `String` | Mô hình AI đã chấm (`GEMINI`, `OPENAI`, `CLAUDE`). |
| **20** | `ai_avg_confidence` | `Numeric (0.00-1.00)` | Chỉ số độ tin cậy trung bình của AI trên các câu thực hành/minh chứng. |
| **21** | `human_score_delta` | `Numeric` | Độ lệch giữa điểm chuyên gia chốt và điểm AI gợi ý (`final_score - ai_suggested_score`) để kiểm định độ chính xác của AI. |
| **22** | `skill_gaps_count` | `Integer` | Số lượng kỹ năng thành phần bị dưới ngưỡng 60 điểm. |
| **23** | `pathway_items_assigned` | `Integer` | Tổng số học liệu được AI đề xuất trong lộ trình phát triển. |
| **24** | `pathway_items_completed` | `Integer` | Số học liệu người học đã hoàn thành thực tế. |
| **25** | `points_total` | `Integer` | Tổng điểm tích lũy (point) của người học tại thời điểm xuất. |
| **26** | `submitted_at_iso` | `ISO Timestamp` | Thời điểm hoàn thành bài đánh giá. |

---

## 2. ĐẶC TẢ BẢNG ĐIỂM XUẤT EXCEL / CSV DÀNH CHO NGƯỜI ĐÁNH GIÁ (`EVALUATOR GROUP EXPORT`)

- **Đường dẫn API:** `GET /api/analytics/groups/[groupId]/export?format=xlsx|csv`
- **Các cột hiển thị rõ cho giảng viên / đơn vị quản lý lớp:**
  1. `STT`
  2. `Họ và tên học viên` (`full_name`)
  3. `Email` (`email`)
  4. `Tên bài đánh giá` (`assessment_title`)
  5. `Thời gian nộp bài` (`submitted_at`)
  6. `Thời lượng làm bài (Phút)`
  7. `Điểm Trắc nghiệm` | `Điểm Tình huống` | `Điểm Thực hành` | `Điểm Sản phẩm Minh chứng`
  8. `Điểm Miền 1` | `Điểm Miền 2` | `Điểm Miền 3` | `Điểm Miền 4` | `Điểm Miền 5`
  9. `Tổng điểm (Thang 100)` (`total_score`)
  10. `Bậc năng lực đạt được` (`mastery_level`)
  11. `Kỹ năng cần bồi dưỡng (< 60 điểm)`
  12. `Nhận xét của AI` & `Nhận xét của Người đánh giá`
  13. `Mã Chứng chỉ (Nếu có)` (`credential_id`)

---

## 3. ĐẶC TẢ BỐ CỤC PHÔI CHỨNG CHỈ SỐ PDF VECTOR (KHỔ A4 NGANG — LANDSCAPE)

Tệp chứng chỉ xuất ra từ `certificate-pdf.service.ts` tuân thủ phong cách **Trang trọng - Học thuật - Tối giản** trên khổ giấy A4 ngang (`297mm × 210mm`), nền trắng ngà tinh khiết `#FFFFFF`, viền khung mảnh kép màu xanh than `#0F172A`:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │  NEXA PLATFORM                                     MÃ CHỨNG NHẬN: NEXA-2026-8F92A  │ │
│ │  HỆ THỐNG ĐÁNH GIÁ & CHỨNG NHẬN NĂNG LỰC SỐ        NGÀY CẤP: 14/10/2026            │ │
│ │                                                                                    │ │
│ │                        CHỨNG NHẬN NĂNG LỰC SỐ                                      │ │
│ │                   (DIGITAL COMPETENCY CERTIFICATE)                                 │ │
│ │                                                                                    │ │
│ │                           Trân trọng chứng nhận                                    │ │
│ │                              TRẦN MINH HUY                                         │ │
│ │                                                                                    │ │
│ │         Đã hoàn thành đạt chuẩn bài đánh giá năng lực số đa phương thức:           │ │
│ │        "ĐÁNH GIÁ TOÀN DIỆN NĂNG LỰC SỐ THỰC CHIẾN (CHUẨN 4 HÌNH THỨC)"             │ │
│ │                                                                                    │ │
│ │      • Tổng điểm đạt được : 86.5 / 100              • Bậc năng lực : NÂNG CAO      │ │
│ │      • Thông tin & Dữ liệu: 88/100                  • An toàn số   : 85/100        │ │
│ │      • Giao tiếp & Hợp tác: 84/100                  • Giải quyết VĐ: 86/100        │ │
│ │      • Sáng tạo & Ứng dụng AI: 90/100                                              │ │
│ │                                                                                    │ │
│ │  ┌──────────────┐                                    ĐẠI DIỆN HỘI ĐỒNG KHẢO THÍ    │ │
│ │  │  [QR CODE]   │  Quét mã QR để đối soát tính       (Chữ ký số & Dấu xác thực)    │ │
│ │  │  XÁC THỰC    │  toàn vẹn thời gian thực.                                        │ │
│ │  └──────────────┘  SHA-256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
