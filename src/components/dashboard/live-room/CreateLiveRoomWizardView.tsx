'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Radio,
  Clock,
  Layers,
  Sparkles,
  Search,
  FileText,
  AlertCircle,
  Play,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Assessment {
  id: string;
  title: string;
  domain: string;
  domainName?: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  questionCount?: number;
  typeLabel?: string;
  types?: string[];
  isVip?: boolean;
  accessTier?: string;
  origin: 'MY_ASSESSMENT' | 'SYSTEM';
}

export interface CreateLiveRoomWizardViewProps {
  workspace?: 'PERSONAL' | 'ORGANIZATION';
  orgSlug?: string;
  organizationId?: string;
  orgName?: string;
}

export function CreateLiveRoomWizardView({
  workspace = 'PERSONAL',
  orgSlug: initialOrgSlug,
  organizationId: initialOrgId,
  orgName,
}: CreateLiveRoomWizardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const classIdFromQuery = searchParams.get('classId');
  const orgId = initialOrgId || searchParams.get('orgId') || undefined;
  const orgSlug = initialOrgSlug || searchParams.get('orgSlug') || undefined;
  const isOrg = workspace === 'ORGANIZATION' || Boolean(orgSlug || orgId);

  // Assessments List State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  // Selected Assessment ID
  const [selectedAsmId, setSelectedAsmId] = useState<string>('');

  // Filters
  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY' | 'CANONICAL'>('MY');

  // Quick Room Configurations
  const [roomTitle, setRoomTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [submitting, setSubmitting] = useState(false);
  const [classList, setClassList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classIdFromQuery || '');

  // Load Classes for the current user/org
  useEffect(() => {
    async function loadClasses() {
      try {
        const supabase = createClient();
        let q = supabase.from('classes').select('id, name');
        if (orgId) {
          q = q.eq('organization_id', orgId);
        }
        const { data } = await q.order('name');
        if (data) setClassList(data);
      } catch {}
    }
    loadClasses();
  }, [orgId]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch available assessments (System + Personal Authored) - Load once on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoadingAssessments(true);
      try {
        const promises: Promise<any>[] = [
          isOrg
            ? fetch(`/api/assessments${orgId ? `?orgId=${orgId}` : ''}`).then((r) => (r.ok ? r.json() : null))
            : Promise.resolve(null),
          fetch('/api/personal/assessments').then((r) => (r.ok ? r.json() : null)),
        ];

        const [sysData, personalData] = await Promise.all(promises);
        if (!isMounted) return;

        const list: Assessment[] = [];

        // 1. Process Personal & Org Authored Assessments (Đề nội bộ / Đề của tôi)
        if (personalData && Array.isArray(personalData.assessments)) {
          personalData.assessments.forEach((pa: any) => {
            list.push({
              id: pa.id,
              title: pa.title,
              domain: 'Đề tự biên soạn',
              domainName: pa.organization_id ? 'Đề nội bộ tổ chức' : 'Đề của tôi',
              description: pa.description || 'Bài đánh giá năng lực nội bộ.',
              duration_minutes: pa.duration_minutes || 45,
              passing_score: pa.passing_score || 70,
              questionCount: Array.isArray(pa.assessment_items) ? pa.assessment_items.length : (pa.questionCount || 20),
              typeLabel: 'Trắc nghiệm & Tự luận',
              types: ['MCQ'],
              origin: 'MY_ASSESSMENT',
              accessTier: 'PERSONAL',
            });
          });
        }

        // 2. Process System & Organization Bank Assessments (Chỉ dành cho chế độ Tổ chức)
        if (isOrg && sysData && Array.isArray(sysData.assessments)) {
          sysData.assessments.forEach((sa: any) => {
            if (!list.some((item) => item.id === sa.id)) {
              const isOrgTest = Boolean(sa.isOrgBank || sa.organizationId || sa.organization_id);
              list.push({
                id: sa.id,
                title: sa.title,
                domain: isOrgTest ? 'Kho đề tổ chức' : (sa.domain || sa.domainName || 'Đa Miền Năng Lực Số'),
                domainName: isOrgTest ? 'Kho đề tổ chức' : (sa.domainName || sa.domain || 'Đa Miền Năng Lực Số'),
                description: sa.description || 'Đánh giá năng lực số chuẩn hóa.',
                duration_minutes: sa.duration_minutes || 45,
                passing_score: sa.passing_score || 70,
                questionCount: sa.questionCount || sa.item_count || 40,
                typeLabel: sa.typeLabel || 'Trắc nghiệm',
                types: sa.types || ['MCQ'],
                isVip: Boolean(sa.isVip),
                accessTier: sa.accessTier || 'FREE',
                origin: isOrgTest ? 'MY_ASSESSMENT' : 'SYSTEM',
              });
            }
          });
        }

        // 3. Nếu có query assessmentId từ Kho đề thi mà chưa có trong list, fetch trực tiếp (chỉ khi là Tổ chức)
        const queryAssessmentId = searchParams.get('assessmentId');
        if (isOrg && queryAssessmentId && !list.some((item) => item.id === queryAssessmentId)) {
          try {
            const singleRes = await fetch(`/api/assessments/${queryAssessmentId}`).then((r) =>
              r.ok ? r.json() : null
            );
            if (singleRes && singleRes.assessment) {
              const sa = singleRes.assessment;
              const fetchedItem: Assessment = {
                id: sa.id,
                title: sa.title,
                domain: 'Bài đánh giá',
                domainName: 'Đánh giá tổ chức',
                description: sa.description || '',
                duration_minutes: sa.duration_minutes || 45,
                passing_score: sa.passing_score || 70,
                questionCount: sa.assessment_items?.length || 20,
                typeLabel: 'Đánh giá',
                types: ['MCQ'],
                origin: 'MY_ASSESSMENT',
              };
              list.unshift(fetchedItem);
            }
          } catch (e) {
            console.error('Failed to fetch specific assessment from query:', e);
          }
        }

        setAssessments(list);

        // Pre-select based on query param if passed, otherwise default to first
        const matched = queryAssessmentId ? list.find((item) => item.id === queryAssessmentId) : null;
        const target = matched || (list.length > 0 ? list[0] : null);

        if (target) {
          setSelectedAsmId(target.id);
          setDurationMinutes(target.duration_minutes || 45);
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const prefix = isOrg ? `${orgName || 'Tổ chức'} - ` : '';
          setRoomTitle(`${prefix}${target.title} (Ca ${timeStr})`);
        }
      } catch (err) {
        console.error('Failed to load assessments:', err);
      } finally {
        if (isMounted) setLoadingAssessments(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOrg, orgName, searchParams]);

  // Selected Assessment derived directly from state
  const selectedAssessment = useMemo(() => {
    return assessments.find((a) => a.id === selectedAsmId) || null;
  }, [assessments, selectedAsmId]);

  // Handle select an assessment
  const handleSelectAssessment = (a: Assessment) => {
    setSelectedAsmId(a.id);
    setDurationMinutes(a.duration_minutes || 45);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const prefix = isOrg ? `${orgName || 'Tổ chức'} - ` : '';
    setRoomTitle(`${prefix}${a.title} (Ca ${timeStr})`);
  };

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      // Tab filter (Chỉ áp dụng khi ở chế độ Tổ chức có nhiều nguồn đề)
      if (isOrg) {
        if (activeTab === 'MY' && a.origin !== 'MY_ASSESSMENT') return false;
        if (activeTab === 'CANONICAL' && a.origin !== 'SYSTEM') return false;
      }

      // Domain filter
      if (domainFilter !== 'ALL') {
        const dLower = a.domain.toLowerCase();
        if (domainFilter === 'D1' && !dLower.includes('dữ liệu') && !dLower.includes('thông tin')) return false;
        if (domainFilter === 'D2' && !dLower.includes('giao tiếp') && !dLower.includes('cộng tác')) return false;
        if (domainFilter === 'D3' && !dLower.includes('sáng tạo') && !dLower.includes('nội dung')) return false;
        if (domainFilter === 'D4' && !dLower.includes('an toàn') && !dLower.includes('bảo mật')) return false;
        if (domainFilter === 'D5' && !dLower.includes('vấn đề')) return false;
        if (domainFilter === 'D_ALL' && !dLower.includes('đa miền') && !dLower.includes('5 miền')) return false;
      }

      // Search Query
      if (assessmentSearch.trim()) {
        const q = assessmentSearch.toLowerCase().trim();
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.domain.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [assessments, activeTab, domainFilter, assessmentSearch, isOrg]);

  // Submit Handler: Open Live Room and immediately enter Lobby (/live/control)
  const handleCreateAndEnterLobby = async () => {
    if (!selectedAssessment) {
      setErrorMessage('Vui lòng chọn một bài đánh giá để mở phòng.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const now = new Date();
      const res = await fetch('/api/evaluator/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roomTitle.trim() || selectedAssessment.title,
          assessmentId: selectedAssessment.id,
          roomMode: 'OPEN',
          classId: selectedClassId || classIdFromQuery || undefined,
          organizationId: orgId || undefined,
          themeId: 'minimal_white',
          scheduledStart: now.toISOString(),
          durationMinutes: selectedAssessment.duration_minutes || 45,
          allowLateJoin: false,
          autoSubmitOnTimeout: true,
          showPin: true,
          systemNotificationsEnabled: true,
          roomDescription: selectedAssessment.description || 'Phiên đánh giá trực tiếp theo thời gian thực.',
          maxParticipants: isOrg ? 150 : 40,
          resultsPublishSettings: {
            show_score: true,
            show_ranking: true,
            show_answers: false,
            scope: 'ALL',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.room?.id) {
          router.push(`/live/control?roomId=${data.room.id}`);
        } else {
          router.push(isOrg && orgSlug ? `/org/${orgSlug}/live-room` : '/personal/live-room');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Không thể tạo phòng đánh giá trực tiếp.');
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi gửi yêu cầu khởi tạo phòng đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = isOrg && orgSlug ? `/org/${orgSlug}/live-room` : '/personal/live-room';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách phòng thi</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                PHÒNG THI TRỰC TIẾP
              </span>
            </div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              Chọn đề thi & Mở sảnh chờ
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {isOrg
                ? 'Chọn đề thi từ kho đề tổ chức hoặc thư viện chuẩn để mở phòng thi trực tiếp.'
                : 'Chọn đề thi từ danh mục của bạn để cấp mã PIN và mở sảnh chờ làm bài trực tiếp.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/80 dark:border-blue-800">
              {isOrg ? 'Chế độ Tổ chức' : 'Chế độ Cá nhân'}
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Main Content Layout: Left Pickers (8 Cols) + Right Settings (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search, Tabs, Assessment Cards Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar: Search + Tabs + Domain Dropdown */}
          <div className="p-4 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đề thi theo tên, mô tả..."
                  value={assessmentSearch}
                  onChange={(e) => setAssessmentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              {/* Tabs / Badges */}
              {isOrg ? (
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      activeTab === 'ALL'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    Tất cả ({assessments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('MY')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      activeTab === 'MY'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    Kho đề tổ chức ({assessments.filter((a) => a.origin === 'MY_ASSESSMENT').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CANONICAL')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      activeTab === 'CANONICAL'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    Chuẩn hóa ({assessments.filter((a) => a.origin === 'SYSTEM').length})
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 shrink-0">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đề của tôi ({assessments.length})</span>
                </div>
              )}
            </div>

            {/* Domain Filter Dropdown */}
            <div className="pt-2 flex items-center gap-2 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Tất cả miền năng lực</option>
                <option value="D_ALL">Đa Miền Năng Lực Số (Tổng hợp)</option>
                <option value="D1">Miền 1: Thông tin và Dữ liệu số</option>
                <option value="D2">Miền 2: Giao tiếp và Cộng tác số</option>
                <option value="D3">Miền 3: Sáng tạo Nội dung & AI</option>
                <option value="D4">Miền 4: An toàn và Sức khỏe số</option>
                <option value="D5">Miền 5: Giải quyết Vấn đề số</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loadingAssessments ? (
            <div className="p-12 text-center bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
              <span>Đang tải danh sách bài đánh giá...</span>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 space-y-2">
              <FileText className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                Không tìm thấy bài đánh giá phù hợp
              </div>
              <p className="text-slate-400">
                {activeTab === 'MY' || !isOrg
                  ? 'Bạn chưa có bài đánh giá nào trong danh mục Đề của tôi. Hãy biên soạn tại mục Đề đánh giá của tôi.'
                  : 'Thử tìm kiếm với từ khóa khác hoặc chuyển sang xem Tất cả.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredAssessments.map((asm) => {
                const isSelected = asm.id === selectedAsmId;

                return (
                  <div
                    key={asm.id}
                    onClick={() => handleSelectAssessment(asm)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-600 ring-2 ring-blue-600/30 shadow-xs'
                        : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 shadow-xs'
                    }`}
                  >
                    {/* Left: Checkmark, Icon, Title & Meta */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
                            {asm.title}
                          </h3>
                          {asm.origin === 'MY_ASSESSMENT' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                              {isOrg ? 'Đề tổ chức' : 'Đề của tôi'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700 shrink-0">
                              Đề chuẩn hóa
                            </span>
                          )}
                        </div>
                        {asm.description && (
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                            {asm.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Duration, questions, passing & Select button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] font-mono tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {asm.duration_minutes} phút
                        </span>
                        <span>&bull;</span>
                        <span>{asm.questionCount || 40} câu</span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                          Chuẩn đạt {asm.passing_score}%
                        </span>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Đã chọn' : 'Chọn đề'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Assessment & Instant Open Room CTA (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <div className="p-5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thông tin phòng thi
              </h2>
            </div>

            {selectedAssessment ? (
              <div className="space-y-4 text-xs">
                {/* Selected Item Summary */}
                <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 uppercase">
                    {selectedAssessment.origin === 'MY_ASSESSMENT'
                      ? (isOrg ? 'Đề tổ chức' : 'Đề của bạn')
                      : 'Đề chuẩn hóa'}
                  </div>
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {selectedAssessment.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                    {selectedAssessment.questionCount || 40} câu hỏi &bull; {selectedAssessment.typeLabel || 'Trắc nghiệm & Tự luận'} &bull; {selectedAssessment.duration_minutes || 45} phút
                  </div>
                </div>

                {/* Editable Room Title */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Tên phòng thi:
                  </label>
                  <input
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="VD: Khảo thí năng lực số ca sáng"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Optional Class / Group Target */}
                {classList.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                      Gắn vào lớp / nhóm (tùy chọn):
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="">Phòng tự do theo mã PIN (không gắn lớp)</option>
                      {classList.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Instant Launch Action Button */}
                <div className="pt-3 space-y-2">
                  <button
                    type="button"
                    onClick={handleCreateAndEnterLobby}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{submitting ? 'Đang khởi tạo phòng thi...' : 'Mở phòng & Vào sảnh chờ'}</span>
                  </button>

                  <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                    Hệ thống sẽ tự động cấp mã PIN 6 chữ số. Bạn có thể tùy chỉnh giao diện và quy chế làm bài trong sảnh chờ trước khi phát đề.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Vui lòng chọn một đề thi để mở phòng.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
