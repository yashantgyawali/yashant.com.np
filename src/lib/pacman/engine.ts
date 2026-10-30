// Imperative Pac-Man engine. React renders the sprites once; everything that
// changes per frame lives in plain variables here and is written to the DOM
// with transforms, so the game never re-renders React on a frame.

import { circleHitsRect, collectWords, WordGrid, type Word } from './words';

export type VillainKind = 'bomb' | 'slap' | 'sword';
export type GameResult = 'over' | 'won';

export interface HudState {
  eaten: number;
  total: number;
  lives: number;
}

export interface PacmanElements {
  layer: HTMLDivElement; // absolutely positioned over the whole document
  masks: HTMLDivElement; // eaten-word masks go in here
  catcher: HTMLDivElement; // fixed input surface that blocks page clicks
  joystick: HTMLDivElement;
  joystickKnob: HTMLDivElement;
  player: HTMLDivElement;
  playerFace: SVGGElement;
  playerMouth: SVGPathElement;
  villains: Record<VillainKind, HTMLDivElement>;
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
const PLAYER_SPEED = 280; // px/s
const VILLAIN_R = 24;
const START_GRACE = 1.5; // s before villains start chasing
const LIVES = 3;
const INVULNERABLE = 2;
const CATCH_UP_DIST = 700; // far-away villains hurry up
const CATCH_UP_MULT = 1.8;

const BOMB = { speed: 75, fuseRange: 150, fuse: 1.2, blastR: 170, respawn: 3 };
const SLAP = { speed: 130, knock: 350, knockTime: 0.3, stun: 0.8, cooldown: 1.6 };
const SWORD = { speed: 105, range: 240, telegraph: 0.35, lunge: 0.5, lungeSpeed: 760, rest: 1.5 };

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
    sling: '/sounds/sling.mp3',
    buzzer: '/sounds/buzzer.mp3',
  };
  const audio = {} as Record<keyof typeof files, HTMLAudioElement>;
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
    stop(name: keyof typeof files) {
      audio[name].pause();
    },
    dispose() {
      Object.values(audio).forEach((a) => {
        a.pause();
        a.removeAttribute('src');
        a.load();
      });
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

  // ---- Words ----
  const eatenKeys = new Set<string>();
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

  const loadWords = () => {
    els.masks.replaceChildren();
    words = collectWords(roots, docW, docH);
    grid = new WordGrid();
    eaten = 0;
    words.forEach((word, i) => {
      if (eatenKeys.has(word.key)) {
        word.eaten = true;
        eaten++;
        addMasks(word);
      } else {
        grid.add(i, word);
      }
    });
  };
  loadWords();

  // ---- Player ----
  const startEl = document.querySelector('[data-pacman-start]');
  const startRect = startEl?.getBoundingClientRect();
  let px = startRect ? startRect.left + startRect.width / 2 + window.scrollX : window.scrollX + window.innerWidth / 2;
  let py = startRect ? startRect.top + startRect.height / 2 + window.scrollY : window.scrollY + window.innerHeight / 2;
  let dirX = 1;
  let dirY = 0;
  let moving = false;
  let facing = 0; // degrees
  let lives = LIVES;
  let invulnerable = 0;
  let stunned = 0;
  let knockTime = 0;
  let knockVX = 0;
  let knockVY = 0;
  let phase: 'playing' | GameResult = 'playing';
  let clock = 0;

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
    addMasks(word);
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
          sounds.play('sling');
          showSlap((px + v.x) / 2, (py + v.y) / 2, dx < 0);
          knockVX = (dx * SLAP.knock) / SLAP.knockTime;
          knockVY = (dy * SLAP.knock) / SLAP.knockTime;
          knockTime = SLAP.knockTime;
          stunned = SLAP.stun;
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
    if (k in KEY_DIRS) keys.add(k);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(normKey(e.key));
  };
  const onBlur = () => keys.clear();

  // Drag anywhere to steer: the vector from where the finger landed is the direction.
  let drag: { id: number; x: number; y: number } | null = null;
  const JOY_MAX = 36;
  const onPointerDown = (e: PointerEvent) => {
    if (phase !== 'playing') return;
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
    if (moving && stunned <= 0) facing = (Math.atan2(dirY, dirX) * 180) / Math.PI;

    // Eat whatever words Pac-Man's mouth covers.
    const r = PLAYER_R * 0.8;
    grid.query(px - r, py - r, px + r, py + r, (i) => {
      const word = words[i];
      if (word.eaten || phase !== 'playing') return;
      if (word.rects.some((rect) => circleHitsRect(px, py, r, rect))) eat(word);
    });
    if (phase !== 'playing') return;

    for (const v of villains) {
      if (v.kind === 'bomb') updateBomb(v, dt);
      else if (v.kind === 'slap') updateSlap(v, dt);
      else updateSword(v, dt);
      if (phase !== 'playing') return;
    }
  };

  const render = () => {
    // Player sprite
    els.player.style.transform = `translate3d(${px - PLAYER_R}px, ${py - PLAYER_R}px, 0)`;
    const chompSpeed = reducedMotion ? 5 : 12;
    const mouth = moving && stunned <= 0 ? 0.08 + 0.62 * Math.abs(Math.sin(clock * chompSpeed)) : 0.45;
    const R = 19;
    const cx = (R * Math.cos(mouth)).toFixed(2);
    const sy = (R * Math.sin(mouth)).toFixed(2);
    els.playerMouth.setAttribute('d', `M0 0 L${cx} ${-sy} A${R} ${R} 0 1 0 ${cx} ${sy} Z`);
    // Mirror when heading left so the eye stays on top.
    const left = Math.abs(facing) > 90;
    els.playerFace.setAttribute('transform', left ? `rotate(${facing - 180}) scale(-1 1)` : `rotate(${facing})`);
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

  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    // Pause the simulation while the window has lost focus: Pac-Man never
    // stops on his own, so he'd keep running into villains with no input.
    if (phase === 'playing' && document.hasFocus()) update(dt);
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
    window.scrollTo(startScroll.x, startScroll.y); // while scroll-behavior is still instant
    restorers.reverse().forEach((restore) => restore());
    // Hand focus back to whatever had it (usually the hero doodle). This runs
    // after #root stops being inert, otherwise the focus call is ignored.
    if (prevFocus?.isConnected && prevFocus !== document.body) prevFocus.focus?.({ preventScroll: true });
  };
};
