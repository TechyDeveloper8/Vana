import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page-padding" style={{ padding: '60px 0', background: '#F8EFE8', minHeight: '85vh' }}>
      <div className="container">
        <div className="section-header">
          <span className="sub-badge">Who We Are</span>
          <h2>Crafting Unforgettable Experiences</h2>
          <p>India’s premier event production agency engineered for luxury & scale.</p>
        </div>
        
        <div className="grid-2col" style={{ alignItems: 'center', marginBottom: '60px', marginTop: '36px' }}>
          <div>
            <h3 style={{ fontSize: '2rem', color: '#1F1F1F', marginBottom: '18px' }}>We Plan. You Celebrate.</h3>
            <p style={{ lineHeight: 1.8, color: '#5F5F5F', marginBottom: '16px', fontSize: '0.98rem' }}>
              Founded with a commitment to creative excellence, Vana Entertainments has grown into one of India’s most trusted full-service event management and production houses.
            </p>
            <p style={{ lineHeight: 1.8, color: '#5F5F5F', marginBottom: '24px', fontSize: '0.98rem' }}>
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
              style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(31,31,31,0.08)', border: '1px solid #E7DDD1' }}
            />
          </div>
        </div>

        {/* Pillars / Values Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          <div className="white-card" style={{ padding: '30px 24px' }}>
            <i className="fa-solid fa-gem" style={{ fontSize: '2rem', color: '#B8860B', marginBottom: '16px', display: 'block' }}></i>
            <h3>Uncompromising Quality</h3>
            <p style={{ color: '#5F5F5F', fontSize: '0.92rem', marginTop: '10px' }}>
              Every stage build, light beam, sound frequency, and guest touchpoint is crafted to luxury standards.
            </p>
          </div>

          <div className="white-card" style={{ padding: '30px 24px' }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '2rem', color: '#B8860B', marginBottom: '16px', display: 'block' }}></i>
            <h3>Reliable Execution</h3>
            <p style={{ color: '#5F5F5F', fontSize: '0.92rem', marginTop: '10px' }}>
              Robust fail-safe protocols, backup power generators, and dedicated control tower directors for every show.
            </p>
          </div>

          <div className="white-card" style={{ padding: '30px 24px' }}>
            <i className="fa-solid fa-lightbulb" style={{ fontSize: '2rem', color: '#B8860B', marginBottom: '16px', display: 'block' }}></i>
            <h3>Creative Vision</h3>
            <p style={{ color: '#5F5F5F', fontSize: '0.92rem', marginTop: '10px' }}>
              3D spatial visualization and immersive stage setups that captivate corporate leaders and concert crowds.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="white-card" style={{ padding: '40px 24px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '1.6rem' }}>Vana Impact By Numbers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', textAlign: 'center' }}>
            <div style={{ padding: '20px 14px', background: '#F6EFE5', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '2.4rem', color: '#B8860B', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>4+</h4>
              <p style={{ fontWeight: 600, color: '#1F1F1F', fontSize: '0.9rem' }}>Years Experience</p>
            </div>
            <div style={{ padding: '20px 14px', background: '#F6EFE5', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '2.4rem', color: '#B8860B', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>500+</h4>
              <p style={{ fontWeight: 600, color: '#1F1F1F', fontSize: '0.9rem' }}>Events Executed</p>
            </div>
            <div style={{ padding: '20px 14px', background: '#F6EFE5', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '2.4rem', color: '#B8860B', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>50+</h4>
              <p style={{ fontWeight: 600, color: '#1F1F1F', fontSize: '0.9rem' }}>Cities Operational</p>
            </div>
            <div style={{ padding: '20px 14px', background: '#F6EFE5', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '2.4rem', color: '#B8860B', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>100%</h4>
              <p style={{ fontWeight: 600, color: '#1F1F1F', fontSize: '0.9rem' }}>Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
