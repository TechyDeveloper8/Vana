import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminStaff() {
  const { logout, isStaffHidden, toggleHideStaff } = useAuth();
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [checkInLogs, setCheckInLogs] = useState([]);
  const [totalCheckedIn, setTotalCheckedIn] = useState(0);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [staffSearch, setStaffSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    staffRole: 'Gate Passer',
    assignedEvents: ['ALL']
  });

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, eventsRes, logsRes] = await Promise.all([
        fetchAPI('/admin/staff'),
        fetchAPI('/events'),
        fetchAPI('/admin/staff/checkin-logs')
      ]);

      setStaffList(staffRes.data || []);
      setEventsList(eventsRes.data || []);
      setCheckInLogs(logsRes.data || []);
      setTotalCheckedIn(logsRes.totalCheckedIn || 0);
    } catch (err) {
      showToastMsg(err.message || 'Error loading staff data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto refresh logs every 15 seconds for live attendance tracking
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      staffRole: 'Gate Passer',
      assignedEvents: ['ALL']
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '',
      staffRole: 'Gate Passer',
      assignedEvents: staff.assignedEvents || ['ALL']
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingStaff) {
        // Update existing staff
        await fetchAPI(`/admin/staff/${editingStaff._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        showToastMsg('Staff member account updated successfully!');
      } else {
        // Create new staff
        await fetchAPI('/admin/staff', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        showToastMsg('New staff credentials created successfully!');
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Action failed', 'error');
    }
  };

  const handleToggleStatus = async (staffId) => {
    try {
      const res = await fetchAPI(`/admin/staff/${staffId}/status`, {
        method: 'PATCH'
      });
      showToastMsg(res.message);
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Status toggle failed', 'error');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff account?')) return;

    try {
      await fetchAPI(`/admin/staff/${staffId}`, {
        method: 'DELETE'
      });
      showToastMsg('Staff account removed successfully');
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Failed to delete staff', 'error');
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
      (s.phone || '').toLowerCase().includes(staffSearch.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || s.staffRole === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.isActive !== false) ||
      (statusFilter === 'INACTIVE' && s.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter logs list
  const filteredLogs = checkInLogs.filter((log) => {
    const matchesSearch =
      (log.bookingId || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.staffName || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.eventTitle || '').toLowerCase().includes(logSearch.toLowerCase());

    const matchesStatus = logStatusFilter === 'ALL' || log.status === logStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getRoleBadgeStyle = (role) => {
    return { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' };
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="admin-content">
        {/* Floating Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 999999,
              background: toast.type === 'error' ? '#ef4444' : '#10b981',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* Notice when Staff Management is hidden in navigation */}
        {isStaffHidden && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="fa-solid fa-eye-slash" style={{ color: '#F87171', fontSize: '1.2rem' }}></i>
              <div>
                <strong style={{ color: '#F87171', fontSize: '0.95rem' }}>
                  Staff Management is currently hidden from Admin Navigation.
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  This module is hidden from the sidebar menu. You can unhide it whenever you are ready.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => toggleHideStaff(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '0.85rem'
                }}
              >
                Unhide in Sidebar
              </button>
              <button
                onClick={() => navigate('/admin/dashboard')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: '#141824',
                  color: '#CBD5E1',
                  fontSize: '0.85rem'
                }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Gate Passer Staff Management
            </h1>
            <p style={{ color: 'var(--text-body)', margin: 0, fontSize: '0.95rem' }}>
              Create and manage Gate Passer accounts for entrance ticket QR scanning and seat number validation.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="primary-btn"
            style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-user-plus"></i> Add Gate Passer Staff
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <h4>REGISTERED GATE PASSERS</h4>
            <div className="number">{staffList.length}</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <h4>ACTIVE GATE PASSERS</h4>
            <div className="number" style={{ color: '#10b981' }}>
              {staffList.filter((s) => s.isActive !== false).length}
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
            <h4>TOTAL CHECKED-IN ATTENDEES</h4>
            <div className="number" style={{ color: '#60A5FA' }}>{totalCheckedIn}</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--gold-primary)' }}>
            <h4>LIVE SYNC STATUS</h4>
            <div className="number" style={{ fontSize: '1.4rem', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
              Active 15s
            </div>
          </div>
        </div>

        {/* STAFF MANAGEMENT SECTION */}
        <div style={{ background: '#141824', borderRadius: '16px', border: '1px solid var(--border-light)', padding: '24px', boxShadow: 'var(--shadow-hover)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px', color: 'var(--text-heading)', fontWeight: 700 }}>
                Gate Passer Accounts & Access Control
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0 }}>
                Authorized Gate Passers who validate entrance QR passes and check attendee seat numbers.
              </p>
            </div>

            {/* Filter Toolbar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-accent)', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  placeholder="Search staff name, email..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', background: '#0B0E17', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem', background: '#0B0E17', color: '#F8FAFC' }}
              >
                <option value="ALL">All Staff (Gate Passers)</option>
                <option value="Gate Passer">Gate Passer (QR & Seat Validator)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem', background: '#0B0E17', color: '#F8FAFC' }}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Deactivated Only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '12px', display: 'block' }}></i>
              Loading gate staff accounts...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <i className="fa-solid fa-user-slash fa-2x" style={{ marginBottom: '12px', display: 'block' }}></i>
              No staff accounts match your search filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--gold-accent)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px' }}>STAFF MEMBER</th>
                    <th style={{ padding: '12px' }}>GATE ROLE</th>
                    <th style={{ padding: '12px' }}>CONTACT INFORMATION</th>
                    <th style={{ padding: '12px' }}>ASSIGNED EVENT PERMISSIONS</th>
                    <th style={{ padding: '12px' }}>STATUS</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => {
                    const badge = getRoleBadgeStyle(s.staffRole);
                    return (
                      <tr key={s._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                background: '#0B0E17',
                                color: 'var(--gold-accent)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1rem',
                                border: '1px solid rgba(212, 175, 55, 0.3)'
                              }}
                            >
                              {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.95rem' }}>{s.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>ID: {s._id.slice(-6).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, ...badge, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-qrcode"></i> Gate Passer
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '3px' }}>QR & Seat Validator</div>
                        </td>

                        <td style={{ padding: '14px 12px', fontSize: '0.88rem', color: '#CBD5E1' }}>
                          <div><i className="fa-solid fa-envelope" style={{ color: 'var(--gold-accent)', marginRight: '6px' }}></i>{s.email}</div>
                          {s.phone && (
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                              <i className="fa-solid fa-phone" style={{ color: 'var(--gold-accent)', marginRight: '6px' }}></i>{s.phone}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          {s.assignedEvents?.includes('ALL') ? (
                            <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-accent)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                              <i className="fa-solid fa-globe" style={{ marginRight: '4px' }}></i> All Events Access
                            </span>
                          ) : (
                            <span style={{ background: '#0B0E17', color: '#CBD5E1', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                              <i className="fa-solid fa-ticket" style={{ marginRight: '4px' }}></i> {s.assignedEvents?.length || 0} Specific Gate(s)
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          <button
                            onClick={() => handleToggleStatus(s._id)}
                            style={{
                              background: s.isActive !== false ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: s.isActive !== false ? '#4ADE80' : '#F87171',
                              border: s.isActive !== false ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.isActive !== false ? '#4ADE80' : '#F87171' }}></span>
                            {s.isActive !== false ? 'Active' : 'Deactivated'}
                          </button>
                        </td>

                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditModal(s)}
                              style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: 'var(--gold-accent)' }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(s._id)}
                              style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: '#F87171' }}
                            >
                              <i className="fa-solid fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RECENT CHECK-IN AUDIT LOGS */}
        <div style={{ background: '#141824', borderRadius: '16px', border: '1px solid var(--border-light)', padding: '24px', boxShadow: 'var(--shadow-hover)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px', color: 'var(--text-heading)', fontWeight: 700 }}>
                Live Entrance Scan & Seat Verification Logs
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0 }}>
                Real-time stream of QR scans and seat allocations verified by Gate Passers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-accent)', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  placeholder="Search attendee, ticket ID, seats..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', background: '#0B0E17', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.85rem', background: '#0B0E17', color: '#F8FAFC' }}
              >
                <option value="ALL">All Scan Outcomes</option>
                <option value="SUCCESS">Entry Granted (Valid)</option>
                <option value="DUPLICATE">Warning: Already Scanned</option>
                <option value="INVALID">Invalid Code Rejected</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--gold-accent)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px' }}>BOOKING ID</th>
                  <th style={{ padding: '12px' }}>ATTENDEE & SEATS</th>
                  <th style={{ padding: '12px' }}>EVENT</th>
                  <th style={{ padding: '12px' }}>GATE PASSER</th>
                  <th style={{ padding: '12px' }}>RESULT</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No check-in audit logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <td style={{ padding: '12px', color: '#CBD5E1', fontWeight: 500 }}>
                        {new Date(log.scanTimestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--gold-accent)' }}>{log.bookingId}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{log.userName || 'N/A'}</div>
                        {log.seatNumbers ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-chair"></i> Seats: {log.seatNumbers}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{log.ticketCategory || 'Pass'}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: '#CBD5E1' }}>{log.eventTitle || 'Vana Venue Gate'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{log.staffName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>
                          <i className="fa-solid fa-qrcode"></i> Gate Passer
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background:
                              log.status === 'SUCCESS'
                                ? 'rgba(34, 197, 94, 0.12)'
                                : log.status === 'DUPLICATE'
                                  ? 'rgba(212, 175, 55, 0.15)'
                                  : 'rgba(239, 68, 68, 0.12)',
                            color:
                              log.status === 'SUCCESS'
                                ? '#4ADE80'
                                : log.status === 'DUPLICATE'
                                  ? 'var(--gold-accent)'
                                  : '#F87171',
                            border:
                              log.status === 'SUCCESS'
                                ? '1px solid rgba(34, 197, 94, 0.3)'
                                : log.status === 'DUPLICATE'
                                  ? '1px solid rgba(212, 175, 55, 0.3)'
                                  : '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          {log.status === 'SUCCESS' ? '✓ CHECKED IN' : log.status === 'DUPLICATE' ? '⚠ ALREADY USED' : '✖ INVALID'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE / EDIT GATE PASSER MODAL */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(10, 13, 20, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
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
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                border: '1px solid var(--border-light)',
                margin: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {editingStaff ? 'Edit Gate Passer Account' : 'Create Gate Passer Credentials'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#CBD5E1', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Staff Member Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Email / Login Username *</label>
                    <input
                      type="email"
                      required
                      placeholder="gatepasser@vana.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>
                    {editingStaff ? 'Password (leave blank to keep unchanged)' : 'Account Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingStaff}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                {/* GATE PASSER ROLE FIXED DEFINITION */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Staff Role & Purpose</label>
                  <div
                    style={{
                      background: '#0B0E17',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(34, 197, 94, 0.12)',
                        color: '#4ADE80',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fa-solid fa-qrcode"></i> Gate Passer
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      Validates ticket QR passes and verifies attendee seat numbers at the venue entrance.
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Assigned Events *</label>
                  <select
                    multiple
                    value={formData.assignedEvents}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                      setFormData({ ...formData, assignedEvents: selected });
                    }}
                    style={{ height: '95px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  >
                    <option value="ALL">All Current & Future Events</option>
                    {eventsList.map((evt) => (
                      <option key={evt._id} value={evt._id}>
                        {evt.title} ({evt.eventDate})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', marginTop: '4px', display: 'block' }}>Hold Ctrl (or Cmd) to select multiple specific events.</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '12px', background: '#0B0E17', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#CBD5E1' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-btn"
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 700 }}
                  >
                    {editingStaff ? 'Save Changes' : 'Create Gate Passer'}
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
