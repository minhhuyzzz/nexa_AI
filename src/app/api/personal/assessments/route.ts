import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const createAssessmentSchema = z.object({
  title: z.string().trim().min(2, 'Tên đề đánh giá phải có tối thiểu 2 ký tự'),
  description: z.string().trim().optional().default(''),
  duration_minutes: z.number().int().min(5).max(360).optional().default(45),
  passing_score: z.number().min(1).max(100).optional().default(70),
  domain_codes: z.array(z.string()).optional().default(['01']),
  organization_id: z.string().uuid().nullable().optional(),
});

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

    // Query user's assessments with authenticated client
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        passing_score,
        is_published,
        created_at,
        updated_at,
        assessment_items (
          id,
          type,
          points,
          competencies (
            skill_code,
            competency_domains (
              code,
              title
            )
          )
        )
      `)
      .or(`created_by.eq.${user.id},owner_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback: If owner_user_id or complex filter fails, try simple created_by filter
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('assessments')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          passing_score,
          is_published,
          created_at,
          updated_at,
          assessment_items (
            id,
            type,
            points,
            competencies (
              skill_code,
              competency_domains (
                code,
                title
              )
            )
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (fallbackError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminSupabase = createAdminClient();
        const { data: adminData, error: adminErr } = await adminSupabase
          .from('assessments')
          .select(`
            id,
            title,
            description,
            duration_minutes,
            passing_score,
            is_published,
            created_at,
            updated_at,
            assessment_items (
              id,
              type,
              points,
              competencies (
                skill_code,
                competency_domains (
                  code,
                  title
                )
              )
            )
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (adminErr) throw adminErr;
        return NextResponse.json({ success: true, assessments: adminData || [] });
      }

      if (fallbackError) {
        throw fallbackError;
      }

      return NextResponse.json({ success: true, assessments: fallbackData || [] });
    }

    return NextResponse.json({ success: true, assessments: assessments || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { title, description, duration_minutes, passing_score, organization_id } = parsed.data;

    // 1. Primary insert using authenticated client (adheres to RLS & security rules)
    let createdRecord = null;
    let lastError: Error | null = null;

    const { data: created, error: insertError } = await supabase
      .from('assessments')
      .insert({
        title,
        description,
        duration_minutes,
        passing_score,
        is_published: false,
        created_by: user.id,
        owner_user_id: user.id,
        organization_id: organization_id || null,
      })
      .select()
      .single();

    if (!insertError && created) {
      createdRecord = created;
    } else {
      lastError = insertError ? new Error(insertError.message) : null;

      // 2. Fallback to admin client if service role key is available
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminSupabase = createAdminClient();
        const { data: adminCreated, error: adminErr } = await adminSupabase
          .from('assessments')
          .insert({
            title,
            description,
            duration_minutes,
            passing_score,
            is_published: false,
            created_by: user.id,
            owner_user_id: user.id,
            organization_id: organization_id || null,
          })
          .select()
          .single();

        if (!adminErr && adminCreated) {
          createdRecord = adminCreated;
          lastError = null;
        } else if (adminErr) {
          lastError = new Error(adminErr.message);
        }
      }
    }

    if (lastError || !createdRecord) {
      console.error('Error inserting assessment:', lastError);
      throw lastError || new Error('Không thể tạo đề đánh giá');
    }

    return NextResponse.json({ success: true, assessment: createdRecord }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
