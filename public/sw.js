/* Telefon bildirishnomalari: yangi xabar kelganda OS oynasida ko'rsatiladi */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function keyToBytes(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const bytes = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }

  return bytes;
}

async function saveScope(scope) {
  const cache = await caches.open("push-scope");
  await cache.put("/scope", new Response(scope));
}

async function readScope() {
  const cache = await caches.open("push-scope");
  const response = await cache.match("/scope");
  return response ? response.text() : null;
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "push-scope" && event.data.scope) {
    event.waitUntil(saveScope(event.data.scope));
  }
});

/** Brauzer obunani yangilasa (eski endpoint yaroqsiz bo'lsa) — qayta ro'yxatdan o'tamiz */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch("/api/push/key", { cache: "no-store" });
        const data = await response.json();
        if (!data.key) return;

        const scope = (await readScope()) || "admin";
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(data.key),
        });
        const json = subscription.toJSON();

        await fetch(scope === "admin" ? "/api/admin/push/subscribe" : "/api/push/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
      } catch {
        // keyingi ochilishda sahifa o'zi qayta obuna bo'ladi
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Yangi bildirishnoma";
  const actions = data.action ? [{ action: "open", title: data.action }] : [];
  const options = {
    body: data.body || "",
    actions,
    icon: data.icon || "/logo-mark.png",
    // Android badge faqat bir rangli siluetni ko'rsatadi — rangli rasm oq kvadrat bo'ladi
    badge: "/logo-badge.png",
    tag: data.tag || "admin",
    renotify: true,
    data: { url: data.url || "/admin" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(event.notification.data?.url || "/admin", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          await client.navigate(target);
          return;
        }
      }

      await self.clients.openWindow(target);
    })(),
  );
});
