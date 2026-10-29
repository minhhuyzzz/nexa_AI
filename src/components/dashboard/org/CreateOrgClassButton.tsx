'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, FolderKanban } from 'lucide-react';

export function CreateOrgClassButton({
  organizationId,
  orgName,
}: {
  organizationId: string;
  orgName: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          classCode: classCode.trim() || undefined,
          description: description.trim() || undefined,
          organizationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tạo nhóm thất bại');
      }

      setIsOpen(false);
      setName('');
      setClassCode('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo nhóm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Tạo nhóm mới</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-md shadow-lg max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-slate-900">Tạo nhóm lớp trong {orgName}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên nhóm / Lớp học <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Lớp K65 Khoa CNTT hoặc Phòng Phân Tích Dữ Liệu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mã nhóm tham gia (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="VD: CNTT-K65 (bỏ trống hệ thống sẽ tự sinh)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-mono focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mô tả mục tiêu nhóm
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả đối tượng đào tạo, phạm vi khảo thí hoặc thông báo..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Tạo nhóm ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
