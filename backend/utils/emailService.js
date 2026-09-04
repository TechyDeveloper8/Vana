const cleanStr = (val) => (val && typeof val === 'string' ? val.trim() : '');

/**
 * Sends email via Brevo REST API (HTTPS Port 443 - Never blocked on cloud servers)
 * Documentation: https://developers.brevo.com/reference/sendtransacemail
 */
const sendViaBrevo = async (mailOptions) => {
  const apiKey = cleanStr(process.env.BREVO_API_KEY);
  if (!apiKey) return null;

  if (apiKey.startsWith('xsmtpsib-')) {
    console.warn('[EMAIL SERVICE WARN] BREVO_API_KEY starts with "xsmtpsib-". This is a Brevo SMTP key rather than a REST API key. For Brevo HTTPS API, generate an API key from the "API Keys" tab at https://app.brevo.com/settings/keys/api (starts with "xkeysib-").');
    return null;
  }

  const senderEmail = cleanStr(
    process.env.BREVO_SENDER_EMAIL ||
    process.env.BREVO_SENDER ||
    'support@vanaentertainments.com'
  );
  const senderName = cleanStr(process.env.BREVO_SENDER_NAME) || 'Vana Entertainments';

  const toAddress = cleanStr(mailOptions.to);
  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toAddress }],
    subject: mailOptions.subject,
    htmlContent: mailOptions.html
  };

  if (mailOptions.attachments && mailOptions.attachments.length > 0) {
    payload.attachment = mailOptions.attachments.map(att => ({
      name: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content
    }));
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Brevo API error (${response.status})`);
  }

  console.log(`[EMAIL SERVICE SUCCESS] Delivered via Brevo HTTPS API to ${toAddress}. MessageId: ${data.messageId}`);
  return { success: true, messageId: data.messageId, provider: 'brevo' };
};

/**
 * Sends email via Resend REST API (HTTPS Port 443 - Backup provider)
 */
const sendViaResend = async (mailOptions) => {
  const apiKey = cleanStr(process.env.RESEND_API_KEY);
  if (!apiKey) return null;

  const fromAddress = cleanStr(process.env.RESEND_FROM) || 'Vana Entertainments <onboarding@resend.dev>';
  const toAddress = Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to];

  const payload = {
    from: fromAddress,
    to: toAddress,
    subject: mailOptions.subject,
    html: mailOptions.html
  };

  if (mailOptions.attachments && mailOptions.attachments.length > 0) {
    payload.attachments = mailOptions.attachments.map(att => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content
    }));
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Resend HTTP API error');
  }

  console.log(`[EMAIL SERVICE SUCCESS] Delivered via Resend HTTPS API to ${mailOptions.to}. ID: ${data.id}`);
  return { success: true, messageId: data.id, provider: 'resend' };
};

/**
 * Universal dispatcher: Prioritizes Brevo HTTPS API (Port 443), then Resend API
 */
const sendMailWithFallback = async (mailOptions) => {
  // 1. Primary: Brevo HTTPS REST API (Port 443 - Never blocked on Render)
  const brevoKey = cleanStr(process.env.BREVO_API_KEY);
  if (brevoKey && !brevoKey.startsWith('xsmtpsib-')) {
    try {
      const res = await sendViaBrevo(mailOptions);
      if (res) return res;
    } catch (err) {
      console.warn('[EMAIL SERVICE] Brevo delivery failed:', err.message);
    }
  }

  // 2. Backup: Resend HTTPS REST API (Port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend(mailOptions);
      if (res) return res;
    } catch (err) {
      console.warn('[EMAIL SERVICE] Resend delivery failed:', err.message);
    }
  }

  return {
    success: false,
    error: 'Email dispatch failed: No active email API service available. Ensure BREVO_API_KEY (starting with xkeysib-) is configured in environment variables.'
  };
};

/**
 * Diagnostic helper to test Brevo and email REST API configuration
 */
exports.testEmailConfiguration = async () => {
  const brevoKey = cleanStr(process.env.BREVO_API_KEY);
  const senderEmail = cleanStr(
    process.env.BREVO_SENDER_EMAIL ||
    process.env.BREVO_SENDER ||
    'support@vanaentertainments.com'
  );
  const senderName = cleanStr(process.env.BREVO_SENDER_NAME) || 'Vana Entertainments';

  let brevoCheck = { tested: false, authenticated: false };

  if (brevoKey) {
    if (brevoKey.startsWith('xsmtpsib-')) {
      brevoCheck = {
        tested: true,
        authenticated: false,
        keyType: 'SMTP_KEY_MISMATCH',
        message: 'The key provided in BREVO_API_KEY starts with "xsmtpsib-", which is an SMTP key rather than a REST API key. For Render HTTPS dispatch, get an API key starting with "xkeysib-" from https://app.brevo.com/settings/keys/api.'
      };
    } else {
      try {
        const res = await fetch('https://api.brevo.com/v3/account', {
          headers: { 'api-key': brevoKey, 'Accept': 'application/json' }
        });
        const data = await res.json().catch(() => ({}));
        brevoCheck = {
          tested: true,
          status: res.status,
          authenticated: res.status === 200,
          accountEmail: data.email || null,
          planType: data.plan?.map(p => p.type).join(', ') || null,
          relayEnabled: data.relay ? data.relay.enabled : null,
          relayUser: data.relay?.data?.userName || null,
          message: data.message || (res.status === 200 ? 'Authenticated with Brevo successfully' : res.statusText)
        };
      } catch (err) {
        brevoCheck = { tested: true, authenticated: false, error: err.message };
      }
    }
  }

  const isConfigured = Boolean(brevoKey && !brevoKey.startsWith('xsmtpsib-'));

  return {
    provider: isConfigured ? 'brevo' : (process.env.RESEND_API_KEY ? 'resend' : 'none'),
    brevoConfigured: isConfigured,
    brevoKeyPrefix: brevoKey ? brevoKey.substring(0, 10) + '...' : null,
    senderEmail,
    senderName,
    brevoAccountCheck: brevoCheck,
    recommendation: isConfigured
      ? (brevoCheck.authenticated
          ? 'Brevo HTTPS API is verified and ready for live email dispatch.'
          : (brevoCheck.message && brevoCheck.message.includes('authorised_ips')
              ? 'Brevo detected an unauthorized IP. Go to https://app.brevo.com/security/authorised_ips and disable the IP restriction so your server can make API calls.'
              : 'BREVO_API_KEY is configured but Brevo returned an authentication error. Please verify your API key at https://app.brevo.com/settings/keys/api'))
      : 'To activate email dispatch, configure your Brevo API Key (xkeysib-...) in BREVO_API_KEY.'
  };
};

/**
 * Sends an official entry pass ticket email to the user's email address.
 */
exports.sendTicketEmail = async (booking) => {
  try {
    const userEmail = booking.userEmail;
    if (!userEmail) {
      return { success: false, error: 'Recipient email missing' };
    }

    const attachments = [];
    let qrImageSrc = booking.qrCodeUrl || '';

    if (booking.qrCodeUrl && booking.qrCodeUrl.startsWith('data:image')) {
      const base64Data = booking.qrCodeUrl.split(';base64,').pop();
      attachments.push({
        filename: `ticket-${booking.bookingId}-qr.png`,
        content: Buffer.from(base64Data, 'base64')
      });
    }

    const formattedShowtime = booking.showtimeDate && booking.showtimeDate !== 'Default'
      ? (isNaN(new Date(booking.showtimeDate)) ? booking.showtimeDate : new Date(booking.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      : 'Main Show Event';

    const seatsHtml = (booking.selectedSeats && booking.selectedSeats.length > 0)
      ? `
        <div style="margin: 15px 0 10px 0; background: #FFFFFF; padding: 14px; border-radius: 12px; border: 1px solid #E7DDD1;">
          <div style="font-size: 12px; font-weight: bold; color: #5F5F5F; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
            ❖ Assigned Seats (${booking.selectedSeats.length} Reserved):
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #FAF7F2; text-align: left; color: #5F5F5F; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 6px 8px; border-bottom: 1px solid #E7DDD1;">Seat</th>
                <th style="padding: 6px 8px; border-bottom: 1px solid #E7DDD1;">Row</th>
                <th style="padding: 6px 8px; border-bottom: 1px solid #E7DDD1;">Tier / Section</th>
                <th style="padding: 6px 8px; border-bottom: 1px solid #E7DDD1; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${booking.selectedSeats.map(s => `
                <tr style="border-bottom: 1px dashed #E7DDD1;">
                  <td style="padding: 6px 8px; font-weight: bold; color: #1F1F1F;">${s.displayLabel || s.seatId}</td>
                  <td style="padding: 6px 8px; color: #4B5563;">${s.row || s.displayLabel?.split('-')[0] || 'N/A'}</td>
                  <td style="padding: 6px 8px; color: #4B5563;">${s.category || 'General'}${s.section ? ` • ${s.section}` : ''}</td>
                  <td style="padding: 6px 8px; text-align: right; color: #B8860B; font-weight: bold;">₹${s.price || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
      : '';

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
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; border-bottom: 1px solid rgba(231, 221, 209, 0.6); padding-bottom: 6px; }
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
            Your event ticket reservation has been successfully completed! Below are your official seat allocation, entrance pass, and receipt details. Present the QR code at the venue gate for instant admission.
          </div>
          
          <div class="ticket-card">
            <div class="ticket-header">❖ ENTRY PASS TICKET CONFIRMATION ❖</div>
            
            <div class="info-row">
              <span class="info-label">Booking Reference:</span>
              <span class="info-value">${booking.bookingId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Event:</span>
              <span class="info-value">${booking.eventTitle}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Performance Showtime:</span>
              <span class="info-value" style="color: #2563EB;">${formattedShowtime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Attendee Name:</span>
              <span class="info-value">${booking.userName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mobile / Phone:</span>
              <span class="info-value">${booking.userPhone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Quantity:</span>
              <span class="info-value">${booking.quantity} Reserved Seat(s)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pass Category:</span>
              <span class="info-value">${booking.ticketCategory || 'Standard Pass'}</span>
            </div>

            ${seatsHtml}

            <div class="info-row">
              <span class="info-label">Total Amount Paid:</span>
              <span class="info-value" style="color: #FF4500; font-size: 16px; font-weight: bold;">₹${booking.totalAmount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Gateway:</span>
              <span class="info-value">${booking.paymentGateway || 'Cashfree Payments'} (${booking.paymentMethod || 'Paid'})</span>
            </div>
            ${booking.cashfreeOrderId ? `
            <div class="info-row">
              <span class="info-label">Cashfree Order ID:</span>
              <span class="info-value" style="font-family: monospace;">${booking.cashfreeOrderId}</span>
            </div>
            ` : ''}
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Payment Status:</span>
              <span class="badge">✓ ${booking.paymentStatus || 'Paid (Verified)'}</span>
            </div>

            ${qrImageSrc ? `
            <div class="qr-section">
              <img src="${qrImageSrc}" alt="Entry QR Code" />
              <div class="qr-hint">Present QR code at Venue Gate Scanner for Admission</div>
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

    return await sendMailWithFallback({
      to: userEmail,
      subject: `Your Event Ticket Pass: ${booking.eventTitle} (${booking.bookingId})`,
      html: htmlContent,
      attachments
    });
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send ticket email for Booking ${booking.bookingId}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a 6-digit Verification OTP email for Account Sign-up or Password Reset.
 */
exports.sendOTPEmail = async (email, otp, purpose = 'register') => {
  try {
    if (!email) {
      return { success: false, error: 'Recipient email missing' };
    }

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

    return await sendMailWithFallback({
      to: email,
      subject: subjectTitle,
      html: htmlContent
    });
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};
