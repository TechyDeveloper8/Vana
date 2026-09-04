import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/services', label: 'Services' },
    { to: '/about', label: 'About' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <header
        className="navbar-offwhite"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: '64px',
          background: 'rgba(250, 249, 246, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
        }}
      >
        <style>{`
          .navbar-desktop-nav,
          .navbar-desktop-auth {
            display: flex;
            align-items: center;
          }
          .navbar-desktop-nav {
            gap: 32px;
          }
          .navbar-desktop-auth {
            gap: 16px;
          }
          .navbar-mobile-toggle {
            display: none;
          }
          @media (max-width: 768px) {
            .navbar-desktop-nav,
            .navbar-desktop-auth {
              display: none !important;
            }
            .navbar-mobile-toggle {
              display: flex !important;
            }
          }
        `}</style>

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          data-testid="nav-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none'
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              background: '#FF4500',
              display: 'inline-block',
              transition: 'transform 0.3s ease'
            }}
          />
          <span
            className="font-display"
            style={{
              fontFamily: "'Cabinet Grotesk', -apple-system, sans-serif",
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#0A0A0A'
            }}
          >
            Vana
          </span>
          <span
            className="font-mono-x"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: '#666666',
              textTransform: 'uppercase',
              marginTop: '3px'
            }}
          >
            ENTERTAINMENT
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="navbar-desktop-nav">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontSize: '14px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#FF4500' : '#2D3139',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = '#FF4500';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = '#2D3139';
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {user && user.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#FF4500',
                textDecoration: 'none'
              }}
            >
              Admin Control
            </Link>
          )}

          {user && (
            <Link
              to="/dashboard"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: location.pathname === '/dashboard' ? '#FF4500' : '#2D3139',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== '/dashboard') e.currentTarget.style.color = '#FF4500';
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== '/dashboard') e.currentTarget.style.color = '#2D3139';
              }}
            >
              <Ticket size={14} color="#FF4500" /> My Tickets
            </Link>
          )}
        </nav>

        {/* Right Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Desktop-only Auth Buttons */}
          <div className="navbar-desktop-auth">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className="font-mono-x"
                  style={{
                    fontSize: '12px',
                    color: '#666666',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {user.name ? user.name.split(' ')[0] : 'User'}
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(0, 0, 0, 0.18)',
                    color: '#1A1A1A',
                    padding: '7px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '0px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FF4500';
                    e.currentTarget.style.color = '#FF4500';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.18)';
                    e.currentTarget.style.color = '#1A1A1A';
                  }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link
                  to="/login"
                  style={{
                    fontSize: '14px',
                    color: '#2D3139',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4500')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#2D3139')}
                >
                  Log In
                </Link>
                <Link
                  to="/events"
                  data-testid="nav-book-cta"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#FF4500',
                    color: '#FFFFFF',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    borderRadius: '0px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E03D00')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#FF4500')}
                >
                  <Ticket size={14} strokeWidth={2.5} /> Book Tickets
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle (Always visible on mobile) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0A0A0A',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}
            className="navbar-mobile-toggle"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X size={26} color="#FF4500" /> : <Menu size={26} color="#0A0A0A" />}
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Backdrop & Full-Height Drawer (Mounted directly at top-level) */}
    {mobileOpen && (
      <div
        id="mobile-navigation-drawer"
        style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 'calc(100vh - 64px)',
          background: '#050505',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <span
              className="font-mono-x"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#FF4500',
                fontWeight: 700
              }}
            >
              Explore Vana
            </span>
            <span
              className="font-mono-x"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#737373'
              }}
            >
              Navigation
            </span>
          </div>

          {navLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '48px',
                  padding: '12px 16px',
                  fontSize: '17px',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  color: active ? '#FF4500' : '#FFFFFF',
                  textDecoration: 'none',
                  background: active ? 'rgba(255, 69, 0, 0.12)' : 'transparent',
                  borderLeft: active ? '3px solid #FF4500' : '3px solid transparent',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{l.label}</span>
                <span style={{ fontSize: '13px', color: active ? '#FF4500' : '#525252' }}>→</span>
              </Link>
            );
          })}

          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '48px',
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: 700,
                color: location.pathname === '/dashboard' ? '#FF4500' : '#FFFFFF',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                background: location.pathname === '/dashboard' ? 'rgba(255, 69, 0, 0.12)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Ticket size={18} color="#FF4500" />
                <span>My Booked Passes</span>
              </div>
              <span style={{ fontSize: '13px', color: '#525252' }}>→</span>
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '48px',
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: 700,
                color: '#FF4500',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <span>Admin Dashboard</span>
              <span style={{ fontSize: '13px', color: '#FF4500' }}>→</span>
            </Link>
          )}
        </div>

        {/* Bottom Actions inside Mobile Drawer */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="font-mono-x" style={{ fontSize: '13px', color: '#A1A1A1', fontFamily: "'JetBrains Mono', monospace" }}>
                  Signed in as <strong style={{ color: '#FFFFFF' }}>{user.name || 'User'}</strong>
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(255, 69, 0, 0.15)', color: '#FF4500', padding: '2px 8px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {user.role || 'Member'}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                  navigate('/');
                }}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#A1A1A1',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/events"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  minHeight: '48px',
                  background: '#FF4500',
                  color: '#050505',
                  fontSize: '15px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  textDecoration: 'none'
                }}
              >
                <Ticket size={18} strokeWidth={2.5} /> Book Tickets
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: '48px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  textDecoration: 'none'
                }}
              >
                Sign In to Account
              </Link>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  );
}
