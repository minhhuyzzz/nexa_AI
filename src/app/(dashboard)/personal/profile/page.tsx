'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  User,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Award,
  Trophy,
  ArrowRight,
  ExternalLink,
  Download,
  Loader2,
  Sparkles,
  Mail,
  GraduationCap,
  Shield,
  Bell,
  Monitor,
  Layers,
  FileText,
  Calendar,
  BarChart3,
  Megaphone,
  Palette,
  Sun,
  Moon,
  Laptop,
  Zap,
  Clock,
  Pencil,
  X,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/hooks/useTheme';

interface ProfileData {
  id: string;
  fullName?: string;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  isGoogleAuth: boolean;
  points: number;
  levelNumber: number;
  levelCode: string;
  levelNextTarget: number;
  plan_tier?: string;
}

interface CredentialItem {
  id: string;
  credential_id: string;
  level: string;
  hash: string;
  issued_at: string;
}

interface LearningStats {
  completedAssessments: number;
}

export default function LearnerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" strokeWidth={1.75} />
          <p className="text-xs">Đang tải hồ sơ &amp; cài đặt...</p>
        </div>
      }
    >
      <LearnerProfileContent />
    </Suspense>
  );
}

function LearnerProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { isDarkMode } = useTheme();

  // Tab State: 'PROFILE' | 'CREDENTIALS' (Tab Năng lực 5 miền đã loại bỏ theo yêu cầu)
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'CREDENTIALS'>(
    tabParam === 'credentials' ? 'CREDENTIALS' : 'PROFILE'
  );

  useEffect(() => {
    if (tabParam === 'credentials') setActiveTab('CREDENTIALS');
    else setActiveTab('PROFILE');
  }, [tabParam]);

  // Main Data States
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    completedAssessments: 12,
  });
  const [loading, setLoading] = useState(true);

  // Subnav Anchor state
  const [activeSection, setActiveSection] = useState<'privacy' | 'notifications' | 'appearance' | 'billing' | 'account'>('privacy');

  // Avatar & Nickname Edit States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEditNicknameModal, setShowEditNicknameModal] = useState(false);
  const [editNicknameValue, setEditNicknameValue] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals for Danger Actions
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Settings: Section 1 - Privacy & Visibility
  const [profileVisibility, setProfileVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'ORG_ONLY'>('PUBLIC');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [shareCertQr, setShareCertQr] = useState(true);

  // Settings: Section 2 - Notifications
  const [notifyNewAssessment, setNotifyNewAssessment] = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);
  const [notifyScoreReady, setNotifyScoreReady] = useState(true);
  const [notifySystemUpdates, setNotifySystemUpdates] = useState(false);

  // Settings: Section 3 - Appearance
  const [colorMode, setColorMode] = useState<'light' | 'dark' | 'system'>('system');

  // Load profile and stats
  const loadProfile = useCallback(async () => {
    try {
      // 1. Load user profile
      const res = await fetch('/api/personal/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setEditNicknameValue(data.profile.nickname || '');
        }
        if (data.credentials) {
          setCredentials(data.credentials);
        }
      }

      // 2. Load competency stats (chỉ lấy số bài hoàn thành)
      try {
        const compRes = await fetch('/api/personal/competency-profile');
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData.profile) {
            setLearningStats({
              completedAssessments: compData.profile.totalAssessmentsCompleted ?? 12,
            });
          }
        }
      } catch {
        // Fallback
      }

      // 3. Load user settings from Supabase user_metadata if available
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.settings) {
        const s = user.user_metadata.settings;
        if (s.profileVisibility) setProfileVisibility(s.profileVisibility);
        if (s.showOnLeaderboard !== undefined) setShowOnLeaderboard(s.showOnLeaderboard);
        if (s.shareCertQr !== undefined) setShareCertQr(s.shareCertQr);
        if (s.notifyNewAssessment !== undefined) setNotifyNewAssessment(s.notifyNewAssessment);
        if (s.notifyDeadline !== undefined) setNotifyDeadline(s.notifyDeadline);
        if (s.notifyScoreReady !== undefined) setNotifyScoreReady(s.notifyScoreReady);
        if (s.notifySystemUpdates !== undefined) setNotifySystemUpdates(s.notifySystemUpdates);
      }

      // Detect current theme mode from localStorage
      const savedTheme = localStorage.getItem('nexa_theme');
      if (savedTheme === 'dark') setColorMode('dark');
      else if (savedTheme === 'light') setColorMode('light');
      else setColorMode('system');
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Persist settings changes
  const saveSettingsToCloud = async (patch: Record<string, any>) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const currentSettings = user?.user_metadata?.settings || {};
      const newSettings = { ...currentSettings, ...patch, updatedAt: new Date().toISOString() };

      await supabase.auth.updateUser({
        data: { settings: newSettings },
      });
      showToast('Đã lưu cài đặt tự động');
    } catch (err) {
      console.error('Error saving setting:', err);
    }
  };

  // Color Mode Handler
  const handleColorModeChange = (mode: 'light' | 'dark' | 'system') => {
    setColorMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexa_theme', 'dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexa_theme', 'light');
    } else {
      localStorage.removeItem('nexa_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    window.dispatchEvent(new Event('theme-change'));
    showToast(`Đã chuyển giao diện sang chế độ: ${mode === 'dark' ? 'Tối' : mode === 'light' ? 'Sáng' : 'Theo hệ thống'}`);
  };

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Dung lượng ảnh vượt quá 3MB. Vui lòng chọn ảnh nhỏ hơn.', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || profile?.id;
      if (!targetUserId) throw new Error('Không xác định được danh tính người dùng');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${targetUserId}/${Date.now()}.${fileExt}`;
      let finalAvatarUrl: string | null = null;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = publicUrl;
      } else {
        finalAvatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalAvatarUrl, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      if (profile) {
        setProfile({ ...profile, avatarUrl: finalAvatarUrl });
      }
      showToast('Đã cập nhật ảnh đại diện thành công!');
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi tải ảnh lên', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Nickname Save Handler
  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editNicknameValue.trim().replace(/\s+/g, ' ');
    if (clean.length < 2 || clean.length > 30) {
      showToast('Biệt danh phải từ 2 đến 30 ký tự.', 'error');
      return;
    }

    setSavingNickname(true);
    try {
      const res = await fetch('/api/personal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Có lỗi khi cập nhật biệt danh');

      if (profile) {
        setProfile({ ...profile, nickname: clean });
      }
      setShowEditNicknameModal(false);
      showToast('Đã cập nhật biệt danh thành công!');
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu biệt danh', 'error');
    } finally {
      setSavingNickname(false);
    }
  };

  // Export Data JSON
  const handleExportData = () => {
    const exportObject = {
      user: {
        id: profile?.id,
        nickname: profile?.nickname,
        email: profile?.email,
        role: profile?.role,
        points: profile?.points,
        level: profile?.levelCode,
      },
      learningStats,
      credentials,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexa-profile-data-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Đã xuất dữ liệu học tập thành công!');
  };

  // Scroll to Anchor Section
  const scrollToSection = (sectionId: string, navKey: typeof activeSection) => {
    setActiveSection(navKey);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Level & XP math
  const currentPoints = profile?.points ?? 9;
  const levelTarget = profile?.levelNextTarget ?? 150;
  const pointsRemaining = Math.max(0, levelTarget - currentPoints);
  const progressPercent = Math.min(100, Math.max(5, Math.round((currentPoints / levelTarget) * 100)));

  const initials = (profile?.nickname || 'Học viên')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'NX';

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" strokeWidth={1.75} />
        <p className="text-xs">Đang tải hồ sơ &amp; cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" strokeWidth={2} />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Hồ sơ &amp; Cài đặt
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Quản lý thông tin cá nhân, tùy chỉnh trải nghiệm và thiết lập tài khoản trên NEXA.
        </p>
      </div>

      {/* TOP PROFILE HERO CARD - CÓ MÀU THEO ĐÚNG MẪU THIẾT KẾ (Nền xanh dịu + họa tiết trang trí) */}
      <div className="relative overflow-hidden p-6 bg-gradient-to-r from-[#EEF4FF] via-[#F6F9FF] to-[#E8F1FF] dark:from-zinc-900 dark:via-[#111114] dark:to-blue-950/30 border border-blue-100/90 dark:border-zinc-800 rounded-2xl shadow-xs">
        {/* Họa tiết góc trang trí hình khối đa giác theo mẫu (Faceted geometric shard decoration) */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-80 overflow-hidden select-none">
          <svg viewBox="0 0 320 200" fill="none" className="w-full h-full opacity-60 dark:opacity-10">
            <polygon points="120,0 320,0 320,200 240,200" fill="url(#facet-grad-1)" />
            <polygon points="180,0 320,0 260,200" fill="url(#facet-grad-2)" opacity="0.6" />
            <defs>
              <linearGradient id="facet-grad-1" x1="120" y1="0" x2="320" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#93C5FD" stopOpacity="0.45" />
                <stop offset="1" stopColor="#DBEAFE" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="facet-grad-2" x1="180" y1="0" x2="320" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#BFDBFE" stopOpacity="0.5" />
                <stop offset="1" stopColor="#EFF6FF" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
          {/* Cột trái: Avatar, Tên, Cấp độ, Email */}
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-white dark:border-zinc-700 shadow-md overflow-hidden bg-slate-900 dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-xl select-none">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px]">
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                  </div>
                )}
              </div>

              {/* Nút tròn viền xanh đổi ảnh đại diện */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Thay đổi ảnh đại diện"
                className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-xs flex items-center justify-center cursor-pointer absolute -bottom-1 -right-1 hover:bg-blue-50 dark:hover:bg-zinc-750 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              {/* Full name / Nickname with quick edit */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                  {profile?.fullName || profile?.nickname || 'learner_nexa'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditNicknameModal(true)}
                  className="p-1 rounded text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-blue-100/60 dark:hover:bg-zinc-800 transition-colors"
                  title="Chỉnh sửa biệt danh"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>

              {profile?.fullName && profile?.nickname && profile.fullName !== profile.nickname && (
                <div className="text-xs text-slate-400 dark:text-neutral-500 font-mono">
                  @{profile.nickname}
                </div>
              )}

              {/* Role */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                <GraduationCap className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" strokeWidth={1.75} />
                <span>Người học trên NEXA</span>
              </div>

              {/* Level Pill */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  <span>{profile?.levelCode || 'Level 1: Basic'}</span>
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{profile?.email || 'learner@nexa.edu.vn'}</span>
              </div>
            </div>
          </div>

          {/* Đường phân cách dọc mỏng ở giữa (Desktop) */}
          <div className="hidden lg:block w-px bg-blue-200/60 dark:bg-zinc-800 self-stretch my-1 mx-2" />

          {/* Cột phải: Điểm XP, Tiến trình Level và Tiến độ học tập */}
          <div className="flex-1 lg:max-w-xl flex flex-col justify-between space-y-4">
            {/* Hàng 1: Điểm số & Thanh tiến trình */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                  <div className="w-8 h-8 rounded-full border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <Trophy className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span className="text-base font-mono tabular-nums">{currentPoints} điểm</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  Lên Level 2 còn {pointsRemaining} điểm
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1 bg-slate-200/80 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600 dark:text-zinc-400 font-mono tabular-nums shrink-0 font-medium">
                  {currentPoints} / {levelTarget}
                </span>
              </div>
            </div>

            {/* Hàng 2: Tiến độ học tập số (Chỉ giữ Bài đã hoàn thành, loại bỏ Tỷ lệ đúng & Chủ đề đã học) */}
            <div className="pt-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                <span>Tiến độ học tập số</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                  {learningStats.completedAssessments}
                </span>
                <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                  Bài đã hoàn thành
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS (Modern Pill Tabs, không gạch chân) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PROFILE');
              router.replace('/personal/profile');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4" strokeWidth={1.75} />
            <span>Hồ sơ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CREDENTIALS');
              router.replace('/personal/profile?tab=credentials');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'CREDENTIALS'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
            }`}
          >
            <Award className="w-4 h-4" strokeWidth={1.75} />
            <span>Chứng chỉ đã cấp</span>
            {credentials.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold">
                {credentials.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE & SETTINGS (2-COLUMN LAYOUT) */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Cột trái: Subnav Neo */}
          <aside className="lg:col-span-3 sticky top-20 space-y-1">
            <button
              type="button"
              onClick={() => scrollToSection('section-privacy', 'privacy')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                activeSection === 'privacy'
                  ? 'bg-blue-50/80 dark:bg-zinc-800/80 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                  : 'text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-neutral-900 dark:hover:text-zinc-100'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>Quyền riêng tư</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('section-notifications', 'notifications')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                activeSection === 'notifications'
                  ? 'bg-blue-50/80 dark:bg-zinc-800/80 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                  : 'text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-neutral-900 dark:hover:text-zinc-100'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>Thông báo</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('section-appearance', 'appearance')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                activeSection === 'appearance'
                  ? 'bg-blue-50/80 dark:bg-zinc-800/80 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                  : 'text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-neutral-900 dark:hover:text-zinc-100'
              }`}
            >
              <Monitor className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>Giao diện</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('section-billing', 'billing')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                activeSection === 'billing'
                  ? 'bg-blue-50/80 dark:bg-zinc-800/80 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                  : 'text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-neutral-900 dark:hover:text-zinc-100'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>Gói dịch vụ</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('section-account', 'account')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                activeSection === 'account'
                  ? 'bg-blue-50/80 dark:bg-zinc-800/80 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                  : 'text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-neutral-900 dark:hover:text-zinc-100'
              }`}
            >
              <User className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>Dữ liệu &amp; tài khoản</span>
            </button>
          </aside>

          {/* Cột phải: 5 Nhóm Card chi tiết */}
          <div className="lg:col-span-9 space-y-6">
            {/* CARD 1: Quyền riêng tư & hiển thị */}
            <section
              id="section-privacy"
              className="p-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl space-y-5 shadow-2xs scroll-mt-24"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Quyền riêng tư &amp; hiển thị
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Kiểm soát cách thông tin của bạn được hiển thị trên NEXA.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* 1.1 Hiển thị hồ sơ cá nhân */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Hiển thị hồ sơ cá nhân</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Cho phép người khác xem hồ sơ cơ bản của bạn (tên, cấp độ, tiến độ học tập).
                    </p>
                  </div>

                  <div className="relative shrink-0">
                    <select
                      value={profileVisibility}
                      onChange={(e) => {
                        const val = e.target.value as typeof profileVisibility;
                        setProfileVisibility(val);
                        saveSettingsToCloud({ profileVisibility: val });
                      }}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-neutral-800 dark:text-zinc-200 rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 shadow-xs appearance-none cursor-pointer"
                    >
                      <option value="PUBLIC">Công khai</option>
                      <option value="PRIVATE">Riêng tư</option>
                      <option value="ORG_ONLY">Chỉ tổ chức</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 1.2 Hiển thị trên bảng xếp hạng */}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Hiển thị trên bảng xếp hạng</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Cho phép hiển thị tên và điểm số của bạn trong bảng xếp hạng cộng đồng.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={showOnLeaderboard}
                    onClick={() => {
                      const next = !showOnLeaderboard;
                      setShowOnLeaderboard(next);
                      saveSettingsToCloud({ showOnLeaderboard: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showOnLeaderboard ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        showOnLeaderboard ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 1.3 Chia sẻ chứng chỉ & xác minh bằng QR */}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Chia sẻ chứng chỉ &amp; xác minh bằng QR</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Cho phép chia sẻ chứng chỉ của bạn và cho phép người khác xác minh tính xác thực thông qua mã QR.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={shareCertQr}
                    onClick={() => {
                      const next = !shareCertQr;
                      setShareCertQr(next);
                      saveSettingsToCloud({ shareCertQr: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      shareCertQr ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        shareCertQr ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* CARD 2: Thông báo */}
            <section
              id="section-notifications"
              className="p-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl space-y-5 shadow-2xs scroll-mt-24"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Thông báo
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Tùy chọn nhận thông báo để không bỏ lỡ các hoạt động quan trọng.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* 2.1 Bài đánh giá mới */}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Bài đánh giá mới</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Nhận thông báo khi có bài đánh giá hoặc nhiệm vụ mới được giao.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyNewAssessment}
                    onClick={() => {
                      const next = !notifyNewAssessment;
                      setNotifyNewAssessment(next);
                      saveSettingsToCloud({ notifyNewAssessment: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifyNewAssessment ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifyNewAssessment ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2.2 Nhắc nhở hạn chót */}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Nhắc nhở hạn chót</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Nhận nhắc nhở trước thời hạn nộp bài.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyDeadline}
                    onClick={() => {
                      const next = !notifyDeadline;
                      setNotifyDeadline(next);
                      saveSettingsToCloud({ notifyDeadline: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifyDeadline ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifyDeadline ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2.3 Kết quả & điểm số */}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Kết quả &amp; điểm số</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Nhận thông báo khi có kết quả chấm điểm hoặc phân tích bài làm.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyScoreReady}
                    onClick={() => {
                      const next = !notifyScoreReady;
                      setNotifyScoreReady(next);
                      saveSettingsToCloud({ notifyScoreReady: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifyScoreReady ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifyScoreReady ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2.4 Cập nhật từ hệ thống */}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Cập nhật từ hệ thống</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Nhận thông tin về tính năng mới, cải tiến và các thông báo quan trọng từ NEXA.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifySystemUpdates}
                    onClick={() => {
                      const next = !notifySystemUpdates;
                      setNotifySystemUpdates(next);
                      saveSettingsToCloud({ notifySystemUpdates: next });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifySystemUpdates ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifySystemUpdates ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* CARD 3: Giao diện (Đã loại bỏ Mật độ hiển thị theo yêu cầu) */}
            <section
              id="section-appearance"
              className="p-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl space-y-5 shadow-2xs scroll-mt-24"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Giao diện
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Tùy chỉnh giao diện hiển thị phù hợp với thói quen của bạn.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                {/* Chế độ màu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Chế độ màu</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Thay đổi giao diện hiển thị của NEXA.
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-800 p-1 bg-slate-50 dark:bg-zinc-900 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleColorModeChange('light')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        colorMode === 'light'
                          ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                      <span>Sáng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleColorModeChange('dark')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        colorMode === 'dark'
                          ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.75} />
                      <span>Tối</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleColorModeChange('system')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        colorMode === 'system'
                          ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                      <span>Theo hệ thống</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 4: Gói dịch vụ */}
            <section
              id="section-billing"
              className="p-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl space-y-5 shadow-2xs scroll-mt-24"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Gói dịch vụ
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Quản lý gói dịch vụ và nâng cấp để mở khóa thêm tính năng.
                  </p>
                </div>
              </div>

              {/* Inner Banner */}
              <div className="p-5 bg-slate-50/80 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                    {profile?.plan_tier === 'PRO' ? 'PRO' : 'FREE'}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Gói {profile?.plan_tier === 'PRO' ? 'PRO' : 'FREE'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {profile?.plan_tier === 'PRO'
                      ? 'Bạn đang sử dụng đầy đủ các tính năng khảo thí nâng cao và báo cáo AI chuyên sâu.'
                      : 'Trải nghiệm các tính năng học tập và đánh giá cốt lõi trên NEXA.'}
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 w-full md:w-auto">
                  <Link
                    href="/personal/billing"
                    className="w-full md:w-auto px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Nâng cấp PRO</span>
                  </Link>
                  <Link
                    href="/personal/billing"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>So sánh các gói</span>
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </section>

            {/* CARD 5: Dữ liệu & tài khoản */}
            <section
              id="section-account"
              className="p-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl space-y-5 shadow-2xs scroll-mt-24"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Dữ liệu &amp; tài khoản
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Quản lý dữ liệu cá nhân và các tùy chọn liên quan đến tài khoản.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* 5.1 Xuất dữ liệu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Xuất dữ liệu</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Tải xuống dữ liệu học tập và thông tin tài khoản của bạn dưới dạng tệp.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportData}
                    className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" strokeWidth={1.75} />
                    <span>Xuất dữ liệu</span>
                  </button>
                </div>

                {/* 5.2 Tạm ngừng tài khoản */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                      <span>Tạm ngừng tài khoản</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Tạm thời vô hiệu hóa tài khoản. Bạn có thể kích hoạt lại bất kỳ lúc nào.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPauseModal(true)}
                    className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-medium transition-colors shadow-2xs cursor-pointer shrink-0"
                  >
                    <span>Tạm ngừng</span>
                  </button>
                </div>

                {/* 5.3 Xóa tài khoản */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
                      <span>Xóa tài khoản</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan. Hành động này không thể hoàn tác.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3.5 py-1.5 rounded-md border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors shadow-2xs cursor-pointer shrink-0"
                  >
                    <span>Xóa tài khoản</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: CREDENTIALS */}
      {activeTab === 'CREDENTIALS' && (
        <div className="p-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl space-y-5 shadow-2xs pt-4">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Chứng chỉ số sở hữu
              </h2>
            </div>
            <Link
              href="/personal/credentials"
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Xem trang chứng chỉ đầy đủ</span>
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>

          {credentials.length > 0 ? (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Award className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Chứng chỉ 5 Miền Năng Lực Số Chuẩn Hóa — {cred.level || 'Level 4'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                        <span>Mã: {cred.credential_id}</span>
                        <span>•</span>
                        <span className="truncate max-w-[140px] sm:max-w-[200px]" title={cred.hash}>
                          SHA-256: {cred.hash?.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      href={`/verify/${cred.credential_id}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 text-neutral-800 dark:text-zinc-200 text-[11px] font-medium inline-flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500 dark:text-zinc-400" strokeWidth={1.75} />
                      <span>Tra cứu QR</span>
                    </Link>

                    <a
                      href={`/api/credentials/${cred.credential_id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Download className="w-3 h-3" strokeWidth={1.75} />
                      <span>Tải PDF</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
              <Award className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                Chưa sở hữu chứng chỉ số
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4 leading-relaxed">
                Chứng chỉ Năng Lực Số sẽ được cấp khi bạn hoàn thành chuẩn đạt các bài khảo thí hoặc đạt điểm tích lũy cấp độ cao.
              </p>
              <Link
                href="/personal/assessments"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <span>Khám phá bài khảo thí để tích lũy điểm</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Chỉnh sửa Biệt danh */}
      {showEditNicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" strokeWidth={2} />
                <span>Chỉnh sửa biệt danh hiển thị</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditNicknameModal(false)}
                className="p-1 rounded text-slate-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNickname} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                  Biệt danh mới
                </label>
                <input
                  type="text"
                  value={editNicknameValue}
                  onChange={(e) => setEditNicknameValue(e.target.value)}
                  placeholder="Ví dụ: learner_nexa"
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 shadow-2xs"
                  required
                  minLength={2}
                  maxLength={30}
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Biệt danh hiển thị công khai trên bảng xếp hạng và lớp học. Từ 2 đến 30 ký tự.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditNicknameModal(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingNickname}
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
                >
                  {savingNickname ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu biệt danh</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tạm ngừng tài khoản */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Tạm ngừng tài khoản?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Tài khoản của bạn sẽ tạm thời chuyển sang trạng thái ngưng hoạt động. Bạn sẽ không nhận được thông báo mới, nhưng toàn bộ lịch sử khảo thí, chứng chỉ và điểm XP vẫn được bảo lưu an toàn.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPauseModal(false);
                  showToast('Đã gửi yêu cầu tạm ngừng tài khoản. Bạn có thể đăng nhập lại bất kỳ lúc nào để mở lại.');
                }}
                className="px-4 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Xác nhận tạm ngừng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Xóa tài khoản (Danger) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Xóa tài khoản vĩnh viễn?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Cảnh báo: Hành động này không thể hoàn tác. Mọi dữ liệu khảo thí, chứng chỉ số đã cấp và kết quả năng lực của bạn sẽ bị hủy vĩnh viễn khỏi nền tảng NEXA.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  showToast('Vui lòng liên hệ quản trị viên qua support@nexa.edu.vn để hoàn tất thủ tục hủy dữ liệu bảo mật.', 'error');
                }}
                className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Tôi hiểu, tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
