'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { mockAssessments } from '@/data/mock-assessments';

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const assessment =
    mockAssessments.find((a) => a.id === testId) || mockAssessments[0];

  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/learner/assessments"
          className="hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
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
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {assessment.domainName}
              </span>

              {assessment.isPro ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Yêu cầu gói Pro
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Miễn phí cho cộng đồng
                </span>
              )}

              <span className="text-[11px] font-mono text-slate-400">
                ID: {assessment.id.toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              {assessment.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {assessment.description}
            </p>
          </div>

          {/* Section: Learning Outcomes (Chuẩn đầu ra được chứng nhận) */}
          <div className="p-5 rounded-md border border-slate-200 bg-white space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>Chuẩn Năng Lực Đầu Ra Được Đo Lường</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Nhận diện và phân loại rủi ro đạo đức, bản quyền nội dung số</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Kỹ năng đặt câu lệnh đa thành phần (Context, Task, Output)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Phương pháp Fact-checking và kiểm chứng chéo số liệu</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Thao tác bảo vệ dữ liệu cá nhân và kích hoạt bảo mật 2FA</span>
              </div>
            </div>
          </div>

          {/* Section: Exam Structure Breakdown (Bảng cấu trúc đề thi) */}
          <div className="p-5 rounded-md border border-slate-200 bg-white space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Cấu Trúc &amp; Phân Bổ Câu Hỏi Khảo Thí</span>
            </h2>

            <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold">
                    <th className="py-2.5 px-3">HÌNH THỨC CÂU HỎI</th>
                    <th className="py-2.5 px-3">SỐ LƯỢNG</th>
                    <th className="py-2.5 px-3">PHƯƠNG THỨC ĐÁNH GIÁ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Trắc nghiệm khách quan (MCQ)
                    </td>
                    <td className="py-2.5 px-3">{assessment.formats.mcq} câu</td>
                    <td className="py-2.5 px-3 text-emerald-700">Chấm tự động tức thì (0.01s)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Xử lý tình huống (Scenario)
                    </td>
                    <td className="py-2.5 px-3">{assessment.formats.scenario} câu</td>
                    <td className="py-2.5 px-3 text-slate-600">Phán đoán &amp; Phân tích nhận định</td>
                  </tr>
                  {assessment.formats.practicalFile > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        Thực hành nộp tệp tin
                      </td>
                      <td className="py-2.5 px-3">{assessment.formats.practicalFile} bài</td>
                      <td className="py-2.5 px-3 text-sky-700">Chấm Rubric (AI hoặc Giảng viên)</td>
                    </tr>
                  )}
                  {assessment.formats.digitalLink > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        Nộp liên kết số (GitHub/Figma)
                      </td>
                      <td className="py-2.5 px-3">{assessment.formats.digitalLink} bài</td>
                      <td className="py-2.5 px-3 text-sky-700">Chấm Rubric sản phẩm số</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Regulations & Grading Rules */}
          <div className="p-5 rounded-md border border-slate-200 bg-white space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Quy Chế Làm Bài &amp; Cơ Chế Đánh Giá</span>
            </h2>
            <div className="space-y-2 text-slate-600 leading-relaxed">
              <p>
                &bull; <strong>Thời gian làm bài:</strong> Đồng hồ đếm ngược {assessment.duration_minutes} phút sẽ bắt đầu ngay khi bạn bấm nút &ldquo;Làm bài đánh giá&rdquo;. Hệ thống tự động lưu từng câu trả lời khi bạn thao tác.
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

        {/* Right Column: Sticky E-Commerce Style Action Box (4 cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-5 text-xs">
            {/* Price / Plan Tier */}
            <div className="pb-4 border-b border-slate-100">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                GÓI KHẢO THÍ
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {assessment.isPro ? 'Gói Cá Nhân Pro' : 'Miễn Phí'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {assessment.isPro
                  ? 'Dành cho thành viên Pro hoặc sinh viên lớp liên kết'
                  : 'Mở tự do cho toàn bộ người học'}
              </div>
            </div>

            {/* Quick Metrics Spec List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Thời lượng làm bài:
                </span>
                <span className="font-bold text-slate-900">
                  {assessment.duration_minutes} phút
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  Điểm chuẩn đạt:
                </span>
                <span className="font-bold text-slate-900">
                  &ge; {assessment.passing_score}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Điểm thưởng hồ sơ:
                </span>
                <span className="font-bold text-emerald-600">
                  +{assessment.point_reward} điểm
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Chứng nhận số:
                </span>
                <span className="font-semibold text-slate-900">
                  Mã QR + Hash SHA-256
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Link
                href={`/learner/take/${assessment.id}`}
                className="w-full py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>Làm bài đánh giá ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Đã chép link</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Chia sẻ bài đánh giá</span>
                  </>
                )}
              </button>
            </div>

            {/* Guarantee Note */}
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
              <div className="font-semibold text-slate-700 mb-0.5">
                Thẩm định học thuật:
              </div>
              Được bảo trợ bởi Hội đồng Chuyên môn NEXA và Khoa CNTT - ĐHQG Hà Nội.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
