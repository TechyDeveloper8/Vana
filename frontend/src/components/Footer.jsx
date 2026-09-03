import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube, ArrowUpRight } from 'lucide-react';

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2
              className="heading stroke-text"
              style={{
                fontSize: 'clamp(4rem, 15vw, 12rem)',
                lineHeight: 0.85,
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
                width: '64px',
                height: '64px',
                background: '#FF4500',
                color: '#050505',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease'
              }}
            >
              <ArrowUpRight size={32} strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        {/* Columns Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '48px',
            marginBottom: '48px'
          }}
        >
          {/* Brand & Mission */}
          <div style={{ gridColumn: 'span 2' }}>
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
            <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: 1.7, maxWidth: '420px', marginBottom: '24px' }}>
              We design, produce and deliver unforgettable live spectacles — from high-voltage music festivals and arena concerts to flagship corporate summits.
            </p>
            <div
              className="font-mono-x"
              style={{
                fontSize: '11px',
                color: '#737373',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              Presence: Mumbai · Bengaluru · Delhi · Bhagalpur
            </div>
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

          {/* Legal Policies */}
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
              Policies & Legal
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <Link to="/terms-and-conditions" style={{ color: '#A1A1A1', textDecoration: 'none', fontSize: '14px' }}>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" style={{ color: '#EF4444', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                  100% Non-Refundable Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" style={{ color: '#A1A1A1', textDecoration: 'none', fontSize: '14px' }}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
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
              Connect
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <a
                href="#"
                aria-label="Instagram"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF4500';
                  e.currentTarget.style.color = '#FF4500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF4500';
                  e.currentTarget.style.color = '#FF4500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF4500';
                  e.currentTarget.style.color = '#FF4500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
              >
                <Youtube size={18} />
              </a>
            </div>
            <p className="font-mono-x" style={{ fontSize: '12px', color: '#737373', fontFamily: "'JetBrains Mono', monospace" }}>
              hello@vana.live
            </p>
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
          <span>MUMBAI — BENGALURU — DELHI — BHAGALPUR</span>
        </div>
      </div>
    </footer>
  );
}
