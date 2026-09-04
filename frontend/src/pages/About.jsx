import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page-padding" style={{ padding: '96px 0 80px 0', background: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        <div className="section-header">
          <span className="sub-badge">Who We Are</span>
          <h2>Crafting Unforgettable Experiences</h2>
          <p style={{ color: 'var(--text-body)' }}>India’s premier event production agency engineered for luxury & scale.</p>
        </div>
        
        <div className="grid-2col" style={{ alignItems: 'center', marginBottom: '60px', marginTop: '36px' }}>
          <div>
            <h3 style={{ fontSize: '2rem', color: 'var(--text-heading)', marginBottom: '18px' }}>We Plan. You Celebrate.</h3>
            <p style={{ lineHeight: 1.8, color: 'var(--text-body)', marginBottom: '16px', fontSize: '0.98rem' }}>
              Founded with a commitment to creative excellence, Vana Entertainments has grown into one of India’s most trusted full-service event management and production houses.
            </p>
            <p style={{ lineHeight: 1.8, color: 'var(--text-body)', marginBottom: '24px', fontSize: '0.98rem' }}>
              From high-security corporate leadership summits and celebrity stadium concerts to mega trade expos, our team combines 3D stage scenography, line-array acoustics, and automated ticketing software to ensure absolute perfection.
            </p>
            <Link to="/contact" className="primary-btn">
              Get In Touch With Our Team
            </Link>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80"
              alt="Vana Team"
              style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 45px rgba(0,0,0,0.6)', border: '1px solid var(--border-light)' }}
            />
          </div>
        </div>

        {/* Pillars / Values Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          <div className="white-card" style={{ padding: '30px 24px' }}>
            <i className="fa-solid fa-gem" style={{ fontSize: '2rem', color: 'var(--gold-accent)', marginBottom: '16px', display: 'block' }}></i>
            <h3 style={{ color: 'var(--text-heading)' }}>Uncompromising Quality</h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', marginTop: '10px' }}>
              Every stage build, light beam, sound frequency, and guest touchpoint is crafted to luxury standards.
            </p>
          </div>

          <div className="white-card" style={{ padding: '30px 24px' }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '2rem', color: 'var(--gold-accent)', marginBottom: '16px', display: 'block' }}></i>
            <h3 style={{ color: 'var(--text-heading)' }}>Reliable Execution</h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', marginTop: '10px' }}>
              Robust fail-safe protocols, backup power generators, and dedicated control tower directors for every show.
            </p>
          </div>

          <div className="white-card" style={{ padding: '30px 24px' }}>
            <i className="fa-solid fa-lightbulb" style={{ fontSize: '2rem', color: 'var(--gold-accent)', marginBottom: '16px', display: 'block' }}></i>
            <h3 style={{ color: 'var(--text-heading)' }}>Creative Vision</h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', marginTop: '10px' }}>
              3D spatial visualization and immersive stage setups that captivate corporate leaders and concert crowds.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="white-card" style={{ padding: '40px 24px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '1.6rem', color: 'var(--text-heading)' }}>Vana Impact By Numbers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', textAlign: 'center' }}>
            <div style={{ padding: '20px 14px', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <h4 style={{ fontSize: '2.4rem', color: 'var(--gold-accent)', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>4+</h4>
              <p style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>Years Experience</p>
            </div>
            <div style={{ padding: '20px 14px', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <h4 style={{ fontSize: '2.4rem', color: 'var(--gold-accent)', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>500+</h4>
              <p style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>Events Executed</p>
            </div>
            <div style={{ padding: '20px 14px', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <h4 style={{ fontSize: '2.4rem', color: 'var(--gold-accent)', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>50+</h4>
              <p style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>Cities Operational</p>
            </div>
            <div style={{ padding: '20px 14px', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <h4 style={{ fontSize: '2.4rem', color: 'var(--gold-accent)', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>100%</h4>
              <p style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
