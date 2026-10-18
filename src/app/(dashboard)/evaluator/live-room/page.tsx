'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  ExternalLink,
  ChevronRight,
  Sparkles,
  QrCode,
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
  createdAt: string;
  participantCount: number;
}

export default function EvaluatorLiveRoomPage() {
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalRoom, setQrModalRoom] = useState<ExamRoom | null>(null);

  // New room modal / form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssessmentId, setNewAssessmentId] = useState('a0000000-0000-0000-0000-000000000001');
  const [newMode, setNewMode] = useState<'OPEN' | 'GROUP_ONLY'>('OPEN');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mockFallbackRooms: ExamRoom[] = [
    {
      id: 'room-01',
      roomCode: '849201',
      title: 'Khảo sát Năng lực Số Sinh viên K48 - ĐHQG',
      assessmentId: 'asm-01',
      assessmentTitle: 'Đánh Giá Năng Lực Số Chuẩn Quốc Gia',
      durationMinutes: 45,
      roomMode: 'OPEN',
      isActive: true,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      participantCount: 38,
    },
    {
      id: 'room-02',
      roomCode: '623190',
      title: 'Thực hành Prompt Engineering & Tự động hoá',
      assessmentId: 'asm-02',
      assessmentTitle: 'Kỹ Năng Làm Việc Với Trí Tuệ Nhân Tạo',
      durationMinutes: 60,
      roomMode: 'GROUP_ONLY',
      isActive: true,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      participantCount: 26,
    },
    {
      id: 'room-03',
      roomCode: '190452',
      title: 'Kiểm tra Chuyên đề An toàn Thông tin Số',
      assessmentId: 'asm-03',
      assessmentTitle: 'Bảo Mật 2 Lớp & Phòng Chống Lừa Đảo',
      durationMinutes: 30,
      roomMode: 'OPEN',
      isActive: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      participantCount: 45,
    },
  ];

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluator/rooms');
      if (res.ok) {
        const data = await res.json();
        const list = data.rooms || [];
        setRooms(list.length > 0 ? list : mockFallbackRooms);
      } else {
        setRooms(mockFallbackRooms);
      }
    } catch {
      setRooms(mockFallbackRooms);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
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
        setShowCreateModal(false);
        setNewTitle('');
        await fetchRooms();
      } else {
        // Prototype simulation
        const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
        const newRoom: ExamRoom = {
          id: `room-${Date.now()}`,
          roomCode: generatedPin,
          title: newTitle,
          assessmentId: newAssessmentId,
          assessmentTitle: 'Đánh Giá Năng Lực Số Chuẩn Quốc Gia',
          durationMinutes: 45,
          roomMode: newMode,
          isActive: true,
          createdAt: new Date().toISOString(),
          participantCount: 0,
        };
        setRooms((prev) => [newRoom, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
      }
    } catch {
      // Prototype fallback
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const newRoom: ExamRoom = {
        id: `room-${Date.now()}`,
        roomCode: generatedPin,
        title: newTitle,
        assessmentId: newAssessmentId,
        assessmentTitle: 'Đánh Giá Năng Lực Số Chuẩn Quốc Gia',
        durationMinutes: 45,
        roomMode: newMode,
        isActive: true,
        createdAt: new Date().toISOString(),
        participantCount: 0,
      };
      setRooms((prev) => [newRoom, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (pin: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/learner/live-pin?pin=${pin}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(pin);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              PHÒNG THI TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Phòng Thi Trực Tiếp &amp; Mã PIN 6 Số
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Khởi tạo phiên thi thời gian thực, cấp phát mã PIN 6 số cho học viên tham gia đồng thời và giám sát tiến trình làm bài.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            Mở phòng thi mới
          </button>

          <button
            onClick={fetchRooms}
            disabled={loading}
            className="p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-xs transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                Thiết Lập Phòng Thi Trực Tiếp Mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Tên phòng thi / Phiên khảo thí:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khảo thí Năng lực Số Lớp Tin học K48"
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
                    Đề Benchmark Khảo Thí Năng Lực Số Chuẩn Hóa DigComp 2.2 (12 Câu)
                  </option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Chế độ tham gia:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMode('OPEN')}
                    className={`p-3 rounded border text-left transition-colors ${
                      newMode === 'OPEN'
                        ? 'bg-sky-50 border-sky-600 text-sky-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-xs">MỞ TỰ DO (OPEN)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Bất kỳ ai có mã PIN 6 số đều có thể vào thi.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMode('GROUP_ONLY')}
                    className={`p-3 rounded border text-left transition-colors ${
                      newMode === 'GROUP_ONLY'
                        ? 'bg-sky-50 border-sky-600 text-sky-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-xs">THEO NHÓM (GROUP)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Chỉ học viên thuộc danh sách lớp phụ trách.
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {creating ? 'Đang tạo phòng...' : 'Kích hoạt phòng thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rooms List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Phòng Thi Đang Mở ({rooms.length})
        </h2>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-md border border-slate-200 text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 text-sky-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
            Đang tải dữ liệu phòng thi trực tiếp...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-md border border-slate-200 space-y-3">
            <Radio className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Chưa có phòng thi nào đang mở</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bấm nút &ldquo;Mở phòng thi mới&rdquo; để nhận mã PIN 6 số và bắt đầu buổi khảo thí trực tuyến.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      PHÒNG ĐANG HOẠT ĐỘNG
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Chế độ: {room.roomMode}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{room.title}</h3>
                  <div className="text-xs text-slate-500 mb-4">{room.assessmentTitle}</div>

                  {/* 6-Digit PIN Prominent Display (JetBrains Mono) */}
                  <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-center space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-widest block">
                      MÃ PIN 6 SỐ THAM GIA
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold tracking-widest text-sky-600 tabular-nums">
                      {room.roomCode.slice(0, 3)} {room.roomCode.slice(3)}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Học viên truy cập /learner/live-pin và nhập mã trên
                    </span>
                  </div>
                </div>

                {/* Footer details & copy button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      {room.participantCount} thí sinh
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      {room.durationMinutes} phút
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQrModalRoom(room)}
                      className="px-3 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      title="Mở màn hình chiếu mã QR cho sinh viên quét"
                    >
                      <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Chiếu QR
                    </button>

                    <button
                      onClick={() => handleCopyLink(room.roomCode)}
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      {copiedCode === room.roomCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                          <span className="text-emerald-700 font-semibold">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                          Sao chép PIN
                        </>
                      )}
                    </button>

                    <Link
                      href="/evaluator/grading"
                      className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-xs"
                    >
                      Bàn chấm
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Classroom Projection Modal */}
      {qrModalRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-lg w-full text-center shadow-2xl space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>PHÒNG THI ĐANG MỞ • {qrModalRoom.participantCount} THÍ SINH ĐÃ VÀO</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2">
                {qrModalRoom.title}
              </h2>
              <p className="text-xs text-slate-500">
                {qrModalRoom.assessmentTitle} ({qrModalRoom.durationMinutes} phút)
              </p>
            </div>

            {/* QR Code Display */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                  `https://nexa.edu.vn/learner/live-pin?code=${qrModalRoom.roomCode}`
                )}`}
                alt="QR Code Phòng thi"
                width={240}
                height={240}
                className="rounded-lg mx-auto"
              />
            </div>

            {/* Large PIN */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                HOẶC NHẬP MÃ PIN 6 SỐ
              </div>
              <div className="text-4xl font-extrabold tracking-widest text-sky-600">
                {qrModalRoom.roomCode.slice(0, 3)} {qrModalRoom.roomCode.slice(3)}
              </div>
              <div className="text-xs text-slate-500">
                Quét camera điện thoại hoặc vào <span className="font-semibold text-slate-700">/learner/live-pin</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => handleCopyLink(qrModalRoom.roomCode)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép đường dẫn thi</span>
              </button>

              <button
                onClick={() => setQrModalRoom(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Đóng màn chiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
