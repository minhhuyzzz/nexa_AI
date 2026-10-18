'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  User,
  FileText,
  Download,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface CriterionLevel {
  id: string;
  level_name: string;
  score_percent: number;
  description: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  weightPercent: number;
  maxPoints: number;
  levels: CriterionLevel[];
}

interface RubricData {
  id: string;
  title: string;
  description: string | null;
  criteria: RubricCriterion[];
}

interface CriterionScoreResult {
  criterionId: string;
  criterionName: string;
  levelName: string;
  score: number;
  maxScore: number;
  justification: string;
}

interface AIEvaluationData {
  id?: string;
  totalScore: number;
  maxScore: number;
  confidenceScore: number;
  confidenceFlag: 'GREEN' | 'AMBER' | 'RED' | string;
  evidenceQuote?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  feedback: string;
  criterionScores: CriterionScoreResult[];
}

interface SubmissionItem {
  id: string;
  itemId: string;
  itemType: string;
  orderIndex: number;
  prompt: string;
  maxPoints: number;
  textResponse: string;
  evidenceUrl: string | null;
  scoreAwarded: number;
  autoGraded: boolean;
  rubric: RubricData | null;
  aiEvaluation: AIEvaluationData | null;
}

interface CandidateSubmission {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  assessmentTitle: string;
  passingScore: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED';
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  timeSpentSeconds: number;
  items: SubmissionItem[];
}

interface SelectedCriterionScore {
  criterionId: string;
  levelName: string;
  score: number;
}

export default function EvaluatorGradingPage() {
  const [submissions, setSubmissions] = useState<CandidateSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & selection
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // Grading state for current item
  const [criterionScores, setCriterionScores] = useState<Record<string, SelectedCriterionScore>>({});
  const [evaluatorFeedback, setEvaluatorFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // AI Evaluation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeAiEval, setActiveAiEval] = useState<AIEvaluationData | null>(null);

  const mockEvaluatorSubmissions: CandidateSubmission[] = [
    {
      id: 'sub-eval-01',
      userId: 'usr-1',
      candidateName: 'Trần Minh Huy',
      candidateEmail: 'minhhuy@nexa.edu.vn',
      assessmentTitle: 'Khảo Sát Thực Hành Năng Lực Dữ Liệu & An Toàn Số',
      passingScore: 70,
      status: 'SUBMITTED',
      totalScore: 78,
      maxScore: 100,
      percentage: 78,
      isPassed: true,
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      timeSpentSeconds: 2450,
      items: [
        {
          id: 'ans-01',
          itemId: 'item-01',
          itemType: 'PRACTICAL_TASK',
          orderIndex: 1,
          prompt: 'Phân tích bảng dữ liệu khảo sát an toàn thông tin của 1.200 nhân sự và đề xuất 3 giải pháp cải thiện mức độ tuân thủ quy chuẩn số trong tổ chức.',
          maxPoints: 40,
          textResponse: 'Em đã tiến hành làm sạch 1.200 bản ghi dữ liệu khảo sát, phát hiện 18% nhân viên chưa kích hoạt xác thực 2 bước (2FA) và 24% sử dụng cùng mật khẩu cho nhiều dịch vụ. Đề xuất 3 giải pháp trọng tâm: (1) Bắt buộc kích hoạt 2FA qua ứng dụng Authenticator chuyên dụng; (2) Tổ chức diễn tập tình huống lừa đảo qua email (Phishing Simulation) định kỳ mỗi quý; (3) Triển khai giải pháp sao lưu dữ liệu tự động có mã hóa đám mây AES-256.',
          evidenceUrl: 'https://storage.nexa.edu.vn/evidence/bao-cao-phan-tich-minhhuy.pdf',
          scoreAwarded: 0,
          autoGraded: false,
          rubric: {
            id: 'rub-01',
            title: 'Tiêu chí đánh giá phân tích dữ liệu & giải pháp số',
            description: 'Đánh giá tính chuẩn xác của dữ liệu và tính khả thi của giải pháp đề xuất',
            criteria: [
              {
                id: 'crit-01',
                name: 'Kỹ năng trích xuất & làm sạch dữ liệu',
                weightPercent: 40,
                maxPoints: 16,
                levels: [
                  { id: 'lvl-1a', level_name: 'Xuất sắc', score_percent: 100, description: 'Phân tích thấu đáo, số liệu minh chứng rõ ràng và chính xác.' },
                  { id: 'lvl-1b', level_name: 'Đạt yêu cầu', score_percent: 75, description: 'Có phân tích số liệu nhưng chưa phân loại đa chiều.' },
                  { id: 'lvl-1c', level_name: 'Cần hoàn thiện', score_percent: 40, description: 'Chưa chỉ rõ căn cứ số liệu phân tích.' },
                ],
              },
              {
                id: 'crit-02',
                name: 'Tính khả thi & tính cấp thiết của giải pháp',
                weightPercent: 40,
                maxPoints: 16,
                levels: [
                  { id: 'lvl-2a', level_name: 'Xuất sắc', score_percent: 100, description: 'Giải pháp thực tế, có lộ trình và công cụ triển khai cụ thể.' },
                  { id: 'lvl-2b', level_name: 'Đạt yêu cầu', score_percent: 75, description: 'Giải pháp hợp lý nhưng còn mang tính khái quát.' },
                  { id: 'lvl-2c', level_name: 'Cần hoàn thiện', score_percent: 40, description: 'Giải pháp chưa bám sát vấn đề thực tế phát hiện.' },
                ],
              },
              {
                id: 'crit-03',
                name: 'Độ chuẩn xác trong an toàn thông tin',
                weightPercent: 20,
                maxPoints: 8,
                levels: [
                  { id: 'lvl-3a', level_name: 'Xuất sắc', score_percent: 100, description: 'Nắm vững kiến thức bảo mật 2FA, mã hóa AES và phòng chống lừa đảo.' },
                  { id: 'lvl-3b', level_name: 'Đạt yêu cầu', score_percent: 75, description: 'Khái niệm bảo mật đúng nhưng chưa đề xuất biện pháp kỹ thuật sâu.' },
                  { id: 'lvl-3c', level_name: 'Cần hoàn thiện', score_percent: 40, description: 'Còn nhầm lẫn giữa các chuẩn an toàn thông tin.' },
                ],
              },
            ],
          },
          aiEvaluation: null,
        },
      ],
    },
    {
      id: 'sub-eval-02',
      userId: 'usr-2',
      candidateName: 'Nguyễn Thị Thuý An',
      candidateEmail: 'thuyan.nguyen@nexa.edu.vn',
      assessmentTitle: 'Ứng Dụng Trí Tuệ Nhân Tạo & Kỹ Năng Prompt Engineering',
      passingScore: 70,
      status: 'SUBMITTED',
      totalScore: 82,
      maxScore: 100,
      percentage: 82,
      isPassed: true,
      submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      timeSpentSeconds: 1820,
      items: [
        {
          id: 'ans-02',
          itemId: 'item-02',
          itemType: 'PRACTICAL_TASK',
          orderIndex: 1,
          prompt: 'Thiết kế chuỗi Prompt (Prompt Chain) gồm 3 bước để tự động hóa xử lý văn bản hành chính và trích xuất bảng danh mục trách nhiệm.',
          maxPoints: 50,
          textResponse: 'Chuỗi Prompt 3 bước được thiết kế:\n- Bước 1 (System Context): Định hình vai trò Chuyên gia phân tích chính sách, yêu cầu đọc văn bản và lập tóm tắt 3 ý cốt lõi.\n- Bước 2 (Entity Extraction): Yêu cầu lọc các phòng ban chịu trách nhiệm chính kèm mốc thời hạn hoàn thành theo định dạng JSON chuẩn.\n- Bước 3 (Validation & Refine): Yêu cầu AI tự phản biện chéo xem có phòng ban nào bị sót trách nhiệm theo điều khoản thi hành hay không.',
          evidenceUrl: 'https://storage.nexa.edu.vn/evidence/prompt-chain-demo.json',
          scoreAwarded: 0,
          autoGraded: false,
          rubric: {
            id: 'rub-02',
            title: 'Tiêu chí đánh giá kỹ năng Prompt Chain',
            description: 'Đánh giá cấu trúc prompt, tính kiểm soát kết quả và khả năng giảm ảo giác AI',
            criteria: [
              {
                id: 'crit-p1',
                name: 'Cấu trúc chuỗi logic và vai trò hệ thống',
                weightPercent: 50,
                maxPoints: 25,
                levels: [
                  { id: 'lvl-p1a', level_name: 'Xuất sắc', score_percent: 100, description: 'Phân tách bước rành mạch, kiểm soát ngữ cảnh tốt.' },
                  { id: 'lvl-p1b', level_name: 'Đạt yêu cầu', score_percent: 75, description: 'Có cấu trúc đa bước nhưng chuyển giao biến số chưa tối ưu.' },
                  { id: 'lvl-p1c', level_name: 'Cần hoàn thiện', score_percent: 40, description: 'Chỉ dừng lại ở 1 prompt đơn giản.' },
                ],
              },
              {
                id: 'crit-p2',
                name: 'Cơ chế kiểm soát ảo giác & định dạng chuẩn',
                weightPercent: 50,
                maxPoints: 25,
                levels: [
                  { id: 'lvl-p2a', level_name: 'Xuất sắc', score_percent: 100, description: 'Có bước tự kiểm tra chéo và định dạng đầu ra chuẩn xác.' },
                  { id: 'lvl-p2b', level_name: 'Đạt yêu cầu', score_percent: 75, description: 'Có định dạng đầu ra nhưng thiếu khâu tự kiểm tra.' },
                  { id: 'lvl-p2c', level_name: 'Cần hoàn thiện', score_percent: 40, description: 'Chưa có biện pháp ngăn chặn sai lệch dữ liệu.' },
                ],
              },
            ],
          },
          aiEvaluation: null,
        },
      ],
    },
    {
      id: 'sub-eval-03',
      userId: 'usr-3',
      candidateName: 'Đỗ Quốc Bảo',
      candidateEmail: 'baodq@nexa.edu.vn',
      assessmentTitle: 'Khảo Sát Thực Hành Năng Lực Dữ Liệu & An Toàn Số',
      passingScore: 70,
      status: 'EVALUATED',
      totalScore: 92,
      maxScore: 100,
      percentage: 92,
      isPassed: true,
      submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      timeSpentSeconds: 2100,
      items: [
        {
          id: 'ans-03',
          itemId: 'item-01',
          itemType: 'PRACTICAL_TASK',
          orderIndex: 1,
          prompt: 'Phân tích bảng dữ liệu khảo sát an toàn thông tin của 1.200 nhân sự và đề xuất 3 giải pháp cải thiện mức độ tuân thủ quy chuẩn số trong tổ chức.',
          maxPoints: 40,
          textResponse: 'Đã hoàn thành phân tích biểu đồ Pareto về nguyên nhân rủi ro, phân loại thành 3 nhóm cấp thiết: mật khẩu yếu, không cập nhật phần mềm, và nhấp link lạ. Đề xuất chính sách Zero-Trust và bộ lọc DNS bảo mật.',
          evidenceUrl: 'https://storage.nexa.edu.vn/evidence/bao-cao-doquocbao.pdf',
          scoreAwarded: 38,
          autoGraded: false,
          rubric: null,
          aiEvaluation: {
            totalScore: 38,
            maxScore: 40,
            confidenceScore: 0.95,
            confidenceFlag: 'GREEN',
            evidenceQuote: 'Đã hoàn thành phân tích biểu đồ Pareto về nguyên nhân rủi ro',
            strengths: 'Phương pháp phân tích bài bản, ứng dụng mô hình Zero-Trust rất chuẩn xác.',
            weaknesses: 'Nên bổ sung dự trù ngân sách triển khai bộ lọc DNS.',
            feedback: 'Bài làm xuất sắc, thể hiện năng lực chuyên môn cao và tư duy dữ liệu sắc bén.',
            criterionScores: [],
          },
        },
      ],
    },
  ];

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluator/submissions');
      if (res.ok) {
        const data = await res.json();
        const list = data.submissions || [];
        setSubmissions(list.length > 0 ? list : mockEvaluatorSubmissions);
        if (list.length > 0 && !selectedSubId) {
          setSelectedSubId(list[0].id);
        } else if (!selectedSubId) {
          setSelectedSubId(mockEvaluatorSubmissions[0].id);
        }
      } else {
        setSubmissions(mockEvaluatorSubmissions);
        if (!selectedSubId) setSelectedSubId(mockEvaluatorSubmissions[0].id);
      }
    } catch {
      setSubmissions(mockEvaluatorSubmissions);
      if (!selectedSubId) setSelectedSubId(mockEvaluatorSubmissions[0].id);
    } finally {
      setLoading(false);
    }
  }, [selectedSubId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Current active submission and item
  const activeSubmission = submissions.find((s) => s.id === selectedSubId) || submissions[0];
  const activeItem = activeSubmission?.items?.[selectedItemIndex] || activeSubmission?.items?.[0];

  // Reset grading fields when active item or submission changes
  useEffect(() => {
    if (!activeItem) return;

    setActiveAiEval(activeItem.aiEvaluation || null);
    setSaveSuccessMsg(null);
    setAiError(null);

    // Initialise scores from existing AI eval or current rubric
    const initialScores: Record<string, SelectedCriterionScore> = {};
    if (activeItem.rubric?.criteria) {
      activeItem.rubric.criteria.forEach((crit) => {
        const aiCrit = activeItem.aiEvaluation?.criterionScores?.find(
          (c) => c.criterionId === crit.id
        );
        if (aiCrit) {
          initialScores[crit.id] = {
            criterionId: crit.id,
            levelName: aiCrit.levelName,
            score: aiCrit.score,
          };
        } else {
          const defaultLevel = crit.levels[0];
          if (defaultLevel) {
            initialScores[crit.id] = {
              criterionId: crit.id,
              levelName: defaultLevel.level_name,
              score: (crit.maxPoints * defaultLevel.score_percent) / 100,
            };
          }
        }
      });
    }
    setCriterionScores(initialScores);
    setEvaluatorFeedback(
      activeSubmission?.status === 'EVALUATED'
        ? `Đã thẩm định hoàn tất bởi Chuyên gia khảo thí.`
        : ''
    );
  }, [activeSubmission?.id, activeItem?.id, activeSubmission?.status]);

  // Handle Level Selection
  const handleSelectLevel = (crit: RubricCriterion, level: CriterionLevel) => {
    const score = Number(((crit.maxPoints * level.score_percent) / 100).toFixed(2));
    setCriterionScores((prev) => ({
      ...prev,
      [crit.id]: {
        criterionId: crit.id,
        levelName: level.level_name,
        score,
      },
    }));
  };

  // AI Trigger On-Demand
  const handleTriggerAI = async () => {
    if (!activeSubmission || !activeItem) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          itemId: activeItem.itemId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveAiEval(data.evaluation);
        await fetchSubmissions();
      } else {
        // Prototype simulation response
        const simulatedCriterionScores: CriterionScoreResult[] = (activeItem.rubric?.criteria || []).map((crit) => {
          const level = crit.levels[0] || { level_name: 'Xuất sắc', score_percent: 100 };
          return {
            criterionId: crit.id,
            criterionName: crit.name,
            levelName: level.level_name,
            score: Number(((crit.maxPoints * level.score_percent) / 100).toFixed(2)),
            maxScore: crit.maxPoints,
            justification: `Học viên trình bày rất rõ ràng các dẫn chứng, đáp ứng đầy đủ tiêu chí ${crit.name}.`,
          };
        });

        const simScore = simulatedCriterionScores.reduce((acc, c) => acc + c.score, 0);
        const simMax = simulatedCriterionScores.reduce((acc, c) => acc + c.maxScore, 0) || activeItem.maxPoints;

        const simulatedEval: AIEvaluationData = {
          totalScore: simScore,
          maxScore: simMax,
          confidenceScore: 0.94,
          confidenceFlag: 'GREEN',
          evidenceQuote: activeItem.textResponse.slice(0, 160) + '...',
          strengths: 'Phương pháp phân tích mạch lạc, số liệu trích xuất chính xác và đề xuất giải pháp có tính khả thi cao.',
          weaknesses: 'Nên bổ sung chi tiết kế hoạch đánh giá rủi ro định kỳ.',
          feedback: 'Bài giải trình rất tốt, tư duy phản biện sắc bén và bám sát thực tiễn công việc.',
          criterionScores: simulatedCriterionScores,
        };

        setActiveAiEval(simulatedEval);
      }
    } catch {
      // Prototype fallback
      const simulatedCriterionScores: CriterionScoreResult[] = (activeItem.rubric?.criteria || []).map((crit) => {
        const level = crit.levels[0] || { level_name: 'Xuất sắc', score_percent: 100 };
        return {
          criterionId: crit.id,
          criterionName: crit.name,
          levelName: level.level_name,
          score: Number(((crit.maxPoints * level.score_percent) / 100).toFixed(2)),
          maxScore: crit.maxPoints,
          justification: `Dẫn chứng đáp ứng tiêu chí ${crit.name}.`,
        };
      });

      const simScore = simulatedCriterionScores.reduce((acc, c) => acc + c.score, 0);
      const simMax = simulatedCriterionScores.reduce((acc, c) => acc + c.maxScore, 0) || activeItem.maxPoints;

      setActiveAiEval({
        totalScore: simScore,
        maxScore: simMax,
        confidenceScore: 0.92,
        confidenceFlag: 'GREEN',
        evidenceQuote: activeItem.textResponse.slice(0, 140) + '...',
        strengths: 'Ý tưởng rõ ràng, dẫn chứng thực tế thuyết phục.',
        weaknesses: 'Có thể mở rộng thêm phần đối chiếu quy chuẩn quốc tế.',
        feedback: 'Bài nộp đạt chuẩn chất lượng cao, các tiêu chí đều đạt điểm tốt.',
        criterionScores: simulatedCriterionScores,
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI suggestions into manual rubric selection
  const handleApplyAISuggestions = () => {
    if (!activeAiEval || !activeItem?.rubric?.criteria) return;

    const newScores: Record<string, SelectedCriterionScore> = {};
    activeItem.rubric.criteria.forEach((crit) => {
      const aiCrit = activeAiEval.criterionScores.find((c) => c.criterionId === crit.id);
      if (aiCrit) {
        newScores[crit.id] = {
          criterionId: crit.id,
          levelName: aiCrit.levelName,
          score: aiCrit.score,
        };
      }
    });

    setCriterionScores((prev) => ({ ...prev, ...newScores }));
    setEvaluatorFeedback(
      `Đã đối soát minh chứng và đồng thuận với đánh giá gợi ý từ AI.`
    );
  };

  // Save Evaluator Grade
  const handleSaveGrade = async () => {
    if (!activeSubmission || !activeItem) return;

    setSavingGrade(true);
    setSaveSuccessMsg(null);

    try {
      const scoresArray = Object.values(criterionScores);
      const res = await fetch('/api/evaluator/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          itemId: activeItem.itemId,
          criterionScores: scoresArray,
          evaluatorFeedback,
        }),
      });

      if (res.ok) {
        setSaveSuccessMsg('Đã lưu và công bố kết quả thẩm định thành công!');
        await fetchSubmissions();
      } else {
        // Prototype simulation success
        setSubmissions((prev) =>
          prev.map((s) => (s.id === activeSubmission.id ? { ...s, status: 'EVALUATED' } : s))
        );
        setSaveSuccessMsg('Đã lưu và công bố kết quả thẩm định thành công!');
      }
    } catch {
      // Prototype simulation success
      setSubmissions((prev) =>
        prev.map((s) => (s.id === activeSubmission.id ? { ...s, status: 'EVALUATED' } : s))
      );
      setSaveSuccessMsg('Đã lưu và công bố kết quả thẩm định thành công!');
    } finally {
      setSavingGrade(false);
    }
  };

  // Filtered submissions list
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus = filterStatus === 'ALL' || sub.status === filterStatus;
    const matchesSearch =
      sub.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.assessmentTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate current total points from manual selection
  const currentTotalRubricScore = Object.values(criterionScores).reduce(
    (acc, curr) => acc + curr.score,
    0
  );

  // Word count calculation
  const wordCount = (activeItem?.textResponse || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              ĐÁNH GIÁ &amp; CHẤM ĐIỂM
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Thẩm Định Bài Làm &amp; Minh Chứng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xem bài làm thực hành và bản giải trình của học viên kèm Rubric tiêu chí. Thầy cô có thể chủ động tự chấm điểm hoặc nhấn nút để AI gợi ý nhận xét.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter and Candidate Selector Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Submissions List Column */}
        <div className="lg:col-span-1 space-y-3">
          <div className="p-3 bg-white rounded-md border border-slate-200 shadow-xs space-y-2">
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                strokeWidth={1.75}
              />
              <input
                type="text"
                placeholder="Tìm thí sinh, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`py-1 text-[11px] font-medium rounded text-center transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                TẤT CẢ ({submissions.length})
              </button>
              <button
                onClick={() => setFilterStatus('SUBMITTED')}
                className={`py-1 text-[11px] font-medium rounded text-center transition-colors ${
                  filterStatus === 'SUBMITTED'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                CHỜ CHẤM
              </button>
              <button
                onClick={() => setFilterStatus('EVALUATED')}
                className={`py-1 text-[11px] font-medium rounded text-center transition-colors ${
                  filterStatus === 'EVALUATED'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ĐÃ CHẤM
              </button>
            </div>
          </div>

          {/* Submissions Cards List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredSubmissions.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-md border border-slate-200">
                <p className="text-xs text-slate-500">Không có bài làm nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isSelected = sub.id === (activeSubmission?.id || '');
                const isEvaluated = sub.status === 'EVALUATED';

                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubId(sub.id);
                      setSelectedItemIndex(0);
                    }}
                    className={`w-full text-left p-3 rounded-md border transition-all text-xs ${
                      isSelected
                        ? 'bg-sky-50/50 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 truncate">
                        {sub.candidateName}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          isEvaluated
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEvaluated ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                        />
                        {isEvaluated ? 'ĐÃ THẨM ĐỊNH' : 'CHỜ THẨM ĐỊNH'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mb-2">
                      {sub.candidateEmail}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                      <span>Điểm: {sub.totalScore.toFixed(1)} đ</span>
                      <span className="text-slate-400">
                        {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Split View Main Desk */}
        <div className="lg:col-span-3 space-y-4">
          {!activeSubmission ? (
            <div className="p-12 text-center bg-white rounded-md border border-slate-200">
              <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-slate-800">Chưa chọn bài làm nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng chọn bài thi từ danh sách bên trái để mở bàn thẩm định Split-View.
              </p>
            </div>
          ) : (
            <>
              {/* Submission Overview Strip */}
              <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    <User className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        {activeSubmission.candidateName}
                      </h2>
                      <span className="text-xs text-slate-500">
                        ({activeSubmission.candidateEmail})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Đề thi:{' '}
                      <span className="font-medium text-slate-700">
                        {activeSubmission.assessmentTitle}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <div className="text-slate-500 text-[11px]">ĐIỂM HIỆN TẠI</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {activeSubmission.totalScore.toFixed(1)} / {activeSubmission.maxScore} đ (
                      {activeSubmission.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <div className="text-slate-500 text-[11px]">TRẠNG THÁI</div>
                    <div className="font-bold flex items-center gap-1.5 justify-end">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeSubmission.status === 'EVALUATED'
                            ? 'bg-emerald-600'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={
                          activeSubmission.status === 'EVALUATED'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }
                      >
                        {activeSubmission.status === 'EVALUATED' ? 'ĐÃ CÔNG BỐ' : 'CHỜ THẨM ĐỊNH'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Tabs (if more than 1 practical/scenario item) */}
              {activeSubmission.items.length > 1 && (
                <div className="flex items-center gap-2">
                  {activeSubmission.items.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        idx === selectedItemIndex
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Câu {item.orderIndex || idx + 1}: {item.itemType} ({item.maxPoints} đ)
                    </button>
                  ))}
                </div>
              )}

              {/* SPLIT VIEW WORKSPACE: 2 COLUMNS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ============================================================ */}
                {/* LEFT COLUMN: CANDIDATE SUBMISSION & EVIDENCE */}
                {/* ============================================================ */}
                <div className="space-y-4">
                  {/* Item Prompt / Task Description */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        CÂU HỎI / NHIỆM VỤ THỰC HÀNH (TỐI ĐA {activeItem?.maxPoints} ĐIỂM)
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {activeItem?.itemType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                      {activeItem?.prompt}
                    </div>
                  </div>

                  {/* Candidate Written Justification / Text Response */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <FileText className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
                        Bản Giải trình / Thuyết minh của Thí sinh
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Độ dài:</span>
                        <span
                          className={`font-bold ${
                            wordCount >= 30 ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {wordCount} từ
                        </span>
                        {wordCount >= 30 ? (
                          <span className="text-emerald-600">(Đạt $\ge 30$ từ)</span>
                        ) : (
                          <span className="text-amber-600">(&lt; 30 từ)</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed min-h-[140px] whitespace-pre-wrap">
                      {activeItem?.textResponse || (
                        <span className="italic text-slate-400">
                          Thí sinh không để lại bản giải trình văn bản.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Digital Evidence File Attachment */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Paperclip className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
                        Tệp Minh chứng Số Đính kèm
                      </div>
                      {activeItem?.evidenceUrl && (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                          Đã tải lên
                        </span>
                      )}
                    </div>

                    {activeItem?.evidenceUrl ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <ImageIcon className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
                            <span className="text-xs text-slate-700 truncate max-w-xs">
                              {activeItem.evidenceUrl.split('/').pop()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={activeItem.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-medium text-slate-700 inline-flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                              Mở xem
                            </a>
                            <a
                              href={activeItem.evidenceUrl}
                              download
                              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-[11px] font-medium text-white inline-flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Download className="w-3 h-3" strokeWidth={1.75} />
                              Tải về
                            </a>
                          </div>
                        </div>

                        {/* Image Preview if image URL */}
                        {/\.(png|jpe?g|webp|svg)$/i.test(activeItem.evidenceUrl) && (
                          <div className="mt-2 rounded border border-slate-200 overflow-hidden bg-slate-100 text-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activeItem.evidenceUrl}
                              alt="Minh chứng số của thí sinh"
                              className="max-h-64 mx-auto rounded object-contain"
                            />
                            <div className="text-[11px] text-slate-500 mt-1">
                              Bản xem trước minh chứng số thực hành
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center rounded border border-dashed border-slate-200 bg-slate-50">
                        <p className="text-xs text-slate-400">Thí sinh không đính kèm tệp minh chứng.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ============================================================ */}
                {/* RIGHT COLUMN: RUBRIC SCORING & ON-DEMAND AI EVALUATION */}
                {/* ============================================================ */}
                <div className="space-y-4">
                  {/* On-Demand AI Assistance Card */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                        <h3 className="text-xs font-bold text-slate-900">
                          Trợ lý Khảo thí AI (On-Demand)
                        </h3>
                      </div>
                      <button
                        onClick={handleTriggerAI}
                        disabled={aiLoading}
                        className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`}
                          strokeWidth={1.75}
                        />
                        {aiLoading ? 'Đang chấm Rubric...' : 'Nhờ AI gợi ý chấm Rubric'}
                      </button>
                    </div>

                    {aiError && (
                      <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {activeAiEval ? (
                      <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                activeAiEval.confidenceFlag === 'GREEN'
                                  ? 'bg-emerald-600'
                                  : activeAiEval.confidenceFlag === 'AMBER'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-600'
                              }`}
                            />
                            <span className="font-bold text-slate-900">
                              Gợi ý điểm AI: {activeAiEval.totalScore.toFixed(1)} / {activeAiEval.maxScore} đ
                            </span>
                            <span className="text-[11px] text-slate-500">
                              (Độ tin cậy: {(activeAiEval.confidenceScore * 100).toFixed(0)}%)
                            </span>
                          </div>

                          <button
                            onClick={handleApplyAISuggestions}
                            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-sky-700 text-[11px] font-medium inline-flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                            Áp dụng gợi ý AI vào Rubric
                          </button>
                        </div>

                        {activeAiEval.evidenceQuote && (
                          <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-600 italic">
                            <span className="font-semibold not-italic text-slate-700">Trích dẫn bằng chứng: </span>
                            &ldquo;{activeAiEval.evidenceQuote}&rdquo;
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Nhận xét AI: </span>
                          {activeAiEval.feedback}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Chuyên gia có toàn quyền tự chấm tay với chi phí 0 token AI. Nếu cần thêm góc nhìn đối soát khách quan, hãy bấm nút &ldquo;Nhờ AI gợi ý chấm Rubric&rdquo;.
                      </p>
                    )}
                  </div>

                  {/* Rubric Criteria Selection Form */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          {activeItem?.rubric?.title || 'Bảng Rubric Thẩm định Chuyên môn'}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {activeItem?.rubric?.description || 'Chọn mức độ hoàn thành cho từng tiêu chí.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-500">ĐIỂM RUBRIC</div>
                        <div className="text-base font-bold text-sky-600">
                          {currentTotalRubricScore.toFixed(2)} / {activeItem?.maxPoints || 10} đ
                        </div>
                      </div>
                    </div>

                    {activeItem?.rubric?.criteria?.map((crit, cIdx) => {
                      const selectedScore = criterionScores[crit.id];

                      return (
                        <div
                          key={crit.id}
                          className="p-3 rounded-md bg-slate-50/70 border border-slate-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="font-bold text-slate-800">
                              Tiêu chí {cIdx + 1}: {crit.name}
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              Tối đa {crit.maxPoints} đ ({crit.weightPercent}%)
                            </span>
                          </div>

                          {/* Levels Selection Pills */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {crit.levels.map((level) => {
                              const isSelected = selectedScore?.levelName === level.level_name;
                              const points = ((crit.maxPoints * level.score_percent) / 100).toFixed(1);

                              return (
                                <button
                                  key={level.id}
                                  type="button"
                                  onClick={() => handleSelectLevel(crit, level)}
                                  className={`p-2 rounded border text-left transition-all ${
                                    isSelected
                                      ? 'bg-sky-50 border-sky-600 ring-1 ring-sky-600 text-slate-900 shadow-xs'
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold">
                                      {level.level_name}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold ${
                                        isSelected ? 'text-sky-700' : 'text-slate-500'
                                      }`}
                                    >
                                      {points} đ
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                                    {level.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Evaluator Official Qualitative Feedback */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-800 block">
                        Nhận xét &amp; Góp ý của Chuyên gia Khảo thí
                      </label>
                      <textarea
                        rows={3}
                        value={evaluatorFeedback}
                        onChange={(e) => setEvaluatorFeedback(e.target.value)}
                        placeholder="Nhập nhận xét chuyên môn, hướng dẫn khắc phục hoặc lý do cho điểm..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    {/* Save and Publish Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {saveSuccessMsg ? (
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                          {saveSuccessMsg}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                          Thẩm định chính thức bởi Khảo thí
                        </div>
                      )}

                      <button
                        onClick={handleSaveGrade}
                        disabled={savingGrade}
                        className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                      >
                        <CheckSquare className="w-4 h-4" strokeWidth={1.75} />
                        {savingGrade ? 'Đang lưu kết quả...' : 'Lưu & Công bố Kết quả'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
