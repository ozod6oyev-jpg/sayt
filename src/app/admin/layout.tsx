import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { AdminScriptSwitcher } from "@/components/admin/admin-script-switcher";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { requireAdmin } from "@/lib/auth";
import { getAdminCopy, getAdminScript } from "@/lib/admin-i18n";
import { shellCopy } from "@/lib/admin-copy/shell";
import { fontDisplay, fontSans } from "@/lib/fonts";
import { siteName } from "@/lib/i18n";

export const metadata: Metadata = {
  title: `Boshqaruv paneli | ${siteName}`,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const script = await getAdminScript();
  const c = await getAdminCopy(shellCopy);

  const links = [
    { href: "/admin", label: c.dashboard },
    { href: "/admin/listings", label: c.listings },
    { href: "/admin/sotuv-variantlari", label: c.saleOptions },
    { href: "/admin/articles", label: c.articles },
    { href: "/admin/leads", label: c.leads },
    ...(user.role === "owner"
      ? [
          { href: "/admin/users", label: c.users },
          { href: "/admin/kirish-huquqi", label: c.access },
        ]
      : []),
    { href: "/admin/profil", label: c.profile },
  ];

  return (
    <html lang={script === "cyrl" ? "uz-Cyrl" : "uz"}>
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
                {c.panel}
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <AdminScriptSwitcher script={script} hint={c.switchHint} />
              <AdminUserMenu
                name={user.name}
                roleLabel={user.role === "owner" ? c.owner : c.adminRole}
                logoutLabel={c.logout}
                viewSiteLabel={c.viewSite}
                profileLabel={c.profile}
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
