import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Serif, Inter } from "next/font/google";
import { ServiceWorker } from "@/components/app/service-worker";
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
  manifest: "/manifest.webmanifest",
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
      <head>
        {/* Set the theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <ServiceWorker />
        <ThemeProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
