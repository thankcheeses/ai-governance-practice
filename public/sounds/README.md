# Sound cues

Audio cues live here. Both current files were supplied by the owner and are
committed exactly as supplied — not re-encoded, not substituted, not
synthesised.

## What is expected here

| File | Cue | Plays when |
| --- | --- | --- |
| `begin.mp3` | `begin` | A fresh practice, review or exam sitting opens. Not on a resume part-way through. |
| `flawless-victory.mp3` | `flawless` | A sitting ends with every question answered and every one correct, at any length. |

Both are MPEG layer III, 64 kbps, 44.1 kHz mono — about 1.3s and 1.9s, 26 KB
for the pair.

The filenames are not free-form: `CUES` in `src/lib/sound.ts` maps each cue name
to exactly one filename, and `sound.test.ts` asserts the shape. Add a cue there
and here together.

## Adding another cue

1. Put the file here with a plain lowercase-and-hyphens name.
2. Add it to `CUES` in `src/lib/sound.ts`; `sound.test.ts` asserts the filename
   shape, and a cue named before its audio exists is safe because a missing
   file resolves to silence.
3. Call `useCueOnce("<name>", <condition>)` where it should fire.

Keep cues short (under about two seconds) and quiet. They play on a study
screen, not in a game.

## Playback behaviour

- **Off by default.** Sound plays only after a learner turns it on in Settings.
  The preference lives in `localStorage` under `aigp.sound.enabled` and is
  per-device.
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
