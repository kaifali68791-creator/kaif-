/* ===========================================
   Kaif — Portfolio  |  sw.js
   Offline support. No dependencies, no Workbox.

   Strategy:
     - App shell (HTML/CSS/JS) is precached on install.
     - Local images are NOT precached: the profile photo is ~790 KB and the
       certificates ~510 KB combined, so precaching them would bloat the
       first install. They are cached the first time they are requested.
     - Local requests: cache-first, then network, then cache the result.
     - Cross-origin requests (WhatsApp, Instagram, GitHub, live demos) are
       left completely alone so they always hit the real network.
   =========================================== */
"use strict";

/* Bump this whenever you ship an update. The activate step deletes every
   cache that does not match, so users never get a stale mix of versions. */
var CACHE_VERSION = "v1";
var CACHE_NAME = "kaif-portfolio-" + CACHE_VERSION;

/* The small files needed to render the page with no connection. */
var APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./js/animations.js",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png"
];

/* ---------- Install: precache the shell ---------- */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      /* addAll is atomic: if one file 404s the whole install fails loudly
         instead of leaving a half-cached app. */
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ---------- Activate: drop old versions ---------- */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ---------- Fetch: cache-first for our own files only ---------- */
self.addEventListener("fetch", function (event) {
  var request = event.request;

  /* Never cache anything that is not a simple same-origin GET. This is what
     keeps external links and non-GET requests untouched. */
  if (request.method !== "GET") return;

  var url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;

      return fetch(request).then(function (response) {
        /* Only store real, successful, same-origin responses. Opaque and
           error responses are skipped so the cache cannot go bad. */
        if (response && response.status === 200 && response.type === "basic") {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        /* Offline and not cached: fall back to the cached page for navigations
           so the app still opens rather than showing the browser error. */
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      });
    })
  );
});