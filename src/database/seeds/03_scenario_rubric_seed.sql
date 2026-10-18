-- ==============================================================================
-- NEXA SEED DATA 03: SCENARIO WITH MULTI-CRITERIA RUBRIC (DIGCOMP 4.2 & 2.5)
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
    -- 1. Get Competency ID 4.2 (Bảo vệ dữ liệu cá nhân theo NĐ 13)
    SELECT id INTO v_comp_id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1;

    -- 2. Insert SCENARIO Item (Order index 11 in Benchmark Assessment)
    INSERT INTO public.assessment_items (
        id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level
    ) VALUES (
        'b0000000-0000-0000-0000-000000000011',
        v_assessment_id,
        v_comp_id,
        'SCENARIO',
        'TÌNH HUỐNG THỰC TẾ: Doanh nghiệp của bạn phát hiện một nhân viên vô tình tải tệp tin chứa 5.000 hồ sơ khách hàng (Họ tên, SĐT, Email) lên dịch vụ lưu trữ đám mây ở chế độ công khai. Kẻ xấu đã tải về và bắt đầu gửi email lừa đảo (Phishing) mạo danh doanh nghiệp yêu cầu khách hàng cung cấp mã OTP ngân hàng.

YÊU CẦU:
1. (Nhánh trắc nghiệm): Chọn hành động khẩn cấp kỹ thuật ĐẦU TIÊN cần làm trong 15 phút.
2. (Tự luận giải trình): Viết kế hoạch ứng phó chi tiết gồm:
   - Thông báo gửi khách hàng bị ảnh hưởng (cảnh báo nguy cơ, hướng dẫn xử lý).
   - Biện pháp kỹ thuật triệt để khắc phục lỗ hổng.
   - Trình tự thông báo vi phạm dữ liệu cá nhân cho Cơ quan chuyên trách bảo vệ dữ liệu cá nhân theo đúng quy định Nghị định 13/2023/NĐ-CP (thời hạn 72 giờ).',
        20.00,
        11,
        'ADVANCED'
    ) ON CONFLICT (id) DO UPDATE SET
        prompt = EXCLUDED.prompt,
        points = EXCLUDED.points
    RETURNING id INTO v_item_id;

    -- 3. Options for Decision Branch (Part 1 - Instant Algorithmic grading)
    DELETE FROM public.item_options WHERE item_id = v_item_id;

    INSERT INTO public.item_options (item_id, content, is_correct, explanation, order_index) VALUES
    (v_item_id, 'Thu hồi ngay quyền truy cập tệp trên đám mây, rà soát log tải xuống và reset token xác thực tài khoản bị lộ', TRUE, 'Đây là biện pháp kỹ thuật cô lập tức thời nhằm ngăn chặn rò rỉ mở rộng và xác định phạm vi tổn hại.', 1),
    (v_item_id, 'Xóa toàn bộ hòm thư của nhân viên đó để che giấu dấu vết rò rỉ dữ liệu', FALSE, 'Hành vi xóa dấu vết vi phạm nghiêm trọng quy chuẩn điều tra số và pháp luật bảo vệ dữ liệu.', 2),
    (v_item_id, 'Đăng thông báo trên mạng xã hội đổ lỗi cho nhà cung cấp dịch vụ đám mây', FALSE, 'Thiếu căn cứ và vi phạm chuẩn mực đạo đức nghề nghiệp.', 3),
    (v_item_id, 'Chờ hết tuần xem có khách hàng nào khiếu nại rồi mới tiến hành xử lý', FALSE, 'Chậm trễ trong ứng phó sự cố an ninh mạng sẽ dẫn đến hậu quả nghiêm trọng và bị xử phạt theo NĐ 13.', 4);

    -- 4. Insert Rubric for Essay Evaluation (Part 2 - AI Rubric Grading)
    DELETE FROM public.rubrics WHERE item_id = v_item_id;

    INSERT INTO public.rubrics (id, item_id, title, description)
    VALUES (
        gen_random_uuid(),
        v_item_id,
        'Rubric Thẩm Định Năng Lực Ứng Phó Sự Cố & Tuân Thủ NĐ 13/2023',
        'Tiêu chuẩn đánh giá 3 tiêu chí cốt lõi: Pháp lý NĐ 13 (40%), Giao tiếp ứng xử (30%), Kỹ thuật phòng ngừa (30%).'
    ) RETURNING id INTO v_rubric_id;

    -- Criterion 1: Pháp lý NĐ 13/2023 (40% - 8đ)
    INSERT INTO public.rubric_criteria (id, rubric_id, name, weight_percent, max_points, order_index)
    VALUES (gen_random_uuid(), v_rubric_id, 'Tuân thủ pháp luật Nghị định 13/2023/NĐ-CP', 40.00, 8.00, 1)
    RETURNING id INTO v_crit1;

    INSERT INTO public.rubric_levels (criterion_id, level_name, score_percent, description) VALUES
    (v_crit1, 'XUẤT SẮC', 100.00, 'Nêu chính xác nghĩa vụ thông báo cho Bộ Công an (Cục An ninh mạng) trong vòng 72 giờ kể từ khi phát hiện vi phạm theo Mẫu số 03; nêu rõ biện pháp khắc phục đã áp dụng.'),
    (v_crit1, 'ĐẠT CHUẨN', 75.00, 'Có đề cập việc báo cáo cơ quan nhà nước có thẩm quyền nhưng chưa nêu rõ mốc 72 giờ hoặc thiếu nội dung mô tả chi tiết chủng loại dữ liệu bị rò rỉ.'),
    (v_crit1, 'CẦN CẢI THIỆN', 50.00, 'Chỉ đề xuất xử lý nội bộ, nhận thức còn mơ hồ về trách nhiệm pháp lý bắt buộc theo quy định pháp luật Việt Nam.'),
    (v_crit1, 'CHƯA ĐẠT', 25.00, 'Có ý định che giấu thông tin hoặc hoàn toàn không biết về Nghị định 13/2023/NĐ-CP.');

    -- Criterion 2: Giao tiếp & Ứng xử số minh bạch (30% - 6đ)
    INSERT INTO public.rubric_criteria (id, rubric_id, name, weight_percent, max_points, order_index)
    VALUES (gen_random_uuid(), v_rubric_id, 'Giao tiếp minh bạch & Cảnh báo lừa đảo khách hàng', 30.00, 6.00, 2)
    RETURNING id INTO v_crit2;

    INSERT INTO public.rubric_levels (criterion_id, level_name, score_percent, description) VALUES
    (v_crit2, 'XUẤT SẮC', 100.00, 'Thông điệp gửi khách hàng chân thành, minh bạch, chỉ rõ dấu hiệu nhận diện email Phishing lừa đảo, nhấn mạnh công ty KHÔNG BAO GIỜ yêu cầu OTP ngân hàng.'),
    (v_crit2, 'ĐẠT CHUẨN', 75.00, 'Có gửi cảnh báo cho khách hàng nhưng hướng dẫn nhận diện lừa đảo chưa cụ thể, còn chung chung.'),
    (v_crit2, 'CẦN CẢI THIỆN', 50.00, 'Thông báo quá muộn hoặc văn phong gây hoang mang, chưa tạo được sự an tâm cho người dùng.'),
    (v_crit2, 'CHƯA ĐẠT', 25.00, 'Không có kế hoạch thông báo cho khách hàng hoặc đổ lỗi cho người dùng.');

    -- Criterion 3: Biện pháp kỹ thuật phòng ngừa (30% - 6đ)
    INSERT INTO public.rubric_criteria (id, rubric_id, name, weight_percent, max_points, order_index)
    VALUES (gen_random_uuid(), v_rubric_id, 'Giải pháp kỹ thuật cô lập & Bảo vệ chiều sâu', 30.00, 6.00, 3)
    RETURNING id INTO v_crit3;

    INSERT INTO public.rubric_levels (criterion_id, level_name, score_percent, description) VALUES
    (v_crit3, 'XUẤT SẮC', 100.00, 'Đề xuất giải pháp bảo vệ nhiều lớp: mã hóa dữ liệu tại chỗ (encryption at rest/in transit), cấu hình DLP (Data Loss Prevention), bắt buộc 2FA và đào tạo bảo mật cho nhân viên.'),
    (v_crit3, 'ĐẠT CHUẨN', 75.00, 'Đã thu hồi quyền chia sẻ và đổi mật khẩu, nhưng chưa đề cập giải pháp phòng ngừa dài hạn như DLP hay mã hóa.'),
    (v_crit3, 'CẦN CẢI THIỆN', 50.00, 'Chỉ xử lý đối phó tạm thời, nguy cơ tái diễn lỗ hổng tương tự trong tương lai còn rất cao.'),
    (v_crit3, 'CHƯA ĐẠT', 25.00, 'Không đưa ra được biện pháp kỹ thuật nào xác đáng.');

END $$;
