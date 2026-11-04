import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PersonalExamsPage() {
  // Redirection: Chức năng quản lý và biên soạn đề đã được hợp nhất vào /personal/authoring
  redirect('/personal/authoring');
}
