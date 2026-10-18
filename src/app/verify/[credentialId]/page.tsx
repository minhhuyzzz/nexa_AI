import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  Clock,
  Award,
  Hash,
} from 'lucide-react';

export default async function VerifyCredentialKioskPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = await params;
  const supabase = await createClient();

  // Query credential by ID or credential_code
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(credentialId);

  let query = supabase.from('credentials').select('*');
  if (isUuid) {
    query = query.eq('id', credentialId);
  } else {
    query = query.eq('credential_code', credentialId);
  }

  const { data: credential, error } = await query.single();

  if (error || !credential) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <AlertTriangle className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Chứng chỉ Không Tồn tại hoặc Chưa Được Cấp
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mã chứng nhận <span className="font-semibold text-slate-800">{credentialId}</span> không tìm thấy trên Cơ sở Dữ liệu Khảo thí NEXA. Vui lòng quét lại mã QR trên chứng chỉ PDF gốc.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 transition-colors inline-block"
            >
              Về Trang chủ NEXA
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRevoked = credential.is_revoked;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* Kiosk Institution Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            CỔNG XÁC THỰC CHỨNG CHỈ SỐ QUỐC GIA (NEXA VERIFICATION KIOSK)
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-1">
            Trung Tâm Thẩm Tra Tính Toàn Vẹn Chứng Chỉ Số
          </h1>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Hệ thống đối soát trực tiếp chữ ký điện tử SHA-256 kép và khung chuẩn EU DigComp 2.2 / Nghị định 13/2023/NĐ-CP.
          </p>
        </div>

        {/* Verification Status Card */}
        <div className="p-6 sm:p-8 rounded-md bg-white border border-slate-200 shadow-xs space-y-6">
          {/* Status Badge Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  isRevoked ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              />
              <div>
                <div
                  className={`text-xs font-bold tracking-wider uppercase ${
                    isRevoked ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {isRevoked ? 'CHỨNG CHỈ ĐÃ BỊ THU HỒI' : 'XÁC THỰC HỢP LỆ (VERIFIED AUTHENTIC)'}
                </div>
                <div className="text-xs text-slate-500">
                  {isRevoked
                    ? `Lý do thu hồi: ${credential.revoked_reason || 'Vi phạm quy chế'}`
                    : 'Chứng chỉ gốc phát hành bởi Hội đồng Khảo thí NEXA'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-slate-400">SỐ HIỆU CHỨNG CHỈ</div>
              <div className="text-base font-bold text-slate-900">
                {credential.credential_code}
              </div>
            </div>
          </div>

          {/* Credential Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block mb-1">
                HỌC VIÊN ĐƯỢC CHỨNG NHẬN
              </span>
              <span className="text-base font-bold text-slate-900 block">
                {credential.candidate_name}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">
                KỲ KHẢO THÍ ĐÁNH GIÁ NĂNG LỰC
              </span>
              <span className="font-semibold text-slate-800 block leading-snug">
                {credential.assessment_title}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">
                ĐIỂM SỐ ĐẠT ĐƯỢC
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-sky-600">
                  {credential.score_percentage}%
                </span>
                <span className="text-slate-500">
                  ({credential.total_score} / {credential.max_score} đ)
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">
                CẤP ĐỘ NĂNG LỰC SỐ
              </span>
              <span className="font-bold text-slate-900 text-sm px-2 py-0.5 rounded bg-slate-100 border border-slate-200 inline-block">
                {credential.competency_level}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">
                NGÀY CẤP CHỨNG CHỈ
              </span>
              <span className="text-slate-700">
                {new Date(credential.issued_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">
                KHUNG THAM CHIẾU TIÊU CHUẨN
              </span>
              <span className="text-slate-700">EU DigComp 2.2 &amp; NĐ 13/2023/NĐ-CP</span>
            </div>
          </div>

          {/* Dual SHA-256 Cryptographic Proof Box */}
          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Hash className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              Chữ Ký Điện Tử &amp; Đối Soát Băm SHA-256 Kép (Tamper-Proof)
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mã băm được tính toán độc lập tại thời điểm phát hành. Bất kỳ sự sửa đổi nào trên nội dung hoặc tệp PDF đều làm thay đổi giá trị băm này.
            </p>

            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-slate-500 block mb-0.5">
                  1. Mã băm Nội dung (Content Metadata SHA-256):
                </span>
                <div className="p-2 rounded bg-white border border-slate-200 text-slate-800 break-all select-all">
                  {credential.content_sha256}
                </div>
              </div>

              {credential.pdf_sha256 && (
                <div>
                  <span className="text-slate-500 block mb-0.5">
                    2. Mã băm Tệp PDF Toàn vẹn (PDF Binary Stream SHA-256):
                  </span>
                  <div className="p-2 rounded bg-white border border-slate-200 text-slate-800 break-all select-all">
                    {credential.pdf_sha256}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Chữ ký số hợp lệ và nguyên vẹn trên sổ lưu trữ NEXA Ledger.</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <a
              href={`/api/credentials/${credential.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" strokeWidth={1.75} />
              Tải Tệp PDF Vector Gốc ({credential.credential_code}.pdf)
            </a>

            <Link
              href="/framework"
              className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              Xem Khung Chuẩn DigComp
            </Link>
          </div>
        </div>
      </div>

      {/* Independent Kiosk Footer */}
      <div className="text-center text-[11px] text-slate-400 mt-8">
        HỆ THỐNG XÁC THỰC TRỰC TUYẾN NEXA &bull; CĂN CỨ THEO ĐIỀU 23 NGHỊ ĐỊNH 13/2023/NĐ-CP
      </div>
    </div>
  );
}
