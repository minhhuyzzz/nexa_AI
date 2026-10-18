export interface AssessmentItem {
  id: string;
  title: string;
  description: string;
  domainName: string;
  domainCode: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
  questionCount: number;
  type: string;
  isPro: boolean;
  formats: {
    mcq: number;
    scenario: number;
    practicalFile: number;
    digitalLink: number;
  };
}

export const mockAssessments: AssessmentItem[] = [
  {
    id: 'asm-general',
    title: 'Đánh giá Năng lực Số Tổng quát - Chuẩn NEXA',
    description: 'Khảo sát toàn diện 5 miền năng lực số cốt lõi. Kiểm tra phản xạ xử lý thông tin, an toàn mạng và giao tiếp trực tuyến.',
    domainName: 'Toàn diện (5 Miền)',
    domainCode: 'ALL',
    duration_minutes: 15,
    passing_score: 70,
    point_reward: 50,
    questionCount: 10,
    type: 'Trắc nghiệm & Tình huống',
    isPro: false,
    formats: { mcq: 6, scenario: 4, practicalFile: 0, digitalLink: 0 },
  },
  {
    id: 'asm-ai',
    title: 'Kỹ năng Làm việc cùng AI & Tự động hóa Chuyên sâu',
    description: 'Thực hành kỹ thuật đặt câu lệnh prompt đa bước, thẩm định độ tin cậy của câu trả lời do AI tạo ra và ứng dụng AI vào công việc văn phòng.',
    domainName: 'D3: Sáng tạo Nội dung số',
    domainCode: 'D3',
    duration_minutes: 25,
    passing_score: 75,
    point_reward: 60,
    questionCount: 6,
    type: 'Tình huống & Thực hành số',
    isPro: true,
    formats: { mcq: 2, scenario: 2, practicalFile: 1, digitalLink: 1 },
  },
  {
    id: 'asm-security',
    title: 'An toàn Thông tin & Bảo vệ Danh tính Số',
    description: 'Nhận diện các thủ đoạn lừa đảo qua mạng, thiết lập bảo mật 2 lớp (2FA), quản lý mật khẩu an toàn và bảo vệ dữ liệu cá nhân.',
    domainName: 'D4: An toàn & Bảo mật',
    domainCode: 'D4',
    duration_minutes: 15,
    passing_score: 80,
    point_reward: 40,
    questionCount: 8,
    type: 'Trắc nghiệm & Tình huống',
    isPro: false,
    formats: { mcq: 5, scenario: 3, practicalFile: 0, digitalLink: 0 },
  },
  {
    id: 'asm-data',
    title: 'Xử lý, Phân tích & Trực quan hóa Dữ liệu Doanh nghiệp',
    description: 'Thu thập và làm sạch dữ liệu, sử dụng hàm thống kê bảng tính và lựa chọn biểu đồ trực quan hóa dữ liệu phù hợp.',
    domainName: 'D1: Thông tin & Dữ liệu',
    domainCode: 'D1',
    duration_minutes: 30,
    passing_score: 75,
    point_reward: 70,
    questionCount: 5,
    type: 'Thao tác bảng tính & Nộp tệp',
    isPro: true,
    formats: { mcq: 2, scenario: 1, practicalFile: 2, digitalLink: 0 },
  },
  {
    id: 'asm-collab',
    title: 'Giao tiếp & Hợp tác Trực tuyến Hiệu quả',
    description: 'Văn hóa ứng xử số, kỹ năng phối hợp nhóm trên các nền tảng đám mây và chia sẻ tài liệu an toàn trong tổ chức.',
    domainName: 'D2: Giao tiếp & Hợp tác',
    domainCode: 'D2',
    duration_minutes: 15,
    passing_score: 70,
    point_reward: 40,
    questionCount: 7,
    type: 'Trắc nghiệm & Phản biện',
    isPro: false,
    formats: { mcq: 5, scenario: 2, practicalFile: 0, digitalLink: 0 },
  },
  {
    id: 'asm-problem-solving',
    title: 'Giải quyết Vấn đề Kỹ thuật Số & Tư duy Thuật toán',
    description: 'Chẩn đoán lỗi công nghệ thông thường, tối ưu hóa quy trình làm việc số và ra quyết định dựa trên dữ liệu.',
    domainName: 'D5: Giải quyết Vấn đề',
    domainCode: 'D5',
    duration_minutes: 20,
    passing_score: 70,
    point_reward: 50,
    questionCount: 8,
    type: 'Tình huống & Trắc nghiệm',
    isPro: true,
    formats: { mcq: 4, scenario: 4, practicalFile: 0, digitalLink: 0 },
  },
];
