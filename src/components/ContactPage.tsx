import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowLeft, Check, Loader2, Mail, MousePointerClick, RotateCcw, Send, Sparkles } from 'lucide-react';
import Logo from './Logo';
import './contact-blast.css';
import {
  Answers,
  CONTACT_CONTEXTS,
  ContactSendError,
  ChipsField,
  ContactContextKey,
  Field,
  InlineField,
  TextareaField,
  buildPayload,
  contextFields,
  contextFromHash,
  isPacmanRunning,
  isValidEmail,
  mailtoFallback,
  rememberOpener,
  sendContact,
  takeOpener,
} from '@/lib/contact';

type Status = 'idle' | 'sending' | 'success' | 'error';

const fieldDomId = (id: string) => `contact-${id}`;
const errorDomId = (id: string) => `contact-${id}-error`;

const stripHash = () => window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);

const inlineSize: Record<NonNullable<InlineField['size']>, string> = {
  sm: 'sm:w-44',
  md: 'sm:w-64',
  lg: 'sm:w-[26rem]',
};

// Smoke, embers and soot behind the "Push the button" page. Purely decorative.
const PUFFS = [
  { tone: 'light', top: '-8%', left: '-10%', size: 420, dur: 24, dx: 60, dy: 30 },
  { tone: 'dark', top: '12%', left: '62%', size: 360, dur: 30, dx: -50, dy: 40 },
  { tone: 'light', top: '48%', left: '70%', size: 460, dur: 28, dx: -70, dy: -30 },
  { tone: 'dark', top: '62%', left: '-6%', size: 380, dur: 34, dx: 50, dy: -40 },
  { tone: 'light', top: '78%', left: '30%', size: 340, dur: 22, dx: 40, dy: -50 },
];
const EMBERS = [
  { left: '8%', size: 5, dur: 9, delay: 0, drift: 30 },
  { left: '22%', size: 7, dur: 12, delay: 2.5, drift: -20 },
  { left: '37%', size: 4, dur: 8, delay: 5, drift: 40 },
  { left: '55%', size: 6, dur: 11, delay: 1.2, drift: -35 },
  { left: '68%', size: 5, dur: 10, delay: 3.8, drift: 25 },
  { left: '83%', size: 7, dur: 13, delay: 0.6, drift: -30 },
  { left: '93%', size: 4, dur: 9, delay: 6, drift: 15 },
];

const BlastBackdrop = () => (
  <div className="blast-backdrop" aria-hidden="true">
    <div className="blast-soot" />
    {PUFFS.map((p, i) => (
      <span
        key={i}
        className={`blast-puff blast-puff--${p.tone}`}
        style={{
          top: p.top,
          left: p.left,
          width: p.size,
          height: p.size,
          ['--dur' as string]: `${p.dur}s`,
          ['--dx' as string]: `${p.dx}px`,
          ['--dy' as string]: `${p.dy}px`,
        }}
      />
    ))}
    {EMBERS.map((e, i) => (
      <span
        key={i}
        className="blast-ember"
        style={{
          left: e.left,
          ['--size' as string]: `${e.size}px`,
          ['--dur' as string]: `${e.dur}s`,
          ['--delay' as string]: `${e.delay}s`,
          ['--drift' as string]: `${e.drift}px`,
        }}
      />
    ))}
  </div>
);

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={errorDomId(id)} className="mt-2 flex items-center gap-1.5 text-base font-medium text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  ) : null;

// One overlay "page" for every contact button. It opens when the URL hash is
// #hey/<context> so each button is a plain link, and Back closes it.
const ContactPage = () => {
  const [openKey, setOpenKey] = useState<ContactContextKey | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<ContactContextKey, Answers>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  // What the mail service said when a send failed, shown under the apology.
  const [sendError, setSendError] = useState('');
  // True when opening added a history entry, so closing should go Back instead.
  const pushedRef = useRef(false);
  const sendingRef = useRef(false);
  // The send in flight, so closing the page can cancel it.
  const abortRef = useRef<AbortController | null>(null);
  const honeyRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  // Mirror for the cleanup below, which only sees values from when it opened.
  const statusRef = useRef<Status>('idle');
  statusRef.current = status;

  // Listen to the hash. A direct visit to /#hey/... opens without a history entry.
  useEffect(() => {
    const initial = contextFromHash(window.location.hash);
    if (initial) {
      if (isPacmanRunning()) stripHash();
      else {
        pushedRef.current = false;
        setOpenKey(initial);
      }
    }

    const onHashChange = () => {
      const key = contextFromHash(window.location.hash);
      if (!key) {
        setOpenKey(null);
        return;
      }
      if (isPacmanRunning()) {
        stripHash();
        return;
      }
      pushedRef.current = true;
      setOpenKey(key);
    };

    // Remember which link opened the page (Safari doesn't focus links on click).
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="#hey/"]') as HTMLElement | null;
      if (!link) return;
      if (isPacmanRunning()) {
        e.preventDefault();
        return;
      }
      rememberOpener(link);
    };

    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  const isOpen = openKey !== null;

  // Lock the site behind the page while open, then put everything back.
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const root = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    root?.setAttribute('inert', '');
    headingRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = prevOverflow;
      root?.removeAttribute('inert');
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
      const opener = takeOpener();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  // Each open (or switch to another context) is its own session. Leaving it
  // cancels a send still in flight so its result can't show up next time.
  useEffect(() => {
    if (!openKey) return;
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      sendingRef.current = false;
      // A sent message clears its draft; anything unsent stays for next time.
      if (statusRef.current === 'success') setAnswers((a) => ({ ...a, [openKey]: {} }));
      setStatus('idle');
      setErrors({});
    };
  }, [openKey]);

  const close = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      stripHash();
      setOpenKey(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus({ preventScroll: true });
    if (status === 'error') errorRef.current?.focus();
  }, [status]);

  if (!openKey) return null;

  const ctx = CONTACT_CONTEXTS[openKey];
  const values = answers[openKey] ?? {};
  const fields = contextFields(ctx);

  const setValue = (id: string, value: string) => {
    // Answers are frozen while sending (fields stay focusable, just read-only).
    if (sendingRef.current) return;
    setAnswers((a) => ({ ...a, [openKey]: { ...(a[openKey] ?? {}), [id]: value } }));
    if (errors[id]) setErrors(({ [id]: _gone, ...rest }) => rest);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = (values[field.id] ?? '').trim();
      if (field.required && !value) {
        if (field.id === 'name') next.name = 'I need something to call you.';
        else if (field.id === 'email') next.email = "I'll need this to write back.";
        else if (field.kind === 'chips') next[field.id] = 'Pick one, any one.';
        else next[field.id] = "Don't leave me hanging here.";
      } else if (field.id === 'email' && !isValidEmail(value)) {
        next.email = "Hmm, that email doesn't look quite right.";
      }
    }
    return next;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (sendingRef.current) return;

    const found = validate();
    setErrors(found);
    const firstBad = fields.find((f) => found[f.id]);
    if (firstBad) {
      const target = document.getElementById(firstBad.kind === 'chips' ? `${fieldDomId(firstBad.id)}-0` : fieldDomId(firstBad.id));
      target?.focus();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    sendingRef.current = true;
    setStatus('sending');
    try {
      await sendContact(buildPayload(ctx, values, honeyRef.current?.value ?? ''), controller.signal);
      if (controller.signal.aborted) return; // page closed mid-send
      setStatus('success');
      formTopRef.current?.scrollIntoView({ block: 'start' });
    } catch (err) {
      if (controller.signal.aborted) return;
      setSendError(err instanceof ContactSendError ? err.message : '');
      setStatus('error');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        sendingRef.current = false;
      }
    }
  };

  const describedBy = (id: string) => (errors[id] ? errorDomId(id) : undefined);

  const renderInline = (field: InlineField) => (
    <input
      key={field.id}
      id={fieldDomId(field.id)}
      name={field.id}
      type={field.type ?? 'text'}
      inputMode={field.type === 'email' ? 'email' : undefined}
      autoComplete={field.autoComplete ?? 'off'}
      aria-label={field.required ? field.label : `${field.label} (optional)`}
      aria-required={field.required || undefined}
      aria-invalid={errors[field.id] ? true : undefined}
      aria-describedby={describedBy(field.id)}
      placeholder={field.placeholder}
      value={values[field.id] ?? ''}
      onChange={(e) => setValue(field.id, e.target.value)}
      readOnly={status === 'sending'}
      className={`my-2 block w-full min-h-[44px] max-w-full rounded-none border-0 border-b-2 border-foreground bg-transparent px-1 py-1 font-heading text-xl font-semibold text-primary transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary/25 focus:outline-none aria-[invalid=true]:border-destructive sm:mx-1 sm:my-0 sm:inline-block md:text-2xl ${inlineSize[field.size ?? 'md']}`}
    />
  );

  const renderChips = (field: ChipsField) => (
    <fieldset key={field.id} className="mt-10">
      <legend className="font-heading text-xl font-bold md:text-2xl">
        {field.label}
        {!field.required && <span className="ml-2 font-cursive text-lg font-normal text-muted-foreground">(optional)</span>}
      </legend>
      <div className="mt-4 flex flex-wrap gap-3">
        {field.options.map((option, i) => {
          const checked = values[field.id] === option;
          return (
            <label key={option} className="relative">
              <input
                id={i === 0 ? `${fieldDomId(field.id)}-0` : undefined}
                type="radio"
                name={fieldDomId(field.id)}
                value={option}
                checked={checked}
                aria-invalid={errors[field.id] ? true : undefined}
                aria-describedby={describedBy(field.id)}
                onChange={() => setValue(field.id, option)}
                // Optional chips can be un-picked by clicking them again.
                onClick={() => {
                  if (!field.required && checked) setValue(field.id, '');
                }}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-[44px] cursor-pointer select-none items-center gap-2 rounded-full border-2 border-foreground bg-surface px-5 py-2 font-heading text-base font-semibold shadow-pop-sm transition-all hover:-translate-y-0.5 hover:shadow-pop peer-checked:bg-secondary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-disabled:opacity-60">
                {checked && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
                {option}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={field.id} message={errors[field.id]} />
    </fieldset>
  );

  const renderTextarea = (field: TextareaField) => (
    <div key={field.id} className="mt-10">
      <label htmlFor={fieldDomId(field.id)} className="block font-heading text-xl font-bold md:text-2xl">
        {field.label}
        {!field.required && <span className="ml-2 font-cursive text-lg font-normal text-muted-foreground">(optional)</span>}
      </label>
      <textarea
        id={fieldDomId(field.id)}
        name={field.id}
        rows={4}
        aria-required={field.required || undefined}
        aria-invalid={errors[field.id] ? true : undefined}
        aria-describedby={describedBy(field.id)}
        placeholder={field.placeholder}
        value={values[field.id] ?? ''}
        onChange={(e) => setValue(field.id, e.target.value)}
        readOnly={status === 'sending'}
        className="mt-4 block w-full resize-y rounded-2xl border-2 border-foreground bg-surface p-4 text-lg leading-relaxed shadow-pop-sm transition-shadow placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-pop focus:outline-none aria-[invalid=true]:border-destructive"
      />
      <FieldError id={field.id} message={errors[field.id]} />
    </div>
  );

  const renderExtra = (field: Field) =>
    field.kind === 'chips' ? renderChips(field) : field.kind === 'textarea' ? renderTextarea(field) : null;

  // The bomb's page looks like the scene of the explosion.
  const blast = openKey === 'push-the-button';
  const firstName = (values.name ?? '').trim().split(/\s+/)[0] || 'friend';

  return createPortal(
    <div
      data-contact-page
      data-theme={blast ? 'blast' : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-heading"
      // scroll-pt keeps focused fields out from under the sticky top bar.
      className="fixed inset-0 z-[95] scroll-pt-24 overflow-y-auto overflow-x-hidden overscroll-contain bg-background text-foreground"
    >
      {blast && <BlastBackdrop />}

      {/* Always mounted so screen readers hear the send progress */}
      <p className="sr-only" aria-live="polite">
        {status === 'sending' ? 'Sending...' : status === 'success' ? 'Sent.' : ''}
      </p>

      {/* Slim top bar */}
      <div className="contact-topbar sticky top-0 z-10 border-b-2 border-foreground bg-background/95 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="group flex items-center gap-2 font-heading text-xl font-bold tracking-tight sm:text-2xl">
            <Logo className="contact-logo h-9 w-auto sm:h-10" />
            yashant
          </div>
          <button type="button" onClick={close} className="btn-ghost !px-4 !py-2 !text-base whitespace-nowrap">
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
            Back to the site
          </button>
        </div>
      </div>

      <div ref={formTopRef} className="relative mx-auto max-w-2xl scroll-mt-24 px-4 pb-24 pt-10 md:pt-16">
        {status === 'success' ? (
          <div className="motion-safe:animate-fade-in">
            <div className="flex items-end gap-3">
              <span className="contact-hop inline-block">
                <Logo className="contact-logo h-20 w-auto md:h-24" />
              </span>
              <Sparkles className="mb-2 h-8 w-8 text-secondary motion-safe:animate-pulse" strokeWidth={2.25} aria-hidden="true" />
            </div>
            <h2
              id="contact-heading"
              ref={successRef}
              tabIndex={-1}
              className="mt-8 text-5xl leading-[1.05] focus:outline-none md:text-7xl"
            >
              {ctx.successHeadline}
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-muted-foreground md:text-2xl">
              {ctx.successLine(firstName)}
            </p>
            <p className="mt-4 font-cursive text-xl text-foreground">
              I'll write back. Peek in spam too, my emails are shy.
            </p>
            <button type="button" onClick={close} className="btn-primary mt-10">
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
              Back to the site
            </button>
          </div>
        ) : (
          <div className="motion-safe:animate-fade-in">
            <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground md:text-sm">
              <MousePointerClick className="h-4 w-4 text-primary" strokeWidth={2.5} aria-hidden="true" />
              You clicked: {ctx.clicked}
            </p>
            <h2
              id="contact-heading"
              ref={headingRef}
              tabIndex={-1}
              className="mt-5 text-4xl leading-[1.05] focus:outline-none md:text-6xl"
            >
              {ctx.headline}
            </h2>
            <p className="lead mt-5">{ctx.lead}</p>

            <form noValidate onSubmit={handleSubmit} className="mt-12">
              {/* The letter: sentences with blanks to fill in */}
              <div className="space-y-6">
                {ctx.letter.map((sentence, i) => {
                  const blanks = sentence.filter((p): p is InlineField => typeof p !== 'string');
                  return (
                    <div key={i}>
                      <p className="text-xl leading-relaxed text-foreground md:text-2xl md:leading-[2.1]">
                        {sentence.map((part, j) =>
                          typeof part === 'string' ? (
                            // A lone "." under a full-width blank looks lost on phones.
                            <span key={j} className={/^[.,!?]$/.test(part) ? 'hidden sm:inline' : undefined}>
                              {part}
                            </span>
                          ) : (
                            renderInline(part)
                          ),
                        )}
                      </p>
                      {blanks.map((b) => (
                        <FieldError key={b.id} id={b.id} message={errors[b.id]} />
                      ))}
                    </div>
                  );
                })}
              </div>

              {ctx.extras.map(renderExtra)}

              {/* Honeypot: real people never see or fill this */}
              <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="contact-honey">Leave this empty</label>
                <input ref={honeyRef} id="contact-honey" type="text" name="botcheck" tabIndex={-1} autoComplete="off" defaultValue="" />
              </div>

              {status === 'error' && (
                // Focus lands on the heading, which reads the message out.
                <div className="mt-12 border-l-4 border-primary pl-5">
                  <p ref={errorRef} tabIndex={-1} className="font-heading text-2xl font-bold focus:outline-none">
                    Well, that didn't fly.
                  </p>
                  <p className="mt-2 text-lg text-muted-foreground">
                    Your answers are safe. Try again, or email me like it's 2005.
                  </p>
                  {sendError && (
                    <p className="mt-2 font-mono text-sm text-muted-foreground">The mail robot said: {sendError}</p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      // This block unmounts while sending, so park focus on Send first.
                      onClick={() => {
                        submitRef.current?.focus();
                        handleSubmit();
                      }}
                      className="btn-sun !text-base"
                    >
                      <RotateCcw className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                      Try again
                    </button>
                    <a href={mailtoFallback(ctx)} className="btn-ghost !text-base">
                      <Mail className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                      Email me instead
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-12">
                {/* aria-disabled, not disabled, so focus stays put while sending */}
                <button
                  ref={submitRef}
                  type="submit"
                  className="btn-primary aria-disabled:cursor-wait aria-disabled:opacity-60"
                  aria-disabled={status === 'sending' || undefined}
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="h-5 w-5 motion-safe:animate-spin" strokeWidth={2.5} aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                      {ctx.submitLabel}
                    </>
                  )}
                </button>
                <p className="mt-3 font-cursive text-lg text-muted-foreground">
                  Goes straight to my inbox. No trackers, promise.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ContactPage;
