'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Clock,
  Award,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Bookmark,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  Lock,
  Building,
  Check,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AssessmentDetail {
  id: string;
  title: string;
  description: string;
  domainName: string;
  duration_minutes: number;
  passing_score: number;
  pointReward: number;
  questionCount: number;
  is_vip: boolean;
  access_tier: 'FREE' | 'VIP';
  formats: {
    mcq: number;
    scenario: number;
    practicalFile: number;
  };
}

export default function AssessmentDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [userPlanTier, setUserPlanTier] = useState<string>('FREE');
  const [showVipModal, setShowVipModal] = useState(false);

  const fetchAssessmentDetail = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch user tier
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('plan_tier')
          .eq('id', user.id)
          .maybeSingle();
        if (prof?.plan_tier) {
          setUserPlanTier(prof.plan_tier.toUpperCase());
        }
      }

      // 2. Fetch assessment
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId);
      let query = supabase.from('assessments').select('*');
      if (isUUID) {
        query = query.eq('id', testId);
      } else {
        query = query.limit(1);
      }

      const { data: asm, error: asmError } = await query.maybeSingle();

      if (asmError || !asm) {
        setAssessment(null);
        return;
      }

      // 3. Fetch items count
      const { data: items } = await supabase
        .from('assessment_items')
        .select('id, type')
        .eq('assessment_id', asm.id);

      const itemsList = items || [];
      const mcqCount = itemsList.filter((i) => i.type === 'MCQ').length;
      const scenarioCount = itemsList.filter((i) => i.type === 'SCENARIO').length;
      const practicalCount = itemsList.filter(
        (i) =>
          i.type === 'DIGITAL_EVIDENCE' ||
          i.type === 'PRACTICAL_TASK' ||
          i.type === 'PRACTICAL_FILE' ||
          i.type === 'PRACTICAL'
      ).length;

      setAssessment({
        id: asm.id,
        title: asm.title,
        description: asm.description || 'Bài khảo thí chuẩn hóa năng lực số toàn diện theo khung DigComp 3.0.',
        domainName: 'Đa Miền Năng Lực Số',
        duration_minutes: asm.duration_minutes || 30,
        passing_score: Number(asm.passing_score) || 70,
        pointReward: asm.point_reward || 50,
        questionCount: itemsList.length,
        is_vip: Boolean(asm.is_vip || asm.access_tier === 'VIP'),
        access_tier: asm.access_tier || (asm.is_vip ? 'VIP' : 'FREE'),
        formats: {
          mcq: mcqCount,
          scenario: scenarioCount,
          practicalFile: practicalCount,
        },
      });
    } catch (err) {
      console.error('Error loading assessment detail:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, testId]);

  useEffect(() => {
    fetchAssessmentDetail();
  }, [fetchAssessmentDetail]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
        <p className="text-xs">Đang tải thông tin chi tiết bài khảo thí...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-12 text-center rounded-md border border-slate-200 bg-white max-w-md mx-auto my-12">
        <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Không tìm thấy bài khảo thí</h3>
        <p className="text-xs text-slate-500 mb-4">
          Bài kiểm tra bạn đang tìm không tồn tại hoặc đã được chuyển vào kho lưu trữ.
        </p>
        <Link
          href="/personal/assessments"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Về danh mục bài khảo thí</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/personal/assessments"
          className="hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Danh sách bài khảo thí</span>
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-semibold truncate max-w-sm">
          {assessment.title}
        </span>
      </div>

      {/* Main 2-Column Product Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Information & Specifications (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Title Area */}
          <div className="space-y-3 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {assessment.domainName}
              </span>

              <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                {assessment.questionCount} câu hỏi
              </span>

              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Khảo thí chuẩn hóa
              </span>

              <span className="text-[11px] font-mono text-slate-400">
                Mã: {assessment.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              {assessment.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {assessment.description}
            </p>
          </div>

          {/* Section: Learning Outcomes */}
          <div className="p-5 rounded-md border border-slate-200 bg-white space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Chuẩn Năng Lực Đầu Ra Được Đo Lường</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>Nhận diện và phân loại rủi ro đạo đức, bản quyền nội dung số</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>Kỹ năng đặt câu lệnh đa thành phần (Context, Task, Output)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>Phương pháp Fact-checking và kiểm chứng chéo số liệu</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>Thao tác bảo vệ dữ liệu cá nhân và kích hoạt bảo mật 2FA</span>
              </div>
            </div>
          </div>

          {/* Section: Exam Structure Breakdown */}
          <div className="p-5 rounded-md border border-slate-200 bg-white space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Cấu Trúc &amp; Phân Bổ Câu Hỏi Khảo Thí</span>
            </h2>

            <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold">
                    <th className="py-2.5 px-3">DẠNG BÀI</th>
                    <th className="py-2.5 px-3">SỐ LƯỢNG</th>
                    <th className="py-2.5 px-3">ĐÁNH GIÁ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assessment.formats.mcq > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        Trắc nghiệm
                      </td>
                      <td className="py-2.5 px-3 font-mono">{assessment.formats.mcq} câu</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Tự động (0.01s)</td>
                    </tr>
                  )}
                  {assessment.formats.scenario > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        Tình huống
                      </td>
                      <td className="py-2.5 px-3 font-mono">{assessment.formats.scenario} câu</td>
                      <td className="py-2.5 px-3 text-slate-600">Kế hoạch ứng phó</td>
                    </tr>
                  )}
                  {assessment.formats.practicalFile > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        Thực hành
                      </td>
                      <td className="py-2.5 px-3 font-mono">{assessment.formats.practicalFile} bài</td>
                      <td className="py-2.5 px-3 text-sky-700">Thẩm định Rubric (AI / Chuyên gia)</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Regulations & Grading Rules */}
          <div className="p-5 rounded-md border border-slate-200 bg-white space-y-3 text-xs shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Quy Chế Làm Bài &amp; Cơ Chế Đánh Giá</span>
            </h2>
            <div className="space-y-2 text-slate-600 leading-relaxed">
              <p>
                &bull; <strong>Thời gian làm bài:</strong> Đồng hồ đếm ngược {assessment.duration_minutes} phút sẽ bắt đầu ngay khi bạn bấm nút &ldquo;Bắt đầu làm bài thi&rdquo;. Hệ thống tự động lưu từng câu trả lời khi bạn thao tác.
              </p>
              <p>
                &bull; <strong>Cơ chế chấm điểm:</strong> Điểm trắc nghiệm được tính tức thì ngay sau khi bạn bấm &ldquo;Nộp bài&rdquo;. Đối với phần thực hành nộp tệp hoặc nộp liên kết, bạn có thể chủ động bấm nút <em>&ldquo;Chấm bài thực hành bằng AI&rdquo;</em> để nhận kết quả phân tích Rubric ngay lập tức.
              </p>
              <p>
                &bull; <strong>Bảo mật thông tin:</strong> Toàn bộ dữ liệu bài làm được khử sạch thông tin cá nhân (PII) trước khi xử lý phân tích học thuật.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Action Box (4 cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="p-6 rounded-md border border-slate-200 bg-white space-y-5 shadow-xs">
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Hình thức bài khảo thí</span>
                <span className="font-semibold text-slate-800">Trực tuyến</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Thang điểm bài thi</span>
                <span className="font-semibold text-slate-800 font-mono">10.0 điểm</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Thời gian giới hạn</span>
                <span className="font-semibold text-slate-800 font-mono">{assessment.duration_minutes} phút</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Điểm đạt chuẩn</span>
                <span className="font-semibold text-slate-800 font-mono">≥ 7.0 / 10.0 ({assessment.passing_score}%)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Thưởng đạt chuẩn</span>
                <span className="font-semibold text-emerald-700 font-mono">+10 điểm tích lũy</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {assessment.is_vip && userPlanTier === 'FREE' ? (
                <button
                  type="button"
                  onClick={() => setShowVipModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Nâng cấp VIP để mở khóa bài thi</span>
                </button>
              ) : (
                <Link
                  href={`/personal/take/${assessment.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <span>Bắt đầu làm bài thi ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </Link>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    <span className="text-emerald-700">Đã sao chép liên kết</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                    <span>Chia sẻ bài khảo thí</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Upgrade Modal */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <Lock className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Bài Khảo Thí Nâng Cao Hạng VIP
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bài thi &ldquo;{assessment.title}&rdquo; thuộc danh mục khảo hạch chuyên sâu dành riêng cho tài khoản đã nâng cấp gói VIP / Pro.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800">Quyền lợi khi nâng cấp VIP:</div>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
                <li>Mở khóa 100% đề thi chuyên sâu và bài thực hành AI</li>
                <li>Không giới hạn lượt chấm Rubric bằng AI Gateway</li>
                <li>Cấp chứng chỉ số thẩm định mã hóa SHA-256</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVipModal(false)}
                className="px-3.5 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Để sau
              </button>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Xem Bảng Giá Nâng Cấp
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
