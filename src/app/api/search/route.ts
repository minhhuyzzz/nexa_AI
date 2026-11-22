import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { COMPETENCY_STATION_DOCS } from '@/features/learning-paths/data/competency-station-docs';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { getOrgAuthContext } from '@/lib/auth/org-guard';

export const dynamic = 'force-dynamic';

export interface PopularTagItem {
  id: string;
  name: string;
  count?: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'assessment' | 'learning_station' | 'class' | 'member' | 'campaign' | 'user' | 'organization' | 'action';
  categoryLabel: string;
  href: string;
  badge?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get('q') || '';
    const query = rawQ.trim();
    const scope = (searchParams.get('scope') || 'personal') as 'personal' | 'org' | 'admin';
    const orgSlug = (searchParams.get('orgSlug') || searchParams.get('orgId') || '').trim();

    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const results: SearchResultItem[] = [];
    let popularTags: PopularTagItem[] = [];

    // =========================================================================
    // 1. PERSONAL DASHBOARD SEARCH & SUGGESTIONS
    // =========================================================================
    if (scope === 'personal') {
      if (!query) {
        // Suggestions: Top standard published assessments from Admin Bank (same as /personal/assessments)
        const { data: topAssessments } = await adminSupabase
          .from('assessments')
          .select('id, title, duration_minutes, total_questions, passing_score, created_at')
          .eq('is_published', true)
          .is('organization_id', null)
          .order('created_at', { ascending: false })
          .limit(5);

        (topAssessments || []).forEach((asm) => {
          results.push({
            id: asm.id,
            title: asm.title,
            subtitle: `Thời lượng: ${asm.duration_minutes || 45} phút • Chuẩn đạt: ≥${asm.passing_score || 70}%`,
            category: 'assessment',
            categoryLabel: 'Đề thịnh hành',
            href: `/personal/assessments/${asm.id}`,
            badge: 'Thịnh hành',
          });
        });

        // Popular Tags for quick discovery (similar to Kaggle)
        try {
          const { data: dbDomains } = await adminSupabase
            .from('competency_domains')
            .select('id, title')
            .order('domain_index', { ascending: true })
            .limit(6);

          if (dbDomains && dbDomains.length > 0) {
            popularTags = dbDomains.map((d: any, idx: number) => ({
              id: d.id || `tag-${idx}`,
              name: d.title,
              count: (6 - idx) * 24 + 18,
            }));
          }
        } catch {
          // fallback
        }

        if (popularTags.length === 0) {
          popularTags = [
            { id: 'tag-1', name: 'Thông tin & Dữ liệu số', count: 142 },
            { id: 'tag-2', name: 'An toàn & Bảo mật số', count: 118 },
            { id: 'tag-3', name: 'Giao tiếp & Cộng tác', count: 95 },
            { id: 'tag-4', name: 'Sáng tạo Nội dung số', count: 82 },
            { id: 'tag-5', name: 'Trí tuệ nhân tạo (AI)', count: 76 },
            { id: 'tag-6', name: 'Giải quyết Sự cố số', count: 54 },
          ];
        }
      } else {
        // Active search: Assessments
        const { data: matchedAsms } = await adminSupabase
          .from('assessments')
          .select('id, title, duration_minutes, total_questions, passing_score')
          .eq('is_published', true)
          .is('organization_id', null)
          .ilike('title', `%${query}%`)
          .limit(5);

        (matchedAsms || []).forEach((asm) => {
          results.push({
            id: asm.id,
            title: asm.title,
            subtitle: `Thời lượng: ${asm.duration_minutes || 45} phút • Chuẩn đạt: ≥${asm.passing_score || 70}%`,
            category: 'assessment',
            categoryLabel: 'Bài Khảo Thí',
            href: `/personal/take/${asm.id}`,
            badge: `${asm.duration_minutes || 45}m`,
          });
        });

        // Active search: Competency Stations
        const lowerQ = query.toLowerCase();
        const matchedStations = Object.values(COMPETENCY_STATION_DOCS).filter(
          (doc) =>
            doc.title.toLowerCase().includes(lowerQ) ||
            doc.skillCode.includes(lowerQ) ||
            doc.domainTitle.toLowerCase().includes(lowerQ)
        );

        matchedStations.slice(0, 3).forEach((doc) => {
          results.push({
            id: `station-${doc.skillCode}`,
            title: doc.title,
            subtitle: doc.domainTitle,
            category: 'learning_station',
            categoryLabel: 'Trạm Năng Lực',
            href: `/personal/learning-path/docs/${encodeURIComponent(doc.skillCode)}`,
            badge: `Trạm ${doc.skillCode}`,
          });
        });

        // Active search: User's Classes / Groups (if logged in)
        if (user) {
          const { data: matchedClasses } = await adminSupabase
            .from('evaluator_classes')
            .select('id, name, class_code, user_id, organization_id')
            .is('organization_id', null)
            .or(`user_id.eq.${user.id}`)
            .ilike('name', `%${query}%`)
            .limit(3);

          (matchedClasses || []).forEach((cls) => {
            results.push({
              id: cls.id,
              title: cls.name,
              subtitle: `Mã lớp: ${cls.class_code}`,
              category: 'class',
              categoryLabel: 'Lớp & Nhóm Cá Nhân',
              href: `/personal/groups/${cls.id}`,
              badge: cls.class_code,
            });
          });
        }
      }

      return NextResponse.json({
        success: true,
        isSuggestions: !query,
        query,
        scope,
        results,
        popularTags: !query ? popularTags : [],
      });
    }

    // =========================================================================
    // 2. ORGANIZATION DASHBOARD SEARCH & SUGGESTIONS
    // =========================================================================
    if (scope === 'org') {
      if (!orgSlug) {
        return NextResponse.json({ success: false, error: 'Thiếu mã định danh tổ chức (orgSlug)' }, { status: 400 });
      }

      const orgAuth = await getOrgAuthContext(orgSlug);
      if (!orgAuth || !orgAuth.isAuthorized) {
        return NextResponse.json({ error: 'Không có quyền truy cập tổ chức' }, { status: 403 });
      }

      const orgId = orgAuth.organization.id;

      if (!query) {
        // Suggestions: Active classes in org
        const { data: activeClasses } = await adminSupabase
          .from('evaluator_classes')
          .select('id, name, class_code, status')
          .eq('organization_id', orgId)
          .neq('status', 'ARCHIVED')
          .order('created_at', { ascending: false })
          .limit(4);

        (activeClasses || []).forEach((c) => {
          results.push({
            id: c.id,
            title: c.name,
            subtitle: `Mã lớp: ${c.class_code}`,
            category: 'class',
            categoryLabel: 'Lớp Học',
            href: `/org/${orgSlug}/classes/${c.id}`,
            badge: c.class_code,
          });
        });

        // Active assessment campaigns
        const { data: activeCampaigns } = await adminSupabase
          .from('assessment_campaigns')
          .select('id, title, status, start_time, end_time')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(3);

        (activeCampaigns || []).forEach((camp) => {
          results.push({
            id: camp.id,
            title: camp.title,
            subtitle: `Trạng thái: ${camp.status || 'Hoạt động'}`,
            category: 'campaign',
            categoryLabel: 'Đợt Khảo Thí',
            href: `/org/${orgSlug}/campaigns`,
            badge: camp.status || 'Hoạt động',
          });
        });
      } else {
        // Active search: Members / Students in org
        const { data: matchedMembers } = await adminSupabase
          .from('organization_members')
          .select(`
            id,
            user_id,
            student_id,
            org_role,
            profiles (
              id,
              full_name,
              email
            )
          `)
          .eq('organization_id', orgId)
          .limit(10);

        const lowerQ = query.toLowerCase();
        const filteredMembers = (matchedMembers || []).filter((m: any) => {
          const profile = m.profiles;
          const name = (profile?.full_name || '').toLowerCase();
          const email = (profile?.email || '').toLowerCase();
          const studentId = (m.student_id || '').toLowerCase();
          return name.includes(lowerQ) || email.includes(lowerQ) || studentId.includes(lowerQ);
        });

        filteredMembers.slice(0, 4).forEach((m: any) => {
          const profile = m.profiles;
          results.push({
            id: m.id,
            title: profile?.full_name || 'Học viên',
            subtitle: `${profile?.email || ''} ${m.student_id ? `• MSSV: ${m.student_id}` : ''}`,
            category: 'member',
            categoryLabel: 'Học Viên / Thành Viên',
            href: `/org/${orgSlug}/members`,
            badge: m.org_role || 'MEMBER',
          });
        });

        // Search Classes
        const { data: matchedClasses } = await adminSupabase
          .from('evaluator_classes')
          .select('id, name, class_code')
          .eq('organization_id', orgId)
          .or(`name.ilike.%${query}%,class_code.ilike.%${query}%`)
          .limit(3);

        (matchedClasses || []).forEach((c) => {
          results.push({
            id: c.id,
            title: c.name,
            subtitle: `Mã lớp: ${c.class_code}`,
            category: 'class',
            categoryLabel: 'Lớp Học',
            href: `/org/${orgSlug}/classes/${c.id}`,
            badge: c.class_code,
          });
        });

        // Search Campaigns
        const { data: matchedCampaigns } = await adminSupabase
          .from('assessment_campaigns')
          .select('id, title, status')
          .eq('organization_id', orgId)
          .ilike('title', `%${query}%`)
          .limit(3);

        (matchedCampaigns || []).forEach((camp) => {
          results.push({
            id: camp.id,
            title: camp.title,
            subtitle: `Đợt khảo thí • ${camp.status || 'Hoạt động'}`,
            category: 'campaign',
            categoryLabel: 'Đợt Khảo Thí',
            href: `/org/${orgSlug}/campaigns`,
            badge: camp.status || 'Khảo thí',
          });
        });
      }

      return NextResponse.json({
        success: true,
        isSuggestions: !query,
        query,
        scope,
        results,
        popularTags: !query ? popularTags : [],
      });
    }

    // =========================================================================
    // 3. PLATFORM ADMIN DASHBOARD SEARCH & QUICK LOOKUP
    // =========================================================================
    if (scope === 'admin') {
      const adminAuth = await requirePlatformAdmin();
      if (!adminAuth.isAuthorized) {
        return adminAuth.errorResponse || NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (!query) {
        // Admin Quick Shortcuts
        results.push(
          {
            id: 'admin-action-content',
            title: 'Ngân hàng Đề Khảo thí Chuẩn',
            subtitle: 'Quản lý, tạo mới và duyệt đề thi khảo thí',
            category: 'action',
            categoryLabel: 'Lối Tắt Quản Trị',
            href: '/admin/content',
            badge: 'Khảo thí',
          },
          {
            id: 'admin-action-ai',
            title: 'Cổng Kết Nối AI Gateway',
            subtitle: 'Cấu hình model, giám sát token và hạn mức AI',
            category: 'action',
            categoryLabel: 'Lối Tắt Quản Trị',
            href: '/admin/ai-gateway',
            badge: 'AI Config',
          },
          {
            id: 'admin-action-analytics',
            title: 'Báo Cáo & Phân Tích Nền Tảng',
            subtitle: 'Thống kê người dùng, tổ chức và tỷ lệ hoàn thành',
            category: 'action',
            categoryLabel: 'Lối Tắt Quản Trị',
            href: '/admin/analytics',
            badge: 'Thống kê',
          },
          {
            id: 'admin-action-orgs',
            title: 'Quản Lý Khách Hàng B2B',
            subtitle: 'Danh sách tổ chức, trường học và doanh nghiệp',
            category: 'action',
            categoryLabel: 'Lối Tắt Quản Trị',
            href: '/admin/organizations',
            badge: 'B2B',
          }
        );

        // Recent Organizations
        const { data: recentOrgs } = await adminSupabase
          .from('organizations')
          .select('id, name, slug, code, type, status')
          .order('created_at', { ascending: false })
          .limit(2);

        (recentOrgs || []).forEach((org) => {
          results.push({
            id: org.id,
            title: org.name,
            subtitle: `Mã: ${org.code || org.slug} • Loại: ${org.type || 'Standard'}`,
            category: 'organization',
            categoryLabel: 'Tổ Chức B2B Gần Nhất',
            href: `/admin/organizations`,
            badge: org.status || 'Active',
          });
        });
      } else {
        // Search Users / Profiles
        const { data: matchedProfiles } = await adminSupabase
          .from('profiles')
          .select('id, email, full_name, role, admin_role')
          .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(4);

        (matchedProfiles || []).forEach((p) => {
          results.push({
            id: p.id,
            title: p.full_name || p.email || 'Người dùng',
            subtitle: `Email: ${p.email || 'N/A'} • Vai trò: ${p.admin_role || p.role || 'LEARNER'}`,
            category: 'user',
            categoryLabel: 'Người Dùng',
            href: `/admin/users?q=${encodeURIComponent(p.email || '')}`,
            badge: p.admin_role || p.role || 'USER',
          });
        });

        // Search Organizations
        const { data: matchedOrgs } = await adminSupabase
          .from('organizations')
          .select('id, name, slug, code, type')
          .or(`name.ilike.%${query}%,code.ilike.%${query}%,slug.ilike.%${query}%`)
          .limit(3);

        (matchedOrgs || []).forEach((org) => {
          results.push({
            id: org.id,
            title: org.name,
            subtitle: `Mã: ${org.code || org.slug} • Loại: ${org.type || 'Standard'}`,
            category: 'organization',
            categoryLabel: 'Tổ Chức B2B',
            href: `/admin/organizations`,
            badge: org.code || org.slug,
          });
        });

        // Search Standard Assessments
        const { data: matchedAsms } = await adminSupabase
          .from('assessments')
          .select('id, title, duration_minutes, total_questions')
          .is('organization_id', null)
          .ilike('title', `%${query}%`)
          .limit(3);

        (matchedAsms || []).forEach((asm) => {
          results.push({
            id: asm.id,
            title: asm.title,
            subtitle: `Đề chuẩn hệ thống • ${asm.duration_minutes || 45} phút`,
            category: 'assessment',
            categoryLabel: 'Ngân Hàng Đề Chuẩn',
            href: `/admin/content`,
            badge: `${asm.duration_minutes || 45}m`,
          });
        });
      }

      return NextResponse.json({
        success: true,
        isSuggestions: !query,
        query,
        scope,
        results,
        popularTags: !query ? popularTags : [],
      });
    }

    return NextResponse.json({ success: false, error: 'Scope không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ khi tìm kiếm' }, { status: 500 });
  }
}
