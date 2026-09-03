import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);

  // Enquiry Form State
  const [enquiryName, setEnquiryName] = useState(user ? user.name : '');
  const [enquiryEmail, setEnquiryEmail] = useState(user ? user.email : '');
  const [enquiryPhone, setEnquiryPhone] = useState(user ? user.phone || '' : '');
  const [enquiryLocation, setEnquiryLocation] = useState('');
  const [enquiryEventType, setEnquiryEventType] = useState('Corporate Summit');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState('');
  const [enquiryError, setEnquiryError] = useState('');

  useEffect(() => {
    if (user) {
      setEnquiryName(user.name || '');
      setEnquiryEmail(user.email || '');
      if (user.phone) setEnquiryPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    fetchAPI('/events')
      .then(res => setEvents(res.data ? res.data.slice(0, 3) : []))
      .catch(() => setEvents([]));
  }, []);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setEnquiryLoading(true);
    setEnquirySuccess('');
    setEnquiryError('');

    try {
      const fullMessage = `Location: ${enquiryLocation} | Details: ${enquiryMessage || 'Location event enquiry requested.'}`;
      const res = await fetchAPI('/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: enquiryName,
          email: enquiryEmail,
          phone: enquiryPhone,
          location: enquiryLocation,
          eventType: enquiryEventType,
          message: fullMessage
        })
      });

      if (res.success) {
        setEnquirySuccess('Thank you! Your event location enquiry has been received. Our event team will get back to you shortly.');
        if (!user) {
          setEnquiryName('');
          setEnquiryEmail('');
          setEnquiryPhone('');
        }
        setEnquiryLocation('');
        setEnquiryMessage('');
      } else {
        setEnquiryError(res.message || 'Failed to submit enquiry.');
      }
    } catch (err) {
      setEnquiryError(err.message || 'Error submitting enquiry. Please try again.');
    } finally {
      setEnquiryLoading(false);
    }
  };

  const faqs = [
    {
      q: "What types of events does Vana Entertainments organize?",
      a: "We specialize in high-end Corporate Summits, Music Concerts & Live Shows, Trade Exhibitions & Expos, Award Galas, and College Cultural Festivals across India."
    },
    {
      q: "How far in advance should we book an event with Vana?",
      a: "For large corporate summits or concerts, we recommend booking 1 to 3 months in advance to secure optimal venue dates, artist booking, and technical setup."
    },
    {
      q: "Does Vana Entertainments handle ticketing and entrance security?",
      a: "Yes! Our platform includes built-in online ticket booking, automated QR code entry passes, and on-site access control."
    },
    {
      q: "Can Vana manage events outside of Bihar?",
      a: "Absolutely. We operate PAN India with turnkey event management teams active in Patna, Delhi, Mumbai, Kolkata, Bangalore, and Bhagalpur."
    }
  ];

  return (
    <div>
      {/* CINEMATIC HERO */}
      <section className="hero-luxury">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fa-solid fa-crown"></i> Luxury Event Management
          </div>
          <h1>Crafting Timeless & <span>Extraordinary</span> Events</h1>
          <p>
            From high-profile corporate summits to mega music concerts and brand expos, Vana Entertainments transforms vision into unforgettable reality.
          </p>
          <div className="hero-actions">
            <Link to="/contact" className="primary-btn">
              <i className="fa-solid fa-calendar-check"></i> Book Your Event
            </Link>
            <Link to="/events" className="btn-hero-outline">
              Explore Events
            </Link>
          </div>
        </div>
      </section>

      {/* STATS COUNTER BAR - Temporarily hidden
      <div className="container">
        <div className="stats-bar">
          <div className="stat-item">
            <div className="num">4+</div>
            <div className="label">Years Excellence</div>
          </div>
          <div className="stat-item">
            <div className="num">500+</div>
            <div className="label">Events Delivered</div>
          </div>
          <div className="stat-item">
            <div className="num">100%</div>
            <div className="label">Client Trust</div>
          </div>
          <div className="stat-item">
            <div className="num">50+</div>
            <div className="label">Cities Reached</div>
          </div>
        </div>
      </div>
      */}

      {/* ABOUT SPOTLIGHT */}
      <section className="page-padding" style={{ padding: '80px 0 60px' }}>
        <div className="container">
          <div className="grid-2col" style={{ alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <img
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"
                alt="Vana Luxury Production"
                style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 45px rgba(0,0,0,0.6)', border: '1px solid var(--border-light)' }}
              />
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#0B0E17', color: '#FFF', padding: '16px 20px', borderRadius: '16px', maxWidth: '240px', boxShadow: '0 15px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <i className="fa-solid fa-quote-left" style={{ color: 'var(--gold-accent)', fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}></i>
                <p style={{ fontSize: '0.82rem', color: '#CBD5E1', margin: 0, fontStyle: 'italic' }}>
                  "We don't just plan events; we architect extraordinary memories."
                </p>
              </div>
            </div>
            <div>
              <div className="section-header" style={{ textAlign: 'left', margin: '0 0 20px' }}>
                <span className="sub-badge">Excellence & Precision</span>
                <h2>Redefining Event Management Across India</h2>
              </div>
              <p style={{ color: 'var(--text-body)', lineHeight: 1.8, marginBottom: '16px', fontSize: '0.95rem' }}>
                Vana Entertainments is a turnkey event production agency recognized for delivering immaculate corporate conferences, celebrity music festivals, trade exhibitions, and award galas.
              </p>
              <p style={{ color: 'var(--text-body)', lineHeight: 1.8, marginBottom: '24px', fontSize: '0.95rem' }}>
                With state-of-the-art stage lighting, line-array acoustics, seamless guest coordination, and integrated digital ticketing, we execute events with precision.
              </p>
              <Link to="/about" className="secondary-btn">
                Discover Our Story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALIZED SERVICES */}
      <section className="page-padding" style={{ padding: '60px 0', background: 'rgba(20, 24, 36, 0.45)' }}>
        <div className="container">
          <div className="section-header">
            <span className="sub-badge">What We Offer</span>
            <h2>Our Specialized Event Services</h2>
            <p style={{ color: 'var(--text-body)' }}>Tailored luxury production solutions engineered for high impact.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div className="service-card-luxury">
              <div className="icon-box">
                <i className="fa-solid fa-building-columns"></i>
              </div>
              <h3 style={{ color: 'var(--text-heading)' }}>Corporate Summits</h3>
              <p style={{ color: 'var(--text-body)' }}>Executive conferences, leadership retreats, product debuts, and annual galas.</p>
              <Link to="/services" className="link-btn">Explore Details →</Link>
            </div>

            <div className="service-card-luxury">
              <div className="icon-box">
                <i className="fa-solid fa-music"></i>
              </div>
              <h3 style={{ color: 'var(--text-heading)' }}>Music Concerts</h3>
              <p style={{ color: 'var(--text-body)' }}>Large-scale live stadium shows, artist booking, sound & light stage management.</p>
              <Link to="/services" className="link-btn">Explore Details →</Link>
            </div>

            <div className="service-card-luxury">
              <div className="icon-box">
                <i className="fa-solid fa-store"></i>
              </div>
              <h3 style={{ color: 'var(--text-heading)' }}>Exhibitions & Expos</h3>
              <p style={{ color: 'var(--text-body)' }}>Custom trade fair pavilion design, stall fabrication, and visitor registrations.</p>
              <Link to="/services" className="link-btn">Explore Details →</Link>
            </div>

            <div className="service-card-luxury">
              <div className="icon-box">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <h3 style={{ color: 'var(--text-heading)' }}>Award Ceremonies</h3>
              <p style={{ color: 'var(--text-body)' }}>Red carpet hosting, stage scenography, VIP management, and live broadcasting.</p>
              <Link to="/services" className="link-btn">Explore Details →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP PROCESS TIMELINE */}
      <section className="page-padding" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="sub-badge">Flawless Journey</span>
            <h2>Our 4-Step Event Process</h2>
            <p style={{ color: 'var(--text-body)' }}>From initial concept spark to final curtain call execution.</p>
          </div>

          <div className="timeline-grid">
            <div className="timeline-step">
              <span className="step-number">01</span>
              <div className="step-icon"><i className="fa-solid fa-comments"></i></div>
              <h3 style={{ color: 'var(--text-heading)' }}>Consultation</h3>
              <p style={{ color: 'var(--text-body)' }}>Deep-dive strategic discussion to map objectives, budget, target audience, and theme.</p>
            </div>

            <div className="timeline-step">
              <span className="step-number">02</span>
              <div className="step-icon"><i className="fa-solid fa-pen-ruler"></i></div>
              <h3 style={{ color: 'var(--text-heading)' }}>Concept & Design</h3>
              <p style={{ color: 'var(--text-body)' }}>3D stage renders, venue floorplans, acoustic modeling, and schedule layout.</p>
            </div>

            <div className="timeline-step">
              <span className="step-number">03</span>
              <div className="step-icon"><i className="fa-solid fa-gears"></i></div>
              <h3 style={{ color: 'var(--text-heading)' }}>Production</h3>
              <p style={{ color: 'var(--text-body)' }}>Vendor coordination, sound/lighting setup, digital ticketing configuration, and security logistics.</p>
            </div>

            <div className="timeline-step">
              <span className="step-number">04</span>
              <div className="step-icon"><i className="fa-solid fa-star"></i></div>
              <h3 style={{ color: 'var(--text-heading)' }}>Execution</h3>
              <p style={{ color: 'var(--text-body)' }}>On-site control tower management ensuring seamless timeline flow and guest satisfaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED UPCOMING EVENTS */}
      <section className="page-padding" style={{ padding: '60px 0', background: 'rgba(20, 24, 36, 0.45)' }}>
        <div className="container">
          <div className="section-header">
            <span className="sub-badge">Book Tickets Now</span>
            <h2>Featured Events & Shows</h2>
            <p style={{ color: 'var(--text-body)' }}>Reserve your pass for upcoming concerts, expos, and summits.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {events.map((evt) => (
              <div key={evt._id} className="event-card-luxury">
                <div className="img-wrapper">
                  <span className="category-badge">{evt.category}</span>
                  <img
                    src={evt.bannerImage}
                    alt={evt.title}
                    loading="lazy"
                    onError={(e) => {
                      if (evt.driveFileId && !e.target.dataset.triedThumbnail) {
                        e.target.dataset.triedThumbnail = 'true';
                        e.target.src = `https://drive.google.com/thumbnail?id=${evt.driveFileId}&sz=w1200`;
                        return;
                      }
                      e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                </div>
                <div className="card-body">
                  <h3 style={{ color: 'var(--text-heading)' }}>{evt.title}</h3>
                  <div className="meta-info">
                    <span><i className="fa-solid fa-location-dot"></i> {evt.venue?.city || 'Bhagalpur'}</span>
                    <span><i className="fa-solid fa-calendar"></i> {evt.eventDate}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: '18px' }}>
                    {evt.description ? evt.description.slice(0, 85) + '...' : 'Join us for an unforgettable event experience.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Pass Starts At</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-accent)' }}>₹{evt.ticketTiers?.[0]?.price || 999}</span>
                    </div>
                    <Link to={`/events/${evt._id}`} className="primary-btn" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                      Book Ticket
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link to="/events" className="secondary-btn">View All Upcoming Events</Link>
          </div>
        </div>
      </section>

      {/* EVENT LOCATION ENQUIRY FORM */}
      <section className="page-padding" style={{ padding: '80px 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="sub-badge">Location Inquiry</span>
            <h2>Enquire For Your Event Location</h2>
            <p style={{ color: 'var(--text-body)' }}>Tell us your preferred venue location, city, and event requirements for a custom proposal.</p>
          </div>

          <div
            className="white-card"
            style={{
              maxWidth: '820px',
              margin: '0 auto',
              padding: '30px 24px',
              borderRadius: '24px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--border-light)'
            }}
          >
            {enquirySuccess && (
              <div
                style={{
                  padding: '16px 20px',
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  borderRadius: '14px',
                  color: '#166534',
                  marginBottom: '24px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <i className="fa-solid fa-circle-check" style={{ fontSize: '1.2rem' }}></i>
                <span>{enquirySuccess}</span>
              </div>
            )}

            {enquiryError && (
              <div
                style={{
                  padding: '16px 20px',
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '14px',
                  color: '#991B1B',
                  marginBottom: '24px',
                  fontWeight: 500
                }}
              >
                {enquiryError}
              </div>
            )}

            <form onSubmit={handleEnquirySubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={enquiryEmail}
                    onChange={(e) => setEnquiryEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="form-group">
                  <label>Event Location / City *</label>
                  <input
                    type="text"
                    required
                    value={enquiryLocation}
                    onChange={(e) => setEnquiryLocation(e.target.value)}
                    placeholder="e.g. Patna, Bhagalpur, Delhi..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '10px' }}>
                <div className="form-group">
                  <label>Event Type</label>
                  <select
                    value={enquiryEventType}
                    onChange={(e) => setEnquiryEventType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      background: '#0B0E17',
                      color: '#F8FAFC',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="Corporate Summit">Corporate Summit / Conference</option>
                    <option value="Music Concert">Music Concert & Live Show</option>
                    <option value="Trade Exhibition">Trade Exhibition & Expo</option>
                    <option value="Award Ceremony">Award Ceremony & Gala</option>
                    <option value="Cultural Fest">College / Cultural Fest</option>
                    <option value="Private Celebration">Private Luxury Event</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Venue Details & Requirements</label>
                <textarea
                  rows="4"
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  placeholder="Mention your preferred dates, expected guest count, stage or acoustic requirements..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    background: '#0B0E17',
                    color: '#F8FAFC',
                    fontSize: '0.95rem',
                    resize: 'vertical'
                  }}
                ></textarea>
              </div>

              <button
                type="submit"
                className="primary-btn"
                style={{ width: '100%', marginTop: '16px', justifyContent: 'center', padding: '14px' }}
                disabled={enquiryLoading}
              >
                {enquiryLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Submitting Location Enquiry...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i>
                    Submit Event Location Enquiry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="page-padding" style={{ padding: '60px 0', background: 'rgba(20, 24, 36, 0.45)' }}>
        <div className="container">
          <div className="section-header">
            <span className="sub-badge">Client Testimonials</span>
            <h2>Words From Our Partners</h2>
            <p>Here is what leaders say about partnering with Vana Entertainments.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="testimonial-card-glass">
              <div className="stars">★★★★★</div>
              <p>"Vana managed our annual tech conference flawlessly. The lighting, acoustics, and seamless check-in setup impressed every corporate delegate."</p>
              <div className="client-info">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Rajesh Sharma" />
                <div>
                  <h4>Rajesh Sharma</h4>
                  <span>VP Operations, TechMatrix India</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card-glass">
              <div className="stars">★★★★★</div>
              <p>"Organizing a stadium concert with 10,000+ attendees felt effortless thanks to Vana's security control and online ticketing system."</p>
              <div className="client-info">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" alt="Amit Verma" />
                <div>
                  <h4>Amit Verma</h4>
                  <span>Festival Director, Live Nation Bihar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="page-padding" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="sub-badge">Got Questions?</span>
            <h2>Frequently Asked Questions</h2>
            <p>Clear answers to help you plan your next event with Vana.</p>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? 'open' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(idx)}>
                  <span>{faq.q}</span>
                  <i className="fa-solid fa-chevron-down"></i>
                </div>
                {activeFaq === idx && (
                  <div className="faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
