'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Send,
  Search,
  Filter,
  Check,
  X,
  Layers,
  Award,
  Sparkles,
  HelpCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import type { ContributionItem } from '@/types/contributions';

export default function AdminContentModerationPage() {
  const [items, setItems] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [search, setSearch] = useState('');

  // Moderation form state
  const [feedback, setFeedback] = useState('');
  const [pointsReward, setPointsReward] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Checklist state
  const [checkAcademic, setCheckAcademic] = useState(true);
  const [check5Domains, setCheck5Domains] = useState(true);
  const [checkRubric, setCheckRubric] = useState(true);
  const [checkNonDuplicate, setCheckNonDuplicate] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contributions');
      const data = await res.json();
      if (data.contributions) {
        setItems(data.contributions);
        if (data.contributions.length > 0 && !selectedId) {
          setSelectedId(data.contributions[0].id);
        }
      }
    } catch {
      setErrorMsg('Không thể tải danh sách nội dung thẩm định.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && item.status === 'pending') ||
      (activeTab === 'approved' && item.status === 'approved');

    const matchesSearch =
      !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.domain.toLowerCase().includes(search.toLowerCase()) ||
      (item.authorName || '').toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const selectedItem = items.find((i) => i.id === selectedId) || filteredItems[0] || null;

  const handleModerate = async (status: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED') => {
    if (!selectedItem) return;
    setSubmitting(true);
    setActionMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          status,
          adminFeedback: feedback.trim() || (status === 'APPROVED' ? 'Đề xuất đạt chuẩn năng lực số NEXA.' : 'Cần bổ sung tiêu chí rubric rõ ràng.'),
          pointsRewarded: status === 'APPROVED' ? pointsReward : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Lỗi khi thẩm định nội dung');
        return;
      }

      setActionMsg(
        status === 'APPROVED'
          ? `Đã phê duyệt phát hành câu hỏi "${selectedItem.title}" (+${pointsReward} điểm thưởng cho tác giả).`
          : status === 'NEEDS_REVISION'
          ? `Đã gửi yêu cầu chỉnh sửa cho tác giả "${selectedItem.authorName || 'Người dùng'}".`
          : `Đã từ chối đề xuất "${selectedItem.title}".`
      );

      // Update state locally
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedItem.id
            ? { ...it, status: status === 'APPROVED' ? 'approved' : status === 'NEEDS_REVISION' ? 'needs_revision' : 'rejected' }
            : it
        )
      );

      setFeedback('');
      setTimeout(() => setActionMsg(''), 4000);
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
              CONTENT MODERATION WORKBENCH
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Bàn Thẩm Định &amp; Kiểm Duyệt Nội Dung
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Bàn kiểm định 2 cột đối chiếu: Xem trước đề thi, kiểm chứng ma trận 5 miền và phê duyệt phát hành vào Ngân hàng chung.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchItems}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
            <span>Làm mới</span>
          </button>
          <Link
            href="/admin/content"
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ngân hàng đề chuẩn</span>
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="text-emerald-700 dark:text-emerald-400 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Moderation Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List + Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tabs & Search */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
                }`}
              >
                Chờ duyệt ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
                }`}
              >
                Đã phát hành
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-neutral-900 dark:bg-zinc-200 text-white dark:text-zinc-900'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
                }`}
              >
                Tất cả ({items.length})
              </button>
            </div>

            <div className="relative text-xs w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Lọc đề thi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Item Selector List (Horizontal scroll or small pills) */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filteredItems.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  setSelectedId(it.id);
                  setFeedback(it.adminFeedback || '');
                }}
                className={`px-3 py-2 rounded-md border text-left text-xs whitespace-nowrap transition-all shrink-0 ${
                  selectedItem?.id === it.id
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-800 dark:text-zinc-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] text-slate-400">{it.code}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${it.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <div className="max-w-[180px] truncate">{it.title}</div>
              </button>
            ))}
          </div>

          {/* Full Item Preview Card */}
          {selectedItem ? (
            <div className="p-6 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md space-y-5 text-xs shadow-xs">
              {/* Header preview with 1:1 square cover art */}
              <div className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-zinc-850">
                <div className="w-20 h-20 aspect-square rounded-md bg-blue-50 dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center p-2 shrink-0">
                  <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1" strokeWidth={1.75} />
                  <span className="font-mono text-[9px] font-bold text-blue-800 dark:text-blue-300">1:1 COVER</span>
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {selectedItem.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {selectedItem.questionType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      Độ khó: {selectedItem.difficulty}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedItem.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                    Tác giả: <span className="font-semibold text-neutral-800 dark:text-zinc-200">{selectedItem.authorName || 'Người đóng góp'}</span> &bull; Mã: {selectedItem.code}
                  </p>
                </div>
              </div>

              {/* Prompt Body */}
              <div className="space-y-2">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px] font-mono">
                  NỘI DUNG CÂU HỎI / ĐỀ BÀI:
                </h4>
                <div className="p-4 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedItem.prompt}
                </div>
              </div>

              {/* Solution / Rubric Notes */}
              <div className="space-y-2">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px] font-mono">
                  GỢI Ý ĐÁP ÁN &amp; TIÊU CHÍ RUBRIC CHẤM ĐIỂM:
                </h4>
                <div className="p-4 rounded-md bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-neutral-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedItem.solutionNotes || 'Tác giả chưa đính kèm tiêu chí rubric bổ sung.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 dark:text-neutral-500 border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-[#111114]">
              Chọn một đề thi từ danh sách phía trên để xem trước nội dung.
            </div>
          )}
        </div>

        {/* Right Column: Moderation Workbench Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md space-y-5 text-xs shadow-xs sticky top-4">
            <div className="pb-3 border-b border-slate-100 dark:border-zinc-850">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Kiểm Định &amp; Quyết Định Phát Hành</span>
              </h2>
              <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                Đánh giá theo 4 tiêu chuẩn chất lượng trước khi phát hành vào kho đề chuẩn.
              </p>
            </div>

            {/* Quality Checklist */}
            <div className="space-y-2.5">
              <span className="font-bold text-neutral-800 dark:text-zinc-200 block text-[11px] uppercase font-mono">
                TIÊU CHUẨN KIỂM ĐỊNH NỘI DUNG:
              </span>

              <label className="flex items-start gap-2 p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkAcademic}
                  onChange={(e) => setCheckAcademic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-neutral-800 dark:text-zinc-200 text-[11px]">
                  Ngôn từ học thuật chuẩn xác, không mang tính thiên kiến hoặc vi phạm đạo đức
                </span>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={check5Domains}
                  onChange={(e) => setCheck5Domains(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-neutral-800 dark:text-zinc-200 text-[11px]">
                  Ánh xạ đúng trọng tâm vào Khung 5 miền năng lực số DigComp
                </span>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkRubric}
                  onChange={(e) => setCheckRubric(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-neutral-800 dark:text-zinc-200 text-[11px]">
                  Có đáp án xác thực hoặc tiêu chí Rubric minh chứng rõ ràng
                </span>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkNonDuplicate}
                  onChange={(e) => setCheckNonDuplicate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-neutral-800 dark:text-zinc-200 text-[11px]">
                  Không trùng lặp với các câu hỏi sẵn có trong Ngân hàng đề hệ thống
                </span>
              </label>
            </div>

            {/* Reward Points */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-850">
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block text-[11px]">
                Điểm thưởng cấp cho tác giả (NEXA Reward Points):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={500}
                  step={25}
                  value={pointsReward}
                  onChange={(e) => setPointsReward(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                />
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">điểm (Tự động cộng vào Point Ledger)</span>
              </div>
            </div>

            {/* Reviewer Feedback Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-850">
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block text-[11px]">
                Nhận xét &amp; Góp ý của Hội đồng Thẩm định:
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập lý do phê duyệt hoặc chỉ ra các phần cần chỉnh sửa trước khi cấp phép..."
                className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* 3 Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-850">
              <button
                type="button"
                disabled={submitting || !selectedItem}
                onClick={() => handleModerate('APPROVED')}
                className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                <span>Phê duyệt &amp; Phát hành vào Ngân hàng</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={submitting || !selectedItem}
                  onClick={() => handleModerate('NEEDS_REVISION')}
                  className="py-2 px-3 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
                  <span>Yêu cầu sửa</span>
                </button>

                <button
                  type="button"
                  disabled={submitting || !selectedItem}
                  onClick={() => handleModerate('REJECTED')}
                  className="py-2 px-3 rounded border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" strokeWidth={1.75} />
                  <span>Từ chối</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
