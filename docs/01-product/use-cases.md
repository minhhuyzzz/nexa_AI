# ĐẶC TẢ TÁC NHÂN (ACTORS) VÀ TRƯỜNG HỢP SỬ DỤNG (USE CASES) TOÀN HỆ THỐNG

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-USE-CASES`
- **Phiên bản:** `v3.2.0`
- **Tổng số Use Cases chuẩn hóa:** **50 Use Cases** (4 Guest + 16 Learner + 16 Evaluator + 11 Admin + 3 External Systems)

---

## I. DANH SÁCH TÁC NHÂN HỆ THỐNG (SYSTEM ACTORS)

| STT | Tác nhân (Actor) | Mã định danh | Mô tả vai trò & Quyền hạn cốt lõi |
| :-: | :--- | :---: | :--- |
| **1** | **Khách vãng lai (Guest)** | `ROLE_GUEST` | Người dùng chưa đăng nhập; tìm hiểu nền tảng qua các trang công khai (`/`, `/framework`, `/pricing`, `/faq`), tự đăng ký tài khoản với vai trò cố định (`LEARNER` hoặc `EVALUATOR`), đăng nhập hoặc mở đường dẫn xác thực chứng chỉ khi quét QR (`/verify/[id]`). |
| **2** | **Người học (Learner)** | `ROLE_LEARNER` | Cá nhân tự đánh giá năng lực số trên nền tảng (B2C) hoặc tham gia vào Nhóm / Phòng thi trực tiếp qua Link, Mã PIN, QR. Làm bài 4 hình thức, nhận phân tích từ 5 ứng dụng AI, nhận lời nhận xét từ Người đánh giá, học theo lộ trình 4 bước, tích lũy điểm (point) đua Top 100+ và nhận chứng chỉ số. |
| **3** | **Người đánh giá (Evaluator)** | `ROLE_EVALUATOR` | Giảng viên, chuyên gia độc lập hoặc đại diện tổ chức tự đăng ký vai trò đánh giá. Tạo nhóm lớp (Link/Mã/QR), mở phòng thi trực tiếp (có nhóm hoặc không cần nhóm), biên soạn câu hỏi 4 hình thức + Rubric 100%, chấm bài cùng AI, gửi nhận xét cho người học và xuất dữ liệu phân tích. |
| **4** | **Chủ nền tảng / Quản trị viên (Admin)** | `ROLE_ADMIN` | Chủ sở hữu vận hành hệ thống NEXA. Quản trị Khung năng lực số động, biên soạn Ngân hàng đề chuẩn & Kho học liệu chuẩn, cấu hình AI đa mô hình, quản lý gói dịch vụ & doanh thu VietQR, hậu kiểm chứng chỉ và xuất bộ dữ liệu nghiên cứu khoa học. |
| **5** | **Động cơ AI Đa mô hình (Multi-Model AI)** | `SYS_AI` | Hệ thống AI kết nối qua `AIProviderAdapter` (Gemini / OpenAI / Claude), thực thi 2-Call Pipeline cho 5 ứng dụng AI dựa trên 3 tầng huấn luyện (Khung năng lực + Rubric 100% + Bài mẫu chuẩn). |
| **6** | **Cổng Thanh toán Tự động (VietQR Gateway)** | `SYS_PAYMENT` | Sinh mã QR thanh toán động và gửi Webhook xác thực chữ ký `HMAC-SHA512` để nâng cấp gói dịch vụ tự động. |

---

## II. BẢNG TỔNG HỢP 50 USE CASES THEO 5 PHÂN HỆ

### 1. Phân hệ Trang ngoài & Xác thực (`Public & Auth` — 4 Use Cases)

| Mã UC | Tên Use Case | Đường dẫn (Route) | Tóm tắt chức năng cốt lõi |
| :---: | :--- | :--- | :--- |
| **`UC-GST-001`** | Khám phá Trang chủ, Khung năng lực, Bảng giá & FAQ | `/`, `/framework`, `/pricing`, `/faq` | Xem giới thiệu nền tảng, 4 hình thức đánh giá, 5 ứng dụng AI, cấu trúc khung năng lực số và bảng giá gói dịch vụ B2C/B2B (không đặt ô tra cứu QR trên Landing Page). |
| **`UC-GST-002`** | Đăng ký tài khoản & Chọn vai trò cố định (`LEARNER` / `EVALUATOR`) | `/register` | Khách vãng lai tự đăng ký qua Supabase Auth, chọn 1 vai trò tĩnh bất biến, tích đồng thuận NĐ 13/2023 và xác thực OTP để vào thẳng Dashboard tương ứng. |
| **`UC-GST-003`** | Đăng nhập hệ thống & Phân luồng Dashboard | `/login` | Xác thực phiên đăng nhập, kiểm tra chống dò mật khẩu và điều hướng tự động vào `/learner/*`, `/evaluator/*` hoặc `/admin/*`. |
| **`UC-GST-004`** | Khôi phục mật khẩu & Bảo mật phiên đăng nhập | `/reset-password` | Xác thực qua email để đặt lại mật khẩu mới và thu hồi các phiên đăng nhập cũ. |

---

### 2. Phân hệ Người học (`Learner Portal` — 16 Use Cases)

| Mã UC | Tên Use Case | Đường dẫn (Route) | Tóm tắt chức năng cốt lõi |
| :---: | :--- | :--- | :--- |
| **`UC-LEA-001`** | Xem tổng quan năng lực, Cấp bậc Rank & Biểu đồ Radar | `/learner/dashboard` | Xem điểm năng lực tổng quát, biểu đồ Radar các miền năng lực, tổng điểm tích lũy (point), thứ hạng hiện tại, nhận xét mới từ Người đánh giá và tiến độ lộ trình học. |
| **`UC-LEA-002`** | Cài đặt hồ sơ cá nhân & Quyền riêng tư dữ liệu | `/learner/profile` | Cập nhật thông tin cá nhân, đổi mật khẩu, quản lý trạng thái đồng thuận dữ liệu hoặc yêu cầu ẩn danh hóa tài khoản. |
| **`UC-LEA-003`** | Khám phá & Làm bài đánh giá chuẩn NEXA (Luồng B2C) | `/learner/assessments` | Tìm kiếm, lọc và tự làm các bộ đề đánh giá chuẩn của NEXA theo miền năng lực, kỹ năng, cấp độ và hình thức câu hỏi. |
| **`UC-LEA-004`** | Tham gia Nhóm & Nhận nhận xét từ Người đánh giá | `/learner/groups` | Gia nhập nhóm qua **Link (`?join=CODE`)**, **Mã nhóm** hoặc **QR Code**; xem bài thi được giao trong nhóm và đọc các **lời nhận xét, đánh giá định kỳ từ Người đánh giá**. |
| **`UC-LEA-005`** | Vào Phòng thi trực tiếp qua Link, Mã PIN 6 số hoặc QR | `/learner/live-pin` | Tham gia phòng thi thời gian thực (cả phòng thi Mở không cần nhóm lẫn phòng thi Nhóm) bằng cách bấm Link `?pin=123456`, nhập PIN 6 số hoặc quét QR. |
| **`UC-LEA-006`** | Thực hiện Câu hỏi trắc nghiệm & Câu hỏi tình huống | `/learner/take/[id]` | **(Hình thức 1 & 2):** Làm câu hỏi trắc nghiệm (`MCQ`) và phân tích xử lý các kịch bản tình huống thực tế (`SCENARIO`) trong phòng thi Zen Mode (Auto-save 15s). |
| **`UC-LEA-007`** | Thực hiện Nhiệm vụ thực hành & Nộp sản phẩm minh chứng | `/learner/take/[id]` | **(Hình thức 3 & 4):** Làm bài tập thao tác thực hành (`PRACTICAL_TASK`) và tải tệp sản phẩm số (`PDF`, `PNG`, `ZIP` / Link) kèm văn bản giải trình phương án (`DIGITAL_EVIDENCE`). |
| **`UC-LEA-008`** | Bổ sung minh chứng & Nộp lại bài đánh giá | `/learner/submissions` | Xem yêu cầu chỉnh sửa từ Người đánh giá, cập nhật sản phẩm minh chứng hoặc viết lại giải trình và nộp lại bài (tối đa 2 lần). |
| **`UC-LEA-009`** | Xem kết quả chi tiết, Phản hồi AI & Nhận xét của Chuyên gia | `/learner/results/[id]` | **(Ứng dụng AI 1 & 4):** Xem điểm từng tiêu chí Rubric kèm trích dẫn bằng chứng, biểu đồ Radar, **Phản hồi cá nhân hóa từ AI** và **Nhận xét chuyên môn từ Người đánh giá**. |
| **`UC-LEA-010`** | Xem phân tích Điểm mạnh, Điểm yếu & Khoảng trống năng lực | `/learner/results/[id]` | **(Ứng dụng AI 2 & 3):** Xem danh sách kỹ năng làm chủ tốt ($\ge 80\%$), kỹ năng hạn chế và chẩn đoán chi tiết các **Khoảng trống năng lực (`Skill Gaps < 60%`)**. |
| **`UC-LEA-011`** | Học theo Lộ trình phát triển năng lực 4 bước & Đánh giá lại | `/learner/learning-path` | **(Ứng dụng AI 5):** Học từng học liệu theo các chặng ưu tiên do AI sắp xếp từ Kho học liệu chuẩn, đánh dấu hoàn thành (`+30 điểm (point)`) và làm bài **Đánh giá lại kỹ năng** để tăng điểm Radar. |
| **`UC-LEA-012`** | Theo dõi lịch sử làm bài & Biểu đồ tiến bộ (`Pre/Post Diff`) | `/learner/submissions` | Xem lại toàn bộ các phiên đánh giá đã thực hiện và so sánh biểu đồ Radar trước - sau khi hoàn thành lộ trình phát triển. |
| **`UC-LEA-013`** | Đua Top 100+ Bảng xếp hạng & Tích lũy điểm (point) | `/learner/leaderboard` | Xem bảng xếp hạng **Top 100+ Người học** (theo Tuần, Tháng, Toàn hệ thống hoặc trong Nhóm), theo dõi bậc Rank cá nhân và lịch sử cộng điểm tích lũy (point). |
| **`UC-LEA-014`** | Quản lý, tải xuống Chứng chỉ số PDF & Đối soát QR | `/learner/credentials`, `/verify/[id]` | Tải chứng chỉ PDF Vector (chuẩn PDF/A-1b, mã băm SHA-256 kép); khi quét mã QR trên chứng chỉ sẽ mở trang `/verify/[id]` để xác thực tính hợp lệ. |
| **`UC-LEA-015`** | Mở khóa Huy hiệu kỹ năng & Chia sẻ Hồ sơ năng lực (Portfolio) | `/learner/credentials` | Sưu tập huy hiệu thành tích và tạo trang Hồ sơ năng lực số công khai trưng bày chứng chỉ cùng các sản phẩm minh chứng tiêu biểu. |
| **`UC-LEA-016`** | Nâng cấp gói dịch vụ cá nhân (`Learner Pro`) qua VietQR | `/learner/billing` | Xem hạn mức lượt đánh giá hiện tại, chọn nâng cấp gói Learner Pro qua mã VietQR tự động và quản lý lịch sử thanh toán. |

---

### 3. Phân hệ Người đánh giá (`Evaluator Portal` — 16 Use Cases)

| Mã UC | Tên Use Case | Đường dẫn (Route) | Tóm tắt chức năng cốt lõi |
| :---: | :--- | :--- | :--- |
| **`UC-EVA-001`** | Xem bảng điều khiển khảo thí & Hàng đợi bài nộp | `/evaluator/dashboard` | Theo dõi tổng số nhóm, số học viên, danh sách bài thực hành đang chờ chấm duyệt và thống kê nhanh tiến độ khảo thí. |
| **`UC-EVA-002`** | Quản lý hồ sơ chuyên gia & Gửi minh chứng xác thực | `/evaluator/dashboard` | Cập nhật thông tin chuyên môn và gửi hồ sơ năng lực (tùy chọn) để nhận huy hiệu *"Chuyên gia xác thực"* từ Chủ nền tảng. |
| **`UC-EVA-003`** | Quản lý Nhóm học viên (Link, Mã nhóm, QR) & Nhập Excel | `/evaluator/groups` | Tạo nhóm lớp, lấy **Link tham gia (`?join=CODE`)**, **Mã nhóm** và **QR Code** để gửi cho người học, hoặc nhập danh sách từ tệp Excel. |
| **`UC-EVA-004`** | Gửi lời nhận xét & Đánh giá định kỳ cho Người học trong Nhóm | `/evaluator/groups` | Xem hồ sơ tiến bộ của từng thành viên trong nhóm và gửi trực tiếp lời nhận xét, góp ý chuyên môn hoặc nhắc nhở học tập tới Dashboard của người học. |
| **`UC-EVA-005`** | Biên soạn câu hỏi 4 hình thức & Ma trận Rubric 100% | `/evaluator/item-bank` | Tạo câu hỏi Trắc nghiệm (`MCQ`), Tình huống (`SCENARIO`), Nhiệm vụ thực hành (`PRACTICAL_TASK`), Sản phẩm minh chứng (`DIGITAL_EVIDENCE`) kèm Rubric tổng trọng số = 100%. |
| **`UC-EVA-006`** | Quản lý ngân hàng câu hỏi riêng & Nhân bản đề mẫu NEXA | `/evaluator/item-bank` | Lưu trữ câu hỏi theo miền năng lực/kỹ năng và nhân bản (`Clone`) câu hỏi từ Ngân hàng đề chuẩn của NEXA về kho riêng để chỉnh sửa. |
| **`UC-EVA-007`** | Thiết kế bộ đề đánh giá & Cấu hình tiêu chuẩn đạt | `/evaluator/exams` | Lắp ghép các câu hỏi 4 hình thức thành bộ đề, cài đặt thời gian làm bài, điểm chuẩn đạt (`passing_score`) và trọng số từng phần. |
| **`UC-EVA-008`** | Giao bài đánh giá cho Nhóm theo thời hạn | `/evaluator/exams` | Phân bổ đề thi cho một hoặc nhiều nhóm học viên kèm thời gian mở đề và hạn nộp bài. |
| **`UC-EVA-009`** | Mở Phòng thi trực tiếp (Có nhóm hoặc Phòng Mở) qua Link/PIN/QR | `/evaluator/live-room/[pin]` | Mở phòng thi thời gian thực ở chế độ **Mở (không cần nhóm)** hoặc **Theo nhóm**; hiển thị Link vào thi, Mã PIN 6 số và mã QR lớn trên màn chiếu. |
| **`UC-EVA-010`** | Giám sát tiến độ làm bài & Cảnh báo chuyển tab thời gian thực | `/evaluator/live-room/[pin]` | Theo dõi trạng thái làm bài của từng thí sinh trong phòng thi trực tiếp và nhận cảnh báo khi thí sinh rời màn hình làm bài. |
| **`UC-EVA-011`** | Thẩm định sản phẩm minh chứng & Giải trình trên Split-view | `/evaluator/grading` | Xem trực tiếp tệp PDF/Ảnh sản phẩm và văn bản giải trình ở cột trái; chấm điểm theo từng tiêu chí Rubric ở cột phải. |
| **`UC-EVA-012`** | Đối soát gợi ý AI, Cờ tin cậy & Đánh dấu Bài mẫu chuẩn | `/evaluator/grading` | Xem điểm gợi ý, trích dẫn bằng chứng và cờ tin cậy AI (Xanh/Cam/Đỏ); sửa điểm, nhập nhận xét và tùy chọn đánh dấu làm **"Bài mẫu chuẩn" (`Gold Sample`)** để huấn luyện AI. |
| **`UC-EVA-013`** | Phê duyệt kết quả, Gửi nhận xét hoặc Yêu cầu nộp lại bài | `/evaluator/grading` | Chốt điểm chính thức kèm lời phê gửi tới người học, duyệt nhanh hàng loạt bài Cờ Xanh, hoặc yêu cầu người học bổ sung minh chứng nộp lại. |
| **`UC-EVA-014`** | Cấp phát chứng nhận năng lực số cho học viên đạt chuẩn | `/evaluator/grading` | Kích hoạt phát hành chứng chỉ số PDF Vector có mã QR cho các học viên hoàn thành đạt chuẩn bài đánh giá. |
| **`UC-EVA-015`** | Xem Bản đồ nhiệt kỹ năng (`Skill Heatmap`) & Xuất dữ liệu phân tích | `/evaluator/analytics` | Phân tích biểu đồ Radar tập thể, ma trận nhiệt kỹ năng của cả nhóm, độ khó ($P$) / độ phân biệt ($D$) và **xuất toàn bộ dữ liệu ra tệp Excel (`.xlsx`), CSV, PDF**. |
| **`UC-EVA-016`** | Nâng cấp gói dịch vụ khảo thí (`Pro` / `Enterprise`) | `/evaluator/billing` | Theo dõi hạn mức nhóm và lượt chấm AI còn lại, thanh toán nâng cấp gói qua VietQR tự động. |

---

### 4. Phân hệ Chủ nền tảng / Quản trị viên (`Super Admin Portal` — 11 Use Cases)

| Mã UC | Tên Use Case | Đường dẫn (Route) | Tóm tắt chức năng cốt lõi |
| :---: | :--- | :--- | :--- |
| **`UC-ADM-001`** | Giám sát vận hành toàn hệ thống, Doanh thu & Lưu lượng AI | `/admin/dashboard` | Theo dõi số lượng người học B2C, số chuyên gia/tổ chức B2B, số phiên đánh giá, doanh thu gói dịch vụ và chi phí Token AI. |
| **`UC-ADM-002`** | Quản trị tài khoản người dùng & Hỗ trợ vận hành | `/admin/users` | Tìm kiếm, lọc tài khoản theo vai trò (`LEARNER`, `EVALUATOR`), khóa/mở khóa tài khoản vi phạm. |
| **`UC-ADM-003`** | Quản lý khách hàng Tổ chức (`Enterprise`) & Hạn mức | `/admin/organizations` | Quản lý hồ sơ các trường học, doanh nghiệp đối tác và cấu hình hạn mức tài nguyên riêng. |
| **`UC-ADM-004`** | Xét duyệt hồ sơ xác thực Chuyên gia đánh giá | `/admin/evaluator-vetting` | Duyệt hồ sơ chuyên môn để cấp tích xác thực cho các tài khoản Người đánh giá uy tín. |
| **`UC-ADM-005`** | Quản trị Khung Năng lực Số Động (Đa phiên bản) | `/admin/framework-engine` | Thêm, sửa, cập nhật các Miền năng lực, Kỹ năng thành phần và tạo phiên bản khung năng lực mới khi tiêu chuẩn thay đổi mà không cần sửa code. |
| **`UC-ADM-006`** | Biên soạn & Xuất bản Ngân hàng Đề Chuẩn NEXA | `/admin/benchmark-bank` | Tạo và xuất bản các bộ đề đánh giá chuẩn 4 hình thức phục vụ người học B2C và làm kho đề mẫu cho Evaluator. |
| **`UC-ADM-007`** | Quản trị Kho Học liệu Chuẩn gắn nhãn Kỹ năng | `/admin/learning-content` | Biên soạn và gắn nhãn các khóa học, bài đọc, video, bài tập vào từng kỹ năng để làm dữ liệu gốc cho AI lắp ráp lộ trình phát triển. |
| **`UC-ADM-008`** | Thiết lập Gói dịch vụ (B2C/B2B) & Đối soát VietQR | `/admin/pricing-plans` | Cấu hình quyền lợi, giá cước các gói `Learner Free/Pro`, `Evaluator Free/Pro`, `Enterprise` và đối soát lịch sử giao dịch. |
| **`UC-ADM-009`** | Quản lý mẫu phôi, Hậu kiểm B2C & Thu hồi chứng chỉ | `/admin/credentials` | Quản lý mẫu chứng chỉ PDF, duyệt các bài thi lấy chứng chỉ B2C có cờ AI `< 0.85` và thu hồi chứng chỉ vi phạm. |
| **`UC-ADM-010`** | Cấu hình Đa mô hình AI (Gemini/OpenAI/Claude) & Prompt | `/admin/ai-gateway` | Chuyển đổi nhà cung cấp AI, cập nhật System Prompts cho 5 ứng dụng AI, quản lý kho Bài mẫu chuẩn (`Gold Samples`) và giới hạn ngân sách Token. |
| **`UC-ADM-011`** | Xuất Bộ dữ liệu Nghiên cứu Khoa học & Nhật ký Audit Logs | `/admin/analytics`, `/admin/audit-logs` | **Xuất bộ dữ liệu khảo thí ẩn danh (`CSV` / `Excel` / `JSON`)** phục vụ nghiên cứu thống kê (SPSS, R, Python) và tra cứu sổ cái kiểm toán bất biến. |

---

### 5. Phân hệ Tích hợp Hệ thống Ngoại vi (`External Systems` — 3 Use Cases)

| Mã UC | Tên Use Case | Service / Endpoint | Tóm tắt chức năng cốt lõi |
| :---: | :--- | :--- | :--- |
| **`UC-EXT-001`** | Xử lý Webhook thanh toán VietQR tự động | `POST /api/billing/webhook` | Xác thực chữ ký `HMAC-SHA512`, kiểm tra chống trùng lặp và tự động kích hoạt gói dịch vụ / cộng lượt đánh giá. |
| **`UC-EXT-002`** | **[AI Call #1]** Hỗ trợ chấm điểm đa phương thức theo Rubric | `ai-evaluation.service.ts` | **(Đáp ứng Ứng dụng AI số 1):** Qua `AIProviderAdapter`, chấm bài Tình huống, Thực hành, Sản phẩm minh chứng dựa trên 3 tầng huấn luyện; trả về điểm từng tiêu chí, `evidenceQuote` và `confidenceScore`. |
| **`UC-EXT-003`** | **[AI Call #2]** Phân tích Mạnh/Yếu, Khoảng trống, Phản hồi & Lộ trình | `gap-analysis.service.ts` | **(Đáp ứng Ứng dụng AI số 2, 3, 4, 5):** Phân tích bảng điểm kỹ năng để sinh Điểm mạnh/yếu, Khoảng trống năng lực (`< 60%`), Phản hồi cá nhân hóa và sắp xếp Lộ trình học từ Kho học liệu chuẩn. |
