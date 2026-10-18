# QUY TRÌNH TRIỂN KHAI & TỰ ĐỘNG HÓA CI/CD (DEPLOYMENT SPECIFICATION)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-DEPLOYMENT`
- **Phiên bản:** `v3.2.0`
- **Hạ tầng triển khai:** Vercel (Next.js Edge & Serverless), Supabase Cloud (PostgreSQL 15+, Auth, Storage), Upstash Redis (Live Room, Auto-save, Leaderboard Cache)
- **Tự động hóa:** GitHub Actions CI/CD Pipeline

---

## 1. KIẾN TRÚC HẠ TẦNG TRIỂN KHAI PRODUCTION

```text
                       ┌─────────────────────────────────────────┐
                       │   NGƯỜI HỌC (B2C) / EVALUATOR / ADMIN   │
                       └────────────────────┬────────────────────┘
                                            │ HTTPS / Cloudflare DNS
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │           VERCEL EDGE NETWORK           │
                       │  • Next.js 16.3.5 App Router & RSC      │
                       │  • Middleware Static Role Guard         │
                       │  • RESTful API Route Handlers           │
                       └───────┬─────────────────────────┬───────┘
                               │                         │
          ┌────────────────────┴───┐                 ┌───┴────────────────────┐
          ▼                        ▼                 ▼                        ▼
┌──────────────────────┐ ┌──────────────────┐ ┌────────────────────┐ ┌──────────────────┐
│    SUPABASE CLOUD    │ │  UPSTASH REDIS   │ │ MULTI-MODEL AI API │ │ VIETQR GATEWAY   │
│ • PostgreSQL (30 tbl)│ │ • Phòng thi PIN  │ │ • Google Gemini    │ │ • QR Động        │
│ • 100% RLS Policies  │ │ • Auto-save 15s  │ │ • OpenAI (GPT-4o)  │ │ • Webhook HMAC   │
│ • Auth & File Storage│ │ • Top 100+ Cache │ │ • Anthropic Claude │ │   SHA-512        │
└──────────────────────┘ └──────────────────┘ └────────────────────┘ └──────────────────┘
```

---

## 2. PIPELINE TỰ ĐỘNG HÓA CI/CD (`.github/workflows/ci.yml`)

Kích hoạt tự động trên mọi nhánh khi tạo Pull Request hoặc đẩy mã nguồn lên nhánh `main`:

```yaml
name: NEXA Continuous Integration & Quality Gate

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout mã nguồn
        uses: actions/checkout@v4

      - name: Cài đặt Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Cài đặt thư viện phụ thuộc
        run: npm ci

      - name: Chốt chặn 1 - Kiểm tra ESLint
        run: npm run lint

      - name: Chốt chặn 2 - Kiểm tra kiểu TypeScript Strict
        run: npx tsc --noEmit

      - name: Chốt chặn 3 - Chạy Unit & Integration Tests (Coverage >= 85%)
        run: npm test -- --coverage

      - name: Chốt chặn 4 - Đóng gói thử nghiệm Production Build
        run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: [https://nexa.vn](https://nexa.vn)
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

---

## 3. CHIẾN LƯỢC MIGRATION CSDL KHÔNG GIÁN ĐOẠN (ZERO-DOWNTIME MIGRATIONS)

1. **Quản lý phiên bản Schema:** Toàn bộ 30 bảng vật lý, 5 Indexes hiệu năng, Trigger khóa vai trò tĩnh (`trg_lock_static_role`) và RLS Policies được lưu trữ tuần tự trong `supabase/migrations/`.
2. **Quy tắc tương thích ngược:**
   - Tuyệt đối không chạy lệnh `DROP TABLE` hoặc xóa cột đang hoạt động khi đang có phòng thi trực tiếp diễn ra.
   - Mọi cập nhật đối với Khung năng lực số được thực hiện thông qua cơ chế tạo phiên bản mới trong bảng `assessment_frameworks` thay vì sửa cấu trúc bảng vật lý.

---

## 4. KIỂM TRA SỨC KHỎE HỆ THỐNG (`/api/health`)

Hệ thống cung cấp endpoint giám sát trạng thái kết nối của Database, Redis và Nhà cung cấp AI đang kích hoạt:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseHealth, checkRedisHealth, checkActiveAiProviderHealth } from '@/lib/health';

export async function GET() {
  const [dbUp, redisUp, aiProviderStatus] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkActiveAiProviderHealth(),
  ]);

  const isHealthy = dbUp && redisUp && aiProviderStatus.isUp;

  return NextResponse.json(
    {
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: dbUp ? 'UP' : 'DOWN',
        redis: redisUp ? 'UP' : 'DOWN',
        aiGateway: {
          status: aiProviderStatus.isUp ? 'UP' : 'DOWN',
          activeProvider: aiProviderStatus.provider, // 'GEMINI' | 'OPENAI' | 'CLAUDE'
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
```
