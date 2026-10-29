import { AssessmentStudio } from '@/features/assessments/components/AssessmentStudio';

export const metadata = {
  title: 'Soạn Đề Khảo Thí Mới | NEXA Evaluator',
  description: 'Studio soạn đề khảo thí và thiết lập phòng thi chuyên gia',
};

export default function EvaluatorNewAssessmentPage() {
  return <AssessmentStudio role="EVALUATOR" />;
}
