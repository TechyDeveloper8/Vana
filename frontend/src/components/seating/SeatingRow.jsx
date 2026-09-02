import React from 'react';

/**
 * SeatingRow Component (Standard React HTML/CSS)
 * Renders row letters and seat container elements.
 */
export default function SeatingRow({ rowLabel, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative'
      }}
    >
      {rowLabel && (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: '#94A3B8',
            width: '16px',
            textAlign: 'center',
            userSelect: 'none'
          }}
        >
          {rowLabel}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {children}
      </div>
    </div>
  );
}
