'use client';

import { useState } from 'react';
import { X, Building2, User, Phone, Mail, Hash, Loader2, Check, AlertCircle } from 'lucide-react';

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id?: string;
    name?: string;
    code?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    expectedLearners?: number;
    notes?: string;
  };
}

export function AddOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AddOrganizationModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [type, setType] = useState<'ACADEMY' | 'ENTERPRISE'>('ACADEMY');
  const [contactName, setContactName] = useState(initialData?.contactName || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [expectedLearners, setExpectedLearners] = useState(
    initialData?.expectedLearners ? String(initialData.expectedLearners) : '500'
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateField = (fieldName: string, value: string) => {
    let err = '';
    if (fieldName === 'name') {
      if (!value.trim()) {
        err = 'Vui lòng nhập tên trường hoặc doanh nghiệp (tối thiểu 2 ký tự).';
      } else if (value.trim().length < 2) {
        err = 'Tên đơn vị quá ngắn, vui lòng nhập tối thiểu 2 ký tự.';
      }
    } else if (fieldName === 'code') {
      const clean = value.trim().toUpperCase();
      if (!clean) {
        err = 'Mã tổ chức không được để trống (ví dụ: IUH2026).';
      } else if (clean.length < 2) {
        err = 'Mã tổ chức cần tối thiểu 2 ký tự viết hoa không dấu.';
      } else if (!/^[A-Z0-9_-]+$/.test(clean)) {
        err = 'Mã chỉ được chứa chữ cái in hoa, chữ số, dấu gạch dưới hoặc gạch nối.';
      }
    } else if (fieldName === 'contactEmail') {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        err = 'Định dạng email chưa đúng (ví dụ: contact@truonghoc.edu.vn).';
      }
    } else if (fieldName === 'expectedLearners') {
      const num = Number(value);
      if (!value || isNaN(num) || num <= 0) {
        err = 'Quy mô người học phải là số dương lớn hơn 0.';
      }
    }

    setFieldErrors((prev) => ({ ...prev, [fieldName]: err }));
    return !err;
  };

  const handleBlur = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate all required fields
    const isNameValid = initialData?.id ? true : validateField('name', name);
    const isCodeValid = validateField('code', code);
    const isEmailValid = validateField('contactEmail', contactEmail);
    const isLearnersValid = validateField('expectedLearners', expectedLearners);

    setTouched({
      name: true,
      code: true,
      contactEmail: true,
      expectedLearners: true,
    });

    if (!isNameValid || !isCodeValid || !isEmailValid || !isLearnersValid) {
      setErrorMsg('Vui lòng kiểm tra lại các trường thông tin có cảnh báo đỏ bên dưới.');
      return;
    }

    setSubmitting(true);

    try {
      const isEdit = Boolean(initialData?.id);
      const url = '/api/admin/organizations';
      const method = isEdit ? 'PATCH' : 'POST';
      const payload = isEdit
        ? {
            id: initialData?.id,
            code: code.trim().toUpperCase(),
            status: 'ACTIVE',
            notes,
          }
        : {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            type,
            contactName,
            contactPhone,
            contactEmail,
            expectedLearners: Number(expectedLearners) || 500,
            notes,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác thất bại');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateCode = () => {
    if (!name.trim()) return;
    const words = name
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/);
    const acronym = words.map((w) => w[0]?.toUpperCase()).join('').slice(0, 5);
    const generated = `${acronym}2026`;
    setCode(generated);
    validateField('code', generated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-neutral-900 dark:text-neutral-100 font-sans">
        {/* Header - No horizontal dividing border */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <Building2 className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {initialData?.id ? 'Kích hoạt / Chỉnh sửa đơn vị B2B' : 'Thêm tổ chức / Trường học mới'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Thiết lập thông tin và cấp mã định danh tham gia hệ thống
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form - 1-Column Layout & Top Label */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* 1. Tên trường / Doanh nghiệp */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
              Tên Trường học / Doanh nghiệp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={Boolean(initialData?.id) || submitting}
              placeholder="Ví dụ: Đại học Quốc gia TP.HCM"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched.name) validateField('name', e.target.value);
              }}
              onBlur={() => handleBlur('name', name)}
              className={`w-full text-xs px-3.5 py-2.5 min-h-[44px] rounded-lg border bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                touched.name && fieldErrors.name
                  ? 'border-rose-400 dark:border-rose-500'
                  : 'border-slate-200 dark:border-zinc-800 focus:border-blue-600'
              }`}
            />
            {touched.name && fieldErrors.name && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{fieldErrors.name}</span>
              </p>
            )}
          </div>

          {/* 2. Loại hình đơn vị */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
              Loại hình đơn vị
            </label>
            <select
              disabled={Boolean(initialData?.id) || submitting}
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full text-xs px-3.5 py-2.5 min-h-[44px] rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none focus:border-blue-600"
            >
              <option value="ACADEMY">Trường Đại học / Cao đẳng / Viện đào tạo</option>
              <option value="ENTERPRISE">Doanh nghiệp / Tập đoàn</option>
            </select>
          </div>

          {/* 3. Mã Tổ Chức (org_code) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                Mã tổ chức (org_code) <span className="text-rose-500">*</span>
              </label>
              {!initialData?.id && (
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold cursor-pointer transition-colors"
                >
                  Tự động gợi ý mã
                </button>
              )}
            </div>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
              <input
                type="text"
                required
                disabled={submitting}
                placeholder="VD: IUH2026"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setCode(val);
                  if (touched.code) validateField('code', val);
                }}
                onBlur={() => handleBlur('code', code)}
                className={`w-full text-xs pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-lg border bg-white dark:bg-zinc-900 font-mono font-bold uppercase text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  touched.code && fieldErrors.code
                    ? 'border-rose-400 dark:border-rose-500'
                    : 'border-slate-200 dark:border-zinc-800 focus:border-blue-600'
                }`}
              />
            </div>
            {touched.code && fieldErrors.code ? (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{fieldErrors.code}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Người dùng nhập mã này khi đăng ký hoặc tham gia để tự động liên kết vào tổ chức.
              </p>
            )}
          </div>

          {!initialData?.id && (
            <>
              {/* 4. Người liên hệ đại diện */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                  Người liên hệ đại diện
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="text"
                    disabled={submitting}
                    placeholder="Thầy/Cô hoặc Quản lý đại diện"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* 5. Số điện thoại */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                  Số điện thoại / Zalo
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="text"
                    disabled={submitting}
                    placeholder="0912 xxx xxx"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* 6. Email công tác */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                  Email công tác
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="email"
                    disabled={submitting}
                    placeholder="contact@school.edu.vn"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (touched.contactEmail) validateField('contactEmail', e.target.value);
                    }}
                    onBlur={() => handleBlur('contactEmail', contactEmail)}
                    className={`w-full text-xs pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-lg border bg-white dark:bg-zinc-900 font-mono text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                      touched.contactEmail && fieldErrors.contactEmail
                        ? 'border-rose-400 dark:border-rose-500'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-blue-600'
                    }`}
                  />
                </div>
                {touched.contactEmail && fieldErrors.contactEmail && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{fieldErrors.contactEmail}</span>
                  </p>
                )}
              </div>

              {/* 7. Quy mô dự kiến */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                  Quy mô dự kiến (Người học)
                </label>
                <input
                  type="number"
                  min={50}
                  max={50000}
                  disabled={submitting}
                  value={expectedLearners}
                  onChange={(e) => {
                    setExpectedLearners(e.target.value);
                    if (touched.expectedLearners) validateField('expectedLearners', e.target.value);
                  }}
                  onBlur={() => handleBlur('expectedLearners', expectedLearners)}
                  className={`w-full text-xs px-3.5 py-2.5 min-h-[44px] rounded-lg border bg-white dark:bg-zinc-900 font-mono text-neutral-900 dark:text-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                    touched.expectedLearners && fieldErrors.expectedLearners
                      ? 'border-rose-400 dark:border-rose-500'
                      : 'border-slate-200 dark:border-zinc-800 focus:border-blue-600'
                  }`}
                />
                {touched.expectedLearners && fieldErrors.expectedLearners && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{fieldErrors.expectedLearners}</span>
                  </p>
                )}
              </div>
            </>
          )}

          {/* 8. Ghi chú hợp đồng */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
              Ghi chú hợp đồng / Yêu cầu riêng
            </label>
            <textarea
              rows={2}
              disabled={submitting}
              placeholder="VD: Hợp đồng đào tạo niên khóa 2026-2027, xuất báo cáo chuẩn..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          {/* Footer buttons - Touch target >= 44px on mobile */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] sm:min-h-0 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu thông tin...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{initialData?.id ? 'Kích hoạt / Cập nhật' : 'Tạo đơn vị B2B'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
