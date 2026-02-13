import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { AuthStatus } from "@/components/AuthStatus";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "CodeArmor AI Security Dashboard",
  description: "Security-hardened baseline with scoring and Supabase-ready integration.",
  icons: {
    icon: '/favicon.png',
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress browser extension errors
              (function() {
                const originalDefineProperty = Object.defineProperty;
                Object.defineProperty = function(obj, prop, descriptor) {
                  try {
                    return originalDefineProperty(obj, prop, descriptor);
                  } catch (e) {
                    // Silently ignore extension errors
                    return obj;
                  }
                };
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-slate-50 antialiased">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

