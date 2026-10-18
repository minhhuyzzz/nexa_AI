# ĐẶC TẢ YÊU CẦU HỆ THỐNG & QUY TẮC NGHIỆP VỤ (REQUIREMENTS & BUSINESS RULES)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-REQUIREMENTS`
- **Phiên bản:** `v3.2.0`
- **Phạm vi:** Quy tắc nghiệp vụ bất biến (Business Rules), Công thức tính điểm & Yêu cầu phi chức năng (NFRs)

---

## I. MA TRẬN QUY TẮC NGHIỆP VỤ BẤT BIẾN (BUSINESS RULES MATRIX)

### 1. Nhóm Quy tắc Định danh, Vai trò & Quyền riêng tư (`BR-AUTH`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-AUTH-01`** | **Quản lý xác thực đơn nhất qua Supabase Auth** | Toàn bộ mật khẩu (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số), mã xác thực OTP 6 số và phiên đăng nhập (`HttpOnly Session Cookie`) được quản lý trực tiếp bởi Supabase Auth. |
| **`BR-AUTH-02`** | **Cố định 1 Email = 1 Vai trò tĩnh bất biến** | Mỗi tài khoản đăng ký tại `/register` được chọn vai trò `LEARNER` hoặc `EVALUATOR` (vai trò `ADMIN` dành riêng cho Chủ nền tảng). Sau khi khởi tạo, trường `role` bị khóa cứng bằng Trigger CSDL, **tuyệt đối không thể thay đổi**. |
| **`BR-AUTH-03`** | **Mở quyền sử dụng ngay cho Evaluator mới** | Khách vãng lai đăng ký vai trò `EVALUATOR` sau khi xác thực email được truy cập ngay vào Evaluator Dashboard ở gói **Free Tier** để tạo nhóm và đề thi trải nghiệm. Khi nộp hồ sơ chuyên môn và được Admin duyệt (`verification_status = 'VERIFIED'`), tài khoản được gắn nhãn *"Chuyên gia xác thực"*. |
| **`BR-AUTH-04`** | **Đồng thuận bảo vệ dữ liệu cá nhân (NĐ 13/2023)** | Người dùng bắt buộc tích chọn đồng ý điều khoản xử lý dữ liệu trước khi tạo tài khoản. Hệ thống ghi nhận bản ghi bất biến vào bảng `consent_logs` (gồm IP, User-Agent, Timestamp). |
| **`BR-AUTH-05`** | **Chống dò mật khẩu (Brute-force Lockout)** | Giới hạn tối đa **5 lần** đăng nhập sai liên tiếp trong 15 phút trên mỗi địa chỉ IP/Email thông qua Upstash Redis Rate Limiter. |

---

### 2. Nhóm Quy tắc Nhóm lớp, Phòng thi & Làm bài 4 Hình thức (`BR-EXAM`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-EXAM-01`** | **Tham gia Nhóm đa phương thức (Link, Mã, QR)** | Mỗi nhóm (`assessment_groups`) có một mã `invite_code` duy nhất. Người học có thể gia nhập bằng cách bấm vào đường dẫn `?join=[invite_code]`, quét mã QR của nhóm, hoặc nhập trực tiếp mã nhóm tại `/learner/groups`. |
| **`BR-EXAM-02`** | **Phòng thi trực tiếp linh hoạt (Có nhóm hoặc Không cần nhóm)** | Người đánh giá khi mở phòng thi trực tiếp (`Live Room`) có thể chọn chế độ **Phòng thi Mở (Open Room)** — cho phép bất kỳ người học nào tham gia qua Link `?pin=[6_so]`, Mã PIN 6 số hoặc QR Code mà không cần thuộc nhóm trước — hoặc **Phòng thi Nội bộ Nhóm (Group-Only Room)**. |
| **`BR-EXAM-03`** | **Đồng bộ giờ máy chủ & Tự động lưu nháp 15 giây** | Thời gian làm bài được tính theo đồng hồ máy chủ (`Server Clock`). Trạng thái bài làm của cả 4 hình thức câu hỏi được tự động lưu ngầm lên Upstash Redis mỗi **15 giây/lần**. |
| **`BR-EXAM-04`** | **Ràng buộc bắt buộc đối với Sản phẩm & Minh chứng số** | Với câu hỏi thuộc hình thức `DIGITAL_EVIDENCE`, người học bắt buộc phải cung cấp **cả 2 thành phần**: (1) Tệp đính kèm hợp lệ (`PDF`, `PNG`, `JPG`, `ZIP` $\le 25\text{MB}$) hoặc URL minh chứng, VÀ (2) Văn bản giải trình phương án thực hiện có độ dài **tối thiểu 30 từ**. |
| **`BR-EXAM-05`** | **Cưỡng chế nộp bài khi hết giờ & Giám sát chuyển tab** | Khi thời gian đếm ngược chạm `00:00` (cộng tối đa 30 giây ân hạn đường truyền), hệ thống tự động thu bài. Nếu người học rời tab làm bài: Lần 1 nhắc nhở vàng, Lần 2 cảnh báo cam tới giám thị, từ Lần 3 gắn cờ đỏ vào biên bản phiên thi. |

---

### 3. Nhóm Quy tắc Chấm điểm, Ma trận Rubric & Công thức Năng lực (`BR-RUBRIC`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-RUBRIC-01`** | **Tổng trọng số Rubric bắt buộc bằng 100%** | Mọi câu hỏi tự luận tình huống (`SCENARIO`), nhiệm vụ thực hành (`PRACTICAL_TASK`) và sản phẩm minh chứng (`DIGITAL_EVIDENCE`) phải có ma trận tiêu chí chấm điểm thỏa mãn: $$\sum_{i=1}^{k} w_i = 100\%$$ Hệ thống chặn lưu câu hỏi nếu tổng trọng số khác `100%`. |
| **`BR-RUBRIC-02`** | **Công thức tổng hợp điểm Kỹ năng và Miền năng lực** | Điểm của một kỹ năng thành phần $S_j$ (thang 0–100) được tính bằng trung bình cộng có trọng số của tất cả câu hỏi thuộc 4 hình thức ánh xạ vào kỹ năng đó: $$S_j = \frac{\sum (P_{\text{achieved}} \times W_{\text{question}})}{\sum (P_{\text{max}} \times W_{\text{question}})} \times 100$$ Điểm của mỗi Miền năng lực bằng trung bình cộng điểm các kỹ năng thành phần được kiểm tra trong miền đó. |
| **`BR-RUBRIC-03`** | **Quy tắc quy đổi Điểm số sang 4 Bậc Thành thạo** | Điểm tổng hợp $S \in [0, 100]$ được quy đổi sang bậc năng lực số chuẩn như sau:<br>• **$0 - 39.9$:** Chưa đạt chuẩn (*Below Foundation*)<br>• **$40.0 - 59.9$:** Bậc Cơ bản (`FOUNDATION` — Level 1–2)<br>• **$60.0 - 74.9$:** Bậc Trung cấp (`INTERMEDIATE` — Level 3–4)<br>• **$75.0 - 89.9$:** Bậc Nâng cao (`ADVANCED` — Level 5–6)<br>• **$90.0 - 100$:** Bậc Chuyên sâu (`EXPERT` — Level 7–8) |
| **`BR-RUBRIC-04`** | **Quy tắc nộp lại bài bổ sung (Resubmission)** | Trong chế độ khảo thí theo lớp/nhóm, Người đánh giá có thể yêu cầu người học bổ sung minh chứng và nộp lại bài tối đa **2 lần** cho mỗi phiên đánh giá. |

---

### 4. Nhóm Quy tắc Trí tuệ Nhân tạo, Lộ trình & Bảng xếp hạng (`BR-AI`, `BR-PATH`, `BR-RANK`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-AI-01`** | **Khử định danh PII trước khi gọi AI** | Trước khi gửi dữ liệu bài làm sang bất kỳ nhà cung cấp AI nào (Gemini / OpenAI / Claude), hệ thống phải loại bỏ hoàn toàn Họ tên, Email, Số điện thoại của người học và chỉ truyền `anonymous_session_id`. |
| **`BR-AI-02`** | **Bắt buộc trích dẫn bằng chứng (`evidenceQuote`)** | AI chỉ được phép cộng điểm cho một tiêu chí Rubric khi trích xuất được câu chữ hoặc chi tiết thực tế từ bài làm/tệp minh chứng của người học vào trường `evidenceQuote`. |
| **`BR-AI-03`** | **Phân luồng theo Ngưỡng tin cậy (`0.85`) và Chế độ thi** | • **🟢 Cờ Xanh ($\ge 0.85$):** Độ tin cậy cao. Với bài tự đánh giá B2C, hệ thống công bố điểm và cấp chứng chỉ tự động. Với bài thi trong nhóm của Evaluator, cho phép Evaluator bấm *"Duyệt nhanh"*.<br>• **🟡 Cờ Cam ($0.70 - 0.84$) & 🔴 Cờ Đỏ ($< 0.70$):** Bắt buộc gắn cờ `needs_manual_review = true` để Evaluator (với bài thi nhóm) hoặc Admin (với bài thi chứng chỉ B2C) hậu kiểm. |
| **`BR-PATH-01`** | **Ngưỡng phát hiện Khoảng trống năng lực & Chống bịa học liệu** | Mọi kỹ năng có điểm số $S_j < 60.0$ đều được phân loại là **Khoảng trống năng lực (`Skill Gap`)**. Khi đề xuất lộ trình phát triển, AI **chỉ được phép chọn các `content_id` có thật** trong bảng `learning_content_items` của CSDL, tuyệt đối không tự sinh tên khóa học ngoài danh mục. |
| **`BR-RANK-01`** | **Quy tắc cộng Điểm tích lũy (point) chống cày điểm ảo** | Người học chỉ được cộng điểm (point) cho **lần hoàn thành đầu tiên** của mỗi học liệu (`+30 điểm (point)`) và chỉ được cộng điểm (point) thưởng khi điểm bài đánh giá lần sau **cao hơn** kỷ lục điểm trước đó của cùng một bộ đề. |

---

### 5. Nhóm Quy tắc Chứng chỉ, Gói dịch vụ & Xuất dữ liệu (`BR-CRED`, `BR-FIN`, `BR-DATA`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-CRED-01`** | **Điều kiện cấp Chứng chỉ & Bảo toàn SHA-256 kép** | Chứng chỉ số được cấp khi tổng điểm đạt `passing_score` của đề thi (mặc định `70.0/100`) và không có miền năng lực nào dưới `30.0`. Mỗi chứng chỉ lưu 2 mã băm `data_hash` (băm dữ liệu gốc) và `file_hash` (băm tệp PDF/A-1b) kèm mã QR dẫn tới `/verify/[id]`. |
| **`BR-FIN-01`** | **Thanh toán VietQR Idempotent (Chống cộng trùng)** | Mọi giao dịch Webhook từ cổng thanh toán phải được kiểm tra chữ ký `HMAC-SHA512` và khóa `idempotency_key` trước khi nâng cấp gói hoặc cộng lượt đánh giá. |
| **`BR-DATA-01`** | **Ẩn danh hóa khi Xuất dữ liệu Nghiên cứu** | Khi Admin xuất bộ dữ liệu nghiên cứu (`Research Dataset Export`), hệ thống tự động băm mã người dùng (`SHA-256(user_id + salt)`) và loại bỏ toàn bộ cột PII (họ tên, email, SĐT) để đảm bảo tuân thủ Nghị định 13/2023/NĐ-CP. |

---

## II. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFRs)

1. **Hiệu năng (Performance):**
   - Thời gian phản hồi chấm câu hỏi trắc nghiệm và tải bảng xếp hạng Top 100+: $< 200\text{ms}$ (P95).
   - Tổng thời gian hoàn tất chuỗi **2 lần gọi AI (2-Call Pipeline)** cho 5 ứng dụng AI: $< 6\text{ giây}$ với mô hình Flash.
2. **Bảo mật (Security):**
   - Bật **100% Row Level Security (RLS)** trên toàn bộ các bảng trong Supabase PostgreSQL.
   - Kiểm tra MIME-type và kích thước tệp minh chứng ngay tại Server trước khi lưu vào Supabase Storage.
3. **Khả năng mở rộng (Scalability & Maintainability):**
   - Cho phép thêm phiên bản Khung năng lực số mới và đổi nhà cung cấp AI (Gemini / OpenAI / Claude) hoàn toàn qua cấu hình Database mà không cần triển khai lại mã nguồn (Zero-Downtime Reconfiguration).

   # ĐẶC TẢ YÊU CẦU HỆ THỐNG & QUY TẮC NGHIỆP VỤ (REQUIREMENTS & BUSINESS RULES)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-REQUIREMENTS`
- **Phiên bản:** `v3.2.1` (Bổ sung Quy tắc Kích hoạt AI Theo Yêu Cầu `BR-AI-04`)

---

## I. MA TRẬN QUY TẮC NGHIỆP VỤ BẤT BIẾN (BUSINESS RULES MATRIX)

### 1. Nhóm Quy tắc Định danh, Vai trò & Quyền riêng tư (`BR-AUTH`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-AUTH-01`** | **Quản lý xác thực đơn nhất qua Supabase Auth** | Toàn bộ mật khẩu, mã OTP 6 số và phiên đăng nhập (`HttpOnly Session Cookie`) được quản lý trực tiếp bởi Supabase Auth. |
| **`BR-AUTH-02`** | **Cố định 1 Email = 1 Vai trò tĩnh bất biến** | Mỗi tài khoản đăng ký tại `/register` chỉ được chọn `LEARNER` hoặc `EVALUATOR` (vai trò `ADMIN` dành riêng cho Chủ nền tảng). Sau khi khởi tạo, trường `role` bị khóa cứng bằng Trigger CSDL. |
| **`BR-AUTH-03`** | **Mở quyền sử dụng ngay cho Evaluator mới** | Khách vãng lai đăng ký vai trò `EVALUATOR` sau khi xác thực email được truy cập ngay vào Evaluator Dashboard ở gói **Free Tier** để sử dụng ngay. |
| **`BR-AUTH-04`** | **Đồng thuận bảo vệ dữ liệu cá nhân (NĐ 13/2023)** | Người dùng bắt buộc tích chọn đồng ý điều khoản xử lý dữ liệu trước khi tạo tài khoản và được ghi vào `consent_logs`. |
| **`BR-AUTH-05`** | **Chống dò mật khẩu (Brute-force Lockout)** | Giới hạn tối đa **5 lần** đăng nhập sai liên tiếp trong 15 phút trên mỗi địa chỉ IP/Email. |

---

### 2. Nhóm Quy tắc Nhóm lớp, Phòng thi & Làm bài 4 Hình thức (`BR-EXAM`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-EXAM-01`** | **Tham gia Nhóm đa phương thức (Link, Mã, QR)** | Người học có thể gia nhập nhóm bằng cách bấm vào đường dẫn `?join=[invite_code]`, quét mã QR của nhóm, hoặc nhập trực tiếp mã nhóm tại `/learner/groups`. |
| **`BR-EXAM-02`** | **Phòng thi trực tiếp linh hoạt (Có nhóm hoặc Không nhóm)** | Người đánh giá khi mở phòng thi trực tiếp có thể chọn chế độ **Phòng thi Mở (`OPEN`)** — cho phép bất kỳ người học nào tham gia qua Link `?pin=[6_so]`, Mã PIN 6 số hoặc QR Code mà không cần thuộc nhóm trước — hoặc **Phòng thi Nội bộ Nhóm (`GROUP_ONLY`)**. |
| **`BR-EXAM-03`** | **Đồng bộ giờ máy chủ & Tự động lưu nháp 15 giây** | Thời gian làm bài tính theo `Server Clock`; bài làm tự động lưu nháp lên Upstash Redis mỗi **15 giây/lần**. |
| **`BR-EXAM-04`** | **Ràng buộc đối với Sản phẩm & Minh chứng số** | Với câu hỏi `DIGITAL_EVIDENCE`, người học bắt buộc cung cấp cả tệp đính kèm/URL hợp lệ ($\le 25\text{MB}$) VÀ văn bản giải trình phương án có độ dài **tối thiểu 30 từ**. |
| **`BR-EXAM-05`** | **Nộp bài chấm khách quan tức thì (`0.01s`)** | Khi bấm "Nộp bài" (hoặc khi hết giờ `00:00`), hệ thống **chỉ chạy thuật toán máy chủ để chấm tức thì các câu `MCQ` và nhánh chọn `SCENARIO`**, lưu bài thực hành vào CSDL và trả kết quả ngay mà không tự động gọi AI. |

---

### 3. Nhóm Quy tắc Chấm điểm, Ma trận Rubric & Công thức Năng lực (`BR-RUBRIC`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-RUBRIC-01`** | **Tổng trọng số Rubric bắt buộc bằng 100%** | Mọi câu hỏi tự luận tình huống, nhiệm vụ thực hành và sản phẩm minh chứng phải có ma trận tiêu chí chấm điểm thỏa mãn $\sum w_i = 100\%$. |
| **`BR-RUBRIC-02`** | **Công thức tổng hợp điểm Kỹ năng và Miền năng lực** | Điểm kỹ năng thành phần $S_j \in [0, 100]$ bằng trung bình cộng có trọng số của các câu hỏi ánh xạ vào kỹ năng đó: $$S_j = \frac{\sum (P_{\text{achieved}} \times W_{\text{question}})}{\sum (P_{\text{max}} \times W_{\text{question}})} \times 100$$ |
| **`BR-RUBRIC-03`** | **Quy tắc quy đổi Điểm số sang 4 Bậc Thành thạo** | • $0 - 39.9$: Chưa đạt chuẩn (`BELOW_FOUNDATION`)<br>• $40.0 - 59.9$: Cơ bản (`FOUNDATION`)<br>• $60.0 - 74.9$: Trung cấp (`INTERMEDIATE`)<br>• $75.0 - 89.9$: Nâng cao (`ADVANCED`)<br>• $90.0 - 100$: Chuyên sâu (`EXPERT`) |
| **`BR-RUBRIC-04`** | **Quy tắc nộp lại bài bổ sung (Resubmission)** | Người đánh giá có thể yêu cầu người học bổ sung minh chứng và nộp lại bài tối đa **2 lần**. |

---

### 4. Nhóm Quy tắc Trí tuệ Nhân tạo Theo Yêu Cầu, Lộ trình & Bảng xếp hạng (`BR-AI`, `BR-PATH`, `BR-RANK`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-AI-01`** | **Khử định danh PII trước khi gọi AI** | Loại bỏ hoàn toàn Họ tên, Email, Số điện thoại của người học trước khi gửi dữ liệu sang `AIProviderAdapter`. |
| **`BR-AI-02`** | **Bắt buộc trích dẫn bằng chứng (`evidenceQuote`)** | AI chỉ được cộng điểm tiêu chí Rubric khi trích xuất được câu chữ hoặc chi tiết thực tế từ bài làm vào `evidenceQuote`. |
| **`BR-AI-03`** | **Ngưỡng Cờ tin cậy (`0.85`)** | • **Cờ Xanh ($\ge 0.85$):** Độ tin cậy cao.<br>• **Cờ Cam ($0.70 - 0.84$) & Cờ Đỏ ($< 0.70$):** Bật `needs_manual_review = true` để con người thẩm định. |
| **`BR-AI-04`** | **Kích hoạt AI theo yêu cầu (On-Demand AI Trigger)** | **Tuyệt đối không tự động gọi AI ngầm khi nộp bài.** Hệ thống chỉ gọi API AI và trừ lượt AI Credit khi Người học hoặc Người đánh giá chủ động bấm nút *"Chấm bài thực hành bằng AI"* hoặc *"Phân tích năng lực & Đề xuất lộ trình bằng AI"*. Nếu phiên làm bài đó đã được AI chấm/phân tích trước đó và không có thay đổi bài nộp, hệ thống trả về dữ liệu đã lưu trong CSDL mà không gọi lại AI lần 2. |
| **`BR-PATH-01`** | **Ngưỡng Khoảng trống năng lực & Chống bịa học liệu** | Kỹ năng có điểm $< 60.0$ được đánh dấu là **Khoảng trống năng lực (`Skill Gap`)**. Lộ trình phát triển chỉ được chọn các học liệu có thật trong bảng `learning_content_items`. |
| **`BR-RANK-01`** | **Quy tắc cộng Điểm tích lũy (point) chống cày điểm ảo** | Chỉ cộng `+30 điểm (point)` cho lần hoàn thành đầu tiên của mỗi học liệu và chỉ cộng điểm (point) thưởng bài thi khi điểm lần sau cao hơn kỷ lục trước đó. |

---

### 5. Nhóm Quy tắc Chứng chỉ, Gói dịch vụ & Xuất dữ liệu (`BR-CRED`, `BR-FIN`, `BR-DATA`)

| Mã Quy tắc | Tên Quy tắc | Nội dung Đặc tả Kỹ thuật & Nghiệp vụ |
| :---: | :--- | :--- |
| **`BR-CRED-01`** | **Điều kiện cấp Chứng chỉ & Bảo toàn SHA-256 kép** | Cấp chứng chỉ khi đạt `passing_score` (mặc định `70.0/100`) và không có miền nào dưới `30.0`; lưu đủ `data_hash` và `file_hash` kèm QR dẫn tới `/verify/[id]`. |
| **`BR-FIN-01`** | **Thanh toán VietQR Idempotent** | Kiểm tra chữ ký `HMAC-SHA512` và khóa `idempotency_key` trước khi nâng cấp gói hoặc cộng lượt. |
| **`BR-DATA-01`** | **Ẩn danh hóa khi Xuất dữ liệu Nghiên cứu** | Khi Admin xuất bộ dữ liệu nghiên cứu (`Research Dataset Export`), tự động băm mã người dùng (`SHA-256`) và loại bỏ toàn bộ cột PII. |
