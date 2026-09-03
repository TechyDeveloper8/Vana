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
  const initialManualForm = {
    userName: '',
    userEmail: '',
    userPhone: '',
    eventTitle: '',
    eventId: '',
    showtimeDate: '',
    ticketCategory: 'Platinum Pass',
    section: 'Ground Floor Center',
    seatNumbers: '',
    quantity: 1,
    unitPrice: 1499,
    paymentGateway: 'Admin Manual Entry',
    paymentMethod: 'Cash at Counter',
    paymentStatus: 'Paid',
    sendEmail: true
  };
  const [manualForm, setManualForm] = useState(initialManualForm);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

  // Validate Manual Booking Form
  const validateManualForm = () => {
    const errors = {};
    if (!manualForm.userName || !manualForm.userName.trim()) {
      errors.userName = 'Customer full name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!manualForm.userEmail || !manualForm.userEmail.trim()) {
      errors.userEmail = 'Customer email is required for ticket delivery';
    } else if (!emailRegex.test(manualForm.userEmail.trim())) {
      errors.userEmail = 'Please enter a valid email address (e.g. name@domain.com)';
    }
    if (!manualForm.userPhone || !manualForm.userPhone.trim()) {
      errors.userPhone = 'Mobile number is required';
    } else if (manualForm.userPhone.replace(/\D/g, '').length < 7) {
      errors.userPhone = 'Enter at least 7 digits for phone number';
    }
    if (!manualForm.eventId) {
      errors.eventId = 'Please select a valid event';
    }
    if (Number(manualForm.quantity) < 1) {
      errors.quantity = 'Quantity must be 1 or more';
    }
    if (Number(manualForm.unitPrice) < 0) {
      errors.unitPrice = 'Price cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Manual Booking Submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!validateManualForm()) {
      showToastMsg('Please fix the highlighted form errors before proceeding.', 'error');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await fetchAPI('/booking/create', {
        method: 'POST',
        body: JSON.stringify(manualForm)
      });

      if (res.success) {
        showToastMsg(
          res.emailSent
            ? `✓ Manual booking confirmed & ticket pass emailed to ${manualForm.userEmail}!`
            : `✓ Manual booking confirmed! (${res.emailError || 'Offline notice'})`
        );
        setShowManualModal(false);
        setManualForm(initialManualForm);
        setFormErrors({});
        loadData();

        // Immediately open pass preview so admin can inspect or print the generated pass
        if (res.booking) {
          setSelectedBooking(res.booking);
        }
      } else {
        showToastMsg(res.message || 'Failed to issue pass', 'error');
      }
    } catch (err) {
      showToastMsg(err.message || 'Failed to issue ticket pass', 'error');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Open manual modal and pre-sync event and pricing from Event Management
  const handleOpenManualModal = () => {
    let targetEvt = null;
    if (eventFilter && eventFilter !== 'ALL') {
      targetEvt = eventsList.find((e) => String(e._id) === String(eventFilter) || e.title === eventFilter);
    }
    if (!targetEvt && eventsList.length > 0) {
      targetEvt = eventsList[0];
    }

    if (targetEvt) {
      const hasTiers = targetEvt.ticketTiers && targetEvt.ticketTiers.length > 0;
      const defaultTier = hasTiers ? targetEvt.ticketTiers[0].tierName : 'Standard Admission';
      const defaultPrice = hasTiers ? targetEvt.ticketTiers[0].price : (targetEvt.price !== undefined ? targetEvt.price : 500);

      let defaultSection = 'Ground Floor Center';
      if (defaultTier.toLowerCase().includes('first floor') || defaultTier.toLowerCase().includes('1a')) {
        defaultSection = 'First Floor Right Wing';
      } else if (defaultTier.toLowerCase().includes('vip') || defaultTier.toLowerCase().includes('lounge')) {
        defaultSection = 'VIP Lounge';
      }

      setManualForm({
        ...initialManualForm,
        eventId: targetEvt._id,
        eventTitle: targetEvt.title,
        showtimeDate: targetEvt.eventDate ? `${targetEvt.eventDate}${targetEvt.startTime ? ` ${targetEvt.startTime}` : ''}` : '',
        ticketCategory: defaultTier,
        unitPrice: defaultPrice,
        section: defaultSection
      });
    } else {
      setManualForm(initialManualForm);
    }
    setFormErrors({});
    setShowManualModal(true);
  };

  const currentSelectedEvent = eventsList.find((evt) => String(evt._id) === String(manualForm.eventId));

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
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-heading)', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Ticket Bookings & Gate Attendance Overview
            </h2>
            <p style={{ color: 'var(--text-body)', margin: '4px 0 0' }}>
              Validate scanned QR codes, track present attendees vs not available (absent) ticket holders, and manage bookings
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                background: '#141824',
                color: '#F8FAFC',
                border: '1px solid var(--border-light)',
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
              <i className="fa-solid fa-file-csv" style={{ color: '#4ADE80' }}></i> Export Attendance Report
            </button>

            <button
              onClick={handleOpenManualModal}
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

          <div className="stat-card" style={{ borderLeft: '4px solid var(--gold-primary)' }}>
            <h4>GROSS REVENUE</h4>
            <div className="number" style={{ color: 'var(--gold-accent)' }}>₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* BOOKINGS TABLE CONTAINER */}
        <div style={{ background: '#141824', borderRadius: '16px', border: '1px solid var(--border-light)', padding: '24px', boxShadow: 'var(--shadow-hover)' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-accent)', fontSize: '0.9rem' }}></i>
              <input
                type="text"
                placeholder="Search Booking ID, Customer Name, Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  background: '#0B0E17',
                  color: '#F8FAFC',
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
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem', background: '#0B0E17', color: '#F8FAFC' }}
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
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem', background: '#0B0E17', color: '#F8FAFC' }}
              >
                <option value="ALL">All Payment Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>

              <select
                value={checkInFilter}
                onChange={(e) => setCheckInFilter(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem', background: '#0B0E17', color: '#F8FAFC' }}
              >
                <option value="ALL">All Gate Attendance</option>
                <option value="CHECKED_IN">✓ Present (Checked In)</option>
                <option value="PENDING">❌ Not Available / Absent</option>
              </select>

              <button
                onClick={loadData}
                style={{ padding: '9px 16px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--gold-accent)' }}
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
                  <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--gold-accent)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
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
                    <tr key={b._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      {/* Booking ID */}
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--gold-accent)', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {b.bookingId}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                          {new Date(b.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{b.userName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                          <i className="fa-solid fa-envelope" style={{ marginRight: '4px', color: 'var(--gold-accent)' }}></i>{b.userEmail}
                        </div>
                        {b.userPhone && (
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '1px' }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: '4px', color: 'var(--gold-accent)' }}></i>{b.userPhone}
                          </div>
                        )}
                      </td>

                      {/* Event Details */}
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{b.eventTitle}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                            {b.ticketCategory || 'Standard Pass'}
                          </span>
                          {b.showtimeDate && b.showtimeDate !== 'Default' && (
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                              <i className="fa-regular fa-clock" style={{ marginRight: '3px' }}></i>
                              {isNaN(new Date(b.showtimeDate)) ? b.showtimeDate : new Date(b.showtimeDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Allocated Seats Badges */}
                        {b.selectedSeats && b.selectedSeats.length > 0 && (
                          <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {b.selectedSeats.map((s) => (
                              <span
                                key={s.seatId || s.displayLabel}
                                style={{
                                  fontSize: '0.7rem',
                                  background: '#0B0E17',
                                  color: 'var(--gold-accent)',
                                  border: '1px solid rgba(212, 175, 55, 0.35)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700
                                }}
                              >
                                Seat {s.displayLabel || s.seatId}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 12px', fontWeight: 700, color: '#F8FAFC' }}>
                        <span style={{ background: '#0B0E17', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>
                          {b.quantity || 1} Ticket(s)
                        </span>
                      </td>

                      {/* Total Amount & Payment Info */}
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--gold-accent)', fontSize: '1rem' }}>
                          ₹{(b.totalAmount || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 600, marginTop: '2px' }}>
                          <i className="fa-solid fa-shield-check" style={{ marginRight: '3px' }}></i>
                          {b.paymentGateway || 'Cashfree'} ({b.paymentMethod || 'PG'})
                        </div>
                        {b.cashfreeOrderId && (
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                            {b.cashfreeOrderId}
                          </div>
                        )}
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
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                            background: '#0B0E17',
                            color:
                              b.paymentStatus === 'Paid'
                                ? '#4ADE80'
                                : b.paymentStatus === 'Pending'
                                ? 'var(--gold-accent)'
                                : '#F87171'
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
                            background: b.isCheckedIn ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: b.isCheckedIn ? '#4ADE80' : '#F87171',
                            border: b.isCheckedIn ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
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
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: b.isCheckedIn ? '#4ADE80' : '#F87171' }}></span>
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
                            style={{ background: '#0B0E17', color: 'var(--gold-accent)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                            title="View Full Ticket Pass & QR Code"
                          >
                            <i className="fa-solid fa-qrcode"></i> Pass
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(b._id)}
                            style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
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
                background: '#141824',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                border: '1px solid var(--border-light)',
                margin: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  Official Event Pass Details
                </h3>
                <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}>×</button>
              </div>

              {/* TICKET PASS DISPLAY BOX */}
              <div style={{ background: '#0B0E17', color: '#FFFFFF', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '20px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  VANA ENTERTAINMENTS TICKET PASS
                </div>
                <h4 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: '#F8FAFC' }}>{selectedBooking.eventTitle}</h4>

                {/* QR Code */}
                {selectedBooking.qrCodeUrl ? (
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
                    <img src={selectedBooking.qrCodeUrl} alt="QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ background: '#141824', color: '#94a3b8', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px', fontSize: '0.85rem' }}>
                    No QR code rendered
                  </div>
                )}

                <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-accent)', letterSpacing: '0.05em' }}>
                  {selectedBooking.bookingId}
                </div>
              </div>

              {/* DATA DETAILS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#CBD5E1', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Attendee Name:</span>
                  <strong style={{ color: '#F8FAFC' }}>{selectedBooking.userName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Customer Email:</span>
                  <strong style={{ color: '#F8FAFC' }}>{selectedBooking.userEmail}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Phone Contact:</span>
                  <strong style={{ color: '#F8FAFC' }}>{selectedBooking.userPhone || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Performance Showtime:</span>
                  <strong style={{ color: 'var(--gold-accent)' }}>
                    {selectedBooking.showtimeDate && selectedBooking.showtimeDate !== 'Default'
                      ? (isNaN(new Date(selectedBooking.showtimeDate)) ? selectedBooking.showtimeDate : new Date(selectedBooking.showtimeDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
                      : 'Main Performance Show'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Ticket Tier & Qty:</span>
                  <strong style={{ color: '#F8FAFC' }}>{selectedBooking.ticketCategory || 'Standard Pass'} x {selectedBooking.quantity || 1}</strong>
                </div>

                {/* Allocated Seats Detailed Breakdown */}
                {selectedBooking.selectedSeats && selectedBooking.selectedSeats.length > 0 && (
                  <div style={{ background: '#0B0E17', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', margin: '4px 0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Allocated Seat Numbers ({selectedBooking.selectedSeats.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedBooking.selectedSeats.map((s) => (
                        <span
                          key={s.seatId || s.displayLabel}
                          style={{
                            background: '#141824',
                            border: '1px solid rgba(212, 175, 55, 0.4)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--gold-accent)'
                          }}
                        >
                          Seat {s.displayLabel || s.seatId}
                          <span style={{ color: '#F8FAFC', fontSize: '0.7rem', marginLeft: '4px' }}>
                            ({s.category || 'General'})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Subtotal:</span>
                  <span style={{ color: '#F8FAFC' }}>₹{(selectedBooking.subtotal || selectedBooking.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>GST (18%):</span>
                  <span style={{ color: '#F8FAFC' }}>₹{(selectedBooking.gst || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Total Paid:</span>
                  <strong style={{ color: 'var(--gold-accent)', fontSize: '1rem' }}>₹{(selectedBooking.totalAmount || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Payment Gateway:</span>
                  <strong style={{ color: '#4ADE80' }}>
                    {selectedBooking.paymentGateway || 'Cashfree'} ({selectedBooking.paymentMethod || 'PG'})
                  </strong>
                </div>
                {selectedBooking.cashfreeOrderId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94A3B8' }}>Cashfree Order ID:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{selectedBooking.cashfreeOrderId}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Gate Attendance Status:</span>
                  <span style={{ fontWeight: 700, color: selectedBooking.isCheckedIn ? '#4ADE80' : '#F87171' }}>
                    {selectedBooking.isCheckedIn ? `✓ Present (Checked in by ${selectedBooking.checkedInBy || 'Gate'})` : '❌ Not Available (Absent)'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedBooking(null)}
                  style={{ flex: 1, padding: '12px', background: '#0B0E17', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#CBD5E1' }}
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
                background: '#141824',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '540px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                border: '1px solid var(--border-light)',
                margin: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                      Issue Manual Ticket Pass
                    </h3>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-accent)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                      Walk-in / VIP Desk
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    All fields are validated. Entrance pass and QR code are automatically emailed upon creation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  style={{ background: '#0B0E17', border: '1px solid rgba(255, 255, 255, 0.1)', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.1rem', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. CUSTOMER CREDENTIALS */}
                <div style={{ background: '#0B0E17', padding: '14px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-accent)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    <i className="fa-solid fa-user" style={{ marginRight: '6px' }}></i>
                    1. Customer Information (For Pass & Verification)
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={manualForm.userName}
                      onChange={(e) => {
                        setManualForm({ ...manualForm, userName: e.target.value });
                        if (formErrors.userName) setFormErrors({ ...formErrors, userName: null });
                      }}
                      style={{ borderColor: formErrors.userName ? '#EF4444' : 'rgba(212, 175, 55, 0.25)', background: '#141824', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.88rem' }}
                    />
                    {formErrors.userName && <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>{formErrors.userName}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>
                        Email Address * <span style={{ fontSize: '0.7rem', color: 'var(--gold-accent)', fontWeight: 500 }}>(Ticket will be sent here)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={manualForm.userEmail}
                        onChange={(e) => {
                          setManualForm({ ...manualForm, userEmail: e.target.value });
                          if (formErrors.userEmail) setFormErrors({ ...formErrors, userEmail: null });
                        }}
                        style={{ borderColor: formErrors.userEmail ? '#EF4444' : 'rgba(212, 175, 55, 0.25)', background: '#141824', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.88rem' }}
                      />
                      {formErrors.userEmail && <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>{formErrors.userEmail}</span>}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Mobile / Phone *</label>
                      <input
                        type="text"
                        placeholder="+91 9876543210"
                        value={manualForm.userPhone}
                        onChange={(e) => {
                          setManualForm({ ...manualForm, userPhone: e.target.value });
                          if (formErrors.userPhone) setFormErrors({ ...formErrors, userPhone: null });
                        }}
                        style={{ borderColor: formErrors.userPhone ? '#EF4444' : 'rgba(212, 175, 55, 0.25)', background: '#141824', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.88rem' }}
                      />
                      {formErrors.userPhone && <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>{formErrors.userPhone}</span>}
                    </div>
                  </div>
                </div>

                {/* 2. EVENT & SHOWTIME SCHEDULE */}
                <div style={{ background: '#0B0E17', padding: '14px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-accent)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                    2. Event & Performance Schedule
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Select Target Event *</label>
                      <select
                        value={manualForm.eventId}
                        onChange={(e) => {
                          const selectedEvt = eventsList.find((evt) => String(evt._id) === String(e.target.value));
                          if (selectedEvt) {
                            const hasTiers = selectedEvt.ticketTiers && selectedEvt.ticketTiers.length > 0;
                            const defaultTier = hasTiers ? selectedEvt.ticketTiers[0].tierName : 'Standard Admission';
                            const defaultPrice = hasTiers ? selectedEvt.ticketTiers[0].price : (selectedEvt.price !== undefined ? selectedEvt.price : 500);

                            let defaultSection = 'Ground Floor Center';
                            if (defaultTier.toLowerCase().includes('first floor') || defaultTier.toLowerCase().includes('1a')) {
                              defaultSection = 'First Floor Right Wing';
                            } else if (defaultTier.toLowerCase().includes('vip') || defaultTier.toLowerCase().includes('lounge')) {
                              defaultSection = 'VIP Lounge';
                            }

                            setManualForm({
                              ...manualForm,
                              eventId: selectedEvt._id,
                              eventTitle: selectedEvt.title,
                              showtimeDate: selectedEvt.eventDate ? `${selectedEvt.eventDate}${selectedEvt.startTime ? ` ${selectedEvt.startTime}` : ''}` : manualForm.showtimeDate,
                              ticketCategory: defaultTier,
                              unitPrice: defaultPrice,
                              section: defaultSection
                            });
                          } else {
                            setManualForm({
                              ...manualForm,
                              eventId: '',
                              eventTitle: '',
                              unitPrice: 0,
                              ticketCategory: 'Standard Pass'
                            });
                          }
                          if (formErrors.eventId) setFormErrors({ ...formErrors, eventId: null });
                        }}
                        style={{ borderColor: formErrors.eventId ? '#EF4444' : 'rgba(212, 175, 55, 0.25)', background: '#141824', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="">-- Choose Event --</option>
                        {eventsList.map((evt) => (
                          <option key={evt._id} value={evt._id}>
                            {evt.title} ({evt.eventDate || 'Upcoming'}) — Base ₹{evt.price ?? 0}
                          </option>
                        ))}
                      </select>
                      {formErrors.eventId && <span style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>{formErrors.eventId}</span>}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Showtime Date & Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 2026-10-15 18:30"
                        value={manualForm.showtimeDate}
                        onChange={(e) => setManualForm({ ...manualForm, showtimeDate: e.target.value })}
                        style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* EVENT MANAGEMENT PRICING SYNC BANNER */}
                  {currentSelectedEvent && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        background: 'rgba(212, 175, 55, 0.12)',
                        borderRadius: '10px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', color: 'var(--gold-accent)', fontWeight: 600 }}>
                        <i className="fa-solid fa-bolt" style={{ color: 'var(--gold-primary)', marginRight: '6px' }}></i>
                        <strong>Pricing Synced from Event Management:</strong> Base ₹{currentSelectedEvent.price ?? 0}
                        {currentSelectedEvent.ticketTiers?.length > 0 && (
                          <span style={{ marginLeft: '6px', color: '#CBD5E1' }}>
                            • {currentSelectedEvent.ticketTiers.length} Configured Tier(s) ({currentSelectedEvent.ticketTiers.map(t => `${t.tierName.split(' ')[0]}: ₹${t.price}`).join(', ')})
                          </span>
                        )}
                      </div>
                      <Link
                        to="/admin/events"
                        target="_blank"
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--gold-primary)',
                          textDecoration: 'underline',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Open Event Management to adjust event prices"
                      >
                        <i className="fa-solid fa-sliders"></i> Event Management Settings ↗
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3. SEAT ALLOCATION & TIER */}
                <div style={{ background: '#0B0E17', padding: '14px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-accent)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    <i className="fa-solid fa-chair" style={{ marginRight: '6px' }}></i>
                    3. Seat Allocation & Tier
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>
                        Pass Tier / Category <span style={{ fontSize: '0.7rem', color: '#4ADE80', fontWeight: 700 }}>(Auto-prices from Event)</span>
                      </label>
                      <select
                        value={manualForm.ticketCategory}
                        onChange={(e) => {
                          const chosenTier = e.target.value;
                          let newPrice = manualForm.unitPrice;
                          let newSection = manualForm.section;

                          if (chosenTier === 'Complimentary VIP') {
                            newPrice = 0;
                          } else if (currentSelectedEvent?.ticketTiers?.length > 0) {
                            const match = currentSelectedEvent.ticketTiers.find((t) => t.tierName === chosenTier);
                            if (match) {
                              newPrice = match.price;
                              if (match.tierName.toLowerCase().includes('first floor')) {
                                newSection = 'First Floor Right Wing';
                              } else if (match.tierName.toLowerCase().includes('vip')) {
                                newSection = 'VIP Lounge';
                              } else if (match.tierName.toLowerCase().includes('ground') || match.tierName.toLowerCase().includes('platinum') || match.tierName.toLowerCase().includes('gold')) {
                                newSection = 'Ground Floor Center';
                              }
                            }
                          } else if (currentSelectedEvent?.price !== undefined) {
                            newPrice = currentSelectedEvent.price;
                          }

                          setManualForm({
                            ...manualForm,
                            ticketCategory: chosenTier,
                            unitPrice: newPrice,
                            section: newSection
                          });
                        }}
                        style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.85rem' }}
                      >
                        {currentSelectedEvent?.ticketTiers && currentSelectedEvent.ticketTiers.length > 0 ? (
                          <>
                            {currentSelectedEvent.ticketTiers.map((tier, idx) => (
                              <option key={idx} value={tier.tierName}>
                                {tier.tierName} — ₹{tier.price.toLocaleString('en-IN')} (from Event Mgmt)
                              </option>
                            ))}
                            <option value="Complimentary VIP">Complimentary VIP — ₹0 (Free)</option>
                          </>
                        ) : currentSelectedEvent ? (
                          <>
                            <option value="Standard Admission">
                              Standard Admission — ₹{(currentSelectedEvent.price || 0).toLocaleString('en-IN')} (from Event Mgmt)
                            </option>
                            <option value="Complimentary VIP">Complimentary VIP — ₹0 (Free)</option>
                          </>
                        ) : (
                          <option value="">-- Choose an Event Above First --</option>
                        )}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Venue Section / Floor</label>
                      <select
                        value={manualForm.section}
                        onChange={(e) => setManualForm({ ...manualForm, section: e.target.value })}
                        style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Ground Floor Center">Ground Floor Center</option>
                        <option value="First Floor Right Wing">First Floor Right Wing</option>
                        <option value="First Floor Left Wing">First Floor Left Wing</option>
                        <option value="VIP Lounge">VIP Lounge Section</option>
                        <option value="General Admission">General Admission</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>
                      Specific Seat Numbers <span style={{ fontWeight: 400, color: 'var(--gold-accent)' }}>(Comma separated, e.g. 1A-14, 1A-15 or Q12)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1A-14, 1A-15 or Q12, Q13"
                      value={manualForm.seatNumbers}
                      onChange={(e) => {
                        const val = e.target.value;
                        const seats = val.split(',').map(s => s.trim()).filter(Boolean);
                        const update = { ...manualForm, seatNumbers: val };
                        if (seats.length > 0) {
                          update.quantity = seats.length;
                        }
                        setManualForm(update);
                      }}
                      style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.88rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '3px', display: 'block' }}>
                      Allocated seats are permanently locked as "Booked" in the live venue layout.
                    </span>
                  </div>
                </div>

                {/* 4. BILLING, PAYMENT & LIVE TOTAL */}
                <div style={{ background: '#0B0E17', padding: '14px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-accent)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }}></i>
                    4. Payment & Billing Details
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Ticket Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={manualForm.quantity}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setManualForm({ ...manualForm, quantity: val });
                        }}
                        style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Unit Price per Pass (₹) *</label>
                        {currentSelectedEvent && (
                          <span style={{ fontSize: '0.7rem', color: '#4ADE80', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            <i className="fa-solid fa-link"></i> Linked from Event Management
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={manualForm.unitPrice}
                        onChange={(e) => setManualForm({ ...manualForm, unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                        style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.88rem' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '3px', display: 'block' }}>
                        Price auto-redirected from Event Management. You can override if giving a special discount.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Payment Method</label>
                      <select
                        value={manualForm.paymentMethod}
                        onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                        style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Cash at Counter">Cash at Counter</option>
                        <option value="UPI / QR Code Scan">UPI / QR Code Scan</option>
                        <option value="Card (POS at Venue)">Card (POS at Venue)</option>
                        <option value="Bank Transfer / NEFT / IMPS">Bank Transfer / NEFT / IMPS</option>
                        <option value="Complimentary VIP Guest">Complimentary VIP Guest (Free)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Payment Status</label>
                      <select
                        value={manualForm.paymentStatus}
                        onChange={(e) => setManualForm({ ...manualForm, paymentStatus: e.target.value })}
                        style={{ background: '#141824', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '10px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Paid">Paid (Verified)</option>
                        <option value="Pending">Payment Pending</option>
                      </select>
                    </div>
                  </div>

                  {/* LIVE PRICING BREAKDOWN */}
                  {(() => {
                    const subtotal = (Number(manualForm.quantity) || 1) * (Number(manualForm.unitPrice) || 0);
                    const gst = Math.round(subtotal * 0.18);
                    const total = subtotal + gst;
                    return (
                      <div style={{ background: '#141824', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '4px' }}>
                          <span>Subtotal ({manualForm.quantity} x ₹{manualForm.unitPrice}):</span>
                          <span style={{ color: '#F8FAFC' }}>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '4px' }}>
                          <span>GST Tax (18%):</span>
                          <span style={{ color: '#F8FAFC' }}>₹{gst.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(212, 175, 55, 0.25)', paddingTop: '6px', fontWeight: 800, color: 'var(--gold-accent)', fontSize: '1rem' }}>
                          <span>Total Amount to Collect:</span>
                          <span>₹{total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 5. EMAIL DISPATCH OPTION */}
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="sendEmailCheck"
                    checked={manualForm.sendEmail}
                    onChange={(e) => setManualForm({ ...manualForm, sendEmail: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold-primary)' }}
                  />
                  <label htmlFor="sendEmailCheck" style={{ fontSize: '0.85rem', color: 'var(--gold-accent)', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                    <i className="fa-solid fa-envelope" style={{ marginRight: '6px' }}></i>
                    Automatically dispatch official entrance QR ticket pass to <strong>{manualForm.userEmail || 'customer email'}</strong>
                  </label>
                </div>

                {/* MODAL ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    disabled={submittingManual}
                    style={{ flex: 1, padding: '12px', background: '#0B0E17', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#CBD5E1' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingManual}
                    className="primary-btn"
                    style={{ flex: 2, padding: '12px', borderRadius: '8px', fontWeight: 700, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {submittingManual ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        Issuing Pass & Sending Email...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        Issue Pass & Send Ticket Email
                      </>
                    )}
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
