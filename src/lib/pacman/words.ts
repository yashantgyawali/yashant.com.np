// Turns the visible page text and icons into Pac-Man pellets.
// We never touch React-managed text nodes: each word is measured with a Range
// and "eaten" by covering it with a mask in the game's own layer. Icons are
// eaten by hiding the element itself (the engine restores it on exit).

export interface DocRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Word {
  key: string; // stable across re-measures (text node id + offset)
  rects: DocRect[]; // document coordinates; more than one if the word wraps
  color: string; // opaque background behind the word, used for its mask
  eaten: boolean;
  el?: HTMLElement | SVGElement; // set for icons: eaten by hiding this element
}

// Anything in here is never a pellet.
const SKIP_SELECTOR =
  'script, style, noscript, iframe, template, [aria-hidden="true"], [data-pacman-ui]';

// Stable ids for text nodes and icons so eaten pellets survive a resize re-measure.
const nodeIds = new WeakMap<Node, number>();
let nextNodeId = 1;
const idFor = (node: Node) => {
  let id = nodeIds.get(node);
  if (!id) {
    id = nextNodeId++;
    nodeIds.set(node, id);
  }
  return id;
};

type RGBA = [number, number, number, number];

const parseColor = (value: string): RGBA | null => {
  const m = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
  if (!m) return null;
  let a = m[4] === undefined ? 1 : parseFloat(m[4]);
  if (m[4]?.endsWith('%')) a /= 100;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), a];
};

// The background actually on screen behind an element: every ancestor's
// background-color composited bottom-up, with each ancestor's opacity applied
// to its whole group (so a faded card over a gray section gives a faded mask).
// Falls back to white below the root.
const createBackgroundResolver = () => {
  const cache = new Map<Element, string>();
  const styles = new Map<Element, { bg: RGBA | string; opacity: number }>();

  const styleOf = (el: Element) => {
    let s = styles.get(el);
    if (!s) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      s = { bg: parseColor(bg) ?? bg, opacity: parseFloat(cs.opacity) };
      if (Number.isNaN(s.opacity)) s.opacity = 1;
      styles.set(el, s);
    }
    return s;
  };

  return (start: Element): string => {
    const cached = cache.get(start);
    if (cached) return cached;

    // c is a premultiplied RGBA of everything painted so far, from the
    // element itself upward. Each ancestor's background goes underneath it,
    // then that ancestor's opacity scales the whole group.
    let c: RGBA = [0, 0, 0, 0];
    let el: Element | null = start;
    let color: string | null = null;
    while (el) {
      const { bg, opacity } = styleOf(el);
      if (typeof bg === 'string') {
        // Unknown color syntax that isn't transparent: trust it as is.
        if (bg && bg !== 'transparent' && c[3] === 0 && opacity >= 1) {
          color = bg;
          break;
        }
      } else if (bg[3] > 0) {
        const k = 1 - c[3];
        c = [c[0] + bg[0] * bg[3] * k, c[1] + bg[1] * bg[3] * k, c[2] + bg[2] * bg[3] * k, c[3] + bg[3] * k];
      }
      if (opacity < 1) c = [c[0] * opacity, c[1] * opacity, c[2] * opacity, c[3] * opacity];
      el = el.parentElement;
    }

    if (!color) {
      const k = 1 - c[3]; // white page underneath whatever is left uncovered
      const ch = (i: number) => Math.round(c[i] + 255 * k);
      color = `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
    }
    cache.set(start, color);
    return color;
  };
};

const createVisibilityCheck = () => {
  const cache = new Map<Element, boolean>();
  return (el: Element): boolean => {
    const cached = cache.get(el);
    if (cached !== undefined) return cached;
    let visible: boolean;
    const withCheck = el as Element & {
      checkVisibility?: (opts?: Record<string, boolean>) => boolean;
    };
    if (typeof withCheck.checkVisibility === 'function') {
      visible = withCheck.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    } else {
      const style = getComputedStyle(el);
      visible = style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
    }
    cache.set(el, visible);
    return visible;
  };
};

// Measure every visible word inside the given roots, in document coordinates.
export const collectWords = (roots: Element[], docW: number, docH: number): Word[] => {
  const words: Word[] = [];
  const range = document.createRange();
  const isVisible = createVisibilityCheck();
  const backgroundOf = createBackgroundResolver();
  const sx = window.scrollX;
  const sy = window.scrollY;

  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
        if (!isVisible(parent)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node = walker.nextNode() as Text | null;
    while (node) {
      const text = node.nodeValue ?? '';
      const parent = node.parentElement as Element;
      const id = idFor(node);
      const re = /\S+/g;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text))) {
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const rects: DocRect[] = [];
        for (const r of Array.from(range.getClientRects())) {
          // Skip collapsed and screen-reader-only (1px) boxes, and anything off the document.
          if (r.width < 2 || r.height < 2) continue;
          const x = r.left + sx;
          const y = r.top + sy;
          if (x + r.width < 0 || y + r.height < 0 || x > docW || y > docH) continue;
          rects.push({ x, y, w: r.width, h: r.height });
        }
        if (rects.length) {
          words.push({ key: `${id}:${match.index}`, rects, color: backgroundOf(parent), eaten: false });
        }
      }
      node = walker.nextNode() as Text | null;
    }
  }
  range.detach();
  return words;
};

// Icons that are never pellets: the villains' source icons, the hero doodle
// and its hint, the game's own UI and the contact page.
const ICON_SKIP_SELECTOR =
  'script, noscript, iframe, template, [data-villain], [data-pacman-start], [data-pacman-hint], [data-pacman-ui], [data-contact-page]';
const ICON_MAX = 64; // anything bigger is an illustration, not an icon

// Measure every visible inline svg and small image inside the given roots.
// `keepHidden` lets icons the game already ate (visibility: hidden) through,
// so a resize re-measure doesn't drop them from the count.
export const collectIcons = (
  roots: Element[],
  docW: number,
  docH: number,
  keepHidden: (el: Element) => boolean,
): Word[] => {
  const icons: Word[] = [];
  const isVisible = createVisibilityCheck();
  const sx = window.scrollX;
  const sy = window.scrollY;

  for (const root of roots) {
    for (const el of Array.from(root.querySelectorAll<HTMLElement | SVGElement>('svg, img'))) {
      // Only the outermost svg counts; nested ones are part of the same icon.
      if (el instanceof SVGElement && el.parentElement?.closest('svg')) continue;
      if (el.closest(ICON_SKIP_SELECTOR)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.width > ICON_MAX || r.height > ICON_MAX) continue;
      if (!keepHidden(el) && !isVisible(el)) continue;
      const x = r.left + sx;
      const y = r.top + sy;
      if (x + r.width < 0 || y + r.height < 0 || x > docW || y > docH) continue;
      icons.push({ key: `icon:${idFor(el)}`, rects: [{ x, y, w: r.width, h: r.height }], color: '', eaten: false, el });
    }
  }
  return icons;
};

// Uniform-grid bucketing so collision only checks words near Pac-Man.
export class WordGrid {
  private cells = new Map<number, number[]>();

  constructor(private size = 128) {}

  private key(cx: number, cy: number) {
    return cy * 8192 + cx;
  }

  add(index: number, word: Word) {
    for (const r of word.rects) {
      const x0 = Math.floor(r.x / this.size);
      const x1 = Math.floor((r.x + r.w) / this.size);
      const y0 = Math.floor(r.y / this.size);
      const y1 = Math.floor((r.y + r.h) / this.size);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const k = this.key(cx, cy);
          const bucket = this.cells.get(k);
          if (bucket) bucket.push(index);
          else this.cells.set(k, [index]);
        }
      }
    }
  }

  // Calls `visit` for every word index in the cells overlapping the box.
  // A word spanning several cells may be visited more than once.
  query(x0: number, y0: number, x1: number, y1: number, visit: (index: number) => void) {
    const cx0 = Math.floor(x0 / this.size);
    const cx1 = Math.floor(x1 / this.size);
    const cy0 = Math.floor(y0 / this.size);
    const cy1 = Math.floor(y1 / this.size);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) for (const i of bucket) visit(i);
      }
    }
  }
}

// Circle vs axis-aligned rect overlap.
export const circleHitsRect = (cx: number, cy: number, r: number, rect: DocRect) => {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
};
