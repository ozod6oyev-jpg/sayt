import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("uyjoy-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${fontSans.variable} ${fontDisplay.variable} flex min-h-screen flex-col`}>
        <SiteHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
