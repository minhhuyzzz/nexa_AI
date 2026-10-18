'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  ShieldCheck,
  RotateCcw,
  Upload,
  Paperclip,
  FileText,
} from 'lucide-react';

interface Option {
  id: string;
  content: string;
  order_index: number;
}

interface Question {
  id: string;
  prompt: string;
  points: number;
  type?: string;
  order_index: number;
  difficulty_level: string;
  competency_id: string;
  competencies?: {
    skill_code: string;
    title: string;
  };
  options: Option[];
}

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
}

const defaultMockQuestions: Question[] = [
  {
    id: 'q-mock-1',
    prompt: 'Để phòng tránh các cuộc tấn công lừa đảo (Phishing) qua thư điện tử trong môi trường làm việc số, biện pháp nào sau đây là quan trọng và hiệu quả nhất?',
    points: 20,
    type: 'MCQ',
    order_index: 1,
    difficulty_level: 'INTERMEDIATE',
    competency_id: 'comp-4.1',
    competencies: {
      skill_code: '4.1',
      title: 'Bảo vệ thiết bị & danh tính số',
    },
    options: [
      { id: 'opt-1', content: 'Chỉ kiểm tra tên hiển thị của người gửi trên hộp thư đến', order_index: 1 },
      { id: 'opt-2', content: 'Kiểm tra kỹ tên miền người gửi (Domain), không nhấp vào liên kết lạ và kích hoạt xác thực 2 bước', order_index: 2 },
      { id: 'opt-3', content: 'Tắt phần mềm diệt virus để tránh bị chặn thư gửi đến', order_index: 3 },
      { id: 'opt-4', content: 'Chuyển tiếp ngay email cho toàn bộ nhân sự công ty để hỏi ý kiến', order_index: 4 },
    ],
  },
  {
    id: 'q-mock-2',
    prompt: 'Khi sử dụng các công cụ trí tuệ nhân tạo (AI) để hỗ trợ viết báo cáo hoặc phân tích dữ liệu, nguyên tắc đạo đức và an toàn số nào cần tuân thủ?',
    points: 20,
    type: 'MCQ',
    order_index: 2,
    difficulty_level: 'INTERMEDIATE',
    competency_id: 'comp-3.2',
    competencies: {
      skill_code: '3.2',
      title: 'Sáng tạo & hợp tác cùng AI',
    },
    options: [
      { id: 'opt-5', content: 'Đưa toàn bộ dữ liệu nội bộ và thông tin cá nhân khách hàng lên AI mà không cần ẩn danh', order_index: 1 },
      { id: 'opt-6', content: 'Chủ động kiểm chứng nguồn số liệu, khử dữ liệu định danh (PII) và chịu trách nhiệm về nội dung xuất bản', order_index: 2 },
      { id: 'opt-7', content: 'Sao chép nguyên văn văn bản do AI tạo ra và không cần đối soát lại', order_index: 3 },
      { id: 'opt-8', content: 'Tin tưởng tuyệt đối vào độ chính xác 100% của câu trả lời từ AI', order_index: 4 },
    ],
  },
  {
    id: 'q-mock-3',
    prompt: 'Tình huống: Một nhân viên mới trong phòng ban vô tình đăng tải bảng tính chứa thông tin liên lạc của 500 khách hàng lên một trang chia sẻ tài liệu công khai. Bạn là người đầu tiên phát hiện sự việc. Hãy trình bày quy trình 3 bước bạn sẽ thực hiện ngay lập tức để giảm thiểu rủi ro.',
    points: 25,
    type: 'SCENARIO',
    order_index: 3,
    difficulty_level: 'ADVANCED',
    competency_id: 'comp-4.2',
    competencies: {
      skill_code: '4.2',
      title: 'Bảo vệ dữ liệu cá nhân & quyền riêng tư',
    },
    options: [],
  },
  {
    id: 'q-mock-4',
    prompt: 'Khi chia sẻ một tập tin bảng tính nội bộ trên nền tảng đám mây (Google Drive / OneDrive) cho nhóm dự án, thiết lập quyền truy cập nào sau đây là chuẩn mực an toàn?',
    points: 15,
    type: 'MCQ',
    order_index: 4,
    difficulty_level: 'BASIC',
    competency_id: 'comp-2.2',
    competencies: {
      skill_code: '2.2',
      title: 'Chia sẻ thông tin và dữ liệu số',
    },
    options: [
      { id: 'opt-9', content: 'Chia sẻ ở chế độ "Bất kỳ ai có đường liên kết đều có quyền chỉnh sửa"', order_index: 1 },
      { id: 'opt-10', content: 'Chỉ chia sẻ cho các địa chỉ email cụ thể trong nhóm với quyền hạn tương ứng (Xem / Nhận xét / Chỉnh sửa)', order_index: 2 },
      { id: 'opt-11', content: 'Đăng tải đường liên kết lên mạng xã hội công khai để đồng nghiệp dễ tìm', order_index: 3 },
      { id: 'opt-12', content: 'Gán quyền quản trị viên cao nhất cho tất cả các đối tác bên ngoài', order_index: 4 },
    ],
  },
  {
    id: 'q-mock-5',
    prompt: 'Thực hành Prompt Engineering: Viết một câu lệnh prompt ngắn gọn, có bối cảnh và yêu cầu định dạng cụ thể để hướng dẫn trợ lý AI trích xuất 3 rủi ro bảo mật chính từ một email cảnh báo.',
    points: 20,
    type: 'PRACTICAL_TASK',
    order_index: 5,
    difficulty_level: 'INTERMEDIATE',
    competency_id: 'comp-5.2',
    competencies: {
      skill_code: '5.2',
      title: 'Ứng dụng công nghệ giải quyết vấn đề',
    },
    options: [],
  },
];

export default function AssessmentTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string>>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(900); // 15 mins default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('Vừa xong');

  // 1. Fetch Assessment & Questions with seamless mock fallback
  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true);
        const res = await fetch(`/api/assessments/${assessmentId}`);
        const data = await res.json();

        if (res.ok && data.assessment && data.items && data.items.length > 0) {
          setAssessment(data.assessment);
          setQuestions(data.items);
          setTimeRemaining(data.assessment.duration_minutes * 60);
        } else {
          // Seamless prototype fallback
          setAssessment({
            id: assessmentId,
            title: 'Đánh giá Năng lực Số Tổng quát - Chuẩn NEXA',
            description: 'Khảo sát năng lực thực tế theo chuẩn 5 miền năng lực số.',
            duration_minutes: 15,
            passing_score: 70,
            point_reward: 50,
          });
          setQuestions(defaultMockQuestions);
          setTimeRemaining(15 * 60);
        }

        // Restore any local draft
        const cacheKey = `nexa_exam_draft_${assessmentId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            setSelectedAnswers(JSON.parse(cached));
          } catch {}
        }

        const cacheTextKey = `nexa_exam_draft_text_${assessmentId}`;
        const cachedText = localStorage.getItem(cacheTextKey);
        if (cachedText) {
          try {
            setTextAnswers(JSON.parse(cachedText));
          } catch {}
        }

        const cacheEvKey = `nexa_exam_draft_ev_${assessmentId}`;
        const cachedEv = localStorage.getItem(cacheEvKey);
        if (cachedEv) {
          try {
            setEvidenceUrls(JSON.parse(cachedEv));
          } catch {}
        }
      } catch (err) {
        // Fallback to mock on any network or parsing error
        setAssessment({
          id: assessmentId,
          title: 'Đánh giá Năng lực Số Tổng quát - Chuẩn NEXA',
          description: 'Khảo sát năng lực thực tế theo chuẩn 5 miền năng lực số.',
          duration_minutes: 15,
          passing_score: 70,
          point_reward: 50,
        });
        setQuestions(defaultMockQuestions);
        setTimeRemaining(15 * 60);
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [assessmentId]);

  // 2. Countdown Timer (JetBrains Mono)
  useEffect(() => {
    if (loading || timeRemaining <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeRemaining, isSubmitting]);

  // 3. Auto-save answers every 15s
  useEffect(() => {
    if (questions.length === 0) return;

    const saveTimer = setInterval(() => {
      const cacheKey = `nexa_exam_draft_${assessmentId}`;
      localStorage.setItem(cacheKey, JSON.stringify(selectedAnswers));

      const cacheTextKey = `nexa_exam_draft_text_${assessmentId}`;
      localStorage.setItem(cacheTextKey, JSON.stringify(textAnswers));

      const cacheEvKey = `nexa_exam_draft_ev_${assessmentId}`;
      localStorage.setItem(cacheEvKey, JSON.stringify(evidenceUrls));

      setLastSaved(new Date().toLocaleTimeString('vi-VN'));
    }, 15000);

    return () => clearInterval(saveTimer);
  }, [assessmentId, selectedAnswers, textAnswers, evidenceUrls, questions]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    const updated = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updated);
    const cacheKey = `nexa_exam_draft_${assessmentId}`;
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  };

  const handleTextChange = (questionId: string, value: string) => {
    const updated = { ...textAnswers, [questionId]: value };
    setTextAnswers(updated);
    const cacheTextKey = `nexa_exam_draft_text_${assessmentId}`;
    localStorage.setItem(cacheTextKey, JSON.stringify(updated));
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    setUploadingFile(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemId', questionId);
      formData.append('submissionId', 'draft');

      const res = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tải tệp lên thất bại');
      }

      const updated = { ...evidenceUrls, [questionId]: data.url };
      setEvidenceUrls(updated);
      const cacheEvKey = `nexa_exam_draft_ev_${assessmentId}`;
      localStorage.setItem(cacheEvKey, JSON.stringify(updated));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Lỗi tải tệp');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const payloadAnswers = questions.map((q) => ({
        itemId: q.id,
        selectedOptionId: selectedAnswers[q.id] || null,
        textResponse: textAnswers[q.id] || undefined,
        evidenceUrl: evidenceUrls[q.id] || undefined,
      }));

      const totalTimeSpent = assessment ? assessment.duration_minutes * 60 - timeRemaining : 0;

      const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpentSeconds: Math.max(1, totalTimeSpent),
          answers: payloadAnswers,
        }),
      });

      const result = await res.json();

      localStorage.removeItem(`nexa_exam_draft_${assessmentId}`);
      const targetSubId = (result && result.submissionId) ? result.submissionId : 'sub-001';
      router.push(`/learner/assessments/${assessmentId}/result?submissionId=${targetSubId}`);
    } catch (err) {
      // Prototype fallback
      localStorage.removeItem(`nexa_exam_draft_${assessmentId}`);
      router.push(`/learner/assessments/${assessmentId}/result?submissionId=sub-001`);
    }
  };

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-500">Đang chuẩn bị đề thi phòng thi Zen Mode...</p>
      </div>
    );
  }

  if (error || !assessment || questions.length === 0) {
    return (
      <div className="p-8 rounded-md bg-white border border-rose-200 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" strokeWidth={1.75} />
        <h2 className="text-base font-bold text-slate-900 mb-1">Không thể mở phòng thi</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'Đề thi không có câu hỏi hợp lệ'}</p>
        <Link
          href="/learner/assessments"
          className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          Quay lại danh sách đề thi
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-6">
      {/* Zen Mode Header Bar */}
      <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-30">
        <div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
            PHÒNG THI CHUẨN HÓA (ZEN MODE)
          </span>
          <h1 className="text-sm font-bold text-slate-900 mt-1 truncate max-w-xl">
            {assessment.title}
          </h1>
        </div>

        <div className="flex items-center gap-4 self-end md:self-auto">
          {/* Auto-save indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Lưu tự động: {lastSaved}</span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-bold tabular-nums ${
              timeRemaining < 300
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : 'bg-slate-50 text-slate-900 border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
            Nộp bài ({answeredCount}/{questions.length})
          </button>
        </div>
      </div>

      {/* Main Exam Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Active Question Card */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs">
            {/* Question Meta */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                  CÂU {currentIndex + 1} / {questions.length}
                </span>
                {currentQ.competencies && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    KỸ NĂNG {currentQ.competencies.skill_code}: {currentQ.competencies.title}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                {currentQ.points} pts
              </span>
            </div>

            {/* Prompt */}
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed mb-6">
              {currentQ.prompt}
            </h2>

            {/* If SCENARIO, show sub-header for Part 1 */}
            {currentQ.type === 'SCENARIO' && (
              <div className="mb-3 text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                PHẦN 1: NHÁNH QUYẾT ĐỊNH PHẢN ỨNG KHẨN CẤP (TỰ CHẤM THUẦN THUẬT TOÁN)
              </div>
            )}

            {/* Options List (Only for MCQ and SCENARIO with choices) */}
            {currentQ.options && currentQ.options.length > 0 && (
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`w-full text-left p-4 rounded-md border text-sm transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/60 text-slate-900 ring-1 ring-sky-600 font-medium'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs font-bold ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="mt-0.5 leading-relaxed">{opt.content}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* If SCENARIO, show Part 2 Essay Textarea */}
            {currentQ.type === 'SCENARIO' && (
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      PHẦN 2: BẢN GIẢI TRÌNH VÀ KẾ HOẠCH ỨNG PHÓ CHI TIẾT (THẨM ĐỊNH RUBRIC)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Số từ: {(textAnswers[currentQ.id] || '').trim().split(/\s+/).filter(Boolean).length} từ
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hãy trình bày phương án ứng phó toàn diện bao gồm: nội dung thông báo gửi khách hàng, biện pháp khắc phục kỹ thuật, và thủ tục báo cáo sự cố theo Nghị định 13/2023/NĐ-CP (thời hạn 72 giờ). Bài làm sẽ được thẩm định qua Rubric 3 tiêu chí.
                </p>
                <textarea
                  rows={7}
                  value={textAnswers[currentQ.id] || ''}
                  onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                  placeholder="Nhập chi tiết bản giải trình và kế hoạch ứng phó của bạn tại đây (khuyến nghị tối thiểu 30 từ)..."
                  className="w-full p-4 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600 leading-relaxed font-sans"
                />
              </div>
            )}

            {/* If DIGITAL_EVIDENCE or PRACTICAL_TASK: File Upload + Mandatory >= 30 words Explanation */}
            {(currentQ.type === 'DIGITAL_EVIDENCE' || currentQ.type === 'PRACTICAL_TASK') && (
              <div className="space-y-6">
                {/* 1. File Upload Area */}
                <div className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                      <span className="text-xs font-bold text-slate-800 uppercase">
                        TẢI LÊN TỆP MINH CHỨNG SỐ (TỐI ĐA 25MB)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Định dạng: Word, Excel, PDF, PNG, JPG, ZIP
                    </span>
                  </div>

                  {evidenceUrls[currentQ.id] ? (
                    <div className="p-3.5 rounded-md bg-white border border-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
                        <span className="truncate max-w-sm">Tệp minh chứng đã được tải lên thành công</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={evidenceUrls[currentQ.id]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
                        >
                          Xem tệp
                        </a>
                        <label className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer">
                          Thay tệp khác
                          <input
                            type="file"
                            accept=".docx,.doc,.xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp,.zip"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(currentQ.id, f);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 mb-2" strokeWidth={1.75} />
                      <span className="text-xs font-semibold text-slate-700">
                        {uploadingFile ? 'Đang tải tệp lên máy chủ...' : 'Nhấp để chọn tệp hoặc kéo thả tệp vào đây'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Hỗ trợ Word (.docx), Excel (.xlsx), PDF, ảnh và ZIP dung lượng tối đa 25MB
                      </span>
                      <input
                        type="file"
                        accept=".docx,.doc,.xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp,.zip"
                        disabled={uploadingFile}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(currentQ.id, f);
                        }}
                      />
                    </label>
                  )}

                  {uploadError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {uploadError}
                    </p>
                  )}
                </div>

                {/* 2. Mandatory >= 30 Words Explanation Textarea */}
                <div className="space-y-3">
                  {(() => {
                    const text = textAnswers[currentQ.id] || '';
                    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
                    const meetsWordCount = wordCount >= 30;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                            <span className="text-xs font-bold text-slate-800 uppercase">
                              BẢN THUYẾT MINH GIẢI TRÌNH MINH CHỨNG (BẮT BUỘC &ge; 30 TỪ)
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border ${
                              meetsWordCount
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {wordCount} / 30 từ {meetsWordCount ? '(Đạt chuẩn)' : `(Thiếu ${30 - wordCount} từ)`}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          Nêu rõ công cụ số/phần mềm đã sử dụng (Canva, Figma, Office...), mục đích thông điệp truyền thông và cam kết tính trung thực, bản quyền của sản phẩm.
                        </p>

                        <textarea
                          rows={6}
                          value={text}
                          onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                          placeholder="Nhập bản thuyết minh giải trình minh chứng của bạn (bắt buộc tối thiểu 30 từ để được công nhận)..."
                          className="w-full p-4 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600 leading-relaxed font-sans"
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Prev / Next Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              Câu trước
            </button>

            <span className="text-xs text-slate-400">
              Đã chọn: {selectedAnswers[currentQ.id] ? 'Đã trả lời' : 'Chưa chọn'}
            </span>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              Câu tiếp theo
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Right: Question Navigator Panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-100">
              BẢNG CÂU HỎI ({answeredCount}/{questions.length})
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(selectedAnswers[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-md text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'ring-2 ring-sky-600 bg-sky-600 text-white'
                        : isAnswered
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-sky-600 inline-block" />
                <span>Đang chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-800 inline-block" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />
                <span>Chưa trả lời</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0">
                <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận nộp bài khảo thí</h3>
                <p className="text-xs text-slate-500">Chấm khách quan tức thì trong 0.01s</p>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span>Số câu đã trả lời:</span>
                <span className="font-bold text-slate-900">
                  {answeredCount} / {questions.length} câu
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian còn lại:</span>
                <span className="font-bold text-slate-900">{formatTime(timeRemaining)}</span>
              </div>
              {answeredCount < questions.length && (
                <div className="text-rose-600 font-semibold pt-1 border-t border-slate-200/60">
                  ⚠️ Bạn còn {questions.length - answeredCount} câu chưa trả lời. Các câu chưa chọn sẽ nhận 0 điểm.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Xác nhận Nộp ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
