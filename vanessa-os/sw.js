/* Vanessa OS service worker — caches the app shell so the demo opens offline. */
var CACHE = "vos-shell-v5";
var SHELL = ["./", "index.html", "app.css", "app.js", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // network-first for the shell so updates land; cache fallback when offline
  e.respondWith(fetch(req, { cache: "no-cache" }).then(function (res) {
    var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
  }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match("index.html"); }); }));
});
