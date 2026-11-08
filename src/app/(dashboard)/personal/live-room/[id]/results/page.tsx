'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Radio,
  Users,
  Copy,
  Check,
  Award,
  Crown,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Download,
  Share2,
  ArrowLeft,
  ChevronRight,
  Eye,
  Sliders,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CandidateResult {
  id: string;
  userId: string;
  rank: number;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  studentCode: string;
  score: number | null;
  status: string;
  submittedAt?: string | null;
  timeTakenDisplay: string;
  timeTakenSeconds: number;
  isOnTime: boolean;
}

interface ResultsData {
  room: {
    id: string;
    roomCode: string;
    title: string;
    assessmentTitle: string;
    durationMinutes: number;
    passingScore: number;
    status: string;
    themeId: string;
    resultsPublished: boolean;
    resultsPublishSettings: {
      show_score: boolean;
      show_ranking: boolean;
      show_answers: boolean;
      scope: string;
    };
    startedAt?: string | null;
    endedAt?: string | null;
    createdAt: string;
    isHost: boolean;
  };
  stats: {
    totalJoined: number;
    totalSubmitted: number;
    submitPercent: number;
    onTimeSubmitted: number;
    onTimePercent: number;
    averageScore: number;
    highestScore: number;
  };
  results: CandidateResult[];
}

export default function LiveRoomResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params.id as string) || '';

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Publish settings toggles
  const [showScore, setShowScore] = useState(true);
  const [showRanking, setShowRanking] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [publishScope, setPublishScope] = useState('ALL');

  // Publishing action
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Search in table
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResults = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/results`);
      if (res.ok) {
        const json: ResultsData = await res.json();
        setData(json);
        if (json.room?.resultsPublishSettings) {
          setShowScore(json.room.resultsPublishSettings.show_score ?? true);
          setShowRanking(json.room.resultsPublishSettings.show_ranking ?? true);
          setShowAnswers(json.room.resultsPublishSettings.show_answers ?? false);
          setPublishScope(json.room.resultsPublishSettings.scope || 'ALL');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Không thể tải kết quả phòng thi.');
      }
    } catch {
      setError('Lỗi kết nối khi tải kết quả phòng thi.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Handle Publish Results
  const handlePublishResults = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action: 'PUBLISH_RESULTS',
          payload: {
            publishSettings: {
              show_score: showScore,
              show_ranking: showRanking,
              show_answers: showAnswers,
              scope: publishScope,
            },
          },
        }),
      });

      if (res.ok) {
        setPublishSuccess(true);
        if (data) {
          setData({
            ...data,
            room: {
              ...data.room,
              resultsPublished: true,
              status: 'RESULTS_PUBLISHED',
            },
          });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể công bố kết quả.');
      }
    } catch {
      alert('Lỗi kết nối khi công bố kết quả.');
    } finally {
      setPublishing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data?.results?.length) return;
    const rows = [
      ['Hạng', 'Mã Thí Sinh', 'Họ Và Tên', 'Điểm Số (/100)', 'Thời Gian Hoàn Thành', 'Trạng Thái'],
      ...data.results.map((r) => [
        r.rank,
        r.studentCode,
        r.fullName,
        r.score !== null ? r.score : '--',
        r.timeTakenDisplay,
        r.isOnTime ? 'Đúng hạn' : 'Quá giờ',
      ]),
    ];
    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ket_qua_${data.room.roomCode}.csv`;
    link.click();
  };

  const handleCopyPIN = () => {
    if (!data?.room?.roomCode) return;
    navigator.clipboard.writeText(data.room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredResults = useMemo(() => {
    if (!data?.results) return [];
    if (!searchQuery.trim()) return data.results;
    const q = searchQuery.toLowerCase().trim();
    return data.results.filter(
      (r) => r.fullName.toLowerCase().includes(q) || r.studentCode.toLowerCase().includes(q)
    );
  }, [data?.results, searchQuery]);

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
        Đang tổng kết điểm và xếp hạng phòng thi...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center bg-white rounded-md border border-slate-200 max-w-md mx-auto space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <div className="font-bold text-sm text-neutral-900">{error || 'Không tìm thấy kết quả'}</div>
        <Link
          href="/personal/live-room"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh sách phòng thi</span>
        </Link>
      </div>
    );
  }

  const { room, stats, results } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              PHÒNG THI TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Kết Thúc Phiên & Công Bố Kết Quả
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phiên thi trực tiếp đã kết thúc. Xem tổng kết, quản lý kết quả và lựa chọn công bố cho thí sinh.
          </p>
        </div>

        <Link
          href="/personal/live-room"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách phòng thi</span>
        </Link>
      </div>

      {/* 2. Room Metadata Banner (Screen 09) */}
      <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900">
              Phòng thi: {room.title}
            </h2>
            <button
              onClick={() => {
                navigator.clipboard.writeText(room.title);
                alert('Đã sao chép tên phòng');
              }}
              className="text-slate-400 hover:text-blue-600"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              • Đã kết thúc
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>Thời lượng: {room.durationMinutes} phút</span>
            <span>&bull;</span>
            <span>Đề thi: {room.assessmentTitle}</span>
            <span>&bull;</span>
            <span>Hình thức: Phòng thi trực tiếp</span>
          </div>
        </div>

        {/* PIN Badge & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 mr-2 uppercase text-[10px] font-bold">MÃ PIN:</span>
            <span className="font-mono font-bold text-blue-600 text-sm">
              {room.roomCode.slice(0, 3)} {room.roomCode.slice(3)}
            </span>
            <button onClick={handleCopyPIN} className="ml-2 text-slate-400 hover:text-blue-600">
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : <Copy className="w-3.5 h-3.5 inline" />}
            </button>
          </div>

          {room.resultsPublished && (
            <span className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Đã công bố kết quả
            </span>
          )}
        </div>
      </div>

      {/* 3. Five Aggregate KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Đã tham gia */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Đã tham gia</span>
          <div className="text-2xl font-bold text-neutral-900">{stats.totalJoined}</div>
          <div className="text-[11px] text-slate-400">
            {stats.totalJoined > 0 ? `${stats.totalJoined} thí sinh kết nối` : 'Chưa có thí sinh'}
          </div>
        </div>

        {/* KPI 2: Đã nộp */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Đã nộp bài</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900">{stats.totalSubmitted}</span>
            {stats.totalJoined > 0 && (
              <span className="text-xs font-semibold text-blue-600">({stats.submitPercent}%)</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            {stats.totalSubmitted > 0 ? 'Bài làm hoàn tất' : 'Chưa có bài nộp'}
          </div>
        </div>

        {/* KPI 3: Nộp đúng hạn */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Nộp đúng hạn</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-700">
              {stats.totalSubmitted > 0 ? stats.onTimeSubmitted : '--'}
            </span>
            {stats.totalSubmitted > 0 && (
              <span className="text-xs font-semibold text-emerald-600">({stats.onTimePercent}%)</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            {stats.totalSubmitted > 0 ? 'Không quá giờ' : 'Chưa có dữ liệu'}
          </div>
        </div>

        {/* KPI 4: Điểm trung bình */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Điểm trung bình</span>
          <div className="text-2xl font-bold text-neutral-900">
            {stats.totalSubmitted > 0 ? stats.averageScore : '--'}{' '}
            {stats.totalSubmitted > 0 && <span className="text-xs text-slate-400 font-normal">/ 100</span>}
          </div>
          <div className="text-[11px] text-slate-400">
            {stats.totalSubmitted > 0 ? 'Toàn bộ bài thi' : 'Chưa có điểm'}
          </div>
        </div>

        {/* KPI 5: Điểm cao nhất */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Điểm cao nhất</span>
          <div className="text-2xl font-bold text-amber-600">
            {stats.totalSubmitted > 0 ? stats.highestScore : '--'}{' '}
            {stats.totalSubmitted > 0 && <span className="text-xs text-slate-400 font-normal">/ 100</span>}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold">
            {stats.totalSubmitted > 0 ? 'Thủ khoa phòng' : 'Chưa có bài thi'}
          </div>
        </div>
      </div>

      {/* 4. Center Table & Right Publish Settings Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Candidate Results Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <h2 className="text-sm font-bold text-neutral-900">
              Kết quả thí sinh ({filteredResults.length})
            </h2>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-xs text-neutral-900">
                  Chưa có bài nộp nào được ghi nhận
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Phiên thi đã kết thúc. Nếu thí sinh chưa nộp bài hoặc chưa tham gia thi, bảng kết quả sẽ chưa có dữ liệu để xếp hạng.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Thí sinh</th>
                    <th className="py-2.5 px-3 text-center">Điểm (/100)</th>
                    <th className="py-2.5 px-3">Thời gian hoàn thành</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="">
                  {filteredResults.map((r) => {
                    const isTop1 = r.rank === 1;
                    const isTop2 = r.rank === 2;
                    const isTop3 = r.rank === 3;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Rank */}
                        <td className="py-3 px-3 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                              👑 1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                              🥈 2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                              🥉 3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">{r.rank}</span>
                          )}
                        </td>

                        {/* Thí sinh */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {r.initials}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-900">{r.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{r.studentCode}</div>
                            </div>
                          </div>
                        </td>

                        {/* Điểm (/100) */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-mono font-bold text-sm ${
                              r.score !== null && r.score >= (room.passingScore || 70)
                                ? 'text-emerald-600'
                                : 'text-neutral-900'
                            }`}
                          >
                            {r.score !== null ? r.score : '--'}
                          </span>
                        </td>

                        {/* Thời gian hoàn thành */}
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {r.timeTakenDisplay}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3 px-3">
                          {r.isOnTime ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Đã nộp đúng hạn
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              ⏱ Quá hạn
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Publish Controls & Timeline (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Panel 1: Công bố kết quả (Screen 09) */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
            <h2 className="font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Thiết lập công bố kết quả</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-slate-500 block mb-1">Phạm vi công bố:</label>
                <select
                  value={publishScope}
                  onChange={(e) => setPublishScope(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
                >
                  <option value="ALL">Tất cả thí sinh trong phòng</option>
                  <option value="PASSED_ONLY">Chỉ thí sinh đạt điểm chuẩn</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center justify-between p-2 rounded bg-slate-50 cursor-pointer">
                  <span className="font-medium text-slate-700">Hiển thị điểm số</span>
                  <input
                    type="checkbox"
                    checked={showScore}
                    onChange={(e) => setShowScore(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-slate-50 cursor-pointer">
                  <span className="font-medium text-slate-700">Hiển thị xếp hạng</span>
                  <input
                    type="checkbox"
                    checked={showRanking}
                    onChange={(e) => setShowRanking(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-slate-50 cursor-pointer">
                  <span className="font-medium text-slate-700">Hiển thị đáp án & giải thích</span>
                  <input
                    type="checkbox"
                    checked={showAnswers}
                    onChange={(e) => setShowAnswers(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>

              <div className="p-2.5 rounded bg-blue-50/70 border border-blue-100 text-[11px] text-blue-700">
                Kết quả sẽ được cập nhật tức thời trên màn hình chờ của toàn bộ thí sinh.
              </div>

              <button
                type="button"
                disabled={publishing}
                onClick={handlePublishResults}
                className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {publishing
                    ? 'Đang phát hành...'
                    : room.resultsPublished
                    ? 'Cập nhật công bố kết quả'
                    : 'Công bố kết quả cho thí sinh'}
                </span>
              </button>

              {publishSuccess && (
                <div className="text-[11px] text-emerald-600 font-semibold text-center">
                  ✓ Đã công bố kết quả thành công!
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Dòng thời gian phiên thi (Screen 09) */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
            <h2 className="font-bold text-neutral-900 uppercase tracking-wider">
              Dòng thời gian phiên
            </h2>

            <div className="space-y-3 pt-1 text-[11px]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-800">Tạo phòng thi</div>
                  <div className="text-slate-400">
                    {new Date(room.createdAt).toLocaleTimeString('vi-VN')} &bull;{' '}
                    {new Date(room.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-800">Mở phòng, đón thí sinh</div>
                  <div className="text-slate-400">{stats.totalJoined} thí sinh đã tham gia</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-800">Bắt đầu làm bài</div>
                  <div className="text-slate-400">
                    {room.startedAt ? new Date(room.startedAt).toLocaleTimeString('vi-VN') : '--'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-800">Kết thúc làm bài</div>
                  <div className="text-slate-400">
                    {room.endedAt ? new Date(room.endedAt).toLocaleTimeString('vi-VN') : '--'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-blue-700">Phiên thi đã kết thúc</div>
                  <div className="text-slate-400">Sẵn sàng xuất báo cáo & lưu trữ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
