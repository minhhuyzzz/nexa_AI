import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  BookOpenCheck,
  FileCheck,
  BookOpen,
  ArrowRight,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';

interface AdminAssessmentItem {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
  is_published: boolean;
  created_at: string;
}

interface AdminLearningModuleItem {
  id: string;
  skill_code: string;
  domain_code: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  point_reward: number;
  is_published: boolean;
}

export default async function AdminContentPage() {
  const supabase = await createClient();

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, description, duration_minutes, passing_score, point_reward, is_published, created_at')
    .order('created_at', { ascending: false });

  const { data: learningModules } = await supabase
    .from('learning_modules')
    .select('id, skill_code, domain_code, title, description, duration_minutes, point_reward, is_published')
    .order('order_index', { ascending: true });

  const effectiveAssessments: AdminAssessmentItem[] = (assessments || []) as AdminAssessmentItem[];
  const effectiveModules: AdminLearningModuleItem[] = (learningModules || []) as AdminLearningModuleItem[];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              NGÂN HÀNG KHẢO THÍ &amp; HỌC LIỆU BỒI DƯỠNG
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kho Đề Chuẩn Hóa &amp; Học Liệu Năng Lực Số
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị ngân hàng đề đánh giá 4 dạng (MCQ, Scenario, Practical, Evidence) và các module học liệu bồi dưỡng +30 điểm.
          </p>
        </div>
      </div>

      {/* Grid: Assessments on Left, Modules on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessments Box */}
        <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ngân Hàng Đề Khảo Thí ({effectiveAssessments.length})
              </h2>
            </div>
            <Link
              href="/learner/assessments"
              target="_blank"
              className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
            >
              Thư viện đề
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="space-y-3">
            {effectiveAssessments.length === 0 ? (
              <div className="py-12 px-4 rounded-md border border-dashed border-slate-200 text-center space-y-2">
                <FileCheck className="w-6 h-6 text-slate-400 mx-auto" strokeWidth={1.75} />
                <p className="text-xs text-slate-500 font-medium">Chưa có bài khảo thí nào trong hệ thống</p>
                <Link
                  href="/evaluator/exams"
                  className="inline-block text-xs text-sky-600 hover:text-sky-700 font-semibold"
                >
                  Tạo bài khảo thí mới &rarr;
                </Link>
              </div>
            ) : (
              effectiveAssessments.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{exam.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ĐANG PHÁT HÀNH
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {exam.description}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                      {exam.duration_minutes} phút
                    </span>
                    <span className="font-mono">Chuẩn đạt: {exam.passing_score}%</span>
                    <span className="text-sky-700 font-semibold font-mono">Thưởng: +{exam.point_reward} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Modules Box */}
        <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Module Học Liệu Bồi Dưỡng ({effectiveModules.length})
              </h2>
            </div>
            <Link
              href="/learner/learning-path"
              target="_blank"
              className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
            >
              Xem lộ trình
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="space-y-3">
            {effectiveModules.length === 0 ? (
              <div className="py-12 px-4 rounded-md border border-dashed border-slate-200 text-center space-y-2">
                <BookOpen className="w-6 h-6 text-slate-400 mx-auto" strokeWidth={1.75} />
                <p className="text-xs text-slate-500 font-medium">Chưa có module học liệu nào trong hệ thống</p>
              </div>
            ) : (
              effectiveModules.map((mod) => (
                <div
                  key={mod.id}
                  className="p-3.5 rounded-md border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                        Kỹ năng {mod.skill_code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {mod.domain_code}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 line-clamp-1">{mod.title}</h4>
                  </div>

                  <div className="text-right shrink-0 text-[11px] font-mono">
                    <span className="text-emerald-700 font-bold block">+{mod.point_reward} pts</span>
                    <span className="text-slate-400">{mod.duration_minutes} phút</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Danh Mục Chuyên Đề & Học Liệu Bồi Dưỡng DigComp Chuẩn Hóa */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Danh Mục Chuyên Đề &amp; Học Liệu Bồi Dưỡng Năng Lực Số ({effectiveModules.length} Chuyên Đề)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Dữ liệu trực tiếp từ bảng learning_modules trong CSDL chuẩn hóa
          </span>
        </div>

        {effectiveModules.length === 0 ? (
          <div className="py-12 px-4 rounded-md border border-dashed border-slate-200 text-center space-y-2">
            <BookOpen className="w-6 h-6 text-slate-400 mx-auto" strokeWidth={1.75} />
            <p className="text-xs text-slate-500 font-medium">Chưa có chuyên đề học liệu nào được xuất bản trong hệ thống</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {effectiveModules.map((mod) => (
              <div
                key={mod.id}
                className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex flex-col justify-between text-xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border bg-sky-50 text-sky-800 border-sky-200">
                      Kỹ năng {mod.skill_code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {mod.domain_code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs mb-1 line-clamp-2 leading-snug">
                    {mod.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {mod.description || 'Chuyên đề bồi dưỡng năng lực số theo khung DigComp chuẩn hóa.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{mod.duration_minutes} phút</span>
                    <span className="font-mono text-emerald-700 font-bold">+{mod.point_reward} pts</span>
                    <Link
                      href={`/learner/learning-path?moduleId=${mod.id}`}
                      className="text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
                    >
                      <span>Xem nội dung</span>
                      <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
