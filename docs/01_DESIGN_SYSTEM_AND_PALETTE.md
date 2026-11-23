# QUY CHUẨN THIẾT KẾ GIAO DIỆN VÀ BẢN SẮC THƯƠNG HIỆU NEXA AI
# DESIGN SYSTEM & BRAND VISUAL GUIDELINES

Mã định danh: `DOC-NEXA-DESIGN-SYSTEM-2026`  
Phiên bản: `v3.0.0-PUBLIC`  
Dành cho: Khách hàng, Đối tác giáo dục, Ban Giám hiệu, Chuyên gia trải nghiệm người dùng  
Tiêu chuẩn tuân thủ: Chuẩn dễ đọc quốc tế WCAG 2.2 AA, Bộ quy tắc thiết kế tinh gọn `AGENTS.md`

## 1. TRIẾT LÝ THIẾT KẾ VÀ TRẢI NGHIỆM THỊ GIÁC

NEXA AI định vị là nền tảng SaaS công nghệ giáo dục và khảo thí năng lực số đạt chuẩn quốc tế. Giao diện được xây dựng nhằm mang lại cảm giác học thuật, tinh tế, tin cậy và hiện đại, giúp người học và các nhà quản lý tập trung tối đa vào dữ liệu năng lực thực tế.

Nền tảng vận hành theo nguyên tắc xuyên suốt: **Ba không gian, một bản sắc đồng nhất**. Dù người dùng đang ở vai trò cá nhân học tập, ban giám hiệu quản lý lớp học hay ban quản trị vận hành sàn, tất cả đều được trải nghiệm cùng một ngôn ngữ thiết kế, cùng một hệ màu chuẩn mực và trải nghiệm thao tác trực quan.

### 1.1. Mục tiêu cốt lõi của giao diện
- **Tính rõ ràng và tập trung:** Mọi số liệu, biểu đồ và câu hỏi khảo thí đều được trình bày sáng sủa, không có các yếu tố đồ họa thừa thãi làm phân tâm.
- **Dịu mắt và bảo vệ thị lực:** Cân bằng ánh sáng khoa học giữa chế độ ban ngày và ban đêm, giúp học viên làm bài thi liên tục nhiều giờ mà không bị mỏi mắt.
- **Chuẩn mực công nghệ cao:** Loại bỏ hoàn toàn phong cách rập khuôn màu mè, hướng tới vẻ đẹp tối giản của các sản phẩm công nghệ giáo dục hàng đầu thế giới.

## 2. BẢNG MÀU CHÍNH THỨC TOÀN HỆ THỐNG

### 2.1. Chế độ Ban ngày (Light Mode — Mặc định)
Chế độ ban ngày sử dụng gam màu trắng tinh khiết làm chủ đạo, kết hợp với các sắc độ xám trung tính và điểm nhấn xanh Cobalt tin cậy.

| Thành phần giao diện | Mã màu HEX | Cảm nhận thị giác | Mục đích ứng dụng |
| :--- | :--- | :--- | :--- |
| Nền trang chính | `#FFFFFF` | Trắng tinh khiết | Nền tảng toàn bộ trang web, tạo không gian thoáng đãng |
| Nền phụ phân nhóm | `#F8FAFC` | Xám sáng dịu | Phân cách nhẹ nhàng các bảng danh sách, thanh công cụ phụ |
| Tiêu đề & Số liệu quan trọng | `#171717` | Than chì sâu | Tên màn hình, điểm số tổng quan, số liệu thống kê chủ chốt |
| Nội dung bài đọc & Câu hỏi | `#262626` | Đen xám trung tính | Đọc văn bản dài dễ chịu, tương phản vừa vặn không gây lóa |
| Chữ phụ & Chú thích | `#64748B` | Xám ghi tao nhã | Ngày giờ, hướng dẫn phụ, ghi chú bài thi |
| Đường viền khung thẻ | `#E2E8F0` | Xám nhạt thanh mảnh | Bao bọc các khối nội dung độc lập, giúp thông tin ngăn nắp |
| Xanh thương hiệu Cobalt | `#2563EB` | Xanh dương đậm đà | Màu nhận diện chủ quyền cho nút bấm chính, liên kết, mục đang chọn |
| Xanh khi bấm / Rê chuột | `#1D4ED8` | Xanh thẫm tự tin | Phản hồi xúc giác khi người dùng tương tác với nút bấm |
| Xanh nền đánh dấu nhẹ | `#EFF6FF` | Xanh nhạt mát mắt | Tô sáng dòng dữ liệu đang được chọn trong bảng |

Nguyên tắc vàng: Không dùng màu đen tuyệt đối cho toàn bộ đoạn văn vì gây căng thẳng thị giác; chữ chính luôn là than chì trung tính. Màu xanh Cobalt chỉ đóng vai trò chỉ dẫn hành động, không dùng làm màu chữ cho các đoạn văn thông thường.

### 2.2. Chế độ Ban đêm (Dark Mode — Đen thật cao cấp)
Chế độ ban đêm của NEXA AI được thiết kế bằng màu đen thật (True Black), không sử dụng nền xanh tím than hay xám đục.

| Thành phần giao diện | Mã màu HEX | Cảm nhận thị giác | Mục đích ứng dụng |
| :--- | :--- | :--- | :--- |
| Nền trang chính | `#000000` | Đen sâu thẳm | Tiết kiệm năng lượng màn hình, tạo chiều sâu cho phòng thi đêm |
| Nền thanh điều hướng | `#0A0A0B` | Đen ghi phân cấp | Thanh điều hướng bên trái và thanh tiêu đề phía trên |
| Nền thẻ nội dung (Card) | `#111114` | Đen ánh xám nhẹ | Nổi bật thông tin bài học và bảng biểu trên nền đen |
| Tiêu đề & Thông tin chính | `#F5F5F5` | Trắng ngà êm dịu | Tiêu đề khối thi, tỷ lệ phần trăm năng lực số |
| Nội dung văn bản thường | `#E4E4E7` | Xám sáng mềm mại | Nội dung câu hỏi và phân tích chi tiết kết quả |
| Chữ chú thích phụ | `#A3A3A3` | Ghi xám mờ vừa đủ | Thông tin tác giả, thời hạn chứng chỉ, mã hiệu |
| Đường viền bao quanh | `#27272A` | Viền xám chì tinh tế | Giúp các khối thẻ tách biệt sắc nét mà không cần đổ bóng |
| Xanh nhấn sáng ban đêm | `#60A5FA` | Xanh da trời dịu sáng | Dành cho các liên kết, biểu tượng đang kích hoạt trong nền tối |
| Nút bấm hành động chính | `#2563EB` | Xanh Cobalt đồng nhất | Đảm bảo vị trí nút nộp bài, làm bài luôn đồng bộ giữa ngày và đêm |

Nguyên tắc ban đêm: Các khối nội dung được phân tách nhờ độ tương phản vi tế của viền xám `#27272A`, loại bỏ hoàn toàn việc dùng hiệu ứng phát sáng hào quang (glow) gây mỏi mắt.

### 2.3. Màu sắc trạng thái và Ngữ nghĩa thông tin
NEXA AI sử dụng màu sắc có ý nghĩa quy ước quốc tế để người học lập tức nhận diện trạng thái bài thi:

| Trạng thái | Gam màu biểu thị | Ý nghĩa trực quan |
| :--- | :--- | :--- |
| Đạt chuẩn / Hoàn thành | Xanh ngọc lục bảo (`#059669` / `#34D399`) | Bài thi đạt chuẩn trên 70%, cấp chứng chỉ số thành công |
| Đang thẩm định / Chờ duyệt | Vàng hổ phách (`#D97706` / `#FBBF24`) | Đề thi đang được chuyên gia chấm điểm, nhắc nhở sắp đến hạn |
| Cần rèn luyện thêm / Cảnh báo | Đỏ hồng ngọc (`#E11D48` / `#F43F5E`) | Khoảng trống năng lực cần bù đắp, cảnh báo rời khỏi màn hình thi |
| Năng động / Phòng thi trực tiếp | Xanh Volt rực rỡ (`#D4FF24`) | Đèn báo phòng thi đang phát trực tiếp, nhịp điệu thi đấu thời gian thực |
| Vinh dự / Thành tích xuất sắc | Vàng kim ấm áp (`#FF9A27`) | Huy chương thành tích, con dấu danh dự trên chứng chỉ năng lực |

## 3. NGUYÊN TẮC TRÌNH BÀY CHỮ VIẾT (TYPOGRAPHY)

Chữ viết trên NEXA AI được tinh chỉnh theo tiêu chuẩn ấn bản học thuật hiện đại:
- **Văn bản đọc thông thường:** Sử dụng phông chữ không chân (Sans-serif) thanh thoát, khoảng cách dòng thoáng (1.6x) giúp học viên dễ dàng theo dõi các tình huống bài thi phức tạp.
- **Các con số và dữ liệu định lượng:** Bắt buộc sử dụng phông chữ đơn cách (Monospace) với các chữ số có bề ngang bằng nhau tuyệt đối. Điều này giúp các bảng điểm số, mã đề thi, thời gian đếm ngược từng giây và mã phòng thi PIN 6 số luôn thẳng hàng ngay ngắn, không bị xô lệch khi số thay đổi.
- **Văn bằng chứng chỉ danh dự:** Tên học viên và các chức danh người ký trên chứng chỉ số được trình bày bằng kiểu chữ nghệ thuật trang trọng, kết hợp hài hòa giữa truyền thống chứng nhận học thuật và công nghệ số hóa.

## 4. BỘ NGUYÊN TẮC THIẾT KẾ TINH GỌN (CHỐNG RẬP KHUÔN "AI SLOP")

Để đảm bảo hình ảnh chuyên nghiệp, đẳng cấp cho các đơn vị giáo dục và doanh nghiệp sử dụng nền tảng, NEXA AI áp dụng các chuẩn mực thẩm mỹ nghiêm ngặt:

- **Nói không với viền ngang chia cắt thô bạo:** Giao diện không sử dụng các đường kẻ ngang cơ học cắt ngang trang giấy. Thay vào đó, nội dung được đóng gói trọn vẹn trong các Thẻ thông tin (Card) bo góc mềm mại, kết hợp khoảng cách trắng tự nhiên để tạo nhịp điệu thị giác.
- **Không lạm dụng hiệu ứng đồ họa lòe loẹt:** Nghiêm cấm các dải màu gradient cầu vồng, hiệu ứng phát sáng neon chói gắt, bóng đổ quá lớn hoặc thẻ kính mờ giả tạo làm giảm độ tập trung.
- **Biểu tượng tối giản, chuẩn mực:** Toàn bộ biểu tượng trên hệ thống là biểu tượng nét mảnh chuyên nghiệp, thống nhất về độ dày nét vẽ (1.75 đơn vị). Không sử dụng emoji ngẫu hứng trong các bảng quản trị và giao diện làm bài thi.
- **Tôn trọng tính chân thực của dữ liệu:** Không bao giờ vẽ các con số 0% giả tạo hoặc các thanh tiến độ ảo. Nếu người học chưa làm bài đánh giá, hệ thống ghi nhận rõ ràng là "Chưa có bằng chứng" thay vì hiển thị điểm 0 làm nhụt chí người học.
- **Dễ tiếp cận cho mọi người (WCAG 2.2 AA):** Độ tương phản giữa chữ và nền luôn vượt tiêu chuẩn quốc tế (tối thiểu 4.5:1 đối với văn bản thông thường và trên 16:1 đối với tiêu đề chính), các nút bấm có diện tích tiếp xúc rộng rãi, hỗ trợ điều khiển thuận tiện trên màn hình cảm ứng điện thoại lẫn chuột máy tính.
