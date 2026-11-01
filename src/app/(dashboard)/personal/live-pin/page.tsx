'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Radio,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Lock,
  FileText,
  Clock,
  Calendar,
  Check,
  User,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PreviewRoomData {
  id: string;
  roomCode: string;
  title: string;
  assessmentTitle: string;
  durationMinutes: number;
  scheduledStart?: string | null;
  proctorName?: string;
  roomMode: string;
  hasStarted: boolean;
}

function LivePinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPin = searchParams.get('pin') || '';

  const [pin, setPin] = useState(initialPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current user info
  const [userName, setUserName] = useState<string>('Thí sinh');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Preview room data when 6 digits are typed
  const [previewRoom, setPreviewRoom] = useState<PreviewRoomData | null>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  // 1. Fetch current profile
  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) setUserName(profile.full_name);
        if (profile?.avatar_url) setUserAvatar(profile.avatar_url);
      }
    }
    getProfile();
  }, []);

  // 2. Auto check PIN when 6 digits are reached
  const checkPinPreview = useCallback(async (pinCode: string) => {
    if (pinCode.length !== 6) {
      setPreviewRoom(null);
      return;
    }

    setFetchingPreview(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/status?pin=${pinCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room) {
          setPreviewRoom({
            id: data.room.id,
            roomCode: data.room.roomCode,
            title: data.room.title,
            assessmentTitle: data.room.assessmentTitle,
            durationMinutes: data.room.durationMinutes,
            scheduledStart: data.room.scheduledStart,
            roomMode: data.room.roomMode,
            hasStarted: data.room.hasStarted,
          });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setPreviewRoom(null);
        setError(err.error || 'Mã PIN không tồn tại hoặc phòng đã đóng');
      }
    } catch {
      setPreviewRoom(null);
    } finally {
      setFetchingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (pin.length === 6) {
      checkPinPreview(pin);
    } else {
      setPreviewRoom(null);
    }
  }, [pin, checkPinPreview]);

  // 3. Handle Join Room
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\s+/g, '');
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

      // If room already started, go directly to exam
      if (data.hasStarted) {
        router.push(
          `/personal/take/${data.assessmentId || 'asm-01'}?roomId=${data.roomId}&pin=${cleanPin}`
        );
      } else {
        // Go to Waiting Room
        router.push(
          `/live/waiting-room?pin=${cleanPin}&roomId=${data.roomId}&assessmentId=${data.assessmentId || 'asm-01'}`
        );
      }
    } catch {
      setError('Lỗi kết nối khi tham gia phòng thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* 1. Header (Screen 10) */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-1">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Phòng thi trực tiếp</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Tham gia phòng thi trực tiếp
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Nhập mã PIN do giám thị cung cấp để vào phòng chờ và tham gia bài thi.
        </p>

        {/* Current User Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-neutral-800 shadow-2xs mt-2">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatar} alt={userName} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span>
            Người tham gia: <strong>{userName}</strong>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* 2. PIN Input Box (Screen 10) */}
      <form onSubmit={handleJoin} className="space-y-4 max-w-lg mx-auto">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
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
              placeholder="Nhập mã PIN phòng thi (6 số)"
              className="w-full pl-12 pr-4 py-3 text-center text-xl sm:text-2xl font-bold tracking-widest text-neutral-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || pin.length !== 6}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang kết nối phòng thi...</span>
            </>
          ) : (
            <>
              <span>Vào phòng chờ ngay</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 3. Instructions & Assessment Preview (Screen 10) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Left: Hướng dẫn tham gia */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Hướng dẫn tham gia</span>
          </div>

          <div className="space-y-3 text-slate-600">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span>Nhập đúng mã PIN gồm 6 chữ số do giám khảo hoặc giáo viên cung cấp.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <span>Kiểm tra kỹ thông tin bài thi hiển thị tại ô xem trước bên cạnh.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span>Nhấn nút &ldquo;Vào phòng chờ ngay&rdquo; và bấm sẵn sàng để tham gia.</span>
            </div>
          </div>
        </div>

        {/* Right: Bài thi preview card */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
            <Radio className="w-4 h-4 text-blue-600" />
            <span>Thông tin bài thi</span>
          </div>

          {previewRoom ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 space-y-1">
                <span className="text-[10px] text-blue-700 uppercase font-bold">
                  BÀI THI XÁC NHẬN
                </span>
                <div className="font-bold text-neutral-900 text-sm">
                  {previewRoom.title}
                </div>
                <div className="text-[11px] text-slate-500">
                  {previewRoom.assessmentTitle}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thời lượng: <strong>{previewRoom.durationMinutes} phút</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hình thức: {previewRoom.roomMode === 'OPEN' ? 'Mở tự do' : 'Theo lớp'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <Clock className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-[11px]">
                Nhập đủ 6 số PIN để xem thông tin chi tiết bài thi trước khi vào phòng.
              </p>
            </div>
          )}

          {/* Quy định truy cập */}
          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Chỉ người được mời mới có thể vào phòng thi.</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Cần tuân thủ quy chế thi của người tổ chức.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LearnerLivePinPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Đang chuẩn bị...</div>}>
      <LivePinContent />
    </Suspense>
  );
}
