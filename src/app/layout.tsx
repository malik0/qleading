import type { Metadata, Viewport } from "next";
import { AppProvider } from "../context/AppContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qleading - 30 Juz Quran Player & Reading Tracker",
  description: "Continuous 30 Juz Holy Quran audio player with second-by-second position and reading timer synchronization",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme-color="sky" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var raw = localStorage.getItem('qleading_settings_v1');
                var settings = raw ? JSON.parse(raw) : {};
                var mode = settings.themeMode || 'dark';
                var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                var root = document.documentElement;
                if (isDark) {
                  root.classList.add('dark');
                  root.classList.remove('light');
                } else {
                  root.classList.remove('dark');
                  root.classList.add('light');
                }
                root.setAttribute('data-theme-color', settings.themeColor || 'sky');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-surface-base text-content-primary min-h-screen flex flex-col transition-colors duration-200">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

