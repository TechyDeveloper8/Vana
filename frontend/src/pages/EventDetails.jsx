import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAPI } from '../services/api';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI(`/events/${id}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '80px 0', textAlign: 'center', color: '#5F5F5F' }}>Loading Event Details...</div>;
  if (!event) return <div style={{ padding: '80px 0', textAlign: 'center', color: '#5F5F5F' }}>Event not found.</div>;

  return (
    <div className="page-padding" style={{ padding: '60px 0', background: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        <div className="white-card" style={{ overflow: 'hidden', borderRadius: '24px' }}>
          <img
            src={event.bannerImage}
            alt={event.title}
            loading="lazy"
            style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
            onError={(e) => {
              if (event.driveFileId && !e.target.dataset.triedThumbnail) {
                e.target.dataset.triedThumbnail = 'true';
                e.target.src = `https://drive.google.com/thumbnail?id=${event.driveFileId}&sz=w1600`;
                return;
              }
              e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          <div className="event-details-card-body">
            <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-accent)', padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
              {event.category}
            </span>

            <h1 className="event-details-title" style={{ marginTop: '16px', marginBottom: '16px', color: 'var(--text-heading)', fontWeight: 700 }}>
              {event.title}
            </h1>
            
            <div className="grid-sidebar" style={{ marginTop: '32px' }}>
              {/* Event Main Synopsis & Ticket Tiers */}
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '14px', color: 'var(--text-heading)' }}>Event Synopsis</h3>
                <p style={{ lineHeight: 1.8, color: 'var(--text-body)', marginBottom: '32px', fontSize: '1rem' }}>{event.description}</p>

                <h3 style={{ fontSize: '1.4rem', marginBottom: '18px', color: 'var(--text-heading)' }}>Available Ticket Tiers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {event.ticketTiers && event.ticketTiers.map((tier, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '16px', background: '#0B0E17', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontFamily: 'Plus Jakarta Sans, sans-serif', margin: 0, color: 'var(--text-heading)' }}>{tier.tierName}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px', margin: 0 }}>Available Seats: {tier.availableSeats}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold-accent)' }}>₹{tier.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Event Summary & Book Button */}
              <div style={{ background: '#0B0E17', padding: '24px', borderRadius: '20px', height: 'fit-content', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '10px', color: 'var(--gold-accent)' }}>Event Information</h3>
                <p style={{ marginBottom: '12px', color: 'var(--text-body)', fontSize: '0.92rem' }}><strong style={{ color: 'var(--text-heading)' }}>📅 Date:</strong> {event.eventDate}</p>
                <p style={{ marginBottom: '12px', color: 'var(--text-body)', fontSize: '0.92rem' }}><strong style={{ color: 'var(--text-heading)' }}>⏰ Time:</strong> {event.startTime} - {event.endTime}</p>
                <p style={{ marginBottom: '12px', color: 'var(--text-body)', fontSize: '0.92rem' }}><strong style={{ color: 'var(--text-heading)' }}>📍 Venue:</strong> {event.venue?.name}, {event.venue?.city}</p>
                <p style={{ marginBottom: '12px', color: 'var(--text-body)', fontSize: '0.92rem' }}><strong style={{ color: 'var(--text-heading)' }}>🏢 Organizer:</strong> {event.organizer}</p>
                <p style={{ marginBottom: '24px', color: 'var(--text-body)', fontSize: '0.92rem' }}><strong style={{ color: 'var(--text-heading)' }}>📞 Support:</strong> {event.contactNumber}</p>

                <Link to={`/book-ticket/${event._id}`} className="primary-btn" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                  <i className="fa-solid fa-ticket" style={{ marginRight: '8px' }}></i>
                  Book Official Ticket
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
