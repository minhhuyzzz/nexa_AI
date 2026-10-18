# HỆ THỐNG THIẾT KẾ TỐI GIẢN KHOA HỌC (NEXA DESIGN SYSTEM)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-DESIGN-SYSTEM`
- **Phiên bản:** `v3.2.0` (Khử sạch "Mùi AI" — Áp dụng Quy tắc Màu 90-8-2 Monochrome & 1 Accent, Loại bỏ Gradient Tím & 5 Màu Cầu vồng)
- **Tiêu chuẩn thiết kế:** Clean Academic & Data-Driven SaaS (Lấy cảm hứng từ Linear, Stripe, Kaggle, Vercel)
- **Phông chữ chuẩn:** **Inter** (`font-sans`) & **JetBrains Mono** (`font-mono`) từ Google Fonts

---

## 1. TRIẾT LÝ THẨM MỸ: TẠI SAO VÀ LÀM SAO ĐỂ "KHỬ SẠCH MÙI AI"?

Một giao diện bị đánh giá là "mang tính AI cao" thường mắc 3 lỗi: (1) lạm dụng màu tím/indigo kết hợp dải màu chuyển sắc (gradient), (2) tô đủ 5–7 màu sắc sặc sỡ lên các thẻ trên cùng một màn hình, và (3) lạm dụng bóng đổ phát sáng (neon glow) cùng biểu tượng cảm xúc (emoji).

Để giao diện NEXA mang đẳng cấp của một nền tảng khảo thí & dữ liệu thực thụ, toàn bộ dự án tuân thủ nghiêm ngặt **Quy tắc Thị giác 90 - 8 - 2**:

1. **90% Trung tính Tinh khiết (Neutral Surfaces):** Toàn bộ nền trang, thẻ dữ liệu, bảng biểu và khung làm bài chỉ sử dụng màu Trắng (`#FFFFFF`), Xám giấy siêu nhạt (`#F8FAFC`) và đường viền xám mảnh (`1px solid #E2E8F0`).
2. **8% Tương phản Chữ Sắc nét (High-Contrast Ink):** Chữ tiêu đề và số liệu dùng màu Đen than chì (`#0F172A`), chữ mô tả phụ dùng màu Xám đá (`#475569`).
3. **2% Màu Nhấn Thương hiệu Duy nhất (Single Functional Accent):** Chỉ dùng duy nhất màu **Xanh Dương Học Thuật (`#0284C7` — Sky/Blue 600)** cho nút hành động chính (Primary CTA), trạng thái đang chọn trên Sidebar và đường vẽ trên biểu đồ Radar.
4. **Cấm tuyệt đối:**
   - ❌ Cấm dùng màu Tím Violet (`#7C3AED` / `#8B5CF6`) hay dải màu Gradient tím-xanh.
   - ❌ Cấm tô 5 màu cầu vồng khác nhau lên thẻ của 5 miền năng lực số (các miền năng lực được phân biệt bằng **Mã số học thuật `01` $\rightarrow$ `05` in bằng phông `JetBrains Mono`** trên nền xám trung tính `#F1F5F9`).
   - ❌ Cấm chèn Emoji (`🔥`, `🚀`, `⚡`, `🟢`) vào giao diện; 100% sử dụng biểu tượng nét mảnh chuẩn từ thư viện `lucide-react` (`strokeWidth={1.75}`).

---

## 2. BẢNG MÃ MÀU & DESIGN TOKENS CHUẨN (`globals.css`)

```css
:root {
  /* 1. Bề mặt & Nền (Light Mode - Sạch, Sáng, Phẳng) */
  --background: 0 0% 100%;          /* Trắng tinh khiết: #FFFFFF */
  --surface-muted: 210 40% 98%;     /* Nền phụ Dashboard: #F8FAFC (Slate 50) */
  --foreground: 222 47% 11%;        /* Chữ chính Đen than: #0F172A (Slate 900) */
  --muted-foreground: 215 16% 47%;  /* Chữ phụ Xám đá: #64748B (Slate 500) */

  /* 2. Khối Thẻ & Bảng (Card & Popover) */
  --card: 0 0% 100%;                /* #FFFFFF */
  --card-foreground: 222 47% 11%;   /* #0F172A */
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* 3. Màu Hành động Chính & Phụ (Không dùng Tím Indigo) */
  --primary: 200 98% 39%;           /* Xanh Học Thuật Chuẩn: #0284C7 (Sky 600) */
  --primary-foreground: 0 0% 100%;  /* Chữ trắng trên nút chính: #FFFFFF */
  --secondary: 210 40% 96%;         /* Nền nút phụ / Chip: #F1F5F9 (Slate 100) */
  --secondary-foreground: 222 47% 11%;

  /* 4. Viền & Ô nhập liệu (Crisp 1px Borders) */
  --border: 214 32% 91%;            /* Viền mảnh: #E2E8F0 (Slate 200) */
  --input: 214 32% 91%;
  --ring: 200 98% 39%;              /* Viền Focus: #0284C7 */

  /* 5. Màu Ngữ nghĩa (Chỉ dùng cho Chấm tròn trạng thái 6px & Nhãn nhỏ) */
  --status-high: 160 84% 39%;       /* Cờ Xanh / Đạt chuẩn: #10B981 (Emerald 600) */
  --status-medium: 38 92% 50%;      /* Cờ Cam / Cần rà soát: #F59E0B (Amber 600) */
  --status-low: 347 77% 50%;        /* Cờ Đỏ / Cảnh báo: #E11D48 (Rose 600) */

  /* 6. Bán kính bo góc chuẩn (Gọn, Nghiêm túc) */
  --radius: 0.375rem;               /* 6px (rounded-md) - Không bo tròn quá đà */
}

.dark {
  /* Chế độ Tối Trung tính (Neutral Zinc Dark - Không dùng xanh đen tím) */
  --background: 240 10% 6%;         /* Đen than dịu mắt: #0E0E11 */
  --surface-muted: 240 6% 10%;      /* #18181B */
  --foreground: 0 0% 96%;           /* #F4F4F5 */
  --muted-foreground: 240 5% 65%;   /* #A1A1AA */

  --card: 240 6% 10%;               /* #18181B */
  --card-foreground: 0 0% 96%;
  --popover: 240 6% 10%;
  --popover-foreground: 0 0% 96%;

  --primary: 199 89% 48%;           /* #0EA5E9 */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4% 16%;          /* #27272A */
  --secondary-foreground: 0 0% 96%;

  --border: 240 4% 18%;             /* #2E2E32 */
  --input: 240 4% 18%;
  --ring: 199 89% 48%;
}
```

---

## 3. HỆ THỐNG CHỮ VIẾT & CON SỐ KHOA HỌC (TYPOGRAPHY SYSTEM)

1. **Phông chữ Giao diện & Nội dung (`--font-sans: 'Inter'`):**
   - Hiển thị tiếng Việt rõ ràng, nghiêm túc, dễ đọc khi làm bài thi dài.
2. **Phông chữ Mã số, Điểm số & Dữ liệu (`--font-mono: 'JetBrains Mono'`):**
   - Bắt buộc áp dụng kèm thuộc tính `tabular-nums` cho:
     - Mã PIN phòng thi 6 số (`849 201`) và Mã nhóm (`K24DIG`).
     - Đồng hồ đếm ngược thời gian làm bài (`42:15`).
     - Mã kỹ năng năng lực số (`SKILL-1.2`, `DOMAIN-04`).
     - Điểm số Rubric, Điểm tích lũy (point) (`1,450 điểm (point)`), Thứ hạng (`#12`) và Mã băm chứng chỉ (`SHA-256`).

| Cấp độ chữ | Class Tailwind chuẩn | Kích thước / Dòng | Ứng dụng cụ thể |
| :--- | :--- | :--- | :--- |
| **Display Metric** | `text-3xl font-semibold tracking-tight font-mono tabular-nums` | `30px / 36px` | Điểm tổng kết quả, Mã PIN phòng thi trực tiếp |
| **Page Title (H1)** | `text-xl font-semibold tracking-tight text-foreground` | `20px / 28px` | Tiêu đề trang trong 3 Dashboard |
| **Section Title (H2)** | `text-base font-semibold text-foreground` | `16px / 24px` | Tiêu đề khối thẻ, tên phần thi |
| **Body Standard** | `text-sm font-normal leading-relaxed text-foreground` | `14px / 22px` | Nội dung câu hỏi, kịch bản tình huống, nhận xét |
| **Table / Label** | `text-xs font-medium text-muted-foreground` | `12px / 16px` | Tiêu đề cột bảng, nhãn phân loại kỹ năng |

---

## 4. QUY CHUẨN COMPONENT & ĐỒ THỊ (DATA-FIRST COMPONENTS)

### 4.1. Thẻ Dữ liệu & Nhãn Kỹ năng (Cards & Competency Tags)

- **Thẻ tiêu chuẩn (`Card`):** `bg-card border border-border rounded-md p-5 shadow-none`. Không dùng đổ bóng lớn (`shadow-lg`, `shadow-xl` bị cấm).
- **Nhãn Miền & Kỹ năng (`Competency Badge`):** Thiết kế đồng nhất một kiểu tinh gọn:

  ```tsx
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary text-foreground text-xs font-medium border border-border">
    <span className="font-mono text-muted-foreground">1.2</span>
    <span>Đánh giá dữ liệu</span>
  </span>
  ```

### 4.2. Chỉ báo Cờ Tin Cậy AI & Trạng thái (Minimalist Status Indicator)

Thay vì tô màu nền cả một hộp lớn gây rối mắt, các trạng thái và 3 Cờ tin cậy AI được hiển thị bằng **Chấm tròn `6px` (`w-1.5 h-1.5 rounded-full`)** đi kèm văn bản sắc nét:

- **Cờ Xanh ($\ge 0.85$):** Chấm tròn `bg-emerald-600` + chữ `text-foreground` (*"Độ tin cậy cao: 92%"*).
- **Cờ Cam ($0.70 - 0.84$):** Chấm tròn `bg-amber-500` + chữ `text-foreground` (*"Cần rà soát: 78%"*).
- **Cờ Đỏ ($< 0.70$):** Chấm tròn `bg-rose-600` + chữ `text-rose-700 font-medium` (*"Cần chấm thủ công: 62%"*).

### 4.3. Biểu đồ Mạng nhện Duy nhất (`src/components/charts/RadarChart.tsx`)

- Lưới đa giác nền màu xám mảnh (`#E2E8F0`).
- Đường năng lực hiện tại: Nét liền `2px` màu `--primary` (`#0284C7`), vùng tô trong suốt nhẹ `fill-sky-600/10`.
- Đường năng lực lần thi trước (khi bật chế độ so sánh tiến bộ `Pre/Post Diff`): Nét đứt `1.5px` màu xám đá (`#64748B`), không tô nền.
