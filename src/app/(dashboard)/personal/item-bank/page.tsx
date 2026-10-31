'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Database,
  Plus,
  Search,
  Filter,
  Copy,
  CheckSquare,
  FileText,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  Loader2,
  HelpCircle,
  Eye,
  Edit3,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ItemBankImporter } from '@/features/assessments/components/ItemBankImporter';

interface QuestionItem {
  id: string;
  code: string;
  domain: string;
  skill: string;
  level: string;
  type: string;
  prompt: string;
  rubricWeight: number;
  isNexaStandard: boolean;
  sampleAnswerCriteria: string;
  rubricGuide?: string | null;
  options?: Array<{ id: string; content: string; is_correct: boolean; explanation?: string | null }>;
}

interface CompetencyOption {
  id: string;
  skill_code: string;
  title: string;
  domain_title: string;
}

const formatTypeLabel = (type: string) => {
  switch (type) {
    case 'MCQ': return 'Trắc nghiệm khách quan';
    case 'SCENARIO': return 'Xử lý tình huống';
    case 'PRACTICAL_FILE': return 'Thực hành nộp tệp tin';
    case 'DIGITAL_LINK': return 'Nộp liên kết số';
    default: return type;
  }
};

const formatTypeBadge = (type: string) => {
  switch (type) {
    case 'MCQ':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'SCENARIO':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'PRACTICAL_FILE':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'DIGITAL_LINK':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export default function EvaluatorItemBankPage() {
  const supabase = createClient();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [competencies, setCompetencies] = useState<CompetencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [clonedId, setClonedId] = useState<string | null>(null);
  const [showAnswerKeys, setShowAnswerKeys] = useState(true);

  // Import Verification Wizard
  const [showImporter, setShowImporter] = useState(false);

  const fetchItemBank = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch competencies
      const { data: compData } = await supabase
        .from('competencies')
        .select(`
          id,
          skill_code,
          title,
          competency_domains (
            title
          )
        `)
        .order('skill_code', { ascending: true });

      if (compData) {
        const mappedComps: CompetencyOption[] = compData.map((c: any) => ({
          id: c.id,
          skill_code: c.skill_code,
          title: c.title,
          domain_title: c.competency_domains?.title || 'Chung',
        }));
        setCompetencies(mappedComps);
      }

      // 2. Fetch assessment items with options & rubric guide
      const { data: itemsData, error: itemsError } = await supabase
        .from('question_bank_items')
        .select(`
          id,
          code,
          type,
          prompt,
          default_points,
          difficulty_level,
          status,
          competencies (
            id,
            skill_code,
            title,
            target_level,
            competency_domains (
              id,
              code,
              title
            )
          ),
          question_bank_options (
            id,
            content,
            is_correct,
            explanation,
            order_index
          )
        `)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Error fetching question bank items:', itemsError);
      } else if (itemsData) {
        const mapped: QuestionItem[] = itemsData.map((item: any, idx: number) => {
          const comp = item.competencies;
          const domain = comp?.competency_domains;
          const sortedOptions = (item.question_bank_options || []).sort(
            (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
          );

          return {
            id: item.id,
            code: item.code || (comp?.skill_code ? `D${comp.skill_code}-${item.type}-${idx + 1}` : `QB-${item.id.slice(0, 6)}`),
            domain: domain?.title || 'Thông tin & Dữ liệu số',
            skill: comp ? `${comp.skill_code} ${comp.title}` : 'Kỹ năng số tổng hợp',
            level: item.difficulty_level || 'DigComp 3.0',
            type: item.type || 'MCQ',
            prompt: item.prompt,
            rubricWeight: Number(item.default_points) || 10,
            isNexaStandard: true,
            sampleAnswerCriteria: 'Tự động chấm bằng code thuần theo barem điểm quy định.',
            options: sortedOptions,
          };
        });
        setQuestions(mapped);
      }
    } catch (err) {
      console.error('Unexpected error loading item bank:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchItemBank();
  }, [fetchItemBank]);

  const filteredQuestions = questions.filter((q) => {
    const matchType = activeType === 'ALL' || q.type === activeType;
    const matchSearch =
      q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.skill.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleClone = async (id: string) => {
    setClonedId(id);
    const target = questions.find((q) => q.id === id);
    if (target) {
      const { data, error } = await supabase
        .from('question_bank_items')
        .insert({
          code: `QB-${Date.now().toString(36).toUpperCase()}`,
          type: target.type,
          prompt: `[Bản sao] ${target.prompt}`,
          default_points: target.rubricWeight,
          difficulty_level: 'INTERMEDIATE',
        })
        .select()
        .single();

      if (!error && data) {
        await fetchItemBank();
      }
    }
    setTimeout(() => setClonedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              NGÂN HÀNG CÂU HỎI &amp; TIÊU CHÍ RUBRIC
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ngân Hàng Câu Hỏi Đa Hình Thức
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý 4 hình thức khảo thí: Trắc nghiệm khách quan, Tình huống, Thực hành nộp tệp tin và Nộp liên kết số.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title="Tải tệp đề thi Word hoặc Excel để tự động bóc tách thành câu hỏi"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
            <span>Tải tệp đề thi (Word / Excel)</span>
          </button>

          <Link
            href="/personal/item-bank/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tạo câu hỏi mới</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="Tìm theo nội dung, mã hoặc kỹ năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAnswerKeys((prev) => !prev)}
            className={`px-3 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors shrink-0 ${
              showAnswerKeys
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Bật/tắt hiển thị đáp án đúng và tiêu chí rubric"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{showAnswerKeys ? 'Ẩn Đáp Án & Rubric' : 'Xem Đáp Án & Rubric'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả hình thức' },
            { id: 'MCQ', label: 'Trắc nghiệm' },
            { id: 'SCENARIO', label: 'Tình huống' },
            { id: 'PRACTICAL_FILE', label: 'Nộp tệp tin' },
            { id: 'DIGITAL_LINK', label: 'Nộp link số' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
            <p className="text-xs">Đang tải câu hỏi từ cơ sở dữ liệu Supabase...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center rounded-md border border-slate-200 bg-white">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {searchQuery ? 'Không tìm thấy câu hỏi phù hợp' : 'Chưa có câu hỏi nào trong ngân hàng'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc theo hình thức khác.'
                : 'Ngân hàng câu hỏi hiện đang trống. Hãy thêm câu hỏi đầu tiên hoặc tải tệp đề thi lên.'}
            </p>
            <Link
              href="/personal/item-bank/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Thêm câu hỏi mới</span>
            </Link>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                    {q.code}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                    {q.level}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${formatTypeBadge(
                      q.type
                    )}`}
                  >
                    {formatTypeLabel(q.type)}
                  </span>
                  {q.isNexaStandard && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Chuẩn hóa NEXA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    Điểm số:{' '}
                    <span className="font-bold text-slate-800 font-mono">{q.rubricWeight} điểm</span>
                  </span>
                  <Link
                    href={`/personal/item-bank/${q.id}`}
                    className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                    <span>Chỉnh sửa</span>
                  </Link>
                  <button
                    onClick={() => handleClone(q.id)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    {clonedId === q.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" strokeWidth={1.75} />
                        <span className="text-emerald-700 font-semibold">Đã nhân bản</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                        <span>Nhân bản</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Prompt */}
              <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                {q.prompt}
              </p>

              {/* Show Answer Keys & Options (Evaluator Master View) */}
              {showAnswerKeys && q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={opt.id || optIdx}
                        className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                          opt.is_correct
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            opt.is_correct
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-500 border border-slate-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="flex-1">
                          <span>{opt.content}</span>
                          {opt.is_correct && (
                            <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                              Đáp án đúng {opt.explanation ? `— ${opt.explanation}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Show Rubric Guide for Practical questions */}
              {showAnswerKeys &&
                (q.type === 'PRACTICAL_FILE' ||
                  q.type === 'DIGITAL_LINK' ||
                  q.type === 'DIGITAL_EVIDENCE' ||
                  q.type === 'PRACTICAL_TASK') &&
                q.rubricGuide && (
                  <div className="p-3 rounded-md bg-sky-50/60 border border-sky-200 text-xs space-y-1">
                    <span className="font-bold text-sky-900 block">
                      Tiêu chí Rubric chuẩn (Chuyên gia &amp; AI):
                    </span>
                    <p className="text-[11px] text-slate-700 leading-relaxed">{q.rubricGuide}</p>
                  </div>
                )}

              {/* Skill & Rubric Criteria */}
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-slate-500">
                  <span className="font-semibold text-slate-700">Miền &amp; Kỹ năng:</span>{' '}
                  {q.domain} &bull; {q.skill}
                </div>
                <div className="text-[11px] text-slate-500 italic truncate max-w-md">
                  <span className="font-semibold text-slate-700 not-italic">Đánh giá:</span>{' '}
                  {q.sampleAnswerCriteria}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Import Verification Wizard Modal */}
      <ItemBankImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onImportSuccess={fetchItemBank}
      />
    </div>
  );
}
