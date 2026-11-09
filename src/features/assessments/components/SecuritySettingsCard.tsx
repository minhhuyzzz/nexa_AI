'use client';

import React from 'react';
import {
  Maximize2,
  ShieldAlert,
  Bell,
  BellOff,
  Eye,
  Shuffle,
  Layers,
  Flag,
  ArrowRightCircle,
  ShieldCheck,
} from 'lucide-react';
import { AssessmentSecuritySettings } from '../types/security.types';

interface SecuritySettingsCardProps {
  value: AssessmentSecuritySettings;
  onChange: (settings: AssessmentSecuritySettings) => void;
  disabled?: boolean;
  className?: string;
}

export function SecuritySettingsCard({
  value,
  onChange,
  disabled = false,
  className = '',
}: SecuritySettingsCardProps) {
  const handleToggle = (key: keyof AssessmentSecuritySettings) => {
    if (disabled) return;
    onChange({
      ...value,
      // Mặc định luôn kích hoạt các lớp bảo vệ cơ bản của hệ thống
      block_devtools: true,
      block_copy: true,
      [key]: !value[key],
    });
  };

  const handleChangeMaxViolations = (num: number) => {
    if (disabled) return;
    onChange({
      ...value,
      block_devtools: true,
      block_copy: true,
      max_violations: num,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Phần Giám sát phòng thi & Chống gian lận */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Giám sát phòng thi &amp; Chống gian lận
          </h4>
        </div>

        <div className="space-y-2.5">
          {/* Bắt buộc toàn màn hình */}
          <ToggleRow
            label="Bắt buộc toàn màn hình"
            description="Yêu cầu thí sinh mở toàn màn hình khi làm bài. Nếu thoát chế độ toàn màn hình sẽ tính là vi phạm."
            icon={<Maximize2 className="w-4 h-4" />}
            checked={value.fullscreen_lock}
            onChange={() => handleToggle('fullscreen_lock')}
            disabled={disabled}
          />

          {/* Giám sát chuyển tab */}
          <ToggleRow
            label="Giám sát chuyển tab"
            description="Phát hiện và ghi nhận khi thí sinh chuyển sang tab khác hoặc thu nhỏ cửa sổ bài thi."
            icon={<ShieldAlert className="w-4 h-4" />}
            checked={value.tab_switch_guard}
            onChange={() => handleToggle('tab_switch_guard')}
            disabled={disabled}
          />

          {/* Số lần rời tab tối đa cho phép */}
          {value.tab_switch_guard && (
            <div className="pl-4 pr-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                  Số lần rời màn hình tối đa cho phép
                </span>
                <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Vượt quá số lần này, hệ thống sẽ tự động gắn cờ vi phạm gửi về giám thị.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { label: '1 lần', val: 1 },
                  { label: '3 lần', val: 3 },
                  { label: '5 lần', val: 5 },
                  { label: 'Không giới hạn', val: 0 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleChangeMaxViolations(opt.val)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      value.max_violations === opt.val
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cảnh báo vi phạm trực tiếp */}
          <ToggleRow
            label="Cảnh báo vi phạm trực tiếp"
            description={
              value.active_warning
                ? 'Hiển thị thông báo nhắc nhở ngay trên màn hình khi thí sinh có hành vi rời tab hoặc mất tiêu điểm.'
                : 'Giám sát ngầm — âm thầm ghi nhận nhật ký vi phạm gửi về giám thị mà không làm gián đoạn bài làm.'
            }
            icon={value.active_warning ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            checked={value.active_warning}
            onChange={() => handleToggle('active_warning')}
            disabled={disabled}
          />

          {/* In chìm dấu bản quyền */}
          <ToggleRow
            label="In mờ thông tin thí sinh trên đề thi"
            description="Hiển thị mờ họ tên, email và thời gian thi chạy chéo toàn màn hình để chống chụp ảnh phát tán đề thi."
            icon={<Eye className="w-4 h-4" />}
            checked={value.dynamic_watermark}
            onChange={() => handleToggle('dynamic_watermark')}
            disabled={disabled}
          />
        </div>
      </div>

      {/* 2. Phần Cấu trúc đề & Trải nghiệm làm bài */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Cấu trúc đề &amp; Trải nghiệm làm bài
          </h4>
        </div>

        <div className="space-y-2.5">
          {/* Xáo trộn câu hỏi */}
          <ToggleRow
            label="Xáo trộn thứ tự câu hỏi"
            description="Mỗi thí sinh khi vào thi sẽ nhận danh sách câu hỏi với thứ tự ngẫu nhiên khác nhau."
            icon={<Shuffle className="w-4 h-4" />}
            checked={value.shuffle_questions}
            onChange={() => handleToggle('shuffle_questions')}
            disabled={disabled}
          />

          {/* Xáo trộn đáp án */}
          <ToggleRow
            label="Xáo trộn thứ tự đáp án"
            description="Đảo ngẫu nhiên vị trí các lựa chọn đáp án của từng câu hỏi để chống nhìn bài."
            icon={<Layers className="w-4 h-4" />}
            checked={value.shuffle_options}
            onChange={() => handleToggle('shuffle_options')}
            disabled={disabled}
          />

          {/* Cho phép gắn cờ xem lại */}
          <ToggleRow
            label="Cho phép gắn cờ câu hỏi xem lại"
            description="Cung cấp nút đánh dấu câu hỏi chưa chắc chắn để thí sinh quay lại kiểm tra trước khi nộp bài."
            icon={<Flag className="w-4 h-4" />}
            checked={value.review_flag_palette ?? true}
            onChange={() => handleToggle('review_flag_palette')}
            disabled={disabled}
          />
        </div>
      </div>

      {/* 3. Ghi chú bảo mật tự động nền tảng (Always-on) */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2.5 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Bảo mật tự động của hệ thống:</span> Hệ thống luôn mặc định chặn phím F12, chặn kiểm tra mã nguồn và vô hiệu hóa sao chép văn bản câu hỏi trong suốt thời gian làm bài để bảo vệ ngân hàng đề thi.
        </div>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function ToggleRow({
  label,
  description,
  icon,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div
      onClick={() => !disabled && onChange()}
      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none ${
        checked
          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60'
          : 'bg-white dark:bg-zinc-900/40 border-slate-200/70 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            checked
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold leading-tight ${
                checked
                  ? 'text-blue-900 dark:text-blue-200'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Switch Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        className={`w-10 h-5 rounded-full p-0.5 transition-colors relative shrink-0 mt-1 cursor-pointer ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
