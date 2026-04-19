import React from 'react';

const CoinIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="55%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    
    {/* Outer Rim */}
    <circle 
      cx="12" cy="12" r="10.5" 
      fill="url(#coinGradient)" 
      stroke="#78350F" 
      strokeWidth="0.5"
    />
    
    {/* Inner Detailing */}
    <circle 
      cx="12" cy="12" r="8.5" 
      stroke="#78350F" 
      strokeWidth="0.5" 
      opacity="0.3"
    />
    
    {/* Beveled Edge Effect */}
    <circle 
      cx="12" cy="12" r="9.5" 
      stroke="white" 
      strokeWidth="0.5" 
      opacity="0.2"
    />

    {/* Center Character - S for ScholarNode */}
    <text 
      x="12" y="16" 
      fill="#78350F" 
      fontSize="11" 
      fontWeight="900" 
      textAnchor="middle" 
      fontFamily="Arial, sans-serif"
      style={{ letterSpacing: '-0.05em' }}
    >S</text>
    
    {/* Micro Dots */}
    <circle cx="12" cy="4" r="0.5" fill="#78350F" opacity="0.5" />
    <circle cx="12" cy="20" r="0.5" fill="#78350F" opacity="0.5" />
    <circle cx="4" cy="12" r="0.5" fill="#78350F" opacity="0.5" />
    <circle cx="20" cy="12" r="0.5" fill="#78350F" opacity="0.5" />
  </svg>
);

export default CoinIcon;
