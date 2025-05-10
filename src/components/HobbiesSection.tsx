
import React from 'react';
import { Gift } from 'lucide-react';

const TumetSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center">Buy my game: Bluff Momo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex justify-start mb-6">
              <img 
                src="/lovable-uploads/6e39d0ce-790e-4ff1-bdbf-a550682f6c01.png" 
                alt="Tumlet Logo" 
                className="h-16"
              />
            </div>
            
            <p className="text-lg mb-4">
              On a mission to spread playfulness across Nepal
            </p>
            
            <div className="pt-4">
              <p className="text-lg mb-6">
                Bluff Momo is a card game based in the streets of Kathmandu, 
                where players bluff, deceive, and outsmart their friends to steal 
                the most momo and poison their way to victory!
              </p>
              
              <a 
                href="https://tumlet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-all"
              >
                <Gift className="w-5 h-5"/> Buy Now
              </a>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="game-preview w-full max-w-md rounded-lg overflow-hidden shadow-xl">
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
