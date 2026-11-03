'use client';

import React, { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { QuickActionsBento } from './QuickActionsBento';
import { ActionItemsQueueCard } from './ActionItemsQueueCard';
import { UpcomingScheduleCard } from './UpcomingScheduleCard';
import { OrgClassesDirectoryView } from './OrgClassesDirectoryView';
import { GroupTypeDistributionCard } from './GroupTypeDistributionCard';
import { ClassOperationalTipsCard } from './ClassOperationalTipsCard';
import { CreateClassModal } from './CreateClassModal';
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

  // Metrics for Action Items
  const unassignedInstructorCount = classes.filter(
    (c) => !c.instructorName || c.instructorName === 'Chưa phân công'
  ).length;
  const classesWithoutAssignmentsCount = classes.filter((c) => c.assignmentsCount === 0).length;
  const pendingEnrollmentRequestsCount = 1;

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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Lớp & nhóm
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 tabular-nums">
              {classes.length} lớp & nhóm
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Quản lý các lớp học, phòng ban, khóa/đợt và nhóm học tập, đánh giá trong {organizationName}.
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Nhập danh sách
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo lớp / nhóm
            </button>
          </div>
        )}
      </div>

      {/* Top 3 Bento Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionsBento
          onOpenCreateClass={() => setIsCreateModalOpen(true)}
          onOpenAddMembers={() => {
            if (classes[0]) window.location.href = `/org/${slug}/classes/${classes[0].id}`;
          }}
          onOpenAssignAssessment={() => {
            if (classes[0]) window.location.href = `/org/${slug}/classes/${classes[0].id}`;
          }}
          onExportList={handleExportCSV}
        />

        <ActionItemsQueueCard
          unassignedInstructorCount={unassignedInstructorCount}
          classesWithoutAssignmentsCount={classesWithoutAssignmentsCount}
          pendingEnrollmentRequestsCount={pendingEnrollmentRequestsCount}
          onFilterUnassigned={() => {}}
          onFilterWithoutAssignments={() => {}}
          onNavigateRequests={() => {
            window.location.href = `/org/${slug}/members`;
          }}
        />

        <UpcomingScheduleCard />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Directory (8 cols) */}
        <div className="lg:col-span-8">
          <OrgClassesDirectoryView
            classes={classes}
            slug={slug}
            isManager={isManager}
            onOpenCreateClass={() => setIsCreateModalOpen(true)}
          />
        </div>

        {/* Right Column: Donut & Tips (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <GroupTypeDistributionCard classes={classes} />
          <ClassOperationalTipsCard />
        </div>
      </div>

      {/* Modal: Create Class (Screen 02) */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        organizationId={organizationId}
        onSuccess={refreshClasses}
      />
    </div>
  );
}
