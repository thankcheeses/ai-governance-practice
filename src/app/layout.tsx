import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { ServiceWorker } from "@/components/app/service-worker";
import { BRAND } from "@/lib/brand";
import { ProgressProvider } from "@/lib/store/progress-provider";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/lib/store/theme-provider";
import "./globals.css";

/*
  Two families with distinct jobs.

  Inter carries reading matter — headings, scenarios, rationales — where a
  proportional face is simply easier to read at length and gives the hierarchy
  something to work with. IBM Plex Mono stays for what is genuinely technical:
  labels, metadata, counts, sub-domain ids, framework tags. Keeping mono for
  those preserves the precision the earlier system was after without making an
  entire study page read like a terminal.
*/
const inter = Inter({
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: light)", color: "#f7f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
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
      className={`${inter.variable} ${plexMono.variable}`}
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
