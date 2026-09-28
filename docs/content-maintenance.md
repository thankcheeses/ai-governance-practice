# Per-item content maintenance

`docs/bok-maintenance.md` covers one claim about the *whole bank*: that it was
checked against a named Body of Knowledge at a named version on a named date.
That claim is real, and it is also coarse. It says nothing about any individual
question.

This document covers the other half: the freshness of a **single item**.

---

## The problem this fixes

Before this existed, the bank had no per-item freshness signal at all.

`createdDate` and `updatedDate` look like per-item fields and are not. They are
two module-level constants in
`src/content/tracks/aigp-preparation/index.ts`, applied identically to all 296
questions:

```ts
const CREATED_DATE = "2025-01-01T00:00:00.000Z";
const UPDATED_DATE = "2025-01-01T00:00:00.000Z";
```

That is a statement about when the content was authored, which is what it was
meant to be. It is no use whatever for the question that actually matters:

> When did a human last read *this item* against the law it cites?

There was no way to answer that, for any question, which means there was no way
to run a maintenance system — only a way to say one existed.

## The shape

One optional block on a `QuestionEnrichment` entry. Absent means nobody has
reviewed the item, which is normalised to `DEFAULT_MAINTENANCE` at load so the
app can count it rather than treating it as a gap.

```ts
maintenance?: {
  lastReviewed: string | null;      // ISO yyyy-mm-dd. null means never.
  reviewStatus:   "unreviewed" | "current" | "needs-review";
  rationaleStatus:"unreviewed" | "sufficient" | "thin";
  freshness:      "unreviewed" | "stable" | "watch" | "stale";
  jurisdictions:  Jurisdiction[];   // [] until classified; "neutral" is a value
  note?: string;
}
```

Sources gained two optional fields on the same principle — a bare string stays
valid, because 296 entries are authored that way:

```ts
sources?: (string | { cite: string; url?: string; sourceDate?: string })[]
```

`url` is what the learner follows from **Check it against**; it renders as a
link when present and as plain text when not. `sourceDate` is the date of the
*instrument*, not the date we read it.

### Why each status exists

| Field | Answers |
| --- | --- |
| `lastReviewed` | When did a human last read this against its sources? |
| `reviewStatus` | What did they conclude — is it fit to serve as-is? |
| `rationaleStatus` | Does the rationale actually justify the key, or is it thin? |
| `freshness` | How exposed is the cited material to regulatory movement? |
| `jurisdictions` | Whose obligations does this item turn on? |

`freshness: "watch"` is the useful one in practice. It marks an item whose
citation is to an instrument with phased or pending obligations — the EU AI Act
being the obvious case — so a future revision has a list to work from rather
than a re-read of the whole bank.

`jurisdictions: []` and `jurisdictions: ["neutral"]` mean different things on
purpose. The first is "not yet classified"; the second is "deliberately
jurisdiction-neutral", which most of this bank genuinely is.

## What the gate enforces

`npm run check:content` fails on each of these. All five were verified by
injecting the violation and watching the gate reject it:

1. `reviewStatus` other than `unreviewed` with no `lastReviewed` date.
2. `lastReviewed` set while `reviewStatus` is still `unreviewed`.
3. `lastReviewed` in the future.
4. `freshness: "stale"` without `reviewStatus: "needs-review"`.
5. A jurisdiction outside the controlled vocabulary.

Rule 1 is the one that matters most. **A claim of currency with no date is
unfalsifiable**, and an unfalsifiable maintenance claim is exactly what this
project exists not to make. The rest follow from it.

The gate also reports coverage on every run:

```
reviewed: 0/296  needs-review: 0  citing a URL: 0
```

## Why the backfill is zero

Every one of the 296 items is `unreviewed`, and that is deliberate.

Stamping today's date across the bank would have replaced a visible
placeholder with an invisible false claim — it would say 296 items had been
reviewed on a day when none had. That is strictly worse than the stub, because
the stub is obviously a stub and a date is not.

So the counter starts at zero and is meant to be watched going up. A bank where
40 of 296 items carry a genuine review date is more trustworthy than one where
all 296 carry a fabricated one, and it is honest about the other 256.

## Reviewing an item

1. Read the question, its options, its rationale and its distractor notes.
2. Check each citation against the actual instrument. Record a `url` if a
   stable public one exists — **do not record a URL you have not opened.**
3. Set `lastReviewed` to today, and the three statuses to what you found.
4. Classify `jurisdictions`.
5. Run `npm run check:content`.

If the review finds a problem, the item gets `reviewStatus: "needs-review"` and
a `note`, and the content itself is fixed in a separate change. Recording the
finding and fixing the content are two different actions and should not be one
commit — the record is what makes the fix reviewable.
