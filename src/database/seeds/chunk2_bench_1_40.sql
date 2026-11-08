DO $$
DECLARE
    v_framework_id UUID;
    v_item_id UUID;
BEGIN
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;
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

END $$;