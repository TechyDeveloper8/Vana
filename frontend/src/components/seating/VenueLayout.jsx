import React, { useState, useRef, useEffect } from 'react';
import Seat from './Seat';

/**
 * VenueLayout Component (100% Standard React HTML/CSS)
 * NO SVG or Canvas used for seats or venue map rendering.
 * Features Mobile-First quick zoom presets, activePlan filtering, and touch gestures.
 */
export default function VenueLayout({
  layout,
  availabilityMap = {},
  selectedSeatIds = [],
  activePlan = 'All',
  onSeatClick,
  adminMode = false,
  adminSelectedSeatIds = [],
  onAdminToggleSeat
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState(null);

  const containerRef = useRef(null);

  const viewWidth = layout?.dimensions?.width || 1400;
  const viewHeight = layout?.dimensions?.height || 950;

  // Auto focus / center map based on activePlan
  useEffect(() => {
    if (activePlan === 'Silver' || activePlan === 'First Floor') {
      setScale(1.25);
      setPan({ x: 0, y: 220 });
    } else if (activePlan === 'Gold') {
      setScale(1.25);
      setPan({ x: 0, y: -180 });
    } else if (activePlan === 'Platinum') {
      setScale(1.15);
      setPan({ x: 0, y: -100 });
    } else if (activePlan === 'VIP Lounge') {
      setScale(1.35);
      setPan({ x: 0, y: -380 });
    } else {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [activePlan]);

  // Zoom controls
  const handleZoom = (delta) => {
    setScale((prevScale) => {
      const newScale = Math.min(Math.max(prevScale + delta, 0.5), 3.0);
      return Math.round(newScale * 100) / 100;
    });
  };

  const handlePresetZoom = (targetScale) => {
    setScale(targetScale);
    setPan({ x: 0, y: targetScale === 1 ? 0 : 40 });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    handleZoom(delta);
  };

  // Mouse & Touch Drag Handlers
  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMove = (clientX, clientY) => {
    if (isDragging) {
      setPan({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  if (!layout || !layout.seats) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#94A3B8' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '12px' }}></i>
        <p>Loading Venue Seating Architecture...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(360px, 55vh, 580px)',
        backgroundColor: '#0F172A',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.3)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onWheel={handleWheel}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handleEnd}
    >
      {/* Floating Header Control Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 20,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#F8FAFC',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontWeight: 700, color: '#F59E0B' }}>
            {activePlan === 'All' ? 'Auditorium View' : `${activePlan}`}
          </span>
          <span style={{ color: '#64748B' }}>|</span>
          <span style={{ color: '#94A3B8' }}>{selectedSeatIds.length} seat(s)</span>
        </div>

        {/* Mobile Quick-Zoom Preset Pills */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            padding: '4px 6px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            type="button"
            onClick={() => handlePresetZoom(1)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: scale === 1 ? '1px solid #F59E0B' : 'none',
              background: scale === 1 ? '#F59E0B' : '#1E293B',
              color: scale === 1 ? '#000' : '#FFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Fit 1x
          </button>
          <button
            type="button"
            onClick={() => handlePresetZoom(1.5)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: scale === 1.5 ? '1px solid #F59E0B' : 'none',
              background: scale === 1.5 ? '#F59E0B' : '#1E293B',
              color: scale === 1.5 ? '#000' : '#FFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Focus 1.5x
          </button>
          <button
            type="button"
            onClick={() => handlePresetZoom(2.2)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: scale === 2.2 ? '1px solid #F59E0B' : 'none',
              background: scale === 2.2 ? '#F59E0B' : '#1E293B',
              color: scale === 2.2 ? '#000' : '#FFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close-up 2.2x
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset"
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              background: '#334155',
              color: '#FFF',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Touch Pan Hint Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          padding: '4px 10px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#94A3B8',
          fontSize: '0.7rem',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <i className="fa-solid fa-hand-pointer" style={{ color: '#F59E0B' }}></i>
        <span>Drag to pan • Tap seats to select</span>
      </div>

      {/* Main Transform Canvas */}
      <div
        id="venue-pan-area"
        style={{
          position: 'relative',
          width: `${viewWidth}px`,
          height: `${viewHeight}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          margin: '0 auto'
        }}
      >


        {/* FIRST FLOOR LEFT WING OUTER ROW LABELS */}
        {[
          { label: '1H', x: 165, y: 104 },
          { label: '1G', x: 150, y: 134 },
          { label: '1F', x: 135, y: 164 },
          { label: '1E', x: 120, y: 194 },
          { label: '1D', x: 105, y: 224 },
          { label: '1C', x: 90,  y: 254 },
          { label: '1B', x: 75,  y: 284 },
          { label: '1A', x: 60,  y: 314 }
        ].map((r) => (
          <div
            key={`ffl-rowlabel-${r.label}`}
            style={{
              position: 'absolute',
              left: `${r.x}px`,
              top: `${r.y}px`,
              fontSize: '11px',
              fontWeight: 800,
              color: '#94A3B8',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {r.label}
          </div>
        ))}

        {/* FIRST FLOOR CENTER SECTION DUAL ROW LABELS */}
        {[
          { label: '1G', y: 134 },
          { label: '1F', y: 164 },
          { label: '1E', y: 194 },
          { label: '1D', y: 224 },
          { label: '1C', y: 254 },
          { label: '1B', y: 284 },
          { label: '1A', y: 314 }
        ].map((r) => (
          <React.Fragment key={`ffc-rowlabels-${r.label}`}>
            <div
              style={{
                position: 'absolute',
                left: '475px',
                top: `${r.y}px`,
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748B',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                position: 'absolute',
                left: '1215px',
                top: `${r.y}px`,
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748B',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {r.label}
            </div>
          </React.Fragment>
        ))}

        {/* FIRST FLOOR RIGHT WING OUTER ROW LABELS */}
        {[
          { label: '1G', x: 1505, y: 134 },
          { label: '1F', x: 1528, y: 164 },
          { label: '1E', x: 1535, y: 194 },
          { label: '1D', x: 1535, y: 224 },
          { label: '1C', x: 1535, y: 254 },
          { label: '1B', x: 1535, y: 284 },
          { label: '1A', x: 1490, y: 314 }
        ].map((r) => (
          <div
            key={`ffr-rowlabel-${r.label}`}
            style={{
              position: 'absolute',
              left: `${r.x}px`,
              top: `${r.y}px`,
              fontSize: '11px',
              fontWeight: 800,
              color: '#94A3B8',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {r.label}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: '460px',
            top: '55px',
            width: '1px',
            height: '280px',
            borderLeft: '2px dashed #475569',
            pointerEvents: 'none'
          }}
        />
        {/* FIRST FLOOR CENTER — CENTRAL VERTICAL AISLE LINE */}
        <div
          style={{
            position: 'absolute',
            left: '850px',
            top: '125px',
            width: '1px',
            height: '210px',
            borderLeft: '2px dashed rgba(148, 163, 184, 0.4)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '1240px',
            top: '55px',
            width: '1px',
            height: '280px',
            borderLeft: '2px dashed #475569',
            pointerEvents: 'none'
          }}
        />

        {/* GROUND FLOOR WALKWAY / AISLE DIVIDERS */}
        <div
          style={{
            position: 'absolute',
            left: '435px',
            top: '380px',
            width: '1px',
            height: '420px',
            borderLeft: '2px dashed #334155',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '925px',
            top: '380px',
            width: '1px',
            height: '420px',
            borderLeft: '2px dashed #334155',
            pointerEvents: 'none'
          }}
        />

        {/* DYNAMIC REACT HTML SEATS MAPPING */}
        {layout.seats.map((seat) => {
          const avail = availabilityMap[seat.seatId] || {};
          const status = avail.status || 'Available';
          const price = typeof avail.price === 'number' && avail.price > 0
            ? avail.price
            : (seat.price || (seat.category === 'Silver' ? 500 : seat.category === 'Gold' ? 700 : seat.category === 'VIP Lounge' ? 1500 : 1000));
          
          // Determine if seat should be dimmed based on active plan selection
          const isDimmed = activePlan !== 'All' && seat.category !== activePlan && !(activePlan === 'Silver' && (seat.category === 'Silver' || seat.section?.startsWith('FIRST_FLOOR')));

          return (
            <Seat
              key={seat.seatId}
              seat={seat}
              status={status}
              price={price}
              isSelected={selectedSeatIds.includes(seat.seatId)}
              isDimmed={isDimmed}
              adminMode={adminMode}
              isAdminSelected={adminSelectedSeatIds.includes(seat.seatId)}
              onClick={adminMode ? onAdminToggleSeat : onSeatClick}
              onMouseEnter={(s) => setHoveredSeat({ ...s, status, price })}
              onMouseLeave={() => setHoveredSeat(null)}
            />
          );
        })}
      </div>

      {/* Floating Hover Seat Tooltip */}
      {hoveredSeat && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#FFF',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem'
          }}
        >
          <div>
            <strong style={{ color: '#F59E0B', marginRight: '6px' }}>
              Seat {hoveredSeat.displayLabel}
            </strong>
            <span style={{ color: '#94A3B8' }}>({hoveredSeat.category})</span>
          </div>
          <span style={{ color: '#64748B' }}>|</span>
          <div>
            <strong style={{ color: '#10B981' }}>₹{hoveredSeat.price}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
