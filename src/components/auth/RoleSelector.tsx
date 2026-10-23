'use client';

import { User, Award } from 'lucide-react';

export type SelectableRole = 'LEARNER' | 'EVALUATOR';

const OPTIONS: {
  value: SelectableRole;
  label: string;
  description: string;
  icon: typeof User;
}[] = [
  { value: 'LEARNER', label: 'Người học', description: 'Học & phát triển', icon: User },
  { value: 'EVALUATOR', label: 'Người đánh giá', description: 'Đánh giá / Khảo thí', icon: Award },
];

export function RoleSelector({
  value,
  onChange,
}: {
  value: SelectableRole;
  onChange: (role: SelectableRole) => void;
}) {
  return (
    <div>
      <span className="block text-xs font-semibold text-slate-700 mb-2">
        Vai trò tài khoản <span className="text-rose-600">*</span>
      </span>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between ${
                isActive
                  ? 'border-sky-600 bg-sky-50/50 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`}
                  strokeWidth={1.75}
                />
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{option.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{option.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
