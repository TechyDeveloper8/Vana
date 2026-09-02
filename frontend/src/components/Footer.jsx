import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#111827', color: '#E5E7EB', paddingTop: '60px', paddingBottom: '30px', borderTop: '2px solid #B8860B' }}>
      <div className="container footer-container">
        {/* Brand Column */}
        <div>
          <Link to="/" className="logo-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div>
              <span className="brand-name" style={{ color: '#D4AF37', fontSize: '1.4rem', letterSpacing: '0.05em', fontFamily: "'Playfair Display', Georgia, serif" }}>VANA</span>
              <span className="brand-tag" style={{ fontSize: '0.62rem', letterSpacing: '0.2em', color: '#E7DDD1' }}>ENTERTAINMENTS</span>
            </div>
          </Link>
          <p style={{ fontSize: '0.9rem', color: '#9CA3AF', marginBottom: '20px', lineHeight: 1.6 }}>
            India’s premier luxury event management firm creating unforgettable corporate summits, live concerts, brand activations, and cultural festivals.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <a href="#" style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a href="#" style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
              <i className="fa-brands fa-linkedin-in"></i>
            </a>
            <a href="#" style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
              <i className="fa-brands fa-youtube"></i>
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', marginBottom: '16px', fontFamily: "'Playfair Display', Georgia, serif" }}>Quick Links</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <li><Link to="/about" style={{ color: '#9CA3AF' }}>About Vana</Link></li>
            <li><Link to="/services" style={{ color: '#9CA3AF' }}>Services Showcase</Link></li>
            <li><Link to="/events" style={{ color: '#9CA3AF' }}>Browse Events</Link></li>
            <li><Link to="/gallery" style={{ color: '#9CA3AF' }}>Visual Portfolio</Link></li>
            <li><Link to="/contact" style={{ color: '#9CA3AF' }}>Book Consultation</Link></li>
          </ul>
        </div>

        {/* Legal & Non-Refundable Policies */}
        <div>
          <h3 style={{ color: '#D4AF37', fontSize: '1.1rem', marginBottom: '16px', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Legal & Policies
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <li>
              <Link to="/terms-and-conditions" style={{ color: '#9CA3AF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-file-contract" style={{ color: '#B8860B' }}></i> Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/terms-and-conditions" style={{ color: '#F87171', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-ban" style={{ color: '#EF4444' }}></i> Non-Refundable Policy
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" style={{ color: '#9CA3AF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#B8860B' }}></i> Privacy Policy
              </Link>
            </li>
          </ul>
          
          <div style={{ marginTop: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', color: '#FCA5A5' }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
            Notice: All event tickets & seating passes are <strong>100% Non-Refundable</strong>.
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', marginBottom: '16px', fontFamily: "'Playfair Display', Georgia, serif" }}>Head Office</h3>
          <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#9CA3AF' }}><i className="fa-solid fa-location-dot" style={{ color: '#D4AF37', marginRight: '8px' }}></i> Karmanchak, Bhagalpur, Bihar - 812001</p>
          <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#9CA3AF' }}><i className="fa-solid fa-envelope" style={{ color: '#D4AF37', marginRight: '8px' }}></i> enquiry@vanaentertainments.com</p>
          <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#9CA3AF' }}><i className="fa-solid fa-phone" style={{ color: '#D4AF37', marginRight: '8px' }}></i> +91-9798988829</p>
        </div>
      </div>

      {/* Copyright Bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '40px', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#6B7280' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            © 2026 Vana Entertainments. All Rights Reserved. Managed By Zentra Digital.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/terms-and-conditions" style={{ color: '#9CA3AF' }}>Terms & Conditions</Link>
            <span style={{ color: '#4B5563' }}>•</span>
            <Link to="/terms-and-conditions" style={{ color: '#F87171' }}>Non-Refundable Policy</Link>
            <span style={{ color: '#4B5563' }}>•</span>
            <Link to="/privacy-policy" style={{ color: '#9CA3AF' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
