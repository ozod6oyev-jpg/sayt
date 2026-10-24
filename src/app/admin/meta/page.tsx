import Link from "next/link";
import { InstagramIcon, TelegramIcon } from "@/components/icons";
import { MetaLogo } from "@/components/meta-logo";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { getMetaSettings } from "@/lib/meta";
import { prisma } from "@/lib/prisma";
import { getChannelInfo } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function MetaOverviewPage() {
  await requireOwner();

  const c = await getAdminCopy(metaCopy);

  const [channel, settings, telegramChats, metaChats, telegramLast, metaLast] = await Promise.all([
    getChannelInfo(),
    getMetaSettings(),
    prisma.telegramChat.count(),
    prisma.metaChat.count(),
    prisma.telegramChat.findFirst({ orderBy: { lastMessageAt: "desc" } }),
    prisma.metaChat.findFirst({ orderBy: { lastMessageAt: "desc" } }),
  ]);

  const metaConnected = Boolean(settings.connectedAt && settings.pageName);
  const igConnected = Boolean(settings.igUsername);

  const channels = [
    {
      name: c.tgName,
      icon: <TelegramIcon className="size-4 text-[#229ED9]" />,
      tile: "bg-[#229ED9]/10",
      connected: channel.ok,
      detail: channel.ok ? `@${channel.result.username ?? channel.result.title}` : c.tgChatError,
    },
    {
      name: c.fbName,
      icon: <MetaLogo className="size-4" />,
      tile: "bg-[#0866FF]/10",
      connected: metaConnected,
      detail: metaConnected ? (settings.pageName ?? "") : c.metaMissing,
    },
    {
      name: c.igName,
      icon: <InstagramIcon className="size-4 text-[#E1306C]" />,
      tile: "bg-[#E1306C]/10",
      connected: igConnected,
      detail: igConnected ? (settings.igUsername ?? "") : c.metaMissing,
    },
  ];

  const stats = [
    {
      label: c.ovTelegramChats,
      value: telegramChats,
      last: telegramLast ? formatDateTime(telegramLast.lastMessageAt) : c.ovNone,
    },
    {
      label: c.ovMetaChats,
      value: metaChats,
      last: metaLast ? formatDateTime(metaLast.lastMessageAt) : c.ovNone,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{c.ovStatusTitle}</h2>
          <p className="text-xs text-slate-500">{c.ovStatusHint}</p>
        </div>

        <ul className="mt-3 divide-y divide-slate-100">
          {channels.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.tile}`}
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{item.detail}</p>
                </div>
              </div>
              <span
                className={
                  item.connected
                    ? "shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                    : "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                }
              >
                {item.connected ? c.metaConnected : c.metaNotConnected}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">{c.ovStatsTitle}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-4">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {c.ovLast}: {stat.last}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{c.ovNextTitle}</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">{c.ovNextText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/meta/kanallar" className="btn-primary text-xs">
            {c.ovOpen}
          </Link>
          <Link href="/admin/meta/xabarlar" className="btn-secondary text-xs">
            {c.tabInbox}
          </Link>
        </div>
      </section>
    </div>
  );
}
