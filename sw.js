/* 둘이서 — 오프라인 지원
   앱 파일을 캐시에 담아 인터넷이 약해도 화면은 뜨게 한다. (데이터는 Supabase에서 온다)
   앱 파일을 고친 뒤에는 아래 CACHE 버전을 올려야 설치된 폰에도 반영된다. */
const CACHE = "duriseo-v8";

const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./config.js",
  "./vendor/supabase.min.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // cache: "reload" — 브라우저 HTTP 캐시(Pages는 10분)를 건너뛰고 서버에서 새로 받는다. 하나 실패해도 설치는 진행
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(new Request(a, { cache: "reload" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    // 옛 '둘이서 한잔'(doori-*)은 화면까지 캐시 우선이라, 앱을 열면 옛 화면이 먼저 뜬다
    const fromOldApp = keys.some((k) => k.startsWith("doori-"));
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    // 그 옛 화면을 새 앱으로 다시 연다 (한 번뿐 — 옛 캐시는 위에서 지워졌다)
    if (fromOldApp) {
      const wins = await self.clients.matchAll({ type: "window" });
      // navigate를 못 쓰는 브라우저는 그냥 넘어간다 (앱을 껐다 켜면 새 앱이 열린다)
      await Promise.all(wins.map((w) => Promise.resolve().then(() => w.navigate(w.url)).catch(() => {})));
    }
  })());
});

const put = (req, res) => {
  if (res && res.status === 200 && res.type === "basic") {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
  }
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 구글 폰트: 캐시 우선
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit)));
    return;
  }

  // Supabase 같은 바깥 요청은 건드리지 않는다
  if (url.origin !== self.location.origin) return;

  // 화면과 설정은 네트워크 우선 (Supabase 키를 넣고 배포하면 바로 반영되게)
  if (req.mode === "navigate" || url.pathname.endsWith("/config.js")) {
    e.respondWith(fetch(req).then((res) => put(req, res)).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html"))));
    return;
  }

  // 나머지 앱 파일: 캐시 먼저 보여주고 뒤에서 새로 받아 둔다
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => put(req, res)).catch(() => hit);
    return hit || net;
  }));
});
