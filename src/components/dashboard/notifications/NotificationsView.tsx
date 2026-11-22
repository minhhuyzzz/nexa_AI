'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Check,
  Award,
  BookOpen,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Loader2,
  RefreshCw,
  Inbox,
  ExternalLink,
} from 'lucide-react';

export type NotificationCategory = 'ALL' | 'ASSIGNMENT' | 'GRADE' | 'ORGANIZATION' | 'SYSTEM';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  category: string;
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsViewProps {
  workspaceType: 'PERSONAL' | 'ORGANIZATION';
  orgSlug?: string;
  orgName?: string;
}

export function NotificationsView({
  workspaceType,
  orgSlug,
  orgName,
}: NotificationsViewProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch (e) {
      console.warn('Lỗi tải thông báo:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<NotificationCategory, { total: number; unread: number }> = {
      ALL: { total: notifications.length, unread: unreadCount },
      ASSIGNMENT: { total: 0, unread: 0 },
      GRADE: { total: 0, unread: 0 },
      ORGANIZATION: { total: 0, unread: 0 },
      SYSTEM: { total: 0, unread: 0 },
    };

    for (const n of notifications) {
      let cat: NotificationCategory = 'SYSTEM';
      if (n.category === 'ASSIGNMENT') cat = 'ASSIGNMENT';
      else if (n.category === 'GRADE') cat = 'GRADE';
      else if (n.category === 'CAMPAIGN' || n.category === 'ORGANIZATION') cat = 'ORGANIZATION';
      else cat = 'SYSTEM';

      counts[cat].total += 1;
      if (!n.is_read) {
        counts[cat].unread += 1;
      }
    }

    return counts;
  }, [notifications, unreadCount]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'ASSIGNMENT' && n.category !== 'ASSIGNMENT') return false;
      if (activeTab === 'GRADE' && n.category !== 'GRADE') return false;
      if (activeTab === 'ORGANIZATION' && n.category !== 'ORGANIZATION' && n.category !== 'CAMPAIGN') return false;
      if (activeTab === 'SYSTEM' && n.category !== 'SYSTEM' && n.category !== 'SECURITY') return false;

      // Unread only filter
      if (unreadOnly && n.is_read) return false;

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = n.title?.toLowerCase().includes(q);
        const msgMatch = n.message?.toLowerCase().includes(q);
        if (!titleMatch && !msgMatch) return false;
      }

      return true;
    });
  }, [notifications, activeTab, unreadOnly, searchQuery]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (e) {
      console.warn('Lỗi đánh dấu tất cả đã đọc:', e);
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUpdatingId(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.warn('Lỗi đánh dấu đã đọc:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCardClick = (n: NotificationRecord) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    if (n.link_url) {
      router.push(n.link_url);
    }
  };

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'ASSIGNMENT':
        return {
          label: 'Bài thi',
          icon: BookOpen,
          badgeClass:
            'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/40',
          iconContainerClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
        };
      case 'GRADE':
        return {
          label: 'Điểm số',
          icon: Award,
          badgeClass:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
          iconContainerClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
        };
      case 'ORGANIZATION':
      case 'CAMPAIGN':
        return {
          label: 'Tổ chức',
          icon: Building2,
          badgeClass:
            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40',
          iconContainerClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
        };
      default:
        return {
          label: 'Hệ thống',
          icon: ShieldCheck,
          badgeClass:
            'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
          iconContainerClass: 'bg-slate-100 text-slate-600 dark:bg-zinc-850 dark:text-zinc-400',
        };
    }
  };

  const tabs: { key: NotificationCategory; label: string; icon: React.ElementType }[] = [
    { key: 'ALL', label: 'Tất cả', icon: Bell },
    { key: 'ASSIGNMENT', label: 'Bài thi', icon: BookOpen },
    { key: 'GRADE', label: 'Điểm số', icon: Award },
    { key: 'ORGANIZATION', label: 'Tổ chức', icon: Building2 },
    { key: 'SYSTEM', label: 'Hệ thống', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Thông báo
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                {unreadCount} mới
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            {workspaceType === 'ORGANIZATION'
              ? `Thông báo hoạt động, giao bài và phê duyệt trong ${orgName || 'tổ chức'}`
              : 'Theo dõi bài khảo thí được giao, kết quả điểm số và thông báo hệ thống'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            title="Làm mới danh sách"
            aria-label="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key];

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{tab.label}</span>
              {count.unread > 0 ? (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {count.unread}
                </span>
              ) : count.total > 0 ? (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400'
                  }`}
                >
                  {count.total}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Search & Secondary Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung thông báo..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              unreadOnly
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Chỉ chưa đọc</span>
          </button>
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 animate-pulse flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-500">
            <Inbox className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Không có thông báo nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              {unreadOnly
                ? 'Bạn không có thông báo chưa đọc nào trong mục này.'
                : searchQuery
                ? 'Không tìm thấy thông báo khớp với từ khóa tìm kiếm.'
                : 'Các thông báo mới về bài khảo thí, điểm số và hoạt động sẽ hiển thị tại đây.'}
            </p>
          </div>
          {(unreadOnly || searchQuery) && (
            <button
              onClick={() => {
                setUnreadOnly(false);
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const meta = getCategoryMeta(item.category);
            const CategoryIcon = meta.icon;
            const formattedDate = new Date(item.created_at).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`group relative p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  !item.is_read
                    ? 'bg-blue-50/20 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800'
                    : 'bg-white dark:bg-[#111114] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category icon */}
                  <div
                    className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.iconContainerClass}`}
                  >
                    <CategoryIcon className="w-4 h-4" strokeWidth={1.75} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {item.title}
                        </h4>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Action Links / Buttons */}
                    <div className="flex items-center gap-3 mt-3">
                      {item.link_url && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          <span>Xem chi tiết</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                        </span>
                      )}

                      {!item.is_read && (
                        <button
                          onClick={(e) => markAsRead(item.id, e)}
                          disabled={updatingId === item.id}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Đánh dấu đã đọc</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
