# Ý định Kiến trúc: Tối ưu Chịu tải Phòng Live & Đồng bộ Thời lượng Ca thi

> **Ngày thực hiện:** 15/11/2026  
> **Mục tiêu:** Đồng bộ thời lượng phòng thi tùy chỉnh, chuyển danh sách sảnh chờ sang Supabase Realtime Presence để triệt tiêu khuyếch đại truy vấn $O(N^2)$, và phân tán đỉnh tải nộp bài bằng Random Jitter.

---

## 1. Bối cảnh & Vấn đề giải quyết

1. **Lệch thời lượng làm bài:** Khi giám thị tạo phòng chọn 15p, 30p, hoặc 60p, giá trị được lưu trong JSONB `results_publish_settings.duration_minutes`. Tuy nhiên `/api/rooms/status` và `/api/rooms/join` lại đọc từ `rawAssessment.duration_minutes` (45p mặc định), khiến thí sinh và sảnh chờ hiển thị sai mốc thời gian.
2. **Khuyếch đại truy vấn $O(N^2)$ ở Sảnh chờ:** Thí sinh và Giám thị duy trì polling 3-3.5 giây/lần. Khi 1 người mới vào phòng, tín hiệu Broadcast khiến $N$ client cùng lúc gửi $N$ HTTP requests về máy chủ và dội hàng trăm truy vấn vào PostgreSQL.
3. **Thundering Herd khi Hết giờ:** Khi đồng hồ đếm ngược điểm về 0, toàn bộ thí sinh cùng lúc nộp bài vào mili-giây thứ 0, gây nghẽn Connection Pool của database.

---

## 2. Các thay đổi kỹ thuật (Implementation)

### 2.1. Đồng bộ thời lượng phòng thi chuẩn xác
* **`src/app/api/rooms/status/route.ts`:** Ưu tiên đọc `Number(room.results_publish_settings?.duration_minutes) || rawAssessment?.duration_minutes || 45`.
* **`src/app/api/rooms/join/route.ts`:** Bổ sung `results_publish_settings, theme_id` vào câu lệnh SELECT, trả về `durationMinutes` và `themeId` chính xác của phòng.
* **`src/app/(dashboard)/personal/take/[id]/page.tsx`:** Nhận `durationMinutes` từ phòng thi để gán cho `totalSec = Number(roomData.room.durationMinutes) * 60`.

### 2.2. Supabase Realtime Presence (Sảnh chờ Zero-DB Polling)
* **`src/app/live/waiting-room/page.tsx`:**
  - Client thí sinh gọi `channel.track({ userId, fullName, initials, avatarUrl, isReady, status: 'WAITING' })`.
  - Lắng nghe `channel.on('presence', { event: 'sync' })`, `channel.on('presence', { event: 'join' })`, `channel.on('presence', { event: 'leave' })`.
  - Đồng bộ danh sách bong bóng thí sinh trực tiếp từ bộ nhớ Realtime WebSocket mà không gọi HTTP request.
  - Loại bỏ các lệnh `fetchStatus()` dồn dập trong broadcast handlers.
  - Giãn polling dự phòng từ 3 giây lên 12 giây (giảm 75% tải nền).
* **`src/app/live/control/page.tsx`:**
  - Giám thị nhận danh sách thí sinh kết nối qua `presence.sync` tức thì.
  - Loại bỏ các lệnh `fetchRoomState(true)` dồn dập khi có thí sinh join/leave/ready.
  - Giãn polling dự phòng từ 3.5 giây lên 12 giây.

### 2.3. Random Jitter khi Hết giờ Nộp bài Tự động
* **`src/app/(dashboard)/personal/take/[id]/page.tsx`:**
  - Khi đếm ngược hết giờ (`timeRemaining <= 1`), áp dụng độ trễ ngẫu nhiên: `jitterMs = roomId ? Math.floor(Math.random() * 2000) : 0`.
  - Giúp phân tán tải nộp bài đều trong khoảng 0 đến 2 giây, triệt tiêu xung đột ghi database và nghẽn Connection Pool.

---

## 3. Kết quả Kiểm thử & Xác minh

* **Typecheck:** `npm run typecheck` $\rightarrow$ 0 lỗi (`clean`).
* **Test Suite:** `npx vitest run` $\rightarrow$ **92/92 test files PASSED, 1.454/1.454 tests PASSED 100%**.
* **Knowledge Graph:** `graphify update .` cập nhật thành công (9.853 nodes, 19.892 edges).
