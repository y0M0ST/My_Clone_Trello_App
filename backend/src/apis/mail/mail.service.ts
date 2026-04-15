import { Resend } from 'resend';

/**
 * Cấu hình Resend (https://resend.com):
 * - RESEND_API_KEY: API key dạng re_...
 * - MAIL_FROM: địa chỉ gửi, phải là domain đã verify hoặc onboarding@resend.dev khi test
 */
export function assertResendMailConfigured(): void {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!key) {
    throw new Error(
      'Chưa cấu hình RESEND_API_KEY trên server (bắt buộc để gửi email).'
    );
  }
  if (!from) {
    throw new Error(
      'Chưa cấu hình MAIL_FROM (ví dụ: TaskFlow <onboarding@resend.dev> hoặc TaskFlow <noreply@domain-da-verify.com>).'
    );
  }
}

/** @deprecated Giữ tên cũ để import ít đổi; logic đã chuyển sang Resend. */
export const assertSmtpConfigured = assertResendMailConfigured;

function getMailFrom(): string {
  const from = process.env.MAIL_FROM?.trim();
  if (!from) {
    throw new Error('MAIL_FROM chưa được cấu hình.');
  }
  return from;
}

/** Rút gọn lỗi gửi mail (Resend / mạng) để trả về API (không lộ secret). */
export function formatMailSendError(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const e = err as {
    code?: string;
    message?: string;
    statusCode?: number;
    name?: string;
  };
  const msg = String(e.message || '');
  const lower = msg.toLowerCase();

  if (
    lower.includes('api key') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    e.statusCode === 401 ||
    e.statusCode === 403
  ) {
    return 'Resend từ chối — kiểm tra RESEND_API_KEY và MAIL_FROM (domain phải verify trên Resend, trừ onboarding@resend.dev khi test).';
  }
  if (e.statusCode === 422 || lower.includes('validation') || lower.includes('invalid')) {
    return 'Resend báo dữ liệu không hợp lệ (email người nhận hoặc định dạng MAIL_FROM).';
  }
  if (e.statusCode === 429 || lower.includes('rate limit')) {
    return 'Vượt giới hạn gửi mail Resend — thử lại sau.';
  }
  if (
    lower.includes('invalid login') ||
    lower.includes('535') ||
    lower.includes('authentication failed')
  ) {
    return 'Đăng nhập SMTP thất bại — kiểm tra SMTP_USER và SMTP_PASS (Gmail: dùng App Password, không dùng mật khẩu tài khoản thường).';
  }
  if (lower.includes('self signed') || lower.includes('certificate')) {
    return 'Lỗi chứng chỉ TLS khi kết nối SMTP.';
  }
  if (
    e.code === 'ETIMEDOUT' ||
    e.code === 'ECONNECTION' ||
    e.code === 'ECONNREFUSED' ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  ) {
    return 'Không gọi được API Resend (mạng/DNS/firewall). Kiểm tra outbound HTTPS tới api.resend.com.';
  }
  if (lower.includes('greeting') || lower.includes('timeout')) {
    return 'Gửi mail không phản hồi kịp (timeout).';
  }
  const trimmed = msg.replace(/\s+/g, ' ').trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

interface BoardInvitationEmailOptions {
  to: string;
  boardTitle: string;
  inviterName: string;
  roleName: string;
  link?: string;
  declineLink?: string;
}

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY?.trim() || '');
  }

  /** Gửi HTML tùy ý (workspace invite, v.v.). */
  async sendHtmlMail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    assertResendMailConfigured();
    const { data, error } = await this.resend.emails.send({
      from: getMailFrom(),
      to: [params.to],
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      const err = new Error(error.message);
      Object.assign(err, { name: error.name, statusCode: (error as { statusCode?: number }).statusCode });
      throw err;
    }
    if (!data) {
      throw new Error('Resend không trả về dữ liệu sau khi gửi.');
    }
  }

  async sendVerificationEmail(email: string, otp: string) {
    await this.sendHtmlMail({
      to: email,
      subject: 'Xác thực tài khoản của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Xin chào!</h2>
          <p>Cảm ơn bạn đã đăng ký. Đây là mã xác thực của bạn:</p>
          <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
          <p>Mã này sẽ hết hạn sau 5 phút.</p>
          <p>Vui lòng không chia sẻ mã này cho ai khác.</p>
        </div>
      `,
    });
  }

  async sendForgotPasswordEmail(email: string, code: string) {
    await this.sendHtmlMail({
      to: email,
      subject: 'Reset your password',
      html: `
            <h3>Password Reset Request</h3>
            <p>Use the following code to reset your password. It is valid for 15 minutes:</p>
            <h2 style="color: #333;">${code}</h2>
            <p>If you did not request this, please ignore this email.</p>
          `,
    });
  }

  async sendBoardInvitationEmail(options: BoardInvitationEmailOptions) {
    const { to, boardTitle, inviterName, roleName, link, declineLink } = options;
    const acceptLink =
      link || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/boards`;

    const formatRoleName = (role: string) => {
      switch (role) {
        case 'board_admin':
          return 'Board Admin';
        case 'board_member':
          return 'Board Member';
        case 'board_observer':
          return 'Observer';
        default:
          return role
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    };

    const friendlyRole = formatRoleName(roleName);

    await this.sendHtmlMail({
      to,
      subject: `You were added to board "${boardTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3>Hello!</h3>
          <p>${inviterName} has invited you to join the board "<b>${boardTitle}</b>" as <b>${friendlyRole}</b>.</p>
          <p>Please accept or decline this invitation:</p>
          <div style="margin: 20px 0;">
            <a href="${acceptLink}" style="background-color: #0079bf; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accept Invitation</a>
            ${declineLink ? `<a href="${declineLink}" style="background-color: #eb5a46; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Decline</a>` : ''}
          </div>
          <p>If the button doesn't work, you can copy the link below:</p>
          <p><small>${acceptLink}</small></p>
        </div>
      `,
    });
  }
}
