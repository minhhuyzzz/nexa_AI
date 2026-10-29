import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { CoreHighlightsSection } from '@/components/landing/CoreHighlightsSection';
import { CompetencyFrameworkSection } from '@/components/landing/CompetencyFrameworkSection';
import { AssessmentFormatsSection } from '@/components/landing/AssessmentFormatsSection';
import { AiWorkflowSection } from '@/components/landing/AiWorkflowSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CtaBannerSection } from '@/components/landing/CtaBannerSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* 1. Header công khai */}
      <PublicHeader activePath="/" />

      {/* 2. Nội dung các phân đoạn độc lập */}
      <main className="flex-1">
        {/* Phân đoạn Hero & Biểu đồ Radar 5 Miền */}
        <HeroSection />

        {/* Phân đoạn 3 Điểm nhấn Cốt lõi */}
        <CoreHighlightsSection />

        {/* Phân đoạn 5 Miền Năng Lực Số Chuẩn Hóa */}
        <CompetencyFrameworkSection />

        {/* Phân đoạn 4 Định Dạng Khảo Thí */}
        <AssessmentFormatsSection />

        {/* Phân đoạn Quy Trình Trí Tuệ Nhân Tạo Kích Hoạt Theo Yêu Cầu */}
        <AiWorkflowSection />

        {/* Phân đoạn Bảng Giá & Gói Dịch Vụ */}
        <PricingSection />

        {/* Phân đoạn Kêu Gọi Hành Động (CTA) */}
        <CtaBannerSection />
      </main>

      {/* 3. Footer học thuật toàn diện */}
      <PublicFooter />
    </div>
  );
}
