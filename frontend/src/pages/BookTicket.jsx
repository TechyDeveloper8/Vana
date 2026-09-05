import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InteractiveSeatMap from '../components/InteractiveSeatMap';
import CashfreePaymentModal from '../components/CashfreePaymentModal';

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

  // Cashfree PG States
  const [cashfreeOrder, setCashfreeOrder] = useState(null);
  const [showCashfreeModal, setShowCashfreeModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

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
    const rawEnv = (import.meta.env.VITE_API_URL || '').trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
    const socketUrl = rawEnv || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://vana-y29w.onrender.com');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinShowtime', { eventId: id, showtimeDate });
    });

    socket.on('seatStatusChanged', (payload) => {
      if (!payload) return;
      setAvailabilityMap((prevMap) => {
        const updated = { ...prevMap };

        // 1. Single seat object format: { seatId, status, lockedBy }
        if (payload.seatId && updated[payload.seatId]) {
          updated[payload.seatId] = {
            ...updated[payload.seatId],
            status: payload.status,
            lockedBy: payload.lockedBy
          };
        }

        // 2. Array of populated seat objects: { seats: [...], action, lockedBy }
        if (Array.isArray(payload.seats)) {
          payload.seats.forEach((seat) => {
            if (seat && seat.seatId && updated[seat.seatId]) {
              const seatStatus = seat.status || (payload.action === 'lock' ? 'Temporarily Locked' : payload.action === 'booked' ? 'Booked' : 'Available');
              updated[seat.seatId] = {
                ...updated[seat.seatId],
                ...seat,
                status: seatStatus
              };
            }
          });
        } else if (Array.isArray(payload.seatIds)) {
          // 3. Array of seat IDs: { seatIds: [...], action, lockedBy }
          const seatStatus = payload.action === 'lock' ? 'Temporarily Locked' : payload.action === 'booked' ? 'Booked' : 'Available';
          payload.seatIds.forEach((sid) => {
            if (updated[sid]) {
              updated[sid] = {
                ...updated[sid],
                status: seatStatus,
                lockedBy: payload.lockedBy || null
              };
            }
          });
        }

        return updated;
      });
    });

    return () => {
      socket.emit('leaveShowtime', { eventId: id, showtimeDate });
      socket.disconnect();
    };
  }, [id, showtimeDate]);

  // Check URL search params for return redirect from Cashfree PG (?order_id=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const returnOrderId = searchParams.get('order_id');
    if (returnOrderId && !bookingSuccess && !verifyingPayment) {
      console.log('[CASHFREE RETURN] Authenticating returned order:', returnOrderId);
      handleCashfreeSuccess({
        orderId: returnOrderId,
        paymentMethod: 'Cashfree PG'
      });
    }
  }, [location.search]);

  // Dynamic tier price calculation derived directly from venue seat availability / layout / event tiers
  const getTierPrice = (tierCategory) => {
    // 1. Check availabilityMap for any matching seat price
    const availSeats = Object.values(availabilityMap);
    const matchingAvailSeat = availSeats.find(
      (s) => s.category?.toLowerCase() === tierCategory.toLowerCase() && typeof s.price === 'number' && s.price > 0
    );
    if (matchingAvailSeat) return matchingAvailSeat.price;

    // 2. Check event.ticketTiers
    if (event?.ticketTiers && event.ticketTiers.length > 0) {
      const matchingTier = event.ticketTiers.find((t) => {
        const name = (t.tierName || '').toLowerCase();
        const cat = tierCategory.toLowerCase();
        if (cat === 'silver') return name.includes('silv') || name.includes('first');
        if (cat === 'platinum') return name.includes('plat');
        if (cat === 'gold') return name.includes('gold');
        if (cat.includes('vip')) return name.includes('vip');
        return name.includes(cat);
      });
      if (matchingTier && typeof matchingTier.price === 'number') return matchingTier.price;
    }

    // 3. Check layout.seats
    if (layout?.seats && layout.seats.length > 0) {
      const matchingLayoutSeat = layout.seats.find(
        (s) => s.category?.toLowerCase() === tierCategory.toLowerCase() && typeof s.price === 'number' && s.price > 0
      );
      if (matchingLayoutSeat) return matchingLayoutSeat.price;
    }

    // 4. Default fallbacks matching venue layout
    if (tierCategory === 'Silver') return 500;
    if (tierCategory === 'Gold') return 700;
    if (tierCategory === 'Platinum') return 1000;
    if (tierCategory === 'VIP Lounge' || tierCategory === 'VIP') return 1500;
    return 1000;
  };

  // Handle seat click on venue map with authentic venue seat pricing
  const handleSeatClick = (seat, price) => {
    const exists = selectedSeats.some((s) => s.seatId === seat.seatId);

    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatId !== seat.seatId));
    } else {
      const verifiedSeatPrice = (typeof price === 'number' && price > 0)
        ? price
        : (availabilityMap[seat.seatId]?.price || getTierPrice(seat.category));

      setSelectedSeats([
        ...selectedSeats,
        {
          seatId: seat.seatId,
          displayLabel: seat.displayLabel || seat.seatId,
          category: seat.category || 'Standard',
          price: verifiedSeatPrice
        }
      ]);
    }
  };

  // Price Calculation - Direct venue seat pricing is official price (no GST)
  const subtotal = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
  const grandTotal = subtotal;

  // Handle seat reservation and Cashfree payment checkout
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
      const returnUrl = `${window.location.origin}${window.location.pathname}?order_id={order_id}`;

      // Create Cashfree Payment Order (Backend automatically locks seats for 10 minutes)
      const orderRes = await fetchAPI('/booking/cashfree/create-order', {
        method: 'POST',
        body: JSON.stringify({
          eventId: id || event?._id,
          eventTitle: event?.title || 'Vana Live Performance',
          showtimeDate,
          selectedSeats,
          userName: name || user?.name || 'Guest User',
          userEmail: email || user?.email || 'guest@example.com',
          userPhone: phone || user?.phone || '9876543210',
          returnUrl
        })
      });

      if (orderRes.success && orderRes.orderId) {
        // Cache pending booking in sessionStorage in case browser redirects to bank gateway
        try {
          sessionStorage.setItem('pending_cf_booking', JSON.stringify({
            orderId: orderRes.orderId,
            eventId: id || event?._id,
            eventTitle: event?.title || 'Vana Live Performance',
            showtimeDate,
            selectedSeats,
            userName: name || user?.name || 'Guest User',
            userEmail: email || user?.email || 'guest@example.com',
            userPhone: phone || user?.phone || '9876543210'
          }));
        } catch (e) {
          console.warn('Session storage cache note:', e.message);
        }

        setCashfreeOrder({
          ...orderRes,
          eventTitle: event?.title || 'Vana Live Performance',
          userName: name || user?.name || 'Guest User',
          userEmail: email || user?.email || 'guest@example.com',
          userPhone: phone || user?.phone || '9876543210',
          selectedSeats
        });
        setShowCashfreeModal(true);
      } else {
        alert(orderRes.message || 'Failed to initiate Cashfree checkout session.');
      }
    } catch (err) {
      alert(err.message || 'An unexpected error occurred during Cashfree order initiation.');
    } finally {
      setLocking(false);
    }
  };

  // Handle successful Cashfree payment and finalize reservation
  const handleCashfreeSuccess = async (paymentPayload) => {
    setVerifyingPayment(true);
    try {
      const verifyRes = await fetchAPI('/booking/cashfree/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: paymentPayload.orderId,
          eventId: id || event?._id,
          eventTitle: event?.title || 'Vana Live Performance',
          showtimeDate,
          selectedSeats: cashfreeOrder?.selectedSeats || selectedSeats,
          userName: name || user?.name,
          userEmail: email || user?.email,
          userPhone: phone || user?.phone,
          paymentMethod: paymentPayload.paymentMethod || 'Cashfree PG'
        })
      });

      if (verifyRes.success && verifyRes.booking) {
        try { sessionStorage.removeItem('pending_cf_booking'); } catch (e) {}
        setShowCashfreeModal(false);
        setCashfreeOrder(null);
        setBookingSuccess(verifyRes.booking);
        setSelectedSeats([]);
      } else {
        alert(verifyRes.message || 'Payment verification failed with Cashfree.');
      }
    } catch (err) {
      alert(err.message || 'An error occurred during payment verification.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Check for return from Cashfree bank redirect with ?order_id=...
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderIdParam = searchParams.get('order_id');
    if (orderIdParam) {
      window.history.replaceState({}, '', window.location.pathname);
      let cached = {};
      try {
        const raw = sessionStorage.getItem('pending_cf_booking');
        if (raw) cached = JSON.parse(raw);
      } catch (e) {}

      handleCashfreeSuccess({
        orderId: orderIdParam,
        paymentMethod: 'Cashfree PG',
        ...cached
      });
    }
  }, []);

  // Handle modal cancellation and release locked seats
  const handleCashfreeCancel = async () => {
    if (cashfreeOrder && cashfreeOrder.selectedSeats && cashfreeOrder.selectedSeats.length > 0) {
      try {
        await fetchAPI('/booking/cashfree/cancel', {
          method: 'POST',
          body: JSON.stringify({
            eventId: id || event?._id,
            showtimeDate,
            seatIds: cashfreeOrder.selectedSeats.map((s) => s.seatId)
          })
        });
      } catch (err) {
        console.warn('Seat release error on cancel:', err);
      }
    }
    setShowCashfreeModal(false);
    setCashfreeOrder(null);
  };

  // Print / Save PDF Entrance Pass
  const handlePrintTicketPass = (booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups to print ticket');

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
            .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin: 8px 0; background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
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
            <div><span class="badge">✓ CONFIRMED & PAID</span></div>
            ${booking.qrCodeUrl ? `<img src="${booking.qrCodeUrl}" class="qr-img" />` : ''}
            <div class="details">
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
              <p><strong>Showtime Date:</strong> <span style="color: #2563EB; font-weight: bold;">${booking.showtimeDate && booking.showtimeDate !== 'Default' ? (isNaN(new Date(booking.showtimeDate)) ? booking.showtimeDate : new Date(booking.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })) : 'Main Show'}</span></p>
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
              <p style="margin-top: 8px; font-size: 12px; color: #4B5563;"><strong>Payment:</strong> ${booking.paymentGateway || 'Cashfree Payments'} (${booking.paymentMethod || 'Paid'})</p>
              ${booking.cashfreeOrderId ? `<p style="font-size: 12px; color: #64748B;"><strong>Cashfree Order ID:</strong> <code>${booking.cashfreeOrderId}</code></p>` : ''}
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

  // Booking Success Confirmation Screen
  if (bookingSuccess) {
    const formattedShow = bookingSuccess.showtimeDate && bookingSuccess.showtimeDate !== 'Default'
      ? (isNaN(new Date(bookingSuccess.showtimeDate)) ? bookingSuccess.showtimeDate : new Date(bookingSuccess.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      : 'Main Performance Show';

    return (
      <div style={{ padding: '96px 16px 80px 16px', textAlign: 'center', background: 'var(--bg-primary)', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '680px' }}>
          <div className="white-card" style={{ padding: '36px 28px', borderRadius: '24px', boxShadow: 'var(--shadow-hover)', border: '1px solid var(--gold-primary)' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '54px', color: 'var(--gold-accent)', marginBottom: '16px' }}></i>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-heading)' }}>Seated Pass Reservation Confirmed!</h2>
            <p style={{ color: 'var(--text-body)', marginBottom: '18px', fontSize: '0.95rem' }}>
              Your reserved seats have been permanently locked and verified. Entry pass QR code has been dispatched to <strong style={{ color: 'var(--gold-accent)' }}>{bookingSuccess.userEmail}</strong>.
            </p>

            {/* Cashfree Payment Gateway Verified Badge */}
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', padding: '10px 16px', borderRadius: '12px', marginBottom: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.3)', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <i className="fa-solid fa-shield-check" style={{ color: '#34D399', fontSize: '1.1rem' }}></i>
                Payment Processed via Cashfree Payments
              </span>
              <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#6EE7B7' }}>
                {bookingSuccess.paymentMethod || 'Cashfree PG'}
              </span>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#93C5FD', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'left' }}>
              <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: '1.3rem', color: '#60A5FA' }}></i>
              <span>Official QR entrance pass dispatched directly to <strong style={{ color: '#F8FAFC' }}>{bookingSuccess.userEmail}</strong></span>
            </div>

            <div style={{ background: '#0B0E17', padding: '20px', borderRadius: '18px', textAlign: 'left', marginBottom: '24px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                <div><span style={{ color: '#94A3B8' }}>Booking Ref:</span> <strong style={{ color: 'var(--gold-accent)' }}>{bookingSuccess.bookingId}</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Event:</span> <strong style={{ color: '#F8FAFC' }}>{bookingSuccess.eventTitle}</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Attendee:</span> <strong style={{ color: '#F8FAFC' }}>{bookingSuccess.userName}</strong> ({bookingSuccess.userPhone || 'N/A'})</div>
              </div>

              {/* DETAILED RESERVED SEATS BREAKDOWN */}
              <div style={{ background: '#141824', borderRadius: '14px', padding: '14px', border: '1px solid rgba(212, 175, 55, 0.25)', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gold-accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i>
                  Allocated Seats ({bookingSuccess.selectedSeats?.length || bookingSuccess.quantity} Seats Reserved):
                </div>

                {bookingSuccess.selectedSeats && bookingSuccess.selectedSeats.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {bookingSuccess.selectedSeats.map((seat) => (
                      <div
                        key={seat.seatId}
                        style={{
                          background: '#0B0E17',
                          border: '1px solid var(--gold-primary)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontWeight: 800, color: '#F8FAFC' }}>Seat {seat.displayLabel || seat.seatId}</span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-accent)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {seat.category || 'General'}
                        </span>
                        {seat.section && (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {seat.section}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, color: 'var(--gold-accent)', marginLeft: 'auto' }}>
                          ₹{seat.price || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--gold-accent)' }}>
                    {bookingSuccess.selectedSeats?.map((s) => s.displayLabel || s.seatId).join(', ') || 'General Admission'}
                  </p>
                )}
              </div>

              {/* Price & Payment Breakdown */}
              <div style={{ background: '#141824', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '4px' }}>
                  <span>Seats ({bookingSuccess.selectedSeats?.length || bookingSuccess.quantity || 1}):</span>
                  <span>₹{bookingSuccess.totalAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', paddingTop: '6px', fontWeight: 800, color: 'var(--gold-accent)', fontSize: '1rem' }}>
                  <span>Total Amount Paid:</span>
                  <span>₹{bookingSuccess.totalAmount}</span>
                </div>
                {bookingSuccess.cashfreeOrderId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.78rem', color: '#94A3B8' }}>
                    <span>Cashfree Order ID:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#CBD5E1' }}>{bookingSuccess.cashfreeOrderId}</span>
                  </div>
                )}
              </div>

              {bookingSuccess.qrCodeUrl && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <img src={bookingSuccess.qrCodeUrl} alt="QR Code Pass" style={{ width: '160px', borderRadius: '12px', border: '2px solid var(--gold-primary)', padding: '6px', background: '#FFF' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '8px' }}>Present QR pass at gate scanner for verification</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handlePrintTicketPass(bookingSuccess)}
                className="btn-outline"
                style={{ padding: '12px 22px', color: 'var(--gold-accent)', borderColor: 'rgba(212, 175, 55, 0.4)' }}
              >
                <i className="fa-solid fa-print" style={{ marginRight: '8px' }}></i> Print / Download Ticket Pass
              </button>
              <button onClick={() => navigate('/dashboard')} className="primary-btn" style={{ padding: '12px 22px' }}>
                <i className="fa-solid fa-gauge-high" style={{ marginRight: '8px' }}></i> View Dashboard Passes
              </button>
              <button onClick={() => navigate('/')} className="btn-outline" style={{ padding: '12px 18px', color: 'var(--text-body)', borderColor: 'rgba(255,255,255,0.2)' }}>
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', color: '#FFF', minHeight: '100vh', padding: '96px 16px 120px 16px' }}>
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
          <span style={{ fontSize: '0.8rem', color: 'var(--gold-accent)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>
            <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i> Interactive Venue Seating
          </span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-heading)', margin: '6px 0 0 0' }}>
            {event ? event.title : 'Live Performance Seated Pass Booking'}
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
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
              background: '#141824',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <strong style={{ color: 'var(--gold-accent)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-user-lock"></i> Account Authentication Required
              </strong>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                Sign in to complete seat reservation and store tickets in your user dashboard.
              </p>
            </div>
            <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="primary-btn" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
              Sign In Now
            </Link>
          </div>
        )}


        {/* Step 1: Choose Your Seating Plan */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 20px auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--gold-accent)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-layer-group"></i> Step 1: Choose Your Seating Plan Tier First:
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Tap a plan to focus map rows</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            {/* All Plans */}
            <button
              type="button"
              onClick={() => setActivePlan('All')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'All' ? '2px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.2)',
                background: activePlan === 'All' ? 'linear-gradient(135deg, #1E293B 0%, #0B0E17 100%)' : '#141824',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'All' ? '0 0 14px rgba(212, 175, 55, 0.35)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>🌐 All Plans</strong>
                <span style={{ fontSize: '0.68rem', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--gold-accent)' }}>Full View</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-light)' }}>View all rows & categories</p>
            </button>

            {/* Silver / First Floor Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('Silver')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'Silver' ? '2px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.2)',
                background: activePlan === 'Silver' ? 'linear-gradient(135deg, #334155 0%, #141824 100%)' : '#141824',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'Silver' ? '0 0 14px rgba(203, 213, 225, 0.35)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#CBD5E1' }}>🥈 Silver Plan</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-accent)' }}>₹{getTierPrice('Silver')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-light)' }}>Rows 1A–1H • First Floor Balcony</p>
            </button>

            {/* Gold Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('Gold')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'Gold' ? '2px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.2)',
                background: activePlan === 'Gold' ? 'linear-gradient(135deg, #1E293B 0%, #0B0E17 100%)' : '#141824',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'Gold' ? '0 0 14px rgba(212, 175, 55, 0.35)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--gold-accent)' }}>🥇 Gold Plan</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-accent)' }}>₹{getTierPrice('Gold')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-light)' }}>Rows F–Q • Main Auditorium</p>
            </button>

            {/* Platinum Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('Platinum')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'Platinum' ? '2px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.2)',
                background: activePlan === 'Platinum' ? 'linear-gradient(135deg, #1E293B 0%, #0B0E17 100%)' : '#141824',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'Platinum' ? '0 0 14px rgba(212, 175, 55, 0.35)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#E2E8F0' }}>💎 Platinum Plan</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-accent)' }}>₹{getTierPrice('Platinum')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-light)' }}>Rows A–E • Premium Front Stage</p>
            </button>

            {/* VIP Lounge Plan */}
            <button
              type="button"
              onClick={() => setActivePlan('VIP Lounge')}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: activePlan === 'VIP Lounge' ? '2px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.2)',
                background: activePlan === 'VIP Lounge' ? 'linear-gradient(135deg, #450A0A 0%, #141824 100%)' : '#141824',
                color: '#FFF',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: activePlan === 'VIP Lounge' ? '0 0 14px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#F87171' }}>👑 VIP Lounge</strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-accent)' }}>₹{getTierPrice('VIP Lounge')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-light)' }}>Units V1–V15 • Red Velvet Sofas</p>
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
              background: '#141824',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-hover)',
              width: '100%'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 16px 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '12px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-receipt" style={{ color: 'var(--gold-accent)' }}></i> Reservation Summary
            </h3>

            {/* Selected Seats List */}
            <div style={{ minHeight: '80px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
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
                        background: seat.category === 'VIP Lounge' ? '#450A0A' : '#0B0E17',
                        border: '1px solid var(--gold-primary)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{seat.displayLabel}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold-accent)' }}>₹{seat.price}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSeats(selectedSeats.filter((s) => s.seatId !== seat.seatId))}
                        style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '0.9rem', padding: 0, marginLeft: '4px' }}
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
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    disabled={!user}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '6px' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    disabled={!user}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '6px' }}>Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit phone"
                    disabled={!user}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Price Calculation Table */}
              <div style={{ background: '#0B0E17', padding: '16px', borderRadius: '14px', marginBottom: '20px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#CBD5E1' }}>
                  <span>Reserved Seats ({selectedSeats.length})</span>
                  <span>₹{grandTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', paddingTop: '8px', color: 'var(--gold-accent)', fontWeight: 800, fontSize: '1.1rem' }}>
                  <span>Official Total</span>
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
                    cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedSeats.length === 0 ? 0.6 : 1
                  }}
                >
                  {locking ? 'Holding Seats...' : loading ? 'Preparing Payment...' : `Pay ₹${grandTotal} with Cashfree`}
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
          background: 'rgba(10, 13, 20, 0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(212, 175, 55, 0.4)',
          padding: '10px 16px',
          display: 'none', // shown via CSS on mobile viewports (<900px)
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1000,
          boxShadow: '0 -10px 25px rgba(0,0,0,0.8)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>
            {selectedSeats.length === 0 ? 'No seats selected' : `${selectedSeats.length} seat(s) selected`}
          </span>
          <strong style={{ fontSize: '1.05rem', color: 'var(--gold-accent)' }}>₹{grandTotal}</strong>
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
              opacity: selectedSeats.length === 0 ? 0.6 : 1
            }}
          >
            {locking ? 'Holding...' : loading ? 'Loading...' : `Pay ₹${grandTotal} with Cashfree`}
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

      {/* CASHFREE PAYMENT GATEWAY MODAL */}
      {showCashfreeModal && cashfreeOrder && (
        <CashfreePaymentModal
          orderData={cashfreeOrder}
          onPaymentSuccess={handleCashfreeSuccess}
          onCancel={handleCashfreeCancel}
          verifying={verifyingPayment}
        />
      )}
    </div>
  );
}
