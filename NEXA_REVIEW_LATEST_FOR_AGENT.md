# NEXA AI — Review ngắn gọn cho Owner & Coding Agent

> **Nguồn:** [`minhhuyzzz/nexa_AI`](https://github.com/minhhuyzzz/nexa_AI) · nhánh `main` · commit **`7c8fbde`** (29/10/2026).  
> **Phạm vi:** đọc code/route/migration mới nhất trên GitHub; **chưa chạy thử ứng dụng hay kiểm chứng Supabase production**. GitHub Actions cho commit này báo **success** — không đồng nghĩa mọi use case đã hoạt động đúng.

## 1. Kết luận trong 30 giây

NEXA đã chuyển đúng hướng sang **Personal / Organization / Admin**, với nhiều màn hình và API thật. Tuy nhiên, luồng **Lớp học → Giao bài → Nộp bài → Chấm bài** vẫn chưa khớp nhau; một số màn hình chỉ *trông như đã hoàn thành*. Commit mới đã sửa nhiều lỗi bảo mật trước đó, nhưng **billing vẫn cần kiểm tra và khóa thêm trước khi nhận tiền thật**.

| Khu vực | Đánh giá hiện tại | Việc cần làm |
|---|---|---|
| **Personal — Assessment/Radar/AI** | Có luồng và UI tương đối rõ | Gộp UI kết quả bị trùng, chuẩn hóa attempt/result |
| **Personal — Creator/Grading/Live** | Có Studio, bàn chấm, phòng thi | Kiểm tra quyền sở hữu đề/bài làm và trạng thái chấm |
| **Personal — Groups/Assignments** | **Chưa khép kín** | Thay room bằng class; thay nộp bài giả bằng lưu thật |
| **Organization** | Có 7 trang và kiểm tra membership tại layout | Tạo/sửa tài nguyên ngay trong org, không đá sang Personal |
| **Admin** | Có users, orgs, content, plans, transactions, AI | Hoàn thiện chính sách quyền, audit và quy trình vận hành |
| **CI** | **Pass** trên commit được review | Thêm test tích hợp các luồng quan trọng |

## 2. Những gì commit mới **đã sửa** (đừng báo lỗi cũ như chưa sửa)

- `/api/admin/users`: GET/PATCH hiện kiểm tra Superadmin.
- `/api/organizations/accept-invite`: đã so khớp email đăng nhập với email được mời.
- Demo bypass trong middleware: mặc định bị khóa ở production, trừ khi bật cờ `ENABLE_DEMO_MODE=true`.
- Evidence upload: lỗi lưu storage thật không còn trả thành công giả; migration 20 chuyển bucket sang private và chỉnh quota lên 25 MB.
- Payment webhook: đã buộc có secret/header; bổ sung kiểm tra số tiền **nếu payload có cung cấp**.
- Có test `security-regression.test.ts`; CI mới nhất đã pass.

## 3. Việc agent cần sửa — theo thứ tự

### P0 — Thanh toán: chưa đủ an toàn để mở production

**P0-01 — RPC hoàn tất thanh toán còn điểm yếu về quyền.**  
**Ở đâu:** `src/database/migrations/20_security_and_billing_hardening.sql` (đoạn 5–27).  
**Vì sao:** Migration thu hồi `EXECUTE` từ `authenticated` và `anon` nhưng **chưa thu hồi từ `PUBLIC`**. Ngoài ra, `CURRENT_USER = 'postgres'` trong hàm `SECURITY DEFINER` có thể đúng vì đó là *chủ hàm*, không phải người đang gọi — không nên dùng làm lối đi tắt qua kiểm tra quyền.  
**Agent làm:** tạo migration kế tiếp; `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`; chỉ `GRANT` cho `service_role`; bỏ nhánh tin cậy `CURRENT_USER` và kiểm quyền bằng ngữ cảnh caller phù hợp. **Test trực tiếp bằng Supabase anon/authenticated/service_role**; không chỉ test mock.

**P0-02 — Webhook vẫn có thể xử lý thanh toán khi không có số tiền.**  
**Ở đâu:** `src/app/api/webhooks/payment/route.ts` (60–79), `src/features/billing/services/payment-verifier.service.ts` (97–145).  
**Vì sao:** `incomingAmount` có thể `undefined`; service chỉ kiểm khi số tiền tồn tại và lớn hơn 0, sau đó vẫn gọi RPC.  
**Agent làm:** định nghĩa đúng schema webhook của provider đang dùng; bắt buộc và xác thực **amount, currency, trạng thái thanh toán, mã giao dịch provider duy nhất, reference**, chống replay/idempotency. Nếu thiếu/sai dữ liệu thì **không cấp gói**. Không cho client giả lập webhook trên production (`personal/billing/page.tsx`).

### P1 — Use case Dashboard đang sai hoặc chưa làm thật

**P1-01 — “Nhóm học tập” dùng nhầm dữ liệu phòng thi.**  
**Ở đâu:** `src/app/(dashboard)/personal/groups/page.tsx` (78–99, 145, 316); `personal/groups/[groupId]/page.tsx`; `api/classes/[id]/route.ts`.  
**Vì sao:** danh sách lấy `exam_rooms.id`, nhưng trang chi tiết tìm `evaluator_classes.id`. **ID khác domain, khó mở đúng lớp.**  
**Agent làm:** danh sách nhóm lấy `evaluator_classes` qua `class_members`; join lớp bằng class code/API riêng. Chỉ dùng `/api/rooms/join` cho **phòng thi Live**.

**P1-02 — “Nộp bài” đang là mô phỏng UI.**  
**Ở đâu:** `src/app/(dashboard)/personal/submissions/page.tsx` (74–119, 186–217).  
**Vì sao:** dùng `room_participants` làm assignment; `handleTurnIn()` chỉ `setTimeout` rồi cập nhật React state, **không tải file/lưu submission**.  
**Agent làm:** lấy `class_assignments` thật; tạo/lưu assignment submission + evidence + `submitted_at`; refresh vẫn còn; deadline và quyền người nộp được kiểm ở server.

**P1-03 — Organization bị mất context khi thao tác.**  
**Ở đâu:** `org/[slug]/assessments/page.tsx` (link `/personal/authoring`), `org/[slug]/classes/page.tsx` (link `/personal/groups`).  
**Vì sao:** ở workspace tổ chức nhưng nút Tạo/Vào lại chuyển sang workspace cá nhân; tài nguyên mới có thể gắn sai owner/org.  
**Agent làm:** route tạo/chỉnh đề/lớp thuộc `/org/[slug]/*`; lưu `organization_id`, xác minh membership/role ở API, không tin cookie workspace làm bằng chứng quyền.

**P1-04 — Vai trò lời mời không khớp constraint SQL.**  
**Ở đâu:** `api/organizations/invite/route.ts` (enum có `ORG_OWNER`, `ASSESSOR`, `REPORT_VIEWER`); migration `17_b2b_invitations_and_plans_schema.sql` (constraint `organization_invitations.org_role` chỉ cho `ORG_ADMIN`, `EVALUATOR`, `MEMBER`). Migration 19 chỉ mở rộng constraint của **`user_organizations`**, không phải bảng invitations.  
**Agent làm:** tạo migration sửa constraint `organization_invitations`; quyết định ai có quyền mời `ORG_OWNER`; test từng role tạo lời mời → chấp nhận → có membership đúng.

**P1-05 — Evidence private nhưng cách truy cập và scope chưa nhất quán.**  
**Ở đâu:** migration 20 (106–118), `api/evidence/upload/route.ts` (138–145).  
**Vì sao:** SELECT cho mọi `EVALUATOR` theo profile role có nguy cơ xem file ngoài lớp/tổ chức; tạo signed URL thất bại thì fallback về `getPublicUrl()` dù bucket đã private.  
**Agent làm:** kiểm quyền **submission/class/org cụ thể**; không cấp URL nếu ký thất bại; tạo signed URL lúc người có quyền mở file; test người A không xem file người B.

**P1-06 — AI grading kiểm quyền chưa đủ chi tiết.**  
**Ở đâu:** `src/app/api/ai/grade-submission/route.ts` (60–76).  
**Vì sao:** chỉ đối chiếu `submission.user_id` khi role là `LEARNER`; quyền của creator/assessor trên submission khác chưa được xác minh theo class/org ở đây.  
**Agent làm:** áp dụng kiểm tra quyền theo tài nguyên: chủ bài, người được phân công chấm, người quản lý lớp/org; test cross-user/cross-org bị từ chối.

### P2 — UX / route cleanup (sau khi P0/P1 ổn)

- `personal/billing/page.tsx` gọi `/api/profile` nhưng tree hiện có `/api/personal/profile`: **đổi route và test hiển thị gói hiện tại**.
- `personal/take/[id]` tự hiện kết quả, đồng thời đã có `personal/assessments/[id]/result`: **chọn một Result Page chính**, theo `submissionId` để hỗ trợ nhiều lần thi.
- `personal/competency/analysis` và `personal/learning-path`: **Analysis = vì sao điểm yếu**, **Learning Path = học gì, tiến độ ra sao**; tránh lặp radar/báo cáo dài.
- `personal/settings/page.tsx`: nút Lưu chỉ thay state UI; **lưu DB thật hoặc không báo đã lưu**.
- `personal/exams` là route cũ trùng `personal/authoring`; `admin/evaluators` redirect sang users: **giữ redirect tạm, dọn sau**.
- `personal/authoring` / `personal/live-room` còn gọi `/api/admin/assessments`: kiểm lại scope API để creator thường có thể thao tác **đúng đề của mình**, không mở quyền Admin tràn lan.
- `src/lib/supabase/admin.ts` dùng anon key làm fallback khi thiếu service role: **fail closed** đối với tác vụ thực sự cần admin client.

## 4. Use case chuẩn để agent không sửa sai khái niệm

```text
CLASS (lớp lâu dài) ── MEMBER / POSTS / FILES
       │
       └── ASSIGNMENT (đề được giao + hạn nộp)
                └── SUBMISSION (bài nộp của 1 người)
                         └── GRADING (chấm + phản hồi)

LIVE ROOM (phiên thi tạm thời + PIN)
       └── PARTICIPANT ── ASSESSMENT / SUBMISSION

ASSESSMENT (nội dung đề) != LIVE ROOM (phiên tổ chức thi)
CLASS != LIVE ROOM; ASSIGNMENT != ROOM PARTICIPANT
PERSONAL resource != ORGANIZATION resource
AI suggestion != FINAL human-reviewed grade
```

## 5. Checklist bàn giao cho Coding Agent

- [ ] **Trước khi sửa:** đọc lại HEAD, migrations 17–20, policy RLS/API liên quan; không phá API cũ khi chưa có redirect/migration.
- [ ] **P0:** không thể gọi fulfillment RPC từ authenticated/anon; webhook thiếu amount/trạng thái/provider transaction bị từ chối; có test thực quyền SQL.
- [ ] **P1:** Group List → Group Detail đúng class ID; join class ≠ join live room.
- [ ] **P1:** Giao bài → người học thấy đúng assignment → nộp file → refresh vẫn còn → người chấm thấy bài.
- [ ] **P1:** Tạo đề/lớp trong Org luôn giữ đúng `organization_id`; không đọc/sửa chéo tenant.
- [ ] **P1:** Mọi invitation role hợp lệ với DB; chỉ email được mời chấp nhận được.
- [ ] **P1:** Evidence và AI grading thực thi resource-level permission; test người lạ không truy cập được.
- [ ] **Cuối cùng:** chạy `npm run typecheck`, `npm test`, `npm run build` và CI; nêu rõ test nào đã chạy/chưa chạy, tạo PR thay vì push thẳng `main`.

**Nguyên tắc làm việc:** Ưu tiên **ít sửa nhưng khép kín use case thật**. Không thêm dashboard mới chỉ để che một luồng backend còn giả. Không coi CI xanh là xác nhận đã an toàn ở production.
