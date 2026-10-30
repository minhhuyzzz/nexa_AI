-- ==============================================================================
-- NEXA ASSESSMENT SEED 07: BASELINE DIGCOMP CANONICAL ASSESSMENT (PERS-F02, PERS-F07)
-- ==============================================================================
-- Seeds the official, production-ready DigComp 5-Domain baseline diagnostic assessment.
-- Ensures that the database contains real assessment data with questions, options,
-- rubrics, and published status, eliminating the need for hardcoded JSON fallbacks.

DO $$
DECLARE
    v_framework_id UUID;
    v_assessment_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_item_id UUID;
    v_c1_1 UUID; v_c1_2 UUID;
    v_c2_1 UUID; v_c2_2 UUID;
    v_c3_1 UUID; v_c3_4 UUID;
    v_c4_1 UUID; v_c4_2 UUID;
    v_c5_1 UUID; v_c5_2 UUID;
BEGIN
    -- 1. Ensure Framework
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;

    -- 2. Fetch Competency IDs for each of the 5 canonical domains
    SELECT id INTO v_c1_1 FROM public.competencies WHERE skill_code = '1.1' LIMIT 1;
    SELECT id INTO v_c1_2 FROM public.competencies WHERE skill_code = '1.2' LIMIT 1;
    SELECT id INTO v_c2_1 FROM public.competencies WHERE skill_code = '2.1' LIMIT 1;
    SELECT id INTO v_c2_2 FROM public.competencies WHERE skill_code = '2.2' LIMIT 1;
    SELECT id INTO v_c3_1 FROM public.competencies WHERE skill_code = '3.1' LIMIT 1;
    SELECT id INTO v_c3_4 FROM public.competencies WHERE skill_code = '3.4' LIMIT 1;
    SELECT id INTO v_c4_1 FROM public.competencies WHERE skill_code = '4.1' LIMIT 1;
    SELECT id INTO v_c4_2 FROM public.competencies WHERE skill_code = '4.2' LIMIT 1;
    SELECT id INTO v_c5_1 FROM public.competencies WHERE skill_code = '5.1' LIMIT 1;
    SELECT id INTO v_c5_2 FROM public.competencies WHERE skill_code = '5.2' LIMIT 1;

    -- 3. Upsert Official Baseline Assessment
    INSERT INTO public.assessments (
        id,
        title,
        description,
        framework_id,
        duration_minutes,
        passing_score,
        point_reward,
        is_published,
        status,
        version,
        is_locked,
        visibility
    ) VALUES (
        v_assessment_id,
        'Đánh Giá Năng Lực Số Chuẩn Quốc Gia & EU DigComp (Bài thi Chuẩn 10 Câu MCQ)',
        'Bài khảo thí chẩn đoán năng lực số đa miền theo khung DigComp 2.2 / QĐ 146/QĐ-BTTTT. Hệ thống tự động chấm điểm khách quan tức thì trong 0.01s và thiết lập hồ sơ radar 5 miền chuẩn xác.',
        v_framework_id,
        30,
        70.00,
        50,
        TRUE,
        'PUBLISHED',
        1,
        TRUE,
        'PUBLIC'
    ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = TRUE,
        status = 'PUBLISHED',
        version = 1,
        is_locked = TRUE,
        visibility = 'PUBLIC';

    -- 4. Delete existing items to make re-run idempotent
    DELETE FROM public.assessment_items WHERE assessment_id = v_assessment_id;

    -- 5. Insert 10 standard items spanning all 5 canonical DigComp domains

    -- Câu 1 (Miền 1 - Kỹ năng 1.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c1_1, 'MCQ', 
    'Khi tìm kiếm tài liệu nghiên cứu học thuật định dạng PDF về chủ đề "Chuyển đổi số giáo dục", cú pháp tìm kiếm nâng cao nào trên Google là tối ưu nhất?',
    10.00, 1, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, '"Chuyển đổi số giáo dục" filetype:pdf', TRUE, 'Toán tử filetype:pdf giới hạn chính xác định dạng tài liệu và dấu ngoặc kép tìm kiếm cụm từ chính xác.', 1),
    (v_item_id, 'Chuyển đổi số giáo dục + pdf download', FALSE, 'Cú pháp này sẽ trả về nhiều kết quả trang web thông thường chứa chữ download thay vì file trực tiếp.', 2),
    (v_item_id, 'search pdf "Chuyển đổi số giáo dục"', FALSE, 'Từ khóa search là thừa thãi và không kích hoạt bộ lọc định dạng tệp của công cụ tìm kiếm.', 3),
    (v_item_id, 'site:pdf "Chuyển đổi số giáo dục"', FALSE, 'site: dùng để giới hạn tên miền web, không phải định dạng tệp tin.', 4);

    -- Câu 2 (Miền 1 - Kỹ năng 1.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c1_2, 'MCQ', 
    'Phương pháp nào sau đây là chuẩn mực nhất để xác minh tính xác thực của một tin tức giật gân lan truyền trên mạng xã hội trước khi chia sẻ?',
    10.00, 2, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Kiểm chứng chéo thông tin từ các cơ quan báo chí chính thống và kiểm tra ngày xuất bản gốc', TRUE, 'Kiểm chứng chéo đa nguồn có thẩm quyền là nguyên tắc cốt lõi trong đánh giá độ tin cậy thông tin số.', 1),
    (v_item_id, 'Đọc phần bình luận của cộng đồng mạng để xem số đông có tin hay không', FALSE, 'Bình luận số đông dễ bị thao túng bởi bot và hiệu ứng tâm lý đám đông.', 2),
    (v_item_id, 'Kiểm tra xem bài viết có nhiều lượt chia sẻ (share) và tương tác hay không', FALSE, 'Mức độ lan truyền cao không đồng nghĩa với tính xác thực của thông tin.', 3),
    (v_item_id, 'Tin tưởng ngay nếu bài viết được đăng bởi người có tích xanh', FALSE, 'Tài khoản tích xanh hiện nay có thể mua được hoặc bị hack, cần xác minh nội dung độc lập.', 4);

    -- Câu 3 (Miền 2 - Kỹ năng 2.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c2_1, 'MCQ', 
    'Khi gửi email công việc quan trọng cho đối tác, việc nào sau đây vi phạm quy tắc văn hóa ứng xử số (Netiquette)?',
    10.00, 3, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Viết TOÀN BỘ TIÊU ĐỀ VÀ NỘI DUNG BẰNG CHỮ IN HOA để nhấn mạnh sự khẩn cấp', TRUE, 'Trong văn hóa số, việc viết hoa toàn bộ được coi là hành vi la hét, thể hiện sự thiếu tôn trọng người nhận.', 1),
    (v_item_id, 'Tóm tắt nội dung chính trong 3 câu đầu tiên của email', FALSE, 'Đây là kỹ năng giao tiếp chuyên nghiệp giúp người nhận nắm bắt thông tin nhanh.', 2),
    (v_item_id, 'Đặt tiêu đề rõ ràng kèm mã dự án hoặc mục đích liên hệ', FALSE, 'Tiêu đề rõ ràng giúp phân loại và quản lý hộp thư hiệu quả.', 3),
    (v_item_id, 'Kiểm tra lỗi chính tả và định dạng văn bản trước khi gửi', FALSE, 'Kiểm tra lỗi trước khi gửi là thực hành chuẩn mực nghề nghiệp.', 4);

    -- Câu 4 (Miền 2 - Kỹ năng 2.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c2_2, 'MCQ', 
    'Khi chia sẻ tài liệu nội bộ nhóm trên đám mây (Google Drive / OneDrive), thiết lập quyền nào đảm bảo an toàn thông tin nhất cho người chỉ cần xem?',
    10.00, 4, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Cấp quyền Xem (Viewer) cho từng email cụ thể và tắt tính năng cho phép người xem sao chép/tải xuống', TRUE, 'Tuân thủ nguyên tắc đặc quyền tối thiểu (Least Privilege) và hạn chế phát tán dữ liệu.', 1),
    (v_item_id, 'Bật chế độ "Bất kỳ ai có đường liên kết đều có thể chỉnh sửa"', FALSE, 'Đây là lỗ hổng nghiêm trọng làm lộ dữ liệu công khai trên mạng.', 2),
    (v_item_id, 'Cấp quyền Biên tập viên (Editor) để đối tác tiện ghi chú trực tiếp', FALSE, 'Cấp quyền chỉnh sửa dư thừa có nguy cơ xóa nhầm hoặc sửa đổi dữ liệu gốc.', 3),
    (v_item_id, 'Gửi mật khẩu tài khoản quản trị cho đối tác để họ tự vào xem', FALSE, 'Vi phạm nghiêm trọng chính sách bảo mật danh tính.', 4);

    -- Câu 5 (Miền 3 - Kỹ năng 3.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c3_1, 'MCQ', 
    'Định dạng ảnh nào sau đây lưu trữ dưới dạng vector, cho phép thu phóng không giới hạn độ phân giải mà không bị vỡ hạt, lý tưởng cho thiết kế logo và biểu tượng web?',
    10.00, 5, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'SVG (Scalable Vector Graphics)', TRUE, 'SVG là chuẩn vector dựa trên XML, hiển thị sắc nét ở mọi kích thước màn hình.', 1),
    (v_item_id, 'PNG (Portable Network Graphics)', FALSE, 'PNG là định dạng ảnh raster (bitmap), sẽ bị vỡ hạt khi phóng to quá kích thước chuẩn.', 2),
    (v_item_id, 'JPEG / JPG', FALSE, 'JPEG là định dạng nén mất dữ liệu (lossy) dạng raster.', 3),
    (v_item_id, 'WEBP', FALSE, 'WEBP chủ yếu là định dạng raster tối ưu dung lượng cho web.', 4);

    -- Câu 6 (Miền 3 - Kỹ năng 3.4)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c3_4, 'MCQ', 
    'Khi trích dẫn nội dung từ một bài nghiên cứu khoa học mở có giấy phép Creative Commons CC BY-SA 4.0, bạn bắt buộc phải tuân thủ điều kiện nào?',
    10.00, 6, 'ADVANCED') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Ghi nhận quyền tác giả gốc (Attribution) và phát hành tác phẩm phái sinh dưới cùng giấy phép (ShareAlike)', TRUE, 'CC BY-SA quy định bắt buộc ghi nhận công trạng và chia sẻ tương tự.', 1),
    (v_item_id, 'Không được phép thay đổi dù chỉ một từ trong nội dung gốc', FALSE, 'CC BY-SA cho phép chỉnh sửa, cải biên miễn là ghi công và giữ nguyên điều khoản phát hành tương tự.', 2),
    (v_item_id, 'Chỉ được dùng cho mục đích phi thương mại', FALSE, 'CC BY-SA cho phép sử dụng thương mại nếu không có điều khoản NonCommercial (NC).', 3),
    (v_item_id, 'Phải xin phép bằng văn bản từ tác giả trước mỗi lần sử dụng', FALSE, 'Bản chất của Creative Commons là cấp quyền trước công khai theo điều khoản quy định.', 4);

    -- Câu 7 (Miền 4 - Kỹ năng 4.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c4_1, 'MCQ', 
    'Cơ chế xác thực nào sau đây mang lại cấp độ an toàn cao nhất để chống lại các cuộc tấn công lừa đảo đánh cắp tài khoản (Phishing)?',
    10.00, 7, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Xác thực đa yếu tố bằng khóa bảo mật vật lý phần cứng chuẩn FIDO2 / Passkey', TRUE, 'FIDO2 / WebAuthn có khả năng chống Phishing tuyệt đối nhờ gắn liền với tên miền (origin-bound).', 1),
    (v_item_id, 'Nhận mã OTP qua tin nhắn SMS điện thoại', FALSE, 'SMS OTP có nguy cơ bị tấn công hoán đổi SIM (SIM swap) hoặc bị thiết bị thu sóng giả chặn bắt.', 2),
    (v_item_id, 'Đặt mật khẩu phức tạp gồm 20 ký tự nhưng không bật 2FA', FALSE, 'Mật khẩu phức tạp đến đâu cũng có thể bị lừa nhập vào trang giả mạo.', 3),
    (v_item_id, 'Đổi mật khẩu định kỳ mỗi 15 ngày một lần', FALSE, 'Đổi mật khẩu quá thường xuyên dẫn đến thói quen đặt mật khẩu dễ nhớ, không thay thế được 2FA.', 4);

    -- Câu 8 (Miền 4 - Kỹ năng 4.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c4_2, 'MCQ', 
    'Khi kết nối máy tính xách tay vào mạng Wi-Fi công cộng miễn phí tại quán cà phê để xử lý công việc nhạy cảm, biện pháp bảo vệ nào là cấp thiết nhất?',
    10.00, 8, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Kích hoạt mạng riêng ảo (VPN) tin cậy để mã hóa toàn bộ dữ liệu truyền tải', TRUE, 'VPN tạo đường hầm mã hóa bảo vệ lưu lượng khỏi các cuộc tấn công nghe lén (Man-in-the-middle).', 1),
    (v_item_id, 'Mở trình duyệt ở chế độ ẩn danh (Incognito/Private)', FALSE, 'Chế độ ẩn danh chỉ không lưu lịch sử cục bộ, hoàn toàn không mã hóa dữ liệu truyền qua mạng Wi-Fi.', 2),
    (v_item_id, 'Tắt kết nối Bluetooth của máy tính', FALSE, 'Tắt Bluetooth là tốt nhưng không bảo vệ lưu lượng mạng Wi-Fi đang bị chia sẻ chung.', 3),
    (v_item_id, 'Xóa toàn bộ cookie và bộ nhớ đệm trước khi kết nối', FALSE, 'Xóa cache không ngăn chặn kẻ tấn công trên cùng mạng Wi-Fi bắt trộm gói tin chưa được mã hóa.', 4);

    -- Câu 9 (Miền 5 - Kỹ năng 5.1)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c5_1, 'MCQ', 
    'Máy tính đang làm việc bỗng nhiên bị chậm bất thường, quạt tản nhiệt quay tối đa và phản hồi đơ giật. Bước kiểm tra đầu tiên hợp lý nhất là gì?',
    10.00, 9, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Mở Task Manager (Windows) hoặc Activity Monitor (Mac) kiểm tra tiến trình chiếm dụng CPU/RAM bất thường', TRUE, 'Giúp xác định chính xác ứng dụng bị treo (not responding) hoặc tiến trình mã độc đang ngốn tài nguyên.', 1),
    (v_item_id, 'Rút ngay dây nguồn máy tính ra để hạ nhiệt', FALSE, 'Rút nguồn đột ngột có thể làm hỏng ổ đĩa và mất dữ liệu chưa lưu.', 2),
    (v_item_id, 'Cài đặt lại hệ điều hành ngay lập tức', FALSE, 'Đây là biện pháp cực đoan không cần thiết trước khi chẩn đoán nguyên nhân cụ thể.', 3),
    (v_item_id, 'Tải ngay phần mềm dọn dẹp máy tính miễn phí từ một quảng cáo trên mạng', FALSE, 'Nguy cơ cao tải phải phần mềm rác hoặc phần mềm độc hại (malware).', 4);

    -- Câu 10 (Miền 5 - Kỹ năng 5.2)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c5_2, 'MCQ', 
    'Một nhóm làm việc phân tán ở nhiều tỉnh thành cần một giải pháp số để cùng theo dõi tiến độ công việc theo phương pháp Kanban, quản lý hạn chót và gán việc linh hoạt. Công cụ nào sau đây phù hợp nhất?',
    10.00, 10, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Trello / Jira / ClickUp / Notion', TRUE, 'Đây là các nền tảng quản lý dự án chuyên biệt hỗ trợ bảng Kanban, phân công và theo dõi tiến độ thời gian thực.', 1),
    (v_item_id, 'Zalo / Messenger Group Chat', FALSE, 'Ứng dụng chat nhanh bị trôi tin nhắn, không thể theo dõi trạng thái nhiệm vụ hay quản lý trực quan theo luồng Kanban.', 2),
    (v_item_id, 'File văn bản Word đính kèm gửi qua lại bằng email', FALSE, 'Dẫn đến tình trạng xung đột phiên bản và không thể cộng tác đồng thời theo thời gian thực.', 3),
    (v_item_id, 'Google Slides trình chiếu trực tuyến', FALSE, 'Google Slides phục vụ thuyết trình, không được thiết kế cho việc quản lý thẻ công việc và hạn chót.', 4);

END $$;
