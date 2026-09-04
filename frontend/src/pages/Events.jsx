import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import EventCard from '../components/EventCard';
import { Reveal } from '../components/Reveal';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchAPI('/events')
      .then((res) => {
        setEvents(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load events:', err);
        setEvents([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categories = ['All', 'Music', 'Corporate', 'Theater'];

  const filteredEvents = category === 'All'
    ? events
    : events.filter(e => {
        const cat = (e.category || '').toLowerCase();
        if (category === 'Music') return cat.includes('music') || cat.includes('concert');
        if (category === 'Corporate') return cat.includes('corporate') || cat.includes('summit');
        if (category === 'Theater') return cat.includes('theater') || cat.includes('theatre') || cat.includes('orchestral');
        return e.category === category;
      });

  return (
    <div
      style={{
        background: '#050505',
        minHeight: '85vh',
        padding: '64px 0 100px 0'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 24px)' }}>
        {/* Section Header */}
        <Reveal>
          <p
            className="font-mono-x"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: '#FF4500',
              marginBottom: '12px'
            }}
          >
            The Line-Up
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '20px',
              marginBottom: '40px'
            }}
          >
            <h1
              className="heading"
              style={{
                fontFamily: "'Cabinet Grotesk', -apple-system, sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
                textTransform: 'uppercase',
                letterSpacing: '-0.03em',
                lineHeight: 0.95,
                color: '#FFFFFF',
                margin: 0
              }}
            >
              All Events
            </h1>

            {/* Category Filter Buttons - Touch Scroll on Mobile */}
            <div
              className="mobile-scroll-x"
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                maxWidth: '100%',
                paddingBottom: '4px'
              }}
            >
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '10px 22px',
                      minHeight: '44px',
                      borderRadius: '0px',
                      border: isSelected ? '1px solid #FF4500' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: isSelected ? '#FF4500' : '#121212',
                      color: isSelected ? '#050505' : '#A1A1A1',
                      fontWeight: 700,
                      fontSize: '13px',
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#FF4500';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#A1A1A1';
                      }
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Events Grid */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: '24px'
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '4/3',
                  background: '#121212',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  animation: 'pulse 1.5s infinite'
                }}
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '80px 24px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#121212'
            }}
          >
            <p className="font-mono-x" style={{ color: '#737373', fontSize: '14px' }}>
              No events found in this category.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: '24px'
            }}
          >
            {filteredEvents.map((evt, idx) => (
              <Reveal key={evt._id || idx} delay={idx * 0.08}>
                <EventCard event={evt} index={idx} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
