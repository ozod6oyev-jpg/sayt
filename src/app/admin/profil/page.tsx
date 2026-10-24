import { changeOwnPassword, regenerateOwnTotp } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { formatSecret, otpauthUrl } from "@/lib/totp";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SAVED: Record<string, string> = {
  password: "Parol yangilandi.",
  totp: "Yangi authenticator kaliti yaratildi. Eskisi endi ishlamaydi — yangisini ilovaga qo'shing.",
};

const ERRORS: Record<string, string> = {
  current: "Joriy parol noto'g'ri.",
  weak: "Yangi parol kamida 8 belgidan iborat bo'lsin.",
  match: "Yangi parollar mos kelmadi.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const query = await searchParams;

  const saved = first(query.saved);
  const error = first(query.error);
  const isSetup = first(query.setup) === "1";

  const secret = formatSecret(user.totpSecret);
  const uri = otpauthUrl(user.totpSecret, user.email);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hisob ma'lumotlari, parol va Google Authenticator kaliti.
        </p>
      </div>

      {isSetup && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-semibold">Owner hisobi yaratildi 🎉</p>
          <p className="mt-1 leading-6">
            Endi quyidagi kalitni Google Authenticator'ga qo'shing. Keyingi safar kirishda
            shu ilovadagi 6 xonali kod so'raladi. Kalitni xavfsiz joyda saqlang.
          </p>
        </div>
      )}

      {saved && SAVED[saved] && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{SAVED[saved]}</p>
      )}
      {error && ERRORS[error] && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{ERRORS[error]}</p>
      )}

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Hisob</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Ism</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Rol</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {user.role === "owner" ? "Owner" : "Admin"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Oxirgi kirish</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {user.lastLoginAt
                ? new Intl.DateTimeFormat("ru-RU", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(user.lastLoginAt)
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Google Authenticator</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Ilovada «+» → «Kirish kodi» → «Kalitni qo'lda kiritish» ni tanlab, quyidagi kalitni
          kiriting (bo'shliqlarsiz).
        </p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            Maxfiy kalit
          </p>
          <code className="mt-1 block font-mono text-base break-all text-slate-900 select-all">
            {secret}
          </code>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            otpauth havolasi
          </p>
          <a
            href={uri}
            className="mt-1 block font-mono text-xs break-all text-brand-700 hover:underline"
          >
            {uri}
          </a>
          <p className="mt-2 text-xs text-slate-500">
            Telefonda bu havolani bosish authenticator ilovasini ochadi.
          </p>
        </div>

        <form action={regenerateOwnTotp} className="mt-4">
          <button type="submit" className="btn-secondary text-xs">
            Yangi kalit yaratish
          </button>
          <span className="ml-3 text-xs text-slate-500">
            Diqqat: eski kalit ishlamay qoladi.
          </span>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Parolni almashtirish</h2>

        <form action={changeOwnPassword} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="current">
              Joriy parol
            </label>
            <input
              id="current"
              name="current"
              type="password"
              required
              autoComplete="current-password"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="next">
              Yangi parol
            </label>
            <input
              id="next"
              name="next"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Takrorlang
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
            />
          </div>

          <div className="sm:col-span-3">
            <button type="submit" className="btn-primary">
              Saqlash
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
