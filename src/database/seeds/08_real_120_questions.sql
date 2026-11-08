-- ==============================================================================
-- NEXA SEED 08: 120 REAL QUESTIONS, BASELINE 25-Q EXAM, AND 5 LEARNING PATHS
-- ==============================================================================

DO $$
DECLARE
    v_framework_id UUID;
    v_item_id UUID;
BEGIN
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;

    -- 1. BASELINE ASSESSMENT (25 Selected Questions)
    INSERT INTO public.assessments (
        id, title, description, framework_id, duration_minutes, passing_score, point_reward,
        is_published, visibility, access_tier, is_system_baseline, system_code
    ) VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
        'Bài khảo thí chẩn đoán năng lực số ban đầu gồm 25 câu hỏi trắc nghiệm chuẩn hóa chọn lọc bao quát trọn vẹn 5 miền năng lực số. Hoàn thành để tự động xác lập Hồ sơ năng lực và kích hoạt lộ trình học tập cá nhân hóa.',
        v_framework_id, 25, 70.00, 50, TRUE, 'PUBLIC', 'FREE', TRUE, 'BASELINE_5DOMAINS'
    ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = TRUE,
        visibility = 'PUBLIC',
        access_tier = 'FREE',
        is_system_baseline = TRUE,
        system_code = 'BASELINE_5DOMAINS';

    DELETE FROM public.assessment_items WHERE assessment_id = 'a0000000-0000-0000-0000-000000000001';

    -- Baseline Question 1 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi cần tìm tài liệu học thuật đáng tin cậy, công cụ nào phù hợp nhất?',
        4.00,
        1,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Facebook cá nhân', FALSE, 1),
        (v_item_id, 'Google Scholar', TRUE, 2),
        (v_item_id, 'Tin nhắn nhóm', FALSE, 3),
        (v_item_id, 'TikTok', FALSE, 4);

    -- Baseline Question 2 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Dấu ngoặc kép trong tìm kiếm Google dùng để làm gì?',
        4.00,
        2,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tự động dịch văn bản', FALSE, 1),
        (v_item_id, 'Tìm chính xác cụm từ', TRUE, 2),
        (v_item_id, 'Xóa kết quả trùng lặp', FALSE, 3),
        (v_item_id, 'Tăng tốc máy tính', FALSE, 4);

    -- Baseline Question 3 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Cách tổ chức thư mục hiệu quả là gì?',
        4.00,
        3,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Phân loại theo môn/chủ đề/thời gian', TRUE, 1),
        (v_item_id, 'Xóa sau khi dùng', FALSE, 2),
        (v_item_id, 'Để tất cả ngoài desktop', FALSE, 3),
        (v_item_id, 'Lưu tùy ý', FALSE, 4);

    -- Baseline Question 4 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Tin giả thường có dấu hiệu nào?',
        4.00,
        4,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Có nguồn chính thức', FALSE, 1),
        (v_item_id, 'Tiêu đề giật gân, thiếu nguồn, kích động cảm xúc', TRUE, 2),
        (v_item_id, 'Có dữ liệu kiểm chứng', FALSE, 3),
        (v_item_id, 'Có trích dẫn rõ ràng', FALSE, 4);

    -- Baseline Question 5 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Nội dung do AI tạo ra có thể gặp vấn đề gì?',
        4.00,
        5,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Luôn chính xác', FALSE, 1),
        (v_item_id, 'Luôn cập nhật', FALSE, 2),
        (v_item_id, 'Không cần chỉnh sửa', FALSE, 3),
        (v_item_id, 'Sai sự thật, thiếu nguồn, bịa thông tin', TRUE, 4);

    -- Baseline Question 6 (Domain 2, Skill 2.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '2.2' LIMIT 1),
        'MCQ',
        'Khi gửi email học tập/làm việc, tiêu đề nên như thế nào?',
        4.00,
        6,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Rõ nội dung, ngắn gọn, lịch sự', TRUE, 1),
        (v_item_id, 'Để trống', FALSE, 2),
        (v_item_id, 'Viết “Gấp!!!” cho mọi email', FALSE, 3),
        (v_item_id, 'Dùng ký hiệu khó hiểu', FALSE, 4);

    -- Baseline Question 7 (Domain 2, Skill 2.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '2.1' LIMIT 1),
        'MCQ',
        '“Dấu vết số” là gì?',
        4.00,
        7,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Dấu vân tay trên màn hình', FALSE, 1),
        (v_item_id, 'Mật khẩu Wi-Fi', FALSE, 2),
        (v_item_id, 'Mã QR', FALSE, 3),
        (v_item_id, 'Dữ liệu/hành vi để lại khi hoạt động trên môi trường số', TRUE, 4);

    -- Baseline Question 8 (Domain 2, Skill 2.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '2.4' LIMIT 1),
        'MCQ',
        'Công cụ nào phù hợp để cộng tác soạn thảo tài liệu nhóm?',
        4.00,
        8,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Google Docs/Microsoft 365', TRUE, 1),
        (v_item_id, 'Ổ cắm điện', FALSE, 2),
        (v_item_id, 'Máy tính cầm tay', FALSE, 3),
        (v_item_id, 'Phần mềm diệt virus', FALSE, 4);

    -- Baseline Question 9 (Domain 2, Skill 2.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '2.2' LIMIT 1),
        'MCQ',
        'Khi xảy ra hiểu nhầm trong giao tiếp số, nên làm gì?',
        4.00,
        9,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Trao đổi lại bình tĩnh, làm rõ ngữ cảnh', TRUE, 1),
        (v_item_id, 'Đăng bài chỉ trích', FALSE, 2),
        (v_item_id, 'Chặn ngay mọi người', FALSE, 3),
        (v_item_id, 'Chia sẻ đoạn chat công khai', FALSE, 4);

    -- Baseline Question 10 (Domain 2, Skill 2.5)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '2.5' LIMIT 1),
        'MCQ',
        'Khi chia sẻ màn hình trong cuộc họp, nên làm gì trước?',
        4.00,
        10,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đóng nội dung riêng tư/nhạy cảm', TRUE, 1),
        (v_item_id, 'Mở tất cả ứng dụng', FALSE, 2),
        (v_item_id, 'Bật thông báo cá nhân', FALSE, 3),
        (v_item_id, 'Không cần kiểm tra', FALSE, 4);

    -- Baseline Question 11 (Domain 3, Skill 3.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        'MCQ',
        'Sáng tạo nội dung số bao gồm hoạt động nào?',
        4.00,
        11,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tạo, chỉnh sửa, kết hợp văn bản/hình ảnh/video/dữ liệu', TRUE, 1),
        (v_item_id, 'Chỉ đổi mật khẩu', FALSE, 2),
        (v_item_id, 'Chỉ xem video', FALSE, 3),
        (v_item_id, 'Chỉ tải file', FALSE, 4);

    -- Baseline Question 12 (Domain 3, Skill 3.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        'MCQ',
        'Khi sử dụng AI để viết bài, việc nào là cần thiết?',
        4.00,
        12,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Kiểm tra, chỉnh sửa, ghi nhận phù hợp', TRUE, 1),
        (v_item_id, 'Nộp nguyên văn', FALSE, 2),
        (v_item_id, 'Không đọc lại', FALSE, 3),
        (v_item_id, 'Xóa mọi dấu vết nguồn', FALSE, 4);

    -- Baseline Question 13 (Domain 3, Skill 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '3.4' LIMIT 1),
        'MCQ',
        'Một prompt tốt cho AI tạo nội dung nên có gì?',
        4.00,
        13,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Vai trò, nhiệm vụ, bối cảnh, yêu cầu đầu ra', TRUE, 1),
        (v_item_id, 'Không cần mục tiêu', FALSE, 2),
        (v_item_id, 'Một từ bất kỳ', FALSE, 3),
        (v_item_id, 'Chỉ biểu tượng cảm xúc', FALSE, 4);

    -- Baseline Question 14 (Domain 3, Skill 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '3.4' LIMIT 1),
        'MCQ',
        'Khi xuất bản nội dung lên mạng, người dùng cần cân nhắc điều gì?',
        4.00,
        14,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tác động, độ chính xác, quyền riêng tư', TRUE, 1),
        (v_item_id, 'Chỉ cần nhiều lượt xem', FALSE, 2),
        (v_item_id, 'Đăng càng nhanh càng tốt', FALSE, 3),
        (v_item_id, 'Không cần đọc lại', FALSE, 4);

    -- Baseline Question 15 (Domain 3, Skill 3.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '3.3' LIMIT 1),
        'MCQ',
        'Lập trình cơ bản trong năng lực số giúp gì?',
        4.00,
        15,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Hiểu logic, tự động hóa, giải quyết vấn đề', TRUE, 1),
        (v_item_id, 'Chỉ để chơi game', FALSE, 2),
        (v_item_id, 'Chỉ dành cho hacker', FALSE, 3),
        (v_item_id, 'Không liên quan học tập', FALSE, 4);

    -- Baseline Question 16 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Mật khẩu mạnh nên có đặc điểm nào?',
        4.00,
        16,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, '123456', FALSE, 1),
        (v_item_id, 'Dài, khó đoán, gồm chữ/số/ký tự', TRUE, 2),
        (v_item_id, 'Tên bản thân', FALSE, 3),
        (v_item_id, 'Ngày sinh', FALSE, 4);

    -- Baseline Question 17 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Khi dùng Wi-Fi công cộng, nên tránh điều gì?',
        4.00,
        17,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đăng nhập tài khoản quan trọng/giao dịch nhạy cảm nếu không an toàn', TRUE, 1),
        (v_item_id, 'Xem thời tiết', FALSE, 2),
        (v_item_id, 'Đọc tin tức', FALSE, 3),
        (v_item_id, 'Tìm đường', FALSE, 4);

    -- Baseline Question 18 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Khi chia sẻ CCCD/số tài khoản lên mạng, rủi ro là gì?',
        4.00,
        18,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bị lợi dụng danh tính/lừa đảo', TRUE, 1),
        (v_item_id, 'Tăng uy tín', FALSE, 2),
        (v_item_id, 'Không có rủi ro', FALSE, 3),
        (v_item_id, 'Tăng lượt theo dõi', FALSE, 4);

    -- Baseline Question 19 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Hành vi nào là thiếu trách nhiệm số?',
        4.00,
        19,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chia sẻ thông tin cá nhân người khác không xin phép', TRUE, 1),
        (v_item_id, 'Ghi nguồn tài liệu', FALSE, 2),
        (v_item_id, 'Kiểm chứng tin', FALSE, 3),
        (v_item_id, 'Tôn trọng người khác', FALSE, 4);

    -- Baseline Question 20 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Khi phát hiện tài khoản bị đăng nhập lạ, nên làm gì đầu tiên?',
        4.00,
        20,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bỏ qua', FALSE, 1),
        (v_item_id, 'Đăng công khai mật khẩu', FALSE, 2),
        (v_item_id, 'Tạo thêm tài khoản giả', FALSE, 3),
        (v_item_id, 'Đổi mật khẩu và đăng xuất khỏi thiết bị lạ', TRUE, 4);

    -- Baseline Question 21 (Domain 5, Skill 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        'MCQ',
        'Khi gặp lỗi phần mềm, bước đầu tiên nên làm gì?',
        4.00,
        21,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Xóa ngay phần mềm', FALSE, 1),
        (v_item_id, 'Đổ lỗi cho thiết bị', FALSE, 2),
        (v_item_id, 'Cài phần mềm lạ', FALSE, 3),
        (v_item_id, 'Xác định lỗi, đọc thông báo lỗi, thử cách xử lý cơ bản', TRUE, 4);

    -- Baseline Question 22 (Domain 5, Skill 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        'MCQ',
        'Kỹ năng tự học công nghệ mới quan trọng vì sao?',
        4.00,
        22,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chỉ chuyên gia mới cần', FALSE, 1),
        (v_item_id, 'Công nghệ thay đổi nhanh, cần thích nghi liên tục', TRUE, 2),
        (v_item_id, 'Học một lần là đủ', FALSE, 3),
        (v_item_id, 'Không cần học nếu biết một phần mềm', FALSE, 4);

    -- Baseline Question 23 (Domain 5, Skill 5.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '5.3' LIMIT 1),
        'MCQ',
        'Prompt nào tốt hơn khi hỏi AI?',
        4.00,
        23,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, '“Đóng vai chuyên gia, lập bảng 5 bước, có ví dụ”', TRUE, 1),
        (v_item_id, '“Làm đi”', FALSE, 2),
        (v_item_id, '“Nói gì đó”', FALSE, 3),
        (v_item_id, '“Nhanh”', FALSE, 4);

    -- Baseline Question 24 (Domain 5, Skill 5.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '5.4' LIMIT 1),
        'MCQ',
        'Khi muốn cải tiến quy trình làm việc bằng công nghệ, cần bắt đầu từ đâu?',
        4.00,
        24,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Mua phần mềm trước', FALSE, 1),
        (v_item_id, 'Tạo nhóm chat mới', FALSE, 2),
        (v_item_id, 'Đổi logo', FALSE, 3),
        (v_item_id, 'Xác định điểm nghẽn và dữ liệu đầu vào/đầu ra', TRUE, 4);

    -- Baseline Question 25 (Domain 5, Skill 5.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        (SELECT id FROM public.competencies WHERE skill_code = '5.1' LIMIT 1),
        'MCQ',
        'Mục tiêu cuối cùng của giải quyết vấn đề bằng công nghệ là gì?',
        4.00,
        25,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tạo ra kết quả hiệu quả, an toàn, có giá trị', TRUE, 1),
        (v_item_id, 'Làm nhanh dù sai', FALSE, 2),
        (v_item_id, 'Dùng thật nhiều ứng dụng', FALSE, 3),
        (v_item_id, 'Thay thế mọi con người', FALSE, 4);

    -- 2. BENCHMARK ASSESSMENT (120 Questions)
    INSERT INTO public.assessments (
        id, title, description, framework_id, duration_minutes, passing_score, point_reward,
        is_published, visibility, access_tier, is_system_baseline, system_code
    ) VALUES (
        'a0000000-0000-0000-0000-000000000002',
        'Khảo Thí Đánh Giá Năng Lực Số Toàn Diện 5 Miền (Bộ Chuẩn 120 Câu)',
        'Bộ đề đánh giá toàn diện 120 câu hỏi trắc nghiệm bao quát trọn vẹn 21 kỹ năng số theo 5 miền năng lực số. Phục vụ đánh giá chuyên sâu và xếp hạng năng lực.',
        v_framework_id, 90, 70.00, 150, TRUE, 'PUBLIC', 'FREE', FALSE, 'BENCHMARK_120_5DOMAINS'
    ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = TRUE,
        visibility = 'PUBLIC',
        access_tier = 'FREE',
        is_system_baseline = FALSE,
        system_code = 'BENCHMARK_120_5DOMAINS';

    DELETE FROM public.assessment_items WHERE assessment_id = 'a0000000-0000-0000-0000-000000000002';

    -- Benchmark Question 1 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi cần tìm tài liệu học thuật đáng tin cậy, công cụ nào phù hợp nhất?',
        1.00,
        1,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Google Scholar', TRUE, 1),
        (v_item_id, 'TikTok', FALSE, 2),
        (v_item_id, 'Tin nhắn nhóm', FALSE, 3),
        (v_item_id, 'Facebook cá nhân', FALSE, 4);

    -- Benchmark Question 2 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Từ khóa tìm kiếm tốt là từ khóa như thế nào?',
        1.00,
        2,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Có nhiều biểu tượng cảm xúc', FALSE, 1),
        (v_item_id, 'Viết hoa toàn bộ', FALSE, 2),
        (v_item_id, 'Ngắn, rõ, đúng trọng tâm', TRUE, 3),
        (v_item_id, 'Càng dài càng tốt', FALSE, 4);

    -- Benchmark Question 3 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Khi tìm tài liệu về “năng lực số sinh viên”, cách tìm nào hiệu quả hơn?',
        1.00,
        3,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Gõ “năng lực số sinh viên filetype:pdf”', TRUE, 1),
        (v_item_id, 'Gõ “giúp tôi với”', FALSE, 2),
        (v_item_id, 'Chỉ tìm trên mạng xã hội', FALSE, 3),
        (v_item_id, 'Hỏi ngẫu nhiên trong nhóm chat', FALSE, 4);

    -- Benchmark Question 4 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Dấu ngoặc kép trong tìm kiếm Google dùng để làm gì?',
        1.00,
        4,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tự động dịch văn bản', FALSE, 1),
        (v_item_id, 'Tìm chính xác cụm từ', TRUE, 2),
        (v_item_id, 'Xóa kết quả trùng lặp', FALSE, 3),
        (v_item_id, 'Tăng tốc máy tính', FALSE, 4);

    -- Benchmark Question 5 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Khi muốn loại bỏ một từ khỏi kết quả tìm kiếm, có thể dùng ký hiệu nào?',
        1.00,
        5,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Dấu trừ “-”', TRUE, 1),
        (v_item_id, 'Dấu cộng “+”', FALSE, 2),
        (v_item_id, 'Dấu chấm hỏi “?”', FALSE, 3),
        (v_item_id, 'Dấu sao “*”', FALSE, 4);

    -- Benchmark Question 6 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Khi tìm văn bản pháp luật chính thức, nên ưu tiên nguồn nào?',
        1.00,
        6,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Cổng thông tin cơ quan nhà nước', TRUE, 1),
        (v_item_id, 'Ảnh chụp không ghi ngày', FALSE, 2),
        (v_item_id, 'Bài đăng không rõ nguồn', FALSE, 3),
        (v_item_id, 'Bình luận mạng xã hội', FALSE, 4);

    -- Benchmark Question 7 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi tìm thông tin mới, yếu tố nào cần kiểm tra?',
        1.00,
        7,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Màu nền website', FALSE, 1),
        (v_item_id, 'Số lượng quảng cáo', FALSE, 2),
        (v_item_id, 'Kích cỡ logo', FALSE, 3),
        (v_item_id, 'Ngày đăng/cập nhật', TRUE, 4);

    -- Benchmark Question 8 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Kết quả tìm kiếm đầu tiên trên Google luôn đúng?',
        1.00,
        8,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Không, cần kiểm chứng', TRUE, 1),
        (v_item_id, 'Chỉ đúng nếu tiêu đề in hoa', FALSE, 2),
        (v_item_id, 'Có, luôn chính xác', FALSE, 3),
        (v_item_id, 'Chỉ đúng nếu có nhiều lượt xem', FALSE, 4);

    -- Benchmark Question 9 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Khi tìm kiếm bằng AI, người dùng nên làm gì?',
        1.00,
        9,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tin tuyệt đối', FALSE, 1),
        (v_item_id, 'Sao chép ngay', FALSE, 2),
        (v_item_id, 'Không cần hỏi nguồn', FALSE, 3),
        (v_item_id, 'Kiểm tra lại bằng nguồn đáng tin cậy', TRUE, 4);

    -- Benchmark Question 10 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Dữ liệu số là gì?',
        1.00,
        10,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Thông tin được lưu trữ/xử lý bằng thiết bị số', TRUE, 1),
        (v_item_id, 'Chỉ là giấy tờ in ra', FALSE, 2),
        (v_item_id, 'Chỉ là hình ảnh', FALSE, 3),
        (v_item_id, 'Chỉ là mật khẩu', FALSE, 4);

    -- Benchmark Question 11 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Khi lưu tài liệu học tập, cách đặt tên file nào tốt nhất?',
        1.00,
        11,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'không cần đặt tên', FALSE, 1),
        (v_item_id, 'filemoi', FALSE, 2),
        (v_item_id, 'TenMon_ChuDe_NgayThang', TRUE, 3),
        (v_item_id, 'abcxyz', FALSE, 4);

    -- Benchmark Question 12 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Cách tổ chức thư mục hiệu quả là gì?',
        1.00,
        12,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Phân loại theo môn/chủ đề/thời gian', TRUE, 1),
        (v_item_id, 'Để tất cả ngoài desktop', FALSE, 2),
        (v_item_id, 'Lưu tùy ý', FALSE, 3),
        (v_item_id, 'Xóa sau khi dùng', FALSE, 4);

    -- Benchmark Question 13 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi tải tài liệu từ Internet, cần chú ý điều gì trước tiên?',
        1.00,
        13,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tên người gửi có hay không', FALSE, 1),
        (v_item_id, 'Nguồn và độ an toàn của file', TRUE, 2),
        (v_item_id, 'File có biểu tượng đẹp không', FALSE, 3),
        (v_item_id, 'Màu sắc file', FALSE, 4);

    -- Benchmark Question 14 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Định dạng PDF thường phù hợp để làm gì?',
        1.00,
        14,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chia sẻ tài liệu giữ nguyên bố cục', TRUE, 1),
        (v_item_id, 'Chạy phần mềm', FALSE, 2),
        (v_item_id, 'Lưu mật khẩu', FALSE, 3),
        (v_item_id, 'Diệt virus', FALSE, 4);

    -- Benchmark Question 15 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Khi tìm hình ảnh sử dụng trong bài thuyết trình, cần chú ý điều gì?',
        1.00,
        15,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bản quyền và giấy phép sử dụng', TRUE, 1),
        (v_item_id, 'Không cần ghi nguồn', FALSE, 2),
        (v_item_id, 'Ảnh càng lớn càng tốt', FALSE, 3),
        (v_item_id, 'Chỉ cần đẹp', FALSE, 4);

    -- Benchmark Question 16 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Công cụ lọc thời gian trong tìm kiếm giúp gì?',
        1.00,
        16,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tăng dung lượng lưu trữ', FALSE, 1),
        (v_item_id, 'Tự động tóm tắt văn bản', FALSE, 2),
        (v_item_id, 'Chặn quảng cáo', FALSE, 3),
        (v_item_id, 'Tìm thông tin theo khoảng thời gian mong muốn', TRUE, 4);

    -- Benchmark Question 17 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Khi cần tìm tài liệu tiếng Anh, cách nào nên dùng?',
        1.00,
        17,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Dùng từ khóa tiếng Anh phù hợp', TRUE, 1),
        (v_item_id, 'Dùng ký tự đặc biệt', FALSE, 2),
        (v_item_id, 'Chỉ dùng tiếng Việt', FALSE, 3),
        (v_item_id, 'Gõ không dấu', FALSE, 4);

    -- Benchmark Question 18 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Kỹ năng tìm kiếm thông tin tốt giúp người học điều gì?',
        1.00,
        18,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Không cần học', FALSE, 1),
        (v_item_id, 'Tránh mọi bài kiểm tra', FALSE, 2),
        (v_item_id, 'Không cần đọc tài liệu', FALSE, 3),
        (v_item_id, 'Tiết kiệm thời gian và tăng độ chính xác', TRUE, 4);

    -- Benchmark Question 19 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi có quá nhiều kết quả tìm kiếm, nên làm gì?',
        1.00,
        19,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Thu hẹp bằng từ khóa cụ thể hơn', TRUE, 1),
        (v_item_id, 'Mở tất cả kết quả', FALSE, 2),
        (v_item_id, 'Chọn ngẫu nhiên', FALSE, 3),
        (v_item_id, 'Dừng tìm kiếm', FALSE, 4);

    -- Benchmark Question 20 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Khi lưu dữ liệu quan trọng, người dùng nên làm gì?',
        1.00,
        20,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Gửi lên mạng xã hội', FALSE, 1),
        (v_item_id, 'Sao lưu định kỳ', TRUE, 2),
        (v_item_id, 'Đổi tên liên tục', FALSE, 3),
        (v_item_id, 'Chỉ lưu ở một nơi', FALSE, 4);

    -- Benchmark Question 21 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Tiêu chí quan trọng khi đánh giá một nguồn tin là gì?',
        1.00,
        21,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tác giả, nguồn, thời gian, bằng chứng', TRUE, 1),
        (v_item_id, 'Màu sắc trang web', FALSE, 2),
        (v_item_id, 'Tiêu đề gây sốc', FALSE, 3),
        (v_item_id, 'Số emoji', FALSE, 4);

    -- Benchmark Question 22 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Tin giả thường có dấu hiệu nào?',
        1.00,
        22,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Có nguồn chính thức', FALSE, 1),
        (v_item_id, 'Tiêu đề giật gân, thiếu nguồn, kích động cảm xúc', TRUE, 2),
        (v_item_id, 'Có dữ liệu kiểm chứng', FALSE, 3),
        (v_item_id, 'Có trích dẫn rõ ràng', FALSE, 4);

    -- Benchmark Question 23 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Khi đọc một số liệu thống kê, cần kiểm tra điều gì?',
        1.00,
        23,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Phông chữ', FALSE, 1),
        (v_item_id, 'Ai chia sẻ', FALSE, 2),
        (v_item_id, 'Số lượt thích', FALSE, 3),
        (v_item_id, 'Nguồn, thời điểm, phương pháp thu thập', TRUE, 4);

    -- Benchmark Question 24 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Một bài viết có nhiều lượt chia sẻ có chắc đúng không?',
        1.00,
        24,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Không chắc, cần kiểm chứng', TRUE, 1),
        (v_item_id, 'Đúng nếu đăng ban đêm', FALSE, 2),
        (v_item_id, 'Chắc chắn đúng', FALSE, 3),
        (v_item_id, 'Đúng nếu có ảnh minh họa', FALSE, 4);

    -- Benchmark Question 25 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi AI trả lời một vấn đề chuyên môn, người dùng nên làm gì?',
        1.00,
        25,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tin ngay', FALSE, 1),
        (v_item_id, 'Dùng nguyên văn', FALSE, 2),
        (v_item_id, 'Không cần kiểm tra', FALSE, 3),
        (v_item_id, 'Đối chiếu với tài liệu gốc/chuyên gia', TRUE, 4);

    -- Benchmark Question 26 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Nguồn thông tin học thuật thường đáng tin hơn khi nào?',
        1.00,
        26,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Có tác giả, tạp chí, năm xuất bản, tài liệu tham khảo', TRUE, 1),
        (v_item_id, 'Có tiêu đề dài', FALSE, 2),
        (v_item_id, 'Có bình luận tích cực', FALSE, 3),
        (v_item_id, 'Có nhiều ảnh', FALSE, 4);

    -- Benchmark Question 27 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Khi hai nguồn đưa thông tin khác nhau, nên làm gì?',
        1.00,
        27,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chọn nguồn mình thích', FALSE, 1),
        (v_item_id, 'Chọn nguồn ngắn hơn', FALSE, 2),
        (v_item_id, 'Bỏ qua cả hai', FALSE, 3),
        (v_item_id, 'So sánh nguồn, bằng chứng và bối cảnh', TRUE, 4);

    -- Benchmark Question 28 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        '“Thiên lệch thông tin” là gì?',
        1.00,
        28,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Thông tin bị nghiêng về một góc nhìn nhất định', TRUE, 1),
        (v_item_id, 'Thông tin được mã hóa', FALSE, 2),
        (v_item_id, 'Thông tin bị xóa', FALSE, 3),
        (v_item_id, 'Thông tin lưu trên mây', FALSE, 4);

    -- Benchmark Question 29 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Khi đánh giá ảnh trên mạng, cần chú ý điều gì?',
        1.00,
        29,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Ảnh càng nét càng thật', FALSE, 1),
        (v_item_id, 'Ảnh có thể bị chỉnh sửa hoặc lấy sai ngữ cảnh', TRUE, 2),
        (v_item_id, 'Ảnh có chữ là đúng', FALSE, 3),
        (v_item_id, 'Ảnh luôn đúng', FALSE, 4);

    -- Benchmark Question 30 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Công cụ tìm kiếm ngược hình ảnh giúp gì?',
        1.00,
        30,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Kiểm tra nguồn gốc và ngữ cảnh hình ảnh', TRUE, 1),
        (v_item_id, 'Tăng độ phân giải ảnh', FALSE, 2),
        (v_item_id, 'Tự động xóa ảnh', FALSE, 3),
        (v_item_id, 'Tạo mật khẩu', FALSE, 4);

    -- Benchmark Question 31 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi gặp thông tin sức khỏe/pháp luật/tài chính, nên ưu tiên nguồn nào?',
        1.00,
        31,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bình luận cộng đồng', FALSE, 1),
        (v_item_id, 'Cơ quan chuyên môn/chính thức', TRUE, 2),
        (v_item_id, 'Tin nhắn chuyển tiếp', FALSE, 3),
        (v_item_id, 'Người nổi tiếng', FALSE, 4);

    -- Benchmark Question 32 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Dấu hiệu của thông tin thiếu tin cậy là gì?',
        1.00,
        32,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Có liên kết văn bản gốc', FALSE, 1),
        (v_item_id, 'Có dữ liệu rõ', FALSE, 2),
        (v_item_id, 'Có trích dẫn', FALSE, 3),
        (v_item_id, 'Không có nguồn, không có ngày, không có tác giả', TRUE, 4);

    -- Benchmark Question 33 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Vì sao cần kiểm tra ngày cập nhật của tài liệu?',
        1.00,
        33,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Vì thông tin có thể thay đổi theo thời gian', TRUE, 1),
        (v_item_id, 'Vì bắt buộc phải có màu đỏ', FALSE, 2),
        (v_item_id, 'Vì ngày càng cũ càng đúng', FALSE, 3),
        (v_item_id, 'Vì để trang trí', FALSE, 4);

    -- Benchmark Question 34 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Khi dùng số liệu trong bài viết, cách làm đúng là gì?',
        1.00,
        34,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chỉ ghi “theo Internet”', FALSE, 1),
        (v_item_id, 'Không cần ghi nguồn', FALSE, 2),
        (v_item_id, 'Tự sửa số liệu cho đẹp', FALSE, 3),
        (v_item_id, 'Ghi rõ nguồn và thời điểm số liệu', TRUE, 4);

    -- Benchmark Question 35 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Nội dung do AI tạo ra có thể gặp vấn đề gì?',
        1.00,
        35,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Sai sự thật, thiếu nguồn, bịa thông tin', TRUE, 1),
        (v_item_id, 'Luôn chính xác', FALSE, 2),
        (v_item_id, 'Không cần chỉnh sửa', FALSE, 3),
        (v_item_id, 'Luôn cập nhật', FALSE, 4);

    -- Benchmark Question 36 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Khi đánh giá website, tên miền nào thường đáng tin hơn trong lĩnh vực nhà nước Việt Nam?',
        1.00,
        36,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'link rút gọn', FALSE, 1),
        (v_item_id, 'blog cá nhân ẩn danh', FALSE, 2),
        (v_item_id, '.gov.vn', TRUE, 3),
        (v_item_id, '.xyz không rõ chủ sở hữu', FALSE, 4);

    -- Benchmark Question 37 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Phản ứng đúng khi nhận tin “khẩn cấp, chia sẻ ngay” là gì?',
        1.00,
        37,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Dừng lại, kiểm chứng trước khi chia sẻ', TRUE, 1),
        (v_item_id, 'Chia sẻ ngay', FALSE, 2),
        (v_item_id, 'Chỉnh sửa rồi đăng', FALSE, 3),
        (v_item_id, 'Gửi cho tất cả bạn bè', FALSE, 4);

    -- Benchmark Question 38 (Domain 1, Skill 1.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        'MCQ',
        'Đánh giá thông tin tốt giúp người học tránh điều gì?',
        1.00,
        38,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Không cần tài liệu', FALSE, 1),
        (v_item_id, 'Tin sai, lan truyền sai, ra quyết định sai', TRUE, 2),
        (v_item_id, 'Không cần tư duy phản biện', FALSE, 3),
        (v_item_id, 'Học nhanh hơn mà không cần đọc', FALSE, 4);

    -- Benchmark Question 39 (Domain 1, Skill 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        'MCQ',
        'Khi trích dẫn ý kiến chuyên gia, cần làm gì?',
        1.00,
        39,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Xác minh chuyên môn và nguồn phát ngôn', TRUE, 1),
        (v_item_id, 'Chỉ cần tên nổi tiếng', FALSE, 2),
        (v_item_id, 'Dựa vào ảnh đại diện', FALSE, 3),
        (v_item_id, 'Không cần bối cảnh', FALSE, 4);

    -- Benchmark Question 40 (Domain 1, Skill 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        'MCQ',
        'Câu hỏi nào nên tự đặt ra khi đọc một thông tin số?',
        1.00,
        40,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Có vui không?', FALSE, 1),
        (v_item_id, 'Ai nói, nói khi nào, dựa trên bằng chứng nào?', TRUE, 2),
        (v_item_id, 'Có đang thịnh hành không?', FALSE, 3),
        (v_item_id, 'Có nhiều màu không?', FALSE, 4);

    -- Benchmark Question 41 (Domain 2, Skill 2.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.2' LIMIT 1),
        'MCQ',
        'Khi gửi email học tập/làm việc, tiêu đề nên như thế nào?',
        1.00,
        41,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Để trống', FALSE, 1),
        (v_item_id, 'Viết “Gấp!!!” cho mọi email', FALSE, 2),
        (v_item_id, 'Dùng ký hiệu khó hiểu', FALSE, 3),
        (v_item_id, 'Rõ nội dung, ngắn gọn, lịch sự', TRUE, 4);

    -- Benchmark Question 42 (Domain 2, Skill 2.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.4' LIMIT 1),
        'MCQ',
        'Khi gửi file qua email, nên làm gì?',
        1.00,
        42,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đặt tên file rõ ràng và kiểm tra trước khi gửi', TRUE, 1),
        (v_item_id, 'Gửi nhiều lần liên tục', FALSE, 2),
        (v_item_id, 'Gửi file bất kỳ', FALSE, 3),
        (v_item_id, 'Không cần nội dung email', FALSE, 4);

    -- Benchmark Question 43 (Domain 2, Skill 2.5)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.5' LIMIT 1),
        'MCQ',
        'Trong nhóm học tập trực tuyến, hành vi nào phù hợp?',
        1.00,
        43,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Spam tin nhắn', FALSE, 1),
        (v_item_id, 'Chia sẻ tin chưa kiểm chứng', FALSE, 2),
        (v_item_id, 'Công kích cá nhân', FALSE, 3),
        (v_item_id, 'Trao đổi đúng chủ đề, tôn trọng người khác', TRUE, 4);

    -- Benchmark Question 44 (Domain 2, Skill 2.6)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.6' LIMIT 1),
        'MCQ',
        'Khi tham gia họp trực tuyến, nên làm gì?',
        1.00,
        44,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Kiểm tra micro, camera, tên hiển thị', TRUE, 1),
        (v_item_id, 'Bật micro liên tục', FALSE, 2),
        (v_item_id, 'Ghi âm bí mật', FALSE, 3),
        (v_item_id, 'Vào trễ không báo', FALSE, 4);

    -- Benchmark Question 45 (Domain 2, Skill 2.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.1' LIMIT 1),
        'MCQ',
        '“Dấu vết số” là gì?',
        1.00,
        45,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Mã QR', FALSE, 1),
        (v_item_id, 'Mật khẩu Wi-Fi', FALSE, 2),
        (v_item_id, 'Dữ liệu/hành vi để lại khi hoạt động trên môi trường số', TRUE, 3),
        (v_item_id, 'Dấu vân tay trên màn hình', FALSE, 4);

    -- Benchmark Question 46 (Domain 2, Skill 2.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.2' LIMIT 1),
        'MCQ',
        'Khi bình luận trên mạng xã hội, cần chú ý điều gì?',
        1.00,
        46,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tôn trọng, có trách nhiệm, không xúc phạm', TRUE, 1),
        (v_item_id, 'Viết gì cũng được', FALSE, 2),
        (v_item_id, 'Dùng tài khoản ẩn danh để công kích', FALSE, 3),
        (v_item_id, 'Chia sẻ thông tin cá nhân người khác', FALSE, 4);

    -- Benchmark Question 47 (Domain 2, Skill 2.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.4' LIMIT 1),
        'MCQ',
        'Công cụ nào phù hợp để cộng tác soạn thảo tài liệu nhóm?',
        1.00,
        47,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Phần mềm diệt virus', FALSE, 1),
        (v_item_id, 'Google Docs/Microsoft 365', TRUE, 2),
        (v_item_id, 'Ổ cắm điện', FALSE, 3),
        (v_item_id, 'Máy tính cầm tay', FALSE, 4);

    -- Benchmark Question 48 (Domain 2, Skill 2.5)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.5' LIMIT 1),
        'MCQ',
        'Khi làm việc nhóm trên tài liệu trực tuyến, nên sử dụng chức năng nào để góp ý?',
        1.00,
        48,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Comment/Suggesting', TRUE, 1),
        (v_item_id, 'Xóa trực tiếp nội dung người khác', FALSE, 2),
        (v_item_id, 'Đổi toàn bộ định dạng', FALSE, 3),
        (v_item_id, 'Khóa tài liệu', FALSE, 4);

    -- Benchmark Question 49 (Domain 2, Skill 2.6)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.6' LIMIT 1),
        'MCQ',
        'Khi chia sẻ tài liệu trực tuyến, quyền “View only” nghĩa là gì?',
        1.00,
        49,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chỉ được xem', TRUE, 1),
        (v_item_id, 'Được chuyển quyền sở hữu', FALSE, 2),
        (v_item_id, 'Được chỉnh sửa', FALSE, 3),
        (v_item_id, 'Được xóa', FALSE, 4);

    -- Benchmark Question 50 (Domain 2, Skill 2.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.1' LIMIT 1),
        'MCQ',
        'Khi gửi tin nhắn cho giảng viên/cấp trên, cách nào phù hợp?',
        1.00,
        50,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Gửi “alo”', FALSE, 1),
        (v_item_id, 'Gửi sticker liên tục', FALSE, 2),
        (v_item_id, 'Viết không dấu khó hiểu', FALSE, 3),
        (v_item_id, 'Chào hỏi, nêu rõ nội dung, cảm ơn', TRUE, 4);

    -- Benchmark Question 51 (Domain 2, Skill 2.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.2' LIMIT 1),
        'MCQ',
        'Khi xảy ra hiểu nhầm trong giao tiếp số, nên làm gì?',
        1.00,
        51,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Trao đổi lại bình tĩnh, làm rõ ngữ cảnh', TRUE, 1),
        (v_item_id, 'Chia sẻ đoạn chat công khai', FALSE, 2),
        (v_item_id, 'Đăng bài chỉ trích', FALSE, 3),
        (v_item_id, 'Chặn ngay mọi người', FALSE, 4);

    -- Benchmark Question 52 (Domain 2, Skill 2.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.4' LIMIT 1),
        'MCQ',
        'Khi sử dụng nhóm chat công việc, nội dung nào nên tránh?',
        1.00,
        52,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Thông báo nhiệm vụ', FALSE, 1),
        (v_item_id, 'Tài liệu học tập', FALSE, 2),
        (v_item_id, 'Lịch họp', FALSE, 3),
        (v_item_id, 'Nội dung riêng tư, xúc phạm, không liên quan', TRUE, 4);

    -- Benchmark Question 53 (Domain 2, Skill 2.5)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.5' LIMIT 1),
        'MCQ',
        'Khi chia sẻ ảnh người khác lên mạng, cần điều gì?',
        1.00,
        53,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Có sự đồng ý phù hợp', TRUE, 1),
        (v_item_id, 'Chỉ cần ảnh đẹp', FALSE, 2),
        (v_item_id, 'Không cần hỏi', FALSE, 3),
        (v_item_id, 'Gắn tên cho vui', FALSE, 4);

    -- Benchmark Question 54 (Domain 2, Skill 2.6)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.6' LIMIT 1),
        'MCQ',
        'Kỹ năng giao tiếp số tốt giúp gì?',
        1.00,
        54,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Ẩn danh tốt hơn', FALSE, 1),
        (v_item_id, 'Tranh luận gay gắt hơn', FALSE, 2),
        (v_item_id, 'Làm việc hiệu quả, giảm hiểu nhầm, tăng hợp tác', TRUE, 3),
        (v_item_id, 'Gửi nhiều tin hơn', FALSE, 4);

    -- Benchmark Question 55 (Domain 2, Skill 2.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.1' LIMIT 1),
        'MCQ',
        'Khi phản hồi góp ý trực tuyến, thái độ phù hợp là gì?',
        1.00,
        55,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tôn trọng, tập trung vào vấn đề', TRUE, 1),
        (v_item_id, 'Công kích cá nhân', FALSE, 2),
        (v_item_id, 'Mỉa mai', FALSE, 3),
        (v_item_id, 'Không đọc nội dung', FALSE, 4);

    -- Benchmark Question 56 (Domain 2, Skill 2.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.2' LIMIT 1),
        'MCQ',
        'Khi dùng biểu tượng cảm xúc trong môi trường học tập/làm việc, nên như thế nào?',
        1.00,
        56,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Thay toàn bộ nội dung bằng emoji', FALSE, 1),
        (v_item_id, 'Dùng phù hợp ngữ cảnh', TRUE, 2),
        (v_item_id, 'Dùng để chế giễu', FALSE, 3),
        (v_item_id, 'Dùng càng nhiều càng tốt', FALSE, 4);

    -- Benchmark Question 57 (Domain 2, Skill 2.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.4' LIMIT 1),
        'MCQ',
        'Khi làm việc nhóm từ xa, công cụ quản lý nhiệm vụ giúp gì?',
        1.00,
        57,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Phân công, theo dõi tiến độ, nhắc hạn', TRUE, 1),
        (v_item_id, 'Tăng tốc Internet', FALSE, 2),
        (v_item_id, 'Tự làm thay nhiệm vụ', FALSE, 3),
        (v_item_id, 'Xóa lỗi chính tả', FALSE, 4);

    -- Benchmark Question 58 (Domain 2, Skill 2.5)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.5' LIMIT 1),
        'MCQ',
        'Khi chia sẻ màn hình trong cuộc họp, nên làm gì trước?',
        1.00,
        58,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đóng nội dung riêng tư/nhạy cảm', TRUE, 1),
        (v_item_id, 'Không cần kiểm tra', FALSE, 2),
        (v_item_id, 'Mở tất cả ứng dụng', FALSE, 3),
        (v_item_id, 'Bật thông báo cá nhân', FALSE, 4);

    -- Benchmark Question 59 (Domain 2, Skill 2.6)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.6' LIMIT 1),
        'MCQ',
        'Quy tắc ứng xử số yêu cầu người dùng điều gì?',
        1.00,
        59,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tự do xúc phạm', FALSE, 1),
        (v_item_id, 'Chia sẻ mọi dữ liệu', FALSE, 2),
        (v_item_id, 'Ẩn danh để tránh trách nhiệm', FALSE, 3),
        (v_item_id, 'Lịch sự, tôn trọng, chịu trách nhiệm', TRUE, 4);

    -- Benchmark Question 60 (Domain 2, Skill 2.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '2.1' LIMIT 1),
        'MCQ',
        'Khi tham gia diễn đàn học tập, bài đăng tốt nên có gì?',
        1.00,
        60,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Câu hỏi rõ, thông tin nền, thái độ cầu thị', TRUE, 1),
        (v_item_id, 'Không liên quan chủ đề', FALSE, 2),
        (v_item_id, 'Tiêu đề mơ hồ', FALSE, 3),
        (v_item_id, 'Nội dung toàn chữ in hoa', FALSE, 4);

    -- Benchmark Question 61 (Domain 3, Skill 3.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        'MCQ',
        'Sáng tạo nội dung số bao gồm hoạt động nào?',
        1.00,
        61,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chỉ xem video', FALSE, 1),
        (v_item_id, 'Chỉ tải file', FALSE, 2),
        (v_item_id, 'Chỉ đổi mật khẩu', FALSE, 3),
        (v_item_id, 'Tạo, chỉnh sửa, kết hợp văn bản/hình ảnh/video/dữ liệu', TRUE, 4);

    -- Benchmark Question 62 (Domain 3, Skill 3.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.3' LIMIT 1),
        'MCQ',
        'Khi dùng hình ảnh từ Internet trong slide, cần chú ý gì?',
        1.00,
        62,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bản quyền và ghi nguồn', TRUE, 1),
        (v_item_id, 'Chỉ cần ảnh đẹp', FALSE, 2),
        (v_item_id, 'Không cần kiểm tra', FALSE, 3),
        (v_item_id, 'Cắt logo nguồn', FALSE, 4);

    -- Benchmark Question 63 (Domain 3, Skill 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.4' LIMIT 1),
        'MCQ',
        'Nội dung số có giấy phép Creative Commons nghĩa là gì?',
        1.00,
        63,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Không được dùng bao giờ', FALSE, 1),
        (v_item_id, 'Có điều kiện sử dụng nhất định theo giấy phép', TRUE, 2),
        (v_item_id, 'Chỉ dùng cho quảng cáo', FALSE, 3),
        (v_item_id, 'Muốn dùng sao cũng được', FALSE, 4);

    -- Benchmark Question 64 (Domain 3, Skill 3.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.1' LIMIT 1),
        'MCQ',
        'Khi tạo video học tập, yếu tố nào quan trọng?',
        1.00,
        64,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Mục tiêu rõ, nội dung chính xác, âm thanh/hình ảnh phù hợp', TRUE, 1),
        (v_item_id, 'Hiệu ứng càng nhiều càng tốt', FALSE, 2),
        (v_item_id, 'Nhạc thật lớn', FALSE, 3),
        (v_item_id, 'Không cần kịch bản', FALSE, 4);

    -- Benchmark Question 65 (Domain 3, Skill 3.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        'MCQ',
        'Khi sử dụng AI để viết bài, việc nào là cần thiết?',
        1.00,
        65,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Không đọc lại', FALSE, 1),
        (v_item_id, 'Kiểm tra, chỉnh sửa, ghi nhận phù hợp', TRUE, 2),
        (v_item_id, 'Xóa mọi dấu vết nguồn', FALSE, 3),
        (v_item_id, 'Nộp nguyên văn', FALSE, 4);

    -- Benchmark Question 66 (Domain 3, Skill 3.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.3' LIMIT 1),
        'MCQ',
        'Đạo văn là gì?',
        1.00,
        66,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tự viết bài', FALSE, 1),
        (v_item_id, 'Trích dẫn đúng nguồn', FALSE, 2),
        (v_item_id, 'Tóm tắt có ghi nguồn', FALSE, 3),
        (v_item_id, 'Sử dụng ý tưởng/nội dung của người khác mà không ghi nhận', TRUE, 4);

    -- Benchmark Question 67 (Domain 3, Skill 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.4' LIMIT 1),
        'MCQ',
        'Khi thiết kế infographic, cần ưu tiên điều gì?',
        1.00,
        67,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Thông tin rõ, trực quan, dễ hiểu', TRUE, 1),
        (v_item_id, 'Không cần tiêu đề', FALSE, 2),
        (v_item_id, 'Nhồi nhiều chữ', FALSE, 3),
        (v_item_id, 'Dùng quá nhiều màu', FALSE, 4);

    -- Benchmark Question 68 (Domain 3, Skill 3.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.1' LIMIT 1),
        'MCQ',
        'Công cụ bảng tính giúp tạo nội dung số dạng nào?',
        1.00,
        68,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chỉ tạo ảnh đại diện', FALSE, 1),
        (v_item_id, 'Chỉ gửi tin nhắn', FALSE, 2),
        (v_item_id, 'Chỉ diệt virus', FALSE, 3),
        (v_item_id, 'Bảng dữ liệu, biểu đồ, phân tích số liệu', TRUE, 4);

    -- Benchmark Question 69 (Domain 3, Skill 3.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        'MCQ',
        'Khi chỉnh sửa ảnh người khác, cần lưu ý gì?',
        1.00,
        69,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Quyền riêng tư, sự đồng ý, mục đích sử dụng', TRUE, 1),
        (v_item_id, 'Chỉnh thế nào cũng được', FALSE, 2),
        (v_item_id, 'Không cần hỏi', FALSE, 3),
        (v_item_id, 'Đăng công khai ngay', FALSE, 4);

    -- Benchmark Question 70 (Domain 3, Skill 3.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.3' LIMIT 1),
        'MCQ',
        'Khi tạo bài thuyết trình, cấu trúc tốt là gì?',
        1.00,
        70,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chỉ có hình ảnh', FALSE, 1),
        (v_item_id, 'Chỉ có chữ', FALSE, 2),
        (v_item_id, 'Không cần logic', FALSE, 3),
        (v_item_id, 'Mở đầu, nội dung chính, kết luận', TRUE, 4);

    -- Benchmark Question 71 (Domain 3, Skill 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.4' LIMIT 1),
        'MCQ',
        'Một prompt tốt cho AI tạo nội dung nên có gì?',
        1.00,
        71,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Vai trò, nhiệm vụ, bối cảnh, yêu cầu đầu ra', TRUE, 1),
        (v_item_id, 'Một từ bất kỳ', FALSE, 2),
        (v_item_id, 'Chỉ biểu tượng cảm xúc', FALSE, 3),
        (v_item_id, 'Không cần mục tiêu', FALSE, 4);

    -- Benchmark Question 72 (Domain 3, Skill 3.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.1' LIMIT 1),
        'MCQ',
        'Khi dùng nhạc nền cho video công khai, cần kiểm tra gì?',
        1.00,
        72,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Nhạc càng dài càng tốt', FALSE, 1),
        (v_item_id, 'Quyền sử dụng/bản quyền âm nhạc', TRUE, 2),
        (v_item_id, 'Không cần kiểm tra', FALSE, 3),
        (v_item_id, 'Nhạc đang thịnh hành', FALSE, 4);

    -- Benchmark Question 73 (Domain 3, Skill 3.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        'MCQ',
        'Khi tạo nội dung số cho học tập, nên tránh điều gì?',
        1.00,
        73,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Sao chép nguyên văn không dẫn nguồn', TRUE, 1),
        (v_item_id, 'Trình bày rõ ràng', FALSE, 2),
        (v_item_id, 'Kiểm tra thông tin', FALSE, 3),
        (v_item_id, 'Ghi tài liệu tham khảo', FALSE, 4);

    -- Benchmark Question 74 (Domain 3, Skill 3.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.3' LIMIT 1),
        'MCQ',
        'Tái sử dụng nội dung số hợp pháp cần điều gì?',
        1.00,
        74,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đăng lại không ghi nguồn', FALSE, 1),
        (v_item_id, 'Tôn trọng bản quyền, giấy phép, trích dẫn', TRUE, 2),
        (v_item_id, 'Chỉnh màu là thành của mình', FALSE, 3),
        (v_item_id, 'Xóa tên tác giả', FALSE, 4);

    -- Benchmark Question 75 (Domain 3, Skill 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.4' LIMIT 1),
        'MCQ',
        'Khi xuất bản nội dung lên mạng, người dùng cần cân nhắc điều gì?',
        1.00,
        75,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đăng càng nhanh càng tốt', FALSE, 1),
        (v_item_id, 'Không cần đọc lại', FALSE, 2),
        (v_item_id, 'Chỉ cần nhiều lượt xem', FALSE, 3),
        (v_item_id, 'Tác động, độ chính xác, quyền riêng tư', TRUE, 4);

    -- Benchmark Question 76 (Domain 3, Skill 3.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.1' LIMIT 1),
        'MCQ',
        'Khi làm poster, nguyên tắc thiết kế cơ bản là gì?',
        1.00,
        76,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Ít chữ, điểm nhấn rõ, thông điệp dễ nhớ', TRUE, 1),
        (v_item_id, 'Dùng mọi font chữ', FALSE, 2),
        (v_item_id, 'Càng nhiều chữ càng tốt', FALSE, 3),
        (v_item_id, 'Không cần khoảng trắng', FALSE, 4);

    -- Benchmark Question 77 (Domain 3, Skill 3.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        'MCQ',
        'Khi tạo biểu đồ, cần đảm bảo điều gì?',
        1.00,
        77,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chọn biểu đồ đẹp là đủ', FALSE, 1),
        (v_item_id, 'Ẩn nguồn dữ liệu', FALSE, 2),
        (v_item_id, 'Phóng đại tùy ý', FALSE, 3),
        (v_item_id, 'Dữ liệu đúng, nhãn rõ, không gây hiểu lầm', TRUE, 4);

    -- Benchmark Question 78 (Domain 3, Skill 3.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.3' LIMIT 1),
        'MCQ',
        'Lập trình cơ bản trong năng lực số giúp gì?',
        1.00,
        78,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Hiểu logic, tự động hóa, giải quyết vấn đề', TRUE, 1),
        (v_item_id, 'Chỉ dành cho hacker', FALSE, 2),
        (v_item_id, 'Chỉ để chơi game', FALSE, 3),
        (v_item_id, 'Không liên quan học tập', FALSE, 4);

    -- Benchmark Question 79 (Domain 3, Skill 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.4' LIMIT 1),
        'MCQ',
        'Khi dùng mẫu thiết kế có sẵn, nên làm gì?',
        1.00,
        79,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bán lại ngay', FALSE, 1),
        (v_item_id, 'Xóa thông tin nguồn', FALSE, 2),
        (v_item_id, 'Điều chỉnh phù hợp và tuân thủ điều kiện sử dụng', TRUE, 3),
        (v_item_id, 'Giữ nguyên mọi thứ', FALSE, 4);

    -- Benchmark Question 80 (Domain 3, Skill 3.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '3.1' LIMIT 1),
        'MCQ',
        'Sản phẩm số có chất lượng cần đạt tiêu chí nào?',
        1.00,
        80,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đúng mục tiêu, chính xác, dễ dùng, có trách nhiệm', TRUE, 1),
        (v_item_id, 'Nhiều hiệu ứng', FALSE, 2),
        (v_item_id, 'Dung lượng lớn', FALSE, 3),
        (v_item_id, 'Đăng thật nhanh', FALSE, 4);

    -- Benchmark Question 81 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Mật khẩu mạnh nên có đặc điểm nào?',
        1.00,
        81,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, '123456', FALSE, 1),
        (v_item_id, 'Dài, khó đoán, gồm chữ/số/ký tự', TRUE, 2),
        (v_item_id, 'Tên bản thân', FALSE, 3),
        (v_item_id, 'Ngày sinh', FALSE, 4);

    -- Benchmark Question 82 (Domain 4, Skill 4.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.3' LIMIT 1),
        'MCQ',
        'Xác thực hai yếu tố giúp gì?',
        1.00,
        82,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tăng bảo vệ tài khoản', TRUE, 1),
        (v_item_id, 'Tăng tốc Internet', FALSE, 2),
        (v_item_id, 'Xóa quảng cáo', FALSE, 3),
        (v_item_id, 'Tự động tạo nội dung', FALSE, 4);

    -- Benchmark Question 83 (Domain 4, Skill 4.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.4' LIMIT 1),
        'MCQ',
        'Khi nhận email yêu cầu nhập mật khẩu qua link lạ, nên làm gì?',
        1.00,
        83,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Không bấm link, kiểm tra nguồn gửi', TRUE, 1),
        (v_item_id, 'Tải file đính kèm', FALSE, 2),
        (v_item_id, 'Nhập ngay', FALSE, 3),
        (v_item_id, 'Chuyển tiếp cho bạn bè', FALSE, 4);

    -- Benchmark Question 84 (Domain 4, Skill 4.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.1' LIMIT 1),
        'MCQ',
        'Phishing là gì?',
        1.00,
        84,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tăng tốc tải file', FALSE, 1),
        (v_item_id, 'Sao lưu dữ liệu', FALSE, 2),
        (v_item_id, 'Mã hóa hợp pháp', FALSE, 3),
        (v_item_id, 'Lừa đảo nhằm lấy thông tin/tài khoản', TRUE, 4);

    -- Benchmark Question 85 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Khi dùng Wi-Fi công cộng, nên tránh điều gì?',
        1.00,
        85,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đăng nhập tài khoản quan trọng/giao dịch nhạy cảm nếu không an toàn', TRUE, 1),
        (v_item_id, 'Xem thời tiết', FALSE, 2),
        (v_item_id, 'Đọc tin tức', FALSE, 3),
        (v_item_id, 'Tìm đường', FALSE, 4);

    -- Benchmark Question 86 (Domain 4, Skill 4.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.3' LIMIT 1),
        'MCQ',
        'Dữ liệu cá nhân gồm thông tin nào?',
        1.00,
        86,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Thời tiết', FALSE, 1),
        (v_item_id, 'Tin tức chung', FALSE, 2),
        (v_item_id, 'Hướng dẫn sử dụng phần mềm', FALSE, 3),
        (v_item_id, 'Họ tên, số điện thoại, địa chỉ, CCCD, tài khoản', TRUE, 4);

    -- Benchmark Question 87 (Domain 4, Skill 4.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.4' LIMIT 1),
        'MCQ',
        'Khi cài ứng dụng mới, cần chú ý điều gì?',
        1.00,
        87,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Quyền truy cập và nguồn tải', TRUE, 1),
        (v_item_id, 'Màu biểu tượng', FALSE, 2),
        (v_item_id, 'Tên ứng dụng ngắn', FALSE, 3),
        (v_item_id, 'Số lượng hình nền', FALSE, 4);

    -- Benchmark Question 88 (Domain 4, Skill 4.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.1' LIMIT 1),
        'MCQ',
        'Sao lưu dữ liệu quan trọng giúp gì?',
        1.00,
        88,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tăng độ sáng màn hình', FALSE, 1),
        (v_item_id, 'Xóa virus tự động', FALSE, 2),
        (v_item_id, 'Giảm mất mát khi thiết bị hỏng/mất', TRUE, 3),
        (v_item_id, 'Làm máy nặng hơn', FALSE, 4);

    -- Benchmark Question 89 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Khi chia sẻ CCCD/số tài khoản lên mạng, rủi ro là gì?',
        1.00,
        89,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bị lợi dụng danh tính/lừa đảo', TRUE, 1),
        (v_item_id, 'Tăng uy tín', FALSE, 2),
        (v_item_id, 'Tăng lượt theo dõi', FALSE, 3),
        (v_item_id, 'Không có rủi ro', FALSE, 4);

    -- Benchmark Question 90 (Domain 4, Skill 4.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.3' LIMIT 1),
        'MCQ',
        'Phần mềm diệt mã độc có tác dụng gì?',
        1.00,
        90,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tăng dung lượng ổ cứng', FALSE, 1),
        (v_item_id, 'Phát hiện, ngăn chặn phần mềm độc hại', TRUE, 2),
        (v_item_id, 'Tự động học ngoại ngữ', FALSE, 3),
        (v_item_id, 'Tạo bài thuyết trình', FALSE, 4);

    -- Benchmark Question 91 (Domain 4, Skill 4.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.4' LIMIT 1),
        'MCQ',
        'Cập nhật hệ điều hành/ứng dụng giúp gì?',
        1.00,
        91,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Vá lỗi bảo mật và cải thiện tính năng', TRUE, 1),
        (v_item_id, 'Làm mất mọi dữ liệu', FALSE, 2),
        (v_item_id, 'Chỉ để đổi giao diện', FALSE, 3),
        (v_item_id, 'Không có tác dụng', FALSE, 4);

    -- Benchmark Question 92 (Domain 4, Skill 4.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.1' LIMIT 1),
        'MCQ',
        'Khi cho người khác mượn thiết bị, nên làm gì?',
        1.00,
        92,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đăng xuất/khóa dữ liệu riêng tư', TRUE, 1),
        (v_item_id, 'Tắt bảo mật', FALSE, 2),
        (v_item_id, 'Giao toàn bộ mật khẩu', FALSE, 3),
        (v_item_id, 'Mở sẵn email', FALSE, 4);

    -- Benchmark Question 93 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Hành vi nào là thiếu trách nhiệm số?',
        1.00,
        93,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Ghi nguồn tài liệu', FALSE, 1),
        (v_item_id, 'Kiểm chứng tin', FALSE, 2),
        (v_item_id, 'Tôn trọng người khác', FALSE, 3),
        (v_item_id, 'Chia sẻ thông tin cá nhân người khác không xin phép', TRUE, 4);

    -- Benchmark Question 94 (Domain 4, Skill 4.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.3' LIMIT 1),
        'MCQ',
        'Khi bị bắt nạt trực tuyến, nên làm gì?',
        1.00,
        94,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Lưu bằng chứng, chặn/báo cáo, nhờ hỗ trợ', TRUE, 1),
        (v_item_id, 'Chia sẻ rộng rãi hơn', FALSE, 2),
        (v_item_id, 'Trả đũa bằng xúc phạm', FALSE, 3),
        (v_item_id, 'Im lặng tuyệt đối', FALSE, 4);

    -- Benchmark Question 95 (Domain 4, Skill 4.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.4' LIMIT 1),
        'MCQ',
        'Khi tạo tài khoản mới, thông tin nào không nên công khai tùy tiện?',
        1.00,
        95,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Sở thích chung', FALSE, 1),
        (v_item_id, 'Tên môn học', FALSE, 2),
        (v_item_id, 'Chủ đề học tập', FALSE, 3),
        (v_item_id, 'Số điện thoại, địa chỉ, giấy tờ cá nhân', TRUE, 4);

    -- Benchmark Question 96 (Domain 4, Skill 4.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.1' LIMIT 1),
        'MCQ',
        'Quyền riêng tư số là gì?',
        1.00,
        96,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Quyền kiểm soát thông tin cá nhân trong môi trường số', TRUE, 1),
        (v_item_id, 'Quyền dùng mạng miễn phí', FALSE, 2),
        (v_item_id, 'Quyền tải mọi nội dung', FALSE, 3),
        (v_item_id, 'Quyền xóa bài người khác', FALSE, 4);

    -- Benchmark Question 97 (Domain 4, Skill 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        'MCQ',
        'Khi phát hiện tài khoản bị đăng nhập lạ, nên làm gì đầu tiên?',
        1.00,
        97,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tạo thêm tài khoản giả', FALSE, 1),
        (v_item_id, 'Đăng công khai mật khẩu', FALSE, 2),
        (v_item_id, 'Đổi mật khẩu và đăng xuất khỏi thiết bị lạ', TRUE, 3),
        (v_item_id, 'Bỏ qua', FALSE, 4);

    -- Benchmark Question 98 (Domain 4, Skill 4.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.3' LIMIT 1),
        'MCQ',
        'Khi dùng AI, dữ liệu nào không nên nhập tùy tiện?',
        1.00,
        98,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Dữ liệu cá nhân, bí mật, thông tin nhạy cảm', TRUE, 1),
        (v_item_id, 'Câu hỏi học tập chung', FALSE, 2),
        (v_item_id, 'Yêu cầu tóm tắt công khai', FALSE, 3),
        (v_item_id, 'Ý tưởng không nhạy cảm', FALSE, 4);

    -- Benchmark Question 99 (Domain 4, Skill 4.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.4' LIMIT 1),
        'MCQ',
        'Sức khỏe số liên quan đến điều gì?',
        1.00,
        99,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Màu điện thoại', FALSE, 1),
        (v_item_id, 'Quản lý thời gian màn hình, tư thế, cân bằng đời sống', TRUE, 2),
        (v_item_id, 'Số lượng ứng dụng', FALSE, 3),
        (v_item_id, 'Tốc độ Wi-Fi', FALSE, 4);

    -- Benchmark Question 100 (Domain 4, Skill 4.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '4.1' LIMIT 1),
        'MCQ',
        'An toàn số tốt giúp người dùng điều gì?',
        1.00,
        100,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Bảo vệ tài khoản, dữ liệu, danh tiếng và quyền riêng tư', TRUE, 1),
        (v_item_id, 'Không cần học kỹ năng khác', FALSE, 2),
        (v_item_id, 'Tránh mọi trách nhiệm', FALSE, 3),
        (v_item_id, 'Dùng mạng ẩn danh hoàn toàn', FALSE, 4);

    -- Benchmark Question 101 (Domain 5, Skill 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        'MCQ',
        'Khi gặp lỗi phần mềm, bước đầu tiên nên làm gì?',
        1.00,
        101,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Xác định lỗi, đọc thông báo lỗi, thử cách xử lý cơ bản', TRUE, 1),
        (v_item_id, 'Cài phần mềm lạ', FALSE, 2),
        (v_item_id, 'Xóa ngay phần mềm', FALSE, 3),
        (v_item_id, 'Đổ lỗi cho thiết bị', FALSE, 4);

    -- Benchmark Question 102 (Domain 5, Skill 5.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.3' LIMIT 1),
        'MCQ',
        'Khi chọn công cụ số cho một nhiệm vụ, cần dựa vào gì?',
        1.00,
        102,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Công cụ đang nổi tiếng', FALSE, 1),
        (v_item_id, 'Giao diện nhiều màu', FALSE, 2),
        (v_item_id, 'Bạn bè dùng gì thì dùng', FALSE, 3),
        (v_item_id, 'Mục tiêu, tính năng, chi phí, độ an toàn', TRUE, 4);

    -- Benchmark Question 103 (Domain 5, Skill 5.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.4' LIMIT 1),
        'MCQ',
        'AI phù hợp nhất trong trường hợp nào?',
        1.00,
        103,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Hỗ trợ gợi ý, tóm tắt, phân tích, sáng tạo có kiểm soát', TRUE, 1),
        (v_item_id, 'Làm mọi việc không cần kiểm tra', FALSE, 2),
        (v_item_id, 'Thay thế hoàn toàn tư duy', FALSE, 3),
        (v_item_id, 'Ra quyết định pháp lý cuối cùng', FALSE, 4);

    -- Benchmark Question 104 (Domain 5, Skill 5.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.1' LIMIT 1),
        'MCQ',
        'Khi AI đưa kết quả sai, người dùng nên làm gì?',
        1.00,
        104,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tin tiếp', FALSE, 1),
        (v_item_id, 'Đăng ngay', FALSE, 2),
        (v_item_id, 'Xóa tài khoản', FALSE, 3),
        (v_item_id, 'Kiểm tra lại, sửa prompt, đối chiếu nguồn', TRUE, 4);

    -- Benchmark Question 105 (Domain 5, Skill 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        'MCQ',
        'Kỹ năng tự học công nghệ mới quan trọng vì sao?',
        1.00,
        105,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Công nghệ thay đổi nhanh, cần thích nghi liên tục', TRUE, 1),
        (v_item_id, 'Không cần học nếu biết một phần mềm', FALSE, 2),
        (v_item_id, 'Chỉ chuyên gia mới cần', FALSE, 3),
        (v_item_id, 'Học một lần là đủ', FALSE, 4);

    -- Benchmark Question 106 (Domain 5, Skill 5.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.3' LIMIT 1),
        'MCQ',
        'Khi cần tự động hóa công việc lặp lại, công cụ nào có thể hữu ích?',
        1.00,
        106,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Hình nền', FALSE, 1),
        (v_item_id, 'Bảng tính, macro, workflow, AI', TRUE, 2),
        (v_item_id, 'Máy chiếu', FALSE, 3),
        (v_item_id, 'Trình nghe nhạc', FALSE, 4);

    -- Benchmark Question 107 (Domain 5, Skill 5.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.4' LIMIT 1),
        'MCQ',
        'Khi máy tính chạy chậm, cách xử lý phù hợp là gì?',
        1.00,
        107,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Kiểm tra ứng dụng nền, dung lượng, cập nhật, mã độc', TRUE, 1),
        (v_item_id, 'Đập máy', FALSE, 2),
        (v_item_id, 'Tải thêm phần mềm lạ', FALSE, 3),
        (v_item_id, 'Mở nhiều tab hơn', FALSE, 4);

    -- Benchmark Question 108 (Domain 5, Skill 5.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.1' LIMIT 1),
        'MCQ',
        'Khi không biết dùng một công cụ số, nên làm gì?',
        1.00,
        108,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Dùng sai cũng được', FALSE, 1),
        (v_item_id, 'Tìm hướng dẫn, thử nghiệm an toàn, hỏi người có kinh nghiệm', TRUE, 2),
        (v_item_id, 'Chia sẻ mật khẩu để người khác làm', FALSE, 3),
        (v_item_id, 'Bỏ cuộc', FALSE, 4);

    -- Benchmark Question 109 (Domain 5, Skill 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        'MCQ',
        'Khi giải quyết vấn đề bằng công nghệ, bước nào nên có?',
        1.00,
        109,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Chọn công cụ trước khi hiểu vấn đề', FALSE, 1),
        (v_item_id, 'Làm theo cảm tính', FALSE, 2),
        (v_item_id, 'Không cần đánh giá', FALSE, 3),
        (v_item_id, 'Xác định vấn đề, chọn công cụ, thử nghiệm, đánh giá kết quả', TRUE, 4);

    -- Benchmark Question 110 (Domain 5, Skill 5.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.3' LIMIT 1),
        'MCQ',
        'Prompt nào tốt hơn khi hỏi AI?',
        1.00,
        110,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, '“Đóng vai chuyên gia, lập bảng 5 bước, có ví dụ”', TRUE, 1),
        (v_item_id, '“Nhanh”', FALSE, 2),
        (v_item_id, '“Làm đi”', FALSE, 3),
        (v_item_id, '“Nói gì đó”', FALSE, 4);

    -- Benchmark Question 111 (Domain 5, Skill 5.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.4' LIMIT 1),
        'MCQ',
        'Khi dùng AI cho học tập, cách sử dụng có trách nhiệm là gì?',
        1.00,
        111,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Nộp nguyên văn', FALSE, 1),
        (v_item_id, 'Nhờ AI làm toàn bộ bài thi', FALSE, 2),
        (v_item_id, 'Không cần ghi nhận', FALSE, 3),
        (v_item_id, 'Dùng để hỗ trợ hiểu bài, kiểm tra lại và tự trình bày', TRUE, 4);

    -- Benchmark Question 112 (Domain 5, Skill 5.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.1' LIMIT 1),
        'MCQ',
        'Khi một công cụ số không phù hợp, nên làm gì?',
        1.00,
        112,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Đánh giá nguyên nhân và chọn công cụ khác', TRUE, 1),
        (v_item_id, 'Cố dùng bằng mọi giá', FALSE, 2),
        (v_item_id, 'Xóa dữ liệu', FALSE, 3),
        (v_item_id, 'Dừng toàn bộ công việc', FALSE, 4);

    -- Benchmark Question 113 (Domain 5, Skill 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        'MCQ',
        'Dấu hiệu cho thấy cần nâng cấp kỹ năng số là gì?',
        1.00,
        113,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Biết tự học công cụ mới', FALSE, 1),
        (v_item_id, 'Bảo mật tốt', FALSE, 2),
        (v_item_id, 'Quản lý file rõ ràng', FALSE, 3),
        (v_item_id, 'Thường xuyên phụ thuộc người khác cho thao tác cơ bản', TRUE, 4);

    -- Benchmark Question 114 (Domain 5, Skill 5.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.3' LIMIT 1),
        'MCQ',
        'Khi phân tích dữ liệu đơn giản, công cụ nào thường phù hợp?',
        1.00,
        114,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Excel/Google Sheets', TRUE, 1),
        (v_item_id, 'Trình phát nhạc', FALSE, 2),
        (v_item_id, 'Máy ảnh', FALSE, 3),
        (v_item_id, 'Ứng dụng thời tiết', FALSE, 4);

    -- Benchmark Question 115 (Domain 5, Skill 5.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.4' LIMIT 1),
        'MCQ',
        'Khi muốn cải tiến quy trình làm việc bằng công nghệ, cần bắt đầu từ đâu?',
        1.00,
        115,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Tạo nhóm chat mới', FALSE, 1),
        (v_item_id, 'Xác định điểm nghẽn và dữ liệu đầu vào/đầu ra', TRUE, 2),
        (v_item_id, 'Đổi logo', FALSE, 3),
        (v_item_id, 'Mua phần mềm trước', FALSE, 4);

    -- Benchmark Question 116 (Domain 5, Skill 5.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.1' LIMIT 1),
        'MCQ',
        'Khi AI tạo nội dung không đúng yêu cầu, nên cải thiện bằng cách nào?',
        1.00,
        116,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Viết lại prompt rõ bối cảnh, tiêu chí, định dạng', TRUE, 1),
        (v_item_id, 'Hỏi y hệt nhiều lần', FALSE, 2),
        (v_item_id, 'Tin kết quả đầu tiên', FALSE, 3),
        (v_item_id, 'Không cần chỉnh', FALSE, 4);

    -- Benchmark Question 117 (Domain 5, Skill 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        'MCQ',
        'Công nghệ số giúp giải quyết vấn đề học tập như thế nào?',
        1.00,
        117,
        'ADVANCED'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Loại bỏ nhu cầu tư duy', FALSE, 1),
        (v_item_id, 'Tìm tài liệu, luyện tập, phản hồi, cộng tác, quản lý tiến độ', TRUE, 2),
        (v_item_id, 'Đảm bảo điểm cao tự động', FALSE, 3),
        (v_item_id, 'Thay học hoàn toàn', FALSE, 4);

    -- Benchmark Question 118 (Domain 5, Skill 5.3)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.3' LIMIT 1),
        'MCQ',
        'Khi sử dụng công cụ mới, yếu tố an toàn nào cần kiểm tra?',
        1.00,
        118,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Màu giao diện', FALSE, 1),
        (v_item_id, 'Số biểu tượng', FALSE, 2),
        (v_item_id, 'Tên có ngắn không', FALSE, 3),
        (v_item_id, 'Nhà cung cấp, quyền truy cập, chính sách dữ liệu', TRUE, 4);

    -- Benchmark Question 119 (Domain 5, Skill 5.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.4' LIMIT 1),
        'MCQ',
        'Người có năng lực giải quyết vấn đề số tốt thường có đặc điểm nào?',
        1.00,
        119,
        'INTERMEDIATE'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Linh hoạt, biết thử nghiệm, biết kiểm tra và học từ lỗi', TRUE, 1),
        (v_item_id, 'Không cần phản hồi', FALSE, 2),
        (v_item_id, 'Chỉ làm theo một cách', FALSE, 3),
        (v_item_id, 'Sợ công nghệ mới', FALSE, 4);

    -- Benchmark Question 120 (Domain 5, Skill 5.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000002',
        (SELECT id FROM public.competencies WHERE skill_code = '5.1' LIMIT 1),
        'MCQ',
        'Mục tiêu cuối cùng của giải quyết vấn đề bằng công nghệ là gì?',
        1.00,
        120,
        'FOUNDATION'
    ) RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES
        (v_item_id, 'Dùng thật nhiều ứng dụng', FALSE, 1),
        (v_item_id, 'Thay thế mọi con người', FALSE, 2),
        (v_item_id, 'Làm nhanh dù sai', FALSE, 3),
        (v_item_id, 'Tạo ra kết quả hiệu quả, an toàn, có giá trị', TRUE, 4);

END $$;
