import React from 'react';
import VenueLayout from './seating/VenueLayout';

/**
 * InteractiveSeatMap Wrapper Component
 * Integrates standard React HTML/CSS VenueLayout component into existing booking and admin pages.
 */
export default function InteractiveSeatMap(props) {
  return <VenueLayout {...props} />;
}
