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
    <div className="page-padding" style={{ padding: '60px 0', background: '#F8EFE8', minHeight: '85vh' }}>
      <div className="container">
        <div className="white-card" style={{ overflow: 'hidden', borderRadius: '24px' }}>
          <img
            src={event.bannerImage}
            alt={event.title}
            loading="lazy"
            style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'; }}
          />

          <div className="event-details-card-body">
            <span style={{ background: '#111827', color: '#D4AF37', padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {event.category}
            </span>

            <h1 className="event-details-title" style={{ marginTop: '16px', marginBottom: '16px', color: '#1F1F1F', fontWeight: 700 }}>
              {event.title}
            </h1>
            
            <div className="grid-sidebar" style={{ marginTop: '32px' }}>
              {/* Event Main Synopsis & Ticket Tiers */}
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '14px', color: '#1F1F1F' }}>Event Synopsis</h3>
                <p style={{ lineHeight: 1.8, color: '#5F5F5F', marginBottom: '32px', fontSize: '1rem' }}>{event.description}</p>

                <h3 style={{ fontSize: '1.4rem', marginBottom: '18px', color: '#1F1F1F' }}>Available Ticket Tiers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {event.ticketTiers && event.ticketTiers.map((tier, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', border: '1px solid #E7DDD1', borderRadius: '16px', background: '#FAFAFA', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontFamily: 'Plus Jakarta Sans, sans-serif', margin: 0 }}>{tier.tierName}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#8E8E8E', marginTop: '4px', margin: 0 }}>Available Seats: {tier.availableSeats}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#B8860B' }}>₹{tier.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Event Summary & Book Button */}
              <div style={{ background: '#F6EFE5', padding: '24px', borderRadius: '20px', height: 'fit-content', border: '1px solid #E7DDD1' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', borderBottom: '1px solid #E7DDD1', paddingBottom: '10px' }}>Event Information</h3>
                <p style={{ marginBottom: '12px', color: '#5F5F5F', fontSize: '0.92rem' }}><strong style={{ color: '#1F1F1F' }}>📅 Date:</strong> {event.eventDate}</p>
                <p style={{ marginBottom: '12px', color: '#5F5F5F', fontSize: '0.92rem' }}><strong style={{ color: '#1F1F1F' }}>⏰ Time:</strong> {event.startTime} - {event.endTime}</p>
                <p style={{ marginBottom: '12px', color: '#5F5F5F', fontSize: '0.92rem' }}><strong style={{ color: '#1F1F1F' }}>📍 Venue:</strong> {event.venue?.name}, {event.venue?.city}</p>
                <p style={{ marginBottom: '12px', color: '#5F5F5F', fontSize: '0.92rem' }}><strong style={{ color: '#1F1F1F' }}>🏢 Organizer:</strong> {event.organizer}</p>
                <p style={{ marginBottom: '24px', color: '#5F5F5F', fontSize: '0.92rem' }}><strong style={{ color: '#1F1F1F' }}>📞 Support:</strong> {event.contactNumber}</p>

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
