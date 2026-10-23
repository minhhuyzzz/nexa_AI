'use client';

import { useState } from 'react';
import { Users, Trash2, ShieldCheck, User, Search } from 'lucide-react';

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
  onRefresh?: () => void;
}

export function ClassMembersTab({
  classId,
  members,
  role,
  currentUserId,
  onRefresh,
}: ClassMembersTabProps) {
  const [search, setSearch] = useState('');
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const filteredMembers = members.filter((m) => {
    const name = m.profiles?.nickname?.toLowerCase() || '';
    const email = m.profiles?.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || (role === 'EVALUATOR' && email.includes(q));
  });

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học viên "${memberName}" khỏi nhóm?`)) return;

    try {
      setIsRemoving(memberId);
      const res = await fetch(`/api/evaluator/classes?action=remove_member&memberId=${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh?.();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể xóa thành viên');
      }
    } catch {
      alert('Đã xảy ra lỗi khi xóa thành viên');
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo tên học viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
          />
        </div>

        <span className="text-xs font-mono text-slate-500">
          Tổng số: <strong>{filteredMembers.length}</strong> học viên
        </span>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-md bg-white">
          <p className="text-xs text-slate-500">Chưa có thành viên nào trong danh sách.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md bg-white divide-y divide-slate-100">
          {filteredMembers.map((member) => {
            const prof = member.profiles;
            const name = prof?.nickname || 'Học viên';
            const email = prof?.email || 'Chưa cung cấp';
            const joinedDate = new Date(member.joined_at).toLocaleDateString('vi-VN');

            return (
              <div
                key={member.id}
                className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold font-mono text-slate-700 uppercase">
                    {name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{name}</span>
                      {member.user_id === currentUserId && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          Bạn
                        </span>
                      )}
                    </div>
                    {role === 'EVALUATOR' && (
                      <span className="text-[11px] text-slate-500 font-mono block">
                        {email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tham gia: {joinedDate}
                  </span>

                  {role === 'EVALUATOR' && (
                    <button
                      type="button"
                      disabled={isRemoving === member.id}
                      onClick={() => handleRemoveMember(member.id, name)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa học viên khỏi nhóm"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
