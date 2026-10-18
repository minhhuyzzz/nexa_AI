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
  duration_minutes: number;
  point_reward: number;
  is_published: boolean;
}

export default async function AdminContentPage() {
  const supabase = await createClient();

  const mockFallbackAssessments: AdminAssessmentItem[] = [
    {
      id: 'asm-01',
      title: 'Đánh Giá Năng Lực Số Chuẩn Quốc Gia (DigComp VN)',
      description: 'Bộ đề benchmark toàn diện 5 miền năng lực theo chuẩn DigComp 2.2 với 12 câu hỏi tích hợp trắc nghiệm, tình huống và thao tác thực hành.',
      duration_minutes: 45,
      passing_score: 70,
      point_reward: 50,
      is_published: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'asm-02',
      title: 'Khảo Sát Kỹ Năng An Toàn Số & Nhận Diện Lừa Đảo',
      description: 'Đánh giá khả năng bảo vệ dữ liệu cá nhân, nhận diện email phishing và thiết lập xác thực 2 bước (2FA).',
      duration_minutes: 30,
      passing_score: 75,
      point_reward: 40,
      is_published: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'asm-03',
      title: 'Ứng Dụng Trí Tuệ Nhân Tạo & Kỹ Thuật Prompting',
      description: 'Khảo sát năng lực sử dụng các mô hình ngôn ngữ lớn để tăng tốc công việc, soạn thảo văn bản và tóm tắt tài liệu.',
      duration_minutes: 40,
      passing_score: 70,
      point_reward: 60,
      is_published: true,
      created_at: new Date().toISOString(),
    },
  ];

  const mockFallbackModules: AdminLearningModuleItem[] = [
    { id: 'm-1', skill_code: '1.2', domain_code: 'Miền 1', title: 'Phương pháp kiểm chứng độ tin cậy của thông tin số', duration_minutes: 20, point_reward: 30, is_published: true },
    { id: 'm-2', skill_code: '2.4', domain_code: 'Miền 2', title: 'Kỹ năng cộng tác hiệu quả qua văn phòng đám mây', duration_minutes: 25, point_reward: 30, is_published: true },
    { id: 'm-3', skill_code: '3.4', domain_code: 'Miền 3', title: 'Tự động hóa tác vụ lặp lại bằng công cụ trực quan', duration_minutes: 30, point_reward: 30, is_published: true },
    { id: 'm-4', skill_code: '4.2', domain_code: 'Miền 4', title: 'Bảo vệ danh tính cá nhân và bí mật kinh doanh số', duration_minutes: 25, point_reward: 30, is_published: true },
  ];

  // Try fetching from database
  let effectiveAssessments = mockFallbackAssessments;
  let effectiveModules = mockFallbackModules;

  try {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, point_reward, is_published, created_at')
      .order('created_at', { ascending: false });

    if (assessments && assessments.length > 0) {
      effectiveAssessments = assessments as AdminAssessmentItem[];
    }

    const { data: learningModules } = await supabase
      .from('learning_modules')
      .select('id, skill_code, domain_code, title, duration_minutes, point_reward, is_published')
      .order('order_index', { ascending: true });

    if (learningModules && learningModules.length > 0) {
      effectiveModules = learningModules as AdminLearningModuleItem[];
    }
  } catch {
    // Keep fallback
  }

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
            {effectiveAssessments.map((exam) => (
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
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                    {exam.duration_minutes} phút
                  </span>
                  <span>Chuẩn đạt: {exam.passing_score}%</span>
                  <span className="text-sky-700 font-semibold">Thưởng: +{exam.point_reward} pts</span>
                </div>
              </div>
            ))}
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
            {effectiveModules.map((mod) => (
              <div
                key={mod.id}
                className="p-3.5 rounded-md border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                      Kỹ năng {mod.skill_code}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {mod.domain_code}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 line-clamp-1">{mod.title}</h4>
                </div>

                <div className="text-right shrink-0 text-[11px]">
                  <span className="text-emerald-700 font-bold block">+{mod.point_reward} pts</span>
                  <span className="text-slate-400">{mod.duration_minutes} phút</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
