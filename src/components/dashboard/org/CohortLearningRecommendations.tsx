import { BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { FALLBACK_CURATED_COURSES, CuratedCourse } from '@/features/courses/data/curated-courses';

interface Props {
  gapDomainCodes: string[];
}

const DOMAIN_NAMES: Record<string, string> = {
  D1: 'Miền 1: Thông tin & Dữ liệu',
  D2: 'Miền 2: Giao tiếp & Hợp tác',
  D3: 'Miền 3: Sáng tạo Nội dung số',
  D4: 'Miền 4: An toàn & Bảo mật',
  D5: 'Miền 5: Giải quyết Vấn đề',
};

export function CohortLearningRecommendations({ gapDomainCodes }: Props) {
  if (gapDomainCodes.length === 0) return null;

  // Filter courses that address the gap domains
  const recommendedCourses: CuratedCourse[] = FALLBACK_CURATED_COURSES.filter((c: CuratedCourse) =>
    c.domain_codes.some((code) => gapDomainCodes.includes(code))
  );

  if (recommendedCourses.length === 0) return null;

  return (
    <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">
              Đề Xuất Can Thiệp Đào Tạo Theo Khoảng Trống Tập Thể
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Các miền năng lực có tỷ lệ đạt chuẩn &lt; 60% được khuyến nghị đưa vào kế hoạch bồi dưỡng của đơn vị.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
          <span>Học liệu đã thẩm định</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendedCourses.map((c) => {
          const matchingGaps = c.domain_codes.filter((d) => gapDomainCodes.includes(d));
          return (
            <div
              key={c.id}
              className="p-4 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex gap-1 flex-wrap">
                    {matchingGaps.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{c.provider}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {c.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{c.short_description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">{c.duration}</span>
                <a
                  href={c.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>Xem học liệu</span>
                  <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
