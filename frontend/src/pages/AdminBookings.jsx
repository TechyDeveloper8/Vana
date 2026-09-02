import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminBookings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [checkInFilter, setCheckInFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');

  // Modals & Toasts
  const [selectedBooking, setSelectedBooking] = useState(null); // View QR & Pass details
  const [showManualModal, setShowManualModal] = useState(false); // Create manual pass
  const [toast, setToast] = useState(null);

  // Form State for Manual Booking Creation
  const [manualForm, setManualForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    eventTitle: '',
    eventId: '',
    ticketCategory: 'VIP Pass',
    quantity: 1,
    unitPrice: 999,
    paymentStatus: 'Paid'
  });

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, eventsRes] = await Promise.all([
        fetchAPI('/booking/all'),
        fetchAPI('/events?admin=true')
      ]);

      setBookings(bookingsRes.data || []);
      setEventsList(eventsRes.data || []);
    } catch (err) {
      showToastMsg(err.message || 'Failed to load booking data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.bookingId || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.userPhone || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.eventTitle || '').toLowerCase().includes(search.toLowerCase());

    const matchesPayment = paymentFilter === 'ALL' || b.paymentStatus === paymentFilter;
    const matchesCheckIn =
      checkInFilter === 'ALL' ||
      (checkInFilter === 'CHECKED_IN' && b.isCheckedIn) ||
      (checkInFilter === 'PENDING' && !b.isCheckedIn);

    const matchesEvent = eventFilter === 'ALL' || String(b.eventId) === String(eventFilter) || b.eventTitle === eventFilter;

    return matchesSearch && matchesPayment && matchesCheckIn && matchesEvent;
  });

  // Calculate Summary Metrics
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'Paid' || b.paymentStatus === 'SUCCESS')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const totalTicketsSold = bookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
  const totalCheckedIn = bookings.filter((b) => b.isCheckedIn).length;
  const totalNotAvailable = bookings.filter((b) => !b.isCheckedIn).length;
  const checkInPercentage = bookings.length > 0 ? Math.round((totalCheckedIn / bookings.length) * 100) : 0;

  // Toggle Gate Check-in Status
  const handleToggleCheckIn = async (b) => {
    const newCheckIn = !b.isCheckedIn;
    try {
      await fetchAPI(`/booking/${b._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isCheckedIn: newCheckIn })
      });
      showToastMsg(newCheckIn ? `Booking ${b.bookingId} marked as Present (Checked In)` : `Reset to Not Available for ${b.bookingId}`);
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Failed to update check-in status', 'error');
    }
  };

  // Toggle Payment Status
  const handlePaymentStatusChange = async (bookingId, newStatus) => {
    try {
      await fetchAPI(`/booking/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: newStatus })
      });
      showToastMsg(`Payment status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Status update failed', 'error');
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking record?')) return;
    try {
      await fetchAPI(`/booking/${bookingId}`, {
        method: 'DELETE'
      });
      showToastMsg('Booking deleted successfully');
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Failed to delete booking', 'error');
    }
  };

  // Export Filtered Bookings to CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      showToastMsg('No booking data to export', 'error');
      return;
    }

    const headers = ['Booking ID', 'Customer Name', 'Email', 'Phone', 'Event Title', 'Ticket Category', 'Qty', 'Unit Price', 'Total Amount', 'Payment Status', 'Attendance Status', 'Check-In Time', 'Gate Staff'];
    const rows = filteredBookings.map((b) => [
      `"${b.bookingId}"`,
      `"${b.userName}"`,
      `"${b.userEmail}"`,
      `"${b.userPhone}"`,
      `"${b.eventTitle}"`,
      `"${b.ticketCategory || 'Standard Pass'}"`,
      b.quantity || 1,
      b.unitPrice || 0,
      b.totalAmount || 0,
      `"${b.paymentStatus || 'Paid'}"`,
      b.isCheckedIn ? 'PRESENT (CHECKED IN)' : 'NOT AVAILABLE / ABSENT',
      `"${b.checkInTime ? new Date(b.checkInTime).toLocaleString() : 'N/A'}"`,
      `"${b.checkedInBy || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vana_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('Attendance CSV report exported successfully!');
  };

  // Handle Manual Booking Submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchAPI('/booking/create', {
        method: 'POST',
        body: JSON.stringify(manualForm)
      });
      showToastMsg('Manual ticket pass issued successfully!');
      setShowManualModal(false);
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Failed to issue pass', 'error');
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="admin-content">
        {/* Floating Toast */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              background: toast.type === 'error' ? '#ef4444' : '#10b981',
              color: '#FFFFFF',
              padding: '14px 24px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              zIndex: 99999,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className={toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'}></i>
            {toast.msg}
          </div>
        )}

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: '#0f172a', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Ticket Bookings & Gate Attendance Overview
            </h2>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>
              Validate scanned QR codes, track present attendees vs not available (absent) ticket holders, and manage bookings
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                background: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-file-csv" style={{ color: '#16a34a' }}></i> Export Attendance Report
            </button>

            <button
              onClick={() => {
                setManualForm({
                  userName: '',
                  userEmail: '',
                  userPhone: '',
                  eventTitle: eventsList.length > 0 ? eventsList[0].title : 'Corporate Leadership Summit',
                  eventId: eventsList.length > 0 ? eventsList[0]._id : '',
                  ticketCategory: 'VIP Pass',
                  quantity: 1,
                  unitPrice: eventsList.length > 0 ? eventsList[0].price || 999 : 999,
                  paymentStatus: 'Paid'
                });
                setShowManualModal(true);
              }}
              className="primary-btn"
              style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-plus"></i> Issue Manual Pass
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <h4>TOTAL BOOKINGS</h4>
            <div className="number">{bookings.length} ({totalTicketsSold} Passes)</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <h4>PRESENT (CHECKED IN)</h4>
            <div className="number" style={{ color: '#10b981' }}>{totalCheckedIn} ({checkInPercentage}%)</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <h4>NOT AVAILABLE (ABSENT)</h4>
            <div className="number" style={{ color: '#ef4444' }}>{totalNotAvailable}</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #ff3b00' }}>
            <h4>GROSS REVENUE</h4>
            <div className="number" style={{ color: '#ff3b00' }}>₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* BOOKINGS TABLE CONTAINER */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}></i>
              <input
                type="text"
                placeholder="Search Booking ID, Customer Name, Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#FFFFFF' }}
              >
                <option value="ALL">All Events</option>
                {eventsList.map((evt) => (
                  <option key={evt._id} value={evt._id}>
                    {evt.title}
                  </option>
                ))}
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#FFFFFF' }}
              >
                <option value="ALL">All Payment Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>

              <select
                value={checkInFilter}
                onChange={(e) => setCheckInFilter(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#FFFFFF' }}
              >
                <option value="ALL">All Gate Attendance</option>
                <option value="CHECKED_IN">✓ Present (Checked In)</option>
                <option value="PENDING">❌ Not Available / Absent</option>
              </select>

              <button
                onClick={loadData}
                style={{ padding: '9px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}
              >
                <i className="fa-solid fa-rotate"></i> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '12px', display: 'block' }}></i>
              Loading live booking records...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <i className="fa-solid fa-receipt fa-2x" style={{ marginBottom: '12px', display: 'block', color: '#cbd5e1' }}></i>
              No ticket booking records match your filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px' }}>BOOKING ID</th>
                    <th style={{ padding: '12px' }}>CUSTOMER DETAILS</th>
                    <th style={{ padding: '12px' }}>EVENT & PASS TIER</th>
                    <th style={{ padding: '12px' }}>QTY</th>
                    <th style={{ padding: '12px' }}>TOTAL PAID</th>
                    <th style={{ padding: '12px' }}>PAYMENT STATUS</th>
                    <th style={{ padding: '12px' }}>GATE ATTENDANCE</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Booking ID */}
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#B8860B', background: '#fef3c7', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {b.bookingId}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                          {new Date(b.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.userName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          <i className="fa-solid fa-envelope" style={{ marginRight: '4px', color: '#94a3b8' }}></i>{b.userEmail}
                        </div>
                        {b.userPhone && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: '4px', color: '#94a3b8' }}></i>{b.userPhone}
                          </div>
                        )}
                      </td>

                      {/* Event Details */}
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.eventTitle}</div>
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '3px' }}>
                          {b.ticketCategory || 'Standard Pass'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>
                        <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>
                          {b.quantity || 1} Ticket(s)
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 800, color: '#ff3b00', fontSize: '1rem' }}>
                          ₹{(b.totalAmount || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Payment Status Dropdown */}
                      <td style={{ padding: '14px 12px' }}>
                        <select
                          value={b.paymentStatus || 'Paid'}
                          onChange={(e) => handlePaymentStatusChange(b._id, e.target.value)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid transparent',
                            background:
                              b.paymentStatus === 'Paid'
                                ? '#dcfce7'
                                : b.paymentStatus === 'Pending'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              b.paymentStatus === 'Paid'
                                ? '#15803d'
                                : b.paymentStatus === 'Pending'
                                ? '#b45309'
                                : '#b91c1c'
                          }}
                        >
                          <option value="Paid">✓ Paid</option>
                          <option value="Pending">⏳ Pending</option>
                          <option value="Failed">✖ Failed</option>
                        </select>
                      </td>

                      {/* Gate Attendance Status */}
                      <td style={{ padding: '14px 12px' }}>
                        <button
                          onClick={() => handleToggleCheckIn(b)}
                          style={{
                            background: b.isCheckedIn ? '#dcfce7' : '#fee2e2',
                            color: b.isCheckedIn ? '#15803d' : '#b91c1c',
                            border: b.isCheckedIn ? '1px solid #bbf7d0' : '1px solid #fca5a5',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Click to toggle gate attendance status"
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: b.isCheckedIn ? '#15803d' : '#ef4444' }}></span>
                          {b.isCheckedIn ? '✓ Present (Checked In)' : '❌ Not Available (Absent)'}
                        </button>

                        {b.isCheckedIn && b.checkInTime && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                            {new Date(b.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {b.checkedInBy || 'Gate'}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedBooking(b)}
                            style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                            title="View Full Ticket Pass & QR Code"
                          >
                            <i className="fa-solid fa-qrcode"></i> Pass
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(b._id)}
                            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                            title="Delete Booking"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* VIEW TICKET PASS & QR CODE MODAL */}
        {selectedBooking && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px'
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
                border: '1px solid #e2e8f0',
                margin: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Official Event Pass Details
                </h3>
                <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}>×</button>
              </div>

              {/* TICKET PASS DISPLAY BOX */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#FFFFFF', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '20px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  VANA ENTERTAINMENTS TICKET PASS
                </div>
                <h4 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: '#FFFFFF' }}>{selectedBooking.eventTitle}</h4>

                {/* QR Code */}
                {selectedBooking.qrCodeUrl ? (
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
                    <img src={selectedBooking.qrCodeUrl} alt="QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ background: '#1e293b', color: '#94a3b8', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px', fontSize: '0.85rem' }}>
                    No QR code rendered
                  </div>
                )}

                <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37', letterSpacing: '0.05em' }}>
                  {selectedBooking.bookingId}
                </div>
              </div>

              {/* DATA DETAILS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#334155', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Attendee Name:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBooking.userName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Customer Email:</span>
                  <strong>{selectedBooking.userEmail}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Phone Contact:</span>
                  <strong>{selectedBooking.userPhone || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Ticket Tier & Qty:</span>
                  <strong>{selectedBooking.ticketCategory || 'Standard Pass'} x {selectedBooking.quantity || 1}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Total Paid:</span>
                  <strong style={{ color: '#ff3b00' }}>₹{(selectedBooking.totalAmount || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Gate Attendance Status:</span>
                  <span style={{ fontWeight: 700, color: selectedBooking.isCheckedIn ? '#15803d' : '#b91c1c' }}>
                    {selectedBooking.isCheckedIn ? `✓ Present (Checked in by ${selectedBooking.checkedInBy || 'Gate'})` : '❌ Not Available (Absent)'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedBooking(null)}
                  style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
                >
                  Close Window
                </button>
                <button
                  onClick={() => window.print()}
                  className="primary-btn"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 700 }}
                >
                  <i className="fa-solid fa-print"></i> Print Ticket Pass
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ISSUE MANUAL PASS MODAL */}
        {showManualModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px'
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '540px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
                border: '1px solid #e2e8f0',
                margin: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  Issue Manual Ticket Pass
                </h3>
                <button onClick={() => setShowManualModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Roy"
                    value={manualForm.userName}
                    onChange={(e) => setManualForm({ ...manualForm, userName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="ananya@example.com"
                      value={manualForm.userEmail}
                      onChange={(e) => setManualForm({ ...manualForm, userEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 9876543210"
                      value={manualForm.userPhone}
                      onChange={(e) => setManualForm({ ...manualForm, userPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Select Target Event *</label>
                  <select
                    value={manualForm.eventId}
                    onChange={(e) => {
                      const selectedEvt = eventsList.find((evt) => evt._id === e.target.value);
                      setManualForm({
                        ...manualForm,
                        eventId: e.target.value,
                        eventTitle: selectedEvt ? selectedEvt.title : manualForm.eventTitle,
                        unitPrice: selectedEvt ? selectedEvt.price || 999 : 999
                      });
                    }}
                  >
                    {eventsList.map((evt) => (
                      <option key={evt._id} value={evt._id}>
                        {evt.title} ({evt.eventDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Pass Tier</label>
                    <input
                      type="text"
                      value={manualForm.ticketCategory}
                      onChange={(e) => setManualForm({ ...manualForm, ticketCategory: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={manualForm.quantity}
                      onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Price (₹)</label>
                    <input
                      type="number"
                      value={manualForm.unitPrice}
                      onChange={(e) => setManualForm({ ...manualForm, unitPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn" style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 700 }}>
                    Issue Pass Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
