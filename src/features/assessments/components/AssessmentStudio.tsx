'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  ShieldCheck,
  FileText,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Check,
  X,
  FileCheck,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  downloadMCQTemplate,
  downloadScenarioTemplate,
  downloadPracticalTemplate,
  parseMCQCSV,
  parseScenarioCSV,
  parsePracticalCSV,
  type ParsedItemRow,
} from '@/features/assessments/utils/csv-helper';

export interface AssessmentStudioProps {
  role: 'ADMIN' | 'EVALUATOR';
  assessmentId?: string;
}

const DOMAIN_OPTIONS = [
  { id: 1, code: '01', title: 'Thông tin & Dữ liệu', desc: 'Tìm kiếm, đánh giá và quản lý dữ liệu số' },
  { id: 2, code: '02', title: 'Giao tiếp & Cộng tác', desc: 'Tương tác, chia sẻ và hợp tác qua công nghệ số' },
  { id: 3, code: '03', title: 'Sáng tạo Nội dung & AI', desc: 'Phát triển nội dung đa phương tiện và ứng dụng AI' },
  { id: 4, code: '04', title: 'An toàn & Bảo mật', desc: 'Bảo vệ thiết bị, dữ liệu cá nhân và sức khỏe số' },
  { id: 5, code: '05', title: 'Giải quyết Vấn đề', desc: 'Nhận diện nhu cầu công nghệ và tư duy tính toán số' },
];

export function AssessmentStudio({ role, assessmentId }: AssessmentStudioProps) {
  const router = useRouter();
  const backHref = role === 'ADMIN' ? '/admin/content' : '/evaluator/assessments';

  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');

  // General Settings State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<number[]>([1]);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(70);
  const [pointReward, setPointReward] = useState(50);
  const [accessTier, setAccessTier] = useState<'FREE' | 'VIP'>('FREE');
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(true);

  // Question Matrix State
  const [questions, setQuestions] = useState<ParsedItemRow[]>([]);

  // Manual Add Modal / State
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualType, setManualType] = useState<'MCQ' | 'SCENARIO' | 'PRACTICAL'>('MCQ');
  const [manualDomain, setManualDomain] = useState<number>(1);
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualContext, setManualContext] = useState('');
  const [manualOptA, setManualOptA] = useState('');
  const [manualOptB, setManualOptB] = useState('');
  const [manualOptC, setManualOptC] = useState('');
  const [manualOptD, setManualOptD] = useState('');
  const [manualCorrect, setManualCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualSubType, setManualSubType] = useState<'FILE' | 'LINK' | 'BOTH'>('BOTH');
  const [manualRubric, setManualRubric] = useState('');
  const [manualPoints, setManualPoints] = useState(10);

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'MCQ' | 'SCENARIO' | 'PRACTICAL'>('MCQ');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreviewItems, setImportPreviewItems] = useState<ParsedItemRow[]>([]);
  const [importFileName, setImportFileName] = useState('');

  // Submit / Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle domain
  const toggleDomain = (domainId: number) => {
    setSelectedDomains((prev) => {
      if (prev.includes(domainId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((d) => d !== domainId);
      }
      return [...prev, domainId].sort((a, b) => a - b);
    });
  };

  const selectAllDomains = () => {
    setSelectedDomains([1, 2, 3, 4, 5]);
  };

  // Calculations
  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);
  const mcqCount = questions.filter((q) => q.type === 'MCQ').length;
  const scenarioCount = questions.filter((q) => q.type === 'SCENARIO').length;
  const practicalCount = questions.filter((q) => q.type === 'PRACTICAL').length;

  // Handle Manual Add
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPrompt.trim()) return;

    if (manualType === 'MCQ' || manualType === 'SCENARIO') {
      if (!manualOptA.trim() || !manualOptB.trim()) {
        alert('Vui lòng nhập ít nhất Lựa chọn A và Lựa chọn B.');
        return;
      }
    }

    const newQ: ParsedItemRow = {
      type: manualType,
      domain: manualDomain,
      domains: [manualDomain],
      skill_code: `${manualDomain}.1`,
      prompt: manualPrompt.trim(),
      scenario_context: manualType === 'SCENARIO' ? manualContext.trim() : undefined,
      option_a: manualOptA.trim(),
      option_b: manualOptB.trim(),
      option_c: manualOptC.trim(),
      option_d: manualOptD.trim(),
      correct_answer: manualCorrect,
      explanation: manualExplanation.trim(),
      submission_type: manualType === 'PRACTICAL' ? manualSubType : undefined,
      rubric_guide: manualType === 'PRACTICAL' ? manualRubric.trim() : undefined,
      points: Number(manualPoints) || 10,
    };

    setQuestions((prev) => [...prev, newQ]);
    setShowAddManualModal(false);

    // Reset manual form
    setManualPrompt('');
    setManualContext('');
    setManualOptA('');
    setManualOptB('');
    setManualOptC('');
    setManualOptD('');
    setManualExplanation('');
    setManualRubric('');
  };

  // Handle CSV File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportErrors([]);
    setImportPreviewItems([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let result;
      if (importTab === 'MCQ') {
        result = parseMCQCSV(content);
      } else if (importTab === 'SCENARIO') {
        result = parseScenarioCSV(content);
      } else {
        result = parsePracticalCSV(content);
      }

      setImportErrors(result.errors);
      setImportPreviewItems(result.items);
    };
    reader.readAsText(file, 'utf-8');
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (importPreviewItems.length === 0) return;
    setQuestions((prev) => [...prev, ...importPreviewItems]);
    setShowImportModal(false);
    setImportPreviewItems([]);
    setImportErrors([]);
    setImportFileName('');
  };

  // Remove Question
  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update Points for Question
  const handleUpdatePoints = (index: number, pts: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], points: pts };
      return updated;
    });
  };

  // Save / Publish
  const handleSaveAssessment = async (publish: boolean) => {
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập Tiêu đề bài khảo thí.');
      setActiveTab('settings');
      return;
    }

    if (questions.length === 0 && publish) {
      setErrorMessage('Đề thi cần có ít nhất 1 câu hỏi trước khi Phát hành.');
      setActiveTab('questions');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const domainCodes = selectedDomains.map((d) => `0${d}`.slice(-2));
      const domainName =
        selectedDomains.length === 1
          ? `Miền 0${selectedDomains[0]}`
          : selectedDomains.length === 5
          ? 'Đa Miền Năng Lực Số (Toàn diện)'
          : `Đa Miền (${selectedDomains.map((d) => `0${d}`).join(', ')})`;

      // 1. Create or update assessment
      const res = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || `Bài khảo thí đo lường năng lực số chuẩn DigComp 3.0 (${domainName}).`,
          duration_minutes: Number(durationMinutes),
          passing_score: Number(passingScore),
          point_reward: Number(pointReward),
          is_published: publish,
          is_vip: role === 'ADMIN' ? accessTier === 'VIP' : false,
          access_tier: role === 'ADMIN' ? accessTier : 'FREE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu bài khảo thí');
      }

      const createdId = data.assessment?.id;

      // 2. Insert items if questions exist
      if (createdId && questions.length > 0) {
        for (const q of questions) {
          const itemPayload: any = {
            type: q.type === 'PRACTICAL' ? 'DIGITAL_EVIDENCE' : q.type,
            prompt: q.prompt,
            points: q.points || 10,
            skill_code: `${q.domain || 1}.1`,
            rubric_guide: q.rubric_guide || (q.rubric_criteria ? JSON.stringify(q.rubric_criteria) : undefined),
          };

          if (q.type === 'MCQ' || q.type === 'SCENARIO') {
            itemPayload.options = [
              { content: q.option_a || 'Lựa chọn A', is_correct: q.correct_answer === 'A', explanation: q.explanation },
              { content: q.option_b || 'Lựa chọn B', is_correct: q.correct_answer === 'B', explanation: q.explanation },
              ...(q.option_c ? [{ content: q.option_c, is_correct: q.correct_answer === 'C', explanation: q.explanation }] : []),
              ...(q.option_d ? [{ content: q.option_d, is_correct: q.correct_answer === 'D', explanation: q.explanation }] : []),
            ];
          }

          await fetch(`/api/admin/assessments/${createdId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemPayload),
          }).catch(() => null);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push(backHref);
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi hệ thống khi lưu đề thi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {role === 'ADMIN' ? 'STUDIO KHẢO THÍ HỆ THỐNG' : 'STUDIO SOẠN ĐỀ ĐÁNH GIÁ'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {title ? title : 'Thiết Kế Đề Khảo Thí Mới'}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveAssessment(false)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Lưu Bản Nháp</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveAssessment(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            <span>Phát Hành Cho Người Học</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {saveSuccess && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>Đã lưu thành công bài khảo thí! Đang chuyển hướng về trung tâm quản lý...</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-md border border-slate-200 bg-white shadow-xs text-xs">
        <div className="flex items-center gap-2.5">
          <FileCheck className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Tổng câu hỏi</div>
            <div className="font-bold text-slate-900 font-mono tabular-nums">{totalQuestions} câu</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Award className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Tổng điểm ma trận</div>
            <div className="font-bold text-slate-900 font-mono tabular-nums">
              {totalPoints} điểm <span className="text-[10px] text-slate-400 font-normal">({mcqCount} MCQ / {scenarioCount} KB / {practicalCount} TH)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Thời lượng bài thi</div>
            <div className="font-bold text-slate-900 font-mono tabular-nums">{durationMinutes} phút</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Chống gian lận</div>
            <div className="font-bold text-slate-900">
              {antiCheatEnabled ? 'Giám sát chuyển tab' : 'Luyện tập tự do'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-sky-600 text-sky-700 bg-sky-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>1. Cấu Hình Chung &amp; 5 Miền Năng Lực</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'questions'
              ? 'border-sky-600 text-sky-700 bg-sky-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>2. Ma Trận Câu Hỏi &amp; Nạp Đề ({questions.length})</span>
        </button>
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Thông Tin Cốt Lõi Bài Khảo Thí</span>
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Tiêu đề bài khảo thí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đánh Giá Năng Lực Số Chuẩn Quốc Gia &amp; EU DigComp 3.0"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Mô tả bài khảo thí &amp; Phạm vi năng lực
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu đánh giá, đối tượng phù hợp và phương pháp thẩm định kết quả..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Competency Domains Multi-Selector */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-800">
                  Phân Loại Miền Năng Lực Chuẩn DigComp (Chọn 1 hoặc nhiều miền)
                </label>
                <button
                  type="button"
                  onClick={selectAllDomains}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                >
                  Chọn cả 5 Miền (Đa Miền)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DOMAIN_OPTIONS.map((d) => {
                  const isSelected = selectedDomains.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDomain(d.id)}
                      className={`p-3 rounded-md border text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-1 rounded bg-slate-100 text-slate-700">
                            {d.code}
                          </span>
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                            {d.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{d.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exam Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Thời lượng làm bài (phút)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 font-mono tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Điểm đạt chuẩn (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 font-mono tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Điểm thưởng đạt chuẩn
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={pointReward}
                  onChange={(e) => setPointReward(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 font-mono tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Admin Exclusive: Free / VIP Tier */}
            {role === 'ADMIN' && (
              <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
                  <span>Phân Hạng Quyền Truy Cập (Admin Only)</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="access_tier"
                      checked={accessTier === 'FREE'}
                      onChange={() => setAccessTier('FREE')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Gói Miễn Phí (FREE) — Tất cả học viên tự do tham gia</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="access_tier"
                      checked={accessTier === 'VIP'}
                      onChange={() => setAccessTier('VIP')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-1 text-amber-800 font-semibold">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Khóa Nâng Cao (VIP) — Chỉ dành cho gói tài khoản VIP
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Smart Proctoring Settings */}
            <div className="p-4 rounded-md border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                    <span>Cơ chế Giám Sát Chống Gian Lận Thông Minh (Smart Anti-Cheat)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tự động cảnh báo khi thí sinh rời màn hình trong phần Trắc nghiệm/Tình huống. Tự động tạm ngắt khi sang phần Thực hành để học viên tra cứu công cụ số.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={antiCheatEnabled}
                    onChange={(e) => setAntiCheatEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS MATRIX */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Action ToolBar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddManualModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                <span>+ Thêm Câu Hỏi Mới</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>Nạp Từ File Excel / CSV</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Đã có <strong className="font-mono text-slate-900">{questions.length}</strong> câu hỏi trong đề (Tổng: <strong className="font-mono text-sky-700">{totalPoints}đ</strong>)
            </div>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="p-12 text-center rounded-md border border-dashed border-slate-300 bg-white">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Chưa có câu hỏi nào trong đề thi</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Bạn có thể thêm từng câu hỏi thủ công hoặc tải mẫu Excel tương ứng theo 3 dạng (MCQ, Tình huống, Thực hành) để nạp hàng loạt.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(true)}
                  className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
                >
                  Thêm câu hỏi ngay
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Tải tệp mẫu Excel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-md border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>

                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          q.type === 'MCQ'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : q.type === 'SCENARIO'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {q.type === 'MCQ' ? 'Trắc nghiệm' : q.type === 'SCENARIO' ? 'Tình huống' : 'Thực hành'}
                      </span>

                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                        Miền 0{q.domain || 1}
                      </span>
                    </div>

                    {q.scenario_context && (
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                        &ldquo;{q.scenario_context}&rdquo;
                      </div>
                    )}

                    <p className="text-xs font-semibold text-slate-900 leading-snug">{q.prompt}</p>

                    {/* Options Preview */}
                    {(q.type === 'MCQ' || q.type === 'SCENARIO') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const optKey = `option_${letter.toLowerCase()}` as keyof ParsedItemRow;
                          const optVal = q[optKey] as string;
                          if (!optVal) return null;
                          const isCorrect = q.correct_answer === letter;
                          return (
                            <div
                              key={letter}
                              className={`p-1.5 px-2 rounded border flex items-center gap-1.5 ${
                                isCorrect
                                  ? 'border-emerald-300 bg-emerald-50/60 font-semibold text-emerald-900'
                                  : 'border-slate-100 text-slate-600'
                              }`}
                            >
                              <span className="font-mono font-bold text-[10px]">{letter}.</span>
                              <span className="truncate">{optVal}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Practical Rubric Preview */}
                    {q.type === 'PRACTICAL' && q.rubric_guide && (
                      <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                        <strong>Tiêu chí Rubric:</strong> {q.rubric_guide}
                      </div>
                    )}
                  </div>

                  {/* Right: Points & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Điểm:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points || 10}
                        onChange={(e) => handleUpdatePoints(idx, Number(e.target.value))}
                        className="w-14 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 tabular-nums"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD MANUAL QUESTION */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" strokeWidth={2} />
                <span>Thêm Câu Hỏi Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddManualModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualQuestion} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dạng bài khảo thí</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  >
                    <option value="MCQ">Trắc nghiệm khách quan (MCQ)</option>
                    <option value="SCENARIO">Xử lý tình huống (SCENARIO)</option>
                    <option value="PRACTICAL">Thực hành &amp; Minh chứng (PRACTICAL)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Miền năng lực số</label>
                  <select
                    value={manualDomain}
                    onChange={(e) => setManualDomain(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        Miền {d.code}: {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {manualType === 'SCENARIO' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bối cảnh tình huống thực tế</label>
                  <textarea
                    rows={2}
                    value={manualContext}
                    onChange={(e) => setManualContext(e.target.value)}
                    placeholder="Mô tả hoàn cảnh hoặc sự cố diễn ra tại cơ quan, lớp học hoặc môi trường làm việc số..."
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nội dung câu hỏi / Yêu cầu thực hành <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={manualPrompt}
                  onChange={(e) => setManualPrompt(e.target.value)}
                  placeholder="Nhập chi tiết câu hỏi hoặc nhiệm vụ cần thực hiện..."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                />
              </div>

              {/* Options for MCQ / SCENARIO */}
              {(manualType === 'MCQ' || manualType === 'SCENARIO') && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="font-semibold text-slate-800 block">Các lựa chọn &amp; Đáp án đúng</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { letter: 'A', val: manualOptA, setVal: setManualOptA },
                      { letter: 'B', val: manualOptB, setVal: setManualOptB },
                      { letter: 'C', val: manualOptC, setVal: setManualOptC },
                      { letter: 'D', val: manualOptD, setVal: setManualOptD },
                    ].map((item) => (
                      <div key={item.letter} className="flex items-center gap-2">
                        <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                          <input
                            type="radio"
                            name="correct_answer"
                            checked={manualCorrect === item.letter}
                            onChange={() => setManualCorrect(item.letter as any)}
                            className="text-sky-600 focus:ring-sky-500"
                          />
                          <span className="font-mono font-bold text-slate-700 w-4">{item.letter}</span>
                        </label>
                        <input
                          type="text"
                          value={item.val}
                          onChange={(e) => item.setVal(e.target.value)}
                          placeholder={`Nội dung lựa chọn ${item.letter}...`}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practical specific settings */}
              {manualType === 'PRACTICAL' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Hình thức nộp bài cho phép</label>
                    <select
                      value={manualSubType}
                      onChange={(e) => setManualSubType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="BOTH">Cho phép cả Nộp tệp tin VÀ Dán liên kết số (Google Drive, Canva...)</option>
                      <option value="FILE">Chỉ cho phép tải tệp tin đính kèm (PDF, DOCX, ZIP, PNG)</option>
                      <option value="LINK">Chỉ cho phép dán đường dẫn liên kết sản phẩm số</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Hướng dẫn Rubric thẩm định (AI &amp; Chuyên gia)</label>
                    <textarea
                      rows={2}
                      value={manualRubric}
                      onChange={(e) => setManualRubric(e.target.value)}
                      placeholder="Ví dụ: 1. Đúng trọng tâm đề bài (40%); 2. Trình bày trực quan (30%); 3. Thuyết minh giải pháp (30%)."
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Điểm số câu:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={manualPoints}
                    onChange={(e) => setManualPoints(Number(e.target.value))}
                    className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono tabular-nums text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddManualModal(false)}
                    className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs"
                  >
                    Thêm Vào Đề Thi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK IMPORT WITH 3 SEPARATE TEMPLATES */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-600" strokeWidth={2} />
                  <span>Nạp Hàng Loạt Câu Hỏi Từ Tệp Excel / CSV</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tách biệt 3 tệp mẫu phẳng theo chuẩn 5 Miền DigComp (không gộp chung gây lỗi cột).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Formats Switcher */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 px-5 pt-3 gap-2">
              {[
                { id: 'MCQ', label: '1. Trắc Nghiệm (MCQ)' },
                { id: 'SCENARIO', label: '2. Tình Huống (SCENARIO)' },
                { id: 'PRACTICAL', label: '3. Thực Hành (PRACTICAL)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setImportTab(tab.id as any);
                    setImportErrors([]);
                    setImportPreviewItems([]);
                    setImportFileName('');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-md border-t border-x transition-colors ${
                    importTab === tab.id
                      ? 'bg-white border-slate-200 text-sky-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Template Download Prompt */}
              <div className="p-3.5 rounded-md bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sky-900">
                    Tải tệp mẫu Excel chuẩn dạng {importTab === 'MCQ' ? 'Trắc nghiệm' : importTab === 'SCENARIO' ? 'Tình huống' : 'Thực hành'}:
                  </div>
                  <div className="text-[11px] text-sky-700">
                    Cột <code className="font-mono bg-sky-100 px-1 rounded">domain</code> nhận số 1..5 hoặc tổ hợp &ldquo;1, 2&rdquo;.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (importTab === 'MCQ') downloadMCQTemplate();
                    else if (importTab === 'SCENARIO') downloadScenarioTemplate();
                    else downloadPracticalTemplate();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 font-semibold shadow-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Tải Tệp Mẫu</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Chọn tệp CSV / Excel đã chuẩn bị</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              {/* Error messages if any */}
              {importErrors.length > 0 && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 space-y-1">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Phát hiện {importErrors.length} lỗi trong tệp dữ liệu:</span>
                  </div>
                  <ul className="list-disc pl-5 text-rose-700 text-[11px] space-y-0.5">
                    {importErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview parsed items */}
              {importPreviewItems.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã phân tích cú pháp hợp lệ {importPreviewItems.length} câu hỏi:</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded p-2 divide-y divide-slate-100 text-[11px]">
                    {importPreviewItems.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                        <span className="truncate">
                          <strong>#{idx + 1} (Miền {item.domain}):</strong> {item.prompt}
                        </span>
                        <span className="font-mono text-slate-400 shrink-0">+{item.points}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {importFileName ? `Đã chọn: ${importFileName}` : 'Chưa chọn tệp'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={importPreviewItems.length === 0}
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Xác Nhận Nạp {importPreviewItems.length > 0 ? `(${importPreviewItems.length} câu)` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
