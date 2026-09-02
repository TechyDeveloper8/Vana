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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VANA Pass - ${booking.bookingId}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #FAF7F2; color: #1F1F1F; }
            .ticket-card { max-width: 500px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 20px; border: 2px solid #B8860B; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .brand { font-size: 24px; font-weight: 800; color: #B8860B; letter-spacing: 2px; }
            .sub { font-size: 12px; letter-spacing: 4px; color: #555; text-transform: uppercase; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 700; margin: 15px 0 5px 0; color: #111; }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin-top: 10px; }
            .checked-in { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
            .pending { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
            .qr-img { width: 200px; height: 200px; border-radius: 12px; margin: 20px 0; border: 1px solid #ddd; padding: 8px; }
            .details { text-align: left; background: #F8EFE8; padding: 16px; border-radius: 12px; font-size: 14px; margin-top: 15px; }
            .details p { margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <div class="brand">VANA</div>
            <div class="sub">Entertainments Official Pass</div>
            <div class="title">${booking.eventTitle}</div>
            <div>
              <span class="badge ${booking.isCheckedIn ? 'checked-in' : 'pending'}">
                ${booking.isCheckedIn ? '✓ ENTRY DONE / CHECKED IN' : 'VALID PASS - ENTRY PENDING'}
              </span>
            </div>
            ${booking.qrCodeUrl ? `<img src="${booking.qrCodeUrl}" class="qr-img" />` : ''}
            <div class="details">
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
              <p><strong>Attendee Name:</strong> ${booking.userName}</p>
              <p><strong>Quantity:</strong> ${booking.quantity} Pass(es)</p>
              <p><strong>Amount Paid:</strong> ₹${booking.totalAmount}</p>
              ${booking.isCheckedIn && booking.checkInTime ? `<p><strong>Entry Timestamp:</strong> ${new Date(booking.checkInTime).toLocaleString()}</p>` : ''}
            </div>
            <p style="font-size: 11px; color: #777; margin-top: 20px;">Present this QR pass at the entrance gate for quick verification.</p>
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
    <div style={{ padding: '60px 0', background: '#F8EFE8', minHeight: '85vh' }}>
      <div className="container">
        {/* User Greeting Banner */}
        <div
          className="white-card"
          style={{
            padding: '36px',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 100%)',
            color: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.15)',
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
                  background: '#B8860B',
                  color: '#FFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Vana Account Dashboard
              </span>
              <span style={{ fontSize: '0.85rem', color: '#D1D5DB' }}>
                <i className="fa-solid fa-user-check" style={{ marginRight: '6px', color: '#B8860B' }}></i>
                Signed In
              </span>
            </div>
            <h2 style={{ fontSize: '2rem', margin: '6px 0', color: '#FFFFFF', fontWeight: 700 }}>
              Welcome Back, {user?.name || 'User'}!
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.95rem', margin: 0 }}>
              <i className="fa-regular fa-envelope" style={{ marginRight: '8px' }}></i>
              {user?.email}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={loadUserData}
              className="btn-outline"
              style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.3)', padding: '10px 20px', fontSize: '0.9rem' }}
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
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', borderBottom: '2px solid #E7DDD1', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setDashboardTab('passes')}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: dashboardTab === 'passes' ? '#1F1F1F' : '#FFF',
              color: dashboardTab === 'passes' ? '#FFF' : '#5F5F5F',
              boxShadow: dashboardTab === 'passes' ? '0 6px 20px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <i className="fa-solid fa-qrcode" style={{ color: dashboardTab === 'passes' ? '#B8860B' : 'inherit' }}></i>
            My Booked Passes ({bookings.length})
          </button>

          <button
            onClick={() => setDashboardTab('enquiries')}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: dashboardTab === 'enquiries' ? '#1F1F1F' : '#FFF',
              color: dashboardTab === 'enquiries' ? '#FFF' : '#5F5F5F',
              boxShadow: dashboardTab === 'enquiries' ? '0 6px 20px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <i className="fa-solid fa-location-dot" style={{ color: dashboardTab === 'enquiries' ? '#B8860B' : 'inherit' }}></i>
            My Event Location Enquiries ({enquiries.length})
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5F5F5F' }}>
            <i class="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#B8860B', marginBottom: '12px' }}></i>
            <p>Loading your account details...</p>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: '20px',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '14px',
              color: '#991B1B',
              textAlign: 'center',
              marginBottom: '24px'
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
              <div class="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid #B8860B' }}>
                <p style={{ fontSize: '0.85rem', color: '#5F5F5F', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Total Bookings
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#1F1F1F', margin: '8px 0 0 0' }}>{bookings.length}</h3>
              </div>

              <div class="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid #D97706' }}>
                <p style={{ fontSize: '0.85rem', color: '#5F5F5F', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Valid Passes (Pending Entry)
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#D97706', margin: '8px 0 0 0' }}>{pendingCount}</h3>
              </div>

              <div class="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid #16A34A' }}>
                <p style={{ fontSize: '0.85rem', color: '#5F5F5F', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Verified Entries (Done)
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#16A34A', margin: '8px 0 0 0' }}>{checkedInCount}</h3>
              </div>

              <div class="white-card" style={{ padding: '24px', borderRadius: '18px', borderLeft: '4px solid #2563EB' }}>
                <p style={{ fontSize: '0.85rem', color: '#5F5F5F', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Total Passes Owned
                </p>
                <h3 style={{ fontSize: '2.2rem', color: '#2563EB', margin: '8px 0 0 0' }}>{totalPasses}</h3>
              </div>
            </div>

            {/* Filter Sub-Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#1F1F1F' }}>My Event QR Passes</h3>

              <div style={{ display: 'flex', gap: '10px', background: '#EAE1D7', padding: '6px', borderRadius: '14px' }}>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: activeTab === 'all' ? '#1F1F1F' : 'transparent',
                    color: activeTab === 'all' ? '#FFF' : '#5F5F5F'
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
                    color: activeTab === 'pending' ? '#FFF' : '#5F5F5F'
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
                    color: activeTab === 'checkedin' ? '#FFF' : '#5F5F5F'
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
                      border: booking.isCheckedIn ? '2px solid #86EFAC' : '1px solid #E7DDD1',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
                      position: 'relative'
                    }}
                  >
                    {/* Header Verification Badge */}
                    <div
                      style={{
                        background: booking.isCheckedIn ? '#DCFCE7' : '#FEF3C7',
                        borderBottom: booking.isCheckedIn ? '1px solid #86EFAC' : '1px solid #FDE68A',
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
                          color: booking.isCheckedIn ? '#166534' : '#92400E',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className={`fa-solid ${booking.isCheckedIn ? 'fa-circle-check' : 'fa-clock'}`}></i>
                        {booking.isCheckedIn ? 'ENTRY DONE (CHECKED IN)' : 'VALID PASS - ENTRY PENDING'}
                      </span>

                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                        {booking.bookingId}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#1F1F1F', fontWeight: 700 }}>
                        {booking.eventTitle}
                      </h4>

                      <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '16px' }}>
                        <i class="fa-regular fa-calendar" style={{ marginRight: '6px', color: '#B8860B' }}></i>
                        Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      {/* QR Code Presentation Box */}
                      <div
                        style={{
                          background: '#FAF7F2',
                          borderRadius: '16px',
                          padding: '16px',
                          textAlign: 'center',
                          marginBottom: '20px',
                          border: '1px dashed #D6C7B7'
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
                              border: '2px solid #B8860B',
                              padding: '6px',
                              background: '#FFF',
                              margin: '0 auto 10px auto',
                              display: 'block'
                            }}
                          />
                        ) : (
                          <div style={{ padding: '20px', color: '#94A3B8' }}>QR Code Unavailable</div>
                        )}
                        <p style={{ fontSize: '0.78rem', color: '#78716C', margin: 0, fontWeight: 500 }}>
                          Scan QR at event venue gate for instant entry
                        </p>
                      </div>

                      {/* Booking Metadata list */}
                      <div style={{ fontSize: '0.88rem', color: '#444', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#78716C' }}>Attendee Name:</span>
                          <strong style={{ color: '#1C1917' }}>{booking.userName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#78716C' }}>Pass Quantity:</span>
                          <strong style={{ color: '#1C1917' }}>{booking.quantity} Ticket(s)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#78716C' }}>Total Paid:</span>
                          <strong style={{ color: '#B8860B', fontSize: '1rem' }}>₹{booking.totalAmount}</strong>
                        </div>

                        {booking.isCheckedIn && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '10px 12px',
                              background: '#F0FDF4',
                              borderRadius: '10px',
                              fontSize: '0.8rem',
                              color: '#15803D',
                              border: '1px solid #BBF7D0'
                            }}
                          >
                            <i class="fa-solid fa-shield-check" style={{ marginRight: '6px' }}></i>
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
                          class="primary-btn"
                          style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem', justifyContent: 'center' }}
                        >
                          <i class="fa-solid fa-qrcode" style={{ marginRight: '6px' }}></i>
                          Expand QR Pass
                        </button>
                        <button
                          onClick={() => handlePrintPass(booking)}
                          class="btn-outline"
                          style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                          title="Print / Save Pass PDF"
                        >
                          <i class="fa-solid fa-print"></i>
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
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#1F1F1F' }}>My Location & Event Enquiries</h3>
              <Link to="/#enquiry" class="primary-btn" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
                <i class="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>
                Submit New Enquiry
              </Link>
            </div>

            {enquiries.length === 0 ? (
              <div class="white-card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '20px' }}>
                <i class="fa-solid fa-location-dot" style={{ fontSize: '3.5rem', color: '#CBD5E1', marginBottom: '16px' }}></i>
                <h4 style={{ fontSize: '1.4rem', color: '#334155', marginBottom: '8px' }}>No Event Enquiries Found</h4>
                <p style={{ color: '#64748B', maxWidth: '450px', margin: '0 auto 24px auto', fontSize: '0.95rem' }}>
                  You haven't submitted any event location enquiries yet. Submit an enquiry on our home page for custom venue booking & management.
                </p>
                <Link to="/" class="primary-btn">
                  Submit Location Enquiry
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {enquiries.map((enquiry) => (
                  <div
                    key={enquiry._id || enquiry.id}
                    class="white-card"
                    style={{
                      borderRadius: '20px',
                      padding: '24px',
                      border: '1px solid #E7DDD1',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span
                          style={{
                            background: '#F3F4F6',
                            color: '#1F2937',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            padding: '4px 12px',
                            borderRadius: '12px'
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
                                ? '#DCFCE7'
                                : enquiry.status === 'Contacted'
                                ? '#DBEAFE'
                                : '#FEF3C7',
                            color:
                              enquiry.status === 'Resolved'
                                ? '#166534'
                                : enquiry.status === 'Contacted'
                                ? '#1E40AF'
                                : '#92400E'
                          }}
                        >
                          ● {enquiry.status || 'New'}
                        </span>
                      </div>

                      {enquiry.location && (
                        <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#B8860B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i class="fa-solid fa-location-dot"></i> {enquiry.location}
                        </p>
                      )}

                      <p style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.6, marginBottom: '16px', background: '#FAF7F2', padding: '14px', borderRadius: '12px', border: '1px solid #E7DDD1' }}>
                        "{enquiry.message}"
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9CA3AF' }}>
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
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
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
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <button
                onClick={() => setSelectedPass(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  border: 'none',
                  background: '#F3F4F6',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#4B5563'
                }}
              >
                ✕
              </button>

              <div style={{ color: '#B8860B', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '2px', marginBottom: '2px' }}>
                VANA ENTERTAINMENTS
              </div>
              <p style={{ fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#6B7280', marginBottom: '20px' }}>
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
                  background: selectedPass.isCheckedIn ? '#DCFCE7' : '#FEF3C7',
                  color: selectedPass.isCheckedIn ? '#166534' : '#92400E',
                  border: selectedPass.isCheckedIn ? '1px solid #86EFAC' : '1px solid #FDE68A'
                }}
              >
                <i className={`fa-solid ${selectedPass.isCheckedIn ? 'fa-circle-check' : 'fa-clock'}`} style={{ marginRight: '6px' }}></i>
                {selectedPass.isCheckedIn ? 'ENTRY DONE (VERIFIED)' : 'VALID ENTRY PASS - SCAN AT GATE'}
              </div>

              <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#111827' }}>{selectedPass.eventTitle}</h3>

              {selectedPass.qrCodeUrl && (
                <div style={{ background: '#FFF', padding: '16px', borderRadius: '18px', display: 'inline-block', border: '2px solid #B8860B', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
                  <img src={selectedPass.qrCodeUrl} alt="QR Pass" style={{ width: '220px', height: '220px', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '14px', textAlign: 'left', fontSize: '0.88rem', color: '#374151', marginBottom: '20px' }}>
                <p style={{ margin: '4px 0' }}><strong>Booking Ref:</strong> {selectedPass.bookingId}</p>
                <p style={{ margin: '4px 0' }}><strong>Attendee Name:</strong> {selectedPass.userName}</p>
                <p style={{ margin: '4px 0' }}><strong>Quantity:</strong> {selectedPass.quantity} Ticket(s)</p>
                <p style={{ margin: '4px 0' }}><strong>Total Paid:</strong> ₹{selectedPass.totalAmount}</p>
                {selectedPass.isCheckedIn && selectedPass.checkInTime && (
                  <p style={{ margin: '4px 0', color: '#166534' }}>
                    <strong>Entry Checked-In At:</strong> {new Date(selectedPass.checkInTime).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                onClick={() => handlePrintPass(selectedPass)}
                class="primary-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <i class="fa-solid fa-print" style={{ marginRight: '8px' }}></i>
                Print Official Pass PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
