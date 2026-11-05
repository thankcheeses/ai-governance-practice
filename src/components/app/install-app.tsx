"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The install button.
 *
 * ## Why this is two different things wearing one label
 *
 * Installing a web app is not one mechanism. On Chrome and Edge the browser
 * decides the app is installable and fires `beforeinstallprompt`; capturing
 * that event is the only way to put the install behind a button of our own
 * rather than leaving it in a menu nobody opens. On iOS there is no such event
 * and no API at all — Safari's "Add to Home Screen" can only be reached by the
 * user, through the Share menu. So the same button either installs the app or
 * explains where the control is, and which one it does is decided by what the
 * browser actually offers rather than by sniffing its name.
 *
 * iOS is the exception that has to be sniffed, because the absence of an event
 * is indistinguishable from "the event has not fired yet". The check is
 * deliberately narrow: a platform test, used only to decide whether to show
 * instructions, never to gate a feature.
 *
 * ## When it shows nothing
 *
 * Already installed, or running in the Capacitor shell, or a browser that
 * neither fires the event nor is iOS. A button that cannot do anything is
 * worse than no button: the person taps it, nothing happens, and they conclude
 * the app is broken rather than that their browser does not support this.
 */

/** The slice of the non-standard event this uses. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode =
  /** Nothing to offer, or not yet known. Renders nothing. */
  | "none"
  /** The browser gave us a prompt to fire. */
  | "prompt"
  /** iOS: the Share menu is the only route, so say so. */
  | "ios";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS reports the installed state on navigator; everyone else on the media
  // query. Both are checked because neither covers both.
  const iosInstalled =
    "standalone" in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true;
  return (
    iosInstalled || window.matchMedia("(display-mode: standalone)").matches
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  /*
    iPadOS reports itself as a Mac, and has done since iPadOS 13 — the touch
    point count is what separates it from a desktop. Without that second half
    an iPad shows no install affordance at all.
  */
  return (
    /iphone|ipod/i.test(navigator.userAgent) ||
    /ipad/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function InstallApp({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("none");
  const [showHow, setShowHow] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    // The Capacitor build is already an installed app.
    if (process.env.NEXT_PUBLIC_MOBILE_BUILD === "1") return;
    if (isStandalone()) return;

    if (isIos()) setMode("ios");

    const onPrompt = (event: Event) => {
      /*
        Chrome shows its own mini-infobar unless the event is cancelled. We
        cancel it and keep the event, which is the documented way to move the
        install into the page — and the reason this component exists rather
        than a line of copy telling people to use a browser menu.
      */
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setMode("prompt");
    };

    const onInstalled = () => {
      setMode("none");
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    /*
      The event is single-use: Chrome will not hand it to us again for this
      page load. Dropping it on a dismissal as well as an acceptance is what
      stops a second tap doing nothing at all.
    */
    setPrompt(null);
    if (outcome === "accepted") setMode("none");
  }, [prompt]);

  if (mode === "none") return null;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-card", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-serif text-[1.125rem] leading-snug">
          Install the app
        </h2>
        <span className="text-[0.75rem] text-muted-foreground">
          works offline
        </span>
      </div>
      <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-muted-foreground">
        Adds it to your home screen and opens it full screen, without the
        browser bar. Your progress is already stored on this device, so
        installing changes nothing about it.
      </p>

      {mode === "prompt" ? (
        <Button className="mt-4" onClick={install}>
          Install app
        </Button>
      ) : (
        <>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => setShowHow((v) => !v)}
            aria-expanded={showHow}
          >
            {showHow ? "Hide the steps" : "Show me how"}
          </Button>
          {showHow ? (
            /*
              Spelled out rather than gestured at. iOS gives no way to trigger
              this, so the only thing a button here can honestly do is point at
              the two taps — and "use the Share menu" is not enough when the
              icon has no label and sits in a different place in Safari's
              toolbar depending on the device.
            */
            <ol className="measure mt-4 space-y-2 border-t border-border pt-4 text-[0.875rem] leading-relaxed">
              <li className="flex gap-3">
                <span aria-hidden className="font-medium text-muted-foreground">
                  1.
                </span>
                <span>
                  Tap the Share button in Safari — the square with an arrow
                  pointing up, in the toolbar.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="font-medium text-muted-foreground">
                  2.
                </span>
                <span>
                  Scroll down the list and choose{" "}
                  <strong className="font-medium">Add to Home Screen</strong>,
                  then tap Add.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="font-medium text-muted-foreground">
                  3.
                </span>
                <span className="text-muted-foreground">
                  It has to be Safari. Other browsers on iPhone and iPad cannot
                  add an app to the home screen.
                </span>
              </li>
            </ol>
          ) : null}
        </>
      )}
    </div>
  );
}
