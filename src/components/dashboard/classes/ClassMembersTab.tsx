'use client';

import { useState } from 'react';
import { Users, Trash2, ShieldCheck, User, Search, Shield, Loader2 } from 'lucide-react';

export interface MemberProfile {
  id: string;
  nickname?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

export interface ClassMemberItem {
  id: string;
  user_id: string;
  joined_at: string;
  profiles?: MemberProfile;
}

interface ClassMembersTabProps {
  classId: string;
  members: ClassMemberItem[];
  role: 'EVALUATOR' | 'LEARNER';
  currentUserId: string;
  ownerId?: string;
  onRefresh?: () => void;
}

export function ClassMembersTab({
  classId,
  members,
  role,
  currentUserId,
  ownerId,
  onRefresh,
}: ClassMembersTabProps) {
  const [search, setSearch] = useState('');
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const filteredMembers = (members || []).filter((m) => {
    const name = m.profiles?.nickname?.toLowerCase() || '';
    const email = m.profiles?.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || (role === 'EVALUATOR' && email.includes(q));
  });

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thành viên "${memberName}" khỏi nhóm?`)) return;

    try {
      setIsRemoving(memberId);
      const res = await fetch(`/api/evaluator/classes?action=remove_member&memberId=${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh?.();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể xóa thành viên');
      }
    } catch {
      alert('Đã xảy ra lỗi khi xóa thành viên');
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email thành viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 font-sans shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 font-mono">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Tổng số: <strong className="text-neutral-900 dark:text-neutral-100 font-bold">{filteredMembers.length}</strong> thành viên</span>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#111114] space-y-2">
          <Users className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" strokeWidth={1.75} />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
            {search ? 'Không tìm thấy thành viên phù hợp với từ khóa.' : 'Chưa có thành viên nào tham gia nhóm.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMembers.map((member) => {
            const prof = member.profiles;
            const name = prof?.nickname || 'Thành viên';
            const email = prof?.email || 'Chưa cung cấp';
            const isMemberOwner = ownerId ? member.user_id === ownerId : false;
            const isSelf = member.user_id === currentUserId;
            const joinedDate = new Date(member.joined_at).toLocaleDateString('vi-VN');

            return (
              <div
                key={member.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-xs font-bold font-mono shrink-0 select-none uppercase">
                    {name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                        {name}
                      </span>
                      {isMemberOwner && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                          QUẢN TRỊ VIÊN
                        </span>
                      )}
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300">
                          Bạn
                        </span>
                      )}
                    </div>
                    {role === 'EVALUATOR' && (
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono block truncate">
                        {email}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono block">
                      Tham gia: {joinedDate}
                    </span>
                  </div>
                </div>

                {role === 'EVALUATOR' && !isMemberOwner && (
                  <button
                    type="button"
                    disabled={isRemoving === member.id}
                    onClick={() => handleRemoveMember(member.id, name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Xóa thành viên khỏi nhóm"
                  >
                    {isRemoving === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
