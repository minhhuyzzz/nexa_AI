'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  EyeOff,
  Minimize2,
  WifiOff,
  Code2,
  AlertTriangle,
} from 'lucide-react';

export interface ProctoringEventItem {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userEmail: string;
  submissionId?: string | null;
  eventType: 'TAB_HIDDEN' | 'FULLSCREEN_EXIT' | 'FOCUS_LOST' | 'DEVTOOLS_OPENED' | 'RECONNECT' | string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details?: Record<string, unknown>;
  createdAt: string;
}

interface ProctoringTimelineProps {
  roomId: string;
}

export function ProctoringTimeline({ roomId }: ProctoringTimelineProps) {
  const [events, setEvents] = useState<ProctoringEventItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/events?roomId=${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.warn('Could not fetch proctoring events:', err);
    }
  }, [roomId]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'TAB_HIDDEN':
        return {
          icon: <EyeOff className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />,
          text: 'Rời tab bài thi',
          dotClass: 'bg-amber-500',
        };
      case 'FULLSCREEN_EXIT':
        return {
          icon: <Minimize2 className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />,
          text: 'Thoát toàn màn hình',
          dotClass: 'bg-amber-500',
        };
      case 'DEVTOOLS_OPENED':
        return {
          icon: <Code2 className="w-3.5 h-3.5 text-rose-600" strokeWidth={1.75} />,
          text: 'Mở DevTools',
          dotClass: 'bg-rose-600',
        };
      case 'RECONNECT':
        return {
          icon: <WifiOff className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />,
          text: 'Kết nối lại mạng',
          dotClass: 'bg-sky-500',
        };
      default:
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />,
          text: 'Mất tiêu điểm',
          dotClass: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Dòng Sự Kiện Giám Thị (Proctoring Timeline)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchEvents().finally(() => setLoading(false));
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title="Làm mới dòng sự kiện"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          Chưa ghi nhận sự kiện bất thường nào trong phiên thi.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {events.map((ev) => {
            const badge = getEventBadge(ev.eventType);
            return (
              <div
                key={ev.id}
                className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dotClass}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900 truncate">{ev.userName}</span>
                      <span className="text-[11px] text-slate-500 truncate">({ev.userEmail})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                      {badge.icon}
                      <span>{badge.text}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-400 shrink-0 ml-2">
                  <Clock className="w-3 h-3" strokeWidth={1.75} />
                  <span>{new Date(ev.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
