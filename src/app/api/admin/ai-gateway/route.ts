import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AIConfigService } from '@/features/ai-gateway/services/ai-config.service';

export const dynamic = 'force-dynamic';

const saveConfigSchema = z.object({
  provider: z.enum(['GOOGLE_GEMINI', 'ANTHROPIC_CLAUDE', 'OPENAI']).default('GOOGLE_GEMINI'),
  apiKey: z.string().optional(),
  defaultModel: z.string().min(1, 'Model không được để trống'),
  flows: z.object({
    rubricGrading: z.object({
      enabled: z.boolean(),
      model: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
    competencyAnalysis: z.object({
      enabled: z.boolean(),
      model: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
  }),
});

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key ? '********' : '';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền truy cập' }, { status: 403 });
    }

    const config = AIConfigService.getConfig();
    return NextResponse.json({
      success: true,
      config: {
        ...config,
        maskedApiKey: maskApiKey(config.apiKey),
        hasApiKey: Boolean(config.apiKey),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi đọc cấu hình AI Gateway';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền cập nhật' }, { status: 403 });
    }

    const body = await request.json();
    const validated = saveConfigSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu cấu hình không hợp lệ' },
        { status: 400 }
      );
    }

    const currentConfig = AIConfigService.getConfig();
    const payload = validated.data;

    // If apiKey is blank or masked, keep the existing one
    const newApiKey = payload.apiKey?.includes('...') || !payload.apiKey?.trim()
      ? currentConfig.apiKey
      : payload.apiKey.trim();

    const saved = AIConfigService.saveConfig({
      provider: payload.provider,
      apiKey: newApiKey,
      defaultModel: payload.defaultModel,
      flows: {
        rubricGrading: {
          ...currentConfig.flows.rubricGrading,
          ...payload.flows.rubricGrading,
        },
        competencyAnalysis: {
          ...currentConfig.flows.competencyAnalysis,
          ...payload.flows.competencyAnalysis,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu và áp dụng cấu hình AI Gateway thành công!',
      config: {
        ...saved,
        maskedApiKey: maskApiKey(saved.apiKey),
        hasApiKey: Boolean(saved.apiKey),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi cập nhật cấu hình AI Gateway';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
