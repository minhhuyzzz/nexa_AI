import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
          404 ERROR
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Trang không tồn tại
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Đường dẫn bạn yêu cầu không tìm thấy hoặc đã được di chuyển. Vui lòng quay lại trang chủ.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
