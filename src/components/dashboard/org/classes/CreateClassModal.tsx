'use client';

import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Users,
  Layers,
  Check,
  Eye,
  Loader2,
  Calendar,
  User,
  Hash,
  AlertCircle,
  Building,
} from 'lucide-react';
import type { GroupType } from './types';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

export function CreateClassModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: CreateClassModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('CLASS');
  const [description, setDescription] = useState('');
  const [term, setTerm] = useState('Học kỳ Fall 2026');
  const [instructorName, setInstructorName] = useState('');
  const [maxCapacity, setMaxCapacity] = useState<number>(50);

  // Settings checkboxes
  const [allowJoinCode, setAllowJoinCode] = useState(true);
  const [isActiveListed, setIsActiveListed] = useState(true);
  const [createResourceFolder, setCreateResourceFolder] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp / nhóm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          classCode: classCode.trim() || undefined,
          groupType,
          description: description.trim() || undefined,
          term: term || undefined,
          instructorName: instructorName.trim() || undefined,
          maxCapacity: Number(maxCapacity),
          settings: {
            allowJoinCode,
            isActiveListed,
            createResourceFolder,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tạo lớp thất bại');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo lớp');
    } finally {
      setLoading(false);
    }
  };

  const getGroupTypeLabel = (type: GroupType) => {
    switch (type) {
      case 'DEPARTMENT':
        return 'Phòng ban';
      case 'PROJECT_GROUP':
        return 'Nhóm dự án';
      default:
        return 'Lớp học';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Tạo lớp / nhóm mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Thiết lập lớp học, phòng ban hoặc nhóm dự án để quản lý thành viên và hoạt động đánh giá.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Steps indicator */}
        <div className="grid grid-cols-3 border-b border-slate-100 dark:border-zinc-800 text-xs bg-slate-50/50 dark:bg-zinc-900/50">
          {[
            { num: 1, label: 'Thông tin cơ bản' },
            { num: 2, label: 'Thành viên & phụ trách' },
            { num: 3, label: 'Xác nhận' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as 1 | 2 | 3)}
              className={`py-2 px-3 text-center border-b-2 font-medium flex items-center justify-center gap-1.5 transition ${
                step === s.num
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#111114]'
                  : step > s.num
                    ? 'border-transparent text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 dark:text-zinc-600'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                  step === s.num
                    ? 'bg-blue-600 text-white'
                    : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                }`}
              >
                {step > s.num ? <Check className="w-2.5 h-2.5" /> : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
          {/* Left Form (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Row 1: Name and Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Tên lớp / nhóm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Lớp K66 – Khoa CNTT"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Mã lớp / nhóm (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: K66-CNTT (để trống sẽ tự tạo)"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded font-mono text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Row 2: Group Types 3 Cards */}
                <div>
                  <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1.5">
                    Loại nhóm <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Card 1: Lớp học */}
                    <div
                      onClick={() => setGroupType('CLASS')}
                      className={`p-3 rounded-md border cursor-pointer transition flex flex-col justify-between ${
                        groupType === 'CLASS'
                          ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/30 ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                          <GraduationCap className="w-4 h-4" />
                          <span>Lớp học</span>
                        </div>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            groupType === 'CLASS'
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {groupType === 'CLASS' && <Check className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        Lớp đào tạo, gắn với học kỳ, môn học và hoạt động học tập.
                      </p>
                    </div>

                    {/* Card 2: Phòng ban */}
                    <div
                      onClick={() => setGroupType('DEPARTMENT')}
                      className={`p-3 rounded-md border cursor-pointer transition flex flex-col justify-between ${
                        groupType === 'DEPARTMENT'
                          ? 'border-purple-600 bg-purple-50/30 dark:bg-purple-950/30 ring-1 ring-purple-600'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-purple-600 font-semibold">
                          <Building className="w-4 h-4" />
                          <span>Phòng ban</span>
                        </div>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            groupType === 'DEPARTMENT'
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {groupType === 'DEPARTMENT' && <Check className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        Đơn vị chức năng trong tổ chức (ví dụ: Phòng Đào tạo).
                      </p>
                    </div>

                    {/* Card 3: Nhóm dự án */}
                    <div
                      onClick={() => setGroupType('PROJECT_GROUP')}
                      className={`p-3 rounded-md border cursor-pointer transition flex flex-col justify-between ${
                        groupType === 'PROJECT_GROUP'
                          ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Layers className="w-4 h-4" />
                          <span>Nhóm dự án</span>
                        </div>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            groupType === 'PROJECT_GROUP'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {groupType === 'PROJECT_GROUP' && <Check className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        Nhóm làm việc theo dự án, nhiệm vụ hoặc sự kiện.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Row 3: Description */}
                <div>
                  <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Nhập mô tả ngắn về lớp / nhóm, mục tiêu, phạm vi hoạt động..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Row 4: Term, Instructor, Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Học kỳ / đợt
                    </label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Học kỳ Fall 2026">Học kỳ Fall 2026</option>
                      <option value="Học kỳ Spring 2026">Học kỳ Spring 2026</option>
                      <option value="Học kỳ Summer 2026">Học kỳ Summer 2026</option>
                      <option value="Đợt tập huấn Q4/2026">Đợt tập huấn Q4/2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Giảng viên / phụ trách chính
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: TS. Trần Thị Mai"
                      value={instructorName}
                      onChange={(e) => setInstructorName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Sức chứa dự kiến
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Row 5: Default toggles */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 block mb-1">
                    Thiết lập mặc định
                  </span>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-[11px] text-slate-700 dark:text-zinc-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowJoinCode}
                        onChange={(e) => setAllowJoinCode(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Cho phép tự tham gia bằng mã</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActiveListed}
                        onChange={(e) => setIsActiveListed(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Hiển thị trong danh sách hoạt động</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createResourceFolder}
                        onChange={(e) => setCreateResourceFolder(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Tạo thư mục tài nguyên lớp</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Members & Staff confirmation */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-3">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Phụ trách & Điều hành lớp
                  </h4>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                      {instructorName ? instructorName.slice(0, 2).toUpperCase() : 'GV'}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {instructorName || 'Chưa phân công giảng viên chính'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Vai trò: Giảng viên phụ trách lớp • Toàn quyền giao đề và chấm bài
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded text-blue-800 dark:text-blue-300">
                  <p className="font-semibold">Lưu ý sau khi tạo:</p>
                  <p className="text-[11px] mt-0.5">
                    Sau khi khởi tạo lớp học thành công, bạn có thể thêm học viên ngay qua Drawer &quot;Thêm thành viên&quot; hoặc tạo Mã tham gia để sinh viên tự ghi danh.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Final confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm">Sẵn sàng khởi tạo lớp học</h4>
                  </div>
                  <p className="text-xs">
                    Vui lòng kiểm tra lại bảng tóm tắt cấu hình ở bên phải trước khi nhấn &quot;Tạo lớp ngay&quot;.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Panel (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3.5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-zinc-800">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                Xem trước cấu hình
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Tóm tắt các thiết lập chính của lớp / nhóm.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-zinc-800">
                <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> Loại nhóm:
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {getGroupTypeLabel(groupType)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-zinc-800">
                <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Phụ trách:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[120px]">
                  {instructorName || 'Chưa chọn'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-zinc-800">
                <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Học kỳ / đợt:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {term || 'Chưa chọn'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-zinc-800">
                <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Sức chứa:
                </span>
                <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-neutral-100">
                  {maxCapacity} thành viên
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-neutral-900 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition"
          >
            Hủy
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                className="px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md hover:bg-slate-50 font-medium transition"
              >
                Quay lại
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (!name.trim()) {
                    setError('Vui lòng nhập tên lớp / nhóm');
                    return;
                  }
                  setError(null);
                  setStep((s) => (s + 1) as 2 | 3);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tạo lớp...</span>
                  </>
                ) : (
                  <span>Tạo lớp / nhóm ngay</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
