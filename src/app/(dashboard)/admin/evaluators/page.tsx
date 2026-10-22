'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileCheck,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

interface EvaluatorProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  certificateCode: string;
  domains: string[];
  totalGraded: number;
  aiAgreementRate: number; // Tỷ lệ đồng thuận với AI Cross-Check (%)
  joinedDate: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  portfolioUrl?: string;
  bio: string;
}

export default function AdminEvaluatorsPage() {
  const [evaluators, setEvaluators] = useState<EvaluatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvaluator, setSelectedEvaluator] = useState<EvaluatorProfile | null>(null);

  const fetchEvaluators = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/evaluators');
      if (res.ok) {
        const json = await res.json();
        setEvaluators(json.evaluators || []);
      } else {
        setEvaluators([]);
      }
    } catch {
      setEvaluators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluators();
  }, [fetchEvaluators]);

  const pendingCount = evaluators.filter((e) => e.status === 'PENDING').length;

  const filteredEvaluators = evaluators.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'ALL' || e.status === 'PENDING';
    return matchSearch && matchTab;
  });

  const handleApprove = async (id: string) => {
    try {
      await fetch('/api/admin/evaluators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'APPROVED' }),
      });

      setEvaluators((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'APPROVED' } : e))
      );
    } catch (err) {
      console.error('Failed to approve evaluator:', err);
    }
    setSelectedEvaluator(null);
  };

  const handleReject = async (id: string) => {
    try {
      await fetch('/api/admin/evaluators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'REJECTED' }),
      });

      setEvaluators((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'REJECTED' } : e))
      );
    } catch (err) {
      console.error('Failed to reject evaluator:', err);
    }
    setSelectedEvaluator(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              HỘI ĐỒNG KHẢO THÍ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Duyệt &amp; Quản Lý Chuyên Gia Đánh Giá
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thẩm định hồ sơ chuyên gia, cấp quyền chấm bài Rubric thực hành và giám sát chất lượng chấm chéo cùng AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Hồ sơ chờ duyệt:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800 border border-amber-200">
            {pendingCount} hồ sơ
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Chuyên gia chính thức</span>
            <UserCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {evaluators.filter((e) => e.status === 'APPROVED').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Bảo chứng bởi tiêu chuẩn DigComp</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Hồ sơ mới tháng này</span>
            <Clock className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {pendingCount}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">Cần thẩm định trong 48h</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Độ đồng thuận với AI</span>
            <ShieldCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            96.3%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">AI Cross-Check độ lệch &lt; 5%</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Bài thực hành đã thẩm định</span>
            <FileCheck className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {evaluators.reduce((sum, e) => sum + e.totalGraded, 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tiêu chí Rubric minh chứng</div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-md border border-slate-200 bg-white">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Tất cả chuyên gia ({evaluators.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'PENDING'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>Chờ thẩm định</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc cơ quan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md text-xs pl-9 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Evaluators List */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-600" />
            <p className="text-xs">Đang tải danh sách chuyên gia khảo thí...</p>
          </div>
        ) : filteredEvaluators.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <UserCheck className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Không có chuyên gia nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || activeTab !== 'ALL'
                  ? 'Không tìm thấy hồ sơ người đánh giá phù hợp với bộ lọc hiện tại.'
                  : 'Hệ thống chưa ghi nhận người đánh giá nào được cấp quyền trong cơ sở dữ liệu.'}
              </p>
            </div>
            {(searchQuery || activeTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Chuyên gia khảo thí</th>
                  <th className="py-3 px-4">Cơ quan / Đơn vị</th>
                  <th className="py-3 px-4">Mã thẻ thẩm định</th>
                  <th className="py-3 px-4">Miền năng lực phụ trách</th>
                  <th className="py-3 px-4 text-center">Đã chấm</th>
                  <th className="py-3 px-4 text-center">Độ khớp AI</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEvaluators.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{e.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{e.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                      {e.organization}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 tabular-nums">
                      {e.certificateCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {e.domains.map((dom) => (
                          <span
                            key={dom}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            {dom}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums font-semibold text-slate-900">
                      {e.totalGraded}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums">
                      {e.aiAgreementRate > 0 ? (
                        <span className="font-semibold text-emerald-700">
                          {e.aiAgreementRate}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {e.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Đã duyệt
                        </span>
                      )}
                      {e.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ duyệt
                        </span>
                      )}
                      {e.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Từ chối
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvaluator(e)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold transition-colors"
                      >
                        {e.status === 'PENDING' ? 'Thẩm định' : 'Hồ sơ'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Evaluator Review & Approval */}
      {selectedEvaluator && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <UserCheck className="w-4 h-4 text-sky-600" />
                <span>Thẩm Định Hồ Sơ Chuyên Gia</span>
              </div>
              <button
                onClick={() => setSelectedEvaluator(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="text-sm font-bold text-slate-900">
                  {selectedEvaluator.name}
                </div>
                <div className="text-slate-500">{selectedEvaluator.email}</div>
                <div className="text-slate-700 font-medium pt-1">
                  Cơ quan: {selectedEvaluator.organization}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Tiểu sử &amp; Năng lực chuyên môn:
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200/60">
                  {selectedEvaluator.bio}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Miền năng lực đăng ký thẩm định:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvaluator.domains.map((dom) => (
                    <span
                      key={dom}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]"
                    >
                      {dom}
                    </span>
                  ))}
                </div>
              </div>

              {selectedEvaluator.portfolioUrl && (
                <div className="pt-2">
                  <a
                    href={selectedEvaluator.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sky-600 hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Xem minh chứng &amp; chứng chỉ đính kèm</span>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedEvaluator(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs transition-colors"
              >
                Đóng
              </button>

              {selectedEvaluator.status === 'PENDING' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(selectedEvaluator.id)}
                    className="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(selectedEvaluator.id)}
                    className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    Cấp quyền khảo thí
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-emerald-700 font-medium">
                  Hồ sơ đã được phê duyệt chính thức
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
