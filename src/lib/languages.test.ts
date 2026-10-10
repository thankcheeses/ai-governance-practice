import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LANGUAGES,
  LANGUAGE_KEY,
  getLanguage,
  hasVoiceFor,
  languageFor,
  setLanguage,
} from "./languages";

/**
 * The catalogue is hand-authored data, and the failure modes are the quiet
 * ones: a language offered with no note behind it, a note left in English, a
 * right-to-left script not flagged. None of those throw — they just present a
 * learner with something useless, in the one place the app is trying to tell
 * them they were expected.
 */

test("English is first and is the only entry with no note", () => {
  assert.equal(LANGUAGES[0]?.code, "en");
  const noteless = LANGUAGES.filter((l) => l.note.length === 0).map((l) => l.code);
  assert.deepEqual(
    noteless,
    ["en"],
    "a language is offered with no note, so choosing it would show an empty panel",
  );
});

test("every non-English language carries all three sentences", () => {
  for (const lang of LANGUAGES.filter((l) => l.code !== "en")) {
    assert.equal(
      lang.note.length,
      3,
      `${lang.english} has ${lang.note.length} note lines, expected 3 ` +
        "(what is in English, how to translate, what read-aloud does)",
    );
    for (const line of lang.note) {
      assert.ok(line.trim().length > 0, `${lang.english} has an empty note line`);
    }
  }
});

test("no note was left in English", () => {
  /*
    The whole point of the note is that it is readable by someone who does not
    read English. A forgotten entry would be invisible in review — it looks like
    a perfectly good sentence — so this checks for the English words that would
    have to appear in a copy-pasted placeholder.
  */
  const tells = [/\bbrowser\b/i, /\bEnglish\b/i, /\bread aloud\b/i, /\btranslate\b/i];
  for (const lang of LANGUAGES.filter((l) => l.code !== "en")) {
    const joined = lang.note.join(" ");
    for (const tell of tells) {
      // Latin-script languages legitimately share loanwords: Tagalog really
      // does say "browser" and "read aloud". Only flag a line that is mostly
      // English, not one that borrows a word.
      if (tell.test(joined) && !["tl", "ht"].includes(lang.code)) {
        assert.fail(
          `${lang.english}'s note contains the English word matching ${tell} — ` +
            "it looks like an untranslated placeholder",
        );
      }
    }
  }
});

test("codes are unique, lowercase-rooted BCP 47 tags", () => {
  const seen = new Set<string>();
  for (const lang of LANGUAGES) {
    assert.ok(!seen.has(lang.code), `duplicate language code ${lang.code}`);
    seen.add(lang.code);
    assert.match(
      lang.code,
      /^[a-z]{2,3}(-[A-Za-z]{4})?(-[A-Z]{2})?$/,
      `${lang.code} is not a well-formed BCP 47 tag, so voice matching would fail`,
    );
  }
});

test("every language names itself in its own script and in English", () => {
  for (const lang of LANGUAGES) {
    assert.ok(lang.endonym.trim().length > 0, `${lang.code} has no endonym`);
    assert.ok(lang.english.trim().length > 0, `${lang.code} has no English name`);
  }
});

test("Arabic is the right-to-left entry, and nothing else is", () => {
  // A missing `rtl` renders the note with its punctuation in the wrong place;
  // a spurious one right-aligns text that should not be.
  const rtl = LANGUAGES.filter((l) => l.rtl).map((l) => l.code);
  assert.deepEqual(rtl, ["ar"]);
});

test("both groups are populated", () => {
  // An empty group renders an <optgroup> with no options inside it.
  for (const group of ["us", "subject"] as const) {
    assert.ok(
      LANGUAGES.some((l) => l.group === group),
      `the "${group}" group is empty but still gets a heading in the picker`,
    );
  }
});

test("Spanish is offered, and ahead of the subject-matter languages", () => {
  // Not a style preference: it is by a wide margin the most spoken language
  // other than English in the US, which is the ordering this list claims.
  const es = LANGUAGES.findIndex((l) => l.code === "es");
  const firstSubject = LANGUAGES.findIndex((l) => l.group === "subject");
  assert.ok(es > 0, "Spanish is not in the list");
  assert.ok(es < firstSubject, "Spanish is listed after the subject-matter languages");
});

test("languageFor resolves known codes and rejects everything else", () => {
  assert.equal(languageFor("es")?.english, "Spanish");
  for (const bad of [null, undefined, "", "xx", "es-MX", "ES", "../x"]) {
    assert.equal(languageFor(bad), null, `languageFor accepted ${JSON.stringify(bad)}`);
  }
});

test("voice matching is by base language, not by exact tag", () => {
  // Someone who picked `pt` is well served by a pt-BR voice, and telling them
  // they have none because the tags differ would be wrong and discouraging.
  assert.equal(hasVoiceFor("pt", [{ lang: "pt-BR" }]), true);
  assert.equal(hasVoiceFor("es", [{ lang: "es-MX" }, { lang: "en-US" }]), true);
  assert.equal(hasVoiceFor("zh-Hans", [{ lang: "zh-CN" }]), true);
  assert.equal(hasVoiceFor("ko", [{ lang: "en-US" }]), false);
  assert.equal(hasVoiceFor("es", []), false);
});

test("no window means no stored language, and no throw", () => {
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(getLanguage(), null);
  assert.doesNotThrow(() => setLanguage("es"));
});

test("a stored language round-trips, and junk reads as unset", () => {
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  try {
    assert.equal(getLanguage(), null, "unset must not default to a language");

    setLanguage("vi");
    assert.equal(getLanguage(), "vi");

    // Anyone can type into storage; an unknown code must not reach the picker
    // as a selected value it has no option for.
    store.set(LANGUAGE_KEY, "klingon");
    assert.equal(getLanguage(), null);

    setLanguage("ar");
    assert.equal(getLanguage(), "ar");
    setLanguage(null);
    assert.equal(getLanguage(), null, "null must clear the stored language");
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});

test("a storage that throws reads as unset rather than failing", () => {
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem() {
        throw new Error("blocked site data");
      },
      setItem() {
        throw new Error("blocked site data");
      },
      removeItem() {
        throw new Error("blocked site data");
      },
    },
  };
  try {
    assert.equal(getLanguage(), null);
    assert.doesNotThrow(() => setLanguage("fr"));
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});
