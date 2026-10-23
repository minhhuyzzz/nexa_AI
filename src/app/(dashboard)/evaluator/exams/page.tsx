'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Plus,
  Clock,
  CheckSquare,
  Users,
  Copy,
  ArrowRight,
  MoreVertical,
  Calendar,
  Layers,
  Loader2,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ExamItem {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  pointReward: number;
  isPublished: boolean;
  createdAt: string;
}

export default function EvaluatorExamsPage() {
  const supabase = createClient();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState(45);
  const [newPassingScore, setNewPassingScore] = useState(70);
  const [newPoints, setNewPoints] = useState(50);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
      } else if (data) {
        const mapped: ExamItem[] = data.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description || 'Bài khảo thí chuẩn hóa năng lực số theo khung DigComp 3.0.',
          durationMinutes: a.duration_minutes || 45,
          passingScore: Number(a.passing_score) || 70,
          pointReward: a.point_reward || 50,
          isPublished: a.is_published ?? true,
          createdAt: new Date(a.created_at).toLocaleDateString('vi-VN'),
        }));
        setExams(mapped);
      }
    } catch (err) {
      console.error('Unexpected error loading exams:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('assessments').insert({
        title: newTitle.trim(),
        description: newDescription.trim() || 'Bài khảo thí chuẩn hóa năng lực số theo khung DigComp 3.0.',
        duration_minutes: Number(newDuration),
        passing_score: Number(newPassingScore),
        point_reward: Number(newPoints),
        is_published: true,
      });

      if (!error) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        await fetchExams();
      } else {
        console.error('Error creating assessment:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('assessments')
      .update({ is_published: !currentStatus })
      .eq('id', id);
    await fetchExams();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              QUẢN TRỊ ĐỀ THI &amp; BÀI KHẢO THÍ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Danh Mục Đề Thi Chuẩn Hóa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết kế bài kiểm tra đa hình thức, thiết lập điểm chuẩn và phân bổ bài thi cho các nhóm học viên.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal((prev) => !prev)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Tạo đề thi mới</span>
        </button>
      </div>

      {/* Inline Create Form (No Popup Modal) */}
      {showCreateModal && (
        <div className="p-5 rounded-md border border-sky-400 bg-white shadow-xs space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Thiết Lập Đề Thi Khảo Thí Mới</span>
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên bài khảo thí / Đề thi *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đánh giá Năng lực Số cơ bản & Văn phòng thông minh"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mô tả chuẩn đầu ra:
                </label>
                <input
                  type="text"
                  placeholder="Mô tả mục tiêu và nội dung chuẩn đầu ra..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Thời lượng (phút):
                </label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Điểm đạt (%):
                </label>
                <input
                  type="number"
                  min={40}
                  max={100}
                  value={newPassingScore}
                  onChange={(e) => setNewPassingScore(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Điểm thưởng:
                </label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />}
                <span>Lưu đề thi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
            <p className="text-xs">Đang tải danh sách bài khảo thí từ CSDL Supabase...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-md border border-slate-200 bg-white">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Chưa có đề thi nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Bạn chưa tạo bài khảo thí nào. Hãy bấm nút dưới đây để thiết lập đề thi đầu tiên.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tạo đề thi mới</span>
            </button>
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-md border border-slate-200 bg-white p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    ID: {exam.id.slice(0, 8)}
                  </span>
                  <button
                    onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                      exam.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {exam.isPublished ? 'Đang kích hoạt' : 'Bản nháp'}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {exam.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>{exam.durationMinutes} phút</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Điểm đạt: {exam.passingScore}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Tạo ngày: {exam.createdAt}
                </span>
                <Link
                  href={`/evaluator/live-room?assessmentId=${exam.id}`}
                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold"
                >
                  <span>Mở phòng thi</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
