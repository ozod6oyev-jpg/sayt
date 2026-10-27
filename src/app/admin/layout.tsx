import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { AdminNavMenu } from "@/components/admin/admin-nav-menu";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import { AdminScriptSwitcher } from "@/components/admin/admin-script-switcher";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { AdminPushSync } from "@/components/admin/push-sync";
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo-mark.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/logo-mark.png", sizes: "512x512" }],
  },
  appleWebApp: { capable: true, title: "Sotamiz", statusBarStyle: "default" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const script = await getAdminScript();
  const c = await getAdminCopy(shellCopy);
  const isDark = (await cookies()).get("uyjoy-theme")?.value === "dark";
  const counts = await unreadCounts(user);

  const inboxHref = "/admin/meta";

  const badges: Record<string, number> = {
    "/admin/leads": counts.lead,
    [inboxHref]: counts.meta + counts.telegram,
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
        { href: inboxHref, label: c.meta, logo: "meta" as const },
      ],
    },
    {
      label: c.groupAdmin,
      links: [
        { href: "/admin/users", label: c.users },
        { href: "/admin/kirish-huquqi", label: c.access },
      ],
    },
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
        <AdminPushSync />
        <header className="border-b border-slate-200 bg-card">
          <div className="container-page flex h-12 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Link href="/admin" className="flex shrink-0 items-center gap-2">
                <Image
                  src="/logo-mark.png"
                  alt={siteName}
                  width={32}
                  height={32}
                  className="h-7 w-7 rounded-lg object-cover"
                />

              </Link>

              <AdminNavMenu groups={groups} label={c.sections} badges={badges} />
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Link
                href="/admin/reklama"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                aria-label={c.ads}
              >
                <span aria-hidden className="text-sm leading-none">
                  📢
                </span>
                <span className="hidden lg:inline">{c.ads}</span>
              </Link>

              <AdminNotifications
                initialUnread={counts.total}
                title={c.notifications}
                empty={c.notificationsEmpty}
                markAll={c.notificationsMarkAll}
                push={{
                  title: c.pushTitle,
                  hintOn: c.pushOn,
                  hintOff: c.pushOff,
                  denied: c.pushDenied,
                  unsupported: c.pushUnsupported,
                  turnOn: c.pushTurnOn,
                  turnOff: c.pushTurnOff,
                  test: c.pushTest,
                  testOk: c.pushTestOk,
                  testFail: c.pushTestFail,
                }}
              />
              <ThemeToggle label={c.theme} compact />
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
