import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import InteractiveSeatMap from '../components/InteractiveSeatMap';
import { fetchAPI } from '../services/api';

export default function AdminSeating() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [showtimeDate, setShowtimeDate] = useState('2026-09-15T18:00');

  const [layout, setLayout] = useState(null);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [adminSelectedSeatIds, setAdminSelectedSeatIds] = useState([]);

  // Category price settings form state
  const [prices, setPrices] = useState({
    Silver: 500,
    Gold: 700,
    Platinum: 1000,
    'VIP Lounge': 1500
  });
  const [savingPrices, setSavingPrices] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load events list
  useEffect(() => {
    fetchAPI('/events')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setEvents(res.data);
          setSelectedEventId(res.data[0]._id);
        }
      })
      .catch((err) => console.error('Error fetching events:', err));
  }, []);

  // Load venue seating layout
  useEffect(() => {
    fetchAPI('/seating/layout/ground-floor-main?forceReseed=true')
      .then((res) => {
        if (res.success) setLayout(res.data);
      })
      .catch((err) => console.error('Error fetching layout:', err));
  }, []);

  // Fetch showtime seat availability whenever event or showtime changes
  const fetchAvailability = () => {
    if (!selectedEventId) return;

    fetchAPI(`/seating/availability?eventId=${selectedEventId}&showtimeDate=${encodeURIComponent(showtimeDate)}`)
      .then((res) => {
        if (res.success && res.data) {
          const map = {};
          res.data.forEach((seat) => {
            map[seat.seatId] = seat;
          });
          setAvailabilityMap(map);

          // Update price input state based on fetched inventory
          const sampleSilver = res.data.find((s) => s.category === 'Silver');
          const sampleGold = res.data.find((s) => s.category === 'Gold');
          const samplePlatinum = res.data.find((s) => s.category === 'Platinum');
          const sampleVip = res.data.find((s) => s.category === 'VIP Lounge');

          setPrices({
            Silver: sampleSilver ? sampleSilver.price : 500,
            Gold: sampleGold ? sampleGold.price : 700,
            Platinum: samplePlatinum ? samplePlatinum.price : 1000,
            'VIP Lounge': sampleVip ? sampleVip.price : 1500
          });
        }
      })
      .catch((err) => console.error('Error fetching showtime availability:', err));
  };

  useEffect(() => {
    fetchAvailability();
    setAdminSelectedSeatIds([]);
  }, [selectedEventId, showtimeDate]);

  // Admin toggle seat selection on map
  const handleAdminToggleSeat = (seat) => {
    if (adminSelectedSeatIds.includes(seat.seatId)) {
      setAdminSelectedSeatIds(adminSelectedSeatIds.filter((id) => id !== seat.seatId));
    } else {
      setAdminSelectedSeatIds([...adminSelectedSeatIds, seat.seatId]);
    }
  };

  // Bulk update seat status (Block / Reserve / Available)
  const handleBulkStatusChange = async (targetStatus) => {
    if (adminSelectedSeatIds.length === 0) {
      alert('Please click and select at least one seat on the venue map.');
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await fetchAPI('/seating/admin/status', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          showtimeDate,
          seatIds: adminSelectedSeatIds,
          status: targetStatus
        })
      });

      if (res.success) {
        alert(`Successfully updated ${adminSelectedSeatIds.length} seat(s) to status: ${targetStatus}`);
        setAdminSelectedSeatIds([]);
        fetchAvailability();
      } else {
        alert(res.message || 'Failed to update seat status.');
      }
    } catch (err) {
      alert(err.message || 'Server error updating seat status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Update Category Tier Prices for this showtime
  const handleSavePrices = async (e) => {
    e.preventDefault();
    setSavingPrices(true);
    try {
      const res = await fetchAPI('/seating/admin/prices', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          showtimeDate,
          prices
        })
      });

      if (res.success) {
        alert('Showtime tier pricing updated successfully!');
        fetchAvailability();
      } else {
        alert(res.message || 'Failed to update tier pricing.');
      }
    } catch (err) {
      alert(err.message || 'Error updating tier prices.');
    } finally {
      setSavingPrices(false);
    }
  };

  // Count seat stats
  const allSeats = Object.values(availabilityMap);
  const totalCount = allSeats.length;
  const availableCount = allSeats.filter((s) => s.status === 'Available').length;
  const lockedCount = allSeats.filter((s) => s.status === 'Temporarily Locked').length;
  const bookedCount = allSeats.filter((s) => s.status === 'Booked').length;
  const blockedCount = allSeats.filter((s) => s.status === 'Blocked').length;
  const reservedCount = allSeats.filter((s) => s.status === 'Reserved').length;

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', color: '#FFF' }}>
      <AdminSidebar />

      <main className="admin-content" style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--text-heading)', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <i className="fa-solid fa-building-columns" style={{ color: 'var(--gold-primary)', marginRight: '10px' }}></i>
              Venue & Showtime Inventory Management
            </h1>
            <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              Select venue, manage event showtime inventory, seat availability, category pricing, and manual seat blocking.
            </p>
          </div>

          <button onClick={fetchAvailability} style={{ padding: '10px 18px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', color: 'var(--gold-accent)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-rotate" style={{ color: 'var(--gold-primary)' }}></i> Refresh Live Inventory
          </button>
        </div>

        {/* Filter & Venue Selection Controls Bar */}
        <div
          style={{
            background: '#141824',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1.5fr',
            gap: '20px',
            alignItems: 'end',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-hover)'
          }}
        >
          {/* Venue Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold-primary)', marginRight: '4px' }}></i> Select Venue
            </label>
            <select
              value="Town Hall Bhagalpur"
              disabled
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                background: '#0B0E17',
                color: 'var(--gold-accent)',
                fontWeight: 700,
                border: '1px solid var(--gold-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="Town Hall Bhagalpur">🏛️ Town Hall Bhagalpur</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>Select Target Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#0B0E17', color: '#F8FAFC', border: '1px solid rgba(212, 175, 55, 0.25)' }}
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} ({ev.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>Select Showtime Date</label>
            <select
              value={showtimeDate}
              onChange={(e) => setShowtimeDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#0B0E17', color: '#F8FAFC', border: '1px solid rgba(212, 175, 55, 0.25)' }}
            >
              <option value="2026-09-15T18:00">Sep 15, 2026 - 06:00 PM</option>
              <option value="2026-09-16T18:00">Sep 16, 2026 - 06:00 PM</option>
              <option value="2026-09-17T18:00">Sep 17, 2026 - 06:00 PM</option>
            </select>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#0B0E17', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)', flex: 1, textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-light)' }}>Available</span>
              <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>{availableCount}</strong>
            </div>
            <div style={{ background: '#0B0E17', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)', flex: 1, textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-light)' }}>Booked</span>
              <strong style={{ color: '#38BDF8', fontSize: '1.1rem' }}>{bookedCount}</strong>
            </div>
            <div style={{ background: '#0B0E17', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)', flex: 1, textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-light)' }}>Blocked</span>
              <strong style={{ color: '#F87171', fontSize: '1.1rem' }}>{blockedCount}</strong>
            </div>
            <div style={{ background: '#0B0E17', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)', flex: 1, textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-light)' }}>Reserved</span>
              <strong style={{ color: '#C084FC', fontSize: '1.1rem' }}>{reservedCount}</strong>
            </div>
          </div>
        </div>

        {/* Pricing Configuration Form & Admin Seat Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '24px' }}>
          {/* Main Vector Seat Map in Admin Mode */}
          <div>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--gold-accent)' }}>
                Click seats to select for Admin action ({adminSelectedSeatIds.length} selected)
              </span>
              {adminSelectedSeatIds.length > 0 && (
                <button
                  onClick={() => setAdminSelectedSeatIds([])}
                  style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            <InteractiveSeatMap
              layout={layout}
              availabilityMap={availabilityMap}
              adminMode={true}
              adminSelectedSeatIds={adminSelectedSeatIds}
              onAdminToggleSeat={handleAdminToggleSeat}
            />
          </div>

          {/* Admin Side Controls Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Admin Seat Actions */}
            <div style={{ background: '#141824', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-hover)' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 14px 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '10px', color: 'var(--text-heading)' }}>
                Admin Seat Override Actions
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-body)', marginBottom: '14px' }}>
                Select seats on the map above and choose an action to update status immediately:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => handleBulkStatusChange('Blocked')}
                  disabled={updatingStatus || adminSelectedSeatIds.length === 0}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(220, 38, 38, 0.4)',
                    background: 'rgba(220, 38, 38, 0.2)',
                    color: '#FCA5A5',
                    fontWeight: 600,
                    cursor: adminSelectedSeatIds.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-ban"></i> Block Selected Seats
                </button>

                <button
                  onClick={() => handleBulkStatusChange('Reserved')}
                  disabled={updatingStatus || adminSelectedSeatIds.length === 0}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(147, 51, 234, 0.4)',
                    background: 'rgba(147, 51, 234, 0.2)',
                    color: '#D8B4FE',
                    fontWeight: 600,
                    cursor: adminSelectedSeatIds.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-crown" style={{ color: 'var(--gold-accent)' }}></i> Reserve Seats for VIP
                </button>

                <button
                  onClick={() => handleBulkStatusChange('Available')}
                  disabled={updatingStatus || adminSelectedSeatIds.length === 0}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(5, 150, 105, 0.4)',
                    background: 'rgba(5, 150, 105, 0.2)',
                    color: '#6EE7B7',
                    fontWeight: 600,
                    cursor: adminSelectedSeatIds.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-lock-open"></i> Unlock & Make Available
                </button>
              </div>
            </div>

            {/* Tier Price Configuration Form */}
            <div style={{ background: '#141824', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-hover)' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 14px 0', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '10px', color: 'var(--text-heading)' }}>
                Category Tier Pricing (₹)
              </h3>
              <form onSubmit={handleSavePrices}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>Silver Category (First Floor Rows 1A–1H)</label>
                  <input
                    type="number"
                    min="0"
                    value={prices.Silver}
                    onChange={(e) => setPrices({ ...prices, Silver: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>Gold Category (Rows A–E)</label>
                  <input
                    type="number"
                    min="0"
                    value={prices.Gold}
                    onChange={(e) => setPrices({ ...prices, Gold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>Platinum Category (Rows F–Q)</label>
                  <input
                    type="number"
                    min="0"
                    value={prices.Platinum}
                    onChange={(e) => setPrices({ ...prices, Platinum: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>VIP Lounge Category (Row V)</label>
                  <input
                    type="number"
                    min="0"
                    value={prices['VIP Lounge']}
                    onChange={(e) => setPrices({ ...prices, 'VIP Lounge': Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPrices}
                  className="primary-btn"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    justifyContent: 'center',
                    background: 'var(--gold-primary)',
                    color: '#000',
                    border: 'none'
                  }}
                >
                  {savingPrices ? 'Saving Prices...' : 'Update Category Prices'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
