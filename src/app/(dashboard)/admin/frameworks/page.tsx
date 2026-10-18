import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Layers,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export default async function AdminFrameworksPage() {
  const supabase = await createClient();

  // Fetch active framework with domains and competencies
  const { data: frameworks } = await supabase
    .from('assessment_frameworks')
    .select(`
      id,
      code,
      name,
      version,
      description,
      is_active,
      competency_domains (
        id,
        domain_code,
        name,
        description,
        display_order,
        competencies (
          id,
          skill_code,
          name,
          target_level,
          display_order
        )
      )
    `)
    .eq('is_active', true)
    .single();

  const mockFallbackDomains = [
    {
      id: 'dom-1',
      domain_code: 'MIỀN 1',
      name: 'Thông tin và Dữ liệu số',
      description: 'Tìm kiếm, lọc, đánh giá và quản lý dữ liệu số.',
      display_order: 1,
      competencies: [
        { id: 'c-11', skill_code: '1.1', name: 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số', target_level: 4, display_order: 1 },
        { id: 'c-12', skill_code: '1.2', name: 'Đánh giá độ tin cậy của dữ liệu, thông tin và nội dung số', target_level: 4, display_order: 2 },
        { id: 'c-13', skill_code: '1.3', name: 'Quản lý, lưu trữ và trích xuất dữ liệu, thông tin số', target_level: 4, display_order: 3 },
      ],
    },
    {
      id: 'dom-2',
      domain_code: 'MIỀN 2',
      name: 'Giao tiếp và Hợp tác số',
      description: 'Tương tác, chia sẻ và cộng tác trong môi trường số.',
      display_order: 2,
      competencies: [
        { id: 'c-21', skill_code: '2.1', name: 'Tương tác thông qua các công nghệ số', target_level: 4, display_order: 1 },
        { id: 'c-22', skill_code: '2.2', name: 'Chia sẻ thông tin và nội dung số', target_level: 4, display_order: 2 },
        { id: 'c-23', skill_code: '2.3', name: 'Tham gia công dân số qua các dịch vụ công trực tuyến', target_level: 3, display_order: 3 },
        { id: 'c-24', skill_code: '2.4', name: 'Hợp tác qua các công cụ kỹ thuật số và văn phòng đám mây', target_level: 4, display_order: 4 },
      ],
    },
    {
      id: 'dom-3',
      domain_code: 'MIỀN 3',
      name: 'Sáng tạo Nội dung số',
      description: 'Phát triển, chỉnh sửa và tích hợp sản phẩm số.',
      display_order: 3,
      competencies: [
        { id: 'c-31', skill_code: '3.1', name: 'Phát triển nội dung số đa phương tiện', target_level: 4, display_order: 1 },
        { id: 'c-32', skill_code: '3.2', name: 'Tích hợp và tái cấu trúc nội dung số', target_level: 4, display_order: 2 },
        { id: 'c-33', skill_code: '3.3', name: 'Bản quyền và sở hữu trí tuệ số', target_level: 3, display_order: 3 },
        { id: 'c-34', skill_code: '3.4', name: 'Tư duy lập trình và tự động hóa tác vụ cơ bản', target_level: 3, display_order: 4 },
      ],
    },
    {
      id: 'dom-4',
      domain_code: 'MIỀN 4',
      name: 'An toàn và Bảo mật số',
      description: 'Bảo vệ thiết bị, dữ liệu cá nhân và an ninh mạng.',
      display_order: 4,
      competencies: [
        { id: 'c-41', skill_code: '4.1', name: 'Bảo vệ thiết bị và hạ tầng kỹ thuật cá nhân', target_level: 4, display_order: 1 },
        { id: 'c-42', skill_code: '4.2', name: 'Bảo vệ dữ liệu cá nhân, nhận diện lừa đảo và quyền riêng tư', target_level: 4, display_order: 2 },
        { id: 'c-43', skill_code: '4.3', name: 'Bảo vệ sức khỏe và thể chất trong môi trường số', target_level: 3, display_order: 3 },
        { id: 'c-44', skill_code: '4.4', name: 'Bảo vệ môi trường khỏi rác thải điện tử', target_level: 3, display_order: 4 },
      ],
    },
    {
      id: 'dom-5',
      domain_code: 'MIỀN 5',
      name: 'Giải quyết Vấn đề số',
      description: 'Khắc phục sự cố kỹ thuật và ứng dụng AI sáng tạo.',
      display_order: 5,
      competencies: [
        { id: 'c-51', skill_code: '5.1', name: 'Giải quyết các sự cố kỹ thuật thông thường', target_level: 4, display_order: 1 },
        { id: 'c-52', skill_code: '5.2', name: 'Nhận diện nhu cầu và lựa chọn giải pháp công nghệ', target_level: 4, display_order: 2 },
        { id: 'c-53', skill_code: '5.3', name: 'Ứng dụng AI sáng tạo và giải pháp thông minh', target_level: 4, display_order: 3 },
        { id: 'c-54', skill_code: '5.4', name: 'Nhận diện khoảng trống năng lực số và tự bồi dưỡng', target_level: 4, display_order: 4 },
      ],
    },
  ];

  const framework = frameworks;
  const rawDomains = framework?.competency_domains || [];
  const domains = rawDomains.length > 0 ? rawDomains : mockFallbackDomains;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              KHUNG NĂNG LỰC SỐ
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Trị Khung Năng Lực Số
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các Miền năng lực và Kỹ năng thành phần theo chuẩn hóa giáo dục số quốc tế và quốc gia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/framework"
            target="_blank"
            className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            Xem trang công khai
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Framework Summary Strip */}
      <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-slate-900">
              {framework?.name || 'Khung Năng lực Số Việt Nam (DigComp VN)'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              PHIÊN BẢN {framework?.version || '2.2'}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            {framework?.description || 'Tham chiếu theo chuẩn EU DigComp 2.2 và Quyết định 146/QĐ-TTg.'}
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">MIỀN NĂNG LỰC</div>
            <div className="text-xl font-bold text-slate-900">{domains.length} Miền</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">KỸ NĂNG THÀNH PHẦN</div>
            <div className="text-xl font-bold text-sky-600">
              {domains.reduce((sum, d) => sum + (d.competencies?.length || 0), 0)} Kỹ năng
            </div>
          </div>
        </div>
      </div>

      {/* 5 Domains & Competencies Hierarchical Tree */}
      <div className="space-y-4">
        {domains
          .sort((a, b) => a.display_order - b.display_order)
          .map((domain) => (
            <div
              key={domain.id}
              className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {domain.domain_code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{domain.name}</h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  {domain.competencies?.length || 0} kỹ năng con
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {domain.competencies
                  ?.sort((a, b) => a.display_order - b.display_order)
                  .map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3 rounded bg-slate-50/70 border border-slate-200 text-xs flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sky-700 text-[11px]">
                            {comp.skill_code}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Cấp {comp.target_level}/8
                          </span>
                        </div>
                        <div className="font-medium text-slate-800 line-clamp-2">
                          {comp.name}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
