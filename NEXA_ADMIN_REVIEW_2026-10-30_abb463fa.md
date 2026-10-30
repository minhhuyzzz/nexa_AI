# NEXA AI — Review sau triển khai & Kế hoạch cải thiện Platform Admin

> **Loại tài liệu:** Báo cáo review kỹ thuật, nghiệp vụ và UI/UX; có thể giao trực tiếp cho coding agent.
>
> **Ngày review:** 30/10/2026 (Asia/Ho_Chi_Minh)  
> **Repository:** https://github.com/minhhuyzzz/nexa_AI  
> **Branch:** `main`  
> **Snapshot commit (full SHA):** `abb463faf8ffd9e4964126e2a08abb96654a733a`  
> **Commit:** `fix(org): organize sidebar by functional groups, guard inactive orgs, and add action-driven overview`  
> **CI tại snapshot:** Success — https://github.com/minhhuyzzz/nexa_AI/actions/runs/41030723969  
> **Căn cứ:** Source GitHub ở commit trên và 12 ảnh màn hình Admin người dùng cung cấp.  
> **Phạm vi:** Kiểm tra lại các Phase đã triển khai, review Platform Admin, ưu tiên bảo mật, Business B2B, quản lý người dùng, thanh toán, AI, khảo thí, dữ liệu và UX.  
> **Giới hạn:** Chưa chạy E2E trên `localhost`, chưa xác minh migrations đã thực thi trên Supabase, chưa kiểm tra giao dịch thật; kết quả CI không thay thế kiểm thử runtime.  
> **Trạng thái tác vụ:** Chỉ review; không sửa repo, không push hoặc tạo PR.

---

## I. Tóm tắt điều hành

Sau khi đối chiếu các thay đổi mới nhất với commit `d7934984a4210fc6dde54a47888e7b920b88fa76`, NEXA đã bổ sung hạ tầng Business, join code, import thành viên, đợt đánh giá, entitlement/quota và một số lớp bảo mật. Đây là tiến bộ thực chất. Tuy nhiên, **NEXA chưa nên coi Phase 0–4 là đã nghiệm thu xong** vì trong source hiện tại vẫn còn đường truy cập dữ liệu tổ chức cần vá và nhiều chức năng Platform Admin chưa khép kín nghiệp vụ.

**Định hướng chính:** Platform Admin không chỉ là nơi đếm tổng số user/đề thi. Đây phải là **trung tâm điều hành** của người sở hữu NEXA, giúp trả lời ngay: hồ sơ Business nào đang chờ, giao dịch nào cần đối soát, ai cần được cấp/thu hồi quyền, nội dung nào chưa duyệt, AI đang vận hành ra sao, có sự cố bảo mật hay không.

**Các quyết định sản phẩm phải giữ nguyên:**

1. **Personal** là không gian cá nhân mặc định; một tài khoản có thể học, tạo đề và tham gia nhiều tổ chức theo quyền khác nhau.
2. **Organization** là sản phẩm **Business theo hợp đồng**: yêu cầu liên hệ → tư vấn/báo giá → Platform Admin phê duyệt → cấp entitlement → kích hoạt. Không tự mua như gói Personal; Org Admin không phải Platform Admin.
3. **Báo cáo đánh giá năng lực chỉ có 5 miền DigComp**, không chấm công khai thành 21 kỹ năng thành phần. Các kỹ năng có thể được giữ làm dữ liệu tham chiếu/phân loại nhưng không tạo 21 kết quả độc lập.
4. **Gợi ý học liệu/khóa học** có thể xuất hiện theo khoảng trống năng lực; NEXA là nền tảng đo lường và phát triển năng lực, không biến thành sàn bán khóa học.
5. **Chỉ Platform Admin** quản lý provider/model/API key/định tuyến AI; Personal/Org không hiển thị metadata kỹ thuật model hoặc latency.
6. Không tự động gọi AI khi người học nộp bài; tiếp tục nguyên tắc on-demand và human-in-the-loop (HITL).

### Đánh giá nhanh

| Phạm vi | Tình trạng theo source | Kết luận |
|---|---|---|
| Security/RLS thành viên | Có migration 25 nhưng còn vấn đề helper `SECURITY DEFINER` | **Cần kiểm chứng/sửa P0** |
| API quản lý Organization | Có guard mới; API khác dùng cơ chế quyền khác nhau | **Chưa thống nhất** |
| payOS fail-closed | Đã loại QR bank hardcoded trong `PaymentVerifierService` | **Fixed in code; cần E2E** |
| Business inquiry | Bảng/API `business_inquiries` đã xuất hiện | **Có nền tảng** |
| Admin duyệt Business | API approve tồn tại; UI/list vẫn dựa vào bảng org cũ | **Chưa khép kín** |
| Join link/code/CSV | Có migrations/API/UI | **Cần test thực tế** |
| Campaigns | Có DB/API/UI | **Có lỗi tenant authorization** |
| Analytics 5 miền | Có nhưng tính theo vị trí mảng, `0` cho thiếu dữ liệu | **Cần sửa** |
| Quota/entitlement | Có bảng và service đọc hạn mức | **Cần xác thực ledger** |
| Admin AI Settings | UI gửi POST sang endpoint chỉ có GET | **Không lưu được qua endpoint hiện tại** |
| E2E staging | Chưa xác minh | **Chưa đạt điều kiện kết luận** |

---

## II. P0 — Các điểm cần xử lý trước mọi đợt mở rộng tính năng

> Phân loại: **CONFIRMED IN SOURCE** = xác nhận cấu trúc/mã đang tồn tại; **NEEDS_RUNTIME_TEST** = cần chứng minh tác động ở database/staging. Không đồng nghĩa đã thử exploit trên production.

### SEC-01 — Hàm `is_admin_or_service()` có nguy cơ nâng quyền khi gọi trong RLS

- **Mức độ:** P0 / Security gate.
- **Trạng thái:** CONFIRMED IN SOURCE; cần kiểm tra database runtime và function owner.
- **Nguồn:** `src/database/migrations/12_security_rls_hardening.sql`, dòng 12–40; `src/database/migrations/25_harden_user_organizations_and_admin_rls.sql`.
- **Vấn đề:** `public.is_admin_or_service()` là hàm `SECURITY DEFINER` nhưng dùng điều kiện `current_user IN ('postgres', 'service_role')`. Trong PostgreSQL, `current_user` khi thực thi SECURITY DEFINER có thể là chủ sở hữu hàm, dẫn đến kết quả `TRUE` cho người gọi không phải Admin nếu owner thỏa điều kiện.
- **Tác động:** Policy RLS dùng helper có thể bị vô hiệu hóa phân biệt Admin/thường; ảnh hưởng cách ly tenant và truy cập bảng nhạy cảm.
- **Giải pháp:** Không dùng `current_user` như bằng chứng quyền của caller trong `SECURITY DEFINER`; xác minh JWT role/claim được tin cậy, kiểm tra canonical platform-admin identity, quyền `EXECUTE`, owner và search_path. Tách service-role trusted-server khỏi caller authenticated. Kiểm tra toàn bộ policies gọi helper.
- **Nghiệm thu:** Trên staging với JWT thật, người thường/Org Admin không đọc/ghi dữ liệu ngoài quyền; chỉ Platform Admin và trusted backend được phép. Kiểm chứng cả anonymous, member Org A/Org B, Org Owner và Admin.
- **Liên kết:** https://github.com/minhhuyzzz/nexa_AI/blob/abb463faf8ffd9e4964126e2a08abb96654a733a/src/database/migrations/12_security_rls_hardening.sql#L12-L40

### SEC-02 — GET Campaigns không kiểm tra tư cách thành viên tổ chức

- **Mức độ:** P0.
- **Trạng thái:** CONFIRMED IN SOURCE.
- **Nguồn:** `src/app/api/organizations/[orgId]/campaigns/route.ts`, dòng 43–78.
- **Vấn đề:** GET chỉ kiểm tra có user đăng nhập, sau đó dùng `createAdminClient()` (service-role) đọc `assessment_campaigns` theo `orgId` URL. Không kiểm tra user có quyền xem tổ chức đích hay không.
- **Tác động:** Người có tài khoản có thể truy vấn campaign của tổ chức khác nếu biết/đoán được `orgId`; service-role bypass RLS.
- **Giải pháp:** Xác minh membership ACTIVE của org đích trước khi dùng service-role; phân quyền xem theo vai trò và class/campaign khi cần. Kiểm tra cả các API Organization mới có pattern tương tự.
- **Nghiệm thu:** Member Org A gọi GET Org B trả 403 hoặc 404 không tiết lộ dữ liệu; người hợp lệ xem được đúng scope.
- **Liên kết:** https://github.com/minhhuyzzz/nexa_AI/blob/abb463faf8ffd9e4964126e2a08abb96654a733a/src/app/api/organizations/%5BorgId%5D/campaigns/route.ts#L43-L78

### SEC-03 — Tạo Campaign chưa kiểm tra ownership đề và lớp; thiếu toàn vẹn giao dịch

- **Mức độ:** P0 (cross-tenant/integrity).
- **Trạng thái:** CONFIRMED IN SOURCE.
- **Nguồn:** `src/app/api/organizations/[orgId]/campaigns/route.ts`, dòng 80–197.
- **Vấn đề:** POST kiểm tra `assessmentId` tồn tại nhưng chưa so `assessment.organization_id` với `orgId` (hoặc kiểm tra chính sách đề SYSTEM được chia sẻ). `classIds` và `assessorIds` không được chứng thực toàn bộ thuộc org hợp lệ. API tự cập nhật đề thành `PUBLISHED`, rồi insert campaign và upsert assignment trong các lệnh rời, không kiểm tra lỗi của từng assignment.
- **Tác động:** Có thể thao tác với tài nguyên khác tenant; tạo đợt nửa vời; thay đổi trạng thái đề vượt quy trình kiểm duyệt.
- **Giải pháp:** Validate quyền sử dụng đề, owner/scope; xác minh từng class và assessor; chỉ dùng phiên bản đề đã được phép phát hành; transaction/RPC nguyên tử và rollback nếu bất kỳ bước nào thất bại.
- **Nghiệm thu:** Không thể chọn đề/lớp của Org B cho Org A; lỗi bất kỳ bước nào không tạo chiến dịch/bài giao dở dang; phiên bản đề đã khóa không bị đổi ngoài quy trình.

---

## III. Review chi tiết Platform Admin (12 màn hình)

### 1. `/admin/dashboard` — Trung tâm điều hành

**Ưu tiên:** P1 (dữ liệu) + P2 (trải nghiệm).

**Nhận xét:** Giao diện khá gọn nhưng nút chính là “Soạn đề thi mới”, không phù hợp vị trí CEO/Platform Admin. Hàng đợi việc cần làm hiện có nhưng nguồn B2B chưa đồng bộ.

**Lỗi xác nhận:** `src/app/(dashboard)/admin/dashboard/page.tsx` dòng 26–78 đếm pending B2B bằng `organizations.status = 'PENDING_CONTACT'`; API inquiry mới lại ghi vào `business_inquiries.status = 'NEW'`. Có thể hiển thị `0 yêu cầu mới` dù có hồ sơ cần liên hệ. Ngoài ra, một số query lỗi được coalesce thành 0.

**Thiết kế lại:**

1. Header **Trung tâm điều hành NEXA**: khoảng thời gian, trạng thái cập nhật, nút xem công việc cần xử lý.
2. **KPI hành động:** Business chờ xử lý, giao dịch cần đối soát, nội dung chờ duyệt, cảnh báo hệ thống. Dùng dữ liệu thật; ẩn/hiển thị `Không thể tải` khi lỗi.
3. **Hàng đợi điều hành:** mục việc, thời điểm phát sinh, mức ưu tiên, người xử lý, thao tác tiếp theo.
4. **Sức khỏe hệ thống:** Auth, DB, thanh toán, AI, jobs; có `last_checked_at`, không fake “Hoạt động” nếu chưa đo.
5. KPI phụ: người dùng hoạt động, số tổ chức đang hiệu lực, doanh thu theo kỳ, số lượt khảo thí hoàn thành, tỷ lệ phát hành đề hợp lệ.
6. Không dùng CTA tạo đề thi như hành động mặc định quan trọng nhất.

**Nghiệm thu:** Pending Business phải đọc đúng `business_inquiries`; `null/error` không thành 0; KPI thống nhất nguồn và khoảng thời gian; drill-down tới hồ sơ/thao tác cụ thể.

### 2. `/admin/users` — Quản lý người dùng

**Ưu tiên:** P1.

**Nhận xét:** Trộn global role `LEARNER/EVALUATOR/ADMIN`, tier Personal `FREE/PRO/ENTERPRISE`, và membership Org; trái với định hướng một tài khoản đa năng lực.

**Lỗi xác nhận:** `src/app/(dashboard)/admin/users/page.tsx` dòng 75–113 gọi PATCH nhiều lần nhưng không kiểm tra `res.ok`, vẫn cập nhật local state và báo thành công khi server trả lỗi HTTP. `src/app/api/admin/users/route.ts` cũng có nhánh upsert `user_organizations` chưa kiểm tra kết quả và đang gán membership ACTIVE trực tiếp nếu có `organizationId`.

**Đề xuất:**

- Trang chi tiết user có tab **Tài khoản / Gói cá nhân / Tổ chức / Hoạt động / Lịch sử quản trị**.
- Không dùng global role LEARNER/EVALUATOR để quyết định quyền tạo đề; creator capability theo entitlement và ownership.
- Quyền Org chỉ thay đổi trong membership, không tự động cấp Platform Admin.
- Gộp thay đổi user có kiểm tra server response, audit, reason và giao dịch nhất quán nếu cần.
- Cấp quyền/gói trả phí theo entitlement có thời hạn; không chỉ sửa `profiles.plan_tier`.
- Các thao tác đặc quyền cần xác nhận phù hợp và thông báo lỗi chi tiết an toàn.

**Nghiệm thu:** API 403/500 không tạo thông báo thành công; refresh đúng trạng thái DB; thay gói có lịch sử, hiệu lực và thời hạn; người học có thể đồng thời là creator và org member.

### 3. `/admin/organizations` — Khách hàng trường học & doanh nghiệp

**Ưu tiên:** P1 rất cao; trọng tâm đợt tiếp theo.

**Vấn đề:** Giao diện vẫn lấy `/api/admin/organizations` từ `organizations`, lọc pending theo `PENDING_CONTACT`, trong khi khách hàng gửi lead vào `business_inquiries`. Luồng duyệt contract mới có API riêng nhưng chưa kết nối thành trung tâm điều hành Business.

**Luồng chuẩn phải có:**

```text
Khách gửi yêu cầu Business
  → business_inquiries: NEW
  → Admin tiếp nhận / liên hệ: CONTACTED
  → Tư vấn, báo giá, thỏa thuận số ghế và quota
  → Kiểm tra, ký hợp đồng / xác nhận điều kiện
  → Platform Admin phê duyệt
  → Transaction nguyên tử:
       Organization + Contract/Entitlement + Owner Invitation + Audit
  → Kích hoạt ACTIVE chỉ khi tất cả điều kiện hoàn tất
  → Bàn giao Org Owner và theo dõi sử dụng/gia hạn
```

**Lỗi xác nhận trong** `src/app/api/admin/organizations/approve/route.ts`, dòng 74–161: tạo org ACTIVE trước rồi insert `organization_entitlements`; nếu insert entitlement lỗi, chỉ console.warn và vẫn có thể trả success. Insert owner invitation và cập nhật inquiry cũng chưa kiểm tra lỗi đầy đủ.

**Lỗi phụ:** `POST /api/admin/organizations` trong `src/app/api/admin/organizations/route.ts` tạo org trực tiếp `ACTIVE` cùng các quota mặc định, tạo hai cách kích hoạt không thống nhất.

**Thiết kế đề xuất:**

- **Hồ sơ tiềm năng:** mới / đã liên hệ / chờ báo giá / đang đàm phán / từ chối.
- **Tổ chức đang hoạt động:** tên, chủ sở hữu, số ghế, ngày hợp đồng, quota, usage, trạng thái, cảnh báo.
- **Chi tiết Business:** hồ sơ liên hệ, lịch sử tư vấn, gói/hợp đồng, seats, AI credits, số lượt khảo thí, ngày hiệu lực/hết hạn, thanh toán, lịch sử sửa đổi.
- **Hành động:** duyệt có điều kiện, yêu cầu bổ sung, kích hoạt, gia hạn, tăng/giảm quota, tạm ngưng, chuyển chủ sở hữu theo quy trình.
- **Không** cho trạng thái ACTIVE nếu chưa có entitlement hợp lệ; dùng transaction DB hoặc PROVISIONING khi cần hoàn tất nhiều bước.

**Nghiệm thu:** Lead mới xuất hiện trên Admin; duyệt lặp không tạo org thứ hai; không thể có org ACTIVE thiếu entitlement; mọi thao tác có audit; hạn mức thực tương ứng hợp đồng.

### 4. `/admin/content` — Đề thi hệ thống

**Ưu tiên:** P1.

**Quan sát ảnh:** Có đề “Đánh Giá Năng Lực Số Chuẩn Quốc Gia & EU DigComp” ở `DRAFT`, `0 câu`, `Chưa phân miền`.

**Vấn đề:** Hệ thống Personal cần baseline thực; không thể coi một đề trống là đã đủ sẵn sàng cho hành trình học/đánh giá.

**Đề xuất:** Tách rõ **ngân hàng câu hỏi → đề đánh giá → bộ đề phát hành → phiên bản đề**. Workflow `DRAFT → VALIDATED → REVIEWED → PUBLISHED → ARCHIVED`. Trước khi publish cần kiểm đủ số câu, đáp án/rubric, phân bổ đúng 5 miền, thời lượng, tính hợp lệ, policy quyền và versioning. Không sửa trực tiếp đề đang có lượt thi lịch sử.

**Nghiệm thu:** Không phát hành đề 0 câu/thiếu chuẩn; baseline hiển thị hợp lệ cho người dùng có entitlement; đề đã xuất bản được khóa phiên bản và có lịch sử.

### 5. `/admin/frameworks` — Khung năng lực số

**Ưu tiên:** P1/P2.

**Nhận xét:** 5 miền + 21 kỹ năng trong dữ liệu là có thể chấp nhận để làm metadata tham chiếu, nhưng **sản phẩm chỉ đánh giá, radar, báo cáo và đề xuất học tập ở cấp 5 miền** theo quyết định đã chốt. Không đưa 21 kỹ năng thành 21 điểm/báo cáo riêng.

**Nguy cơ:** UI/API cho chỉnh sửa miền và kỹ năng trực tiếp trên active framework. Nếu đề và báo cáo lịch sử tham chiếu cùng ID, sửa tên/mô tả có thể đổi nghĩa dữ liệu đã đánh giá.

**Đề xuất:** Active framework read-only; để sửa thì clone `DRAFT` version mới, kiểm tra tác động, review và publish version. Mỗi assessment/campaign/report lưu framework version gắn thời điểm sử dụng. Cho phép hiển thị kỹ năng tham chiếu trong Admin/editor nếu cần, nhưng thống kê cuối chỉ theo 5 miền.

### 6. `/admin/contributions` — Duyệt đề cộng đồng

**Ưu tiên:** P2.

**Nhận xét:** Có thao tác APPROVED/NEEDS_REVISION và feedback, là nền tảng tốt.

**Đề xuất:** Mỗi hồ sơ cần người thẩm định, nguồn/bản quyền, phân loại miền, rà soát đáp án, rubric, tệp đính kèm, lịch sử quyết định. APPROVED chuyển vào **ngân hàng câu hỏi đã duyệt** theo chính sách, không tự đồng nghĩa đăng công khai thành đề thi hệ thống. Thưởng XP qua point ledger idempotent, không nhân đôi khi duyệt lặp. Có lý do từ chối và yêu cầu sửa.

### 7. `/admin/plans` — Gói dịch vụ

**Ưu tiên:** P1.

**Vấn đề:** Các thẻ gói được chia theo `LEARNER/EVALUATOR` Free/Plus/Pro như mô hình cũ. Một tài khoản Personal đa năng lực không nên cần mua hai gói để vừa học vừa tạo đề.

**Thiết kế mới:**

| Nhóm | Hình thức | Quản lý |
|---|---|---|
| Personal | Free/Plus/Pro hoặc các tier được chốt | Tự nâng cấp, thanh toán online, entitlement cá nhân |
| Business | Báo giá/hợp đồng riêng | Admin duyệt và cấp entitlement tổ chức, seats, quota, thời hạn |

- Plan configuration: tên, mô tả, tier, giá, chu kỳ, điều kiện, quyền lợi cụ thể, quotas, trạng thái publish, hiệu lực, version.
- Không thay âm thầm quyền lợi của thuê bao/hợp đồng đang có hiệu lực chỉ vì Admin sửa catalog.
- Business là quản trị tập trung, lớp/cohort, campaigns, báo cáo 5 miền, phân quyền, ngân sách/hợp đồng; không chỉ là Personal Pro với nhiều credits.

### 8. `/admin/transactions` — Giao dịch & đối soát

**Ưu tiên:** P1 cao.

**Vấn đề:** Ảnh UI mô tả phương thức SePay/VietQR trong khi flow Personal đã chuyển payOS; cần đối chiếu provider thực tế và thống nhất tên. Nút “Duyệt thủ công” có rủi ro vì API `POST /api/admin/transactions` gọi trực tiếp `fulfill_payment_transaction` chỉ với `transactionId` và ghi chú.

**Yêu cầu sản phẩm/kỹ thuật:**

- Luồng payOS xác minh tự động là mặc định; trạng thái pending/success/failed/expired/cancelled rõ.
- Đối soát thủ công chỉ dành cho ngoại lệ thực sự: yêu cầu bằng chứng chuyển khoản, số tiền, reference, merchant account, lý do, actor và dấu thời gian.
- Không dùng manual fulfillment như lối tắt nếu webhook không hoạt động.
- RPC idempotent, mỗi transaction chỉ cấp entitlement/credits một lần, có audit.
- Cần lọc khoản thanh toán theo kỳ, provider, người dùng, gói, trạng thái và phương thức.

**Nghiệm thu:** Không thể duyệt trùng; không thể hoàn tất giao dịch sai số tiền/trạng thái; mọi thủ công có minh chứng và lý do; provider hiển thị khớp thực tế.

**Nguồn:** `src/app/api/admin/transactions/route.ts`, dòng 68–116.

### 9. `/admin/ai-gateway` — Vận hành AI, model & chi phí

**Ưu tiên:** P1.

**Đúng về phạm vi:** Platform Admin được phép xem provider, model, token, latency và giá thành. Personal/Org chỉ nên thấy khả dụng, kết quả và credit/quota phù hợp.

**Vấn đề xác nhận:** `src/app/api/admin/ai-gateway/route.ts` chỉ lấy 100 `ai_usage_events` gần nhất rồi đặt tên các chỉ số là “tổng”. Dễ bị hiểu nhầm là số liệu toàn hệ thống. `modelCounts` có fallback ghi cứng tên model khi log không có metadata. `ai-gateway/page.tsx` cũng có label model mặc định cố định.

**Thiết kế:**

1. **Vận hành:** tỷ lệ thành công/lỗi, health, latency theo kỳ, trạng thái queue và retry.
2. **Model & Routing:** model theo tác vụ (grading, competency analysis, authoring), primary/fallback, chiến lược và lưu lịch sử thay đổi.
3. **Chi phí & Giới hạn:** token, cost ước tính/thực, chi phí theo org/tier/feature, cảnh báo vượt ngân sách.
4. **Secrets:** thay/thu hồi key, test kết nối có auth, không trả API key thô cho browser, không lưu plain key trong client.

**Nghiệm thu:** Số tổng đúng khoảng thời gian và nguồn; Admin điều chỉnh thực sự ở backend; Personal/Org không nhận thông tin model/provider từ API/SSR.

### 10. `/admin/compliance` — Tuân thủ, bảo mật và khảo thí

**Ưu tiên:** P1.

**Lỗi xác nhận:** UI ghi cố định “100% người dùng đã cấp quyền” trong `src/app/(dashboard)/admin/compliance/page.tsx`, dòng 102–115, ngay cả khi `consentLogs.length` bằng 0. Đây là thông tin dễ gây hiểu nhầm và không phải bằng chứng tuân thủ.

**Thiết kế lại thành:**

- **Đồng thuận dữ liệu:** bản ghi, phiên bản, trạng thái, thời gian; chỉ số phải có mẫu số/tử số thật.
- **Nhật ký Admin:** đổi quyền, cấp credits, duyệt Business, hoàn tất payment, publish nội dung, thay AI config.
- **Giám sát khảo thí:** các sự kiện phòng thi, phân loại mức nghiêm trọng, case review.
- **Sự cố & yêu cầu dữ liệu:** xử lý sự cố, xóa/điều chỉnh dữ liệu theo chính sách.

Không tuyên bố hệ thống “đã tuân thủ NĐ 13/2023” chỉ vì có bảng consent/log. Đánh giá tuân thủ thực tế cần pháp lý, data governance, retention và vận hành.

### 11. `/admin/settings` — Cài đặt nền tảng

**Ưu tiên:** P1.

**Lỗi xác nhận:** `src/app/(dashboard)/admin/settings/page.tsx` dòng 155–187 gửi `POST /api/admin/ai-gateway` để lưu provider/API key/PII/session/login attempts. Nhưng `src/app/api/admin/ai-gateway/route.ts` hiện chỉ triển khai **GET**, không có POST. UI hiện có nút lưu nhưng endpoint tương ứng không tồn tại.

**Đề xuất:**

- Cấu hình provider/model/key chuyển về **AI Gateway** (single source of truth).
- **Settings** chỉ dành cho chính sách phiên, bảo mật, giới hạn đăng nhập, thông tin nền tảng và tham số có backend thực sự hỗ trợ.
- Lưu cấu hình phải có Zod validation, server-side auth, audit, version/change history và chứng minh runtime thực thi.
- Không dùng slider/checkbox chỉ thay state giao diện rồi khẳng định đã bật bảo mật.

**Nghiệm thu:** Lưu thành công thì F5 còn giá trị đúng; thay cấu hình làm thay đổi thực tế có kiểm thử; API không trả secret cho client; lỗi lưu hiển thị chính xác.

### 12. `/admin/analytics` — Phân tích vận hành nền tảng

**Ưu tiên:** P1.

**Lỗi xác nhận:** `src/app/api/admin/analytics/route.ts`, dòng 85–119 ánh xạ `competency_analyses.radar_data` sang miền bằng **chỉ số mảng** `idx + 1`, không dựa vào domain ID/code. Khi thứ tự thay đổi, điểm có thể gán nhầm miền. Đối với miền thiếu bằng chứng, API trả điểm `0` thay vì `null`.

**Vấn đề diễn giải:** Hệ thống ghi ngưỡng `70%` như chuẩn bắt buộc của EU DigComp. Cần coi là **ngưỡng NEXA cấu hình** nếu không có nguồn học thuật/quy định chính thức xác nhận áp dụng theo cách đó.

**Đề xuất:**

- Dashboard Admin phân tích theo **5 miền cấp nền tảng**, không phân tách thành 21 điểm/kỹ năng.
- Phân biệt `null` (chưa có bằng chứng) và `0` (đã đánh giá đạt 0).
- Dùng canonical domain ID/code, framework version và evidence lineage.
- Phân tích theo thời gian, org, gói, đợt đánh giá, cohort; chỉ số có sample size và mức độ bao phủ.
- Báo cáo thêm kinh doanh/chất lượng hệ thống nhưng tránh trộn số liệu khảo thí với doanh thu/AI usage thành một KPI không có ý nghĩa.
- Export có bộ lọc, audit, kiểm tra dữ liệu nhạy cảm, phản hồi lỗi download đúng.

**Nghiệm thu:** Đổi thứ tự radar array không làm đổi miền; không có evidence hiển thị “Chưa có kết quả”; dashboard khớp query báo cáo; file xuất đúng kỳ/phạm vi và có audit.

---

## IV. Các vấn đề kiến trúc xuyên suốt

### ADM-A01 — Platform Admin authorization chưa có một chuẩn thống nhất

- `src/app/(dashboard)/admin/layout.tsx` chỉ dùng whitelist email từ `isSuperadminEmail()`.
- `src/lib/auth/admin-guard.ts` (`requirePlatformAdmin`) cho phép email whitelist **hoặc** role ADMIN/SUPERADMIN.
- Một số route Admin khác (`transactions`, `plans`, `ai-gateway`, `compliance`) kiểm tra `profiles.role = 'ADMIN'`.
- Một số khác (`users`, `analytics`) chỉ dùng email whitelist.

**Rủi ro:** Người không được vào giao diện Admin vẫn có thể gọi API tùy cách cấp role; chính sách quyền không có single source of truth. Cần thống nhất một canonical authorization method cho từng endpoint, tránh coi `ORG_ADMIN` là `PLATFORM_ADMIN`.

### ADM-A02 — Query lỗi bị biến thành empty/zero

Một số API và page bỏ qua error, fallback `[]` hoặc `0`. Đây là nguy cơ chất lượng quyết định trong control plane: 0 không tương đương mất kết nối database. Bắt buộc phân biệt:

- `LOADING` — đang tải.
- `EMPTY` — truy vấn thành công nhưng không có dữ liệu.
- `ERROR` — lỗi truy vấn/tích hợp.
- `UNAUTHORIZED` — không đủ quyền.
- `SUCCESS` — dữ liệu hợp lệ với timestamp cập nhật.

### ADM-A03 — Thiếu audit cho hành động đặc quyền

Tối thiểu cần audit: role grant/revoke, entitlement cấp/gia hạn/thu hồi, org activate/suspend, manual payment fulfill/refund, content publish, certificate revoke, AI config/key change, framework version publish. Consent log và proctoring log không thay thế audit log.

### ADM-A04 — Dữ liệu thống kê cần provenance

Mỗi KPI phải định nghĩa nguồn, phạm vi thời gian, mẫu số/tử số, trạng thái dữ liệu, timezone và điều kiện lọc. Không dùng nhãn “Doanh thu thực tế” nếu dữ liệu chỉ là tổng `status = SUCCESS` mà thiếu thống nhất hoàn tiền/chargeback/điều chỉnh.

---

## V. Đề xuất Information Architecture (Sidebar) Admin

Giữ thẩm mỹ theo `AGENTS.md`: trắng, xám nhạt, xanh dương học thuật, Inter, JetBrains Mono, icon lucide, border mảnh, `rounded-md`, không gradient/emoji trong JSX.

```text
NEXA.  /  PLATFORM ADMIN
│
├── ĐIỀU HÀNH
│   ├── Trung tâm điều hành        /admin/dashboard
│   ├── Công việc cần xử lý        [trang/hàng đợi tổng hợp đề xuất]
│   └── Báo cáo nền tảng          /admin/analytics
│
├── KHÁCH HÀNG & KINH DOANH
│   ├── Người dùng                /admin/users
│   ├── Khách hàng Business       /admin/organizations
│   ├── Gói & Quyền lợi           /admin/plans
│   └── Thanh toán & Đối soát     /admin/transactions
│
├── NỘI DUNG & KHẢO THÍ
│   ├── Ngân hàng đề & Học liệu   /admin/content
│   ├── Khung 5 miền năng lực     /admin/frameworks
│   └── Kiểm duyệt nội dung       /admin/contributions
│
└── HẠ TẦNG & AN TOÀN
    ├── AI Gateway & Chi phí      /admin/ai-gateway
    ├── Bảo mật & Kiểm toán       /admin/compliance
    └── Cài đặt nền tảng         /admin/settings
```

**Lưu ý:** “Công việc cần xử lý” có thể là bảng hợp nhất với deep links đến hàng đợi hiện có; không sao chép dữ liệu hay viết trùng logic.

---

## VI. Backlog ưu tiên cho coding agent

| ID | Mức | Việc cần làm | Phạm vi tham chiếu | Điều kiện nghiệm thu tối thiểu |
|---|---|---|---|---|
| SEC-01 | **P0** | Kiểm chứng và sửa `is_admin_or_service()`, RLS, GRANT/EXECUTE | Migration 12/25 + DB policies | Role/tenant tests trên JWT staging pass |
| SEC-02 | **P0** | Thêm authz GET campaigns + kiểm tra API Org có service-role | `api/organizations/[orgId]/**` | User Org A không xem Org B |
| SEC-03 | **P0** | Validate assessment/class/assessor, version, atomic campaign | `campaigns/route.ts` | Không cross-tenant, không partial insert |
| ADM-01 | **P1** | Thống nhất canonical Platform Admin guard | `admin/layout`, API Admin | Không còn drift email/role/API |
| ADM-02 | **P1** | Business inquiry pipeline trong Admin UI | `admin/organizations`, inquiries API | Lead thực vào đúng queue; có hồ sơ trạng thái |
| ADM-03 | **P1** | Atomic Business approval/provisioning | `admin/organizations/approve` | Không ACTIVE nếu thiếu entitlement/invite |
| ADM-04 | **P1** | Sửa AI settings persistence và nguồn cấu hình | `admin/settings`, `admin/ai-gateway` | Save/reload/authorization/audit đúng |
| ADM-05 | **P1** | Đối soát manual có chứng từ và idempotency | `admin/transactions` + RPC | Không duyệt trùng, có evidence và audit |
| ADM-06 | **P1** | Sửa cập nhật user role/tier kiểm tra HTTP response | `admin/users` + API | API error không báo success |
| ADM-07 | **P1** | Sửa 5 miền analytics theo ID/code, null vs 0 | `admin/analytics` | Radar đảo thứ tự vẫn đúng miền |
| ADM-08 | **P1** | Phân biệt Personal plans và Business contract | `admin/plans` + entitlements | Gói cũ không đổi âm thầm quyền lợi |
| ADM-09 | **P1** | Bỏ compliance KPI hardcoded | `admin/compliance` | Không hiển thị 100% nếu thiếu evidence |
| ADM-10 | **P2** | Framework versioning + khóa bản đã phát hành | `admin/frameworks` + schema | Lịch sử đề/kết quả bất biến |
| ADM-11 | **P2** | Kiểm duyệt content có provenance, rubric, status | `admin/contributions`, `admin/content` | Approved != tự public |
| ADM-12 | **P2** | Dashboard theo hàng đợi và health metrics | `admin/dashboard` | Có next action và error state |
| ADM-13 | **P2** | Audit logs cho admin actions | Shared service + database | Có actor/action/target/time/result |
| ADM-14 | **P2** | Thống nhất UX: loading/error/empty, filters, pagination | 12 trang Admin | Không có thành công giả/0 giả |

**Thứ tự phụ thuộc:** `SEC-01 → SEC-02/SEC-03 → ADM-01 → ADM-02/ADM-03 → ADM-05/ADM-04/ADM-06 → ADM-07/08/09 → ADM-10…14`.

### Bộ test nghiệm thu bắt buộc

1. Anonymous, Personal, Org Member, Org Admin, Platform Admin: test quyền trên tất cả API đặc quyền.
2. Org A không đọc campaign, class, submission, private evidence của Org B qua API hoặc Supabase client.
3. Business lead NEW hiện ở Admin queue; duyệt một lần tạo đủ org/entitlement/invite; retry không tạo duplicate.
4. Fail bất kỳ bước nào của Business approval không để lại org ACTIVE thiếu entitlement.
5. Thao tác PATCH user trả 403/500 thì UI không báo thành công.
6. Save AI settings được backend xử lý, refresh không mất trạng thái; không tiết lộ API key.
7. Giao dịch manual không hoàn tất 2 lần và không cấp credits trùng; chỉ duyệt khi đã có bằng chứng đối soát.
8. Analytics 5 miền dùng ID/code chuẩn; chưa có evidence = `null`, đã thi đạt 0 = `0`.
9. Đề 0 câu hoặc thiếu rubric không publish; sửa đề đã có submission không thay đổi lịch sử.
10. Compliance không hiển thị 100% đồng thuận khi dữ liệu thiếu hoặc chưa kiểm chứng.
11. KPI/dashboard phải có kỳ báo cáo, nguồn và trạng thái query; API lỗi không trả số 0 giả.
12. `npm run typecheck`, `npm test`, CI và E2E staging pass; phải ghi rõ test nào đã thực chạy.

---

## VII. Lộ trình cải thiện đề xuất

### Đợt 1 — Security & Integrity Re-validation

Sửa các điểm P0 còn tồn tại sau Phase 0–4, kiểm tra function owner, JWT/RLS, cross-tenant API, versioning tài nguyên và DB migration đang chạy thật. **Không mở rộng tính năng B2B nhạy cảm trước khi vượt security gate.**

### Đợt 2 — Business Control Center

Hoàn thiện inquiry → liên hệ → hợp đồng → duyệt → cấp entitlement → kích hoạt, quản lý hồ sơ khách hàng, hợp đồng, kỳ hạn, seats/quota, gia hạn và tạm ngưng. Ưu tiên cao nhất sau security vì là giá trị khác biệt của gói Business.

### Đợt 3 — Tài chính, gói dịch vụ và AI

Chuẩn hóa Personal plans vs Business entitlements, payment reconciliation, administrative audit, AI configuration backend và chi phí theo tenant/feature.

### Đợt 4 — Chất lượng nội dung, số liệu và UX

Chuẩn hóa 5 miền, assessment/framework versioning, moderation, reports và Dashboard điều hành. Tối ưu sidebar, loading/error/empty, search/filter và responsive. Không làm màu hay đổ thêm KPI không có ý nghĩa.

---

## VIII. Kết luận

**Không cần đập đi làm lại UI Admin.** Thị giác hiện tại tương đối phù hợp với NEXA. Những điểm chưa đạt chủ yếu nằm ở quy trình điều hành, phân quyền, tính toàn vẹn nguồn dữ liệu, hoạt động thực của button/config và phản hồi khi lỗi.

**Định hướng nên chốt:**

- Platform Admin là **control plane** của chủ nền tảng: Business, tài chính, AI, nội dung, bảo mật và audit.
- Business là **khách hàng theo hợp đồng**, không phải tài khoản Personal Pro nâng quota.
- Admin không chỉ đọc KPI mà cần hàng đợi, quyết định, xác nhận và lịch sử.
- AI provider/model chỉ quản trị ở Admin; các shell Personal/Org không phơi bày metadata model.
- NEXA đánh giá và báo cáo theo **5 miền DigComp**, có phân biệt dữ liệu thiếu và điểm số 0.
- Mọi thay đổi đặc quyền phải xác thực server-side, có quyền theo resource/tenant và audit rõ ràng.

**Mức độ tự tin:** Các lỗi có đường dẫn code là bằng chứng từ source ở commit đã pin. Chưa có bằng chứng kiểm thử triển khai Supabase, live browser, E2E hoặc giao dịch thật; không được ghi trong PR là đã kiểm thử các môi trường đó nếu chưa thực sự chạy.

**Khuyến nghị triển khai:** Security gate trước → Business Control Center → tài chính/gói/AI → chất lượng khảo thí và UX. Không sửa repo trong tác vụ review này.
