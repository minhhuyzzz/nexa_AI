# TỔNG HỢP KIẾN TRÚC & QUYẾT ĐỊNH KỸ THUẬT (SYSTEM MEMORY & ARCHITECTURE DECISIONS)

- **Dự án:** NEXA — Nền tảng Đánh giá & Phát triển Năng lực Số (AI-Powered Digital Competency Assessment Platform)
- **Cập nhật lần cuối:** 21/10/2026
- **Trạng thái:** Đã kiểm định toàn bộ (14/14 tests pass, Type-safe 100%, Production Ready)

---

## 1. CƠ CHẾ ĐIỂM SỐ & TÍCH LŨY (SCORING & POINTS MECHANISM)

### 1.1. Thang điểm bài thi
- **Thang điểm chuẩn:** `10.0` (quy chuẩn tất cả bài khảo thí MCQ, Kịch bản tình huống, Thực hành).
- **Điểm đạt chuẩn hoàn thành:** Điểm bài thi $\ge 7.0 / 10.0$.

### 1.2. Điều kiện cộng Điểm Tích Lũy (Accumulated Points)
- **Điểm thưởng:** Mỗi bài thi đạt chuẩn cộng **+10 điểm tích lũy** vào tài khoản học viên (`profiles.points`).
- **Ràng buộc tin cậy (Confidence Gate):**
  - Bài thi phải có `confidenceScore >= 60%` (không có Cờ Đỏ).
  - Nếu `confidenceScore < 60%` (Cờ Đỏ vi phạm/nghi ngờ), hệ thống tạm khóa việc tự động cộng điểm và chuyển sang trạng thái chờ Người đánh giá (`EVALUATOR`) hoặc Quản trị viên (`ADMIN`) duyệt thủ công.

### 1.3. Hệ thống Cờ Tin Cậy (Confidence Flags)
- 🟢 **Cờ Xanh (`>= 85%`):** Độ tin cậy cao, tự động công nhận kết quả và cộng điểm.
- 🟡 **Cờ Vàng (`60% - 84%`):** Đạt ngưỡng chấp nhận, được cộng điểm nhưng có cảnh báo các tiêu chí cần cải thiện.
- 🔴 **Cờ Đỏ (`< 60%`):** Nghi vấn hoặc bài làm không khớp rubric/minh chứng, chặn tự động cộng điểm, bắt buộc người đánh giá thẩm định.

---

## 2. BIỂU ĐỒ RADAR NĂNG LỰC SỐ (COMPETENCY RADAR ENGINE)

- **Cơ chế tính toán:** Đọc động từ bảng `competency_domains` và lịch sử làm bài `assessment_submissions`.
- Điểm từng miền năng lực = Trung bình cộng điểm các kỹ năng thành phần thuộc miền đó.
- **Khoảng trống năng lực (Gaps):** Miền hoặc kỹ năng có điểm $< 60\%$ được hệ thống đánh dấu là khoảng trống cần bồi dưỡng, tự động liên kết học liệu và đề xuất lộ trình 4 bước cá nhân hóa.

---

## 3. HỆ THỐNG MÀU SẮC & GIAO DIỆN (PALETTE & DESIGN SYSTEM)

### 3.1. Bảng màu chuẩn
- **Nền chính:** Trắng `#FFFFFF` (`bg-white`) và Xám giấy nhạt `#F8FAFC` (`bg-slate-50`).
- **Chữ chính:** Đen than `#0F172A` (`text-slate-900`); Chữ phụ: Xám đá `#64748B` (`text-slate-500`).
- **Màu chủ đạo (Primary Accent):** Xanh Navy học thuật `#0284C7` (`bg-sky-600`).
- **Màu nhấn ấm áp (Warm Honey Amber):**
  - Primary Accent: `#ff9a27` (`--color-warm-accent`)
  - Background Tint: `#FEF3C7` (`--color-warm-light`)
  - Border Tone: `#FDE68A` (`--color-warm-border`)
  - Deep Text: `#92400E` (`--color-warm-foreground`)

### 3.2. Quy tắc giao diện bắt buộc
- **CẤM EMOJI TRONG JSX:** 100% sử dụng icon nét mảnh từ `lucide-react` (`strokeWidth={1.75}`).
- **Font chữ:** `Inter` cho văn bản giao diện; `JetBrains Mono` (`font-mono tabular-nums`) cho mã định danh, thứ hạng, điểm số.

---

## 4. BẢNG XẾP HẠNG & TÔN VINH TOP DẪN ĐẦU (`/learner/leaderboard`)

### 4.1. Khu vực Tôn vinh Top 3 (Distinction Showcase)
- **Bố cục 3 thẻ vinh danh phẳng hiện đại:**
  - **Hạng #1 (Quán Quân - Trung tâm):** Thẻ nổi bật nhất (`md:-translate-y-2`), viền vàng kim `#FDE68A`, ánh sáng ấm `#FEF3C7`/40, vương miện hoàng kim `Crown`, avatar viền kép mạ vàng kèm pin thứ hạng 1, tên in đậm và hộp tổng điểm âm bản màu hổ phách `#92400E`.
  - **Hạng #2 (Á Quân - Bên trái):** Thẻ bạch kim thanh lịch, huy hiệu bạc, avatar viền bạc và hộp tổng điểm xám slate.
  - **Hạng #3 (Quý Quân - Bên phải):** Thẻ đồng ấm, huy hiệu đồng, avatar viền hổ phách và hộp tổng điểm amber.
- Tuyệt đối không dùng các khối bệ xi măng cartoon hay clipart hoa lá sến rúa.

### 4.2. Bảng thành tích toàn hệ thống
- **Giữ đầy đủ các thứ hạng 1, 2, 3 và toàn bộ học viên tiếp theo** trong cùng một bảng thống nhất (không tách rời hay cắt bỏ top 3).
- Hiển thị avatar thật của từng học viên, tên, định hướng chuyên môn và tổng điểm tích lũy.
- Dòng của học viên đang đăng nhập được viền xanh dịu kèm nhãn `Bạn`.

### 4.3. Thẻ "Thứ hạng của bạn"
- Cố định ở cuối trang với avatar, thứ hạng hiện tại, tổng điểm và nút *"Làm bài tích điểm"* điều hướng về danh sách khảo thí.

---

## 5. QUẢN LÝ AVATAR & BẢO MẬT LƯU TRỮ (SUPABASE STORAGE)

### 5.1. Cơ chế lưu trữ kép (Dual-Storage Architecture)
1. **Cloud Storage (Supabase Storage bucket `avatars`):**
   - Đã tạo đầy đủ 4 chính sách bảo mật RLS trên bảng `storage.objects`:
     - `SELECT`: Public xem ảnh đại diện.
     - `INSERT`: Người dùng đã đăng nhập (`authenticated`) được phép tải ảnh lên.
     - `UPDATE` & `DELETE`: Người dùng quản lý ảnh của chính mình.
2. **PostgreSQL Fallback (`public.profiles.avatar_url`):**
   - Cột `avatar_url` lưu trực tiếp URL ảnh Storage hoặc chuỗi mã hóa Base64 Data URL (`data:image/jpeg;base64,...`) khi xảy ra sự cố mạng hoặc quyền hạn tạm thời, bảo đảm người dùng không bao giờ bị mất ảnh đại diện.

### 5.2. Đồng bộ Topbar Avatar Menu
- [LearnerAvatarMenu.tsx](file:///c:/nexa/src/components/dashboard/learner/LearnerAvatarMenu.tsx) được cấu hình ưu tiên gọi API `/api/learner/profile-stats` qua HTTP session cookie phía server, đảm bảo ảnh đại diện trên Topbar hiển thị đồng bộ tức thì, không bị rơi về chữ viết tắt `NX`.
