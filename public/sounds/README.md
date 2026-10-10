# Sound cues

Audio cues live here. Every file came from the owner — nothing was
synthesized, substituted or re-encoded, and no cue is fetched from a
third-party host, so the audio a learner hears is the audio this repository
ships. One file, `yay.mp3`, was shortened; exactly what came off it is recorded
below. The other five are byte-for-byte as supplied.

## What is expected here

| File | Cue | Plays when |
| --- | --- | --- |
| `begin.mp3` | `begin` | A fresh practice, review or exam sitting opens. Not on a resume part-way through. |
| `flawless-victory.mp3` | `flawless` | A sitting ends with every question answered and every one correct, at any length. |
| `answer-correct.mp3` | `correct` | An answer is graded right, in practice or review. |
| `answer-wrong.mp3` | `wrong` | An answer is graded wrong, in practice or review. |
| `oof.mp3` | `oof` | A sitting lands on the `insufficient` verdict — grade D or F with enough answered for that to mean something. |
| `yay.mp3` | `yay` | A sitting lands on the `encouraging` verdict — grade A across a substantial or broader share of the bank. |

Measured, not assumed — and the two stereo files are a different encode from
the four mono ones, so the figures are per file rather than a blanket claim:

| File | Bytes | Format | Length |
| --- | --- | --- | --- |
| `answer-correct.mp3` | 5,476 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 0.65s |
| `answer-wrong.mp3` | 5,685 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 0.68s |
| `begin.mp3` | 10,283 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 1.25s |
| `flawless-victory.mp3` | 15,507 | MPEG-1 layer III, 64 kbps, 44.1 kHz mono | 1.91s |
| `oof.mp3` | 16,971 | MPEG-1 layer III, 128 kbps, 44.1 kHz joint stereo | 1.04s |
| `yay.mp3` | 69,008 | MPEG-1 layer III, 128 kbps, 44.1 kHz joint stereo | 4.31s |

Lengths count audio frames only. Each file except `yay.mp3` also carries a
leading LAME `Info` metadata frame, which decodes to about 26ms of silence; an
earlier version of this table read *that* frame's header and so reported the
two stereo files as 64 kbps, which was wrong.

## What was cut from `yay.mp3`

As supplied it ran **8.15s / 131,074 bytes**, and **the last 3.5s of that were
digital silence** — exact zeros, not a quiet tail. Decoded to PCM, the cheer
begins at 0.10s, peaks through 3.0s, decays to inaudible by 4.15s, and from
4.65s to the end every sample is zero.

It now ends at 4.31s, which keeps the whole cheer and its natural decay and
drops only the silence. The cut is a truncation at an MP3 frame boundary, not a
re-encode: the retained frames are copied byte-for-byte. Verified by decoding
both files and comparing — **188,975 overlapping samples, 100% bit-exact, max
difference 0.0**. The file lost 47% of its bytes and none of its audio.

The leading `Info` frame was dropped with it, because a truncation invalidates
the frame count, byte count and CRC it carries, and dropping it is cleaner than
rewriting three fields and leaving a stale checksum. These are constant-bitrate
files, so duration stays exactly computable without it.

For provenance, the file as supplied was sha256
`3029aafb117205e93b3a59b57a167b79ab0e58a062e6dd97170893fb7e97eb0b`; what is
committed here is sha256
`32525ffef41501a1d2132865c8dda11cb2220f0ec537d2ef16f4902d3ec2782e`.

At 4.31s it is still longer than the guidance below. That is the length of the
clip itself, and cutting into the cheer would be a judgment about the audio
rather than the removal of nothing, so it was left whole.

`correct` and `wrong` are the only cues that fire more than once a sitting, so
they are played straight from the handler that grades the answer rather than
through `useCueOnce`, whose contract is once per mount. Exam mode never plays
them: it withholds per-question feedback by design, and a sound that announced
the result would defeat that.

The filenames are not free-form: `CUES` in `src/lib/sound.ts` maps each cue name
to exactly one filename, and `sound.test.ts` asserts the shape. Add a cue there
and here together.

## Silence is a cue too

Only two verdicts make a sound: `insufficient` (the sitting failed) and
`encouraging` (the strongest verdict the readiness model gives). The four in
between are deliberately silent.

They used to share one "keep going" noise, hotlinked from `myinstants.com`. Two
problems, and removing the cue fixed both. Most results land in that middle
band, so a sound covering four of six verdicts fired on nearly every result a
learner ever saw — which is exactly when a cue stops marking anything and just
becomes the noise the app makes. And it was the only cue whose bytes were not
this repository's: it needed a third-party host to stay up and serve the same
audio, with no license recorded either way. `sound.test.ts` now fails if any
cue points at a URL.

The banner still says something encouraging in text on every verdict. Only the
audio is reserved for the two ends.

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
