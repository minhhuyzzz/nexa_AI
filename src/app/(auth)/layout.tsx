import Link from 'next/link';
import { NexaLogo } from '@/components/brand/NexaLogo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-6">
        <Link href="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
          <NexaLogo size="md" />
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
