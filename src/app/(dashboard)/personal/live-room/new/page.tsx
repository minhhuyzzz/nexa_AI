'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Radio,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Users,
  Settings,
  HelpCircle,
  AlertCircle,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  Bell,
  Eye,
} from 'lucide-react';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface Assessment {
  id: string;
  title: string;
  domain: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  item_count?: number;
  created_at: string;
}

export default function CreateLiveRoomWizardPage() {
  const router = useRouter();

  // Wizard Step: 1 = Chọn đề, 2 = Cấu hình phiên, 3 = Xác nhận
  const [step, setStep] = useState<1 | 2>(1);

  // Assessments Library
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');

  // Selected Assessment
  const [selectedAsmId, setSelectedAsmId] = useState<string>('');

  // Step 2 Form States
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDescription, setRoomDescription] = useState(
    'Bài đánh giá trực tiếp kiểm tra kiến thức và kỹ năng ứng dụng. Vui lòng chuẩn bị kết nối Internet ổn định, đọc kỹ đề và nộp bài đúng thời gian quy định.'
  );
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [roomMode, setRoomMode] = useState<'OPEN' | 'GROUP_ONLY'>('OPEN');
  const [startMode, setStartMode] = useState<'MANUAL' | 'SCHEDULED'>('MANUAL');
  const [submissionPolicy, setSubmissionPolicy] = useState<'WAIT_FOR_PUBLISH' | 'SHOW_ON_PUBLISH'>(
    'SHOW_ON_PUBLISH'
  );

  // Access Controls & Toggles
  const [autoSubmitOnTimeout, setAutoSubmitOnTimeout] = useState(true);
  const [allowLateJoin, setAllowLateJoin] = useState(false);
  const [lockAfterStart, setLockAfterStart] = useState(true);
  const [showPin, setShowPin] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);

  // Theme Selection (Default: minimal_white)
  const [selectedTheme, setSelectedTheme] = useState<RoomThemeId>('minimal_white');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch available assessments
  useEffect(() => {
    async function loadAssessments() {
      setLoadingAssessments(true);
      try {
        const res = await fetch('/api/assessments');
        if (res.ok) {
          const data = await res.json();
          const list: Assessment[] = (data.assessments || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            domain: a.domain || 'Tổng hợp (5 miền)',
            description: a.description || 'Đánh giá năng lực số theo chuẩn DigComp 2.2.',
            duration_minutes: a.duration_minutes || 45,
            passing_score: a.passing_score || 70,
            item_count: a.item_count || 40,
            created_at: a.created_at,
          }));
          setAssessments(list);

          if (list.length > 0 && !selectedAsmId) {
            setSelectedAsmId(list[0].id);
            setDurationMinutes(list[0].duration_minutes);
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setRoomTitle(`${list[0].title} - Ca thi ${timeStr}`);
          }
        }
      } catch (err) {
        console.error('Failed to load assessments:', err);
      } finally {
        setLoadingAssessments(false);
      }
    }

    loadAssessments();
  }, []);

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (domainFilter !== 'ALL' && a.domain !== domainFilter) return false;
      if (assessmentSearch.trim()) {
        const q = assessmentSearch.toLowerCase().trim();
        return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assessments, domainFilter, assessmentSearch]);

  const selectedAssessment = useMemo(() => {
    return assessments.find((a) => a.id === selectedAsmId);
  }, [assessments, selectedAsmId]);

  // Handle select assessment
  const handleSelectAssessment = (a: Assessment) => {
    setSelectedAsmId(a.id);
    setDurationMinutes(a.duration_minutes);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setRoomTitle(`${a.title} - Ca thi ${timeStr}`);
  };

  // Submit Handler
  const handleCreateRoom = async () => {
    if (!selectedAsmId || !roomTitle.trim()) {
      setErrorMessage('Vui lòng chọn đề thi và nhập tên phòng.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const scheduledStartIso = `${scheduledDate}T${scheduledTime}:00`;

      const res = await fetch('/api/evaluator/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roomTitle.trim(),
          assessmentId: selectedAsmId,
          roomMode,
          themeId: selectedTheme,
          scheduledStart: scheduledStartIso,
          durationMinutes,
          allowLateJoin,
          autoSubmitOnTimeout,
          showPin,
          systemNotificationsEnabled: systemNotifications,
          roomDescription,
          maxParticipants: 40,
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
          // Navigate to Host Waiting Room
          router.push(`/personal/live-room/${data.room.id}/host`);
        } else {
          router.push('/personal/live-room');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Không thể tạo phòng thi.');
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi khởi tạo phòng thi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back button & Stepper Header */}
      <div className="space-y-4">
        <Link
          href="/personal/live-room"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Phòng thi trực tiếp</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                TẠO PHÒNG THI MỚI
              </span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {step === 1 ? 'Bước 1: Chọn đề khảo thí' : 'Bước 2: Cấu hình phiên & Chủ đề'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1
                ? 'Chọn một đề từ thư viện để sử dụng cho phiên thi trực tiếp. Bạn có thể lọc, tìm kiếm và xem nhanh thông tin chi tiết.'
                : 'Thiết lập các thông tin, chủ đề giao diện và quy tắc cho phiên thi trực tiếp.'}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                  step === 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`font-semibold ${step === 1 ? 'text-blue-600' : 'text-neutral-800'}`}>
                Chọn đề
              </span>
            </div>

            <div className="w-8 h-0.5 bg-slate-200" />

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                  step === 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                2
              </div>
              <span className={`font-semibold ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                Cấu hình phiên
              </span>
            </div>

            <div className="w-8 h-0.5 bg-slate-200" />

            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold bg-slate-100 border border-slate-200">
                3
              </div>
              <span className="font-semibold">Mở phòng</span>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: CHỌN ĐỀ KHẢO THÍ */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Assessment Library (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đề khảo thí theo tên, mô tả..."
                  value={assessmentSearch}
                  onChange={(e) => setAssessmentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-xs text-neutral-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
                />
              </div>

              {/* Domain Filter */}
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
              >
                <option value="ALL">Tất cả miền năng lực</option>
                <option value="Thông tin & Dữ liệu">D1: Dữ liệu & Thông tin</option>
                <option value="Giao tiếp & Hợp tác">D2: Giao tiếp & Hợp tác</option>
                <option value="Sáng tạo Nội dung & AI">D3: Sáng tạo Nội dung & AI</option>
                <option value="An toàn & Bảo mật">D4: An toàn & Bảo mật</option>
                <option value="Giải quyết Vấn đề">D5: Giải quyết Vấn đề</option>
                <option value="Tổng hợp (5 miền)">Tổng hợp (5 miền)</option>
              </select>
            </div>

            {loadingAssessments ? (
              <div className="p-12 text-center bg-white rounded-md border border-slate-200 text-xs text-slate-500">
                Đang tải thư viện đề thi...
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-md border border-slate-200 text-xs text-slate-500">
                Không tìm thấy đề thi phù hợp.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredAssessments.map((asm) => {
                  const isSelected = asm.id === selectedAsmId;
                  return (
                    <div
                      key={asm.id}
                      onClick={() => handleSelectAssessment(asm)}
                      className={`p-4 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Chuẩn DigComp
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <h3 className="font-bold text-xs text-neutral-900 line-clamp-1 mb-1">
                        {asm.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                        {asm.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {asm.domain}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {asm.duration_minutes} phút
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Assessment Summary (1 Col) */}
          <div className="bg-white rounded-md border border-slate-200 p-5 shadow-xs space-y-4 sticky top-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Đề đã chọn
              </h2>
            </div>

            {selectedAssessment ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    XÁC THỰC SẴN SÀNG
                  </span>
                  <div className="font-bold text-sm text-neutral-900">
                    {selectedAssessment.title}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {selectedAssessment.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Miền năng lực</span>
                    <span className="font-semibold text-neutral-800">
                      {selectedAssessment.domain}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Số câu hỏi</span>
                    <span className="font-semibold text-neutral-800">
                      {selectedAssessment.item_count || 40} câu
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Thời lượng dự kiến</span>
                    <span className="font-semibold text-neutral-800">
                      {selectedAssessment.duration_minutes} phút
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Điểm chuẩn đạt</span>
                    <span className="font-semibold text-emerald-600">
                      {selectedAssessment.passing_score}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Tiếp tục cấu hình</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Chưa có đề nào được chọn.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: CẤU HÌNH PHIÊN & CHỦ ĐỀ GIAO DIỆN */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Form: Settings & Theme Selection (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner Đề Đã Chọn */}
            {selectedAssessment && (
              <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      ĐỀ ĐÃ CHỌN
                    </span>
                    <div className="font-bold text-sm text-neutral-900">
                      {selectedAssessment.title}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Đổi đề khác
                </button>
              </div>
            )}

            {/* Section 1: Cài đặt cơ bản */}
            <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <span>Cài đặt cơ bản cho phiên thi</span>
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">
                    Tên phòng thi / Phiên thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="VD: Kiểm tra Giữa kỳ - Tin học K48"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-800 block mb-1">
                      Lịch mở phòng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-800 block mb-1">
                      Giờ bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-800 block mb-1">
                      Thời lượng làm bài <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                    >
                      <option value={15}>15 phút</option>
                      <option value={30}>30 phút</option>
                      <option value={45}>45 phút</option>
                      <option value={60}>60 phút</option>
                      <option value={90}>90 phút</option>
                      <option value={120}>120 phút</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">
                    Mô tả / Hướng dẫn cho thí sinh (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    maxLength={500}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                  />
                  <div className="text-[10px] text-slate-400 text-right">
                    {roomDescription.length}/500 ký tự
                  </div>
                </div>

                {/* Chế độ tham gia */}
                <div>
                  <label className="font-semibold text-neutral-800 block mb-1.5">
                    Chế độ tham gia <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setRoomMode('OPEN')}
                      className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                        roomMode === 'OPEN'
                          ? 'bg-blue-50/60 border-blue-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-neutral-900">
                          Mở tự do bằng PIN
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            roomMode === 'OPEN'
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {roomMode === 'OPEN' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Bất kỳ ai có mã PIN 6 số đều có thể tham gia vào phòng chờ.
                      </p>
                    </div>

                    <div
                      onClick={() => setRoomMode('GROUP_ONLY')}
                      className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                        roomMode === 'GROUP_ONLY'
                          ? 'bg-blue-50/60 border-blue-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-neutral-900">
                          Theo lớp / Nhóm chỉ định
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            roomMode === 'GROUP_ONLY'
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {roomMode === 'GROUP_ONLY' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chỉ các học viên trong danh sách lớp/nhóm được cấp quyền.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Cách bắt đầu & Sau khi nộp bài */}
            <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Cách bắt đầu & Quy định công bố</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Cách bắt đầu */}
                <div className="space-y-2">
                  <span className="font-semibold text-neutral-800 block">Cách bắt đầu:</span>
                  <div
                    onClick={() => setStartMode('MANUAL')}
                    className={`p-3 rounded-md border cursor-pointer ${
                      startMode === 'MANUAL'
                        ? 'bg-blue-50/60 border-blue-600'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-neutral-900">Bắt đầu thủ công</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Bạn tự bấm nút &ldquo;Bắt đầu bài thi&rdquo; để phát đề.
                    </div>
                  </div>

                  <div
                    onClick={() => setStartMode('SCHEDULED')}
                    className={`p-3 rounded-md border cursor-pointer ${
                      startMode === 'SCHEDULED'
                        ? 'bg-blue-50/60 border-blue-600'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-neutral-900">Tự mở theo lịch</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Hệ thống tự động phát đề đúng giờ đã hẹn.
                    </div>
                  </div>
                </div>

                {/* Sau khi nộp bài */}
                <div className="space-y-2">
                  <span className="font-semibold text-neutral-800 block">Sau khi nộp bài:</span>
                  <div
                    onClick={() => setSubmissionPolicy('SHOW_ON_PUBLISH')}
                    className={`p-3 rounded-md border cursor-pointer ${
                      submissionPolicy === 'SHOW_ON_PUBLISH'
                        ? 'bg-blue-50/60 border-blue-600'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-neutral-900">Cho xem khi Host công bố</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Thí sinh chờ trong phòng đến khi bạn duyệt và bấm công bố.
                    </div>
                  </div>

                  <div
                    onClick={() => setSubmissionPolicy('WAIT_FOR_PUBLISH')}
                    className={`p-3 rounded-md border cursor-pointer ${
                      submissionPolicy === 'WAIT_FOR_PUBLISH'
                        ? 'bg-blue-50/60 border-blue-600'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-neutral-900">Ẩn hoàn toàn kết quả</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Không xem điểm trong phòng thi, xem sau tại trang hồ sơ.
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center justify-between p-2.5 rounded bg-slate-50 cursor-pointer">
                  <span className="font-medium text-slate-700">Tự nộp bài khi hết giờ</span>
                  <input
                    type="checkbox"
                    checked={autoSubmitOnTimeout}
                    onChange={(e) => setAutoSubmitOnTimeout(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded bg-slate-50 cursor-pointer">
                  <span className="font-medium text-slate-700">Khóa phòng sau khi bắt đầu</span>
                  <input
                    type="checkbox"
                    checked={lockAfterStart}
                    onChange={(e) => setLockAfterStart(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded bg-slate-50 cursor-pointer">
                  <span className="font-medium text-slate-700">Cho phép vào phòng muộn</span>
                  <input
                    type="checkbox"
                    checked={allowLateJoin}
                    onChange={(e) => setAllowLateJoin(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded bg-slate-50 cursor-pointer">
                  <span className="font-medium text-slate-700">Hiển thị mã PIN cho thí sinh</span>
                  <input
                    type="checkbox"
                    checked={showPin}
                    onChange={(e) => setShowPin(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Section 3: Chủ đề giao diện phòng chờ (Screen 04) */}
            <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="space-y-1">
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Chủ đề giao diện phòng chờ (Theme)</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Nếu không chọn, hệ thống dùng giao diện <strong>Trắng tối giản</strong> làm mặc định.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(Object.keys(ROOM_THEMES) as RoomThemeId[]).map((themeKey) => {
                  const t = ROOM_THEMES[themeKey];
                  const isSelected = selectedTheme === themeKey;
                  return (
                    <div
                      key={themeKey}
                      onClick={() => setSelectedTheme(themeKey)}
                      className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 ring-1 ring-blue-600 shadow-xs bg-blue-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-neutral-900">{t.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {t.tagline}
                          </span>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                        {t.description}
                      </p>

                      {/* Theme visual preview pill */}
                      <div
                        className={`h-8 rounded flex items-center justify-center text-[10px] font-semibold border ${
                          themeKey === 'minimal_white'
                            ? 'bg-white text-slate-800 border-slate-200'
                            : themeKey === 'space_blue'
                            ? 'bg-slate-900 text-sky-300 border-sky-800'
                            : themeKey === 'aurora'
                            ? 'bg-indigo-950 text-purple-300 border-purple-800'
                            : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                        }`}
                      >
                        Mẫu hiển thị: {t.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Quay lại chọn đề
              </button>

              <button
                type="button"
                disabled={submitting || !roomTitle.trim()}
                onClick={handleCreateRoom}
                className="px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Radio className="w-4 h-4" />
                <span>{submitting ? 'Đang tạo phòng thi...' : 'Xác nhận & Mở phòng thi ngay'}</span>
              </button>
            </div>
          </div>

          {/* Right Summary Column: Sticky Configuration Preview (1 Col) */}
          <div className="bg-white rounded-md border border-slate-200 p-5 shadow-xs space-y-4 sticky top-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Radio className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Tóm tắt cấu hình phiên
              </h2>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                MÃ PIN PHÒNG THI
              </div>
              <div className="font-mono font-bold text-lg text-blue-600">
                Tự động cấp 6 số
              </div>
              <div className="text-[11px] text-slate-500">
                Mã PIN và link mời sẽ sẵn sàng ngay sau khi mở phòng.
              </div>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Lịch bắt đầu</span>
                <span className="font-semibold text-neutral-800">
                  {scheduledDate} &bull; {scheduledTime}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Thời lượng</span>
                <span className="font-semibold text-neutral-800">
                  {durationMinutes} phút
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Hình thức</span>
                <span className="font-semibold text-neutral-800">
                  {roomMode === 'OPEN' ? 'Mở tự do bằng PIN' : 'Theo lớp / nhóm'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Chủ đề giao diện</span>
                <span className="font-semibold text-blue-600">
                  {ROOM_THEMES[selectedTheme]?.name}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Tự nộp khi hết giờ</span>
                <span className="font-semibold text-emerald-600">
                  {autoSubmitOnTimeout ? 'Bật' : 'Tắt'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Khóa sau khi bắt đầu</span>
                <span className="font-semibold text-neutral-800">
                  {lockAfterStart ? 'Bật' : 'Tắt'}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || !roomTitle.trim()}
              onClick={handleCreateRoom}
              className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang kích hoạt...' : 'Mở phòng thi ngay'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
