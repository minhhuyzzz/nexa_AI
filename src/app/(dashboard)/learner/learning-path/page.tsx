'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';

interface RoadmapStep {
  id: string;
  stepNumber: number;
  domainCode: string;
  skillName: string;
  title: string;
  description: string;
  durationMinutes: number;
  pointReward: number;
  status: 'completed' | 'in_progress' | 'locked';
  completedAt?: string;
  contentMarkdown: string;
}

const mockSteps: RoadmapStep[] = [
  {
    id: 'step-01',
    stepNumber: 1,
    domainCode: 'D0',
    skillName: 'Khảo sát chẩn đoán',
    title: 'Khảo sát đánh giá năng lực số ban đầu',
    description: 'Xác định điểm mạnh và nhận diện các kỹ năng còn khoảng trống (< 60%) cần bồi dưỡng.',
    durationMinutes: 15,
    pointReward: 50,
    status: 'completed',
    completedAt: '12/10/2026',
    contentMarkdown: 'Học viên đã hoàn thành bài khảo sát chẩn đoán với điểm số 82/100. Hệ thống đã xác định 2 kỹ năng trọng tâm cần bồi dưỡng: 4.1 Bảo vệ thiết bị & danh tính số và 3.2 Tác vụ cùng AI.',
  },
  {
    id: 'step-02',
    stepNumber: 2,
    domainCode: 'D4',
    skillName: '4.1 Bảo vệ thiết bị & danh tính số',
    title: 'Thiết lập xác thực 2 bước (2FA) & Quản lý mật khẩu an toàn',
    description: 'Hướng dẫn cài đặt ứng dụng TOTP Authenticator, tạo mật khẩu mạnh và quản lý mã dự phòng khi đăng nhập thiết bị mới.',
    durationMinutes: 10,
    pointReward: 30,
    status: 'completed',
    completedAt: '15/10/2026',
    contentMarkdown: `### 1. Tại sao mật khẩu truyền thống không còn an toàn?
Trên 80% vụ lộ lọt dữ liệu bắt nguồn từ việc sử dụng mật khẩu yếu hoặc tái sử dụng mật khẩu. Kẻ gian có thể dò quét từ điển (Brute-force) hoặc lừa đảo qua thư điện tử giả mạo (Phishing).

### 2. Nguyên tắc thiết lập xác thực 2 bước (2FA):
- Tải ứng dụng Google Authenticator hoặc Microsoft Authenticator trên điện thoại.
- Bật 2FA trong Cài đặt tài khoản của email và mạng xã hội.
- Lưu lại 10 mã khóa dự phòng (Backup codes) ở nơi an toàn ngoài máy tính.`,
  },
  {
    id: 'step-03',
    stepNumber: 3,
    domainCode: 'D3',
    skillName: '3.2 Sáng tạo & hợp tác cùng AI',
    title: 'Kỹ năng đặt câu lệnh (Prompting) & Kiểm chứng nội dung AI',
    description: 'Nắm vững cấu trúc câu lệnh đa thành phần: Bối cảnh (Context), Nhiệm vụ (Task), Giới hạn (Constraints) và Định dạng đầu ra (Output Format).',
    durationMinutes: 15,
    pointReward: 30,
    status: 'in_progress',
    contentMarkdown: `### Cấu trúc câu lệnh chuẩn RTCO
Để nhận được kết quả chính xác từ mô hình AI, câu lệnh nên tuân theo mô hình 4 thành phần:
- **Role (Vai trò)**: Đóng vai chuyên gia phân tích dữ liệu giáo dục.
- **Task (Nhiệm vụ)**: Hãy tổng hợp bản báo cáo khảo sát thành 3 khuyến nghị cụ thể.
- **Context (Bối cảnh)**: Dành cho sinh viên năm nhất đang theo học môn Tin học ứng dụng.
- **Output (Định dạng)**: Trả về bảng so sánh 3 cột gồm Tên kỹ năng, Mức độ ưu tiên, Hành động cụ thể.

### Nguyên tắc kiểm định thông tin:
Luôn kiểm chứng chéo số liệu do AI trích dẫn trước khi đưa vào văn bản báo cáo chính thức.`,
  },
  {
    id: 'step-04',
    stepNumber: 4,
    domainCode: 'D1',
    skillName: '1.2 Xử lý & Phân tích dữ liệu',
    title: 'Xử lý, làm sạch và trực quan hóa dữ liệu trên bảng tính',
    description: 'Thao tác trích lọc nâng cao, sử dụng hàm thống kê tổng hợp và chọn dạng biểu đồ trực quan hóa dữ liệu chính xác.',
    durationMinutes: 18,
    pointReward: 30,
    status: 'locked',
    contentMarkdown: `### Nguyên tắc chọn dạng biểu đồ:
- **Biểu đồ Cột (Column/Bar Chart)**: So sánh số lượng giữa các nhóm đối tượng độc lập.
- **Biểu đồ Đường (Line Chart)**: Thể hiện xu hướng biến đổi dữ liệu theo trục thời gian.
- **Biểu đồ Mạng nhện (Radar Chart)**: So sánh đồng thời nhiều tiêu chí đánh giá năng lực so với chuẩn mục tiêu.`,
  },
  {
    id: 'step-05',
    stepNumber: 5,
    domainCode: 'D5',
    skillName: 'Chứng nhận năng lực',
    title: 'Khảo sát tổng kết & Cấp Chứng chỉ Số NEXA Credential',
    description: 'Bài kiểm tra tổng hợp khẳng định sự tiến bộ, cấp chứng nhận số có mã xác thực QR và Hash SHA-256.',
    durationMinutes: 20,
    pointReward: 80,
    status: 'locked',
    contentMarkdown: 'Sau khi hoàn thành các bước học liệu bồi dưỡng, học viên thực hiện bài khảo sát tổng kết để đối soát tiến bộ Pre/Post và nhận Chứng chỉ Số NEXA.',
  },
];

export default function LearningPathPage() {
  const [steps, setSteps] = useState<RoadmapStep[]>(mockSteps);
  const [expandedStepId, setExpandedStepId] = useState<string>('step-03');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleCompleteStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (step.id === stepId) {
          return { ...step, status: 'completed', completedAt: 'Vừa xong' };
        }
        // Unlock next step
        if (idx > 0 && prev[idx - 1].id === stepId && step.status === 'locked') {
          return { ...step, status: 'in_progress' };
        }
        return step;
      })
    );
    setToastMessage('Tuyệt vời! Bạn đã hoàn thành học liệu, nhận +30 điểm và mở khóa bước tiếp theo.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              LỘ TRÌNH CÁ NHÂN HÓA
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lộ Trình Phát Triển Năng Lực Số
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Học tập theo các bước gợi ý từ AI để bồi dưỡng khoảng trống kỹ năng và mở khóa quyền đánh giá lại.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/learner/assessments"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đánh giá lại kỹ năng</span>
          </Link>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100 font-bold text-sm">
            {progressPercent}%
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Tiến độ lộ trình học tập ({completedCount}/{steps.length} bước)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Hoàn thành các bước để sẵn sàng cho bài khảo sát cấp chứng chỉ số.
            </div>
          </div>
        </div>

        <div className="w-full sm:w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-sky-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Visual Vertical Milestone Roadmap */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
        {steps.map((step) => {
          const isExpanded = expandedStepId === step.id;
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in_progress';
          const isLocked = step.status === 'locked';

          return (
            <div key={step.id} className="relative">
              {/* Node indicator */}
              <div
                className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isInProgress
                    ? 'bg-sky-600 border-sky-600 text-white ring-4 ring-sky-100'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isLocked ? (
                  <Lock className="w-3 h-3 stroke-[2]" />
                ) : (
                  <span>{step.stepNumber}</span>
                )}
              </div>

              {/* Milestone Card */}
              <div
                className={`rounded-2xl border transition-all ${
                  isInProgress
                    ? 'bg-white border-sky-200 shadow-xs'
                    : isCompleted
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50/60 border-slate-200/80 opacity-75'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => !isLocked && setExpandedStepId(isExpanded ? '' : step.id)}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 ${
                    !isLocked ? 'cursor-pointer hover:bg-slate-50/50' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Bước {step.stepNumber} • {step.domainCode}
                      </span>
                      {isCompleted && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Đã hoàn thành {step.completedAt ? `(${step.completedAt})` : ''}
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          Đang thực hiện
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[11px] text-slate-400">Chưa mở</span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-2xl">
                      {step.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block text-right text-xs">
                      <div className="text-slate-400 text-[11px]">{step.durationMinutes} phút</div>
                      <div className="font-semibold text-emerald-600">+{step.pointReward}đ</div>
                    </div>

                    {!isLocked && (
                      <div className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Micro-Learning Content */}
                {isExpanded && !isLocked && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 leading-relaxed space-y-2 whitespace-pre-line">
                      {step.contentMarkdown}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-400">
                        Đọc kỹ tài liệu và áp dụng vào bài tập thực hành.
                      </div>

                      {isInProgress && (
                        <button
                          onClick={() => handleCompleteStep(step.id)}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Đã hoàn thành bước này (+{step.pointReward}đ)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
