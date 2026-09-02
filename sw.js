/* 둘이서 한잔 — 오프라인 지원
   게임 파일을 캐시에 담아 인터넷 없이도 실행되게 한다.
   내용을 고친 뒤에는 아래 CACHE 버전을 올려야 갱신이 반영된다. */
const CACHE = "doori-v3";

// 앱 셸: 설치 시 미리 담아둔다 (상대경로 — 하위 경로 배포에서도 동작)
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // 하나라도 실패하면 설치 전체가 실패하므로 개별적으로 담는다
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 구글 폰트: 캐시 우선, 없으면 받아서 담아둔다 (오프라인 대비)
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com")) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => hit)   // 오프라인이면 시스템 폰트로 폴백됨
      )
    );
    return;
  }

  // 앱 자체 파일: 캐시 우선 (오프라인 최우선), 백그라운드로 갱신
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
