/**
 * NEXA Platform - Transactional Email Service
 * Powered by Resend REST API (Zero external dependency overhead)
 */

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  fallback?: boolean;
  error?: string;
}

interface OwnerWelcomeEmailOptions {
  toEmail: string;
  fullName?: string;
  orgName: string;
  orgSlug: string;
  origin?: string;
}

interface OrgInvitationEmailOptions {
  toEmail: string;
  fullName?: string;
  orgName: string;
  orgRole?: string;
  inviteUrl: string;
  expiresAt?: string;
}

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'NEXA Platform <onboarding@resend.dev>';

/**
 * Low-level Resend REST API sender
 */
async function sendViaResend(payload: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-resend-api-key')) {
    console.warn(
      `\n[NEXA EMAIL SERVICE] ⚠️ RESEND_API_KEY chưa được cấu hình.
================================================================================
📧 Gửi tới: ${payload.to.join(', ')}
📌 Tiêu đề: ${payload.subject}
🔗 Resend Key chưa có, bạn có thể copy link từ UI Admin hoặc terminal.
================================================================================\n`
    );
    return {
      success: false,
      fallback: true,
      error: 'RESEND_API_KEY is not configured. Falling back to local/manual link dispatch.',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[NEXA EMAIL SERVICE] Resend API error:', data);
      return {
        success: false,
        fallback: true,
        error: data.message || 'Lỗi gửi email từ máy chủ Resend',
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network error';
    console.error('[NEXA EMAIL SERVICE] Network exception:', errorMsg);
    return {
      success: false,
      fallback: true,
      error: errorMsg,
    };
  }
}

/**
 * 1. Email thông báo cho tài khoản ĐÃ TỒN TẠI được bổ nhiệm làm Chủ sở hữu (ORG_OWNER)
 */
export async function sendOrgOwnerWelcomeEmail(
  opts: OwnerWelcomeEmailOptions
): Promise<SendEmailResult> {
  const { toEmail, fullName, orgName, orgSlug, origin } = opts;
  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const orgDashboardUrl = `${baseUrl}/org/${orgSlug}`;
  const displayName = fullName || toEmail.split('@')[0];

  const subject = `[NEXA] Bạn đã được bổ nhiệm làm Chủ sở hữu tổ chức "${orgName}"`;
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #F1F5F9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #171717;">NEXA <span style="color: #2563EB;">AI</span></span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #2563EB; background-color: #EFF6FF; border-radius: 9999px;">B2B Workspace</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #171717; line-height: 1.4;">
                Chúc mừng bạn đã tiếp nhận tổ chức mới!
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Xin chào <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Tài khoản <strong>${toEmail}</strong> của bạn trên nền tảng NEXA vừa được Quản trị viên cấp quyền <strong>Chủ sở hữu (Owner)</strong> cho tổ chức:
              </p>

              <!-- Info Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 12px; color: #64748B; margin-bottom: 4px;">Tổ chức B2B:</div>
                    <div style="font-size: 16px; font-weight: 700; color: #171717;">${orgName}</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 8px;">Mã định danh (Slug): <code style="font-family: monospace; background: #E2E8F0; padding: 2px 6px; border-radius: 4px;">${orgSlug}</code></div>
                    <div style="font-size: 12px; color: #16A34A; font-weight: 600; margin-top: 8px;">● Trạng thái: Đã kích hoạt toàn quyền Chủ sở hữu</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Bạn có thể truy cập ngay vào không gian làm việc của tổ chức để bắt đầu thiết lập lớp học, quản lý thành viên và phát động các đợt đánh giá năng lực số:
              </p>

              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #2563EB;">
                    <a href="${orgDashboardUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 10px;">
                      Vào Dashboard Tổ Chức &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 0 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
                Nếu nút bấm không hoạt động, vui lòng copy liên kết sau vào trình duyệt:<br>
                <a href="${orgDashboardUrl}" style="color: #2563EB; word-break: break-all;">${orgDashboardUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; font-size: 12px; color: #94A3B8; text-align: center;">
              NEXA AI &mdash; Nền tảng Đánh giá &amp; Phát triển Năng lực Số Toàn diện.<br>
              Email này được gửi tự động khi quản trị viên phân bổ quyền tổ chức.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendViaResend({
    from: DEFAULT_FROM,
    to: [toEmail],
    subject,
    html,
  });
}

/**
 * 2. Email MỜI MỞ TÀI KHOẢN & KÍCH HOẠT QUYỀN (Dành cho tài khoản CHƯA TỒN TẠI)
 */
export async function sendOrgInvitationEmail(
  opts: OrgInvitationEmailOptions
): Promise<SendEmailResult> {
  const { toEmail, fullName, orgName, orgRole = 'ORG_OWNER', inviteUrl, expiresAt } = opts;
  const roleTitle = orgRole === 'ORG_OWNER' ? 'Chủ sở hữu (Owner)' : 'Thành viên quản trị';
  const displayName = fullName || toEmail.split('@')[0];

  const subject = `[NEXA] Lời mời tham gia và kích hoạt tài khoản ${roleTitle} - ${orgName}`;
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #F1F5F9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #171717;">NEXA <span style="color: #2563EB;">AI</span></span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #2563EB; background-color: #EFF6FF; border-radius: 9999px;">Lời mời B2B</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #171717; line-height: 1.4;">
                Lời mời kích hoạt tài khoản &amp; tiếp nhận tổ chức
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Xin chào <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Bạn nhận được lời mời đảm nhận vai trò <strong>${roleTitle}</strong> cho tổ chức <strong>${orgName}</strong> trên nền tảng NEXA AI.
              </p>

              <!-- Invitation Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 12px; color: #1E40AF; margin-bottom: 4px;">Tổ chức đại diện:</div>
                    <div style="font-size: 16px; font-weight: 700; color: #1E3A8A;">${orgName}</div>
                    <div style="font-size: 12px; color: #1E40AF; margin-top: 6px;">Vai trò: <strong>${roleTitle}</strong></div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 6px;">Thời hạn lời mời: 7 ngày kể từ ngày gửi</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Vui lòng bấm vào nút bên dưới để thiết lập mật khẩu, mở tài khoản và vào thẳng không gian quản trị tổ chức của bạn:
              </p>

              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #2563EB;">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 10px;">
                      Mở &amp; Kích Hoạt Tài Khoản Ngay &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 0 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
                Nếu không bấm được nút trên, hãy dán đường dẫn này vào trình duyệt của bạn:<br>
                <a href="${inviteUrl}" style="color: #2563EB; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; font-size: 12px; color: #94A3B8; text-align: center;">
              NEXA AI &mdash; Nền tảng Đánh giá &amp; Phát triển Năng lực Số Toàn diện.<br>
              Nếu bạn không liên quan đến lời mời này, vui lòng bỏ qua email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendViaResend({
    from: DEFAULT_FROM,
    to: [toEmail],
    subject,
    html,
  });
}
