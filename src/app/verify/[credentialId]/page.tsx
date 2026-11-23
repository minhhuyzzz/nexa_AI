import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowLeft,
  Search,
  Hash,
} from 'lucide-react';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { CertificateCanvas } from '@/components/credentials/CertificateCanvas';

export const metadata: Metadata = {
  title: 'Xác thực chứng nhận số — NEXA AI',
  description: 'Trung tâm thẩm tra và đối soát tính toàn vẹn chứng chỉ năng lực số do NEXA AI phát hành.',
  robots: { index: false, follow: false },
};

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

  const { data: dbCredential } = await query.single();
  const credential = dbCredential;

  if (!credential) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full mx-auto flex items-center justify-between pb-6">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
            <NexaLogo size={28} />
          </Link>
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tra cứu mã khác</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Chứng chỉ không tồn tại hoặc chưa cấp
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Mã chứng nhận <span className="font-semibold text-neutral-900 dark:text-neutral-200 font-mono">{credentialId}</span> không tìm thấy trên hệ thống khảo thí của NEXA AI. Vui lòng kiểm tra lại mã hoặc quét lại mã QR trên văn bằng gốc.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/verify"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors inline-flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tra cứu lại</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-medium transition-colors inline-flex items-center justify-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>

        <div />
      </div>
    );
  }

  const isRevoked = credential.is_revoked;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Bar */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
          <NexaLogo size={28} />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tra cứu mã khác</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* Verification Status Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800/90 shadow-sm space-y-6">
          {/* Status Badge Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  isRevoked ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              />
              <div>
                <div
                  className={`text-xs font-bold tracking-wider uppercase ${
                    isRevoked ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {isRevoked ? 'CHỨNG CHỈ ĐÃ BỊ THU HỒI' : 'XÁC THỰC HỢP LỆ — CHỨNG NHẬN CHÍNH THỨC'}
                </div>
                <div className="text-xs text-slate-500 dark:text-neutral-400">
                  {isRevoked
                    ? `Lý do: ${credential.revoked_reason || 'Vi phạm quy chế khảo thí'}`
                    : 'Chứng nhận năng lực số phát hành bởi NEXA AI'}
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">ID CHỨNG DANH</div>
              <div className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                {credential.credential_code}
              </div>
            </div>
          </div>

          {/* Visual Certificate Canvas */}
          <div className="overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[620px] sm:min-w-0">
              <CertificateCanvas
                candidateName={credential.candidate_name}
                credentialCode={credential.credential_code}
                issuedAt={credential.issued_at}
                isSample={false}
              />
            </div>
          </div>

          {/* Credential Data Grid (KHÔNG ĐIỂM SỐ, KHÔNG CẤP ĐỘ) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-1">
              <span className="text-slate-400 dark:text-neutral-500 text-[11px] block font-medium">
                HỌC VIÊN ĐƯỢC CHỨNG NHẬN
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 block">
                {credential.candidate_name}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-1">
              <span className="text-slate-400 dark:text-neutral-500 text-[11px] block font-medium">
                KỲ ĐÁNH GIÁ NĂNG LỰC SỐ
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block leading-snug">
                {credential.assessment_title}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-1">
              <span className="text-slate-400 dark:text-neutral-500 text-[11px] block font-medium">
                NGÀY CẤP CHỨNG CHỈ
              </span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                {new Date(credential.issued_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-1">
              <span className="text-slate-400 dark:text-neutral-500 text-[11px] block font-medium">
                TÌNH TRẠNG HIỆU LỰC
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={`w-2 h-2 rounded-full ${isRevoked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className={`font-semibold ${isRevoked ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {isRevoked ? 'Đã thu hồi / Vô hiệu hóa' : 'Hợp lệ & Sẵn sàng xác thực'}
                </span>
              </div>
            </div>
          </div>

          {/* Dual SHA-256 Cryptographic Proof Box */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
              <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <span>Chữ ký số & Đối soát mã băm SHA-256 kép (Tamper-Proof)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Mã băm được tính toán độc lập tại thời điểm phát hành. Bất kỳ sự sửa đổi nào trên nội dung hoặc tệp PDF đều làm thay đổi giá trị băm này.
            </p>

            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-neutral-400 block mb-1">
                  1. Mã băm nội dung (Content Metadata SHA-256):
                </span>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-neutral-200 font-mono text-[10px] break-all select-all">
                  {credential.content_sha256}
                </div>
              </div>

              {credential.pdf_sha256 && (
                <div>
                  <span className="text-slate-500 dark:text-neutral-400 block mb-1">
                    2. Mã băm tệp PDF (Binary Stream SHA-256):
                  </span>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-neutral-200 font-mono text-[10px] break-all select-all">
                    {credential.pdf_sha256}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Chữ ký điện tử nguyên vẹn và khớp hoàn toàn trên hệ thống NEXA AI.</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <a
              href={`/api/credentials/${credential.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" strokeWidth={1.75} />
              <span>Tải bản PDF gốc ({credential.credential_code}.pdf)</span>
            </a>

            <Link
              href="/verify"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>Tra cứu chứng chỉ khác</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Independent Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-neutral-500 mt-8">
        HỆ THỐNG ĐỐI SOÁT CHỨNG CHỈ SỐ NEXA AI &bull; BẢO ĐẢM TÍNH TOÀN VẸN DỮ LIỆU
      </div>
    </div>
  );
}
