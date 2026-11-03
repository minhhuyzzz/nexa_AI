# NEXA AI — Đặc tả Use Case theo 4 Actor & Rà soát CRUD

**Phiên bản:** 1.1 · **Ngày:** 03/11/2026  
**Trạng thái:** Đề xuất nghiệp vụ để duyệt / đối chiếu với code, chưa phải xác nhận đã triển khai.  
**Đối chiếu kỹ thuật:** Repository `minhhuyzzz/nexa_AI`, nhánh `main` tại thời điểm rà soát.

## 0. Phạm vi Actor và nguyên tắc

- **Guest**: người chưa đăng nhập, dùng website công khai; **không có dashboard riêng**.
- **Personal User**: mọi người dùng đã đăng nhập, bao gồm **Member của tổ chức**; dùng **Personal Dashboard**.
- **Organization Admin**: `ORG_OWNER` / `ORG_ADMIN`, quản trị dữ liệu trong phạm vi tổ chức; có thể dùng cả Personal và Organization Dashboard.
- **System Admin**: người vận hành NEXA, dùng **Platform Admin Dashboard**, quản trị dịch vụ và nội dung chính thức của nền tảng.

**Quy tắc thiết kế**: một tài khoản có thể mang nhiều vai trò; vai trò không đồng nghĩa với việc phải có dashboard riêng. Không tạo Organization Dashboard cho Member. System Admin **không mặc nhiên sửa nội dung riêng, bài làm hoặc điểm cá nhân** của khách hàng.

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

## 2. Actor: Personal User — Người dùng cá nhân

| Mã UC | Tên Use Case | Mô tả ngắn |
| --- | --- | --- |
| UC-P01 | Quản lý hồ sơ cá nhân | Xem, cập nhật hồ sơ và thiết lập tài khoản. |
| UC-P02 | Thực hiện đánh giá năng lực ban đầu | Làm bài đánh giá đầu vào để tạo cơ sở hồ sơ năng lực. |
| UC-P03 | Tra cứu bài đánh giá | Tìm kiếm, lọc và xem thông tin các đề do NEXA phát hành; nhận biết đề miễn phí hoặc cần nâng cấp. |
| UC-P04 | Thực hiện bài đánh giá tự chọn | Bắt đầu và trả lời đề từ thư viện NEXA khi đủ quyền truy cập. |
| UC-P05 | Nộp bài đánh giá | Gửi đáp án trắc nghiệm, văn bản, tệp và/hoặc liên kết theo yêu cầu của đề. |
| UC-P06 | Xem kết quả đánh giá | Xem điểm, nhận xét và trạng thái công bố theo chính sách của bài. |
| UC-P07 | Xem hồ sơ năng lực số cá nhân | Theo dõi kết quả đánh giá 5 miền năng lực và các lần cập nhật hợp lệ. |
| UC-P08 | Tham gia lộ trình học tập | Truy cập học phần và các bài đánh giá NEXA gắn với lộ trình. |
| UC-P09 | Theo dõi tiến độ lộ trình học tập | Xem bước đã hoàn thành, bước tiếp theo và mục tiêu cá nhân. |
| UC-P10 | Tham gia lớp hoặc nhóm | Gia nhập lớp/nhóm cá nhân hoặc lớp/nhóm thuộc tổ chức theo quyền hợp lệ. |
| UC-P11 | Tham gia tổ chức | Chấp nhận lời mời, liên kết hoặc nhập mã tham gia tổ chức. |
| UC-P12 | Tiếp nhận và thực hiện bài đánh giá được giao | Xem bài giao từ **lớp cá nhân và lớp thuộc tổ chức trong cùng một mục “Bài được giao”**; dùng chung luồng làm và nộp bài. |
| UC-P13 | Quản lý đề đánh giá cá nhân | Soạn, tạo, chỉnh sửa, kiểm định và sử dụng đề thuộc quyền sở hữu cá nhân. |
| UC-P14 | Tổ chức phòng thi trực tiếp cá nhân | Tạo và điều hành phiên thi trực tiếp trong phạm vi cá nhân được phép. |
| UC-P15 | Đóng góp nội dung đánh giá | Gửi đề/câu hỏi cho NEXA xem xét đưa vào nội dung chung. |
| UC-P16 | Xem bảng xếp hạng | Theo dõi điểm hoạt động PTS và thứ hạng theo chính sách công bố. |
| UC-P17 | Xem chứng chỉ và thành tích | Xem chứng chỉ hoặc thành tích hợp lệ đã được cấp. |
| UC-P18 | Quản lý gói dịch vụ cá nhân | Xem quyền lợi, nâng cấp/gia hạn và lịch sử gói cá nhân. |
| UC-P19 | Tham gia phòng thi trực tiếp | Nhập mã hoặc mở liên kết phiên thi và làm bài với tư cách thí sinh. |

## 3. Actor: Organization Admin — Quản trị viên tổ chức

| Mã UC | Tên Use Case | Mô tả ngắn |
| --- | --- | --- |
| UC-O01 | Xem tổng quan hoạt động tổ chức | Xem tình hình thành viên, lớp, đợt đánh giá và công việc cần xử lý. |
| UC-O02 | Quản lý thành viên tổ chức | Xem, mời, duyệt tham gia, cập nhật tư cách thành viên và loại thành viên khi cần. |
| UC-O03 | Quản lý phương thức mời tham gia tổ chức | Cung cấp **mã tham gia, liên kết mời hoặc gửi lời mời trực tiếp qua email**. Không có chức năng QR hay thu hồi mã trong phạm vi UX đã chốt. |
| UC-O04 | Quản lý lớp và nhóm | Tạo, xem, chỉnh sửa và lưu trữ lớp/nhóm trực thuộc tổ chức. |
| UC-O05 | Quản lý thành viên lớp/nhóm | Thêm, điều chuyển và loại thành viên khỏi lớp/nhóm. |
| UC-O06 | Quản lý đề đánh giá nội bộ | Soạn, chỉnh sửa, kiểm định, phát hành và ngừng sử dụng đề của tổ chức. |
| UC-O07 | Tạo và phát hành đợt đánh giá | Chọn tên đợt tự đặt, đề, lớp/nhóm, thời gian và xác nhận phát hành. |
| UC-O08 | Quản lý đợt đánh giá | Xem danh sách, điều chỉnh theo trạng thái, kết thúc hoặc lưu trữ đợt. |
| UC-O09 | Theo dõi tình trạng hoàn thành bài đánh giá | Theo dõi **Chưa làm** và **Đã làm (đã nộp)** theo danh sách người được giao; **không** hiển thị trạng thái “Đang làm” trong trang theo dõi. |
| UC-O10 | Chấm bài tự luận và thực hành | Xem bài, minh chứng, chấm rubric và nhập nhận xét. |
| UC-O11 | Duyệt và công bố kết quả đánh giá | Xác nhận kết quả chính thức, sau đó công bố cho người học theo chính sách. |
| UC-O12 | Xem báo cáo năng lực tổ chức | Xem thống kê kết quả hợp lệ theo 5 miền năng lực trong phạm vi tổ chức. |
| UC-O13 | So sánh kết quả đánh giá | So sánh các lớp/nhóm và đợt đánh giá có cơ sở đối chiếu phù hợp. |
| UC-O14 | Xuất báo cáo đánh giá | Xuất số liệu và báo cáo đúng quyền, đúng phạm vi tổ chức. |
| UC-O15 | Quản lý cấu hình tổ chức | Cập nhật thông tin và thiết lập vận hành của tổ chức. |
| UC-O16 | Xem gói Business và hạn mức sử dụng | Theo dõi ghế, số đề, AI Credits, thời hạn và quyền lợi hiện hành. |
| UC-O17 | Gửi yêu cầu gia hạn hoặc điều chỉnh gói Business | Đề nghị xử lý gia hạn hoặc thay đổi quyền lợi dịch vụ. |
| UC-O18 | Tạo phòng thi trực tiếp của tổ chức | Chọn đề, đối tượng tham gia, thời gian và tạo phiên thi trong phạm vi tổ chức. |
| UC-O19 | Điều hành phòng thi trực tiếp | Mở phòng, cung cấp mã tham gia, điều khiển phiên, đóng phiên; chỉ hiển thị trạng thái kỹ thuật khi được hỗ trợ thật. |
| UC-O20 | Xem kết quả phòng thi trực tiếp | Tra cứu bài đã nộp, kết quả chấm và công bố hợp lệ của phiên thi. |

## 4. Actor: System Admin — Quản trị viên nền tảng NEXA

| Mã UC | Tên Use Case | Mô tả ngắn |
| --- | --- | --- |
| UC-A01 | Giám sát vận hành nền tảng | Xem công việc cần xử lý, cảnh báo và sức khỏe dịch vụ. |
| UC-A02 | Quản lý tài khoản người dùng | Tra cứu, hỗ trợ, cập nhật trạng thái và xử lý khóa/mở tài khoản theo quyền. |
| UC-A03 | Xử lý yêu cầu đăng ký Business | Tiếp nhận, cập nhật tiến độ tư vấn và xử lý yêu cầu đăng ký. |
| UC-A04 | Quản lý tổ chức khách hàng | Tạo, xem, kích hoạt, tạm ngừng, đóng và hỗ trợ hồ sơ tổ chức. |
| UC-A05 | Quản lý danh mục gói dịch vụ | Tạo, xem, chỉnh sửa và ngừng cung cấp gói Personal/Business. |
| UC-A06 | Quản lý quyền lợi dịch vụ | Cấp, điều chỉnh và theo dõi ghế, số đề, AI Credits và thời hạn. |
| UC-A07 | Xử lý yêu cầu gia hạn Business | Kiểm tra, phê duyệt và ghi nhận thay đổi quyền lợi/thời hạn. |
| UC-A08 | Đối soát giao dịch thanh toán | Xem giao dịch, xác minh chứng từ và xử lý ngoại lệ có audit. |
| UC-A09 | Xem báo cáo kinh doanh nền tảng | Xem doanh thu xác minh, gói đang sử dụng và tình trạng khách hàng. |
| UC-A10 | Quản lý ngân hàng bài đánh giá NEXA | Tạo, xem, sửa, kiểm định, phát hành và ngừng phát hành đề dùng trong Personal. |
| UC-A11 | Cấu hình quyền truy cập bài đánh giá | Phân loại đề Free/Premium và kiểm soát điều kiện làm bài theo gói. |
| UC-A12 | Quản lý lộ trình học tập NEXA | Tạo, xem, chỉnh sửa, sắp xếp, phát hành và lưu trữ lộ trình. |
| UC-A13 | Quản lý học phần và học liệu | Quản lý nội dung, tài nguyên và thứ tự học phần. |
| UC-A14 | Liên kết bài đánh giá với lộ trình | Gắn đề từ ngân hàng NEXA vào học phần, đặt điều kiện hoàn thành. |
| UC-A15 | Kiểm duyệt nội dung đóng góp | Duyệt, yêu cầu chỉnh sửa hoặc từ chối nội dung cộng đồng. |
| UC-A16 | Quản lý phiên bản khung năng lực | Quản lý cấu trúc tham chiếu 5 miền, kỹ năng và phiên bản có kiểm soát. |
| UC-A17 | Phân tích hiệu quả nội dung học tập | Theo dõi lượt sử dụng và kết quả tổng hợp hợp lệ của đề/lộ trình. |
| UC-A18 | Giám sát AI Gateway | Theo dõi số lượt gọi, lỗi, độ trễ, chi phí và mức tiêu thụ theo tính năng/tổ chức. |
| UC-A19 | Quản lý cấu hình AI Gateway | Cấu hình mô hình và tham số vận hành AI theo quyền được cấp. |
| UC-A20 | Xử lý yêu cầu hỗ trợ người dùng | Tiếp nhận, phân loại và xử lý phản hồi/yêu cầu hỗ trợ. |
| UC-A21 | Quản lý thông báo nền tảng | Soạn, gửi và theo dõi thông báo đến nhóm người dùng phù hợp. |
| UC-A22 | Giám sát bảo mật và nhật ký kiểm toán | Tra cứu sự kiện nhạy cảm, hoạt động quản trị và cảnh báo. |
| UC-A23 | Quản lý quyền quản trị viên hệ thống | Cấp, điều chỉnh và thu hồi vai trò Admin nội bộ theo phân quyền. |
| UC-A24 | Quản lý cấu hình nền tảng | Quản lý thiết lập chung và chính sách hệ thống. |
| UC-A25 | Quản lý quy tắc điểm PTS và cấp độ | Cấu hình hoặc giám sát chính sách điểm thưởng, cấp độ và thành tích cá nhân. |
| UC-A26 | Quản lý chính sách chứng chỉ | Quản lý mẫu, điều kiện phát hành và trạng thái chứng chỉ NEXA. |
| UC-A27 | Hỗ trợ xử lý sự cố đánh giá và phòng thi | Tra cứu, chẩn đoán sự cố theo yêu cầu; không tự ý thay điểm, làm bài hoặc chấm thay tổ chức. |

### Quyền System Admin trên Personal và Organization

**Có quản trị toàn nền tảng, nhưng không đồng nghĩa có toàn quyền nghiệp vụ của người dùng:**

- **Đối với Personal:** quản lý tài khoản, gói, quyền truy cập Free/Premium, ngân hàng đề chính thức NEXA, lộ trình, học liệu, chính sách PTS/chứng chỉ và hỗ trợ. **Không mặc định** được làm bài, sửa đáp án, sửa điểm cá nhân hoặc đọc hồ sơ riêng tư không có căn cứ.
- **Đối với Organization:** quản lý khách hàng/tổ chức, kích hoạt, trạng thái dịch vụ, gói/hạn mức, gia hạn, hỗ trợ kỹ thuật và các chính sách tenant. **Không mặc định** thay Admin tổ chức giao đề, sửa danh sách lớp, chấm bài hoặc sửa kết quả nội bộ.
- Các thao tác đặc biệt để hỗ trợ sự cố cần **phân quyền riêng, lý do, audit log và giới hạn phạm vi**. Quyền thực hiện ở API/database; việc hiển thị menu không đủ.
