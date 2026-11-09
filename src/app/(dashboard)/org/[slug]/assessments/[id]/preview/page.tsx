import { Suspense } from 'react';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { AssessmentTakeContent } from '@/app/(dashboard)/personal/take/[id]/page';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Xem Trước Bài Khảo Thí | NEXA Doanh Nghiệp & Tổ Chức',
  description: 'Chế độ xem trước không gian làm bài khảo thí dành cho Khảo thí viên của Tổ chức',
};

export default async function OrgAssessmentPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'MANAGE_ASSESSMENTS');

  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Đang tải không gian làm bài khảo thí...
          </p>
        </div>
      }
    >
      <AssessmentTakeContent
        assessmentId={id}
        overrideReturnUrl={`/org/${slug}/assessments/${id}/edit`}
        isPreviewMode={true}
        workspaceTitle={org.name || slug}
      />
    </Suspense>
  );
}
