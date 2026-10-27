import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeSync } from "@/components/theme-sync";
import { fontDisplay, fontSans } from "@/lib/fonts";
import { getDict, isLocale, siteName } from "@/lib/i18n";
import { robotsMeta, siteUrl } from "@/lib/seo";

export const viewport: Viewport = {
  themeColor: "#033579",
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const current = isLocale(locale) ? locale : "uz";
  const t = getDict(current);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t.meta.homeTitle,
      template: `%s | ${siteName}`,
    },
    description: t.meta.homeDescription,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: "/logo-mark.png", sizes: "512x512", type: "image/png" }],
      apple: [{ url: "/logo-mark.png", sizes: "512x512" }],
      shortcut: "/logo-mark.png",
    },
    appleWebApp: {
      capable: true,
      title: "Sotamiz",
      statusBarStyle: "default",
    },
    robots: robotsMeta,
    openGraph: {
      siteName,
      locale: current === "uz" ? "uz_UZ" : "ru_RU",
      type: "website",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  // Tungi rejim cookie'da saqlanadi, shuning uchun til almashganda yo'qolmaydi
  const theme = (await cookies()).get("uyjoy-theme")?.value;
  const isDark = theme === "dark";

  return (
    <html lang={locale} className={isDark ? "dark" : undefined} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement,c=document.cookie.match(/(?:^|; )uyjoy-theme=([^;]+)/),s=localStorage.getItem("uyjoy-theme"),v=c?c[1]:s;if(v==="dark"){d.classList.add("dark");if(!c){document.cookie="uyjoy-theme=dark;path=/;max-age=31536000;samesite=lax"}}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${fontSans.variable} ${fontDisplay.variable} flex min-h-screen flex-col`}>
        <ThemeSync />
        <SiteHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
