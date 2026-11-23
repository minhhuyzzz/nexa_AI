# QUY TRÌNH NGHIỆP VỤ VÀ LUỒNG VẬN HÀNH TOÀN DIỆN NEXA AI
# END-TO-END BUSINESS WORKFLOWS & OPERATIONAL MANUAL

Mã định danh: `DOC-NEXA-BUSINESS-FLOWS-2026`  
Phiên bản: `v3.0.0-PUBLIC`  
Dành cho: Khách hàng, Ban Giám hiệu, Doanh nghiệp đối tác, Chuyên viên phân tích nghiệp vụ  
Tiêu chuẩn tuân thủ: Bộ quy tắc `AGENTS.md`, Chuẩn vận hành khảo thí số quốc tế

## 1. MÔ HÌNH VẬN HÀNH: BA KHÔNG GIAN, MỘT DANH TÍNH DUY NHẤT

Nền tảng NEXA AI được thiết kế xoay quanh triết lý thống nhất tài khoản: Một người dùng chỉ cần một tài khoản đăng nhập duy nhất nhưng có thể linh hoạt chuyển đổi giữa ba không gian làm việc khác nhau:

```mermaid
graph TD
    User["Tài khoản Đăng nhập Duy nhất"] --> P["1. Không gian Cá nhân (Personal)"]
    User --> O["2. Không gian Tổ chức (Organization Business)"]
    User --> A["3. Không gian Quản trị Nền tảng (Platform Admin)"]

    P --> P1["Làm bài khảo thí & Theo dõi Radar 5 miền"]
    P --> P2["Lộ trình tự học & Nhận chứng chỉ số"]
    P --> P3["Tạo nhóm học tập & Phòng thi giao lưu"]

    O --> O1["Trường học / Doanh nghiệp quản lý học viên"]
    O --> O2["Tổ chức các đợt thi & Giao bài tập lớp"]
    O --> O3["Bàn chấm bài thi tự luận kết hợp AI"]
    O --> O4["Báo cáo năng lực tập thể & Phân tích khoảng trống"]

    A --> A1["Phê duyệt hợp đồng trường học & Doanh nghiệp"]
    A --> A2["Quản lý ngân hàng đề chuẩn & Duyệt đóng góp"]
    A --> A3["Cấu hình điểm thưởng & Giám sát an ninh toàn sàn"]
```

### 1.1. Không gian Cá nhân (Personal Workspace)
- Dành cho học viên tự do, sinh viên, giáo viên tự rèn luyện.
- Người học tự chẩn đoán năng lực số ban đầu, xem biểu đồ Radar cá nhân, tự tạo đề luyện tập, tạo phòng thi giao lưu và nhận chứng chỉ số khi đạt chuẩn.

### 1.2. Không gian Tổ chức / Doanh nghiệp (Organization Business Workspace)
- Dành cho các Trường Đại học, Trường Cao đẳng, Trường Phổ thông hoặc Doanh nghiệp đào tạo nhân sự.
- Cho phép quản lý danh sách lớp học, phân công giảng viên chấm bài, tổ chức các kỳ thi đánh giá năng lực số diện rộng, và xuất báo cáo phân tích năng lực tập thể cho ban giám hiệu/lãnh đạo.

### 1.3. Không gian Quản trị Nền tảng (Platform Admin Console)
- Dành cho Ban điều hành và Hội đồng Khảo thí NEXA AI.
- Quản trị danh mục khách hàng tổ chức, thẩm định nội dung câu hỏi đóng góp, cấu hình chính sách điểm thưởng, quản lý phôi chứng chỉ danh dự và giám sát an toàn toàn hệ thống.

## 2. BẢN ĐỒ TỔNG THỂ TOÀN BỘ VÒNG ĐỜI NGHIỆP VỤ

Mọi hoạt động trên NEXA AI đều tuân theo vòng tròn khép kín: **Khảo thí có bằng chứng $\rightarrow$ Phát hiện khoảng trống $\rightarrow$ Gợi ý nội dung học $\rightarrow$ Thực hành thi đấu $\rightarrow$ Cấp chứng nhận số**.

```mermaid
flowchart TD
    Start["Học viên bắt đầu"] --> Survey["Khảo sát chẩn đoán đầu vào"]
    Survey --> RadarT0["Vẽ biểu đồ Radar xuất phát (T0)"]
    RadarT0 --> Gap["Phân tích khoảng trống năng lực số"]
    Gap --> Learn["Gợi ý lộ trình bài học rèn luyện"]
    Learn --> LivePractice["Tham gia thi trực tiếp hoặc Lớp học"]
    LivePractice --> Exam["Làm bài thi khảo thí đạt chuẩn"]
    Exam --> CheckPass{"Điểm đạt từ 70% trở lên?"}
    CheckPass -- "Chưa đạt" --> ReLearn["Tiếp tục rèn luyện theo lộ trình"]
    ReLearn --> LivePractice
    CheckPass -- "Đạt chuẩn" --> Accredit["Tích lũy năng lực hồ sơ dài hạn"]
    Accredit --> Cert["Cấp Chứng chỉ số có Mộc đỏ & Mã QR"]
    Cert --> PublicVerify["Xác thực văn bằng công khai toàn cầu"]
```

## 3. CHI TIẾT CÁC LUỒNG NGHIỆP VỤ CỐT LÕI

### 3.1. Luồng 1: Khảo thí Đầu vào & Chẩn đoán Năng lực Số Khởi đầu
Mục đích: Xác định chính xác mặt bằng năng lực số ban đầu của học viên ngay khi tham gia hệ thống mà không áp đặt định kiến.

```mermaid
sequenceDiagram
    autonumber
    actor Learner as "Người học"
    participant Web as "Giao diện NEXA"
    participant Engine as "Bộ máy Chấm thi Tự động"
    participant Profile as "Hồ sơ Năng lực Số"

    Learner ->> Web: Bắt đầu làm bài khảo sát đầu vào
    Web ->> Engine: Kiểm tra quyền (Mỗi học viên chỉ làm 1 lần xuất phát)
    Engine -->> Web: Mở đề thi khảo sát chuẩn 5 miền năng lực
    Learner ->> Web: Hoàn thành bài thi và bấm Nộp bài
    Web ->> Engine: Gửi toàn bộ câu trả lời
    Engine ->> Engine: Chấm điểm khách quan theo 5 miền
    Engine ->> Profile: Lưu mốc vạch xuất phát ban đầu (Điểm chuẩn T0)
    Profile -->> Web: Trả về biểu đồ Radar vạch xuất phát
    Web -->> Learner: Hiển thị ngay khoảng trống và miền năng lực cần bồi dưỡng
```

Quy tắc nghiệp vụ:
- Bài khảo sát đầu vào chỉ được thực hiện một lần duy nhất để thiết lập vạch xuất phát.
- Hệ thống không cộng điểm thưởng tràn lan từ bài khảo sát đầu vào để tránh hiện tượng gian lận cày điểm ảo. Điểm số thiết lập này là căn cứ so sánh sự tiến bộ vượt bậc của học viên về sau.

### 3.2. Luồng 2: Tổ chức Phòng thi Trực tiếp Thời gian thực (Live Exam Room)
Mục đích: Cho phép giảng viên hoặc học viên tự tổ chức các buổi thi đấu, kiểm tra trực tiếp trong lớp học hoặc giao lưu cộng đồng với trải nghiệm đồng bộ tức thì.

```mermaid
sequenceDiagram
    autonumber
    actor Host as "Chủ phòng / Giáo viên"
    actor Candidate as "Thí sinh / Học sinh"
    participant Room as "Phòng thi Trực tiếp"
    participant LiveEngine as "Hệ thống Phát sóng Thời gian thực"

    Host ->> Room: Tạo phòng thi và chọn đề bài chuẩn
    Room -->> Host: Cung cấp Mã PIN 6 chữ số
    Host ->> Candidate: Chia sẻ mã PIN vào phòng
    Candidate ->> Room: Nhập mã PIN 6 số và tên tham dự
    Room ->> LiveEngine: Tự động ghi danh thí sinh vào trạng thái Sẵn sàng
    LiveEngine -->> Host: Màn hình giáo viên hiển thị danh sách thí sinh tức thì
    Host ->> Room: Nhấn nút Bắt đầu kỳ thi
    LiveEngine -->> Candidate: Màn hình thí sinh đồng loạt kích hoạt làm bài
    LiveEngine -->> Candidate: Đồng hồ đếm ngược chạy đồng bộ từng giây
    Candidate ->> Room: Nộp bài thi
    LiveEngine -->> Host: Bảng xếp hạng và tỷ lệ hoàn thành cập nhật ngay lập tức
```

Quy tắc nghiệp vụ:
- Thí sinh chỉ cần nhập mã PIN 6 chữ số duy nhất là có thể tham gia ngay lập tức, không qua các bước đăng ký phức tạp.
- Hệ thống hỗ trợ chế độ giám sát thi thông minh: Cảnh báo khi thí sinh chuyển sang tab khác hoặc thoát khỏi toàn màn hình để đảm bảo tính nghiêm túc.

### 3.3. Luồng 3: Khảo thí Tổ chức & Lớp học Doanh nghiệp
Mục đích: Hỗ trợ trường học và doanh nghiệp vận hành các kỳ thi đánh giá diện rộng có cả câu hỏi trắc nghiệm tự động và bài thực hành nộp tệp cần giảng viên chấm điểm.

```mermaid
sequenceDiagram
    autonumber
    actor AdminOrg as "Ban Quản lý Trường"
    actor Assessor as "Giảng viên Chấm thi"
    actor Student as "Học sinh / Nhân viên"
    participant Platform as "Nền tảng Khảo thí"
    participant AIGateway as "Trợ lý AI Gợi ý Rubric"

    AdminOrg ->> Platform: Thiết lập Đợt thi và phân công danh sách lớp
    Platform ->> Student: Gửi thông báo bài tập được giao
    Student ->> Platform: Làm bài trắc nghiệm và tải lên tệp bài làm thực hành
    Platform ->> Platform: Tự động chấm phần trắc nghiệm
    Platform ->> Assessor: Mở Bàn chấm bài cho các câu tự luận / nộp tệp
    Assessor ->> AIGateway: Yêu cầu gợi ý đánh giá theo tiêu chuẩn Rubric
    AIGateway -->> Assessor: Đề xuất điểm số và nhận xét mẫu khách quan
    Assessor ->> Platform: Phê duyệt điểm chính thức và nhận xét cuối cùng
    AdminOrg ->> Platform: Nhấn Công bố kết quả đợt thi
    Platform -->> Student: Xem bảng phân tích chi tiết bài thi
    Platform -->> AdminOrg: Xuất báo cáo tổng hợp năng lực toàn trường
```

Quy tắc nghiệp vụ:
- Tách biệt rõ ràng giữa hai giai đoạn: Giai đoạn chấm thi nội bộ và Giai đoạn công bố kết quả. Thí sinh chỉ xem được điểm và đáp án khi nhà trường cho phép công bố.
- Giảng viên là người quyết định điểm số cao nhất; AI chỉ đóng vai trò trợ lý gợi ý tiêu chí chấm, loại bỏ hoàn toàn việc để máy tự ý đánh trượt thí sinh một cách thiếu nhân văn.

### 3.4. Luồng 4: Đóng góp Đề thi Cộng đồng & Xét duyệt Học thuật
Mục đích: Huy động trí tuệ tập thể từ giảng viên và chuyên gia số trên toàn quốc nhằm liên tục làm giàu ngân hàng đề thi tình huống thực tế.

```mermaid
flowchart TD
    User["Người học / Giáo viên"] --> Submit["Gửi tình huống hoặc bài thực hành mới"]
    Submit --> Queue["Hồ sơ chuyển vào Hàng đợi chờ Thẩm định"]
    Queue --> Reviewer["Hội đồng Thẩm định Học thuật NEXA"]
    Reviewer --> Decision{"Quyết định đánh giá?"}
    Decision -- "Chưa đạt yêu cầu" --> Feedback["Gửi phản hồi góp ý bổ sung cho tác giả"]
    Feedback --> User
    Decision -- "Đạt chuẩn xuất sắc" --> Approve["Phê duyệt đề xuất"]
    Approve --> AddBank["Tự động chuyển vào Ngân hàng Đề chung"]
    Approve --> Reward["Cộng điểm thưởng uy tín cho tác giả"]
    Reward --> LogAudit["Ghi nhận công khai vào Nhật ký Đóng góp"]
```

Quy tắc nghiệp vụ:
- Mức điểm thưởng khi đề xuất được duyệt được thiết lập linh hoạt theo cấu hình hệ thống (mặc định 20 điểm hoặc điều chỉnh theo độ khó và chất lượng thực tế của tình huống).
- Tác giả được vinh danh trong hồ sơ đóng góp cộng đồng của nền tảng.

### 3.5. Luồng 5: Cấp phát và Xác thực Chứng chỉ Số Toàn cầu
Mục đích: Cấp chứng nhận năng lực số có giá trị pháp lý, chống giả mạo tuyệt đối và cho phép nhà tuyển dụng tra cứu tức thì 24/7.

```mermaid
sequenceDiagram
    autonumber
    actor Learner as "Học viên đạt chuẩn"
    participant System as "Hội đồng Khảo thí NEXA"
    participant Credential as "Hệ thống Chứng chỉ Số"
    actor Employer as "Nhà tuyển dụng / Nhà trường"

    Learner ->> System: Hoàn thành kỳ thi chuẩn hóa đạt kết quả từ 70% trở lên
    System ->> Credential: Đóng dấu mộc đỏ điện tử và Chữ ký số của Chủ tịch Hội đồng
    System ->> Credential: Tạo Mã băm bảo mật chống giả mạo
    Credential -->> Learner: Cấp Chứng chỉ số chính thức kèm Mã tra cứu và Mã QR
    Learner ->> Employer: Đính kèm liên kết chứng chỉ vào CV hoặc LinkedIn
    Employer ->> Credential: Quét mã QR hoặc truy cập trang tra cứu công khai
    Credential -->> Employer: Hiển thị ngay toàn bộ thông tin gốc, điểm số và tính hợp lệ
```

Quy tắc nghiệp vụ:
- Chứng chỉ được xác thực bảo mật qua hai lớp mã băm, đảm bảo nếu bất kỳ ai sửa đổi dù chỉ một ký tự trên chứng chỉ, hệ thống sẽ lập tức báo vi phạm tính toàn vẹn.
- Bất kỳ ai cũng có thể kiểm tra tính thật/giả của chứng chỉ tại cổng tra cứu công khai mà không cần tạo tài khoản hay đăng nhập.

## 4. MA TRẬN PHÂN QUYỀN VÀ TRÁCH NHIỆM CHỨC NĂNG

| Chức năng chính | Học viên tự do | Giảng viên chấm thi | Ban Quản lý Trường | Quản trị viên Nền tảng |
| :--- | :---: | :---: | :---: | :---: |
| Làm bài khảo sát đầu vào & Xem Radar cá nhân | Có quyền | Có quyền | Có quyền | Có quyền |
| Tự tạo đề thi luyện tập cá nhân | Có quyền | Có quyền | Có quyền | Có quyền |
| Tạo và điều hành phòng thi trực tiếp Live | Có quyền | Có quyền | Có quyền | Có quyền |
| Quản lý lớp học và giao bài tập theo lớp | Không | Có quyền | Toàn quyền | Toàn quyền |
| Sử dụng Bàn chấm thi và xem gợi ý AI | Không | Toàn quyền | Toàn quyền | Toàn quyền |
| Xuất báo cáo năng lực số tập thể toàn trường | Không | Không | Toàn quyền | Toàn quyền |
| Đóng góp câu hỏi và tình huống mới | Có quyền | Có quyền | Có quyền | Toàn quyền |
| Thẩm định và duyệt đề thi cộng đồng | Không | Không | Không | Toàn quyền |
| Cấu hình mẫu phôi chứng chỉ & mộc đỏ | Không | Không | Không | Toàn quyền |
| Cấu hình mức điểm thưởng và bảo trì hệ thống | Không | Không | Không | Toàn quyền |
