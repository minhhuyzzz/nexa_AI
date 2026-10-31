'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  AssessmentDetailTabs,
  type AssessmentDetailData,
  type AssessmentItemDetail,
} from '@/components/dashboard/assessments/AssessmentDetailTabs';

export default function AssessmentDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssessmentDetail = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch assessment record
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId);
      let query = supabase.from('assessments').select('*');
      if (isUUID) {
        query = query.eq('id', testId);
      } else {
        query = query.limit(1);
      }

      const { data: asm, error: asmError } = await query.maybeSingle();

      if (asmError || !asm) {
        setAssessment(null);
        return;
      }

      // 2. Fetch assessment items with competencies & options
      const { data: itemsData, error: itemsError } = await supabase
        .from('assessment_items')
        .select(`
          id,
          type,
          prompt,
          points,
          order_index,
          difficulty_level,
          competencies (
            id,
            skill_code,
            title,
            competency_domains (
              code,
              title
            )
          ),
          item_options (
            id,
            content,
            is_correct,
            explanation,
            order_index
          )
        `)
        .eq('assessment_id', asm.id)
        .order('order_index', { ascending: true });

      if (itemsError) {
        console.warn('Items fetch warning:', itemsError);
      }

      const mappedItems: AssessmentItemDetail[] = (itemsData || []).map((it: any) => {
        const comp = it.competencies;
        const dom = comp?.competency_domains;
        const sortedOptions = (it.item_options || []).sort(
          (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
        );

        return {
          id: it.id,
          order_index: it.order_index,
          type: it.type || 'MCQ',
          prompt: it.prompt,
          points: Number(it.points) || 10,
          difficulty_level: it.difficulty_level || 'FOUNDATION',
          skill_code: comp?.skill_code,
          skill_title: comp?.title,
          domain_code: dom?.code,
          domain_title: dom?.title,
          options: sortedOptions,
          rubric_guide: it.rubric_guide || (it.type !== 'MCQ' ? 'Chấm điểm theo barem rubric chuẩn.' : null),
        };
      });

      // 3. Count submissions to determine immutable lock status
      let subCount = 0;
      try {
        const { count } = await supabase
          .from('assessment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', asm.id);
        subCount = count || 0;
      } catch (subErr) {
        console.warn('Submissions count warning:', subErr);
      }

      // 4. Fetch linked campaigns
      let campaigns: any[] = [];
      try {
        const { data: campData } = await supabase
          .from('assessment_campaigns')
          .select('id, title, status, starts_at, ends_at')
          .eq('assessment_id', asm.id);
        if (campData) {
          campaigns = campData.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            class_name: 'Lớp đánh giá doanh nghiệp',
            assigned_count: 50,
            submitted_count: 0,
            start_at: c.starts_at,
            end_at: c.ends_at,
          }));
        }
      } catch (campErr) {
        console.warn('Campaigns fetch warning:', campErr);
      }

      // 5. Fetch linked live sessions
      let liveSessions: any[] = [];
      try {
        const { data: liveData } = await supabase
          .from('live_sessions')
          .select('id, pin_code, title, status, created_at')
          .eq('assessment_id', asm.id);
        if (liveData) {
          liveSessions = liveData.map((s) => ({
            id: s.id,
            pin_code: s.pin_code,
            title: s.title || asm.title,
            status: s.status,
            participant_count: 0,
            created_at: s.created_at,
          }));
        }
      } catch (liveErr) {
        console.warn('Live sessions fetch warning:', liveErr);
      }

      const isLocked = Boolean(asm.is_locked || subCount > 0);

      setAssessment({
        id: asm.id,
        title: asm.title,
        description: asm.description || 'Bài khảo thí chuẩn hóa đo lường năng lực số công dân theo khung DigComp 3.0.',
        domainName: 'Đa Miền Năng Lực Số',
        duration_minutes: asm.duration_minutes || 45,
        passing_score: Number(asm.passing_score) || 70,
        point_reward: asm.point_reward || 50,
        is_published: Boolean(asm.is_published),
        status: asm.is_published ? 'PUBLISHED' : (asm.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT'),
        version: asm.version || 'v1.0',
        is_locked: isLocked,
        has_submissions: subCount > 0,
        submission_count: subCount,
        created_at: asm.created_at,
        updated_at: asm.updated_at,
        cover_image_url: null,
        items: mappedItems,
        campaigns,
        live_sessions: liveSessions,
      });
    } catch (err) {
      console.error('Error loading assessment detail:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, testId]);

  useEffect(() => {
    fetchAssessmentDetail();
  }, [fetchAssessmentDetail]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" strokeWidth={1.75} />
        <p className="text-xs">Đang tải thông tin chi tiết bài khảo thí...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-12 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black max-w-md mx-auto my-12">
        <HelpCircle className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" strokeWidth={1.75} />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">Không tìm thấy bài khảo thí</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
          Bài kiểm tra bạn đang tìm không tồn tại hoặc đã được chuyển vào kho lưu trữ.
        </p>
        <Link
          href="/personal/authoring"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Về danh mục khảo thí</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
        <Link
          href="/personal/authoring"
          className="hover:text-slate-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quản lý đề khảo thí</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-zinc-200 font-semibold truncate max-w-sm">
          {assessment.title}
        </span>
      </div>

      {/* 5-Tab Detail View */}
      <AssessmentDetailTabs
        assessment={assessment}
        userRole="EVALUATOR"
      />
    </div>
  );
}
