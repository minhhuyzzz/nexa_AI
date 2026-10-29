# NEXA AI — Đặc tả mô hình sản phẩm Personal Workspace, Organization Workspace và Platform Admin

**Loại tài liệu:** Đặc tả sản phẩm và nghiệp vụ (Product Specification)  
**Trạng thái:** Đề xuất chuẩn hóa để làm cơ sở cập nhật PRD, Use Case, mô hình dữ liệu và backlog triển khai  
**Phiên bản:** 1.0.0  
**Ngôn ngữ:** Tiếng Việt  
**Phạm vi:** Mô hình tài khoản, không gian làm việc, chức năng, gói dịch vụ, quyền truy cập và nguyên tắc chuyển đổi kiến trúc của NEXA AI

---

## 1. Mục tiêu tài liệu

Tài liệu này xác định mô hình sản phẩm đích của NEXA AI, thay thế cách tổ chức sản phẩm hiện tại dựa trên hai loại tài khoản cố định `LEARNER` và `EVALUATOR`.

Mô hình mới gồm ba khu vực ở cấp sản phẩm:

1. **Personal Workspace — Không gian cá nhân:** một người dùng có thể vừa học, làm bài đánh giá, theo dõi năng lực, vừa tạo đề, tạo nhóm và tổ chức phòng thi trong giới hạn gói dịch vụ.
2. **Organization Workspace — Không gian tổ chức:** dành cho trường học, doanh nghiệp, trung tâm đào tạo và các tổ chức cần quản lý người dùng, nhóm/lớp, nội dung đánh giá, kỳ thi, báo cáo, phân quyền và ngân sách tập trung.
3. **Platform Admin — Quản trị nền tảng:** khu vực nội bộ để quản trị NEXA trên toàn hệ thống, không phải một loại workspace kinh doanh và không được cấp chỉ vì người dùng mua gói dịch vụ.

Mục đích không phải chỉ gộp menu hoặc đổi tên URL. Mọi thay đổi phải được phản ánh nhất quán trong nghiệp vụ, xác thực, API, phân quyền, cơ sở dữ liệu, Row Level Security (RLS), gói dịch vụ và kiểm thử.

## 2. Bối cảnh và vấn đề cần giải quyết

Mô hình hiện tại có các khái niệm `LEARNER`, `EVALUATOR` và `ADMIN`. Giao diện Người học và Người đánh giá được tổ chức thành hai dashboard riêng. Một số luồng đăng ký, middleware, API, schema và chính sách RLS còn dựa vào vai trò cố định này.

Mô hình đó tạo ra các vấn đề:

- Một người vừa học vừa tạo đề có thể phải chịu hai luồng chức năng như thể là hai nhóm người dùng khác nhau.
- Quyền tạo đề, điều phối phòng thi hoặc quản lý nhóm bị gắn với vai trò tài khoản thay vì quyền sở hữu và phạm vi tài nguyên.
- Người dùng cá nhân và người dùng làm việc trong tổ chức chưa được phân biệt đủ rõ về phạm vi dữ liệu, quản trị, báo cáo và ngân sách.
- Chỉ đổi giao diện sẽ không giải quyết được các điều kiện quyền còn nằm ở API, database và RLS.
- Cách gắn gói dịch vụ với `LEARNER` hoặc `EVALUATOR` không phản ánh tốt mô hình một tài khoản có nhiều năng lực sử dụng sản phẩm.

Mô hình đích phải giảm sự phân mảnh trải nghiệm, đồng thời giữ cách ly dữ liệu và quyền hạn nghiêm ngặt.

## 3. Nguyên tắc sản phẩm bất biến

### 3.1. Một người dùng cá nhân, nhiều chức năng

Mọi tài khoản cá nhân thông thường đều có thể sử dụng các chức năng học tập và những chức năng tạo/điều phối cơ bản mà gói dịch vụ cho phép. Không yêu cầu người dùng chọn giữa “Người học” và “Người đánh giá” khi đăng ký.

### 3.2. Workspace xác định phạm vi làm việc

Workspace cho biết người dùng đang thao tác trong ngữ cảnh nào:

- `PERSONAL`: tài nguyên thuộc cá nhân.
- `ORGANIZATION`: tài nguyên thuộc một tổ chức cụ thể.
- `PLATFORM_ADMIN`: vùng quản trị nền tảng, chỉ dành cho tài khoản được cấp quyền Admin.

Workspace không phải là một danh tính đăng nhập mới. Người dùng không cần tạo tài khoản khác hoặc đăng xuất để chuyển đổi giữa không gian cá nhân và tổ chức mà họ có quyền truy cập.

### 3.3. Vai trò tổ chức không phải vai trò tài khoản toàn cục

Vai trò như chủ sở hữu tổ chức, quản trị viên tổ chức, người đánh giá hoặc người xem báo cáo chỉ có hiệu lực trong phạm vi tổ chức tương ứng. Một người có thể có các vai trò khác nhau trong những tổ chức khác nhau.

### 3.4. Gói dịch vụ không quyết định danh tính

Gói `Free`, `Pro` hoặc `Business` xác định quyền lợi, hạn mức và tính năng được sử dụng; không biến người dùng thành một loại tài khoản khác và không mặc nhiên cấp quyền quản trị.

### 3.5. Free phải có giá trị sử dụng thực tế

Người dùng Free vẫn được làm bài, xem kết quả/radar cơ bản, sử dụng AI trong hạn mức miễn phí, tạo đề ở quy mô giới hạn, lập nhóm ở quy mô giới hạn và mở phòng thi trực tiếp với giới hạn phù hợp. Không được thiết kế Free chỉ như một bản xem thử không đủ dùng.

### 3.6. Quyền phải được cưỡng chế ở phía máy chủ

Không được dùng việc ẩn nút, route phía giao diện, cookie demo, `localStorage` hay giá trị do trình duyệt gửi lên làm nguồn xác thực quyền production. API và database phải xác minh danh tính, quyền trên tài nguyên, phạm vi workspace, gói dịch vụ và hạn mức.

### 3.7. Không đồng nhất điểm, năng lực và chứng chỉ

Điểm bài đánh giá, điểm năng lực, điểm tích lũy/gamification và điều kiện cấp chứng chỉ là các khái niệm riêng. Tạo đề, tạo nhóm hoặc mở phòng thi không tự động làm tăng điểm thành tích. Mua gói Pro/Business không tự động cấp chứng chỉ chính thức.

---

## 4. Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| Tài khoản | Danh tính đăng nhập duy nhất của một người dùng trong NEXA. |
| Personal Workspace | Phạm vi làm việc cá nhân, nơi người dùng quản lý tài nguyên thuộc quyền sở hữu của mình. |
| Organization Workspace | Phạm vi làm việc của một tổ chức đã được tạo và có thành viên được cấp quyền. |
| Platform Admin | Quyền quản trị nền tảng NEXA trên toàn hệ thống. |
| Thành viên tổ chức | Tài khoản được liên kết với một tổ chức thông qua membership hợp lệ. |
| Tài nguyên cá nhân | Đề, nhóm, phòng thi, báo cáo hoặc nội dung do cá nhân sở hữu trong phạm vi `PERSONAL`. |
| Tài nguyên tổ chức | Tài nguyên có tổ chức sở hữu, thường gắn `organization_id` và chịu chính sách truy cập của tổ chức. |
| Entitlement | Quyền lợi được cấp theo gói dịch vụ, phạm vi áp dụng và thời hạn hiệu lực. |
| Quota | Hạn mức sử dụng một tài nguyên hoặc dịch vụ trong khoảng thời gian được quy định. |
| Đề chuẩn của hệ thống | Nội dung chuẩn do NEXA quản lý/duyệt; khác với đề cá nhân hoặc đề nội bộ tổ chức. |
| Chứng chỉ chính thức | Chứng chỉ do quy trình được NEXA ủy quyền phát hành, có điều kiện cấp và cơ chế xác minh/thu hồi. |

---

## 5. Mô hình người dùng và quyền

### 5.1. Danh tính nền tảng

Tài khoản thông thường không có trường vai trò cố định mang ý nghĩa “chỉ là Người học” hoặc “chỉ là Người đánh giá”. Hồ sơ tài khoản chứa dữ liệu nhận diện và cài đặt người dùng; quyền truy cập được tổng hợp từ:

1. Danh tính đã xác thực.
2. Quyền hệ thống được cấp riêng, nếu có.
3. Membership và vai trò của người dùng trong workspace tổ chức đang hoạt động.
4. Quyền sở hữu hoặc quyền được giao trên tài nguyên cụ thể.
5. Entitlement và quota áp dụng cho tài khoản hoặc tổ chức.
6. Trạng thái hoạt động của tài khoản, tổ chức, tài nguyên và gói dịch vụ.

Không được suy ra rằng người dùng có quyền chỉ vì họ có gói Pro, là người tạo một tài nguyên khác hoặc là thành viên của một tổ chức khác.

### 5.2. Vai trò đề xuất trong tổ chức

Các vai trò dưới đây là mô hình chức năng đề xuất. Tên kỹ thuật có thể được điều chỉnh khi thiết kế chi tiết, nhưng phạm vi quyền phải tương đương và được ghi lại rõ ràng.

| Vai trò tổ chức | Phạm vi trách nhiệm |
|---|---|
| `ORG_OWNER` | Chủ thể sở hữu workspace tổ chức; quản lý thông tin sở hữu và các quyết định quản trị cao nhất trong tổ chức, trong giới hạn hợp đồng và chính sách nền tảng. |
| `ORG_ADMIN` | Quản lý thành viên, phân quyền, nhóm/lớp, cài đặt và tài nguyên tổ chức trong phạm vi được cấp. |
| `ASSESSOR` | Tạo/quản lý đề tổ chức, giao bài, điều phối phòng thi, chấm bài và xem kết quả được phân công. |
| `REPORT_VIEWER` | Chỉ xem báo cáo/analytics được cấp; không được tự sửa đề, điểm hoặc quyền thành viên. |
| `MEMBER` | Tham gia nhóm/lớp, làm bài và xem dữ liệu cá nhân của mình; chỉ có thêm quyền khi được giao cụ thể. |

Mặc định nên áp dụng nguyên tắc quyền tối thiểu. Không phải mọi tổ chức đều cần sử dụng đầy đủ các vai trò trên ở phiên bản đầu tiên.

### 5.3. Platform Admin

`ADMIN` là quyền đặc biệt ở cấp nền tảng. Quyền này phải được cấp thông qua quy trình quản trị tin cậy, không được chọn trong biểu mẫu đăng ký, không được cấp bởi việc tham gia tổ chức và không được tự kích hoạt bằng giá trị từ client.

Admin có thể được phép quản lý:

- Tài khoản, trạng thái hoạt động và các sự cố bảo mật.
- Tổ chức, trạng thái hợp đồng/gói dịch vụ và kiểm soát nền tảng.
- Phiên bản khung năng lực và nội dung chuẩn.
- Ngân hàng đề chuẩn, quy trình kiểm duyệt nội dung cộng đồng.
- Cấu hình AI Gateway, giới hạn sử dụng, báo cáo chi phí và lỗi dịch vụ.
- Gói dịch vụ, giao dịch, entitlement và báo cáo tài chính.
- Audit log, compliance, chính sách dữ liệu và các công cụ vận hành.

Quyền Admin không thay thế vai trò `ORG_OWNER`/`ORG_ADMIN` và mọi thao tác nhạy cảm phải có dấu vết kiểm toán. Việc sửa lịch sử điểm, kết quả hoặc chứng chỉ phải có lý do và audit log phù hợp.

---

## 6. Đặc tả Personal Workspace

### 6.1. Mục đích

Cung cấp một nơi làm việc thống nhất cho cá nhân, bao gồm người tự học, sinh viên, nhân viên, giảng viên và chuyên gia độc lập. Một tài khoản có thể vừa tham gia đánh giá vừa tạo và tổ chức đánh giá.

### 6.2. Các phân hệ chức năng

#### A. Tổng quan cá nhân

- Hiển thị tình trạng học tập, hoạt động gần đây, bài đánh giá, lộ trình học, tiến bộ năng lực và quota còn lại.
- Cung cấp lối tắt đến “Làm bài”, “Tạo đề”, “Tạo nhóm” và “Mở phòng thi” tùy quyền lợi và hạn mức hiện tại.
- Không hiển thị số liệu giả lập như số liệu thật. Trạng thái tải dữ liệu, không có dữ liệu và lỗi phải phân biệt rõ.

#### B. Học và làm bài đánh giá

- Khám phá và làm các bài đánh giá công khai hoặc bài được chia sẻ hợp lệ.
- Tham gia bài được giao qua nhóm, lời mời, liên kết hoặc phòng thi.
- Lưu tiến trình/nộp bài theo cơ chế của từng loại đánh giá.
- Xem kết quả, phản hồi và bằng chứng chấm trong phạm vi được phép.
- Có thể kích hoạt các chức năng AI theo entitlement/quota hợp lệ.

#### C. Hồ sơ năng lực và radar

- Hiển thị radar theo 5 lĩnh vực năng lực DigComp theo phiên bản khung năng lực được sử dụng.
- Phân biệt rõ điểm của một lần đánh giá với hồ sơ năng lực theo thời gian.
- Khi chưa có bằng chứng đủ tin cậy, hiển thị trạng thái “Chưa đủ dữ liệu”, không tự gán điểm 0 gây hiểu lầm.
- Giữ lịch sử bằng chứng/snapshot để người dùng có thể theo dõi thay đổi và nguồn hình thành điểm.
- Giải thích được thời điểm, nguồn và phương pháp tổng hợp kết quả theo quy tắc đã công bố.

#### D. Lộ trình học tập

- Đề xuất nội dung học dựa trên khoảng trống năng lực được xác định từ bằng chứng có sẵn.
- Nếu dùng AI để tạo đề xuất, kết quả phải được trình bày là đề xuất, không phải kết luận không thể sai.
- Nội dung được giới thiệu phải liên kết đến tài nguyên học tập thật trong hệ thống hoặc nguồn đã được duyệt.

#### E. Tạo và quản lý đề cá nhân

- Người dùng có thể tạo bản nháp, chỉnh sửa, kiểm tra hợp lệ và phát hành đề trong phạm vi cá nhân.
- Hỗ trợ các dạng câu hỏi mà assessment engine của hệ thống thực sự triển khai, chẳng hạn MCQ, tình huống, nhiệm vụ thực hành và minh chứng số.
- Trạng thái đề phải phân biệt ít nhất: `DRAFT`, `READY`/`PUBLISHED` trong phạm vi cá nhân, `PENDING_REVIEW` nếu gửi duyệt, `ARCHIVED` và `REVOKED` khi phù hợp.
- Đề cá nhân không tự động trở thành đề chuẩn của NEXA hoặc đề dùng chung cho tổ chức.
- Người tạo đề không tự động có quyền sửa bài nộp hoặc điểm đã chốt trái với quy trình chấm.

#### F. Tạo và quản lý nhóm

- Tạo nhóm cá nhân, thiết lập tên, mô tả và cơ chế tham gia.
- Mời thành viên bằng liên kết/mã hoặc phương thức được hệ thống hỗ trợ.
- Tạo bài giao cho nhóm, theo dõi tiến độ và xem kết quả trong phạm vi nhóm do mình quản lý.
- Có cơ chế rời nhóm, gỡ thành viên, hết hạn lời mời và xử lý quyền của chủ nhóm khi tài khoản bị khóa.
- Nhóm cá nhân không phải tổ chức và không có quyền quản trị thành viên/gói dịch vụ ở cấp tổ chức.

#### G. Phòng thi trực tiếp

- Người dùng có quyền được phép mở phòng thi theo hạn mức gói.
- Hỗ trợ mã PIN/liên kết/QR nếu những phương thức này được cấu hình và triển khai.
- Phân biệt phòng mở với phòng chỉ cho người thuộc nhóm/lớp được chỉ định.
- Chỉ chủ phòng hoặc người được ủy quyền mới được quản lý cài đặt, trạng thái, danh sách người tham gia và kết quả tổng hợp của phòng.
- Các chính sách đóng/mở phòng, thời gian bắt đầu/kết thúc và điều kiện vào phòng phải được kiểm tra phía máy chủ.
- Theo dõi hành vi trình duyệt chỉ được trình bày trong giới hạn kỹ thuật thực tế; không tuyên bố có thể ngăn tuyệt đối mọi hành vi gian lận trên mọi thiết bị.

#### H. Lịch sử, chứng chỉ và đóng góp cộng đồng

- Lưu lịch sử bài đánh giá, bài nộp, hoạt động và chứng chỉ của tài khoản.
- Chỉ hiển thị chứng chỉ mà tài khoản sở hữu hoặc được phép xem.
- Việc đóng góp đề/nội dung cộng đồng đi qua quy trình kiểm duyệt trước khi được công bố vào kho chung.
- Điểm thưởng đóng góp chỉ được cấp khi đáp ứng điều kiện đã công bố; không cho phép người dùng tự đặt điểm hoặc tự duyệt nội dung của mình.

#### I. Quản lý gói cá nhân

- Hiển thị gói đang áp dụng, quyền lợi, quota sử dụng, lịch sử giao dịch và trạng thái gia hạn/hết hạn nếu có.
- Người dùng được thông báo trước khi một thao tác vượt quota, được giải thích lựa chọn nâng cấp hoặc chờ quota làm mới.
- Thông báo vượt quota không được dùng để che giấu lỗi hệ thống hoặc trừ quota trước khi tác vụ được tính là đã sử dụng theo chính sách.

---

## 7. Đặc tả Organization Workspace

### 7.1. Mục đích

Cung cấp khả năng quản trị tập trung cho trường học, doanh nghiệp, trung tâm đào tạo và các tổ chức có nhu cầu đánh giá năng lực số ở quy mô nhóm hoặc toàn tổ chức.

Organization Workspace không đơn thuần là Personal Pro có quota cao hơn. Giá trị cốt lõi là quản lý nhiều người, phân quyền, chia sẻ tài nguyên, kiểm soát dữ liệu và vận hành theo tổ chức.

### 7.2. Tạo tổ chức và thiết lập ban đầu

- Tổ chức có định danh duy nhất, tên, slug/mã, trạng thái, thông tin liên hệ và gói/quyền lợi áp dụng.
- Quy trình tạo tổ chức có thể là tự đăng ký hoặc được Admin hỗ trợ, tùy chính sách kinh doanh.
- Tổ chức chỉ được kích hoạt khi thỏa mãn các quy tắc xác minh/duyệt được NEXA định nghĩa.
- Cần xác định `ORG_OWNER` đầu tiên và quy trình chuyển giao khi người sở hữu rời tổ chức.
- Không dùng việc nhập mã tổ chức tùy ý để tự cấp quyền quản trị hoặc mở quyền đọc dữ liệu.

### 7.3. Thành viên và phân quyền

- Mời thành viên qua email/liên kết/mã được hỗ trợ.
- Lời mời phải có trạng thái, thời hạn, người mời, vai trò dự kiến và tổ chức đích.
- Khi chấp nhận lời mời phải xác thực đúng danh tính, kiểm tra thời hạn và ngăn sử dụng lại token.
- Quản trị viên có thể xem thành viên, đổi vai trò, tạm ngưng hoặc gỡ thành viên trong phạm vi quyền.
- Mọi thay đổi quyền quan trọng phải được lưu audit log.
- Việc gỡ thành viên không được xóa lịch sử kết quả/đánh giá mà tổ chức có nghĩa vụ lưu; chính sách lưu trữ và quyền xem lịch sử cần được định nghĩa rõ.

### 7.4. Nhóm, lớp, phòng ban và chương trình

- Tổ chức có thể tạo cấu trúc nhóm/lớp/phòng ban theo nhu cầu.
- Một người có thể thuộc nhiều nhóm trong cùng tổ chức nếu chính sách cho phép.
- Quan hệ thành viên nhóm phải được tách khỏi membership cấp tổ chức.
- Giao bài, kỳ thi và báo cáo phải có phạm vi rõ ràng: toàn tổ chức, một nhóm/lớp hoặc danh sách người tham gia cụ thể.
- Không được giả định rằng mọi thành viên tổ chức đều có quyền xem kết quả của toàn bộ tổ chức.

### 7.5. Đề thi và ngân hàng câu hỏi dùng chung

- Tổ chức có thể quản lý thư viện câu hỏi/đề riêng của tổ chức.
- Phân biệt ngân hàng câu hỏi của cá nhân, ngân hàng câu hỏi tổ chức và ngân hàng câu hỏi chuẩn của NEXA.
- Câu hỏi/đề chỉ được dùng trong tổ chức, chia sẻ ra ngoài hoặc gửi NEXA duyệt theo quyền sở hữu và chính sách cấp phép.
- Quản lý phiên bản, người tạo, người sửa, trạng thái duyệt, nguồn gốc và lịch sử sử dụng của nội dung.
- Người có quyền chỉ xem báo cáo không được chỉnh sửa ngân hàng câu hỏi.

### 7.6. Giao bài, phòng thi và chấm kết quả

- Tạo kỳ đánh giá/giao bài cho nhóm hoặc tập người dùng được xác định.
- Điều phối phòng thi trực tiếp ở quy mô phù hợp với quota và năng lực kỹ thuật của gói tổ chức.
- Phân công người chấm/người điều phối theo quyền và phạm vi dữ liệu.
- AI có thể hỗ trợ chấm theo rubric khi được phép, nhưng kết quả cần theo quy tắc confidence/human review đã định nghĩa.
- Kết quả chốt phải có dấu vết sửa đổi; không cho phép sửa điểm âm thầm.

### 7.7. Báo cáo và phân tích tổ chức

- Báo cáo theo tổ chức, nhóm/lớp, kỳ đánh giá, năng lực và thời gian.
- Chỉ tổng hợp những dữ liệu mà người xem được phép truy cập.
- Có thể xuất dữ liệu theo quyền, ghi nhận người xuất, thời điểm và phạm vi dữ liệu.
- Áp dụng nguyên tắc tối thiểu hóa dữ liệu; không công khai dữ liệu cá nhân hoặc điểm của người học cho thành viên không có quyền.
- Báo cáo không được trộn dữ liệu của hai tổ chức khác nhau nếu không có cơ chế được ủy quyền rõ ràng.

### 7.8. Quota AI và ngân sách

- Tổ chức có thể có quota hoặc ngân sách AI riêng, tách khỏi quota cá nhân của thành viên.
- Mỗi tác vụ AI phải được ghi nhận chủ thể thanh toán/tiêu thụ: người dùng cá nhân hoặc tổ chức, tùy workspace và chính sách.
- Cần ghi model/provider, loại tác vụ, thời điểm, token/đơn vị sử dụng nếu có, trạng thái và dữ liệu cần thiết để tính chi phí.
- Khi gần/vượt hạn mức phải có cảnh báo và chính sách rõ ràng: từ chối, cho phép theo ngân sách bổ sung hoặc chuyển sang phương án thay thế đã cấu hình.
- Không được tin giá trị quota hoặc chi phí do client gửi lên.

### 7.9. Gói, hợp đồng và trạng thái tổ chức

- Gói Business được áp dụng lên tổ chức hoặc hợp đồng tương ứng, không phải tự động biến tất cả thành viên thành tài khoản Pro cá nhân.
- Entitlement cần có thời gian bắt đầu/kết thúc, trạng thái, nguồn cấp và liên kết với giao dịch/hợp đồng nếu có.
- Khi tổ chức hết hạn hoặc bị tạm ngưng, hệ thống phải xác định rõ chức năng nào bị ngừng, dữ liệu nào ở chế độ chỉ đọc, cách xử lý phòng thi đang chạy và cách bảo toàn lịch sử.
- Thành viên vẫn giữ tài khoản và hồ sơ cá nhân, trừ khi có yêu cầu xóa tài khoản hợp lệ theo chính sách dữ liệu.

---

## 8. Đặc tả Platform Admin

Platform Admin vận hành NEXA trên toàn nền tảng, không phải workspace mặc định của mọi tổ chức.

Các nhóm chức năng:

1. **Tài khoản:** tra cứu, khóa/mở khóa, xử lý yêu cầu hỗ trợ và kiểm soát tài khoản vi phạm theo quyền.
2. **Tổ chức:** duyệt/kích hoạt/tạm ngưng tổ chức; quản lý trạng thái, gói, hợp đồng hoặc quota theo chính sách.
3. **Khung năng lực:** quản lý phiên bản khung, lĩnh vực, năng lực thành phần, trạng thái và lịch sử cập nhật.
4. **Nội dung chuẩn:** quản lý ngân hàng đề của hệ thống, kiểm duyệt nội dung cộng đồng và thu hồi nội dung không đạt yêu cầu.
5. **AI Gateway:** quản lý provider/model, cấu hình, giới hạn, lỗi, chính sách dữ liệu và báo cáo sử dụng/chi phí.
6. **Thương mại:** quản lý catalog gói, giao dịch, entitlement, hoàn tiền/điều chỉnh theo quyền và đối soát.
7. **An toàn và tuân thủ:** xem audit log, xử lý sự cố, consent và yêu cầu dữ liệu theo chính sách áp dụng.
8. **Vận hành:** theo dõi lỗi, hiệu năng, các dịch vụ nền và trạng thái tích hợp.

Các thao tác quản trị đặc quyền phải có kiểm tra quyền ở máy chủ và log. Tài khoản có thể đăng nhập nhưng không có quyền Admin không được truy cập dữ liệu Admin bằng cách gọi thẳng URL hoặc API.

---

## 9. Mô hình gói dịch vụ

### 9.1. Định hướng

Mô hình thương mại phân biệt ba loại giá trị:

- **Free:** trải nghiệm và sử dụng cá nhân ở quy mô giới hạn.
- **Personal Pro:** mở rộng năng lực và hạn mức của cá nhân.
- **Business:** quản trị sử dụng ở cấp tổ chức, nhiều thành viên và nhiều nhóm, cùng các tính năng điều phối/báo cáo/tài chính tổ chức.

Business không chỉ là Personal Pro với nhiều lượt AI hơn.

### 9.2. Ma trận quyền lợi đề xuất

| Năng lực | Personal Free | Personal Pro | Business |
|---|---|---|---|
| Làm bài đánh giá | Có | Có | Có, theo quyền truy cập |
| Xem kết quả và radar cơ bản | Có | Có | Có, theo phạm vi dữ liệu |
| Phân tích AI | Hạn mức miễn phí | Hạn mức/công cụ nâng cao hơn | Quota cấp tổ chức theo chính sách |
| Tạo đề cá nhân | Có, giới hạn | Hạn mức cao hơn và tính năng nâng cao | Có đề tổ chức và thư viện dùng chung |
| Tạo nhóm cá nhân | Có, giới hạn | Hạn mức cao hơn | Quản lý nhóm/lớp tổ chức |
| Mở phòng thi Live | Có, giới hạn | Hạn mức cao hơn | Điều phối theo quy mô tổ chức |
| Phân quyền nhiều thành viên | Không phải chức năng cốt lõi | Không thay thế quản trị tổ chức | Có |
| Báo cáo tổ chức | Không | Không mặc nhiên có | Có |
| Quản trị quota/ngân sách dùng chung | Không | Không | Có |
| Hợp đồng/license/seat quản lý tập trung | Không | Không | Theo gói/hợp đồng |

### 9.3. Quy tắc chưa được phép tự suy diễn

Các con số cụ thể cho hạn mức Free/Pro/Business **chưa được chốt trong đặc tả này**. Không tự mặc định lại các giới hạn thuộc mô hình Evaluator cũ, ví dụ giới hạn nhóm, số thành viên mỗi nhóm hoặc số lượt AI/tháng, nếu chưa có quyết định sản phẩm mới.

Hạn mức cần được cấu hình tập trung và áp dụng thống nhất ở backend. Không hard-code cùng một con số độc lập ở nhiều màn hình hoặc API.

### 9.4. Quy tắc entitlement

- Entitlement có thể thuộc một tài khoản cá nhân hoặc một tổ chức.
- Mỗi entitlement xác định phạm vi, thời hạn, trạng thái và các quyền lợi được cấp.
- Quyền sử dụng tính năng là kết quả kết hợp entitlement, quyền truy cập workspace và điều kiện nghiệp vụ.
- Gói trả phí không cấp quyền truy cập dữ liệu của người khác.
- Gói trả phí không mặc nhiên cấp quyền tạo chứng chỉ chính thức, duyệt nội dung chuẩn hoặc thực hiện quản trị nền tảng.

---

## 10. Quy tắc về tài nguyên, dữ liệu và quyền sở hữu

### 10.1. Tài nguyên phải có phạm vi sở hữu

Các tài nguyên quan trọng như đề, ngân hàng câu hỏi, nhóm/lớp, phòng thi, assignment, báo cáo và quota phải có quy tắc sở hữu rõ ràng. Tùy từng bảng, thiết kế nên biểu diễn rõ:

- `owner_user_id` hoặc trường tương đương cho tài nguyên cá nhân;
- `organization_id` cho tài nguyên tổ chức;
- `created_by` để ghi nhận người tạo, không dùng trường này thay thế hoàn toàn quyền sở hữu;
- `visibility`/`scope` khi tài nguyên có nhiều chế độ chia sẻ;
- trạng thái vòng đời, ngày tạo/cập nhật và các trường audit phù hợp.

Đây là yêu cầu thiết kế logic, không bắt buộc tất cả bảng phải dùng đúng các tên trường này. Schema chi tiết cần tránh dữ liệu mơ hồ như một tài nguyên vừa mang ý nghĩa cá nhân vừa mang ý nghĩa tổ chức mà không có quy tắc chuyển đổi.

### 10.2. Tách các phạm vi nội dung

Tối thiểu phân biệt:

- `PERSONAL`: chỉ chủ sở hữu và người được chia sẻ hợp lệ.
- `ORGANIZATION`: thành viên được cấp quyền trong tổ chức tương ứng.
- `SYSTEM_CURATED`/phạm vi tương đương: nội dung chuẩn do NEXA kiểm soát.
- `PUBLIC`: chỉ áp dụng với nội dung được phép công khai, không có nghĩa là công khai đáp án, dữ liệu cá nhân hoặc dữ liệu nội bộ.

Không được dùng `is_published = true` như điều kiện duy nhất để cấp quyền đọc toàn bộ nội dung liên quan.

### 10.3. Đáp án và dữ liệu đánh giá nhạy cảm

- Đáp án đúng, rubric nội bộ, dữ liệu chấm và nội dung bảo mật của đề phải được bảo vệ ở database và API.
- Không để người làm bài có thể truy vấn trực tiếp bảng lựa chọn/đáp án để đọc `is_correct` hoặc giải thích đáp án trước khi được phép.
- Kết quả bài thi phải được kiểm tra quyền theo chủ thể làm bài, người được phân công chấm, chủ sở hữu hoặc tổ chức có thẩm quyền.
- Xuất dữ liệu cũng phải tuân thủ quyền như thao tác xem dữ liệu, đồng thời có audit log khi phù hợp.

### 10.4. Radar và dữ liệu lịch sử

- Lưu dữ liệu nguồn hoặc snapshot cần thiết để giải thích hồ sơ năng lực theo thời gian.
- Không ghi đè toàn bộ lịch sử bằng radar của bài gần nhất.
- Khi thay phiên bản khung năng lực, phải có chính sách versioning/mapping và giữ nguồn gốc kết quả được tính theo phiên bản nào.
- Người dùng và tổ chức chỉ truy cập dữ liệu radar theo phạm vi được cấp.

### 10.5. Điểm tích lũy

- Điểm thưởng được ghi nhận qua ledger hoặc cơ chế bất biến tương đương.
- Giao dịch điểm cần có idempotency để tránh cộng trùng.
- Client không được tự cập nhật tổng điểm.
- Người tạo đề/phòng thi không tự trao điểm cho chính mình hoặc người khác ngoài quy trình đã được hệ thống cho phép.
- Quy tắc thưởng phải được version hóa và có lịch sử khi thay đổi.

---

## 11. Quy tắc xác thực, phân quyền và bảo mật

### 11.1. Luồng xác thực

- Đăng ký tạo một tài khoản người dùng thông thường, không cần chọn `LEARNER`/`EVALUATOR`.
- Admin được cấp thông qua quy trình đặc quyền riêng.
- Sau đăng nhập, hệ thống tải membership, quyền hệ thống và trạng thái entitlement phù hợp.
- Chuyển workspace là thao tác đổi ngữ cảnh, không được xem là bằng chứng tự cấp quyền.

### 11.2. Kiểm tra quyền cho mọi thao tác

Một thao tác nhạy cảm phải kiểm tra tối thiểu:

1. Người dùng đã xác thực và tài khoản còn được phép hoạt động.
2. Workspace đích hợp lệ và người dùng có quyền truy cập workspace đó.
3. Người dùng có quyền hành động trên tài nguyên đích.
4. Tài nguyên thuộc đúng phạm vi và không bị thu hồi/ngưng hoạt động.
5. Gói dịch vụ/quota cho phép tác vụ, nếu tác vụ có giới hạn thương mại.
6. Quy tắc nghiệp vụ khác được đáp ứng, ví dụ trạng thái bài thi, thời gian, điều kiện chấm hoặc xác minh lời mời.

### 11.3. Supabase RLS

- Bật và rà soát RLS cho các bảng dữ liệu người dùng, tài nguyên cá nhân, membership tổ chức, tài nguyên tổ chức, điểm, submissions, credentials, AI usage và billing.
- RLS phải dựa trên danh tính và membership/quyền có thể kiểm chứng; không dựa vào dữ liệu client tự khai báo.
- Cẩn trọng với `SECURITY DEFINER`, service role và các RPC đặc quyền. Chỉ dùng khi cần thiết, giới hạn quyền và kiểm tra tham số bên trong hàm.
- Chặn người dùng truy cập trực tiếp những dữ liệu bị API che đi, đặc biệt đáp án/rubric, bài nộp của người khác, thông tin giao dịch và dữ liệu tổ chức khác.
- Kiểm thử tình huống truy cập chéo tài khoản/tổ chức bắt buộc, không chỉ test trường hợp truy cập hợp lệ.

### 11.4. Demo mode

Demo mode chỉ phục vụ phát triển/kiểm thử. Không được dùng cookie hoặc query parameter mô phỏng vai trò để vượt bảo vệ production. Các API phải bảo vệ độc lập, không giả định middleware là lớp bảo vệ duy nhất.

---

## 12. Luồng nghiệp vụ quan trọng

### 12.1. Đăng ký và dùng Personal Workspace

1. Người dùng đăng ký/đăng nhập tài khoản thông thường.
2. Hệ thống khởi tạo hồ sơ cá nhân và thiết lập mặc định cần thiết.
3. Người dùng được truy cập Personal Workspace với quyền lợi Free.
4. Người dùng có thể làm bài; đồng thời có thể tạo đề, tạo nhóm và mở phòng thi trong hạn mức miễn phí.
5. Mọi hoạt động được lưu gắn với đúng tài khoản và phạm vi tài nguyên.

### 12.2. Tạo đề cá nhân

1. Người dùng chọn tạo đề từ Personal Workspace.
2. Backend xác minh entitlement/quota và quyền tạo đề.
3. Đề được tạo trong phạm vi `PERSONAL` với chủ sở hữu rõ ràng.
4. Người dùng lưu bản nháp và chạy kiểm tra hợp lệ trước khi phát hành.
5. Đề chỉ được truy cập theo visibility và quy tắc chia sẻ.
6. Nếu gửi đề vào cộng đồng/kho chuẩn, đề đi qua quy trình duyệt riêng; không tự động đổi thành tài nguyên chuẩn.

### 12.3. Tạo nhóm và mở phòng thi trong Free

1. Người dùng Free yêu cầu tạo nhóm/phòng thi.
2. Backend kiểm tra trạng thái tài khoản và quota tương ứng.
3. Nếu hợp lệ, hệ thống tạo tài nguyên có quyền sở hữu cá nhân.
4. Backend áp dụng chính sách tham gia, mời thành viên và đóng/mở phòng.
5. Nếu vượt hạn mức, trả về thông báo rõ về loại quota bị giới hạn và cách xử lý; không tạo tài nguyên nửa chừng.

### 12.4. Tạo và vận hành Organization Workspace

1. Tổ chức được đăng ký/tạo theo quy trình đã phê duyệt.
2. Hệ thống thiết lập chủ sở hữu ban đầu và gói/entitlement tổ chức.
3. Chủ sở hữu/quản trị viên mời thành viên với vai trò dự kiến.
4. Thành viên xác minh lời mời; hệ thống tạo membership.
5. Thành viên chuyển vào Organization Workspace khi có quyền.
6. Mọi tài nguyên được tạo trong tổ chức phải mang phạm vi tổ chức và chịu quyền của tổ chức đó.
7. Khi thành viên bị gỡ hoặc tổ chức bị ngưng, quyền được cập nhật theo chính sách; lịch sử không bị xóa tùy tiện.

### 12.5. Chuyển đổi giữa Personal và Organization

1. Người dùng mở bộ chọn workspace.
2. Hệ thống chỉ liệt kê Personal và những Organization Workspace mà tài khoản có quyền tham gia.
3. Khi đổi workspace, dữ liệu và menu được tải lại theo phạm vi mới.
4. URL/API ở workspace trước không được xem là có quyền trong workspace mới.
5. Khi membership bị thu hồi trong lúc đang sử dụng, các thao tác tiếp theo phải bị từ chối ở backend.

### 12.6. Tác vụ AI và quota

1. Người dùng yêu cầu tác vụ AI từ workspace hiện hành.
2. Backend xác minh quyền, chính sách dữ liệu, entitlement và quota phù hợp.
3. Backend ghi nhận tác vụ và đơn vị sử dụng cần thiết trước/sau khi chạy theo cơ chế chống lạm dụng.
4. AI Gateway chạy provider/model được cấu hình.
5. Kết quả được xác thực theo schema và lưu trong phạm vi được phép.
6. Usage được quy về tài khoản hoặc tổ chức theo chính sách đã chốt.
7. Nếu thất bại, hệ thống áp dụng quy tắc hoàn/trừ quota nhất quán, tránh mất quota do lỗi chưa được tính là sử dụng.

### 12.7. Cấp chứng chỉ

1. Hệ thống xác minh bài/track đánh giá đủ điều kiện cấp.
2. Kiểm tra kết quả đã chốt, chất lượng bằng chứng và yêu cầu human review nếu có.
3. Quy trình cấp chứng chỉ chạy theo thẩm quyền đã cấu hình.
4. Chứng chỉ lưu nguồn gốc, người nhận, phiên bản khung/tiêu chí, trạng thái và mã xác minh.
5. Chứng chỉ có thể bị thu hồi theo quy trình; việc thu hồi phải có lý do và audit log.

---

## 13. Yêu cầu giao diện và điều hướng

### 13.1. Personal Workspace

Menu nên được tổ chức theo mục tiêu người dùng thay vì theo danh tính vai trò. Nhóm mục gợi ý:

- **Tổng quan**
- **Học tập:** Khám phá bài đánh giá, bài của tôi, lịch sử, lộ trình học
- **Năng lực:** Radar, phân tích năng lực, minh chứng, chứng chỉ
- **Tạo và tổ chức:** Đề của tôi, nhóm của tôi, phòng thi trực tiếp
- **Hồ sơ và gói dịch vụ:** Hồ sơ, cài đặt, quota, thanh toán

Các mục có thể được điều chỉnh theo IA/UX sau này. Không được tách lại thành hai dashboard “Người học” và “Người đánh giá” dưới tên khác.

### 13.2. Organization Workspace

Menu gợi ý:

- Tổng quan tổ chức
- Thành viên và phân quyền
- Nhóm/lớp/phòng ban
- Ngân hàng câu hỏi và đề tổ chức
- Bài giao, kỳ đánh giá và phòng thi
- Chấm bài và phân công
- Báo cáo và phân tích
- Quota AI, gói dịch vụ và cài đặt tổ chức

Chỉ hiển thị mục người dùng có quyền truy cập. Ẩn mục trên giao diện không thay thế được kiểm tra API/backend.

### 13.3. Chuyển workspace

- Có bộ chọn workspace rõ ràng khi người dùng có nhiều workspace.
- Hiển thị tên tổ chức hiện tại để giảm thao tác nhầm phạm vi.
- Đổi workspace phải làm rõ dữ liệu đang xem thuộc cá nhân hay tổ chức.
- Không tự động chuyển tài nguyên cá nhân thành tài nguyên tổ chức hoặc ngược lại.

### 13.4. Quản trị nền tảng

Admin giữ giao diện và điều hướng riêng. Không trộn dữ liệu/quyền Admin vào menu Personal hoặc Organization thông thường.

---

## 14. Nguyên tắc chuyển đổi từ mô hình hiện tại

### 14.1. Không thực hiện đổi tên hàng loạt thiếu kiểm soát

Không chỉ đổi `/learner` thành `/personal`, không chỉ chuyển component từ `/evaluator` vào menu mới và không xóa cột `role` trước khi thay hết logic phụ thuộc.

### 14.2. Phân tích đầy đủ các phụ thuộc cũ

Phải tìm và phân loại các điểm phụ thuộc vào `LEARNER`, `EVALUATOR`, `evaluator_id`, `evaluator_profiles`, redirect theo role, dashboard route và các policy RLS. Bao gồm:

- Đăng ký, onboarding, đăng nhập và middleware.
- Các route UI, component sidebar/topbar và API routes.
- Query Supabase, RPC, trigger, CHECK constraint và RLS policy.
- Dữ liệu đề, nhóm/lớp, phòng thi, submissions, điểm, AI usage và gói dịch vụ.
- Admin dashboard, phân tích, báo cáo và các thống kê đếm người học/người đánh giá.
- Seed data, tests, mock/demo data và tài liệu vận hành.

### 14.3. Chiến lược migration

Trình tự đề xuất:

1. Chốt mô hình nghiệp vụ/quyền và ghi các quyết định có ảnh hưởng lớn.
2. Thiết kế schema/entitlement/membership đích.
3. Viết migration bổ sung tương thích để biểu diễn owner/scope/quyền mới mà không làm mất lịch sử.
4. Backfill dữ liệu cũ, ánh xạ các tài nguyên và tài khoản hiện hữu sang mô hình đích.
5. Chuyển API/service sang kiểm tra quyền mới, kèm test bảo mật.
6. Chuyển đăng ký/onboarding và điều hướng.
7. Gộp giao diện Personal và hoàn thiện Organization Workspace.
8. Chạy kiểm thử hồi quy, kiểm thử truy cập chéo và diễn tập rollback.
9. Chỉ loại bỏ cột, trigger, policy hoặc endpoint cũ sau khi không còn consumer và có kế hoạch rollback được chấp thuận.

### 14.4. Bảo toàn dữ liệu

- Không xóa hoặc tái tạo tài khoản người dùng nhằm đơn giản hóa migration.
- Giữ nguyên quan hệ submissions, kết quả, bằng chứng năng lực, điểm ledger, chứng chỉ, thành viên và nội dung đã tạo.
- Khi một tài nguyên cũ không thể xác định scope an toàn, đưa vào báo cáo đối soát để xử lý, không tự gán công khai.
- Mỗi bước migration cần có kiểm tra số lượng bản ghi trước/sau, foreign key, nullability và trường hợp dữ liệu bất thường.

---

## 15. Phạm vi triển khai theo giai đoạn

### Giai đoạn 1 — Chốt mô hình và bảo mật

- Cập nhật PRD, Actor Matrix, Use Case, business rules và ma trận quyền.
- Định nghĩa workspace, ownership, membership, entitlement và quota.
- Audit API/RLS/schema đang phụ thuộc vai trò cũ.
- Chốt chính sách quyền đối với đề, đáp án, nhóm, phòng thi, bài nộp và điểm.

### Giai đoạn 2 — Lớp quyền và dữ liệu

- Triển khai mô hình quyền theo tài khoản, tài nguyên, workspace và membership.
- Tách entitlement cá nhân khỏi entitlement tổ chức.
- Viết migration/backfill và kiểm thử dữ liệu.
- Cưỡng chế authorization ở server/database trước khi hoàn thiện UI.

### Giai đoạn 3 — Personal Workspace

- Gộp trải nghiệm Người học và Người đánh giá.
- Cho phép tài khoản Free làm bài, tạo đề, tạo nhóm và mở phòng thi trong hạn mức.
- Triển khai thông báo quota/entitlement.
- Giữ nguyên các khả năng học tập, radar, lộ trình, lịch sử và chứng chỉ phù hợp.

### Giai đoạn 4 — Organization Workspace

- Hoàn thiện vòng đời tổ chức và lời mời thành viên.
- Quản lý thành viên, nhóm/lớp, vai trò và tài nguyên tổ chức.
- Bổ sung chuyển workspace, báo cáo tổ chức và quota AI dùng chung.
- Xử lý trạng thái hết hạn/ngưng hoạt động và khả năng truy cập dữ liệu lịch sử.

### Giai đoạn 5 — Thương mại và vận hành

- Chuẩn hóa catalog gói, checkout/giao dịch, xác minh thanh toán và entitlement.
- Báo cáo sử dụng AI/chi phí, quota và giới hạn theo workspace.
- Hoàn thiện audit, analytics, export và giám sát.
- Kiểm thử nghiệm thu xuyên suốt và rà soát bảo mật trước phát hành.

Các giai đoạn có thể được chia thành vertical slices nhỏ hơn. Không dùng tiến độ giao diện làm bằng chứng cho việc một luồng nghiệp vụ đã hoàn tất.

---

## 16. Tiêu chí nghiệm thu bắt buộc

### 16.1. Tài khoản và Personal Workspace

- [ ] Người dùng mới đăng ký không phải chọn `LEARNER` hoặc `EVALUATOR`.
- [ ] Một tài khoản có thể làm bài và tạo đề mà không phải đổi loại tài khoản.
- [ ] Tài khoản Free có thể làm bài, xem radar cơ bản, tạo đề, tạo nhóm và mở phòng Live trong hạn mức được cấu hình.
- [ ] Vượt quota trả về lỗi nghiệp vụ rõ ràng và không tạo tài nguyên dở dang.
- [ ] Không thể tự nâng gói, tự tăng quota, tự sửa điểm hoặc tự cấp quyền bằng payload từ client.

### 16.2. Tài nguyên và bảo mật

- [ ] Người dùng không thể đọc/sửa đề riêng của tài khoản khác nếu không được chia sẻ.
- [ ] Người làm bài không thể truy vấn trực tiếp đáp án/rubric trái phép.
- [ ] Chỉ người được phép mới xem bài nộp, kết quả và minh chứng của người khác.
- [ ] Thành viên tổ chức A không thể xem dữ liệu riêng của tổ chức B.
- [ ] Thay URL hoặc gọi API trực tiếp không thể vượt quyền UI.
- [ ] RLS và authorization phía server đều được kiểm thử.

### 16.3. Organization Workspace

- [ ] Một tài khoản có thể tham gia nhiều tổ chức nếu được mời/cấp quyền.
- [ ] Người dùng có thể chuyển workspace mà không cần tài khoản khác.
- [ ] Membership hết hạn/bị thu hồi sẽ không còn thực hiện được hành động trong tổ chức đó.
- [ ] Chỉ vai trò được phép mới quản lý thành viên, phân quyền, đề và báo cáo.
- [ ] Tài nguyên tổ chức luôn được gắn đúng phạm vi và không tự rò rỉ thành tài nguyên cá nhân/công khai.

### 16.4. Gói dịch vụ và AI

- [ ] Free/Pro/Business được cấp quyền qua một cơ chế entitlement thống nhất.
- [ ] Pro cá nhân không tự động cấp quyền quản trị tổ chức.
- [ ] Business quota được tính vào đúng tổ chức hoặc chủ thể tiêu thụ theo chính sách.
- [ ] Tác vụ AI có ghi nhận sử dụng đủ để kiểm tra quota/chi phí theo thiết kế.
- [ ] Lỗi AI không dẫn đến tính quota sai so với chính sách đã công bố.

### 16.5. Dữ liệu lịch sử và chứng chỉ

- [ ] Migration giữ được tài khoản, bài nộp, kết quả, điểm, radar, chứng chỉ và quan hệ tổ chức hợp lệ.
- [ ] Điểm bài thi, điểm năng lực và điểm tích lũy không bị gộp thành một khái niệm.
- [ ] Không thể tự phát hành chứng chỉ chính thức chỉ bằng việc tạo đề hoặc mua gói.
- [ ] Các chỉnh sửa đặc quyền lên kết quả/chứng chỉ có audit log.

### 16.6. Chất lượng phát hành

- [ ] Có unit/integration tests cho quyền sở hữu, quota, membership và trạng thái workspace.
- [ ] Có kiểm thử hồi quy cho các luồng đăng nhập, làm bài, chấm bài, Live room, billing và Admin.
- [ ] Có migration verification và kế hoạch rollback phù hợp.
- [ ] Tài liệu PRD, Use Case, business rules và kiến trúc không còn mâu thuẫn với mô hình mới.

---

## 17. Các quyết định cần chốt trước khi triển khai chi tiết

Những mục dưới đây là quyết định sản phẩm/chính sách còn cần định nghĩa; không được tự ý suy diễn trong code:

1. **Quota cụ thể:** số đề đang hoạt động, số nhóm, số thành viên mỗi nhóm, số phiên Live, quy mô tối đa mỗi phòng và quota AI cho từng gói.
2. **Điều kiện sử dụng AI:** tác vụ nào dùng quota miễn phí, tác vụ nào thuộc Pro/Business, cách hoàn quota khi lỗi và chính sách khi hết hạn mức.
3. **Chuyển quyền sở hữu tài nguyên:** điều kiện chuyển một đề/nhóm/phòng từ cá nhân sang tổ chức hoặc chia sẻ ngược lại; mặc định không tự chuyển.
4. **Thẩm quyền chấm và xác nhận kết quả:** quyền tạo đề, quyền chấm, quyền duyệt cuối và điều kiện yêu cầu human review.
5. **Chứng chỉ chính thức:** track đánh giá, ngưỡng đạt, bằng chứng bắt buộc, người/đơn vị phát hành, thời hạn và quy trình thu hồi.
6. **Chính sách lưu trữ:** thời hạn lưu bài nộp, minh chứng, log giám sát, audit log và dữ liệu sau khi tổ chức hết hạn.
7. **Mô hình thương mại Business:** tính phí theo số chỗ, số người dùng hoạt động, hợp đồng, quota hoặc kết hợp các cách này.
8. **Quyền với dữ liệu sau khi rời tổ chức:** quyền xem của người dùng, tổ chức cũ và cách xử lý bài nộp/kết quả đã phát sinh.
9. **Tên/route kỹ thuật cuối cùng:** có thể giữ redirect tương thích cho đường dẫn cũ trong giai đoạn chuyển đổi; không ưu tiên đổi URL hơn bảo mật và bảo toàn dữ liệu.

Các quyết định phải được ghi thành business rules hoặc Architecture Decision Records (ADR) và liên kết với test nghiệm thu.

---

## 18. Hướng dẫn cho AI coding agent

Khi sử dụng tài liệu này để thực hiện thay đổi repository, agent phải tuân thủ các nguyên tắc sau:

1. Đọc PRD, requirements, Use Case, architecture docs, schema/migrations, middleware và các API liên quan trước khi sửa.
2. Lập danh sách phụ thuộc vào `LEARNER`/`EVALUATOR` và phân loại theo database, server, API, UI, test, seed và documentation.
3. Không thực hiện refactor diện rộng chỉ dựa trên tìm-thay-thế chuỗi.
4. Không xóa hoặc sửa migration đã áp dụng theo cách làm mất lịch sử; tạo migration mới theo quy trình của dự án.
5. Không bỏ qua RLS hoặc thay bằng kiểm tra ở frontend.
6. Không dùng dữ liệu demo/localStorage để giả lập quyền production.
7. Không tự đặt quota hoặc giá khi quyết định chưa được chốt. Dùng cấu hình rõ ràng và đánh dấu phần cần quyết định.
8. Bảo toàn dữ liệu cũ và cung cấp cách đối soát migration.
9. Thực hiện thay đổi theo vertical slices, bổ sung tests cho từng luồng và báo cáo rõ phần đã/ chưa hoàn tất.
10. Không tuyên bố use case hoàn tất chỉ vì có trang UI; phải chứng minh luồng từ đầu đến cuối, persistence, quyền, ngoại lệ và kiểm thử.
11. Khi phát hiện mâu thuẫn giữa tài liệu cũ và đặc tả này, ghi nhận mâu thuẫn, ưu tiên mô hình đích của tài liệu này cho phần sản phẩm mới và đề xuất cập nhật tài liệu cũ có kiểm soát.
12. Không tự ý mở quyền cấp chứng chỉ, duyệt nội dung chuẩn, đọc dữ liệu liên tổ chức hoặc quản trị nền tảng cho tài khoản cá nhân.

---

## 19. Tóm tắt quyết định sản phẩm

NEXA AI sử dụng **một danh tính cá nhân thống nhất**, cho phép người dùng vừa tham gia đánh giá vừa tổ chức đánh giá trong giới hạn gói dịch vụ. Personal Workspace là nơi làm việc mặc định và Free phải có giá trị sử dụng thực tế, bao gồm quyền cơ bản để tạo đề, lập nhóm và mở phòng thi trực tiếp theo quota.

Organization Workspace là môi trường đa thành viên có quản trị, phân quyền, tài nguyên dùng chung, báo cáo, quota và thanh toán theo tổ chức. Đây là sản phẩm khác biệt về năng lực quản trị, không chỉ là phiên bản cá nhân có hạn mức lớn hơn.

Platform Admin được bảo vệ như một lớp đặc quyền độc lập, quản trị toàn hệ thống và không bị gộp vào vai trò tổ chức.

**Quy tắc quan trọng nhất:** quyền truy cập được xác định bởi danh tính đã xác thực + workspace + ownership/membership + quyền trên tài nguyên + entitlement/quota + trạng thái nghiệp vụ. Không có thành tố nào trong đó được thay thế chỉ bằng loại tài khoản hoặc giao diện người dùng.
