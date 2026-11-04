import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PersonalLivePinPage() {
  // Redirection: Tham gia phòng thi qua mã PIN đã được tích hợp qua QuickPinModal trên Topbar và /personal/live-room
  redirect('/personal/live-room');
}
