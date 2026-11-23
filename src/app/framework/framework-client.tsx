'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  PenTool,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  Compass,
  FileCheck2,
  Briefcase,
  GraduationCap,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';

export interface CompetencyItem {
  id: string;
  skill_code: string;
  title: string;
  description: string;
  target_level?: number;
}

export interface DomainItem {
  id: string;
  code: string;
  title: string;
  description: string;
  weight_percent?: number;
  competencies?: CompetencyItem[];
}

interface Props {
  domains: DomainItem[];
  frameworkTitle?: string;
  frameworkDescription?: string;
}

// Dữ liệu ứng dụng thực tiễn và kịch bản cho từng miền năng lực (chuẩn SaaS không kỹ thuật thô)
const DOMAIN_METADATA: Record<
  string,
  {
    icon: React.ElementType;
    badgeText: string;
    coreMission: string;
    practicalScenarios: Array<{ title: string; desc: string }>;
    workplaceOutcomes: Array<string>;
    assessmentFocus: string;
  }
> = {
  '01': {
    icon: Search,
    badgeText: 'Khai thác & Thẩm định Dữ liệu',
    coreMission:
      'Chủ động xác định nhu cầu dữ liệu, truy vấn nâng cao đa nguồn, đối chiếu kiểm chứng độ xác thực và tổ chức lưu trữ an toàn, khoa học.',
    practicalScenarios: [
      {
        title: 'Phát hiện tin giả & Ảo giác AI',
        desc: 'Nhận diện thông tin sai lệch, văn bản AI bịa nguồn và kiểm chứng chéo qua các cơ sở dữ liệu học thuật độc lập.',
      },
      {
        title: 'Quản trị dữ liệu theo quy tắc 3-2-1',
        desc: 'Tổ chức cây thư mục chuẩn mực, sao lưu định kỳ đa nền tảng và kiểm soát phiên bản tài liệu không bị trùng lặp.',
      },
    ],
    workplaceOutcomes: [
      'Tìm kiếm chính xác tài liệu nghiệp vụ trong thời gian ngắn nhất',
      'Đánh giá đúng mức độ tin cậy của báo cáo và số liệu thống kê',
      'Loại bỏ rủi ro sử dụng dữ liệu sai lệch trong ra quyết định',
    ],
    assessmentFocus:
      'Đo lường kỹ năng lọc thông tin đa điều kiện, phản xạ kiểm chứng nguồn gốc và tư duy quản lý tài nguyên số.',
  },
  '02': {
    icon: Users,
    badgeText: 'Hợp tác & Giao tiếp Đa kênh',
    coreMission:
      'Tương tác chuyên nghiệp trên không gian mạng, đồng biên tập tài liệu thời gian thực, quản lý danh tính số và xây dựng văn hóa ứng xử văn minh.',
    practicalScenarios: [
      {
        title: 'Đồng biên tập & Quản lý tiến độ nhóm',
        desc: 'Sử dụng công cụ cộng tác trực tuyến để phân công nhiệm vụ, theo dõi luồng công việc và kiểm soát quyền truy cập tài liệu.',
      },
      {
        title: 'Giao tiếp công vụ & Ứng xử số văn minh',
        desc: 'Tuân thủ quy chuẩn giao tiếp email, điều phối cuộc họp trực tuyến hiệu quả và bảo vệ uy tín thương hiệu cá nhân/tổ chức.',
      },
    ],
    workplaceOutcomes: [
      'Làm việc nhóm xuyên biên giới và từ xa liền mạch',
      'Bảo vệ dấu chân kỹ thuật số và phân quyền chia sẻ an toàn',
      'Ứng xử chuyên nghiệp, giảm thiểu xung đột giao tiếp trực tuyến',
    ],
    assessmentFocus:
      'Đo lường năng lực phối hợp tác vụ, ứng xử tình huống nhạy cảm và bảo mật kênh liên lạc nội bộ.',
  },
  '03': {
    icon: PenTool,
    badgeText: 'Sáng tạo Nội dung & Ứng dụng AI',
    coreMission:
      'Sản xuất và biên tập nội dung số đa phương tiện, tích hợp công nghệ AI tạo sinh có trách nhiệm, tuân thủ bản quyền và sở hữu trí tuệ.',
    practicalScenarios: [
      {
        title: 'Ứng dụng AI tạo sinh trong soạn thảo',
        desc: 'Tối ưu hóa câu lệnh (prompt engineering) để tóm tắt tài liệu, lập dàn ý báo cáo và thiết kế slide thuyết trình ấn tượng.',
      },
      {
        title: 'Tuân thủ bản quyền & Giấy phép mở',
        desc: 'Hiểu đúng giấy phép Creative Commons, trích dẫn chuẩn học thuật và tránh vi phạm bản quyền hình ảnh, âm thanh.',
      },
    ],
    workplaceOutcomes: [
      'Sản xuất tài liệu, ấn phẩm số chuyên nghiệp với năng suất cao',
      'Khai thác trợ lý AI như một đối tác cộng sự đắc lực',
      'Tuyệt đối an toàn về mặt pháp lý sở hữu trí tuệ',
    ],
    assessmentFocus:
      'Đo lường kỹ năng định dạng đa phương tiện, tư duy sáng tạo có trợ lực AI và đạo đức trích dẫn bản quyền.',
  },
  '04': {
    icon: ShieldCheck,
    badgeText: 'An toàn & Bảo mật Thông tin',
    coreMission:
      'Bảo vệ thiết bị và hệ thống trước các mối đe dọa mạng, phòng ngừa tấn công phi kỹ thuật (social engineering), bảo vệ dữ liệu cá nhân và cân bằng sức khỏe số.',
    practicalScenarios: [
      {
        title: 'Nhận diện tấn công giả mạo (Phishing)',
        desc: 'Phát hiện email, liên kết và tin nhắn lừa đảo tinh vi, áp dụng xác thực hai lớp (2FA) và quản lý mật khẩu mạnh.',
      },
      {
        title: 'Bảo vệ quyền riêng tư theo pháp luật',
        desc: 'Thực thi quy chuẩn bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, phòng tránh lộ lọt thông tin nhạy cảm.',
      },
    ],
    workplaceOutcomes: [
      'Ngăn chặn nguy cơ xâm nhập và lừa đảo qua mạng',
      'Bảo vệ tối đa bí mật kinh doanh và dữ liệu người dùng',
      'Thực hành công thái học và duy trì thể chất, tinh thần lành mạnh trong kỷ nguyên số',
    ],
    assessmentFocus:
      'Đo lường phản xạ phòng ngự an ninh mạng, thói quen thiết lập bảo mật và ý thức tuân thủ pháp lý số.',
  },
  '05': {
    icon: Cpu,
    badgeText: 'Giải quyết Vấn đề & Tư duy Số',
    coreMission:
      'Nhận diện nguyên nhân sự cố kỹ thuật số, lựa chọn giải pháp công nghệ tối ưu, tự động hóa tác vụ lặp lại và liên tục cập nhật năng lực mới.',
    practicalScenarios: [
      {
        title: 'Chẩn đoán & Xử lý sự cố công nghệ tức thì',
        desc: 'Khắc phục các lỗi phần mềm thông thường, sự cố kết nối mạng và xung đột hệ thống mà không cần phụ thuộc IT.',
      },
      {
        title: 'Tự động hóa luồng công việc thường nhật',
        desc: 'Kết nối các ứng dụng làm việc qua quy trình tự động, giảm thiểu thao tác thủ công và nâng cao hiệu suất làm việc.',
      },
    ],
    workplaceOutcomes: [
      'Khắc phục sự cố nhanh chóng, duy trì công việc liên tục',
      'Lựa chọn đúng công cụ công nghệ phù hợp với nhu cầu',
      'Tự cập nhật kiến thức công nghệ mới để thích ứng với biến động thị trường',
    ],
    assessmentFocus:
      'Đo lường tư duy giải quyết vấn đề bằng công nghệ, khả năng thích ứng công cụ mới và tiềm năng đổi mới sáng tạo.',
  },
};

export function FrameworkClient({ domains, frameworkTitle, frameworkDescription }: Props) {
  const [selectedCode, setSelectedCode] = useState<string>(domains[0]?.code || '01');

  // Lấy dữ liệu miền đang được chọn
  const activeDomain = domains.find((d) => d.code === selectedCode) || domains[0];
  const activeMeta = DOMAIN_METADATA[selectedCode] || DOMAIN_METADATA['01'];
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Hero Section — Tinh gọn, uy tín, chuẩn SaaS */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/70 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Hệ thống Đánh giá & Phát triển Năng lực Số</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 leading-[1.15]">
          Chuẩn hóa năng lực số toàn diện cho học tập và nghề nghiệp
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Được thiết kế dựa trên các tiêu chuẩn quốc tế hiện đại, hệ thống phân tách năng lực số thành các miền năng lực cốt lõi — giúp bạn định vị chính xác điểm mạnh và khoảng trống kỹ năng để bồi dưỡng đúng trọng tâm.
        </p>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto text-left">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cấu trúc</div>
            <div className="text-base font-bold text-neutral-900 font-mono tabular-nums">5 Miền cốt lõi</div>
            <div className="text-[11px] text-slate-500">Bao phủ toàn diện kỹ năng số</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Đánh giá</div>
            <div className="text-base font-bold text-neutral-900">Bằng chứng thực</div>
            <div className="text-[11px] text-slate-500">Dựa trên tình huống hành vi</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Định hướng</div>
            <div className="text-base font-bold text-neutral-900">Lộ trình thích ứng</div>
            <div className="text-[11px] text-slate-500">Tự động bù khoảng trống</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chứng nhận</div>
            <div className="text-base font-bold text-neutral-900">Chuẩn mực uy tín</div>
            <div className="text-[11px] text-slate-500">Xác thực chứng chỉ số QR</div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Domain Explorer (Trọng tâm trải nghiệm tương tác Animate UI) */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Khám phá 5 Miền Năng Lực Số
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Chọn một miền năng lực bên dưới để khám phá mục tiêu, kỹ năng hành động và các kịch bản giải quyết vấn đề thực tế.
          </p>
        </div>

        {/* Tab Selector — Interactive Pill Navigation */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs max-w-4xl mx-auto">
          {domains.map((dom) => {
            const isSelected = dom.code === selectedCode;
            const meta = DOMAIN_METADATA[dom.code] || DOMAIN_METADATA['01'];
            const TabIcon = meta.icon;

            return (
              <button
                key={dom.id || dom.code}
                type="button"
                onClick={() => setSelectedCode(dom.code)}
                className={`flex-1 min-w-[140px] sm:min-w-0 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-white text-neutral-900 shadow-sm border border-slate-200/80 ring-1 ring-blue-500/20'
                    : 'text-slate-600 hover:text-neutral-900 hover:bg-white/60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono font-bold text-slate-600">
                    MIỀN {dom.code}
                  </div>
                  <div className="text-xs font-semibold truncate leading-tight mt-0.5">
                    {dom.title.split('&')[0].trim()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bento Showcase for Selected Domain */}
        {activeDomain && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 transition-all duration-300">
            {/* Box 1: Core Mission & Action Pillars (7 cols) */}
            <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <ActiveIcon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
                      Miền {activeDomain.code} &bull; {activeMeta.badgeText}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">
                      {activeDomain.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {activeMeta.coreMission}
                </p>
              </div>

              {/* Competency Action Pillars */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Các trụ cột năng lực hành động</span>
                </div>

                <div className="space-y-2">
                  {(activeDomain.competencies || []).map((skill) => (
                    <div
                      key={skill.id || skill.skill_code}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-200 transition-colors flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {skill.skill_code}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-900">
                          {skill.title}
                        </div>
                        <div className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          {skill.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Scenarios & Workplace Value (5 cols) */}
            <div className="md:col-span-5 space-y-5 flex flex-col">
              {/* Box 2: Real-World Scenarios */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Kịch bản giải quyết vấn đề thực tế</span>
                </div>

                <div className="space-y-3">
                  {activeMeta.practicalScenarios.map((sc, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="text-xs font-semibold text-neutral-900">
                        {sc.title}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {sc.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: Workplace Outcomes */}
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Giá trị đạt được trong công việc</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  {activeMeta.workplaceOutcomes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Box 4: Evidence Assessment Notice */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-1">
                <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Phương thức kiểm chứng tại NEXA</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {activeMeta.assessmentFocus}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Full Overview Matrix (Ma trận tổng quan 5 miền) */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Toàn Cảnh Khung Năng Lực Số
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Mỗi miền năng lực giữ vai trò bổ trợ lẫn nhau, tạo nên chân dung năng lực số hoàn chỉnh cho công dân và người đi làm trong thời đại trí tuệ nhân tạo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {domains.map((dom) => {
            const meta = DOMAIN_METADATA[dom.code] || DOMAIN_METADATA['01'];
            const CardIcon = meta.icon;
            const isCurrent = dom.code === selectedCode;

            return (
              <div
                key={dom.id || dom.code}
                onClick={() => setSelectedCode(dom.code)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      MIỀN {dom.code}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <CardIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 leading-snug">
                      {dom.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed mt-1.5">
                      {dom.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                  <span>{dom.competencies?.length || 0} kỹ năng cốt lõi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Value Dual Track (Giá trị cho Cá nhân & Doanh nghiệp) */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Track 1: Personal */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Dành cho Người học & Cá nhân
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Biết rõ mức độ thành thạo thực tế của bản thân, nhận diện chính xác miền yếu cần bồi dưỡng và sở hữu chứng nhận năng lực số có mã tra cứu công khai.
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Khảo thí đầu vào chẩn đoán toàn diện</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Gợi ý lộ trình bù đắp khoảng trống kỹ năng</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tích lũy hồ sơ năng lực số lâu dài có bằng chứng</span>
            </li>
          </ul>
        </div>

        {/* Track 2: Organization */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Dành cho Nhà trường & Doanh nghiệp
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chuẩn hóa tiêu chuẩn kỹ năng cho toàn bộ nhân sự, tổ chức các đợt khảo thí tập trung, phân tích khoảng trống đội ngũ và tối ưu hóa ngân sách đào tạo.
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Quản lý đợt khảo thí theo lớp/phòng ban tập trung</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Báo cáo phân tích khoảng trống năng lực tập thể</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tùy biến trọng số theo yêu cầu vị trí việc làm</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Bottom Call To Action Banner */}
      <section className="max-w-5xl mx-auto rounded-3xl bg-neutral-900 text-white p-8 sm:p-12 shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, #2563eb 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 inline-block">
            Bắt đầu kiểm chứng năng lực
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Xác định vị trí năng lực số của bạn ngay hôm nay
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Chỉ mất 20–25 phút làm bài khảo thí đầu vào để nhận báo cáo phân tích chi tiết và mở khóa lộ trình học tập thích ứng hoàn toàn miễn phí.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/personal/take/baseline"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span>Làm bài khảo thí đầu vào</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 inline-flex items-center gap-2"
          >
            <span>Tìm hiểu giải pháp Doanh nghiệp</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
