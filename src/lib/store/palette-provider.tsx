"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_PALETTE,
  isPaletteId,
  PALETTE_KEY,
  PALETTES,
  type Palette,
  type PaletteId,
} from "@/lib/palette";

interface PaletteContextValue {
  palette: PaletteId;
  /** The active palette's metadata, for labelling the current choice. */
  active: Palette;
  setPalette: (next: PaletteId) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

/**
 * Applied via a `data-palette` attribute on <html>, the same shape as the
 * theme. The inline script in the root layout sets the attribute before first
 * paint, so this provider only handles changes made after hydration.
 *
 * Palette and theme are deliberately independent: the palette picks the hues,
 * the theme picks light or dark, and every palette defines both. Folding them
 * into one preference would make six choices out of two, and most of them are
 * not things anyone wants to pick.
 */
export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PALETTE_KEY);
      if (isPaletteId(stored)) setPaletteState(stored);
    } catch {
      // Private mode — the default palette, and no way to remember otherwise.
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
  }, [palette]);

  const setPalette = useCallback((next: PaletteId) => {
    setPaletteState(next);
    try {
      window.localStorage.setItem(PALETTE_KEY, next);
    } catch {
      // Applied for this visit; reverts to the default on the next one.
    }
  }, []);

  const value = useMemo(
    () => ({ palette, active: PALETTES[palette], setPalette }),
    [palette, setPalette],
  );

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used within a PaletteProvider");
  return ctx;
}
