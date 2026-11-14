'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Database,
  Users,
  Lightbulb,
  Shield,
  Wrench,
  RotateCcw,
  Check,
  X,
  Target,
  Trophy,
  Lock,
  Sparkles,
  HelpCircle,
  BookOpen,
  Layers,
  Circle,
  Compass,
  Clock,
} from 'lucide-react';
import { DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';
import { EditGoalModal, UserLearningGoal } from '@/components/dashboard/personal/EditGoalModal';
import { BaselineDiagnosticModal } from '@/components/dashboard/personal/BaselineDiagnosticModal';
import {
  DOMAIN_CURRICULUM,
  SubdomainNode,
  CompetencyLevelItem,
  CompetencyLevelCode,
  getSubdomainLevels,
} from '@/features/assessments/data/learning-curriculum';

interface CompetencyProfileData {
  hasTakenAssessment?: boolean;
  totalAssessmentsCompleted?: number;
  latestSubmissionId?: string | null;
  overallScore: number | null;
  radarData: DomainScore[];
}

const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Database,
  Users,
  Lightbulb,
  Shield,
  Wrench,
};

const LEVEL_CONFIGS: Record<
  CompetencyLevelCode,
  {
    levelName: string;
    levelNumber: number;
    badgeStyle: string;
    activeTabStyle: string;
    dotStyle: string;
  }
> = {
  BASIC: {
    levelName: 'Cơ bản',
    levelNumber: 1,
    badgeStyle: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
    activeTabStyle: 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold',
    dotStyle: 'bg-blue-500',
  },
  INTERMEDIATE: {
    levelName: 'Trung cấp',
    levelNumber: 2,
    badgeStyle: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    activeTabStyle: 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold',
    dotStyle: 'bg-blue-600',
  },
  ADVANCED: {
    levelName: 'Nâng cao',
    levelNumber: 3,
    badgeStyle: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    activeTabStyle: 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold',
    dotStyle: 'bg-purple-600',
  },
  HIGHLY_ADVANCED: {
    levelName: 'Chuyên sâu',
    levelNumber: 4,
    badgeStyle: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    activeTabStyle: 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold',
    dotStyle: 'bg-amber-600',
  },
};

function normalizeDomainCode(code: string | null | undefined): string {
  if (!code) return '01';
  const match = String(code).match(/(\d+)/);
  return match ? match[1].padStart(2, '0') : '01';
}

function LearningPathContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedDomain = searchParams.get('domain');

  // Active selections
  const [mounted, setMounted] = useState(false);
  const [activeDomainCode, setActiveDomainCode] = useState<string>('01');

  // Focus Modal State (Lựa chọn A)
  const [selectedSubdomain, setSelectedSubdomain] = useState<{
    subdomain: SubdomainNode;
    domainNum: number;
    subIdx: number;
    levels: CompetencyLevelItem[];
  } | null>(null);
  const [activeLevelCode, setActiveLevelCode] = useState<CompetencyLevelCode>('BASIC');
  const [showGuidanceModal, setShowGuidanceModal] = useState<boolean>(false);

  // Modals và Notifications State
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Freemium Locking & Progress State
  const [unlockedFreeDomain, setUnlockedFreeDomain] = useState<string | null>(null);
  const [hasTakenAssessment, setHasTakenAssessment] = useState<boolean>(false);
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [completedLevelIds, setCompletedLevelIds] = useState<Set<string>>(new Set());
  const [serverModules, setServerModules] = useState<any[]>([]);

  // Learning Goal State
  const [learningGoal, setLearningGoal] = useState<UserLearningGoal>({
    title: 'Nâng cao năng lực số toàn diện theo khung chuẩn hóa 5 miền',
    track: 'Lộ trình bồi dưỡng cá nhân hóa',
    pace: 'Học theo tốc độ riêng',
  });
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  // Competency Profile State
  const [competencyProfile, setCompetencyProfile] = useState<CompetencyProfileData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Đồng bộ miền được chọn từ URL (nếu có tham số ?domain=)
  useEffect(() => {
    if (requestedDomain) {
      const clean = normalizeDomainCode(requestedDomain);
      if (['01', '02', '03', '04', '05'].includes(clean)) {
        setActiveDomainCode(clean);
      }
    }
  }, [requestedDomain]);

  // 2. Fetch User Profile & Unlocked Status từ dữ liệu thực tế của tài khoản
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch('/api/personal/learning-path', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const hasAssessed = Boolean(json.hasTakenAssessment);
          setHasTakenAssessment(hasAssessed);

          if (hasAssessed && json.unlockedFreeDomain) {
            const norm = normalizeDomainCode(json.unlockedFreeDomain);
            setUnlockedFreeDomain(norm);
            try {
              localStorage.setItem('nexa_unlocked_domain', norm);
            } catch {}
            if (!requestedDomain) {
              setActiveDomainCode(norm);
            }
          } else {
            // Tài khoản chưa khảo thí: Không mở khóa bất kỳ miền nào
            setUnlockedFreeDomain(null);
            try {
              localStorage.removeItem('nexa_unlocked_domain');
            } catch {}
          }

          if (json.isProUser) {
            setIsProUser(true);
          }
          if (Array.isArray(json.modules)) {
            setServerModules(json.modules);
            const serverCompletedIds = json.modules
              .filter((m: any) => m.is_completed)
              .map((m: any) => m.id);
            if (serverCompletedIds.length > 0) {
              setCompletedLevelIds((prev) => new Set([...prev, ...serverCompletedIds]));
            }
          }
          if (Array.isArray(json.completedLessonIds)) {
            setCompletedLevelIds((prev) => new Set([...prev, ...json.completedLessonIds]));
          }
        }
      } catch (e) {
        console.error('Failed to load learning path profile:', e);
      }

      try {
        const profRes = await fetch('/api/personal/competency-profile', { cache: 'no-store' });
        if (profRes.ok) {
          const pJson = await profRes.json();
          const pData = pJson.profile || pJson;
          if (pData.hasTakenAssessment !== undefined) {
            const hasTaken = Boolean(pData.hasTakenAssessment);
            setHasTakenAssessment(hasTaken);
            if (hasTaken) {
              const weakestCode = pData.insights?.weakest?.code;
              if (weakestCode) {
                const norm = normalizeDomainCode(weakestCode);
                setUnlockedFreeDomain((prev) => prev || norm);
                try {
                  localStorage.setItem('nexa_unlocked_domain', norm);
                } catch {}
                if (!requestedDomain) {
                  setActiveDomainCode((prev) => (prev === '01' ? norm : prev));
                }
              }
            } else {
              setUnlockedFreeDomain(null);
              try {
                localStorage.removeItem('nexa_unlocked_domain');
              } catch {}
            }
          }
          if (pData) {
            setCompetencyProfile(pData);
          }
        }
      } catch (e) {
        console.error('Failed to load competency profile:', e);
      }
    }

    loadUserData();
  }, [requestedDomain]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Current domain object
  const activeTrack = useMemo(
    () => DOMAIN_CURRICULUM.find((d) => d.code === activeDomainCode) || DOMAIN_CURRICULUM[0],
    [activeDomainCode]
  );

  const isCurrentDomainUnlocked =
    isProUser ||
    (hasTakenAssessment && Boolean(unlockedFreeDomain) && normalizeDomainCode(activeTrack.code) === normalizeDomainCode(unlockedFreeDomain));

  // Tính tổng số cấp độ trong chặng
  const totalLevelsInTrack = activeTrack.subdomains.length * 4;
  const completedInCurrentTrack = useMemo(() => {
    let count = 0;
    activeTrack.subdomains.forEach((sub, sIdx) => {
      const levels = getSubdomainLevels(sub, activeTrack.domainNumber, sIdx);
      levels.forEach((lvl) => {
        if (completedLevelIds.has(lvl.id)) count++;
      });
    });
    return count;
  }, [activeTrack, completedLevelIds]);

  const trackProgressPercent = Math.round((completedInCurrentTrack / totalLevelsInTrack) * 100);

  // Mở modal tập trung cho 1 Miền con
  const handleOpenSubdomainModal = (sub: SubdomainNode, subIdx: number) => {
    const levels = getSubdomainLevels(sub, activeTrack.domainNumber, subIdx);
    setSelectedSubdomain({
      subdomain: sub,
      domainNum: activeTrack.domainNumber,
      subIdx,
      levels,
    });
    // Tìm level chưa đạt đầu tiên, hoặc mặc định BASIC
    const firstIncomplete = levels.find((l) => !completedLevelIds.has(l.id));
    setActiveLevelCode(firstIncomplete ? firstIncomplete.levelCode : 'BASIC');
    setShowGuidanceModal(false);
  };

  const handleSaveGoal = async (newGoal: UserLearningGoal): Promise<void> => {
    setLearningGoal(newGoal);
    showToast('Kế hoạch bồi dưỡng năng lực đã được cập nhật thành công!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 border border-neutral-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              LỘ TRÌNH NĂNG LỰC SỐ
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              5 Miền • 21 Kỹ năng • 4 Cấp độ
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-0.5">
            Lộ trình Bồi dưỡng Năng lực
          </h1>
        </div>

        <Link
          href="/personal/competency"
          className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-2xs shrink-0 cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Xem Hồ sơ Năng lực</span>
        </Link>
      </div>

      {/* 2. Main Workspace Layout (Left: Các Miền Năng Lực - Right: Trục Tiến Trình Năng Lực Số) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Vertical Milestone Rails - Các Miền Năng Lực Số */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 font-mono">
                  CÁC MIỀN NĂNG LỰC
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Khung năng lực số quốc gia</p>
              </div>
              <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                5 miền năng lực
              </span>
            </div>

            {/* List 5 Chặng Miền Năng Lực */}
            <div className="space-y-2.5">
              {DOMAIN_CURRICULUM.map((track) => {
                const isSelected = activeDomainCode === track.code;
                const isTrackUnlocked =
                  isProUser ||
                  (hasTakenAssessment && Boolean(unlockedFreeDomain) && normalizeDomainCode(track.code) === normalizeDomainCode(unlockedFreeDomain));
                const IconComponent = DOMAIN_ICONS[track.iconName] || Database;

                // Thống kê số cấp độ đã đạt trong chặng này
                let trackCompletedLevels = 0;
                const totalLevelsInThisTrack = track.subdomains.length * 4;
                track.subdomains.forEach((s, sI) => {
                  const lvls = getSubdomainLevels(s, track.domainNumber, sI);
                  lvls.forEach((l) => {
                    if (completedLevelIds.has(l.id)) trackCompletedLevels++;
                  });
                });
                const percent = Math.round((trackCompletedLevels / totalLevelsInThisTrack) * 100);

                return (
                  <button
                    key={track.code}
                    type="button"
                    onClick={() => setActiveDomainCode(track.code)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-600/30'
                        : 'border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </div>
                        <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                          Miền {track.domainNumber}
                        </span>
                      </div>

                      {mounted && (isProUser || isTrackUnlocked) ? (
                        <span
                          title="Miền đã mở khóa"
                          className="w-5 h-5 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 shrink-0"
                        >
                          <Check className="w-3 h-3" strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span
                          title={!hasTakenAssessment ? 'Cần làm khảo thí đầu vào để mở khóa' : 'Cần nâng cấp để mở khóa'}
                          className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors shrink-0 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-neutral-800 dark:text-zinc-200 line-clamp-2 leading-snug">
                      {track.title}
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                        <span>{track.subdomains.length} kỹ năng</span>
                        <span>{trackCompletedLevels}/{totalLevelsInThisTrack} cấp độ ({percent}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Freemium Upgrade Card */}
          {!isProUser && (
            <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{hasTakenAssessment ? 'Tài khoản Miễn phí' : 'Khảo thí đầu vào'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                {hasTakenAssessment && unlockedFreeDomain
                  ? 'Đang mở 1 miền miễn phí. Cần nâng cấp tài khoản để mở khóa toàn bộ.'
                  : 'Làm bài khảo thí để xác định khoảng trống năng lực và mở khóa 1 miền miễn phí.'}
              </p>
              {!hasTakenAssessment ? (
                <button
                  type="button"
                  onClick={() => setIsBaselineModalOpen(true)}
                  className="block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer text-center shadow-xs"
                >
                  Khảo thí đầu vào ngay →
                </button>
              ) : (
                <Link
                  href="/personal/billing"
                  className="block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer text-center shadow-xs"
                >
                  Nâng cấp tài khoản →
                </Link>
              )}
            </div>
          )}

          {/* Quick Learning Plan */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono uppercase tracking-wider text-slate-400 text-[11px]">
                KẾ HOẠCH BỒI DƯỠNG
              </span>
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(true)}
                className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] hover:underline cursor-pointer"
              >
                Cài đặt →
              </button>
            </div>
            <p className="text-neutral-800 dark:text-zinc-200 font-medium leading-relaxed">
              {learningGoal.title}
            </p>
          </div>
        </div>

        {/* Right Column (8 cols): Interactive Competency Spine - Trục Năng Lực Số Zigzag */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chặng Header Banner (Tinh gọn, Hiện đại, Thống nhất Light/Dark) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 font-mono font-bold text-[10px] uppercase tracking-wider">
                    CHẶNG MIỀN {activeTrack.domainNumber}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                    {activeTrack.subdomains.length} Kỹ năng thành phần • 4 Cấp độ chuẩn
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {activeTrack.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                  {activeTrack.desc}
                </p>
              </div>

              {hasTakenAssessment ? (
                isCurrentDomainUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      const firstSub = activeTrack.subdomains[0];
                      if (firstSub) handleOpenSubdomainModal(firstSub, 0);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    <span>Vào học chặng này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    href="/personal/billing"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Nâng cấp tài khoản</span>
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBaselineModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Khảo thí đầu vào để mở khóa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tiến độ tổng thể của chặng học */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  Tiến độ chặng:
                </span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                  {completedInCurrentTrack} / {totalLevelsInTrack} cấp độ ({trackProgressPercent}%)
                </span>
              </div>
              <div className="w-full sm:w-64 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${trackProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Locked Overlay if not PRO and not free domain */}
          {!isCurrentDomainUnlocked ? (
            !hasTakenAssessment ? (
              <div className="p-8 sm:p-10 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/90 dark:border-blue-900/60 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                  <Compass className="w-7 h-7" strokeWidth={1.75} />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    BƯỚC 1: KHẢO THÍ ĐẦU VÀO
                  </span>
                  <h4 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100">
                    Chưa thiết lập Hồ sơ Năng lực
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                    Làm bài khảo thí để xác định khoảng trống năng lực và mở khóa 1 miền miễn phí.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBaselineModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Làm khảo thí đầu vào ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 rounded-3xl bg-slate-50 dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    Chặng học này đang bị khóa
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                    Cần nâng cấp tài khoản để mở khóa miền này.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  {unlockedFreeDomain && (
                    <button
                      type="button"
                      onClick={() => setActiveDomainCode(unlockedFreeDomain)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      Về miền miễn phí
                    </button>
                  )}
                  <Link
                    href="/personal/billing"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Nâng cấp tài khoản</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          ) : (
            /* TRỤC TIẾN TRÌNH ZIGZAG NĂNG LỰC SỐ (ZIGZAG LEARNING ROADMAP) */
            <div className="relative py-4">
              {/* Đường dẫn trung tâm uốn lượn (Center Trail for Desktop) */}
              <div className="hidden md:block absolute left-1/2 top-10 bottom-16 -translate-x-1/2 w-0.5 bg-gradient-to-b from-blue-500/30 via-slate-200 dark:via-zinc-800 to-transparent pointer-events-none" />

              {/* Đường dẫn bên trái cho Mobile */}
              <div className="md:hidden absolute left-5 top-8 bottom-12 w-0.5 bg-gradient-to-b from-blue-500/30 via-slate-200 dark:via-zinc-800 to-transparent pointer-events-none" />

              <div className="space-y-6 sm:space-y-10">
                {activeTrack.subdomains.map((sub, sIdx) => {
                  const subLevels = getSubdomainLevels(sub, activeTrack.domainNumber, sIdx);
                  const completedInThisSub = subLevels.filter((lvl) => completedLevelIds.has(lvl.id)).length;
                  const isAllSubCompleted = completedInThisSub === 4;
                  const isSubInProgress = completedInThisSub > 0 && !isAllSubCompleted;
                  const isLeft = sIdx % 2 === 0;

                  return (
                    <div
                      key={sub.id}
                      className={`relative flex flex-col md:flex-row items-center ${
                        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                      } group`}
                    >
                      {/* Node Tròn Cột Mốc (Trực quan trung tâm / Trái trên Mobile) */}
                      <div className="absolute left-1 md:left-1/2 md:-translate-x-1/2 top-4 md:top-1/2 md:-translate-y-1/2 z-10 flex items-center justify-center">
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm ${
                            isAllSubCompleted
                              ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-4 ring-emerald-50 dark:ring-emerald-950/50'
                              : isSubInProgress
                              ? 'bg-blue-600 text-white shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-950/70 scale-105'
                              : 'bg-white dark:bg-[#111114] border-2 border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-neutral-400 group-hover:border-blue-500 dark:group-hover:border-blue-400 group-hover:text-blue-600'
                          }`}
                        >
                          {isAllSubCompleted ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                          ) : (
                            <span>0{sIdx + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Thẻ Kỹ Năng Thành Phần (Zigzag Card) */}
                      <div
                        className={`w-full pl-14 md:pl-0 md:w-[calc(50%-2.25rem)] ${
                          isLeft ? 'md:pr-2 text-left' : 'md:pl-2 text-left'
                        }`}
                      >
                        <div
                          onClick={() => handleOpenSubdomainModal(sub, sIdx)}
                          className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500/80 dark:hover:border-blue-500/70 hover:shadow-lg transition-all duration-300 cursor-pointer space-y-4 shadow-2xs group/card relative overflow-hidden"
                        >
                          {/* Dải chỉ thị màu bên sườn cho trạm đang học */}
                          {isSubInProgress && (
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500" />
                          )}

                          {/* Header Thẻ: Nhãn Kỹ Năng & Tag Tiến Độ */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                              KỸ NĂNG THÀNH PHẦN {sIdx + 1}
                            </span>

                            {isAllSubCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                Đã đạt chuẩn (4/4)
                              </span>
                            ) : isSubInProgress ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                Đang học ({completedInThisSub}/4)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-neutral-400 font-mono text-[10px] font-medium">
                                Chưa bắt đầu (0/4)
                              </span>
                            )}
                          </div>

                          {/* Body: Tên & Mô tả ngắn gọn */}
                          <div className="space-y-1.5">
                            <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors leading-snug">
                              {sub.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                              {sub.desc}
                            </p>
                          </div>

                          {/* Footer: Segmented mini progress bar & Action CTA */}
                          <div className="pt-3 flex items-center justify-between gap-3">
                            {/* Segmented 4-level progress bar */}
                            <div className="flex items-center gap-1.5 flex-1 max-w-[140px] sm:max-w-[160px]" title={`Đã hoàn thành ${completedInThisSub} / 4 cấp độ`}>
                              {subLevels.map((lvl) => {
                                const isDone = completedLevelIds.has(lvl.id);
                                return (
                                  <div
                                    key={lvl.id}
                                    className={`h-1.5 flex-1 rounded-full transition-all ${
                                      isDone
                                        ? 'bg-emerald-500'
                                        : isSubInProgress
                                        ? 'bg-blue-200 dark:bg-blue-950'
                                        : 'bg-slate-200 dark:bg-zinc-800'
                                    }`}
                                  />
                                );
                              })}
                            </div>

                            {/* Action Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSubdomainModal(sub, sIdx);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 group-hover/card:bg-blue-600 group-hover/card:text-white border border-slate-200 dark:border-zinc-800 group-hover/card:border-blue-600 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
                            >
                              <span>{isAllSubCompleted ? 'Ôn tập' : completedInThisSub > 0 ? 'Học tiếp' : 'Vào học'}</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Cột đối xứng rỗng để giữ cân bằng Zigzag trên Desktop */}
                      <div className="hidden md:block md:w-[calc(50%-2.25rem)]" />
                    </div>
                  );
                })}
              </div>

              {/* Checkpoint Đích đến của chặng học */}
              <div className="mt-10 sm:mt-12 pt-6 flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3">
                  <Trophy className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Mục tiêu Chặng: Làm chủ Miền {activeTrack.domainNumber}
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm">
                  Hoàn thành trọn vẹn các kỹ năng thành phần để đạt chuẩn đầu ra và sẵn sàng cho kỳ thi cấp chứng chỉ số.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL LỰA CHỌN A: CHI TIẾT 4 CẤP ĐỘ CỦA MIỀN CON (FOCUS MODAL) */}
      {/* ============================================================= */}
      {selectedSubdomain && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111114] rounded-3xl border border-slate-200 dark:border-zinc-800 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10px] uppercase">
                    TRẠM 0{selectedSubdomain.subIdx + 1} • MIỀN {selectedSubdomain.domainNum}
                  </span>
                  <span className="text-slate-300 dark:text-zinc-700">•</span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400">
                    Khung Năng Lực 4 Cấp Độ
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 leading-snug">
                  {selectedSubdomain.subdomain.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubdomain(null)}
                className="text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Thanh 4 Tab Cấp Độ (Cơ bản -> Trung cấp -> Nâng cao -> Chuyên sâu) */}
            <div className="px-5 sm:px-6 pt-3 pb-2 bg-slate-50/50 dark:bg-zinc-900/30 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max pb-1">
                {selectedSubdomain.levels.map((lvl) => {
                  const isTabActive = activeLevelCode === lvl.levelCode;
                  const isDone = completedLevelIds.has(lvl.id);
                  const cfg = LEVEL_CONFIGS[lvl.levelCode];

                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        setActiveLevelCode(lvl.levelCode);
                        setShowGuidanceModal(false);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 border ${
                        isTabActive
                          ? cfg.activeTabStyle
                          : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-mono text-[11px] font-bold">Cấp {lvl.levelNumber}:</span>
                      <span className="font-semibold">{lvl.levelName}</span>
                      {isDone && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nội Dung Cấp Độ Đang Chọn */}
            {(() => {
              const currentLevel = selectedSubdomain.levels.find((l) => l.levelCode === activeLevelCode);
              if (!currentLevel) return null;
              const isLevelDone = completedLevelIds.has(currentLevel.id);
              const cfg = LEVEL_CONFIGS[currentLevel.levelCode];
              const activeDomainNum = String(activeTrack.domainNumber).padStart(2, '0');

              // Find module matching (domain, skillCode, levelNumber) precisely
              const matchedModule =
                serverModules.find((sm) => {
                  const smDom = normalizeDomainCode(sm.domain_code);
                  const isDom = smDom === activeDomainNum;
                  const isSkill = sm.skill_code === selectedSubdomain.subdomain.skillCode;
                  const isLvl = Number(sm.order_index) === currentLevel.levelNumber;
                  return isDom && isSkill && isLvl;
                }) ||
                serverModules.find((sm) => {
                  const smDom = normalizeDomainCode(sm.domain_code);
                  const isDom = smDom === activeDomainNum;
                  const isSkill = sm.skill_code === selectedSubdomain.subdomain.skillCode;
                  return isDom && isSkill;
                }) ||
                serverModules.find((sm) => {
                  const smDom = normalizeDomainCode(sm.domain_code);
                  if (smDom !== activeDomainNum) return false;
                  const subTitle = (selectedSubdomain.subdomain.title || '').toLowerCase();
                  const smTitle = (sm.title || '').toLowerCase();
                  return subTitle.includes(smTitle) || smTitle.includes(subTitle);
                });

              const effectiveDuration = matchedModule?.assessments?.duration_minutes || matchedModule?.duration_minutes || currentLevel.durationMinutes;
              const effectivePassingScore = matchedModule?.assessments?.passing_score !== undefined
                ? Number(matchedModule.assessments.passing_score)
                : 100;
              const effectivePoints = matchedModule?.assessments?.point_reward || matchedModule?.point_reward || currentLevel.pointReward;

              return (
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-neutral-800 dark:text-zinc-200 flex-1">
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${cfg.badgeStyle}`}>
                        {currentLevel.badgeLabel}
                      </span>
                      {isLevelDone ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ ĐẠT CHUẨN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-500 text-[11px]">
                          CHƯA ĐÁNH GIÁ
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      Thời lượng: {effectiveDuration} phút • Chuẩn vượt trạm: {effectivePassingScore}% • +{effectivePoints} PTS
                    </span>
                  </div>

                  {/* 1. Chuẩn Đầu Ra Năng Lực */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      Chuẩn đầu ra năng lực:
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-zinc-200 leading-relaxed bg-blue-50/30 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-100/80 dark:border-blue-900/30">
                      {currentLevel.benchmarkStandard}
                    </p>
                  </div>

                  {/* 2. Trọng Tâm Kỹ Năng Cần Chứng Minh */}
                  <div className="space-y-2">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      Trọng tâm kỹ năng số:
                    </div>
                    <div className="space-y-1.5">
                      {currentLevel.coreSkills.map((skill, sIndex) => (
                        <div key={sIndex} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Khung Hướng Dẫn Bồi Dưỡng của NEXA */}
                  {showGuidanceModal && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-200 text-xs font-mono uppercase">
                          Hướng dẫn bồi dưỡng trọng tâm:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowGuidanceModal(false)}
                          className="text-amber-600 text-[11px] hover:underline cursor-pointer"
                        >
                          Thu gọn
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                        {currentLevel.guidanceText}
                      </p>
                    </div>
                  )}

                  {/* 4. Hành Động */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowGuidanceModal((prev) => !prev)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{showGuidanceModal ? 'Đóng hướng dẫn' : 'Xem trọng tâm bồi dưỡng'}</span>
                    </button>

                    {(() => {
                      if (matchedModule?.assessment_id) {
                        if (matchedModule.is_on_cooldown) {
                          return (
                            <button
                              type="button"
                              disabled
                              className="px-5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                            >
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              <span>Đang trong thời gian chờ ôn tập</span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            href={`/personal/learning-path/assessment/${matchedModule.id}`}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                          >
                            <span>
                              {matchedModule.is_completed || isLevelDone
                                ? 'Kiểm chứng lại vượt trạm'
                                : `Vào kiểm chứng vượt trạm (Chuẩn ${effectivePassingScore}%)`}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        );
                      }

                      if (currentLevel.assessmentId) {
                        return (
                          <Link
                            href={`/personal/take/${currentLevel.assessmentId}`}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                          >
                            <span>{isLevelDone ? 'Khảo thí lại cấp độ' : 'Bắt đầu làm bài đánh giá'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            showToast('Đề kiểm chứng cho học phần này đang được Quản trị viên liên kết từ Ngân hàng đề.');
                          }}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-750 transition-colors"
                        >
                          <span>Đang chuẩn bị đề kiểm chứng</span>
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* Edit Learning Goal Modal */}
      <EditGoalModal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
        currentGoal={learningGoal}
        onSave={handleSaveGoal}
      />

      {/* Modal Khảo Thí Chẩn Đoán Đầu Vào */}
      <BaselineDiagnosticModal
        isOpen={isBaselineModalOpen}
        onClose={() => setIsBaselineModalOpen(false)}
        onCompleted={(res) => {
          setHasTakenAssessment(true);
          if (res.unlockedFreeDomain) {
            setUnlockedFreeDomain(res.unlockedFreeDomain);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profile-updated'));
          }
        }}
      />
    </div>
  );
}

export default function PersonalLearningPathPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Đang tải lộ trình học tập...</span>
        </div>
      }
    >
      <LearningPathContent />
    </Suspense>
  );
}
