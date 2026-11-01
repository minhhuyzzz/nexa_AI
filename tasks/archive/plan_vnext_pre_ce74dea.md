# Kế Hoạch Triển Khai Kỹ Thuật (Implementation Plan): NEXA vNext

> **Căn cứ đặc tả:** [`docs/NEXA_SPEC_3_DASHBOARD_VNEXT.md`](file:///c:/nexa/docs/NEXA_SPEC_3_DASHBOARD_VNEXT.md)  
> **Căn cứ tài liệu phân tích:** [`NEXA_AI_DEEP_REVIEW_3_DASHBOARD_GIAI_THICH_SO_DO_2026-10-31_VI.md`](file:///c:/Users/CPS/Downloads/NEXA_AI_DEEP_REVIEW_3_DASHBOARD_GIAI_THICH_SO_DO_2026-10-31_VI.md)  
> **Quy chuẩn lập trình & giao diện:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md)  
> **Phương pháp:** Vertical Slicing, Spec-Driven Development, Test-Driven Development, Phân công nhiệm vụ theo Skills & Agents chuyên trách.

---

## 1. Tổng Quan Kiến Trúc & Quyết Định Then Chốt (ADRs)

### ADR-01: One Identity — Multi-Workspace Switcher Trong Menu Avatar
- **Quyết định:** Chuyển toàn bộ danh sách chọn không gian làm việc (Personal, Org A, Org B, Platform Admin) vào dropdown Avatar của người dùng. Loại bỏ dropdown chọn workspace trên topbar để tinh gọn diện tích.
- **Lý do:** Người dùng chỉ có 1 tài khoản đăng nhập duy nhất. Đổi workspace là đổi ngữ cảnh (Context), không đổi tài khoản.

### ADR-02: Chốt 3 Gói Thương Mại & Cấp Org Business Fail-closed
- **Quyết định:** Nền tảng chỉ có 3 gói: `Free` (Cá nhân tự do), `Pro` (Cá nhân nâng cao), `Business` (Tổ chức theo hợp đồng). Cấp Org Business bắt buộc qua quy trình tư vấn và phê duyệt hợp đồng bởi Platform Admin. Hỗ trợ kích hoạt qua email token cho cả người chưa có tài khoản.
- **Lý do:** Chống việc người dùng tự mua gói cá nhân để kích hoạt Org giả, chống thất thoát doanh thu B2B.

### ADR-03: Tách Biệt 4 Lớp Khảo Thí & Trang Detail Bộ Đề 5 Tab
- **Quyết định:**
  - *Question Bank Item:* Câu hỏi độc lập có taxonomy tag 21 kỹ năng, ảnh minh họa, rubric 3 tầng.
  - *Assessment Content:* Bộ đề chỉ chứa câu hỏi, rubric, điểm tối đa, và thời lượng làm bài ước tính. Bãi bỏ ngày giờ mở/đóng đợt thi trong editor. Tạo trang Detail 5 tab (`Tổng quan`, `Nội dung`, `5 miền & Rubric`, `Lịch sử phiên bản`, `Lần triển khai`).
  - *Campaign / Live Room:* Nơi thiết lập lịch mở/đóng, đối tượng lớp thi, mã PIN/QR, thời lượng mỗi lượt thi và giám sát gian lận.
- **Lý do:** Tái sử dụng câu hỏi tối đa; khóa bất biến phiên bản đề đã có bài thi; phân định rạch ròi giữa nội dung và khâu tổ chức thi.

### ADR-04: Phân Định Hồ Sơ Năng Lực (Profile) vs Lộ Trình Học (Learning Path)
- **Quyết định:** Hồ sơ năng lực gộp vào phần Hồ sơ cá nhân (Avatar -> Profile) thể hiện điểm 5 miền có bằng chứng (`score: null` nếu chưa có dữ liệu, không vẽ 0% giả). Lộ trình phát triển (`/personal/learning-path`) là kế hoạch hành động với mục tiêu, checklist học liệu đã duyệt, cột mốc đánh giá lại và AI cố vấn on-demand.
- **Lý do:** Tránh lặp lại 2 trang cùng vẽ 1 cái biểu đồ Radar vô nghĩa; tập trung vào hành động cải thiện năng lực thực chất.

### ADR-05: Nâng Cấp Org BI Dashboard & Module Hợp Đồng Hạn Mức
- **Quyết định:** Báo cáo năng lực Org chuyển thành BI Dashboard (heatmap lớp x miền, phân phối điểm, so sánh cohort). Thay thế module AI-Quota thành "Hợp đồng & Hạn mức (Contract & Usage)" minh bạch số ghế, số đợt thi, AI credits và nhật ký sử dụng.

### ADR-06: Platform Admin Control Plane — Hàng Đợi Công Việc & Đối Soát Tài Chính
- **Quyết định:** Tổng quan Admin ưu tiên hàng đầu các Action Queues (Business Inquiries, thanh toán ngoại lệ, đề chờ duyệt, sự cố AI). Tách riêng module BI. Bổ sung chức năng tạm khóa tài khoản (Suspend User) và buộc đăng xuất. Bàn thẩm định nội dung 2 cột. Trung tâm truyền thông in-app broadcast.

### ADR-07: Anti-AI-Slop UX — Hạn Chế Modal & Ảnh Bìa Vuông 1:1
- **Quyết định:** Cấm dùng modal cho các tác vụ lớn (>3 trường). Soạn đề, tạo chiến dịch, chấm bài, đối soát dùng Full-page, Drawer hoặc Split-view. Thẻ bài thi chuẩn hóa ảnh bìa vuông 1:1 (`aspect-square`).

---

## 2. Bảng Phân Công Nhiệm Vụ, Kỹ Năng & Agent Chuyên Trách

| Giai đoạn | Trọng tâm phân hệ | Kỹ năng chỉ định (Skills) | Subagent / Vai trò chuyên trách |
|:---|:---|:---|:---|
| **Phase 1** | Identity, Avatar Workspace & Business Provisioning | `api-and-interface-design`<br>`security-and-hardening` | `security-auditor`<br>(Kiểm tra Tenant Isolation & Token Auth) |
| **Phase 2** | Question Bank Reusable & Studio 5-Tab Detail | `impeccable`<br>`frontend-ui-engineering` | `code-reviewer`<br>(Kiểm tra Rubric & Version Immutability) |
| **Phase 3** | Delivery: Campaign Wizard & Live Room 5 Phân Hệ | `frontend-ui-engineering`<br>`api-and-interface-design` | `test-engineer`<br>(Kiểm tra Attempt Time Limits & Realtime Room) |
| **Phase 4** | Profile 5 Miền, Lộ Trình Hành Động & Nhóm Cá Nhân | `impeccable`<br>`frontend-ui-engineering` | `web-performance-auditor`<br>(Tối ưu render & Chart Performance) |
| **Phase 5** | Org Business: RBAC 5 Roles, BI & Contract Usage | `security-and-hardening`<br>`frontend-ui-engineering` | `security-auditor`<br>(Kiểm tra RLS & Member Data Protection) |
| **Phase 6** | Platform Control Plane: Queues, BI, Khóa User & Moderation | `api-and-interface-design`<br>`security-and-hardening` | `code-reviewer`<br>(Kiểm tra Privilege Escalation & Audit Log) |
| **Phase 7** | Master Verification & Knowledge Graph Sync | `test-driven-development`<br>`graphify` | `test-engineer`<br>(Chạy toàn bộ 30+ test suites & build 86+ routes) |

---

## 3. Lộ Trình 7 Giai Đoạn Triển Khai (Phased Roadmap)

```
GIAI ĐOẠN 1: Identity, Avatar Workspace Switcher & 3-Plan Business Onboarding
     │
     ▼
GIAI ĐOẠN 2: Ngân Hàng Câu Hỏi Tái Sử Dụng & Assessment Studio 5-Tab Detail
     │
     ▼
GIAI ĐOẠN 3: Triển Khai Thi — Campaign Wizard & Phòng Thi Trực Tiếp 5 Phân Hệ
     │
     ▼
GIAI ĐOẠN 4: Hồ Sơ Năng Lực Trong Profile, Lộ Trình Hành Động & Lớp Nhóm Cá Nhân
     │
     ▼
GIAI ĐOẠN 5: Tổ Chức Business — RBAC 5 Vai Trò, Báo Cáo BI & Quản Trị Hợp Đồng
     │
     ▼
GIAI ĐOẠN 6: Platform Admin Control Plane & Trung Tâm Vận Hành
     │
     ▼
GIAI ĐOẠN 7: Master Verification Suite & Knowledge Graph Sync
```

---

## 4. Quản Trị Rủi Ro & Biện Pháp Kiểm Soát (Risks & Mitigations)

| Rủi ro kỹ thuật | Mức độ | Biện pháp kiểm soát & Giải pháp kỹ thuật |
|:---|:---:|:---|
| Rò rỉ dữ liệu chéo giữa các Org khi chuyển workspace trong Avatar | **Cao (P0)** | Mọi truy vấn DB phải ép buộc điều kiện `organization_id`. Xóa bỏ local cache/state cũ khi đổi workspace scope. |
| Người dùng sửa nội dung đề thi đã có học viên nộp bài | **Cao (P0)** | Khóa bất biến phiên bản (Immutable Versioning): Đề đã có submission thì `is_locked = true`, bắt buộc nhân bản thành version mới khi sửa. |
| Quá tải số lượng modal làm gián đoạn trải nghiệm người dùng | **Trung bình (P1)** | Quy định cứng: Chỉ dùng modal cho xác nhận ngắn (<3 trường). Toàn bộ tác vụ nghiệp vụ chuyển sang Full-page hoặc Side Drawer. |
| Bị lỗi phân quyền khi khách hàng chưa có tài khoản nhận lời mời Org | **Cao (P0)** | Sinh token kích hoạt có ký danh tính (HMAC/UUID) gắn cứng với email hợp đồng, kiểm tra hiệu lực trước khi tạo `ORG_OWNER`. |
| Biểu đồ BI vẽ 0% gây hiểu nhầm người dùng yếu năng lực | **Trung bình (P1)** | Chuẩn hóa `score: null` hiển thị nhãn "Chưa có dữ liệu đánh giá", không vẽ 0% giả. |
