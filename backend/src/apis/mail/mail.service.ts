import nodemailer from 'nodemailer';
interface BoardInvitationEmailOptions {
  to: string;
  boardTitle: string;
  inviterName: string;
  roleName: string;
  link?: string;
}

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
    });
  }

  async sendVerificationEmail(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"TrelloClone" <${process.env.SMTP_USER}>`,
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
    console.log(`[MAIL SENT] OTP sent to ${email}`);
  }

  async sendForgotPasswordEmail(email: string, code: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"TrelloClone" <${process.env.SMTP_USER}>`,
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
    const { to, boardTitle, inviterName, roleName, link } = options;
    const boardLink = link || `${process.env.FRONTEND_URL || process.env.BACKEND_URL}/boards`;

    await this.transporter.sendMail({
      from: `"TrelloClone" <${process.env.SMTP_USER}>`,
      to,
      subject: `You were added to board "${boardTitle}"`,
      html: `
        <h3>Hello!</h3>
        <p>${inviterName} has added you to the board "<b>${boardTitle}</b>" as <b>${roleName}</b>.</p>
        <p>Click <a href="${boardLink}">here</a> to access the board.</p>
      `,
    });
  }
}
