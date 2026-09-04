import React, { useEffect, useState } from 'react';
import { fetchAPI } from '../services/api';

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  // Active Lightbox Modal for multi-photo album view
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    fetchAPI('/gallery')
      .then((res) => {
        setGalleryItems(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const categories = ['All', 'Corporate', 'Concerts', 'Expos', 'Award Shows', 'Stage Tech'];

  const filteredItems = category === 'All'
    ? galleryItems
    : galleryItems.filter(img => img.category === category);

  const handleOpenAlbum = (album) => {
    setActiveAlbum(album);
    setActivePhotoIdx(0);
  };

  return (
    <div className="page-padding" style={{ padding: '60px 0', background: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        <div className="section-header">
          <span className="sub-badge">Visual Portfolio</span>
          <h2>Vana Event Gallery Albums</h2>
          <p style={{ color: 'var(--text-body)' }}>Explore high-resolution multi-picture albums captured from our corporate summits, live concerts, and grand exhibitions.</p>
        </div>

        {/* Category Filter Pills (Mobile Horizontal Scrollable) */}
        <div
          className="mobile-scroll-x"
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-start',
            paddingBottom: '8px',
            marginBottom: '36px'
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '50px',
                border: category === cat ? '1px solid var(--gold-primary)' : '1px solid rgba(212, 175, 55, 0.25)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                background: category === cat ? 'var(--gold-gradient)' : '#141824',
                color: category === cat ? '#0A0D14' : '#CBD5E1',
                boxShadow: category === cat ? '0 8px 25px rgba(212, 175, 55, 0.35)' : 'none',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-body)', padding: '40px 0' }}>Loading visual gallery albums...</p>
        ) : filteredItems.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-body)', padding: '40px 0' }}>No event albums found in this category.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
            {filteredItems.map((album, idx) => {
              const cover = album.coverImage || album.url || (album.images && album.images.length > 0 ? album.images[0] : '');
              const totalPhotos = album.images?.length || (album.url ? 1 : 0);

              return (
                <div
                  key={album._id || idx}
                  onClick={() => handleOpenAlbum(album)}
                  style={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    height: '280px',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    background: '#141824'
                  }}
                >
                  <img
                    src={cover}
                    alt={album.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
                    }}
                    onMouseOver={(e) => (e.target.style.transform = 'scale(1.08)')}
                    onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                  />

                  {/* Multi-Photo Count Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      background: 'rgba(10, 13, 20, 0.88)',
                      backdropFilter: 'blur(8px)',
                      color: 'var(--gold-accent)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      padding: '5px 12px',
                      borderRadius: '30px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fa-solid fa-images"></i> {totalPhotos} Photo{totalPhotos !== 1 ? 's' : ''}
                  </span>

                  {/* Overlay Info */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      padding: '20px 16px',
                      background: 'linear-gradient(to top, rgba(10,13,20,0.95) 0%, rgba(10,13,20,0.6) 60%, transparent 100%)',
                      color: '#FFFFFF'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: 'var(--gold-gradient)',
                        color: '#0A0D14',
                        padding: '3px 10px',
                        borderRadius: '50px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {album.category || 'Event Portfolio'}
                    </span>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, margin: '8px 0 4px' }}>
                      {album.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {album.description || 'Click to view event album pictures'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MULTI-PHOTO ALBUM LIGHTBOX MODAL / SLIDER */}
      {activeAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 999999,
            padding: '12px'
          }}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF', padding: '8px 12px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>
                {activeAlbum.category} ALBUM
              </span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 700 }}>
                {activeAlbum.title}
              </h3>
            </div>

            <button
              onClick={() => setActiveAlbum(null)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                fontSize: '1.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Main Photo Carousel Frame */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '10px 0' }}>
            {activeAlbum.images && activeAlbum.images.length > 1 && (
              <button
                onClick={() => setActivePhotoIdx((prev) => (prev === 0 ? activeAlbum.images.length - 1 : prev - 1))}
                style={{
                  position: 'absolute',
                  left: '10px',
                  zIndex: 10,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                ❮
              </button>
            )}

            <img
              src={activeAlbum.images?.[activePhotoIdx] || activeAlbum.url}
              alt="Active Album Photo"
              style={{
                maxHeight: '70vh',
                maxWidth: '92vw',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
              }}
            />

            {activeAlbum.images && activeAlbum.images.length > 1 && (
              <button
                onClick={() => setActivePhotoIdx((prev) => (prev === activeAlbum.images.length - 1 ? 0 : prev + 1))}
                style={{
                  position: 'absolute',
                  right: '10px',
                  zIndex: 10,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                ❯
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {activeAlbum.images && activeAlbum.images.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', overflowX: 'auto', padding: '8px 0' }}>
              {activeAlbum.images.map((imgUrl, i) => (
                <div
                  key={i}
                  onClick={() => setActivePhotoIdx(i)}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: activePhotoIdx === i ? '3px solid #D4AF37' : '2px solid transparent',
                    opacity: activePhotoIdx === i ? 1 : 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <img src={imgUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
