'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Check,
  RefreshCw,
  CreditCard,
  Building2,
  AlertCircle,
  FileCheck2,
  X,
  ShieldAlert,
  Download,
} from 'lucide-react';

interface TransactionItem {
  id: string;
  user_id: string;
  organization_id?: string;
  plan_code: string;
  amount: number;
  currency: string;
  provider: string;
  transaction_reference: string;
  idempotency_key: string;
  status: 'PENDING' | 'SUCCESS' | 'COMPLETED' | 'FAILED';
  verified_at?: string;
  created_at: string;
  profiles?: {
    email: string;
    nickname: string;
  };
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'success' | 'refund' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Reconcile Modal State
  const [reconcileTx, setReconcileTx] = useState<TransactionItem | null>(null);
  const [proofReference, setProofReference] = useState('');
  const [reconcileReason, setReconcileReason] = useState('');
  const [reconcileSubmitting, setReconcileSubmitting] = useState(false);
  const [reconcileError, setReconcileError] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/transactions');
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const pendingList = transactions.filter((t) => t.status === 'PENDING');
  const successList = transactions.filter(
    (t) => t.status === 'SUCCESS' || t.status === 'COMPLETED'
  );
  const failedList = transactions.filter((t) => t.status === 'FAILED');

  const totalVerifiedRevenue = successList.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const filteredList = transactions.filter((item) => {
    const isSuccess = item.status === 'SUCCESS' || item.status === 'COMPLETED';
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && item.status === 'PENDING') ||
      (activeTab === 'success' && isSuccess) ||
      (activeTab === 'refund' && item.status === 'FAILED');

    const matchesSearch =
      !searchQuery.trim() ||
      item.transaction_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.plan_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.profiles?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.profiles?.nickname || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleOpenReconcileModal = (tx: TransactionItem) => {
    setReconcileTx(tx);
    setProofReference(`BANK-REF-${new Date().getFullYear()}-`);
    setReconcileReason('Xác nhận biến động số dư tài khoản ngân hàng thụ hưởng NEXA');
    setReconcileError('');
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileTx) return;

    setReconcileSubmitting(true);
    setReconcileError('');

    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: reconcileTx.id,
          proofReference: proofReference.trim(),
          reason: reconcileReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReconcileError(data.error || 'Lỗi khi đối soát giao dịch');
        return;
      }

      setActionSuccessMsg(
        `Đã đối soát thành công giao dịch "${reconcileTx.transaction_reference}". Quyền hạn tài khoản đã được cấp.`
      );
      setReconcileTx(null);
      await fetchTransactions();
    } catch {
      setReconcileError('Lỗi kết nối máy chủ');
    } finally {
      setReconcileSubmitting(false);
    }
  };

  const handleExportReconciliationCsv = () => {
    const rows = [
      ['Mã Giao Dịch', 'Email Khách Hàng', 'Gói Dịch Vụ', 'Số Tiền', 'Đơn Vị', 'Trạng Thái', 'Thời Gian'],
      ...filteredList.map((t) => [
        t.transaction_reference,
        t.profiles?.email || 'N/A',
        t.plan_code,
        t.amount.toString(),
        t.currency,
        t.status,
        new Date(t.created_at).toISOString(),
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexa_financial_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
              FINANCIAL RECONCILIATION WORKBENCH
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Sổ Cái Giao Dịch &amp; Đối Soát Doanh Thu
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Kiểm soát thanh toán nâng cấp gói, đối soát chuyển khoản ngân hàng có căn cứ minh chứng và ghi nhận audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportReconciliationCsv}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Xuất file CSV</span>
          </button>
          <button
            onClick={fetchTransactions}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
            <span>Làm mới</span>
          </button>
          <Link
            href="/admin/plans"
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cấu hình 3 gói</span>
          </Link>
        </div>
      </div>

      {/* 2. Notification */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-700 dark:text-emerald-400 hover:underline font-normal text-[11px]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3. Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-md bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between mb-1">
            <span>Doanh thu đối soát thực tế</span>
            <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {totalVerifiedRevenue.toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
            Từ {successList.length} giao dịch đã khớp
          </div>
        </div>

        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between mb-1">
            <span>Chờ đối soát chuyển khoản</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
            {pendingList.length}
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-mono">
            Cần đối chiếu sao kê ngân hàng
          </div>
        </div>

        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between mb-1">
            <span>Tổng giao dịch hệ thống</span>
            <CreditCard className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {transactions.length}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 font-mono">
            Toàn bộ sổ cái giao dịch
          </div>
        </div>

        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between mb-1">
            <span>Cơ chế bảo đảm</span>
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-mono mt-1">
            FAIL-CLOSED
          </div>
          <div className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5 font-mono">
            Bắt buộc mã chứng từ &amp; Audit Log
          </div>
        </div>
      </div>

      {/* 4. Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${activeTab === 'pending' ? 'bg-white' : 'bg-amber-500'}`}
            />
            <span>Chờ đối soát ({pendingList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('success')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'success'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${activeTab === 'success' ? 'bg-white' : 'bg-emerald-600'}`}
            />
            <span>Đã khớp sao kê ({successList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'refund'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
            }`}
          >
            <span>Ngoại lệ &amp; Hủy ({failedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-neutral-900 dark:bg-zinc-200 text-white dark:text-zinc-900'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
            }`}
          >
            Tất cả ({transactions.length})
          </button>
        </div>

        <div className="relative text-xs min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã giao dịch, email khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
          />
        </div>
      </div>

      {/* 5. Transactions Table */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-[#111114] text-xs shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900 text-slate-500 dark:text-neutral-400 text-[11px] font-semibold font-mono">
                <th className="py-2.5 px-3.5 w-32">MÃ ĐỐI SOÁT</th>
                <th className="py-2.5 px-3.5">KHÁCH HÀNG</th>
                <th className="py-2.5 px-3.5">GÓI DỊCH VỤ</th>
                <th className="py-2.5 px-3.5 text-right">SỐ TIỀN</th>
                <th className="py-2.5 px-3.5 text-center">TRẠNG THÁI</th>
                <th className="py-2.5 px-3.5 text-right">THỜI GIAN</th>
                <th className="py-2.5 px-3.5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                    Đang tải danh sách giao dịch...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                    Không có giao dịch nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {tx.transaction_reference}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {tx.profiles?.nickname || 'Khách hàng'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                        {tx.profiles?.email || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-neutral-800 dark:text-zinc-200 font-semibold">
                      {tx.plan_code}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {Number(tx.amount || 0).toLocaleString('vi-VN')} {tx.currency || 'VND'}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {tx.status === 'SUCCESS' || tx.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã khớp sao kê
                        </span>
                      ) : tx.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Chờ đối soát
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right text-slate-400 dark:text-neutral-500 font-mono text-[11px]">
                      {new Date(tx.created_at).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {tx.status === 'PENDING' ? (
                        <button
                          onClick={() => handleOpenReconcileModal(tx)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors shadow-xs inline-flex items-center gap-1"
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>Đối soát thủ công</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                          {tx.verified_at ? 'Đã khớp' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECONCILE MODAL */}
      {reconcileTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] rounded-md border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Đối Soát Chuyển Khoản Ngân Hàng
                </h2>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                  Mã giao dịch: {reconcileTx.transaction_reference}
                </div>
              </div>
              <button
                onClick={() => setReconcileTx(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reconcileError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-rose-800 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{reconcileError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Khách hàng:</span>
                <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{reconcileTx.profiles?.email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Gói đăng ký:</span>
                <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{reconcileTx.plan_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Số tiền cần khớp:</span>
                <span className="text-neutral-900 dark:text-neutral-100 font-bold">{Number(reconcileTx.amount).toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-3.5">
              <div>
                <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                  Mã chứng từ / Sao kê ngân hàng (Proof Reference): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={proofReference}
                  onChange={(e) => setProofReference(e.target.value)}
                  placeholder="ví dụ: FT24098716298371 hoặc payOS_TRANS_ID"
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                  Căn cứ / Ghi chú đối soát:
                </label>
                <textarea
                  rows={2}
                  required
                  value={reconcileReason}
                  onChange={(e) => setReconcileReason(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReconcileTx(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reconcileSubmitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {reconcileSubmitting ? 'Đang xác nhận...' : 'Xác nhận đối soát & Cấp quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
