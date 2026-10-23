import { AssessmentStudio } from '@/features/assessments/components/AssessmentStudio';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Chỉnh Sửa Đề Khảo Thí | NEXA Admin',
  description: 'Trình biên soạn ma trận câu hỏi và tiêu chuẩn đánh giá năng lực số',
};

export default async function AdminAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssessmentStudio role="ADMIN" assessmentId={id} />;
}
