
import React from 'react';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-50 bg-secondary py-4 shadow-md">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/45c113a7-7ce2-4cc6-bb55-9832693f68db.png" 
            alt="Yashant Logo" 
            className="h-10 w-auto"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/40x40/1B2331/DADADA?text=Y';
            }}
          />
        </div>
        
        <a 
          href="https://yashantgyawali.typeform.com/to/rbizSifr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-link text-lg group relative"
          onClick={(e) => {
            e.preventDefault();
            toast({
              title: "Before you go...",
              description: "Why not explore the portfolio first? There's a fun game waiting for you!",
              action: (
                <a 
                  href="https://yashantgyawali.typeform.com/to/rbizSifr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-primary text-white rounded-md"
                >
                  Proceed anyway
                </a>
              ),
            });
          }}
        >
          Pop me a message <span className="inline-block ml-1 animate-float-balloon">🎈</span>
        </a>
      </div>
    </header>
  );
};

export default Header;
