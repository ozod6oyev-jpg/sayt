import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "./lib/i18n";

/**
 * Barcha ommaviy sahifalar /uz yoki /ru bilan boshlanadi.
 * "/" → "/uz", "/elonlar" → "/uz/elonlar".
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Admin, API, statik fayllar va yuklangan rasmlardan tashqari hamma joyda
    "/((?!admin|kirish|verifydev|api|_next/static|_next/image|uploads|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
