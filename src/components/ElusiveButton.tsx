
import React, { useEffect, useRef } from 'react';

interface ElusiveButtonProps {
  children: React.ReactNode;
  className?: string;
}

const ElusiveButton: React.FC<ElusiveButtonProps> = ({ children, className = '' }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    
    const handleMouseOver = () => {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 100;
      
      // Make sure the button stays within viewport
      const rect = button.getBoundingClientRect();
      const parentRect = button.parentElement?.getBoundingClientRect();
      
      if (!parentRect) return;
      
      const maxX = parentRect.width - rect.width;
      const maxY = parentRect.height - rect.height;
      
      const safeX = Math.max(0, Math.min(maxX, rect.left - parentRect.left + x));
      const safeY = Math.max(0, Math.min(maxY, rect.top - parentRect.top + y));
      
      button.style.transform = `translate(${safeX}px, ${safeY}px)`;
    };
    
    button.addEventListener('mouseenter', handleMouseOver);
    
    return () => {
      button.removeEventListener('mouseenter', handleMouseOver);
    };
  }, []);
  
  return (
    <button 
      ref={buttonRef}
      className={`absolute px-6 py-3 border-2 border-accent font-medium rounded-md text-white bg-accent transition-transform duration-200 ${className}`}
    >
      {children}
    </button>
  );
};

export default ElusiveButton;
