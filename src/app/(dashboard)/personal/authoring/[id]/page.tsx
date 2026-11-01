'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Users,
  Radio,
  Edit3,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Calendar,
  FileText,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PersonalAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [assessment, setAssessment] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        // Fetch assessment
        const { data: asm, error: asmError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', id)
          .single();

        if (asmError || !asm) throw new Error('Không tìm thấy đề đánh giá');
        setAssessment(asm);

        // Fetch items
        const { data: qData, error: qError } = await supabase
          .from('assessment_items')
          .select(`
            id,
            prompt,
            type,
            points,
            item_options ( id, content, is_correct ),
            competencies (
              skill_code,
              competency_domains ( code, title )
            )
          `)
          .eq('assessment_id', id);

        if (qError) throw qError;
        setItems(qData || []);

        // Fetch deployment history (classes assigned)
        const { data: assignData } = await supabase
          .from('class_assignments')
          .select(`
            id,
            deadline,
            created_at,
            evaluator_classes (
              id,
              name,
              class_code
            )
          `)
          .eq('assessment_id', id);

        setDeployments(assignData || []);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="py-32 text-center text-xs text-slate-500">
        Đang tải thông tin đề đánh giá...
      </div>
    );
  }

  const monogram = assessment?.title ? assessment.title.trim()[0].toUpperCase() : 'D';
  const isReady = !!assessment?.is_published;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumbs */}
      <div>
        <Link
          href="/personal/authoring"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Đề đánh giá của tôi</span>
        </Link>
      </div>

      {/* 2. Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0">
            {monogram}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {assessment?.title}
              </h1>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                ASM-{id.slice(0, 6).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-2xl">
              {assessment?.description || 'Chưa có mô tả chi tiết cho đề đánh giá này.'}
            </p>
          </div>
        </div>

        {/* Status & Edit action */}
        <div className="flex items-center gap-2 shrink-0">
          {isReady ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Sẵn sàng triển khai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Bản nháp
            </span>
          )}

          <Link
            href={`/personal/authoring/${id}/edit`}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50"
            title="Sửa câu hỏi"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3. Deployment Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option A: Giao cho Lớp / Nhóm */}
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Giao bài cho Lớp / Nhóm học tập
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Chuyển đề đánh giá thành nhiệm vụ học tập có thời hạn cho các thành viên trong lớp hoặc nhóm cá nhân bạn quản lý.
          </p>
          <Link
            href={`/personal/authoring/${id}/deploy?type=CLASS`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs"
          >
            <span>Thiết lập giao bài</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Option B: Mở phòng thi trực tiếp */}
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Tổ chức phòng thi trực tiếp (Mã PIN)
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Sinh mã PIN phiên thi tức thời để học viên hoặc thí sinh nhập mã vào làm bài đồng thời với bộ đếm giờ trực tiếp.
          </p>
          <Link
            href={`/personal/authoring/${id}/deploy?type=LIVE_ROOM`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 font-semibold text-xs"
          >
            <span>Cấu hình phòng thi PIN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Assessment Specs & Deployment History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Overview (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Cấu trúc câu hỏi ({items.length})
            </h2>
            <Link
              href={`/personal/authoring/${id}/preview`}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem toàn bộ đề</span>
            </Link>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-blue-600">0{idx + 1}</span>
                  <span className="text-neutral-800 dark:text-zinc-200 truncate max-w-md">
                    {item.prompt || 'Chưa có nội dung'}
                  </span>
                </div>
                <span className="font-mono text-slate-500 font-semibold shrink-0 ml-2">
                  {item.points}đ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: History of Deployments (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Lịch sử đã giao bài ({deployments.length})
          </h2>

          {deployments.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Đề này chưa được giao cho lớp hoặc mở phiên thi nào.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {deployments.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-1"
                >
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">
                    {d.evaluator_classes?.name || 'Lớp học'} ({d.evaluator_classes?.class_code})
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Hạn nộp: {d.deadline ? new Date(d.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
