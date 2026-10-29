# NEXA AI — Review Use Case & Dashboard Architecture

> **Repository:** `minhhuyzzz/nexa_AI`  
> **Phạm vi review:** Personal Workspace, Organization Workspace, Platform Admin, các use case xuyên suốt và kiến trúc nghiệp vụ giữa Assessment / Class / Assignment / Live Room / Submission.  
> **Mục tiêu:** Xác định những phần đã đúng, những luồng đang trùng hoặc sai abstraction, các trang cần giữ/refactor/xóa, và kiến trúc dashboard mục tiêu cho NEXA.

---

# 1. Kết luận tổng quan

Sau đợt refactor mới, NEXA đã chuyển từ mô hình dashboard cố định theo vai trò:

```text
LEARNER Dashboard
EVALUATOR Dashboard
ADMIN Dashboard
```

sang kiến trúc:

```text
                         NEXA ACCOUNT
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
      PERSONAL WORKSPACE   ORG WORKSPACE   PLATFORM ADMIN
        /personal/*        /org/:slug/*       /admin/*
              │               │                │
       Học + Đánh giá      Multi-tenant       Control Plane
       + Creator Tools      Workspace
```

Đây là hướng kiến trúc hợp lý hơn.

Một tài khoản có thể đồng thời:

- học tập;
- làm bài khảo thí;
- xây dựng hồ sơ năng lực;
- tạo đề;
- mở phòng thi;
- quản lý lớp;
- chấm bài;
- tham gia nhiều tổ chức.

Do đó không còn cần ép một tài khoản vào duy nhất `LEARNER` hoặc `EVALUATOR`.

Tuy nhiên, quá trình refactor chưa đồng bộ hoàn toàn. Một số domain cũ vẫn còn sử dụng chung dữ liệu của `exam_rooms`, `evaluator_classes`, `room_participants` và `class_assignments`.

Vấn đề lớn nhất hiện tại không nằm ở AI mà nằm ở chuỗi nghiệp vụ:

```text
Class
  ↓
Assignment
  ↓
Submission
  ↓
Grading
```

---

# 2. Mô hình Dashboard mục tiêu

NEXA nên giữ ba không gian chính.

## 2.1. Personal Workspace

```text
/personal/*
```

Phục vụ mọi người dùng.

Một Personal Workspace có thể chứa cả:

### Learning

- Assessment Catalog
- Assessment Attempts
- Competency Profile
- AI Analysis
- Learning Path
- Credentials
- Leaderboard

### Collaboration

- Classes / Groups
- Assignments
- Discussions
- Files

### Creator Tools

- Assessment Authoring
- Question Bank
- Live Sessions
- Grading Workbench

---

## 2.2. Organization Workspace

```text
/org/:slug/*
```

Phục vụ tài nguyên thuộc một tổ chức cụ thể.

Ví dụ:

```text
Đại học ABC
├── Members
├── Classes
├── Assessments
├── Live Sessions
├── Grading
├── Analytics
├── AI Quota
└── Settings
```

Tất cả tài nguyên ở đây phải có organization context rõ ràng.

---

## 2.3. Platform Admin

```text
/admin/*
```

Đây là Control Plane của toàn nền tảng.

Admin quản lý:

- người dùng;
- tổ chức;
- framework;
- đề thi hệ thống;
- community contributions;
- billing;
- AI Gateway;
- credentials;
- compliance;
- audit;
- platform settings.

---

# 3. Personal Workspace

Sidebar Personal hiện được chia tương đối hợp lý.

## 3.1. Nhóm Learning

```text
Tổng quan
Bài khảo thí
Lộ trình học tập
Radar 5 Miền
Bảng xếp hạng
```

## 3.2. Nhóm hoạt động cá nhân

```text
Nhóm học tập
Nhiệm vụ & Hạn nộp
Chứng chỉ của tôi
```

## 3.3. Nhóm Creator Tools

```text
Đề thi của tôi
Phòng thi trực tiếp
Bàn chấm bài
Ngân hàng câu hỏi
Gói & Nâng cấp
```

Ngoài ra có Quick Action:

```text
Góp đề thi cộng đồng
```

Về Information Architecture, cách chia này tốt hơn phiên bản Learner/Evaluator tách riêng.

---

# 4. `/personal/dashboard`

## Mục tiêu use case

Dashboard cần trả lời:

> Người dùng đang ở đâu trong hành trình NEXA và việc quan trọng tiếp theo cần làm là gì?

Hiện Dashboard chủ yếu hiển thị:

- hồ sơ;
- radar;
- assessment đề xuất;
- learning path;
- leaderboard;
- credential;
- Live PIN.

Đây là một dashboard tốt cho Learner.

Tuy nhiên Personal Workspace mới còn chứa:

```text
Authoring
Live Room
Grading
Question Bank
Classes
```

nhưng dashboard vẫn thiên hoàn toàn về Learner.

Ví dụ một người dùng có:

```text
12 bài chờ chấm
3 lớp đang hoạt động
2 phòng thi live
8 đề cá nhân
```

thì Dashboard hiện chưa phản ánh những công việc đó.

## Kiến trúc đề xuất

Không cần quay lại mô hình Learner/Evaluator Dashboard.

Nên xây Dashboard theo activity:

```text
PERSONAL DASHBOARD

┌──────────────────────────────────────────┐
│ Hành trình năng lực của bạn              │
│ Radar · Assessment · Learning Path       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Công việc cần xử lý                      │
│ 12 bài chờ chấm                          │
│ 2 phòng thi đang mở                      │
│ 3 Assignment gần deadline                │
└──────────────────────────────────────────┘
```

Các block Creator chỉ hiển thị khi user thực sự có creator activity.

Không dựa vào một static role.

---

# 5. `/personal/assessments`

Đây là Assessment Catalog.

Luồng:

```text
Explore
   ↓
Search / Filter
   ↓
Assessment Detail
   ↓
Eligibility
   ↓
Take Assessment
```

Trang hiện đã có:

- search;
- filter;
- empty states;
- assessment card;
- API dữ liệu thật.

## Đánh giá

**GIỮ.**

Nên chuẩn hóa filter theo:

```text
Domain
Assessment Type
Difficulty
FREE / Premium
Duration
Certification Eligibility
```

---

# 6. Assessment Lifecycle

Hiện lifecycle vẫn phụ thuộc khá nhiều vào:

```text
is_published = true / false
```

Về lâu dài nên chuyển sang state machine.

```text
DRAFT
  ↓
READY
  ↓
IN_REVIEW
  ↓
PUBLISHED
  ↓
RETIRED
  ↓
ARCHIVED
```

Điều này quan trọng khi NEXA có:

- đề cá nhân;
- đề tổ chức;
- đề hệ thống;
- đề đóng góp cộng đồng.

---

# 7. `/personal/assessments/[id]`

Đây là landing page trước khi thi.

Trang hiện hiển thị:

- mô tả;
- thời lượng;
- cấu trúc câu hỏi;
- quy chế;
- thang điểm;
- quyền truy cập;
- VIP gate;
- CTA bắt đầu.

Luồng này hợp lý:

```text
Catalog
   ↓
Assessment Information
   ↓
Eligibility Gate
   ↓
Take Assessment
```

## Đánh giá

**GIỮ.**

Không nên bỏ trang này để nhảy thẳng vào Exam Player.

---

# 8. `/personal/take/[id]`

Đây là Exam Player.

Hiện là một trong những component lớn nhất repo.

Use case:

```text
Load Assessment
       ↓
Stage 1 Objective
       ↓
Anti-tab Monitoring
       ↓
Lock Objective Stage
       ↓
Stage 2 Practical
       ↓
Evidence
       ↓
Submit
       ↓
Objective Scoring
```

Trang hỗ trợ:

- MCQ;
- Scenario;
- Practical;
- Text response;
- URL evidence;
- Upload;
- Timer;
- Live Room mode;
- Tab monitoring.

---

# 9. Exam Player đang quá lớn

`take/[id]` hiện vượt khoảng 1.000 dòng.

Nên chia thành:

```text
ExamPlayer/
├── ExamPlayer.tsx
├── ExamHeader.tsx
├── ExamTimer.tsx
├── QuestionNavigator.tsx
├── ObjectiveStage.tsx
├── PracticalStage.tsx
├── EvidenceUploader.tsx
├── ProctoringGuard.tsx
├── SubmitDialog.tsx
└── hooks/
    ├── useExamSession.ts
    ├── useExamTimer.ts
    └── useProctoring.ts
```

Việc này giảm nguy cơ regression khi bổ sung:

- autosave;
- reconnect;
- Live Exam;
- proctoring;
- multi-attempt.

---

# 10. Result đang bị render hai lần

Sau khi nộp bài, `take/[id]` đang tự render:

- điểm;
- practical pending;
- AI actions;
- navigation.

Trong khi hệ thống đã có route:

```text
/personal/assessments/[id]/result
```

Đây là duplication.

## Flow nên là

```text
POST /submit
      ↓
submissionId
      ↓
router.replace(...)
      ↓
/personal/assessments/:id/result?submission=:submissionId
```

Exam Player chỉ làm nhiệm vụ thi.

Result Page chịu trách nhiệm hiển thị kết quả.

---

# 11. Result Page nên là canonical

Result nên là single source of truth cho:

```text
Assessment
     ↓
Submission
     ↓
Result
     ├── Objective Score
     ├── Human Grading Pending
     ├── AI Draft
     └── Final Grade
```

Quan trọng: Result phải gắn với:

```text
submissionId
```

không chỉ:

```text
assessmentId
```

vì một Assessment có thể có nhiều attempt.

---

# 12. `/personal/competency`

Use case:

> Năng lực hiện tại của tôi ở 5 miền như thế nào?

Trang nên chỉ tập trung vào measurement:

```text
WHAT IS MY CURRENT LEVEL?
```

Nên hiển thị:

- radar;
- domain score;
- skill score;
- evidence count;
- source assessments;
- historical trend.

## Đánh giá

**GIỮ.**

Không nên biến trang này thành Learning Path thứ hai.

---

# 13. Phân biệt Radar / AI Analysis / Learning Path

Ba trang hiện đang overlap.

Chúng phải trả lời ba câu hỏi khác nhau.

## Radar

```text
WHAT IS MY CURRENT LEVEL?
```

Nội dung:

- score;
- domain;
- skill;
- history;
- evidence.

---

## AI Analysis

```text
WHY DID I GET THIS RESULT?
```

Nội dung:

- overall diagnosis;
- strengths;
- weaknesses;
- skill gaps;
- root cause;
- evidence;
- AI explanation.

---

## Learning Path

```text
WHAT SHOULD I DO NEXT?
```

Nội dung:

- learning modules;
- progress;
- recommended sequence;
- completion;
- re-assessment.

---

# 14. `/personal/competency/analysis`

Trang hiện có:

```text
Radar
Overall Level
Strengths
Weaknesses
Skill Gaps
AI Feedback
Recommended Courses
4-Step Learning Path
```

Nội dung này đang overlap với `/personal/learning-path`.

## Đề xuất

Analysis chỉ nên giữ:

```text
BÁO CÁO CHẨN ĐOÁN

Overall Level
      ↓
Radar
      ↓
Strengths
      ↓
Weaknesses
      ↓
Skill Gaps
      ↓
Evidence / Explanation
```

Learning Path chỉ link qua.

---

# 15. `/personal/learning-path`

Learning Path nên trở thành execution workspace.

Luồng:

```text
Skill Gap
   ↓
Learning Module
   ↓
Start
   ↓
Progress
   ↓
Complete
   ↓
Re-assess
   ↓
Compare New Result
```

Không cần hiển thị lại toàn bộ báo cáo AI.

---

# 16. Leaderboard

Leaderboard phải được xây từ:

```text
Gamification Points
```

không phải:

```text
Assessment Score
```

và không phải:

```text
Competency Level
```

Ba hệ thống phải tách biệt:

```text
Assessment Score ≠ Competency Level ≠ Gamification Points
```

## Đánh giá

**GIỮ.**

---

# 17. Class / Group / Live Room đang bị trộn

Đây là lỗi domain lớn nhất hiện tại.

Trang:

```text
/personal/groups
```

mang tên “Nhóm học tập”.

Nhưng implementation đang lấy:

```text
room_participants
exam_rooms
```

và biến Live Exam Room thành Group.

Trang còn gọi:

```text
POST /api/rooms/join
```

để thực hiện:

> Tham gia nhóm bằng mã.

Nhưng `/api/rooms/join` thực tế là API tham gia Live Exam Room bằng PIN.

---

# 18. Ba khái niệm phải tách

## CLASS

Persistent.

```text
Class
├── Members
├── Assignments
├── Posts
├── Messages
└── Files
```

---

## LIVE ROOM

Temporary.

```text
Live Room
├── PIN
├── Waiting Room
├── Participants
├── Proctoring
└── Session Lifecycle
```

---

## ASSIGNMENT

Một Assessment được giao cho Class.

```text
Assignment
├── Assessment
├── Deadline
├── Policy
├── Attempts
└── Submission Status
```

Ba domain này không được dùng thay thế cho nhau.

---

# 19. Bug giữa Group List và Group Detail

Group List hiện lấy:

```text
exam_rooms.id
```

sau đó link:

```text
/personal/groups/{examRoomId}
```

Nhưng Group Detail lại gọi:

```text
/api/classes/{groupId}
```

API này query:

```text
evaluator_classes
```

Tức flow hiện tại:

```text
exam_room UUID
      ↓
/personal/groups/:id
      ↓
Classes API
      ↓
evaluator_classes UUID expected
```

Đây là hai loại ID khác nhau.

## Kết luận

Khả năng cao Group Detail hiện đang broken trong use case thực.

---

# 20. Kiến trúc route Class đề xuất

Có thể giữ từ “groups” nếu muốn UX thân thiện.

Nhưng domain phải sử dụng class.

Ví dụ:

```text
/personal/classes
/personal/classes/:classId
```

hoặc:

```text
/personal/groups
/personal/groups/:classId
```

nhưng datasource phải là:

```text
evaluator_classes
class_members
class_assignments
```

không phải `exam_rooms`.

---

# 21. `/personal/submissions`

Trang hiện mang tên:

> Nhiệm vụ & Cổng Nộp Bài

Nhưng datasource cũng đang lấy:

```text
room_participants
exam_rooms
```

rồi dựng thành Assignment.

Đây không phải Assignment thật.

Trong database đã có domain:

```text
class_assignments
```

nên cần sử dụng đúng domain đó.

---

# 22. Turn-in hiện mới là UI simulation

`handleTurnIn()` hiện:

```text
setTimeout(...)
↓
update React state
↓
success
```

Không:

- upload thật;
- tạo submission thật;
- lưu DB;
- tạo timestamp server;
- ghi audit.

Reload page sẽ mất.

## Flow đúng

```text
class_assignments
       ↓
Assignment Detail
       ↓
Evidence Upload
       ↓
assignment_submission
       ↓
submitted_at
       ↓
Grading
       ↓
Feedback
```

---

# 23. `/personal/credentials`

Use case:

```text
Eligible Result
      ↓
Credential Generation
      ↓
Credential Wallet
      ↓
PDF / QR
      ↓
Public Verification
```

## Đánh giá

**GIỮ.**

Nên có state:

```text
ELIGIBLE
ISSUED
REVOKED
EXPIRED
```

---

# 24. `/personal/authoring`

Đây là một trong những thay đổi tốt nhất sau refactor.

Use case:

```text
My Assessments
├── Create
├── Edit
├── Launch Live
├── Assign to Class
└── Archive/Delete
```

Shared Assessment Studio được reuse giữa Admin và Personal là quyết định đúng.

---

# 25. Personal Authoring đang gọi Admin API

Một số action Personal đang gọi:

```text
/api/admin/assessments/*
```

Ví dụ:

- delete assessment;
- load assessment cho Live Room.

Đây là API boundary không tốt.

Personal Creator không nên phụ thuộc namespace Admin.

## Đề xuất

```text
/api/authoring/assessments
```

hoặc:

```text
/api/assessments/mine
/api/assessments/:id
```

Endpoint tự kiểm:

```text
owner
workspace
organization scope
permission
```

---

# 26. `/personal/exams` là legacy

Route này vẫn tồn tại và component còn tên:

```text
EvaluatorExamsPage
```

Nó overlap gần như hoàn toàn với:

```text
/personal/authoring
```

## Đề xuất

```text
/personal/exams
      ↓
HTTP 308
      ↓
/personal/authoring
```

Sau một giai đoạn migration có thể xóa code cũ.

---

# 27. `/personal/live-room`

Đây nên là Live Session Manager.

Use case:

```text
Select Assessment
      ↓
Select OPEN / GROUP_ONLY
      ↓
Create Session
      ↓
Generate PIN / QR
      ↓
Waiting
      ↓
Start
      ↓
Control
      ↓
End
```

## Đánh giá

**GIỮ.**

---

# 28. Live Room lifecycle

Nên hiển thị session theo trạng thái:

```text
SCHEDULED
WAITING
ACTIVE
LOCKED
ENDED
CANCELLED
```

UI nên chia:

```text
Sắp diễn ra
Đang chờ
Đang thi
Đã kết thúc
```

thay vì chỉ hiển thị phòng đang mở.

---

# 29. `/personal/live-pin`

Đây mới là đúng nơi dùng:

```text
/api/rooms/join
```

Flow:

```text
PIN
 ↓
Validate Room
 ↓
Validate Access Policy
 ↓
Join Participant
 ↓
Waiting Room
 ↓
Exam
```

## Đánh giá

**GIỮ.**

Không dùng Room Join API cho Class/Group.

---

# 30. `/personal/grading`

Đây là một trong những use case quan trọng nhất của NEXA.

Flow mục tiêu:

```text
Grading Queue
      ↓
Submission
      ↓
Rubric
   ┌──┴───┐
 Manual   AI Draft
   └──┬───┘
    Reviewer
       ↓
Final Grade
```

Split View hiện tại phù hợp cho workflow này.

---

# 31. Grading State Machine

Nên chuẩn hóa:

```text
PENDING
   ↓
AI_DRAFT
   ↓
HUMAN_REVIEW
   ↓
FINALIZED
```

Ngoài ra:

```text
RETURNED_FOR_REVISION
REOPENED
```

nếu cần.

AI output chỉ là:

```text
suggestion
```

không mặc định là:

```text
final academic grade
```

---

# 32. `/personal/item-bank`

Trang hiện sử dụng dữ liệu thật:

```text
question_bank_items
competencies
```

Đây là bước tiến tốt.

Use case mục tiêu:

```text
Question Bank Item
      │
      ├── Reusable
      ├── Versioned
      ├── User / Org Scope
      └── Copy into Assessment Version
```

---

# 33. Không liên kết trực tiếp Assessment với Bank Item mutable

Nếu sửa Question Bank Item sau khi một Assessment đã có người thi, nội dung Assessment cũ không được thay đổi.

Nên có:

```text
Bank Item
   ↓
Assessment Item Snapshot
```

hoặc version reference immutable.

---

# 34. Community Contribution

Flow mục tiêu:

```text
Contributor
    ↓
SUBMITTED
    ↓
Admin Review
 ┌────┴────┐
APPROVE   REJECT
   ↓
Bank Item
   ↓
Optional Publication
```

Không nên:

```text
APPROVED = SYSTEM_PUBLIC
```

Nên tách:

```text
SUBMITTED
→ APPROVED_TO_BANK
→ BANK_ITEM
→ INCLUDED_IN_ASSESSMENT
→ PUBLISHED
```

---

# 35. `/personal/settings`

Trang hiện có nhiều setting:

```text
publicCredentials
showOnLeaderboard
shareSkillBadges
notifyNewAssessment
notifyDeadline24h
notifyAiAnalysisReady
```

nhưng chưa persistence server.

`Save` hiện chủ yếu là local UI state.

## Vấn đề UX

Không nên hiển thị:

> Đã lưu thành công

nếu refresh sẽ mất.

## Đề xuất

Hoặc:

1. triển khai API persistence;
2. hoặc tạm ẩn các setting chưa hoạt động.

---

# 36. `/personal/billing`

Billing hiện có:

- service plans;
- create payment intent;
- QR;
- transaction status.

Nhưng page đang gọi:

```text
/api/profile
```

trong khi route hiện có là:

```text
/api/personal/profile
```

Khả năng đây là lỗi rename sau refactor.

Ngoài ra Dev Webhook Simulator không nên xuất hiện ở production.

---

# 37. Organization Workspace

Sidebar Organization hiện có:

```text
Tổng quan tổ chức
Thành viên & Phân quyền
Đề thi tổ chức
Nhóm & Lớp học
Báo cáo & Phân tích
Ngân sách & Quota AI
Cài đặt tổ chức
```

Về Information Architecture, đây là một cấu trúc B2B tốt.

---

# 38. Organization Access Model

Organization layout đã kiểm tra:

```text
Authenticated User
        +
Active Organization
        +
Active Membership
```

trước khi truy cập.

Đây là đúng boundary.

Workspace role có thể gồm:

```text
ORG_OWNER
ORG_ADMIN
ASSESSOR
REPORT_VIEWER
MEMBER
```

---

# 39. `/org/[slug]`

Dashboard hiện hiển thị:

- members;
- assessments;
- classes;
- analytics shortcuts.

## Đánh giá

MVP tốt.

Sau này có thể bổ sung:

```text
Pending Grading
Upcoming Assessments
AI Quota
Active Members
Recent Activity
```

nhưng không nên nhồi quá nhiều KPI.

---

# 40. `/org/[slug]/members`

Tên trang:

> Thành viên & Phân quyền

nhưng hiện chủ yếu mới là danh sách.

Ngoài ra Sidebar hiện cho mọi organization member nhìn thấy route này.

Cần quyết định rõ permission.

Ví dụ:

```text
MEMBER
→ limited directory

ASSESSOR
→ only learners/classes they manage

REPORT_VIEWER
→ aggregated reporting

ORG_ADMIN
→ full membership management
```

---

# 41. Org Assessments đang bị mất workspace context

Trang:

```text
/org/:slug/assessments
```

nhưng CTA tạo/chỉnh đề lại đưa về:

```text
/personal/authoring
```

Điều này làm mất context.

Ví dụ user đang ở:

```text
FPT Polytechnic Workspace
```

bấm “Tạo đề”.

Nếu chuyển về Personal thì không rõ assessment mới thuộc:

```text
Personal?
Organization?
```

---

# 42. Organization Assessment Studio

Nên có route:

```text
/org/:slug/assessments/new
/org/:slug/assessments/:id
```

và Assessment Studio nhận context:

```text
workspace.type = ORGANIZATION
workspace.organizationId = ...
```

Khi save:

```text
scope = ORGANIZATION
organization_id = currentOrg
```

---

# 43. Org Classes cũng bị workspace leak

Trang:

```text
/org/:slug/classes
```

hiện CTA lại link:

```text
/personal/groups
```

và Class Detail cũng link sang Personal.

Đây là sai boundary.

## Nên có

```text
/org/:slug/classes
/org/:slug/classes/new
/org/:slug/classes/:classId
```

---

# 44. Class Scope Model

Một Class có thể thuộc:

## Personal

```text
owner_id = user.id
organization_id = null
```

## Organization

```text
organization_id = currentOrg
```

Không cần hai bảng Class khác nhau.

Chỉ khác scope.

---

# 45. Org Analytics

Hiện đã có:

- submission count;
- pass rate;
- radar organization.

MVP phù hợp.

Về lâu dài cần filter:

```text
Organization
  ↓
Department/Class
  ↓
Assessment
  ↓
Time Range
```

Metrics:

```text
Participation
Completion
Pass Rate
Score Distribution
Competency Radar
Skill Gap
```

---

# 46. Org AI Quota

Use case đúng:

```text
Monthly Quota
Used
Remaining
Usage Events
```

Sidebar chỉ hiển thị cho manager là quyết định hợp lý.

Pattern tương tự nên áp dụng cho:

```text
Member Management
Organization Billing
Danger Zone
```

---

# 47. Organization Settings

Trang hiện có:

```text
Identity
Entitlements
Member Seats
Assessment Quota
Security Policy
Sharing Policy
AI Privacy
Danger Zone
```

Đây là structure tốt.

Tuy nhiên phần lớn hiện mang tính policy/status display hơn CRUD.

Có thể đặt tên:

```text
Organization Settings & Policies
```

sẽ chính xác hơn.

---

# 48. Admin Dashboard IA

Admin hiện chia:

```text
Điều hành & Báo cáo
├── Tổng quan hệ thống
└── Báo cáo phân tích

Người dùng & Tổ chức
├── Quản lý người dùng
└── Trường học & Doanh nghiệp

Nội dung & Khảo thí
├── Đề thi hệ thống
├── Khung năng lực
└── Duyệt đề cộng đồng

Tài chính & Gói dịch vụ
├── Cấu hình gói
└── Giao dịch & Đối soát

Hệ thống & AI
├── AI Gateway
├── Compliance
└── Settings
```

## Đánh giá IA

Khoảng:

```text
8/10
```

---

# 49. `/admin/dashboard`

Admin Dashboard hiện không chỉ hiển thị KPI mà đã có work queue:

```text
Contribution Pending
B2B Inquiry Pending
Payment Pending
Recent Submissions
```

Đây là đúng hướng.

Dashboard Admin nên ưu tiên:

```text
CẦN XỬ LÝ
```

trước:

```text
KPI TRANG TRÍ
```

---

# 50. `/admin/users`

Trang hiện hỗ trợ:

- search;
- role filter;
- plan filter;
- edit user;
- change role;
- change plan;
- organization info.

Sau refactor workspace, quan niệm:

```text
1 Email = 1 business role cố định
```

không còn phù hợp.

---

# 51. Account Role Model đề xuất

Account-level role chỉ nên có:

```text
USER
PLATFORM_ADMIN
```

Business permission đến từ resource relationship:

```text
Creator
Assessor
Org Admin
Report Viewer
Member
```

Ví dụ:

```text
user_organizations
org_role = ORG_ADMIN
```

hoặc:

```text
class.owner_id = user.id
```

---

# 52. `/admin/evaluators`

Route hiện chỉ redirect:

```text
/admin/evaluators
      ↓
/admin/users
```

Đây là legacy route.

Có thể giữ trong thời gian migration rồi xóa.

---

# 53. `/admin/organizations`

Đây là một trong những trang Admin hoàn thiện hơn.

Có:

```text
List
Search
Create Organization
Status
Invite Administrator
Campus Configuration
```

Nên bổ sung Organization Detail:

```text
/admin/organizations/:id
```

Trang Detail có thể bao gồm:

```text
Overview
Members
Subscription
Quota
Assessments
Classes
AI Usage
Payments
Audit
```

---

# 54. Admin Assessment Studio

Shared Assessment Studio là quyết định tốt.

```text
Admin
  └── AssessmentStudio

Personal Creator
  └── AssessmentStudio

Organization
  └── AssessmentStudio
```

Khác biệt nằm ở policy.

---

# 55. Assessment Scope Model

## SYSTEM

```text
scope = SYSTEM
```

Admin có quyền public toàn nền tảng.

## PERSONAL

```text
scope = PERSONAL
owner_id = user
```

Creator sử dụng cá nhân.

## ORGANIZATION

```text
scope = ORGANIZATION
organization_id = org
```

Chỉ dùng trong tenant.

---

# 56. Framework Manager

Framework là một domain quan trọng của NEXA.

Cấu trúc:

```text
Framework
   ↓
Domain
   ↓
Competency
   ↓
Indicator
```

Nhưng cần versioning.

Ví dụ:

```text
DigComp v2.2
DigComp v3.0
NEXA Custom v1
```

Mọi Submission phải lưu:

```text
framework_version_id
```

Không sửa trực tiếp framework đã dùng cho lịch sử.

---

# 57. Admin Plans

`service_plans` đã trở thành datasource thật.

Use case:

```text
Create Plan
Edit Plan
Enable / Disable
Price
AI Credits
Member Limit
Features
```

Đây là đúng hướng.

---

# 58. Admin Transactions

Use case:

```text
Payment
   ↓
PENDING
   ↓
Verification
   ↓
SUCCESS / FAILED
```

Admin hỗ trợ manual reconciliation.

Đây là domain đúng.

Các lỗ hổng security Payment/Webhook đã được review riêng và phải sửa trước production.

---

# 59. AI Gateway vs Settings

Hai trang nên tách rõ.

## AI Operations

```text
/admin/ai-gateway
```

Phục vụ:

```text
Usage
Latency
Error
Models
Cost
Logs
```

## AI Configuration

```text
/admin/settings?tab=ai
```

Phục vụ:

```text
Provider
API Keys
Default Models
Flow Policies
Timeout
Fallback
```

Không nên để cả hai trang cùng sửa cùng một setting.

---

# 60. Compliance hiện đang chứa hai domain

Trang Compliance đang gộp:

```text
Privacy / Consent
+
Exam Integrity / Proctoring
```

Hai domain này nên được tách concept.

Có thể giữ một page nhưng chia:

```text
Security & Compliance

├── Privacy & Consent
├── Audit Log
└── Exam Integrity
```

---

# 61. Admin đang thiếu Credential Management

Hiện người dùng có:

```text
Credential Wallet
Public Verification
```

nhưng Admin chưa có công cụ đầy đủ:

```text
Search Credential
Inspect
Revoke
Restore
Reason
Audit
```

Nên có:

```text
/admin/credentials
```

---

# 62. Admin đang thiếu Live Operations

Nền tảng có Live Exam nhưng Admin chưa có Control Plane toàn hệ thống.

Nên có:

```text
/admin/live
```

Use case:

```text
All Active Rooms
Organization
Room Owner
Participant Count
Incident
Emergency Lock
Emergency End
```

Có thể triển khai sau MVP.

---

# 63. Domain Architecture mục tiêu

```text
USER
│
├── PERSONAL WORKSPACE
│    │
│    ├── Learning
│    │    ├── Assessments
│    │    ├── Attempts
│    │    ├── Competency
│    │    ├── Learning Path
│    │    └── Credentials
│    │
│    ├── Classes
│    │    ├── Membership
│    │    ├── Assignments
│    │    ├── Files
│    │    └── Discussion
│    │
│    └── Creator
│         ├── Assessment Authoring
│         ├── Question Bank
│         ├── Live Sessions
│         └── Grading
│
├── ORGANIZATION WORKSPACE
│    │
│    ├── Members
│    ├── Classes
│    ├── Assessments
│    ├── Live Sessions
│    ├── Grading
│    ├── Analytics
│    └── AI Quotas
│
└── PLATFORM ADMIN
     │
     ├── Users
     ├── Organizations
     ├── Frameworks
     ├── System Content
     ├── Contributions
     ├── Billing
     ├── AI Operations
     ├── Credentials
     ├── Compliance
     └── Audit
```

---

# 64. Bốn domain không được trộn

Đây là rule kiến trúc quan trọng.

## Class

```text
CLASS
│
├── Members
├── Assignments
├── Posts
├── Messages
└── Files
```

Persistent resource.

---

## Assignment

```text
ASSIGNMENT
│
├── Class
├── Assessment
├── Deadline
├── Policy
└── Submission State
```

---

## Live Room

```text
LIVE ROOM
│
├── Assessment
├── PIN
├── Session
├── Participants
└── Proctoring
```

Temporary session.

---

## Submission

```text
SUBMISSION
│
├── User
├── Assessment
├── Assignment?
├── Live Room?
├── Answers
├── Evidence
└── Grading
```

---

# 65. Architectural Guardrails

Phải duy trì:

```text
ASSESSMENT ≠ LIVE ROOM
CLASS ≠ LIVE ROOM
ASSIGNMENT ≠ ROOM PARTICIPANT
SUBMISSION ≠ FILE UPLOAD
QUESTION BANK ITEM ≠ ASSESSMENT ITEM VERSION
AI EVALUATION ≠ FINAL GRADE
ASSESSMENT SCORE ≠ COMPETENCY SCORE ≠ GAMIFICATION POINTS
```

---

# 66. Đề xuất route mục tiêu

## Personal

```text
/personal/dashboard

/personal/assessments
/personal/assessments/:id
/personal/attempts/:submissionId/result

/personal/competency
/personal/competency/analysis/:submissionId
/personal/learning-path

/personal/classes
/personal/classes/:classId
/personal/classes/:classId/assignments/:assignmentId

/personal/authoring
/personal/authoring/new
/personal/authoring/:assessmentId

/personal/item-bank

/personal/live
/personal/live/join

/personal/grading
/personal/credentials
/personal/leaderboard

/personal/profile
/personal/settings
/personal/billing
```

---

## Organization

```text
/org/:slug

/org/:slug/members

/org/:slug/assessments
/org/:slug/assessments/new
/org/:slug/assessments/:assessmentId

/org/:slug/classes
/org/:slug/classes/new
/org/:slug/classes/:classId

/org/:slug/live
/org/:slug/grading

/org/:slug/analytics
/org/:slug/ai-quota
/org/:slug/settings
```

---

## Admin

```text
/admin/dashboard
/admin/analytics

/admin/users

/admin/organizations
/admin/organizations/:id

/admin/content
/admin/frameworks
/admin/contributions

/admin/plans
/admin/transactions

/admin/credentials
/admin/live

/admin/ai-gateway
/admin/compliance
/admin/audit
/admin/settings
```

---

# 67. Route cần giữ / refactor / xóa

| Route | Quyết định |
|---|---|
| `/personal/dashboard` | **GIỮ**, thêm Creator Work Queue |
| `/personal/assessments` | **GIỮ** |
| `/personal/assessments/[id]` | **GIỮ** |
| `/personal/take/[id]` | **GIỮ**, bỏ Result duplicate |
| `/personal/assessments/[id]/result` | **GIỮ**, làm canonical |
| `/personal/competency` | **GIỮ** |
| `/personal/competency/analysis` | **GIỮ**, chỉ diagnostic |
| `/personal/learning-path` | **GIỮ**, chỉ learning execution |
| `/personal/groups` | **REFACTOR LỚN** sang Class |
| `/personal/submissions` | **REFACTOR LỚN** sang Assignment |
| `/personal/exams` | **REDIRECT / XÓA** |
| `/personal/authoring` | **GIỮ** |
| `/personal/live-room` | **GIỮ** |
| `/personal/live-pin` | **GIỮ** |
| `/personal/live-pin/waiting-room` | **LEGACY REDIRECT** |
| `/personal/grading` | **GIỮ** |
| `/personal/item-bank` | **GIỮ** |
| `/personal/settings` | **NỐI DB hoặc ẨN SAVE** |
| `/org/:slug/assessments` | **REFACTOR workspace context** |
| `/org/:slug/classes` | **REFACTOR workspace context** |
| `/org/:slug/members` | **ROLE GATE** |
| `/admin/evaluators` | **LEGACY REDIRECT** |
| `/admin/credentials` | **THIẾU — NÊN THÊM** |
| `/admin/live` | **THIẾU — NÊN THÊM** |

---

# 68. Mức độ hoàn thiện theo Use Case

| Phân hệ | Ước lượng |
|---|---:|
| Assessment Flow | **80%** |
| Competency / AI | **80%** |
| Assessment Authoring | **70%** |
| Grading | **70%** |
| Live Exam | **70%** |
| Credential | **60%** |
| Class / Group | **40%** |
| Assignment / Turn-in | **20–30%** |
| Organization Workspace | **50%** |
| Billing | **60%**, chưa production-safe |
| Admin Operations | **70%** |

Các phần trăm trên phản ánh **end-to-end business flow**, không chỉ mức độ hoàn thiện giao diện.

---

# 69. Priority Backlog

## P0 — Sửa domain đang broken

### P0.1. Class / Group

Không dùng:

```text
exam_rooms
room_participants
```

làm datasource của:

```text
Groups
Classes
```

Chuyển sang:

```text
evaluator_classes
class_members
class_assignments
```

---

### P0.2. Assignment / Submission

Xây workflow thật:

```text
Class Assignment
      ↓
Learner Assignment Inbox
      ↓
Open Assessment
      ↓
Submission
      ↓
Turn In
      ↓
Grading
```

---

### P0.3. Org Workspace Context

Không cho:

```text
/org/*
```

nhảy về:

```text
/personal/*
```

để tạo hoặc sửa tài nguyên thuộc Organization.

---

# 70. P1 — Chuẩn hóa Assessment lifecycle

Thêm:

```text
scope
lifecycle_status
version
workspace_owner
```

Ví dụ:

```text
scope:
PERSONAL
ORGANIZATION
SYSTEM
```

---

# 71. P1 — Chuẩn hóa Submission lifecycle

```text
IN_PROGRESS
SUBMITTED
AUTO_GRADED
AI_DRAFT
HUMAN_REVIEW
FINALIZED
RETURNED
```

---

# 72. P1 — Chuẩn hóa Learning Evidence

Một submission nên tạo:

```text
Assessment Result
      ↓
Competency Evidence
      ↓
Competency Snapshot
      ↓
Long-term Profile
```

Không trực tiếp ghi đè Radar.

---

# 73. P1 — Framework Versioning

Mọi assessment và submission phải tham chiếu framework version.

```text
Assessment Version
      ↓
Framework Version
```

Không để chỉnh framework hiện tại làm thay đổi lịch sử.

---

# 74. P2 — Organization SaaS

Sau khi Class/Assignment ổn định mới tiếp tục:

```text
Organization Assessment Studio
Organization Grading
Organization Live Sessions
Organization Entitlements
Organization Reports
```

---

# 75. P2 — Admin Operations

Bổ sung:

```text
Credential Administration
Live Operations
Audit Logs
Incident Review
```

---

# 76. User Journey mục tiêu

## Learning Journey

```text
Đăng ký
   ↓
Onboarding
   ↓
Assessment Catalog
   ↓
Assessment
   ↓
Submission
   ↓
Result
   ↓
Competency Evidence
   ↓
Radar
   ↓
AI Analysis
   ↓
Learning Path
   ↓
Module
   ↓
Re-assessment
   ↓
Progress
   ↓
Credential
```

---

# 77. Creator Journey

```text
Personal Workspace
      ↓
Question Bank
      ↓
Assessment Studio
      ↓
Draft
      ↓
Ready
   ┌──┴─────────┐
   ↓            ↓
Assignment    Live Room
   ↓            ↓
Class        Participants
   └────┬───────┘
        ↓
   Submissions
        ↓
   Grading Queue
        ↓
Manual / AI Draft
        ↓
Final Grade
```

---

# 78. Organization Journey

```text
Admin creates Organization
       ↓
Invite ORG_ADMIN
       ↓
Accept Invitation
       ↓
Organization Workspace
       ↓
Invite Members
       ↓
Create Classes
       ↓
Create Org Assessments
       ↓
Assign / Live Exam
       ↓
Submissions
       ↓
Grading
       ↓
Organization Analytics
       ↓
Competency Reports
```

---

# 79. Platform Admin Journey

```text
Platform Admin
│
├── Users
├── Organizations
├── Framework
├── System Assessments
├── Community Review
├── Billing
├── AI Operations
├── Compliance
├── Credentials
└── Audit
```

Admin Dashboard phải là:

```text
Control Plane
```

không chỉ là trang thống kê.

---

# 80. Kết luận

Sau đợt refactor Personal/Organization Workspace, kiến trúc NEXA đã đi đúng hướng hơn đáng kể.

Điểm mạnh hiện tại:

- Workspace model hợp lý;
- Assessment flow khá hoàn chỉnh;
- AI/Competency architecture có chiều sâu;
- Assessment Studio reuse tốt;
- Grading Workbench có giá trị sản phẩm cao;
- Organization và Admin IA rõ ràng;
- Question Bank đã bắt đầu dùng dữ liệu thật.

Nhưng một số domain cũ chưa được refactor theo kiến trúc mới.

Đặc biệt:

```text
Class
Assignment
Live Room
Submission
```

đang bị pha trộn.

Đây là vấn đề cần xử lý trước khi tiếp tục mở rộng nhiều tính năng mới.

## Thứ tự nên làm tiếp

```text
1. Class / Group refactor
        ↓
2. Assignment / Submission workflow
        ↓
3. Organization resource scoping
        ↓
4. Assessment + Submission state machine
        ↓
5. Grading lifecycle
        ↓
6. Framework versioning
        ↓
7. Organization B2B flows
        ↓
8. Admin Credentials / Live / Audit
```

Mục tiêu kiến trúc cuối cùng:

> **NEXA không chỉ là một website có nhiều trang đánh giá, mà phải trở thành một Assessment & Digital Competency SaaS có workflow xuyên suốt, resource scope rõ ràng, dữ liệu có lịch sử và các dashboard cùng sử dụng một domain model thống nhất.**