'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Radio,
  Users,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Calendar,
  Play,
  Pause,
  Square,
  QrCode,
  ArrowLeft,
  Search,
  ExternalLink,
  Settings,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Send,
  Download,
  Share2,
  Monitor,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  X,
  Sparkles,
  BarChart2,
  UserCheck,
  UserX,
  Maximize2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: 'TAKING' | 'WAITING' | 'SUBMITTED' | 'DISCONNECTED';
  isReady: boolean;
  connectionStatus: 'ONLINE' | 'WEAK' | 'OFFLINE';
  score?: number | null;
  submittedAt?: string | null;
  joinedAt?: string;
  studentCode: string;
  elapsedSeconds?: number;
  seatNumber?: number;
  answersCount?: number;
  totalQuestions?: number;
  trustScore?: number;
  integrityFlag?: 'HIGH_TRUST' | 'SUSPICIOUS' | 'FLAGGED';
  violationsCount?: number;
}

interface RoomData {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  passingScore: number;
  roomMode: string;
  isActive: boolean;
  isLocked: boolean;
  themeId: RoomThemeId;
  status: string;
  maxParticipants: number;
  hasStarted: boolean;
  startedAt?: string | null;
  elapsedSeconds?: number;
  remainingSeconds?: number;
  organizationId?: string | null;
  organizationSlug?: string | null;
  classId?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
}

interface ActivityEvent {
  id: string;
  time: string;
  text: string;
  type: 'CONNECTION' | 'TAB' | 'ANNOUNCEMENT' | 'SYSTEM';
}

function LiveControlContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '';

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'TAKING' | 'SUBMITTED' | 'VIOLATION'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'PROGRESS'>('GRID');

  // Copy PIN & Link status
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Timer Control
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Modals & Announcements
  const [announceModalOpen, setAnnounceModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [extendTimeModalOpen, setExtendTimeModalOpen] = useState(false);
  const [extendCustomMinutes, setExtendCustomMinutes] = useState(5);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected candidate for deep inspection modal
  const [selectedCandidate, setSelectedCandidate] = useState<Participant | null>(null);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<number | null>(null);

  // Pagination for Candidates Table
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Lobby Settings (Quizizz / Kahoot style)
  const [lobbyDuration, setLobbyDuration] = useState<number>(45);
  const [lobbyTheme, setLobbyTheme] = useState<RoomThemeId>('minimal_white');
  const [lobbyAutoSubmit, setLobbyAutoSubmit] = useState<boolean>(true);
  const [lobbyLockLate, setLobbyLockLate] = useState<boolean>(false);
  const [lobbySound, setLobbySound] = useState<boolean>(true);

  // Schedule Window State (Hẹn giờ ca thi ngày bắt đầu - kết thúc)
  const [scheduleMode, setScheduleMode] = useState<'INSTANT' | 'SCHEDULED'>('INSTANT');
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('');
  const [scheduledEndTime, setScheduledEndTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Real Alerts (populated from genuine tab switch or disconnection events)
  const [alerts, setAlerts] = useState<{ id: string; title: string; detail: string; time: string; candidateName: string }[]>([]);

  // Realtime activity stream
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Poll room & participant state from real database
  const fetchRoomState = useCallback(
    async (silent = false) => {
      if (!roomId) {
        setError('Thiếu mã định danh phòng thi (roomId).');
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/rooms/status?roomId=${roomId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Không tìm thấy phòng thi hoặc phòng thi đã đóng.');
          return;
        }

        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);
          setIsLocked(data.room.isLocked ?? false);
          if (data.room.durationMinutes) setLobbyDuration(data.room.durationMinutes);
          if (data.room.themeId) setLobbyTheme(data.room.themeId);
          if (data.room.scheduledStart) {
            try {
              const sDate = new Date(data.room.scheduledStart);
              setScheduledStartTime(new Date(sDate.getTime() - sDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
            } catch {}
          }
          if (data.room.scheduledEnd) {
            try {
              const eDate = new Date(data.room.scheduledEnd);
              setScheduledEndTime(new Date(eDate.getTime() - eDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
            } catch {}
          }
          if (data.room.status === 'SCHEDULED') {
            setScheduleMode('SCHEDULED');
          }

          // Update countdown timer if in progress
          if (data.room.status === 'IN_PROGRESS') {
            const rem = data.room.remainingSeconds ?? Math.max(0, data.room.durationMinutes * 60 - (data.room.elapsedSeconds || 0));
            setCountdownSeconds((prev) => (Math.abs(prev - rem) > 5 ? rem : prev || rem));
          }

          const rawList = data.participants || [];
          const totalQ = data.room.totalQuestions || 40;
          const formatted: Participant[] = rawList.map((p: any, idx: number) => {
            const rawName = p.fullName || p.name || `Học viên ${idx + 1}`;
            const initials = rawName
              .split(' ')
              .filter(Boolean)
              .map((w: string) => w[0])
              .slice(-2)
              .join('')
              .toUpperCase() || 'HV';

            let status: 'TAKING' | 'WAITING' | 'SUBMITTED' | 'DISCONNECTED' = 'WAITING';
            if (p.status === 'SUBMITTED') status = 'SUBMITTED';
            else if (p.status === 'TAKING' || (data.room.status === 'IN_PROGRESS' && p.isReady)) status = 'TAKING';
            else if (p.connectionStatus === 'OFFLINE') status = 'DISCONNECTED';

            return {
              id: p.id || `p-${idx}`,
              userId: p.userId || `u-${idx}`,
              fullName: rawName,
              initials,
              status,
              isReady: Boolean(p.isReady),
              connectionStatus: p.connectionStatus || 'ONLINE',
              score: p.score ?? null,
              studentCode: p.studentCode || `HV-${String(idx + 1).padStart(3, '0')}`,
              seatNumber: idx + 1,
              elapsedSeconds: p.elapsedSeconds || (data.room.elapsedSeconds || 0),
              answersCount: p.answersCount ?? p.answers_count ?? (p.status === 'SUBMITTED' ? totalQ : 0),
              totalQuestions: p.totalQuestions ?? p.total_questions ?? totalQ,
              trustScore: p.trustScore ?? p.trust_score ?? 100,
              integrityFlag: p.integrityFlag ?? p.integrity_flag ?? 'HIGH_TRUST',
              violationsCount: p.violationsCount ?? p.violations_count ?? 0,
            };
          });

          setParticipants(formatted);
          setError(null);
        }
      } catch {
        if (!silent) setError('Lỗi kết nối khi đồng bộ dữ liệu phòng thi.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    setMounted(true);
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    d.setSeconds(0, 0);
    setScheduledStartTime((prev) => prev || new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));

    const d2 = new Date();
    d2.setMinutes(d2.getMinutes() + 120);
    d2.setSeconds(0, 0);
    setScheduledEndTime((prev) => prev || new Date(d2.getTime() - d2.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    fetchRoomState();
    const interval = setInterval(() => fetchRoomState(true), 3500);
    return () => clearInterval(interval);
  }, [fetchRoomState]);

  // Client Countdown Timer (Tick every second)
  useEffect(() => {
    if (room?.status !== 'IN_PROGRESS' || isTimerPaused) return;

    const timer = setInterval(() => {
      setCountdownSeconds((sec) => {
        if (sec <= 1) {
          clearInterval(timer);
          return 0;
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [room?.status, isTimerPaused]);

  // Realtime Supabase Channel for participant events & tab switch
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on('broadcast', { event: 'PARTICIPANT_JOIN' }, (payload) => {
        const pName = payload.payload?.fullName || 'Thí sinh mới';
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setRecentEvents((prev) => [
          {
            id: crypto.randomUUID(),
            time: timeStr,
            text: `${pName} đã tham gia sảnh chờ.`,
            type: 'CONNECTION',
          },
          ...prev.slice(0, 19),
        ]);
        fetchRoomState(true);
      })
      .on('broadcast', { event: 'PARTICIPANT_READY' }, (payload) => {
        const pName = payload.payload?.fullName || 'Thí sinh';
        const isR = payload.payload?.isReady;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setRecentEvents((prev) => [
          {
            id: crypto.randomUUID(),
            time: timeStr,
            text: `${pName} đã ${isR ? 'sẵn sàng' : 'chuyển sang chưa sẵn sàng'}.`,
            type: 'CONNECTION',
          },
          ...prev.slice(0, 19),
        ]);
        fetchRoomState(true);
      })
      .on('broadcast', { event: 'PARTICIPANT_STATUS_CHANGE' }, () => {
        fetchRoomState(true);
      })
      .on('broadcast', { event: 'TAB_SWITCH_ALERT' }, (payload) => {
        const pName = payload.payload?.fullName || 'Thí sinh';
        const targetUserId = payload.payload?.userId;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setAlerts((prev) => [
          {
            id: crypto.randomUUID(),
            title: `${pName} rời tab làm bài`,
            detail: `${timeStr} • Mất tiêu điểm cửa sổ khảo thí`,
            time: timeStr,
            candidateName: pName,
          },
          ...prev.slice(0, 14),
        ]);
        setRecentEvents((prev) => [
          {
            id: crypto.randomUUID(),
            time: timeStr,
            text: `Kỷ luật: ${pName} đã chuyển tab hoặc rời màn hình làm bài.`,
            type: 'TAB',
          },
          ...prev.slice(0, 19),
        ]);

        // Cập nhật ngay trạng thái Participant thời gian thực
        setParticipants((prev) =>
          prev.map((p) => {
            if ((targetUserId && p.userId === targetUserId) || p.fullName === pName) {
              const newViolationsCount = (p.violationsCount || 0) + 1;
              const newTrustScore = Math.max(0, (p.trustScore ?? 100) - 10);
              let newFlag: 'HIGH_TRUST' | 'SUSPICIOUS' | 'FLAGGED' = 'HIGH_TRUST';
              if (newTrustScore < 60 || newViolationsCount >= 3) {
                newFlag = 'FLAGGED';
              } else if (newTrustScore < 85 || newViolationsCount >= 1) {
                newFlag = 'SUSPICIOUS';
              }
              const updated = {
                ...p,
                violationsCount: newViolationsCount,
                trustScore: newTrustScore,
                integrityFlag: newFlag,
              };
              if (selectedCandidate?.id === p.id) {
                setSelectedCandidate(updated);
              }
              return updated;
            }
            return p;
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchRoomState, selectedCandidate]);

  // Derived Real Counts
  const totalJoined = participants.length;
  const takingCount = participants.filter((p) => p.status === 'TAKING').length;
  const submittedCount = participants.filter((p) => p.status === 'SUBMITTED').length;
  const notJoinedCount = participants.filter((p) => p.status === 'WAITING').length;
  const disconnectedCount = participants.filter((p) => p.status === 'DISCONNECTED').length;
  const submissionRate = totalJoined > 0 ? Math.round((submittedCount / totalJoined) * 100) : 0;

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (activeTab === 'TAKING' && p.status !== 'TAKING') return false;
      if (activeTab === 'SUBMITTED' && p.status !== 'SUBMITTED') return false;
      if (activeTab === 'VIOLATION') {
        const hasViolation =
          alerts.some((a) => a.candidateName === p.fullName) ||
          p.integrityFlag === 'SUSPICIOUS' ||
          p.integrityFlag === 'FLAGGED' ||
          (p.violationsCount || 0) > 0;
        if (!hasViolation) return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        return (
          p.fullName.toLowerCase().includes(q) ||
          p.studentCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [participants, activeTab, searchFilter, alerts]);

  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / pageSize));
  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredParticipants.slice(start, start + pageSize);
  }, [filteredParticipants, currentPage, pageSize]);

  // Time format helper (hh:mm:ss hoặc mm:ss)
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 1. Action: Bắt đầu phát đề thi
  const handleStartExam = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action: 'START',
          payload: {
            durationMinutes: Number(lobbyDuration) || 45,
            themeId: lobbyTheme,
            autoSubmitOnTimeout: lobbyAutoSubmit,
            allowLateJoin: !lobbyLockLate,
          },
        }),
      });
      if (res.ok) {
        showToast('Đã phát đề thi! Bắt đầu tính giờ làm bài trực tiếp.');
        if (room) {
          setRoom({
            ...room,
            status: 'IN_PROGRESS',
            isActive: true,
            durationMinutes: Number(lobbyDuration) || room.durationMinutes,
            themeId: lobbyTheme,
          });
        }
        setCountdownSeconds((Number(lobbyDuration) || 45) * 60);
        try {
          const supabase = createClient();
          await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'ROOM_STATE_CHANGE',
            payload: { action: 'START' },
          });
        } catch {}
        fetchRoomState(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể bắt đầu phát đề thi.');
      }
    } catch {
      alert('Lỗi kết nối khi phát đề thi.');
    } finally {
      setActionLoading(false);
    }
  };

  // 1.1 Action: Lưu lịch hẹn giờ ca thi (Scheduled Window)
  const handleSaveSchedule = async () => {
    if (!scheduledStartTime || !scheduledEndTime) {
      alert('Vui lòng chọn ngày giờ bắt đầu và kết thúc ca thi.');
      return;
    }
    const startD = new Date(scheduledStartTime);
    const endD = new Date(scheduledEndTime);
    if (endD <= startD) {
      alert('Thời gian kết thúc ca thi phải sau thời gian bắt đầu.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action: 'SCHEDULE',
          payload: {
            scheduledStart: startD.toISOString(),
            scheduledEnd: endD.toISOString(),
            durationMinutes: Number(lobbyDuration) || 45,
            themeId: lobbyTheme,
          },
        }),
      });
      if (res.ok) {
        showToast('Đã lưu lịch hẹn giờ ca thi thành công!');
        if (room) {
          setRoom({
            ...room,
            status: 'SCHEDULED',
            scheduledStart: startD.toISOString(),
            scheduledEnd: endD.toISOString(),
          });
        }
        fetchRoomState(true);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Không thể lên lịch ca thi.');
      }
    } catch {
      alert('Lỗi kết nối khi lưu lịch ca thi.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Action: Khóa / Mở khóa phòng
  const handleToggleLock = async () => {
    const nextLocked = !isLocked;
    try {
      await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: nextLocked ? 'LOCK' : 'UNLOCK' }),
      });
      setIsLocked(nextLocked);
      showToast(nextLocked ? 'Đã khóa phòng thi. Không nhận thêm thí sinh.' : 'Đã mở khóa phòng thi.');
    } catch {
      alert('Không thể đổi trạng thái khóa phòng.');
    }
  };

  // 2.1 Action: Tạm dừng / Tiếp tục ca thi
  const handleTogglePause = async () => {
    const nextPaused = !isTimerPaused;
    const action = nextPaused ? 'PAUSE' : 'RESUME';
    setIsTimerPaused(nextPaused);
    try {
      await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action }),
      });
      const supabase = createClient();
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'ROOM_STATE_CHANGE',
        payload: { action },
      });
      showToast(nextPaused ? 'Đã tạm dừng ca thi.' : 'Đã tiếp tục ca thi.');
    } catch {
      setIsTimerPaused(!nextPaused);
    }
  };

  // 3. Action: Kết thúc ca thi & Chuyển sang trang kết quả
  const handleEndExam = async () => {
    if (!confirm('Bạn có chắc chắn muốn kết thúc ca thi này và thu bài của tất cả thí sinh?')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'END' }),
      });
      if (res.ok) {
        try {
          const supabase = createClient();
          await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'ROOM_STATE_CHANGE',
            payload: { action: 'END' },
          });
        } catch {}
        router.push(`/personal/live-room/${roomId}/results`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể kết thúc ca thi.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Action: Thu bài toàn bộ phòng thi ngay lập tức
  const handleBulkSubmitAll = async () => {
    if (!confirm('Bạn có chắc chắn muốn thu bài của TẤT CẢ thí sinh đang làm bài không?')) return;
    showToast('Đang thu bài toàn bộ phòng thi...');
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action: 'FORCE_SUBMIT_ALL',
        }),
      });

      if (res.ok) {
        setParticipants((prev) => prev.map((p) => ({ ...p, status: 'SUBMITTED' })));
        try {
          const supabase = createClient();
          await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'ROOM_STATE_CHANGE',
            payload: { action: 'FORCE_SUBMIT_ALL' },
          });
        } catch {}
        showToast('Đã thu bài toàn bộ phòng thi thành công.');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể thu bài toàn bộ phòng thi.');
      }
    } catch {
      alert('Lỗi kết nối khi thu bài.');
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setRecentEvents((prev) => [
      {
        id: crypto.randomUUID(),
        time: timeStr,
        text: 'Giám thị đã phát lệnh thu bài đồng loạt toàn phòng.',
        type: 'SYSTEM',
      },
      ...prev,
    ]);
  };

  // 5. Action: Gửi thông báo toàn phòng thi
  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setSendingAnnounce(true);
    try {
      const supabase = createClient();
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'PROCTOR_ANNOUNCEMENT',
        payload: { content: announcementText.trim(), timestamp: new Date().toISOString() },
      });

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setRecentEvents((prev) => [
        {
          id: crypto.randomUUID(),
          time: timeStr,
          text: `Thông báo: "${announcementText.trim()}"`,
          type: 'ANNOUNCEMENT',
        },
        ...prev,
      ]);
      setAnnouncementText('');
      setAnnounceModalOpen(false);
      showToast('Đã phát thông báo tới tất cả thí sinh.');
    } catch {
      alert('Không thể gửi thông báo.');
    } finally {
      setSendingAnnounce(false);
    }
  };

  // 6. Action: Gia hạn thời gian
  const handleExtendTimeMinutes = async (mins: number) => {
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: mins },
        }),
      });

      if (res.ok) {
        setCountdownSeconds((sec) => sec + mins * 60);
        try {
          const supabase = createClient();
          await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'ROOM_STATE_CHANGE',
            payload: { action: 'EXTEND_TIME', payload: { additionalMinutes: mins } },
          });
        } catch {}
        showToast(`Đã gia hạn thêm ${mins} phút làm bài.`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể gia hạn thời gian làm bài.');
      }
    } catch {
      alert('Lỗi kết nối khi gia hạn thời gian.');
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setRecentEvents((prev) => [
      {
        id: crypto.randomUUID(),
        time: timeStr,
        text: `Đã gia hạn thêm ${mins} phút làm bài cho toàn phòng.`,
        type: 'SYSTEM',
      },
      ...prev,
    ]);
    setExtendTimeModalOpen(false);
  };

  // 7. Action: Thao tác cá nhân trên 1 thí sinh
  const handleForceSubmitCandidate = async (candidate: Participant) => {
    if (!confirm(`Thu bài ngay của thí sinh "${candidate.fullName}"?`)) return;
    try {
      const supabase = createClient();
      await supabase
        .from('room_participants')
        .update({ status: 'SUBMITTED', submitted_at: new Date().toISOString() })
        .eq('id', candidate.id);

      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'ROOM_STATE_CHANGE',
        payload: { action: 'FORCE_SUBMIT', targetUserId: candidate.userId },
      });
    } catch {}

    setParticipants((prev) =>
      prev.map((p) => (p.id === candidate.id ? { ...p, status: 'SUBMITTED' } : p))
    );
    showToast(`Đã thu bài của thí sinh ${candidate.fullName}`);
    setSelectedCandidate(null);
  };

  const handleWarnCandidate = async (candidate: Participant) => {
    const msg = prompt(`Nhập lời nhắc nhở gửi riêng tới ${candidate.fullName}:`, 'Nhắc nhở: Vui lòng tập trung làm bài, không chuyển tab trình duyệt.');
    if (!msg) return;

    try {
      const supabase = createClient();
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'PROCTOR_ANNOUNCEMENT',
        payload: {
          targetUserId: candidate.userId,
          candidateName: candidate.fullName,
          content: msg,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {}

    showToast(`Đã gửi nhắc nhở riêng tới ${candidate.fullName}`);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setRecentEvents((prev) => [
      {
        id: crypto.randomUUID(),
        time: timeStr,
        text: `Nhắc nhở riêng ${candidate.fullName}: "${msg}"`,
        type: 'ANNOUNCEMENT',
      },
      ...prev,
    ]);
    setSelectedCandidate(null);
  };

  const handleCopyCode = () => {
    const code = room?.roomCode || '';
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast(`Đã sao chép mã PIN: ${code}`);
  };

  // Back Link: Ưu tiên quay về Org Live Room nếu phòng thi thuộc tổ chức
  const orgSlugParam = searchParams.get('slug') || searchParams.get('orgSlug') || room?.organizationSlug;
  const backToListUrl = orgSlugParam
    ? `/org/${orgSlugParam}/live-room`
    : '/personal/live-room';

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-6">
        <div className="p-8 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            Đang nạp bàn điều phối khảo thí...
          </div>
        </div>
      </div>
    );
  }

  const roomTitle = room?.title || 'Phòng thi trực tiếp';
  const assessmentTitle = room?.assessmentTitle || 'Đánh Giá Năng Lực Số Chuẩn 5 Miền';
  const displayPin = room?.roomCode || '------';
  const maxCap = room?.maxParticipants || 40;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-medium shadow-lg flex items-center gap-2 border border-neutral-800 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* ======================================================================= */}
        {/* 1. TOP HEADER: Back Link, Breadcrumb, Room Title & Primary Actions     */}
        {/* ======================================================================= */}
        <div className="space-y-3 pb-3">
          <Link
            href={backToListUrl}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-200 text-xs font-semibold shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách phòng thi</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${room?.status === 'IN_PROGRESS' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Phòng thi: {roomTitle}
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {room?.status === 'IN_PROGRESS'
                  ? 'Ca thi đang diễn ra. Giám sát thời gian thực, quản lý thí sinh và xử lý kỷ luật phòng thi.'
                  : 'Sảnh chờ đang mở. Chia sẻ mã PIN để thí sinh tham gia và thiết lập quy chế trước khi phát đề.'}
              </p>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              {room?.status !== 'IN_PROGRESS' ? (
                <button
                  type="button"
                  onClick={handleStartExam}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt đầu phát đề thi</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleBulkSubmitAll}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-slate-700 dark:text-neutral-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Thu bài đồng loạt tất cả thí sinh"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Thu bài cả phòng</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEndExam}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Kết thúc ca &amp; Chấm điểm</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleToggleLock}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isLocked
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-neutral-700 dark:text-neutral-200 hover:bg-slate-50'
                }`}
              >
                {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'Mở khóa tham gia' : 'Tạm khóa phòng'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. SUBHEADER METADATA STRIP                                            */}
        {/* ======================================================================= */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Đề khảo thí */}
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Đề khảo thí:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 max-w-[240px] truncate" title={assessmentTitle}>
                  {assessmentTitle}
                </span>
              </div>
            </div>

            {/* Thời lượng */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Thời lượng:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {room?.status === 'IN_PROGRESS' ? (room?.durationMinutes || 45) : lobbyDuration} phút
                </span>
              </div>
            </div>

            {/* Thí sinh */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Thí sinh:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                  {totalJoined} / {maxCap}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* PIN Pill with Copy */}
            <div className="px-3 py-1 rounded-lg bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 flex items-center gap-2 font-mono">
              <span className="text-[11px] text-slate-400 uppercase font-sans">MÃ PIN:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm tracking-wider">
                {displayPin}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="Sao chép mã PIN"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Live Status Badge */}
            {room?.status === 'IN_PROGRESS' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Đang làm bài
              </span>
            ) : room?.status === 'SCHEDULED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Đã lên lịch ca thi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Clock className="w-3 h-3 text-blue-600" />
                Sảnh chờ
              </span>
            )}
          </div>
        </div>

        {/* Banner thông báo Lịch hẹn giờ ca thi */}
        {room?.scheduledStart && room?.status !== 'IN_PROGRESS' && (
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-950 dark:text-indigo-200 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Ca thi đã lên lịch mở:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {new Date(room.scheduledStart).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })} &ndash; {room.scheduledEnd ? new Date(room.scheduledEnd).toLocaleString('vi-VN', { timeStyle: 'short' }) : ''}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Thí sinh có thể truy cập trước vào sảnh bằng mã PIN <strong className="font-mono text-blue-600">{displayPin}</strong>. Bạn có thể bấm phát đề bất kỳ lúc nào hoặc đợi đúng giờ.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                Thời lượng: {room.durationMinutes || lobbyDuration} phút
              </span>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* PHÂN NHÁNH GIAO DIỆN: SẢNH CHỜ KHẢO THÍ SỐ vs BÀN GIÁM SÁT CA THI    */}
        {/* ======================================================================= */}
        {room?.status !== 'IN_PROGRESS' ? (
          /* ===================================================================== */
          /* SẢNH CHỜ (LOBBY): ARENA (7 COLS) + PANEL CÀI ĐẶT CHỌN THEME (5 COLS)  */
          /* ===================================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (7 / 12 COLS): ARENA STAGE & DANH SÁCH THÍ SINH VÀO SẢNH */}
            <div className="lg:col-span-7 space-y-5">
              {/* Card 1: Arena Hero Display */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                    <span>Sảnh chờ đang mở &ndash; Sẵn sàng đón thí sinh</span>
                  </div>

                  <Link
                    href={`/live/projector?roomId=${roomId}&pin=${displayPin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Chiếu máy chiếu</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Left: PIN 6 Số khổng lồ + Hướng dẫn */}
                  <div className="sm:col-span-7 space-y-5 text-center sm:text-left">
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                        MÃ PIN THAM GIA
                      </span>
                      <div className="font-mono font-black text-5xl sm:text-6xl tracking-widest text-blue-600 dark:text-blue-400 py-1 tabular-nums">
                        {displayPin.slice(0, 3)} {displayPin.slice(3)}
                      </div>
                    </div>

                    {/* Action buttons copy */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Đã chép PIN' : 'Chép mã PIN'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nexa.ai';
                          const link = `${origin}/live?pin=${displayPin}`;
                          navigator.clipboard.writeText(link);
                          showToast('Đã sao chép liên kết vào phòng thi!');
                        }}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-slate-700 dark:text-neutral-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Chép liên kết</span>
                      </button>
                    </div>

                    {/* Step-by-step instructions */}
                    <div className="pt-3 space-y-2 text-xs text-slate-600 dark:text-neutral-400">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          Thí sinh truy cập <strong className="text-neutral-900 dark:text-neutral-100">nexa.ai/live</strong> hoặc quét mã QR.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          Nhập mã PIN <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">{displayPin}</strong> và Họ tên để vào sảnh.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: QR Code Card */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center space-y-1.5">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          mounted && typeof window !== 'undefined'
                            ? `${window.location.origin}/live?pin=${displayPin}`
                            : `https://nexa.ai/live?pin=${displayPin}`
                        )}`}
                        alt={`QR Code PIN ${displayPin}`}
                        suppressHydrationWarning
                        className="w-36 h-36 rounded object-contain mx-auto"
                      />
                      <div className="text-[10px] font-mono font-medium text-slate-600">
                        Quét mã vào phòng ngay
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Danh sách Thí sinh trong Sảnh chờ */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      Thí sinh trong sảnh chờ ({totalJoined} / {maxCap})
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchRoomState(true)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Làm mới</span>
                  </button>
                </div>

                {participants.length === 0 ? (
                  <div className="py-10 px-4 text-center space-y-2 bg-slate-50/50 dark:bg-zinc-900/40 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      Chưa có thí sinh kết nối
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Khi thí sinh nhập mã PIN <strong className="font-mono text-blue-600">{displayPin}</strong>, danh sách sẽ cập nhật theo thời gian thực.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {p.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                            {p.fullName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {p.studentCode}
                          </div>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI (5 / 12 COLS): BẢNG CÀI ĐẶT SẢNH CHỜ VỚI BỘ CHỌN THEME CÓ ẢNH THẬT & HẸN GIỜ CA THI */}
            <div className="lg:col-span-5 space-y-5 sticky top-6">
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                      Cài đặt phòng thi (Setup)
                    </h2>
                  </div>

                  <span className="text-[11px] font-mono font-medium text-slate-400">
                    {scheduleMode === 'INSTANT' ? 'Trực tiếp' : 'Hẹn giờ'}
                  </span>
                </div>

                {/* Chuyển đổi Chế độ: Phát đề trực tiếp vs Hẹn giờ ca thi */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('INSTANT')}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      scheduleMode === 'INSTANT'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Phát trực tiếp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleMode('SCHEDULED')}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      scheduleMode === 'SCHEDULED'
                        ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hẹn giờ ca thi</span>
                  </button>
                </div>

                {/* NỘI DUNG 1: CẤU HÌNH THỜI GIAN THEO CHẾ ĐỘ */}
                {scheduleMode === 'INSTANT' ? (
                  /* 1A. Chế độ Phát Trực Tiếp: Chọn thời lượng làm bài */
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Thời lượng làm bài:
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {lobbyDuration} phút
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setLobbyDuration(mins)}
                          className={`py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                            lobbyDuration === mins
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {mins}p
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="text-slate-400 text-[11px]">Tùy chỉnh:</span>
                      <input
                        type="number"
                        min={5}
                        max={360}
                        value={lobbyDuration}
                        onChange={(e) => setLobbyDuration(Math.max(5, Number(e.target.value) || 5))}
                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-xs text-center font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <span className="text-[11px] text-slate-400">phút</span>
                    </div>
                  </div>
                ) : (
                  /* 1B. Chế độ Hẹn Giờ Ca Thi (Scheduled Window) */
                  <div className="space-y-3 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 text-xs">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Khung giờ diễn ra ca thi:</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                          Thời gian mở ca (Bắt đầu):
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduledStartTime}
                          onChange={(e) => setScheduledStartTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                          Thời gian đóng ca (Kết thúc):
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduledEndTime}
                          onChange={(e) => setScheduledEndTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      <div className="pt-1 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-neutral-400 font-medium">
                          Thời lượng mỗi lượt thi:
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={5}
                            max={360}
                            value={lobbyDuration}
                            onChange={(e) => setLobbyDuration(Math.max(5, Number(e.target.value) || 5))}
                            className="w-14 px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-xs text-center font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                          <span className="text-[11px] text-slate-500">phút</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Bộ chọn Theme với HÌNH ẢNH MINH HỌA THẬT */}
                <div className="space-y-2.5 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Chủ đề giao diện (Themes):
                    </label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      {ROOM_THEMES[lobbyTheme]?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(ROOM_THEMES) as RoomThemeId[]).map((themeKey) => {
                      const th = ROOM_THEMES[themeKey];
                      const isSelected = lobbyTheme === themeKey;
                      return (
                        <div
                          key={themeKey}
                          onClick={() => setLobbyTheme(themeKey)}
                          className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-600/40 shadow-sm'
                              : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          {/* Image preview artwork */}
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-zinc-900">
                            <img
                              src={th.imagePath}
                              alt={th.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/60 text-white backdrop-blur-2xs">
                              {th.tagline}
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-zinc-950">
                            <div className="font-bold text-[11px] text-neutral-900 dark:text-neutral-100 truncate">
                              {th.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                              {th.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Quy chế làm bài Toggles */}
                <div className="space-y-3 pt-3 text-xs">
                  <label className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Quy chế khảo thí &amp; Giám sát:
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-700 dark:text-neutral-300">Tự động nộp bài khi hết giờ</span>
                      <input
                        type="checkbox"
                        checked={lobbyAutoSubmit}
                        onChange={(e) => setLobbyAutoSubmit(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-700 dark:text-neutral-300">Khóa phòng sau khi phát đề</span>
                      <input
                        type="checkbox"
                        checked={lobbyLockLate}
                        onChange={(e) => setLobbyLockLate(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-700 dark:text-neutral-300">Âm thanh khi có thí sinh vào</span>
                      <input
                        type="checkbox"
                        checked={lobbySound}
                        onChange={(e) => setLobbySound(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Action CTA Tương ứng Chế độ */}
                <div className="pt-4 space-y-2">
                  {scheduleMode === 'INSTANT' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleStartExam}
                        disabled={actionLoading}
                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Bắt đầu phát đề thi</span>
                      </button>

                      <div className="text-[11px] text-center text-slate-400">
                        Bấm để chính thức tính giờ và phát đề cho tất cả thí sinh trong sảnh.
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveSchedule}
                        disabled={actionLoading}
                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Lưu lịch hẹn giờ ca thi</span>
                      </button>

                      {room?.scheduledStart && (
                        <button
                          type="button"
                          onClick={handleStartExam}
                          disabled={actionLoading}
                          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-blue-600 fill-current" />
                          <span>Phát đề ngay lập tức (Không đợi lịch)</span>
                        </button>
                      )}

                      <div className="text-[11px] text-center text-slate-400">
                        Lịch thi sẽ được lưu vào hệ thống. Thí sinh sử dụng mã PIN để đăng nhập trong khung giờ đã định.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================================= */
          /* BÀN GIÁM SÁT CA THI (LIVE EXAM CONTROL DECK)                            */
          /* ======================================================================= */
          <div className="space-y-5">
            {/* 1. DẢI TELEMETRY & ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN THỰC                     */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Live Countdown Timer */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider font-mono">THỜI GIAN CÒN LẠI</span>
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {isTimerPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                    <span>{isTimerPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                  </button>
                </div>
                <div className={`font-mono text-3xl font-black tabular-nums ${countdownSeconds < 300 ? 'text-rose-600 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`}>
                  {formatTimer(countdownSeconds)}
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleExtendTimeMinutes(5)}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 font-semibold text-[11px] text-slate-700 dark:text-neutral-300 cursor-pointer"
                  >
                    +5 phút
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendTimeMinutes(10)}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 font-semibold text-[11px] text-slate-700 dark:text-neutral-300 cursor-pointer"
                  >
                    +10 phút
                  </button>
                </div>
              </div>

              {/* Card 2: Tiến độ nộp bài của cả phòng */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider font-mono">TIẾN ĐỘ NỘP BÀI</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{submissionRate}%</span>
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {submittedCount} / {totalJoined}
                </div>
                {/* 2-layer Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${submissionRate}%` }}
                    title={`Đã nộp: ${submittedCount}`}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${totalJoined > 0 ? (takingCount / totalJoined) * 100 : 0}%` }}
                    title={`Đang làm: ${takingCount}`}
                  />
                </div>
              </div>

              {/* Card 3: Thí sinh đang làm bài & Tạm ngắt */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider font-mono">TRẠNG THÁI MẠNG</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Trực tuyến
                  </span>
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {takingCount} <span className="text-xs font-normal text-slate-400">đang làm</span>
                </div>
                <div className="text-xs text-slate-500">
                  {disconnectedCount > 0 ? (
                    <span className="text-amber-600 font-semibold">{disconnectedCount} thí sinh mạng yếu/tạm ngắt</span>
                  ) : (
                    <span>Tất cả thiết bị kết nối ổn định</span>
                  )}
                </div>
              </div>

              {/* Card 4: Kỷ luật & Cảnh báo rời tab */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider font-mono">CẢNH BÁO VI PHẠM</span>
                  <AlertTriangle className={`w-3.5 h-3.5 ${alerts.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                </div>
                <div className={`text-2xl font-bold font-mono ${alerts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                  {alerts.length} <span className="text-xs font-normal text-slate-400">lần rời tab</span>
                </div>
                <div className="text-xs text-slate-500">
                  {alerts.length > 0 ? (
                    <span className="text-amber-600 font-medium">Đã ghi nhận vào biên bản</span>
                  ) : (
                    <span>Chưa có vi phạm nào</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. MAIN 3-COLUMN OPERATIONAL DECK                                     */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* =================================================================== */}
              {/* CỘT 1: THÍ SINH & THAO TÁC CAN THIỆP CÁ NHÂN (4 / 12 Cols)          */}
              {/* =================================================================== */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs p-4 space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      Thí sinh ({totalJoined})
                    </h2>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                      activeTab === 'ALL'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'text-slate-500 hover:text-neutral-900'
                    }`}
                  >
                    Tất cả {totalJoined}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('TAKING'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                      activeTab === 'TAKING'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-500 hover:text-neutral-900'
                    }`}
                  >
                    Đang làm {takingCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('SUBMITTED'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                      activeTab === 'SUBMITTED'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'text-slate-500 hover:text-neutral-900'
                    }`}
                  >
                    Đã nộp {submittedCount}
                  </button>
                  {alerts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('VIOLATION'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                        activeTab === 'VIOLATION'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'text-slate-500 hover:text-neutral-900'
                      }`}
                    >
                      Kỷ luật {alerts.length}
                    </button>
                  )}
                </div>

                {/* Candidate Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc mã thí sinh..."
                    value={searchFilter}
                    onChange={(e) => { setSearchFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Candidate List with Actions */}
                {filteredParticipants.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Không tìm thấy thí sinh phù hợp bộ lọc.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedParticipants.map((p) => {
                      const isSelected = selectedCandidate?.id === p.id;
                      const hasAlert = alerts.some((a) => a.candidateName === p.fullName);

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedCandidate(p)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/30 ring-1 ring-blue-600'
                              : 'border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {p.initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                  {p.fullName}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {p.studentCode} &bull; Ghế {p.seatNumber}
                                </div>
                              </div>
                            </div>

                            {/* Status badge */}
                            <div>
                              {p.status === 'SUBMITTED' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{p.score !== null ? `${p.score}đ` : 'Đã nộp'}</span>
                                </span>
                              ) : p.status === 'TAKING' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Đang làm</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Phòng chờ</span>
                              )}
                            </div>
                          </div>

                          {/* Progress bar per candidate */}
                          <div className="mt-2.5 space-y-1 text-[10px]">
                            <div className="flex items-center justify-between text-slate-500">
                              <span>Tiến độ: {p.answersCount || 0} / {p.totalQuestions || 40} câu</span>
                              <span className="font-mono font-semibold">
                                {Math.round(((p.answersCount || 0) / (p.totalQuestions || 40)) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className={`h-full ${p.status === 'SUBMITTED' ? 'bg-blue-600' : 'bg-emerald-500'}`}
                                style={{
                                  width: `${Math.min(100, Math.round(((p.answersCount || 0) / (p.totalQuestions || 40)) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Quick Intervention Controls & Trust Badge */}
                          <div className="mt-3 pt-2 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              {p.integrityFlag === 'FLAGGED' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Vi phạm ({p.trustScore ?? 100}%)</span>
                                </span>
                              ) : p.integrityFlag === 'SUSPICIOUS' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                                  <span>Nghi vấn ({p.trustScore ?? 100}%)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Tin cậy ({p.trustScore ?? 100}%)</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWarnCandidate(p);
                                }}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-neutral-300 font-semibold cursor-pointer"
                                title="Gửi nhắc nhở riêng"
                              >
                                Nhắc nhở
                              </button>

                              {p.status === 'TAKING' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleForceSubmitCandidate(p);
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold cursor-pointer"
                                  title="Thu bài ngay lập tức"
                                >
                                  Thu bài
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                        <span>
                          {(currentPage - 1) * pageSize + 1} &ndash;{' '}
                          {Math.min(currentPage * pageSize, filteredParticipants.length)} /{' '}
                          {filteredParticipants.length} thí sinh
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono px-2">{currentPage}/{totalPages}</span>
                          <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* =================================================================== */}
              {/* CỘT 2: BẢNG THEO DÕI SƠ ĐỒ / TIẾN ĐỘ & NHẬT KÝ SỰ KIỆN (5 / 12 Cols) */}
              {/* =================================================================== */}
              <div className="lg:col-span-5 space-y-4">
                {/* Card 1: Bảng trạng thái làm bài trực tiếp */}
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        Bảng theo dõi trực tiếp
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setViewMode('GRID')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                          viewMode === 'GRID'
                            ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-neutral-900'
                        }`}
                      >
                        Sơ đồ
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('PROGRESS')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                          viewMode === 'PROGRESS'
                            ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-neutral-900'
                        }`}
                      >
                        Tiến độ
                      </button>
                    </div>
                  </div>

                  {/* Status Legend */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Đang làm ({takingCount})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Đã nộp ({submittedCount})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-600" />
                      <span>Chờ phát đề ({notJoinedCount})</span>
                    </span>
                  </div>

                  {/* View 1: Dynamic Seat Grid */}
                  {viewMode === 'GRID' ? (
                    participants.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                        <div>Chưa có thí sinh kết nối vào sơ đồ.</div>
                        <div className="text-[11px] text-slate-500">
                          Sơ đồ chỗ ngồi sẽ tự động hiển thị vị trí khi thí sinh nhập mã PIN.
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 pt-1">
                        {participants.map((p, idx) => {
                          const isSelected = selectedSeatNumber === (idx + 1);
                          let bgClass = 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500';
                          if (p.status === 'TAKING') {
                            bgClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold';
                          } else if (p.status === 'SUBMITTED') {
                            bgClass = 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold';
                          } else if (p.status === 'DISCONNECTED') {
                            bgClass = 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold animate-pulse';
                          }

                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedSeatNumber(idx + 1);
                                setSelectedCandidate(p);
                              }}
                              title={`${p.fullName} (${p.studentCode}) - ${p.answersCount || 0}/${p.totalQuestions || 40} câu`}
                              className={`h-11 rounded-lg border flex flex-col items-center justify-center font-mono text-[11px] transition-all cursor-pointer ${bgClass} ${
                                isSelected ? 'ring-2 ring-blue-600 scale-105 shadow-xs' : ''
                              }`}
                            >
                              <span className="font-bold">{String(idx + 1).padStart(2, '0')}</span>
                              <span className="text-[9px] truncate max-w-[38px]">{p.initials}</span>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    /* View 2: Progress Distribution */
                    <div className="space-y-3 pt-2">
                      {[
                        { label: 'Hoàn thành 75% - 100%', count: participants.filter((p) => ((p.answersCount || 0) / (p.totalQuestions || 40)) >= 0.75).length, color: 'bg-emerald-500' },
                        { label: 'Hoàn thành 50% - 74%', count: participants.filter((p) => ((p.answersCount || 0) / (p.totalQuestions || 40)) >= 0.5 && ((p.answersCount || 0) / (p.totalQuestions || 40)) < 0.75).length, color: 'bg-blue-500' },
                        { label: 'Hoàn thành 25% - 49%', count: participants.filter((p) => ((p.answersCount || 0) / (p.totalQuestions || 40)) >= 0.25 && ((p.answersCount || 0) / (p.totalQuestions || 40)) < 0.5).length, color: 'bg-amber-500' },
                        { label: 'Mới bắt đầu (< 25%)', count: participants.filter((p) => ((p.answersCount || 0) / (p.totalQuestions || 40)) < 0.25).length, color: 'bg-slate-400' },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between text-slate-600 dark:text-neutral-400">
                            <span>{item.label}</span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{item.count} thí sinh</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full ${item.color}`}
                              style={{ width: `${totalJoined > 0 ? (item.count / totalJoined) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card 2: Dòng sự kiện phòng thi (Realtime Activity Stream) */}
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        Nhật ký sự kiện
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1 text-xs max-h-56 overflow-y-auto">
                    {recentEvents.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Phòng thi đang hoạt động bình thường. Chưa có sự kiện bất thường.
                      </div>
                    ) : (
                      recentEvents.map((evt) => (
                        <div key={evt.id} className="flex items-start gap-2.5">
                          <span className="font-mono text-[11px] text-slate-400 shrink-0 mt-0.5">
                            {evt.time}
                          </span>
                          <div className="flex-1 leading-relaxed text-neutral-800 dark:text-neutral-200">
                            {evt.type === 'TAB' ? (
                              <span className="text-rose-700 dark:text-rose-300 font-medium">{evt.text}</span>
                            ) : evt.type === 'ANNOUNCEMENT' ? (
                              <span className="text-blue-700 dark:text-blue-300 font-medium">{evt.text}</span>
                            ) : (
                              <span>{evt.text}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* CỘT 3: KỶ LUẬT & BỘ CÔNG CỤ ĐIỀU PHỐI (3 / 12 Cols)                */}
              {/* =================================================================== */}
              <div className="lg:col-span-3 space-y-4">
                {/* Card 1: Cảnh báo kỷ luật phòng thi */}
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        Cảnh báo rời tab ({alerts.length})
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1 text-xs">
                    {alerts.length === 0 ? (
                      <div className="py-4 text-center space-y-1.5">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                          Chưa ghi nhận vi phạm rời tab nào.
                        </div>
                      </div>
                    ) : (
                      alerts.map((alt) => (
                        <div
                          key={alt.id}
                          className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1"
                        >
                          <div className="font-bold text-neutral-900 dark:text-neutral-100">
                            {alt.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                            {alt.detail}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Card 2: Bộ công cụ giám thị (Proctor Toolkit) */}
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2">
                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      Điều khiển nhanh
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                    {/* 1. Gửi thông báo */}
                    <button
                      type="button"
                      onClick={() => setAnnounceModalOpen(true)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-neutral-800 dark:text-neutral-200 inline-flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Gửi thông báo</span>
                    </button>

                    {/* 2. Gia hạn thời gian */}
                    <button
                      type="button"
                      onClick={() => setExtendTimeModalOpen(true)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-neutral-800 dark:text-neutral-200 inline-flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Gia hạn ca thi</span>
                    </button>
                  </div>

                  <div className="pt-2 space-y-2">
                    <Link
                      href={`/live/projector?roomId=${roomId}&pin=${displayPin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Mở màn hình chiếu sảnh chờ (Máy chiếu)</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS: Gửi Thông Báo & Gia Hạn Thời Gian                                 */}
      {/* ========================================================================= */}

      {/* Modal 1: Gửi thông báo */}
      {announceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Phát thông báo toàn phòng thi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAnnounceModalOpen(false)}
                className="text-slate-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Thông báo sẽ nổi trực tiếp trên màn hình làm bài của tất cả thí sinh đang kết nối.
            </p>

            <textarea
              rows={3}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="VD: Còn 15 phút làm bài, các thí sinh vui lòng rà soát lại đáp án..."
              className="w-full p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAnnounceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={sendingAnnounce || !announcementText.trim()}
                onClick={handleSendAnnouncement}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Phát thông báo ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Gia hạn thời gian linh hoạt */}
      {extendTimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Gia hạn thời gian ca thi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExtendTimeModalOpen(false)}
                className="text-slate-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Chọn khoảng thời gian cộng thêm vào đồng hồ đếm ngược của phòng thi:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleExtendTimeMinutes(mins)}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors"
                >
                  +{mins} phút
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Hoặc tự nhập:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={extendCustomMinutes}
                  onChange={(e) => setExtendCustomMinutes(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-center font-mono font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleExtendTimeMinutes(extendCustomMinutes)}
                  className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold text-xs cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Thanh tra chuyên sâu thí sinh & Cờ tin cậy */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                  {selectedCandidate.initials}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {selectedCandidate.fullName}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                    {selectedCandidate.studentCode} &bull; Vị trí ghế {selectedCandidate.seatNumber}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trust Score & Integrity Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                selectedCandidate.integrityFlag === 'FLAGGED'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                  : selectedCandidate.integrityFlag === 'SUSPICIOUS'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedCandidate.integrityFlag === 'FLAGGED' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                ) : selectedCandidate.integrityFlag === 'SUSPICIOUS' ? (
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {selectedCandidate.integrityFlag === 'FLAGGED'
                      ? 'Cảnh báo vi phạm liêm chính'
                      : selectedCandidate.integrityFlag === 'SUSPICIOUS'
                      ? 'Cần theo dõi thêm'
                      : 'Độ tin cậy cao'}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {selectedCandidate.violationsCount || 0} sự kiện bất thường ghi nhận
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-medium opacity-80">Trust Score</div>
                <div className="font-mono font-bold text-lg leading-tight">
                  {selectedCandidate.trustScore ?? 100}%
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-0.5">
                <span className="text-[10px] text-slate-500">Trạng thái làm bài</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">
                  {selectedCandidate.status === 'SUBMITTED' ? 'Đã nộp bài' : selectedCandidate.status === 'TAKING' ? 'Đang làm bài' : 'Chờ thi'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-0.5">
                <span className="text-[10px] text-slate-500">Tiến độ câu trả lời</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {selectedCandidate.answersCount || 0} / {selectedCandidate.totalQuestions || 40} câu
                </div>
              </div>
            </div>

            {/* Actions in modal */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleWarnCandidate(selectedCandidate)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 text-slate-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer"
              >
                Nhắc nhở riêng
              </button>
              {selectedCandidate.status === 'TAKING' && (
                <button
                  type="button"
                  onClick={() => {
                    handleForceSubmitCandidate(selectedCandidate);
                    setSelectedCandidate(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Thu bài thí sinh
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveControlPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 text-xs text-slate-500">
          Đang nạp bàn điều phối...
        </div>
      }
    >
      <LiveControlContent />
    </Suspense>
  );
}
