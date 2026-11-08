CREATE OR REPLACE FUNCTION public.seed_bench_part3()
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

SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;
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

END;
$BODY$;