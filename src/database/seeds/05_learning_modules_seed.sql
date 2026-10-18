-- ==============================================================================
-- NEXA SEED DATA 05: LEARNING MODULES FOR 5 DIGCOMP DOMAINS (+30 POINTS EACH)
-- ==============================================================================

DO $$
DECLARE
    v_c11 UUID; v_c12 UUID; v_c21 UUID; v_c22 UUID;
    v_c31 UUID; v_c32 UUID; v_c41 UUID; v_c42 UUID;
    v_c51 UUID; v_c52 UUID;
BEGIN
    SELECT id INTO v_c11 FROM public.competencies WHERE skill_code = '1.1' LIMIT 1;
    SELECT id INTO v_c12 FROM public.competencies WHERE skill_code = '1.2' LIMIT 1;
    SELECT id INTO v_c21 FROM public.competencies WHERE skill_code = '2.1' LIMIT 1;
    SELECT id INTO v_c22 FROM public.competencies WHERE skill_code = '2.2' LIMIT 1;
    SELECT id INTO v_c31 FROM public.competencies WHERE skill_code = '3.1' LIMIT 1;
    SELECT id INTO v_c32 FROM public.competencies WHERE skill_code = '3.2' LIMIT 1;
    SELECT id INTO v_c41 FROM public.competencies WHERE skill_code = '4.1' LIMIT 1;
    SELECT id INTO v_c42 FROM public.competencies WHERE skill_code = '4.2' LIMIT 1;
    SELECT id INTO v_c51 FROM public.competencies WHERE skill_code = '5.1' LIMIT 1;
    SELECT id INTO v_c52 FROM public.competencies WHERE skill_code = '5.2' LIMIT 1;

    -- Module 1: Miền 1 - Đánh giá độ tin cậy dữ liệu & Nhận diện Deepfake
    INSERT INTO public.learning_modules (
        id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, order_index, content_markdown
    ) VALUES (
        'd0000000-0000-0000-0000-000000000001',
        v_c12, 'DOMAIN_1', '1.2',
        'Phương pháp Thẩm định Nguồn tin Số & Phát hiện Deepfake AI',
        'Trang bị kỹ thuật đối soát chéo (lateral reading), kiểm tra dấu vết siêu dữ liệu (metadata EXIF) và nhận diện tín hiệu bất thường trong âm thanh, hình ảnh do AI tạo sinh.',
        20, 30, 1,
        '# Thẩm định Nguồn tin Số & Nhận diện Deepfake

## 1. Nguyên tắc Lateral Reading (Đọc mở rộng ngang)
Thay vì chỉ đọc chìm sâu trên một trang web duy nhất, chuyên gia số mở nhiều tab song song để xác minh độ uy tín của tổ chức công bố thông tin.

## 2. Dấu vết nhận diện nội dung Deepfake
- **Biến dạng quang học:** Mắt chớp không tự nhiên, bóng đổ ánh sáng trên khuôn mặt không khớp với nguồn sáng môi trường.
- **Biên giới cổ và tóc:** Vùng tiếp giáp giữa cằm, cổ hoặc viền tóc thường có hiện tượng mờ nhòe (blur) hoặc giật khung hình.
- **Tần số âm thanh:** Giọng nói tổng hợp AI thường thiếu ngữ điệu cảm xúc tự nhiên hoặc có tạp âm tần số cao ở đuôi âm tiết.

## 3. Căn cứ pháp lý theo Nghị định 13/2023/NĐ-CP
Nghiêm cấm hành vi sử dụng công nghệ số và trí tuệ nhân tạo để giả mạo danh tính, xuyên tạc dữ liệu cá nhân của công dân.'
    ) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

    -- Module 2: Miền 4 - Tuân thủ Nghị định 13/2023 & Ứng phó sự cố dữ liệu 72 giờ
    INSERT INTO public.learning_modules (
        id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, order_index, content_markdown
    ) VALUES (
        'd0000000-0000-0000-0000-000000000002',
        v_c42, 'DOMAIN_4', '4.2',
        'Quy trình Khẩn cấp 72 Giờ Ứng phó Lộ lọt Dữ liệu Cá nhân',
        'Nắm vững nghĩa vụ thông báo cho Cục An ninh mạng (Bộ Công an) trong 72 giờ, kỹ thuật cô lập hệ thống nhiễm độc và truyền thông minh bạch với khách hàng.',
        25, 30, 2,
        '# Quy trình 72 Giờ Ứng phó Sự cố Lộ lọt Dữ liệu (NĐ 13/2023)

## Giờ 0 - 6: Cách ly Kỹ thuật Khẩn cấp
1. Thu hồi toàn bộ Access Tokens và API Keys của dịch vụ lưu trữ bị xâm nhập.
2. Cách ly máy chủ nhiễm độc khỏi mạng nội bộ để bảo toàn bằng chứng số phục vụ điều tra forensics.
3. Kích hoạt hạ tầng dự phòng sạch (Clean Standby Infrastructure).

## Giờ 6 - 48: Thông báo Cơ quan Quản lý Nhà nước
Căn cứ Điều 23 Nghị định 13/2023/NĐ-CP, Bên Kiểm soát và Xử lý dữ liệu cá nhân phải gửi văn bản báo cáo cho **Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05 - Bộ Công an)** chậm nhất 72 giờ kể từ khi phát hiện sự cố.

## Giờ 48 - 72: Thông báo Cá nhân Chủ thể Dữ liệu
Thông báo trực tiếp cho các cá nhân bị ảnh hưởng qua email/kênh liên lạc chính thức, hướng dẫn đổi mật khẩu và cảnh báo các hành vi lừa đảo giả mạo liên quan.'
    ) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

    -- Module 3: Miền 3 - Bản quyền số Creative Commons & Thiết kế trực quan
    INSERT INTO public.learning_modules (
        id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, order_index, content_markdown
    ) VALUES (
        'd0000000-0000-0000-0000-000000000003',
        v_c32, 'DOMAIN_3', '3.2',
        'Bản quyền Số, Giấy phép Creative Commons & Tái sử dụng Tài nguyên AI',
        'Hiểu rõ các giấy phép CC BY, CC BY-SA, CC BY-NC và cách trích dẫn bản quyền chuẩn mực khi tích hợp nội dung sinh bởi AI vào sản phẩm số.',
        20, 30, 3,
        '# Giấy phép Bản quyền Số Creative Commons & AI

## 1. Hệ thống Giấy phép Creative Commons (CC)
- **CC BY (Ghi nhận công lao):** Cho phép tự do sao chép, phối trộn kể cả thương mại miễn là trích dẫn tác giả gốc.
- **CC BY-SA (Chia sẻ tương tự):** Tác phẩm phái sinh phải áp dụng cùng giấy phép với tác phẩm gốc.
- **CC BY-NC (Phi thương mại):** Chỉ được sử dụng cho mục đích học tập, nghiên cứu phi thương mại.
- **CC0 (Phạm vi công cộng):** Tác giả từ bỏ mọi quyền sở hữu trí tuệ, toàn quyền sử dụng.

## 2. Trách nhiệm bản quyền đối với Nội dung do AI tạo sinh
Sản phẩm tạo ra từ AI cần được công bố rõ ràng công cụ sử dụng (Prompt + Model version) và không được vi phạm bản quyền dữ liệu huấn luyện.'
    ) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

    -- Module 4: Miền 2 - Netiquette & Ứng xử Văn minh Không gian Mạng
    INSERT INTO public.learning_modules (
        id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, order_index, content_markdown
    ) VALUES (
        'd0000000-0000-0000-0000-000000000004',
        v_c21, 'DOMAIN_2', '2.1',
        'Chuẩn mực Netiquette & Tương tác Chuyên nghiệp Đa nền tảng Số',
        'Xây dựng phong cách giao tiếp số văn minh, quản lý danh tiếng cá nhân và bảo mật luồng trao đổi công việc trong môi trường trực tuyến.',
        15, 30, 4,
        '# Chuẩn mực Netiquette trong Kỷ nguyên Số

## 1. Quy tắc cốt lõi: Con người ở phía bên kia màn hình
Mọi thông điệp số đều gửi tới con người thật. Tránh ngôn ngữ công kích cá nhân (flaming), tôn trọng thời gian và băng thông của người nhận.

## 2. Bảo mật khi giao tiếp nhóm
Tuyệt đối không chia sẻ ảnh chụp màn hình chứa dữ liệu nhạy cảm của tổ chức hoặc thông tin khách hàng lên các nhóm mạng xã hội công cộng.'
    ) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

    -- Module 5: Miền 5 - Tư duy Giải quyết Sự cố & Tự học Nâng cao Năng lực Số
    INSERT INTO public.learning_modules (
        id, competency_id, domain_code, skill_code, title, description, duration_minutes, point_reward, order_index, content_markdown
    ) VALUES (
        'd0000000-0000-0000-0000-000000000005',
        v_c52, 'DOMAIN_5', '5.2',
        'Chiến lược Tự khắc phục Lỗ hổng Kỹ năng Số & Cập nhật Công nghệ Mới',
        'Phương pháp chẩn đoán khoảng trống năng lực, thiết lập mục tiêu SMART và khai thác kho học liệu mở (OER) để duy trì sự thích ứng liên tục.',
        20, 30, 5,
        '# Chiến lược Nâng cao Năng lực Số Cá nhân

## 1. Chẩn đoán Khoảng trống Năng lực (Competency Gap)
Sử dụng biểu đồ Radar trên NEXA để xác định các kỹ năng đạt dưới 60%. Đây là những điểm nghẽn cản trở hiệu suất làm việc số của bạn.

## 2. Lập kế hoạch học tập 4 bước
Tập trung cải thiện 1 kỹ năng yếu nhất trong 7 ngày, thực hành bài tập tình huống và đánh giá lại (Re-take) để nhận chứng nhận tiến bộ.'
    ) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

END $$;
