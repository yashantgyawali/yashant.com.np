
import React from 'react';

const DrunkDaveSection = () => {
  return (
    <div className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            🎮 Drunk Dave-ing: A Real Case Study™
          </h2>
          <p className="text-lg text-gray-300 mb-8 text-center text-pretty">
            A bold immersive experiment— I played Dangerous Dave while a few drinks deep. For... research of course. 🍻
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-3 text-primary">The Problem</h3>
              <p className="text-gray-300 mb-4">
                Trying to navigate a pixelated dungeon while my brain thinks I'm awesome but my fingers disagree. In other words: me, three beers in, absolutely convinced I'm the designer of the game.
              </p>
              
              <h3 className="text-2xl font-bold mb-3 mt-8 text-primary">The Process</h3>
              <ul className="space-y-3 text-gray-300">
                <li><span className="font-bold">Empathize</span> – Got drunk to understand drunk gamers. Started confident, ended yelling at pixels. Turns out drunk me is a terrible gamer but an excellent optimist."</li>
                <li><span className="font-bold">Define</span> – How might we create a gaming experience where skills actually improve with each drink instead of just feeling like they do? </li>
                <li><span className="font-bold">Ideate</span> – Generated innovative solutions like "maybe holding the jump button longer will make me jump higher" and "if I yell at the screen, Dave might listen." Breakthrough idea: blame the keyboard.</li>
                <li><span className="font-bold">Prototype</span> – Tested gaming postures like "The Lean" (tilting with jumps), "The Focus" (face against screen), and "The Panic" (random button mashing). Success rate: laughable.</li>
                <li><span className="font-bold">Test</span> – Metrics included number of "I am soooo good at this" repeats and dying instantly.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-3 text-primary">The Outcome</h3>
              <p className="text-gray-300 mb-4">
                Dangerous Dave and beer don't mix well. Stick to Prince of Persia 1.
                Also, turns out my keyboard is spill-resistant.
              </p>
              
              <div className="mt-6 p-4 bg-gray-800 rounded-md border border-gray-700">
                <p className="text-gray-300 italic">
                  "This unconventional approach challenged conventional wisdom about gaming skills, 
                  revealing the intricate relationship between cognitive function and motor skills under unexpected conditions."
                </p>
                <p className="text-right text-gray-400 text-sm mt-2">
                  — Me, using ChatGPT to sound fancy
                </p>
              </div>
            </div>
          </div>
          
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
            <div className="relative w-full pb-[56.25%]">
              <iframe 
                className="absolute inset-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/4XkwCDXrDCM?si=j9txORliXcrcAYBi" 
                title="YouTube video player" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrunkDaveSection;
