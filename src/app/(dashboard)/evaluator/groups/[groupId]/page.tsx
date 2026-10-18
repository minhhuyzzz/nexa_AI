'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  Users,
  MessageSquare,
  CheckSquare,
  FileText,
  Plus,
  Send,
  Download,
  Copy,
  Check,
  QrCode,
  Radio,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

export default function EvaluatorGroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [activeTab, setActiveTab] = useState<'posts' | 'assignments' | 'students' | 'files'>('students');
  const [copiedCode, setCopiedCode] = useState(false);

  const groupInfo = {
    id: groupId,
    code: 'DHQG24',
    name: 'Tin học ứng dụng & Năng lực số - Nhóm 03',
    shortCode: 'TH',
    studentsCount: 42,
    activeExams: 2,
    createdAt: '15/09/2026',
  };

  const students = [
    { id: 'st-1', name: 'Trần Minh Huy', email: 'minhhuy@nexa.edu.vn', score: 85, status: 'Đã nộp bài tuần 10', feedback: 'Xử lý dữ liệu bảng tính rất chuẩn xác.' },
    { id: 'st-2', name: 'Nguyễn Văn An', email: 'vanan@gmail.com', score: 92, status: 'Đã hoàn thành', feedback: 'Nắm vững kiến thức an toàn thông tin.' },
    { id: 'st-3', name: 'Lê Thị Thu', email: 'thule@gmail.com', score: 74, status: 'Cần bổ sung', feedback: 'Cần rèn luyện thêm phần giải trình phương án.' },
    { id: 'st-4', name: 'Hoàng Quốc Bảo', email: 'bao.hoang@enterprise.vn', score: 79, status: 'Đã nộp bài tuần 10' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(groupInfo.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/evaluator/groups"
          className="hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quản lý các nhóm lớp</span>
        </Link>
      </div>

      {/* Class Header Banner */}
      <div className="p-4 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            {groupInfo.shortCode}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {groupInfo.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {groupInfo.studentsCount} học viên &bull; Ngày tạo: {groupInfo.createdAt}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {groupInfo.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Đã chép mã</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Mã mời: {groupInfo.code}</span>
              </>
            )}
          </button>

          <Link
            href="/evaluator/live-room"
            className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Mở phòng thi PIN/QR</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold px-2">
        {[
          { id: 'students', label: 'Danh sách sinh viên & Chấm điểm', icon: Users },
          { id: 'assignments', label: 'Bài tập được giao', icon: CheckSquare },
          { id: 'posts', label: 'Bảng tin lớp học', icon: MessageSquare },
          { id: 'files', label: 'Học liệu chia sẻ', icon: FileText },
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

      {/* Tab: Students & Grading */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">
              Danh sách sinh viên trong lớp ({students.length})
            </span>
            <Link
              href="/evaluator/grading"
              className="text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
            >
              <span>Đi đến bàn chấm bài Rubric &rarr;</span>
            </Link>
          </div>

          <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 text-[11px] font-semibold">
                  <th className="py-2.5 px-3">HỌC VIÊN</th>
                  <th className="py-2.5 px-3">TRẠNG THÁI</th>
                  <th className="py-2.5 px-3">ĐIỂM GẦN NHẤT</th>
                  <th className="py-2.5 px-3">NHẬN XÉT CỦA GIẢNG VIÊN</th>
                  <th className="py-2.5 px-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{st.name}</div>
                      <div className="text-[11px] text-slate-400">{st.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {st.score}/100đ
                    </td>
                    <td className="py-3 px-3 text-slate-600 italic max-w-xs truncate">
                      {st.feedback ? `"${st.feedback}"` : 'Chưa có nhận xét'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href="/evaluator/grading"
                        className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
                      >
                        Chấm bài
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <div className="p-6 rounded-md border border-slate-200 bg-white text-center text-xs space-y-3">
          <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900">2 bài tập đang giao cho lớp này</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            1. Đánh giá kỹ năng dữ liệu &amp; xử lý bảng tính (Hạn nộp: 25/10/2026)<br />
            2. Thực hành bảo mật 2FA và nhận diện lừa đảo mạng (Hạn nộp: 30/10/2026)
          </p>
          <Link
            href="/evaluator/grading"
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Vào bàn chấm bài của lớp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Tab: Posts */}
      {activeTab === 'posts' && (
        <div className="p-6 rounded-md border border-slate-200 bg-white text-xs space-y-3">
          <div className="font-bold text-slate-900 text-sm">Bảng tin lớp học</div>
          <p className="text-slate-600 leading-relaxed">
            TS. Nguyễn Văn Hùng đã thông báo: &ldquo;Thầy đã mở cổng nộp bài tập phân tích dữ liệu trên bảng tính Excel. Các em chú ý nộp file đúng định dạng .xlsx.&rdquo;
          </p>
        </div>
      )}

      {/* Tab: Files */}
      {activeTab === 'files' && (
        <div className="p-6 rounded-md border border-slate-200 bg-white text-xs space-y-2">
          <div className="font-bold text-slate-900 text-sm">Học liệu chia sẻ cho lớp</div>
          <p className="text-slate-500">GiaoTrinh_NangLucSo_DigComp2.2_DHQG.pdf (4.2 MB)</p>
          <p className="text-slate-500">Mau_BangTinh_BaiTapThucHanh_Q3.xlsx (1.8 MB)</p>
        </div>
      )}
    </div>
  );
}
