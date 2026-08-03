import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { ProgressProvider } from "@/lib/store/progress-provider";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/lib/store/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.positioning,
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "black-translucent",
  },
  keywords: [
    "AI governance",
    "NIST AI RMF",
    "EU AI Act",
    "ISO 42001",
    "responsible AI",
    "professional development",
  ],
  openGraph: {
    title: BRAND.name,
    description: BRAND.positioning,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1622" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
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
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Set the theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
