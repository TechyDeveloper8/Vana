import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InteractiveSeatMap from '../components/InteractiveSeatMap';

export default function BookTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [showtimeDate, setShowtimeDate] = useState('2026-09-15T18:00');
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [phone, setPhone] = useState(user ? user.phone || '' : '');

  const [layout, setLayout] = useState(null);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]); // Array of seat objects { seatId, displayLabel, category, price }
  const [activePlan, setActivePlan] = useState('All'); // 'All', 'Platinum', 'Gold', 'VIP Lounge'
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [lockTimeLeft, setLockTimeLeft] = useState(null);
  const [showMobileCheckoutDrawer, setShowMobileCheckoutDrawer] = useState(false);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // Load Event Details
  useEffect(() => {
    if (id) {
      fetchAPI(`/events/${id}`)
        .then((res) => {
          if (res.data) setEvent(res.data);
        })
        .catch((err) => console.error('Error loading event:', err));
    }
  }, [id]);

  // Load Venue Layout Configuration
  useEffect(() => {
    fetchAPI('/seating/layout/ground-floor-main?forceReseed=true')
      .then((res) => {
        if (res.success) setLayout(res.data);
      })
      .catch((err) => console.error('Error fetching layout:', err));
  }, []);

  // Load Showtime Availability & Connect Real-Time Socket
  useEffect(() => {
    if (!id) return;

    // 1. Fetch current showtime availability
    fetchAPI(`/seating/availability?eventId=${id}&showtimeDate=${encodeURIComponent(showtimeDate)}`)
      .then((res) => {
        if (res.success && res.data) {
          const map = {};
          res.data.forEach((seat) => {
            map[seat.seatId] = seat;
          });
          setAvailabilityMap(map);
        }
      })
      .catch((err) => console.error('Error fetching showtime availability:', err));

    // 2. Connect Socket.IO for real-time updates
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinShowtimeRoom', { eventId: id, showtimeDate });
    });

    socket.on('seatStatusChanged', ({ seatId, status, lockedBy }) => {
      setAvailabilityMap((prevMap) => {
        const updated = { ...prevMap };
        if (updated[seatId]) {
          updated[seatId] = { ...updated[seatId], status, lockedBy };
        }
        return updated;
      });
    });

    return () => {
      socket.emit('leaveShowtimeRoom', { eventId: id, showtimeDate });
      socket.disconnect();
    };
  }, [id, showtimeDate]);

  // Handle seat click on venue map
  const handleSeatClick = (seat, price) => {
    const exists = selectedSeats.some((s) => s.seatId === seat.seatId);

    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatId !== seat.seatId));
    } else {
      setSelectedSeats([
        ...selectedSeats,
        {
          seatId: seat.seatId,
          displayLabel: seat.displayLabel,
          category: seat.category,
          price
        }
      ]);
    }
  };

  // Subtotal & Tax Calculation
  const subtotal = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
  const gst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gst;

  // Handle seat reservation and payment checkout
  const handleBooking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!user) {
      alert('Please sign in to your account before placing a pass order.');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (selectedSeats.length === 0) {
      alert('Please click and select at least one seat from the venue map.');
      return;
    }

    setLocking(true);

    try {
      // Step 1: Atomic Seat Locking on Backend
      const seatIdsToLock = selectedSeats.map((s) => s.seatId);
      const lockRes = await fetchAPI('/seating/lock', {
        method: 'POST',
        body: JSON.stringify({
          eventId: id || event?._id,
          showtimeDate,
          seatIds: seatIdsToLock,
          lockedBy: user.id
        })
      });

      if (!lockRes.success) {
        alert(lockRes.message || 'Failed to lock selected seats. Please select different seats.');
        setLocking(false);
        return;
      }

      // Step 2: Proceed to Create Permanent Booking
      setLoading(true);

      const bookingRes = await fetchAPI('/booking/create', {
        method: 'POST',
        body: JSON.stringify({
          eventId: id || event?._id,
          eventTitle: event?.title || 'Vana Live Performance',
          userName: name,
          userEmail: email,
          userPhone: phone,
          selectedSeats,
          showtimeDate,
          paymentStatus: 'Paid'
        })
      });

      if (bookingRes.success) {
        setBookingSuccess(bookingRes.booking);
        setSelectedSeats([]);
      } else {
        alert(bookingRes.message || 'Booking payment processing failed.');
      }
    } catch (err) {
      alert(err.message || 'An unexpected error occurred during seat booking.');
    } finally {
      setLocking(false);
      setLoading(false);
    }
  };

  // Booking Success Confirmation Screen
  if (bookingSuccess) {
    const seatDisplay = bookingSuccess.selectedSeats?.map((s) => s.displayLabel || s.seatId).join(', ');

    return (
      <div style={{ padding: '60px 0', textAlign: 'center', background: '#F8EFE8', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div className="white-card" style={{ padding: '36px 28px', borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.08)' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '54px', color: '#B8860B', marginBottom: '16px' }}></i>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#1F1F1F' }}>Seated Pass Reservation Confirmed!</h2>
            <p style={{ color: '#5F5F5F', marginBottom: '20px', fontSize: '0.95rem' }}>
              Your reserved seats have been permanently locked. Entry pass QR code has been dispatched to <strong>{bookingSuccess.userEmail}</strong>.
            </p>

            <div style={{ background: '#EFF6FF', color: '#1E40AF', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #BFDBFE', textAlign: 'left' }}>
              <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: '1.3rem', color: '#2563EB' }}></i>
              <span>Official QR entrance pass dispatched directly to <strong>{bookingSuccess.userEmail}</strong></span>
            </div>

            <div style={{ background: '#F6EFE5', padding: '20px', borderRadius: '18px', textAlign: 'left', marginBottom: '24px', border: '1px solid #E7DDD1', fontSize: '0.9rem' }}>
              <p style={{ marginBottom: '8px' }}><strong>Booking ID:</strong> {bookingSuccess.bookingId}</p>
              <p style={{ marginBottom: '8px' }}><strong>Event:</strong> {bookingSuccess.eventTitle}</p>
              <p style={{ marginBottom: '8px' }}><strong>Reserved Seats:</strong> <span style={{ color: '#B8860B', fontWeight: 700 }}>{seatDisplay || 'Assigned'}</span></p>
              <p style={{ marginBottom: '8px' }}><strong>Categories:</strong> {bookingSuccess.ticketCategory}</p>
              <p style={{ marginBottom: '8px' }}><strong>Attendee:</strong> {bookingSuccess.userName}</p>
              <p style={{ marginBottom: '8px' }}><strong>Total Paid:</strong> ₹{bookingSuccess.totalAmount} (incl. GST)</p>
              {bookingSuccess.qrCodeUrl && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <img src={bookingSuccess.qrCodeUrl} alt="QR Code Pass" style={{ width: '160px', borderRadius: '12px', border: '2px solid #B8860B', padding: '6px', background: '#FFF' }} />
                  <p style={{ fontSize: '0.8rem', color: '#8E8E8E', marginTop: '8px' }}>Present QR pass at gate scanner for verification</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/dashboard')} className="primary-btn" style={{ padding: '12px 24px' }}>
                <i className="fa-solid fa-gauge-high" style={{ marginRight: '8px' }}></i> View Dashboard Passes
              </button>
              <button onClick={() => navigate('/')} className="btn-outline" style={{ padding: '12px 20px' }}>
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0F172A', color: '#FFF', minHeight: '100vh', padding: '30px 16px 120px 16px' }}>
      {/* Mobile Responsive Global CSS Override */}
      <style>{`
        @media (max-width: 900px) {
          .booking-main-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-sticky-footer {
            display: flex !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header Title */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>
            <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i> Interactive Venue Seating
          </span>
          <h2 style={{ fontSize: '1.8rem', color: '#FFF', margin: '6px 0 0 0' }}>
            {event ? event.title : 'Live Performance Seated Pass Booking'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Select your plan tier, tap seats on the mobile map, and secure passes in real-time.
          </p>
        </div>

        {/* Authentication Alert */}
        {!user && (
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto 20px auto',
              padding: '14px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <strong style={{ color: '#F59E0B', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-user-lock"></i> Account Authentication Required
              </strong>
              <p style={{ margin: '2px 0 0 0', color: '#94A3B8', fontSize: '0.8rem' }}>
                Sign in to complete seat reservation and store tickets in your user dashboard.
              </p>
            </div>
            <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="primary-btn" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
              Sign In Now
            </Link>
          </div>
        )}

        {/* Showtime / Date Selector */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto 20px auto',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            background: '#1E293B',
            padding: '12px 18px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ color: '#F59E0B', fontSize: '1.1rem' }}></i>
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Performance Showtime:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['2026-09-15T18:00', '2026-09-16T18:00', '2026-09-17T18:00'].map((st) => {
              const formatted = new Date(st).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              const isActive = showtimeDate === st;
              return (
                <button
                  key={st}
                  onClick={() => {
                    setShowtimeDate(st);
                    setSelectedSeats([]);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid #F59E0B' : '1px solid #334155',
                    background: isActive ? '#F59E0B' : '#0F172A',
                    color: isActive ? '#000' : '#CBD5E1',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {formatted}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1: Choose Your Seating Plan */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 20px auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#F59E0B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-layer-group"></i> Step 1: Choose Your Seating Plan Tier First:
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Tap a plan to focus map rows</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            {/* All Plans */}
            <button
              type="button"
              onClick={() => setActivePlan('All')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'All' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                background: activePlan === 'All' ? 'linear-gradient(135deg, #334155 0%, #0F172A 100%)' : '#1E293B',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'All' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem' }}>🌐 All Plans</strong>
                <span style={{ fontSize: '0.68rem', background: '#334155', padding: '2px 6px', borderRadius: '4px', color: '#CBD5E1' }}>Full View</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8' }}>View all rows & categories</p>
            </button>

            {/* Silver / First Floor Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('Silver')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'Silver' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                background: activePlan === 'Silver' ? 'linear-gradient(135deg, #475569 0%, #1E293B 100%)' : '#1E293B',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'Silver' ? '0 0 12px rgba(203, 213, 225, 0.4)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#CBD5E1' }}>🥈 Silver Plan</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10B981' }}>₹999</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8' }}>Rows 1A–1H • First Floor Balcony</p>
            </button>

            {/* Platinum Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('Platinum')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'Platinum' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                background: activePlan === 'Platinum' ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' : '#1E293B',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'Platinum' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#E2E8F0' }}>💎 Platinum Plan</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10B981' }}>₹2,499</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8' }}>Rows A–E • Premium Front Stage</p>
            </button>

            {/* Gold Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('Gold')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'Gold' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                background: activePlan === 'Gold' ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' : '#1E293B',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'Gold' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#F59E0B' }}>🥇 Gold Plan</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10B981' }}>₹1,499</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8' }}>Rows F–Q • Main Auditorium</p>
            </button>

            {/* VIP Lounge Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('VIP Lounge')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'VIP Lounge' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                background: activePlan === 'VIP Lounge' ? 'linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)' : '#1E293B',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'VIP Lounge' ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#EF4444' }}>👑 VIP Lounge</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10B981' }}>₹4,999</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8' }}>Units V1–V15 • Red Velvet Sofas</p>
            </button>
          </div>
        </div>

        {/* Main Layout: Interactive Map on Top, Reservation Summary Below */}
        <div className="booking-main-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Interactive Vector Seat Map */}
          <div>
            <InteractiveSeatMap
              layout={layout}
              availabilityMap={availabilityMap}
              selectedSeatIds={selectedSeats.map((s) => s.seatId)}
              activePlan={activePlan}
              onSeatClick={handleSeatClick}
              currentUserId={user?.id}
            />
          </div>

          {/* Live Booking Summary Panel (Positioned Below Auditorium View) */}
          <div
            id="checkout-summary-panel"
            style={{
              background: '#1E293B',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
              width: '100%'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 16px 0', borderBottom: '1px solid #334155', paddingBottom: '12px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-receipt" style={{ color: '#F59E0B' }}></i> Reservation Summary
            </h3>

            {/* Selected Seats List */}
            <div style={{ minHeight: '80px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Selected Seats ({selectedSeats.length})
              </span>

              {selectedSeats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748B', fontSize: '0.85rem' }}>
                  <i className="fa-solid fa-hand-pointer" style={{ display: 'block', fontSize: '1.3rem', marginBottom: '6px' }}></i>
                  Tap on available seats on the auditorium map above
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.seatId}
                      style={{
                        background: seat.category === 'Platinum' ? '#1E293B' : seat.category === 'VIP Lounge' ? '#7F1D1D' : '#334155',
                        border: '1px solid #F59E0B',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#FFF' }}>{seat.displayLabel}</span>
                      <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>₹{seat.price}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSeats(selectedSeats.filter((s) => s.seatId !== seat.seatId))}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem', padding: 0, marginLeft: '4px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Form Details */}
            <form onSubmit={handleBooking}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    disabled={!user}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0F172A', border: '1px solid #334155', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '6px' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    disabled={!user}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0F172A', border: '1px solid #334155', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '6px' }}>Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit phone"
                    disabled={!user}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0F172A', border: '1px solid #334155', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Price Calculation Table */}
              <div style={{ background: '#0F172A', padding: '16px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #334155', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#CBD5E1' }}>
                  <span>Seats Subtotal ({selectedSeats.length})</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#CBD5E1' }}>
                  <span>GST Tax (18%)</span>
                  <span>₹{gst}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '8px', color: '#F59E0B', fontWeight: 800, fontSize: '1.1rem' }}>
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              {/* Submit Button */}
              {user ? (
                <button
                  type="submit"
                  disabled={loading || locking || selectedSeats.length === 0}
                  className="primary-btn"
                  style={{
                    width: '100%',
                    padding: '14px',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    background: selectedSeats.length === 0 ? '#334155' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {locking ? 'Locking Seats...' : loading ? 'Processing Order...' : `Pay ₹${grandTotal} & Confirm Seats`}
                </button>
              ) : (
                <Link
                  to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                  className="primary-btn"
                  style={{ width: '100%', padding: '14px', justifyContent: 'center', textAlign: 'center', display: 'flex', fontSize: '0.95rem' }}
                >
                  Sign In To Reserve Seats
                </Link>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY FLOATING CHECKOUT BAR */}
      <div
        className="mobile-sticky-footer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(245, 158, 11, 0.4)',
          padding: '10px 16px',
          display: 'none', // shown via CSS on mobile viewports (<900px)
          alignItems: 'center',
          justify: 'space-between',
          zIndex: 1000,
          boxShadow: '0 -10px 25px rgba(0,0,0,0.6)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>
            {selectedSeats.length === 0 ? 'No seats selected' : `${selectedSeats.length} seat(s) selected`}
          </span>
          <strong style={{ fontSize: '1.05rem', color: '#F59E0B' }}>₹{grandTotal}</strong>
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => {
              if (selectedSeats.length === 0) {
                alert('Please tap on seats to select them before proceeding.');
              } else {
                const el = document.getElementById('checkout-summary-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                handleBooking();
              }
            }}
            disabled={loading || locking || selectedSeats.length === 0}
            className="primary-btn"
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              background: selectedSeats.length === 0 ? '#334155' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
            }}
          >
            {locking ? 'Locking...' : loading ? 'Booking...' : `Pay ₹${grandTotal}`}
          </button>
        ) : (
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="primary-btn"
            style={{ padding: '10px 16px', fontSize: '0.85rem' }}
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
