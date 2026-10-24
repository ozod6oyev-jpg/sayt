import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { AdminNavMenu } from "@/components/admin/admin-nav-menu";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import { AdminScriptSwitcher } from "@/components/admin/admin-script-switcher";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { ThemeSync } from "@/components/theme-sync";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/auth";
import { getAdminCopy, getAdminScript } from "@/lib/admin-i18n";
import { unreadCounts } from "@/lib/notifications";
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
  const isDark = (await cookies()).get("uyjoy-theme")?.value === "dark";
  const counts = await unreadCounts();

  const badges: Record<string, number> = {
    "/admin/leads": counts.lead,
    "/admin/meta": counts.meta + counts.telegram,
  };

  const groups = [
    { links: [{ href: "/admin", label: c.dashboard }] },
    {
      label: c.groupContent,
      links: [
        { href: "/admin/listings", label: c.listings },
        { href: "/admin/sotuv-variantlari", label: c.saleOptions },
        { href: "/admin/articles", label: c.articles },
      ],
    },
    {
      label: c.groupClients,
      links: [
        { href: "/admin/leads", label: c.leads },
        ...(user.role === "owner"
          ? [{ href: "/admin/meta", label: c.meta, logo: "meta" as const }]
          : []),
      ],
    },
    ...(user.role === "owner"
      ? [
          {
            label: c.groupAdmin,
            links: [
              { href: "/admin/users", label: c.users },
              { href: "/admin/kirish-huquqi", label: c.access },
            ],
          },
        ]
      : []),
    { links: [{ href: "/admin/profil", label: c.profile }] },
  ];

  return (
    <html
      lang={script === "cyrl" ? "uz-Cyrl" : "uz"}
      className={isDark ? "dark" : undefined}
      suppressHydrationWarning
    >
      <body className={`${fontSans.variable} ${fontDisplay.variable} min-h-screen bg-slate-50`}>
        <ThemeSync />
        <header className="border-b border-slate-200 bg-card">
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Link href="/admin" className="flex shrink-0 items-center gap-2">
                <Image
                  src="/logo-mark.png"
                  alt={siteName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <span className="hidden text-sm font-bold text-slate-900 sm:block">{siteName}</span>
                <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 sm:inline">
                  {c.panel}
                </span>
              </Link>

              <AdminNavMenu groups={groups} label={c.sections} badges={badges} />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <AdminNotifications
                initialUnread={counts.total}
                title={c.notifications}
                empty={c.notificationsEmpty}
                markAll={c.notificationsMarkAll}
              />
              <ThemeToggle label={c.theme} />
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
        </header>

        <div className="container-page py-8">{children}</div>
      </body>
    </html>
  );
}
