'use client';

import React, { useState } from 'react';
import { Plus, Download, FolderKanban } from 'lucide-react';
import { OrgClassesDirectoryView } from './OrgClassesDirectoryView';
import { CreateClassModal } from './CreateClassModal';
import { OrgEmptyState } from '@/components/dashboard/org/org-ui/OrgEmptyState';
import type { OrgClassItem } from './types';

interface OrgClassesDashboardClientProps {
  organizationId: string;
  organizationName: string;
  slug: string;
  initialClasses: OrgClassItem[];
  isManager: boolean;
}

export function OrgClassesDashboardClient({
  organizationId,
  organizationName,
  slug,
  initialClasses,
  isManager,
}: OrgClassesDashboardClientProps) {
  const [classes, setClasses] = useState<OrgClassItem[]>(initialClasses);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const refreshClasses = async () => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/classes`);
      if (res.ok) {
        const data = await res.json();
        if (data.classes) {
          setClasses(data.classes);
        }
      }
    } catch {
      // keep existing state
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      '\uFEFF' +
      'MaLop,TenLop,LoaiNhom,TrangThai,HocKy,GiangVien,SoThanhVien,SoDeGiao\n' +
      classes
        .map(
          (c) =>
            `"${c.classCode}","${c.name}","${c.groupType}","${c.status}","${c.term || ''}","${c.instructorName || ''}",${c.membersCount},${c.assignmentsCount}`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexa_danh_sach_lop_${slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Lớp &amp; Nhóm Đơn Vị
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 tabular-nums">
              {classes.length} đơn vị
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Quản lý các lớp học, phòng ban và nhóm học tập, đánh giá trực thuộc {organizationName}.
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2.5 shrink-0">
            {classes.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo lớp / nhóm mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Directory or Empty State */}
      {classes.length === 0 ? (
        <OrgEmptyState
          icon={<FolderKanban className="w-5 h-5" strokeWidth={1.75} />}
          title="Tổ chức chưa có lớp hoặc nhóm làm việc"
          description="Khởi tạo các lớp học hoặc nhóm đơn vị để phân chia thành viên và giao bài khảo thí theo nhóm."
          actionText={isManager ? "Tạo lớp / nhóm đầu tiên" : undefined}
          onAction={isManager ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <OrgClassesDirectoryView
          classes={classes}
          slug={slug}
          isManager={isManager}
          onOpenCreateClass={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        organizationId={organizationId}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refreshClasses();
        }}
      />
    </div>
  );
}
