import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PersonalItemBankPage() {
  // Redirection: Ngân hàng câu hỏi cá nhân được tích hợp trực tiếp trong Trình biên soạn /personal/authoring
  redirect('/personal/authoring');
}
