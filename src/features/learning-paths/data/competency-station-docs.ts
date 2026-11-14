/**
 * BỘ TÀI LIỆU CHUẨN HÓA NĂNG LỰC SỐ NEXA (21 TRẠM NĂNG LỰC)
 *
 * Tài liệu đào tạo, hướng dẫn tư duy và quy trình chuẩn mực được xây dựng độc quyền cho NEXA.
 * Mỗi trạm năng lực sở hữu:
 * - Chuẩn mực đầu ra và sứ mệnh phát triển năng lực số
 * - Sơ đồ quy trình tư duy & luồng thực hiện (Workflow)
 * - Ma trận 4 cấp độ thành thạo (Cơ bản -> Chuyên sâu)
 * - Nguyên tắc kết hợp công nghệ AI có trách nhiệm
 * - Bẫy sai sót thực tế & Giải pháp phòng tránh
 * - Bộ tiêu chí tự đánh giá năng lực thực chiến
 */

export interface StationWorkflowStep {
  stepNumber: number;
  title: string;
  action: string;
  output: string;
  tip: string;
}

export interface StationLevelCriteria {
  levelNumber: number;
  levelName: string;
  standard: string;
  keySkills: string[];
  contextExample: string;
}

export interface StationPitfall {
  mistake: string;
  consequence: string;
  bestPractice: string;
}

export interface StationDocItem {
  skillCode: string; // e.g. "3.1"
  domainCode: string; // "01", "02", "03", "04", "05"
  domainNumber: number;
  domainTitle: string;
  title: string;
  badge: string;
  headline: string;
  overview: string;
  targetOutcome: string;
  workflow: StationWorkflowStep[];
  levels: StationLevelCriteria[];
  aiGuidelines: {
    roleOfAI: string;
    ethicalChecklist: string[];
    riskWarning: string;
  };
  commonPitfalls: StationPitfall[];
  recommendedTools: {
    category: string;
    tools: string[];
  }[];
  selfChecklist: string[];
}

export const COMPETENCY_STATION_DOCS: Record<string, StationDocItem> = {
  // =========================================================================
  // MIỀN 1: THÔNG TIN VÀ DỮ LIỆU SỐ
  // =========================================================================
  '1.1': {
    skillCode: '1.1',
    domainCode: '01',
    domainNumber: 1,
    domainTitle: 'Thông tin và Dữ liệu số',
    title: 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin',
    badge: 'Trạm 01 • Miền 1',
    headline: 'Định hướng nhu cầu thông tin, làm chủ cú pháp tìm kiếm và tinh lọc dữ liệu chính xác trên không gian số.',
    overview: 'Trong kỷ nguyên số, khả năng tìm kiếm không đơn thuần là gõ từ khóa vào công cụ tìm kiếm, mà là kỹ năng nhận diện chính xác khoảng trống thông tin cần bù đắp, thiết lập chiến lược truy vấn đa chiều và khai thác các toán tử nâng cao để chắt lọc dữ liệu có giá trị cao nhất.',
    targetOutcome: 'Xác định rõ ràng nhu cầu thông tin, xây dựng truy vấn tối ưu và điều hướng các môi trường số để tiếp cận dữ liệu tin cậy phục vụ nghiên cứu và công việc.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Xác định mục tiêu & Phạm vi thông tin',
        action: 'Phân rã câu hỏi nghiên cứu thành các từ khóa then chốt, thuật ngữ đồng nghĩa và giới hạn thời gian/nguồn tài liệu.',
        output: 'Bản đồ từ khóa (Keyword Map) và tiêu chí loại trừ.',
        tip: 'Tránh đặt câu hỏi quá chung chung; hãy xác định rõ bạn cần số liệu thống kê, báo cáo nghiên cứu hay quy định pháp lý.',
      },
      {
        stepNumber: 2,
        title: 'Thiết lập cú pháp & Bộ lọc nâng cao',
        action: 'Áp dụng các toán tử logic (AND, OR, NOT), cú pháp đặc thù (site:, filetype:, intitle:) và bộ lọc thời gian.',
        output: 'Chuỗi truy vấn có cấu trúc chuẩn xác.',
        tip: 'Ví dụ: site:gov.vn filetype:pdf "chuyển đổi số" 2024 để lấy trực tiếp các văn bản chính sách.',
      },
      {
        stepNumber: 3,
        title: 'Sàng lọc & Khám phá thông tin phân nhánh',
        action: 'Duyệt lướt mục lục, trích yếu và siêu dữ liệu (Metadata) để đánh giá nhanh độ phù hợp trước khi tải về.',
        output: 'Danh sách các tài nguyên dữ liệu đạt chuẩn ban đầu.',
        tip: 'Sử dụng kỹ thuật đọc quét (Scanning) và tìm kiếm ngược từ danh mục tài liệu tham khảo.',
      },
      {
        stepNumber: 4,
        title: 'Lưu trữ & Chuẩn hóa siêu dữ liệu nguồn',
        action: 'Đánh dấu dấu trang (Bookmark), ghi chú nguồn trích dẫn và tổ chức thư mục tra cứu có hệ thống.',
        output: 'Kho dữ liệu đầu vào sẵn sàng cho việc phân tích và đánh giá.',
        tip: 'Ghi lại thời điểm truy cập và đường dẫn URL gốc để phục vụ trích dẫn học thuật.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Nhận biết nhu cầu thông tin cơ bản, biết sử dụng công cụ tìm kiếm thông dụng với từ khóa đơn lẻ.',
        keySkills: ['Gõ từ khóa tìm kiếm cơ bản', 'Chọn lọc kết quả trong trang hiển thị đầu tiên', 'Lưu liên kết trang web vào Bookmark'],
        contextExample: 'Tìm kiếm hướng dẫn biểu mẫu hành chính trực tuyến trên cổng dịch vụ công.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Vận dụng linh hoạt các bộ lọc, toán tử Boolean và tìm kiếm đa nền tảng để thu hẹp kết quả chính xác.',
        keySkills: ['Sử dụng toán tử AND, OR, dấu ngoặc kép', 'Lọc kết quả theo định dạng file (PDF, XLSX) và miền tên miền', 'So sánh kết quả giữa nhiều công cụ tìm kiếm'],
        contextExample: 'Tìm các báo cáo tài chính kiểm toán và số liệu ngành trong vòng 3 năm gần nhất.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Xây dựng chiến lược tìm kiếm phức hợp, khai thác cơ sở dữ liệu học thuật và kho dữ liệu chuyên ngành.',
        keySkills: ['Khai thác kho dữ liệu mở (Open Data) và cổng học thuật', 'Thiết lập thông báo tự động (Google Alerts/RSS)', 'Hướng dẫn đồng nghiệp tối ưu hóa truy vấn'],
        contextExample: 'Thu thập tập dữ liệu lớn về hành vi tiêu dùng từ nhiều kho dữ liệu mở để chạy phân tích mô hình.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Dẫn dắt và thiết kế các quy trình khai thác thông tin quy mô lớn, kết hợp thuật toán thu thập và lập chỉ mục dữ liệu.',
        keySkills: ['Thiết kế khung quy trình khai thác dữ liệu số toàn diện', 'Tích hợp API tìm kiếm và công cụ tự động hóa', 'Đánh giá xu hướng thông tin mới nổi'],
        contextExample: 'Xây dựng hệ thống tự động theo dõi và cảnh báo biến động thông tin thị trường cho toàn tổ chức.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI tạo sinh đóng vai trò trợ lý mở rộng góc nhìn tìm kiếm, gợi ý từ khóa đồng nghĩa và tóm tắt nhanh tài liệu dài.',
      ethicalChecklist: [
        'Không dùng AI để thay thế việc tra cứu nguồn gốc dữ liệu ban đầu',
        'Kiểm tra chéo mọi liên kết hoặc số liệu do AI trích xuất',
        'Ý thức được thiên kiến (Bias) trong các thuật toán đề xuất thông tin',
      ],
      riskWarning: 'AI có thể tự tạo ra các nguồn trích dẫn và liên kết giả mạo (Hallucination); luôn mở tài liệu gốc để xác thực.',
    },
    commonPitfalls: [
      {
        mistake: 'Chỉ đọc 3 kết quả đầu tiên trên trang tìm kiếm và tin tưởng tuyệt đối.',
        consequence: 'Dễ rơi vào các trang quảng cáo được trả tiền hoặc thông tin phiến diện.',
        bestPractice: 'Kéo xuống xem các nguồn uy tín độc lập, kiểm tra nguồn gốc trang (.gov, .edu, các viện nghiên cứu).',
      },
      {
        mistake: 'Sử dụng các từ khóa quá chung chung (ví dụ: "kinh tế").',
        consequence: 'Nhận về hàng triệu kết quả rác, tốn thời gian lọc thủ công.',
        bestPractice: 'Thu hẹp truy vấn với cấu trúc: [Chủ đề] + [Bối cảnh cụ thể] + [Năm] + [Định dạng].',
      },
    ],
    recommendedTools: [
      { category: 'Công cụ tìm kiếm thông dụng', tools: ['Google Advanced Search', 'DuckDuckGo', 'Bing Web Search'] },
      { category: 'Học thuật & Báo cáo chuyên ngành', tools: ['Google Scholar', 'ResearchGate', 'World Bank Open Data'] },
    ],
    selfChecklist: [
      'Tôi biết cách dùng dấu ngoặc kép (" ") để tìm cụm từ chính xác.',
      'Tôi biết cách giới hạn kết quả vào một trang web bằng cú pháp site:domain.com.',
      'Tôi có thói quen kiểm tra ngày phát hành bài viết trước khi sử dụng số liệu.',
    ],
  },

  '1.2': {
    skillCode: '1.2',
    domainCode: '01',
    domainNumber: 1,
    domainTitle: 'Thông tin và Dữ liệu số',
    title: 'Đánh giá dữ liệu, thông tin và nội dung số',
    badge: 'Trạm 02 • Miền 1',
    headline: 'Rèn luyện tư duy phản biện, thẩm định nguồn tin và nhận diện tin giả, thao túng thông tin trên không gian mạng.',
    overview: 'Năng lực thẩm định thông tin là lá chắn bảo vệ người dùng trước làn sóng tin giả (Fake news), hình ảnh/video deepfake và nội dung sai lệch được tạo sinh hàng loạt. Trạm này hướng dẫn bạn phương pháp đọc ngang (Lateral Reading) và kiểm chứng tính xác thực có căn cứ.',
    targetOutcome: 'Đánh giá độc lập độ tin cậy, tính thời sự, thẩm quyền tác giả và mục đích phát tán của bất kỳ thông điệp số nào.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Đọc ngang (Lateral Reading)',
        action: 'Không chỉ dừng lại ở nội dung bài viết; mở các tab mới để tra cứu xem các bên thứ ba nói gì về tác giả và trang tin này.',
        output: 'Hồ sơ uy tín của tác giả và tổ chức phát hành.',
        tip: 'Một trang web giao diện đẹp không đồng nghĩa với thông tin uy tín; hãy xem đánh giá của các tổ chức kiểm chứng độc lập.',
      },
      {
        stepNumber: 2,
        title: 'Áp dụng khung kiểm chứng CRAAP',
        action: 'Rà soát 5 tiêu chí: Tính cập nhật (Currency), Tính phù hợp (Relevance), Thẩm quyền (Authority), Tính chính xác (Accuracy), Mục đích (Purpose).',
        output: 'Bảng điểm đánh giá mức độ tin cậy của tài liệu.',
        tip: 'Đặc biệt chú ý đến Mục đích: Bài viết nhằm thông tin khách quan hay đang cố tình bán hàng/kích động dư luận?',
      },
      {
        stepNumber: 3,
        title: 'Truy tìm nguồn gốc & Ảnh ngược',
        action: 'Sử dụng công cụ tìm kiếm ảnh ngược (Reverse Image Search) để kiểm tra xem hình ảnh có bị cắt ghép hoặc lấy từ sự kiện cũ hay không.',
        output: 'Bối cảnh gốc của hình ảnh/video.',
        tip: 'Chú ý các bất thường ở bàn tay, ánh mắt, phản chiếu ánh sáng để nhận diện sản phẩm AI tạo sinh.',
      },
      {
        stepNumber: 4,
        title: 'Đối chiếu đa nguồn & Kết luận',
        action: 'Tìm kiếm ít nhất 2 nguồn tin cậy độc lập khác có đưa tin cùng góc nhìn hay không trước khi chia sẻ hoặc đưa vào báo cáo.',
        output: 'Kết luận bằng chứng có thể trích dẫn an toàn.',
        tip: 'Nếu một thông tin quá giật gân mà không có bất kỳ hãng tin lớn nào xác nhận, khả năng cao đó là tin thất thiệt.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Nhận biết sự khác biệt giữa thông tin chính thống và tin đồn mạng xã hội; biết kiểm tra nguồn tác giả.',
        keySkills: ['Xem thông tin giới thiệu tác giả', 'Nhận diện các đường link lừa đảo cơ bản', 'Cảnh giác với các tiêu đề giật gân (Clickbait)'],
        contextExample: 'Phát hiện bài viết mạo danh cơ quan y tế khuyên dùng thuốc không rõ nguồn gốc.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Áp dụng quy trình đọc ngang và công cụ kiểm chứng để xác định tính xác thực của tin tức và số liệu.',
        keySkills: ['Thực hiện tìm kiếm ảnh ngược trên Google/TinEye', 'Phân tích động cơ thương mại/chính trị đằng sau bài viết', 'Nhận diện hình ảnh Deepfake AI cơ bản'],
        contextExample: 'Kiểm chứng một hình ảnh thiên tai đang lan truyền để xác minh xem có phải chụp tại địa phương hay không.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Phân tích các chiến dịch thao túng thông tin tinh vi, thẩm định dữ liệu khoa học và phương pháp nghiên cứu.',
        keySkills: ['Kiểm tra phương pháp lấy mẫu số liệu thống kê', 'Phát hiện thuật toán đề xuất gây bong bóng thông tin (Echo Chamber)', 'Cung cấp phản biện có bằng chứng bảo vệ tập thể'],
        contextExample: 'Thẩm định một báo cáo thị trường có dấu hiệu bóp méo số liệu nhằm thiên vị sản phẩm của nhà tài trợ.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Thiết lập tiêu chuẩn kiểm chứng thông tin cho tổ chức, dẫn dắt các chiến dịch truyền thông về an toàn thông tin.',
        keySkills: ['Xây dựng cẩm nang thẩm định thông tin số', 'Đào tạo kỹ năng phân tích phản biện số', 'Phát triển công cụ tự động phát hiện sai lệch dữ liệu'],
        contextExample: 'Xây dựng quy chế xác thực thông tin báo chí và dữ liệu truyền thông trước khi công bố ra công chúng.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ tóm tắt các luận điểm trái chiều và gợi ý các nguồn phản biện độc lập.',
      ethicalChecklist: [
        'Cảnh giác với xu hướng tạo nội dung giật gân tự động của các mô hình AI',
        'Kiểm tra kỹ lưỡng các số liệu thống kê do AI đưa ra',
        'Không phát tán nội dung chưa được kiểm chứng dù nội dung đó do AI soạn thảo rất trôi chảy',
      ],
      riskWarning: 'Mô hình AI tạo sinh thường viết với giọng điệu rất tự tin ngay cả khi thông tin hoàn toàn sai lệch (Sự tự tin giả tạo).',
    },
    commonPitfalls: [
      {
        mistake: 'Tin tưởng một thông tin chỉ vì nó được nhiều lượt chia sẻ hoặc tài khoản có tích xanh đăng lại.',
        consequence: 'Dễ trở thành mắt xích vô tình tiếp tay cho tin giả lan rộng.',
        bestPractice: 'Luôn tìm đường dẫn về văn bản gốc, thông cáo báo chí chính thức.',
      },
      {
        mistake: 'Chỉ dựa vào cảm xúc để đánh giá thông tin (Thấy hợp ý mình là tin ngay).',
        consequence: 'Rơi vào bẫy thiên kiến xác nhận (Confirmation Bias).',
        bestPractice: 'Chủ động tìm kiếm các bài viết phản biện để xem xét điểm yếu của thông tin đó.',
      },
    ],
    recommendedTools: [
      { category: 'Tìm kiếm ảnh & Video ngược', tools: ['Google Lens', 'TinEye Reverse Image', 'InVID WeVerify'] },
      { category: 'Trang kiểm chứng độc lập', tools: ['Snopes', 'FactCheck.org', 'Trung tâm Xử lý tin giả Việt Nam (VAFC)'] },
    ],
    selfChecklist: [
      'Tôi luôn kiểm tra xem bài viết được đăng tải vào ngày tháng năm nào.',
      'Tôi biết cách kiểm tra tên miền để phát hiện các trang giả mạo (ví dụ: thay đuôi .vn bằng .cc).',
      'Tôi không bao giờ vội vàng chia sẻ bài viết chỉ vì tiêu đề gây sốc.',
    ],
  },

  '1.3': {
    skillCode: '1.3',
    domainCode: '01',
    domainNumber: 1,
    domainTitle: 'Thông tin và Dữ liệu số',
    title: 'Quản lý, lưu trữ và tổ chức dữ liệu, thông tin',
    badge: 'Trạm 03 • Miền 1',
    headline: 'Xây dựng cấu trúc dữ liệu khoa học, phân loại thông minh và thiết lập cơ chế sao lưu bảo vệ tài nguyên số lâu dài.',
    overview: 'Dữ liệu số chỉ phát huy sức mạnh khi được sắp xếp ngăn nắp, dễ truy xuất và an toàn trước sự cố phần cứng. Năng lực này giúp bạn làm chủ quy tắc đặt tên tệp, cấu trúc cây thư mục, siêu dữ liệu và chiến lược sao lưu chuẩn 3-2-1.',
    targetOutcome: 'Tổ chức, lưu trữ và bảo vệ dữ liệu cá nhân cũng như công việc một cách bài bản, sẵn sàng chia sẻ và truy xuất nhanh chóng.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Thiết kế cây thư mục phân cấp',
        action: 'Xây dựng sơ đồ phân cấp thư mục theo dự án, niên độ hoặc chủ đề thay vì để toàn bộ file ngoài màn hình Desktop.',
        output: 'Kiến trúc thư mục logic, có quy hoạch rõ ràng.',
        tip: 'Quy tắc 3 cấp: Không nên lồng thư mục con sâu quá 3-4 tầng để tránh đường dẫn quá dài.',
      },
      {
        stepNumber: 2,
        title: 'Chuẩn hóa quy ước đặt tên tệp (Naming Convention)',
        action: 'Đặt tên tệp theo định dạng thống nhất: [YYYY-MM-DD]_[TênDựÁn]_[TênTàiLiệu]_[PhiênBản].',
        output: 'Hệ thống tệp tự động sắp xếp theo thứ tự thời gian khi xem danh sách.',
        tip: 'Ví dụ: 2026-11-14_NEXA_KeHoachDaoTao_v1.2.docx; tuyệt đối tránh đặt tên "file_moi_nhat_final_sua_lan_cuoi".',
      },
      {
        stepNumber: 3,
        title: 'Gắn thẻ (Tagging) & Quản lý phiên bản',
        action: 'Sử dụng tính năng gán nhãn, đổi màu thư mục và lưu vết lịch sử phiên bản để phân biệt bản nháp và bản chính thức.',
        output: 'Khả năng tìm kiếm nhanh bằng bộ lọc thẻ và khôi phục phiên bản cũ khi cần.',
        tip: 'Khai thác tính năng Version History trên Google Drive hoặc OneDrive để xem lại lịch sử chỉnh sửa.',
      },
      {
        stepNumber: 4,
        title: 'Thực thi chiến lược sao lưu 3-2-1',
        action: 'Đảm bảo có ít nhất 3 bản sao dữ liệu, trên 2 phương tiện lưu trữ khác nhau, và ít nhất 1 bản sao nằm ở vị trí khác (Đám mây).',
        output: 'Hệ thống an toàn dữ liệu, chống mất mát do hỏng ổ cứng hoặc mã độc tống tiền.',
        tip: 'Định kỳ kiểm tra việc khôi phục thử nghiệm từ bản sao lưu để đảm bảo file sao lưu hoạt động tốt.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết tạo thư mục, lưu tệp vào đúng vị trí và tìm kiếm tệp cơ bản trên máy tính hoặc đám mây.',
        keySkills: ['Tạo và đổi tên thư mục', 'Lưu tệp đính kèm về máy an toàn', 'Di chuyển tệp giữa các thư mục'],
        contextExample: 'Tạo thư mục cho từng môn học hoặc dự án và lưu tài liệu học tập vào đó.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Áp dụng quy tắc đặt tên chuẩn, quản lý quyền truy cập tệp và đồng bộ dữ liệu đám mây hiệu quả.',
        keySkills: ['Thiết lập quy ước đặt tên nhất quán', 'Cấu hình quyền chia sẻ tệp (Xem / Bình luận / Chỉnh sửa)', 'Sử dụng công cụ đồng bộ tự động'],
        contextExample: 'Tổ chức kho tài liệu chung cho nhóm học tập với phân quyền rõ ràng.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Xây dựng kiến trúc thông tin dữ liệu, thiết lập hệ thống lưu trữ mã hóa và quản trị vòng đời dữ liệu.',
        keySkills: ['Thiết lập chính sách lưu trữ và hủy tài liệu hết hạn', 'Mã hóa các thư mục dữ liệu nhạy cảm', 'Tự động hóa luồng sao lưu định kỳ'],
        contextExample: 'Thiết kế kho lưu trữ số của phòng ban, bao gồm quy chế bảo mật và kế hoạch phục hồi sau sự cố.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Chủ trì chiến lược quản trị dữ liệu (Data Governance) toàn diện, tuân thủ tiêu chuẩn an toàn thông tin.',
        keySkills: ['Xây dựng khung quản trị dữ liệu doanh nghiệp', 'Tối ưu hóa chi phí lưu trữ hạ tầng đám mây', 'Đánh giá rủi ro tuân thủ pháp luật dữ liệu'],
        contextExample: 'Hoạch định chiến lược di chuyển dữ liệu lớn lên hạ tầng bảo mật cao đáp ứng chuẩn ISO/IEC 27001.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ quét tự động để phân loại tệp, trích xuất siêu dữ liệu và gợi ý cấu trúc thư mục tối ưu.',
      ethicalChecklist: [
        'Không tải các dữ liệu mật, thông tin cá nhân nội bộ lên các công cụ AI công cộng',
        'Kiểm tra quyền sở hữu dữ liệu khi sử dụng các dịch vụ tự động hóa AI',
        'Bảo đảm tính minh bạch trong việc đặt tên và chú thích dữ liệu huấn luyện',
      ],
      riskWarning: 'Lưu trữ thông tin nhạy cảm trên các nền tảng AI miễn phí có thể khiến dữ liệu bị sử dụng để huấn luyện mô hình công khai.',
    },
    commonPitfalls: [
      {
        mistake: 'Lưu tất cả tài liệu ngoài màn hình Desktop hoặc trong một thư mục Download khổng lồ.',
        consequence: 'Khó tìm kiếm, làm chậm máy tính và dễ bị xóa nhầm khi dọn dẹp hệ thống.',
        bestPractice: 'Hình thành thói quen phân loại ngay khi tải tệp về: Dành 5 giây chuyển file vào thư mục chuyên biệt.',
      },
      {
        mistake: 'Chỉ lưu trữ duy nhất trên ổ cứng máy tính cá nhân hoặc thẻ nhớ USB.',
        consequence: 'Mất toàn bộ dữ liệu vĩnh viễn khi máy tính bị hỏng, mất cắp hoặc nhiễm virus.',
        bestPractice: 'Kích hoạt đồng bộ hóa với dịch vụ lưu trữ đám mây uy tín và sao lưu định kỳ.',
      },
    ],
    recommendedTools: [
      { category: 'Lưu trữ đám mây', tools: ['Google Drive', 'Microsoft OneDrive', 'Dropbox'] },
      { category: 'Quản lý ghi chú & Dữ liệu cá nhân', tools: ['Notion', 'Obsidian', 'Microsoft OneNote'] },
    ],
    selfChecklist: [
      'Tên tệp của tôi có chứa ngày tháng hoặc số phiên bản rõ ràng.',
      'Tôi có ít nhất một bản sao lưu dữ liệu quan trọng trên đám mây.',
      'Tôi kiểm tra quyền chia sẻ tệp công khai trước khi gửi link cho người khác.',
    ],
  },

  // =========================================================================
  // MIỀN 2: GIAO TIẾP VÀ CỘNG TÁC SỐ
  // =========================================================================
  '2.1': {
    skillCode: '2.1',
    domainCode: '02',
    domainNumber: 2,
    domainTitle: 'Giao tiếp và Cộng tác số',
    title: 'Tương tác qua các công nghệ số',
    badge: 'Trạm 01 • Miền 2',
    headline: 'Lựa chọn kênh giao tiếp số phù hợp, làm chủ cách thức trao đổi đa phương tiện linh hoạt và hiệu quả.',
    overview: 'Mỗi kênh giao tiếp số (Email, Chat, Hội nghị truyền hình, Bình luận văn bản) đều có đặc thù về tính cấp bách, độ trang trọng và khả năng lưu vết. Kỹ năng tương tác số giúp bạn truyền đạt thông điệp rõ ràng, đúng đối tượng và đúng ngữ cảnh.',
    targetOutcome: 'Lựa chọn và sử dụng thành thạo các phương tiện giao tiếp kỹ thuật số phù hợp với từng hoàn cảnh học tập và công việc.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Phân tích đối tượng & Mức độ khẩn cấp',
        action: 'Xác định rõ người nhận là ai (đối tác, cấp trên hay đồng nghiệp) và mức độ phản hồi cần thiết (ngay lập tức hay không đồng bộ).',
        output: 'Quyết định chọn kênh: Email, Nhóm chat công việc hay Gọi video.',
        tip: 'Vấn đề phức tạp hoặc khẩn cấp nên gọi điện thoại/video; thông tin cần lưu vết hoặc tài liệu chính thức nên gửi email.',
      },
      {
        stepNumber: 2,
        title: 'Soạn thảo thông điệp rõ ràng & súc tích',
        action: 'Cấu trúc thông điệp theo mô hình: Tiêu đề rõ ràng -> Mục đích -> Nội dung chính -> Hành động mong muốn (Call to Action).',
        output: 'Nội dung giao tiếp mạch lạc, tiết kiệm thời gian người đọc.',
        tip: 'Tiêu đề email cần ghi rõ trạng thái, ví dụ: [Cần phản hồi trước 17h] - Báo cáo khảo sát tuần 4.',
      },
      {
        stepNumber: 3,
        title: 'Kiểm tra tệp đính kèm & Định dạng',
        action: 'Rà soát tính tương thích của tệp đính kèm (ưu tiên PDF khi gửi tài liệu đọc), kiểm tra quyền truy cập link.',
        output: 'Thông điệp hoàn chỉnh, không gặp sự cố không mở được tệp.',
        tip: 'Nhớ mở quyền "Bất kỳ ai có đường liên kết đều có thể xem" nếu gửi tài liệu qua Google Drive.',
      },
      {
        stepNumber: 4,
        title: 'Theo dõi & Phản hồi chuyên nghiệp',
        action: 'Xác nhận đã nhận thông tin khi nhận email quan trọng và phản hồi trong khung thời gian cam kết.',
        output: 'Quy trình giao tiếp khép kín, tạo niềm tin với đối tác.',
        tip: 'Nếu chưa thể xử lý ngay, hãy gửi một email ngắn: "Tôi đã nhận được thông tin và sẽ phản hồi trước 14h chiều mai".',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Sử dụng các ứng dụng gửi tin nhắn, email và tham gia cuộc họp trực tuyến cơ bản.',
        keySkills: ['Soạn và gửi email có đính kèm file', 'Bật/tắt mic và camera trong phòng họp', 'Tham gia các nhóm trao đổi công việc'],
        contextExample: 'Tham gia lớp học trực tuyến trên Zoom hoặc Microsoft Teams.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Tùy biến các tính năng giao tiếp nâng cao, thiết lập chữ ký email chuyên nghiệp và quản lý thông báo.',
        keySkills: ['Quản lý hộp thư bằng nhãn (Labels) và bộ lọc (Filters)', 'Tổ chức cuộc họp trực tuyến có lịch hẹn trước', 'Điều chỉnh kênh giao tiếp phù hợp với từng đối tượng'],
        contextExample: 'Thiết lập cuộc họp tuần với khách hàng, gửi lịch mời kèm tài liệu nghị trình qua Google Calendar.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Điều phối luồng thông tin đa kênh trong dự án phức tạp, tích hợp công cụ thông báo tự động.',
        keySkills: ['Quản lý luồng giao tiếp không đồng bộ (Asynchronous Communication)', 'Tích hợp kênh liên lạc với bảng quản lý công việc', 'Xử lý các tình huống hiểu lầm giao tiếp trực tuyến'],
        contextExample: 'Điều phối giao tiếp cho nhóm làm việc từ xa phân tán tại nhiều múi giờ khác nhau.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Hoạch định chiến lược truyền thông số cho toàn tổ chức, xây dựng văn hóa giao tiếp số văn minh và minh bạch.',
        keySkills: ['Thiết kế khung quy tắc giao tiếp số tổ chức', 'Đánh giá hiệu suất luồng thông tin doanh nghiệp', 'Lựa chọn hệ sinh thái truyền thông số tối ưu'],
        contextExample: 'Xây dựng sổ tay quy chuẩn giao tiếp nội bộ và đối ngoại cho doanh nghiệp số.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI hỗ trợ chỉnh sửa văn phong, kiểm tra lỗi ngữ pháp và tóm tắt nhanh chuỗi thảo luận dài.',
      ethicalChecklist: [
        'Không gửi thư điện tử do AI soạn thảo tự động mà không đọc lại cẩn thận',
        'Bảo đảm tính chân thành và nhân văn trong các trao đổi quan trọng',
        'Tuyệt đối không đưa thông tin nhạy cảm của tổ chức vào prompt chat AI công cộng',
      ],
      riskWarning: 'Văn phong AI thường có xu hướng rập khuôn và sáo rỗng; hãy đưa thêm sắc thái và bối cảnh cá nhân vào thông điệp.',
    },
    commonPitfalls: [
      {
        mistake: 'Gửi email không có tiêu đề hoặc tiêu đề trống rỗng như "Tài liệu", "Gửi anh".',
        consequence: 'Email dễ bị đưa vào hộp thư rác (Spam) hoặc bị trôi mất trong hòm thư.',
        bestPractice: 'Tiêu đề phải tóm lược được nội dung chính và mức độ khẩn cấp.',
      },
      {
        mistake: 'Dùng văn phong viết tắt, cộc lốc trong trao đổi công việc chuyên nghiệp.',
        consequence: 'Gây phản cảm và làm giảm uy tín nghề nghiệp của bản thân.',
        bestPractice: 'Mở đầu bằng lời chào, trình bày rõ ràng có kính ngữ và kết thúc bằng lời cảm ơn kèm chữ ký.',
      },
    ],
    recommendedTools: [
      { category: 'Thư điện tử chuyên nghiệp', tools: ['Gmail Workspace', 'Microsoft Outlook'] },
      { category: 'Hội nghị trực tuyến & Nhắn tin', tools: ['Microsoft Teams', 'Google Meet', 'Slack', 'Zalo OA'] },
    ],
    selfChecklist: [
      'Tôi luôn kiểm tra kỹ người nhận (To, Cc, Bcc) trước khi nhấn nút Gửi.',
      'Tôi kiểm tra xem đã đính kèm tệp hay chưa khi nội dung có nhắc đến tệp đính kèm.',
      'Tôi biết cách tắt mic khi người khác đang phát biểu trong cuộc họp trực tuyến.',
    ],
  },

  '2.2': {
    skillCode: '2.2',
    domainCode: '02',
    domainNumber: 2,
    domainTitle: 'Giao tiếp và Cộng tác số',
    title: 'Chia sẻ thông tin và nội dung số',
    badge: 'Trạm 02 • Miền 2',
    headline: 'Chia sẻ tài nguyên số đúng đối tượng, đúng định dạng và tuân thủ các quy tắc trích dẫn nguồn minh bạch.',
    overview: 'Chia sẻ dữ liệu trên môi trường số đòi hỏi sự am hiểu về các cơ chế phân quyền, khả năng kiểm soát liên kết công khai và trách nhiệm đạo đức đối với tài sản trí tuệ của người khác.',
    targetOutcome: 'Biết cách chia sẻ dữ liệu an toàn, ghi nhận quyền tác giả minh bạch và lựa chọn phương thức truyền tải tối ưu.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Xác định định dạng & Quyền sở hữu',
        action: 'Kiểm tra tài liệu có thuộc diện được phép chia sẻ hay không; chuyển đổi sang định dạng tối ưu dung lượng.',
        output: 'Tệp dữ liệu sẵn sàng chia sẻ, hợp lệ về mặt pháp lý.',
        tip: 'Tài liệu chỉ để đọc nên xuất sang định dạng PDF để giữ nguyên phông chữ và bố cục trên mọi thiết bị.',
      },
      {
        stepNumber: 2,
        title: 'Cấu hình phân quyền truy cập',
        action: 'Chọn mức phân quyền chính xác: Chỉ xem (Viewer), Nhận xét (Commenter) hay Được chỉnh sửa (Editor).',
        output: 'Đường dẫn chia sẻ được bảo vệ theo đúng mục đích.',
        tip: 'Hạn chế tối đa việc mở quyền "Bất kỳ ai có link đều có thể chỉnh sửa" vì dễ bị ghi đè hoặc phá hoại nội dung.',
      },
      {
        stepNumber: 3,
        title: 'Trích dẫn nguồn & Ghi nhận tác giả',
        action: 'Kèm theo thông tin tác giả gốc, liên kết tham chiếu và loại giấy phép nếu sử dụng tài nguyên của người khác.',
        output: 'Nội dung chia sẻ minh bạch, tôn trọng sở hữu trí tuệ.',
        tip: 'Áp dụng cú pháp trích dẫn chuẩn: Tên tác giả (Năm), Tên bài viết, Nguồn liên kết.',
      },
      {
        stepNumber: 4,
        title: 'Thu hồi quyền truy cập khi hoàn tất',
        action: 'Định kỳ rà soát các đường link đã chia sẻ và đóng quyền truy cập khi dự án kết thúc.',
        output: 'Kho dữ liệu an toàn, không bị rò rỉ lâu dài.',
        tip: 'Sử dụng tính năng đặt thời hạn tự động hết hạn truy cập nếu dịch vụ đám mây hỗ trợ.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết chia sẻ liên kết, tệp tin qua mạng xã hội và dịch vụ lưu trữ đám mây thông dụng.',
        keySkills: ['Sao chép liên kết chia sẻ', 'Gửi tệp dung lượng nhỏ qua tin nhắn', 'Nhận diện quyền Xem cơ bản'],
        contextExample: 'Gửi link bài tập nhóm trên Google Drive cho bạn học xem.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Thiết lập phân quyền chi tiết theo nhóm người dùng, quản lý tệp dung lượng lớn và trích dẫn chuẩn.',
        keySkills: ['Sử dụng các dịch vụ chuyển tệp dung lượng lớn', 'Phân quyền riêng biệt cho từng email', 'Áp dụng quy chuẩn trích dẫn nguồn'],
        contextExample: 'Chia sẻ bộ video bài giảng dung lượng 10GB qua WeTransfer hoặc link đám mây bảo mật.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Điều hành các kho tài nguyên dùng chung, tích hợp giấy phép Creative Commons và bảo vệ dữ liệu nhạy cảm.',
        keySkills: ['Cấu hình cổng chia sẻ tài liệu số doanh nghiệp', 'Thiết lập chính sách hạn chế tải xuống hoặc in ấn', 'Quản trị liên kết chia sẻ tự hủy'],
        contextExample: 'Thiết lập kho tài nguyên đào tạo trực tuyến cho toàn bộ nhân sự mới gia nhập công ty.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Xây dựng chính sách chia sẻ dữ liệu mở (Open Data) và khung bảo mật thông tin nội bộ của tổ chức.',
        keySkills: ['Hoạch định chiến lược chia sẻ dữ liệu liên cơ quan', 'Đảm bảo tuân thủ tiêu chuẩn an toàn dữ liệu quốc tế', 'Đánh giá nguy cơ rò rỉ dữ liệu qua kênh chia sẻ'],
        contextExample: 'Chủ trì việc phát hành cổng dữ liệu mở phục vụ cộng đồng nghiên cứu khoa học của viện.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ tạo nhanh danh mục tài liệu tham khảo và định dạng trích dẫn theo chuẩn APA, IEEE.',
      ethicalChecklist: [
        'Không chia sẻ các nội dung do AI tạo sinh giả mạo tác phẩm của nghệ sĩ khác',
        'Ghi chú rõ ràng nếu tài liệu chia sẻ có sự trợ giúp tạo sinh từ AI',
        'Kiểm tra quyền phân phối của tài nguyên số trước khi công bố rộng rãi',
      ],
      riskWarning: 'Chia sẻ các tệp tin chứa dữ liệu cá nhân lên công cụ AI có thể vi phạm điều khoản bảo vệ bí mật đời tư.',
    },
    commonPitfalls: [
      {
        mistake: 'Mở quyền chỉnh sửa công khai cho toàn mạng internet khi chỉ cần người khác xem nội dung.',
        consequence: 'Dữ liệu bị sửa đổi, xóa nhầm hoặc chèn liên kết spam độc hại.',
        bestPractice: 'Mặc định chọn quyền "Người xem", chỉ cấp quyền chỉnh sửa cho những cá nhân cụ thể được định danh.',
      },
      {
        mistake: 'Gửi các tệp đính kèm nặng hàng trăm MB qua email thông thường.',
        consequence: 'Bị lỗi nghẽn hòm thư người nhận, email bị từ chối gửi.',
        bestPractice: 'Tải tệp lên đám mây và chia sẻ đường dẫn truy cập có bảo mật.',
      },
    ],
    recommendedTools: [
      { category: 'Dịch vụ chuyển tệp lớn', tools: ['WeTransfer', 'Google Drive Shared Links', 'OneDrive Share'] },
      { category: 'Tạo mã QR chia sẻ nhanh', tools: ['QR Code Generator', 'Bitly Link Shortener'] },
    ],
    selfChecklist: [
      'Tôi luôn kiểm tra xem người nhận có mở được link tôi chia sẻ hay không.',
      'Tôi ghi rõ nguồn gốc tác giả khi chia sẻ tài liệu không phải do mình tự viết.',
      'Tôi biết cách đóng quyền chia sẻ khi không còn nhu cầu cộng tác.',
    ],
  },

  '2.3': {
    skillCode: '2.3',
    domainCode: '02',
    domainNumber: 2,
    domainTitle: 'Giao tiếp và Cộng tác số',
    title: 'Tham gia hoạt động công dân qua công nghệ số',
    badge: 'Trạm 03 • Miền 2',
    headline: 'Tận dụng dịch vụ công trực tuyến, thực thi quyền công dân số có trách nhiệm và đóng góp giá trị cho cộng đồng.',
    overview: 'Công dân số không chỉ là người tiêu thụ nội dung mà là chủ thể tích cực tham gia vào các dịch vụ công, đóng góp ý kiến phản biện xã hội và sử dụng các nền tảng số để nâng cao chất lượng cuộc sống cộng đồng.',
    targetOutcome: 'Thực hiện thành thạo các thủ tục hành chính công trực tuyến, thể hiện tiếng nói công dân đúng pháp luật và văn minh.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Định danh điện tử an toàn',
        action: 'Đăng nhập vào các cổng dịch vụ công thông qua tài khoản định danh điện tử quốc gia (VNeID) hoặc chữ ký số cá nhân.',
        output: 'Phiên làm việc được định danh pháp lý hợp lệ.',
        tip: 'Bảo mật tuyệt đối mã OTP và mật khẩu tài khoản định danh; không bao giờ chia sẻ cho bất kỳ ai.',
      },
      {
        stepNumber: 2,
        title: 'Tra cứu & Hoàn thiện hồ sơ trực tuyến',
        action: 'Đọc kỹ yêu cầu thủ tục, điền biểu mẫu trực tuyến và tải lên các tệp số hóa giấy tờ cần thiết.',
        output: 'Bộ hồ sơ điện tử đầy đủ theo đúng quy chuẩn.',
        tip: 'Chụp hoặc scan giấy tờ rõ nét, thẳng hàng và đúng định dạng PDF/JPG theo yêu cầu.',
      },
      {
        stepNumber: 3,
        title: 'Theo dõi tiến độ & Thanh toán số',
        action: 'Sử dụng mã hồ sơ để theo dõi tiến độ xử lý và thực hiện thanh toán phí/lệ phí qua cổng thanh toán số.',
        output: 'Biên lai điện tử và giấy hẹn trả kết quả có giá trị pháp lý.',
        tip: 'Lưu lại mã hồ sơ để tra cứu tình trạng giải quyết mọi lúc mọi nơi.',
      },
      {
        stepNumber: 4,
        title: 'Đóng góp ý kiến & Phản ánh số',
        action: 'Tham gia các diễn đàn chính sách, ứng dụng phản ánh hiện trường của đô thị thông minh một cách văn minh, có căn cứ.',
        output: 'Đóng góp thiết thực cho công tác quản lý xã hội số.',
        tip: 'Cung cấp bằng chứng cụ thể (hình ảnh, tọa độ GPS, thời gian) khi gửi phản ánh hiện trường.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết đăng nhập và thực hiện các dịch vụ công cơ bản như tra cứu bảo hiểm, đăng ký thủ tục đơn giản.',
        keySkills: ['Đăng nhập tài khoản định danh điện tử', 'Tra cứu thông tin hành chính công', 'Thanh toán hóa đơn điện/nước trực tuyến'],
        contextExample: 'Tra cứu thông tin cư trú hoặc đăng ký cấp đổi giấy phép lái xe trực tuyến.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Thực hiện trọn vẹn các thủ tục hành chính phức tạp, sử dụng chữ ký số và ứng dụng đô thị thông minh.',
        keySkills: ['Sử dụng chữ ký số cá nhân', 'Nộp hồ sơ thuế điện tử', 'Gửi kiến nghị phản ánh hiện trường có bằng chứng'],
        contextExample: 'Khai báo và quyết toán thuế thu nhập cá nhân trực tuyến qua cổng eTax Mobile.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Tham gia tích cực vào các sáng kiến số cộng đồng, tư vấn và hỗ trợ người dân yếu thế tiếp cận công nghệ.',
        keySkills: ['Tham gia tổ công nghệ số cộng đồng', 'Đánh giá tính dễ sử dụng của cổng dịch vụ công', 'Tuyên truyền kỹ năng số cho người cao tuổi'],
        contextExample: 'Tổ chức các buổi hướng dẫn người dân trong khu dân cư sử dụng ứng dụng thanh toán không tiền mặt.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Đóng góp xây dựng chính sách chính phủ số, thiết kế các mô hình dịch vụ số lấy người dân làm trung tâm.',
        keySkills: ['Nghiên cứu khung chính sách chuyển đổi số quốc gia', 'Đề xuất giải pháp cải tiến quy trình công vụ số', 'Bảo đảm quyền tiếp cận số bình đẳng'],
        contextExample: 'Chủ trì đề án số hóa và cải cách thủ tục hành chính liên thông cấp thành phố.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ tóm tắt các văn bản pháp luật phức tạp và hướng dẫn quy trình thủ tục từng bước.',
      ethicalChecklist: [
        'Không dùng AI để tạo sinh các phản ánh giả mạo hoặc kích động sai lệch chính sách',
        'Kiểm tra lại các trích dẫn luật pháp do AI gợi ý trên cổng văn bản quy phạm pháp luật chính thức',
        'Tôn trọng tiếng nói đa dạng trong cộng đồng trực tuyến',
      ],
      riskWarning: 'Các quy định pháp lý thường xuyên được cập nhật; dữ liệu huấn luyện của AI có thể đã lỗi thời so với luật hiện hành.',
    },
    commonPitfalls: [
      {
        mistake: 'Cung cấp thông tin tài khoản ngân hàng, mật khẩu VNeID cho các đối tượng lạ gọi điện tự xưng là cán bộ hỗ trợ.',
        consequence: 'Bị chiếm đoạt quyền điều khiển thiết bị và mất toàn bộ tiền trong tài khoản.',
        bestPractice: 'Cơ quan nhà nước không bao giờ yêu cầu cung cấp mật khẩu qua điện thoại; chỉ làm việc tại trụ sở hoặc cổng chính thức.',
      },
      {
        mistake: 'Bình luận cảm tính, vu khống cá nhân/tổ chức trên mạng xã hội.',
        consequence: 'Vi phạm Luật An ninh mạng và chịu trách nhiệm pháp lý nghiêm minh.',
        bestPractice: 'Thể hiện ý kiến có văn hóa, dựa trên bằng chứng xác thực và tuân thủ pháp luật.',
      },
    ],
    recommendedTools: [
      { category: 'Cổng dịch vụ công & Định danh', tools: ['Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn)', 'VNeID', 'eTax Mobile'] },
      { category: 'Đô thị thông minh & Phản ánh', tools: ['iHanoi', 'Hue-S', 'Tổng đài 1022'] },
    ],
    selfChecklist: [
      'Tôi tự mình thực hiện được các thủ tục công trực tuyến thiết yếu.',
      'Tôi không bao giờ chia sẻ mã OTP định danh cho người khác.',
      'Tôi biết cách gửi phản ánh kiến nghị khi phát hiện bất cập trong môi trường sống.',
    ],
  },

  '2.4': {
    skillCode: '2.4',
    domainCode: '02',
    domainNumber: 2,
    domainTitle: 'Giao tiếp và Cộng tác số',
    title: 'Cộng tác qua các công cụ và nền tảng số',
    badge: 'Trạm 04 • Miền 2',
    headline: 'Làm việc nhóm thời gian thực, quản lý dự án trực quan và phối hợp nhịp nhàng trên không gian số.',
    overview: 'Cộng tác số là khả năng làm việc cùng nhau trên một tài liệu, cùng quản lý tiến độ trên bảng Kanban và cùng sáng tạo ý tưởng trên bảng trắng kỹ thuật số mà không bị rào cản bởi khoảng cách địa lý.',
    targetOutcome: 'Làm chủ các nền tảng cộng tác số thời gian thực, nâng cao năng suất làm việc nhóm và văn hóa cộng tác minh bạch.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Thiết lập không gian làm việc chung',
        action: 'Tạo thư mục dự án, thiết lập bảng quản lý công việc và mời các thành viên tham gia với vai trò rõ ràng.',
        output: 'Không gian cộng tác số có cấu trúc và phân quyền minh bạch.',
        tip: 'Quy định rõ ràng ngay từ đầu về kênh trao đổi chính, nơi lưu trữ tài liệu cuối cùng và cách đánh dấu trạng thái công việc.',
      },
      {
        stepNumber: 2,
        title: 'Đồng chỉnh sửa & Quản lý lịch sử',
        action: 'Làm việc cùng lúc trên tài liệu số, sử dụng tính năng bình luận (@mention) và chế độ gợi ý chỉnh sửa (Suggesting).',
        output: 'Tài liệu nhóm được hoàn thiện nhanh chóng mà không bị xung đột nội dung.',
        tip: 'Không bao giờ xóa nội dung của người khác mà không để lại bình luận giải thích lý do.',
      },
      {
        stepNumber: 3,
        title: 'Cập nhật tiến độ trên bảng Kanban',
        action: 'Di chuyển các thẻ công việc qua các cột: Cần làm (To-Do) -> Đang làm (In Progress) -> Hoàn thành (Done).',
        output: 'Bức tranh tiến độ trực quan, minh bạch cho toàn đội ngũ.',
        tip: 'Chia nhỏ đầu việc thành các nhiệm vụ có thể hoàn thành trong 1-2 ngày để dễ theo dõi.',
      },
      {
        stepNumber: 4,
        title: 'Tổng kết & Đóng gói sản phẩm cộng tác',
        action: 'Họp hồi tưởng ngắn (Retrospective) trên bảng trắng số, thu thập ý kiến cải tiến và lưu trữ tài liệu hoàn tất.',
        output: 'Sản phẩm bàn giao chuẩn mực và bài học kinh nghiệm cho dự án kế tiếp.',
        tip: 'Xuất bản phiên bản đóng băng (Frozen version) có gắn mã ngày tháng để làm bằng chứng nghiệm thu.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết mở và chỉnh sửa đồng thời trên các tài liệu trực tuyến (Google Docs/Sheets), biết dùng bình luận.',
        keySkills: ['Chỉnh sửa chung trên một tài liệu', 'Để lại bình luận và trả lời bình luận', 'Xem ai đang làm việc trên cùng tệp'],
        contextExample: 'Cùng nhóm bạn cùng soạn thảo bài thuyết trình PowerPoint trên nền tảng trực tuyến.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Sử dụng thành thạo các bảng quản lý công việc số, chế độ theo dõi thay đổi và công cụ động não trực quan.',
        keySkills: ['Tạo và quản lý thẻ công việc trên Trello/Asana', 'Sử dụng chế độ Suggestion / Track Changes', 'Sử dụng bảng trắng số (Miro/FigJam) để họp nhóm'],
        contextExample: 'Điều phối dự án thực tập gồm 5 thành viên với bảng phân công công việc trực tuyến.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Thiết kế quy trình làm việc tự động giữa các công cụ cộng tác, quản trị rủi ro xung đột dữ liệu.',
        keySkills: ['Tự động hóa thông báo qua bot (Slack/Teams)', 'Quản lý xung đột phiên bản phức tạp', 'Tối ưu hóa năng suất cộng tác cho nhóm lớn'],
        contextExample: 'Thiết lập luồng tự động: Khi tệp thiết kế hoàn thành, hệ thống tự gửi thông báo cho đội duyệt duyệt bài.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Kiến trúc hóa hệ sinh thái cộng tác số cho quy mô toàn tổ chức, xây dựng văn hóa làm việc linh hoạt (Agile).',
        keySkills: ['Lựa chọn và tích hợp nền tảng cộng tác doanh nghiệp', 'Đào tạo kỹ năng cộng tác số chuyên nghiệp', 'Đánh giá các chỉ số đo lường hiệu suất cộng tác'],
        contextExample: 'Dẫn dắt chuyển đổi mô hình làm việc từ văn phòng truyền thống sang mô hình làm việc kết hợp (Hybrid Working).',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI đóng vai trò trợ lý thư ký: Ghi chép biên bản cuộc họp tự động, trích xuất danh sách đầu việc và gợi ý ý tưởng động não.',
      ethicalChecklist: [
        'Thông báo cho tất cả thành viên nếu cuộc họp có sử dụng bot ghi âm AI',
        'Kiểm tra lại danh sách việc cần làm do AI trích xuất để tránh bỏ sót nhiệm vụ quan trọng',
        'Tôn trọng ý kiến đóng góp của từng cá nhân, không để AI áp đặt kết luận',
      ],
      riskWarning: 'Các công cụ ghi âm AI có thể ghi nhầm giọng nói hoặc hiểu sai ngữ cảnh văn hóa địa phương.',
    },
    commonPitfalls: [
      {
        mistake: 'Tải tệp về máy cá nhân chỉnh sửa rồi gửi lại qua email đè lên phiên bản của người khác.',
        consequence: 'Gây ra tình trạng loạn phiên bản, mất mát các chỉnh sửa của thành viên khác.',
        bestPractice: 'Luôn chỉnh sửa trực tiếp trên nền tảng đám mây chung để mọi thay đổi được lưu trữ thời gian thực.',
      },
      {
        mistake: 'Không phân công người chịu trách nhiệm rõ ràng cho từng đầu việc trên bảng cộng tác.',
        consequence: 'Công việc bị đình trệ vì ai cũng nghĩ người khác sẽ làm.',
        bestPractice: 'Mỗi thẻ nhiệm vụ phải có đúng 1 người chịu trách nhiệm chính (Assignee) và thời hạn chót (Deadline).',
      },
    ],
    recommendedTools: [
      { category: 'Quản lý công việc & Dự án', tools: ['Trello', 'Asana', 'Jira', 'Notion'] },
      { category: 'Bảng trắng động não & Thiết kế', tools: ['Miro', 'FigJam', 'Mural'] },
      { category: 'Tài liệu đồng chỉnh sửa', tools: ['Google Workspace', 'Microsoft 365 Online'] },
    ],
    selfChecklist: [
      'Tôi biết cách dùng tính năng @mention để tag đúng người vào bình luận.',
      'Tôi thường xuyên cập nhật trạng thái công việc của mình để nhóm nắm bắt.',
      'Tôi xem lại lịch sử phiên bản để khôi phục nội dung khi có sai sót.',
    ],
  },

  '2.5': {
    skillCode: '2.5',
    domainCode: '02',
    domainNumber: 2,
    domainTitle: 'Giao tiếp và Cộng tác số',
    title: 'Chuẩn mực văn hóa & đạo đức giao tiếp số',
    badge: 'Trạm 05 • Miền 2',
    headline: 'Tuân thủ quy tắc ứng xử trên mạng (Netiquette), thấu cảm đa văn hóa và phòng chống bắt nạt trên không gian số.',
    overview: 'Môi trường số không phải là thế giới ảo vô trách nhiệm; mỗi ký tự, biểu tượng cảm xúc hay lời bình luận đều để lại dấu chân số và tác động trực tiếp đến tâm lý con người. Năng lực này định hình phong cách ứng xử văn minh, thấu cảm và đúng mực.',
    targetOutcome: 'Ứng xử có văn hóa, tôn trọng sự khác biệt, phòng ngừa bạo lực mạng và xây dựng môi trường mạng tích cực.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Tự điều chỉnh cảm xúc trước khi bấm gửi',
        action: 'Tạm dừng 5 giây khi tức giận; không viết email hoặc bình luận công kích trong trạng thái kích động.',
        output: 'Phản ứng tỉnh táo, tránh các tranh cãi độc hại không cần thiết.',
        tip: 'Quy tắc: Điều gì bạn không dám nói thẳng mặt người khác ngoài đời thực thì đừng bao giờ gõ nó lên mạng.',
      },
      {
        stepNumber: 2,
        title: 'Tôn trọng định dạng & Thời gian của người khác',
        action: 'Tránh viết hoa toàn bộ (CAPS LOCK - tương đương với việc la hét); hạn chế gửi tin nhắn công việc ngoài giờ hành chính nếu không cấp bách.',
        output: 'Thông điệp lịch sự, tôn trọng ranh giới cuộc sống riêng tư của đối phương.',
        tip: 'Sử dụng tính năng lên lịch gửi thư (Schedule Send) để thư được gửi vào đầu giờ làm việc hôm sau.',
      },
      {
        stepNumber: 3,
        title: 'Thấu cảm đa dạng & Thích ứng văn hóa',
        action: 'Lựa chọn từ ngữ trung tính, tôn trọng sự khác biệt về vùng miền, giới tính, tín ngưỡng và phong tục tập quán.',
        output: 'Môi trường giao tiếp bao trùm, hòa đồng và thân thiện.',
        tip: 'Chú ý biểu tượng cảm xúc (Emoji) có thể mang ý nghĩa khác nhau ở từng nền văn hóa.',
      },
      {
        stepNumber: 4,
        title: 'Lên tiếng chống lại hành vi bạo lực mạng',
        action: 'Không chia sẻ, không hùa theo các bài đăng bôi nhọ danh phẩm; báo cáo (Report) các nội dung độc hại.',
        output: 'Bảo vệ nạn nhân và góp phần làm sạch không gian mạng chung.',
        tip: 'Bấm nút "Báo cáo vi phạm" thay vì lao vào tranh cãi với những kẻ cố tình khiêu khích (Troll mạng).',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết các quy tắc lịch sự tối thiểu: Không viết hoa toàn bộ, không spam tin nhắn, chào hỏi lịch sự.',
        keySkills: ['Sử dụng biểu tượng cảm xúc phù hợp ngữ cảnh', 'Biết lời chào và cảm ơn trong tin nhắn', 'Nhận diện các hành vi bắt nạt trực tuyến cơ bản'],
        contextExample: 'Nhắn tin hỏi thầy cô hoặc đồng nghiệp với lời chào và thái độ tôn trọng.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Thích ứng phong cách giao tiếp cho từng cộng đồng trực tuyến; xử lý bất đồng quan điểm một cách xây dựng.',
        keySkills: ['Điều chỉnh giọng điệu (Tone of Voice) cho từng diễn đàn', 'Phản biện dựa trên lập luận thay vì công kích cá nhân', 'Bảo vệ ranh giới số cá nhân và tôn trọng người khác'],
        contextExample: 'Tham gia thảo luận chuyên môn sôi nổi trên diễn đàn mà vẫn giữ hòa khí với các ý kiến trái chiều.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Xây dựng và điều phối cộng đồng trực tuyến lành mạnh, hòa giải xung đột văn hóa số trong nhóm.',
        keySkills: ['Soạn thảo nội quy nhóm trao đổi (Community Guidelines)', 'Điều hướng các cuộc tranh luận độc hại', 'Hỗ trợ các nạn nhân bị bạo lực trên mạng'],
        contextExample: 'Làm quản trị viên (Admin) một diễn đàn học tập 10,000 thành viên, duy trì thảo luận tích cực.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Nghiên cứu các hiện tượng xã hội số, xây dựng chính sách văn hóa số cho doanh nghiệp và tổ chức.',
        keySkills: ['Phát triển chiến lược văn hóa ứng xử số', 'Tư vấn xử lý khủng hoảng truyền thông mạng', 'Bảo vệ sức khỏe tâm lý người dùng trong môi trường số'],
        contextExample: 'Xây dựng bộ quy tắc ứng xử trên mạng xã hội cho toàn thể cán bộ công nhân viên tập đoàn.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ phát hiện các từ ngữ mang tính xúc phạm, thiên kiến hoặc giọng điệu quá gay gắt trong văn bản.',
      ethicalChecklist: [
        'Không sử dụng các công cụ AI để tạo nội dung châm chọc, bôi nhọ người khác',
        'Kiểm tra xem câu từ của AI có mang định kiến giới tính hoặc xã hội hay không',
        'Duy trì tinh thần thấu cảm con người, điều mà máy móc không thể thay thế',
      ],
      riskWarning: 'Mô hình AI có thể vô tình hấp thụ các định kiến độc hại từ dữ liệu internet; người dùng cần có bộ lọc đạo đức riêng.',
    },
    commonPitfalls: [
      {
        mistake: 'Sử dụng tính năng "Trả lời tất cả" (Reply All) trong email cho những việc riêng tư hoặc không liên quan đến mọi người.',
        consequence: 'Làm phiền hàng chục người, gây tắc nghẽn thông tin trong tổ chức.',
        bestPractice: 'Chỉ chọn "Reply All" khi thông tin thực sự cần thiết cho tất cả những người trong danh sách Cc.',
      },
      {
        mistake: 'Chụp ảnh màn hình tin nhắn riêng tư đem ra bêu riếu trên mạng xã hội công cộng.',
        consequence: 'Vi phạm quyền riêng tư nghiêm trọng và hủy hoại niềm tin giữa người với người.',
        bestPractice: 'Giải quyết mâu thuẫn qua kênh riêng trực tiếp thay vì mang lên diễn đàn công cộng.',
      },
    ],
    recommendedTools: [
      { category: 'Hỗ trợ rà soát giọng điệu văn bản', tools: ['Grammarly Tone Detector', 'Bộ lọc từ khóa tiêu cực'] },
      { category: 'Báo cáo vi phạm', tools: ['Cổng phản ánh vi phạm an toàn thông tin mạng', 'Tính năng Report của mạng xã hội'] },
    ],
    selfChecklist: [
      'Tôi không viết hoa toàn bộ câu chữ khi nhắn tin cho người khác.',
      'Tôi luôn suy nghĩ kỹ về hậu quả trước khi bấm đăng một dòng trạng thái công khai.',
      'Tôi chủ động bấm báo cáo khi thấy các hành vi bạo lực, bắt nạt trực tuyến.',
    ],
  },

  '2.6': {
    skillCode: '2.6',
    domainCode: '02',
    domainNumber: 2,
    domainTitle: 'Giao tiếp và Cộng tác số',
    title: 'Quản lý danh tính và uy tín số',
    badge: 'Trạm 06 • Miền 2',
    headline: 'Xây dựng hồ sơ số chuyên nghiệp, kiểm soát dấu chân kỹ thuật số và bảo vệ uy tín cá nhân trên không gian mạng.',
    overview: 'Mỗi cú nhấp chuột, tìm kiếm hay bình luận đều góp phần định hình "dấu chân số" (Digital Footprint) của bạn. Nhà tuyển dụng, đối tác và khách hàng ngày nay đều tra cứu hồ sơ số trước khi hợp tác. Quản lý danh tính số là nghệ thuật xây dựng thương hiệu cá nhân uy tín và kiểm soát quyền riêng tư.',
    targetOutcome: 'Kiểm soát hình ảnh và danh tính trực tuyến của bản thân, tạo dựng uy tín số phục vụ sự nghiệp và học tập lâu dài.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Tự tra cứu dấu chân số bản thân',
        action: 'Tìm kiếm tên của chính mình trên Google (ở chế độ ẩn danh) để xem những hình ảnh, bài viết và thông tin nào đang công khai.',
        output: 'Bức tranh toàn cảnh về hình ảnh của bạn trong mắt công chúng.',
        tip: 'Nếu thấy các bài đăng cũ nhảm nhí hoặc thông tin cá nhân nhạy cảm, hãy tiến hành ẩn hoặc xóa ngay.',
      },
      {
        stepNumber: 2,
        title: 'Tách biệt danh tính công việc và đời tư',
        action: 'Sử dụng tài khoản email và hồ sơ mạng xã hội riêng biệt cho công việc chuyên nghiệp (LinkedIn) và giao lưu bạn bè (Facebook/Instagram).',
        output: 'Ranh giới an toàn, không để đời sống riêng tư ảnh hưởng đến sự nghiệp.',
        tip: 'Khóa chế độ xem công khai trên các trang cá nhân đời tư; chỉ chia sẻ cho bạn bè thân thiết.',
      },
      {
        stepNumber: 3,
        title: 'Xây dựng hồ sơ chuyên môn nhất quán',
        action: 'Cập nhật ảnh đại diện chuyên nghiệp, ghi rõ học vấn, kỹ năng đã được chứng nhận và các dự án tiêu biểu.',
        output: 'Hồ sơ năng lực số thu hút nhà tuyển dụng và đối tác.',
        tip: 'Liên kết các chứng chỉ năng lực số NEXA đã đạt được vào mục Chứng nhận trên LinkedIn.',
      },
      {
        stepNumber: 4,
        title: 'Bảo vệ uy tín & Phòng ngừa mạo danh',
        action: 'Kích hoạt xác thực 2 lớp cho các tài khoản mạng xã hội và thông báo ngay khi có kẻ xấu tạo tài khoản giả mạo.',
        output: 'Danh tính được bảo vệ kiên cố, ngăn chặn kẻ xấu lợi dụng lừa đảo.',
        tip: 'Định kỳ rà soát các ứng dụng bên thứ ba đang được cấp quyền truy cập vào hồ sơ mạng xã hội của bạn.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết tạo tài khoản cá nhân, chọn ảnh đại diện phù hợp và bảo vệ mật khẩu đăng nhập.',
        keySkills: ['Tạo hồ sơ mạng xã hội cơ bản', 'Chọn mật khẩu mạnh cho tài khoản', 'Biết cách đăng xuất khỏi thiết bị lạ'],
        contextExample: 'Thiết lập tài khoản email học tập chính thức với tên đầy đủ, không dùng biệt danh thiếu nghiêm túc.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Quản lý cài đặt riêng tư của các trang cá nhân, xây dựng hồ sơ nghề nghiệp trực tuyến bài bản.',
        keySkills: ['Điều chỉnh cài đặt quyền riêng tư bài đăng', 'Xây dựng hồ sơ LinkedIn chuyên nghiệp', 'Kiểm soát danh sách bạn bè và người theo dõi'],
        contextExample: 'Tạo CV điện tử trực tuyến và kết nối mạng lưới nghề nghiệp cùng chuyên ngành trên LinkedIn.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Chiến lược phát triển thương hiệu cá nhân số, chia sẻ kiến thức chuyên môn tạo ảnh hưởng tích cực.',
        keySkills: ['Sản xuất nội dung chuyên môn định kỳ', 'Quản trị rủi ro phát ngôn trên mạng', 'Xử lý các tình huống tấn công làm tổn hại uy tín số'],
        contextExample: 'Viết các bài phân tích chuyên sâu về công nghệ được cộng đồng chuyên ngành ghi nhận và chia sẻ rộng rãi.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Hoạch định chiến lược danh tính số cho lãnh đạo tổ chức, quản trị danh tiếng số quy mô tập đoàn.',
        keySkills: ['Quản trị uy tín số thương hiệu lớn', 'Xử lý khủng hoảng truyền thông danh tiếng', 'Thiết lập tiêu chuẩn bảo vệ danh tính cán bộ chủ chốt'],
        contextExample: 'Bảo vệ danh tiếng kỹ thuật số của tổ chức trước các chiến dịch tung tin giả mạo bôi nhọ có chủ đích.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ tối ưu hóa văn phong CV, tóm tắt tiểu sử bản thân và gợi ý từ khóa chuyên ngành cho hồ sơ.',
      ethicalChecklist: [
        'Không dùng ảnh đại diện do AI tạo sinh giả mạo thành tích hoặc ngoại hình phi thực tế trong bối cảnh pháp lý',
        'Trung thực về các kỹ năng cá nhân, không khai man năng lực do AI gán ghép',
        'Ý thức rằng hình ảnh cá nhân số đại diện cho con người thật của bạn',
      ],
      riskWarning: 'Kẻ xấu có thể dùng hình ảnh và giọng nói công khai của bạn để huấn luyện Deepfake; hãy cẩn trọng với các video quá riêng tư.',
    },
    commonPitfalls: [
      {
        mistake: 'Sử dụng địa chỉ email thiếu nghiêm túc (ví dụ: boy_sieu_quay9x@gmail.com) để ứng tuyển công việc.',
        consequence: 'Mất điểm uy tín ngay từ vòng hồ sơ ban đầu trong mắt nhà tuyển dụng.',
        bestPractice: 'Dùng cấu trúc email chuyên nghiệp: [ho.ten]@[gmail.com] hoặc email trường/công ty cấp.',
      },
      {
        mistake: 'Đăng tải các thông tin nhạy cảm (vé máy bay có mã vạch, số căn cước, địa chỉ nhà) lên mạng xã hội.',
        consequence: 'Tạo cơ hội cho tội phạm mạng đánh cắp danh tính để làm giả hồ sơ vay tiền.',
        bestPractice: 'Tuyệt đối che mờ hoặc không bao giờ đăng giấy tờ tùy thân lên mạng.',
      },
    ],
    recommendedTools: [
      { category: 'Hồ sơ nghề nghiệp trực tuyến', tools: ['LinkedIn', 'GitHub (cho dân công nghệ)', 'Behance (cho dân sáng tạo)'] },
      { category: 'Kiểm tra dấu chân số & Rò rỉ', tools: ['Have I Been Pwned', 'Google Alerts tên bản thân'] },
    ],
    selfChecklist: [
      'Tôi đã bật bảo mật 2 lớp (2FA) cho tất cả tài khoản mạng xã hội chính.',
      'Hồ sơ nghề nghiệp của tôi đã cập nhật ảnh đại diện chuyên nghiệp và học vấn chuẩn xác.',
      'Tôi không chia sẻ hình ảnh giấy tờ tùy thân có lộ số định danh lên mạng.',
    ],
  },

  // =========================================================================
  // MIỀN 3: SÁNG TẠO NỘI DUNG SỐ VÀ AI
  // =========================================================================
  '3.1': {
    skillCode: '3.1',
    domainCode: '03',
    domainNumber: 3,
    domainTitle: 'Sáng tạo Nội dung số và AI',
    title: 'Phát triển nội dung số',
    badge: 'Trạm 01 • Miền 3',
    headline: 'Làm chủ công nghệ sáng tạo đa phương tiện, kết hợp AI có đạo đức và thiết kế sản phẩm số chuẩn mực.',
    overview: 'Năng lực tạo lập nội dung số không dừng lại ở việc gõ chữ trên Word hay chèn ảnh vào slide. Trong thời đại số, người học cần làm chủ các nguyên tắc thị giác (Hierarchy, Contrast, Alignment), hiểu rõ các định dạng đa phương tiện (văn bản, biểu đồ, âm thanh, video ngắn) và biết cách hợp tác cùng các mô hình AI tạo sinh một cách có trách nhiệm.',
    targetOutcome: 'Tạo lập, biên tập và xuất bản các sản phẩm nội dung số đa phương tiện đạt chuẩn thẩm mỹ, đúng cấu trúc và truyền tải thông điệp thuyết phục.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Xác định mục tiêu & Đối tượng tiếp nhận',
        action: 'Xác định thông điệp cốt lõi, người xem là ai và kênh phân phối chính (báo cáo in, thuyết trình trên màn chiếu hay bài đăng mạng xã hội).',
        output: 'Đề cương nội dung và bảng phong cách (Moodboard/Style Guide).',
        tip: 'Sản phẩm cho giới trẻ cần trực quan, ngắn gọn; sản phẩm báo cáo lãnh đạo cần số liệu chặt chẽ và biểu đồ rõ ràng.',
      },
      {
        stepNumber: 2,
        title: 'Lựa chọn công cụ & Định dạng phù hợp',
        action: 'Chọn phần mềm chuyên dụng (Canva, Figma, Docs, Premiere) và định dạng chuẩn (PDF vector, MP4 H.264, PNG không nén).',
        output: 'Khung bản mẫu (Wireframe / Template) sẵn sàng dàn trang.',
        tip: 'Biểu đồ nên dùng SVG hoặc ảnh vector để không bị vỡ hạt khi phóng to trên màn hình độ phân giải cao.',
      },
      {
        stepNumber: 3,
        title: 'Ứng dụng nguyên tắc thị giác & Trợ lực AI',
        action: 'Áp dụng phân cấp thông tin (Hierarchy), tạo khoảng trắng (Whitespace), chọn bảng màu tương phản và dùng AI tạo sinh phác thảo ý tưởng.',
        output: 'Bản thảo hoàn thiện đầu tiên (First Draft).',
        tip: 'Quy tắc 60-30-10: 60% màu nền trung tính, 30% màu phụ trợ, 10% màu nhấn cho nút hành động/số liệu quan trọng.',
      },
      {
        stepNumber: 4,
        title: 'Rà soát khả năng tiếp cận & Xuất bản',
        action: 'Kiểm tra độ tương phản chữ (chuẩn WCAG), thêm văn bản thay thế (Alt Text) cho hình ảnh và tối ưu hóa dung lượng trước khi chia sẻ.',
        output: 'Tệp ấn phẩm số thành phẩm đạt chuẩn phát hành.',
        tip: 'Nén tệp bằng các công cụ nén không suy hao trước khi tải lên mạng để giảm thời gian tải trang.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Tạo và chỉnh sửa tài liệu văn bản, bảng tính đơn giản và trình chiếu cơ bản bằng các mẫu có sẵn.',
        keySkills: ['Định dạng phông chữ, đoạn văn chuẩn mực', 'Chèn và căn chỉnh kích thước hình ảnh', 'Sử dụng các mẫu thiết kế sẵn trên Canva/Word'],
        contextExample: 'Soạn thảo một bài báo cáo thu hoạch môn học có bìa, mục lục tự động và căn lề chuẩn.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Biết kết hợp văn bản, biểu đồ dữ liệu và đồ họa; sử dụng AI tạo sinh để hỗ trợ phác thảo ý tưởng nội dung.',
        keySkills: ['Thiết kế biểu đồ dữ liệu chuẩn xác (Donut, Bar, Line)', 'Viết prompt hướng dẫn AI tạo dàn ý và hình minh họa', 'Biên tập video ngắn cơ bản kèm phụ đề'],
        contextExample: 'Thiết kế bộ infographic trực quan hóa dữ liệu khảo sát và làm một video tóm tắt 60 giây giới thiệu dự án.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Sáng tạo các sản phẩm truyền thông số phức hợp, xây dựng hệ thống nhận diện thương hiệu nội dung nhất quán.',
        keySkills: ['Xây dựng Design System (phông chữ, mã màu, khoảng cách)', 'Kết hợp chuỗi công cụ AI nâng cao để tự động hóa sản xuất', 'Đảm bảo khả năng tiếp cận (Accessibility) cho người khiếm thị/khiếm thính'],
        contextExample: 'Phát triển toàn bộ ấn phẩm số cho một chiến dịch truyền thông đa kênh gồm slide, poster, newsletter và video clip.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Chủ trì chiến lược nội dung số quy mô lớn, nghiên cứu và ứng dụng các công nghệ sáng tạo tương tác mới (AR/VR/AI Agent).',
        keySkills: ['Định hình phong cách nội dung tổ chức', 'Giám sát tính đạo đức và pháp lý của kho nội dung số', 'Đổi mới quy trình sáng tạo số bằng công nghệ tiên tiến'],
        contextExample: 'Lãnh đạo đội ngũ sáng tạo nội dung của tổ chức, thiết lập chuẩn mực truyền thông số đổi mới sáng tạo.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI là người đồng sáng tạo (Co-pilot): Hỗ trợ động não ý tưởng, tạo bản nháp đầu tiên và tối ưu hóa từ ngữ.',
      ethicalChecklist: [
        'Con người luôn là người chịu trách nhiệm cuối cùng (Human-in-the-loop)',
        'Minh bạch về việc sử dụng AI trong các tác phẩm dự thi hoặc học thuật',
        'Không dùng AI để tạo nội dung độc hại, khiêu dâm hoặc lừa dối công chúng',
      ],
      riskWarning: 'AI không có trải nghiệm thực tế; nếu không có sự can thiệp của con người, nội dung tạo ra sẽ thiếu cảm xúc và tính nguyên bản.',
    },
    commonPitfalls: [
      {
        mistake: 'Sử dụng quá nhiều phông chữ (hơn 3 phông) và màu sắc lòe loẹt trong một tài liệu.',
        consequence: 'Làm người xem rối mắt, thiếu tính chuyên nghiệp và giảm khả năng tiếp thu thông tin.',
        bestPractice: 'Quy tắc tối giản: Tối đa 2 họ phông chữ (1 cho Tiêu đề, 1 cho Nội dung) và bám sát bảng màu thương hiệu.',
      },
      {
        mistake: 'Sao chép nguyên si toàn bộ đoạn văn do ChatGPT viết và coi đó là bài của mình.',
        consequence: 'Nội dung sáo rỗng, dễ bị phần mềm phát hiện AI chấm điểm 0 vì đạo văn.',
        bestPractice: 'Dùng AI để lấy dàn ý, sau đó tự viết lại bằng ngôn ngữ và dẫn chứng trải nghiệm thực tế của chính bạn.',
      },
    ],
    recommendedTools: [
      { category: 'Thiết kế đồ họa & Giao diện', tools: ['Canva', 'Figma', 'Adobe Express'] },
      { category: 'Trợ lý AI tạo sinh ý tưởng', tools: ['Gemini', 'Claude', 'ChatGPT'] },
      { category: 'Biên tập video & Đa phương tiện', tools: ['CapCut', 'DaVinci Resolve', 'Adobe Premiere'] },
    ],
    selfChecklist: [
      'Bố cục tài liệu của tôi có khoảng trắng thoáng mắt, không bị nhồi nhét chữ.',
      'Màu chữ tương phản rõ rệt với màu nền, dễ đọc trên cả máy tính lẫn điện thoại.',
      'Tôi đã tự rà soát và chỉnh sửa lại toàn bộ câu từ trước khi xuất bản thành phẩm.',
    ],
  },

  '3.2': {
    skillCode: '3.2',
    domainCode: '03',
    domainNumber: 3,
    domainTitle: 'Sáng tạo Nội dung số và AI',
    title: 'Tích hợp và tái cấu trúc nội dung số',
    badge: 'Trạm 02 • Miền 3',
    headline: 'Biên tập, kết hợp các tài nguyên số có sẵn và cộng tác cùng công cụ AI để tạo ra giá trị mới độc đáo.',
    overview: 'Không phải lúc nào chúng ta cũng bắt đầu sáng tạo từ con số không. Năng lực tích hợp và tái cấu trúc (Remix & Re-elaborate) là kỹ năng biết chọn lọc các mảnh ghép dữ liệu từ nhiều nguồn khác nhau, nhào nặn và cải biến để tạo ra một tác phẩm mới mẻ, có chiều sâu và giải quyết trúng nhu cầu thực tế.',
    targetOutcome: 'Tái cấu trúc và kết hợp các định dạng dữ liệu rời rạc thành một sản phẩm số hoàn chỉnh, mạch lạc và mang dấu ấn riêng.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Thu thập & Phân loại tài nguyên đầu vào',
        action: 'Tập hợp các tài nguyên có sẵn (số liệu bảng tính, văn bản nghiên cứu, hình ảnh chụp thực địa, biểu đồ) vào một kho tạm.',
        output: 'Kho dữ liệu thô đã được thẩm định chất lượng.',
        tip: 'Phân biệt rõ nội dung nào có thể chỉnh sửa được (vector, text thô) và nội dung đóng băng (ảnh tĩnh, video đã xuất).',
      },
      {
        stepNumber: 2,
        title: 'Chuyển hóa cấu trúc & Đồng bộ phong cách',
        action: 'Chuyển đổi số liệu dạng bảng sang biểu đồ trực quan; điều chỉnh giọng văn đồng nhất giữa các tác giả khác nhau.',
        output: 'Các mảnh ghép được hài hòa về mặt định dạng và thẩm mỹ.',
        tip: 'Sử dụng AI để chuẩn hóa văn phong toàn bộ tài liệu về cùng một tông giọng chuyên nghiệp.',
      },
      {
        stepNumber: 3,
        title: 'Tích hợp đa phương tiện & Thổi hồn mới',
        action: 'Ghép nối văn bản giải thích đi kèm biểu đồ minh họa; chèn trích dẫn đắt giá và làm nổi bật thông điệp chính.',
        output: 'Tác phẩm mới có giá trị gia tăng rõ rệt so với các nguồn thô ban đầu.',
        tip: 'Đảm bảo mỗi biểu đồ đều có tiêu đề, chú thích đơn vị đo và nguồn dữ liệu ở góc dưới.',
      },
      {
        stepNumber: 4,
        title: 'Kiểm tra tính liền mạch & Toàn vẹn thông tin',
        action: 'Đọc soát tổng thể để đảm bảo việc ghép nối không làm sai lệch ý nghĩa gốc của dữ liệu ban đầu.',
        output: 'Sản phẩm tích hợp hoàn hảo, sẵn sàng phục vụ trình chiếu hoặc in ấn.',
        tip: 'Nhờ một người khác đọc thử để kiểm tra xem dòng chảy thông tin có bị đứt gãy giữa các phần hay không.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết sao chép, cắt ghép các đoạn văn bản và hình ảnh từ nguồn khác vào tài liệu của mình có chọn lọc.',
        keySkills: ['Sao chép văn bản giữ nguyên hoặc bỏ định dạng', 'Chèn ảnh chụp vào văn bản có chú thích', 'Ghép các trang tệp PDF lại với nhau'],
        contextExample: 'Lấy số liệu từ trang web thống kê chèn vào slide thuyết trình của nhóm.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Biết biến đổi định dạng dữ liệu (bảng tính sang biểu đồ), kết hợp các nguồn thông tin để tạo báo cáo tổng hợp.',
        keySkills: ['Chuyển dữ liệu Excel thành biểu đồ tương tác', 'Viết bài tổng luận từ 3-4 bài báo nghiên cứu', 'Sử dụng AI để tóm tắt và nối mạch văn'],
        contextExample: 'Tổng hợp số liệu doanh thu từ 5 chi nhánh thành một bảng dashboard báo cáo ngắn gọn cho quản lý.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Tái cấu trúc các kho tài liệu phức tạp, xây dựng nội dung tương tác đa nền tảng từ nội dung truyền thống.',
        keySkills: ['Chuyển sách hướng dẫn dạng PDF sang khóa học e-learning tương tác', 'Xây dựng kịch bản video từ báo cáo khoa học dày cộp', 'Thiết kế luồng trải nghiệm nội dung liền mạch'],
        contextExample: 'Chuyển hóa toàn bộ quy trình vận hành giấy tờ của công ty thành cẩm nang điện tử tra cứu nhanh trên Notion.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Dẫn dắt các sáng kiến tái sử dụng tri thức số quy mô lớn, thiết kế kiến trúc thông tin cho hệ thống quản trị tri thức.',
        keySkills: ['Xây dựng kho tri thức số (Knowledge Base) doanh nghiệp', 'Tối ưu hóa vòng đời tái sử dụng nội dung số', 'Đổi mới phương pháp trực quan hóa dữ liệu lớn'],
        contextExample: 'Xây dựng hệ thống quản trị tri thức doanh nghiệp tự động phân loại và gợi ý bài học kinh nghiệm từ các dự án cũ.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI là trợ thủ đắc lực trong việc tóm tắt, tổng hợp so sánh giữa các tài liệu và chuyển đổi định dạng dữ liệu.',
      ethicalChecklist: [
        'Không xuyên tạc ý nghĩa của tác giả gốc khi biên tập rút gọn nội dung',
        'Ghi chú minh bạch nguồn gốc của các tài nguyên thành phần được tích hợp',
        'Kiểm tra tính nhất quán logic khi ghép các câu trả lời của AI vào bài viết',
      ],
      riskWarning: 'Khi yêu cầu AI tổng hợp nhiều tài liệu, AI có thể bỏ sót các tiểu tiết phản biện quan trọng; hãy tự đọc kỹ lại.',
    },
    commonPitfalls: [
      {
        mistake: 'Cắt dán nguyên khối văn bản từ nhiều trang web với phông chữ, cỡ chữ và màu nền loang lổ khác nhau.',
        consequence: 'Tài liệu chắp vá, thể hiện sự cẩu thả và thiếu tôn trọng người đọc.',
        bestPractice: 'Khi dán văn bản từ web, luôn dùng phím tắt Ctrl+Shift+V (Dán không định dạng) rồi áp dụng style thống nhất.',
      },
      {
        mistake: 'Lấy biểu đồ của người khác dán vào bài nhưng không hiểu ý nghĩa số liệu.',
        consequence: 'Bị lúng túng khi được hỏi và mất uy tín về tính xác thực.',
        bestPractice: 'Tự vẽ lại biểu đồ dựa trên số liệu thô để hiểu sâu và đồng bộ thẩm mỹ với toàn bộ ấn phẩm.',
      },
    ],
    recommendedTools: [
      { category: 'Xử lý & Ghép tệp số', tools: ['SmallPDF', 'iLovePDF', 'Adobe Acrobat DC'] },
      { category: 'Trực quan hóa & Dashboard', tools: ['Google Looker Studio', 'PowerBI', 'Tableau Public'] },
      { category: 'Ghi chú & Tích hợp tri thức', tools: ['Notion', 'Obsidian', 'Coda'] },
    ],
    selfChecklist: [
      'Toàn bộ tài liệu của tôi có cùng một phông chữ và cỡ chữ tiêu chuẩn cho từng cấp đề mục.',
      'Tôi không làm sai lệch ý kiến gốc của các tác giả khi biên tập lại nội dung.',
      'Tôi luôn dùng phím tắt Paste Without Formatting để tránh lỗi vỡ định dạng trang.',
    ],
  },

  '3.3': {
    skillCode: '3.3',
    domainCode: '03',
    domainNumber: 3,
    domainTitle: 'Sáng tạo Nội dung số và AI',
    title: 'Bản quyền, sở hữu trí tuệ và giấy phép số',
    badge: 'Trạm 03 • Miền 3',
    headline: 'Hiểu và áp dụng quy định về bản quyền số, giấy phép Creative Commons và đạo đức sở hữu trí tuệ thời đại AI.',
    overview: 'Mọi hình ảnh, bài viết, bản nhạc tải về trên Internet đều có chủ sở hữu hợp pháp. Năng lực này giúp người học tự tin sáng tạo mà không lo vi phạm luật sở hữu trí tuệ, hiểu rõ các loại giấy phép mở (CC) và nắm vững các tranh chấp bản quyền mới nổi liên quan đến dữ liệu huấn luyện AI.',
    targetOutcome: 'Tôn trọng bản quyền tác giả, sử dụng hợp pháp các tài nguyên số và bảo vệ quyền sở hữu đối với sản phẩm tự làm ra.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Kiểm tra trạng thái bản quyền tài nguyên',
        action: 'Trước khi tải ảnh/nhạc/tài liệu, tìm kiếm thông tin giấy phép (Copyright, All rights reserved hay Creative Commons).',
        output: 'Xác định phạm vi quyền được phép sử dụng.',
        tip: 'Nếu không thấy ghi rõ giấy phép miễn phí, mặc định tài nguyên đó được bảo hộ toàn quyền; không được tự ý dùng cho thương mại.',
      },
      {
        stepNumber: 2,
        title: 'Đọc hiểu các ký hiệu Creative Commons (CC)',
        action: 'Giải mã 4 điều kiện cốt lõi: BY (Ghi công), NC (Phi thương mại), ND (Không phái sinh), SA (Chia sẻ tương tự).',
        output: 'Tuân thủ đúng điều kiện giấy phép đi kèm tác phẩm.',
        tip: 'Ảnh có ký hiệu CC-BY cho phép bạn làm mọi thứ, kể cả bán hàng, miễn là bạn ghi rõ tên tác giả.',
      },
      {
        stepNumber: 3,
        title: 'Thực hiện ghi công chuẩn mực (Attribution)',
        action: 'Đặt chú thích theo công thức TASL: Title (Tiêu đề tác phẩm) + Author (Tác giả) + Source (Nguồn liên kết) + License (Loại giấy phép).',
        output: 'Dòng ghi công hợp pháp, minh bạch.',
        tip: 'Ví dụ: "Ảnh: Thung lũng Mường Hoa của Nguyen Van A, nguồn Flickr, theo giấy phép CC BY 2.0".',
      },
      {
        stepNumber: 4,
        title: 'Đăng ký bảo hộ sản phẩm tự sáng tạo',
        action: 'Lựa chọn gắn giấy phép CC phù hợp cho tác phẩm của chính mình trước khi đăng tải lên mạng.',
        output: 'Bảo vệ quyền lợi tác giả và cho phép cộng đồng tái sử dụng đúng giới hạn.',
        tip: 'Sử dụng công cụ chọn giấy phép miễn phí tại creativecommons.org để tạo mã nhúng giấy phép.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Hiểu rằng không được tự tiện lấy ảnh, bài viết của người khác nhận làm của mình; biết tìm ảnh miễn phí bản quyền.',
        keySkills: ['Sử dụng bộ lọc giấy phép Creative Commons trên Google Images', 'Tìm ảnh miễn phí trên Unsplash/Pexels', 'Biết ghi nguồn tác giả ở mức đơn giản'],
        contextExample: 'Lấy ảnh miễn phí trên Unsplash để chèn vào bài thuyết trình và ghi tên nhiếp ảnh gia.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Áp dụng chính xác các loại giấy phép Creative Commons, phân biệt ranh giới giữa sử dụng hợp lý (Fair Use) và vi phạm bản quyền.',
        keySkills: ['Phân biệt các tổ hợp giấy phép CC (CC BY-NC, CC BY-SA)', 'Ghi công đầy đủ theo chuẩn TASL', 'Hiểu quy định về sử dụng tác phẩm cho mục đích học tập phi thương mại'],
        contextExample: 'Xuất bản video học tập có chèn đoạn nhạc nền có giấy phép CC-BY và ghi công đầy đủ ở phần mô tả video.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Giải quyết các vấn đề bản quyền phức tạp trong sản phẩm số đa phương tiện, tư vấn pháp lý bản quyền số cho nhóm.',
        keySkills: ['Kiểm tra bản quyền kho tài nguyên đa phương tiện dự án', 'Hiểu quy chế bản quyền của các sản phẩm tạo sinh bởi AI', 'Xử lý các thông báo vi phạm bản quyền (DMCA Takedown)'],
        contextExample: 'Rà soát toàn bộ kho hình ảnh, âm thanh của website công ty để đảm bảo không có bất kỳ vi phạm bản quyền nào.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Hoạch định chiến lược quản trị tài sản trí tuệ số cho tổ chức, tham gia xây dựng chính sách bản quyền mở.',
        keySkills: ['Xây dựng chính sách sở hữu trí tuệ doanh nghiệp', 'Đăng ký bản quyền phần mềm và nhãn hiệu số', 'Giải quyết tranh chấp sở hữu trí tuệ trong kỷ nguyên AI'],
        contextExample: 'Xây dựng quy chế sở hữu trí tuệ về việc nhân viên sử dụng các công cụ AI tạo sinh trong quá trình nghiên cứu và phát triển sản phẩm.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ rà soát các điều khoản giấy phép phức tạp và soạn thảo văn bản ghi công tác giả chuẩn xác.',
      ethicalChecklist: [
        'Không yêu cầu AI nhại lại phong cách riêng biệt của một họa sĩ còn sống nhằm né tránh tiền bản quyền',
        'Ý thức được rằng các tác phẩm do AI tạo sinh thuần túy hiện nay tại nhiều quốc gia không được cấp bản quyền tự động',
        'Tôn trọng công sức của các nghệ sĩ và người sáng tạo nội dung truyền thống',
      ],
      riskWarning: 'Sử dụng hình ảnh tạo ra bởi AI có chứa logo, nhân vật hoạt hình có bản quyền (Disney, Marvel...) vẫn có thể bị kiện vi phạm nhãn hiệu.',
    },
    commonPitfalls: [
      {
        mistake: 'Nghĩ rằng ghi "Nguồn: Sưu tầm" hoặc "Nguồn: Internet" là đã đủ để không bị kiện bản quyền.',
        consequence: 'Hoàn toàn không có giá trị pháp lý; vẫn bị phạt tiền và buộc gỡ bỏ tác phẩm vi phạm.',
        bestPractice: 'Phải ghi rõ tên tác giả cụ thể hoặc chỉ sử dụng ảnh từ các kho cung cấp giấy phép mở rõ ràng.',
      },
      {
        mistake: 'Tải các video, bản nhạc có bản quyền về lồng vào video của mình rồi đăng lên YouTube/TikTok.',
        consequence: 'Video bị tắt tiếng, bị đánh gậy bản quyền hoặc kênh bị khóa vĩnh viễn.',
        bestPractice: 'Sử dụng kho nhạc miễn phí của YouTube Audio Library hoặc TikTok Commercial Music Library.',
      },
    ],
    recommendedTools: [
      { category: 'Kho ảnh & Video miễn phí bản quyền', tools: ['Unsplash', 'Pexels', 'Pixabay'] },
      { category: 'Kho âm thanh & Hiệu ứng miễn phí', tools: ['YouTube Audio Library', 'FreeSound', 'Bensound'] },
      { category: 'Tạo giấy phép mở', tools: ['Creative Commons License Chooser'] },
    ],
    selfChecklist: [
      'Tôi luôn kiểm tra giấy phép sử dụng trước khi tải tài nguyên trên mạng về dùng.',
      'Tôi không bao giờ ghi cụm từ vô nghĩa "Nguồn: Internet" trong bài làm của mình.',
      'Tôi biết cách tìm các bản nhạc được phép sử dụng cho mục đích thương mại.',
    ],
  },

  '3.4': {
    skillCode: '3.4',
    domainCode: '03',
    domainNumber: 3,
    domainTitle: 'Sáng tạo Nội dung số và AI',
    title: 'Tư duy tính toán và giải thuật số',
    badge: 'Trạm 04 • Miền 3',
    headline: 'Phát triển chuỗi lệnh thuật toán, tư duy giải quyết vấn đề bằng logic máy tính và làm chủ lập trình tự động hóa.',
    overview: 'Tư duy tính toán (Computational Thinking) không dành riêng cho kỹ sư phần mềm. Đó là phương pháp tư duy giải quyết vấn đề gồm 4 trụ cột: Phân rã bài toán (Decomposition), Nhận diện quy luật (Pattern Recognition), Trừu tượng hóa (Abstraction) và Thiết kế thuật toán (Algorithm Design). Kỹ năng này giúp bạn làm chủ tự động hóa công việc và giao tiếp mạch lạc với các hệ thống AI.',
    targetOutcome: 'Hiểu bản chất cách máy tính xử lý thông tin, xây dựng thuật toán giải quyết bài toán thực tế và viết kịch bản tự động hóa công việc.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Phân rã vấn đề (Decomposition)',
        action: 'Chia một nhiệm vụ lớn, mơ hồ thành các tác vụ con nhỏ hơn, độc lập và có thể xử lý từng bước.',
        output: 'Danh sách các bài toán nhỏ có mối quan hệ logic.',
        tip: 'Ví dụ: Để tự động hóa báo cáo tuần, phân rã thành: Thu thập file -> Lọc số liệu -> Vẽ biểu đồ -> Gửi email.',
      },
      {
        stepNumber: 2,
        title: 'Nhận diện quy luật & Trừu tượng hóa',
        action: 'Tìm các điểm lặp đi lặp lại trong quy trình; loại bỏ các chi tiết thừa để khái quát hóa thành công thức chung.',
        output: 'Mô hình logic giải quyết bài toán tổng quát.',
        tip: 'Quy tắc lặp: Bất cứ việc gì bạn phải lặp lại thủ công trên 3 lần, hãy nghĩ đến việc viết thuật toán hoặc dùng hàm.',
      },
      {
        stepNumber: 3,
        title: 'Thiết kế thuật toán (Flowchart / Pseudocode)',
        action: 'Vẽ sơ đồ luồng quy trình (Bắt đầu -> Điều kiện rẽ nhánh IF/ELSE -> Vòng lặp LOOP -> Kết thúc) hoặc viết mã giả.',
        output: 'Sơ đồ luồng thuật toán trực quan, chính xác.',
        tip: 'Đảm bảo mọi điều kiện rẽ nhánh đều có lối thoát (tránh vòng lặp vô tận gây đơ hệ thống).',
      },
      {
        stepNumber: 4,
        title: 'Hiện thực hóa & Gỡ lỗi (Debugging)',
        action: 'Dùng công cụ lập trình kéo thả (Scratch), hàm nâng cao (Excel formulas), hoặc viết mã kịch bản (Python, App Script) và sửa lỗi phát sinh.',
        output: 'Giải pháp tự động hóa hoạt động chuẩn xác.',
        tip: 'Kiểm thử với các dữ liệu biên (ví dụ: số 0, số âm, ô trống) để đảm bảo thuật toán không bị sập khi gặp ngoại lệ.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Hiểu các lệnh tuần tự cơ bản, biết sử dụng các hàm điều kiện đơn giản trong bảng tính.',
        keySkills: ['Sử dụng hàm IF, SUM, COUNT trong Excel', 'Hiểu sơ đồ tư duy phân rã công việc', 'Biết sắp xếp chuỗi thao tác theo thứ tự logic'],
        contextExample: 'Viết hàm IF để xếp loại kết quả học tập Đạt / Chưa đạt dựa trên điểm số.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Biết vẽ sơ đồ luồng thuật toán, sử dụng các công cụ tự động hóa không cần viết code (No-Code/Zapier) hoặc hàm phức hợp.',
        keySkills: ['Thiết kế sơ đồ quy trình rẽ nhánh IF/THEN/ELSE', 'Sử dụng hàm tìm kiếm VLOOKUP/XLOOKUP kết hợp', 'Tạo luồng tự động hóa cơ bản trên Zapier/Make'],
        contextExample: 'Thiết lập tự động: Khi có người điền biểu mẫu Google Form, hệ thống tự gửi email xác nhận và tạo dòng trong bảng tính.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Viết các đoạn mã kịch bản (Scripts/Python) để xử lý dữ liệu tự động, tối ưu hóa thuật toán và gỡ lỗi độc lập.',
        keySkills: ['Viết Google Apps Script để tự động hóa tác vụ', 'Sử dụng vòng lặp và mảng dữ liệu trong lập trình', 'Đọc hiểu và tinh chỉnh mã code do AI tạo sinh'],
        contextExample: 'Viết mã kịch bản tự động quét thư mục, đổi tên 500 tệp ảnh theo ngày chụp và nén lại thành tệp ZIP.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Thiết kế kiến trúc hệ thống phần mềm quy mô lớn, phát triển các giải pháp tự động hóa thông minh tích hợp mô hình AI.',
        keySkills: ['Tối ưu hóa độ phức tạp của thuật toán (Big O)', 'Thiết kế API kết nối hệ sinh thái phần mềm', 'Phát triển các giải pháp AI Agent tự hành'],
        contextExample: 'Chủ trì việc kiến trúc và triển khai hệ thống tự động hóa chấm bài và phân tích năng lực số thông minh cho toàn trường.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI là trợ lý lập trình tuyệt vời: Có thể viết mã theo yêu cầu ngôn ngữ tự nhiên, giải thích lỗi code và đề xuất giải thuật tối ưu.',
      ethicalChecklist: [
        'Hiểu từng dòng mã do AI tạo ra trước khi chạy trong hệ thống thực tế',
        'Kiểm tra rủi ro bảo mật trong mã nguồn do AI gợi ý',
        'Rèn luyện tư duy logic của bản thân, không biến mình thành kẻ phụ thuộc thụ động vào AI',
      ],
      riskWarning: 'Mã nguồn do AI sinh ra có thể chứa các lỗ hổng bảo mật nghiêm trọng (như lỗi SQL Injection) nếu không được rà soát.',
    },
    commonPitfalls: [
      {
        mistake: 'Bắt tay vào viết mã hoặc cấu hình công cụ ngay mà không phân tích bài toán trước.',
        consequence: 'Dễ lạc hướng, logic bị rối rắm và phải đập đi xây lại nhiều lần.',
        bestPractice: 'Dành 70% thời gian để vẽ sơ đồ tư duy trên giấy; 30% còn lại dùng để hiện thực hóa bằng công cụ.',
      },
      {
        mistake: 'Bỏ qua các trường hợp ngoại lệ (Edge Cases) khi thiết kế thuật toán.',
        consequence: 'Hệ thống bị sập ngay khi người dùng nhập sai định dạng hoặc bỏ trống dữ liệu.',
        bestPractice: 'Luôn dự phòng nhánh xử lý lỗi: "Nếu dữ liệu không hợp lệ -> Thông báo lỗi rõ ràng cho người dùng".',
      },
    ],
    recommendedTools: [
      { category: 'Học tư duy thuật toán trực quan', tools: ['Scratch (MIT)', 'Flowgorithm', 'Blockly'] },
      { category: 'Tự động hóa không code (No-Code)', tools: ['Zapier', 'Make (Integromat)', 'Microsoft Power Automate'] },
      { category: 'Ngôn ngữ kịch bản phổ biến', tools: ['Python', 'Google Apps Script', 'JavaScript'] },
    ],
    selfChecklist: [
      'Tôi biết cách phân tích một bài toán lớn thành các bước thực hiện nhỏ tuần tự.',
      'Tôi hiểu rõ nguyên lý hoạt động của điều kiện rẽ nhánh (IF... THEN... ELSE).',
      'Tôi có thể tự phát hiện và sửa các lỗi sai logic trong công thức bảng tính.',
    ],
  },

  // =========================================================================
  // MIỀN 4: AN TOÀN VÀ BẢO MẬT SỐ
  // =========================================================================
  '4.1': {
    skillCode: '4.1',
    domainCode: '04',
    domainNumber: 4,
    domainTitle: 'An toàn và Bảo mật số',
    title: 'Bảo vệ thiết bị số và môi trường mạng',
    badge: 'Trạm 01 • Miền 4',
    headline: 'Bảo vệ máy tính, điện thoại trước mã độc, làm chủ cấu hình tường lửa và an toàn kết nối Wi-Fi công cộng.',
    overview: 'Thiết bị số là cánh cửa dẫn vào toàn bộ tài sản số và dữ liệu cá nhân của bạn. Trạm này trang bị các kiến thức thiết yếu để thiết lập lớp phòng thủ kiên cố: cài đặt mật khẩu mạnh, kích hoạt sinh trắc học, nhận diện mã độc (Malware, Ransomware) và phòng tránh bẫy mạng Wi-Fi giả mạo.',
    targetOutcome: 'Cấu hình và duy trì an toàn vật lý cũng như an toàn phần mềm cho các thiết bị số cá nhân và công việc.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Thiết lập khóa màn hình & Sinh trắc học',
        action: 'Cài đặt mã PIN phức tạp (tối thiểu 6 chữ số) kết hợp vân tay hoặc nhận diện khuôn mặt; cài thời gian tự động khóa sau 1-2 phút không hoạt động.',
        output: 'Thiết bị an toàn trước sự xâm nhập vật lý khi bị để quên hoặc mất cắp.',
        tip: 'Tuyệt đối không dùng các mã PIN đơn giản như 123456, 000000 hay ngày tháng năm sinh của mình.',
      },
      {
        stepNumber: 2,
        title: 'Cập nhật hệ điều hành & Phần mềm vá lỗi',
        action: 'Bật tính năng tự động cập nhật bản vá bảo mật cho Windows, macOS, iOS, Android và các ứng dụng thiết yếu.',
        output: 'Các lỗ hổng bảo mật đã biết được vá kịp thời trước khi tin tặc khai thác.',
        tip: 'Hầu hết các vụ tấn công mã độc tống tiền đều nhắm vào các máy tính chưa cập nhật bản vá bảo mật cũ.',
      },
      {
        stepNumber: 3,
        title: 'Cảnh giác khi kết nối mạng Wi-Fi công cộng',
        action: 'Tắt tính năng tự động kết nối Wi-Fi mở; luôn bật VPN khi phải giao dịch ngân hàng hoặc đăng nhập tài khoản tại quán cafe, sân bay.',
        output: 'Dữ liệu truyền tải được mã hóa an toàn, chống bị nghe lén (Man-in-the-Middle).',
        tip: 'Kẻ xấu có thể tạo Wi-Fi giả mạo có tên giống hệt quán cafe để đánh cắp tài khoản của người kết nối.',
      },
      {
        stepNumber: 4,
        title: 'Quản lý quyền ứng dụng (App Permissions)',
        action: 'Rà soát danh sách quyền đã cấp cho ứng dụng trên điện thoại: Tắt quyền truy cập Vị trí, Danh bạ, Micro của các ứng dụng không cần thiết.',
        output: 'Ngăn chặn ứng dụng rác âm thầm thu thập dữ liệu cá nhân trong nền.',
        tip: 'Một ứng dụng đèn pin hay máy tính đơn giản hoàn toàn không có lý do gì để đòi quyền đọc Danh bạ hay Vị trí.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết khóa máy bằng mật khẩu/vân tay, không bấm vào các đường link lạ và biết quét virus cơ bản.',
        keySkills: ['Cài đặt mật khẩu khóa thiết bị', 'Kích hoạt phần mềm chống virus tích hợp (Windows Defender)', 'Nhận diện các dấu hiệu máy tính bị nhiễm mã độc'],
        contextExample: 'Cài đặt bảo mật vân tay cho điện thoại và không mở các tệp đính kèm có đuôi .exe từ email lạ.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Làm chủ cài đặt tường lửa, quản lý quyền ứng dụng và sử dụng mạng riêng ảo (VPN) khi dùng mạng công cộng.',
        keySkills: ['Sử dụng mạng riêng ảo VPN an toàn', 'Kiểm soát quyền truy cập micro, camera của phần mềm', 'Mã hóa ổ đĩa máy tính (BitLocker/FileVault)'],
        contextExample: 'Bật mã hóa toàn bộ ổ đĩa máy tính xách tay cá nhân để bảo vệ dữ liệu trường hợp máy bị mất cắp.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Phân tích mã độc, xử lý sự cố thiết bị bị xâm nhập và thiết lập chính sách an toàn thiết bị cho nhóm làm việc.',
        keySkills: ['Cách ly thiết bị khi phát hiện có mã độc', 'Khôi phục hệ thống từ phân vùng an toàn', 'Cấu hình bảo mật nâng cao cho modem Wi-Fi gia đình'],
        contextExample: 'Xử lý cách ly một máy tính trong mạng nội bộ bị nhiễm virus tống tiền để không lây sang máy chủ.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Hoạch định chiến lược bảo vệ thiết bị đầu cuối (Endpoint Security) cho tổ chức, ứng phó sự cố an ninh mạng chuyên nghiệp.',
        keySkills: ['Triển khai giải pháp EDR (Endpoint Detection & Response)', 'Thiết lập mô hình bảo mật không tin cậy (Zero Trust)', 'Diễn tập ứng phó sự cố tấn công mạng quy mô lớn'],
        contextExample: 'Xây dựng kiến trúc an ninh mạng Zero Trust bảo vệ hàng ngàn thiết bị làm việc từ xa của cơ quan.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI hỗ trợ phân tích hành vi bất thường của thiết bị và cảnh báo sớm các lưu lượng mạng độc hại trong thời gian thực.',
      ethicalChecklist: [
        'Không tải các công cụ quét an ninh mạng độc hại (Crack/Hack) do AI tạo sinh',
        'Tuân thủ pháp luật an ninh mạng, không dùng kiến thức để tấn công thiết bị người khác',
        'Bảo đảm tính riêng tư khi sử dụng các phần mềm giám sát thiết bị có tích hợp AI',
      ],
      riskWarning: 'Tin tặc cũng đang dùng AI để tạo ra các biến thể mã độc tự động thay đổi mã nguồn nhằm né tránh phần mềm quét virus.',
    },
    commonPitfalls: [
      {
        mistake: 'Cài đặt các phần mềm bẻ khóa (Crack, Keygen) tải trôi nổi trên mạng.',
        consequence: '99% các phần mềm bẻ khóa đều bị chèn mã độc đánh cắp mật khẩu và dữ liệu ngân hàng.',
        bestPractice: 'Chỉ cài đặt phần mềm từ website chính thức hoặc sử dụng các phần mềm mã nguồn mở miễn phí thay thế.',
      },
      {
        mistake: 'Cắm các thẻ nhớ USB nhặt được hoặc của người lạ vào máy tính cá nhân.',
        consequence: 'Máy tính bị nhiễm mã độc tự động chạy (Autorun) ngay trong tích tắc.',
        bestPractice: 'Quét virus USB trước khi mở hoặc sử dụng các dịch vụ lưu trữ đám mây để gửi tệp an toàn.',
      },
    ],
    recommendedTools: [
      { category: 'Bảo vệ tích hợp hệ điều hành', tools: ['Windows Security (Defender)', 'Apple FileVault', 'Android Play Protect'] },
      { category: 'Mạng riêng ảo uy tín (VPN)', tools: ['ProtonVPN', 'Cloudflare 1.1.1.1 WARP', 'NordVPN'] },
    ],
    selfChecklist: [
      'Máy tính và điện thoại của tôi luôn cài đặt khóa màn hình tự động.',
      'Hệ điều hành của tôi đang ở phiên bản cập nhật vá lỗi mới nhất.',
      'Tôi không sử dụng các phần mềm lậu bẻ khóa trên thiết bị làm việc.',
    ],
  },

  '4.2': {
    skillCode: '4.2',
    domainCode: '04',
    domainNumber: 4,
    domainTitle: 'An toàn và Bảo mật số',
    title: 'Bảo vệ dữ liệu cá nhân và quyền riêng tư',
    badge: 'Trạm 02 • Miền 4',
    headline: 'Làm chủ mật khẩu mạnh, kích hoạt xác thực 2 lớp (2FA) và nhận diện các chiêu trò lừa đảo mạo danh tinh vi.',
    overview: 'Dữ liệu cá nhân (họ tên, số định danh, sinh trắc học, thông tin ngân hàng) là tài sản quý giá nhất của công dân số. Năng lực này trang bị cho bạn tư duy bảo mật phòng thủ chiều sâu: Không bao giờ dùng chung một mật khẩu, làm chủ trình quản lý mật khẩu và nhận diện các cạm bẫy lừa đảo trực tuyến (Phishing, Social Engineering).',
    targetOutcome: 'Bảo vệ quyền riêng tư số, thiết lập các lớp bảo mật kiên cố và không bao giờ trở thành nạn nhân của lừa đảo mạng.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Tạo mật khẩu mạnh & Duy nhất',
        action: 'Sử dụng cụm mật khẩu dài (Passphrase) trên 12 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt; mỗi tài khoản một mật khẩu riêng.',
        output: 'Mật khẩu không thể bị bẻ khóa bằng các phương pháp dò quét thông thường.',
        tip: 'Quy tắc cụm từ dễ nhớ nhưng khó đoán: Ví dụ: "ToiDungNexaTuThang11@2026!".',
      },
      {
        stepNumber: 2,
        title: 'Kích hoạt xác thực 2 yếu tố (2FA)',
        action: 'Bật 2FA cho tất cả tài khoản thiết yếu (Email, Ngân hàng, Mạng xã hội), ưu tiên dùng ứng dụng Authenticator thay vì tin nhắn SMS.',
        output: 'Kẻ xấu dù có biết mật khẩu cũng không thể đăng nhập được vào tài khoản của bạn.',
        tip: 'Mã xác thực gửi qua tin nhắn SMS có nguy cơ bị tấn công hoán đổi SIM; hãy dùng Google Authenticator hoặc Microsoft Authenticator.',
      },
      {
        stepNumber: 3,
        title: 'Sử dụng trình quản lý mật khẩu (Password Manager)',
        action: 'Lưu trữ toàn bộ mật khẩu trong một két an toàn số; bạn chỉ cần ghi nhớ đúng một Mật khẩu chủ (Master Password) duy nhất.',
        output: 'Không còn nỗi lo quên mật khẩu, tự động điền mật khẩu an toàn chống trang web giả mạo.',
        tip: 'Trình quản lý mật khẩu sẽ từ chối tự động điền nếu bạn đang truy cập vào một trang web giả mạo tên miền.',
      },
      {
        stepNumber: 4,
        title: 'Nhận diện & Xử lý bẫy lừa đảo (Phishing)',
        action: 'Kiểm tra kỹ địa chỉ email người gửi, đường link tên miền; không bao giờ nhập thông tin khi có cảm giác bị hối thúc khẩn cấp.',
        output: 'Phản xạ an toàn trước các thông điệp đe dọa khóa tài khoản hoặc trúng thưởng giả mạo.',
        tip: 'Nếu nhận được email thông báo tài khoản ngân hàng bị khóa, hãy tự mở trình duyệt gõ địa chỉ trang web ngân hàng thay vì bấm vào link trong email.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết đặt mật khẩu phức tạp, không chia sẻ mật khẩu cho người khác và biết đăng xuất trên máy tính công cộng.',
        keySkills: ['Tạo mật khẩu có chữ và số', 'Không ghi mật khẩu ra giấy dán màn hình', 'Nhận diện các tin nhắn lừa đảo trúng thưởng thô sơ'],
        contextExample: 'Đổi mật khẩu định kỳ cho tài khoản học tập và không dùng chung mật khẩu với mạng xã hội.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Sử dụng ứng dụng xác thực 2 lớp (2FA), làm chủ trình quản lý mật khẩu và kiểm soát dấu chân chia sẻ dữ liệu cá nhân.',
        keySkills: ['Cài đặt ứng dụng Google/Microsoft Authenticator', 'Sử dụng Bitwarden/1Password để quản lý mật khẩu', 'Nhận diện các email mạo danh ngân hàng tinh vi'],
        contextExample: 'Kích hoạt xác thực 2 lớp bằng mã trên điện thoại cho tài khoản email công việc chính.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Kiểm toán an toàn dữ liệu cá nhân, sử dụng khóa bảo mật phần cứng (FIDO2/YubiKey) và xử lý rò rỉ dữ liệu.',
        keySkills: ['Sử dụng khóa bảo mật phần cứng FIDO2', 'Kiểm tra xem email cá nhân có bị rò rỉ trên cơ sở dữ liệu tin tặc hay không', 'Mã hóa tài liệu nhạy cảm trước khi gửi'],
        contextExample: 'Cấu hình khóa bảo mật vật lý cho tài khoản quản trị hệ thống của cơ quan.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Chủ trì việc tuân thủ các quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP, GDPR) cho toàn bộ hệ thống tổ chức.',
        keySkills: ['Xây dựng chính sách bảo vệ dữ liệu cá nhân doanh nghiệp', 'Đánh giá tác động xử lý dữ liệu cá nhân (DPIA)', 'Xử lý khủng hoảng rò rỉ dữ liệu khách hàng quy mô lớn'],
        contextExample: 'Chủ trì đề án tuân thủ Nghị định bảo vệ dữ liệu cá nhân cho ngân hàng hoặc sàn thương mại điện tử.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ phân tích và phát hiện các mẫu email lừa đảo tinh vi mà mắt thường khó nhận biết.',
      ethicalChecklist: [
        'Tuyệt đối không nhập thông tin cá nhân của người khác vào các nền tảng AI công cộng',
        'Cảnh giác với các cuộc gọi lừa đảo giả mạo giọng nói người thân bằng công nghệ AI Voice Cloning',
        'Tuân thủ quyền được lãng quên và quyền bảo mật dữ liệu của người dùng',
      ],
      riskWarning: 'Tin tặc sử dụng AI để tạo ra các kịch bản lừa đảo cá nhân hóa (Spear Phishing) hoàn hảo, không còn lỗi chính tả như trước.',
    },
    commonPitfalls: [
      {
        mistake: 'Dùng duy nhất một mật khẩu dễ nhớ cho tất cả các tài khoản từ Facebook, Email đến Ngân hàng.',
        consequence: 'Chỉ cần một diễn đàn nhỏ bị hack làm lộ mật khẩu, tin tặc sẽ mở được toàn bộ các tài khoản quan trọng còn lại.',
        bestPractice: 'Mỗi dịch vụ một mật khẩu hoàn toàn riêng biệt thông qua trình quản lý mật khẩu.',
      },
      {
        mistake: 'Cung cấp mã OTP ngân hàng cho người lạ gọi điện tự xưng là công an, nhân viên bưu điện.',
        consequence: 'Mất toàn bộ tiền trong tài khoản chỉ trong vài giây.',
        bestPractice: 'Khắc cốt ghi tâm: Mã OTP là chiếc chìa khóa két sắt; không một ai có quyền yêu cầu bạn cung cấp mã OTP.',
      },
    ],
    recommendedTools: [
      { category: 'Trình quản lý mật khẩu miễn phí mã nguồn mở', tools: ['Bitwarden', 'KeePassXC'] },
      { category: 'Ứng dụng xác thực 2 lớp (2FA)', tools: ['Google Authenticator', 'Microsoft Authenticator', 'Aegis Authenticator'] },
    ],
    selfChecklist: [
      'Tôi đã bật xác thực 2 bước (2FA) cho tài khoản Email chính và tài khoản mạng xã hội.',
      'Tôi không sử dụng ngày sinh hoặc số điện thoại làm mật khẩu.',
      'Tôi biết cách nhận diện một email mạo danh thông qua tên miền người gửi.',
    ],
  },

  '4.3': {
    skillCode: '4.3',
    domainCode: '04',
    domainNumber: 4,
    domainTitle: 'An toàn và Bảo mật số',
    title: 'Bảo vệ sức khỏe thể chất và tinh thần trong môi trường số',
    badge: 'Trạm 03 • Miền 4',
    headline: 'Quản trị thời gian màn hình, rèn luyện tư thế công thái học và phòng chống kiệt sức số (Digital Burnout).',
    overview: 'Công nghệ sinh ra để phục vụ con người chứ không phải biến con người thành nô lệ của các thuật toán gây nghiện. Năng lực này giúp bạn thiết lập sự cân bằng lành mạnh giữa thế giới số và đời thực, bảo vệ đôi mắt, cột sống và duy trì trạng thái tinh thần tích cực, sáng suốt.',
    targetOutcome: 'Kiểm soát thói quen sử dụng công nghệ, duy trì sức khỏe thể chất và tinh thần bền vững trong môi trường làm việc số.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Thiết lập không gian làm việc công thái học (Ergonomics)',
        action: 'Điều chỉnh độ cao màn hình ngang tầm mắt; góc khuỷu tay và đầu gối ở mức 90 độ; giữ lưng thẳng có điểm tựa.',
        output: 'Giảm thiểu tối đa nguy cơ thoái hóa đốt sống cổ và hội chứng ống cổ tay.',
        tip: 'Kê thêm giá đỡ laptop để nâng màn hình lên ngang tầm mắt, sử dụng bàn phím và chuột rời.',
      },
      {
        stepNumber: 2,
        title: 'Áp dụng quy tắc 20-20-20 bảo vệ mắt',
        action: 'Cứ sau mỗi 20 phút nhìn màn hình, hãy phóng tầm mắt nhìn một vật ở khoảng cách 20 feet (khoảng 6 mét) trong ít nhất 20 giây.',
        output: 'Đôi mắt được thư giãn cơ điều tiết, chống mỏi mắt và khô mắt.',
        tip: 'Bật chế độ lọc ánh sáng xanh (Night Light / True Tone) trên thiết bị khi làm việc vào buổi tối.',
      },
      {
        stepNumber: 3,
        title: 'Kiểm soát thời gian màn hình & Giới hạn thông báo',
        action: 'Tắt các thông báo mạng xã hội không quan trọng; thiết lập giới hạn thời gian sử dụng ứng dụng mỗi ngày.',
        output: 'Giải phóng não bộ khỏi sự phân tâm liên tục, nâng cao khả năng tập trung sâu (Deep Work).',
        tip: 'Để điện thoại ra khỏi phòng ngủ để cải thiện chất lượng giấc ngủ ban đêm.',
      },
      {
        stepNumber: 4,
        title: 'Cai nghiện số định kỳ (Digital Detox)',
        action: 'Dành ít nhất 1 ngày cuối tuần hoặc vài giờ mỗi tối hoàn toàn không chạm vào màn hình thiết bị số.',
        output: 'Tái tạo năng lượng tinh thần và kết nối sâu sắc với thế giới thực tế xung quanh.',
        tip: 'Thay thế thói quen lướt mạng xã hội trước khi ngủ bằng việc đọc sách giấy hoặc trò chuyện cùng người thân.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Nhận thức được tác hại của việc ngồi sai tư thế và nhìn màn hình quá lâu; biết bật chế độ bảo vệ mắt.',
        keySkills: ['Bật chế độ lọc ánh sáng xanh trên điện thoại/máy tính', 'Nhận biết khi mắt bị mỏi cần nghỉ ngơi', 'Điều chỉnh độ sáng màn hình phù hợp với ánh sáng phòng'],
        contextExample: 'Bật tính năng Night Shift trên điện thoại khi sử dụng vào ban đêm.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Áp dụng các thói quen công thái học, theo dõi thời gian sử dụng màn hình (Screen Time) và kiểm soát thông báo.',
        keySkills: ['Thiết lập giới hạn thời gian ứng dụng (App Limits)', 'Sắp xếp bàn làm việc công thái học chuẩn chỉ', 'Thực hành các bài tập kéo giãn cơ cổ và vai gáy'],
        contextExample: 'Cài đặt giới hạn sử dụng ứng dụng TikTok/Facebook tối đa 45 phút mỗi ngày.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Xây dựng chế độ làm việc sâu không xao nhãng, hỗ trợ đồng nghiệp và người thân xây dựng lối sống số cân bằng.',
        keySkills: ['Áp dụng phương pháp Pomodoro để duy trì nhịp độ làm việc', 'Thiết lập ranh giới giao tiếp số sau giờ làm việc', 'Nhận diện các dấu hiệu kiệt sức số (Digital Burnout)'],
        contextExample: 'Thiết kế quy trình làm việc nhóm tôn trọng thời gian nghỉ ngơi, không nhắn tin công việc đêm khuya.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Hoạch định chiến lược bảo vệ sức khỏe tâm thần và thể chất cho tổ chức trong môi trường làm việc số linh hoạt.',
        keySkills: ['Xây dựng chính sách "Quyền được ngắt kết nối" (Right to Disconnect)', 'Đánh giá tác động tâm lý của công nghệ lên năng suất', 'Kiến tạo môi trường số nhân văn, hòa nhập'],
        contextExample: 'Chủ trì đề án chăm sóc sức khỏe tinh thần cho nhân viên làm việc từ xa của doanh nghiệp công nghệ.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ nhắc nhở thời gian nghỉ ngơi, theo dõi tư thế ngồi qua webcam và phân tích thói quen làm việc để cảnh báo kiệt sức.',
      ethicalChecklist: [
        'Không để các thuật toán AI thao túng thời gian và cảm xúc của bản thân thông qua các nội dung kích động',
        'Tỉnh táo trước xu hướng so sánh bản thân với các hình mẫu hoàn hảo phi thực tế do AI tạo ra trên mạng',
        'Chủ động ngắt kết nối khi cảm thấy căng thẳng tâm lý do quá tải thông tin',
      ],
      riskWarning: 'Các thuật toán mạng xã hội được tối ưu hóa để giữ chân bạn càng lâu càng tốt; bạn cần có kỷ luật tự giác để thoát ra.',
    },
    commonPitfalls: [
      {
        mistake: 'Vừa nằm trên giường vừa bấm điện thoại trong bóng tối hoàn toàn.',
        consequence: 'Gây hại nghiêm trọng cho võng mạc mắt, ức chế hormone giấc ngủ Melatonin gây mất ngủ kinh niên.',
        bestPractice: 'Bật đèn phòng khi dùng thiết bị và cất điện thoại trước khi đi ngủ ít nhất 30 phút.',
      },
      {
        mistake: 'Cắm mặt vào màn hình liên tục 4-5 tiếng không đứng dậy uống nước hay vận động.',
        consequence: 'Nguy cơ hình thành huyết khối tĩnh mạch, thoái hóa cột sống và đau nhức mãn tính.',
        bestPractice: 'Cài đặt chuông báo sau mỗi 45-50 phút đứng dậy đi lại, uống một ly nước và vươn vai thư giãn.',
      },
    ],
    recommendedTools: [
      { category: 'Quản lý thời gian màn hình', tools: ['Apple Screen Time', 'Google Digital Wellbeing', 'StayFocusd'] },
      { category: 'Nhắc nhở nghỉ ngơi & Pomodoro', tools: ['Forest', 'Pomofocus', 'EyeLeo (nhắc nghỉ mắt cho PC)'] },
    ],
    selfChecklist: [
      'Màn hình làm việc của tôi đã được nâng lên ngang tầm mắt.',
      'Tôi áp dụng quy tắc 20-20-20 để thư giãn mắt trong quá trình học tập.',
      'Tôi không sử dụng điện thoại trên giường ngủ trước khi đi ngủ.',
    ],
  },

  '4.4': {
    skillCode: '4.4',
    domainCode: '04',
    domainNumber: 4,
    domainTitle: 'An toàn và Bảo mật số',
    title: 'Bảo vệ môi trường và sử dụng năng lượng số bền vững',
    badge: 'Trạm 04 • Miền 4',
    headline: 'Giảm thiểu dấu chân carbon kỹ thuật số, tiết kiệm năng lượng thiết bị và xử lý rác thải điện tử an toàn.',
    overview: 'Mỗi email gửi đi, mỗi câu lệnh truy vấn mô hình AI lớn hay việc lưu trữ hàng ngàn bức ảnh thừa trên đám mây đều tiêu tốn điện năng và tài nguyên nước tại các trung tâm dữ liệu khổng lồ. Năng lực này nâng cao ý thức về "Dấu chân carbon số" (Digital Carbon Footprint) và thúc đẩy lối sống xanh trong kỷ nguyên số.',
    targetOutcome: 'Tối ưu hóa năng lượng tiêu thụ của thiết bị, thực hành dọn dẹp dữ liệu số định kỳ và xử lý rác thải điện tử đúng cách.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Tối ưu hóa năng lượng trên thiết bị cá nhân',
        action: 'Kích hoạt chế độ tiết kiệm pin (Power Saving Mode); giảm độ sáng màn hình; tắt các kết nối Bluetooth/GPS khi không dùng.',
        output: 'Kéo dài tuổi thọ pin thiết bị và giảm lượng điện năng sạc tiêu thụ.',
        tip: 'Để pin thiết bị dao động trong khoảng 20% - 80% là trạng thái tối ưu nhất giúp pin bền lâu.',
      },
      {
        stepNumber: 2,
        title: 'Dọn dẹp rác kỹ thuật số (Digital Cleanup)',
        action: 'Hủy đăng ký (Unsubscribe) các email quảng cáo không đọc; xóa các tệp tin thừa, ảnh trùng lặp trên bộ nhớ đám mây.',
        output: 'Giải phóng dung lượng máy chủ đám mây, giảm năng lượng lưu trữ không cần thiết.',
        tip: 'Lưu trữ 1GB email trong một năm tiêu tốn lượng năng lượng tương đương với việc lái một chiếc xe hơi đi 1km.',
      },
      {
        stepNumber: 3,
        title: 'Kéo dài vòng đời thiết bị số',
        action: 'Bảo quản máy móc cẩn thận, thay pin hoặc nâng cấp linh kiện (RAM/SSD) thay vì vội vàng vứt bỏ mua máy mới.',
        output: 'Giảm thiểu nhu cầu khai thác khoáng sản hiếm để sản xuất thiết bị mới.',
        tip: 'Vệ sinh bụi bẩn quạt tản nhiệt định kỳ giúp máy tính chạy mát hơn và tiêu thụ ít điện năng hơn.',
      },
      {
        stepNumber: 4,
        title: 'Thu gom & Tái chế rác thải điện tử đúng cách',
        action: 'Không vứt pin, điện thoại cũ vào thùng rác sinh hoạt thông thường; mang đến các điểm thu gom rác thải điện tử chuyên trách.',
        output: 'Ngăn chặn các kim loại nặng độc hại (chì, thủy ngân) ngấm vào nguồn đất và nước ngầm.',
        tip: 'Tìm kiếm các điểm thu gom "Việt Nam Tái Chế" tại các siêu thị hoặc cơ quan bảo vệ môi trường.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết tắt máy tính khi không sử dụng, bật chế độ tiết kiệm pin và không vứt pin cũ vào thùng rác thông thường.',
        keySkills: ['Tắt màn hình hoặc cho máy ngủ (Sleep) khi rời bàn', 'Giảm độ sáng màn hình ở mức vừa đủ', 'Tập hợp pin đã qua sử dụng vào hộp riêng'],
        contextExample: 'Rút phích cắm củ sạc ra khỏi ổ điện khi điện thoại đã được sạc đầy.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Thực hành dọn dẹp dữ liệu số đám mây định kỳ, tối ưu hóa việc truyền phát video và sử dụng thiết bị tiết kiệm điện.',
        keySkills: ['Dọn dẹp hòm thư điện tử và xóa tệp tin rác', 'Hạ độ phân giải video khi chỉ nghe nhạc trên YouTube', 'Lựa chọn thiết bị đạt chứng nhận Energy Star'],
        contextExample: 'Dọn dẹp 15GB dữ liệu rác trên Google Drive để tránh phải mua thêm gói dung lượng.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Xây dựng quy trình làm việc không giấy tờ (Paperless), tuyên truyền lối sống công nghệ xanh trong tổ chức.',
        keySkills: ['Số hóa hoàn toàn quy trình ký duyệt tài liệu', 'Tối ưu hóa truy vấn mô hình AI để tiết kiệm năng lượng tính toán', 'Tham gia các phong trào thu gom rác thải điện tử'],
        contextExample: 'Chuyển đổi toàn bộ biểu mẫu giấy của sự kiện sang biểu mẫu điện tử quét mã QR.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Hoạch định chiến lược công nghệ thông tin xanh (Green IT) cho doanh nghiệp, chuyển đổi sang trung tâm dữ liệu năng lượng tái tạo.',
        keySkills: ['Đo lường dấu chân carbon số của tổ chức', 'Triển khai hạ tầng máy chủ xanh đạt chuẩn PUE thấp', 'Thiết lập chính sách kinh tế tuần hoàn cho thiết bị công nghệ'],
        contextExample: 'Chủ trì việc di chuyển hệ thống máy chủ của công ty lên nhà cung cấp đám mây sử dụng 100% năng lượng tái tạo.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI có thể hỗ trợ tối ưu hóa năng lượng cho các tòa nhà thông minh và tính toán chính xác lượng phát thải carbon của các hoạt động số.',
      ethicalChecklist: [
        'Ý thức rằng huấn luyện và vận hành các mô hình AI khổng lồ tiêu tốn lượng nước và điện năng cực kỳ lớn',
        'Sử dụng các mô hình AI có kích thước vừa phải (Small Language Models) cho các tác vụ đơn giản thay vì mô hình khổng lồ',
        'Ưu tiên các nhà cung cấp dịch vụ AI cam kết sử dụng năng lượng xanh',
      ],
      riskWarning: 'Tránh việc lạm dụng gửi các câu lệnh AI vô nghĩa lặp đi lặp lại chỉ để giải trí tiêu khiển vì mỗi câu lệnh đều làm tiêu tốn năng lượng trung tâm dữ liệu.',
    },
    commonPitfalls: [
      {
        mistake: 'Cắm sạc máy tính hoặc điện thoại liên tục 24/7 kể cả khi không dùng đến.',
        consequence: 'Gây chai phồng pin, hao tổn điện năng ngầm và tiềm ẩn nguy cơ chập cháy điện.',
        bestPractice: 'Rút sạc khi pin đầy và ngắt nguồn các thiết bị ngoại vi khi hết giờ làm việc.',
      },
      {
        mistake: 'Vứt bỏ điện thoại cũ hoặc pin hỏng vào xe rác gia đình.',
        consequence: 'Hóa chất độc hại rò rỉ làm ô nhiễm môi trường đất và nguồn nước ngầm kéo dài hàng trăm năm.',
        bestPractice: 'Đem pin cũ đến các điểm thu hồi pin chuyên dụng tại các siêu thị hoặc ủy ban nhân dân.',
      },
    ],
    recommendedTools: [
      { category: 'Đo lường dấu chân carbon số', tools: ['Website Carbon Calculator', 'Cleanfox (dọn dẹp email rác)'] },
      { category: 'Thu gom rác thải điện tử', tools: ['Việt Nam Tái Chế (vietnamrecycles.com)'] },
    ],
    selfChecklist: [
      'Tôi luôn tắt màn hình máy tính khi rời khỏi bàn làm việc trên 15 phút.',
      'Tôi định kỳ dọn dẹp hòm thư và xóa các tệp tin tải về không còn dùng.',
      'Tôi gom pin đã qua sử dụng vào một hộp riêng để đem đến điểm tái chế.',
    ],
  },

  // =========================================================================
  // MIỀN 5: GIẢI QUYẾT VẤN ĐỀ SỐ
  // =========================================================================
  '5.1': {
    skillCode: '5.1',
    domainCode: '05',
    domainNumber: 5,
    domainTitle: 'Giải quyết Vấn đề số',
    title: 'Giải quyết các sự cố kỹ thuật số',
    badge: 'Trạm 01 • Miền 5',
    headline: 'Chẩn đoán có hệ thống, khắc phục sự cố phần cứng, phần mềm và khôi phục hoạt động hệ thống an toàn.',
    overview: 'Khi máy tính bỗng dưng không lên màn hình, mất kết nối mạng hay một ứng dụng bị đơ, người dùng có năng lực số không hoảng loạn. Họ biết cách quan sát mã lỗi, áp dụng phương pháp loại trừ có hệ thống và chủ động tìm kiếm giải pháp kỹ thuật trước khi cần sự hỗ trợ của chuyên gia.',
    targetOutcome: 'Tự tin chẩn đoán, xử lý các sự cố kỹ thuật thường gặp trên thiết bị và hệ điều hành một cách bình tĩnh, chuẩn xác.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Ghi nhận triệu chứng & Mã lỗi chính xác',
        action: 'Chụp ảnh màn hình thông báo lỗi, ghi chép lại chính xác mã lỗi (Error Code) hoặc chuỗi hành động ngay trước khi xảy ra sự cố.',
        output: 'Bản mô tả sự cố cụ thể, có bằng chứng rõ ràng.',
        tip: 'Đừng chỉ nói "Máy em bị hỏng"; hãy nói "Khi em bấm Xuất file PDF trên Word, máy báo lỗi Error 0x80070005".',
      },
      {
        stepNumber: 2,
        title: 'Áp dụng các biện pháp xử lý cơ bản đầu tiên',
        action: 'Khởi động lại ứng dụng hoặc thiết bị; kiểm tra các kết nối dây cáp vật lý (dây mạng, cáp HDMI, nguồn điện).',
        output: 'Giải quyết được hơn 60% các sự cố xung đột tạm thời của bộ nhớ RAM.',
        tip: 'Khởi động lại máy tính (Restart) là bước sơ cứu kỹ thuật đơn giản nhưng hiệu quả nhất.',
      },
      {
        stepNumber: 3,
        title: 'Tra cứu giải pháp bằng phương pháp loại trừ',
        action: 'Tìm kiếm chính xác chuỗi mã lỗi trong dấu ngoặc kép trên Google hoặc hỏi trợ lý AI chuyên kỹ thuật.',
        output: 'Các bài viết hướng dẫn xử lý từng bước từ nhà sản xuất hoặc cộng đồng kỹ thuật.',
        tip: 'Tìm kiếm bằng tiếng Anh (ví dụ: "Fix Word Error 0x80070005 Windows 11") thường đem lại giải pháp nhanh và chuẩn xác hơn.',
      },
      {
        stepNumber: 4,
        title: 'Thử nghiệm giải pháp & Ghi chép bài học',
        action: 'Thực hiện từng giải pháp một theo thứ tự từ dễ đến khó; ghi chú lại cách đã xử lý thành công để tái sử dụng lần sau.',
        output: 'Hệ thống hoạt động bình thường trở lại và cẩm nang kinh nghiệm cá nhân.',
        tip: 'Luôn tạo điểm khôi phục hệ thống (System Restore Point) trước khi can thiệp vào cài đặt chuyên sâu của hệ điều hành.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết khởi động lại máy khi bị đơ, cắm lại dây kết nối, kiểm tra xem máy có bật Wi-Fi hay không.',
        keySkills: ['Khởi động lại thiết bị an toàn', 'Kiểm tra trạng thái kết nối mạng internet', 'Xóa bộ nhớ đệm (Cache) của trình duyệt web'],
        contextExample: 'Tự xử lý khi trình duyệt web không tải được trang bằng cách kiểm tra Wi-Fi và xóa cache trình duyệt.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Biết chẩn đoán sự cố phần mềm qua Task Manager, cài đặt lại driver thiết bị và tra cứu mã lỗi kỹ thuật.',
        keySkills: ['Sử dụng Task Manager để tắt ứng dụng bị treo (End Task)', 'Cập nhật hoặc cài lại driver âm thanh/máy in', 'Tra cứu và làm theo tài liệu hướng dẫn kỹ thuật'],
        contextExample: 'Khắc phục sự cố micro không nhận diện giọng nói trong phần mềm họp trực tuyến bằng cách kiểm tra quyền riêng tư âm thanh.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Khắc phục các sự cố xung đột hệ thống phức tạp, khôi phục dữ liệu bị lỗi và hỗ trợ đồng nghiệp xử lý sự cố từ xa.',
        keySkills: ['Sử dụng công cụ hỗ trợ từ xa (TeamViewer/AnyDesk)', 'Chẩn đoán lỗi mạng bằng lệnh ping/tracert', 'Khôi phục hệ điều hành từ bản sao lưu'],
        contextExample: 'Hỗ trợ đồng nghiệp cấu hình lại địa chỉ IP tĩnh và khắc phục lỗi mất mạng nội bộ từ xa.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Quản trị hạ tầng vận hành công nghệ, xây dựng quy trình giám sát tự động và kế hoạch phục hồi thảm họa (Disaster Recovery).',
        keySkills: ['Thiết kế kiến trúc hệ thống dự phòng chịu lỗi (High Availability)', 'Phân tích nguyên nhân gốc rễ sự cố (RCA)', 'Quản trị thỏa thuận mức độ dịch vụ (SLA) kỹ thuật'],
        contextExample: 'Chủ trì xử lý sự cố sập máy chủ dịch vụ của cơ quan và khôi phục toàn bộ dữ liệu trong vòng dưới 30 phút.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI là chuyên viên hỗ trợ kỹ thuật 24/7: Giúp giải mã các đoạn mã lỗi phức tạp, hướng dẫn các bước gỡ lỗi chi tiết.',
      ethicalChecklist: [
        'Cung cấp thông tin triệu chứng chính xác cho AI để nhận về giải pháp phù hợp',
        'Kiểm tra kỹ các dòng lệnh hệ thống (Command Prompt/Terminal) do AI gợi ý trước khi nhấn Enter',
        'Không tải lên các tệp log chứa mật khẩu hoặc dữ liệu người dùng lên công cụ AI',
      ],
      riskWarning: 'Các dòng lệnh do AI gợi ý nếu thực thi mù quáng có thể làm format nhầm ổ đĩa hoặc xóa sạch dữ liệu hệ thống.',
    },
    commonPitfalls: [
      {
        mistake: 'Tắt nóng máy tính bằng cách nhấn giữ nút nguồn hoặc rút phích cắm điện liên tục khi máy bị đơ.',
        consequence: 'Gây sốc điện, hỏng phân vùng ổ cứng và làm hỏng toàn bộ tệp tin đang mở.',
        bestPractice: 'Kiên nhẫn chờ 1-2 phút, thử dùng tổ hợp phím Ctrl+Alt+Del để mở Task Manager trước khi buộc phải tắt nóng.',
      },
      {
        mistake: 'Tải và cài bừa bãi các phần mềm dọn rác, tăng tốc máy tính quảng cáo trên mạng.',
        consequence: 'Máy tính càng chậm hơn vì bị cài thêm phần mềm quảng cáo độc hại (Adware).',
        bestPractice: 'Chỉ dùng các công cụ dọn dẹp chính chủ của hệ điều hành như Disk Cleanup / Storage Sense.',
      },
    ],
    recommendedTools: [
      { category: 'Chẩn đoán hệ thống tích hợp', tools: ['Task Manager (Windows)', 'Activity Monitor (macOS)', 'Resource Monitor'] },
      { category: 'Hỗ trợ từ xa', tools: ['Quick Assist (Windows)', 'AnyDesk', 'TeamViewer'] },
    ],
    selfChecklist: [
      'Tôi biết cách mở Task Manager để tắt một ứng dụng bị đơ mà không cần tắt nguồn máy.',
      'Tôi biết cách chụp ảnh màn hình thông báo lỗi để tra cứu cách sửa chữa.',
      'Tôi luôn thử khởi động lại máy trước khi nhờ người khác sửa giúp.',
    ],
  },

  '5.2': {
    skillCode: '5.2',
    domainCode: '05',
    domainNumber: 5,
    domainTitle: 'Giải quyết Vấn đề số',
    title: 'Xác định nhu cầu và lựa chọn giải pháp công nghệ',
    badge: 'Trạm 02 • Miền 5',
    headline: 'Đánh giá nhu cầu thực tế, so sánh giải pháp công nghệ và lựa chọn công cụ tối ưu cho công việc và học tập.',
    overview: 'Trong một thị trường có hàng ngàn ứng dụng số, phần mềm đắt tiền nhất chưa chắc đã là lựa chọn tốt nhất. Năng lực này rèn luyện tư duy phân tích yêu cầu nghiệp vụ, đối chiếu tính năng, chi phí và khả năng tương thích để chọn ra công cụ số "đo ni đóng giày" cho bài toán thực tế.',
    targetOutcome: 'Lựa chọn công nghệ sáng suốt dựa trên bằng chứng, tối ưu hóa chi phí và nâng cao vượt trội hiệu suất công việc.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Khảo sát & Làm rõ nhu cầu cốt lõi',
        action: 'Xác định bài toán thực sự cần giải quyết là gì, ai sẽ là người dùng chính và ngân sách tối đa là bao nhiêu.',
        output: 'Bảng tiêu chí yêu cầu chức năng (Features Matrix).',
        tip: 'Phân biệt giữa tính năng "Bắt buộc phải có" (Must-have) và tính năng "Có thì tốt" (Nice-to-have).',
      },
      {
        stepNumber: 2,
        title: 'Khảo sát thị trường & Thu hẹp lựa chọn',
        action: 'Tìm kiếm ít nhất 3-4 công cụ hàng đầu giải quyết bài toán đó; đọc các đánh giá độc lập từ người dùng thực tế.',
        output: 'Danh sách rút gọn (Shortlist) các ứng cử viên sáng giá nhất.',
        tip: 'Tham khảo các trang đánh giá phần mềm uy tín như G2, Capterra hoặc Product Hunt để xem ưu nhược điểm thực tế.',
      },
      {
        stepNumber: 3,
        title: 'Chạy thử nghiệm (PoC - Proof of Concept)',
        action: 'Đăng ký phiên bản dùng thử miễn phí; đưa dữ liệu thực tế vào chạy thử nghiệm trong quy mô nhỏ 1-2 tuần.',
        output: 'Bảng đánh giá trải nghiệm thực tế và độ ổn định của công cụ.',
        tip: 'Đặc biệt kiểm tra khả năng xuất dữ liệu (Export) để đề phòng trường hợp sau này muốn đổi sang công cụ khác.',
      },
      {
        stepNumber: 4,
        title: 'Quyết định triển khai & Đào tạo người dùng',
        action: 'Lựa chọn gói dịch vụ tối ưu chi phí, xây dựng tài liệu hướng dẫn và tổ chức chuyển giao cho toàn đội ngũ.',
        output: 'Quy trình công việc mới được số hóa mượt mà, người dùng đón nhận tích cực.',
        tip: 'Công nghệ chỉ chiếm 20% thành công, 80% còn lại là khả năng thích ứng và đào tạo con người.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết tìm và cài đặt ứng dụng phù hợp với nhu cầu cơ bản từ kho ứng dụng chính thức (Google Play/App Store).',
        keySkills: ['Tìm kiếm ứng dụng theo nhu cầu trên kho ứng dụng', 'Đọc đánh giá và xếp hạng sao trước khi cài', 'Gỡ bỏ các ứng dụng không phù hợp an toàn'],
        contextExample: 'Chọn một ứng dụng quét tài liệu PDF tốt trên điện thoại để scan bài tập.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'So sánh được ưu nhược điểm của các công cụ số cạnh tranh, lựa chọn gói dịch vụ tối ưu cho nhóm nhỏ.',
        keySkills: ['Lập bảng so sánh tính năng giữa các phần mềm', 'Đánh giá khả năng tương thích giữa các hệ điều hành', 'Tận dụng các gói miễn phí hoặc giảm giá cho giáo dục'],
        contextExample: 'So sánh giữa Trello, Notion và Asana để chọn ra công cụ quản lý dự án cho câu lạc bộ sinh viên.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Đánh giá giải pháp công nghệ toàn diện cho tổ chức: Tính bảo mật, chi phí sở hữu (TCO), khả năng mở rộng.',
        keySkills: ['Tính toán tổng chi phí sở hữu công nghệ (TCO)', 'Đánh giá tính bảo mật và quyền sở hữu dữ liệu của nhà cung cấp', 'Xây dựng kế hoạch di chuyển dữ liệu (Data Migration)'],
        contextExample: 'Lựa chọn hệ thống quản lý học tập (LMS) cho toàn trường học, đáp ứng yêu cầu 5,000 học viên đồng thời.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Hoạch định chiến lược công nghệ tổng thể cho tổ chức, dự báo xu hướng công nghệ tương lai và dẫn dắt đầu tư số.',
        keySkills: ['Xây dựng lộ trình công nghệ (Technology Roadmap)', 'Thương thảo hợp đồng bản quyền doanh nghiệp lớn', 'Thúc đẩy đổi mới sáng tạo thông qua công nghệ đột phá'],
        contextExample: 'Hoạch định chiến lược ứng dụng AI tổng thể cho doanh nghiệp, tạo lợi thế cạnh tranh dài hạn trên thị trường.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI hỗ trợ lập bảng ma trận so sánh tính năng, tổng hợp ưu nhược điểm của các giải pháp công nghệ trên thị trường.',
      ethicalChecklist: [
        'Không để các bài đánh giá được tài trợ hoặc quảng cáo AI thiên vị làm lệch hướng quyết định',
        'Xem xét kỹ chính sách bảo mật dữ liệu của công cụ trước khi chọn mua',
        'Ưu tiên các công cụ hỗ trợ chuẩn dữ liệu mở, tránh bị trói buộc vào một nhà cung cấp duy nhất (Vendor Lock-in)',
      ],
      riskWarning: 'Chọn công nghệ quá phức tạp so với trình độ nhân sự thực tế sẽ dẫn đến lãng phí ngân sách và dự án thất bại.',
    },
    commonPitfalls: [
      {
        mistake: 'Chọn phần mềm chỉ vì nó đang là trào lưu (Hype) dù nhu cầu thực tế không cần đến.',
        consequence: 'Gây phức tạp hóa quy trình, tốn chi phí đăng ký mà nhân sự không sử dụng.',
        bestPractice: 'Luôn xuất phát từ "Nỗi đau của quy trình" (Pain point) trước khi nghĩ đến công nghệ.',
      },
      {
        mistake: 'Không kiểm tra tính năng xuất dữ liệu (Data Export) trước khi sử dụng một phần mềm mới.',
        consequence: 'Bị phụ thuộc vào nhà cung cấp, khi họ tăng giá hoặc đóng cửa thì mất sạch dữ liệu.',
        bestPractice: 'Chỉ chọn các công cụ cho phép tải toàn bộ dữ liệu của bạn về máy dưới định dạng phổ biến (CSV, JSON, PDF).',
      },
    ],
    recommendedTools: [
      { category: 'Đánh giá & So sánh phần mềm', tools: ['G2.com', 'Capterra', 'Product Hunt', 'Trustpilot'] },
      { category: 'Khám phá giải pháp công nghệ mới', tools: ['AlternativeTo.net (tìm phần mềm thay thế)'] },
    ],
    selfChecklist: [
      'Tôi luôn thử dùng phiên bản miễn phí trước khi quyết định chi tiền mua phần mềm.',
      'Tôi kiểm tra xem phần mềm có hỗ trợ tiếng Việt hoặc có giao diện thân thiện với nhóm hay không.',
      'Tôi đảm bảo công cụ được chọn có thể chạy mượt mà trên thiết bị hiện có của các thành viên.',
    ],
  },

  '5.3': {
    skillCode: '5.3',
    domainCode: '05',
    domainNumber: 5,
    domainTitle: 'Giải quyết Vấn đề số',
    title: 'Ứng dụng sáng tạo công nghệ số để đổi mới',
    badge: 'Trạm 03 • Miền 5',
    headline: 'Vận dụng linh hoạt công nghệ số, tư duy đột phá và kết hợp công cụ thông minh để tạo ra giá trị mới.',
    overview: 'Đổi mới sáng tạo trong môi trường số không nhất thiết phải là phát minh ra một cỗ máy mới. Đó là năng lực kết nối những công cụ có sẵn theo những cách làm hoàn toàn mới: Dùng AI để cá nhân hóa việc học, kết hợp tự động hóa để cắt giảm 80% thời gian xử lý thủ công, hoặc tạo ra trải nghiệm người dùng độc đáo.',
    targetOutcome: 'Tự tin ứng dụng công nghệ để giải quyết các thách thức xã hội, cải tiến quy trình và tạo ra các giải pháp đột phá.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Quan sát & Phát hiện điểm nghẽn (Pain Point)',
        action: 'Tìm kiếm những quy trình thủ công đang tốn nhiều thời gian, hay xảy ra sai sót hoặc gây phiền toái cho mọi người.',
        output: 'Đề bài đổi mới sáng tạo thực tế, có giá trị cao.',
        tip: 'Quy tắc: Nơi nào có sự phàn nàn lặp đi lặp lại của người dùng, nơi đó có cơ hội cho đổi mới sáng tạo số.',
      },
      {
        stepNumber: 2,
        title: 'Động não & Kết hợp chéo công nghệ (Cross-Tech)',
        action: 'Thử nghiệm kết hợp các công nghệ khác nhau: AI tạo sinh + Bảng tính + Tự động hóa No-code để giải quyết đề bài.',
        output: 'Ý tưởng giải pháp độc đáo, vượt ra ngoài lối mòn truyền thống.',
        tip: 'Áp dụng câu hỏi "Điều gì sẽ xảy ra nếu...?" để phá vỡ các giả định rào cản thông thường.',
      },
      {
        stepNumber: 3,
        title: 'Tạo sản phẩm mẫu nhanh (Rapid Prototyping)',
        action: 'Xây dựng một bản thử nghiệm tối thiểu (MVP) trong vòng vài ngày bằng các công cụ kéo thả, chưa cần hoàn hảo.',
        output: 'Mẫu thử nghiệm trực quan có thể tương tác được ngay.',
        tip: 'Tốt hơn là hoàn thành một bản mẫu thô để nhận phản hồi sớm, hơn là ấp ủ một ý tưởng hoàn hảo trên giấy.',
      },
      {
        stepNumber: 4,
        title: 'Thu thập phản hồi & Lặp lại cải tiến (Iterate)',
        action: 'Đưa sản phẩm mẫu cho người dùng thật trải nghiệm, lắng nghe góp ý và liên tục cập nhật phiên bản tốt hơn.',
        output: 'Giải pháp số hoàn thiện, được người dùng thực tế yêu thích.',
        tip: 'Xem phản hồi tiêu cực là món quà giá trị nhất để nâng cấp sản phẩm sắc bén hơn.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Biết sử dụng công nghệ số để thể hiện ý tưởng sáng tạo cá nhân (làm thiệp điện tử, vẽ tranh số, làm video kỷ niệm).',
        keySkills: ['Sử dụng công cụ thiết kế đồ họa tạo sản phẩm sáng tạo', 'Kết hợp âm nhạc và hình ảnh thành video cảm xúc', 'Biết cách chia sẻ tác phẩm sáng tạo lên nền tảng số'],
        contextExample: 'Tự làm một video clip hoạt hình ngắn chúc mừng sinh nhật bạn bè bằng Canva.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Vận dụng công cụ số để cải tiến cách thức học tập và làm việc của nhóm, áp dụng kỹ thuật prompt sáng tạo cùng AI.',
        keySkills: ['Khai thác AI tạo sinh để đồng sáng tạo kịch bản, ý tưởng mới', 'Tự tạo chatbot trả lời tự động cho câu lạc bộ', 'Xây dựng website cá nhân giới thiệu dự án'],
        contextExample: 'Tạo một trang web giới thiệu đặc sản quê hương với bản đồ tương tác và hướng dẫn âm thanh.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Chủ trì các dự án đổi mới sáng tạo số giải quyết vấn đề cộng đồng hoặc nâng cao hiệu suất tổ chức rõ rệt.',
        keySkills: ['Thiết kế và triển khai giải pháp MVP hoàn chỉnh', 'Ứng dụng tư duy thiết kế (Design Thinking) trong kỷ nguyên số', 'Dẫn dắt các buổi hội thảo đổi mới sáng tạo (Hackathon)'],
        contextExample: 'Xây dựng ứng dụng kết nối từ thiện tự động ghép nối người cần giúp đỡ với nhà hảo tâm tại địa phương.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Kiến tạo văn hóa đổi mới sáng tạo số cho tổ chức, bảo trợ các sáng kiến công nghệ đột phá có tầm ảnh hưởng xã hội.',
        keySkills: ['Xây dựng vườn ươm sáng kiến số doanh nghiệp', 'Thúc đẩy chuyển đổi số sáng tạo trong cộng đồng', 'Thương mại hóa các phát minh và giải pháp số'],
        contextExample: 'Dẫn dắt trung tâm đổi mới sáng tạo quốc gia, hỗ trợ hàng chục dự án khởi nghiệp công nghệ tiềm năng.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI là chất xúc tác mạnh mẽ cho sáng tạo: Đóng vai trò phản biện ý tưởng, mở rộng góc nhìn và hiện thực hóa bản mẫu cực nhanh.',
      ethicalChecklist: [
        'Sử dụng công nghệ để tạo ra giá trị nhân văn, không tạo các giải pháp gây hại xã hội',
        'Đảm bảo giải pháp số bao trùm, người khuyết tật và người yếu thế cũng có thể tiếp cận được',
        'Tôn trọng bản quyền và sự đóng góp của các thành viên trong nhóm sáng tạo',
      ],
      riskWarning: 'Đừng để sự màu mè của công nghệ che lấp giá trị thực tế; giải pháp dù hiện đại đến đâu cũng phải giải quyết được vấn đề thực.',
    },
    commonPitfalls: [
      {
        mistake: 'Chờ đợi ý tưởng thật hoàn hảo và có đủ kinh phí lớn mới chịu bắt đầu làm.',
        consequence: 'Ý tưởng mãi mãi nằm trên giấy và cơ hội sẽ trôi qua tay người khác.',
        bestPractice: 'Áp dụng triết lý "Làm nhanh, thử sai nhanh" (Fail fast, learn fast) với các công cụ miễn phí có sẵn.',
      },
      {
        mistake: 'Yêu thích giải pháp công nghệ của mình đến mức phớt lờ phản hồi thực tế của người dùng.',
        consequence: 'Tạo ra sản phẩm không ai muốn sử dụng vì không giải quyết đúng nhu cầu.',
        bestPractice: 'Luôn lấy người dùng làm trung tâm; sẵn sàng thay đổi tính năng dựa trên phản hồi của người dùng.',
      },
    ],
    recommendedTools: [
      { category: 'Sáng tạo bản mẫu & Giao diện', tools: ['Figma', 'Webflow', 'Glide Apps (làm app không code)'] },
      { category: 'Động não & Kết nối ý tưởng', tools: ['Miro', 'Mindmeister', 'ChatGPT Advanced Voice'] },
    ],
    selfChecklist: [
      'Tôi luôn chủ động tìm cách áp dụng công nghệ mới để làm việc nhanh hơn và thông minh hơn.',
      'Tôi không ngại thử nghiệm các công cụ số mới dù chưa có ai trong nhóm từng sử dụng.',
      'Tôi sẵn sàng lắng nghe góp ý để cải tiến giải pháp của mình ngày một tốt hơn.',
    ],
  },

  '5.4': {
    skillCode: '5.4',
    domainCode: '05',
    domainNumber: 5,
    domainTitle: 'Giải quyết Vấn đề số',
    title: 'Nhận diện khoảng trống năng lực số và tự nâng cao',
    badge: 'Trạm 04 • Miền 5',
    headline: 'Thấu hiểu bản đồ năng lực cá nhân, phát hiện khoảng trống kỹ năng và chủ động học tập suốt đời trong kỷ nguyên số.',
    overview: 'Công nghệ thay đổi từng ngày; những gì chúng ta học hôm nay có thể trở nên lỗi thời sau vài năm. Năng lực nhận diện khoảng trống số là kim chỉ nam cho hành trình học tập suốt đời. Đây cũng chính là triết lý cốt lõi của NEXA: Giúp bạn tự soi chiếu hồ sơ năng lực số, nhận diện vùng còn yếu và kiên trì rèn luyện từng nấc nhỏ để không ngừng phát triển.',
    targetOutcome: 'Tự đánh giá chính xác trình độ số của bản thân, lập lộ trình học tập cá nhân hóa và duy trì tâm thế học tập suốt đời.',
    workflow: [
      {
        stepNumber: 1,
        title: 'Tự đánh giá định kỳ trên NEXA',
        action: 'Thực hiện các bài khảo thí chuẩn hóa trên nền tảng NEXA để đo lường điểm số thực tế trên các miền năng lực số.',
        output: 'Hồ sơ năng lực số và biểu đồ phân tích khoảng trống trực quan.',
        tip: 'Làm bài thi với thái độ trung thực nhất; điểm số phản ánh đúng thực trạng sẽ giúp lộ trình bồi dưỡng trúng đích hơn.',
      },
      {
        stepNumber: 2,
        title: 'Phân tích nguyên nhân & Xác định trọng tâm bù đắp',
        action: 'Xem lại giải thích chi tiết của các câu làm sai; xác định kỹ năng nào còn thiếu (thiếu kiến thức, thiếu thao tác hay thiếu tư duy an toàn).',
        output: 'Kế hoạch học tập cá nhân hóa với mục tiêu rõ ràng.',
        tip: 'Ưu tiên khắc phục những miền năng lực đang dưới ngưỡng chuẩn mục tiêu 70% trước khi học các kỹ năng nâng cao.',
      },
      {
        stepNumber: 3,
        title: 'Thực hành luyện tập theo lộ trình trạm',
        action: 'Dành 15-20 phút mỗi ngày đọc tài liệu cẩm nang trạm, thực hiện các bài tập thực hành và kiểm chứng vượt trạm.',
        output: 'Kỹ năng được bồi đắp lũy tiến từng nấc vững chắc (+1-2% điểm năng lực theo bằng chứng).',
        tip: 'Học đi đôi với hành: Thử áp dụng ngay kỹ năng vừa học vào chính công việc hoặc bài tập trường học hàng ngày.',
      },
      {
        stepNumber: 4,
        title: 'Đánh giá lại & Lan tỏa tri thức',
        action: 'Làm lại bài kiểm chứng sau khi ôn tập; chia sẻ kinh nghiệm học tập số cho bạn bè và cộng đồng.',
        output: 'Năng lực được chứng thực bằng chứng chỉ số và sự tự tin vững vàng.',
        tip: 'Dạy lại người khác là cách tốt nhất để củng cố và làm chủ hoàn toàn một kỹ năng mới.',
      },
    ],
    levels: [
      {
        levelNumber: 1,
        levelName: 'Cơ bản',
        standard: 'Nhận thức được những kỹ năng số mình còn yếu; biết tìm kiếm các video hướng dẫn hoặc khóa học trực tuyến miễn phí.',
        keySkills: ['Xem kết quả đánh giá năng lực số của bản thân', 'Tìm video hướng dẫn sử dụng phần mềm trên YouTube', 'Tham gia các khóa học nhập môn kỹ năng số'],
        contextExample: 'Nhận thấy mình chưa biết làm biểu đồ Excel nên chủ động tìm video hướng dẫn 15 phút để học theo.',
      },
      {
        levelNumber: 2,
        levelName: 'Trung cấp',
        standard: 'Tự thiết lập lộ trình học tập số cá nhân hóa, lựa chọn các khóa học uy tín và kiên trì hoàn thành mục tiêu bồi dưỡng.',
        keySkills: ['Lập thời gian biểu học tập số hàng tuần', 'Đánh giá chất lượng các khóa học trực tuyến (MOOCs)', 'Tích lũy các chứng chỉ số uy tín'],
        contextExample: 'Hoàn thành lộ trình luyện tập 5 trạm năng lực số trên NEXA để nâng điểm hồ sơ từ Cơ bản lên Trung cấp.',
      },
      {
        levelNumber: 3,
        levelName: 'Nâng cao',
        standard: 'Chủ động thích ứng nhanh với các công nghệ mới nổi (AI, Blockchain), hướng dẫn và cố vấn lộ trình số cho người khác.',
        keySkills: ['Theo dõi các báo cáo xu hướng công nghệ tương lai', 'Thử nghiệm và đánh giá sớm các công cụ AI mới ra mắt', 'Cố vấn kỹ năng số cho đồng nghiệp trong tổ chức'],
        contextExample: 'Chủ động học cách sử dụng các mô hình ngôn ngữ lớn ngay khi mới xuất hiện và mở buổi chia sẻ cho câu lạc bộ.',
      },
      {
        levelNumber: 4,
        levelName: 'Chuyên sâu',
        standard: 'Định hình chiến lược phát triển nguồn nhân lực số cho tổ chức, nghiên cứu và phát triển các khung chuẩn năng lực số tương lai.',
        keySkills: ['Xây dựng khung năng lực số đặc thù cho ngành nghề', 'Thiết kế chương trình đào tạo chuyển đổi số toàn diện', 'Thúc đẩy phong trào học tập suốt đời trong kỷ nguyên số'],
        contextExample: 'Hoạch định chiến lược nâng cao năng lực số cho toàn bộ đội ngũ giảng viên và hàng ngàn sinh viên của trường đại học.',
      },
    ],
    aiGuidelines: {
      roleOfAI: 'AI là gia sư học tập cá nhân hóa 24/7: Giải đáp thắc mắc chuyên sâu, gợi ý bài tập phù hợp với trình độ và giải thích các khái niệm khó hiểu.',
      ethicalChecklist: [
        'Duy trì tính tò mò và tư duy độc lập, không để AI suy nghĩ thay hoàn toàn cho bản thân',
        'Kiên định mục tiêu học tập bền bỉ, không tìm cách gian lận điểm số trong các bài khảo thí',
        'Tận dụng sức mạnh của AI để học nhanh hơn, hiểu sâu hơn và sáng tạo nhiều hơn',
      ],
      riskWarning: 'Ảo tưởng về năng lực do ỷ lại vào AI sẽ khiến người học mất đi phản xạ tư duy tự thân khi không có kết nối mạng.',
    },
    commonPitfalls: [
      {
        mistake: 'Tự ái hoặc nản lòng khi thấy điểm số đánh giá ban đầu còn thấp.',
        consequence: 'Bỏ cuộc và tiếp tục để lại các lỗ hổng kỹ năng số gây cản trở công việc lâu dài.',
        bestPractice: 'Hiểu rằng điểm số là chiếc gương soi hiện trạng; phát hiện ra khoảng trống chính là bước đầu tiên để tiến bộ.',
      },
      {
        mistake: 'Đăng ký dồn dập hàng chục khóa học trên mạng nhưng không bao giờ học hết hoặc không thực hành.',
        consequence: 'Lãng phí thời gian, tích lũy chứng chỉ rỗng mà không hình thành kỹ năng thực chiến.',
        bestPractice: 'Học từng kỹ năng nhỏ (Micro-learning): Mỗi ngày 15 phút, học đến đâu thực hành ngay trên máy đến đó.',
      },
    ],
    recommendedTools: [
      { category: 'Nền tảng đánh giá & Học tập số', tools: ['NEXA AI Digital Competency Platform', 'Coursera', 'edX'] },
      { category: 'Cập nhật tin tức công nghệ mới', tools: ['TechCrunch', 'MIT Technology Review', 'VnExpress Số Hóa'] },
    ],
    selfChecklist: [
      'Tôi biết rõ miền năng lực số nào của mình đang cần củng cố nhất.',
      'Tôi duy trì thói quen học thêm ít nhất một kỹ năng số mới mỗi tháng.',
      'Tôi tự hào về hành trình tích lũy tiến bộ bền bỉ của bản thân trên NEXA.',
    ],
  },
};

/**
 * Hàm lấy tài liệu chi tiết của một trạm năng lực theo mã kỹ năng (ví dụ: '3.1' hoặc '3-1')
 */
export function getStationDoc(skillCode: string): StationDocItem | null {
  if (!skillCode) return null;
  const normalizedCode = skillCode.replace('-', '.').trim();
  return COMPETENCY_STATION_DOCS[normalizedCode] || null;
}
