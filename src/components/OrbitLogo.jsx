import React from 'react';

export function OrbitLogo({ size = 42, color = "#dcd9d2" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="14" stroke={color} strokeWidth="3" />
      <path d="M 50 18 A 32 32 0 0 1 77.7 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 82 50 A 32 32 0 0 1 34 77.7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 22.3 66 A 32 32 0 0 1 50 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="18" r="4.5" fill={color} />
      <circle cx="77.7" cy="66" r="4.5" fill={color} />
      <circle cx="22.3" cy="66" r="4.5" fill={color} />
    </svg>
  );
}

export default OrbitLogo;