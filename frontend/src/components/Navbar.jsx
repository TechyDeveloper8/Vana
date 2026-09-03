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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/services', label: 'Services' },
    { to: '/about', label: 'About' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className="glass"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '64px',
        background: 'rgba(5, 5, 5, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
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
              color: '#FFFFFF'
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
              color: '#737373',
              textTransform: 'uppercase',
              marginTop: '3px'
            }}
          >
            ENTERTAINMENT
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontSize: '14px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#FF4500' : '#A1A1A1',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = '#A1A1A1';
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
                color: location.pathname === '/dashboard' ? '#FF4500' : '#A1A1A1',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Ticket size={14} color="#FF4500" /> My Tickets
            </Link>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                className="font-mono-x"
                style={{
                  fontSize: '12px',
                  color: '#737373',
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
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  padding: '7px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF4500';
                  e.currentTarget.style.color = '#FF4500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#FFFFFF';
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
                  color: '#A1A1A1',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#A1A1A1')}
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
                  color: '#050505',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  borderRadius: '0px',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Ticket size={14} strokeWidth={2.5} /> Book Tickets
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px',
              display: 'none'
            }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            background: '#050505',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                fontSize: '16px',
                color: location.pathname === l.to ? '#FF4500' : '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              {l.label}
            </Link>
          ))}
          {user && user.role === 'admin' && (
            <Link to="/admin/dashboard" style={{ color: '#FF4500', textDecoration: 'none', fontWeight: 600 }}>
              Admin Dashboard
            </Link>
          )}
          {user ? (
            <>
              <Link to="/dashboard" style={{ color: '#FF4500', textDecoration: 'none', fontWeight: 600 }}>
                My Tickets
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#A1A1A1',
                  textAlign: 'left',
                  fontSize: '15px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#FFFFFF', textDecoration: 'none' }}>
                Log In
              </Link>
              <Link to="/events" style={{ color: '#FF4500', textDecoration: 'none', fontWeight: 700 }}>
                Book Tickets
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
