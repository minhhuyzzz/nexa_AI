'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Pin,
  Send,
  Trash2,
  MessageCircle,
  FileText,
  Paperclip,
  ArrowRight,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';

export interface PostReply {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
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

export function ClassStreamTab({ classId, role, currentUserId, onNavigateTab }: ClassStreamTabProps) {
  const [posts, setPosts] = useState<ClassPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/classes/${classId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          postType: isAnnouncement ? 'ANNOUNCEMENT' : 'POST',
          isPinned: isAnnouncement,
        }),
      });

      if (res.ok) {
        setContent('');
        setTitle('');
        setIsAnnouncement(false);
        fetchPosts();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể tạo bài viết');
      }
    } catch {
      alert('Đã xảy ra lỗi khi đăng bài');
    } finally {
      setIsSubmitting(false);
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
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      const res = await fetch(`/api/classes/${classId}/posts/${postId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleSendReply = async (postId: string) => {
    const replyText = replyInput[postId]?.trim();
    if (!replyText) return;

    try {
      setSubmittingReply((prev) => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/classes/${classId}/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });
      if (res.ok) {
        setReplyInput((prev) => ({ ...prev, [postId]: '' }));
        fetchPosts();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Composer Card */}
      <form
        onSubmit={handleCreatePost}
        className="p-4 rounded-md border border-slate-200 bg-white space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800">
            {role === 'EVALUATOR' ? 'Đăng thông báo hoặc trao đổi' : 'Thảo luận với nhóm'}
          </span>

          {role === 'EVALUATOR' && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Ghim thông báo quan trọng</span>
            </label>
          )}
        </div>

        {isAnnouncement && (
          <input
            type="text"
            placeholder="Tiêu đề thông báo..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
          />
        )}

        <textarea
          rows={3}
          required
          placeholder={
            role === 'EVALUATOR'
              ? 'Nhập nội dung thông báo hoặc hướng dẫn làm bài...'
              : 'Đặt câu hỏi hoặc chia sẻ thông tin với nhóm...'
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans resize-none"
        />

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" strokeWidth={1.75} />
            <span>{isSubmitting ? 'Đang gửi...' : 'Đăng bài'}</span>
          </button>
        </div>
      </form>

      {/* Stream Feed */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" strokeWidth={1.75} />
          <span>Đang nạp bảng tin nhóm...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-md bg-white">
          <p className="text-xs text-slate-500">Chưa có bài đăng nào trên bảng tin nhóm.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = post.author_id === currentUserId;
            const canDelete = isAuthor || role === 'EVALUATOR';
            const isSystem = post.post_type === 'SYSTEM';
            const isPinned = post.is_pinned;

            return (
              <div
                key={post.id}
                className={`p-4 rounded-md border transition-all ${
                  isPinned
                    ? 'border-sky-200 bg-sky-50/20'
                    : isSystem
                    ? 'border-slate-200 bg-slate-50/60'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-700 uppercase font-mono">
                      {isSystem ? 'NX' : (post.author?.nickname || 'U').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {isSystem ? 'Hệ thống NEXA' : post.author?.nickname || 'Thành viên'}
                        </span>
                        {post.author?.role === 'EVALUATOR' && !isSystem && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-medium">
                            Người đánh giá
                          </span>
                        )}
                        {isPinned && (
                          <span className="flex items-center gap-0.5 text-[10px] text-sky-700 font-semibold bg-sky-100 px-1.5 py-0.2 rounded">
                            <Pin className="w-2.5 h-2.5" strokeWidth={1.75} />
                            <span>Đã ghim</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatTimestamp(post.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {role === 'EVALUATOR' && !isSystem && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(post.id, isPinned)}
                        className={`p-1 rounded transition-colors ${
                          isPinned ? 'text-sky-600 hover:bg-sky-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isPinned ? 'Bỏ ghim' : 'Ghim thông báo'}
                      >
                        <Pin className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    )}
                    {canDelete && !isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Xóa bài viết"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-3 text-xs text-slate-800 space-y-2">
                  {post.title && (
                    <h4 className="font-bold text-slate-900 text-sm">{post.title}</h4>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">{post.content}</p>

                  {/* Linked Assignment Box */}
                  {post.linked_assignment && (
                    <div className="p-3 rounded border border-sky-200 bg-sky-50/50 flex items-center justify-between gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {post.linked_assignment.assessment?.title || 'Bài khảo thí'}
                          </span>
                          {post.linked_assignment.deadline && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              Hạn chót: {new Date(post.linked_assignment.deadline).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {role === 'LEARNER' ? (
                        <Link
                          href={`/assessments/${post.linked_assignment.assessment?.id}`}
                          className="px-3 py-1 rounded bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors inline-flex items-center gap-1 shrink-0"
                        >
                          <span>Làm bài</span>
                          <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigateTab?.('assignments')}
                          className="px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors shrink-0"
                        >
                          Xem bài nộp
                        </button>
                      )}
                    </div>
                  )}

                  {/* Linked File Box */}
                  {post.linked_file && (
                    <div className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 mt-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} />
                        <span className="font-semibold text-slate-800 truncate">
                          {post.linked_file.file_name}
                        </span>
                      </div>
                      <a
                        href={post.linked_file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] rounded bg-white border border-slate-200 text-sky-700 font-semibold hover:bg-sky-50 transition-colors shrink-0"
                      >
                        Tải xuống
                      </a>
                    </div>
                  )}
                </div>

                {/* Inline Replies */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  {(post.replies || []).length > 0 && (
                    <div className="space-y-2 pl-3 border-l-2 border-slate-100">
                      {post.replies?.map((rep) => (
                        <div key={rep.id} className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {rep.author?.nickname || 'Thành viên'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatTimestamp(rep.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-700">{rep.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Viết phản hồi..."
                      value={replyInput[post.id] || ''}
                      onChange={(e) =>
                        setReplyInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendReply(post.id);
                        }
                      }}
                      className="flex-1 px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                    />
                    <button
                      type="button"
                      disabled={submittingReply[post.id] || !replyInput[post.id]?.trim()}
                      onClick={() => handleSendReply(post.id)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-200 disabled:opacity-50 cursor-pointer"
                    >
                      Gửi
                    </button>
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
