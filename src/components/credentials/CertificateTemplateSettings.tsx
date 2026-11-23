'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Stamp,
  PenTool,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CertificateCanvas } from './CertificateCanvas';
import {
  CertificateTemplateConfig,
  DEFAULT_CERTIFICATE_TEMPLATE,
} from '@/types/certificate-template';

export function CertificateTemplateSettings() {
  const [config, setConfig] = useState<CertificateTemplateConfig>(DEFAULT_CERTIFICATE_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current config on load
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/credentials/template');
        if (res.ok) {
          const json = await res.json();
          if (json.config) setConfig(json.config);
        }
      } catch (err) {
        console.error('Failed to load certificate template:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await fetch('/api/admin/credentials/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Không thể lưu cấu hình phôi');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (field: 'signatureSvgData' | 'sealSvgData', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Vui lòng chỉ tải lên tệp vector định dạng .svg');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setConfig((prev) => ({
        ...prev,
        [field]: content,
      }));
    };
    reader.readAsText(file);
  };

  const handleResetDefault = () => {
    if (confirm('Khôi phục toàn bộ cấu hình phôi và mộc đỏ về chuẩn mặc định của NEXA AI?')) {
      setConfig(DEFAULT_CERTIFICATE_TEMPLATE);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-neutral-400">
        <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2" />
        Đang tải thông tin cấu hình phôi chứng chỉ...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>Đã lưu thành công cấu hình phôi chứng chỉ. Toàn bộ chứng chỉ cấp mới sẽ áp dụng mẫu này.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {/* 2-COLUMN SPLIT: LEFT FORM CONTROLS (5 COLS) + RIGHT REALTIME LIVE PREVIEW (7 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (5 Cột): Form Cấu hình Phôi */}
        <form onSubmit={handleSave} className="lg:col-span-5 space-y-4">
          {/* Card 1: Người đại diện ký */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <PenTool className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Người đại diện ký (1 người duy nhất)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Chủ tịch HĐ Khảo thí / Giám đốc học thuật
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Họ và tên người ký
                </label>
                <input
                  type="text"
                  value={config.signerName}
                  onChange={(e) => setConfig({ ...config, signerName: e.target.value })}
                  placeholder="Ví dụ: Dr. Michael Henson"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Chức danh / Đơn vị (Tiếng Anh)
                </label>
                <input
                  type="text"
                  value={config.signerTitle}
                  onChange={(e) => setConfig({ ...config, signerTitle: e.target.value })}
                  placeholder="Ví dụ: CHAIRMAN OF THE ASSESSMENT BOARD"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Mẫu chữ ký điện tử
                </label>
                <select
                  value={config.signatureStyle}
                  onChange={(e) => setConfig({ ...config, signatureStyle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-600"
                >
                  <option value="Michael Henson">Chữ ký thư pháp Michael Henson</option>
                  <option value="Thomas Ridley">Chữ ký thư pháp Thomas Ridley</option>
                  <option value="Elena Vance">Chữ ký thư pháp Elena Vance</option>
                  <option value="CUSTOM_SVG">Tải lên tệp chữ ký vector SVG riêng</option>
                </select>

                {config.signatureStyle === 'CUSTOM_SVG' && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700">
                    <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      <span className="text-[11px] text-slate-600 dark:text-neutral-300 font-medium text-center">
                        {config.signatureSvgData ? 'Đã nạp file SVG (Bấm để thay đổi)' : 'Tải lên file chữ ký (.svg)'}
                      </span>
                      <input
                        type="file"
                        accept=".svg,image/svg+xml"
                        onChange={(e) => handleFileUpload('signatureSvgData', e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Con dấu mộc đỏ */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Stamp className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Con dấu mộc đỏ (Official Red Seal)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Đóng đè 1/3 lên góc chữ ký chuẩn quy thức
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Loại con dấu mộc đỏ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, sealType: 'SYSTEM_SVG' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      config.sealType === 'SYSTEM_SVG'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold">Mộc chuẩn NEXA</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Vector SVG siêu nhẹ 3KB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, sealType: 'CUSTOM_SVG' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      config.sealType === 'CUSTOM_SVG'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold">Tải lên mộc riêng</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Tệp SVG của tổ chức</span>
                  </button>
                </div>
              </div>

              {config.sealType === 'SYSTEM_SVG' && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Dòng chữ viền trên con dấu (Tiếng Anh)
                  </label>
                  <input
                    type="text"
                    value={config.sealText}
                    onChange={(e) => setConfig({ ...config, sealText: e.target.value })}
                    placeholder="Ví dụ: DIGITAL COMPETENCE ASSESSMENT COUNCIL"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 font-medium"
                  />
                </div>
              )}

              {config.sealType === 'CUSTOM_SVG' && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700">
                  <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                    <span className="text-[11px] text-slate-600 dark:text-neutral-300 font-medium text-center">
                      {config.sealSvgData ? 'Đã nạp file mộc đỏ SVG (Bấm đổi)' : 'Tải lên con dấu mộc đỏ (.svg)'}
                    </span>
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={(e) => handleFileUpload('sealSvgData', e)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Thời hạn hiệu lực */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Thời hạn hiệu lực văn bằng
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Chuẩn của 95% chứng chỉ kỹ năng số quốc tế
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 cursor-pointer">
                <input
                  type="radio"
                  name="validityType"
                  value="LIFETIME"
                  checked={config.validityType === 'LIFETIME'}
                  onChange={() => setConfig({ ...config, validityType: 'LIFETIME', validityYears: null })}
                  className="w-4 h-4 text-blue-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Không thời hạn (Lifetime — Khuyên dùng)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                    Giá trị vĩnh viễn, học viên dễ dàng đính kèm hồ sơ LinkedIn suốt sự nghiệp.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 cursor-pointer">
                <input
                  type="radio"
                  name="validityType"
                  value="CUSTOM_YEARS"
                  checked={config.validityType === 'CUSTOM_YEARS'}
                  onChange={() => setConfig({ ...config, validityType: 'CUSTOM_YEARS', validityYears: 2 })}
                  className="w-4 h-4 text-blue-600 mt-0.5"
                />
                <div className="w-full">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Có thời hạn định kỳ
                  </span>
                  {config.validityType === 'CUSTOM_YEARS' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.validityYears || 2}
                        onChange={(e) => setConfig({ ...config, validityYears: Number(e.target.value) })}
                        className="w-16 px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono"
                      />
                      <span className="text-[11px] text-slate-500">năm kể từ ngày cấp</span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/80 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-zinc-950 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu cấu hình phôi</span>
            </button>
          </div>
        </form>

        {/* CỘT PHẢI (7 Cột): Realtime Live Preview Thu Nhỏ Vừa Vặn Đúng Tỉ Lệ A4 Ngang */}
        <div className="lg:col-span-7 sticky top-6 space-y-3">
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Xem trước phôi chứng chỉ trực tiếp
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                  A4 Ngang (1.414 : 1)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Cập nhật tức thì</span>
              </div>
            </div>

            {/* Canvas Display in Perfectly Scaled Landscape A4 Proportions */}
            <div className="w-full">
              <CertificateCanvas
                isSample={true}
                candidateName="Nguyen Van A"
                signerName={config.signerName}
                signerTitle={config.signerTitle}
                signatureStyle={config.signatureStyle}
                signatureSvgData={config.signatureSvgData}
                sealType={config.sealType}
                sealSvgData={config.sealSvgData}
                sealText={config.sealText}
                validityType={config.validityType}
                validityYears={config.validityYears}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
