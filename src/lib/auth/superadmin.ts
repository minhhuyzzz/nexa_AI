const DEFAULT_SUPERADMIN_EMAILS = 'admin.nexa@gmail.com';

/** Danh sách email superadmin, cấu hình qua biến môi trường. */
export function getSuperadminEmails(): string[] {
  const raw =
    process.env.SUPERADMIN_EMAILS ||
    process.env.SUPERADMIN_ACCOUNTS ||
    DEFAULT_SUPERADMIN_EMAILS;

  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Quyền ADMIN chỉ dựa trên email, không dựa trên biệt danh. */
export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperadminEmails().includes(email.trim().toLowerCase());
}
