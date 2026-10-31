'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  Award,
  ArrowRight,
  Search,
  Lock,
  ChevronDown,
  Filter,
  Check,
  Loader2,
  HelpCircle,
  Tag,
  Sparkles,
} from 'lucide-react';

interface AssessmentItem {
  id: string;
  title: string;
  description: string;
  domainName: string;
  domainCodes: string[];
  duration_minutes: number;
  passing_score: number;
  questionCount: number;
  type: string;
  types: string[];
  isVip?: boolean;
  accessTier?: 'FREE' | 'VIP';
}

const domainList = [
  { code: '01', label: 'Miền 01: Thông tin & Dữ liệu' },
  { code: '02', label: 'Miền 02: Giao tiếp & Cộng tác' },
  { code: '03', label: 'Miền 03: Sáng tạo Nội dung & AI' },
  { code: '04', label: 'Miền 04: An toàn & Bảo mật' },
  { code: '05', label: 'Miền 05: Giải quyết Vấn đề' },
];

const formatFilterOptions = [
  { id: 'ALL' as const, label: 'Tất cả dạng bài' },
  { id: 'MCQ' as const, label: 'Trắc nghiệm' },
  { id: 'SCENARIO' as const, label: 'Tình huống' },
  { id: 'DIGITAL_EVIDENCE' as const, label: 'Thực hành' },
];

const tierFilterOptions = [
  { id: 'ALL' as const, label: 'Tất cả phân hạng' },
  { id: 'FREE' as const, label: 'Miễn phí' },
  { id: 'VIP' as const, label: 'VIP' },
];

export default function LearnerAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [tierFilter, setTierFilter] = useState<'ALL' | 'FREE' | 'VIP'>('ALL');
  const [isTierMenuOpen, setIsTierMenuOpen] = useState(false);
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'MCQ' | 'SCENARIO' | 'DIGITAL_EVIDENCE'>('ALL');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [isDomainMenuOpen, setIsDomainMenuOpen] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assessments');
      if (res.ok) {
        const json = await res.json();
        const data = json.assessments || [];
        const mapped: AssessmentItem[] = data.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description || 'Bài khảo thí chuẩn hóa năng lực số theo khung DigComp 3.0.',
          domainName: a.domainName || 'Đa Miền Năng Lực Số',
          domainCodes: a.domainCodes || [],
          duration_minutes: a.duration_minutes || 30,
          passing_score: Number(a.passing_score) || 70,
          questionCount: a.questionCount || 0,
          type: a.typeLabel || 'Trắc nghiệm khách quan',
          types: a.types || [],
          isVip: Boolean(a.isVip || a.accessTier === 'VIP'),
          accessTier: a.accessTier || (a.isVip ? 'VIP' : 'FREE'),
        }));
        setAssessments(mapped);
      } else {
        setAssessments([]);
      }
    } catch (err) {
      console.error('Unexpected error loading assessments:', err);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const toggleDomain = (code: string) => {
    setSelectedDomains((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const clearDomains = () => {
    setSelectedDomains([]);
  };

  const selectAllDomains = () => {
    setSelectedDomains(domainList.map((d) => d.code));
  };

  const getDropdownButtonLabel = () => {
    if (selectedDomains.length === 0) return 'Tất cả 5 miền';
    if (selectedDomains.length === 1) {
      const found = domainList.find((d) => d.code === selectedDomains[0]);
      return found ? found.label : '1 miền đã chọn';
    }
    return `${selectedDomains.length} miền đã chọn`;
  };

  const filteredTests = assessments.filter((test) => {
    const matchesSearch =
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.domainName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFormat =
      formatFilter === 'ALL' ||
      test.types.includes(formatFilter);

    const matchesDomain =
      selectedDomains.length === 0 ||
      selectedDomains.some((d) => test.domainCodes.includes(d));

    const matchesTier =
      tierFilter === 'ALL' ||
      (tierFilter === 'VIP' ? Boolean(test.isVip || test.accessTier === 'VIP') : !test.isVip && test.accessTier !== 'VIP');

    return matchesSearch && matchesFormat && matchesDomain && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              KHẢO THÍ CHUẨN HÓA
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bài Khảo Thí Năng Lực Số
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Danh mục bài đánh giá đo lường năng lực số, nhận phân tích khoảng trống và chứng chỉ số.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/personal/live-pin"
            className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Nhập mã PIN phòng thi</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Filter Toolbar: Search + Domain Dropdown + Mode Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="Tìm theo tên bài kiểm tra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Multi-Select Domain Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDomainMenuOpen((prev) => !prev);
                setIsFormatMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-2 transition-colors ${
                selectedDomains.length > 0
                  ? 'border-sky-500 bg-sky-50/60 text-sky-800 font-semibold shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>{getDropdownButtonLabel()}</span>
              {selectedDomains.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {selectedDomains.length}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isDomainMenuOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={1.75}
              />
            </button>

            {isDomainMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDomainMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-md shadow-md py-1.5 z-30 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tích chọn miền
                    </span>
                    <button
                      type="button"
                      onClick={selectedDomains.length > 0 ? clearDomains : selectAllDomains}
                      className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                    >
                      {selectedDomains.length > 0 ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                    </button>
                  </div>

                  <div className="py-1">
                    {domainList.map((d) => {
                      const isChecked = selectedDomains.includes(d.code);
                      return (
                        <button
                          key={d.code}
                          type="button"
                          onClick={() => toggleDomain(d.code)}
                          className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                          <span
                            className={`truncate ${
                              isChecked ? 'font-semibold text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {d.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 pt-2 pb-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {selectedDomains.length === 0
                        ? 'Đang hiển thị tất cả'
                        : `Đã chọn ${selectedDomains.length}/5 miền`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDomainMenuOpen(false)}
                      className="px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mode Dropdown Menu */}
          {/* Format Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFormatMenuOpen((prev) => !prev);
                setIsDomainMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-2 transition-colors ${
                formatFilter !== 'ALL'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-800 font-semibold shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>
                {formatFilterOptions.find((m) => m.id === formatFilter)?.label || 'Tất cả dạng bài'}
              </span>
              {formatFilter !== 'ALL' && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isFormatMenuOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={1.75}
              />
            </button>

            {isFormatMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsFormatMenuOpen(false)}
                />
                <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-md shadow-md py-1.5 z-30 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Dạng bài
                    </span>
                    {formatFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormatFilter('ALL');
                          setIsFormatMenuOpen(false);
                        }}
                        className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                      >
                        Mặc định
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    {formatFilterOptions.map((item) => {
                      const isSelected = formatFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFormatFilter(item.id);
                            setIsFormatMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-slate-50/70 font-semibold text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                          <span className={isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tier (Free / VIP) Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsTierMenuOpen((prev) => !prev);
                setIsDomainMenuOpen(false);
                setIsFormatMenuOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-2 transition-colors ${
                tierFilter !== 'ALL'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-800 font-semibold shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>
                {tierFilterOptions.find((t) => t.id === tierFilter)?.label || 'Tất cả phân hạng'}
              </span>
              {tierFilter !== 'ALL' && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isTierMenuOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={1.75}
              />
            </button>

            {isTierMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsTierMenuOpen(false)}
                />
                <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-md shadow-md py-1.5 z-30 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Phân hạng
                    </span>
                    {tierFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setTierFilter('ALL');
                          setIsTierMenuOpen(false);
                        }}
                        className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                      >
                        Mặc định
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    {tierFilterOptions.map((opt) => {
                      const isSelected = tierFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setTierFilter(opt.id);
                            setIsTierMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-slate-50/70 font-semibold text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {opt.id === 'VIP' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                                VIP
                              </span>
                            )}
                            {opt.id === 'FREE' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                FREE
                              </span>
                            )}
                            <span className={isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                              {opt.label}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reset Filters button if any filter is active */}
          {(searchQuery || selectedDomains.length > 0 || formatFilter !== 'ALL' || tierFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDomains([]);
                setFormatFilter('ALL');
                setTierFilter('ALL');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-2 ml-1"
            >
              Đặt lại
            </button>
          )}
        </div>

        {/* Result Count on the Right */}
        <div className="text-xs text-slate-500 font-medium shrink-0">
          Hiển thị <span className="font-semibold text-slate-900 font-mono tabular-nums">{filteredTests.length}</span> bài khảo thí
        </div>
      </div>

      {/* Grid of Assessments */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
          <p className="text-xs">Đang tải danh mục bài khảo thí...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="p-12 text-center rounded-md border border-slate-200 bg-white">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {searchQuery ? 'Không tìm thấy bài khảo thí phù hợp' : 'Chưa có bài khảo thí nào'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery
              ? 'Hãy thử thay đổi từ khóa hoặc bộ lọc miền năng lực.'
              : 'Hiện chưa có bài thi nào được mở công khai.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTests.map((test) => (
            <Link
              key={test.id}
              href={`/personal/assessments/${test.id}`}
              className="aspect-square p-5 rounded-md bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs transition-all flex flex-col justify-between group text-xs"
            >
              <div>
                {/* 1:1 Aspect ratio square badge / icon header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 truncate max-w-[140px]">
                    {test.domainName}
                  </span>
                  {test.isVip || test.accessTier === 'VIP' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      VIP
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium font-mono bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                      FREE
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                  {test.title}
                </h2>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>
              </div>

              {/* Bottom Specs */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                <span className="font-mono">{test.questionCount} câu &bull; {test.duration_minutes}p</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Chi tiết &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
