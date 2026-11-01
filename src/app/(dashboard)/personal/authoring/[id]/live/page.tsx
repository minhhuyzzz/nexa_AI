'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Radio,
  Clock,
  Users,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  StopCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CandidateRow {
  id: string;
  name: string;
  email?: string;
  joinedAt: string;
  status: 'TESTING' | 'SUBMITTED';
  score?: number;
}

export default function PersonalLiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const pin = searchParams.get('pin') || '849201';

  const [assessment, setAssessment] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRow[]>([
    {
      id: 'c1',
      name: 'Nguyễn Văn An',
      joinedAt: '15:30',
      status: 'TESTING',
    },
    {
      id: 'c2',
      name: 'Trần Thị Mai',
      joinedAt: '15:31',
      status: 'SUBMITTED',
      score: 8.5,
    },
    {
      id: 'c3',
      name: 'Lê Hoàng Minh',
      joinedAt: '15:32',
      status: 'TESTING',
    },
  ]);

  const [isLocked, setIsLocked] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: asm } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', id)
          .single();

        if (asm) setAssessment(asm);
      } catch (err) {
        console.error('Error loading assessment for live session:', err);
      }
    }
    loadData();
  }, [id, supabase]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = () => {
    if (!confirm('Bạn có chắc muốn kết thúc ca thi này? Hệ thống sẽ chốt bài làm của tất cả thí sinh.')) {
      return;
    }
    setIsEnded(true);
  };

  const submittedCount = candidates.filter((c) => c.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumbs */}
      <div>
        <Link
          href={`/personal/authoring/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Chi tiết đề</span>
        </Link>
      </div>

      {/* 2. Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              PHIÊN THI TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
            {assessment?.title || 'Đề đánh giá'} — Điều phối ca thi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mã đề: ASM-{id.slice(0, 6).toUpperCase()} • Thời lượng: {assessment?.duration_minutes || 45} phút
          </p>
        </div>

        {/* PIN display badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">MÃ PIN PHÒNG THI</div>
            <div className="text-2xl font-black font-mono tracking-widest text-blue-600 dark:text-blue-400">
              {pin}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyPin}
            className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50"
            title="Sao chép PIN"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. Session Stats & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center">
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {candidates.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Thí sinh đã vào phòng</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center">
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {candidates.length - submittedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Đang làm bài</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center">
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {submittedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Đã nộp bài</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              isLocked
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLocked ? 'Đã khóa phòng' : 'Khóa phòng'}</span>
          </button>

          <button
            type="button"
            onClick={handleEndSession}
            disabled={isEnded}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>{isEnded ? 'Đã kết thúc' : 'Kết thúc ca'}</span>
          </button>
        </div>
      </div>

      {/* 4. Candidate Monitor Table */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Danh sách thí sinh trong phòng ({candidates.length})
          </h2>
          <span className="text-[11px] text-slate-400">Tự động đồng bộ</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-850 border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="p-3.5 bg-slate-50/40 dark:bg-zinc-900/30 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  {cand.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {cand.name}
                  </div>
                  <div className="text-[10px] text-slate-400">Vào phòng lúc {cand.joinedAt}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {cand.status === 'SUBMITTED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã nộp bài {cand.score ? `(${cand.score}đ)` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Đang làm bài
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
