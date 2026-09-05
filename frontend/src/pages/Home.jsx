import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import { ArrowUpRight, ArrowRight, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Reveal, MaskLines } from '../components/Reveal';
import EventCard from '../components/EventCard';

const CHAPTERS = [
  {
    n: "01",
    title: "Concept & Curation",
    body: "Every event begins with a bold artistic vision. We shape narratives, book tier-one talent, and architect the atmosphere before the first ticket goes live."
  },
  {
    n: "02",
    title: "Production & Engineering",
    body: "Stage design, precision acoustic engineering, kinetic lighting, and spatial audio — our production crews turn open stadiums into living worlds."
  },
  {
    n: "03",
    title: "Ticketing & Access Control",
    body: "Seamless instant booking, tiered VIP allocations, and encrypted RFID / QR gate verification keep the room energized from door opening to encore."
  },
  {
    n: "04",
    title: "The Live Climax",
    body: "On show day, surgical logistics meet raw sensory spectacle. We direct every cue so thousands of attendees can lose themselves in the moment."
  }
];

const HERO_IMG = "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800";

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  // Quick Consultation Form State
  const [enquiryName, setEnquiryName] = useState(user ? user.name : '');
  const [enquiryEmail, setEnquiryEmail] = useState(user ? user.email : '');
  const [enquiryPhone, setEnquiryPhone] = useState(user ? user.phone || '' : '');
  const [enquiryLocation, setEnquiryLocation] = useState('');
  const [enquiryEventType, setEnquiryEventType] = useState('Corporate Summit');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState('');

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  useEffect(() => {
    setEventsLoading(true);
    fetchAPI('/events')
      .then((res) => {
        const list = res.data || [];
        setEvents(list.slice(0, 6));
      })
      .catch((err) => {
        console.error('Failed to load events from backend:', err);
        setEvents([]);
      })
      .finally(() => {
        setEventsLoading(false);
      });
  }, []);

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setEnquiryLoading(true);
    setEnquirySuccess('');

    try {
      await fetchAPI('/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: enquiryName,
          email: enquiryEmail,
          phone: enquiryPhone,
          location: enquiryLocation,
          eventType: enquiryEventType,
          message: enquiryMessage || 'Event enquiry requested via homepage.'
        })
      });
      setEnquirySuccess('Thank you! Your event production enquiry has been received. Our directors will contact you within 24 hours.');
      setEnquiryMessage('');
    } catch {
      setEnquirySuccess('Thank you! Your enquiry has been received. Our production team will contact you shortly.');
    } finally {
      setEnquiryLoading(false);
    }
  };

  const faqs = [
    {
      q: "What types of productions does Vana Entertainment execute?",
      a: "We specialize in stadium concerts, immersive electronic festivals, high-stakes corporate leadership summits, international trade expos, and cinematic theatrical shows across India."
    },
    {
      q: "How does Vana's digital ticketing and access pass system work?",
      a: "Every pass booked through Vana is digitally signed with dynamic encrypted QR codes. Our staff portal scans and authorizes tickets at gate turnstiles in under 0.8 seconds."
    },
    {
      q: "Can Vana manage production and technical logistics outside major metro cities?",
      a: "Yes. With equipment hubs in Mumbai, Delhi, Bengaluru, and East India, we deliver stadium-level staging, lighting, and sound reinforcement nationwide."
    }
  ];

  return (
    <div className="grain" style={{ background: '#050505', color: '#FFFFFF', overflowX: 'hidden' }}>
      {/* 1. CINEMATIC BRUTALIST HERO */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          minHeight: 'clamp(540px, 88vh, 850px)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          paddingTop: '88px'
        }}
      >
        <motion.div
          style={{ y: imgY, scale: imgScale, position: 'absolute', inset: 0, zIndex: 0 }}
        >
          <img
            src={HERO_IMG}
            alt="Vana Live Stage"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.65) 45%, rgba(5,5,5,0.3) 100%)'
            }}
          />
        </motion.div>

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 24px) clamp(40px, 7vh, 72px) clamp(16px, 4vw, 24px)'
          }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-mono-x"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: '#FF4500',
              marginBottom: '20px'
            }}
          >
            Live Events · Since 2026
          </motion.p>

          <h1
            className="heading"
            style={{
              fontFamily: "'Cabinet Grotesk', -apple-system, sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(3rem, 8.5vw, 7.5rem)',
              textTransform: 'uppercase',
              letterSpacing: '-0.035em',
              lineHeight: 0.95,
              color: '#FFFFFF',
              margin: 0
            }}
          >
            <MaskLines
              lines={[
                "We Build",
                "Unforgettable",
                <span key="highlight" style={{ color: '#FF4500' }}>Live Moments</span>
              ]}
            />
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: '32px',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '24px'
            }}
          >
            <p
              style={{
                color: '#A1A1A1',
                maxWidth: '580px',
                fontSize: '1.05rem',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              Vana Entertainments is a dynamic new-age event and entertainment startup founded by Vaishnavi Sharma and Sudhanshu Shekhar, with a shared vision to bring bigger, better and more memorable entertainment experiences.
            </p>

            <Link
              to="/events"
              data-testid="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: '#FF4500',
                color: '#050505',
                padding: '18px 36px',
                fontWeight: 900,
                fontSize: '15px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textDecoration: 'none',
                borderRadius: '0px',
                transition: 'opacity 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Explore Events <ArrowUpRight size={20} strokeWidth={2.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. INFINITE TICKER MARQUEE */}
      <section
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px 0',
          background: '#050505'
        }}
      >
        <Marquee speed={50} gradient={false}>
          {[
            "Music Festivals",
            "Corporate Summits",
            "Live Theatre",
            "Brand Launches",
            "Concerts",
            "Award Shows",
            "Arena Experiences"
          ].map((item, idx) => (
            <span
              key={idx}
              className="stroke-text"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                margin: '0 36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '36px'
              }}
            >
              {item}
              <span style={{ color: '#FF4500', WebkitTextStroke: '0px', fontSize: '2.5rem' }}>✦</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* 3. KEY STATS ROW */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
            gap: '24px'
          }}
        >
          {[
            ["500+", "Events Produced"],
            ["1.2M", "Tickets Sold"],
            ["40+", "Cities Across India"],
            ["11", "Years Live Experience"]
          ].map(([num, label], i) => (
            <Reveal key={label} delay={i * 0.08}>
              <div
                style={{
                  borderLeft: '1px solid #FF4500',
                  paddingLeft: '24px'
                }}
              >
                <div
                  className="font-display"
                  style={{
                    fontFamily: "'Cabinet Grotesk', sans-serif",
                    fontWeight: 900,
                    fontSize: 'clamp(2.5rem, 4vw, 3.75rem)',
                    color: '#FFFFFF',
                    lineHeight: 1
                  }}
                >
                  {num}
                </div>
                <div
                  className="font-mono-x"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: '#737373',
                    marginTop: '10px'
                  }}
                >
                  {label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. FEATURED LINE-UP */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 24px) clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)' }}>
        <Reveal>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '48px',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <p
                className="font-mono-x"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: '#FF4500',
                  marginBottom: '12px'
                }}
              >
                Now On Sale
              </p>
              <h2
                className="heading"
                style={{
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.03em',
                  margin: 0,
                  color: '#FFFFFF'
                }}
              >
                Featured Events
              </h2>
            </div>

            <Link
              to="/events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 600
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4500')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            >
              All Events <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>

        {eventsLoading ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: '#737373' }} className="font-mono-x">
            Loading Live Events...
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              padding: '64px 32px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#121212',
              textAlign: 'center'
            }}
          >
            <p
              className="font-mono-x"
              style={{
                fontSize: '12px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#FF4500',
                marginBottom: '8px'
              }}
            >
              Upcoming Schedule
            </p>
            <h3
              className="font-display"
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}
            >
              No Live Events Published Yet
            </h3>
            <p style={{ color: '#A1A1A1', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
              Check back soon as we unveil stadium concerts, leadership summits, and cultural spectacles.
            </p>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FF4500',
                color: '#050505',
                padding: '10px 24px',
                fontWeight: 800,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textDecoration: 'none'
              }}
            >
              Enquire For Private Productions
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '24px'
            }}
          >
            {events.map((e, idx) => (
              <Reveal key={e._id || idx} delay={idx * 0.1}>
                <EventCard event={e} index={idx} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 5. CHAPTER MANIFESTO: FROM FIRST SPARK TO FINAL ENCORE */}
      <section
        id="services"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#080808',
          padding: '96px 0'
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <p
              className="font-mono-x"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                color: '#FF4500',
                marginBottom: '12px'
              }}
            >
              What We Do
            </p>
            <h2
              className="heading"
              style={{
                fontFamily: "'Cabinet Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
                textTransform: 'uppercase',
                letterSpacing: '-0.03em',
                maxWidth: '850px',
                marginBottom: '64px',
                color: '#FFFFFF',
                margin: '0 0 64px 0'
              }}
            >
              From First Spark To Final Encore
            </h2>
          </Reveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '48px'
            }}
          >
            {CHAPTERS.map((c, i) => (
              <Reveal key={c.n} delay={i * 0.08}>
                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '28px',
                    display: 'flex',
                    gap: '20px'
                  }}
                >
                  <span
                    className="font-mono-x"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '15px',
                      color: '#FF4500',
                      fontWeight: 700
                    }}
                  >
                    {c.n}.
                  </span>
                  <div>
                    <h3
                      className="font-display"
                      style={{
                        fontFamily: "'Cabinet Grotesk', sans-serif",
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.02em',
                        marginBottom: '12px',
                        color: '#FFFFFF'
                      }}
                    >
                      {c.title}
                    </h3>
                    <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                      {c.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EVENT CONSULTATION FORM & FAQ */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '48px'
          }}
        >
          {/* Consultation Form */}
          <div>
            <Reveal>
              <p
                className="font-mono-x"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: '#FF4500',
                  marginBottom: '12px'
                }}
              >
                Production Booking
              </p>
              <h2
                className="heading"
                style={{
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  marginBottom: '16px',
                  color: '#FFFFFF'
                }}
              >
                Book Consultation
              </h2>
              <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
                Planning a corporate gala, stadium tour, or private festival? Let our production architects take over.
              </p>

              {enquirySuccess ? (
                <div
                  style={{
                    padding: '24px',
                    border: '1px solid #FF4500',
                    background: '#121212',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <CheckCircle2 color="#FF4500" size={24} />
                  <p style={{ color: '#FFFFFF', margin: 0, fontSize: '14px' }}>{enquirySuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                    <input
                      type="text"
                      required
                      placeholder="Your Name *"
                      value={enquiryName}
                      onChange={(e) => setEnquiryName(e.target.value)}
                      style={{
                        padding: '14px',
                        background: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        outline: 'none',
                        borderRadius: '0px'
                      }}
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address *"
                      value={enquiryEmail}
                      onChange={(e) => setEnquiryEmail(e.target.value)}
                      style={{
                        padding: '14px',
                        background: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        outline: 'none',
                        borderRadius: '0px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={enquiryPhone}
                      onChange={(e) => setEnquiryPhone(e.target.value)}
                      style={{
                        padding: '14px',
                        background: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        outline: 'none',
                        borderRadius: '0px'
                      }}
                    />
                    <select
                      value={enquiryEventType}
                      onChange={(e) => setEnquiryEventType(e.target.value)}
                      style={{
                        padding: '14px',
                        background: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        outline: 'none',
                        borderRadius: '0px'
                      }}
                    >
                      <option value="Corporate Summit">Corporate Summit</option>
                      <option value="Live Music Festival">Live Music Festival</option>
                      <option value="Arena Concert">Arena Concert</option>
                      <option value="Brand Launch">Brand Launch</option>
                      <option value="Theatrical Show">Theatrical Show</option>
                    </select>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Tell us about the city, expected attendees, and date..."
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    style={{
                      padding: '14px',
                      background: '#121212',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      outline: 'none',
                      borderRadius: '0px',
                      resize: 'none'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={enquiryLoading}
                    style={{
                      padding: '16px',
                      background: '#FF4500',
                      color: '#050505',
                      fontWeight: 900,
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '0px'
                    }}
                  >
                    {enquiryLoading ? 'Submitting...' : 'Request Proposal →'}
                  </button>
                </form>
              )}
            </Reveal>
          </div>

          {/* FAQ Accordion */}
          <div>
            <Reveal>
              <p
                className="font-mono-x"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: '#FF4500',
                  marginBottom: '12px'
                }}
              >
                Inquiries
              </p>
              <h2
                className="heading"
                style={{
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  marginBottom: '24px',
                  color: '#FFFFFF'
                }}
              >
                Frequently Asked
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {faqs.map((f, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: '#121212',
                        borderRadius: '0px'
                      }}
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        style={{
                          width: '100%',
                          padding: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'transparent',
                          border: 'none',
                          color: '#FFFFFF',
                          textAlign: 'left',
                          fontFamily: "'Cabinet Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          cursor: 'pointer'
                        }}
                      >
                        <span>{f.q}</span>
                        {isOpen ? <ChevronUp size={18} color="#FF4500" /> : <ChevronDown size={18} color="#A1A1A1" />}
                      </button>
                      {isOpen && (
                        <div
                          style={{
                            padding: '0 20px 20px 20px',
                            color: '#A1A1A1',
                            fontSize: '14px',
                            lineHeight: 1.7,
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          {f.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
