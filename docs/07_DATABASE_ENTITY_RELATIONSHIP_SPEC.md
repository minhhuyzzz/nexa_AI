# SƠ ĐỒ QUAN HỆ THỰC THỂ CƠ SỞ DỮ LIỆU TOÀN NỀN TẢNG NEXA AI
# DATABASE ENTITY-RELATIONSHIP SPECIFICATION (ERD)

Mã định danh: `DOC-NEXA-ERD-DATABASE-2026`  
Phiên bản: `v3.0.0-PUBLIC`  
Quy mô dữ liệu: 65 Bảng cơ sở dữ liệu thực tế • 101 Mối quan hệ liên kết toàn diện  
Tiêu chuẩn tuân thủ: Chuẩn PostgreSQL Supabase, Bộ quy tắc `AGENTS.md`

## 1. TỔNG QUAN KIẾN TRÚC CƠ SỞ DỮ LIỆU NEXA AI

Hệ thống cơ sở dữ liệu NEXA AI được thiết kế theo kiến trúc hướng module cao, đảm bảo cách ly dữ liệu cá nhân với dữ liệu doanh nghiệp và vận hành trơn tru theo 6 phân hệ cốt lõi:

- **Phân hệ 1: Người dùng, Định danh & Ví điểm (6 bảng):** Quản lý tài khoản, lịch sử điểm thưởng, phiên dùng thử và hồ sơ khảo thí viên.
- **Phân hệ 2: Tổ chức B2B, Hợp đồng & Lớp học (17 bảng):** Quản trị trường học/doanh nghiệp, hạn mức AI, đợt tuyển sinh, lớp học, bài tập và thảo luận lớp.
- **Phân hệ 3: Khung Năng lực, Ngân hàng Đề & Barem Rubric (13 bảng):** Khung năng lực chuẩn, ngân hàng câu hỏi, đề thi chuẩn hóa, đề đóng góp và tiêu chí chấm rubric đa mức độ.
- **Phân hệ 4: Lượt làm bài, Phòng thi Live & Chứng chỉ số (10 bảng):** Lưu trữ bài nộp, đáp án chi tiết, phòng thi trực tiếp mã PIN 6 số, giám sát gian lận, tích lũy bằng chứng và chứng chỉ số băm kép SHA-256.
- **Phân hệ 5: Trí tuệ nhân tạo, Tự chấm & Kiểm toán an ninh (11 bảng):** Cấu hình chính sách AI, hạn mức AI Credits, hàng đợi chấm tự luận, đối soát chuyên gia HITL và nhật ký kiểm toán bất biến.
- **Phân hệ 6: Gói cước, Khóa học & Thanh toán VietQR (8 bảng):** Bảng giá dịch vụ, đăng ký thuê bao, lịch sử thanh toán VietQR NAPAS 24/7 và lộ trình học tập bồi dưỡng khoảng trống.

## 2. HƯỚNG DẪN SỬ DỤNG MÃ MERMAID

Đoạn mã Mermaid dưới đây là bản đặc tả thực thể ERD đầy đủ 100% của hệ thống. Bạn có thể:
1. Sao chép toàn bộ khối mã bên dưới.
2. Dán vào công cụ trực tuyến **Mermaid Live Editor** (`https://mermaid.live`) hoặc trình xem Markdown hỗ trợ Mermaid để xem sơ đồ trực quan và xuất file PNG/SVG chất lượng cao.

## 3. MÃ NGUỒN SƠ ĐỒ MERMAID ERD TOÀN HỆ THỐNG

```mermaid
erDiagram
    %% =========================================================================
    %% SƠ ĐỒ QUAN HỆ THỰC THỂ TOÀN NỀN TẢNG NEXA AI (65 BẢNG CƠ SỞ DỮ LIỆU)
    %% =========================================================================

    %% -------------------------------------------------------------------------
    %% PHÂN HỆ 1: NGƯỜI DÙNG, ĐỊNH DANH & VÍ ĐIỂM (IDENTITY & REPUTATION)
    %% -------------------------------------------------------------------------

    PROFILES {
        uuid id PK
        string email
        string full_name
        string role
        string plan_tier
        int points
        boolean is_suspended
        timestamp created_at
    }

    POINT_LEDGER {
        uuid id PK
        uuid user_id FK
        int delta
        int balance_after
        string reason
        timestamp created_at
    }

    USER_TRIAL_HISTORY {
        uuid id PK
        uuid user_id FK
        string feature_name
        timestamp used_at
        timestamp expires_at
    }

    USER_NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string title
        string content
        string type
        boolean is_read
        timestamp created_at
    }

    CONSENT_LOGS {
        uuid id PK
        uuid user_id FK
        string consent_type
        boolean granted
        string ip_address
        timestamp recorded_at
    }

    EVALUATOR_PROFILES {
        uuid id PK
        uuid user_id FK
        string professional_title
        string organization_name
        string verification_status
        timestamp verified_at
    }

    %% -------------------------------------------------------------------------
    %% PHÂN HỆ 2: TỔ CHỨC B2B & LỚP HỌC (ORGANIZATIONS, CLASSES & MEMBERSHIPS)
    %% -------------------------------------------------------------------------

    ORGANIZATIONS {
        uuid id PK
        string code
        string name
        string status
        int expected_learners
        int max_members
        int ai_credits
        timestamp created_at
    }

    USER_ORGANIZATIONS {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        string org_role
        string status
        timestamp joined_at
    }

    ORGANIZATION_ENTITLEMENTS {
        uuid id PK
        uuid organization_id FK
        string feature_code
        boolean is_enabled
        int limit_value
        timestamp updated_at
    }

    ORGANIZATION_POLICIES {
        uuid id PK
        uuid organization_id FK
        string policy_key
        string policy_value
        timestamp updated_at
    }

    ORGANIZATION_INVITATIONS {
        uuid id PK
        uuid organization_id FK
        string email
        string org_role
        string status
        string token
        timestamp expires_at
    }

    ORGANIZATION_JOIN_CODES {
        uuid id PK
        uuid organization_id FK
        string code
        int max_uses
        int uses_count
        timestamp expires_at
    }

    ORGANIZATION_MEMBERSHIP_REQUESTS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string status
        string notes
        timestamp created_at
    }

    BUSINESS_INQUIRIES {
        uuid id PK
        string org_name
        string contact_name
        string contact_email
        string contact_phone
        int expected_learners
        string status
        timestamp created_at
    }

    RENEWAL_REQUESTS {
        uuid id PK
        uuid organization_id FK
        int requested_cycle_months
        string status
        timestamp created_at
    }

    EVALUATOR_CLASSES {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        string name
        string code
        string academic_year
        timestamp created_at
    }

    CLASS_MEMBERS {
        uuid id PK
        uuid class_id FK
        uuid user_id FK
        string member_role
        string status
        timestamp joined_at
    }

    CLASS_ASSIGNMENTS {
        uuid id PK
        uuid class_id FK
        uuid assessment_id FK
        string title
        timestamp start_at
        timestamp due_at
        timestamp created_at
    }

    ASSIGNMENT_SUBMISSIONS {
        uuid id PK
        uuid assignment_id FK
        uuid user_id FK
        float score
        string status
        timestamp submitted_at
    }

    CLASS_FILES {
        uuid id PK
        uuid class_id FK
        uuid uploaded_by FK
        string file_name
        string file_url
        int file_size
        timestamp created_at
    }

    CLASS_POSTS {
        uuid id PK
        uuid class_id FK
        uuid author_id FK
        string content
        boolean is_pinned
        timestamp created_at
    }

    CLASS_POST_REPLIES {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        string content
        timestamp created_at
    }

    CLASS_MESSAGES {
        uuid id PK
        uuid class_id FK
        uuid sender_id FK
        string message
        jsonb attachments
        timestamp sent_at
    }

    %% -------------------------------------------------------------------------
    %% PHÂN HỆ 3: KHUNG NĂNG LỰC, NGÂN HÀNG ĐỀ & KHẢO THÍ (FRAMEWORK & ASSESSMENTS)
    %% -------------------------------------------------------------------------

    ASSESSMENT_FRAMEWORKS {
        uuid id PK
        string code
        string name
        string description
        string version
        boolean is_active
    }

    COMPETENCY_DOMAINS {
        uuid id PK
        uuid framework_id FK
        string code
        string title
        float weight
    }

    COMPETENCIES {
        uuid id PK
        uuid domain_id FK
        string skill_code
        string title
        string description
        int level
    }

    ASSESSMENTS {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        string title
        string description
        int duration_minutes
        float passing_score
        boolean is_published
        timestamp created_at
    }

    ASSESSMENT_ITEMS {
        uuid id PK
        uuid assessment_id FK
        uuid competency_id FK
        string type
        float points
        string question_text
        int order_index
    }

    ITEM_OPTIONS {
        uuid id PK
        uuid item_id FK
        string option_text
        boolean is_correct
        string explanation
        int order_index
    }

    QUESTION_BANK_ITEMS {
        uuid id PK
        uuid competency_id FK
        string type
        string difficulty
        string question_text
        string status
        timestamp created_at
    }

    QUESTION_BANK_OPTIONS {
        uuid id PK
        uuid question_bank_item_id FK
        string option_text
        boolean is_correct
    }

    COMMUNITY_CONTRIBUTIONS {
        uuid id PK
        uuid user_id FK
        uuid competency_id FK
        string question_text
        string status
        string reviewer_notes
        timestamp created_at
    }

    ASSESSMENT_CAMPAIGNS {
        uuid id PK
        uuid organization_id FK
        uuid assessment_id FK
        string name
        timestamp start_time
        timestamp end_time
        timestamp created_at
    }

    RUBRICS {
        uuid id PK
        uuid created_by FK
        string title
        float scale_max
        string description
        timestamp created_at
    }

    RUBRIC_CRITERIA {
        uuid id PK
        uuid rubric_id FK
        string name
        float weight
        float max_points
    }

    RUBRIC_LEVELS {
        uuid id PK
        uuid criterion_id FK
        int level_number
        string title
        float score_points
    }

    %% -------------------------------------------------------------------------
    %% PHÂN HỆ 4: LƯỢT LÀM BÀI, PHÒNG THI LIVE & CHỨNG CHỈ (SUBMISSIONS & ROOMS)
    %% -------------------------------------------------------------------------

    ASSESSMENT_SUBMISSIONS {
        uuid id PK
        uuid assessment_id FK
        uuid user_id FK
        uuid organization_id FK
        float score
        boolean is_passed
        string status
        timestamp started_at
        timestamp submitted_at
    }

    SUBMISSION_ANSWERS {
        uuid id PK
        uuid submission_id FK
        uuid item_id FK
        uuid selected_option_id FK
        string answer_text
        float score
    }

    EXAM_ROOMS {
        uuid id PK
        uuid assessment_id FK
        uuid host_user_id FK
        uuid organization_id FK
        string pin_code
        string status
        string room_mode
        timestamp scheduled_start
    }

    ROOM_PARTICIPANTS {
        uuid id PK
        uuid room_id FK
        uuid user_id FK
        string display_name
        string status
        timestamp joined_at
    }

    ROOM_ANNOUNCEMENTS {
        uuid id PK
        uuid room_id FK
        string content
        timestamp sent_at
    }

    PROCTORING_EVENTS {
        uuid id PK
        uuid submission_id FK
        string event_type
        jsonb details
        string severity
        timestamp created_at
    }

    COMPETENCY_EVIDENCE {
        uuid id PK
        uuid user_id FK
        uuid domain_id FK
        uuid competency_id FK
        uuid submission_id FK
        float score
        string status
        timestamp created_at
    }

    CREDENTIALS {
        uuid id PK
        uuid user_id FK
        uuid assessment_id FK
        string certificate_code
        string qr_code_url
        string content_sha256
        timestamp issue_date
    }

    COMPETENCY_ANALYSES {
        uuid id PK
        uuid user_id FK
        jsonb domain_scores
        jsonb gap_analysis
        string recommended_path
        timestamp created_at
    }

    LEARNER_COMPETENCY_SNAPSHOTS {
        uuid id PK
        uuid user_id FK
        string snapshot_type
        jsonb domain_scores
        timestamp recorded_at
    }

    %% -------------------------------------------------------------------------
    %% PHÂN HỆ 5: TRÍ TUỆ NHÂN TẠO, TỰ CHẤM & KIỂM TOÁN (AI & SECURITY AUDIT)
    %% -------------------------------------------------------------------------

    AI_TASK_POLICIES {
        uuid id PK
        string task_type
        string model_provider
        string default_model
        int max_tokens
        int cost_credits
    }

    AI_USAGE_EVENTS {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        string task_type
        int credits_used
        int prompt_tokens
        string model
        timestamp created_at
    }

    AI_CREDIT_RESERVATIONS {
        uuid id PK
        uuid organization_id FK
        string task_id
        int reserved_credits
        string status
        timestamp expires_at
    }

    AI_GRADING_JOBS {
        uuid id PK
        uuid submission_id FK
        string status
        string error_message
        jsonb result_payload
        timestamp created_at
    }

    AI_EVALUATIONS {
        uuid id PK
        uuid submission_id FK
        uuid criterion_id FK
        float suggested_score
        float confidence_score
        string feedback
        timestamp created_at
    }

    AI_CALIBRATION_LOGS {
        uuid id PK
        uuid evaluation_id FK
        uuid calibrator_id FK
        float ai_score
        float human_score
        float deviation
        timestamp created_at
    }

    AI_QUESTION_EXPLANATIONS {
        uuid id PK
        uuid question_id FK
        uuid user_id FK
        string explanation_text
        string model_used
        timestamp created_at
    }

    ADMIN_AUDIT_LOGS {
        uuid id PK
        uuid admin_id FK
        string action
        string resource
        string target_id
        string ip_address
        timestamp created_at
    }

    ORG_AUDIT_LOGS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string action
        jsonb details
        timestamp created_at
    }

    PLATFORM_SETTINGS {
        uuid id PK
        string key
        string value
        string description
        uuid updated_by FK
        timestamp updated_at
    }

    FEEDBACK_TICKETS {
        uuid id PK
        uuid user_id FK
        string category
        string title
        string description
        string status
        timestamp created_at
    }

    %% -------------------------------------------------------------------------
    %% PHÂN HỆ 6: GÓI CƯỚC, KHÓA HỌC & THANH TOÁN (BILLING & LEARNING PATHS)
    %% -------------------------------------------------------------------------

    SERVICE_PLANS {
        uuid id PK
        string code
        string name
        string tier
        string billing_cycle
        float price_cents
        int ai_credit_quota
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        uuid plan_id FK
        string status
        timestamp current_period_end
        timestamp created_at
    }

    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        string order_code
        float amount
        string status
        string payment_gateway
        timestamp created_at
    }

    LEARNING_PATHS {
        uuid id PK
        string title
        string target_domain
        string difficulty
        int total_modules
        boolean is_published
        timestamp created_at
    }

    LEARNING_MODULES {
        uuid id PK
        uuid path_id FK
        uuid competency_id FK
        string title
        string content_url
        int order_index
    }

    USER_LEARNING_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid module_id FK
        boolean is_completed
        float score
        timestamp completed_at
    }

    COURSE_CATALOG {
        uuid id PK
        string title
        string provider
        string original_url
        string competency_code
        boolean is_verified
        timestamp created_at
    }

    USER_COURSE_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        string status
        timestamp enrolled_at
    }

    %% =========================================================================
    %% QUAN HỆ LIÊN KẾT GIỮA CÁC THỰC THỂ (ENTITY RELATIONSHIPS)
    %% =========================================================================

    %% Phân hệ 1
    PROFILES ||--o{ POINT_LEDGER : "so_cai_diem"
    PROFILES ||--o{ USER_TRIAL_HISTORY : "lich_su_dung_thu"
    PROFILES ||--o{ USER_NOTIFICATIONS : "nhan_thong_bao"
    PROFILES ||--o{ CONSENT_LOGS : "ghi_nhan_dong_thuan"
    PROFILES ||--o| EVALUATOR_PROFILES : "ho_so_khao_thi_vien"

    %% Phân hệ 2
    ORGANIZATIONS ||--o{ USER_ORGANIZATIONS : "quan_ly_thanh_vien"
    PROFILES ||--o{ USER_ORGANIZATIONS : "tham_gia_to_chuc"
    ORGANIZATIONS ||--o{ ORGANIZATION_ENTITLEMENTS : "co_han_muc"
    ORGANIZATIONS ||--o{ ORGANIZATION_POLICIES : "cau_hinh_chinh_sach"
    ORGANIZATIONS ||--o{ ORGANIZATION_INVITATIONS : "gui_loi_moi"
    ORGANIZATIONS ||--o{ ORGANIZATION_JOIN_CODES : "cap_ma_tham_gia"
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERSHIP_REQUESTS : "tiep_nhan_yeu_cau"
    PROFILES ||--o{ ORGANIZATION_MEMBERSHIP_REQUESTS : "gui_yeu_cau_gia_nhap"
    ORGANIZATIONS ||--o{ RENEWAL_REQUESTS : "yeu_cau_gia_han"
    ORGANIZATIONS ||--o{ EVALUATOR_CLASSES : "to_chuc_lop_hoc"
    PROFILES ||--o{ EVALUATOR_CLASSES : "tao_lop_hoc"
    EVALUATOR_CLASSES ||--o{ CLASS_MEMBERS : "danh_sach_lop"
    PROFILES ||--o{ CLASS_MEMBERS : "thanh_vien_lop"
    EVALUATOR_CLASSES ||--o{ CLASS_ASSIGNMENTS : "giao_bai_tap"
    CLASS_ASSIGNMENTS ||--o{ ASSIGNMENT_SUBMISSIONS : "nop_bai_tap"
    PROFILES ||--o{ ASSIGNMENT_SUBMISSIONS : "thuc_hien_nop_bai"
    EVALUATOR_CLASSES ||--o{ CLASS_FILES : "tai_lieu_dinh_kem"
    PROFILES ||--o{ CLASS_FILES : "tai_len_tap_tin"
    EVALUATOR_CLASSES ||--o{ CLASS_POSTS : "bai_dang_thao_luan"
    PROFILES ||--o{ CLASS_POSTS : "dang_bai"
    CLASS_POSTS ||--o{ CLASS_POST_REPLIES : "phan_hoi_bai_dang"
    PROFILES ||--o{ CLASS_POST_REPLIES : "gui_phan_hoi"
    EVALUATOR_CLASSES ||--o{ CLASS_MESSAGES : "tin_nhan_lop"
    PROFILES ||--o{ CLASS_MESSAGES : "gui_tin_nhan"

    %% Phân hệ 3
    ASSESSMENT_FRAMEWORKS ||--o{ COMPETENCY_DOMAINS : "chua_mien_nang_luc"
    COMPETENCY_DOMAINS ||--o{ COMPETENCIES : "chua_ky_nang"
    ORGANIZATIONS ||--o{ ASSESSMENTS : "so_huu_de_thi"
    PROFILES ||--o{ ASSESSMENTS : "bien_soan_de_thi"
    ASSESSMENTS ||--o{ ASSESSMENT_ITEMS : "cau_truc_de_thi"
    COMPETENCIES ||--o{ ASSESSMENT_ITEMS : "danh_gia_ky_nang"
    ASSESSMENT_ITEMS ||--o{ ITEM_OPTIONS : "dap_an_lua_chon"
    COMPETENCIES ||--o{ QUESTION_BANK_ITEMS : "phan_loai_ngan_hang"
    QUESTION_BANK_ITEMS ||--o{ QUESTION_BANK_OPTIONS : "dap_an_ngan_hang"
    PROFILES ||--o{ COMMUNITY_CONTRIBUTIONS : "dong_gop_cau_hoi"
    COMPETENCIES ||--o{ COMMUNITY_CONTRIBUTIONS : "anh_xa_ky_nang"
    ORGANIZATIONS ||--o{ ASSESSMENT_CAMPAIGNS : "phat_dong_dot_thi"
    ASSESSMENTS ||--o{ ASSESSMENT_CAMPAIGNS : "ap_dung_de_thi"
    PROFILES ||--o{ RUBRICS : "thiet_lap_rubric"
    RUBRICS ||--o{ RUBRIC_CRITERIA : "tieu_chi_cham"
    RUBRIC_CRITERIA ||--o{ RUBRIC_LEVELS : "muc_do_dat_duoc"

    %% Phân hệ 4
    ASSESSMENTS ||--o{ ASSESSMENT_SUBMISSIONS : "duoc_lam_bai"
    PROFILES ||--o{ ASSESSMENT_SUBMISSIONS : "thuc_hien_khao_thi"
    ORGANIZATIONS ||--o{ ASSESSMENT_SUBMISSIONS : "quan_ly_ket_qua"
    ASSESSMENT_SUBMISSIONS ||--o{ SUBMISSION_ANSWERS : "chi_tiet_tra_loi"
    ASSESSMENT_ITEMS ||--o{ SUBMISSION_ANSWERS : "cau_hoi_duoc_tra_loi"
    ASSESSMENTS ||--o{ EXAM_ROOMS : "khoi_tao_phong_thi"
    PROFILES ||--o{ EXAM_ROOMS : "chu_phong_thi"
    ORGANIZATIONS ||--o{ EXAM_ROOMS : "phong_thi_truong"
    EXAM_ROOMS ||--o{ ROOM_PARTICIPANTS : "thi_sinh_tham_gia"
    PROFILES ||--o{ ROOM_PARTICIPANTS : "vao_phong_thi"
    EXAM_ROOMS ||--o{ ROOM_ANNOUNCEMENTS : "phat_thong_bao"
    ASSESSMENT_SUBMISSIONS ||--o{ PROCTORING_EVENTS : "giam_sat_gian_lan"
    PROFILES ||--o{ COMPETENCY_EVIDENCE : "tich_luy_bang_chung"
    COMPETENCY_DOMAINS ||--o{ COMPETENCY_EVIDENCE : "thuoc_mien_nang_luc"
    ASSESSMENT_SUBMISSIONS ||--o{ COMPETENCY_EVIDENCE : "xac_thuc_tu_bai_thi"
    PROFILES ||--o{ CREDENTIALS : "nhan_chung_chi_so"
    ASSESSMENTS ||--o{ CREDENTIALS : "cap_theo_de_thi"
    PROFILES ||--o{ COMPETENCY_ANALYSES : "ho_so_phan_tich"
    PROFILES ||--o{ LEARNER_COMPETENCY_SNAPSHOTS : "anh_chup_nang_luc"

    %% Phân hệ 5
    PROFILES ||--o{ AI_USAGE_EVENTS : "nguoi_dung_su_dung_ai"
    ORGANIZATIONS ||--o{ AI_USAGE_EVENTS : "tieu_thu_quota_ai"
    ORGANIZATIONS ||--o{ AI_CREDIT_RESERVATIONS : "giu_cho_han_muc_ai"
    ASSESSMENT_SUBMISSIONS ||--o{ AI_GRADING_JOBS : "hang_doi_cham_ai"
    ASSESSMENT_SUBMISSIONS ||--o{ AI_EVALUATIONS : "danh_gia_tu_ai"
    RUBRIC_CRITERIA ||--o{ AI_EVALUATIONS : "cham_theo_tieu_chi"
    AI_EVALUATIONS ||--o{ AI_CALIBRATION_LOGS : "doi_soat_chuyen_gia"
    PROFILES ||--o{ AI_CALIBRATION_LOGS : "chuyen_gia_hieu_chuan"
    PROFILES ||--o{ AI_QUESTION_EXPLANATIONS : "yeu_cau_giai_thich_ai"
    PROFILES ||--o{ ADMIN_AUDIT_LOGS : "nhat_ky_admin"
    ORGANIZATIONS ||--o{ ORG_AUDIT_LOGS : "nhat_ky_to_chuc"
    PROFILES ||--o{ PLATFORM_SETTINGS : "quan_tri_cau_hinh"
    PROFILES ||--o{ FEEDBACK_TICKETS : "gui_gop_y_phan_hoi"

    %% Phân hệ 6
    SERVICE_PLANS ||--o{ SUBSCRIPTIONS : "dang_ky_goi"
    PROFILES ||--o{ SUBSCRIPTIONS : "chu_hop_dong_ca_nhan"
    ORGANIZATIONS ||--o{ SUBSCRIPTIONS : "hop_dong_doanh_nghiep"
    PROFILES ||--o{ PAYMENT_TRANSACTIONS : "thanh_toan_vietqr"
    SERVICE_PLANS ||--o{ PAYMENT_TRANSACTIONS : "goi_thanh_toan"
    LEARNING_PATHS ||--o{ LEARNING_MODULES : "gom_cac_bai_hoc"
    COMPETENCIES ||--o{ LEARNING_MODULES : "boi_duong_ky_nang"
    PROFILES ||--o{ USER_LEARNING_PROGRESS : "tien_do_hoc_tap"
    LEARNING_MODULES ||--o{ USER_LEARNING_PROGRESS : "hoan_thanh_bai_hoc"
    COMPETENCIES ||--o{ COURSE_CATALOG : "khoa_hoc_phu_hop"
    PROFILES ||--o{ USER_COURSE_PROGRESS : "tien_do_khoa_hoc"
    COURSE_CATALOG ||--o{ USER_COURSE_PROGRESS : "tham_gia_khoa_hoc"
```

## 4. BẢNG TRA CỨU DANH MỤC 65 THỰC THỂ THEO PHÂN HỆ

| Phân hệ nghiệp vụ | Tên bảng (PostgreSQL) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| **1. Định danh & Ví điểm** | `profiles` | Thông tin tài khoản người dùng, vai trò, gói cước và điểm thưởng |
| | `point_ledger` | Sổ cái biến động điểm thưởng (cộng/trừ điểm minh bạch) |
| | `user_trial_history` | Lịch sử trải nghiệm dùng thử tính năng nâng cao (Personal Pro) |
| | `user_notifications` | Hộp thông báo hệ thống của người dùng |
| | `consent_logs` | Nhật ký đồng thuận điều khoản và an toàn dữ liệu |
| | `evaluator_profiles` | Hồ sơ thẩm định năng lực khảo thí viên |
| **2. Tổ chức B2B & Lớp học** | `organizations` | Đơn vị trường học, doanh nghiệp B2B và hạn mức AI cấp |
| | `user_organizations` | Bảng trung gian phân quyền thành viên trong tổ chức |
| | `organization_entitlements` | Hạn mức quyền năng và tính năng kích hoạt theo gói hợp đồng |
| | `organization_policies` | Cấu hình quy chế thi cử, bảo mật riêng của từng trường |
| | `organization_invitations` | Thư mời tham gia tổ chức qua email kèm token bảo mật |
| | `organization_join_codes` | Mã gia nhập trường/lớp dành cho tuyển sinh hàng loạt |
| | `organization_membership_requests` | Hàng đợi đơn xin gia nhập tổ chức chờ duyệt |
| | `business_inquiries` | Đơn đăng ký tư vấn giải pháp B2B từ khách hàng doanh nghiệp |
| | `renewal_requests` | Yêu cầu gia hạn chu kỳ hợp đồng đào tạo B2B |
| | `evaluator_classes` | Danh sách lớp học và khóa đào tạo của trường |
| | `class_members` | Danh sách học viên và trợ giảng trong từng lớp học |
| | `class_assignments` | Bài tập khảo thí do giảng viên giao cho lớp |
| | `assignment_submissions` | Bài nộp bài tập lớp kèm điểm số và trạng thái chấm |
| | `class_files` | Kho tài liệu, học liệu đính kèm của lớp học |
| | `class_posts` | Bảng tin thảo luận và thông báo của lớp học |
| | `class_post_replies` | Các phản hồi bình luận trong bài đăng lớp |
| | `class_messages` | Kênh trao đổi tin nhắn trực tiếp nội bộ lớp học |
| **3. Đề thi & Khung năng lực** | `assessment_frameworks` | Bộ khung tiêu chuẩn năng lực số nền tảng |
| | `competency_domains` | Các miền năng lực số cốt lõi trong khung tiêu chuẩn |
| | `competencies` | Danh mục kỹ năng thành phần dùng để phân loại câu hỏi |
| | `assessments` | Bộ đề thi chuẩn hóa, đề khảo sát đầu vào và đề cá nhân |
| | `assessment_items` | Câu hỏi trong đề thi (trắc nghiệm, tự luận, tình huống) |
| | `item_options` | Các phương án lựa chọn và giải thích đáp án |
| | `question_bank_items` | Ngân hàng câu hỏi dùng chung toàn hệ thống |
| | `question_bank_options` | Các phương án trả lời trong ngân hàng câu hỏi |
| | `community_contributions` | Câu hỏi do cộng đồng đề xuất đóng góp chờ thẩm định |
| | `assessment_campaigns` | Đợt thi diện rộng do tổ chức phát động theo khung giờ |
| | `rubrics` | Bộ tiêu chí chấm điểm tự luận và thực hành chuẩn hóa |
| | `rubric_criteria` | Các tiêu chí thành phần trong bộ rubric |
| | `rubric_levels` | Thang đo điểm số chi tiết cho từng tiêu chí |
| **4. Lượt làm bài & Live Room** | `assessment_submissions` | Phiên làm bài thi chính thức, điểm số và kết quả đạt/không đạt |
| | `submission_answers` | Chi tiết câu trả lời của thí sinh cho từng câu hỏi |
| | `exam_rooms` | Phòng thi trực tiếp thời gian thực kích hoạt qua mã PIN 6 số |
| | `room_participants` | Danh sách thí sinh có mặt tại sảnh chờ và phòng thi live |
| | `room_announcements` | Thông báo trực tiếp của giám thị phát tới thí sinh trong phòng |
| | `proctoring_events` | Nhật ký giám sát thi cử (chuyển tab, mất kết nối, nghi vấn gian lận) |
| | `competency_evidence` | Bằng chứng năng lực số tích lũy từ các bài thi đạt chuẩn |
| | `credentials` | Chứng chỉ số chính thức có mộc đỏ, chữ ký số và mã QR tra cứu |
| | `competency_analyses` | Kết quả phân tích khoảng trống năng lực số của cá nhân |
| | `learner_competency_snapshots` | Ảnh chụp lịch sử tiến bộ năng lực theo thời gian |
| **5. AI & Kiểm toán an ninh** | `ai_task_policies` | Cấu hình mô hình AI, định mức token và đơn giá cho từng tác vụ |
| | `ai_usage_events` | Nhật ký tiêu thụ điểm AI và token của từng người dùng/tổ chức |
| | `ai_credit_reservations` | Cơ chế giữ chỗ hạn mức AI đảm bảo tính toán tài nguyên nguyên tử |
| | `ai_grading_jobs` | Hàng đợi tác vụ trợ lý AI phân tích và chấm bài tự luận |
| | `ai_evaluations` | Đề xuất điểm số và nhận xét chi tiết của AI theo rubric |
| | `ai_calibration_logs` | Nhật ký đối soát giữa điểm AI và điểm chuyên gia con người (HITL) |
| | `ai_question_explanations` | Bộ nhớ đệm lời giải thích chi tiết câu hỏi từ trợ lý AI |
| | `admin_audit_logs` | Nhật ký kiểm toán an ninh bất biến của quản trị viên nền tảng |
| | `org_audit_logs` | Nhật ký tác nghiệp nội bộ của quản trị viên trường học |
| | `platform_settings` | Bảng cấu hình tham số toàn sàn và chế độ bảo trì hệ thống |
| | `feedback_tickets` | Hộp thư tiếp nhận góp ý và phản hồi từ người dùng |
| **6. Gói cước & Thanh toán** | `service_plans` | Danh mục các gói cước dịch vụ (Cá nhân Pro, B2B Doanh nghiệp) |
| | `subscriptions` | Hợp đồng thuê bao dịch vụ đang có hiệu lực |
| | `payment_transactions` | Giao dịch thanh toán quét mã VietQR PayOS đối soát tự động |
| | `learning_paths` | Lộ trình bài học bồi dưỡng năng lực số cá nhân hóa |
| | `learning_modules` | Các bài học và nội dung thực hành trong từng lộ trình |
| | `user_learning_progress` | Tiến độ hoàn thành bài học và điểm số rèn luyện của học viên |
| | `course_catalog` | Danh mục các khóa học bên ngoài đã được kiểm duyệt chất lượng |
| | `user_course_progress` | Nhật ký tham gia và tự theo dõi khóa học bổ trợ của học viên |
