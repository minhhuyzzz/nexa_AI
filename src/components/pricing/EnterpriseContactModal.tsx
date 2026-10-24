'use client';

import { useState } from 'react';
import { X, Building2, User, Phone, Mail, Users, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface EnterpriseContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnterpriseContactModal({ isOpen, onClose }: EnterpriseContactModalProps) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [expectedLearners, setExpectedLearners] = useState('500');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/organizations/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contactName,
          phone,
          email,
          expectedLearners: Number(expectedLearners) || 500,
          notes,
          type: 'EDUCATIONAL',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gửi yêu cầu thất bại');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối mạng, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-md border border-slate-200 shadow-md max-w-lg w-full overflow-hidden text-slate-900 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h3 className="text-sm font-bold text-slate-900">
              Đăng Ký Khảo Thí Cho Trường Học &amp; Doanh Nghiệp
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
            </div>
            <h4 className="text-base font-bold text-slate-900">Gửi Yêu Cầu Thành Công</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Thông tin của đơn vị <strong>{name}</strong> đã được chuyển tới Ban điều hành NEXA.
              Chúng tôi sẽ liên hệ trao đổi phương án cấp mã trường và triển khai qua SĐT/Zalo <strong>{phone}</strong> trong vòng 24 giờ làm việc.
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Đóng thông báo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            <p className="text-xs text-slate-500 leading-relaxed">
              Giải pháp cấp quyền Giảng viên không giới hạn, đồng loạt kích hoạt quyền VIP cho sinh viên và xuất báo cáo dữ liệu 5 Miền DigComp phục vụ kiểm định chất lượng đào tạo.
            </p>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Trường Đại học / Viện / Đơn vị <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trường Đại học Công nghiệp TP.HCM"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Người đại diện liên hệ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="text"
                    required
                    placeholder="Thầy/Cô, Anh/Chị"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại / Zalo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="tel"
                    required
                    placeholder="0912 xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email đơn vị công tác
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    type="email"
                    placeholder="contact@truong.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quy mô sinh viên dự kiến
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <select
                    value={expectedLearners}
                    onChange={(e) => setExpectedLearners(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono"
                  >
                    <option value="200">Khoảng 200 sinh viên</option>
                    <option value="500">Khoảng 500 sinh viên</option>
                    <option value="1000">Khoảng 1.000 sinh viên</option>
                    <option value="2500">Khoảng 2.500 sinh viên</option>
                    <option value="5000">Trên 5.000 sinh viên</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhu cầu hoặc ghi chú cụ thể
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Cần kiểm định đầu ra chuẩn tin học & năng lực số cho sinh viên năm 3..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 resize-none"
              />
            </div>

            {/* Footer buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi yêu cầu tư vấn</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
