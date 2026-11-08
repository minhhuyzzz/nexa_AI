'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface DateRangeSelection {
  timeRange: string; // 'all' | 'yesterday' | 'last_7_days' | 'last_month' | 'last_quarter' | '2026' | '2025' | 'custom'
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  label: string;
}

interface NexaDateRangePickerProps {
  selectedTimeRange: string;
  selectedStartDate?: string;
  selectedEndDate?: string;
  onApplyRange: (range: DateRangeSelection) => void;
}

type PickerTab = 'presets' | 'day' | 'week' | 'month';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function NexaDateRangePicker({
  selectedTimeRange,
  selectedStartDate,
  selectedEndDate,
  onApplyRange,
}: NexaDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mặc định năm xem xét là 2026 (hoặc theo ngày hiện tại)
  const currentBaseDate = new Date();
  const [activeTab, setActiveTab] = useState<PickerTab>('presets');
  const [viewYear, setViewYear] = useState<number>(currentBaseDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(currentBaseDate.getMonth()); // 0-11

  // Temporary selection for 'day' tab
  const [tempStart, setTempStart] = useState<string | undefined>(selectedStartDate);
  const [tempEnd, setTempEnd] = useState<string | undefined>(selectedEndDate);

  // Hover state for 'week' tab
  const [hoveredWeekIndex, setHoveredWeekIndex] = useState<number | null>(null);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Sinh các mốc preset tự động
  const now = new Date();
  
  // Hôm qua
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const yesterdayStr = formatDate(yesterday);

  // 7 ngày gần nhất
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = formatDate(sevenDaysAgo);
  const todayStr = formatDate(now);

  // 30 ngày gần nhất
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoStr = formatDate(thirtyDaysAgo);

  // Xác định text hiển thị trên nút Trigger
  const getTriggerLabel = () => {
    if (selectedTimeRange === 'all') return 'Tất cả thời gian';
    if (selectedTimeRange === 'yesterday') return `Hôm qua (${yesterdayStr} ~ ${yesterdayStr})`;
    if (selectedTimeRange === 'last_7_days') return `7 ngày gần nhất (${sevenDaysAgoStr} ~ ${todayStr})`;
    if (selectedTimeRange === 'last_month') return `30 ngày gần nhất (${thirtyDaysAgoStr} ~ ${todayStr})`;
    if (selectedTimeRange === '2026') return 'Năm 2026';
    if (selectedTimeRange === '2025') return 'Năm 2025';
    if (selectedStartDate && selectedEndDate) {
      return `${selectedStartDate} ~ ${selectedEndDate}`;
    }
    if (selectedStartDate) return `Từ ${selectedStartDate}`;
    if (selectedEndDate) return `Đến ${selectedEndDate}`;
    return 'Khoảng thời gian';
  };

  const handleSelectPreset = (key: string, start?: string, end?: string, label?: string) => {
    onApplyRange({
      timeRange: key,
      startDate: start,
      endDate: end,
      label: label || key,
    });
    setIsOpen(false);
  };

  // Chọn 1 tháng cụ thể (T1..T12)
  const handleSelectMonth = (monthIndex: number) => {
    const firstDay = new Date(viewYear, monthIndex, 1);
    const lastDay = new Date(viewYear, monthIndex + 1, 0);
    const startStr = formatDate(firstDay);
    const endStr = formatDate(lastDay);
    const label = `Tháng ${monthIndex + 1}/${viewYear} (${startStr} ~ ${endStr})`;

    onApplyRange({
      timeRange: 'custom',
      startDate: startStr,
      endDate: endStr,
      label,
    });
    setIsOpen(false);
  };

  // Lấy ma trận các tuần trong tháng
  const getWeeksInMonth = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Thứ trong tuần của ngày 1 (Chuyển Chủ nhật từ 0 thành 7, Thứ 2 là 1)
    let startDayOfWeek = firstDayOfMonth.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7; // CN = 7

    // Lùi về ngày Thứ 2 đầu tiên
    const currentIter = new Date(firstDayOfMonth);
    currentIter.setDate(currentIter.getDate() - (startDayOfWeek - 1));

    const weeks: Array<Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }>> = [];

    while (currentIter <= lastDayOfMonth || weeks.length < 5) {
      const week: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }> = [];
      for (let i = 0; i < 7; i++) {
        week.push({
          date: new Date(currentIter),
          dateStr: formatDate(currentIter),
          isCurrentMonth: currentIter.getMonth() === month,
        });
        currentIter.setDate(currentIter.getDate() + 1);
      }
      weeks.push(week);
      if (currentIter > lastDayOfMonth && weeks.length >= 4) {
        break;
      }
    }
    return weeks;
  };

  const monthWeeks = getWeeksInMonth(viewYear, viewMonth);

  // Chọn 1 tuần (Thứ 2 đến Chủ nhật)
  const handleSelectWeek = (week: Array<{ date: Date; dateStr: string }>) => {
    const startStr = week[0].dateStr;
    const endStr = week[6].dateStr;
    const label = `Tuần (${startStr} ~ ${endStr})`;

    onApplyRange({
      timeRange: 'custom',
      startDate: startStr,
      endDate: endStr,
      label,
    });
    setIsOpen(false);
  };

  // Chọn ngày tự do
  const handleSelectDay = (dateStr: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(undefined);
    } else {
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const handleApplyCustomDays = () => {
    if (!tempStart) return;
    const end = tempEnd || tempStart;
    onApplyRange({
      timeRange: 'custom',
      startDate: tempStart,
      endDate: end,
      label: `${tempStart} ~ ${end}`,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* 1. Nút kích hoạt Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs text-xs hover:border-slate-300 dark:hover:border-zinc-700 transition cursor-pointer"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
        <span className="text-neutral-800 dark:text-zinc-200 font-medium truncate max-w-[280px]">
          {getTriggerLabel()}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {/* 2. Popover 2 cột chuẩn xác theo ảnh mẫu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-auto top-full mt-1.5 z-50 flex flex-col sm:flex-row rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* CỘT TRÁI: DANH SÁCH MỤC LỌC NHANH VÀ CHẾ ĐỘ (w-48) */}
          <div className="w-48 border-r border-slate-100 dark:border-zinc-800 p-2 space-y-0.5 text-xs text-neutral-700 dark:text-zinc-300 bg-slate-50/50 dark:bg-zinc-950/20">
            {/* Presets nhanh */}
            <button
              type="button"
              onClick={() => handleSelectPreset('yesterday', yesterdayStr, yesterdayStr, 'Hôm qua')}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
                selectedTimeRange === 'yesterday'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              Hôm qua
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('last_7_days', sevenDaysAgoStr, todayStr, '7 ngày gần nhất')}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
                selectedTimeRange === 'last_7_days'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              7 ngày gần nhất
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('last_month', thirtyDaysAgoStr, todayStr, '30 ngày gần nhất')}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
                selectedTimeRange === 'last_month'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              30 ngày gần nhất
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('all', undefined, undefined, 'Tất cả thời gian')}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
                selectedTimeRange === 'all'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              Tất cả thời gian
            </button>

            <div className="my-1.5" />

            {/* Các chế độ chọn theo chu kỳ */}
            <button
              type="button"
              onClick={() => setActiveTab('day')}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium flex items-center justify-between ${
                activeTab === 'day'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Ngày</span>
              {activeTab === 'day' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('week')}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium flex items-center justify-between ${
                activeTab === 'week'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Tuần</span>
              {activeTab === 'week' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium flex items-center justify-between ${
                activeTab === 'month'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Tháng</span>
              {activeTab === 'month' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          </div>

          {/* CỘT PHẢI: LƯỚI TƯƠNG TÁC LỊCH / THÁNG (w-72) */}
          <div className="w-72 p-4 flex flex-col justify-between">
            {/* 1. CHẾ ĐỘ CHỌN THÁNG (Theo Ảnh 2 của User) */}
            {activeTab === 'month' && (
              <div className="space-y-4">
                {/* Header chuyển năm: << 2026 >> */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setViewYear(viewYear - 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    title="Năm trước"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-mono">
                    {viewYear}
                  </span>

                  <button
                    type="button"
                    onClick={() => setViewYear(viewYear + 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    title="Năm sau"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Lưới 12 ô tháng T1..T12 */}
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthLabel = `T${i + 1}`;
                    const isSelected =
                      selectedStartDate &&
                      selectedStartDate.startsWith(`${viewYear}-${String(i + 1).padStart(2, '0')}`);

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectMonth(i)}
                        className={`py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-neutral-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {monthLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. CHẾ ĐỘ CHỌN TUẦN (Theo Ảnh 3 của User) */}
            {activeTab === 'week' && (
              <div className="space-y-3">
                {/* Header chuyển tháng: < Tháng MM YYYY > */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (viewMonth === 0) {
                        setViewMonth(11);
                        setViewYear(viewYear - 1);
                      } else {
                        setViewMonth(viewMonth - 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                    Tháng {viewMonth + 1} {viewYear}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (viewMonth === 11) {
                        setViewMonth(0);
                        setViewYear(viewYear + 1);
                      } else {
                        setViewMonth(viewMonth + 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Thứ trong tuần */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span>CN</span>
                </div>

                {/* Ma trận các tuần (Highlight nguyên hàng tuần khi chọn) */}
                <div className="space-y-1">
                  {monthWeeks.map((week, wIdx) => {
                    const isHovered = hoveredWeekIndex === wIdx;
                    const isWeekSelected =
                      selectedStartDate &&
                      selectedEndDate &&
                      week[0].dateStr === selectedStartDate &&
                      week[6].dateStr === selectedEndDate;

                    return (
                      <div
                        key={wIdx}
                        onMouseEnter={() => setHoveredWeekIndex(wIdx)}
                        onMouseLeave={() => setHoveredWeekIndex(null)}
                        onClick={() => handleSelectWeek(week)}
                        className={`grid grid-cols-7 py-1 px-0.5 rounded-lg transition cursor-pointer text-center text-[11px] ${
                          isWeekSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : isHovered
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300'
                            : ''
                        }`}
                      >
                        {week.map((dayItem, dIdx) => (
                          <span
                            key={dIdx}
                            className={`${
                              isWeekSelected
                                ? 'text-white'
                                : dayItem.isCurrentMonth
                                ? 'text-neutral-800 dark:text-zinc-200'
                                : 'text-slate-300 dark:text-neutral-600'
                            }`}
                          >
                            {dayItem.date.getDate()}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CHẾ ĐỘ CHỌN NGÀY TÙY CHỌN (Day Range) */}
            {(activeTab === 'day' || activeTab === 'presets') && (
              <div className="space-y-3">
                {/* Header chuyển tháng */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (viewMonth === 0) {
                        setViewMonth(11);
                        setViewYear(viewYear - 1);
                      } else {
                        setViewMonth(viewMonth - 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                    Tháng {viewMonth + 1} {viewYear}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (viewMonth === 11) {
                        setViewMonth(0);
                        setViewYear(viewYear + 1);
                      } else {
                        setViewMonth(viewMonth + 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Thứ trong tuần */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span>CN</span>
                </div>

                {/* Lưới ngày */}
                <div className="space-y-1">
                  {monthWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-cols-7 gap-1 text-center text-xs">
                      {week.map((dayItem, dIdx) => {
                        const isStart = tempStart === dayItem.dateStr;
                        const isEnd = tempEnd === dayItem.dateStr;
                        const isInRange =
                          tempStart && tempEnd && dayItem.dateStr >= tempStart && dayItem.dateStr <= tempEnd;

                        return (
                          <button
                            key={dIdx}
                            type="button"
                            onClick={() => handleSelectDay(dayItem.dateStr)}
                            className={`h-7 w-7 rounded-lg mx-auto flex items-center justify-center font-mono text-[11px] transition cursor-pointer ${
                              isStart || isEnd
                                ? 'bg-blue-600 text-white font-bold'
                                : isInRange
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : dayItem.isCurrentMonth
                                ? 'text-neutral-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                : 'text-slate-300 dark:text-neutral-600'
                            }`}
                          >
                            {dayItem.date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Nút Áp dụng khoảng ngày tự do */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono truncate">
                    {tempStart ? `${tempStart} ~ ${tempEnd || '...'}` : 'Chọn ngày'}
                  </div>
                  <button
                    type="button"
                    disabled={!tempStart}
                    onClick={handleApplyCustomDays}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition cursor-pointer disabled:opacity-40"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
