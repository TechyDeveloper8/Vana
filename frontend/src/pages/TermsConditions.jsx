import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '96px 0 80px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header Badge & Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-accent)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
            Official Booking Agreement
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2.8rem', color: 'var(--text-heading)', marginBottom: '16px' }}>
            Terms & <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Conditions</span>
          </h1>
          <p style={{ color: 'var(--text-body)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
            Please read these terms and ticket policies carefully before booking passes for events hosted by Vana Entertainments.
          </p>
        </div>

        {/* HIGH-VISIBILITY NON-REFUNDABLE NOTICE BANNER */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0B0E17 0%, #141824 100%)',
            border: '2px solid var(--gold-primary)',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '36px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            color: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-accent)', fontSize: '1.3rem', flexShrink: 0 }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 style={{ color: 'var(--gold-accent)', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.3rem', margin: 0 }}>
                STRICT NON-REFUNDABLE TICKET POLICY
              </h3>
              <div style={{ fontSize: '0.75rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#CBD5E1' }}>
                All Bookings & Pass Sales Are Final
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#CBD5E1', margin: 0, lineHeight: 1.6 }}>
            <strong>All ticket pass sales, seating reservations, and VIP bookings made via Vana Entertainments are 100% Non-Refundable and Non-Cancellable.</strong> Once your booking payment is completed, no cash refunds, cancellations, category downgrades, or partial returns will be issued under any circumstances.
          </p>
        </div>

        {/* Policy Content Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '40px 36px', boxShadow: 'var(--shadow-hover)', lineHeight: 1.8, color: 'var(--text-body)' }}>
          
          {/* Section 1: Non Refundable Details */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-ban" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              1. Non-Refundable & Non-Transferable Policy
            </h3>
            <p style={{ marginBottom: '12px' }}>
              By purchasing an event entry pass or reserving seating at Town Hall Bhagalpur or any Vana partner venue, you explicitly agree to the following terms:
            </p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-heading)' }}>No Cash Refunds:</strong> Ticket passes cannot be cancelled, refunded, or exchanged for cash after payment confirmation.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-heading)' }}>Personal Absence / Travel Delays:</strong> Failure to attend the event, arriving late, personal emergencies, traffic conditions, or change of personal schedule will not entitle the pass holder to a refund or replacement.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-heading)' }}>Non-Transferable QR Pass:</strong> Each digital QR pass code is linked to the primary purchaser's account and booking ID. Reselling tickets above face value or unauthorized duplication is strictly prohibited.
              </li>
            </ul>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 2: Gate Scanning & Entry Rules */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-qrcode" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              2. Venue Gate Entry & Scanner Validation
            </h3>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-heading)' }}>Digital Ticket Pass Requirement:</strong> Attendees must present the official digital ticket pass email (sent via Gmail SMTP) or show the pass on their Vana user dashboard on a mobile device.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-heading)' }}>Single-Validation Scanner Check:</strong> Gate entry scanners operated by Vana staff will scan the QR code. Each pass permits entry equal to the booked quantity. Once validated, duplicate attempts will be denied.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-heading)' }}>Government Photo ID:</strong> Gate security staff may request a matching government-issued photo ID (Aadhaar, Passport, Driving License, Voter ID) to verify identity.
              </li>
            </ul>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 3: Event Rescheduling & Force Majeure */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-calendar-xmark" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              3. Event Rescheduling & Postponement
            </h3>
            <p style={{ marginBottom: '12px' }}>
              In the event of event postponement or date changes due to severe weather, security orders, government regulations, or acts of God (Force Majeure):
            </p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '8px' }}>
                All existing confirmed ticket passes will automatically be transferred and remain valid for the newly rescheduled event date.
              </li>
              <li style={{ marginBottom: '8px' }}>
                The organizer will notify pass holders via their registered email address with updated timing and venue guidelines.
              </li>
            </ul>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 4: Security & Right of Admission */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              4. Code of Conduct & Right of Admission
            </h3>
            <p style={{ marginBottom: '12px' }}>
              Vana Entertainments and venue management reserve the absolute right of admission:
            </p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '8px' }}>Security screening and bag inspections may be conducted at venue entry gates.</li>
              <li style={{ marginBottom: '8px' }}>Hazardous objects, weapons, illegal substances, Outside alcohol, and commercial filming equipment are strictly banned inside the auditorium.</li>
              <li style={{ marginBottom: '8px' }}>Any attendee displaying disruptive, unruly, or illegal behavior will be escorted off the venue premises without refund.</li>
            </ul>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', margin: '24px 0' }} />

          {/* Section 5: Contact Desk */}
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-heading)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-headset" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem' }}></i>
              5. Ticketing Support Desk
            </h3>
            <p style={{ marginBottom: '12px' }}>
              For queries regarding ticket pass retrieval or event information, please contact our support desk:
            </p>
            <div style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '12px', padding: '16px 20px', fontSize: '0.92rem', color: '#CBD5E1' }}>
              <div><strong style={{ color: 'var(--gold-accent)' }}>Vana Entertainments Event Ticketing Desk</strong></div>
              <div>Email: enquiry@vanaentertainments.com</div>
              <div>Phone: +91-7479669858</div>
              <div>Office: Karmanchak, Bhagalpur, Bihar - 812001</div>
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
