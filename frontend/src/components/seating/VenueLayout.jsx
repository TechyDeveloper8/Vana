import React, { useState, useRef, useEffect, useCallback } from 'react';
import Seat from './Seat';

/**
 * VenueLayout Component (100% Standard React HTML/CSS)
 * NO SVG or Canvas used for seats or venue map rendering.
 * Features Mobile-First quick zoom presets, activePlan filtering, two-finger pinch-to-zoom,
 * single-finger pan, double-tap zoom, and auto-centering.
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

  // Gesture tracking refs for 60fps zero-latency touch and mouse updates
  const panRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchModeRef = useRef('none'); // 'none' | 'drag' | 'pinch'
  const pinchStartRef = useRef({ dist: 0, scale: 1, center: { x: 0, y: 0 }, pan: { x: 0, y: 0 } });
  const hasMovedRef = useRef(false);
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

  // Standardized auditorium architecture bounds
  const viewWidth = 1700;
  const viewHeight = 1150;

  // Keep refs synchronized with state
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Calculate dynamic scale to fit the entire venue layout architecture inside the container
  const getFitScale = useCallback(() => {
    if (!containerRef.current) return 0.55;
    const cw = containerRef.current.clientWidth || 1000;
    const ch = containerRef.current.clientHeight || 580;
    const scaleX = cw / viewWidth;
    const scaleY = ch / viewHeight;
    // Fit both dimensions comfortably with safe margin
    return Math.max(0.16, Math.min(scaleX, scaleY) * 0.92);
  }, [viewWidth, viewHeight]);

  // Automatically center and fit the entire venue layout inside the container
  const fitToLayout = useCallback(() => {
    const fs = getFitScale();
    setScale(fs);
    scaleRef.current = fs;
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
  }, [getFitScale]);

  // Auto focus / center map based on activePlan or fit all on initial load
  useEffect(() => {
    const applyFitOrPlan = () => {
      if (!containerRef.current) return;
      const fitScale = getFitScale();

      if (activePlan === 'Silver' || activePlan === 'First Floor') {
        const s = Math.max(fitScale * 1.8, 1.15);
        const p = { x: 0, y: Math.round(viewHeight * 0.26) };
        setScale(s);
        setPan(p);
        scaleRef.current = s;
        panRef.current = p;
      } else if (activePlan === 'Gold') {
        const s = Math.max(fitScale * 1.6, 1.05);
        const p = { x: 0, y: 0 };
        setScale(s);
        setPan(p);
        scaleRef.current = s;
        panRef.current = p;
      } else if (activePlan === 'Platinum') {
        const s = Math.max(fitScale * 1.8, 1.15);
        const p = { x: 0, y: -Math.round(viewHeight * 0.22) };
        setScale(s);
        setPan(p);
        scaleRef.current = s;
        panRef.current = p;
      } else if (activePlan === 'VIP Lounge') {
        const s = Math.max(fitScale * 2.0, 1.25);
        const p = { x: 0, y: -Math.round(viewHeight * 0.35) };
        setScale(s);
        setPan(p);
        scaleRef.current = s;
        panRef.current = p;
      } else {
        // 'All': Fit the entire venue architecture 100% inside container, dead-center
        setScale(fitScale);
        setPan({ x: 0, y: 0 });
        scaleRef.current = fitScale;
        panRef.current = { x: 0, y: 0 };
      }
    };

    const timer = setTimeout(applyFitOrPlan, 40);

    const handleResize = () => {
      if (activePlan === 'All') {
        applyFitOrPlan();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [activePlan, viewWidth, viewHeight, getFitScale]);

  // Zoom controls
  const handleZoom = (delta) => {
    setScale((prevScale) => {
      const fitScale = getFitScale();
      const minScale = Math.min(0.15, fitScale * 0.85);
      const newScale = Math.min(Math.max(prevScale + delta, minScale), 3.2);
      const rounded = Math.round(newScale * 100) / 100;
      scaleRef.current = rounded;
      return rounded;
    });
  };

  const handlePresetZoom = (targetScale) => {
    setScale(targetScale);
    scaleRef.current = targetScale;
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
  };

  const handleResetZoom = () => {
    fitToLayout();
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    handleZoom(delta);
  };

  // Desktop Mouse Drag Handlers
  const handleStart = (clientX, clientY) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: clientX - panRef.current.x, y: clientY - panRef.current.y };
    setDragStart(dragStartRef.current);
  };

  const handleMove = (clientX, clientY) => {
    if (isDraggingRef.current) {
      const moveDist = Math.hypot(
        clientX - (dragStartRef.current.x + panRef.current.x),
        clientY - (dragStartRef.current.y + panRef.current.y)
      );
      if (moveDist > 5) {
        hasMovedRef.current = true;
      }
      const newX = clientX - dragStartRef.current.x;
      const newY = clientY - dragStartRef.current.y;
      panRef.current = { x: newX, y: newY };
      setPan({ x: newX, y: newY });
    }
  };

  const handleEnd = () => {
    isDraggingRef.current = false;
    touchModeRef.current = 'none';
    setIsDragging(false);
  };

  // Mobile Touch Gestures: Single-finger Drag, Two-finger Pinch to Zoom, Double Tap
  const handleTouchStart = (e) => {
    if (e.touches.length >= 2) {
      // Multi-touch: Start Pinch to Zoom
      if (e.cancelable) e.preventDefault();
      touchModeRef.current = 'pinch';
      isDraggingRef.current = false;
      setIsDragging(false);

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const mid = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };

      pinchStartRef.current = {
        dist: Math.max(dist, 10),
        scale: scaleRef.current,
        pan: { ...panRef.current },
        center: mid
      };
    } else if (e.touches.length === 1) {
      // Single touch: Pan / Drag
      touchModeRef.current = 'drag';
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      setIsDragging(true);

      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - panRef.current.x,
        y: touch.clientY - panRef.current.y
      };
      setDragStart(dragStartRef.current);
    }
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.touches.length >= 2) {
      // Multi-touch pinch-to-zoom calculation
      if (touchModeRef.current !== 'pinch' || !pinchStartRef.current.dist) {
        touchModeRef.current = 'pinch';
        isDraggingRef.current = false;
        setIsDragging(false);
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const mid = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2
        };
        pinchStartRef.current = {
          dist: Math.max(dist, 10),
          scale: scaleRef.current,
          pan: { ...panRef.current },
          center: mid
        };
        return;
      }

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentMid = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };

      const scaleFactor = currentDist / pinchStartRef.current.dist;
      const fitScale = getFitScale();
      const minScale = Math.min(0.15, fitScale * 0.85);
      const maxScale = 3.5;
      const targetScale = Math.min(Math.max(pinchStartRef.current.scale * scaleFactor, minScale), maxScale);

      // Center shift to keep zoom anchored around user pinch center
      const deltaX = currentMid.x - pinchStartRef.current.center.x;
      const deltaY = currentMid.y - pinchStartRef.current.center.y;

      const newPan = {
        x: pinchStartRef.current.pan.x + deltaX,
        y: pinchStartRef.current.pan.y + deltaY
      };

      scaleRef.current = targetScale;
      panRef.current = newPan;
      setScale(targetScale);
      setPan(newPan);
    } else if (e.touches.length === 1 && touchModeRef.current === 'drag') {
      // Single-finger panning
      const touch = e.touches[0];
      const newX = touch.clientX - dragStartRef.current.x;
      const newY = touch.clientY - dragStartRef.current.y;

      const moveDist = Math.hypot(
        touch.clientX - (dragStartRef.current.x + panRef.current.x),
        touch.clientY - (dragStartRef.current.y + panRef.current.y)
      );
      if (moveDist > 4) {
        hasMovedRef.current = true;
      }

      panRef.current = { x: newX, y: newY };
      setPan({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      // Double-tap zoom toggle on background
      const now = Date.now();
      const target = e.target;
      const isInteractive = target?.closest?.('button') || target?.closest?.('.seat-interactive-btn');

      if (!hasMovedRef.current && !isInteractive && (now - lastTapRef.current.time) < 320) {
        const fitScale = getFitScale();
        if (scaleRef.current > fitScale + 0.3) {
          fitToLayout();
        } else {
          const zoomInScale = Math.max(fitScale * 2.0, 1.35);
          setScale(zoomInScale);
          scaleRef.current = zoomInScale;
        }
        lastTapRef.current = { time: 0, x: 0, y: 0 };
      } else {
        lastTapRef.current = {
          time: now,
          x: e.changedTouches?.[0]?.clientX || 0,
          y: e.changedTouches?.[0]?.clientY || 0
        };
      }

      touchModeRef.current = 'none';
      isDraggingRef.current = false;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // Transition from 2 fingers down to 1 finger: seamless switch to drag
      touchModeRef.current = 'drag';
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y
      };
      setDragStart(dragStartRef.current);
    }
  };

  // Prevent browser-level page scrolling when dragging inside container on touch devices
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventTouchScroll = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      container.removeEventListener('touchmove', preventTouchScroll);
    };
  }, [layout]);

  // Safe seat click prevents accidental selection when panning
  const handleSeatClickSafe = (seat, price) => {
    if (hasMovedRef.current) {
      return; // Ignore tap after dragging
    }
    if (adminMode) {
      onAdminToggleSeat?.(seat, price);
    } else {
      onSeatClick?.(seat, price);
    }
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
        height: 'clamp(440px, 66vh, 680px)',
        backgroundColor: '#0F172A',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.3)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onWheel={handleWheel}
      onMouseDown={(e) => {
        if (e.button !== 0 || touchModeRef.current !== 'none') return;
        handleStart(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (touchModeRef.current === 'none') {
          handleMove(e.clientX, e.clientY);
        }
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
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
            onClick={fitToLayout}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: scale <= getFitScale() + 0.05 ? '1px solid #F59E0B' : 'none',
              background: scale <= getFitScale() + 0.05 ? '#F59E0B' : '#1E293B',
              color: scale <= getFitScale() + 0.05 ? '#000' : '#FFF',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Fit Venue
          </button>
          <button
            type="button"
            onClick={() => handlePresetZoom(Math.max(getFitScale() * 1.8, 1.15))}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              background: '#1E293B',
              color: '#FFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Zoom In
          </button>
          <button
            type="button"
            onClick={() => handlePresetZoom(Math.max(getFitScale() * 2.5, 1.6))}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              background: '#1E293B',
              color: '#FFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close-up
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset to Fit View"
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

      {/* Touch Pan & Zoom Hint Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          padding: '6px 12px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#CBD5E1',
          fontSize: '0.72rem',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <i className="fa-solid fa-up-down-left-right" style={{ color: '#F59E0B' }}></i>
        <span>Drag to pan • Pinch to zoom</span>
      </div>

      {/* Floating Mobile-Friendly Zoom Controls (+, −, ⤢) */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(10px)',
          padding: '5px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(0.25);
          }}
          title="Zoom In"
          aria-label="Zoom In"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: '#1E293B',
            color: '#F8FAFC',
            fontSize: '19px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'background 0.15s ease'
          }}
        >
          +
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(-0.25);
          }}
          title="Zoom Out"
          aria-label="Zoom Out"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: '#1E293B',
            color: '#F8FAFC',
            fontSize: '21px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'background 0.15s ease'
          }}
        >
          −
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fitToLayout();
          }}
          title="Fit Entire Venue"
          aria-label="Fit Venue"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            background: '#292524',
            color: '#F59E0B',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'background 0.15s ease'
          }}
        >
          <i className="fa-solid fa-expand"></i>
        </button>
      </div>

      {/* Main Transform Canvas */}
      <div
        id="venue-pan-area"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${viewWidth}px`,
          height: `${viewHeight}px`,
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging || touchModeRef.current === 'pinch' ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
          margin: 0,
          willChange: 'transform'
        }}
      >


        {/* FIRST FLOOR LEFT WING OUTER ROW LABELS */}
        {[
          { label: '1H', x: 165, y: 104 },
          { label: '1G', x: 150, y: 134 },
          { label: '1F', x: 135, y: 164 },
          { label: '1E', x: 120, y: 194 },
          { label: '1D', x: 105, y: 224 },
          { label: '1C', x: 90, y: 254 },
          { label: '1B', x: 75, y: 284 },
          { label: '1A', x: 60, y: 314 }
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

        {/* MAIN PERFORMANCE STAGE (LOCATED IN FRONT OF VIP SEATS AT BOTTOM OF VENUE) */}
        <div
          id="auditorium-main-stage"
          style={{
            position: 'absolute',
            left: '290px',
            top: '1015px',
            width: '1020px',
            height: '75px',
            background: 'linear-gradient(180deg, #1E293B 0%, #090D16 100%)',
            border: '2px solid #F59E0B',
            borderRadius: '14px 14px 40px 40px',
            boxShadow: '0 0 45px rgba(245, 158, 11, 0.4), inset 0 2px 14px rgba(255, 255, 255, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Row of Stage Footlights facing the audience */}
          <div
            style={{
              position: 'absolute',
              top: '6px',
              display: 'flex',
              gap: '24px',
              alignItems: 'center'
            }}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  boxShadow: '0 0 8px #F59E0B'
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: '4px'
            }}
          >
            <span style={{ color: '#F59E0B', fontSize: '15px' }}>✦</span>
            <span
              style={{
                fontFamily: "'Cabinet Grotesk', -apple-system, sans-serif",
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '0.28em',
                color: '#F59E0B',
                textTransform: 'uppercase',
                textShadow: '0 0 15px rgba(245, 158, 11, 0.6)'
              }}
            >
              STAGE
            </span>
            <span style={{ color: '#F59E0B', fontSize: '15px' }}>✦</span>
          </div>
        </div>

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
              onClick={handleSeatClickSafe}
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
