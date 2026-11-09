'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  X,
  ShieldCheck,
  GraduationCap,
  AlertTriangle,
  Loader2,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface OrgDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  orgCode?: string;
  role?: string;
  onLeaveSuccess?: () => void;
}

interface EnrolledClassItem {
  id: string;
  name: string;
  class_code: string;
}

export function OrgDetailModal({
  isOpen,
  onClose,
  orgId,
  orgName,
  orgCode,
  role = 'Thành viên',
  onLeaveSuccess,
}: OrgDetailModalProps) {
  const [classes, setClasses] = useState<EnrolledClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Fetch classes user is enrolled in that belong to this organization
  useEffect(() => {
    if (!isOpen || !orgId) return;

    let isMounted = true;
    setLoadingClasses(true);
    setIsConfirmingLeave(false);
    setLeaveError(null);

    const fetchOrgClasses = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberRows } = await supabase
          .from('class_members')
          .select(`
            evaluator_classes (
              id,
              name,
              class_code,
              organization_id
            )
          `)
          .eq('user_id', user.id);

        if (isMounted) {
          const list: EnrolledClassItem[] = [];
          (memberRows || []).forEach((row: any) => {
            const cls = row.evaluator_classes;
            if (cls && cls.organization_id === orgId) {
              list.push({
                id: cls.id,
                name: cls.name || 'Lớp học',
                class_code: cls.class_code || '---',
              });
            }
          });
          setClasses(list);
        }
      } catch (e) {
        console.error('Error fetching org classes for member:', e);
      } finally {
        if (isMounted) setLoadingClasses(false);
      }
    };

    fetchOrgClasses();

    return () => {
      isMounted = false;
    };
  }, [isOpen, orgId]);

  if (!isOpen) return null;

  const handleLeaveOrg = async () => {
    setLeaving(true);
    setLeaveError(null);

    try {
      const res = await fetch(`/api/organizations/${orgId}/leave`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể rời tổ chức');
      }

      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
      onClose();
    } catch (err) {
      setLeaveError(err instanceof Error ? err.message : 'Lỗi hệ thống khi rời tổ chức');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
                  TỔ CHỨC TRỰC THUỘC
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {role}
                </span>
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
                {orgName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông tin đơn vị */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-neutral-400">Mã đơn vị / Trường:</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
              {orgCode || '---'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-neutral-400">Trạng thái thành viên:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Đang hoạt động
            </span>
          </div>
        </div>

        {/* Danh sách lớp học trực thuộc */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Lớp học trực thuộc trường</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {classes.length} lớp đang học
            </span>
          </div>

          {loadingClasses ? (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tải thông tin lớp học...</span>
            </div>
          ) : classes.length > 0 ? (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate pr-2">
                    {cls.name}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 shrink-0">
                    {cls.class_code}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
              Bạn chưa ghi danh vào lớp học nào thuộc trường này.
            </div>
          )}
        </div>

        {/* Confirmation or Leave button */}
        {leaveError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
            {leaveError}
          </div>
        )}

        {isConfirmingLeave ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
            <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Xác nhận rời khỏi &ldquo;{orgName}&rdquo;?
              </span>
            </div>
            <p className="text-[11px] text-rose-600/90 dark:text-rose-400 leading-relaxed">
              Bạn sẽ tự động rút khỏi toàn bộ lớp học của trường. Dữ liệu bài thi đã nộp trước đây vẫn được lưu trữ bảo mật trên hệ thống.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={leaving}
                onClick={() => setIsConfirmingLeave(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-medium hover:bg-white dark:hover:bg-zinc-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={leaving}
                onClick={handleLeaveOrg}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                <span>Xác nhận rời trường</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsConfirmingLeave(true)}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Rời tổ chức</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
