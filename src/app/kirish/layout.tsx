import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Kirish | UyJoy boshqaruv paneli",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        {children}
      </body>
    </html>
  );
}
