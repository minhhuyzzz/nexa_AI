# Danh Sách Nhiệm Vụ Triển Khai: Quản Trị Lộ Trình Phân Cấp SaaS Và Trạm Kiểm Chứng Độc Lập

## Slice 4 (P0): Tái thiết kế Giao diện Quản trị Lộ trình SaaS tại `/admin/learning-paths`
- [x] **Task 4.1: Xây dựng Giao diện Cây phân cấp Lộ trình 3 tầng (Miền -> Kỹ năng -> 4 Cấp độ)**
  - **Mục tiêu:** Thay thế bảng danh sách phẳng bằng giao diện phân cấp SaaS hiện đại: 5 Miền năng lực dạng Thẻ/Accordion; khi mở Miền sẽ thấy các Kỹ năng thành phần chuẩn; mỗi kỹ năng mở ra 4 Cấp độ độc lập (Cơ bản, Trung cấp, Nâng cao, Chuyên sâu).
  - **Tiêu chí nghiệm thu:**
    - [x] Giao diện nhóm rõ ràng theo 5 Miền năng lực cốt lõi.
    - [x] Mỗi kỹ năng thành phần hiển thị 4 huy hiệu cấp độ với trạng thái cấu hình (đã gắn đề / chưa gắn đề, thời lượng, chuẩn đạt).
    - [x] Bấm vào bất kỳ cấp độ nào đều mở giao diện cấu hình chi tiết trạm đó.
    - [x] Giao diện tuân thủ chuẩn Light Mode (`#FFFFFF`) và Dark Mode (`#000000`), không dùng `&`, không dùng đường kẻ ngang.
  - **Kiểm tra:**
    - [x] `npm run typecheck` thành công.
    - [x] Giao diện hiển thị trực quan cấu trúc 3 tầng, không có lỗi console.
  - **Phụ thuộc:** Không có
  - **Tệp liên quan:** `src/app/(dashboard)/admin/learning-paths/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

- [x] **Task 4.2: Xây dựng Drawer / Modal Cấu hình Trạm Kiểm chứng Độc lập**
  - **Mục tiêu:** Cung cấp bộ công cụ cấu hình linh hoạt cho từng cấp độ: Chọn đề từ Ngân hàng đề chuẩn, nhập Thời lượng (phút) tùy ý, nhập Chuẩn đạt (%) tùy ý, nhập Điểm thưởng PTS tùy ý, và mô tả Chuẩn đầu ra năng lực.
  - **Tiêu chí nghiệm thu:**
    - [x] Cho phép chọn đề thi kiểm chứng từ danh sách `assessments`.
    - [x] Trường Thời lượng làm bài cho phép Admin nhập số phút tùy ý (không giới hạn 15 hay 20 phút).
    - [x] Trường Chuẩn vượt qua cho phép Admin nhập số % tùy ý (70%, 80%, 100%...).
    - [x] Trường Điểm thưởng PTS cho phép nhập số điểm tùy ý.
    - [x] Lưu thành công vào `learning_modules` và cập nhật thông số tương ứng trong `assessments`.
  - **Kiểm tra:**
    - [x] Mở modal cấp độ, đổi thời lượng thành 30 phút, chuẩn đạt 100%, PTS 50 -> bấm Lưu thành công và dữ liệu được cập nhật vào CSDL.
  - **Phụ thuộc:** Task 4.1
  - **Tệp liên quan:** `src/app/(dashboard)/admin/learning-paths/page.tsx`, `src/app/api/admin/learning-modules/route.ts`, `src/app/api/admin/learning-modules/[id]/route.ts`
  - **Quy mô:** Vừa (2-3 tệp)

## Checkpoint 1: Quản Trị Lộ Trình Phân Cấp SaaS Hoàn Tất
- [x] Giao diện Quản trị Lộ trình hiển thị đúng mô hình 3 tầng phân cấp rõ ràng.
- [x] Admin tự do cấu hình thời lượng, chuẩn đạt, điểm thưởng cho từng trạm cấp độ mà không bị ép buộc giá trị cứng.
- [x] `npm run typecheck` đạt 0 lỗi.

## Slice 5 (P0): Đồng bộ Dữ liệu Lộ trình và Cấu hình Độc lập sang Personal
- [x] **Task 5.1: Nâng cấp API `/api/personal/learning-path` để truyền nhận thông số động của từng cấp độ**
  - **Mục tiêu:** Đảm bảo API trả về đầy đủ các thông số động của 4 cấp độ thuộc từng kỹ năng (thời lượng phút do admin đặt, chuẩn đạt % do admin đặt, điểm thưởng PTS, trạng thái hoàn thành).
  - **Tiêu chí nghiệm thu:**
    - [x] Trả về danh mục kỹ năng và thông tin trạm kiểm chứng kèm theo `duration_minutes`, `passing_score`, `point_reward`.
    - [x] Ghi nhận chính xác cấp độ nào người dùng đã hoàn thành và cấp độ kế tiếp cần chinh phục.
  - **Kiểm tra:**
    - [x] Gọi GET `/api/personal/learning-path` trả về 200 với đầy đủ cấu hình thời lượng và chuẩn đạt của các trạm.
  - **Phụ thuộc:** Checkpoint 1
  - **Tệp liên quan:** `src/app/api/personal/learning-path/route.ts`
  - **Quy mô:** Nhỏ (1 tệp)

- [x] **Task 5.2: Nâng cấp Modal Chi tiết Trạm tại `/personal/learning-path`**
  - **Mục tiêu:** Cập nhật giao diện xem chi tiết trạm của người học: hiển thị 4 tab cấp độ, mỗi tab phản ánh đúng thời lượng và chuẩn đạt do Admin cấu hình; nút hành động hiển thị chuẩn xác trạng thái trạm.
  - **Tiêu chí nghiệm thu:**
    - [x] Tab cấp độ hiển thị đúng thời lượng thực tế (ví dụ: "Thời lượng: 30 phút") và chuẩn vượt trạm (ví dụ: "Chuẩn đạt: 100%").
    - [x] Nút "Vào kiểm chứng vượt trạm" dẫn thẳng đến phòng thi toàn màn hình khi trạm đã có đề thi.
    - [x] Khi chưa có đề thi, hiển thị trạng thái "Đang chuẩn bị đề khảo thí".
    - [x] Khi đã vượt qua trạm, hiển thị huy hiệu "Đã vượt trạm" kèm điểm số đạt được.
  - **Kiểm tra:**
    - [x] Click vào kỹ năng bất kỳ, kiểm tra 4 tab cấp độ hiển thị thông số động đồng bộ với cấu hình bên Admin.
  - **Phụ thuộc:** Task 5.1
  - **Tệp liên quan:** `src/app/(dashboard)/personal/learning-path/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

## Checkpoint 2: Đồng Bộ Dữ Liệu Lộ Trình Hoàn Tất
- [x] Mọi thay đổi cấu hình bên Admin lập tức phản ánh chính xác trên Modal chi tiết trạm bên Personal.
- [x] Không có hiện tượng lệch thông số thời lượng hoặc chuẩn đạt giữa Admin và Personal.

## Slice 6 (P0): Thích ứng Phòng thi Toàn màn hình và Chấm điểm Động
- [x] **Task 6.1: Tự động điều chỉnh Thời lượng và Chuẩn đạt trong Phòng thi Toàn màn hình**
  - **Mục tiêu:** Cập nhật trang `/personal/learning-path/assessment/[moduleId]` để đồng hồ đếm ngược chạy theo đúng `duration_minutes` của trạm, thanh tiêu đề hiển thị đúng `passing_score` của trạm.
  - **Tiêu chí nghiệm thu:**
    - [x] Timer đếm ngược khởi tạo chính xác theo thời lượng cấu hình của trạm (không còn mặc định 90 phút).
    - [x] Hiển thị nhãn chuẩn đạt đúng số % quy định của trạm (ví dụ: "Chuẩn đạt: 100%" hoặc "Chuẩn đạt: 80%").
    - [x] Tải câu hỏi thật từ đề thi gắn kèm; nếu đề chưa có câu hỏi thì thông báo thân thiện và cho phép quay về an toàn.
  - **Kiểm tra:**
    - [x] Vào làm bài kiểm chứng của trạm có thời lượng 20 phút -> đồng hồ hiển thị 20:00 và đếm ngược chính xác.
  - **Phụ thuộc:** Checkpoint 2
  - **Tệp liên quan:** `src/app/(fullscreen)/personal/learning-path/assessment/[moduleId]/page.tsx`, `src/app/api/personal/learning-path/assessment/[moduleId]/route.ts`
  - **Quy mô:** Vừa (1-2 tệp)

- [x] **Task 6.2: Đối chiếu Chuẩn đạt Động và Chấm điểm tại `/api/personal/learning-path/submit`**
  - **Mục tiêu:** API nộp bài so sánh tỷ lệ đạt điểm của thí sinh với chuẩn đạt động của trạm, ghi nhận hoàn thành trạm, cộng điểm thưởng PTS và cập nhật điểm năng lực lũy tiến.
  - **Tiêu chí nghiệm thu:**
    - [x] Thí sinh đạt tỷ lệ điểm $\ge$ chuẩn đạt của trạm sẽ được đánh dấu `is_passed: true`, mở khóa trạm tiếp theo, nhận PTS và tăng điểm năng lực miền.
    - [x] Thí sinh chưa đạt tỷ lệ điểm sẽ kích hoạt thời gian chờ làm lại (cooldown) và hiển thị bảng phân tích giải thích chi tiết.
  - **Kiểm tra:**
    - [x] Test unit `learning-path-verification.test.ts` kiểm thử đầy đủ các kịch bản chấm điểm với chuẩn đạt động.
  - **Phụ thuộc:** Task 6.1
  - **Tệp liên quan:** `src/app/api/personal/learning-path/submit/route.ts`, `src/features/learning-paths/services/learning-path-verification.test.ts`
  - **Quy mô:** Vừa (2 tệp)

## Slice 7 (P1): Chuẩn hóa Thẩm mỹ SaaS, Rà soát Thuật ngữ và Kiểm thử Hệ thống
- [x] **Task 7.1: Chuẩn hóa Terminology, loại bỏ ký tự `&`, rà soát Light / Dark Mode**
  - **Mục tiêu:** Rà soát toàn bộ văn bản giao diện trên cả Admin và Personal: loại bỏ ký tự `&`, thay bằng từ `và`; loại bỏ các từ ngữ gây bối rối; bảo đảm độ tương phản màu chuẩn WCAG AA cho cả Light Mode (`#FFFFFF`) và Dark Mode (`#000000`).
  - **Tiêu chí nghiệm thu:**
    - [x] Toàn bộ tiêu đề, nhãn menu, mô tả trạm không còn chứa ký tự `&`.
    - [x] Không có đường viền ngang phân cách (`---`, `<hr>`).
    - [x] Giao diện sắc nét, tin cậy, chuẩn SaaS giáo dục hiện đại.
  - **Kiểm tra:**
    - [x] Tìm kiếm ký tự `&` trong các tệp lộ trình -> 0 kết quả trên UI.
  - **Phụ thuộc:** Checkpoint 2
  - **Tệp liên quan:** Các tệp UI liên quan
  - **Quy mô:** Nhỏ (2 tệp)

- [x] **Task 7.2: Kiểm thử Toàn diện (End-to-End Verification)**
  - **Mục tiêu:** Chạy toàn bộ bộ kiểm thử tự động, kiểm tra kiểu dữ liệu TypeScript và kiểm tra bản build sản phẩm.
  - **Tiêu chí nghiệm thu:**
    - [x] `npm run typecheck` đạt 0 lỗi.
    - [x] `npx vitest run` vượt qua 100% các bài kiểm thử liên quan.
    - [x] `npx next build` thành công.
  - **Kiểm tra:**
    - [x] Các lệnh kiểm tra chạy hoàn tất và trả về mã thành công 0.
  - **Phụ thuộc:** Tất cả các task trên
  - **Quy mô:** Nhỏ (Kiểm thử)
