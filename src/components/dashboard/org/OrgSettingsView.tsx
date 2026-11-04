'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  Trash2,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  Fingerprint,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface OrgSettingsViewProps {
  org: {
    id: string;
    name: string;
    slug: string;
    code?: string | null;
    type?: string | null;
    logo_url?: string | null;
    description?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  };
  currentMembers?: number;
  userRole?: string;
  isManager?: boolean;
}

const ORG_TYPES = [
  { value: 'UNIVERSITY', label: 'Trường Đại học / Học viện' },
  { value: 'COLLEGE', label: 'Trường Cao đẳng / Trung cấp' },
  { value: 'SCHOOL', label: 'Trường Phổ thông / Trung học' },
  { value: 'ENTERPRISE', label: 'Doanh nghiệp / Tập đoàn' },
  { value: 'GOVERNMENT', label: 'Cơ quan / Tổ chức Nhà nước' },
  { value: 'EDTECH', label: 'Tổ chức Đào tạo / EdTech' },
  { value: 'OTHER', label: 'Khác' },
];

export function OrgSettingsView({
  org,
  userRole = 'ORG_ADMIN',
  isManager = true,
}: OrgSettingsViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group A: Organization Profile State
  const [name, setName] = useState(org.name || '');
  const [type, setType] = useState(org.type || 'UNIVERSITY');
  const [logoUrl, setLogoUrl] = useState(org.logo_url || '');
  const [description, setDescription] = useState(org.description || '');

  // Group B: Contact Information State
  const [contactName, setContactName] = useState(org.contact_name || '');
  const [contactEmail, setContactEmail] = useState(org.contact_email || '');
  const [contactPhone, setContactPhone] = useState(org.contact_phone || '');

  // Initial Snapshot for isDirty & Reset
  const [initialSnapshot, setInitialSnapshot] = useState({
    name: org.name || '',
    type: org.type || 'UNIVERSITY',
    logoUrl: org.logo_url || '',
    description: org.description || '',
    contactName: org.contact_name || '',
    contactEmail: org.contact_email || '',
    contactPhone: org.contact_phone || '',
  });

  const isDirty =
    name.trim() !== initialSnapshot.name.trim() ||
    type !== initialSnapshot.type ||
    logoUrl !== initialSnapshot.logoUrl ||
    description.trim() !== initialSnapshot.description.trim() ||
    contactName.trim() !== initialSnapshot.contactName.trim() ||
    contactEmail.trim() !== initialSnapshot.contactEmail.trim() ||
    contactPhone.trim() !== initialSnapshot.contactPhone.trim();

  // Status & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Beforeunload prompt when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Copy helper
  const copyToClipboard = async (text: string, type: 'code' | 'slug') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  // Image Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Tệp được chọn không phải là hình ảnh hợp lệ (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh vượt quá giới hạn cho phép (tối đa 2MB).');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset to initial values
  const handleReset = () => {
    setName(initialSnapshot.name);
    setType(initialSnapshot.type);
    setLogoUrl(initialSnapshot.logoUrl);
    setDescription(initialSnapshot.description);
    setContactName(initialSnapshot.contactName);
    setContactEmail(initialSnapshot.contactEmail);
    setContactPhone(initialSnapshot.contactPhone);
    setErrorMessage('');
    setSaveSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || isSaving || !isManager) return;

    // Validation
    if (!name.trim()) {
      setErrorMessage('Tên tổ chức không được để trống.');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMessage('Tên tổ chức phải có ít nhất 2 ký tự.');
      return;
    }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setErrorMessage('Email liên hệ không đúng định dạng.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/org/${org.slug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationData: {
            name: name.trim(),
            type,
            logo_url: logoUrl || null,
            description: description.trim() || null,
            contact_name: contactName.trim() || null,
            contact_email: contactEmail.trim() || null,
            contact_phone: contactPhone.trim() || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi lưu thay đổi.');
      }

      // Update snapshot
      const updatedSnapshot = {
        name: name.trim(),
        type,
        logoUrl,
        description: description.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
      };
      setInitialSnapshot(updatedSnapshot);
      setSaveSuccess(true);
      router.refresh();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  // Monogram initials fallback
  const orgInitials = name.trim()
    ? name
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'NX';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ============================================================ */}
      {/* 1. PAGE HEADER                                              */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Cài đặt tổ chức
            </h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              @{org.slug}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Quản lý hồ sơ nhận diện, thông tin người phụ trách và mã định danh của đơn vị.
          </p>
        </div>

        {/* Global Action State Bar (Desktop) */}
        {isDirty && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoàn tác</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving || !isManager}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK BANNERS */}
      {saveSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-xs sm:text-sm font-medium">
            Đã lưu thông tin hồ sơ tổ chức thành công.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="text-xs sm:text-sm font-medium">{errorMessage}</div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. GROUP A: HỒ SƠ TỔ CHỨC                                   */}
      {/* ============================================================ */}
      <section className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 sm:p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Hồ sơ tổ chức
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Thông tin thương hiệu và nhận diện hiển thị trên toàn bộ không gian đào tạo và báo cáo.
          </p>
        </div>

        {/* Logo / Avatar Section */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
            Logo tổ chức
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Visual Preview */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={name || 'Logo'}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center tracking-wider select-none">
                  {orgInitials}
                </div>
              )}
            </div>

            {/* Upload & Actions */}
            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={!isManager}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isManager}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                  <span>Thay logo</span>
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={!isManager}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa logo</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                Tải ảnh tệp PNG, JPG, WebP hoặc SVG (tối đa 2MB). Xem trước ngay trên khung hình.
              </p>
            </div>
          </div>
        </div>

        {/* Tên & Loại hình tổ chức */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="org-name"
              className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5"
            >
              Tên tổ chức <span className="text-rose-500">*</span>
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isManager}
              placeholder="Ví dụ: Trường Đại học FPT, Tập đoàn Viettel..."
              className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-500 transition-colors disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="org-type"
              className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5"
            >
              Loại hình tổ chức
            </label>
            <select
              id="org-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!isManager}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {ORG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mô tả ngắn */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="org-description"
              className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200"
            >
              Mô tả ngắn
            </label>
            <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
              {description.length}/500
            </span>
          </div>
          <textarea
            id="org-description"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isManager}
            placeholder="Giới thiệu ngắn gọn về sứ mệnh, quy mô hoặc định hướng đào tạo năng lực số của đơn vị..."
            className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-500 transition-colors resize-y disabled:opacity-60"
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. GROUP B: THÔNG TIN LIÊN HỆ                                */}
      {/* ============================================================ */}
      <section className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Thông tin liên hệ
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Đầu mối đại diện tiếp nhận thông báo vận hành, hỗ trợ kỹ thuật và thông tin bản quyền.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Người phụ trách */}
          <div>
            <label
              htmlFor="contact-name"
              className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5"
            >
              Người phụ trách
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={!isManager}
                placeholder="Họ và tên người đại diện"
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Email liên hệ */}
          <div>
            <label
              htmlFor="contact-email"
              className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5"
            >
              Email liên hệ
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!isManager}
                placeholder="contact@donvi.edu.vn"
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label
              htmlFor="contact-phone"
              className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5"
            >
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!isManager}
                placeholder="024 1234 5678 / 0912..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. GROUP C: THÔNG TIN ĐỊNH DANH — CHỈ ĐỌC                   */}
      {/* ============================================================ */}
      <section className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thông tin định danh &bull; Chỉ đọc
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Mã đơn vị và đường dẫn kỹ thuật được cấp cố định để đảm bảo tính toàn vẹn dữ liệu và liên kết hệ thống.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Mã đơn vị */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Mã đơn vị
              </div>
              <div className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-0.5 tabular-nums">
                {org.code || 'CHƯA CẤP'}
              </div>
            </div>
            {org.code && (
              <button
                type="button"
                onClick={() => copyToClipboard(org.code || '', 'code')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
                title="Sao chép mã đơn vị"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">Sao chép</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Đường dẫn Slug */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex items-center justify-between gap-3">
            <div className="min-w-0 pr-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Đường dẫn tổ chức
              </div>
              <div className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                /org/{org.slug}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(`/org/${org.slug}`, 'slug')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer shrink-0"
              title="Sao chép đường dẫn"
            >
              {copiedSlug ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. BOTTOM ACTION BAR (Sticky on scroll when dirty)          */}
      {/* ============================================================ */}
      <div className="pt-2 flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-neutral-400">
          {isDirty ? (
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Bạn có thay đổi chưa lưu
            </span>
          ) : (
            <span>Mọi thay đổi đã được đồng bộ với hệ thống.</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={!isDirty || isSaving || !isManager}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
