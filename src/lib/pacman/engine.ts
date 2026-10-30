// Imperative Pac-Man engine. React renders the sprites once; everything that
// changes per frame lives in plain variables here and is written to the DOM
// with transforms, so the game never re-renders React on a frame.

import { circleHitsRect, collectIcons, collectWords, WordGrid, type Word } from './words';

export type VillainKind = 'bomb' | 'slap' | 'sword';
export type GameResult = 'over' | 'won';

export interface HudState {
  eaten: number;
  total: number;
  lives: number;
}

export interface PacmanElements {
  layer: HTMLDivElement; // absolutely positioned over the whole document
  masks: HTMLDivElement; // eaten-word masks go in here (eaten icons are hidden instead)
  catcher: HTMLDivElement; // fixed input surface that blocks page clicks
  joystick: HTMLDivElement;
  joystickKnob: HTMLDivElement;
  player: HTMLDivElement;
  playerFacing: HTMLDivElement; // rotates the cap so its mouth (the snapback opening) leads
  playerChomp: HTMLDivElement; // bite squash; holds the Logo whose .logo-mouth-* parts chomp
  villains: Record<VillainKind, HTMLDivElement>; // the slap sprite doubles as the template for extra high-fives
  blast: HTMLDivElement;
  slapFx: HTMLDivElement;
}

export interface PacmanCallbacks {
  onHud: (hud: HudState) => void;
  onEnd: (result: GameResult) => void;
  onQuit: () => void;
}

// Tuning
const PLAYER_R = 20;
const CAP_SIZE = 56; // square sprite box, matches .pacman-player--cap, so rotation never clips
const PLAYER_SPEED = 280; // px/s
// The snapback opening sits off the art's center: in the unrotated cap it is
// right of center and below it (viewBox bbox center about (725, 705) against
// (607.5, 600), at 56/785 px per unit). The probe follows it as the cap spins,
// nudged a little further forward than the opening's middle.
const MOUTH_X = 8.4;
const MOUTH_Y = 10;
const TURN_RATE = 14; // how fast the cap eases toward its heading
const CHOMPS_PER_S = 8;
const VILLAIN_R = 24;
const START_GRACE = 1.5; // s before villains start chasing
const LIVES = 3;
const INVULNERABLE = 2;
const CATCH_UP_DIST = 700; // far-away villains hurry up
const CATCH_UP_MULT = 1.8;

const BOMB = { speed: 75, fuseRange: 150, fuse: 1.2, blastR: 170, respawn: 3 };
const SLAP = { speed: 130, knock: 350, knockTime: 0.3, stun: 0.8, cooldown: 1.6, spawnDelay: 1, max: 6 };
const SWORD = { speed: 105, range: 240, telegraph: 0.35, lunge: 0.5, lungeSpeed: 760, rest: 1.5 };

// Power-up intro: the doodle and a big cap trade places, faster each swap,
// then the cap steps down to size. Frame lengths in seconds.
const MORPH_FLICKER = [0.14, 0.12, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05]; // even frames show the cap
const MORPH_STEP = 0.11; // each shrink step
const MORPH_HOLD = 0.12; // beat at normal size before play

const KEY_DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
};

type VillainState = 'spawn' | 'chase' | 'fuse' | 'gone' | 'recover' | 'telegraph' | 'lunge' | 'rest';

interface Villain {
  kind: VillainKind;
  el: HTMLDivElement;
  x: number;
  y: number;
  ox: number; // origin, where the real icon sits
  oy: number;
  state: VillainState;
  timer: number;
  aim: number; // radians, sword only
  lungeX: number;
  lungeY: number;
  hit: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const createSounds = () => {
  const files = {
    tick: '/sounds/bomb-tick.mp3',
    explosion: '/sounds/explosion.mp3',
    buzzer: '/sounds/buzzer.mp3',
  };
  const audio = {} as Record<keyof typeof files, HTMLAudioElement>;
  // The slap bounce is synthesized: a cartoon "boing" needs no audio file.
  let ctx: AudioContext | null = null;
  (Object.keys(files) as (keyof typeof files)[]).forEach((name) => {
    const a = new Audio(files[name]);
    a.preload = 'auto';
    a.volume = 0.2;
    audio[name] = a;
  });
  return {
    play(name: keyof typeof files) {
      const a = audio[name];
      try {
        a.currentTime = 0;
        a.play()?.catch(() => {});
      } catch {
        /* autoplay blocked, stay quiet */
      }
    },
    boing() {
      try {
        ctx ??= new AudioContext();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Fast wobble on the pitch gives the spring its "oing".
        const wobble = ctx.createOscillator();
        const wobbleDepth = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(520, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.5);
        wobble.frequency.value = 28;
        wobbleDepth.gain.setValueAtTime(60, t);
        wobbleDepth.gain.linearRampToValueAtTime(0, t + 0.5);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        wobble.connect(wobbleDepth).connect(osc.frequency);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        wobble.start(t);
        osc.stop(t + 0.6);
        wobble.stop(t + 0.6);
      } catch {
        /* no Web Audio, stay quiet */
      }
    },
    // Rising square arpeggio, the classic "you got bigger" jingle.
    powerUp() {
      try {
        ctx ??= new AudioContext();
        const t = ctx.currentTime;
        const notes = [392, 523, 659, 784, 1047, 1319, 1568]; // G4 C5 E5 G5 C6 E6 G6
        const step = 0.065;
        notes.forEach((freq, i) => {
          const osc = ctx!.createOscillator();
          const gain = ctx!.createGain();
          const at = t + i * step;
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, at);
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.exponentialRampToValueAtTime(0.15, at + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + step * 1.6);
          osc.connect(gain).connect(ctx!.destination);
          osc.start(at);
          osc.stop(at + step * 1.7);
        });
      } catch {
        /* no Web Audio, stay quiet */
      }
    },
    stop(name: keyof typeof files) {
      audio[name].pause();
    },
    dispose() {
      Object.values(audio).forEach((a) => {
        a.pause();
        a.removeAttribute('src');
        a.load();
      });
      ctx?.close().catch(() => {});
    },
  };
};

export const startPacmanEngine = (els: PacmanElements, cb: PacmanCallbacks) => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const restorers: Array<() => void> = [];
  const sounds = createSounds();

  // ---- Page prep (all undone in destroy) ----
  const startScroll = { x: window.scrollX, y: window.scrollY };
  const prevScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto'; // the site uses smooth scroll; the camera needs instant
  restorers.push(() => {
    html.style.scrollBehavior = prevScrollBehavior;
  });

  // Sticky headers would move with the camera; pin them to the document instead.
  // Sticky and relative share the same layout slot, so nothing shifts.
  document.querySelectorAll<HTMLElement>('header').forEach((el) => {
    if (getComputedStyle(el).position !== 'sticky') return;
    const prev = el.style.position;
    el.style.position = 'relative';
    restorers.push(() => {
      el.style.position = prev;
    });
  });

  // Make the page inert so Tab and Enter can't reach links or buttons under
  // the game. The game UI is portaled to <body>, outside #root.
  const prevFocus = document.activeElement as HTMLElement | null;
  const appRoot = document.getElementById('root');
  if (appRoot && !appRoot.inert) {
    appRoot.inert = true;
    restorers.push(() => {
      appRoot.inert = false;
    });
  }

  // Freeze running page animations so eaten words stay under their masks.
  const roots = Array.from(document.querySelectorAll('header, main, footer')).filter(
    (el, _, all) => !all.some((other) => other !== el && other.contains(el)),
  );
  document.getAnimations().forEach((anim) => {
    const target = (anim.effect as KeyframeEffect | null)?.target;
    if (anim.playState !== 'running' || !target) return;
    if (!roots.some((root) => root.contains(target))) return;
    anim.pause();
    restorers.push(() => anim.play());
  });

  const measureDoc = () => {
    els.layer.style.width = '0px';
    els.layer.style.height = '0px';
    const w = Math.max(html.scrollWidth, window.innerWidth);
    const h = Math.max(html.scrollHeight, window.innerHeight);
    els.layer.style.width = `${w}px`;
    els.layer.style.height = `${h}px`;
    return { w, h };
  };
  let { w: docW, h: docH } = measureDoc();

  // ---- Villains pop out of their buttons ----
  const sourceOf = (kind: VillainKind) =>
    document.querySelector<SVGElement | HTMLElement>(`[data-villain="${kind}"]`);

  // Where a villain's real icon sits in document coordinates. A hidden
  // (visibility: hidden) icon still has a valid rect, so this works mid-game.
  const measureOrigin = (kind: VillainKind) => {
    const fallback: Record<VillainKind, [number, number]> = {
      bomb: [docW * 0.25, Math.min(docH, window.innerHeight) * 0.6],
      slap: [docW - 80, 40],
      sword: [docW / 2, docH - 120],
    };
    const r = sourceOf(kind)?.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0) {
      return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY, size: r.width };
    }
    const [x, y] = fallback[kind];
    return { x, y, size: 20 };
  };

  const villains: Villain[] = (['bomb', 'slap', 'sword'] as VillainKind[]).map((kind) => {
    const { x, y, size } = measureOrigin(kind);
    const source = sourceOf(kind);
    if (source) {
      const prev = source.style.visibility;
      source.style.visibility = 'hidden';
      restorers.push(() => {
        source.style.visibility = prev;
      });
    }
    const v: Villain = { kind, el: els.villains[kind], x, y, ox: x, oy: y, state: 'spawn', timer: START_GRACE, aim: 0, lungeX: 0, lungeY: 0, hit: false };
    popIn(v, size);
    return v;
  });

  function popIn(v: Villain, fromSize = 20) {
    v.el.classList.remove('is-gone', 'is-lit', 'is-telegraph');
    const body = v.el.firstElementChild as HTMLElement | null;
    if (!body) return;
    const from = fromSize / (VILLAIN_R * 2);
    body.animate(
      reducedMotion
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ transform: `scale(${from})` }, { transform: 'scale(1.18)', offset: 0.7 }, { transform: 'scale(1)' }],
      { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.3)' },
    );
  }

  // ---- High-fives multiply: every slap sends another hand out of the header ----
  const extras = new Set<HTMLElement>(); // cloned sprites and toasts, removed in teardown
  let pendingHighFive = false;

  const showToast = (x: number, y: number, text: string) => {
    const t = document.createElement('div');
    t.className = 'pacman-toast';
    t.textContent = text;
    t.style.left = `${x}px`;
    t.style.top = `${y}px`;
    els.layer.appendChild(t);
    extras.add(t);
    const anim = t.animate(
      reducedMotion
        ? [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }]
        : [
            { transform: 'translate(-50%, 6px) scale(0.6)', opacity: 0 },
            { transform: 'translate(-50%, 0) scale(1.1)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -14px) scale(1)', opacity: 1, offset: 0.75 },
            { transform: 'translate(-50%, -22px) scale(1)', opacity: 0 },
          ],
      { duration: 1100, easing: 'ease-out', fill: 'forwards' },
    );
    anim.onfinish = () => {
      t.remove();
      extras.delete(t);
    };
  };

  const spawnHighFive = () => {
    if (villains.filter((v) => v.kind === 'slap').length >= SLAP.max) return;
    const { x, y, size } = measureOrigin('slap');
    const el = els.villains.slap.cloneNode(true) as HTMLDivElement;
    el.style.transform = `translate3d(${x - VILLAIN_R}px, ${y - VILLAIN_R}px, 0)`;
    els.villains.slap.after(el);
    extras.add(el);
    const v: Villain = { kind: 'slap', el, x, y, ox: x, oy: y, state: 'spawn', timer: SLAP.spawnDelay, aim: 0, lungeX: 0, lungeY: 0, hit: false };
    villains.push(v);
    popIn(v, size);
    // The header is usually off-screen by now, so announce it next to the player.
    showToast(px, Math.max(12, py - CAP_SIZE / 2 - 28), '+1 high-five');
  };

  // Hands chase the same target at the same speed, so nudge them apart
  // instead of letting them merge into one sprite.
  const separateHands = () => {
    const hands = villains.filter((v) => v.kind === 'slap');
    for (let i = 0; i < hands.length; i++) {
      for (let j = i + 1; j < hands.length; j++) {
        const a = hands[i];
        const b = hands[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= VILLAIN_R * 2) continue;
        if (d < 0.001) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        // A hand still popping out of the header stays pinned to its origin.
        const aFixed = a.state === 'spawn';
        const bFixed = b.state === 'spawn';
        if (aFixed && bFixed) continue;
        const overlap = VILLAIN_R * 2 - d;
        const pushA = bFixed ? overlap : aFixed ? 0 : overlap / 2;
        const pushB = overlap - pushA;
        a.x = clamp(a.x - (dx / d) * pushA, VILLAIN_R, docW - VILLAIN_R);
        a.y = clamp(a.y - (dy / d) * pushA, VILLAIN_R, docH - VILLAIN_R);
        b.x = clamp(b.x + (dx / d) * pushB, VILLAIN_R, docW - VILLAIN_R);
        b.y = clamp(b.y + (dy / d) * pushB, VILLAIN_R, docH - VILLAIN_R);
      }
    }
  };

  // ---- Words and icons ----
  const eatenKeys = new Set<string>();
  const hiddenIcons = new Set<Element>(); // eaten icons; their old visibility is restored in teardown
  let words: Word[] = [];
  let grid = new WordGrid();
  let eaten = 0;

  const addMasks = (word: Word) => {
    for (const r of word.rects) {
      const m = document.createElement('div');
      m.className = 'pacman-mask';
      m.style.cssText = `left:${r.x - 1}px;top:${r.y - 1}px;width:${r.w + 2}px;height:${r.h + 2}px;background:${word.color}`;
      els.masks.appendChild(m);
    }
  };

  // Words get masks; icons are hidden outright. Safe to call again after a re-measure.
  const consume = (word: Word) => {
    const el = word.el;
    if (!el) {
      addMasks(word);
      return;
    }
    if (hiddenIcons.has(el)) return;
    hiddenIcons.add(el);
    const prev = el.style.visibility;
    el.style.visibility = 'hidden';
    restorers.push(() => {
      el.style.visibility = prev;
    });
  };

  const loadWords = () => {
    els.masks.replaceChildren();
    words = [...collectWords(roots, docW, docH), ...collectIcons(roots, docW, docH, (el) => hiddenIcons.has(el))];
    grid = new WordGrid();
    eaten = 0;
    words.forEach((word, i) => {
      if (eatenKeys.has(word.key)) {
        word.eaten = true;
        eaten++;
        consume(word);
      } else {
        grid.add(i, word);
      }
    });
  };
  loadWords();

  // ---- Player ----
  // The hero doodle turns into the cap, so Pac-Man starts on the doodle's head.
  const startEl = document.querySelector<HTMLElement>('[data-pacman-start]');
  const startHint = document.querySelector<HTMLElement>('[data-pacman-hint]');
  const startRect = startEl?.getBoundingClientRect();
  const hasDoodle = !!startRect && startRect.width > 0 && startRect.height > 0;
  let px = window.scrollX + window.innerWidth / 2;
  let py = window.scrollY + window.innerHeight / 2;
  let bigScale = 2.5;
  // Also rerun on resize mid-intro, so the cap keeps swapping with the doodle in place.
  const placeOnDoodle = () => {
    if (!startEl) return;
    const art = (startEl.querySelector('svg') ?? startEl).getBoundingClientRect();
    if (!art.width || !art.height) return;
    // Head center in the doodle's viewBox (0 -150 1080 613) is about (680, 160).
    px = art.left + art.width * (680 / 1080) + window.scrollX;
    py = art.top + art.height * ((160 + 150) / 613) + window.scrollY;
    bigScale = clamp((art.width * 0.3) / CAP_SIZE, 2, 3);
  };
  if (hasDoodle) placeOnDoodle();
  let dirX = 1;
  let dirY = 0;
  let moving = false;
  // Cap rotation in degrees. The mouth points down in the artwork, so heading
  // angle - 90 puts it in front. Starts upright, like the logo.
  let angle = 0;
  let lives = LIVES;
  let invulnerable = 0;
  let stunned = 0;
  let knockTime = 0;
  let knockVX = 0;
  let knockVY = 0;
  let phase: 'playing' | GameResult = 'playing';
  let clock = 0;

  // ---- Power-up intro: doodle -> live cap ----
  // Hidden until play ends; the hint goes with it.
  const hideForGame = (el: HTMLElement | null) => {
    if (!el) return;
    const prev = el.style.visibility;
    el.style.visibility = 'hidden';
    restorers.push(() => {
      el.style.visibility = prev;
    });
  };
  // `big` is how far along from normal size (0) to the big cap (1).
  const morphFrames: Array<{ until: number; cap: boolean; big: number }> = [];
  {
    let t = 0;
    MORPH_FLICKER.forEach((d, i) => morphFrames.push({ until: (t += d), cap: i % 2 === 0, big: 1 }));
    [2 / 3, 1 / 3].forEach((k) => morphFrames.push({ until: (t += MORPH_STEP), cap: true, big: k }));
    morphFrames.push({ until: (t += MORPH_HOLD), cap: true, big: 0 });
  }
  let intro = hasDoodle && !reducedMotion;
  let introT = 0;
  let introFrame = -1;
  let playerScale = 1;
  let doodleShown = true;
  const doodlePrev = startEl?.style.visibility ?? '';
  if (hasDoodle) {
    sounds.powerUp();
    if (startEl) {
      restorers.push(() => {
        startEl.style.visibility = doodlePrev;
      });
    }
    if (!intro) {
      // Reduced motion: straight swap, no flicker.
      if (startEl) startEl.style.visibility = 'hidden';
      hideForGame(startHint);
    } else {
      hideForGame(startHint);
      els.player.style.visibility = 'hidden'; // until the first intro frame swaps it in
      restorers.push(() => {
        els.player.style.visibility = '';
      });
    }
  }

  const stepIntro = (dt: number) => {
    introT += dt;
    let i = morphFrames.findIndex((f) => introT < f.until);
    if (i === -1) {
      intro = false;
      i = morphFrames.length - 1;
    }
    if (i === introFrame && intro) return;
    introFrame = i;
    const f = morphFrames[i];
    const showCap = f.cap || !intro;
    playerScale = intro ? 1 + (bigScale - 1) * f.big : 1;
    els.player.style.visibility = showCap ? '' : 'hidden';
    if (startEl && doodleShown === showCap) {
      doodleShown = !showCap;
      startEl.style.visibility = doodleShown ? doodlePrev : 'hidden';
    }
  };

  // Viewport and camera are cached so render() never reads layout back.
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let camX = window.scrollX;
  let camY = window.scrollY;
  let lastAim = '';

  // ---- HUD (only pushed to React when something changed) ----
  let lastHud = '';
  const emitHud = () => {
    const hud = { eaten, total: words.length, lives };
    const sig = `${hud.eaten}/${hud.total}/${hud.lives}`;
    if (sig === lastHud) return;
    lastHud = sig;
    cb.onHud(hud);
  };
  emitHud();

  const end = (result: GameResult) => {
    if (phase !== 'playing') return;
    phase = result;
    keys.clear();
    drag = null;
    els.joystick.classList.remove('is-active');
    sounds.stop('tick');
    if (result === 'over') sounds.play('buzzer');
    emitHud();
    cb.onEnd(result);
  };

  const hurt = () => {
    if (invulnerable > 0 || phase !== 'playing') return;
    lives--;
    emitHud();
    if (lives <= 0) end('over');
    else invulnerable = INVULNERABLE;
  };

  const eat = (word: Word) => {
    word.eaten = true;
    eatenKeys.add(word.key);
    eaten++;
    consume(word);
    emitHud();
    if (eaten >= words.length) end('won');
  };

  // ---- Effects ----
  const showBlast = (x: number, y: number) => {
    els.blast.style.transform = `translate3d(${x - BOMB.blastR}px, ${y - BOMB.blastR}px, 0)`;
    (els.blast.firstElementChild as HTMLElement).animate(
      reducedMotion
        ? [{ opacity: 0.85 }, { opacity: 0 }]
        : [
            { transform: 'scale(0.15)', opacity: 1 },
            { transform: 'scale(1)', opacity: 0.9, offset: 0.55 },
            { transform: 'scale(1.06)', opacity: 0 },
          ],
      { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
  };

  const showSlap = (x: number, y: number, pushLeft: boolean) => {
    // Effect artwork faces right; mirror it when the push goes left.
    els.slapFx.style.transform = `translate3d(${x - 70}px, ${y - 55}px, 0) scaleX(${pushLeft ? -1 : 1})`;
    (els.slapFx.firstElementChild as HTMLElement).animate(
      reducedMotion
        ? [{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }]
        : [
            { transform: 'translateX(-30px) scale(0.6)', opacity: 1 },
            { transform: 'translateX(0) scale(1.15)', opacity: 1, offset: 0.25 },
            { transform: 'translateX(6px) scale(1)', opacity: 1, offset: 0.7 },
            { transform: 'translateX(10px) scale(1)', opacity: 0 },
          ],
      { duration: 650, easing: 'ease-out' },
    );
  };

  // ---- Villain AI ----
  // Moves a villain toward Pac-Man and returns the distance before moving.
  const chase = (v: Villain, speed: number, dt: number) => {
    const dx = px - v.x;
    const dy = py - v.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = Math.min(d, speed * (d > CATCH_UP_DIST ? CATCH_UP_MULT : 1) * dt);
    v.x += (dx / d) * step;
    v.y += (dy / d) * step;
    return d;
  };

  const touching = (v: Villain, slack = 4) => Math.hypot(px - v.x, py - v.y) < PLAYER_R + VILLAIN_R - slack;

  const updateBomb = (v: Villain, dt: number) => {
    switch (v.state) {
      case 'spawn':
        if ((v.timer -= dt) <= 0) v.state = 'chase';
        break;
      case 'chase':
        if (chase(v, BOMB.speed, dt) < BOMB.fuseRange) {
          v.state = 'fuse';
          v.timer = BOMB.fuse;
          v.el.classList.add('is-lit');
          sounds.play('tick');
        }
        break;
      case 'fuse':
        chase(v, 20, dt); // creeps while the fuse burns
        if ((v.timer -= dt) <= 0) {
          sounds.stop('tick');
          sounds.play('explosion');
          showBlast(v.x, v.y);
          if (Math.hypot(px - v.x, py - v.y) < BOMB.blastR) hurt();
          v.state = 'gone';
          v.timer = BOMB.respawn;
          v.el.classList.remove('is-lit');
          v.el.classList.add('is-gone');
        }
        break;
      case 'gone':
        if ((v.timer -= dt) <= 0) {
          v.x = v.ox;
          v.y = v.oy;
          v.state = 'spawn';
          v.timer = 0.6;
          popIn(v);
        }
        break;
    }
  };

  const updateSlap = (v: Villain, dt: number) => {
    switch (v.state) {
      case 'spawn':
        if ((v.timer -= dt) <= 0) v.state = 'chase';
        break;
      case 'chase':
        chase(v, SLAP.speed, dt);
        // The stun check also limits it to one slap per frame across all hands.
        if (touching(v) && invulnerable <= 0 && stunned <= 0) {
          let dx = px - v.x;
          let dy = py - v.y;
          const d = Math.hypot(dx, dy);
          if (d < 0.001) {
            dx = 1;
            dy = 0;
          } else {
            dx /= d;
            dy /= d;
          }
          sounds.boing();
          showSlap((px + v.x) / 2, (py + v.y) / 2, dx < 0);
          knockVX = (dx * SLAP.knock) / SLAP.knockTime;
          knockVY = (dy * SLAP.knock) / SLAP.knockTime;
          knockTime = SLAP.knockTime;
          stunned = SLAP.stun;
          pendingHighFive = true;
          v.state = 'recover';
          v.timer = SLAP.cooldown;
        }
        break;
      case 'recover':
        if ((v.timer -= dt) <= 0) v.state = 'chase';
        break;
    }
  };

  const updateSword = (v: Villain, dt: number) => {
    switch (v.state) {
      case 'spawn':
        if ((v.timer -= dt) <= 0) v.state = 'chase';
        break;
      case 'chase':
        if (chase(v, SWORD.speed, dt) < SWORD.range) {
          v.state = 'telegraph';
          v.timer = SWORD.telegraph;
          v.el.classList.add('is-telegraph');
        }
        break;
      case 'telegraph':
        // Track the target while winding up, then commit to that direction.
        v.aim = Math.atan2(py - v.y, px - v.x);
        if ((v.timer -= dt) <= 0) {
          v.lungeX = Math.cos(v.aim);
          v.lungeY = Math.sin(v.aim);
          v.state = 'lunge';
          v.timer = SWORD.lunge;
          v.hit = false;
          v.el.classList.remove('is-telegraph');
        }
        break;
      case 'lunge': {
        // Sub-step so a fast lunge on a slow frame can't jump over Pac-Man.
        const travel = SWORD.lungeSpeed * dt;
        const steps = Math.max(1, Math.ceil(travel / 10));
        for (let i = 0; i < steps; i++) {
          v.x = clamp(v.x + (v.lungeX * travel) / steps, VILLAIN_R, docW - VILLAIN_R);
          v.y = clamp(v.y + (v.lungeY * travel) / steps, VILLAIN_R, docH - VILLAIN_R);
          if (!v.hit && touching(v, 6)) {
            v.hit = true;
            hurt();
          }
        }
        if ((v.timer -= dt) <= 0) {
          v.state = 'rest';
          v.timer = SWORD.rest;
        }
        break;
      }
      case 'rest':
        if ((v.timer -= dt) <= 0) {
          v.state = 'chase';
        }
        break;
    }
  };

  // ---- Input ----
  const keys = new Set<string>();
  const normKey = (key: string) => (key.length === 1 ? key.toLowerCase() : key);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cb.onQuit();
      return;
    }
    if (phase !== 'playing') return;
    const k = normKey(e.key);
    if (k in KEY_DIRS || e.key === ' ' || e.key === 'PageDown' || e.key === 'PageUp') {
      e.preventDefault(); // keep the page from scrolling under the camera
    }
    // During the power-up the cap can't be steered, and nothing carries over.
    if (k in KEY_DIRS && !intro) keys.add(k);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(normKey(e.key));
  };
  const onBlur = () => keys.clear();

  // Drag anywhere to steer: the vector from where the finger landed is the direction.
  let drag: { id: number; x: number; y: number } | null = null;
  const JOY_MAX = 36;
  const onPointerDown = (e: PointerEvent) => {
    if (phase !== 'playing' || intro) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try {
      els.catcher.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable, fine */
    }
    els.joystick.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    els.joystickKnob.style.transform = 'translate3d(0, 0, 0)';
    els.joystick.classList.add('is-active');
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const d = Math.hypot(dx, dy);
    if (d > 10) {
      dirX = dx / d;
      dirY = dy / d;
      moving = true;
    }
    const k = Math.min(1, JOY_MAX / (d || 1));
    els.joystickKnob.style.transform = `translate3d(${dx * k}px, ${dy * k}px, 0)`;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    els.joystick.classList.remove('is-active');
  };
  const blockScroll = (e: Event) => e.preventDefault();

  let resizeTimer: number | undefined;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    vw = window.innerWidth;
    vh = window.innerHeight;
    resizeTimer = window.setTimeout(() => {
      ({ w: docW, h: docH } = measureDoc());
      loadWords();
      if (intro) {
        placeOnDoodle();
        introFrame = -1; // re-apply the current frame at the new size
      }
      px = clamp(px, PLAYER_R, docW - PLAYER_R);
      py = clamp(py, PLAYER_R, docH - PLAYER_R);
      // The buttons reflow too: move each villain's home and keep it on the page.
      for (const v of villains) {
        const o = measureOrigin(v.kind);
        v.ox = o.x;
        v.oy = o.y;
        v.x = clamp(v.x, VILLAIN_R, docW - VILLAIN_R);
        v.y = clamp(v.y, VILLAIN_R, docH - VILLAIN_R);
      }
      camX = window.scrollX;
      camY = window.scrollY;
      emitHud();
      if (phase === 'playing' && eaten >= words.length) end('won');
    }, 150);
  };

  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('blur', onBlur);
  window.addEventListener('resize', onResize);
  window.addEventListener('wheel', blockScroll, { passive: false });
  els.catcher.addEventListener('pointerdown', onPointerDown);
  els.catcher.addEventListener('pointermove', onPointerMove);
  els.catcher.addEventListener('pointerup', onPointerUp);
  els.catcher.addEventListener('pointercancel', onPointerUp);
  els.catcher.addEventListener('touchmove', blockScroll, { passive: false });

  // Take focus off whatever page control was active so keys can't trigger it.
  (document.activeElement as HTMLElement | null)?.blur?.();
  els.catcher.focus({ preventScroll: true });

  // Nothing to eat (all text hidden or unmeasurable): count it as a win
  // rather than leaving a game that can never end.
  if (words.length === 0) end('won');

  // ---- Loop ----
  const update = (dt: number) => {
    // Keyboard wins over the last drag direction while keys are held.
    if (keys.size) {
      let kx = 0;
      let ky = 0;
      keys.forEach((k) => {
        kx += KEY_DIRS[k][0];
        ky += KEY_DIRS[k][1];
      });
      const d = Math.hypot(kx, ky);
      if (d > 0) {
        dirX = kx / d;
        dirY = ky / d;
        moving = true;
      }
    }

    invulnerable = Math.max(0, invulnerable - dt);
    stunned = Math.max(0, stunned - dt);

    if (knockTime > 0) {
      knockTime -= dt;
      px += knockVX * dt;
      py += knockVY * dt;
    } else if (stunned <= 0 && moving) {
      px += dirX * PLAYER_SPEED * dt;
      py += dirY * PLAYER_SPEED * dt;
    }
    px = clamp(px, PLAYER_R, docW - PLAYER_R);
    py = clamp(py, PLAYER_R, docH - PLAYER_R);
    // Turn the mouth toward the heading along the shorter way round.
    // Stopped or stunned, it keeps whatever way it last faced.
    if (moving && stunned <= 0) {
      const target = (Math.atan2(dirY, dirX) * 180) / Math.PI - 90;
      const diff = ((((target - angle) % 360) + 540) % 360) - 180;
      angle += reducedMotion ? diff : diff * Math.min(1, dt * TURN_RATE);
    }

    // Eat whatever the mouth covers: the probe leans toward where it points.
    // Rotate the opening's offset in the art by the cap's rotation.
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const ex = px + MOUTH_X * cos - MOUTH_Y * sin;
    const ey = py + MOUTH_X * sin + MOUTH_Y * cos;
    const r = PLAYER_R * 0.8;
    grid.query(ex - r, ey - r, ex + r, ey + r, (i) => {
      const word = words[i];
      if (word.eaten || phase !== 'playing') return;
      if (word.rects.some((rect) => circleHitsRect(ex, ey, r, rect))) eat(word);
    });
    if (phase !== 'playing') return;

    for (const v of villains) {
      if (v.kind === 'bomb') updateBomb(v, dt);
      else if (v.kind === 'slap') updateSlap(v, dt);
      else updateSword(v, dt);
      if (phase !== 'playing') return;
    }
    if (pendingHighFive) {
      pendingHighFive = false;
      spawnHighFive();
    }
    separateHands();
  };

  const render = () => {
    // Player sprite
    els.player.style.transform =
      `translate3d(${px - CAP_SIZE / 2}px, ${py - CAP_SIZE / 2}px, 0)` + (playerScale !== 1 ? ` scale(${playerScale.toFixed(3)})` : '');
    els.playerFacing.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    // Chomp: the snapback opening snaps shut toward the strap, showing the
    // navy outline behind it, CHOMPS_PER_S times a second, with a small bite squash.
    const chomp =
      !intro && moving && stunned <= 0 && !reducedMotion ? Math.abs(Math.sin(clock * Math.PI * CHOMPS_PER_S)) : 0;
    els.playerChomp.style.transform = chomp ? `scale(${(1 + 0.06 * chomp).toFixed(3)}, ${(1 - 0.06 * chomp).toFixed(3)})` : '';
    if (mouthGap) mouthGap.style.transform = chomp ? `scaleY(${(1 - 0.85 * chomp).toFixed(3)})` : '';
    els.player.classList.toggle('is-hurt', invulnerable > 0);
    els.player.classList.toggle('is-dizzy', stunned > 0);

    for (const v of villains) {
      v.el.style.transform = `translate3d(${v.x - VILLAIN_R}px, ${v.y - VILLAIN_R}px, 0)`;
      // The lucide sword's blade points to the top left (-135deg).
      if (v.kind === 'sword') {
        const aim = `${((v.aim * 180) / Math.PI + 135).toFixed(1)}deg`;
        if (aim !== lastAim) {
          lastAim = aim;
          v.el.style.setProperty('--aim', aim);
        }
      }
    }

    // Camera: keep Pac-Man near the middle of the viewport.
    const tx = clamp(px - vw / 2, 0, Math.max(0, docW - vw));
    const ty = clamp(py - vh / 2, 0, Math.max(0, docH - vh));
    if (Math.abs(camX - tx) > 0.5 || Math.abs(camY - ty) > 0.5) {
      camX = tx;
      camY = ty;
      window.scrollTo(tx, ty);
    }
  };

  const mouthGap = els.playerChomp.querySelector<SVGElement>('.logo-mouth-gap');

  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    // Pause the simulation while the window has lost focus: Pac-Man never
    // stops on his own, so he'd keep running into villains with no input.
    // The intro is a cutscene: it runs regardless, and nothing else moves.
    if (phase === 'playing') {
      if (intro) stepIntro(dt);
      else if (document.hasFocus()) update(dt);
    }
    render();
    if (phase === 'playing') raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  // ---- Teardown: the page must look exactly as before ----
  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(resizeTimer);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('wheel', blockScroll);
    els.catcher.removeEventListener('pointerdown', onPointerDown);
    els.catcher.removeEventListener('pointermove', onPointerMove);
    els.catcher.removeEventListener('pointerup', onPointerUp);
    els.catcher.removeEventListener('pointercancel', onPointerUp);
    els.catcher.removeEventListener('touchmove', blockScroll);
    sounds.dispose();
    els.masks.replaceChildren();
    extras.forEach((el) => el.remove());
    extras.clear();
    window.scrollTo(startScroll.x, startScroll.y); // while scroll-behavior is still instant
    restorers.reverse().forEach((restore) => restore());
    // Hand focus back to whatever had it (usually the hero doodle). This runs
    // after #root stops being inert, otherwise the focus call is ignored.
    if (prevFocus?.isConnected && prevFocus !== document.body) prevFocus.focus?.({ preventScroll: true });
  };
};
