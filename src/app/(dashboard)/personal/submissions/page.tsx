'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  PersonalSubmissionItem,
  SubmissionTabKey,
  SubmissionViewMode,
} from '@/features/classes/types/personal-submissions.types';
import { SubmissionsHeader } from '@/components/dashboard/submissions/SubmissionsHeader';
import { SubmissionsTabs } from '@/components/dashboard/submissions/SubmissionsTabs';
import { SubmissionsFilterBar } from '@/components/dashboard/submissions/SubmissionsFilterBar';
import { SubmissionCard } from '@/components/dashboard/submissions/SubmissionCard';
import { SubmissionDetailView } from '@/components/dashboard/submissions/SubmissionDetailView';
import { SubmissionSubmitView } from '@/components/dashboard/submissions/SubmissionSubmitView';
import { SubmissionTrackingView } from '@/components/dashboard/submissions/SubmissionTrackingView';
import { SubmissionResultView } from '@/components/dashboard/submissions/SubmissionResultView';
import { SubmissionEmptyState } from '@/components/dashboard/submissions/SubmissionEmptyState';
import { Loader2, Info } from 'lucide-react';

function LearnerSubmissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [assignments, setAssignments] = useState<PersonalSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeTab, setActiveTab] = useState<SubmissionTabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');

  // Navigation / View state
  const [viewMode, setViewMode] = useState<SubmissionViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<PersonalSubmissionItem | null>(null);

  // 1. Fetch Real Assignments from Supabase
  const fetchSubmissionsData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAssignments([]);
        return;
      }

      // Lấy danh sách lớp người dùng tham gia
      const { data: memberRows } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id);

      const classIds = (memberRows || []).map((m: any) => m.class_id).filter(Boolean);

      // Nếu không tham gia lớp nào, danh sách trống
      if (classIds.length === 0) {
        setAssignments([]);
        return;
      }

      // Lấy các bài tập được giao cho các lớp này
      const { data: assignmentsData } = await supabase
        .from('class_assignments')
        .select(`
          id,
          class_id,
          assessment_id,
          deadline,
          created_at,
          evaluator_classes (
            id,
            name,
            class_code,
            evaluator_id,
            organization_id,
            organizations ( id, name, code, slug ),
            profiles:evaluator_id ( nickname )
          ),
          assessments (
            id,
            title,
            description,
            passing_score,
            assessment_items (
              id,
              prompt
            )
          )
        `)
        .in('class_id', classIds);

      // Lấy các đợt khảo thí (assessment_campaigns) được giao cho các lớp này
      const { data: campaignsData } = await supabase
        .from('assessment_campaigns')
        .select(`
          id,
          title,
          status,
          starts_at,
          ends_at,
          class_ids,
          organization_id,
          organizations ( id, name, code, slug ),
          assessments (
            id,
            title,
            description,
            passing_score,
            duration_minutes,
            assessment_items (
              id,
              prompt
            )
          )
        `)
        .eq('status', 'ACTIVE');

      // Lấy bài nộp của người dùng
      const { data: userSubmissions } = await supabase
        .from('assessment_submissions')
        .select(`
          id,
          assessment_id,
          class_assignment_id,
          campaign_id,
          status,
          grading_status,
          total_score,
          max_score,
          submitted_at,
          evaluator_notes,
          submission_answers (
            id,
            item_id,
            text_response,
            evidence_url
          )
        `)
        .eq('user_id', user.id);

      const subByAssignmentId = new Map<string, any>();
      const subByAssessmentId = new Map<string, any>();
      const subByCampaignId = new Map<string, any>();

      (userSubmissions || []).forEach((s: any) => {
        if (s.class_assignment_id) {
          subByAssignmentId.set(s.class_assignment_id, s);
        }
        if (s.campaign_id) {
          subByCampaignId.set(s.campaign_id, s);
        }
        if (s.assessment_id) {
          subByAssessmentId.set(s.assessment_id, s);
        }
      });

      const now = new Date();

      const mapped: PersonalSubmissionItem[] = (assignmentsData || []).map((ca: any) => {
        const cls = Array.isArray(ca.evaluator_classes) ? ca.evaluator_classes[0] : ca.evaluator_classes;
        const orgInfo = Array.isArray(cls?.organizations) ? cls.organizations[0] : cls?.organizations;
        const asm = Array.isArray(ca.assessments) ? ca.assessments[0] : ca.assessments;
        const items = asm?.assessment_items || [];
        const firstItem = items[0];

        const existingSub = subByAssignmentId.get(ca.id);

        const isGraded =
          existingSub &&
          (existingSub.status === 'EVALUATED' || existingSub.grading_status === 'COMPLETED');

        const isSubmitted =
          existingSub && existingSub.status === 'SUBMITTED' && !isGraded;

        const isDraft = existingSub && existingSub.status === 'DRAFT';
        const isResubmit = existingSub && existingSub.status === 'RESUBMISSION_REQUESTED';

        const endDate = ca.deadline ? new Date(ca.deadline) : null;
        const isOverdue = !!(endDate && endDate < now && !isGraded && !isSubmitted);

        // Determine status key
        let statusKey: 'todo' | 'progress' | 'wait' | 'done' | 'resubmit' = 'todo';
        let statusLabel = 'Chưa bắt đầu';

        if (isGraded) {
          statusKey = 'done';
          statusLabel = 'Đã chấm';
        } else if (isSubmitted) {
          statusKey = 'wait';
          statusLabel = 'Chờ đánh giá';
        } else if (isResubmit) {
          statusKey = 'resubmit';
          statusLabel = 'Yêu cầu nộp lại';
        } else if (isDraft) {
          statusKey = 'progress';
          statusLabel = 'Bản nháp';
        } else {
          statusKey = 'todo';
          statusLabel = 'Chưa bắt đầu';
        }

        // Parse submitted file & notes
        let submittedFile = undefined;
        let studentNote = undefined;
        if (existingSub && existingSub.submission_answers?.length > 0) {
          const ans = existingSub.submission_answers[0];
          studentNote = ans.text_response || undefined;
          if (ans.evidence_url) {
            const rawFileName = ans.evidence_url.split('/').pop() || 'minh_chung.pdf';
            const cleanFileName = rawFileName.replace(/^\w+_\d+_/, '');
            submittedFile = {
              name: cleanFileName || 'Tệp minh chứng đã nộp',
              size: 'Tệp lưu trữ',
              storagePath: ans.evidence_url,
            };
          }
        }

        // Format dates
        let deadlineFormatted = 'Không giới hạn';
        if (endDate) {
          const d = endDate.getDate().toString().padStart(2, '0');
          const m = (endDate.getMonth() + 1).toString().padStart(2, '0');
          const y = endDate.getFullYear();
          const hr = endDate.getHours().toString().padStart(2, '0');
          const min = endDate.getMinutes().toString().padStart(2, '0');
          deadlineFormatted = `${d}/${m}/${y} · ${hr}:${min}`;
        }

        let submittedAtFormatted = undefined;
        if (existingSub?.submitted_at) {
          const sd = new Date(existingSub.submitted_at);
          const d = sd.getDate().toString().padStart(2, '0');
          const m = (sd.getMonth() + 1).toString().padStart(2, '0');
          const y = sd.getFullYear();
          const hr = sd.getHours().toString().padStart(2, '0');
          const min = sd.getMinutes().toString().padStart(2, '0');
          submittedAtFormatted = `${d}/${m}/${y} · ${hr}:${min}`;
        }

        const evaluatorNickname = orgInfo?.name || cls?.profiles?.nickname || 'Người phụ trách lớp';
        const passingThreshold = Number(asm?.passing_score) || 70;
        const isPassed = existingSub?.is_passed !== null && existingSub?.is_passed !== undefined
          ? existingSub.is_passed
          : (existingSub?.total_score !== null && existingSub?.total_score !== undefined
            ? Number(existingSub.total_score) >= passingThreshold
            : undefined);

        return {
          id: ca.id,
          assessmentId: ca.assessment_id,
          itemId: firstItem?.id,
          title: asm?.title || 'Nhiệm vụ thực hành',
          className: cls?.name || 'Lớp học',
          classCode: cls?.class_code || '',
          evaluatorName: evaluatorNickname,
          description: asm?.description || firstItem?.prompt || 'Hoàn thành bài đánh giá theo yêu cầu.',
          requirements: [
            'Sử dụng dữ liệu và tài liệu đính kèm để hoàn thành bài nộp theo đúng yêu cầu.',
            'Trình bày phương pháp, luận điểm và đính kèm biểu đồ/minh chứng cụ thể nếu có.',
            'Nộp đúng định dạng được chấp nhận (PDF, DOCX, XLSX, ZIP) trước thời hạn quy định.',
          ],
          rubric: [
            { id: '1', name: 'Độ chính xác và đầy đủ của thông tin & minh chứng', maxPoints: 40, awardedPoints: isGraded && existingSub?.total_score !== null && existingSub?.total_score !== undefined ? Math.round(Number(existingSub.total_score) * 0.4) : undefined },
            { id: '2', name: 'Phương pháp phân tích, tư duy và lập luận logic', maxPoints: 30, awardedPoints: isGraded && existingSub?.total_score !== null && existingSub?.total_score !== undefined ? Math.round(Number(existingSub.total_score) * 0.3) : undefined },
            { id: '3', name: 'Hình thức trình bày, cấu trúc tài liệu và kết luận', maxPoints: 30, awardedPoints: isGraded && existingSub?.total_score !== null && existingSub?.total_score !== undefined ? Math.round(Number(existingSub.total_score) * 0.3) : undefined },
          ],
          attachments: [],
          deadline: ca.deadline || undefined,
          deadlineFormatted,
          isOverdue,
          status: statusKey,
          statusLabel,
          submissionId: existingSub?.id,
          submittedAt: existingSub?.submitted_at,
          submittedAtFormatted,
          submittedVersion: 1,
          submittedFile,
          studentNote,
          officialScore: existingSub?.total_score,
          maxScore: 100,
          evaluatorFeedback: existingSub?.evaluator_notes,
          evaluatorGradedAt: isGraded ? (existingSub?.evaluated_at ? new Date(existingSub.evaluated_at).toLocaleDateString('vi-VN') : submittedAtFormatted) : undefined,
          isPassed,
          organizationId: cls?.organization_id || null,
          organizationName: orgInfo?.name || null,
          sourceType: 'CLASS_ASSIGNMENT',
        };
      });

      // Map các đợt khảo thí tổ chức giao cho lớp
      const relevantCampaigns = (campaignsData || []).filter((c: any) => {
        const cClassIds = Array.isArray(c.class_ids) ? c.class_ids : [];
        return cClassIds.some((cid: string) => classIds.includes(cid));
      });

      const mappedCampaigns: PersonalSubmissionItem[] = relevantCampaigns.map((camp: any) => {
        const asm = Array.isArray(camp.assessments) ? camp.assessments[0] : camp.assessments;
        const org = Array.isArray(camp.organizations) ? camp.organizations[0] : camp.organizations;
        const items = asm?.assessment_items || [];
        const firstItem = items[0];

        const existingSub = subByCampaignId.get(camp.id);

        const isGraded =
          existingSub &&
          (existingSub.status === 'EVALUATED' || existingSub.grading_status === 'COMPLETED');

        const isSubmitted =
          existingSub && existingSub.status === 'SUBMITTED' && !isGraded;

        const isDraft = existingSub && existingSub.status === 'DRAFT';
        const isResubmit = existingSub && existingSub.status === 'RESUBMISSION_REQUESTED';

        const endDate = camp.ends_at ? new Date(camp.ends_at) : null;
        const isOverdue = !!(endDate && endDate < now && !isGraded && !isSubmitted);

        let statusKey: 'todo' | 'progress' | 'wait' | 'done' | 'resubmit' = 'todo';
        let statusLabel = 'Chưa bắt đầu';

        if (isGraded) {
          statusKey = 'done';
          statusLabel = 'Đã chấm';
        } else if (isSubmitted) {
          statusKey = 'wait';
          statusLabel = 'Chờ đánh giá';
        } else if (isResubmit) {
          statusKey = 'resubmit';
          statusLabel = 'Yêu cầu nộp lại';
        } else if (isDraft) {
          statusKey = 'progress';
          statusLabel = 'Bản nháp';
        }

        let deadlineFormatted = 'Không giới hạn';
        if (endDate) {
          const d = endDate.getDate().toString().padStart(2, '0');
          const m = (endDate.getMonth() + 1).toString().padStart(2, '0');
          const y = endDate.getFullYear();
          const hr = endDate.getHours().toString().padStart(2, '0');
          const min = endDate.getMinutes().toString().padStart(2, '0');
          deadlineFormatted = `${d}/${m}/${y} · ${hr}:${min}`;
        }

        let submittedAtFormatted = undefined;
        if (existingSub?.submitted_at) {
          const sd = new Date(existingSub.submitted_at);
          const d = sd.getDate().toString().padStart(2, '0');
          const m = (sd.getMonth() + 1).toString().padStart(2, '0');
          const y = sd.getFullYear();
          const hr = sd.getHours().toString().padStart(2, '0');
          const min = sd.getMinutes().toString().padStart(2, '0');
          submittedAtFormatted = `${d}/${m}/${y} · ${hr}:${min}`;
        }

        const passingThreshold = Number(asm?.passing_score) || 70;
        const isPassed = existingSub?.is_passed !== null && existingSub?.is_passed !== undefined
          ? existingSub.is_passed
          : (existingSub?.total_score !== null && existingSub?.total_score !== undefined
            ? Number(existingSub.total_score) >= passingThreshold
            : undefined);

        return {
          id: `camp_${camp.id}`,
          assessmentId: asm?.id || camp.id,
          itemId: firstItem?.id,
          title: camp.title || asm?.title || 'Đợt đánh giá năng lực',
          className: 'Đợt khảo thí tổ chức',
          classCode: org?.code || '',
          evaluatorName: org?.name || 'Hội đồng khảo thí',
          description: asm?.description || firstItem?.prompt || 'Bài đánh giá năng lực thuộc đợt khảo thí của tổ chức.',
          requirements: [
            'Hoàn thành bài đánh giá theo hướng dẫn của ban tổ chức.',
            'Bài nộp sẽ được lưu trữ và báo cáo kết quả về tổ chức.',
          ],
          rubric: [
            { id: '1', name: 'Độ chính xác và đầy đủ của thông tin & minh chứng', maxPoints: 40, awardedPoints: isGraded && existingSub?.total_score !== null && existingSub?.total_score !== undefined ? Math.round(Number(existingSub.total_score) * 0.4) : undefined },
            { id: '2', name: 'Phương pháp phân tích, tư duy và lập luận logic', maxPoints: 30, awardedPoints: isGraded && existingSub?.total_score !== null && existingSub?.total_score !== undefined ? Math.round(Number(existingSub.total_score) * 0.3) : undefined },
            { id: '3', name: 'Hình thức trình bày, cấu trúc tài liệu và kết luận', maxPoints: 30, awardedPoints: isGraded && existingSub?.total_score !== null && existingSub?.total_score !== undefined ? Math.round(Number(existingSub.total_score) * 0.3) : undefined },
          ],
          attachments: [],
          deadline: camp.ends_at || undefined,
          deadlineFormatted,
          isOverdue,
          status: statusKey,
          statusLabel,
          submissionId: existingSub?.id,
          submittedAt: existingSub?.submitted_at,
          submittedAtFormatted,
          submittedVersion: 1,
          officialScore: existingSub?.total_score,
          maxScore: 100,
          evaluatorFeedback: existingSub?.evaluator_notes,
          evaluatorGradedAt: isGraded ? (existingSub?.evaluated_at ? new Date(existingSub.evaluated_at).toLocaleDateString('vi-VN') : submittedAtFormatted) : undefined,
          isPassed,
          organizationId: camp.organization_id,
          organizationName: org?.name || null,
          sourceType: 'CAMPAIGN',
          campaignId: camp.id,
        };
      });

      setAssignments([...mapped, ...mappedCampaigns]);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissionsData();
  }, [fetchSubmissionsData]);

  // Sync with URL query parameters for deep linking
  useEffect(() => {
    const paramId = searchParams.get('id');
    const paramView = searchParams.get('view') as SubmissionViewMode | null;

    if (paramId && assignments.length > 0) {
      const found = assignments.find((a) => a.id === paramId);
      if (found) {
        setSelectedItem(found);
        setViewMode(paramView && ['detail', 'submit', 'tracking', 'result'].includes(paramView) ? paramView : 'detail');
      }
    } else if (!paramId) {
      setViewMode('list');
      setSelectedItem(null);
    }
  }, [searchParams, assignments]);

  // Navigation handlers
  const handleSelectAssignment = (item: PersonalSubmissionItem, targetView: SubmissionViewMode) => {
    setSelectedItem(item);
    setViewMode(targetView);
    router.push(`/personal/submissions?id=${item.id}&view=${targetView}`, { scroll: false });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
    router.push('/personal/submissions', { scroll: false });
  };

  const handleSubViewChange = (targetView: SubmissionViewMode) => {
    if (!selectedItem) return;
    setViewMode(targetView);
    router.push(`/personal/submissions?id=${selectedItem.id}&view=${targetView}`, { scroll: false });
  };

  // Distinct class list for filter
  const classList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    assignments.forEach((a) => {
      if (a.classCode && !map.has(a.classCode)) {
        map.set(a.classCode, { id: a.classCode, name: a.className, code: a.classCode });
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: assignments.length,
      todo: assignments.filter(
        (a) => a.status === 'todo' || a.status === 'progress' || a.status === 'resubmit'
      ).length,
      wait: assignments.filter((a) => a.status === 'wait').length,
      done: assignments.filter((a) => a.status === 'done').length,
    };
  }, [assignments]);

  // Filtered list
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'todo') {
        const isTodo = item.status === 'todo' || item.status === 'progress' || item.status === 'resubmit';
        if (!isTodo) return false;
      } else if (activeTab === 'wait') {
        if (item.status !== 'wait') return false;
      } else if (activeTab === 'done') {
        if (item.status !== 'done') return false;
      }

      // 2. Class filter
      if (selectedClass !== 'all') {
        if (item.classCode !== selectedClass) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchClass = item.className.toLowerCase().includes(q) || item.classCode.toLowerCase().includes(q);
        if (!matchTitle && !matchClass) return false;
      }

      return true;
    });
  }, [assignments, activeTab, selectedClass, searchQuery]);

  // Loading state
  if (loading && assignments.length === 0) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
          Đang tải danh sách bài được giao...
        </p>
      </div>
    );
  }

  // View: Chi tiết nhiệm vụ (Screen 02)
  if (viewMode === 'detail' && selectedItem) {
    return (
      <SubmissionDetailView
        item={selectedItem}
        onBack={handleBackToList}
        onNavigate={handleSubViewChange}
      />
    );
  }

  // View: Nộp bài & Lưu bản nháp (Screen 03)
  if (viewMode === 'submit' && selectedItem) {
    return (
      <SubmissionSubmitView
        item={selectedItem}
        onBack={() => handleSubViewChange('detail')}
        onSuccessSubmitted={async () => {
          await fetchSubmissionsData();
          handleSubViewChange('tracking');
        }}
      />
    );
  }

  // View: Theo dõi sau nộp (Screen 04)
  if (viewMode === 'tracking' && selectedItem) {
    return (
      <SubmissionTrackingView
        item={selectedItem}
        onBack={handleBackToList}
      />
    );
  }

  // View: Kết quả & Phản hồi (Screen 05)
  if (viewMode === 'result' && selectedItem) {
    return (
      <SubmissionResultView
        item={selectedItem}
        onBack={handleBackToList}
      />
    );
  }

  // View: Danh sách bài được giao (Screen 01 & Screen 06)
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Page Header */}
      <SubmissionsHeader />

      {/* 2. Tabs: Tất cả · Cần làm · Đã nộp · Đã chấm */}
      <SubmissionsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {/* 3. Filter Bar */}
      <SubmissionsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        classList={classList}
        selectedTimeFilter={selectedTimeFilter}
        onTimeFilterChange={setSelectedTimeFilter}
      />

      {/* 4. List / Content Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pt-1">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Danh sách bài được giao ({filteredAssignments.length})
        </h2>
        <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">
          Sắp xếp: Hạn nộp gần nhất
        </span>
      </div>

      {/* 5. Assignments List or Empty State */}
      {filteredAssignments.length === 0 ? (
        <SubmissionEmptyState
          hasFilters={!!(searchQuery.trim() || selectedClass !== 'all' || activeTab !== 'all')}
          onClearFilters={() => {
            setSearchQuery('');
            setSelectedClass('all');
            setActiveTab('all');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((item) => (
            <SubmissionCard
              key={item.id}
              item={item}
              onSelect={handleSelectAssignment}
            />
          ))}
        </div>
      )}

      {/* 6. Professional Footnote Note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-neutral-500 pt-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
        <span>
          <strong className="text-slate-600 dark:text-neutral-400 font-semibold">Lưu ý:</strong> Bài quá hạn được đánh dấu trực tiếp tại thẻ nhiệm vụ; không tạo tab riêng theo chuẩn UX v2.
        </span>
      </div>
    </div>
  );
}

export default function LearnerSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span>Đang tải danh sách bài được giao...</span>
        </div>
      }
    >
      <LearnerSubmissionsContent />
    </Suspense>
  );
}
