'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Megaphone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Shield,
  Check,
  Building2,
  User,
} from 'lucide-react';

interface FeedbackTicket {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  user_email: string;
  user_name: string;
  category: string;
  subject: string;
  content: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  admin_notes?: string | null;
  created_at: string;
}

export default function AdminCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'feedback' | 'broadcast' | 'email'>('feedback');
  const [feedbacks, setFeedbacks] = useState<FeedbackTicket[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'SYSTEM' | 'SECURITY' | 'CAMPAIGN'>('SYSTEM');
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'PERSONAL' | 'ORG'>('ALL');
  const [broadcasting, setBroadcasting] = useState(false);

  // Email campaign state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTarget, setEmailTarget] = useState<'ALL' | 'STUDENTS' | 'TEACHERS'>('ALL');

  const fetchFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      setFeedbackError(null);
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tải danh sách ý kiến đóng góp');
      }
      setFeedbacks(data.tickets || []);
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleResolveFeedback = async (id: string) => {
    try {
      setActionError('');
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id, status: 'RESOLVED' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể cập nhật trạng thái');
      }
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'RESOLVED' } : f))
      );
      setActionSuccess('Đã đánh dấu đã xử lý ý kiến đóng góp.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcasting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          category: broadcastType,
          target: broadcastTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi phát thông báo');
      }

      setActionSuccess(data.message || 'Đã phát thông báo thành công tới người dùng.');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Lỗi máy chủ khi phát thông báo');
    } finally {
      setBroadcasting(false);
    }
  };

  const unreadCount = feedbacks.filter((f) => f.status === 'OPEN').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Trung Tâm Truyền Thông &amp; Hộp Thư Góp Ý
          </h1>
        </div>

        {activeTab === 'feedback' && (
          <button
            onClick={fetchFeedbacks}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 ${loadingFeedbacks ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 dark:text-emerald-400 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md text-rose-900 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-700 dark:text-rose-400 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* Tabs (Pill Tabs, không gạch chân) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
            <span>Hộp thư góp ý ({unreadCount} mở)</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Megaphone className="w-4 h-4" strokeWidth={1.75} />
            <span>Thông báo lưu DB (Broadcast)</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Mail className="w-4 h-4" strokeWidth={1.75} />
            <span>Chiến dịch Email</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FEEDBACK INBOX */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {feedbackError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md text-rose-800 dark:text-rose-300 text-xs">
              {feedbackError}
            </div>
          )}

          <div className="border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-[#111114] overflow-hidden">
            {loadingFeedbacks ? (
              <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-xs">
                Đang tải dữ liệu ý kiến đóng góp...
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-xs">
                Chưa có ý kiến đóng góp nào từ người dùng trong cơ sở dữ liệu.
              </div>
            ) : (
              feedbacks.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 transition-colors ${
                    item.status === 'OPEN' ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.organization_id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {item.organization_id ? 'TỔ CHỨC BUSINESS' : 'CÁ NHÂN'}
                      </span>
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                        {item.user_name} ({item.user_email})
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                        &bull; {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === 'OPEN'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {item.status === 'OPEN' ? 'MỚI TIẾP NHẬN' : 'ĐÃ XỬ LÝ'}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    {item.subject}
                  </p>
                  <p className="text-xs text-neutral-800 dark:text-zinc-200 leading-relaxed pl-1 mb-3 whitespace-pre-wrap">
                    {item.content}
                  </p>

                  <div className="flex justify-end gap-2 text-xs">
                    {item.status === 'OPEN' && (
                      <button
                        onClick={() => handleResolveFeedback(item.id)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850 text-[11px] inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Đánh dấu đã giải quyết</span>
                      </button>
                    )}
                    <a
                      href={`mailto:${item.user_email}?subject=Phan%20hoi%20gop%20y%20NEXA%20AI:%20${encodeURIComponent(
                        item.subject
                      )}`}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Gửi email phản hồi</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IN-APP BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 space-y-5 text-xs shadow-xs">
          <div className="pb-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <span>Phát Thông Báo Toàn Nền Tảng Lưu Database</span>
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
              Thông báo được ghi trực tiếp vào bảng <code>user_notifications</code> của từng người dùng, đồng bộ ngay lập tức trên Chuông Thông Báo.
            </p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                  Loại thông báo:
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="SYSTEM">Hệ thống &amp; Tính năng mới (SYSTEM)</option>
                  <option value="SECURITY">Cảnh báo bảo mật (SECURITY)</option>
                  <option value="CAMPAIGN">Đợt đánh giá &amp; Khảo thí (CAMPAIGN)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                  Đối tượng tiếp nhận:
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="ALL">Toàn bộ tài khoản người dùng (ALL)</option>
                  <option value="PERSONAL">Người dùng cá nhân (PERSONAL)</option>
                  <option value="ORG">Thành viên tổ chức Business (ORG)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                Tiêu đề thông báo:
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="ví dụ: Ra mắt Khung năng lực số 5 miền v2 & Ngân hàng câu hỏi mới"
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                Nội dung chi tiết:
              </label>
              <textarea
                rows={4}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Nhập nội dung thông điệp gửi tới người dùng..."
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={broadcasting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{broadcasting ? 'Đang phát sóng...' : 'Phát sóng thông báo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: EMAIL COMMUNICATIONS */}
      {activeTab === 'email' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 space-y-5 text-xs shadow-xs">
          <div className="pb-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <span>Gửi Bản Tin &amp; Thông Báo Email</span>
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
              Hệ thống gửi thư hàng loạt yêu cầu cấu hình máy chủ SMTP / Email Marketing Service để bảo vệ uy tín tên miền.
            </p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Chức năng gửi Email hàng loạt đang tích hợp Server Queue</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Các email giao dịch tự động (xác nhận đăng ký, mời tổ chức, đặt lại mật khẩu) hiện đã hoạt động thông qua cấu hình SMTP Supabase. Tính năng gửi bản tin hàng loạt (Marketing Broadcast) được tạm khóa gửi thử để tránh phát sinh chi phí hoặc rủi ro bộ lọc thư rác (spam).
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 opacity-75">
            <div>
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                Nhóm đối tượng nhận email:
              </label>
              <select
                value={emailTarget}
                disabled
                onChange={(e) => setEmailTarget(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-600 dark:text-neutral-400 cursor-not-allowed"
              >
                <option value="ALL">Toàn bộ người dùng đã xác thực email</option>
                <option value="STUDENTS">Chỉ học viên (Learners)</option>
                <option value="TEACHERS">Chỉ giảng viên &amp; Giám thị (Evaluators)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                Tiêu đề Email:
              </label>
              <input
                type="text"
                disabled
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="ví dụ: [NEXA AI] Cập nhật kết quả đánh giá năng lực số đợt tháng 10"
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 text-neutral-600 dark:text-neutral-400 cursor-not-allowed placeholder-slate-400"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                Nội dung thư:
              </label>
              <textarea
                rows={4}
                disabled
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Soạn thảo nội dung bản tin..."
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 text-neutral-600 dark:text-neutral-400 cursor-not-allowed placeholder-slate-400 font-sans"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled
                className="px-4 py-2 bg-slate-300 dark:bg-zinc-700 text-slate-500 dark:text-neutral-400 rounded font-semibold text-xs inline-flex items-center gap-1.5 cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Đang phát triển hàng đợi gửi</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
