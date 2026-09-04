import React from 'react';
import { Link } from 'react-router-dom';

export default function Services() {
  const servicesList = [
    {
      title: 'Corporate Summits & Conferences',
      desc: 'High-profile leadership summits, corporate AGMs, keynote speaker stages, and executive dinners.',
      icon: 'fa-building-columns',
      features: ['Stage Scenography & LED Screens', 'Delegate Badging & RFID Registration', 'Simultaneous Translation & Live Stream', 'VIP Executive Catering']
    },
    {
      title: 'Music Concerts & Live Shows',
      desc: 'Stadium-scale musical events, artist line-up bookings, sound engineering, and laser lighting.',
      icon: 'fa-music',
      features: ['Line-Array Acoustic Systems', 'Celebrity Hospitality & Security', 'Online Ticket Booking System', 'Crowd Management & Barrier Rigging']
    },
    {
      title: 'Exhibitions & Trade Expos',
      desc: 'Custom octanorm and wooden stall fabrication, pavilion design, visitor registration desks.',
      icon: 'fa-store',
      features: ['3D Stall Architectural Layout', 'Visitor Pass & Access Control', 'Power & Electrical Grid Setup', 'Exhibitor Media Coverage']
    },
    {
      title: 'Award Ceremonies & Galas',
      desc: 'Glamorous red carpet evenings, trophy production, celebrity hosts, and televised galas.',
      icon: 'fa-trophy',
      features: ['Red Carpet Step & Repeat Media', 'Custom 3D Trophy Fabrication', 'Pyro & Special FX Rigging', 'Multi-Camera Broadcast Recording']
    },
    {
      title: 'College Festivals & Star Nights',
      desc: 'Youth cultural festivals, technical expos, celebrity performance nights, and battle of the bands.',
      icon: 'fa-graduation-cap',
      features: ['Campus Wide Stage Setup', 'College Committee Coordination', 'Security & Bouncer Control', 'Pro-Nite Artist Management']
    }
  ];

  return (
    <div className="page-padding" style={{ padding: '60px 0', background: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        <div className="section-header">
          <span className="sub-badge">Excellence Delivered</span>
          <h2>Our Specialized Event Services</h2>
          <p style={{ color: 'var(--text-body)' }}>Comprehensive luxury production solutions engineered for high impact and flawless execution.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px', marginTop: '36px' }}>
          {servicesList.map((srv, idx) => (
            <div key={idx} className="service-card-luxury">
              <div className="icon-box">
                <i className={`fa-solid ${srv.icon}`}></i>
              </div>
              <h3 style={{ color: 'var(--text-heading)' }}>{srv.title}</h3>
              <p style={{ marginBottom: '18px', fontSize: '0.92rem', color: 'var(--text-body)' }}>{srv.desc}</p>
              <ul style={{ marginBottom: '20px' }}>
                {srv.features.map((feat, fIdx) => (
                  <li key={fIdx} style={{ fontSize: '0.85rem', color: 'var(--text-body)', padding: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--gold-accent)', fontSize: '0.82rem' }}></i> {feat}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="primary-btn" style={{ padding: '10px 22px', fontSize: '0.85rem', marginTop: 'auto', justifyContent: 'center' }}>
                Book This Service
              </Link>
            </div>
          ))}
        </div>

        <div className="white-card" style={{ textAlign: 'center', marginTop: '48px', padding: '40px 24px', borderRadius: '24px' }}>
          <h3 style={{ fontSize: '1.75rem', marginBottom: '12px', color: 'var(--text-heading)' }}>Need a Tailored Custom Event Solution?</h3>
          <p style={{ color: 'var(--text-body)', maxWidth: '600px', margin: '0 auto 20px', fontSize: '0.95rem' }}>
            Our lead event strategists and technical directors are ready to engineer a bespoke package for your upcoming event.
          </p>
          <Link to="/contact" className="primary-btn">
            Request Custom Proposal
          </Link>
        </div>
      </div>
    </div>
  );
}
