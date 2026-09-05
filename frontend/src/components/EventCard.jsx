import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Calendar } from "lucide-react";

export function formatDate(iso) {
  if (!iso) return "Upcoming";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function fromPrice(event) {
  if (!event) return 499;
  if (event.tiers && event.tiers.length) {
    return Math.min(...event.tiers.map((t) => Number(t.price) || 0));
  }
  if (event.ticketTiers && event.ticketTiers.length) {
    return Math.min(...event.ticketTiers.map((t) => Number(t.price) || 0));
  }
  if (event.price) return Number(event.price);
  return 499;
}

export function getFallbackImage(category = '', title = '') {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes('music') || text.includes('concert') || text.includes('festival') || text.includes('dj')) {
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';
  }
  if (text.includes('corp') || text.includes('tech') || text.includes('summit') || text.includes('creator') || text.includes('business')) {
    return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';
  }
  if (text.includes('theater') || text.includes('theatre') || text.includes('symphony') || text.includes('orchestr')) {
    return 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';
  }
  return 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';
}

export default function EventCard({ event, index = 0 }) {
  if (!event) return null;
  const eventId = event._id || event.id;
  const category = event.category || "Live Show";
  const city = event.city || event.venue?.city || event.venue?.name || "Mumbai";
  const dateStr = formatDate(event.date || event.eventDate);
  const minPrice = fromPrice(event);

  let rawImg = event.bannerImage || event.image;
  if (!rawImg || rawImg.includes('event1.jpg')) {
    rawImg = getFallbackImage(category, event.title);
  }

  return (
    <Link
      to={`/events/${eventId}`}
      data-testid={`event-card-${eventId}`}
      className="group block border border-border bg-card hover:border-primary transition-all duration-300"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#121212',
        borderRadius: '0px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        overflow: 'hidden'
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          background: '#0D0D11'
        }}
      >
        {/* Subtle natural backdrop of image itself without any artificial odd gradients */}
        <img
          src={rawImg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackImage(category, event.title);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(16px)',
            opacity: 0.35,
            transform: 'scale(1.1)',
            pointerEvents: 'none'
          }}
        />
        {/* Full uncropped sharp image fitting cleanly */}
        <img
          src={rawImg}
          alt={event.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackImage(category, event.title);
          }}
          className="w-full h-full transition-all duration-500"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 2,
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 45%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
        <span
          className="font-mono-x"
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            background: 'rgba(5, 5, 5, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#FF4500',
            zIndex: 3
          }}
        >
          {category}
        </span>
        <span
          className="card-arrow-btn"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FF4500',
            color: '#050505',
            transition: 'all 0.3s ease',
            zIndex: 3
          }}
        >
          <ArrowUpRight size={18} strokeWidth={2.5} />
        </span>
      </div>

      <div style={{ padding: 'clamp(18px, 3vw, 24px)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          className="font-display"
          style={{
            fontFamily: "'Cabinet Grotesk', -apple-system, sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(1.2rem, 1.8vw, 1.38rem)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            color: '#FFFFFF',
            marginBottom: '12px',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          {event.title}
        </h3>

        <div
          className="font-mono-x"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 16px',
            fontSize: '12px',
            color: '#A1A1A1',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: '20px'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="#FF4500" /> {dateStr}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={13} color="#FF4500" /> {city}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            marginTop: 'auto'
          }}
        >
          <span
            className="font-mono-x"
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#737373',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            Starting From
          </span>
          <span
            className="font-display"
            style={{
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontWeight: 900,
              fontSize: '1.35rem',
              color: '#FF4500'
            }}
          >
            ₹{minPrice}
          </span>
        </div>
      </div>
    </Link>
  );
}
