import { AssessmentStudio } from '@/features/assessments/components/AssessmentStudio';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Chỉnh Sửa Đề Khảo Thí | NEXA Evaluator',
  description: 'Trình biên soạn câu hỏi và thiết lập phòng thi chuyên gia',
};

export default async function EvaluatorAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssessmentStudio role="EVALUATOR" assessmentId={id} />;
}
