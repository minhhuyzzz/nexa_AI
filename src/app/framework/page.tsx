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
    .eq('framework_id', framework?.id || '')
    .order('domain_index', { ascending: true });

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
            {framework?.description || 'Tham chiếu theo tiêu chuẩn EU DigComp 2.2, bao gồm 5 miền năng lực cốt lõi và 21 kỹ năng thành phần trên 8 cấp độ thành thạo.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-200 shadow-xs">
              MÃ KHUNG: {framework?.code || 'DIGCOMP_VN'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-200 shadow-xs">
              PHIÊN BẢN: v{framework?.version || '1.0'}
            </span>
          </div>
        </div>

        {/* 5 Domains & Skills List */}
        <div className="space-y-6">
          {(domains || []).map((domain) => (
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
                            Cấp độ chuẩn: {skill.target_level}/8
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
