import React from 'react';

/**
 * VIPLounge Component (Standard React HTML/CSS)
 * Renders VIP Lounge sofa units (V1-V15 in 5 groups) and VIP boundary guides.
 */
export default function VIPLounge({ children }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '140px',
        pointerEvents: 'none'
      }}
    >
      {/* VIP Lounge Boundary Box Line */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '20px',
          right: '20px',
          bottom: '50px',
          border: '1.5px dashed rgba(239, 68, 68, 0.4)',
          borderRadius: '24px',
          pointerEvents: 'none'
        }}
      />

      {/* Red Pointer Lines connecting VIP sofas to VIP LOUNGE text */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '750px',
          height: '25px',
          borderBottom: '2px solid #DC2626',
          borderLeft: '2px solid #DC2626',
          borderRight: '2px solid #DC2626',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '2px',
          height: '25px',
          background: '#DC2626',
          pointerEvents: 'none'
        }}
      />

      {/* Children VIP Couch Seats */}
      {children}
    </div>
  );
}
