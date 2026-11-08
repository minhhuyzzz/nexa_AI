'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Users,
  Radio,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function PersonalAuthoringDeployContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialType = searchParams.get('type') === 'LIVE_ROOM' ? 'LIVE_ROOM' : 'CLASS';
  const [deployType, setDeployType] = useState<'CLASS' | 'LIVE_ROOM'>(initialType);

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Class Assignment State
  const [classes, setClasses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [deadline, setDeadline] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16)
  );

  // Live Room State
  const [roomTitle, setRoomTitle] = useState<string>('');
  const [pin, setPin] = useState<string>(Math.floor(100000 + Math.random() * 900000).toString());
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [showInstantResult, setShowInstantResult] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: asm, error: asmError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', id)
          .single();

        if (asmError || !asm) throw new Error('Không tìm thấy đề đánh giá');
        setAssessment(asm);
        setRoomTitle(`${asm.title} - Ca thi ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`);
        setDurationMinutes(asm.duration_minutes || 45);

        // Fetch user classes
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: clsData } = await supabase
            .from('evaluator_classes')
            .select('id, name, class_code')
            .eq('evaluator_id', user.id);

          const list = (clsData || []).map((c) => ({
            id: c.id,
            name: c.name,
            code: c.class_code,
          }));

          setClasses(list);
          if (list.length > 0) setSelectedClassId(list[0].id);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, supabase]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (deployType === 'CLASS') {
        if (!selectedClassId) {
          throw new Error('Vui lòng chọn lớp học để giao bài');
        }

        // Insert into class_assignments
        const { error } = await supabase.from('class_assignments').insert({
          class_id: selectedClassId,
          assessment_id: id,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        });

        if (error) throw error;

        // Redirect back to assessment detail page
        router.push(`/personal/authoring/${id}`);
      } else {
        // Create Live Room & redirect to live room monitor (Screen 07)
        const res = await fetch('/api/evaluator/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: roomTitle,
            assessmentId: id,
            pin,
            roomMode: 'OPEN',
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Mở phòng thi thất bại');
        }

        router.push(`/personal/authoring/${id}/live?pin=${pin}`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi cấu hình đợt thi');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-xs text-slate-500">
        Đang tải thông tin cấu hình đợt thi...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* 1. Breadcrumbs */}
      <div>
        <Link
          href={`/personal/authoring/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Chi tiết đề đánh giá</span>
        </Link>
      </div>

      {/* 2. Header */}
      <div className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            BƯỚC 4: THIẾT LẬP ĐỢT TRIỂN KHAI
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Cấu hình đợt thi &amp; Giao bài
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Đề thi: <strong>{assessment?.title}</strong> • ASM-{id.slice(0, 6).toUpperCase()}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Deployment Type Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setDeployType('CLASS')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
            deployType === 'CLASS'
              ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Giao cho Lớp / Nhóm
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Học viên làm bài theo hạn nộp bài tập.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setDeployType('LIVE_ROOM')}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
            deployType === 'LIVE_ROOM'
              ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Phòng thi trực tiếp (PIN)
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Học viên nhập mã PIN thi đồng thời theo ca.
            </p>
          </div>
        </button>
      </div>

      {/* 4. Configuration Form */}
      <form onSubmit={handleDeploy} className="p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        {deployType === 'CLASS' ? (
          /* FORM A: Class Assignment */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Chọn Lớp hoặc Nhóm học tập nhận bài <span className="text-rose-500">*</span>
              </label>
              {classes.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
                  Bạn chưa có lớp học nào. Hãy vào{' '}
                  <Link href="/personal/groups" className="underline font-bold">
                    Lớp &amp; Nhóm
                  </Link>{' '}
                  để tạo lớp trước khi giao bài.
                </div>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-900 dark:text-neutral-100"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Hạn chót nộp bài (Deadline)
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100"
              />
              <span className="block text-[10px] text-slate-400 mt-1">
                Sau thời hạn này, bài làm của học viên sẽ bị đánh dấu quá hạn trên hệ thống.
              </span>
            </div>
          </div>
        ) : (
          /* FORM B: Live Room PIN */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Tên ca thi / Phiên thi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                  Mã PIN tham gia (6 số)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono font-bold tracking-widest text-center text-blue-600 dark:text-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setPin(Math.floor(100000 + Math.random() * 900000).toString())}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Đổi
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                  Thời lượng làm bài (phút)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="instantResult"
                checked={showInstantResult}
                onChange={(e) => setShowInstantResult(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="instantResult" className="text-xs text-neutral-700 dark:text-zinc-300 cursor-pointer">
                Cho phép thí sinh xem ngay điểm trắc nghiệm sau khi nộp bài
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-between">
          <Link
            href={`/personal/authoring/${id}`}
            className="text-xs text-slate-500 hover:text-neutral-900 dark:hover:text-white"
          >
            Hủy bỏ
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || (deployType === 'CLASS' && classes.length === 0)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : deployType === 'CLASS' ? (
              <>
                <span>Phát hành vào Lớp / Nhóm</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Mở phòng thi ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PersonalAuthoringDeployPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải cấu hình giao đề...
        </div>
      }
    >
      <PersonalAuthoringDeployContent id={id} />
    </Suspense>
  );
}
