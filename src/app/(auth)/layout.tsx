import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            NEXA<span className="text-sky-600">.</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 shadow-xs">
            Digital Competency
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-md shadow-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
