# NEXA AI — Review Personal & Organization Business Dashboard

> **Tài liệu review sản phẩm, UI/UX, workflow, phân quyền và kỹ thuật — dành cho chủ dự án và coding agent.**  
> **Ngày:** 30/10/2026  
> **Repository:** [`minhhuyzzz/nexa_AI`](https://github.com/minhhuyzzz/nexa_AI)  
> **Nhánh:** `main`  
> **Snapshot đã kiểm tra:** [`d7934984a4210fc6dde54a47888e7b920b88fa76`](https://github.com/minhhuyzzz/nexa_AI/commit/d7934984a4210fc6dde54a47888e7b920b88fa76)  
> **Commit:** `feat(personal): optimize dashboard UX, 5-domain standard, curated course catalog and payOS checkout`  
> **GitHub CI ở snapshot này:** `success` — [NEXA Quality Gates & CI](https://github.com/minhhuyzzz/nexa_AI/actions/runs/41010897036)  
> **Phạm vi:** kiểm tra lại kết quả triển khai Personal; review Organization Business từ ảnh giao diện và code trên GitHub; chỉ nêu yêu cầu sửa. **Không chỉnh repository, không tạo PR, không kiểm thử trực tiếp localhost, Supabase production hay chuyển tiền thật.**

---

## Mục lục

1. [Tóm tắt dành cho chủ dự án](#1-tóm-tắt-dành-cho-chủ-dự-án)
2. [Các quyết định nghiệp vụ cần chốt](#2-các-quyết-định-nghiệp-vụ-cần-chốt)
3. [Kết quả kiểm tra lại Personal](#3-kết-quả-kiểm-tra-lại-personal)
4. [Các vấn đề Personal cần sửa](#4-các-vấn-đề-personal-cần-sửa)
5. [Vì sao Organization hiện chưa ổn](#5-vì-sao-organization-hiện-chưa-ổn)
6. [Mô hình Organization Business — từ liên hệ đến kích hoạt](#6-mô-hình-organization-business--từ-liên-hệ-đến-kích-hoạt)
7. [Personal và Organization liên quan thế nào](#7-personal-và-organization-liên-quan-thế-nào)
8. [Mời thành viên: link, mã, CSV và phê duyệt](#8-mời-thành-viên-link-mã-csv-và-phê-duyệt)
9. [Đặc quyền gói Business](#9-đặc-quyền-gói-business)
10. [Thiết kế lại sidebar Organization theo vai trò](#10-thiết-kế-lại-sidebar-organization-theo-vai-trò)
11. [Workflow lõi: Đợt đánh giá](#11-workflow-lõi-đợt-đánh-giá)
12. [Review từng trang Organization và hướng UI/UX](#12-review-từng-trang-organization-và-hướng-uiux)
13. [AI: chỉ Platform Admin điều khiển model](#13-ai-chỉ-platform-admin-điều-khiển-model)
14. [Phát hiện kỹ thuật/bảo mật theo bằng chứng](#14-phát-hiện-kỹ-thuậtbảo-mật-theo-bằng-chứng)
15. [Backlog ưu tiên cho coding agent](#15-backlog-ưu-tiên-cho-coding-agent)
16. [Ma trận kiểm thử/tiêu chí nghiệm thu](#16-ma-trận-kiểm-thửtiêu-chí-nghiệm-thu)
17. [Thứ tự triển khai đề xuất](#17-thứ-tự-triển-khai-đề-xuất)
18. [Giới hạn review và kết luận](#18-giới-hạn-review-và-kết-luận)

---

## 1. Tóm tắt dành cho chủ dự án

**Đánh giá chung:** Personal đang tiến bộ về cấu trúc nhưng chưa khép kín tất cả workflow; Organization mới là tập hợp màn hình quản trị, **chưa trở thành một sản phẩm Business với vòng đời khách hàng, quyền lợi, vận hành khảo thí, báo cáo và quản trị rõ ràng**.

1. **Personal:** Sidebar đã tinh gọn; biểu đồ năng lực dùng 5 miền và biết phân biệt *chưa đo* với *đã đo được 0*; XP và chứng chỉ đã tách đúng hơn; checkout là trang riêng. Tuy nhiên bài baseline hiện có thể là fallback chưa có trong DB, AI vẫn lộ thông tin model, lộ trình chưa khép kín và thanh toán có nhánh fallback QR dùng thông tin tài khoản ngân hàng ghi cứng.
2. **Business:** Bắt buộc `liên hệ → tư vấn → Platform Admin xét duyệt → cấp entitlement/hạn mức → kích hoạt tổ chức`. Một user thường không được tự đăng ký Organization Business hoạt động ngay. Gói Business không đi qua checkout online của Personal trừ khi sau này có quyết định mới.
3. **Workspace:** Một tài khoản đăng nhập NEXA có thể dùng Personal và là thành viên của một hoặc nhiều Organization. Chuyển workspace **chỉ đổi phạm vi làm việc**; quyền, dữ liệu và gói được kiểm tra độc lập tại server. Không phải chuyển đổi loại tài khoản.
4. **Thành viên:** Ngoài mời từng email (đã có), cần link/mã tham gia có kiểm soát, CSV/Excel, hàng đợi xin gia nhập và các chính sách duyệt. Link công khai không bao giờ tự cấp quyền quản trị.
5. **Giá trị Business:** Quản lý theo đơn vị/lớp/đợt đánh giá; đánh giá **5 miền**, nhận diện khoảng trống, đề xuất đào tạo/khóa tuyển chọn, đo tiến bộ; ngân hàng đề dùng chung, tổ chức thi/chấm, báo cáo và quyền truy cập nhiều cấp. **Không trở thành marketplace khóa học.**
6. **AI:** Chỉ Platform Admin NEXA quản lý provider/model/API key. Personal/Organization thấy tác vụ AI, credits, kết quả và trạng thái chung; **không thấy model name/latency/provider**.
7. **Ưu tiên an toàn:** Migration 23 chứa chính sách RLS rất rộng cho memberships và quyền `GRANT ALL` cũ; một số API quản trị chưa thể hiện guard đủ rõ. Phải kiểm/khóa trước khi mở Business cho khách thật.

**Thứ tự đúng:** bảo mật và duyệt Business → cách tham gia tổ chức → class/assessment/workflow đúng tenant → đợt đánh giá + báo cáo 5 miền → quota/AI → tinh chỉnh UI.

### Mức bằng chứng

- **CONFIRMED_IN_CODE:** hành vi/logic thể hiện trực tiếp trong source tại SHA đã nêu.
- **DESIGN_GAP:** thiếu so với yêu cầu sản phẩm người dùng đã xác nhận.
- **PARTIAL:** có giao diện hoặc một phần backend, chưa chứng minh workflow hoàn chỉnh.
- **NEEDS_RUNTIME_TEST:** phải chạy thực tế với JWT, Supabase, migrations và trình duyệt mới có thể kết luận.
- `P0` = cần xử lý trước khi mở cho khách thật vì có nguy cơ lộ dữ liệu, vượt quyền hoặc ảnh hưởng tiền; `P1` = nghiệp vụ cốt lõi sai/thiếu; `P2` = UX/độ tin cậy/khả năng quản trị cần cải thiện. Severity là mức ưu tiên xử lý, không có nghĩa đã thử khai thác lỗi.

---

## 2. Các quyết định nghiệp vụ cần chốt

Các quyết định dưới đây có mức ưu tiên **cao hơn các giả định cũ trong code hoặc tài liệu**:

| ID | Quy tắc mới | Hệ quả thiết kế |
|---|---|---|
| DEC-01 | NEXA **đánh giá duy nhất 5 miền năng lực** | Radar, khoảng trống, báo cáo Personal/Org và KPI theo 5 miền; không chia điểm thành 21 kỹ năng con hoặc bắt UI hiển thị 21 kỹ năng |
| DEC-02 | Khóa học là **học liệu tuyển chọn**, không phải sản phẩm bán khóa học | AI gợi ý khóa/học liệu có nguồn và lý do, người dùng trở lại đánh giá tiến bộ; không cần giỏ hàng/hoa hồng/course marketplace |
| DEC-03 | Business **phải liên hệ NEXA và được Platform Admin phê duyệt** | Inquiry tách khỏi Organization ACTIVE; Admin quyết định hợp đồng, ghế, quota, thời hạn, quản trị viên đầu tiên |
| DEC-04 | Một user dùng cùng account trong Personal và các Organization | Workspace switcher là chọn context; mọi quyền và tài nguyên kiểm tra bằng server authz + org membership |
| DEC-05 | Cần onboarding thành viên quy mô lớn | Link/mã tham gia, import CSV/Excel, lời mời email, approval queue, hạn mức ghế, audit |
| DEC-06 | Chỉ Platform Admin kiểm soát provider/model AI | Bỏ nhãn model, provider, ping/latency kỹ thuật khỏi Personal và Org; giữ AI Gateway vận hành nội bộ |
| DEC-07 | Dashboard Organization là công cụ đo và điều phối tập thể | Thêm **Đợt đánh giá** và luồng giao đề → nộp → chấm → công bố → báo cáo → đề xuất đào tạo |
| DEC-08 | Personal upgrade dùng trang gói → checkout → kết quả | Không dùng QR modal. Business dùng **Liên hệ tư vấn**, không tự ý áp checkout Personal |
| DEC-09 | XP/điểm hoạt động ≠ điểm năng lực ≠ chứng chỉ | Cấp chứng chỉ từ bằng chứng và quy tắc hợp lệ; không từ ngưỡng XP |

---

## 3. Kết quả kiểm tra lại Personal

So với snapshot cũ `ab1a99ba...`, commit `d7934984...` đã thay đổi nhiều file Personal. CI thành công chỉ xác nhận các quality gate đang chạy, **không xác nhận DB đã migrate, payment thật hay E2E đã pass**.

| Hạng mục | Kết luận theo source | Đánh giá |
|---|---|---|
| PERS-01 — Sidebar | **FIXED_IN_CODE** | `PersonalSidebar.tsx` gom **Học tập & Phát triển / Nhóm & Công việc / Công cụ tạo & Tổ chức**; đã rút Grading/Billing khỏi menu cấp 1 |
| PERS-04 — 5 miền, `null` vs `0` | **PARTIAL/FIXED_IN_CODE** | `competency-profile` biết `null` khi không có dữ liệu và chỉ đưa 5 domain; cần test mọi đường lấy và tổng hợp chứng cứ |
| PERS-07 — Chứng chỉ | **FIXED_IN_CODE** | `profile-stats` lấy thông tin từ `credentials`, không còn điều kiện XP ≥450 để cấp chứng chỉ |
| PERS-02 — Dashboard | **PARTIAL** | Empty state và các KPI đã sửa, nhưng người dùng chưa có hoàn chỉnh chuỗi bước tiếp theo theo context |
| PERS-03 — Bài baseline | **PARTIAL / CẦN SỬA** | API chèn đối tượng baseline *vào response* nếu không tìm thấy bài đã phát hành; không bảo đảm ID/câu hỏi có ở DB |
| PERS-13 — Curated courses | **PARTIAL** | Có catalog DB và API, nhưng fallback hardcode vẫn hiện khi bảng rỗng/lỗi; chưa có lifecycle biên tập vững chắc |
| PERS-05 — Lộ trình | **PARTIAL** | Có nhóm theo miền dưới ngưỡng 70 và khóa tương ứng; vẫn cần thực thể kế hoạch, đánh dấu tiến trình, tái đánh giá |
| PERS-06 — AI recommendation | **PARTIAL** | Đã thêm kiểm tra `course_id` trong gợi ý; cần kiểm cả backend, credits và sự thật dữ liệu |
| PERS-08 — Bàn chấm theo ngữ cảnh | **PARTIAL** | Có entry point ở đề và assignments; chưa được chứng minh E2E chấm/duyệt/theo dõi kết quả |
| PERS-09 — Leaderboard | **FIXED_IN_CODE** | Đã loại dữ liệu mẫu trong trang, xem như gamification XP, không dùng thay score năng lực |
| Billing pages | **PARTIAL / CẦN SỬA GẤP** | Đã có `/personal/billing` → `/personal/checkout/[orderId]` → `/personal/billing/result`, nhưng fallback payment chưa an toàn |

**Điểm đã sửa cần giữ:** sidebar tối giản, Radar trung thực, phân biệt XP và chứng chỉ, course catalog nền tảng, checkout theo trang riêng. Không tái cấu trúc lại những phần đúng chỉ vì muốn đổi giao diện.

---

## 4. Các vấn đề Personal cần sửa

### PERS-F01 — [P0][CONFIRMED_IN_CODE] Fallback QR thanh toán có thông tin ngân hàng ghi cứng

- **Source:** [`src/features/billing/services/payment-verifier.service.ts` dòng 21–24, 56–156](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/features/billing/services/payment-verifier.service.ts#L21-L24).
- **Hiện trạng:** code chứa giá trị `BANK_ID`, `ACCOUNT_NO`, `ACCOUNT_NAME` cố định. Khi payOS không cấu hình hoặc khởi tạo thất bại, service tạo một giao dịch `VIETQR` và ảnh QR từ các giá trị này.
- **Vấn đề:** giao diện vẫn có thể khiến người dùng hiểu đây là thanh toán tự động qua payOS; fallback không chứng minh có nguồn webhook/đối soát tiền đến đáng tin cậy.
- **Yêu cầu:** production **fail closed** khi payOS unavailable; không trả QR/tài khoản mẫu; không kích hoạt quyền từ callback trang kết quả; chỉ webhook hợp lệ hoặc nghiệp vụ đối soát đã được duyệt mới fulfill.
- **Done khi:** thử payOS lỗi/thiếu key ⇒ API lỗi rõ ràng, không có QR hay lệnh thu tiền phát ra; webhook signature/số tiền/currency/order reference đúng ⇒ exactly-once activation; duplicate event không cấp lặp.

### PERS-F02 — [P1][CONFIRMED_IN_CODE] Bài đầu vào trong response chưa chắc tồn tại trong database

- **Source:** [`src/app/api/assessments/route.ts` dòng 102–119](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/assessments/route.ts#L102-L119).
- **Hiện trạng:** nếu không có bài đã phát hành, server tự `formatted.push()` một bài mang ID định sẵn, `questionCount: 10`.
- **Vấn đề:** chỉ thêm JSON không tạo assessment/questions/publishing và không bảo đảm player mở được.
- **Yêu cầu:** seed **bài baseline thật** (một bản ghi và bộ câu hỏi phiên bản hóa hợp lệ), có publish/eligibility; khi không sẵn sàng thì hiện *Chưa có bài đầu vào khả dụng*.
- **Done khi:** user mới vào catalog, chọn baseline ⇒ mở player có câu hỏi thật ⇒ nộp ⇒ lưu submission ⇒ profile có evidence 5 miền; không có dữ liệu thì không xuất hiện link tới ID không tồn tại.

### PERS-F03 — [P1][CONFIRMED_IN_CODE] Personal AI còn metadata nhà cung cấp/model

- **Source:** [`src/app/(dashboard)/personal/learning-path/page.tsx` dòng 60–65, 114–140](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/personal/learning-path/page.tsx#L114-L140); [`src/app/api/ai/status/route.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/ai/status/route.ts).
- **Hiện trạng:** luồng status chứa `model`, provider và thông báo kỹ thuật.
- **Quy tắc mới:** UI Personal/Org chỉ có **AI khả dụng / đang xử lý / tạm gián đoạn**, credits và giải thích tác vụ; không lộ danh tính model, provider, thông tin ping/latency.
- **Kiểm thử:** kiểm tra cả giao diện và API payload của endpoint công khai; metadata vận hành không nên gửi cho client không có quyền Admin.

### PERS-F04 — [P1/P2][CONFIRMED_IN_CODE] Course catalog fallback làm lệch danh mục đã duyệt

- **Source:** [`src/app/api/courses/route.ts` dòng 23–35](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/courses/route.ts#L23-L35).
- **Hiện trạng:** DB query lỗi hoặc trả rỗng đều cho `source: 'fallback'` và danh mục viết sẵn trong source.
- **Vấn đề:** khóa đã bị gỡ, hết hiệu lực hoặc bị Admin thu hồi có thể vẫn hiển thị. Không phân biệt *danh sách rỗng* với *database lỗi*.
- **Yêu cầu:** catalog được kiểm duyệt là nguồn chuẩn; khóa có `provider`, `official_url`, `domain_codes`, `review_status`, `last_verified_at`, lý do gợi ý; trả empty/error đúng trạng thái. Dữ liệu seed chỉ dùng khi triển khai đã nạp DB thật.
- **Done khi:** ARCHIVED không thể hiện; catalog trống hiện empty state; API lỗi hiện error và retry; AI không gợi ý khóa ngoài catalog đã được duyệt.

### PERS-F05 — [P1][DESIGN_GAP] Lộ trình chưa phải chu trình phát triển năng lực hoàn chỉnh

- **Hiện trạng:** UI lọc miền đã đánh giá có điểm `<70`, đối chiếu module và khóa tuyển chọn theo `domainCode`; phần AI phụ thuộc bài đã nộp.
- **Hướng sửa:** tạo *kế hoạch thực hiện* có ưu tiên, tài nguyên học thật, trạng thái `SAVED / IN_PROGRESS / COMPLETED`, ngày bắt đầu, kết quả tự khai báo phân biệt với chứng cứ đo thật. Không suy ra việc học xong khóa = miền năng lực đã đạt chuẩn.
- **Workflow:** `đánh giá 5 miền → phát hiện khoảng trống → đề xuất học liệu/khóa uy tín → học & thực hành → đánh giá lại → đo tiến bộ`.
- **Done khi:** F5/đăng nhập thiết bị khác vẫn thấy tiến độ; khóa không còn khả dụng được thay thế hợp lý; điểm miền thay đổi chỉ từ evidence đánh giá, không từ một click *đã học xong*.

### PERS-F06 — [P2][DESIGN_GAP] Dashboard cá nhân thiếu hành động tiếp theo theo ngữ cảnh

- Người chưa có baseline: ưu tiên **Làm bài đánh giá đầu vào**.
- Đã có baseline: ưu tiên **Miền cần cải thiện**, liên kết đến lộ trình/khóa học.
- Có assignment gần hạn: ưu tiên **Bài được giao** và thời hạn.
- Có vai trò người tạo đề/người chấm: ưu tiên **Đề cần xử lý**, không ép mọi người vào learner-only workflow.
- Empty, loading, error, unauthorized phải khác nhau; không hiển thị Radar `0%` cho người chưa đánh giá.

### PERS-F07 — [P2][NEEDS_RUNTIME_TEST] Checkout cần kiểm tra dữ liệu và trạng thái sau quay lại

- Có trang riêng, polling và result; chưa kiểm thử trên browser thật, webhook sandbox và database đang chạy.
- Cần đảm bảo orderId/orderCode/transactionId được resolve đúng, không cho người khác đọc đơn; reload/retry/idempotency chuẩn, trạng thái **Pending / Paid / Cancelled / Expired / Failed** chính xác.
- Thông điệp “được payOS bảo vệ” chỉ dùng cho transaction thực sự được payOS khởi tạo/xác minh.

---

## 5. Vì sao Organization hiện chưa ổn

### Quan sát từ ảnh giao diện

- **Tổng quan:** số thành viên/số đề/số lớp và ba card truy cập nhanh; không có lịch triển khai hay các việc cần xử lý.
- **Thành viên:** danh sách đơn giản, một nút mời; chưa thấy bulk import, join link chung, approval queue hoặc phân nhóm.
- **Đề tổ chức:** chủ yếu trang rỗng và nút soạn đề, không cho biết kỳ nào đang triển khai và ai phụ trách.
- **Nhóm & Lớp:** card lớp khá đơn giản; không trình bày lớp đã được giao đề gì, tỷ lệ nộp, thông báo, giáo viên, tiến độ.
- **Analytics:** có Radar 0% khi chưa có evidence; dẫn đến hiểu nhầm học viên đạt 0%.
- **Ngân sách & Quota AI:** có tên model, mô tả provider/latency, con số quota nhìn như cố định; không phù hợp ý đồ quản lý AI tập trung.
- **Cài đặt:** thiên về thông tin kỹ thuật (RBAC, RLS, PII masking, DangerZone); khách hàng Business cần hợp đồng, hạn mức, ghế, bảo mật/quyền quản trị dưới dạng dễ hiểu.
- **Switcher:** topbar có chọn Personal/Org, sidebar lại có nút *Về không gian cá nhân*; có thể làm người dùng nghĩ tài nguyên bị chuyển sang tài khoản khác.

### Gốc vấn đề

Organization đang tổ chức menu theo **module phần mềm** thay vì theo **vòng đời đánh giá năng lực của đơn vị**. Những gì người quản lý thực sự muốn biết là:

1. Tôi có thể đưa bao nhiêu người vào hệ thống? Tài khoản nào được phép?
2. Tôi cần đánh giá nhóm/lớp/phòng ban nào, vào thời gian nào?
3. Tôi dùng đề nào, ai chịu trách nhiệm phát hành và chấm?
4. Có bao nhiêu người đã làm, đang làm, quá hạn hoặc cần chấm?
5. 5 miền năng lực đang ra sao, trước và sau đào tạo có tiến bộ không?
6. Những khóa học/học liệu nào cần triển khai theo các khoảng trống đã đo?
7. Tôi dùng bao nhiêu quota và ngân sách AI, còn đủ cho kỳ tiếp theo không?

**Organization phải đưa người dùng đến các câu trả lời này, không chỉ link sang các bảng CRUD.**

---

## 6. Mô hình Organization Business — từ liên hệ đến kích hoạt

### 6.1. Nguyên tắc sản phẩm

- **Business bán theo hình thức liên hệ NEXA / tư vấn / báo giá / hợp đồng**, không phải nút checkout tự động giống Pro.
- **Platform Admin NEXA phê duyệt trước khi Organization được sử dụng.**
- Tài khoản liên hệ/đại diện doanh nghiệp là danh tính NEXA bình thường. Không cấp `ADMIN` toàn nền tảng hoặc `ORG_OWNER` chỉ vì họ gửi form.
- Quyền Business thuộc **organization entitlement**, không tự nâng gói Personal của từng người.
- Mỗi hợp đồng phải chỉ rõ gói, thời hạn, số seats, quota assessments/classes/rooms/AI, khả năng xuất báo cáo, hỗ trợ và lịch sử sửa đổi.

### 6.2. State machine đề xuất

```text
KHÁCH GỬI YÊU CẦU
  inquiry: NEW
       ↓
NEXA TIẾP NHẬN / TƯ VẤN
  inquiry: CONTACTED → PROPOSAL_SENT
       ↓
THẨM ĐỊNH / XÁC NHẬN THỎA THUẬN
  inquiry: APPROVED / REJECTED
       ↓ (chỉ APPROVED)
ADMIN TẠO HOẶC KÍCH HOẠT ORGANIZATION
  organization: PROVISIONING → ACTIVE
       ↓
CẤP ENTITLEMENT + ORG_OWNER/ORG_ADMIN ĐẦU TIÊN
       ↓
ONBOARDING THÀNH VIÊN / LỚP / ĐỢT ĐÁNH GIÁ
       ↓
HOẠT ĐỘNG → GIA HẠN / SUSPENDED / CLOSED
```

**Invariant:** `inquiry != organization`. Khách để lại số điện thoại không đồng nghĩa có tổ chức đang chạy.

### 6.3. Review hiện trạng code

- [`/api/organizations/inquiry`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/organizations/inquiry/route.ts#L47-L66): form inquiry hiện **insert trực tiếp** bảng `organizations`, `status: 'PENDING_CONTACT'`, `is_active: false`. Có trạng thái chờ nhưng chưa có entity inquiry tách rời và lifecycle hợp đồng.
- [`/api/admin/organizations`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/admin/organizations/route.ts): POST tạo org `ACTIVE` ngay; PATCH có thể sửa status. **Cần authz Platform Admin rõ ràng ngay tại server route**.
- [`org/[slug]/layout.tsx`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/layout.tsx#L28-L55): lấy `is_active` nhưng guard hiện chỉ check membership ACTIVE (hoặc superadmin), **chưa chặn org đang inactive**. Ngoài ra cần xác nhận `status`, entitlement và hạn kỳ ở mọi API org.
- [`/api/organizations/my`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/organizations/my/route.ts#L19-L65): trả workspace dựa trên membership ACTIVE, chưa thấy lọc tổ chức ACTIVE/hợp đồng hiệu lực.

### 6.4. Trang Business nên thể hiện gì

**Public Pricing:** Card `Business` có nút **Liên hệ tư vấn**, nội dung đặc quyền, không có nút thanh toán online.

**Form liên hệ:** tên tổ chức, loại đơn vị, người đại diện, email, số điện thoại, số lượng dự kiến, mục tiêu đánh giá, ghi chú. Có chống spam/rate limiting, validation và consent phù hợp.

**Platform Admin (đánh giá API liên quan, chưa review UI Admin toàn diện):** hàng đợi inquiry → hồ sơ liên hệ → báo giá/hợp đồng → phê duyệt → cấp quyền lợi → phát lời mời cho người quản trị đầu tiên; audit actor/time/old/new value.

**Org Settings:** xem hạn mức, ngày bắt đầu/kết thúc, gói Business, liên hệ hỗ trợ; không cho tự tăng ghế/AI quota bằng cách sửa client.

---

## 7. Personal và Organization liên quan thế nào

### 7.1. Một danh tính — nhiều workspace

```text
                   TÀI KHOẢN NEXA (user_id)
                            |
               +------------+------------+
               |                         |
         PERSONAL                    ORGANIZATION A
       (user-owned)              (organization_id A)
  bài cá nhân, hồ sơ,      quyền quản trị / giảng viên /
  lộ trình, chứng chỉ     học viên tùy membership và role
                                         |
                                   ORGANIZATION B
                                 (organization_id B)
```

- **Personal**: tài nguyên do người dùng sở hữu; quota cá nhân Free/Pro.
- **Org**: tài nguyên thuộc tổ chức; quota/seat/entitlement thuộc Business; role quyết định ai xem/sửa tài nguyên nào.
- **Một người có thể ở nhiều tổ chức** với role khác nhau; superadmin của NEXA là quyền nội bộ hoàn toàn khác.
- Khi sang Org, Personal data **không tự chuyển sở hữu**. Bài đánh giá cá nhân không tự thành đề tổ chức. Cần thao tác copy/publish/assign có authorization và audit nếu sản phẩm cho phép.
- Thành viên tổ chức có thể xem bài được giao từ Personal (`/personal/submissions`), nhưng quyền thao tác trên dữ liệu org phải được kiểm tra bằng nguồn org của assignment. Với người quản lý, đường dẫn nên nằm trong shell Org để không gây lẫn context.

### 7.2. Workspace switcher — đề xuất UI

- Giữ **một** Workspace Switcher ở topbar hoặc avatar menu. **Bỏ nút về Personal** dư ở cuối `OrgSidebar.tsx`.
- Hiển thị workspace theo user membership **ACTIVE** + organization **ACTIVE** + gói Business hiệu lực.
- Cần mô tả rõ dưới tên tổ chức vai trò người dùng bằng tiếng Việt: *Chủ sở hữu / Quản trị viên / Người đánh giá / Thành viên / Người xem báo cáo*, không lộ raw `ORG_ADMIN` trừ khu vực kỹ thuật.
- Khi chuyển: route, search, breadcrumbs, request cache, saved filters và API đều theo workspace tương ứng; server không tin cookie/localStorage như bằng chứng quyền.
- Truy cập org đang suspended: màn hình trạng thái dễ hiểu và hỗ trợ liên hệ, không hiển thị số liệu nhạy cảm.

### 7.3. Vấn đề đã xác nhận

[`org/[slug]/classes/page.tsx` dòng 88–89](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/classes/page.tsx#L88-L89) đang mở chi tiết lớp theo đường dẫn `/personal/groups/${cls.id}`.

**Không phải mọi đường dẫn sang Personal đều là bug**, nhưng *đang xem lớp của tổ chức mà bị đẩy qua shell Personal* làm rối workflow và có nguy cơ xử lý sai context. Đề xuất route org class detail riêng hoặc component dùng chung với route duy trì `organization_id`, quyền và breadcrumbs. Kiểm tra API class detail/grading/assignment cho đúng tenant.

---

## 8. Mời thành viên: link, mã, CSV và phê duyệt

### 8.1. Hiện trạng đã có gì?

- [`POST /api/organizations/invite`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/organizations/invite/route.ts#L104-L149) tạo token, hạn **7 ngày**, link `/personal/accept-invite?token=...`, ràng buộc với **một địa chỉ email**.
- [`POST /api/organizations/accept-invite`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/organizations/accept-invite/route.ts#L70-L118) kiểm email đang đăng nhập trùng email nhận lời mời, sau đó upsert membership và đánh dấu invite accepted.
- Màn hình [`OrgMembersClientView`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/members/OrgMembersClientView.tsx) hiện chủ yếu mời từng email.

**Kết luận:** đã có **link mời cá nhân theo email**, chưa có link/mã tham gia chung, CSV, hàng đợi yêu cầu hoặc tự gia nhập có kiểm soát.

### 8.2. Ba hình thức tham gia nên hỗ trợ

| Hình thức | Đối tượng | Luồng | Quy tắc bảo mật |
|---|---|---|---|
| **Link/mã tổ chức dùng chung** | Học viên/nhân viên số lượng lớn | Org admin tạo link → user login → xem thông tin → xin gia nhập → duyệt → ACTIVE | Link có expiry, revoke, rate limit, max uses, role mặc định MEMBER; không cấp quyền cao |
| **Import CSV/Excel** | Trường/lớp có danh sách sẵn | Tải file → preview/validate → báo trùng/sai → tạo invitation hàng loạt → theo dõi kết quả | Không thêm vượt seats; email được xử lý phù hợp; import async nếu danh sách lớn; audit |
| **Lời mời email riêng** | Giảng viên/admin/người được chỉ định | Org admin mời email → token riêng → người đúng email chấp nhận | Bound email, hạn dùng, one-time token, role không tự leo thang |

### 8.3. Workflow link/mã tham gia

```text
ORG_ADMIN tạo join link (mã ngẫu nhiên, hạn 7 ngày, tối đa N người)
    ↓
MEMBER mở /join/org/<join-code> → login/signup NEXA
    ↓
Xem tên tổ chức, quyền riêng tư, lý do thu thập dữ liệu
    ↓
Bấm "Gửi yêu cầu gia nhập" → membership_request: PENDING
    ↓
ORG_ADMIN xét duyệt → chốt còn ghế và membership duy nhất
    ↓
membership ACTIVE (role MEMBER)
    ↓
User có thể chọn Organization trong Workspace Switcher
```

Có thể tự duyệt một số đối tượng theo email domain **đã được xác minh** hoặc danh sách CSV whitelist; không cho bất kỳ domain người dùng tự khai tự cấp quyền.

### 8.4. Ma trận vai trò tối thiểu

| Hành động | ORG_OWNER | ORG_ADMIN | ASSESSOR | MEMBER | REPORT_VIEWER |
|---|---:|---:|---:|---:|---:|
| Quản lý gói/hợp đồng, chủ sở hữu | Có, theo hợp đồng | Tùy chính sách | Không | Không | Không |
| Mời và duyệt thành viên | Có | Có | Có thể mời vào lớp mình, không cấp role org | Không | Không |
| Đổi vai trò org thông thường | Có | Có, không nâng quá thẩm quyền | Không | Không | Không |
| Chuyển ownership ORG_OWNER | Luồng riêng, xác thực chặt | Không | Không | Không | Không |
| Tạo/phát hành đề tổ chức | Có | Có | Theo quyền được giao | Không | Không |
| Mở/điều phối kỳ đánh giá | Có | Có | Theo phân công | Chỉ tham dự | Chỉ xem được phép |
| Chấm kết quả | Theo chính sách | Theo chính sách | Bài được phân | Không | Không |
| Xem báo cáo tổ chức | Có | Có | Theo lớp/đợt | Cá nhân | Tổng hợp được phép |
| Quản lý AI ngân sách org | Có | Có nếu được ủy quyền | Chỉ xem quota khả dụng | Không | Theo chính sách |

Chỉ là **ma trận sản phẩm đề xuất**, backend phải map về policy thực, không được ẩn nút thay kiểm tra quyền.

### 8.5. Những lỗi/gap liên quan lời mời hiện tại

- `invite` cho phép chọn `ORG_OWNER` trong `orgRole` nếu caller là quản trị viên. **Chuyển chủ sở hữu phải là luồng riêng** với xác thực và audit.
- `accept-invite` upsert membership rồi update invitation trong hai bước riêng, chưa thấy transaction atomic; có thể xảy ra trạng thái nửa vời khi lỗi/race.
- `accept-invite` chưa thấy check organization ACTIVE và hạn mức seats trước khi upsert.
- Trang `/personal/accept-invite` sau thành công chuyển tới `/org/${organization.code.toLowerCase()}`; trong khi app định tuyến bằng `slug`, nên có thể redirect sai ở org có `code != slug`.
- Cần quản lý invitation list, resend/revoke, import status và membership approval queue.

---

## 9. Đặc quyền gói Business

### 9.1. Business phải khác Pro về **khả năng quản trị tập thể**

| Năng lực | Personal Free/Pro | Organization Business (đề xuất) |
|---|---|---|
| Hồ sơ năng lực | Cá nhân, Radar 5 miền | Dashboard tổng hợp toàn đơn vị/lớp/đợt đánh giá |
| Đo khoảng trống | Miền cần cải thiện của từng user | Tỷ lệ thiếu hụt từng miền theo cohort, so trước/sau đào tạo |
| Khóa học | Khóa tuyển chọn có giải thích | Gợi ý chương trình bồi dưỡng theo nhu cầu tập thể, không bán khóa |
| Quản lý thành viên | Không có org membership | Seats, bulk invite, join link, duyệt, suspend, phân quyền |
| Ngân hàng đề | Đề cá nhân | Ngân hàng dùng chung, review, publish và versioning theo org |
| Đợt đánh giá | Cá nhân làm bài hoặc giao lớp nhỏ | Khai báo đợt, chia nhóm, lịch, giám sát tham gia, kết quả |
| Chấm bài | Người sở hữu/lớp được phép | Work queue theo giảng viên, AI chấm nháp, duyệt điểm |
| Báo cáo | Kết quả cá nhân | Bộ lọc theo đơn vị/cohort/kỳ, so sánh, xuất báo cáo |
| AI credits | Thuộc user | Quota tổ chức theo hợp đồng, theo dõi tiêu thụ, phân bổ quyền dùng |
| Quản trị, audit | Cài đặt cá nhân | Role-based access, audit, policy truy cập và hỗ trợ |
| Mua gói | Nâng cấp online, checkout | **Liên hệ NEXA, báo giá/hợp đồng, Admin phê duyệt** |

**Định vị:** NEXA Business là nền tảng *đo lường và phát triển năng lực số theo bằng chứng* của tổ chức. Không phải hệ thống bán khóa học, không cần sao chép LMS/CRM/HRM đầy đủ.

### 9.2. Không nên hứa quá khả năng hiện tại

Các quyền lợi trên mô tả **target product**; chỉ công bố là đã sẵn sàng khi workflows, role guard, schema, RLS và E2E đã đạt. Tránh ghi `Enterprise`, `10.000 credits` hoặc chứng nhận chuẩn trong UI nếu entitlement/hợp đồng thật không xác định.

---

## 10. Thiết kế lại sidebar Organization theo vai trò

### 10.1. Org Manager — sidebar đề xuất

```text
NEXA / Trường FPT Polytechnic
Business · Quản trị viên

ĐIỀU HÀNH
  Tổng quan
  Thành viên & Phân quyền
  Lớp & Nhóm

ĐÁNH GIÁ & PHÁT TRIỂN
  Đề đánh giá
  Đợt đánh giá
  Kết quả & Chấm bài
  Báo cáo năng lực

QUẢN TRỊ
  Gói Business & Hạn mức
  Cài đặt tổ chức
```

### 10.2. Các vai trò khác

- **ASSESSOR/giảng viên:** lớp được phân, đề/đợt được quản lý, bài chờ chấm, báo cáo được phép.
- **MEMBER/học viên:** lớp của tôi, bài được giao, lịch, kết quả của tôi. Có thể dẫn sang Personal để xem hồ sơ *của chính họ* nhưng không xem dashboard quản trị org.
- **REPORT_VIEWER:** chỉ báo cáo tổng hợp đã phân quyền và export nếu hợp đồng cho phép; không xem email, bài thực hành hay minh chứng cá nhân ngoài quyền được cấp.

### 10.3. Quy tắc menu

- Sidebar không cần hiển thị cả chức năng quản trị lẫn học viên cho mọi user.
- Chọn workspace nằm ở **một nơi** dễ hiểu, không vừa topbar vừa footer.
- Không dùng raw role code (`ORG_ADMIN`) cho người dùng cuối.
- Trạng thái không có quyền phải được server trả 403/redirect; sidebar chỉ là UX.
- Không đặt tên model AI vào bất kỳ item, badge hoặc log nào trong Org.
- Các module chỉ xuất hiện khi có workflow và value proposition rõ; không tạo trang chỉ để chứa một KPI.

---

## 11. Workflow lõi: Đợt đánh giá

### 11.1. Tại sao cần Đợt đánh giá?

**Đề đánh giá** = nội dung/phiên bản câu hỏi. **Đợt đánh giá** = ai phải làm đề nào, khi nào, dưới quy định nào, ai giám sát/chấm/công bố. **Lớp** = tập người học tồn tại lâu dài. **Submission** = lần làm bài có bằng chứng. **Live room** = phiên thi PIN đồng bộ, khác lớp và khác đợt.

Không có entity đợt đánh giá, Organization sẽ chỉ là kho đề và lớp rời rạc; không trả lời được bài thi của tháng này, tiến độ, người phụ trách và kết quả tổng hợp.

### 11.2. Luồng tổ chức đánh giá

```text
ORG_ADMIN/ASSESSOR (đúng quyền)
    → Tạo/lấy Đề đánh giá đã được duyệt, cố định version
    → Tạo Đợt đánh giá: tên, kỳ, lớp/cohort, lịch, quy chế
    → Phân công người phụ trách/chấm/duyệt
    → Phát hành và giao bài (Assignment)
    → Học viên nhận trong lớp/Personal "Bài được giao"
    → Làm bài / nộp bài / evidence upload
    → MCQ được chấm bằng code; phần thực hành chờ review
    → Người chấm thủ công hoặc chủ động xin AI gợi ý (HITL)
    → Duyệt kết quả, công bố theo quyền
    → Tổng hợp 5 miền, mức tham gia, đạt chuẩn
    → Phát hiện khoảng trống theo nhóm
    → Gợi ý học liệu/khóa tuyển chọn + kế hoạch đào tạo
    → Đánh giá lại, so sánh tiến bộ
```

### 11.3. Trạng thái đợt đánh giá đề xuất

`DRAFT → READY → SCHEDULED → OPEN → CLOSED → GRADING → FINALIZED → ARCHIVED` (điều chỉnh theo sản phẩm thực). Mỗi transition có actor, permission, thời gian server, rule chống chỉnh đề đã phát hành và audit.

**Dashboard manager** ưu tiên: **đợt đang mở; bài chưa nộp; bài chờ chấm; đợt sắp bắt đầu; tiến bộ 5 miền**. Tránh nhồi các số quota làm nội dung chính.

---

## 12. Review từng trang Organization và hướng UI/UX

### ORG-UI01 — Tổng quan `/org/[slug]`

**Hiện trạng:** member count, assessment count, group count, infrastructure status và card dẫn link. Thiếu mục tiêu của một ngày làm việc.

**Đề xuất layout:**

1. Header ngắn: tên tổ chức, gói, kỳ hiện tại; CTA **Tạo đợt đánh giá** hoặc **Mời thành viên** (theo trạng thái).
2. Hàng KPI thực: thành viên hoạt động, số đợt đang triển khai, tỷ lệ hoàn thành, bài chờ duyệt/chấm.
3. **Công việc cần xử lý:** yêu cầu tham gia, bài chờ chấm, kỳ sắp tới, quota gần cạn.
4. **Đợt đánh giá gần đây:** bảng có trạng thái, người phụ trách, thời gian, nhóm, progress.
5. **Tóm tắt năng lực 5 miền** chỉ khi đủ evidence; một link sang Analytics để xem sâu.

**Empty state (org mới kích hoạt):** 3 bước setup: mời thành viên → tạo lớp/cohort → tạo đợt đánh giá; không dùng dashboard trống rộng với số 0 khắp nơi.

### ORG-UI02 — Thành viên & Phân quyền `/members`

**Hiện trạng:** table thành viên và mời email từng người; ảnh có 2/500 seats.

**Đề xuất:** tab **Thành viên**, **Yêu cầu gia nhập**, **Lời mời**, **Nhập danh sách**; toolbar **Tạo link**, **Tải CSV**, **Mời một người**; filter role/status/lớp/phòng ban; bulk action có preview và confirmation.

**Tránh:** cho `ORG_ADMIN` tự cấp `ORG_OWNER`, gửi mời vượt ghế, show email tất cả nhân viên cho role thường, revoke mà không có lịch sử.

### ORG-UI03 — Đề đánh giá `/assessments`

**Hiện trạng:** trang rỗng và nút Soạn đề mới.

**Đề xuất:** bảng đề với owner, version, số câu, 5 miền bao phủ, trạng thái `DRAFT / IN_REVIEW / APPROVED / PUBLISHED / ARCHIVED`, lần dùng gần nhất; CTA **Soạn đề**, **Tạo đợt đánh giá từ đề này**.

**Luồng:** soạn → preview → validate → duyệt (nếu policy) → publish → tổ chức đợt. Sau khi có người thi, giữ snapshot/version của đề, đáp án, rubric.

### ORG-UI04 — Lớp & Nhóm `/classes`

**Hiện trạng:** có lớp, card tĩnh; click chi tiết đang về `/personal/groups/[id]`.

**Đề xuất:** danh sách theo khoa/phòng ban, giáo viên/manager, số người, bài giao, bài quá hạn; detail **trong Org shell** với tab Thành viên / Bài được giao / Tài liệu / Kết quả / Thảo luận (nếu thực sự làm).

**Ưu tiên:** giữ link và API đúng `organization_id` và permission; không nhân bản bảng lớp chỉ vì đổi route.

### ORG-UI05 — Báo cáo năng lực `/analytics`

**Hiện trạng code:** [`analytics/page.tsx`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/analytics/page.tsx#L26-L55) đếm submissions `.eq('status','COMPLETED')` và `.gte('score',70)`; phần Personal competency hiện dùng submission `SUBMITTED` và `total_score/max_score/percentage`. Radar được render **không truyền data** ([dòng 97–107](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/analytics/page.tsx#L97-L107)).

**Rủi ro:** tỷ lệ/điểm có thể sai hoặc bằng 0 do query không khớp; `Radar 0%` khi chưa có dữ liệu không đáng tin.

**Đề xuất:**

- KPI có mẫu số rõ: *N người được giao; M người hoàn thành; tỷ lệ = M/N; bao nhiêu người có evidence đủ*.
- 5 miền: `score null` khi chưa đo, `score 0` chỉ khi thực sự có bài và kết quả 0; hiển thị coverage/count cho từng miền.
- Lọc theo lớp/cohort, đợt, thời gian, tình trạng chấm chính thức; chỉ dùng kết quả finalized theo chính sách.
- Bảng so sánh trước/sau: cùng loại bài/khung phiên bản và phương pháp tính nhất quán; không coi tiến bộ là do học khóa xong.
- Xuất file chỉ khi có quyền và không lộ dữ liệu cá nhân nhạy cảm của nhóm quá nhỏ.
- **Không hiển thị 21 kỹ năng con**; nếu schema nội bộ còn dùng mapping chi tiết, client vẫn chỉ trình bày 5 miền.

### ORG-UI06 — AI quota `/ai-quota`

**Hiện trạng code:** [`ai-quota/page.tsx`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/ai-quota/page.tsx#L25-L115) đọc tối đa 20 usage events rồi **cộng chúng** để ra chỉ số *Đã sử dụng gần đây*; hiển thị `10,000`, model name, default model khi log thiếu và `~1.2s` hardcoded.

**Đề xuất:** đổi thành **Gói Business & Hạn mức** hoặc khu vực quota trong Settings; tổng/đã dùng/còn lại của kỳ lấy từ ledger và entitlement thật; lịch sử có tác vụ, actor/group, credits, thời gian; không cho thấy model/provider/latency hay cấu hình server.

**Lưu ý kỹ thuật:** 20 events gần nhất không tương đương tổng credits tháng; không suy credits `0 → 1` qua `|| 1`; đọc số âm/dương theo định nghĩa ledger thống nhất; hiện trạng AI có chấm theo yêu cầu, không tự trừ khi chỉ nộp MCQ.

### ORG-UI07 — Settings `/settings`

**Hiện trạng:** hiển thị identity, seats, quota, mô tả RLS/PII policy và Danger Zone; phần lớn thông tin là đọc.

**Đề xuất** chia thành:

- **Thông tin đơn vị:** tên, mã, người liên hệ, logo (khi có), loại đơn vị; quyền chỉnh sửa rõ.
- **Gói Business:** kỳ hạn, hợp đồng, seats, assessments, rooms, AI credits, xem lịch sử và liên hệ nâng hạn mức.
- **Chính sách tham gia:** join link, yêu cầu duyệt, domain xác minh, lời mời, dữ liệu member.
- **Cài đặt bảo mật:** quyền xem báo cáo, chính sách minh chứng và quyền riêng tư bằng ngôn ngữ dễ hiểu; thông tin kỹ thuật sâu ở docs/Admin.
- **Thao tác nhạy cảm:** đình chỉ/chuyển quyền/suspend chỉ tại luồng có xác nhận, audit và quyền phù hợp; không nhầm với xóa toàn bộ dữ liệu.

### ORG-UI08 — Tổng thể hình ảnh và khả năng sử dụng

- Giữ style NEXA `white / slate / sky`, font Inter, icon Lucide, border mảnh, `rounded-md`; không tô loè loẹt hoặc KPI giả.
- Heading có cấp rõ, tránh mở màn hình bằng một card khổng lồ và nhiều khoảng trắng vô dụng.
- Table có filter/search/export/loading/empty/error, pagination khi dữ liệu nhiều.
- Thiết kế ưu tiên 1366px desktop và mobile/responsive cho người dùng thực. Với vai trò giảng viên trên laptop, action chính cần nằm trong tầm nhìn.
- Nhãn bằng tiếng Việt theo nghiệp vụ: *Quản trị viên*, *Gói Business*, *Số ghế*, *Lượt phân tích AI*. Không dùng tên code/SDK/SQL trong UI.
- Thông điệp `0%` và `0 người` phải phân biệt *chưa diễn ra, đang chờ dữ liệu, thực sự không đạt*.

---

## 13. AI: chỉ Platform Admin điều khiển model

### 13.1. Ranh giới sản phẩm

**Platform Admin NEXA** mới có quyền: chọn provider/model, cấu hình credentials, health check kỹ thuật, phân phối traffic, rate limits, giá thành, lỗi, retention policy, kiểm thử phiên bản. Key và thông tin nội bộ không trả ra client.

**Organization Admin** chỉ xem/chỉnh trong phạm vi hợp đồng: credits được cấp/dùng/còn, hạn mức từng nhóm/người (nếu có), lịch sử tiêu thụ, trạng thái AI sẵn sàng hay tạm gián đoạn. Không chọn model và không đọc API key/provider.

**Personal user** chỉ chủ động bấm *Phân tích năng lực* hoặc *Xin gợi ý chấm* theo quyền; thấy hướng dẫn, cảnh báo, credits, kết quả AI và tình trạng review nếu là gợi ý chấm.

### 13.2. On-demand và Human in the Loop

```text
Người dùng nộp bài
  → Code tự chấm MCQ/phần objective
  → Lưu submission và evidence; KHÔNG tự gọi model

Người có quyền chủ động gọi AI
  → Server xác minh user / org / role / quota / evidence / PII
  → AI trả bản nháp nhận xét + bằng chứng + confidence
  → Validator kiểm rubric, quotes, missing criteria
  → Người chấm duyệt/sửa (nếu là chấm điểm chính thức)
  → Lưu final grade / competency evidence / audit
```

- **Cờ XANH / VÀNG / ĐỎ** chỉ là gợi ý mức độ kiểm tra; `confidenceScore` do model tự trả không phải xác suất đã kiểm chuẩn. Backend phải kiểm độc lập trích dẫn, thang điểm và đủ bằng chứng.
- Chỉ tiêu dùng AI khi user có quyền chủ động gọi và tài nguyên đúng scope. Không tính trùng credits khi retry/concurrent; không gắn AI output thành chứng chỉ tự động.
- Không gợi ý khóa học ngoài `course_catalog` được duyệt; chỉ nói miền yếu khi evidence tồn tại.

### 13.3. Những nơi cần dọn metadata model

1. `org/[slug]/ai-quota/page.tsx`: bỏ model column, provider, default model, ping latency.
2. `personal/learning-path/page.tsx`: bỏ `model`, thông báo lỗi chứa tên provider khỏi UI.
3. `/api/ai/status`: chỉ trả public safe fields cho client bình thường; kỹ thuật sâu dùng Admin-only endpoint.
4. Các toast, onboarding, plan copywriting, logs download và report xuất cho khách cần tránh tiết lộ model/provider.

---

## 14. Phát hiện kỹ thuật/bảo mật theo bằng chứng

> Những vấn đề bảo mật dưới đây là **đánh giá source**. Việc migration đã được áp dụng, quyền SQL đang có và khả năng khai thác thực tế cần kiểm tra bằng DB/JWT test. Không được coi mọi phát hiện P0 là đã bị tấn công.

### ORG-F01 — [P0][CONFIRMED_IN_CODE][NEEDS_DEPLOY_TEST] RLS membership cho phép quá rộng

- **Source:** [`23_user_organizations_rls_policies.sql` dòng 19–35](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/database/migrations/23_user_organizations_rls_policies.sql#L19-L35).
- **Policy:** `FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL OR public.is_admin_or_service()) WITH CHECK (...)`. Với JWT của người dùng bất kỳ, `auth.uid() IS NOT NULL` là **true**, không ràng buộc membership/role của đối tượng bị thao tác.
- **SELECT:** policy riêng `FOR SELECT USING (true)` không giới hạn tenant. Migration 11 từng `GRANT ALL ON public.user_organizations TO anon` và `authenticated`.
- **Tác động tiềm năng:** nếu quyền bảng trong môi trường vẫn mở, user thường có thể đọc hoặc thao tác membership ngoài quyền, phá cách ly tenant hoặc nâng vai trò.
- **Cách sửa:** migration mới, forward-only: **drop restrictive/insecure policies, revoke quyền không cần thiết** (đặc biệt `anon` mutation), tách policy `SELECT` chỉ own/authorized manager; `INSERT/UPDATE/DELETE` qua server/service-role action có guard hoặc RPC SECURITY DEFINER được kiểm toán và ràng buộc chặt. Tránh policy tự tham chiếu gây recursion.
- **Done khi:** thử anon, Member Org A, Org A Admin, Owner Org B, Platform Admin. User A không thể đọc/sửa user org B hoặc tự nâng role; invited member không tự tạo membership ACTIVE; các API hợp lệ vẫn chạy.

### ORG-F02 — [P0][CONFIRMED_IN_CODE][NEEDS_RUNTIME_TEST] Admin Organizations API thiếu guard Platform Admin hiện rõ

- **Source:** [`src/app/api/admin/organizations/route.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/admin/organizations/route.ts).
- **Hiện trạng:** GET/POST/PATCH tạo client Supabase và query, nhưng không thấy `auth.getUser()` + check quyền Platform Admin trong handler. POST còn tạo org `ACTIVE` trực tiếp.
- **Lưu ý:** có thể DB RLS chặn write trong một số môi trường; nhưng endpoint nhạy cảm vẫn phải có **authorization độc lập**. GET sẽ nhạy cảm khi policy organizations cho authenticated select rộng và chứa contact data.
- **Cách sửa:** reusable `requirePlatformAdmin` (quyền server trusted), Zod request schema, whitelist transition status, audit; hạn chế PII list theo role; test 401/403 cho mọi HTTP method.
- **Done khi:** user thường gọi thẳng API bị từ chối trước DB; admin hợp lệ có audit và transition hợp lệ.

### ORG-F03 — [P1][CONFIRMED_IN_CODE] Org inactive vẫn qua layout khi membership ACTIVE

- **Source:** [`org/[slug]/layout.tsx` dòng 30–55](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/layout.tsx#L30-L55); `organizations/my/route.ts`.
- **Hiện trạng:** query lấy `is_active` nhưng không dùng để chặn truy cập; org route chỉ check membership. `my` có thể liệt kê inactive org.
- **Cách sửa:** central org context guard: organization exists, status ACTIVE, entitlement Business valid, membership ACTIVE, role/action, resource org; apply tại **API** không chỉ layout.
- **Test:** `PENDING_CONTACT`, `SUSPENDED`, expired contract bị chặn; Active chỉ xem đúng quyền.

### ORG-F04 — [P1][CONFIRMED_IN_CODE] Route tạo đề Org cần authorization theo organizationId

- **Source:** [`src/app/api/assessments/route.ts` dòng 128–203](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/assessments/route.ts#L128-L203).
- **Hiện trạng:** POST nhận `organizationId`, check quota, rồi insert `organization_id`, nhưng không thấy check explicit `ACTIVE membership + ASSESSOR/ORG_ADMIN/OWNER` trên organizationId ở route. RLS có thể bảo vệ một số path, cần kiểm schema policies cuối.
- **Cách sửa:** validate Zod + membership/role/entitlement/resource trước insert; RLS defense-in-depth; quota calculation không thay thế authorization.
- **Test:** Member, outsider, Org B admin không thể tạo đề cho Org A; authorized assessor tạo được và đề có đúng org/visibility.

### ORG-F05 — [P1][CONFIRMED_IN_CODE] Analytics đang dùng trạng thái/cột không nhất quán

- **Source:** [`analytics/page.tsx` dòng 26–55, 97–107](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/analytics/page.tsx#L26-L55); [`personal/competency-profile/route.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/personal/competency-profile/route.ts#L32-L36).
- **Hiện trạng:** Org đếm `COMPLETED`, `.gte('score',70)`, render chart không truyền domain data; Personal dùng `SUBMITTED` và các cột score khác.
- **Cách sửa:** one canonical scoring/aggregation contract cho 5 miền, status final cho KPI, query trong org scope, coverage và sample size; khi rỗng phải để **Chưa có dữ liệu**.
- **Test:** org chưa thi ⇒ không thấy Radar 0%; org có N submits hợp lệ ⇒ KPI và Radar khớp; không lấy dữ liệu org khác.

### ORG-F06 — [P1][CONFIRMED_IN_CODE] AI Quota giả định hạn mức, lộ model, tính không đúng kỳ

- **Source:** [`ai-quota/page.tsx` dòng 25–115](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/ai-quota/page.tsx#L25-L115).
- **Hiện trạng:** hardcode `10,000`, tên provider/model/latency; tính tổng trên **20 sự kiện gần nhất**, chưa phải một kỳ sử dụng; `e.credits_deducted || 1` che mất zero thật.
- **Cách sửa:** query ledger theo billing period, entitlement hợp đồng; `COALESCE`/nullish semantics chuẩn, hiển thị `allocated / used / remaining / period`, không lộ metadata nội bộ.
- **Test:** hơn 20 events và qua kỳ mới ⇒ số đúng; zero vẫn zero; member thường không xem billing nếu không được phép.

### ORG-F07 — [P1][CONFIRMED_IN_CODE] Class Org điều hướng sang Personal

- **Source:** [`org/[slug]/classes/page.tsx` dòng 88–89](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/classes/page.tsx#L88-L89).
- **Hiện trạng:** `href` `/personal/groups/${cls.id}`.
- **Cách sửa:** org class detail đúng context, reuse component khi thích hợp; assignment và grading tiếp tục gắn `organization_id`.
- **Test:** ORG_ADMIN click lớp → vẫn Org shell; MEMBER không thể truy lớp ngoài quyền.

### ORG-F08 — [P1][CONFIRMED_IN_CODE] Invitation owner escalation và acceptance chưa đủ chặt

- **Source:** [`organizations/invite/route.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/organizations/invite/route.ts#L6-L12); [`organizations/accept-invite/route.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/organizations/accept-invite/route.ts#L90-L117); [`personal/accept-invite/page.tsx`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/personal/accept-invite/page.tsx#L68-L72).
- **Hiện trạng:** `orgRole` có `ORG_OWNER`; `accept` upsert member ACTIVE trước khi cập nhật invitation; chưa thấy check seat/org active; redirect dùng `code` thay `slug`.
- **Cách sửa:** role whitelist theo caller, ownership transfer riêng; transaction consume token + seat + membership atomic; return canonical slug từ server; expired/revoked/duplicate invariant.
- **Test:** inviter ORG_ADMIN không tự cấp OWNER; token one-time; concurrent accepts không vượt ghế; inactive org không nhận thành viên; redirect đúng slug.

### ORG-F09 — [P1][DESIGN_GAP] Organization không có lifecycle Business và Đợt đánh giá đúng nghĩa

- **Hiện trạng:** inquiry trực tiếp tạo row organization pending; chưa chứng minh đủ contract/entitlement approval; Org pages hiện thiên CRUD đề/lớp/report.
- **Đề xuất:** workflow nêu tại [mục 6](#6-mô-hình-organization-business--từ-liên-hệ-đến-kích-hoạt) và [mục 11](#11-workflow-lõi-đợt-đánh-giá). Đây là **feature gap**, không được gọi thành bug bảo mật khi chỉ thiếu trang.

### ORG-F10 — [P2][NEEDS_RUNTIME_TEST] Quota personal/org cần tách entitlement và ownership

- **Source:** [`quota-enforcement.service.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/features/billing/services/quota-enforcement.service.ts#L74-L117).
- **Hiện trạng:** một số org path trả mặc định `ENTERPRISE`, max quota bằng `org.quota_assessments || 500` hoặc hằng trong `TIER_LIMITS`; `checkAICreditsQuota` đọc `profiles.credits` của cá nhân, chưa nhận `organizationId`.
- **Vấn đề cần kiểm:** khi người được phân công chạy AI trong Org, credits phải tính vào quota/ledger của **tổ chức** theo hợp đồng chứ không tự trừ ví cá nhân, trừ khi policy đã quy định khác và user xác nhận.
- **Cách sửa:** `OrgEntitlement` + periodic ledger dùng chung server, idempotent debit, reservation/release khi provider lỗi, quyền người gọi phù hợp.

---

## 15. Backlog ưu tiên cho coding agent

### 15.1. Organization

| ID | Mức | Hạng mục | Nguồn chính | Acceptance / đầu ra |
|---|---|---|---|---|
| ORG-01 | **P0** | Sửa RLS `user_organizations` và quyền bảng | Migration 23 và migration 11 | JWT đa org không thể đọc/sửa ngoài quyền |
| ORG-02 | **P0** | Guard `/api/admin/organizations` | API Admin organizations | Chỉ Platform Admin được tạo, duyệt, suspend, chỉnh hợp đồng |
| ORG-03 | **P0/P1** | Chặn org chưa kích hoạt/hết hạn/tạm ngưng | Org layout, org context, all org APIs | Không vào workspace hoặc mutate khi inactive |
| ORG-04 | **P1** | Authorization tạo đề/bộ câu hỏi trong Org | Assessments API, RLS | Chỉ actor được ủy quyền đúng org tạo/publish |
| ORG-05 | **P1** | Inquiry → review → contract → activation → entitlement | Inquiry API, Admin org API, schema | Không có Business ACTIVE trước phê duyệt |
| ORG-06 | **P1** | Link/mã join tổ chức, approval queue | New join routes, membership schema | User xin gia nhập an toàn, không vượt ghế |
| ORG-07 | **P1** | CSV/Excel bulk invites | Org members, invitation API | Preview, validate, dedupe, send, retry/revoke |
| ORG-08 | **P1** | Harden invite/accept ownership/atomicity | Invite/accept API | OWNER không tự cấp; one-time; đúng slug |
| ORG-09 | **P1** | Org class detail/assignment đúng tenant | Org classes, classes API | Không bị rơi sang Personal; org scoped |
| ORG-10 | **P1** | Đợt đánh giá + grading/assignment workflow | Assessments/classes/submission domain | Tạo → giao → nộp → chấm → duyệt → báo cáo |
| ORG-11 | **P1** | Analytics 5 miền đúng dữ liệu | Analytics aggregation, radar | Không vẽ zero khi chưa đo, tách sample coverage |
| ORG-12 | **P1** | Entitlement/quota AI org theo hợp đồng | Quota service, AI usage ledger | Số dư và chi tiêu đúng kỳ, không lộ model |
| ORG-13 | **P2** | Dashboard theo hành động và trạng thái | Org home | Setup wizard / work queue / đợt hiện hành |
| ORG-14 | **P2** | Sidebar role-aware và workspace switcher | OrgSidebar, WorkspaceSwitcher | Không lặp switch Personal; role Việt hóa |
| ORG-15 | **P2** | Settings Business và self-service chính sách tham gia | Org settings | Thông tin hợp đồng/ghế/quyền đúng quyền |

### 15.2. Personal (tiếp nối bản review đã triển khai)

| ID | Mức | Hạng mục | Acceptance |
|---|---|---|---|
| PERS-14 | **P0** | Dừng fallback QR ngân hàng hardcoded | payOS fail ⇒ không xuất QR/thu tiền sai |
| PERS-15 | **P1** | Bài baseline thật | Lần đầu có thể take/submit/result, không fake ID |
| PERS-16 | **P1** | Ẩn model/provider và AI status kỹ thuật | Client Personal chỉ nhận thông tin safe |
| PERS-17 | **P1/P2** | Course catalog review lifecycle | DB/catalog approved là source of truth |
| PERS-18 | **P1** | Lộ trình có progress lưu bền vững | Giữ được sau F5 và có đánh giá lại |
| PERS-19 | **P2** | Dashboard 4 states theo ngữ cảnh | Learner mới/đã có profile/assigned/creator đúng CTA |
| PERS-20 | **P1** | Kiểm payment/result với sandbox và RLS | owner only, exactly-once, status canonical |

**Không làm cùng lúc tất cả trong một PR.** Chia theo dependency, tránh sửa broad auth/RLS, billing, org UI và Personal AI trong một nhánh khổng lồ.

---

## 16. Ma trận kiểm thử/tiêu chí nghiệm thu

### 16.1. RLS, quyền và tenant

| Test | Kịch bản | Expected |
|---|---|---|
| SEC-01 | Anonymous SELECT/INSERT/UPDATE `user_organizations` | Không lộ danh sách hoặc mutate membership |
| SEC-02 | MEMBER Org A đọc/sửa membership Org B | Deny |
| SEC-03 | MEMBER nâng vai trò của chính mình | Deny |
| SEC-04 | ORG_ADMIN mời `ORG_OWNER` hoặc thay chủ sở hữu | Deny, yêu cầu transfer workflow riêng |
| SEC-05 | User thường GET/POST/PATCH Admin Organizations API | 401/403 và không có side-effect |
| SEC-06 | Org `PENDING_CONTACT` hoặc `SUSPENDED` mở workspace/API | Deny theo chính sách, UI giải thích |
| SEC-07 | Member có Personal Free tạo đề cho Org đang ACTIVE | Chỉ được tạo trong Org khi role/entitlement org cho phép; quota Personal không áp vào Org |
| SEC-08 | User thuộc Org A cố lấy/report Org B bằng ID | Deny hoặc rỗng, không lộ dữ liệu |

### 16.2. Mời thành viên và kích hoạt Business

| Test | Kịch bản | Expected |
|---|---|---|
| BUS-01 | User gửi form liên hệ | Tạo inquiry PENDING, không có org ACTIVE |
| BUS-02 | Admin từ chối inquiry | Không tạo entitlement/org ACTIVE |
| BUS-03 | Admin phê duyệt và kích hoạt | Có audit + contract + owner/manager + đúng seats/quotas |
| BUS-04 | Bulk import 500 emails có trùng/sai | Preview, dedupe, không vượt seats, có báo cáo lỗi |
| BUS-05 | Người dùng mở join link hợp lệ | Xin gia nhập, role mặc định MEMBER, chờ duyệt |
| BUS-06 | Join link expired/revoked/max uses | Không tạo membership |
| BUS-07 | Hai người accept đồng thời khi còn một seat | Tối đa một người ACTIVE |
| BUS-08 | Email invite bị người khác dùng | Deny |
| BUS-09 | Accept invite lần thứ hai | Idempotent, không tạo duplicate/role escalation |
| BUS-10 | Accept thành công | Redirect về `/org/<slug>` đúng và hiển thị workspace |

### 16.3. Đợt đánh giá và báo cáo 5 miền

| Test | Kịch bản | Expected |
|---|---|---|
| ASM-ORG-01 | Org tạo đề/đợt cho lớp | Đề và đợt có organization_id chuẩn, role hợp lệ |
| ASM-ORG-02 | Thành viên được giao bài | Thấy đúng assignment trên Personal inbox/lớp |
| ASM-ORG-03 | Submit 2 lần/refresh | Một attempt/ledger theo policy, không trùng XP/credits |
| ASM-ORG-04 | Người chấm lớp A truy bài lớp B | Deny nếu không có quyền |
| ASM-ORG-05 | AI chấm gợi ý | AI draft, chưa phải final grade; chỉ gọi on-demand |
| ASM-ORG-06 | Báo cáo chưa ai thi | `N/A / Chưa đủ dữ liệu`, không Radar 0% giả |
| ASM-ORG-07 | Có bài finalize thuộc 3/5 miền | Chỉ 3 miền có điểm, 2 miền còn `null` |
| ASM-ORG-08 | Trộn nhiều lần thi và khung version khác nhau | Có quy tắc snapshot/cohort/aggregation rõ, không cộng tùy ý |
| ASM-ORG-09 | User Org A xem xuất báo cáo Org B | Deny |

### 16.4. AI, thanh toán và Personal

| Test | Kịch bản | Expected |
|---|---|---|
| AI-ORG-01 | Org có 35 AI events một kỳ | Tổng tiêu thụ là toàn bộ kỳ, không chỉ 20 gần nhất |
| AI-ORG-02 | 0 credits deducted trong log | Hiển thị 0, không ép thành 1 |
| AI-ORG-03 | Personal/Org gọi AI status | Không trả tên provider/model, key, raw internal errors |
| AI-ORG-04 | Org dùng hết credits | Server deny hoặc xin nâng hạn mức; không vượt quota |
| AI-ORG-05 | Concurrent retry AI | Không charge trùng nếu cùng operation id |
| PAY-01 | payOS không cấu hình, service lỗi | Không tạo fallback QR với tài khoản mẫu |
| PAY-02 | Webhook giả/signature sai/số tiền thiếu | Không kích hoạt gói |
| PAY-03 | Webhook hợp lệ lặp | Gói/credits chỉ cấp một lần |
| PAY-04 | Khách A đọc checkout order B | Deny |
| PERS-01 | Personal chưa có baseline trong DB | Không hiển thị bài ID giả; thông báo phù hợp |
| PERS-02 | Hoàn thành baseline 5 miền | Radar có evidence, miền chưa đánh giá là null |
| PERS-03 | Course bị `ARCHIVED` | Không đề xuất/hiển thị, kể cả DB rỗng |
| PERS-04 | User hoàn tất một khóa | Không tự đổi competency score/chứng chỉ nếu không đánh giá lại |

### 16.5. Quality gates

- [ ] Typecheck/test/build/lint trên SHA/PR cần merge (ghi rõ lệnh và log thực tế).
- [ ] Migration forward-only áp dụng được trên staging; kiểm các `GRANT`, `pg_policies` và RLS bằng JWT user khác nhau.
- [ ] E2E: inquiry + approval + org activation; join link; org class/assessment; submission; human grading; report.
- [ ] Payment payOS sandbox: webhook, cancel, timeout, duplicate, order owner, status after F5.
- [ ] Tenant data không lộ qua route trực tiếp, API route, export hoặc client cache.
- [ ] Mobile/responsive, tab keyboard, aria labels, empty/error/loading/suspended UX.
- [ ] Không kiểm thử bằng secret/key production; không sửa dữ liệu khách thật.

---

## 17. Thứ tự triển khai đề xuất

### Phase 0 — Security gate trước khi cho khách sử dụng Business

Sửa **ORG-01/02/03/04**, kiểm tra GRANT/RLS các bảng liên quan và role escalation. Song song sửa **PERS-14** để thanh toán production fail closed. Làm migration mới và test regression với các identity khác nhau.

**Deliverable:** quyền an toàn có test, không dùng giao diện để chứng minh authorization.

### Phase 1 — Business onboarding đúng nghĩa

Định nghĩa `business_inquiries`/approval, contract/entitlements, active/suspended states, người quản trị đầu tiên. Sau đó triển khai link/mã tham gia, CSV, approval queue, an toàn seats và ownership transfer.

**Deliverable:** trường học/doanh nghiệp được NEXA duyệt rồi mới vào workspace; thêm được nhiều người mà không nhập từng email.

### Phase 2 — Organization operations

Chốt domain `Class`, `Assessment`, `Assessment Version`, `Assessment Campaign/Đợt`, `Assignment`, `Submission`, `Grade`, `Finalized Result`. Gắn route Org class đúng context, tạo đợt, điều phối/chấm/duyệt.

**Deliverable:** chạy được end-to-end một đợt đánh giá với người thật, quyền thật, dữ liệu sau refresh còn nguyên.

### Phase 3 — Report 5 miền + learning intervention

Thiết lập aggregation nhất quán `null vs 0`, cohort/period/snapshot, báo cáo trước-sau. Tích hợp khuyến nghị khóa tuyển chọn theo khoảng trống 5 miền, không marketplace.

**Deliverable:** báo cáo sử dụng được cho quyết định đào tạo, không chỉ biểu đồ đẹp.

### Phase 4 — AI, quota và UX hoàn thiện

Ẩn metadata provider/model khỏi client; quota real ledger theo hợp đồng; dashboard ngữ cảnh và menu theo role; hoàn thiện Personal baseline/lộ trình/checkout E2E.

**Deliverable:** Business có quyền lợi khác Pro rõ ràng và giao diện vận hành dễ hiểu.

---

## 18. Giới hạn review và kết luận

### Đã thực hiện

- Đọc skill review NEXA và quy ước `AGENTS.md` tại snapshot.
- Xác định `main` HEAD `d7934984...`, diff so với `ab1a99ba...` và GitHub CI của HEAD (thành công).
- Đối chiếu phần Personal đã triển khai với sidebar, competency, profile-stats, assessments API, courses, lộ trình, payOS pages và payment service.
- Đọc Org layout/sidebar/switcher, trang home/members/assessments/classes/analytics/AI quota/settings cùng invitation/inquiry/Admin APIs, service quota và migrations.
- Xem các ảnh giao diện localhost người dùng cung cấp; phân biệt nhận xét UX với hành vi code.

### Chưa thực hiện

- Chưa chạy ứng dụng/DB Supabase thực tế, test migration trên môi trường triển khai, quét quyền `GRANT` cuối bằng SQL, dùng JWT đa tenant để xác minh exploit.
- Chưa thanh toán thật hoặc thử payOS sandbox end-to-end.
- Chưa kiểm toàn bộ các API/bảng RLS ngoài phạm vi Personal + Org; chưa review UI/UX Admin như phân hệ độc lập.
- Chưa sửa code, push nhánh hay tạo pull request.

### Kết luận

**Personal:** không cần làm lại từ đầu. Giữ Sidebar, cấu trúc 5 miền, course catalog và checkout theo trang riêng; ưu tiên **thanh toán an toàn, bài baseline thật, AI không lộ model, lộ trình có tiến độ và đánh giá lại**.

**Organization:** cần **tái thiết kế logic sản phẩm Business** chứ không chỉ sắp xếp các card. Business phải qua liên hệ và Platform Admin phê duyệt; Organization quản trị người/lớp/đợt/đề/chấm/báo cáo 5 miền theo đúng tenant; thành viên vào bằng link/mã, CSV hoặc lời mời; AI do Platform Admin điều khiển và quota được ghi nhận thật.

> **Nguyên tắc không thay đổi:** đánh giá 5 miền năng lực, đề xuất học liệu/khóa học dựa trên khoảng trống có bằng chứng, đo lại tiến bộ; **NEXA không phải nền tảng bán khóa học**.

---

## Tham chiếu chính

- [Repo NEXA AI](https://github.com/minhhuyzzz/nexa_AI)
- [Commit được review](https://github.com/minhhuyzzz/nexa_AI/commit/d7934984a4210fc6dde54a47888e7b920b88fa76)
- [CI của commit](https://github.com/minhhuyzzz/nexa_AI/actions/runs/41010897036)
- [`AGENTS.md`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/AGENTS.md)
- [`NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md)
- [`23_user_organizations_rls_policies.sql`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/database/migrations/23_user_organizations_rls_policies.sql)
- [`src/app/api/admin/organizations/route.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/admin/organizations/route.ts)
- [`src/app/api/organizations/invite/route.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/api/organizations/invite/route.ts)
- [`src/app/(dashboard)/org/[slug]/analytics/page.tsx`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/app/%28dashboard%29/org/%5Bslug%5D/analytics/page.tsx)
- [`src/features/billing/services/payment-verifier.service.ts`](https://github.com/minhhuyzzz/nexa_AI/blob/d7934984a4210fc6dde54a47888e7b920b88fa76/src/features/billing/services/payment-verifier.service.ts)
