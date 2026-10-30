'use client';

import { useState, useRef, useTransition } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  Loader2,
  Download,
} from 'lucide-react';

interface ParsedMember {
  email: string;
  fullName: string;
  studentId: string;
  orgRole: 'MEMBER' | 'ASSESSOR' | 'REPORT_VIEWER';
  isValid: boolean;
  error?: string;
}

interface BulkMemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  remainingSeats: number;
  onSuccess: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BulkMemberImportModal({
  isOpen,
  onClose,
  organizationId,
  remainingSeats,
  onSuccess,
}: BulkMemberImportModalProps) {
  const [parsedRows, setParsedRows] = useState<ParsedMember[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
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

    // Skip header line if present
    const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
    const dataLines = lines.slice(startIndex);

    const rows: ParsedMember[] = [];
    const seenEmails = new Set<string>();

    dataLines.forEach((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const email = cols[0]?.toLowerCase() || '';
      const fullName = cols[1] || '';
      const studentId = cols[2] || '';
      const roleRaw = cols[3]?.toUpperCase() || 'MEMBER';

      let orgRole: 'MEMBER' | 'ASSESSOR' | 'REPORT_VIEWER' = 'MEMBER';
      if (roleRaw === 'ASSESSOR' || roleRaw === 'EVALUATOR') orgRole = 'ASSESSOR';
      if (roleRaw === 'REPORT_VIEWER') orgRole = 'REPORT_VIEWER';

      if (!email) return;

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
          error: 'Email trùng lặp trong file',
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
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const exceedsSeats = validRows.length > remainingSeats;

  const handleDownloadSample = () => {
    const csvContent =
      'Email,HoVaTen,MaSinhVien,VaiTro\nhocvien1@truong.edu.vn,Nguyễn Văn An,SV202601,MEMBER\ngiangvien2@truong.edu.vn,Trần Thị Bình,GV202602,ASSESSOR\n';
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
            orgRole: r.orgRole,
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
        setErrorMessage(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-md shadow-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Users className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Import Thành Viên Hàng Loạt (CSV)
              </h2>
              <p className="text-[11px] text-slate-500">
                Mời hàng loạt sinh viên hoặc cán bộ vào không gian tổ chức
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Seat Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600">Số ghế thành viên còn trống:</span>
            <span className="font-mono tabular-nums font-bold text-slate-900">
              {remainingSeats} ghế
            </span>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-sky-600 hover:bg-sky-50/20 rounded-md p-6 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-slate-800">
              {fileName ? fileName : 'Bấm để chọn file CSV hoặc kéo thả vào đây'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Định dạng hỗ trợ: .csv (UTF-8)</p>
          </div>

          {/* Download Sample Link */}
          <div className="flex justify-end">
            <button
              onClick={handleDownloadSample}
              type="button"
              className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-medium"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              Tải file mẫu chuẩn (.csv)
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" strokeWidth={1.75} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successResult && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" strokeWidth={1.75} />
              <span>
                Đã gửi lời mời thành công đến{' '}
                <strong className="font-mono tabular-nums">{successResult.importedCount}</strong> tài
                khoản (bỏ qua {successResult.skippedCount} tài khoản đã là thành viên).
              </span>
            </div>
          )}

          {/* Validation Stats */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-600">
                  Tổng dòng: <strong className="font-mono tabular-nums">{parsedRows.length}</strong>
                </span>
                <span className="text-emerald-700 font-medium">
                  Hợp lệ: <strong className="font-mono tabular-nums">{validRows.length}</strong>
                </span>
                {invalidRows.length > 0 && (
                  <span className="text-rose-700 font-medium">
                    Lỗi:{' '}
                    <strong className="font-mono tabular-nums">{invalidRows.length}</strong>
                  </span>
                )}
              </div>

              {exceedsSeats && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" strokeWidth={1.75} />
                  <span>
                    Danh sách hợp lệ ({validRows.length} người) vượt quá số ghế còn lại (
                    {remainingSeats} ghế).
                  </span>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-1.5 px-3">Email</th>
                      <th className="py-1.5 px-3">Họ Tên</th>
                      <th className="py-1.5 px-3">Mã SV</th>
                      <th className="py-1.5 px-3">Vai Trò</th>
                      <th className="py-1.5 px-3">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'bg-white' : 'bg-rose-50/40'}>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-900 truncate max-w-[150px]">
                          {row.email}
                        </td>
                        <td className="py-1.5 px-3 text-slate-700 truncate max-w-[120px]">
                          {row.fullName || '—'}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">
                          {row.studentId || '—'}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 text-[11px]">{row.orgRole}</td>
                        <td className="py-1.5 px-3 text-[11px]">
                          {row.isValid ? (
                            <span className="text-emerald-700 font-medium">Hợp lệ</span>
                          ) : (
                            <span className="text-rose-600 font-medium">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-md border border-slate-200 hover:bg-slate-50 font-medium transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSubmit}
            disabled={validRows.length === 0 || exceedsSeats || isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý import...</span>
              </>
            ) : (
              <span>Xác nhận gửi lời mời ({validRows.length})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
