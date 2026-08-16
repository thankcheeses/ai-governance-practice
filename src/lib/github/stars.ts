/**
 * Starring the project's repository from inside the app.
 *
 * ## Why this is not Supabase Auth
 *
 * Supabase can broker GitHub OAuth in one call, but `signInWithOAuth` replaces
 * the current session. A learner signed in with email and password would be
 * signed out of the account holding their progress and into a separate GitHub
 * identity. Starring a repository must not be able to cost someone their study
 * history, so GitHub auth here is entirely separate: its token is obtained
 * through the `github-oauth` Edge Function and used only against
 * api.github.com. The progress session is never touched.
 *
 * ## The scope, stated plainly
 *
 * GitHub has no "starring" scope. `PUT /user/starred/{owner}/{repo}` needs
 * `public_repo`, which also grants write access to all of the user's public
 * repositories. That is a broad grant for one button, the consent screen will
 * say so, and some people will reasonably decline. The button is therefore
 * optional, never blocks anything, and the app works identically without it.
 *
 * ## Token handling
 *
 * The token lives in `sessionStorage`, not `localStorage`: it is gone when the
 * tab closes, which keeps a `public_repo` credential from sitting on disk
 * indefinitely for a feature used once. It is never sent anywhere except
 * api.github.com, and never logged.
 */

/** The repository the button stars. Not rendered as a URL anywhere in the UI. */
export const STAR_REPO = { owner: "thankcheeses", repo: "ai-governance-practice" } as const;

/** Minimum scope GitHub accepts for starring. There is no narrower one. */
export const REQUIRED_SCOPE = "public_repo";

const TOKEN_KEY = "nhid-clinical:github-token";
const RETURN_KEY = "nhid-clinical:github-return";
const STATE_KEY = "nhid-clinical:github-state";

/* ------------------------------------------------------------ config ----- */

export function githubClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  return id && id.trim() ? id.trim() : null;
}

export function githubOAuthEndpoint(): string | null {
  const url = process.env.NEXT_PUBLIC_GITHUB_OAUTH_ENDPOINT;
  return url && url.trim() ? url.trim() : null;
}

/**
 * Both halves are needed. Reporting "configured" with only one produces a
 * button that always fails at a step the user cannot see.
 */
export function isStarConfigured(): boolean {
  return githubClientId() !== null && githubOAuthEndpoint() !== null;
}

/* ------------------------------------------------------------- token ----- */

export function readToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* Private mode and blocked storage are survivable: the star just will not
       persist across a reload, which is better than throwing. */
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/* --------------------------------------------------------- authorize ----- */

/**
 * Build the consent URL.
 *
 * `state` is generated, stored, and checked on the way back. Without it a
 * third party could hand the callback a code of their choosing and bind the
 * user's app session to an account they control — the standard CSRF on OAuth
 * redirects.
 */
export function beginAuthorize(returnTo: string, redirectUri: string): string | null {
  const clientId = githubClientId();
  if (!clientId) return null;

  const state = randomState();
  try {
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(RETURN_KEY, returnTo);
  } catch {
    /* Storage blocked: the state check below will fail closed. */
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: REQUIRED_SCOPE,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/** True only if the returned state matches the one issued. Fails closed. */
export function consumeState(returned: string | null): boolean {
  let expected: string | null = null;
  try {
    expected = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
  } catch {
    return false;
  }
  return Boolean(expected) && expected === returned;
}

export function consumeReturnTo(): string {
  try {
    const to = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    // Only same-app paths. An absolute URL here would be an open redirect.
    if (to && to.startsWith("/") && !to.startsWith("//")) return to;
  } catch {
    /* fall through */
  }
  return "/settings";
}

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------ exchange --- */

export interface ExchangeDeps {
  fetch?: typeof fetch;
  endpoint?: string | null;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  deps: ExchangeDeps = {},
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const endpoint = deps.endpoint === undefined ? githubOAuthEndpoint() : deps.endpoint;
  if (!endpoint) return { ok: false, message: "GitHub sign-in is not configured." };

  const doFetch = deps.fetch ?? (typeof fetch !== "undefined" ? fetch : null);
  if (!doFetch) return { ok: false, message: "Sending is unavailable here." };

  try {
    const response = await doFetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.access_token) {
      return { ok: false, message: "Could not complete GitHub sign-in. Try again." };
    }
    return { ok: true, token: payload.access_token as string };
  } catch {
    return { ok: false, message: "Could not reach GitHub. Check your connection." };
  }
}

/* --------------------------------------------------------------- API ----- */

export interface GitHubDeps {
  fetch?: typeof fetch;
}

const API = "https://api.github.com";
const ACCEPT = { Accept: "application/vnd.github+json" };

export type StarState = "starred" | "unstarred" | "unauthenticated" | "error";

/**
 * GitHub answers 204 when the repository is starred and 404 when it is not, so
 * a 404 here is a normal answer rather than a failure. A 401 means the token
 * has been revoked, which is reported as unauthenticated so the UI returns to
 * offering sign-in rather than showing a dead error.
 */
export async function checkStarred(
  token: string,
  deps: GitHubDeps = {},
): Promise<StarState> {
  const doFetch = deps.fetch ?? fetch;
  try {
    const res = await doFetch(
      `${API}/user/starred/${STAR_REPO.owner}/${STAR_REPO.repo}`,
      { headers: { ...ACCEPT, Authorization: `Bearer ${token}` } },
    );
    if (res.status === 204) return "starred";
    if (res.status === 404) return "unstarred";
    if (res.status === 401) return "unauthenticated";
    return "error";
  } catch {
    return "error";
  }
}

export async function setStarred(
  token: string,
  starred: boolean,
  deps: GitHubDeps = {},
): Promise<StarState> {
  const doFetch = deps.fetch ?? fetch;
  try {
    const res = await doFetch(
      `${API}/user/starred/${STAR_REPO.owner}/${STAR_REPO.repo}`,
      {
        method: starred ? "PUT" : "DELETE",
        headers: { ...ACCEPT, Authorization: `Bearer ${token}`, "Content-Length": "0" },
      },
    );
    if (res.status === 204) return starred ? "starred" : "unstarred";
    if (res.status === 401) return "unauthenticated";
    // 403 is the scope being declined or insufficient — the user consented
    // without `public_repo`, or the grant was narrowed afterwards.
    return "error";
  } catch {
    return "error";
  }
}
