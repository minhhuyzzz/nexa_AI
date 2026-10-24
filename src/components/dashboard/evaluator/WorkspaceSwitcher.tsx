'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  User,
  ChevronDown,
  Check,
  Plus,
  Mail,
  Copy,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  code?: string;
  plan_tier?: string;
}

interface WorkspaceItem {
  membershipId: string;
  role: 'ORG_ADMIN' | 'EVALUATOR' | 'MEMBER';
  organization: Organization;
}

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');
  const [isOpen, setIsOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ORG_ADMIN' | 'EVALUATOR' | 'MEMBER'>('EVALUATOR');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read persisted workspace
    const saved = localStorage.getItem('nexa_active_workspace');
    if (saved) {
      setActiveWorkspaceId(saved);
    }

    // Fetch user organizations
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/organizations/my');
        if (res.ok) {
          const data = await res.json();
          if (data.workspaces) {
            setWorkspaces(data.workspaces);
          }
        }
      } catch (e) {
        console.error('Failed to load workspaces', e);
      }
    };

    fetchWorkspaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('nexa_active_workspace', id);
    setIsOpen(false);
  };

  const activeWorkspace = workspaces.find((w) => w.organization.id === activeWorkspaceId);
  const isPersonal = activeWorkspaceId === 'personal' || !activeWorkspace;
  const isOrgAdmin = !isPersonal && activeWorkspace?.role === 'ORG_ADMIN';

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPersonal || !activeWorkspace) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteResult(null);

    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeWorkspace.organization.id,
          email: inviteEmail,
          orgRole: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo lời mời');
      }

      setInviteResult({ inviteUrl: data.invitation.inviteUrl });
      setInviteEmail('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteUrl) {
      navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors shadow-xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isPersonal ? (
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" strokeWidth={1.75} />
        )}

        <span className="max-w-[120px] sm:max-w-[160px] truncate text-slate-900 font-semibold">
          {isPersonal ? 'Cá nhân / Độc lập' : activeWorkspace?.organization.name}
        </span>

        {!isPersonal && activeWorkspace && (
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200">
            {activeWorkspace.role}
          </span>
        )}

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-64 rounded-md border border-slate-200 bg-white shadow-sm z-50 py-1 text-xs">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Không gian làm việc
          </div>

          {/* Personal option */}
          <button
            onClick={() => handleSelectWorkspace('personal')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
              isPersonal ? 'bg-slate-50 font-semibold text-sky-700' : 'text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
              <div>
                <p className="text-xs">Cá nhân / Tự do</p>
                <p className="text-[10px] text-slate-400">Đề thi và lớp học riêng</p>
              </div>
            </div>
            {isPersonal && <Check className="w-4 h-4 text-sky-600" strokeWidth={1.75} />}
          </button>

          {/* Organization list */}
          {workspaces.map((ws) => {
            const isSelected = activeWorkspaceId === ws.organization.id;
            return (
              <button
                key={ws.membershipId}
                onClick={() => handleSelectWorkspace(ws.organization.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                  isSelected ? 'bg-slate-50 font-semibold text-sky-700' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-xs truncate">{ws.organization.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{ws.role}</p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />}
              </button>
            );
          })}

          {/* Invite Action if Org Admin */}
          {isOrgAdmin && (
            <div className="border-t border-slate-100 pt-1 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowInviteModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sky-700 hover:bg-sky-50 transition-colors text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span>Mời đồng nghiệp vào tổ chức</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && !isPersonal && activeWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Mời Thành Viên Vào Tổ Chức
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đơn vị: <span className="font-semibold text-slate-800">{activeWorkspace.organization.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteResult(null);
                  setInviteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
              >
                Đóng
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" strokeWidth={1.75} />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteResult ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800">
                  Lời mời đã được khởi tạo! Gửi liên kết dưới đây cho đồng nghiệp (có hiệu lực trong 7 ngày):
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email người nhận
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" strokeWidth={1.75} />
                    <input
                      type="email"
                      required
                      placeholder="giangvien@truong.edu.vn"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vai trò trong tổ chức
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  >
                    <option value="EVALUATOR">Người đánh giá / Giảng viên (EVALUATOR)</option>
                    <option value="ORG_ADMIN">Quản trị viên tổ chức (ORG_ADMIN)</option>
                    <option value="MEMBER">Thành viên học tập / Trợ giảng (MEMBER)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Tạo liên kết lời mời</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
