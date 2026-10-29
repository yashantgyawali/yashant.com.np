
import React from 'react';
import { Gift } from 'lucide-react';

const TumetSection = () => {
  return (
    <section className="section">
      <div className="container mx-auto px-4">
        <div className="section-header">
          <h2 className="section-title">Buy my game: Bluff Momo</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto text-left">
          <div className="space-y-6">
            <div className="flex justify-start mb-6">
              <img 
                src="/tumlet-logo-dark.svg"
                alt="Tumlet"
                className="h-12 w-auto"
              />
            </div>
            
            <p className="font-heading text-2xl font-semibold">
              On a mission to spread playfulness across Nepal
            </p>
            
            <div className="pt-4">
              <p className="text-lg text-muted-foreground mb-6">
                Bluff Momo is a card game based in the streets of Kathmandu, 
                where players bluff, deceive, and outsmart their friends to steal 
                the most momo and poison their way to victory!
              </p>
              
              <a 
                href="https://tumlet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Gift className="w-5 h-5"/> Buy Now
              </a>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-md card-pop shadow-pop-lg overflow-hidden">
              <img 
                src="/lovable-uploads/dedc2912-e997-4622-bc3a-43427eb78157.png" 
                alt="Bluff Momo Game" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TumetSection;
