'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Radio, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

function LivePinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPin = searchParams.get('pin') || '';

  const [pin, setPin] = useState(initialPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinWithPin = useCallback(
    async (pinToJoin: string) => {
      const cleanPin = pinToJoin.trim().replace(/\s+/g, '');
      if (cleanPin.length !== 6) {
        setError('Mã PIN phòng thi phải gồm đúng 6 chữ số');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: cleanPin }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Mã PIN phòng thi không hợp lệ hoặc không tồn tại');
          return;
        }

        // Late Joiner Check: If room has already started, bypass waiting room directly into the exam!
        if (data.hasStarted) {
          router.push(`/learner/take/${data.assessmentId || 'asm-01'}?roomId=${data.roomId}&pin=${cleanPin}`);
        } else {
          // Room is waiting for evaluator to start -> Route to Fullscreen Space Light Waiting Room
          router.push(
            `/live/waiting-room?pin=${cleanPin}&roomId=${data.roomId}&assessmentId=${data.assessmentId || 'asm-01'}`
          );
        }
      } catch {
        setError('Lỗi kết nối khi tham gia phòng thi. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (initialPin && initialPin.length === 6) {
      setPin(initialPin);
      joinWithPin(initialPin);
    }
  }, [initialPin, joinWithPin]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    joinWithPin(pin);
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mx-auto mb-3">
          <KeyRound className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Tham Gia Phòng Thi Trực Tiếp
        </h1>
        <p className="text-xs text-slate-500">
          Nhập mã PIN 6 số do chuyên gia khảo thí cung cấp để bắt đầu làm bài.
        </p>
      </div>

      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2 text-center uppercase tracking-wider">
              Mã PIN phòng thi (6 số)
            </label>
            <input
              type="text"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                if (error) setError(null);
              }}
              placeholder="000000"
              className="w-full py-3 text-center text-3xl font-extrabold tracking-[0.5em] text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums"
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                Đang xác thực mã PIN...
              </>
            ) : (
              <>
                Vào phòng thi ngay
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          <span>Phiên thi thời gian thực mã hóa &amp; giám sát bảo mật</span>
        </div>
      </div>
    </div>
  );
}

export default function LearnerLivePinPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Đang chuẩn bị cổng vào phòng thi...
        </div>
      }
    >
      <LivePinContent />
    </Suspense>
  );
}
