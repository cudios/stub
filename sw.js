const VERSION = "stub-mutnjzxh";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/fonts/geist-latin-400-normal.woff2",
  "./assets/fonts/geist-latin-500-normal.woff2",
  "./assets/fonts/geist-latin-600-normal.woff2",
  "./assets/fonts/geist-mono-latin-500-normal.woff2",
  "./assets/fonts/shantell-sans-latin-500-normal.woff2",
  "./assets/fonts/shantell-sans-latin-600-normal.woff2",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./src/config/firebase-config.js",
  "./src/core/bus.js",
  "./src/core/connectivity.js",
  "./src/core/firebase.js",
  "./src/core/pwa.js",
  "./src/core/router.js",
  "./src/core/store.js",
  "./src/data/attendees-repo.js",
  "./src/data/commit.js",
  "./src/data/event-session.js",
  "./src/data/events-repo.js",
  "./src/data/refs.js",
  "./src/data/scans-repo.js",
  "./src/domain/attendees.js",
  "./src/domain/collections.js",
  "./src/domain/conflicts.js",
  "./src/domain/dates.js",
  "./src/domain/ids.js",
  "./src/domain/pass-rules.js",
  "./src/domain/permissions.js",
  "./src/features/conflicts/conflict-copy.js",
  "./src/features/conflicts/conflict-detail.js",
  "./src/features/conflicts/conflicts-panel.js",
  "./src/features/entries/entries-panel.js",
  "./src/features/events/codes.js",
  "./src/features/events/settings-sheet.js",
  "./src/features/passes/attendee-sheets.js",
  "./src/features/passes/pass-card.js",
  "./src/features/passes/pass-image.js",
  "./src/features/passes/qr.js",
  "./src/features/scanner/camera.js",
  "./src/features/scanner/qr-reader.js",
  "./src/features/scanner/result-copy.js",
  "./src/features/scanner/scan-panel.js",
  "./src/features/scanner/scanner.js",
  "./src/main.js",
  "./src/screens/create.js",
  "./src/screens/day.js",
  "./src/screens/event.js",
  "./src/screens/home.js",
  "./src/screens/join.js",
  "./src/screens/not-found.js",
  "./src/screens/setup.js",
  "./src/ui/app-bar.js",
  "./src/ui/dom.js",
  "./src/ui/empty.js",
  "./src/ui/feedback.js",
  "./src/ui/fields.js",
  "./src/ui/icons.js",
  "./src/ui/labels.js",
  "./src/ui/sheet.js",
  "./src/ui/sync-status.js",
  "./src/ui/tabs.js",
  "./src/ui/toast.js",
  "./styles/base.css",
  "./styles/components.css",
  "./styles/pass.css",
  "./styles/scanner.css",
  "./styles/screens.css",
  "./styles/tokens.css",
  "./vendor/firebase.js",
  "./vendor/jsqr.js",
  "./vendor/qrcode.js"
];
const NETWORK_TIMEOUT_MS = 3500;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(VERSION);
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (fallbackPath) {
      const fallback = await cache.match(fallbackPath);
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(request, request.mode === "navigate" ? "./index.html" : null));
});
