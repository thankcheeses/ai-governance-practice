import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { FLORK, florkForScore, type FlorkName } from "./flork";

/**
 * The FLORK assets are third-party artwork that the project owner supplied and
 * authorised on the explicit condition that the *exact* files ship — not
 * redrawn, regenerated, restyled, or substituted.
 *
 * That is a promise about bytes, so it is tested as one. `public/flork/README.md`
 * records a sha256 per file; these assertions read that table and check the
 * committed files still hash to it. Any re-encode — a well-meant webp
 * conversion, an image optimizer run over `public/`, a "just compress the big
 * one" commit — changes the hash and fails here, which is the whole point.
 *
 * Reading the hashes out of the README rather than duplicating them keeps the
 * document that makes the provenance claim and the check that enforces it from
 * drifting apart.
 */

const ROOT = path.join(import.meta.dirname, "..", "..");
const README = path.join(ROOT, "public", "flork", "README.md");

/** `| file.jpg | upload | 736×736 | hash |` → { "file.jpg": "hash" } */
function recordedHashes(): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of readFileSync(README, "utf8").split("\n")) {
    const m = line.match(
      /^\|\s*`([^`]+\.jpg)`\s*\|[^|]*\|[^|]*\|\s*`([0-9a-f]{64})`\s*\|/,
    );
    if (m) out.set(m[1], m[2]);
  }
  return out;
}

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

const names = Object.keys(FLORK) as FlorkName[];

test("all twelve supplied illustrations are catalogued", () => {
  assert.equal(names.length, 12);
});

test("every catalogued file is present and byte-identical to what was supplied", () => {
  const recorded = recordedHashes();
  assert.equal(
    recorded.size,
    12,
    "README provenance table should record a hash for all twelve files",
  );

  for (const name of names) {
    const asset = FLORK[name];
    const file = path.join(ROOT, "public", asset.src);
    const basename = path.basename(asset.src);

    const expected = recorded.get(basename);
    assert.ok(expected, `${basename} has no recorded hash in the README`);

    // Throws ENOENT if the file is missing, which is the failure we want: the
    // component fails silently on a 404, so a missing asset would otherwise
    // look like a deliberately empty design rather than a broken one.
    assert.equal(
      sha256(file),
      expected,
      `${basename} no longer matches the supplied file — it has been re-encoded or replaced`,
    );
  }
});

test("the catalogue points only inside public/flork", () => {
  // A path that escapes the folder would ship an asset whose provenance the
  // README does not cover.
  for (const name of names) {
    assert.match(FLORK[name].src, /^\/flork\/[a-z0-9-]+\.jpg$/, name);
  }
});

test("every illustration has alt text", () => {
  for (const name of names) {
    const { alt } = FLORK[name];
    assert.ok(alt.trim().length > 10, `${name} needs real alt text`);
    // Full stop, or the closing quote of an embedded line the alt is quoting.
    assert.match(alt.trim(), /[."]$/, `${name} alt should read as a sentence`);
  }
});

test("illustrations with words drawn into them repeat those words in alt text", () => {
  // A screen reader cannot read text baked into a JPEG. These two carry a line
  // that is part of the message, so the alt text has to carry it instead.
  assert.match(FLORK.goStudy.alt, /GO STUDY!/);
  assert.match(FLORK.slay.alt, /slaaaaaaay/);
});

test("recorded dimensions match the actual files", () => {
  // Wrong intrinsic dimensions do not fail a build; they silently reserve the
  // wrong box and shift the layout once the image loads.
  for (const name of names) {
    const asset = FLORK[name];
    const buf = readFileSync(path.join(ROOT, "public", asset.src));
    const size = jpegSize(buf);
    assert.deepEqual(
      size,
      { width: asset.width, height: asset.height },
      `${path.basename(asset.src)} is ${size.width}x${size.height}`,
    );
  }
});

/**
 * Intrinsic size from a JPEG's first start-of-frame marker.
 *
 * Written out rather than pulled from a dependency: it is a dozen lines, it
 * runs at test time only, and adding an image library to verify twelve static
 * files would be a poor trade.
 */
function jpegSize(buf: Buffer): { width: number; height: number } {
  assert.equal(buf.readUInt16BE(0), 0xffd8, "not a JPEG");
  let offset = 2;
  while (offset < buf.length) {
    assert.equal(buf[offset], 0xff, "malformed JPEG segment");
    const marker = buf[offset + 1];
    // SOF0..SOF15, excluding the non-frame markers DHT (c4), JPG (c8), DAC (cc).
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  throw new Error("no start-of-frame marker found");
}

test("the score band picks a different illustration at each tier", () => {
  // Only the lowest band is reachable by playing a session in a browser, so the
  // boundaries are pinned here instead.
  assert.equal(florkForScore(100), "slay");
  assert.equal(florkForScore(85), "slay");
  assert.equal(florkForScore(84), "thumbsUp");
  assert.equal(florkForScore(70), "thumbsUp");
  assert.equal(florkForScore(69), "okSign");
  assert.equal(florkForScore(50), "okSign");
  assert.equal(florkForScore(49), "reading");
  assert.equal(florkForScore(0), "reading");
});

test("a bad score is never met with a mocking illustration", () => {
  // The point of the low band. `confused` and `unimpressed` are fine on an
  // empty state; on a result they would be a joke at the learner's expense.
  for (let pct = 0; pct < 50; pct++) {
    assert.equal(florkForScore(pct), "reading", `${pct}% should stay encouraging`);
  }
});

test("every band names a catalogued illustration", () => {
  for (let pct = 0; pct <= 100; pct++) {
    assert.ok(FLORK[florkForScore(pct)], `${pct}% maps outside the catalogue`);
  }
});
