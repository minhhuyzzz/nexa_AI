import { createClient } from '@/lib/supabase/server';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FrameworkClient, type DomainItem } from './framework-client';

export const dynamic = 'force-dynamic';

export default async function FrameworkPage() {
  const supabase = await createClient();

  // Đọc dữ liệu khung năng lực từ database
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
    .order('domain_index', { ascending: true });

  const fallbackDomains: DomainItem[] = [
    {
      id: 'f-dom-1',
      code: '01',
      title: 'Thông tin và Dữ liệu số',
      description: 'Xác định nhu cầu thông tin, tìm kiếm, lọc và thẩm định độ tin cậy của dữ liệu số.',
      weight_percent: 20,
      competencies: [
        {
          id: '1.1',
          skill_code: '1.1',
          title: 'Duyệt, tìm kiếm và lọc dữ liệu số',
          description: 'Xác định nhu cầu thông tin, sử dụng toán tử tìm kiếm nâng cao, lọc kết quả chính xác.',
        },
        {
          id: '1.2',
          skill_code: '1.2',
          title: 'Thẩm định độ tin cậy của dữ liệu và thông tin số',
          description: 'Kiểm chứng nguồn tin, phân biệt tin giả, tin sai lệch và ảo giác AI, đối chiếu đa nguồn.',
        },
        {
          id: '1.3',
          skill_code: '1.3',
          title: 'Quản lý, lưu trữ và truy xuất dữ liệu số',
          description: 'Tổ chức cây thư mục khoa học, sao lưu đám mây theo nguyên tắc an toàn, chuẩn hóa cấu trúc dữ liệu.',
        },
      ],
    },
    {
      id: 'f-dom-2',
      code: '02',
      title: 'Giao tiếp và Hợp tác số',
      description: 'Tương tác, chia sẻ, cộng tác và ứng xử văn minh trong môi trường số.',
      weight_percent: 20,
      competencies: [
        {
          id: '2.1',
          skill_code: '2.1',
          title: 'Tương tác thông qua công nghệ số',
          description: 'Giao tiếp hiệu quả qua các công cụ số phù hợp ngữ cảnh công việc và học tập.',
        },
        {
          id: '2.2',
          skill_code: '2.2',
          title: 'Chia sẻ thông qua công nghệ số',
          description: 'Chia sẻ dữ liệu, nội dung với phân quyền phù hợp và trích dẫn bản quyền đúng quy chuẩn.',
        },
        {
          id: '2.3',
          skill_code: '2.3',
          title: 'Tham gia hoạt động công dân số',
          description: 'Sử dụng dịch vụ công trực tuyến và thực hiện quyền, trách nhiệm công dân trên không gian mạng.',
        },
        {
          id: '2.4',
          skill_code: '2.4',
          title: 'Hợp tác qua công cụ số',
          description: 'Cộng tác nhóm, đồng biên tập tài liệu và quản trị dự án trực tuyến mượt mà.',
        },
        {
          id: '2.5',
          skill_code: '2.5',
          title: 'Chuẩn mực ứng xử và văn hóa số',
          description: 'Tuân thủ quy tắc ứng xử công vụ, giao tiếp lịch thiệp và tôn trọng sự đa dạng.',
        },
        {
          id: '2.6',
          skill_code: '2.6',
          title: 'Quản lý danh tính và uy tín số',
          description: 'Bảo vệ danh tính, uy tín cá nhân và dấu chân kỹ thuật số an toàn.',
        },
      ],
    },
    {
      id: 'f-dom-3',
      code: '03',
      title: 'Sáng tạo Nội dung số và AI',
      description: 'Phát triển, chỉnh sửa, tích hợp sản phẩm số, bản quyền và ứng dụng AI có trách nhiệm.',
      weight_percent: 20,
      competencies: [
        {
          id: '3.1',
          skill_code: '3.1',
          title: 'Phát triển và định dạng nội dung số',
          description: 'Tạo lập nội dung số đa phương tiện, văn bản, bảng tính và ấn phẩm chất lượng cao.',
        },
        {
          id: '3.2',
          skill_code: '3.2',
          title: 'Tích hợp và tái cấu trúc nội dung số',
          description: 'Biên tập, kết hợp các tài nguyên số có sẵn tạo thành sản phẩm thông tin mới.',
        },
        {
          id: '3.3',
          skill_code: '3.3',
          title: 'Bản quyền và giấy phép sở hữu trí tuệ',
          description: 'Hiểu và tuân thủ các quy định bản quyền, giấy phép mở và ghi nhận quyền tác giả.',
        },
        {
          id: '3.4',
          skill_code: '3.4',
          title: 'Tư duy thuật toán và tự động hóa',
          description: 'Phân tích logic quy trình và xây dựng các luồng tác vụ tự động hóa năng suất.',
        },
      ],
    },
    {
      id: 'f-dom-4',
      code: '04',
      title: 'An toàn và Bảo mật số',
      description: 'Bảo vệ thiết bị, dữ liệu cá nhân, quyền riêng tư và sức khỏe tinh thần trong kỷ nguyên số.',
      weight_percent: 20,
      competencies: [
        {
          id: '4.1',
          skill_code: '4.1',
          title: 'Bảo vệ thiết bị và hạ tầng số',
          description: 'Thiết lập bảo mật thiết bị, cập nhật phần mềm và kiểm soát rủi ro an ninh mạng.',
        },
        {
          id: '4.2',
          skill_code: '4.2',
          title: 'Bảo vệ dữ liệu cá nhân và riêng tư',
          description: 'Bảo vệ thông tin cá nhân theo quy chuẩn pháp luật và phòng chống thủ đoạn lừa đảo.',
        },
        {
          id: '4.3',
          skill_code: '4.3',
          title: 'Cân bằng và hỗ trợ sức khỏe số',
          description: 'Cân bằng thời gian sử dụng thiết bị, thực hành công thái học khi làm việc số.',
        },
        {
          id: '4.4',
          skill_code: '4.4',
          title: 'Ý thức tác động sinh thái công nghệ',
          description: 'Ý thức về tiêu thụ năng lượng và tác động môi trường của thiết bị và dữ liệu số.',
        },
      ],
    },
    {
      id: 'f-dom-5',
      code: '05',
      title: 'Giải quyết Vấn đề số',
      description: 'Chẩn đoán sự cố kỹ thuật, lựa chọn công nghệ, sáng tạo và cập nhật năng lực số liên tục.',
      weight_percent: 20,
      competencies: [
        {
          id: '5.1',
          skill_code: '5.1',
          title: 'Xác định và xử lý sự cố kỹ thuật',
          description: 'Chẩn đoán và khắc phục nhanh các lỗi phần cứng, phần mềm và kết nối mạng.',
        },
        {
          id: '5.2',
          skill_code: '5.2',
          title: 'Nhận diện nhu cầu và giải pháp công nghệ',
          description: 'Lựa chọn công cụ số tối ưu để đáp ứng yêu cầu công việc cụ thể.',
        },
        {
          id: '5.3',
          skill_code: '5.3',
          title: 'Giải pháp sáng tạo bằng công nghệ số',
          description: 'Ứng dụng linh hoạt công nghệ để cải tiến và đổi mới quy trình làm việc.',
        },
        {
          id: '5.4',
          skill_code: '5.4',
          title: 'Bồi dưỡng và cập nhật năng lực số liên tục',
          description: 'Chủ động cập nhật tri thức công nghệ mới và tự bồi dưỡng phát triển kỹ năng thích ứng.',
        },
      ],
    },
  ];

  const displayDomains = (domains && domains.length > 0) ? (domains as unknown as DomainItem[]) : fallbackDomains;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans">
      {/* 1. Header công khai chuẩn mực */}
      <PublicHeader activePath="/framework" />

      {/* 2. Trọng tâm Trải nghiệm Khung Năng Lực Chuẩn SaaS */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        <FrameworkClient
          domains={displayDomains}
          frameworkTitle={framework?.title}
          frameworkDescription={framework?.description}
        />
      </main>

      {/* 3. Footer hoàn thiện */}
      <PublicFooter />
    </div>
  );
}
