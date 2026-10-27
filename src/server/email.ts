import nodemailer from 'nodemailer';

interface OrderEmailData {
  orderId: string;
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  bankReference: string;
  paidAt: string;
  expiresAt?: string;
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

export async function sendOrderPaidEmails(data: OrderEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[EmailService] GMAIL_USER / GMAIL_APP_PASSWORD not configured. Skipping email dispatch.');
    return;
  }

  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(data.amount);

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #FFFBF7; border: 1px solid #E8B7C8; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #453C45; margin: 0; font-size: 24px;">THIỆP ONLINE</h1>
        <p style="color: #C76A82; font-size: 14px; margin-top: 4px;">Gửi lời yêu thương — Lưu giữ khoảnh khắc</p>
      </div>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f0e6ed;">
        <h2 style="color: #2e7d32; font-size: 18px; margin-top: 0;">🎉 Thanh Toán Thành Công!</h2>
        <p style="color: #453C45; font-size: 14px; line-height: 1.6;">
          Xin chào <strong>${data.userName}</strong>,<br/>
          Cảm ơn bạn đã lựa chọn THIEPONL làm người bạn đồng hành cho ngày trọng đại. Gói dịch vụ của bạn đã được kích hoạt thành công!
        </p>

        <div style="margin: 20px 0; padding: 16px; background-color: #FAF6F8; border-radius: 8px;">
          <table style="width: 100%; font-size: 14px; color: #453C45; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #827580;">Mã đơn hàng:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">${data.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #827580;">Gói dịch vụ:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #C76A82;">${data.planName.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #827580;">Số tiền thanh toán:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #2e7d32;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #827580;">Mã tham chiếu:</td>
              <td style="padding: 6px 0; font-mono; text-align: right;">${data.bankReference}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #827580;">Thời gian:</td>
              <td style="padding: 6px 0; text-align: right;">${data.paidAt}</td>
            </tr>
          </table>
        </div>

        <p style="color: #453C45; font-size: 14px; line-height: 1.6;">
          Bây giờ bạn có thể truy cập <strong>Bảng Điều Khiển</strong> để khám phá toàn bộ mẫu thiệp cao cấp và tính năng AI Wedding Designer.
        </p>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.APP_URL || 'https://thieponl.vn'}/dashboard" style="display: inline-block; background-color: #C76A82; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
            Vào Bảng Điều Khiển Ngay
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #827580;">
        <p>Nếu cần hỗ trợ, vui lòng phản hồi email này hoặc liên hệ hotline: 0988.xxx.xxx</p>
        <p>© ${new Date().getFullYear()} THIEPONL. Nền tảng thiệp cưới điện tử thông minh.</p>
      </div>
    </div>
  `;

  // Send receipt to Customer
  try {
    await transporter.sendMail({
      from: `"THIEPONL Thiệp Cưới" <${process.env.GMAIL_USER}>`,
      to: data.userEmail,
      subject: `[THIEPONL] Biên nhận thanh toán gói ${data.planName.toUpperCase()} — Đơn hàng #${data.orderId}`,
      html: customerHtml,
    });
    console.log(`[EmailService] Receipt sent to customer ${data.userEmail}`);
  } catch (err: any) {
    console.error(`[EmailService] Failed to send customer receipt:`, err.message || err);
  }

  // Send alert to Admins
  const configuredAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>🔔 Thông Báo Đơn Hàng Mới Thành Công</h2>
      <p>Hệ thống vừa ghi nhận một giao dịch nâng cấp gói thành công qua SePay TPBank.</p>
      <ul>
        <li><strong>Khách hàng:</strong> ${data.userName} (${data.userEmail})</li>
        <li><strong>Mã đơn hàng:</strong> ${data.orderId}</li>
        <li><strong>Gói:</strong> ${data.planName}</li>
        <li><strong>Số tiền:</strong> ${formattedAmount}</li>
        <li><strong>Mã giao dịch/nội dung:</strong> ${data.bankReference}</li>
        <li><strong>Thời gian:</strong> ${data.paidAt}</li>
      </ul>
      <p><a href="${process.env.APP_URL || ''}/admin">Truy cập Trang Quản Trị Admin</a></p>
    </div>
  `;

  for (const adminEmail of configuredAdmins) {
    try {
      await transporter.sendMail({
        from: `"THIEPONL Bot" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `[Admin Alert] Đơn hàng #${data.orderId} đã thanh toán (${formattedAmount})`,
        html: adminHtml,
      });
      console.log(`[EmailService] Alert sent to admin ${adminEmail}`);
    } catch (err: any) {
      console.error(`[EmailService] Failed to send admin alert to ${adminEmail}:`, err.message || err);
    }
  }
}
