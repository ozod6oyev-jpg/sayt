import { syncMetaHistoryAction } from "@/app/actions/meta";
import { SyncHistoryButton } from "@/components/admin/sync-history-button";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireAdmin } from "@/lib/auth";
import { listChats, loadThread, markThreadRead } from "@/lib/inbox";
import { refreshMetaAvatar } from "@/lib/meta-profile";
import { refreshChatAvatar } from "@/lib/telegram-avatar";
import { LiveInbox } from "@/components/admin/inbox/live-inbox";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Filter = "all" | "telegram" | "facebook" | "instagram" | "threads";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MetaInboxPage({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const viewer = { id: user.id, role: user.role };

  const c = await getAdminCopy(metaCopy);
  const params = await searchParams;
  const rawFilter = first(params.tur);
  const filter: Filter =
    rawFilter === "telegram" ||
    rawFilter === "facebook" ||
    rawFilter === "instagram" ||
    rawFilter === "threads"
      ? rawFilter
      : "all";
  const chatId = first(params.chat);
  const syncStatus = first(params.sync);

  const labels = {
    you: c.inboxYou,
    businessBadge: c.businessBadge,
    mediaPhoto: c.mediaPhoto,
    mediaVideo: c.mediaVideo,
    mediaVoice: c.mediaVoice,
    noMessageYet: c.noMessageYet,
    metaInstagram: c.metaInstagram,
    metaFacebook: c.metaFacebook,
    filterTelegram: c.filterTelegram,
    filterThreads: c.filterThreads,
  };

  if (chatId) {
    await refreshChatAvatar(chatId);
    await refreshMetaAvatar(chatId);
  }

  const [items, selected] = await Promise.all([
    listChats(filter, labels, viewer),
    chatId ? loadThread(chatId, labels, viewer) : Promise.resolve(null),
  ]);

  // Birinchi o'qilmagan xabar — "Yangi xabarlar" ajratgichi shu joyda turadi
  const firstUnreadId =
    selected?.messages.find((message) => message.direction === "in" && !message.readAt)?.id ?? null;

  if (selected && firstUnreadId) {
    await markThreadRead(selected.kind, selected.id, { viewer });
  }

  const thread =
    selected && firstUnreadId ? await loadThread(selected.id, labels, viewer) : selected;

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: c.filterAll },
    { value: "telegram", label: c.filterTelegram },
    { value: "facebook", label: c.filterFacebook },
    { value: "instagram", label: c.filterInstagram },
    { value: "threads", label: c.filterThreads },
  ];

  const filterQuery = filter === "all" ? "" : `&tur=${filter}`;

  // Har admin faqat o'z botidan kelgan xabarlarni ko'radi — bot ulanmagan bo'lsa eslatma
  const banners: { tone: "ok" | "error"; text: string }[] =
    user.role !== "owner" && !user.telegramBotId
      ? [{ tone: "error", text: c.inboxTelegramNotLinked }]
      : [];

  return (
    <div className="space-y-3">
      {syncStatus === "ok" && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{c.syncOk}</p>
      )}
      {syncStatus === "error" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{c.syncFail}</p>
      )}

      <form
        action={syncMetaHistoryAction}
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
      >
        <p className="text-xs text-muted-foreground">{c.syncHint}</p>
        <SyncHistoryButton label={c.syncButton} pendingLabel={c.syncRunning} />
      </form>

      <LiveInbox
        filter={filter}
        filters={filters}
        initialItems={items}
        initialThread={thread}
        initialDividerId={firstUnreadId}
        banners={banners}
        copy={c}
        filterQuery={filterQuery}
      />
    </div>
  );
}
