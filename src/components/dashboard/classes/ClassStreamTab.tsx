'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Pin,
  Send,
  Trash2,
  FileText,
  Paperclip,
  ArrowRight,
  Loader2,
  Megaphone,
  MessageSquare,
  Plus,
  X,
  Lock,
  MoreHorizontal,
  Reply,
} from 'lucide-react';

export interface PostReply {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  is_author_manager?: boolean;
  author?: {
    id: string;
    nickname?: string;
    email?: string;
    role?: string;
  };
}

export interface ClassPostItem {
  id: string;
  class_id: string;
  author_id: string;
  title?: string | null;
  content: string;
  post_type: 'POST' | 'ANNOUNCEMENT' | 'SYSTEM';
  is_pinned: boolean;
  is_author_manager?: boolean;
  linked_assignment_id?: string | null;
  linked_file_id?: string | null;
  created_at: string;
  author?: {
    id: string;
    nickname?: string;
    email?: string;
    role?: string;
  };
  linked_assignment?: {
    id: string;
    deadline?: string | null;
    assessment?: {
      id: string;
      title: string;
      duration_minutes?: number;
      passing_score?: number;
    };
  };
  linked_file?: {
    id: string;
    file_name: string;
    file_url: string;
    file_size_bytes?: number;
    file_type?: string;
  };
  replies?: PostReply[];
}

interface ClassStreamTabProps {
  classId: string;
  role: 'EVALUATOR' | 'LEARNER';
  currentUserId: string;
  onNavigateTab?: (tab: 'stream' | 'assignments' | 'materials' | 'members') => void;
}

type StreamTab = 'ALL' | 'ANNOUNCEMENTS' | 'DISCUSSIONS';

interface FlatChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorMonogram: string;
  isAuthorManager: boolean;
  content: string;
  createdAt: string;
  quote?: {
    author: string;
    text: string;
  };
  originalPostId: string;
  isReply?: boolean;
}

export function ClassStreamTab({
  classId,
  role,
  currentUserId,
  onNavigateTab,
}: ClassStreamTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<StreamTab>('ALL');
  const [posts, setPosts] = useState<ClassPostItem[]>([]);
  const [allowMemberPosts, setAllowMemberPosts] = useState(true);
  const [loading, setLoading] = useState(true);

  // Announcement Composer State (Dành cho Quản trị viên phát thông báo chính thức)
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [pinToTop, setPinToTop] = useState(true);
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  // Group Chat Input & Interaction State
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
    content: string;
  } | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        if (typeof data.allowMemberPosts === 'boolean') {
          setAllowMemberPosts(data.allowMemberPosts);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching stream posts:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Click outside to close active menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-chat-menu]')) {
        setActiveMenuPostId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Announcements list (Thông báo Quản lý)
  const announcements = useMemo(
    () => posts.filter((p) => p.post_type === 'ANNOUNCEMENT' || p.is_pinned),
    [posts]
  );

  // Discussions list (Bài thảo luận trao đổi)
  const discussions = useMemo(
    () => posts.filter((p) => p.post_type !== 'ANNOUNCEMENT' && !p.is_pinned),
    [posts]
  );

  // Flattened Chat Stream: gộp toàn bộ tin nhắn thảo luận và replies theo thứ tự thời gian tăng dần
  const chatMessages = useMemo(() => {
    const result: FlatChatMessage[] = [];

    discussions.forEach((post) => {
      let quote: { author: string; text: string } | undefined = undefined;
      let mainContent = post.content;

      if (mainContent.startsWith('> @')) {
        const splitIdx = mainContent.indexOf('\n\n');
        if (splitIdx !== -1) {
          const quotePart = mainContent.slice(0, splitIdx);
          mainContent = mainContent.slice(splitIdx + 2);
          const match = quotePart.match(/^> @([^:]+):\s*(.*)$/);
          if (match) {
            quote = { author: match[1], text: match[2] };
          }
        }
      }

      const postAuthorName = post.author?.nickname || 'Thành viên';
      result.push({
        id: post.id,
        authorId: post.author_id,
        authorName: postAuthorName,
        authorMonogram: (postAuthorName[0] || 'N').toUpperCase(),
        isAuthorManager: Boolean(post.is_author_manager),
        content: mainContent,
        createdAt: post.created_at,
        quote,
        originalPostId: post.id,
        isReply: false,
      });

      // Gộp các reply cũ từ DB vào luồng chat chung
      (post.replies || []).forEach((rep) => {
        const repAuthorName = rep.author?.nickname || 'Thành viên';
        result.push({
          id: rep.id,
          authorId: rep.author_id,
          authorName: repAuthorName,
          authorMonogram: (repAuthorName[0] || 'N').toUpperCase(),
          isAuthorManager: Boolean(rep.is_author_manager),
          content: rep.content,
          createdAt: rep.created_at,
          quote: {
            author: postAuthorName,
            text: mainContent.slice(0, 80),
          },
          originalPostId: post.id,
          isReply: true,
        });
      });
    });

    // Sắp xếp tăng dần theo thời gian (cũ ở trên, mới ở dưới)
    return result.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [discussions]);

  // Nhóm tin nhắn theo ngày: "Hôm nay", "Hôm qua", hoặc "dd/mm/yyyy"
  const messageGroupsByDate = useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; items: FlatChatMessage[] }[] = [];

    chatMessages.forEach((msg) => {
      const d = new Date(msg.createdAt);
      const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      let dateLabel = d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      if (isToday) dateLabel = `Hôm nay • ${dateLabel}`;
      else if (isYesterday) dateLabel = `Hôm qua • ${dateLabel}`;

      let lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dateKey !== dateKey) {
        lastGroup = { dateKey, dateLabel, items: [] };
        groups.push(lastGroup);
      }
      lastGroup.items.push(msg);
    });

    return groups;
  }, [chatMessages]);

  // Cuộn xuống tin nhắn mới nhất trong khung chat
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'nearest',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [chatMessages.length, scrollToBottom]);

  // Tạo thông báo chính thức (Quản trị viên)
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = announcementContent.trim();
    if (!cleanContent) return;

    try {
      setIsSubmittingAnnouncement(true);
      const res = await fetch(`/api/classes/${classId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle.trim() || undefined,
          content: cleanContent,
          postType: 'ANNOUNCEMENT',
          isPinned: pinToTop,
        }),
      });

      if (res.ok) {
        setAnnouncementContent('');
        setAnnouncementTitle('');
        setShowAnnouncementComposer(false);
        fetchPosts();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể tạo thông báo');
      }
    } catch {
      alert('Đã xảy ra lỗi khi đăng thông báo');
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  // Gửi tin nhắn thảo luận nhóm
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || isSendingChat) return;

    try {
      setIsSendingChat(true);
      let finalContent = text;
      if (replyingTo) {
        finalContent = `> @${replyingTo.authorName}: ${replyingTo.content.slice(0, 100)}\n\n${text}`;
      }

      const res = await fetch(`/api/classes/${classId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalContent,
          postType: 'POST',
        }),
      });

      if (res.ok) {
        setChatInput('');
        setReplyingTo(null);
        await fetchPosts();
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể gửi tin nhắn');
      }
    } catch {
      alert('Đã xảy ra lỗi khi gửi tin nhắn');
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleTogglePin = async (postId: string, currentPin: boolean) => {
    try {
      const res = await fetch(`/api/classes/${classId}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPin }),
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;
    try {
      const res = await fetch(`/api/classes/${classId}/posts/${postId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatFullTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${time} • ${date}`;
    } catch {
      return dateStr;
    }
  };

  const canParticipateDiscussion = role === 'EVALUATOR' || allowMemberPosts;

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Header Filter Segment & Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-zinc-900 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'ALL'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>Tất cả</span>
            <span className="font-mono text-[10px] px-1.5 rounded bg-slate-100 dark:bg-zinc-800">
              {posts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ANNOUNCEMENTS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'ANNOUNCEMENTS'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Thông báo Quản lý</span>
            <span className="font-mono text-[10px] px-1.5 rounded bg-slate-100 dark:bg-zinc-800">
              {announcements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('DISCUSSIONS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'DISCUSSIONS'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Trao đổi nhóm</span>
            <span className="font-mono text-[10px] px-1.5 rounded bg-slate-100 dark:bg-zinc-800">
              {chatMessages.length}
            </span>
          </button>
        </div>

        {/* Evaluator Announcement Action Button */}
        {role === 'EVALUATOR' && (
          <button
            type="button"
            onClick={() => setShowAnnouncementComposer((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
              showAnnouncementComposer
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showAnnouncementComposer ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Đóng khung soạn</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Phát thông báo chính thức</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 2. Announcement Composer (Quản trị viên phát thông báo chính thức) */}
      {showAnnouncementComposer && role === 'EVALUATOR' && (
        <form
          onSubmit={handleCreateAnnouncement}
          className="p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Phát thông báo chính thức cho lớp
              </h3>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinToTop}
                onChange={(e) => setPinToTop(e.target.checked)}
                className="rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                <Pin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Ghim lên đầu bảng tin</span>
              </span>
            </label>
          </div>

          <input
            type="text"
            placeholder="Tiêu đề thông báo (ví dụ: Thông báo kiểm tra tuần 3, lịch nghỉ lễ...)..."
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            rows={3}
            required
            placeholder="Nhập nội dung thông báo chính thức hoặc hướng dẫn nộp bài cho các thành viên..."
            value={announcementContent}
            onChange={(e) => setAnnouncementContent(e.target.value)}
            className="w-full p-3.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAnnouncementComposer(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmittingAnnouncement || !announcementContent.trim()}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              {isSubmittingAnnouncement ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Đăng thông báo</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-14 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Đang nạp bảng tin...</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 3. Section A: Official Announcements (Thông báo chính thức từ Quản trị viên) */}
          {(activeSubTab === 'ALL' || activeSubTab === 'ANNOUNCEMENTS') && announcements.length > 0 && (
            <div className="space-y-3">
              {announcements.map((post) => {
                const isAuthor = post.author_id === currentUserId;
                const canDelete = isAuthor || role === 'EVALUATOR';
                const isPinned = post.is_pinned;
                const authorName = post.author?.nickname || 'Quản trị viên';
                const authorMonogram = (authorName ? authorName[0] : 'Q').toUpperCase();

                return (
                  <div
                    key={post.id}
                    className="p-4 sm:p-5 rounded-2xl border border-l-4 border-l-blue-600 border-slate-200/80 dark:border-zinc-800 bg-blue-50/20 dark:bg-blue-950/15 shadow-2xs transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold select-none shrink-0 shadow-2xs">
                          {authorMonogram}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                              {authorName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                              Quản trị viên
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white tracking-wider uppercase font-mono shadow-2xs">
                              THÔNG BÁO
                            </span>
                            {isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                <Pin className="w-2.5 h-2.5" />
                                <span>Đã ghim</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5 tabular-nums">
                            {formatFullTimestamp(post.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {role === 'EVALUATOR' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePin(post.id, isPinned)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isPinned
                                ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                            title={isPinned ? 'Bỏ ghim thông báo' : 'Ghim thông báo lên đầu'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {post.title && (
                        <h4 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                          {post.title}
                        </h4>
                      )}
                      <p className="whitespace-pre-line leading-relaxed text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                        {post.content}
                      </p>

                      {post.linked_assignment && (
                        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 flex items-center justify-between gap-3 mt-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 block truncate">
                                {post.linked_assignment.assessment?.title || 'Bài khảo thí'}
                              </span>
                              {post.linked_assignment.deadline && (
                                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                                  Hạn chót: {new Date(post.linked_assignment.deadline).toLocaleString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </div>
                          {role === 'LEARNER' ? (
                            <Link
                              href={`/assessments/${post.linked_assignment.assessment?.id}`}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-2xs"
                            >
                              <span>Làm bài</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigateTab?.('assignments')}
                              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-750 hover:bg-slate-50 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                            >
                              Xem bài nộp
                            </button>
                          )}
                        </div>
                      )}

                      {post.linked_file && (
                        <div className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 flex items-center justify-between gap-3 mt-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate">
                              {post.linked_file.file_name}
                            </span>
                          </div>
                          <a
                            href={post.linked_file.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-750 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors shrink-0"
                          >
                            Tải xuống
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. Section B: Single Card for All Group Discussions & Chat (GOM CHUNG 1 CARD DUY NHẤT) */}
          {(activeSubTab === 'ALL' || activeSubTab === 'DISCUSSIONS') && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col overflow-hidden">
              {/* Card Header */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/70 dark:bg-zinc-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Trao đổi &amp; Thảo luận nhóm
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 block font-normal">
                      Không gian hỏi bài và trao đổi trực tiếp giữa các thành viên ({chatMessages.length} tin nhắn)
                    </span>
                  </div>
                </div>

                {!canParticipateDiscussion && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Khóa trao đổi</span>
                  </span>
                )}
              </div>

              {/* Chat Messages Stream Area */}
              <div
                ref={chatContainerRef}
                className="p-4 sm:p-5 space-y-4 max-h-[500px] min-h-[180px] overflow-y-auto"
              >
                {chatMessages.length === 0 ? (
                  <div className="py-12 text-center space-y-1.5">
                    <MessageSquare className="w-7 h-7 text-slate-300 dark:text-zinc-600 mx-auto" strokeWidth={1.5} />
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Chưa có trao đổi nào
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 max-w-xs mx-auto">
                      Hãy gửi lời chào hoặc đặt câu hỏi đầu tiên với các bạn trong lớp.
                    </p>
                  </div>
                ) : (
                  messageGroupsByDate.map((group) => (
                    <div key={group.dateKey} className="space-y-3">
                      {/* Date Divider (Chỉ tách khi sang ngày khác) */}
                      <div className="flex items-center justify-center my-3">
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-neutral-400 font-mono tracking-tight shadow-2xs">
                          {group.dateLabel}
                        </span>
                      </div>

                      {/* Messages within this date */}
                      {group.items.map((msg) => {
                        const isMyMessage = msg.authorId === currentUserId;
                        const canDelete = isMyMessage || role === 'EVALUATOR';

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-2 group relative ${
                              isMyMessage ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {/* Other User Avatar */}
                            {!isMyMessage && (
                              <div
                                className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-extrabold select-none shrink-0 mt-0.5 ${
                                  msg.isAuthorManager
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border border-slate-200/60 dark:border-zinc-700'
                                }`}
                              >
                                {msg.authorMonogram}
                              </div>
                            )}

                            {/* Message Bubble + Meta Container */}
                            <div
                              className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${
                                isMyMessage ? 'items-end' : 'items-start'
                              }`}
                            >
                              {/* Other User Name & Manager Badge */}
                              {!isMyMessage && (
                                <div className="flex items-center gap-1.5 mb-1 pl-1">
                                  <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                                    {msg.authorName}
                                  </span>
                                  {msg.isAuthorManager && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                                      Quản trị viên
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 group/bubble">
                                {/* Action 3-dots Menu for My Message (bên trái bubble) */}
                                {isMyMessage && (
                                  <div className="relative" data-chat-menu>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveMenuPostId((prev) =>
                                          prev === msg.id ? null : msg.id
                                        )
                                      }
                                      className="p-1 rounded-lg text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title="Tùy chọn tin nhắn"
                                    >
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>

                                    {activeMenuPostId === msg.id && (
                                      <div className="absolute z-30 bottom-full mb-1 right-0 py-1 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 shadow-lg text-xs min-w-[120px] animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReplyingTo({
                                              id: msg.id,
                                              authorName: msg.authorName,
                                              content: msg.content,
                                            });
                                            setActiveMenuPostId(null);
                                            chatInputRef.current?.focus();
                                          }}
                                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                                        >
                                          <Reply className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                          <span>Phản hồi</span>
                                        </button>
                                        {canDelete && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDeletePost(msg.originalPostId);
                                              setActiveMenuPostId(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Xóa</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Actual Message Bubble */}
                                <div
                                  className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed transition-all shadow-2xs ${
                                    isMyMessage
                                      ? 'bg-blue-600 text-white rounded-tr-xs'
                                      : 'bg-slate-100 dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 rounded-tl-xs'
                                  }`}
                                >
                                  {/* Quoted Message Preview inside bubble */}
                                  {msg.quote && (
                                    <div
                                      className={`mb-1.5 pl-2 py-0.5 border-l-2 text-[11px] rounded-r-md ${
                                        isMyMessage
                                          ? 'border-blue-200 bg-blue-700/60 text-blue-100'
                                          : 'border-blue-500 bg-slate-200/70 dark:bg-zinc-700/60 text-slate-700 dark:text-zinc-300'
                                      }`}
                                    >
                                      <span className="font-bold block text-[10px] opacity-90">
                                        {msg.quote.author}
                                      </span>
                                      <span className="line-clamp-1 italic text-[10px] opacity-80">
                                        {msg.quote.text}
                                      </span>
                                    </div>
                                  )}

                                  <p className="whitespace-pre-line">{msg.content}</p>
                                </div>

                                {/* Action 3-dots Menu for Other User (bên phải bubble) */}
                                {!isMyMessage && (
                                  <div className="relative" data-chat-menu>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveMenuPostId((prev) =>
                                          prev === msg.id ? null : msg.id
                                        )
                                      }
                                      className="p-1 rounded-lg text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title="Tùy chọn tin nhắn"
                                    >
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>

                                    {activeMenuPostId === msg.id && (
                                      <div className="absolute z-30 bottom-full mb-1 left-0 py-1 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-700 shadow-lg text-xs min-w-[120px] animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReplyingTo({
                                              id: msg.id,
                                              authorName: msg.authorName,
                                              content: msg.content,
                                            });
                                            setActiveMenuPostId(null);
                                            chatInputRef.current?.focus();
                                          }}
                                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                                        >
                                          <Reply className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                          <span>Phản hồi</span>
                                        </button>
                                        {canDelete && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDeletePost(msg.originalPostId);
                                              setActiveMenuPostId(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Xóa</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Timestamp */}
                              <div
                                className={`text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5 tabular-nums ${
                                  isMyMessage ? 'pr-1' : 'pl-1'
                                }`}
                              >
                                {formatTimeOnly(msg.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar at Bottom of the Card */}
              <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-zinc-900/60">
                {canParticipateDiscussion ? (
                  <form onSubmit={handleSendChatMessage} className="space-y-1.5">
                    {/* Replying Banner Preview */}
                    {replyingTo && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <Reply className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">
                            Đang phản hồi <b className="font-bold">{replyingTo.authorName}</b>:{' '}
                            <span className="italic opacity-80">{replyingTo.content}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="p-0.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition cursor-pointer shrink-0 ml-2"
                          title="Hủy phản hồi"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Input Field with Send Button */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={chatInputRef}
                        type="text"
                        placeholder="Nhập nội dung trao đổi, tin nhắn thảo luận... (Nhấn Enter để gửi)"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                          }
                          if (e.key === 'Escape' && replyingTo) {
                            setReplyingTo(null);
                          }
                        }}
                        className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />

                      <button
                        type="submit"
                        disabled={isSendingChat || !chatInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20 shrink-0"
                      >
                        {isSendingChat ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Gửi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-850 text-center text-xs text-slate-500 dark:text-neutral-400 flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-zinc-800">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quản trị viên đã tạm khóa tính năng trao đổi thảo luận của thành viên.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
