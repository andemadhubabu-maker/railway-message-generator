/* Railway Control Message Generator - offline support.
   Change VERSION whenever you publish a new index.html. */
var VERSION = "3.5.0";
var CACHE = "rcmg-v" + VERSION;
var FILES = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(FILES.map(function (u) {
        return fetch(u, { cache: "reload" }).then(function (r) {
          if (!r.ok) throw new Error("Failed to cache " + u);
          return c.put(u, r);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf("rcmg-v") === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  /* Google Fonts (Telugu / Hindi): keep a copy after first online use */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("rcmg-fonts").then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (r) { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  /* version.json must always come from the network */
  if (url.pathname.slice(-12) === "version.json") {
    e.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    if (req.mode === "navigate") return caches.match("index.html");
    return fetch(req);
  }));
});
