# QUY TẮC PHÁT TRIỂN & KỶ LUẬT KỸ THUẬT (DEVELOPMENT RULES)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-DEVELOPMENT-RULES`
- **Phiên bản:** `v3.2.0`
- **Đối tượng áp dụng:** Chủ nền tảng, Kỹ sư phát triển và các AI Coding Agents (Cursor, Cline, Antigravity, Claude Code)

---

## 1. SÁU QUY ƯỚC KIẾN TRÚC BẤT BIẾN (6 IMMUTABLE GUARDRAILS)

1. **Xác thực Đơn nhất qua Supabase Auth:**
   - Sử dụng duy nhất `@supabase/ssr` và PostgreSQL RLS trên toàn bộ 30 bảng CSDL. Không tự dựng hệ thống JWT thứ hai.
2. **Khử trùng lặp Biểu đồ Mạng nhện (`RadarChart.tsx`):**
   - Toàn bộ biểu đồ mạng nhện năng lực số dùng chung duy nhất component tại `src/components/charts/RadarChart.tsx`.
3. **Kiến trúc Zero-Shared Shell & Không có Footer trong Dashboard:**
   - Tách riêng hoàn toàn `Sidebar`, `Topbar`, `AvatarMenu` cho `Learner`, `Evaluator`, `Admin` tại `src/components/shared/`. Không đặt Footer trong vùng `(dashboard)` và không đặt ô tra cứu QR trên `PublicHeader` hay Landing Page.
4. **Dịch vụ Quyền riêng tư & Xuất dữ liệu An toàn (`privacy.service.ts`):**
   - Đặt tại `src/features/admin-governance/services/privacy.service.ts`, đảm bảo khử sạch PII trước khi gửi sang AI và trước khi xuất Bộ dữ liệu nghiên cứu (`Research Dataset Export`).
5. **Phân định Rõ ràng Global Types vs Feature Types:**
   - `src/types/` chỉ chứa: `database.types.ts`, `framework.types.ts` (định nghĩa cấu trúc Khung năng lực số động), và `common.types.ts`.
6. **Vai trò Tĩnh Bất biến (`1 Email = 1 Static Role`) & Khung Năng lực Động:**
   - Khách vãng lai đăng ký chọn `LEARNER` hoặc `EVALUATOR` sẽ gắn cố định vĩnh viễn với vai trò đó. Tài khoản `ADMIN` thuộc quyền sở hữu của Chủ nền tảng.
   - Không viết cứng số hiệu phiên bản khung năng lực lên giao diện; toàn bộ miền năng lực, kỹ năng và mô hình AI đều đọc động từ cấu hình CSDL.

---

## 2. QUY CHUẨN KIỂM SOÁT CHẤT LƯỢNG TỰ ĐỘNG (4 CI/CD QUALITY GATES)

Mọi thay đổi mã nguồn trước khi hợp nhất hoặc triển khai lên Production bắt buộc phải vượt qua 4 chốt chặn tự động:

1. **Chốt chặn 1 — Linter & Formatting (`npm run lint`):** 0 lỗi ESLint, không còn biến thừa hoặc vi phạm quy tắc React Hooks.
2. **Chốt chặn 2 — Kiểm tra Kiểu Nghiêm ngặt (`npx tsc --noEmit`):** 0 lỗi TypeScript ở chế độ `strict: true`, không sử dụng từ khóa `any`.
3. **Chốt chặn 3 — Kiểm thử Tự động (`npm test -- --coverage`):** 100% Unit Tests cho công thức tính điểm 4 hình thức, kiểm tra tổng Rubric = 100%, thuật toán cộng điểm (point) và Pipeline AI vượt qua với độ bao phủ các Domain Services $\ge 85\%$.
4. **Chốt chặn 4 — Đóng gói Sản xuất (`npm run build`):** Biên dịch thành công toàn bộ các Route của Next.js App Router mà không phát sinh lỗi thiếu biến môi trường.

---

## 3. QUY ƯỚC COMMIT & QUẢN LÝ PHIÊN BẢN (GIT WORKFLOW)

Tuân thủ chuẩn **Conventional Commits**:

- `feat(assessment): hỗ trợ 4 hình thức câu hỏi và phòng thi mở qua link/pin/qr`
- `feat(ai-gateway): tích hợp adapter đa mô hình và pipeline 2 lần gọi cho 5 ứng dụng AI`
- `feat(leaderboard): bổ sung cơ chế điểm tích lũy (point) và bảng xếp hạng top 100+`
- `feat(admin): bổ sung tính năng xuất bộ dữ liệu nghiên cứu ẩn danh ra csv/excel`
- `style(ui): áp dụng bảng màu tối giản monochrome slate và khử mùi AI`
