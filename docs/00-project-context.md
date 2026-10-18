# BÁO CÁO TỔNG QUAN DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

*(AI-Powered Digital Competency Assessment, Certification & Adaptive Development Platform)*

---

- **Mã tài liệu:** `SPEC-NEXA-CONTEXT`
- **Phiên bản:** `v3.2.1` (Chuẩn hóa Toàn diện B2C & B2B SaaS, Khung Năng lực Động, Kích hoạt AI Theo Yêu Cầu & Gamification)
- **Định vị nền tảng:** Nền tảng SaaS đánh giá, phân tích, bồi dưỡng và chứng nhận năng lực số toàn diện cho Cá nhân (B2C), Người đánh giá độc lập (B2B2C) và Tổ chức/Doanh nghiệp (B2B).
- **Khung tiêu chuẩn cốt lõi:** **Khung Năng lực Số Chuẩn Động** (Quản lý đa phiên bản trong CSDL, dễ dàng tùy biến và cập nhật khi tiêu chuẩn thay đổi mà không cần sửa code).
- **Tuân thủ pháp lý:** Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân tại Việt Nam) & GDPR.

---

## I. TỔNG QUAN & ĐỊNH VỊ DỰ ÁN (EXECUTIVE SUMMARY)

- **Tên dự án:** Hệ thống đánh giá và chứng nhận phát triển năng lực số dựa trên trí tuệ nhân tạo.
- **Tên nền tảng:** **NEXA**
- **Chu trình giải pháp khép kín:**
  $$\text{Đánh giá 4 Hình thức} \longrightarrow \text{Chấm Khách quan Tức thì (0.01s)} \longrightarrow \text{Bấm nút Kích hoạt AI Chấm & Phân tích} \longrightarrow \text{Lộ trình Học 4 Bước} \longrightarrow \text{Chứng nhận QR & Rank Top 100+}$$
- **Mô hình kinh doanh (B2C + B2B2C + B2B Subscription Tiers):**
  1. **B2C (Người học cá nhân):** Bất kỳ cá nhân nào cũng có thể tự đăng ký, làm bài đánh giá chuẩn của hệ thống, tích lũy điểm (point) đua Top bảng xếp hạng (Rank 100+), chủ động bấm kích hoạt AI phân tích & tạo lộ trình học tập, và nâng cấp gói **Learner Pro** để mở khóa đánh giá chuyên sâu kèm chứng chỉ số.
  2. **B2B2C & B2B (Người đánh giá độc lập & Tổ chức):** Giảng viên, chuyên gia đào tạo hoặc doanh nghiệp tự đăng ký vai trò Người đánh giá (`EVALUATOR`), quản lý nhóm lớp, mở phòng thi trực tiếp (qua Link, Mã PIN, QR), tự chấm tay hoặc bấm nút nhờ AI hỗ trợ chấm bài, gửi nhận xét cho người học và xuất dữ liệu phân tích.
- **Vai trò Chủ nền tảng (`Super Admin`):** Do chính Chủ sở hữu hệ thống trực tiếp vận hành để quản trị Khung năng lực số động, xuất bản Ngân hàng đề chuẩn & Kho học liệu chuẩn, cấu hình AI đa mô hình, quản lý các gói dịch vụ, đối soát doanh thu VietQR và xuất bộ dữ liệu ẩn danh phục vụ nghiên cứu khoa học.

---

## II. BỐI CẢNH & BÀI TOÁN THỰC TIỄN TẠI VIỆT NAM (PROBLEM STATEMENT)

1. **Khung đánh giá tĩnh và lạc hậu:** Các công cụ kiểm tra hiện tại chỉ xoay quanh tin học văn phòng cơ bản và bị đóng cứng trong mã nguồn; khi tiêu chuẩn năng lực số cập nhật, hệ thống cũ không thể tự mở rộng.
2. **Thiếu đánh giá tình huống thực tiễn và sản phẩm minh chứng:** Chỉ dùng câu hỏi trắc nghiệm lý thuyết nên không đo lường được khả năng xử lý tình huống, kỹ năng thực hành thao tác hay thẩm định sản phẩm số thực tế của người học.
3. **Chấm điểm thực hành thủ công quá tải & Thiếu phản hồi sâu:** Giảng viên hoặc đơn vị khảo thí mất hàng giờ để đọc từng bài giải trình và xem từng tệp đính kèm, dẫn đến người học chỉ nhận được con số điểm khô khan mà không biết điểm mạnh, điểm yếu hay khoảng trống năng lực của mình ở đâu.
4. **Thiếu lộ trình phát triển sau đánh giá & thiếu động lực duy trì:** Người học tự do sau khi biết mình yếu một kỹ năng lại không có sẵn lộ trình bài học tương ứng để rèn luyện lại, cũng như thiếu cơ chế tích lũy điểm và bảng xếp hạng để duy trì động lực học tập.

---

## III. GIẢI PHÁP CỐT LÕI CỦA NEXA (CORE SOLUTION)

### 1. Kiến trúc Khung Năng lực Số Động (Dynamic Competency Framework Engine)

Hệ thống không gắn cứng vào một số hiệu phiên bản cố định trên giao diện mà quản trị động hoàn toàn trong Cơ sở dữ liệu (`assessment_frameworks` $\rightarrow$ `competency_domains` $\rightarrow$ `competencies`):

- **Khởi tạo mặc định:** Gồm **5 Miền năng lực cốt lõi** và **21 Kỹ năng thành phần** trên **8 Cấp độ thành thạo** (quy về 4 bậc chuẩn: *Cơ bản - Foundation, Trung cấp - Intermediate, Nâng cao - Advanced, Chuyên sâu - Expert*):
  1. *Miền 1:* Tìm kiếm, đánh giá và quản lý thông tin, dữ liệu.
  2. *Miền 2:* Giao tiếp, cộng tác và ứng xử trong môi trường số.
  3. *Miền 3:* Sáng tạo nội dung số, bản quyền và làm việc cùng AI.
  4. *Miền 4:* An toàn bảo mật, sức khỏe số và trách nhiệm môi trường.
  5. *Miền 5:* Giải quyết vấn đề kỹ thuật và tự phát triển năng lực số.
- **Khả năng tùy biến tương lai:** Khi tiêu chuẩn năng lực số cập nhật, Chủ nền tảng (Admin) có thể tạo phiên bản khung mới, thêm/sửa miền năng lực, kỹ năng và tiêu chí đầu ra ngay trên giao diện `/admin/framework-engine` mà không làm ảnh hưởng đến dữ liệu lịch sử của các kỳ thi trước.

### 2. Đánh giá Năng lực Số Đa phương thức qua 4 Hình thức (4 Assessment Formats)

| STT | Hình thức đánh giá | Mã định danh | Bản chất khảo thí & Thao tác của người học | Cơ chế chấm điểm |
| :-: | :--- | :---: | :--- | :--- |
| **1** | **Câu hỏi trắc nghiệm** | `MCQ` | Kiểm tra kiến thức nền tảng qua câu hỏi một lựa chọn, nhiều lựa chọn hoặc ghép nối khái niệm. | **Code Backend tự chấm 100%** ngay khi bấm Nộp bài (0.01s, tốn 0 Token AI). |
| **2** | **Câu hỏi tình huống** | `SCENARIO` | Đặt người học vào bối cảnh thực tế (sự cố lừa đảo mạng, rò rỉ dữ liệu, thẩm định thông tin AI...). Người học chọn quyết định tối ưu hoặc viết phương án xử lý. | **Code tự chấm tức thì** (nhánh quyết định) hoặc **Bấm nút kích hoạt AI chấm theo Rubric** (phần tự luận). |
| **3** | **Nhiệm vụ thực hành** | `PRACTICAL_TASK` | Giao bài tập thao tác trực tiếp ngay trong phòng thi (viết cấu trúc câu lệnh Prompt, lập quy trình xử lý, phân tích dữ liệu...) và nộp kết quả thực hiện. | Người học/Evaluator **bấm nút kích hoạt AI chấm theo Ma trận Rubric 100%** (hoặc Evaluator tự chấm tay). |
| **4** | **Sản phẩm và minh chứng số** | `DIGITAL_EVIDENCE` | Người học tải lên tệp sản phẩm thực tế (`PDF`, `PNG/JPG`, `ZIP`) hoặc gắn liên kết (`Figma`, `GitHub`, `Drive`) **bắt buộc kèm đoạn văn bản giải trình phương án ($\ge 30$ từ)**. | **AI Đa phương thức (Multimodal)** đọc trực tiếp tệp đính kèm + văn bản giải trình khi được bấm kích hoạt, kết hợp con người thẩm định. |

### 3. Ứng dụng AI Toàn diện (5 Nhiệm vụ), Đa Mô hình & Cơ chế Bấm Nút Kích Hoạt (On-Demand AI)

#### A. Cơ chế Kích hoạt AI Theo Yêu cầu (On-Demand Trigger — Tiết kiệm tối đa chi phí Token)

- **Khi bấm Nộp bài:** Hệ thống **không tự động gọi AI ngầm**, mà chỉ dùng thuật toán máy chủ chấm ngay phần Trắc nghiệm & Nhánh chọn Tình huống trong `0.01 giây` để tránh lãng phí Token cho các bài nộp thử/nộp trắng.
- **Khi cần dùng AI:** Người học (trên trang Kết quả) hoặc Người đánh giá (trên Bàn chấm) chủ động bấm 2 nút chức năng tách biệt:
  1. **Nút 1 — Chấm bài thực hành bằng AI (`POST /api/ai/grade-submission`):** Thực hiện **Ứng dụng AI số 1 (Hỗ trợ chấm điểm)** đối với câu Tình huống tự luận, Nhiệm vụ thực hành và Sản phẩm minh chứng số; trả về điểm từng tiêu chí Rubric, trích dẫn bằng chứng (`evidenceQuote`) và chỉ số độ tin cậy (`confidenceScore` chia làm 3 mức: **Cờ Xanh $\ge 0.85$**, **Cờ Cam $0.70 - 0.84$**, **Cờ Đỏ $< 0.70$**).
  2. **Nút 2 — Phân tích sâu & Đề xuất lộ trình bằng AI (`POST /api/ai/analyze-competency`):** Thực hiện đồng thời 4 nhiệm vụ còn lại trong 1 lần gọi API:
     - **Ứng dụng AI số 2:** Phân tích điểm mạnh ($\ge 80\%$) và điểm yếu.
     - **Ứng dụng AI số 3:** Nhận diện khoảng trống năng lực (`Skill Gaps < 60%`) và phân tích hệ quả thực tế.
     - **Ứng dụng AI số 4:** Tạo phản hồi cá nhân hóa toàn diện.
     - **Ứng dụng AI số 5:** Đề xuất lộ trình phát triển năng lực 4 bước từ các học liệu có thật trong CSDL.

#### B. Kiến trúc Đa mô hình (`AIProviderAdapter`) & Huấn luyện AI 3 Tầng

- **Đổi mô hình linh hoạt:** Chủ nền tảng (Admin) có thể chuyển đổi nóng giữa **Google Gemini (`gemini-2.5-flash` / `pro`)**, **OpenAI (`gpt-4o` / `gpt-4o-mini`)**, hoặc **Anthropic Claude** tại `/admin/ai-gateway`.
- **Huấn luyện & Chuẩn hóa AI qua 3 tầng:**
  1. *Tầng 1 (Tri thức Khung năng lực động):* Tự động đính kèm chuẩn đầu ra và chỉ báo hành vi từ bảng `competencies`.
  2. *Tầng 2 (Khóa chặt Rubric 100%):* Chỉ cho điểm khi trích xuất được bằng chứng trong bài làm khớp với tiêu chí.
  3. *Tầng 3 (Bài chấm mẫu chuẩn - Gold Samples):* Học theo các bài nộp thực tế đã được Admin hoặc Người đánh giá chấm chuẩn và đánh dấu `is_gold_sample = true`.

---

## IV. LỘ TRÌNH 4 BƯỚC, PHÒNG THI LINH HOẠT, BẢNG XẾP HẠNG & XUẤT DỮ LIỆU NGHIÊN CỨU

1. **Chu trình 4 Bước của Lộ trình Phát triển Năng lực:** (1) Admin nạp Kho học liệu chuẩn gắn nhãn kỹ năng $\rightarrow$ (2) Bài thi phát hiện kỹ năng đạt $< 60$ điểm $\rightarrow$ (3) Người dùng bấm kích hoạt AI sắp xếp học liệu thành 3 Chặng ưu tiên $\rightarrow$ (4) Người học hoàn thành từng bài (`+30 điểm (point)`) và mở khóa **Bài đánh giá lại kỹ năng** để nâng điểm biểu đồ Radar.
2. **Tham gia Nhóm & Phòng thi Trực tiếp Linh hoạt (Link, Mã PIN, QR):**
   - Tham gia nhóm qua Link `?join=CODE`, Mã nhóm hoặc QR; nhận **Lời nhận xét định kỳ** trực tiếp từ Người đánh giá ngay trên Dashboard.
   - Mở Phòng thi trực tiếp ở cả **Chế độ Mở (`OPEN` — không cần thuộc nhóm trước)** hoặc **Chế độ Nhóm (`GROUP_ONLY`)** qua Link `?pin=849201`, Mã PIN 6 số hoặc QR Code.
3. **Điểm tích lũy (point) & Bảng xếp hạng Top 100+ (`/learner/leaderboard`):** Giữ chân người học tự do B2C với cơ chế tích lũy điểm (point) và vinh danh Top 100+ siêu nhẹ qua bộ đệm Upstash Redis.
4. **Xuất Dữ liệu Phân tích & Nghiên cứu Khoa học:** Evaluator xuất bảng điểm nhóm ra Excel/CSV/PDF; Admin xuất **Bộ dữ liệu nghiên cứu ẩn danh (`Research Dataset Export`)** chứa đủ 26 biến số khảo thí để phân tích trên SPSS, R, Python, Power BI.
