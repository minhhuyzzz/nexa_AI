import Link from 'next/link';
import { ArrowRight, Search, Users, PenTool, ShieldCheck, Cpu } from 'lucide-react';

interface DomainItem {
  id: string;
  icon: typeof Search;
  title: string;
  desc: string;
  skillsCount: string;
}

const DOMAINS: DomainItem[] = [
  {
    id: 'D1',
    icon: Search,
    title: 'Thông tin & Dữ liệu',
    desc: 'Tìm kiếm, đánh giá độ tin cậy của thông tin và quản lý dữ liệu số một cách khoa học.',
    skillsCount: '3 kỹ năng cốt lõi',
  },
  {
    id: 'D2',
    icon: Users,
    title: 'Giao tiếp & Hợp tác',
    desc: 'Tương tác văn minh, chia sẻ thông tin an toàn và làm việc nhóm hiệu quả trong môi trường số.',
    skillsCount: '6 kỹ năng cốt lõi',
  },
  {
    id: 'D3',
    icon: PenTool,
    title: 'Sáng tạo Nội dung số',
    desc: 'Biên soạn tài liệu, xử lý đa phương tiện, bảo hộ bản quyền và ứng dụng các công cụ AI hỗ trợ.',
    skillsCount: '4 kỹ năng cốt lõi',
  },
  {
    id: 'D4',
    icon: ShieldCheck,
    title: 'An toàn & Bảo mật',
    desc: 'Tự bảo vệ danh tính, thiết bị cá nhân, nhận diện rủi ro lừa đảo và duy trì thói quen số lành mạnh.',
    skillsCount: '4 kỹ năng cốt lõi',
  },
  {
    id: 'D5',
    icon: Cpu,
    title: 'Giải quyết Vấn đề',
    desc: 'Nhận diện và xử lý sự cố công nghệ, tự tin thích ứng và khai thác công nghệ để tối ưu công việc.',
    skillsCount: '4 kỹ năng cốt lõi',
  },
];

export function CompetencyFrameworkSection() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
            Khung năng lực số cốt lõi
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            5 Miền Năng lực Số Chuẩn hóa
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
            Hệ thống kỹ năng được xây dựng bài bản, giúp bạn tự tin làm chủ công nghệ và thích ứng với môi trường làm việc hiện đại.
          </p>
        </div>

        <Link
          href="/framework"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors shrink-0"
        >
          <span>Xem chi tiết khung năng lực</span>
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          return (
            <div
              key={domain.id}
              className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {domain.id}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-2">{domain.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{domain.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{domain.skillsCount}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
