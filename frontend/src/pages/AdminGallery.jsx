import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminGallery() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals & Active Edit State
  const [showModal, setShowModal] = useState(false); // Create/Edit Album Modal
  const [editingAlbum, setEditingAlbum] = useState(null); // Active album being edited
  const [managingAlbum, setManagingAlbum] = useState(null); // Active album photos manager modal
  const [toast, setToast] = useState(null);

  // Form State for Album Creation/Edit
  const [formData, setFormData] = useState({
    title: '',
    category: 'Corporate',
    location: '',
    eventDate: '',
    description: '',
    imagesText: ''
  });

  // State for quick adding photo to managingAlbum modal
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadGallery = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/gallery');
      setGalleryItems(res.data || []);
    } catch (err) {
      showToastMsg(err.message || 'Failed to load gallery items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAlbum(null);
    setFormData({
      title: '',
      category: 'Corporate',
      location: '',
      eventDate: '',
      description: '',
      imagesText: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title || '',
      category: album.category || 'Corporate',
      location: album.location || '',
      eventDate: album.eventDate || '',
      description: album.description || '',
      imagesText: (album.images || []).join('\n')
    });
    setShowModal(true);
  };

  const handleAlbumSubmit = async (e) => {
    e.preventDefault();

    const imageList = formData.imagesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title,
      category: formData.category,
      location: formData.location,
      eventDate: formData.eventDate,
      description: formData.description,
      images: imageList,
      coverImage: imageList.length > 0 ? imageList[0] : ''
    };

    try {
      if (editingAlbum) {
        await fetchAPI(`/gallery/${editingAlbum._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToastMsg('Event album updated successfully!');
      } else {
        await fetchAPI('/gallery', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToastMsg('New event album created successfully!');
      }

      setShowModal(false);
      loadGallery();
    } catch (err) {
      showToastMsg(err.message || 'Failed to save event album', 'error');
    }
  };

  const handleDeleteAlbum = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event album and all its associated photos?')) return;

    try {
      await fetchAPI(`/gallery/${id}`, { method: 'DELETE' });
      showToastMsg('Event album removed successfully');
      loadGallery();
    } catch (err) {
      showToastMsg(err.message || 'Failed to delete event album', 'error');
    }
  };

  // Add a single photo URL to an active managing album
  const handleAddPhotoToAlbum = async () => {
    if (!newPhotoUrl || !newPhotoUrl.trim()) return;

    try {
      const res = await fetchAPI(`/gallery/${managingAlbum._id}/add-image`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl: newPhotoUrl.trim() })
      });
      showToastMsg('Photo added to album!');
      setNewPhotoUrl('');
      setManagingAlbum(res.data);
      loadGallery();
    } catch (err) {
      showToastMsg(err.message || 'Failed to add photo', 'error');
    }
  };

  // Remove a photo URL from active managing album
  const handleRemovePhotoFromAlbum = async (url) => {
    try {
      const res = await fetchAPI(`/gallery/${managingAlbum._id}/remove-image`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl: url })
      });
      showToastMsg('Photo removed from album!');
      setManagingAlbum(res.data);
      loadGallery();
    } catch (err) {
      showToastMsg(err.message || 'Failed to remove photo', 'error');
    }
  };

  // Set Cover Photo for album
  const handleSetCoverPhoto = async (url) => {
    try {
      const res = await fetchAPI(`/gallery/${managingAlbum._id}`, {
        method: 'PUT',
        body: JSON.stringify({ coverImage: url })
      });
      showToastMsg('Album cover image updated!');
      setManagingAlbum(res.data);
      loadGallery();
    } catch (err) {
      showToastMsg(err.message || 'Failed to update cover', 'error');
    }
  };

  // Filtered albums
  const filteredItems = galleryItems.filter((item) => {
    const matchesSearch =
      (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

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
              Multi-Picture Event Gallery & Albums
            </h2>
            <p style={{ color: 'var(--text-body)', margin: '4px 0 0' }}>
              Create event photo albums with multiple picture showcases, organize high-resolution event portfolios, and select album covers.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="primary-btn"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-folder-plus"></i> + Create Event Album
          </button>
        </div>

        {/* Toolbar: Category Pills & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Corporate', 'Concerts', 'Expos', 'Award Shows', 'Stage Tech'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: categoryFilter === cat ? 'none' : '1px solid rgba(212, 175, 55, 0.25)',
                  background: categoryFilter === cat ? 'var(--gold-gradient)' : '#0B0E17',
                  color: categoryFilter === cat ? '#0A0D14' : '#CBD5E1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-accent)', fontSize: '0.85rem' }}></i>
            <input
              type="text"
              placeholder="Search event albums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', background: '#0B0E17', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
        </div>

        {/* EVENT ALBUMS GRID */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '12px', display: 'block' }}></i>
            Loading event photo albums...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ background: '#141824', padding: '48px', borderRadius: '16px', border: '1px solid var(--border-light)', textAlign: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-images fa-3x" style={{ marginBottom: '16px', color: 'var(--gold-accent)', display: 'block' }}></i>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px', color: 'var(--text-heading)' }}>No event albums found</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-body)' }}>Create a new multi-picture album to showcase your event gallery.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredItems.map((album) => {
              const photoCount = album.images?.length || (album.url ? 1 : 0);
              const cover = album.coverImage || album.url || (album.images?.length > 0 ? album.images[0] : '');

              return (
                <div
                  key={album._id}
                  style={{
                    background: '#141824',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-hover)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Album Cover & Badges */}
                  <div style={{ height: '200px', overflow: 'hidden', position: 'relative', background: '#0B0E17' }}>
                    <img
                      src={cover || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'}
                      alt={album.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(10, 13, 20, 0.85)',
                        backdropFilter: 'blur(6px)',
                        color: 'var(--gold-accent)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {album.category}
                    </span>

                    <span
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(10, 13, 20, 0.85)',
                        backdropFilter: 'blur(6px)',
                        color: 'var(--gold-accent)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fa-solid fa-camera"></i> {photoCount} Photo{photoCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Album Details */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC', margin: '0 0 6px', fontWeight: 800 }}>{album.title}</h3>
                    {album.location && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--gold-accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold-primary)' }}></i> {album.location}
                      </div>
                    )}

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: '0 0 16px', lineHeight: 1.4 }}>
                      {album.description || 'Multi-picture event album portfolio collection.'}
                    </p>

                    {/* Thumbnail Strip Preview (First 4 photos) */}
                    {album.images && album.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {album.images.slice(0, 4).map((imgUrl, i) => (
                          <div
                            key={i}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: cover === imgUrl ? '2px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.25)',
                              flexShrink: 0
                            }}
                          >
                            <img src={imgUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                        {album.images.length > 4 && (
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              background: '#0B0E17',
                              border: '1px solid rgba(212, 175, 55, 0.25)',
                              color: 'var(--gold-accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            +{album.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setManagingAlbum(album)}
                        className="primary-btn"
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <i className="fa-solid fa-images"></i> Photos ({photoCount})
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(album)}
                        style={{ padding: '9px 12px', background: '#0B0E17', color: 'var(--gold-accent)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                        title="Edit Album Info"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>

                      <button
                        onClick={() => handleDeleteAlbum(album._id)}
                        style={{ padding: '9px 12px', background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                        title="Delete Event Album"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MANAGE ALBUM PHOTOS MODAL (MULTI-PICTURE GALLERY MANAGER) */}
        {managingAlbum && (
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
                maxWidth: '720px',
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {managingAlbum.category} EVENT ALBUM
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                    {managingAlbum.title} ({managingAlbum.images?.length || 0} Pictures)
                  </h3>
                </div>
                <button onClick={() => setManagingAlbum(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#CBD5E1', cursor: 'pointer' }}>×</button>
              </div>

              {/* Quick Add Photo Input */}
              <div style={{ background: '#0B0E17', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.25)', marginBottom: '24px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '8px' }}>
                  + Add New Picture URL to Event Album
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)', background: '#141824', color: '#F8FAFC', fontSize: '0.88rem', outline: 'none' }}
                  />
                  <button
                    onClick={handleAddPhotoToAlbum}
                    className="primary-btn"
                    style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
                  >
                    Add Picture
                  </button>
                </div>
              </div>

              {/* Photos Gallery Grid */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-heading)', marginBottom: '12px', fontWeight: 700 }}>
                  Album Photos Showcase
                </h4>

                {(!managingAlbum.images || managingAlbum.images.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#0B0E17', borderRadius: '12px', color: '#94A3B8', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    No pictures in this album yet. Paste an image URL above to add photos!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    {managingAlbum.images.map((imgUrl, index) => {
                      const isCover = managingAlbum.coverImage === imgUrl;
                      return (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: isCover ? '3px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.25)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            background: '#0B0E17',
                            height: '140px'
                          }}
                        >
                          <img src={imgUrl} alt={`Album pic ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                          {/* Cover badge */}
                          {isCover && (
                            <span style={{ position: 'absolute', top: '6px', left: '6px', background: 'var(--gold-gradient)', color: '#0A0D14', padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 800 }}>
                              ★ COVER
                            </span>
                          )}

                          {/* Actions Overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'rgba(10, 13, 20, 0.88)',
                              padding: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            {!isCover && (
                              <button
                                onClick={() => handleSetCoverPhoto(imgUrl)}
                                style={{ background: 'none', border: 'none', color: 'var(--gold-accent)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Set Cover
                              </button>
                            )}

                            <button
                              onClick={() => handleRemovePhotoFromAlbum(imgUrl)}
                              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, marginLeft: 'auto' }}
                              title="Delete Photo"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => setManagingAlbum(null)}
                  style={{ padding: '10px 24px', background: '#0B0E17', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', color: '#CBD5E1' }}
                >
                  Done Managing Photos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT ALBUM MODAL */}
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
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                border: '1px solid var(--border-light)',
                margin: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  {editingAlbum ? 'Edit Event Album' : 'Create New Multi-Picture Album'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#CBD5E1', cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleAlbumSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Event Album Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Corporate Leadership Summit 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                    >
                      <option value="Corporate">Corporate</option>
                      <option value="Concerts">Concerts</option>
                      <option value="Expos">Exhibitions & Expos</option>
                      <option value="Award Shows">Award Shows</option>
                      <option value="Stage Tech">Stage Tech</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Location / City</label>
                    <input
                      type="text"
                      placeholder="e.g. Bhagalpur, Bihar"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>
                    Photo Image URLs (Paste multiple image URLs, one per line) *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="https://images.unsplash.com/photo-1511578314322...&#10;https://images.unsplash.com/photo-1492684223066...&#10;https://images.unsplash.com/photo-1540575467063..."
                    value={formData.imagesText}
                    onChange={(e) => setFormData({ ...formData, imagesText: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  ></textarea>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', marginTop: '4px', display: 'block' }}>
                    You can paste multiple image URLs separated by new lines or commas. First URL will be used as album cover.
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Album Description</label>
                  <textarea
                    rows="2"
                    placeholder="Brief highlights of stage design, sound lighting, and executive guests..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ background: '#0B0E17', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC' }}
                  ></textarea>
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
                    {editingAlbum ? 'Save Album Changes' : 'Publish Multi-Photo Album'}
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
