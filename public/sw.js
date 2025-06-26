if (!self.define) {
  let e,
    i = {};
  const n = (n, s) => (
    (n = new URL(n + ".js", s).href),
    i[n] ||
      new Promise((i) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = n), (e.onload = i), document.head.appendChild(e);
        } else (e = n), importScripts(n), i();
      }).then(() => {
        let e = i[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (s, c) => {
    const a =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (i[a]) return;
    let r = {};
    const o = (e) => n(e, a),
      f = { module: { uri: a }, exports: r, require: o };
    i[a] = Promise.all(s.map((e) => f[e] || o(e))).then((e) => (c(...e), r));
  };
}
define(["./workbox-54cb1ce7"], function (e) {
  "use strict";
  self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "apple-touch-icon.png",
          revision: "d53eca1df8d2bce0294769d842175f49",
        },
        { url: "assets/index-CGU6NppZ.css", revision: null },
        { url: "assets/index-Q999fYGE.js", revision: null },
        { url: "assets/workbox-window.prod.es5-B9K5rw8f.js", revision: null },
        { url: "favicon.ico", revision: "53c388b2ce3320058a55beb684036423" },
        { url: "index.html", revision: "4430dc5228aa344a90afe67f6cf49928" },
        {
          url: "icon-512-maskable.png",
          revision: "bd8deca150c1557e7512f7fc80152f1b",
        },
        {
          url: "maskable-icon-512x512.png",
          revision: "af12e1043353a8968411c52f7eab66c5",
        },
        {
          url: "pwa-192x192.png",
          revision: "2afbea0b9f7d7ce55a995d64fb2347f7",
        },
        {
          url: "pwa-512x512.png",
          revision: "bd8deca150c1557e7512f7fc80152f1b",
        },
        { url: "pwa-64x64.png", revision: "d5162e43b3cae47b04c68595323ddeee" },
        { url: "favicon.ico", revision: "53c388b2ce3320058a55beb684036423" },
        {
          url: "apple-touch-icon.png",
          revision: "d53eca1df8d2bce0294769d842175f49",
        },
        {
          url: "icon-512-maskable.png",
          revision: "bd8deca150c1557e7512f7fc80152f1b",
        },
        { url: "pwa-64x64.png", revision: "d5162e43b3cae47b04c68595323ddeee" },
        {
          url: "pwa-192x192.png",
          revision: "2afbea0b9f7d7ce55a995d64fb2347f7",
        },
        {
          url: "pwa-512x512.png",
          revision: "bd8deca150c1557e7512f7fc80152f1b",
        },
        {
          url: "maskable-icon-512x512.png",
          revision: "af12e1043353a8968411c52f7eab66c5",
        },
        {
          url: "manifest.webmanifest",
          revision: "041785bd5b73aefb8331966a18a7aae0",
        },
      ],
      {}
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))
    ),
    e.registerRoute(
      /^https:\/\/prop\.digiheadway\.in\/api\/v3/,
      new e.NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
          new e.BackgroundSyncPlugin("api-sync", { maxRetentionTime: 1440 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      new e.CacheFirst({
        cacheName: "images-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET"
    );
});
