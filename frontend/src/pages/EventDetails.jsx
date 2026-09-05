import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Minus, Plus, ArrowLeft, Check, Ticket, ShieldCheck, CreditCard } from 'lucide-react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getFallbackImage } from '../components/EventCard';
import CashfreePaymentModal from '../components/CashfreePaymentModal';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Cashfree PG modal states
  const [cashfreeOrder, setCashfreeOrder] = useState(null);
  const [showCashfreeModal, setShowCashfreeModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAPI(`/events/${id}`)
      .then((res) => {
        const ev = res.data || res;
        setEvent(ev);
        const tiers = ev.tiers || ev.ticketTiers || [];
        setQty(Object.fromEntries(tiers.map((t) => [t.name || t.tierName, 0])));
      })
      .catch((err) => {
        console.error('Failed to load event details:', err);
        setEvent(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#737373' }} className="font-mono-x">
        Loading Event Experience...
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#FFFFFF', padding: '24px' }}>
        <p className="font-mono-x" style={{ color: '#FF4500', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
          404 · Not Found
        </p>
        <h2 className="heading" style={{ fontSize: '2rem', marginBottom: '16px' }}>Event Not Found</h2>
        <p style={{ color: '#A1A1A1', fontSize: '15px', maxWidth: '440px', textAlign: 'center', marginBottom: '24px' }}>
          This event may have been updated, unpublished, or does not exist in our active schedule.
        </p>
        <Link to="/events" style={{ background: '#FF4500', color: '#050505', padding: '12px 28px', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'none', letterSpacing: '0.04em' }}>
          Browse Live Events
        </Link>
      </div>
    );
  }

  const rawTiers = event.tiers || event.ticketTiers || [];
  const tiers = rawTiers.map((t) => ({
    name: t.name || t.tierName || 'Standard',
    price: Number(t.price) || 999,
    capacity: Number(t.capacity || t.totalSeats || 100),
    sold: Number(t.sold || (t.totalSeats ? t.totalSeats - (t.availableSeats || 0) : 0))
  }));

  const setTierQty = (tierName, delta) => {
    const tier = tiers.find((t) => t.name === tierName);
    const maxAvailable = tier ? Math.max(0, tier.capacity - tier.sold) : 10;
    setQty((prev) => ({
      ...prev,
      [tierName]: Math.max(0, Math.min(maxAvailable, (prev[tierName] || 0) + delta))
    }));
  };

  const selectedItems = tiers.filter((t) => (qty[t.name] || 0) > 0).map((t) => ({
    tierName: t.name,
    quantity: qty[t.name],
    price: t.price
  }));

  const totalAmount = selectedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const totalTickets = selectedItems.reduce((acc, it) => acc + it.quantity, 0);

  // Handle Booking & Payment Gateway trigger
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return alert('Please enter your name and email.');
    setSubmitting(true);

    try {
      // 1. Try Cashfree Payment Gateway Checkout
      const returnUrl = `${window.location.origin}${window.location.pathname}?order_id={order_id}`;
      const cfRes = await fetchAPI('/booking/cashfree/create-order', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event._id,
          eventTitle: event.title,
          items: selectedItems,
          total: totalAmount,
          userName: name,
          userEmail: email,
          userPhone: phone || '9999999999',
          returnUrl
        })
      });

      if (cfRes.success && cfRes.orderId && cfRes.paymentSessionId) {
        setCashfreeOrder({
          ...cfRes,
          eventTitle: event.title,
          userName: name,
          userEmail: email,
          userPhone: phone || '9999999999',
          selectedSeats: cfRes.selectedSeats || []
        });
        setShowCashfreeModal(true);
        return;
      }

      // 2. Fallback to direct reservation if gateway is in maintenance or bypass mode
      const res = await fetchAPI('/booking/reserve', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event._id,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || '9999999999',
          items: selectedItems,
          total: totalAmount
        })
      });

      setConfirmation({
        reference: res.data?.reference || res.data?.bookingId,
        eventTitle: event.title,
        customerEmail: email,
        total: totalAmount,
        items: selectedItems
      });
    } catch (err) {
      alert(err.message || 'Unable to initiate booking checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Payment Success Handler for Cashfree
  const handleCashfreePaymentSuccess = async (paymentPayload) => {
    setVerifyingPayment(true);
    try {
      const verifyRes = await fetchAPI('/booking/cashfree/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: paymentPayload.orderId,
          eventId: event._id,
          eventTitle: event.title,
          selectedSeats: cashfreeOrder?.selectedSeats || [],
          userName: name,
          userEmail: email,
          userPhone: phone || '9999999999',
          paymentMethod: paymentPayload.paymentMethod || 'Cashfree PG'
        })
      });

      if (verifyRes.success && verifyRes.booking) {
        setShowCashfreeModal(false);
        setCashfreeOrder(null);
        setConfirmation({
          reference: verifyRes.booking.bookingId,
          eventTitle: event.title,
          customerEmail: email,
          total: totalAmount,
          items: selectedItems
        });
      } else {
        alert(verifyRes.message || 'Payment verification failed with Cashfree.');
      }
    } catch (err) {
      alert(err.message || 'An error occurred during payment verification.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleCashfreeCancel = () => {
    setShowCashfreeModal(false);
    setCashfreeOrder(null);
  };

  let eventBanner = event.bannerImage || event.image;
  if (!eventBanner || eventBanner.includes('event1.jpg')) {
    eventBanner = getFallbackImage(event.category, event.title);
  }
  const cityName = event.city || event.venue?.city || 'Mumbai';
  const venueName = event.venue?.name || event.venue || 'Main Arena';

  return (
    <div style={{ background: '#050505', color: '#FFFFFF', minHeight: '100vh', paddingBottom: '96px' }}>
      {/* 1. TOP NAVIGATION / BREADCRUMB */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px clamp(16px, 4vw, 24px) 16px' }}>
        <Link
          to="/events"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#A1A1A1',
            fontSize: '13px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4500')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#A1A1A1')}
        >
          <ArrowLeft size={16} /> All Events
        </Link>
      </div>

      {/* 2. EVENT BANNER FRAME (FULL BLURRED GRADIENT COMBINATION BACKGROUND) */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 24px)' }}>
        <div
          style={{
            position: 'relative',
            height: 'clamp(260px, 48vh, 520px)',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'radial-gradient(circle at 15% 15%, rgba(255, 69, 0, 0.4) 0%, transparent 55%), radial-gradient(circle at 85% 85%, rgba(138, 43, 226, 0.4) 0%, transparent 60%), linear-gradient(135deg, #180B22 0%, #0D0F18 50%, #150A08 100%)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)'
          }}
        >
          {/* Ambient heavily blurred banner colors filling the container */}
          <img
            src={eventBanner}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackImage(event.category, event.title);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(35px) saturate(2.2) brightness(0.75)',
              transform: 'scale(1.25)',
              pointerEvents: 'none',
              opacity: 0.92
            }}
          />

          {/* Multi-gradient color combination overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(5,5,5,0.45) 85%), linear-gradient(135deg, rgba(255, 69, 0, 0.2) 0%, rgba(147, 51, 234, 0.18) 50%, rgba(0, 0, 0, 0.3) 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Full uncropped sharp banner image fitting completely without any cropping */}
          <img
            src={eventBanner}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackImage(event.category, event.title);
            }}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 2,
              filter: 'drop-shadow(0 12px 36px rgba(0, 0, 0, 0.6))'
            }}
          />
        </div>
      </div>

      {/* 3. RESPONSIVE EVENT TITLE & BADGE DOWNSIDE THE BANNER */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'clamp(28px, 4vw, 40px) clamp(16px, 4vw, 24px) 0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span
            className="font-mono-x"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#FF4500',
              background: 'rgba(255, 69, 0, 0.12)',
              border: '1px solid rgba(255, 69, 0, 0.3)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 700
            }}
          >
            ✦ {event.category || 'Live Spectacle'}
          </span>
          <span
            className="font-mono-x"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#10B981',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '6px 12px',
              borderRadius: '999px'
            }}
          >
            ● Certified Production
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="heading"
          style={{
            fontFamily: "'Cabinet Grotesk', -apple-system, sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)',
            textTransform: 'uppercase',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            color: '#FFFFFF',
            margin: 0,
            maxWidth: '1100px'
          }}
        >
          {event.title}
        </motion.h1>
      </div>

      {/* Main Content & Ticket Selector Grid */}
      <style>{`
        .event-details-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 48px;
        }
        @media (max-width: 900px) {
          .event-details-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .event-details-grid > div {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      <div
        className="event-details-grid"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 36px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)'
        }}
      >
        {/* Left Column: Synopsis & Metadata */}
        <div>
          {/* Quick Meta Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '32px',
              marginBottom: '36px'
            }}
          >
            <div>
              <p className="font-mono-x" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#737373', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Calendar size={13} color="#FF4500" /> Date
              </p>
              <p className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {formatDate(event.eventDate || event.date)}
              </p>
            </div>

            <div>
              <p className="font-mono-x" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#737373', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Clock size={13} color="#FF4500" /> Showtime
              </p>
              <p className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {event.startTime || '07:00 PM'} {event.endTime ? `— ${event.endTime}` : ''}
              </p>
            </div>

            <div>
              <p className="font-mono-x" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#737373', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <MapPin size={13} color="#FF4500" /> Venue & City
              </p>
              <p className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {venueName}, {cityName}
              </p>
            </div>
          </div>

          <h2
            className="font-display"
            style={{
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: '1.75rem',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
              color: '#FFFFFF'
            }}
          >
            Event Synopsis
          </h2>
          <p style={{ color: '#A1A1A1', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '40px' }}>
            {event.description}
          </p>

          {/* Organizer / Safety note */}
          <div
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#121212',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <ShieldCheck size={28} color="#FF4500" />
            <div>
              <p className="font-display" style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>
                Official Vana Entry Verification
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#737373' }}>
                Tickets are digitally watermarked with encrypted QR codes. Guaranteed authentic entry.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Ticket Selector Box */}
        <div>
          <div
            style={{
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#121212',
              padding: '32px',
              position: 'sticky',
              top: '96px',
              borderRadius: '0px'
            }}
          >
            <h3
              className="font-display"
              style={{
                fontFamily: "'Cabinet Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: '1.35rem',
                textTransform: 'uppercase',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#FFFFFF'
              }}
            >
              <Ticket size={20} color="#FF4500" /> Select Tickets
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {tiers.map((t) => {
                const remaining = t.capacity - t.sold;
                const isSoldOut = remaining <= 0;
                const currentCount = qty[t.name] || 0;

                return (
                  <div
                    key={t.name}
                    data-testid={`tier-${t.name}`}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingBottom: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#FFFFFF' }}>
                          {t.name}
                        </p>
                        <p
                          className="font-display"
                          style={{
                            margin: '4px 0 0 0',
                            fontSize: '1.35rem',
                            fontWeight: 900,
                            color: '#FF4500'
                          }}
                        >
                          ₹{t.price}
                        </p>
                        <p
                          className="font-mono-x"
                          style={{
                            margin: '4px 0 0 0',
                            fontSize: '11px',
                            color: isSoldOut ? '#EF4444' : '#737373',
                            fontFamily: "'JetBrains Mono', monospace"
                          }}
                        >
                          {isSoldOut ? 'Sold Out' : `${remaining} Available`}
                        </p>
                      </div>

                      {/* Quantity Buttons - Mobile Optimized 42px Touch Targets */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setTierQty(t.name, -1)}
                          disabled={isSoldOut || currentCount === 0}
                          aria-label={`Decrease ${t.name} quantity`}
                          style={{
                            width: '42px',
                            height: '42px',
                            minWidth: '42px',
                            minHeight: '42px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            background: '#050505',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: currentCount > 0 ? 'pointer' : 'default',
                            opacity: currentCount > 0 ? 1 : 0.3,
                            borderRadius: '0px'
                          }}
                        >
                          <Minus size={16} />
                        </button>

                        <span
                          className="font-mono-x"
                          style={{
                            width: '28px',
                            textAlign: 'center',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            fontSize: '15px',
                            color: '#FFFFFF'
                          }}
                        >
                          {currentCount}
                        </span>

                        <button
                          onClick={() => setTierQty(t.name, 1)}
                          disabled={isSoldOut || currentCount >= remaining}
                          aria-label={`Increase ${t.name} quantity`}
                          style={{
                            width: '42px',
                            height: '42px',
                            minWidth: '42px',
                            minHeight: '42px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            background: '#050505',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: !isSoldOut ? 'pointer' : 'default',
                            opacity: !isSoldOut ? 1 : 0.3,
                            borderRadius: '0px'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '24px',
                marginBottom: '20px'
              }}
            >
              <span className="font-mono-x" style={{ color: '#737373', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Payable
              </span>
              <span
                className="font-display"
                style={{
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.75rem',
                  color: '#FF4500'
                }}
              >
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Checkout Trigger */}
            <button
              disabled={totalTickets === 0}
              onClick={() => setCheckoutOpen(true)}
              style={{
                width: '100%',
                padding: '16px',
                background: totalTickets > 0 ? '#FF4500' : '#262626',
                color: totalTickets > 0 ? '#050505' : '#737373',
                fontWeight: 900,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: 'none',
                cursor: totalTickets > 0 ? 'pointer' : 'not-allowed',
                borderRadius: '0px',
                transition: 'opacity 0.2s ease'
              }}
            >
              {totalTickets === 0 ? 'Select Tickets Above' : `Reserve ${totalTickets} Pass${totalTickets > 1 ? 'es' : ''}`}
            </button>

            {/* Interactive Seating Pass Alternative */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link
                to={`/book-ticket/${event._id}`}
                style={{
                  fontSize: '12px',
                  color: '#A1A1A1',
                  textDecoration: 'underline',
                  letterSpacing: '0.02em'
                }}
              >
                Or select specific numbered seats →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal Dialog */}
      {checkoutOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              maxWidth: '480px',
              width: '100%',
              padding: '36px',
              position: 'relative'
            }}
          >
            <button
              onClick={() => {
                setCheckoutOpen(false);
                setConfirmation(null);
              }}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'transparent',
                border: 'none',
                color: '#A1A1A1',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ✕
            </button>

            {confirmation ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    background: '#FF4500',
                    color: '#050505',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto'
                  }}
                >
                  <Check size={32} strokeWidth={3} />
                </div>

                <h3 className="heading" style={{ fontSize: '1.75rem', marginBottom: '8px', color: '#FFFFFF' }}>
                  Pass Reserved
                </h3>
                <p style={{ color: '#A1A1A1', fontSize: '13px', marginBottom: '24px' }}>
                  Confirmation sent to {confirmation.customerEmail}. Valid pass held in system.
                </p>

                <div
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#0A0A0A',
                    padding: '20px',
                    textAlign: 'left',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="font-mono-x" style={{ fontSize: '11px', color: '#737373' }}>REFERENCE</span>
                    <span className="font-mono-x" style={{ fontSize: '13px', fontWeight: 700, color: '#FF4500' }}>{confirmation.reference}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#A1A1A1' }}>Event</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{confirmation.eventTitle}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#A1A1A1' }}>Total Paid</span>
                    <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FF4500' }}>₹{confirmation.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px',
                    background: '#FF4500',
                    color: '#050505',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    textDecoration: 'none',
                    letterSpacing: '0.05em'
                  }}
                >
                  View In My Dashboard
                </Link>
              </div>
            ) : (
              <div>
                <h3 className="heading" style={{ fontSize: '1.75rem', marginBottom: '20px', color: '#FFFFFF' }}>
                  Confirm Reservation
                </h3>

                {/* Items Summary */}
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px', marginBottom: '20px' }}>
                  {selectedItems.map((item) => (
                    <div key={item.tierName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#FFFFFF' }}>{item.tierName} × {item.quantity}</span>
                      <span style={{ color: '#FF4500', fontWeight: 700 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '8px', fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: '#FF4500', fontSize: '1.1rem' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="font-mono-x" style={{ fontSize: '11px', color: '#737373', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your legal name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#050505',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label className="font-mono-x" style={{ fontSize: '11px', color: '#737373', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#050505',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label className="font-mono-x" style={{ fontSize: '11px', color: '#737373', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#050505',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: '#FF4500',
                      color: '#050505',
                      fontWeight: 900,
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <CreditCard size={18} />
                    {submitting ? 'Initiating Payment Checkout...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} & Confirm Pass`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cashfree PG Modal */}
      {showCashfreeModal && cashfreeOrder && (
        <CashfreePaymentModal
          orderData={cashfreeOrder}
          onPaymentSuccess={handleCashfreePaymentSuccess}
          onCancel={handleCashfreeCancel}
          verifying={verifyingPayment}
        />
      )}
    </div>
  );
}
