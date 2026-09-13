# Inspecting PDFs in this environment

Source documents arrive as PDFs — the AIGP Body of Knowledge, the certification
handbook. Verifying a number against one is a governance act for this project:
the blueprint figures in `src/content/bok.ts` are a factual claim about somebody
else's published document, and a claim nobody can check is decoration.

A fresh container has none of the tooling for that. This records what to install
and how to confirm it works, because the failure mode is not "no output" — it is
**plausible but wrong output**, which is far more dangerous than an error.

## What to install

```sh
apt-get update && apt-get install -y poppler-utils tesseract-ocr
pip install pymupdf pillow
```

`apt-get update` first is not optional. Without it `apt-get install` fails with a
404 on a stale index, which reads like the package being unavailable rather than
the index being old — that misdiagnosis is what made an earlier attempt conclude
the environment was locked down when it was not.

| Tool | Provides |
| --- | --- |
| `pdftotext -layout` | text with column structure preserved |
| `pdftoppm -png` | page rendering, for reading a page as a human would |
| `pdfimages` | embedded image extraction |
| `pymupdf` | structured access — per-page text, fonts, image lists |
| `tesseract` | OCR, for pages that carry no text layer |
| `pillow` | image dimensions and format, for asset checks |

## Verify before relying on it

Extraction can succeed and still be wrong. Two failure modes have already
occurred in this project:

**Fonts without a usable ToUnicode map.** Text comes out as plausible letters
that are not the letters on the page. `IAPP CERTIFICATION` decoded as
`NfAmm CboqfcfCAqflk` — recognisably structured, completely wrong. A decoder
that merges every font's map and applies them indiscriminately produces exactly
this.

**Pages with no text layer at all.** `IAPPCert.pdf` is a single page holding two
images and zero text-showing operators. Any "extraction" from it is either empty
or invented.

So the rule is: **render the page and read it before trusting the text.**

```sh
# 1. extract
pdftotext -layout -f 4 -l 4 source.pdf -

# 2. render the same page and look at it
pdftoppm -png -r 150 -f 4 -l 4 source.pdf /tmp/page

# 3. if the page has no text layer, OCR it — and treat the result as a lead,
#    never as a citation
tesseract /tmp/page-04.png - --psm 6
```

OCR output is not evidence for a number that will be published. It is a pointer
to which page to read.

## Smoke test

`npm run check:pdf-tooling` exits non-zero when any capability is missing, and
prints what it found. It checks the tools resolve *and* that each produces
output on a generated one-page PDF, because a binary that exists and fails is
the same problem as one that is absent.

## What is not installable here

Nothing, as of the last attempt — but two things looked unavailable and were not:

- `pip` timed out once against `files.pythonhosted.org` and was reported as
  "blocked". It was a transient read timeout; a retry succeeded.
- Two third-party apt repositories (`deadsnakes`, `ondrej/php`) return 403
  through the proxy. They are not needed; `apt-get update` warns and continues.

The CDN allowlist does block `cdnjs.cloudflare.com` and `unpkg.com`, so a
browser-side approach such as loading pdf.js is genuinely unavailable. Chromium
is present and renders PDFs, but `pdftoppm` is the simpler route for page images.

## Application behaviour

None of this is application tooling. The app neither reads nor writes PDFs with
these packages — `src/lib/pdf/` writes PDFs from scratch and is unaffected.
These are for inspecting source documents during content and governance work.
