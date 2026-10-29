# Tinh Chỉnh Ý Tưởng: Chuyển Đổi Mô Hình Personal Workspace, Organization Workspace & Platform Admin

> **Tài liệu gốc:** [NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md](file:///c:/nexa/NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md)  
> **Kỹ năng áp dụng:** `idea-refine`  
> **Trạng thái:** Bản tinh chỉnh ý tưởng sản phẩm (One-Pager)  

---

## 1. Problem Statement (Tuyên bố bài toán)

> **Làm thế nào để** tái cấu trúc NEXA AI từ mô hình phân định nhị nguyên cứng nhắc (`LEARNER` vs `EVALUATOR`) sang mô hình **Danh tính Thống nhất (Unified Identity)** với 3 ngữ cảnh không gian làm việc (`PERSONAL`, `ORGANIZATION`, `PLATFORM_ADMIN`), giúp một người dùng cá nhân vừa học vừa tự tạo bài đánh giá/phòng thi trong hạn mức Free hữu dụng, đồng thời cung cấp môi trường B2B quản trị tập trung mạnh mẽ cho trường học/doanh nghiệp mà không phá vỡ tính toàn vẹn dữ liệu, lịch sử khảo thí hay bảo mật RLS?

---

## 2. Recommended Direction (Định hướng kiến trúc & sản phẩm đề xuất)

### A. Mô hình 3 Ngữ Cảnh Tách Bạch nhưng Liên Thông
1. **Personal Workspace (Mặc định cho mọi cá nhân):**
   - Loại bỏ hoàn toàn bước bắt buộc chọn vai trò `LEARNER` hay `EVALUATOR` khi đăng ký tài khoản.
   - Tài khoản cá nhân mặc định sở hữu Personal Workspace với gói `FREE` có giá trị sử dụng thực tế: làm bài khảo thí, xem radar 5 miền, lộ trình học tập, VÀ được quyền tạo đề cá nhân, lập nhóm nhỏ, mở phòng thi Live trong hạn mức cho phép.
   - Khi cần thêm hạn mức và tính năng chuyên sâu (ngân hàng câu hỏi riêng, số phòng Live lớn hơn), nâng cấp lên `PERSONAL PRO`.
2. **Organization Workspace (Không gian tổ chức B2B):**
   - Dành cho trường học, học viện, doanh nghiệp với nhu cầu quản lý đa thành viên, lớp học/phòng ban, ngân hàng đề dùng chung, kỳ thi tập trung, chấm bài phân công, báo cáo tổng hợp và ngân sách/quota AI cấp tổ chức.
   - Phân quyền theo vai trò trong tổ chức: `ORG_OWNER`, `ORG_ADMIN`, `ASSESSOR`, `REPORT_VIEWER`, `MEMBER`.
   - Một tài khoản cá nhân có thể là thành viên của nhiều tổ chức và chuyển đổi ngữ cảnh qua **Workspace Switcher** mà không cần đăng xuất hay tạo tài khoản khác.
3. **Platform Admin Control Plane (Vùng đặc quyền vận hành nền tảng):**
   - Tách biệt độc lập, chỉ dành cho superadmin được xác thực qua email hệ thống và quy trình bảo mật nghiêm ngặt.
   - Quản trị tài khoản, tổ chức, phiên bản khung năng lực DigComp, ngân hàng đề chuẩn hệ thống, AI Gateway provider/cost và đối soát giao dịch.

### B. Công Thức Thẩm Quyền Bất Biến (Server-Enforced Authorization Formula)
```
Quyền Thực Thi = Danh tính đã xác thực (auth.uid)
                + Ngữ cảnh Workspace hiện hành (PERSONAL | ORGANIZATION | PLATFORM_ADMIN)
                + Quan hệ Sở hữu / Membership (owner_user_id | user_organizations.org_role)
                + Quyền trên Tài nguyên cụ thể (can_edit, can_grade, can_view)
                + Hạn mức Gói dịch vụ & Quota (Entitlement & Quota Ledger)
                + Trạng thái Nghiệp vụ (Active, Draft, Published, Locked)
```
*Không bao giờ dựa vào vai trò khai báo từ client, cookie demo production, hay ẩn nút trên UI để làm hàng rào bảo mật.*

---

## 3. Key Assumptions to Validate (Các giả định cốt lõi cần kiểm chứng)

- [ ] **Giả định 1 (Tương thích ngược dữ liệu):** Dữ liệu người dùng cũ (bài làm, điểm ledger, snapshot radar, chứng chỉ đã cấp) có thể được ánh xạ tự động sang `PERSONAL` workspace của chính họ mà không làm mất liên kết hay biến động điểm số.
  - *Cách kiểm chứng:* Viết migration có migration check script, so sánh số lượng bản ghi và quan hệ trước/sau khi chạy trên dữ liệu kiểm thử.
- [ ] **Giả định 2 (Tính hữu dụng của Free Tier):** Người dùng Free khi được phép tạo đề (giới hạn ví dụ 3 đề) và tạo nhóm nhỏ (giới hạn 1 nhóm/15 người) sẽ gia tăng tính gắn kết mà không gây quá tải chi phí hạ tầng hay AI.
  - *Cách kiểm chứng:* Thiết lập bộ cấu hình hạn mức tập trung qua service, cưỡng chế tại API và đo lường tần suất gọi.
- [ ] **Giả định 3 (Workspace Context Switching):** Việc chuyển đổi ngữ cảnh giữa Personal và Organization bằng `WorkspaceSwitcher` diễn ra tức thời qua state/cookie ngữ cảnh mà không gây xung đột dữ liệu chéo tổ chức.
  - *Cách kiểm chứng:* Test quyền âm: User ở Org A không thể truy vấn tài nguyên của Org B dù đổi tham số trên URL.

---

## 4. MVP Scope (Phạm vi Lát cắt dọc Khả thi)

### In-Scope (Làm ngay trong đợt chuyển đổi này):
1. **Lớp Dữ liệu & Quyền (Foundation Data & Security):**
   - Migration bổ sung trường sở hữu (`owner_user_id`, `organization_id`, `visibility`) cho các bảng tài nguyên (`assessments`, `classes`, `live_rooms`).
   - Cập nhật enum vai trò tổ chức trong `user_organizations` (`ORG_OWNER`, `ORG_ADMIN`, `ASSESSOR`, `REPORT_VIEWER`, `MEMBER`).
   - Xây dựng `QuotaEnforcementService` tập trung kiểm soát hạn mức Free/Pro/Business ở tầng server.
2. **Luồng Xác thực & Định danh Thống nhất:**
   - Loại bỏ chọn vai trò tại `/register` — 100% người dùng đăng ký tài khoản cá nhân thông thường.
   - Nâng cấp `getEffectiveUser` và Middleware: Hỗ trợ chuyển hướng thông minh, backward-compatible redirect từ `/learner/*` và `/evaluator/*` sang workspace đích.
3. **Personal Workspace Thống Nhất:**
   - Gộp shell điều hướng cá nhân: Làm bài, Radar năng lực, Lộ trình học, Chứng chỉ + Tạo đề cá nhân, Nhóm cá nhân, Phòng thi Live (theo quota Free/Pro).
4. **Organization Workspace Đa Thành Viên:**
   - Hoàn thiện luồng mời thành viên, phân quyền vai trò trong tổ chức, quản lý lớp/nhóm và ngân sách AI tổ chức.
   - Bộ chuyển đổi `WorkspaceSwitcher` tại Topbar.

### Out-of-Scope (Tạm hoãn, làm ở pha sau):
- Hệ thống thanh toán hóa đơn VAT tự động cho doanh nghiệp (dùng xác nhận manual / transfer trước).
- Tích hợp đăng nhập SSO qua SAML/Active Directory cho trường đại học lớn (dùng Email OTP/Password + Google OAuth trước).
- Tính năng chuyển nhượng vĩnh viễn quyền sở hữu tài nguyên từ cá nhân sang tổ chức (sẽ mở API sau khi chốt pháp lý bản quyền nội dung).

---

## 5. Not Doing & Why (Những việc dứt khoát KHÔNG LÀM)

| Việc không làm | Lý do (Trade-off & Rủi ro) |
|---|---|
| **Không đổi tên URL hàng loạt không tương thích** | Gây chết link bookmark của người dùng cũ, lỗi routing production. Bắt buộc duy trì route alias / redirect 307. |
| **Không xóa cột `profiles.role` ngay lập tức** | Các câu truy vấn cũ, trigger hoặc foreign key có thể bị đứt gãy. Cần chiến lược deprecation 2 bước (Expand and Contract). |
| **Không gộp điểm thi, điểm năng lực và điểm tích lũy** | Vi phạm nguyên tắc khảo thí học thuật. Điểm thi của đề tự tạo không được tự ý cộng vào điểm tích lũy toàn hệ thống. |
| **Không cấp quyền Admin qua việc mua gói Pro/Business** | Quyền Platform Admin là quyền nội bộ tối cao, không phải sản phẩm thương mại để bán. |
| **Không dùng cookie demo làm cơ sở phân quyền production** | Tiềm ẩn nguy cơ leo thang đặc quyền nghiêm trọng. Quyền luôn xác minh qua session database. |

---

## 6. Open Questions (Các câu hỏi nghiệp vụ cần chốt cấu hình)

1. **Hạn mức cụ thể cho gói Free cá nhân:**
   - *Đề xuất chuẩn hóa:* Tối đa 3 đề thi cá nhân hoạt động, 1 nhóm học tập (tối đa 15 thành viên), 1 phòng thi Live đồng thời (tối đa 15 người tham gia), 3 lượt AI phân tích/tháng.
2. **Chính sách dữ liệu khi thành viên rời tổ chức:**
   - Bài nộp và điểm thi của thành viên đó trong các kỳ thi do tổ chức mở vẫn thuộc quyền sở hữu báo cáo của tổ chức; tài khoản cá nhân của người học vẫn giữ lịch sử cá nhân.
