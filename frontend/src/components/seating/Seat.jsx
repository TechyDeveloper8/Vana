import React from 'react';

/**
 * Individual Interactive Seat Component (100% React HTML/CSS Button)
 * Renders standard armchair or VIP couch unit without using SVG or Canvas.
 */
export default function Seat({
  seat,
  status = 'Available',
  price = 0,
  isSelected = false,
  isDimmed = false,
  adminMode = false,
  isAdminSelected = false,
  onClick,
  onMouseEnter,
  onMouseLeave
}) {
  const isClickable = !isDimmed && (status === 'Available' || isSelected || adminMode);
  const isCouch = seat.type === 'couch';

  // Compute color scheme based on category and status
  const getStyles = () => {
    if (adminMode && isAdminSelected) {
      return {
        background: '#3B82F6',
        borderColor: '#1D4ED8',
        color: '#FFFFFF',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)'
      };
    }

    if (isSelected) {
      return {
        background: '#F59E0B',
        borderColor: '#B45309',
        color: '#FFFFFF',
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.8)',
        transform: 'scale(1.15)'
      };
    }

    switch (status) {
      case 'Available':
        if (seat.category === 'Silver') {
          return {
            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
            borderColor: '#CBD5E1',
            color: '#F8FAFC'
          };
        } else if (seat.category === 'Gold') {
          return {
            background: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
            borderColor: '#64748B',
            color: '#F8FAFC'
          };
        } else if (seat.category === 'Platinum') {
          return {
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderColor: '#94A3B8',
            color: '#F8FAFC'
          };
        } else if (seat.category === 'VIP Lounge') {
          return {
            background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)',
            borderColor: '#EF4444',
            color: '#FFFFFF'
          };
        } else {
          return {
            background: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
            borderColor: '#64748B',
            color: '#F8FAFC'
          };
        }
      case 'Temporarily Locked':
        return {
          background: '#EA580C',
          borderColor: '#C2410C',
          color: '#FFFFFF'
        };
      case 'Booked':
      case 'Sold':
        return {
          background: '#374151',
          borderColor: '#1F2937',
          color: '#9CA3AF',
          opacity: 0.6
        };
      case 'Blocked':
        return {
          background: '#DC2626',
          borderColor: '#991B1B',
          color: '#FCA5A5',
          opacity: 0.75
        };
      case 'Reserved':
        return {
          background: '#7C3AED',
          borderColor: '#581C87',
          color: '#FFFFFF'
        };
      default:
        return {
          background: '#334155',
          borderColor: '#64748B',
          color: '#FFFFFF'
        };
    }
  };

  const style = getStyles();

  if (isCouch) {
    return (
      <button
        type="button"
        onClick={() => isClickable && onClick?.(seat, price)}
        onMouseEnter={() => !isDimmed && onMouseEnter?.(seat)}
        onMouseLeave={() => onMouseLeave?.()}
        title={isDimmed ? '' : `Seat ${seat.displayLabel} (${seat.category}) - ₹${price}`}
        style={{
          position: 'absolute',
          left: `${seat.x}px`,
          top: `${seat.y}px`,
          width: '26px',
          height: '22px',
          transform: `translate(-50%, -50%) rotate(${seat.rotation || 0}deg)`,
          borderRadius: '6px',
          border: `1.5px solid ${style.borderColor}`,
          background: style.background,
          color: style.color,
          boxShadow: style.boxShadow || '0 2px 5px rgba(0,0,0,0.3)',
          cursor: isClickable ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: 0,
          outline: 'none',
          transition: 'all 0.2s ease',
          opacity: isDimmed ? 0.15 : (style.opacity || 1),
          pointerEvents: isDimmed ? 'none' : 'auto',
          filter: isDimmed ? 'grayscale(80%)' : 'none'
        }}
      >
        <span
          style={{
            transform: `rotate(-${seat.rotation || 0}deg)`,
            fontSize: '9px',
            fontWeight: 800,
            pointerEvents: 'none'
          }}
        >
          {seat.seatNumber}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => isClickable && onClick?.(seat, price)}
      onMouseEnter={() => !isDimmed && onMouseEnter?.(seat)}
      onMouseLeave={() => onMouseLeave?.()}
      title={isDimmed ? '' : `Seat ${seat.displayLabel} (${seat.category}) - ₹${price}`}
      style={{
        position: 'absolute',
        left: `${seat.x}px`,
        top: `${seat.y}px`,
        width: '20px',
        height: '20px',
        transform: `translate(-50%, -50%) rotate(${seat.rotation || 0}deg)`,
        borderRadius: '5px',
        border: `1.5px solid ${style.borderColor}`,
        background: style.background,
        color: style.color,
        boxShadow: style.boxShadow || '0 2px 4px rgba(0,0,0,0.25)',
        cursor: isClickable ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: 0,
        outline: 'none',
        transition: 'all 0.2s ease',
        opacity: isDimmed ? 0.15 : (style.opacity || 1),
        pointerEvents: isDimmed ? 'none' : 'auto',
        filter: isDimmed ? 'grayscale(80%)' : 'none'
      }}
    >
      <span
        style={{
          transform: `rotate(-${seat.rotation || 0}deg)`,
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '-0.3px',
          pointerEvents: 'none'
        }}
      >
        {seat.displayLabel}
      </span>
    </button>
  );
}
