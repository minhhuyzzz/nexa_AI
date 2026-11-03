import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PersonalOrganizationsPage() {
  // Safe redirect: Organization classes and memberships are now integrated directly into /personal/groups
  redirect('/personal/groups');
}
