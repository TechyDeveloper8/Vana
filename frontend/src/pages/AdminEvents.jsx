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

  // File & Banner Upload States
  const [bannerSourceTab, setBannerSourceTab] = useState('gdrive'); // 'gdrive' | 'file' | 'url'
  const [gdriveInput, setGdriveInput] = useState('');
  const [processingGdrive, setProcessingGdrive] = useState(false);
  const [gdrivePreviewError, setGdrivePreviewError] = useState(false);
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
    setGdriveInput('');
    setBannerSourceTab('gdrive');
    setUploadProgress(0);
    setUploadSuccess(false);
    setGdrivePreviewError(false);
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (evt) => {
    setEditingEvent(evt);
    const existingBanner = evt.bannerImage || '';
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
      bannerImage: existingBanner,
      driveFileId: evt.driveFileId || ''
    });

    if (evt.driveFileId) {
      setGdriveInput(`https://drive.google.com/file/d/${evt.driveFileId}/view`);
      setBannerSourceTab('gdrive');
    } else if (existingBanner.includes('google') || existingBanner.includes('drive.')) {
      setGdriveInput(existingBanner);
      setBannerSourceTab('gdrive');
    } else {
      setGdriveInput('');
      setBannerSourceTab(existingBanner ? 'url' : 'gdrive');
    }

    setUploadProgress(0);
    setUploadSuccess(false);
    setGdrivePreviewError(false);
    setShowModal(true);
  };

  // Extract Google Drive File ID from any link format
  const extractGDriveId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{15,60})/);
    if (fileDMatch) return fileDMatch[1];
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,60})/);
    if (idMatch) return idMatch[1];
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,60})/);
    if (dMatch) return dMatch[1];
    if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
      return trimmed;
    }
    return null;
  };

  // Process Google Drive URL immediately on frontend and sync with backend
  const handleApplyGDriveLink = async (overrideUrl = null, downloadLocally = false) => {
    const rawLink = (overrideUrl !== null ? overrideUrl : gdriveInput).trim();
    if (!rawLink) {
      showNotification('Please enter or paste a Google Drive link', 'error');
      return;
    }

    const fileId = extractGDriveId(rawLink);
    if (!fileId) {
      showNotification('Could not detect a valid Google Drive link or file ID. Example: https://drive.google.com/file/d/FILE_ID/view?usp=sharing', 'error');
      return;
    }

    setProcessingGdrive(true);
    setGdrivePreviewError(false);

    // Instant direct high-speed embed URL
    const directEmbedUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    setFormData((prev) => ({
      ...prev,
      bannerImage: directEmbedUrl,
      driveFileId: fileId
    }));
    setUploadSuccess(true);

    try {
      const res = await fetchAPI('/events/process-gdrive-link', {
        method: 'POST',
        body: JSON.stringify({ driveUrl: rawLink, downloadLocally })
      });

      if (res.success) {
        setFormData((prev) => ({
          ...prev,
          bannerImage: res.bannerImage || directEmbedUrl,
          driveFileId: res.driveFileId || fileId
        }));
        showNotification(res.message || 'Google Drive banner connected successfully!', 'success');
      }
    } catch (err) {
      // Direct stream URL still works even if backend proxy fails
      showNotification('Google Drive link applied! Note: Make sure file access is set to "Anyone with the link can view".', 'success');
    } finally {
      setProcessingGdrive(false);
    }
  };

  // Handle banner preview image loading error with multiple Google Drive fallback mirrors
  const handleBannerImgError = (e) => {
    if (formData.driveFileId && !e.target.dataset.triedThumbnail) {
      e.target.dataset.triedThumbnail = 'true';
      e.target.src = `https://drive.google.com/thumbnail?id=${formData.driveFileId}&sz=w1600`;
      return;
    }
    if (formData.driveFileId && !e.target.dataset.triedExport) {
      e.target.dataset.triedExport = 'true';
      e.target.src = `https://drive.google.com/uc?export=view&id=${formData.driveFileId}`;
      return;
    }
    setGdrivePreviewError(true);
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
        { tierName: 'Silver (First Floor Rows 1A–1H)', price: 500, totalSeats: 332, availableSeats: 332 },
        { tierName: 'Gold (Rows F–Q)', price: 700, totalSeats: 501, availableSeats: 501 },
        { tierName: 'Platinum (Rows A–E)', price: 1000, totalSeats: 160, availableSeats: 160 },
        { tierName: 'VIP Lounge (Row V)', price: 1500, totalSeats: 15, availableSeats: 15 }
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
                                  if (evt.driveFileId && !e.target.dataset.triedThumbnail) {
                                    e.target.dataset.triedThumbnail = 'true';
                                    e.target.src = `https://drive.google.com/thumbnail?id=${evt.driveFileId}&sz=w800`;
                                    return;
                                  }
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

              {/* GOOGLE DRIVE & MULTI-SOURCE BANNER MANAGER */}
              <div
                style={{
                  background: '#0B0E17',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '14px',
                  padding: '20px',
                  position: 'relative'
                }}
              >
                {/* Header Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-brands fa-google-drive" style={{ color: 'var(--gold-accent)', fontSize: '1.4rem' }}></i>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--text-heading)', fontSize: '1rem', display: 'block' }}>
                        Event Banner Image & Google Drive Sync
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                        Paste a Google Drive share link, upload from device, or enter a direct web image URL
                      </span>
                    </div>
                  </div>

                  {formData.driveFileId && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-accent)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                      <i className="fa-brands fa-google-drive" style={{ marginRight: '4px' }}></i> File ID: {formData.driveFileId.slice(0, 10)}...
                    </span>
                  )}
                </div>

                {/* Source Selection Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setBannerSourceTab('gdrive')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: bannerSourceTab === 'gdrive' ? 'none' : '1px solid rgba(212, 175, 55, 0.25)',
                      background: bannerSourceTab === 'gdrive' ? 'var(--gold-gradient)' : '#141824',
                      color: bannerSourceTab === 'gdrive' ? '#0A0D14' : '#CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fa-brands fa-google-drive"></i> Google Drive Link
                  </button>

                  <button
                    type="button"
                    onClick={() => setBannerSourceTab('file')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: bannerSourceTab === 'file' ? 'none' : '1px solid rgba(212, 175, 55, 0.25)',
                      background: bannerSourceTab === 'file' ? 'var(--gold-gradient)' : '#141824',
                      color: bannerSourceTab === 'file' ? '#0A0D14' : '#CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i> Upload from Device
                  </button>

                  <button
                    type="button"
                    onClick={() => setBannerSourceTab('url')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: bannerSourceTab === 'url' ? 'none' : '1px solid rgba(212, 175, 55, 0.25)',
                      background: bannerSourceTab === 'url' ? 'var(--gold-gradient)' : '#141824',
                      color: bannerSourceTab === 'url' ? '#0A0D14' : '#CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fa-solid fa-link"></i> Web Image URL
                  </button>
                </div>

                {/* TAB 1: GOOGLE DRIVE LINK PASTE & AUTO-CONVERSION */}
                {bannerSourceTab === 'gdrive' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Paste Google Drive share link (e.g. https://drive.google.com/file/d/1w8aXy.../view?usp=sharing)"
                        value={gdriveInput}
                        onChange={(e) => {
                          setGdriveInput(e.target.value);
                          const detected = extractGDriveId(e.target.value);
                          if (detected) {
                            handleApplyGDriveLink(e.target.value, false);
                          }
                        }}
                        style={{
                          flex: 1,
                          minWidth: '260px',
                          padding: '10px 14px',
                          background: '#141824',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '0.88rem'
                        }}
                      />

                      <button
                        type="button"
                        disabled={processingGdrive || !gdriveInput.trim()}
                        onClick={() => handleApplyGDriveLink(null, false)}
                        className="primary-btn"
                        style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        {processingGdrive ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i> Converting...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-bolt"></i> Apply GDrive Link
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={processingGdrive || !gdriveInput.trim()}
                        onClick={() => handleApplyGDriveLink(null, true)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          background: '#141824',
                          border: '1px solid rgba(212, 175, 55, 0.4)',
                          color: 'var(--gold-accent)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                        title="Download image from Google Drive and store on server permanently"
                      >
                        <i className="fa-solid fa-cloud-arrow-down"></i> Cache to Server
                      </button>
                    </div>

                    <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-circle-info" style={{ fontSize: '1rem' }}></i>
                      <span>
                        <strong>Google Drive Sharing Requirement:</strong> In Google Drive, ensure General Access is set to <strong>"Anyone with the link can view"</strong> so the image displays to all visitors.
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 2: UPLOAD IMAGE FILE FROM DEVICE */}
                {bannerSourceTab === 'file' && (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '12px' }}>
                      Supported Formats: <strong>JPG, PNG, WEBP</strong> | Maximum Size: <strong>5 MB</strong>
                    </p>

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
                      className="primary-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i> Choose Image File from Device
                    </label>

                    {uploading && (
                      <div style={{ marginTop: '16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gold-accent)', marginBottom: '6px', fontWeight: 600 }}>
                          <span>Uploading & processing event banner...</span>
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
                  </div>
                )}

                {/* TAB 3: DIRECT WEB IMAGE URL */}
                {bannerSourceTab === 'url' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>Direct Image URL (HTTPS)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-... or https://cdn..."
                      value={formData.bannerImage}
                      onChange={(e) => {
                        const val = e.target.value;
                        const detected = extractGDriveId(val);
                        if (detected) {
                          setGdriveInput(val);
                          handleApplyGDriveLink(val, false);
                        } else {
                          setFormData({ ...formData, bannerImage: val });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#141824',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                )}

                {/* LIVE BANNER PREVIEW CARD */}
                {formData.bannerImage && (
                  <div
                    style={{
                      marginTop: '18px',
                      background: '#141824',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ position: 'relative', width: '130px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--gold-primary)', background: '#000' }}>
                      <img
                        src={formData.bannerImage}
                        alt="Banner Preview"
                        onError={handleBannerImgError}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-accent)' }}>
                          {formData.driveFileId ? '✓ GOOGLE DRIVE BANNER CONNECTED' : '✓ ACTIVE BANNER PREVIEW'}
                        </span>
                        {formData.driveFileId && (
                          <span style={{ fontSize: '0.68rem', background: '#10B981', color: '#0A0D14', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                            DIRECT STREAM
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        readOnly
                        value={formData.bannerImage}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '0.78rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          background: '#0B0E17',
                          color: '#CBD5E1',
                          fontFamily: 'monospace'
                        }}
                      />

                      {gdrivePreviewError && (
                        <div style={{ marginTop: '6px', color: '#F87171', fontSize: '0.75rem', fontWeight: 600 }}>
                          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i>
                          Google Drive preview blocked. In Google Drive, ensure General Access is set to "Anyone with the link can view".
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, bannerImage: '', driveFileId: '' }));
                        setGdriveInput('');
                        setGdrivePreviewError(false);
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#F87171',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fa-solid fa-trash-can" style={{ marginRight: '4px' }}></i> Remove
                    </button>
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
