'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Users,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  QrCode,
  ArrowRight,
  Maximize2,
  ChevronDown,
  X,
} from 'lucide-react';

interface ExamRoom {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  roomMode: string;
  isActive: boolean;
  hasStarted?: boolean;
  startedAt?: string;
  createdAt: string;
  participantCount: number;
}

export default function EvaluatorLiveRoomPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalRoom, setQrModalRoom] = useState<ExamRoom | null>(null);

  // Form state for creating room
  const [isCreatingOpen, setIsCreatingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssessmentId, setNewAssessmentId] = useState('a0000000-0000-0000-0000-000000000001');
  const [newMode, setNewMode] = useState<'OPEN' | 'GROUP_ONLY'>('OPEN');
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRooms = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluator/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      } else {
        if (!silent) setRooms([]);
      }
    } catch {
      if (!silent) setRooms([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => fetchRooms(true), 3000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          assessmentId: newAssessmentId,
          roomMode: newMode,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsCreatingOpen(false);
        setNewTitle('');
        await fetchRooms();
        // Immediately navigate to fullscreen live control room
        if (created?.room?.id) {
          router.push(`/live/control?roomId=${created.room.id}`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Không thể tạo phòng thi.');
      }
    } catch {
      setError('Đã xảy ra lỗi kết nối khi tạo phòng thi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedCode(pin);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              KHẢO THÍ TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Lý Phòng Thi Trực Tiếp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Khởi tạo phiên thi, cấp mã PIN và mở màn hình điều phối toàn màn hình cho kỳ thi thực tế.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreatingOpen((prev) => !prev)}
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Mở phòng thi mới</span>
          </button>

          <button
            onClick={() => fetchRooms()}
            disabled={loading}
            className="p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-xs transition-colors disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {/* Inline Room Creation Form (No popup modal!) */}
      {isCreatingOpen && (
        <div className="p-5 rounded-md bg-white border border-sky-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Thiết Lập Phòng Thi Trực Tiếp Mới</span>
            </h2>
            <button
              onClick={() => setIsCreatingOpen(false)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Tên phòng thi / Phiên khảo thí:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đánh giá Năng lực Số Lớp Tin học K48"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Bộ đề khảo thí chuẩn hóa:
                </label>
                <select
                  value={newAssessmentId}
                  onChange={(e) => setNewAssessmentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                >
                  <option value="a0000000-0000-0000-0000-000000000001">
                    Đề Benchmark Khảo Thí Năng Lực Số Chuẩn Hóa (12 Câu)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Chế độ tham gia:</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setNewMode('OPEN')}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    newMode === 'OPEN'
                      ? 'bg-sky-50 border-sky-600 text-sky-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs">MỞ TỰ DO (OPEN)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bất kỳ ai có mã PIN đều có thể vào phòng.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewMode('GROUP_ONLY')}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    newMode === 'GROUP_ONLY'
                      ? 'bg-sky-50 border-sky-600 text-sky-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs">THEO NHÓM (GROUP)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Chỉ học viên thuộc danh sách được giao.
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingOpen(false)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {submitting ? 'Đang kích hoạt...' : 'Kích hoạt & Vào Màn Hình Live'}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Rooms Listing */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Phòng Thi Đang Mở ({rooms.length})
        </h2>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-md border border-slate-200 text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 text-sky-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
            Đang tải dữ liệu phòng thi...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-md border border-slate-200 space-y-3">
            <Radio className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Chưa có phòng thi nào đang mở</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bấm nút &ldquo;Mở phòng thi mới&rdquo; để nhận mã PIN 6 số và chuyển vào màn hình điều phối live.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {room.hasStarted ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                        ĐANG THI (IN PROGRESS)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        PHÒNG CHỜ (SẴN SÀNG)
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">Chế độ: {room.roomMode}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{room.title}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{room.assessmentTitle}</div>
                  </div>

                  {/* 6-Digit PIN Banner */}
                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                        MÃ PIN 6 SỐ
                      </span>
                      <span className="text-2xl font-extrabold text-sky-600 font-mono tracking-widest">
                        {room.roomCode.slice(0, 3)} {room.roomCode.slice(3)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(room.roomCode)}
                      className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      {copiedCode === room.roomCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Action: Direct Jump to Fullscreen Live Control Room */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/live/control?roomId=${room.id}`}
                    className="w-full py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>VÀO PHÒNG ĐIỀU PHỐI TOÀN MÀN HÌNH (LIVE CONTROL)</span>
                  </Link>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-2 font-mono">
                      <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span>{room.participantCount} thí sinh</span>
                      <span>&bull;</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span>{room.durationMinutes} phút</span>
                    </div>

                    <button
                      onClick={() => setQrModalRoom(room)}
                      className="text-xs text-slate-600 hover:text-sky-600 font-medium inline-flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Xem mã QR</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projection Modal if needed from dashboard */}
      {qrModalRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900">{qrModalRoom.title}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                typeof window !== 'undefined'
                  ? `${window.location.origin}/learner/live-pin?pin=${qrModalRoom.roomCode}`
                  : `https://nexa.edu.vn/learner/live-pin?pin=${qrModalRoom.roomCode}`
              )}`}
              alt="QR Code Phòng thi"
              width={200}
              height={200}
              className="rounded mx-auto border border-slate-200 p-2"
            />
            <div className="text-3xl font-extrabold text-sky-600 font-mono tracking-widest">
              {qrModalRoom.roomCode.slice(0, 3)} {qrModalRoom.roomCode.slice(3)}
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Link
                href={`/live/control?roomId=${qrModalRoom.id}`}
                className="px-4 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
              >
                Vào phòng điều phối
              </Link>
              <button
                onClick={() => setQrModalRoom(null)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
