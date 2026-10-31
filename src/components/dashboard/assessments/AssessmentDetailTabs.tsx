'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  Award,
  Layers,
  History,
  Send,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  Share2,
  Check,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Users,
  Radio,
  FileCheck,
} from 'lucide-react';

export interface AssessmentItemDetail {
  id: string;
  order_index?: number;
  type: string;
  prompt: string;
  points: number;
  difficulty_level?: string;
  skill_code?: string;
  skill_title?: string;
  domain_title?: string;
  domain_code?: string;
  options?: Array<{ id: string; content: string; is_correct: boolean; explanation?: string | null }>;
  rubric_guide?: string | null;
  structured_rubric?: any;
}

export interface AssessmentDetailData {
  id: string;
  title: string;
  description: string;
  domainName: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
  is_published: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: string;
  is_locked?: boolean;
  has_submissions?: boolean;
  submission_count?: number;
  created_at?: string;
  updated_at?: string;
  cover_image_url?: string | null;
  items: AssessmentItemDetail[];
  campaigns?: Array<{
    id: string;
    title: string;
    status: string;
    class_name: string;
    assigned_count: number;
    submitted_count: number;
    start_at: string;
    end_at: string;
  }>;
  live_sessions?: Array<{
    id: string;
    pin_code: string;
    title: string;
    status: string;
    participant_count: number;
    created_at: string;
  }>;
}

interface AssessmentDetailTabsProps {
  assessment: AssessmentDetailData;
  userRole?: 'ADMIN' | 'EVALUATOR' | 'LEARNER';
  onPublish?: () => Promise<void>;
  onClone?: () => Promise<void>;
}

export function AssessmentDetailTabs({
  assessment,
  userRole = 'EVALUATOR',
  onPublish,
  onClone,
}: AssessmentDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUESTIONS' | 'MATRIX' | 'VERSIONS' | 'DEPLOYMENTS'>('OVERVIEW');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('ALL');

  const totalPoints = assessment.items.length === 0 ? 100 : assessment.items.reduce((acc, it) => acc + (it.points || 0), 0);
  const totalQuestions = assessment.items.length;
  const isLocked = Boolean(assessment.is_locked || assessment.has_submissions || (assessment.submission_count && assessment.submission_count > 0));

  // 5 DigComp domains calculation
  const DOMAINS_SPEC = [
    { code: '01', title: 'Thông tin & Dữ liệu số' },
    { code: '02', title: 'Giao tiếp & Cộng tác số' },
    { code: '03', title: 'Sáng tạo Nội dung số & AI' },
    { code: '04', title: 'An toàn & Bảo mật số' },
    { code: '05', title: 'Giải quyết Vấn đề số' },
  ];

  const domainStats = DOMAINS_SPEC.map((dom) => {
    const matchingItems = assessment.items.filter(
      (it) => it.domain_code === dom.code || (it.domain_title && it.domain_title.toLowerCase().includes(dom.title.toLowerCase().slice(0, 8)))
    );
    const count = matchingItems.length;
    const points = matchingItems.reduce((acc, it) => acc + (it.points || 0), 0);
    return {
      ...dom,
      count,
      points,
      percent: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 20,
    };
  });

  const coveredDomainsCount = domainStats.filter((d) => d.count > 0).length || (totalQuestions === 0 ? 5 : 1);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredItems = assessment.items.filter((it) => {
    if (questionTypeFilter === 'ALL') return true;
    return it.type === questionTypeFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Square 1:1 Aspect Ratio Cover Card */}
          <div className="aspect-square w-28 h-28 sm:w-32 sm:h-32 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-3 text-center shrink-0 relative overflow-hidden group">
            {assessment.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assessment.cover_image_url}
                alt={assessment.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-zinc-400">
                  1:1 Bìa Đề Thi
                </span>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                  {assessment.domainName || 'DigComp 3.0'}
                </span>
              </div>
            )}
            <div className="absolute top-1.5 right-1.5">
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                {assessment.version || 'v1.0'}
              </span>
            </div>
          </div>

          {/* Title & Key Academic Badges */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800">
                {assessment.domainName || 'Đa Miền Năng Lực'}
              </span>

              {assessment.status === 'PUBLISHED' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  Đã phát hành
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Bản nháp (DRAFT)
                </span>
              )}

              {isLocked ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800" title="Đã có bài nộp - Khóa bất biến">
                  <Lock className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                  <span>Khóa bất biến</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                  <Unlock className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                  <span>Có thể chỉnh sửa</span>
                </span>
              )}

              <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
                Mã: {assessment.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {assessment.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                Thời lượng ước tính: <strong className="font-mono text-slate-800 dark:text-zinc-200">{assessment.duration_minutes} phút</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                Điểm chuẩn đạt: <strong className="font-mono text-slate-800 dark:text-zinc-200">{assessment.passing_score}%</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                Bao phủ: <strong className="font-mono text-blue-600 dark:text-blue-400">{coveredDomainsCount}/5 Miền DigComp</strong>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full md:w-auto">
            {assessment.status === 'DRAFT' ? (
              <Link
                href={`/personal/authoring/${assessment.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <span>Tiếp tục soạn thảo</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            ) : (
              <>
                <Link
                  href={`/personal/take/${assessment.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
                  title="Làm thử bản xem trước"
                >
                  <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <span>Làm thử đề</span>
                </Link>

                <Link
                  href={`/personal/live-room?action=create&assessmentId=${assessment.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Radio className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Mở phòng thi trực tiếp</span>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs transition-colors"
              title="Chia sẻ liên kết đề thi"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>Chia sẻ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Locked Immutable Notice Banner */}
        {isLocked && (
          <div className="mt-4 p-3 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs flex items-center gap-2.5 text-slate-700 dark:text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
            <span className="leading-relaxed">
              <strong>Khóa bất biến (Immutable Snapshot):</strong> Đề thi này đã phát sinh bài làm thực tế ({assessment.submission_count || 1} bài nộp). Nội dung câu hỏi và barem điểm được khóa cố định để đảm bảo tính khách quan và pháp lý khảo thí.
            </span>
          </div>
        )}
      </div>

      {/* 2. Tabs Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: '1. Tổng quan', count: null },
          { id: 'QUESTIONS', label: '2. Danh sách câu hỏi', count: totalQuestions },
          { id: 'MATRIX', label: '3. Ma trận 5 miền & Rubric', count: '5 Miền' },
          { id: 'VERSIONS', label: '4. Lịch sử phiên bản', count: assessment.version || 'v1.0' },
          { id: 'DEPLOYMENTS', label: '5. Lần triển khai', count: (assessment.campaigns?.length || 0) + (assessment.live_sessions?.length || 0) },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}
      {/* TAB 1: TỔNG QUAN */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Description & Target */}
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-3 shadow-2xs text-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                Mục tiêu &amp; Đối tượng khảo thí
              </h2>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-xs sm:text-sm">
                {assessment.description || 'Bài khảo thí chuẩn hóa đánh giá toàn diện năng lực số công dân, phục vụ chuẩn đầu ra nghề nghiệp và định hướng lộ trình bồi dưỡng kỹ năng số cá nhân hóa.'}
              </p>
            </div>

            {/* Exam Format Breakdown */}
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-3 shadow-2xs text-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                Cấu trúc đề thi &amp; Phân bổ hình thức
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Trắc nghiệm</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100">
                    {assessment.items.filter((i) => i.type === 'MCQ').length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Chấm tự động</span>
                </div>

                <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Tình huống</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100">
                    {assessment.items.filter((i) => i.type === 'SCENARIO').length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Phán đoán số</span>
                </div>

                <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Nộp tệp tin</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100">
                    {assessment.items.filter((i) => i.type === 'PRACTICAL_FILE' || i.type === 'PRACTICAL').length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Rubric chuyên gia</span>
                </div>

                <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Nộp liên kết số</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100">
                    {assessment.items.filter((i) => i.type === 'DIGITAL_LINK' || i.type === 'DIGITAL_EVIDENCE').length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Minh chứng thực tế</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 1:1 Square Catalog Card Preview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3 shadow-2xs text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-2">
                <span className="font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                  Xem trước Thẻ bài thi (1:1 Square)
                </span>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">1:1 CARD</span>
              </div>

              {/* Exact 1:1 Square Card */}
              <div className="aspect-square w-full rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800">
                      {assessment.domainName}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {totalQuestions} câu hỏi
                    </span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                    {assessment.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
                    {assessment.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                  <span>{assessment.duration_minutes} phút</span>
                  <span>Đạt: &ge; {assessment.passing_score}%</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal italic text-center">
                * Thẻ bài thi hiển thị chuẩn hình vuông tỉ lệ 1:1 trên toàn bộ catalog và dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DANH SÁCH CÂU HỎI */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'MCQ', label: 'Trắc nghiệm' },
                { id: 'SCENARIO', label: 'Tình huống' },
                { id: 'PRACTICAL_FILE', label: 'Nộp tệp tin' },
                { id: 'DIGITAL_LINK', label: 'Nộp link số' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setQuestionTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    questionTypeFilter === f.id
                      ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-black font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              Hiển thị {filteredItems.length}/{totalQuestions} câu hỏi
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md text-xs text-slate-500">
              Chưa có câu hỏi nào thuộc phân loại này.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => {
                const isExpanded = expandedItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-4 transition-all space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 dark:text-zinc-500 w-6">
                          #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800">
                          {item.type}
                        </span>
                        {item.skill_code && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {item.skill_code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {item.points || 10} điểm
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
                          ) : (
                            <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-900 dark:text-zinc-100 font-medium leading-relaxed">
                      {item.prompt}
                    </p>

                    {/* Expandable answers / rubric */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 space-y-3 animate-in fade-in-50 text-xs">
                        {item.options && item.options.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 block text-[11px]">
                              Các lựa chọn trả lời:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.options.map((opt, oIdx) => (
                                <div
                                  key={opt.id || oIdx}
                                  className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                                    opt.is_correct
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-medium'
                                      : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                                  }`}
                                >
                                  <span className="font-mono font-bold text-[10px]">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>
                                  <span className="flex-1">{opt.content}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.rubric_guide && (
                          <div className="p-3 rounded bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                            <span className="font-bold text-blue-900 dark:text-blue-200 block text-[11px] mb-1">
                              Tiêu chí Rubric Chấm:
                            </span>
                            <p className="text-slate-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                              {item.rubric_guide}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MA TRẬN 5 MIỀN & RUBRIC */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-6">
          {/* 5 Domains Coverage Progress */}
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-4 shadow-2xs text-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
              Phân bổ trọng số theo 5 Miền Năng Lực DigComp 3.0
            </h2>

            <div className="space-y-3">
              {domainStats.map((d) => (
                <div key={d.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      Miền {d.code}: {d.title}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-zinc-400">
                      {d.count} câu &bull; <strong className="text-slate-900 dark:text-zinc-100">{d.points}đ</strong> ({d.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        d.count > 0 ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-200 dark:bg-zinc-800'
                      }`}
                      style={{ width: `${Math.max(d.percent, d.count > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Standard Rubric Guidance Matrix */}
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-4 shadow-2xs text-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
              Khung Barem Đánh Giá Chuẩn (Standard Rubric Matrix)
            </h2>
            <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Mức độ đạt</th>
                    <th className="py-2.5 px-3">Tỷ lệ điểm</th>
                    <th className="py-2.5 px-3">Mô tả hành vi năng lực số chuẩn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">Xuất sắc</td>
                    <td className="py-2.5 px-3 font-mono">100%</td>
                    <td className="py-2.5 px-3">Thao tác chính xác, độc lập, tối ưu hóa quy trình với tư duy phản biện cao.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">Đạt yêu cầu</td>
                    <td className="py-2.5 px-3 font-mono">75%</td>
                    <td className="py-2.5 px-3">Đáp ứng đầy đủ mục tiêu khảo thí, có thể tồn tại sai sót nhỏ không ảnh hưởng kết quả chung.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-amber-600 dark:text-amber-400">Cần cải thiện</td>
                    <td className="py-2.5 px-3 font-mono">50%</td>
                    <td className="py-2.5 px-3">Hiểu khái niệm nhưng lúng túng khi thực hành môi trường số thực tế.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-400">Chưa đạt</td>
                    <td className="py-2.5 px-3 font-mono">0%</td>
                    <td className="py-2.5 px-3">Không hoàn thành yêu cầu hoặc sai lệch hoàn toàn về nguyên tắc bảo mật/an toàn.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LỊCH SỬ PHIÊN BẢN */}
      {activeTab === 'VERSIONS' && (
        <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-4 shadow-2xs text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
            Lịch sử phiên bản &amp; Toàn vẹn khảo thí
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                    {assessment.version || 'v1.0'} (Hiện hành)
                  </span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {assessment.status}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-xs">
                  Cập nhật cấu trúc: {totalQuestions} câu hỏi, chuẩn đạt {assessment.passing_score}%, thời lượng {assessment.duration_minutes} phút.
                </p>
                <span className="text-[11px] text-slate-400 font-mono block">
                  Thời gian ghi nhận: {assessment.updated_at || assessment.created_at || 'Mới cập nhật'}
                </span>
              </div>

              {isLocked ? (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-semibold shrink-0">
                  <Lock className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                  <span>Đã khóa cố định</span>
                </div>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                  Bản nháp mở
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LẦN TRIỂN KHAI */}
      {activeTab === 'DEPLOYMENTS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Các Đợt Thi &amp; Phiên Trực Tiếp Sử Dụng Bộ Đề
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Quản lý chiến dịch khảo thí doanh nghiệp và phiên phòng thi PIN trực tiếp.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/personal/live-room?action=create&assessmentId=${assessment.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Mở phòng thi PIN</span>
              </Link>
            </div>
          </div>

          {/* Active Campaigns List */}
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-3 shadow-2xs text-xs">
            <h3 className="font-bold text-slate-900 dark:text-zinc-100 uppercase text-xs tracking-wide">
              Đợt đánh giá doanh nghiệp (Assessment Campaigns)
            </h3>
            {assessment.campaigns && assessment.campaigns.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                {assessment.campaigns.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 block">{c.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Lớp: {c.class_name} &bull; Tiến độ: {c.submitted_count}/{c.assigned_count} bài nộp
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-zinc-400 text-xs italic">
                Chưa có chiến dịch Campaign nào sử dụng bộ đề này.
              </p>
            )}
          </div>

          {/* Live Sessions List */}
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-3 shadow-2xs text-xs">
            <h3 className="font-bold text-slate-900 dark:text-zinc-100 uppercase text-xs tracking-wide">
              Phiên phòng thi trực tiếp (Live PIN Sessions)
            </h3>
            {assessment.live_sessions && assessment.live_sessions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                {assessment.live_sessions.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 block">{s.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        Mã PIN: <strong>{s.pin_code}</strong> &bull; {s.participant_count} thí sinh
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-zinc-400 text-xs italic">
                Chưa có phiên thi Live PIN nào được tạo từ bộ đề này.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
