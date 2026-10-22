-- ==============================================================================
-- NEXA SEED DATA 01: DYNAMIC COMPETENCY FRAMEWORK (5 DOMAINS & 21 SKILLS)
-- ==============================================================================

DO $$
DECLARE
    v_framework_id UUID;
    v_d1 UUID;
    v_d2 UUID;
    v_d3 UUID;
    v_d4 UUID;
    v_d5 UUID;
BEGIN
    -- 1. Insert Framework
    INSERT INTO public.assessment_frameworks (code, title, version, description, status, is_default)
    VALUES (
        'NEXA_CORE_FRAMEWORK_V1',
        'Khung Năng lực Số Chuẩn Toàn diện',
        '3.0',
        'Khung tiêu chuẩn năng lực số chuẩn hóa theo EU DigComp 3.0 và định hướng Việt Nam.',
        'ACTIVE',
        TRUE
    )
    ON CONFLICT (code) DO UPDATE 
    SET title = EXCLUDED.title, version = EXCLUDED.version
    RETURNING id INTO v_framework_id;

    -- 2. Insert 5 Competency Domains
    -- Miền 1: Thông tin và Dữ liệu số (20%)
    INSERT INTO public.competency_domains (framework_id, domain_index, code, title, description, weight_percent)
    VALUES (
        v_framework_id,
        1,
        '01',
        'Thông tin và Dữ liệu số',
        'Tìm kiếm, lọc, đánh giá độ tin cậy và quản lý dữ liệu số.',
        20.00
    )
    ON CONFLICT (framework_id, domain_index) DO UPDATE 
    SET title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO v_d1;

    -- Miền 2: Giao tiếp và Cộng tác số (20%)
    INSERT INTO public.competency_domains (framework_id, domain_index, code, title, description, weight_percent)
    VALUES (
        v_framework_id,
        2,
        '02',
        'Giao tiếp và Cộng tác số',
        'Tương tác, chia sẻ dữ liệu an toàn và ứng xử văn minh trong môi trường số.',
        20.00
    )
    ON CONFLICT (framework_id, domain_index) DO UPDATE 
    SET title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO v_d2;

    -- Miền 3: Sáng tạo Nội dung số & AI (20%)
    INSERT INTO public.competency_domains (framework_id, domain_index, code, title, description, weight_percent)
    VALUES (
        v_framework_id,
        3,
        '03',
        'Sáng tạo Nội dung số & AI',
        'Phát triển nội dung số, thiết kế câu lệnh AI, bản quyền và tư duy thuật toán.',
        20.00
    )
    ON CONFLICT (framework_id, domain_index) DO UPDATE 
    SET title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO v_d3;

    -- Miền 4: An toàn và Sức khỏe số (20%)
    INSERT INTO public.competency_domains (framework_id, domain_index, code, title, description, weight_percent)
    VALUES (
        v_framework_id,
        4,
        '04',
        'An toàn và Sức khỏe số',
        'Bảo vệ thiết bị, dữ liệu cá nhân, quyền riêng tư NĐ 13 và sức khỏe số.',
        20.00
    )
    ON CONFLICT (framework_id, domain_index) DO UPDATE 
    SET title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO v_d4;

    -- Miền 5: Giải quyết Vấn đề số (20%)
    INSERT INTO public.competency_domains (framework_id, domain_index, code, title, description, weight_percent)
    VALUES (
        v_framework_id,
        5,
        '05',
        'Giải quyết Vấn đề số',
        'Chẩn đoán sự cố kỹ thuật, lựa chọn công cụ số và tự học công nghệ mới.',
        20.00
    )
    ON CONFLICT (framework_id, domain_index) DO UPDATE 
    SET title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO v_d5;

    -- 3. Insert 21 Competencies
    -- Domain 1 Skills
    INSERT INTO public.competencies (domain_id, skill_code, title, description, behavioral_indicators, display_order)
    VALUES 
    (v_d1, '1.1', 'Tìm kiếm, duyệt và lọc dữ liệu số', 'Xác định nhu cầu thông tin, sử dụng truy vấn tìm kiếm nâng cao, lọc kết quả chính xác.', '["Biết sử dụng cú pháp tìm kiếm nâng cao", "Lọc dữ liệu theo nguồn và thời gian"]', 1),
    (v_d1, '1.2', 'Đánh giá độ tin cậy của dữ liệu và thông tin số', 'Kiểm chứng nguồn tin, phân biệt tin giả/tin do AI tạo sai lệch (hallucination), đối chiếu đa nguồn.', '["Phát hiện tin giả và ảo giác AI", "Đối chiếu chéo nguồn tin gốc"]', 2),
    (v_d1, '1.3', 'Quản lý, lưu trữ và truy xuất dữ liệu số', 'Tổ chức cây thư mục khoa học, sao lưu đám mây (quy tắc 3-2-1), chuẩn hóa tên tệp và cấu trúc dữ liệu.', '["Áp dụng quy tắc sao lưu 3-2-1", "Phân loại và đặt tên file chuẩn mực"]', 3)
    ON CONFLICT (domain_id, skill_code) DO NOTHING;

    -- Domain 2 Skills
    INSERT INTO public.competencies (domain_id, skill_code, title, description, behavioral_indicators, display_order)
    VALUES 
    (v_d2, '2.1', 'Tương tác qua các công nghệ số', 'Lựa chọn kênh giao tiếp số phù hợp với ngữ cảnh công việc (Email, Chat, Video Conference).', '["Chọn đúng kênh giao tiếp số theo bối cảnh"]', 1),
    (v_d2, '2.2', 'Chia sẻ thông tin và nội dung số an toàn', 'Phân quyền chia sẻ tài liệu đám mây đúng vai trò (Viewer/Commenter/Editor), trích dẫn nguồn rõ ràng.', '["Phân quyền tài liệu chính xác", "Trích dẫn bản quyền đầy đủ"]', 2),
    (v_d2, '2.3', 'Tham gia dịch vụ công và trách nhiệm công dân số', 'Sử dụng dịch vụ số trực tuyến, định danh điện tử và tuân thủ quy định pháp luật trên không gian mạng.', '["Sử dụng định danh số an toàn", "Tuân thủ pháp luật an ninh mạng"]', 3),
    (v_d2, '2.4', 'Hợp tác và làm việc nhóm trên nền tảng số', 'Sử dụng công cụ quản lý dự án, đồng biên tập tài liệu thời gian thực và kiểm soát lịch sử phiên bản.', '["Đồng biên tập tài liệu thời gian thực", "Quản lý công việc trên Kanban/Agile board"]', 4),
    (v_d2, '2.5', 'Chuẩn mực ứng xử và giao tiếp số (Netiquette)', 'Viết thông điệp chuyên nghiệp, tôn trọng sự khác biệt, xử lý xung đột văn minh trên môi trường số.', '["Tuân thủ quy chuẩn Netiquette", "Giao tiếp công sở chuẩn mực qua văn bản"]', 5),
    (v_d2, '2.6', 'Quản lý danh tính và dấu vết số cá nhân', 'Kiểm soát thông tin công khai, bảo vệ uy tín nghề nghiệp và quản lý dấu vết dữ liệu (Digital Footprint).', '["Kiểm soát quyền riêng tư mạng xã hội", "Quản trị dấu chân kỹ thuật số cá nhân"]', 6)
    ON CONFLICT (domain_id, skill_code) DO NOTHING;

    -- Domain 3 Skills
    INSERT INTO public.competencies (domain_id, skill_code, title, description, behavioral_indicators, display_order)
    VALUES 
    (v_d3, '3.1', 'Phát triển nội dung số đa định dạng', 'Tạo văn bản, bảng biểu, bài trình chiếu, sơ đồ trực quan và nội dung đa phương tiện chuẩn mực.', '["Thiết kế bài thuyết trình trực quan", "Biên tập tài liệu số chuẩn quy cách"]', 1),
    (v_d3, '3.2', 'Tích hợp, biên tập và cộng tác cùng AI tạo sinh', 'Thiết kế câu lệnh (Prompt Engineering) hiệu quả, tinh chỉnh và kiểm chứng đầu ra do AI sinh ra.', '["Cấu trúc câu lệnh Prompt 4 thành phần", "Kiểm duyệt và chỉnh lý phản hồi của AI"]', 2),
    (v_d3, '3.3', 'Bản quyền, giấy phép số và đạo đức sử dụng AI', 'Phân biệt các giấy phép Creative Commons, nguồn mở, tôn trọng sở hữu trí tuệ và minh bạch khi dùng AI.', '["Phân biệt các loại giấy phép bản quyền CC", "Minh bạch việc sử dụng công cụ AI"]', 3),
    (v_d3, '3.4', 'Tư duy thuật toán và tự động hóa quy trình', 'Phân rã bài toán thành các bước logic, thiết lập quy tắc tự động hóa công việc lặp lại hoặc viết script/hàm.', '["Xây dựng sơ đồ logic xử lý bài toán", "Tự động hóa tác vụ lặp lại"]', 4)
    ON CONFLICT (domain_id, skill_code) DO NOTHING;

    -- Domain 4 Skills
    INSERT INTO public.competencies (domain_id, skill_code, title, description, behavioral_indicators, display_order)
    VALUES 
    (v_d4, '4.1', 'Bảo vệ thiết bị và hạ tầng kết nối', 'Thiết lập mật khẩu mạnh, xác thực đa yếu tố (2FA/MFA), cập nhật bản vá bảo mật và phòng chống mã độc.', '["Cấu hình xác thực 2 bước 2FA", "Quản lý mật khẩu bằng công cụ an toàn"]', 1),
    (v_d4, '4.2', 'Bảo vệ dữ liệu cá nhân và quyền riêng tư', 'Nhận diện tấn công lừa đảo (Phishing/Social Engineering), mã hóa dữ liệu nhạy cảm và tuân thủ Nghị định 13.', '["Nhận diện email và link lừa đảo Phishing", "Thực thi quyền đồng thuận theo NĐ 13"]', 2),
    (v_d4, '4.3', 'Bảo vệ sức khỏe thể chất và tâm lý số', 'Cân bằng thời gian sử dụng màn hình, công thái học làm việc và phòng tránh quá tải thông tin.', '["Thực hành công thái học khi làm việc máy tính", "Kiểm soát thời gian dùng thiết bị số"]', 3),
    (v_d4, '4.4', 'Sử dụng công nghệ số bền vững với môi trường', 'Tối ưu hóa lưu trữ đám mây, giảm rác thải dữ liệu và tiết kiệm năng lượng thiết bị số.', '["Tối ưu hóa dung lượng lưu trữ đám mây", "Tắt thiết bị và tiết kiệm năng lượng"]', 4)
    ON CONFLICT (domain_id, skill_code) DO NOTHING;

    -- Domain 5 Skills
    INSERT INTO public.competencies (domain_id, skill_code, title, description, behavioral_indicators, display_order)
    VALUES 
    (v_d5, '5.1', 'Xác định và khắc phục sự cố kỹ thuật', 'Chẩn đoán nguyên nhân lỗi phần mềm, kết nối mạng hoặc thiết bị và tìm giải pháp xử lý hiệu quả.', '["Chẩn đoán nguyên nhân mất kết nối mạng", "Khắc phục lỗi ứng dụng cơ bản"]', 1),
    (v_d5, '5.2', 'Xác định nhu cầu và lựa chọn công cụ công nghệ', 'Đánh giá ưu/nhược điểm và chọn đúng phần mềm, công cụ số hoặc mô hình AI phù hợp cho bài toán thực tế.', '["So sánh và chọn công cụ số tối ưu chi phí", "Chọn đúng mô hình AI theo tác vụ"]', 2),
    (v_d5, '5.3', 'Ứng dụng sáng tạo công nghệ số vào giải quyết vấn đề', 'Kết hợp dữ liệu và các công cụ số để tối ưu hóa quy trình học tập, nghiên cứu hoặc vận hành công việc.', '["Tích hợp công cụ số giải quyết bài toán nhóm", "Tạo giải pháp mới từ công nghệ có sẵn"]', 3),
    (v_d5, '5.4', 'Tự nhận diện khoảng trống năng lực số và học tập liên tục', 'Biết tự đánh giá điểm yếu kỹ năng số của bản thân và chủ động cập nhật công nghệ mới.', '["Tự phân tích khoảng trống năng lực cá nhân", "Chủ động tham gia học liệu số bồi dưỡng"]', 4)
    ON CONFLICT (domain_id, skill_code) DO NOTHING;

END $$;
