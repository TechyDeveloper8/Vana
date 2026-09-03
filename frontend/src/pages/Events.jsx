import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../services/api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchAPI('/events')
      .then((res) => {
        setEvents(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const categories = ['All', 'Corporate Events', 'Concerts', 'Exhibitions & Expos'];

  const filteredEvents = category === 'All'
    ? events
    : events.filter(e => e.category === category);

  return (
    <div className="page-padding" style={{ padding: '60px 0', background: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        <div className="section-header">
          <span className="sub-badge">Live Directory</span>
          <h2>Upcoming Events & Ticket Passes</h2>
          <p style={{ color: 'var(--text-body)' }}>Book official tickets and VIP passes for live concerts, summits, and exhibitions.</p>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
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
                transition: 'all 0.3s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-body)', padding: '40px 0' }}>Loading live events directory...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredEvents.map((evt) => (
              <div key={evt._id} className="event-card-luxury">
                <div className="img-wrapper">
                  <span className="category-badge">{evt.category}</span>
                  <img
                    src={evt.bannerImage}
                    alt={evt.title}
                    loading="lazy"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'; }}
                  />
                </div>
                <div className="card-body">
                  <h3 style={{ color: 'var(--text-heading)' }}>{evt.title}</h3>
                  <div className="meta-info">
                    <span><i className="fa-solid fa-location-dot"></i> {evt.venue?.city || 'Bhagalpur'}</span>
                    <span><i className="fa-solid fa-calendar"></i> {evt.eventDate}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: '18px' }}>
                    {evt.description ? evt.description.slice(0, 90) + '...' : 'Join us for an unforgettable event experience.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Pass Starts At</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-accent)' }}>
                        ₹{evt.ticketTiers?.[0]?.price || 999}
                      </span>
                    </div>
                    <Link to={`/events/${evt._id}`} className="primary-btn" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                      Reserve Pass →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
