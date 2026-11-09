'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Radio, ArrowRight, KeyRound } from 'lucide-react';

interface QuickPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickPinModal({ isOpen, onClose }: QuickPinModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (cleanPin.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã PIN');
      return;
    }
    setError('');
    onClose();
    router.push(`/live/waiting-room?pin=${cleanPin}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-950 rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm max-w-sm w-full p-6 text-slate-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900">
              <KeyRound className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Vào phòng thi trực tiếp</h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">Nhập mã PIN 6 số do giám thị cung cấp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
              Mã PIN phòng thi (6 số)
            </label>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, ''));
                setError('');
              }}
              placeholder="Ví dụ: 309210"
              autoFocus
              className="w-full text-center text-xl font-bold tracking-[0.25em] text-neutral-900 dark:text-neutral-100 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 py-3 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-zinc-600 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm font-mono"
            />
            {error && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={pin.length < 6}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Vào thi ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickPinModal;
