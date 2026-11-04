# NEXA AI — Đặc tả Use Case theo 4 Actor & Rà soát CRUD

**Phiên bản:** 1.2 · **Ngày:** 04/11/2026  
**Trạng thái:** Đặc tả nghiệp vụ chuẩn hóa cho 4 Actor, kết nối 3 Dashboard và đồng bộ quyền hạn thực tế.  
**Đối chiếu kỹ thuật:** Repository `minhhuyzzz/nexa_AI`, nhánh `main`.

---

## 0. Phạm vi Actor và nguyên tắc cốt lõi

- **Guest**: Người chưa đăng nhập, sử dụng website công khai; **không có dashboard riêng**.
- **Personal User**: Mọi người dùng đã đăng nhập, bao gồm cả **Member của các tổ chức**; sử dụng **Personal Dashboard**.
- **Organization Admin**: `ORG_OWNER` / `ORG_ADMIN`, quản trị vận hành trong phạm vi tổ chức; sử dụng **Organization Dashboard** và tài khoản cá nhân tại Personal Dashboard.
- **System Admin**: Người vận hành nền tảng NEXA, sử dụng **Platform Admin Dashboard**, quản trị sản phẩm, dịch vụ, nội dung chính thức và vận hành hệ thống.

**Quy tắc thiết kế và bảo vệ dữ liệu:**
1. **Ba không gian, một danh tính:** Một tài khoản có thể có nhiều vai trò trên nhiều không gian; chuyển workspace là chuyển ngữ cảnh quyền, không đổi tài khoản.
2. **5 miền năng lực số là tiêu chuẩn chuẩn hóa bên trong:** Tuyệt đối không phô bày các thuật ngữ kỹ thuật, mã khung hay số hiệu phiên bản (DigComp, DigComp 2.2, 3.0...) lên UI người dùng. Trên UI chỉ dùng các cách gọi tự nhiên: **"5 miền năng lực số"**, **"Khung năng lực số 5 miền"** hoặc **"Hồ sơ năng lực 5 miền"**.
3. **Ranh giới sở hữu dữ liệu nghiêm ngặt:** 
   - `NEXA-owned`: Đề chuẩn hóa, ngân hàng câu hỏi dùng chung, lộ trình, gói dịch vụ do System Admin phát hành.
   - `User-owned`: Đề cá nhân, bài làm, điểm số, lịch sử học tập cá nhân.
   - `Organization-owned`: Lớp học, thành viên tổ chức, đợt khảo thí, bài nộp đợt thi, điểm số tổ chức.
   - **System Admin KHÔNG mặc định có quyền làm bài thay, sửa điểm bài thi, can thiệp lớp học hay chấm bài thay tổ chức.**
4. **Không xóa cứng (No hard-delete):** Nội dung đánh giá, học phần, lộ trình phải dùng cơ chế lưu trữ (`ARCHIVED`) hoặc ngưng phát hành (`DEPRECATED`) để bảo vệ tính toàn vẹn của dữ liệu lịch sử và tiến độ người học.

---

## 1. Actor: Guest — Khách chưa đăng nhập

| Mã UC | Tên Use Case | Mô tả ngắn |
| --- | --- | --- |
| UC-G01 | Xem thông tin nền tảng | Tìm hiểu chức năng, cách hoạt động và đối tượng sử dụng NEXA. |
| UC-G02 | Xem thông tin gói dịch vụ | Xem quyền lợi, điều kiện sử dụng và mức giá Personal/Business. |
| UC-G04 | Đăng ký tài khoản | Tạo tài khoản người dùng mới. |
| UC-G05 | Đăng nhập hệ thống | Xác thực tài khoản để vào không gian được cấp quyền. |
| UC-G06 | Yêu cầu khôi phục mật khẩu | Khởi tạo quy trình khôi phục quyền đăng nhập. |
| UC-G07 | Gửi yêu cầu tư vấn gói Business | Gửi thông tin liên hệ và nhu cầu triển khai cho tổ chức. |
| UC-G08 | Mở liên kết mời tham gia | Mở lời mời tổ chức/lớp, đăng nhập hoặc đăng ký để tiếp tục. |

---

## 2. Actor: Personal User — Người dùng cá nhân

| Mã UC | Tên Use Case | Mô tả ngắn |
| --- | --- | --- |
| UC-P01 | Quản lý hồ sơ cá nhân | Xem, cập nhật hồ sơ và thiết lập tài khoản. |
| UC-P02 | Thực hiện đánh giá năng lực ban đầu | Làm bài đánh giá đầu vào (chính thức từ Admin) để tạo cơ sở hồ sơ năng lực 5 miền. |
| UC-P03 | Tra cứu bài đánh giá | Tìm kiếm, lọc và xem thông tin các đề do NEXA phát hành; nhận biết đề miễn phí hoặc cần nâng cấp. |
| UC-P04 | Thực hiện bài đánh giá tự chọn | Bắt đầu và trả lời đề từ thư viện NEXA khi đủ quyền truy cập. |
| UC-P05 | Nộp bài đánh giá | Gửi đáp án trắc nghiệm, văn bản, tệp và/hoặc liên kết theo yêu cầu của đề. |
| UC-P06 | Xem kết quả đánh giá | Xem điểm, nhận xét và trạng thái công bố theo chính sách của bài. |
| UC-P07 | Xem hồ sơ năng lực số cá nhân | Theo dõi kết quả đánh giá 5 miền năng lực và các lần cập nhật hợp lệ. |
| UC-P08 | Tham gia lộ trình học tập | Truy cập học phần và các bài đánh giá NEXA gắn với lộ trình. |
| UC-P09 | Theo dõi tiến độ lộ trình học tập | Xem bước đã hoàn thành, bước tiếp theo và mục tiêu cá nhân. |
| UC-P10 | Tham gia lớp hoặc nhóm | Gia nhập lớp/nhóm cá nhân hoặc lớp/nhóm thuộc tổ chức theo quyền hợp lệ. |
| UC-P11 | Tham gia tổ chức | Chấp nhận lời mời, liên kết hoặc nhập mã tham gia tổ chức. |
| UC-P12 | Tiếp nhận và thực hiện bài đánh giá được giao | Xem bài giao từ lớp cá nhân và lớp thuộc tổ chức trong cùng một mục “Bài được giao”; dùng chung luồng làm và nộp bài. |
| UC-P13 | Quản lý đề đánh giá cá nhân | Soạn, tạo, chỉnh sửa, kiểm định và sử dụng đề thuộc quyền sở hữu cá nhân. |
| UC-P14 | Tổ chức phòng thi trực tiếp cá nhân | Tạo và điều hành phiên thi trực tiếp trong phạm vi cá nhân được phép. |
| UC-P15 | Đóng góp nội dung đánh giá | Gửi đề/câu hỏi cho NEXA xem xét đưa vào ngân hàng cộng đồng. |
| UC-P16 | Xem bảng xếp hạng | Theo dõi điểm hoạt động PTS và thứ hạng theo chính sách công bố. |
| UC-P17 | Xem chứng chỉ và thành tích | Xem chứng chỉ hoặc thành tích hợp lệ đã được cấp. |
| UC-P18 | Quản lý gói dịch vụ cá nhân | Xem quyền lợi, nâng cấp/gia hạn và lịch sử gói cá nhân. |
| UC-P19 | Tham gia phòng thi trực tiếp | Nhập mã PIN hoặc mở liên kết phiên thi và làm bài với tư cách thí sinh. |

---

## 3. Actor: Organization Admin — Quản trị viên tổ chức

| Mã UC | Tên Use Case | Mô tả ngắn |
| --- | --- | --- |
| UC-O01 | Xem tổng quan hoạt động tổ chức | Xem tình hình thành viên, lớp, đợt đánh giá và công việc cần xử lý. |
| UC-O02 | Quản lý thành viên tổ chức | Xem, mời, duyệt tham gia, cập nhật tư cách thành viên và loại thành viên khi cần. |
| UC-O03 | Quản lý phương thức mời tham gia tổ chức | Cung cấp mã tham gia, liên kết mời hoặc gửi lời mời trực tiếp qua email. |
| UC-O04 | Quản lý lớp và nhóm | Tạo, xem, chỉnh sửa và lưu trữ lớp/nhóm trực thuộc tổ chức. |
| UC-O05 | Quản lý thành viên lớp/nhóm | Thêm, điều chuyển và loại thành viên khỏi lớp/nhóm. |
| UC-O06 | Quản lý đề đánh giá nội bộ | Soạn, chỉnh sửa, kiểm định, phát hành và ngừng sử dụng đề của tổ chức. |
| UC-O07 | Tạo và phát hành đợt đánh giá | Chọn tên đợt tự đặt, đề, lớp/nhóm, thời gian và xác nhận phát hành. |
| UC-O08 | Quản lý đợt đánh giá | Xem danh sách, điều chỉnh theo trạng thái, kết thúc hoặc lưu trữ đợt. |
| UC-O09 | Theo dõi tình trạng hoàn thành bài đánh giá | Theo dõi Chưa làm và Đã làm (đã nộp) theo danh sách người được giao. |
| UC-O10 | Chấm bài tự luận và thực hành | Xem bài, minh chứng, chấm rubric và nhập nhận xét (Bàn chấm bài). |
| UC-O11 | Duyệt và công bố kết quả đánh giá | Xác nhận kết quả chính thức, sau đó công bố cho người học theo chính sách. |
| UC-O12 | Xem báo cáo năng lực tổ chức | Xem thống kê kết quả hợp lệ theo 5 miền năng lực trong phạm vi tổ chức. |
| UC-O13 | So sánh kết quả đánh giá | So sánh các lớp/nhóm và đợt đánh giá có cơ sở đối chiếu phù hợp. |
| UC-O14 | Xuất báo cáo đánh giá | Xuất số liệu và báo cáo đúng quyền, đúng phạm vi tổ chức. |
| UC-O15 | Quản lý cấu hình tổ chức | Cập nhật thông tin và thiết lập vận hành của tổ chức. |
| UC-O16 | Xem gói Business và hạn mức sử dụng | Theo dõi ghế, số đề, AI Credits, thời hạn và quyền lợi hiện hành. |
| UC-O17 | Gửi yêu cầu gia hạn hoặc điều chỉnh gói Business | Đề nghị xử lý gia hạn hoặc thay đổi quyền lợi dịch vụ. |
| UC-O18 | Tạo phòng thi trực tiếp của tổ chức | Chọn đề, đối tượng tham gia, thời gian và tạo phiên thi trong phạm vi tổ chức. |
| UC-O19 | Điều hành phòng thi trực tiếp | Mở phòng, cung cấp mã PIN, điều khiển phiên thi realtime và đóng phiên. |
| UC-O20 | Xem kết quả phòng thi trực tiếp | Tra cứu bài đã nộp, kết quả chấm và công bố hợp lệ của phiên thi. |

---

## 4. Actor: System Admin — Quản trị viên nền tảng NEXA

### 4.1. Danh mục 39 Use Case Platform Admin

| Mã UC | Tên Use Case | Phân nhóm nghiệp vụ | Mô tả ngắn |
| --- | --- | --- | --- |
| UC-A01 | Giám sát vận hành nền tảng | Vận hành hệ thống | Xem công việc cần xử lý, cảnh báo và sức khỏe dịch vụ. |
| UC-A02 | Quản lý tài khoản người dùng | Người dùng & Khách hàng | Tra cứu, hỗ trợ, cập nhật trạng thái và xử lý khóa/mở tài khoản theo quyền. |
| UC-A03 | Xử lý yêu cầu đăng ký Business | Người dùng & Khách hàng | Tiếp nhận, cập nhật tiến độ tư vấn và xử lý yêu cầu đăng ký tổ chức. |
| UC-A04 | Quản lý tổ chức khách hàng | Người dùng & Khách hàng | Tạo, xem, kích hoạt, tạm ngừng, đóng và hỗ trợ hồ sơ tổ chức. |
| UC-A05 | Quản lý danh mục gói dịch vụ | Gói & Thanh toán | Tạo, xem, chỉnh sửa và ngừng cung cấp gói Personal/Business. |
| UC-A06 | Quản lý quyền lợi dịch vụ | Gói & Thanh toán | Cấp, điều chỉnh và theo dõi ghế, số đề, AI Credits và thời hạn theo tổ chức/cá nhân. |
| UC-A07 | Xử lý yêu cầu gia hạn Business | Gói & Thanh toán | Kiểm tra, phê duyệt và ghi nhận thay đổi quyền lợi/thời hạn gói tổ chức. |
| UC-A08 | Đối soát giao dịch thanh toán | Gói & Thanh toán | Xem giao dịch, xác minh chứng từ thanh toán và xử lý ngoại lệ có audit log. |
| UC-A09 | Xem báo cáo kinh doanh nền tảng | Gói & Thanh toán | Xem doanh thu xác minh, gói đang sử dụng và tình trạng tăng trưởng khách hàng. |
| UC-A10 | Quản lý ngân hàng bài đánh giá NEXA | Ngân hàng đánh giá | Tạo, xem, sửa, kiểm định, phát hành và lưu trữ đề chuẩn hóa dùng trong Personal. |
| UC-A11 | Cấu hình quyền truy cập bài đánh giá | Ngân hàng đánh giá | Phân loại đề Free/Premium và kiểm soát điều kiện làm bài theo gói. |
| UC-A12 | Quản lý lộ trình học tập NEXA | Lộ trình & Học liệu | Tạo, xem, chỉnh sửa, sắp xếp, phát hành và lưu trữ lộ trình phát triển. |
| UC-A13 | Quản lý học phần và học liệu | Lộ trình & Học liệu | Quản lý nội dung, tài nguyên học tập và thứ tự học phần trong lộ trình. |
| UC-A14 | Liên kết bài đánh giá với lộ trình | Lộ trình & Học liệu | Gắn đề từ ngân hàng NEXA vào học phần, đặt điều kiện tiên quyết và hoàn thành. |
| UC-A15 | Kiểm duyệt nội dung đóng góp | Ngân hàng đánh giá | Duyệt, yêu cầu chỉnh sửa hoặc từ chối câu hỏi/đề do cộng đồng đề xuất. |
| UC-A16 | Quản lý phiên bản khung năng lực | Ngân hàng đánh giá | Quản lý cấu trúc tham chiếu 5 miền, kỹ năng và phiên bản có kiểm soát. |
| UC-A17 | Phân tích hiệu quả nội dung học tập | AI & Báo cáo | Theo dõi lượt sử dụng và kết quả tổng hợp hợp lệ của đề/lộ trình. |
| UC-A18 | Giám sát AI Gateway | AI & Báo cáo | Theo dõi số lượt gọi, lỗi, độ trễ, chi phí và mức tiêu thụ token AI theo chức năng. |
| UC-A19 | Quản lý cấu hình AI Gateway | AI & Báo cáo | Cấu hình nhà cung cấp, model và tham số vận hành AI theo quyền được cấp. |
| UC-A20 | Xử lý yêu cầu hỗ trợ người dùng | Hỗ trợ & Khách hàng | Tiếp nhận, phân loại và xử lý phản hồi/yêu cầu trợ giúp từ người dùng. |
| UC-A21 | Quản lý thông báo nền tảng | Vận hành hệ thống | Soạn, gửi và theo dõi thông báo tới toàn hệ thống hoặc nhóm đối tượng. |
| UC-A22 | Giám sát bảo mật và nhật ký kiểm toán | Vận hành hệ thống | Tra cứu sự kiện nhạy cảm, hoạt động quản trị viên và cảnh báo an ninh. |
| UC-A23 | Quản lý quyền quản trị viên hệ thống | Vận hành hệ thống | Cấp, điều chỉnh và thu hồi vai trò/capability Admin nội bộ theo phân quyền. |
| UC-A24 | Quản lý cấu hình nền tảng | Vận hành hệ thống | Quản lý thiết lập chung, feature flags và chính sách hoạt động hệ thống. |
| UC-A25 | Quản lý quy tắc điểm PTS và cấp độ | Chứng chỉ & Gamification | Cấu hình chính sách điểm thưởng PTS, cấp bậc và bảng vinh danh cá nhân. |
| UC-A26 | Quản lý chính sách chứng chỉ | Chứng chỉ & Gamification | Quản lý mẫu phôi, tiêu chí cấp phát và trạng thái chứng nhận năng lực số. |
| UC-A27 | Hỗ trợ xử lý sự cố đánh giá và phòng thi | Hỗ trợ & Vận hành | Tra cứu, chẩn đoán sự cố kỹ thuật có kiểm soát; không tự ý sửa điểm/làm bài thay. |
| **UC-A28** | **Quản lý bài đánh giá năng lực đầu vào** | **Ngân hàng đánh giá** | **Chỉ định đề đầu vào chính thức, phiên bản, phạm vi 5 miền và điều kiện áp dụng toàn hệ thống.** |
| **UC-A29** | **Cấu hình quy tắc hình thành hồ sơ năng lực 5 miền** | **Ngân hàng đánh giá** | **Xác định nguồn kết quả hợp lệ, công thức tính điểm 5 miền và xử lý miền thiếu dữ liệu.** |
| **UC-A30** | **Quản lý thư viện bài đánh giá cộng đồng** | **Ngân hàng đánh giá** | **Thẩm định, đóng gói và phát hành đề đóng góp từ cộng đồng thành đề Free/Premium.** |
| **UC-A31** | **Quản lý ngân hàng câu hỏi dùng chung** | **Ngân hàng đánh giá** | **Quản lý kho câu hỏi, đáp án, rubric, phân loại 5 miền và phiên bản nội dung dùng chung.** |
| **UC-A32** | **Quản lý danh mục phân phối bài đánh giá** | **Ngân hàng đánh giá** | **Điều phối đề nổi bật, phân loại chủ đề và thứ tự hiển thị trên thư viện Personal.** |
| **UC-A33** | **Cấu hình quy tắc đề xuất lộ trình phát triển** | **Lộ trình & Học liệu** | **Ánh xạ khoảng trống năng lực (điểm thấp/thiếu minh chứng) sang lộ trình/học phần NEXA.** |
| **UC-A34** | **Quản lý điều kiện hoàn thành học tập** | **Lộ trình & Học liệu** | **Thiết lập bài kiểm tra bắt buộc, điểm đạt, điều kiện mở khóa bước học và thưởng PTS.** |
| **UC-A35** | **Quản lý phiên bản và vòng đời nội dung đánh giá** | **Ngân hàng đánh giá** | **Quản lý vòng đời bản nháp, kiểm định, phát hành, lưu trữ và bảo toàn bài nộp lịch sử.** |
| **UC-A36** | **Quản lý chính sách đánh giá và công bố kết quả** | **Ngân hàng đánh giá** | **Cấu hình barem chấm tự động/mở, rubric chuẩn và quy chế công bố kết quả chung.** |
| **UC-A37** | **Quản lý quyền lợi theo gói dịch vụ (Entitlements)** | **Gói & Thanh toán** | **Ràng buộc quyền lợi theo gói (đề Premium, lộ trình, AI Credits, phòng thi) với quyền thực tế.** |
| **UC-A38** | **Quản lý vòng đời chứng chỉ số** | **Chứng chỉ & Gamification** | **Theo dõi việc cấp phát, tra cứu xác thực mã chứng chỉ, gia hạn hoặc thu hồi có căn cứ.** |
| **UC-A39** | **Quản lý phản ánh và vi phạm nội dung** | **Vận hành & Hỗ trợ** | **Tiếp nhận khiếu nại, thẩm định vi phạm, xử lý ẩn/gỡ nội dung và ghi nhận audit log.** |

---

### 4.2. Chi tiết nghiệp vụ 12 Use Case bổ sung (UC-A28 đến UC-A39)

#### UC-A28: Quản lý bài đánh giá năng lực đầu vào
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT`.
- **Mục tiêu:** Chỉ định chính thức bài đánh giá nào là đề khảo thí đầu vào toàn hệ thống (Baseline Assessment), đảm bảo người dùng mới làm đúng đề chuẩn của NEXA thay vì lấy bừa đề tự tạo.
- **Tiền điều kiện:** Đề đánh giá đã được thẩm định, ở trạng thái `PUBLISHED`, và câu hỏi phải bao phủ đầy đủ cả 5 miền năng lực số.
- **Luồng chính:**
  1. Admin mở danh sách đề thi chính thức của NEXA tại Assessment Studio.
  2. Chọn đề đạt chuẩn và kích hoạt hành động **"Chỉ định làm đề khảo thí đầu vào"**.
  3. Hệ thống xác thực phạm vi câu hỏi có đủ 5 miền và lưu `baseline_assessment_id` vào cấu hình hệ thống (`platform_settings`).
  4. Mọi tài khoản Personal mới truy cập trang chủ / dashboard sẽ nhận diện đúng đề này cho nút hành động "Đánh giá năng lực ban đầu".
- **Hậu điều kiện:** `platform_settings.baseline_assessment_id` được cập nhật, có ghi audit log. Bài làm của thí sinh với đề này sẽ được gắn cờ `is_baseline: true`.

#### UC-A29: Cấu hình quy tắc hình thành hồ sơ năng lực 5 miền
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT` hoặc `MANAGE_SYSTEM`.
- **Mục tiêu:** Thiết lập quy chế tính điểm hồ sơ 5 miền: điểm chỉ sinh ra từ bài nộp hợp lệ đã qua thẩm định (`EVALUATED`), không suy diễn điểm 0% giả cho miền chưa làm.
- **Tiền điều kiện:** Khung 5 miền năng lực đã được định nghĩa trong hệ thống.
- **Quy tắc:** `score: null` khi chưa có bằng chứng; `score: 0` khi đã làm và đạt 0 điểm. Không ghi đè điểm đầu vào; lưu phiên bản hồ sơ theo thời gian.

#### UC-A30: Quản lý thư viện bài đánh giá cộng đồng
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT`.
- **Mục tiêu:** Đóng gói các đề thi/câu hỏi được cộng đồng đóng góp (sau khi thẩm định qua UC-A15) thành các bộ đề phát hành chính thức, phân loại Free hoặc VIP/Premium, ghi nhận tác giả đóng góp.
- **Ranh giới:** Phê duyệt một câu hỏi đóng góp (UC-A15) chuyển câu hỏi vào ngân hàng; phát hành một đề cộng đồng (UC-A30) là quy trình riêng xuất bản đề lên thư viện Personal.

#### UC-A31: Quản lý ngân hàng câu hỏi dùng chung
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT`.
- **Mục tiêu:** Quản trị tập trung toàn bộ câu hỏi trắc nghiệm, tình huống, tự luận và thực hành; gán nhãn 5 miền, thiết lập barem rubric chấm điểm, quản lý độ khó và phiên bản.

#### UC-A32: Quản lý danh mục phân phối bài đánh giá
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT`.
- **Mục tiêu:** Điều phối cách hiển thị đề trên thư viện của người học cá nhân (đề nổi bật, đề phổ biến, đề mới phát hành, lọc theo 5 miền).

#### UC-A33: Cấu hình quy tắc đề xuất lộ trình phát triển
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT`.
- **Mục tiêu:** Thiết lập ma trận ánh xạ logic: Khi người học có điểm dưới ngưỡng (ví dụ < 60đ) ở miền nào, hệ thống sẽ tự động gợi ý lộ trình học tập tương ứng thuộc catalog chính thức đã duyệt.

#### UC-A34: Quản lý điều kiện hoàn thành học tập
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT`.
- **Mục tiêu:** Quy định điều kiện để người học hoàn thành một học phần/lộ trình (bài kiểm tra bắt buộc, điểm đạt tối thiểu, xác nhận học liệu); ngăn chặn việc gọi API trực tiếp để tích lũy điểm PTS bất hợp pháp.

#### UC-A35: Quản lý phiên bản và vòng đời nội dung đánh giá
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT`.
- **Mục tiêu:** Kiểm soát vòng đời đề thi (`DRAFT` → `VERIFIED` → `PUBLISHED` → `ARCHIVED`). Nghiêm cấm xóa cứng (hard-delete) đề thi đã có lượt làm; chỉ cho phép lưu trữ để bảo vệ toàn vẹn lịch sử kết quả.

#### UC-A36: Quản lý chính sách đánh giá và công bố kết quả
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT` hoặc `MANAGE_SYSTEM`.
- **Mục tiêu:** Định nghĩa quy chế chấm điểm: trắc nghiệm (MCQ) tự động chấm; tự luận/thực hành chấm theo rubric; tách biệt trạng thái hoàn tất chấm và công bố điểm cho người học.

#### UC-A37: Quản lý quyền lợi theo gói dịch vụ (Entitlements)
- **Tác nhân:** System Admin có capability `MANAGE_FINANCE` hoặc `MANAGE_SYSTEM`.
- **Mục tiêu:** Cấu hình ma trận quyền lợi thực tế gắn với từng gói dịch vụ: số ghế thành viên, số lượng đề tạo tối đa, hạn mức AI Credits, quyền truy cập đề VIP/Premium và thời hạn hiệu lực.

#### UC-A38: Quản lý vòng đời chứng chỉ số
- **Tác nhân:** System Admin có capability `MANAGE_CONTENT` hoặc `MANAGE_SYSTEM`.
- **Mục tiêu:** Quản trị các phôi mẫu chứng chỉ, cấu hình chữ ký số kép (dual SHA-256 hash), kiểm soát danh sách chứng chỉ đã cấp, xác thực công khai qua mã định danh và thu hồi chứng chỉ khi phát hiện gian lận.

#### UC-A39: Quản lý phản ánh và vi phạm nội dung
- **Tác nhân:** System Admin có capability `MANAGE_USERS` hoặc `MANAGE_CONTENT`.
- **Mục tiêu:** Tiếp nhận các báo cáo vi phạm bản quyền hoặc nội dung không phù hợp từ người dùng đối với đề thi/câu hỏi cộng đồng; thực hiện ẩn/gỡ nội dung và ghi nhận audit log xử lý.

---

## 5. Ma trận CRUD & Ranh giới Sở hữu Dữ liệu

| Nhóm tài nguyên | Quyền System Admin | Điều kiện & Giới hạn |
|---|---|---|
| Đề đầu vào NEXA | C / R / U / D* (Lưu trữ) + Chỉ định | Bắt buộc phủ đủ 5 miền năng lực; không sửa phá vỡ bài làm cũ |
| Đề NEXA chính thức | C / R / U / D* (Lưu trữ) + Phát hành | Lưu trữ thay vì xóa cứng; quản lý phiên bản |
| Ngân hàng câu hỏi | C / R / U / D* | Barem rubric, ánh xạ 5 miền, chống trùng lặp |
| Đề thi cộng đồng | R / U / D* + Thẩm định / Gỡ bỏ | Bảo toàn bản quyền tác giả và nguồn gốc đóng góp |
| Lộ trình & Học phần | C / R / U / D* (Lưu trữ) | Bảo toàn tiến độ học tập lịch sử của người học |
| Tài khoản người dùng | R / U (Khóa / Mở / Reset) | Không xóa lịch sử học tập; thao tác khóa có audit log |
| Tổ chức Business | C / R / U / D* (Tạm ngừng / Kích hoạt) | Quản lý tenant và gói; không can thiệp danh sách lớp/thành viên |
| Gói & Quyền lợi | C / R / U / D* | Bảo toàn hợp đồng và quyền lợi đã kích hoạt |
| Giao dịch & Đối soát | R / U (Xác minh / Đối soát) | Bất biến (Immutable); không sửa số tiền hay xóa giao dịch |
| AI Gateway & Config | R / U | Bảo mật API key; kiểm soát quota theo chức năng |
| Đề cá nhân, Bài làm, Điểm thi | **KHÔNG CRUD MẶC ĐỊNH** | Không can thiệp, không chấm thay, không sửa điểm của cá nhân/tổ chức |

---

## 6. Luồng sản phẩm xuyên suốt kết nối 3 Không gian

```
[System Admin]
  ├── UC-A28: Chỉ định Đề đầu vào chuẩn 5 miền
  ├── UC-A10/A11: Phát hành Thư viện Đề NEXA & Gắn cờ Free/VIP
  └── UC-A12/A13/A33: Thiết lập Lộ trình & Quy tắc đề xuất học tập
         │
         ▼ (Người dùng cá nhân nhận nội dung chuẩn)
[Personal User]
  ├── UC-P02: Làm bài khảo thí đầu vào chính thức
  ├── UC-P07: Hệ thống khởi tạo Hồ sơ năng lực 5 miền chuẩn xác
  ├── UC-P08/P09: Tự động đề xuất lộ trình dựa trên khoảng trống năng lực
  └── UC-P12: Thực hiện bài giao từ Lớp học cá nhân hoặc Lớp tổ chức
         │
         ▲ (Tổ chức sử dụng nền tảng đào tạo)
[Organization Admin]
  ├── UC-O04/O05: Quản lý Lớp học & Thành viên đơn vị
  ├── UC-O07/O08: Phát hành Đợt khảo thí (dùng đề tổ chức hoặc đề chuẩn NEXA)
  ├── UC-O10/O11: Chấm bài tự luận/thực hành theo Rubric & Công bố kết quả
  └── UC-O12: Xem Báo cáo phổ điểm 5 miền toàn đơn vị (chuẩn hóa đồng bộ)
```

**Nguyên tắc vận hành tối cao:** System Admin kiến tạo tiêu chuẩn, học liệu và vận hành hạ tầng; Personal User rèn luyện và phát triển năng lực số; Organization Admin điều hành lớp học và thẩm định năng lực tập thể. Ba không gian vận hành độc lập, tôn trọng ranh giới dữ liệu và cùng hội tụ trên chuẩn hóa **5 miền năng lực số**.
