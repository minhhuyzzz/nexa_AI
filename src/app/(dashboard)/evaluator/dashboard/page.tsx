'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  FileCheck,
  Radio,
  CheckSquare,
  ArrowRight,
  Clock,
  Plus,
  Layers,
  ChevronRight,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

interface PendingSubmission {
  id: string;
  candidateName: string;
  candidateCode: string;
  assessmentTitle: string;
  submittedAt: string;
  isPassed: boolean;
  score: number;
}

interface ActiveRoom {
  id: string;
  roomCode: string;
  title: string;
  participantCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function EvaluatorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [evaluatorName, setEvaluatorName] = useState<string>('Chuyên Gia Khảo Thí');
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [classCount, setClassCount] = useState<number>(0);
  const [examCount, setExamCount] = useState<number>(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch user profile name
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setEvaluatorName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setEvaluatorName(user.user_metadata.full_name);
        }
      }

      // 1. Fetch real submissions
      const subRes = await fetch('/api/evaluator/submissions');
      if (subRes.ok) {
        const subData = await subRes.json();
        const subs = (subData.submissions || []).map((s: any, idx: number) => ({
          id: s.id,
          candidateName: s.candidateName || `Thí sinh #${s.userId?.slice(0, 6) || idx + 1}`,
          candidateCode: `TS-${s.userId?.slice(0, 4)?.toUpperCase() || 100 + idx}`,
          assessmentTitle: s.assessmentTitle || 'Khảo thí năng lực số',
          submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong',
          isPassed: s.isPassed,
          score: s.totalScore || 0,
        }));
        setPendingSubmissions(subs);
      }

      // 2. Fetch real active rooms
      const roomRes = await fetch('/api/evaluator/rooms');
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        const rooms = (roomData.rooms || []).filter((r: any) => r.isActive !== false);
        setActiveRooms(rooms);
      }

      // 3. Fetch real classes count
      const classRes = await fetch('/api/evaluator/classes');
      if (classRes.ok) {
        const classData = await classRes.json();
        setClassCount(classData.classes?.length || 0);
      }

      // 4. Fetch assessments count
      const asmRes = await fetch('/api/admin/assessments');
      if (asmRes.ok) {
        const asmData = await asmRes.json();
        setExamCount(asmData.assessments?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              KHÔNG GIAN LÀM VIỆC CỦA NGƯỜI ĐÁNH GIÁ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Xin chào, {evaluatorName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Điều phối phòng thi trực tiếp, thẩm định bài làm thực hành theo Rubric và quản lý nhóm khảo thí.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/evaluator/live-room"
            className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span>Phát sóng phòng Live</span>
          </Link>
          <Link
            href="/evaluator/grading"
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Chấm bài ngay</span>
          </Link>
        </div>
      </div>

      {/* Operational Status Bar (4 Real-Data Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Bài nộp chờ chấm</span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-0.5 tabular-nums">
              {loading ? '-' : pendingSubmissions.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <CheckSquare className="w-4 h-4" strokeWidth={1.75} />
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Ca thi đang mở</span>
            <div className="text-2xl font-bold font-mono text-sky-600 mt-0.5 tabular-nums">
              {loading ? '-' : activeRooms.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Radio className="w-4 h-4" strokeWidth={1.75} />
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Nhóm khảo thí phụ trách</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {loading ? '-' : classCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Users className="w-4 h-4" strokeWidth={1.75} />
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Đề thi sẵn sàng</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-0.5 tabular-nums">
              {loading ? '-' : examCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FileCheck className="w-4 h-4" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {/* 2 Main Action Queues (Pending Submissions + Active Live Rooms) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Submissions Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Bài nộp đang chờ chấm điểm ({pendingSubmissions.length})
              </h2>
            </div>
            <Link
              href="/evaluator/grading"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
            >
              <span>Xem bàn chấm bài</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="bg-white rounded-md border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Đang tải danh sách bài làm...</span>
              </div>
            ) : pendingSubmissions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                <p className="text-xs font-medium text-slate-600">Không có bài nộp nào đang chờ chấm</p>
                <p className="text-[11px] text-slate-400">Tất cả bài khảo thí khách quan đã được chấm tự động 100%.</p>
              </div>
            ) : (
              pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{sub.candidateName}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {sub.candidateCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{sub.assessmentTitle}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Nộp lúc: {sub.submittedAt}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-600">Điểm hiện tại: {sub.score}đ</span>
                    </div>
                  </div>

                  <Link
                    href={`/evaluator/grading?submissionId=${sub.id}`}
                    className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors shadow-xs shrink-0"
                  >
                    <span>Chấm Rubric</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Live Exam Rooms (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Phòng thi trực tiếp ({activeRooms.length})
              </h2>
            </div>
            <Link
              href="/evaluator/live-room"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
            >
              <span>Quản lý phòng</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="bg-white rounded-md border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Đang tải ca thi...</span>
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Radio className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                <p className="text-xs font-medium text-slate-600">Chưa có ca thi nào đang mở</p>
                <Link
                  href="/evaluator/live-room"
                  className="inline-block mt-1 text-xs text-sky-600 font-semibold hover:underline"
                >
                  + Mở phòng thi mới
                </Link>
              </div>
            ) : (
              activeRooms.map((room) => (
                <div key={room.id} className="p-3.5 space-y-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded tracking-wider">
                      {room.roomCode}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đang mở phòng
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{room.title}</p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {room.participantCount || 0} thí sinh vào phòng
                    </span>
                    <Link
                      href={`/live/control?roomId=${room.id}`}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>Vào điều hành</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
