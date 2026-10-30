
import React, { useEffect } from 'react';
import { Hand, Sword } from 'lucide-react';
import { useSounds } from '@/utils/useSounds';
import { contactHref } from '@/lib/contact';

const Footer = () => {
  const { playSound, soundsLoaded } = useSounds();
  
  useEffect(() => {
    console.log('Footer mounted, sounds loaded:', soundsLoaded);
  }, [soundsLoaded]);

  const handleSayHelloHover = () => {
    console.log('Playing sling sound...');
    playSound('sling');
  };

  return (
    <footer className="section bg-primary border-t-2 border-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <p className="font-heading text-2xl font-bold mb-6 text-foreground">Find me @</p>
          
          <div className="flex space-x-6">
            <a 
              href="https://www.linkedin.com/in/yashantgyawali/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-surface border-2 border-foreground shadow-pop-sm transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <img 
                src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/linkedin.svg" 
                alt="LinkedIn" 
                className="w-6 h-6"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/40x40/7f8991/ffffff?text=Ln';
                }}
              />
            </a>
            <a 
              href="https://github.com/yashant" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-surface border-2 border-foreground shadow-pop-sm transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <img 
                src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/github.svg" 
                alt="GitHub" 
                className="w-6 h-6"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/40x40/7f8991/ffffff?text=Gh';
                }}
              />
            </a>
            <a 
              href="https://dribbble.com/yashant" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-surface border-2 border-foreground shadow-pop-sm transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <img 
                src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/dribbble.svg" 
                alt="Dribbble" 
                className="w-6 h-6"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/40x40/7f8991/ffffff?text=Dr';
                }}
              />
            </a>
          </div>
          
          <div className="mt-10 text-center">
            <p className="max-w-2xl mx-auto mb-8 text-lg text-foreground">
              You made it all the way to the bottom. Thank you for stopping by <Hand className="inline w-5 h-5 -mt-1 text-foreground" strokeWidth={2.25} />
              <br /><br />
              One last try (I promise). Got a
              <span className="font-bold underline decoration-secondary decoration-4 underline-offset-4"> dragon-sized project</span>,
              or just want to talk galaxies, aliens and time-travel over coffee? Let's go.
            </p>
            
            <div className="flex justify-center">
              <a 
                href={contactHref('quest')}
                className="say-hello-btn btn-sun !px-8 group relative overflow-hidden"
                onMouseEnter={handleSayHelloHover}
              >
                <span className="relative z-10 inline-flex items-center">
                  Start a quest
                  <Sword data-villain="sword" className="ml-2 w-5 h-5 origin-bottom-left group-hover:animate-wiggle" strokeWidth={2.25} />
                </span>
                <span className="absolute inset-0 bg-white/30 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
