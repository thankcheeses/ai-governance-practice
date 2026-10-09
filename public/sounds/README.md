# Sound cues

Audio cues live here. Every file was supplied by the owner and is committed
exactly as supplied — not re-encoded, not substituted, not synthesized.

## What is expected here

| File | Cue | Plays when |
| --- | --- | --- |
| `begin.mp3` | `begin` | A fresh practice, review or exam sitting opens. Not on a resume part-way through. |
| `flawless-victory.mp3` | `flawless` | A sitting ends with every question answered and every one correct, at any length. |
| `answer-correct.mp3` | `correct` | An answer is graded right, in practice or review. |
| `answer-wrong.mp3` | `wrong` | An answer is graded wrong, in practice or review. |
| `oof.mp3` | `oof` | A sitting lands on the `insufficient` verdict — grade D or F with enough answered for that to mean something. |
| `yay.mp3` | `yay` | A sitting lands on the `encouraging` verdict — grade A across a substantial or broader share of the bank. |

Measured, not assumed:

| File | Bytes | Format | Length |
| --- | --- | --- | --- |
| `answer-correct.mp3` | 5,476 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 0.68s |
| `answer-wrong.mp3` | 5,685 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 0.71s |
| `begin.mp3` | 10,283 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 1.28s |
| `flawless-victory.mp3` | 15,507 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 1.93s |
| `oof.mp3` | 16,971 | MPEG-1 layer III, 64 kbps, 44.1 kHz joint stereo | 1.07s |
| `yay.mp3` | 131,074 | MPEG-1 layer III, 64 kbps, 44.1 kHz joint stereo | **8.20s** |

`yay.mp3` is four times the length guidance below and three and a half times the
size of every other cue put together. It is committed anyway, unchanged, because
it is what the owner supplied and the rule here is that supplied audio is not
re-encoded or trimmed to fit a guideline. Recorded rather than quietly fixed: a
shorter cut of the same recording would drop it to roughly 30 KB and stop the
sound outlasting the screen that triggered it.

`correct` and `wrong` are the only cues that fire more than once a sitting, so
they are played straight from the handler that grades the answer rather than
through `useCueOnce`, whose contract is once per mount. Exam mode never plays
them: it withholds per-question feedback by design, and a sound that announced
the result would defeat that.

The filenames are not free-form: `CUES` in `src/lib/sound.ts` maps each cue name
to exactly one filename, and `sound.test.ts` asserts the shape. Add a cue there
and here together.

## Not every cue has a file

`keepGoing` — the cue for the four middle verdicts, and so the one a learner
hears most often — points at `myinstants.com` rather than at a file here. It is
the only cue that does. That means its bytes are not this repository's bytes: it
needs a third-party host to stay up and keep serving the same audio, it is
subject to whatever that host does with hotlinks, and no license is recorded for
it either way. Everything else here was supplied by the owner and is committed
exactly as supplied. Dropping a file in and changing one line in `CUES` fixes
it; `sound.test.ts` asserts that the two result cues above stay local, so this
cannot spread back to them unnoticed.

## Adding another cue

1. Put the file here with a plain lowercase-and-hyphens name.
2. Add it to `CUES` in `src/lib/sound.ts`; `sound.test.ts` asserts the filename
   shape, and a cue named before its audio exists is safe because a missing
   file resolves to silence.
3. Call `useCueOnce("<name>", <condition>)` where it should fire.

Keep cues short (under about two seconds) and quiet. They play on a study
screen, not in a game.

## Playback behavior

- **On by default.** A new install gets the cues without setup. The preference
  lives in `localStorage` under `aigp.sound.enabled` and is per-device; an
  explicit `"0"` turns sound off and nothing overrides it.
- **Gesture-gated.** Browsers refuse audio no user action preceded. Every cue
  fires after a deliberate action (submitting an exam, finishing a session), so
  the gesture exists — but a refusal is caught and ignored either way.
- **Fails silent.** A missing file, a blocked `localStorage`, a refused
  `play()`, or no `Audio` constructor at all all resolve to no sound and no
  error.

## Format

Both export targets set `output: "export"`, so files in `public/` are served
byte-for-byte with no processing. Committed bytes are served bytes; keep the
file small.
