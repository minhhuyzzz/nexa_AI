'use client';

import { useState } from 'react';
import { X, Building2, User, Phone, Mail, Hash, Loader2, Check } from 'lucide-react';

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

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
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
    setCode(`${acronym}2026`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-md border border-slate-200 shadow-md max-w-lg w-full overflow-hidden text-slate-900 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h3 className="text-sm font-bold text-slate-900">
              {initialData?.id ? 'Kích Hoạt / Chỉnh Sửa Đơn Vị B2B' : 'Thêm Tổ Chức / Trường Học Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên Trường học / Doanh nghiệp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={Boolean(initialData?.id)}
              placeholder="Ví dụ: Đại học Quốc gia TP.HCM"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded border border-slate-200 bg-white disabled:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Mã Tổ Chức (org_code) <span className="text-rose-500">*</span>
                </label>
                {!initialData?.id && (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-[10px] text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Gợi ý mã
                  </button>
                )}
              </div>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                <input
                  type="text"
                  required
                  placeholder="VD: IUH2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded border border-slate-200 bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-sky-600 uppercase"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Sinh viên nhập mã này khi đăng ký để tự động gắn vào trường và nhận VIP.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Loại hình đơn vị
              </label>
              <select
                disabled={Boolean(initialData?.id)}
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded border border-slate-200 bg-white disabled:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-600"
              >
                <option value="ACADEMY">Trường Đại học / Cao đẳng / Viện</option>
                <option value="ENTERPRISE">Doanh nghiệp / Tập đoàn</option>
              </select>
            </div>
          </div>

          {!initialData?.id && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Người liên hệ đại diện
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                    <input
                      type="text"
                      placeholder="Thầy/Cô đại diện"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại / Zalo
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                    <input
                      type="text"
                      placeholder="0912 xxx xxx"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded border border-slate-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email công tác
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                    <input
                      type="email"
                      placeholder="contact@school.edu.vn"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded border border-slate-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quy mô dự kiến (Sinh viên)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={50000}
                    value={expectedLearners}
                    onChange={(e) => setExpectedLearners(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Ghi chú hợp đồng / Yêu cầu riêng
            </label>
            <textarea
              rows={2}
              placeholder="VD: Hợp đồng đào tạo niên khóa 2026-2027, xuất báo cáo chuẩn SPSS..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{initialData?.id ? 'Kích hoạt / Cập nhật' : 'Tạo đơn vị'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
