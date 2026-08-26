import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Serif, Inter } from "next/font/google";
import { ServiceWorker } from "@/components/app/service-worker";
import { withBasePath } from "@/lib/base-path";
import { BRAND } from "@/lib/brand";
import { ProgressProvider } from "@/lib/store/progress-provider";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/lib/store/theme-provider";
import "./globals.css";

/*
  Civic Studio typography system.

  Editorial display hierarchy uses serif (IBM Plex Serif, italic, for
  headings and key learning questions). All UI, labels, controls, body copy,
  and data use humanist sans-serif (Inter). Monospace is retained only for
  code/content blocks and as a fallback.
*/
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  // Upright carries the editorial headings; italic is kept for the wordmark,
  // which is a signature rather than interface text.
  style: ["normal", "italic"],
  variable: "--font-plex-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: `${BRAND.category} ${BRAND.positioning}`,
  applicationName: BRAND.name,
  // Next does not apply `basePath` to this field — it emits the string as
  // given, so on a project site a bare "/manifest.webmanifest" 404s and the
  // app silently stops being installable. Prefixed explicitly.
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "black-translucent",
  },
  keywords: [
    "AI governance",
    "governance scenarios",
    "NIST AI RMF",
    "EU AI Act",
    "ISO 42001",
    "responsible AI",
    "professional development",
  ],
  openGraph: {
    title: BRAND.name,
    description: `${BRAND.category} ${BRAND.positioning}`,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#201d1d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${plexSerif.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        {/*
          Sets the theme before first paint so there is no flash of the wrong
          one. Two things about where it sits are load-bearing.

          It is the first child of <body>, not a child of <head>, which is
          where it used to be. React 19 treats <head> as a set of hoistable
          resources and reconciles that set during hydration; a script rendered
          into it takes part in the reconciliation. On a warm reload the
          browser's head no longer matches the one React expects — font
          preloads it has already consumed are gone — and the mismatch surfaced
          as React error #418. Measured on the Pages build, reloading a
          worker-controlled page: 4/10 on /terms/, 5/10 on /home/, 3/10 on
          /study/ before the move; 0/12 on each of five routes after it. The
          error was recoverable, so nothing rendered wrong, but it was an
          unexplained console error on a public site.

          It is a plain inline <script>, not `next/script`. `beforeInteractive`
          looks like the right tool and is not: in the App Router it emits a
          `self.__next_s.push(...)` record that the Next runtime executes once
          the framework bundle has loaded, which is after first paint. That was
          measured too — with it, a stored dark theme still painted light on
          the first frame. An inline script runs synchronously as the parser
          reaches it, before any paintable element below it exists.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ServiceWorker />
        <ThemeProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
