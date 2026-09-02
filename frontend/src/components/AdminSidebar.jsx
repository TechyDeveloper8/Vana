import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  const closeSidebar = () => setMobileSidebarOpen(false);

  return (
    <>
      {/* Sticky Mobile Admin Header Bar */}
      <div className="admin-mobile-header">
        <div className="brand">
          <i className="fa-solid fa-crown" style={{ color: '#D4AF37', marginRight: '8px' }}></i>
          VANA ADMIN
        </div>
        <button
          className="admin-mobile-toggle"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle Admin Navigation"
        >
          <i className={`fa-solid ${mobileSidebarOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
          Menu
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`admin-sidebar-overlay ${mobileSidebarOpen ? 'mobile-open' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Admin Sidebar Navigation */}
      <div className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            <i className="fa-solid fa-crown" style={{ color: '#D4AF37', marginRight: '8px' }}></i>
            VANA ADMIN
          </span>
          <button
            onClick={closeSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: mobileSidebarOpen ? 'block' : 'none'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="sidebar-menu">
          <Link to="/admin/dashboard" className={isActive('/admin/dashboard')} onClick={closeSidebar}>
            <i className="fa-solid fa-chart-line"></i> Dashboard
          </Link>
          <Link to="/admin/events" className={isActive('/admin/events')} onClick={closeSidebar}>
            <i className="fa-solid fa-calendar-days"></i> Manage Events
          </Link>
          <Link to="/admin/seating" className={isActive('/admin/seating')} onClick={closeSidebar}>
            <i className="fa-solid fa-building-columns"></i> Venue & Inventory
          </Link>
          <Link to="/admin/bookings" className={isActive('/admin/bookings')} onClick={closeSidebar}>
            <i className="fa-solid fa-ticket"></i> Manage Bookings
          </Link>
          <Link to="/admin/gallery" className={isActive('/admin/gallery')} onClick={closeSidebar}>
            <i className="fa-solid fa-images"></i> Manage Gallery
          </Link>
          <Link to="/admin/staff" className={isActive('/admin/staff')} onClick={closeSidebar}>
            <i className="fa-solid fa-users-gear"></i> Gate Staff
          </Link>
          <Link to="/" target="_blank" onClick={closeSidebar}>
            <i className="fa-solid fa-globe"></i> View Website
          </Link>
          <button
            onClick={() => {
              closeSidebar();
              logout();
              navigate('/admin/login');
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </div>
    </>
  );
}
