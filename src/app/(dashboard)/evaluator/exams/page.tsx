'use client';

import { useState } from 'react';
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
} from 'lucide-react';

interface ExamItem {
  id: string;
  title: string;
  domain: string;
  durationMinutes: number;
  passingScore: number;
  questionCount: {
    mcq: number;
    scenario: number;
    practical: number;
    evidence: number;
  };
  assignedGroups: string[];
  status: 'active' | 'draft' | 'archived';
}

const mockExams: ExamItem[] = [
  {
    id: 'ex-01',
    title: 'Khảo sát năng lực số cơ bản & văn phòng thông minh',
    domain: 'D1: Thông tin & Dữ liệu',
    durationMinutes: 45,
    passingScore: 70,
    questionCount: { mcq: 15, scenario: 3, practical: 1, evidence: 1 },
    assignedGroups: ['DHQG24'],
    status: 'active',
  },
  {
    id: 'ex-02',
    title: 'Đánh giá kỹ năng ứng dụng AI và Tự động hóa công việc',
    domain: 'D3: Sáng tạo Nội dung số',
    durationMinutes: 60,
    passingScore: 75,
    questionCount: { mcq: 10, scenario: 4, practical: 2, evidence: 1 },
    assignedGroups: ['AI-PRO8', 'DHQG24'],
    status: 'active',
  },
  {
    id: 'ex-03',
    title: 'Kiểm tra thực hành an toàn thông tin & bảo vệ danh tính số',
    domain: 'D4: An toàn & Bảo mật',
    durationMinutes: 30,
    passingScore: 80,
    questionCount: { mcq: 12, scenario: 2, practical: 1, evidence: 0 },
    assignedGroups: [],
    status: 'draft',
  },
];

export default function EvaluatorExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>(mockExams);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('D1: Thông tin & Dữ liệu');
  const [newDuration, setNewDuration] = useState(45);
  const [newPassingScore, setNewPassingScore] = useState(70);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEx: ExamItem = {
      id: `ex-${Date.now()}`,
      title: newTitle.trim(),
      domain: newDomain,
      durationMinutes: Number(newDuration),
      passingScore: Number(newPassingScore),
      questionCount: { mcq: 10, scenario: 3, practical: 1, evidence: 1 },
      assignedGroups: [],
      status: 'active',
    };

    setExams((prev) => [newEx, ...prev]);
    setShowCreateModal(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bộ đề đánh giá & Đợt khảo thí
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết kế bài kiểm tra đa hình thức, cấu hình điểm chuẩn đạt và giao cho các nhóm lớp.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo bộ đề mới</span>
        </button>
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-lg space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-600" />
                Tạo Bộ Đề Khảo Thí Mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tiêu đề bộ đề:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đánh giá tư duy số & Phân tích dữ liệu"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Miền năng lực trọng tâm:
                </label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                >
                  <option value="D1: Thông tin & Dữ liệu">Miền 1: Thông tin và Dữ liệu số</option>
                  <option value="D2: Giao tiếp & Hợp tác">Miền 2: Giao tiếp và Hợp tác số</option>
                  <option value="D3: Sáng tạo Nội dung số">Miền 3: Sáng tạo Nội dung số</option>
                  <option value="D4: An toàn & Bảo mật">Miền 4: An toàn và Bảo mật số</option>
                  <option value="D5: Giải quyết Vấn đề">Miền 5: Giải quyết Vấn đề số</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Thời lượng (phút):
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Chuẩn đạt (%):
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newPassingScore}
                    onChange={(e) => setNewPassingScore(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
                >
                  Tạo bộ đề
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Tổng số bộ đề</div>
          <div className="text-2xl font-bold text-slate-900">{exams.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sẵn sàng khảo thí</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Hình thức câu hỏi hỗ trợ</div>
          <div className="text-2xl font-bold text-sky-600">4 / 4</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Trắc nghiệm, Tình huống, Thực hành, Minh chứng</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Lượt thí sinh đã làm</div>
          <div className="text-2xl font-bold text-emerald-600">70</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tỷ lệ đạt chuẩn 84%</div>
        </div>
      </div>

      {/* Exam Sets List */}
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Danh sách bộ đề
        </div>

        <div className="grid grid-cols-1 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {exam.domain}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        exam.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {exam.status === 'active' ? 'Đang kích hoạt' : 'Bản nháp'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Thời gian</div>
                    <div className="font-bold text-slate-800">{exam.durationMinutes} phút</div>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-4">
                    <div className="text-[10px] text-slate-400">Chuẩn đạt</div>
                    <div className="font-bold text-slate-800">{exam.passingScore}/100</div>
                  </div>
                </div>
              </div>

              {/* Composition */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <span>Trắc nghiệm: <strong className="text-slate-900">{exam.questionCount.mcq}</strong></span>
                  <span>Tình huống: <strong className="text-slate-900">{exam.questionCount.scenario}</strong></span>
                  <span>Thực hành: <strong className="text-slate-900">{exam.questionCount.practical}</strong></span>
                  <span>Minh chứng: <strong className="text-slate-900">{exam.questionCount.evidence}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    Đã giao cho {exam.assignedGroups.length} nhóm
                  </span>
                  <Link
                    href={`/evaluator/live-room`}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors"
                  >
                    Mở phòng thi ngay
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
