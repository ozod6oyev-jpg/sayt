import type { Metadata } from "next";
import {
  replyToMetaChat,
  saveMetaSettingsAction,
  testMetaConnectionAction,
} from "@/app/actions/meta";
import { connectTelegramWebhook, publishToChannel, replyToTelegramChat } from "@/app/actions/telegram";
import { InstagramIcon, TelegramIcon } from "@/components/icons";
import { MetaLogo } from "@/components/meta-logo";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { getMetaSettings, metaCallbackUrl } from "@/lib/meta";
import { prisma } from "@/lib/prisma";
import { getBotInfo, getChannelInfo, getWebhookInfo, telegramWebhookUrl } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "Meta | Boshqaruv paneli",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function MetaPage({ searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(metaCopy);
  const params = await searchParams;
  const tgStatus = first(params.tg);
  const hookStatus = first(params.hook);
  const replyStatus = first(params.reply);
  const metaStatus = first(params.meta);
  const metaReplyStatus = first(params.metaReply);

  const [bot, channel, webhook, chats, settings, metaChats] = await Promise.all([
    getBotInfo(),
    getChannelInfo(),
    getWebhookInfo(),
    prisma.telegramChat.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 6,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 6 } },
    }),
    getMetaSettings(),
    prisma.metaChat.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 6,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 6 } },
    }),
  ]);

  const webhookUrl = telegramWebhookUrl();
  const webhookConnected = webhook.ok && webhook.result.url === webhookUrl;
  const metaWebhookUrl = metaCallbackUrl();
  const metaConnected = Boolean(settings.connectedAt && settings.pageName);

  const banners: { tone: "ok" | "error"; text: string }[] = [];
  if (tgStatus === "sent") banners.push({ tone: "ok", text: c.tgSent });
  if (tgStatus === "invalid") banners.push({ tone: "error", text: c.tgInvalid });
  if (tgStatus === "nochat") banners.push({ tone: "error", text: c.tgNochat });
  if (tgStatus === "norights") banners.push({ tone: "error", text: c.tgNorights });
  if (tgStatus === "error") banners.push({ tone: "error", text: c.tgFailed });
  if (hookStatus === "ok") banners.push({ tone: "ok", text: c.hookOk });
  if (hookStatus === "error") banners.push({ tone: "error", text: c.hookFail });
  if (replyStatus === "sent") banners.push({ tone: "ok", text: c.inboxSent });
  if (replyStatus === "invalid" || replyStatus === "error") {
    banners.push({ tone: "error", text: c.inboxFail });
  }
  if (metaStatus === "saved") banners.push({ tone: "ok", text: c.metaSaved });
  if (metaStatus === "ok") banners.push({ tone: "ok", text: c.metaOk });
  if (metaStatus === "missing") banners.push({ tone: "error", text: c.metaMissing });
  if (metaStatus === "error") banners.push({ tone: "error", text: c.metaError });
  if (metaReplyStatus === "sent") banners.push({ tone: "ok", text: c.metaReplySent });
  if (metaReplyStatus === "invalid" || metaReplyStatus === "error") {
    banners.push({ tone: "error", text: c.metaReplyFail });
  }

  const accounts = [
    {
      name: c.fbName,
      hint: c.fbHint,
      icon: <MetaLogo className="size-4" />,
      tile: "bg-[#0866FF]/10",
      status: metaConnected ? c.metaConnected : c.metaNotConnected,
      connected: metaConnected,
    },
    {
      name: c.igName,
      hint: c.igHint,
      icon: <InstagramIcon className="size-4 text-[#E1306C]" />,
      tile: "bg-[#E1306C]/10",
      status: settings.igUsername ? c.metaConnected : c.metaNotConnected,
      connected: Boolean(settings.igUsername),
    },
    {
      name: c.tgName,
      hint: c.tgHint,
      icon: <TelegramIcon className="size-4 text-[#229ED9]" />,
      tile: "bg-[#229ED9]/10",
      status: channel.ok ? c.tgConnected : c.tgNotConnected,
      connected: channel.ok,
    },
  ];

  const steps = [
    { title: c.step1Title, text: c.step1Text, status: c.step1Status },
    { title: c.step2Title, text: c.step2Text, status: c.step2Status },
    { title: c.step3Title, text: c.step3Text, status: c.step3Status },
    { title: c.step4Title, text: c.step4Text, status: c.step4Status },
  ];

  const requirements = [c.needMetaApp, c.needPage, c.needIg, c.needTg, c.needHttps];

  return (
    <div className="space-y-6">
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

      {banners.map((banner) => (
        <p
          key={banner.text}
          className={
            banner.tone === "ok"
              ? "rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {banner.text}
        </p>
      ))}

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MetaLogo className="size-4" />
            {c.metaSettingsTitle}
          </h2>
          <span
            className={
              metaConnected
                ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
            }
          >
            {metaConnected ? c.metaConnected : c.metaNotConnected}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{c.metaSettingsHint}</p>

        {metaConnected && (
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                {c.metaPage}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-800">{settings.pageName}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                {c.metaIg}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-800">{settings.igUsername ?? "—"}</dd>
            </div>
          </dl>
        )}

        <form action={saveMetaSettingsAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="meta-app-id">
              {c.metaAppId}
            </label>
            <input
              id="meta-app-id"
              name="appId"
              defaultValue={settings.appId ?? ""}
              className="field"
              autoComplete="off"
              placeholder="1234567890"
            />
          </div>
          <div>
            <label className="label" htmlFor="meta-app-secret">
              {c.metaAppSecret}
            </label>
            <input
              id="meta-app-secret"
              name="appSecret"
              type="password"
              autoComplete="off"
              className="field"
              placeholder={settings.appSecret ? "••••••••" : ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="meta-page-id">
              {c.metaPageId}
            </label>
            <input
              id="meta-page-id"
              name="pageId"
              defaultValue={settings.pageId ?? ""}
              className="field"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label" htmlFor="meta-page-token">
              {c.metaPageToken}
            </label>
            <input
              id="meta-page-token"
              name="pageToken"
              type="password"
              autoComplete="off"
              className="field"
              placeholder={settings.pageToken ? "••••••••" : ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="meta-ig-id">
              {c.metaIgId}
            </label>
            <input
              id="meta-ig-id"
              name="igUserId"
              defaultValue={settings.igUserId ?? ""}
              className="field"
              autoComplete="off"
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary text-xs">
              {c.metaSave}
            </button>
          </div>
        </form>
        <p className="mt-2 text-[11px] text-slate-500">{c.metaKeepSecret}</p>

        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{c.webhookTitle}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{c.metaVerifyHint}</p>
          <code className="mt-2 block font-mono text-[11px] break-all text-slate-700">
            {metaWebhookUrl}
          </code>
          <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            {c.metaVerifyToken}
          </p>
          <code className="block font-mono text-[11px] break-all text-slate-700">
            {settings.verifyToken}
          </code>

          <form action={testMetaConnectionAction} className="mt-3">
            <button type="submit" className="btn-secondary text-xs">
              {c.metaTest}
            </button>
          </form>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MetaLogo className="size-4" />
            {c.metaInbox}
          </h2>
          <p className="text-xs text-slate-500">{c.metaInboxHint}</p>
        </div>

        {metaChats.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {c.metaInboxEmpty}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {metaChats.map((chat) => (
              <div key={chat.id} className="rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{chat.name}</p>
                    <p className="text-[11px] text-slate-500">{formatDateTime(chat.lastMessageAt)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {chat.platform === "instagram" ? c.metaInstagram : c.metaFacebook}
                  </span>
                </div>

                <div className="space-y-1.5 px-3 py-2.5">
                  {[...chat.messages].reverse().map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.direction === "out"
                          ? "ml-auto max-w-[85%] rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs text-brand-800"
                          : "mr-auto max-w-[85%] rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700"
                      }
                    >
                      <p className="text-[10px] font-semibold text-slate-500">
                        {message.direction === "out" ? c.inboxYou : chat.name}
                      </p>
                      <p className="mt-0.5 break-words whitespace-pre-wrap">{message.text}</p>
                    </div>
                  ))}
                </div>

                <form
                  action={replyToMetaChat}
                  className="flex flex-col gap-2 border-t border-slate-100 p-3 sm:flex-row sm:items-end"
                >
                  <input type="hidden" name="chatRefId" value={chat.id} />
                  <div className="flex-1">
                    <label className="label" htmlFor={`meta-reply-${chat.id}`}>
                      {c.metaReply}
                    </label>
                    <input
                      id={`meta-reply-${chat.id}`}
                      name="text"
                      required
                      maxLength={2000}
                      placeholder={c.metaReplyPlaceholder}
                      className="field"
                    />
                  </div>
                  <button type="submit" className="btn-primary text-xs">
                    {c.metaReplySend}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <TelegramIcon className="size-4 text-[#229ED9]" />
            {c.tgTitle}
          </h2>
          <span
            className={
              channel.ok
                ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
            }
          >
            {channel.ok ? c.tgConnected : c.tgNotConnected}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              {c.tgBot}
            </dt>
            <dd className="mt-0.5 text-sm text-slate-800">
              {bot.ok ? (
                <>
                  {bot.result.first_name}
                  {bot.result.username ? ` · @${bot.result.username}` : ""}
                </>
              ) : (
                <span className="text-red-600">{bot.description}</span>
              )}
            </dd>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              {c.tgChannel}
            </dt>
            <dd className="mt-0.5 text-sm text-slate-800">
              {channel.ok ? (
                <>
                  {channel.result.title}
                  {channel.result.username ? ` · @${channel.result.username}` : ""}
                </>
              ) : (
                <span className="text-amber-700">{c.tgChatError}</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{c.hookTitle}</h3>
            <span
              className={
                webhookConnected
                  ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                  : "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
              }
            >
              {webhookConnected ? c.hookOn : c.hookOff}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{c.hookHint}</p>
          <code className="mt-2 block font-mono text-[11px] break-all text-slate-700">
            {webhookUrl}
          </code>
          <p className="mt-1 text-[11px] text-slate-500">{c.hookSecret}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <form action={connectTelegramWebhook}>
              <button type="submit" className="btn-secondary text-xs">
                {c.hookConnect}
              </button>
            </form>
            {webhook.ok && webhook.result.last_error_message && !webhookConnected && (
              <span className="text-[11px] text-amber-700">
                {webhook.result.last_error_message}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-900">{c.tgPostTitle}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{c.tgPostHint}</p>

          <form action={publishToChannel} className="mt-3 space-y-2">
            <textarea
              name="text"
              required
              minLength={2}
              maxLength={4000}
              rows={4}
              placeholder={c.tgPostPlaceholder}
              className="field resize-y"
            />
            <button type="submit" className="btn-primary text-xs">
              {c.tgPostSend}
            </button>
          </form>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{c.inboxTitle}</h2>
          <p className="text-xs text-slate-500">{c.inboxHint}</p>
        </div>

        {chats.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {c.inboxEmpty}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {chats.map((chat) => (
              <div key={chat.id} className="rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{chat.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {chat.username ? `@${chat.username} · ` : ""}
                      {formatDateTime(chat.lastMessageAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {chat.type}
                  </span>
                </div>

                <div className="space-y-1.5 px-3 py-2.5">
                  {[...chat.messages].reverse().map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.direction === "out"
                          ? "ml-auto max-w-[85%] rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs text-brand-800"
                          : "mr-auto max-w-[85%] rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700"
                      }
                    >
                      <p className="text-[10px] font-semibold text-slate-500">
                        {message.direction === "out" ? c.inboxYou : message.fromName}
                      </p>
                      <p className="mt-0.5 break-words whitespace-pre-wrap">{message.text}</p>
                    </div>
                  ))}
                </div>

                <form
                  action={replyToTelegramChat}
                  className="flex flex-col gap-2 border-t border-slate-100 p-3 sm:flex-row sm:items-end"
                >
                  <input type="hidden" name="chatRefId" value={chat.id} />
                  <div className="flex-1">
                    <label className="label" htmlFor={`reply-${chat.id}`}>
                      {c.inboxReply}
                    </label>
                    <input
                      id={`reply-${chat.id}`}
                      name="text"
                      required
                      maxLength={4000}
                      placeholder={c.inboxReplyPlaceholder}
                      className="field"
                    />
                  </div>
                  <button type="submit" className="btn-primary text-xs">
                    {c.inboxSend}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-[11px] text-slate-500">{c.tgMediaNote}</p>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{c.accountsTitle}</h2>
          <p className="text-xs text-slate-500">{c.accountsHint}</p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.name} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${account.tile}`}
                >
                  {account.icon}
                </span>
                <span
                  className={
                    account.connected
                      ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                      : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                  }
                >
                  {account.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{account.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{account.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{c.roadmapTitle}</h2>
          <p className="text-xs text-slate-500">{c.roadmapHint}</p>
        </div>

        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <span
                    className={
                      index <= 1
                        ? "rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                    }
                  >
                    {step.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-5 text-slate-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">{c.needTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{c.needHint}</p>

        <ul className="mt-3 space-y-2">
          {requirements.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300" />
              {item}
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-sm font-semibold text-slate-900">{c.noteTitle}</h3>
        <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
          <li>{c.note1}</li>
          <li>{c.note2}</li>
          <li>{c.note3}</li>
        </ul>
      </section>
    </div>
  );
}
