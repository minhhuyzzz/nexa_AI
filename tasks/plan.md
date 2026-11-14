# Kế Hoạch Triển Khai: Quản Trị Lộ Trình Phân Cấp SaaS Và Đồng Bộ Trạm Kiểm Chứng Độc Lập

## Bối Cảnh Và Yêu Cầu
Hệ thống Lộ trình học tập của NEXA được chuẩn hóa theo 5 Miền năng lực cốt lõi và các Kỹ năng thành phần chuẩn.
Mỗi Kỹ năng thành phần có đúng 4 cấp độ năng lực độc lập: Cấp 1 (Cơ bản) -> Cấp 2 (Trung cấp) -> Cấp 3 (Nâng cao) -> Cấp 4 (Chuyên sâu).
Mỗi cấp độ là một **Trạm kiểm chứng độc lập** mà Quản trị viên (Admin) có toàn quyền cấu hình:
- Tự quyết định thời lượng làm bài (không ép cứng 15-20 phút, admin có thể đặt 10, 20, 30, 45, 60 phút...).
- Tự quyết định điểm chuẩn vượt qua (không ép cứng, admin có thể đặt 70%, 80%, 100%...).
- Tự quyết định điểm thưởng PTS khi hoàn thành trạm.
- Tự do liên kết đề thi kiểm chứng từ Ngân hàng đề chuẩn (`/admin/content`).
- Mọi thay đổi cấu hình tại Quản trị Lộ trình (`/admin/learning-paths`) phải đồng bộ thông suốt sang trang Cá nhân (`/personal/learning-path`) và Phòng thi toàn màn hình (`/personal/learning-path/assessment/[moduleId]`).

## Nguyên Tắc Thiết Kế Và Giao Diện SaaS
1. **Kiến trúc Phân cấp Trực quan:**
   - Cấp 1: 5 Miền năng lực lớn (Hiển thị dạng Accordion hoặc Danh mục Miền rõ ràng).
   - Cấp 2: Các Kỹ năng thành phần chuẩn trong từng Miền.
   - Cấp 3: 4 Cấp độ kiểm chứng độc lập của từng kỹ năng thành phần.
   - Tránh bảng dữ liệu phẳng khó theo dõi; chuyển sang giao diện SaaS hiện đại, dễ thao tác và kiểm soát toàn diện.
2. **Không gian Làm bài Toàn màn hình Chuyên biệt:**
   - Phòng thi nằm độc lập trong Route Group `(fullscreen)`, loại bỏ hoàn toàn Sidebar và Topbar của Dashboard.
   - Timer đếm ngược đọc chính xác thời lượng do Admin cấu hình.
   - Chuẩn đạt % hiển thị chính xác theo quy chế của trạm.
3. **Chuẩn hóa Thuật ngữ và Thẩm mỹ:**
   - Không sử dụng ký tự `&`, thay toàn bộ bằng từ `và`.
   - Không sử dụng đường kẻ ngang (`---`, `<hr>`).
   - Thống nhất màu sắc Light Mode `#FFFFFF` và Dark Mode `#000000`.

## Lộ Trình Triển Khai (Slices)

### Slice 4 (P0): Tái thiết kế Giao diện Quản trị Lộ trình SaaS tại `/admin/learning-paths`
- Chuyển đổi giao diện bảng phẳng sang mô hình Cây phân cấp 3 tầng (Miền -> Kỹ năng thành phần -> 4 Cấp độ).
- Xây dựng Drawer / Modal Cấu hình Trạm Kiểm chứng độc lập cho từng cấp độ:
  - Chọn đề thi từ Ngân hàng đề chuẩn.
  - Cấu hình Thời lượng (phút).
  - Cấu hình Chuẩn đạt (%).
  - Cấu hình Điểm thưởng (PTS).
  - Cấu hình Chuẩn đầu ra và Trọng tâm bồi dưỡng của cấp độ.
- Tích hợp lưu trữ đồng bộ vào `learning_modules` và liên kết `assessments`.

### Slice 5 (P0): Đồng bộ Dữ liệu Lộ trình và Cấu hình Độc lập sang Personal
- Mở rộng API `/api/personal/learning-path` để trả về đầy đủ các thông số động của từng trạm cấp độ (thời lượng, chuẩn đạt %, PTS, trạng thái hoàn thành).
- Nâng cấp Modal Chi tiết Trạm tại `/personal/learning-path`:
  - 4 tab Cấp độ (Cơ bản, Trung cấp, Nâng cao, Chuyên sâu) phản ánh chính xác thông số thực tế từ cơ sở dữ liệu.
  - Hiển thị rõ trạng thái: Đã hoàn thành (điểm số đã đạt), Sẵn sàng kiểm chứng (nút vào thi), hoặc Đang chuẩn bị đề thi.

### Slice 6 (P0): Thích ứng Phòng thi Toàn màn hình và Chấm điểm theo Cấu hình Động
- Phòng thi `/personal/learning-path/assessment/[moduleId]` thích ứng:
  - Đồng hồ đếm ngược tự động nhận thời lượng từ cấu hình trạm.
  - Thanh tiêu đề hiển thị chuẩn đạt % theo đúng quy chế trạm.
  - Tải câu hỏi từ đề thi đã được Admin gắn kết.
- Cập nhật API nộp bài `/api/personal/learning-path/submit`:
  - So sánh tỷ lệ điểm với `passing_score` động của trạm đó.
  - Lưu kết quả vào `assessment_submissions` và `submission_answers`.
  - Tích lũy năng lực và cộng PTS khi đạt chuẩn.

### Slice 7 (P1): Chuẩn hóa Thuật ngữ, SEO Nội bộ và Kiểm thử Toàn diện
- Rà soát toàn bộ văn bản UI, loại bỏ `&`, thống nhất thuật ngữ chuẩn giáo dục số.
- Chạy kiểm thử tự động Vitest cho toàn bộ luồng Lộ trình và Trạm kiểm chứng.
- Chạy kiểm tra kiểu TypeScript (`npm run typecheck`) và xác nhận bản build Next.js.
