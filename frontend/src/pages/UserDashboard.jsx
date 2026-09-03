import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dashboardTab, setDashboardTab] = useState('passes'); // 'passes', 'enquiries'
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'checkedin'
  const [selectedPass, setSelectedPass] = useState(null);

  const loadUserData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingRes, enquiryRes] = await Promise.allSettled([
        fetchAPI('/booking/my-bookings'),
        fetchAPI('/contact/my-enquiries')
      ]);

      if (bookingRes.status === 'fulfilled' && bookingRes.value.success) {
        setBookings(bookingRes.value.data || []);
      } else {
        setBookings([]);
      }

      if (enquiryRes.status === 'fulfilled' && enquiryRes.value.success) {
        setEnquiries(enquiryRes.value.data || []);
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      console.error('Fetch User Dashboard Data Error:', err);
      setError(err.message || 'Unable to fetch user dashboard details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Filter bookings based on tab
  const filteredBookings = bookings.filter((item) => {
    if (activeTab === 'pending') return !item.isCheckedIn;
    if (activeTab === 'checkedin') return item.isCheckedIn;
    return true;
  });

  const totalPasses = bookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
  const pendingCount = bookings.filter((b) => !b.isCheckedIn).length;
  const checkedInCount = bookings.filter((b) => b.isCheckedIn).length;

  const handlePrintPass = (booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups to print ticket');

    const formattedShow = booking.showtimeDate && booking.showtimeDate !== 'Default'
      ? (isNaN(new Date(booking.showtimeDate)) ? booking.showtimeDate : new Date(booking.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      : 'Main Performance Show';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VANA Pass - ${booking.bookingId}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #FAF7F2; color: #1F1F1F; }
            .ticket-card { max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 20px; border: 2px solid #B8860B; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .brand { font-size: 26px; font-weight: 800; color: #B8860B; letter-spacing: 2px; }
            .sub { font-size: 11px; letter-spacing: 4px; color: #555; text-transform: uppercase; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: 700; margin: 12px 0 5px 0; color: #111; }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin: 8px 0; }
            .checked-in { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
            .pending { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
            .qr-img { width: 190px; height: 190px; border-radius: 12px; margin: 16px 0; border: 2px solid #B8860B; padding: 6px; }
            .details { text-align: left; background: #F8EFE8; padding: 18px; border-radius: 14px; font-size: 13.5px; margin-top: 14px; }
            .details p { margin: 6px 0; }
            .seats-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
            .seats-table th { background: #E7DDD1; padding: 6px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4B5563; }
            .seats-table td { padding: 6px 8px; border-bottom: 1px dashed #E7DDD1; }
            .footer-info { margin-top: 16px; font-size: 11px; color: #888; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <div class="brand">VANA ENTERTAINMENTS</div>
            <div class="sub">Official Event Entrance Pass</div>
            <div class="title">${booking.eventTitle}</div>
            <div>
              <span class="badge ${booking.isCheckedIn ? 'checked-in' : 'pending'}">
                ${booking.isCheckedIn ? '✓ ENTRY DONE / CHECKED IN' : '✓ VALID ENTRY PASS - CONFIRMED & PAID'}
              </span>
            </div>
            ${booking.qrCodeUrl ? `<img src="${booking.qrCodeUrl}" class="qr-img" />` : ''}
            <div class="details">
              <p><strong>Booking Ref:</strong> ${booking.bookingId}</p>
              <p><strong>Performance Showtime:</strong> <span style="color: #2563EB; font-weight: bold;">${formattedShow}</span></p>
              <p><strong>Attendee Name:</strong> ${booking.userName}</p>
              <p><strong>Email / Mobile:</strong> ${booking.userEmail} / ${booking.userPhone || 'N/A'}</p>
              <p><strong>Pass Quantity:</strong> ${booking.quantity} Reserved Seat(s)</p>
              
              ${booking.selectedSeats && booking.selectedSeats.length > 0 ? `
                <div style="margin-top: 10px; font-weight: bold; color: #B8860B; font-size: 12px; text-transform: uppercase;">Allocated Seat Numbers:</div>
                <table class="seats-table">
                  <thead>
                    <tr>
                      <th>Seat No.</th>
                      <th>Row</th>
                      <th>Section / Tier</th>
                      <th style="text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${booking.selectedSeats.map(s => `
                      <tr>
                        <td><strong>Seat ${s.displayLabel || s.seatId}</strong></td>
                        <td>${s.row || s.displayLabel?.split('-')[0] || 'N/A'}</td>
                        <td>${s.category || 'General'}${s.section ? ` • ${s.section}` : ''}</td>
                        <td style="text-align: right; color: #B8860B; font-weight: bold;">₹${s.price || 0}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `<p><strong>Reserved Seats:</strong> ${booking.selectedSeats?.map(s => s.displayLabel || s.seatId).join(', ') || 'General'}</p>`}

              <div style="border-top: 1px dashed #D6C7B7; margin-top: 10px; padding-top: 8px;">
                <p style="display: flex; justify-content: space-between; margin: 4px 0;"><span>Subtotal:</span> <span>₹${booking.subtotal || booking.totalAmount}</span></p>
                <p style="display: flex; justify-content: space-between; margin: 4px 0;"><span>GST (18%):</span> <span>₹${booking.gst || 0}</span></p>
                <p style="display: flex; justify-content: space-between; margin: 6px 0; font-size: 15px; font-weight: bold; color: #B8860B;"><span>Total Paid:</span> <span>₹${booking.totalAmount}</span></p>
              </div>
              <p style="margin-top: 8px; font-size: 12px; color: #4B5563;"><strong>Payment Gateway:</strong> ${booking.paymentGateway || 'Cashfree Payments'} (${booking.paymentMethod || 'Paid'})</p>
              ${booking.cashfreeOrderId ? `<p style="font-size: 12px; color: #64748B;"><strong>Cashfree Order ID:</strong> <code>${booking.cashfreeOrderId}</code></p>` : ''}
              ${booking.isCheckedIn && booking.checkInTime ? `<p style="color: #166534;"><strong>Gate Checked-In At:</strong> ${new Date(booking.checkInTime).toLocaleString()} ${booking.checkInGate ? `(${booking.checkInGate})` : ''}</p>` : ''}
            </div>
            <div class="footer-info">Verified via Cashfree Payment Gateway • Present this QR pass at venue gate scanner for admission.</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ padding: '60px 0', background: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        {/* User Greeting Banner */}
        <div
          className="white-card"
          style={{
            padding: '36px',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #0B0E17 0%, #141824 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span
                style={{
                  background: 'var(--gold-gradient)',
                  color: '#0A0D14',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Vana Account Dashboard
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--gold-accent)' }}>
                <i className="fa-solid fa-user-check" style={{ marginRight: '6px' }}></i>
                Signed In
              </span>
            </div>
            <h2 style={{ fontSize: '2rem', margin: '6px 0', color: '#F8FAFC', fontWeight: 700 }}>
              Welcome Back, {user?.name || 'User'}!
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', margin: 0 }}>
              <i className="fa-regular fa-envelope" style={{ marginRight: '8px', color: 'var(--gold-accent)' }}></i>
              {user?.email}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={loadUserData}
              className="btn-outline"
              style={{ color: 'var(--gold-accent)', borderColor: 'rgba(212, 175, 55, 0.4)', padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '8px' }}></i>
              Refresh Dashboard
            </button>
            <Link to="/events" className="primary-btn" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-ticket" style={{ marginRight: '8px' }}></i>
              Book New Event
            </Link>
          </div>
        </div>

        {/* Top Navigation Tabs (Bookings vs Location Enquiries) */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', borderBottom: '2px solid rgba(212, 175, 55, 0.25)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setDashboardTab('passes')}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              border: dashboardTab === 'passes' ? '1px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.25)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: dashboardTab === 'passes' ? 'var(--gold-gradient)' : '#141824',
              color: dashboardTab === 'passes' ? '#0A0D14' : '#CBD5E1',
              boxShadow: dashboardTab === 'passes' ? '0 8px 25px rgba(212, 175, 55, 0.35)' : 'none'
            }}
          >
            <i className="fa-solid fa-qrcode" style={{ color: dashboardTab === 'passes' ? '#0A0D14' : 'var(--gold-accent)' }}></i>
            My Booked Passes ({bookings.length})
          </button>

          <button
            onClick={() => setDashboardTab('enquiries')}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              border: dashboardTab === 'enquiries' ? '1px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.25)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: dashboardTab === 'enquiries' ? 'var(--gold-gradient)' : '#141824',
              color: dashboardTab === 'enquiries' ? '#0A0D14' : '#CBD5E1',
              boxShadow: dashboardTab === 'enquiries' ? '0 8px 25px rgba(212, 175, 55, 0.35)' : 'none'
            }}
          >
            <i className="fa-solid fa-location-dot" style={{ color: dashboardTab === 'enquiries' ? '#0A0D14' : 'var(--gold-accent)' }}></i>
            My Event Location Enquiries ({enquiries.length})
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-body)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--gold-accent)', marginBottom: '12px' }}></i>
            <p>Loading your account details...</p>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: '20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              color: '#F87171',
              textAlign: 'center',
              marginBottom: '24px',
              fontWeight: 600
            }}
          >
            {error}
          </div>
        )}

        {/* SECTION 1: BOOKED PASSES TAB */}
        {!loading && dashboardTab === 'passes' && (
          <>
            {/* Stats Section */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}
            >
              <div className="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid var(--gold-primary)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Total Bookings
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#F8FAFC', margin: '8px 0 0 0' }}>{bookings.length}</h3>
              </div>

              <div className="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid #F59E0B' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Valid Passes (Pending Entry)
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#F59E0B', margin: '8px 0 0 0' }}>{pendingCount}</h3>
              </div>

              <div className="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid #10B981' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Verified Entries (Done)
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#10B981', margin: '8px 0 0 0' }}>{checkedInCount}</h3>
              </div>

              <div className="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid #3B82F6' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Total Passes Owned
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#3B82F6', margin: '8px 0 0 0' }}>{totalPasses}</h3>
              </div>
            </div>

            {/* Filter Sub-Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-heading)' }}>My Event QR Passes</h3>

              <div style={{ display: 'flex', gap: '10px', background: '#0B0E17', padding: '6px', borderRadius: '14px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: activeTab === 'all' ? 'var(--gold-gradient)' : 'transparent',
                    color: activeTab === 'all' ? '#0A0D14' : '#CBD5E1'
                  }}
                >
                  All ({bookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: activeTab === 'pending' ? '#D97706' : 'transparent',
                    color: activeTab === 'pending' ? '#FFF' : '#CBD5E1'
                  }}
                >
                  Entry Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('checkedin')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: activeTab === 'checkedin' ? '#16A34A' : 'transparent',
                    color: activeTab === 'checkedin' ? '#FFF' : '#CBD5E1'
                  }}
                >
                  Entry Done ({checkedInCount})
                </button>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div class="white-card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '20px' }}>
                <i class="fa-solid fa-ticket-simple" style={{ fontSize: '3.5rem', color: '#CBD5E1', marginBottom: '16px' }}></i>
                <h4 style={{ fontSize: '1.4rem', color: '#334155', marginBottom: '8px' }}>
                  {activeTab === 'all' ? 'No Booked Passes Found' : 'No Passes Match This Filter'}
                </h4>
                <p style={{ color: '#64748B', maxWidth: '450px', margin: '0 auto 24px auto', fontSize: '0.95rem' }}>
                  {activeTab === 'all'
                    ? "You haven't booked any event passes yet. Browse our live events and secure your tickets online."
                    : 'Select another filter tab to view your other pass reservations.'}
                </p>
                {activeTab === 'all' && (
                  <Link to="/events" class="primary-btn">
                    Browse Events & Book Pass
                  </Link>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px'
                }}
              >
                {filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="white-card"
                    style={{
                      borderRadius: '20px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      border: booking.isCheckedIn ? '2px solid rgba(34, 197, 94, 0.6)' : '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-hover)',
                      position: 'relative'
                    }}
                  >
                    {/* Header Verification Badge */}
                    <div
                      style={{
                        background: booking.isCheckedIn ? 'rgba(34, 197, 94, 0.12)' : 'rgba(212, 175, 55, 0.12)',
                        borderBottom: booking.isCheckedIn ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.25)',
                        padding: '12px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: booking.isCheckedIn ? '#4ADE80' : 'var(--gold-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className={`fa-solid ${booking.isCheckedIn ? 'fa-circle-check' : 'fa-clock'}`}></i>
                        {booking.isCheckedIn ? 'ENTRY DONE (CHECKED IN)' : 'VALID PASS - ENTRY PENDING'}
                      </span>

                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                        {booking.bookingId}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-heading)', fontWeight: 700 }}>
                        {booking.eventTitle}
                      </h4>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '16px' }}>
                        <i className="fa-regular fa-calendar" style={{ marginRight: '6px', color: 'var(--gold-accent)' }}></i>
                        Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      {/* QR Code Presentation Box */}
                      <div
                        style={{
                          background: '#0B0E17',
                          borderRadius: '16px',
                          padding: '16px',
                          textAlign: 'center',
                          marginBottom: '20px',
                          border: '1px dashed rgba(212, 175, 55, 0.35)'
                        }}
                      >
                        {booking.qrCodeUrl ? (
                          <img
                            src={booking.qrCodeUrl}
                            alt="Event QR Ticket Pass"
                            style={{
                              width: '150px',
                              height: '150px',
                              borderRadius: '12px',
                              border: '2px solid var(--gold-primary)',
                              padding: '6px',
                              background: '#FFF',
                              margin: '0 auto 10px auto',
                              display: 'block'
                            }}
                          />
                        ) : (
                          <div style={{ padding: '20px', color: '#64748B' }}>QR Code Unavailable</div>
                        )}
                        <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
                          Scan QR at event venue gate for instant entry
                        </p>
                      </div>

                      {/* Booking Metadata list */}
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94A3B8' }}>Attendee Name:</span>
                          <strong style={{ color: '#F8FAFC' }}>{booking.userName}</strong>
                        </div>
                        {booking.userPhone && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ color: '#94A3B8' }}>Mobile:</span>
                            <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{booking.userPhone}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94A3B8' }}>Showtime:</span>
                          <strong style={{ color: '#60A5FA', fontSize: '0.84rem' }}>
                            {booking.showtimeDate && booking.showtimeDate !== 'Default'
                              ? (isNaN(new Date(booking.showtimeDate)) ? booking.showtimeDate : new Date(booking.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
                              : 'Main Performance Show'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94A3B8' }}>Pass Quantity:</span>
                          <strong style={{ color: '#F8FAFC' }}>{booking.quantity} Reserved Pass(es)</strong>
                        </div>

                        {/* Visual Seat Badges */}
                        {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                          <div style={{ background: '#0B0E17', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.25)', margin: '4px 0' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                              <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i>
                              Reserved Seats ({booking.selectedSeats.length}):
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {booking.selectedSeats.map((s) => (
                                <span
                                  key={s.seatId || s.displayLabel}
                                  style={{
                                    background: '#141824',
                                    border: '1px solid var(--gold-primary)',
                                    borderRadius: '6px',
                                    padding: '3px 8px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    color: '#F8FAFC',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span>Seat {s.displayLabel || s.seatId}</span>
                                  <span style={{ color: 'var(--gold-accent)', background: 'rgba(212, 175, 55, 0.15)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.68rem' }}>
                                    {s.category || 'General'}
                                  </span>
                                  {s.section && (
                                    <span style={{ color: '#94A3B8', fontSize: '0.68rem' }}>
                                      {s.section}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94A3B8' }}>Total Paid:</span>
                          <strong style={{ color: 'var(--gold-accent)', fontSize: '1rem' }}>₹{booking.totalAmount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#94A3B8' }}>Payment Gateway:</span>
                          <span style={{ color: '#4ADE80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-circle-check" style={{ fontSize: '0.75rem' }}></i>
                            {booking.paymentGateway || 'Cashfree'} ({booking.paymentMethod || 'Paid'})
                          </span>
                        </div>
                        {booking.cashfreeOrderId && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                            <span>CF Order ID:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#CBD5E1' }}>{booking.cashfreeOrderId}</span>
                          </div>
                        )}

                        {booking.isCheckedIn && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '10px 12px',
                              background: 'rgba(34, 197, 94, 0.12)',
                              borderRadius: '10px',
                              fontSize: '0.8rem',
                              color: '#4ADE80',
                              border: '1px solid rgba(34, 197, 94, 0.3)'
                            }}
                          >
                            <i className="fa-solid fa-shield-check" style={{ marginRight: '6px' }}></i>
                            Entry Scanned at:{' '}
                            <strong>
                              {booking.checkInTime ? new Date(booking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                            </strong>
                            {booking.checkInGate && ` via Gate: ${booking.checkInGate}`}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => setSelectedPass(booking)}
                          className="primary-btn"
                          style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem', justifyContent: 'center' }}
                        >
                          <i className="fa-solid fa-qrcode" style={{ marginRight: '6px' }}></i>
                          Expand QR Pass
                        </button>
                        <button
                          onClick={() => handlePrintPass(booking)}
                          className="btn-outline"
                          style={{ padding: '10px 14px', fontSize: '0.85rem', color: 'var(--gold-accent)', borderColor: 'rgba(212, 175, 55, 0.4)' }}
                          title="Print / Save Pass PDF"
                        >
                          <i className="fa-solid fa-print"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SECTION 2: LOCATION ENQUIRIES TAB */}
        {!loading && dashboardTab === 'enquiries' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-heading)' }}>My Location & Event Enquiries</h3>
              <Link to="/#enquiry" className="primary-btn" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
                <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>
                Submit New Enquiry
              </Link>
            </div>

            {enquiries.length === 0 ? (
              <div className="white-card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '20px' }}>
                <i className="fa-solid fa-location-dot" style={{ fontSize: '3.5rem', color: '#475569', marginBottom: '16px' }}></i>
                <h4 style={{ fontSize: '1.4rem', color: 'var(--text-heading)', marginBottom: '8px' }}>No Event Enquiries Found</h4>
                <p style={{ color: 'var(--text-light)', maxWidth: '450px', margin: '0 auto 24px auto', fontSize: '0.95rem' }}>
                  You haven't submitted any event location enquiries yet. Submit an enquiry on our home page for custom venue booking & management.
                </p>
                <Link to="/" className="primary-btn">
                  Submit Location Enquiry
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {enquiries.map((enquiry) => (
                  <div
                    key={enquiry._id || enquiry.id}
                    className="white-card"
                    style={{
                      borderRadius: '20px',
                      padding: '24px',
                      border: '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-hover)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span
                          style={{
                            background: 'rgba(212, 175, 55, 0.15)',
                            color: 'var(--gold-accent)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(212, 175, 55, 0.3)'
                          }}
                        >
                          {enquiry.eventType || 'Event Enquiry'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background:
                              enquiry.status === 'Resolved'
                                ? 'rgba(34, 197, 94, 0.12)'
                                : enquiry.status === 'Contacted'
                                ? 'rgba(59, 130, 246, 0.12)'
                                : 'rgba(245, 158, 11, 0.12)',
                            color:
                              enquiry.status === 'Resolved'
                                ? '#4ADE80'
                                : enquiry.status === 'Contacted'
                                ? '#60A5FA'
                                : '#FBBF24',
                            border: `1px solid ${enquiry.status === 'Resolved' ? 'rgba(34, 197, 94, 0.3)' : enquiry.status === 'Contacted' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}
                        >
                          ● {enquiry.status || 'New'}
                        </span>
                      </div>

                      {enquiry.location && (
                        <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-location-dot"></i> {enquiry.location}
                        </p>
                      )}

                      <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '16px', background: '#0B0E17', padding: '14px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                        "{enquiry.message}"
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.15)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94A3B8' }}>
                      <span>Submitted By: {enquiry.name}</span>
                      <span>{new Date(enquiry.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal for Expanded High-Res QR Ticket Pass */}
        {selectedPass && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <div
              className="white-card"
              style={{
                maxWidth: '440px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '24px',
                padding: '24px',
                textAlign: 'center',
                position: 'relative',
                background: '#141824',
                border: '1px solid var(--gold-primary)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              <button
                onClick={() => setSelectedPass(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  background: '#0B0E17',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--gold-accent)'
                }}
              >
                ✕
              </button>

              <div style={{ color: 'var(--gold-accent)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '2px', marginBottom: '2px' }}>
                VANA ENTERTAINMENTS
              </div>
              <p style={{ fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '20px' }}>
                Official Gate Verification QR Pass
              </p>

              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  background: selectedPass.isCheckedIn ? 'rgba(34, 197, 94, 0.12)' : 'rgba(212, 175, 55, 0.12)',
                  color: selectedPass.isCheckedIn ? '#4ADE80' : 'var(--gold-accent)',
                  border: selectedPass.isCheckedIn ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.25)'
                }}
              >
                <i className={`fa-solid ${selectedPass.isCheckedIn ? 'fa-circle-check' : 'fa-clock'}`} style={{ marginRight: '6px' }}></i>
                {selectedPass.isCheckedIn ? 'ENTRY DONE (VERIFIED)' : 'VALID ENTRY PASS - SCAN AT GATE'}
              </div>

              <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#F8FAFC' }}>{selectedPass.eventTitle}</h3>

              {selectedPass.qrCodeUrl && (
                <div style={{ background: '#FFF', padding: '16px', borderRadius: '18px', display: 'inline-block', border: '2px solid var(--gold-primary)', boxShadow: '0 4px 20px rgba(212, 175, 55, 0.2)', marginBottom: '20px' }}>
                  <img src={selectedPass.qrCodeUrl} alt="QR Pass" style={{ width: '220px', height: '220px', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ background: '#0B0E17', padding: '16px', borderRadius: '14px', textAlign: 'left', fontSize: '0.88rem', color: '#CBD5E1', border: '1px solid rgba(212, 175, 55, 0.25)', marginBottom: '20px' }}>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#F8FAFC' }}>Booking Ref:</strong> {selectedPass.bookingId}</p>
                <p style={{ margin: '4px 0' }}>
                  <strong style={{ color: '#F8FAFC' }}>Showtime:</strong>{' '}
                  <span style={{ color: '#60A5FA', fontWeight: 600 }}>
                    {selectedPass.showtimeDate && selectedPass.showtimeDate !== 'Default'
                      ? (isNaN(new Date(selectedPass.showtimeDate)) ? selectedPass.showtimeDate : new Date(selectedPass.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
                      : 'Main Performance Show'}
                  </span>
                </p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#F8FAFC' }}>Attendee Name:</strong> {selectedPass.userName} {selectedPass.userPhone ? `(${selectedPass.userPhone})` : ''}</p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#F8FAFC' }}>Quantity:</strong> {selectedPass.quantity} Reserved Pass(es)</p>

                {/* Reserved Seats List */}
                {selectedPass.selectedSeats && selectedPass.selectedSeats.length > 0 && (
                  <div style={{ margin: '10px 0', padding: '10px', background: '#141824', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Allocated Seats:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedPass.selectedSeats.map((s) => (
                        <span
                          key={s.seatId || s.displayLabel}
                          style={{
                            background: '#0B0E17',
                            border: '1px solid var(--gold-primary)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#F8FAFC'
                          }}
                        >
                          Seat {s.displayLabel || s.seatId}
                          <span style={{ color: 'var(--gold-accent)', fontSize: '0.7rem', fontWeight: 500, marginLeft: '4px' }}>
                            ({s.category || 'Pass'})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed rgba(212, 175, 55, 0.25)', marginTop: '8px', paddingTop: '8px' }}>
                  <p style={{ margin: '3px 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94A3B8' }}>
                    <span>Subtotal:</span>
                    <span>₹{selectedPass.subtotal || selectedPass.totalAmount}</span>
                  </p>
                  <p style={{ margin: '3px 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94A3B8' }}>
                    <span>GST (18%):</span>
                    <span>₹{selectedPass.gst || 0}</span>
                  </p>
                  <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--gold-accent)', fontSize: '0.95rem' }}>
                    <span>Total Amount Paid:</span>
                    <span>₹{selectedPass.totalAmount}</span>
                  </p>
                </div>

                {selectedPass.cashfreeOrderId && (
                  <p style={{ margin: '4px 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                    <strong>Cashfree Order:</strong> <code style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>{selectedPass.cashfreeOrderId}</code>
                  </p>
                )}

                {selectedPass.isCheckedIn && selectedPass.checkInTime && (
                  <p style={{ margin: '6px 0 0 0', color: '#4ADE80', fontWeight: 600, background: 'rgba(34, 197, 94, 0.12)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    ✓ Entry Checked-In: {new Date(selectedPass.checkInTime).toLocaleString()} {selectedPass.checkInGate ? `(Gate: ${selectedPass.checkInGate})` : ''}
                  </p>
                )}
              </div>

              <button
                onClick={() => handlePrintPass(selectedPass)}
                className="primary-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <i className="fa-solid fa-print" style={{ marginRight: '8px' }}></i>
                Print Official Pass PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
