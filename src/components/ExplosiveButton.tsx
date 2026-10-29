
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bomb } from 'lucide-react';
import { useSounds } from '@/utils/useSounds';

const ExplosiveButton = () => {
  const [isExploding, setIsExploding] = useState(false);
  const { toast } = useToast();
  const { playSound } = useSounds();
  const tickingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const explosionElementRef = useRef<HTMLDivElement | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug to check if sounds are available
  useEffect(() => {
    console.log('ExplosiveButton mounted, checking sound availability...');
  }, []);

  // Clean up effects when component unmounts
  useEffect(() => {
    return () => {
      if (tickingTimeoutRef.current) {
        clearTimeout(tickingTimeoutRef.current);
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      // Remove explosion element if it exists
      if (explosionElementRef.current && document.body.contains(explosionElementRef.current)) {
        document.body.removeChild(explosionElementRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
   
  };

  const handleMouseLeave = () => {
    // If there's a timeout for ticking, clear it
    if (tickingTimeoutRef.current) {
      clearTimeout(tickingTimeoutRef.current);
      tickingTimeoutRef.current = null;
    }
  };

  const handleClick = () => {
    setIsExploding(true);
    // Play explosion sound
    console.log('Playing explosion sound...');
    playSound('explosion');
    
    toast({
      title: "BOOM!",
      description: "You actually pushed the button! Redirecting you now...",
    });
    
    // Add explosion effect to the entire page
    const explosion = document.createElement('div');
    explosionElementRef.current = explosion;
    explosion.style.position = 'fixed';
    explosion.style.top = '0';
    explosion.style.left = '0';
    explosion.style.width = '100%';
    explosion.style.height = '100%';
    explosion.style.backgroundColor = 'hsl(var(--primary))';
    explosion.style.zIndex = '9999';
    explosion.style.opacity = '0';
    explosion.style.transition = 'opacity 0.3s ease-in';
    document.body.appendChild(explosion);
    
    // Show explosion
    setTimeout(() => {
      explosion.style.opacity = '1';
    }, 100);
    
    // Redirect after a delay
    redirectTimeoutRef.current = setTimeout(() => {
      window.location.href = 'https://yashantgyawali.typeform.com/to/rbizSifr';
    }, 900);
  };

  return (
    <div className="relative">
      <button
        className={`btn-primary ${isExploding ? 'animate-explode' : 'hover:animate-wiggle'}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isExploding}
      >
        <div className="flex items-center gap-2">
          <Bomb className="h-5 w-5" data-villain="bomb" /> Push the button
        </div>
      </button>
      <p className="mt-3 text-lg font-cursive text-muted-foreground">**What's the worst that could happen?</p>
    </div>
  );
};

export default ExplosiveButton;
