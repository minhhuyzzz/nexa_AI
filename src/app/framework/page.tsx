import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, CheckCircle2, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export const dynamic = 'force-dynamic';

export default async function FrameworkPage() {
  const supabase = await createClient();

  // Read dynamically from database
  const { data: framework } = await supabase
    .from('assessment_frameworks')
    .select('id, code, title, version, description')
    .eq('status', 'ACTIVE')
    .eq('is_default', true)
    .single();

  const { data: domains } = await supabase
    .from('competency_domains')
    .select(`
      id,
      domain_index,
      code,
      title,
      description,
      weight_percent,
      competencies (
        id,
        skill_code,
        title,
        description,
        target_level,
        display_order
      )
    `)
  const fallbackDomains = [
    {
      id: 'f-dom-1',
      code: '01',
      title: 'Tìm kiếm, đánh giá và quản lý thông tin',
      description: 'Xác định nhu cầu thông tin, tìm kiếm, lọc và đánh giá độ tin cậy của dữ liệu số.',
      weight_percent: 20,
      competencies: [
        { id: '1.1', skill_code: '1.1', title: 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin', description: 'Xác định nhu cầu thông tin, tìm kiếm và lọc thông tin trên không gian mạng.', target_level: 4 },
        { id: '1.2', skill_code: '1.2', title: 'Đánh giá dữ liệu, thông tin và nội dung số', description: 'Phân tích, so sánh và kiểm chứng nguồn tin, nhận diện tin sai lệch.', target_level: 4 },
        { id: '1.3', skill_code: '1.3', title: 'Quản lý dữ liệu, thông tin và nội dung số', description: 'Tổ chức, lưu trữ, truy xuất dữ liệu an toàn và có hệ thống.', target_level: 4 },
      ],
    },
    {
      id: 'f-dom-2',
      code: '02',
      title: 'Giao tiếp và hợp tác',
      description: 'Tương tác, chia sẻ, cộng tác và ứng xử văn minh trong môi trường số.',
      weight_percent: 20,
      competencies: [
        { id: '2.1', skill_code: '2.1', title: 'Tương tác thông qua công nghệ số', description: 'Giao tiếp hiệu quả qua các công cụ số phù hợp ngữ cảnh.', target_level: 4 },
        { id: '2.2', skill_code: '2.2', title: 'Chia sẻ thông qua công nghệ số', description: 'Chia sẻ dữ liệu, nội dung với phân quyền và trích dẫn bản quyền đúng quy chuẩn.', target_level: 4 },
        { id: '2.3', skill_code: '2.3', title: 'Tham gia hoạt động công dân qua công nghệ số', description: 'Sử dụng dịch vụ công trực tuyến và thực hiện quyền, trách nhiệm công dân số.', target_level: 3 },
        { id: '2.4', skill_code: '2.4', title: 'Hợp tác thông qua công nghệ số', description: 'Cộng tác nhóm, đồng biên tập tài liệu và quản trị dự án trực tuyến.', target_level: 4 },
        { id: '2.5', skill_code: '2.5', title: 'Chuẩn mực ứng xử và văn hóa số (Netiquette)', description: 'Tuân thủ quy tắc ứng xử, giao tiếp lịch thiệp và tôn trọng sự đa dạng.', target_level: 3 },
        { id: '2.6', skill_code: '2.6', title: 'Quản lý danh tính số', description: 'Bảo vệ danh tính, uy tín cá nhân và dấu chân kỹ thuật số.', target_level: 4 },
      ],
    },
    {
      id: 'f-dom-3',
      code: '03',
      title: 'Sáng tạo nội dung số',
      description: 'Phát triển, chỉnh sửa, tích hợp sản phẩm số, bản quyền và tư duy tính toán.',
      weight_percent: 20,
      competencies: [
        { id: '3.1', skill_code: '3.1', title: 'Phát triển nội dung số', description: 'Tạo lập và định dạng nội dung số đa phương tiện chất lượng cao.', target_level: 4 },
        { id: '3.2', skill_code: '3.2', title: 'Tích hợp và tái cấu trúc nội dung số', description: 'Biên tập, kết hợp các tài nguyên số có sẵn tạo thành nội dung mới.', target_level: 4 },
        { id: '3.3', skill_code: '3.3', title: 'Bản quyền và giấy phép sở hữu trí tuệ', description: 'Hiểu và tuân thủ các quy định bản quyền, giấy phép Creative Commons.', target_level: 3 },
        { id: '3.4', skill_code: '3.4', title: 'Tư duy tính toán và lập trình', description: 'Phân tích thuật toán logic và xây dựng quy trình tự động hóa tác vụ.', target_level: 3 },
      ],
    },
    {
      id: 'f-dom-4',
      code: '04',
      title: 'An toàn, sức khỏe và trách nhiệm',
      description: 'Bảo vệ thiết bị, dữ liệu cá nhân, quyền riêng tư, sức khỏe số và môi trường.',
      weight_percent: 20,
      competencies: [
        { id: '4.1', skill_code: '4.1', title: 'Bảo vệ thiết bị', description: 'Thiết lập bảo mật thiết bị, cập nhật phần mềm và kiểm soát rủi ro mạng.', target_level: 4 },
        { id: '4.2', skill_code: '4.2', title: 'Bảo vệ dữ liệu cá nhân và quyền riêng tư', description: 'Bảo vệ thông tin cá nhân theo Nghị định 13/2023/NĐ-CP và phòng chống lừa đảo.', target_level: 4 },
        { id: '4.3', skill_code: '4.3', title: 'Hỗ trợ sức khỏe tinh thần và thể chất', description: 'Cân bằng thời gian sử dụng thiết bị, thực hành công thái học khi làm việc.', target_level: 3 },
        { id: '4.4', skill_code: '4.4', title: 'Tác động môi trường của công nghệ số', description: 'Ý thức về tiêu thụ năng lượng và tác động sinh thái của công nghệ số.', target_level: 3 },
      ],
    },
    {
      id: 'f-dom-5',
      code: '05',
      title: 'Nhận diện và giải quyết vấn đề',
      description: 'Xác định sự cố kỹ thuật, lựa chọn công nghệ, sáng tạo và bồi dưỡng năng lực số.',
      weight_percent: 20,
      competencies: [
        { id: '5.1', skill_code: '5.1', title: 'Xác định và giải quyết sự cố kỹ thuật', description: 'Chẩn đoán và khắc phục các vấn đề phần cứng, phần mềm và mạng.', target_level: 4 },
        { id: '5.2', skill_code: '5.2', title: 'Nhận diện nhu cầu và giải pháp công nghệ số', description: 'Lựa chọn công cụ số tối ưu để đáp ứng yêu cầu công việc cụ thể.', target_level: 4 },
        { id: '5.3', skill_code: '5.3', title: 'Tìm kiếm giải pháp sáng tạo bằng công nghệ số', description: 'Ứng dụng linh hoạt công nghệ để cải tiến và đổi mới quy trình.', target_level: 4 },
        { id: '5.4', skill_code: '5.4', title: 'Nhận diện và bồi dưỡng nhu cầu năng lực số', description: 'Chủ động cập nhật tri thức số và tự bồi dưỡng phát triển kỹ năng liên tục.', target_level: 4 },
      ],
    },
  ];

  const displayDomains = (domains && domains.length > 0) ? domains : fallbackDomains;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Header công khai */}
      <PublicHeader activePath="/framework" />

      {/* 2. Nội dung Khung Năng Lực Động */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Cấu trúc Khung Năng lực Động quản trị trong CSDL Supabase
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {framework?.title || 'Khung Năng Lực Số Chuẩn'}
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {framework?.description || 'Tham chiếu theo tiêu chuẩn EU DigComp 3.0, bao gồm 5 miền năng lực cốt lõi và 21 kỹ năng thành phần trên 8 cấp độ thành thạo (Basic, Intermediate, Advanced, Highly Advanced).'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-200 shadow-xs">
              MÃ KHUNG: {framework?.code || 'DIGCOMP_VN'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-200 shadow-xs">
              PHIÊN BẢN: v{framework?.version || '3.0'}
            </span>
          </div>
        </div>

        {/* 5 Domains & Skills List */}
        <div className="space-y-6">
          {displayDomains.map((domain) => (
            <div
              key={domain.id}
              className="rounded-md border border-slate-200 bg-white p-6 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                    MIỀN {domain.code}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{domain.title}</h2>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  Trọng số khảo thí: {domain.weight_percent}%
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{domain.description}</p>

              {/* Competencies */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {((domain.competencies as Array<{ id: string; skill_code: string; title: string; description: string; target_level: number }>) || [])
                  .sort((a, b) => a.skill_code.localeCompare(b.skill_code))
                  .map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {skill.skill_code}
                          </span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            Target Level: Level {skill.target_level}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">{skill.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {skill.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 3. Footer học thuật toàn diện */}
      <PublicFooter />
    </div>
  );
}
