import React, { useState, useEffect } from 'react';
import { loadCashfreeSDK } from '../utils/cashfreeLoader';

/**
 * CashfreePaymentModal Component
 * Exclusive Payment Gateway Modal for Vana Entertainments.
 * Displays authentic venue seat pricing breakdown and connects directly to Cashfree PG.
 */
export default function CashfreePaymentModal({
  orderData,
  onPaymentSuccess,
  onCancel,
  verifying
}) {
  const [sdkLoading, setSdkLoading] = useState(false);
  const [sdkError, setSdkError] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes seat lock countdown

  // Countdown timer for 10-minute seat lock
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Launch Cashfree Payment Checkout
  const handleCashfreeCheckout = async () => {
    if (!orderData?.paymentSessionId) {
      alert('Cashfree payment session is missing. Please close this modal and retry.');
      return;
    }

    setSdkLoading(true);
    setSdkError('');

    try {
      const Cashfree = await loadCashfreeSDK();
      const mode = orderData.env === 'production' ? 'production' : 'sandbox';
      const cashfree = Cashfree({ mode });

      // Use '_modal' for slick in-page payment popup (works seamlessly in sandbox)
      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_modal'
      }).then((result) => {
        setSdkLoading(false);
        if (result.error) {
          console.warn('[CASHFREE CHECKOUT ERROR]:', result.error);
          setSdkError(result.error.message || 'Payment window closed or cancelled.');
        } else if (result.paymentDetails) {
          console.log('[CASHFREE PAYMENT SUCCESS]:', result.paymentDetails);
          onPaymentSuccess({
            orderId: orderData.orderId,
            paymentMethod: result.paymentDetails?.payment_group || 'Cashfree PG'
          });
        } else if (result.redirect) {
          console.log('[CASHFREE REDIRECT]: Redirection initiated to Cashfree payment page');
        } else {
          console.log('[CASHFREE CHECKOUT IN PROGRESS]:', result);
        }
      }).catch((err) => {
        console.error('[CASHFREE CHECKOUT PROMISE ERROR]:', err);
        setSdkLoading(false);
        setSdkError(err.message || 'Failed to complete Cashfree checkout.');
      });
    } catch (err) {
      console.error('[CASHFREE INITIALIZATION ERROR]:', err);
      setSdkLoading(false);
      setSdkError(`Cashfree Gateway SDK Notice: ${err.message}`);
    }
  };

  // Automatically trigger Cashfree payment modal upon mount
  useEffect(() => {
    if (orderData?.paymentSessionId) {
      const timer = setTimeout(() => {
        handleCashfreeCheckout();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [orderData?.paymentSessionId]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #161B26 0%, #0B0E14 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.12)',
          maxWidth: '580px',
          width: '100%',
          overflow: 'hidden',
          color: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeIn 0.25s ease-out',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(11, 14, 20, 0.8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontSize: '1.25rem',
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFF', fontWeight: 800 }}>
                  Cashfree Payment Gateway
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: orderData.env === 'production' ? '#059669' : '#D97706',
                    color: '#FFF',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {orderData.env === 'production' ? 'Live PG' : 'Sandbox PG'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                Official Exclusive Gateway • 256-Bit SSL Encrypted
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={verifying || sdkLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.3rem',
              cursor: verifying || sdkLoading ? 'not-allowed' : 'pointer',
              padding: '6px',
              transition: 'color 0.2s ease'
            }}
            title="Cancel and release seats"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Seat Hold Alert with Live Timer */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem'
            }}
          >
            <span style={{ color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-stopwatch"></i> Seats held for payment checkout:
            </span>
            <strong style={{ color: '#F59E0B', fontFamily: 'monospace', fontSize: '0.98rem' }}>
              {formatTime(countdown)}
            </strong>
          </div>

          {/* Event & Attendee Info */}
          <div
            style={{
              background: '#0B0E14',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <strong style={{ fontSize: '1rem', color: '#F8FAFC' }}>
                  {orderData.eventTitle || 'Vana Live Event'}
                </strong>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                  Attendee: <span style={{ color: '#E2E8F0' }}>{orderData.userName}</span> ({orderData.userPhone || orderData.userEmail})
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#1E293B', padding: '3px 8px', borderRadius: '6px', color: '#CBD5E1', fontFamily: 'monospace' }}>
                Order #{orderData.orderId?.slice(-8)}
              </span>
            </div>

            {/* Verified Venue Seats Pricing Breakdown */}
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
                <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i>
                Venue Reserved Seats ({orderData.selectedSeats?.length || 1})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {orderData.selectedSeats?.map((seat) => (
                  <span
                    key={seat.seatId}
                    style={{
                      background: '#161B26',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#F8FAFC',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Seat {seat.displayLabel || seat.seatId}</span>
                    <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>({seat.category})</span>
                    <span style={{ color: '#F59E0B' }}>₹{seat.price}</span>
                  </span>
                ))}
              </div>

              {/* Official Direct Venue Pricing Breakdown */}
              <div style={{ background: '#161B26', borderRadius: '10px', padding: '10px 14px', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '4px' }}>
                  <span>Reserved Seats ({orderData.selectedSeats?.length || 1})</span>
                  <span>₹{orderData.orderAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', fontWeight: 800, fontSize: '1.05rem', borderTop: '1px dashed rgba(255, 255, 255, 0.12)', paddingTop: '6px' }}>
                  <span style={{ color: '#F59E0B' }}>Total Payable (Official Price)</span>
                  <span style={{ color: '#10B981', fontSize: '1.15rem' }}>₹{orderData.orderAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cashfree Supported Methods Banner */}
          <div
            style={{
              background: '#0B0E14',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '14px 16px',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Supported on Cashfree PG:
              </span>
              <span style={{ fontSize: '0.72rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fa-solid fa-circle-check"></i> Instant Settlement
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['UPI (GPay / PhonePe / Paytm / BHIM)', 'Credit & Debit Cards', 'Net Banking (50+ Banks)', 'Wallets & CRED'].map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: '0.74rem',
                    background: '#1E293B',
                    color: '#E2E8F0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Error Message if SDK load fails */}
          {sdkError && (
            <div
              style={{
                background: 'rgba(153, 27, 27, 0.3)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FECACA',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                marginBottom: '16px',
                lineHeight: 1.4
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px', color: '#F87171' }}></i>
              {sdkError}
              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleCashfreeCheckout}
                  style={{
                    background: '#F59E0B',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i>
                  Retry Real-Time Checkout
                </button>
              </div>
            </div>
          )}

          {/* Exclusive Cashfree Checkout Button */}
          <button
            type="button"
            onClick={handleCashfreeCheckout}
            disabled={sdkLoading || verifying}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#000',
              border: 'none',
              borderRadius: '14px',
              padding: '15px 24px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: sdkLoading || verifying ? 'not-allowed' : 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            {sdkLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Connecting to Cashfree PG...
              </>
            ) : (
              <>
                <i className="fa-solid fa-lock"></i> Proceed to Pay ₹{orderData.orderAmount} with Cashfree
              </>
            )}
          </button>

          {/* Secondary Action: Check / Verify Payment Status */}
          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => onPaymentSuccess({ orderId: orderData.orderId, paymentMethod: 'Cashfree PG' })}
              disabled={verifying}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: verifying ? 'not-allowed' : 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                e.currentTarget.style.color = '#F59E0B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#CBD5E1';
              }}
            >
              <i className="fa-solid fa-arrows-rotate"></i> Paid in App / Bank? Verify Payment Status
            </button>
          </div>
        </div>

        {/* Verifying Overlay */}
        {verifying && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 14, 20, 0.96)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              zIndex: 20
            }}
          >
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3.2rem', color: '#F59E0B', marginBottom: '20px' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#FFF', fontWeight: 800 }}>
              Authenticating Cashfree Payment
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8', maxWidth: '380px', lineHeight: 1.5 }}>
              Validating payment with Cashfree PG API, permanently locking venue seats, and generating entrance pass QR code...
            </p>
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(11, 14, 20, 0.8)',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#10B981' }}></i>
            <span>PCI-DSS Level 1 Compliant • RBI Authorized</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={verifying || sdkLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              cursor: verifying || sdkLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              padding: '4px 8px'
            }}
          >
            Cancel & Release Seats
          </button>
        </div>
      </div>
    </div>
  );
}
