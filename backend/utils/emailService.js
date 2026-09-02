const nodemailer = require('nodemailer');

/**
 * Sends an official entry pass ticket email to the user's Gmail address.
 * @param {Object} booking - Booking object containing bookingId, userName, userEmail, eventTitle, quantity, totalAmount, qrCodeUrl, etc.
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
exports.sendTicketEmail = async (booking) => {
  try {
    const userEmail = booking.userEmail;
    if (!userEmail) {
      console.warn('[EMAIL SERVICE WARNING] No recipient email specified for booking:', booking.bookingId);
      return { success: false, error: 'Recipient email missing' };
    }

    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (!emailUser || !emailPass) {
      console.warn(`[EMAIL SERVICE] Gmail credentials not configured in backend/.env (EMAIL_USER / EMAIL_PASS). Skipping live email dispatch for Booking ${booking.bookingId} to ${userEmail}.`);
      return { success: false, error: 'Gmail credentials not configured in .env' };
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const attachments = [];
    let qrImageSrc = '';

    if (booking.qrCodeUrl && booking.qrCodeUrl.startsWith('data:image')) {
      const base64Data = booking.qrCodeUrl.split(';base64,').pop();
      attachments.push({
        filename: `ticket-${booking.bookingId}-qr.png`,
        content: Buffer.from(base64Data, 'base64'),
        cid: 'ticketqrcode'
      });
      qrImageSrc = 'cid:ticketqrcode';
    } else if (booking.qrCodeUrl) {
      qrImageSrc = booking.qrCodeUrl;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Official Event Ticket Pass - VANA ENTERTAINMENTS</title>
      <style>
        body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #F8EFE8; margin: 0; padding: 20px; color: #1F1F1F; }
        .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E7DDD1; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1F1F1F 0%, #111827 100%); color: #FFFFFF; padding: 30px 20px; text-align: center; border-bottom: 3px solid #B8860B; }
        .header h1 { font-family: Georgia, serif; margin: 0; font-size: 26px; letter-spacing: 1px; color: #D4AF37; }
        .header p { margin: 6px 0 0 0; font-size: 11px; letter-spacing: 3px; color: #E7DDD1; text-transform: uppercase; }
        .body-content { padding: 30px 25px; }
        .greeting { font-size: 18px; font-weight: bold; color: #1F1F1F; margin-bottom: 12px; }
        .intro { color: #5F5F5F; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .ticket-card { background: #F6EFE5; border: 1px dashed #B8860B; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
        .ticket-header { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #B8860B; letter-spacing: 1px; margin-bottom: 15px; text-align: center; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid rgba(231, 221, 209, 0.6); padding-bottom: 6px; }
        .info-label { color: #5F5F5F; font-weight: 500; }
        .info-value { color: #1F1F1F; font-weight: bold; }
        .qr-section { text-align: center; margin: 25px 0 10px 0; background: #FFFFFF; padding: 20px; border-radius: 14px; border: 1px solid #E7DDD1; }
        .qr-section img { width: 160px; height: 160px; border: 3px solid #B8860B; border-radius: 12px; padding: 6px; background: #FFFFFF; }
        .qr-hint { font-size: 12px; color: #8E8E8E; margin-top: 10px; }
        .footer { background: #F8EFE8; text-align: center; padding: 20px; font-size: 12px; color: #8E8E8E; border-top: 1px solid #E7DDD1; }
        .badge { display: inline-block; background: #DCFCE7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VANA ENTERTAINMENTS</h1>
          <p>OFFICIAL EVENT PASS & CONFIRMATION</p>
        </div>
        <div class="body-content">
          <div class="greeting">Hello ${booking.userName || 'Valued Guest'},</div>
          <div class="intro">
            Your event ticket reservation has been successfully completed! Below is your official digital entrance pass. Present the QR code on your mobile device at the venue gate for swift check-in.
          </div>
          
          <div class="ticket-card">
            <div class="ticket-header">❖ ENTRY PASS TICKET CONFIRMATION ❖</div>
            
            <div class="info-row">
              <span class="info-label">Booking ID:</span>
              <span class="info-value">${booking.bookingId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Event:</span>
              <span class="info-value">${booking.eventTitle}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pass Category:</span>
              <span class="info-value">${booking.ticketCategory || 'Standard Pass'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Quantity:</span>
              <span class="info-value">${booking.quantity} Pass(es)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Amount Paid:</span>
              <span class="info-value" style="color: #B8860B;">₹${booking.totalAmount}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Payment Status:</span>
              <span class="badge">${booking.paymentStatus || 'Paid'}</span>
            </div>

            ${qrImageSrc ? `
            <div class="qr-section">
              <img src="${qrImageSrc}" alt="Entry QR Code" />
              <div class="qr-hint">Scan at Venue Gate Scanner for Admission</div>
            </div>
            ` : ''}
          </div>

          <div style="font-size: 13px; color: #5F5F5F; line-height: 1.5;">
            <strong>Important Notes:</strong>
            <ul>
              <li>Keep this email handy or access your pass anytime on your Vana account dashboard.</li>
              <li>Each QR pass is valid for ${booking.quantity} entry scanner validation(s).</li>
              <li>For inquiries or assistance, please contact support@vanaentertainments.com</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Vana Entertainments. All rights reserved.<br/>
          Luxury Events, Weddings, Live Shows & Concerts
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"Vana Entertainments Pass Desk" <${emailUser}>`,
      to: userEmail,
      subject: `Your Event Ticket Pass: ${booking.eventTitle} (${booking.bookingId})`,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE SUCCESS] Ticket email sent to ${userEmail} for Booking ${booking.bookingId}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send ticket email for Booking ${booking.bookingId}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a 6-digit Verification OTP email for Account Sign-up or Password Reset.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - 'register' or 'forgot_password'
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
exports.sendOTPEmail = async (email, otp, purpose = 'register') => {
  try {
    if (!email) {
      return { success: false, error: 'Recipient email missing' };
    }

    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (!emailUser || !emailPass) {
      console.warn(`[EMAIL SERVICE] Gmail credentials missing in .env for OTP dispatch to ${email}.`);
      return { success: false, error: 'Gmail credentials not configured in .env' };
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const isSignUp = purpose === 'register';
    const subjectTitle = isSignUp ? 'Verification Code for Vana Account Registration' : 'Password Reset Verification Code - Vana';
    const headingText = isSignUp ? 'ACCOUNT VERIFICATION' : 'PASSWORD RESET REQUEST';
    const bodyText = isSignUp
      ? 'Thank you for choosing Vana Entertainments. Please use the 6-digit verification code below to complete your account registration:'
      : 'We received a request to reset your password for your Vana Entertainments account. Use the 6-digit verification code below:';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subjectTitle}</title>
      <style>
        body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #F8EFE8; margin: 0; padding: 20px; color: #1F1F1F; }
        .container { max-width: 550px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E7DDD1; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1F1F1F 0%, #111827 100%); color: #FFFFFF; padding: 30px 20px; text-align: center; border-bottom: 3px solid #B8860B; }
        .header h1 { font-family: Georgia, serif; margin: 0; font-size: 24px; letter-spacing: 1px; color: #D4AF37; }
        .header p { margin: 6px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #E7DDD1; text-transform: uppercase; }
        .body-content { padding: 30px 25px; text-align: center; }
        .intro { color: #5F5F5F; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: left; }
        .otp-box { background: #F6EFE5; border: 2px dashed #B8860B; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center; }
        .otp-code { font-family: monospace, monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #B8860B; margin: 10px 0; display: inline-block; }
        .otp-expiry { font-size: 12px; color: #8E8E8E; margin-top: 6px; }
        .footer { background: #F8EFE8; text-align: center; padding: 20px; font-size: 12px; color: #8E8E8E; border-top: 1px solid #E7DDD1; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VANA ENTERTAINMENTS</h1>
          <p>${headingText}</p>
        </div>
        <div class="body-content">
          <div class="intro">
            Hello,<br/><br/>
            ${bodyText}
          </div>
          
          <div class="otp-box">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #5F5F5F; font-weight: bold;">Your Verification OTP</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">⏱️ Valid for 10 minutes. Do not share this code with anyone.</div>
          </div>

          <div style="font-size: 12px; color: #8E8E8E; line-height: 1.5; text-align: left;">
            If you did not request this OTP code, please ignore this email or contact support if you suspect unauthorized activity.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Vana Entertainments. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"Vana Entertainments Security" <${emailUser}>`,
      to: email,
      subject: subjectTitle,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE SUCCESS] OTP email sent to ${email} (${purpose}). MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

