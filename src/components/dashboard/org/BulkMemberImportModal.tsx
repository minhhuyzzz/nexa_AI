'use client';

import React, { useState, useRef, useTransition, useId } from 'react';
import type ExcelJS from 'exceljs';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Download,
  AlertTriangle,
  RotateCcw,
  Check,
  ShieldAlert,
} from 'lucide-react';
import type { OrgClassItem } from './members/types';

interface ParsedMember {
  email: string;
  fullName: string;
  orgRole: 'MEMBER' | 'ORG_ADMIN' | 'ASSESSOR';
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

function extractCellString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((t: any) => t.text || '').join('').trim();
    }
    if ('result' in value && value.result !== undefined) {
      return String(value.result).trim();
    }
    if ('text' in value && typeof (value as any).text === 'string') {
      return (value as any).text.trim();
    }
  }
  return '';
}

export function BulkMemberImportModal({
  isOpen,
  onClose,
  organizationId,
  remainingSeats,
  classes = [],
  onSuccess,
}: BulkMemberImportModalProps) {
  const assignClassSelectId = useId();
  const [step, setStep] = useState<1 | 2>(1);
  const [parsedRows, setParsedRows] = useState<ParsedMember[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorMessage(null);
    setSuccessResult(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      try {
        const buffer = await file.arrayBuffer();
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet || worksheet.rowCount <= 1) {
          setErrorMessage('File Excel không có dữ liệu hoặc chỉ chứa tiêu đề.');
          setParsedRows([]);
          return;
        }

        parseExcelWorksheet(worksheet);
      } catch (err) {
        console.error('Lỗi khi đọc file Excel:', err);
        setErrorMessage('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng tệp.');
        setParsedRows([]);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        parseCSV(content);
      };
      reader.readAsText(file);
    }
  };

  const parseExcelWorksheet = (worksheet: ExcelJS.Worksheet) => {
    const firstRow = worksheet.getRow(1);
    let emailCol = -1;
    let nameCol = -1;
    let roleCol = -1;

    firstRow.eachCell((cell, colNumber) => {
      const val = extractCellString(cell.value).toLowerCase();
      if (val.includes('email')) emailCol = colNumber;
      else if (val.includes('họ') || val.includes('tên') || val.includes('name')) nameCol = colNumber;
      else if (val.includes('vai trò') || val.includes('role')) roleCol = colNumber;
    });

    // Fallbacks if header names don't match standard patterns
    if (emailCol === -1) {
      const col2Val = extractCellString(worksheet.getRow(2).getCell(2).value);
      if (col2Val.includes('@')) {
        emailCol = 2;
        nameCol = 3;
        roleCol = 4;
      } else {
        emailCol = 1;
        nameCol = 2;
        roleCol = 3;
      }
    }

    const rows: ParsedMember[] = [];
    const seenEmails = new Set<string>();

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const email = extractCellString(row.getCell(emailCol).value).toLowerCase();
      const fullName = nameCol > 0 ? extractCellString(row.getCell(nameCol).value) : '';
      const roleRaw = roleCol > 0 ? extractCellString(row.getCell(roleCol).value).toUpperCase() : '';

      if (!email && !fullName && !roleRaw) {
        continue;
      }

      let orgRole: 'MEMBER' | 'ORG_ADMIN' | 'ASSESSOR' = 'MEMBER';
      if (roleRaw === 'ORG_ADMIN' || roleRaw === 'ADMIN') orgRole = 'ORG_ADMIN';
      else if (roleRaw === 'ASSESSOR' || roleRaw === 'EVALUATOR') orgRole = 'ASSESSOR';

      if (!email) {
        rows.push({
          email: '—',
          fullName,
          orgRole,
          isValid: false,
          error: 'Thiếu địa chỉ email',
        });
        continue;
      }

      if (!EMAIL_REGEX.test(email)) {
        rows.push({
          email,
          fullName,
          orgRole,
          isValid: false,
          error: 'Email không đúng định dạng',
        });
      } else if (seenEmails.has(email)) {
        rows.push({
          email,
          fullName,
          orgRole,
          isValid: false,
          error: 'Email trùng lặp trong tệp',
        });
      } else {
        seenEmails.add(email);
        rows.push({
          email,
          fullName,
          orgRole,
          isValid: true,
        });
      }
    }

    if (rows.length === 0) {
      setErrorMessage('File Excel không có dòng dữ liệu hợp lệ nào.');
      setParsedRows([]);
      return;
    }

    setParsedRows(rows);
    setStep(2);
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
      const roleRaw = cols[2]?.toUpperCase() || '';

      let orgRole: 'MEMBER' | 'ORG_ADMIN' | 'ASSESSOR' = 'MEMBER';
      if (roleRaw === 'ORG_ADMIN' || roleRaw === 'ADMIN') orgRole = 'ORG_ADMIN';
      else if (roleRaw === 'ASSESSOR' || roleRaw === 'EVALUATOR') orgRole = 'ASSESSOR';

      if (!email) {
        rows.push({
          email: '—',
          fullName,
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
          orgRole,
          isValid: false,
          error: 'Email không đúng định dạng',
        });
      } else if (seenEmails.has(email)) {
        rows.push({
          email,
          fullName,
          orgRole,
          isValid: false,
          error: 'Email trùng lặp trong tệp',
        });
      } else {
        seenEmails.add(email);
        rows.push({
          email,
          fullName,
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

  const handleDownloadSample = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NEXA AI Platform';
      workbook.created = new Date();

      // Sheet 1: Danh sách thành viên mẫu
      const worksheet = workbook.addWorksheet('Mau_Nhap_Thanh_Vien', {
        views: [{ showGridLines: true }],
      });

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Email (*)', key: 'email', width: 32 },
        { header: 'Họ và tên', key: 'fullName', width: 28 },
        { header: 'Vai trò (MEMBER / ASSESSOR / ORG_ADMIN)', key: 'role', width: 38 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }, // Cobalt #2563EB
        };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
          bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
          left: { style: 'thin', color: { argb: 'FF3B82F6' } },
          right: { style: 'thin', color: { argb: 'FF3B82F6' } },
        };
      });

      const sampleRows = [
        {
          stt: 1,
          email: 'hocvien1@truong.edu.vn',
          fullName: 'Nguyễn Văn An',
          role: 'MEMBER',
        },
        {
          stt: 2,
          email: 'giangvien2@truong.edu.vn',
          fullName: 'Trần Thị Bình',
          role: 'ASSESSOR',
        },
        {
          stt: 3,
          email: 'canbo3@truong.edu.vn',
          fullName: 'Lê Hoàng Nam',
          role: 'MEMBER',
        },
      ];

      sampleRows.forEach((item) => {
        const row = worksheet.addRow(item);
        row.height = 24;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Segoe UI', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          if (colNumber === 1 || colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Sheet 2: Hướng dẫn
      const guideSheet = workbook.addWorksheet('Huong_Dan', {
        views: [{ showGridLines: true }],
      });
      guideSheet.columns = [
        { header: 'Cột dữ liệu', key: 'col', width: 24 },
        { header: 'Bắt buộc?', key: 'required', width: 14 },
        { header: 'Mô tả chi tiết & Quy tắc hợp lệ', key: 'desc', width: 68 },
      ];
      const guideHeader = guideSheet.getRow(1);
      guideHeader.height = 28;
      guideHeader.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      const guideData = [
        { col: 'Email', required: 'Bắt buộc (*)', desc: 'Địa chỉ email người dùng hợp lệ (ví dụ: user@donvi.edu.vn). Không được trùng lặp trong tệp.' },
        { col: 'Họ và tên', required: 'Tùy chọn', desc: 'Họ và tên đầy đủ của thành viên.' },
        { col: 'Vai trò', required: 'Tùy chọn', desc: 'Nhập một trong các mã: MEMBER (Thành viên - mặc định), ASSESSOR (Khảo thí viên), ORG_ADMIN (Quản trị viên). Nếu bỏ trống sẽ tự động áp dụng vai trò MEMBER.' },
        { col: 'Định dạng', required: 'Tùy chọn', desc: 'Có thể lưu dạng tệp Excel (.xlsx) hoặc CSV UTF-8 để tải lên hệ thống.' },
      ];

      guideData.forEach((item) => {
        const row = guideSheet.addRow(item);
        row.height = 24;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Segoe UI', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          if (colNumber === 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Mau_nhap_thanh_vien_NEXA.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi tải file mẫu Excel:', err);
    }
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
            orgRole: r.orgRole || 'MEMBER',
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
      <div className="w-full max-w-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Nhập danh sách thành viên
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* 2 Steps indicator */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900 rounded-xl mx-6">
          {[
            { num: 1, label: 'Tải tệp' },
            { num: 2, label: 'Xem trước & Xác nhận' },
          ].map((s) => (
            <button
              key={s.num}
              disabled={step < s.num && parsedRows.length === 0}
              onClick={() => {
                if (parsedRows.length > 0 || s.num === 1) setStep(s.num as 1 | 2);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                step === s.num
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : step > s.num
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-neutral-500'
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

        {/* Download Sample Strip */}
        <div className="px-6 py-2 flex items-center justify-end text-xs text-slate-500 dark:text-neutral-400">
          <button
            onClick={handleDownloadSample}
            type="button"
            className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tải file mẫu (.xlsx)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-2 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
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
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 rounded-2xl p-10 text-center cursor-pointer transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-3">
                <UploadCloud className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {fileName ? fileName : 'Kéo thả tệp vào đây hoặc bấm để tải lên'}
              </p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
                Hỗ trợ định dạng Excel (.xlsx, .xls) hoặc CSV
              </p>
            </div>
          )}

          {/* STEP 2: Preview & Confirm */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Exceed quota alert */}
              {exceedsSeats && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-xl flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold">Vượt quá hạn mức số ghế!</p>
                    <p className="text-[11px] mt-0.5">
                      Danh sách có {validRows.length} bản ghi hợp lệ nhưng tổ chức chỉ còn lại{' '}
                      {remainingSeats} ghế. Vui lòng giảm số dòng hoặc liên hệ nâng cấp gói.
                    </p>
                  </div>
                </div>
              )}

              {/* Action bar: Filter tabs & Class assignment */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'ALL', label: `Tất cả (${parsedRows.length})` },
                    { id: 'VALID', label: `Hợp lệ (${validRows.length})` },
                    { id: 'INVALID', label: `Lỗi (${invalidRows.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterView(tab.id as 'ALL' | 'VALID' | 'INVALID')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        filterView === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {classes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={assignClassSelectId}
                      className="text-xs text-slate-500 dark:text-neutral-400 font-medium whitespace-nowrap"
                    >
                      Gán vào lớp:
                    </label>
                    <select
                      id={assignClassSelectId}
                      value={targetClassId}
                      onChange={(e) => setTargetClassId(e.target.value)}
                      className="h-8 px-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <option value="">Không gán lớp</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* File info strip */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
                <span>
                  Đã tải <strong className="font-mono text-neutral-900 dark:text-neutral-100">{fileName}</strong> ({parsedRows.length} dòng)
                </span>
                <button
                  onClick={() => {
                    setParsedRows([]);
                    setFileName(null);
                    setStep(1);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> <span>Chọn tệp khác</span>
                </button>
              </div>

              {/* Preview table */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-zinc-900/80 text-slate-500 dark:text-neutral-400 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Vai trò</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Không có dòng dữ liệu nào trong mục này.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            row.isValid
                              ? 'hover:bg-slate-50/70 dark:hover:bg-zinc-850/50'
                              : 'bg-red-50/40 dark:bg-red-950/20'
                          }
                        >
                          <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-900 dark:text-neutral-100">
                            {row.email}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-neutral-300">
                            {row.fullName || 'Chưa cập nhật'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            <select
                              value={row.orgRole}
                              onChange={(e) => {
                                const newRole = e.target.value as 'MEMBER' | 'ORG_ADMIN' | 'ASSESSOR';
                                setParsedRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, orgRole: newRole } : r))
                                );
                              }}
                              aria-label={`Vai trò của ${row.email}`}
                              className="h-7 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 text-xs font-medium border-0 cursor-pointer focus:ring-1 focus:ring-blue-600"
                            >
                              <option value="MEMBER">Thành viên</option>
                              <option value="ASSESSOR">Khảo thí viên</option>
                              <option value="ORG_ADMIN">Quản trị viên</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
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
        <div className="px-6 py-4 flex items-center justify-between bg-slate-50/60 dark:bg-zinc-900/60">
          <button
            onClick={onClose}
            className="h-10 px-4 text-xs text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold transition cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="h-10 px-4 text-xs text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 font-semibold transition cursor-pointer"
              >
                Quay lại
              </button>
            )}

            {step === 1 ? (
              <button
                disabled={parsedRows.length === 0}
                onClick={() => setStep(2)}
                className="h-10 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition cursor-pointer shadow-2xs"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={validRows.length === 0 || exceedsSeats || isPending}
                className="flex items-center gap-1.5 h-10 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer"
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
