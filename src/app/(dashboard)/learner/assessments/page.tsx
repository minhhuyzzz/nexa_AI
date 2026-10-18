'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  Award,
  ArrowRight,
  Search,
  Lock,
  PlusCircle,
  ChevronDown,
  Filter,
  Check,
} from 'lucide-react';
import { mockAssessments } from '@/data/mock-assessments';

const domainList = [
  { code: 'D1', label: 'D1: Thông tin & Dữ liệu' },
  { code: 'D2', label: 'D2: Giao tiếp & Hợp tác' },
  { code: 'D3', label: 'D3: Sáng tạo Nội dung' },
  { code: 'D4', label: 'D4: An toàn & Bảo mật' },
  { code: 'D5', label: 'D5: Giải quyết Vấn đề' },
];

export default function LearnerAssessmentsPage() {
  const [filterMode, setFilterMode] = useState<'ALL' | 'FREE' | 'PRO'>('ALL');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [isDomainMenuOpen, setIsDomainMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredTests = mockAssessments.filter((test) => {
    const matchesSearch =
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.domainName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilterMode =
      filterMode === 'ALL' ||
      (filterMode === 'FREE' && !test.isPro) ||
      (filterMode === 'PRO' && test.isPro);
    const matchesDomain =
      selectedDomains.length === 0 ||
      selectedDomains.includes(test.domainCode) ||
      test.domainCode === 'ALL';

    return matchesSearch && matchesFilterMode && matchesDomain;
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
            href="/learner/contribute"
            className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
            title="Gửi bài thi hoặc tình huống thực tế cho Admin xét duyệt"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Góp đề thi cộng đồng</span>
          </Link>

          <Link
            href="/learner/live-pin"
            className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Nhập mã PIN phòng thi</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Filter Toolbar: Search + Multi-Select Domain Dropdown on Left, Mode Tabs on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
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
              onClick={() => setIsDomainMenuOpen(!isDomainMenuOpen)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-2 transition-colors ${
                selectedDomains.length > 0
                  ? 'border-sky-500 bg-sky-50/60 text-sky-800 font-semibold shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
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
              />
            </button>

            {isDomainMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDomainMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-md shadow-lg py-1.5 z-30 animate-in fade-in-50 duration-100">
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
        </div>

        {/* Free / Pro Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'Tất cả bài' },
            { id: 'FREE', label: 'Miễn phí' },
            { id: 'PRO', label: 'Chỉ Pro' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as typeof filterMode)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Assessments - Standardized clean cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTests.map((test) => (
          <Link
            key={test.id}
            href={`/learner/assessments/${test.id}`}
            className="p-5 rounded-md bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Card Header: Domain Tag & Clean Lock Icon (No Pro text) */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/60">
                  {test.domainName}
                </span>

                {test.isPro && (
                  <div
                    className="relative group/lock"
                    title="Yêu cầu tài khoản Pro để mở khóa bài thi này"
                  >
                    <div className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                      <Lock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="opacity-0 pointer-events-none group-hover/lock:opacity-100 transition-opacity absolute right-0 top-full mt-1 z-20 w-52 p-2 rounded bg-slate-900 text-white text-[11px] leading-tight shadow-md">
                      Yêu cầu tài khoản Pro để mở khóa bài thi này
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-sm font-bold text-slate-900 mb-3 leading-snug group-hover:text-sky-600 transition-colors">
                {test.title}
              </h2>

              {/* Clear, readable metadata (Duration, Passing score, Type) - Non-faded */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-800 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                  <span>{test.duration_minutes} phút</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Award className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                  <span>Chuẩn đạt: {test.passing_score}%</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <FileText className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                  <span>{test.questionCount} câu hỏi ({test.type})</span>
                </div>
              </div>
            </div>

            {/* Clean Action Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
              <span className="font-semibold text-sky-600 group-hover:text-sky-700 inline-flex items-center gap-1">
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md">
          Không tìm thấy bài khảo thí nào phù hợp với bộ lọc đã chọn.
        </div>
      )}
    </div>
  );
}
