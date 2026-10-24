import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { logout } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth";
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
    { href: "/admin/articles", label: t.admin.articles },
    { href: "/admin/leads", label: t.admin.leads },
    ...(user.role === "owner" ? [{ href: "/admin/users", label: "Adminlar" }] : []),
    { href: "/admin/profil", label: "Profil" },
  ];

  return (
    <html lang="uz">
      <body className="min-h-screen bg-slate-50">
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
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500">
                  {user.role === "owner" ? "Owner" : "Admin"}
                </p>
              </div>
              <Link
                href="/uz"
                className="hidden text-xs font-medium text-slate-500 hover:text-slate-800 sm:inline"
              >
                Saytni ko'rish →
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                  {t.admin.logout}
                </button>
              </form>
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
