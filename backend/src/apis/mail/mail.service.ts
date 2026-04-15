import nodemailer from 'nodemailer';

/** Gọi trước khi gửi mail — production hay quên env nên lỗi khó đoán */
export function assertSmtpConfigured(): void {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) {
    throw new Error(
      'Chưa cấu hình SMTP_USER / SMTP_PASS trên server (bắt buộc để gửi email mời, OTP, v.v.).'
    );
  }
}

/** Rút gọn lỗi Nodemailer để trả về API (không lộ secret) */
export function formatMailSendError(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const e = err as { code?: string; message?: string; responseCode?: number };
  const msg = String(e.message || '');
  const lower = msg.toLowerCase();

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
    e.code === 'ECONNREFUSED'
  ) {
    return 'Không kết nối được máy chủ SMTP (port 587 có thể bị hosting chặn outbound — thử SendGrid/Mailgun API hoặc mở firewall).';
  }
  if (lower.includes('greeting') || lower.includes('timeout')) {
    return 'SMTP không phản hồi kịp (timeout).';
  }
  const trimmed = msg.replace(/\s+/g, ' ').trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

interface BoardInvitationEmailOptions {
  to: string;
  boardTitle: string;
  inviterName: string;
  roleName: string;
  link?: string; // Fallback or Accept link
  declineLink?: string;
}

// ... existing code ...



export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      /** Tránh treo request API khi SMTP/mạng không phản hồi */
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 25_000,
    });
  }

  async sendVerificationEmail(email: string, otp: string) {
    assertSmtpConfigured();
    await this.transporter.sendMail({
      from: `"TaskFlow" <${process.env.SMTP_USER}>`,
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
    assertSmtpConfigured();
    try {
      const info = await this.transporter.sendMail({
        from: `"TaskFlow" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your password',
        html: `
            <h3>Password Reset Request</h3>
            <p>Use the following code to reset your password. It is valid for 15 minutes:</p>
            <h2 style="color: #333;">${code}</h2>
            <p>If you did not request this, please ignore this email.</p>
          `,
      });
    } catch (error) {
      throw error;
    }
  }

  async sendBoardInvitationEmail(options: BoardInvitationEmailOptions) {
    assertSmtpConfigured();
    const { to, boardTitle, inviterName, roleName, link, declineLink } = options;
    const acceptLink = link || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/boards`;

    const formatRoleName = (role: string) => {
      switch (role) {
        case 'board_admin': return 'Board Admin';
        case 'board_member': return 'Board Member';
        case 'board_observer': return 'Observer';
        default: return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    };

    const friendlyRole = formatRoleName(roleName);

    await this.transporter.sendMail({
      from: `"TaskFlow" <${process.env.SMTP_USER}>`,
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
