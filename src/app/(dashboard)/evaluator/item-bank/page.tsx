'use client';

import { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Copy,
  CheckSquare,
  FileText,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers,
  Upload,
  Link as LinkIcon,
  Check,
  X,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  code: string;
  domain: string;
  skill: string;
  type: 'MCQ' | 'SCENARIO' | 'PRACTICAL_FILE' | 'DIGITAL_LINK';
  prompt: string;
  rubricWeight: number; // e.g. 25%
  isNexaStandard: boolean;
  sampleAnswerCriteria: string;
}

const mockQuestions: QuestionItem[] = [
  {
    id: 'q-01',
    code: 'D1.1-MCQ-01',
    domain: 'D1: Thông tin & Dữ liệu',
    skill: '1.1 Duyệt, tìm kiếm và lọc dữ liệu',
    type: 'MCQ',
    prompt: 'Kú pháp toán tử tìm kiếm nào sau đây cho phép lọc chính xác tập tin định dạng PDF trên công cụ tìm kiếm?',
    rubricWeight: 10,
    isNexaStandard: true,
    sampleAnswerCriteria: 'Đáp án đúng: filetype:pdf. Chấm tự động 100% bằng code thuần (0.01s).',
  },
  {
    id: 'q-02',
    code: 'D4.2-MCQ-02',
    domain: 'D4: An toàn & Bảo mật',
    skill: '4.2 Bảo vệ dữ liệu cá nhân & quyền riêng tư',
    type: 'MCQ',
    prompt: 'Khi nhận email yêu cầu khẩn cấp cập nhật mật khẩu nội bộ qua đường link lạ, thao tác an toàn nhất là gì?',
    rubricWeight: 10,
    isNexaStandard: true,
    sampleAnswerCriteria: 'Đáp án đúng: Không click link, kiểm tra địa chỉ người gửi và báo bộ phận an ninh mạng.',
  },
  {
    id: 'q-03',
    code: 'D3.2-SCN-01',
    domain: 'D3: Sáng tạo Nội dung số',
    skill: '3.2 Tích hợp & Tái cấu trúc nội dung số',
    type: 'SCENARIO',
    prompt: 'Xử lý tình huống nhân viên sử dụng mã nguồn mở không ghi công bản quyền khi đóng gói sản phẩm phần mềm thương mại.',
    rubricWeight: 20,
    isNexaStandard: true,
    sampleAnswerCriteria: 'Yêu cầu chỉ rõ giấy phép MIT/GPL/Apache, giải pháp rà soát dependency và bổ sung LICENSE file.',
  },
  {
    id: 'q-04',
    code: 'D1.3-SCN-02',
    domain: 'D1: Thông tin & Dữ liệu',
    skill: '1.3 Đánh giá dữ liệu, thông tin & nội dung số',
    type: 'SCENARIO',
    prompt: 'Thẩm định độ tin cậy của bài phân tích thị trường do AI tạo ra có chứa số liệu thống kê nhưng không có nguồn kiểm chứng.',
    rubricWeight: 20,
    isNexaStandard: true,
    sampleAnswerCriteria: 'Nhận diện rủi ro AI Hallucination, phương pháp Fact-checking chéo và thẩm tra nguồn sơ cấp.',
  },
  {
    id: 'q-05',
    code: 'D1.2-FIL-01',
    domain: 'D1: Thông tin & Dữ liệu',
    skill: '1.2 Xử lý và phân tích dữ liệu',
    type: 'PRACTICAL_FILE',
    prompt: 'Tải lên bảng tính Excel (.xlsx) xử lý tập dữ liệu khảo sát 500 khách hàng, sử dụng hàm XLOOKUP/INDEX-MATCH và biểu đồ phân tích.',
    rubricWeight: 20,
    isNexaStandard: false,
    sampleAnswerCriteria: 'Rubric: Cấu trúc bảng tính sạch (5đ), sử dụng hàm động chính xác (10đ), trực quan hóa biểu đồ (5đ). AI OCR hoặc giảng viên chấm.',
  },
  {
    id: 'q-06',
    code: 'D4.1-FIL-02',
    domain: 'D4: An toàn & Bảo mật',
    skill: '4.1 Bảo vệ thiết bị & danh tính số',
    type: 'PRACTICAL_FILE',
    prompt: 'Nộp tệp tin PDF tài liệu hướng dẫn thiết lập bảo mật 2 lớp (2FA) và chính sách mật khẩu mạnh cho phòng ban làm việc.',
    rubricWeight: 20,
    isNexaStandard: false,
    sampleAnswerCriteria: 'Rubric: Các bước hướng dẫn TOTP Authenticator (10đ), giải pháp lưu trữ backup code an toàn (10đ).',
  },
  {
    id: 'q-07',
    code: 'D3.1-LNK-01',
    domain: 'D3: Sáng tạo Nội dung số',
    skill: '3.1 Phát triển nội dung số',
    type: 'DIGITAL_LINK',
    prompt: 'Nộp liên kết kho mã nguồn GitHub công khai của dự án trang web cá nhân, kèm tệp README.md trình bày kiến trúc và hướng dẫn cài đặt.',
    rubricWeight: 20,
    isNexaStandard: true,
    sampleAnswerCriteria: 'Rubric: Cấu trúc repo chuẩn git (5đ), README rõ ràng (10đ), chạy được demo trực tiếp (5đ).',
  },
  {
    id: 'q-08',
    code: 'D2.2-LNK-02',
    domain: 'D2: Giao tiếp & Hợp tác',
    skill: '2.2 Chia sẻ thông tin và nội dung số',
    type: 'DIGITAL_LINK',
    prompt: 'Nộp liên kết workspace Notion / Google Drive chia sẻ tài liệu quy trình làm việc nhóm số hóa có phân quyền truy cập chuẩn xác.',
    rubricWeight: 20,
    isNexaStandard: true,
    sampleAnswerCriteria: 'Rubric: Đúng phân quyền xem/chỉnh sửa (10đ), cấu trúc cây thư mục khoa học (10đ).',
  },
];

const formatTypeLabel = (type: QuestionItem['type']) => {
  switch (type) {
    case 'MCQ': return 'Trắc nghiệm khách quan';
    case 'SCENARIO': return 'Xử lý tình huống';
    case 'PRACTICAL_FILE': return 'Thực hành nộp tệp tin';
    case 'DIGITAL_LINK': return 'Nộp liên kết số';
    default: return type;
  }
};

const formatTypeBadge = (type: QuestionItem['type']) => {
  switch (type) {
    case 'MCQ':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'SCENARIO':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'PRACTICAL_FILE':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'DIGITAL_LINK':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
};

export default function EvaluatorItemBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>(mockQuestions);
  const [activeType, setActiveType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [clonedId, setClonedId] = useState<string | null>(null);

  // Add question modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState<QuestionItem['type']>('MCQ');
  const [newDomain, setNewDomain] = useState('D1: Thông tin & Dữ liệu');
  const [newSkill, setNewSkill] = useState('1.1 Duyệt, tìm kiếm và lọc dữ liệu');
  const [newWeight, setNewWeight] = useState(20);
  const [newCriteria, setNewCriteria] = useState('');

  const filteredQuestions = questions.filter((q) => {
    const matchType = activeType === 'ALL' || q.type === activeType;
    const matchSearch =
      q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.skill.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleClone = (id: string) => {
    setClonedId(id);
    const target = questions.find((q) => q.id === id);
    if (target) {
      const cloned: QuestionItem = {
        ...target,
        id: `q-${Date.now()}`,
        code: `${target.code}-CPY`,
      };
      setQuestions((prev) => [cloned, ...prev]);
    }
    setTimeout(() => setClonedId(null), 2000);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    const newQ: QuestionItem = {
      id: `q-${Date.now()}`,
      code: `Q-${Math.floor(100 + Math.random() * 900)}`,
      domain: newDomain,
      skill: newSkill,
      type: newType,
      prompt: newPrompt.trim(),
      rubricWeight: Number(newWeight),
      isNexaStandard: false,
      sampleAnswerCriteria: newCriteria.trim() || 'Tiêu chí đánh giá do giảng viên thiết lập.',
    };

    setQuestions((prev) => [newQ, ...prev]);
    setShowAddModal(false);
    setNewPrompt('');
    setNewCriteria('');
  };

  // File Upload / Parser Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadText, setUploadText] = useState(
    `Câu 1: Cú pháp tìm kiếm nào lọc chính xác tập tin định dạng PDF trên công cụ tìm kiếm?
A. filetype:pdf
B. format=pdf
C. doc:pdf
D. type:pdf
Đáp án: A
Miền: D1: Thông tin & Dữ liệu

Câu 2: Khi nhận email yêu cầu khẩn cấp cập nhật mật khẩu nội bộ từ địa chỉ lạ, giải pháp an toàn nhất là gì?
A. Không click vào đường dẫn, xác minh với quản trị mạng nội bộ
B. Bấm vào link để kiểm tra
C. Chuyển tiếp cho đồng nghiệp nhờ click hộ
D. Đăng nhập ngay để tránh khóa tài khoản
Đáp án: A
Miền: D4: An toàn & Bảo mật`
  );
  const [parsedPreviewCount, setParsedPreviewCount] = useState<number>(2);

  const handleImportParsedQuestions = () => {
    // Basic parser for questions
    const blocks = uploadText.split(/Câu \d+:/).filter(Boolean);
    const newItems: QuestionItem[] = blocks.map((block, idx) => {
      const lines = block.trim().split('\n');
      const prompt = lines[0] || 'Câu hỏi trắc nghiệm nhập từ tệp';
      const ansLine = lines.find((l) => l.toLowerCase().includes('đáp án:')) || 'Đáp án: A';
      const domainLine = lines.find((l) => l.toLowerCase().includes('miền:')) || 'D1: Thông tin & Dữ liệu';

      return {
        id: `q-imp-${Date.now()}-${idx}`,
        code: `IMP-${Math.floor(100 + Math.random() * 900)}`,
        domain: domainLine.replace(/Miền:\s*/i, '').trim(),
        skill: 'Khảo sát chuẩn hóa',
        type: 'MCQ',
        prompt: prompt.trim(),
        rubricWeight: 15,
        isNexaStandard: false,
        sampleAnswerCriteria: `${ansLine.trim()}. Tự động chấm khách quan 100%.`,
      };
    });

    if (newItems.length > 0) {
      setQuestions((prev) => [...newItems, ...prev]);
    }
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              NGÂN HÀNG CÂU HỎI &amp; TIÊU CHÍ RUBRIC
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ngân Hàng Câu Hỏi Đa Hình Thức
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý 4 hình thức khảo thí: Trắc nghiệm khách quan, Tình huống, Thực hành nộp tệp tin và Nộp liên kết số.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
            title="Tải tệp đề thi Word hoặc Excel để tự động bóc tách thành câu hỏi"
          >
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>Tải tệp đề thi (Word / Excel)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            placeholder="Tìm theo nội dung, mã hoặc kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả hình thức' },
            { id: 'MCQ', label: 'Trắc nghiệm' },
            { id: 'SCENARIO', label: 'Tình huống' },
            { id: 'PRACTICAL_FILE', label: 'Nộp tệp tin' },
            { id: 'DIGITAL_LINK', label: 'Nộp link số' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Không tìm thấy câu hỏi nào phù hợp với từ khóa và bộ lọc.
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {q.code}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${formatTypeBadge(
                      q.type
                    )}`}
                  >
                    {formatTypeLabel(q.type)}
                  </span>
                  {q.isNexaStandard && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                      Chuẩn hóa NEXA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    Trọng số Rubric:{' '}
                    <span className="font-bold text-slate-800">{q.rubricWeight}%</span>
                  </span>
                  <button
                    onClick={() => handleClone(q.id)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    {clonedId === q.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Đã nhân bản</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Nhân bản</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Prompt */}
              <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                {q.prompt}
              </p>

              {/* Skill & Rubric Criteria */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-slate-500">
                  <span className="font-semibold text-slate-700">Miền &amp; Kỹ năng:</span>{' '}
                  {q.domain} &bull; {q.skill}
                </div>
                <div className="text-[11px] text-slate-500 italic truncate max-w-md">
                  <span className="font-semibold text-slate-700 not-italic">Tiêu chí:</span>{' '}
                  {q.sampleAnswerCriteria}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-lg space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                Thêm Câu Hỏi Vào Ngân Hàng
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Hình thức câu hỏi khảo thí:
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as QuestionItem['type'])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                >
                  <option value="MCQ">Trắc nghiệm khách quan (Chấm tự động 0.01s)</option>
                  <option value="SCENARIO">Xử lý tình huống (Phán đoán / Phân tích)</option>
                  <option value="PRACTICAL_FILE">Thực hành nộp tệp tin (Excel, PDF, Zip)</option>
                  <option value="DIGITAL_LINK">Nộp liên kết số (GitHub, Figma, Notion, Drive)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nội dung đề bài / Câu hỏi:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập nội dung câu hỏi hoặc yêu cầu đề bài chi tiết..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tiêu chí Rubric / Đáp án chuẩn:
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả các tiêu chí đạt điểm hoặc đáp án chính xác..."
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Miền năng lực:
                  </label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="D1: Thông tin & Dữ liệu">D1: Thông tin & Dữ liệu</option>
                    <option value="D2: Giao tiếp & Hợp tác">D2: Giao tiếp & Hợp tác</option>
                    <option value="D3: Sáng tạo Nội dung số">D3: Sáng tạo Nội dung số</option>
                    <option value="D4: An toàn & Bảo mật">D4: An toàn & Bảo mật</option>
                    <option value="D5: Giải quyết Vấn đề">D5: Giải quyết Vấn đề</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Trọng số Rubric (%):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
                >
                  Lưu vào ngân hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Upload & Automatic Quiz Parser Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-xl w-full shadow-lg space-y-4 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Tải Tệp Đề Thi &amp; Tự Động Bóc Tách Câu Hỏi (Word / Excel)</span>
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-md border-2 border-dashed border-slate-200 bg-slate-50 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-semibold text-slate-800">
                Kéo thả tệp đề thi (.docx, .xlsx, .txt) vào đây hoặc dán nội dung
              </div>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Hệ thống hỗ trợ cấu trúc chuẩn: <code>Câu X: [Nội dung]</code> &bull; <code>A. [Lựa chọn]</code> &bull; <code>Đáp án: [A/B/C/D]</code>
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Xem trước nội dung trích xuất câu hỏi từ tệp:
              </label>
              <textarea
                rows={8}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="p-3 rounded-md bg-sky-50/50 border border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-800 font-medium">
                <Check className="w-4 h-4 text-sky-600" />
                <span>Đã phát hiện 2 câu hỏi trắc nghiệm hợp lệ</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Sẵn sàng thêm vào ngân hàng
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportParsedQuestions}
                className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
              >
                Lưu vào ngân hàng câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
