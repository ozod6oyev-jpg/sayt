import type { Metadata } from "next";
import { InstagramIcon, TelegramIcon } from "@/components/icons";
import { MetaLogo } from "@/components/meta-logo";
import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Meta | Boshqaruv paneli",
  robots: { index: false, follow: false },
};

export default async function MetaPage() {
  await requireOwner();

  const c = await getAdminCopy(metaCopy);

  const accounts = [
    {
      name: c.fbName,
      hint: c.fbHint,
      icon: <MetaLogo className="size-4" />,
      tile: "bg-[#0866FF]/10",
    },
    {
      name: c.igName,
      hint: c.igHint,
      icon: <InstagramIcon className="size-4 text-[#E1306C]" />,
      tile: "bg-[#E1306C]/10",
    },
    {
      name: c.tgName,
      hint: c.tgHint,
      icon: <TelegramIcon className="size-4 text-[#229ED9]" />,
      tile: "bg-[#229ED9]/10",
    },
  ];

  const steps = [
    { title: c.step1Title, text: c.step1Text, status: c.step1Status },
    { title: c.step2Title, text: c.step2Text, status: c.step2Status },
    { title: c.step3Title, text: c.step3Text, status: c.step3Status },
    { title: c.step4Title, text: c.step4Text, status: c.step4Status },
  ];

  const requirements = [
    c.needMetaApp,
    c.needPage,
    c.needIg,
    c.needTg,
    c.needHttps,
  ];

  const webhooks = [
    { label: "Meta", url: absoluteUrl("/api/webhooks/meta") },
    { label: "Telegram", url: absoluteUrl("/api/webhooks/telegram") },
  ];

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
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {c.notConnected}
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
                      index === 0
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

      <div className="grid gap-4 lg:grid-cols-2">
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
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">{c.webhookTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{c.webhookHint}</p>

          <div className="mt-3 space-y-2">
            {webhooks.map((hook) => (
              <div
                key={hook.label}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {hook.label}
                </p>
                <code className="mt-0.5 block font-mono text-[11px] break-all text-slate-700">
                  {hook.url}
                </code>
              </div>
            ))}
          </div>

          <p className="mt-2 text-[11px] text-slate-500">{c.webhookSoon}</p>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">{c.noteTitle}</h2>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
          <li>{c.note1}</li>
          <li>{c.note2}</li>
          <li>{c.note3}</li>
        </ul>

        <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-xs leading-5 text-brand-800">
          {c.nextAction}
        </p>
      </section>
    </div>
  );
}
