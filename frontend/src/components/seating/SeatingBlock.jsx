import React from 'react';

/**
 * SeatingBlock Component (Standard React HTML/CSS)
 * Renders a seating block container with configurable CSS positioning and rotation.
 */
export default function SeatingBlock({
  name,
  blockType,
  transform,
  children
}) {
  return (
    <div
      className={`seating-block block-${blockType}`}
      style={{
        position: 'absolute',
        transform: transform || 'none',
        transformOrigin: 'center center',
        pointerEvents: 'auto'
      }}
    >
      {children}
    </div>
  );
}
