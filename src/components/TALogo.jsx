import React from 'react';

export function TALogo({ size = 28, color = "#a19ea5" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="25" x2="80" y2="25" stroke={color} strokeWidth="3" strokeLinecap="square"/>
      <line x1="50" y1="25" x2="50" y2="50" stroke={color} strokeWidth="3"/>
      <polygon points="50,27 23,67 77,67" stroke={color} strokeWidth="3" fill="none" strokeLinejoin="miter"/>
      <line x1="34" y1="50" x2="66" y2="50" stroke={color} strokeWidth="3"/>
      <line x1="28" y1="60" x2="72" y2="60" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

export default TALogo;