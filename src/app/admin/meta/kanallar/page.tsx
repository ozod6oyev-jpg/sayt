import {
  publishToThreads,
  saveMetaSettingsAction,
  testMetaConnectionAction,
  testThreadsConnectionAction,
} from "@/app/actions/meta";
import { connectTelegramWebhook, publishToChannel } from "@/app/actions/telegram";
import { AtSign } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { MetaLogo } from "@/components/meta-logo";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { getMetaSettings, metaCallbackUrl, metaOAuthUrls } from "@/lib/meta";
import { getBotInfo, getChannelInfo, getWebhookInfo, telegramWebhookUrl } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MetaChannelsPage({ searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(metaCopy);
  const params = await searchParams;
  const tgStatus = first(params.tg);
  const hookStatus = first(params.hook);
  const metaStatus = first(params.meta);
  const threadsStatus = first(params.threads);

  const [bot, channel, webhook, settings] = await Promise.all([
    getBotInfo(),
    getChannelInfo(),
    getWebhookInfo(),
    getMetaSettings(),
  ]);

  const oauthUrls = metaOAuthUrls();
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
  if (metaStatus === "saved") banners.push({ tone: "ok", text: c.metaSaved });
  if (metaStatus === "ok") banners.push({ tone: "ok", text: c.metaOk });
  if (metaStatus === "missing") banners.push({ tone: "error", text: c.metaMissing });
  if (metaStatus === "error") banners.push({ tone: "error", text: c.metaError });
  if (metaStatus === "oauth_state") banners.push({ tone: "error", text: c.oauthState });
  if (metaStatus === "oauth_pages") banners.push({ tone: "error", text: c.oauthPages });
  if (metaStatus === "oauth_error") banners.push({ tone: "error", text: c.oauthError });
  if (threadsStatus === "ok") banners.push({ tone: "ok", text: c.threadsOk });
  if (threadsStatus === "sent") banners.push({ tone: "ok", text: c.threadsSent });
  if (threadsStatus === "invalid") banners.push({ tone: "error", text: c.threadsInvalid });
  if (threadsStatus === "error") banners.push({ tone: "error", text: c.threadsError });
  if (threadsStatus === "failed") banners.push({ tone: "error", text: c.threadsFailed });

  return (
    <div className="space-y-5">
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

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs leading-5 text-slate-600">{c.oauthHint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href="/api/meta/oauth/start" className="btn-primary text-xs">
              <MetaLogo className="size-3.5" />
              {c.connectFb}
            </a>
            <a href="/api/meta/threads/start" className="btn-secondary text-xs">
              <AtSign className="size-3.5" />
              {c.connectThreads}
            </a>
          </div>
        </div>

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

        <p className="mt-5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {c.manualTitle}
        </p>
        <form action={saveMetaSettingsAction} className="mt-2 grid gap-3 sm:grid-cols-2">
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
          <div>
            <label className="label" htmlFor="meta-threads-id">
              {c.threadsUserId}
            </label>
            <input
              id="meta-threads-id"
              name="threadsUserId"
              defaultValue={settings.threadsUserId ?? ""}
              className="field"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label" htmlFor="meta-threads-token">
              {c.threadsToken}
            </label>
            <input
              id="meta-threads-token"
              name="threadsToken"
              type="password"
              autoComplete="off"
              className="field"
              placeholder={settings.threadsUserId ? "••••••••" : ""}
            />
          </div>
          <div className="flex items-end">
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

        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{c.redirectTitle}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{c.redirectHint}</p>
          <code className="mt-2 block font-mono text-[11px] break-all text-slate-700">
            {oauthUrls.facebook}
          </code>
          <code className="mt-1 block font-mono text-[11px] break-all text-slate-700">
            {oauthUrls.threads}
          </code>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex size-6 items-center justify-center rounded-md bg-neutral-900 text-white">
              <AtSign className="size-3.5" />
            </span>
            {c.threadsName}
          </h2>
          <span
            className={
              settings.threadsUsername
                ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
            }
          >
            {settings.threadsUsername ? c.metaConnected : c.metaNotConnected}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{c.threadsHint}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {settings.threadsUsername && (
            <span className="text-sm font-medium text-slate-800">{settings.threadsUsername}</span>
          )}
          <form action={testThreadsConnectionAction}>
            <button type="submit" className="btn-secondary text-xs">
              {c.threadsTest}
            </button>
          </form>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-900">{c.threadsPostTitle}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{c.threadsPostHint}</p>
          <form action={publishToThreads} className="mt-3 space-y-2">
            <textarea
              name="text"
              required
              maxLength={500}
              rows={3}
              placeholder={c.threadsPostPlaceholder}
              className="field resize-y"
            />
            <button type="submit" className="btn-primary text-xs">
              {c.threadsPostSend}
            </button>
          </form>
        </div>
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
    </div>
  );
}
