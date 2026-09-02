import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isLoginHidden } = useAuth();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <header>
      <div className="container">
        <Link to="/" className="logo-brand">
          <img
            src="/images/logo2.png"
            alt="Vana Entertainments"
            className="navbar-logo-img"
          />
        </Link>





        <nav>
          <ul className={mobileOpen ? 'show' : ''}>
            <li><Link to="/about" className={isActive('/about')} onClick={() => setMobileOpen(false)}>About</Link></li>
            <li><Link to="/services" className={isActive('/services')} onClick={() => setMobileOpen(false)}>Services</Link></li>
            <li><Link to="/events" className={isActive('/events')} onClick={() => setMobileOpen(false)}>Events</Link></li>
            <li><Link to="/gallery" className={isActive('/gallery')} onClick={() => setMobileOpen(false)}>Gallery</Link></li>
            <li><Link to="/contact" className={isActive('/contact')} onClick={() => setMobileOpen(false)}>Contact</Link></li>


            {user?.role === 'admin' && (
              <li>
                <Link to="/admin/dashboard" style={{ color: '#B8860B', fontWeight: 700 }} onClick={() => setMobileOpen(false)}>
                  <i className="fa-solid fa-crown"></i> Admin Dashboard
                </Link>
              </li>
            )}

            {user ? (
              <>
                <li>
                  <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setMobileOpen(false)} style={{ color: '#B8860B', fontWeight: 600 }}>
                    <i className="fa-solid fa-gauge-high" style={{ marginRight: '6px' }}></i> My Dashboard
                  </Link>
                </li>
                <li>
                  <button onClick={() => { setMobileOpen(false); logout(); }} className="btn-outline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                    Logout ({user.name ? user.name.split(' ')[0] : 'User'})
                  </button>
                </li>
              </>
            ) : !isLoginHidden ? (
              <>
                <li>
                  <Link to="/login" className={isActive('/login')} onClick={() => setMobileOpen(false)} style={{ fontWeight: 600 }}>
                    <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i> Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="primary-btn" style={{ padding: '10px 24px', fontSize: '0.88rem' }} onClick={() => setMobileOpen(false)}>
                    <i className="fa-solid fa-ticket"></i> Book Ticket
                  </Link>
                </li>
              </>
            ) : null}
          </ul>
        </nav>

        <div className="menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation menu">
          <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
        </div>
      </div>
    </header>
  );
}
