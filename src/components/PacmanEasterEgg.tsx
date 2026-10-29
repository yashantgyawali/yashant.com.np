import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bomb, Hand, Heart, RotateCcw, Star, Sword, X } from 'lucide-react';
import { PACMAN_START_EVENT } from '@/lib/pacman/events';
import { startPacmanEngine, type GameResult, type HudState, type VillainKind } from '@/lib/pacman/engine';

// Up Up Down Down Left Right Left Right B A
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

type GameProps = {
  onExit: () => void;
  onRestart: () => void;
};

const PacmanGame = ({ onExit, onRestart }: GameProps) => {
  const [hud, setHud] = useState<HudState>({ eaten: 0, total: 0, lives: 3 });
  const [result, setResult] = useState<GameResult | null>(null);
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  const layerRef = useRef<HTMLDivElement>(null);
  const masksRef = useRef<HTMLDivElement>(null);
  const catcherRef = useRef<HTMLDivElement>(null);
  const joyRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const bombRef = useRef<HTMLDivElement>(null);
  const slapRef = useRef<HTMLDivElement>(null);
  const swordRef = useRef<HTMLDivElement>(null);
  const blastRef = useRef<HTMLDivElement>(null);
  const slapFxRef = useRef<HTMLDivElement>(null);

  // Latest callbacks without restarting the engine.
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    const villains: Record<VillainKind, HTMLDivElement> = {
      bomb: bombRef.current!,
      slap: slapRef.current!,
      sword: swordRef.current!,
    };
    return startPacmanEngine(
      {
        layer: layerRef.current!,
        masks: masksRef.current!,
        catcher: catcherRef.current!,
        joystick: joyRef.current!,
        joystickKnob: knobRef.current!,
        player: playerRef.current!,
        playerFace: faceRef.current!,
        playerMouth: mouthRef.current!,
        villains,
        blast: blastRef.current!,
        slapFx: slapFxRef.current!,
      },
      {
        onHud: setHud,
        onEnd: setResult,
        onQuit: () => exitRef.current(),
      },
    );
  }, []);

  const pct = hud.total ? Math.round((hud.eaten / hud.total) * 100) : 0;

  return createPortal(
    <div data-pacman-ui="">
      {/* Document-sized play field: masks, sprites and effects */}
      <div ref={layerRef} className="pacman-layer" aria-hidden="true">
        <div ref={masksRef} />

        <div ref={bombRef} className="pacman-villain pacman-villain--bomb">
          <div className="pacman-villain-body">
            <Bomb className="h-6 w-6" strokeWidth={2.25} />
          </div>
        </div>
        <div ref={slapRef} className="pacman-villain pacman-villain--slap">
          <div className="pacman-villain-body">
            <Hand className="h-6 w-6" strokeWidth={2.25} />
          </div>
        </div>
        <div ref={swordRef} className="pacman-villain pacman-villain--sword" data-form="hand">
          <div className="pacman-villain-body">
            <span className="pacman-form-hand">
              <Hand className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <span className="pacman-form-sword">
              <Sword className="h-7 w-7" strokeWidth={2.25} />
            </span>
          </div>
        </div>

        <div ref={playerRef} className="pacman-player">
          <svg viewBox="-22 -22 44 44">
            <g ref={faceRef}>
              <path
                ref={mouthRef}
                fill="hsl(var(--secondary))"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <circle cx="3" cy="-10" r="2.6" fill="hsl(var(--foreground))" />
            </g>
          </svg>
          <div className="pacman-dizzy">
            <Star className="pacman-dizzy-star" style={{ top: 0, left: '50%', marginLeft: -7 }} />
            <Star className="pacman-dizzy-star" style={{ bottom: 6, left: 2 }} />
            <Star className="pacman-dizzy-star" style={{ bottom: 6, right: 2 }} />
          </div>
        </div>

        <div ref={blastRef} className="pacman-blast">
          <div className="pacman-blast-ring" />
        </div>

        <div ref={slapFxRef} className="pacman-slapfx">
          <div className="pacman-slapfx-inner">
            {/* Motion lines trailing the slap, Lucide line style */}
            <svg width="44" height="60" viewBox="0 0 44 60" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round">
              <path d="M4 14h30" />
              <path d="M12 30h28" />
              <path d="M4 46h30" />
            </svg>
            <div className="pacman-slapfx-hand">
              <Hand className="h-16 w-16" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed input surface: blocks page clicks, hosts drag-to-steer */}
      <div ref={catcherRef} className="pacman-catcher" tabIndex={-1}>
        <div ref={joyRef} className="pacman-joy">
          <div ref={knobRef} className="pacman-joy-knob" />
        </div>
      </div>

      {/* HUD */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[72] flex justify-center px-4">
        <div className="pointer-events-auto flex touch-none items-center gap-3 rounded-full border-2 border-foreground bg-secondary py-1.5 pl-4 pr-1.5 font-mono text-sm text-foreground shadow-pop-sm sm:gap-5">
          <span className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-xs uppercase tracking-wider opacity-70">words</span>
            <span className="font-bold">{hud.eaten}</span>
            <span className="opacity-70">/ {hud.total}</span>
          </span>
          <span className="flex items-center gap-1" aria-label={`${hud.lives} lives left`}>
            {Array.from({ length: 3 }, (_, i) => (
              <Heart
                key={i}
                className={`h-5 w-5 ${i < hud.lives ? '' : 'opacity-30'}`}
                fill={i < hud.lives ? 'hsl(var(--primary))' : 'none'}
                strokeWidth={2.25}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-foreground bg-background px-3 py-1 text-xs font-bold transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <X className="h-3.5 w-3.5" strokeWidth={3} />
            Quit
            <span className="hidden opacity-60 sm:inline">esc</span>
          </button>
        </div>
      </div>

      {/* How to play, fades on its own */}
      {!result && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[72] flex justify-center px-4">
          <p className="pacman-hint rounded-full bg-background/90 px-4 py-1 text-center font-cursive text-lg text-foreground">
            {isTouch ? 'Drag anywhere to steer.' : 'Arrow keys or WASD to move.'} Eat every word. Dodge the buttons.
          </p>
        </div>
      )}

      {/* End screens */}
      {result && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/85 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pacman-end-title"
        >
          <div className="max-w-3xl text-center">
            <p className="font-mono text-sm uppercase tracking-[0.25em] text-primary">
              {result === 'won' ? 'You win' : 'Game over'}
            </p>
            <h2 id="pacman-end-title" className="mt-4 text-5xl leading-[1.05] md:text-7xl">
              {result === 'won' ? (
                <>
                  You ate my whole <span className="text-primary">portfolio</span>
                </>
              ) : (
                <>
                  Eaten by my own <span className="text-primary">buttons</span>
                </>
              )}
            </h2>
            <p className="mt-6 font-mono text-lg text-foreground">
              {hud.eaten} / {hud.total} words eaten <span className="opacity-60">({pct}%)</span>
            </p>
            <p className="mt-2 font-cursive text-xl text-muted-foreground">
              {result === 'won' ? 'Nothing left to read. Was it tasty?' : 'The bomb sends its regards.'}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button type="button" className="btn-primary" onClick={onRestart} autoFocus>
                <RotateCcw className="h-5 w-5" strokeWidth={2.25} />
                Play again
              </button>
              <button type="button" className="btn-ghost" onClick={onExit}>
                <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
                Back to the site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};

// Mounted once on the page. Starts the game on the `pacman:start` event or the Konami code.
const PacmanEasterEgg = () => {
  const [game, setGame] = useState<{ active: boolean; run: number }>({ active: false, run: 0 });
  const activeRef = useRef(false);
  activeRef.current = game.active;

  useEffect(() => {
    const start = () => {
      if (activeRef.current) return;
      setGame((g) => ({ active: true, run: g.run + 1 }));
    };

    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      if (activeRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key.toLowerCase();
      if (key === KONAMI[progress]) {
        progress++;
        if (progress === KONAMI.length) {
          progress = 0;
          start();
        }
      } else {
        // A stray extra "up" still counts as the start of the code.
        progress = key === KONAMI[0] ? (progress === 2 ? 2 : 1) : 0;
      }
    };

    window.addEventListener(PACMAN_START_EVENT, start);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(PACMAN_START_EVENT, start);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!game.active) return null;
  return (
    <PacmanGame
      key={game.run}
      onExit={() => setGame((g) => ({ ...g, active: false }))}
      onRestart={() => setGame((g) => ({ ...g, run: g.run + 1 }))}
    />
  );
};

export default PacmanEasterEgg;
