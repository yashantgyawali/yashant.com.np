
import React from 'react';

const CSSDrawingsSection = () => {
  return (
    <section className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">30-day CSS challenge</h2>
          <p className="text-xl mb-6">Drawing just by using code.</p>
          <p className="text-lg mb-8">
            Oh yes. My friends have called me a nerd for this. And I guess I might have nagged them a little 
            too much with excitement once I was able to draw Bulbasaur entirely on HTML/CSS. 
            I love CSS and idk where and when this skill will be useful. But I was super proud that 
            I had the discipline to sit down every single day for 30 days.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-10">
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
            <img 
              src="/lovable-uploads/css-grid.png" 
              alt="30-day CSS Challenge examples" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="mt-10 text-center">
          <a 
            href="https://bootcamp.uxdesign.cc/i-designed-and-completed-a-30-day-css-challenge-4e45c32f7f8c" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Read about my CSS challenge
          </a>
        </div>
      </div>
    </section>
  );
};

export default CSSDrawingsSection;
