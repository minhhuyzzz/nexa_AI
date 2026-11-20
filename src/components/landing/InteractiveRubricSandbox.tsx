'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Sliders,
  Compass,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

interface CriterionLevel {
  level: number;
  label: string;
  score: number;
  desc: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  levels: CriterionLevel[];
}

const RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    id: 'crit-1',
    name: '1. Nhận diện rủi ro & an toàn thông tin',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Khởi đầu', score: 3, desc: 'Chưa phát hiện được dấu hiệu lừa đảo qua liên kết giả mạo.' },
      { level: 2, label: 'Cơ bản', score: 6, desc: 'Nhận biết được địa chỉ bất thường nhưng chưa kiểm tra tên miền gốc.' },
      { level: 3, label: 'Thành thạo', score: 9, desc: 'Xác định đúng hình thức giả mạo và phân tích được nguy cơ rò rỉ dữ liệu.' },
      { level: 4, label: 'Xuất sắc', score: 10, desc: 'Đánh giá toàn diện nguy cơ mã độc và biện pháp bảo vệ tài khoản.' },
    ],
  },
  {
    id: 'crit-2',
    name: '2. Phương án khắc phục & bảo mật tài khoản',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Khởi đầu', score: 2, desc: 'Chưa biết cách đổi mật khẩu hoặc kiểm tra phiên đăng nhập.' },
      { level: 2, label: 'Cơ bản', score: 5, desc: 'Đổi mật khẩu nhưng chưa kích hoạt xác thực hai yếu tố (2FA).' },
      { level: 3, label: 'Thành thạo', score: 8, desc: 'Kích hoạt 2FA và thu hồi các phiên đăng nhập bất thường.' },
      { level: 4, label: 'Xuất sắc', score: 10, desc: 'Quy trình bảo vệ đa lớp: đổi mật khẩu, kích hoạt 2FA và sao lưu an toàn.' },
    ],
  },
];

export function InteractiveRubricSandbox() {
  const [activeTab, setActiveTab] = useState<'rubric' | 'diagnostic'>('rubric');
  const [selectedLevels, setSelectedLevels] = useState<Record<string, number>>({
    'crit-1': 3,
    'crit-2': 3,
  });

  const [selectedDomainIndex, setSelectedDomainIndex] = useState(2); // D3: Sáng tạo số

  const handleSelectLevel = (critId: string, level: number) => {
    setSelectedLevels((prev) => ({ ...prev, [critId]: level }));
  };

  const totalScore = Object.entries(selectedLevels).reduce((sum, [critId, lvl]) => {
    const crit = RUBRIC_CRITERIA.find((c) => c.id === critId);
    const item = crit?.levels.find((l) => l.level === lvl);
    return sum + (item?.score || 0);
  }, 0);

  const percentage = Math.round((totalScore / 20) * 100);

  return (
    <section className="py-20 sm:py-24 bg-white dark:bg-black transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3 ring-1 ring-blue-200/60 dark:ring-blue-800/40">
            <Sliders className="w-3.5 h-3.5" />
            <span>Trải Nghiệm Trực Quan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Trải Nghiệm Bàn Chấm Rubric & Chẩn Đoán AI
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
            Trực tiếp thử nghiệm cơ chế chấm điểm minh bạch theo tiêu chí và cách hệ thống phát hiện khoảng trống kỹ năng.
          </p>

          {/* Switcher */}
          <div className="mt-8 inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('rubric')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'rubric'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200/60 dark:ring-zinc-700/60'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Bàn chấm Rubric (Khảo thí viên)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diagnostic')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'diagnostic'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200/60 dark:ring-zinc-700/60'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Hồ sơ năng lực & Lộ trình (Học viên)
            </button>
          </div>
        </div>

        {/* Sandbox Content Container */}
        <div className="rounded-3xl bg-slate-50/70 dark:bg-zinc-900/50 p-6 sm:p-10 ring-1 ring-slate-200/70 dark:ring-zinc-800/80 transition-all relative overflow-hidden">
          {/* Architectural Crosshair Accent */}
          <div className="absolute top-4 right-4 text-slate-300 dark:text-zinc-700 font-mono text-xs select-none">
            + +
          </div>
          <div className="absolute bottom-4 left-4 text-slate-300 dark:text-zinc-700 font-mono text-xs select-none">
            + +
          </div>

          {activeTab === 'rubric' ? (
            /* Tab 1: Rubric Grading Sandbox */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (7 cols): Rubric Criteria Selection */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                    <FileCheck className="w-4 h-4" />
                    <span>Bài làm mẫu: Xử lý sự cố an toàn dữ liệu</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Bấm chọn mức độ hoàn thành để xem điểm và nhận xét
                  </h3>
                </div>

                {RUBRIC_CRITERIA.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="p-5 rounded-2xl bg-white dark:bg-black/60 ring-1 ring-slate-200/60 dark:ring-zinc-800/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {criterion.name}
                      </span>
                      <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60">
                        {criterion.levels.find((l) => l.level === selectedLevels[criterion.id])?.score} / {criterion.maxScore} điểm
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {criterion.levels.map((lvl) => {
                        const isSelected = selectedLevels[criterion.id] === lvl.level;
                        return (
                          <button
                            key={lvl.level}
                            type="button"
                            onClick={() => handleSelectLevel(criterion.id, lvl.level)}
                            className={`p-2.5 rounded-xl text-left transition-all text-xs flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600 dark:ring-blue-400'
                                : 'bg-slate-50 dark:bg-zinc-900/80 text-neutral-700 dark:text-neutral-300 ring-1 ring-slate-200/50 dark:ring-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="font-semibold">{lvl.label}</span>
                            <span className={`text-[11px] font-mono mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              {lvl.score} điểm
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">Tiêu chí: </span>
                      {criterion.levels.find((l) => l.level === selectedLevels[criterion.id])?.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column (5 cols): AI Score Summary & Approval */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-6 rounded-2xl bg-white dark:bg-black/60 ring-1 ring-slate-200/60 dark:ring-zinc-800/60 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                      Tổng hợp kết quả
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Bản gợi ý từ AI</span>
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                      {totalScore}
                    </span>
                    <span className="text-sm font-mono text-slate-400">/ 20 điểm</span>
                    <span className="text-sm font-semibold font-mono text-blue-600 dark:text-blue-400 ml-auto">
                      ({percentage}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-200/60 dark:ring-blue-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Gợi ý nhận xét sư phạm:</span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                      {percentage >= 80
                        ? 'Thí sinh thể hiện kỹ năng an toàn thông tin vững vàng. Đã phân tích đúng dấu hiệu lừa đảo và kích hoạt phương án bảo mật kịp thời.'
                        : percentage >= 50
                        ? 'Thí sinh nắm được kiến thức an toàn cơ bản. Cần bổ sung thực hành thu hồi phiên đăng nhập và kích hoạt xác thực 2 bước.'
                        : 'Thí sinh cần hoàn thành chuyên đề luyện tập "Tự bảo vệ danh tính & phòng ngừa lừa đảo mạng" để củng cố kỹ năng.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-neutral-400">
                      Quyền duyệt điểm:
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Khảo thí viên (Assessor)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Diagnostic & Roadmap Sandbox */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column (6 cols): 5 Domains Selector */}
              <div className="lg:col-span-6 space-y-4">
                <div className="mb-4">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                    Hồ sơ năng lực cá nhân
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Bấm vào từng miền để xem khoảng trống kỹ năng & bài học đề xuất
                  </h3>
                </div>

                {[
                  { id: 'd1', name: 'Thông tin & Dữ liệu', score: 82, gap: 'Cần nâng cao kỹ năng kiểm chứng nguồn dữ liệu số' },
                  { id: 'd2', name: 'Giao tiếp & Hợp tác', score: 78, gap: 'Cần rèn luyện chia sẻ tài nguyên an toàn' },
                  { id: 'd3', name: 'Sáng tạo Nội dung số', score: 55, gap: 'Khoảng trống: Xử lý tệp đa phương tiện & bản quyền số' },
                  { id: 'd4', name: 'An toàn & Bảo mật', score: 88, gap: 'Đạt chuẩn: Kỹ năng bảo vệ danh tính cá nhân tốt' },
                  { id: 'd5', name: 'Giải quyết Vấn đề', score: 64, gap: 'Cần bồi dưỡng: Ứng dụng công cụ số tối ưu công việc' },
                ].map((dom, index) => {
                  const isSelected = selectedDomainIndex === index;
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => setSelectedDomainIndex(index)}
                      className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-white dark:bg-black/80 ring-2 ring-blue-600 dark:ring-blue-400 shadow-xs'
                          : 'bg-white/60 dark:bg-black/40 ring-1 ring-slate-200/60 dark:ring-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {dom.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                          {dom.gap}
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                            dom.score >= 70
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {dom.score}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column (6 cols): Targeted Micro-course recommendation */}
              <div className="lg:col-span-6 space-y-5">
                <div className="p-6 rounded-2xl bg-white dark:bg-black/60 ring-1 ring-slate-200/60 dark:ring-zinc-800/60 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <Compass className="w-4 h-4" />
                    <span>Lộ trình bồi dưỡng đề xuất</span>
                  </div>

                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedDomainIndex === 2
                      ? 'Chuyên đề: Quản lý bản quyền & xử lý đa phương tiện'
                      : selectedDomainIndex === 4
                      ? 'Chuyên đề: Tối ưu hóa tác vụ văn phòng bằng công cụ số'
                      : 'Chuyên đề bồi dưỡng năng lực số'}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
                    {selectedDomainIndex === 2
                      ? 'Hệ thống gợi ý bài thực hành ngắn 10 phút tập trung vào kỹ năng cấp phép nội dung số và chuẩn hóa tệp tài liệu số.'
                      : 'Lộ trình gợi ý đúng nội dung cần bổ khuyết, giúp tiết kiệm thời gian và có thể làm bài đánh giá lại ngay khi hoàn tất.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80">
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400">Thời lượng</div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                        15 phút thực hành
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80">
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400">Đánh giá lại</div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                        Tự động cập nhật
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <span>Cập nhật vào Hồ sơ năng lực khi hoàn thành</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
