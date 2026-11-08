CREATE OR REPLACE FUNCTION public.seed_baseline_assessment()
RETURNS VOID
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_framework_id UUID;
    v_item_id UUID;
BEGIN
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;

    UPDATE public.assessments SET
        title = 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
        description = 'Bài khảo thí chẩn đoán năng lực số ban đầu gồm 25 câu hỏi trắc nghiệm chuẩn hóa chọn lọc bao quát trọn vẹn 5 miền năng lực số. Hoàn thành để tự động xác lập Hồ sơ năng lực và kích hoạt lộ trình học tập cá nhân hóa.',
        framework_id = v_framework_id,
        duration_minutes = 25,
        passing_score = 70.00,
        point_reward = 50,
        is_published = TRUE,
        visibility = 'PUBLIC',
        access_tier = 'FREE',
        is_system_baseline = TRUE,
        system_code = 'BASELINE_5DOMAINS'
    WHERE id = 'a0000000-0000-0000-0000-000000000001';

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



END;
$BODY$;