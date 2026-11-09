'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  RefreshCw,
  Trash2,
  Archive,
  AlertTriangle,
  Check,
  Loader2,
  Lock,
  Globe,
  ShieldAlert,
} from 'lucide-react';

interface ClassSettingsTabProps {
  classId: string;
  initialName: string;
  initialDescription: string;
  initialCode: string;
  initialAllowMemberPosts?: boolean;
  onUpdated?: (updated: { name: string; description: string; code?: string; allowMemberPosts?: boolean }) => void;
  onClose?: () => void;
}

export function ClassSettingsTab({
  classId,
  initialName,
  initialDescription,
  initialCode,
  initialAllowMemberPosts = true,
  onUpdated,
  onClose,
}: ClassSettingsTabProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [code, setCode] = useState(initialCode);
  const [allowMemberPosts, setAllowMemberPosts] = useState(initialAllowMemberPosts);

  // States
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [regenerating, setRegenerating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setSaveError('Tên lớp tối thiểu 2 ký tự');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          allowMemberPosts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');

      setSaveSuccess(true);
      if (onUpdated) {
        onUpdated({
          name: data.class.name,
          description: data.class.description,
          allowMemberPosts,
        });
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm('Bạn có chắc chắn muốn tạo lại mã lớp? Mã cũ sẽ mất hiệu lực ngay lập tức.')) {
      return;
    }

    setRegenerating(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateCode: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo lại mã');

      setCode(data.class.class_code);
      if (onUpdated) {
        onUpdated({
          name,
          description,
          code: data.class.class_code,
        });
      }
      alert(`Đã cấp mã tham gia mới: ${data.class.class_code}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Tạo lại mã thất bại');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteClass = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa lớp thất bại');

      router.push('/personal/groups');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa lớp');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Form: Main settings (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Section 1: Thông tin chung */}
        <form
          onSubmit={handleSaveInfo}
          className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
        >
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thông tin chung
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Cập nhật tên gọi và mục tiêu học tập của lớp học.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã lưu thành công</span>
                </span>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng cài đặt
                </button>
              )}
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
              {saveError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Tên lớp học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Mục tiêu & Mô tả lớp
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Discussion Permission Toggle */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                  Quyền thảo luận &amp; Đặt câu hỏi của thành viên
                </label>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                  {allowMemberPosts
                    ? 'Đang bật: Thành viên có thể đăng câu hỏi, chia sẻ tài liệu và thảo luận cùng lớp.'
                    : 'Đang tắt: Chỉ Quản trị viên mới được đăng thông báo. Thành viên chỉ xem và phản hồi.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={allowMemberPosts}
                  onChange={(e) => setAllowMemberPosts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/20"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>

        {/* Section 2: Danger Zone */}
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-950/80 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <h3 className="text-sm font-bold">Khu vực nguy hiểm</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-neutral-900 dark:text-neutral-100 block">
                  Xóa vĩnh viễn lớp học
                </strong>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Hành động này sẽ xóa toàn bộ bài đăng, danh sách bài giao và lịch sử làm bài của lớp.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
              >
                Xóa lớp học
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Code management (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Quản lý mã tham gia
          </h3>

          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Học viên sử dụng mã này để vào lớp. Nếu mã bị lộ cho người ngoài, bạn có thể tạo lại mã mới bất kỳ lúc nào.
          </p>

          <div className="p-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 font-mono tracking-wider mb-1">
              MÃ THAM GIA HIỆN TẠI
            </div>
            <div className="text-2xl font-extrabold font-mono tracking-widest text-blue-600 dark:text-blue-400">
              {code}
            </div>
          </div>

          <button
            type="button"
            disabled={regenerating}
            onClick={handleRegenerateCode}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>Tạo lại mã tham gia</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Xác nhận xóa vĩnh viễn lớp học?
              </h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Bạn sắp xóa lớp <strong>&ldquo;{name}&rdquo;</strong>. Tất cả dữ liệu thảo luận, tài liệu và phân công bài thi sẽ bị gỡ bỏ vĩnh viễn. Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteClass}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
