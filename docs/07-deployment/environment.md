# ĐẶC TẢ BIẾN MÔI TRƯỜNG & CẤU HÌNH ĐA MÔ HÌNH AI (ENVIRONMENT CONFIGURATION)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-ENVIRONMENT`
- **Phiên bản:** `v3.2.0` (Hỗ trợ Cấu hình Đa Nhà Cung Cấp AI Linh Hoạt, Muối Băm Nghiên Cứu & Kiểm định Zod Runtime)
- **Tiêu chuẩn bảo mật:** Zero-Secret Leakage (Không rò rỉ khóa bí mật xuống trình duyệt)

---

## 1. MA TRẬN DANH MỤC BIẾN MÔI TRƯỜNG

### 1.1. Biến Môi trường Công khai Phía Trình duyệt (`NEXT_PUBLIC_*`)

| Tên biến | Bắt buộc | Mô tả & Giá trị mẫu |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | Có | Tên miền gốc để sinh Link phòng thi (`?pin=`), Link nhóm (`?join=`) và QR chứng chỉ (`/verify/[id]`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL kết nối dự án Supabase Cloud. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Khóa công khai Anon Key của Supabase (bảo vệ bởi RLS). |
| `NEXT_PUBLIC_APP_VERSION` | Không | Phiên bản ứng dụng hiển thị (mặc định: `v3.2.0`). |

### 1.2. Biến Bí mật Phía Máy chủ (`Server-Only Secrets` — Cấm dùng `NEXT_PUBLIC_`)

| Tên biến | Bắt buộc | Mô tả & Phạm vi sử dụng |
| :--- | :---: | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Khóa đặc quyền quản trị Supabase (chỉ dùng trong Webhook thanh toán và tác vụ hệ thống). |
| `DEFAULT_AI_PROVIDER` | Có | Nhà cung cấp AI mặc định khi khởi tạo (`GEMINI`, `OPENAI`, hoặc `CLAUDE`). |
| `GEMINI_API_KEY` | Có* | API Key kết nối Google Gemini (`gemini-2.5-flash` / `pro`). |
| `OPENAI_API_KEY` | Tùy chọn | API Key kết nối OpenAI (`gpt-4o` / `gpt-4o-mini`) khi Admin chuyển sang OpenAI. |
| `ANTHROPIC_API_KEY` | Tùy chọn | API Key kết nối Anthropic Claude (`claude-3-5-sonnet`) khi Admin chuyển sang Claude. |
| `UPSTASH_REDIS_REST_URL` | Có | URL kết nối Upstash Redis (Phòng thi trực tiếp, Auto-save 15s, Cache Top 100+ Leaderboard). |
| `UPSTASH_REDIS_REST_TOKEN` | Có | Token xác thực Upstash Redis. |
| `VIETQR_CLIENT_ID` | Có | Client ID cổng thanh toán VietQR. |
| `VIETQR_API_KEY` | Có | API Key tạo mã VietQR động nâng cấp gói dịch vụ. |
| `VIETQR_WEBHOOK_SECRET` | Có | Khóa bí mật kiểm tra chữ ký `HMAC-SHA512` của Webhook thanh toán. |
| `CREDENTIAL_HASH_SALT` | Có | Chuỗi muối bí mật dùng để băm `data_hash` SHA-256 bảo vệ toàn vẹn chứng chỉ số. |
| `RESEARCH_EXPORT_SALT` | Có | Chuỗi muối bí mật dùng để ẩn danh hóa mã người học khi Admin xuất Bộ dữ liệu nghiên cứu. |

---

## 2. XÁC THỰC BIẾN MÔI TRƯỜNG LÚC KHỞI ĐỘNG (`src/config/env.ts`)

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    DEFAULT_AI_PROVIDER: z.enum(['GEMINI', 'OPENAI', 'CLAUDE']).default('GEMINI'),
    GEMINI_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),

    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    VIETQR_CLIENT_ID: z.string().min(1),
    VIETQR_API_KEY: z.string().min(1),
    VIETQR_WEBHOOK_SECRET: z.string().min(16),

    CREDENTIAL_HASH_SALT: z.string().min(16),
    RESEARCH_EXPORT_SALT: z.string().min(16),
  })
  .refine(
    (data) => {
      if (data.DEFAULT_AI_PROVIDER === 'GEMINI') return Boolean(data.GEMINI_API_KEY);
      if (data.DEFAULT_AI_PROVIDER === 'OPENAI') return Boolean(data.OPENAI_API_KEY);
      if (data.DEFAULT_AI_PROVIDER === 'CLAUDE') return Boolean(data.ANTHROPIC_API_KEY);
      return false;
    },
    {
      message: 'Thiếu API Key tương ứng với nhà cung cấp DEFAULT_AI_PROVIDER đã chọn!',
    }
  );

export const env = envSchema.parse(process.env);
```

---

## 3. MẪU TỆP `.env.example` CHUẨN

```env
# 1. Public Site & Supabase
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Pluggable Multi-Model AI Gateway (Gemini / OpenAI / Claude)
DEFAULT_AI_PROVIDER=GEMINI
GEMINI_API_KEY=AIzaSyYourGeminiKeyHere
OPENAI_API_KEY=sk-proj-optional-openai-key
ANTHROPIC_API_KEY=sk-ant-optional-claude-key

# 3. Upstash Redis (Live PIN Room, Auto-save 15s & Leaderboard Top 100+ Cache)
UPSTASH_REDIS_REST_URL=[https://your-redis.upstash.io](https://your-redis.upstash.io)
UPSTASH_REDIS_REST_TOKEN=AYourUpstashTokenHere

# 4. VietQR Payment & Security Salts
VIETQR_CLIENT_ID=your-vietqr-client-id
VIETQR_API_KEY=your-vietqr-api-key
VIETQR_WEBHOOK_SECRET=your-hmac-sha512-webhook-secret-key
CREDENTIAL_HASH_SALT=nexa-credential-sha256-secret-salt-2026
RESEARCH_EXPORT_SALT=nexa-research-anonymization-salt-2026
```
