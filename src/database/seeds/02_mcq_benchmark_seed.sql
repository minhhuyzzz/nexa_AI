-- ==============================================================================
-- NEXA ASSESSMENT SEED 02: BENCHMARK 10-MCQ ASSESSMENT (DIGCOMP 3.0)
-- ==============================================================================

DO $$
DECLARE
    v_framework_id UUID;
    v_assessment_id UUID;
    v_item_id UUID;
    v_c1_1 UUID; v_c1_2 UUID;
    v_c2_1 UUID; v_c2_2 UUID;
    v_c3_1 UUID; v_c3_4 UUID;
    v_c4_1 UUID; v_c4_2 UUID;
    v_c5_1 UUID; v_c5_2 UUID;
BEGIN
    -- 1. Get Framework ID
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    
    -- 2. Get specific Competency IDs
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

    -- 3. Create Benchmark Assessment
    INSERT INTO public.assessments (
        id, title, description, framework_id, duration_minutes, passing_score, point_reward, is_published
    ) VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'Đánh Giá Năng Lực Số Chuẩn Quốc Gia & EU DigComp (Bài thi Chuẩn 10 Câu MCQ)',
        'Bài khảo thí trắc nghiệm khách quan đa miền năng lực số. Hệ thống tự động chấm điểm tức thì trong 0.01s và cộng 50 điểm (points) khi hoàn thành.',
        v_framework_id,
        30,
        70.00,
        50,
        TRUE
    ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description;

    v_assessment_id := 'a0000000-0000-0000-0000-000000000001';

    -- 4. Delete existing items for fresh seed
    DELETE FROM public.assessment_items WHERE assessment_id = v_assessment_id;

    -- Câu 1 (Miền 1 - Kỹ năng 1.1: Duyệt, tìm kiếm thông tin)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c1_1, 'MCQ', 
    'Khi tìm kiếm tài liệu nghiên cứu học thuật định dạng PDF về chủ đề "Chuyển đổi số giáo dục", cú pháp tìm kiếm nâng cao nào trên Google là tối ưu nhất?',
    10.00, 1, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, '"Chuyển đổi số giáo dục" filetype:pdf', TRUE, 'Toán tử filetype:pdf giới hạn chính xác định dạng tài liệu và dấu ngoặc kép tìm kiếm cụm từ chính xác.', 1),
    (v_item_id, 'Chuyển đổi số giáo dục + pdf download', FALSE, 'Cú pháp này sẽ trả về nhiều kết quả trang web thông thường chứa chữ download thay vì file trực tiếp.', 2),
    (v_item_id, 'search pdf "Chuyển đổi số giáo dục"', FALSE, 'Từ khóa search là thừa thãi và không kích hoạt bộ lọc định dạng tệp của công cụ tìm kiếm.', 3),
    (v_item_id, 'site:pdf "Chuyển đổi số giáo dục"', FALSE, 'site: dùng để giới hạn tên miền web, không phải định dạng tệp tin.', 4);

    -- Câu 2 (Miền 1 - Kỹ năng 1.2: Đánh giá dữ liệu)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c1_2, 'MCQ', 
    'Phương pháp nào sau đây là chuẩn mực nhất để xác minh tính xác thực của một tin tức giật gân lan truyền trên mạng xã hội trước khi chia sẻ?',
    10.00, 2, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Kiểm chứng chéo thông tin từ các cơ quan báo chí chính thống và kiểm tra ngày xuất bản gốc', TRUE, 'Kiểm chứng chéo đa nguồn có thẩm quyền là nguyên tắc cốt lõi trong đánh giá độ tin cậy thông tin số.', 1),
    (v_item_id, 'Đọc phần bình luận của cộng đồng mạng để xem số đông có tin hay không', FALSE, 'Bình luận số đông dễ bị thao túng bởi bot và hiệu ứng tâm lý đám đông.', 2),
    (v_item_id, 'Kiểm tra xem bài viết có nhiều lượt chia sẻ (share) và tương tác hay không', FALSE, 'Mức độ lan truyền cao không đồng nghĩa với tính xác thực của thông tin.', 3),
    (v_item_id, 'Tin tưởng ngay nếu bài viết được đăng bởi người có tích xanh', FALSE, 'Tài khoản tích xanh hiện nay có thể mua được hoặc bị hack, cần xác minh nội dung độc lập.', 4);

    -- Câu 3 (Miền 2 - Kỹ năng 2.1: Tương tác qua công nghệ số)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c2_1, 'MCQ', 
    'Khi gửi email công việc quan trọng cho đối tác, việc nào sau đây vi phạm quy tắc văn hóa ứng xử số (Netiquette)?',
    10.00, 3, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Viết TOÀN BỘ TIÊU ĐỀ VÀ NỘI DUNG BẰNG CHỮ IN HOA để nhấn mạnh sự khẩn cấp', TRUE, 'Trong văn hóa số, việc viết hoa toàn bộ được coi là hành vi la hét, thể hiện sự thiếu tôn trọng người nhận.', 1),
    (v_item_id, 'Tóm tắt nội dung chính trong 3 câu đầu tiên của email', FALSE, 'Đây là kỹ năng giao tiếp chuyên nghiệp giúp người nhận nắm bắt thông tin nhanh.', 2),
    (v_item_id, 'Đặt tiêu đề rõ ràng kèm mã dự án hoặc mục đích liên hệ', FALSE, 'Tiêu đề rõ ràng giúp phân loại và quản lý hộp thư hiệu quả.', 3),
    (v_item_id, 'Kiểm tra lỗi chính tả và định dạng văn bản trước khi gửi', FALSE, 'Kiểm tra lỗi trước khi gửi là thực hành chuẩn mực nghề nghiệp.', 4);

    -- Câu 4 (Miền 2 - Kỹ năng 2.2: Chia sẻ thông tin)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c2_2, 'MCQ', 
    'Khi chia sẻ tài liệu nội bộ nhóm trên đám mây (Google Drive / OneDrive), thiết lập quyền nào đảm bảo an toàn thông tin nhất cho người chỉ cần xem?',
    10.00, 4, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Cấp quyền Xem (Viewer) cho từng email cụ thể và tắt tính năng cho phép người xem sao chép/tải xuống', TRUE, 'Tuân thủ nguyên tắc đặc quyền tối thiểu (Least Privilege) và hạn chế phát tán dữ liệu.', 1),
    (v_item_id, 'Bật chế độ "Bất kỳ ai có đường liên kết đều có thể chỉnh sửa"', FALSE, 'Đây là lỗ hổng nghiêm trọng làm lộ dữ liệu công khai trên mạng.', 2),
    (v_item_id, 'Cấp quyền Biên tập viên (Editor) để đối tác tiện ghi chú trực tiếp', FALSE, 'Cấp quyền chỉnh sửa dư thừa có nguy cơ xóa nhầm hoặc sửa đổi dữ liệu gốc.', 3),
    (v_item_id, 'Gửi mật khẩu tài khoản quản trị cho đối tác để họ tự vào xem', FALSE, 'Vi phạm nghiêm trọng chính sách bảo mật danh tính.', 4);

    -- Câu 5 (Miền 3 - Kỹ năng 3.1: Phát triển nội dung số)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c3_1, 'MCQ', 
    'Định dạng ảnh nào sau đây lưu trữ dưới dạng vector, cho phép thu phóng không giới hạn độ phân giải mà không bị vỡ hạt, lý tưởng cho thiết kế logo và biểu tượng web?',
    10.00, 5, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'SVG (Scalable Vector Graphics)', TRUE, 'SVG là chuẩn vector dựa trên XML, hiển thị sắc nét ở mọi kích thước màn hình.', 1),
    (v_item_id, 'PNG (Portable Network Graphics)', FALSE, 'PNG là định dạng ảnh raster (bitmap), sẽ bị vỡ hạt khi phóng to quá kích thước chuẩn.', 2),
    (v_item_id, 'JPEG / JPG', FALSE, 'JPEG là định dạng nén mất dữ liệu (lossy) dạng raster.', 3),
    (v_item_id, 'WEBP', FALSE, 'WEBP chủ yếu là định dạng raster tối ưu dung lượng cho web.', 4);

    -- Câu 6 (Miền 3 - Kỹ năng 3.4: Lập trình & Tư duy thuật toán)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c3_4, 'MCQ', 
    'Khi sử dụng các công cụ Generative AI (như ChatGPT, Gemini, Claude) để hỗ trợ viết code, cách tiếp cận nào sau đây là an toàn và chuyên nghiệp nhất?',
    10.00, 6, 'ADVANCED') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Khử sạch thông tin bí mật (API keys, PII) trước khi prompt, luôn đọc hiểu và viết unit test kiểm thử lại code của AI', TRUE, 'Đảm bảo tuân thủ bảo mật dữ liệu và phòng ngừa lỗi logic hoặc ảo giác (hallucination) của AI.', 1),
    (v_item_id, 'Dán toàn bộ mã nguồn hệ thống và cơ sở dữ liệu lên AI để nó tự sửa cho nhanh', FALSE, 'Hành vi này làm lộ bí mật kinh doanh và vi phạm quy định bảo mật thông tin.', 2),
    (v_item_id, 'Tin tưởng 100% code AI sinh ra và deploy thẳng lên môi trường Production mà không cần test', FALSE, 'Cực kỳ rủi ro vì AI có thể sinh code chứa lỗ hổng bảo mật hoặc không tối ưu.', 3),
    (v_item_id, 'Không cần học căn bản lập trình nữa vì AI đã làm thay toàn bộ công việc', FALSE, 'Lập trình viên vẫn cần nắm vững kiến trúc và logic để chỉ đạo và review code AI.', 4);

    -- Câu 7 (Miền 4 - Kỹ năng 4.1: Bảo vệ thiết bị)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c4_1, 'MCQ', 
    'Biện pháp nào sau đây giúp tăng cường bảo mật tài khoản cao nhất trước các cuộc tấn công đánh cắp mật khẩu số đông?',
    10.00, 7, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Bật xác thực 2 yếu tố (2FA) qua ứng dụng Authenticator hoặc Khóa bảo mật FIDO2', TRUE, '2FA ngăn chặn truy cập trái phép ngay cả khi mật khẩu bị rò rỉ.', 1),
    (v_item_id, 'Đặt một mật khẩu thật dài nhưng dùng chung cho tất cả các trang web', FALSE, 'Dùng chung mật khẩu tạo ra nguy cơ dây chuyền (credential stuffing) khi một trang bị hack.', 2),
    (v_item_id, 'Lưu toàn bộ mật khẩu vào một file Word không đặt khóa trên màn hình Desktop', FALSE, 'Tập tin không mã hóa là mục tiêu hàng đầu của các phần mềm độc hại (infostealer).', 3),
    (v_item_id, 'Chỉ đổi mật khẩu khi nhận được email lạ yêu cầu cập nhật thông tin', FALSE, 'Email lạ yêu cầu đổi mật khẩu thường là bẫy lừa đảo (phishing).', 4);

    -- Câu 8 (Miền 4 - Kỹ năng 4.2: Bảo vệ dữ liệu cá nhân theo NĐ 13/2023)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c4_2, 'MCQ', 
    'Theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, hành vi nào sau đây là BẮT BUỘC đối với bên xử lý dữ liệu trước khi thu thập dữ liệu cá nhân của người dùng?',
    10.00, 8, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Phải có sự đồng ý rõ ràng, tự nguyện của chủ thể dữ liệu trên cơ sở biết rõ mục đích và phạm vi xử lý', TRUE, 'Điều 9 và Điều 11 NĐ 13/2023 quy định rõ sự đồng ý của chủ thể dữ liệu là điều kiện tiên quyết.', 1),
    (v_item_id, 'Tự động mặc định tích chọn "Tôi đồng ý chia sẻ dữ liệu cho bên thứ ba" trong form đăng ký', FALSE, 'Vi phạm quy định vì sự đồng ý phải được thể hiện chủ động, không được cài đặt mặc định.', 2),
    (v_item_id, 'Thu thập toàn bộ dữ liệu vị trí và danh bạ ngay cả khi ứng dụng không cần dùng đến', FALSE, 'Vi phạm nguyên tắc hạn chế mục đích và thu thập tối thiểu dữ liệu cần thiết.', 3),
    (v_item_id, 'Bán dữ liệu người dùng cho công ty quảng cáo nếu người dùng không phản đối trong 3 ngày', FALSE, 'Hành vi mua bán dữ liệu cá nhân trái phép bị nghiêm cấm theo pháp luật Việt Nam.', 4);

    -- Câu 9 (Miền 5 - Kỹ năng 5.1: Giải quyết sự cố kỹ thuật)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c5_1, 'MCQ', 
    'Khi máy tính của bạn bất ngờ không thể truy cập một trang web cụ thể trong khi các trang khác vẫn vào bình thường, bước cô lập nguyên nhân đầu tiên cần làm là gì?',
    10.00, 9, 'FOUNDATION') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Thử mở trang web trên trình duyệt khác hoặc chế độ ẩn danh (Incognito) để loại trừ lỗi cache/cookie', TRUE, 'Mở ẩn danh giúp xác định ngay xem lỗi do cache trình duyệt cá nhân hay do máy chủ của trang web.', 1),
    (v_item_id, 'Cài đặt lại toàn bộ hệ điều hành Windows ngay lập tức', FALSE, 'Hành động quá mức không cần thiết và tốn nhiều thời gian.', 2),
    (v_item_id, 'Mua router Wi-Fi mới để thay thế', FALSE, 'Các trang khác vẫn vào bình thường chứng tỏ mạng Internet và router vẫn hoạt động tốt.', 3),
    (v_item_id, 'Xóa toàn bộ dữ liệu ổ cứng máy tính', FALSE, 'Hành động sai lầm gây mất mát dữ liệu nghiêm trọng.', 4);

    -- Câu 10 (Miền 5 - Kỹ năng 5.2: Xác định nhu cầu và khoảng trống công nghệ)
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (gen_random_uuid(), v_assessment_id, v_c5_2, 'MCQ', 
    'Để tự động hóa quy trình tổng hợp hàng trăm phản hồi khảo sát hàng tuần từ khách hàng vào bảng tính mà không cần gõ thủ công, giải pháp công nghệ số nào sau đây là phù hợp nhất?',
    10.00, 10, 'INTERMEDIATE') RETURNING id INTO v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Sử dụng công cụ biểu mẫu trực tuyến (Google Forms / MS Forms) tích hợp Webhook / Zapier tự động đổ dữ liệu', TRUE, 'Ứng dụng tự động hóa luồng làm việc (workflow automation) giúp giải quyết triệt để nhu cầu xử lý dữ liệu lặp đi lặp lại.', 1),
    (v_item_id, 'Thuê thêm nhân sự để trực máy và gõ từng dòng vào Excel', FALSE, 'Không tối ưu chi phí và không tận dụng được giải pháp công nghệ sẵn có.', 2),
    (v_item_id, 'In toàn bộ phiếu khảo sát ra giấy rồi xếp vào tủ hồ sơ', FALSE, 'Đi ngược lại với tiến trình số hóa và khó trích xuất dữ liệu phân tích.', 3),
    (v_item_id, 'Chụp ảnh màn hình từng biểu mẫu và gửi qua nhóm Zalo', FALSE, 'Không cấu trúc được dữ liệu và gây ngập tin nhắn trong nhóm.', 4);

END $$;
