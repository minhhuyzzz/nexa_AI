# LỘ TRÌNH PHÁT TRIỂN & TRIỂN KHAI SẢN PHẨM (PRODUCT ROADMAP)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-ROADMAP`
- **Phiên bản:** `v3.2.0`
- **Phương pháp triển khai:** Phát triển theo Lát cắt dọc (Vertical Slices) từ Hạ tầng cốt lõi đến Thương mại hóa B2C & B2B.

---

## 1. BỐN TRỤ CỘT CHIẾN LƯỢC CỦA NEXA

1. **Khung Năng lực Số Động & Khảo thí 4 Hình thức:** Đánh giá toàn diện qua Câu hỏi trắc nghiệm (`MCQ`), Câu hỏi tình huống (`SCENARIO`), Nhiệm vụ thực hành (`PRACTICAL_TASK`) và Sản phẩm minh chứng số (`DIGITAL_EVIDENCE`), cho phép tùy biến khung tiêu chuẩn dễ dàng.
2. **Trí tuệ Nhân tạo Đa mô hình (5 Ứng dụng AI trong 2 Lần gọi):** Hỗ trợ chấm điểm Rubric, phân tích điểm mạnh/yếu, nhận diện khoảng trống năng lực, tạo phản hồi cá nhân hóa và lắp ráp lộ trình phát triển 4 bước.
3. **Trải nghiệm Kết nối Linh hoạt & Giữ chân Người học:** Vào nhóm và phòng thi trực tiếp (cả phòng Mở không cần nhóm lẫn phòng Nhóm) qua Link, Mã PIN, QR; nhận nhận xét trực tiếp từ Người đánh giá; tích lũy điểm (point) đua Top 100+ Bảng xếp hạng.
4. **Chứng nhận Toàn vẹn & Khai thác Dữ liệu Nghiên cứu:** Cấp chứng chỉ PDF Vector mã băm SHA-256 kép có QR đối soát độc lập và hỗ trợ xuất bộ dữ liệu ẩn danh chuẩn hóa cho nghiên cứu khoa học.

---

## 2. LỘ TRÌNH LẬP TRÌNH THEO 4 GIAI ĐOẠN (4 IMPLEMENTATION PHASES)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1 (SPRINT 1-2): NỀN TẢNG CỐT LÕI, CSDL 30 BẢNG & GIAO DIỆN TỐI GIẢN         │
│ • Khởi tạo Next.js 16 + TypeScript Strict + Tailwind v4 (Bảng màu Monochrome Slate).   │
│ • Chạy SQL Migration khởi tạo 30 bảng vật lý, RLS 100%, Trigger khóa cứng vai trò tĩnh.│
│ • Nạp dữ liệu hạt giống (Seed): Khung năng lực số chuẩn, Tài khoản Admin (Chủ sàn).    │
│ • Xây dựng 4 Trang ngoài công khai & 3 Bộ Shell Dashboard tách biệt (Zero-Shared Shell)│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 2 (SPRINT 3-4): ĐỘNG CƠ KHẢO THÍ 4 HÌNH THỨC, NHÓM & PHÒNG THI LINK/PIN/QR   │
│ • Trình biên soạn câu hỏi 4 hình thức (`MCQ`, `SCENARIO`, `PRACTICAL_TASK`, `EVIDENCE`)│
│   kèm bộ kiểm tra Ma trận Rubric tổng trọng số = 100%.                                 │
│ • Quản lý Nhóm học tập (`?join=CODE`, QR) & Tính năng gửi Nhận xét cho học viên.       │
│ • Phòng thi trực tiếp (`OPEN` không cần nhóm & `GROUP_ONLY`) + Zen Mode Auto-save 15s. │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 3 (SPRINT 5-6): CỔNG AI ĐA MÔ HÌNH (5 ỨNG DỤNG AI) & LỘ TRÌNH 4 BƯỚC        │
│ • Xây dựng `AIProviderAdapter` (Gemini / OpenAI / Claude) & Huấn luyện 3 tầng.         │
│ • Triển khai Pipeline 2 lần gọi API: Chấm Rubric + Mạnh/Yếu + Khoảng trống + Phản hồi  │
│   + Lộ trình học 3 chặng từ Kho học liệu chuẩn.                                        │
│ • Bàn chấm Split-view cho Evaluator, Biểu đồ `RadarChart.tsx` duy nhất & `HeatmapChart`│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 4 (SPRINT 7-8): BẢNG XẾP HẠNG TOP 100+, CHỨNG CHỈ QR, VIETQR & XUẤT DỮ LIỆU  │
│ • Hệ thống Điểm tích lũy (point) & Bảng xếp hạng Top 100+ (`/learner/leaderboard`).         │
│ • Kết xuất Chứng chỉ PDF Vector (SHA-256 kép) & Trang Kiosk xác thực `/verify/[id]`.   │
│ • Thanh toán nâng cấp gói B2C/B2B qua VietQR Webhook `HMAC-SHA512`.                    │
│ • Công cụ Xuất dữ liệu nhóm (Evaluator) & Xuất Bộ dữ liệu Nghiên cứu ẩn danh (Admin).  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CHỈ SỐ ĐO LƯỜNG MỤC TIÊU (KEY OKRs)

1. **Tốc độ & Trải nghiệm:** Thời gian tải trang Dashboard và Bảng xếp hạng $< 200\text{ms}$; thời gian hoàn tất chấm và phân tích 5 ứng dụng AI $< 6\text{ giây}$.
2. **Độ tin cậy Khảo thí AI:** Tỷ lệ đồng thuận giữa điểm gợi ý của AI (khi được huấn luyện qua 3 tầng và Bài mẫu chuẩn) với điểm chốt của Chuyên gia đạt $\ge 85\%$.
3. **Giá trị Nghiên cứu & Thực tiễn:** 100% phiên đánh giá trích xuất được dữ liệu sạch phục vụ kiểm định độ khó ($P$), độ phân biệt ($D$) và đánh giá hiệu quả lộ trình học tập (Pre/Post-test).
