# ĐẶC TẢ CƠ SỞ DỮ LIỆU TOÀN DIỆN (DATABASE SCHEMA, JSONB CONTRACTS & RLS)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-DATABASE`
- **Phiên bản:** `v3.2.0` (Chuẩn hóa 30 Bảng Vật lý, JSONB Schema 4 Hình thức Đánh giá & 5 Ứng dụng AI, Bảng Nhận xét Nhóm, Điểm (point) Rank Top 100+ & RLS 100%)
- **Hệ quản trị CSDL:** Supabase PostgreSQL 15+ (kết hợp Upstash Redis cho Phòng thi trực tiếp, Auto-save 15s & Cache Bảng xếp hạng)
- **Bảo mật dữ liệu:** Kích hoạt Row Level Security (RLS) trên 100% bảng vật lý

---

## 1. BẢNG ÁNH XẠ 30 LỚP KHÁI NIỆM SANG BẢNG CSDL VẬT LÝ

| STT | Lớp khái niệm nghiệp vụ | Tên bảng CSDL Vật lý (`public.*`) | Phân hệ quản lý |
| :-: | :--- | :--- | :--- |
| **01** | Hồ sơ người dùng & Điểm tích lũy (point) | `public.profiles` | 1. Định danh & Xếp hạng |
| **02** | Hồ sơ xác thực chuyên gia đánh giá | `public.evaluator_profiles` | 1. Định danh & Xếp hạng |
| **03** | Tổ chức đối tác (B2B) | `public.organizations` | 1. Định danh & Xếp hạng |
| **04** | Thành viên thuộc tổ chức | `public.user_organizations` | 1. Định danh & Xếp hạng |
| **05** | Nhật ký đồng thuận dữ liệu (NĐ 13) | `public.consent_logs` | 1. Định danh & Xếp hạng |
| **06** | Khung năng lực số (Đa phiên bản động) | `public.assessment_frameworks` | 2. Khung năng lực số động |
| **07** | Miền năng lực số | `public.competency_domains` | 2. Khung năng lực số động |
| **08** | Kỹ năng thành phần | `public.competencies` | 2. Khung năng lực số động |
| **09** | Nhóm học tập / Lớp khảo thí | `public.assessment_groups` | 3. Nhóm, Nhận xét & Phòng thi |
| **10** | Thành viên nhóm học tập | `public.group_members` | 3. Nhóm, Nhận xét & Phòng thi |
| **11** | **Nhận xét của Người đánh giá trong nhóm** | **`public.group_feedbacks`** | **3. Nhóm, Nhận xét & Phòng thi** |
| **12** | Phòng thi trực tiếp (Mở / Theo nhóm) | `public.live_sessions` | 3. Nhóm, Nhận xét & Phòng thi |
| **13** | Ngân hàng câu hỏi (4 hình thức) | `public.questions` | 4. Câu hỏi & Đề đánh giá |
| **14** | Bộ đề đánh giá năng lực số | `public.assessments` | 4. Câu hỏi & Đề đánh giá |
| **15** | Cấu trúc phân bổ câu hỏi trong đề | `public.assessment_questions` | 4. Câu hỏi & Đề đánh giá |
| **16** | Phiên làm bài & Kết quả phân tích AI | `public.assessment_sessions` | 5. Làm bài & Minh chứng số |
| **17** | Câu trả lời, Sản phẩm minh chứng & Giải trình | `public.session_answers` | 5. Làm bài & Minh chứng số |
| **18** | Nhật ký AI chấm điểm từng câu (`AI Call #1`) | `public.ai_evaluation_logs` | 6. Chấm điểm AI & Thẩm định |
| **19** | Thẩm định chuyên gia & Bài mẫu chuẩn | `public.manual_reviews` | 6. Chấm điểm AI & Thẩm định |
| **20** | Kho học liệu chuẩn gắn nhãn kỹ năng | `public.learning_content_items` | 7. Kho học liệu & Lộ trình 4 bước |
| **21** | Lộ trình phát triển cá nhân hóa | `public.learning_pathways` | 7. Kho học liệu & Lộ trình 4 bước |
| **22** | Mẫu phôi chứng chỉ số | `public.certificate_templates` | 8. Chứng chỉ số & Thu hồi |
| **23** | Chứng chỉ số QR (Mã băm SHA-256 kép) | `public.credentials` | 8. Chứng chỉ số & Thu hồi |
| **24** | Biên bản thu hồi chứng chỉ | `public.credential_revocations` | 8. Chứng chỉ số & Thu hồi |
| **25** | Danh mục huy hiệu kỹ năng | `public.badges` | 9. Huy hiệu & Gamification |
| **26** | Thành tích huy hiệu người học đạt được | `public.user_badges` | 9. Huy hiệu & Gamification |
| **27** | Gói dịch vụ thương mại (B2C & B2B) | `public.subscription_plans` | 10. Gói dịch vụ, AI & Kiểm toán |
| **28** | Hóa đơn & Giao dịch VietQR | `public.invoices` | 10. Gói dịch vụ, AI & Kiểm toán |
| **29** | Cấu hình Cổng AI Đa mô hình & Prompt | `public.ai_configurations` | 10. Gói dịch vụ, AI & Kiểm toán |
| **30** | Nhật ký kiểm toán bất biến (Audit Logs) | `public.audit_logs` | 10. Gói dịch vụ, AI & Kiểm toán |

---

## 2. SƠ ĐỒ QUAN HỆ THỰC THỂ TỔNG THỂ (ERD DIAGRAM)

```text
┌─────────────────┐ (1:1) ┌────────────────────────┐ (1:N) ┌────────────────────────┐
│   auth.users    ├──────►│    public.profiles     ├──────►│  public.consent_logs   │
│ (Supabase Auth) │       │ • role (Khóa cố định)  │       │ (Đồng thuận NĐ 13)     │
└─────────────────┘       │ • points, rank_tier │       └────────────────────────┘
                          └───────────┬────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼ (Tạo / Tham gia nhóm)       ▼ (Làm bài đánh giá)          ▼ (Khung năng lực động)
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│   assessment_groups    │   │  assessment_sessions   │   │ assessment_frameworks  │
│ • invite_code (Link/QR)│   │ • domain_scores (JSONB)│   │ (Đa phiên bản động)    │
└───────┬────────┬───────┘   │ • ai_analysis (Ứng dụng│   └───────────┬────────────┘
        │        │           │   AI 2, 3, 4 - JSONB)  │               │ (1:N)
  (1:N) │        │ (1:N)     └───────────┬────────────┘               ▼
        ▼        ▼                       │ (1:N)          ┌────────────────────────┐
┌──────────────┐ ┌────────────────┐      ▼                │   competency_domains   │
│group_members │ │group_feedbacks │ ┌───────────────────┐ └───────────┬────────────┘
└──────────────┘ │(Nhận xét nhóm) │ │  session_answers  │             │ (1:N)
                 └────────────────┘ │ (4 Hình thức thi) │             ▼
                                    └─────────┬─────────┘ ┌────────────────────────┐
                                              │ (1:1)     │      competencies      │
                                              ▼           │ (Ánh xạ Câu hỏi & Học) │
                                    ┌───────────────────┐ └───────────┬────────────┘
                                    │ai_evaluation_logs │             │ (1:N)
                                    │ (AI Call #1)      │             ▼
                                    └─────────┬─────────┘ ┌────────────────────────┐
                                              │ (0..1:1)  │ learning_content_items │
                                              ▼           └───────────┬────────────┘
                                    ┌───────────────────┐             │ (1:N)
                                    │  manual_reviews   │             ▼
                                    │ • is_gold_sample  │ ┌────────────────────────┐
                                    └───────────────────┘ │   learning_pathways    │
                                                          │ (Lộ trình AI 4 bước)   │
                                                          └────────────────────────┘
```

---

## 3. ĐẶC TẢ CHI TIẾT CẤU TRÚC 30 BẢNG VẬT LÝ

### 3.1. Phân hệ 1: Định danh, Vai trò Cố định, Điểm (point) & Tổ chức

#### 1. Bảng `public.profiles` (Hồ sơ người dùng, Vai trò tĩnh & Điểm xếp hạng (point))

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, FK $\rightarrow$ `auth.users(id)` ON DELETE CASCADE | Mã định danh người dùng đồng bộ từ Supabase Auth. |
| `email` | `TEXT` | NOT NULL, UNIQUE | Địa chỉ email đăng nhập. |
| `full_name` | `TEXT` | NOT NULL | Họ và tên hiển thị. |
| `avatar_url` | `TEXT` | NULL | Đường dẫn ảnh đại diện. |
| `role` | `TEXT` | NOT NULL, CHECK `IN ('LEARNER', 'EVALUATOR', 'ADMIN')` | **Vai trò tĩnh cố định** (Trigger chặn cập nhật sau khi tạo). |
| `plan_tier` | `TEXT` | NOT NULL, DEFAULT `'FREE'` | Gói dịch vụ hiện tại (`'FREE'`, `'PRO'`, `'ENTERPRISE'`). |
| `credits` | `INT` | NOT NULL, DEFAULT 3 | Số lượt làm bài / chấm AI còn lại. |
| `points` | `INT` | NOT NULL, DEFAULT 0 | **Tổng điểm tích lũy (point)** phục vụ Bảng xếp hạng Top 100+. |
| `rank_tier` | `TEXT` | NOT NULL, DEFAULT `'NOVICE'` | Cấp bậc năng lực: `'NOVICE'`, `'EXPLORER'`, `'PRACTITIONER'`, `'SPECIALIST'`, `'ELITE'`. |
| `avg_competency_score` | `DECIMAL(5,2)` | NOT NULL, DEFAULT 0.00 | Điểm năng lực số trung bình hiện tại (thang 100). |
| `specialization` | `TEXT` | NULL | Chuyên ngành / Lĩnh vực công tác. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm tạo tài khoản. |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm cập nhật gần nhất. |

#### 2. Bảng `public.evaluator_profiles` (Hồ sơ xác thực Người đánh giá)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã hồ sơ chuyên gia. |
| `user_id` | `UUID` | NOT NULL, UNIQUE, FK $\rightarrow$ `profiles(id)` ON DELETE CASCADE | Tài khoản Người đánh giá. |
| `organization_name` | `TEXT` | NULL | Đơn vị / Trường học công tác. |
| `certificate_url` | `TEXT` | NULL | Tệp văn bằng/chứng chỉ chuyên môn (tùy chọn gửi xác thực). |
| `is_verified_badge` | `BOOLEAN` | NOT NULL, DEFAULT `FALSE` | `TRUE` khi được Chủ nền tảng (Admin) duyệt cấp tích xác thực. |
| `status` | `TEXT` | NOT NULL, DEFAULT `'PENDING'` | `'PENDING'`, `'APPROVED'`, `'REJECTED'`. |
| `reviewed_by` | `UUID` | NULL, FK $\rightarrow$ `profiles(id)` | Admin thực hiện duyệt. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm gửi hồ sơ. |

#### 3. Bảng `public.organizations` (Tổ chức B2B) & 4. Bảng `public.user_organizations`

- `organizations`: `id (UUID PK)`, `name (TEXT)`, `slug (TEXT UNIQUE)`, `type ('ENTERPRISE' | 'EDUCATIONAL' | 'GOVERNMENT')`, `logo_url (TEXT)`, `max_members (INT DEFAULT 50)`, `quota_assessments (INT DEFAULT 500)`, `is_active (BOOLEAN DEFAULT TRUE)`, `created_at (TIMESTAMPTZ)`.
- `user_organizations`: `id (UUID PK)`, `user_id (UUID FK profiles)`, `organization_id (UUID FK organizations)`, `org_role ('ORG_ADMIN' | 'EVALUATOR' | 'MEMBER')`, `status ('ACTIVE' | 'SUSPENDED')`, `created_at (TIMESTAMPTZ)`, `UNIQUE(user_id, organization_id)`.

#### 5. Bảng `public.consent_logs` (Nhật ký đồng thuận Nghị định 13/2023/NĐ-CP)

- `id (UUID PK)`, `user_id (UUID FK profiles)`, `consent_version (TEXT)`, `is_granted (BOOLEAN)`, `ip_address (TEXT)`, `user_agent (TEXT)`, `created_at (TIMESTAMPTZ DEFAULT NOW())`.

---

### 3.2. Phân hệ 2: Khung Năng lực Số Động (Dynamic Framework Engine)

#### 6. Bảng `public.assessment_frameworks` (Phiên bản Khung năng lực số)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã phiên bản khung năng lực. |
| `code` | `TEXT` | NOT NULL, UNIQUE | Mã định danh (ví dụ: `'STD_FRAMEWORK_V1'`, `'STD_FRAMEWORK_V2'`). |
| `title` | `TEXT` | NOT NULL | Tên hiển thị (ví dụ: *"Khung Năng lực Số Chuẩn"*). |
| `version` | `TEXT` | NOT NULL | Số hiệu phiên bản (dùng để quản lý cập nhật tiêu chuẩn). |
| `status` | `TEXT` | NOT NULL, DEFAULT `'ACTIVE'` | `'DRAFT'`, `'ACTIVE'`, `'ARCHIVED'`. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm ban hành trên hệ thống. |

#### 7. Bảng `public.competency_domains` (Các Miền năng lực số)

- `id (UUID PK)`, `framework_id (UUID FK assessment_frameworks ON DELETE CASCADE)`, `domain_index (INT NOT NULL)`, `code (TEXT NOT NULL)`, `title (TEXT NOT NULL)`, `description (TEXT NOT NULL)`, `weight_percent (DECIMAL(5,2) DEFAULT 20.00)`, `UNIQUE(framework_id, domain_index)`.

#### 8. Bảng `public.competencies` (Các Kỹ năng thành phần)

- `id (UUID PK)`, `domain_id (UUID FK competency_domains ON DELETE CASCADE)`, `skill_code (TEXT NOT NULL)`, `title (TEXT NOT NULL)`, `description (TEXT NOT NULL)`, `behavioral_indicators (JSONB DEFAULT '[]')` (chứa mô tả chuẩn đầu ra làm tri thức Tầng 1 cho AI), `target_level (INT DEFAULT 4)`.

---

### 3.3. Phân hệ 3: Nhóm Học tập, Nhận xét của Người đánh giá & Phòng thi Trực tiếp

#### 9. Bảng `public.assessment_groups` (Nhóm / Lớp học tập)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã nhóm học tập. |
| `evaluator_id` | `UUID` | NOT NULL, FK $\rightarrow$ `profiles(id)` | Người đánh giá tạo và quản lý nhóm. |
| `organization_id` | `UUID` | NULL, FK $\rightarrow$ `organizations(id)` | Tổ chức chủ quản (nếu thuộc gói Enterprise). |
| `name` | `TEXT` | NOT NULL | Tên nhóm/lớp. |
| `invite_code` | `VARCHAR(12)` | NOT NULL, UNIQUE | **Mã nhóm** (dùng cho cả ô nhập mã, Link `?join=CODE` và QR Code). |
| `description` | `TEXT` | NULL | Mục tiêu rèn luyện và đánh giá của nhóm. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm tạo nhóm. |

#### 10. Bảng `public.group_members` (Thành viên tham gia nhóm)

- `id (UUID PK)`, `group_id (UUID FK assessment_groups ON DELETE CASCADE)`, `learner_id (UUID FK profiles ON DELETE CASCADE)`, `joined_via ('LINK' | 'CODE' | 'QR' | 'IMPORT')`, `status ('ACTIVE' | 'ARCHIVED')`, `joined_at (TIMESTAMPTZ DEFAULT NOW())`, `UNIQUE(group_id, learner_id)`.

#### 11. Bảng `public.group_feedbacks` (Nhận xét trực tiếp của Người đánh giá gửi cho Người học)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã bản ghi nhận xét. |
| `group_id` | `UUID` | NOT NULL, FK $\rightarrow$ `assessment_groups(id)` ON DELETE CASCADE | Nhóm học tập mà học viên tham gia. |
| `evaluator_id` | `UUID` | NOT NULL, FK $\rightarrow$ `profiles(id)` | Người đánh giá gửi lời nhận xét. |
| `learner_id` | `UUID` | NOT NULL, FK $\rightarrow$ `profiles(id)` ON DELETE CASCADE | Người học nhận lời nhận xét. |
| `session_id` | `UUID` | NULL, FK $\rightarrow$ `assessment_sessions(id)` | Đính kèm với một phiên bài thi cụ thể (hoặc `NULL` nếu là nhận xét định kỳ chung). |
| `title` | `TEXT` | NOT NULL | Tiêu đề nhận xét (ví dụ: *"Đánh giá tiến độ năng lực tháng 10"*). |
| `feedback_text` | `TEXT` | NOT NULL | Nội dung nhận xét chuyên môn, lời khuyên và hướng dẫn từ Người đánh giá. |
| `is_read` | `BOOLEAN` | NOT NULL, DEFAULT `FALSE` | Trạng thái người học đã đọc thông báo nhận xét. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm gửi nhận xét. |

#### 12. Bảng `public.live_sessions` (Phòng thi trực tiếp — Hỗ trợ cả Mở và Theo nhóm)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã phòng thi trực tiếp. |
| `assessment_id` | `UUID` | NOT NULL, FK $\rightarrow$ `assessments(id)` | Bộ đề thi được sử dụng. |
| `evaluator_id` | `UUID` | NOT NULL, FK $\rightarrow$ `profiles(id)` | Người đánh giá điều phối phòng thi. |
| `group_id` | `UUID` | NULL, FK $\rightarrow$ `assessment_groups(id)` | **`NULL` nếu là Phòng thi Mở (không cần nhóm)**; có giá trị nếu giới hạn riêng cho 1 nhóm. |
| `access_mode` | `TEXT` | NOT NULL, DEFAULT `'OPEN'` | `'OPEN'` (Ai có Link/PIN/QR đều vào được) hoặc `'GROUP_ONLY'` (Chỉ thành viên nhóm). |
| `pin_code` | `VARCHAR(6)` | NOT NULL, UNIQUE | Mã PIN 6 chữ số (dùng cho cả Link `?pin=849201` và QR Code). |
| `status` | `TEXT` | NOT NULL, DEFAULT `'WAITING'` | `'WAITING'` (Phòng chờ), `'IN_PROGRESS'` (Đang thi), `'CLOSED'` (Đã đóng). |
| `opened_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm mở phòng chờ. |
| `started_at` | `TIMESTAMPTZ` | NULL | Thời điểm phát lệnh bắt đầu tính giờ đồng loạt (`Server Clock`). |
| `closed_at` | `TIMESTAMPTZ` | NULL | Thời điểm kết thúc phòng thi. |

---

### 3.4. Phân hệ 4: Ngân hàng Câu hỏi 4 Hình thức & Bộ đề Đánh giá

#### 13. Bảng `public.questions` (Câu hỏi 4 hình thức & Ma trận Rubric 100%)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã câu hỏi. |
| `competency_id` | `UUID` | NOT NULL, FK $\rightarrow$ `competencies(id)` | Kỹ năng thành phần được đo lường. |
| `creator_id` | `UUID` | NOT NULL, FK $\rightarrow$ `profiles(id)` | Người biên soạn (`Admin` hoặc `Evaluator`). |
| `organization_id` | `UUID` | NULL, FK $\rightarrow$ `organizations(id)` | Cách ly câu hỏi nội bộ của tổ chức B2B (`BR-ORG-01`). |
| `type` | `TEXT` | NOT NULL, CHECK `IN ('MCQ', 'SCENARIO', 'PRACTICAL_TASK', 'DIGITAL_EVIDENCE')` | **4 Hình thức đánh giá chuẩn hóa**. |
| `target_level` | `INT` | NOT NULL, CHECK `(1 <= target_level AND target_level <= 8)` | Cấp độ độ khó mục tiêu (1 đến 8). |
| `content` | `JSONB` | NOT NULL | Cấu trúc đề bài theo từng hình thức (xem Schema tại Mục 4). |
| `rubric_matrix` | `JSONB` | NULL | Ma trận tiêu chí chấm điểm có tổng trọng số = 100% (bắt buộc với câu tự luận/thực hành/minh chứng). |
| `difficulty_p` | `DECIMAL(4,3)` | NULL | Chỉ số độ khó thực nghiệm ($P \in [0, 1]$) phục vụ phân tích & nghiên cứu. |
| `discrimination_d` | `DECIMAL(4,3)` | NULL | Chỉ số độ phân biệt ($D \in [-1, 1]$) phục vụ phân tích & nghiên cứu. |
| `is_benchmark` | `BOOLEAN` | NOT NULL, DEFAULT `FALSE` | `TRUE`: Thuộc Ngân hàng đề chuẩn của NEXA do Admin xuất bản. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm tạo câu hỏi. |

#### 14. Bảng `public.assessments` (Bộ đề đánh giá) & 15. Bảng `public.assessment_questions`

- `assessments`: `id (UUID PK)`, `framework_id (UUID FK assessment_frameworks)`, `creator_id (UUID FK profiles)`, `organization_id (UUID NULL FK organizations)`, `group_id (UUID NULL FK assessment_groups)`, `title (TEXT NOT NULL)`, `description (TEXT)`, `assessment_mode ('B2C_SELF_PACED' | 'EVALUATOR_LED')`, `target_level (INT DEFAULT 4)`, `duration_minutes (INT DEFAULT 45)`, `max_attempts (INT DEFAULT 1)`, `passing_score (DECIMAL(5,2) DEFAULT 70.00)`, `is_public (BOOLEAN DEFAULT FALSE)`, `status ('DRAFT' | 'PUBLISHED' | 'ARCHIVED')`, `created_at (TIMESTAMPTZ)`, `updated_at (TIMESTAMPTZ)`.
- `assessment_questions`: `id (UUID PK)`, `assessment_id (UUID FK assessments ON DELETE CASCADE)`, `question_id (UUID FK questions ON DELETE RESTRICT)`, `order_index (INT NOT NULL)`, `weight_score (DECIMAL(5,2) NOT NULL DEFAULT 10.00)`, `UNIQUE(assessment_id, question_id)`.

---

### 3.5. Phân hệ 5 & 6: Phiên làm bài, 5 Ứng dụng AI & Thẩm định Chuyên gia

#### 16. Bảng `public.assessment_sessions` (Phiên làm bài & Lưu trữ Ứng dụng AI số 2, 3, 4)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã phiên làm bài. |
| `learner_id` | `UUID` | NOT NULL, FK $\rightarrow$ `profiles(id)` ON DELETE CASCADE | Người học thực hiện bài thi. |
| `assessment_id` | `UUID` | NOT NULL, FK $\rightarrow$ `assessments(id)` | Đề đánh giá tham gia. |
| `live_session_id` | `UUID` | NULL, FK $\rightarrow$ `live_sessions(id)` | Phòng thi trực tiếp (nếu thi qua Link/PIN/QR). |
| `status` | `TEXT` | NOT NULL, DEFAULT `'IN_PROGRESS'` | `'IN_PROGRESS'`, `'SUBMITTED'`, `'AI_EVALUATED'`, `'GRADED'`, `'RESUBMIT_REQUIRED'`. |
| `started_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm bắt đầu tính giờ. |
| `submitted_at` | `TIMESTAMPTZ` | NULL | Thời điểm nộp bài. |
| `duration_seconds` | `INT` | NULL | Tổng số giây thực tế người học làm bài (biến số nghiên cứu). |
| `total_score` | `DECIMAL(5,2)` | NULL | Điểm tổng kết toàn bài (thang 0–100). |
| `mastery_level` | `TEXT` | NULL | `'BELOW_FOUNDATION'`, `'FOUNDATION'`, `'INTERMEDIATE'`, `'ADVANCED'`, `'EXPERT'`. |
| `domain_scores` | `JSONB` | NULL | Điểm phân rã từng miền năng lực (vẽ `RadarChart`) và từng kỹ năng thành phần. |
| `ai_analysis` | `JSONB` | NULL | **Lưu kết quả `AI Call #2`:** Điểm mạnh & Điểm yếu (Ứng dụng AI 2), Khoảng trống năng lực (Ứng dụng AI 3), Phản hồi cá nhân hóa (Ứng dụng AI 4). |
| `evaluator_summary_feedback` | `TEXT` | NULL | Nhận xét tổng kết của Người đánh giá cho cả bài thi. |
| `points_awarded` | `INT` | NOT NULL, DEFAULT 0 | Số điểm tích lũy (point) người học nhận được từ phiên thi này. |
| `suspicious_events` | `JSONB` | NOT NULL, DEFAULT `'[]'` | Nhật ký cảnh báo rời tab làm bài. |

#### 17. Bảng `public.session_answers` (Câu trả lời 4 hình thức, Sản phẩm minh chứng & Giải trình)

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` | Mã câu trả lời. |
| `session_id` | `UUID` | NOT NULL, FK $\rightarrow$ `assessment_sessions(id)` ON DELETE CASCADE | Phiên thi trực thuộc. |
| `question_id` | `UUID` | NOT NULL, FK $\rightarrow$ `questions(id)` | Câu hỏi được trả lời. |
| `selected_options` | `JSONB` | NULL | Đáp án chọn đối với câu `MCQ` hoặc nhánh quyết định `SCENARIO`. |
| `text_response` | `TEXT` | NULL | Nội dung tự luận tình huống, kết quả `PRACTICAL_TASK`, hoặc **Văn bản giải trình phương án (`DIGITAL_EVIDENCE`)**. |
| `evidence_url` | `TEXT` | NULL | Đường dẫn tệp sản phẩm trên Supabase Storage hoặc URL (`Figma`, `GitHub`, `Drive`). |
| `evidence_mime_type` | `TEXT` | NULL | Định dạng tệp minh chứng (`application/pdf`, `image/png`, `application/zip`). |
| `score` | `DECIMAL(5,2)` | NULL | Điểm chính thức đạt được của câu hỏi (thang 100 theo trọng số câu). |
| `attempt_count` | `INT` | NOT NULL, DEFAULT 1 | Lần nộp (tối đa 3 lần khi có yêu cầu nộp lại). |
| `submitted_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Thời điểm ghi nhận câu trả lời. |
| *Ràng buộc:* | `UNIQUE(session_id, question_id)` | | Mỗi câu hỏi có 1 bản ghi trả lời hiện hành trong phiên thi. |

#### 18. Bảng `public.ai_evaluation_logs` (`AI Call #1` — Ứng dụng AI số 1: Hỗ trợ chấm điểm)

- `id (UUID PK)`, `session_answer_id (UUID UNIQUE FK session_answers ON DELETE CASCADE)`, `provider (TEXT NOT NULL)` (`'GEMINI'`, `'OPENAI'`, `'CLAUDE'`), `model_name (TEXT NOT NULL)`, `criteria_scores (JSONB NOT NULL)` (chứa điểm từng tiêu chí, `evidenceQuote` trích dẫn câu chữ thí sinh và `pedagogicalNote`), `suggested_score (DECIMAL(5,2) NOT NULL)`, `confidence_score (DECIMAL(3,2) NOT NULL)`, `needs_manual_review (BOOLEAN NOT NULL)`, `overall_rationale (TEXT NOT NULL)`, `created_at (TIMESTAMPTZ DEFAULT NOW())`.

#### 19. Bảng `public.manual_reviews` (Thẩm định của Chuyên gia & Đánh dấu Bài mẫu chuẩn)

- `id (UUID PK)`, `ai_log_id (UUID UNIQUE FK ai_evaluation_logs ON DELETE CASCADE)`, `evaluator_id (UUID FK profiles)`, `final_score (DECIMAL(5,2) NOT NULL)`, `evaluator_feedback (TEXT NOT NULL)`, `is_gold_sample (BOOLEAN NOT NULL DEFAULT FALSE)` (**Đánh dấu làm Bài mẫu chuẩn Tầng 3 để huấn luyện AI**), `request_resubmit (BOOLEAN DEFAULT FALSE)`, `resubmit_reason (TEXT NULL)`, `status ('APPROVED' | 'OVERRIDDEN' | 'RESUBMIT_REQUESTED')`, `reviewed_at (TIMESTAMPTZ DEFAULT NOW())`.

---

### 3.6. Phân hệ 7, 8, 9, 10: Lộ trình 4 bước, Chứng chỉ, Huy hiệu, Gói dịch vụ & Kiểm toán

- **20. `public.learning_content_items` (Kho học liệu chuẩn):** `id (UUID PK)`, `competency_id (UUID FK competencies)`, `title (TEXT NOT NULL)`, `content_type ('ARTICLE' | 'VIDEO' | 'EXERCISE' | 'COURSE')`, `difficulty ('FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED')`, `url (TEXT NOT NULL)`, `duration_minutes (INT DEFAULT 20)`, `point_reward (INT NOT NULL DEFAULT 30)`, `is_published (BOOLEAN DEFAULT TRUE)`, `created_at (TIMESTAMPTZ)`.
- **21. `public.learning_pathways` (Ứng dụng AI số 5 — Lộ trình phát triển 4 bước):** `id (UUID PK)`, `learner_id (UUID FK profiles ON DELETE CASCADE)`, `session_id (UUID FK assessment_sessions ON DELETE CASCADE)`, `competency_id (UUID FK competencies)`, `recommended_item_id (UUID FK learning_content_items)`, `stage_number (INT NOT NULL DEFAULT 1)` (Chặng 1, 2, 3), `priority_order (INT NOT NULL)`, `ai_reason (TEXT NOT NULL)` (*"Lý do AI khuyên học bài này"*), `is_completed (BOOLEAN DEFAULT FALSE)`, `completed_at (TIMESTAMPTZ NULL)`, `created_at (TIMESTAMPTZ)`.
- **22. `public.certificate_templates`:** `id (UUID PK)`, `title (TEXT)`, `background_url (TEXT)`, `signatory_name (TEXT)`, `signatory_title (TEXT)`, `is_active (BOOLEAN DEFAULT TRUE)`, `created_at (TIMESTAMPTZ)`.
- **23. `public.credentials` (Chứng chỉ số QR — Mã băm SHA-256 kép):** `id (UUID PK)`, `session_id (UUID UNIQUE FK assessment_sessions)`, `template_id (UUID FK certificate_templates)`, `learner_id (UUID FK profiles ON DELETE CASCADE)`, `issuer_id (UUID FK profiles)`, `data_hash (VARCHAR(64) NOT NULL UNIQUE)` (SHA-256 tầng dữ liệu), `file_hash (VARCHAR(64) NOT NULL UNIQUE)` (SHA-256 tầng tệp PDF), `verify_url (TEXT NOT NULL)`, `pdf_url (TEXT NULL)`, `mastery_level (TEXT NOT NULL)`, `status ('VALID' | 'REVOKED')`, `is_public (BOOLEAN DEFAULT TRUE)`, `issued_at (TIMESTAMPTZ DEFAULT NOW())`.
- **24. `public.credential_revocations`:** `id (UUID PK)`, `credential_id (UUID UNIQUE FK credentials)`, `revoked_by (UUID FK profiles)`, `reason (TEXT NOT NULL)`, `revoked_at (TIMESTAMPTZ DEFAULT NOW())`.
- **25. `public.badges` & 26. `public.user_badges`:** Lưu danh mục huy hiệu (`COMPLETION`, `COMPETENCY`, `PROGRESSION`) và thành tích mở khóa của người học.
- **27. `public.subscription_plans` & 28. `public.invoices`:** Lưu cấu hình gói dịch vụ (`LEARNER_FREE`, `LEARNER_PRO`, `EVALUATOR_FREE`, `EVALUATOR_PRO`, `ENTERPRISE`) và hóa đơn thanh toán VietQR (`idempotency_key UNIQUE`).
- **29. `public.ai_configurations`:** Lưu cấu hình nhà cung cấp AI đang kích hoạt (`active_provider`: `'GEMINI' | 'OPENAI' | 'CLAUDE'`), `model_name`, `system_prompt`, `confidence_threshold (DEFAULT 0.85)`, `budget_cap_usd`.
- **30. `public.audit_logs`:** Sổ cái kiểm toán bất biến (`id`, `actor_id`, `action`, `target_entity`, `target_id`, `old_data`, `new_data`, `ip_address`, `created_at`).

---

## 4. ĐẶC TẢ CẤU TRÚC JSONB CHUẨN CHO 4 HÌNH THỨC CÂU HỎI & 5 ỨNG DỤNG AI

### 4.1. Cấu trúc cột `questions.content` theo 4 Hình thức Đánh giá

```typescript
// 1. Hình thức Câu hỏi trắc nghiệm (type = 'MCQ')
export interface McqQuestionContent {
  format: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'MATCHING';
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[]; // Chỉ lưu ở Server, ẩn khi trả về Client đang thi
  explanation: string;
}

// 2. Hình thức Câu hỏi tình huống (type = 'SCENARIO')
export interface ScenarioQuestionContent {
  scenarioContext: string;        // Mô tả bối cảnh tình huống thực tế
  attachmentImageUrl?: string;    // Ảnh chụp tình huống (email giả mạo, màn hình lỗi...)
  responseMode: 'DECISION_CHOICE' | 'OPEN_SOLUTION';
  decisionOptions?: Array<{ id: string; text: string; weightPercent: number }>;
  questionPrompt: string;         // Câu hỏi yêu cầu xử lý tình huống
}

// 3. Hình thức Nhiệm vụ thực hành (type = 'PRACTICAL_TASK')
export interface PracticalTaskContent {
  taskTitle: string;
  taskInstructions: string;       // Đề bài giao nhiệm vụ thao tác cụ thể
  inputDatasetOrContext?: string; // Dữ liệu đầu vào để người học xử lý
  expectedOutputFormat: string;   // Yêu cầu định dạng kết quả cần nộp
}

// 4. Hình thức Sản phẩm và minh chứng số (type = 'DIGITAL_EVIDENCE')
export interface DigitalEvidenceContent {
  artifactRequirement: string;    // Yêu cầu về sản phẩm số cần nộp
  allowedFileTypes: Array<'pdf' | 'png' | 'jpg' | 'zip' | 'url'>;
  maxFileSizeMb: number;          // Mặc định 25MB
  rationalePrompts: string[];     // Các câu hỏi gợi mở bắt buộc người học giải trình (>= 30 từ)
}
```

### 4.2. Cấu trúc cột `assessment_sessions.ai_analysis` (Lưu kết quả Ứng dụng AI số 2, 3, 4)

```typescript
export interface SessionAiAnalysisJson {
  // Ứng dụng AI số 2: Phân tích điểm mạnh và điểm yếu
  strengths: Array<{ skillCode: string; skillTitle: string; score: number; highlight: string }>;
  weaknesses: Array<{ skillCode: string; skillTitle: string; score: number; issue: string }>;

  // Ứng dụng AI số 3: Nhận diện khoảng trống năng lực (Skill Gaps < 60%)
  skillGaps: Array<{
    competencyId: string;
    skillCode: string;
    skillTitle: string;
    currentScore: number;
    targetScore: number;
    realWorldImpact: string; // Hệ quả thực tế nếu thiếu kỹ năng này
  }>;

  // Ứng dụng AI số 4: Phản hồi cá nhân hóa toàn diện
  personalizedFeedback: {
    overallSummary: string;
    thinkingStyleAnalysis: string;
    actionableAdvice: string;
  };
}
```

---

## 5. CHỈ MỤC HIỆU NĂNG (INDEXES) & TRIGGER KHÓA CỨNG VAI TRÒ TĨNH

```sql
-- 1. Chỉ mục phục vụ Bảng xếp hạng Top 100+ siêu tốc (< 10ms)
CREATE INDEX idx_profiles_leaderboard
ON public.profiles (points DESC, avg_competency_score DESC)
WHERE role = 'LEARNER';

-- 2. Chỉ mục truy vấn lịch sử phiên thi và xuất dữ liệu nghiên cứu
CREATE INDEX idx_assessment_sessions_learner_started
ON public.assessment_sessions (learner_id, started_at DESC);

-- 3. Chỉ mục tìm nhanh Nhóm học tập qua Link/Mã nhóm và Nhận xét trong nhóm
CREATE INDEX idx_groups_invite_code ON public.assessment_groups (invite_code);
CREATE INDEX idx_group_feedbacks_learner ON public.group_feedbacks (learner_id, is_read, created_at DESC);

-- 4. Chỉ mục truy vấn Bài mẫu chuẩn (Gold Samples) để huấn luyện AI tầng 3
CREATE INDEX idx_manual_reviews_gold_samples
ON public.manual_reviews (is_gold_sample)
WHERE is_gold_sample = TRUE;

-- 5. TRIGGER BẤT BIẾN: Khóa cứng vai trò (1 Email = 1 Static Role) sau khi đăng ký
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$ BEGIN IF OLD.role IS DISTINCT FROM NEW.role THEN RAISE EXCEPTION 'Vi phạm quy tắc BR-AUTH-02: Vai trò tài khoản đã được cố định vĩnh viễn và không thể thay đổi.'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_static_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();
```
