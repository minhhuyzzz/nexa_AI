'use client';

import React, { useState, useRef, useTransition, useId } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  Loader2,
  Download,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Check,
  ShieldAlert,
} from 'lucide-react';
import type { OrgClassItem } from './members/types';

interface ParsedMember {
  email: string;
  fullName: string;
  studentId: string;
  orgRole: 'MEMBER' | 'ORG_ADMIN';
  className?: string;
  isValid: boolean;
  error?: string;
}

interface BulkMemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  remainingSeats: number;
  classes?: OrgClassItem[];
  onSuccess: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BulkMemberImportModal({
  isOpen,
  onClose,
  organizationId,
  remainingSeats,
  classes = [],
  onSuccess,
}: BulkMemberImportModalProps) {
  const defaultRoleSelectId = useId();
  const assignClassSelectId = useId();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<ParsedMember[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [defaultRole, setDefaultRole] = useState<'MEMBER' | 'ORG_ADMIN'>('MEMBER');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [filterView, setFilterView] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    importedCount: number;
    skippedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorMessage(null);
    setSuccessResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      setErrorMessage('File CSV không có dữ liệu hoặc chỉ chứa tiêu đề.');
      setParsedRows([]);
      return;
    }

    const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
    const dataLines = lines.slice(startIndex);

    const rows: ParsedMember[] = [];
    const seenEmails = new Set<string>();

    dataLines.forEach((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const email = cols[0]?.toLowerCase() || '';
      const fullName = cols[1] || '';
      const studentId = cols[2] || '';
      const roleRaw = cols[3]?.toUpperCase() || defaultRole;

      let orgRole: 'MEMBER' | 'ORG_ADMIN' = defaultRole;
      if (roleRaw === 'ORG_ADMIN' || roleRaw === 'ADMIN') orgRole = 'ORG_ADMIN';

      if (!email) {
        rows.push({
          email: '—',
          fullName,
          studentId,
          orgRole,
          isValid: false,
          error: 'Thiếu địa chỉ email',
        });
        return;
      }

      if (!EMAIL_REGEX.test(email)) {
        rows.push({
          email,
          fullName,
          studentId,
          orgRole,
          isValid: false,
          error: 'Email không đúng định dạng',
        });
      } else if (seenEmails.has(email)) {
        rows.push({
          email,
          fullName,
          studentId,
          orgRole,
          isValid: false,
          error: 'Email trùng lặp trong tệp',
        });
      } else {
        seenEmails.add(email);
        rows.push({
          email,
          fullName,
          studentId,
          orgRole,
          isValid: true,
        });
      }
    });

    setParsedRows(rows);
    setStep(2);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const exceedsSeats = validRows.length > remainingSeats;

  const handleDownloadSample = () => {
    const csvContent =
      '\uFEFF' +
      'Email,HoVaTen,MaSinhVien,VaiTro\nhocvien1@truong.edu.vn,Nguyễn Văn An,SV202601,MEMBER\ngiangvien2@truong.edu.vn,Trần Thị Bình,GV202602,ASSESSOR\nhocvien3@truong.edu.vn,Lê Hoàng Nam,SV202603,MEMBER\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nexa_danh_sach_thanh_vien_mau.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = () => {
    if (validRows.length === 0 || exceedsSeats) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const payload = {
          members: validRows.map((r) => ({
            email: r.email,
            fullName: r.fullName || undefined,
            studentId: r.studentId || undefined,
            orgRole: r.orgRole || defaultRole,
            classId: targetClassId || undefined,
          })),
        };

        const res = await fetch(`/api/organizations/${organizationId}/members/bulk-import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Import thành viên thất bại');
        }

        setSuccessResult({
          importedCount: data.importedCount,
          skippedCount: data.skippedCount,
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Có lỗi xảy ra khi nhập dữ liệu');
      }
    });
  };

  const displayedRows = parsedRows.filter((r) => {
    if (filterView === 'VALID') return r.isValid;
    if (filterView === 'INVALID') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Nhập danh sách thành viên hàng loạt
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Thêm đồng loạt học viên, cán bộ vào tổ chức qua tệp CSV hoặc Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Steps indicator */}
        <div className="grid grid-cols-3 border-b border-slate-100 dark:border-zinc-800 text-xs bg-slate-50/50 dark:bg-zinc-900/50">
          {[
            { num: 1, label: 'Tải tệp CSV' },
            { num: 2, label: 'Cấu hình vai trò' },
            { num: 3, label: 'Xem trước & Xác nhận' },
          ].map((s) => (
            <button
              key={s.num}
              disabled={step < s.num && parsedRows.length === 0}
              onClick={() => {
                if (parsedRows.length > 0 || s.num === 1) setStep(s.num as 1 | 2 | 3);
              }}
              className={`py-2 px-3 text-center border-b-2 font-medium flex items-center justify-center gap-1.5 transition ${
                step === s.num
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900'
                  : step > s.num
                    ? 'border-transparent text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 dark:text-zinc-600'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                  step === s.num
                    ? 'bg-blue-600 text-white'
                    : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                }`}
              >
                {step > s.num ? <Check className="w-2.5 h-2.5" /> : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Quota Strip */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 px-5 py-2.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-600 dark:text-neutral-400">
            <span>
              Ghế trống hiện có:{' '}
              <strong className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {remainingSeats}
              </strong>
            </span>
            {parsedRows.length > 0 && (
              <>
                <span>
                  Hợp lệ:{' '}
                  <strong className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {validRows.length}
                  </strong>
                </span>
                <span>
                  Dự kiến sau import:{' '}
                  <strong
                    className={`font-mono tabular-nums ${
                      exceedsSeats ? 'text-red-600 font-bold' : 'text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    {Math.max(0, remainingSeats - validRows.length)}
                  </strong>
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleDownloadSample}
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Download className="w-3 h-3" />
            Tải file mẫu .csv
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successResult && (
            <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Đã gửi lời mời thành công đến{' '}
                <strong className="font-mono tabular-nums">{successResult.importedCount}</strong> tài khoản
                (bỏ qua {successResult.skippedCount} tài khoản đã tồn tại).
              </span>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 rounded-md p-8 text-center cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2.5" />
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {fileName ? fileName : 'Bấm để chọn file CSV hoặc kéo thả vào đây'}
                </p>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
                  Định dạng hỗ trợ: UTF-8 CSV (cột Email, Họ và tên, Mã sinh viên, Vai trò)
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Lưu ý khi chuẩn bị dữ liệu:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>Cột `Email` là bắt buộc, các email phải hợp lệ và chưa từng bị cấm.</li>
                  <li>Nếu để trống cột vai trò, hệ thống sẽ áp dụng vai trò mặc định được chọn ở bước tiếp theo.</li>
                  <li>Số lượng bản ghi hợp lệ không được vượt quá số ghế còn lại của tổ chức.</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: Configure & Field Mapping */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-md border border-slate-200 dark:border-zinc-800">
                <div>
                  <label htmlFor={defaultRoleSelectId} className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Vai trò áp dụng mặc định
                  </label>
                  <select
                    id={defaultRoleSelectId}
                    value={defaultRole}
                    onChange={(e) =>
                      setDefaultRole(e.target.value as 'MEMBER' | 'ORG_ADMIN')
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="MEMBER">Thành viên (Mặc định)</option>
                    <option value="ORG_ADMIN">Quản trị viên</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Áp dụng cho các dòng không chỉ định rõ vai trò trong tệp.
                  </p>
                </div>

                <div>
                  <label htmlFor={assignClassSelectId} className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Gán vào lớp học (Tùy chọn)
                  </label>
                  <select
                    id={assignClassSelectId}
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Không gán lớp học</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tất cả thành viên hợp lệ sẽ tự động ghi danh vào lớp này.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                <span>
                  Đã đọc <strong>{parsedRows.length}</strong> dòng từ tệp{' '}
                  <code className="font-mono">{fileName}</code>.
                </span>
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1 font-semibold hover:underline"
                >
                  Chuyển sang xem trước <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Submit */}
          {step === 3 && (
            <div className="space-y-3">
              {/* Exceed quota alert */}
              {exceedsSeats && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold">Vượt quá hạn mức số ghế!</p>
                    <p className="text-[11px]">
                      Danh sách có {validRows.length} bản ghi hợp lệ nhưng tổ chức chỉ còn lại{' '}
                      {remainingSeats} ghế. Vui lòng giảm số dòng hoặc liên hệ nâng cấp gói.
                    </p>
                  </div>
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'ALL', label: `Tất cả (${parsedRows.length})` },
                    { id: 'VALID', label: `Hợp lệ (${validRows.length})` },
                    { id: 'INVALID', label: `Cần xử lý (${invalidRows.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterView(tab.id as 'ALL' | 'VALID' | 'INVALID')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        filterView === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setParsedRows([]);
                    setFileName(null);
                    setStep(1);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <RotateCcw className="w-3 h-3" /> Chọn tệp khác
                </button>
              </div>

              {/* Preview table */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-500 dark:text-neutral-400 font-semibold border-b border-slate-200 dark:border-zinc-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">Mã SV</th>
                      <th className="py-2 px-3">Vai trò</th>
                      <th className="py-2 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Không có dòng dữ liệu nào trong mục này.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            row.isValid
                              ? 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                              : 'bg-red-50/50 dark:bg-red-950/20'
                          }
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-neutral-900 dark:text-neutral-100">
                            {row.email}
                          </td>
                          <td className="py-2 px-3 text-slate-700 dark:text-neutral-300">
                            {row.fullName || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {row.studentId || '—'}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                              {row.orgRole === 'ORG_ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <Check className="w-3 h-3" /> Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                <AlertTriangle className="w-3 h-3" /> {row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                className="px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md hover:bg-slate-50 font-medium transition"
              >
                Quay lại
              </button>
            )}

            {step < 3 ? (
              <button
                disabled={parsedRows.length === 0}
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={validRows.length === 0 || exceedsSeats || isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang nhập dữ liệu...</span>
                  </>
                ) : (
                  <span>Xác nhận nhập ({validRows.length} thành viên)</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
