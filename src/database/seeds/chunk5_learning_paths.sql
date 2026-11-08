-- ==============================================================================
-- NEXA SEED: 5 CANONICAL LEARNING PATHS & 15 REAL LEARNING MODULES
-- ==============================================================================

DO $$
DECLARE
    v_p1 UUID := 'b0000000-0000-0000-0000-000000000001';
    v_p2 UUID := 'b0000000-0000-0000-0000-000000000002';
    v_p3 UUID := 'b0000000-0000-0000-0000-000000000003';
    v_p4 UUID := 'b0000000-0000-0000-0000-000000000004';
    v_p5 UUID := 'b0000000-0000-0000-0000-000000000005';
BEGIN
    -- 1. Insert 5 canonical learning paths
    INSERT INTO public.learning_paths (id, title, slug, description, domain_codes, access_tier, point_reward, is_published, order_index, created_at, updated_at)
    VALUES
    (v_p1, 'Chinh phục Thông tin & Dữ liệu số', 'chinh-phuc-thong-tin-du-lieu-so', 'Nắm vững kỹ năng tra cứu chuyên sâu, đánh giá độ tin cậy của thông tin và quản trị kho dữ liệu cá nhân hiệu quả.', ARRAY['01'], 'FREE', 60, TRUE, 1, NOW(), NOW()),
    (v_p2, 'Giao tiếp & Cộng tác Không gian số', 'giao-tiep-cong-tac-khong-gian-so', 'Làm chủ các kênh làm việc từ xa, xây dựng văn hóa giao tiếp chuẩn mực (Netiquette) và bảo vệ danh tính số.', ARRAY['02'], 'FREE', 60, TRUE, 2, NOW(), NOW()),
    (v_p3, 'Sáng tạo Nội dung số & Tác nghiệp cùng AI', 'sang-tao-noi-dung-so-ai', 'Học cách tạo nội dung đa phương tiện, làm chủ Prompt Engineering với AI tạo sinh và tuân thủ bản quyền số.', ARRAY['03'], 'FREE', 60, TRUE, 3, NOW(), NOW()),
    (v_p4, 'An toàn, Bảo mật & Sức khỏe số', 'an-toan-bao-mat-suc-khoe-so', 'Thiết lập lá chắn an ninh mạng cá nhân, phòng ngừa lừa đảo trực tuyến và duy trì sức khỏe tinh thần trong kỷ nguyên số.', ARRAY['04'], 'FREE', 60, TRUE, 4, NOW(), NOW()),
    (v_p5, 'Giải quyết Vấn đề & Tự động hóa Quy trình', 'giai-quyet-van-de-tu-dong-hoa', 'Tự khắc phục sự cố công nghệ thường gặp, lựa chọn công cụ số phù hợp và ứng dụng AI tự động hóa công việc.', ARRAY['05'], 'FREE', 60, TRUE, 5, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        domain_codes = EXCLUDED.domain_codes,
        is_published = TRUE,
        updated_at = NOW();

    -- Clear old seeded modules under these paths
    DELETE FROM public.learning_modules WHERE path_id IN (v_p1, v_p2, v_p3, v_p4, v_p5);

    -- 2. Modules for Path 1 (Domain 01)
    INSERT INTO public.learning_modules (id, path_id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, content_markdown, is_published, order_index, access_tier, created_at, updated_at)
    VALUES
    (
        'c0000000-0000-0000-0000-000000000101', v_p1,
        (SELECT id FROM public.competencies WHERE skill_code = '1.1' LIMIT 1),
        '01', '1.1',
        'Kỹ thuật tìm kiếm dữ liệu nâng cao trên Internet',
        'Làm chủ cú pháp tìm kiếm Google Dorks, lọc định dạng file, giới hạn tên miền học thuật và tinh chỉnh từ khóa chuẩn xác.',
        15, 20,
        '# Kỹ thuật tìm kiếm dữ liệu nâng cao

## 1. Tầm quan trọng của tìm kiếm có cấu trúc
Trong kỷ nguyên bùng nổ dữ liệu, việc tìm kiếm không chỉ là gõ từ khóa ngẫu nhiên. Người có năng lực số cao biết sử dụng các toán tử logic để thu hẹp phạm vi tìm kiếm trong vài giây.

## 2. Các toán tử tìm kiếm thiết yếu
- **Dấu ngoặc kép**: Tìm chính xác cụm từ. Ví dụ: `"năng lực số sinh viên"`.
- **Toán tử filetype:**: Lọc trực tiếp file tài liệu. Ví dụ: `chuyển đổi số giáo dục filetype:pdf`.
- **Toán tử site:**: Giới hạn trong tên miền cụ thể. Ví dụ: `quy chế tuyển sinh site:edu.vn`.
- **Toán tử dấu trừ (-)**: Loại trừ từ khóa không mong muốn.

## 3. Thực hành & Ứng dụng
Hãy thử kết hợp: `"báo cáo kinh tế số" site:gov.vn filetype:pdf` để tìm tài liệu chính thức từ cơ quan nhà nước.',
        TRUE, 1, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000102', v_p1,
        (SELECT id FROM public.competencies WHERE skill_code = '1.2' LIMIT 1),
        '01', '1.2',
        'Đánh giá độ tin cậy thông tin và nhận diện Fake News',
        'Áp dụng mô hình CRAAP để thẩm định tác giả, tính cập nhật, động cơ bài viết và kỹ thuật kiểm chứng chéo nguồn tin.',
        20, 20,
        '# Đánh giá độ tin cậy thông tin (Phương pháp CRAAP)

## 1. Tiêu chuẩn CRAAP
- **Currency (Tính cập nhật)**: Thông tin được xuất bản khi nào? Có còn giá trị thực tế không?
- **Relevance (Tính phù hợp)**: Thông tin có trực tiếp trả lời câu hỏi nghiên cứu không?
- **Authority (Tính thẩm quyền)**: Tác giả là ai? Cơ quan chủ quản có uy tín không?
- **Accuracy (Tính chính xác)**: Dữ liệu có trích dẫn nguồn không? Có được phản biện độc lập không?
- **Purpose (Mục đích)**: Bài viết mang tính thông tin giáo dục hay nhằm mục đích thương mại, lôi kéo quan điểm?

## 2. Kỹ thuật Fact-Checking nhanh
- Luôn kiểm chứng chéo ít nhất 2 nguồn độc lập trước khi trích dẫn hoặc chia sẻ.',
        TRUE, 2, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000103', v_p1,
        (SELECT id FROM public.competencies WHERE skill_code = '1.3' LIMIT 1),
        '01', '1.3',
        'Quản trị dữ liệu số cá nhân và đám mây an toàn',
        'Phương pháp tổ chức thư mục logic, quy tắc đặt tên file theo chuẩn ISO, sao lưu dữ liệu theo nguyên tắc 3-2-1.',
        15, 20,
        '# Quản trị dữ liệu số cá nhân

## 1. Nguyên tắc sao lưu 3-2-1
- Giữ 3 bản sao dữ liệu quan trọng.
- Lưu trữ trên 2 dạng thiết bị/phương tiện khác nhau (ví dụ: SSD ngoài và Đám mây).
- Để 1 bản sao đặt tại địa điểm tách biệt (Cloud Storage).

## 2. Quy ước đặt tên file khoa học
Định dạng chuẩn: YYYY-MM-DD_TenDuAn_PhienBan.ext (Ví dụ: 2026-11-06_BaoCaoNangLucSo_v1.0.pdf). Tránh dùng tiếng Việt có dấu trong tên file kỹ thuật.',
        TRUE, 3, 'FREE', NOW(), NOW()
    );

    -- 3. Modules for Path 2 (Domain 02)
    INSERT INTO public.learning_modules (id, path_id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, content_markdown, is_published, order_index, access_tier, created_at, updated_at)
    VALUES
    (
        'c0000000-0000-0000-0000-000000000201', v_p2,
        (SELECT id FROM public.competencies WHERE skill_code = '2.5' LIMIT 1),
        '02', '2.5',
        'Văn hóa giao tiếp trực tuyến (Netiquette) chuyên nghiệp',
        'Chuẩn mực gửi email công việc, nguyên tắc trao đổi trong nhóm chat tổ chức và xử lý xung đột trong không gian số.',
        15, 20,
        '# Netiquette — Văn hóa ứng xử không gian số

## 1. Nguyên tắc viết Email chuyên nghiệp
- Tiêu đề ngắn gọn, phản ánh rõ ràng nội dung: [Tên Tổ Chức] - Đề xuất dự án A - [Họ tên].
- Không viết hoa toàn bộ chữ cái (gây cảm giác quát tháo).
- Đọc lại kỹ trước khi bấm Gửi; kiểm tra danh sách CC và BCC.

## 2. Giao tiếp qua tin nhắn công việc
- Đi thẳng vào vấn đề; tổng hợp câu hỏi trong một tin nhắn thay vì ngắt từng câu rời rạc.',
        TRUE, 1, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000202', v_p2,
        (SELECT id FROM public.competencies WHERE skill_code = '2.4' LIMIT 1),
        '02', '2.4',
        'Cộng tác số thời gian thực và quản lý tài liệu nhóm',
        'Khai thác Google Docs/Workspace, thiết lập quyền xem/nhận xét/chỉnh sửa, lịch sử phiên bản (Version History).',
        20, 20,
        '# Cộng tác tài liệu số thời gian thực

## 1. Phân quyền truy cập chính xác
- **Chỉ xem (Viewer)**: Dành cho người nhận thông báo, không có quyền can thiệp.
- **Nhận xét (Commenter)**: Thích hợp cho giai đoạn phản biện, duyệt nội dung.
- **Chỉnh sửa (Editor)**: Chỉ cấp cho người trực tiếp đồng tác giả.

## 2. Khôi phục với Version History
Không cần lưu nhiều file như Final_v1, Final_final. Sử dụng tính năng Version History để đặt tên các mốc quan trọng và khôi phục khi cần.',
        TRUE, 2, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000203', v_p2,
        (SELECT id FROM public.competencies WHERE skill_code = '2.6' LIMIT 1),
        '02', '2.6',
        'Quản lý danh tính số và kiểm soát dấu vết kỹ thuật số',
        'Bảo vệ Digital Footprint cá nhân, kiểm soát dữ liệu mạng xã hội và định hình thương hiệu cá nhân tích cực.',
        15, 20,
        '# Quản lý danh tính và dấu chân số (Digital Footprint)

## 1. Dấu chân số là gì?
Mọi bài đăng, bình luận, lượt thích, địa chỉ IP hay quyền chia sẻ vị trí đều để lại dấu vết kỹ thuật số vĩnh viễn trên Internet.

## 2. Biện pháp kiểm soát
- Tự tìm kiếm tên mình trên công cụ tìm kiếm định kỳ.
- Cài đặt chế độ riêng tư cho trang cá nhân.
- Không đăng tải thông tin vé máy bay, căn cước công dân hoặc số tài khoản lên mạng xã hội.',
        TRUE, 3, 'FREE', NOW(), NOW()
    );

    -- 4. Modules for Path 3 (Domain 03)
    INSERT INTO public.learning_modules (id, path_id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, content_markdown, is_published, order_index, access_tier, created_at, updated_at)
    VALUES
    (
        'c0000000-0000-0000-0000-000000000301', v_p3,
        (SELECT id FROM public.competencies WHERE skill_code = '3.1' LIMIT 1),
        '03', '3.1',
        'Thiết kế ấn phẩm số và trực quan hóa dữ liệu',
        'Nguyên tắc thị giác cơ bản, phân cấp thông tin (Hierarchy), bảng màu tương phản và biểu đồ dữ liệu chuẩn xác.',
        20, 20,
        '# Thiết kế ấn phẩm số và trực quan hóa dữ liệu

## 1. 3 Nguyên tắc thị giác nền tảng
- **Tương phản (Contrast)**: Tiêu đề rõ ràng, màu chữ phân biệt tốt với nền.
- **Căn gióng (Alignment)**: Mọi phần tử đều nằm trên một lưới bố cục nhất định.
- **Khoảng trắng (Whitespace)**: Tạo không gian thở cho mắt người đọc.

## 2. Chọn loại biểu đồ phù hợp
- So sánh cơ cấu: Donut / Bar chart.
- Diễn biến theo thời gian: Line chart.
- Đa chiều năng lực: Radar chart.',
        TRUE, 1, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000302', v_p3,
        (SELECT id FROM public.competencies WHERE skill_code = '3.2' LIMIT 1),
        '03', '3.2',
        'Kỹ nghệ Prompt AI tạo sinh và kiểm chứng nội dung',
        'Cấu trúc Prompt chuẩn 5 thành phần (Vai trò, Bối cảnh, Nhiệm vụ, Ràng buộc, Định dạng đầu ra) và phòng ngừa ảo giác AI.',
        20, 20,
        '# Kỹ nghệ Prompt AI tạo sinh hiệu quả

## 1. Công thức Prompt 5 thành phần
- **Role**: Bạn là chuyên gia phân tích dữ liệu giáo dục.
- **Context**: Dự án đánh giá năng lực số cho 500 sinh viên.
- **Task**: Hãy tóm tắt 3 điểm mạnh và 3 điểm cần cải thiện.
- **Constraint**: Không vượt quá 300 từ, dùng gạch đầu dòng.
- **Format**: Trình bày dưới dạng bảng so sánh.

## 2. Trách nhiệm người dùng
Luôn nhớ AI có thể tạo ra thông tin nghe hợp lý nhưng sai lệch (hallucination). Người dùng chịu trách nhiệm cuối cùng cho dữ liệu phát hành.',
        TRUE, 2, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000303', v_p3,
        (SELECT id FROM public.competencies WHERE skill_code = '3.3' LIMIT 1),
        '03', '3.3',
        'Bản quyền số, giấy phép Creative Commons và đạo đức AI',
        'Hiểu đúng các loại giấy phép CC (BY, SA, NC, ND), trích dẫn tài nguyên hợp lệ và tuân thủ liêm chính học thuật.',
        15, 20,
        '# Bản quyền số & Giấy phép Creative Commons

## 1. Các biểu tượng Creative Commons
- **CC BY**: Ghi công tác giả gốc.
- **CC NC (Non-Commercial)**: Phi thương mại, không dùng bán kiếm lời.
- **CC ND (No-Derivatives)**: Giữ nguyên bản, không tạo tác phẩm phái sinh.
- **CC SA (Share-Alike)**: Chia sẻ tương tự giấy phép gốc.

## 2. Liêm chính số
Trích dẫn rõ nguồn ảnh, tài liệu và công cụ AI đã hỗ trợ trong sản phẩm.',
        TRUE, 3, 'FREE', NOW(), NOW()
    );

    -- 5. Modules for Path 4 (Domain 04)
    INSERT INTO public.learning_modules (id, path_id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, content_markdown, is_published, order_index, access_tier, created_at, updated_at)
    VALUES
    (
        'c0000000-0000-0000-0000-000000000401', v_p4,
        (SELECT id FROM public.competencies WHERE skill_code = '4.1' LIMIT 1),
        '04', '4.1',
        'Nhận diện tấn công giả mạo (Phishing) và bảo vệ thiết bị',
        'Cách đọc địa chỉ email người gửi thật, phân tích đường link giả mạo, cập nhật bản vá bảo mật và mã hóa ổ đĩa.',
        20, 20,
        '# Phòng chống Phishing & Mã độc

## 1. Dấu hiệu email lừa đảo
- Tạo áp lực khẩn cấp: “Tài khoản của bạn sẽ bị khóa sau 24h!”.
- Tên miền email sai lệch nhẹ (ví dụ: security@nexaa-support.com thay vì nexa.ai).
- Yêu cầu cung cấp mật khẩu hoặc mã OTP.

## 2. Quy tắc vàng
Không bao giờ nhấp vào liên kết lạ trong tin nhắn khẩn cấp. Hãy tự truy cập trang web chính thức của dịch vụ bằng cách gõ URL vào trình duyệt.',
        TRUE, 1, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000402', v_p4,
        (SELECT id FROM public.competencies WHERE skill_code = '4.2' LIMIT 1),
        '04', '4.2',
        'Xác thực 2 yếu tố (2FA) và quản lý mật khẩu an toàn',
        'Tại sao không nên tái sử dụng mật khẩu, cách ứng dụng Password Manager và thiết lập ứng dụng xác thực Authenticator.',
        15, 20,
        '# Quản trị mật khẩu và Xác thực 2 bước (2FA)

## 1. Mật khẩu mạnh
- Tối thiểu 12-16 ký tự, kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
- Khuyến khích dùng Passphrase (chuỗi 4 từ ngẫu nhiên).
- Không tái sử dụng một mật khẩu cho nhiều dịch vụ.

## 2. Ưu tiên 2FA dạng ứng dụng
- SMS 2FA có nguy cơ bị SIM swap.
- Ưu tiên TOTP qua Google Authenticator, Microsoft Authenticator hoặc Passkey phần cứng.',
        TRUE, 2, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000403', v_p4,
        (SELECT id FROM public.competencies WHERE skill_code = '4.3' LIMIT 1),
        '04', '4.3',
        'Bảo vệ sức khỏe thể chất và tâm lý trong môi trường số',
        'Nguyên tắc 20-20-20 cho mắt, tư thế ngồi công thái học và kiểm soát thói quen Doomscrolling trên mạng xã hội.',
        15, 20,
        '# Sức khỏe thể chất & Tinh thần số

## 1. Quy tắc 20-20-20
Cứ sau 20 phút nhìn màn hình, hãy nhìn vào một vật thể cách xa 20 feet (khoảng 6 mét) trong vòng ít nhất 20 giây để mắt được thư giãn.

## 2. Cai nghiện số lành mạnh (Digital Detox)
- Tắt thông báo không khẩn cấp sau giờ làm việc.
- Giữ thiết bị điện tử ngoài phòng ngủ khi nghỉ ngơi.',
        TRUE, 3, 'FREE', NOW(), NOW()
    );

    -- 6. Modules for Path 5 (Domain 05)
    INSERT INTO public.learning_modules (id, path_id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, content_markdown, is_published, order_index, access_tier, created_at, updated_at)
    VALUES
    (
        'c0000000-0000-0000-0000-000000000501', v_p5,
        (SELECT id FROM public.competencies WHERE skill_code = '5.1' LIMIT 1),
        '05', '5.1',
        'Quy trình chẩn đoán và khắc phục sự cố kỹ thuật số',
        'Kỹ năng phân lập lỗi phần cứng/phần mềm, kiểm tra kết nối mạng DNS/IP, đọc thông báo lỗi và tra cứu giải pháp có cấu trúc.',
        20, 20,
        '# Phương pháp xử lý sự cố công nghệ có hệ thống

## 1. 4 Bước phân lập nguyên nhân
1. Tái hiện lỗi: Sự cố xảy ra khi nào, thao tác nào kích hoạt lỗi?
2. Phân lập phạm vi: Lỗi trên 1 thiết bị hay toàn mạng? Trên 1 trình duyệt hay tất cả?
3. Kiểm tra tầng vật lý/kết nối: Khởi động lại thiết bị, kiểm tra cáp mạng/Wi-Fi.
4. Tra cứu mã lỗi (Error Code): Sao chép chính xác dòng lỗi đưa vào công cụ tìm kiếm.

## 2. Ghi nhật ký lỗi
Ghi lại các bước đã thử để không lặp lại giải pháp không hiệu quả.',
        TRUE, 1, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000502', v_p5,
        (SELECT id FROM public.competencies WHERE skill_code = '5.2' LIMIT 1),
        '05', '5.2',
        'Lựa chọn công cụ số tối ưu theo bài toán thực tế',
        'Tiêu chí so sánh phần mềm: tính năng cốt lõi, khả năng tích hợp, chi phí sở hữu, mức độ bảo mật dữ liệu.',
        15, 20,
        '# Ma trận lựa chọn công cụ công nghệ

## 1. Tránh bẫy chạy theo công nghệ mới
Không phải công cụ nào mới nhất cũng phù hợp nhất. Cần bắt đầu từ điểm nghẽn thực tế của quy trình.

## 2. Tiêu chí đánh giá
- Tính tương thích: Có kết nối được với các hệ thống hiện có không?
- Độ dốc học tập (Learning curve): Đội ngũ mất bao lâu để sử dụng thành thạo?
- Khả năng xuất dữ liệu (Data Portability): Khi muốn đổi phần mềm có dễ lấy lại dữ liệu không?',
        TRUE, 2, 'FREE', NOW(), NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000503', v_p5,
        (SELECT id FROM public.competencies WHERE skill_code = '5.3' LIMIT 1),
        '05', '5.3',
        'Tự động hóa công việc thường nhật với công cụ số',
        'Xây dựng luồng tự động hóa cơ bản (Zapier, Make, Scripts), loại bỏ tác vụ lặp lại và tối ưu năng suất cá nhân.',
        20, 20,
        '# Ứng dụng tự động hóa giải phóng sức lao động

## 1. Khái niệm Trigger - Action
Mọi luồng tự động hóa đều hoạt động theo nguyên lý: KHI điều này xảy ra (Trigger) -> HÃY thực hiện điều kia (Action).

Ví dụ: Khi có sinh viên nộp bài thi -> Tự động gửi email xác nhận và cập nhật điểm vào trang tổng hợp.

## 2. Bắt đầu từ những việc nhỏ
Tự động hóa việc phân loại email, đồng bộ lịch công tác trước khi xây dựng hệ thống phức tạp.',
        TRUE, 3, 'FREE', NOW(), NOW()
    );

END $$;
