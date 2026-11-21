const DEFAULT_SUPERADMIN_EMAILS = 'admin.nexa@gmail.com';

/** Danh sách email chủ nền tảng (Super Admin / Platform Owner), cấu hình qua biến môi trường. */
export function getSuperadminEmails(): string[] {
  const raw =
    process.env.SUPER_ADMIN ||
    process.env.SUPERADMIN ||
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.SUPERADMIN_EMAIL ||
    process.env.PLATFORM_OWNER ||
    process.env.PLATFORM_OWNER_EMAIL ||
    process.env.SUPERADMIN_EMAILS ||
    process.env.SUPERADMIN_ACCOUNTS ||
    DEFAULT_SUPERADMIN_EMAILS;

  return raw
    .split(',')
    .map((email) =>
      email
        .replace(/^[=\s'"]+/, '')
        .replace(/[=\s'"]+$/, '')
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);
}

/** Kiểm tra xem email có phải là Super Admin (Chủ sở hữu nền tảng) không. */
export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperadminEmails().includes(email.trim().toLowerCase());
}

/** Bí danh tương đương cho isSuperadminEmail nhằm đồng bộ thuật ngữ Platform Owner. */
export const isPlatformOwner = isSuperadminEmail;
