# NEXA AI — Phân tích toàn bộ Use Case theo từng Dashboard

**Tài liệu:** NEXA System Use Case Inventory & Gap Analysis  
**Phạm vi:** Toàn bộ nền tảng NEXA AI trên repository `minhhuyzzz/nexa_AI`, nhánh `main`  
**Ngày rà soát:** 24/10/2026  
**Mục đích:** Làm tài liệu gốc để chốt nghiệp vụ, thiết kế Use Case/UML, lập backlog và giao việc cho AI Coding Agent.

> **Lưu ý về độ tin cậy:** Bản phân tích dựa trên cây thư mục, tài liệu kiến trúc, trang giao diện, API route và các migration SQL đã commit. Đây là rà soát tĩnh; chưa chạy tích hợp với Supabase đang triển khai và chưa kiểm thử toàn bộ luồng bằng tài khoản thật. Vì vậy, “có trong mã nguồn” không đồng nghĩa “đã nghiệm thu chạy đúng”. Các chức năng được đánh dấu **Chưa thấy** là chưa tìm được bằng chứng trong snapshot repo đã rà soát, không khẳng định chúng không tồn tại ở một dịch vụ ngoài repo.

---

## 1. Kết luận điều hành

NEXA hiện được tổ chức thành **3 dashboard chính**: Người học (`LEARNER`), Người đánh giá (`EVALUATOR`) và Admin (`ADMIN`). Ngoài ra còn có các trang công khai, xác thực, xác minh chứng chỉ và API dùng chung.

Repo đã có nền tảng cho phần lớn luồng khảo thí cơ bản: danh mục đề, Studio soạn đề, nộp bài, chấm khách quan, chấm Rubric bằng AI, phân tích năng lực, module học tập, lớp/nhóm, phòng thi PIN, chứng chỉ và cấu hình AI Gateway. Tuy nhiên, một số luồng quan trọng chỉ mới có giao diện, có dữ liệu giả lập/lưu ở trình duyệt, hoặc chưa có đủ kiểm soát quyền truy cập.

### 1.1. Các vấn đề phải giải quyết trước khi mở rộng

1. **Phân quyền và quyền sở hữu dữ liệu:** Không thể chỉ dựa vào việc ẩn nút theo dashboard. API và RLS cần xác minh vai trò, chủ sở hữu đề, thành viên lớp/tổ chức và quyền sử dụng đề. Có API quản trị đề chưa kiểm tra vai trò rõ ràng; một số truy vấn đề của Evaluator thiếu lọc chủ sở hữu; RLS hiện tại có chính sách quản lý đề rộng cho cả `EVALUATOR` và `ADMIN`.
2. **Đáp án đúng phải được bảo vệ ở cấp dữ liệu:** API chi tiết đề có bỏ trường `is_correct`, nhưng policy đọc trực tiếp `item_options` trong migration cho phép người đăng nhập đọc các option của đề đã công khai. Cần ngăn đường truy cập trực tiếp làm lộ đáp án.
3. **Tổ chức chưa thành luồng B2B hoàn chỉnh:** Đã có `organizations` và `user_organizations`, trang tạo tổ chức và vai trò thành viên sơ bộ; chưa thấy luồng hoàn chỉnh để mời thành viên, xác nhận lời mời, quản trị thành viên và cách ly dữ liệu theo tổ chức.
4. **Ngân hàng câu hỏi chưa tách khỏi câu hỏi của đề:** Trang Evaluator truy vấn `assessment_items` nhưng schema yêu cầu `assessment_id`; một số thao tác thêm/nhân bản không truyền trường đó và dùng độ khó `STANDARD` không thuộc enum migration. Chưa thể coi ngân hàng câu hỏi là nghiệp vụ đã hoàn tất.
5. **Thanh toán và gói dịch vụ chưa đáng tin cậy:** Một số màn hình thay đổi gói trong state phía client và mô phỏng thanh toán bằng `setTimeout`; chưa thấy mô hình đơn hàng/giao dịch/webhook/quyền lợi thương mại đầy đủ trong repo.
6. **Chi phí AI chưa hạch toán đầy đủ:** Schema `ai_evaluations` có token đầu vào/đầu ra, nhưng API chấm AI được rà soát không truyền giá trị đó vào bản ghi. Chưa thấy bảng giao dịch sử dụng AI kèm đơn giá/chi phí và báo cáo tài chính toàn hệ thống.
7. **Phòng Live chưa có giám sát cưỡng chế đầy đủ:** Toggle khóa phòng trong màn hình điều phối chỉ đổi state client; API vào phòng không kiểm tra biến khóa đó. `GROUP_ONLY` chưa được cưỡng chế đầy đủ bằng quyền thành viên. Các sự kiện giám sát chuyển tab, thoát fullscreen, mất kết nối và vi phạm chưa có luồng ghi nhận/đánh giá hoàn chỉnh được chứng minh.
8. **Điểm tích lũy dễ sai lệch nếu cộng trực tiếp vào `profiles.points`:** API nộp bài và hoàn thành học liệu cộng điểm bằng đọc-tăng-cập nhật. Thiết kế cần ledger bất biến, chống cộng trùng và không để Evaluator tự sửa điểm tích lũy.
9. **Radar hiện có hai lớp khác nhau cần phân biệt:** Radar của một bài/lần đánh giá và radar hồ sơ theo thời gian không phải cùng một thứ. NEXA nên lưu từng snapshot lịch sử, sau đó tổng hợp tiến bộ dài hạn theo 5 miền; không ghi đè lịch sử bằng kết quả bài gần nhất.
10. **Có nhiều trang cài đặt cần kiểm tra tính lưu bền vững:** Ví dụ `admin/settings` lưu thành công bằng state local; không thấy thao tác persistence ở phần trang đã rà soát. Các trang billing cũng chứa số liệu và giao dịch mô phỏng.

### 1.2. Quy ước trạng thái trong tài liệu

| Nhãn | Ý nghĩa |
|---|---|
| **Có thành phần** | Có route/page/API/schema liên quan trong repo; chưa đồng nghĩa đã nghiệm thu end-to-end. |
| **Một phần / cần sửa** | Có UI hoặc logic nền nhưng thiếu điều kiện, dữ liệu, quyền hạn hoặc xử lý ngoại lệ. |
| **Rủi ro bảo mật/nghiệp vụ** | Có dấu hiệu cụ thể trong mã nguồn cần xử lý trước production. |
| **Chưa thấy** | Không tìm thấy module/API/schema đủ để xác nhận trong snapshot hiện tại. |
| **Đề xuất mục tiêu** | Nghiệp vụ nên được bổ sung để sản phẩm hoàn chỉnh. |

---

## 2. Tác nhân và ranh giới quyền hạn

### 2.1. Tác nhân chính

| Tác nhân | Phạm vi nghiệp vụ | Không được mặc nhiên làm |
|---|---|---|
| **Khách truy cập** | Xem trang chủ, khung năng lực, bảng giá, FAQ và trang xác minh chứng chỉ công khai. | Không xem dữ liệu cá nhân, đề riêng hoặc kết quả người dùng. |
| **Người học (`LEARNER`)** | Làm bài, xem kết quả, dùng AI theo quyền lợi/credit, học theo lộ trình, theo dõi radar, tham gia lớp/ca thi, quản lý chứng chỉ và điểm. | Không sửa điểm tích lũy, đáp án đúng, kết quả đã chốt hay dữ liệu người khác. |
| **Người đánh giá độc lập (`EVALUATOR`)** | Tạo đề riêng, quản lý lớp, giao đề, chấm bài, điều phối phòng thi và xem dữ liệu trong phạm vi mình phụ trách. | Không tự phát hành đề riêng ra kho toàn hệ thống, không tự cấp điểm tích lũy cho người học, không xem dữ liệu Evaluator khác nếu không được cấp quyền. |
| **Người đánh giá thuộc tổ chức** | Thực hiện các chức năng Evaluator trong phạm vi tổ chức/lớp/đề được phân công. | Không quản trị toàn tổ chức nếu không có vai trò tương ứng; không xem dữ liệu tổ chức khác. |
| **Quản trị viên tổ chức (`ORG_ADMIN`)** | Quản lý thành viên, phân công, lớp, quyền và hạn mức của tổ chức mình. | Không trở thành Admin nền tảng và không can thiệp tổ chức khác. |
| **Admin nền tảng (`ADMIN`)** | Quản trị người dùng, nội dung chuẩn, tổ chức, khung năng lực, dịch vụ AI, gói dịch vụ, kiểm toán và vận hành toàn hệ thống. | Không được tùy tiện sửa lịch sử điểm/kết quả mà không có audit log và lý do. |
| **AI Gateway** | Nhận tác vụ có kiểm soát, chạy mô hình được cấu hình, trả kết quả theo schema, lưu thông tin thực thi. | Không tự quyết định quyền truy cập, không tự cấp điểm thưởng hoặc chứng chỉ chỉ dựa trên văn bản tự sinh. |
| **Dịch vụ thanh toán** | Xác nhận giao dịch qua kênh đáng tin cậy và gửi trạng thái giao dịch. | Không được tin vào thông báo thành công từ trình duyệt nếu chưa xác minh chữ ký/trạng thái. |

### 2.2. Quy tắc quyền bất biến

- Quyền được xác minh ở **máy chủ và cơ sở dữ liệu**, không chỉ trên giao diện.
- `ADMIN` là quyền quản trị nền tảng; **không phải một tổ chức** và không thay thế quyền `ORG_ADMIN`.
- `EVALUATOR` là chức năng nghề nghiệp, còn tổ chức là phạm vi dữ liệu. Một Evaluator độc lập có thể không thuộc tổ chức; một Evaluator có thể được mời vào một hoặc nhiều tổ chức.
- Không được dùng `localStorage`, demo role hoặc dữ liệu client làm nguồn xác thực quyền production.
- Đề phải có chủ sở hữu và phạm vi rõ: `PERSONAL`, `ORGANIZATION`, `SYSTEM_PUBLIC` hoặc phạm vi tương đương.
- Phân biệt trạng thái **bản nháp**, **sẵn sàng sử dụng nội bộ**, **chờ duyệt**, **đã công khai**, **tạm ẩn**, **thu hồi**. Không gộp tất cả vào một boolean `is_published`.

---

## 3. Tổng quan các phân hệ và route hiện có

### 3.1. Trang công khai và xác thực

- `/` — Trang chủ
- `/framework` — Giới thiệu khung năng lực
- `/pricing` — Bảng giá
- `/faq` — Hướng dẫn/FAQ
- `/verify/[credentialId]` — Xác minh chứng chỉ
- `/login`, `/register`, `/forgot-password`, `/onboarding`
- `/auth/callback` — Callback xác thực

### 3.2. Dashboard Người học

- `/learner/dashboard`
- `/learner/assessments`, `/learner/assessments/[id]`
- `/learner/take/[id]`, `/learner/assessments/[id]/result`
- `/learner/competency`, `/learner/competency/analysis`
- `/learner/learning-path`
- `/learner/submissions`
- `/learner/groups`, `/learner/groups/[groupId]`
- `/learner/live-pin`, `/learner/live-pin/waiting-room`
- `/learner/credentials`, `/learner/leaderboard`
- `/learner/contribute`, `/learner/contribute/new`
- `/learner/profile`, `/learner/settings`, `/learner/billing`

### 3.3. Dashboard Người đánh giá

- `/evaluator/dashboard`
- `/evaluator/assessments`, `/evaluator/assessments/new`, `/evaluator/assessments/[id]`
- `/evaluator/exams`, `/evaluator/item-bank`
- `/evaluator/live-room`
- `/evaluator/groups`, `/evaluator/groups/[groupId]`
- `/evaluator/grading`, `/evaluator/analytics`
- `/evaluator/billing`, `/evaluator/profile`, `/evaluator/settings`

### 3.4. Dashboard Admin

- `/admin/dashboard`
- `/admin/frameworks`
- `/admin/content`, `/admin/content/assessments/new`, `/admin/content/assessments/[id]`
- `/admin/contributions`
- `/admin/ai-gateway`
- `/admin/users`, `/admin/evaluators`, `/admin/organizations`, `/admin/plans`
- `/admin/compliance`, `/admin/settings`

### 3.5. API/domain dùng chung được phát hiện

- Auth: `/api/auth/login`, `/register`, `/onboarding`, `/demo`
- Đề/nộp bài: `/api/assessments`, `/api/assessments/[id]`, `/submit`, `/api/admin/assessments...`
- AI: `/api/ai/grade-submission`, `/api/ai/analyze-competency`, `/api/ai/status`, `/api/admin/ai-gateway`
- Framework: `/api/frameworks/active`
- Người học: `/api/learner/profile`, `/profile-stats`, `/competency-profile`
- Học liệu: `/api/learning/modules`, `/api/learning/complete`
- Lớp học: `/api/evaluator/classes...`, `/api/classes/[id]`, posts/replies/messages/files
- Phòng Live: `/api/evaluator/rooms`, `/api/rooms/join`, `/api/rooms/status`
- Chấm/xuất: `/api/evaluator/submissions`, `/api/evaluator/grade`, `/api/evaluator/analytics`, `/api/evaluator/export`
- Minh chứng: `/api/evidence/upload`
- Chứng chỉ: `/api/credentials/my`, `/generate`, `/[id]/pdf`
- Quản trị: `/api/admin/users`, `/evaluators`, `/organizations`, `/compliance`

**Nhận xét về tài liệu:** Trong cây thư mục hiện tại chưa thấy nhóm tài liệu `use-cases.md` hoặc `user-stories.md` riêng biệt. Tài liệu này được lập từ route, API, schema và kiến trúc repo; nên được dùng làm bản kiểm kê ban đầu và đưa vào `docs/01-product` (hoặc cấu trúc tài liệu tương đương) làm nguồn quản lý chính thức.

---

# PHẦN A — USE CASE TRANG CÔNG KHAI VÀ XÁC THỰC

## 4. Public & Identity Use Cases

| ID | Use case | Tác nhân | Mục tiêu và luồng chính | Trạng thái / ghi chú |
|---|---|---|---|---|
| PUB-01 | Xem trang chủ | Khách | Mở landing page, hiểu sản phẩm và đi tới đăng ký/dùng thử. | Có route. Cần kiểm tra CTA có dẫn tới luồng thật. |
| PUB-02 | Xem khung năng lực | Khách/Người học | Xem miền, kỹ năng, phiên bản và tiêu chí đánh giá. | Có route và API framework động. Tránh ghi cứng phiên bản. |
| PUB-03 | Xem gói dịch vụ | Khách/Người học/Evaluator | So sánh quyền lợi, giới hạn và giá gói. | Có trang pricing; cần thống nhất với dữ liệu gói thương mại thật. |
| PUB-04 | Đọc FAQ/hướng dẫn | Khách | Tra cứu cách sử dụng, thi, chứng chỉ, AI và bảo mật. | Có route; cần rà soát nội dung đồng bộ chức năng. |
| PUB-05 | Xác minh chứng chỉ bằng QR/ID | Nhà tuyển dụng/Khách | Mở trang xác minh, xem tính hợp lệ, người được cấp, ngày cấp và trạng thái thu hồi. | Có route/schema. Cần giới hạn trường dữ liệu công khai và kiểm tra revocation. |
| AUTH-01 | Đăng ký Người học | Khách | Nhập email, biệt danh, mật khẩu, xác nhận điều khoản, xác thực email và tạo hồ sơ `LEARNER`. | Có UI/API; cần kiểm tra rate limit, xác nhận email và đồng bộ schema. |
| AUTH-02 | Đăng ký Người đánh giá | Khách | Chọn `EVALUATOR`, tạo tài khoản, hoàn thiện hồ sơ chuyên môn theo yêu cầu. | Có đăng ký vai trò; xác minh chuyên gia/admin review chưa hoàn chỉnh về nghiệp vụ. |
| AUTH-03 | Đăng nhập | Người dùng | Xác thực, tải role, chuyển tới dashboard đúng và giữ session hợp lệ. | Có UI/API/middleware; cần rà soát demo role và authorization tại API. |
| AUTH-04 | Quên/đặt lại mật khẩu | Người dùng | Yêu cầu liên kết khôi phục, xác minh token, đặt mật khẩu mới, hết hạn token. | Có trang quên mật khẩu; cần xác nhận toàn bộ callback/luồng cập nhật. |
| AUTH-05 | Onboarding | Người mới | Bổ sung thông tin bắt buộc, đồng ý chính sách, hoàn thành thiết lập ban đầu. | Có route/page; cần thống nhất với đăng ký email/OAuth. |
| AUTH-06 | Google OAuth/callback | Người dùng | Xác thực qua nhà cung cấp và tạo/ghép hồ sơ đúng role. | Có callback route; cần test mapping role, email đã tồn tại và tài khoản không có quyền. |
| AUTH-07 | Đăng xuất/hết hạn session | Người dùng | Kết thúc phiên, xóa cookie và chặn truy cập tài nguyên bảo vệ. | Cần kiểm tra end-to-end; không chỉ redirect ở UI. |
| AUTH-08 | Chấp thuận/ghi nhận đồng thuận dữ liệu | Người dùng | Xem chính sách, đồng ý theo phiên bản, lưu thời gian và bằng chứng đồng thuận. | Có bảng `consent_logs`; cần luồng xem/rút lại/đề nghị quyền dữ liệu nếu áp dụng. |
| AUTH-09 | Chuyển dashboard demo | Người kiểm thử | Chuyển role giả lập khi phát triển/demo. | Có demo role/cookie trong repo; rủi ro cao nếu bypass auth hoặc bật trong production. Phải cô lập và vô hiệu hóa ở production. |

### 4.1. Luồng xác thực chuẩn

1. Người dùng đăng nhập/đăng ký bằng phương thức hợp lệ.
2. Máy chủ xác minh session từ Supabase Auth.
3. Máy chủ đọc profile và vai trò từ nguồn tin cậy.
4. Nếu thuộc tổ chức, lấy membership và quyền trong tổ chức; không suy luận membership từ email hoặc client state.
5. Chỉ sau khi xác minh đầy đủ mới mở route và API phù hợp.
6. Ghi log cho hành động nhạy cảm như cấp quyền Admin, xác minh Evaluator, mời thành viên, đổi gói hoặc xử lý giao dịch.

**Ngoại lệ bắt buộc:** tài khoản chưa xác minh email; profile chưa tạo; role không hợp lệ; tài khoản bị tạm khóa; session hết hạn; người dùng bị mời vào tổ chức nhưng chưa chấp nhận; tài khoản có nhiều membership; tổ chức ngưng hoạt động.

---

# PHẦN B — USE CASE DASHBOARD NGƯỜI HỌC

## 5. Vai trò và mục tiêu của Người học

Người học sử dụng NEXA để làm bài đánh giá, hiểu năng lực hiện tại, theo dõi tiến bộ, thực hiện lộ trình học tập và nhận chứng chỉ. Dashboard phải lấy trạng thái từ dữ liệu thực, không biến KPI trang trí thành sự thật nghiệp vụ.

## 5.1. Danh mục use case Người học

| ID | Use case | Mục tiêu / luồng chính | Hiện trạng và điểm cần xác minh |
|---|---|---|---|
| LRN-01 | Xem Dashboard tổng quan | Xem bài đã làm, điểm tích lũy, miền năng lực, lịch sử gần đây, trạng thái chứng chỉ và việc cần làm tiếp theo. | Có page; cần bảo đảm KPI cùng một định nghĩa và nguồn. |
| LRN-02 | Duyệt danh mục bài khảo thí | Xem đề công khai, tìm kiếm, lọc theo miền/loại/độ khó/miễn phí/gói. | Có page/API; API hiện lọc `is_published`; phải thêm kiểm tra quyền truy cập. |
| LRN-03 | Xem chi tiết đề | Xem mô tả, thời lượng, điểm đạt, loại câu hỏi, quyền truy cập và quy chế trước khi bắt đầu. | Có page; cần không trả đáp án đúng hoặc dữ liệu bí mật. |
| LRN-04 | Kiểm tra quyền mở đề miễn phí/VIP | Cho phép vào nếu đề public và quyền lợi hợp lệ; giải thích lý do khóa nếu không. | UI có khóa VIP; API chi tiết chưa đủ kiểm tra purchase/entitlement. Rủi ro. |
| LRN-05 | Bắt đầu làm bài | Tạo/tiếp tục submission, tải câu hỏi đã được lọc trường nhạy cảm, khởi chạy bộ đếm thời gian. | Có page/API. Cần xác thực chủ bài, thời điểm bắt đầu, hạn nộp và điều kiện thi. |
| LRN-06 | Trả lời trắc nghiệm/tình huống | Chọn phương án, lưu đáp án cục bộ và/hoặc máy chủ; hỗ trợ điều hướng câu hỏi. | Có code lưu local draft; cần xác minh lưu server định kỳ và phục hồi sau mất mạng. |
| LRN-07 | Soạn câu trả lời tự luận/thực hành | Nhập giải trình, tải minh chứng hoặc cung cấp URL theo yêu cầu câu hỏi. | Có giao diện; luồng upload cần xác minh quyền, loại file, giới hạn và gắn đúng submission. |
| LRN-08 | Tự động lưu bài | Lưu bản nháp định kỳ, hiển thị thời điểm lưu cuối và trạng thái đồng bộ. | Có localStorage timer; chưa đủ bằng chứng autosave server bền vững. Rủi ro mất dữ liệu nếu đổi thiết bị. |
| LRN-09 | Nộp bài | Xác nhận nộp, khóa thay đổi bài theo chính sách, tính thời gian và lưu submission. | Có API. Cần idempotency, kiểm tra trạng thái đề/submission và xử lý nộp lặp. |
| LRN-10 | Chấm tự động phần khách quan | Chấm MCQ/nhánh tình huống bằng code, trả điểm thô, phần trăm và đạt/chưa đạt. | Có logic API; cần kiểm thử công thức, max score, submission cũ và tránh chấm lại cộng trùng. |
| LRN-11 | Xem kết quả và giải thích | Xem điểm, từng câu, lời giải được phép công khai, phần cần chấm tay/AI còn chờ xử lý. | Có result page; phải không lộ đáp án trước khi nộp hoặc khi đề không cho xem. |
| LRN-12 | Kích hoạt AI chấm bài thực hành | Người học chủ động gọi chấm AI nếu chính sách cho phép; xem Rubric, bằng chứng, điểm và cờ tin cậy. | UI take page có alert giả lập ở nút AI trong code được rà soát; endpoint có thật nhưng cần nối luồng UI, kiểm quyền và quyền lợi. |
| LRN-13 | Kích hoạt AI phân tích năng lực | Yêu cầu phân tích radar, điểm mạnh/yếu, khoảng trống và gợi ý học tập. | Có API/page, theo nguyên tắc on-demand. Cần chống gọi trùng, ghi chi phí và chỉ phân tích dữ liệu đúng người dùng. |
| LRN-14 | Xem hồ sơ năng lực 5 miền | Xem mức hiện tại theo từng miền/kỹ năng, dữ liệu nền và khoảng trống. | Có competency profile API/page. Cần tách snapshot từng bài với radar dài hạn. |
| LRN-15 | Theo dõi radar theo thời gian | So sánh điểm 5 miền ở nhiều lần đánh giá; xem tiến bộ theo thời gian, nguồn đánh giá và độ tin cậy. | Đề xuất bắt buộc. Không lấy một bài làm và ghi đè radar hồ sơ xuyên suốt. Schema có phân tích gắn submission, cần thiết kế quy tắc tổng hợp lịch sử. |
| LRN-16 | Xem chi tiết kỹ năng/gap | Mở kỹ năng, xem điểm, bằng chứng, nguyên nhân có thể và mục tiêu cải thiện. | Có dữ liệu `skill_gaps` trong `competency_analyses`; cần truy nguồn và tránh kết luận AI thiếu bằng chứng. |
| LRN-17 | Xem lộ trình học cá nhân | Nhận các bước học gắn skill gap, mục tiêu, học liệu, tiến độ và thứ tự đề xuất. | Có page/API và `learning_pathway`; liên kết giữa `moduleId` do AI đề xuất với học liệu thật cần xác thực. |
| LRN-18 | Mở module học liệu | Xem nội dung, mục tiêu, miền/kỹ năng và thời lượng dự kiến. | Có `learning_modules` và API. Cần phân loại nội dung, truy cập, nguồn tài liệu và phiên bản. |
| LRN-19 | Đánh dấu hoàn thành bài học | Ghi nhận hoàn thành, cập nhật tiến độ và chỉ thưởng điểm một lần cho module hợp lệ. | Có API nhưng cộng điểm bằng đọc-sửa `profiles.points`; cần ledger và transaction chống race/duplicate. |
| LRN-20 | Đánh giá lại kỹ năng | Làm lại một bài đánh giá hoặc bộ câu hỏi có thể so sánh với baseline. | Có gợi ý luồng trong lộ trình; cần lưu `attempt`/baseline và không thay thế lịch sử. |
| LRN-21 | Xem lịch sử bài làm | Lọc theo đề, thời gian, trạng thái, điểm, lần làm và kết quả AI/chấm tay. | Có `/learner/submissions`; cần xác minh filter và liên kết mỗi lần làm. |
| LRN-22 | Tham gia nhóm/lớp | Xem nhóm được mời, thành viên, bài giao, thông báo và tài liệu. | Có routes learner/groups và shared class APIs; cần xác minh luồng join/invite và quyền từng member. |
| LRN-23 | Xem nhiệm vụ và hạn nộp | Xem assignment, deadline, trạng thái chưa làm/đã nộp/quá hạn và liên kết tới bài thi. | Có page; cần kiểm tra cập nhật trạng thái dựa trên submission thật. |
| LRN-24 | Xem trao đổi trong lớp | Đọc bài đăng, phản hồi, tin nhắn và file được chia sẻ trong lớp. | Có API posts/replies/messages/files; cần kiểm tra quyền thành viên và lọc loại file. |
| LRN-25 | Vào phòng Live bằng PIN/link/QR | Nhập PIN 6 số hoặc mở link, xác minh phòng đang mở, ghi nhận tham gia và kiểm tra chế độ nhóm. | Có join/status endpoints. Cần xác minh tư cách nhóm, hạn phòng, quyền đề và giới hạn thử PIN. |
| LRN-26 | Chờ phòng thi bắt đầu | Xem thông tin ca thi, trạng thái phòng và số người tham gia; tự chuyển sang làm bài khi được phép. | Có waiting room polling. Phải xử lý phòng bị đóng, đổi ca, mất mạng và timeout mà không chuyển sai đề. |
| LRN-27 | Thực hiện bài thi có giám sát | Ghi nhận tab visibility, fullscreen, mất kết nối, copy/paste nếu chính sách cho phép và hiển thị cảnh báo. | Chưa thấy hệ thống giám sát toàn diện. Trình duyệt thường không thể chặn/chứng minh hoàn toàn việc chụp ảnh màn hình. |
| LRN-28 | Xem và tải chứng chỉ | Xem chứng chỉ đã cấp, mở PDF, QR và thông tin xác minh. | Có page/API generator. Cần kiểm tra quyền sở hữu, cấp trùng và tính toàn vẹn. |
| LRN-29 | Xem bảng xếp hạng | Xem thứ hạng dựa trên điểm tích lũy hợp lệ và thông tin công khai đã cho phép. | Có page/API/Redis; cần chống buff, loại role không phải LEARNER và chính sách quyền riêng tư. |
| LRN-30 | Góp đề cộng đồng | Gửi đề/câu hỏi/đáp án/giải thích và tài liệu nguồn; theo dõi trạng thái duyệt. | Có trang nhưng đang sử dụng `localStorage` ở phía Learner/Admin theo file đã rà soát; chưa phải workflow tập trung. |
| LRN-31 | Quản lý hồ sơ cá nhân | Cập nhật biệt danh, ảnh/avatar và thông tin được phép; xem điểm/tài khoản. | Có page/API. Cần kiểm tra upload/avatar và không cho tự sửa role/points/plan. |
| LRN-32 | Cài đặt tài khoản | Cấu hình tùy chọn, thông báo, quyền riêng tư và phiên làm việc. | Có page; phải xác định cài đặt nào được lưu server và cài đặt nào chỉ ở UI. |
| LRN-33 | Nâng cấp gói dịch vụ | Xem gói, chọn gói, tạo đơn thanh toán, xác nhận và nhận quyền lợi sau webhook hợp lệ. | Page hiện có mô phỏng thanh toán; luồng giao dịch thật chưa được xác nhận. |
| LRN-34 | Chia sẻ kết quả/chứng chỉ | Tạo liên kết chia sẻ có kiểm soát, không làm lộ dữ liệu không công khai. | Có một số nút chia sẻ; cần quy định quyền và dữ liệu được chia sẻ. |

## 5.2. Use case xuyên suốt bắt buộc cho Người học

### LRN-FLOW-01 — Làm bài từ đầu đến cuối

**Tiền điều kiện:** Người học đăng nhập; đề được phép truy cập; chưa hết hạn hoặc vượt giới hạn lượt làm.  
**Luồng chính:**
1. Chọn đề → xem thông tin và quy chế.
2. Máy chủ kiểm tra quyền đề/gói, trạng thái phát hành và eligibility.
3. Tạo hoặc khôi phục submission đúng người dùng.
4. Tải nội dung câu hỏi đã loại bỏ `is_correct` và các dữ liệu đáp án bí mật.
5. Lưu câu trả lời và tiến độ bằng cơ chế server autosave; local draft chỉ là lớp hỗ trợ phục hồi.
6. Nộp bài; server kiểm tra trạng thái, thời gian và câu trả lời.
7. Chấm phần khách quan và lưu kết quả nguyên tử.
8. Phần thực hành/essay đặt trạng thái cần chấm nếu chưa có kết quả.
9. Mở trang kết quả và cho phép kích hoạt các tác vụ AI riêng khi cần.

**Luồng ngoại lệ:** mất mạng; submission đã nộp; hết giờ; đề bị thu hồi giữa ca; API chấm lỗi; duplicate submit; user cố gửi answer thuộc bài của người khác; nội dung upload không hợp lệ.

**Tiêu chí nghiệm thu:** nộp lặp không cộng điểm 2 lần; người khác không đọc/sửa submission; timer có nguồn thời gian máy chủ; trả lời không bị mất khi chuyển thiết bị; mọi kết quả có thể truy dấu.

### LRN-FLOW-02 — Radar tiến bộ xuyên suốt

**Nguyên tắc:** Một bài thi tạo ra **snapshot theo lần đánh giá**; hồ sơ NEXA giữ **chuỗi snapshot** và tính radar tổng hợp hiện tại. Không gộp hai khái niệm vào một radar duy nhất.

- **Radar lần đánh giá:** Điểm của một submission, kèm loại bài, framework version, thời điểm, domain/skill mapping, cách chấm và cờ tin cậy.
- **Radar dài hạn:** Tổng hợp các snapshot đủ điều kiện theo quy tắc công bố. Mỗi miền có điểm hiện tại, xu hướng, số bằng chứng, độ mới và khoảng tin cậy/độ chắc chắn nếu đủ dữ liệu.
- **Radar so sánh:** Chọn hai mốc thời gian hoặc hai lần đánh giá và hiển thị thay đổi điểm theo miền/kỹ năng.
- **Không tự thay lịch sử:** Một lần chấm lại hoặc sửa kết quả phải tạo sự kiện/version mới; không ghi đè snapshot ban đầu.
- **Không trộn thang đo:** Chuẩn hóa mọi điểm về thang nội bộ thống nhất (ví dụ 0–100) rồi mới tính radar; giữ raw score và max score cho kiểm toán.
- **Tránh bài làm không đáng tin:** Submission có cờ đỏ, bị nghi gian lận hoặc chưa được người chấm xác nhận không nên được tính như bằng chứng chính thức; có thể hiển thị riêng là kết quả tạm thời.

**Dữ liệu mục tiêu:** `assessment_attempts/submissions`, `competency_evidence`, `competency_snapshots`, `competency_domain_scores`, `competency_skill_scores`, `framework_version_id`, nguồn score và `confidence/review_status`.

### LRN-FLOW-03 — Lộ trình học tập AI

1. Lấy hồ sơ năng lực và bằng chứng đã được chấp nhận.
2. Tính skill gaps theo quy tắc rõ ràng; AI giải thích và ưu tiên, không tự tạo điểm nền thiếu căn cứ.
3. Ghép skill gap với `learning_modules` đã được quản trị và phát hành; mỗi module có competency mapping, mục tiêu học và nội dung.
4. AI đề xuất lộ trình, nhưng output phải tham chiếu `moduleId` tồn tại; không hiển thị một module không có trong kho.
5. Người học bắt đầu, tiếp tục, hoàn thành từng module; tiến độ được lưu server.
6. Khi hoàn thành, hệ thống cập nhật tiến độ và ledger điểm một lần duy nhất.
7. Sau khi học, gợi ý đánh giá lại kỹ năng tương ứng.
8. Khi có bằng chứng mới, tạo snapshot radar mới và so sánh với baseline.

**Trạng thái UI cần tách:** Chưa bắt đầu · Đang học · Hoàn thành · Đề xuất bởi AI · Không còn phù hợp/đã thay thế.  
**Không được làm:** AI tự tạo điểm tích lũy; tạo module giả; đánh dấu hoàn thành chỉ bằng cách gửi `moduleId` mà không có quy tắc hoàn thành; dùng điểm một bài làm thay cho toàn hồ sơ.

---

# PHẦN C — USE CASE DASHBOARD NGƯỜI ĐÁNH GIÁ

## 6. Vai trò và phạm vi Người đánh giá

Người đánh giá chịu trách nhiệm tạo và tổ chức hoạt động đánh giá trong phạm vi quyền của mình. Họ có thể là giảng viên, chuyên gia độc lập hoặc nhân sự của tổ chức. Một dashboard là đủ, nhưng phải có **workspace context** riêng: `Cá nhân` hoặc tên tổ chức hiện tại.

## 6.1. Danh mục use case Người đánh giá

| ID | Use case | Mục tiêu / luồng chính | Hiện trạng và điểm cần xác minh |
|---|---|---|---|
| EVA-01 | Xem Dashboard tổng quan | Xem bài nộp chờ chấm, ca thi mở, nhóm/lớp, đề sẵn sàng và tác vụ cần xử lý. | Có page đọc submissions/rooms/classes; cần xác minh mọi số liệu và scope theo user/org. |
| EVA-02 | Tạo đề mới | Mở Assessment Studio, nhập thông tin chung, chọn năng lực, cấu trúc câu và cấu hình thi. | Có `AssessmentStudio`. Không được dùng endpoint Admin cho quyền Evaluator nếu không kiểm role/ownership. |
| EVA-03 | Lưu nháp đề riêng | Lưu title, description, framework, câu hỏi, rubric và cấu hình; quay lại chỉnh sửa. | Có UI/API nhưng cần bảo đảm `created_by`, owner scope và lưu câu hỏi hoàn chỉnh. |
| EVA-04 | Sửa đề đã tạo | Mở đề, xem version, chỉnh câu hỏi/cấu hình và bảo toàn lịch sử các lần làm. | Có route/detail/Studio; cần versioning khi đề đã có submission. |
| EVA-05 | Nhân bản đề | Tạo đề mới độc lập từ đề có quyền sử dụng; câu hỏi và rubric được sao chép hợp lệ. | Có action một số nơi; cần transaction và xác minh quyền nguồn. |
| EVA-06 | Xóa/ẩn đề riêng | Xóa khi chưa có lịch sử; nếu đã có bài làm thì chuyển archived/unpublished theo chính sách. | Có delete ở list, API admin xóa mềm nếu có submission; quyền ownership và lịch sử cần sửa. |
| EVA-07 | Giao đề cho lớp | Chọn class/group, deadline và chính sách làm bài; tạo assignment và thông báo cho học viên. | Có API `classes/[id]/assign`; cần kiểm quyền truy cập đề và assignment duplicate. |
| EVA-08 | Chuẩn bị phòng Live từ đề | Chọn đề đủ điều kiện, tạo phiên thi, PIN/link/QR, chế độ `OPEN` hoặc nhóm. | Có page/API; hiện có gọi endpoint `/api/admin/assessments` ở UI Evaluator — ranh giới API cần chuẩn hóa. |
| EVA-09 | Quản lý danh sách đề | Tìm/lọc theo nháp/sẵn sàng/được giao; mở, sửa, nhân bản hoặc xóa đề có quyền. | Có page; thiếu hoặc cần hoàn thiện action rõ và trạng thái thật. |
| EVA-10 | Quản lý ngân hàng câu hỏi riêng | Tạo, sửa, duyệt câu hỏi cá nhân; phân loại theo loại, skill, domain, difficulty, tag và trạng thái. | Có page `item-bank`, nhưng schema hiện gắn `assessment_items` với `assessment_id`; cần mô hình bank item riêng. |
| EVA-11 | Nhập câu hỏi theo CSV | Tải mẫu, nhập file, parse, validate, xem preview và xác nhận import theo lô. | Có CSV helper/Studio import; cần parser kiểm đúng đáp án/rubric/miền năng lực, báo lỗi theo dòng và transaction. |
| EVA-12 | Gắn rubric cho câu hỏi thực hành | Khai báo tiêu chí, trọng số, mức đạt, điểm tối đa và mô tả quan sát được. | Có bảng rubrics/criteria/levels; cần kiểm tổng trọng số và tương thích điểm với câu hỏi. |
| EVA-13 | Tạo/quản lý nhóm lớp | Tạo class, sửa tên/mô tả, mã nhóm, archive/xóa theo policy. | Có APIs/classes. Cần kiểm owner và việc xóa lớp có assignment/assessment history. |
| EVA-14 | Quản lý thành viên lớp | Mời/thêm/xóa học viên, xem trạng thái tham gia và quyền. | Schema/route class members có phần nền; cần xác định đầy đủ API lifecycle và kiểm quyền. |
| EVA-15 | Xem không gian lớp | Xem thành viên, assignment, bài đăng, tin nhắn, file và lịch sử lớp. | Có shared APIs/posts/replies/messages/files; phải xác minh policy member scope. |
| EVA-16 | Quản lý ca thi đang mở | Theo dõi PIN, participant count, thời lượng, trạng thái và thao tác mở control. | Có page polling; cần lọc trạng thái/ca lịch sử và giảm phòng rác. |
| EVA-17 | Bắt đầu ca thi | Chỉ bắt đầu khi ca sẵn sàng, đề hợp lệ, có thí sinh (theo policy) và giám thị có quyền. | API có check participant count > 0 và cập nhật `scheduled_start`; cần trạng thái transition có kiểm soát. |
| EVA-18 | Khóa/mở nhận người vào phòng | Cưỡng chế khóa ở server, không cho join mới; không đá thí sinh đang thi nếu chưa có quy tắc. | UI hiện chỉ `setIsLocked`; chưa lưu server nên chưa hoạt động thật. |
| EVA-19 | Giám sát thí sinh | Xem người dự thi, trạng thái online/offline, vào/rời phòng, nộp bài, vi phạm tab/fullscreen và hành động xử lý. | Control page hiển thị roster/polling; event-based proctoring chưa đầy đủ. |
| EVA-20 | Kết thúc ca thi | Kết thúc phòng ở server, ngăn join mới, chốt bài/các submission pending và lưu thời gian kết thúc. | API có `END`; cần xử lý rõ người chưa nộp và đồng bộ status của participant. |
| EVA-21 | Xem hàng đợi bài cần chấm | Tải danh sách submissions được giao/thuộc lớp mình, lọc theo status/đề/học viên. | Có API/page grading; kiểm scope và trạng thái chưa chấm/chờ AI. |
| EVA-22 | Chấm thủ công theo Rubric | Chọn mức cho từng criterion, nhập nhận xét, lưu điểm, người chấm và thời gian. | Có API `/api/evaluator/grade`; cần kiểm score ≤ max, owner/assignment và audit. |
| EVA-23 | Kích hoạt AI hỗ trợ chấm | Gửi câu trả lời và rubric đã chuẩn hóa; nhận điểm gợi ý, bằng chứng, giải thích và cờ tin cậy. | Có endpoint/adapter; kiểm ownership chưa đủ trong đoạn đã rà soát. Frontend grading có fallback mô phỏng khi lỗi — phải bỏ khỏi production. |
| EVA-24 | Xử lý cờ Tin cậy AI | Green: có thể kiểm tra mẫu; Amber: yêu cầu xem xét; Red: bắt buộc người có thẩm quyền chấm lại trước khi chốt. | Có cờ `GREEN/AMBER/RED` ở schema/adapter; luồng hàng đợi/phê duyệt và ngưỡng thống nhất chưa hoàn chỉnh. |
| EVA-25 | Chốt kết quả cuối | Chấp nhận/chỉnh sửa gợi ý AI, lưu manual score, ghi người chốt và lý do thay đổi. | Có manual grading; cần tách `AI_SUGGESTED`, `HUMAN_REVIEW_REQUIRED`, `FINALIZED`. |
| EVA-26 | Xem radar/báo cáo lớp | Xem điểm, tỷ lệ đạt, phân bố điểm và năng lực lớp theo miền/kỹ năng. | Có analytics API; cần xác minh không trộn dữ liệu các lớp ngoài scope và có framework version. |
| EVA-27 | Xuất báo cáo | Lọc đề/lớp/thời gian và xuất CSV/JSON hoặc định dạng hỗ trợ nghiên cứu. | Có analytics/export; phải hạn chế PII, ghi audit khi xuất và kiểm quyền. |
| EVA-28 | Quản lý hồ sơ chuyên môn | Cập nhật profile, specialization và tài liệu chứng minh năng lực chuyên gia. | Có page/profile; việc submit/xác minh hồ sơ nằm ở luồng Admin evaluator review. |
| EVA-29 | Cấu hình thông báo và mẫu nhận xét | Lưu preference và preset comment để hỗ trợ thao tác. | Có UI; cần xác minh persistence server. |
| EVA-30 | Xem gói/hạn mức | Xem quota AI, lớp/participant, live rooms và quyền export còn lại. | Có billing page nhưng số liệu mặc định/mock. Phải lấy từ entitlement/usage thật. |
| EVA-31 | Chuyển workspace Cá nhân/Tổ chức | Chọn organization context, xem đúng đề/lớp/usage và thao tác theo org role. | **Chưa thấy** luồng workspace đủ trong repo; là nhu cầu B2B quan trọng. |
| EVA-32 | Gửi đề xin phát hành công khai | Gửi một đề đã kiểm định nội bộ để Admin duyệt; xem phản hồi và sửa theo yêu cầu. | **Chưa thấy** quy trình server-side đầy đủ cho đề do Evaluator tạo. Không cho Evaluator tự công khai toàn hệ thống. |

## 6.2. Luồng chấm bài chuyên nghiệp

### EVA-FLOW-01 — Chấm bài bằng người hoặc AI

1. Evaluator mở hàng đợi bài nộp có quyền xem.
2. Chọn một bài; máy chủ kiểm `submission`, owner/assignment, class/org membership và quyền chấm.
3. Nếu chọn chấm tay: hiển thị Rubric có điểm tối đa, trọng số và mô tả rõ; validator ngăn điểm ngoài phạm vi.
4. Nếu chọn AI: hiển thị trước tác vụ, mức sử dụng/quota và thông tin dữ liệu gửi đi; gọi Gateway sau khi người dùng bấm.
5. Gateway khử PII theo chính sách, gọi provider, ghi model, latency, token, status/cost và validate JSON.
6. Kết quả AI được lưu thành **gợi ý**, không tự động trở thành điểm cuối cùng trừ khi policy cho phép và độ tin cậy hợp lệ.
7. `GREEN`: có thể theo quy trình chấm nhanh được cấu hình; `AMBER`: reviewer xác nhận; `RED`: bắt buộc người chấm có thẩm quyền xem lại.
8. Người đánh giá chấp nhận/chỉnh điểm, nêu lý do khi khác biệt lớn, rồi finalize.
9. Cập nhật submission/radar/feedback sau cùng; ghi audit và không cộng lại điểm thưởng do việc chấm lại.

**Điểm cần sửa:** API AI chấm cần kiểm người dùng được quyền truy cập submission và item; không chỉ kiểm họ đã đăng nhập. Evaluator không được gửi tùy ý `submissionId` của người khác.

### EVA-FLOW-02 — Tạo đề và sử dụng đề riêng

1. Mở Studio, chọn workspace cá nhân/tổ chức.
2. Nhập metadata đề, competency mapping, loại câu, scoring rubric, thời gian và điều kiện thi.
3. Chọn câu từ ngân hàng hoặc tạo mới; câu được copy/compose trong đề không làm thay đổi bank source.
4. Xem preview và chạy kiểm định tự động.
5. Lưu `DRAFT`.
6. Khi muốn tổ chức, chuyển thành `READY_INTERNAL`, giao lớp hoặc tạo live session; **không** tự động đổi thành `SYSTEM_PUBLIC`.
7. Nếu muốn công khai, gửi yêu cầu Admin review.
8. Sau khi có submission, thay đổi quan trọng tạo phiên bản mới; lịch sử bài cũ tiếp tục tham chiếu phiên bản đã làm.

---

# PHẦN D — USE CASE DASHBOARD ADMIN

## 7. Vai trò Admin nền tảng

Admin phải điều hành toàn bộ nền tảng: định danh và tổ chức, nội dung khảo thí chuẩn, chất lượng chuyên gia, AI Gateway, dịch vụ thương mại, vận hành live rooms, bảo mật và báo cáo. Admin dashboard không chỉ là trang KPI; phải có các hàng đợi và công cụ đi tới xử lý trực tiếp.

## 7.1. Danh mục use case Admin

| ID | Use case | Mục tiêu / luồng chính | Hiện trạng và điểm cần xác minh |
|---|---|---|---|
| ADM-01 | Xem tổng quan hệ thống | Xem số liệu real-time/periodic: người dùng, tổ chức, đề phát hành, submissions, certs, AI usage, doanh thu/chi phí và cảnh báo. | Có dashboard với một số count thực. Chưa có finance analytics đủ; cần tránh KPI hardcode. |
| ADM-02 | Quản lý người dùng | Tìm user, xem role/status, suspend/reactivate, khóa phiên, xử lý yêu cầu hỗ trợ. | Có page/API. `PATCH` sửa role cần rà soát vì vai trò được thiết kế bất biến; không để Admin endpoint bị gọi bởi non-admin. |
| ADM-03 | Xác minh/chấp thuận Evaluator | Xem hồ sơ, chứng chỉ và thông tin tổ chức; duyệt/từ chối, yêu cầu bổ sung, ghi người duyệt và lý do. | Có page/API/evaluator_profiles; cần workflow trạng thái và audit. |
| ADM-04 | Tạo và quản lý tổ chức | Tạo hồ sơ pháp nhân, slug, loại tổ chức, trạng thái, giới hạn và cấu hình hợp đồng. | Có page/API; API hiện có ánh xạ quota/contract về giá trị mặc định, không phản ánh số liệu thực. |
| ADM-05 | Gán quản trị viên tổ chức | Mời/gắn người làm ORG_ADMIN, gửi link kích hoạt, theo dõi chấp nhận và quản lý membership. | **Chưa thấy** workflow hoàn chỉnh; cần nối `organizations` và `user_organizations`. |
| ADM-06 | Quản lý thành viên và quota tổ chức | Xem số thành viên, license, AI usage, số lớp/phòng, hạn hợp đồng; cập nhật hạn mức có audit. | Có vài trường trong DB/UI nhưng số thành viên/usage có giá trị giả lập. |
| ADM-07 | Quản lý khung năng lực và phiên bản | Tạo draft framework, chỉnh domain/skill/indicator/weight, validate, publish version và archive version cũ. | Có page/schema động; cần version immutable và giữ mapping lịch sử submission. |
| ADM-08 | Quản lý ngân hàng câu hỏi chuẩn | Tạo/sửa/duyệt câu hỏi hệ thống, rubric, mapping, license/source, version và trạng thái. | Trang Admin nội dung có câu hỏi/đề; schema tách bank item chưa được chứng minh. |
| ADM-09 | Soạn đề chuẩn hệ thống | Tạo đề, preview, validation, lưu draft, gán loại/miền/quyền sử dụng và xuất bản. | Có `AssessmentStudio`; quyền dùng endpoint Admin phải được khóa server-side. |
| ADM-10 | Import/kiểm định đề | Import CSV/Excel, xem lỗi và preview, phát hiện câu trùng/thiếu đáp án/sai rubric, xác nhận import. | Có import helper/API; cần transaction, rollback và test đủ format. |
| ADM-11 | Công khai/ẩn/thu hồi đề hệ thống | Chuyển qua review, phát hành, unpublish hoặc retire; giữ lịch sử bài làm. | Có `is_published` toggle/API; boolean đơn chưa đủ cho vòng đời đầy đủ và audit. |
| ADM-12 | Duyệt đề cộng đồng | Xem queue, kiểm nội dung, đáp án, rubric, nguồn/bản quyền; approve/reject/revision; phản hồi cho contributor. | Có UI nhưng dùng `localStorage` — cần server workflow. |
| ADM-13 | Điều phối chính sách nội dung | Thiết lập mức chuẩn, rubric, chính sách chứng chỉ, đề VIP và điều kiện publication. | Một phần trong pages; cần rules engine/policy rõ, tránh cùng field mang nhiều ý nghĩa. |
| ADM-14 | Cấu hình AI Gateway | Chọn provider/model cho từng flow, bật/tắt task, cấu hình timeout và kiểm tra kết nối. | Có page/API/adapter. Cần tách secret config khỏi response, lưu persistent an toàn và audit mỗi lần đổi. |
| ADM-15 | Quản lý khóa API/secret | Lưu secrets server-side, mask khi hiển thị, rotate key, kiểm tra quyền, không trả plaintext về client/log. | Cần xác minh `AIConfigService` persistence và cách lưu secret; tuyệt đối không lưu qua local storage. |
| ADM-16 | Theo dõi sử dụng AI | Xem lượt gọi theo model/flow/user/org, success/failure, latency, token, retry và quota. | Có bảng `ai_evaluations` với token columns nhưng API không ghi token ở luồng đã rà soát; dashboard usage chưa đủ. |
| ADM-17 | Phân tích chi phí AI | Tính chi phí theo provider/model/đơn giá áp dụng tại thời điểm gọi; phân bổ theo org/gói/flow; cảnh báo vượt ngân sách. | **Chưa thấy** ledger usage/cost và trang phân tích hoàn chỉnh. Không lấy count request làm chi phí thực. |
| ADM-18 | Quản lý gói dịch vụ | Cấu hình product plan, giá tháng/năm, quota, feature flags và hiệu lực theo thời điểm. | Có page UI nhưng state local là nguồn thay đổi; cần bảng plans/versions và API Admin được bảo vệ. |
| ADM-19 | Quản lý đơn hàng/giao dịch | Tìm đơn, xem trạng thái thanh toán, đối soát provider, xử lý lỗi, gia hạn và hoàn tiền. | **Chưa thấy** model/API đủ trong repo hiện tại. |
| ADM-20 | Cấp và thu hồi quyền lợi | Sau khi payment/contract xác nhận, cấp entitlement; khi hết hạn/hoàn tiền, thu hồi đúng tính năng. | **Chưa thấy** entitlement engine end-to-end. VIP không được dựa duy nhất vào khóa ở UI. |
| ADM-21 | Quản lý chứng chỉ | Tra cứu, kiểm tra tính hợp lệ, thu hồi/khôi phục theo chính sách, lý do và audit. | Schema có `is_revoked`, `revoked_reason`; UI Admin quản lý chứng chỉ chưa thấy trong sidebar. |
| ADM-22 | Theo dõi toàn bộ phòng thi | Xem phòng đang chờ/đang thi/kết thúc, tổ chức phụ trách, số thí sinh, sự cố và khả năng khóa phiên khi có căn cứ. | Chưa thấy trang vận hành live toàn hệ thống trong Admin. |
| ADM-23 | Analytics toàn hệ thống | Xem funnel đăng ký → kích hoạt → làm bài → hoàn thành → nâng cấp; retention, quality, usage và sự cố. | Chưa thấy module riêng; cần tách khỏi analytics của Evaluator. |
| ADM-24 | Analytics doanh thu | Xem gross/net revenue, MRR/ARR nếu mô hình phù hợp, đơn mới, gia hạn, churn và hoàn tiền. | **Chưa thấy** data model/payment integration đủ để tính. |
| ADM-25 | Audit log hành động nhạy cảm | Ghi ai làm gì, trên resource nào, trước/sau, lý do, thời gian, request id và nguồn. | Trang compliance đọc `consent_logs`; đây không thay thế audit log hoạt động. |
| ADM-26 | Quản lý consent/privacy | Tra cứu lịch sử đồng thuận, yêu cầu truy cập/chỉnh sửa/xóa dữ liệu và trạng thái xử lý. | Có consent logs; quy trình rights request chưa thấy đầy đủ. |
| ADM-27 | Cấu hình hệ thống | Đổi cấu hình platform, maintenance, đăng ký, timeout, bảo mật và email; lưu persistence có version. | UI settings có nhiều field state-local và `handleSave` chỉ đổi thông báo. Cần persistence thật. |
| ADM-28 | Theo dõi sức khỏe dịch vụ | Kiểm tra Supabase/storage/Redis/AI provider/email, lỗi gần đây, latency và thông báo sự cố. | AI connection test có; health console toàn hệ thống chưa thấy. |
| ADM-29 | Quản lý tài khoản/quyền đặc biệt | Cấp Admin an toàn qua whitelist/DB policy, thu hồi quyền và ghi audit. | Middleware có email whitelist superadmin; cần quy trình rotation và chống role escalation. |
| ADM-30 | Phát hiện lạm dụng/gian lận điểm | Phát hiện điểm tăng bất thường, giao dịch AI bất thường, đăng nhập/trùng tài khoản, thao tác bất thường; đưa vào review queue. | Chưa thấy module fraud/risk review. Cần có trước khi dựa vào điểm để cấp chứng chỉ/quyền lợi. |

## 7.2. Dashboard Admin nên điều phối việc gì?

Trang tổng quan nên có ba lớp:

1. **Chỉ số có định nghĩa rõ:** user active theo khoảng thời gian, tổ chức active, đề đã public, submissions, tỷ lệ đạt, lượt AI, chi phí có dữ liệu đầy đủ và số giao dịch đã xác nhận.
2. **Queue cần xử lý:** hồ sơ Evaluator chờ duyệt, đề cộng đồng chờ duyệt, giao dịch lỗi/chờ đối soát, phòng Live gặp sự cố, tổ chức gần hết hạn và AI quota gần cạn.
3. **Xu hướng/kiểm toán:** tăng trưởng, funnel, chất lượng chấm, chi phí AI theo model và audit events.

Không hiển thị chỉ số chưa tính được. Nếu số liệu không đủ, ghi “Chưa có dữ liệu” thay vì gán số giả hoặc đưa một con số mặc định.

## 7.3. Luồng Admin duyệt nội dung cộng đồng

1. Learner/Evaluator gửi nội dung lên server và nhận mã hồ sơ đóng góp.
2. Server lưu trạng thái `SUBMITTED`, version, tác giả, tài liệu nguồn, quyền sử dụng và timestamp.
3. Admin mở queue, xem chi tiết và chạy kiểm tra định dạng/đáp án/rubric/miền năng lực/trùng lặp.
4. Admin chọn `APPROVED`, `REVISION_REQUIRED` hoặc `REJECTED`, ghi lý do và gửi thông báo.
5. `APPROVED` chưa mặc định đồng nghĩa `SYSTEM_PUBLIC` hoặc “được bán”. Nội dung phải qua bước phát hành riêng và có điều kiện quyền sử dụng/bản quyền.
6. Nếu phát hành, tạo bank item/assessment version chính thức; giữ liên kết nguồn gốc contributor.

---

# PHẦN E — USE CASE CHUNG VÀ LUỒNG NGHIỆP VỤ XUYÊN DASHBOARD

## 8. Các use case liên thông

| ID | Luồng | Các vai trò | Tình trạng/đề xuất |
|---|---|---|---|
| SYS-01 | Tạo đề chuẩn → phát hành → người học làm | Admin → Learner | Có các thành phần; cần versioning, quyền access và bảo vệ đáp án. |
| SYS-02 | Người đánh giá tạo đề → giao lớp | Evaluator → Learner | Có components; cần scope owner/org và không public tự động. |
| SYS-03 | Nộp đề cộng đồng → duyệt → phát hành | Learner/Evaluator → Admin → Learner | UI có nhưng localStorage; cần DB workflow. |
| SYS-04 | Nộp bài → chấm khách quan → kết quả | Learner → server | Có API; cần idempotency/transaction/anti-farming. |
| SYS-05 | Bài tự luận → AI gợi ý → người chấm chốt | Learner → AI → Evaluator | Một phần; cần owner auth, AI usage log, confidence queue và finalization. |
| SYS-06 | Kết quả → snapshot radar → gap → học liệu | Learner/AI | Thành phần hiện có; cần history aggregation và module mapping. |
| SYS-07 | Hoàn thành học liệu → điểm → leaderboard | Learner → ledger/Redis | Có components nhưng direct points update; cần ledger/idempotency. |
| SYS-08 | Giao dịch → entitlement → mở đề/tính năng | Learner/Evaluator/Payment → system | Chưa thấy end-to-end; ưu tiên trước thương mại hóa. |
| SYS-09 | Tạo organization → mời thành viên → làm khảo thí | Admin/ORG_ADMIN/Evaluator/Learner | Mới một phần; cần membership/workspace/tenant isolation. |
| SYS-10 | Live room → người học vào → điều phối → kết thúc | Evaluator/Learner | Có components; khóa cửa/proctoring/group access thiếu. |
| SYS-11 | Chứng chỉ → QR verification → revoke | Learner/Admin/Khách | Có generator/verify/revocation fields; cần ownership, issue idempotency và Admin controls. |
| SYS-12 | Sử dụng AI → ghi token/chi phí → cảnh báo quota | AI Gateway/Admin/Organization | Chưa đủ hạch toán; cần usage ledger và price catalog theo version. |
| SYS-13 | User action → audit log → Compliance | Tất cả vai trò/Admin | `consent_logs` không đủ; cần audit log riêng có actor/resource/action. |

---

## 9. Điểm bài thi và điểm tích lũy — Use Case quan trọng

### 9.1. Phải tách ít nhất ba thang đo

1. **Điểm bài thi (`assessment score`):** Điểm người học đạt theo câu hỏi và Rubric của đề. Có `earned_score`, `max_score`, `percentage` và `is_passed`.
2. **Điểm năng lực (`competency score`):** Chỉ số chuẩn hóa về 5 miền và kỹ năng con, không phải điểm tích lũy. Dùng cho radar và phát triển năng lực.
3. **Điểm tích lũy (`reward points`):** Điểm thưởng theo sự kiện hợp lệ, dùng cho gamification/rank hoặc điều kiện hệ thống nếu policy nói rõ. Không được tùy ý tăng bởi Evaluator.

Điểm dùng để **cấp chứng chỉ năng lực** phải dựa trên điều kiện của chương trình/chứng chỉ (ví dụ kỳ thi chứng nhận, đạt ngưỡng, đủ minh chứng và không bị hold), không nên chỉ dựa vào tổng điểm gamification. Nếu sản phẩm vẫn dùng 450 reward points làm một điều kiện, phải có điều kiện chống gian lận và không biến 450 điểm thành bằng chứng năng lực duy nhất.

### 9.2. Hiện trạng nhìn thấy

- API submit đang chuyển điểm bài về thang 10 để quyết định đạt ở ngưỡng 7.0, nhưng `passing_score` trong DB có giá trị phần trăm và response có thể đang trả giá trị cố định `7.0`. Cần thống nhất toàn hệ thống chỉ dùng một đơn vị nguồn (khuyến nghị `passing_score_percent` theo 0–100) và chỉ quy đổi khi hiển thị.
- API submit cộng `+10` điểm tích lũy khi đạt lần đầu của một đề.
- API hoàn thành module học tập dùng `point_reward` mặc định `30`.
- Tổng điểm được cập nhật bằng đọc `profiles.points`, cộng vào rồi `update`; nếu hai request chạy đồng thời có thể xảy ra race condition.
- Admin page/API hiện có những trường và cách thao tác khiến role hoặc điểm có nguy cơ bị can thiệp nếu không khóa quyền chặt.

### 9.3. Quy tắc mục tiêu

- Evaluator chỉ được chấm **điểm bài** trong Rubric của submission mình được giao. Họ không được sửa `reward_points`, `rank_tier`, điểm tổng tích lũy hay tự tạo sự kiện thưởng.
- Admin cũng không nên sửa trực tiếp số tổng tích lũy thông thường. Khi cần điều chỉnh vì khiếu nại/khôi phục, phải tạo giao dịch ledger loại `ADMIN_ADJUSTMENT` có người thực hiện, lý do, giá trị trước/sau và audit log; có thể yêu cầu duyệt kép.
- Điểm được cấp từ các sự kiện server-side hợp lệ: `ASSESSMENT_FIRST_PASS`, `LEARNING_MODULE_COMPLETED`, `VERIFIED_CONTRIBUTION`… Mỗi sự kiện có khóa idempotency/unique key để không cộng lặp.
- Không trao điểm cho việc mở trang, bắt đầu bài, nộp trắng hoặc tự tạo đề mà không được duyệt.
- Chỉ cộng điểm sau khi server xác nhận sự kiện; client không được gửi số điểm cần cộng.
- Với đề lặp lại, policy phải rõ là chỉ thưởng lần đạt đầu tiên trên phiên bản/bộ chứng nhận, hay có giới hạn định kỳ. Không dùng kiểm tra “có bài đạt trước chưa” rời rạc nếu không có transaction/unique constraint.
- Nếu một submission bị đánh dấu nghi gian lận hoặc score bị khiếu nại, điểm thưởng có thể ở trạng thái `PENDING` hoặc `ON_HOLD`, không cộng vào leaderboard cho tới khi giải quyết.

### 9.4. Các Use Case điểm cần thêm

| ID | Use case | Quy tắc |
|---|---|---|
| PTS-01 | Cộng điểm khi lần đầu đạt bài hợp lệ | Server quyết định theo policy, idempotency key duy nhất, có event record. |
| PTS-02 | Cộng điểm hoàn thành học liệu | Chỉ lần hoàn thành hợp lệ; lưu tiến độ và ledger cùng transaction. |
| PTS-03 | Cộng điểm đóng góp | Chỉ sau khi nội dung được duyệt và policy thưởng quy định; không thưởng khi gửi nháp. |
| PTS-04 | Đảo/thu hồi điểm do gian lận | Tạo reversal event liên kết event gốc; không xóa lịch sử. |
| PTS-05 | Điều chỉnh thủ công ngoại lệ | Quyền hạn cao, lý do bắt buộc, audit log và phê duyệt nếu vượt ngưỡng. |
| PTS-06 | Tính rank/leaderboard | Tổng hợp từ ledger; chỉ `LEARNER` đủ điều kiện; có xử lý cache invalidation. |
| PTS-07 | Quyết định đủ điều kiện chứng chỉ | Kiểm tra loại chứng chỉ, kỳ thi, ngưỡng, trạng thái chấm, fraud hold và eligibility; không chỉ nhìn reward total. |
| PTS-08 | Chống farm qua nhiều role/tài khoản | Reward event không cấp điểm cho EVALUATOR role; phát hiện cụm tài khoản, đề tự tạo/đánh giá lẫn nhau, pattern bất thường; không kết luận gian lận chỉ dựa trên một tín hiệu. |

### 9.5. Mô hình dữ liệu nên có cho điểm

Bổ sung bảng `reward_ledger` (append-only), ví dụ:

- `id`, `user_id`, `event_type`, `points_delta`, `source_type`, `source_id`, `idempotency_key`, `status`, `created_at`, `created_by`, `reason`, `reversal_of_id`.
- Unique constraint cho `idempotency_key`/event source để không cộng lặp.
- `profiles.points` có thể giữ làm cache tổng nhưng phải được tính/đồng bộ từ ledger, không làm nguồn sự thật.
- Trigger/RPC/transaction dùng server-side để ghi ledger và update cache an toàn.
- `EVALUATOR` không có INSERT/UPDATE/DELETE quyền trên reward ledger; các API chấm điểm không nhận `points_delta` từ client.

---

## 10. AI Use Cases — Người học, Người đánh giá và Admin

### 10.1. Các chế độ AI đang được định hướng trong repo

| AI flow | Người dùng | Input | Output | Cơ chế kích hoạt và điều kiện |
|---|---|---|---|---|
| AI-01 — Chấm Rubric | Learner/Evaluator theo policy | Prompt câu hỏi, câu trả lời, minh chứng được phép và rubric | Điểm theo tiêu chí, trích dẫn bằng chứng, feedback, confidence score/flag | On-demand; không tự gọi AI trong endpoint nộp bài khách quan. Kiểm quota, owner, PII và usage log. |
| AI-02 — Phân tích hồ sơ năng lực | Learner | Lịch sử bài, điểm theo miền/kỹ năng, kết quả hợp lệ, framework version | Radar snapshot, strengths/weaknesses, feedback | On-demand hoặc khi người học yêu cầu; cần chống phân tích lặp không cần thiết và lưu lịch sử. |
| AI-03 — Phát hiện gap | Learner/Evaluator hỗ trợ đọc kết quả | Dữ liệu skill/domain có bằng chứng | Danh sách kỹ năng cần cải thiện, mức gap, tác động và nguồn bằng chứng | Nên tách số liệu tính toán deterministically khỏi phần diễn giải AI. |
| AI-04 — Phản hồi học tập | Learner | Kết quả và gap đã xác nhận | Giải thích dễ hiểu, khuyến nghị bước tiếp theo | Phải bám kết quả, tránh tạo khẳng định không có trong dữ liệu. |
| AI-05 — Lộ trình học | Learner | Gap + catalog module hợp lệ + mục tiêu người học | Các bước học gắn module thật, mục tiêu và tiến độ | Output phải tham chiếu ID module tồn tại; người học có thể bỏ qua/điều chỉnh. |
| AI-06 — Hỗ trợ tạo câu hỏi/đề | Evaluator/Admin (đề xuất) | Miền/kỹ năng, độ khó, loại câu, mục tiêu | Bản nháp câu hỏi, distractors, lời giải và mapping gợi ý | Chỉ tạo draft; không auto publish; bắt buộc kiểm định đáp án, rubric, bản quyền và chất lượng. Hiện trạng chưa đủ bằng chứng cho một flow hoàn chỉnh. |
| AI-07 — Hỗ trợ moderator/kiểm định nội dung | Admin (đề xuất) | Nội dung đóng góp, rubric, nguồn và policy | Cờ cảnh báo trùng lặp/thiếu đáp án/nội dung không phù hợp | Chỉ là trợ lý kiểm định, quyết định cuối do người có thẩm quyền. Chưa thấy flow đầy đủ. |
| AI-08 — Hỗ trợ phân tích lớp | Evaluator (đề xuất) | Báo cáo đã tổng hợp, dữ liệu được phép xem | Phân tích xu hướng lớp, gợi ý can thiệp | Không gửi PII không cần thiết; phải giới hạn theo class/org. Chưa thấy flow chuyên biệt. |
| AI-09 — Giám sát chi phí và sức khỏe | Admin | Provider logs, latency, token, lỗi và bảng giá | Cost dashboard, anomaly alerts, budget/quota alerts | Chưa đủ usage ledger và đơn giá trong repo. |

### 10.2. Kiến trúc AI mục tiêu

`UI action → API authentication/authorization → eligibility/quota check → data minimization + PII scrub → provider adapter → schema validation → result/usage persistence → response → audit/analytics`.

Quy tắc:

- UI không gọi nhà cung cấp AI trực tiếp.
- Không gửi toàn bộ hồ sơ cá nhân nếu chỉ cần điểm theo kỹ năng.
- Mỗi request có `request_id`, `flow`, `provider`, `model`, `started_at`, `completed_at`, `status`, latency, input/output token và cost nếu provider cung cấp.
- Lỗi provider không được thay thế bằng điểm giả hoặc confidence xanh giả. Trả lỗi và cho thử lại an toàn.
- AI chỉ trả **gợi ý** khi tác vụ chấm có ảnh hưởng tới điểm/chứng chỉ; phải lưu phiên bản model, prompt/policy version và trạng thái người duyệt.
- Output AI phải validate schema và các giới hạn nghiệp vụ: `score <= max_points`, tổng điểm khớp criteria, confidence trong phạm vi, các criterion ID đều thuộc rubric.
- Dùng idempotency để tránh double-click tạo hai bản chấm hoặc trừ hai quota.

---

## 11. Cờ Tin cậy AI và quản lý kết quả

Repo có model `confidenceScore`/`confidenceFlag` và các nhãn `GREEN`, `AMBER`, `RED`. Một số prompt trong adapter đưa ra ngưỡng khác nhau; tài liệu khác của dự án cũng từng nêu ngưỡng không đồng nhất. Đây phải là **một policy tập trung**, không lặp ngưỡng ở nhiều file.

### 11.1. Định nghĩa đề xuất

- **GREEN — Đủ điều kiện xem xét nhanh:** AI cho ra kết quả có cấu trúc hợp lệ, bằng chứng liên quan rõ, không phát hiện xung đột chính và confidence đạt ngưỡng được policy quy định. Vẫn phải có khả năng lấy mẫu audit. Green không có nghĩa “đúng tuyệt đối”.
- **AMBER — Cần kiểm tra:** Có nội dung mơ hồ, bằng chứng chưa đầy đủ, điểm sát ranh giới, khác biệt giữa các tín hiệu hoặc confidence trung bình. Bài vào hàng đợi review trước khi finalize nếu ảnh hưởng đến chứng chỉ.
- **RED — Bắt buộc người có thẩm quyền chấm lại:** Thiếu bằng chứng, output invalid, confidence thấp, nghi xung đột/không khớp rubric, có dấu hiệu prompt injection hoặc rủi ro tác động cao. Không tự động chốt điểm.

**Quan trọng:** `confidence` của mô hình là ước lượng nội bộ, không phải xác suất đã được hiệu chỉnh rằng điểm chấm đúng. Cờ gian lận là một khái niệm riêng; không nhập chung `confidence_flag` với `integrity_risk`.

### 11.2. Luồng cờ Tin cậy mục tiêu

1. AI trả kết quả.
2. Validator kiểm JSON, criterion ID, tổng điểm, max score và phạm vi dữ liệu.
3. Rules engine tính `confidence_flag` theo ngưỡng tập trung; đồng thời chấm các quality gates khác như có trích dẫn bằng chứng và dữ liệu có đủ hay không.
4. Tạo bản ghi `AI_SUGGESTED` và đưa vào hàng đợi phù hợp.
5. Green: review theo policy; Amber: bắt buộc reviewer xác nhận; Red: bắt buộc chấm tay/thẩm định lại.
6. Người đánh giá finalizes, có thể giữ hoặc sửa điểm; nếu sửa, lưu `original AI score`, `final score`, lý do và actor.
7. Chỉ kết quả final đủ điều kiện mới ảnh hưởng đến radar chính thức, chứng chỉ và điểm thưởng.
8. Admin theo dõi phân bố cờ, tỷ lệ sửa điểm, false positive/false negative, latency và chi phí.

### 11.3. Tách cờ AI khỏi cờ gian lận

Nên có hai trục riêng:

- `ai_confidence_flag`: GREEN / AMBER / RED — độ đáng tin/cần review của đầu ra AI.
- `integrity_risk_flag`: NONE / LOW / MEDIUM / HIGH — dấu hiệu bất thường trong hành vi thi.

Ví dụ: bài làm có AI confidence GREEN vẫn có thể có integrity risk HIGH nếu xảy ra hành vi đáng ngờ. Ngược lại, một bài không có vi phạm nhưng câu trả lời mơ hồ có thể có confidence RED. Không được dùng một cờ để suy ra cờ còn lại.

---

# PHẦN F — LIVE EXAM, PROCTORING VÀ TRUY CẬP ĐỀ THI THÔNG THƯỜNG

## 12. Use Case phòng thi trực tiếp

### 12.1. Danh mục use case Live

| ID | Use case | Actor | Yêu cầu mục tiêu | Hiện trạng |
|---|---|---|---|---|
| LIVE-01 | Tạo phòng thi | Evaluator | Chọn đề có quyền, title, room mode, thời gian/lịch, access policy; tạo PIN đủ entropy và unique. | Có API tạo phòng PIN. Cần retry collision an toàn, giới hạn số phòng và ownership. |
| LIVE-02 | Tạo link/QR | Evaluator | Sinh link đúng environment/domain, QR trỏ về route chính thức và không để lộ secret ngoài PIN. | Có QR URL; hostname fallback cần cấu hình theo `NEXT_PUBLIC_APP_URL`, tránh domain hardcode. |
| LIVE-03 | Join bằng PIN | Learner | Validate format, rate limit, room active, thời gian, seat/eligibility, group membership và exam access. | Có API; group membership/lock chưa đủ. |
| LIVE-04 | Chờ bắt đầu | Learner | Poll/realtime trạng thái phòng, hiện status và reconnect; chuyển vào đúng `assessmentId`. | Có page polling; cần xử lý ended/room switched/authorization. |
| LIVE-05 | Danh sách thí sinh | Evaluator | Hiển thị joined/online/offline/taking/submitted/disconnected và timestamp. | Có roster lấy từ participants; online heartbeat và reconnect semantics chưa thấy đủ. |
| LIVE-06 | Khóa nhận thí sinh | Evaluator | Server lưu `join_locked`; API join từ chối; UI cập nhật theo state từ server. | **Chưa hoạt động thật** theo code control page: chỉ local state. |
| LIVE-07 | Bắt đầu ca thi | Evaluator | Chuyển `WAITING→RUNNING` nếu hợp lệ, chốt startedAt, cập nhật participant và timer theo server. | Có `scheduled_start`; cần transition/atomic state guard. |
| LIVE-08 | Kết thúc ca thi | Evaluator | Chuyển `RUNNING→ENDED`, ngăn join, chốt trạng thái các bài còn lại theo policy. | Có `END`; participant/submission reconciliation cần hoàn thiện. |
| LIVE-09 | Pause/resume | Evaluator | Tạm dừng nếu được phép, đóng băng timer và ghi log sự kiện. | Chưa thấy API/state machine hoàn chỉnh. |
| LIVE-10 | Điều phối đề/nhóm | Evaluator | Room chỉ tham chiếu đề có quyền; GROUP_ONLY yêu cầu class/org membership hợp lệ. | `room_mode` có trong schema; enforcement phía join còn thiếu. |
| LIVE-11 | Giám sát chuyển tab | Server + Evaluator | Ghi event visibility change, thời điểm, số lần, thời lượng và policy response. | Chưa thấy event pipeline đầy đủ. Có thể quan sát visibility qua browser nhưng không chứng minh gian lận. |
| LIVE-12 | Giám sát fullscreen | Browser + Evaluator | Nhận biết thoát fullscreen và cảnh báo; không tuyên bố khóa toàn hệ điều hành. | Chưa thấy lưu event server-side hoàn chỉnh. |
| LIVE-13 | Cấm/cảnh báo copy-paste | Learner + evaluator policy | Có thể hạn chế một số thao tác DOM và ghi nhận event; nêu rõ giới hạn kỹ thuật. | Chưa thấy policy thực thi end-to-end. Đây không phải biện pháp bảo mật nội dung tuyệt đối. |
| LIVE-14 | Chụp ảnh màn hình | Learner/Evaluator policy | Trình duyệt web phổ thông không thể bảo đảm ngăn chụp màn hình/điện thoại. Dùng watermarks, logs và quy chế; nếu cần lockdown thực thì dùng môi trường kiosk chuyên dụng. | Không nên tuyên bố đã cấm chụp màn hình nếu không dùng môi trường kiểm soát. |
| LIVE-15 | Mất kết nối/khôi phục | Learner | Giữ answer server-side, reconnect cùng submission, tính thời gian theo policy và ghi gap. | Có polling/local draft; cần test offline/server recovery. |
| LIVE-16 | Phát hiện nhiều session/trùng đăng nhập | Server/Evaluator | Policy có thể giới hạn session; hiển thị cảnh báo có thể giải thích và audit. | Chưa thấy đầy đủ. |
| LIVE-17 | Xem và xử lý sự kiện vi phạm | Evaluator/Admin | Xem timeline sự kiện, phân loại, ghi nhận xét, cảnh báo hoặc đưa vào review. | Chưa thấy moderation case workflow. |
| LIVE-18 | Điều phối toàn hệ thống | Admin | Tìm kiếm tất cả room, lọc org/evaluator/status và xử lý sự cố với audit. | Chưa thấy Admin Live Ops page. |
| LIVE-19 | Xóa/đóng/lưu trữ phòng | Evaluator | Không xóa lịch sử khi đã thi; close/archive và chỉ hard-delete phòng rỗng thử nghiệm theo policy. | Có DELETE theo creator; cần bảo toàn audit/submission history. |
| LIVE-20 | Thống kê ca thi | Evaluator/Admin | Số tham gia, hoàn thành, thời gian, lỗi mạng, trạng thái chấm và integrity review. | Có count sơ bộ; cần analytics events. |

### 12.2. Giám sát cho bài thi thường và bài thi Live

Phải thiết kế một **Proctoring Policy** dùng chung, rồi mỗi đề/ca thi chọn một profile. Không tạo hai bộ logic rời nhau và không tuyên bố một cài đặt UI đã đủ bảo vệ bài thi.

Các mức đề xuất:

1. **Practice / Ôn luyện:** Không hạn chế tab; lưu tiến độ, có thể cho xem giải thích; không tạo integrity flag chỉ vì chuyển tab.
2. **Standard / Bài đánh giá thông thường:** Thông báo quy chế, ghi sự kiện visibility change nếu người dùng đồng ý/chính sách cho phép; lưu thời gian, autosave và giới hạn truy cập nội dung đề theo quyền.
3. **Supervised / Có giám sát:** Mã PIN/scheduled room, ghi join/leave, cảnh báo đổi tab/thoát fullscreen, theo dõi mất kết nối, giới hạn một submission đang hoạt động và bảng giám thị.
4. **High-stakes / Sát hạch chứng nhận:** Có review thủ công, xác minh danh tính phù hợp, quy tắc bắt buộc và retention policy minh bạch; nếu đòi lockdown thực tế cần môi trường/ứng dụng chuyên dụng, không chỉ browser JS.

### 12.3. Những gì web có thể và không thể đảm bảo

| Kiểm soát | Khả năng | Thiết kế khuyến nghị |
|---|---|---|
| Chặn nội dung đề nếu chưa có quyền | Có thể thực hiện ở server/API/RLS | Không chỉ ẩn route hoặc card. |
| Ẩn đáp án đúng trước khi nộp | Có thể làm được hoàn toàn ở API/schema | Tuyệt đối không trả `is_correct` hoặc trường tương đương. |
| Phát hiện đổi tab | Có thể nhận biết sự kiện `visibilitychange` trong tab hiện tại | Ghi event, timestamp; không kết luận tự động rằng gian lận đã xảy ra. |
| Phát hiện thoát fullscreen | Có thể nhận `fullscreenchange` | Cảnh báo và ghi event theo policy. |
| Chặn copy/paste | Có thể hạn chế một số thao tác UI | Dễ bị bypass; không phải bảo mật nội dung. |
| Chặn ảnh chụp màn hình/điện thoại | Không thể bảo đảm trong trình duyệt web bình thường | Không tuyên bố có chức năng chặn tuyệt đối; xem xét kiosk/secure browser nếu cần. |
| Chặn truy vấn API trái quyền | Có thể và bắt buộc | Server auth, authorization, RLS, rate limit, audit. |
| Chống nhiều tài khoản/đổi thiết bị | Chỉ phát hiện được tín hiệu/rủi ro, không thể chắc chắn danh tính chỉ bằng browser | Risk scoring, xác minh phù hợp, manual review, quy trình khiếu nại. |

### 12.4. Mô hình dữ liệu Live/Proctoring đề xuất

- `exam_sessions`: assessment version, owner/org, status, scheduled start/end, server started/ended time, join lock, room mode, policy id.
- `exam_participants`: session, user, status, first joined, last heartbeat, started, submitted, reconnect count.
- `proctoring_events`: participant/session, event type, timestamp server, metadata đã lọc PII, severity, policy version.
- `integrity_cases`: trạng thái review, reviewer, lý do, kết luận, evidence refs, appeal status.
- `proctoring_policies`: policy mode, event rules, thresholds, response actions và version.

---

# PHẦN G — NGÂN HÀNG CÂU HỎI, ĐỀ THI VÀ VÒNG ĐỜI NỘI DUNG

## 13. Use Case nội dung khảo thí

### 13.1. Không đồng nhất các khái niệm

- **Bank Item:** Câu hỏi gốc, có owner, source/license, version, review status và mapping competency.
- **Assessment Item:** Câu hỏi được chọn vào một phiên bản đề, có order/points/config riêng và tham chiếu phiên bản bank item (nếu có).
- **Assessment:** Đề/blueprint có tên, mục tiêu, framework version, quy chế, điểm đạt, thời gian, access scope và status.
- **Assessment Version:** Bản bất biến của đề được thí sinh làm; thay đổi sau phát hành tạo version mới.
- **Assessment Attempt/Submission:** Một lượt làm của người học; gắn user, assessment version, answer, scores và status.
- **Community Contribution:** Hồ sơ đề/câu hỏi do cộng đồng gửi để xét duyệt; chưa phải bank item đã được tin cậy.

### 13.2. Use case hệ thống cần hỗ trợ

| ID | Use case | Actor | Kết quả cần lưu |
|---|---|---|---|
| CNT-01 | Tạo câu hỏi trong bank | Admin/Evaluator trong scope | Prompt, type, options, key, explanation, skill, domain, difficulty, tag, source/license, version. |
| CNT-02 | Sửa câu hỏi bank | Owner/Admin có quyền | Tạo phiên bản mới hoặc thay đổi trước phát hành; lịch sử dùng câu phải được giữ. |
| CNT-03 | Phân loại/tìm kiếm bank | Admin/Evaluator | Filter theo domain/skill/type/difficulty/status/source/ownership. |
| CNT-04 | Nhập hàng loạt | Admin/Evaluator có quyền | Preview, lỗi theo dòng, validation, import transaction và report. |
| CNT-05 | Chọn bank item vào đề | Admin/Evaluator | Copy/compose không làm hỏng bản gốc; lưu nguồn và version. |
| CNT-06 | Kiểm định đề | Engine/Admin | Đáp án, điểm, rubric, domain mapping, thời gian, access scope và legal/license valid. |
| CNT-07 | Preview đề như người học | Admin/Evaluator | Preview không lộ đáp án cho mode learner; cho phép test đáp án trong chế độ author riêng. |
| CNT-08 | Phát hành | Admin hoặc policy được ủy quyền | Chuyển status theo quy trình, tạo immutable version, audit. |
| CNT-09 | Thu hồi/ẩn đề | Admin/Owner theo policy | Ngăn lượt làm mới nhưng giữ lịch sử và quy tắc với lượt đang chạy. |
| CNT-10 | Quản lý contributor source | Admin | Theo dõi ai đóng góp, license, thay đổi và nguồn sử dụng. |

### 13.3. Luồng phát hành chuẩn

`DRAFT → VALIDATION_FAILED hoặc READY_FOR_REVIEW → APPROVED → PUBLISHED`.

Các trạng thái vận hành phụ có thể gồm `INTERNAL_READY`, `SUSPENDED`, `RETIRED`. Với đề riêng, flow thường là `DRAFT → READY_INTERNAL`; nó không tự đi vào `PUBLISHED`. Với đề hệ thống/community, cần review/publish theo thẩm quyền. `is_published` chỉ nên là một projection của status, không là nguồn duy nhất cho toàn bộ quyền.

---

# PHẦN H — TỔ CHỨC, TÀI CHÍNH, ANALYTICS VÀ KIỂM TOÁN

## 14. Organization/B2B Use Cases

| ID | Use case | Actor | Yêu cầu mục tiêu | Hiện trạng |
|---|---|---|---|---|
| ORG-01 | Gửi yêu cầu sử dụng tổ chức | Khách/Admin | Nhập pháp nhân, domain email, quy mô, nhu cầu và liên hệ. | Chưa thấy public request funnel riêng. |
| ORG-02 | Tạo organization | Admin | Tạo record và cấu hình gói, quota, hợp đồng, owner đầu tiên. | Có create endpoint nhưng chưa gắn member-admin tự động. |
| ORG-03 | Mời ORG_ADMIN | Admin/ORG_ADMIN | Tạo invitation token an toàn, expiry, email và scope. | Chưa thấy workflow đủ. |
| ORG-04 | Chấp nhận lời mời | Invitee | Xác minh email/token, nối membership mà không thay role account trái phép. | Chưa thấy workflow đủ. |
| ORG-05 | Quản lý thành viên | ORG_ADMIN | Mời, đổi org-role, suspend/remove, theo dõi seat/quota. | Chưa thấy đầy đủ. |
| ORG-06 | Chuyển workspace | Evaluator | Chọn personal/org; refresh dữ liệu đúng scope. | Chưa thấy workspace switch. |
| ORG-07 | Tạo lớp/ca thi theo org | Evaluator/ORG_ADMIN | Tài nguyên có `organization_id`; quyền theo membership. | Schema room có organization_id, class schema cần đối chiếu. |
| ORG-08 | Xem báo cáo tổ chức | ORG_ADMIN/Evaluator có quyền | Thống kê hoạt động và năng lực của người học trong phạm vi, có privacy controls. | Chưa thấy analytics workspace B2B hoàn chỉnh. |
| ORG-09 | Quản lý license/hợp đồng | Admin/ORG_ADMIN theo quyền | Hiệu lực gói, số seat, ngày hết hạn và usage. | UI có mock/default; nghiệp vụ contract chưa đủ. |
| ORG-10 | Kết thúc/tắt tổ chức | Admin | Hết hạn/suspended, ngăn user mới, xử lý các room/assignment còn tồn tại và giữ lịch sử. | Có `is_active`; transition/cleanup policy cần bổ sung. |

## 15. Billing và thương mại Use Cases

| ID | Use case | Actor | Yêu cầu mục tiêu | Hiện trạng |
|---|---|---|---|---|
| FIN-01 | Quản lý danh mục gói | Admin | Lưu giá, billing period, quota, features, effective dates và version. | UI plans có state local; persistence chưa được xác nhận. |
| FIN-02 | Xem bảng giá | Khách/Người dùng | Xem quyền lợi nhất quán với plan catalog thật. | Có page pricing; cần một source of truth chung. |
| FIN-03 | Tạo checkout/order | Learner/Evaluator/ORG_ADMIN | Tạo order pending, idempotency, amount/currency, plan/period. | Chưa thấy. |
| FIN-04 | Xác nhận thanh toán | Payment provider/backend | Xác minh webhook signature, amount, order id, provider status và event id. | Chưa thấy. |
| FIN-05 | Cấp entitlement | System | Cấp role-independent feature access gắn user/org, validity start/end và origin transaction. | Chưa thấy. |
| FIN-06 | Gia hạn/chấm dứt | User/Admin/system | Quản lý current period, renewal failure, expiry và quyền sau hết hạn. | Chưa thấy. |
| FIN-07 | Refund/chargeback | Admin/Payment | Ghi giao dịch đảo, tính lại entitlement/quota theo policy và audit. | Chưa thấy. |
| FIN-08 | Đối soát doanh thu | Admin/Finance | So sánh order, transaction, provider statement và số tiền thực thu. | Chưa thấy. |
| FIN-09 | Quản lý hạn mức AI | System/ORG_ADMIN | Trừ usage theo policy, ngăn vượt quota, cảnh báo khi gần hết và quyết định fallback. | Có learner credits cơ bản; quota org/evaluator chưa thành hệ thống đầy đủ. |
| FIN-10 | Báo cáo chi phí AI | Admin | Tính cost theo usage record × price version; nhóm model/flow/org/user. | Chưa đủ token usage. |

### 15.1. Bảng dữ liệu tối thiểu đề xuất cho tài chính

- `plans` và `plan_versions`
- `orders`, `payment_transactions`, `payment_webhook_events`
- `entitlements` (user/org, feature/limit, validity, source transaction)
- `ai_usage_events` (provider, model, flow, token usage, latency, status, request id, org/user, price version)
- `ai_model_prices` (input/output rates, currency, effective dates)
- `refunds/adjustments` nếu cần

Không nên trộn `credits` với token thực tế. Credit là đơn vị tính quyền lợi của sản phẩm; token là đơn vị sử dụng của nhà cung cấp; chi phí là số tiền tính theo bảng giá. Ba loại có quan hệ nhưng không đồng nghĩa.

## 16. Analytics và Audit Use Cases

### 16.1. Analytics Người đánh giá

- EVA-AN-01 — lọc theo đề/lớp/khoảng thời gian.
- EVA-AN-02 — tỷ lệ bắt đầu/hoàn thành/nộp bài.
- EVA-AN-03 — phân bố điểm, tỷ lệ đạt và câu hỏi khó/dễ bất thường.
- EVA-AN-04 — tổng hợp radar 5 miền của lớp, chỉ trên dữ liệu được phép xem.
- EVA-AN-05 — trạng thái chấm tay/AI/cờ Tin cậy và thời gian chấm.
- EVA-AN-06 — xuất CSV/JSON hoặc định dạng nghiên cứu với loại bỏ PII không cần thiết.

**Hiện trạng:** có `/evaluator/analytics` và API/export; cần kiểm tra filter/authorization, mapping framework, PII scrub và bản ghi export.

### 16.2. Analytics Admin

- ADM-AN-01 — hoạt động người dùng theo ngày/tuần/tháng.
- ADM-AN-02 — funnel signup → activation → assessment → repeat usage → purchase.
- ADM-AN-03 — hiệu suất đề/question quality và tỷ lệ khiếu nại.
- ADM-AN-04 — AI usage, latency, error rate, tokens/cost và theo dõi quota.
- ADM-AN-05 — doanh thu, gia hạn, refunds và org utilization.
- ADM-AN-06 — live-room health, disconnect, submission failure và incidents.
- ADM-AN-07 — audit/security events và fraud-review queue.

**Hiện trạng:** chưa thấy Admin Analytics độc lập; dashboard hiện có một số tổng số lượng. Chỉ triển khai các biểu đồ sau khi có định nghĩa KPI và nguồn dữ liệu chính xác.

### 16.3. Audit log không đồng nghĩa consent log

`consent_logs` ghi nhận sự kiện đồng thuận dữ liệu; nó không thể thay thế audit log cho các hành động như sửa đề, công khai đề, điều chỉnh điểm, sửa gói, cấp quyền, revoke chứng chỉ, đổi cấu hình AI hoặc xử lý gian lận.

Audit event đề xuất tối thiểu:
`actor_id`, `actor_role`, `org_id`, `action`, `resource_type`, `resource_id`, `before`, `after`, `reason`, `request_id`, `ip_hash/metadata theo chính sách`, `created_at`.

Không ghi secrets, plaintext API keys, mật khẩu, token session hay nội dung PII dư thừa vào audit.

---

# PHẦN I — MA TRẬN QUYỀN TRUY CẬP

## 17. Quyền CRUD/execute mục tiêu

| Resource/action | Learner | Evaluator độc lập | Evaluator tổ chức | ORG_ADMIN | Admin nền tảng |
|---|---|---|---|---|---|
| Xem/chỉnh profile của mình | Có, trường cho phép | Có | Có | Có | Theo chính sách hỗ trợ, có audit |
| Quản lý điểm tích lũy | Không | Không | Không | Không | Chỉ adjustment có audit, không sửa tùy ý |
| Làm đề public hợp lệ | Có | Có thể theo quyền | Theo quyền | Theo quyền | Có quyền kiểm thử/admin |
| Sửa đề riêng của evaluator | Không | Chủ sở hữu | Theo phân công/org policy | Theo policy | Có quyền quản trị có audit |
| Công khai đề hệ thống | Không | Không mặc định | Không mặc định | Không mặc định | Có |
| Quản lý question bank cá nhân | Không | Trong scope mình | Trong scope org | Theo policy | Có |
| Quản lý question bank chuẩn | Không | Không mặc định | Không mặc định | Không | Có |
| Chấm submission | Chỉ xem kết quả mình | Đề/lớp được giao | Đề/lớp được giao trong org | Theo phân công | Có quyền oversight theo policy |
| Xem bài nộp người khác | Không | Scope được giao | Scope org/class | Scope org | Theo quyền quản trị/kiểm toán |
| Tạo/chạy live session | Tham gia | Có | Có trong scope org | Có theo policy | Giám sát/điều phối |
| Khóa phòng | Không | Phòng do mình quản lý | Phòng trong scope | Theo policy | Emergency action có audit |
| Quản lý thành viên tổ chức | Không | Không mặc định | Chỉ khi được cấp role | Có | Có toàn hệ thống |
| Sửa plan/price | Không | Không | Không | Theo hợp đồng có thể không | Có |
| Xem AI usage cá nhân của mình | Có thể xem quota mình | Quota của mình | Usage trong org được cấp | Usage org | Toàn hệ thống |
| Xem AI provider cost | Không | Không | Không mặc định | Có thể chỉ tổng hợp chargeback | Có |
| Duyệt contribution | Gửi/yêu cầu sửa | Gửi | Gửi | Gửi nếu policy | Có |
| Revoke chứng chỉ | Không | Không mặc định | Không mặc định | Không | Có, bắt buộc reason + audit |

## 18. Các endpoint/route cần audit quyền ngay

| Khu vực | Rủi ro cần kiểm tra |
|---|---|
| `/api/admin/assessments` và `/api/admin/assessments/[id]` | Đảm bảo chỉ Admin hoặc service role được phép thao tác; nếu hỗ trợ evaluator qua API riêng thì phải xác minh owner/scope. |
| `/api/assessments/[id]` | Quyền đề VIP/organization, không rò `is_correct`, kiểm phiên bản phát hành và entitlement. |
| `/api/ai/grade-submission` | Xác minh actor được quyền chấm bài submission/item cụ thể; quota theo actor/org; tránh trừ nhiều credit khi retry. |
| `/api/evaluator/rooms` | Xác minh role/owner/org trên GET/PATCH/DELETE; khóa phòng và transitions phải nằm server-side. |
| `/api/rooms/join` và `/api/rooms/status` | Rate-limit PIN; join eligibility; group-only enforcement; hạn chế lộ danh sách/PII; chỉ user trong session được xem data thích hợp. |
| `/api/admin/users` | Kiểm tra role Admin ở server; không để endpoint đổi role trái nguyên tắc role immutable; audit bắt buộc. |
| `/api/admin/organizations` | Authz Admin; validation; gắn owner/member đầu tiên; không trả danh sách rỗng khi thực tế là lỗi quyền mà không báo/log rõ. |
| `/api/admin/ai-gateway` | Hiện đã có check role Admin ở route được rà soát; vẫn phải bảo vệ secret và audit config change. |
| `/api/credentials/generate` | Xác minh submission thuộc người gọi hoặc actor có quyền; không cấp chứng chỉ cho submission chưa finalized/đang review/đã bị hold. |
| `/api/learning/complete` | Xác minh module published, tiến độ hợp lệ và ledger transaction; chống hoàn thành giả bằng gọi API. |
| `/api/evidence/upload` | Kiểm quyền upload, verify content/MIME/size, storage scope và quyền đọc file; không chỉ dựa MIME do browser gửi. |
| `middleware.ts` và demo auth | Không bypass xác thực production qua cookie/query role. Phải tắt demo switch ở deployment production. |

---

# PHẦN J — THIẾT KẾ USE CASE/UML CHO TÀI LIỆU SẢN PHẨM

## 19. Cách biểu diễn Use Case chuẩn

Mỗi UC cần có template ổn định; không chỉ dùng tên chức năng trong sidebar.

```text
ID: LRN-09
Tên: Nộp bài đánh giá
Mục tiêu:
Tác nhân chính:
Tác nhân phụ:
Trigger:
Tiền điều kiện:
Dữ liệu đầu vào:
Luồng chính:
Luồng thay thế:
Luồng ngoại lệ:
Quy tắc nghiệp vụ:
Quyền truy cập:
Dữ liệu ghi/đọc:
Sự kiện/audit:
Hậu điều kiện:
Tiêu chí nghiệm thu:
API/route liên quan:
Trạng thái triển khai:
```

### 19.1. Quan hệ UML nên dùng

- `include`: use case bắt buộc phải gọi lại, ví dụ “Nộp bài” `include` “Xác thực submission” và “Chấm khách quan”.
- `extend`: hành vi tùy chọn, ví dụ “Kích hoạt AI chấm” `extend` “Xem kết quả”; nó không xảy ra ở mọi lần nộp bài.
- Actor generalization: `Evaluator độc lập` và `Evaluator thuộc tổ chức` có thể chuyên biệt hóa actor `Người đánh giá`, nhưng quyền vẫn khác theo workspace membership.
- Không vẽ từng CRUD nhỏ thành use case top-level nếu nó không đại diện mục tiêu người dùng. Tuy vậy, tạo/sửa/ẩn/duyệt là các use case con có thể dùng trong đặc tả chi tiết.
- Không coi “AI” là actor tự quyết định nghiệp vụ. AI Gateway là hệ thống phụ trợ được kích hoạt bởi actor hoặc policy server-side.

### 19.2. Gói Use Case mục tiêu trong UML

1. `Identity & Access`
2. `Assessment Authoring & Item Bank`
3. `Assessment Delivery & Submission`
4. `AI Evaluation & Competency Intelligence`
5. `Learning Pathway & Progress`
6. `Live Exam & Proctoring`
7. `Classes & Organization Workspace`
8. `Credentialing & Verification`
9. `Gamification & Reward Ledger`
10. `Billing & Entitlements`
11. `Admin Governance & Compliance`
12. `Analytics & Observability`

---

# PHẦN K — GAP ANALYSIS VÀ BACKLOG ƯU TIÊN

## 20. P0 — Sửa trước khi mở rộng tính năng

| ID | Hạng mục | Điều kiện hoàn thành |
|---|---|---|
| P0-01 | Chặn bypass demo auth | Không thể giả role qua query/cookie ở production; có deployment test xác minh. |
| P0-02 | API authz/Admin boundary | Mọi API admin kiểm role; evaluator routes kiểm owner/org/class scope. |
| P0-03 | Ngăn lộ đáp án | Query direct Supabase bằng learner không lấy được answer key trước khi được phép. |
| P0-04 | Chuẩn hóa schema | Migration mới tái tạo đủ trường mà code đang dùng; không dựa trên schema chỉnh tay. |
| P0-05 | Submission/score transaction | Một submission được chấm/nộp lặp không tạo duplicate answers/points. |
| P0-06 | Reward ledger | Không cho client/Evaluator tự set tổng điểm; idempotency và reversal có kiểm toán. |
| P0-07 | AI access scope | Chỉ actor có quyền được chấm submission; không lộ bài của người khác. |
| P0-08 | Live room enforcement | `join_locked`, room mode và status được xác thực ở server. |
| P0-09 | Cert eligibility | Chỉ cấp cho submission chính chủ, finalized, đạt policy và không fraud hold. |

## 21. P1 — Nghiệp vụ trọng tâm sản phẩm

| ID | Hạng mục | Điều kiện hoàn thành |
|---|---|---|
| P1-01 | Question bank độc lập | Có bank-item table/domain và reuse qua nhiều assessment versions. |
| P1-02 | Assessment lifecycle | Draft/internal/review/published/suspended/retired, versioning và audit. |
| P1-03 | Server-side contribution workflow | Learner submit → Admin review → revise/approve → publish. |
| P1-04 | Org membership/workspace | Invite/accept/remove, roles, tenant isolation và org switch. |
| P1-05 | Radar timeline | Lưu snapshot mọi attempt đủ điều kiện và tổng hợp xuyên thời gian; không overwrite history. |
| P1-06 | Confidence review queue | Green/amber/red thống nhất, human finalization và score diff audit. |
| P1-07 | Learning progress correctness | Module mapping thật, progress state và points idempotent. |
| P1-08 | Proctor event pipeline | Visibility/fullscreen/disconnect/join/submit events lưu server-side theo policy. |

## 22. P2 — B2B SaaS, thương mại và vận hành

| ID | Hạng mục | Điều kiện hoàn thành |
|---|---|---|
| P2-01 | Plan catalog persistence | Plan/version/quota/price từ DB/API, UI không giả lập. |
| P2-02 | Payment/order/entitlement | Webhook, idempotency, reconciliation và revocation. |
| P2-03 | AI usage & cost ledger | Token, model, price version, cost, status và allocation theo org/flow. |
| P2-04 | Admin Analytics | Có KPI dictionary và nguồn dữ liệu được kiểm toán. |
| P2-05 | Org Analytics | Báo cáo theo tenant, có privacy/access control. |
| P2-06 | Audit log chung | Tất cả hành động nhạy cảm được ghi event có actor/resource/reason. |
| P2-07 | Live Ops Admin | Quản lý phiên thi toàn hệ thống và xử lý sự cố. |
| P2-08 | Fraud/appeal workflow | Tách AI confidence khỏi integrity risk; có reviewer và cơ chế khiếu nại. |

## 23. Kiểm thử nghiệm thu bắt buộc

### 23.1. Phân quyền
- Learner gọi API Admin → `403`.
- Evaluator sửa đề Evaluator khác → `403`.
- Evaluator thuộc organization A truy cập tài nguyên organization B → `403`.
- Người không thuộc nhóm vào `GROUP_ONLY` room → bị từ chối server-side.
- Không có session nhưng đoán UUID vẫn không lấy được dữ liệu riêng.

### 23.2. Bài thi và điểm
- Nộp cùng request hai lần không lưu duplicate hoặc cộng điểm hai lần.
- Hai request đồng thời hoàn thành cùng module chỉ cộng reward một lần.
- Điểm Rubric không vượt max points; tổng score/percentage thống nhất.
- Chấm lại không thay lịch sử cũ và không tạo lại reward points.
- Submission chưa finalized hoặc có fraud hold không cấp chứng chỉ.

### 23.3. AI
- Provider lỗi không sinh score giả/flag green giả.
- Response sai schema bị từ chối và lưu trạng thái lỗi.
- User không có quyền không gọi được AI cho submission người khác.
- Double click không tạo hai AI usage charge/credit deduction.
- PII policy, model, token, cost và request ID được ghi theo khả năng nhà cung cấp.

### 23.4. Radar/lộ trình
- Một lần đánh giá tạo một snapshot mới.
- Đánh giá sau không xóa snapshot trước.
- Radar dài hạn chỉ dùng kết quả thuộc đúng user/framework version/eligibility.
- Module AI đề xuất phải tồn tại và published.
- Complete module chỉ được thưởng một lần.

### 23.5. Live/Proctoring
- Phòng khóa không nhận join mới ngay cả khi client gọi API trực tiếp.
- `ENDED` room không nhận join; status page không gửi PII không cần thiết.
- Mất mạng và quay lại khôi phục đúng submission, không mở một attempt mới ngoài ý muốn.
- Tab/fullscreen events có timestamp server và không tự kết tội chỉ dựa một event.

---

# PHẦN L — QUYẾT ĐỊNH KIẾN TRÚC CẦN CHỐT

## 24. Quyết định cần có câu trả lời chính thức

1. **Framework version:** Bài làm cũ luôn gắn version framework nào? Nếu đổi DigComp version, điểm cũ có được map lại không hay giữ snapshot gốc?
2. **Nguồn điểm năng lực:** Điểm radar lấy từ MCQ, scenario, practical, digital evidence và đánh giá tay với trọng số nào? Bài thiếu một miền được xử lý ra sao?
3. **Độ mới của radar:** Radar “hiện tại” ưu tiên lần gần nhất, trung bình có trọng số, hay chỉ các bằng chứng được duyệt? Phải định nghĩa và giải thích được cho người học.
4. **Chứng chỉ:** Chứng chỉ gắn với một assessment/certification track nào? Điều kiện là đạt bài thi, đạt 450 reward points, hoặc cả hai? Không được nhầm điểm gamification với chứng cứ năng lực.
5. **Điểm tích lũy:** Cụ thể thưởng bao nhiêu cho lần đạt bài đầu, học liệu, đóng góp được duyệt và hành động khác? Ai có quyền thay policy và từ thời điểm nào?
6. **Cờ Tin cậy AI:** Một bộ ngưỡng duy nhất? Khi nào phải bắt buộc human review? Green được tự finalize hay chỉ rút ngắn hàng đợi? Ai quyết định cuối?
7. **Integrity monitoring:** Sự kiện nào ghi lại, mức nào chỉ cảnh báo, mức nào đưa vào review, giữ dữ liệu bao lâu, người học có quyền giải trình không?
8. **Tổ chức:** Tổ chức là customer/tenant riêng hay chỉ một nhãn trên Evaluator? ORG_ADMIN có thể tạo Evaluator/assign content tới mức nào?
9. **Commerce:** Trả phí theo subscription, mua đề lẻ, hợp đồng seat-based, hoặc phối hợp? Entitlement là theo user, tổ chức hay cả hai?
10. **AI cost:** Credit là quota sản phẩm hay đơn vị chi phí? Khi Evaluator dùng AI trong hợp đồng tổ chức, ai chịu chi phí và báo cáo theo org thế nào?
11. **Question bank license:** Ai sở hữu câu hỏi do người học đóng góp? Điều khoản cấp phép ra sao trước khi phát hành/cung cấp thương mại?
12. **Data privacy:** Dữ liệu nào được đưa cho AI, xóa/ẩn danh thế nào, và retention policy cho submissions/evidence/proctoring logs ra sao?

Các quyết định này phải được ghi thành ADR/business rules trước khi coding; không để Agent tự chọn từng lần.

---

## 25. Kết luận cuối

NEXA có nền tảng route và module tương đối rộng, nhưng **không nên coi số lượng trang là số use case đã hoàn tất**. Use case chỉ hoàn chỉnh khi actor thực hiện được mục tiêu từ đầu đến cuối, dữ liệu được lưu đúng, quyền được cưỡng chế ở server, ngoại lệ được xử lý và kết quả có thể kiểm tra.

Ưu tiên theo thứ tự:

1. Bảo mật, role/scope authorization, schema đồng bộ và bảo vệ đáp án.
2. Luồng tạo đề/ngân hàng câu hỏi, submission và chấm điểm nhất quán.
3. Reward ledger và điều kiện chứng chỉ chống buff.
4. Radar lịch sử 5 miền và lộ trình AI gắn với học liệu thực.
5. Live room/proctoring có event pipeline và chính sách minh bạch.
6. Tổ chức/workspace B2B.
7. Thanh toán, entitlement, AI usage/cost ledger, Analytics và audit.
8. Sau cùng tinh chỉnh UX/UI theo các luồng đã nghiệm thu.

**Nguồn rà soát chính:** `AGENTS.md`, `ARCHITECTURE_REVIEW_AND_REFACTOR_SPEC.md`, `docs/00-project-context.md`, `src/app/(dashboard)/**`, `src/app/api/**`, `src/features/ai-gateway/**`, `src/features/assessments/**` và `src/database/migrations/01_core_schema.sql` đến `10_class_collaboration_schema.sql` trên repository `minhhuyzzz/nexa_AI`.
