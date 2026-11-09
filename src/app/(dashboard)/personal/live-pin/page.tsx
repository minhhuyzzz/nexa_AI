import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PersonalLivePinPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const { pin } = (await searchParams) || {};
  if (pin && pin.trim()) {
    redirect(`/live/waiting-room?pin=${encodeURIComponent(pin.trim())}`);
  }
  redirect('/personal/live-room');
}
