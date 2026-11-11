import rawQuestions from './120_questions.json';

export interface PracticeQuestion {
  id: string;
  order: number;
  prompt: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    content: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface LearningLesson {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  pointReward: number;
  type: 'LESSON' | 'PRACTICE';
  contentMarkdown: string;
  practiceQuestions?: PracticeQuestion[];
}

export type CompetencyLevelCode = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'HIGHLY_ADVANCED';

export interface CompetencyLevelItem {
  id: string;
  levelCode: CompetencyLevelCode;
  levelName: string; // 'Basic' | 'Intermediate' | 'Advanced' | 'Highly Advanced'
  levelNumber: number; // 1 | 2 | 3 | 4
  badgeLabel: string; // 'Level 1: Basic' | 'Level 2: Intermediate' | 'Level 3: Advanced' | 'Level 4: Highly Advanced'
  benchmarkStandard: string; // Chuẩn đầu ra năng lực
  coreSkills: string[]; // Trọng tâm kỹ năng số
  guidanceText: string; // Trọng tâm bồi dưỡng kỹ năng của NEXA
  durationMinutes: number;
  pointReward: number; // 15 | 25 | 40 | 60 PTS
  assessmentId?: string;
  practiceQuestions: PracticeQuestion[];
}

export interface SubdomainNode {
  id: string; // competency id trong DB
  skillCode: string; // mã kỹ năng nội bộ (ví dụ: 1.1, 1.2), KHÔNG hiển thị thô ra UI
  title: string; // Tên chuẩn xác thuần Việt theo khung 5 miền
  desc: string;
  levels?: CompetencyLevelItem[];
  lessons: LearningLesson[];
}

export interface DomainTrack {
  code: string; // 01, 02, 03, 04, 05
  domainNumber: number;
  title: string;
  desc: string;
  iconName: 'Database' | 'Users' | 'Lightbulb' | 'Shield' | 'Wrench';
  badgeColor: string;
  subdomains: SubdomainNode[];
}

export function getSubdomainLevels(sub: SubdomainNode, domainNum: number, subIdx: number): CompetencyLevelItem[] {
  if (sub.levels && sub.levels.length > 0) {
    return sub.levels;
  }

  const qOffset = ((domainNum - 1) * 20 + subIdx * 4) % 110;

  return [
    {
      id: `${sub.id}-lvl-1`,
      levelCode: 'BASIC',
      levelName: 'Basic',
      levelNumber: 1,
      badgeLabel: 'Level 1: Basic',
      benchmarkStandard: `Nhận biết và thực hiện các thao tác số căn bản liên quan đến "${sub.title.toLowerCase()}".`,
      coreSkills: [
        'Nắm vững khái niệm nền tảng và môi trường làm việc số cơ bản',
        'Thực hiện các thao tác tìm kiếm, tiếp nhận và định danh dữ liệu độc lập',
        'Phát hiện các cảnh báo và tuân thủ nguyên tắc an toàn số ban đầu',
      ],
      guidanceText: 'Trọng tâm cấp độ Basic là xây dựng nền móng vững chắc, hiểu đúng thuật ngữ và hình thành phản xạ thao tác số chuẩn xác trong môi trường trực tuyến.',
      durationMinutes: 15,
      pointReward: 15,
      practiceQuestions: makeQuestions(qOffset, 3),
    },
    {
      id: `${sub.id}-lvl-2`,
      levelCode: 'INTERMEDIATE',
      levelName: 'Intermediate',
      levelNumber: 2,
      badgeLabel: 'Level 2: Intermediate',
      benchmarkStandard: `Vận dụng linh hoạt công cụ số để xử lý công việc và học tập thực tế trong "${sub.title.toLowerCase()}".`,
      coreSkills: [
        'Áp dụng bộ công cụ số chuyên biệt để giải quyết tác vụ thực tiễn',
        'Xử lý tình huống phát sinh thường nhật và tối ưu hóa thời gian thao tác',
        'Cộng tác, trao đổi và chia sẻ kết quả số hóa một cách an toàn',
      ],
      guidanceText: 'Trọng tâm cấp độ Intermediate là kỹ năng thực hành giải quyết vấn đề thực tế, kết hợp đa công cụ số để nâng cao năng suất công việc và học tập.',
      durationMinutes: 20,
      pointReward: 25,
      practiceQuestions: makeQuestions(qOffset + 3, 3),
    },
    {
      id: `${sub.id}-lvl-3`,
      levelCode: 'ADVANCED',
      levelName: 'Advanced',
      levelNumber: 3,
      badgeLabel: 'Level 3: Advanced',
      benchmarkStandard: `Phân tích sâu, đánh giá phê phán và xử lý các bài toán số phức tạp trong "${sub.title.toLowerCase()}".`,
      coreSkills: [
        'Thẩm định đa chiều độ tin cậy và kiểm soát rủi ro thông tin/dữ liệu số',
        'Thiết lập quy trình xử lý tác vụ bán tự động và tối ưu hóa luồng làm việc',
        'Phát hiện lỗi sai cấu trúc, lỗ hổng bảo mật và đề xuất phương án khắc phục',
      ],
      guidanceText: 'Trọng tâm cấp độ Advanced là tư duy phản biện số, khả năng đánh giá độc lập chất lượng dữ liệu/kết quả và giải quyết bài toán phức tạp.',
      durationMinutes: 25,
      pointReward: 40,
      practiceQuestions: makeQuestions(qOffset + 6, 3),
    },
    {
      id: `${sub.id}-lvl-4`,
      levelCode: 'HIGHLY_ADVANCED',
      levelName: 'Highly Advanced',
      levelNumber: 4,
      badgeLabel: 'Level 4: Highly Advanced',
      benchmarkStandard: `Làm chủ công nghệ, sáng tạo giải pháp đột phá và dẫn dắt/hướng dẫn cộng đồng trong "${sub.title.toLowerCase()}".`,
      coreSkills: [
        'Sáng tạo giải pháp số mới, áp dụng AI nâng cao để tự động hóa toàn diện',
        'Tối ưu hóa kiến trúc xử lý công việc và dẫn dắt quy chuẩn số trong nhóm/tổ chức',
        'Định hướng chiến lược phát triển năng lực số và đào tạo người khác',
      ],
      guidanceText: 'Trọng tâm cấp độ Highly Advanced là năng lực làm chủ công nghệ cao cấp, ứng dụng AI có trách nhiệm và dẫn dắt kiến tạo chuẩn mực số mới.',
      durationMinutes: 30,
      pointReward: 60,
      practiceQuestions: makeQuestions(qOffset + 9, 3),
    },
  ];
}

// Chuyển rawQuestions từ CSV sang PracticeQuestion
function makeQuestions(startIdx: number, count: number): PracticeQuestion[] {
  const slice = (rawQuestions as any[]).slice(startIdx, startIdx + count);
  return slice.map((q, idx) => ({
    id: `q-demo-${q.STT || idx + 1}`,
    order: idx + 1,
    prompt: q['Câu hỏi'] || '',
    options: [
      { key: 'A', content: q['Phương án A'] || '' },
      { key: 'B', content: q['Phương án B'] || '' },
      { key: 'C', content: q['Phương án C'] || '' },
      { key: 'D', content: q['Phương án D'] || '' },
    ],
    correctAnswer: (q['Đáp án đúng']?.trim() || 'A') as 'A' | 'B' | 'C' | 'D',
    explanation: 'Đáp án chuẩn theo Khung đánh giá năng lực số quốc gia.',
  }));
}

export const DOMAIN_CURRICULUM: DomainTrack[] = [
  // -------------------------------------------------------------
  // MIỀN 1: THÔNG TIN & DỮ LIỆU SỐ (3 MIỀN CON)
  // -------------------------------------------------------------
  {
    code: '01',
    domainNumber: 1,
    title: 'Thông tin & Dữ liệu số',
    desc: 'Duyệt, tìm kiếm dữ liệu, thẩm định độ tin cậy và quản lý dữ liệu an toàn.',
    iconName: 'Database',
    badgeColor: 'blue',
    subdomains: [
      {
        id: '8f79f1ec-d4f0-4b68-b948-0deade1d3969',
        skillCode: '1.1',
        title: 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin',
        desc: 'Xác định nhu cầu thông tin, tìm kiếm trên mạng và điều hướng kết quả chính xác.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000101',
            title: 'Kỹ thuật tìm kiếm dữ liệu nâng cao trên Internet',
            description: 'Sử dụng toán tử Boolean, bộ lọc filetype và cú pháp chuyên biệt để tìm đúng tài liệu học thuật.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### 1. Toán tử tìm kiếm nâng cao
- **Toán tử Boolean:** Kết hợp \`AND\`, \`OR\`, \`NOT\` để thu hẹp hoặc mở rộng kết quả.
- **Dấu ngoặc kép (" "):** Tìm chính xác cụm từ liên tiếp, tránh trả về kết quả rải rác.
- **Dấu trừ (-):** Loại bỏ các từ khóa không mong muốn (ví dụ: \`năng lực số -facebook\`).

### 2. Cú pháp chuyên biệt
- \`site:gov.vn\`: Chỉ tìm kiếm trên cổng thông tin cơ quan nhà nước.
- \`filetype:pdf\`: Tìm trực tiếp tài liệu báo cáo, đề cương PDF.
- \`intitle:\`: Tìm các bài viết có từ khóa nằm ngay trên tiêu đề.`,
          },
          {
            id: 'p-practice-1-1',
            title: 'Bài luyện tập: Kỹ thuật tìm kiếm và lọc dữ liệu',
            description: 'Kiểm tra 5 câu hỏi tình huống thực tế về tìm kiếm dữ liệu số chính xác.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Hoàn thành bài luyện tập để củng cố kỹ năng tìm kiếm thông tin và nhận điểm thưởng PTS.',
            practiceQuestions: makeQuestions(0, 5),
          },
        ],
      },
      {
        id: '6c475f25-7c43-4a43-888f-450c0d103d44',
        skillCode: '1.2',
        title: 'Đánh giá dữ liệu, thông tin và nội dung số',
        desc: 'Phân tích, so sánh và đánh giá nghiêm ngặt độ tin cậy của các nguồn thông tin trực tuyến.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000102',
            title: 'Đánh giá độ tin cậy thông tin và nhận diện Fake News',
            description: 'Áp dụng mô hình CRAAP và phương pháp đọc ngang (Lateral Reading) để kiểm chứng nguồn tin.',
            durationMinutes: 20,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Tiêu chuẩn CRAAP kiểm chứng nguồn tin
1. **Currency (Tính cập nhật):** Thông tin được xuất bản khi nào? Đã có bản sửa đổi hay chưa?
2. **Relevance (Tính phù hợp):** Mức độ liên quan đến câu hỏi nghiên cứu của bạn.
3. **Authority (Thẩm quyền):** Tác giả là ai? Cơ quan công bố có chuyên môn không?
4. **Accuracy (Độ chính xác):** Có nguồn dẫn chứng, số liệu thống kê độc lập không?
5. **Purpose (Mục đích):** Bài viết nhằm thông tin, thuyết phục hay kích động cảm xúc?`,
          },
          {
            id: 'd0000000-0000-0000-0000-000000000001',
            title: 'Phương pháp Thẩm định Nguồn tin Số & Nhận diện Deepfake AI',
            description: 'Nhận biết các hình ảnh và video do AI tạo sinh nhằm xuyên tạc thông tin hoặc lừa đảo.',
            durationMinutes: 20,
            pointReward: 30,
            type: 'LESSON',
            contentMarkdown: `### Nhận diện hình ảnh và video AI giả mạo
- **Quan sát chi tiết cơ thể:** Bàn tay (số lượng ngón tay), ánh mắt, phản chiếu ánh sáng và răng.
- **Âm thanh và khẩu hình:** Kiểm tra độ lệch giữa chuyển động miệng và giọng nói.
- **Truy tìm ảnh ngược (Reverse Image Search):** Sử dụng Google Images hoặc TinEye để xác minh bối cảnh gốc.`,
          },
          {
            id: 'p-practice-1-2',
            title: 'Bài luyện tập: Thẩm định thông tin và tin giả',
            description: 'Bài kiểm tra trắc nghiệm 5 câu về đánh giá nguồn tin học thuật và tin tức số.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Luyện tập tình huống thực tế để rèn luyện tư duy phản biện thông tin trên không gian mạng.',
            practiceQuestions: makeQuestions(20, 5),
          },
        ],
      },
      {
        id: 'bb7785b0-0a0f-478d-9b40-a32388195cf2',
        skillCode: '1.3',
        title: 'Quản lý dữ liệu, thông tin và nội dung số',
        desc: 'Tổ chức, lưu trữ, quản trị và truy xuất dữ liệu trong môi trường đám mây an toàn.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000103',
            title: 'Quản trị dữ liệu số cá nhân và đám mây an toàn',
            description: 'Phân loại thư mục khoa học, đặt tên tệp chuẩn ISO 8601 và sao lưu theo nguyên tắc 3-2-1.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Quy chuẩn đặt tên và tổ chức dữ liệu
- **Quy tắc đặt tên:** \`YYYY-MM-DD_TenDuAn_PhienBan.ext\` (không dấu, gạch dưới).
- **Chiến lược sao lưu 3-2-1:** 3 bản sao chép, trên 2 loại phương tiện khác nhau, có ít nhất 1 bản ngoài văn phòng (cloud).`,
          },
          {
            id: 'p-practice-1-3',
            title: 'Bài luyện tập: Quản trị và lưu trữ dữ liệu số',
            description: '5 câu hỏi trắc nghiệm kiểm tra kỹ năng quản lý thư mục và bảo toàn dữ liệu.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Kiểm tra kỹ năng quản trị tệp tin và lưu trữ đám mây.',
            practiceQuestions: makeQuestions(10, 5),
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // MIỀN 2: GIAO TIẾP & CỘNG TÁC SỐ (6 MIỀN CON)
  // -------------------------------------------------------------
  {
    code: '02',
    domainNumber: 2,
    title: 'Giao tiếp & Cộng tác số',
    desc: 'Tương tác, chia sẻ, làm việc nhóm và thực hành văn hóa ứng xử số văn minh.',
    iconName: 'Users',
    badgeColor: 'emerald',
    subdomains: [
      {
        id: '9dd39b77-ac9d-4fef-be6a-c44568935285',
        skillCode: '2.1',
        title: 'Tương tác qua công nghệ số',
        desc: 'Giao tiếp qua nhiều nền tảng số phù hợp với bối cảnh và đối tượng tương tác.',
        lessons: [
          {
            id: 'd0000000-0000-0000-0000-000000000004',
            title: 'Chuẩn mực Tương tác Chuyên nghiệp Đa nền tảng Số',
            description: 'Kỹ năng giao tiếp qua email, tin nhắn tức thì và phần mềm họp trực tuyến.',
            durationMinutes: 15,
            pointReward: 30,
            type: 'LESSON',
            contentMarkdown: `### Nguyên tắc giao tiếp đa kênh
- **Email:** Dùng cho tài liệu trang trọng, có lưu trữ bằng chứng và quyết định chính thức.
- **Tin nhắn nhóm:** Dùng cho cập nhật nhanh, không gửi thông báo khẩn cấp ngoài giờ trừ trường hợp quy định.
- **Cuộc họp online:** Kiểm tra mic/camera, chuẩn bị tài liệu trước 5 phút.`,
          },
          {
            id: 'p-practice-2-1',
            title: 'Bài luyện tập: Tương tác qua công nghệ số',
            description: '5 câu hỏi thực hành ứng xử trong môi trường học tập và làm việc số.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Rèn luyện phản xạ giao tiếp số chuyên nghiệp.',
            practiceQuestions: makeQuestions(40, 5),
          },
        ],
      },
      {
        id: '8a0cc24c-bf97-42e7-a55e-44bcdc5bfde5',
        skillCode: '2.2',
        title: 'Chia sẻ qua công nghệ số',
        desc: 'Chia sẻ dữ liệu, nội dung với người khác thông qua các công nghệ số thích hợp.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000202',
            title: 'Phân quyền chia sẻ và kiểm soát quyền truy cập tài nguyên',
            description: 'Thiết lập các quyền View only, Comment, Edit khi chia sẻ trên Google Drive, OneDrive.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Kiểm soát phân quyền tài liệu số
- **Chỉ xem (Viewer):** Phù hợp chia sẻ báo cáo công khai hoặc tài liệu mẫu.
- **Nhận xét (Commenter):** Phù hợp cho việc góp ý, phản biện đồ án hoặc bản thảo.
- **Chỉnh sửa (Editor):** Chỉ cấp cho thành viên trực tiếp phụ trách nội dung.`,
          },
        ],
      },
      {
        id: '9da53ba6-2acb-44c7-b303-4b55a1f788d5',
        skillCode: '2.3',
        title: 'Tham gia công dân qua công nghệ số',
        desc: 'Sử dụng dịch vụ công trực tuyến và các công nghệ số để tham gia hoạt động xã hội.',
        lessons: [
          {
            id: 'l-civic-engagement',
            title: 'Ứng dụng Dịch vụ công trực tuyến và VNeID trong đời sống số',
            description: 'Khai thác cổng dịch vụ công quốc gia, định danh điện tử mức 2 và bảo vệ tài khoản công dân.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Cổng Dịch vụ công Quốc gia & VNeID
- Đăng ký và sử dụng tài khoản định danh điện tử mức độ 2 an toàn.
- Nộp hồ sơ trực tuyến, thanh toán phí lệ phí không dùng tiền mặt.
- Cảnh giác trước các cuộc gọi mạo danh cán bộ công an yêu cầu cài đặt app giả mạo.`,
          },
        ],
      },
      {
        id: 'cf2dc5eb-ac80-474b-be89-ca09671b86e4',
        skillCode: '2.4',
        title: 'Hợp tác qua công nghệ số',
        desc: 'Sử dụng các công cụ cộng tác trực tuyến để làm việc nhóm và đồng sáng tạo tài liệu số.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000204',
            title: 'Cộng tác số thời gian thực và quản lý tài liệu nhóm',
            description: 'Sử dụng Google Docs, Notion, Miro và Trello để phối hợp làm việc nhóm hiệu quả.',
            durationMinutes: 20,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Quy trình làm việc nhóm trực tuyến
- Phân công nhiệm vụ qua bảng Kanban (To do - In progress - Done).
- Sử dụng tính năng Version History để khôi phục nội dung khi xảy ra lỗi xung đột chỉnh sửa.`,
          },
          {
            id: 'p-practice-2-4',
            title: 'Bài luyện tập: Kỹ năng hợp tác số',
            description: 'Trắc nghiệm kiểm tra tình huống làm việc nhóm trên nền tảng số.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Kiểm tra kỹ năng làm việc nhóm trực tuyến hiệu quả.',
            practiceQuestions: makeQuestions(45, 5),
          },
        ],
      },
      {
        id: 'c89a9a81-1c59-42fe-914a-6303da1cdb73',
        skillCode: '2.5',
        title: 'Chuẩn mực ứng xử và văn hóa số',
        desc: 'Thực hành quy tắc ứng xử văn minh (Netiquette), tôn trọng sự đa dạng trên không gian mạng.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000201',
            title: 'Văn hóa giao tiếp trực tuyến (Netiquette) chuyên nghiệp',
            description: 'Quy tắc ứng xử văn minh trong email công việc, diễn đàn và mạng xã hội.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### 10 Quy tắc vàng Netiquette
1. Nhớ rằng người đang đọc cũng là con người.
2. Tuân thủ chuẩn mực đạo đức như trong đời thực.
3. Tôn trọng thời gian và băng thông của người khác.
4. Tránh viết hoa toàn bộ chữ (VIẾT HOA TOÀN BỘ tương đương với việc la hét).`,
          },
        ],
      },
      {
        id: '6f292fe4-93cc-4679-b611-031b63b00298',
        skillCode: '2.6',
        title: 'Quản lý danh tính số',
        desc: 'Tạo lập, bảo vệ và quản lý các danh tính số cũng như dữ liệu dấu vết cá nhân trực tuyến.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000203',
            title: 'Quản lý danh tính số và kiểm soát dấu vết kỹ thuật số',
            description: 'Nhận biết dấu vết số (Digital Footprint) chủ động và thụ động, kiểm soát thông tin cá nhân.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Dấu vết số (Digital Footprint)
- **Dấu vết chủ động:** Bài viết đăng mạng xã hội, bình luận, ảnh tự tải lên.
- **Dấu vết thụ động:** Lịch sử tìm kiếm, địa chỉ IP, cookies quảng cáo.
- **Kiểm soát:** Thường xuyên tìm kiếm tên mình trên Google để rà soát hình ảnh cá nhân.`,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // MIỀN 3: SÁNG TẠO NỘI DUNG SỐ & AI (4 MIỀN CON)
  // -------------------------------------------------------------
  {
    code: '03',
    domainNumber: 3,
    title: 'Sáng tạo Nội dung số & AI',
    desc: 'Thiết kế ấn phẩm, ứng dụng AI có trách nhiệm, hiểu bản quyền và tư duy tính toán.',
    iconName: 'Lightbulb',
    badgeColor: 'amber',
    subdomains: [
      {
        id: '5400fd2f-456e-4c5e-8211-28e31d2c526d',
        skillCode: '3.1',
        title: 'Phát triển nội dung số',
        desc: 'Tạo và chỉnh sửa nội dung số ở nhiều định dạng: văn bản, hình ảnh, âm thanh, video.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000301',
            title: 'Thiết kế ấn phẩm số và trực quan hóa dữ liệu',
            description: 'Nguyên lý bố cục, độ tương phản chuẩn WCAG và trực quan hóa dữ liệu bảng biểu.',
            durationMinutes: 20,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Nguyên lý thiết kế ấn phẩm số
- **Độ tương phản:** Đảm bảo tỷ lệ tương phản tối thiểu 4.5:1 cho văn bản thông thường.
- **Phân cấp thị giác:** Tiêu đề lớn, nội dung vừa, chú thích nhỏ gọn.`,
          },
          {
            id: 'p-practice-3-1',
            title: 'Bài luyện tập: Sáng tạo và biên tập nội dung số',
            description: 'Trắc nghiệm thực tế về định dạng ảnh, video và thiết kế truyền thông.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Kiểm tra kỹ năng lựa chọn định dạng và công cụ sản xuất nội dung số.',
            practiceQuestions: makeQuestions(60, 5),
          },
        ],
      },
      {
        id: '4e73aba2-42b6-414e-8b6c-ea03e2065575',
        skillCode: '3.2',
        title: 'Tích hợp và tái cấu trúc nội dung số',
        desc: 'Biên tập, kết hợp các tài nguyên số sẵn có và cộng tác cùng công cụ AI tạo sinh.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000302',
            title: 'Kỹ nghệ Prompt AI tạo sinh và kiểm chứng nội dung',
            description: 'Xây dựng câu lệnh Prompt có cấu trúc (Role, Context, Task, Constraint) và kiểm chứng Fact-check.',
            durationMinutes: 20,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Framework Prompt AI chuyên nghiệp (RCTC)
1. **Role (Vai trò):** Bạn là chuyên gia phân tích dữ liệu giáo dục.
2. **Context (Bối cảnh):** Tôi đang chuẩn bị báo cáo nghiên cứu cho học viên đại học.
3. **Task (Nhiệm vụ):** Hãy tóm tắt 3 phát hiện chính từ báo cáo sau.
4. **Constraint (Ràng buộc):** Không quá 200 từ, định dạng gạch đầu dòng, trung thực với dữ liệu gốc.`,
          },
        ],
      },
      {
        id: '9a65dadb-f21d-41d8-a0cc-e3f6f6588008',
        skillCode: '3.3',
        title: 'Bản quyền và giấy phép',
        desc: 'Hiểu và áp dụng quy định về bản quyền số, giấy phép Creative Commons và đạo đức AI.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000303',
            title: 'Bản quyền số, giấy phép Creative Commons và đạo đức AI',
            description: 'Phân biệt các giấy phép CC BY, CC BY-SA, CC BY-NC và quy định trích dẫn tác quyền.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Các loại giấy phép Creative Commons
- **CC BY:** Được phép chia sẻ, sửa đổi nhưng bắt buộc phải ghi công tác giả.
- **CC BY-SA:** Chia sẻ tương tự, sản phẩm phái sinh phải áp dụng cùng giấy phép.
- **CC BY-NC:** Chỉ được sử dụng cho mục đích phi thương mại.`,
          },
          {
            id: 'p-practice-3-3',
            title: 'Bài luyện tập: Bản quyền số và đạo đức AI',
            description: '5 câu hỏi trắc nghiệm tình huống về sở hữu trí tuệ trên mạng.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Luyện tập các quy tắc pháp lý và đạo đức khi sử dụng tài nguyên số.',
            practiceQuestions: makeQuestions(70, 5),
          },
        ],
      },
      {
        id: '40bf0ca8-e831-4b08-a017-26d087895e19',
        skillCode: '3.4',
        title: 'Tư duy tính toán và lập trình',
        desc: 'Phát triển chuỗi lệnh thuật toán, logic tự động hóa và giải quyết bài toán qua lập trình.',
        lessons: [
          {
            id: 'l-computational-thinking',
            title: 'Tư duy Thuật toán và Tự động hóa Tác vụ Bằng Code',
            description: 'Các bước phân rã bài toán, nhận diện mẫu và viết script tự động hóa đơn giản.',
            durationMinutes: 20,
            pointReward: 25,
            type: 'LESSON',
            contentMarkdown: `### 4 Trụ cột của Tư duy Tính toán
1. **Phân rã (Decomposition):** Chia vấn đề lớn thành các phần nhỏ dễ giải quyết.
2. **Nhận diện quy luật (Pattern Recognition):** Tìm kiếm điểm tương đồng giữa các bài toán.
3. **Trừu tượng hóa (Abstraction):** Bỏ qua chi tiết phụ, tập trung vào bản chất.
4. **Thiết kế thuật toán (Algorithm Design):** Xây dựng các bước giải quyết từng bước một.`,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // MIỀN 4: AN TOÀN & BẢO MẬT SỐ (4 MIỀN CON)
  // -------------------------------------------------------------
  {
    code: '04',
    domainNumber: 4,
    title: 'An toàn & Bảo mật số',
    desc: 'Bảo vệ thiết bị, dữ liệu cá nhân, quyền riêng tư, sức khỏe số và môi trường.',
    iconName: 'Shield',
    badgeColor: 'purple',
    subdomains: [
      {
        id: '3782aee1-4044-464e-9e6c-73a1adf3a0b5',
        skillCode: '4.1',
        title: 'Bảo vệ thiết bị',
        desc: 'Bảo vệ thiết bị vật lý và môi trường số khỏi các rủi ro phần mềm độc hại, tấn công mạng.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000401',
            title: 'Nhận diện tấn công giả mạo (Phishing) và bảo vệ thiết bị',
            description: 'Phát hiện các đường link độc hại, email mạo danh ngân hàng và cài đặt phần mềm bảo vệ.',
            durationMinutes: 20,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Nhận diện email lừa đảo (Phishing)
- Kiểm tra địa chỉ email người gửi thực tế (Domain spoofing).
- Cảnh giác với các thông điệp đe dọa khóa tài khoản khẩn cấp trong 24 giờ.
- Tuyệt đối không mở file đính kèm có đuôi \`.exe\`, \`.scr\`, \`.vbs\` từ người lạ.`,
          },
          {
            id: 'p-practice-4-1',
            title: 'Bài luyện tập: Bảo vệ thiết bị và an toàn mạng',
            description: 'Trắc nghiệm kiểm tra kỹ năng phòng chống virus và tấn công mạng.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Kiểm tra độ nhạy bén trước các hình thức lừa đảo trực tuyến.',
            practiceQuestions: makeQuestions(80, 5),
          },
        ],
      },
      {
        id: 'fed5158f-da15-46f9-9eed-0af2fd70b248',
        skillCode: '4.2',
        title: 'Bảo vệ dữ liệu cá nhân & riêng tư',
        desc: 'Bảo mật thông tin riêng tư, quản lý chính sách chia sẻ dữ liệu và xác thực 2 lớp (2FA).',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000402',
            title: 'Xác thực 2 yếu tố (2FA) và quản lý mật khẩu an toàn',
            description: 'Thiết lập ứng dụng Authenticator, khóa Passkey và sử dụng trình quản lý mật khẩu.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Bảo mật tài khoản cấp cao
- **Mật khẩu mạnh:** Độ dài từ 12 ký tự trở lên, kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
- **Xác thực 2 lớp (2FA):** Ưu tiên dùng Google Authenticator hoặc Passkey thay cho tin nhắn SMS OTP.`,
          },
        ],
      },
      {
        id: '202b3822-953d-4675-ad29-45c1ecc22789',
        skillCode: '4.3',
        title: 'Hỗ trợ sức khỏe tinh thần và thể chất',
        desc: 'Tránh các rủi ro sức khỏe, công thái học, bảo vệ tâm lý trước căng thẳng số.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000403',
            title: 'Bảo vệ sức khỏe thể chất và tâm lý trong môi trường số',
            description: 'Quy tắc 20-20-20 bảo vệ mắt, công thái học bàn làm việc và cân bằng thời gian sử dụng thiết bị.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Cân bằng sức khỏe trong kỷ nguyên số
- **Quy tắc 20-20-20:** Cứ 20 phút nhìn màn hình, hãy nhìn ra xa 20 feet (6m) trong 20 giây.
- **Công thái học (Ergonomics):** Màn hình ngang tầm mắt, cổ tay thẳng hàng khi gõ phím.`,
          },
        ],
      },
      {
        id: 'c18b636b-950b-460a-bf7f-62f98b081f6c',
        skillCode: '4.4',
        title: 'Tác động môi trường của công nghệ số',
        desc: 'Nhận thức và giảm thiểu tác động tiêu cực của thiết bị số và rác thải điện tử tới môi trường.',
        lessons: [
          {
            id: 'l-green-tech',
            title: 'Tiêu dùng Công nghệ Bền vững và Giảm Rác thải Điện tử',
            description: 'Kéo dài vòng đời thiết bị, tái chế đúng cách và tiết kiệm năng lượng số.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Công nghệ xanh (Green Technology)
- Thu hồi và xử lý rác thải điện tử (E-waste) đúng nơi quy định, không vứt pin vào thùng rác thường.
- Xóa bớt email và tệp tin rác trên đám mây để giảm tải năng lượng tiêu thụ tại trung tâm dữ liệu.`,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // MIỀN 5: GIẢI QUYẾT VẤN ĐỀ SỐ (4 MIỀN CON)
  // -------------------------------------------------------------
  {
    code: '05',
    domainNumber: 5,
    title: 'Giải quyết Vấn đề số',
    desc: 'Xác định sự cố kỹ thuật, lựa chọn công cụ công nghệ và bồi dưỡng năng lực số liên tục.',
    iconName: 'Wrench',
    badgeColor: 'teal',
    subdomains: [
      {
        id: 'c44c6158-0d28-4a73-b7a3-32d8dfa8172d',
        skillCode: '5.1',
        title: 'Xác định & giải quyết sự cố kỹ thuật',
        desc: 'Nhận diện các vấn đề kỹ thuật khi vận hành thiết bị số và áp dụng giải pháp khắc phục.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000501',
            title: 'Quy trình chẩn đoán và khắc phục sự cố kỹ thuật số',
            description: 'Các bước cô lập sự cố mất kết nối mạng, xung đột driver và ứng dụng bị treo.',
            durationMinutes: 20,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### 5 Bước khắc phục sự cố kỹ thuật
1. Tái hiện và xác định chính xác triệu chứng lỗi (chụp ảnh màn hình, xem mã lỗi).
2. Kiểm tra các yếu tố vật lý cơ bản: Dây cáp, nguồn điện, nút bật/tắt Wi-Fi.
3. Khởi động lại thiết bị hoặc dịch vụ (Restart).
4. Tìm kiếm giải pháp theo mã lỗi chính xác trên diễn đàn hỗ trợ chính thức.`,
          },
          {
            id: 'p-practice-5-1',
            title: 'Bài luyện tập: Khắc phục sự cố kỹ thuật số',
            description: 'Trắc nghiệm xử lý tình huống mất mạng, lỗi phần mềm và sao lưu cấp bách.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Rèn luyện kỹ năng xử lý sự cố máy tính thường gặp.',
            practiceQuestions: makeQuestions(100, 5),
          },
        ],
      },
      {
        id: 'ac0b2598-4117-4e05-a3cd-4974aab780e6',
        skillCode: '5.2',
        title: 'Nhận diện nhu cầu & giải pháp công nghệ',
        desc: 'Đánh giá nhu cầu thực tế và lựa chọn công cụ số, phần mềm hoặc nền tảng tối ưu.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000502',
            title: 'Lựa chọn công cụ số tối ưu theo bài toán thực tế',
            description: 'So sánh chi phí, tính năng và độ bảo mật giữa các giải pháp phần mềm trên thị trường.',
            durationMinutes: 15,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Ma trận lựa chọn công nghệ
- Đánh giá theo tiêu chí: Bảo mật, Khả năng mở rộng, Chi phí và Trải nghiệm người dùng.
- Thử nghiệm giải pháp (PoC) trước khi triển khai chính thức.`,
          },
        ],
      },
      {
        id: '8e4cae8f-e598-4883-85f9-a50a2063cbeb',
        skillCode: '5.3',
        title: 'Giải pháp sáng tạo bằng công nghệ số',
        desc: 'Sử dụng các công nghệ số một cách sáng tạo để giải quyết các thách thức công việc.',
        lessons: [
          {
            id: 'c0000000-0000-0000-0000-000000000503',
            title: 'Tự động hóa công việc thường nhật với công cụ số',
            description: 'Tạo luồng tự động gửi thông báo, trích xuất dữ liệu biểu mẫu và đồng bộ hóa báo cáo.',
            durationMinutes: 20,
            pointReward: 20,
            type: 'LESSON',
            contentMarkdown: `### Tự động hóa quy trình không cần code (No-Code)
- Kết nối Webhook và tự động hóa email thông báo.
- Tạo kịch bản xử lý dữ liệu tự động giữa bảng tính và ứng dụng.`,
          },
        ],
      },
      {
        id: '4f90cac7-901f-40be-a292-d9670b16baa5',
        skillCode: '5.4',
        title: 'Nhận diện & bồi dưỡng năng lực số',
        desc: 'Tự nhận biết khoảng trống năng lực cá nhân và chủ động cập nhật công nghệ mới liên tục.',
        lessons: [
          {
            id: 'd0000000-0000-0000-0000-000000000005',
            title: 'Chiến lược Tự khắc phục Lỗ hổng Kỹ năng Số & Cập nhật Công nghệ Mới',
            description: 'Xây dựng kế hoạch học tập suốt đời và thích ứng nhanh với các công nghệ đột phá.',
            durationMinutes: 20,
            pointReward: 30,
            type: 'LESSON',
            contentMarkdown: `### Học tập suốt đời trong kỷ nguyên số
- Theo dõi các nguồn tin công nghệ quốc tế uy tín.
- Tham gia cộng đồng chuyên môn và thực hành các dự án thực tế.`,
          },
          {
            id: 'p-practice-5-4',
            title: 'Bài luyện tập: Tự nhận diện và nâng cao năng lực số',
            description: '5 câu hỏi trắc nghiệm kiểm tra chiến lược tự học và cập nhật công nghệ.',
            durationMinutes: 10,
            pointReward: 30,
            type: 'PRACTICE',
            contentMarkdown: 'Đánh giá năng lực tự bồi dưỡng và thích ứng công nghệ.',
            practiceQuestions: makeQuestions(115, 5),
          },
        ],
      },
    ],
  },
];
