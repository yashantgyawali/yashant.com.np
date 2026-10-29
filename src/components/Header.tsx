
import React from 'react';
import { Hand } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from './Logo';

const Header = () => {
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b-2 border-foreground py-3">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <a href="/" className="group flex items-center gap-2 font-heading font-bold text-2xl tracking-tight hover:text-primary transition-colors">
          <Logo className="h-10 w-auto" />
          yashant
        </a>

        <a
          href="https://yashantgyawali.typeform.com/to/rbizSifr"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-sun group whitespace-nowrap !px-4 !py-2 !text-base"
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
                  className="btn-primary !px-4 !py-2 !text-sm whitespace-nowrap"
                >
                  Proceed anyway
                </a>
              ),
            });
          }}
        >
          Say heyyyyy <Hand data-villain="slap" className="w-5 h-5 origin-bottom group-hover:animate-wiggle" strokeWidth={2.25} />
        </a>
      </div>
    </header>
  );
};

export default Header;
