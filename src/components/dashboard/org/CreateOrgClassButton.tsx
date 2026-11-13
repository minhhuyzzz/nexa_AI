'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, FolderKanban, AlertCircle } from 'lucide-react';

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
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate on blur (chỉ kiểm tra khi rời khỏi trường nhập, không kiểm tra liên tục khi đang gõ)
  const validateNameOnBlur = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Vui lòng nhập tên nhóm hoặc lớp học (ví dụ: Lớp K65 Khoa CNTT).');
      return false;
    }
    if (trimmed.length < 2) {
      setNameError('Tên nhóm quá ngắn. Vui lòng nhập tối thiểu 2 ký tự.');
      return false;
    }
    setNameError(null);
    return true;
  };

  const validateCodeOnBlur = () => {
    const trimmed = classCode.trim();
    if (!trimmed) {
      setCodeError(null);
      return true;
    }
    const codeRegex = /^[A-Z0-9_-]+$/;
    if (!codeRegex.test(trimmed)) {
      setCodeError('Mã nhóm chỉ gồm chữ hoa không dấu, chữ số và gạch ngang (ví dụ: CNTT-K65).');
      return false;
    }
    setCodeError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateNameOnBlur();
    const isCodeValid = validateCodeOnBlur();
    if (!isNameValid || !isCodeValid) return;

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
      setNameError(null);
      setCodeError(null);
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
        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Tạo nhóm mới</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Tạo lớp học / Nhóm đơn vị
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    {orgName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none"
                aria-label="Đóng hộp thoại"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Field 1: Tên nhóm (Bố cục 1 cột, Label trên) */}
              <div className="space-y-1.5">
                <label htmlFor="class-name-input" className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Tên nhóm / Lớp học <span className="text-red-500">*</span>
                </label>
                <input
                  id="class-name-input"
                  type="text"
                  value={name}
                  onBlur={validateNameOnBlur}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'class-name-error' : undefined}
                  placeholder="VD: Lớp K65 Khoa CNTT hoặc Ban Đào Tạo Số"
                  className={`w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 transition-colors focus-visible:outline-none motion-reduce:transition-none ${
                    nameError
                      ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 bg-red-50/10'
                      : 'border border-slate-200 dark:border-zinc-700/80 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent'
                  }`}
                />
                {nameError && (
                  <p id="class-name-error" className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Mã nhóm (Bố cục 1 cột, Label trên) */}
              <div className="space-y-1.5">
                <label htmlFor="class-code-input" className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Mã tham gia (Tùy chọn)
                </label>
                <input
                  id="class-code-input"
                  type="text"
                  value={classCode}
                  onBlur={validateCodeOnBlur}
                  onChange={(e) => {
                    setClassCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                    if (codeError) setCodeError(null);
                  }}
                  aria-invalid={!!codeError}
                  aria-describedby={codeError ? 'class-code-error' : undefined}
                  placeholder="VD: CNTT-K65 (bỏ trống hệ thống sẽ tự sinh)"
                  className={`w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-zinc-900 text-xs font-mono text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 transition-colors focus-visible:outline-none motion-reduce:transition-none ${
                    codeError
                      ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 bg-red-50/10'
                      : 'border border-slate-200 dark:border-zinc-700/80 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent'
                  }`}
                />
                {codeError && (
                  <p id="class-code-error" className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{codeError}</span>
                  </p>
                )}
              </div>

              {/* Field 3: Mô tả (Bố cục 1 cột, Label trên) */}
              <div className="space-y-1.5">
                <label htmlFor="class-desc-input" className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Mô tả mục tiêu nhóm
                </label>
                <textarea
                  id="class-desc-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả đối tượng đào tạo, phạm vi khảo thí hoặc thông báo..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none resize-none motion-reduce:transition-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto h-11 min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className={`w-full sm:w-auto h-11 min-h-[44px] px-5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none ${
                    loading || !name.trim()
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 cursor-not-allowed border border-slate-200 dark:border-zinc-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                  }`}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
