import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yurtify - Yurt Yönetim & Öğrenci Portalı",
  description: "Öğrenci konaklama, oda rezervasyonu, izin ve yurt yönetim otomasyonu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className="h-full antialiased font-sans"
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
        {/* Google Analytics 4 (GA4) Canlı Entegrasyon */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-97S16X4ECZ"}`}
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              var customGaId = (function() {
                try {
                  var saved = localStorage.getItem('yurtify_ga_measurement_id');
                  if (saved && saved.indexOf('G-') === 0) return saved;
                } catch(e) {}
                return '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-97S16X4ECZ"}';
              })();
              gtag('config', customGaId, {
                debug_mode: true,
                send_page_view: true
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
