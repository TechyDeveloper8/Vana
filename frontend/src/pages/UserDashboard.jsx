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
    <div style={{ padding: '96px 0 80px 0', background: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        {/* User Greeting Banner */}
        <div
          className="grain"
          style={{
            padding: '36px',
            marginBottom: '32px',
            background: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            borderRadius: '0px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span
                className="font-mono-x"
                style={{
                  background: '#FF4500',
                  color: '#050505',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '0px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                Control Center
              </span>
              <span className="font-mono-x" style={{ fontSize: '12px', color: '#FF4500' }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
                Active Session
              </span>
            </div>
            <h2
              className="heading"
              style={{
                fontFamily: "'Cabinet Grotesk', sans-serif",
                fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
                margin: '6px 0',
                color: '#FFFFFF',
                fontWeight: 900,
                textTransform: 'uppercase'
              }}
            >
              Welcome, {user?.name || 'User'}
            </h2>
            <p className="font-mono-x" style={{ color: '#737373', fontSize: '13px', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              <i className="fa-regular fa-envelope" style={{ marginRight: '8px', color: '#FF4500' }}></i>
              {user?.email}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={loadUserData}
              style={{
                color: '#FFFFFF',
                background: '#050505',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '12px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '0px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF4500')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
            >
              <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '8px', color: '#FF4500' }}></i>
              Sync Passes
            </button>
            <Link
              to="/events"
              style={{
                padding: '12px 24px',
                fontSize: '13px',
                background: '#FF4500',
                color: '#050505',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textDecoration: 'none',
                borderRadius: '0px'
              }}
            >
              <i className="fa-solid fa-ticket" style={{ marginRight: '8px' }}></i>
              Explore Events
            </Link>
          </div>
        </div>

        {/* Top Navigation Tabs (Bookings vs Location Enquiries) */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setDashboardTab('passes')}
            style={{
              padding: '10px 24px',
              borderRadius: '0px',
              border: dashboardTab === 'passes' ? '1px solid #FF4500' : '1px solid rgba(255, 255, 255, 0.12)',
              fontWeight: 800,
              fontSize: '13px',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: dashboardTab === 'passes' ? '#FF4500' : '#121212',
              color: dashboardTab === 'passes' ? '#050505' : '#A1A1A1',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-qrcode"></i>
            My Booked Passes ({bookings.length})
          </button>

          <button
            onClick={() => setDashboardTab('enquiries')}
            style={{
              padding: '10px 24px',
              borderRadius: '0px',
              border: dashboardTab === 'enquiries' ? '1px solid #FF4500' : '1px solid rgba(255, 255, 255, 0.12)',
              fontWeight: 800,
              fontSize: '13px',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: dashboardTab === 'enquiries' ? '#FF4500' : '#121212',
              color: dashboardTab === 'enquiries' ? '#050505' : '#A1A1A1',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-location-dot"></i>
            Event Enquiries ({enquiries.length})
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
              <div style={{ padding: '24px', borderRadius: '0px', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)', borderLeft: '3px solid #FF4500' }}>
                <p className="font-mono-x" style={{ fontSize: '11px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                  Total Bookings
                </p>
                <h3 className="font-display" style={{ fontSize: '2.4rem', color: '#FFFFFF', margin: '8px 0 0 0', fontWeight: 900 }}>{bookings.length}</h3>
              </div>

              <div style={{ padding: '24px', borderRadius: '0px', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)', borderLeft: '3px solid #F59E0B' }}>
                <p className="font-mono-x" style={{ fontSize: '11px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                  Valid Passes (Pending)
                </p>
                <h3 className="font-display" style={{ fontSize: '2.4rem', color: '#F59E0B', margin: '8px 0 0 0', fontWeight: 900 }}>{pendingCount}</h3>
              </div>

              <div style={{ padding: '24px', borderRadius: '0px', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)', borderLeft: '3px solid #10B981' }}>
                <p className="font-mono-x" style={{ fontSize: '11px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                  Verified Entries
                </p>
                <h3 className="font-display" style={{ fontSize: '2.4rem', color: '#10B981', margin: '8px 0 0 0', fontWeight: 900 }}>{checkedInCount}</h3>
              </div>

              <div style={{ padding: '24px', borderRadius: '0px', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)', borderLeft: '3px solid #FF4500' }}>
                <p className="font-mono-x" style={{ fontSize: '11px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                  Total Passes Owned
                </p>
                <h3 className="font-display" style={{ fontSize: '2.4rem', color: '#FF4500', margin: '8px 0 0 0', fontWeight: 900 }}>{totalPasses}</h3>
              </div>
            </div>

            {/* Filter Sub-Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
              <h3 className="heading" style={{ fontSize: '1.5rem', margin: 0, color: '#FFFFFF' }}>My Event QR Passes</h3>

              <div style={{ display: 'flex', gap: '8px', background: '#121212', padding: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '0px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    background: activeTab === 'all' ? '#FF4500' : 'transparent',
                    color: activeTab === 'all' ? '#050505' : '#A1A1A1',
                    textTransform: 'uppercase'
                  }}
                >
                  All ({bookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '0px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    background: activeTab === 'pending' ? '#FF4500' : 'transparent',
                    color: activeTab === 'pending' ? '#050505' : '#A1A1A1',
                    textTransform: 'uppercase'
                  }}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('checkedin')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '0px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    background: activeTab === 'checkedin' ? '#10B981' : 'transparent',
                    color: activeTab === 'checkedin' ? '#050505' : '#A1A1A1',
                    textTransform: 'uppercase'
                  }}
                >
                  Entry Done ({checkedInCount})
                </button>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div style={{ padding: '64px 20px', textAlign: 'center', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <i className="fa-solid fa-ticket-simple" style={{ fontSize: '3rem', color: '#333333', marginBottom: '16px' }}></i>
                <h4 className="heading" style={{ fontSize: '1.4rem', color: '#FFFFFF', marginBottom: '8px' }}>
                  {activeTab === 'all' ? 'No Booked Passes Found' : 'No Passes Match This Filter'}
                </h4>
                <p style={{ color: '#737373', maxWidth: '450px', margin: '0 auto 24px auto', fontSize: '14px' }}>
                  {activeTab === 'all'
                    ? "You haven't booked any event passes yet. Browse our live events and secure your tickets online."
                    : 'Select another filter tab to view your other pass reservations.'}
                </p>
                {activeTab === 'all' && (
                  <Link
                    to="/events"
                    style={{
                      display: 'inline-block',
                      padding: '12px 28px',
                      background: '#FF4500',
                      color: '#050505',
                      fontWeight: 900,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      textDecoration: 'none'
                    }}
                  >
                    Browse Events & Book Pass
                  </Link>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px'
                }}
              >
                {filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    style={{
                      borderRadius: '0px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#121212',
                      border: booking.isCheckedIn ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                      position: 'relative'
                    }}
                  >
                    {/* Header Verification Badge */}
                    <div
                      style={{
                        background: booking.isCheckedIn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 69, 0, 0.12)',
                        borderBottom: booking.isCheckedIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 69, 0, 0.25)',
                        padding: '12px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        className="font-mono-x"
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: booking.isCheckedIn ? '#10B981' : '#FF4500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          textTransform: 'uppercase'
                        }}
                      >
                        <i className={`fa-solid ${booking.isCheckedIn ? 'fa-circle-check' : 'fa-clock'}`}></i>
                        {booking.isCheckedIn ? 'ENTRY VERIFIED' : 'VALID PASS · PENDING'}
                      </span>

                      <span className="font-mono-x" style={{ fontSize: '11px', color: '#737373', fontWeight: 600 }}>
                        {booking.bookingId}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4
                        className="font-display"
                        style={{
                          fontSize: '1.25rem',
                          marginBottom: '8px',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {booking.eventTitle}
                      </h4>

                      <p className="font-mono-x" style={{ fontSize: '11px', color: '#737373', marginBottom: '16px' }}>
                        <i className="fa-regular fa-calendar" style={{ marginRight: '6px', color: '#FF4500' }}></i>
                        Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      {/* QR Code Presentation Box */}
                      <div
                        style={{
                          background: '#050505',
                          borderRadius: '0px',
                          padding: '16px',
                          textAlign: 'center',
                          marginBottom: '20px',
                          border: '1px dashed rgba(255, 69, 0, 0.35)'
                        }}
                      >
                        {booking.qrCodeUrl ? (
                          <img
                            src={booking.qrCodeUrl}
                            alt="Event QR Ticket Pass"
                            style={{
                              width: '150px',
                              height: '150px',
                              borderRadius: '0px',
                              border: '2px solid #FF4500',
                              padding: '6px',
                              background: '#FFF',
                              margin: '0 auto 10px auto',
                              display: 'block'
                            }}
                          />
                        ) : (
                          <div style={{ padding: '20px', color: '#737373' }}>QR Code Unavailable</div>
                        )}
                        <p className="font-mono-x" style={{ fontSize: '11px', color: '#737373', margin: 0, textTransform: 'uppercase' }}>
                          Scan QR at event gate turnstiles
                        </p>
                      </div>

                      {/* Booking Metadata list */}
                      <div style={{ fontSize: '13px', color: '#A1A1A1', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#737373' }}>Attendee Name:</span>
                          <strong style={{ color: '#FFFFFF' }}>{booking.userName}</strong>
                        </div>
                        {booking.userPhone && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: '#737373' }}>Mobile:</span>
                            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{booking.userPhone}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#737373' }}>Showtime:</span>
                          <strong style={{ color: '#FF4500', fontSize: '12px' }} className="font-mono-x">
                            {booking.showtimeDate && booking.showtimeDate !== 'Default'
                              ? (isNaN(new Date(booking.showtimeDate)) ? booking.showtimeDate : new Date(booking.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
                              : 'Main Performance Show'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#737373' }}>Pass Quantity:</span>
                          <strong style={{ color: '#FFFFFF' }}>{booking.quantity} Reserved Pass(es)</strong>
                        </div>

                        {/* Visual Seat Badges */}
                        {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                          <div style={{ background: '#050505', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.08)', margin: '4px 0' }}>
                            <span className="font-mono-x" style={{ fontSize: '10px', color: '#FF4500', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                              <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i>
                              Reserved Seats ({booking.selectedSeats.length}):
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {booking.selectedSeats.map((s) => (
                                <span
                                  key={s.seatId || s.displayLabel}
                                  className="font-mono-x"
                                  style={{
                                    background: '#121212',
                                    border: '1px solid #FF4500',
                                    borderRadius: '0px',
                                    padding: '3px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span>Seat {s.displayLabel || s.seatId}</span>
                                  <span style={{ color: '#FF4500', background: 'rgba(255, 69, 0, 0.15)', padding: '1px 5px', fontSize: '10px' }}>
                                    {s.category || 'General'}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ color: '#737373' }}>Total Paid:</span>
                          <strong className="font-display" style={{ color: '#FF4500', fontSize: '1.2rem', fontWeight: 900 }}>₹{booking.totalAmount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#737373' }}>Payment:</span>
                          <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-circle-check" style={{ fontSize: '11px' }}></i>
                            {booking.paymentGateway || 'Cashfree'} ({booking.paymentMethod || 'Paid'})
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => setSelectedPass(booking)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            fontSize: '12px',
                            background: '#FF4500',
                            color: '#050505',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fa-solid fa-qrcode"></i>
                          Expand QR Pass
                        </button>
                        <button
                          onClick={() => handlePrintPass(booking)}
                          style={{
                            padding: '12px 16px',
                            fontSize: '13px',
                            color: '#FFFFFF',
                            background: '#050505',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            cursor: 'pointer',
                            borderRadius: '0px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF4500')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 className="heading" style={{ fontSize: '1.5rem', margin: 0, color: '#FFFFFF' }}>My Location & Event Enquiries</h3>
              <Link
                to="/#enquiry"
                style={{
                  padding: '10px 20px',
                  fontSize: '12px',
                  background: '#FF4500',
                  color: '#050505',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: '0px'
                }}
              >
                <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>
                New Enquiry
              </Link>
            </div>

            {enquiries.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <i className="fa-solid fa-location-dot" style={{ fontSize: '3rem', color: '#333333', marginBottom: '16px' }}></i>
                <h4 className="heading" style={{ fontSize: '1.4rem', color: '#FFFFFF', marginBottom: '8px' }}>No Event Enquiries Found</h4>
                <p style={{ color: '#737373', maxWidth: '450px', margin: '0 auto 24px auto', fontSize: '14px' }}>
                  You haven't submitted any event location enquiries yet. Submit an enquiry for custom venue booking & production management.
                </p>
                <Link
                  to="/"
                  style={{
                    display: 'inline-block',
                    padding: '12px 28px',
                    background: '#FF4500',
                    color: '#050505',
                    fontWeight: 900,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    textDecoration: 'none'
                  }}
                >
                  Submit Location Enquiry
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {enquiries.map((enquiry) => (
                  <div
                    key={enquiry._id || enquiry.id}
                    style={{
                      borderRadius: '0px',
                      padding: '24px',
                      background: '#121212',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span
                          className="font-mono-x"
                          style={{
                            background: 'rgba(255, 69, 0, 0.12)',
                            color: '#FF4500',
                            fontWeight: 700,
                            fontSize: '11px',
                            padding: '4px 10px',
                            border: '1px solid rgba(255, 69, 0, 0.3)',
                            textTransform: 'uppercase'
                          }}
                        >
                          {enquiry.eventType || 'Event Enquiry'}
                        </span>
                        <span
                          className="font-mono-x"
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            background:
                              enquiry.status === 'Resolved'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : enquiry.status === 'Contacted'
                                ? 'rgba(59, 130, 246, 0.12)'
                                : 'rgba(245, 158, 11, 0.12)',
                            color:
                              enquiry.status === 'Resolved'
                                ? '#10B981'
                                : enquiry.status === 'Contacted'
                                ? '#60A5FA'
                                : '#F59E0B',
                            border: `1px solid ${enquiry.status === 'Resolved' ? 'rgba(16, 185, 129, 0.3)' : enquiry.status === 'Contacted' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}
                        >
                          ● {enquiry.status || 'New'}
                        </span>
                      </div>

                      {enquiry.location && (
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-location-dot" style={{ color: '#FF4500' }}></i> {enquiry.location}
                        </p>
                      )}

                      <p style={{ fontSize: '13px', color: '#A1A1A1', lineHeight: 1.6, marginBottom: '16px', background: '#050505', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        "{enquiry.message}"
                      </p>
                    </div>

                    <div className="font-mono-x" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#737373' }}>
                      <span>BY: {enquiry.name}</span>
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
              background: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <div
              style={{
                maxWidth: '440px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '0px',
                padding: '32px',
                textAlign: 'center',
                position: 'relative',
                background: '#121212',
                border: '1px solid #FF4500',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
              }}
            >
              <button
                onClick={() => setSelectedPass(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: '#050505',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#FFFFFF'
                }}
              >
                ✕
              </button>

              <div
                className="font-display"
                style={{
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  letterSpacing: '1px',
                  marginBottom: '2px',
                  textTransform: 'uppercase'
                }}
              >
                Vana Entertainment
              </div>
              <p className="font-mono-x" style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#737373', marginBottom: '20px' }}>
                Gate Verification Pass
              </p>

              <div
                className="font-mono-x"
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '0px',
                  fontWeight: 700,
                  fontSize: '11px',
                  marginBottom: '20px',
                  background: selectedPass.isCheckedIn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 69, 0, 0.12)',
                  color: selectedPass.isCheckedIn ? '#10B981' : '#FF4500',
                  border: selectedPass.isCheckedIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 69, 0, 0.25)',
                  textTransform: 'uppercase'
                }}
              >
                <i className={`fa-solid ${selectedPass.isCheckedIn ? 'fa-circle-check' : 'fa-clock'}`} style={{ marginRight: '6px' }}></i>
                {selectedPass.isCheckedIn ? 'ENTRY VERIFIED' : 'VALID ENTRY PASS · PRESENT AT GATE'}
              </div>

              <h3 className="heading" style={{ fontSize: '1.3rem', marginBottom: '16px', color: '#FFFFFF' }}>{selectedPass.eventTitle}</h3>

              {selectedPass.qrCodeUrl && (
                <div style={{ background: '#FFF', padding: '16px', borderRadius: '0px', display: 'inline-block', border: '2px solid #FF4500', marginBottom: '20px' }}>
                  <img src={selectedPass.qrCodeUrl} alt="QR Pass" style={{ width: '220px', height: '220px', display: 'block' }} />
                </div>
              )}

              <div style={{ background: '#050505', padding: '16px', borderRadius: '0px', textAlign: 'left', fontSize: '13px', color: '#CBD5E1', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#FFFFFF' }}>Booking Ref:</strong> {selectedPass.bookingId}</p>
                <p style={{ margin: '4px 0' }}>
                  <strong style={{ color: '#FFFFFF' }}>Showtime:</strong>{' '}
                  <span style={{ color: '#FF4500', fontWeight: 600 }}>
                    {selectedPass.showtimeDate && selectedPass.showtimeDate !== 'Default'
                      ? (isNaN(new Date(selectedPass.showtimeDate)) ? selectedPass.showtimeDate : new Date(selectedPass.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
                      : 'Main Performance Show'}
                  </span>
                </p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#FFFFFF' }}>Attendee Name:</strong> {selectedPass.userName} {selectedPass.userPhone ? `(${selectedPass.userPhone})` : ''}</p>
                <p style={{ margin: '4px 0' }}><strong style={{ color: '#FFFFFF' }}>Quantity:</strong> {selectedPass.quantity} Reserved Pass(es)</p>

                {/* Reserved Seats List */}
                {selectedPass.selectedSeats && selectedPass.selectedSeats.length > 0 && (
                  <div style={{ margin: '10px 0', padding: '10px', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div className="font-mono-x" style={{ fontSize: '10px', fontWeight: 700, color: '#FF4500', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Allocated Seats:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedPass.selectedSeats.map((s) => (
                        <span
                          key={s.seatId || s.displayLabel}
                          className="font-mono-x"
                          style={{
                            background: '#050505',
                            border: '1px solid #FF4500',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#FFFFFF'
                          }}
                        >
                          Seat {s.displayLabel || s.seatId}
                          <span style={{ color: '#FF4500', fontSize: '10px', marginLeft: '4px' }}>
                            ({s.category || 'Pass'})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)', marginTop: '10px', paddingTop: '8px' }}>
                  <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#FF4500', fontSize: '15px' }}>
                    <span>Total Amount Paid:</span>
                    <span>₹{selectedPass.totalAmount}</span>
                  </p>
                </div>

                {selectedPass.cashfreeOrderId && (
                  <p style={{ margin: '4px 0', fontSize: '11px', color: '#737373' }}>
                    <strong>Cashfree Order:</strong> <code style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>{selectedPass.cashfreeOrderId}</code>
                  </p>
                )}

                {selectedPass.isCheckedIn && selectedPass.checkInTime && (
                  <p style={{ margin: '6px 0 0 0', color: '#10B981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', padding: '6px 10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    ✓ Entry Checked-In: {new Date(selectedPass.checkInTime).toLocaleString()} {selectedPass.checkInGate ? `(Gate: ${selectedPass.checkInGate})` : ''}
                  </p>
                )}
              </div>

              <button
                onClick={() => handlePrintPass(selectedPass)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#FF4500',
                  color: '#050505',
                  fontWeight: 900,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-print"></i>
                Print Official Pass PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
