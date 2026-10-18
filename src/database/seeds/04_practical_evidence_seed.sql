-- ==============================================================================
-- NEXA SEED DATA 04: PRACTICAL EVIDENCE ASSESSMENT & RUBRIC (DIGCOMP 3.1 & 1.2)
-- ==============================================================================

DO $$
DECLARE
    v_assessment_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_comp_id UUID;
    v_item_id UUID;
    v_rubric_id UUID;
    v_crit1 UUID;
    v_crit2 UUID;
    v_crit3 UUID;
BEGIN
    -- 1. Get Competency ID 3.1 (Phát triển nội dung số đa định dạng)
    SELECT id INTO v_comp_id FROM public.competencies WHERE skill_code = '3.1' LIMIT 1;

    -- 2. Insert DIGITAL_EVIDENCE Item (Order index 12 in Benchmark Assessment)
    INSERT INTO public.assessment_items (
        id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level
    ) VALUES (
        'c0000000-0000-0000-0000-000000000012',
        v_assessment_id,
        v_comp_id,
        'DIGITAL_EVIDENCE',
        'NHIỆM VỤ THỰC HÀNH & NỘP MINH CHỨNG SỐ:
Thiết kế Infographic / Poster truyền thông kỹ thuật số về chủ đề: "Quy tắc Ứng xử Văn minh trên Mạng & Nhận diện Tin giả do AI tạo sinh (Deepfake/Hallucination)".

YÊU CẦU BẮT BUỘC:
1. Tải lên tệp minh chứng sản phẩm số định dạng PDF, PNG, JPG hoặc ZIP (dung lượng tối đa 10MB).
2. Viết bản thuyết minh giải trình (BẮT BUỘC TỐI THIỂU 30 TỪ):
   - Nêu rõ công cụ số hoặc phần mềm bạn đã sử dụng để tạo sản phẩm (Canva, Figma, Photoshop, Illustrator, v.v.).
   - Mục đích truyền tải thông điệp và căn cứ khoa học/pháp lý được áp dụng.
   - Trách nhiệm về bản quyền và tính xác thực của tài nguyên minh chứng.',
        20.00,
        12,
        'ADVANCED'
    ) ON CONFLICT (id) DO UPDATE SET
        prompt = EXCLUDED.prompt,
        points = EXCLUDED.points
    RETURNING id INTO v_item_id;

    -- 3. Insert Rubric for Practical Evidence Evaluation
    DELETE FROM public.rubrics WHERE item_id = v_item_id;

    INSERT INTO public.rubrics (id, item_id, title, description)
    VALUES (
        gen_random_uuid(),
        v_item_id,
        'Rubric Đánh Giá Sản Phẩm Số & Minh Chứng Thực Hành',
        'Tiêu chuẩn thẩm định 3 phương diện: Trực quan thiết kế (40%), Nội dung chuyên môn (30%), Bản thuyết minh giải trình >= 30 từ (30%).'
    ) RETURNING id INTO v_rubric_id;

    -- Criterion 1: Trực quan thiết kế (40% - 8đ)
    INSERT INTO public.rubric_criteria (id, rubric_id, name, weight_percent, max_points, order_index)
    VALUES (gen_random_uuid(), v_rubric_id, 'Chất lượng trực quan & Tính sáng tạo số', 40.00, 8.00, 1)
    RETURNING id INTO v_crit1;

    INSERT INTO public.rubric_levels (criterion_id, level_name, score_percent, description) VALUES
    (v_crit1, 'XUẤT SẮC', 100.00, 'Bố cục sản phẩm mạch lạc, độ tương phản màu sắc chuyên nghiệp, font chữ phân cấp rõ ràng, hình ảnh/biểu tượng vector sắc nét, tính thẩm mỹ học thuật cao.'),
    (v_crit1, 'ĐẠT CHUẨN', 75.00, 'Bố cục rõ ràng, hình ảnh minh họa phù hợp với thông điệp, trình bày dễ nhìn nhưng tính sáng tạo chưa thật sự nổi bật.'),
    (v_crit1, 'CẦN CẢI THIỆN', 50.00, 'Thiết kế còn thô, cỡ chữ và màu sắc chưa hài hòa, hình ảnh bị vỡ hạt hoặc chèn chữ quá dày đặc.'),
    (v_crit1, 'CHƯA ĐẠT', 25.00, 'Sản phẩm quá sơ sài hoặc sao chép nguyên mẫu từ trên mạng không qua chỉnh sửa.');

    -- Criterion 2: Nội dung & Căn cứ khoa học (30% - 6đ)
    INSERT INTO public.rubric_criteria (id, rubric_id, name, weight_percent, max_points, order_index)
    VALUES (gen_random_uuid(), v_rubric_id, 'Nội dung chuyên môn & Tính xác thực khoa học', 30.00, 6.00, 2)
    RETURNING id INTO v_crit2;

    INSERT INTO public.rubric_levels (criterion_id, level_name, score_percent, description) VALUES
    (v_crit2, 'XUẤT SẮC', 100.00, 'Cung cấp tiêu chí nhận diện Deepfake và tin giả cực kỳ chính xác; tích hợp chuẩn mực Netiquette và bảo vệ dữ liệu cá nhân Nghị định 13/2023.'),
    (v_crit2, 'ĐẠT CHUẨN', 75.00, 'Thông tin đầy đủ, đưa ra được các mẹo nhận biết tin giả cơ bản nhưng dẫn chứng quy chuẩn chưa sâu.'),
    (v_crit2, 'CẦN CẢI THIỆN', 50.00, 'Nội dung còn chung chung, mang tính hình thức hoặc có một số điểm chưa chuẩn xác.'),
    (v_crit2, 'CHƯA ĐẠT', 25.00, 'Nội dung sai lệch kiến thức số hoặc không liên quan đến chủ đề yêu cầu.');

    -- Criterion 3: Bản giải trình thuyết minh >= 30 từ (30% - 6đ)
    INSERT INTO public.rubric_criteria (id, rubric_id, name, weight_percent, max_points, order_index)
    VALUES (gen_random_uuid(), v_rubric_id, 'Bản thuyết minh giải trình (Bắt buộc >= 30 từ)', 30.00, 6.00, 3)
    RETURNING id INTO v_crit3;

    INSERT INTO public.rubric_levels (criterion_id, level_name, score_percent, description) VALUES
    (v_crit3, 'XUẤT SẮC', 100.00, 'Bản giải trình chi tiết trên 30 từ, nêu rõ phần mềm/công cụ sử dụng, phân tích sâu lý do lựa chọn thông điệp và cam kết bản quyền minh bạch.'),
    (v_crit3, 'ĐẠT CHUẨN', 75.00, 'Bản giải trình đạt từ 30 từ trở lên, nêu được công cụ và mục đích thiết kế nhưng phần quy trình còn ngắn gọn.'),
    (v_crit3, 'CẦN CẢI THIỆN', 50.00, 'Giải trình dưới 30 từ hoặc viết rất sơ sài, chưa chỉ ra được công cụ số đã sử dụng.'),
    (v_crit3, 'CHƯA ĐẠT', 25.00, 'Bỏ trống không có bản giải trình thuyết minh minh chứng.');

END $$;
