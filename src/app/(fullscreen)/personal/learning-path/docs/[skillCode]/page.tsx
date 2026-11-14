'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Target,
  ChevronRight,
  Database,
  Users,
  Lightbulb,
  Shield,
  Wrench,
  Laptop,
  FileText,
  Workflow,
  Layers,
  Sparkle,
  Compass,
} from 'lucide-react';
import {
  COMPETENCY_STATION_DOCS,
  getStationDoc,
  StationDocItem,
} from '@/features/learning-paths/data/competency-station-docs';
import { DOMAIN_CURRICULUM } from '@/features/assessments/data/learning-curriculum';

const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '01': Database,
  '02': Users,
  '03': Lightbulb,
  '04': Shield,
  '05': Wrench,
};

const TOC_SECTIONS = [
  { id: 'overview', title: 'Tổng quan & Chuẩn mực' },
  { id: 'workflow', title: 'Sơ đồ luồng quy trình' },
  { id: 'levels', title: 'Khung 4 cấp độ thành thạo' },
  { id: 'ai-guidelines', title: 'Trợ lực AI & Đạo đức số' },
  { id: 'pitfalls', title: 'Nhận diện bẫy sai sót' },
  { id: 'tools-checklist', title: 'Công cụ & Tự đánh giá' },
];

export default function StationDocsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawSkillCode = (params.skillCode as string) || '3.1';
  const skillCode = rawSkillCode.replace('-', '.');

  const docItem: StationDocItem | null = useMemo(() => {
    return getStationDoc(skillCode) || COMPETENCY_STATION_DOCS['3.1'];
  }, [skillCode]);

  const domainNumber = docItem?.domainNumber || 3;
  const backDomain = searchParams.get('domain') || String(domainNumber);

  // Find module from curriculum to get assessment link
  const matchedModuleInfo = useMemo(() => {
    for (const track of DOMAIN_CURRICULUM) {
      for (const sub of track.subdomains) {
        if (sub.skillCode === skillCode) {
          const firstLesson = sub.lessons?.[0];
          return {
            subdomainTitle: sub.title,
            firstLessonId: firstLesson?.id,
          };
        }
      }
    }
    return null;
  }, [skillCode]);

  // Interactive states
  const [selectedFlowStep, setSelectedFlowStep] = useState<number>(1);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>('overview');

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Track active TOC section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (const sec of TOC_SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const DomainIcon = docItem ? DOMAIN_ICONS[docItem.domainCode] || Lightbulb : Lightbulb;

  if (!docItem) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-base font-semibold">Không tìm thấy tài liệu cho trạm này.</p>
        <Link
          href={`/personal/learning-path?domain=${backDomain}`}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại lộ trình</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col font-sans antialiased selection:bg-blue-100 dark:selection:bg-blue-900/40">
      {/* HEADER: TRONG SUỐT, KHÔNG ĐƯỜNG VIỀN, KHÔNG BỊ MỜ */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-black/90 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Back button + Breadcrumb rõ nét */}
          <div className="flex items-center gap-3.5">
            <Link
              href={`/personal/learning-path?domain=${backDomain}`}
              className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100 inline-flex items-center gap-2 transition-all shadow-xs active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-neutral-700 dark:text-zinc-300" />
              <span>Quay lại lộ trình</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>/</span>
              <span className="text-neutral-700 dark:text-zinc-300 font-medium">{docItem.domainTitle}</span>
              <span>/</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">Trạm {docItem.skillCode}</span>
            </div>
          </div>

          {/* Right: Trạm selector tối giản, chữ rõ nét */}
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={docItem.skillCode}
              onChange={(e) => {
                router.push(`/personal/learning-path/docs/${e.target.value}?domain=${backDomain}`);
              }}
              className="text-xs font-mono font-semibold py-1.5 px-2.5 sm:px-3.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer max-w-[130px] sm:max-w-xs truncate shadow-xs"
            >
              {Object.values(COMPETENCY_STATION_DOCS).map((item) => (
                <option key={item.skillCode} value={item.skillCode}>
                  Trạm {item.skillCode} — {item.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Horizontal Sticky TOC Pill Bar (< lg) */}
      <div className="lg:hidden sticky top-16 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2">
        {TOC_SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {sec.title}
            </a>
          );
        })}
      </div>

      {/* Main SaaS Document Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Main Article Stream */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-16">
            {/* 1. HERO & POSITIONING: ĐẬM NÉT, ĐỘ TƯƠNG PHẢN CAO */}
            <section id="overview" className="space-y-6 scroll-mt-24">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold tracking-wider">
                  <DomainIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{docItem.badge}</span>
                  <span>•</span>
                  <span>MÃ KỸ NĂNG: {docItem.skillCode}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-[1.15]">
                  {docItem.title}
                </h1>

                <p className="text-base sm:text-lg text-neutral-800 dark:text-zinc-200 font-normal leading-relaxed max-w-3xl">
                  {docItem.headline}
                </p>
              </div>

              {/* Sứ mệnh bồi dưỡng: Khung dứt khoát, chữ đen than sắc sảo */}
              <div className="relative pl-6 border-l-3 border-blue-600 dark:border-blue-500 py-1.5 space-y-3 bg-slate-50 dark:bg-zinc-900/60 p-5 rounded-r-2xl border border-slate-200 dark:border-zinc-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  Sứ mệnh bồi dưỡng năng lực NEXA:
                </span>
                <p className="text-sm text-neutral-800 dark:text-zinc-200 leading-relaxed font-normal">
                  {docItem.overview}
                </p>
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-zinc-850/60 text-xs sm:text-sm text-neutral-700 dark:text-zinc-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-neutral-900 dark:text-neutral-100 font-bold">Chuẩn đầu ra mục tiêu: </strong>
                    {docItem.targetOutcome}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. SƠ ĐỒ LUỒNG QUY TRÌNH THỰC TẾ (TRUE CONNECTED FLOWCHART DIAGRAM) */}
            <section id="workflow" className="space-y-6 scroll-mt-24">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <Workflow className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Quy trình tư duy chuẩn hóa</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Sơ đồ luồng quy trình thực hiện
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                  Chuỗi 4 chặng thao tác khép kín nối tiếp nhau. Nhấp chọn từng chặng để xem chi tiết hành động và tiêu chuẩn đầu ra.
                </p>
              </div>

              {/* SƠ ĐỒ DẠNG FLOWCHART VECTƠ NỐI TIẾP NHAU BẰNG MŨI TÊN (TRUE PIPELINE) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111114] border-2 border-slate-200 dark:border-zinc-800 space-y-8 shadow-sm">
                {/* Horizontal flow line with clear arrow connectors on desktop */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 relative">
                  {docItem.workflow.map((step, idx) => {
                    const isSelected = selectedFlowStep === step.stepNumber;
                    const isLast = idx === docItem.workflow.length - 1;

                    return (
                      <div key={step.stepNumber} className="flex-1 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                        {/* Flowchart Node Card */}
                        <button
                          type="button"
                          onClick={() => setSelectedFlowStep(step.stepNumber)}
                          className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-3 border ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/30 shadow-md shadow-blue-500/15'
                              : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border-slate-200 dark:border-zinc-800 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            {/* Chặng badge */}
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                              }`}
                            >
                              0{step.stepNumber}
                            </span>
                            <span
                              className={`text-[11px] font-mono font-bold uppercase ${
                                isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-zinc-400'
                              }`}
                            >
                              Chặng 0{step.stepNumber}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                              {step.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 text-[11px] font-mono">
                            <span className={isSelected ? 'text-blue-600 font-bold' : 'text-slate-500'}>
                              {isSelected ? 'Đang chọn' : 'Xem chặng'}
                            </span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 ${
                                isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-400'
                              }`}
                            />
                          </div>
                        </button>

                        {/* Mũi tên kết nối luồng (Chỉ hiển thị giữa các chặng) */}
                        {!isLast && (
                          <div className="hidden lg:flex items-center justify-center text-slate-300 dark:text-zinc-700 shrink-0 px-1">
                            <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* KHU VỰC CHI TIẾT SÂU CHẶNG ĐANG CHỌN (HIGH-CONTRAST INSPECTOR) */}
                {(() => {
                  const currentStep =
                    docItem.workflow.find((s) => s.stepNumber === selectedFlowStep) || docItem.workflow[0];

                  return (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl bg-white dark:bg-black/40">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs shadow-sm">
                            CHẶNG 0{currentStep.stepNumber}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {currentStep.title}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300">
                          {selectedFlowStep === 1
                            ? 'Khởi động quy trình'
                            : selectedFlowStep === 4
                            ? 'Đóng gói thành phẩm'
                            : 'Thực thi cốt lõi'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider block">
                          THAO TÁC HÀNH ĐỘNG CỤ THỂ:
                        </span>
                        <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed font-normal">
                          {currentStep.action}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="p-4 rounded-xl bg-white dark:bg-black/60 border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                          <span className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>KẾT QUẢ ĐẦU RA KỲ VỌNG:</span>
                          </span>
                          <p className="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                            {currentStep.output}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1.5 shadow-2xs">
                          <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span>MẸO THỰC CHIẾN TỐI ƯU:</span>
                          </span>
                          <p className="text-xs sm:text-sm text-neutral-800 dark:text-zinc-200 leading-relaxed">
                            {currentStep.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* 3. MA TRẬN 4 CẤP ĐỘ THÀNH THẠO (SẮC NÉT, ĐỘ TƯƠNG PHẢN CHUẨN) */}
            <section id="levels" className="space-y-6 scroll-mt-24">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Thang đo tiến độ lũy tiến</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Chuẩn mực đánh giá 4 cấp độ thành thạo
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  Điểm số được công nhận qua bằng chứng thực hành hợp lệ, tăng tiến từng nấc vững chắc.
                </p>
              </div>

              {/* Level list with solid contrast */}
              <div className="space-y-4">
                {docItem.levels.map((lvl) => (
                  <div
                    key={lvl.levelNumber}
                    className="p-6 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/80">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                          L{lvl.levelNumber}
                        </span>
                        <div>
                          <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                            Mức {lvl.levelNumber}: {lvl.levelName}
                          </h3>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400">
                        {lvl.levelNumber === 1
                          ? 'Dưới hướng dẫn / Thao tác cơ bản'
                          : lvl.levelNumber === 2
                          ? 'Tự chủ xử lý tác vụ độc lập'
                          : lvl.levelNumber === 3
                          ? 'Thành thạo phức hợp & Hướng dẫn'
                          : 'Dẫn dắt chiến lược & Đổi mới'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed font-normal">
                      {lvl.standard}
                    </p>

                    {/* Skill tags */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider block">
                        BẰNG CHỨNG KỸ NĂNG CẦN CHỨNG MINH:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {lvl.keySkills.map((skill, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-neutral-800 dark:text-zinc-200 flex items-start gap-2 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                            <span className="leading-snug font-medium">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Context quote */}
                    <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-xs text-neutral-800 dark:text-zinc-200 flex items-start gap-2">
                      <strong className="text-blue-600 dark:text-blue-400 font-bold shrink-0">Bối cảnh áp dụng:</strong>
                      <span>{lvl.contextExample}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. AI RESPONSIBILITY & ETHICS */}
            <section id="ai-guidelines" className="space-y-6 scroll-mt-24">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Trí tuệ nhân tạo có trách nhiệm</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Nguyên tắc kết hợp AI & đạo đức dữ liệu
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  Tận dụng tối đa trí tuệ nhân tạo nhưng luôn duy trì nguyên tắc người giám sát (Human-in-the-loop).
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-6 shadow-xs">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider block">
                    VAI TRÒ CỦA AI TRONG KỸ NĂNG NÀY:
                  </span>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed font-normal">
                    {docItem.aiGuidelines.roleOfAI}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider block">
                    CHECKLIST AN TOÀN & ĐẠO ĐỨC SỐ:
                  </span>
                  <div className="space-y-2">
                    {docItem.aiGuidelines.ethicalChecklist.map((ethic, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 flex items-start gap-2.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span className="leading-relaxed font-medium">{ethic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block mb-0.5">Cảnh báo rủi ro then chốt:</strong>
                    <p className="leading-relaxed">{docItem.aiGuidelines.riskWarning}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. COMMON PITFALLS & CORRECTIONS */}
            <section id="pitfalls" className="space-y-6 scroll-mt-24">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Phòng ngừa lỗi thực tế</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Bẫy sai sót điển hình & thực hành chuẩn
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  Đối chiếu giữa sai lầm thường gặp và giải pháp chuẩn hóa để không bị trừ điểm trong bài khảo thí.
                </p>
              </div>

              <div className="space-y-4">
                {docItem.commonPitfalls.map((pitfall, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-6 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sai lầm */}
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1.5">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                          SAI LẦM THƯỜNG GẶP
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100 leading-snug">
                          {pitfall.mistake}
                        </p>
                        <p className="text-xs text-rose-900 dark:text-rose-200 pt-1">
                          <strong>Hậu quả: </strong>{pitfall.consequence}
                        </p>
                      </div>

                      {/* Thực hành chuẩn */}
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1.5">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          THỰC HÀNH CHUẨN XÁC
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 leading-snug">
                          {pitfall.bestPractice}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. RECOMMENDED TOOLS & SELF CHECKLIST */}
            <section id="tools-checklist" className="space-y-6 scroll-mt-24">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Bộ công cụ & Thẩm định</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Công cụ hỗ trợ & Checklist tự kiểm chứng
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  Tích lũy bằng chứng thực tế và tích chọn các tiêu chí tự kiểm tra trước khi làm bài thi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {docItem.recommendedTools.map((cat, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-2.5 shadow-xs"
                  >
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      {cat.category}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {cat.tools.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Checklist */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs">
                <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider block">
                  CHECKLIST TỰ ĐÁNH GIÁ NĂNG LỰC:
                </span>
                <div className="space-y-2.5">
                  {docItem.selfChecklist.map((item, idx) => {
                    const isChecked = Boolean(checkedItems[idx]);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleCheck(idx)}
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3.5 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 text-blue-950 dark:text-blue-100 font-medium'
                            : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-400 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ACTION BANNER: ĐỔI THÀNH "BẮT ĐẦU LÀM BÀI" RÕ RÀNG */}
            <div className="p-8 sm:p-10 rounded-3xl bg-neutral-900 dark:bg-zinc-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1.5 text-center sm:text-left">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Sẵn sàng ghi nhận điểm năng lực số?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-md">
                  Vượt qua bài kiểm tra với kết quả từ 70% trở lên để tích lũy điểm vào hồ sơ năng lực số lâu dài.
                </p>
              </div>

              {matchedModuleInfo?.firstLessonId && (
                <Link
                  href={`/personal/learning-path/assessment/${matchedModuleInfo.firstLessonId}`}
                  className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 shrink-0 active:scale-[0.98] cursor-pointer"
                >
                  <span>Bắt đầu làm bài</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </main>

          {/* TABLE OF CONTENTS SIDEBAR: TƯƠNG PHẢN CAO, CHỮ SẮC NÉT */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-24 space-y-8">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
              <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider block px-2">
                Mục lục tài liệu
              </span>

              <nav className="space-y-1">
                {TOC_SECTIONS.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className={`block px-3 py-2 rounded-xl text-xs transition-all relative ${
                        isActive
                          ? 'text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60'
                          : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r" />
                      )}
                      <span>{sec.title}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Trạm cùng miền: Chữ sắc nét, mã trạm rõ ràng */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
              <span className="text-xs font-mono font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider block px-2">
                Các trạm cùng miền {docItem.domainNumber}:
              </span>
              <div className="space-y-1.5">
                {Object.values(COMPETENCY_STATION_DOCS)
                  .filter((item) => item.domainCode === docItem.domainCode)
                  .map((item) => {
                    const isCurrent = item.skillCode === docItem.skillCode;
                    return (
                      <Link
                        key={item.skillCode}
                        href={`/personal/learning-path/docs/${item.skillCode}?domain=${backDomain}`}
                        className={`p-2.5 rounded-xl text-xs block transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-neutral-800 dark:text-zinc-200 hover:text-neutral-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium'
                        }`}
                      >
                        <span
                          className={`font-mono text-[11px] block font-semibold ${
                            isCurrent ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          MÃ {item.skillCode}
                        </span>
                        <span className="truncate block mt-0.5">{item.title}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
