'use client';

import React, { useState, useEffect, useId } from 'react';
import QRCode from 'qrcode';
import {
  KeyRound,
  Search,
  RotateCw,
  Copy,
  Check,
  Trash2,
  Clock,
  Users,
  QrCode,
  Plus,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { JoinCodeItem, OrgClassItem } from './types';

interface JoinCodesViewProps {
  organizationId: string;
  joinCodes: JoinCodeItem[];
  classes: OrgClassItem[];
  loading: boolean;
  onRefresh: () => void;
  onCodeCreated: () => void;
  onCodeRevoked: () => void;
}

export function JoinCodesView({
  organizationId,
  joinCodes,
  classes,
  loading,
  onRefresh,
  onCodeCreated,
  onCodeRevoked,
}: JoinCodesViewProps) {
  const searchInputId = useId();
  const codeTitleInputId = useId();
  const classSelectId = useId();
  const maxUsesInputId = useId();
  const expiresInSelectId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'>('ALL');

  // Form states for creating code
  const [title, setTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [maxUses, setMaxUses] = useState<number>(100);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // QR preview state
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');
  const [selectedCodeForQr, setSelectedCodeForQr] = useState<JoinCodeItem | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  // Generate preview QR code
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nexa.edu.vn';
    const sampleUrl = selectedCodeForQr
      ? `${origin}/join/org/${selectedCodeForQr.code}`
      : `${origin}/join/org/NX-SAMPLE`;

    QRCode.toDataURL(sampleUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#171717',
        light: '#FFFFFF',
      },
    })
      .then((url) => setPreviewQrDataUrl(url))
      .catch(() => setPreviewQrDataUrl(''));
  }, [selectedCodeForQr]);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          maxUses: Number(maxUses),
          expiresInDays: Number(expiresInDays),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Không thể tạo mã tham gia');
      }

      setCreateSuccess('Đã tạo mã tham gia thành công!');
      setTitle('');
      setMaxUses(100);
      setExpiresInDays(30);
      onCodeCreated();

      if (json.joinCode) {
        setSelectedCodeForQr(json.joinCode);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Lỗi khi tạo mã');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (codeId: string) => {
    setRevokingId(codeId);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Không thể thu hồi mã tham gia');
      }
      setConfirmRevokeId(null);
      onCodeRevoked();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi thu hồi');
    } finally {
      setRevokingId(null);
    }
  };

  const copyJoinUrl = (code: JoinCodeItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/join/org/${code.code}`;
    navigator.clipboard.writeText(url);
    setCopiedCodeId(code.id);
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2000);
  };

  const getCodeStatus = (code: JoinCodeItem) => {
    if (code.is_revoked) {
      return {
        label: 'Đã thu hồi',
        badgeClass:
          'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700',
      };
    }
    const isExpired = new Date(code.expires_at) < new Date();
    if (isExpired) {
      return {
        label: 'Hết hạn',
        badgeClass:
          'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      };
    }
    if (code.used_count >= code.max_uses) {
      return {
        label: 'Hết lượt',
        badgeClass:
          'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      };
    }
    return {
      label: 'Đang hoạt động',
      badgeClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    };
  };

  const filteredCodes = joinCodes.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim());

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') {
      return !c.is_revoked && new Date(c.expires_at) >= new Date() && c.used_count < c.max_uses;
    }
    if (statusFilter === 'REVOKED') {
      return c.is_revoked;
    }
    if (statusFilter === 'EXPIRED') {
      return !c.is_revoked && new Date(c.expires_at) < new Date();
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-md border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Quản lý mã gia nhập tổ chức
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 tabular-nums">
                {joinCodes.filter((c) => !c.is_revoked && new Date(c.expires_at) >= new Date()).length} mã khả dụng
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Cung cấp mã hoặc mã QR để học viên và nhân sự quét/nhập tham gia nhanh chóng.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới danh sách
        </button>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Code List Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & filter bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:flex-1">
              <label htmlFor={searchInputId} className="sr-only">
                Tìm kiếm theo mã hoặc tên đợt
              </label>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id={searchInputId}
                type="text"
                placeholder="Tìm kiếm theo mã (NX-...) hoặc tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto">
              {(
                [
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'ACTIVE', label: 'Khả dụng' },
                  { id: 'EXPIRED', label: 'Hết hạn' },
                  { id: 'REVOKED', label: 'Đã thu hồi' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2 py-1 text-xs rounded font-medium transition ${
                    statusFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Mã tham gia</th>
                    <th className="py-2.5 px-3">Lượt dùng</th>
                    <th className="py-2.5 px-3">Hạn hiệu lực</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                        <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {searchQuery ? 'Không tìm thấy mã nào phù hợp' : 'Chưa có mã gia nhập nào'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                          Sử dụng biểu mẫu bên phải để tạo mã tham gia mới cho tổ chức.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((code) => {
                      const status = getCodeStatus(code);
                      const percentUsed = Math.min(
                        100,
                        Math.round((code.used_count / Math.max(1, code.max_uses)) * 100)
                      );
                      const isSelected = selectedCodeForQr?.id === code.id;

                      return (
                        <tr
                          key={code.id}
                          onClick={() => setSelectedCodeForQr(code)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/30'
                              : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900 tracking-wider">
                                  {code.code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-neutral-300 font-medium mt-1 truncate max-w-[150px]">
                                {code.title || 'Mã học viên'}
                              </p>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="w-24 space-y-1">
                              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                                <span>{code.used_count}</span>
                                <span>/ {code.max_uses}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    percentUsed > 90
                                      ? 'bg-rose-500'
                                      : percentUsed > 70
                                        ? 'bg-amber-500'
                                        : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${percentUsed}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono tabular-nums text-slate-500 dark:text-neutral-400 text-[11px]">
                            {new Date(code.expires_at).toLocaleDateString('vi-VN')}
                          </td>

                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${status.badgeClass}`}>
                              {status.label}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => copyJoinUrl(code)}
                                title="Sao chép link gia nhập"
                                className="p-1.5 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
                              >
                                {copiedCodeId === code.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {!code.is_revoked && (
                                <>
                                  {confirmRevokeId === code.id ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRevoke(code.id)}
                                      disabled={revokingId === code.id}
                                      className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition"
                                    >
                                      {revokingId === code.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        'Hủy'
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmRevokeId(code.id)}
                                      title="Thu hồi mã"
                                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Create Code & Live QR Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleCreateCode}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3.5"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Tạo mã gia nhập mới
              </h3>
            </div>

            {createSuccess && (
              <div className="p-2.5 text-xs bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            {createError && (
              <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div>
              <label htmlFor={codeTitleInputId} className="block text-xs font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Tên hoặc mục đích mã
              </label>
              <input
                id={codeTitleInputId}
                type="text"
                placeholder="Ví dụ: Đợt đánh giá tân sinh viên K18"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={classSelectId} className="block text-xs font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                  Lớp mặc định
                </label>
                <select
                  id={classSelectId}
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Không gán lớp</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={maxUsesInputId} className="block text-xs font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                  Số lượt tối đa
                </label>
                <input
                  id={maxUsesInputId}
                  type="number"
                  min="1"
                  max="10000"
                  value={maxUses}
                  onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor={expiresInSelectId} className="block text-xs font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Thời hạn hiệu lực
              </label>
              <select
                id={expiresInSelectId}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
              >
                <option value={7}>7 ngày (1 tuần)</option>
                <option value={14}>14 ngày (2 tuần)</option>
                <option value={30}>30 ngày (1 tháng)</option>
                <option value={90}>90 ngày (1 quý)</option>
                <option value={180}>180 ngày (Nửa năm)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang khởi tạo mã...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Tạo mã gia nhập ngay
                </>
              )}
            </button>
          </form>

          {/* Live QR & Join Preview Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 mb-3">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                {selectedCodeForQr ? `Mã: ${selectedCodeForQr.code}` : 'Xem trước QR gia nhập'}
              </span>
              {selectedCodeForQr && (
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedCodeForQr.used_count}/{selectedCodeForQr.max_uses} lượt
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-zinc-950/60 rounded border border-dashed border-slate-200 dark:border-zinc-800 text-center">
              {previewQrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewQrDataUrl}
                  alt="QR Code gia nhập"
                  className="w-32 h-32 rounded bg-white p-1 border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 rounded text-slate-400">
                  <QrCode className="w-12 h-12 opacity-40" />
                </div>
              )}

              <p className="font-mono text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400 mt-2.5">
                {selectedCodeForQr ? selectedCodeForQr.code : 'NX-XXXX-XXXX'}
              </p>

              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-[220px]">
                {selectedCodeForQr
                  ? selectedCodeForQr.title || 'Mã quét tham gia tổ chức'
                  : 'Chọn một mã bên trái hoặc tạo mới để hiển thị QR đầy đủ'}
              </p>

              {selectedCodeForQr && (
                <button
                  type="button"
                  onClick={() => copyJoinUrl(selectedCodeForQr)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                >
                  {copiedCodeId === selectedCodeForQr.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã chép liên kết</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sao chép URL gia nhập</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
