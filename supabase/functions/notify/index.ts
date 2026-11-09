// =====================================================================
//  둘이서 — 알림 보내기 (Supabase Edge Function, 이름: notify)
//  1) 기록이 생기면 setup.sql의 트리거가 부른다 → 상대 폰에 알림
//     body: { table, op, actor, record }
//  2) 매일 아침 GitHub Actions가 부른다 → 오늘·내일 생일/기념일, 오늘 열리는 편지
//     body: { daily: true }
//  누가 함부로 불러도 문제없게, 받은 내용은 믿지 않고 DB에서 다시 읽어서 그 커플에게만 보낸다.
//  필요한 Secret: VAPID_PRIVATE_KEY (README '알림 설정'). 서버 키는 Supabase가 넣어 준다.
// =====================================================================
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

// 공개키는 앱(config.js)과 같은 값. 공개돼도 되는 키라 코드에 둔다
const VAPID_PUBLIC = "BLZC6AuaoH4HrquCfOFgCmLvTK78_4Qvagg7_9Op4v-L8ZQwWen8RW6V-sNr-006oCi64bBCjTsrjcCfp3yvlpE";
const APP_URL = "https://minjejeong.github.io/make_application/";

// 서버 키: 직접 넣은 SERVICE_KEY > 예전 service_role > 새 secret 키 목록 순으로 찾는다
function serviceKey(): string {
  const direct = Deno.env.get("SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (direct) return direct;
  try {
    const all = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const first = Object.values(all)[0];
    if (typeof first === "string") return first;
  } catch (_) { /* 무시 */ }
  throw new Error("서버 키를 찾지 못했어요 (Secret SERVICE_KEY에 sb_secret_ 키를 넣어 주세요)");
}
const sb = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), { auth: { persistSession: false } });
webpush.setVapidDetails(APP_URL, VAPID_PUBLIC, Deno.env.get("VAPID_PRIVATE_KEY") || "");

type Msg = { title: string; body: string; tag?: string };

/* ---------- 보내기 ---------- */
async function members(couple: string): Promise<{ user_id: string; nickname: string }[]> {
  const { data } = await sb.from("couple_members").select("user_id,nickname").eq("couple_id", couple);
  return data || [];
}
const nameOf = (ms: { user_id: string; nickname: string }[], uid: string) =>
  (ms.find((m) => m.user_id === uid)?.nickname || "상대").trim() || "상대";

// 받침에 맞춘 조사 (바다가 / 하늘이)
function josa(name: string, pair: [string, string]) {
  const c = name.charCodeAt(name.length - 1);
  const jong = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return name + (jong ? pair[1] : pair[0]);
}
const ga = (n: string) => josa(n, ["가", "이"]);

// 같은 key로 minutes 안에 보낸 적 있으면 건너뛴다 (연달아 답할 때 알림 폭탄 방지)
async function once(key: string, minutes: number): Promise<boolean> {
  const { data } = await sb.from("push_log").select("sent_at").eq("key", key).maybeSingle();
  if (data && Date.now() - new Date(data.sent_at).getTime() < minutes * 60e3) return false;
  await sb.from("push_log").upsert({ key, sent_at: new Date().toISOString() });
  return true;
}

async function sendTo(userIds: string[], msg: Msg) {
  if (!userIds.length) return 0;
  const { data: subs } = await sb.from("push_subs").select("endpoint,p256dh,auth").in("user_id", userIds);
  let n = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ ...msg, url: APP_URL }), { TTL: 60 * 60 * 24 });
      n++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint);   // 알림을 끈 기기
      else console.warn("push 실패", code, String(e));
    }
  }
  return n;
}

/* ---------- 1) 기록이 생겼을 때 ---------- */
const short = (s: string, n = 60) => (s.length > n ? s.slice(0, n) + "…" : s);
const md = (ds: string) => { const [, m, d] = ds.split("-").map(Number); return `${m}월 ${d}일`; };

async function onRecord(table: string, op: string, rec: Record<string, any>) {
  // 받은 record는 '어느 행인지'만 쓰고, 내용은 DB에서 다시 읽는다
  let row: Record<string, any> | null = null;
  if (table === "answers") {
    ({ data: row } = await sb.from("answers").select("*").eq("couple_id", rec.couple_id).eq("question_id", rec.question_id).eq("user_id", rec.user_id).maybeSingle());
  } else if (table === "balance_picks") {
    ({ data: row } = await sb.from("balance_picks").select("*").eq("couple_id", rec.couple_id).eq("item_id", rec.item_id).eq("user_id", rec.user_id).maybeSingle());
  } else if (table === "wish_reviews") {
    ({ data: row } = await sb.from("wish_reviews").select("*").eq("wish_id", rec.wish_id).eq("user_id", rec.user_id).maybeSingle());
  } else if (["entries", "wishes", "events", "letters"].includes(table)) {
    ({ data: row } = await sb.from(table).select("*").eq("id", rec.id).maybeSingle());
  }
  if (!row) return "no-row";
  const couple = row.couple_id as string;
  const actor = (row.user_id || row.from_user || (op === "INSERT" ? (row.added_by || row.created_by) : null) || rec.actor) as string;
  if (!actor) return "no-actor";
  const ms = await members(couple);
  const who = nameOf(ms, actor), to = ms.map((m) => m.user_id).filter((u) => u !== actor);
  if (!to.length) return "alone";

  let msg: Msg | null = null, key = `${couple}:${actor}:${table}`, gap = 10;
  if (table === "answers") { msg = { title: `💬 ${ga(who)} 질문에 답했어요`, body: "나도 답하면 서로의 답이 열려요" }; gap = 30; }
  else if (table === "balance_picks") { msg = { title: `⚖️ ${ga(who)} 밸런스 게임을 골랐어요`, body: "나도 고르면 결과가 보여요" }; gap = 60; }
  else if (table === "entries") msg = { title: `📅 ${ga(who)} ${md(row.day)} 기록을 남겼어요`, body: row.memo ? short(row.memo) : "사진을 올렸어요" };
  else if (table === "events") msg = { title: `📅 ${ga(who)} 일정을 넣었어요`, body: `${row.icon} ${row.title} · ${md(row.day)}` };
  else if (table === "letters") { msg = { title: `💌 ${ga(who)} 타임캡슐 편지를 묻었어요`, body: `${md(row.open_on)}에 열려요` }; gap = 0; }
  else if (table === "wish_reviews") {
    const { data: w } = await sb.from("wishes").select("title").eq("id", row.wish_id).maybeSingle();
    msg = { title: `⭐ ${ga(who)} ‘${w?.title || ""}’ 별점을 남겼어요`, body: "나도 남기면 서로의 별점이 열려요" };
  } else if (table === "wishes") {
    const verb = { movie: "같이 봤다고", place: "다녀왔다고", bucket: "이뤘다고" }[row.kind as string] || "했다고";
    if (op === "UPDATE") { msg = { title: `✅ ${ga(who)} ‘${row.title}’ ${verb} 체크했어요`, body: "별점을 남겨 보세요" }; key += ":done:" + row.id; gap = 0; }
    else if (row.kind === "movie") msg = { title: `🎬 ${ga(who)} 보고 싶은 영화를 담았어요`, body: row.title };
    else if (row.kind === "bucket") msg = { title: `🌟 ${ga(who)} 버킷리스트를 추가했어요`, body: row.title };
    else if (row.parent_id) {
      const { data: p } = await sb.from("wishes").select("title").eq("id", row.parent_id).maybeSingle();
      msg = { title: `📍 ${ga(who)} ‘${p?.title || ""}’에 갈 곳을 추가했어요`, body: row.title };
    } else msg = { title: `📍 ${ga(who)} 가고 싶은 곳을 저장했어요`, body: row.title };
  }
  if (!msg) return "skip";
  if (gap && !(await once(key, gap))) return "dedupe";
  return `sent ${await sendTo(to, { ...msg, tag: table })}`;
}

/* ---------- 2) 매일 아침 ---------- */
// 한국 날짜 (YYYY-MM-DD)
const kst = (offsetDays = 0) => new Date(Date.now() + 9 * 3600e3 + offsetDays * 864e5).toISOString().slice(0, 10);
const dayNum = (s: string) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const clampYmd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(Math.min(d, daysIn(y, m))).padStart(2, "0")}`;
// 앱(app.js)의 occursOn과 같은 규칙
function occursOn(ev: { day: string; repeat: string }, ds: string) {
  if (ds < ev.day) return false;
  const [, sm, sd] = ev.day.split("-").map(Number), [y, m] = ds.split("-").map(Number);
  if (ev.repeat === "weekly") return (dayNum(ds) - dayNum(ev.day)) % 7 === 0;
  if (ev.repeat === "monthly") return ds === clampYmd(y, m, sd);
  if (ev.repeat === "yearly") return ds === clampYmd(y, sm, sd);
  return ds === ev.day;
}
// 앱의 annivLabel과 같은 규칙 (100일 단위 · 주년)
function anniv(start: string | null, ds: string) {
  if (!start) return "";
  const n = dayNum(ds) - dayNum(start) + 1;
  if (n > 1 && n % 100 === 0) return `${n}일`;
  const [sy, sm, sd] = start.split("-").map(Number), [y, m, d] = ds.split("-").map(Number);
  return y > sy && m === sm && d === sd ? `${y - sy}주년` : "";
}

async function daily() {
  const today = kst(0), tomorrow = kst(1);
  const { data: subs } = await sb.from("push_subs").select("couple_id");
  const couples = [...new Set((subs || []).map((s) => s.couple_id as string))];
  const out: string[] = [];
  for (const c of couples) {
    if (!(await once(`daily:${c}:${today}`, 60 * 20))) { out.push(`${c}: 이미 보냄`); continue; }
    const [{ data: couple }, { data: evs }, { data: letters }, ms] = await Promise.all([
      sb.from("couples").select("start_date").eq("id", c).maybeSingle(),
      sb.from("events").select("title,icon,day,repeat").eq("couple_id", c),
      sb.from("letters").select("from_user,title,open_on").eq("couple_id", c).eq("open_on", today),
      members(c),
    ]);
    const all = ms.map((m) => m.user_id), lines: string[] = [];
    for (const [ds, when] of [[today, "오늘"], [tomorrow, "내일"]] as const) {
      const a = anniv(couple?.start_date ?? null, ds);
      if (a) lines.push(`💗 ${when}은 ${a} 기념일이에요`);
      for (const e of evs || []) if (occursOn(e, ds)) lines.push(`${e.icon} ${when}은 ${e.title}`);
    }
    if (lines.length) await sendTo(all, { title: lines[0], body: lines.slice(1).join(" · ") || "둘이서에서 확인해 보세요", tag: "daily" });
    // 오늘 열리는 편지는 받는 사람에게만
    for (const l of letters || []) {
      const to = all.filter((u) => u !== l.from_user);
      await sendTo(to, { title: `💌 ${ga(nameOf(ms, l.from_user))} 쓴 편지가 오늘 열렸어요`, body: l.title || "추억 › 편지에서 읽어 보세요", tag: "letter" });
    }
    out.push(`${c}: ${lines.length}줄, 편지 ${letters?.length || 0}`);
  }
  return out.join("\n") || "알림 받을 기기 없음";
}

/* ---------- 입구 ---------- */
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("둘이서 notify — POST만 받아요", { status: 405 });
  try {
    const body = await req.json();
    const res = body.daily ? await daily() : await onRecord(String(body.table), String(body.op || "INSERT"), body.record || {});
    return new Response(res, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    console.error(e);
    return new Response("error: " + String(e), { status: 500 });
  }
});
