const CACHE = "hortis-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/uploads")) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok && (url.origin === self.location.origin)) {
            void caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Hortis", body: "Neue Erinnerung" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    /* ignore */
  }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body }));
});
