import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

import AdminSidebar from '../components/AdminSidebar';

export default function AdminEvents() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const initialFormState = {
    title: '',
    category: 'Corporate Events',
    status: 'Published',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '05:00 PM',
    organizer: 'Vana Entertainments',
    venueName: 'Town Hall Bhagalpur',
    city: 'Bhagalpur',
    address: 'Town Hall, Bhagalpur, Bihar',
    price: 500,
    description: '',
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    driveFileId: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4500);
  };

  const loadEvents = () => {
    setLoading(true);
    fetchAPI('/events?admin=true')
      .then((res) => {
        setEvents(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        showNotification('Failed to load events: ' + err.message, 'error');
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData(initialFormState);
    setUploadProgress(0);
    setUploadSuccess(false);
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (evt) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title || '',
      category: evt.category || 'Corporate Events',
      status: evt.status || (evt.isPublished ? 'Published' : 'Unpublished'),
      eventDate: evt.eventDate || '',
      startTime: evt.startTime || '10:00 AM',
      endTime: evt.endTime || '05:00 PM',
      organizer: evt.organizer || 'Vana Entertainments',
      venueName: evt.venue?.name || '',
      city: evt.venue?.city || 'Bhagalpur',
      address: evt.venue?.address || '',
      price: evt.price || evt.ticketTiers?.[0]?.price || 0,
      description: evt.description || '',
      bannerImage: evt.bannerImage || '',
      driveFileId: evt.driveFileId || ''
    });
    setUploadProgress(0);
    setUploadSuccess(false);
    setShowModal(true);
  };

  // File Validation & Google Drive Automated Upload Handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Format validation (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (!validTypes.includes(file.type.toLowerCase()) && !validExtensions.includes(ext)) {
      showNotification('Invalid file format! Only JPG, PNG, and WEBP images are allowed.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Max File Size validation (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB in bytes
    if (file.size > MAX_SIZE) {
      showNotification(`File too large! Maximum allowed upload size is 5 MB. (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Initiate Google Drive API upload via backend
    uploadImageToGoogleDrive(file);
  };

  const uploadImageToGoogleDrive = (file) => {
    setUploading(true);
    setUploadProgress(10);
    setUploadSuccess(false);

    const data = new FormData();
    data.append('banner', file);
    if (formData.driveFileId) {
      data.append('oldDriveFileId', formData.driveFileId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/events/upload-banner', true);

    const token = localStorage.getItem('vana_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            setFormData((prev) => ({
              ...prev,
              bannerImage: res.bannerImage,
              driveFileId: res.driveFileId
            }));
            setUploadSuccess(true);
            showNotification(`Featured Banner uploaded to Google Drive successfully! (File ID: ${res.driveFileId})`, 'success');
          } else {
            showNotification(res.message || 'Image upload failed', 'error');
          }
        } catch (err) {
          showNotification('Error parsing upload response', 'error');
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          showNotification(errRes.message || 'Upload server error', 'error');
        } catch (err) {
          showNotification('Google Drive upload failed with status ' + xhr.status, 'error');
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      showNotification('Network error while uploading image to Google Drive', 'error');
    };

    xhr.send(data);
  };

  // Submit Create or Edit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Please enter an Event Title', 'error');
      return;
    }

    setSubmitting(true);

    const payload = {
      title: formData.title,
      category: formData.category,
      status: formData.status,
      isPublished: formData.status !== 'Unpublished',
      eventDate: formData.eventDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      organizer: formData.organizer,
      venue: {
        name: formData.venueName,
        city: formData.city,
        address: formData.address
      },
      price: 500,
      description: formData.description,
      bannerImage: formData.bannerImage,
      driveFileId: formData.driveFileId,
      ticketTiers: [
        { tierName: 'Silver (First Floor Rows 1A–1H)', price: 500, totalSeats: 260, availableSeats: 260 },
        { tierName: 'Platinum (Rows A–E)', price: 700, totalSeats: 150, availableSeats: 150 },
        { tierName: 'Gold (Rows F–Q)', price: 1000, totalSeats: 450, availableSeats: 450 },
        { tierName: 'VIP Lounge (Row V)', price: 1500, totalSeats: 40, availableSeats: 40 }
      ]
    };

    try {
      if (editingEvent) {
        await fetchAPI(`/events/${editingEvent._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showNotification('Event updated successfully!', 'success');
      } else {
        await fetchAPI('/events', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showNotification('Event published successfully to website!', 'success');
      }

      setShowModal(false);
      loadEvents();
    } catch (err) {
      showNotification('Failed to save event: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Publish / Unpublish Status
  const handleTogglePublish = async (evt) => {
    try {
      const res = await fetchAPI(`/events/${evt._id}/publish`, {
        method: 'PATCH'
      });
      showNotification(res.message || 'Status updated successfully', 'success');
      loadEvents();
    } catch (err) {
      showNotification('Failed to toggle status: ' + err.message, 'error');
    }
  };

  // Delete Event & Google Drive Image
  const handleDelete = async (evt) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${evt.title}"?\nThis will also remove the associated Google Drive banner image.`
    );
    if (!confirmDelete) return;

    try {
      await fetchAPI(`/events/${evt._id}`, { method: 'DELETE' });
      showNotification('Event and associated Google Drive image deleted successfully!', 'success');
      loadEvents();
    } catch (err) {
      showNotification('Failed to delete event: ' + err.message, 'error');
    }
  };

  // Calculate Summary Statistics
  const totalCount = events.length;
  const publishedCount = events.filter((e) => e.isPublished !== false && e.status !== 'Unpublished').length;
  const unpublishedCount = events.filter((e) => e.isPublished === false || e.status === 'Unpublished').length;

  // Filtered Events array
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(search.toLowerCase()) ||
      (evt.venue?.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (evt.organizer || '').toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || evt.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'Published') {
      matchesStatus = evt.isPublished !== false && evt.status !== 'Unpublished';
    } else if (statusFilter === 'Unpublished') {
      matchesStatus = evt.isPublished === false || evt.status === 'Unpublished';
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="admin-layout">
      {/* Toast Notification Popup */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 24px',
            borderRadius: '8px',
            color: '#FFFFFF',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 500,
            fontSize: '0.95rem'
          }}
        >
          <i className={toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'}></i>
          {toast.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Admin Content Container */}
      <div className="admin-content">
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-heading)', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Event Management & Drive Media
            </h2>
            <p style={{ color: 'var(--text-body)', margin: '4px 0 0' }}>
              Create, edit, publish, unpublish, and manage Google Drive hosted event banners
            </p>
          </div>
          <button onClick={handleOpenCreateModal} className="primary-btn" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-plus"></i> Add New Event
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <h4>TOTAL EVENTS</h4>
            <div className="number">{totalCount}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <h4>PUBLISHED</h4>
            <div className="number" style={{ color: '#10b981' }}>{publishedCount}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--gold-primary)' }}>
            <h4>UNPUBLISHED / DRAFT</h4>
            <div className="number" style={{ color: 'var(--gold-accent)' }}>{unpublishedCount}</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ background: '#141824', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-hover)', border: '1px solid var(--border-light)', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-accent)' }}></i>
            <input
              type="text"
              placeholder="Search by title, city, organizer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', background: '#0B0E17', color: '#F8FAFC', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', outline: 'none', fontSize: '0.9rem', background: '#0B0E17', color: '#F8FAFC' }}
            >
              <option value="All">All Categories</option>
              <option value="Corporate Events">Corporate Events</option>
              <option value="Concerts">Concerts</option>
              <option value="Exhibitions & Expos">Exhibitions & Expos</option>
              <option value="Award Shows">Award Shows</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', outline: 'none', fontSize: '0.9rem', background: '#0B0E17', color: '#F8FAFC' }}
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published Only</option>
              <option value="Unpublished">Unpublished Only</option>
            </select>

            <button onClick={loadEvents} style={{ padding: '10px 16px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--gold-accent)' }}>
              <i className="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        </div>

        {/* Events Table Container */}
        <div style={{ background: '#141824', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-hover)', border: '1px solid var(--border-light)' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '12px', display: 'block' }}></i>
              Loading events database...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              <i className="fa-solid fa-calendar-xmark fa-2x" style={{ marginBottom: '12px', display: 'block' }}></i>
              No events found matching your criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--gold-accent)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px' }}>BANNER & TITLE</th>
                    <th style={{ padding: '12px' }}>CATEGORY</th>
                    <th style={{ padding: '12px' }}>DATE & TIME</th>
                    <th style={{ padding: '12px' }}>VENUE</th>
                    <th style={{ padding: '12px' }}>PRICE (₹)</th>
                    <th style={{ padding: '12px' }}>PUBLISH STATUS</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((evt) => {
                    const isPub = evt.isPublished !== false && evt.status !== 'Unpublished';

                    return (
                      <tr key={evt._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', transition: 'background 0.2s ease' }}>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '64px', height: '44px', borderRadius: '6px', overflow: 'hidden', background: '#0B0E17', flexShrink: 0, border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                              <img
                                src={evt.bannerImage}
                                alt={evt.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                                }}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.98rem' }}>{evt.title}</div>
                              {evt.driveFileId ? (
                                <span style={{ fontSize: '0.72rem', color: 'var(--gold-accent)', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <i className="fa-brands fa-google-drive"></i> GDrive Sync
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Standard URL</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 12px', color: '#CBD5E1', fontSize: '0.9rem' }}>
                          <span style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--gold-accent)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, fontSize: '0.8rem' }}>
                            {evt.category}
                          </span>
                        </td>

                        <td style={{ padding: '14px 12px', fontSize: '0.88rem', color: '#CBD5E1' }}>
                          <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{evt.eventDate}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{evt.startTime}</div>
                        </td>

                        <td style={{ padding: '14px 12px', fontSize: '0.88rem', color: '#CBD5E1' }}>
                          <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{evt.venue?.city || 'Bhagalpur'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{evt.venue?.name}</div>
                        </td>

                        <td style={{ padding: '14px 12px', fontWeight: 700, color: 'var(--gold-accent)' }}>
                          ₹{evt.price || evt.ticketTiers?.[0]?.price || 0}
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          <button
                            onClick={() => handleTogglePublish(evt)}
                            title="Click to toggle publish status"
                            style={{
                              background: isPub ? 'rgba(34, 197, 94, 0.12)' : 'rgba(212, 175, 55, 0.12)',
                              color: isPub ? '#4ADE80' : 'var(--gold-accent)',
                              border: isPub ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <i className={isPub ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'}></i>
                            {isPub ? 'Published' : 'Unpublished'}
                          </button>
                        </td>

                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditModal(evt)}
                              style={{
                                background: '#0B0E17',
                                color: 'var(--gold-accent)',
                                border: '1px solid rgba(212, 175, 55, 0.25)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Edit
                            </button>

                            <button
                              onClick={() => handleDelete(evt)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#F87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                              }}
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
      </div>

      {/* CREATE & EDIT EVENT MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justify: 'center',
            alignItems: 'center',
            zIndex: 3000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#141824',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 28px',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0B0E17'
              }}
            >
              <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-heading)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {editingEvent ? `Edit Event: ${editingEvent.title}` : 'Create New Event'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#CBD5E1', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Event Title */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Celebrity Concert & Music Night"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                />
              </div>

              {/* Category & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  >
                    <option value="Corporate Events">Corporate Events</option>
                    <option value="Concerts">Concerts</option>
                    <option value="Exhibitions & Expos">Exhibitions & Expos</option>
                    <option value="Award Shows">Award Shows</option>
                    <option value="Festivals">Festivals</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Publish Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  >
                    <option value="Published">Published (Live on Website)</option>
                    <option value="Unpublished">Unpublished (Hidden / Draft)</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Event Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:00 PM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>
              </div>

              {/* Venue & City */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Venue Selection *</label>
                  <select
                    value={formData.venueName || 'Town Hall Bhagalpur'}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  >
                    <option value="Town Hall Bhagalpur">Town Hall Bhagalpur (Auditorium)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhagalpur"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>
              </div>

              {/* Organizer & Ticket Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Organizer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vana Entertainments"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Venue Category Pricing</label>
                  <div style={{ padding: '12px 14px', background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--gold-accent)', fontWeight: 600 }}>
                    <i className="fa-solid fa-building-columns" style={{ color: 'var(--gold-primary)', marginRight: '6px' }}></i>
                    Auto-Applied Venue Tiers (Silver ₹500, Plat ₹700, Gold ₹1000, VIP ₹1500)
                  </div>
                </div>
              </div>

              {/* AUTOMATED GOOGLE DRIVE IMAGE UPLOADER SECTION */}
              <div
                style={{
                  background: '#0B0E17',
                  border: '2px dashed rgba(212, 175, 55, 0.35)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                  <i className="fa-brands fa-google-drive" style={{ color: 'var(--gold-accent)', fontSize: '1.4rem' }}></i>
                  <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '1rem' }}>
                    Google Drive Automated Banner Uploader
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '14px' }}>
                  Supported Formats: <strong>JPG, PNG, WEBP</strong> | Max Upload Size: <strong>5 MB</strong>
                </p>

                {/* File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="drive-image-input"
                />

                <label
                  htmlFor="drive-image-input"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'var(--gold-gradient)',
                    color: '#0A0D14',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload Banner Image to Google Drive
                </label>

                {/* Progress Bar Indicator */}
                {uploading && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gold-accent)', marginBottom: '6px', fontWeight: 600 }}>
                      <span>Uploading to Google Drive "Event Banners" folder...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#141824', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${uploadProgress}%`,
                          background: 'var(--gold-gradient)',
                          transition: 'width 0.2s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Success Badge */}
                {uploadSuccess && (
                  <div style={{ marginTop: '12px', color: '#4ADE80', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-circle-check"></i> Image stored & synced with Google Drive!
                  </div>
                )}

                {/* Image Preview & URL Display */}
                {formData.bannerImage && (
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: '#141824', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', textAlign: 'left' }}>
                    <img
                      src={formData.bannerImage}
                      alt="Banner Preview"
                      style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-accent)', display: 'block' }}>STORED IMAGE URL:</span>
                      <input
                        type="text"
                        value={formData.bannerImage}
                        onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.25)', background: '#0B0E17', color: '#F8FAFC' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Event Description */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, color: '#CBD5E1' }}>Description / Event Synopsis</label>
                <textarea
                  rows="3"
                  placeholder="Provide details about the event performance, keynotes, artists, venue entry guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                ></textarea>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '12px 24px', background: '#0B0E17', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#CBD5E1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="primary-btn"
                  style={{ padding: '12px 28px', opacity: submitting || uploading ? 0.6 : 1 }}
                >
                  {submitting ? (
                    <span>
                      <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                    </span>
                  ) : editingEvent ? (
                    'Update Event'
                  ) : (
                    'Publish Event to Website'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
