**NEXA AI**

**ĐẶC TẢ YÊU CẦU PHẦN MỀM**

SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

Nền tảng đánh giá và phát triển năng lực số

**Phiên bản 2.0 \| 03/11/2026**

Phạm vi: Website công khai • Personal • Organization • Platform Admin


## Mục lục

1. Giới thiệu và mục tiêu

2. Phạm vi sản phẩm

3. Actor và quyền truy cập

4. Mô hình nghiệp vụ tổng thể

5. Yêu cầu chức năng – Guest

6. Yêu cầu chức năng – Personal User

7. Yêu cầu chức năng – Organization Admin

8. Yêu cầu chức năng – System Admin

9. Đánh giá, chấm điểm và công bố

10. Ngân hàng đề NEXA và phân quyền nội dung

11. Lộ trình học tập và hồ sơ năng lực

12. Lớp/nhóm, giao bài và phòng thi trực tiếp

13. Gói dịch vụ, Business và thanh toán

14. Báo cáo, AI và vận hành nền tảng

15. Quy tắc nghiệp vụ bắt buộc

16. Dữ liệu và mối quan hệ logic

17. Yêu cầu giao diện và tích hợp

18. Yêu cầu phi chức năng

19. Ma trận quyền và phạm vi dữ liệu

20. Kịch bản nghiệp vụ và kiểm thử

21. Tiêu chí nghiệm thu và truy vết

22. Các vấn đề cần xác nhận

# 1. Giới thiệu và mục tiêu

## 1.1. Mô tả sản phẩm

NEXA AI là nền tảng web phục vụ đánh giá và phát triển năng lực số cho cá nhân, đồng thời cung cấp không gian quản lý đánh giá cho tổ chức và công cụ vận hành SaaS cho đội ngũ NEXA. Hệ thống sử dụng bài đánh giá, kết quả chấm, hồ sơ năng lực theo 5 miền và lộ trình học tập để hỗ trợ quá trình phát triển năng lực.

## 1.2. Mục tiêu

- Cho phép người dùng cá nhân tìm, làm bài đánh giá miễn phí/trả phí và học theo lộ trình do NEXA cung cấp.

- Cho phép tổ chức quản lý thành viên, lớp/nhóm, đề nội bộ, đợt đánh giá, chấm bài và báo cáo.

- Cho phép NEXA vận hành nội dung chính thức, gói dịch vụ, khách hàng Business, tài chính, AI và bảo mật.

- Bảo đảm luồng đánh giá và tính điểm thống nhất, có nguồn dữ liệu rõ ràng và kiểm soát quyền truy cập.

## 1.3. Quy ước thuật ngữ và mã

UC-Gxx: Guest; UC-Pxx: Personal User; UC-Oxx: Organization Admin; UC-Axx: System Admin. FR-G/P/O/Axx: yêu cầu chức năng liên kết trực tiếp UC tương ứng. BR-xx: quy tắc nghiệp vụ; NFR-xx: yêu cầu phi chức năng; AC-xx: tiêu chí nghiệm thu.


> **NGUYÊN TẮC TÀI LIỆU**
>
> Đây là SRS của mô hình sản phẩm mục tiêu. Các trạng thái “đã có trong code” hoặc lộ trình triển khai cần được quản lý bằng tài liệu GAP/Implementation riêng, không suy diễn từ SRS.


# 2. Phạm vi sản phẩm

## 2.1. Trong phạm vi

| **Không gian**               | **Phạm vi chức năng**                                                                                                                |
|------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| **Website công khai**        | Giới thiệu nền tảng, gói dịch vụ, đăng ký, đăng nhập, khôi phục truy cập và tiếp nhận yêu cầu Business.                              |
| **Personal Dashboard**       | Thực hiện đánh giá; kết quả, hồ sơ 5 miền; lộ trình học; lớp/nhóm và bài giao; đề cá nhân, phòng thi, đóng góp; gói, PTS, chứng chỉ. |
| **Organization Dashboard**   | Quản lý tổ chức, thành viên/lớp, đề nội bộ, đợt đánh giá, phòng thi, chấm bài, báo cáo, gói Business.                                |
| **Platform Admin Dashboard** | Quản lý toàn bộ nội dung NEXA dành cho Personal, khách hàng, gói, thanh toán, quyền lợi, AI, hỗ trợ, bảo mật và cấu hình.            |

## 2.2. Ngoài phạm vi hoặc không mặc định

- Không có Guest Dashboard và không có Organization Dashboard dành riêng cho Member.

- Không áp dụng mô hình bắt buộc hợp đồng/đàm phán/ký kết để dùng gói Business.

- Không dùng QR cho chức năng mời tham gia tổ chức và không yêu cầu UI thu hồi mã theo phạm vi đã chốt.

- Không buộc Organization Admin theo dõi tình trạng “Đang làm” trong bảng tiến độ giao bài.

- Không mặc định cho System Admin xem/sửa bài làm, điểm cá nhân, lớp và dữ liệu riêng của khách hàng.

- Không tạo loại câu hỏi độc lập “Tình huống”; tình huống là bối cảnh hỗ trợ câu trắc nghiệm hoặc tự luận/thực hành.

# 3. Actor và quyền truy cập

| **Actor**              | **Định nghĩa**                                                   | **Khu vực truy cập**                                                       |
|------------------------|------------------------------------------------------------------|----------------------------------------------------------------------------|
| **Guest**              | Người chưa đăng nhập.                                            | Website công khai.                                                         |
| **Personal User**      | Tài khoản đã đăng nhập, bao gồm Member của tổ chức.              | Personal Dashboard.                                                        |
| **Organization Admin** | ORG_OWNER hoặc ORG_ADMIN, chịu trách nhiệm phạm vi tổ chức.      | Personal Dashboard và Organization Dashboard tương ứng.                    |
| **System Admin**       | Nhân sự vận hành nền tảng NEXA, theo phân quyền quản trị nội bộ. | Platform Admin Dashboard; hỗ trợ có kiểm soát đối với tài nguyên hệ thống. |

Một tài khoản có thể đồng thời là Personal User và Organization Admin. Vai trò được kiểm tra bằng quyền thực tế ở API/database, không chỉ qua điều hướng. System Admin không phải một “người dùng tổ chức có mọi quyền” và không thay thế tác nghiệp đánh giá của khách hàng.

# 4. Mô hình nghiệp vụ tổng thể

## 4.1. Chuỗi giá trị B2C – Personal

System Admin soạn và phát hành bài đánh giá NEXA (Free/Premium) → Personal User tra cứu hoặc học theo lộ trình → kiểm tra quyền truy cập → làm/nộp bài → chấm phù hợp loại câu hỏi → công bố kết quả → cập nhật hồ sơ năng lực và tiến độ học tập.

## 4.2. Chuỗi giá trị B2B – Organization

Guest gửi yêu cầu Business → System Admin kích hoạt tổ chức và gói → Organization Admin mời thành viên, tạo lớp, đề và đợt → Personal User nhận bài trong Personal → chấm tự động/thủ công → Admin tổ chức công bố → báo cáo → xem hạn mức/gửi yêu cầu gia hạn.

## 4.3. Ba ranh giới sở hữu

- NEXA-owned: bài đánh giá công khai, lộ trình chính thức, học liệu NEXA, cấu hình Free/Premium.

- User-owned: hồ sơ cá nhân, đề cá nhân, phiên thi cá nhân, kết quả và quyền riêng tư của người dùng.

- Organization-owned: thành viên, lớp/nhóm, đề nội bộ, đợt đánh giá, bài nộp và báo cáo thuộc tổ chức.

# 5. Yêu cầu chức năng – Guest

Nhóm chức năng website công khai. Không có UC-G03 theo phạm vi được duyệt; mã còn lại giữ nguyên để đảm bảo truy vết.

| **Mã FR**  | **Use Case** | **Chức năng**                   | **Yêu cầu hệ thống / kết quả mong đợi**                                                                                                 |
|------------|--------------|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| **FR-G01** | UC-G01       | Xem thông tin nền tảng          | Hiển thị thông tin chính thức về NEXA, đối tượng sử dụng và tính năng chính. \| Kết quả: Có thể xem không đăng nhập.                    |
| **FR-G02** | UC-G02       | Xem thông tin gói dịch vụ       | Hiển thị bảng gói Personal và Business cùng quyền lợi, giá, điều kiện hiện hành. \| Kết quả: Thông tin đồng bộ chính sách đang công bố. |
| **FR-G04** | UC-G04       | Đăng ký tài khoản               | Cho phép đăng ký, xác thực và tạo hồ sơ theo cơ chế đăng nhập được hỗ trợ. \| Kết quả: Không tạo tài khoản trùng danh tính.             |
| **FR-G05** | UC-G05       | Đăng nhập hệ thống              | Xác thực thông tin; chuyển vào không gian phù hợp sau đăng nhập. \| Kết quả: Từ chối phiên không hợp lệ.                                |
| **FR-G06** | UC-G06       | Yêu cầu khôi phục mật khẩu      | Cho phép khởi tạo quy trình khôi phục truy cập. \| Kết quả: Không tiết lộ tài khoản có tồn tại hay không qua lỗi nhạy cảm.              |
| **FR-G07** | UC-G07       | Gửi yêu cầu tư vấn gói Business | Tiếp nhận tổ chức, người liên hệ và nhu cầu cơ bản. \| Kết quả: Tạo yêu cầu cho System Admin xử lý.                                     |
| **FR-G08** | UC-G08       | Mở liên kết mời tham gia        | Mở lời mời lớp/tổ chức; yêu cầu xác thực nếu chưa đăng nhập. \| Kết quả: Giữ ngữ cảnh lời mời sau đăng nhập.                            |

# 6. Yêu cầu chức năng – Personal User

Personal là không gian chung cho mọi người dùng đăng nhập, bao gồm thành viên thuộc một hoặc nhiều tổ chức. Người dùng có quyền Owner/Admin tổ chức cũng có thể sử dụng các tính năng Personal.

| **Mã FR**  | **Use Case** | **Chức năng**                                 | **Yêu cầu hệ thống / kết quả mong đợi**                                                                                                                                                              |
|------------|--------------|-----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **FR-P01** | UC-P01       | Quản lý hồ sơ cá nhân                         | Xem và cập nhật thuộc tính hồ sơ/thiết lập do người dùng kiểm soát. \| Kết quả: Chỉ sửa dữ liệu thuộc quyền.                                                                                         |
| **FR-P02** | UC-P02       | Thực hiện đánh giá năng lực ban đầu           | Cho phép bắt đầu bài đầu vào hợp lệ và ghi nhận kết quả. \| Kết quả: Không tạo dữ liệu năng lực giả khi chưa có bài hoàn tất.                                                                        |
| **FR-P03** | UC-P03       | Tra cứu bài đánh giá                          | Tìm/lọc bài NEXA đã phát hành, hiển thị điều kiện Free/Premium. \| Kết quả: Bài nháp hoặc ngừng phát hành không xuất hiện.                                                                           |
| **FR-P04** | UC-P04       | Thực hiện bài đánh giá tự chọn                | Kiểm tra điều kiện gói và tạo phiên làm bài hợp lệ. \| Kết quả: Không cho vào bài Premium khi chưa đủ quyền.                                                                                         |
| **FR-P05** | UC-P05       | Nộp bài đánh giá                              | Ghi nhận đáp án, nội dung tự luận, tệp và liên kết theo yêu cầu. \| Kết quả: Có thời điểm nộp và bằng chứng lưu thành công.                                                                          |
| **FR-P06** | UC-P06       | Xem kết quả đánh giá                          | Hiển thị điểm từng phần và kết quả chính thức theo chính sách công bố. \| Kết quả: Chưa chấm/chưa công bố có trạng thái rõ ràng.                                                                     |
| **FR-P07** | UC-P07       | Xem hồ sơ năng lực số cá nhân                 | Tổng hợp 5 miền năng lực từ kết quả đủ điều kiện. \| Kết quả: Phân biệt chưa có dữ liệu với điểm 0.                                                                                                  |
| **FR-P08** | UC-P08       | Tham gia lộ trình học tập                     | Truy cập lộ trình/học phần do NEXA phát hành theo quyền gói. \| Kết quả: Hiển thị nội dung và yêu cầu hoàn thành.                                                                                    |
| **FR-P09** | UC-P09       | Theo dõi tiến độ lộ trình học tập             | Cập nhật và xem tiến độ bước học, bài đánh giá và mục tiêu. \| Kết quả: Tiến độ dựa trên dữ liệu thực.                                                                                               |
| **FR-P10** | UC-P10       | Tham gia lớp hoặc nhóm                        | Tham gia lớp cá nhân hoặc lớp tổ chức theo mã, lời mời hay quyền được cấp. \| Kết quả: Thể hiện rõ nguồn lớp và tư cách tham gia.                                                                    |
| **FR-P11** | UC-P11       | Tham gia tổ chức                              | Chấp nhận liên kết/lời mời hoặc nhập mã tham gia tổ chức. \| Kết quả: Liên kết đúng tổ chức và tài khoản.                                                                                            |
| **FR-P12** | UC-P12       | Tiếp nhận và thực hiện bài đánh giá được giao | Gộp bài của lớp cá nhân và lớp tổ chức vào một danh sách; hiển thị nguồn giao, hạn và trạng thái; sử dụng chung engine làm/nộp bài. \| Kết quả: Không sinh hai bài giao trùng cho cùng một nghĩa vụ. |
| **FR-P13** | UC-P13       | Quản lý đề đánh giá cá nhân                   | Cho phép tạo, xem, chỉnh sửa, kiểm định và sử dụng đề thuộc phạm vi cá nhân. \| Kết quả: Không được sửa đề của tổ chức hoặc NEXA.                                                                    |
| **FR-P14** | UC-P14       | Tổ chức phòng thi trực tiếp cá nhân           | Tạo và điều hành phòng thi trực tiếp theo quyền gói/tài khoản. \| Kết quả: Chỉ host hợp lệ được điều khiển phiên.                                                                                    |
| **FR-P15** | UC-P15       | Đóng góp nội dung đánh giá                    | Gửi đề/câu hỏi vào hàng đợi kiểm duyệt NEXA. \| Kết quả: Không tự động công khai khi chưa duyệt.                                                                                                     |
| **FR-P16** | UC-P16       | Xem bảng xếp hạng                             | Hiển thị thứ hạng PTS theo phạm vi và chính sách công bố. \| Kết quả: Tôn trọng quyền riêng tư.                                                                                                      |
| **FR-P17** | UC-P17       | Xem chứng chỉ và thành tích                   | Xem chứng chỉ/thành tích đã cấp hợp lệ. \| Kết quả: Không hiển thị chứng chỉ chưa đủ điều kiện.                                                                                                      |
| **FR-P18** | UC-P18       | Quản lý gói dịch vụ cá nhân                   | Xem gói, hạn dùng/quyền lợi, nâng cấp/gia hạn và trạng thái giao dịch. \| Kết quả: Quyền lợi chỉ cập nhật khi giao dịch hợp lệ.                                                                      |
| **FR-P19** | UC-P19       | Tham gia phòng thi trực tiếp                  | Nhập mã/mở liên kết để vào phiên thi hợp lệ. \| Kết quả: Kiểm tra mã, trạng thái phiên và điều kiện dự thi.                                                                                          |


> **UC-P12 – MỘT NƠI NHẬN BÀI**
>
> Bài được giao từ lớp cá nhân và lớp do tổ chức quản lý đều nằm trong Personal → Bài được giao. Giao diện và engine làm/nộp bài thống nhất; mỗi mục cần hiển thị nguồn giao, tên lớp/tổ chức nếu có, hạn nộp và trạng thái. Quyền xem/chấm/báo cáo vẫn theo nguồn sở hữu.


# 7. Yêu cầu chức năng – Organization Admin

Các chức năng chỉ tác động dữ liệu thuộc tổ chức tương ứng. Vai trò người học/member không được truy cập Organization Dashboard. Không bổ sung vai trò chấm bài như một actor riêng khi chưa được phê duyệt.

| **Mã FR**  | **Use Case** | **Chức năng**                                    | **Yêu cầu hệ thống / kết quả mong đợi**                                                                                                      |
|------------|--------------|--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| **FR-O01** | UC-O01       | Xem tổng quan hoạt động tổ chức                  | Hiển thị thành viên, lớp, đợt, công việc cần xử lý trong tổ chức. \| Kết quả: Không lẫn dữ liệu tổ chức khác.                                |
| **FR-O02** | UC-O02       | Quản lý thành viên tổ chức                       | Mời, duyệt, xem, cập nhật tư cách và loại thành viên theo quyền. \| Kết quả: Bảo vệ vai trò Owner và lịch sử liên quan.                      |
| **FR-O03** | UC-O03       | Quản lý phương thức mời tham gia tổ chức         | Hỗ trợ mã tham gia, liên kết mời và mời trực tiếp qua email. \| Kết quả: Không yêu cầu QR hoặc thao tác thu hồi mã trong UI này.             |
| **FR-O04** | UC-O04       | Quản lý lớp và nhóm                              | Tạo, xem, chỉnh sửa và lưu trữ lớp/nhóm của tổ chức. \| Kết quả: Không làm mất lịch sử đánh giá khi lưu trữ.                                 |
| **FR-O05** | UC-O05       | Quản lý thành viên lớp/nhóm                      | Thêm, điều chuyển, xóa tư cách thành viên lớp/nhóm hợp lệ. \| Kết quả: Chỉ quản lý thành viên thuộc phạm vi cho phép.                        |
| **FR-O06** | UC-O06       | Quản lý đề đánh giá nội bộ                       | Tạo, chỉnh sửa, kiểm định, phát hành và ngừng sử dụng đề nội bộ. \| Kết quả: Không tác động đề chung NEXA.                                   |
| **FR-O07** | UC-O07       | Tạo và phát hành đợt đánh giá                    | Chọn đề, tên đợt tự đặt, lớp/nhóm, lịch và ngưỡng; lưu nháp, xem trước, phát hành. \| Kết quả: Một nguồn phân phối đợt đánh giá chính thống. |
| **FR-O08** | UC-O08       | Quản lý đợt đánh giá                             | Xem, cập nhật trong trạng thái cho phép, kết thúc và lưu trữ. \| Kết quả: Lịch sử bài nộp không bị ghi đè.                                   |
| **FR-O09** | UC-O09       | Theo dõi tình trạng hoàn thành bài đánh giá      | Hiển thị danh sách Chưa làm và Đã làm (đã nộp). \| Kết quả: Không buộc hiển thị trạng thái Đang làm.                                         |
| **FR-O10** | UC-O10       | Chấm bài tự luận và thực hành                    | Chấm từng câu/tiêu chí theo rubric, nhận xét và lưu kết quả. \| Kết quả: Điểm tự động trắc nghiệm được giữ nguyên.                           |
| **FR-O11** | UC-O11       | Duyệt và công bố kết quả đánh giá                | Xác nhận các phần đã chấm và cho phép công bố theo quyền. \| Kết quả: Không công bố tổng kết khi còn phần bắt buộc chờ chấm.                 |
| **FR-O12** | UC-O12       | Xem báo cáo năng lực tổ chức                     | Tổng hợp 5 miền theo người/lớp/đợt được phép. \| Kết quả: Chỉ dùng kết quả có đủ điều kiện và mẫu số rõ.                                     |
| **FR-O13** | UC-O13       | So sánh kết quả đánh giá                         | So sánh lớp/nhóm hoặc đợt có tiêu chí, thang và mẫu hợp lệ. \| Kết quả: Cảnh báo khi phép so sánh không tương thích.                         |
| **FR-O14** | UC-O14       | Xuất báo cáo đánh giá                            | Xuất dữ liệu/báo cáo theo phạm vi tổ chức. \| Kết quả: Áp dụng quyền và ghi nhận thao tác xuất nhạy cảm.                                     |
| **FR-O15** | UC-O15       | Quản lý cấu hình tổ chức                         | Cập nhật thông tin, chính sách tham gia và thiết lập có quyền. \| Kết quả: Không tự ý thay đổi quyền lợi gói.                                |
| **FR-O16** | UC-O16       | Xem gói Business và hạn mức sử dụng              | Hiển thị trạng thái, số ghế, số đề, AI Credits và thời hạn. \| Kết quả: Không hiển thị 0/0 gây hiểu nhầm khi không có gói.                   |
| **FR-O17** | UC-O17       | Gửi yêu cầu gia hạn hoặc điều chỉnh gói Business | Tạo yêu cầu gia hạn/thay đổi gói. \| Kết quả: Yêu cầu chuyển tới System Admin; không tự kích hoạt.                                           |
| **FR-O18** | UC-O18       | Tạo phòng thi trực tiếp của tổ chức              | Chọn đề, đối tượng, thời gian và tạo phiên trong tenant. \| Kết quả: Gắn quyền sở hữu tổ chức đúng.                                          |
| **FR-O19** | UC-O19       | Điều hành phòng thi trực tiếp                    | Mở, cung cấp mã, tạm dừng/tiếp tục/đóng phiên theo hỗ trợ thật. \| Kết quả: Chỉ host/Org Admin hợp lệ điều hành.                             |
| **FR-O20** | UC-O20       | Xem kết quả phòng thi trực tiếp                  | Tra cứu bài nộp, trạng thái chấm và công bố của phiên. \| Kết quả: Tôn trọng quy tắc chấm/công bố chung.                                     |

# 8. Yêu cầu chức năng – System Admin

System Admin chịu trách nhiệm điều hành NEXA, bao gồm nội dung đánh giá và lộ trình chính thức xuất hiện trong Personal. Quyền truy cập dữ liệu khách hàng phải theo mục đích và phân quyền cụ thể, không áp dụng “CRUD toàn bộ” bất kể nguồn sở hữu.

| **Mã FR**  | **Use Case** | **Chức năng**                            | **Yêu cầu hệ thống / kết quả mong đợi**                                                                                           |
|------------|--------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| **FR-A01** | UC-A01       | Giám sát vận hành nền tảng               | Xem hàng đợi cần xử lý, tình trạng dịch vụ và cảnh báo vận hành. \| Kết quả: Không tạo KPI giả hoặc hàng đợi rỗng phức tạp.       |
| **FR-A02** | UC-A02       | Quản lý tài khoản người dùng             | Tra cứu, hỗ trợ, cập nhật trạng thái, khóa/mở tài khoản theo quyền. \| Kết quả: Mọi thay đổi nhạy cảm được kiểm toán.             |
| **FR-A03** | UC-A03       | Xử lý yêu cầu đăng ký Business           | Tiếp nhận, theo dõi tư vấn, cập nhật trạng thái yêu cầu. \| Kết quả: Không bắt buộc hợp đồng để kích hoạt gói.                    |
| **FR-A04** | UC-A04       | Quản lý tổ chức khách hàng               | Tạo, xem, kích hoạt, tạm ngừng hoặc đóng tổ chức theo chính sách. \| Kết quả: Không xóa cứng lịch sử tổ chức có dữ liệu.          |
| **FR-A05** | UC-A05       | Quản lý danh mục gói dịch vụ             | Tạo, xem, chỉnh sửa, ngừng cung cấp gói Personal/Business. \| Kết quả: Không làm biến dạng quyền lợi của giao dịch lịch sử.       |
| **FR-A06** | UC-A06       | Quản lý quyền lợi dịch vụ                | Cấp và điều chỉnh ghế, đề, AI Credits và thời hạn. \| Kết quả: Lưu lý do, người thực hiện và lịch sử.                             |
| **FR-A07** | UC-A07       | Xử lý yêu cầu gia hạn Business           | Duyệt/từ chối, gia hạn và cập nhật quyền lợi đúng giao dịch/quy trình. \| Kết quả: Không gia hạn lặp.                             |
| **FR-A08** | UC-A08       | Đối soát giao dịch thanh toán            | Kiểm tra trạng thái, xác nhận chứng từ, xử lý ngoại lệ. \| Kết quả: Idempotent và có nhật ký đối soát.                            |
| **FR-A09** | UC-A09       | Xem báo cáo kinh doanh nền tảng          | Thống kê doanh thu đã xác minh, gói và khách hàng. \| Kết quả: Nêu kỳ báo cáo và định nghĩa số liệu.                              |
| **FR-A10** | UC-A10       | Quản lý ngân hàng bài đánh giá NEXA      | Tạo, xem, sửa, kiểm định, phát hành và ngừng phát hành đề công khai. \| Kết quả: Phiên bản đã phát hành có bài làm phải bảo toàn. |
| **FR-A11** | UC-A11       | Cấu hình quyền truy cập bài đánh giá     | Thiết lập Free/Premium và điều kiện gói. \| Kết quả: Kiểm tra quyền ở backend trước khi bắt đầu làm bài.                          |
| **FR-A12** | UC-A12       | Quản lý lộ trình học tập NEXA            | Tạo, xem, sửa, sắp xếp, phát hành, lưu trữ lộ trình. \| Kết quả: Giữ tiến độ học tập khi sửa phiên bản hợp lệ.                    |
| **FR-A13** | UC-A13       | Quản lý học phần và học liệu             | Quản trị nội dung học phần, tài nguyên và thứ tự. \| Kết quả: Tài liệu có thông tin trạng thái và quyền sở hữu.                   |
| **FR-A14** | UC-A14       | Liên kết bài đánh giá với lộ trình       | Gắn đề NEXA vào học phần, cấu hình điều kiện hoàn thành. \| Kết quả: Tái sử dụng đề gốc, không nhân bản sai phiên bản.            |
| **FR-A15** | UC-A15       | Kiểm duyệt nội dung đóng góp             | Xem trước, phê duyệt/yêu cầu sửa/từ chối, ghi nhận nhận xét. \| Kết quả: Một quy trình duyệt thống nhất.                          |
| **FR-A16** | UC-A16       | Quản lý phiên bản khung năng lực         | Quản trị 5 miền, kỹ năng, cấu trúc tham chiếu có phiên bản. \| Kết quả: Không tự ý thay nghĩa kết quả lịch sử.                    |
| **FR-A17** | UC-A17       | Phân tích hiệu quả nội dung học tập      | Theo dõi lượt làm, kết quả và hiệu quả học phần tổng hợp hợp lệ. \| Kết quả: Không tính bài chưa chấm là không đạt.               |
| **FR-A18** | UC-A18       | Giám sát AI Gateway                      | Theo dõi request, lỗi, latency, chi phí, sử dụng theo tính năng/tenant. \| Kết quả: Có nguồn đo thực và kỳ thời gian.             |
| **FR-A19** | UC-A19       | Quản lý cấu hình AI Gateway              | Cấu hình nhà cung cấp/mô hình/tham số theo quyền. \| Kết quả: Thông tin bí mật không lộ ở UI/log.                                 |
| **FR-A20** | UC-A20       | Xử lý yêu cầu hỗ trợ người dùng          | Tiếp nhận, phân loại, xử lý và kết thúc yêu cầu. \| Kết quả: Lưu trạng thái và lịch sử xử lý.                                     |
| **FR-A21** | UC-A21       | Quản lý thông báo nền tảng               | Soạn, xác nhận người nhận, gửi và theo dõi thông báo. \| Kết quả: Không gửi nhầm tenant/đối tượng.                                |
| **FR-A22** | UC-A22       | Giám sát bảo mật và nhật ký kiểm toán    | Tra cứu sự kiện bảo mật và hành động quản trị. \| Kết quả: Log có thời gian, actor, đối tượng, hành động.                         |
| **FR-A23** | UC-A23       | Quản lý quyền quản trị viên hệ thống     | Cấp, thay đổi, thu hồi role/quyền nội bộ. \| Kết quả: Không tự nâng quyền hoặc phá quyền super admin.                             |
| **FR-A24** | UC-A24       | Quản lý cấu hình nền tảng                | Chỉnh sửa cấu hình chung theo phân quyền. \| Kết quả: Có validation và lịch sử thay đổi.                                          |
| **FR-A25** | UC-A25       | Quản lý quy tắc điểm PTS và cấp độ       | Cấu hình hoặc giám sát PTS, cấp độ, thành tích. \| Kết quả: Không tự ý tính lại lịch sử không có chính sách.                      |
| **FR-A26** | UC-A26       | Quản lý chính sách chứng chỉ             | Quản lý mẫu, điều kiện và trạng thái chứng chỉ. \| Kết quả: Chứng chỉ cấp có nguồn bằng chứng.                                    |
| **FR-A27** | UC-A27       | Hỗ trợ xử lý sự cố đánh giá và phòng thi | Tra cứu và chẩn đoán sự cố có lý do/quyền. \| Kết quả: Không mặc định sửa bài/điểm hay điều hành thay khách hàng.                 |

# 9. Đánh giá, chấm điểm và công bố

## 9.1. Cấu trúc đề và câu hỏi

Công cụ soạn đề thống nhất dùng cho chủ thể NEXA, tài khoản cá nhân và tổ chức (khác nhau về quyền sở hữu/phạm vi phát hành). Hai nhóm câu hỏi chính là: (1) Trắc nghiệm – MCQ; (2) Tự luận/Thực hành – câu trả lời mở có thể gồm văn bản, tệp và liên kết. Tình huống là phần bối cảnh, không phải loại câu hỏi chấm riêng.

## 9.2. Quy tắc điểm và trạng thái

| **Loại bài**              | **Xử lý sau nộp**                                    | **Điểm / trạng thái**                                                                       |
|---------------------------|------------------------------------------------------|---------------------------------------------------------------------------------------------|
| **Chỉ trắc nghiệm**       | Tự động chấm toàn bộ câu trắc nghiệm.                | Có điểm ngay sau nộp; thời điểm người dùng nhìn thấy theo chính sách công bố.               |
| **Chỉ tự luận/thực hành** | Lưu bài và minh chứng; chuyển hàng đợi chấm.         | Chưa có điểm cuối cùng cho đến khi người có quyền chấm/duyệt.                               |
| **Đề hỗn hợp**            | Trắc nghiệm được chấm tự động; phần mở chấm độc lập. | Hiển thị điểm phần trắc nghiệm đã chấm khi cho phép; không có tổng /100 trước khi hoàn tất. |

Đề mới có tổng điểm tối đa 100 khi phát hành; phân bổ điểm từng câu linh hoạt. Có thể hỗ trợ cân bằng điểm theo yêu cầu của người soạn nhưng không tự thay đổi điểm do người soạn nhập. Với đề lịch sử có thang khác, giữ nguyên dữ liệu gốc và quy đổi có kiểm soát khi báo cáo. Ngưỡng đạt mặc định 70/100 và có thể cấu hình theo bài/đợt phù hợp.

## 9.3. Trạng thái độc lập

| **Nhóm trạng thái** | **Trạng thái khái niệm**             | **Ý nghĩa**                                                   |
|---------------------|--------------------------------------|---------------------------------------------------------------|
| **Bài nộp**         | Chưa làm / Có bản nháp / Đã nộp      | Theo dõi hành vi nộp, không đồng nghĩa đã chấm.               |
| **Chấm bài**        | Chưa chấm / Chấm một phần / Hoàn tất | Có thể có điểm MCQ trong khi phần mở chưa chấm.               |
| **Công bố**         | Chưa công bố / Đã công bố            | Quyết định dữ liệu điểm nào được phép hiển thị cho người học. |

# 10. Ngân hàng đề NEXA và phân quyền nội dung

## 10.1. Nội dung chính thức và phát hành

System Admin quản lý bài đánh giá NEXA dành cho thư viện Personal. Vòng đời nội dung: Bản nháp → Sẵn sàng/được kiểm định → Đã phát hành → Ngừng phát hành/Lưu trữ. Bài được phát hành mới xuất hiện trong thư viện; phiên bản có bài nộp không được chỉnh sửa phá vỡ khả năng đối chiếu.

## 10.2. Quyền truy cập Free/Premium

- Mỗi đề NEXA có chính sách Free hoặc yêu cầu quyền lợi gói Premium được công bố rõ trong Personal.

- Khi bắt đầu bài, hệ thống kiểm tra quyền ở backend; việc hiển thị nút “Nâng cấp” chỉ là hướng dẫn UI.

- Không suy diễn rằng mọi bài Premium chỉ có duy nhất một mức gói; quan hệ gói ↔ tính năng/đề được cấu hình.

- Bài do tổ chức giao hợp lệ không yêu cầu người học mua gói Personal chỉ vì đề nguồn thuộc loại Premium; quyền dự thi theo entitlement của tổ chức và quy tắc phân phối đã cấp.

## 10.3. Tái sử dụng đề

Một đề NEXA được dùng độc lập trong thư viện Personal hoặc gắn vào lộ trình học mà không nhân bản bản ghi nguồn. Đề nội bộ của tổ chức không mặc định được phát hành trong thư viện NEXA; đề cá nhân không tự động trở thành đề NEXA khi chưa được kiểm duyệt/tiếp nhận.

# 11. Lộ trình học tập và hồ sơ năng lực

## 11.1. Quản trị lộ trình

System Admin phải có chức năng tạo, xem, chỉnh sửa, sắp xếp, phát hành và lưu trữ lộ trình học NEXA. Lộ trình gồm học phần/bước học, mô tả, tài nguyên học liệu, bài đánh giá được liên kết, điều kiện hoàn thành và trạng thái phiên bản.

## 11.2. Hoạt động Personal

Personal User được truy cập lộ trình theo quyền, xem tiến độ, thực hiện học phần/bài đánh giá và theo dõi thành quả. Học phần không được tự đánh dấu hoàn thành dựa trên dữ liệu mẫu. Nếu cập nhật phiên bản lộ trình, tiến độ cũ phải được bảo toàn hoặc được xử lý bằng quy tắc di trú rõ ràng.

## 11.3. Hồ sơ 5 miền năng lực

Hệ thống duy trì khung tham chiếu nội bộ gồm 5 miền năng lực; mã và nhãn phải đồng bộ qua tác giả đề, báo cáo và hồ sơ. Điểm miền chỉ được tổng hợp khi có dữ liệu đánh giá hợp lệ. Trạng thái chưa có dữ liệu không được hiển thị thành 0 điểm. AI có thể đề xuất nhận xét hoặc hoạt động bồi dưỡng, nhưng không thay thế số liệu đã xác minh.

# 12. Lớp/nhóm, giao bài và phòng thi trực tiếp

## 12.1. Hai nguồn lớp, một nơi nhận bài

| **Yếu tố**                 | **Lớp/nhóm cá nhân**                          | **Lớp/nhóm tổ chức**                          |
|----------------------------|-----------------------------------------------|-----------------------------------------------|
| **Nguồn sở hữu**           | Personal User được cấp quyền tạo/quản lý.     | Tổ chức cụ thể.                               |
| **Người giao**             | Người quản lý lớp cá nhân.                    | Organization Admin.                           |
| **Nơi người học nhận bài** | Personal → Bài được giao.                     | Personal → Bài được giao.                     |
| **Luồng thực hiện**        | Chung Assessment Engine và Submission Engine. | Chung Assessment Engine và Submission Engine. |
| **Ai xem/chấm/báo cáo**    | Người có quyền quản lý lớp cá nhân.           | Người có quyền trong tổ chức, theo tenant.    |

## 12.2. Giao đánh giá tổ chức

Một đợt đánh giá là thực thể điều phối chính thống trong tổ chức. Nút “Giao đánh giá” từ lớp và “Sử dụng đề” từ danh sách đề đều mở cùng quy trình tạo đợt, điền sẵn lớp hoặc đề tương ứng. Form tối thiểu gồm tên đợt, đề, lớp/nhóm, bắt đầu/kết thúc; thiết lập nâng cao gồm ngưỡng đạt và chính sách công bố. Có lưu nháp, xem trước và phát hành riêng biệt.

Đợt chưa tới ngày bắt đầu phải là “Sắp diễn ra”, không báo “Đang diễn ra”. Việc giao cùng đề qua nhiều đợt phải liên kết định danh đợt để tránh ghi đè hạn hoặc trộn bài nộp. Bảng theo dõi Organization chỉ cần hai nhóm tiến độ “Chưa làm” và “Đã làm (đã nộp)”.

## 12.3. Phòng thi trực tiếp

Phòng thi trực tiếp có hai ngữ cảnh: cá nhân và tổ chức. Host được phép tạo, cung cấp mã tham gia, điều hành phiên và xem kết quả; thí sinh tham gia từ không gian được hỗ trợ. Chỉ hiển thị thời gian thực, online/đang làm hoặc các trạng thái kỹ thuật khi hệ thống thực sự thu thập và xác nhận được dữ liệu; không suy diễn.

# 13. Gói dịch vụ, Business và thanh toán

## 13.1. Gói cá nhân

System Admin quản trị danh mục gói, quyền lợi và nội dung Free/Premium. Personal User xem gói hiện hành, thực hiện nâng cấp/gia hạn, theo dõi trạng thái thanh toán. Quyền truy cập cập nhật từ giao dịch/thao tác cấp quyền hợp lệ; không cập nhật dựa trên màn hình thanh toán đơn thuần.

## 13.2. Vòng đời khách hàng Business

Tiếp nhận yêu cầu → Tư vấn/ghi nhận nhu cầu → Kích hoạt tổ chức & quyền lợi → Mời Owner → Tổ chức sử dụng → Xem hạn mức → Gia hạn/điều chỉnh theo yêu cầu. Không đặt bước ký hợp đồng bắt buộc. Mỗi tổ chức có hồ sơ khách hàng tập trung, thể hiện người liên hệ, gói, thời hạn, ghế, hạn mức đề, AI Credits, yêu cầu gia hạn và lịch sử điều chỉnh.

## 13.3. Tính nhất quán giao dịch và quyền lợi

- Đối soát/thanh toán phải chống xử lý lặp và ghi bằng chứng, người thao tác, thời gian.

- Mọi điều chỉnh entitlement có lý do và audit log; lịch sử không mất khi gia hạn.

- Tổ chức ở trạng thái chưa kích hoạt/đang cấp quyền không được hiển thị quyền gia hạn như một gói đang hoạt động.

- Không hard-code chu kỳ 12 tháng, đơn giá hoặc ngày hết hạn nếu không có dữ liệu nguồn.

# 14. Báo cáo, AI và vận hành nền tảng

## 14.1. Báo cáo Personal và Organization

Personal hiển thị kết quả và hồ sơ 5 miền của chính người dùng. Organization chỉ tổng hợp bài nộp thuộc đợt/lớp/tenant được cấp quyền. Phép so sánh các đợt phải có cùng định nghĩa và ngữ cảnh đánh giá; không áp đặt tên “Kỳ 1/Kỳ 2”. Số liệu mẫu, khoảng thời gian, trạng thái hoàn tất chấm và nguồn được giải thích rõ.

## 14.2. AI hỗ trợ chấm và phản hồi

AI được phép đề xuất điểm hoặc nhận xét cho tự luận/thực hành khi tính năng được cấu hình và quyền lợi đủ. Đề xuất AI không tự tạo điểm chính thức; người chấm/duyệt chịu trách nhiệm xác nhận. Mỗi gợi ý phải phân biệt với điểm cuối và có dấu vết sử dụng AI.

## 14.3. Điều hành nền tảng

Platform Admin theo dõi hàng đợi Business, gia hạn, đối soát, kiểm duyệt, hỗ trợ và sự cố. KPI phải có thời gian, nguồn đo và trạng thái đáng tin cậy. AI Operations cần hiển thị lỗi, chi phí, độ trễ và tiêu thụ theo tính năng/gói/tổ chức trong phạm vi quyền; không hiển thị 0 thay cho dữ liệu chưa thu thập.

# 15. Quy tắc nghiệp vụ bắt buộc

| **Mã**    | **Quy tắc**                                                                                          |
|-----------|------------------------------------------------------------------------------------------------------|
| **BR-01** | 4 actor, 3 dashboard; Guest không có dashboard; Member làm việc trong Personal.                      |
| **BR-02** | Quyền mỗi hành động kiểm tra ở API/database và theo phạm vi sở hữu.                                  |
| **BR-03** | Đề mới bắt buộc tổng điểm tối đa 100 khi phát hành; điểm mỗi câu linh hoạt.                          |
| **BR-04** | Trắc nghiệm chấm tự động ngay sau nộp; công bố tùy chính sách.                                       |
| **BR-05** | Câu tự luận/thực hành chấm riêng, có thể sử dụng rubric và AI hỗ trợ.                                |
| **BR-06** | Điểm chưa chấm = không có điểm (null/PENDING), không mặc định 0.                                     |
| **BR-07** | Chỉ chốt tổng /100 và Đạt/Không đạt khi mọi phần bắt buộc đã chấm.                                   |
| **BR-08** | Thang điểm đề lịch sử khác 100 được bảo toàn, quy đổi khi tổng hợp theo quy tắc rõ ràng.             |
| **BR-09** | Ngưỡng đạt mặc định 70/100, có thể cấu hình; không dùng toán tử fallback khiến điểm 0 biến thành 70. |
| **BR-10** | Các trạng thái bài nộp, chấm và công bố phải độc lập.                                                |
| **BR-11** | Quyền Free/Premium kiểm tra tại backend trước khi bắt đầu bài NEXA.                                  |
| **BR-12** | Bài giao tổ chức hợp lệ sử dụng quyền tổ chức, không ép mua gói Personal.                            |
| **BR-13** | Một mục Personal “Bài được giao” cho lớp cá nhân và lớp tổ chức; ghi rõ nguồn.                       |
| **BR-14** | Đợt đánh giá là đơn vị giao bài chính thống trong Organization; không nhân đôi pipeline.             |
| **BR-15** | Đợt bắt đầu trong tương lai không ở trạng thái ACTIVE; nháp không tự phát hành.                      |
| **BR-16** | Trang theo dõi của Org chỉ phân nhóm Chưa làm / Đã làm (đã nộp).                                     |
| **BR-17** | Mời tham gia tổ chức bằng mã, liên kết hoặc email; UI không có QR/thu hồi mã.                        |
| **BR-18** | Không yêu cầu hợp đồng để sử dụng/gia hạn gói Business.                                              |
| **BR-19** | Nội dung NEXA, cá nhân và tổ chức có phạm vi sở hữu và công bố tách biệt.                            |
| **BR-20** | Phiên bản đề và kết quả lịch sử không bị phá hỏng khi sửa nội dung đang sử dụng.                     |
| **BR-21** | Số liệu chưa có, không có mẫu hoặc truy vấn lỗi không được biểu diễn thành điểm 0.                   |
| **BR-22** | System Admin không mặc định sửa bài làm/điểm hoặc thao tác thay Admin tổ chức.                       |
| **BR-23** | Thao tác nhạy cảm: phân quyền riêng + lý do + audit log.                                             |
| **BR-24** | Hệ thống không hiển thị dữ liệu mẫu/giả như bài được giao hoặc KPI thực tế.                          |
| **BR-25** | Gói dịch vụ và thời hạn được lấy từ dữ liệu nguồn, không hard-code chu kỳ hoặc hợp đồng.             |

# 16. Dữ liệu và mối quan hệ logic

Các khái niệm dưới đây là mô hình thông tin mục tiêu, không bắt buộc tương ứng 1:1 với tên bảng vật lý hiện tại. Khi triển khai phải có bản thiết kế schema, migration và chính sách bảo toàn dữ liệu.

| **Thực thể logic**            | **Thông tin cốt lõi**                                        | **Ràng buộc**                                          |
|-------------------------------|--------------------------------------------------------------|--------------------------------------------------------|
| **User / Profile**            | Định danh tài khoản, hồ sơ và trạng thái.                    | Một User có nhiều membership và vai trò theo ngữ cảnh. |
| **Organization / Membership** | Tenant, Owner/Admin/Member và quan hệ tham gia.              | Tách dữ liệu tổ chức khỏi Personal.                    |
| **Class / ClassMembership**   | Lớp cá nhân hoặc tổ chức cùng thành viên.                    | Có nguồn sở hữu và quyền quản trị.                     |
| **Assessment / Version**      | Đề, owner, visibility, access policy, thang điểm, phiên bản. | Có nhiều câu hỏi; được tham chiếu từ lộ trình/đợt.     |
| **Question / Rubric**         | Loại câu, đáp án, điểm, tiêu chí tự luận/thực hành.          | Điểm rubric quy đổi về tối đa của câu.                 |
| **Campaign / Audience**       | Đợt đánh giá, lớp/đối tượng, lịch, trạng thái, chính sách.   | Liên kết đúng bài được giao và submission.             |
| **Assignment / Submission**   | Bài giao, nguồn, người nhận, bài nộp và thời điểm.           | Một trách nhiệm giao bài có danh tính xác định.        |
| **Grade / Publication**       | Điểm MCQ, phần mở, người chấm, trạng thái duyệt/công bố.     | Không ghi 0 cho phần chờ chấm.                         |
| **CompetencyResult**          | Điểm 5 miền, số mẫu, nguồn minh chứng.                       | Chỉ tổng hợp kết quả hợp lệ.                           |
| **LearningPath / Module**     | Lộ trình, học phần, tài liệu, nội dung và phiên bản.         | Có thể gắn Assessment chính thức.                      |
| **LearningProgress**          | Tiến độ theo User và Module/Path.                            | Bảo toàn khi cập nhật lộ trình.                        |
| **Plan / Entitlement**        | Danh mục gói, quyền lợi, quota và thời hạn.                  | Cấp cho User hoặc Organization tùy gói.                |
| **Payment / Renewal**         | Giao dịch, đối soát, yêu cầu gia hạn, trạng thái.            | Chống trùng và liên kết quyền lợi.                     |
| **LiveRoom / Participant**    | Phiên thi, host, người dự thi và kết quả.                    | Nguồn sở hữu Personal hoặc Organization.               |
| **Audit / Support / AIUsage** | Nhật ký thao tác, yêu cầu hỗ trợ, chỉ số AI.                 | Bảo vệ thông tin nhạy cảm và giới hạn lưu giữ.         |

# 17. Yêu cầu giao diện và tích hợp

## 17.1. Cấu trúc giao diện

- Website công khai không có dashboard; sau xác thực chuyển đến không gian hợp lệ.

- Personal ưu tiên tác vụ phù hợp tình trạng người dùng: đánh giá đầu vào, bài cần nộp, kết quả, lộ trình.

- Organization giữ cấu trúc điều hành ngắn gọn: Tổng quan, Thành viên, Nhóm/Lớp, Đề, Đợt, Chấm bài, Báo cáo, Gói, Cài đặt; phòng thi trực tiếp được bố trí không làm nhân bản luồng đánh giá.

- Platform Admin tập trung vào vận hành: Tổng quan; Người dùng & Hỗ trợ; Khách hàng & Tổ chức; Nội dung & Học tập; Gói & Thanh toán; AI & Vận hành; Hệ thống.

- Không dùng các khối KPI, card trang trí lặp lại ở mọi trang; trạng thái trống nêu hành động tiếp theo phù hợp.

## 17.2. Các tích hợp

| **Tích hợp**                  | **Mục đích**                                               | **Yêu cầu**                                            |
|-------------------------------|------------------------------------------------------------|--------------------------------------------------------|
| **Xác thực và cơ sở dữ liệu** | Đăng nhập, phân quyền, quản trị tenant, lưu trữ nghiệp vụ. | Phải thực thi bảo vệ dữ liệu theo owner và quyền.      |
| **Lưu tệp**                   | Nộp minh chứng và quản lý học liệu.                        | Xác thực loại/kích thước, chỉ người có quyền truy cập. |
| **Cổng thanh toán**           | Nâng cấp/gia hạn và đối soát.                              | Kiểm tra trạng thái giao dịch, webhook/idempotency.    |
| **AI Gateway**                | Gợi ý chấm, nhận xét, phân tích.                           | Ghi log tiêu thụ không lộ khóa/bài riêng tư.           |
| **Email/thông báo**           | Mời tham gia, thông báo tài khoản, kết quả/gói.            | Xác thực người nhận và không tiết lộ dữ liệu nhạy cảm. |

# 18. Yêu cầu phi chức năng

| **Mã**     | **Thuộc tính**           | **Yêu cầu**                                                                                     | **Cách xác minh**                                            |
|------------|--------------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| **NFR-01** | Bảo mật xác thực         | Bắt buộc xác thực cho tất cả chức năng private; cookie/session theo cơ chế bảo mật được hỗ trợ. | Có test truy cập trái phép.                                  |
| **NFR-02** | Phân quyền               | Áp dụng kiểm tra quyền backend + row/tenant; không dựa chỉ vào UI.                              | Kiểm thử chéo hai tài khoản/tổ chức.                         |
| **NFR-03** | Bảo vệ dữ liệu           | Ẩn dữ liệu cá nhân, bài nộp, tệp chứng cứ trước người không có quyền.                           | Có test RLS/storage signed access.                           |
| **NFR-04** | Toàn vẹn điểm            | Không làm mất điểm MCQ, không mặc định null thành 0; tổng hợp có thể tái hiện.                  | Có test kết hợp MCQ + bài mở.                                |
| **NFR-05** | Toàn vẹn nghiệp vụ       | Tạo đợt, giao bài, thanh toán, cấp quyền lợi phải chống lỗi nửa chừng/trùng lặp.                | Có kiểm thử rollback/idempotency.                            |
| **NFR-06** | Khả dụng                 | Có trạng thái loading, empty, error và phương án thử lại.                                       | Không hiển thị số 0 thay cho request lỗi.                    |
| **NFR-07** | Hiệu năng                | Mục tiêu p95 trang/tác vụ và tải dự kiến phải được đo, chốt khi triển khai.                     | Benchmark theo tập dữ liệu mục tiêu – cần thống nhất ngưỡng. |
| **NFR-08** | Khả năng mở rộng         | Tối ưu truy vấn theo tenant, phân trang bảng lớn, giới hạn xuất dữ liệu.                        | Không tải toàn bộ dữ liệu không cần thiết.                   |
| **NFR-09** | Truy vết                 | Lưu actor, thời điểm, đối tượng, hành động, lý do cho thao tác nhạy cảm.                        | Có giao diện truy cứu theo quyền.                            |
| **NFR-10** | Tính sử dụng             | Desktop/mobile thích ứng, bàn phím, trạng thái lỗi và nhãn rõ ràng.                             | Thử nghiệm tác vụ đầu-cuối.                                  |
| **NFR-11** | An toàn tệp              | Kiểm tra loại tệp, kích thước, quyền sở hữu và thời hạn truy cập.                               | Không lộ tệp qua URL công khai ngoài chính sách.             |
| **NFR-12** | Khả năng phục hồi        | Có sao lưu, migration và quy trình khôi phục dữ liệu theo mục tiêu đã duyệt.                    | RPO/RTO cần chốt trước go-live.                              |
| **NFR-13** | Riêng tư AI              | Lượng dữ liệu gửi AI được giới hạn, có chính sách sử dụng và lưu giữ.                           | Không ghi khóa bí mật hoặc nội dung nhạy cảm vào log thường. |
| **NFR-14** | Tính nhất quán giao diện | Cùng một nội dung/trạng thái có tên và màu sắc nhất quán giữa dashboard.                        | Kiểm tra định nghĩa trạng thái trong UI.                     |
| **NFR-15** | Định dạng dữ liệu        | Dùng một quy ước múi giờ, ngày bắt đầu/kết thúc, điểm /100 và đơn vị tiền.                      | Kiểm thử ngày giờ, thang điểm và làm tròn.                   |
| **NFR-16** | Khả năng kiểm thử        | FR và BR có mã truy vết, log và điều kiện nghiệm thu.                                           | Test suite liên kết với mã FR/UC.                            |

# 19. Ma trận quyền và phạm vi dữ liệu

C = tạo; R = xem; U = cập nhật; D\* = ngừng cung cấp/lưu trữ/xóa an toàn theo nghiệp vụ (không mặc định xóa cứng). Quyền quản trị nội bộ System Admin chỉ phát sinh khi được cấp capability cụ thể.

| **Tài nguyên**           | **Guest**         | **Personal User**             | **Organization Admin**          | **System Admin**                            |
|--------------------------|-------------------|-------------------------------|---------------------------------|---------------------------------------------|
| **Đề NEXA chính thức**   | —                 | R/làm theo gói                | R nếu được phân phối            | C/R/U/D\* theo quyền nội dung               |
| **Đề cá nhân**           | —                 | C/R/U/D\* bản thân            | R nếu được chia sẻ hợp lệ       | Chẩn đoán hỗ trợ có kiểm soát               |
| **Đề tổ chức**           | —                 | R/làm khi được giao           | C/R/U/D\* trong tenant          | Không thao tác thay theo mặc định           |
| **Bài nộp và điểm**      | —                 | R của bản thân theo công bố   | R/chấm/công bố đúng tenant      | Chỉ hỗ trợ kiểm tra có audit                |
| **Lớp/nhóm**             | —                 | Tham gia, quản lý lớp cá nhân | C/R/U/D\* lớp tổ chức           | Không thay tác nghiệp khách hàng            |
| **Lộ trình NEXA**        | —                 | R/học theo quyền              | R như người dùng cá nhân        | C/R/U/D\* nội dung NEXA                     |
| **Tài khoản và gói**     | Đăng ký/đăng nhập | R/U hồ sơ/gói bản thân        | R gói Business, yêu cầu gia hạn | Quản lý gói, quyền lợi, trạng thái có audit |
| **Thanh toán/đối soát**  | —                 | Xem/thanh toán hợp lệ         | Xem thông tin gói tổ chức       | Xử lý theo quyền tài chính                  |
| **Báo cáo tổ chức**      | —                 | R bản thân                    | R/xuất trong tenant             | Không xem chi tiết theo mặc định            |
| **AI/cấu hình hệ thống** | —                 | Sử dụng theo quyền lợi        | Sử dụng theo quota tổ chức      | Giám sát/cấu hình theo capability           |

# 20. Kịch bản nghiệp vụ và kiểm thử

| **Kịch bản** | **Tên luồng**                    | **Luồng chính**                                                                                                                        | **Kiểm tra ngoại lệ**                                                               |
|--------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| **FL-01**    | Từ thư viện tới kết quả Personal | Admin phát hành đề → User tra cứu → Kiểm tra Free/Premium → Làm/nộp → MCQ tự chấm → phần mở chấm nếu có → công bố → cập nhật hồ sơ.    | User chưa đủ quyền Premium được hướng nâng cấp, không tạo phiên thi trái quyền.     |
| **FL-02**    | Giao bài từ lớp cá nhân          | Người quản lý lớp giao đề → thành viên thấy ở Personal/Bài được giao → làm và nộp → người có quyền xem/chấm.                           | Không cần Organization Dashboard.                                                   |
| **FL-03**    | Giao bài từ tổ chức              | Org Admin chọn lớp hoặc đề → tạo đợt (nháp/xem trước/phát hành) → Member nhận bài ở Personal → nộp → chấm/công bố → báo cáo.           | Không giao trùng và không lẫn bài giữa các đợt.                                     |
| **FL-04**    | Đề hỗn hợp và chấm               | Nộp bài có MCQ và tự luận/thực hành → MCQ có điểm ngay → phần mở PENDING → người chấm theo rubric → duyệt → tổng /100.                 | Không hiện 32/100 khi phần 60 điểm chưa chấm; chỉ hiện 32/40 phần MCQ nếu cho phép. |
| **FL-05**    | Lộ trình học tập                 | Admin tạo lộ trình/học phần → gắn đề NEXA → phát hành → User học/làm bài → cập nhật tiến độ và năng lực.                               | Tái sử dụng đề, không nhân bản dữ liệu đề.                                          |
| **FL-06**    | Business và gia hạn              | Guest gửi yêu cầu → Admin xử lý/kích hoạt → Org Owner nhận lời mời → Org hoạt động → Admin Org đề nghị gia hạn → Admin hệ thống duyệt. | Không cần hợp đồng; entitlement và hạn dùng đúng.                                   |
| **FL-07**    | Phòng thi trực tiếp              | Host cá nhân/tổ chức tạo phòng → cấp mã → thí sinh tham gia → host điều hành → thí sinh nộp → xem kết quả theo chính sách.             | Phòng tổ chức không xuất hiện như phòng cá nhân ngoài quyền.                        |
| **FL-08**    | Xử lý sự cố có kiểm soát         | Người dùng gửi hỗ trợ → System Admin xác minh quyền và phạm vi → tra cứu log/định danh → xử lý theo capability → ghi audit.            | Không có thao tác sửa điểm trực tiếp không căn cứ.                                  |

# 21. Tiêu chí nghiệm thu và truy vết

| **Mã**    | **Hạng mục**             | **Tiêu chí nghiệm thu**                                                                   | **Truy vết**                      |
|-----------|--------------------------|-------------------------------------------------------------------------------------------|-----------------------------------|
| **AC-01** | Website công khai        | Tất cả UC-G còn hiệu lực chạy được; UC-G03 không xuất hiện.                               | FR-G01..08 (trừ 03)               |
| **AC-02** | Personal và quyền gói    | Thư viện NEXA thể hiện Free/Premium và chặn truy cập trái quyền ở backend.                | FR-P03/P04, FR-A10/A11, BR-11/12  |
| **AC-03** | Bài được giao thống nhất | Hai nguồn lớp cùng hiển thị ở Personal → Bài được giao, đúng nguồn, không trùng.          | FR-P10/P12, FR-O07, BR-13/14      |
| **AC-04** | Điểm và công bố          | MCQ có điểm sau nộp; phần mở null chờ chấm; tổng/100 chỉ có khi hoàn tất.                 | FR-P05/P06, FR-O10/O11, BR-03..10 |
| **AC-05** | Luồng Organization       | Tạo đợt, lưu nháp, phát hành, theo dõi 2 trạng thái và công bố hoạt động đúng.            | FR-O07/O08/O09/O11, BR-15/16      |
| **AC-06** | Phòng thi                | Personal và Organization có phòng thi trực tiếp với quyền host/thí sinh rõ.               | FR-P14/P19, FR-O18..20            |
| **AC-07** | Quản trị lộ trình        | System Admin CRUD lộ trình, học phần, gắn đề và phát hành; Personal theo dõi tiến độ.     | FR-A12..14, FR-P08/P09            |
| **AC-08** | Quản trị Business        | Kích hoạt, entitlement, gia hạn và thanh toán liên kết hồ sơ khách hàng, chống lặp.       | FR-A03..08, FR-O16/O17            |
| **AC-09** | Bảo vệ tenant            | Admin tổ chức A không xem/sửa dữ liệu tổ chức B; System Admin không vượt quyền.           | BR-02/22/23, NFR-01..03           |
| **AC-10** | Dữ liệu báo cáo          | Số liệu không có không hiển thị 0; chỉ tính bài hợp lệ đã hoàn thành chấm.                | FR-O12/O13, FR-A17, BR-21         |
| **AC-11** | Chức năng Admin          | Admin quản lý nội dung NEXA, gói, người dùng, khách hàng, AI, hỗ trợ và audit theo quyền. | FR-A01..27                        |
| **AC-12** | Bảo toàn dữ liệu         | Migration không làm mất submission/điểm/entitlement/tiến độ cũ.                           | BR-08/20, NFR-05/12               |

Các hàng FR-G/P/O/A đã ánh xạ 1:1 từ mã Use Case. Quy tắc BR, tiêu chí AC và kiểm thử tích hợp phải được liên kết trong backlog/QA; nghiệm thu không thể chỉ dựa trên việc trang hiển thị thành công.

# 22. Các vấn đề cần xác nhận

| **Mã**   | **Chủ đề**            | **Nội dung cần xác nhận**                                                      |
|----------|-----------------------|--------------------------------------------------------------------------------|
| **Q-01** | Phân hạng Premium     | Gói nào mở đề nào, giới hạn lượt làm và điều kiện đổi gói cụ thể.              |
| **Q-02** | Cấu trúc học liệu     | Học phần chứa văn bản, video, file, link hoặc tương tác tới mức nào.           |
| **Q-03** | Chính sách công bố    | Có hiển thị điểm MCQ trước khi công bố tổng điểm hay không, theo loại bài/đợt. |
| **Q-04** | Lộ trình và phiên bản | Cách di trú tiến độ khi bài/lộ trình đã phát hành được cập nhật.               |
| **Q-05** | Phòng thi tổ chức     | Phạm vi chức năng realtime/giới hạn người dự thi và điều kiện vận hành.        |
| **Q-06** | PTS và chứng chỉ      | Công thức PTS, cấp độ và điều kiện chứng chỉ chính thức.                       |
| **Q-07** | Bảo mật – hiệu năng   | Mục tiêu SLA, RPO/RTO, lưu log và giới hạn upload cần được đo/xác nhận.        |
| **Q-08** | Admin support access  | Quy trình cấp quyền tạm thời, phê duyệt và giới hạn phạm vi khi xử lý sự cố.   |
