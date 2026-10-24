import { redirect } from 'next/navigation';

export default function AdminEvaluatorsRedirect() {
  redirect('/admin/users');
}
