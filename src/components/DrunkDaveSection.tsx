
import React from 'react';
import { contactHref } from '@/lib/contact';

// Grimacing face with a sweat drop, drawn to match the Lucide icon style
const NervousFace = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label="nervous face"
  >
    <path d="M20.5 9.5A10 10 0 1 1 14.5 2.3" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <rect x="6.5" y="13" width="11" height="5" rx="1.5" />
    <path d="M6.5 15.5h11" />
    <path d="M10 13v5" />
    <path d="M14 13v5" />
    <path d="M19.5 2.5s-2 2.4-2 3.6a2 2 0 0 0 4 0c0-1.2-2-3.6-2-3.6z" />
  </svg>
);

const neatSteps = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];

const DrunkDaveSection = () => {
  return (
    <section className="section">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* The tidy portfolio process, crossed out */}
          <div className="text-center mb-14">
            <p className="font-mono text-xs md:text-sm uppercase tracking-wider text-muted-foreground mb-6">
              My design philosophy
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-4 md:gap-x-5">
              {neatSteps.map((step, i) => (
                <React.Fragment key={step}>
                  <span
                    className="inline-block font-heading font-extrabold text-4xl md:text-6xl text-foreground/40 line-through decoration-primary decoration-[5px] md:decoration-[8px]"
                  >
                    {step}
                  </span>
                  {i < neatSteps.length - 1 && <span className="font-heading text-2xl md:text-4xl text-foreground/30">→</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="mt-8 font-cursive text-xl md:text-2xl text-foreground">
              Mine goes: I'll probably fail at first. Then I'll drag you down to a pub and we'll get into some deep philosophical topics. In the end, I'll make something fun that I'd personally geek out over, hopefully <NervousFace className="inline w-6 h-6 -mt-1" />
            </p>
          </div>

          <div className="card-pop bg-primary p-6 md:p-10 mb-12 text-center">
            <p className="font-heading text-2xl md:text-4xl font-bold leading-tight mb-4">
              I'm messy. I'm not perfect. I am who I am.
            </p>
            <p className="text-foreground text-lg max-w-2xl mx-auto">
              My work doesn't move in five neat steps either. I skip ahead, loop back, and sometimes
              start with the answer and work out the question later. I'd rather show you that than
              pretend otherwise.
            </p>
          </div>

          <h3 className="text-2xl md:text-3xl text-center mb-6">
            See me breeze through Dangerous Dave while drunk
          </h3>

          <div className="card-pop shadow-pop-lg overflow-hidden">
            <div className="relative w-full pb-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/4XkwCDXrDCM?si=j9txORliXcrcAYBi"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <p className="mt-6 text-center font-cursive text-xl md:text-2xl text-foreground">
            Don't understand Nepali? Another reason to{' '}
            <a
              href={contactHref('translate')}
              className="text-primary underline decoration-2 underline-offset-4 hover:decoration-secondary"
            >
              hit me up
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DrunkDaveSection;
