/**
 * Keeps the app working while the browser translates the page.
 *
 * ## The failure this prevents
 *
 * Translating the page is how this app supports other languages (see
 * `languages.ts`), so a page that breaks when translated has no language
 * support at all. Chrome's and Edge's translators replace each text node with
 * `<font><font>translated</font></font>`. React still holds the original text
 * node, so the next time it removes or moves that node it calls
 * `removeChild`/`insertBefore` on a node that is no longer where it left it,
 * the DOM throws `NotFoundError`, and the route's error boundary replaces the
 * page. Measured before this guard: answering a question in a practice session
 * on a translated page crashed the session.
 *
 * ## What the guard does
 *
 * It narrows exactly those two methods, and only for the case the DOM would
 * otherwise throw on:
 *
 *  - `removeChild(child)` where `child` is not a child: if a translator wrapper
 *    of it is, remove the wrapper (React wanted that content gone); otherwise
 *    the node is already gone, so do nothing instead of throwing.
 *  - `insertBefore(node, ref)` where `ref` is not a child: insert before the
 *    translator wrapper that holds `ref`, or append if there is none — instead
 *    of throwing, and without dropping the inserted content.
 *
 * Every call the DOM would have accepted goes through untouched, so pages that
 * are not translated behave exactly as before. This is the widely used
 * workaround for facebook/react#11538, which React has not fixed upstream.
 *
 * It is serialized into an inline script (`TRANSLATION_GUARD_SCRIPT`) so it is
 * installed before React hydrates, and exported as a function for tests.
 */

/*
 * Plain ES2015 source, kept as text on purpose: serializing a compiled
 * function with `toString()` can carry bundler helpers (esbuild's `__name`)
 * that do not exist in the browser, and the inline script would then throw on
 * every page. The same text is turned into a function for the tests, so what
 * is tested is byte-for-byte what ships.
 */
const GUARD_BODY = `
  if (!proto || proto.__translationGuard) return;
  proto.__translationGuard = true;
  function childOf(parent, node) {
    var cur = node;
    while (cur && cur.parentNode !== parent) cur = cur.parentNode;
    return cur;
  }
  var removeChild = proto.removeChild;
  proto.removeChild = function (child) {
    if (child && child.parentNode === this) return removeChild.call(this, child);
    var holder = childOf(this, child);
    if (holder) removeChild.call(this, holder);
    return child;
  };
  var insertBefore = proto.insertBefore;
  proto.insertBefore = function (node, ref) {
    if (!ref || ref.parentNode === this) return insertBefore.call(this, node, ref);
    return insertBefore.call(this, node, childOf(this, ref));
  };
`;

/** Installs the guard on a Node-like prototype. Exported for tests. */
export function installTranslationGuard(proto: object): void {
  // Built on call, not at import, so nothing evaluates code merely by
  // importing this module.
  (new Function("proto", GUARD_BODY) as (p: object) => void)(proto);
}

/** Installs the guard on the real DOM, before any app code runs. */
export const TRANSLATION_GUARD_SCRIPT = `(function(proto){${GUARD_BODY}})(typeof Node === "function" ? Node.prototype : null);`;
