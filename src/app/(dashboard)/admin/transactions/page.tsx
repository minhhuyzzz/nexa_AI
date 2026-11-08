'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Layers,
  Clock,
  AlertTriangle,
  Download,
  BookOpen,
  Search,
  Calendar,
  Package,
  Users,
  RefreshCw,
  Check,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ExternalLink,
  ArrowUpDown,
  Building2,
  ShieldCheck,
  X,
  FileCheck2,
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
  idempotency_key?: string;
  status: 'PENDING' | 'SUCCESS' | 'COMPLETED' | 'FAILED';
  reconciled?: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  proof_reference?: string;
  created_at: string;
  profiles?: {
    email: string;
    nickname: string;
    full_name?: string;
  };
  organization?: {
    name: string;
    code: string;
  };
}

export default function AdminTransactionsPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'reconciliation'>('transactions');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECONCILED' | 'ACTION_REQUIRED'>('ALL');
  
  // Additional Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  
  // Reconcile Modal State
  const [reconcileTx, setReconcileTx] = useState<TransactionItem | null>(null);
  const [proofReference, setProofReference] = useState('');
  const [reconcileReason, setReconcileReason] = useState('');
  const [reconcileSubmitting, setReconcileSubmitting] = useState(false);
  const [reconcileError, setReconcileError] = useState('');

  // Dropdown Action Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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

  // Filtered counts
  const verifiedList = transactions.filter(
    (t) => (t.status === 'SUCCESS' || t.status === 'COMPLETED') && t.reconciled
  );
  const pendingReconcileList = transactions.filter(
    (t) => (t.status === 'SUCCESS' || t.status === 'COMPLETED') && !t.reconciled
  );
  const actionRequiredList = transactions.filter(
    (t) => t.status === 'FAILED' || t.status === 'PENDING'
  );

  const totalVerifiedAmount = verifiedList.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  // Filtered transactions for table
  const filteredTransactions = transactions.filter((tx) => {
    // Status Filter
    if (statusFilter === 'PENDING') {
      const isPending = (tx.status === 'SUCCESS' || tx.status === 'COMPLETED') && !tx.reconciled;
      if (!isPending) return false;
    } else if (statusFilter === 'RECONCILED') {
      const isReconciled = (tx.status === 'SUCCESS' || tx.status === 'COMPLETED') && tx.reconciled;
      if (!isReconciled) return false;
    } else if (statusFilter === 'ACTION_REQUIRED') {
      const isAction = tx.status === 'FAILED' || tx.status === 'PENDING';
      if (!isAction) return false;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = tx.transaction_reference?.toLowerCase().includes(q);
      const matchEmail = tx.profiles?.email?.toLowerCase().includes(q);
      const matchName = tx.profiles?.nickname?.toLowerCase().includes(q) || tx.profiles?.full_name?.toLowerCase().includes(q);
      const matchOrg = tx.organization?.name?.toLowerCase().includes(q);
      if (!matchRef && !matchEmail && !matchName && !matchOrg) return false;
    }

    // Plan Filter
    if (planFilter !== 'ALL') {
      if (tx.plan_code?.toUpperCase() !== planFilter) return false;
    }

    // Customer Type Filter
    if (customerTypeFilter === 'ORGANIZATION' && !tx.organization_id) return false;
    if (customerTypeFilter === 'PERSONAL' && tx.organization_id) return false;

    return true;
  });

  const handleOpenReconcileModal = (tx: TransactionItem) => {
    setActiveMenuId(null);
    setReconcileTx(tx);
    setProofReference(`BANK-REF-${new Date().getFullYear()}-`);
    setReconcileReason('Xác nhận biến động số dư tài khoản ngân hàng thụ hưởng NEXA (payOS)');
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
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch {
      setReconcileError('Lỗi kết nối máy chủ');
    } finally {
      setReconcileSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = `/api/admin/transactions/export?status=${statusFilter}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Thanh toán &amp; Đối soát
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Theo dõi và đối soát các giao dịch thanh toán gói dịch vụ của người dùng và tổ chức.
        </p>
      </div>

      {/* 2. Top Navigation Tabs (Pill Tabs, không gạch chân) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Giao dịch</span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Đối soát</span>
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-700 dark:text-emerald-400 hover:underline font-normal text-xs"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3. Top Metrics Strip & Action Box (Row 1) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Doanh thu đã xác nhận */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Doanh thu đã xác nhận
            </span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {totalVerifiedAmount.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
            Tổng số tiền đã đối soát thành công
          </p>
        </div>

        {/* Metric 2: Chờ đối soát */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Chờ đối soát
            </span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {pendingReconcileList.length}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
            Giao dịch đã thanh toán, chờ xác nhận
          </p>
        </div>

        {/* Metric 3: Cần xử lý */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Cần xử lý
            </span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {actionRequiredList.length}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
            Giao dịch có lỗi hoặc thông tin chưa khớp
          </p>
        </div>

        {/* Metric 4: Hành động (Right Card) */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Hành động
          </div>
          <button
            onClick={handleExportCsv}
            className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file CSV</span>
          </button>
        </div>
      </div>

      {/* 4. Main Body: 3/4 Table Content + 1/4 Quick Guide Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Content Area (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Status Pills Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Tất cả ({transactions.length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs ${
                statusFilter === 'PENDING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Chờ đối soát ({pendingReconcileList.length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('RECONCILED')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs ${
                statusFilter === 'RECONCILED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đã đối soát ({verifiedList.length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ACTION_REQUIRED')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs ${
                statusFilter === 'ACTION_REQUIRED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Cần xử lý ({actionRequiredList.length})</span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã giao dịch, người dùng hoặc tổ chức..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
                >
                  <option value="ALL">Tất cả thời gian</option>
                  <option value="TODAY">Hôm nay</option>
                  <option value="7D">7 ngày qua</option>
                  <option value="30D">30 ngày qua</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
                >
                  <option value="ALL">Tất cả gói dịch vụ</option>
                  <option value="FREE">Gói FREE</option>
                  <option value="PRO">Gói PRO</option>
                  <option value="BUSINESS">Gói BUSINESS</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={customerTypeFilter}
                  onChange={(e) => setCustomerTypeFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
                >
                  <option value="ALL">Tất cả loại khách hàng</option>
                  <option value="PERSONAL">Cá nhân</option>
                  <option value="ORGANIZATION">Tổ chức B2B</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table & Empty State */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1 cursor-pointer">
                        <span>Mã giao dịch</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Gói dịch vụ</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Trạng thái thanh toán</th>
                    <th className="py-3 px-4">Trạng thái đối soát</th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1 cursor-pointer">
                        <span>Thời gian</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>

                {filteredTransactions.length > 0 ? (
                  <tbody className="">
                    {filteredTransactions.map((tx) => {
                      const isSuccess = tx.status === 'SUCCESS' || tx.status === 'COMPLETED';
                      const isPending = tx.status === 'PENDING';
                      const isReconciled = tx.reconciled;

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                            {tx.transaction_reference}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {tx.organization?.name || tx.profiles?.full_name || tx.profiles?.nickname || 'Khách vãng lai'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {tx.profiles?.email || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              {tx.plan_code?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {Number(tx.amount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-4">
                            {isSuccess ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Thành công
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Chờ thanh toán
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                Thất bại
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isReconciled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3 h-3" />
                                Đã đối soát
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                <Clock className="w-3 h-3" />
                                Chờ đối soát
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3 text-right relative">
                            <button
                              onClick={() =>
                                setActiveMenuId(activeMenuId === tx.id ? null : tx.id)
                              }
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === tx.id && (
                              <div className="absolute right-3 top-10 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-20 text-left text-xs">
                                {!isReconciled && isSuccess && (
                                  <button
                                    onClick={() => handleOpenReconcileModal(tx)}
                                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-blue-600 font-semibold"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    <span>Xác nhận đối soát</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    alert(`Mã giao dịch: ${tx.transaction_reference}\nKhách hàng: ${tx.profiles?.email || 'N/A'}`);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-neutral-700 dark:text-zinc-200"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Xem chi tiết</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ) : null}
              </table>

              {/* Pixel-Perfect Empty State matching user's screenshot */}
              {filteredTransactions.length === 0 && (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                  {/* Document with Magnifying Glass SVG Illustration */}
                  <div className="relative mb-5 w-24 h-24 flex items-center justify-center">
                    {/* Background glow circle */}
                    <div className="absolute inset-0 rounded-full bg-blue-50/80 dark:bg-blue-950/40" />

                    {/* Sparkles / motion accents */}
                    <div className="absolute top-2 right-4 text-blue-400 font-mono text-xs select-none">
                      ✦
                    </div>
                    <div className="absolute top-4 right-1 text-blue-300 font-mono text-[10px] select-none">
                      /
                    </div>

                    {/* Document shape */}
                    <div className="relative z-10 w-12 h-16 bg-white dark:bg-zinc-850 border-2 border-blue-200 dark:border-blue-900 rounded-md shadow-xs flex flex-col justify-between p-2">
                      <div className="space-y-1.5 pt-1">
                        <div className="h-1 bg-blue-500 rounded-full w-7" />
                        <div className="h-1 bg-blue-400 rounded-full w-5" />
                        <div className="h-1 bg-blue-300 rounded-full w-6" />
                      </div>
                      <div className="h-0.5 bg-slate-200 dark:bg-zinc-700 rounded-full w-4" />
                    </div>

                    {/* Magnifying glass overlay */}
                    <div className="absolute z-20 bottom-3 right-5 transform translate-x-1 translate-y-1">
                      <div className="w-7 h-7 rounded-full border-2 border-blue-600 bg-white/70 dark:bg-zinc-900/70 shadow-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-100 dark:bg-blue-900/60" />
                      </div>
                      <div className="w-1.5 h-3.5 bg-blue-600 rounded-full transform rotate-45 -mt-1 ml-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Chưa có giao dịch nào
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                    Danh sách giao dịch sẽ hiển thị khi có thanh toán từ người dùng hoặc tổ chức.
                  </p>

                  <button
                    onClick={fetchTransactions}
                    disabled={loading}
                    className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Hướng dẫn nhanh (1 Column) */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-neutral-100">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Hướng dẫn nhanh</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>Xem và xác nhận các giao dịch chờ đối soát.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>Kiểm tra chứng từ khi có giao dịch ngoại lệ.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>Cập nhật trạng thái đối soát sau khi kiểm tra.</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="#guide"
              onClick={(e) => {
                e.preventDefault();
                alert('Quy trình đối soát tự động tích hợp payOS HMAC-SHA256: Khi người dùng thanh toán qua cổng payOS, hệ thống tự động ghi nhận biến động số dư và kích hoạt gói tức thì.');
              }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Xem chi tiết hướng dẫn</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Manual Reconciliation Modal */}
      {reconcileTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Xác nhận đối soát thủ công
                </h3>
              </div>
              <button
                onClick={() => setReconcileTx(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Mã tham chiếu ngân hàng (Bank Ref):</label>
                <input
                  type="text"
                  required
                  value={proofReference}
                  onChange={(e) => setProofReference(e.target.value)}
                  placeholder="e.g. FT2601009988..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Lý do đối soát / Ghi chú kiểm toán:</label>
                <textarea
                  rows={3}
                  required
                  value={reconcileReason}
                  onChange={(e) => setReconcileReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {reconcileError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs">
                  {reconcileError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReconcileTx(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={reconcileSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {reconcileSubmitting ? 'Đang xác nhận...' : 'Xác nhận đối soát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
