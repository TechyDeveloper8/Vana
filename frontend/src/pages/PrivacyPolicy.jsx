import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header Badge & Title */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-accent)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
            Legal & Data Protection
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2.8rem', color: 'var(--text-heading)', marginBottom: '16px' }}>
            Privacy <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Policy</span>
          </h1>
          <p style={{ color: 'var(--text-body)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
            Effective Date: January 1, 2026 • Vana Entertainments is committed to maintaining the confidentiality, integrity, and security of your personal data.
          </p>
        </div>

        {/* Policy Content Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '40px 36px', boxShadow: 'var(--shadow-hover)', lineHeight: 1.8, color: 'var(--text-body)' }}>
          
          {/* Section 1 */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-user-shield" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              1. Information We Collect
            </h3>
            <p style={{ marginBottom: '12px' }}>
              When you reserve event passes, create an account, or contact Vana Entertainments, we collect information required to process your transaction and deliver digital credentials:
            </p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-heading)' }}>Personal Identification:</strong> Full Name, Email Address, and Contact Mobile Number.</li>
              <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-heading)' }}>Booking & Pass Credentials:</strong> Event selected, seating tier, total amount paid, unique booking IDs, and generated entry QR codes.</li>
              <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-heading)' }}>Authentication Data:</strong> Encrypted password hashes and 6-digit OTP verification codes.</li>
            </ul>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 2 */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-paper-plane" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              2. How We Use Your Data
            </h3>
            <p style={{ marginBottom: '12px' }}>Your personal information is strictly used for legitimate business and transactional purposes:</p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '8px' }}>To dispatch official event entry tickets and QR passes directly to your Gmail inbox via Nodemailer SMTP.</li>
              <li style={{ marginBottom: '8px' }}>To send 6-digit Security OTP codes for account registration and password resets.</li>
              <li style={{ marginBottom: '8px' }}>To verify ticket authenticity at venue gates using scanner devices operated by authorized Vana gate staff.</li>
              <li style={{ marginBottom: '8px' }}>To provide customer support and notify you of any event schedule modifications or venue guidelines.</li>
            </ul>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 3 */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-lock" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              3. Data Protection & Non-Disclosure
            </h3>
            <p style={{ marginBottom: '12px' }}>
              Vana Entertainments maintains a strict zero-spam policy. <strong style={{ color: 'var(--text-heading)' }}>We do not sell, rent, lease, or trade your personal information or email address to third-party advertisers or marketing agencies.</strong>
            </p>
            <p>
              Your data is accessed only by authorized backend services and gate scanners strictly for event admission and verification.
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 4 */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-cookie-bite" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              4. Cookies & Session Storage
            </h3>
            <p>
              We utilize local web storage (localStorage) strictly to store authenticated JWT session tokens (`vana_token` and `vana_user`) so you remain signed into your dashboard. We do not track your browsing activity outside of our platform.
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 5 */}
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-envelope-open-text" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              5. Contact Us Regarding Privacy
            </h3>
            <p style={{ marginBottom: '12px' }}>
              If you have any questions or concerns regarding our privacy practices or wish to request data removal, please reach out to our privacy desk:
            </p>
            <div style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '12px', padding: '16px 20px', fontSize: '0.92rem', color: '#CBD5E1' }}>
              <div><strong style={{ color: 'var(--gold-accent)' }}>Vana Entertainments Data Privacy Officer</strong></div>
              <div>Email: enquiry@vanaentertainments.com</div>
              <div>Phone: +91-9798988829</div>
              <div>Address: Karmanchak, Bhagalpur, Bihar - 812001</div>
            </div>
          </div>

        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="/" style={{ color: 'var(--gold-accent)', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
            ← Return to Home Page
          </Link>
        </div>

      </div>
    </div>
  );
}
