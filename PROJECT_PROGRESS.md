# NEXA SYSTEM — BÁO CÁO TIẾN ĐỘ & GHI NHỚ HỆ THỐNG (SESSION LOG)

*Cập nhật lần cuối: 17/10/2026*

---

## 1. TỔNG QUAN CÁC CÔNG VIỆC ĐÃ HOÀN TẤT TRONG PHIÊN

### A. Hệ thống Nhận diện Thương hiệu & Logo (Brand & Logo)
- Chuẩn hóa bộ vector SVG cho toàn nền tảng dựa trên file ảnh gốc:
  - `public/favicon.svg`
  - `public/logo-dark.svg`
  - `public/logo-white.svg`
  - Component `src/components/brand/NexaLogo.tsx` hỗ trợ tự co giãn, chế độ sáng/tối và thu nhỏ icon khi đóng sidebar.
- Font chữ: Chuẩn hóa theo `Inter` (`font-sans`), loại bỏ triệt để các font lạ, font monospace gây gạch chéo số 0 (`Ø`).

### B. Kiến trúc & Đặc tả Nghiệp vụ (Business Model & Workflow)
- Đã lập tài liệu đặc tả hoàn chỉnh: `BUSINESS_MODEL_AND_WORKFLOW_SPEC.md`:
  - **Mô hình 3 gói dịch vụ**: `Free` (Cộng đồng), `Pro Cá nhân` (69k/tháng), `Enterprise / Tổ chức` (Theo quy mô).
  - **Cơ chế AI On-Demand (Bất biến)**: Khi nộp bài chấm 0.01s bằng code thuần (tốn 0 đồng AI); AI chỉ kích hoạt khi Learner hoặc Evaluator chủ động bấm nút yêu cầu.
  - **Luồng liên thông 3 Dashboard**: Learner &harr; Evaluator &harr; Admin.

### C. Cổng Duyệt Đề Thi Cộng Đồng (Admin & Learner)
- **Admin**:
  - Tạo trang `/admin/contributions` (`AdminContributionReviewPage`) hỗ trợ Admin duyệt đề do người học đóng góp, tải tệp đính kèm (`.docx`, `.xlsx`, `.pdf`), duyệt cộng 100 điểm hoặc gửi yêu cầu hiệu chỉnh kèm phản hồi.
  - Tích hợp huy hiệu cảnh báo (Badge màu hổ phách `1`) trên `AdminSidebar` và thông báo nhanh trên `AdminDashboardPage`.
- **Learner**:
  - Trang `/learner/contribute`: Tinh gọn giao diện, bỏ các thẻ thống kê rườm rà, tập trung vào bảng quản lý đề đã nộp và modal đóng góp bài thi.

### D. Tối ưu Dashboard Người học (`/learner/dashboard`)
1. **Dải chỉ số (Metric Strip)**:
   - Thêm icon chuẩn vector: `CheckSquare` (Bài đã làm), `Compass` (Miền đạt chuẩn), `Trophy` (Điểm tích luỹ), `Award` (Chứng chỉ).
   - Xóa bỏ toàn bộ đường kẻ ngang trên và dưới, bỏ các dòng chú thích phụ, số hiển thị font thường rõ nét.
2. **Khối Cấp độ (Level Indicator)**:
   - Tinh giản, loại bỏ dòng `(40% cấp này)` và `Còn 60đ để đạt...`, chỉ giữ tiêu đề cấp, điểm số và popup quy chế phân tầng điểm.
3. **Biểu đồ Mạng nhện Năng lực (`CompetencyRadarChart.tsx`)**:
   - Loại bỏ các chữ phân cấp rườm rà (`Thành thạo`, `Đạt chuẩn`, `Nâng cao`, `Cơ bản`), chỉ hiển thị Tên miền + Phần trăm (`85%`).
   - Xử lý dứt điểm lỗi chữ dính vào biểu đồ bằng thuật toán định hướng anchor: bên phải `textAnchor="start"`, bên trái `textAnchor="end"`, trên cùng `textAnchor="middle"`.
   - Vòng lưới 100% được định vị an toàn bên trong để không đè lên tiêu đề.
   - Thay thế 5 thẻ tiến độ thừa bằng hộp Chẩn đoán AI trực quan đặt cạnh biểu đồ.

### E. Tối ưu Topbar Người học (`LearnerTopbar.tsx`)
- Trạng thái đầu trang (`scrollY <= 15`): Hoàn toàn trong suốt (`bg-transparent`), không viền, hòa làm một với nền trang.
- Trạng thái cuộn xuống (`scrollY > 15`): Tự động hiện nền kính mờ `bg-white/90 backdrop-blur-md` và viền mảnh sang trọng để nội dung cuộn bên dưới không bị đè lên thanh điều hướng.
- Ô tìm kiếm và điểm số hòa nền mượt mà, không đóng khung hộp thô kệch.

### F. Chuẩn hóa Danh mục Khảo thí (`/learner/assessments`)
1. **Thẻ bài thi tinh gọn & chuyên nghiệp**:
   - Bỏ đoạn mô tả mờ thừa thãi và các nhãn cộng điểm `+50đ`.
   - Bỏ huy hiệu "Gói Pro" hay "Miễn phí" lòe loẹt. Thay bằng icon **Ổ khóa** `Lock` tinh tế, rê chuột vào sẽ hiển thị Tooltip: *"Yêu cầu tài khoản Pro để mở khóa bài thi này"*. Bài miễn phí mặc định mở, không gắn nhãn rác mắt.
   - Các thông số Thời gian (`15 phút`), Chuẩn đạt (`70%`), Số câu hỏi được hiển thị sắc nét bằng màu `text-slate-800 font-medium`, không làm mờ.
2. **Bộ lọc Đa chọn Miền Năng Lực (Multi-Select Checkbox Dropdown)**:
   - Thay thế hàng nút radio ngang dài gây thanh cuộn ngang bằng một **Ô Menu xổ xuống** nhỏ gọn đặt cạnh ô tìm kiếm.
   - Hỗ trợ **tích chọn đồng thời nhiều miền** (ví dụ: chọn cùng lúc D1 và D3), giữ menu mở khi tích chọn, hiển thị số lượng miền đã chọn `[ 2 ]` trên nút và lọc kết quả tức thì.

### G. Khắc phục Triệt để Lỗi Giật Trang do Thanh Cuộn (Scrollbar Layout Shift)
- Trong `src/app/globals.css`:
  - Khóa cố định rãnh cuộn bằng `html { overflow-y: scroll; scrollbar-gutter: stable; }` giúp chiều rộng nội dung bất biến 100% khi chuyển qua lại giữa trang ngắn và trang dài.
  - Tùy biến thanh cuộn siêu mảnh `6px` (`::-webkit-scrollbar`), bo tròn mềm mại và rãnh trượt trong suốt chuẩn giao diện hiện đại.

---

## 2. TRẠNG THÁI KỸ THUẬT HIỆN TẠI
- **TypeScript**: Biên dịch không lỗi (`npx tsc --noEmit` mã thoát `0`).
- **Dev Server**: Đang chạy ổn định tại `http://localhost:3000`.
- **Tương thích UI**: Tuân thủ tuyệt đối quy tắc bảng màu trung tính, không gradient lòe loẹt, không shadow lớn, không emoji trong JSX.
