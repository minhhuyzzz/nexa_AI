export interface ContributionFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface ContributionItem {
  id: string;
  code: string;
  title: string;
  domain: string;
  questionType: 'PRACTICAL_FILE' | 'SCENARIO' | 'MCQ' | 'DIGITAL_LINK';
  difficulty: 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  status: 'pending' | 'approved' | 'needs_revision';
  submittedAt: string;
  reviewedAt?: string;
  pointsRewarded?: number;
  prompt: string;
  solutionNotes: string;
  adminFeedback?: string;
  attachedFiles: ContributionFile[];
}

export const initialContributions: ContributionItem[] = [
  {
    id: 'contrib-01',
    code: 'NEXA-CONTRIB-782194',
    title: 'Xử lý tình huống nhân viên vô tình sao chép dữ liệu khách hàng vào công cụ AI dịch thuật công cộng',
    domain: 'D4: An toàn & Bảo mật',
    questionType: 'SCENARIO',
    difficulty: 'ADVANCED',
    status: 'approved',
    submittedAt: '12/10/2026 14:20',
    reviewedAt: '13/10/2026 09:15',
    pointsRewarded: 100,
    prompt:
      'Một nhân viên kinh doanh sử dụng công cụ dịch thuật AI trực tuyến miễn phí để dịch bản hợp đồng chứa thông tin liên hệ và số CMND/CCCD của 50 khách hàng VIP sang tiếng Anh. Hãy xây dựng quy trình ứng phó 3 bước khẩn cấp nhằm ngăn chặn việc mô hình AI bên thứ ba sử dụng dữ liệu này để huấn luyện và báo cáo vi phạm dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.',
    solutionNotes:
      'Tiêu chuẩn đạt: (1) Cách ly phiên làm việc và gửi yêu cầu xóa dữ liệu đến nhà cung cấp dịch vụ AI; (2) Lập biên bản sự cố rủi ro thông tin nội bộ; (3) Kích hoạt thông báo bảo mật và rà soát hệ thống DLP nội bộ.',
    adminFeedback:
      'Đề xuất tình huống rất sát với thực tiễn các doanh nghiệp hiện nay. Đã được Hội đồng Thẩm định Học thuật phê duyệt và đưa vào Ngân hàng bài thi chuẩn hóa Miền D4.',
    attachedFiles: [
      {
        id: 'f-01',
        name: 'TinhHuong_BaoMat_DichThuatAI.docx',
        size: '1.4 MB',
        type: 'docx',
      },
      {
        id: 'f-02',
        name: 'BaremDiem_Rubric_ChiTiet.pdf',
        size: '520 KB',
        type: 'pdf',
      },
    ],
  },
  {
    id: 'contrib-02',
    code: 'NEXA-CONTRIB-891042',
    title: 'Thực hành phân tích dòng tiền và tự động hóa báo cáo doanh số bằng Power Query & XLOOKUP nâng cao',
    domain: 'D1: Thông tin & Dữ liệu',
    questionType: 'PRACTICAL_FILE',
    difficulty: 'INTERMEDIATE',
    status: 'pending',
    submittedAt: '16/10/2026 18:30',
    prompt:
      'Cung cấp tập dữ liệu thô gồm 1,200 giao dịch bán hàng từ 3 chi nhánh với nhiều dòng trống và sai định dạng ngày tháng. Người học cần làm sạch dữ liệu bằng Power Query, sử dụng hàm XLOOKUP lồng nhau để đối soát bảng giá và tạo Pivot Chart trực quan hóa cơ cấu doanh thu theo khu vực.',
    solutionNotes:
      'Kiểm tra tính chính xác của công thức XLOOKUP, độ sạch của bảng dữ liệu sau ETL và định dạng hiển thị của biểu đồ.',
    adminFeedback:
      'Hồ sơ đang được Hội đồng Thẩm định Học thuật NEXA đối soát dữ liệu mẫu và barem chấm điểm tự động. Dự kiến hoàn thành trong 24 giờ tới.',
    attachedFiles: [
      {
        id: 'f-03',
        name: 'TapDuLieu_KhaoSat_Mau_1200Dong.xlsx',
        size: '2.8 MB',
        type: 'xlsx',
      },
      {
        id: 'f-04',
        name: 'DeBai_Va_YeuCauThucHanh.docx',
        size: '890 KB',
        type: 'docx',
      },
    ],
  },
  {
    id: 'contrib-03',
    code: 'NEXA-CONTRIB-645312',
    title: 'Bộ câu hỏi trắc nghiệm: Bản quyền tài sản số và các giấy phép sở hữu trí tuệ Creative Commons (CC)',
    domain: 'D3: Sáng tạo Nội dung số',
    questionType: 'MCQ',
    difficulty: 'INTERMEDIATE',
    status: 'needs_revision',
    submittedAt: '08/10/2026 10:00',
    reviewedAt: '09/10/2026 15:40',
    prompt:
      'Bộ gồm 5 câu hỏi trắc nghiệm kiểm tra hiểu biết của người học về sự khác biệt giữa các loại giấy phép CC-BY, CC-BY-SA và CC-BY-NC trong môi trường làm việc số và xuất bản nội dung số.',
    solutionNotes:
      'Đáp án chuẩn cho 5 câu hỏi có phân tích nguồn luật và chuẩn mực quốc tế.',
    adminFeedback:
      'Ý tưởng câu hỏi tốt nhưng cần bổ sung thêm 2 câu hỏi tình huống thực tế về giấy phép CC-BY-NC-ND khi doanh nghiệp sử dụng tài sản ảnh miễn phí vào ấn phẩm thương mại. Vui lòng cập nhật lại đề bài.',
    attachedFiles: [
      {
        id: 'f-05',
        name: 'NganHangCauHoi_BanQuyenSo.docx',
        size: '760 KB',
        type: 'docx',
      },
    ],
  },
];
