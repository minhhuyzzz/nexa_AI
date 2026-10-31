'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Megaphone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
  Building2,
  Clock,
  Filter,
  Check,
  Shield,
  Eye,
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  source: 'PERSONAL' | 'ORGANIZATION';
  author: string;
  rating: number;
  category: string;
  content: string;
  date: string;
  isRead: boolean;
}

const mockFeedbacks: FeedbackItem[] = [
  {
    id: 'fb-01',
    source: 'ORGANIZATION',
    author: 'admin@fpt.edu.vn (FPT Education)',
    rating: 5,
    category: 'Đề thi & Khảo thí',
    content: 'Đề xuất bổ sung thêm tính năng xuất báo cáo phân bổ 5 miền theo định dạng PDF có dấu mộc điện tử cho hội đồng trường.',
    date: '2026-10-31 14:20',
    isRead: false,
  },
  {
    id: 'fb-02',
    source: 'PERSONAL',
    author: 'nguyen.van.a@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    content: 'Giao diện Light Mode trắng sạch và Dark Mode đen tuyền nhìn rất sang trọng và không bị mỏi mắt. Cảm ơn đội ngũ NEXA.',
    date: '2026-10-31 11:05',
    isRead: true,
  },
  {
    id: 'fb-03',
    source: 'ORGANIZATION',
    author: 'contact@fecon.com.vn (Tập đoàn Fecon)',
    rating: 4,
    category: 'Hợp đồng & B2B',
    content: 'Mong muốn nâng hạn ngạch gói B2B lên 500 thành viên và tích hợp SSO nội bộ công ty.',
    date: '2026-10-30 16:45',
    isRead: false,
  },
];

export default function AdminCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'feedback' | 'broadcast' | 'email'>('feedback');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(mockFeedbacks);
  const [actionSuccess, setActionSuccess] = useState('');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'INFO' | 'MAINTENANCE' | 'FEATURE'>('INFO');
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'PERSONAL' | 'ORG'>('ALL');
  const [broadcasting, setBroadcasting] = useState(false);

  // Email state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTarget, setEmailTarget] = useState<'ALL' | 'STUDENTS' | 'TEACHERS'>('ALL');
  const [emailSending, setEmailSending] = useState(false);

  const handleMarkAsRead = (id: string) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isRead: true } : f))
    );
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      setActionSuccess(`Đã phát thông báo "${broadcastTitle}" tới toàn bộ người dùng đang đăng nhập.`);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setActionSuccess(''), 4000);
    }, 800);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) return;

    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setActionSuccess(`Đã lập lịch gửi email "${emailSubject}" kèm liên kết từ chối nhận tin (Unsubscribe).`);
      setEmailSubject('');
      setEmailBody('');
      setTimeout(() => setActionSuccess(''), 4000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
              COMMUNICATIONS &amp; FEEDBACK CENTER
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Trung Tâm Truyền Thông &amp; Hộp Thư Góp Ý
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Tiếp nhận đóng góp ý kiến từ người dùng, phát thông báo đẩy tức thời và vận hành truyền thông nền tảng.
          </p>
        </div>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            activeTab === 'feedback'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
          <span>Hộp thư góp ý ({feedbacks.filter((f) => !f.isRead).length} chưa đọc)</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            activeTab === 'broadcast'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Megaphone className="w-4 h-4" strokeWidth={1.75} />
          <span>Thông báo đẩy In-app (Broadcast)</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            activeTab === 'email'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Mail className="w-4 h-4" strokeWidth={1.75} />
          <span>Chiến dịch Email &amp; Bản tin</span>
        </button>
      </div>

      {/* TAB 1: FEEDBACK INBOX */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-[#111114] overflow-hidden">
            {feedbacks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-xs">
                Chưa có ý kiến đóng góp nào từ người dùng.
              </div>
            ) : (
              feedbacks.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 transition-colors ${
                    !item.isRead ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.source === 'ORGANIZATION'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {item.source === 'ORGANIZATION' ? 'DOANH NGHIỆP / TRƯỜNG HỌC' : 'CÁ NHÂN'}
                      </span>
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                        {item.author}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">&bull; {item.category}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                        {item.date}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-800 dark:text-zinc-200 leading-relaxed pl-1 mb-3">
                    {item.content}
                  </p>

                  <div className="flex justify-end gap-2 text-xs">
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850 text-[11px] inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Đánh dấu đã đọc</span>
                      </button>
                    )}
                    <a
                      href={`mailto:${item.author.split(' ')[0]}?subject=Phan%20hoi%20dong%20gop%20y%20kien%20NEXA`}
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
          <div className="pb-3 border-b border-slate-100 dark:border-zinc-850">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <span>Phát Thông Báo Đẩy Toàn Nền Tảng (In-app Broadcast)</span>
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
              Thông báo sẽ lập tức hiển thị ở thanh thông báo và chuông thông báo của toàn bộ người dùng đang trực tuyến.
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
                  <option value="INFO">Tin tức &amp; Cập nhật (INFO)</option>
                  <option value="FEATURE">Tính năng mới (NEW FEATURE)</option>
                  <option value="MAINTENANCE">Bảo trì hệ thống (MAINTENANCE)</option>
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
                  <option value="ALL">Toàn bộ nền tảng (Personal + Business)</option>
                  <option value="PERSONAL">Chỉ người dùng Cá nhân (Personal)</option>
                  <option value="ORG">Chỉ Tổ chức Business &amp; Trường học</option>
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
          <div className="pb-3 border-b border-slate-100 dark:border-zinc-850">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <span>Gửi Bản Tin &amp; Thông Báo Email</span>
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
              Email gửi qua cổng Resend API với tùy chọn tự động chèn liên kết từ chối nhận tin (Unsubscribe) theo chuẩn Nghị định 13/2023.
            </p>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                Nhóm đối tượng nhận email:
              </label>
              <select
                value={emailTarget}
                onChange={(e) => setEmailTarget(e.target.value as any)}
                className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100"
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
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="ví dụ: [NEXA AI] Cập nhật kết quả đánh giá năng lực số đợt tháng 10"
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                Nội dung thư:
              </label>
              <textarea
                rows={5}
                required
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Nhập nội dung email..."
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-sans"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-[11px] text-slate-500 dark:text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-800 dark:text-zinc-200 font-semibold">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Quy chuẩn gửi thư an toàn:</span>
              </div>
              <p>
                Mọi email đều tự động đính kèm liên kết hủy đăng ký tại chân trang. Email không chứa nội dung spam hoặc quảng cáo ngoài nền tảng.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={emailSending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{emailSending ? 'Đang lên lịch...' : 'Gửi email thông báo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
