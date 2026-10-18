'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  MessageSquare,
  CheckSquare,
  FileText,
  Users,
  Send,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Share2,
  Calendar,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

interface GroupPost {
  id: string;
  author: string;
  role: 'Giảng viên' | 'Học viên';
  avatarInitials: string;
  timestamp: string;
  title?: string;
  content: string;
  repliesCount: number;
}

interface GroupAssignment {
  id: string;
  title: string;
  deadline: string;
  type: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
}

interface GroupFile {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  format: 'PDF' | 'XLSX' | 'DOCX';
}

export default function LearnerGroupDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'posts';

  const [activeTab, setActiveTab] = useState<'posts' | 'assignments' | 'files' | 'members'>(
    initialTab as any
  );

  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState<GroupPost[]>([
    {
      id: 'p-1',
      author: 'TS. Nguyễn Văn Hùng',
      role: 'Giảng viên',
      avatarInitials: 'NH',
      timestamp: 'Hôm nay lúc 09:15',
      title: 'Thông báo: Hạn nộp bài khảo thí thực hành phân tích dữ liệu',
      content:
        'Thầy đã mở cổng nộp bài tập phân tích dữ liệu trên bảng tính Excel. Các em chú ý nộp file đúng định dạng .xlsx kèm giải trình theo cú pháp quy định trước 23:59 ngày Chủ Nhật.',
      repliesCount: 6,
    },
    {
      id: 'p-2',
      author: 'ThS. Trần Thu Trang',
      role: 'Giảng viên',
      avatarInitials: 'TT',
      timestamp: 'Hôm qua lúc 14:30',
      title: 'Học liệu bổ sung: Kỹ thuật đặt câu lệnh Prompt cho phân tích văn bản',
      content:
        'Đã cập nhật slide bài giảng và các mẫu prompt chuẩn RTCO trong mục Tài liệu chia sẻ. Các bạn xem trước khi làm bài kiểm tra.',
      repliesCount: 2,
    },
  ]);

  const assignments: GroupAssignment[] = [
    {
      id: 'asm-data-01',
      title: 'Cổng nộp bài tập: Xử lý & Phân tích tập dữ liệu khách hàng',
      deadline: '24/10/2026 22:30',
      type: 'Thực hành nộp tệp (.xlsx)',
      status: 'pending',
    },
    {
      id: 'asm-sec-02',
      title: 'Đánh giá kỹ năng bảo vệ danh tính số & Thiết lập xác thực 2 bước (2FA)',
      deadline: '20/10/2026 18:00',
      type: 'Trắc nghiệm & Tình huống',
      status: 'graded',
      score: 85,
    },
  ];

  const files: GroupFile[] = [
    {
      id: 'f-1',
      name: 'GiaoTrinh_NangLucSo_DigComp2.2_DHQG.pdf',
      size: '4.2 MB',
      uploadedBy: 'TS. Nguyễn Văn Hùng',
      uploadedAt: '15/09/2026',
      format: 'PDF',
    },
    {
      id: 'f-2',
      name: 'Mau_BangTinh_BaiTapThucHanh_Q3.xlsx',
      size: '1.8 MB',
      uploadedBy: 'TS. Nguyễn Văn Hùng',
      uploadedAt: '01/10/2026',
      format: 'XLSX',
    },
    {
      id: 'f-3',
      name: 'HuongDan_DatTenFile_Va_NopMinhChung.docx',
      size: '620 KB',
      uploadedBy: 'ThS. Trần Thu Trang',
      uploadedAt: '05/10/2026',
      format: 'DOCX',
    },
  ];

  const members = [
    { id: 'm-1', name: 'TS. Nguyễn Văn Hùng', role: 'Giảng viên phụ trách', avatar: 'NH' },
    { id: 'm-2', name: 'Trần Minh Huy (Bạn)', role: 'Học viên', avatar: 'MH' },
    { id: 'm-3', name: 'Nguyễn Văn An', role: 'Học viên', avatar: 'VA' },
    { id: 'm-4', name: 'Lê Thị Thu', role: 'Học viên', avatar: 'TT' },
    { id: 'm-5', name: 'Hoàng Quốc Bảo', role: 'Học viên', avatar: 'QB' },
  ];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: GroupPost = {
      id: `p-${Date.now()}`,
      author: 'Trần Minh Huy (Bạn)',
      role: 'Học viên',
      avatarInitials: 'MH',
      timestamp: 'Vừa xong',
      content: newPostContent.trim(),
      repliesCount: 0,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  return (
    <div className="space-y-4">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/learner/groups"
          className="hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Tất cả các nhóm</span>
        </Link>
      </div>

      {/* Class Header Banner (Teams Style) */}
      <div className="p-4 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            TH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                DHQG24
              </span>
              <span className="text-xs text-slate-400 font-medium">42 học viên</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Tin học ứng dụng &amp; Năng lực số - Nhóm 03
            </h1>
            <p className="text-xs text-slate-500">
              Giảng viên: <span className="font-semibold text-slate-700">TS. Nguyễn Văn Hùng</span> &bull; ĐHQG Hà Nội
            </p>
          </div>
        </div>
      </div>

      {/* Teams Horizontal Tabs Bar */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold px-2">
        {[
          { id: 'posts', label: 'Bài đăng', icon: MessageSquare },
          { id: 'assignments', label: 'Bài tập & Đánh giá', icon: CheckSquare },
          { id: 'files', label: 'Tài liệu chia sẻ', icon: FileText },
          { id: 'members', label: 'Thành viên', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 pt-1 flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-sky-600 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. Posts Tab (Bảng tin lớp) */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Create Post Input */}
          <div className="p-4 rounded-md border border-slate-200 bg-white">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                rows={2}
                placeholder="Bắt đầu cuộc trò chuyện hoặc đặt câu hỏi cho lớp..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
              />
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Mọi người trong lớp đều có thể xem bài đăng này.
                </div>
                <button
                  type="submit"
                  disabled={!newPostContent.trim()}
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>Đăng tin</span>
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-md border border-slate-200 bg-white space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center">
                      {post.avatarInitials}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{post.author}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {post.role} &bull; {post.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                {post.title && (
                  <h3 className="font-bold text-slate-900 text-sm">{post.title}</h3>
                )}

                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <button className="text-sky-600 hover:text-sky-700 font-medium">
                    Trả lời cuộc trò chuyện ({post.repliesCount})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Assignments Tab (Bài tập & Đánh giá) */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Nhiệm vụ &amp; Bài nộp của lớp ({assignments.length})
          </div>

          <div className="space-y-2.5">
            {assignments.map((asm) => (
              <div
                key={asm.id}
                className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                    TH
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {asm.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>Hình thức: {asm.type}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Hạn nộp: {asm.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {asm.status === 'graded' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                      Đã đạt: {asm.score}/100đ
                    </span>
                  ) : (
                    <Link
                      href={`/learner/take/${asm.id}`}
                      className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Vào làm bài</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Files Tab (Tài liệu chia sẻ) */}
      {activeTab === 'files' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Tài liệu học tập &amp; Biểu mẫu đính kèm ({files.length})
          </div>

          <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 text-[11px] font-semibold">
                  <th className="py-2.5 px-3">TÊN TỆP TIN</th>
                  <th className="py-2.5 px-3">KÍCH THƯỚC</th>
                  <th className="py-2.5 px-3">NGƯỜI TẢI LÊN</th>
                  <th className="py-2.5 px-3">NGÀY ĐĂNG</th>
                  <th className="py-2.5 px-3 text-right">TẢI VỀ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {file.format}
                      </span>
                      <span>{file.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{file.size}</td>
                    <td className="py-3 px-3 text-slate-600">{file.uploadedBy}</td>
                    <td className="py-3 px-3 text-slate-400">{file.uploadedAt}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => alert(`Đang tải tệp ${file.name}...`)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-sky-600 transition-colors"
                        title="Tải về"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Members Tab (Thành viên) */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Danh sách thành viên ({members.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((mem) => (
              <div
                key={mem.id}
                className="p-3 rounded-md border border-slate-200 bg-white flex items-center gap-3 text-xs"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {mem.avatar}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{mem.name}</div>
                  <div className="text-[11px] text-slate-400">{mem.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
