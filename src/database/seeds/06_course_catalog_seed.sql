-- ==============================================================================
-- NEXA SEED 06: CURATED COURSE CATALOG (DIGCOMP 5 DOMAINS)
-- Verified high-quality external courses for targeted competency gap remediation
-- ==============================================================================

INSERT INTO public.course_catalog (
    id, title, provider, official_url, domain_codes, level, language, format, duration, price_type, review_status, short_description, learning_outcomes
) VALUES
-- D1: Thông tin & Dữ liệu
(
    'course_d1_01',
    'Kiểm chứng Thông tin số & Nhận diện Tin giả',
    'Google Digital Garage & Poynter',
    'https://grow.google/certificates/',
    ARRAY['D1'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '1-2 tuần (6 giờ)',
    'FREE',
    'APPROVED',
    'Phương pháp thẩm định nguồn tin trực tuyến, xác minh độ tin cậy của bài báo, video và hình ảnh trên mạng xã hội.',
    ARRAY['Đánh giá độ tin cậy của nguồn thông tin', 'Phát hiện hình ảnh và video bị cắt ghép', 'Tra cứu chéo dữ liệu đa nguồn']
),
(
    'course_d1_02',
    'Nhập môn Quản trị & Phân tích Dữ liệu số',
    'Google & Coursera',
    'https://www.coursera.org/professional-certificates/google-data-analytics',
    ARRAY['D1'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '3-4 tuần (15 giờ)',
    'FREE',
    'APPROVED',
    'Cơ sở dữ liệu bảng tính, tổ chức lưu trữ đám mây an toàn và trực quan hóa dữ liệu phục vụ báo cáo số.',
    ARRAY['Tổ chức và phân loại tập dữ liệu số', 'Truy vấn và lọc dữ liệu nâng cao', 'Trực quan hóa biểu đồ phân tích']
),

-- D2: Giao tiếp & Hợp tác
(
    'course_d2_01',
    'Kỹ năng Cộng tác & Làm việc Nhóm trên Môi trường Số',
    'Microsoft & LinkedIn Learning',
    'https://opportunity.linkedin.com/',
    ARRAY['D2'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '2 tuần (8 giờ)',
    'FREE',
    'APPROVED',
    'Sử dụng các công cụ cộng tác trực tuyến (Teams, Slack, Trello, Google Workspace) để phối hợp hiệu quả trong dự án.',
    ARRAY['Quản lý kênh giao tiếp đa phương tiện', 'Phối hợp xử lý văn bản đồng bộ theo thời gian thực', 'Quy tắc ứng xử chuyên nghiệp trong email']
),
(
    'course_d2_02',
    'Quản trị Danh tính số & Văn hóa Ứng xử Mạng',
    'Cục An toàn Thông tin - Bộ TT&TT',
    'https://ais.gov.vn/',
    ARRAY['D2'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '1-2 tuần (5 giờ)',
    'FREE',
    'APPROVED',
    'Xây dựng và bảo vệ uy tín cá nhân trên Internet, kỹ năng phản hồi văn minh và phòng ngừa bắt nạt mạng.',
    ARRAY['Kiểm soát dấu chân kỹ thuật số (Digital Footprint)', 'Ứng xử chuẩn mực trên các diễn đàn công cộng', 'Bảo vệ quyền riêng tư trong hội thoại nhóm']
),

-- D3: Sáng tạo Nội dung số
(
    'course_d3_01',
    'Sáng tạo Nội dung Đa phương tiện & Ứng dụng AI Hỗ trợ',
    'UNESCO & OpenClassrooms',
    'https://openclassrooms.com/',
    ARRAY['D3'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '2-3 tuần (10 giờ)',
    'FREE',
    'APPROVED',
    'Thiết kế ấn phẩm truyền thông số, biên tập hình ảnh/âm thanh và sử dụng AI sinh tổng hợp đúng chuẩn đạo đức.',
    ARRAY['Biên tập đồ họa số với công cụ mã nguồn mở', 'Tạo prompt chuẩn cho AI hỗ trợ soạn thảo', 'Chuyển đổi định dạng tệp tin tối ưu web']
),
(
    'course_d3_02',
    'Bản quyền Số, Sở hữu Trí tuệ & Giấy phép Creative Commons',
    'Creative Commons Global',
    'https://certificates.creativecommons.org/',
    ARRAY['D3'],
    'Nâng cao (Level 3-4)',
    'vi',
    'Trực tuyến (Online)',
    '1 tuần (4 giờ)',
    'FREE',
    'APPROVED',
    'Hiểu rõ luật sở hữu trí tuệ số, cách trích dẫn bản quyền tác giả và cấp phép tài nguyên giáo dục mở (OER).',
    ARRAY['Phân biệt các loại giấy phép CC BY, CC NC, CC SA', 'Trích dẫn nguồn tư liệu số chuẩn học thuật', 'Đăng ký bảo hộ sản phẩm số cá nhân']
),

-- D4: An toàn & Bảo mật
(
    'course_d4_01',
    'Bảo mật Thông tin Cá nhân & Phòng chống Lừa đảo Trực tuyến',
    'Hiệp hội An toàn Thông tin Việt Nam (VNISA)',
    'https://vnisa.org.vn/',
    ARRAY['D4'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '1-2 tuần (6 giờ)',
    'FREE',
    'APPROVED',
    'Nhận biết các hình thức tấn công lừa đảo (Phishing), thiết lập xác thực đa yếu tố (MFA) và bảo vệ tài khoản số.',
    ARRAY['Phát hiện liên kết và email mạo danh lừa đảo', 'Cấu hình bảo mật 2 lớp cho email và ngân hàng', 'Quản lý mật khẩu mạnh với Password Manager']
),
(
    'course_d4_02',
    'Bảo vệ Sức khỏe Số & An toàn Thiết bị Đầu cuối',
    'Bộ Y Tế & Tổ chức Y Tế Thế Giới (WHO)',
    'https://www.who.int/',
    ARRAY['D4'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '1 tuần (4 giờ)',
    'FREE',
    'APPROVED',
    'Công thái học khi làm việc với màn hình, điều tiết thời gian sử dụng thiết bị (Digital Detox) và xử lý rác thải điện tử.',
    ARRAY['Thực hành tư thế ngồi đúng chuẩn công thái học', 'Cài đặt giới hạn thời gian màn hình', 'Bảo quản và tái chế thiết bị điện tử an toàn']
),

-- D5: Giải quyết Vấn đề
(
    'course_d5_01',
    'Tư duy Tính toán & Xử lý Sự cố Kỹ thuật Thường gặp',
    'IBM SkillsBuild & EdX',
    'https://skillsbuild.org/',
    ARRAY['D5'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '2-3 tuần (8 giờ)',
    'FREE',
    'APPROVED',
    'Quy trình chẩn đoán lỗi phần mềm, giải quyết sự cố mạng Internet cơ bản và tự khắc phục lỗi hệ điều hành.',
    ARRAY['Chẩn đoán lỗi mất kết nối mạng và DNS', 'Quản lý tiến trình và gỡ cài đặt phần mềm xung đột', 'Tìm kiếm giải pháp kỹ thuật trên diễn đàn uy tín']
),
(
    'course_d5_02',
    'Tự động hóa Quy trình Công việc bằng Trí tuệ Nhân tạo',
    'DeepLearning.AI & Coursera',
    'https://www.deeplearning.ai/',
    ARRAY['D5'],
    'Nâng cao (Level 3-4)',
    'vi',
    'Trực tuyến (Online)',
    '3-4 tuần (12 giờ)',
    'FREE',
    'APPROVED',
    'Ứng dụng AI agents và công cụ tự động hóa không mã (No-Code) để tối ưu hóa quy trình làm việc và học tập số.',
    ARRAY['Thiết lập luồng tự động hóa công việc lặp lại', 'Kết nối các ứng dụng số qua Webhook và API', 'Đánh giá tính khả thi khi áp dụng công nghệ mới']
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    provider = EXCLUDED.provider,
    official_url = EXCLUDED.official_url,
    domain_codes = EXCLUDED.domain_codes,
    short_description = EXCLUDED.short_description,
    learning_outcomes = EXCLUDED.learning_outcomes;
