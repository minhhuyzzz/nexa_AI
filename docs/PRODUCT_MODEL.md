# NEXA AI — Mô Hình Sản Phẩm & Kiến Trúc Nghiệp Vụ Chuẩn Hóa (Product Model v3.0)

> **Cập nhật ngày:** 03/11/2026  
> **Áp dụng cho:** Toàn bộ hệ thống NEXA AI (Personal, Organization Business, Platform Admin)

---

## 1. Ba Không Gian, Một Danh Tính (Three Workspaces, One Identity)

NEXA AI sử dụng cơ chế đăng nhập một tài khoản (Single Identity) và chuyển đổi ngữ cảnh làm việc linh hoạt giữa ba không gian:

1. **Personal (`/personal/*`):**
   - Không gian hoạt động cá nhân của người học/chuyên gia.
   - Làm bài đánh giá chuẩn 5 miền năng lực số (D1–D5), theo dõi Radar năng lực, nhận chứng chỉ số có mã QR tra cứu.
   - Tự tạo đề thi, nhóm học và phòng thi trong hạn mức gói cá nhân.
   - Nhận nhiệm vụ, bài tập và đợt khảo thí được giao từ tổ chức (thông qua widget "Từ tổ chức của bạn").

2. **Organization Business (`/org/[slug]/*`):**
   - Không gian quản trị và vận hành dành cho Trường học / Doanh nghiệp.
   - **Chỉ Quản trị viên tổ chức (`ORG_OWNER`, `ORG_ADMIN`)** được mở Organization Console.
   - Quản lý danh sách thành viên, cấu trúc lớp học (`classes`), đợt khảo thí (`campaigns`), và hàng đợi chấm bài (`grading`).
   - Theo dõi gói dịch vụ Business (`/org/[slug]/plan`), hạn sử dụng, số ghế đã dùng, AI credits và gửi yêu cầu **Gia hạn gói**.

3. **Platform Admin (`/admin/*`):**
   - Không gian điều hành nền tảng dành riêng cho đội ngũ NEXA AI.
   - Tiếp nhận và phê duyệt yêu cầu Business (`business_inquiries`) qua 3 trạng thái chuẩn: `NEW` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `ACTIVATED`.
   - Cấp gói SaaS, cấu hình chu kỳ (1/3/12 tháng), số ghế, quota đề và AI credits.
   - Duyệt yêu cầu gia hạn gói B2B (`renewal_requests`), giám sát AI Gateway, đối soát thanh toán và audit log hệ thống.

---

## 2. Mô Hình Quyền Lợi & Gia Hạn Gói Business (SaaS Entitlements)

### 2.1. Bỏ thủ tục hợp đồng giấy bắt buộc
- Đăng ký Business là yêu cầu dịch vụ trực tuyến tinh gọn.
- Kích hoạt tổ chức tạo ngay bản ghi `organizations` và `organization_entitlements` có hiệu lực.
- Trường `contractNumber` chỉ là mã tham chiếu tùy chọn (`optional reference`), không bắt buộc phải có hợp đồng giấy để vận hành hệ thống.

### 2.2. Vòng đời gia hạn gói (Renewal Lifecycle)
- Tổ chức chủ động gửi yêu cầu gia hạn tại `/org/[slug]/plan` (chọn kỳ hạn 1, 3, 12 tháng và số ghế mong muốn).
- Bản ghi `renewal_requests` được lưu ở trạng thái `PENDING` (chống gửi trùng lặp).
- Platform Admin phê duyệt gia hạn:
  $$\text{new\_expires\_at} = \max(\text{now}, \text{current\_expires\_at}) + \text{periodMonths}$$
- Bảo toàn tuyệt đối số ngày sử dụng còn lại của khách hàng khi gia hạn sớm.

---

## 3. Quản Trị AI Credits & Tính Toàn Vẹn Khảo Thí

1. **Bảo mật RPC (Fail-Closed):**
   - Hàm RPC `deduct_organization_ai_credits` và `refund_organization_ai_credits` chỉ cấp quyền thực thi cho `service_role`.
   - Chặn tuyệt đối số âm (`p_amount <= 0`) và áp dụng `SET search_path = public, pg_temp;`.
   - Nghiêm cấm fallback cập nhật số dư bằng read-modify-write từ phía client.

2. **Toàn vẹn kết quả chấm AI:**
   - Trừ credits theo cơ chế giữ trước (Reservation).
   - Chỉ quyết toán (`SETTLE`) sau khi bản ghi `ai_evaluations` được lưu trữ thành công vào database.
   - Nếu lưu thất bại, hệ thống tự động hoàn trả credits (`RELEASE`) và trả về HTTP 500 (Fail-Closed).
   - Điểm số AI chỉ lưu ở trạng thái `DRAFT`, người có thẩm quyền phê duyệt mới chuyển thành điểm chính thức.

3. **Tính chân thực dữ liệu Personal Dashboard:**
   - Chỉ hiển thị CTA khảo thí đầu vào khi có bài thi thật đã phát hành (`PUBLISHED`), không dùng fallback ID giả.
   - Hero banner tự động chuyển đổi giữa "Khảo thí đầu vào" và "Tiếp tục học tập" dựa theo lịch sử làm bài thật.
   - Thanh Stepper 5 miền năng lực phản ánh chính xác điểm số từ `radarData`, tự động làm nổi bật miền cần ưu tiên cải thiện.
   - Bảng xếp hạng hỗ trợ lọc theo kỳ thời gian (`week`, `month`, `all`).
