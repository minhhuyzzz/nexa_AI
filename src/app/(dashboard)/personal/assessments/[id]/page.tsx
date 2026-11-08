'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
  Loader2,
  Sparkles,
  Lock,
  Compass,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AssessmentMeta {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
  is_published: boolean;
  access_tier: 'FREE' | 'PRO' | 'VIP';
  is_system_baseline: boolean;
  question_count: number;
  domain_breakdown: Array<{
    domainIndex: number;
    title: string;
    questionCount: number;
  }>;
}

const DEFAULT_5_DOMAINS = [
  { domainIndex: 1, title: 'Thông tin & Dữ liệu số', questionCount: 5 },
  { domainIndex: 2, title: 'Giao tiếp & Cộng tác số', questionCount: 5 },
  { domainIndex: 3, title: 'Sáng tạo Nội dung số & AI', questionCount: 5 },
  { domainIndex: 4, title: 'An toàn & Bảo mật số', questionCount: 5 },
  { domainIndex: 5, title: 'Giải quyết Vấn đề số', questionCount: 5 },
];

export default function AssessmentBriefingPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreedToRules, setAgreedToRules] = useState(false);

  const fetchAssessmentMeta = useCallback(async () => {
    setLoading(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId);
      if (!isUUID) {
        setAssessment(null);
        setLoading(false);
        return;
      }

      // 1. Fetch assessment details
      const { data: asm, error: asmError } = await supabase
        .from('assessments')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          passing_score,
          point_reward,
          is_published,
          access_tier,
          is_system_baseline,
          system_code
        `)
        .eq('id', testId)
        .maybeSingle();

      if (asmError || !asm) {
        setAssessment(null);
        setLoading(false);
        return;
      }

      // 2. Fetch items count and domain breakdown
      const { data: itemsData } = await supabase
        .from('assessment_items')
        .select(`
          id,
          competencies (
            domain_id,
            competency_domains (
              domain_index,
              title
            )
          )
        `)
        .eq('assessment_id', asm.id);

      const items = itemsData || [];
      const questionCount = items.length;

      // Calculate domain breakdown
      const domainCountMap = new Map<number, { title: string; count: number }>();
      DEFAULT_5_DOMAINS.forEach((d) => {
        domainCountMap.set(d.domainIndex, { title: d.title, count: 0 });
      });

      items.forEach((it: any) => {
        const dom = it.competencies?.competency_domains;
        const dIdx = dom?.domain_index || 1;
        const cur = domainCountMap.get(dIdx) || { title: dom?.title || `Miền ${dIdx}`, count: 0 };
        domainCountMap.set(dIdx, { ...cur, count: cur.count + 1 });
      });

      const breakdown = Array.from(domainCountMap.entries())
        .map(([domainIndex, val]) => ({
          domainIndex,
          title: val.title,
          questionCount: val.count,
        }))
        .sort((a, b) => a.domainIndex - b.domainIndex);

      setAssessment({
        id: asm.id,
        title: asm.title,
        description:
          asm.description ||
          'Bài khảo thí chẩn đoán chuẩn hóa 5 miền năng lực số. Hoàn thành để tự động xác lập Hồ sơ năng lực và kích hoạt lộ trình học tập bồi dưỡng.',
        duration_minutes: asm.duration_minutes || 25,
        passing_score: Number(asm.passing_score) || 70,
        point_reward: asm.point_reward || 50,
        is_published: Boolean(asm.is_published),
        access_tier: (asm.access_tier as any) || 'FREE',
        is_system_baseline: Boolean(asm.is_system_baseline),
        question_count: questionCount,
        domain_breakdown: breakdown.some((b) => b.questionCount > 0) ? breakdown : DEFAULT_5_DOMAINS,
      });
    } catch (err) {
      console.error('Error fetching assessment briefing:', err);
      setAssessment(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, testId]);

  useEffect(() => {
    fetchAssessmentMeta();
  }, [fetchAssessmentMeta]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-3" strokeWidth={1.75} />
        <p className="text-xs font-medium">Đang chuẩn bị thể lệ bài khảo thí...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <HelpCircle className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Không tìm thấy bài khảo thí
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
          Bài khảo thí này không tồn tại hoặc đã được chuyển sang chế độ tạm ẩn bởi ban quản trị.
        </p>
        <Link
          href="/personal/assessments"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
        >
          <span>Khám phá các bài khảo thí khác</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Giao diện tinh gọn, chuyên biệt cho Bài Khảo Thí Đầu Vào (Baseline)
  if (assessment.is_system_baseline) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <Compass className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
              KHẢO THÍ CHẨN ĐOÁN BAN ĐẦU &bull; MIỄN PHÍ
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight mt-1">
              Thiết lập Hồ sơ Năng lực Số của bạn
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed max-w-lg mx-auto">
            Hoàn thành bài khảo thí để hệ thống nhận diện điểm mạnh và khoảng trống năng lực, từ đó tự động mở khóa lộ trình học tập miễn phí phù hợp nhất cho bạn.
          </p>
        </div>

        {/* 3 Thông số cốt lõi */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 text-center text-xs">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">Số câu hỏi</span>
            <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {assessment.question_count || 25} câu
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">Thời gian</span>
            <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {assessment.duration_minutes || 25} phút
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">Ngưỡng chuẩn</span>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ≥ {assessment.passing_score || 70}%
            </div>
          </div>
        </div>

        {/* 5 Miền được khảo thí */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
            <span>5 Miền năng lực số được khảo thí (mỗi miền 5 câu):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {DEFAULT_5_DOMAINS.map((dom) => (
              <div
                key={dom.domainIndex}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800"
              >
                <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                  {dom.domainIndex}
                </span>
                <span className="text-neutral-800 dark:text-zinc-200 font-medium truncate">
                  {dom.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lợi ích sau khi nộp */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Quy chế và quyền lợi sau khi nộp bài:</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
            Hệ thống chấm điểm tức thì trong 0.01s. Miền năng lực yếu nhất sẽ được <strong>tự động mở khóa MIỄN PHÍ</strong> ngay sau khi nộp để bạn bắt đầu bồi dưỡng kiến thức!
          </p>
        </div>

        {/* Nút Bắt đầu CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <Link
            href="/personal/dashboard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold text-center transition-colors"
          >
            Để sau, về Bảng điều khiển
          </Link>

          <Link
            href={`/personal/take/${testId}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center inline-flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <span>Bắt đầu làm bài khảo thí ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* 1. Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/personal/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh mục khảo thí</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-slate-400">Trạng thái:</span>
          {assessment.is_published ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200/80 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Đang mở khảo thí
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200/80 dark:border-blue-800">
              Sắp phát hành
            </span>
          )}
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {assessment.is_system_baseline && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold font-mono">
              <Sparkles className="w-3 h-3 text-blue-600" />
              KHẢO THÍ ĐẦU VÀO HỆ THỐNG
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-medium border border-slate-200 dark:border-zinc-700">
            Khung Chuẩn 5 Miền Năng Lực Số
          </span>
          {assessment.access_tier === 'PRO' || assessment.access_tier === 'VIP' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold font-mono border border-blue-200">
              <Lock className="w-3 h-3 text-blue-600" /> GÓI CHUYÊN SÂU
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold font-mono border border-emerald-200">
              MIỄN PHÍ
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          {assessment.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
          {assessment.description}
        </p>

        {/* 4 Essential Exam Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Số lượng câu hỏi</span>
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              {assessment.question_count} <span className="text-xs font-normal text-slate-500">câu</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời gian làm bài</span>
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              {assessment.duration_minutes} <span className="text-xs font-normal text-slate-500">phút</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Ngưỡng đạt chuẩn</span>
            </div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              ≥ {assessment.passing_score}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Chứng chỉ năng lực</span>
            </div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 mt-1">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Cấp khi đạt chuẩn</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Domain breakdown & Learner Benefits */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Cấu trúc 5 miền năng lực số */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" strokeWidth={2} />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Cấu trúc 5 miền năng lực số được khảo thí
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đề thi phân bổ câu hỏi đồng đều trên trọn vẹn 5 miền năng lực số chuẩn hóa nhằm phác thảo chính xác bản đồ năng lực của bạn:
            </p>

            <div className="space-y-2.5">
              {assessment.domain_breakdown.map((dom) => (
                <div
                  key={dom.domainIndex}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold font-mono flex items-center justify-center text-[11px]">
                      {dom.domainIndex}
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                      {dom.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-neutral-400">
                    {dom.questionCount > 0 ? `${dom.questionCount} câu hỏi` : 'Đang cập nhật'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Quyền lợi học viên sau khi hoàn thành */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Quyền lợi phát triển năng lực sau khi nộp bài
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-neutral-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Xác lập Hồ sơ Năng lực Số cá nhân:</strong> Tự động tính điểm 5 miền và hiển thị biểu đồ Radar chuẩn xác.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mở khóa Lộ trình học tập miễn phí:</strong> Hệ thống tự động xác định miền năng lực cần bồi dưỡng và mở quyền học tập chuyên sâu ngay lập tức.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cộng điểm tích lũy PTS:</strong> Điểm thưởng được ghi nhận vào lịch sử học tập để xếp hạng và xét cấp chứng chỉ số.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Exam Rules & Sticky CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" strokeWidth={2} />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Quy chế phòng thi & Chống gian lận
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                <span>
                  <strong>Đếm ngược tự động:</strong> Bài thi sẽ tự động thu bài và chấm điểm khi hết thời gian {assessment.duration_minutes} phút.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                <span>
                  <strong>Lưu nháp tức thì:</strong> Mọi lựa chọn câu trả lời đều được lưu tạm thời để phòng ngừa sự cố mất kết nối mạng.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                <span>
                  <strong>Giám sát tập trung:</strong> Không chuyển tab hoặc mở ứng dụng khác trong quá trình làm bài. Hệ thống ghi nhận số lần rời khỏi màn hình thi.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                <span>
                  <strong>Một đáp án đúng:</strong> Mỗi câu hỏi trắc nghiệm chỉ có duy nhất 01 phương án chính xác.
                </span>
              </li>
            </ul>

            {/* Checkbox agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <span>
                  Tôi đã đọc kỹ và cam kết tuân thủ quy chế khảo thí trung thực của nền tảng NEXA.
                </span>
              </label>
            </div>

            {/* Action CTA Button */}
            <div className="pt-2">
              <Link
                href={`/personal/take/${assessment.id}`}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-sm ${
                  agreedToRules
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/20'
                    : 'bg-blue-600/80 hover:bg-blue-600 text-white cursor-pointer'
                }`}
              >
                <span>Bắt đầu làm bài khảo thí</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Hệ thống sẽ chuyển ngay vào giao diện làm bài có bấm giờ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
