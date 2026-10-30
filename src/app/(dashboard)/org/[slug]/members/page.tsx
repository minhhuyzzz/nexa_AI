import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Users, Mail, Shield, UserCheck, Plus } from 'lucide-react';
import { OrgMembersClientView } from './OrgMembersClientView';

export default async function OrgMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch organization
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug, max_members')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // 2. Fetch all members with profile details
  const { data: membersRaw } = await adminSupabase
    .from('user_organizations')
    .select(`
      id,
      user_id,
      org_role,
      status,
      created_at,
      profiles (
        id,
        email,
        nickname
      )
    `)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: true });

  interface MemberRow {
    id: string;
    user_id: string;
    org_role: string;
    status: string;
    created_at: string;
    profiles: {
      id: string;
      email: string;
      nickname: string;
    } | null;
  }

  const members = ((membersRaw as unknown as MemberRow[]) || []).map((m) => ({
    membershipId: m.id,
    userId: m.user_id,
    email: m.profiles?.email || 'N/A',
    nickname: m.profiles?.nickname || 'Thành viên',
    role: m.org_role,
    status: m.status,
    createdAt: m.created_at,
    isCurrentUser: m.user_id === user?.id,
  }));

  const currentMember = members.find((m) => m.userId === user?.id);
  const isManager = currentMember?.role === 'ORG_OWNER' || currentMember?.role === 'ORG_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Thành viên & Phân quyền</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-100 text-slate-700">
              {members.length} / {org.max_members || 50}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị nhân sự tham gia tổ chức {org.name} theo mô hình phân quyền RBAC 5 cấp.
          </p>
        </div>
      </div>

      <OrgMembersClientView
        organizationId={org.id}
        organizationName={org.name}
        members={members}
        maxMembers={org.max_members || 50}
        isManager={Boolean(isManager)}
      />
    </div>
  );
}
