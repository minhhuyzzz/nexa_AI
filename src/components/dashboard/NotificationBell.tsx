'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Award, MessageSquare, BookOpen, Clock, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'grade' | 'feedback' | 'reward' | 'exam';
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  href?: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'grade',
    title: 'Kết quả bài khảo sát',
    description: 'Bài "Đánh giá năng lực số chuẩn quốc gia" của bạn đã được chấm: 88/100 (Đạt chuẩn).',
    timeAgo: '15 phút trước',
    isRead: false,
    href: '/learner/assessments/asm-01/result',
  },
  {
    id: 'notif-2',
    type: 'feedback',
    title: 'Nhận xét từ giảng viên',
    description: 'TS. Nguyễn Văn Hùng đã gửi nhận xét bài tập trích xuất dữ liệu của bạn trong lớp DHQG24.',
    timeAgo: '2 giờ trước',
    isRead: false,
    href: '/learner/groups',
  },
  {
    id: 'notif-3',
    type: 'reward',
    title: 'Thưởng điểm học tập',
    description: 'Bạn đã hoàn thành module "Kiểm chứng độ tin cậy thông tin" và nhận +30 điểm.',
    timeAgo: 'Hôm qua',
    isRead: true,
    href: '/learner/learning-path',
  },
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'grade':
        return <Award className="w-4 h-4 text-sky-600" strokeWidth={1.75} />;
      case 'feedback':
        return <MessageSquare className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />;
      case 'reward':
        return <BookOpen className="w-4 h-4 text-amber-600" strokeWidth={1.75} />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" strokeWidth={1.75} />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Thông báo"
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-600 ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 text-xs cursor-pointer ${
                    !item.isRead ? 'bg-sky-50/20' : ''
                  }`}
                >
                  <div className="mt-0.5 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900 truncate">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {item.timeAgo}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
