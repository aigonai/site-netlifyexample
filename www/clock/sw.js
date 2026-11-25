/* THE CLOCK WORKS WITH THE NETWORK GONE, after it has been opened once.
 *
 * WHY THIS PAGE MAY HAVE A SERVICE WORKER AT ALL. A cache is a copy on a disk nobody can
 * clear, so the app on the A1 server deliberately has none: its pages are somebody's
 * notes, rendered behind a session. This page is the opposite — static, public, the same
 * bytes for everybody, and the only thing that is personal (the city list) lives in
 * `localStorage` and was never fetched. There is nothing here a cache could leak.
 *
 * AND IT IS THE PAGE THAT MOST WANTS IT: a world clock is for telling what time it is
 * where other people are, which is a thing you want on a plane.
 *
 * STALE WHILE REVALIDATE. A request is answered from the cache at once — so the app opens
 * instantly and opens at all with no network — and the network copy, when it arrives,
 * replaces what is stored for next time. A deploy therefore lands on the SECOND open
 * after it, never later, and the reader never waits for the network to find that out.
 *
 * THE CACHE IS NAMED FOR A VERSION. Bump `VERSION` when the shell changes and the old
 * cache is deleted on activation, so a stale file cannot outlive its replacement.
 *
 * Copyright (c) 2026 Stefan Loesch. MIT licence: see static/clock/LICENSE.
 */

const VERSION = "clock-2026-11-18s";
const SHELL = [
  "/clock/",
  "/clock/index.html",
  "/clock/clock.css",
  "/clock/clock.js",
  "/clock/dials.js",
  "/clock/qr.js",
  "/clock/manifest.webmanifest",
  "/clock/clock-192.png?v=2",
  "/clock/clock-512.png?v=2",
  "/clock/apple-touch-icon.png?v=2",
  "/clock/gem.png?v=2"
];

self.addEventListener("install", (event) => {
  // One file failing must not fail the install and leave the app with no cache at all,
  // so each is added on its own and a miss is simply a file fetched from the network.
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      Promise.all(SHELL.map((path) => cache.add(path).catch(() => undefined)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== VERSION).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const ours = url.origin === self.location.origin && url.pathname.startsWith("/clock/");
  // The two faces come from Google. They are worth keeping for the same reason the page
  // is: without them an offline open falls back to a system font, which is a different
  // page. Opaque responses are stored as they are; that is all a cache can do with them.
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!ours && !fonts) return;

  // THE APP ITSELF IS FETCHED FRESH WHEN THERE IS A NETWORK, and only falls back to the
  // cache when there is not.
  //
  // Stale-while-revalidate is right for an icon and wrong for the program: it serves the
  // copy it has and fetches the new one for NEXT time, so a deploy arrives on the second
  // open, not the first. For a page being changed through the day that means the reader
  // is reliably one build behind and cannot tell — which is exactly what happened, and
  // looked like the change not having shipped at all.
  //
  // The cost is one network round trip on a page that is already open in a second; the
  // offline promise is untouched, because the fallback is the same cache as before.
  const program = request.mode === "navigate" ||
    url.pathname === "/clock/" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".webmanifest");

  event.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(request).then((stored) => {
        const fresh = fetch(request)
          .then((answer) => {
            // Only a real answer is worth storing. An error page cached under the app's
            // own address is the one failure that outlives the outage that caused it.
            if (answer && (answer.ok || answer.type === "opaque")) cache.put(request, answer.clone());
            return answer;
          })
          .catch(() => stored);
        return program ? fresh.then((answer) => answer || stored) : stored || fresh;
      })
    )
  );
});
