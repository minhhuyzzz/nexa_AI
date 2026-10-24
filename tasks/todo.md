# DANH SÁCH NHIỆM VỤ THI HÀNH (TODO LIST - NEXA AI)
> **Kế hoạch chi tiết:** Xem tại [tasks/plan.md](file:///c:/nexa/tasks/plan.md)  
> **Tài liệu tham chiếu:** [NEXA_AI_REVIEW_TONG_THE.md](file:///c:/nexa/NEXA_AI_REVIEW_TONG_THE.md)

---

## Phase 0: Bảo Mật, RLS & Tính Toàn Vẹn Dữ Liệu (P0 - Khẩn cấp)
- [x] **Task 0.1**: Khóa RLS và bảo vệ đáp án đúng (`item_options.is_correct`) không cho client query trực tiếp
- [x] **Task 0.2**: Khóa quyền ghi trực tiếp vào các trường nhạy cảm trong `profiles` (`points`, `credits`, `plan_tier`)
- [x] **Task 0.3**: Sửa logic chấm tự động và chuẩn đạt động tại `submit/route.ts` (bỏ hardcode 70% và bỏ cộng điểm ẩu)
- [x] **Task 0.4**: Kiểm tra quyền sở hữu và thẩm quyền bài nộp tại các API AI (`grade-submission`, `analyze-competency`)
- [x] **Task 0.5**: Siết chặt điều kiện và thẩm quyền cấp chứng chỉ tại `credentials/generate` (sửa toán tử `&&`, kiểm tra chính chủ)

### Checkpoint 0: Trạm Kiểm Soát Bảo Mật & Toàn Vẹn Dữ Liệu
- [x] Toàn bộ 5 lỗ hổng P0 về bảo mật, rò rỉ đáp án và buff điểm client-side được đóng hoàn toàn
- [x] `npx tsc --noEmit` đạt 0 lỗi
- [x] Kiểm thử quyền âm (negative permissions test) thành công

---

## Phase 1: Sổ Cái Điểm Tích Lũy (`point_ledger`) & Chuẩn Hóa Điểm (P1)
- [x] **Task 1.1**: Database Migration: Bảng `point_ledger` bất biến và RPC atomic grant points
- [x] **Task 1.2**: Xây dựng service `PointLedgerService` với kiểm tra idempotency và event nguồn
- [x] **Task 1.3**: Tích hợp `PointLedgerService` vào luồng nộp bài thi (`submit`) và hoàn thành học tập (`learning/complete`)

### Checkpoint 1: Trạm Kiểm Soát Sổ Cái Điểm
- [x] Điểm tích lũy toàn hệ thống được quản trị qua sổ cái bất biến có idempotency key
- [x] Triệt tiêu race condition và buff điểm bừa bãi

---

## Phase 2: Ngân Hàng Câu Hỏi Độc Lập & Assessment Studio (P1)
- [x] **Task 2.1**: Schema Ngân hàng câu hỏi `question_bank_items` & versioning tách biệt khỏi đề thi
- [x] **Task 2.2**: Nâng cấp Assessment Studio cho phép chọn câu hỏi từ ngân hàng chung và tạo snapshot đề bất biến
- [x] **Task 2.3**: Kiểm định đề trước khi phát hành (Pre-publish Gate: kiểm tra 100% câu có đáp án/rubric và miền DigComp)

### Checkpoint 2: Trạm Kiểm Soát Ngân Hàng Đề & Khảo Thí
- [x] Câu hỏi tái sử dụng được; đề thi đã làm không bị sửa đổi câu chữ hồi tố
- [x] Đề thi lỗi bị chặn phát hành tự động

---

## Phase 3: Radar Năng Lực 5 Miền Xuyên Suốt & Lộ Trình Học Thật (P1)
- [x] **Task 3.1**: Schema Bằng chứng năng lực `competency_evidence` & Snapshot lịch sử `learner_competency_snapshots`
- [x] **Task 3.2**: Engine tổng hợp Radar 5 Miền xuyên suốt, xử lý trạng thái "Chưa đủ dữ liệu" thay vì gán 0%
- [x] **Task 3.3**: Lộ trình học tập cá nhân hóa kết nối 100% với `learning_modules` thật và xác minh hoàn thành server-side

### Checkpoint 3: Trạm Kiểm Soát Hồ Sơ Năng Lực & Học Tập
- [x] Radar 5 Miền theo dõi tiến trình năng lực số dài hạn
- [x] Không còn liên kết học liệu ảo do AI tự bịa

---

## Phase 4: Quản Trị AI Gateway & Human-In-The-Loop Rubric (P1)
- [x] **Task 4.1**: Bảng ghi nhận sử dụng AI toàn diện `ai_usage_events` (token, model, latency, cost)
- [x] **Task 4.2**: Tách biệt rõ ràng giữa AI Confidence Flag và Integrity Flag (cờ giám sát thi)
- [x] **Task 4.3**: Hoàn thiện luồng chấm Rubric có con người phê duyệt (Human-in-the-loop: Chấp nhận / Sửa / Bác bỏ)

### Checkpoint 4: Trạm Kiểm Soát AI Có Trách Nhiệm
- [x] 100% lượt gọi AI được ghi nhận token và chi phí
- [x] Kết quả AI chỉ là đề xuất có bằng chứng, Evaluator giữ quyền quyết định cuối cùng

---

## Phase 5: Phòng Thi Live & Giám Sát Phía Máy Chủ (P1)
- [x] **Task 5.1**: Cưỡng chế trạng thái khóa phòng (`is_locked`) và phân quyền nhóm (`GROUP_ONLY`) tại server API
- [x] **Task 5.2**: Bảng sự kiện giám sát `proctoring_events` và timeline sự kiện giám thị thời gian thực
- [x] **Task 5.3**: Chuẩn hóa 4 profile giám sát (`PRACTICE`, `STANDARD`, `SUPERVISED_LIVE`, `HIGH_STAKES`) và khử tuyên bố phóng đại

### Checkpoint 5: Trạm Kiểm Soát Phòng Thi Live
- [x] Phòng thi trực tiếp được kiểm soát an toàn từ server, không chỉ đổi state trên client
- [x] Sự kiện giám sát trung thực, có thể truy vết

---

## Phase 6: Tổ Chức B2B, Hạn Mức Quota & Thanh Toán Thực (P2)
- [x] **Task 6.1**: Luồng mời thành viên tổ chức (`organization_invitations`) và RBAC đa cấp kèm Workspace Switcher
- [x] **Task 6.2**: Lưu trữ cấu hình gói dịch vụ (`service_plans`) trên database thay vì mảng tĩnh trong code
- [x] **Task 6.3**: Webhook thanh toán đối soát máy chủ cho các giao dịch nâng cấp gói dịch vụ

### Checkpoint 6: Trạm Kiểm Soát B2B & Thương Mại
- [x] B2B trường học/doanh nghiệp có luồng vận hành độc lập, tự động và bảo mật

---

## Phase 7: Nghiệm Thu Toàn Diện & Verification (P2)
- [x] **Task 7.1**: Viết và chạy bộ kiểm thử tự động (Unit & Integration tests) cho các luồng cốt lõi
- [x] **Task 7.2**: Rà soát tuân thủ nghiêm ngặt UI Rules (không AI smell, không màu cấm, không emoji) trên 3 dashboard
- [x] **Task 7.3**: Kiểm tra Production Build (`npm run build`) và đối chiếu 20 tiêu chí nghiệm thu của bản review

### Checkpoint 7: Trạm Nghiệm Thu Hoàn Tất Dự Án
- [x] Hệ thống NEXA AI đạt chuẩn sẵn sàng vận hành thực tế cho trường học và doanh nghiệp
