import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { requireAdmin } from "@/lib/auth";
import { fontDisplay, fontSans } from "@/lib/fonts";
import { getDict, siteName } from "@/lib/i18n";

export const metadata: Metadata = {
  title: `Boshqaruv paneli | ${siteName}`,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  const t = getDict("uz");
  const links = [
    { href: "/admin", label: t.admin.dashboard },
    { href: "/admin/listings", label: t.admin.listings },
    { href: "/admin/sotuv-variantlari", label: t.admin.saleOptions },
    { href: "/admin/articles", label: t.admin.articles },
    { href: "/admin/leads", label: t.admin.leads },
    ...(user.role === "owner" ? [{ href: "/admin/users", label: "Adminlar" }] : []),
    { href: "/admin/profil", label: "Profil" },
  ];

  return (
    <html lang="uz">
      <body className={`${fontSans.variable} ${fontDisplay.variable} min-h-screen bg-slate-50`}>
        <header className="border-b border-slate-200 bg-white">
          <div className="container-page flex h-16 items-center justify-between gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src="/logo-mark.png"
                alt={siteName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="text-sm font-bold text-slate-900">{siteName}</span>
              <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 sm:inline">
                {t.admin.title}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <AdminUserMenu
                name={user.name}
                role={user.role}
                logoutLabel={t.admin.logout}
              />
            </div>
          </div>

          <nav className="border-t border-slate-100">
            <div className="container-page flex gap-1 overflow-x-auto py-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <div className="container-page py-8">{children}</div>
      </body>
    </html>
  );
}
