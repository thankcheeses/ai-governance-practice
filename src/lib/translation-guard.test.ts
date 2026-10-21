import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { TRANSLATION_GUARD_SCRIPT, installTranslationGuard } from "./translation-guard";

/**
 * A minimal DOM: just enough tree to reproduce what a page translator does to
 * React's text nodes, with the real DOM's strictness — removing or inserting
 * relative to a node that is not a child throws.
 */
class FakeNode {
  parentNode: FakeNode | null = null;
  childNodes: FakeNode[] = [];
  constructor(readonly name: string) {}
  appendChild(n: FakeNode): FakeNode {
    return proto.insertBefore.call(this, n, null);
  }
}
const proto = FakeNode.prototype as unknown as {
  removeChild(this: FakeNode, c: FakeNode): FakeNode;
  insertBefore(this: FakeNode, n: FakeNode, r: FakeNode | null): FakeNode;
};
proto.removeChild = function (c) {
  const i = this.childNodes.indexOf(c);
  if (i < 0) throw new Error("NotFoundError: not a child");
  this.childNodes.splice(i, 1);
  c.parentNode = null;
  return c;
};
proto.insertBefore = function (n, r) {
  if (n.parentNode) proto.removeChild.call(n.parentNode, n);
  const i = r === null ? this.childNodes.length : this.childNodes.indexOf(r);
  if (i < 0) throw new Error("NotFoundError: ref not a child");
  this.childNodes.splice(i, 0, n);
  n.parentNode = this;
  return n;
};

/** Chrome's translator: the original text node is detached and a wrapper takes its place. */
function translateReplace(parent: FakeNode, text: FakeNode): FakeNode {
  const outer = new FakeNode("font");
  outer.appendChild(new FakeNode(`translated ${text.name}`));
  proto.insertBefore.call(parent, outer, text);
  proto.removeChild.call(parent, text);
  return outer;
}

/** Translators that keep the original: it is moved inside a <font> wrapper. */
function translateWrap(parent: FakeNode, text: FakeNode): FakeNode {
  const outer = new FakeNode("font");
  proto.insertBefore.call(parent, outer, text);
  outer.appendChild(text);
  return outer;
}

function page() {
  const div = new FakeNode("div");
  const a = new FakeNode("text-a");
  const b = new FakeNode("text-b");
  div.appendChild(a);
  div.appendChild(b);
  return { div, a, b };
}

test("without the guard, a translated page throws exactly as React reports it", () => {
  const { div, a } = page();
  translateReplace(div, a);
  assert.throws(() => proto.removeChild.call(div, a), /NotFoundError/);
  const w = page();
  translateWrap(w.div, w.a);
  assert.throws(() => proto.removeChild.call(w.div, w.a), /NotFoundError/);
});

test("with the guard: removing a wrapped node removes its wrapper instead of throwing", () => {
  installTranslationGuard(FakeNode.prototype);
  const { div, a, b } = page();
  translateWrap(div, a);
  assert.doesNotThrow(() => proto.removeChild.call(div, a));
  assert.deepEqual(div.childNodes, [b], "the content React removed is gone");
});

test("with the guard: removing a node the translator detached does not throw", () => {
  const { div, a } = page();
  translateReplace(div, a);
  assert.doesNotThrow(() => proto.removeChild.call(div, a));
});

test("with the guard: inserting before a wrapped node lands in the right place", () => {
  const { div, a, b } = page();
  const wrapper = translateWrap(div, b);
  const added = new FakeNode("new");
  assert.doesNotThrow(() => proto.insertBefore.call(div, added, b));
  assert.deepEqual(div.childNodes, [a, added, wrapper]);
});

test("with the guard: inserting before a detached node keeps the content rather than throwing", () => {
  const { div, b } = page();
  translateReplace(div, b);
  const added = new FakeNode("new");
  assert.doesNotThrow(() => proto.insertBefore.call(div, added, b));
  assert.ok(div.childNodes.includes(added), "the inserted content is not dropped");
});

test("with the guard: a node already gone is a no-op, and normal calls are unchanged", () => {
  const { div, a, b } = page();
  const stray = new FakeNode("stray");
  assert.doesNotThrow(() => proto.removeChild.call(div, stray));
  assert.deepEqual(div.childNodes, [a, b]);
  proto.removeChild.call(div, a);
  assert.deepEqual(div.childNodes, [b]);
});

test("the shipped inline script is plain browser code and is in the layout", () => {
  // No bundler helpers (esbuild's __name and friends) that would throw in a browser.
  assert.ok(!/__name|__defProp|require\(/.test(TRANSLATION_GUARD_SCRIPT));
  assert.doesNotThrow(() => new Function(TRANSLATION_GUARD_SCRIPT));
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /__html: TRANSLATION_GUARD_SCRIPT/);
});
