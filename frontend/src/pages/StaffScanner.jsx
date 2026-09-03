import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

// Web Audio API Sound Effects Synthesizer (No external MP3 files needed)
const playAudioFeedback = (type = 'SUCCESS') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'SUCCESS') {
      // High Chime Dual Tone (C5 -> E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);
    } else {
      // Low Error Sawtooth Buzz (G2 -> D2)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.setValueAtTime(110, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    // Silent fail if browser restricts audio autoplay before user gesture
  }
};

// Haptic Vibration Feedback
const triggerHaptic = (type = 'SUCCESS') => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    if (type === 'SUCCESS') {
      navigator.vibrate([100, 50, 100]);
    } else {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }
};

export default function StaffScanner() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventDetails, setEventDetails] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerError, setScannerError] = useState('');

  // Camera & Flashlight Controls
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'

  // Verification Result Overlay state: null or { status: 'SUCCESS'|'DUPLICATE'|'INVALID'|'WRONG_EVENT', ... }
  const [scanResult, setScanResult] = useState(null);

  // Shift scan history
  const [scanHistory, setScanHistory] = useState([]);
  const [pendingOfflineScans, setPendingOfflineScans] = useState([]);
  const html5QrCodeRef = useRef(null);

  // Synchronous locks to prevent rapid camera multi-frame execution (15 FPS duplicate prevention)
  const isVerifyingRef = useRef(false);
  const scanResultRef = useRef(null);
  const lastScannedRef = useRef({ code: '', time: 0 });

  // Sync scanResultRef with scanResult state
  const updateScanResult = (result) => {
    scanResultRef.current = result;
    setScanResult(result);
  };

  // Load Event & Scan History
  useEffect(() => {
    if (eventId && eventId !== 'all') {
      fetchAPI(`/events/${eventId}`)
        .then((res) => setEventDetails(res.data))
        .catch(() => setEventDetails(null));
    } else {
      setEventDetails({
        title: 'All Active Events Gate Pass Scanner',
        venue: { name: 'Main Venue Entrance Gate', city: 'All Gates' }
      });
    }

    fetchScanHistory();
    loadOfflineQueue();

    // Listen for back online connection to auto sync offline queue
    const handleOnline = () => syncOfflineQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [eventId]);

  const fetchScanHistory = () => {
    fetchAPI('/staff/my-scans')
      .then((res) => setScanHistory(res.data || []))
      .catch(() => setScanHistory([]));
  };

  // Offline Queue Logic
  const loadOfflineQueue = () => {
    try {
      const stored = localStorage.getItem('vana_offline_scans');
      if (stored) {
        setPendingOfflineScans(JSON.parse(stored));
      }
    } catch (e) {}
  };

  const saveToOfflineQueue = (scanPayload) => {
    try {
      const queue = [...pendingOfflineScans, { ...scanPayload, offlineTime: new Date().toISOString() }];
      setPendingOfflineScans(queue);
      localStorage.setItem('vana_offline_scans', JSON.stringify(queue));
    } catch (e) {}
  };

  const syncOfflineQueue = async () => {
    const stored = localStorage.getItem('vana_offline_scans');
    if (!stored) return;
    try {
      const queue = JSON.parse(stored);
      if (queue.length === 0) return;

      for (const item of queue) {
        await fetchAPI('/staff/verify-ticket', {
          method: 'POST',
          body: JSON.stringify(item)
        }).catch(() => {});
      }

      localStorage.removeItem('vana_offline_scans');
      setPendingOfflineScans([]);
      fetchScanHistory();
    } catch (e) {}
  };

  // Initialize Camera & QR Scanner
  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        // Enumerate video input devices
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        setCameras(devices);

        html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 }
        };

        const cameraIdOrMode = selectedCameraId
          ? selectedCameraId
          : { facingMode: facingMode };

        await html5QrCode.start(
          cameraIdOrMode,
          config,
          (decodedText) => {
            handleVerifyTicket(decodedText);
          },
          () => {} // Frame failure callback ignored for smooth scanning
        );

        setCameraActive(true);
        setScannerError('');
      } catch (err) {
        setCameraActive(false);
        setScannerError('Could not launch camera scanner. Ensure camera permissions are granted or type Booking ID manually below.');
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [eventId, facingMode, selectedCameraId]);

  // Flashlight / Torch Toggle
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !cameraActive) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      alert('Torch / Flashlight feature is not supported on this device/browser.');
    }
  };

  // Flip Camera (Front / Back)
  const flipCamera = () => {
    if (selectedCameraId && cameras.length > 1) {
      const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedCameraId(cameras[nextIndex].id);
    } else {
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    }
  };

  // Main Ticket Verification Engine
  const handleVerifyTicket = async (code) => {
    if (!code) return;

    const trimmedCode = code.trim();
    const now = Date.now();

    // 1. Lock check: If currently verifying a ticket request, ignore frame
    if (isVerifyingRef.current) return;

    // 2. Lock check: If scan result overlay is currently open on screen, ignore frame
    if (scanResultRef.current !== null) return;

    // 3. Cooldown check: If exact same QR code was scanned within last 3 seconds, ignore frame
    if (lastScannedRef.current.code === trimmedCode && (now - lastScannedRef.current.time) < 3000) {
      return;
    }

    // Set synchronous locks IMMEDIATELY before starting async state & network operations
    isVerifyingRef.current = true;
    lastScannedRef.current = { code: trimmedCode, time: now };
    setVerifying(true);

    const payload = {
      ticketCode: trimmedCode,
      eventId: eventId === 'all' ? undefined : eventId,
      deviceInfo: navigator.userAgent
    };

    // Check if offline
    if (!navigator.onLine) {
      playAudioFeedback('SUCCESS');
      triggerHaptic('SUCCESS');
      saveToOfflineQueue(payload);
      updateScanResult({
        status: 'SUCCESS',
        title: 'PASS RECORDED (OFFLINE)',
        message: 'Scan saved locally in offline queue. Will auto-sync when connected to network.',
        bookingId: trimmedCode,
        attendeeName: 'Offline Attendee'
      });
      setVerifying(false);
      return;
    }

    try {
      const res = await fetchAPI('/staff/verify-ticket', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      playAudioFeedback('SUCCESS');
      triggerHaptic('SUCCESS');

      updateScanResult({
        status: res.status || 'SUCCESS',
        title: res.title || 'ACCESS GRANTED',
        message: res.message || 'Ticket verified & checked-in successfully!',
        attendeeName: res.attendeeName,
        userEmail: res.userEmail,
        userPhone: res.userPhone,
        bookingId: res.bookingId,
        ticketCategory: res.ticketCategory,
        quantity: res.quantity,
        seatNumbers: res.seatNumbers,
        selectedSeats: res.selectedSeats || [],
        section: res.section,
        showtimeDate: res.showtimeDate,
        checkInTime: res.checkInTime,
        checkedInBy: res.checkedInBy,
        checkInGate: res.checkInGate || 'Gate Passer',
        eventTitle: res.eventTitle
      });

      fetchScanHistory();
    } catch (err) {
      playAudioFeedback('ERROR');
      triggerHaptic('ERROR');

      let status = 'INVALID';
      let title = 'INVALID TICKET';

      if (err.message.includes('ALREADY USED') || err.message.includes('scanned') || err.message.includes('checked-in')) {
        status = 'DUPLICATE';
        title = 'TICKET ALREADY USED';
      } else if (err.message.includes('WRONG EVENT')) {
        status = 'WRONG_EVENT';
        title = 'WRONG EVENT PASS';
      } else if (err.message.includes('UNAUTHORIZED')) {
        status = 'UNAUTHORIZED';
        title = 'ACCESS DENIED';
      }

      const errData = err.data || {};
      updateScanResult({
        status: status,
        title: title,
        message: err.message || 'Ticket verification failed',
        attendeeName: errData.attendeeName,
        bookingId: errData.bookingId,
        seatNumbers: errData.seatNumbers,
        section: errData.section,
        ticketCategory: errData.ticketCategory,
        quantity: errData.quantity,
        checkInTime: errData.checkInTime,
        checkedInBy: errData.checkedInBy
      });
    } finally {
      setVerifying(false);
      setManualCode('');
      // If no result overlay was opened, release verifying lock
      if (!scanResultRef.current) {
        isVerifyingRef.current = false;
      }
    }
  };

  // Submit Manual Ticket Code Search
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleVerifyTicket(manualCode.trim());
    }
  };

  // Close Result Overlay and Resume Scanning
  const handleDismissOverlay = () => {
    scanResultRef.current = null;
    isVerifyingRef.current = false;
    lastScannedRef.current = { code: '', time: 0 };
    setScanResult(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: '#F8FAFC',
        maxWidth: '650px',
        margin: '0 auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}
    >
      {/* Top Luxury Gate Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          background: '#141824',
          padding: '12px 16px',
          borderRadius: '14px',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-soft)'
        }}
      >
        <Link to="/staff/portal" style={{ color: 'var(--gold-accent)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-arrow-left"></i> Gate Portal
        </Link>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>{user?.name || 'Gate Staff'}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--gold-accent)', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
            <i className="fa-solid fa-qrcode" style={{ marginRight: '4px' }}></i> Gate Passer (QR & Seat Validator)
          </span>
        </div>
      </div>

      {/* Active Event Banner Card */}
      <div style={{ background: '#141824', padding: '14px 16px', borderRadius: '14px', marginBottom: '16px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--gold-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ● ACTIVE VERIFICATION GATE
          </span>
          <h3 style={{ fontSize: '1.1rem', margin: '4px 0 2px', fontWeight: 800, color: '#F8FAFC' }}>
            {eventDetails?.title || 'High-Speed Ticket Pass Scanner'}
          </h3>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            📍 {eventDetails?.venue?.name || 'Gate Station'}, {eventDetails?.venue?.city || 'Venue'}
          </div>
        </div>

        {pendingOfflineScans.length > 0 && (
          <div style={{ background: 'var(--gold-primary)', color: '#000', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center' }}>
            {pendingOfflineScans.length} Offline Queued
          </div>
        )}
      </div>

      {/* Camera Viewport Container */}
      <div
        style={{
          background: '#000000',
          borderRadius: '18px',
          overflow: 'hidden',
          position: 'relative',
          border: '2px solid rgba(212, 175, 55, 0.3)',
          marginBottom: '16px',
          minHeight: '290px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
        }}
      >
        <div id="qr-reader" style={{ width: '100%' }}></div>

        {/* Camera Control Toolbar (Flip Camera, Flashlight) */}
        {cameraActive && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              zIndex: 5,
              background: 'rgba(10, 13, 20, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: '30px',
              border: '1px solid rgba(212, 175, 55, 0.3)'
            }}
          >
            <button
              onClick={flipCamera}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '1rem', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              title="Switch Camera (Front/Rear)"
            >
              <i className="fa-solid fa-camera-rotate"></i> Flip
            </button>

            <button
              onClick={toggleTorch}
              style={{ background: 'none', border: 'none', color: torchOn ? 'var(--gold-accent)' : '#FFFFFF', fontSize: '1rem', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              title="Toggle Flashlight"
            >
              <i className={`fa-solid ${torchOn ? 'fa-bolt-lightning' : 'fa-bolt'}`}></i> Flash
            </button>
          </div>
        )}

        {scannerError && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
            <i className="fa-solid fa-camera-slash fa-2x" style={{ color: '#ef4444', marginBottom: '10px', display: 'block' }}></i>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{scannerError}</p>
          </div>
        )}

        {verifying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10, 13, 20, 0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#FFFFFF',
              zIndex: 10
            }}
          >
            <i className="fa-solid fa-circle-notch fa-spin fa-3x" style={{ color: 'var(--gold-primary)', marginBottom: '12px' }}></i>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.05em', color: 'var(--gold-accent)' }}>VERIFYING PASS IN DATABASE...</span>
          </div>
        )}
      </div>

      {/* Manual Booking Code Entry */}
      <form onSubmit={handleManualSubmit} style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Manual Ticket Code / Booking ID Search
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Enter e.g. VANA-2026-8819"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: '#0B0E17',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: 'monospace'
            }}
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || verifying}
            className="primary-btn"
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Verify
          </button>
        </div>
      </form>

      {/* Shift Scan History Drawer */}
      <div style={{ marginTop: 'auto', background: '#141824', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
        <h4 style={{ fontSize: '0.92rem', margin: '0 0 12px', fontWeight: 800, color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--gold-accent)', marginRight: '6px' }}></i> Gate Shift Scan Audit</span>
          <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>{scanHistory.length} Validated</span>
        </h4>

        {scanHistory.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
            No tickets scanned yet during this shift. Tap camera scanner above to start validating passes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {scanHistory.slice(0, 10).map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#0B0E17',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  borderLeft: log.status === 'SUCCESS' ? '4px solid #10b981' : '4px solid #ef4444'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#FFFFFF' }}>
                    {log.userName || log.bookingId}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {log.bookingId} • {log.ticketCategory || 'Standard Pass'} ({log.quantity || 1} Tkt)
                    {log.seatNumbers && (
                      <span style={{ color: 'var(--gold-accent)', fontWeight: 700, marginLeft: '6px' }}>
                        • <i className="fa-solid fa-chair" style={{ marginRight: '3px' }}></i>{log.seatNumbers}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>
                    {new Date(log.scanTimestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444'
                    }}
                  >
                    {log.status === 'SUCCESS' ? '✓ ENTRY DONE' : log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL SCREEN INSTANT FEEDBACK OVERLAY (GREEN FOR VALID ACCESS, RED FOR DUPLICATE/INVALID) */}
      {scanResult && (
        <div
          onClick={handleDismissOverlay}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background:
              scanResult.status === 'SUCCESS'
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justify: 'center',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          {/* Main Icon */}
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              marginBottom: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            {scanResult.status === 'SUCCESS' ? (
              <i className="fa-solid fa-circle-check"></i>
            ) : (
              <i className="fa-solid fa-triangle-exclamation"></i>
            )}
          </div>

          {/* Banner Title */}
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {scanResult.title}
          </h1>

          <p style={{ fontSize: '1.15rem', opacity: 0.95, maxWidth: '480px', marginBottom: '24px', fontWeight: 600 }}>
            {scanResult.message}
          </p>

          {/* Detailed Pass Holder Card */}
          {scanResult.attendeeName && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                padding: '22px 24px',
                width: '100%',
                maxWidth: '460px',
                textAlign: 'left',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                marginBottom: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}
            >
              {/* PROMINENT SEAT NUMBER(S) VALIDATION CARD */}
              <div
                style={{
                  background: scanResult.status === 'SUCCESS' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.55)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.25)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.95 }}>
                    <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i>
                    ASSIGNED SEAT NUMBER(S)
                  </span>
                  {scanResult.section && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.35)', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
                      {scanResult.section}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.4)', color: '#FFFFFF' }}>
                  {scanResult.seatNumbers || scanResult.ticketCategory || 'General Admission'}
                </div>

                {scanResult.showtimeDate && (
                  <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '6px' }}>
                    <i className="fa-regular fa-clock" style={{ marginRight: '5px' }}></i>
                    Showtime: {scanResult.showtimeDate}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                ATTENDEE FULL NAME
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '14px', textTransform: 'capitalize' }}>
                {scanResult.attendeeName}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ opacity: 0.8, fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>BOOKING REF</span>
                  <strong style={{ fontSize: '1.05rem', fontFamily: 'monospace' }}>{scanResult.bookingId}</strong>
                </div>

                <div>
                  <span style={{ opacity: 0.8, fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>PASS QUANTITY</span>
                  <strong style={{ fontSize: '1.05rem' }}>{scanResult.quantity || 1} Ticket(s)</strong>
                </div>

                <div>
                  <span style={{ opacity: 0.8, fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>TICKET TIER</span>
                  <strong>{scanResult.ticketCategory || 'Standard Pass'}</strong>
                </div>

                <div>
                  <span style={{ opacity: 0.8, fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>VERIFIED BY GATE PASSER</span>
                  <strong>{scanResult.checkedInBy || user?.name || 'Gate Passer'}</strong>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleDismissOverlay}
            style={{
              padding: '16px 40px',
              background: '#FFFFFF',
              color: scanResult.status === 'SUCCESS' ? '#047857' : '#991b1b',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1.15rem',
              fontWeight: 900,
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              cursor: 'pointer'
            }}
          >
            TAP TO SCAN NEXT TICKET →
          </button>
        </div>
      )}
    </div>
  );
}
