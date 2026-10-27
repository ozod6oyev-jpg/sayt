export type PushState = "unsupported" | "off" | "on" | "denied" | "working";

export type PushScope = "admin" | "site";

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function decodeKey(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const bytes = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }

  return bytes;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!supported()) return null;

  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return null;

  return registration.pushManager.getSubscription();
}

/** Brauzerda obuna bor-yo'qligi (serverda yozuv bo'lmasa ham) */
export async function hasLocalSubscription(): Promise<boolean> {
  return Boolean(await currentSubscription());
}

export async function pushState(scope: PushScope): Promise<PushState> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  const subscription = await currentSubscription();
  if (!subscription) return "off";

  try {
    const response = await fetch(
      `/api/push/status?endpoint=${encodeURIComponent(subscription.endpoint)}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as { scopes?: string[] };
    return data.scopes?.includes(scope) ? "on" : "off";
  } catch {
    return "off";
  }
}

async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.update().catch(() => null);
  await navigator.serviceWorker.ready;
  return registration;
}

async function postSubscription(
  scope: PushScope,
  subscription: PushSubscription,
  registration: ServiceWorkerRegistration,
): Promise<void> {
  const json = subscription.toJSON();

  await fetch(scope === "admin" ? "/api/admin/push/subscribe" : "/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });

  // Service worker qaysi turdagi obuna ekanini bilsin
  const worker = registration.active ?? navigator.serviceWorker.controller;
  worker?.postMessage({ type: "push-scope", scope });
}

/**
 * Mavjud obunani serverga yozadi, obuna bo'lmasa yangisini yaratadi.
 * Hech qachon `unsubscribe()` qilmaydi — aks holda brauzerdagi yagona obuna
 * o'chib, boshqa turdagi (admin/sayt) yozuvlar ham yaroqsiz bo'lib qoladi.
 */
export async function ensurePush(scope: PushScope): Promise<PushState> {
  if (!supported()) return "unsupported";
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return "off";

  try {
    const registration = await serviceWorkerRegistration();
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await postSubscription(scope, existing, registration);
      return "on";
    }
  } catch {
    return "off";
  }

  return enablePush(scope);
}

export async function enablePush(scope: PushScope): Promise<PushState> {
  if (!supported()) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  try {
    const registration = await serviceWorkerRegistration();

    const response = await fetch("/api/push/key", { cache: "no-store" });
    const data = (await response.json()) as { key?: string };
    if (!data.key) return "off";

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(data.key) as unknown as BufferSource,
      }));

    await postSubscription(scope, subscription, registration);

    return "on";
  } catch {
    return "off";
  }
}

/**
 * Bir vaqtda bir nechta komponent chaqirsa ham faqat bitta obuna yaratiladi.
 * Aks holda ikkinchi chaqiruv birinchisining obunasini bekor qilib yuboradi.
 */
let resetting: Promise<PushState> | null = null;

/** Eskirgan obunani butunlay tashlab, yangisini yaratadi */
export function resetPush(scope: PushScope): Promise<PushState> {
  if (!supported()) return Promise.resolve("unsupported");

  resetting ??= (async () => {
    try {
      const existing = await currentSubscription();
      if (existing) await existing.unsubscribe().catch(() => null);
    } catch {
      // unsubscribe bo'lmasa ham pastda qayta urinamiz
    }

    return enablePush(scope);
  })().finally(() => {
    resetting = null;
  });

  return resetting;
}

export async function disablePush(scope: PushScope): Promise<PushState> {
  if (!supported()) return "unsupported";

  try {
    const subscription = await currentSubscription();

    if (subscription) {
      await fetch(scope === "admin" ? "/api/admin/push/subscribe" : "/api/push/subscribe", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }

    return "off";
  } catch {
    return "off";
  }
}
