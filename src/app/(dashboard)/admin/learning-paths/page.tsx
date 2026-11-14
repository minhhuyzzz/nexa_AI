'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Loader2,
  X,
  Check,
  Settings,
  ShieldCheck,
  Database,
  Users,
  Lightbulb,
  Shield,
  Wrench,
  CheckSquare,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  DOMAIN_CURRICULUM,
  getSubdomainLevels,
  DomainTrack,
  SubdomainNode,
  CompetencyLevelItem,
} from '@/features/assessments/data/learning-curriculum';

interface LearningModuleItem {
  id: string;
  path_id?: string | null;
  domain_code: string;
  skill_code: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  point_reward: number;
  content_markdown?: string | null;
  is_published: boolean;
  order_index: number;
  assessment_id?: string | null;
  access_tier: 'FREE' | 'VIP';
  created_at?: string;
  updated_at?: string;
  assessments?: {
    id: string;
    title: string;
    passing_score: number;
    duration_minutes: number;
    point_reward: number;
    security_settings?: Record<string, any>;
  } | null;
}

interface AssessmentOption {
  id: string;
  title: string;
  passing_score: number;
  duration_minutes: number;
  point_reward: number;
  questionCount?: number;
  target_domain?: string;
}

const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Users,
  Lightbulb,
  Shield,
  Wrench,
};

function normalizeDomain(code: string | null | undefined): string {
  if (!code) return '01';
  const match = String(code).match(/(\d+)/);
  return match ? match[1].padStart(2, '0') : '01';
}

export default function AdminLearningPathsPage() {
  const [selectedDomainCode, setSelectedDomainCode] = useState<string>('01');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [modules, setModules] = useState<LearningModuleItem[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<AssessmentOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingStation, setSavingStation] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Station Drawer Configuration State
  const [isStationDrawerOpen, setIsStationDrawerOpen] = useState<boolean>(false);
  const [currentStationTarget, setCurrentStationTarget] = useState<{
    domain: DomainTrack;
    subdomain: SubdomainNode;
    level: CompetencyLevelItem;
    existingModule?: LearningModuleItem | null;
  } | null>(null);

  // Form Fields for Station Drawer
  const [stationTitle, setStationTitle] = useState<string>('');
  const [stationDescription, setStationDescription] = useState<string>('');
  const [stationAssessmentId, setStationAssessmentId] = useState<string>('');
  const [stationDurationMinutes, setStationDurationMinutes] = useState<number>(15);
  const [stationPassingScore, setStationPassingScore] = useState<number>(100);
  const [stationPointReward, setStationPointReward] = useState<number>(25);
  const [stationAntiTabSwitch, setStationAntiTabSwitch] = useState<boolean>(true);
  const [stationMaxTabViolations, setStationMaxTabViolations] = useState<number>(3);
  const [stationAntiCopy, setStationAntiCopy] = useState<boolean>(true);
  const [stationCooldownMinutes, setStationCooldownMinutes] = useState<number>(15);
  const [stationBenchmark, setStationBenchmark] = useState<string>('');
  const [stationGuidance, setStationGuidance] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all assessments from Ngân hàng đề chuẩn
  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/assessments');
      const data = await res.json();
      if (res.ok) {
        const raw = data.assessments || [];
        const mapped: AssessmentOption[] = raw.map((a: any) => ({
          id: a.id,
          title: a.title,
          passing_score: Number(a.passing_score ?? 70),
          duration_minutes: Number(a.duration_minutes ?? 45),
          point_reward: Number(a.point_reward ?? 50),
          questionCount: Array.isArray(a.assessment_items) ? a.assessment_items.length : 0,
          target_domain: a.target_domain,
        }));
        setAvailableAssessments(mapped);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    }
  }, []);

  // Fetch all learning modules from database
  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/learning-modules');
      const data = await res.json();
      if (res.ok) {
        setModules(data.modules || []);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchAssessments(), fetchModules()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchAssessments, fetchModules]);

  // Find module matching a specific domain, skill, and level number
  const findModule = useCallback(
    (domainCode: string, skillCode: string, levelNumber: number): LearningModuleItem | null => {
      const targetDomainNorm = normalizeDomain(domainCode);
      return (
        modules.find((m) => {
          const modDomainNorm = normalizeDomain(m.domain_code);
          return (
            modDomainNorm === targetDomainNorm &&
            m.skill_code === skillCode &&
            Number(m.order_index) === levelNumber
          );
        }) || null
      );
    },
    [modules]
  );

  // Open Station Configuration Drawer
  const handleOpenStationConfig = (
    domain: DomainTrack,
    subdomain: SubdomainNode,
    level: CompetencyLevelItem
  ) => {
    const existing = findModule(domain.code, subdomain.skillCode, level.levelNumber);

    setCurrentStationTarget({
      domain,
      subdomain,
      level,
      existingModule: existing,
    });

    const linkedAssessment = existing?.assessments;
    const sec = linkedAssessment?.security_settings || {};

    setStationTitle(
      existing?.title ||
        `${subdomain.title} - Cấp ${level.levelNumber} (${level.levelName})`
    );
    setStationDescription(existing?.description || level.benchmarkStandard);
    setStationAssessmentId(existing?.assessment_id || '');
    setStationDurationMinutes(
      linkedAssessment?.duration_minutes || existing?.duration_minutes || level.durationMinutes || 15
    );
    setStationPassingScore(
      linkedAssessment?.passing_score !== undefined
        ? Number(linkedAssessment.passing_score)
        : 100
    );
    setStationPointReward(
      linkedAssessment?.point_reward || existing?.point_reward || level.pointReward || 25
    );
    setStationAntiTabSwitch(sec.antiTabSwitch !== false);
    setStationMaxTabViolations(Number(sec.maxTabSwitchViolations) || 3);
    setStationAntiCopy(sec.antiCopy !== false);
    setStationCooldownMinutes(typeof sec.cooldownMinutes === 'number' ? sec.cooldownMinutes : 15);
    setStationBenchmark(level.benchmarkStandard);
    setStationGuidance(level.guidanceText);

    setIsStationDrawerOpen(true);
  };

  // Save Station Configuration
  const handleSaveStationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStationTarget) return;

    setSavingStation(true);
    try {
      const { domain, subdomain, level, existingModule } = currentStationTarget;

      const securitySettings = {
        antiTabSwitch: stationAntiTabSwitch,
        maxTabSwitchViolations: stationMaxTabViolations,
        antiCopy: stationAntiCopy,
        cooldownMinutes: stationCooldownMinutes,
      };

      const payload = {
        domain_code: domain.code,
        skill_code: subdomain.skillCode,
        title: stationTitle.trim(),
        description: stationDescription.trim(),
        duration_minutes: stationDurationMinutes,
        passing_score: stationPassingScore,
        point_reward: stationPointReward,
        assessment_id: stationAssessmentId || null,
        order_index: level.levelNumber,
        is_published: true,
        access_tier: 'FREE',
        security_settings: securitySettings,
      };

      let res: Response;
      if (existingModule?.id) {
        res = await fetch(`/api/admin/learning-modules/${existingModule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/learning-modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi khi lưu cấu hình trạm');
      }

      showToast('Đã lưu cấu hình trạm kiểm chứng thành công');
      setIsStationDrawerOpen(false);
      await fetchModules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setSavingStation(false);
    }
  };

  // Current selected domain object
  const currentDomain = useMemo(() => {
    return (
      DOMAIN_CURRICULUM.find((d) => d.code === selectedDomainCode) ||
      DOMAIN_CURRICULUM[0]
    );
  }, [selectedDomainCode]);

  // Filter subdomains based on search
  const filteredSubdomains = useMemo(() => {
    if (!searchQuery.trim()) return currentDomain.subdomains;
    const q = searchQuery.toLowerCase().trim();
    return currentDomain.subdomains.filter(
      (sub) =>
        sub.title.toLowerCase().includes(q) ||
        sub.skillCode.toLowerCase().includes(q) ||
        sub.desc.toLowerCase().includes(q)
    );
  }, [currentDomain, searchQuery]);

  // Domain station stats
  const domainStationStats = useMemo(() => {
    let totalStations = 0;
    let configuredStations = 0;

    currentDomain.subdomains.forEach((sub, sIdx) => {
      const levels = getSubdomainLevels(sub, currentDomain.domainNumber, sIdx);
      totalStations += levels.length;
      levels.forEach((lvl) => {
        const mod = findModule(currentDomain.code, sub.skillCode, lvl.levelNumber);
        if (mod?.assessment_id) {
          configuredStations++;
        }
      });
    });

    return { totalStations, configuredStations };
  }, [currentDomain, findModule]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-900 dark:text-neutral-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 border border-neutral-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              LỘ TRÌNH VÀ TRẠM KIỂM CHỨNG
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500">• 5 Miền Năng Lực Chuẩn Hóa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản trị Trạm Kiểm chứng Năng lực
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-3xl leading-relaxed">
            Cấu hình đề thi, thời lượng, chuẩn đạt và giám sát cho từng cấp độ trong 21 kỹ năng thành phần.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Ngân hàng đề chuẩn</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Overview Status Bar */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Cấu trúc 5 Miền Năng lực (21 Kỹ năng • 84 Trạm kiểm chứng)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Đã gắn đề:</span>
          <strong className="text-blue-600 dark:text-blue-400">
            {domainStationStats.configuredStations} / {domainStationStats.totalStations} trạm
          </strong>
        </div>
      </div>

      {/* 3-TIER HIERARCHY */}
      <div className="space-y-6">
        {/* Tầng 1: 5 Thẻ Miền Năng Lực Lớn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DOMAIN_CURRICULUM.map((d) => {
            const isSelected = selectedDomainCode === d.code;
            const IconComp = DOMAIN_ICONS[d.iconName] || Database;

            let totalInDomain = 0;
            let readyInDomain = 0;
            d.subdomains.forEach((sub, sIdx) => {
              const lvls = getSubdomainLevels(sub, d.domainNumber, sIdx);
              totalInDomain += lvls.length;
              lvls.forEach((l) => {
                const m = findModule(d.code, sub.skillCode, l.levelNumber);
                if (m?.assessment_id) readyInDomain++;
              });
            });

            return (
              <button
                key={d.code}
                type="button"
                onClick={() => setSelectedDomainCode(d.code)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-600/30'
                    : 'border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400">
                    {d.subdomains.length} kỹ năng
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block uppercase">
                    Miền {d.domainNumber}
                  </span>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 mt-0.5 leading-snug">
                    {d.title}
                  </h3>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Trạm sẵn sàng:</span>
                  <span className="font-bold text-neutral-800 dark:text-zinc-200">
                    {readyInDomain}/{totalInDomain}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tầng 2 & Tầng 3: Danh Sách Kỹ Năng Thành Phần và 4 Cấp Độ Kiểm Chứng */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Miền {currentDomain.domainNumber}: {currentDomain.title}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredSubdomains.length} kỹ năng thành phần)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                {currentDomain.desc}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kỹ năng thành phần..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard className="h-44 w-full" />
              <SkeletonCard className="h-44 w-full" />
            </div>
          ) : filteredSubdomains.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Không tìm thấy kỹ năng phù hợp.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubdomains.map((sub, sIdx) => {
                const levels = getSubdomainLevels(sub, currentDomain.domainNumber, sIdx);

                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs space-y-4"
                  >
                    {/* Subdomain Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {sub.skillCode}
                          </span>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {sub.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-1">
                          {sub.desc}
                        </p>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        4 trạm kiểm chứng độc lập
                      </span>
                    </div>

                    {/* 4 Cấp Độ Kiểm Chứng Độc Lập */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {levels.map((lvl) => {
                        const existingMod = findModule(currentDomain.code, sub.skillCode, lvl.levelNumber);
                        const linkedAss = existingMod?.assessments;
                        const isConfigured = Boolean(existingMod?.assessment_id && linkedAss);
                        const duration = linkedAss?.duration_minutes || existingMod?.duration_minutes || lvl.durationMinutes || 15;
                        const passingScore = linkedAss?.passing_score !== undefined ? Number(linkedAss.passing_score) : 100;
                        const pts = linkedAss?.point_reward || existingMod?.point_reward || lvl.pointReward || 25;
                        const sec = linkedAss?.security_settings || {};
                        const hasAntiTab = sec.antiTabSwitch !== false;
                        const hasAntiCopy = sec.antiCopy !== false;

                        return (
                          <div
                            key={lvl.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between transition-all space-y-3 ${
                              isConfigured
                                ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10'
                                : 'border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/20'
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Level Badge and Status */}
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                                  Cấp {lvl.levelNumber}: {lvl.levelName}
                                </span>

                                {isConfigured ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                                    <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
                                    <AlertCircle className="w-3 h-3" /> Chưa gắn đề
                                  </span>
                                )}
                              </div>

                              {/* Assessment Title */}
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                  Đề kiểm chứng
                                </span>
                                <h4
                                  className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 min-h-[32px] mt-0.5"
                                  title={linkedAss?.title || 'Chưa gắn đề'}
                                >
                                  {linkedAss?.title || 'Đang chuẩn bị đề khảo thí'}
                                </h4>
                              </div>

                              {/* Station Parameters */}
                              <div className="space-y-1.5 pt-1 text-[11px] font-mono">
                                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" /> Thời lượng:
                                  </span>
                                  <strong className="text-neutral-900 dark:text-neutral-100">{duration} phút</strong>
                                </div>

                                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <CheckSquare className="w-3 h-3 text-slate-400" /> Chuẩn đạt:
                                  </span>
                                  <strong className="text-blue-600 dark:text-blue-400">{passingScore}%</strong>
                                </div>

                                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <Award className="w-3 h-3 text-slate-400" /> Thưởng:
                                  </span>
                                  <strong className="text-neutral-900 dark:text-neutral-100">+{pts} PTS</strong>
                                </div>

                                {/* Security Badges */}
                                <div className="flex items-center gap-1 pt-1 flex-wrap">
                                  {hasAntiTab && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                      Chống đổi tab
                                    </span>
                                  )}
                                  {hasAntiCopy && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                      Chống copy
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Configure Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenStationConfig(currentDomain, sub, lvl)}
                              className="w-full mt-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-neutral-900 dark:text-neutral-100 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                            >
                              <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Cấu hình trạm</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DRAWER CẤU HÌNH TRẠM KIỂM CHỨNG ĐỘC LẬP */}
      {isStationDrawerOpen && currentStationTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111114] w-full max-w-xl h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    CẤU HÌNH TRẠM KIỂM CHỨNG
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentStationTarget.subdomain.skillCode}
                  </span>
                </div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-md mt-0.5">
                  {currentStationTarget.subdomain.title}
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  Cấp {currentStationTarget.level.levelNumber}: {currentStationTarget.level.levelName}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsStationDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSaveStationConfig} className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* Nhóm 1: Đề thi kiểm chứng */}
              <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Đề thi kiểm chứng (Ngân hàng đề)</span>
                  </label>
                  <Link
                    href="/admin/content"
                    className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Mở Ngân hàng đề</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>

                <select
                  value={stationAssessmentId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setStationAssessmentId(chosenId);
                    const found = availableAssessments.find((a) => a.id === chosenId);
                    if (found) {
                      setStationPassingScore(found.passing_score || 100);
                      setStationDurationMinutes(found.duration_minutes || 15);
                      setStationPointReward(found.point_reward || 25);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Chưa gán đề (Đang chuẩn bị đề khảo thí) --</option>
                  {availableAssessments.map((ass) => (
                    <option key={ass.id} value={ass.id}>
                      {ass.title} ({ass.questionCount || 0} câu - {ass.duration_minutes}p - Chuẩn {ass.passing_score}%)
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Liên kết bài kiểm chứng chuẩn hóa cho Cấp {currentStationTarget.level.levelNumber} của kỹ năng này.
                </p>
              </div>

              {/* Nhóm 2: Thời lượng làm bài và Chuẩn điểm */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thời gian và Chuẩn điểm vượt trạm</span>
                </h3>

                {/* Thời lượng làm bài */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      Thời lượng làm bài (phút)
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">Tự do thiết lập</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={stationDurationMinutes}
                      onChange={(e) => setStationDurationMinutes(Math.max(5, parseInt(e.target.value, 10) || 15))}
                      className="w-28 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <div className="flex items-center gap-1">
                      {[15, 20, 30, 45, 60].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setStationDurationMinutes(m)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer transition ${
                            stationDurationMinutes === m
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                          }`}
                        >
                          {m}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chuẩn điểm vượt qua */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      Chuẩn điểm vượt qua (%)
                    </label>
                    <span className="text-[11px] font-mono text-blue-600 font-bold">
                      Hiện tại: {stationPassingScore}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={stationPassingScore}
                      onChange={(e) => setStationPassingScore(Math.min(100, Math.max(10, parseInt(e.target.value, 10) || 100)))}
                      className="w-28 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <div className="flex items-center gap-1">
                      {[70, 80, 90, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setStationPassingScore(pct)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer transition ${
                            stationPassingScore === pct
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Điểm thưởng PTS */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      Điểm thưởng hoàn thành (PTS)
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">+{stationPointReward} PTS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={stationPointReward}
                      onChange={(e) => setStationPointReward(Math.max(0, parseInt(e.target.value, 10) || 25))}
                      className="w-28 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <div className="flex items-center gap-1">
                      {[15, 25, 40, 60].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setStationPointReward(p)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer transition ${
                            stationPointReward === p
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                          }`}
                        >
                          +{p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Giám sát Phòng thi (Toggle Switches) */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Giám sát phòng thi và Chống gian lận</span>
                </h3>

                {/* Chống đổi tab - TOGGLE SWITCH */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block text-[11px]">
                      Phủ trắng và cảnh báo khi đổi tab
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tự động che màn hình bài thi khi thí sinh chuyển sang cửa sổ khác
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={stationAntiTabSwitch}
                    onClick={() => setStationAntiTabSwitch(!stationAntiTabSwitch)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      stationAntiTabSwitch ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        stationAntiTabSwitch ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {stationAntiTabSwitch && (
                  <div className="pl-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Số lần vi phạm tối đa trước khi tự thu bài:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={stationMaxTabViolations}
                      onChange={(e) => setStationMaxTabViolations(Math.max(1, parseInt(e.target.value, 10) || 3))}
                      className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100"
                    />
                  </div>
                )}

                {/* Chống sao chép - TOGGLE SWITCH */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block text-[11px]">
                      Chống sao chép nội dung
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Khóa chuột phải, chặn phím tắt Ctrl+C, Ctrl+U và phím F12
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={stationAntiCopy}
                    onClick={() => setStationAntiCopy(!stationAntiCopy)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      stationAntiCopy ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        stationAntiCopy ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Cooldown */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      Thời gian chờ thi lại nếu chưa đạt (phút)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">0 = cho thi lại ngay</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={stationCooldownMinutes}
                    onChange={(e) => setStationCooldownMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Nhóm 4: Chuẩn đầu ra năng lực */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Chuẩn đầu ra năng lực
                </h3>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Chuẩn đầu ra:
                  </label>
                  <textarea
                    rows={2}
                    value={stationBenchmark}
                    onChange={(e) => setStationBenchmark(e.target.value)}
                    placeholder="Mô tả chuẩn đầu ra năng lực của cấp độ..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Trọng tâm bồi dưỡng:
                  </label>
                  <textarea
                    rows={2}
                    value={stationGuidance}
                    onChange={(e) => setStationGuidance(e.target.value)}
                    placeholder="Gợi ý nội dung học tập và trọng tâm ôn luyện..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStationDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingStation}
                  className="px-6 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingStation && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingStation ? 'Đang lưu...' : 'Lưu cấu hình trạm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
