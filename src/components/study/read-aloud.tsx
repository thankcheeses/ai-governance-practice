"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  RATE_STEPS,
  cancelSpeech,
  isLocalVoice,
  getRate,
  getVoiceURI,
  listVoices,
  onVoicesChanged,
  pickVoice,
  setRate,
  setVoiceURI,
  speak,
  speechSupported,
} from "@/lib/speech";
import { getLanguage, languageFor } from "@/lib/languages";
import { cn } from "@/lib/utils";

/**
 * The read-aloud bar on a question screen.
 *
 * ## It reads the page, not the record
 *
 * Parts are collected from `[data-speak]` elements inside the question
 * container, in document order, using their rendered `textContent`. Reading the
 * DOM rather than the `Question` object is the whole trick:
 *
 *  - A learner who has run the page through their browser's translator hears
 *    the translation, because that is what the DOM now holds. No translation
 *    API, no key, no second copy of the question bank, and nothing stored or
 *    shipped — the only thing this app ever claims as its own content is the
 *    English it authored.
 *  - The spoken order is the visual order by construction, so the two cannot
 *    drift the way a hand-built string would.
 *  - The language is read from whatever `lang` is in effect on the element,
 *    which is how a translated page gets a matching voice without the learner
 *    choosing one.
 *
 * On translation generally: this project does not machine-translate its own
 * questions. They state legal obligations, where "controller", "provider" and
 * "substantial modification" are terms of art with official renderings in other
 * languages, and an unreviewed translation would quietly teach the wrong word.
 * Using the learner's own translator keeps that an explicitly unofficial aid
 * they invoked, instead of this app presenting a machine translation of the law
 * as its own study material.
 *
 * ## Where the voice runs is part of the choice
 *
 * The picker separates on-device voices from network ones and says what the
 * difference costs, because Chrome lists them together with nothing to
 * distinguish them. `pickVoice` prefers on-device at every step, so the default
 * never sends a learner’s question text anywhere; a network voice stays
 * reachable, but only deliberately.
 *
 * ## No voices is a real state
 *
 * `speechSynthesis` exists in every current browser, but a device can have zero
 * installed voices — a bare Linux container is the obvious case, and it is the
 * one this was developed against. The control then says so rather than offering
 * a button that silently does nothing.
 */
export function ReadAloud({
  targetRef,
  /** Re-reading stops when this changes, so one question never reads over another. */
  questionId,
  className,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  questionId: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [rate, setRateState] = useState(1);
  const [voiceURI, setVoiceURIState] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [readingLang, setReadingLang] = useState<string | null>(null);
  const panelId = useId();

  // Latest-value box for the unmount cleanup, which must not re-run on changes.
  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  /*
    Everything stored lives in localStorage, which does not exist during the
    static export's server render or the first client paint. Reading it in an
    effect and holding `mounted` keeps the markup identical on both sides;
    rendering a stored rate directly would be a hydration mismatch.
  */
  useEffect(() => {
    setMounted(true);
    setRateState(getRate());
    setVoiceURIState(getVoiceURI());
    setReadingLang(getLanguage());

    const sync = () => setVoices(listVoices());
    sync();
    // Chrome returns an empty list on the first call and fires this once the
    // list is ready; Safari fills it synchronously and may never fire.
    return onVoicesChanged(sync);
  }, []);

  // A question change must silence the previous one immediately.
  useEffect(() => {
    cancelSpeech();
    setSpeaking(false);
  }, [questionId]);

  useEffect(
    () => () => {
      if (speakingRef.current) cancelSpeech();
    },
    [],
  );

  const supported = mounted && speechSupported();
  const hasVoices = voices.length > 0;

  const start = useCallback(() => {
    const root = targetRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-speak]"));
    const parts = nodes
      .map((el) => {
        const label = el.dataset.speakLabel;
        const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!text) return "";
        // The option letter is a separate element so it can be swapped for a
        // glyph after the reveal; spoken, it has to come back, or every option
        // sounds the same and none can be referred to.
        return label ? `${label}. ${text}` : text;
      })
      .filter(Boolean);

    if (parts.length === 0) return;

    // Whatever `lang` is in effect where the text actually is — which a
    // translator will have changed.
    const lang =
      nodes[0]?.closest<HTMLElement>("[lang]")?.getAttribute("lang") ??
      document.documentElement.lang ??
      "en";

    setSpeaking(true);
    speak(parts, {
      rate,
      lang,
      /*
        The reading language from Settings refines the lookup; it never
        overrides what is on screen. See `pickVoice` — reading English text in
        a Spanish voice because the learner reads Spanish would be worse
        pronunciation, not better, which is the opposite of what they asked
        for.
      */
      voice: pickVoice(voices, voiceURI, lang, readingLang),
      onDone: () => setSpeaking(false),
    });
  }, [rate, readingLang, targetRef, voiceURI, voices]);

  const stop = useCallback(() => {
    cancelSpeech();
    setSpeaking(false);
  }, []);

  /*
    Split on where the voice runs before grouping by language, because that
    distinction matters more here than the language does.

    A network voice sends the text it reads to whoever supplies it, and here
    that text is the question the learner is working on. Chrome lists those
    alongside on-device voices with nothing to tell them apart, so someone
    picking "a nicer voice" has no way to know they just changed where their
    study text goes. Labelling is the minimum; hiding them would be worse,
    because for some languages a network voice is the only one there is.
  */
  const [onDevice, network] = useMemo(() => {
    const local: SpeechSynthesisVoice[] = [];
    const remote: SpeechSynthesisVoice[] = [];
    for (const v of voices) (isLocalVoice(v) ? local : remote).push(v);
    const byLang = (list: SpeechSynthesisVoice[]) => {
      const m = new Map<string, SpeechSynthesisVoice[]>();
      for (const v of list) {
        const key = v.lang || "other";
        const got = m.get(key);
        if (got) got.push(v);
        else m.set(key, [v]);
      }
      return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
    };
    return [byLang(local), byLang(remote)];
  }, [voices]);

  // Render nothing at all before mount rather than a disabled shell: the server
  // cannot know whether speech exists, and a control that appears and then
  // vanishes is worse than one that arrives a frame late.
  if (!mounted) return null;

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={speaking ? stop : start}
          disabled={!supported || !hasVoices}
          aria-describedby={!supported || !hasVoices ? `${panelId}-why` : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5",
            "text-[0.8125rem] font-medium transition-colors",
            "disabled:cursor-default disabled:opacity-50",
            speaking
              ? "border-accent bg-accent-tint text-accent-foreground"
              : "border-border bg-card hover:bg-secondary/60",
          )}
        >
          <SpeakerGlyph speaking={speaking} />
          {speaking ? "Stop" : "Read aloud"}
        </button>

        {supported && hasVoices ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className={cn(
              "rounded-lg border border-border bg-card px-3 py-1.5",
              "text-[0.8125rem] font-medium transition-colors hover:bg-secondary/60",
            )}
          >
            {`Speed ${rate}×`}
          </button>
        ) : null}
      </div>

      {!supported || !hasVoices ? (
        <p id={`${panelId}-why`} className="mt-1.5 text-xs text-muted-foreground">
          {!supported
            ? "This browser has no speech support, so read-aloud is unavailable."
            : "No speech voices are installed on this device. Adding a voice in your " +
              "system settings enables read-aloud here — nothing needs to change in the app."}
        </p>
      ) : null}

      {open && supported && hasVoices ? (
        <div
          id={panelId}
          className="mt-2 rounded-xl border border-border bg-background/55 p-3.5"
        >
          <fieldset>
            <legend className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Speed
            </legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RATE_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  aria-pressed={rate === step}
                  onClick={() => {
                    setRate(step);
                    setRateState(step);
                    // Rate cannot change mid-utterance in any engine, so a
                    // change while speaking restarts at the new speed. Silently
                    // keeping the old speed would look like the control is broken.
                    if (speaking) {
                      cancelSpeech();
                      setSpeaking(false);
                    }
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[0.8125rem] tabular-nums transition-colors",
                    rate === step
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card hover:bg-secondary/60",
                  )}
                >
                  {`${step}×`}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-3.5">
            <label
              htmlFor={`${panelId}-voice`}
              className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            >
              Voice and language
            </label>
            <select
              id={`${panelId}-voice`}
              value={voiceURI ?? ""}
              onChange={(e) => {
                const next = e.target.value || null;
                setVoiceURI(next);
                setVoiceURIState(next);
                if (speaking) {
                  cancelSpeech();
                  setSpeaking(false);
                }
              }}
              className={cn(
                "mt-1.5 w-full rounded-md border border-border bg-card px-2.5 py-1.5",
                "text-[0.8125rem]",
              )}
            >
              <option value="">
                {readingLang && languageFor(readingLang)
                  ? `Match the page — ${languageFor(readingLang)!.english} when translated`
                  : "Match the page language (on-device voice)"}
              </option>
              {onDevice.map(([lang, list]) => (
                <optgroup key={`local-${lang}`} label={`${lang} — on this device`}>
                  {list.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              {network.map(([lang, list]) => (
                <optgroup
                  key={`net-${lang}`}
                  label={`${lang} — network voice (text is sent to the provider)`}
                >
                  {list.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Read-aloud speaks the text as it appears on screen. If you
              translate this page with your browser, it reads the translation
              {" — "}pick a voice in that language here. The questions
              themselves are written and stored in English only.
            </p>
            {network.length > 0 ? (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                On-device voices are used by default, and nothing leaves your
                device. Your browser also offers network voices, marked above:
                choosing one sends the text being read to that voice&rsquo;s
                provider.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Drawn rather than pulled from an icon set, matching `MarkGlyph` in
 * `question-view.tsx`. Two waves when idle, three when speaking — the shape
 * changes, not just a color, so the state is not carried by hue alone.
 */
function SpeakerGlyph({ speaking }: { speaking: boolean }) {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M6 2.5 3.2 5H1.5v4h1.7L6 11.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8.4 5.1a2.7 2.7 0 0 1 0 3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {speaking ? (
        <path d="M10.4 3.4a5.4 5.4 0 0 1 0 7.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
