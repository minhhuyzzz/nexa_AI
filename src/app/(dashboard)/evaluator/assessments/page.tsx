'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Plus,
  Radio,
  Clock,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AssessmentRow {
  id: string;
  code: string;
  title: string;
  domain: string;
  durationMinutes: number;
  passingScore: number;
  questionCount: number;
  assignedGroup: string;
  status: 'ACTIVE' | 'DRAFT';
  updatedAt: string;
}

export default function EvaluatorAssessmentsPage() {
  const supabase = createClient();
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
      } else if (data) {
        const mapped: AssessmentRow[] = data.map((a: any) => ({
          id: a.id,
          code: `ASM-${a.id.slice(0, 6).toUpperCase()}`,
          title: a.title,
          domain: 'Đa miền DigComp 3.0',
          durationMinutes: a.duration_minutes || 45,
          passingScore: Number(a.passing_score) || 70,
          questionCount: 10,
          assignedGroup: 'Toàn hệ thống',
          status: a.is_published ? 'ACTIVE' : 'DRAFT',
          updatedAt: new Date(a.updated_at || a.created_at).toLocaleDateString('vi-VN'),
        }));
        setAssessments(mapped);
      }
    } catch (err) {
      console.error('Unexpected error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const filtered = assessments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              DANH MỤC KHẢO THÍ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bài Khảo Thí &amp; Đợt Đánh Giá
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị các bài khảo thí năng lực số, tạo đợt đánh giá mới và kích hoạt phòng thi trực tiếp mã PIN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/evaluator/assessments/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Tạo bài khảo thí mới</span>
          </Link>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="text-xs text-slate-500 font-medium">Tổng số bài khảo thí</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {loading ? '-' : assessments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sẵn sàng phân bổ cho các nhóm</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="text-xs text-slate-500 font-medium">Hình thức câu hỏi tích hợp</div>
          <div className="text-2xl font-bold text-sky-600 font-mono tabular-nums mt-1">
            4 / 4
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">MCQ, Kịch bản, Thực hành, Minh chứng</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="text-xs text-slate-500 font-medium">Phòng thi PIN trực tiếp</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            Sẵn sàng
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Mã PIN 6 số &amp; QR Code chiếu màn hình</div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 rounded-md border border-slate-200 bg-white">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề hoặc mã bài thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md text-xs pl-9 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Assessment Table */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
            <p className="text-xs">Đang tải danh sách bài khảo thí...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {searchQuery ? 'Không tìm thấy bài khảo thí phù hợp' : 'Chưa có bài khảo thí nào'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Hãy thử thay đổi từ khóa tìm kiếm.'
                : 'Chưa có bài khảo thí nào trong hệ thống.'}
            </p>
            <Link
              href="/evaluator/assessments/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tạo bài khảo thí mới</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tiêu đề bài khảo thí</th>
                  <th className="py-3 px-4">Miền năng lực</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Chuẩn đạt</th>
                  <th className="py-3 px-4">Nhóm giao</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((asm) => (
                  <tr key={asm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{asm.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono font-normal">
                        Mã: {asm.code} &bull; {asm.questionCount} câu hỏi
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {asm.domain}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {asm.durationMinutes} phút
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-900">
                      {asm.passingScore}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {asm.assignedGroup}
                    </td>
                    <td className="py-3.5 px-4">
                      {asm.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Đang mở
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Bản nháp
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/evaluator/live-room?assessmentId=${asm.id}`}
                          className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-[11px] font-semibold transition-colors"
                        >
                          Mở phòng
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
