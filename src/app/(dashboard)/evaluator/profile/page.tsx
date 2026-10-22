'use client';

import { useState } from 'react';
import {
  User,
  ShieldCheck,
  Award,
  CheckCircle2,
  FileCheck,
  Building,
  Mail,
  Phone,
  Save,
  ExternalLink,
  Layers,
  KeyRound,
  FileText,
} from 'lucide-react';

export default function EvaluatorProfilePage() {
  const [displayName, setDisplayName] = useState('Nguyễn Văn Hùng');
  const [email] = useState('vanhung@nexa.vn');
  const [phone, setPhone] = useState('0912 345 678');
  const [organization, setOrganization] = useState('Trung tâm Đổi mới Sáng tạo Quốc gia');
  const [bio, setBio] = useState(
    'Chuyên gia thẩm định dữ liệu & giải pháp số doanh nghiệp với hơn 10 năm kinh nghiệm trong lĩnh vực đánh giá năng lực công nghệ và tự động hóa tác vụ.'
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              THÔNG TIN ĐỊNH DANH
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hồ Sơ Chuyên Gia Khảo Thí
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị thông tin thẩm định viên, thẻ chuyên gia khảo thí và phạm vi các miền năng lực số được ủy quyền.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Save className="w-4 h-4" strokeWidth={2} />
          <span>Lưu thông tin</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Hồ sơ chuyên gia khảo thí đã được cập nhật thành công.</span>
          </div>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-xl shrink-0">
            VH
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Đã thẩm định chính thức
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                EXP-D1-0024
              </span>
            </div>
            <div className="text-xs text-slate-500">{organization}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Thành viên hội đồng khảo thí từ: 01/09/2026
            </div>
          </div>
        </div>

        {/* Evaluation Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-slate-100 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Bài đã thẩm định</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">148</div>
            <div className="text-[10px] text-slate-500">Chấm Rubric &amp; Minh chứng</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Độ khớp AI Cross-Check</div>
            <div className="text-xl font-bold text-sky-600 font-mono tabular-nums mt-1">96.5%</div>
            <div className="text-[10px] text-slate-500">Chuẩn xác &amp; khách quan</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Nhóm đang phụ trách</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">2 nhóm</div>
            <div className="text-[10px] text-slate-500">42 người học tham gia</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Phản hồi từ người học</div>
            <div className="text-xl font-bold text-emerald-600 font-mono tabular-nums mt-1">4.9 / 5.0</div>
            <div className="text-[10px] text-slate-500">Đánh giá nhận xét chi tiết</div>
          </div>
        </div>

        {/* Assigned Competency Domains */}
        <div className="py-5 border-b border-slate-100 space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Phạm Vi Thẩm Định Năng Lực Số
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">
                  Tìm kiếm, đánh giá và quản lý thông tin
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Thẩm định năng lực truy vấn, tổ chức bảng tính và trích xuất dữ liệu nâng cao
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                Level 3-4 (Advanced)
              </span>
            </div>

            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">
                  Nhận diện và giải quyết vấn đề
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Thẩm định thiết lập Prompt chuẩn RTCO, tự động hóa tác vụ và khắc phục sự cố kỹ thuật
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                Level 3-4 (Advanced)
              </span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="pt-5 space-y-4 text-xs">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Cập Nhật Chi Tiết Liên Hệ
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Họ và tên chuyên gia:
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tổ chức / Cơ quan công tác:
              </label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Email khảo thí (cố định):
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Số điện thoại liên hệ:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tiểu sử tóm tắt &amp; Kinh nghiệm chuyên môn:
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
            >
              Lưu thay đổi hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
