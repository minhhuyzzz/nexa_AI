'use client';

import React, { useState } from 'react';
import {
  Check,
  X,
  Search,
  RotateCw,
  Clock,
  MessageSquare,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { MembershipRequestItem } from './types';

interface ApprovalQueueViewProps {
  organizationId: string;
  requests: MembershipRequestItem[];
  loading: boolean;
  onRefresh: () => void;
  onRequestHandled: () => void;
}

export function ApprovalQueueView({
  organizationId,
  requests,
  loading,
  onRefresh,
  onRequestHandled,
}: ApprovalQueueViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeRequest, setActiveRequest] = useState<MembershipRequestItem | null>(
    requests[0] || null
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId);
    setActionError(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/membership-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác phê duyệt thất bại');
      }

      onRequestHandled();
      setSelectedIds((prev) => prev.filter((id) => id !== requestId));
      if (activeRequest?.id === requestId) {
        const remaining = requests.filter((r) => r.id !== requestId);
        setActiveRequest(remaining[0] || null);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (selectedIds.length === 0) return;
    setProcessingId('batch');
    setActionError(null);

    try {
      for (const id of selectedIds) {
        await fetch(`/api/organizations/${organizationId}/membership-requests`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: id, action }),
        });
      }
      setSelectedIds([]);
      onRequestHandled();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Có lỗi khi xử lý hàng loạt');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Requests Table (2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500"
              title="Làm mới"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {requests.length} yêu cầu
            </span>
          </div>
        </div>

        {/* Requests Table */}
        <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-zinc-900/60 text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={requests.length > 0 && selectedIds.length === requests.length}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-4">Người yêu cầu</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Nguồn</th>
                <th className="py-2.5 px-4">Vai trò đề xuất</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-neutral-500 text-xs">
                    Hiện không có yêu cầu gia nhập nào đang chờ xử lý.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isRowSelected = selectedIds.includes(r.id);
                  const isCurrentActive = activeRequest?.id === r.id;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setActiveRequest(r)}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer ${
                        isCurrentActive ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td
                        className="py-3 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(r.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => {}}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                        {r.full_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                        {r.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {r.organization_join_codes?.title || 'Mã gia nhập'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                          {r.proposed_role === 'ORG_ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 tabular-nums">
                        {new Date(r.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Chờ duyệt</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Batch Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Đã chọn <strong className="font-mono text-blue-600">{selectedIds.length}</strong> yêu cầu
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchAction('APPROVED')}
                  disabled={processingId === 'batch'}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Phê duyệt đồng loạt</span>
                </button>
                <button
                  onClick={() => handleBatchAction('REJECTED')}
                  disabled={processingId === 'batch'}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs font-semibold text-rose-600 transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Selected Request Detail Panel */}
      <div className="space-y-4">
        {activeRequest ? (
          <div className="p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Duyệt yêu cầu
              </h3>
              <span className="text-[11px] text-slate-400">Chi tiết ứng viên</span>
            </div>

            {/* Candidate Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold font-mono text-xs">
                {activeRequest.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {activeRequest.full_name}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {activeRequest.email}
                </div>
              </div>
            </div>

            {/* Reason Quote */}
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1">
                Lý do tham gia
              </div>
              <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-850 text-xs text-slate-700 dark:text-zinc-300 italic">
                &ldquo;{activeRequest.reason || 'Muốn tham gia lớp học và thực hiện bài đánh giá năng lực số theo đợt.'}&rdquo;
              </div>
            </div>

            {/* Request Meta Info */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Lớp được chọn:</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  {activeRequest.class_name || 'CNTT-K24A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Vai trò đề xuất:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {activeRequest.proposed_role === 'ORG_ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Nguồn tham gia:</span>
                <span className="text-neutral-700 dark:text-zinc-300">
                  {activeRequest.organization_join_codes?.title || 'Mã gia nhập tổ chức'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Thời gian gửi:</span>
                <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-neutral-400">
                  {new Date(activeRequest.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-2">
                Lịch sử xử lý
              </div>
              <div className="border-l-2 border-blue-500 ml-1 pl-3 space-y-2 text-xs">
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Đã gửi yêu cầu gia nhập
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(activeRequest.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-amber-600 dark:text-amber-400">
                    Đang chờ quản trị viên phê duyệt
                  </div>
                  <div className="text-[10px] text-slate-400">Hệ thống đã ghi nhận</div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {actionError && (
              <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => handleAction(activeRequest.id, 'APPROVED')}
                disabled={processingId === activeRequest.id}
                className="flex-1 py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                {processingId === activeRequest.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Phê duyệt</span>
              </button>

              <button
                onClick={() => handleAction(activeRequest.id, 'REJECTED')}
                disabled={processingId === activeRequest.id}
                className="py-2 px-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs font-semibold text-rose-600 transition-colors inline-flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Từ chối</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center text-xs text-slate-400">
            Chọn một yêu cầu bên danh sách để xem chi tiết lý do và duyệt thành viên.
          </div>
        )}
      </div>
    </div>
  );
}
