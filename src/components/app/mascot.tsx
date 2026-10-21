"use client";

import Image from "next/image";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/**
 * The study coach: the product owner's own illustrated character, used as the
 * face of the flashcards. Two expressions — thinking while you recall, smiling
 * once the answer is up — and two scenes for the deck's bookends.
 *
 * Decorative by contract: the words beside her carry the meaning, so every
 * image here is `alt=""` and a failed load simply leaves the words.
 */

export type MascotMood = "think" | "smile";

const PORTRAIT: Record<MascotMood, string> = {
  think: "/mascot/mascot-think.webp",
  smile: "/mascot/mascot-smile.webp",
};

export function MascotAvatar({
  mood,
  className,
}: {
  mood: MascotMood;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full bg-[#2b2b2e] ring-2 ring-card shadow-[var(--shadow-card)]",
        className ?? "h-14 w-14",
      )}
    >
      <Image
        src={withBasePath(PORTRAIT[mood])}
        alt=""
        fill
        sizes="80px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/** The coach with something to say: avatar plus a speech bubble. */
export function MascotTip({
  mood,
  children,
  className,
}: {
  mood: MascotMood;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <MascotAvatar mood={mood} className="h-16 w-16 sm:h-20 sm:w-20" />
      <p
        className={cn(
          "relative mb-1 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5",
          "text-[0.8125rem] leading-snug text-foreground shadow-[var(--shadow-card)]",
        )}
      >
        {children}
      </p>
    </div>
  );
}

export function MascotScene({
  scene,
  className,
}: {
  scene: "desk" | "gate";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <span
      aria-hidden
      className={cn("relative block aspect-[16/9] w-full overflow-hidden rounded-xl", className)}
    >
      <Image
        src={withBasePath(`/mascot/mascot-${scene}.webp`)}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 720px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
