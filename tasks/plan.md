# Kế Hoạch Triển Khai: Chuẩn Hóa Bàn Chấm Bài & Cơ Chế Chấm Điểm Đa Không Gian (Org & Personal)

> **Căn cứ yêu cầu người dùng (04/11/2026):**
> 1. **Organization — Bàn chấm bài:**
>    - Bổ sung bộ lọc theo ngữ cảnh: Lớp/Nhóm, Đợt đánh giá, Trạng thái chấm.
>    - Từ trang Lớp bấm "Chấm bài" → `/org/[slug]/grading?classId=...`.
>    - Từ trang Đợt đánh giá bấm "Chấm bài" → `/org/[slug]/grading?campaignId=...`.
>    - Bàn chấm bài chung vẫn xem được tất cả bài thuộc tổ chức.
>    - Chỉ đưa vào hàng chờ những bài có phần tự luận/thực hành cần chấm (MCQ tự động chấm 100%, không cần duyệt thủ công).
>    - Bảo đảm bộ lọc và API đều kiểm tra phạm vi tổ chức, không chỉ lọc ở frontend.
> 2. **Personal — Chấm bài cho nhóm cá nhân:**
>    - Không thêm "Bàn chấm bài" cố định cho mọi Personal User (Learner bình thường không thấy).
>    - Người tạo/quản lý nhóm cá nhân có quyền chấm bài của nhóm mình.
>    - Trong trang chi tiết nhóm, cung cấp nút "Chấm bài" khi có quyền → `/personal/grading?groupId=...`.
>    - Giữ trang `/personal/grading` để xử lý nhiều bài cần chấm.
>    - Chỉ hiển thị mục "Bài cần chấm" trong Sidebar khi tài khoản thực sự có quyền chấm bài cho ít nhất một nhóm cá nhân.
>    - Không hiển thị bài từ tổ chức trong hàng chờ chấm Personal (cách ly tuyệt đối).
> 3. **Thống nhất cơ chế chấm:**
>    - MCQ tự chấm ngay khi nộp.
>    - Tự luận/Thực hành: chấm theo từng câu và rubric.
>    - AI chỉ đề xuất, không tự phê duyệt điểm chính thức (Human-in-the-loop).
>    - Đề hỗn hợp giữ nguyên điểm MCQ đã chấm; người chấm chỉ xử lý phần mở (không ghi đè điểm MCQ).
>    - Chỉ có điểm tổng kết /100 khi hoàn tất các phần cần chấm.
>    - Tách trạng thái hoàn tất chấm (`EVALUATED`) và công bố kết quả (`results_published`).
> 4. **Yêu cầu kỹ thuật:**
>    - Tái sử dụng cùng Grading Engine, rubric và logic tính điểm cho Personal/Organization.
>    - Hai dashboard có giao diện và phạm vi quyền riêng.
>    - Kiểm tra quyền sở hữu nhóm và quyền Admin tổ chức tại server-side.
>    - Kiểm thử đầy đủ luồng chấm từ lớp, đợt đánh giá và nhóm cá nhân.

---

## Danh Sách Nhiệm Vụ Triển Khai (Work Breakdown)

### Phase 1: Chuẩn hóa Grading Engine & Bảo toàn Điểm Đề Hỗn Hợp (Hybrid Scoring)
- [ ] **Task 1.1:** Chuẩn hóa logic tính điểm trong `src/app/api/organizations/[orgId]/grading/route.ts`:
  - Chấm theo từng câu mở (item-level) với rubric criteria.
  - Tự động cộng dồn: Điểm trắc nghiệm (MCQ auto-graded) + Điểm tự luận/thực hành vừa chấm = `total_score` tổng kết.
  - Không ghi đè trực tiếp điểm trắc nghiệm thành 0.
- [ ] **Task 1.2:** Lọc hàng đợi Bàn chấm bài thông minh:
  - Chỉ đưa vào hàng đợi những bài nộp có ít nhất 1 câu hỏi cần chấm (Thực hành/Tự luận).
  - Đề 100% trắc nghiệm tự động hoàn tất và không làm nghẽn hàng đợi chấm.

### Phase 2: Organization — Bàn Chấm Bài Theo Ngữ Cảnh (`/org/[slug]/grading`)
- [ ] **Task 2.1:** Cập nhật Server Loader `src/app/(dashboard)/org/[slug]/grading/page.tsx`:
  - Tiếp nhận query params: `classId`, `campaignId`, `status`.
  - Truy vấn danh sách `orgClasses` và `orgCampaigns` để truyền cho dropdown bộ lọc.
  - Áp dụng bộ lọc `classId` / `campaignId` ngay tại server query.
- [ ] **Task 2.2:** Cập nhật giao diện `src/components/dashboard/org/grading/OrgGradingClientView.tsx`:
  - Thêm thanh Dropdown bộ lọc 3 chiều: Lớp/Nhóm, Đợt khảo thí, Trạng thái chấm.
  - Tự động đồng bộ với URL params khi người dùng lọc.
- [ ] **Task 2.3:** Gắn liên kết theo ngữ cảnh từ các trang nguồn:
  - Trang Lớp học `OrgClassDetailView.tsx`: nút "Chấm bài" dẫn tới `/org/${slug}/grading?classId=${classData.id}`.
  - Trang Đợt khảo thí `OrgCampaignsClientView.tsx`: nút "Chấm bài" dẫn tới `/org/${slug}/grading?campaignId=${campaign.id}`.

### Phase 3: Personal — Chấm Bài Cho Nhóm Cá Nhân & Sidebar Động
- [ ] **Task 3.1:** Phân quyền hiển thị Sidebar cá nhân `PersonalSidebar.tsx`:
  - Kiểm tra động: chỉ hiển thị mục "Bài cần chấm" (`/personal/grading`) khi người dùng sở hữu hoặc quản trị ít nhất 1 nhóm cá nhân.
  - Ẩn hoàn toàn với học viên thông thường.
- [ ] **Task 3.2:** Nút "Chấm bài" trong chi tiết Nhóm cá nhân:
  - Tại Header `ClassHeader.tsx` và tab `ClassAssignmentsTab.tsx`: khi `isOwner === true`, cung cấp nút "Chấm bài" trỏ đến `/personal/grading?groupId=${groupId}`.
- [ ] **Task 3.3:** Cách ly dữ liệu Personal tại `src/app/api/evaluator/submissions/route.ts`:
  - Đảm bảo chỉ lấy bài nộp của các lớp cá nhân (`organization_id IS NULL`), không lẫn bài tổ chức.

### Phase 4: Kiểm Thử Tích Hợp & Đảm Bảo An Toàn
- [ ] **Task 4.1:** Viết bộ unit/integration tests cho luồng chấm điểm đề hỗn hợp và bộ lọc Bàn chấm bài.
- [ ] **Task 4.2:** Chạy typecheck `npx tsc --noEmit` và test suite `npx vitest run`.
- [ ] **Task 4.3:** Cập nhật Knowledge Graph `graphify update .`.
