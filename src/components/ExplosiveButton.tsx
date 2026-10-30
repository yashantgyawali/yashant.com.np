
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bomb } from 'lucide-react';
import { useSounds } from '@/utils/useSounds';
import { openContact } from '@/lib/contact';

const ExplosiveButton = () => {
  const [isExploding, setIsExploding] = useState(false);
  const { toast } = useToast();
  const { playSound } = useSounds();
  // Looping fuse tick while the cursor is on the button.
  const tickRef = useRef<HTMLAudioElement | null>(null);
  const explosionElementRef = useRef<HTMLDivElement | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Debug to check if sounds are available
  useEffect(() => {
    console.log('ExplosiveButton mounted, checking sound availability...');
  }, []);

  // Clean up effects when component unmounts
  useEffect(() => {
    return () => {
      tickRef.current?.pause();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      // Remove explosion element if it exists
      if (explosionElementRef.current && document.body.contains(explosionElementRef.current)) {
        document.body.removeChild(explosionElementRef.current);
      }
    };
  }, []);

  const stopTick = () => {
    const tick = tickRef.current;
    if (!tick) return;
    tick.pause();
    tick.currentTime = 0;
  };

  const handleMouseEnter = () => {
    if (isExploding) return;
    if (!tickRef.current) {
      const tick = new Audio('/sounds/bomb-tick.mp3');
      tick.loop = true;
      tick.volume = 0.2;
      tickRef.current = tick;
    }
    tickRef.current.currentTime = 0;
    tickRef.current.play().catch(() => {
      /* autoplay blocked until the visitor interacts, stay quiet */
    });
  };

  const handleMouseLeave = () => {
    stopTick();
  };

  const handleClick = () => {
    stopTick();
    setIsExploding(true);
    // Play explosion sound
    console.log('Playing explosion sound...');
    playSound('explosion');
    
    const boom = toast({
      title: "BOOM!",
      description: "Well, now you have to talk to me.",
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
    
    // Once the screen is pink, open the contact page underneath, then fade
    // the flash away and clear it so the site is usable again.
    redirectTimeoutRef.current = setTimeout(() => {
      // The toast would sit over the contact page's top bar on phones.
      boom.dismiss();
      openContact('push-the-button', buttonRef.current);
      setIsExploding(false);
      explosion.style.transition = 'opacity 0.4s ease-out';
      explosion.style.opacity = '0';
      fadeTimeoutRef.current = setTimeout(() => {
        explosion.remove();
        if (explosionElementRef.current === explosion) explosionElementRef.current = null;
      }, 450);
    }, 900);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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
