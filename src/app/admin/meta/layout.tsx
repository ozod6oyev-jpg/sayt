import type { Metadata } from "next";
import { MetaTabs } from "@/components/admin/meta-tabs";
import { MetaLogo } from "@/components/meta-logo";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Meta | Boshqaruv paneli",
  robots: { index: false, follow: false },
};

export default async function MetaLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();

  const c = await getAdminCopy(metaCopy);

  const tabs = [
    { href: "/admin/meta", label: c.tabOverview },
    { href: "/admin/meta/kanallar", label: c.tabChannels },
    { href: "/admin/meta/xabarlar", label: c.tabInbox },
    { href: "/admin/meta/reja", label: c.tabPlan },
  ];

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0866FF]/10">
            <MetaLogo className="size-6" />
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              Meta
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {c.planning}
              </span>
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm text-slate-500">{c.subtitle}</p>
          </div>
        </div>
      </div>

      <MetaTabs tabs={tabs} />

      {children}
    </div>
  );
}
