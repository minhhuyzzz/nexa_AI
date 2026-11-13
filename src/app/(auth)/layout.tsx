import Link from 'next/link';
import { NexaLogo } from '@/components/brand/NexaLogo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-[500px] flex justify-center mb-8">
        <Link href="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
          <NexaLogo size="md" />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[500px]">
        <div className="bg-white dark:bg-black py-2 px-2 sm:px-4">
          {children}
        </div>
      </div>
    </div>
  );
}
