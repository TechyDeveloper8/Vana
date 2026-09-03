import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

export default function StaffPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [assignedEvent, setAssignedEvent] = useState(null);
  const [stats, setStats] = useState({
    verifiedToday: 0,
    pendingEntries: 0,
    duplicateScans: 0,
    invalidScans: 0
  });
  const [recentScans, setRecentScans] = useState([]);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchVerifying, setSearchVerifying] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const staffId = user?.id ? `ST-${user.id.slice(-4).toUpperCase()}` : 'ST-102';
  const gateName = user?.staffRole || 'Gate A';
  const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const loadPortalData = () => {
    setLoading(true);

    fetchAPI('/staff/assigned-events')
      .then((res) => {
        const events = res.data || [];
        if (events.length > 0) {
          setAssignedEvent(events[0]);
        } else {
          setAssignedEvent({
            _id: 'all',
            title: 'Vana Live Event Entrance Gate',
            eventDate: 'Today',
            startTime: 'Live Entry Active',
            venue: { name: 'Main Venue Entrance', city: 'Vana Venue' },
            status: 'LIVE'
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchAPI('/staff/dashboard-stats')
      .then((res) => {
        if (res.stats) setStats(res.stats);
      })
      .catch(() => {});

    fetchAPI('/staff/my-scans')
      .then((res) => {
        setRecentScans(res.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadPortalData();
    const interval = setInterval(loadPortalData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const handleManualSearchSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim() || searchVerifying) return;

    setSearchVerifying(true);
    setSearchResult(null);

    try {
      const res = await fetchAPI('/staff/verify-ticket', {
        method: 'POST',
        body: JSON.stringify({
          ticketCode: manualCode.trim(),
          eventId: assignedEvent?._id === 'all' ? undefined : assignedEvent?._id,
          deviceInfo: navigator.userAgent
        })
      });

      setSearchResult({
        status: 'SUCCESS',
        title: '✅ ENTRY APPROVED',
        message: res.message || 'Ticket checked-in successfully!',
        attendeeName: res.attendeeName,
        bookingId: res.bookingId,
        ticketCategory: res.ticketCategory,
        quantity: res.quantity,
        seatNumbers: res.seatNumbers,
        section: res.section,
        showtimeDate: res.showtimeDate
      });

      setManualCode('');
      loadPortalData();
    } catch (err) {
      let status = 'INVALID';
      if (err.message.includes('ALREADY USED') || err.message.includes('checked-in')) {
        status = 'DUPLICATE';
      }
      const errData = err.data || {};
      setSearchResult({
        status,
        title: status === 'DUPLICATE' ? '❌ TICKET ALREADY USED' : '❌ INVALID TICKET',
        message: err.message || 'Ticket verification failed',
        attendeeName: errData.attendeeName,
        bookingId: errData.bookingId,
        seatNumbers: errData.seatNumbers,
        section: errData.section
      });
    } finally {
      setSearchVerifying(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: '#F8FAFC',
        fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif',
        padding: '16px 12px 40px',
        maxWidth: '560px',
        margin: '0 auto'
      }}
    >
      {/* 1. TOP HEADER & STAFF PROFILE CARD */}
      <div
        style={{
          background: '#141824',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-hover)',
          border: '1px solid var(--border-light)',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>👋 Welcome,</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0', color: '#F8FAFC' }}>
            {user?.name || 'Gate Staff'}
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--gold-accent)', fontWeight: 700 }}>
            Role: <span style={{ color: '#4ADE80', fontWeight: 800 }}>Gate Passer</span> | ID: <span style={{ color: '#CBD5E1' }}>{staffId}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#F87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* 2. ASSIGNED EVENT BANNER & STATUS */}
      {assignedEvent && (
        <div
          style={{
            background: '#141824',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid var(--border-light)',
            marginBottom: '16px'
          }}
        >
          <div style={{ position: 'relative', height: '110px', background: '#0B0E17' }}>
            <img
              src={assignedEvent.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
              alt={assignedEvent.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'var(--gold-gradient)',
                color: '#0A0D14',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}
            >
              🟢 LIVE ENTRY
            </span>
          </div>

          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', fontWeight: 800, textTransform: 'uppercase' }}>
              📍 ASSIGNED VENUE GATE: {gateName}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 6px', color: '#F8FAFC' }}>
              {assignedEvent.title}
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
              📅 {assignedEvent.eventDate} ({assignedEvent.startTime || 'Live'}) • 📍 {assignedEvent.venue?.name || 'Venue Gate'}, {assignedEvent.venue?.city || 'City'}
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO PRIMARY ACTION: LARGE "START QR SCANNER" BUTTON */}
      <button
        onClick={() => navigate(`/staff/scan/${assignedEvent?._id || 'all'}`)}
        style={{
          width: '100%',
          padding: '20px 24px',
          background: 'var(--gold-gradient)',
          color: '#0A0D14',
          border: 'none',
          borderRadius: '22px',
          fontWeight: 900,
          fontSize: '1.3rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 15px 35px rgba(212, 175, 55, 0.4)',
          marginBottom: '20px',
          letterSpacing: '0.02em'
        }}
      >
        <i className="fa-solid fa-camera" style={{ fontSize: '1.6rem' }}></i>
        📷 START QR SCANNER
      </button>

      {/* 4. REAL-TIME STATISTICS CARDS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            background: '#141824',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-hover)',
            borderLeft: '5px solid #10b981',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34D399' }}>✅ {stats.verifiedToday}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px' }}>
            Verified Today
          </div>
        </div>

        <div
          style={{
            background: '#141824',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-hover)',
            borderLeft: '5px solid #3b82f6',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#60A5FA' }}>⏳ {stats.pendingEntries}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px' }}>
            Pending Entries
          </div>
        </div>

        <div
          style={{
            background: '#141824',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-hover)',
            borderLeft: '5px solid var(--gold-primary)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-accent)' }}>⚠️ {stats.duplicateScans}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px' }}>
            Duplicate Scans
          </div>
        </div>

        <div
          style={{
            background: '#141824',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-hover)',
            borderLeft: '5px solid #ef4444',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F87171' }}>❌ {stats.invalidScans}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px' }}>
            Invalid Scans
          </div>
        </div>
      </div>

      {/* 5. MANUAL BOOKING ID VERIFICATION SEARCH */}
      <div
        style={{
          background: '#141824',
          borderRadius: '20px',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-hover)',
          border: '1px solid var(--border-light)',
          marginBottom: '20px'
        }}
      >
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 10px', color: '#F8FAFC' }}>
          🔍 Manual Booking ID Search
        </h4>
        <form onSubmit={handleManualSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Enter e.g. VANA-2026-8819"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              background: '#0B0E17',
              color: '#F8FAFC',
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: 'monospace',
              fontWeight: 700
            }}
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || searchVerifying}
            style={{
              padding: '12px 20px',
              background: '#0f172a',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Verify
          </button>
        </form>

        {searchResult && (
          <div
            style={{
              marginTop: '14px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: searchResult.status === 'SUCCESS' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: searchResult.status === 'SUCCESS' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: searchResult.status === 'SUCCESS' ? '#4ADE80' : '#F87171',
              fontSize: '0.88rem'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{searchResult.title}</div>
            <div style={{ fontSize: '0.82rem', marginTop: '2px', color: '#CBD5E1' }}>{searchResult.message}</div>

            {searchResult.attendeeName && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(212, 175, 55, 0.25)' }}>
                <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1rem' }}>
                  {searchResult.attendeeName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  Ref: {searchResult.bookingId} • {searchResult.ticketCategory || 'Pass'}
                </div>

                {/* HIGHLIGHTED SEAT ALLOCATION */}
                <div style={{ marginTop: '8px', background: '#0B0E17', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-accent)', textTransform: 'uppercase' }}>
                    <i className="fa-solid fa-chair" style={{ marginRight: '5px' }}></i>
                    Seats:
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--gold-accent)' }}>
                    {searchResult.seatNumbers || 'General Admission'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. RECENT SCAN HISTORY (LAST 20 SCANS) */}
      <div
        style={{
          background: '#141824',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'var(--shadow-hover)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
            Recent Scan History
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--gold-accent)', fontWeight: 700 }}>
            Shift Date: {todayDate}
          </span>
        </div>

        {recentScans.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>
            No tickets scanned yet during this shift. Tap "Start QR Scanner" above to begin verifying passes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentScans.slice(0, 20).map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: '#0B0E17',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  borderLeft:
                    log.status === 'SUCCESS'
                      ? '4px solid #10b981'
                      : log.status === 'DUPLICATE'
                      ? '4px solid var(--gold-primary)'
                      : '4px solid #ef4444'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.92rem' }}>
                    {log.status === 'SUCCESS' ? '✅ ' : log.status === 'DUPLICATE' ? '⚠ ' : '❌ '}
                    {log.userName || log.bookingId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                    {log.bookingId} • {log.ticketCategory || 'Standard Pass'}
                    {log.seatNumbers && (
                      <span style={{ color: 'var(--gold-accent)', fontWeight: 800, marginLeft: '6px' }}>
                        • <i className="fa-solid fa-chair"></i> {log.seatNumbers}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 700 }}>
                    {new Date(log.scanTimestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color:
                        log.status === 'SUCCESS'
                          ? '#4ADE80'
                          : log.status === 'DUPLICATE'
                          ? 'var(--gold-accent)'
                          : '#F87171'
                    }}
                  >
                    {log.status === 'SUCCESS' ? 'APPROVED' : log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
