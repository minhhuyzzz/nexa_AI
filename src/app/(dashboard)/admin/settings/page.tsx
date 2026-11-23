'use client';

import { useState, useEffect, Suspense } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Award,
  Globe,
  RotateCcw,
  Loader2,
} from 'lucide-react';

function AdminSettingsContent() {
  // Loading & Feedback State
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Vận hành & Bảo trì
  const [platformName, setPlatformName] = useState('NEXA AI');
  const [supportEmail, setSupportEmail] = useState('support@nexa.edu.vn');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // 2. Chính sách Điểm thưởng & Chuyên cần
  const [dailyLoginPts, setDailyLoginPts] = useState(1);
  const [streakMilestonePts, setStreakMilestonePts] = useState(10);
  const [contributionApprovedPts, setContributionApprovedPts] = useState(20);
  const [baselineSurveyPts, setBaselineSurveyPts] = useState(0);

  // 3. Múi giờ & Định dạng hiển thị
  const [systemTimezone, setSystemTimezone] = useState('Asia/Ho_Chi_Minh');
  const [dateTimeFormat, setDateTimeFormat] = useState('DD/MM/YYYY HH:mm');

  // Load actual configuration from backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        setLoadingInitial(true);
        setErrorMsg(null);
        const res = await fetch('/api/admin/settings');
        if (!res.ok) {
          throw new Error('Không thể tải cấu hình nền tảng từ máy chủ');
        }
        const data = await res.json();
        if (data.settings && isMounted) {
          const general = (data.settings.general_config as Record<string, unknown>) || {};
          const gamification = (data.settings.gamification_reward_policy as Record<string, unknown>) || {};

          if (typeof general.platformName === 'string') setPlatformName(general.platformName);
          if (typeof general.supportEmail === 'string') setSupportEmail(general.supportEmail);
          if (typeof general.systemTimezone === 'string') setSystemTimezone(general.systemTimezone);
          if (typeof general.dateTimeFormat === 'string') setDateTimeFormat(general.dateTimeFormat);
          if (typeof general.maintenanceMode === 'boolean') setMaintenanceMode(general.maintenanceMode);

          if (typeof gamification.dailyLoginPts === 'number') setDailyLoginPts(gamification.dailyLoginPts);
          if (typeof gamification.streakMilestonePts === 'number') setStreakMilestonePts(gamification.streakMilestonePts);
          if (typeof gamification.contributionApprovedPts === 'number') {
            setContributionApprovedPts(gamification.contributionApprovedPts);
          }
          if (typeof gamification.baselineSurveyPts === 'number') {
            setBaselineSurveyPts(gamification.baselineSurveyPts);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi tải cấu hình');
        }
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: platformName.trim() || 'NEXA AI',
          supportEmail: supportEmail.trim() || 'support@nexa.edu.vn',
          systemTimezone,
          dateTimeFormat,
          maintenanceMode,
          defaultLanguage: 'vi',
          dailyLoginPts: Number(dailyLoginPts) || 1,
          streakMilestonePts: Number(streakMilestonePts) || 10,
          contributionApprovedPts: Number(contributionApprovedPts) || 20,
          baselineSurveyPts: Math.max(0, Number(baselineSurveyPts) || 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu cấu hình');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setPlatformName('NEXA AI');
    setSupportEmail('support@nexa.edu.vn');
    setSystemTimezone('Asia/Ho_Chi_Minh');
    setDateTimeFormat('DD/MM/YYYY HH:mm');
    setMaintenanceMode(false);
    setDailyLoginPts(1);
    setStreakMilestonePts(10);
    setContributionApprovedPts(20);
    setBaselineSurveyPts(0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Cài đặt nền tảng
          </h1>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving || loadingInitial}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
          ) : (
            <Save className="w-4 h-4" strokeWidth={1.75} />
          )}
          <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
            <span>Đã cập nhật và lưu cấu hình nền tảng thành công vào cơ sở dữ liệu.</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
            ĐÃ GHI NHẬT KÝ
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state skeleton */}
      {loadingInitial ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-neutral-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Đang nạp cấu hình hệ thống từ cơ sở dữ liệu...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Vận hành hệ thống & Chế độ bảo trì */}
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Sliders className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Vận hành và Bảo trì
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Thông tin định danh và công tắc bảo trì toàn hệ thống
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                    Tên nền tảng
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    placeholder="NEXA AI"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                    Email hỗ trợ người dùng
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@nexa.edu.vn"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Maintenance mode toggle */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 flex items-start justify-between gap-4">
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Chế độ bảo trì hệ thống
                      </span>
                      {maintenanceMode ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          Đang bảo trì
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Hoạt động bình thường
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Khi kích hoạt, chỉ tài khoản Quản trị viên cấp cao mới có quyền truy cập hệ thống. Toàn bộ người học và tổ chức sẽ nhận thông báo bảo trì định kỳ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    aria-label="Bật tắt chế độ bảo trì"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      maintenanceMode ? 'bg-amber-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Chính sách Điểm thưởng & Chuyên cần */}
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Award className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Điểm thưởng và Chuyên cần
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Cấu hình định mức điểm tích lũy cho các hoạt động của người học
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300">
                      Điểm danh đăng nhập hằng ngày
                    </label>
                    <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      +{dailyLoginPts} điểm / ngày
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={dailyLoginPts}
                    onChange={(e) => setDailyLoginPts(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors tabular-nums"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                    Tự động ghi nhận vào sổ cái điểm khi người học truy cập hệ thống mỗi ngày.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300">
                      Thưởng chuỗi chuyên cần
                    </label>
                    <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      +{streakMilestonePts} điểm / chuỗi 7 ngày
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={streakMilestonePts}
                    onChange={(e) => setStreakMilestonePts(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors tabular-nums"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                    Điểm thưởng động viên khi người học duy trì chuỗi học tập đều đặn.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300">
                      Thưởng duyệt đề xuất đóng góp câu hỏi
                    </label>
                    <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      +{contributionApprovedPts} điểm / đề xuất
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={contributionApprovedPts}
                    onChange={(e) => setContributionApprovedPts(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors tabular-nums"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                    Ghi nhận điểm cho người dùng khi đề xuất câu hỏi được duyệt làm tài liệu tham khảo.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300">
                      Thưởng hoàn thành khảo sát đầu vào
                    </label>
                    <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {baselineSurveyPts > 0 ? `+${baselineSurveyPts} điểm / lần` : '0 điểm (Không cộng điểm)'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={baselineSurveyPts}
                    onChange={(e) => setBaselineSurveyPts(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors tabular-nums"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                    Mức điểm thưởng khi người học hoàn tất bài khảo sát năng lực số đầu vào (đặt 0 để không cộng điểm thưởng).
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Múi giờ & Định dạng hiển thị toàn sàn */}
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Globe className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Múi giờ và Định dạng hiển thị toàn sàn
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Quy chuẩn thời gian cho các bài khảo thí, chứng chỉ số và báo cáo hệ thống
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                    Múi giờ hệ thống
                  </label>
                  <select
                    value={systemTimezone}
                    onChange={(e) => setSystemTimezone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="Asia/Ho_Chi_Minh">GMT+07:00 — Bangkok, Hà Nội, TP.HCM</option>
                    <option value="Asia/Singapore">GMT+08:00 — Singapore, Kuala Lumpur</option>
                    <option value="Asia/Tokyo">GMT+09:00 — Tokyo, Seoul</option>
                    <option value="UTC">GMT+00:00 — Giờ quốc tế UTC</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
                    Áp dụng khi tính toán chu kỳ điểm danh, nộp bài thi và nhật ký kiểm toán.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                    Định dạng ngày giờ hiển thị
                  </label>
                  <select
                    value={dateTimeFormat}
                    onChange={(e) => setDateTimeFormat(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="DD/MM/YYYY HH:mm">DD/MM/YYYY HH:mm — ví dụ: 19/11/2026 15:30</option>
                    <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm — ví dụ: 2026-11-19 15:30</option>
                    <option value="MM/DD/YYYY hh:mm A">MM/DD/YYYY hh:mm A — ví dụ: 19/11/2026 03:30 CH</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
                    Quy chuẩn hiển thị ngày giờ trên chứng chỉ số và các bảng quản trị.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Khôi phục mặc định</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Save className="w-4 h-4" strokeWidth={1.75} />
              )}
              <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải cài đặt hệ thống...
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}
