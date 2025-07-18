import { useState, useEffect } from 'react';
import wcLogoPath from "@assets/ChatGPT Image Jun 22, 2025, 08_42_35 PM_1750639361021.png";

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

export default function Logo({ size = 'medium', className = '' }: LogoProps) {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const img = new Image();
    img.src = wcLogoPath;
    img.onload = () => setLoaded(true);
  }, []);

  // Handle different sizes
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16',
    xlarge: 'h-48',
  };

  return (
    <div className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <img 
        src={wcLogoPath} 
        alt="WarmConnect" 
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
}