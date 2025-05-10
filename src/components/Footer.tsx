
import React, { useEffect } from 'react';
import { useSounds } from '@/utils/useSounds';

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
    <footer className="py-16 bg-gray-700 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <p className="text-xl font-medium mb-6">Find me @</p>
          
          <div className="flex space-x-6">
            <a 
              href="https://www.linkedin.com/in/yashantgyawali/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <img 
                src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/linkedin.svg" 
                alt="LinkedIn" 
                className="w-10 h-10 invert"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/40x40/7f8991/ffffff?text=Ln';
                }}
              />
            </a>
            <a 
              href="https://github.com/yashant" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <img 
                src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/github.svg" 
                alt="GitHub" 
                className="w-10 h-10 invert"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/40x40/7f8991/ffffff?text=Gh';
                }}
              />
            </a>
            <a 
              href="https://dribbble.com/yashant" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <img 
                src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/dribbble.svg" 
                alt="Dribbble" 
                className="w-10 h-10 invert"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/40x40/7f8991/ffffff?text=Dr';
                }}
              />
            </a>
          </div>
          
          <div className="mt-10 text-center">
            <p className="max-w-2xl mx-auto mb-8 text-gray-300">
              You made it all the way to the bottom. Thank you for stopping by 👋
              <br /><br />
              One last try (I promise).
              <br /><br />
              I use design thinking approach to create user-centric projects for you.
              I am always up for a coffee or a chat about galaxies, aliens, time-travel and potential
              <span className="text-primary"> projects</span>.
            </p>
            
            <div className="flex justify-center">
              <a 
                href="https://yashantgyawali.typeform.com/to/rbizSifr" 
                target="_blank"
                rel="noopener noreferrer"
                className="say-hello-btn px-8 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-all hover:scale-110 hover:rotate-3 active:scale-95 active:rotate-0 group relative overflow-hidden"
                onMouseEnter={handleSayHelloHover}
              >
                <span className="relative z-10 inline-flex items-center">
                  Say Hello
                  <span className="ml-2 inline-block animate-bounce">👋</span>
                </span>
                <span className="absolute inset-0 bg-white/20 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                <span className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-white/30 to-primary/0 opacity-0 group-hover:opacity-100 group-hover:animate-shine"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
