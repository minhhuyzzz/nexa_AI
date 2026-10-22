import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Layers,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface CompetencyItem {
  id: string;
  skill_code: string;
  title: string;
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
  competency_domains: CompetencyDomainItem[];
}

export default async function AdminFrameworksPage() {
  const supabase = await createClient();

  // Fetch active framework with domains and competencies
  const { data: frameworkData } = await supabase
    .from('assessment_frameworks')
    .select(`
      id,
      code,
      title,
      version,
      description,
      status,
      competency_domains (
        id,
        code,
        title,
        description,
        domain_index,
        competencies (
          id,
          skill_code,
          title,
          target_level,
          display_order
        )
      )
    `)
    .eq('status', 'ACTIVE')
    .single();

  const framework = frameworkData as unknown as FrameworkItem | null;
  const rawDomains: CompetencyDomainItem[] = framework?.competency_domains || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
              KHUNG CHUẨN DIGCOMP 3.0
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Trị Khung Năng Lực Số (DigComp 3.0)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý 5 Miền năng lực và 21 Kỹ năng thành phần theo chuẩn hóa DigComp 3.0 (JRC 2025).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/framework"
            target="_blank"
            className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            Xem trang công khai
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Framework Summary Strip */}
      <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-slate-900">
              {framework?.title || 'Khung Năng Lực Số Chuẩn Toàn Diện'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono">
              PHIÊN BẢN {framework?.version || '1.0'}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            {framework?.description || 'Khung tiêu chuẩn năng lực số chuẩn hóa theo EU DigComp 2.2 và định hướng Việt Nam.'}
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">MIỀN NĂNG LỰC</div>
            <div className="text-xl font-bold text-slate-900 font-mono">{rawDomains.length} Miền</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">KỸ NĂNG THÀNH PHẦN</div>
            <div className="text-xl font-bold text-sky-600 font-mono">
              {rawDomains.reduce((sum, d) => sum + (d.competencies?.length || 0), 0)} Kỹ năng
            </div>
          </div>
        </div>
      </div>

      {/* DigComp 3.0 4-Level Proficiency Standard Strip */}
      <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            4 Cấp Độ Năng Lực Chuẩn Hóa (DigComp 3.0 Proficiency Levels)
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Bản chuẩn hóa JRC 2025</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Basic</span>
              <span className="text-[10px] font-mono text-slate-500">Level 1</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Thao tác cơ bản có hướng dẫn, giải quyết tác vụ số đơn giản thường nhật.
            </p>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Intermediate</span>
              <span className="text-[10px] font-mono text-slate-500">Level 2</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Tự chủ độc lập, hiểu rõ công cụ số và tự giải quyết các vấn đề thường gặp.
            </p>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Advanced</span>
              <span className="text-[10px] font-mono text-sky-700">Level 3</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Thành thạo chuyên sâu, có khả năng hướng dẫn người khác và tối ưu hóa giải pháp.
            </p>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Highly Advanced</span>
              <span className="text-[10px] font-mono text-emerald-700">Level 4</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Chuyên gia chiến lược, đề xuất giải pháp số sáng tạo và phát triển hệ sinh thái.
            </p>
          </div>
        </div>
      </div>

      {/* 5 Domains & Competencies Hierarchical Tree */}
      {rawDomains.length === 0 ? (
        <div className="p-12 rounded-md bg-white border border-slate-200 text-center max-w-sm mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
            <Layers className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Chưa tải được khung năng lực</h3>
            <p className="text-xs text-slate-500 mt-1">
              Chưa có phiên bản khung năng lực hoạt động trong cơ sở dữ liệu Supabase.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rawDomains
            .sort((a, b) => a.domain_index - b.domain_index)
            .map((domain) => (
              <div
                key={domain.id}
                className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      MIỀN {domain.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{domain.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {domain.competencies?.length || 0} kỹ năng con
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {domain.competencies
                    ?.sort((a, b) => a.display_order - b.display_order)
                    .map((comp) => {
                      const levelLabel =
                        comp.target_level === 5
                          ? 'Highly Advanced'
                          : comp.target_level === 4
                          ? 'Advanced'
                          : comp.target_level === 3
                          ? 'Intermediate'
                          : 'Basic';

                      return (
                        <div
                          key={comp.id}
                          className="p-3 rounded bg-slate-50/70 border border-slate-200 text-xs flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sky-700 text-[11px] font-mono">
                                {comp.skill_code}
                              </span>
                              <span className="text-[10px] text-slate-600 font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200">
                                {levelLabel}
                              </span>
                            </div>
                            <div className="font-medium text-slate-800 line-clamp-2">
                              {comp.title}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
