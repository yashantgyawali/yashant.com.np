// Everything the contact page needs in one place: where answers go, and the
// copy + questions for each button that can open it. Sending uses FormSubmit's
// free AJAX endpoint (no account, no SDK, no trackers).

export const CONTACT_EMAIL = 'yashantgyawali@gmail.com';
export const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

export const CONTACT_HASH_PREFIX = '#hey/';

export type ContactContextKey = 'say-hey' | 'push-the-button' | 'translate' | 'quest';

/** A short answer typed straight into a sentence (mad-libs style). */
export interface InlineField {
  kind: 'inline';
  id: string;
  /** The question as it appears in the email (and to screen readers). */
  label: string;
  placeholder: string;
  required?: boolean;
  type?: 'text' | 'email';
  autoComplete?: string;
  /** Desktop width of the blank. Every blank is full width on phones. */
  size?: 'sm' | 'md' | 'lg';
}

export interface ChipsField {
  kind: 'chips';
  id: string;
  label: string;
  options: string[];
  required?: boolean;
}

export interface TextareaField {
  kind: 'textarea';
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

export type Field = InlineField | ChipsField | TextareaField;

/** A sentence is plain text with blanks dropped in between. */
export type SentencePart = string | InlineField;

export interface ContactContext {
  key: ContactContextKey;
  /** Human name of the thing they clicked, used in the label and the email. */
  source: string;
  /** Shown as "YOU CLICKED: ..." */
  clicked: string;
  subject: (name: string) => string;
  headline: string;
  lead: string;
  /** The fill-in-the-blank letter. */
  letter: SentencePart[][];
  /** Chips and longer answers that follow the letter. */
  extras: Array<ChipsField | TextareaField>;
  submitLabel: string;
  successHeadline: string;
  successLine: (firstName: string) => string;
}

const name = (placeholder = 'your name'): InlineField => ({
  kind: 'inline',
  id: 'name',
  label: 'Name',
  placeholder,
  required: true,
  autoComplete: 'name',
  size: 'md',
});

const email = (placeholder = 'you@somewhere.com'): InlineField => ({
  kind: 'inline',
  id: 'email',
  label: 'Email',
  placeholder,
  required: true,
  type: 'email',
  autoComplete: 'email',
  size: 'md',
});

export const CONTACT_CONTEXTS: Record<ContactContextKey, ContactContext> = {
  'say-hey': {
    key: 'say-hey',
    source: 'Say heyyyyy button',
    clicked: 'Say heyyyyy',
    subject: (n) => `Heyyyyy from ${n} (Say heyyyyy button)`,
    headline: 'Heyyyyy back.',
    lead: "No game, no quest, just a heyyyyy. I'm into it. What's up?",
    letter: [['Hi Yashant, I\'m ', name(), ' and you can reach me at ', email(), '.']],
    extras: [
      {
        kind: 'textarea',
        id: 'message',
        label: "What's on your mind?",
        placeholder: 'A project, a question, a hot take about pineapple pizza...',
        required: true,
      },
      {
        kind: 'chips',
        id: 'found',
        label: "How'd you find me?",
        options: ['LinkedIn', 'A friend', 'Pure chaos', 'Other'],
      },
    ],
    submitLabel: 'Send it',
    successHeadline: 'Got it!',
    successLine: (f) => `Your heyyyyy landed, ${f}.`,
  },

  'push-the-button': {
    key: 'push-the-button',
    source: 'Push the button',
    clicked: 'Push the button',
    subject: (n) => `${n} pushed the button (Push the button)`,
    headline: 'You actually pushed it.',
    lead: 'Relax, nothing exploded. Except maybe my inbox.',
    letter: [['Fine, I confess. My name is ', name(), ' and you can find me at ', email(), '.']],
    extras: [
      {
        kind: 'chips',
        id: 'why',
        label: "Why'd you push it?",
        options: ['Curiosity', 'I push every button', 'Someone dared me'],
        required: true,
      },
      {
        kind: 'textarea',
        id: 'make',
        label: "Since you're here, what should we make?",
        placeholder: 'Something big, something small, something that also explodes...',
      },
    ],
    submitLabel: 'Send it',
    successHeadline: 'Boom. Delivered.',
    successLine: (f) => `Button pushing noted, ${f}.`,
  },

  translate: {
    key: 'translate',
    source: 'Hit me up link (Nepali video)',
    clicked: 'Hit me up',
    subject: (n) => `Translation request from ${n} (Hit me up link)`,
    headline: 'Lost in translation?',
    lead: "Fair. My Nepali philosophy rants don't come with subtitles. Yet.",
    letter: [['Namaste Yashant! I\'m ', name(), ' and my inbox lives at ', email(), '.']],
    extras: [
      {
        kind: 'chips',
        id: 'need',
        label: 'What do you need?',
        options: ['Translate the video', 'A pub debate', 'Both, obviously'],
        required: true,
      },
      {
        kind: 'textarea',
        id: 'opener',
        label: 'Your best deep philosophical opener',
        placeholder: 'If a tree falls in a forest and nobody posts it...',
      },
    ],
    submitLabel: 'Send it',
    successHeadline: 'Dhanyabad!',
    successLine: (f) => `Message received, ${f}. No subtitles needed.`,
  },

  quest: {
    key: 'quest',
    source: 'Start a quest button',
    clicked: 'Start a quest',
    subject: (n) => `New quest from ${n} (Start a quest button)`,
    headline: 'A quest, you say?',
    lead: "Every good adventure starts with a letter. Fill in the blanks and I'll grab my sword.",
    letter: [
      ['Brave Yashant, my name is ', name('Sir or Lady Who'), ' and you can send ravens to ', email('raven@castle.com'), '.'],
      [
        'My quest is to ',
        {
          kind: 'inline',
          id: 'quest',
          label: 'The quest (project or goal)',
          placeholder: 'build, fix or rethink a thing',
          required: true,
          size: 'lg',
        },
        '.',
      ],
      [
        'Oh, and the dragon in the way is ',
        {
          kind: 'inline',
          id: 'dragon',
          label: 'The dragon in the way (problem)',
          placeholder: 'the scary part',
          size: 'lg',
        },
        ' (if there is one).',
      ],
    ],
    extras: [
      {
        kind: 'chips',
        id: 'deadline',
        label: 'It needs slaying by',
        options: ['Yesterday', 'This month', 'Whenever, no rush'],
        required: true,
      },
      {
        kind: 'chips',
        id: 'treasure',
        label: 'Treasure (budget)',
        options: ['Snacks', 'A fair bounty', "A dragon's hoard", "Let's talk"],
      },
    ],
    submitLabel: 'Send the raven',
    successHeadline: 'Raven sent.',
    successLine: (f) => `Sharpen your sword, ${f}.`,
  },
};

/** Every field of a context, in the order it appears on the page. */
export const contextFields = (ctx: ContactContext): Field[] => [
  ...ctx.letter.flat().filter((p): p is InlineField => typeof p !== 'string'),
  ...ctx.extras,
];

/** "#hey/quest" -> "quest". Unknown keys fall back to say-hey; non-contact hashes give null. */
export const contextFromHash = (hash: string): ContactContextKey | null => {
  if (!hash.startsWith(CONTACT_HASH_PREFIX)) return null;
  const key = hash.slice(CONTACT_HASH_PREFIX.length);
  return key in CONTACT_CONTEXTS ? (key as ContactContextKey) : 'say-hey';
};

export const contactHref = (key: ContactContextKey) => `${CONTACT_HASH_PREFIX}${key}`;

export const isPacmanRunning = () => !!document.querySelector('.pacman-player');

// The element that opened the page, so focus can go back to it on close.
let opener: HTMLElement | null = null;
export const rememberOpener = (el: HTMLElement | null) => {
  opener = el;
};
export const takeOpener = () => {
  const el = opener;
  opener = null;
  return el;
};

/** Open the contact page from code (e.g. after the bomb goes off). */
export const openContact = (key: ContactContextKey, from?: HTMLElement | null) => {
  if (isPacmanRunning()) return;
  rememberOpener(from ?? (document.activeElement as HTMLElement | null));
  window.location.hash = contactHref(key);
};

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export type Answers = Record<string, string>;

/** The JSON FormSubmit receives. Question labels become the rows of the email table. */
export const buildPayload = (ctx: ContactContext, answers: Answers, honey: string) => {
  const nameValue = (answers.name ?? '').trim();
  const emailValue = (answers.email ?? '').trim();
  const payload: Record<string, string> = {
    _subject: ctx.subject(nameValue),
    _template: 'table',
    _captcha: 'false',
    _replyto: emailValue,
    _honey: honey,
    'Button clicked': ctx.source,
    Page: window.location.origin,
    Name: nameValue,
    Email: emailValue,
  };
  for (const field of contextFields(ctx)) {
    if (field.id === 'name' || field.id === 'email') continue;
    const value = (answers[field.id] ?? '').trim();
    if (value) payload[field.label] = value;
  }
  return payload;
};

export class ContactSendError extends Error {}

/** Sends the answers. Pass `signal` to cancel (e.g. the page was closed mid-send). */
export const sendContact = async (payload: Record<string, string>, signal?: AbortSignal) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  try {
    const res = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data: { success?: unknown; message?: unknown } = await res.json().catch(() => ({}));
    // Until the inbox owner activates the form, FormSubmit answers success "false".
    if (!res.ok || String(data.success) !== 'true') {
      throw new ContactSendError(typeof data.message === 'string' ? data.message : `HTTP ${res.status}`);
    }
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
};

export const mailtoFallback = (ctx: ContactContext) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Hey from your site (${ctx.source})`)}`;
