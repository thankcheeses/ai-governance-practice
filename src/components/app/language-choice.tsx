"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  LANGUAGES,
  getLanguage,
  hasVoiceFor,
  languageFor,
  setLanguage,
} from "@/lib/languages";
import { listVoices, onVoicesChanged } from "@/lib/speech";
import { cn } from "@/lib/utils";

/**
 * The reading-language chooser.
 *
 * What it does and does not do is the whole point, so it says so on screen
 * rather than leaving a learner to discover it. Choosing a language here:
 *
 *  - shows the note for that language, written in it;
 *  - reports whether this device has a read-aloud voice for it;
 *  - is remembered on this device.
 *
 * It does not translate the app, and it does not set `lang` on the document —
 * see `languages.ts` for why both of those are deliberate. The browser does the
 * translating, and it does it better than a static export could.
 *
 * The list shows each language in its own script first and its English name
 * second. The endonym is the part a learner scans for, and a list that only
 * said "Vietnamese" would be unreadable to exactly the person looking for it.
 */
export function LanguageChoice() {
  const [code, setCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const selectId = useId();

  useEffect(() => {
    setMounted(true);
    setCode(getLanguage());
    const sync = () => setVoices(listVoices());
    sync();
    return onVoicesChanged(sync);
  }, []);

  const chosen = languageFor(code);
  const voiceReady = useMemo(
    () => (chosen ? hasVoiceFor(chosen.code, voices) : false),
    [chosen, voices],
  );

  const grouped = useMemo(
    () => ({
      us: LANGUAGES.filter((l) => l.group === "us"),
      subject: LANGUAGES.filter((l) => l.group === "subject"),
    }),
    [],
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={selectId} className="text-sm font-medium">
          Reading language
        </label>
        <p className="measure mt-1 text-xs leading-relaxed text-muted-foreground">
          The questions are written in English and this app does not translate
          them. Pick your language and it will show you how to read the page in
          it, using your browser&rsquo;s own translation.
        </p>
        <select
          id={selectId}
          value={code ?? ""}
          disabled={!mounted}
          onChange={(e) => {
            const next = e.target.value || null;
            setLanguage(next);
            setCode(next);
          }}
          className={cn(
            "mt-2.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm",
            "disabled:opacity-40",
          )}
        >
          <option value="">Not set</option>
          <optgroup label="Most spoken in the United States">
            {grouped.us.map((l) => (
              <option key={l.code} value={l.code}>
                {l.endonym === l.english ? l.endonym : `${l.endonym} — ${l.english}`}
              </option>
            ))}
          </optgroup>
          <optgroup label="Also published in these">
            {grouped.subject.map((l) => (
              <option key={l.code} value={l.code}>
                {`${l.endonym} — ${l.english}`}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {chosen && chosen.note.length > 0 ? (
        <div className="rounded-xl border border-border bg-background/55 p-3.5">
          {/*
            `lang` and `dir` on the note itself, not on the page. This really is
            text in that language, so marking it is correct here and lets a
            screen reader switch pronunciation (WCAG 2.1 §3.1.2, Language of
            Parts). Without `dir`, the Arabic note renders with its punctuation
            in the wrong place.
          */}
          <div
            lang={chosen.code}
            dir={chosen.rtl ? "rtl" : undefined}
            className={cn(
              "measure space-y-1.5 text-[0.875rem] leading-relaxed text-foreground",
              chosen.rtl && "text-right",
            )}
          >
            {chosen.note.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
            {!mounted
              ? " "
              : voiceReady
                ? `Read aloud can use a ${chosen.english} voice on this device.`
                : `No ${chosen.english} voice is installed on this device, so read aloud ` +
                  "will not speak the translation until you add one in your system settings."}
          </p>
        </div>
      ) : null}

      {chosen && chosen.code === "en" ? (
        <p className="measure text-xs text-muted-foreground">
          The app is written in English, so nothing needs translating.
        </p>
      ) : null}
    </div>
  );
}
