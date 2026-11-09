/* =====================================================================
   둘이서 — 앱 본체
   화면은 전부 이 파일이 그린다. 저장은 api가 맡는데, 둘 중 하나다.
     SupaApi : Supabase (두 사람 폰이 연동된다)
     DemoApi : 이 폰 안에만 저장 (서버 설정 전 둘러보기용, 상대 입장으로 바꿔 볼 수 있다)
   화면 코드는 api 종류를 몰라도 되게 짰다.
   ===================================================================== */
"use strict";
(() => {
const CFG = window.DURISEO_CONFIG || {};
const DATA = window.DURISEO_DATA;
const H = DATA.hearts;
const MODE_KEY = "duriseo_mode";       // "demo"면 데모로 연다

/* =====================================================================
   작은 도구들
   ===================================================================== */
const $ = (s) => document.querySelector(s);

// h("div", {class:"x", onclick: fn}, 자식들...) — 문자열 자식은 텍스트로만 들어간다
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}
const view = (...kids) => $("#view").replaceChildren(...kids.flat(Infinity).filter(Boolean));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    }));

const ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/></svg>',
  cal:  '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  q:    '<svg viewBox="0 0 24 24"><path d="M20.5 11.5c0 4.1-3.8 7.4-8.5 7.4-1.3 0-2.5-.2-3.6-.7L4 20l1.3-3.7A6.9 6.9 0 0 1 3.5 11.5C3.5 7.4 7.3 4 12 4s8.5 3.4 8.5 7.5z"/></svg>',
  bal:  '<svg viewBox="0 0 24 24"><path d="M12 4v16M7.5 20h9M5 7.5h14M5 7.5 2.5 14a2.6 2.6 0 0 0 5 0zM19 7.5 16.5 14a2.6 2.6 0 0 0 5 0z"/></svg>',
  map:  '<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  us:   '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.3C19.5 15.4 12 20 12 20z"/></svg>',
};
function icon(name) { const s = document.createElement("span"); s.innerHTML = ICON[name]; return s.firstChild; }

let toastTimer = null;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hide");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hide"), 2400);
}

/* ---------- 날짜 ---------- */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const dayNum = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const daysBetween = (a, b) => dayNum(b) - dayNum(a);
const addDays = (s, n) => { const [y, m, d] = s.split("-").map(Number); return ymd(new Date(y, m - 1, d + n)); };
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const weekday = (s) => { const [y, m, d] = s.split("-").map(Number); return WEEK[new Date(y, m - 1, d).getDay()]; };
function fmtDate(s) { const [, m, d] = s.split("-").map(Number); return `${m}월 ${d}일 (${weekday(s)})`; }
function fmtShort(s) { const [y, m, d] = s.split("-").map(Number); return `${y}.${m}.${d}`; }
function fmtTime(iso) { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

/* ---------- 조사: 이름 받침에 맞춘다 (지연이 / 민수가) ---------- */
const JOSA = { "가": ["가", "이"], "이": ["가", "이"], "는": ["는", "은"], "은": ["는", "은"], "를": ["를", "을"], "을": ["를", "을"],
               "와": ["와", "과"], "과": ["와", "과"], "랑": ["랑", "이랑"] };
function josa(name, rest) {
  const pair = JOSA[rest.charAt(0)];
  if (!pair) return name + rest;
  const c = name.trim().slice(-1).charCodeAt(0);
  const jong = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
  return name + (jong ? pair[1] : pair[0]) + rest.slice(1);
}

/* ---------- 커플마다 고정된 순서 (둘의 폰이 같은 순서를 본다) ---------- */
function hashStr(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffled(arr, seed) {
  const r = rng(seed), a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const memoStore = {};
const memo = (k, f) => memoStore[k] || (memoStore[k] = f());

/* =====================================================================
   콘텐츠 색인 (data.js)
   ===================================================================== */
const Q = [], QMAP = {};
DATA.categories.forEach((c) => c.qs.forEach((text, i) => {
  const q = { id: `${c.id}-${i + 1}`, cat: c.id, text }; Q.push(q); QMAP[q.id] = q;
}));
const CAT = Object.fromEntries(DATA.categories.map((c) => [c.id, c]));
const BAL = DATA.balance.map(([a, b, cat], i) => ({ id: `b-${i + 1}`, a, b, cat }));
const BMAP = Object.fromEntries(BAL.map((x) => [x.id, x]));
const OBJ = Object.fromEntries(DATA.objects.map((o) => [o.key, o]));
const WALL = Object.fromEntries(DATA.walls.map((w) => [w.key, w]));
const FLOOR = Object.fromEntries(DATA.floors.map((f) => [f.key, f]));

// 지도에 저장하는 장소 분류. KCAT은 카카오 장소 분류 코드 → 우리 분류 (저장할 때 처음 골라 두는 값)
const PCAT = { food: { ic: "🍽️", name: "맛집" }, cafe: { ic: "☕", name: "카페" }, dessert: { ic: "🍰", name: "디저트" },
               bar: { ic: "🍺", name: "술집" }, play: { ic: "🎡", name: "놀거리" }, trip: { ic: "🧳", name: "여행" },
               etc: { ic: "📍", name: "기타" } };
const KCAT = { FD6: "food", CE7: "cafe", AT4: "play", CT1: "play", AD5: "trip" };
function guessCat(r) {
  const n = r.category_name || "";
  if (/술집|호프|이자카야|와인|칵테일|포차/.test(n)) return "bar";
  if (/디저트|제과|베이커리|아이스크림|도넛|케이크/.test(n)) return "dessert";
  return KCAT[r.category_group_code] || "etc";
}
// 장소 안에서 근처를 찾을 때 누르는 빠른 버튼 [보이는 글, 검색어]
const NEAR_QUICK = [["☕ 카페", "카페"], ["🍽️ 맛집", "맛집"], ["🍰 디저트", "디저트"], ["🍺 술집", "술집"], ["🎡 볼거리", "관광명소"]];

// 오늘의 질문: 카테고리를 번갈아 섞은 커플 고유 순서에서, 커플 만든 날부터 하루에 하나씩
function questionOrder(couple) {
  return memo("qo:" + couple.id, () => {
    const seed = hashStr(couple.id);
    const lists = DATA.categories.map((c, i) => shuffled(Q.filter((q) => q.cat === c.id), seed + i * 7919));
    const out = [], max = Math.max(...lists.map((l) => l.length));
    for (let k = 0; k < max; k++) for (const l of lists) if (k < l.length) out.push(l[k]);
    return out;
  });
}
function todayQ(couple = S.couple) {
  const order = questionOrder(couple);
  const idx = Math.max(0, daysBetween(ymd(new Date(couple.created_at)), today()));
  return order[idx % order.length];
}
const balOrder = () => memo("bo:" + S.couple.id, () => shuffled(BAL, hashStr(S.couple.id) ^ 0x9E3779B9));

/* =====================================================================
   상태
   ===================================================================== */
const S = {
  api: null,
  user: null,        // {id, email}
  couple: null,      // couples 행
  members: [],       // [{user_id, nickname}]
  answers: {},       // question_id -> {user_id: {answer, created_at}}
  picks: {},         // item_id -> {user_id: {pick, created_at}}
  room: [],          // room_items 행
  entryCount: 0,
  entries: {},       // "YYYY-MM" -> entries 행들
  urls: {},          // 사진 경로 -> 보여줄 주소
  tab: "home",
  calMonth: today().slice(0, 7),
  qCat: null,        // 질문 탭에서 연 카테고리
  qEdit: false,
  balShow: null,     // 방금 고른 밸런스 문항 (결과 화면 유지용)
  editing: false,    // 방 꾸미기 중
  sel: null,         // 고른 오브제 id
  dragging: false,
  shopTab: "shop",
  dayForm: null,
  wishes: [],        // wishes 행 (영화 · 장소)
  reviews: {},       // wish_id -> {user_id: {stars, review, created_at}}
  wishesErr: null,   // 목록을 못 불러왔을 때 보여줄 말 (setup.sql을 다시 안 돌렸으면 테이블이 없다)
  wishTab: { movie: "todo", place: "todo" },
  wishEdit: false,   // 목록 시트에서 제목·메모 고치는 중
  revEdit: false,    // 내 별점 고치는 중
  revDraft: null,    // 쓰는 중인 별점 {stars, text}
  mapResults: null,  // 장소 검색 결과 {q, loading, list, near: 근처 검색이면 그 장소 id}
  mapPlace: null,    // 지도 탭에서 들어가 있는 장소 id (그 안에 갈 곳을 모아 보는 화면)
  mapFocus: null,    // 지도를 다시 그릴 때 가운데로 옮길 장소 id
  drafts: {},        // 화면이 다시 그려져도 남겨 둘 입력값 (data-k별)
  events: [],        // 캘린더 일정 · 생일 (반복 포함)
  eventsErr: null,   // 일정을 못 불러왔을 때 보여줄 말
  evForm: null,      // 날짜 시트에서 쓰는 중인 일정 {id?, title, day, repeat, icon}
};
const me = () => S.user && S.user.id;
const partner = () => S.members.find((m) => m.user_id !== me());
const pid = () => { const p = partner(); return p && p.user_id; };
const nick = (uid) => {
  const m = S.members.find((x) => x.user_id === uid);
  return (m && m.nickname) || (uid === me() ? "나" : "상대");
};
const ansOf = (qid, uid) => uid && S.answers[qid] && S.answers[qid][uid];
const pickOf = (id, uid) => uid && S.picks[id] && S.picks[id][uid] && S.picks[id][uid].pick;
const bothAnswered = (qid) => !!(ansOf(qid, me()) && ansOf(qid, pid()));
const waitingQs = () => Q.filter((q) => ansOf(q.id, pid()) && !ansOf(q.id, me()));
const waitingPicks = () => BAL.filter((b) => pickOf(b.id, pid()) && !pickOf(b.id, me()));
const revOf = (wid, uid) => uid && S.reviews[wid] && S.reviews[wid][uid];
// 같이 했는데 상대만 별점을 남긴 것 (내가 남기면 열린다)
const waitingRevs = (kind) => S.wishes.filter((w) => w.kind === kind && w.done_on && revOf(w.id, pid()) && !revOf(w.id, me()));

function priceOf(key) {
  if (key.startsWith("wall:")) return (WALL[key.slice(5)] || {}).price || 0;
  if (key.startsWith("floor:")) return (FLOOR[key.slice(6)] || {}).price || 0;
  return (OBJ[key] || {}).price || 0;
}
// 하트 = 시작 선물 + 둘이 한 활동 − 산 물건. 따로 저장하지 않고 매번 센다.
function hearts() {
  let n = H.start + S.entryCount * H.entry;
  for (const k in S.answers) n += Object.keys(S.answers[k]).length * H.answer;
  for (const k in S.picks) n += Object.keys(S.picks[k]).length * H.pick;
  for (const it of S.room) n -= priceOf(it.object_key);
  return n;
}

/* ---------- 기념일 ---------- */
function annivLabel(ds) {
  const s = S.couple && S.couple.start_date;
  if (!s) return "";
  const n = daysBetween(s, ds) + 1;
  if (n === 1) return "시작한 날";
  if (n > 1 && n % 100 === 0) return `${n}일`;
  const [sy, sm, sd] = s.split("-").map(Number), [y, m, d] = ds.split("-").map(Number);
  if (y > sy && m === sm && d === sd) return `${y - sy}주년`;
  return "";
}
function nextAnniv() {
  if (!S.couple.start_date) return null;
  const t = today();
  for (let i = 0; i <= 400; i++) {
    const ds = addDays(t, i), l = annivLabel(ds);
    if (l && l !== "시작한 날") return { date: ds, label: l, in: i };
  }
  return null;
}

/* ---------- 반복 일정 ---------- */
const REPEAT = { none: "반복 안 함", weekly: "매주", monthly: "매월", yearly: "매년" };
const EV_ICONS = [["📌", "일정"], ["🎂", "생일"], ["💝", "기념일"], ["🎉", "이벤트"], ["✈️", "여행"], ["⭐", "기타"]];
const daysIn = (y, m) => new Date(y, m, 0).getDate();
// 매월 31일 · 2월 29일처럼 그 달에 없는 날은 그 달 마지막 날로
function clampYmd(y, m, d) { return `${y}-${pad(m)}-${pad(Math.min(d, daysIn(y, m)))}`; }
function occursOn(ev, ds) {
  if (ds < ev.day) return false;
  const [, sm, sd] = ev.day.split("-").map(Number), [y, m] = ds.split("-").map(Number);
  switch (ev.repeat) {
    case "weekly": return daysBetween(ev.day, ds) % 7 === 0;
    case "monthly": return ds === clampYmd(y, m, sd);
    case "yearly": return ds === clampYmd(y, sm, sd);
    default: return ds === ev.day;
  }
}
// from 날짜부터 처음 돌아오는 날 (없으면 null)
function nextOcc(ev, from) {
  if (ev.day >= from) return ev.day;
  const [, sm, sd] = ev.day.split("-").map(Number), [fy, fm] = from.split("-").map(Number);
  switch (ev.repeat) {
    case "weekly": return addDays(ev.day, Math.ceil(daysBetween(ev.day, from) / 7) * 7);
    case "monthly": for (let i = 0; i < 13; i++) {
      const y = fy + Math.floor((fm - 1 + i) / 12), m = (fm - 1 + i) % 12 + 1, ds = clampYmd(y, m, sd);
      if (ds >= from) return ds;
    } return null;
    case "yearly": { const a = clampYmd(fy, sm, sd); return a >= from ? a : clampYmd(fy + 1, sm, sd); }
    default: return null;
  }
}
const eventsOn = (ds) => S.events.filter((e) => occursOn(e, ds));
// 그날 같이 한 것 (다녀온 곳 · 같이 본 영화) — 지도·영화에서 고른 날짜가 캘린더에 그대로 뜬다
const doneOn = (ds) => S.wishes.filter((w) => w.done_on === ds);
const doneIcon = (w) => (w.kind === "movie" ? "🎬" : "📍");
// 다가오는 날: 100일 단위·주년 기념일 + 일정들 중 가까운 순
function upcoming(n) {
  const t = today(), out = [];
  const na = nextAnniv();
  if (na) out.push({ date: na.date, icon: "💗", title: `${na.label} 기념일` });
  for (const e of S.events) {
    const d = nextOcc(e, t);
    if (d && daysBetween(t, d) <= 366) out.push({ date: d, icon: e.icon, title: e.title });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).slice(0, n);
}

/* =====================================================================
   API — Supabase
   ===================================================================== */
function SupaApi() {
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const ok = (r) => { if (r.error) throw r.error; return r.data; };
  const cid = () => S.couple.id;
  const uid = () => S.user.id;
  return {
    kind: "supabase",
    async session() {
      const { data } = await sb.auth.getSession();
      const u = data.session && data.session.user;
      return u ? { id: u.id, email: u.email } : null;
    },
    onSignedOut(cb) { sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") cb(); }); },
    async signUp(email, password) {
      const d = ok(await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } }));
      return d.session ? { id: d.user.id, email: d.user.email } : null;   // null = 메일 확인 필요
    },
    async signIn(email, password) {
      const d = ok(await sb.auth.signInWithPassword({ email, password }));
      return { id: d.user.id, email: d.user.email };
    },
    async signOut() { await sb.auth.signOut(); },

    async loadCouple() {
      const m = ok(await sb.from("couple_members").select("couple_id").eq("user_id", uid()).maybeSingle());
      if (!m) return null;
      const couple = ok(await sb.from("couples").select("*").eq("id", m.couple_id).single());
      const members = ok(await sb.from("couple_members").select("user_id,nickname,joined_at").eq("couple_id", couple.id).order("joined_at"));
      return { couple, members };
    },
    async createCouple(nickname, start) { return ok(await sb.rpc("create_couple", { p_nickname: nickname, p_start: start || null })); },
    async joinCouple(code, nickname) { return ok(await sb.rpc("join_couple", { p_code: code, p_nickname: nickname })); },
    async leaveCouple() {
      // 마지막 한 명이 나가면 커플 데이터가 지워지니, 사진 파일도 미리 지운다 (파일은 SQL로 못 지운다)
      try {
        const left = ok(await sb.from("couple_members").select("user_id").eq("couple_id", cid()));
        if (left.length <= 1) {
          const bucket = sb.storage.from("photos");
          for (let i = 0; i < 100; i++) {
            const files = ok(await bucket.list(cid(), { limit: 100 })).filter((f) => f.id);
            if (!files.length) break;
            ok(await bucket.remove(files.map((f) => `${cid()}/${f.name}`)));
          }
        }
      } catch (e) { console.warn(e); }
      ok(await sb.rpc("leave_couple"));
    },
    async updateCouple(patch) { ok(await sb.from("couples").update(patch).eq("id", cid())); },
    async updateNickname(nickname) { ok(await sb.from("couple_members").update({ nickname }).eq("couple_id", cid()).eq("user_id", uid())); },

    async loadAnswers() { return ok(await sb.from("answers").select("question_id,user_id,answer,created_at").eq("couple_id", cid())); },
    async loadPicks() { return ok(await sb.from("balance_picks").select("item_id,user_id,pick,created_at").eq("couple_id", cid())); },
    async loadRoom() { return ok(await sb.from("room_items").select("*").eq("couple_id", cid()).order("created_at")); },
    async countEntries() {
      const r = await sb.from("entries").select("id", { count: "exact", head: true }).eq("couple_id", cid());
      if (r.error) throw r.error;
      return r.count || 0;
    },
    async loadEntries(from, to) {
      return ok(await sb.from("entries").select("*").eq("couple_id", cid()).gte("day", from).lte("day", to).order("created_at"));
    },

    async saveAnswer(qid, answer) {
      ok(await sb.from("answers").upsert({ couple_id: cid(), question_id: qid, user_id: uid(), answer },
        { onConflict: "couple_id,question_id,user_id" }));
    },
    async savePick(item_id, pick) {
      ok(await sb.from("balance_picks").upsert({ couple_id: cid(), item_id, user_id: uid(), pick },
        { onConflict: "couple_id,item_id,user_id" }));
    },
    async addEntry({ day, memo: text, photo, thumb }) {
      let photo_path = null, thumb_path = null;
      if (photo) {
        const id = uuid(), bucket = sb.storage.from("photos");
        photo_path = `${cid()}/${id}.jpg`;
        thumb_path = `${cid()}/${id}_t.jpg`;
        ok(await bucket.upload(photo_path, photo, { contentType: "image/jpeg" }));
        ok(await bucket.upload(thumb_path, thumb, { contentType: "image/jpeg" }));
      }
      return ok(await sb.from("entries").insert({ couple_id: cid(), user_id: uid(), day, memo: text, photo_path, thumb_path }).select().single());
    },
    async deleteEntry(e) {
      ok(await sb.from("entries").delete().eq("id", e.id));
      const paths = [e.photo_path, e.thumb_path].filter(Boolean);
      if (paths.length) await sb.storage.from("photos").remove(paths);
    },
    async buyItem(object_key, extra) {
      return ok(await sb.from("room_items").insert({ couple_id: cid(), object_key, ...extra }).select().single());
    },
    async updateItem(id, patch) { ok(await sb.from("room_items").update(patch).eq("id", id)); },
    async loadWishes() { return ok(await sb.from("wishes").select("*").eq("couple_id", cid()).order("created_at")); },
    async loadReviews() { return ok(await sb.from("wish_reviews").select("wish_id,user_id,stars,review,created_at").eq("couple_id", cid())); },
    async addWish(row) { return ok(await sb.from("wishes").insert({ couple_id: cid(), ...row }).select().single()); },
    async updateWish(id, patch) { ok(await sb.from("wishes").update(patch).eq("id", id)); },
    async deleteWish(id) { ok(await sb.from("wishes").delete().eq("id", id)); },
    async saveReview(wish_id, stars, review) {
      ok(await sb.from("wish_reviews").upsert({ wish_id, couple_id: cid(), user_id: uid(), stars, review },
        { onConflict: "wish_id,user_id" }));
    },
    async loadEvents() { return ok(await sb.from("events").select("*").eq("couple_id", cid()).order("day")); },
    async addEvent(row) { return ok(await sb.from("events").insert({ couple_id: cid(), ...row }).select().single()); },
    async updateEvent(id, patch) { ok(await sb.from("events").update(patch).eq("id", id)); },
    async deleteEvent(id) { ok(await sb.from("events").delete().eq("id", id)); },
    async urls(paths) {
      const r = ok(await sb.storage.from("photos").createSignedUrls(paths, 6 * 3600));
      const out = {};
      for (const x of r) if (x.signedUrl && x.path) out[x.path] = x.signedUrl;
      return out;
    },
    subscribe(onChange) {
      const id = cid();
      const ch = sb.channel("duriseo-" + id);
      // 목록 테이블이 아직 없으면(setup.sql을 다시 안 돌렸으면) 구독에서 뺀다 — 없는 테이블이 끼면 채널 전체가 실패한다
      const wishT = (S.wishesErr ? [] : ["wishes", "wish_reviews"]).concat(S.eventsErr ? [] : ["events"]);
      for (const t of ["answers", "balance_picks", "room_items", "entries", "couple_members", ...wishT])
        ch.on("postgres_changes", { event: "*", schema: "public", table: t, filter: `couple_id=eq.${id}` }, () => onChange(t));
      ch.on("postgres_changes", { event: "*", schema: "public", table: "couples", filter: `id=eq.${id}` }, () => onChange("couples"));
      // 필터를 건 구독에는 삭제가 오지 않으므로, 삭제는 따로 받는다 (지워진 행의 id만 온다)
      for (const t of ["entries", "room_items", "couple_members", ...wishT])
        ch.on("postgres_changes", { event: "DELETE", schema: "public", table: t }, () => onChange(t));
      ch.subscribe();
      return () => sb.removeChannel(ch);
    },
  };
}

/* =====================================================================
   API — 데모 (이 폰에만 저장)
   ===================================================================== */
function DemoApi() {
  const KEY = "duriseo_demo_v1", ME = "u-me", YOU = "u-you";
  let D = null;
  try { D = JSON.parse(localStorage.getItem(KEY)); } catch (e) { D = null; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { throw new Error("demo_quota"); } };
  const uid = () => D.as;
  const copy = (o) => JSON.parse(JSON.stringify(o));
  const stamp = () => new Date().toISOString();

  async function seed() {
    const couple = {
      id: "demo-" + Math.random().toString(36).slice(2, 10), invite_code: "DEMO26",
      start_date: addDays(today(), -87), wall: "cream", floor: "wood",
      created_at: new Date(Date.now() - 2 * 864e5).toISOString(),
    };
    const now = stamp();
    D = { as: ME, couple, answers: [], picks: [], room: [], entries: [], photos: {},
          members: [{ user_id: ME, nickname: "하늘", joined_at: now }, { user_id: YOU, nickname: "바다", joined_at: now }] };
    const say = (qid, who, answer) => D.answers.push({ question_id: qid, user_id: who, answer, created_at: now });
    say(todayQ(couple).id, YOU, "이건 진짜 한참 고민했어. 너는 뭐라고 했는지 너무 궁금하다!");
    say("light-1", YOU, "요즘 출근길에 잔나비 노래만 들어. 가사가 너무 좋아서.");
    say("light-1", ME, "나는 아이유 신곡 무한 반복 중 😆");
    say("us-1", YOU, "처음엔 좀 무뚝뚝해 보였는데, 웃는 거 보고 바로 반했어 ㅋㅋ");
    say("love-1", YOU, "내가 말 안 해도 먼저 알아채 줄 때. 그때 진짜 사랑받는다고 느껴.");
    say("future-1", YOU, "지금처럼 웃고 있을 것 같아. 강아지 한 마리랑 같이!");
    const bo = shuffled(BAL, hashStr(couple.id) ^ 0x9E3779B9);
    bo.slice(0, 6).forEach((b, i) => D.picks.push({ item_id: b.id, user_id: YOU, pick: i % 3 ? "a" : "b", created_at: now }));
    bo.slice(0, 3).forEach((b, i) => D.picks.push({ item_id: b.id, user_id: ME, pick: i % 2 ? "b" : "a", created_at: now }));
    const put = (key, x, y) => D.room.push({ id: uuid(), couple_id: couple.id, object_key: key, x, y, scale: 1, flip: false, placed: true, created_at: now });
    put("window", 72, 42); put("sofa", 47, 88); put("pot", 15, 86);
    const e1 = { id: uuid(), couple_id: couple.id, user_id: YOU, day: addDays(today(), -2),
                 memo: "처음 가 본 파스타집 진짜 맛있었다. 다음엔 크림 말고 로제!", photo_path: null, thumb_path: null, created_at: now };
    const ph = demoPhoto();
    if (ph) { e1.photo_path = `demo/${e1.id}.jpg`; e1.thumb_path = `demo/${e1.id}_t.jpg`; D.photos[e1.photo_path] = ph.big; D.photos[e1.thumb_path] = ph.small; }
    D.entries.push(e1);
    D.entries.push({ id: uuid(), couple_id: couple.id, user_id: ME, day: addDays(today(), -5),
                     memo: "비 와서 집에서 영화 본 날. 팝콘 다 쏟은 건 비밀 🍿", photo_path: null, thumb_path: null, created_at: now });
    seedWishes();
    save();
  }
  // 영화 · 장소 예시 (목록 기능이 생기기 전에 만든 데모에도 채워 넣는다)
  function seedWishes() {
    const now = stamp();
    D.wishes = []; D.reviews = [];
    const add = (kind, title, extra) => {
      const w = { id: uuid(), couple_id: D.couple.id, kind, title, memo: "", added_by: ME, done_on: null,
                  lat: null, lng: null, address: null, place_url: null, place_cat: null, created_at: now, ...extra };
      D.wishes.push(w); return w;
    };
    const rev = (w, who, stars, review) => D.reviews.push({ wish_id: w.id, couple_id: D.couple.id, user_id: who, stars, review, created_at: now });
    add("movie", "인사이드 아웃 2", { added_by: YOU, memo: "팝콘은 큰 걸로! 🍿" });
    add("movie", "듄: 파트 2", { memo: "이건 꼭 큰 화면으로 보자" });
    rev(add("movie", "어바웃 타임", { added_by: YOU, done_on: addDays(today(), -12), memo: "비 오는 날 집에서" }), YOU, 5, "세 번째 보는데도 울었어…");
    add("place", "서울숲", { added_by: YOU, memo: "날 좋을 때 돗자리 들고 피크닉!", lat: 37.5444, lng: 127.0374, address: "서울 성동구 뚝섬로 273", place_cat: "play" });
    add("place", "북촌 한옥마을", { memo: "한복 입고 사진 찍기", lat: 37.5826, lng: 126.9850, address: "서울 종로구 계동", place_cat: "trip" });
    const tower = add("place", "N서울타워", { added_by: YOU, done_on: addDays(today(), -30), memo: "자물쇠 걸기", lat: 37.5512, lng: 126.9882,
                                               address: "서울 용산구 남산공원길 105", place_cat: "play" });
    rev(tower, ME, 4, "야경 최고. 바람은 너무 불었다");
    rev(tower, YOU, 5, "우리 자물쇠 아직 있을까?");
    seedKids();
    seedEvents();
  }
  // 일정 예시: 둘의 생일(매년) · 토요일마다 같이 하는 것(매주)
  function seedEvents() {
    const now = stamp(), y96 = (ds) => "1996" + ds.slice(4);      // 1996년은 윤년이라 2월 29일도 된다
    const ev = (title, icon, day, repeat, who) => ({ id: uuid(), couple_id: D.couple.id, title, icon, day, repeat, created_by: who, created_at: now });
    const sat = addDays(today(), -((new Date().getDay() + 1) % 7));   // 이번 주(지난) 토요일
    D.events = [
      ev("바다 생일", "🎂", y96(addDays(today(), 20)), "yearly", ME),
      ev("하늘 생일", "🎂", y96(addDays(today(), -100)), "yearly", YOU),
      ev("같이 러닝하는 날", "⭐", addDays(sat, -21), "weekly", YOU),
    ];
  }
  // 장소 안에 갈 곳 예시 (이 기능이 생기기 전에 만든 데모에도 한 번 넣는다)
  function seedKids() {
    D.kids = true;
    const p = D.wishes.find((w) => w.kind === "place" && w.title === "북촌 한옥마을" && !w.parent_id);
    if (!p) return;
    const now = stamp();
    const kid = (title, extra) => D.wishes.push({ id: uuid(), couple_id: D.couple.id, kind: "place", title, memo: "", added_by: ME, done_on: null,
      lat: null, lng: null, address: null, place_url: null, place_cat: "etc", parent_id: p.id, created_at: now, ...extra });
    kid("골목 안 한옥 찻집 (예시)", { added_by: YOU, place_cat: "cafe", memo: "마당 보이는 창가 자리!", lat: 37.5822, lng: 126.9838, address: "서울 종로구 북촌로" });
    kid("손칼국수집 (예시)", { place_cat: "food", memo: "점심은 여기서", lat: 37.5809, lng: 126.9861, address: "서울 종로구 계동길" });
  }
  function demoPhoto() {
    try {
      const c = document.createElement("canvas"); c.width = 800; c.height = 600;
      const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 800, 600);
      gr.addColorStop(0, "#FFD3DC"); gr.addColorStop(1, "#FFE9C9");
      g.fillStyle = gr; g.fillRect(0, 0, 800, 600);
      g.font = "220px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("🍝", 400, 310);
      const s = document.createElement("canvas"); s.width = 240; s.height = 180;
      s.getContext("2d").drawImage(c, 0, 0, 240, 180);
      return { big: c.toDataURL("image/jpeg", 0.8), small: s.toDataURL("image/jpeg", 0.75) };
    } catch (e) { return null; }
  }
  const toDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });

  return {
    kind: "demo",
    async session() {
      if (!D) await seed();
      if (!D.wishes) { seedWishes(); save(); }
      if (!D.kids) { seedKids(); save(); }
      if (!D.events) { seedEvents(); save(); }
      return { id: D.as, email: D.as === ME ? "하늘@데모" : "바다@데모" };
    },
    async signOut() {},
    async loadCouple() { return { couple: copy(D.couple), members: copy(D.members) }; },
    async leaveCouple() { localStorage.removeItem(KEY); D = null; },
    async updateCouple(patch) { Object.assign(D.couple, patch); save(); },
    async updateNickname(n) { D.members.find((m) => m.user_id === uid()).nickname = n; save(); },
    async loadAnswers() { return copy(D.answers); },
    async loadPicks() { return copy(D.picks); },
    async loadRoom() { return copy(D.room); },
    async countEntries() { return D.entries.length; },
    async loadEntries(from, to) { return copy(D.entries.filter((e) => e.day >= from && e.day <= to)); },
    async saveAnswer(qid, answer) {
      const a = D.answers.find((x) => x.question_id === qid && x.user_id === uid());
      if (a) a.answer = answer; else D.answers.push({ question_id: qid, user_id: uid(), answer, created_at: stamp() });
      save();
    },
    async savePick(item_id, pick) {
      const p = D.picks.find((x) => x.item_id === item_id && x.user_id === uid());
      if (p) p.pick = pick; else D.picks.push({ item_id, user_id: uid(), pick, created_at: stamp() });
      save();
    },
    async addEntry({ day, memo: text, photo, thumb }) {
      const e = { id: uuid(), couple_id: D.couple.id, user_id: uid(), day, memo: text, photo_path: null, thumb_path: null, created_at: stamp() };
      if (photo) {
        e.photo_path = `demo/${e.id}.jpg`; e.thumb_path = `demo/${e.id}_t.jpg`;
        D.photos[e.photo_path] = await toDataURL(photo); D.photos[e.thumb_path] = await toDataURL(thumb);
      }
      D.entries.push(e);
      try { save(); } catch (err) { D.entries.pop(); delete D.photos[e.photo_path]; delete D.photos[e.thumb_path]; throw err; }
      return copy(e);
    },
    async deleteEntry(e) {
      D.entries = D.entries.filter((x) => x.id !== e.id);
      delete D.photos[e.photo_path]; delete D.photos[e.thumb_path]; save();
    },
    async buyItem(object_key, extra) {
      const it = { id: uuid(), couple_id: D.couple.id, object_key, x: 50, y: 74, scale: 1, flip: false, placed: false, created_at: stamp(), ...extra };
      D.room.push(it); save(); return copy(it);
    },
    async updateItem(id, patch) { const it = D.room.find((r) => r.id === id); if (it) Object.assign(it, patch); save(); },
    async loadWishes() { return copy(D.wishes || []); },
    async loadReviews() { return copy(D.reviews || []); },
    async addWish(row) {
      const w = { id: uuid(), couple_id: D.couple.id, added_by: uid(), memo: "", done_on: null, lat: null, lng: null,
                  address: null, place_url: null, place_cat: null, parent_id: null, created_at: stamp(), ...row };
      D.wishes.push(w); save(); return copy(w);
    },
    async updateWish(id, patch) { const w = D.wishes.find((x) => x.id === id); if (w) Object.assign(w, patch); save(); },
    async deleteWish(id) {      // 서버처럼 안에 넣은 곳도 같이 지운다
      const gone = new Set([id, ...D.wishes.filter((x) => x.parent_id === id).map((x) => x.id)]);
      D.wishes = D.wishes.filter((x) => !gone.has(x.id)); D.reviews = D.reviews.filter((r) => !gone.has(r.wish_id)); save();
    },
    async loadEvents() { return copy(D.events || []); },
    async addEvent(row) {
      const e = { id: uuid(), couple_id: D.couple.id, created_by: uid(), repeat: "none", icon: "📌", created_at: stamp(), ...row };
      D.events.push(e); save(); return copy(e);
    },
    async updateEvent(id, patch) { const e = D.events.find((x) => x.id === id); if (e) Object.assign(e, patch); save(); },
    async deleteEvent(id) { D.events = D.events.filter((x) => x.id !== id); save(); },
    async saveReview(wish_id, stars, review) {
      const r = D.reviews.find((x) => x.wish_id === wish_id && x.user_id === uid());
      if (r) Object.assign(r, { stars, review }); else D.reviews.push({ wish_id, couple_id: D.couple.id, user_id: uid(), stars, review, created_at: stamp() });
      save();
    },
    async urls(paths) { const out = {}; for (const p of paths) if (D.photos[p]) out[p] = D.photos[p]; return out; },
    subscribe() { return () => {}; },
    switchUser() { D.as = D.as === ME ? YOU : ME; save(); },
    reset() { localStorage.removeItem(KEY); D = null; },
  };
}

/* =====================================================================
   불러오기 · 실시간
   ===================================================================== */
function setAnswers(rows) {
  S.answers = {};
  for (const r of rows) (S.answers[r.question_id] || (S.answers[r.question_id] = {}))[r.user_id] = { answer: r.answer, created_at: r.created_at };
}
function setPicks(rows) {
  S.picks = {};
  for (const r of rows) (S.picks[r.item_id] || (S.picks[r.item_id] = {}))[r.user_id] = { pick: r.pick, created_at: r.created_at };
}
async function loadMonth(ym, force) {
  if (S.entries[ym] && !force) return;
  const [y, m] = ym.split("-").map(Number);
  const rows = await S.api.loadEntries(`${ym}-01`, ymd(new Date(y, m, 0)));
  S.entries[ym] = rows;
  const need = rows.map((r) => r.thumb_path).filter((p) => p && !S.urls[p]);
  if (need.length) Object.assign(S.urls, await S.api.urls(need));
}
function setReviews(rows) {
  S.reviews = {};
  for (const r of rows) (S.reviews[r.wish_id] || (S.reviews[r.wish_id] = {}))[r.user_id] = { stars: r.stars, review: r.review, created_at: r.created_at };
}
// 영화 · 장소 목록. 실패해도 앱의 나머지는 그대로 쓰게 던지지 않는다
async function loadWishData() {
  try {
    const [w, r] = await Promise.all([S.api.loadWishes(), S.api.loadReviews()]);
    S.wishes = w; setReviews(r); S.wishesErr = null;
  } catch (e) {
    console.warn(e);
    S.wishes = []; S.reviews = {};
    S.wishesErr = /schema cache|does not exist|Could not find the/i.test(String((e && e.message) || e))
      ? "이 기능을 쓰려면 Supabase SQL Editor에서 setup.sql을 한 번 더 실행해 주세요" : errMsg(e);
  }
}
// 일정. 실패해도(테이블이 아직 없어도) 캘린더의 나머지는 그대로 쓴다
async function loadEventData() {
  try { S.events = await S.api.loadEvents(); S.eventsErr = null; }
  catch (e) {
    console.warn(e);
    S.events = [];
    S.eventsErr = /schema cache|does not exist|Could not find the/i.test(String((e && e.message) || e))
      ? "일정·생일을 넣으려면 Supabase SQL Editor에서 setup.sql을 한 번 더 실행해 주세요" : errMsg(e);
  }
}
let urlsAt = 0;       // 사진 주소를 받은 시각. Supabase 주소는 6시간이면 만료된다
async function loadAll() {
  const [ans, picks, room, cnt] = await Promise.all([S.api.loadAnswers(), S.api.loadPicks(), S.api.loadRoom(), S.api.countEntries(),
    loadWishData(), loadEventData()]);
  setAnswers(ans); setPicks(picks); S.room = room; S.entryCount = cnt;
  S.entries = {}; S.urls = {}; urlsAt = Date.now();
  await loadMonth(S.calMonth, true);
}

// 상대가 뭔가 바꾸면 해당 데이터만 다시 읽고 화면을 갱신한다 (잠깐 모았다가 한 번에)
const pending = new Set();
let flushTimer = null;
function onRemote(table) { pending.add(table); clearTimeout(flushTimer); flushTimer = setTimeout(flushRemote, 350); }
async function flushRemote() {
  if (!S.couple) return;
  const ts = [...pending]; pending.clear();
  try {
    if (ts.includes("couples") || ts.includes("couple_members")) {
      const c = await S.api.loadCouple();
      if (!c) return location.reload();       // 커플에서 빠졌다
      S.couple = c.couple; S.members = c.members;
    }
    if (ts.includes("answers")) setAnswers(await S.api.loadAnswers());
    if (ts.includes("balance_picks")) setPicks(await S.api.loadPicks());
    if (ts.includes("room_items") && !S.dragging) S.room = await S.api.loadRoom();
    if (ts.includes("wishes") || ts.includes("wish_reviews")) await loadWishData();
    if (ts.includes("events")) await loadEventData();
    if (ts.includes("entries")) {
      if (Date.now() - urlsAt > 5 * 3600e3) { S.urls = {}; urlsAt = Date.now(); }   // 만료되기 전에 새로 받는다
      S.entryCount = await S.api.countEntries();
      for (const ym of Object.keys(S.entries)) await loadMonth(ym, true);
    }
  } catch (e) { console.warn(e); return; }
  if (!S.dragging) { renderTab(); sheetRefresh(); }
}

/* =====================================================================
   시트 (아래에서 올라오는 창)
   ===================================================================== */
let sheetDraw = null, sheetOpts = {};
let skipPop = 0;      // 우리가 직접 부른 history.back()의 popstate는 한 박자 늦게 오므로 그만큼 무시한다
function openSheet(draw, opts) {
  const fresh = !sheetDraw;
  sheetDraw = draw; sheetOpts = opts || {};
  const s = $("#sheet");
  s.classList.remove("hide");
  s.querySelector(".panel").scrollTop = 0;
  drawSheet();
  requestAnimationFrame(() => s.classList.add("open"));
  if (fresh) history.pushState({ sheet: true }, "");    // 안드로이드 뒤로 가기로 닫히게
}
function drawSheet() {
  if (!sheetDraw) return;
  $("#sheetBody").replaceChildren(...[sheetDraw()].flat(Infinity).filter(Boolean));
}
function sheetRefresh() {
  if (!sheetDraw || S.dragging) return;
  const a = document.activeElement;
  if (a && $("#sheetBody").contains(a) && (a.tagName === "TEXTAREA" || a.tagName === "INPUT")) return;   // 쓰는 중이면 그대로 둔다
  drawSheet();
}
function closeSheet(fromPop) {
  if (!sheetDraw) return;
  const s = $("#sheet"), onClose = sheetOpts.onClose;
  sheetDraw = null; sheetOpts = {};
  s.classList.remove("open");
  setTimeout(() => { if (!sheetDraw) { s.classList.add("hide"); $("#sheetBody").replaceChildren(); } }, 260);
  if (onClose) onClose();
  if (!fromPop && history.state && history.state.sheet) { skipPop++; history.back(); }
}
window.addEventListener("popstate", () => {
  if (skipPop > 0) { skipPop--; return; }      // 방금 닫은 시트의 뒤로 가기 — 새로 연 시트를 닫으면 안 된다
  closeSheet(true);
});
$("#sheet .dim").addEventListener("click", () => closeSheet());
$("#sheet .x").addEventListener("click", () => closeSheet());

/* =====================================================================
   공용 조각
   ===================================================================== */
function errMsg(e) {
  const m = String((e && (e.message || e.error_description)) || e || "");
  if (/Invalid login credentials/i.test(m)) return "이메일이나 비밀번호가 맞지 않아요";
  if (/already registered|already been registered|already exists/i.test(m)) return "이미 가입된 이메일이에요";
  if (/at least 6/i.test(m)) return "비밀번호는 6자 이상이어야 해요";
  if (/Email not confirmed/i.test(m)) return "메일함에서 가입 확인 링크를 먼저 눌러 주세요";
  if (/rate limit|too many/i.test(m)) return "요청이 너무 많아요. 잠시 후 다시 해 주세요";
  if (/code_not_found/.test(m)) return "초대 코드를 찾을 수 없어요";
  if (/couple_full/.test(m)) return "이미 두 사람이 연결된 코드예요";
  if (/already_in_couple/.test(m)) return "이미 연결된 커플이 있어요";
  if (/does not exist|schema cache|Could not find the/i.test(m)) return "Supabase에 setup.sql을 먼저 실행해 주세요";
  if (/Failed to fetch|NetworkError|network|Load failed/i.test(m)) return "인터넷 연결을 확인해 주세요";
  if (/demo_quota/.test(m)) return "데모에서는 사진을 몇 장만 저장할 수 있어요";
  return "문제가 생겼어요. 잠시 후 다시 해 주세요";
}
const segBtn = (label, on, fn) => h("button", { class: on ? "on" : "", type: "button", onclick: fn }, label);
const hero = (title, sub) => h("div", { class: "hero" }, h("div", { class: "logo-mark" }, "💞"), h("div", { class: "logo" }, title), h("p", { class: "sub" }, sub));
const col = (gap) => ({ display: "flex", flexDirection: "column", gap: (gap || 10) + "px" });
function noTabs() { $("#tabs").classList.add("hide"); $("#app").classList.add("no-tabs"); }

function inviteCard() {
  const code = S.couple.invite_code;
  const text = `둘이서에서 같이 기록하자 💞\n초대 코드: ${code}\n${location.origin + location.pathname}`;
  const was = (S.couple.member_ids || []).length >= 2;     // 둘이 연결됐다가 상대가 나간 상태
  return h("div", { class: "card center", style: col(8) },
    h("div", { class: "h2" }, was ? "상대가 연결을 끊었어요" : "상대를 초대해 주세요"),
    h("p", { class: "sub" }, was ? "나갔던 사람만 이 코드로 다시 들어올 수 있어요. 새로 시작하려면 ‘우리’ 탭에서 연결을 끊고 새로 만들어 주세요"
                                 : "상대가 가입하고 ‘초대 코드 있어요’에 이 코드를 넣으면 연결돼요"),
    h("div", { class: "code" }, code),
    h("div", { class: "row", style: { justifyContent: "center" } },
      h("button", { class: "btn sm soft", onclick: async () => {
        try { await navigator.clipboard.writeText(code); toast("코드를 복사했어요"); } catch (e) { toast(`초대 코드: ${code}`); }
      } }, "코드 복사"),
      navigator.share ? h("button", { class: "btn sm", onclick: () => navigator.share({ title: "둘이서", text }).catch(() => {}) }, "공유하기") : null));
}

// 사진 줄이기 (긴 변 max px, JPEG). 아이폰 HEIC는 사진 선택 시 JPEG로 바뀌어 들어온다.
async function shrink(file, max, quality) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch (e) {
    src = await new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("image_load")); };
      img.src = url;
    });
  }
  const w = src.width, ht = src.height, k = Math.min(1, max / Math.max(w, ht));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(ht * k));
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", quality));
}

/* =====================================================================
   시작 화면들
   ===================================================================== */
function renderSetup() {
  noTabs();
  view(
    hero("둘이서", "둘이 같이 쓰는 기록 · 질문 · 밸런스 게임"),
    h("div", { class: "card", style: col(6) },
      h("div", { class: "h2" }, "아직 서버 연결 전이에요"),
      h("p", { class: "sub" }, "README의 ‘처음 설정하기’대로 Supabase를 만들고 config.js에 주소와 키를 넣으면, 두 사람 폰이 같은 데이터를 보게 돼요.")),
    h("button", { class: "btn wide", onclick: () => { localStorage.setItem(MODE_KEY, "demo"); location.reload(); } }, "데모로 먼저 둘러보기"),
    h("p", { class: "tiny center" }, "데모는 이 폰에만 저장되고, 상대 입장으로 바꿔 볼 수도 있어요"),
  );
}

function renderAuth(mode) {
  noTabs();
  const up = mode === "up";
  const email = h("input", { class: "input", type: "email", placeholder: "이메일", autocomplete: "email", inputmode: "email" });
  const pw = h("input", { class: "input", type: "password", placeholder: up ? "비밀번호 (6자 이상)" : "비밀번호",
                          autocomplete: up ? "new-password" : "current-password" });
  const btn = h("button", { class: "btn wide", type: "submit" }, up ? "가입하기" : "로그인");
  const form = h("form", { class: "card", style: col(), onsubmit: async (e) => {
    e.preventDefault();
    const em = email.value.trim();
    if (!em || pw.value.length < 6) return toast("이메일과 6자 이상 비밀번호를 넣어 주세요");
    btn.disabled = true;
    try {
      const u = up ? await S.api.signUp(em, pw.value) : await S.api.signIn(em, pw.value);
      if (!u) {   // 메일 확인이 켜져 있는 경우
        return view(hero("둘이서", ""),
          h("div", { class: "card center", style: col(6) }, h("div", { class: "h2" }, "메일함을 확인해 주세요"),
            h("p", { class: "sub" }, `${em}(으)로 보낸 확인 링크를 누른 다음 로그인하면 돼요.`)),
          h("button", { class: "btn wide", onclick: () => renderAuth("in") }, "로그인하러 가기"));
      }
      S.user = u;
      await afterLogin();
    } catch (err) { toast(errMsg(err)); btn.disabled = false; }
  } }, email, pw, btn);
  view(
    hero("둘이서", "둘이 같이 쓰는 우리만의 공간"),
    h("div", { class: "seg" }, segBtn("로그인", !up, () => renderAuth("in")), segBtn("처음이에요", up, () => renderAuth("up"))),
    form,
    h("p", { class: "tiny center" }, up ? "둘 다 각자 가입한 뒤, 한 사람이 만든 초대 코드로 연결해요" : "가입할 때 쓴 이메일로 로그인해요"),
  );
}

function renderCoupleSetup(mode) {
  noTabs();
  const isNew = mode !== "join";
  const name = h("input", { class: "input", placeholder: "상대에게 보일 내 이름", maxlength: 10 });
  const start = h("input", { class: "input", type: "date", max: today() });
  const code = h("input", { class: "input", placeholder: "6자리 코드", maxlength: 6, autocapitalize: "characters", autocomplete: "off",
                            style: { textTransform: "uppercase", letterSpacing: ".25em", textAlign: "center" } });
  const btn = h("button", { class: "btn wide", type: "submit" }, isNew ? "우리 공간 만들기" : "연결하기");
  const form = h("form", { class: "card", style: col(12), onsubmit: async (e) => {
    e.preventDefault();
    const n = name.value.trim();
    if (!n) return toast("내 이름을 넣어 주세요");
    btn.disabled = true;
    try {
      if (isNew) await S.api.createCouple(n, start.value || null);
      else {
        const c = code.value.trim().toUpperCase();
        if (c.length !== 6) { btn.disabled = false; return toast("초대 코드 6자리를 넣어 주세요"); }
        await S.api.joinCouple(c, n);
      }
      await afterLogin();
    } catch (err) { toast(errMsg(err)); btn.disabled = false; }
  } },
    h("div", { class: "field" }, h("label", {}, "내 이름"), name),
    isNew ? h("div", { class: "field" }, h("label", {}, "사귄 날 (나중에 정해도 돼요)"), start)
          : h("div", { class: "field" }, h("label", {}, "상대가 보내 준 초대 코드"), code),
    btn);
  view(
    hero("둘이서", "먼저 우리 둘을 연결해요"),
    h("div", { class: "seg" }, segBtn("새로 시작하기", isNew, () => renderCoupleSetup("new")), segBtn("초대 코드 있어요", !isNew, () => renderCoupleSetup("join"))),
    form,
    h("p", { class: "tiny center" }, isNew ? "만들고 나면 초대 코드가 나와요. 상대에게 보내 주세요" : "상대가 ‘새로 시작하기’로 만든 코드를 넣어요"),
    h("button", { class: "btn ghost", onclick: logout }, "로그아웃"),
  );
}

function renderError(err) {
  console.error(err);
  noTabs();
  view(hero("둘이서", ""),
    h("div", { class: "card center", style: col(6) }, h("div", { class: "h2" }, "불러오지 못했어요"), h("p", { class: "sub" }, errMsg(err))),
    h("button", { class: "btn wide", onclick: () => location.reload() }, "다시 시도"),
    h("button", { class: "btn ghost", onclick: logout }, "로그아웃"));
}

/* =====================================================================
   메인 · 탭
   ===================================================================== */
const TABS = [["home", "홈"], ["cal", "캘린더"], ["q", "질문"], ["bal", "밸런스"], ["map", "지도"], ["us", "우리"]];
function showMain() {
  $("#app").classList.remove("no-tabs");
  const nav = $("#tabs");
  nav.classList.remove("hide");
  nav.querySelector(".in").replaceChildren(...TABS.map(([id, label]) =>
    h("button", { "data-tab": id, "aria-label": label, onclick: () => go(id) }, icon(id), h("span", {}, label))));
  renderTab();
}
function go(tab) {
  if (tab === S.tab && tab === "q" && S.qCat) S.qCat = null;    // 질문 탭을 다시 누르면 목록 처음으로
  if ((tab === S.tab && tab === "map") || tab !== "map") { S.mapPlace = null; S.mapResults = null; clearTemp(); }   // 지도 탭도 마찬가지
  S.tab = tab;
  if (tab !== "q") S.qCat = null;
  renderTab();
  window.scrollTo(0, 0);
}
function renderTab() {
  if (!S.couple) return;
  // 다시 그리는 동안 쓰던 입력칸(data-k)이 있으면, 새로 그린 같은 칸으로 커서를 돌려준다
  const a = document.activeElement;
  const k = a && $("#view").contains(a) && a.dataset && a.dataset.k, pos = k ? a.selectionStart : null;
  for (const b of $("#tabs .in").children) {
    b.classList.toggle("on", b.dataset.tab === S.tab);
    const t = b.dataset.tab;
    const need = (t === "q" && (waitingQs().length > 0 || waitingRevs("movie").length > 0))
      || (t === "bal" && waitingPicks().length > 0) || (t === "map" && waitingRevs("place").length > 0);
    const dot = b.querySelector(".dot");
    if (need && !dot) b.append(h("i", { class: "dot" }));
    if (!need && dot) dot.remove();
  }
  ({ home: renderHome, cal: renderCal, q: renderQ, bal: renderBal, map: renderMap, us: renderUs })[S.tab]();
  if (k) {
    const n = document.querySelector(`#view [data-k="${k}"]`);
    if (n && n !== a) { n.focus({ preventScroll: true }); try { n.setSelectionRange(pos, pos); } catch (e) { /* 무시 */ } }
  }
}

/* ---------------- 홈 ---------------- */
function demoBanner() {
  return h("div", { class: "banner" }, `데모 모드 · 지금은 ${josa(nick(me()), "의")} 화면이에요. ‘우리’ 탭에서 상대 입장으로 바꿔 볼 수 있어요`);
}
function qCard(q, label) {
  const p = pid(), mine = ansOf(q.id, me()), theirs = ansOf(q.id, p);
  const st = mine && theirs ? h("span", { class: "chip mint" }, "둘 다 답했어요 · 열어 보기")
    : mine ? h("span", { class: "chip gray" }, p ? josa(nick(p), "를 기다리는 중") : "상대를 기다리는 중")
    : theirs ? h("span", { class: "chip" }, josa(nick(p), "가 먼저 답했어요"))
    : h("span", { class: "chip gray" }, "아직 아무도 답하지 않았어요");
  return h("button", { class: "qcard", onclick: () => openQuestion(q.id) },
    h("div", { class: "row" }, h("span", { class: "chip sky" }, label), h("span", { class: "tiny" }, `${CAT[q.cat].ic} ${CAT[q.cat].name}`)),
    h("div", { class: "qt" }, q.text),
    h("div", { class: "qstat" }, st));
}
function renderHome() {
  const p = partner(), sd = S.couple.start_date;
  let dday = null;
  if (sd) { const n = daysBetween(sd, today()); dday = n >= 0 ? `D+${n + 1}` : `D${n}`; }
  const parts = [
    h("div", { class: "home-head" },
      h("div", { class: "names" }, nick(me()), h("span", { class: "hrt" }, "♥"), p ? nick(p.user_id) : h("span", { class: "sub" }, "기다리는 중")),
      sd ? h("div", { class: "dday" }, dday, h("small", {}, `${fmtShort(sd)}부터`))
         : h("button", { class: "link", onclick: () => go("us") }, "사귄 날 정하기")),
  ];
  if (S.api.kind === "demo") parts.push(demoBanner());
  if (!p) parts.push(inviteCard());
  parts.push(roomEl(false));
  parts.push(h("div", { class: "room-bar" }, h("span", { class: "hearts" }, `♥ ${Math.max(0, hearts())}`),
    h("button", { class: "btn sm soft", onclick: openRoomEditor }, "🛋️ 방 꾸미기")));
  parts.push(qCard(todayQ(), "오늘의 질문"));
  // 다가오는 날: 기념일 + 생일·일정 중 가까운 3개. 누르면 그날 캘린더가 열린다
  const up = upcoming(3);
  if (up.length) parts.push(h("div", { class: "card upc" }, h("div", { class: "sec", style: { margin: "0 0 4px" } }, "다가오는 날"),
    up.map((u) => {
      const n = daysBetween(today(), u.date);
      return h("button", { class: "upc-it", onclick: () => openDay(u.date) },
        h("span", { class: "big" }, n === 0 ? "오늘!" : `D-${n}`),
        h("span", { class: "grow" }, h("span", { class: "upc-t" }, `${u.icon} ${u.title}`), h("span", { class: "sub" }, fmtDate(u.date))));
    })));
  view(...parts);
}

/* ---------------- 우리 방 ---------------- */
function roomEl(editing) {
  const wall = WALL[S.couple.wall] || DATA.walls[0], floor = FLOOR[S.couple.floor] || DATA.floors[0];
  const room = h("div", { class: "room" + (editing ? " editing" : "") },
    h("div", { class: "wall", style: { background: wall.css } }),
    h("div", { class: "floor", style: { background: floor.css } }));
  const items = S.room.filter((r) => r.placed && OBJ[r.object_key]);
  if (!items.length && !editing) room.append(h("div", { class: "room-empty", style: { whiteSpace: "pre-line" } }, "아직 텅 빈 우리 방\n하트를 모아 소품을 들여 보세요"));
  for (const it of items) room.append(objEl(it, editing));
  if (editing) room.addEventListener("pointerdown", (e) => {
    if (!e.target.classList.contains("obj") && S.sel) { S.sel = null; drawSheet(); }
  });
  return room;
}
function objEl(it, editing) {
  const o = OBJ[it.object_key];
  const el = h("div", { class: "obj" + (editing && S.sel === it.id ? " sel" : ""), "data-id": it.id, role: editing ? "button" : null, "aria-label": o.name }, o.e);
  el.style.left = it.x + "%";
  el.style.top = it.y + "%";
  el.style.zIndex = String(Math.round(it.y * 10));        // 아래(앞)에 있을수록 위에 그린다
  el.style.setProperty("--s", String((o.s || 1) * (it.scale || 1)));
  el.style.setProperty("--f", it.flip ? "-1" : "1");
  if (editing) dragify(el, it);
  return el;
}
function dragify(el, it) {
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation();
    const room = el.parentElement, r = room.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y;
    let moved = false;
    if (S.sel !== it.id) {
      S.sel = it.id;
      room.querySelectorAll(".obj.sel").forEach((x) => x.classList.remove("sel"));
      el.classList.add("sel");
    }
    S.dragging = true;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    const move = (ev) => {
      const dx = (ev.clientX - sx) / r.width * 100, dy = (ev.clientY - sy) / r.height * 100;
      if (Math.abs(dx) + Math.abs(dy) > 0.6) moved = true;
      it.x = clamp(ox + dx, 3, 97); it.y = clamp(oy + dy, 10, 100);
      el.style.left = it.x + "%"; el.style.top = it.y + "%"; el.style.zIndex = String(Math.round(it.y * 10));
    };
    const up = () => {
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      S.dragging = false;
      if (moved) S.api.updateItem(it.id, { x: it.x, y: it.y }).catch((err) => toast(errMsg(err)));
      drawSheet();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}
function openRoomEditor() {
  S.editing = true; S.sel = null;
  openSheet(drawEditor, { onClose: () => { S.editing = false; S.sel = null; renderTab(); } });
}
function adjust(it, patch) {
  Object.assign(it, patch);
  drawSheet();
  S.api.updateItem(it.id, patch).catch((err) => toast(errMsg(err)));
}
function drawEditor() {
  const sel = S.room.find((r) => r.id === S.sel && r.placed);
  const tools = h("div", { class: "tools" }, sel ? [
    h("button", { class: "btn sm line", onclick: () => adjust(sel, { scale: +clamp((sel.scale || 1) - 0.15, 0.5, 2.2).toFixed(2) }) }, "작게"),
    h("button", { class: "btn sm line", onclick: () => adjust(sel, { scale: +clamp((sel.scale || 1) + 0.15, 0.5, 2.2).toFixed(2) }) }, "크게"),
    h("button", { class: "btn sm line", onclick: () => adjust(sel, { flip: !sel.flip }) }, "뒤집기"),
    h("button", { class: "btn sm soft", onclick: () => { S.sel = null; adjust(sel, { placed: false }); } }, "보관함에 넣기"),
  ] : h("span", { class: "tiny", style: { alignSelf: "center" } }, "소품을 눌러 고르고, 끌어서 옮겨요"));
  const tabs = [["shop", "상점"], ["box", "보관함"], ["theme", "벽지·바닥"]];
  return [
    h("div", { class: "row" }, h("div", { class: "h2 grow" }, "우리 방 꾸미기"), h("span", { class: "hearts" }, `♥ ${Math.max(0, hearts())}`)),
    roomEl(true),
    tools,
    h("div", { class: "seg" }, tabs.map(([k, l]) => segBtn(l, S.shopTab === k, () => { S.shopTab = k; drawSheet(); }))),
    S.shopTab === "shop" ? shopGrid() : S.shopTab === "box" ? boxGrid() : themeGrid(),
  ];
}
function shopGrid() {
  return Object.entries(DATA.objCats).map(([cat, name]) => [
    h("div", { class: "sec" }, name),
    h("div", { class: "shop" }, DATA.objects.filter((o) => o.cat === cat).map((o) => {
      const owned = S.room.filter((r) => r.object_key === o.key).length;
      return h("button", { class: owned ? "own" : "", onclick: () => buy(o) },
        h("span", { class: "e" }, o.e), h("span", {}, o.name), h("span", { class: "p" }, `♥${o.price}`),
        owned ? h("span", { class: "tiny" }, `${owned}개 있음`) : null);
    })),
  ]);
}
async function buy(o) {
  const left = hearts();
  if (left < o.price) return toast(`하트가 ${o.price - left}개 모자라요`);
  let it;
  try { it = await S.api.buyItem(o.key, { placed: true, x: 50, y: 76 }); } catch (err) { return toast(errMsg(err)); }
  S.room.push(it); S.sel = it.id;
  drawSheet();
  toast(`${o.e} ${josa(o.name, "를 들였어요")} (♥−${o.price})`);
}
function boxGrid() {
  const box = S.room.filter((r) => !r.placed && OBJ[r.object_key]);
  if (!box.length) return h("p", { class: "empty" }, "보관함이 비었어요. 방에서 소품을 골라 ‘보관함에 넣기’를 누르면 여기로 와요");
  return h("div", { class: "shop" }, box.map((r) => {
    const o = OBJ[r.object_key];
    return h("button", { onclick: () => { S.sel = r.id; adjust(r, { placed: true, x: 50, y: 76 }); } },
      h("span", { class: "e" }, o.e), h("span", {}, o.name), h("span", { class: "tiny" }, "꺼내기"));
  }));
}
function themeGrid() {
  const block = (title, list, kind) => [
    h("div", { class: "sec" }, title),
    h("div", { class: "shop" }, list.map((t) => {
      const owned = t.price === 0 || S.room.some((r) => r.object_key === `${kind}:${t.key}`);
      const on = (S.couple[kind] || list[0].key) === t.key;
      return h("button", { class: on ? "own" : "", onclick: () => setTheme(kind, t, owned) },
        h("span", { class: "swatch", style: { background: t.css } }), h("span", {}, t.name),
        on ? h("span", { class: "tiny" }, "사용 중") : owned ? h("span", { class: "tiny" }, "바꾸기") : h("span", { class: "p" }, `♥${t.price}`));
    })),
  ];
  return [block("벽지", DATA.walls, "wall"), block("바닥", DATA.floors, "floor")];
}
async function setTheme(kind, t, owned) {
  if (!owned) {
    const left = hearts();
    if (left < t.price) return toast(`하트가 ${t.price - left}개 모자라요`);
    try { S.room.push(await S.api.buyItem(`${kind}:${t.key}`, { placed: false })); } catch (err) { return toast(errMsg(err)); }
  }
  S.couple[kind] = t.key;
  drawSheet();
  try { await S.api.updateCouple({ [kind]: t.key }); } catch (err) { toast(errMsg(err)); }
}

/* ---------------- 캘린더 ---------------- */
async function renderCal() {
  const ym = S.calMonth;
  if (!S.entries[ym]) {
    view(h("div", { class: "spin" }));
    try { await loadMonth(ym); } catch (err) { toast(errMsg(err)); S.entries[ym] = []; }
    if (S.tab !== "cal" || S.calMonth !== ym) return;
  }
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
  const rows = S.entries[ym] || [], byDay = {};
  for (const e of rows) (byDay[e.day] || (byDay[e.day] = [])).push(e);
  const t = today(), cells = [], monthItems = [];
  for (let i = 0; i < first; i++) cells.push(h("div", { class: "day blank" }));
  for (let d = 1; d <= days; d++) {
    const ds = `${ym}-${pad(d)}`, list = byDay[ds] || [];
    const ph = list.find((e) => e.thumb_path && S.urls[e.thumb_path]);
    const evs = eventsOn(ds), dn = doneOn(ds), an = annivLabel(ds);
    const lab = an || (evs[0] && evs[0].title);       // 칸 아래 글: 기념일 > 일정 이름
    const icons = [...new Set([...evs.map((e) => e.icon), ...dn.map(doneIcon)])].slice(0, 3).join("");
    const cell = h("button", { class: "day" + (ph ? " photo" : "") + (ds === t ? " today" : ""), "aria-label": fmtDate(ds), onclick: () => openDay(ds) },
      h("span", { class: "n" }, d), list.length && !ph ? h("i", { class: "memo" }) : null,
      icons ? h("span", { class: "ev" + (lab ? " up" : "") }, icons) : null,
      lab ? h("span", { class: "lab" }, lab) : null);
    if (ph) cell.style.backgroundImage = `url("${S.urls[ph.thumb_path]}")`;
    cells.push(cell);
    if (an && an !== "시작한 날") monthItems.push({ ds, icon: "💗", title: `${an} 기념일` });
    for (const e of evs) {
      if (e.repeat === "weekly" && monthItems.some((x) => x.ev === e.id)) continue;     // 매주는 이달 첫 번째에 한 줄만
      monthItems.push({ ds, ev: e.id, icon: e.icon, title: e.title,
        sub: e.repeat === "weekly" ? `매주 ${weekday(e.day)}요일` : e.repeat !== "none" ? REPEAT[e.repeat] : "" });
    }
    for (const w of dn) monthItems.push({ ds, icon: doneIcon(w), title: w.title, sub: w.kind === "movie" ? "같이 봤어요" : "다녀왔어요" });
  }
  const photos = rows.filter((e) => e.photo_path).length;
  view(
    h("div", { class: "cal-head" },
      h("button", { class: "navbtn", "aria-label": "이전 달", onclick: () => moveMonth(-1) }, "‹"),
      h("div", { class: "h2" }, `${y}년 ${m}월`),
      h("button", { class: "navbtn", "aria-label": "다음 달", onclick: () => moveMonth(1) }, "›")),
    h("div", { class: "week" }, WEEK.map((w) => h("div", {}, w))),
    h("div", { class: "cal" }, cells),
    h("p", { class: "sub center" }, rows.length ? `이번 달 기록 ${rows.length}개 · 사진 ${photos}장` : "날짜를 눌러 그날을 남겨 보세요"),
    h("div", { class: "row" },
      h("button", { class: "btn soft grow", onclick: () => openDay(t) }, "✏️ 오늘 기록하기"),
      h("button", { class: "btn line grow", onclick: () => openDay(t, true) }, "📅 일정·생일 추가")),
    monthItems.length ? [h("div", { class: "sec" }, `${m}월에 있는 날`), h("div", { class: "list" }, monthItems.map((x) =>
      h("button", { class: "it", onclick: () => openDay(x.ds) },
        h("span", { class: "mday" }, `${Number(x.ds.slice(8))}일`, h("small", {}, weekday(x.ds))),
        h("span", { class: "grow" }, `${x.icon} ${x.title}`),
        x.sub ? h("span", { class: "tiny" }, x.sub) : null)))] : null,
  );
}
function moveMonth(n) {
  const [y, m] = S.calMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  S.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  renderCal();
}
const dayEntries = (ds) => (S.entries[ds.slice(0, 7)] || []).filter((e) => e.day === ds);
async function ensureUrls(paths) {
  const need = paths.filter((p) => p && !S.urls[p]);
  if (!need.length) return;
  try { Object.assign(S.urls, await S.api.urls(need)); sheetRefresh(); } catch (e) { console.warn(e); }
}
// withEvent면 일정 넣는 칸을 펼친 채로 연다
async function openDay(ds, withEvent) {
  S.dayForm = { photo: null, preview: null, memo: "" };
  S.evForm = withEvent && !S.eventsErr ? newEv(ds) : null;
  openSheet(() => drawDay(ds), { onClose: () => {
    if (S.dayForm && S.dayForm.preview) URL.revokeObjectURL(S.dayForm.preview);
    S.dayForm = null; S.evForm = null;
  } });
  if (!S.entries[ds.slice(0, 7)]) { try { await loadMonth(ds.slice(0, 7)); sheetRefresh(); } catch (e) { console.warn(e); } }
  ensureUrls(dayEntries(ds).map((e) => e.photo_path));
}
function drawDay(ds) {
  const list = dayEntries(ds), lab = annivLabel(ds), evs = eventsOn(ds), dn = doneOn(ds);
  const n = S.couple.start_date ? daysBetween(S.couple.start_date, ds) + 1 : 0;
  const out = [h("div", {}, h("div", { class: "h2" }, fmtDate(ds)),
    h("div", { class: "row", style: { marginTop: "4px" } }, lab ? h("span", { class: "chip" }, `${lab} ♥`) : null, n > 0 ? h("span", { class: "tiny" }, `우리 ${n}일째`) : null))];
  if (evs.length) out.push(h("div", { class: "list" }, evs.map((e) => evRow(e, ds))));
  // 지도에서 '다녀왔어요', 영화에서 '같이 봤어요'를 고른 날이면 여기 뜬다
  if (dn.length) out.push(h("div", { class: "sec" }, "이날 같이 한 것"), h("div", { class: "qlist" }, dn.map((w) => {
    const parent = w.parent_id && wishById(w.parent_id);
    return h("button", { class: "qitem", onclick: () => openWish(w.id) }, h("span", { class: "st" }, doneIcon(w)),
      h("span", { class: "t" }, h("span", { class: "wt" }, w.title),
        h("span", { class: "tiny wsub" }, w.kind === "movie" ? "같이 본 영화" : parent ? `${parent.title}에서` : "다녀온 곳")));
  })));
  out.push(S.evForm ? eventForm()
    : S.eventsErr ? h("div", { class: "banner" }, S.eventsErr)
    : h("button", { class: "btn sm line", style: { alignSelf: "flex-start" }, onclick: () => { S.evForm = newEv(ds); drawSheet(); } }, "📅 이날에 일정·생일 추가"));
  out.push(h("div", { class: "sec" }, "기록"),
    list.length ? h("div", {}, list.map(entryEl)) : h("p", { class: "empty" }, "아직 이날의 기록이 없어요"),
    entryForm(ds));
  return out;
}

/* ---------------- 일정 · 생일 (반복) ---------------- */
const newEv = (ds) => ({ title: "", day: ds, repeat: "none", icon: "📌", touched: false });
function evRow(e, ds) {
  const age = e.icon === "🎂" && e.repeat === "yearly" ? Number(ds.slice(0, 4)) - Number(e.day.slice(0, 4)) : 0;
  const sub = [age > 0 ? `${age}번째 생일` : "", e.repeat !== "none" ? `${REPEAT[e.repeat]} 반복` : ""].filter(Boolean).join(" · ");
  return h("div", { class: "it" }, h("span", { class: "ev-ic" }, e.icon),
    h("span", { class: "grow" }, h("span", { class: "wt" }, e.title), sub ? h("span", { class: "tiny" }, sub) : null),
    h("button", { class: "link", onclick: () => { S.evForm = { ...e, touched: true }; drawSheet(); } }, "고치기"));
}
function eventForm() {
  const F = S.evForm;
  const t = h("input", { class: "input", maxlength: 100, placeholder: "예: 바다 생일, 영화 예매", oninput: () => { F.title = t.value; } });
  t.value = F.title;
  const d = h("input", { class: "input", type: "date", value: F.day, onchange: () => { F.day = d.value; } });
  // 🎂·💝를 고르면 반복을 직접 안 건드린 경우 '매년'으로 맞춰 준다
  const icons = h("div", { class: "pcats" }, EV_ICONS.map(([ic, name]) => h("button", { type: "button", class: F.icon === ic ? "on" : "",
    onclick: () => { F.icon = ic; if (!F.touched && (ic === "🎂" || ic === "💝")) F.repeat = "yearly"; drawSheet(); } }, `${ic} ${name}`)));
  const rep = h("div", { class: "seg" }, Object.entries(REPEAT).map(([k, l]) => segBtn(l, F.repeat === k, () => { F.repeat = k; F.touched = true; drawSheet(); })));
  const save = h("button", { class: "btn grow", onclick: async () => {
    const title = F.title.trim();
    if (!title) return toast("이름을 적어 주세요");
    if (!F.day) return toast("날짜를 골라 주세요");
    const row = { title, day: F.day, repeat: F.repeat, icon: F.icon };
    save.disabled = true;
    try {
      if (F.id) { await S.api.updateEvent(F.id, row); Object.assign(S.events.find((e) => e.id === F.id) || {}, row); }
      else S.events.push(await S.api.addEvent(row));
    } catch (err) { save.disabled = false; return toast(errMsg(err)); }
    S.evForm = null; drawSheet(); renderTab();
    toast(F.id ? "일정을 고쳤어요" : F.repeat === "none" ? `${F.icon} 일정을 넣었어요` : `${F.icon} ${REPEAT[F.repeat]} 반복으로 넣었어요`);
  } }, F.id ? "저장" : "넣기");
  return h("div", { class: "card", style: col() },
    h("div", { class: "sec", style: { margin: 0 } }, F.id ? "일정 고치기" : "일정·생일 추가"),
    icons, t,
    h("div", { class: "field" }, h("label", {}, F.repeat === "none" ? "날짜" : F.icon === "🎂" ? "태어난 날 (그날부터 매년 표시돼요)" : "처음 날짜"), d),
    h("div", { class: "field" }, h("label", {}, "반복"), rep),
    h("div", { class: "row" },
      F.id ? h("button", { class: "btn ghost", onclick: () => delEvent(F) }, "지우기") : null,
      h("button", { class: "btn line grow", onclick: () => { S.evForm = null; drawSheet(); } }, "취소"), save));
}
async function delEvent(F) {
  if (!confirm(`‘${F.title}’ 일정을 지울까요?${F.repeat !== "none" ? "\n반복되는 날짜도 모두 지워져요." : ""}`)) return;
  try { await S.api.deleteEvent(F.id); } catch (err) { return toast(errMsg(err)); }
  S.events = S.events.filter((e) => e.id !== F.id);
  S.evForm = null; drawSheet(); renderTab(); toast("지웠어요");
}
function entryEl(e) {
  const mine = e.user_id === me();
  const src = S.urls[e.photo_path] || S.urls[e.thumb_path];
  return h("div", { class: "entry" },
    e.photo_path ? h("img", { src: src || null, alt: "", loading: "lazy" }) : null,
    e.memo ? h("div", { class: "memo-t" }, e.memo) : null,
    h("div", { class: "row tiny" }, h("span", { class: "grow" }, `${nick(e.user_id)} · ${fmtTime(e.created_at)}`),
      mine ? h("button", { class: "link", onclick: () => delEntry(e) }, "지우기") : null));
}
function entryForm(ds) {
  const F = S.dayForm;
  const file = h("input", { type: "file", accept: "image/*", class: "hide", onchange: () => {
    const f = file.files[0];
    if (!f) return;
    if (F.preview) URL.revokeObjectURL(F.preview);
    F.photo = f; F.preview = URL.createObjectURL(f);
    drawSheet();
  } });
  const memoBox = h("textarea", { class: "textarea", placeholder: "이날 어땠어?", maxlength: 1000, oninput: () => { F.memo = memoBox.value; } });
  memoBox.value = F.memo;
  const save = h("button", { class: "btn wide", onclick: async () => {
    if (!F.photo && !F.memo.trim()) return toast("사진이나 메모를 남겨 주세요");
    save.disabled = true;
    save.textContent = F.photo ? "사진 올리는 중…" : "저장하는 중…";
    try {
      let photo = null, thumb = null;
      if (F.photo) {
        photo = await shrink(F.photo, S.api.kind === "demo" ? 900 : 1600, 0.82);
        thumb = await shrink(F.photo, 360, 0.72);
      }
      const e = await S.api.addEntry({ day: ds, memo: F.memo.trim(), photo, thumb });
      const ym = ds.slice(0, 7);
      if (S.entries[ym]) S.entries[ym].push(e);
      S.entryCount++;
      if (photo) { S.urls[e.photo_path] = URL.createObjectURL(photo); S.urls[e.thumb_path] = URL.createObjectURL(thumb); }
      if (F.preview) URL.revokeObjectURL(F.preview);
      F.photo = null; F.preview = null; F.memo = "";
      toast(`기록했어요 · ♥+${H.entry}`);
      drawSheet(); renderTab();
    } catch (err) {
      toast(errMsg(err)); save.disabled = false; save.textContent = "기록하기";
    }
  } }, "기록하기");
  return h("div", { class: "card", style: col() },
    h("div", { class: "sec", style: { margin: 0 } }, "기록 남기기"),
    h("div", { class: "pick-photo" },
      F.preview ? h("img", { class: "preview", src: F.preview, alt: "" }) : null,
      h("button", { class: "btn sm line", onclick: () => file.click() }, F.preview ? "사진 바꾸기" : "📷 사진 고르기"),
      F.preview ? h("button", { class: "link", onclick: () => { URL.revokeObjectURL(F.preview); F.photo = null; F.preview = null; drawSheet(); } }, "빼기") : null,
      file),
    memoBox, save);
}
async function delEntry(e) {
  if (!confirm("이 기록을 지울까요?")) return;
  try { await S.api.deleteEntry(e); } catch (err) { return toast(errMsg(err)); }
  const ym = e.day.slice(0, 7);
  if (S.entries[ym]) S.entries[ym] = S.entries[ym].filter((x) => x.id !== e.id);
  S.entryCount = Math.max(0, S.entryCount - 1);
  drawSheet(); renderTab();
}

/* ---------------- 질문 ---------------- */
function qItem(q) {
  const mine = ansOf(q.id, me()), theirs = ansOf(q.id, pid());
  const st = mine && theirs ? "💞" : mine ? "⏳" : theirs ? "🔒" : "○";
  return h("button", { class: "qitem", onclick: () => openQuestion(q.id) }, h("span", { class: "st" }, st), h("span", { class: "t" }, q.text));
}
const lastAt = (qid) => Object.values(S.answers[qid] || {}).reduce((a, x) => (x.created_at > a ? x.created_at : a), "");
function renderQ() {
  if (S.qCat === "movie") return renderMovies();
  if (S.qCat) return renderQCat(S.qCat);
  const both = Q.filter((q) => bothAnswered(q.id)).sort((a, b) => (lastAt(a.id) < lastAt(b.id) ? 1 : -1));
  const tq = todayQ();
  const wait = waitingQs().filter((q) => q !== tq);      // 오늘의 질문은 바로 위 카드에 있으니 빼고
  const parts = [h("div", { class: "title" }, "질문"), qCard(tq, "오늘의 질문")];
  if (wait.length) parts.push(h("div", { class: "sec" }, `${josa(nick(pid()), "가")} 먼저 답한 질문 · ${wait.length}개`), h("div", { class: "qlist" }, wait.slice(0, 5).map(qItem)));
  parts.push(h("div", { class: "sec" }, "카테고리"), h("div", { class: "cats" }, DATA.categories.map((c) => {
    const qs = Q.filter((q) => q.cat === c.id), done = qs.filter((q) => bothAnswered(q.id)).length;
    return h("button", { class: "cat", onclick: () => { S.qCat = c.id; renderTab(); window.scrollTo(0, 0); } },
      h("span", { class: "ic" }, c.ic), h("span", { class: "nm" }, c.name), h("span", { class: "tiny" }, c.desc),
      h("div", { class: "bar" }, h("i", { style: { width: `${Math.round(done / qs.length * 100)}%` } })),
      h("span", { class: "tiny" }, `${done} / ${qs.length}`));
  }), movieCard()));
  parts.push(h("div", { class: "sec" }, `우리의 대화 · ${both.length}개`),
    both.length ? h("div", { class: "qlist" }, both.slice(0, 10).map(qItem)) : h("p", { class: "empty" }, "둘 다 답한 질문이 여기에 쌓여요"));
  view(...parts);
}
function renderQCat(id) {
  const c = CAT[id], qs = Q.filter((q) => q.cat === id);
  view(
    h("div", { class: "row" }, h("button", { class: "navbtn", "aria-label": "뒤로", onclick: () => { S.qCat = null; renderTab(); } }, "‹"),
      h("div", { class: "title grow" }, `${c.ic} ${c.name}`)),
    h("p", { class: "sub" }, c.desc),
    h("p", { class: "tiny" }, "💞 둘 다 답함 · 🔒 상대가 먼저 답함 · ⏳ 상대 기다림 · ○ 아직"),
    h("div", { class: "qlist" }, qs.map(qItem)),
  );
}
function openQuestion(qid) {
  S.qEdit = false;
  openSheet(() => drawQuestion(qid), { onClose: () => { S.qEdit = false; } });
}
function ansEl(uid, a, them) {
  return h("div", { class: "ans" + (them ? " them" : "") },
    h("span", { class: "who" }, nick(uid) + (uid === me() ? " (나)" : "")), h("div", { class: "txt" }, a.answer));
}
function drawQuestion(qid) {
  const q = QMAP[qid], c = CAT[q.cat], p = pid();
  const mine = ansOf(qid, me()), theirs = ansOf(qid, p);
  const out = [h("span", { class: "chip sky", style: { alignSelf: "flex-start" } }, `${c.ic} ${c.name}`), h("div", { class: "q-big" }, q.text)];
  if (mine && !S.qEdit) out.push(ansEl(me(), mine, false),
    h("button", { class: "link", style: { alignSelf: "flex-end" }, onclick: () => { S.qEdit = true; drawSheet(); } }, "내 답 고치기"));
  else out.push(answerForm(qid, mine ? mine.answer : ""));
  if (!p) out.push(h("div", { class: "lock" }, "상대가 들어오면 서로의 답을 볼 수 있어요"));
  else if (theirs && mine) out.push(ansEl(p, theirs, true));
  else if (theirs) out.push(h("div", { class: "lock" }, `🔒 ${josa(nick(p), "가 답했어요")}`, h("br"), "내 답을 쓰면 열려요"));
  else out.push(h("div", { class: "lock" }, `${nick(p)}의 답을 기다리는 중…`));
  return out;
}
function answerForm(qid, init) {
  const ta = h("textarea", { class: "textarea", placeholder: "내 생각을 적어 줘", maxlength: 500 });
  ta.value = init;
  const btn = h("button", { class: "btn wide", onclick: async () => {
    const v = ta.value.trim();
    if (!v) return toast("답을 적어 주세요");
    btn.disabled = true;
    const first = !ansOf(qid, me());
    try { await S.api.saveAnswer(qid, v); } catch (err) { btn.disabled = false; return toast(errMsg(err)); }
    (S.answers[qid] || (S.answers[qid] = {}))[me()] = { answer: v, created_at: new Date().toISOString() };
    S.qEdit = false;
    drawSheet(); renderTab();
    toast(!first ? "답을 고쳤어요" : ansOf(qid, pid()) ? `답이 열렸어요 · ♥+${H.answer}` : `답했어요 · ♥+${H.answer}`);
  } }, init ? "고치기" : `답하기 · ♥+${H.answer}`);
  return h("div", { class: "field" }, ta, btn);
}

/* ---------------- 밸런스 ---------------- */
function renderBal() {
  const p = pid(), order = balOrder();
  const both = order.filter((b) => pickOf(b.id, me()) && pickOf(b.id, p));
  const same = both.filter((b) => pickOf(b.id, me()) === pickOf(b.id, p));
  const cur = (S.balShow && BMAP[S.balShow]) || order.find((b) => !pickOf(b.id, me()));
  const parts = [h("div", { class: "title" }, "밸런스 게임"),
    h("div", { class: "card match" },
      h("div", { class: "pct" }, both.length ? `${Math.round(same.length / both.length * 100)}%` : "–"),
      h("div", {}, h("div", { class: "h2" }, "우리 일치율"),
        h("div", { class: "sub" }, both.length ? `${both.length}개 중 ${same.length}개 같은 선택` : "둘 다 고른 게 아직 없어요")))];
  parts.push(cur ? balCard(cur) : h("div", { class: "card center", style: col(4) }, h("div", { class: "h2" }, "전부 골랐어요 🎉"), h("p", { class: "sub" }, "새 문항이 생기면 여기에 나와요")));
  const at = (b) => { const x = S.picks[b.id] || {}; return [x[me()], x[p]].reduce((a, v) => (v && v.created_at > a ? v.created_at : a), ""); };
  const recent = both.slice().sort((a, b) => (at(a) < at(b) ? 1 : -1)).slice(0, 12);
  if (recent.length) parts.push(h("div", { class: "sec" }, "최근 결과"), h("div", { class: "hist" }, recent.map((b) => {
    const mk = pickOf(b.id, me()), tk = pickOf(b.id, p);
    return h("div", {}, h("span", {}, mk === tk ? "💞" : "↔"),
      h("span", { class: "grow" }, mk === tk ? `둘 다 ${b[mk]}` : `나: ${b[mk]} · ${nick(p)}: ${b[tk]}`));
  })));
  view(...parts);
}
function balCard(b) {
  const p = pid(), mk = pickOf(b.id, me()), tk = pickOf(b.id, p), reveal = !!(mk && tk);
  const choice = (k) => {
    const who = [mk === k ? "나" : null, reveal && tk === k ? nick(p) : null].filter(Boolean);
    return h("button", { class: "choice" + (mk === k ? " mine" : "") + (reveal && tk === k ? " theirs" : ""), onclick: () => pick(b, k) },
      b[k], who.length ? h("span", { class: "tag" }, who.join(" · ")) : null);
  };
  const parts = [h("span", { class: "chip", style: { alignSelf: "flex-start" } }, DATA.balanceCats[b.cat]), choice("a"), h("div", { class: "vs" }, "VS"), choice("b")];
  if (mk) {
    parts.push(reveal ? h("div", { class: "res" }, mk === tk ? "같은 선택! 💞" : "서로 달라요 🙈")
      : h("div", { class: "lock" }, p ? josa(nick(p), "가 고르면 결과가 열려요") : "상대가 들어오면 결과를 볼 수 있어요"));
    parts.push(h("button", { class: "btn wide", onclick: () => { S.balShow = null; renderTab(); } }, "다음 →"));
  } else {
    parts.push(h("p", { class: "tiny center" }, tk ? josa(nick(p), "는 이미 골랐어요. 나도 골라야 보여요") : "골라야 상대 선택이 보여요"));
  }
  return h("div", { class: "vs-wrap" }, parts);
}
async function pick(b, k) {
  if (pickOf(b.id, me())) return;                // 한 번 고르면 끝
  try { await S.api.savePick(b.id, k); } catch (err) { return toast(errMsg(err)); }
  (S.picks[b.id] || (S.picks[b.id] = {}))[me()] = { pick: k, created_at: new Date().toISOString() };
  S.balShow = b.id;
  renderTab();
  toast(`♥+${H.pick}`);
}

/* ---------------- 같이 할 목록 (영화 · 장소 공용) ---------------- */
const wishById = (id) => S.wishes.find((w) => w.id === id);
const norm = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();
function wishNote() {
  return S.wishesErr ? h("div", { class: "banner" }, S.wishesErr) : null;
}
// 목록 한 줄. 같이 한 것은 별점 상태(💞 평균 · 🔒 상대만 · ⏳ 나만)를 오른쪽에 보여준다
const kidsOf = (id) => S.wishes.filter((x) => x.parent_id === id);
// 장소 안에 넣은 곳을 분류별로 센다 (☕2 🍽️1)
function kidsSummary(id) {
  const n = {};
  for (const k of kidsOf(id)) n[k.place_cat || "etc"] = (n[k.place_cat || "etc"] || 0) + 1;
  return Object.keys(PCAT).filter((c) => n[c]).map((c) => `${PCAT[c].ic}${n[c]}`).join(" ");
}
function wishItem(w) {
  const movie = w.kind === "movie", pc = PCAT[w.place_cat] || PCAT.etc;
  const ic = movie ? (w.done_on ? "🎞️" : "🍿") : pc.ic;
  const base = w.done_on ? `${fmtShort(w.done_on)} ${movie ? "같이 봤어요" : "다녀왔어요"}`
    : (w.memo || (movie ? `${josa(nick(w.added_by), "가")} 담았어요` : (w.address || "")));
  const sub = !movie && !w.parent_id ? [kidsSummary(w.id), base].filter(Boolean).join(" · ") : base;
  let right = null;
  if (w.done_on) {
    const mine = revOf(w.id, me()), theirs = revOf(w.id, pid());
    right = mine && theirs ? `★ ${((mine.stars + theirs.stars) / 2).toFixed(1).replace(/\.0$/, "")}`
      : theirs ? "🔒" : mine ? "⏳" : "별점 ☆";
  }
  return h("button", { class: "qitem", onclick: () => (movie ? openWish(w.id) : openPlace(w)) },
    h("span", { class: "st" }, ic),
    h("span", { class: "t" }, h("span", { class: "wt" }, w.title), sub ? h("span", { class: "tiny wsub" }, sub) : null),
    right ? h("span", { class: "wr" }, right) : null);
}
function wishSeg(kind, todo, done, labels) {
  const set = (v) => { S.wishTab[kind] = v; renderTab(); };
  return h("div", { class: "seg" },
    segBtn(`${labels[0]} ${todo}`, S.wishTab[kind] !== "done", () => set("todo")),
    segBtn(`${labels[1]} ${done}`, S.wishTab[kind] === "done", () => set("done")));
}
// 같이 한 것은 최근에 한 순, 아직 안 한 것은 최근에 담은 순
const sortWishes = (list, done) => list.slice().sort(done ? (a, b) => (a.done_on < b.done_on ? 1 : -1) : (a, b) => (a.created_at < b.created_at ? 1 : -1));

function openWish(id) {
  S.wishEdit = false; S.revEdit = false; S.revDraft = null;
  openSheet(() => drawWish(id), { onClose: () => { S.wishEdit = false; S.revEdit = false; S.revDraft = null; } });
  const w = wishById(id);
  if (w && w.kind === "place" && S.tab === "map") focusPlace(w);
}
function drawWish(id) {
  const w = wishById(id);
  if (!w) return h("p", { class: "empty" }, "지워진 항목이에요");
  const movie = w.kind === "movie", verb = movie ? "같이 봤어요" : "다녀왔어요", pc = PCAT[w.place_cat] || PCAT.etc;
  const parent = w.parent_id && wishById(w.parent_id);
  const out = [h("div", { class: "row", style: { flexWrap: "wrap", gap: "6px" } },
    h("span", { class: "chip sky" }, movie ? "🎬 같이 볼 영화" : `${pc.ic} ${pc.name}`),
    parent ? h("span", { class: "chip gray" }, `📍 ${parent.title}에서 갈 곳`) : null)];
  if (S.wishEdit) out.push(wishEditForm(w));
  else {
    out.push(h("div", { class: "q-big" }, w.title));
    if (!movie && w.address) out.push(h("div", { class: "sub", style: { marginTop: "-8px" } }, w.address));
    if (w.memo) out.push(h("div", { class: "ans" }, h("span", { class: "who" }, "메모"), h("div", { class: "txt" }, w.memo)));
    out.push(h("div", { class: "row tiny" },
      h("span", { class: "grow" }, `${josa(nick(w.added_by), "가")} 담음 · ${fmtShort(ymd(new Date(w.created_at)))}`),
      h("button", { class: "link", onclick: () => { S.wishEdit = true; drawSheet(); } }, movie ? "제목·메모 고치기" : "분류·메모 고치기")));
    if (!movie && w.place_url) out.push(h("a", { class: "btn sm line", href: w.place_url, target: "_blank", rel: "noopener" }, "카카오맵에서 자세히 보기"));
  }
  if (!w.done_on) {
    const d = h("input", { class: "input", type: "date", max: today(), value: today() });
    out.push(h("div", { class: "card", style: col() },
      h("div", { class: "sec", style: { margin: 0 } }, movie ? "같이 봤나요? 본 날을 골라 주세요" : "같이 다녀왔나요? 다녀온 날을 골라 주세요"), d,
      h("button", { class: "btn wide", onclick: () => setDone(w, d.value || today()) }, `✅ ${verb}`)));
  } else {
    out.push(h("div", { class: "row" }, h("span", { class: "chip mint" }, `✅ ${fmtDate(w.done_on)}에 ${verb}`), h("span", { class: "grow" }),
      h("button", { class: "link", onclick: () => setDone(w, null) }, "되돌리기")));
    out.push(reviewBlock(w));
  }
  out.push(h("button", { class: "btn ghost", onclick: () => delWish(w) }, "목록에서 지우기"));
  return out;
}
// 장소 분류 고르기. 다시 그리지 않고 버튼 표시만 바꾼다 (같은 시트의 입력칸이 지워지지 않게)
function pcatPicker(cur, onPick) {
  const wrap = h("div", { class: "pcats" });
  for (const [k, c] of Object.entries(PCAT)) wrap.append(h("button", { type: "button", class: k === cur ? "on" : "", "data-c": k, onclick: () => {
    wrap.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.c === k));
    onPick(k);
  } }, `${c.ic} ${c.name}`));
  return wrap;
}
function wishEditForm(w) {
  const movie = w.kind === "movie";
  const t = h("input", { class: "input", maxlength: 100, placeholder: movie ? "영화 제목" : "장소 이름" });
  t.value = w.title;
  const m = h("textarea", { class: "textarea", maxlength: 500, placeholder: "메모 (선택)", style: { minHeight: "80px" } });
  m.value = w.memo || "";
  let cat = w.place_cat || "etc";
  const save = h("button", { class: "btn grow", onclick: async () => {
    const title = t.value.trim();
    if (!title) return toast(movie ? "제목을 적어 주세요" : "이름을 적어 주세요");
    const patch = { title, memo: m.value.trim() };
    if (!movie) patch.place_cat = cat;
    save.disabled = true;
    try { await S.api.updateWish(w.id, patch); } catch (err) { save.disabled = false; return toast(errMsg(err)); }
    Object.assign(w, patch); S.wishEdit = false;
    drawSheet(); renderTab(); toast("고쳤어요");
  } }, "저장");
  return h("div", { class: "field" }, t, movie ? null : pcatPicker(cat, (k) => { cat = k; }), m,
    h("div", { class: "row" }, h("button", { class: "btn line grow", onclick: () => { S.wishEdit = false; drawSheet(); } }, "취소"), save));
}
async function setDone(w, day) {
  try { await S.api.updateWish(w.id, { done_on: day }); } catch (err) { return toast(errMsg(err)); }
  w.done_on = day;
  drawSheet(); renderTab();
  if (day) toast("옮겼어요 · 이제 별점을 남겨 보세요");
}
async function delWish(w) {
  const kids = kidsOf(w.id);
  if (!confirm(`‘${w.title}’ ${w.kind === "movie" ? "영화" : "장소"}를 목록에서 지울까요?\n`
    + `${kids.length ? `안에 추가한 곳 ${kids.length}개와 ` : ""}남긴 별점도 같이 지워져요.`)) return;
  try { await S.api.deleteWish(w.id); } catch (err) { return toast(errMsg(err)); }
  const gone = new Set([w.id, ...kids.map((k) => k.id)]);      // 서버에서는 안에 넣은 곳도 같이 지워진다
  S.wishes = S.wishes.filter((x) => !gone.has(x.id));
  for (const id of gone) delete S.reviews[id];
  if (gone.has(S.mapPlace)) S.mapPlace = null;
  closeSheet(); renderTab(); toast("지웠어요");
}

// 별점: 질문처럼 둘 다 남겨야 상대 것이 열린다
function reviewBlock(w) {
  const p = pid(), mine = revOf(w.id, me()), theirs = revOf(w.id, p);
  const out = [h("div", { class: "sec" }, "우리의 별점")];
  if (mine && !S.revEdit) out.push(revEl(me(), mine, false),
    h("button", { class: "link", style: { alignSelf: "flex-end" }, onclick: () => { S.revEdit = true; S.revDraft = null; drawSheet(); } }, "내 별점 고치기"));
  else out.push(reviewForm(w, mine));
  if (!p) out.push(h("div", { class: "lock" }, "상대가 들어오면 서로의 별점을 볼 수 있어요"));
  else if (theirs && mine) out.push(revEl(p, theirs, true));
  else if (theirs) out.push(h("div", { class: "lock" }, `🔒 ${josa(nick(p), "가 별점을 남겼어요")}`, h("br"), "내 별점을 남기면 열려요"));
  else out.push(h("div", { class: "lock" }, `${nick(p)}의 별점을 기다리는 중…`));
  return out;
}
function revEl(uid, r, them) {
  return h("div", { class: "ans" + (them ? " them" : "") },
    h("span", { class: "who" }, nick(uid) + (uid === me() ? " (나)" : "")),
    h("div", { class: "stars-v", "aria-label": `별 ${r.stars}개` }, "★".repeat(r.stars) + "☆".repeat(5 - r.stars)),
    r.review ? h("div", { class: "txt" }, r.review) : null);
}
function reviewForm(w, init) {
  const R = S.revDraft || (S.revDraft = { stars: init ? init.stars : 0, text: init ? init.review : "" });
  const stars = h("div", { class: "stars" }, [1, 2, 3, 4, 5].map((n) =>
    h("button", { type: "button", class: n <= R.stars ? "on" : "", "aria-label": `별 ${n}개`, onclick: () => { R.stars = n; drawSheet(); } }, "★")));
  const ta = h("textarea", { class: "textarea", maxlength: 300, style: { minHeight: "72px" },
    placeholder: w.kind === "movie" ? "한 줄 감상 (선택)" : "한 줄 후기 (선택)", oninput: () => { R.text = ta.value; } });
  ta.value = R.text;
  const btn = h("button", { class: "btn wide", onclick: async () => {
    if (!R.stars) return toast("별을 눌러 점수를 골라 주세요");
    btn.disabled = true;
    const first = !revOf(w.id, me()), text = R.text.trim();
    try { await S.api.saveReview(w.id, R.stars, text); } catch (err) { btn.disabled = false; return toast(errMsg(err)); }
    (S.reviews[w.id] || (S.reviews[w.id] = {}))[me()] = { stars: R.stars, review: text, created_at: new Date().toISOString() };
    S.revEdit = false; S.revDraft = null;
    drawSheet(); renderTab();
    toast(!first ? "별점을 고쳤어요" : revOf(w.id, pid()) ? "별점이 열렸어요 💞" : "별점을 남겼어요");
  } }, init ? "고치기" : "별점 남기기");
  return h("div", { class: "field" }, stars, ta, btn);
}

/* ---------------- 영화 (질문 탭 안) ---------------- */
function movieCard() {
  const all = S.wishes.filter((w) => w.kind === "movie"), done = all.filter((w) => w.done_on).length;
  const lock = waitingRevs("movie").length;
  return h("button", { class: "cat wide", onclick: () => { S.qCat = "movie"; renderTab(); window.scrollTo(0, 0); } },
    h("div", { class: "row" }, h("span", { class: "ic" }, "🎬"), h("span", { class: "nm grow" }, "같이 볼 영화"),
      lock ? h("span", { class: "chip" }, `🔒 ${lock}`) : null),
    h("span", { class: "tiny" }, "보고 싶은 영화를 모아 두고, 같이 본 뒤엔 별점을 남겨요"),
    h("span", { class: "tiny" }, `볼 영화 ${all.length - done}편 · 본 영화 ${done}편`));
}
function renderMovies() {
  const all = S.wishes.filter((w) => w.kind === "movie");
  const todo = all.filter((w) => !w.done_on), done = all.filter((w) => w.done_on);
  const showDone = S.wishTab.movie === "done", list = sortWishes(showDone ? done : todo, showDone);
  view(
    h("div", { class: "row" }, h("button", { class: "navbtn", "aria-label": "뒤로", onclick: () => { S.qCat = null; renderTab(); } }, "‹"),
      h("div", { class: "title grow" }, "🎬 같이 볼 영화")),
    h("p", { class: "sub" }, "보고 싶은 영화를 적어 두고, 같이 본 다음엔 둘 다 별점을 남겨요. 별점은 둘 다 남겨야 서로 보여요."),
    wishNote() || addMovieForm(),
    wishSeg("movie", todo.length, done.length, ["볼 영화", "본 영화"]),
    list.length ? h("div", { class: "qlist" }, list.map(wishItem))
      : h("p", { class: "empty" }, showDone ? "같이 본 영화가 여기에 쌓여요" : "보고 싶은 영화를 위에 적어 보세요"),
  );
}
function addMovieForm() {
  const k = "movie-new";
  const inp = h("input", { class: "input grow", placeholder: "보고 싶은 영화 제목", maxlength: 100, "data-k": k, enterkeyhint: "done",
    oninput: () => { S.drafts[k] = inp.value; } });
  inp.value = S.drafts[k] || "";
  const btn = h("button", { class: "btn", type: "submit" }, "담기");
  return h("form", { class: "row", onsubmit: async (e) => {
    e.preventDefault();
    const t = inp.value.trim();
    if (!t) return toast("영화 제목을 적어 주세요");
    const dup = S.wishes.find((w) => w.kind === "movie" && norm(w.title) === norm(t));
    if (dup) return toast(dup.done_on ? "이미 같이 본 영화예요" : "이미 목록에 있는 영화예요");
    btn.disabled = true;
    let w;
    try { w = await S.api.addWish({ kind: "movie", title: t }); } catch (err) { btn.disabled = false; return toast(errMsg(err)); }
    S.wishes.push(w); S.drafts[k] = ""; S.wishTab.movie = "todo";
    renderTab(); toast("🎬 목록에 담았어요");
  } }, inp, btn);
}

/* ---------------- 지도 (카카오맵) ---------------- */
// 지도는 한 번 만들어 두고, 탭을 다시 그릴 때마다 같은 지도를 다시 붙인다 (보던 위치·확대가 유지된다)
// viewKey: 지금 지도가 보여주는 화면 ("main" = 전체, 아니면 들어가 있는 장소 id). mainView: 장소에 들어가기 전 전체 지도 위치
const MAP = { box: null, el: null, msg: null, map: null, pins: [], temp: null, loading: null, cur: [], viewKey: null, mainView: null };
function loadKakao() {
  if (window.kakao && window.kakao.maps && window.kakao.maps.services) return Promise.resolve();
  if (!MAP.loading) MAP.loading = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=" + encodeURIComponent(CFG.kakaoMapKey);
    const timer = setTimeout(() => rej(new Error("kakao_timeout")), 15000);
    s.onload = () => {
      try { window.kakao.maps.load(() => { clearTimeout(timer); res(); }); }
      catch (e) { clearTimeout(timer); rej(e); }
    };
    s.onerror = () => { clearTimeout(timer); rej(new Error("kakao_load")); };
    document.head.append(s);
  }).catch((e) => { MAP.loading = null; throw e; });
  return MAP.loading;
}
function mapBox() {
  if (!MAP.box) {
    MAP.el = h("div", { class: "kmap" });
    MAP.msg = h("div", { class: "kmap-msg" }, "지도를 불러오는 중…");
    MAP.box = h("div", { class: "kmap-box" }, MAP.el, MAP.msg,
      h("button", { class: "kmap-fit", onclick: () => fitPins(MAP.cur, true) }, "전체 보기"));
  }
  return MAP.box;
}
const hasPos = (w) => w.lat != null && w.lng != null;
// 장소 목록에서 누르면: 큰 장소는 그 안으로 들어가고, 안에 넣은 곳은 그 장소 화면에서 상세 창을 연다
function openPlace(w) {
  if (w.parent_id) { if (S.mapPlace !== w.parent_id) enterPlace(w.parent_id); openWish(w.id); }
  else if (S.tab === "map") enterPlace(w.id);
  else openWish(w.id);
}
function enterPlace(id) {
  S.mapPlace = id; S.mapResults = null; S.drafts["near-q"] = ""; clearTemp();
  renderTab(); window.scrollTo(0, 0);
}
function leavePlace() { S.mapPlace = null; S.mapResults = null; clearTemp(); renderTab(); window.scrollTo(0, 0); }
const mapKeyBanner = () => h("div", { class: "banner" }, "지도를 띄우려면 카카오맵 키가 필요해요. config.js의 kakaoMapKey에 넣어 주세요 (README ‘지도 설정’)");

function renderMap() {
  if (S.mapPlace && !wishById(S.mapPlace)) S.mapPlace = null;      // 그사이 지워졌다
  if (S.mapPlace) return renderPlace(wishById(S.mapPlace));
  const all = S.wishes.filter((w) => w.kind === "place" && !w.parent_id);
  const todo = all.filter((w) => !w.done_on), done = all.filter((w) => w.done_on);
  const showDone = S.wishTab.place === "done", shown = sortWishes(showDone ? done : todo, showDone);
  const note = wishNote(), key = !!CFG.kakaoMapKey;
  const parts = [h("div", { class: "title" }, "지도"),
    h("p", { class: "sub", style: { marginTop: "-8px" } }, "같이 가 보고 싶은 곳을 찾아서 핀을 꽂아 둬요. 핀을 누르면 그 안에 갈 카페·밥집을 모을 수 있어요")];
  if (note) parts.push(note);
  else if (!key) parts.push(mapKeyBanner());
  else {
    parts.push(placeSearchForm("map-q", "장소 검색 (예: 북촌, 성수 카페, 해운대)", (q) => searchPlaces(q, null)));
    if (S.mapResults) parts.push(resultsEl());
    parts.push(mapBox());
  }
  parts.push(wishSeg("place", todo.length, done.length, ["가고 싶은 곳", "다녀온 곳"]),
    shown.length ? h("div", { class: "qlist" }, shown.map(wishItem))
      : h("p", { class: "empty" }, showDone ? "같이 다녀온 곳이 여기에 쌓여요" : key && !note ? "위에서 장소를 검색해 저장해 보세요" : "아직 저장한 곳이 없어요"));
  view(...parts);
  if (key && !note) mountMap(shown.map((w) => ({ w, cls: w.done_on ? "done" : "", onclick: () => enterPlace(w.id) })), "main");
}
// 장소 안: 그 근처에서 갈 카페·밥집 등을 찾아 넣고, 분류별로 모아 본다
function renderPlace(p) {
  const kids = kidsOf(p.id), pc = PCAT[p.place_cat] || PCAT.etc;
  const note = wishNote(), key = !!CFG.kakaoMapKey;
  const parts = [
    h("div", { class: "row" }, h("button", { class: "navbtn", "aria-label": "뒤로", onclick: leavePlace }, "‹"),
      h("div", { class: "title grow" }, p.title)),
    h("div", { class: "card", style: col(8) },
      h("div", { class: "row", style: { flexWrap: "wrap", gap: "6px" } },
        h("span", { class: "chip sky" }, `${pc.ic} ${pc.name}`),
        p.done_on ? h("span", { class: "chip mint" }, `✅ ${fmtShort(p.done_on)} 다녀옴`) : null,
        h("span", { class: "grow" }),
        h("button", { class: "link", onclick: () => openWish(p.id) }, "메모·별점 ›")),
      p.address ? h("div", { class: "sub" }, p.address) : null,
      p.memo ? h("div", { class: "memo-t" }, p.memo) : null),
  ];
  if (note) parts.push(note);
  else if (!key) parts.push(mapKeyBanner());
  else {
    parts.push(placeSearchForm("near-q", "이 근처에서 찾기 (예: 칼국수, 카페)", (q) => searchPlaces(q, p)),
      h("div", { class: "pcats" }, NEAR_QUICK.map(([label, q]) =>
        h("button", { type: "button", onclick: () => { S.drafts["near-q"] = q; searchPlaces(q, p); } }, label))));
    if (S.mapResults) parts.push(resultsEl());
    parts.push(mapBox());
  }
  parts.push(h("div", { class: "h2", style: { marginTop: "6px" } }, `여기서 갈 곳 ${kids.length ? kids.length : ""}`));
  if (!kids.length) parts.push(h("p", { class: "empty" }, key && !note ? "위에서 근처 카페·밥집을 찾아 추가해 보세요" : "아직 추가한 곳이 없어요"));
  for (const [c, info] of Object.entries(PCAT)) {
    const g = kids.filter((k) => (PCAT[k.place_cat] ? k.place_cat : "etc") === c);
    if (g.length) parts.push(h("div", { class: "sec" }, `${info.ic} ${info.name} ${g.length}`), h("div", { class: "qlist" }, g.map(wishItem)));
  }
  view(...parts);
  if (key && !note) mountMap([
    { w: p, cls: "main" + (p.done_on ? " done" : ""), onclick: () => openWish(p.id), z: 2 },
    ...kids.map((k) => ({ w: k, cls: "sm" + (k.done_on ? " done" : ""), onclick: () => openWish(k.id), z: 1 })),
  ], p.id);
}
// pins: [{w, cls, onclick, z}]. key가 바뀌면(전체 ↔ 장소 안) 그 화면에 맞게 지도를 옮긴다
function mountMap(pins, key) {
  MAP.cur = pins.map((p) => p.w);
  loadKakao().then(() => {
    if (S.tab !== "map" || !MAP.box.isConnected) return;
    const K = window.kakao.maps;
    if (!MAP.map) {
      MAP.map = new K.Map(MAP.el, { center: new K.LatLng(37.5665, 126.978), level: 8 });
      MAP.msg.classList.add("hide");
    } else {
      const c = MAP.map.getCenter(); MAP.map.relayout(); MAP.map.setCenter(c);   // 다시 붙였으니 크기를 다시 잰다
    }
    drawPins(pins);
    const f = S.mapFocus && MAP.cur.find((w) => w.id === S.mapFocus);
    S.mapFocus = null;
    if (MAP.viewKey !== key) {
      if (MAP.viewKey === "main") MAP.mainView = { c: MAP.map.getCenter(), l: MAP.map.getLevel() };
      const back = key === "main" && MAP.mainView;
      MAP.viewKey = key;
      if (f) focusPlace(f);
      else if (back) { MAP.map.setLevel(back.l); MAP.map.setCenter(back.c); }
      else fitPins(MAP.cur);
    } else if (f) focusPlace(f);
  }).catch((e) => {
    console.warn(e);
    MAP.msg.textContent = "카카오맵을 불러오지 못했어요. 인터넷 연결이나, 카카오 개발자 사이트의 키·사이트 도메인 등록을 확인해 주세요";
    MAP.msg.classList.remove("hide");
  });
}
function pinEl(cls, ic, label, onclick) {
  return h("button", { class: "pin " + cls, "aria-label": label, title: label, onclick }, h("span", {}, ic));
}
function drawPins(pins) {
  const K = window.kakao.maps;
  for (const o of MAP.pins) o.setMap(null);
  MAP.pins = pins.filter((p) => hasPos(p.w)).map((p) => {
    const o = new K.CustomOverlay({ position: new K.LatLng(p.w.lat, p.w.lng), yAnchor: 1.2, clickable: true, zIndex: p.z || 0,
      content: pinEl(p.cls, (PCAT[p.w.place_cat] || PCAT.etc).ic, p.w.title, p.onclick) });
    o.setMap(MAP.map);
    return o;
  });
}
function fitPins(places, always) {
  if (!MAP.map) return;
  const K = window.kakao.maps, pts = places.filter(hasPos);
  if (!pts.length) { if (always) toast("지도에 표시할 곳이 없어요"); return; }
  if (pts.length === 1) { MAP.map.setLevel(4); MAP.map.setCenter(new K.LatLng(pts[0].lat, pts[0].lng)); return; }
  const b = new K.LatLngBounds();
  for (const w of pts) b.extend(new K.LatLng(w.lat, w.lng));
  MAP.map.setBounds(b, 40, 40, 40, 40);
}
function focusPlace(w) {
  if (!MAP.map || !hasPos(w)) return;
  if (MAP.map.getLevel() > 5) MAP.map.setLevel(5);
  MAP.map.panTo(new window.kakao.maps.LatLng(w.lat, w.lng));
}
function showTemp(lat, lng, label) {
  clearTemp();
  if (!MAP.map) return;
  const K = window.kakao.maps;
  MAP.temp = new K.CustomOverlay({ position: new K.LatLng(lat, lng), yAnchor: 1.2, content: pinEl("temp", "📌", label) });
  MAP.temp.setMap(MAP.map);
  if (MAP.map.getLevel() > 5) MAP.map.setLevel(5);
  MAP.map.panTo(new K.LatLng(lat, lng));
}
function clearTemp() { if (MAP.temp) { MAP.temp.setMap(null); MAP.temp = null; } }

function placeSearchForm(k, placeholder, onSearch) {
  const inp = h("input", { class: "input grow", type: "search", placeholder, "data-k": k,
    enterkeyhint: "search", oninput: () => { S.drafts[k] = inp.value; } });
  inp.value = S.drafts[k] || "";
  return h("form", { class: "row", onsubmit: (e) => {
    e.preventDefault();
    const q = inp.value.trim();
    if (!q) return toast("찾을 장소를 적어 주세요");
    inp.blur();          // 폰 키보드를 내려서 결과가 보이게
    onSearch(q);
  } }, inp, h("button", { class: "btn", type: "submit" }, "검색"));
}
// near가 있으면 그 장소 2km 안에서 가까운 순으로 찾는다
async function searchPlaces(q, near) {
  const nearId = near ? near.id : null;
  S.mapResults = { q, loading: true, list: [], near: nearId };
  renderTab();
  try { await loadKakao(); } catch (e) { S.mapResults = null; renderTab(); return toast("카카오맵을 불러오지 못했어요"); }
  const sv = window.kakao.maps.services, St = sv.Status;
  const opt = near && hasPos(near)
    ? { location: new window.kakao.maps.LatLng(near.lat, near.lng), radius: 2000, sort: sv.SortBy.DISTANCE } : undefined;
  new sv.Places().keywordSearch(q, (data, status) => {
    if (!S.mapResults || S.mapResults.q !== q || S.mapResults.near !== nearId) return;   // 그사이 다른 걸 검색했다
    if (status === St.ERROR) { S.mapResults = null; toast("검색하지 못했어요. 잠시 후 다시 해 주세요"); }
    else S.mapResults = { q, loading: false, list: status === St.OK ? data.slice(0, 15) : [], near: nearId };
    if (S.tab === "map") renderTab();
  }, opt);
}
const fmtDist = (m) => { m = Number(m); return !m && m !== 0 ? "" : m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`; };
const sameSpot = (w, r) => w.kind === "place" && ((w.place_url && w.place_url === r.place_url)
  || (w.title === r.place_name && hasPos(w) && Math.abs(w.lat - Number(r.y)) < 1e-4 && Math.abs(w.lng - Number(r.x)) < 1e-4));
function resultsEl() {
  const R = S.mapResults;
  const head = h("div", { class: "row" },
    h("div", { class: "sec grow", style: { margin: "0 2px" } }, R.loading ? "찾는 중…" : `‘${R.q}’ 검색 결과 ${R.list.length}개`),
    h("button", { class: "link", onclick: () => { S.mapResults = null; clearTemp(); renderTab(); } }, "닫기"));
  if (R.loading) return h("div", { class: "results" }, head);
  if (!R.list.length) return h("div", { class: "results" }, head, h("p", { class: "empty" }, "검색 결과가 없어요. 다른 이름으로 찾아보세요"));
  const near = R.near && wishById(R.near);
  return h("div", { class: "results" }, head, h("div", { class: "res-list" }, R.list.map((r) => {
    const saved = S.wishes.find((w) => sameSpot(w, r));
    const where = [r.distance ? fmtDist(r.distance) : "", r.road_address_name || r.address_name].filter(Boolean).join(" · ");
    const kind = r.category_name ? r.category_name.split(" > ").pop() : (r.category_group_name || "장소");
    return h("button", { class: "res-it", onclick: () => (saved ? openPlace(saved) : openNewPlace(r, near)) },
      h("span", { class: "t" }, h("span", { class: "wt" }, r.place_name), h("span", { class: "tiny wsub" }, where)),
      h("span", { class: "chip" + (saved ? " mint" : " gray") }, saved ? "저장됨" : kind));
  })));
}
// parent가 있으면 그 장소 안에 넣는다 (예: 북촌 한옥마을 → 근처 카페)
function openNewPlace(r, parent) {
  const F = { cat: guessCat(r), memo: "", busy: false };
  showTemp(Number(r.y), Number(r.x), r.place_name);
  openSheet(() => drawNewPlace(r, F, parent), { onClose: clearTemp });
}
function drawNewPlace(r, F, parent) {
  const memo = h("textarea", { class: "textarea", maxlength: 500, style: { minHeight: "80px" },
    placeholder: "여기서 뭐 하고 싶어? (선택)", oninput: () => { F.memo = memo.value; } });
  memo.value = F.memo;
  const add = async (done) => {
    if (F.busy) return;
    F.busy = true;
    let w;
    try {
      w = await S.api.addWish({ kind: "place", title: r.place_name, memo: F.memo.trim(), lat: Number(r.y), lng: Number(r.x),
        address: r.road_address_name || r.address_name || null, place_url: r.place_url || null, place_cat: F.cat, done_on: done ? today() : null,
        ...(parent ? { parent_id: parent.id } : {}) });    // 큰 장소는 parent_id를 아예 안 보낸다 (칸이 없는 옛 DB에서도 저장되게)
    } catch (err) { F.busy = false; return toast(errMsg(err)); }
    S.wishes.push(w); S.mapResults = null; S.mapFocus = w.id;
    if (!parent) S.wishTab.place = done ? "done" : "todo";
    closeSheet(); renderTab();
    toast(parent ? `${parent.title}에 추가했어요 📍`
      : done ? "다녀온 곳에 저장했어요 · 별점을 남겨 보세요" : "가고 싶은 곳에 저장했어요 📍");
  };
  const addr = r.road_address_name || r.address_name;
  return [
    h("div", { class: "row", style: { flexWrap: "wrap", gap: "6px" } },
      h("span", { class: "chip sky" }, r.category_name ? r.category_name.split(" > ").pop() : "장소"),
      parent ? h("span", { class: "chip gray" }, `📍 ${parent.title} 근처${r.distance ? " " + fmtDist(r.distance) : ""}`) : null),
    h("div", { class: "q-big" }, r.place_name),
    addr ? h("div", { class: "sub", style: { marginTop: "-8px" } }, addr) : null,
    r.place_url ? h("a", { class: "link", href: r.place_url, target: "_blank", rel: "noopener" }, "카카오맵에서 자세히 보기") : null,
    h("div", { class: "sec" }, "분류"),
    pcatPicker(F.cat, (k) => { F.cat = k; }),
    memo,
    h("button", { class: "btn wide", onclick: () => add(false) }, parent ? `📍 ${parent.title}에 추가` : "📍 가고 싶은 곳에 저장"),
    h("button", { class: "btn wide line", onclick: () => add(true) }, parent ? "✅ 이미 가 본 곳이에요" : "✅ 이미 다녀온 곳이에요"),
  ];
}

/* ---------------- 우리 (설정) ---------------- */
function renderUs() {
  const p = partner(), demo = S.api.kind === "demo";
  const start = h("input", { class: "input", type: "date", max: today(), value: S.couple.start_date || "", onchange: async () => {
    const v = start.value || null;
    try { await S.api.updateCouple({ start_date: v }); S.couple.start_date = v; toast(v ? "사귄 날을 바꿨어요" : "사귄 날을 지웠어요"); renderTab(); }
    catch (err) { toast(errMsg(err)); }
  } });
  const nm = h("input", { class: "input grow", maxlength: 10, value: nick(me()) });
  const parts = [
    h("div", { class: "title" }, "우리"),
    h("div", { class: "card", style: col(12) },
      h("div", { class: "names" }, nick(me()), h("span", { class: "hrt" }, "♥"), p ? nick(p.user_id) : h("span", { class: "sub" }, "기다리는 중")),
      h("div", { class: "field" }, h("label", {}, "사귄 날"), start),
      S.couple.start_date ? h("p", { class: "sub" }, `오늘로 ${Math.max(0, daysBetween(S.couple.start_date, today()) + 1)}일째예요`) : null),
    h("div", { class: "card", style: col() },
      h("div", { class: "field" }, h("label", {}, "내 이름"),
        h("div", { class: "row" }, nm, h("button", { class: "btn sm", onclick: async () => {
          const v = nm.value.trim();
          if (!v) return toast("이름을 넣어 주세요");
          try { await S.api.updateNickname(v); S.members.find((m) => m.user_id === me()).nickname = v; toast("이름을 바꿨어요"); renderTab(); }
          catch (err) { toast(errMsg(err)); }
        } }, "저장")))),
  ];
  if (!p) parts.push(inviteCard());
  parts.push(h("div", { class: "card", style: col(4) },
    h("div", { class: "row" }, h("div", { class: "h2 grow" }, "우리 하트"), h("span", { class: "hearts" }, `♥ ${Math.max(0, hearts())}`)),
    h("p", { class: "sub" }, `질문에 답하면 +${H.answer}, 캘린더에 기록하면 +${H.entry}, 밸런스를 고르면 +${H.pick}. 둘이 모은 하트로 방을 꾸며요.`)));
  const list = h("div", { class: "list" });
  if (demo) {
    list.append(
      h("button", { class: "it", onclick: demoSwitch }, h("span", { class: "grow" }, "상대 입장으로 바꿔 보기"), h("span", { class: "tiny" }, `지금: ${nick(me())}`)),
      h("button", { class: "it", onclick: () => { if (confirm("데모를 처음 상태로 되돌릴까요?")) { S.api.reset(); location.reload(); } } }, h("span", { class: "grow" }, "데모 처음부터")),
      h("button", { class: "it", onclick: () => { localStorage.removeItem(MODE_KEY); location.reload(); } }, h("span", { class: "grow" }, "데모 끝내기")));
  } else {
    list.append(
      h("div", { class: "it" }, h("span", { class: "grow sub" }, "로그인 계정"), h("span", { class: "tiny" }, S.user.email || "")),
      h("button", { class: "it", onclick: logout }, h("span", { class: "grow" }, "로그아웃")));
  }
  parts.push(list);
  parts.push(h("button", { class: "btn ghost", onclick: leave }, "커플 연결 끊기"), h("p", { class: "tiny center" }, "둘이서 · v2"));
  view(...parts);
}
async function demoSwitch() {
  S.api.switchUser();
  S.user = await S.api.session();
  S.balShow = null;
  await afterLogin();
  toast(`이제 ${josa(nick(me()), "의")} 화면이에요`);
}
async function logout() {
  try { await S.api.signOut(); } catch (e) { /* 무시 */ }
  location.reload();
}
async function leave() {
  if (!confirm("정말 연결을 끊을까요?\n둘 다 나가면 우리 기록이 모두 사라져요.")) return;
  if (!confirm("한 번 더 확인할게요. 연결을 끊을까요?")) return;
  try { await S.api.leaveCouple(); } catch (err) { return toast(errMsg(err)); }
  if (S.api.kind === "demo") localStorage.removeItem(MODE_KEY);
  location.reload();
}

/* =====================================================================
   시작
   ===================================================================== */
let unsub = null;
async function afterLogin() {
  noTabs();
  view(h("div", { class: "spin" }));
  let c;
  try { c = await S.api.loadCouple(); } catch (err) { return renderError(err); }
  if (!c) return renderCoupleSetup("new");
  S.couple = c.couple; S.members = c.members;
  try { await loadAll(); } catch (err) { return renderError(err); }
  if (unsub) unsub();
  unsub = S.api.subscribe(onRemote);
  showMain();
}
async function boot() {
  const hasCfg = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  const demo = localStorage.getItem(MODE_KEY) === "demo";
  if (!hasCfg && !demo) return renderSetup();
  S.api = demo ? DemoApi() : SupaApi();
  if (S.api.onSignedOut) S.api.onSignedOut(() => location.reload());
  try { S.user = await S.api.session(); } catch (e) { console.error(e); }
  if (!S.user) return renderAuth("in");
  await afterLogin();
}
// 앱으로 돌아오면 놓친 변경을 한 번 더 받아 온다
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && S.couple) ["couples", "answers", "balance_picks", "room_items", "entries", "wishes", "events"].forEach(onRemote);
});

// 테스트에서 들여다볼 수 있게 열어 둔다
window.__duriseo = { S, Q, BAL, todayQ, hearts, questionOrder, annivLabel, occursOn, nextOcc, upcoming };
boot();
})();
