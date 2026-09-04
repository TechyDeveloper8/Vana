import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, ArrowUpRight, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        background: '#050505',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '96px',
        paddingBottom: '40px',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        {/* Giant Interactive "LET'S TALK" CTA */}
        <Link
          to="/contact"
          data-testid="footer-cta"
          style={{
            display: 'block',
            textDecoration: 'none',
            marginBottom: '64px'
          }}
          className="footer-hero-link group"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <h2
              className="heading stroke-text"
              style={{
                fontSize: 'clamp(2.2rem, 11vw, 10rem)',
                lineHeight: 0.9,
                margin: 0,
                transition: 'color 0.4s ease, -webkit-text-stroke 0.4s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF4500';
                e.currentTarget.style.webkitTextStroke = '0px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'transparent';
                e.currentTarget.style.webkitTextStroke = '1px rgba(255,255,255,0.25)';
              }}
            >
              Let&apos;s Talk
            </h2>
            <div
              style={{
                width: 'clamp(44px, 8vw, 64px)',
                height: 'clamp(44px, 8vw, 64px)',
                minWidth: '44px',
                minHeight: '44px',
                background: '#FF4500',
                color: '#050505',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease',
                flexShrink: 0
              }}
            >
              <ArrowUpRight size={26} strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        {/* Columns Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: '36px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '48px',
            marginBottom: '48px'
          }}
        >
          {/* Brand & Mission */}
          <div style={{ minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ width: '10px', height: '10px', background: '#FF4500', display: 'inline-block' }} />
              <span
                className="font-display"
                style={{
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  textTransform: 'uppercase',
                  color: '#FFFFFF'
                }}
              >
                Vana Entertainment
              </span>
            </div>
            <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: 1.7, maxWidth: '420px', margin: 0 }}>
              We design, produce and deliver unforgettable live spectacles — from high-voltage music festivals and arena concerts to flagship corporate summits.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <p
              className="font-mono-x"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#737373',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '18px'
              }}
            >
              Navigation
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <Link to="/events" style={{ color: '#A1A1A1', textDecoration: 'none', fontSize: '14px' }}>
                  Live Events
                </Link>
              </li>
              <li>
                <Link to="/services" style={{ color: '#A1A1A1', textDecoration: 'none', fontSize: '14px' }}>
                  Production Services
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ color: '#A1A1A1', textDecoration: 'none', fontSize: '14px' }}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/gallery" style={{ color: '#A1A1A1', textDecoration: 'none', fontSize: '14px' }}>
                  Gallery & Moments
                </Link>
              </li>
              <li>
                <Link to="/contact" style={{ color: '#A1A1A1', textDecoration: 'none', fontSize: '14px' }}>
                  Contact Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <p
              className="font-mono-x"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#FF4500',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '18px',
                fontWeight: 700
              }}
            >
              Contact Details
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={16} color="#FF4500" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: 1.5 }}>
                  Karmanchak, Bhagalpur, Bihar — 812001
                </span>
              </div>

              {/* Phone & WhatsApp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={16} color="#FF4500" style={{ flexShrink: 0 }} />
                <a
                  href="tel:+917479669858"
                  style={{
                    color: '#FFFFFF',
                    fontSize: '13px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4500')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                >
                  +91-7479669858
                </a>
              </div>

              {/* WhatsApp Chat Link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', fontSize: '16px', flexShrink: 0 }}></i>
                <a
                  href="https://wa.me/917479669858"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#25D366',
                    fontSize: '13px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  WhatsApp: +91-7479669858
                </a>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Mail size={16} color="#FF4500" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a
                    href="mailto:enquiry@vanaentertainments.com"
                    style={{
                      color: '#A1A1A1',
                      fontSize: '13px',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4500')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A1A1A1')}
                  >
                    enquiry@vanaentertainments.com
                  </a>
                  <a
                    href="mailto:hello@vana.live"
                    style={{
                      color: '#737373',
                      fontSize: '12px',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4500')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
                  >
                    hello@vana.live
                  </a>
                </div>
              </div>

              {/* Operating Hours */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={16} color="#737373" style={{ flexShrink: 0 }} />
                <span className="font-mono-x" style={{ color: '#737373', fontSize: '11px' }}>
                  Mon — Sat: 10:00 AM — 07:00 PM IST
                </span>
              </div>
            </div>
          </div>

          {/* Connect & Social */}
          <div>
            <p
              className="font-mono-x"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#737373',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '18px'
              }}
            >
              Connect & Legal
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/vanaentertainments?igsi=ZTVnbWRzaTl1NXl0"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram: @vanaentertainments"
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF4500';
                  e.currentTarget.style.color = '#FF4500';
                  e.currentTarget.style.background = 'rgba(255, 69, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Instagram size={20} />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/917479669858"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                title="Chat on WhatsApp: +91 7479669858"
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#25D366',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#25D366';
                  e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '20px' }}></i>
              </a>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link to="/terms-and-conditions" style={{ color: '#737373', textDecoration: 'none', fontSize: '13px' }}>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" style={{ color: '#737373', textDecoration: 'none', fontSize: '13px' }}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="font-mono-x"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '11px',
            color: '#737373',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          <span>© {new Date().getFullYear()} VANA ENTERTAINMENT. ALL RIGHTS RESERVED.</span>
          <span style={{ color: '#A1A1A1', textAlign: 'center', letterSpacing: '0.05em' }}>
            Managed by <strong style={{ color: '#FFFFFF' }}>Zentra Digital</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
