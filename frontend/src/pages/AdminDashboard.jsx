import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const { user, isLoginHidden, toggleHideLogin } = useAuth();

  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyChart: { labels: [], data: [] },
    weeklyBookingsChart: { labels: [], data: [] }
  });

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchAPI('/admin/stats')
      .then((res) => {
        if (res.stats) setStats(res.stats);
      })
      .catch(() => {});

    fetchAPI('/booking/all')
      .then((res) => {
        if (res.data) setBookings(res.data);
      })
      .catch(() => {});
  }, []);

  const totalCheckedIn = bookings.filter((b) => b.isCheckedIn).length;
  const totalNotAvailable = bookings.filter((b) => !b.isCheckedIn).length;

  const revenueData = {
    labels: stats.monthlyChart?.labels?.length ? stats.monthlyChart.labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: stats.monthlyChart?.data?.length ? stats.monthlyChart.data : [0, 0, 0, 0, 0, 0],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const bookingData = {
    labels: stats.weeklyBookingsChart?.labels?.length ? stats.weeklyBookingsChart.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Weekly Ticket Sales',
        data: stats.weeklyBookingsChart?.data?.length ? stats.weeklyBookingsChart.data : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#D4AF37'
      }
    ]
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-heading)', margin: 0 }}>Welcome, {user?.name || 'Admin'}</h2>
            <p style={{ color: 'var(--text-body)', margin: '4px 0 0' }}>Vana Entertainments Management Portal</p>
          </div>
          <Link to="/admin/events" className="primary-btn">
            + Create New Event
          </Link>
        </div>

        {/* Quick System Control: Hide / Show Public Login Option */}
        <div
          style={{
            background: isLoginHidden ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${isLoginHidden ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: isLoginHidden ? '#F87171' : '#4ADE80', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={`fa-solid ${isLoginHidden ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              Public Header Login Link: {isLoginHidden ? 'HIDDEN' : 'VISIBLE'}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              {isLoginHidden
                ? 'The Login link in the website header is currently hidden from public visitors.'
                : 'The Login & Book Ticket links are active and visible in the header.'}
            </p>
          </div>
          <button
            onClick={() => toggleHideLogin(!isLoginHidden)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: isLoginHidden ? '#e11d48' : '#16a34a',
              color: '#ffffff',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isLoginHidden ? 'Unhide Login Option' : 'Hide Login Option'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <h4>TOTAL REVENUE</h4>
            <div className="number" style={{ color: 'var(--gold-accent)' }}>₹{(stats.totalRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h4>TOTAL BOOKINGS</h4>
            <div className="number">{stats.totalBookings || 0}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <h4>PRESENT (CHECKED IN)</h4>
            <div className="number" style={{ color: '#10b981' }}>{totalCheckedIn}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <h4>NOT AVAILABLE (ABSENT)</h4>
            <div className="number" style={{ color: '#ef4444' }}>{totalNotAvailable}</div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="admin-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          <div style={{ background: '#141824', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-hover)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-heading)' }}>Revenue Overview</h3>
            <Line data={revenueData} />
          </div>
          <div style={{ background: '#141824', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-hover)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-heading)' }}>Ticket Bookings Trend</h3>
            <Bar data={bookingData} />
          </div>
        </div>

        {/* Recent Bookings & Gate Attendance Table */}
        <div style={{ background: '#141824', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-hover)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-heading)' }}>Recent Ticket Bookings & Gate Attendance</h3>
            <Link to="/admin/bookings" style={{ color: 'var(--gold-accent)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
              View Full Attendance Audit →
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--gold-accent)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px' }}>BOOKING ID</th>
                  <th style={{ padding: '12px' }}>CUSTOMER</th>
                  <th style={{ padding: '12px' }}>EVENT</th>
                  <th style={{ padding: '12px' }}>QTY</th>
                  <th style={{ padding: '12px' }}>AMOUNT</th>
                  <th style={{ padding: '12px' }}>ATTENDANCE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No ticket bookings registered in the system yet.
                    </td>
                  </tr>
                ) : (
                  bookings.slice(0, 10).map((b) => (
                    <tr key={b._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#F8FAFC' }}>{b.bookingId}</td>
                      <td style={{ padding: '12px', color: '#F8FAFC' }}>{b.userName}<br/><span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{b.userEmail}</span></td>
                      <td style={{ padding: '12px', color: '#CBD5E1' }}>{b.eventTitle}</td>
                      <td style={{ padding: '12px', color: '#CBD5E1' }}>{b.quantity}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--gold-accent)' }}>₹{b.totalAmount}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            background: b.isCheckedIn ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: b.isCheckedIn ? '#4ADE80' : '#F87171',
                            border: `1px solid ${b.isCheckedIn ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          {b.isCheckedIn ? '✓ Present' : '❌ Not Available'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
