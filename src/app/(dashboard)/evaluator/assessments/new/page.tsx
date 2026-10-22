'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  FileCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface QuestionDraft {
  id: string;
  type: 'MCQ' | 'SCENARIO' | 'PRACTICAL_FILE' | 'DIGITAL_LINK';
  prompt: string;
  rubricWeight: number;
  sampleCriteria: string;
}

export default function EvaluatorCreateAssessmentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('D1: Thông tin & Dữ liệu số');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(70);
  const [assignedGroup, setAssignedGroup] = useState('NX-DIG24');

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      id: 'q-1',
      type: 'MCQ',
      prompt: 'Phương thức nào sau đây giúp phát hiện liên kết lừa đảo (phishing link) trong thư điện tử?',
      rubricWeight: 10,
      sampleCriteria: 'Chấm tự động tức thì bằng code thuần (0.01s).',
    },
    {
      id: 'q-2',
      type: 'PRACTICAL_FILE',
      prompt: 'Tải lên bảng tính (.xlsx) trích xuất dữ liệu doanh thu theo danh mục và vẽ biểu đồ tròn trực quan.',
      rubricWeight: 20,
      sampleCriteria: 'Tiêu chí Rubric: Hàm tính toán chính xác (10đ), Bảng sạch (5đ), Biểu đồ trực quan (5đ). AI hoặc người đánh giá chấm on-demand.',
    },
  ]);

  const [isSaved, setIsSaved] = useState(false);

  const handleAddQuestion = () => {
    const newQ: QuestionDraft = {
      id: `q-${Date.now()}`,
      type: 'MCQ',
      prompt: '',
      rubricWeight: 10,
      sampleCriteria: '',
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateQuestion = (id: string, field: keyof QuestionDraft, val: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: val } : q))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaved(true);
    setTimeout(() => {
      router.push('/evaluator/exams');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Breadcrumb Back */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/evaluator/exams"
          className="hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh sách đề thi</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              THIẾT KẾ ĐỢT KHẢO THÍ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tạo Bài Khảo Thí Năng Lực Mới
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập câu hỏi tích hợp 4 hình thức đánh giá theo khung năng lực chuẩn hóa và cấu hình chuẩn đạt.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Save className="w-4 h-4" strokeWidth={2} />
          <span>Lưu &amp; Xuất bản bài thi</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tạo bài khảo thí thành công! Đang chuyển hướng về danh sách đề thi...</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Basic Info */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            1. Thông Tin Tổng Quan Bài Khảo Thí
          </h2>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tiêu đề bài khảo thí:
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Đánh giá Năng lực Phân tích Dữ liệu &amp; Văn phòng Thông minh"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Miền năng lực trọng tâm:
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
              >
                <option value="D1: Thông tin & Dữ liệu số">Miền 1: Thông tin và Dữ liệu số</option>
                <option value="D2: Giao tiếp & Hợp tác số">Miền 2: Giao tiếp và Hợp tác số</option>
                <option value="D3: Sáng tạo Nội dung số">Miền 3: Sáng tạo Nội dung số</option>
                <option value="D4: An toàn & Bảo mật số">Miền 4: An toàn và Bảo mật số</option>
                <option value="D5: Giải quyết Vấn đề số">Miền 5: Giải quyết Vấn đề số</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Giao cho nhóm đánh giá:
              </label>
              <select
                value={assignedGroup}
                onChange={(e) => setAssignedGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              >
                <option value="NX-DIG24">NX-DIG24 - Tin học ứng dụng &amp; Năng lực số</option>
                <option value="AI-PRO8">AI-PRO8 - Ứng dụng AI &amp; Tự động hóa tác vụ</option>
                <option value="ALL">Công khai toàn hệ thống</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Thời lượng làm bài (phút):
              </label>
              <input
                type="number"
                min={10}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Điểm chuẩn đạt (%):
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* AI Rule Notice */}
        <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Quy Tắc Chấm On-Demand Khảo Thí</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Các câu hỏi trắc nghiệm (MCQ) và nhánh tình huống sẽ được chấm tự động bằng code thuần (0.01s). Các bài thực hành tệp tin hoặc minh chứng sẽ lưu vào hệ thống để người đánh giá tự chấm hoặc chủ động bấm nút yêu cầu AI hỗ trợ.
          </p>
        </div>

        {/* Questions List */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              2. Danh Sách Câu Hỏi &amp; Tiêu Chí Rubric ({questions.length})
            </h2>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu hỏi</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-slate-900">
                    Câu hỏi #{idx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Hình thức đánh giá:
                    </label>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, 'type', e.target.value as QuestionDraft['type'])
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs"
                    >
                      <option value="MCQ">Trắc nghiệm khách quan (MCQ)</option>
                      <option value="SCENARIO">Tình huống phân nhánh (Scenario)</option>
                      <option value="PRACTICAL_FILE">Thực hành nộp tệp tin (.xlsx, .docx, .py)</option>
                      <option value="DIGITAL_LINK">Minh chứng sản phẩm số (URL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Trọng số điểm:
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={q.rubricWeight}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, 'rubricWeight', Number(e.target.value))
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Đề bài / Yêu cầu nhiệm vụ:
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Nhập nội dung câu hỏi hoặc yêu cầu thực hành..."
                    value={q.prompt}
                    onChange={(e) => handleUpdateQuestion(q.id, 'prompt', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tiêu chí Rubric hoặc đáp án mẫu:
                  </label>
                  <input
                    type="text"
                    placeholder="Tiêu chí chấm điểm cụ thể..."
                    value={q.sampleCriteria}
                    onChange={(e) => handleUpdateQuestion(q.id, 'sampleCriteria', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/evaluator/exams"
            className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            className="px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors shadow-xs"
          >
            Lưu &amp; Xuất bản đề thi
          </button>
        </div>
      </form>
    </div>
  );
}
