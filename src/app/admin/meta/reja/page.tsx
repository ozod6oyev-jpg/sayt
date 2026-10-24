import { metaCopy } from "@/lib/admin-copy/meta";
import { getAdminCopy } from "@/lib/admin-i18n";
import { requireOwner } from "@/lib/auth";
import { getMetaSettings, metaCallbackUrl } from "@/lib/meta";
import { telegramWebhookUrl } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export default async function MetaPlanPage() {
  await requireOwner();

  const c = await getAdminCopy(metaCopy);
  const settings = await getMetaSettings();

  const steps = [
    { title: c.step1Title, text: c.step1Text, status: c.step1Status, done: true },
    { title: c.step2Title, text: c.step2Text, status: c.step2Status, done: Boolean(settings.connectedAt) },
    { title: c.step3Title, text: c.step3Text, status: c.step3Status, done: false },
    { title: c.step4Title, text: c.step4Text, status: c.step4Status, done: false },
  ];

  const requirements = [c.needMetaApp, c.needPage, c.needIg, c.needTg, c.needHttps];

  const webhooks = [
    { label: "Meta", url: metaCallbackUrl() },
    { label: "Telegram", url: telegramWebhookUrl() },
  ];

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{c.roadmapTitle}</h2>
          <p className="text-xs text-slate-500">{c.roadmapHint}</p>
        </div>

        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                className={
                  step.done
                    ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700"
                    : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600"
                }
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <span
                    className={
                      step.done
                        ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                        : index <= 1
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
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">{c.noteTitle}</h2>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
          <li>{c.note1}</li>
          <li>{c.note2}</li>
          <li>{c.note3}</li>
        </ul>
      </section>
    </div>
  );
}
