import { AssessmentStudio } from '@/features/assessments/components/AssessmentStudio';

export const metadata = {
  title: 'Thiết Kế Đề Khảo Thí Mới | NEXA Admin',
  description: 'Studio thiết kế bài khảo thí chuẩn hóa 5 miền năng lực số toàn diện',
};

export default function AdminNewAssessmentPage() {
  return <AssessmentStudio role="ADMIN" />;
}
