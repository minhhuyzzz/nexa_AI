'use client';

import { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  FileCheck,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle,
  Building,
} from 'lucide-react';

export default function LearnerProfilePage() {
  const [fullName, setFullName] = useState('Trần Minh Huy');
  const [email] = useState('minhhuy@nexa.edu.vn');
  const [institution, setInstitution] = useState('Trường Đại học Quốc gia Hà Nội');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cài đặt tài khoản & Hồ sơ cá nhân
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý thông tin định danh, bảo mật phiên đăng nhập và quyền riêng tư dữ liệu.
        </p>
      </div>

      {/* Main Profile Info Form */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white text-xl font-bold flex items-center justify-center shrink-0">
            MH
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{email}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                Học viên (Cố định)
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Họ và tên hiển thị trên chứng chỉ
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Địa chỉ Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Đơn vị / Trường học / Tổ chức
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500 bg-white"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            {isSaved ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã lưu thông tin thành công</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Thông tin này sẽ được in trực tiếp lên các văn bằng, chứng chỉ số.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Security & Authentication */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <KeyRound className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Bảo mật tài khoản</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Đổi mật khẩu</div>
            <div className="text-[11px] text-slate-500">
              Cập nhật mật khẩu định kỳ để bảo vệ tài khoản và kết quả khảo thí.
            </div>
          </div>
          <button className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shrink-0">
            Cập nhật mật khẩu
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-t border-slate-100">
          <div>
            <div className="text-xs font-bold text-slate-900">Xác thực hai lớp (2FA)</div>
            <div className="text-[11px] text-slate-500">
              Bảo vệ phiên đăng nhập bằng mã OTP từ ứng dụng Google Authenticator.
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium shrink-0">
            Chưa kích hoạt
          </span>
        </div>
      </div>

      {/* Data Privacy & Consent */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Quyền riêng tư & Bảo vệ dữ liệu cá nhân
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Đồng thuận xử lý dữ liệu học tập</div>
              <div className="text-[11px] text-slate-500">
                Cho phép hệ thống AI và Chuyên gia đánh giá chấm bài và phân tích năng lực.
              </div>
            </div>
            <span className="text-emerald-600 font-semibold text-xs shrink-0">
              Đã đồng thuận
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <div className="font-semibold text-slate-900">Trích xuất hồ sơ dữ liệu cá nhân</div>
              <div className="text-[11px] text-slate-500">
                Tải xuống bản sao lưu toàn bộ kết quả thi, chứng chỉ và lịch sử học tập.
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span>Tải file JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
