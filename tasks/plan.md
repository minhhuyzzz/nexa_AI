# KẾ HOẠCH TRIỂN KHAI VÀ KHẮC PHỤC TOÀN DIỆN HỆ THỐNG NEXA AI
> **Căn cứ tài liệu:** [NEXA_AI_REVIEW_TONG_THE.md](file:///c:/nexa/NEXA_AI_REVIEW_TONG_THE.md) (Review tổng thể kiến trúc, nghiệp vụ, bảo mật, khảo thí và AI - Phiên bản 1.0)  
> **Phương pháp luận:** Áp dụng skill `planning-and-task-breakdown` — Phân rã công việc thành các lát cắt dọc (Vertical Slices), có tiêu chí nghiệm thu (Acceptance Criteria), lệnh kiểm thử xác minh (Verification) và các trạm kiểm soát (Checkpoints).

---

## 1. Tổng Quan & Mục Tiêu

Bản review tổng thể đã chỉ rõ: NEXA đã có nền tảng giao diện và tính năng tương đối phong phú, nhưng điểm yếu cốt lõi nằm ở **ranh giới quyền hạn (authorization boundaries), tính toàn vẹn của dữ liệu (data integrity) và tính liên tục giữa các vai trò (cross-role workflows)**.

Mục tiêu của kế hoạch này là chuyển hóa toàn bộ 22 phân mục trong bản review thành lộ trình thực thi kỹ thuật chuẩn mực, giải quyết dứt điểm các lỗ hổng P0 (bảo mật, rò rỉ đáp án, sửa điểm client-side), chuẩn hóa 3 lớp điểm (bài thi vs năng lực vs tích lũy), xây dựng sổ cái `point_ledger`, tách ngân hàng câu hỏi độc lập, chuẩn hóa radar 5 miền dài hạn và thiết lập cơ chế giám sát phòng thi có căn cứ.

---

## 2. Các Quyết Định Kiến Trúc Trọng Tâm (Architecture Decisions)

1. **Ba lớp điểm tách bạch hoàn toàn (Three-Tier Scoring System)**:
   - *Điểm bài thi (`percentage` & `earned_score`)*: Điểm số học thuật của một lần nộp bài, tính bằng công thức tất định phía server dựa trên `passing_score` động của đề thi.
   - *Điểm năng lực (`competency_score`)*: Điểm ước lượng năng lực theo kỹ năng/miền DigComp, tổng hợp từ các bằng chứng (`evidence`) hợp lệ trong quá khứ.
   - *Điểm tích lũy (`gamification points`)*: Điểm thưởng hệ thống ghi qua sổ cái bất biến `point_ledger` có idempotency; client tuyệt đối không có quyền ghi trực tiếp.
2. **Khóa chặt RLS & Zero Client-Side Privilege Escalation**:
   - Khóa quyền UPDATE trực tiếp của người dùng vào các cột `points`, `credits`, `plan_tier`, `avg_competency_score` trên bảng `profiles`.
   - Ẩn triệt để trường `is_correct` của `item_options` trước khi nộp bài; bảo vệ nội dung đề VIP tại API endpoint.
3. **Radar Năng lực Số 5 Miền Xuyên Suốt (Longitudinal Evidence-Based Radar)**:
   - Không sinh radar giả hoặc gán 0% cho miền chưa thi; nếu chưa đủ bằng chứng hiển thị trạng thái "Chưa đủ dữ liệu".
   - Mỗi lần đánh giá tạo một `competency_evidence` và snapshot lịch sử, cho phép so sánh tiến bộ theo thời gian.
4. **Phòng thi Live: Cưỡng chế trạng thái phía Server (Server-Enforced Live Sessions)**:
   - Khóa phòng (`is_locked`) và chế độ nhóm (`GROUP_ONLY`) phải được kiểm tra và chặn trực tiếp tại API `rooms/join`.
   - Đồng hồ đếm ngược căn cứ theo `server_now` và thời gian bắt đầu chính thức; ghi nhận sự kiện chuyển tab/mất focus vào `proctoring_events` thay vì chỉ hiển thị client-side.
5. **AI Human-in-the-Loop & Audit Logging**:
   - Kết quả chấm Rubric của AI chỉ là bản đề xuất (Draft); Evaluator có quyền chấp nhận, sửa hoặc bác bỏ trước khi chốt điểm chính thức.
   - Ghi nhận 100% lượng token, model, độ trễ và chi phí ước tính vào `ai_usage_events`.

---

## 3. Sơ Đồ Phụ Thuộc (Dependency Graph)

```
[Phase 0: Bảo mật, RLS & Tính toàn vẹn dữ liệu (P0)]
   │
   ├── [Phase 1: Sổ cái Điểm tích lũy (point_ledger) & Chuẩn hóa Điểm]
   │      │
   │      └── [Phase 2: Điểm Năng lực & Radar 5 Miền Xuyên suốt]
   │             │
   │             └── [Phase 3: Lộ trình học tập & Điều kiện Chứng chỉ]
   │
   ├── [Phase 4: Ngân hàng Câu hỏi Độc lập & Assessment Studio]
   │      │
   │      └── [Phase 5: Phòng thi Live & Giám sát Server-Side]
   │
   └── [Phase 6: Quản trị AI Gateway & Human-in-the-Loop Rubric]
          │
          └── [Phase 7: B2B Tổ chức, Quota & Nghiệm thu End-to-End]
```

---

## 4. Danh Mục Công Việc Chi Tiết Theo Giai Đoạn

### Phase 0: Bảo Mật, RLS & Tính Toàn Vẹn Dữ Liệu (P0 - Khẩn cấp)

#### Task 0.1: Khóa RLS và bảo vệ đáp án đúng (`item_options.is_correct`)
- **Mô tả:** Đảm bảo thí sinh không thể truy vấn trực tiếp bảng `item_options` qua Supabase client để đọc trường `is_correct` trước khi nộp bài. Tách biệt view/query cho thí sinh và người soạn đề.
- **Tiêu chí nghiệm thu:**
  - Client của người học gọi `supabase.from('item_options').select('*')` không thể đọc được `is_correct` của đề công khai.
  - API làm bài `/api/assessments/[id]` chỉ trả về danh sách options không kèm thuộc tính `is_correct`.
  - Bộ chấm tự động phía server vẫn truy xuất được `is_correct` qua service client.
- **Xác minh:**
  - Viết test quyền âm: request authenticated bằng tài khoản LEARNER không đọc được `is_correct = true`.
  - `npx tsc --noEmit` và `npm run build` không lỗi.
- **Files:** `src/database/migrations/12_security_rls_hardening.sql`, `src/app/api/assessments/[id]/route.ts`.
- **Scope:** S (2 files).

#### Task 0.2: Khóa quyền ghi trực tiếp vào các trường nhạy cảm trong `profiles`
- **Mô tả:** Chặn người dùng tự gửi lệnh UPDATE trực tiếp qua Supabase client để sửa `points`, `credits`, `plan_tier`, `avg_competency_score`, hoặc `role`. Tạo trigger/RLS column protection.
- **Tiêu chí nghiệm thu:**
  - Người dùng gửi `supabase.from('profiles').update({ points: 99999 }).eq('id', user.id)` nhận lỗi từ chối quyền (Error 42501 hoặc P0001).
  - Chỉ có server backend với service role key hoặc RPC đặc quyền mới được phép cập nhật các trường này.
- **Xác minh:**
  - Script kiểm thử trực tiếp bằng session LEARNER thử hack điểm `points` và `plan_tier`.
- **Files:** `src/database/migrations/12_security_rls_hardening.sql`.
- **Scope:** XS (1 file).

#### Task 0.3: Sửa logic chấm tự động và chuẩn đạt động tại `submit/route.ts`
- **Mô tả:** Thay thế logic chuẩn đạt đang bị hardcode `scoreOn10 >= 7.0` (70%) bằng `percentage >= (assessment.passing_score ?? 70.0)`. Loại bỏ việc tự động cộng hardcode 10 điểm tích lũy vào `profiles.points`.
- **Tiêu chí nghiệm thu:**
  - `isPassed` được tính theo đúng `passing_score` đã cấu hình của từng bài thi.
  - Không còn đoạn code `currentProfile.points + 10` gây race condition và buff điểm bừa bãi.
  - Trạng thái `is_passed` được lưu chính xác trong `assessment_submissions`.
- **Xác minh:**
  - Test nộp bài thi với đề có `passing_score = 80`: đạt 75% -> `is_passed = false`; đề có `passing_score = 60`: đạt 65% -> `is_passed = true`.
- **Files:** `src/app/api/assessments/[id]/submit/route.ts`.
- **Scope:** S (1 file).

#### Task 0.4: Kiểm tra quyền sở hữu và thẩm quyền bài nộp tại các API AI
- **Mô tả:** Bổ sung bước kiểm tra quyền tại `POST /api/ai/grade-submission` và `POST /api/ai/analyze-competency`. Xác nhận `submission.user_id === user.id` (nếu là LEARNER) hoặc Evaluator được phân công phụ trách lớp/ca thi đó.
- **Tiêu chí nghiệm thu:**
  - Thí sinh A không thể gửi `submissionId` của thí sinh B để gọi AI chấm hoặc phân tích.
  - Trả về mã lỗi `403 Forbidden` nếu vi phạm phạm vi sở hữu.
- **Xác minh:**
  - Unit test API gọi grade-submission chéo tài khoản và xác nhận bị chặn.
- **Files:** `src/app/api/ai/grade-submission/route.ts`, `src/app/api/ai/analyze-competency/route.ts`.
- **Scope:** S (2 files).

#### Task 0.5: Siết chặt điều kiện và thẩm quyền cấp chứng chỉ tại `credentials/generate`
- **Mô tả:** Sửa lỗi logic `!submission.is_passed && percentage < passingScore` (dùng `&&` sai lầm). Bổ sung kiểm tra `submission.user_id === user.id` và trạng thái bài thi phải là `EVALUATED` hoặc `FINALIZED` (đã hoàn tất mọi câu tự luận nếu có).
- **Tiêu chí nghiệm thu:**
  - Thí sinh chỉ được cấp chứng chỉ cho bài nộp chính chủ của mình.
  - Chứng chỉ chỉ được cấp khi bài thi thỏa mãn đồng thời: `is_passed = true` VÀ `percentage >= passing_score` VÀ không còn câu hỏi tự luận chưa chấm.
- **Xác minh:**
  - Test cấp chứng chỉ với bài thi chưa đạt điểm chuẩn hoặc bài thi của người khác -> Bị từ chối `400/403`.
- **Files:** `src/app/api/credentials/generate/route.ts`.
- **Scope:** S (1 file).

#### Checkpoint 0: Trạm Kiểm Soát Bảo Mật & Toàn Vẹn Dữ Liệu
- [ ] Mọi lỗ hổng P0 về rò rỉ đáp án, buff điểm client-side và vi phạm quyền chéo đã được khắc phục hoàn toàn.
- [ ] Chạy `npx tsc --noEmit` và `npm run build` không phát sinh lỗi.
- [ ] Chạy test bảo mật xác nhận không còn đường leo thang đặc quyền.

---

### Phase 1: Sổ Cái Điểm Tích Lũy (`point_ledger`) & Chuẩn Hóa Điểm (P1)

#### Task 1.1: Database Migration: Bảng `point_ledger` và RPC Atomic Points
- **Mô tả:** Tạo bảng `point_ledger` lưu trữ lịch sử cộng/trừ điểm tích lũy bất biến với các trường: `id`, `user_id`, `event_type`, `source_type`, `source_id`, `delta`, `idempotency_key`, `created_at`. Tạo PostgreSQL Function / RPC `grant_points_atomic` để đảm bảo transaction an toàn, chống duplicate thưởng.
- **Tiêu chí nghiệm thu:**
  - Cùng một `idempotency_key` (ví dụ `SUBMISSION_REWARD_<sub_id>`) không thể được cộng điểm 2 lần.
  - Số dư `profiles.points` được đồng bộ nguyên tử bằng RPC database, triệt tiêu race condition.
- **Xác minh:**
  - Chạy đồng thời 10 requests cùng `idempotency_key`, chỉ có đúng 1 request thành công.
- **Files:** `src/database/migrations/13_point_ledger_schema.sql`.
- **Scope:** XS (1 file).

#### Task 1.2: Xây dựng service `PointLedgerService` & Phân loại chính sách thưởng
- **Mô tả:** Viết module `src/features/gamification/services/point-ledger.service.ts` quản lý nghiệp vụ thưởng điểm. Phân định rõ: Đề do Evaluator tự tạo mặc định 0 điểm tích lũy; chỉ đề chuẩn hệ thống do Admin phê duyệt mới được cấp điểm theo `point_reward`.
- **Tiêu chí nghiệm thu:**
  - Service cung cấp hàm `awardPoints({ userId, eventType, sourceId, delta, idempotencyKey })`.
  - Kiểm tra điều kiện đề thi thuộc danh mục cho phép trước khi phát thưởng.
- **Xác minh:**
  - Unit tests cho `PointLedgerService` bao phủ các trường hợp thưởng hợp lệ, trùng lặp và từ chối.
- **Files:** `src/features/gamification/services/point-ledger.service.ts`, `src/features/gamification/services/point-ledger.service.test.ts`.
- **Scope:** S (2 files).

#### Task 1.3: Tích hợp `PointLedgerService` vào luồng nộp bài và hoàn thành học tập
- **Mô tả:** Thay thế toàn bộ logic cộng điểm cũ tại `POST /api/assessments/[id]/submit` và `POST /api/learning/complete` sang gọi `PointLedgerService`.
- **Tiêu chí nghiệm thu:**
  - Học viên đạt chuẩn bài thi hệ thống được ghi nhận một dòng trong `point_ledger` và tăng điểm `profiles.points`.
  - Học viên hoàn tất module học tập hợp lệ được thưởng +30 điểm qua sổ cái.
- **Xác minh:**
  - Kiểm tra bảng `point_ledger` trong DB sau khi nộp bài và học xong module.
- **Files:** `src/app/api/assessments/[id]/submit/route.ts`, `src/app/api/learning/complete/route.ts`.
- **Scope:** S (2 files).

#### Checkpoint 1: Trạm Kiểm Soát Sổ Cái Điểm
- [ ] Điểm tích lũy toàn hệ thống được quản trị bằng sổ cái bất biến, có thể truy vết nguồn gốc 100%.
- [ ] Không còn tình trạng farm điểm hay mất đồng bộ số dư.

---

### Phase 2: Ngân Hàng Câu Hỏi Độc Lập & Assessment Studio (P1)

#### Task 2.1: Schema Ngân Hàng Câu Hỏi `question_bank_items` & Versioning
- **Mô tả:** Tách câu hỏi khỏi việc gắn cứng vào một đề thi cụ thể. Tạo bảng `question_bank_items` và `question_bank_item_versions` hỗ trợ tái sử dụng câu hỏi, phân loại theo miền DigComp, mức độ khó và trạng thái phê duyệt.
- **Tiêu chí nghiệm thu:**
  - Một câu hỏi có thể được đưa vào nhiều đề thi khác nhau thông qua bảng liên kết hoặc snapshot.
  - Đề thi đã phát hành giữ snapshot bất biến, không bị thay đổi nội dung khi câu hỏi trong ngân hàng được chỉnh sửa.
- **Xác minh:**
  - Sửa nội dung câu hỏi trong ngân hàng -> Đề thi cũ đã làm không bị đổi câu chữ hồi tố.
- **Files:** `src/database/migrations/14_question_bank_schema.sql`.
- **Scope:** XS (1 file).

#### Task 2.2: Nâng cấp Assessment Studio hỗ trợ chọn câu hỏi từ Ngân Hàng
- **Mô tả:** Bổ sung giao diện trong `AssessmentStudio.tsx` cho phép người soạn đề: Tạo câu hỏi mới trực tiếp vào kho, hoặc tìm kiếm và kéo câu hỏi đã có từ ngân hàng câu hỏi vào bài thi.
- **Tiêu chí nghiệm thu:**
  - Drawer tìm kiếm câu hỏi theo Miền năng lực, Kỹ năng DigComp và loại câu hỏi.
  - Thao tác thêm câu từ ngân hàng vào đề diễn ra mượt mà, cập nhật ngay ma trận điểm.
- **Xác minh:**
  - Kiểm thử tạo đề mới bằng cách nhặt 5 câu có sẵn từ ngân hàng.
- **Files:** `src/features/assessments/components/AssessmentStudio.tsx`, `src/features/assessments/components/QuestionBankDrawer.tsx`.
- **Scope:** M (3 files).

#### Task 2.3: Kiểm định tính hợp lệ của đề thi trước khi phát hành (Pre-publish Gate)
- **Mô tả:** Xây dựng modal/service kiểm định đề trước khi bấm "Phát hành": Kiểm tra 100% câu trắc nghiệm có đáp án đúng, câu thực hành có rubric, tổng điểm > 0, và không còn cảnh báo thiếu kỹ năng DigComp.
- **Tiêu chí nghiệm thu:**
  - Đề thi có lỗi (ví dụ: câu trắc nghiệm không có đáp án đúng) bị chặn phát hành và hiển thị cảnh báo đỏ chi tiết từng câu.
  - Đề thi hợp lệ được phát hành và sinh snapshot phiên bản đề bất biến.
- **Xác minh:**
  - Thử phát hành đề thiếu rubric hoặc thiếu đáp án -> Báo lỗi cụ thể, không crash trang.
- **Files:** `src/features/assessments/services/assessment-validator.service.ts`, `src/features/assessments/components/PublishValidationModal.tsx`.
- **Scope:** S (2 files).

#### Checkpoint 2: Trạm Kiểm Soát Ngân Hàng Đề & Khảo Thí
- [ ] Ngân hàng câu hỏi hoạt động độc lập, hỗ trợ tái sử dụng và kiểm soát phiên bản chặt chẽ.
- [ ] Không có đề thi lỗi đáp án nào có thể lọt lên trạng thái công khai.

---

### Phase 3: Radar Năng Lực 5 Miền Xuyên Suốt & Lộ Trình Học Thật (P1)

#### Task 3.1: Schema Bằng Chứng Năng Lực & Snapshot Hồ Sơ (`competency_evidence`)
- **Mô tả:** Tạo bảng `competency_evidence` lưu từng bằng chứng đo lường (điểm số, kỹ năng, nguồn bài thi, loại bằng chứng, thời điểm) và bảng `learner_competency_snapshots` lưu ảnh chụp radar theo thời gian.
- **Tiêu chí nghiệm thu:**
  - Mỗi lần học viên hoàn thành bài thi hoặc bài thực hành, hệ thống ghi nhận các bản ghi bằng chứng gắn với từng kỹ năng cụ thể.
  - Cho phép truy vết điểm từng miền DigComp bắt nguồn từ bài thi nào.
- **Files:** `src/database/migrations/15_competency_evidence_schema.sql`.
- **Scope:** XS (1 file).

#### Task 3.2: Engine Tổng Hợp Radar 5 Miền Xuyên Suốt & Xử lý "Chưa Đủ Dữ Liệu"
- **Mô tả:** Viết module `CompetencyAggregationService` tính toán điểm 5 Miền từ lịch sử bằng chứng có trọng số. Nếu một kỹ năng hoặc miền chưa có bài làm, hiển thị rõ ràng "Chưa đủ dữ liệu", cấm tự động gán 0% làm méo mó năng lực học viên.
- **Tiêu chí nghiệm thu:**
  - Trang Hồ sơ năng lực (`/learner/competency`) hiển thị radar tiến trình xuyên suốt (Baseline vs Hiện tại).
  - Có tab so sánh lịch sử theo mốc thời gian (90 ngày, 1 năm).
- **Xác minh:**
  - Tài khoản mới tạo: Radar hiển thị trạng thái hướng dẫn làm bài khảo thí ban đầu, không vẽ hình tam giác cụt 0 điểm.
- **Files:** `src/features/competency/services/competency-aggregation.service.ts`, `src/app/(dashboard)/learner/competency/page.tsx`.
- **Scope:** M (3 files).

#### Task 3.3: Lộ Trình Học Cá Nhân Hóa Kết Nối 100% Học Liệu Thật
- **Mô tả:** Đảm bảo toàn bộ các bước trong Lộ trình 4 bước (`competency_analyses.learning_pathway`) trỏ trực tiếp đến các `module_id` đang có thật trong bảng `learning_modules`. Ngăn chặn hoàn toàn việc AI bịa ID hoặc tạo đường link ảo.
- **Tiêu chí nghiệm thu:**
  - Học viên bấm vào bước học trong lộ trình chuyển thẳng đến bài học thực tế trong hệ thống.
  - Xác nhận hoàn thành module yêu cầu học viên đọc nội dung và làm bài tập kiểm tra trước khi cấp chứng chỉ hoàn thành.
- **Xác minh:**
  - Test luồng: Làm bài -> AI gợi ý lộ trình -> Click học module thật -> Hoàn thành -> Cập nhật bằng chứng năng lực.
- **Files:** `src/app/api/ai/analyze-competency/route.ts`, `src/app/(dashboard)/learner/learning-path/page.tsx`.
- **Scope:** S (2 files).

#### Checkpoint 3: Trạm Kiểm Soát Hồ Sơ Năng Lực & Học Tập
- [ ] Radar 5 Miền phản ánh trung thực quá trình phát triển năng lực số của người học.
- [ ] Lộ trình học gắn liền với học liệu có thật trong hệ sinh thái NEXA.

---

### Phase 4: Quản Trị AI Gateway & Human-In-The-Loop Rubric (P1)

#### Task 4.1: Bảng Ghi Nhận Sử Dụng AI Toàn Diện (`ai_usage_events`)
- **Mô tả:** Tạo bảng `ai_usage_events` lưu vết: `id`, `user_id`, `organization_id`, `feature`, `provider`, `model`, `prompt_tokens`, `completion_tokens`, `latency_ms`, `status`, `cost_estimated`. Tích hợp middleware ghi log cho mọi lượt gọi AI (chấm bài, phân tích năng lực).
- **Tiêu chí nghiệm thu:**
  - Mọi thao tác gọi Gemini/Claude đều ghi nhận chính xác lượng token và thời gian phản hồi vào database.
  - Admin có thể theo dõi tổng lượng token và chi phí ước tính tại `/admin/settings?tab=ai`.
- **Files:** `src/database/migrations/16_ai_usage_tracking_schema.sql`, `src/features/ai-gateway/services/ai-usage-logger.service.ts`.
- **Scope:** S (2 files).

#### Task 4.2: Tách biệt rạch ròi AI Confidence Flag và Integrity Flag
- **Mô tả:** Chuẩn hóa giao diện và dữ liệu: `confidence_flag` (`GREEN`, `AMBER`, `RED`) chỉ thể hiện mức độ tin cậy của mô hình AI đối với câu trả lời. Sự kiện thí sinh chuyển tab hoặc mất focus được ghi nhận riêng vào cờ giám sát `integrity_flag`. Tuyệt đối không đánh đồng hai khái niệm này.
- **Tiêu chí nghiệm thu:**
  - Trên màn hình chấm thi của Evaluator, cờ tin cậy AI hiển thị kèm tỷ lệ phần trăm và dẫn chứng gốc (`evidenceQuote`).
  - Thí sinh bị gián đoạn mạng không bị gán nhãn "AI nghi ngờ gian lận".
- **Files:** `src/components/assessment/AIGradingCard.tsx`, `src/app/(dashboard)/evaluator/grading/page.tsx`.
- **Scope:** S (2 files).

#### Task 4.3: Luồng Chấm Rubric Có Con Người Phê Duyệt (Human-in-the-Loop)
- **Mô tả:** Hoàn thiện bảng điều khiển chấm bài của Người đánh giá (`/evaluator/grading`): Điểm số do AI gợi ý chỉ ở dạng dự thảo (Draft). Người đánh giá có thể chấp thuận 1-click, hoặc tùy chỉnh lại điểm từng tiêu chí kèm ghi chú trước khi bấm "Lưu điểm chính thức".
- **Tiêu chí nghiệm thu:**
  - Điểm bài nộp chỉ được chuyển thành điểm chính thức sau khi Người đánh giá bấm xác nhận.
  - Lưu vết lịch sử thay đổi (người sửa, điểm AI ban đầu, điểm người chấm cuối cùng).
- **Files:** `src/app/api/evaluator/grade/route.ts`, `src/app/(dashboard)/evaluator/grading/page.tsx`.
- **Scope:** M (3 files).

#### Checkpoint 4: Trạm Kiểm Soát AI Có Trách Nhiệm
- [ ] 100% chi phí và lượng token AI được giám sát minh bạch.
- [ ] Con người luôn giữ quyền quyết định tối hậu đối với kết quả khảo thí và chứng chỉ.

---

### Phase 5: Phòng Thi Live & Giám Sát Phía Máy Chủ (P1)

#### Task 5.1: Cưỡng Chế Trạng Thái Khóa Phòng & Phân Quyền Nhóm Tại Server API
- **Mô tả:** Sửa đổi `POST /api/rooms/join`: Kiểm tra trạng thái `is_locked` từ database. Nếu phòng đã khóa nhận người, từ chối ngay lập tức. Nếu phòng ở chế độ `GROUP_ONLY`, kiểm tra thí sinh có thuộc `organization_id` hoặc lớp học liên quan hay không.
- **Tiêu chí nghiệm thu:**
  - Giám thị bấm "Khóa phòng" trên màn hình điều khiển -> Người mới nhập mã PIN bị báo lỗi "Phòng thi đã khóa nhận thí sinh mới".
  - Thí sinh tự do không thể nhập PIN của phòng thi nội bộ trường học/doanh nghiệp.
- **Files:** `src/app/api/rooms/join/route.ts`, `src/app/live/control/page.tsx`.
- **Scope:** S (2 files).

#### Task 5.2: Bảng Sự Kiện Giám Sát `proctoring_events` & Timeline Giám Thị
- **Mô tả:** Tạo bảng `proctoring_events` ghi nhận các sự kiện: `TAB_HIDDEN`, `FULLSCREEN_EXIT`, `RECONNECT`, `FOCUS_LOST`. Hiển thị timeline chi tiết cho từng thí sinh trên màn hình giám sát của Người đánh giá.
- **Tiêu chí nghiệm thu:**
  - Khi thí sinh chuyển tab, client gửi event lên máy chủ lưu vào database.
  - Bảng điều khiển giám thị cập nhật tức thì số lần rời màn hình kèm mốc thời gian cụ thể.
- **Files:** `src/database/migrations/17_proctoring_events_schema.sql`, `src/app/api/rooms/events/route.ts`, `src/components/live/ProctoringTimeline.tsx`.
- **Scope:** M (3 files).

#### Task 5.3: Chuẩn Hóa 4 Profile Giám Sát & Khử Bỏ Tuyên Bố Tuyệt Đối Hóa
- **Mô tả:** Cập nhật các màn hình và tài liệu hướng dẫn: Phân định rõ 4 chế độ giám sát (`PRACTICE`, `STANDARD`, `SUPERVISED_LIVE`, `HIGH_STAKES`). Xóa bỏ hoàn toàn các câu từ phóng đại như "Cấm chụp màn hình 100%" trên nền tảng web thông thường, thay bằng mô tả trung thực về các cơ chế phát hiện chuyển tab và fullscreen.
- **Tiêu chí nghiệm thu:**
  - Giao diện phòng chờ và cài đặt đề thi hiển thị đúng cam kết kỹ thuật khả thi của trình duyệt.
- **Files:** `src/app/live/waiting-room/page.tsx`, `src/components/assessment/AssessmentProctoringSettings.tsx`.
- **Scope:** S (2 files).

#### Checkpoint 5: Trạm Kiểm Soát Phòng Thi Live
- [ ] Phòng thi trực tiếp được kiểm soát an toàn từ phía máy chủ.
- [ ] Dữ liệu giám sát minh bạch, trung thực và có giá trị kiểm tra thực tế.

---

### Phase 6: Tổ Chức B2B, Hạn Mức Quota & Thanh Toán Thực (P2)

#### Task 6.1: Luồng Mời Thành Viên Tổ Chức & RBAC Đa Cấp
- **Mô tả:** Xây dựng bảng `organization_invitations` và quy trình gửi lời mời gia nhập trường học/doanh nghiệp qua email/liên kết dùng một lần. Bổ sung bộ chuyển không gian làm việc (Context Switcher: Cá nhân vs Tổ chức) cho Người đánh giá.
- **Tiêu chí nghiệm thu:**
  - Quản trị viên trường học có thể mời giảng viên vào tổ chức.
  - Lời mời hết hạn hoặc đã chấp nhận không thể tái sử dụng.
  - Người đánh giá có thể chuyển đổi không gian làm việc giữa cá nhân và đơn vị.
- **Files:** `src/database/migrations/18_organization_invitations_schema.sql`, `src/app/api/organizations/invite/route.ts`, `src/components/dashboard/evaluator/WorkspaceSwitcher.tsx`.
- **Scope:** M (4 files).

#### Task 6.2: Lưu Trữ Cấu Hình Gói Dịch Vụ Trên Database
- **Mô tả:** Chuyển đổi toàn bộ cấu hình gói dịch vụ từ biến mảng tĩnh trong code sang bảng `service_plans` trong cơ sở dữ liệu. Admin có thể tùy biến hạn mức thí sinh và quota AI của từng gói.
- **Tiêu chí nghiệm thu:**
  - Trang `/admin/users?tab=organizations` và `/pricing` đọc động thông tin gói từ database.
  - Cập nhật gói dịch vụ có hiệu lực ngay lập tức.
- **Files:** `src/database/migrations/19_service_plans_schema.sql`, `src/app/api/plans/route.ts`.
- **Scope:** S (2 files).

#### Task 6.3: Webhook Thanh Toán Xác Thực Phía Máy Chủ
- **Mô tả:** Xây dựng endpoint webhook xử lý thông báo thanh toán (SePay/MoMo/VNPAY/Stripe). Chỉ nâng cấp `plan_tier` và cấp credits khi chữ ký bảo mật webhook được xác thực thành công. Cấm client tự cập nhật trạng thái "đã thanh toán".
- **Tiêu chí nghiệm thu:**
  - Webhook kiểm tra signature hợp lệ, chống replay attack bằng idempotency key.
  - Giao dịch được lưu vào `payment_transactions` trước khi kích hoạt gói dịch vụ.
- **Files:** `src/app/api/webhooks/payment/route.ts`, `src/features/billing/services/payment-verifier.service.ts`.
- **Scope:** S (2 files).

#### Checkpoint 6: Trạm Kiểm Soát B2B & Thương Mại
- [ ] Toàn bộ luồng tổ chức B2B và thanh toán được tự động hóa, bảo mật và vận hành độc lập.

---

### Phase 7: Nghiệm Thu Toàn Diện & Verification (P2)

#### Task 7.1: Bộ Kiểm Thử Tự Động (Unit & Integration Tests)
- **Mô tả:** Viết và chạy bộ kiểm thử Vitest bao phủ toàn bộ các dịch vụ trọng yếu: `point-ledger`, `certificate-generator`, `assessment-validator`, `ai-usage-logger`, và các API kiểm tra quyền âm.
- **Tiêu chí nghiệm thu:**
  - `npm run test` vượt qua 100% test cases.
- **Files:** `tests/security.test.ts`, `tests/scoring.test.ts`, `tests/ledger.test.ts`.
- **Scope:** M (3 files).

#### Task 7.2: Rà Soát Tuân Thủ UI Rules & Khử Sạch "Mùi AI"
- **Mô tả:** Rà soát toàn bộ các trang giao diện trong 3 dashboard (`learner`, `evaluator`, `admin`): Đảm bảo không còn màu tím/indigo cấm, không có dải gradient cầu vồng, không dùng emoji trong JSX, 100% dùng Lucide icons (`strokeWidth={1.75}`) và JetBrains Mono cho số liệu.
- **Tiêu chí nghiệm thu:**
  - Không còn bất kỳ vi phạm nào với Bộ quy tắc nghiêm ngặt tại `AGENTS.md`.
- **Files:** Toàn bộ các components dashboard.
- **Scope:** M (Refactor/Lint).

#### Task 7.3: Production Build & Nghiệm Thu End-to-End
- **Mô tả:** Chạy kiểm tra tĩnh toàn bộ dự án (`npx tsc --noEmit`) và thực hiện build production sạch sẽ (`npm run build`).
- **Tiêu chí nghiệm thu:**
  - Exit code 0, không có lỗi runtime hay type error.
- **Files:** Toàn dự án.
- **Scope:** S (Build check).

#### Checkpoint 7: Trạm Nghiệm Thu Hoàn Tất Dự Án
- [ ] 20 tiêu chí nghiệm thu cụ thể trong Section 20 của bản review được đáp ứng đầy đủ.
- [ ] Hệ thống NEXA AI sẵn sàng vận hành thực tế cho trường học và doanh nghiệp.

---

## 5. Bảng Quản Trị Rủi Ro & Biện Pháp Giảm Thiểu

| Rủi ro | Mức độ | Ảnh hưởng | Biện pháp giảm thiểu |
|---|---|---|---|
| **Race condition khi cộng điểm đồng thời** | Cao | Học viên bị cộng điểm nhiều lần hoặc mất điểm | Sử dụng bảng `point_ledger` có unique `idempotency_key` và RPC transaction database |
| **Rò rỉ đáp án trắc nghiệm qua client query** | Nghiêm trọng | Học viên xem trước đáp án khi làm bài | Khóa RLS trên `item_options.is_correct` và lọc sạch trường này tại API |
| **API AI bị lạm dụng quota/credits** | Cao | Thất thoát chi phí API Gemini/Claude | Kiểm tra quota trước khi gọi, ghi `ai_usage_events`, xác thực quyền sở hữu bài thi |
| **Schema drift giữa repo và Supabase live** | Trung bình | Lỗi runtime khi query bảng chưa tồn tại | Luôn viết migration có số thứ tự tuần tự (12..19) và chạy kiểm tra trước khi push |
| **Mất kết nối mạng phòng thi Live** | Trung bình | Học viên bị gián đoạn bài làm | Client tự động lưu nháp cục bộ (Local draft), đồng bộ lại khi có mạng; không phạt gian lận khi mất mạng |

---

## 6. Các Quyết Định Nghiệp Vụ Cần Thống Nhất Với Chủ Dự Án

1. **Ngưỡng 450 điểm tích lũy**: Xác nhận đây là **điều kiện mở khóa dự thi sát hạch** (vẫn phải thi đạt đề thi chứng nhận mới được cấp bằng), KHÔNG PHẢI tự động cấp chứng chỉ khi vừa chạm mốc 450 điểm.
2. **Quy tắc thưởng điểm đề Evaluator**: Đề thi do cá nhân Người đánh giá tự tạo mặc định **0 điểm tích lũy toàn cục** (chỉ có điểm bài thi học thuật nội bộ). Chỉ đề chuẩn hệ thống được Admin phê duyệt mới được cấp điểm tích lũy.
3. **Mô hình AI chấm Rubric**: Giữ nguyên cơ chế **Human-in-the-Loop** (AI chấm gợi ý, Người đánh giá là người duyệt cuối cùng) để đảm bảo giá trị pháp lý của chứng chỉ số.
