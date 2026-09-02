import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminStaff() {
  const { logout } = useAuth();
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
    staffRole: 'Gate Entry',
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
      staffRole: 'Gate Entry',
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
      staffRole: staff.staffRole || 'Gate Entry',
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
    switch (role) {
      case 'VIP Entry':
        return { background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' };
      case 'Security':
        return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' };
      case 'Registration Desk':
        return { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' };
      default:
        return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="admin-content">
        {/* Floating Toast Notification */}
        {
          toast && (
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
                zIndex: 9999,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <i className={toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'}></i>
              {toast.msg}
            </div>
          )
        }

        {/* Header Bar */}
       /* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: '#0f172a', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Staff Management & Gate Verification
            </h2>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>
              Create gate staff credentials, assign event permissions, and monitor real-time check-ins
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="primary-btn"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-user-plus"></i> Create Staff Account
          </button>
        </div>

        {/* Stats Counter Grid */}
       /* <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <h4>TOTAL STAFF ACCOUNTS</h4>
            <div className="number">{staffList.length}</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <h4>ACTIVE GATE STAFF</h4>
            <div className="number" style={{ color: '#10b981' }}>
              {staffList.filter((s) => s.isActive !== false).length}
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
            <h4>TOTAL CHECKED-IN ATTENDEES</h4>
            <div className="number" style={{ color: '#2563eb' }}>{totalCheckedIn}</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #B8860B' }}>
            <h4>LIVE SYNC STATUS</h4>
            <div className="number" style={{ fontSize: '1.4rem', color: '#B8860B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
              Active 15s
            </div>
          </div>
        </div>

        {/* STAFF MANAGEMENT SECTION */}
        /*<div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px', color: '#0f172a', fontWeight: 700 }}>
                Gate Staff Credentials & Access Control
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Manage staff authorization, gate roles, and assigned event permissions.
              </p>
            </div>

            {/* Filter Toolbar */}
          /*  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  placeholder="Search staff name, email..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#FFFFFF' }}
              >
                <option value="ALL">All Gate Roles</option>
                <option value="Gate Entry">Gate Entry</option>
                <option value="VIP Entry">VIP Red Carpet Entry</option>
                <option value="Registration Desk">Registration Desk</option>
                <option value="Security">Security & Access Control</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#FFFFFF' }}
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
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
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
                      <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                color: '#D4AF37',
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
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{s.name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {s._id.slice(-6).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, ...badge }}>
                            {s.staffRole || 'Gate Entry'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 12px', fontSize: '0.88rem', color: '#334155' }}>
                          <div><i className="fa-solid fa-envelope" style={{ color: '#94a3b8', marginRight: '6px' }}></i>{s.email}</div>
                          {s.phone && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              <i className="fa-solid fa-phone" style={{ color: '#94a3b8', marginRight: '6px' }}></i>{s.phone}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          {s.assignedEvents?.includes('ALL') ? (
                            <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                              <i className="fa-solid fa-globe" style={{ marginRight: '4px' }}></i> All Events Access
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                              <i className="fa-solid fa-ticket" style={{ marginRight: '4px' }}></i> {s.assignedEvents?.length || 0} Specific Gate(s)
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          <button
                            onClick={() => handleToggleStatus(s._id)}
                            style={{
                              background: s.isActive !== false ? '#dcfce7' : '#fee2e2',
                              color: s.isActive !== false ? '#15803d' : '#b91c1c',
                              border: s.isActive !== false ? '1px solid #bbf7d0' : '1px solid #fecaca',
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
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.isActive !== false ? '#15803d' : '#b91c1c' }}></span>
                            {s.isActive !== false ? 'Active' : 'Deactivated'}
                          </button>
                        </td>

                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditModal(s)}
                              style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(s._id)}
                              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              <i className="fa-solid fa-trash-can"></i> Delete
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

        {/* REAL-TIME ATTENDANCE CHECK-IN LOGS STREAM */}
       /* <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px', color: '#0f172a', fontWeight: 700 }}>
                Live Gate Check-In Audit Logs
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Real-time synchronized record of all ticket verification attempts across event gates.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#FFFFFF' }}
              >
                <option value="ALL">All Scan Results</option>
                <option value="SUCCESS">Checked In (Success)</option>
                <option value="DUPLICATE">Duplicate Warning</option>
                <option value="INVALID">Invalid QR / Code</option>
              </select>

              <button
                onClick={loadData}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-rotate"></i> Refresh
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px' }}>BOOKING ID</th>
                  <th style={{ padding: '12px' }}>ATTENDEE NAME</th>
                  <th style={{ padding: '12px' }}>EVENT GATE</th>
                  <th style={{ padding: '12px' }}>VERIFIED BY STAFF</th>
                  <th style={{ padding: '12px' }}>SCAN RESULT</th>
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
                    <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569', fontWeight: 500 }}>
                        {new Date(log.scanTimestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{log.bookingId}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{log.userName || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{log.eventTitle || 'General Gate'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.staffName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.staffRole}</div>
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
                                ? '#dcfce7'
                                : log.status === 'DUPLICATE'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                            color:
                              log.status === 'SUCCESS'
                                ? '#15803d'
                                : log.status === 'DUPLICATE'
                                  ? '#b45309'
                                  : '#b91c1c'
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

        {/* CREATE / EDIT STAFF MODAL */}
/* {showModal && (
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
         background: '#FFFFFF',
         borderRadius: '20px',
         width: '100%',
         maxWidth: '560px',
         maxHeight: '90vh',
         overflowY: 'auto',
         padding: '32px',
         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
         border: '1px solid #e2e8f0',
         margin: 'auto'
       }}
     >
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
         <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
           {editingStaff ? 'Edit Staff Account' : 'Create Staff Credentials'}
         </h3>
         <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}>×</button>
       </div>

       <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         <div className="form-group" style={{ margin: 0 }}>
           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Staff Member Full Name *</label>
           <input
             type="text"
             required
             placeholder="e.g. Ramesh Kumar"
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
           />
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
           <div className="form-group" style={{ margin: 0 }}>
             <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Email / Login Username *</label>
             <input
               type="email"
               required
               placeholder="staff@vana.com"
               value={formData.email}
               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
             />
           </div>

           <div className="form-group" style={{ margin: 0 }}>
             <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Phone Number</label>
             <input
               type="text"
               placeholder="+91 9876543210"
               value={formData.phone}
               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
             />
           </div>
         </div>

         <div className="form-group" style={{ margin: 0 }}>
           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
             {editingStaff ? 'Password (leave blank to keep unchanged)' : 'Account Password *'}
           </label>
           <input
             type="password"
             required={!editingStaff}
             placeholder="••••••••"
             value={formData.password}
             onChange={(e) => setFormData({ ...formData, password: e.target.value })}
           />
         </div>

         <div className="form-group" style={{ margin: 0 }}>
           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Staff Gate Permission Role *</label>
           <select
             value={formData.staffRole}
             onChange={(e) => setFormData({ ...formData, staffRole: e.target.value })}
           >
             <option value="Gate Entry">Gate Entry #1</option>
             <option value="VIP Entry">VIP Red Carpet Entry</option>
             <option value="Registration Desk">Registration Desk</option>
             <option value="Security">Security & Access Control</option>
           </select>
         </div>

         <div className="form-group" style={{ margin: 0 }}>
           <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Assigned Events *</label>
           <select
             multiple
             value={formData.assignedEvents}
             onChange={(e) => {
               const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
               setFormData({ ...formData, assignedEvents: selected });
             }}
             style={{ height: '95px' }}
           >
             <option value="ALL">All Current & Future Events</option>
             {eventsList.map((evt) => (
               <option key={evt._id} value={evt._id}>
                 {evt.title} ({evt.eventDate})
               </option>
             ))}
           </select>
           <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Hold Ctrl (or Cmd) to select multiple specific events.</span>
         </div>

         <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
           <button
             type="button"
             onClick={() => setShowModal(false)}
             style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
           >
             Cancel
           </button>
           <button
             type="submit"
             className="primary-btn"
             style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 700 }}
           >
             {editingStaff ? 'Save Changes' : 'Create Credentials'}
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
