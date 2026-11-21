'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Radio,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  Copy,
  Volume2,
  VolumeX,
  Wifi,
  HelpCircle,
  Heart,
  Hand,
  Sparkles,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { examSound } from '@/lib/sound/exam-sound';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
  isReady: boolean;
}

interface RoomData {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  passingScore: number;
  hasStarted: boolean;
  startedAt?: string | null;
  scheduledStart?: string | null;
  assessmentItemCount?: number;
  themeId?: RoomThemeId;
}

function getThemeStyles(themeId: RoomThemeId = 'minimal_white') {
  switch (themeId) {
    case 'space_blue':
      return {
        bg: 'bg-[#0a0f1d] text-sky-100',
        header: 'bg-[#0d1527]/90 text-sky-100 shadow-[0_1px_0_0_#1e293b]',
        canvasBg: 'bg-[#0d1527]/50 border-sky-900/60 shadow-sky-950/40',
        dotPattern: 'rgba(56, 189, 248, 0.18)',
        subtext: 'text-sky-300/80',
        badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
        interactiveBg: 'bg-[#0d1527]/90 border-sky-800/60',
      };
    case 'aurora':
      return {
        bg: 'bg-[#090b16] text-purple-100',
        header: 'bg-[#101326]/90 text-purple-100 shadow-[0_1px_0_0_#2e1065]',
        canvasBg: 'bg-[#101326]/50 border-purple-900/60 shadow-purple-950/40',
        dotPattern: 'rgba(192, 132, 252, 0.18)',
        subtext: 'text-purple-300/80',
        badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
        interactiveBg: 'bg-[#101326]/90 border-purple-800/60',
      };
    case 'dark_professional':
      return {
        bg: 'bg-[#09090b] text-neutral-100',
        header: 'bg-[#121215]/90 text-neutral-100 shadow-[0_1px_0_0_#27272a]',
        canvasBg: 'bg-[#121215]/50 border-zinc-800/80 shadow-black/40',
        dotPattern: 'rgba(161, 161, 170, 0.14)',
        subtext: 'text-neutral-400',
        badgeBg: 'bg-zinc-900/80 text-zinc-300 border-zinc-700/80',
        interactiveBg: 'bg-[#18181b]/90 border-zinc-800',
      };
    case 'minimal_white':
    default:
      return {
        bg: 'bg-white text-neutral-900',
        header: 'bg-white/95 text-neutral-900 shadow-[0_1px_0_0_#e2e8f0]',
        canvasBg: 'bg-white/80 border-slate-200/80 shadow-slate-100',
        dotPattern: 'rgba(100, 116, 139, 0.14)',
        subtext: 'text-slate-500',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        interactiveBg: 'bg-white/90 border-slate-200/80',
      };
  }
}

interface FloatingReaction {
  id: string;
  reactionType: 'WAVE' | 'HEART' | 'CHEER';
  timestamp: number;
  xPercent: number;
}

const BUBBLE_PALETTES = [
  {
    bg: 'bg-blue-50/90 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/80',
    text: 'text-blue-900 dark:text-blue-100',
    avatarBg: 'bg-blue-600',
    avatarText: 'text-white',
    dot: 'bg-blue-500',
  },
  {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    text: 'text-emerald-900 dark:text-emerald-100',
    avatarBg: 'bg-emerald-600',
    avatarText: 'text-white',
    dot: 'bg-emerald-500',
  },
  {
    bg: 'bg-purple-50/90 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/80',
    text: 'text-purple-900 dark:text-purple-100',
    avatarBg: 'bg-purple-600',
    avatarText: 'text-white',
    dot: 'bg-purple-500',
  },
  {
    bg: 'bg-amber-50/90 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/80',
    text: 'text-amber-900 dark:text-amber-100',
    avatarBg: 'bg-amber-600',
    avatarText: 'text-white',
    dot: 'bg-amber-500',
  },
  {
    bg: 'bg-teal-50/90 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800/80',
    text: 'text-teal-900 dark:text-teal-100',
    avatarBg: 'bg-teal-600',
    avatarText: 'text-white',
    dot: 'bg-teal-500',
  },
  {
    bg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/80',
    text: 'text-indigo-900 dark:text-indigo-100',
    avatarBg: 'bg-indigo-600',
    avatarText: 'text-white',
    dot: 'bg-indigo-500',
  },
  {
    bg: 'bg-rose-50/90 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/80',
    text: 'text-rose-900 dark:text-rose-100',
    avatarBg: 'bg-rose-600',
    avatarText: 'text-white',
    dot: 'bg-rose-500',
  },
  {
    bg: 'bg-cyan-50/90 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800/80',
    text: 'text-cyan-900 dark:text-cyan-100',
    avatarBg: 'bg-cyan-600',
    avatarText: 'text-white',
    dot: 'bg-cyan-500',
  },
];

function getBubblePalette(idStr: string) {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  return BUBBLE_PALETTES[Math.abs(hash) % BUBBLE_PALETTES.length];
}

function WaitingRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pin = searchParams.get('pin') || '';
  const roomIdFromUrl = searchParams.get('roomId') || '';
  const assessmentIdFromUrl = searchParams.get('assessmentId') || '';

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingNotice, setStartingNotice] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Sound settings (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modal Quy chế & Hướng dẫn
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Incoming Countdown from Host
  const [incomingCountdown, setIncomingCountdown] = useState<number | null>(null);

  // Floating Reactions from candidates
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Current User
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('Thí sinh');
  const [currentUserInitials, setCurrentUserInitials] = useState<string>('TS');
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);

  // 2D Physics Refs for gentle floating bubbles
  const arenaRef = useRef<HTMLDivElement>(null);
  const bubbleElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const physicsDataRef = useRef<
    Map<
      string,
      {
        x: number;
        y: number;
        vx: number;
        vy: number;
        w: number;
        h: number;
      }
    >
  >(new Map());

  // Countdown timer state (seconds until start if scheduled in future)
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const channelRef = useRef<any>(null);

  // Load sound preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexa_exam_sound');
      if (saved !== null) setSoundEnabled(saved === 'true');
    } catch {}
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexa_exam_sound', String(next));
      } catch {}
      return next;
    });
  };

  // 1. Fetch Current User Profile
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setCurrentUserName(profile.full_name);
          const initials = profile.full_name
            .split(' ')
            .filter(Boolean)
            .slice(-2)
            .map((w: string) => w[0].toUpperCase())
            .join('');
          setCurrentUserInitials(initials || 'TS');
        }
        if (profile?.avatar_url) {
          setCurrentUserAvatarUrl(profile.avatar_url);
        }
      }
    }
    loadUser();
  }, []);

  // 2. Auto Join Room (Calls POST /api/rooms/join to officially register candidate in room_participants)
  useEffect(() => {
    let isCancelled = false;

    async function joinRoom() {
      if (!pin && !roomIdFromUrl) {
        setError('Thiếu mã PIN hoặc mã định danh phòng thi');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // If we have PIN, call official join API
        if (pin) {
          const res = await fetch('/api/rooms/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (!isCancelled) {
              setError(errData.error || 'Không thể tham gia phòng thi.');
              setLoading(false);
            }
            return;
          }

          const data = await res.json();
          if (!isCancelled && data.success) {
            const roomData: RoomData = {
              id: data.roomId,
              roomCode: data.roomCode || pin,
              title: data.roomTitle || 'Phòng Khảo Thí Trực Tiếp',
              assessmentId: data.assessmentId,
              assessmentTitle: data.assessmentTitle || 'Bài thi khảo thí',
              durationMinutes: data.durationMinutes || 45,
              passingScore: 70,
              hasStarted: data.hasStarted || false,
              startedAt: data.startedAt,
              themeId: data.themeId || 'minimal_white',
            };
            setRoom(roomData);

            // If exam has already started when candidate joins, redirect immediately
            if (data.hasStarted) {
              setStartingNotice(true);
              router.push(
                `/personal/take/${data.assessmentId}?roomId=${data.roomId}&pin=${data.roomCode || pin}`
              );
              return;
            }
          }
        } else if (roomIdFromUrl) {
          // Fallback if entering with roomId
          const res = await fetch(`/api/rooms/status?roomId=${roomIdFromUrl}`);
          const data = await res.json();
          if (!isCancelled && data.success && data.room) {
            setRoom(data.room);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message || 'Lỗi kết nối máy chủ');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    joinRoom();

    return () => {
      isCancelled = true;
    };
  }, [pin, roomIdFromUrl, router]);

  // 2.1. Prefetch Assessment Data in Background for 0s Delay
  useEffect(() => {
    const targetAsmId = room?.assessmentId || assessmentIdFromUrl;
    const targetRoomId = room?.id || roomIdFromUrl;
    if (!targetAsmId) return;

    const cacheKey = targetRoomId
      ? `prefetched_assessment_${targetAsmId}_${targetRoomId}`
      : `prefetched_assessment_${targetAsmId}`;

    try {
      if (sessionStorage.getItem(cacheKey)) return;
    } catch {}

    const controller = new AbortController();
    async function prefetch() {
      try {
        const qp = new URLSearchParams();
        if (targetRoomId) qp.set('roomId', targetRoomId);
        const pCode = room?.roomCode || pin;
        if (pCode) qp.set('pin', pCode);

        const res = await fetch(`/api/assessments/${targetAsmId}?${qp.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const json = await res.json();
          if (json.assessment && json.items && json.items.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify(json));
            sessionStorage.setItem(`prefetched_assessment_${targetAsmId}`, JSON.stringify(json));
          }
        }
      } catch {}
    }
    prefetch();
    return () => controller.abort();
  }, [room?.assessmentId, assessmentIdFromUrl, room?.id, roomIdFromUrl, room?.roomCode, pin]);

  // 3. Status Polling (Fallback for participant roster & room status changes)
  const fetchStatus = useCallback(async () => {
    const activeRoomId = room?.id || roomIdFromUrl;
    const activePin = room?.roomCode || pin;
    if (!activeRoomId && !activePin) return;

    try {
      const res = await fetch(`/api/rooms/status?roomId=${activeRoomId}&pin=${activePin}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && data.room) {
        setRoom((prev) => ({
          ...prev,
          ...data.room,
          themeId: data.room.themeId || prev?.themeId || 'minimal_white',
        }));

        const list: Participant[] = data.participants || [];
        setParticipants(list);

        // Check future scheduled start
        if (data.room.scheduledStart) {
          const diff = Math.max(
            0,
            Math.floor((new Date(data.room.scheduledStart).getTime() - Date.now()) / 1000)
          );
          setCountdownSeconds(diff > 0 ? diff : null);
        } else {
          setCountdownSeconds(null);
        }

        // Auto-redirect if host starts exam
        if (data.room.hasStarted || data.room.status === 'IN_PROGRESS') {
          setStartingNotice(true);
          const targetAsmId = data.room.assessmentId || assessmentIdFromUrl || 'baseline';
          const currentTheme = data.room.themeId || room?.themeId || 'minimal_white';
          setTimeout(() => {
            router.push(
              `/personal/take/${targetAsmId}?roomId=${data.room.id}&pin=${data.room.roomCode || pin}&theme=${currentTheme}`
            );
          }, 300);
        }
      }
    } catch {}
  }, [room?.id, room?.roomCode, roomIdFromUrl, pin, assessmentIdFromUrl, router, room?.themeId]);

  // Run status polling every 12 seconds as a lightweight resilient backup (Presence handles real-time roster)
  useEffect(() => {
    if (!room?.id) return;
    fetchStatus();
    const timer = setInterval(fetchStatus, 12000);
    return () => clearInterval(timer);
  }, [room?.id, fetchStatus]);

  // 4. Realtime Supabase Channel (Supabase Realtime Presence & Instant <100ms events)
  useEffect(() => {
    const activeRoomId = room?.id || roomIdFromUrl;
    if (!activeRoomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${activeRoomId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const onlineMap = new Map<string, Participant>();

        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p?.userId && !onlineMap.has(p.userId)) {
              onlineMap.set(p.userId, {
                id: p.id || p.userId,
                userId: p.userId,
                fullName: p.fullName || 'Thí sinh',
                initials: p.initials || 'TS',
                avatarUrl: p.avatarUrl || null,
                status: p.status || 'WAITING',
                isReady: p.isReady ?? true,
              });
            }
          });
        });

        const presenceList = Array.from(onlineMap.values());
        if (presenceList.length > 0) {
          setParticipants((prev) => {
            const existingMap = new Map(prev.map((it) => [it.userId, it]));
            presenceList.forEach((np) => {
              existingMap.set(np.userId, {
                ...(existingMap.get(np.userId) || {}),
                ...np,
              });
            });
            return Array.from(existingMap.values());
          });
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const hasOther = newPresences.some((p: any) => p.userId && p.userId !== currentUserId);
        if (hasOther) {
          examSound.play('JOIN', soundEnabled);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = new Set(leftPresences.map((p: any) => p.userId).filter(Boolean));
        if (leftIds.size > 0) {
          setParticipants((prev) => prev.filter((p) => !leftIds.has(p.userId)));
          leftIds.forEach((id) => {
            physicsDataRef.current.delete(id);
            bubbleElementsRef.current.delete(id);
          });
        }
      })
      .on('broadcast', { event: 'START_COUNTDOWN' }, (payload) => {
        const secs = Number(payload.payload?.seconds) || 5;
        setIncomingCountdown(secs);
        examSound.play('COUNTDOWN', soundEnabled);
      })
      .on('broadcast', { event: 'CANCEL_COUNTDOWN' }, () => {
        setIncomingCountdown(null);
      })
      .on('broadcast', { event: 'PARTICIPANT_REACTION' }, (payload) => {
        const data = payload.payload;
        if (data?.reactionType) {
          examSound.play('REACTION', soundEnabled);
          setFloatingReactions((prev) => [
            {
              id: crypto.randomUUID(),
              reactionType: data.reactionType,
              timestamp: Date.now(),
              xPercent: 15 + Math.random() * 70,
            },
            ...prev.slice(0, 8),
          ]);
        }
      })
      .on('broadcast', { event: 'ROOM_STATE_CHANGE' }, (payload) => {
        const action = payload.payload?.action;
        if (action === 'START') {
          examSound.play('START', soundEnabled);
          setIncomingCountdown(0);
          setStartingNotice(true);
          const targetAsmId = room?.assessmentId || assessmentIdFromUrl || 'baseline';
          const roomCode = room?.roomCode || pin;
          const currentTheme = room?.themeId || 'minimal_white';
          setTimeout(() => {
            router.push(
              `/personal/take/${targetAsmId}?roomId=${activeRoomId}&pin=${roomCode}&theme=${currentTheme}`
            );
          }, 250);
        } else if (action === 'THEME_UPDATE' && payload.payload?.payload?.themeId) {
          const nextTheme = payload.payload.payload.themeId;
          setRoom((prev) => (prev ? { ...prev, themeId: nextTheme } : prev));
        } else {
          fetchStatus();
        }
      })
      .on('broadcast', { event: 'PARTICIPANT_JOIN' }, (payload) => {
        const newP = payload.payload;
        if (newP && newP.userId !== currentUserId) {
          examSound.play('JOIN', soundEnabled);
        }
      })
      .on('broadcast', { event: 'PARTICIPANT_LEAVE' }, (payload) => {
        const leftId = payload.payload?.userId;
        if (leftId) {
          setParticipants((prev) => prev.filter((p) => p.userId !== leftId && p.id !== leftId));
          physicsDataRef.current.delete(leftId);
          bubbleElementsRef.current.delete(leftId);
        }
      })
      .on('broadcast', { event: 'PARTICIPANT_STATUS_CHANGE' }, (payload) => {
        const updatedUserId = payload.payload?.userId;
        const newStatus = payload.payload?.status;
        if (updatedUserId && newStatus) {
          setParticipants((prev) =>
            prev.map((p) => (p.userId === updatedUserId ? { ...p, status: newStatus } : p))
          );
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          // Track candidate in Realtime Presence memory
          try {
            await channel.track({
              id: currentUserId,
              userId: currentUserId,
              fullName: currentUserName,
              initials: currentUserInitials,
              avatarUrl: currentUserAvatarUrl,
              isReady: true,
              status: 'WAITING',
              joinedAt: Date.now(),
            });
          } catch {}

          // Broadcast presence immediately to host
          channel.send({
            type: 'broadcast',
            event: 'PARTICIPANT_JOIN',
            payload: {
              userId: currentUserId,
              fullName: currentUserName,
              initials: currentUserInitials,
              avatarUrl: currentUserAvatarUrl,
            },
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [
    room?.id,
    room?.themeId,
    roomIdFromUrl,
    room?.assessmentId,
    room?.roomCode,
    assessmentIdFromUrl,
    pin,
    currentUserId,
    currentUserName,
    currentUserInitials,
    currentUserAvatarUrl,
    soundEnabled,
    router,
    fetchStatus,
  ]);

  // 5. Incoming Countdown Timer hook
  useEffect(() => {
    if (incomingCountdown === null) return;
    if (incomingCountdown <= 0) {
      setStartingNotice(true);
      return;
    }

    const t = setInterval(() => {
      setIncomingCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(t);
          setStartingNotice(true);
          return 0;
        }
        examSound.play('COUNTDOWN', soundEnabled);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [incomingCountdown, soundEnabled]);

  // 6. Floating Reactions cleanup
  useEffect(() => {
    if (floatingReactions.length === 0) return;
    const t = setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => Date.now() - r.timestamp < 3000));
    }, 3000);
    return () => clearTimeout(t);
  }, [floatingReactions]);

  // 7. Synchronize 2D Physics Nodes with Participants
  useEffect(() => {
    const arena = arenaRef.current;
    const arenaW = arena?.clientWidth || 700;
    const arenaH = arena?.clientHeight || 450;

    const activeKeys = new Set<string>();

    participants.forEach((p, idx) => {
      const key = p.id || p.userId || String(idx);
      activeKeys.add(key);

      if (!physicsDataRef.current.has(key)) {
        const margin = 20;
        const initX = Math.random() * Math.max(20, arenaW - 190) + margin;
        const initY = Math.random() * Math.max(20, arenaH - 80) + margin;
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.45 + Math.random() * 0.35;

        physicsDataRef.current.set(key, {
          x: initX,
          y: initY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 160,
          h: 40,
        });
      }
    });

    // Remove deleted participants
    for (const key of physicsDataRef.current.keys()) {
      if (!activeKeys.has(key)) {
        physicsDataRef.current.delete(key);
        bubbleElementsRef.current.delete(key);
      }
    }
  }, [participants]);

  // 8. 60fps Physics Animation Loop (Wall & Inter-bubble Bouncing)
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const arena = arenaRef.current;
      if (arena) {
        const arenaW = arena.clientWidth;
        const arenaH = arena.clientHeight;

        if (arenaW > 60 && arenaH > 60) {
          const keys = Array.from(physicsDataRef.current.keys());
          const items = keys.map((k) => ({
            key: k,
            data: physicsDataRef.current.get(k)!,
            el: bubbleElementsRef.current.get(k),
          }));

          // 1. Position update & wall collisions
          for (const item of items) {
            const { data, el } = item;
            if (el) {
              data.w = el.offsetWidth || data.w;
              data.h = el.offsetHeight || data.h;
            }

            data.x += data.vx;
            data.y += data.vy;

            const margin = 10;
            // Left & Right
            if (data.x <= margin) {
              data.x = margin;
              data.vx = Math.abs(data.vx);
            } else if (data.x + data.w >= arenaW - margin) {
              data.x = Math.max(margin, arenaW - margin - data.w);
              data.vx = -Math.abs(data.vx);
            }

            // Top & Bottom
            if (data.y <= margin) {
              data.y = margin;
              data.vy = Math.abs(data.vy);
            } else if (data.y + data.h >= arenaH - margin) {
              data.y = Math.max(margin, arenaH - margin - data.h);
              data.vy = -Math.abs(data.vy);
            }
          }

          // 2. Inter-bubble collisions (elastic repulsion)
          for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
              const b1 = items[i].data;
              const b2 = items[j].data;

              const cx1 = b1.x + b1.w / 2;
              const cy1 = b1.y + b1.h / 2;
              const cx2 = b2.x + b2.w / 2;
              const cy2 = b2.y + b2.h / 2;

              const dx = cx2 - cx1;
              const dy = cy2 - cy1;
              const dist = Math.sqrt(dx * dx + dy * dy);

              const minDist = (b1.w + b2.w) / 4 + (b1.h + b2.h) / 4 + 8;

              if (dist < minDist && dist > 0.01) {
                const nx = dx / dist;
                const ny = dy / dist;

                const kx = b1.vx - b2.vx;
                const ky = b1.vy - b2.vy;
                const p = nx * kx + ny * ky;

                b1.vx -= p * nx;
                b1.vy -= p * ny;
                b2.vx += p * nx;
                b2.vy += p * ny;

                const overlap = (minDist - dist) * 0.5;
                b1.x -= nx * overlap;
                b1.y -= ny * overlap;
                b2.x += nx * overlap;
                b2.y += ny * overlap;
              }
            }
          }

          // 3. Gentle speed damping / boosting & direct DOM update
          for (const item of items) {
            const { data, el } = item;
            const speed = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
            if (speed < 0.25) {
              data.vx = (data.vx || 0.3) * 1.2;
              data.vy = (data.vy || 0.3) * 1.2;
            } else if (speed > 1.1) {
              data.vx = (data.vx / speed) * 1.1;
              data.vy = (data.vy / speed) * 1.1;
            }

            if (el) {
              el.style.translate = `${data.x}px ${data.y}px`;
            }
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Send reaction to others
  const handleSendReaction = (type: 'WAVE' | 'HEART' | 'CHEER') => {
    examSound.play('REACTION', soundEnabled);
    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'PARTICIPANT_REACTION',
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          reactionType: type,
        },
      });
    } catch {}

    setFloatingReactions((prev) => [
      {
        id: crypto.randomUUID(),
        reactionType: type,
        timestamp: Date.now(),
        xPercent: 15 + Math.random() * 70,
      },
      ...prev.slice(0, 8),
    ]);
  };

  const handleCopyPin = () => {
    const rawPin = room?.roomCode || pin;
    if (!rawPin) return;
    navigator.clipboard.writeText(rawPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleLeaveRoom = async () => {
    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'PARTICIPANT_LEAVE',
        payload: {
          userId: currentUserId,
          fullName: currentUserName,
        },
      });
    } catch {}

    try {
      const activeRoomId = room?.id || roomIdFromUrl;
      const activePin = room?.roomCode || pin;
      await fetch('/api/rooms/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeRoomId, pin: activePin }),
      });
    } catch {}

    router.push('/personal/dashboard');
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeRoomId = room?.id || roomIdFromUrl;
      const activePin = room?.roomCode || pin;
      if (activeRoomId || activePin) {
        try {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'PARTICIPANT_LEAVE',
            payload: {
              userId: currentUserId,
              fullName: currentUserName,
            },
          });
        } catch {}

        try {
          navigator.sendBeacon?.(
            '/api/rooms/leave',
            JSON.stringify({ roomId: activeRoomId, pin: activePin })
          );
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [room?.id, roomIdFromUrl, room?.roomCode, pin, currentUserId, currentUserName]);

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in">
          <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
          <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Đang xác thực mã PIN và kết nối phòng chờ...
          </div>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-4 shadow-xs">
          <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{error}</div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Vui lòng kiểm tra lại mã PIN do Giám thị cung cấp hoặc xác nhận ca thi còn đang mở.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              href="/personal/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Về bảng điều khiển
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rawPin = room?.roomCode || pin;
  const themeStyles = getThemeStyles(room?.themeId);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${themeStyles.bg}`}>
      {/* ===================== HEADER ===================== */}
      <header className={`shrink-0 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 relative z-20 backdrop-blur-sm transition-colors duration-300 ${themeStyles.header}`}>
        {/* Left: Live indicator + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono hidden sm:block">Live</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
              {room?.title || 'Phòng Khảo Thí Trực Tiếp'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{room?.durationMinutes || 45} phút</span>
              <span className="text-slate-300 dark:text-neutral-600">•</span>
              <Users className="w-3 h-3 shrink-0 text-blue-500" />
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{participants.length} trong sảnh</span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Network status */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            <Wifi className="w-3 h-3" />
            <span>Ổn định</span>
          </div>

          {/* Help / Rules */}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Quy chế làm bài"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Sound */}
          <button
            type="button"
            onClick={toggleSound}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              soundEnabled
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-900'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* PIN */}
          <button
            type="button"
            onClick={handleCopyPin}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-colors cursor-pointer group"
            title="Sao chép mã PIN"
          >
            <span className="text-[11px] font-mono font-bold tracking-widest">
              {rawPin.length === 6 ? `${rawPin.slice(0, 3)} ${rawPin.slice(3)}` : rawPin}
            </span>
            {copiedPin ? (
              <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            )}
          </button>

          {/* Leave */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Rời phòng"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Starting Banner */}
      {startingNotice && (
        <div className="shrink-0 mx-4 sm:mx-6 lg:mx-8 mt-3 p-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg relative z-20">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Giám thị đã phát đề! Đang chuyển vào màn hình làm bài...</span>
        </div>
      )}

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 flex flex-col relative z-10 w-full">
        {/* Status Hero - floating above */}
        <div className="text-center py-3 sm:py-4 relative z-20">
          {countdownSeconds !== null ? (
            <>
              <span className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-neutral-500 font-mono block">
                Ca thi mở sau
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatCountdown(countdownSeconds)}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-semibold">Đang chờ Giám thị phát đề</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-neutral-500">
                Màn hình làm bài sẽ tự động mở khi Giám thị phát đề.
              </p>
            </div>
          )}
        </div>

        {/* ===================== ARENA — full bleed ===================== */}
        <div
          ref={arenaRef}
          className="arena-depth flex-1 w-full relative overflow-hidden"
        >
          {/* Floating Reactions */}
          {floatingReactions.map((re) => (
            <div
              key={re.id}
              className="absolute pointer-events-none z-30 animate-reaction-rise"
              style={{ left: `${re.xPercent}%`, bottom: '80px' }}
            >
              <div className="w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-800/95 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center justify-center border border-slate-100 dark:border-zinc-700">
                {re.reactionType === 'WAVE' ? (
                  <Hand className="w-5 h-5 text-amber-500 fill-amber-500" />
                ) : re.reactionType === 'HEART' ? (
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-violet-500 fill-violet-500" />
                )}
              </div>
            </div>
          ))}

          {/* Bubble Canvas */}
          <div className="absolute inset-0">
            {participants.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Bạn đã vào phòng</p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500">Đang chờ các thí sinh khác tham gia...</p>
                </div>
              </div>
            ) : (
              participants.map((p, idx) => {
                const isMe = p.userId === currentUserId;
                const palette = getBubblePalette(p.userId || p.fullName);
                const key = p.id || p.userId || String(idx);
                const avatar = isMe ? (p.avatarUrl || currentUserAvatarUrl) : p.avatarUrl;

                return (
                  <div
                    key={key}
                    ref={(el) => {
                      if (el) bubbleElementsRef.current.set(key, el);
                      else bubbleElementsRef.current.delete(key);
                    }}
                    className="absolute top-0 left-0 will-change-transform cursor-default select-none bubble-pop-in"
                    style={{ translate: '24px 24px' }}
                  >
                    <div
                      className={`inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full text-[13px] font-semibold ${ 
                        isMe
                          ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] ring-4 ring-blue-600/15'
                          : 'bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
                      }`}
                    >
                      {/* Avatar */}
                      {avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={avatar}
                          alt={p.fullName}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isMe
                              ? 'bg-white/25 text-white'
                              : `${palette.avatarBg} text-white`
                          }`}
                        >
                          {p.initials || 'HV'}
                        </span>
                      )}

                      {/* Name */}
                      <span className="max-w-[120px] sm:max-w-[150px] truncate">
                        {p.fullName}
                        {isMe && <span className="opacity-60 font-normal ml-1 text-[11px]">(bạn)</span>}
                      </span>

                      {/* Live dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isMe ? 'bg-white/70 animate-pulse' : palette.dot
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reaction Buttons — icon-only, fill đặc ruột, bottom-right cluster */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSendReaction('WAVE')}
              className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:scale-105 flex items-center justify-center transition-all active:scale-90 cursor-pointer group"
              title="Vẫy tay"
            >
              <Hand className="w-5 h-5 text-amber-500 fill-amber-500 transition-transform group-hover:scale-110" />
            </button>
            <button
              type="button"
              onClick={() => handleSendReaction('HEART')}
              className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:scale-105 flex items-center justify-center transition-all active:scale-90 cursor-pointer group"
              title="Gửi may mắn"
            >
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 transition-transform group-hover:scale-110" />
            </button>
            <button
              type="button"
              onClick={() => handleSendReaction('CHEER')}
              className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:scale-105 flex items-center justify-center transition-all active:scale-90 cursor-pointer group"
              title="Cổ vũ"
            >
              <Sparkles className="w-5 h-5 text-violet-500 fill-violet-500 transition-transform group-hover:scale-110" />
            </button>
          </div>

          {/* Participant count — bottom-left */}
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length} thí sinh</span>
          </div>
        </div>
      </main>

      {/* Footer — subtle watermark */}
      <footer className="shrink-0 text-center text-[10px] text-slate-200 dark:text-neutral-700 font-mono py-1.5 relative z-10">
        NEXA • Khảo thí chuẩn hóa 5 miền năng lực số
      </footer>

      {/* =================== RULES MODAL =================== */}
      {showRulesModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowRulesModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111114] shadow-2xl ring-1 ring-black/10 dark:ring-white/10 p-6 space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Quy Chế Làm Bài</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              {[
                'Không chuyển tab hoặc thoát toàn màn hình trong suốt thời gian làm bài.',
                'Đáp án được tự động lưu sau mỗi lần chọn.',
                'Hệ thống sẽ đếm ngược và tự động mở bài thi khi Giám thị phát đề.',
                'Bài thi tự động thu và khóa câu trả lời khi hết giờ.',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 text-center space-y-0.5">
                <Clock className="w-3.5 h-3.5 mx-auto text-slate-400" />
                <span className="block font-bold text-neutral-800 dark:text-neutral-200">{room?.durationMinutes || 45} phút</span>
                <span className="block text-[10px]">Thời lượng</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 text-center space-y-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 mx-auto text-blue-500" />
                <span className="block font-bold text-blue-600 dark:text-blue-400">{room?.passingScore || 70}%</span>
                <span className="block text-[10px]">Ngưỡng đạt</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 text-center space-y-0.5">
                <ShieldCheck className="w-3.5 h-3.5 mx-auto text-slate-400" />
                <span className="block font-bold text-neutral-800 dark:text-neutral-200">Thực tế</span>
                <span className="block text-[10px]">Giám sát</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Đã hiểu, sẵn sàng!
            </button>
          </div>
        </div>
      )}

      {/* =================== COUNTDOWN OVERLAY =================== */}
      {incomingCountdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-md animate-in fade-in duration-300 text-white p-6">
          <div className="text-center space-y-6 max-w-xs">
            <span className="text-[11px] uppercase tracking-[0.2em] text-blue-400 font-mono font-bold block">
              Giám thị đang phát đề
            </span>
            <div className="text-[120px] sm:text-[160px] font-black tracking-tighter text-white tabular-nums leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {incomingCountdown > 0 ? incomingCountdown : '!'}
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {incomingCountdown > 0
                ? `Bắt đầu sau ${incomingCountdown} giây — hãy sẵn sàng!`
                : 'Đang mở bài thi...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Đang tải phòng chờ...</div>}>
      <WaitingRoomContent />
    </Suspense>
  );
}
