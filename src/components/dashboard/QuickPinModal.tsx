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
    router.push(`/learner/live-pin?pin=${cleanPin}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-sm w-full p-6 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vào phòng thi nhanh</h3>
              <p className="text-[11px] text-slate-500">Nhập mã PIN 6 số do giảng viên cung cấp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
              placeholder="Ví dụ: 849201"
              autoFocus
              className="w-full text-center text-xl font-bold tracking-[0.25em] text-slate-900 bg-slate-50 rounded-xl border border-slate-200 py-3 focus:bg-white focus:border-sky-500 focus:outline-none transition-colors placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
            />
            {error && (
              <p className="text-[11px] text-rose-600 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={pin.length < 6}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
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
