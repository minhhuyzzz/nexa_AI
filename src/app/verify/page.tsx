import type { Metadata } from 'next';
import { VerifySearchClientView } from './VerifySearchClientView';

export const metadata: Metadata = {
  title: 'Tra cứu chứng nhận số — NEXA AI',
  description: 'Cổng đối soát và xác thực tính toàn vẹn chứng chỉ năng lực số chuẩn SHA-256 kép của NEXA AI.',
};

export default function VerifyIndexPage() {
  return <VerifySearchClientView />;
}
