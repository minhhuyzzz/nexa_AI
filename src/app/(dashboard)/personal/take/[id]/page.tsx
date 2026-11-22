'use client';

import { use, Suspense } from 'react';
import { AssessmentTakeContent } from '@/features/assessments/components/take/AssessmentTakeContent';

export default function AssessmentTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Đang chuẩn bị câu hỏi khảo thí...</p>
        </div>
      }
    >
      <AssessmentTakeContent assessmentId={resolvedParams.id} />
    </Suspense>
  );
}
