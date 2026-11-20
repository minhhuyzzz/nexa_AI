import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProofMarquee } from '@/components/landing/SocialProofMarquee';
import { CoreHighlightsSection } from '@/components/landing/CoreHighlightsSection';
import { CompetencyFrameworkSection } from '@/components/landing/CompetencyFrameworkSection';
import { AssessmentFormatsSection } from '@/components/landing/AssessmentFormatsSection';
import { AiWorkflowSection } from '@/components/landing/AiWorkflowSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CtaBannerSection } from '@/components/landing/CtaBannerSection';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://nexa.ai.vn/#website',
      url: 'https://nexa.ai.vn',
      name: 'NEXA — Nền tảng Đánh giá & Phát triển Năng lực Số',
      description:
        'Nền tảng đo lường và phát triển năng lực số toàn diện. Đánh giá chuẩn xác các miền năng lực số, phát hiện khoảng trống kỹ năng và mở khóa lộ trình bồi dưỡng cá nhân hóa.',
      inLanguage: 'vi',
    },
    {
      '@type': 'EducationalApplication',
      '@id': 'https://nexa.ai.vn/#app',
      name: 'NEXA',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'VND',
      },
      featureList: [
        'Khảo thí đầu vào các miền năng lực số',
        'Hồ sơ năng lực số',
        'Lộ trình bồi dưỡng cá nhân hóa',
        'Phòng thi trực tiếp',
        'Bàn chấm Rubric',
        'Chứng nhận số có mã xác thực',
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans transition-colors overflow-x-hidden">
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1. Header công khai */}
      <PublicHeader activePath="/" />

      {/* 2. Nội dung các phân đoạn độc lập */}
      <main className="flex-1">
        {/* Phân đoạn Hero Nền Trắng Thuần Khiết */}
        <HeroSection />

        {/* Phân đoạn Đối tác & Cơ sở giáo dục uy tín */}
        <SocialProofMarquee />

        {/* Phân đoạn Khảo thí & Lộ trình bồi dưỡng (Bento Grid) */}
        <CoreHighlightsSection />

        {/* Phân đoạn Các Miền Năng Lực Số */}
        <CompetencyFrameworkSection />

        {/* Phân đoạn 4 Hình thức khảo thí thực tế */}
        <AssessmentFormatsSection />

        {/* Phân đoạn Quy trình khảo thí & bồi dưỡng */}
        <AiWorkflowSection />

        {/* Phân đoạn Bảng giá dịch vụ */}
        <PricingSection />

        {/* Phân đoạn Kêu gọi hành động */}
        <CtaBannerSection />
      </main>

      {/* 3. Footer dải lụa mượt mà chân thực */}
      <PublicFooter />
    </div>
  );
}
