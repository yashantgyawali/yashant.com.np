# Style guide

Light and playful. Plain white, navy ink outlines, bubblegum pink as the lead color and sunshine yellow as its sidekick. Elements look like stickers: a 2px ink border with a hard offset shadow.

Tokens live in `src/index.css` (`:root`) and are mapped to Tailwind in `tailwind.config.ts`. Use the token classes, never raw hex or `gray-*`.

## Color

| Token | Tailwind | Hex | Use |
| --- | --- | --- | --- |
| `--background` | `bg-background` | `#FFFFFF` | Page (plain white) |
| `--sunken` | `bg-sunken` | `#F6F6F9` | Alternate sections |
| `--surface` | `bg-surface` | `#FFFFFF` | Cards |
| `--foreground` | `text-foreground`, `border-foreground` | `#1E1B3A` | Text, outlines, shadows |
| `--muted-foreground` | `text-muted-foreground` | `#4B4766` | Body copy, captions |
| `--primary` | `bg-primary`, `text-primary` | `#EE6382` | Main actions, highlights, footer |
| `--secondary` | `bg-secondary` | `#FFC94A` | Secondary actions, highlights, underlines |
| `--accent` | `bg-accent` | `#6FD3B5` | Success / wins |
| `--sky` | `bg-sky` | `#7CC6F2` | Extra illustration color, use sparingly |

Text on pink or yellow backgrounds is navy (`text-foreground`). White text only on pink buttons, where it's large and bold.

## Type

- **Headings:** Bricolage Grotesque 600 to 800 (`font-heading`). Quirky ink traps and character, but still precise. Applied to h1–h6 automatically.
- **Body:** DM Sans 400–700 (`font-sans`, the default).
- **Labels:** JetBrains Mono 500/700 (`font-mono`), uppercase with wide tracking, for small system-style labels like step counters.
- **Handwritten notes:** Schoolbell (`font-cursive`), for asides only.

Scale: hero `text-5xl md:text-7xl lg:text-8xl`, section titles `.section-title`, intro paragraphs `.lead`.

## Shape and depth

- Radius: `rounded-full` for buttons and pills, `rounded-2xl` for cards.
- Border: `border-2 border-foreground`.
- Shadows: `shadow-pop-sm` (3px), `shadow-pop` (5px), `shadow-pop-lg` (8px), all solid navy with no blur.
- Keep components straight. No tilts or rotations; play comes from color, shadows and motion.

## Components (in `src/index.css`)

| Class | What it is |
| --- | --- |
| `.btn-primary` | Pink pill button. One per view for the main action. |
| `.btn-sun` | Yellow pill button. Secondary action. |
| `.btn-ghost` | White pill button. Tertiary action. |
| `.card-pop` | White sticker card with outline and shadow. |
| `.section` / `.section-alt` | Vertical rhythm; `section-alt` adds the light gray background. Alternate them down the page. |
| `.section-header`, `.section-title`, `.lead` | Centered section intro block. |

Buttons lift on hover (shadow grows) and press in on click (shadow disappears).
