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
        quantity: res.quantity
      });

      setManualCode('');
      loadPortalData();
    } catch (err) {
      let status = 'INVALID';
      if (err.message.includes('ALREADY USED') || err.message.includes('checked-in')) {
        status = 'DUPLICATE';
      }
      setSearchResult({
        status,
        title: status === 'DUPLICATE' ? '❌ TICKET ALREADY USED' : '❌ INVALID TICKET',
        message: err.message || 'Ticket verification failed'
      });
    } finally {
      setSearchVerifying(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F6EFE5',
        color: '#0f172a',
        fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif',
        padding: '16px 12px 40px',
        maxWidth: '560px',
        margin: '0 auto'
      }}
    >
      {/* 1. TOP HEADER & STAFF PROFILE CARD */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(184, 134, 11, 0.15)',
          marginBottom: '16px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>👋 Welcome,</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0', color: '#0f172a' }}>
            {user?.name || 'Gate Staff'}
          </h2>
          <div style={{ fontSize: '0.78rem', color: '#B8860B', fontWeight: 700 }}>
            Gate: <span style={{ color: '#0f172a' }}>{gateName}</span> | Staff ID: <span style={{ color: '#0f172a' }}>{staffId}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
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
            background: '#FFFFFF',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(184, 134, 11, 0.15)',
            marginBottom: '16px'
          }}
        >
          <div style={{ position: 'relative', height: '110px', background: '#0f172a' }}>
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
                background: '#10b981',
                color: '#FFFFFF',
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
            <div style={{ fontSize: '0.75rem', color: '#B8860B', fontWeight: 800, textTransform: 'uppercase' }}>
              📍 ASSIGNED VENUE GATE: {gateName}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 6px', color: '#0f172a' }}>
              {assignedEvent.title}
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '22px',
          fontWeight: 900,
          fontSize: '1.3rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 15px 35px rgba(16, 185, 129, 0.35)',
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
            background: '#FFFFFF',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.03)',
            borderLeft: '5px solid #10b981',
            border: '1px solid rgba(184, 134, 11, 0.1)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>✅ {stats.verifiedToday}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Verified Today
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.03)',
            borderLeft: '5px solid #3b82f6',
            border: '1px solid rgba(184, 134, 11, 0.1)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb' }}>⏳ {stats.pendingEntries}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Pending Entries
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.03)',
            borderLeft: '5px solid #f59e0b',
            border: '1px solid rgba(184, 134, 11, 0.1)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706' }}>⚠️ {stats.duplicateScans}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Duplicate Scans
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: '16px',
            borderRadius: '18px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.03)',
            borderLeft: '5px solid #ef4444',
            border: '1px solid rgba(184, 134, 11, 0.1)'
          }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626' }}>❌ {stats.invalidScans}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Invalid Scans
          </div>
        </div>
      </div>

      {/* 5. MANUAL BOOKING ID VERIFICATION SEARCH */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '18px 20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(184, 134, 11, 0.15)',
          marginBottom: '20px'
        }}
      >
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 10px', color: '#0f172a' }}>
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
              border: '1px solid #cbd5e1',
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
              marginTop: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: searchResult.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
              color: searchResult.status === 'SUCCESS' ? '#15803d' : '#b91c1c',
              fontSize: '0.88rem',
              fontWeight: 700
            }}
          >
            <div>{searchResult.title}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{searchResult.message}</div>
          </div>
        )}
      </div>

      {/* 6. RECENT SCAN HISTORY (LAST 20 SCANS) */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(184, 134, 11, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Recent Scan History
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
            Shift Date: {todayDate}
          </span>
        </div>

        {recentScans.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
            No tickets scanned yet during this shift. Tap "Start QR Scanner" above to begin verifying passes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentScans.slice(0, 20).map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  borderLeft:
                    log.status === 'SUCCESS'
                      ? '4px solid #10b981'
                      : log.status === 'DUPLICATE'
                      ? '4px solid #f59e0b'
                      : '4px solid #ef4444'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    {log.status === 'SUCCESS' ? '✅ ' : log.status === 'DUPLICATE' ? '⚠ ' : '❌ '}
                    {log.userName || log.bookingId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {log.bookingId} • {log.ticketCategory || 'Standard Pass'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>
                    {new Date(log.scanTimestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color:
                        log.status === 'SUCCESS'
                          ? '#15803d'
                          : log.status === 'DUPLICATE'
                          ? '#b45309'
                          : '#b91c1c'
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
