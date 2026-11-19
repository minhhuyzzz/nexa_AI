# Kế hoạch Triển khai: Tái Cấu Trúc Toàn Diện Phân Hệ Quản Trị Hệ Thống (Settings, Audit Logs & AI Gateway)

## 1. Mục tiêu tổng thể
Tái thiết kế toàn diện 3 trang quản trị cấp hệ thống thuộc phân hệ **Hệ thống và bảo mật** của Platform Admin:
1. **Cài đặt nền tảng (`/admin/settings`):** Tinh giản về các tham số vận hành và điểm thưởng PTS thực tế; loại bỏ các quy định hạ tầng và khảo thí thừa thãi.
2. **Nhật ký kiểm toán (`/admin/compliance`):** Tái định vị 100% thành **Admin Audit Trail** chuyên nghiệp đọc trực tiếp từ bảng `admin_audit_logs`. Xóa sạch dữ liệu giả và thuật ngữ Nghị định 13 lạc đề.
3. **Cổng kết nối AI (`/admin/ai-gateway`):** Tinh gọn giao diện, giữ 4 chỉ số KPI thực tế từ `ai_usage_events`, bảng Telemetry Logs thực, và 1 bộ cấu hình Model/Provider duy nhất (Gemini, ChatGPT, DeepSeek, Claude) kèm tùy chọn API Key ngoài.

---

## 2. Phân tích phụ thuộc (Dependency Graph)
```
Database & Services
  ├── Supabase tables: system_settings, admin_audit_logs, ai_usage_events
  ├── PointLedgerService (src/features/gamification/services/point-ledger.service.ts)
  └── admin-audit.service (src/lib/audit/admin-audit.service.ts)
          │
          ▼
API Endpoints
  ├── /api/admin/settings (GET / POST)
  ├── /api/admin/audit-logs (GET with search, filter, pagination)
  └── /api/admin/ai-gateway (GET / POST)
          │
          ▼
Frontend Admin Pages (Tailwind CSS, Dark/Light, Borderless SaaS)
  ├── /admin/settings/page.tsx
  ├── /admin/compliance/page.tsx
  └── /admin/ai-gateway/page.tsx
```

---

## 3. Các giai đoạn triển khai (Vertical Slicing)

### Giai đoạn 1: Cài đặt nền tảng (`/admin/settings`)
- Mở rộng API `/api/admin/settings` hỗ trợ: `dailyLoginPts`, `streakMilestonePts`, `contributionApprovedPts`, `maintenanceMode`, `systemTimezone`, `dateTimeFormat`, `platformName`, `supportEmail`.
- Kết nối `src/app/api/personal/profile-stats/route.ts` để đọc cấu hình `dailyLoginPts` từ `system_settings` (hoặc fallback 1).
- Tái cấu trúc UI `src/app/(dashboard)/admin/settings/page.tsx` thành 3 khối Card SaaS sạch sẽ. Xóa bỏ hoàn toàn upload size, session timeout, ngưỡng 70%, toggle kiểm duyệt đề.

### Giai đoạn 2: Nhật ký kiểm toán thao tác quản trị (`/admin/compliance`)
- Tối ưu API `/api/admin/audit-logs` bổ sung tìm kiếm theo từ khóa, lọc theo `action`, `target_type`, `period`.
- Tái thiết kế UI `src/app/(dashboard)/admin/compliance/page.tsx` hiển thị đúng nhật ký thao tác thực tế từ `admin_audit_logs`, thanh thống kê hoạt động, bộ lọc đa năng và modal xem chi tiết JSON payload.

### Giai đoạn 3: Cổng kết nối AI (`/admin/ai-gateway`)
- Cập nhật API `/api/admin/ai-gateway` hỗ trợ cấu hình đơn giản hóa (Provider: Gemini / OpenAI / DeepSeek / Claude, Model name, optional API key).
- Tinh giản UI `src/app/(dashboard)/admin/ai-gateway/page.tsx`: 4 thẻ KPI thực tế (Lượt gọi, Tokens, Độ trễ TB, Tỷ lệ thành công), Khối cấu hình Model/Provider toàn sàn, và Bảng Telemetry Logs thực tế từ `ai_usage_events`.

### Giai đoạn 4: Kiểm thử, Tối ưu & Bàn giao
- Kiểm tra toàn bộ TypeScript (`npm run typecheck`).
- Chạy toàn bộ test suites (`npx vitest run`).
- Bàn giao và sẵn sàng đồng bộ GitHub.
