import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Özel Yurt Yönetim & Öğrenci Portalı",
  description: "Öğrenci konaklama, oda rezervasyonu, izin ve yurt yönetim otomasyonu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('yurtify_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var session = localStorage.getItem('yurtify_session');
                if (session) {
                  var parsed = JSON.parse(session);
                  var maxDur = 8 * 60 * 60 * 1000;
                  if (parsed && parsed.role && (!parsed.loginAt || (Date.now() - parsed.loginAt <= maxDur))) {
                    document.documentElement.classList.add('has-session');
                  } else {
                    localStorage.removeItem('yurtify_session');
                  }
                }
              } catch(e) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
