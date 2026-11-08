DO $$
DECLARE
    v_framework_id UUID;
    v_item_id UUID;
BEGIN
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;
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

END $$;