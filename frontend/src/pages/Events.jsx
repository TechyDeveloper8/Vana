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
        setLoading(false);
      })
      .catch(() => {
        // Fallback default sample events if backend is empty
        setEvents([
          {
            _id: 'ev-1',
            title: 'Neon Pulse Electric Music Festival',
            category: 'Music',
            date: '2026-10-15',
            city: 'Mumbai',
            venue: { name: 'Jio World Garden', city: 'Mumbai' },
            description: 'A 2-day multi-genre electronic music festival featuring top international DJs, holographic stages, and immersive soundscapes.',
            image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
            tiers: [
              { name: 'General Entry', price: 999, capacity: 500, sold: 120 },
              { name: 'VIP Access', price: 2499, capacity: 150, sold: 45 }
            ]
          },
          {
            _id: 'ev-2',
            title: 'Global Tech & Innovation Summit 2026',
            category: 'Corporate',
            date: '2026-11-04',
            city: 'Bengaluru',
            venue: { name: 'BIEC Convention Center', city: 'Bengaluru' },
            description: 'India\'s premier tech leadership summit hosting founders, investors, and visionaries discussing AI, robotics, and next-gen ventures.',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
            tiers: [
              { name: 'Delegate Pass', price: 1499, capacity: 300, sold: 80 },
              { name: 'Executive VIP', price: 4999, capacity: 50, sold: 20 }
            ]
          },
          {
            _id: 'ev-3',
            title: 'The Royal Symphony: Live Orchestral Night',
            category: 'Theater',
            date: '2026-11-20',
            city: 'Delhi',
            venue: { name: 'Siri Fort Auditorium', city: 'Delhi' },
            description: 'A mesmerizing evening of live cinematic scores and classical orchestral compositions performed by a 70-piece international ensemble.',
            image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
            tiers: [
              { name: 'Silver Tier', price: 799, capacity: 200, sold: 60 },
              { name: 'Gold Tier', price: 1999, capacity: 100, sold: 40 }
            ]
          }
        ]);
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
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
              gap: '24px',
              marginBottom: '48px'
            }}
          >
            <h1
              className="heading"
              style={{
                fontFamily: "'Cabinet Grotesk', -apple-system, sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                textTransform: 'uppercase',
                letterSpacing: '-0.03em',
                lineHeight: 0.95,
                color: '#FFFFFF',
                margin: 0
              }}
            >
              All Events
            </h1>

            {/* Category Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '8px 20px',
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '28px'
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
