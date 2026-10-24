import type { Metadata } from "next";
import "../globals.css";
import { fontDisplay, fontSans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Kirish | Uy-joylar sotamiz",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-4`}
      >
        {children}
      </body>
    </html>
  );
}
