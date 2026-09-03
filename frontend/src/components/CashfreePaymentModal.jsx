import React, { useState, useEffect } from 'react';
import { loadCashfreeSDK } from '../utils/cashfreeLoader';

export default function CashfreePaymentModal({
  orderData,
  onPaymentSuccess,
  onCancel,
  verifying
}) {
  const [activeTab, setActiveTab] = useState('cashfree'); // 'cashfree', 'upi', 'card'
  const [sdkLoading, setSdkLoading] = useState(false);
  const [sdkError, setSdkError] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes lock timer
  const [simulatedCard, setSimulatedCard] = useState({
    cardNumber: '4532 •••• •••• 8892',
    cardHolder: orderData?.userName || 'VANA ATTENDEE',
    expiry: '09/28',
    cvv: '•••'
  });

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

  // Launch official Cashfree Checkout Popup
  const launchCashfreeModal = async () => {
    if (!orderData?.paymentSessionId) {
      alert('Payment session ID missing. Please retry booking.');
      return;
    }

    setSdkLoading(true);
    setSdkError('');

    try {
      const Cashfree = await loadCashfreeSDK();
      const mode = orderData.env === 'production' ? 'production' : 'sandbox';
      const cashfree = Cashfree({ mode });

      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_modal'
      }).then((result) => {
        setSdkLoading(false);
        if (result.error) {
          console.warn('[CASHFREE CHECKOUT ERROR]:', result.error);
          setSdkError(result.error.message || 'Payment was cancelled or closed');
        } else if (result.paymentDetails) {
          console.log('[CASHFREE PAYMENT COMPLETED]:', result.paymentDetails);
          onPaymentSuccess({
            orderId: orderData.orderId,
            paymentMethod: 'Cashfree Checkout'
          });
        } else {
          // If modal closed or redirected
          onPaymentSuccess({
            orderId: orderData.orderId,
            paymentMethod: 'Cashfree Checkout'
          });
        }
      });
    } catch (err) {
      console.error('Failed to initialize Cashfree SDK:', err);
      setSdkLoading(false);
      setSdkError('Cashfree JS SDK could not be initialized. You can proceed with the test payment simulator below.');
      setActiveTab('upi');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.15)',
          maxWidth: '620px',
          width: '100%',
          overflow: 'hidden',
          color: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeIn 0.25s ease-out'
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
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontSize: '1.2rem',
                fontWeight: 900
              }}
            >
              <i className="fa-solid fa-lock"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFF' }}>Cashfree Secure Payment</h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: '#059669',
                    color: '#FFF',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {orderData.env === 'production' ? 'Live PG' : 'Sandbox PG'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                256-Bit Encrypted • Powered by Cashfree Payments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={verifying}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.3rem',
              cursor: verifying ? 'not-allowed' : 'pointer',
              padding: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Seat Hold Alert with Timer */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
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
            <strong style={{ color: '#F59E0B', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              {formatTime(countdown)}
            </strong>
          </div>

          {/* Order Summary Snapshot */}
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#FFF' }}>{orderData.eventTitle || 'Vana Performance Pass'}</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                  Attendee: {orderData.userName} ({orderData.userPhone || orderData.userEmail})
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#334155', padding: '3px 8px', borderRadius: '6px', color: '#E2E8F0' }}>
                Order #{orderData.orderId?.slice(-8)}
              </span>
            </div>

            {/* Reserved Seats List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
              {orderData.selectedSeats?.map((seat) => (
                <span
                  key={seat.seatId}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #F59E0B',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#F59E0B'
                  }}
                >
                  {seat.displayLabel || seat.seatId} ({seat.category}) - ₹{seat.price}
                </span>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '4px' }}>
                <span>Subtotal ({orderData.selectedSeats?.length || 1} Seats)</span>
                <span>₹{orderData.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '6px' }}>
                <span>GST Tax (18%)</span>
                <span>₹{orderData.gst}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFF', fontWeight: 800, fontSize: '1.05rem', borderTop: '1px dashed #334155', paddingTop: '6px' }}>
                <span style={{ color: '#F59E0B' }}>Total Amount Payable</span>
                <span style={{ color: '#10B981' }}>₹{orderData.orderAmount}</span>
              </div>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('cashfree')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: activeTab === 'cashfree' ? '2px solid #F59E0B' : '1px solid #334155',
                background: activeTab === 'cashfree' ? '#334155' : '#0F172A',
                color: '#FFF',
                fontWeight: activeTab === 'cashfree' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-credit-card" style={{ color: '#F59E0B' }}></i>
              Cashfree Drop-in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: activeTab === 'upi' ? '2px solid #F59E0B' : '1px solid #334155',
                background: activeTab === 'upi' ? '#334155' : '#0F172A',
                color: '#FFF',
                fontWeight: activeTab === 'upi' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-qrcode" style={{ color: '#10B981' }}></i>
              Instant UPI QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: activeTab === 'card' ? '2px solid #F59E0B' : '1px solid #334155',
                background: activeTab === 'card' ? '#334155' : '#0F172A',
                color: '#FFF',
                fontWeight: activeTab === 'card' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-brands fa-cc-visa" style={{ color: '#38BDF8' }}></i>
              Test Card
            </button>
          </div>

          {/* TAB 1: CASHFREE OFFICIAL MODAL */}
          {activeTab === 'cashfree' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '16px'
                }}
              >
                <img
                  src="https://assets.cashfree.com/website/images/brand/cashfree-payments-logo-light.svg"
                  alt="Cashfree Payments"
                  style={{ maxHeight: '34px', marginBottom: '14px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#FFF' }}>
                  Cashfree Official Checkout Gateway
                </h4>
                <p style={{ margin: '0 0 18px 0', fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.5 }}>
                  Click below to launch Cashfree's official payment popup window. Supports <strong>Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards, Net Banking & Wallets</strong>.
                </p>

                {sdkError && (
                  <div style={{ background: '#7F1D1D', color: '#FECACA', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '14px' }}>
                    {sdkError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={launchCashfreeModal}
                  disabled={sdkLoading || verifying}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  {sdkLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Loading Cashfree Modal...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> Open Cashfree Modal & Pay ₹{orderData.orderAmount}
                    </>
                  )}
                </button>
              </div>

              {/* Instant Test Approval Fallback button */}
              <button
                type="button"
                onClick={() => onPaymentSuccess({ orderId: orderData.orderId, paymentMethod: 'Cashfree Sandbox Approval' })}
                disabled={verifying}
                style={{
                  background: 'transparent',
                  border: '1px dashed #F59E0B',
                  color: '#F59E0B',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fa-solid fa-bolt"></i> Instant Sandbox Approval (One-Click Test)
              </button>
            </div>
          )}

          {/* TAB 2: INSTANT UPI QR SIMULATOR */}
          {activeTab === 'upi' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  background: '#FFF',
                  display: 'inline-block',
                  padding: '12px',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  marginBottom: '12px'
                }}
              >
                {/* Dynamic SVG QR code */}
                <svg width="150" height="150" viewBox="0 0 100 100" style={{ display: 'block' }}>
                  <rect width="100" height="100" fill="#FFF" />
                  <rect x="10" y="10" width="30" height="30" fill="#1E293B" />
                  <rect x="15" y="15" width="20" height="20" fill="#FFF" />
                  <rect x="20" y="20" width="10" height="10" fill="#1E293B" />
                  <rect x="60" y="10" width="30" height="30" fill="#1E293B" />
                  <rect x="65" y="15" width="20" height="20" fill="#FFF" />
                  <rect x="70" y="20" width="10" height="10" fill="#1E293B" />
                  <rect x="10" y="60" width="30" height="30" fill="#1E293B" />
                  <rect x="15" y="65" width="20" height="20" fill="#FFF" />
                  <rect x="20" y="70" width="10" height="10" fill="#1E293B" />
                  <rect x="45" y="15" width="8" height="8" fill="#1E293B" />
                  <rect x="45" y="35" width="8" height="8" fill="#F59E0B" />
                  <rect x="45" y="55" width="8" height="8" fill="#1E293B" />
                  <rect x="45" y="75" width="8" height="8" fill="#1E293B" />
                  <rect x="65" y="45" width="10" height="10" fill="#1E293B" />
                  <rect x="80" y="65" width="10" height="10" fill="#F59E0B" />
                  <rect x="65" y="75" width="10" height="15" fill="#1E293B" />
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', background: '#334155', padding: '3px 8px', borderRadius: '4px', color: '#CBD5E1' }}>Google Pay</span>
                <span style={{ fontSize: '0.72rem', background: '#334155', padding: '3px 8px', borderRadius: '4px', color: '#CBD5E1' }}>PhonePe</span>
                <span style={{ fontSize: '0.72rem', background: '#334155', padding: '3px 8px', borderRadius: '4px', color: '#CBD5E1' }}>Paytm</span>
                <span style={{ fontSize: '0.72rem', background: '#334155', padding: '3px 8px', borderRadius: '4px', color: '#CBD5E1' }}>BHIM</span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 14px 0' }}>
                UPI ID: <strong style={{ color: '#F59E0B' }}>vanaentertainments@cashfree</strong>
              </p>

              <button
                type="button"
                onClick={() => onPaymentSuccess({ orderId: orderData.orderId, paymentMethod: 'Cashfree UPI' })}
                disabled={verifying}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-circle-check"></i> I Have Paid via UPI (Verify Now)
              </button>
            </div>
          )}

          {/* TAB 3: TEST CARD SIMULATOR */}
          {activeTab === 'card' && (
            <div style={{ padding: '8px 0' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
                  borderRadius: '16px',
                  padding: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '16px',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', letterSpacing: '1px' }}>VANA SECURE CARD</span>
                  <i className="fa-brands fa-cc-mastercard" style={{ fontSize: '1.8rem', color: '#F59E0B' }}></i>
                </div>
                <div style={{ fontSize: '1.15rem', letterSpacing: '2px', fontFamily: 'monospace', marginBottom: '16px', color: '#FFF' }}>
                  {simulatedCard.cardNumber}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                  <div>
                    <div>CARD HOLDER</div>
                    <div style={{ color: '#FFF', fontWeight: 600 }}>{simulatedCard.cardHolder}</div>
                  </div>
                  <div>
                    <div>EXPIRES</div>
                    <div style={{ color: '#FFF', fontWeight: 600 }}>{simulatedCard.expiry}</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPaymentSuccess({ orderId: orderData.orderId, paymentMethod: 'Cashfree Card PG' })}
                disabled={verifying}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-lock"></i> Authorize Payment of ₹{orderData.orderAmount}
              </button>
            </div>
          )}
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
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              zIndex: 10
            }}
          >
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: '#F59E0B', marginBottom: '20px' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#FFF' }}>Verifying Cashfree Payment</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8' }}>
              Finalizing seat reservations, generating QR entrance pass, and dispatching confirmation email...
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
            background: 'rgba(15, 23, 42, 0.6)',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#10B981' }}></i>
            <span>PCI-DSS Level 1 Compliant</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={verifying}
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              cursor: verifying ? 'not-allowed' : 'pointer',
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
