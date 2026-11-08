'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Edit3,
  Search,
  CheckCircle2,
  X,
  Plus,
  Save,
  Info,
  Laptop,
  Users,
  PenTool,
  ShieldCheck,
  Cpu,
  Share2,
} from 'lucide-react';

interface CompetencyItem {
  id: string;
  skill_code: string;
  title: string;
  description?: string;
  target_level: number;
  display_order: number;
}

interface CompetencyDomainItem {
  id: string;
  code: string;
  title: string;
  description: string;
  domain_index: number;
  competencies: CompetencyItem[];
}

interface FrameworkItem {
  id: string;
  code: string;
  title: string;
  version: string;
  description: string;
  status: string;
}

const defaultDomainsData = [
  {
    index: '01',
    code: 'DOM-01',
    title: 'Miền 01 — Thông tin và Dữ liệu',
    description: 'Xác định, tìm kiếm, đánh giá, quản lý và sử dụng thông tin, dữ liệu số một cách hiệu quả, đáng tin cậy và có trách nhiệm.',
    icon: Laptop,
    skills: [
      { code: '01.1', title: 'Tìm kiếm thông tin', desc: 'Xác định nhu cầu và tìm kiếm thông tin số phù hợp, hiệu quả.' },
      { code: '01.2', title: 'Đánh giá thông tin', desc: 'Phân tích, đối chiếu và đánh giá độ tin cậy, tính phù hợp của thông tin.' },
      { code: '01.3', title: 'Quản lý dữ liệu', desc: 'Tổ chức, lưu trữ và quản lý dữ liệu số một cách an toàn, có hệ thống.' },
      { code: '01.4', title: 'Phân tích dữ liệu', desc: 'Hiểu và rút ra thông tin, insight từ dữ liệu bằng công cụ số cơ bản.' },
      { code: '01.5', title: 'Sử dụng và chia sẻ thông tin', desc: 'Sử dụng, trích dẫn và chia sẻ thông tin, dữ liệu đúng mục đích và có trách nhiệm.' },
    ],
  },
  {
    index: '02',
    code: 'DOM-02',
    title: 'Miền 02 — Giao tiếp và Hợp tác',
    description: 'Giao tiếp, tương tác, hợp tác và tham gia hiệu quả, an toàn, có trách nhiệm trong môi trường số.',
    icon: Users,
    skills: [
      { code: '02.1', title: 'Giao tiếp trong môi trường số', desc: 'Trao đổi thông tin rõ ràng, phù hợp và tôn trọng trong các kênh số.' },
      { code: '02.2', title: 'Hợp tác trực tuyến', desc: 'Làm việc cùng người khác trên các nền tảng số, chia sẻ và đồng tạo nội dung hiệu quả.' },
      { code: '02.3', title: 'Quản lý danh tính số', desc: 'Xây dựng và duy trì hình ảnh, danh tính cá nhân phù hợp, an toàn trên môi trường số.' },
      { code: '02.4', title: 'Tham gia cộng đồng số', desc: 'Tham gia tích cực, có trách nhiệm vào các cộng đồng và hoạt động xã hội số.' },
    ],
  },
  {
    index: '03',
    code: 'DOM-03',
    title: 'Miền 03 — Sáng tạo Nội dung số',
    description: 'Tạo, chỉnh sửa, tích hợp và chia sẻ nội dung số, đồng thời hiểu và tôn trọng quyền sở hữu trí tuệ.',
    icon: PenTool,
    skills: [
      { code: '03.1', title: 'Tạo nội dung số', desc: 'Thiết kế, xây dựng nội dung số (văn bản, hình ảnh, âm thanh, video...) phù hợp với mục tiêu.' },
      { code: '03.2', title: 'Chỉnh sửa và phát triển nội dung', desc: 'Chỉnh sửa, nâng cấp và hoàn thiện nội dung số bằng các công cụ phù hợp.' },
      { code: '03.3', title: 'Tích hợp và tái sử dụng', desc: 'Kết hợp, phối trộn và tái sử dụng nội dung số một cách hiệu quả và hợp pháp.' },
      { code: '03.4', title: 'Tôn trọng quyền sở hữu trí tuệ', desc: 'Nhận biết và tuân thủ quy định về bản quyền, trích dẫn và sử dụng tài nguyên số có phép.' },
    ],
  },
  {
    index: '04',
    code: 'DOM-04',
    title: 'Miền 04 — An toàn & Bảo mật',
    description: 'Bảo vệ thiết bị, nội dung, dữ liệu cá nhân, quyền riêng tư trong môi trường số và bảo vệ sức khỏe.',
    icon: ShieldCheck,
    skills: [
      { code: '04.1', title: 'Bảo vệ thiết bị', desc: 'Cài đặt và áp dụng các biện pháp bảo vệ thiết bị số trước rủi ro và mã độc.' },
      { code: '04.2', title: 'Bảo vệ dữ liệu cá nhân', desc: 'Bảo mật thông tin đăng nhập, dữ liệu riêng tư và quản trị quyền truy cập ứng dụng.' },
      { code: '04.3', title: 'Bảo vệ sức khỏe & phúc lợi', desc: 'Cân bằng thời gian sử dụng màn hình, nhận diện và phòng ngừa rủi ro tâm lý trên mạng.' },
      { code: '04.4', title: 'Bảo vệ môi trường', desc: 'Ý thức tác động môi trường của thiết bị số và sử dụng tài nguyên công nghệ bền vững.' },
    ],
  },
  {
    index: '05',
    code: 'DOM-05',
    title: 'Miền 05 — Giải quyết vấn đề',
    description: 'Nhận diện nhu cầu và vấn đề kỹ thuật, giải quyết vấn đề thông qua công nghệ số một cách sáng tạo.',
    icon: Cpu,
    skills: [
      { code: '05.1', title: 'Giải quyết sự cố kỹ thuật', desc: 'Xác định và xử lý các lỗi kỹ thuật cơ bản của phần cứng, phần mềm và mạng.' },
      { code: '05.2', title: 'Xác định nhu cầu công nghệ', desc: 'Đánh giá nhu cầu và lựa chọn công cụ số phù hợp để đạt mục tiêu công việc.' },
      { code: '05.3', title: 'Ứng dụng số sáng tạo', desc: 'Sử dụng công nghệ số và AI để đổi mới quy trình và tạo giải pháp mới.' },
      { code: '05.4', title: 'Nhận diện khoảng trống năng lực', desc: 'Tự đánh giá năng lực số, phát hiện lỗ hổng và chủ động cập nhật kỹ năng mới.' },
    ],
  },
];

export default function AdminFrameworksPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    '01': true,
    '02': true,
    '03': true,
    '04': true,
    '05': true,
  });

  const [editingSkill, setEditingSkill] = useState<{ code: string; title: string; desc: string } | null>(null);

  const toggleSection = (index: string) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Khung năng lực số chuẩn hóa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Quản lý 5 miền năng lực cốt lõi và 21 kỹ năng thành phần dùng toàn nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => alert('Đã đồng bộ khung năng lực số phiên bản 2.1.0 mới nhất.')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm mới</span>
          </button>
          <Link
            href="/framework"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Xem trang công khai</span>
          </Link>
        </div>
      </div>

      {/* 2. Summary Bar (Chuẩn Ảnh 7) */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200/70 dark:border-blue-900/50">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Phiên bản 2.1.0</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 font-semibold text-xs border border-slate-100 dark:border-zinc-800">
            5 miền
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 font-semibold text-xs border border-slate-100 dark:border-zinc-800">
            21 kỹ năng
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Khung năng lực số được chuẩn hóa theo EU DigComp 2.2 và định hướng Việt Nam, bảo đảm tính quốc tế, phù hợp bối cảnh, và sử dụng thống nhất trên toàn nền tảng.
          </span>
        </div>
      </div>

      {/* 3. 5 Domain Cards (Chuẩn Ảnh 7) */}
      <div className="space-y-4">
        {defaultDomainsData.map((domain) => {
          const isOpen = openSections[domain.index];
          const DomainIcon = domain.icon;

          return (
            <div
              key={domain.index}
              className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(domain.index)}
                className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                    <DomainIcon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {domain.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        {domain.skills.length} kỹ năng
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                      {domain.description}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Skills Grid */}
              {isOpen && (
                <div className="p-5 pt-0 mt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
                    {domain.skills.map((skill) => (
                      <div
                        key={skill.code}
                        className="bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/70 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition-all text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono font-bold text-[10px]">
                              {skill.code}
                            </span>
                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                              {skill.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                            {skill.desc}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5">
                          <button
                            onClick={() => setEditingSkill(skill)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Chỉnh sửa</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Edit Skill Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Chỉnh sửa kỹ năng {editingSkill.code}: {editingSkill.title}
              </h3>
              <button
                onClick={() => setEditingSkill(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Tên kỹ năng
                </label>
                <input
                  type="text"
                  value={editingSkill.title}
                  onChange={(e) => setEditingSkill({ ...editingSkill, title: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Mô tả hành vi năng lực
                </label>
                <textarea
                  rows={4}
                  value={editingSkill.desc}
                  onChange={(e) => setEditingSkill({ ...editingSkill, desc: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setEditingSkill(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  alert('Đã lưu cấu hình kỹ năng chuẩn thành công!');
                  setEditingSkill(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
