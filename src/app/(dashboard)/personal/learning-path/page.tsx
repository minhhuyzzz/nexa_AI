'use client';

import { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
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
  Zap,
  Award,
  Info,
} from 'lucide-react';
import { DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';
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
  insights?: {
    weakest?: {
      code: string;
      title: string;
    };
  };
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
    badgeStyle: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    activeTabStyle: 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold',
    dotStyle: 'bg-blue-600',
  },
  HIGHLY_ADVANCED: {
    levelName: 'Chuyên sâu',
    levelNumber: 4,
    badgeStyle: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    activeTabStyle: 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold',
    dotStyle: 'bg-blue-600',
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

  // Interactive Side Drawer State (Linear / Stripe style)
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

  // Competency Profile State
  const [competencyProfile, setCompetencyProfile] = useState<CompetencyProfileData | null>(null);

  // Tree Branch SVG Coordinate State
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const domainRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const stationRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [branchCoords, setBranchCoords] = useState<{
    startY: number;
    stations: { id: string; endY: number }[];
  }>({ startY: 0, stations: [] });

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
  const ActiveIconComponent = DOMAIN_ICONS[activeTrack.iconName] || Database;

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

  // Mở Side Drawer cho 1 Miền con
  const handleOpenSubdomainDrawer = (sub: SubdomainNode, subIdx: number) => {
    const levels = getSubdomainLevels(sub, activeTrack.domainNumber, subIdx);
    setSelectedSubdomain({
      subdomain: sub,
      domainNum: activeTrack.domainNumber,
      subIdx,
      levels,
    });
    const firstIncomplete = levels.find((l) => !completedLevelIds.has(l.id));
    setActiveLevelCode(firstIncomplete ? firstIncomplete.levelCode : 'BASIC');
    setShowGuidanceModal(false);
  };

  // Tính toán tọa độ nhánh cây SVG giữa Domain Anchor và Station Nodes
  const updateBranchCoordinates = useCallback(() => {
    if (!treeContainerRef.current) return;
    const containerRect = treeContainerRef.current.getBoundingClientRect();
    const activeBtn = domainRefs.current[activeDomainCode];
    if (!activeBtn) return;

    const activeRect = activeBtn.getBoundingClientRect();
    const startY = activeRect.top - containerRect.top + activeRect.height / 2;

    const stationCoords: { id: string; endY: number }[] = [];
    activeTrack.subdomains.forEach((sub) => {
      const el = stationRefs.current[sub.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        stationCoords.push({
          id: sub.id,
          endY: rect.top - containerRect.top + rect.height / 2,
        });
      }
    });

    setBranchCoords({ startY, stations: stationCoords });
  }, [activeDomainCode, activeTrack]);

  useEffect(() => {
    updateBranchCoordinates();
    const timer = setTimeout(updateBranchCoordinates, 120);
    window.addEventListener('resize', updateBranchCoordinates);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateBranchCoordinates);
    };
  }, [updateBranchCoordinates]);

  // Handle ESC key to close Side Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSubdomain(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
              LỘ TRÌNH BỒI DƯỠNG NĂNG LỰC SỐ
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-0.5">
            Lộ trình Bồi dưỡng
          </h1>
        </div>
      </div>

      {/* 2. Horizontal Skill Tree Canvas (Cây Kỹ Năng Phân Nhánh Ngang) */}
      <div
        ref={treeContainerRef}
        className="relative grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-4 items-start pt-2"
      >
        {/* CỘT 1: 5 TRỤ GỐC MIỀN NĂNG LỰC (ROOT COMPETENCY PILLARS) */}
        <div className="lg:col-span-4 space-y-3 z-20">
          <div className="rounded-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-2xs overflow-hidden">
            {/* Top Prominent Banner Header with Flowing Silk Ribbon (Dải lụa mềm mại) */}
            <div className="relative p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white overflow-hidden shadow-xs">
              {/* Decorative Flowing Silk Ribbons SVG */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
                viewBox="0 0 400 120"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="silkRibbon1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
                    <stop offset="50%" stopColor="#93C5FD" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="silkRibbon2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
                    <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="silkStroke" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.45" />
                  </linearGradient>
                </defs>
                {/* Layer 1: Flowing Silk Ribbon 1 */}
                <path
                  d="M -20,85 C 80,110 160,30 260,65 C 330,88 380,35 430,45 L 430,130 L -20,130 Z"
                  fill="url(#silkRibbon1)"
                />
                {/* Layer 2: Intersecting Silk Ribbon 2 */}
                <path
                  d="M -20,35 C 70,5 180,95 290,45 C 350,20 390,50 430,30 L 430,130 L -20,130 Z"
                  fill="url(#silkRibbon2)"
                />
                {/* Layer 3: Silk Crest Strokes */}
                <path
                  d="M -20,85 C 80,110 160,30 260,65 C 330,88 380,35 430,45"
                  fill="none"
                  stroke="url(#silkStroke)"
                  strokeWidth="1.5"
                />
                <path
                  d="M -20,35 C 70,5 180,95 290,45 C 350,20 390,50 430,30"
                  fill="none"
                  stroke="url(#silkStroke)"
                  strokeWidth="1"
                />
              </svg>

              {/* Silky ambient sheen overlay */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute left-1/3 -top-10 w-24 h-24 rounded-full bg-blue-400/20 blur-lg pointer-events-none" />

              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs text-white flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                    <Layers className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-mono leading-none">
                      Trụ Cột Năng Lực Số
                    </h3>
                    <p className="text-[11px] text-blue-100/90 mt-1 leading-snug">
                      Chọn miền để kích hoạt cây kỹ năng
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/30 flex items-center gap-1.5 shrink-0 select-none shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>5 Miền</span>
                </span>
              </div>
            </div>

            {/* Danh sách 5 Trụ Miền */}
            <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {DOMAIN_CURRICULUM.map((track) => {
                const isSelected = activeDomainCode === track.code;
                const isTrackUnlocked =
                  isProUser ||
                  (hasTakenAssessment && Boolean(unlockedFreeDomain) && normalizeDomainCode(track.code) === normalizeDomainCode(unlockedFreeDomain));
                const IconComponent = DOMAIN_ICONS[track.iconName] || Database;

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
                    ref={(el) => {
                      domainRefs.current[track.code] = el;
                    }}
                    type="button"
                    onClick={() => setActiveDomainCode(track.code)}
                    className={`relative w-full text-left p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-2 active:scale-[0.99] ${
                      isSelected
                        ? 'border-blue-600 bg-gradient-to-r from-blue-50/90 via-blue-50/60 to-white dark:from-blue-950/50 dark:via-blue-950/30 dark:to-[#111114] shadow-sm ring-2 ring-blue-600/30'
                        : 'border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/70 dark:hover:bg-zinc-850'
                    }`}
                  >
                    {/* Visual selection indicator strip */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full" />
                    )}

                    {/* Anchor Pin nhô ra nối vào nhánh cây SVG */}
                    {isSelected && (
                      <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 text-white items-center justify-center ring-4 ring-white dark:ring-[#111114] shadow-sm z-30">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
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
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span
                          title={!hasTakenAssessment ? 'Cần làm khảo thí đầu vào để mở khóa' : 'Cần nâng cấp để mở khóa'}
                          className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-blue-600 shrink-0 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-neutral-800 dark:text-zinc-200 line-clamp-1 leading-snug">
                      {track.title}
                    </div>

                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                        <span>{track.subdomains.length} trạm kiến thức</span>
                        <span className={isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Freemium & Baseline Diagnostic Status Card */}
          {!isProUser && (
            <div className="p-4 rounded-3xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{hasTakenAssessment ? 'Tài khoản Miễn phí' : 'Khảo thí đầu vào'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                {hasTakenAssessment && unlockedFreeDomain
                  ? 'Đang mở 1 miền miễn phí. Nâng cấp tài khoản để mở khóa toàn bộ 5 miền và nhận chứng chỉ.'
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
        </div>

        {/* CỘT GIỮA: CANVAS ĐƯỜNG NHÁNH CÂY SVG (ORGANIC BEZIER SVG BRANCHING CANVAS) */}
        <div className="hidden lg:block lg:col-span-1 h-full relative self-stretch pointer-events-none">
          <svg className="w-full h-full absolute inset-0 overflow-visible">
            {branchCoords.stations.map((station, sIdx) => {
              const sub = activeTrack.subdomains[sIdx];
              const subLevels = sub ? getSubdomainLevels(sub, activeTrack.domainNumber, sIdx) : [];
              const completedInSub = subLevels.filter((lvl) => completedLevelIds.has(lvl.id)).length;
              const isAllDone = completedInSub === 4;

              const strokeColor = isAllDone
                ? '#10B981' // emerald-500
                : '#2563EB'; // Cobalt blue cho toàn bộ các nhánh trong miền đang chọn

              const startX = 0;
              const startY = branchCoords.startY;
              const endX = 70;
              const endY = station.endY;

              const controlX1 = startX + 35;
              const controlY1 = startY;
              const controlX2 = startX + 35;
              const controlY2 = endY;

              const pathD = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

              return (
                <g key={station.id} className="transition-all duration-300 ease-out">
                  {/* Subtle Glow backdrop for active branch */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth={5}
                    strokeOpacity={0.18}
                    strokeLinecap="round"
                  />
                  {/* Primary Branching Bezier Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2.25}
                    strokeLinecap="round"
                  />
                  {/* Terminal Pin Node on Station */}
                  <circle
                    cx={endX}
                    cy={endY}
                    r={4}
                    fill={strokeColor}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* CỘT 3: CỤM NODE TRẠM KỸ NĂNG CON (SUB-STATION NODES) */}
        <div key={activeTrack.code} className="lg:col-span-7 space-y-4 pt-4 lg:pt-0">
          {/* Header Chặng Bồi Dưỡng */}
          <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-blue-50/80 via-slate-50/40 to-white dark:from-blue-950/30 dark:via-zinc-900/40 dark:to-[#111114] border border-blue-200/70 dark:border-blue-900/40 shadow-xs space-y-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px] uppercase shadow-2xs">
                    CHẶNG MIỀN {activeTrack.domainNumber}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                    {activeTrack.subdomains.length} Trạm phân nhánh • Chuẩn 4 cấp độ
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {activeTrack.title}
                </h2>
              </div>

              {hasTakenAssessment ? (
                isCurrentDomainUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      const firstSub = activeTrack.subdomains[0];
                      if (firstSub) handleOpenSubdomainDrawer(firstSub, 0);
                    }}
                    className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 active:scale-[0.98] cursor-pointer shrink-0 group"
                  >
                    <span>Vào học trạm 1</span>
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/personal/billing"
                    className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 active:scale-[0.98] cursor-pointer shrink-0 group"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Nâng cấp tài khoản</span>
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBaselineModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 active:scale-[0.98] cursor-pointer shrink-0 group"
                >
                  <span>Khảo thí đầu vào để mở khóa</span>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed max-w-2xl relative z-10">
              {activeTrack.desc}
            </p>

            {/* Tiến độ chặng */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs relative z-10">
              <span className="font-mono text-slate-500 dark:text-neutral-400 text-[11px]">
                Tiến độ: <strong className="text-blue-600 dark:text-blue-400 font-bold">{completedInCurrentTrack}/{totalLevelsInTrack}</strong> cột mốc năng lực ({trackProgressPercent}%)
              </span>
              <div className="w-full sm:w-64 h-2 rounded-full bg-slate-200/80 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${trackProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Locked State Warning if not unlocked */}
          {!isCurrentDomainUnlocked ? (
            <div className="p-8 rounded-3xl bg-slate-50/70 dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 text-center space-y-3">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={1.75} />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Chặng học này đang được khóa
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {!hasTakenAssessment
                    ? 'Bạn cần hoàn thành bài khảo thí đầu vào để mở khóa miễn phí 1 miền năng lực bồi dưỡng.'
                    : 'Nâng cấp tài khoản Pro để mở khóa toàn bộ 5 miền và 21 trạm năng lực số.'}
                </p>
              </div>
              <div className="pt-1">
                {!hasTakenAssessment ? (
                  <button
                    type="button"
                    onClick={() => setIsBaselineModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <span>Làm khảo thí đầu vào</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    href="/personal/billing"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <span>Nâng cấp tài khoản Pro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* DANH SÁCH CÁC NODE TRẠM CON (SUB-STATION CARDS WITH STAGGERED UNROLL) */
            <div className="space-y-4">
              {activeTrack.subdomains.map((sub, sIdx) => {
                const subLevels = getSubdomainLevels(sub, activeTrack.domainNumber, sIdx);
                const completedInThisSub = subLevels.filter((lvl) => completedLevelIds.has(lvl.id)).length;
                const isAllSubCompleted = completedInThisSub === 4;
                const isSubInProgress = completedInThisSub > 0 && !isAllSubCompleted;

                return (
                  <div
                    key={sub.id}
                    ref={(el) => {
                      stationRefs.current[sub.id] = el;
                    }}
                    onClick={() => handleOpenSubdomainDrawer(sub, sIdx)}
                    style={{ animationDelay: `${sIdx * 80}ms` }}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer shadow-2xs group relative overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both active:scale-[0.99] ${
                      isAllSubCompleted
                        ? 'bg-gradient-to-r from-emerald-50/40 via-emerald-50/10 to-white dark:from-emerald-950/20 dark:via-zinc-900/30 dark:to-[#111114] border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400'
                        : 'bg-gradient-to-r from-blue-50/70 via-blue-50/20 to-white dark:from-blue-950/30 dark:via-zinc-900/30 dark:to-[#111114] border-blue-200/90 dark:border-blue-900/60 shadow-xs ring-1 ring-blue-500/20 hover:border-blue-400 dark:hover:border-blue-700'
                    }`}
                  >
                    {/* Physical Connector Pin for SVG branch curve */}
                    <div
                      className={`hidden lg:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-4 ring-white dark:ring-[#111114] shadow-xs transition-transform group-hover:scale-125 z-10 ${
                        isAllSubCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                    />

                    {/* Status side indicator bar */}
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        isAllSubCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                    />

                    <div className="flex items-start gap-4 sm:gap-5">
                      {/* Station Visual Identity Hub */}
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-mono transition-transform duration-300 group-hover:scale-105 select-none ${
                          isAllSubCompleted
                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                            : 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-950/40'
                        }`}
                      >
                        {isAllSubCompleted ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <span className="text-base sm:text-lg font-bold leading-none">0{sIdx + 1}</span>
                        )}
                        <span className="text-[9px] font-mono font-bold tracking-tight opacity-90 uppercase mt-0.5">
                          {isAllSubCompleted ? '4/4 ĐẠT' : isSubInProgress ? `${completedInThisSub}/4` : 'TRẠM'}
                        </span>
                      </div>

                      {/* Main Station Content */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        {/* Top Row: Station Code & Status Tag */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60">
                              TRẠM 0{sIdx + 1}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              Mã: {sub.skillCode}
                            </span>
                          </div>

                          {isAllSubCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              Đã làm chủ (4/4)
                            </span>
                          ) : isSubInProgress ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              Đang bồi dưỡng ({completedInThisSub}/4)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50/70 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-semibold">
                              Sẵn sàng kiểm chứng (0/4)
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {sub.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                            {sub.desc}
                          </p>
                        </div>

                        {/* Bottom Row: 4-Segmented Level Progress Bar & Action CTA */}
                        <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1 min-w-[200px]">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                              <span>Chuẩn 4 cấp độ</span>
                              <span className="font-bold text-neutral-800 dark:text-zinc-200">{completedInThisSub}/4 mốc</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {subLevels.map((lvl, lIdx) => {
                                const isDone = completedLevelIds.has(lvl.id);
                                return (
                                  <div
                                    key={lvl.id}
                                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                                      isDone
                                        ? 'bg-emerald-500 shadow-2xs'
                                        : isSubInProgress && lIdx === completedInThisSub
                                        ? 'bg-blue-600 shadow-2xs animate-pulse ring-2 ring-blue-200 dark:ring-blue-900'
                                        : 'bg-blue-100 dark:bg-zinc-800'
                                    }`}
                                    title={`Mức ${lIdx + 1}: ${lvl.levelName} (${isDone ? 'Đã đạt' : 'Chưa đạt'})`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSubdomainDrawer(sub, sIdx);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                          >
                            <span>Vào kiểm chứng trạm</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SIDE DRAWER (LINEAR / STRIPE STYLE SLIDE-OVER SHEET) */}
      {/* ========================================================================= */}
      {selectedSubdomain && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedSubdomain(null)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200"
          />

          {/* Slide-over Sheet */}
          <div className="fixed inset-y-0 right-0 z-50 max-w-xl w-full bg-white dark:bg-[#111114] border-l border-slate-200/90 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 ease-out overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-zinc-800 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10px] uppercase">
                    TRẠM 0{selectedSubdomain.subIdx + 1} • MIỀN {selectedSubdomain.domainNum}
                  </span>
                  <span className="text-slate-300 dark:text-zinc-700">•</span>
                  <span className="text-xs text-slate-500 font-mono">
                    Mã: {selectedSubdomain.subdomain.skillCode}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                  {selectedSubdomain.subdomain.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubdomain(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
                title="Đóng bảng (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Level Selector Tabs */}
            <div className="px-5 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-zinc-900/40 border-b border-slate-200/60 dark:border-zinc-800/60 overflow-x-auto shrink-0">
              <div className="flex items-center gap-2 min-w-max">
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isTabActive
                          ? cfg.activeTabStyle
                          : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
                      }`}
                    >
                      <span>{lvl.levelName}</span>
                      {isDone && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body Content */}
            {(() => {
              const currentLevel = selectedSubdomain.levels.find((l) => l.levelCode === activeLevelCode);
              if (!currentLevel) return null;
              const isLevelDone = completedLevelIds.has(currentLevel.id);
              const cfg = LEVEL_CONFIGS[currentLevel.levelCode];
              const activeDomainNum = String(activeTrack.domainNumber).padStart(2, '0');

              // Map database module
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

              const effectiveDuration =
                matchedModule?.assessments?.duration_minutes || matchedModule?.duration_minutes || currentLevel.durationMinutes;
              const effectivePassingScore =
                matchedModule?.assessments?.passing_score !== undefined
                  ? Number(matchedModule.assessments.passing_score)
                  : 70;
              const effectivePoints =
                matchedModule?.assessments?.point_reward || matchedModule?.point_reward || currentLevel.pointReward;
              const effectiveBenchmark = matchedModule?.description || currentLevel.benchmarkStandard;

              return (
                <div key={activeLevelCode} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 animate-in fade-in duration-200 text-xs">
                  {/* Status Banner */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${cfg.badgeStyle}`}>
                        {cfg.levelName}
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
                  </div>

                  {/* Chuẩn Đầu Ra Năng Lực */}
                  <div className="space-y-1.5">
                    <span className="font-bold font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 block">
                      Chuẩn đầu ra năng lực:
                    </span>
                    <div className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-zinc-200 leading-relaxed bg-gradient-to-r from-blue-50/80 via-blue-50/40 to-transparent dark:from-blue-950/40 dark:via-blue-950/20 dark:to-transparent p-4 rounded-2xl border-l-4 border-l-blue-600 border border-blue-100/80 dark:border-blue-900/40 shadow-2xs">
                      {effectiveBenchmark}
                    </div>
                  </div>

                  {/* Trọng Tâm Kỹ Năng */}
                  <div className="space-y-2">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-[11px] uppercase tracking-wider text-slate-500 block">
                      Trọng tâm kỹ năng số:
                    </span>
                    <div className="space-y-1.5">
                      {currentLevel.coreSkills.map((skill, sIndex) => (
                        <div key={sIndex} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-4 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2.5 sticky bottom-0 bg-white dark:bg-[#111114] py-3">
                    <Link
                      href={`/personal/learning-path/docs/${selectedSubdomain.subdomain.skillCode}?domain=${activeTrack?.domainNumber || 1}`}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                      title="Xem tài liệu hướng dẫn năng lực số chuyên sâu"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Tài liệu</span>
                    </Link>

                    {(() => {
                      if (matchedModule?.assessment_id) {
                        return (
                          <Link
                            href={`/personal/learning-path/assessment/${matchedModule.id}`}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-md shadow-blue-500/25 active:scale-[0.98] cursor-pointer group"
                          >
                            <span>
                              {matchedModule.is_completed || isLevelDone
                                ? 'Bắt đầu lại'
                                : 'Bắt đầu'}
                            </span>
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </Link>
                        );
                      }

                      if (currentLevel.assessmentId) {
                        return (
                          <Link
                            href={`/personal/take/${currentLevel.assessmentId}`}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-md shadow-blue-500/25 active:scale-[0.98] cursor-pointer group"
                          >
                            <span>{isLevelDone ? 'Bắt đầu lại' : 'Bắt đầu'}</span>
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </Link>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            showToast('Đề kiểm chứng cho học phần này đang được Quản trị viên liên kết từ Ngân hàng đề.');
                          }}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
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
        </>
      )}

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
