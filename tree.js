/* =====================================================================
   둘이서 — 함께 키우는 나무 (그림)
   DuriseoTree.svg({ stage, season, hour, forest, christmas, special, names, seed })
     stage   0 씨앗 · 1 새싹 · 2 어린 나무 · 3 나무 · 4 큰 나무 · 5 꽃 피는 나무
     season  spring · summer · autumn · winter
     hour    0~24 (소수 가능). 해·달 위치와 하늘색이 이걸로 정해진다
     forest  주변에 자란 나무 수 (0~12)
     christmas  true면 큰 나무가 장식한 전나무가 된다
     special  "anniv"(하트 풍선) · "birthday"(풍선) · null
   그림 원칙: 빛은 왼쪽 위 하나. 색은 따뜻하게(지평선 크림빛, 그늘은 보랏빛 갈색), 마지막에 종이 결 + 비네트.
   ===================================================================== */
(function () {
  "use strict";
  // leaf: [빛, 본색, 그늘, 깊은 그늘]
  const SEASON = {
    spring: { sky: ["#9CCBEE", "#FFE8E6"], mtn: "#C7C3DC", far: ["#DCEBBE", "#C9E0A6"], near: ["#C8E2A2", "#B2D58D"], ground: ["#BEE095", "#97C673"],
              leaf: ["#FFF0F4", "#F9BBCF", "#E893B0", "#C76F90"], leaf2: ["#D2EBB4", "#A4D488", "#7DB868"], fir: ["#5FAE7B", "#3C8A5E"], sprout: ["#BDE495", "#6AB65C"], grass: "#6FA855" },
    summer: { sky: ["#7FC2EE", "#FCEFD6"], mtn: "#A8BBD6", far: ["#BCDD95", "#A6D27F"], near: ["#A4D27C", "#8CC468"], ground: ["#A2D070", "#7CB85A"],
              leaf: ["#D6EE9C", "#86C76A", "#4E9E58", "#2F7748"], leaf2: ["#BFE38F", "#79BF67", "#4E9A58"], fir: ["#4F9D6A", "#2C7550"], sprout: ["#AEDE80", "#4FA650"], grass: "#5E9C48" },
    autumn: { sky: ["#93BCE0", "#FFE4C4"], mtn: "#C4B3A3", far: ["#EDCE95", "#E2BC7E"], near: ["#E2BA7A", "#D3A666"], ground: ["#DFB676", "#C99C5C"],
              leaf: ["#FFE7A0", "#F7AA52", "#DE6F3C", "#B04C2C"], leaf2: ["#F9D06A", "#EB9142", "#C95A31"], fir: ["#6E9A68", "#4C7A50"], sprout: ["#EBDB72", "#C9A33A"], grass: "#B48A4C" },
    winter: { sky: ["#A9C1E2", "#FBEDE6"], mtn: "#CFCBDF", far: ["#F6F2F4", "#E9E4EE"], near: ["#F3EFF3", "#E4DEEB"], ground: ["#FDFAF7", "#E9E3EE"],
              leaf: ["#FFFFFF", "#F6F1F3", "#DDD4E4", "#BDB2CF"], leaf2: ["#FFFFFF", "#F2EDF2", "#D5CCDF"], fir: ["#4E8C72", "#2C6853"], sprout: ["#A8D08F", "#5E9E58"], grass: "#9AA88E" },
  };
  const NIGHT = ["#141A3C", "#2E3563"];
  const SCENES = ["lake", "hanriver", "valley", "beach", "halloween", "london", "park", "market", "seattle",
                  "cabin", "jeju", "paris", "santorini", "palace", "sunflower", "aurora", "space", "undersea",
                  "newyork", "tokyo", "egypt", "rome", "sydney", "venice", "alps", "busan", "gyeongju",
                  "seollal", "chuseok", "hangul", "newyear", "sweet"];
  const NO_SUN = ["halloween", "market", "space", "undersea", "aurora", "chuseok"], NO_MOON = ["space", "undersea", "chuseok"];
  let uid = 0;
  const f = (n) => Math.round(n * 10) / 10;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hex = (c) => c.length === 4 ? [1, 2, 3].map((i) => parseInt(c[i] + c[i], 16)) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));   // #fff · #ffffff 둘 다
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, "0")).join(""); };
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // 시간별 하늘 [위, 아래]. 낮은 계절 색
  function skyAt(h, season) {
    const D = SEASON[season].sky;
    const K = [[0, ...NIGHT], [4.6, "#22265A", "#524880"], [5.8, "#6371AB", "#F6B39A"], [7.2, "#8DBBE4", "#FFE2C4"], [9, ...D], [16, ...D],
               [17.4, "#8EB0DE", "#FFD49E"], [18.5, "#8170B6", "#FFA178"], [19.5, "#43437E", "#C27E8E"], [20.7, ...NIGHT], [24, ...NIGHT]];
    let i = 0;
    while (i < K.length - 2 && h >= K[i + 1][0]) i++;
    const [h0, a0, b0] = K[i], [h1, a1, b1] = K[i + 1], t = (h - h0) / (h1 - h0);
    return [mix(a0, a1, t), mix(b0, b1, t)];
  }
  // 어둠 0(낮)~1(밤), 노을빛 0~1
  const darkAt = (h) => (h < 4.6 || h > 20.7 ? 1 : h < 7.2 ? 1 - (h - 4.6) / 2.6 : h > 17.4 ? (h - 17.4) / 3.3 : 0);
  const warmAt = (h) => Math.max(0, 1 - Math.abs(h - 18.4) / 1.6, 1 - Math.abs(h - 6.2) / 1.3);

  function svg(o) {
    o = Object.assign({ stage: 4, season: "summer", hour: null, time: null, forest: 0, christmas: false, special: null, names: "", seed: 7, scene: "lake" }, o || {});
    const scene = SCENES.includes(o.scene) ? o.scene : "lake";
    const hour = o.hour != null ? ((o.hour % 24) + 24) % 24 : ({ evening: 18.4, night: 22, morning: 8 }[o.time] || 13);
    const id = "dt" + (++uid), R = rng(o.seed), S = SEASON[o.season] || SEASON.summer;
    const xmas = !!o.christmas, winter = o.season === "winter" || xmas;
    const dark0 = darkAt(hour), warm = warmAt(hour);
    // 야시장은 늘 등불이 켜질 만큼, 오로라는 늘 밤처럼, 우주는 반쯤 어둡게, 바닷속은 밤에도 덜 어둡게
    const dark = scene === "market" ? Math.max(dark0, .45) : scene === "aurora" ? Math.max(dark0, .7) : scene === "chuseok" ? Math.max(dark0, .5)
      : scene === "space" ? .55 : scene === "undersea" ? dark0 * .5 : dark0;
    const L = { sky: [], mtn: [], far: [], lake: [], near: [], ground: [], tree: [], deco: [], light: [], fx: [] };
    const defs = [];
    // 여러 색 멈춤점: stops = [[위치, 색, 투명도?], ...]
    const grad = (gid, stops, x2 = 0, y2 = 1) => defs.push(`<linearGradient id="${id}${gid}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([p, c, a]) => `<stop offset="${p}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</linearGradient>`);
    const rgrad = (gid, stops, cx = .35, cy = .3, r = .75) => defs.push(`<radialGradient id="${id}${gid}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([p, c, a]) => `<stop offset="${p}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</radialGradient>`);
    const U = (gid) => `url(#${id}${gid})`;
    defs.push(`<filter id="${id}glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    defs.push(`<filter id="${id}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>`);
    defs.push(`<filter id="${id}soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>`);
    // 종이 결 (아주 옅게)
    defs.push(`<filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${o.seed}" stitchTiles="stitch"/>`
      + `<feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .2  0 0 0 -.9 .62"/></filter>`);

    /* ---------- 하늘 ---------- */
    let sky = skyAt(hour, o.season);
    if (scene === "halloween") sky = [mix(sky[0], "#4A2F7E", .55), mix(sky[1], "#F49A5E", .45)];     // 보랏빛 · 호박빛 하늘
    if (scene === "market") sky = [mix(sky[0], "#33295F", .6), mix(sky[1], "#E9867A", .45)];         // 야시장: 늘 해 질 녘처럼
    if (scene === "seattle") sky = [mix(sky[0], "#8193A8", .5), mix(sky[1], "#E2D6CC", .4)];         // 시애틀: 비구름 낀 은은한 하늘
    if (scene === "space") sky = ["#100C2C", "#3E2670"];
    if (scene === "undersea") sky = [mix("#1474B0", "#06325A", dark0 * .7), mix("#5CC8DE", "#1D6E9C", dark0 * .7)];
    if (scene === "aurora") sky = [mix(sky[0], "#0C1838", .65), mix(sky[1], "#2C4A6C", .55)];
    if (scene === "chuseok") sky = [mix(sky[0], "#2A2E62", .6), mix(sky[1], "#E8A27A", .4)];         // 한가위: 보름달 뜨는 저녁
    if (scene === "sweet") sky = [mix(sky[0], "#F7A8C8", .45), mix(sky[1], "#FFE4EE", .5)];          // 달콤한 날: 분홍빛
    if (scene === "egypt") sky = [mix(sky[0], "#8EC2E8", .2), mix(sky[1], "#FFE2B4", .5)];
    const horizon = mix(sky[1], "#FFE9C7", (1 - dark) * .35);
    grad("sky", [[0, sky[0]], [.62, mix(sky[0], sky[1], .62)], [1, horizon]]);
    L.sky.push(`<rect width="400" height="320" fill="${U("sky")}"/>`);
    // 지평선 쪽 따뜻한 빛 무리
    L.sky.push(`<ellipse cx="${200}" cy="214" rx="260" ry="64" fill="${mix("#FFE3B8", "#FFB590", warm)}" opacity="${f((1 - dark) * .35 + warm * .25)}" filter="url(#${id}blur)"/>`);
    if (dark > .15 && scene !== "undersea") for (let i = 0; i < 46; i++) {
      const x = R() * 400, y = R() * 185, r = .45 + R() * 1.25;
      L.sky.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#FFF6DC" opacity="${f(dark * (.5 + R() * .5))}" class="tw" style="animation-duration:${f(2 + R() * 3)}s;animation-delay:-${f(R() * 4)}s"/>`);
    }
    let sun = null, moon = null;
    if (hour >= 5.4 && hour <= 19.6 && !NO_SUN.includes(scene)) {   // 해: 동쪽(왼쪽)에서 떠서 서쪽(오른쪽)으로. 한낮엔 화면 위로 올라가 햇살만 비친다 (할로윈은 늘 달)
      const t = (hour - 5.4) / 14.2, x = 34 + t * 332, y = 262 - Math.sin(t * Math.PI) * 300, low = 1 - Math.sin(t * Math.PI);
      sun = { x, y };
      const core = mix("#FFE9A0", "#FF9C5A", low * low), halo = mix("#FFF4D2", "#FFC08A", low);
      if (y < 110) {
        const a = clamp((110 - y) / 140, 0, 1);
        let rays = "";
        for (let i = 0; i < 6; i++) {
          const ang = (-62 + i * 25 + (x - 200) * -.06) * Math.PI / 180, w = .05 + (i % 2) * .03, len = 420;
          rays += `<path d="M${f(x)} ${f(y)} L${f(x + Math.sin(ang - w) * len)} ${f(y + Math.cos(ang - w) * len)} L${f(x + Math.sin(ang + w) * len)} ${f(y + Math.cos(ang + w) * len)}Z"`
            + ` fill="#FFF8E4" opacity="${f(a * .2)}" class="ray" style="animation-delay:-${f(i * 1.3)}s"/>`;
        }
        L.sky.push(rays);
      }
      L.sky.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(44 + low * 18)}" fill="${halo}" opacity="${f(.6 + low * .25)}" filter="url(#${id}blur)"/>`
        + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(17 + low * 5)}" fill="${core}"/><circle cx="${f(x - 5)}" cy="${f(y - 5)}" r="6" fill="#fff" opacity=".35"/>`);
    }
    if ((hour >= 18.6 || hour <= 6.4 || scene === "aurora") && !NO_MOON.includes(scene)) {             // 달 (오로라는 늘)
      const t = ((hour - 18.6 + 24) % 24) / 11.8, x = 34 + t * 332, y = 250 - Math.sin(t * Math.PI) * 236;
      moon = { x, y };
      defs.push(`<mask id="${id}moon"><rect width="400" height="320" fill="#fff"/><circle cx="${f(x + 8)}" cy="${f(y - 6)}" r="16" fill="#000"/></mask>`);
      L.sky.push(`<circle cx="${f(x)}" cy="${f(y)}" r="34" fill="#FFEFC2" opacity=".28" filter="url(#${id}blur)"/><circle cx="${f(x)}" cy="${f(y)}" r="17" fill="#FFF1CC" mask="url(#${id}moon)"/>`);
    }
    // 구름: 아래쪽은 하늘색이 비치는 몽글몽글한 입체. 노을엔 분홍빛, 밤엔 옅게
    const cTop = mix(mix("#FFFFFF", "#FFD6C2", warm), "#6B6F9C", dark), cBot = mix(mix(mix("#FFFFFF", sky[0], .3), "#F4A8A0", warm * .6), "#3B4174", dark);
    rgrad("cloud", [[0, cTop], [1, cBot]], .4, .25, .9);
    const open = scene !== "space" && scene !== "undersea";        // 우주·바닷속엔 구름·새가 없다
    for (const [cx, cy, s] of open ? [[64, 52, .95], [196, 34, .72], [300, 100, .62]] : []) {
      L.sky.push(`<g transform="translate(${cx} ${cy}) scale(${s})"><g class="cloud" style="animation-duration:${f(18 + R() * 14)}s;animation-delay:-${f(R() * 20)}s" opacity="${f(.95 - dark * .6)}">`
        + `<ellipse cx="0" cy="1" rx="31" ry="11" fill="${U("cloud")}"/><circle cx="-11" cy="-6" r="12" fill="${U("cloud")}"/><circle cx="7" cy="-11" r="15" fill="${U("cloud")}"/><circle cx="22" cy="-2" r="9.5" fill="${U("cloud")}"/>`
        + `<ellipse cx="2" cy="-12" rx="9" ry="4" fill="#fff" opacity="${f(.5 - dark * .4)}"/></g></g>`);
    }
    if (dark < .5 && o.forest >= 2 && open) for (let i = 0; i < 2; i++) {
      const bx = 90 + i * 150 + R() * 40, by = 66 + R() * 40;
      L.sky.push(`<g transform="translate(${f(bx)} ${f(by)})"><g class="drift" style="animation-delay:-${f(R() * 9)}s"><path d="M-6 0 q3 -4 6 0 q3 -4 6 0" stroke="#5E5266" stroke-width="1.4" fill="none" stroke-linecap="round" class="flap" style="animation-delay:-${f(R())}s"/></g></g>`);
    }

    /* =====================================================================
       배경 장면: lake(기본, 계절 호숫가) · hanriver · valley · beach · halloween · london
       ===================================================================== */
    const haze = horizon, lit = dark > .35;            // lit: 창문·가로등이 켜지는 때
    rgrad("bgl", [[0, S.leaf2[0]], [.6, S.leaf2[1]], [1, S.leaf2[2]]], .32, .28, .85);
    grad("fir", [[0, S.fir[0]], [1, S.fir[1]]]);
    const win = (x, y, w, h, on) => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx=".6" fill="${on ? "#FFD98A" : "#FFFFFF"}" opacity="${on ? .95 : .35}"/>`;
    const glowAt = (x, y, r, c, a) => L.light.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c || "#FFC970"}" opacity="${a || .45}" filter="url(#${id}blur)"/>`);

    function sceneLake() {
    /* ---------- 먼 산 · 언덕 (멀수록 하늘빛이 섞인다) ---------- */
    grad("mtn", [[0, mix(S.mtn, "#FFFFFF", .12)], [1, mix(S.mtn, haze, .6)]]);
    L.mtn.push(`<path d="M0 198 Q36 158 74 180 T150 166 T232 174 T314 156 T400 176 L400 240 L0 240Z" fill="${U("mtn")}" opacity=".9"/>`);
    if (winter || o.season === "autumn") L.mtn.push(`<path d="M0 198 Q36 158 74 180 T150 166 T232 174 T314 156 T400 176" stroke="#fff" stroke-opacity="${winter ? .8 : .3}" stroke-width="${winter ? 4 : 2}" fill="none"/>`);
    L.mtn.push(`<path d="M0 206 Q50 182 104 196 T206 190 T300 182 T400 194 L400 240 L0 240Z" fill="${mix(S.mtn, haze, .3)}" opacity=".85"/>`);
    grad("far", [[0, S.far[0]], [1, S.far[1]]]);
    L.far.push(`<path d="M0 216 C60 196 118 202 176 207 S300 190 400 202 L400 320 L0 320Z" fill="${U("far")}"/>`
      + `<path d="M0 216 C60 196 118 202 176 207 S300 190 400 202" stroke="#FFF8E8" stroke-opacity=".45" stroke-width="2" fill="none"/>`);

    /* ---------- 호수 (왼쪽 뒤) ---------- */
    const LK = "M26 222 C58 208 132 206 168 214 C186 218 184 232 160 236 C118 243 52 243 30 236 C14 231 12 226 26 222Z";
    const frozen = o.season === "winter";
    grad("lake", frozen ? [[0, "#F3F1F8"], [1, "#C9C6E0"]] : [[0, mix(horizon, "#9DCBEA", .45)], [.5, mix(sky[0], "#5E97CC", .5)], [1, mix(sky[0], "#3F74AE", .6)]]);
    L.lake.push(`<path d="${LK}" fill="${U("lake")}"/>`);
    defs.push(`<clipPath id="${id}lk"><path d="${LK}"/></clipPath>`);
    let lk = `<g clip-path="url(#${id}lk)">`;
    if (!frozen) lk += `<path d="M20 210 C70 205 140 203 190 212 L190 219 C140 213 70 215 20 220Z" fill="${S.far[1]}" opacity=".35"/>`;   // 건너편 언덕이 비친 띠
    const glow = sun || moon;
    if (glow && !frozen) {
      const gx = clamp(glow.x, 40, 160), c = sun ? mix("#FFF4C8", "#FFB27A", warm) : "#FFF1CC";
      lk += `<rect x="${f(gx - 7)}" y="208" width="14" height="36" fill="${c}" opacity="${sun ? .45 : .55}" filter="url(#${id}blur)"/>`;
    }
    if (!frozen) for (let i = 0; i < 8; i++) {
      const x = 40 + R() * 120, y = 216 + R() * 21, w = 6 + R() * 10;
      lk += `<path d="M${f(x)} ${f(y)} h${f(w)}" stroke="#FFFDF6" stroke-width="1.1" stroke-linecap="round" class="tw" opacity=".7" style="animation-duration:${f(2 + R() * 2.5)}s;animation-delay:-${f(R() * 3)}s"/>`;
    } else for (let i = 0; i < 5; i++) {
      const x = 38 + R() * 110, y = 214 + R() * 20;
      lk += `<path d="M${f(x)} ${f(y)} l${f(10 + R() * 12)} -3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>`;
    }
    lk += "</g>";
    L.lake.push(lk, `<path d="${LK}" fill="none" stroke="${frozen ? "#fff" : "#F2E2C2"}" stroke-width="2.4" stroke-opacity=".85"/>`);
    if (o.season === "spring" || o.season === "summer") {
      for (const [px, py, s] of [[58, 230, 1], [140, 226, .85], [118, 234, .7]]) {
        L.lake.push(`<g transform="translate(${px} ${py}) scale(${s})"><path d="M0 0 m-7 0 a7 3 0 1 0 14 0 a7 3 0 1 0 -14 0 M0 0 L7 -1.5" fill="#76BC6B" stroke="#4E9A55" stroke-width=".6"/>`
          + (o.season === "summer" && s === 1 ? `<g transform="translate(1 -3)">${flower(0, 0, 4.2, "#FFE1EA", "#FFE07A", "#F7A8C2")}</g>` : "") + `</g>`);
      }
      if (o.stage >= 2) L.lake.push(`<g transform="translate(86 222)"><g class="paddle">${duck(0, 0, 1)}${duck(17, 3, .9)}</g></g>`);
    } else if (o.season === "autumn") {
      for (let i = 0; i < 5; i++) L.lake.push(`<path d="M0 0 c3 -3 7 -3 9 0 c-2 2 -6 2 -9 0z" fill="${["#F59A42", "#DC5F38", "#F7C55A"][i % 3]}" transform="translate(${f(44 + R() * 110)} ${f(216 + R() * 18)}) rotate(${f(R() * 60 - 30)})"/>`);
    }
    if (!frozen) for (const rx of [22, 30, 172, 178]) {
      const h = 12 + R() * 8, by = rx < 100 ? 234 : 228;
      L.lake.push(`<path d="M${rx} ${by} q-1 -${f(h * .6)} 1 -${f(h)}" stroke="${o.season === "autumn" ? "#B99555" : "#5E9E4E"}" stroke-width="1.4" fill="none"/>`
        + (o.season !== "spring" ? `<rect x="${rx - .2}" y="${f(by - h - 5)}" width="2.8" height="7" rx="1.4" fill="#8A5E3C"/>` : ""));
    }
    function duck(x, y, s) {
      return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="2.6" rx="8.5" ry="2" fill="#2A3A5A" opacity=".12"/>`
        + `<path d="M-7 0 C-7 -5 4 -6 7 -2 C8 1 4 3 -3 3 C-6 3 -7 2 -7 0Z" fill="#FFFDF8"/><path d="M-6 -1 C-2 -4 3 -4 5 -2" stroke="#E9E2DA" stroke-width="1.2" fill="none"/>`
        + `<circle cx="5" cy="-5" r="3.4" fill="#FFFDF8"/><path d="M8 -5.4 l3 .8 l-3 .9z" fill="#FFA43A"/><circle cx="5.9" cy="-5.8" r=".7" fill="#3A2E2B"/>`
        + `<circle cx="4.6" cy="-4.2" r="1" fill="#FFB8C8" opacity=".8"/></g>`;
    }

    grad("near", [[0, S.near[0]], [1, S.near[1]]]);
    L.near.push(`<path d="M0 248 C76 232 150 242 204 246 S330 230 400 242 L400 320 L0 320Z" fill="${U("near")}"/>`
      + `<path d="M0 248 C76 232 150 242 204 246 S330 230 400 242" stroke="#FFF8E8" stroke-opacity=".4" stroke-width="2" fill="none"/>`);
    grad("ground", [[0, S.ground[0]], [1, S.ground[1]]]);
    L.ground.push(`<path d="M0 268 C96 256 304 256 400 268 L400 320 L0 320Z" fill="${U("ground")}"/>`
      + `<path d="M0 268 C96 256 304 256 400 268" stroke="#FFF8E8" stroke-opacity=".38" stroke-width="2" fill="none"/>`);
    if (dark < .6) L.ground.push(`<ellipse cx="300" cy="286" rx="110" ry="18" fill="#FFF3CC" opacity="${f((1 - dark) * .28)}" filter="url(#${id}blur)"/>`     // 햇빛 받은 자리
      + `<ellipse cx="90" cy="300" rx="80" ry="12" fill="#FFF3CC" opacity="${f((1 - dark) * .2)}" filter="url(#${id}blur)"/>`);

    /* ---------- 주변 숲 (호수를 비켜서 자란다) ---------- */
    const SLOTS = [[198, 207, .4, "round"], [334, 200, .42, "fir"], [372, 210, .48, "round"], [6, 214, .46, "fir"],
                   [292, 202, .36, "fir"], [246, 205, .34, "round"], [352, 254, .64, "fir"], [44, 258, .6, "round"],
                   [292, 262, .52, "round"], [70, 266, .5, "fir"], [394, 270, .74, "round"], [12, 272, .72, "fir"]];
    for (let i = 0; i < Math.min(12, o.forest); i++) {
      const [x, y, s, kind] = SLOTS[i], layer = y < 240 ? L.far : L.near;
      const g = kind === "fir" || xmas ? smallFir(x, y, s) : smallRound(x, y, s);
      layer.push(y < 240 ? `<g opacity=".92">${g}</g>` : g);
    }
    }
    // 장면마다 숲 나무가 자랄 자리 [x, 밑동 y, 크기] — 소품을 비켜 양옆으로
    function sideForest(slots, draw) {
      for (let i = 0; i < Math.min(slots.length, o.forest); i++) {
        const [x, y, s] = slots[i];
        (y < 240 ? L.far : L.near).push(draw(x, y, s, i));
      }
    }
    function smallRound(x, y, s) {
      const k = (n) => f(n * s);
      let g = `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="2" rx="${k(26)}" ry="${k(5)}" fill="#4A3A2A" opacity=".1"/>`;
      g += `<path d="M${k(-5)} 0 L${k(-3)} ${k(-38)} L${k(3)} ${k(-38)} L${k(5)} 0Z" fill="#8A5E40"/>`;
      const blobs = [[-16, -44, 20], [16, -46, 20], [0, -62, 22], [0, -40, 18]];
      for (const [bx, by, r] of blobs) g += `<circle cx="${k(bx)}" cy="${k(by + 4)}" r="${k(r + 1)}" fill="${S.leaf2[2]}"/>`;
      for (const [bx, by, r] of blobs) g += `<circle cx="${k(bx)}" cy="${k(by)}" r="${k(r)}" fill="${U("bgl")}"/>`;
      g += `<ellipse cx="${k(-8)}" cy="${k(-66)}" rx="${k(9)}" ry="${k(5)}" fill="#fff" opacity="${winter ? .8 : .22}"/>`;
      if (o.season === "spring") for (let j = 0; j < 5; j++) g += `<circle cx="${k(-22 + R() * 44)}" cy="${k(-66 + R() * 34)}" r="${k(2.6)}" fill="#FFE6EE"/>`;
      if (o.season === "autumn") for (let j = 0; j < 3; j++) g += `<circle cx="${k(-18 + R() * 36)}" cy="${k(-60 + R() * 30)}" r="${k(2.8)}" fill="#F7882F"/>`;
      return g + "</g>";
    }
    function smallFir(x, y, s) {
      const k = (n) => f(n * s);
      let g = `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="2" rx="${k(22)}" ry="${k(5)}" fill="#4A3A2A" opacity=".1"/>`;
      g += `<rect x="${k(-4)}" y="${k(-14)}" width="${k(8)}" height="${k(15)}" fill="#7A5338"/>`;
      for (const [ty, w, h] of [[-12, 26, 30], [-34, 21, 26], [-54, 15, 22]]) {
        g += `<path d="M${k(-w)} ${k(ty)} Q0 ${k(ty - h * 1.25)} ${k(w)} ${k(ty)} Q0 ${k(ty + 7)} ${k(-w)} ${k(ty)}Z" fill="${U("fir")}"/>`;
        g += `<path d="M${k(-w * .2)} ${k(ty - h * .55)} Q${k(-w * .55)} ${k(ty - 2)} ${k(-w * .9)} ${k(ty)}" stroke="#fff" stroke-opacity=".15" stroke-width="${k(3)}" fill="none"/>`;
        if (winter) g += `<path d="M${k(-w)} ${k(ty)} Q0 ${k(ty + 7)} ${k(w)} ${k(ty)} Q0 ${k(ty + 1)} ${k(-w)} ${k(ty)}Z" fill="#fff"/>`;
      }
      if (winter) g += `<path d="M${k(-9)} ${k(-70)} Q0 ${k(-80)} ${k(9)} ${k(-70)}Z" fill="#fff"/>`;
      if (xmas) for (let j = 0; j < 6; j++) {
        const c = ["#FFD54F", "#FF8A8A", "#8FDBFF"][j % 3];
        L.light.push(`<circle cx="${f(x + (-14 + R() * 28) * s)}" cy="${f(y + (-60 + R() * 52) * s)}" r="${f(2.2 * s + .6)}" fill="${c}" class="tw" style="animation-duration:${f(1.4 + R() * 1.6)}s;animation-delay:-${f(R() * 2)}s" filter="url(#${id}glow)"/>`);
      }
      return g + "</g>";
    }

    /* ---------- 공용: 풀밭 땅 (가까운 언덕 + 앞마당) ---------- */
    function grassGround(nearCols, groundCols) {
      grad("near", [[0, nearCols[0]], [1, nearCols[1]]]);
      L.near.push(`<path d="M0 248 C76 232 150 242 204 246 S330 230 400 242 L400 320 L0 320Z" fill="${U("near")}"/>`
        + `<path d="M0 248 C76 232 150 242 204 246 S330 230 400 242" stroke="#FFF8E8" stroke-opacity=".4" stroke-width="2" fill="none"/>`);
      grad("ground", [[0, groundCols[0]], [1, groundCols[1]]]);
      L.ground.push(`<path d="M0 268 C96 256 304 256 400 268 L400 320 L0 320Z" fill="${U("ground")}"/>`
        + `<path d="M0 268 C96 256 304 256 400 268" stroke="#FFF8E8" stroke-opacity=".38" stroke-width="2" fill="none"/>`);
    }
    function lamp(x, y, h, wreath) {                    // 가로등 (밤엔 켜진다)
      let g = `<g><rect x="${x - 1.6}" y="${y - h}" width="3.2" height="${h}" fill="#3E3A4A"/><rect x="${x - 4}" y="${y - 3}" width="8" height="3" rx="1" fill="#3E3A4A"/>`
        + `<path d="M${x - 5} ${y - h} h10 l-2 -10 h-6z" fill="${lit ? "#FFE6A6" : "#F4EEDC"}" stroke="#3E3A4A" stroke-width="1.2"/><path d="M${x - 6} ${y - h - 10} h12 l-6 -5z" fill="#3E3A4A"/>`;
      if (wreath) g += `<circle cx="${x}" cy="${y - h + 18}" r="5" fill="none" stroke="#3F8F5A" stroke-width="3"/><path d="M${x - 2} ${y - h + 23} l2 -2 l2 2 l-2 4z" fill="#D9534F"/>`;
      if (lit) glowAt(x, y - h - 5, 16, "#FFD27A", .5 + dark * .2);
      return g + "</g>";
    }
    function catenary(x1, y1, x2, y2, sag, n, colors) {  // 늘어진 전구 줄
      L.deco.push(`<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${y1 + sag * 2} ${x2} ${y2}" stroke="#4A4050" stroke-width=".8" fill="none" opacity=".7"/>`);
      for (let j = 1; j < n; j++) {
        const t = j / n, bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2, by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (y1 + sag * 2) + t * t * y2;
        L.light.push(`<circle cx="${f(bx)}" cy="${f(by + 2)}" r="2.2" fill="${colors[j % colors.length]}" class="tw" style="animation-duration:${f(1.6 + R() * 1.6)}s;animation-delay:-${f(R() * 2)}s"${lit ? ` filter="url(#${id}glow)"` : ""}/>`);
      }
    }

    /* ---------- 장면: 한강 벚꽃 (봄) ---------- */
    function sceneHanRiver() {
      // 먼 산과 전망탑
      L.mtn.push(`<path d="M0 182 Q50 150 104 168 T220 160 Q280 128 336 146 T400 156 L400 230 L0 230Z" fill="${mix("#BDB6D8", haze, .45)}"/>`
        + `<g fill="${mix("#A39CC6", haze, .3)}"><rect x="315" y="112" width="3" height="34"/><rect x="309" y="118" width="15" height="8" rx="3"/><rect x="316" y="100" width="1.2" height="12"/></g>`);
      if (lit) L.light.push(`<circle cx="316.6" cy="100" r="1.8" fill="#FF6B6B" class="tw" style="animation-duration:1.6s"/>`);
      // 도시 스카이라인 (밤엔 창문이 켜진다)
      let sk = "", x = 0;
      const bcol = mix("#CFC6E2", haze, .35), bcol2 = mix("#BDB3D8", haze, .3);
      while (x < 400) {
        const w = 12 + R() * 16, h = 14 + R() * 30, tall = x > 52 && x < 66;
        const hh = tall ? 62 : h, by = 205;
        sk += `<rect x="${f(x)}" y="${f(by - hh)}" width="${f(w - 1.5)}" height="${f(hh)}" fill="${tall ? (lit ? "#8E7A55" : "#E8CC86") : (R() < .5 ? bcol : bcol2)}"/>`;
        for (let wy = by - hh + 5; wy < by - 4; wy += 6) for (let wx = x + 2.5; wx < x + w - 4; wx += 4.5)
          if (R() < (lit ? .55 : .25)) sk += win(wx, wy, 1.8, 2.4, lit);
        x += w;
      }
      L.mtn.push(sk);
      // 강 + 다리
      grad("river", [[0, mix(horizon, "#A9D3EE", .5)], [1, mix(sky[0], "#4F8CC4", .55)]]);
      L.far.push(`<rect x="0" y="205" width="400" height="40" fill="${U("river")}"/>`);
      let br = `<rect x="0" y="196" width="400" height="5" fill="${mix("#E9E3EF", haze, .2)}"/><rect x="0" y="201" width="400" height="2" fill="${mix("#B9B0CC", haze, .2)}"/>`;
      for (let px = 20; px < 400; px += 52) br += `<rect x="${px}" y="203" width="5" height="9" fill="${mix("#C9C0D8", haze, .2)}"/><path d="M${px + 5} 203 Q${px + 28} 214 ${px + 47} 203" stroke="${mix("#C9C0D8", haze, .2)}" stroke-width="2" fill="none"/>`;
      L.far.push(br);
      if (lit) {                                       // 밤: 다리 조명 + 무지개 분수
        for (let px = 6; px < 400; px += 16) L.light.push(`<circle cx="${px}" cy="196" r="1.3" fill="#FFE9A8" filter="url(#${id}glow)"/>`);
        const rain = ["#FF8FA3", "#FFC36B", "#FFF08A", "#8EE29A", "#7FC8FF", "#B79CFF"];
        for (let j = 0; j < 9; j++) {
          const fx = 30 + j * 42;
          L.light.push(`<path d="M${fx} 200 q8 4 12 16" stroke="${rain[j % 6]}" stroke-width="2.4" fill="none" opacity=".75" class="tw" style="animation-duration:${f(2 + R())}s"/>`);
        }
      }
      for (let i = 0; i < 10; i++) {
        const sx = R() * 380, sy = 214 + R() * 26;
        L.far.push(`<path d="M${f(sx)} ${f(sy)} h${f(8 + R() * 12)}" stroke="#FFFDF6" stroke-width="1.1" stroke-linecap="round" opacity=".6" class="tw" style="animation-duration:${f(2 + R() * 2)}s;animation-delay:-${f(R() * 3)}s"/>`);
      }
      // 오리배 두 척
      const swan = (x0, y0, c) => `<g transform="translate(${x0} ${y0})"><g class="bob" style="animation-duration:5s"><ellipse cx="0" cy="3" rx="12" ry="2" fill="#2A3A5A" opacity=".15"/>`
        + `<path d="M-11 0 C-11 -6 8 -7 11 -2 C11 2 6 3 -6 3 C-10 3 -11 2 -11 0Z" fill="#FFFDF8"/><rect x="-6" y="-8" width="9" height="6" rx="2" fill="${c}"/>`
        + `<path d="M8 -2 C9 -10 6 -14 9 -16 C12 -17 13 -14 12 -13 L10 -13 C9 -10 11 -6 10 -2Z" fill="#FFFDF8"/><path d="M12 -15 l3 1 l-3 1z" fill="#FFA43A"/><circle cx="10.4" cy="-14.6" r=".6" fill="#3A2E2B"/></g></g>`;
      L.far.push(swan(120, 226, "#FF9EB5"), swan(292, 232, "#FFD86A"));
      // 강변 풀밭 + 산책로 + 가로등
      grad("near", [[0, S.near[0]], [1, S.near[1]]]);
      L.near.push(`<path d="M0 240 C120 234 280 234 400 240 L400 320 L0 320Z" fill="${U("near")}"/>`
        + `<path d="M0 248 C120 243 280 243 400 248 L400 256 C280 251 120 251 0 256Z" fill="#EADBC0"/><path d="M0 252 C120 247 280 247 400 252" stroke="#fff" stroke-width="1" stroke-dasharray="6 6" opacity=".7"/>`);
      L.near.push(lamp(150, 248, 26, false));
      grad("ground", [[0, S.ground[0]], [1, S.ground[1]]]);
      L.ground.push(`<path d="M0 268 C96 260 304 260 400 268 L400 320 L0 320Z" fill="${U("ground")}"/>`);
      // 벚나무 길 (숲이 자랄수록 늘어난다)
      rgrad("cherry2", [[0, "#FFF2F6"], [.6, "#F8BDD0"], [1, "#E995B2"]], .32, .28, .85);
      sideForest([[24, 244, .55], [376, 244, .52], [70, 242, .42], [336, 242, .42], [6, 262, .7], [396, 264, .7], [104, 246, .36], [300, 246, .36]],
        (x0, y0, s) => smallBlossom(x0, y0, s));
      // 돗자리 피크닉
      defs.push(`<pattern id="${id}chk" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="skewX(-14)"><rect width="10" height="10" fill="#FFF8F2"/><rect width="5" height="5" fill="#F08A97"/><rect x="5" y="5" width="5" height="5" fill="#F08A97"/></pattern>`);
      L.ground.push(`<path d="M44 290 L132 284 L146 306 L36 312Z" fill="url(#${id}chk)"/><path d="M44 290 L132 284 L146 306 L36 312Z" fill="none" stroke="#fff" stroke-opacity=".6"/>`
        + `<g transform="translate(70 288)"><rect x="-9" y="-8" width="18" height="11" rx="2" fill="#D2A26A"/><path d="M-7 -8 q7 -9 14 0" stroke="#A97A44" stroke-width="1.6" fill="none"/><rect x="-9" y="-8" width="18" height="3" fill="#E9C08A"/></g>`
        + `<g transform="translate(110 292)"><rect x="-3" y="-8" width="6" height="8" rx="1" fill="#fff"/><rect x="-3" y="-6" width="6" height="2" fill="#FF9EB5"/><rect x="5" y="-7" width="6" height="7" rx="1" fill="#fff"/><rect x="5" y="-5" width="6" height="2" fill="#8FD0FA"/></g>`);
    }
    function smallBlossom(x, y, s) {
      const k = (n) => f(n * s);
      let g = `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="2" rx="${k(26)}" ry="${k(5)}" fill="#4A3A2A" opacity=".1"/>`
        + `<path d="M${k(-4)} 0 L${k(-2.5)} ${k(-36)} L${k(2.5)} ${k(-36)} L${k(4)} 0Z" fill="#8A5E40"/>`;
      const blobs = [[-17, -42, 19], [17, -44, 19], [0, -60, 21], [0, -38, 17]];
      for (const [bx, by, r] of blobs) g += `<circle cx="${k(bx)}" cy="${k(by + 4)}" r="${k(r + 1)}" fill="#E48AA9"/>`;
      for (const [bx, by, r] of blobs) g += `<circle cx="${k(bx)}" cy="${k(by)}" r="${k(r)}" fill="${U("cherry2")}"/>`;
      for (let j = 0; j < 6; j++) g += `<circle cx="${k(-22 + R() * 44)}" cy="${k(-64 + R() * 34)}" r="${k(2.4)}" fill="#FFFFFF" opacity=".9"/>`;
      return g + "</g>";
    }

    /* ---------- 장면: 계곡 (6월) ---------- */
    function sceneValley() {
      grad("vm", [[0, "#8CCB7A"], [1, "#4E9A5C"]]);
      grad("vm2", [[0, mix("#A9D79A", haze, .3)], [1, mix("#77B477", haze, .2)]]);
      // 왼쪽 골짜기 안쪽 산 + 폭포 (나무에 가리지 않게 왼쪽에)
      L.mtn.push(`<path d="M40 214 Q76 122 126 140 Q178 122 214 214Z" fill="${U("vm2")}"/>`);
      grad("fall", [[0, "#EAF7FF"], [1, "#BFE6F7"]]);
      const FP = "M118 142 Q127 139 135 143 L140 207 L112 207Z";
      L.mtn.push(`<path d="${FP}" fill="${U("fall")}"/>`);
      let st = "";
      for (let j = 0; j < 5; j++) st += `<rect x="${115 + j * 4.6}" y="142" width="1.6" height="66" fill="#fff" opacity=".7"/>`;
      L.mtn.push(`<g clip-path="url(#${id}fallc)"><g class="fallw">${st}${st.replace(/y="142"/g, 'y="76"')}</g></g>`);
      defs.push(`<clipPath id="${id}fallc"><path d="${FP}"/></clipPath>`);
      L.mtn.push(`<ellipse cx="126" cy="207" rx="26" ry="7" fill="#fff" opacity=".75" filter="url(#${id}soft)"/>`);
      // 양쪽 가파른 산 (왼쪽은 낮게, 오른쪽은 나무 뒤로 넓게)
      L.far.push(`<path d="M0 108 C28 108 56 138 76 172 C86 190 94 204 100 216 L0 230Z" fill="${U("vm")}"/><path d="M400 92 C320 86 236 118 186 170 C170 188 160 204 152 216 L400 230Z" fill="${U("vm")}"/>`
        + `<path d="M0 108 C28 108 56 138 76 172" stroke="#D4F0B8" stroke-opacity=".5" stroke-width="2" fill="none"/><path d="M400 92 C320 86 236 118 186 170" stroke="#D4F0B8" stroke-opacity=".5" stroke-width="2" fill="none"/>`);
      for (let j = 0; j < 16; j++) {                    // 산비탈 소나무
        const left = j % 4 === 0, tx = left ? 6 + R() * 60 : 196 + R() * 200;
        const ty = left ? 124 + (tx / 70) * 60 + R() * 14 : 104 + ((400 - tx) / 210) * 80 + R() * 18;
        L.far.push(`<path d="M${f(tx)} ${f(ty - 14)} l5 10 h-3 l4 7 h-12 l4 -7 h-3z" fill="#3F8A55" opacity=".85"/>`);
      }
      grassGround(S.near, S.ground);
      // 개울 (폭포에서 왼쪽 앞으로)
      grad("brook", [[0, "#BFE6F2"], [1, "#6BB7D8"]]);
      const BR = "M114 207 C100 222 82 236 60 250 C40 262 20 270 0 276 L0 302 C30 294 66 280 92 264 C118 246 136 226 140 207Z";
      L.ground.push(`<path d="${BR}" fill="${U("brook")}"/><path d="${BR}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>`);
      for (let j = 0; j < 9; j++) {
        const t = R(), sx = 124 - t * 116, sy = 212 + t * 72;
        L.ground.push(`<path d="M${f(sx)} ${f(sy)} q5 -2 10 0" stroke="#fff" stroke-width="1.1" fill="none" opacity=".75" class="tw" style="animation-duration:${f(1.6 + R() * 2)}s;animation-delay:-${f(R() * 2)}s"/>`);
      }
      // 바위
      const rock = (x0, y0, w, h) => `<ellipse cx="${x0}" cy="${y0}" rx="${w}" ry="${h}" fill="#A9A6A0"/><ellipse cx="${x0 - w * .25}" cy="${y0 - h * .35}" rx="${w * .5}" ry="${h * .4}" fill="#CFCBC2"/><ellipse cx="${x0 + w * .2}" cy="${y0 - h * .7}" rx="${w * .4}" ry="${h * .2}" fill="#8DBE6E" opacity=".7"/>`;
      L.ground.push(rock(100, 240, 11, 6), rock(146, 214, 8, 4), rock(106, 212, 7, 4), rock(60, 266, 9, 5), rock(18, 290, 14, 7));
      // 개울에 담가 둔 수박 · 튜브
      L.ground.push(`<g transform="translate(40 274)"><g class="bob" style="animation-duration:4s"><circle r="7" fill="#5DAA4E"/><path d="M-6 -3 q6 -3 12 0 M-7 1 q7 -3 14 0 M-6 4 q6 -2 12 0" stroke="#2F6E33" stroke-width="1.4" fill="none"/><ellipse cx="-2.6" cy="-3" rx="2" ry="1.2" fill="#fff" opacity=".4"/></g></g>`
        + `<g transform="translate(84 250)"><g class="bob" style="animation-duration:5s"><ellipse rx="10" ry="4.2" fill="#FF9EB5"/><ellipse rx="4.4" ry="1.7" fill="#7FC2E0"/><path d="M-9 -1 a10 4 0 0 1 6 -3" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/></g></g>`);
      // 평상 + 수박 접시 · 부채
      L.ground.push(`<g transform="translate(350 304)"><ellipse cx="0" cy="12" rx="44" ry="4" fill="#4A2E1E" opacity=".12"/><rect x="-40" y="-6" width="80" height="7" rx="2" fill="#C99566"/><rect x="-40" y="-6" width="80" height="2" fill="#fff" opacity=".3"/>`
        + `<rect x="-36" y="1" width="4" height="10" fill="#8A5E3C"/><rect x="32" y="1" width="4" height="10" fill="#8A5E3C"/><rect x="-30" y="-9" width="56" height="4" rx="1.5" fill="#E86A6A" opacity=".85"/>`
        + `<ellipse cx="-10" cy="-10" rx="12" ry="3" fill="#fff"/><path d="M-18 -11 l6 -7 l6 7z M-8 -11 l6 -7 l6 7z" fill="#FF6B6B"/><path d="M-18 -11 h12 M-8 -11 h12" stroke="#5DAA4E" stroke-width="1.4"/>`
        + `<circle cx="-14" cy="-14" r=".6" fill="#3A2E2B"/><circle cx="-3" cy="-14" r=".6" fill="#3A2E2B"/><path d="M14 -10 l10 -10 a6 6 0 0 1 4 6z" fill="#7FC8FF"/><path d="M14 -10 l4 3" stroke="#8A5E3C" stroke-width="1.4"/></g>`);
      // 잠자리
      for (let j = 0; j < 2; j++) L.fx.push(`<g transform="translate(${f(110 + j * 150 + R() * 30)} ${f(170 + R() * 40)})"><g class="drift" style="animation-delay:-${f(R() * 9)}s"><path d="M-6 0 h12" stroke="#C0563A" stroke-width="1.4"/><ellipse cx="-1" cy="-2.6" rx="4" ry="1.6" fill="#EAF6FF" opacity=".8" class="flap"/><ellipse cx="2" cy="-2.6" rx="4" ry="1.6" fill="#EAF6FF" opacity=".8" class="flap"/></g></g>`);
      sideForest([[20, 252, .6], [384, 248, .58], [46, 262, .48], [362, 262, .5], [6, 272, .7], [398, 272, .7]], (x0, y0, s) => smallFir(x0, y0, s));
    }

    /* ---------- 장면: 바다 휴양지 (7~8월) ---------- */
    function sceneBeach() {
      // 바다 · 섬 · 돛단배
      grad("sea", [[0, mix(horizon, "#A6E6EA", .55)], [.35, "#69D0DF"], [1, "#2FA8C6"]]);
      L.mtn.push(`<path d="M282 200 Q300 182 322 190 Q344 176 372 198 L372 202 L282 202Z" fill="${mix("#86BFA6", haze, .45)}"/><path d="M20 200 Q40 192 62 199 L62 202 L20 202Z" fill="${mix("#86BFA6", haze, .55)}"/>`);
      L.far.push(`<rect x="0" y="200" width="400" height="60" fill="${U("sea")}"/><rect x="0" y="200" width="400" height="2" fill="#fff" opacity=".45"/>`);
      const g0 = sun || moon;
      if (g0) L.far.push(`<ellipse cx="${f(clamp(g0.x, 10, 390))}" cy="226" rx="10" ry="26" fill="${sun ? mix("#FFF6D0", "#FFB27A", warm) : "#FFF1CC"}" opacity=".5" filter="url(#${id}blur)"/>`);
      for (let j = 0; j < 12; j++) {
        const wx = R() * 390, wy = 206 + R() * 46;
        L.far.push(`<path d="M${f(wx)} ${f(wy)} q4 -2.4 8 0 q4 2.4 8 0" stroke="#fff" stroke-width="1.1" fill="none" opacity=".65" class="tw" style="animation-duration:${f(2.2 + R() * 2)}s;animation-delay:-${f(R() * 3)}s"/>`);
      }
      L.far.push(`<g transform="translate(126 202)"><g class="bob" style="animation-duration:6s"><path d="M-12 0 h24 l-4 5 h-16z" fill="#C98E62"/><path d="M0 -1 v-22 l13 20z" fill="#FFFDF8"/><path d="M-1 -1 v-17 l-9 15z" fill="#FFB0C0"/></g></g>`);
      // 파도 거품 + 젖은 모래 + 모래사장
      grad("sand", [[0, "#F8E5BE"], [1, "#EBC891"]]);
      L.near.push(`<path d="M0 256 C100 250 300 250 400 256 L400 320 L0 320Z" fill="${U("sand")}"/><path d="M0 256 C100 250 300 250 400 256 L400 263 C300 257 100 257 0 263Z" fill="#D9B984" opacity=".55"/>`);
      L.near.push(`<g class="wave"><path d="M-20 256 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/></g>`);
      for (let j = 0; j < 40; j++) L.ground.push(`<circle cx="${f(R() * 400)}" cy="${f(266 + R() * 52)}" r="${f(.5 + R() * .8)}" fill="#C9A06A" opacity=".45"/>`);
      // 나무 밑 작은 풀섬 (모래 위에서도 나무가 자라게)
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="52" ry="9" fill="#9CCF6E"/><ellipse cx="${X - 8}" cy="${B}" rx="38" ry="5" fill="#B9E08A" opacity=".7"/>`);
      // 파라솔 · 의자 · 공 · 모래성 · 조개
      L.ground.push(`<g transform="translate(330 300)"><ellipse cx="6" cy="2" rx="30" ry="4" fill="#4A2E1E" opacity=".12"/><path d="M0 0 L4 -50" stroke="#EDE3D6" stroke-width="2.2"/>`
        + `<path d="M-30 -42 Q4 -74 38 -56 Z" fill="#FF8FA3"/><path d="M-30 -42 Q-8 -66 4 -50 Z M10 -66 Q24 -64 38 -56 L4 -50Z" fill="#FFFDF8"/><path d="M-30 -42 Q4 -74 38 -56" stroke="#E86A82" stroke-width="1" fill="none"/>`
        + `<path d="M-22 -2 l18 0 l8 -12 l-18 0z" fill="#8FD0FA"/><path d="M-22 -2 v4 M-4 -2 v4 M4 -14 v8" stroke="#C98E62" stroke-width="1.6"/></g>`
        + `<g transform="translate(282 306)"><circle r="6.5" fill="#fff"/><path d="M0 -6.5 A6.5 6.5 0 0 1 6.5 0 L0 0Z" fill="#FF8FA3"/><path d="M0 0 L-6.5 0 A6.5 6.5 0 0 0 0 6.5Z" fill="#8FD0FA"/><path d="M0 0 L0 -6.5 A6.5 6.5 0 0 0 -5.6 -3.2Z" fill="#FFD86A"/></g>`
        + `<g transform="translate(62 306)"><path d="M-16 0 h32 v-10 h-32z" fill="#E8C58A"/><path d="M-10 -10 v-12 h20 v12" fill="#EFD198"/><path d="M-4 -22 v-8 h8 v8" fill="#F3D8A4"/>`
        + `<path d="M-16 -10 v-4 h4 v4 M12 -10 v-4 h4 v4 M-10 -22 v-3 h3 v3 M7 -22 v-3 h3 v3" fill="#E8C58A"/><path d="M0 -30 v-8 l6 3 l-6 2" stroke="#8A5E3C" fill="#FF8FA3" stroke-width="1"/><rect x="-3" y="-6" width="6" height="6" rx="3" fill="#C9A06A"/></g>`
        + `<path d="M304 314 l2.4 -6 l2.4 6 l-5.6 -4 h6.4z" fill="#FF9E7A"/><ellipse cx="200" cy="304" rx="4" ry="3" fill="#FFE4EA"/><path d="M197 304 q3 -4 6 0" stroke="#F4B6C6" fill="none"/>`);
      // 야자수 (숲이 자랄수록 늘어난다) — 첫 두 그루는 늘 있다
      const palm = (x0, y0, s, lean) => {
        const k = (n) => f(n * s);
        let g = `<g transform="translate(${x0} ${y0})"><ellipse cx="0" cy="2" rx="${k(20)}" ry="${k(4)}" fill="#4A2E1E" opacity=".12"/>`
          + `<path d="M${k(-4)} 0 C${k(-4 + lean * .3)} ${k(-40)} ${k(lean * .8 - 2)} ${k(-80)} ${k(lean - 2)} ${k(-110)} L${k(lean + 3)} ${k(-110)} C${k(lean * .8 + 3)} ${k(-80)} ${k(4 + lean * .3)} ${k(-40)} ${k(5)} 0Z" fill="#B98455"/>`;
        for (let j = 1; j < 9; j++) g += `<path d="M${k(-4 + lean * j / 9 * .9)} ${k(-j * 12)} h${k(9)}" stroke="#8A5E3C" stroke-width="${k(1.2)}" opacity=".6"/>`;
        const tx = k(lean), ty = k(-112);
        for (const [ang, len] of [[-160, 46], [-120, 40], [-60, 40], [-20, 46], [-90, 34], [170, 36], [10, 36]]) {
          const a = ang * Math.PI / 180, ex = Math.cos(a) * len * s, ey = Math.sin(a) * len * s;
          g += `<path d="M${tx} ${ty} Q${f(+tx + ex * .5)} ${f(+ty + ey * .5 - 14 * s)} ${f(+tx + ex)} ${f(+ty + ey + 8 * s)} Q${f(+tx + ex * .5)} ${f(+ty + ey * .5 - 4 * s)} ${tx} ${ty}Z" fill="${["#5DB36A", "#4C9F5C", "#6CC277"][Math.abs(ang) % 3]}"/>`;
        }
        g += `<circle cx="${f(+tx - 3 * s)}" cy="${f(+ty + 6 * s)}" r="${k(4)}" fill="#8A5E3C"/><circle cx="${f(+tx + 3 * s)}" cy="${f(+ty + 7 * s)}" r="${k(4)}" fill="#7A5033"/>`;
        return g + "</g>";
      };
      L.near.push(palm(34, 270, .9, 14), palm(380, 268, .84, -16));
      sideForest([[66, 262, .6, 8], [346, 260, .56, -10], [10, 280, .7, 18], [398, 280, .7, -18]], (x0, y0, s, i) => palm(x0, y0, s, [8, -10, 18, -18][i]));
      if (lit) catenary(46, 168, 362, 172, 18, 14, ["#FFD86A", "#FF9E8A", "#FFF2B0", "#8FE3D8"]);
    }

    /* ---------- 장면: 할로윈 (10월 15~31일) ---------- */
    function sceneHalloween() {
      if (!moon) L.sky.push(`<circle cx="92" cy="70" r="40" fill="#FFE2A0" opacity=".35" filter="url(#${id}blur)"/><circle cx="92" cy="70" r="24" fill="#FFE7AE"/><circle cx="84" cy="64" r="4" fill="#F4D18A" opacity=".6"/><circle cx="99" cy="76" r="3" fill="#F4D18A" opacity=".6"/>`);
      // 박쥐
      for (let j = 0; j < 4; j++) {
        const bx = 40 + j * 80 + R() * 30, by = 50 + R() * 60;
        L.sky.push(`<g transform="translate(${f(bx)} ${f(by)})"><g class="drift" style="animation-delay:-${f(R() * 9)}s"><g class="flap" style="animation-delay:-${f(R())}s">`
          + `<path d="M0 0 c-3 -3 -6 -3 -9 -1 c1 -3 -1 -5 -3 -5 c-1 2 -2 3 -4 3 c3 1 5 4 5 7 c3 -2 7 -2 11 0 c4 -2 8 -2 11 0 c0 -3 2 -6 5 -7 c-2 0 -3 -1 -4 -3 c-2 0 -4 2 -3 5 c-3 -2 -6 -2 -9 1z" fill="#3A2A4E"/></g></g></g>`);
      }
      // 보랏빛 언덕 + 유령의 집
      L.mtn.push(`<path d="M0 196 Q60 168 120 186 T240 178 Q300 150 360 168 T400 172 L400 240 L0 240Z" fill="${mix("#6C5A9C", haze, .25)}"/>`);
      const hc = lit ? "#2E2346" : "#4A3A6C";
      let hs = `<g><path d="M300 176 v-34 l14 -16 l14 16 v34z" fill="${hc}"/><path d="M322 176 v-24 l22 -14 l20 14 v24z" fill="${hc}"/><path d="M296 144 l18 -24 l18 24z M320 154 l24 -22 l24 22z" fill="${mix(hc, "#000", .25)}"/>`
        + `<rect x="352" y="128" width="5" height="16" fill="${hc}" transform="rotate(8 354 136)"/><path d="M314 120 v-10 l8 3 l-8 3" fill="#FF9E5A"/>`;
      for (const [wx, wy] of [[308, 146], [316, 158], [334, 160], [348, 160], [340, 148]]) hs += win(wx, wy, 5, 6, true);
      hs += `<path d="M338 176 v-9 a4 4 0 0 1 8 0 v9z" fill="#1E1630"/></g>`;
      L.mtn.push(hs);
      for (const [wx, wy] of [[310, 149], [318, 161], [336, 163], [350, 163], [342, 151]]) glowAt(wx, wy, 6, "#FFD27A", .4);
      // 앙상한 나무 실루엣
      L.far.push(`<path d="M40 214 v-40 M40 186 l-14 -14 M40 180 l12 -16 M40 196 l-10 -6 M52 164 l6 -8 M26 172 l-6 -2" stroke="#3E2E52" stroke-width="3" stroke-linecap="round" fill="none"/>`);
      grassGround(["#C99E62", "#B58A52"], ["#B9925A", "#987043"]);
      // 울타리
      for (let px = 6; px < 120; px += 14) L.near.push(`<path d="M${px} 250 v-16 l3 -4 l3 4 v16z" fill="#8A6A4E"/>`);
      L.near.push(`<rect x="0" y="238" width="124" height="3" fill="#7A5A40"/><rect x="0" y="245" width="124" height="3" fill="#7A5A40"/>`);
      // 잭오랜턴
      const jack = (x0, y0, s) => {
        const k = (n) => f(n * s);
        let g = `<g transform="translate(${x0} ${y0})"><ellipse cx="0" cy="${k(10)}" rx="${k(16)}" ry="${k(3)}" fill="#2A1A10" opacity=".18"/>`
          + `<ellipse cx="${k(-7)}" cy="0" rx="${k(9)}" ry="${k(10)}" fill="#E8762A"/><ellipse cx="${k(7)}" cy="0" rx="${k(9)}" ry="${k(10)}" fill="#E8762A"/><ellipse cx="0" cy="0" rx="${k(9)}" ry="${k(11)}" fill="#F58A35"/>`
          + `<path d="M0 ${k(-10)} q${k(1)} ${k(-5)} ${k(4)} ${k(-6)}" stroke="#5E7A3A" stroke-width="${k(2.4)}" fill="none" stroke-linecap="round"/>`
          + `<path d="M${k(-7)} ${k(-3)} l${k(3)} ${k(-4)} l${k(3)} ${k(4)}z M${k(1)} ${k(-3)} l${k(3)} ${k(-4)} l${k(3)} ${k(4)}z M${k(-7)} ${k(3)} q${k(7)} ${k(6)} ${k(14)} 0 l${k(-3)} ${k(1)} l${k(-2)} ${k(-2)} l${k(-2)} ${k(2)} l${k(-2)} ${k(-2)} l${k(-2)} ${k(2)}z" fill="${lit ? "#FFE48A" : "#7A3A12"}"/>`
          + `<ellipse cx="${k(-5)}" cy="${k(-5)}" rx="${k(2)}" ry="${k(3)}" fill="#fff" opacity=".25"/></g>`;
        if (lit) glowAt(x0, y0, 14 * s, "#FFB45A", .45);
        return g;
      };
      L.ground.push(jack(82, 288, 1.2), jack(122, 300, .8), jack(374, 296, 1), jack(178, 306, .7));
      // 사탕
      for (const [cx0, cy0, c] of [[150, 304, "#FF8FA3"], [256, 306, "#8FD0FA"], [176, 296, "#FFD86A"]])
        L.ground.push(`<g transform="translate(${cx0} ${cy0})"><path d="M-7 -2.4 l3 2.4 l-3 2.4z M7 -2.4 l-3 2.4 l3 2.4z" fill="${c}"/><circle r="3.4" fill="${c}"/><path d="M-2 -2 l4 4" stroke="#fff" stroke-width="1" opacity=".7"/></g>`);
      // 귀여운 유령
      L.fx.push(`<g transform="translate(300 178)"><g class="bob" style="animation-duration:3.6s"><path d="M-11 6 C-12 -8 -8 -16 0 -16 C8 -16 12 -8 11 6 l-3 -3 l-3 3 l-3 -3 l-2 3 l-3 -3 l-3 3 l-3 -3z" fill="#FFFDF8" opacity=".95"/>`
        + `<circle cx="-3.6" cy="-6" r="1.4" fill="#3A2E2B"/><circle cx="3.6" cy="-6" r="1.4" fill="#3A2E2B"/><ellipse cx="0" cy="-1.6" rx="1.6" ry="2" fill="#3A2E2B"/><circle cx="-6.4" cy="-3" r="1.6" fill="#FFB8C8" opacity=".7"/><circle cx="6.4" cy="-3" r="1.6" fill="#FFB8C8" opacity=".7"/></g></g>`);
      sideForest([[20, 254, .55], [384, 252, .55], [356, 262, .45], [44, 266, .45], [6, 274, .7], [398, 276, .7]], (x0, y0, s) => smallRound(x0, y0, s));
    }

    /* ---------- 장면: 크리스마스 런던 (12월 1~25일) ---------- */
    function sceneLondon() {
      const stone = lit ? "#4A4560" : mix("#D9C3A0", haze, .25), stone2 = lit ? "#3E3A54" : mix("#C9B08A", haze, .2), roof = lit ? "#2E2A42" : mix("#9C8A78", haze, .2);
      let sk = "";
      // 시계탑
      sk += `<rect x="54" y="98" width="24" height="108" fill="${stone}"/><rect x="50" y="94" width="32" height="8" fill="${stone2}"/><rect x="56" y="104" width="20" height="22" fill="${stone2}"/>`
        + `<path d="M52 94 L66 54 L80 94Z" fill="${roof}"/><path d="M66 54 v-10" stroke="${roof}" stroke-width="1.6"/>`;
      for (let wy = 132; wy < 200; wy += 10) sk += `<rect x="60" y="${wy}" width="3" height="6" fill="${roof}" opacity=".6"/><rect x="69" y="${wy}" width="3" height="6" fill="${roof}" opacity=".6"/>`;
      sk += `<circle cx="66" cy="115" r="8.5" fill="${lit ? "#FFE7A8" : "#FFF8E8"}" stroke="#C9A25A" stroke-width="1.4"/><path d="M66 115 v-6 M66 115 l4 2" stroke="#3A2E2B" stroke-width="1.1" stroke-linecap="round"/>`;
      if (lit) glowAt(66, 115, 14, "#FFE08A", .55);
      // 국회의사당 같은 긴 건물 (뾰족 지붕이 줄지어)
      sk += `<rect x="78" y="160" width="96" height="46" fill="${stone}"/>`;
      for (let px = 80; px < 172; px += 12) sk += `<path d="M${px} 160 l3 -12 l3 12z" fill="${roof}"/><rect x="${px + 1.5}" y="168" width="3" height="7" fill="${roof}" opacity=".5"/>` + (lit && R() < .7 ? win(px + 1.5, 182, 3, 7, true) : `<rect x="${px + 1.5}" y="182" width="3" height="7" fill="${roof}" opacity=".5"/>`);
      // 돔 건물
      sk += `<rect x="262" y="170" width="64" height="36" fill="${stone}"/><rect x="276" y="156" width="36" height="16" fill="${stone2}"/><path d="M274 158 Q294 116 314 158Z" fill="${stone2}"/><rect x="291" y="122" width="6" height="10" fill="${stone2}"/><path d="M294 122 v-8" stroke="${roof}" stroke-width="1.4"/>`;
      for (let px = 268; px < 322; px += 9) sk += lit && R() < .7 ? win(px, 180, 4, 8, true) : `<rect x="${px}" y="180" width="4" height="8" fill="${roof}" opacity=".5"/>`;
      L.mtn.push(`<g opacity=".95">${sk}</g>`);
      // 대관람차 (천천히 돈다)
      let wh = `<circle r="40" fill="none" stroke="${lit ? "#5A5478" : "#E8E2EE"}" stroke-width="2"/>`;
      for (let a = 0; a < 360; a += 30) {
        const r0 = a * Math.PI / 180;
        wh += `<path d="M0 0 L${f(Math.cos(r0) * 40)} ${f(Math.sin(r0) * 40)}" stroke="${lit ? "#5A5478" : "#E8E2EE"}" stroke-width=".8"/><circle cx="${f(Math.cos(r0) * 40)}" cy="${f(Math.sin(r0) * 40)}" r="2.6" fill="${lit ? "#FFD98A" : "#FFFDF8"}"/>`;
      }
      L.mtn.push(`<g transform="translate(368 160)"><g class="spin">${wh}</g></g><path d="M368 160 l-14 46 M368 160 l14 46" stroke="${lit ? "#5A5478" : "#E2DCE8"}" stroke-width="2"/>`);
      // 눈 덮인 길 + 돌바닥
      grad("near", [[0, S.near[0]], [1, S.near[1]]]);
      L.near.push(`<path d="M0 206 L400 206 L400 320 L0 320Z" fill="${U("near")}"/>`);
      grad("ground", [[0, S.ground[0]], [1, S.ground[1]]]);
      L.near.push(`<path d="M0 236 C120 230 280 230 400 236 L400 252 C280 246 120 246 0 252Z" fill="${lit ? "#6A6480" : "#CFC6D6"}"/>`);
      for (let px = 0; px < 400; px += 10) L.near.push(`<rect x="${px + (Math.floor(px / 10) % 2) * 5}" y="${240 + (px % 20 === 0 ? 0 : 5)}" width="8" height="4" rx="1.6" fill="${lit ? "#7A7490" : "#DCD4E2"}" opacity=".8"/>`);
      L.ground.push(`<path d="M0 262 C96 254 304 254 400 262 L400 320 L0 320Z" fill="${U("ground")}"/>`);
      // 빨간 전화부스 · 우체통 · 가로등 · 전구 줄 · 눈사람
      L.near.push(`<g transform="translate(26 250)"><ellipse cx="11" cy="2" rx="16" ry="3" fill="#4A2E1E" opacity=".14"/><rect x="0" y="-62" width="22" height="62" rx="2" fill="#D63B3B"/><path d="M-1 -62 h24 l-2 -5 h-20z" fill="#C42F2F"/><rect x="2" y="-58" width="18" height="4" fill="#FFF3E0"/>`
        + `<g fill="${lit ? "#FFE7A8" : "#E8F2F8"}">${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${3 + c * 5.6}" y="${-50 + r * 9}" width="4.4" height="7.4" rx=".6"/>`).join("")).join("")}</g><rect x="0" y="-3" width="22" height="3" fill="#B52A2A"/>`
        + `<path d="M-1 -67 h24" stroke="#fff" stroke-width="2.4" opacity=".95"/></g>`);
      if (lit) glowAt(37, 222, 18, "#FFE08A", .4);
      L.near.push(lamp(118, 252, 34, true), lamp(366, 252, 34, true));
      catenary(118, 214, 366, 214, 16, 18, ["#FFD86A", "#FF8F7E", "#FFF2B0", "#FFB870"]);
      L.ground.push(`<g transform="translate(96 300)"><ellipse cx="0" cy="3" rx="13" ry="3" fill="#6E5A7A" opacity=".12"/><circle cx="0" cy="-6" r="10" fill="#FFFDF8"/><circle cx="0" cy="-20" r="7" fill="#FFFDF8"/>`
        + `<circle cx="-2.4" cy="-21" r=".9" fill="#3A2E2B"/><circle cx="2.4" cy="-21" r=".9" fill="#3A2E2B"/><path d="M0 -19 l5 1 l-5 1z" fill="#FF9A3C"/>`
        + `<path d="M-6 -15 q6 3 12 0 l1 3 q-7 3 -14 0z" fill="#3F8F5A"/><path d="M4 -13 v7" stroke="#3F8F5A" stroke-width="3"/><path d="M-6 -27 q6 -10 12 0z" fill="#D63B3B"/><circle cx="0" cy="-33" r="2" fill="#fff"/>`
        + `<circle cx="-4" cy="-19" r="1.4" fill="#FFB8C8" opacity=".7"/><circle cx="4" cy="-19" r="1.4" fill="#FFB8C8" opacity=".7"/></g>`);
      sideForest([[146, 248, .42], [176, 246, .36], [250, 246, .36], [290, 248, .42], [6, 270, .66], [398, 272, .66]], (x0, y0, s) => smallFir(x0, y0, s));
    }

    /* =====================================================================
       장면 꾸밈: 위쪽 테두리 장식 + 구석구석 아기자기한 소품
       ===================================================================== */
    // 위 양쪽 모서리에서 드리운 가지 (fillId: 잎·꽃 그라데이션, dark: 그늘색, dots: 작은 꽃/점 색)
    function cornerBranches(fillId, dark, dots) {
      // 모서리에서 뻗은 가지 하나 + 잔가지, 그 아래로 작은 꽃·잎 송이가 몽글몽글 달린다
      let g = "";
      for (const side of [0, 1]) {
        const sx = side ? 400 : 0, d = side ? -1 : 1;
        const P = (t) => [sx + d * (t * 118), -6 + 34 * t - 10 * t * t];          // 가지 위 한 점 (t: 0~1)
        g += `<path d="M${sx} -8 Q${sx + d * 56} 22 ${sx + d * 118} 18" stroke="#7A5338" stroke-width="5" fill="none" stroke-linecap="round"/>`
          + `<path d="M${sx} -8 Q${sx + d * 56} 22 ${sx + d * 118} 18" stroke="#A57A55" stroke-width="1.4" fill="none" stroke-linecap="round" transform="translate(0 -1.4)"/>`;
        for (const [t, dx, dy] of [[.3, 6, 22], [.55, 10, 26], [.78, 4, 20]]) {
          const [x0, y0] = P(t);
          g += `<path d="M${f(x0)} ${f(y0)} q${d * dx * .4} ${dy * .5} ${d * dx} ${dy}" stroke="#7A5338" stroke-width="2" fill="none" stroke-linecap="round"/>`;
        }
        const clusters = [[.08, 6], [.2, 12], [.34, 14], [.46, 10], [.6, 16], [.72, 12], [.86, 8], [.97, 4], [.32, 30], [.58, 36], [.8, 28]];
        for (const [t, dy] of clusters) {
          const [x0, y0] = P(t), cx0 = x0 + (R() - .5) * 6, cy0 = y0 + dy * .6;
          const n = 5 + Math.floor(R() * 3);
          let shade = "", body = "";
          for (let j = 0; j < n; j++) {
            const a = R() * Math.PI * 2, rr = R() * 7, r0 = 4 + R() * 3.4;
            const px0 = f(cx0 + Math.cos(a) * rr), py0 = f(cy0 + Math.sin(a) * rr * .8);
            shade += `<circle cx="${px0}" cy="${f(+py0 + 1.6)}" r="${f(r0 + .6)}" fill="${dark}"/>`;
            body += `<circle cx="${px0}" cy="${py0}" r="${f(r0)}" fill="${U(fillId)}"/>`;
          }
          g += shade + body;
          if (dots) for (let j = 0; j < 3; j++) g += `<circle cx="${f(cx0 + (R() - .5) * 14)}" cy="${f(cy0 + (R() - .5) * 10)}" r="${f(1.3 + R() * 1)}" fill="${dots}"/>`;
        }
      }
      L.fx.push(`<g class="sway2">${g}</g>`);
    }
    // 위쪽에 늘어진 줄 (y = 줄 높이)
    const sagY = (x, y0, sag) => { const t = (x + 4) / 408; return f((1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0); };
    function bunting(y0, sag, colors) {               // 삼각 깃발 줄
      let g = `<path d="M-4 ${y0} Q200 ${y0 + sag * 2} 404 ${y0}" stroke="#8A6A5A" stroke-width="1" fill="none"/>`;
      for (let x = 8, i = 0; x < 400; x += 22, i++) {
        const y = +sagY(x, y0, sag), y2 = +sagY(x + 16, y0, sag);
        g += `<path d="M${x} ${f(y)} L${x + 16} ${f(y2)} L${x + 8} ${f((y + y2) / 2 + 16)}Z" fill="${colors[i % colors.length]}"/>`;
      }
      L.fx.push(g);
    }
    function lanternString(y0, sag, every, glowC, body) {   // 등 줄 (종이 등 · 호박 등)
      L.fx.push(`<path d="M-4 ${y0} Q200 ${y0 + sag * 2} 404 ${y0}" stroke="#5A4A4A" stroke-width="1" fill="none"/>`);
      for (let x = every / 2; x < 400; x += every) {
        const y = +sagY(x, y0, sag);
        L.fx.push(`<g transform="translate(${f(x)} ${f(y)})"><g class="swing" style="animation-delay:-${f(R() * 4)}s"><path d="M0 0 v5" stroke="#5A4A4A" stroke-width=".8"/>${body}</g></g>`);
        if (lit) L.light.push(`<circle cx="${f(x)}" cy="${f(y + 13)}" r="12" fill="${glowC}" opacity=".45" filter="url(#${id}blur)"/>`);
      }
    }
    const paperLantern = `<rect x="-3" y="5" width="6" height="2" rx="1" fill="#C9963A"/><ellipse cx="0" cy="13" rx="7" ry="8" fill="#E8453E"/><path d="M-6 10 q6 2 12 0 M-6.5 14 q6.5 2 13 0" stroke="#B5302C" stroke-width=".8" fill="none"/>`
      + `<ellipse cx="-2.4" cy="10" rx="1.8" ry="3" fill="#fff" opacity=".25"/><rect x="-3" y="20" width="6" height="2" rx="1" fill="#C9963A"/><path d="M0 22 v4" stroke="#F2C14E" stroke-width="1.4"/>`;
    const pumpkinLantern = `<ellipse cx="-3" cy="12" rx="4" ry="5" fill="#E8762A"/><ellipse cx="3" cy="12" rx="4" ry="5" fill="#E8762A"/><ellipse cx="0" cy="12" rx="4" ry="5.6" fill="#F58A35"/>`
      + `<path d="M-2.6 11 l1 -1.6 l1 1.6z M.6 11 l1 -1.6 l1 1.6z M-2.4 14 q2.4 2 4.8 0" fill="#FFE48A"/><path d="M0 6.4 v-1.4" stroke="#5E7A3A" stroke-width="1.4"/>`;
    function fireworks(list) {                        // 불꽃놀이 [x, y, 색]
      for (const [fx0, fy0, c, delay] of list) {
        let g = "";
        for (let a = 0; a < 360; a += 30) {
          const r0 = a * Math.PI / 180;
          g += `<path d="M${f(Math.cos(r0) * 6)} ${f(Math.sin(r0) * 6)} L${f(Math.cos(r0) * 20)} ${f(Math.sin(r0) * 20)}" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="${f(Math.cos(r0) * 24)}" cy="${f(Math.sin(r0) * 24)}" r="1.8" fill="${c}"/>`;
        }
        (lit ? L.light : L.sky).push(`<g transform="translate(${fx0} ${fy0})"><g class="burst" style="animation-delay:-${delay}s">${g}<circle r="3" fill="#FFF8E0"/></g></g>`);
      }
    }
    const textOn = (x, y, s, t, c, size) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Jua, 'Noto Sans KR', sans-serif" font-size="${size || 8}" fill="${c || "#fff"}"${s ? ` transform="rotate(${s} ${x} ${y})"` : ""}>${esc(t)}</text>`;

    function extrasLondon() {
      // 위: 전나무 가랜드 + 빨간 리본 + 전구 + 생강빵 쿠키
      const P = "M-4 6 Q200 46 404 6";
      L.fx.push(`<path d="${P}" stroke="#24583F" stroke-width="13" fill="none" stroke-linecap="round"/><path d="${P}" stroke="#3E8A5E" stroke-width="8" fill="none" stroke-dasharray="2 3" stroke-linecap="round"/>`
        + `<path d="${P}" stroke="#5FAE7B" stroke-width="3" fill="none" stroke-dasharray="1 5" stroke-linecap="round" transform="translate(0 -2)"/>`);
      for (const bx of [44, 128, 272, 356]) {
        const by = +sagY(bx, 6, 20);
        L.fx.push(`<g transform="translate(${bx} ${by})"><path d="M0 0 c-8 -6 -12 2 -2 3 z M0 0 c8 -6 12 2 2 3 z" fill="#D9363E"/><path d="M-1 2 l-4 10 l3 -1 l2 -9 M1 2 l4 10 l-3 -1 l-2 -9" fill="#C42F37"/><circle r="2.4" fill="#B5262E"/></g>`);
      }
      for (let x = 14, j = 0; x < 400; x += 20, j++) {
        const y = +sagY(x, 6, 20) + 5;
        L.light.push(`<circle cx="${x}" cy="${f(y)}" r="2.2" fill="${["#FFD86A", "#FF8F7E", "#FFF2B0", "#8FE3D8"][j % 4]}" class="tw" style="animation-duration:${f(1.4 + R() * 1.6)}s;animation-delay:-${f(R() * 2)}s"${lit ? ` filter="url(#${id}glow)"` : ""}/>`);
      }
      const ginger = (x) => {
        const y = +sagY(x, 6, 20) + 2;
        return `<g transform="translate(${x} ${y})"><g class="swing" style="animation-delay:-${f(R() * 4)}s"><path d="M0 0 v8" stroke="#F4EEE4" stroke-width=".8"/>`
          + `<circle cx="0" cy="12" r="4" fill="#C98546"/><path d="M-4 16 h8 l2 4 l-2 1 l-1 -2 v5 l1 4 h-3 l-1 -3 l-1 3 h-3 l1 -4 v-5 l-1 2 l-2 -1z" fill="#C98546"/>`
          + `<circle cx="-1.4" cy="11.4" r=".6" fill="#3A2E2B"/><circle cx="1.4" cy="11.4" r=".6" fill="#3A2E2B"/><path d="M-1.4 13.4 q1.4 1 2.8 0" stroke="#fff" stroke-width=".6" fill="none"/>`
          + `<circle cx="0" cy="19" r=".7" fill="#fff"/><circle cx="0" cy="22" r=".7" fill="#E8453E"/><path d="M-3 17 h-2 M3 17 h2" stroke="#fff" stroke-width=".6"/></g></g>`;
      };
      L.fx.push(ginger(88), ginger(316));
      // 가로등 위 편지 든 부엉이
      L.near.push(`<g transform="translate(118 197)"><ellipse cx="0" cy="2" rx="7" ry="9" fill="#A97A50"/><ellipse cx="0" cy="4" rx="4.4" ry="6" fill="#E9D2AE"/>`
        + `<path d="M-6 -6 l1 -5 l3 3z M6 -6 l-1 -5 l-3 3z" fill="#A97A50"/><circle cx="-2.6" cy="-3" r="2.6" fill="#fff"/><circle cx="2.6" cy="-3" r="2.6" fill="#fff"/>`
        + `<circle cx="-2.4" cy="-2.8" r="1.2" fill="#3A2E2B"/><circle cx="2.8" cy="-2.8" r="1.2" fill="#3A2E2B"/><path d="M-1 -.6 l1 1.6 l1 -1.6z" fill="#F2A33A"/>`
        + `<g transform="translate(6 4) rotate(-12)"><rect x="-4" y="-3" width="9" height="6" rx="1" fill="#FFFDF8" stroke="#D9C9B0" stroke-width=".5"/><path d="M-4 -3 l4.5 3.4 l4.5 -3.4" stroke="#D9C9B0" stroke-width=".5" fill="none"/><path d="M.5 1.2 c-1 -1 -2 0 0 1.4 c2 -1.4 1 -2.4 0 -1.4z" fill="#E8453E"/></g></g>`);
      // MERRY XMAS 팻말
      L.ground.push(`<g transform="translate(156 304)"><rect x="-1.6" y="-34" width="3.2" height="34" fill="#7E5337"/>`
        + `<path d="M-22 -32 h34 l6 5 l-6 5 h-34z" fill="#C8935F"/><path d="M22 -20 h-34 l-6 5 l6 5 h34z" fill="#B57F4E"/>`
        + `<rect x="-23" y="-34" width="36" height="3" rx="1.5" fill="#fff"/><rect x="-13" y="-22" width="36" height="3" rx="1.5" fill="#fff"/>`
        + textOn(-4, -24.4, 0, "MERRY", "#FFF6E4", 7.5) + textOn(5, -12.4, 0, "XMAS", "#FFF6E4", 7.5) + `</g>`);
      // 산타
      L.ground.push(`<g transform="translate(380 304)"><ellipse cx="0" cy="2" rx="12" ry="2.6" fill="#4A2E1E" opacity=".14"/><path d="M-9 0 q-1 -15 9 -16 q10 1 9 16z" fill="#D9363E"/><rect x="-9" y="-6" width="18" height="3" fill="#3A2E2B"/><rect x="-2" y="-6.4" width="4" height="3.8" fill="#F2C14E"/>`
        + `<circle cx="0" cy="-20" r="6.4" fill="#FFD9C0"/><path d="M-6.4 -18 q6.4 12 12.8 0 q-2 6 -6.4 7 q-4.4 -1 -6.4 -7z" fill="#FFFDF8"/><path d="M-7 -22 q7 -14 14 0z" fill="#D9363E"/><rect x="-7.4" y="-23.4" width="14.8" height="3" rx="1.5" fill="#FFFDF8"/><circle cx="7" cy="-30" r="2.2" fill="#FFFDF8"/>`
        + `<circle cx="-2.2" cy="-20.6" r=".8" fill="#3A2E2B"/><circle cx="2.2" cy="-20.6" r=".8" fill="#3A2E2B"/><circle cx="-4" cy="-18.6" r="1.3" fill="#FFB8C8" opacity=".8"/><circle cx="4" cy="-18.6" r="1.3" fill="#FFB8C8" opacity=".8"/></g>`);
      // 눈 더미
      for (const [sx0, sy0, r0] of [[0, 318, 34], [70, 320, 26], [250, 322, 30], [330, 320, 24], [400, 318, 30]]) L.ground.push(`<ellipse cx="${sx0}" cy="${sy0}" rx="${r0}" ry="${f(r0 * .36)}" fill="#FFFDF8"/>`);
    }

    function extrasHanRiver() {
      cornerBranches("cherry2", "#E48AA9", "#FFFFFF");
      // 편의점 (밤엔 간판이 켜진다)
      L.near.push(`<g transform="translate(346 246)"><ellipse cx="26" cy="1" rx="30" ry="3" fill="#4A2E1E" opacity=".12"/><rect x="0" y="-34" width="52" height="34" rx="2" fill="#FFF8EE"/>`
        + `<rect x="2" y="-30" width="28" height="22" rx="1" fill="${lit ? "#FFE6A8" : "#CFE6F2"}"/><path d="M16 -30 v22" stroke="#fff" stroke-width="1.2"/><rect x="34" y="-30" width="14" height="30" rx="1" fill="${lit ? "#FFE9B8" : "#BFDCEB"}"/>`
        + `<path d="M-3 -34 h58 v-5 h-58z" fill="#3E7FC9"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${-3 + i * 8.3} -34 q4.15 5 8.3 0" fill="${i % 2 ? "#3E7FC9" : "#FFFFFF"}"/>`).join("")}`
        + `<rect x="6" y="-48" width="40" height="9" rx="2" fill="#2F6DB5"/>` + textOn(26, -41.4, 0, "편의점", "#FFFFFF", 7)
        + `<rect x="54" y="-24" width="8" height="24" rx="1.4" fill="#E8453E"/><rect x="55.5" y="-21" width="5" height="9" rx=".6" fill="#FFF3E0"/></g>`);
      if (lit) glowAt(372, 226, 22, "#FFE08A", .45);
      // 자전거 (앞 바구니에 꽃)
      L.near.push(`<g transform="translate(112 254)"><circle cx="-9" cy="0" r="6" fill="none" stroke="#4A4050" stroke-width="1.4"/><circle cx="9" cy="0" r="6" fill="none" stroke="#4A4050" stroke-width="1.4"/>`
        + `<path d="M-9 0 l6 -9 h9 l3 9 M-3 -9 l-1 -3 h-3 M6 -9 l2 -4 h3" stroke="#5DB9A0" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="8" y="-17" width="8" height="5" rx="1" fill="#D2A26A"/>`
        + `<circle cx="10" cy="-18" r="2" fill="#FFB0C4"/><circle cx="13.6" cy="-18.6" r="2" fill="#FFF3A6"/></g>`);
      // 돗자리 위 라면 · 치킨
      L.ground.push(`<g transform="translate(96 296)">${[0, 10].map((dx) => `<g transform="translate(${dx} ${dx * .3})"><path d="M-4 -8 h8 l-1 9 h-6z" fill="#FFFDF8"/><rect x="-4" y="-5" width="8" height="2.4" fill="#E8453E"/><ellipse cx="0" cy="-8" rx="4" ry="1.2" fill="#F2D49A"/>`
        + `<path d="M-1 -11 q-2 -3 0 -6 M2 -11 q-2 -3 0 -6" stroke="#fff" stroke-width=".9" fill="none" opacity=".8" class="tw" style="animation-duration:2.4s"/></g>`).join("")}`
        + `<g transform="translate(30 4)"><path d="M-9 -2 h18 v-8 h-18z" fill="#F58A35"/><path d="M-9 -10 l3 -4 h12 l3 4z" fill="#FFB062"/><rect x="-5" y="-8" width="10" height="4" rx="1" fill="#FFFDF8"/>` + textOn(0, -5, 0, "치킨", "#E8453E", 3.6) + `</g></g>`);
      // 바닥에 쌓인 꽃잎
      for (let j = 0; j < 34; j++) L.ground.push(`<ellipse cx="${f(R() * 400)}" cy="${f(266 + R() * 52)}" rx="1.8" ry="1.1" fill="#FFC2D6" opacity=".85"/>`);
    }

    function extrasBeach() {
      // 위 모서리 야자 잎
      let g = "";
      for (const side of [0, 1]) {
        const sx = side ? 404 : -4, d = side ? -1 : 1;
        for (const [ang, len, c] of [[18, 110, "#4C9F5C"], [38, 96, "#5DB36A"], [6, 84, "#6CC277"], [56, 70, "#4C9F5C"]]) {
          const a = ang * Math.PI / 180, ex = sx + d * Math.cos(a) * len, ey = -6 + Math.sin(a) * len;
          g += `<path d="M${sx} -6 Q${f((sx + ex) / 2)} ${f(ey * .2 - 10)} ${f(ex)} ${f(ey)} Q${f((sx + ex) / 2 + d * 6)} ${f(ey * .55)} ${sx} -6Z" fill="${c}"/>`;
          for (let j = 1; j < 7; j++) {
            const t = j / 7, px0 = sx + (ex - sx) * t, py0 = -6 + (ey + 6) * t * .9;
            g += `<path d="M${f(px0)} ${f(py0)} l${f(d * 5)} ${f(9 + j)}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
          }
        }
      }
      L.fx.push(`<g class="sway2">${g}</g>`);
      // 오두막 (오른쪽 뒤)
      L.near.push(`<g transform="translate(372 250)"><rect x="-20" y="-4" width="40" height="4" fill="#B98455"/><rect x="-18" y="0" width="3" height="10" fill="#8A5E3C"/><rect x="15" y="0" width="3" height="10" fill="#8A5E3C"/>`
        + `<rect x="-16" y="-24" width="32" height="20" fill="#E7C08A"/><rect x="-6" y="-18" width="12" height="14" rx="1" fill="${lit ? "#FFE6A8" : "#8FC9D8"}"/>`
        + `<path d="M-26 -22 L0 -40 L26 -22Z" fill="#D9B06A"/>${[-22, -14, -6, 2, 10, 18].map((x0) => `<path d="M${x0} -22 v4" stroke="#C99A52" stroke-width="2"/>`).join("")}</g>`);
      if (lit) glowAt(372, 236, 16, "#FFE08A", .45);
      // 서핑보드 · 모래 하트 · 횃불
      L.ground.push(`<g transform="translate(392 300) rotate(-8)"><path d="M-6 0 C-7 -20 -4 -40 0 -46 C4 -40 7 -20 6 0Z" fill="#FF9EB5"/><path d="M0 -44 v44" stroke="#fff" stroke-width="2"/><path d="M-5 -14 h10" stroke="#8FD0FA" stroke-width="2.4"/></g>`
        + `<path d="M246 300 c-6 -8 -16 -2 -10 6 l10 8 l10 -8 c6 -8 -4 -14 -10 -6z" fill="none" stroke="#D2AE78" stroke-width="2" stroke-linecap="round"/>`);
      for (const tx of [22, 186]) {
        L.ground.push(`<g transform="translate(${tx} 300)"><rect x="-1.6" y="-30" width="3.2" height="30" fill="#A57A4E"/><path d="M-3.4 -32 h6.8 l-1 4 h-4.8z" fill="#7A5338"/></g>`);
        L.light.push(`<path d="M${tx} -46 q-5 8 0 12 q5 -4 0 -12z" transform="translate(0 300)" fill="#FFB24A" class="tw" style="animation-duration:.9s"/><path d="M${tx} -41 q-2.6 5 0 7 q2.6 -2 0 -7z" transform="translate(0 300)" fill="#FFE48A"/>`);
        if (lit) glowAt(tx, 262, 14, "#FFB45A", .55);
      }
    }

    function extrasValley() {
      cornerBranches("bgl", S.leaf2[2], mix(S.leaf2[0], "#FFFFFF", .5));
      // 개울 위 작은 구름다리
      L.ground.push(`<g transform="translate(66 252) rotate(-28)"><path d="M-22 4 Q0 -10 22 4" stroke="#8A5E3C" stroke-width="4" fill="none"/>`
        + `${[-18, -12, -6, 0, 6, 12, 18].map((x0) => `<path d="M${x0} ${f(4 - 14 * (1 - (x0 / 22) ** 2) * .5 - 1)} v-7" stroke="#A57A4E" stroke-width="1.4"/>`).join("")}`
        + `<path d="M-22 -3 Q0 -17 22 -3" stroke="#A57A4E" stroke-width="1.4" fill="none"/></g>`);
      // 텐트 · 모닥불 · 전구 줄
      L.near.push(`<g transform="translate(306 246)"><ellipse cx="0" cy="1" rx="28" ry="3" fill="#4A2E1E" opacity=".12"/><path d="M-26 0 L0 -34 L26 0Z" fill="#F2A65A"/><path d="M0 -34 L26 0 H10Z" fill="#E08A3E"/>`
        + `<path d="M-7 0 L0 -20 L7 0Z" fill="${lit ? "#FFE6A8" : "#7A4A2A"}"/><path d="M0 -34 v-8 l8 3 l-8 3" fill="#FF9EB5" stroke="#8A5E3C" stroke-width=".8"/></g>`);
      if (lit) glowAt(306, 236, 16, "#FFD27A", .5);
      L.ground.push(`<g transform="translate(372 270)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${f(Math.cos(a * Math.PI / 180) * 9)}" cy="${f(Math.sin(a * Math.PI / 180) * 3 + 2)}" rx="3.4" ry="2.4" fill="#A9A6A0"/>`).join("")}`
        + `<path d="M-7 1 l14 -4 M-7 -3 l14 4" stroke="#7A4A2A" stroke-width="3" stroke-linecap="round"/></g>`);
      L.light.push(`<g transform="translate(372 266)"><path d="M0 -14 q-7 8 -3 13 h6 q4 -5 -3 -13z" fill="#FF8A3D" class="tw" style="animation-duration:.8s"/><path d="M0 -9 q-3 5 -1 8 h2 q2 -3 -1 -8z" fill="#FFE48A"/></g>`);
      glowAt(372, 262, lit ? 22 : 12, "#FFB45A", lit ? .6 : .3);
      if (lit) catenary(296, 214, 380, 220, 8, 7, ["#FFD86A", "#FFF2B0", "#FFB870"]);
    }

    function extrasHalloween() {
      // 거미줄 (왼쪽 위) + 매달린 거미
      let w = "";
      for (let a = 0; a <= 90; a += 18) { const r0 = a * Math.PI / 180; w += `<path d="M0 0 L${f(Math.cos(r0) * 70)} ${f(Math.sin(r0) * 70)}" stroke="#EDE6F5" stroke-width=".8" opacity=".75"/>`; }
      for (const r0 of [16, 30, 44, 58]) w += `<path d="${[0, 18, 36, 54, 72, 90].map((a, i) => `${i ? "Q" + f(Math.cos((a - 9) * Math.PI / 180) * r0 * .86) + " " + f(Math.sin((a - 9) * Math.PI / 180) * r0 * .86) + " " : "M"}${f(Math.cos(a * Math.PI / 180) * r0)} ${f(Math.sin(a * Math.PI / 180) * r0)}`).join(" ")}" stroke="#EDE6F5" stroke-width=".7" fill="none" opacity=".7"/>`;
      L.fx.push(w + `<g transform="translate(46 0)"><g class="bob" style="animation-duration:5s"><path d="M0 0 v46" stroke="#EDE6F5" stroke-width=".6"/><circle cx="0" cy="49" r="3.4" fill="#2E2346"/><circle cx="0" cy="45" r="2.4" fill="#2E2346"/>`
        + `<path d="M-3 47 l-4 -2 M-3 49 l-4 1 M-3 51 l-3 3 M3 47 l4 -2 M3 49 l4 1 M3 51 l3 3" stroke="#2E2346" stroke-width=".8"/><circle cx="-.8" cy="44.6" r=".5" fill="#fff"/><circle cx=".8" cy="44.6" r=".5" fill="#fff"/></g></g>`);
      // 호박등 줄
      lanternString(4, 14, 44, "#FFB45A", pumpkinLantern);
      // 귀여운 비석
      const grave = (x0, y0, t) => `<g transform="translate(${x0} ${y0})"><path d="M-9 0 v-14 a9 9 0 0 1 18 0 v14z" fill="#9C93B4"/><path d="M-9 0 v-14 a9 9 0 0 1 6 -8.4" stroke="#BDB5D2" stroke-width="2" fill="none"/>${textOn(0, -8, 0, t, "#5E5478", 6.4)}<ellipse cx="0" cy="0" rx="11" ry="2" fill="#5E7A3A"/></g>`;
      L.near.push(grave(150, 252, "BOO"), grave(262, 250, "RIP"));
      // 끓는 솥
      L.ground.push(`<g transform="translate(244 304)"><ellipse cx="0" cy="2" rx="16" ry="3" fill="#2A1A10" opacity=".2"/><path d="M-13 -12 q0 14 13 14 q13 0 13 -14z" fill="#3A3448"/><ellipse cx="0" cy="-12" rx="13" ry="3.6" fill="#7EE07A"/>`
        + `<circle cx="-4" cy="-15" r="2.4" fill="#A8F29E" class="bob" style="animation-duration:1.6s"/><circle cx="4" cy="-17" r="1.8" fill="#A8F29E" class="bob" style="animation-duration:2.1s"/><path d="M-10 2 l-3 3 M10 2 l3 3" stroke="#3A3448" stroke-width="2"/></g>`);
      L.light.push(`<circle cx="244" cy="290" r="12" fill="#8FF08A" opacity="${lit ? .5 : .25}" filter="url(#${id}blur)"/>`);
      // 촛불
      for (const [cx0, cy0] of [[150, 300], [158, 304], [206, 306]]) {
        L.ground.push(`<rect x="${cx0 - 2}" y="${cy0 - 8}" width="4" height="8" rx="1" fill="#F6EEDC"/>`);
        L.light.push(`<path d="M${cx0} ${cy0 - 14} q-2.4 3 0 5 q2.4 -2 0 -5z" fill="#FFC85A" class="tw" style="animation-duration:.9s"/>`);
        if (lit) glowAt(cx0, cy0 - 11, 8, "#FFC85A", .5);
      }
      // 작은 유령 하나 더
      L.fx.push(`<g transform="translate(130 150) scale(.7)"><g class="bob" style="animation-duration:4.4s;animation-delay:-1s"><path d="M-11 6 C-12 -8 -8 -16 0 -16 C8 -16 12 -8 11 6 l-3 -3 l-3 3 l-3 -3 l-2 3 l-3 -3 l-3 3 l-3 -3z" fill="#FFFDF8" opacity=".92"/>`
        + `<circle cx="-3.6" cy="-6" r="1.4" fill="#3A2E2B"/><circle cx="3.6" cy="-6" r="1.4" fill="#3A2E2B"/><path d="M-2 -1 q2 2 4 0" stroke="#3A2E2B" stroke-width="1" fill="none"/></g></g>`);
    }

    /* ---------- 장면: 놀이공원 (기념일 · 불꽃놀이) ---------- */
    function scenePark() {
      L.mtn.push(`<path d="M0 200 Q80 176 160 192 T320 184 T400 194 L400 240 L0 240Z" fill="${mix("#D8C8EC", haze, .4)}"/>`);
      // 성 (왼쪽 뒤)
      const tw = (x0, w0, h0, roof) => `<rect x="${x0 - w0 / 2}" y="${208 - h0}" width="${w0}" height="${h0}" fill="${mix("#E6DCF4", haze, .15)}"/><path d="M${x0 - w0 / 2 - 3} ${208 - h0} L${x0} ${208 - h0 - w0 * 1.5} L${x0 + w0 / 2 + 3} ${208 - h0}Z" fill="${roof}"/>`
        + `<path d="M${x0} ${208 - h0 - w0 * 1.5} v-8 l6 2.4 l-6 2.4" fill="#FF9EB5" stroke="#9A86C0" stroke-width=".6"/>` + win(x0 - 2, 208 - h0 + 8, 4, 6, lit);
      L.mtn.push(`<g>${tw(46, 14, 52, "#8FA6E8")}${tw(128, 14, 56, "#8FA6E8")}<rect x="54" y="172" width="66" height="36" fill="${mix("#EDE5F8", haze, .1)}"/>`
        + `${[56, 66, 76, 86, 96, 106, 116].map((x0) => `<rect x="${x0}" y="168" width="6" height="5" fill="${mix("#EDE5F8", haze, .1)}"/>`).join("")}${tw(87, 22, 76, "#7F95E0")}${tw(70, 10, 46, "#A9B9F0")}${tw(104, 10, 46, "#A9B9F0")}`
        + `<path d="M80 208 v-14 a7 7 0 0 1 14 0 v14z" fill="${lit ? "#FFE6A8" : "#B7A6D6"}"/></g>`);
      if (lit) glowAt(87, 190, 30, "#FFE6A8", .35);
      // 광장 바닥 (파스텔 타일)
      grad("near", [[0, "#F2E6F6"], [1, "#E6D6EE"]]);
      L.near.push(`<path d="M0 208 L400 208 L400 320 L0 320Z" fill="${U("near")}"/>`);
      for (let yy = 214; yy < 320; yy += 12) L.near.push(`<path d="M0 ${yy} H400" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`);
      grad("ground", [[0, "#EADCF2"], [1, "#DCC8EA"]]);
      L.ground.push(`<path d="M0 268 C96 260 304 260 400 268 L400 320 L0 320Z" fill="${U("ground")}" opacity=".7"/>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="52" ry="9" fill="#A6D88A"/><ellipse cx="${X - 8}" cy="${B}" rx="38" ry="5" fill="#C2E8A0" opacity=".7"/>`);
      // 회전목마
      let cr = `<g transform="translate(70 284)"><ellipse cx="0" cy="4" rx="40" ry="6" fill="#4A2E1E" opacity=".12"/><ellipse cx="0" cy="0" rx="38" ry="6" fill="#F4C9D8"/><rect x="-38" y="-2" width="76" height="4" fill="#E9A8C0"/>`;
      for (const px0 of [-28, 0, 28]) cr += `<path d="M${px0} 0 v-44" stroke="#F2C14E" stroke-width="1.6"/>`;
      cr += `<g class="horse"><g transform="translate(-28 -18)">${horse("#FFFDF8", "#FF9EB5")}</g></g><g class="horse" style="animation-delay:-1.2s"><g transform="translate(0 -22)">${horse("#FFF4D6", "#8FD0FA")}</g></g><g class="horse" style="animation-delay:-.6s"><g transform="translate(28 -18)">${horse("#FFFDF8", "#C7A6F2")}</g></g>`;
      cr += `<path d="M-42 -44 Q0 -76 42 -44Z" fill="#FF8FA3"/>${[-30, -14, 2, 18].map((x0, i) => `<path d="M${x0} ${-44 - (i % 2 ? 6 : 4)} L0 -72 L${x0 + 14} -46Z" fill="#FFFDF8"/>`).join("")}<path d="M-42 -44 Q0 -76 42 -44" stroke="#E86A82" stroke-width="1" fill="none"/>`
        + `${[-40, -28, -16, -4, 8, 20, 32].map((x0) => `<path d="M${x0} -44 q6 6 12 0" fill="#FF8FA3"/>`).join("")}<circle cx="0" cy="-76" r="3" fill="#F2C14E"/></g>`;
      L.ground.push(cr);
      if (lit) for (let j = 0; j < 8; j++) L.light.push(`<circle cx="${70 - 38 + j * 10.8}" cy="${f(284 - 44 + Math.abs(j - 3.5) * 1.6)}" r="1.6" fill="#FFE48A" class="tw" style="animation-delay:-${f(j * .2)}s" filter="url(#${id}glow)"/>`);
      function horse(body, saddle) {
        return `<path d="M-9 0 q0 -6 7 -6 h6 q4 -6 6 -2 l-1 3 q-2 0 -3 2 q0 4 -3 4 h-8 q-4 0 -4 -1z" fill="${body}"/><path d="M-6 -2 v7 M5 -2 v7" stroke="${body}" stroke-width="1.8"/><rect x="-4" y="-7" width="6" height="2.6" rx="1" fill="${saddle}"/><circle cx="9" cy="-7" r=".7" fill="#3A2E2B"/>`;
      }
      // 풍선 수레 (오른쪽)
      L.ground.push(`<g transform="translate(374 294)"><rect x="-16" y="-14" width="32" height="14" rx="2" fill="#8FD0FA"/><rect x="-16" y="-14" width="32" height="4" fill="#fff" opacity=".5"/><circle cx="-10" cy="2" r="4" fill="#5E5478"/><circle cx="10" cy="2" r="4" fill="#5E5478"/></g>`);
      const bal = [["#FF8FA3", -14, -70], ["#FFD86A", -2, -80], ["#8FD0FA", 10, -72], ["#B8F27A", -8, -58], ["#C7A6F2", 6, -60], ["#FFB27A", 16, -86]];
      for (const [c, bx, by] of bal) L.fx.push(`<g transform="translate(374 280)"><path d="M0 0 Q${bx / 2} ${by / 2} ${bx} ${by + 10}" stroke="#9A8A8A" stroke-width=".6" fill="none"/><g transform="translate(${bx} ${by})"><g class="bob" style="animation-duration:${f(3 + R() * 2)}s;animation-delay:-${f(R() * 3)}s"><ellipse cy="0" rx="8" ry="10" fill="${c}"/><ellipse cx="-2.6" cy="-4" rx="2" ry="3" fill="#fff" opacity=".5"/><path d="M-1.6 10 h3.2 l-1.6 -2.4z" fill="${c}"/></g></g></g>`);
      // 팝콘 수레
      L.ground.push(`<g transform="translate(296 304)"><ellipse cx="0" cy="3" rx="18" ry="3" fill="#4A2E1E" opacity=".12"/><rect x="-14" y="-24" width="28" height="22" rx="2" fill="#FFFDF8"/>${[-14, -6, 2, 10].map((x0) => `<rect x="${x0}" y="-24" width="4" height="22" fill="#E8453E"/>`).join("")}`
        + `<rect x="-12" y="-36" width="24" height="12" rx="2" fill="#FFF3D6" opacity=".9"/>${[-8, -3, 2, 7, -5, 4].map((x0, i) => `<circle cx="${x0}" cy="${-30 - (i > 3 ? 4 : 0)}" r="3" fill="#FFF8E4"/>`).join("")}`
        + `<path d="M-16 -38 h32 l-3 -6 h-26z" fill="#E8453E"/><circle cx="-9" cy="0" r="3.4" fill="#5E5478"/><circle cx="9" cy="0" r="3.4" fill="#5E5478"/></g>`);
      bunting(4, 12, ["#FF8FA3", "#FFD86A", "#8FD0FA", "#B8F27A", "#C7A6F2"]);
      fireworks([[300, 58, "#FF8FA3", 0], [210, 36, "#FFD86A", 1.1], [356, 106, "#8FD0FA", 2]]);
      for (let j = 0; j < 2; j++) L.fx.push(`<g transform="translate(${f(160 + j * 90)} ${f(150 + R() * 30)})"><g class="bob" style="animation-delay:-${f(R() * 3)}s"><path d="M0 0 c-6 -8 -12 -2 -6 3 z M0 0 c6 -8 12 -2 6 3 z" fill="${j ? "#C7A6F2" : "#FFB7CC"}" class="flap"/></g></g>`);
      sideForest([[20, 256, .5], [12, 272, .66], [396, 274, .66]], (x0, y0, s) => smallRound(x0, y0, s));
    }

    /* ---------- 장면: 야시장 ---------- */
    function sceneMarket() {
      if (!moon) L.sky.push(`<circle cx="324" cy="62" r="40" fill="#FFE2A0" opacity=".3" filter="url(#${id}blur)"/><circle cx="324" cy="62" r="22" fill="#FFEBBA"/>`);
      // 풍등이 하늘로 올라간다
      for (let j = 0; j < 6; j++) {
        const lx = 40 + R() * 320, ly = 120 + R() * 70;
        L.light.push(`<g transform="translate(${f(lx)} ${f(ly)})"><g class="rise" style="animation-duration:${f(14 + R() * 8)}s;animation-delay:-${f(R() * 14)}s"><path d="M-4 0 h8 l-1 -9 h-6z" fill="#FFC870"/><circle r="10" cy="-4" fill="#FFB45A" opacity=".35" filter="url(#${id}blur)"/></g></g>`);
      }
      // 한옥 지붕 마을 (창문이 켜져 있다)
      const roofC = "#3A2E52", wallC = "#5E4A6E";
      const house = (x0, w0, h0) => `<rect x="${x0}" y="${210 - h0}" width="${w0}" height="${h0}" fill="${wallC}"/><path d="M${x0 - 8} ${210 - h0} Q${x0 + w0 / 2} ${210 - h0 - 10} ${x0 + w0 + 8} ${210 - h0} L${x0 + w0 + 2} ${210 - h0 - 12} Q${x0 + w0 / 2} ${210 - h0 - 18} ${x0 - 2} ${210 - h0 - 12}Z" fill="${roofC}"/>`
        + win(x0 + 5, 210 - h0 + 6, 6, 8, true) + win(x0 + w0 - 11, 210 - h0 + 6, 6, 8, true);
      L.mtn.push(house(0, 50, 34) + house(60, 46, 28) + house(250, 52, 36) + house(316, 50, 30) + house(372, 40, 40));
      for (const [wx, wy] of [[8, 182], [96, 188], [258, 180], [358, 186], [396, 176]]) glowAt(wx, wy, 8, "#FFD27A", .4);
      // 돌바닥 거리
      grad("near", [[0, "#6E5A70"], [1, "#5A4860"]]);
      L.near.push(`<path d="M0 210 L400 210 L400 320 L0 320Z" fill="${U("near")}"/>`);
      for (let yy = 218; yy < 320; yy += 13) for (let xx = (yy % 26 === 0 ? 0 : 13); xx < 400; xx += 26) L.near.push(`<rect x="${xx}" y="${yy}" width="23" height="10" rx="3.4" fill="#7E6A80" opacity=".28"/>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="50" ry="8" fill="#5E8A4E"/>`);
      // 포장마차 두 곳
      const stall = (x0, awnA, awnB, items) => `<g transform="translate(${x0} 262)"><rect x="0" y="-26" width="70" height="26" fill="#8A5E3C"/><rect x="0" y="-26" width="70" height="4" fill="#A97A50"/>`
        + `<rect x="4" y="-58" width="2.4" height="32" fill="#5A3A28"/><rect x="63.6" y="-58" width="2.4" height="32" fill="#5A3A28"/>`
        + `<path d="M-4 -58 h78 v-8 h-78z" fill="${awnA}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${-4 + i * 9.75} -58 q4.9 6 9.75 0" fill="${i % 2 ? awnA : awnB}"/>`).join("")}${items}</g>`;
      const tteok = `<ellipse cx="18" cy="-28" rx="12" ry="3.4" fill="#3A3448"/><ellipse cx="18" cy="-29" rx="10.4" ry="2.4" fill="#E8453E"/><path d="M12 -30 h4 M19 -29.4 h4 M14 -28 h3" stroke="#FFD9B0" stroke-width="1.6" stroke-linecap="round"/>`
        + `<path d="M12 -34 q-2 -4 0 -8 M18 -34 q-2 -4 0 -8 M24 -34 q-2 -4 0 -8" stroke="#fff" stroke-width=".9" fill="none" opacity=".7" class="tw" style="animation-duration:2.2s"/>`
        + `${[40, 46, 52, 58].map((x0) => `<path d="M${x0} -26 v-12" stroke="#C99A52" stroke-width="1"/><circle cx="${x0}" cy="-34" r="2.2" fill="#C9563A"/><circle cx="${x0}" cy="-30" r="2.2" fill="#E8B04A"/>`).join("")}`;
      const sweets = `${[12, 22, 32].map((x0, i) => `<circle cx="${x0}" cy="-31" r="5" fill="${["#FFB0C4", "#FFE48A", "#B8F27A"][i]}"/><circle cx="${x0 - 1.6}" cy="-32.6" r="1.4" fill="#fff" opacity=".6"/>`).join("")}`
        + `<rect x="42" y="-38" width="22" height="12" rx="2" fill="#FFF3D6"/>${textOn(53, -29.6, 0, "호떡", "#8A5E3C", 6.4)}`;
      L.near.push(stall(6, "#E8453E", "#FFFDF8", tteok), stall(324, "#F2A33A", "#FFF3D6", sweets));
      glowAt(40, 228, 26, "#FFC870", .5); glowAt(358, 228, 26, "#FFC870", .5);
      lanternString(6, 16, 36, "#FF9E6A", paperLantern);
      lanternString(48, 10, 54, "#FF9E6A", paperLantern);
      sideForest([[20, 274, .5], [396, 276, .5]], (x0, y0, s) => smallRound(x0, y0, s));
    }

    /* ---------- 장면: 시애틀 (11월) ---------- */
    function sceneSeattle() {
      // 눈 덮인 큰 산
      L.mtn.push(`<path d="M196 200 L262 132 Q270 124 278 132 L352 200Z" fill="${mix("#A9B8CF", haze, .35)}"/>`
        + `<path d="M246 148 L262 132 Q270 124 278 132 L294 148 L284 144 L276 152 L268 144 L258 152Z" fill="#FBF8F6"/>`
        + `<path d="M0 196 Q60 176 120 188 T240 190 T400 186 L400 240 L0 240Z" fill="${mix("#8FA0B4", haze, .4)}"/>`);
      // 바늘 전망탑 + 빌딩 숲 (밤엔 창문)
      const tc = lit ? "#4A5068" : mix("#E8ECF0", haze, .1);
      let sk = `<path d="M60 206 L66 112 L70 112 L76 206Z M58 206 L68 150 L78 206Z" fill="none" stroke="${tc}" stroke-width="2.6"/>`
        + `<ellipse cx="68" cy="106" rx="16" ry="4" fill="${tc}"/><rect x="62" y="98" width="12" height="7" rx="2" fill="${tc}"/><ellipse cx="68" cy="97" rx="10" ry="2.6" fill="${tc}"/><path d="M68 95 v-20" stroke="${tc}" stroke-width="1.6"/>`;
      for (const [bx, bw, bh] of [[92, 16, 58], [110, 12, 74], [124, 18, 50], [146, 14, 66], [166, 20, 44], [300, 16, 52], [318, 12, 70], [332, 20, 46], [356, 14, 60], [374, 22, 42]]) {
        sk += `<rect x="${bx}" y="${206 - bh}" width="${bw}" height="${bh}" fill="${lit ? "#3E4660" : mix("#B7C3D2", haze, .25)}"/>`;
        for (let wy = 206 - bh + 5; wy < 202; wy += 6) for (let wx = bx + 2.5; wx < bx + bw - 3; wx += 4.4) if (R() < (lit ? .5 : .2)) sk += win(wx, wy, 1.8, 2.6, lit);
      }
      L.mtn.push(sk);
      if (lit) L.light.push(`<circle cx="68" cy="75" r="1.8" fill="#FF6B6B" class="tw" style="animation-duration:1.4s"/>`);
      if (lit) glowAt(68, 104, 14, "#FFE08A", .4);
      // 만 (바다) + 페리 + 범고래
      grad("bay", [[0, mix(horizon, "#9DB4C8", .5)], [1, mix(sky[0], "#4E6E8E", .55)]]);
      L.far.push(`<rect x="0" y="206" width="400" height="36" fill="${U("bay")}"/><rect x="0" y="206" width="400" height="1.6" fill="#fff" opacity=".35"/>`);
      for (let j = 0; j < 9; j++) L.far.push(`<path d="M${f(R() * 390)} ${f(212 + R() * 26)} h${f(6 + R() * 10)}" stroke="#F4F7FA" stroke-width="1" stroke-linecap="round" opacity=".55" class="tw" style="animation-duration:${f(2 + R() * 2)}s;animation-delay:-${f(R() * 3)}s"/>`);
      L.far.push(`<g transform="translate(150 220)"><g class="paddle" style="animation-duration:26s"><path d="M-18 0 h36 l-5 6 h-26z" fill="#FFFDF8"/><rect x="-12" y="-6" width="24" height="6" rx="1" fill="#FFFDF8"/><rect x="-10" y="-4.4" width="20" height="2" fill="#3F8F6A"/>`
        + `<rect x="-5" y="-11" width="10" height="5" rx="1" fill="#FFFDF8"/><rect x="-1.4" y="-15" width="2.8" height="4" fill="#3F8F6A"/><rect x="-18" y="4" width="36" height="1.6" fill="#3F8F6A"/></g></g>`);
      L.far.push(`<g transform="translate(286 230)"><g class="bob" style="animation-duration:4s"><path d="M-9 2 C-8 -6 6 -7 9 0 C6 3 -4 4 -9 2Z" fill="#2E3240"/><path d="M-2 -4 l3 -6 l2 6z" fill="#2E3240"/><ellipse cx="4" cy="-1" rx="2.4" ry="1.4" fill="#fff"/><path d="M-6 1 q4 2 9 0" stroke="#fff" stroke-width="1.6" fill="none"/>`
        + `<path d="M6 -5 q-1 -6 -4 -8 M6 -5 q1 -6 4 -8" stroke="#E9F2F8" stroke-width="1.2" fill="none" class="tw" style="animation-duration:3s"/></g></g>`);
      // 부두 대관람차
      let wh = `<circle r="26" fill="none" stroke="${lit ? "#5A6078" : "#F4F7FA"}" stroke-width="1.8"/>`;
      for (let a = 0; a < 360; a += 30) {
        const r0 = a * Math.PI / 180;
        wh += `<path d="M0 0 L${f(Math.cos(r0) * 26)} ${f(Math.sin(r0) * 26)}" stroke="${lit ? "#5A6078" : "#F4F7FA"}" stroke-width=".7"/><rect x="${f(Math.cos(r0) * 26 - 2)}" y="${f(Math.sin(r0) * 26 - 2)}" width="4" height="4" rx="1" fill="${lit ? "#FFD98A" : "#FFFDF8"}"/>`;
      }
      L.far.push(`<rect x="300" y="236" width="80" height="6" fill="#8A7A6A"/><g transform="translate(346 204)"><g class="spin" style="animation-duration:50s">${wh}</g></g><path d="M346 204 l-10 32 M346 204 l10 32" stroke="${lit ? "#5A6078" : "#E8ECF0"}" stroke-width="1.8"/>`);
      if (lit) glowAt(346, 204, 30, "#FFE08A", .25);
      // 젖은 산책로 (나무 데크) + 웅덩이
      grad("near", [[0, "#9C8C7E"], [1, "#857566"]]);
      L.near.push(`<path d="M0 242 C120 238 280 238 400 242 L400 320 L0 320Z" fill="${U("near")}"/>`);
      for (let yy = 248; yy < 320; yy += 8) L.near.push(`<path d="M0 ${yy} H400" stroke="#6E6052" stroke-opacity=".35" stroke-width="1"/>`);
      grad("ground", [[0, "#B8A48E"], [1, "#9E8B76"]]);
      L.ground.push(`<path d="M0 268 C96 262 304 262 400 268 L400 320 L0 320Z" fill="${U("ground")}" opacity=".55"/>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="50" ry="8" fill="#8EA86E"/>`);
      for (const [px0, py0, rx0] of [[70, 300, 22], [312, 306, 18], [180, 312, 14]]) {
        L.ground.push(`<ellipse cx="${px0}" cy="${py0}" rx="${rx0}" ry="${f(rx0 * .28)}" fill="${mix(sky[0], "#9DB4C8", .4)}" opacity=".85"/><ellipse cx="${px0 - rx0 * .3}" cy="${py0 - 1}" rx="${f(rx0 * .4)}" ry="1" fill="#fff" opacity=".5"/>`
          + `<ellipse cx="${px0 + 4}" cy="${py0}" rx="4" ry="1.2" fill="none" stroke="#fff" stroke-width=".7" class="ripple" style="animation-delay:-${f(R() * 2)}s"/>`);
      }
      // 우산 쓴 벤치 + 커피 두 잔
      L.near.push(`<g transform="translate(112 262)"><ellipse cx="0" cy="4" rx="26" ry="3" fill="#2A1A10" opacity=".14"/><rect x="-22" y="-12" width="44" height="4" rx="2" fill="#B98455"/><rect x="-22" y="-6" width="44" height="4" rx="2" fill="#A8744E"/>`
        + `<rect x="-19" y="-3" width="3" height="8" fill="#5A4636"/><rect x="16" y="-3" width="3" height="8" fill="#5A4636"/><path d="M6 -6 L14 -40" stroke="#5A4636" stroke-width="1.4"/>`
        + `<path d="M-12 -34 Q14 -60 40 -40 Q34 -44 27 -40 Q21 -46 14 -40 Q7 -45 0 -38 Q-6 -42 -12 -34Z" fill="#E8453E"/><path d="M14 -40 L14 -52" stroke="#5A4636" stroke-width="1"/>`
        + `<g transform="translate(-10 -12)"><path d="M-3 -7 h6 l-1 7 h-4z" fill="#FFFDF8"/><rect x="-3.4" y="-8.6" width="6.8" height="2" rx="1" fill="#6B4A3A"/><path d="M-1 -10 q-2 -3 0 -6" stroke="#fff" stroke-width=".8" fill="none" class="tw" style="animation-duration:2.2s"/></g>`
        + `<g transform="translate(-2 -12)"><path d="M-3 -7 h6 l-1 7 h-4z" fill="#FFFDF8"/><rect x="-3.4" y="-8.6" width="6.8" height="2" rx="1" fill="#6B4A3A"/><rect x="-2.6" y="-4.6" width="5" height="1.8" fill="#C98546"/></g></g>`);
      // 김 나는 커피 수레
      L.ground.push(`<g transform="translate(376 300)"><ellipse cx="0" cy="3" rx="20" ry="3" fill="#2A1A10" opacity=".14"/><rect x="-18" y="-22" width="36" height="20" rx="3" fill="#5E8C6A"/><rect x="-18" y="-22" width="36" height="5" rx="2" fill="#7AA886"/>`
        + `<path d="M-22 -36 h44 l-4 -8 h-36z" fill="#F4EEE4"/>${[-20, -12, -4, 4, 12].map((x0) => `<path d="M${x0} -36 q4 5 8 0" fill="#C9563A"/>`).join("")}`
        + `<rect x="-16" y="-36" width="2" height="14" fill="#5A4636"/><rect x="14" y="-36" width="2" height="14" fill="#5A4636"/>`
        + `<circle cx="-9" cy="0" r="4" fill="#3E3A4A"/><circle cx="9" cy="0" r="4" fill="#3E3A4A"/><rect x="-8" y="-17" width="16" height="7" rx="1.4" fill="#F4EEE4"/>${textOn(0, -11.6, 0, "COFFEE", "#5E8C6A", 4.6)}`
        + `<path d="M-6 -26 q-2 -3 0 -6 M0 -26 q-2 -3 0 -6 M6 -26 q-2 -3 0 -6" stroke="#fff" stroke-width=".9" fill="none" opacity=".75" class="tw" style="animation-duration:2.4s"/></g>`);
      // 단풍 가지 (위 모서리) + 가로등
      rgrad("maple", [[0, "#FFC46A"], [.6, "#E8693A"], [1, "#B7402A"]], .32, .28, .85);
      cornerBranches("maple", "#8E3220", "#FFD27A");
      L.near.push(lamp(166, 248, 30, false), lamp(262, 246, 30, false));
      // 보슬비
      for (let j = 0; j < 46; j++) {
        const rx0 = R() * 420, d0 = .9 + R() * .6;
        L.fx.push(`<g transform="translate(${f(rx0)} 0)"><path d="M0 0 l-3 9" stroke="#E6EEF6" stroke-width="1" stroke-linecap="round" opacity=".55" class="rain" style="animation-duration:${f(d0)}s;animation-delay:-${f(R() * d0)}s"/></g>`);
      }
      sideForest([[20, 252, .55], [384, 252, .55], [42, 266, .45], [6, 276, .7]], (x0, y0, s) => smallFir(x0, y0, s));
    }

    /* ---------- 장면: 눈 오는 산장 (12월 26일~2월) ---------- */
    function sceneCabin() {
      L.mtn.push(`<path d="M0 190 Q70 150 140 176 T280 164 T400 180 L400 240 L0 240Z" fill="${mix("#D6D2E2", haze, .35)}"/>`);
      grad("far", [[0, S.far[0]], [1, S.far[1]]]);
      L.far.push(`<path d="M0 214 C60 198 118 204 176 208 S300 194 400 204 L400 320 L0 320Z" fill="${U("far")}"/>`);
      for (let j = 0; j < 22; j++) { const x0 = R() * 400; L.far.push(smallFir(x0, 204 + R() * 10, .26 + R() * .14)); }
      grassGround(S.near, S.ground);
      // 통나무 산장 (굴뚝 연기 · 따뜻한 창문)
      let c = `<g transform="translate(344 252)"><ellipse cx="0" cy="2" rx="52" ry="5" fill="#4A2E1E" opacity=".14"/><rect x="-42" y="-40" width="84" height="40" fill="#9A6A44"/>`;
      for (let yy = -38; yy < 0; yy += 6) c += `<rect x="-44" y="${yy}" width="88" height="4.4" rx="2.2" fill="#B07C52"/>`;
      c += `<rect x="-30" y="-30" width="16" height="14" rx="1.4" fill="#FFE2A0"/><path d="M-22 -30 v14 M-30 -23 h16" stroke="#7A4F34" stroke-width="1.4"/>`
        + `<rect x="10" y="-28" width="16" height="28" rx="1.4" fill="#7A4F34"/><circle cx="23" cy="-14" r="1.2" fill="#F2C14E"/>`
        + `<path d="M-52 -38 L0 -70 L52 -38Z" fill="#6E4A3A"/><path d="M-54 -38 L0 -72 L54 -38 L48 -36 L0 -64 L-48 -36Z" fill="#FFFDF8"/>`
        + `<rect x="22" y="-70" width="10" height="20" fill="#8A6A5A"/><rect x="20" y="-74" width="14" height="5" rx="1" fill="#FFFDF8"/></g>`;
      L.near.push(c);
      glowAt(322, 229, lit ? 20 : 10, "#FFD27A", lit ? .6 : .3);
      for (let j = 0; j < 4; j++) L.fx.push(`<g transform="translate(371 176)"><circle r="${5 + j * 1.6}" fill="#F4F2F6" opacity=".7" class="rise" style="animation-duration:7s;animation-delay:-${f(j * 1.75)}s"/></g>`);
      // 장작 더미 · 썰매 · 사슴
      L.ground.push(`<g transform="translate(278 262)">${[[-8, 0], [0, 0], [8, 0], [-4, -6], [4, -6], [0, -12]].map(([x0, y0]) => `<circle cx="${x0}" cy="${y0}" r="4" fill="#9A6A44" stroke="#7A4F34"/><circle cx="${x0}" cy="${y0}" r="1.6" fill="#D9B48A"/>`).join("")}<path d="M-12 -14 h24" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`);
      L.ground.push(`<g transform="translate(76 304)"><path d="M-26 0 h44 q8 0 8 -6" stroke="#8A5E3C" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="-22" y="-12" width="38" height="8" rx="2" fill="#C8935F"/>`
        + `<path d="M-18 -4 v4 M12 -4 v4" stroke="#8A5E3C" stroke-width="2"/><rect x="-20" y="-20" width="20" height="8" rx="2" fill="#D9534F"/><path d="M-20 -16 h20" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 2"/></g>`);
      L.near.push(`<g transform="translate(60 250)"><ellipse cx="0" cy="2" rx="12" ry="2" fill="#4A2E1E" opacity=".1"/><ellipse cx="0" cy="-8" rx="10" ry="6" fill="#B98455"/><path d="M-6 -4 v8 M6 -4 v8" stroke="#8A5E3C" stroke-width="2"/>`
        + `<circle cx="10" cy="-16" r="4.4" fill="#B98455"/><path d="M8 -20 l-3 -6 M8 -26 l-3 -2 M12 -20 l2 -6 M14 -26 l3 -2" stroke="#7A5338" stroke-width="1.2" fill="none"/><circle cx="12" cy="-16.6" r=".7" fill="#3A2E2B"/><circle cx="14.4" cy="-15" r="1" fill="#E8453E"/>`
        + `<circle cx="-4" cy="-10" r="1" fill="#FFFDF8"/><circle cx="2" cy="-8" r="1" fill="#FFFDF8"/></g>`);
      if (lit) catenary(300, 210, 392, 212, 6, 8, ["#FFD86A", "#FFF2B0", "#FFB870"]);
      sideForest([[22, 252, .55], [6, 270, .7], [392, 276, .66], [44, 264, .46]], (x0, y0, s) => smallFir(x0, y0, s));
    }

    /* ---------- 장면: 제주 유채꽃 ---------- */
    function sceneJeju() {
      L.mtn.push(`<rect x="0" y="192" width="400" height="18" fill="${mix(horizon, "#79BEDD", .55)}"/>`
        + `<path d="M296 200 Q302 168 322 166 L356 166 Q374 168 380 200Z" fill="${mix("#86AE7C", haze, .3)}"/><path d="M322 166 L356 166" stroke="#B3D29E" stroke-width="2.4"/>`
        + `<path d="M0 206 Q90 148 170 144 Q250 148 330 198 L330 212 L0 212Z" fill="${mix("#8CAE98", haze, .38)}"/>`);
      for (const [wx, wy] of [[44, 190], [270, 182]]) {
        let bl = "";
        for (const a of [0, 120, 240]) bl += `<path d="M0 0 L${f(Math.cos(a * Math.PI / 180) * 11)} ${f(Math.sin(a * Math.PI / 180) * 11)}" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>`;
        L.mtn.push(`<path d="M${wx} ${wy} v26" stroke="#F4F6F8" stroke-width="1.6"/><g transform="translate(${wx} ${wy})"><g class="spin" style="animation-duration:6s">${bl}</g></g>`);
      }
      grassGround(S.near, S.ground);
      // 유채꽃 밭 (가운데는 비워 둔다)
      for (let row = 0; row < 4; row++) for (let x0 = 4 + (row % 2) * 7; x0 < 400; x0 += 13) {
        if (x0 > 150 && x0 < 280) continue;
        const y0 = 238 + row * 7 + R() * 3;
        L.near.push(`<circle cx="${f(x0)}" cy="${f(y0)}" r="${f(5 + R() * 2)}" fill="${R() < .5 ? "#FFE24A" : "#F7CB33"}"/><circle cx="${f(x0 - 1.6)}" cy="${f(y0 - 2)}" r="1.6" fill="#FFF3A0"/>`);
      }
      // 돌담
      let wall = "";
      for (let x0 = 0; x0 < 400; x0 += 9) { if (x0 > 160 && x0 < 268) continue; wall += `<ellipse cx="${x0 + R() * 3}" cy="${f(266 + R() * 3)}" rx="5.4" ry="4" fill="${R() < .5 ? "#4E4C56" : "#5E5C66"}"/><circle cx="${x0 - 1}" cy="265" r=".7" fill="#7A7884"/>`; }
      L.near.push(wall);
      // 돌하르방
      L.ground.push(`<g transform="translate(58 304)"><ellipse cx="0" cy="2" rx="14" ry="3" fill="#2A2A30" opacity=".15"/><rect x="-11" y="-30" width="22" height="30" rx="8" fill="#6A6874"/>`
        + `<path d="M-12 -30 q12 -22 24 0z" fill="#5A5864"/><rect x="-13" y="-32" width="26" height="4" rx="2" fill="#5A5864"/>`
        + `<circle cx="-4.4" cy="-22" r="3.4" fill="#5A5864"/><circle cx="4.4" cy="-22" r="3.4" fill="#5A5864"/><circle cx="-4.4" cy="-22" r="1.2" fill="#3A3842"/><circle cx="4.4" cy="-22" r="1.2" fill="#3A3842"/>`
        + `<ellipse cx="0" cy="-16" rx="3" ry="2.4" fill="#5A5864"/><path d="M-9 -9 h8 M1 -6 h8" stroke="#555360" stroke-width="3" stroke-linecap="round"/>`
        + `<circle cx="-7" cy="-17" r="1.8" fill="#FFB8C8" opacity=".5"/><circle cx="7" cy="-17" r="1.8" fill="#FFB8C8" opacity=".5"/>`
        + `${[[-6, -26], [2, -28], [6, -12], [-3, -4]].map(([x0, y0]) => `<circle cx="${x0}" cy="${y0}" r=".6" fill="#8A8894"/>`).join("")}</g>`);
      // 귤 상자 · 귤나무
      L.ground.push(`<g transform="translate(374 300)"><rect x="-14" y="-12" width="28" height="12" fill="#C8935F"/><path d="M-14 -6 h28" stroke="#A97A44"/>`
        + `${[-9, -3, 3, 9, -6, 0, 6].map((x0, i) => `<circle cx="${x0}" cy="${i > 3 ? -18 : -14}" r="3.6" fill="#F7912F"/><circle cx="${x0 - 1}" cy="${(i > 3 ? -18 : -14) - 1.2}" r="1" fill="#fff" opacity=".5"/>`).join("")}</g>`);
      L.near.push(`<g transform="translate(330 262)">${smallRound(0, 0, .5).replace(/<g transform="translate\(0 0\)">/, "<g>")}${[[-6, -26], [5, -30], [0, -20], [8, -22]].map(([x0, y0]) => `<circle cx="${x0}" cy="${y0}" r="2.4" fill="#F7912F"/>`).join("")}</g>`);
      // 조랑말
      L.near.push(`<g transform="translate(128 258)"><ellipse cx="0" cy="2" rx="14" ry="2" fill="#4A2E1E" opacity=".1"/><ellipse cx="0" cy="-10" rx="12" ry="7" fill="#9A6A44"/><path d="M-8 -6 v8 M-3 -5 v7 M4 -5 v7 M9 -6 v8" stroke="#7A4F34" stroke-width="2.4"/>`
        + `<path d="M9 -14 q4 -10 10 -8 q2 4 -2 8 q-4 2 -6 4z" fill="#9A6A44"/><path d="M10 -16 q2 -6 6 -8" stroke="#5A3A28" stroke-width="2.4" fill="none"/><circle cx="16" cy="-12" r=".8" fill="#3A2E2B"/><path d="M-12 -12 q-6 2 -4 10" stroke="#5A3A28" stroke-width="2" fill="none"/></g>`);
    }

    /* ---------- 장면: 파리 ---------- */
    function sceneParis() {
      // 철탑
      const tc = lit ? "#5A4E6A" : mix("#9A8270", haze, .2);
      L.mtn.push(`<g fill="none" stroke="${tc}" stroke-linecap="round"><path d="M56 206 Q70 160 78 110 L80 60 M100 206 Q86 160 82 110 L80 60" stroke-width="2.6"/>`
        + `<path d="M62 190 Q78 172 94 190" stroke-width="2"/><path d="M68 160 h24 M72 128 h16 M76 96 h8" stroke-width="2"/>`
        + `<path d="M62 190 L94 160 M94 190 L62 160 M70 160 L88 128 M88 160 L70 128 M74 128 L84 96 M84 128 L74 96" stroke-width=".8" opacity=".8"/><path d="M80 60 v-12" stroke-width="1.4"/></g>`);
      if (lit) for (let j = 0; j < 16; j++) L.light.push(`<circle cx="${f(62 + R() * 36 * (1 - j / 20))}" cy="${f(200 - j * 9)}" r="1.1" fill="#FFF2C0" class="tw" style="animation-duration:${f(.6 + R() * .8)}s;animation-delay:-${f(R())}s"/>`);
      // 파리 건물 줄 (크림 벽 · 청회색 지붕 · 발코니)
      let bd = "";
      for (const [bx, bw, bh] of [[110, 40, 46], [152, 34, 54], [252, 38, 50], [292, 44, 44], [338, 30, 56], [370, 34, 48]]) {
        const top = 206 - bh;
        bd += `<rect x="${bx}" y="${top}" width="${bw}" height="${bh}" fill="${lit ? "#5E5470" : mix("#F1E2C8", haze, .15)}"/><path d="M${bx - 2} ${top} L${bx + 4} ${top - 9} H${bx + bw - 4} L${bx + bw + 2} ${top}Z" fill="${lit ? "#3E3A54" : "#7F8C9E"}"/>`;
        for (let wy = top + 6; wy < 200; wy += 11) for (let wx = bx + 4; wx < bx + bw - 6; wx += 8) bd += win(wx, wy, 4, 6, lit && R() < .7) + `<rect x="${wx - 1}" y="${wy + 6}" width="6" height="1.4" fill="${lit ? "#2E2A42" : "#5A5A6A"}"/>`;
      }
      L.mtn.push(bd);
      // 센 강 + 돌다리
      grad("river", [[0, mix(horizon, "#9CC4DC", .5)], [1, mix(sky[0], "#4F7CA8", .55)]]);
      L.far.push(`<rect x="0" y="206" width="400" height="30" fill="${U("river")}"/>`);
      let br = `<rect x="0" y="202" width="180" height="6" fill="${mix("#E6D8BE", haze, .2)}"/>`;
      for (const ax of [10, 70, 130]) br += `<path d="M${ax} 208 Q${ax + 25} 228 ${ax + 50} 208" stroke="${mix("#D2C2A4", haze, .2)}" stroke-width="5" fill="none"/>`;
      L.far.push(br);
      for (let j = 0; j < 8; j++) L.far.push(`<path d="M${f(R() * 390)} ${f(214 + R() * 18)} h${f(6 + R() * 10)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55" class="tw" style="animation-duration:${f(2 + R() * 2)}s;animation-delay:-${f(R() * 3)}s"/>`);
      // 강변 산책로
      grad("near", [[0, "#E4D6C0"], [1, "#D2C2A6"]]);
      L.near.push(`<path d="M0 236 C120 232 280 232 400 236 L400 320 L0 320Z" fill="${U("near")}"/>`);
      for (let yy = 244; yy < 320; yy += 10) for (let xx = (yy % 20 === 4 ? 0 : 10); xx < 400; xx += 20) L.near.push(`<rect x="${xx}" y="${yy}" width="17" height="7" rx="2.4" fill="#C9B898" opacity=".35"/>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="50" ry="8" fill="#9CC77A"/>`);
      // 카페 테라스 (왼쪽 앞)
      L.ground.push(`<g transform="translate(0 0)"><rect x="0" y="206" width="66" height="70" fill="#F4E6CE"/><rect x="8" y="226" width="22" height="30" rx="2" fill="${lit ? "#FFE2A0" : "#BFD6E6"}"/><rect x="38" y="230" width="20" height="46" rx="2" fill="#5E8C6A"/>`
        + `<path d="M-2 206 h70 l6 14 h-82z" fill="#D9363E"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${-6 + i * 10} 220 q5 5 10 0" fill="${i % 2 ? "#D9363E" : "#FFFDF8"}"/>`).join("")}`
        + `<rect x="10" y="196" width="46" height="9" rx="1.6" fill="#2E2A42"/>${textOn(33, 203, 0, "CAFÉ", "#F2C14E", 7)}</g>`);
      if (lit) glowAt(19, 240, 18, "#FFD27A", .5);
      const table = (x0, y0) => `<g transform="translate(${x0} ${y0})"><ellipse cx="0" cy="12" rx="12" ry="2" fill="#2A1A10" opacity=".12"/><ellipse cx="0" cy="0" rx="10" ry="3" fill="#FFFDF8"/><path d="M0 0 v12 M-5 12 h10" stroke="#3E3A4A" stroke-width="1.4"/>`
        + `<path d="M-3 -4 h4 l-.6 3 h-2.8z" fill="#fff"/><path d="M1 -3 q2 0 1 2" stroke="#fff" fill="none"/><path d="M4 -1.4 q2 -4 5 -1 q-2 2 -5 1z" fill="#E9B05E"/>`
        + `<path d="M-16 -2 v14 M-16 -2 h-4 v-10 M14 -2 v14 M14 -2 h4 v-10" stroke="#3E3A4A" stroke-width="1.4" fill="none"/></g>`;
      L.ground.push(table(92, 290), table(150, 302));
      // 꽃 화분 · 바게트 자전거
      L.ground.push(`<g transform="translate(70 270)"><path d="M-6 0 h12 l-2 8 h-8z" fill="#C9763A"/>${[[-4, -3], [0, -6], [4, -3]].map(([x0, y0]) => flower(x0, y0, 3.4, "#FF8FA3", "#FFE07A")).join("")}</g>`);
      L.near.push(`<g transform="translate(372 254)"><circle cx="-9" cy="0" r="6" fill="none" stroke="#3E3A4A" stroke-width="1.4"/><circle cx="9" cy="0" r="6" fill="none" stroke="#3E3A4A" stroke-width="1.4"/>`
        + `<path d="M-9 0 l6 -9 h9 l3 9 M-3 -9 l-1 -3 h-3 M6 -9 l2 -4 h3" stroke="#D9363E" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="8" y="-17" width="8" height="5" rx="1" fill="#D2A26A"/><path d="M9 -16 l8 -10" stroke="#E2B36A" stroke-width="3" stroke-linecap="round"/></g>`);
      L.near.push(lamp(240, 246, 30, false));
    }

    /* ---------- 장면: 산토리니 ---------- */
    function sceneSantorini() {
      grad("sea", [[0, mix(horizon, "#5FB2E0", .55)], [1, "#1E64B4"]]);
      L.mtn.push(`<rect x="0" y="194" width="400" height="60" fill="${U("sea")}"/>`);
      for (let j = 0; j < 10; j++) L.mtn.push(`<path d="M${f(R() * 390)} ${f(202 + R() * 40)} h${f(6 + R() * 10)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".6" class="tw" style="animation-duration:${f(2 + R() * 2)}s;animation-delay:-${f(R() * 3)}s"/>`);
      L.mtn.push(`<path d="M232 196 Q260 186 290 196Z" fill="${mix("#B7A48E", haze, .4)}"/>`);
      // 왼쪽 절벽 + 흰 집 + 파란 지붕
      L.far.push(`<path d="M0 150 C40 146 100 160 150 200 C160 214 168 236 170 262 L0 262Z" fill="#C79E7A"/><path d="M0 150 C40 146 100 160 150 200" stroke="#E0BC94" stroke-width="3" fill="none"/>`);
      let hs = "";
      for (const [hx, hy, hw, hh] of [[4, 134, 30, 22], [34, 140, 26, 20], [62, 150, 28, 20], [12, 160, 34, 24], [48, 168, 30, 22], [80, 176, 30, 22], [20, 190, 38, 26], [62, 196, 34, 24], [100, 206, 34, 24]]) {
        hs += `<rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="2" fill="#FFFFFF"/><rect x="${hx}" y="${hy}" width="${hw}" height="3" fill="#EDEEF4"/><rect x="${hx + hw - 8}" y="${hy + 8}" width="5" height="9" rx="2.4" fill="${lit ? "#FFE2A0" : "#3A78C8"}"/>`;
      }
      hs += `<path d="M26 134 a12 12 0 0 1 24 0z" fill="#2E6CC8"/><rect x="36" y="118" width="4" height="6" fill="#fff"/><path d="M38 118 v-5 M36 115 h4" stroke="#fff" stroke-width="1.2"/>`
        + `<path d="M84 176 a10 10 0 0 1 20 0z" fill="#2E6CC8"/><rect x="118" y="186" width="10" height="20" fill="#fff"/><path d="M118 186 a5 5 0 0 1 10 0z" fill="#2E6CC8"/><rect x="121" y="192" width="4" height="6" rx="2" fill="#3A78C8"/>`;
      for (let j = 0; j < 14; j++) hs += `<circle cx="${f(6 + R() * 120)}" cy="${f(150 + R() * 70)}" r="${f(2 + R() * 2)}" fill="#E8509A" opacity=".9"/>`;
      L.far.push(hs);
      // 오른쪽 풍차
      let sails = "";
      for (const a of [0, 90, 180, 270]) sails += `<path d="M0 0 L${f(Math.cos(a * Math.PI / 180) * 20)} ${f(Math.sin(a * Math.PI / 180) * 20)}" stroke="#8A6A4E" stroke-width="1.4"/><path d="M0 0 L${f(Math.cos((a + 12) * Math.PI / 180) * 18)} ${f(Math.sin((a + 12) * Math.PI / 180) * 18)} L${f(Math.cos(a * Math.PI / 180) * 20)} ${f(Math.sin(a * Math.PI / 180) * 20)}Z" fill="#FFFDF8"/>`;
      L.far.push(`<path d="M300 262 C320 216 360 200 400 196 L400 262Z" fill="#C79E7A"/><rect x="352" y="174" width="18" height="30" fill="#FFFFFF"/><path d="M350 176 L361 162 L372 176Z" fill="#B98455"/>`
        + `<g transform="translate(361 172)"><g class="spin" style="animation-duration:12s">${sails}</g></g>`);
      // 하얀 테라스 + 파란 난간
      grad("near", [[0, "#F8F4EE"], [1, "#EAE2D8"]]);
      L.near.push(`<path d="M0 256 L400 256 L400 320 L0 320Z" fill="${U("near")}"/><rect x="0" y="252" width="400" height="5" fill="#2E6CC8"/>`);
      for (let px0 = 4; px0 < 400; px0 += 12) L.near.push(`<rect x="${px0}" y="240" width="2.4" height="13" fill="#2E6CC8"/>`);
      L.near.push(`<rect x="0" y="238" width="400" height="3" rx="1.5" fill="#2E6CC8"/>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="48" ry="8" fill="#A6CF7E"/>`);
      // 화분 · 고양이
      for (const px0 of [40, 120, 380]) L.ground.push(`<g transform="translate(${px0} 300)"><path d="M-7 -10 h14 l-2 10 h-10z" fill="#3A78C8"/><path d="M-7 -10 h14" stroke="#fff" stroke-width="1.4"/>${[[-4, -14], [0, -18], [4, -14]].map(([x0, y0]) => flower(x0, y0, 3.6, "#E8509A", "#FFE07A")).join("")}</g>`);
      L.ground.push(`<g transform="translate(300 302)"><ellipse cx="0" cy="2" rx="14" ry="2.4" fill="#2A1A10" opacity=".12"/><ellipse cx="0" cy="-4" rx="12" ry="6" fill="#F2B36A"/><circle cx="-10" cy="-8" r="5" fill="#F2B36A"/>`
        + `<path d="M-14 -11 l1 -5 l3 3z M-7 -11 l1 -5 l2 4z" fill="#F2B36A"/><path d="M-12 -8 q1 1 2 0 M-8 -8 q1 1 2 0" stroke="#5A3A28" stroke-width=".8" fill="none"/><path d="M10 -4 q8 -2 6 -10" stroke="#F2B36A" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
        + `<path d="M-2 -8 q2 -2 4 0 M3 -8 q2 -2 4 0" stroke="#D9924A" stroke-width="1.2" fill="none"/></g>`);
    }

    /* ---------- 장면: 궁궐 ---------- */
    function scenePalace() {
      L.mtn.push(`<path d="M0 192 Q50 150 104 168 Q150 120 214 142 Q270 118 320 160 Q370 150 400 172 L400 240 L0 240Z" fill="${mix("#8EA492", haze, .35)}"/>`
        + `<path d="M150 136 q8 -6 14 2 M200 132 q10 -8 18 0" stroke="#C9D6C8" stroke-width="2" fill="none" opacity=".6"/>`);
      // 궁궐 전각 (왼쪽) + 문 (오른쪽)
      const hall = (x0, w0, h0, s) => {
        const top = 212 - h0;
        let g = `<rect x="${x0 - 4}" y="${212 - 8}" width="${w0 + 8}" height="8" fill="${mix("#D8D2C4", haze, .15)}"/>`;
        for (let px0 = x0 + 4; px0 <= x0 + w0 - 4; px0 += (w0 - 8) / 4) g += `<rect x="${f(px0 - 2)}" y="${top + 10}" width="4" height="${h0 - 18}" fill="#B5332E"/>`;
        g += `<rect x="${x0}" y="${top + 6}" width="${w0}" height="6" fill="#3E8A7A"/>${[...Array(Math.floor(w0 / 8))].map((_, i) => `<circle cx="${x0 + 4 + i * 8}" cy="${top + 9}" r="1.4" fill="${["#E8B04A", "#E8453E", "#F4F0E4"][i % 3]}"/>`).join("")}`
          + `<path d="M${x0 - 14 * s} ${top + 6} Q${x0 + w0 / 2} ${top - 2} ${x0 + w0 + 14 * s} ${top + 6} L${x0 + w0 + 6} ${top - 6} Q${x0 + w0 / 2} ${top - 18 * s} ${x0 - 6} ${top - 6}Z" fill="#3E4450"/>`
          + `<path d="M${x0 - 6} ${top - 6} Q${x0 + w0 / 2} ${top - 18 * s} ${x0 + w0 + 6} ${top - 6}" stroke="#5E6676" stroke-width="2" fill="none"/>`;
        return g;
      };
      L.far.push(hall(14, 108, 52, 1.2), hall(300, 80, 40, 1));
      if (lit) { glowAt(68, 186, 30, "#FFD27A", .35); glowAt(340, 190, 24, "#FFD27A", .3); }
      // 돌 마당
      grad("near", [[0, "#E2DCD0"], [1, "#CFC6B6"]]);
      L.near.push(`<path d="M0 212 L400 212 L400 320 L0 320Z" fill="${U("near")}"/>`);
      for (let yy = 220; yy < 320; yy += 12) for (let xx = (yy % 24 === 4 ? 0 : 14); xx < 400; xx += 28) L.near.push(`<rect x="${xx}" y="${yy}" width="26" height="10" rx="1.6" fill="#BDB3A2" opacity=".35"/>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="50" ry="8" fill="#8FB86E"/>`);
      // 청사초롱 줄
      const chosa = `<rect x="-4" y="5" width="8" height="2" fill="#C9963A"/><rect x="-5.4" y="7" width="10.8" height="7" fill="#3E7FC9"/><rect x="-5.4" y="14" width="10.8" height="7" fill="#D9363E"/><path d="M-5.4 7 v14 M5.4 7 v14" stroke="#C9963A" stroke-width=".8"/><rect x="-4" y="21" width="8" height="2" fill="#C9963A"/><path d="M0 23 v4" stroke="#D9363E" stroke-width="1.2"/>`;
      lanternString(6, 14, 40, "#FFC870", chosa);
      // 방패연
      L.fx.push(`<g transform="translate(330 70)"><g class="bob" style="animation-duration:5s"><rect x="-12" y="-14" width="24" height="28" rx="1" fill="#FFFDF8" stroke="#3E4450" stroke-width=".8"/><circle r="5" fill="none" stroke="#D9363E" stroke-width="2"/><path d="M-12 -14 L12 14 M12 -14 L-12 14" stroke="#3E7FC9" stroke-width=".6"/>`
        + `<rect x="-12" y="-14" width="24" height="5" fill="#3E7FC9" opacity=".8"/><path d="M0 14 q-10 30 -40 60" stroke="#8A7A6A" stroke-width=".6" fill="none"/></g></g>`);
      // 소나무
      const pine = (x0, y0, s) => {
        const k = (n) => f(n * s);
        return `<g transform="translate(${x0} ${y0})"><path d="M0 0 C${k(-4)} ${k(-20)} ${k(8)} ${k(-36)} ${k(2)} ${k(-56)}" stroke="#8A5A3A" stroke-width="${k(5)}" fill="none" stroke-linecap="round"/>`
          + `${[[-14, -40, 16], [12, -50, 14], [-4, -62, 14], [16, -30, 12]].map(([bx, by, w0]) => `<ellipse cx="${k(bx)}" cy="${k(by)}" rx="${k(w0)}" ry="${k(5)}" fill="#3F7A55"/><ellipse cx="${k(bx - 2)}" cy="${k(by - 2)}" rx="${k(w0 * .7)}" ry="${k(2.4)}" fill="#5C9A6E"/>`).join("")}</g>`;
      };
      L.near.push(pine(384, 262, 1), pine(160, 232, .6));
      L.ground.push(pine(26, 300, 1.1));
    }

    /* ---------- 장면: 해바라기 밭 ---------- */
    function sceneSunflower() {
      L.mtn.push(`<path d="M0 196 Q90 170 180 184 T400 178 L400 240 L0 240Z" fill="${mix("#A8C99A", haze, .4)}"/>`);
      grad("far", [[0, "#B9DC8E"], [1, "#9FCC76"]]);
      L.far.push(`<path d="M0 214 C60 198 118 204 176 208 S300 194 400 204 L400 320 L0 320Z" fill="${U("far")}"/>`);
      // 풍차
      let sails = "";
      for (const a of [45, 135, 225, 315]) {
        const r0 = a * Math.PI / 180;
        sails += `<path d="M0 0 L${f(Math.cos(r0) * 28)} ${f(Math.sin(r0) * 28)}" stroke="#7A5338" stroke-width="1.8"/><path d="M${f(Math.cos(r0) * 8)} ${f(Math.sin(r0) * 8)} L${f(Math.cos(r0) * 28 - Math.sin(r0) * 6)} ${f(Math.sin(r0) * 28 + Math.cos(r0) * 6)} L${f(Math.cos(r0) * 28)} ${f(Math.sin(r0) * 28)}Z" fill="#FFF3E0" opacity=".95"/>`;
      }
      L.far.push(`<path d="M330 206 L336 156 h16 L358 206Z" fill="#C9563A"/><path d="M332 158 L344 140 L356 158Z" fill="#6E4A3A"/><rect x="340" y="186" width="8" height="12" rx="4" fill="#7A4F34"/>`
        + `<g transform="translate(344 154)"><g class="spin" style="animation-duration:10s">${sails}</g></g>`);
      grassGround(["#A8D27E", "#8CC468"], S.ground);
      // 해바라기 (뒤는 작게 줄지어, 앞은 크게)
      const sunf = (x0, y0, s) => {
        const k = (n) => f(n * s);
        let g = `<g transform="translate(${f(x0)} ${f(y0)})"><path d="M0 0 v${k(-30)}" stroke="#5E9E4E" stroke-width="${k(2.4)}"/><path d="M0 ${k(-14)} q${k(-10)} ${k(-4)} ${k(-12)} ${k(2)} q${k(8)} ${k(2)} ${k(12)} ${k(-2)}" fill="#6CB25A"/>`;
        for (let a = 0; a < 360; a += 30) g += `<ellipse cx="${f(Math.cos(a * Math.PI / 180) * 8 * s)}" cy="${f(-32 * s + Math.sin(a * Math.PI / 180) * 8 * s)}" rx="${k(4.4)}" ry="${k(2)}" fill="#FFCE2E" transform="rotate(${a} ${f(Math.cos(a * Math.PI / 180) * 8 * s)} ${f(-32 * s + Math.sin(a * Math.PI / 180) * 8 * s)})"/>`;
        return g + `<circle cx="0" cy="${k(-32)}" r="${k(5.6)}" fill="#7A4A22"/><circle cx="${k(-1.4)}" cy="${k(-33.4)}" r="${k(1.6)}" fill="#A06A3A"/></g>`;
      };
      for (let x0 = 6; x0 < 400; x0 += 15) { if (x0 > 150 && x0 < 280) continue; L.near.push(sunf(x0 + R() * 5, 252 + R() * 4, .55)); }
      for (let x0 = 0; x0 < 400; x0 += 22) { if (x0 > 130 && x0 < 300) continue; L.near.push(sunf(x0 + R() * 6, 266 + R() * 4, .75)); }
      L.ground.push(sunf(30, 310, 1.3), sunf(70, 318, 1.1), sunf(370, 314, 1.25));
      // 둥근 건초더미 · 벌
      L.near.push(`<g transform="translate(120 252)"><ellipse cx="0" cy="2" rx="14" ry="2.4" fill="#4A2E1E" opacity=".12"/><circle cx="0" cy="-10" r="12" fill="#E9C46A"/><circle cx="0" cy="-10" r="7" fill="none" stroke="#D2A84A" stroke-width="1.4"/><circle cx="0" cy="-10" r="2.6" fill="#D2A84A"/></g>`);
      for (let j = 0; j < 3; j++) L.fx.push(`<g transform="translate(${f(90 + j * 110 + R() * 20)} ${f(220 + R() * 30)})"><g class="drift" style="animation-delay:-${f(R() * 9)}s"><ellipse rx="3.6" ry="2.6" fill="#FFD54F"/><path d="M-1 -2.6 v5.2 M1.4 -2.6 v5.2" stroke="#3A2E2B" stroke-width="1"/><ellipse cx="-1" cy="-3.4" rx="2" ry="1.4" fill="#fff" opacity=".8" class="flap"/></g></g>`);
    }

    /* ---------- 장면: 오로라 ---------- */
    function sceneAurora() {
      // 하늘에 일렁이는 오로라 띠
      grad("aur", [[0, "#7CFFC4", 0], [.4, "#58F0B0", .7], [.75, "#7E8CFF", .45], [1, "#C77DFF", 0]]);
      for (const [y0, a0, d0] of [[40, .9, 0], [70, .7, 2.4], [100, .55, 4]])
        L.sky.push(`<path d="M-20 ${y0} C60 ${y0 - 30} 120 ${y0 + 30} 200 ${y0} S340 ${y0 - 30} 420 ${y0} L420 ${y0 + 50} C340 ${y0 + 30} 280 ${y0 + 70} 200 ${y0 + 46} S60 ${y0 + 20} -20 ${y0 + 50}Z" fill="${U("aur")}" opacity="${a0}" filter="url(#${id}soft)" class="aurora" style="animation-delay:-${d0}s"/>`);
      L.mtn.push(`<path d="M0 196 L60 150 L110 186 L170 140 L240 190 L300 152 L360 184 L400 166 L400 240 L0 240Z" fill="${mix("#3E4C70", haze, .3)}"/><path d="M60 150 L72 160 L52 158Z M170 140 L184 152 L160 152Z M300 152 L312 162 L290 160Z" fill="#E6ECF4"/>`);
      grad("far", [[0, "#C8D2E2"], [1, "#AEB8CC"]]);
      L.far.push(`<path d="M0 214 C60 198 118 204 176 208 S300 194 400 204 L400 320 L0 320Z" fill="${U("far")}"/>`);
      L.far.push(`<ellipse cx="300" cy="226" rx="80" ry="10" fill="#9FB4D6" opacity=".7"/><path d="M240 224 l30 -4 M300 230 l40 -5" stroke="#E6F0FA" stroke-width="1.2" opacity=".8"/>`);
      for (let j = 0; j < 16; j++) L.far.push(smallFir(R() * 400, 206 + R() * 12, .24 + R() * .14));
      grassGround(["#D4DCE8", "#BFC9DA"], ["#E6ECF4", "#CDD6E4"]);
      // 이글루 · 허스키 · 등불
      L.ground.push(`<g transform="translate(76 290)"><ellipse cx="0" cy="2" rx="34" ry="4" fill="#2A3450" opacity=".2"/><path d="M-30 0 a30 26 0 0 1 60 0z" fill="#F4F8FC"/>`
        + `<path d="M-30 0 a30 26 0 0 1 60 0" fill="none" stroke="#D0DBE8" stroke-width="1"/><path d="M-27 -10 h54 M-22 -18 h44 M-14 -23 h28" stroke="#D0DBE8" stroke-width="1"/>`
        + `<path d="M-8 0 v-10 a8 8 0 0 1 16 0 v10z" fill="#FFD98A"/></g>`);
      glowAt(76, 284, 18, "#FFD27A", .65);
      L.ground.push(`<g transform="translate(136 302)"><ellipse cx="0" cy="2" rx="12" ry="2.4" fill="#2A3450" opacity=".18"/><ellipse cx="0" cy="-6" rx="10" ry="6" fill="#8A93A8"/><ellipse cx="0" cy="-4" rx="7" ry="4" fill="#F4F8FC"/>`
        + `<circle cx="9" cy="-13" r="5.4" fill="#8A93A8"/><path d="M6 -17 l1 -5 l3 3z M11 -17 l2 -5 l1 4z" fill="#8A93A8"/><ellipse cx="11" cy="-11" rx="3" ry="2.4" fill="#F4F8FC"/><circle cx="8.6" cy="-14" r=".8" fill="#3A2E2B"/><circle cx="13" cy="-11.6" r=".9" fill="#3A2E2B"/>`
        + `<path d="M-10 -8 q-6 -6 -2 -12" stroke="#8A93A8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-6 -1 v4 M4 -1 v4" stroke="#8A93A8" stroke-width="2.4"/></g>`);
      L.near.push(lamp(360, 250, 28, false));
      sideForest([[22, 252, .55], [6, 270, .7], [392, 276, .66], [372, 262, .46]], (x0, y0, s) => smallFir(x0, y0, s));
    }

    /* ---------- 장면: 우주 ---------- */
    function sceneSpace() {
      // 성운 · 고리 행성 · 작은 달 · 별똥별
      L.sky.push(`<ellipse cx="100" cy="90" rx="120" ry="50" fill="#C46BD8" opacity=".25" filter="url(#${id}blur)"/><ellipse cx="320" cy="140" rx="110" ry="40" fill="#5E8CFF" opacity=".22" filter="url(#${id}blur)"/>`);
      rgrad("planet", [[0, "#FFD3A8"], [.6, "#F39A7A"], [1, "#C2607A"]], .35, .3, .8);
      L.sky.push(`<g transform="translate(76 70)"><ellipse rx="40" ry="9" fill="none" stroke="#F8D9B8" stroke-width="3" opacity=".6" transform="rotate(-14)"/><circle r="24" fill="${U("planet")}"/>`
        + `<path d="M-40 4 A40 9 0 0 0 40 -4" fill="none" stroke="#F8D9B8" stroke-width="3" transform="rotate(-14)"/><path d="M-18 -6 q18 -4 36 2" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none"/></g>`);
      L.sky.push(`<g transform="translate(330 56)"><circle r="14" fill="#D9DCE8"/><circle cx="-4" cy="-3" r="3" fill="#B9BED0"/><circle cx="5" cy="4" r="2.2" fill="#B9BED0"/><circle cx="3" cy="-6" r="1.4" fill="#B9BED0"/></g>`);
      for (let j = 0; j < 3; j++) L.sky.push(`<g transform="translate(${f(120 + j * 90)} ${f(20 + j * 18)})"><path d="M0 0 l-46 18" stroke="#FFFBEA" stroke-width="1.6" stroke-linecap="round" class="shoot" style="animation-delay:-${f(j * 2.3)}s"/></g>`);
      // 작은 행성 표면
      grad("planetg", [[0, "#B9A6E8"], [1, "#8E7AC8"]]);
      L.near.push(`<path d="M-60 320 Q200 196 460 320Z" fill="${U("planetg")}"/><path d="M-60 320 Q200 196 460 320" stroke="#D8CCF6" stroke-width="2" fill="none" opacity=".6"/>`);
      for (const [cx0, cy0, r0] of [[90, 286, 9], [140, 300, 6], [300, 290, 10], [340, 306, 6], [250, 308, 5]]) L.near.push(`<ellipse cx="${cx0}" cy="${cy0}" rx="${r0}" ry="${f(r0 * .4)}" fill="#7E6AB6"/><ellipse cx="${cx0}" cy="${f(cy0 - r0 * .12)}" rx="${f(r0 * .7)}" ry="${f(r0 * .22)}" fill="#6E5AA6"/>`);
      // 로켓 · 깃발 · 별 화분
      L.ground.push(`<g transform="translate(70 270)"><ellipse cx="0" cy="2" rx="14" ry="3" fill="#2A1A40" opacity=".25"/><path d="M-8 0 v-34 q8 -22 16 0 v34z" fill="#FFFDF8"/><path d="M-8 -34 q8 -22 16 0z" fill="#E8453E"/><circle cx="0" cy="-22" r="4.4" fill="#8FD0FA" stroke="#C9D2E2" stroke-width="1.4"/>`
        + `<path d="M-8 -8 l-8 10 h8z M8 -8 l8 10 h-8z" fill="#E8453E"/><path d="M-4 0 q4 10 8 0" fill="#FFB24A" class="tw" style="animation-duration:.5s"/></g>`);
      L.ground.push(`<g transform="translate(346 280)"><path d="M0 0 v-30" stroke="#E6E0F4" stroke-width="1.6"/><path d="M0 -30 h18 l-4 6 l4 6 h-18z" fill="#FF8FA3"/><path d="M9 -24 c-1.6 -1.6 -4 0 0 3 c4 -3 1.6 -4.6 0 -3z" fill="#fff"/></g>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="48" ry="8" fill="#8BC96E"/>`);
      L.fx.push(`<g transform="translate(150 150)"><g class="bob" style="animation-duration:6s"><circle r="5" fill="#B8C4D8"/><rect x="-14" y="-2" width="9" height="4" fill="#5E8CFF"/><rect x="5" y="-2" width="9" height="4" fill="#5E8CFF"/><circle r="1.6" fill="#FFE48A"/></g></g>`);
    }

    /* ---------- 장면: 바닷속 ---------- */
    function sceneUndersea() {
      // 수면에서 내려오는 빛줄기 · 물결
      let rays = "";
      for (let j = 0; j < 6; j++) { const x0 = 30 + j * 70; rays += `<path d="M${x0} 0 L${x0 - 30} 260 L${x0 + 10} 260 L${x0 + 26} 0Z" fill="#FFFFFF" opacity=".08" class="ray" style="animation-delay:-${j}s"/>`; }
      L.sky.push(rays + `<path d="M0 8 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#E8FBFF" stroke-width="2" fill="none" opacity=".5" class="wave"/>`);
      // 먼 바위 · 다시마 숲
      L.mtn.push(`<path d="M0 220 Q40 170 90 190 Q130 160 170 200 L170 240 L0 240Z M250 210 Q300 166 350 186 Q380 170 400 180 L400 240 L250 240Z" fill="${mix("#1C5E8C", sky[1], .3)}"/>`);
      for (const kx of [12, 34, 360, 384, 150, 276]) {
        const h0 = 70 + R() * 50;
        L.far.push(`<g transform="translate(${kx} 262)"><path d="M0 0 C-8 ${f(-h0 * .3)} 8 ${f(-h0 * .6)} 0 ${f(-h0)}" stroke="#3FA36A" stroke-width="5" fill="none" stroke-linecap="round" class="sway3" style="animation-delay:-${f(R() * 4)}s"/></g>`);
      }
      // 모래 바닥
      grad("near", [[0, "#F2DDAE"], [1, "#E2C690"]]);
      L.near.push(`<path d="M0 244 C120 236 280 236 400 244 L400 320 L0 320Z" fill="${U("near")}"/>`);
      for (let j = 0; j < 30; j++) L.near.push(`<circle cx="${f(R() * 400)}" cy="${f(252 + R() * 64)}" r="${f(.5 + R() * .8)}" fill="#C9A06A" opacity=".5"/>`);
      L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="48" ry="8" fill="#7FC28E"/>`);
      // 산호 · 말미잘
      const coral = (x0, y0, c, s) => {
        const k = (n) => f(n * s);
        return `<g transform="translate(${x0} ${y0})"><path d="M0 0 v${k(-20)} M0 ${k(-10)} q${k(-10)} ${k(-4)} ${k(-12)} ${k(-16)} M0 ${k(-14)} q${k(10)} ${k(-2)} ${k(12)} ${k(-14)} M${k(-12)} ${k(-26)} q${k(-2)} ${k(-6)} ${k(2)} ${k(-10)} M${k(12)} ${k(-28)} q${k(4)} ${k(-6)} 0 ${k(-10)}" stroke="${c}" stroke-width="${k(4)}" fill="none" stroke-linecap="round"/></g>`;
      };
      L.near.push(coral(40, 270, "#FF8FA3", 1.2), coral(76, 262, "#FFB27A", .9), coral(340, 268, "#C77DFF", 1.1), coral(372, 262, "#FF8FA3", .9));
      L.ground.push(`<g transform="translate(116 300)">${[0, 40, 80, 120, 160].map((a) => `<path d="M0 0 q${f(Math.cos((a + 190) * Math.PI / 180) * 8)} -10 ${f(Math.cos((a + 190) * Math.PI / 180) * 12)} -16" stroke="#FFB0C4" stroke-width="3" fill="none" stroke-linecap="round" class="sway3"/>`).join("")}<ellipse cx="0" cy="0" rx="9" ry="3" fill="#E87A9A"/></g>`);
      L.ground.push(`<g transform="translate(150 312)"><ellipse rx="16" ry="7" fill="#E8B04A"/><path d="M-14 -2 q14 -12 28 0" stroke="#C9963A" stroke-width="1.2" fill="none"/><path d="M-10 -3 q10 -9 20 0" stroke="#C9963A" stroke-width="1" fill="none"/></g>`);
      // 보물상자
      L.ground.push(`<g transform="translate(330 306)"><rect x="-16" y="-14" width="32" height="14" rx="2" fill="#9A6A44"/><path d="M-16 -14 q16 -14 32 0z" fill="#B07C52"/><rect x="-16" y="-15" width="32" height="2.4" fill="#E8B04A"/><rect x="-3" y="-12" width="6" height="7" rx="1" fill="#E8B04A"/>`
        + `<circle cx="-8" cy="-18" r="2.6" fill="#FFE48A"/><circle cx="6" cy="-19" r="2" fill="#FFE48A"/></g>`);
      glowAt(330, 292, 16, "#FFE48A", .5);
      // 물고기 떼 · 해파리 · 거품
      const fish = (c, s) => `<g transform="scale(${s})"><path d="M-8 0 q8 -8 16 0 q-8 8 -16 0z" fill="${c}"/><path d="M-8 0 l-6 -5 v10z" fill="${c}"/><circle cx="4" cy="-1" r="1.2" fill="#2A2A3A"/><path d="M-1 -5 v10" stroke="#fff" stroke-width="1.4" opacity=".8"/></g>`;
      for (const [fx0, fy0, c, n] of [[60, 120, "#FF9A3C", 3], [250, 90, "#FFD54F", 4], [140, 200, "#5EC8FF", 3]]) {
        let g = "";
        for (let j = 0; j < n; j++) g += `<g transform="translate(${j * 14} ${(j % 2) * 8})">${fish(c, .8 + R() * .3)}</g>`;
        L.fx.push(`<g transform="translate(${fx0} ${fy0})"><g class="swim" style="animation-delay:-${f(R() * 10)}s">${g}</g></g>`);
      }
      L.fx.push(`<g transform="translate(330 120)"><g class="bob" style="animation-duration:5s"><path d="M-12 0 a12 10 0 0 1 24 0 q-3 3 -6 0 q-3 3 -6 0 q-3 3 -6 0 q-3 3 -6 0z" fill="#F7A8E0" opacity=".8"/>`
        + `<path d="M-8 2 q-2 10 0 18 M-2 2 q2 10 -1 20 M4 2 q-2 8 1 16 M9 2 q2 8 0 14" stroke="#F7A8E0" stroke-width="1.2" fill="none" opacity=".7"/><circle cx="-4" cy="-4" r="1" fill="#3A2E2B"/><circle cx="4" cy="-4" r="1" fill="#3A2E2B"/></g></g>`);
      for (let j = 0; j < 14; j++) L.fx.push(`<g transform="translate(${f(R() * 400)} ${f(200 + R() * 110)})"><circle r="${f(1.4 + R() * 2.4)}" fill="none" stroke="#E8FBFF" stroke-width=".9" opacity=".8" class="rise" style="animation-duration:${f(6 + R() * 6)}s;animation-delay:-${f(R() * 8)}s"/></g>`);
    }

    /* =====================================================================
       해외 랜드마크
       ===================================================================== */
    const water = (gid, y0, h0, a, b) => { grad(gid, [[0, mix(horizon, a, .5)], [1, mix(sky[0], b, .55)]]); L.far.push(`<rect x="0" y="${y0}" width="400" height="${h0}" fill="${U(gid)}"/>`); for (let j = 0; j < 9; j++) L.far.push(`<path d="M${f(R() * 390)} ${f(y0 + 5 + R() * (h0 - 8))} h${f(6 + R() * 10)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55" class="tw" style="animation-duration:${f(2 + R() * 2)}s;animation-delay:-${f(R() * 3)}s"/>`); };
    const paving = (y0, a, b, tile) => { grad("near", [[0, a], [1, b]]); L.near.push(`<path d="M0 ${y0} L400 ${y0} L400 320 L0 320Z" fill="${U("near")}"/>`); for (let yy = y0 + 6; yy < 320; yy += 11) for (let xx = (Math.round(yy / 11) % 2) * 12; xx < 400; xx += 24) L.near.push(`<rect x="${xx}" y="${yy}" width="21" height="8" rx="2.4" fill="${tile}" opacity=".35"/>`); };
    const isle = () => L.ground.push(`<ellipse cx="${X}" cy="${B + 2}" rx="50" ry="8" fill="#93C470"/><ellipse cx="${X - 8}" cy="${B}" rx="36" ry="4.6" fill="#B2DA8C" opacity=".7"/>`);
    const skyline = (list, base, day, night) => {
      let s = "";
      for (const [bx, bw, bh, spire] of list) {
        s += `<rect x="${bx}" y="${base - bh}" width="${bw}" height="${bh}" fill="${lit ? night : mix(day, haze, .25)}"/>`;
        if (spire) s += `<path d="M${bx + bw / 2} ${base - bh} v-${spire}" stroke="${lit ? night : mix(day, haze, .25)}" stroke-width="1.6"/>`;
        for (let wy = base - bh + 5; wy < base - 4; wy += 6) for (let wx = bx + 2.5; wx < bx + bw - 3; wx += 4.4) if (R() < (lit ? .5 : .18)) s += win(wx, wy, 1.8, 2.6, lit);
      }
      return s;
    };

    function sceneNewYork() {
      water("harbor", 204, 34, "#9CC4DC", "#4A78A6");
      // 자유의 여신상 (작은 섬 위)
      const sc = lit ? "#3E6E66" : "#7FC2AE";
      L.mtn.push(`<ellipse cx="70" cy="206" rx="34" ry="5" fill="${mix("#7A9A6E", haze, .3)}"/><rect x="58" y="176" width="24" height="30" fill="${mix("#C9B89A", haze, .2)}"/><rect x="54" y="172" width="32" height="6" fill="${mix("#B9A88A", haze, .2)}"/>`
        + `<path d="M62 172 L66 136 Q70 128 74 136 L78 172Z" fill="${sc}"/><circle cx="70" cy="128" r="5" fill="${sc}"/>`
        + `${[-60, -30, 0, 30, 60].map((a) => `<path d="M70 124 l${f(Math.sin(a * Math.PI / 180) * 7)} ${f(-Math.cos(a * Math.PI / 180) * 7)}" stroke="${sc}" stroke-width="1.6"/>`).join("")}`
        + `<path d="M74 140 L82 112" stroke="${sc}" stroke-width="3" stroke-linecap="round"/><path d="M80 112 q2 -8 4 0z" fill="#F2C14E"/><rect x="60" y="146" width="6" height="9" rx="1" fill="${mix(sc, "#FFFFFF", .3)}" transform="rotate(-12 63 150)"/>`);
      L.light.push(`<circle cx="82" cy="108" r="${lit ? 10 : 5}" fill="#FFD27A" opacity="${lit ? .6 : .3}" filter="url(#${id}blur)"/>`);
      // 맨해튼 스카이라인 (첨탑 빌딩)
      L.mtn.push(skyline([[150, 18, 58], [170, 14, 72], [186, 20, 50], [232, 16, 66], [250, 22, 54], [274, 14, 80], [290, 18, 60], [310, 16, 70], [356, 18, 64], [376, 24, 52]], 204, "#B8C2D2", "#3E4660")
        + `<path d="M330 204 v-84 h20 v84z M334 120 v-12 h12 v12z M337 108 v-8 h6 v8z" fill="${lit ? "#4A5270" : mix("#C9D0DC", haze, .2)}"/><path d="M340 100 v-22" stroke="${lit ? "#4A5270" : mix("#C9D0DC", haze, .2)}" stroke-width="1.6"/>`);
      if (lit) L.light.push(`<circle cx="340" cy="78" r="1.8" fill="#FF6B6B" class="tw" style="animation-duration:1.4s"/>`);
      paving(238, "#D6D0C8", "#C2BAB0", "#AFA69A");
      isle();
      // 노란 택시 · 핫도그 수레 · 소화전
      L.ground.push(`<g transform="translate(70 300)"><ellipse cx="0" cy="2" rx="32" ry="3" fill="#2A1A10" opacity=".16"/><path d="M-30 -6 v-8 q0 -4 4 -4 h8 l6 -8 h22 l7 8 h6 q4 0 4 4 v8z" fill="#FFC928"/>`
        + `<path d="M-10 -18 l5 -7 h9 v7z M6 -18 v-7 h9 l5 7z" fill="${lit ? "#FFE6A8" : "#BFDCEB"}"/><rect x="-6" y="-31" width="12" height="5" rx="1" fill="#FFF8E0"/><rect x="-30" y="-12" width="60" height="2" fill="#2E2A2A"/>`
        + `<circle cx="-18" cy="-4" r="5" fill="#3E3A4A"/><circle cx="18" cy="-4" r="5" fill="#3E3A4A"/><circle cx="-18" cy="-4" r="2" fill="#C9C9D2"/><circle cx="18" cy="-4" r="2" fill="#C9C9D2"/></g>`);
      L.ground.push(`<g transform="translate(150 304)"><rect x="-14" y="-16" width="28" height="14" rx="2" fill="#E8453E"/><path d="M-18 -30 h36 l-4 -6 h-28z" fill="#FFC928"/>${[-14, -6, 2, 10].map((x0) => `<path d="M${x0} -30 q4 5 8 0" fill="#E8453E"/>`).join("")}`
        + `<rect x="-14" y="-30" width="2" height="14" fill="#5A4636"/><rect x="12" y="-30" width="2" height="14" fill="#5A4636"/><path d="M-6 -20 h12" stroke="#E9A04A" stroke-width="3" stroke-linecap="round"/><path d="M-6 -20 h12" stroke="#C9563A" stroke-width="1.4" stroke-dasharray="2 1"/>`
        + `<circle cx="-8" cy="0" r="3.4" fill="#3E3A4A"/><circle cx="8" cy="0" r="3.4" fill="#3E3A4A"/></g>`);
      L.ground.push(`<g transform="translate(376 302)"><rect x="-5" y="-14" width="10" height="14" rx="3" fill="#D9363E"/><rect x="-7" y="-10" width="14" height="3" rx="1.5" fill="#D9363E"/><ellipse cx="0" cy="-14" rx="5" ry="2.4" fill="#C42F37"/></g>`);
      L.near.push(lamp(240, 240, 30, false));
    }

    function sceneTokyo() {
      // 후지산
      L.mtn.push(`<path d="M220 206 L300 128 Q312 118 324 128 L404 206Z" fill="${mix("#8EA4C8", haze, .3)}"/><path d="M286 142 L300 128 Q312 118 324 128 L338 142 L328 138 L320 146 L312 138 L304 146 L296 138Z" fill="#FBF8F6"/>`);
      // 붉은 철탑
      const tc = lit ? "#B54A3E" : "#E8574A";
      L.mtn.push(`<g stroke="${tc}" fill="none" stroke-linecap="round"><path d="M98 206 Q110 160 116 112 L118 64 M138 206 Q126 160 120 112 L118 64" stroke-width="2.6"/><path d="M104 176 h28 M110 140 h16" stroke-width="3"/>`
        + `<path d="M104 176 L132 150 M132 176 L104 150 M110 140 L126 112 M126 140 L110 112" stroke-width=".8"/><path d="M118 64 v-14" stroke-width="1.4"/></g><rect x="100" y="172" width="36" height="6" fill="#FFFDF8"/><rect x="108" y="137" width="20" height="5" fill="#FFFDF8"/>`);
      if (lit) for (let j = 0; j < 10; j++) L.light.push(`<circle cx="${f(108 + R() * 20 * (1 - j / 14))}" cy="${f(200 - j * 13)}" r="1.2" fill="#FFD28A" class="tw" style="animation-duration:${f(.8 + R())}s"/>`);
      L.mtn.push(skyline([[150, 14, 34], [166, 18, 26], [186, 12, 40], [0, 18, 30], [20, 22, 22], [44, 16, 38], [64, 20, 28]], 208, "#C6CCDA", "#3E4660"));
      grassGround(S.near, S.ground);
      // 도리이 (왼쪽 앞)
      L.ground.push(`<g transform="translate(52 300)"><rect x="-26" y="-62" width="5" height="62" fill="#D9363E"/><rect x="21" y="-62" width="5" height="62" fill="#D9363E"/><rect x="-24" y="-50" width="48" height="4" fill="#D9363E"/>`
        + `<path d="M-36 -66 Q0 -72 36 -66 L34 -60 Q0 -64 -34 -60Z" fill="#3A2E2B"/><rect x="-32" y="-60" width="64" height="4" fill="#D9363E"/><rect x="-3" y="-56" width="6" height="7" fill="#3A2E2B"/></g>`);
      // 제등 줄 + 마네키네코
      const chochin = `<ellipse cx="0" cy="13" rx="6" ry="8" fill="#FFF8EE"/><path d="M-5.6 10 q5.6 2 11.2 0 M-6 14 q6 2 12 0 M-5.6 18 q5.6 2 11.2 0" stroke="#E8D6C0" stroke-width=".7" fill="none"/><rect x="-3" y="4" width="6" height="2" fill="#2E2A2A"/><rect x="-3" y="20" width="6" height="2" fill="#2E2A2A"/><circle cx="0" cy="13" r="2.6" fill="#D9363E"/>`;
      lanternString(8, 12, 40, "#FFE2A0", chochin);
      L.ground.push(`<g transform="translate(128 306)"><ellipse cx="0" cy="2" rx="12" ry="2.4" fill="#2A1A10" opacity=".14"/><ellipse cx="0" cy="-8" rx="10" ry="9" fill="#FFFDF8"/><circle cx="0" cy="-20" r="8" fill="#FFFDF8"/>`
        + `<path d="M-7 -25 l1 -7 l5 4z M7 -25 l-1 -7 l-5 4z" fill="#FFFDF8"/><path d="M-5.6 -29 l.8 -3 l2.4 2z M5.6 -29 l-.8 -3 l-2.4 2z" fill="#FFB0C4"/><path d="M8 -18 q6 -8 2 -14" stroke="#FFFDF8" stroke-width="4" fill="none" stroke-linecap="round" class="swing" style="transform-origin:8px -18px"/>`
        + `<path d="M-3.4 -21 q1 1 2 0 M1.4 -21 q1 1 2 0" stroke="#3A2E2B" stroke-width=".9" fill="none"/><path d="M-1 -17.6 q1 1 2 0" stroke="#3A2E2B" stroke-width=".8" fill="none"/><rect x="-7" y="-14" width="14" height="3" rx="1.5" fill="#D9363E"/><circle cx="0" cy="-11" r="2" fill="#F2C14E"/><ellipse cx="0" cy="-5" rx="5" ry="3.4" fill="#F2C14E"/></g>`);
      sideForest([[22, 252, .55], [392, 270, .6]], (x0, y0, s) => smallBlossom(x0, y0, s));
      rgrad("cherry2", [[0, "#FFF2F6"], [.6, "#F8BDD0"], [1, "#E995B2"]], .32, .28, .85);
    }

    function sceneEgypt() {
      // 피라미드 세 개
      const pyr = (x0, w0, h0) => `<path d="M${x0 - w0} 214 L${x0} ${214 - h0} L${x0 + w0} 214Z" fill="${mix("#E9C48A", haze, .25)}"/><path d="M${x0} ${214 - h0} L${x0 + w0} 214 L${x0 + w0 * .2} 214Z" fill="${mix("#C99A5E", haze, .25)}"/>`
        + [...Array(6)].map((_, i) => `<path d="M${f(x0 - w0 * (i + 1) / 7)} ${f(214 - h0 * (1 - (i + 1) / 7))} H${f(x0 + w0 * (i + 1) / 7)}" stroke="#B88A50" stroke-width=".6" opacity=".5"/>`).join("");
      L.mtn.push(pyr(310, 70, 96) + pyr(380, 46, 62) + pyr(60, 52, 70));
      // 사막
      grad("far", [[0, "#F4D9A4"], [1, "#E8C080"]]);
      L.far.push(`<path d="M0 212 C80 204 160 216 240 208 S360 204 400 210 L400 320 L0 320Z" fill="${U("far")}"/>`);
      grad("ground", [[0, "#F2D196"], [1, "#E0B474"]]);
      L.ground.push(`<path d="M0 262 C100 252 300 252 400 262 L400 320 L0 320Z" fill="${U("ground")}"/>`);
      for (let j = 0; j < 30; j++) L.ground.push(`<circle cx="${f(R() * 400)}" cy="${f(266 + R() * 50)}" r="${f(.5 + R() * .8)}" fill="#B88A50" opacity=".4"/>`);
      // 스핑크스
      L.far.push(`<g transform="translate(326 240)"><ellipse cx="4" cy="1" rx="40" ry="3" fill="#8A6A3A" opacity=".18"/><path d="M-30 0 v-10 q0 -6 8 -6 h30 v-10 q0 -12 10 -12 q10 0 10 12 v26z" fill="#D9B276"/><path d="M-30 -2 q-8 0 -8 -6" stroke="#D9B276" stroke-width="3" fill="none" stroke-linecap="round"/>`
        + `<rect x="22" y="-5" width="20" height="5" rx="2.5" fill="#C9A066"/><path d="M6 -42 q12 -6 24 0 l4 22 h-32z" fill="#D6AE70"/><path d="M4.6 -36 h26.8 M3.4 -30 h29.2 M2.4 -24 h31.2" stroke="#5E86C2" stroke-width="1.4" opacity=".75"/>`
        + `<rect x="12" y="-38" width="12" height="16" rx="5" fill="#E6C48A"/><circle cx="15.6" cy="-31" r=".9" fill="#5A3A28"/><circle cx="20.4" cy="-31" r=".9" fill="#5A3A28"/><path d="M16 -26.4 q2 1 4 0" stroke="#5A3A28" stroke-width=".6" fill="none"/></g>`);
      // 오아시스 · 야자수 · 낙타
      L.ground.push(`<ellipse cx="60" cy="282" rx="40" ry="8" fill="#5FB8D8"/><ellipse cx="52" cy="280" rx="20" ry="2.4" fill="#fff" opacity=".4"/>`);
      const palm = (x0, y0, s) => {
        const k = (n) => f(n * s);
        let g = `<g transform="translate(${x0} ${y0})"><path d="M${k(-3)} 0 C${k(-2)} ${k(-30)} ${k(6)} ${k(-60)} ${k(4)} ${k(-80)} L${k(9)} ${k(-80)} C${k(10)} ${k(-60)} ${k(3)} ${k(-30)} ${k(4)} 0Z" fill="#B98455"/>`;
        for (const a of [-160, -120, -60, -20, -90]) { const r0 = a * Math.PI / 180; g += `<path d="M${k(6)} ${k(-80)} q${k(Math.cos(r0) * 20)} ${k(Math.sin(r0) * 20 - 10)} ${k(Math.cos(r0) * 34)} ${k(Math.sin(r0) * 34 + 8)}" stroke="#4C9F5C" stroke-width="${k(5)}" fill="none" stroke-linecap="round"/>`; }
        return g + "</g>";
      };
      L.ground.push(palm(24, 286, .8), palm(96, 290, .7));
      L.ground.push(`<g transform="translate(152 304)"><ellipse cx="0" cy="2" rx="22" ry="3" fill="#2A1A10" opacity=".14"/><path d="M-18 -16 q4 -14 12 -6 q6 -12 12 -2 h6 q4 -12 10 -10 l-2 6 q-4 0 -4 6 v8 h-34z" fill="#C99A5E"/>`
        + `<path d="M-14 -8 v10 M-6 -8 v10 M6 -8 v10 M14 -8 v10" stroke="#B0844E" stroke-width="3"/><circle cx="24" cy="-20" r=".9" fill="#3A2E2B"/><rect x="-8" y="-24" width="12" height="6" rx="2" fill="#D9363E"/><path d="M-8 -21 h12" stroke="#F2C14E" stroke-width="1"/></g>`);
    }

    function sceneRome() {
      // 콜로세움 (왼쪽 뒤)
      const st = lit ? "#7A6A72" : mix("#E2C9A0", haze, .2), sh = lit ? "#4A4250" : mix("#B89A70", haze, .2);
      let co = `<path d="M10 206 V144 Q90 124 170 144 V206Z" fill="${st}"/><path d="M120 206 V150 Q150 140 170 144 V206Z" fill="${sh}" opacity=".35"/><path d="M10 144 Q60 132 110 136 L104 128 Q60 124 16 136Z" fill="${st}"/>`;
      for (const [yy, hh] of [[152, 14], [170, 14], [188, 16]]) for (let xx = 16; xx < 166; xx += 12) co += `<path d="M${xx} ${yy + hh} v-${hh - 4} a4 4 0 0 1 8 0 v${hh - 4}z" fill="${lit ? "#FFD98A" : sh}" opacity="${lit ? .7 : .55}"/>`;
      L.mtn.push(co + `<path d="M10 150 h160 M10 168 h160 M10 186 h160" stroke="${sh}" stroke-width="1.4"/>`);
      if (lit) glowAt(90, 176, 40, "#FFD27A", .3);
      L.mtn.push(skyline([[260, 30, 30], [292, 24, 36], [318, 34, 26], [356, 28, 34]], 208, "#E8C9A0", "#4A4250").replace(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="([^"]+)"\/>/g, '<rect x="$1" y="$2" width="$3" height="$4" rx="2" fill="$5"/>'));
      paving(212, "#E8C8A4", "#D6AE84", "#C08A60");
      isle();
      // 분수
      L.ground.push(`<g transform="translate(146 300)"><ellipse cx="0" cy="0" rx="30" ry="8" fill="#E8DCC8"/><ellipse cx="0" cy="-2" rx="25" ry="5.6" fill="#7FC6E0"/><rect x="-4" y="-22" width="8" height="20" fill="#E8DCC8"/><ellipse cx="0" cy="-22" rx="10" ry="3" fill="#E8DCC8"/>`
        + `<path d="M0 -24 q-8 -10 -14 4 M0 -24 q8 -10 14 4 M0 -24 v-10" stroke="#BFE9F6" stroke-width="1.6" fill="none" class="tw" style="animation-duration:1.4s"/></g>`);
      // 민트색 스쿠터 · 젤라토
      L.ground.push(`<g transform="translate(66 300)"><ellipse cx="0" cy="2" rx="24" ry="3" fill="#2A1A10" opacity=".14"/><path d="M-18 -4 q0 -12 12 -12 h12 l6 -12 h4 l-5 12 q8 2 8 12z" fill="#8FD8C4"/><rect x="-10" y="-20" width="14" height="4" rx="2" fill="#5A4636"/>`
        + `<circle cx="-14" cy="-2" r="5" fill="#3E3A4A"/><circle cx="16" cy="-2" r="5" fill="#3E3A4A"/><path d="M14 -30 h6" stroke="#3E3A4A" stroke-width="1.6"/><circle cx="23" cy="-18" r="2" fill="#FFF3A6"/></g>`);
      L.ground.push(`<g transform="translate(104 308)"><path d="M-4 0 l4 -14 l4 14z" fill="#E9B05E"/><circle cx="-2" cy="-16" r="4.4" fill="#FFB0C4"/><circle cx="3" cy="-18" r="4.4" fill="#B8F27A"/><circle cx="0" cy="-23" r="4" fill="#FFF3D6"/></g>`);
      // 사이프러스
      const cyp = (x0, y0, s) => `<g transform="translate(${x0} ${y0})"><rect x="${f(-1.6 * s)}" y="${f(-6 * s)}" width="${f(3.2 * s)}" height="${f(7 * s)}" fill="#6E4A3A"/><path d="M0 ${f(-70 * s)} C${f(10 * s)} ${f(-50 * s)} ${f(10 * s)} ${f(-14 * s)} 0 ${f(-5 * s)} C${f(-10 * s)} ${f(-14 * s)} ${f(-10 * s)} ${f(-50 * s)} 0 ${f(-70 * s)}Z" fill="#3F7A55"/><path d="M-2 ${f(-60 * s)} C${f(3 * s)} ${f(-46 * s)} ${f(3 * s)} ${f(-24 * s)} -2 ${f(-12 * s)}" stroke="#5C9A6E" stroke-width="${f(2 * s)}" fill="none"/></g>`;
      L.near.push(cyp(196, 214, .7), cyp(250, 216, .6), cyp(392, 262, 1));
      sideForest([[14, 266, .9], [330, 258, .7]], (x0, y0, s) => cyp(x0, y0, s));
    }

    function sceneSydney() {
      water("harbour", 204, 36, "#8CCBE8", "#2F7EB6");
      // 오페라하우스 (왼쪽): 하얀 돛 지붕
      const ob = lit ? "#E8E2EE" : "#FFFFFF";
      L.mtn.push(`<rect x="12" y="198" width="140" height="10" fill="${mix("#E2C9A0", haze, .2)}"/>`
        + [[24, 30, 40], [52, 26, 46], [78, 22, 36], [104, 24, 30], [126, 18, 24]].map(([x0, w0, h0]) => `<path d="M${x0} 198 Q${x0 + w0 * .2} ${198 - h0} ${x0 + w0} ${198 - h0 * .85} Q${x0 + w0 * .7} ${198 - h0 * .3} ${x0 + w0 * .9} 198Z" fill="${ob}"/><path d="M${x0 + w0 * .4} ${198 - h0 * .6} L${x0 + w0 * .7} 198" stroke="#E2E6EE" stroke-width="1"/>`).join(""));
      if (lit) glowAt(80, 184, 40, "#FFE6B0", .4);
      // 하버 브리지 (오른쪽 뒤)
      const bc = lit ? "#4A5270" : mix("#8E9AAE", haze, .25);
      let br = `<path d="M200 206 Q300 120 400 206" stroke="${bc}" stroke-width="4" fill="none"/><path d="M206 200 Q300 132 394 200" stroke="${bc}" stroke-width="2" fill="none"/><rect x="180" y="190" width="220" height="4" fill="${bc}"/>`;
      for (let xx = 214; xx < 390; xx += 12) { const t = (xx - 200) / 200, yy = 206 - Math.sin(t * Math.PI) * 86; br += `<path d="M${xx} ${f(yy)} V190" stroke="${bc}" stroke-width=".8"/>`; }
      br += `<rect x="186" y="170" width="12" height="36" fill="${mix("#D8C8AA", haze, .2)}"/><rect x="384" y="170" width="12" height="36" fill="${mix("#D8C8AA", haze, .2)}"/>`;
      L.mtn.push(br);
      if (lit) for (let xx = 190; xx < 400; xx += 14) L.light.push(`<circle cx="${xx}" cy="190" r="1.2" fill="#FFE9A8" filter="url(#${id}glow)"/>`);
      L.far.push(`<g transform="translate(160 226)"><g class="paddle" style="animation-duration:22s"><path d="M-12 0 h24 l-4 5 h-16z" fill="#FFFDF8"/><path d="M0 -1 v-20 l11 18z" fill="#FFFDF8"/><path d="M-1 -1 v-14 l-8 12z" fill="#8FD0FA"/></g></g>`);
      grassGround(S.near, S.ground);
      // 캥거루 · 코알라
      L.ground.push(`<g transform="translate(66 300)"><ellipse cx="0" cy="2" rx="16" ry="2.4" fill="#2A1A10" opacity=".14"/><path d="M-8 0 q-4 -16 6 -24 q8 -4 10 6 q2 10 -4 18z" fill="#C98A56"/><path d="M-6 0 q-14 2 -24 -2" stroke="#C98A56" stroke-width="4" fill="none" stroke-linecap="round"/>`
        + `<circle cx="4" cy="-28" r="5.6" fill="#C98A56"/><path d="M1 -32 l-1 -8 l3 5z M6 -32 l1 -8 l1 6z" fill="#C98A56"/><circle cx="6" cy="-29" r=".8" fill="#3A2E2B"/><ellipse cx="9" cy="-26.6" rx="1.4" ry="1" fill="#3A2E2B"/>`
        + `<ellipse cx="2" cy="-12" rx="4" ry="5" fill="#E9C09A"/><circle cx="2" cy="-14" r="2.4" fill="#C98A56"/><circle cx="2" cy="-15" r=".6" fill="#3A2E2B"/></g>`);
      L.ground.push(`<g transform="translate(140 302)"><rect x="-2" y="-40" width="5" height="40" fill="#8A6A4E"/><g transform="translate(0 -30)"><ellipse cx="0" cy="0" rx="8" ry="9" fill="#A9A6B4"/><circle cx="0" cy="-10" r="7" fill="#A9A6B4"/>`
        + `<circle cx="-7" cy="-13" r="4" fill="#A9A6B4"/><circle cx="7" cy="-13" r="4" fill="#A9A6B4"/><circle cx="-7" cy="-13" r="2" fill="#F2D6DE"/><circle cx="7" cy="-13" r="2" fill="#F2D6DE"/>`
        + `<ellipse cx="0" cy="-8" rx="2.4" ry="3" fill="#3A2E2B"/><circle cx="-3.4" cy="-11" r=".8" fill="#3A2E2B"/><circle cx="3.4" cy="-11" r=".8" fill="#3A2E2B"/></g></g>`);
    }

    function sceneVenice() {
      // 양쪽 알록달록 건물 + 운하
      const fac = (x0, w0, h0, c) => {
        let g = `<rect x="${x0}" y="${236 - h0}" width="${w0}" height="${h0}" fill="${lit ? mix(c, "#2A2440", .55) : c}"/><rect x="${x0 - 2}" y="${236 - h0 - 4}" width="${w0 + 4}" height="4" fill="${lit ? "#3A3048" : "#B86A4A"}"/>`;
        for (let wy = 236 - h0 + 8; wy < 226; wy += 14) for (let wx = x0 + 4; wx < x0 + w0 - 6; wx += 10) g += `<path d="M${wx} ${wy + 9} v-6 a3 3 0 0 1 6 0 v6z" fill="${lit ? "#FFD98A" : "#5E6E86"}"/>`;
        return g + `<rect x="${x0 + 4}" y="${236 - h0 + 18}" width="${w0 - 8}" height="2.4" fill="#E86A82" opacity=".9"/>`;
      };
      L.mtn.push(fac(0, 34, 96, "#F2B78A") + fac(34, 30, 82, "#F4D28A") + fac(64, 34, 104, "#E8A0A8") + fac(98, 28, 78, "#E9C9A0")
        + fac(300, 30, 92, "#F4D28A") + fac(330, 36, 108, "#E8A0A8") + fac(366, 34, 86, "#F2B78A"));
      water("canal", 236, 50, "#7FC6CE", "#2F8A9E");
      // 리알토 같은 아치 다리 (가운데 뒤)
      L.far.push(`<path d="M120 236 Q214 176 308 236 L296 236 Q214 190 132 236Z" fill="${lit ? "#6A6070" : mix("#EFE2C8", haze, .2)}"/><path d="M180 212 h68 v-14 h-68z" fill="${lit ? "#5A5064" : mix("#E8D8BC", haze, .2)}"/>`
        + `${[188, 202, 216, 230].map((x0) => `<path d="M${x0} 212 v-8 a3 3 0 0 1 6 0 v8z" fill="${lit ? "#FFD98A" : "#B8A888"}"/>`).join("")}`);
      // 곤돌라 · 줄무늬 말뚝
      L.far.push(`<g transform="translate(110 262)"><g class="paddle" style="animation-duration:16s"><path d="M-30 0 Q-34 -8 -26 -4 Q0 4 26 -4 Q34 -8 30 0 Q0 8 -30 0Z" fill="#2E2A2A"/><rect x="-8" y="-6" width="14" height="4" rx="2" fill="#D9363E"/><path d="M20 -4 L28 -18" stroke="#8A6A4E" stroke-width="1.6"/><path d="M28 -18 l4 -2 v4z" fill="#2E2A2A"/></g></g>`);
      for (const [px0, c] of [[40, "#E8453E"], [52, "#3E7FC9"], [360, "#E8453E"], [372, "#3E7FC9"]]) L.far.push(`<rect x="${px0}" y="232" width="3.4" height="40" fill="#fff"/>${[0, 1, 2, 3].map((i) => `<rect x="${px0}" y="${234 + i * 10}" width="3.4" height="5" fill="${c}"/>`).join("")}`);
      // 앞 광장
      paving(282, "#E6D8C2", "#D2C2A8", "#B8A888");
      L.ground.push(`<ellipse cx="${X}" cy="${B + 6}" rx="56" ry="10" fill="#E6D8C2"/>`);
      isle();
      L.ground.push(`<g transform="translate(80 304)"><path d="M-8 0 h16 l-3 -12 h-10z" fill="#C9763A"/>${[[-5, -16], [0, -20], [5, -16]].map(([x0, y0]) => flower(x0, y0, 3.6, "#FF8FA3", "#FFE07A")).join("")}</g>`);
      if (lit) for (const px0 of [44, 364]) glowAt(px0, 240, 14, "#FFD27A", .4);
    }

    function sceneAlps() {
      // 뾰족한 봉우리 (오른쪽) + 산줄기
      L.mtn.push(`<path d="M0 200 L70 150 L120 186 L170 160 L230 196 Z" fill="${mix("#9AAFC6", haze, .4)}"/>`
        + `<path d="M230 206 L318 96 L340 120 L404 206Z" fill="${mix("#8496B0", haze, .25)}"/><path d="M300 118 L318 96 L340 120 L330 116 L322 126 L312 114 L306 122Z" fill="#FBF8F6"/><path d="M318 96 L340 120 L404 206 L360 206Z" fill="#000" opacity=".08"/>`
        + `<path d="M70 150 L84 160 L60 158Z M170 160 L182 170 L160 168Z" fill="#FBF8F6"/>`);
      grad("far", [[0, "#B8E08E"], [1, "#9ED07A"]]);
      L.far.push(`<path d="M0 214 C60 198 118 204 176 208 S300 194 400 204 L400 320 L0 320Z" fill="${U("far")}"/>`);
      // 빨간 산악열차 (천천히 지나간다)
      L.far.push(`<path d="M0 214 C60 208 118 212 176 212 S300 204 400 210" stroke="#8A7A6A" stroke-width="1.6" fill="none"/>`
        + `<g transform="translate(40 206)"><g class="paddle" style="animation-duration:30s">${[0, 26].map((dx) => `<g transform="translate(${dx} 0)"><rect x="-12" y="-12" width="24" height="12" rx="3" fill="#D9363E"/><rect x="-10" y="-10" width="20" height="5" rx="1" fill="${lit ? "#FFE6A8" : "#E8F2F8"}"/><circle cx="-6" cy="0" r="2" fill="#3E3A4A"/><circle cx="6" cy="0" r="2" fill="#3E3A4A"/></g>`).join("")}</g></g>`);
      grassGround(["#A8D886", "#8CC86E"], S.ground);
      // 샬레 (왼쪽)
      L.near.push(`<g transform="translate(70 250)"><ellipse cx="0" cy="2" rx="40" ry="4" fill="#4A2E1E" opacity=".12"/><rect x="-32" y="-34" width="64" height="34" fill="#B07C52"/><path d="M-42 -32 L0 -58 L42 -32Z" fill="#7A4F34"/><path d="M-42 -32 L0 -58 L42 -32" stroke="#FFFDF8" stroke-width="2" fill="none"/>`
        + `<rect x="-26" y="-26" width="12" height="10" fill="${lit ? "#FFE6A8" : "#CFE6F2"}"/><rect x="14" y="-26" width="12" height="10" fill="${lit ? "#FFE6A8" : "#CFE6F2"}"/><rect x="-6" y="-18" width="12" height="18" fill="#6E4630"/>`
        + `<rect x="-34" y="-14" width="68" height="3" fill="#8A5E3C"/>${[-30, -22, 18, 26].map((x0) => `<circle cx="${x0}" cy="-12" r="2.4" fill="#E8453E"/>`).join("")}</g>`);
      if (lit) glowAt(70, 230, 24, "#FFD27A", .5);
      // 워낭 단 젖소
      L.ground.push(`<g transform="translate(150 302)"><ellipse cx="0" cy="2" rx="22" ry="3" fill="#2A1A10" opacity=".14"/><rect x="-18" y="-22" width="32" height="16" rx="8" fill="#FFFDF8"/><circle cx="-8" cy="-16" r="4" fill="#3A2E2B"/><circle cx="6" cy="-20" r="3" fill="#3A2E2B"/>`
        + `<path d="M-14 -8 v10 M-6 -8 v10 M6 -8 v10 M12 -8 v10" stroke="#FFFDF8" stroke-width="3"/><ellipse cx="18" cy="-22" rx="7" ry="6" fill="#FFFDF8"/><ellipse cx="22" cy="-19" rx="4" ry="3" fill="#FFC2CE"/>`
        + `<path d="M14 -28 l-3 -4 M22 -28 l3 -4" stroke="#C9A066" stroke-width="1.6"/><circle cx="16" cy="-24" r=".8" fill="#3A2E2B"/><path d="M14 -16 v4" stroke="#8A6A4E" stroke-width=".8"/><path d="M12 -12 h4 l-1 4 h-2z" fill="#F2C14E"/></g>`);
      for (let j = 0; j < 16; j++) L.ground.push(flower(f(20 + R() * 360), f(276 + R() * 40), 2.6, ["#FFFFFF", "#FFE27A", "#C7A6F2"][j % 3], "#F2B705"));
      sideForest([[22, 252, .55], [392, 270, .66], [6, 272, .7]], (x0, y0, s) => smallFir(x0, y0, s));
    }

    /* =====================================================================
       한국 · 명절 · 기념일
       ===================================================================== */
    const board = (x0, y0, w0, t, bg, fg, size) => `<g transform="translate(${x0} ${y0})"><rect x="-1.6" y="0" width="3.2" height="22" fill="#7E5337"/><rect x="${-w0 / 2}" y="-16" width="${w0}" height="18" rx="4" fill="${bg}"/>`
      + `<rect x="${-w0 / 2}" y="-16" width="${w0}" height="4" rx="2" fill="#fff" opacity=".22"/>${textOn(0, -3.4, 0, t, fg, size || 9)}</g>`;

    function sceneBusan() {
      water("sea", 202, 50, "#8CCBE8", "#2F78B0");
      // 광안대교 (두 주탑 현수교)
      const bc = lit ? "#5A6078" : mix("#D8DEE8", haze, .2);
      let br = `<rect x="0" y="196" width="400" height="4" fill="${bc}"/>`;
      for (const tx of [140, 280]) br += `<rect x="${tx - 3}" y="150" width="6" height="52" fill="${bc}"/><rect x="${tx - 6}" y="156" width="12" height="3" fill="${bc}"/>`;
      br += `<path d="M0 186 Q70 196 140 152 Q210 190 280 152 Q350 196 400 186" stroke="${bc}" stroke-width="1.6" fill="none"/>`;
      for (let xx = 10; xx < 400; xx += 10) { if (Math.abs(xx - 140) < 4 || Math.abs(xx - 280) < 4) continue; br += `<path d="M${xx} 196 V${f(xx < 140 ? 186 - (xx / 140) * 28 + Math.pow(xx / 140, 6) * 0 : xx < 280 ? 152 + Math.sin((xx - 140) / 140 * Math.PI) * 34 : 152 + (xx - 280) / 120 * 34)}" stroke="${bc}" stroke-width=".5"/>`; }
      L.far.push(br);
      if (lit) { const rain = ["#FF8FA3", "#FFC36B", "#8EE29A", "#7FC8FF", "#B79CFF"]; for (let xx = 4; xx < 400; xx += 10) L.light.push(`<circle cx="${xx}" cy="197" r="1.4" fill="${rain[Math.floor(xx / 10) % 5]}" filter="url(#${id}glow)" class="tw" style="animation-duration:${f(1 + R())}s"/>`); }
      // 고층 빌딩 (오른쪽 뒤) + 감천문화마을 (왼쪽 언덕)
      L.mtn.push(skyline([[300, 16, 78], [318, 14, 92], [334, 18, 70], [354, 14, 86], [370, 20, 64], [392, 12, 74]], 200, "#C9D2E2", "#3E4660"));
      L.mtn.push(`<path d="M0 120 Q60 124 120 168 L150 200 L0 200Z" fill="${mix("#8AB08A", haze, .25)}"/>`);
      let gc = "";
      const pastel = ["#FFB0C4", "#FFE48A", "#8FD0FA", "#B8F27A", "#C7A6F2", "#FFC9A0", "#9FE3D8"];
      for (let row = 0; row < 5; row++) for (let col = 0; col < 7 - row; col++) {
        const hx = 4 + col * 16 + row * 4, hy = 130 + row * 14 + (col % 2) * 3;
        if (hx > 130) continue;
        gc += `<rect x="${hx}" y="${hy}" width="13" height="11" fill="${pastel[(row * 3 + col) % 7]}"/><rect x="${hx}" y="${hy}" width="13" height="2.4" fill="${["#5E8CC9", "#E86A6A", "#5EA86A"][(row + col) % 3]}"/>` + win(hx + 4, hy + 4.4, 3, 3.4, lit);
      }
      L.mtn.push(gc);
      // 해운대 모래사장
      grad("sand", [[0, "#F6E0B4"], [1, "#EAC78E"]]);
      L.near.push(`<path d="M0 256 C100 250 300 250 400 256 L400 320 L0 320Z" fill="${U("sand")}"/>`);
      L.near.push(`<g class="wave"><path d="M-20 256 ${[...Array(22)].map(() => "q10 -5 20 0").join(" ")}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/></g>`);
      isle();
      // 갈매기 · 어선 · 모래 위 하트
      for (let j = 0; j < 3; j++) L.sky.push(`<g transform="translate(${f(60 + j * 110)} ${f(80 + R() * 40)})"><g class="drift" style="animation-delay:-${f(R() * 9)}s"><path d="M-7 0 q3.5 -5 7 0 q3.5 -5 7 0" stroke="#FFFDF8" stroke-width="1.8" fill="none" stroke-linecap="round"/></g></g>`);
      L.far.push(`<g transform="translate(200 236)"><g class="bob" style="animation-duration:5s"><path d="M-14 0 h28 l-4 6 h-20z" fill="#3E7FC9"/><rect x="-6" y="-8" width="12" height="8" fill="#FFFDF8"/><path d="M8 -8 v-10" stroke="#8A6A4E" stroke-width="1.2"/><path d="M8 -18 l6 3 l-6 2" fill="#E8453E"/></g></g>`);
      L.ground.push(`<path d="M84 300 c-6 -8 -16 -2 -10 6 l10 8 l10 -8 c6 -8 -4 -14 -10 -6z" fill="none" stroke="#D2AE78" stroke-width="2" stroke-linecap="round"/>`);
      L.ground.push(`<g transform="translate(372 304)"><ellipse cx="0" cy="2" rx="24" ry="3" fill="#2A1A10" opacity=".12"/><path d="M0 0 L2 -44" stroke="#EDE3D6" stroke-width="2"/><path d="M-24 -36 Q2 -62 28 -46Z" fill="#8FD0FA"/><path d="M-24 -36 Q-6 -56 2 -44Z M8 -56 Q18 -54 28 -46 L2 -44Z" fill="#FFFDF8"/></g>`);
    }

    function sceneGyeongju() {
      // 왕릉 (둥근 초록 언덕들)
      L.mtn.push(`<path d="M0 200 Q50 170 100 186 T200 180 T300 186 T400 178 L400 240 L0 240Z" fill="${mix("#A6B896", haze, .4)}"/>`);
      for (const [mx, mw, mh] of [[60, 70, 36], [170, 56, 28], [300, 80, 40], [380, 50, 26]]) L.far.push(`<path d="M${mx - mw} 214 Q${mx} ${214 - mh * 2} ${mx + mw} 214Z" fill="${mix("#8EC26E", haze, .15)}"/><path d="M${mx - mw * .6} ${214 - mh * .7} Q${mx - mw * .2} ${214 - mh * 1.2} ${mx + mw * .1} ${214 - mh * .9}" stroke="#B8E09A" stroke-width="2" fill="none" opacity=".6"/>`);
      grassGround(S.near, S.ground);
      // 첨성대 (호리병 모양 돌탑)
      let cs = `<g transform="translate(76 262)"><ellipse cx="0" cy="2" rx="28" ry="4" fill="#4A2E1E" opacity=".14"/><rect x="-24" y="-6" width="48" height="6" fill="#B8A88E"/>`;
      for (let i = 0; i < 16; i++) {
        const t = i / 15, w0 = 20 - Math.sin(t * Math.PI * .9) * 3 - t * 9, y0 = -8 - i * 4.4;
        cs += `<rect x="${f(-w0)}" y="${f(y0)}" width="${f(w0 * 2)}" height="4" rx="1" fill="${i % 2 ? "#D6C8AC" : "#CBBB9C"}"/>`;
        for (let k = -w0 + 3; k < w0 - 2; k += 6) cs += `<path d="M${f(k)} ${f(y0)} v4" stroke="#B8A88E" stroke-width=".6"/>`;
      }
      cs += `<rect x="-5" y="-48" width="10" height="9" fill="#5A4636"/><rect x="-13" y="-82" width="26" height="4" fill="#B8A88E"/><rect x="-13" y="-88" width="26" height="4" fill="#C9B998"/><path d="M-13 -82 v-6 M13 -82 v-6" stroke="#9A8A70"/></g>`;
      L.ground.push(cs);
      // 유채꽃 · 돌등
      for (let j = 0; j < 40; j++) { const x0 = 110 + R() * 70, y0 = 252 + R() * 30; L.near.push(`<circle cx="${f(x0)}" cy="${f(y0)}" r="${f(3 + R() * 2)}" fill="${R() < .5 ? "#FFE24A" : "#F7CB33"}"/>`); }
      L.ground.push(`<g transform="translate(372 300)"><rect x="-3" y="-20" width="6" height="20" fill="#B8A88E"/><rect x="-9" y="-30" width="18" height="10" rx="1" fill="#C9B998"/><rect x="-4" y="-28" width="8" height="6" fill="${lit ? "#FFD98A" : "#8A7A62"}"/><path d="M-12 -30 L0 -38 L12 -30Z" fill="#9A8A70"/></g>`);
      if (lit) glowAt(372, 275, 10, "#FFD27A", .5);
      sideForest([[22, 252, .55], [392, 270, .6], [340, 252, .45]], (x0, y0, s) => smallBlossom(x0, y0, s));
      rgrad("cherry2", [[0, "#FFF2F6"], [.6, "#F8BDD0"], [1, "#E995B2"]], .32, .28, .85);
    }

    function sceneSeollal() {
      // 한옥 (눈 덮인 기와) + 복주머니 줄
      L.mtn.push(`<path d="M0 194 Q80 160 160 180 T320 172 T400 184 L400 240 L0 240Z" fill="${mix("#D6D2E2", haze, .35)}"/>`);
      grad("far", [[0, S.far[0]], [1, S.far[1]]]);
      L.far.push(`<path d="M0 214 C60 198 118 204 176 208 S300 194 400 204 L400 320 L0 320Z" fill="${U("far")}"/>`);
      const hanok = (x0, w0) => `<g transform="translate(${x0} 242)"><rect x="${-w0 / 2}" y="-30" width="${w0}" height="30" fill="#F4E6CE"/>${[...Array(5)].map((_, i) => `<rect x="${f(-w0 / 2 + 2 + i * (w0 - 4) / 4)}" y="-30" width="3" height="30" fill="#8A5E3C"/>`).join("")}`
        + `<rect x="${-w0 / 2 + 8}" y="-24" width="${w0 / 2 - 14}" height="14" fill="${lit ? "#FFE2A0" : "#FFF8E8"}" stroke="#8A5E3C"/><path d="M${-w0 / 2 - 14} -30 Q0 -40 ${w0 / 2 + 14} -30 L${w0 / 2 + 6} -44 Q0 -52 ${-w0 / 2 - 6} -44Z" fill="#4A4E5A"/>`
        + `<path d="M${-w0 / 2 - 8} -42 Q0 -54 ${w0 / 2 + 8} -42 L${w0 / 2 + 4} -46 Q0 -56 ${-w0 / 2 - 4} -46Z" fill="#FFFDF8"/><rect x="${-w0 / 2}" y="-2" width="${w0}" height="5" fill="#C9B998"/></g>`;
      L.near.push(hanok(64, 96), hanok(352, 80));
      if (lit) { glowAt(50, 226, 18, "#FFD27A", .5); glowAt(340, 226, 16, "#FFD27A", .5); }
      grassGround(S.near, S.ground);
      const pouch = `<path d="M-6 8 q-4 6 0 12 h12 q4 -6 0 -12z" fill="#E8453E"/><path d="M-4 8 h8" stroke="#F2C14E" stroke-width="2"/><path d="M-1 7 l1 -2 l1 2" stroke="#F2C14E" stroke-width="1" fill="none"/>${textOn(0, 17.4, 0, "福", "#F2C14E", 6)}`;
      lanternString(6, 12, 44, "#FFC870", pouch);
      // 연 날리기 · 까치
      L.fx.push(`<g transform="translate(310 66)"><g class="bob" style="animation-duration:5s"><path d="M0 -14 L12 0 L0 16 L-12 0Z" fill="#3E7FC9"/><path d="M0 -14 L0 16 M-12 0 L12 0" stroke="#fff" stroke-width=".8"/><circle r="4" fill="#E8453E"/><path d="M0 16 q-6 14 4 26 q-10 10 -2 22" stroke="#F2C14E" stroke-width="1.6" fill="none"/></g></g>`);
      L.fx.push(`<g transform="translate(96 60)"><g class="bob" style="animation-duration:6s;animation-delay:-2s"><path d="M-10 0 l10 -10 l10 10 l-10 10z" fill="#FFFDF8" stroke="#E8453E" stroke-width="1"/><path d="M0 10 q-4 14 2 24" stroke="#E8453E" stroke-width="1" fill="none"/></g></g>`);
      L.deco.push(`<g transform="translate(${X - 40} 150)"><ellipse cx="0" cy="0" rx="7" ry="4.4" fill="#2E2E3A"/><ellipse cx="2" cy="1" rx="4.6" ry="2.6" fill="#FFFDF8"/><circle cx="-6" cy="-3" r="3.4" fill="#2E2E3A"/><path d="M-9 -3 l-3 1 l3 1z" fill="#3A2E2B"/><path d="M6 -1 l10 -3 l-9 4z" fill="#2E5E8A"/><circle cx="-7" cy="-4" r=".6" fill="#fff"/></g>`);
      // 윷놀이 · 떡국 · 새해 인사
      L.ground.push(`<g transform="translate(76 300)"><ellipse cx="0" cy="0" rx="34" ry="8" fill="#D9363E" opacity=".9"/><ellipse cx="0" cy="-1" rx="30" ry="6" fill="#E85A50"/>`
        + `${[[-14, -4, -20], [-4, -2, 10], [6, -4, -6], [16, -2, 24]].map(([x0, y0, a]) => `<rect x="${x0 - 2}" y="${y0 - 8}" width="4" height="16" rx="2" fill="#E9C48A" transform="rotate(${a} ${x0} ${y0})"/>`).join("")}</g>`);
      L.ground.push(`<g transform="translate(196 310)"><ellipse cx="0" cy="0" rx="14" ry="5" fill="#FFFDF8"/><ellipse cx="0" cy="-2" rx="11" ry="3.4" fill="#F4ECD8"/>${[-5, -1, 3, 6].map((x0, i) => `<ellipse cx="${x0}" cy="${-2 + (i % 2)}" rx="2.4" ry="1.4" fill="#FFFFFF" stroke="#E6DCC4" stroke-width=".5"/>`).join("")}`
        + `<path d="M-4 -4 h3 M2 -3 h3" stroke="#F2C14E" stroke-width="1.2"/><path d="M-2 -8 q-2 -3 0 -6 M3 -8 q-2 -3 0 -6" stroke="#fff" stroke-width=".9" fill="none" opacity=".7" class="tw" style="animation-duration:2.2s"/></g>`);
      L.deco.push(board(282, 296, 112, "새해 복 많이 받으세요", "#D9363E", "#FFF6E4", 9));
    }

    function sceneChuseok() {
      // 큰 보름달 + 방아 찧는 달토끼
      L.sky.push(`<circle cx="300" cy="74" r="62" fill="#FFE2A0" opacity=".35" filter="url(#${id}blur)"/><circle cx="300" cy="74" r="40" fill="#FFF0C4"/><circle cx="282" cy="52" r="5" fill="#F4DCA0" opacity=".5"/><circle cx="320" cy="56" r="3.6" fill="#F4DCA0" opacity=".5"/>`
        // 달토끼: 서서 절굿공이를 들었다 놨다 한다
        + `<g transform="translate(298 80)" fill="#E6C47E" opacity=".85"><ellipse cx="-9" cy="15" rx="6" ry="2"/><ellipse cx="-10" cy="6" rx="7.4" ry="9"/><circle cx="-18" cy="10" r="2.6"/><circle cx="-7" cy="-7" r="5.6"/>`
        + `<ellipse cx="-11" cy="-17" rx="1.8" ry="6" transform="rotate(-14 -11 -17)"/><ellipse cx="-6.4" cy="-17.6" rx="1.8" ry="6" transform="rotate(-4 -6.4 -17.6)"/>`
        + `<path d="M2 8 h18 l-3 9 h-12z"/><ellipse cx="11" cy="8" rx="9" ry="2.2"/>`
        + `<g class="bob" style="animation-duration:1.2s"><path d="M-4 0 L9 -6" stroke="#E6C47E" stroke-width="3" stroke-linecap="round"/><rect x="9.4" y="-14" width="3.2" height="22" rx="1.6"/><rect x="8" y="-16" width="6" height="4" rx="1.4"/></g></g>`);
      // 황금 들판 + 볏단 + 허수아비
      L.mtn.push(`<path d="M0 196 Q80 170 160 186 T320 178 T400 190 L400 240 L0 240Z" fill="${mix("#7E8EA8", haze, .35)}"/>`);
      grad("far", [[0, "#E9C460"], [1, "#D9A844"]]);
      L.far.push(`<path d="M0 214 C60 200 118 206 176 208 S300 196 400 206 L400 320 L0 320Z" fill="${U("far")}"/>`);
      for (let j = 0; j < 40; j++) L.far.push(`<path d="M${f(R() * 400)} ${f(212 + R() * 28)} q1 -4 3 -5" stroke="#F4DA88" stroke-width="1.4" fill="none" opacity=".8"/>`);
      grassGround(["#D8B85A", "#C9A448"], ["#C7A04E", "#A9843A"]);
      for (const bx of [40, 70, 340]) L.near.push(`<g transform="translate(${bx} 256)"><path d="M-8 0 L0 -26 L8 0Z" fill="#E9C460"/><path d="M-8 0 L0 -26 L8 0" stroke="#C9A448" fill="none"/><path d="M-6 -10 h12" stroke="#8A6A3A" stroke-width="2"/></g>`);
      L.near.push(`<g transform="translate(120 252)"><path d="M0 0 v-34 M-14 -24 h28" stroke="#8A6A3A" stroke-width="2.4"/><circle cx="0" cy="-38" r="6" fill="#F4E6CE"/><path d="M-9 -42 q9 -10 18 0z" fill="#D9A844"/><rect x="-8" y="-28" width="16" height="16" rx="2" fill="#5E8CC9"/>`
        + `<circle cx="-2" cy="-38" r=".8" fill="#3A2E2B"/><circle cx="2" cy="-38" r=".8" fill="#3A2E2B"/><path d="M-2 -35 q2 1.4 4 0" stroke="#3A2E2B" stroke-width=".7" fill="none"/><path d="M-14 -24 l-3 4 M14 -24 l3 4" stroke="#D9A844" stroke-width="2"/></g>`);
      // 청사초롱 · 송편 · 인사 팻말
      const chosa = `<rect x="-4" y="5" width="8" height="2" fill="#C9963A"/><rect x="-5.4" y="7" width="10.8" height="7" fill="#3E7FC9"/><rect x="-5.4" y="14" width="10.8" height="7" fill="#D9363E"/><rect x="-4" y="21" width="8" height="2" fill="#C9963A"/>`;
      lanternString(6, 14, 50, "#FFC870", chosa);
      L.ground.push(`<g transform="translate(80 304)"><ellipse cx="0" cy="0" rx="24" ry="7" fill="#C99566"/><ellipse cx="0" cy="-2" rx="20" ry="5" fill="#E9C48A"/>`
        + `${[[-10, -4, "#FFFDF8"], [-2, -6, "#FFB0C4"], [6, -4, "#B8E08A"], [-6, -1, "#FFE48A"], [4, -1, "#FFFDF8"], [12, -2, "#C7A6F2"]].map(([x0, y0, c]) => `<path d="M${x0 - 4} ${y0} a4 3.4 0 0 1 8 0z" fill="${c}"/>`).join("")}<path d="M-16 -4 q2 -3 4 0" stroke="#5E9E4E" stroke-width="1.6" fill="none"/></g>`);
      L.deco.push(board(284, 296, 92, "풍성한 한가위", "#3E7FC9", "#FFF6E4", 9.5));
      if (lit) catenary(12, 214, 168, 216, 8, 9, ["#FFD86A", "#FFF2B0", "#FFB870"]);
    }

    function sceneHangul() {
      // 궁궐 문 (세 칸 아치) + 산
      L.mtn.push(`<path d="M0 192 Q50 150 104 168 Q150 120 214 142 Q270 118 320 160 Q370 150 400 172 L400 240 L0 240Z" fill="${mix("#8EA492", haze, .35)}"/>`);
      const gc = mix("#E2DCD0", haze, .15);
      L.far.push(`<g transform="translate(90 214)"><rect x="-74" y="-26" width="148" height="26" fill="${gc}"/>${[-44, 0, 44].map((x0) => `<path d="M${x0 - 12} 0 v-14 a12 12 0 0 1 24 0 v14z" fill="${lit ? "#FFD98A" : "#6E5A4A"}"/>`).join("")}`
        + `<rect x="-60" y="-46" width="120" height="20" fill="#B5332E"/><rect x="-60" y="-50" width="120" height="5" fill="#3E8A7A"/><path d="M-80 -50 Q0 -60 80 -50 L70 -64 Q0 -74 -70 -64Z" fill="#3E4450"/>`
        + `<rect x="-14" y="-44" width="28" height="12" fill="#2E2A3A"/>${textOn(0, -35, 0, "광화문", "#F2C14E", 7)}</g>`);
      if (lit) glowAt(90, 200, 30, "#FFD27A", .3);
      paving(214, "#E2DCD0", "#CFC6B6", "#BDB3A2");
      isle();
      // 하늘에 떠다니는 한글 자모
      const JAMO = ["ㄱ", "ㄴ", "ㄷ", "ㅎ", "ㅏ", "ㅗ", "ㅁ", "ㅅ", "ㅇ", "ㅣ", "ㄹ", "ㅜ"], cols = ["#E8453E", "#3E7FC9", "#F2A33A", "#5EA86A", "#9A6AD0", "#E8509A"];
      for (let j = 0; j < 12; j++) {
        const jx = 30 + (j % 6) * 64 + R() * 20, jy = 40 + Math.floor(j / 6) * 50 + R() * 20;
        L.fx.push(`<g transform="translate(${f(jx)} ${f(jy)})"><g class="bob" style="animation-duration:${f(3 + R() * 3)}s;animation-delay:-${f(R() * 3)}s">${textOn(0, 0, f((R() - .5) * 30), JAMO[j], cols[j % 6], 20)}</g></g>`);
      }
      // 한글 자모 깃발 줄
      let flags = `<path d="M-4 4 Q200 34 404 4" stroke="#8A6A5A" stroke-width="1" fill="none"/>`;
      for (let x0 = 14, i = 0; x0 < 400; x0 += 30, i++) { const y0 = +sagY(x0, 4, 15); flags += `<rect x="${x0}" y="${y0}" width="18" height="18" fill="${["#FFFDF8", "#FFE6EC", "#E4F1FF"][i % 3]}" stroke="#D8CCC0" stroke-width=".6"/>${textOn(x0 + 9, y0 + 13.6, 0, ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하"][i % 14], "#5A4636", 11)}`; }
      L.fx.push(flags);
      // 훈민정음 책 · 붓 · 벼루
      L.ground.push(`<g transform="translate(74 300)"><ellipse cx="0" cy="3" rx="34" ry="4" fill="#2A1A10" opacity=".14"/><path d="M-30 0 L-30 -26 Q-15 -30 0 -24 Q15 -30 30 -26 L30 0 Q15 -4 0 2 Q-15 -4 -30 0Z" fill="#F6EBD2"/>`
        + `<path d="M0 -24 V2" stroke="#C9B998"/>${[0, 1, 2].map((r) => `<path d="M-24 ${-18 + r * 6} h18 M6 ${-18 + r * 6} h18" stroke="#5A4636" stroke-width="1" stroke-dasharray="3 2"/>`).join("")}${textOn(-15, -20, 0, "훈민정음", "#5A4636", 5.4)}</g>`);
      L.ground.push(`<g transform="translate(200 310)"><rect x="-12" y="-6" width="24" height="8" rx="2" fill="#3A3448"/><ellipse cx="-4" cy="-4" rx="6" ry="2.4" fill="#1E1A26"/><path d="M6 -6 L22 -24" stroke="#8A5E3C" stroke-width="2.4" stroke-linecap="round"/><path d="M6 -6 l-3 3 l2 -6z" fill="#2E2A2A"/></g>`);
      L.deco.push(board(288, 296, 84, "한글날", "#3E8A7A", "#FFF6E4", 11));
    }

    function sceneNewYear() {
      // 동해 바다 해돋이 (해가 낮을 땐 수평선에서 떠오른다)
      water("sea", 200, 56, "#9ACAE6", "#2F70A8");
      if (hour < 9 && hour > 5) {
        const ry = 200 - (hour - 5.6) * 22;
        L.mtn.push(`<circle cx="200" cy="${f(ry)}" r="70" fill="#FFB27A" opacity=".45" filter="url(#${id}blur)"/><circle cx="200" cy="${f(ry)}" r="24" fill="#FF8A4A"/>`);
        L.far.push(`<rect x="186" y="202" width="28" height="50" fill="#FFB27A" opacity=".5" filter="url(#${id}blur)"/>`);
      }
      L.mtn.push(`<path d="M300 204 Q312 180 328 188 Q340 176 352 204Z" fill="${mix("#5E6E5E", haze, .3)}"/><path d="M326 186 q-6 -10 2 -18 q8 6 0 18" fill="#3F7A55"/>`);
      // 종각 (왼쪽): 기와지붕 + 큰 종
      L.near.push(`<g transform="translate(64 256)"><ellipse cx="0" cy="2" rx="40" ry="4" fill="#4A2E1E" opacity=".14"/><rect x="-34" y="-6" width="68" height="6" fill="#C9B998"/>${[-28, -10, 8, 26].map((x0) => `<rect x="${x0}" y="-46" width="4" height="40" fill="#B5332E"/>`).join("")}`
        + `<rect x="-34" y="-50" width="68" height="5" fill="#3E8A7A"/><path d="M-46 -50 Q0 -58 46 -50 L38 -62 Q0 -70 -38 -62Z" fill="#3E4450"/>`
        + `<path d="M-10 -40 h20 q2 0 2 3 v14 q0 4 -12 4 q-12 0 -12 -4 v-14 q0 -3 2 -3z" fill="#B88A44"/><path d="M-10 -32 h20" stroke="#8A6A34" stroke-width="1"/><circle cx="0" cy="-26" r="2.4" fill="#8A6A34"/></g>`);
      grad("sand", [[0, "#EAD6B0"], [1, "#D9BE8E"]]);
      L.near.push(`<path d="M0 258 C100 252 300 252 400 258 L400 320 L0 320Z" fill="${U("sand")}"/>`);
      L.near.push(`<g class="wave"><path d="M-20 258 ${[...Array(22)].map(() => "q10 -5 20 0").join(" ")}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/></g>`);
      isle();
      // 밤엔 불꽃놀이, 새해 인사
      if (lit) fireworks([[86, 58, "#FFD86A", 0], [332, 52, "#FF8FA3", 1.2], [256, 24, "#8FD0FA", 2.1]]);
      const now = new Date(), year = o.year || (now.getMonth() === 0 ? now.getFullYear() : now.getFullYear() + 1);   // 1월이면 올해, 12월 말이면 다음 해
      L.deco.push(board(284, 296, 100, `${year} 새해 복`, "#E8453E", "#FFF6E4", 9.5));
      L.ground.push(`<g transform="translate(200 308)"><circle r="7" fill="#FFF4D6"/><path d="M-7 0 h14" stroke="#E8C48A" stroke-width="1"/><path d="M-3 -4 l3 -4 l3 4" stroke="#E8453E" stroke-width="1.4" fill="none"/></g>`);
    }

    function sceneSweet() {
      // 분홍 하늘에 떠다니는 하트
      for (let j = 0; j < 9; j++) {
        const hx = 20 + R() * 360, hy = 30 + R() * 140, s0 = .6 + R() * .9;
        L.sky.push(`<g transform="translate(${f(hx)} ${f(hy)}) scale(${f(s0)})"><g class="bob" style="animation-duration:${f(3 + R() * 3)}s;animation-delay:-${f(R() * 3)}s"><path d="M0 8 C-14 -3 -9 -18 0 -9 C9 -18 14 -3 0 8Z" fill="${["#FF8FA3", "#FFB0C4", "#FFFFFF"][j % 3]}" opacity=".85"/></g></g>`);
      }
      L.mtn.push(`<path d="M0 196 Q80 170 160 186 T320 178 T400 190 L400 240 L0 240Z" fill="${mix("#E8B4CC", haze, .35)}"/>`);
      paving(214, "#FBE4EC", "#F2CCDA", "#E8AFC4");
      isle();
      // 초콜릿 가게 (왼쪽)
      L.near.push(`<g transform="translate(70 262)"><rect x="-56" y="-46" width="112" height="46" fill="#FFF4F0"/><path d="M-60 -46 h120 v-8 h-120z" fill="#E86A8A"/>${[...Array(12)].map((_, i) => `<path d="M${-60 + i * 10} -46 q5 6 10 0" fill="${i % 2 ? "#E86A8A" : "#FFFFFF"}"/>`).join("")}`
        + `<rect x="-50" y="-36" width="44" height="28" rx="2" fill="${lit ? "#FFE6C0" : "#FDE8F0"}" stroke="#E8AFC4"/>${[[-42, -28], [-32, -28], [-22, -28], [-37, -18], [-27, -18]].map(([x0, y0]) => `<rect x="${x0 - 4}" y="${y0 - 4}" width="8" height="8" rx="1.6" fill="#7A4A32"/><path d="M${x0 - 2} ${y0} h4" stroke="#C98A6A" stroke-width=".8"/>`).join("")}`
        + `<rect x="8" y="-36" width="18" height="36" rx="2" fill="#B86A7A"/><circle cx="22" cy="-18" r="1.2" fill="#F2C14E"/><rect x="-40" y="-60" width="80" height="12" rx="3" fill="#7A4A32"/>${textOn(0, -51, 0, "달콤한 가게", "#FFE6EC", 8)}</g>`);
      if (lit) glowAt(42, 240, 22, "#FFD2A0", .5);
      // 하트 초콜릿 상자 · 사탕 병 · 마카롱 탑
      L.ground.push(`<g transform="translate(150 306)"><path d="M0 6 C-20 -8 -14 -28 0 -16 C14 -28 20 -8 0 6Z" fill="#D9363E"/><path d="M0 2 C-14 -8 -10 -22 0 -13 C10 -22 14 -8 0 2Z" fill="#7A4A32"/><path d="M-14 -14 L14 -2 M14 -14 L-14 -2" stroke="#F2C14E" stroke-width="2"/><circle cx="0" cy="-8" r="3" fill="#F2C14E"/></g>`);
      L.ground.push(`<g transform="translate(108 306)"><rect x="-10" y="-26" width="20" height="26" rx="5" fill="#E8F6FF" opacity=".85" stroke="#C6E2F2"/><rect x="-8" y="-30" width="16" height="5" rx="1.6" fill="#FF8FA3"/>`
        + `${[[-4, -6, "#FF8FA3"], [3, -8, "#FFE48A"], [-2, -14, "#8FD0FA"], [4, -17, "#B8F27A"], [-4, -21, "#C7A6F2"]].map(([x0, y0, c]) => `<circle cx="${x0}" cy="${y0}" r="3" fill="${c}"/>`).join("")}</g>`);
      L.ground.push(`<g transform="translate(260 306)">${[["#FFB0C4", 0], ["#B8F27A", -7], ["#FFE48A", -14], ["#C7A6F2", -21]].map(([c, y0], i) => `<ellipse cx="0" cy="${y0}" rx="${9 - i}" ry="3" fill="${c}"/><ellipse cx="0" cy="${y0 + 2}" rx="${8 - i}" ry="1.2" fill="#FFF8EE"/><ellipse cx="0" cy="${y0 + 4}" rx="${9 - i}" ry="3" fill="${c}"/>`).join("")}</g>`);
      bunting(4, 10, ["#FF8FA3", "#FFFFFF", "#FFB0C4", "#E86A8A"]);
    }

    /* ---------- 아기자기한 열매 · 꽃 ---------- */
    rgrad("apple", [[0, "#FFA3A0"], [.55, "#EE4F55"], [1, "#BE2C3E"]], .35, .3, .8);
    rgrad("kaki", [[0, "#FFD38A"], [.55, "#F49A36"], [1, "#DD6514"]], .35, .3, .8);
    rgrad("cherry", [[0, "#FF8A96"], [.6, "#D82A4A"], [1, "#9E1236"]], .35, .3, .8);
    function flower(x, y, r, petal, mid, edge) {
      let s = "";
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i / 5 * Math.PI * 2;
        s += `<circle cx="${f(x + Math.cos(a) * r * .58)}" cy="${f(y + Math.sin(a) * r * .58)}" r="${f(r * .52)}" fill="${petal}"${edge ? ` stroke="${edge}" stroke-width=".5"` : ""}/>`;
      }
      return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .3)}" fill="${mid}"/>`;
    }
    const drop = (x, y, r) => `<circle cx="${f(x + .9)}" cy="${f(y + 1.6)}" r="${r}" fill="#3A2416" opacity=".14"/>`;
    const FRUIT = {
      apple: (x, y) => drop(x, y, 5) + `<path d="M${x} ${f(y - 4.6)} q.6 -3 2.4 -3.8" stroke="#7A5338" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
        + `<path d="M${f(x + 1.4)} ${f(y - 6.4)} c2.5 -2.2 5.4 -1.4 5.6 .2 c-2.2 1.6 -4.6 1.4 -5.6 -.2z" fill="#72C25E"/>`
        + `<path d="M${f(x - 5)} ${f(y - .5)} C${f(x - 5.4)} ${f(y - 5.5)} ${f(x - 1)} ${f(y - 5.8)} ${x} ${f(y - 4.2)} C${f(x + 1)} ${f(y - 5.8)} ${f(x + 5.4)} ${f(y - 5.5)} ${f(x + 5)} ${f(y - .5)} C${f(x + 4.6)} ${f(y + 4.4)} ${f(x + 1.4)} ${f(y + 5.4)} ${x} ${f(y + 4.6)} C${f(x - 1.4)} ${f(y + 5.4)} ${f(x - 4.6)} ${f(y + 4.4)} ${f(x - 5)} ${f(y - .5)}Z" fill="${U("apple")}"/>`
        + `<ellipse cx="${f(x - 2.2)}" cy="${f(y - 1.6)}" rx="1.3" ry="2" fill="#fff" opacity=".8" transform="rotate(20 ${f(x - 2.2)} ${f(y - 1.6)})"/>`,
      cherry: (x, y) => drop(x, y + 3, 4) + `<path d="M${f(x - 3)} ${f(y + 1)} Q${f(x - 1)} ${f(y - 6)} ${f(x + 1)} ${f(y - 9)} M${f(x + 3.5)} ${f(y + 2)} Q${f(x + 2.6)} ${f(y - 5)} ${f(x + 1)} ${f(y - 9)}" stroke="#5E8A3A" stroke-width="1" fill="none"/>`
        + `<path d="M${f(x + 1)} ${f(y - 9)} c2 -2.4 5 -1.6 5.4 -.2 c-2 1.4 -4.4 1.4 -5.4 .2z" fill="#72C25E"/>`
        + `<circle cx="${f(x - 3)}" cy="${f(y + 2.5)}" r="3.3" fill="${U("cherry")}"/><circle cx="${f(x + 3.5)}" cy="${f(y + 3.5)}" r="3.3" fill="${U("cherry")}"/>`
        + `<circle cx="${f(x - 4)}" cy="${f(y + 1.4)}" r=".9" fill="#fff" opacity=".85"/><circle cx="${f(x + 2.5)}" cy="${f(y + 2.4)}" r=".9" fill="#fff" opacity=".85"/>`,
      kaki: (x, y) => drop(x, y, 5.4) + `<ellipse cx="${x}" cy="${f(y + .4)}" rx="5.6" ry="5" fill="${U("kaki")}"/>`
        + [0, 90, 180, 270].map((a) => `<ellipse cx="${x}" cy="${f(y - 4.6)}" rx="2.6" ry="1.1" fill="#5F8A3E" transform="rotate(${a + 45} ${x} ${f(y - 4.6)})"/>`).join("")
        + `<rect x="${f(x - .5)}" y="${f(y - 7.4)}" width="1" height="2.6" fill="#6B4A2E"/><ellipse cx="${f(x - 2.2)}" cy="${f(y - .8)}" rx="1.4" ry="1.9" fill="#fff" opacity=".65"/>`,
      blossom: (x, y) => flower(x, y, 5, "#FFF8FA", "#FFD86B", "#F4B1C6") + `<circle cx="${f(x - 1.4)}" cy="${f(y - 1.2)}" r=".5" fill="#E8879F"/><circle cx="${f(x + 1.2)}" cy="${f(y + 1)}" r=".5" fill="#E8879F"/>`,
      pumpkin: (x, y) => drop(x, y, 5) + `<ellipse cx="${f(x - 2.6)}" cy="${y}" rx="3.4" ry="4.4" fill="#E8762A"/><ellipse cx="${f(x + 2.6)}" cy="${y}" rx="3.4" ry="4.4" fill="#E8762A"/><ellipse cx="${x}" cy="${y}" rx="3.4" ry="4.8" fill="#F58A35"/>`
        + `<path d="M${x} ${f(y - 4.4)} q.6 -2.4 2 -2.8" stroke="#5E7A3A" stroke-width="1.2" fill="none"/>`
        + `<path d="M${f(x - 2.6)} ${f(y - 1)} l1 -1.4 l1 1.4z M${f(x + .6)} ${f(y - 1)} l1 -1.4 l1 1.4z M${f(x - 2.4)} ${f(y + 1.6)} q2.4 2 4.8 0" fill="${lit ? "#FFE48A" : "#7A3A12"}" stroke="${lit ? "none" : "#7A3A12"}" stroke-width=".5"/>`,
      lantern: (x, y) => `<path d="M${x} ${f(y - 9)} v3" stroke="#5A4A4A" stroke-width=".7"/><rect x="${f(x - 2)}" y="${f(y - 6)}" width="4" height="1.4" fill="#C9963A"/><ellipse cx="${x}" cy="${y}" rx="4.4" ry="5.2" fill="#E8453E"/>`
        + `<ellipse cx="${f(x - 1.4)}" cy="${f(y - 1.6)}" rx="1.2" ry="2" fill="#fff" opacity=".3"/><rect x="${f(x - 2)}" y="${f(y + 4.6)}" width="4" height="1.4" fill="#C9963A"/>`
        + `<circle cx="${x}" cy="${y}" r="7" fill="#FFB45A" opacity=".35" filter="url(#${id}soft)"/>`,
      bud: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.2" fill="#F4A0BC"/><path d="M${f(x - 2)} ${f(y + 2)} q2 2 4 0" stroke="#7DBA6A" stroke-width="1.2" fill="none"/>`,
      berry: (x, y) => `<path d="M${f(x - 8)} ${f(y - 2)} l3 -2 l2 1.6 l2.4 -2.4 l1.6 2.6 z" fill="#3F8F5A"/><path d="M${f(x + 8)} ${f(y - 2)} l-3 -2 l-2 1.6 l-2.4 -2.4 l-1.6 2.6 z" fill="#3F8F5A"/>`
        + `<circle cx="${f(x - 1.8)}" cy="${f(y)}" r="2.4" fill="#E23B4A"/><circle cx="${f(x + 1.8)}" cy="${f(y)}" r="2.4" fill="#E23B4A"/><circle cx="${x}" cy="${f(y + 2.6)}" r="2.4" fill="#E23B4A"/>`
        + `<circle cx="${f(x - 2.4)}" cy="${f(y - .7)}" r=".7" fill="#fff" opacity=".85"/>`,
    };

    /* ---------- 큰 나무 ---------- */
    const X = 214, B = 266;
    ({ lake: sceneLake, hanriver: sceneHanRiver, valley: sceneValley, beach: sceneBeach, halloween: sceneHalloween, london: sceneLondon, park: scenePark, market: sceneMarket, seattle: sceneSeattle,
       cabin: sceneCabin, jeju: sceneJeju, paris: sceneParis, santorini: sceneSantorini, palace: scenePalace, sunflower: sceneSunflower,
       aurora: sceneAurora, space: sceneSpace, undersea: sceneUndersea,
       newyork: sceneNewYork, tokyo: sceneTokyo, egypt: sceneEgypt, rome: sceneRome, sydney: sceneSydney, venice: sceneVenice, alps: sceneAlps,
       busan: sceneBusan, gyeongju: sceneGyeongju, seollal: sceneSeollal, chuseok: sceneChuseok, hangul: sceneHangul, newyear: sceneNewYear, sweet: sceneSweet })[scene]();
    ({ london: extrasLondon, hanriver: extrasHanRiver, beach: extrasBeach, valley: extrasValley, halloween: extrasHalloween }[scene] || (() => {}))();
    grad("trunk", [[0, "#7E5238"], [.32, "#B58360"], [.6, "#94653F"], [1, "#664129"]], 1, 0);
    rgrad("leaf", [[0, S.leaf[0]], [.5, S.leaf[1]], [1, S.leaf[2]]], .3, .26, .9);
    grad("sprout", [[0, S.sprout[0]], [1, S.sprout[1]]]);
    // 잎 덩어리 전체에 덮는 빛과 그늘 (위 왼쪽 밝게, 아래 오른쪽 어둡게)
    grad("vol", [[0, "#FFFBEF", .32], [.42, "#FFFFFF", 0], [.78, S.leaf[3], .16], [1, S.leaf[3], .5]], .35, 1);
    const shadow = (rx) => `<ellipse cx="${X + 6}" cy="${B + 3}" rx="${rx}" ry="${f(rx * .16)}" fill="#4A2E1E" opacity=".16" filter="url(#${id}soft)"/>`;
    if (xmas && o.stage >= 2) drawXmas();
    else if (o.stage <= 1) drawSprout();
    else drawTree();

    function leafPath(x, y, len, ang, fill) {
      return `<path d="M0 0 C${f(len * .3)} ${f(-len * .4)} ${f(len * .8)} ${f(-len * .4)} ${len} 0 C${f(len * .8)} ${f(len * .32)} ${f(len * .3)} ${f(len * .32)} 0 0Z" fill="${fill}" transform="translate(${f(x)} ${f(y)}) rotate(${ang})"/>`
        + `<path d="M${f(len * .1)} 0 L${f(len * .85)} 0" stroke="#fff" stroke-opacity=".35" stroke-width="1" transform="translate(${f(x)} ${f(y)}) rotate(${ang})"/>`;
    }
    function drawSprout() {
      L.tree.push(shadow(30));
      L.tree.push(`<ellipse cx="${X}" cy="${B}" rx="26" ry="8" fill="#8B5E3C"/><ellipse cx="${X}" cy="${B - 2}" rx="22" ry="5" fill="#AE7D55"/><ellipse cx="${X - 6}" cy="${B - 3}" rx="8" ry="1.6" fill="#fff" opacity=".18"/>`);
      let g = `<g class="sway" style="transform-origin:${X}px ${B}px">`;
      if (o.stage === 0) {
        g += `<ellipse cx="${X}" cy="${B - 5}" rx="6" ry="4.5" fill="#C99A68"/><path d="M${X} ${B - 8} q-1 -9 1 -14" stroke="${S.sprout[1]}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        g += leafPath(X + 1, B - 21, 11, -150, U("sprout")) + leafPath(X + 1, B - 21, 11, -30, U("sprout"));
        if (o.season === "spring") g += FRUIT.bud(X + 1, B - 25);
      } else {
        g += `<path d="M${X} ${B - 4} C${X - 4} ${B - 22} ${X + 5} ${B - 34} ${X} ${B - 50}" stroke="${S.sprout[1]}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
        g += leafPath(X - 1, B - 24, 16, -160, U("sprout")) + leafPath(X + 1, B - 30, 17, -20, U("sprout"));
        g += leafPath(X, B - 48, 15, -130, U("sprout")) + leafPath(X, B - 48, 15, -50, U("sprout"));
        if (o.season === "spring") g += FRUIT.blossom(X, B - 53);
        if (o.season === "autumn") g += leafPath(X + 1, B - 30, 17, -20, "#F2A34A");
      }
      if (winter) g += `<ellipse cx="${X - 9}" cy="${B - 27}" rx="6" ry="2.2" fill="#fff"/><ellipse cx="${X + 10}" cy="${B - 33}" rx="6" ry="2.2" fill="#fff"/>`;
      L.tree.push(g + "</g>");
      if (winter) L.tree.push(`<ellipse cx="${X}" cy="${B - 3}" rx="24" ry="4" fill="#fff" opacity=".95"/>`);
    }

    function drawTree() {
      const st = Math.min(o.stage, 5);
      const T0 = { 2: { h: 66, w0: 10, w1: 5, cy: 190, scale: .6, k: 1.08 }, 3: { h: 104, w0: 17, w1: 8, cy: 142, scale: .9, k: 1.12 },
                   4: { h: 126, w0: 28, w1: 12, cy: 126, scale: 1.08, k: 1.1 }, 5: { h: 128, w0: 30, w1: 13, cy: 124, scale: 1.1, k: 1.12 } }[st];
      // 테마 배경일 땐 나무를 조금 작게 (배경이 보이게)
      const sc = scene === "lake" ? 1 : .84;
      const T = { h: T0.h * sc, w0: T0.w0 * Math.sqrt(sc), w1: T0.w1 * Math.sqrt(sc), cy: B - (B - T0.cy) * sc, scale: T0.scale * sc, k: T0.k * sc };
      L.tree.push(shadow(f(70 * T.scale + 22)));
      const top = B - T.h;
      // 줄기: 왼쪽에서 빛 → 결 · 옹이 → 잎 그늘이 드리운 윗부분
      let tr = `<path d="M${X - T.w0 / 2 - (st >= 4 ? 9 : 2)} ${B} Q${X - T.w0 / 2} ${B - 6} ${X - T.w0 / 2} ${B - 14} C${X - T.w0 / 2 + 1} ${B - T.h * .55} ${X - T.w1 / 2 - 3} ${top + 24} ${X - T.w1 / 2} ${top} `
        + `L${X + T.w1 / 2} ${top} C${X + T.w1 / 2 + 3} ${top + 24} ${X + T.w0 / 2 - 1} ${B - T.h * .55} ${X + T.w0 / 2} ${B - 14} Q${X + T.w0 / 2} ${B - 6} ${X + T.w0 / 2 + (st >= 4 ? 9 : 2)} ${B}Z" fill="${U("trunk")}"/>`;
      if (st >= 3) {
        const bw = st >= 4 ? 6 : 4;
        tr += `<path d="M${X - 2} ${top + T.h * .35} Q${X - 30 * T.scale} ${top + 4} ${X - 52 * T.scale} ${top - 10}" stroke="#7E5337" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
        tr += `<path d="M${X + 2} ${top + T.h * .28} Q${X + 34 * T.scale} ${top + 2} ${X + 58 * T.scale} ${top - 6}" stroke="#6E4630" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < (st >= 4 ? 5 : st === 3 ? 3 : 1); i++) {         // 나무결
        const bx = X - T.w0 * .3 + R() * T.w0 * .6, y0 = B - 8 - R() * 20, y1 = top + 14 + R() * 26;
        tr += `<path d="M${f(bx)} ${f(y0)} C${f(bx + (R() - .5) * 6)} ${f((y0 + y1) / 2)} ${f(bx * .5 + X * .5)} ${f(y1 + 10)} ${f(bx * .4 + X * .6)} ${f(y1)}" stroke="#5A3622" stroke-opacity=".32" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
      }
      tr += `<path d="M${X - T.w0 / 2 + 3} ${B - 10} C${X - T.w0 / 2 + 4} ${B - T.h * .5} ${X - T.w1 / 2} ${top + 30} ${X - T.w1 / 2 + 1.5} ${top + 8}" stroke="#FFE9CC" stroke-opacity=".28" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      if (st >= 4) tr += `<ellipse cx="${X + 4}" cy="${f(B - T.h * .42)}" rx="3.4" ry="4.6" fill="#4E3020" opacity=".55"/><ellipse cx="${X + 3.4}" cy="${f(B - T.h * .42 - 1.2)}" rx="1.6" ry="2.2" fill="#B58360" opacity=".5"/>`;
      grad("tshade", [[0, "#2A1A10", .45], [1, "#2A1A10", 0]]);
      tr += `<rect x="${X - T.w0}" y="${top - 2}" width="${T.w0 * 2}" height="${f(T.h * .3)}" fill="${U("tshade")}"/>`;
      L.tree.push(tr);

      const BL = {
        2: [[-14, 6, 18], [13, 7, 17], [0, -10, 20], [0, 10, 16]],
        3: [[-30, 8, 24], [29, 10, 23], [-14, -14, 26], [16, -16, 26], [0, -30, 23], [0, 12, 24], [-40, -6, 17], [42, -4, 17]],
        4: [[-64, 14, 30], [62, 16, 30], [-42, -14, 34], [40, -12, 34], [-12, -36, 36], [20, -38, 34], [0, -6, 40], [-28, 24, 30], [30, 26, 30], [-74, -10, 22], [76, -8, 22], [0, 26, 30]],
      }[Math.min(st, 4)];
      const k = T.k, cy = T.cy, snowy = o.season === "winter";
      const circ = (bx, by, r, extra) => `<circle cx="${f(X + bx * k)}" cy="${f(cy + by * k)}" r="${f(r * k)}" ${extra}/>`;
      defs.push(`<clipPath id="${id}cv">${BL.map(([bx, by, r]) => circ(bx, by, r, "")).join("")}</clipPath>`);
      let can = `<g class="sway" style="transform-origin:${X}px ${B}px">`;
      for (const [bx, by, r] of BL) can += `<circle cx="${f(X + bx * k + 1)}" cy="${f(cy + by * k + 5)}" r="${f(r * k + 2)}" fill="${S.leaf[3]}"/>`;   // 그림자 테두리
      for (const [bx, by, r] of BL) can += circ(bx, by, r, `fill="${U("leaf")}"`);
      // 전체 빛·그늘 (잎 모양 안에만)
      const top0 = Math.min(...BL.map(([, by, r]) => cy + (by - r) * k)), bot0 = Math.max(...BL.map(([, by, r]) => cy + (by + r) * k));
      can += `<g clip-path="url(#${id}cv)"><rect x="${X - 140}" y="${f(top0)}" width="280" height="${f(bot0 - top0)}" fill="${U("vol")}"/>`
        + `<circle cx="${f(X - 70 * k)}" cy="${f(top0 + 8)}" r="${f(70 * k)}" fill="#FFF6DE" opacity="${f(.22 * (1 - dark))}" filter="url(#${id}blur)"/></g>`;
      for (const [bx, by, r] of BL) can += `<ellipse cx="${f(X + (bx - r * .3) * k)}" cy="${f(cy + (by - r * .42) * k)}" rx="${f(r * .38 * k)}" ry="${f(r * .2 * k)}" fill="#FFFDF4" opacity="${snowy ? .75 : .26}"/>`;
      for (let i = 0; i < 9 * (st - 1); i++) {               // 잎 결: 작은 반달
        const [bx, by, r] = BL[Math.floor(R() * BL.length)], a = R() * Math.PI * 2, d = R() * r * .75;
        const lx = f(X + (bx + Math.cos(a) * d) * k), ly = f(cy + (by + Math.sin(a) * d) * k), w = f(3 + R() * 2.5);
        can += `<path d="M${f(lx - w)} ${ly} q${w} ${f(w * .9)} ${f(w * 2)} 0" stroke="${S.leaf[2]}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".5"/>`;
      }
      if (snowy) for (let i = 0; i < 8; i++) {
        const [bx, by, r] = BL[Math.floor(R() * BL.length)];
        can += `<circle cx="${f(X + (bx + (R() - .5) * r) * k)}" cy="${f(cy + (by + (R() - .2) * r * .6) * k)}" r="1.4" fill="#fff" class="tw" style="animation-duration:${f(2 + R() * 2)}s;animation-delay:-${f(R() * 2)}s"/>`;
      }
      const n = st >= 5 ? 16 : st === 4 ? 5 : st === 3 && o.season === "spring" ? 6 : 0;
      const kind = scene === "halloween" ? ["pumpkin", "kaki"] : scene === "market" ? ["lantern"] : { spring: ["blossom", "blossom", "bud"], summer: ["apple", "apple", "cherry"], autumn: ["kaki"], winter: ["berry"] }[o.season];
      for (let i = 0; i < n; i++) {
        const [bx, by, r] = BL[Math.floor(R() * BL.length)], a = R() * Math.PI * 2, d = R() * r * .72;
        let [fx, fy] = [f(X + (bx + Math.cos(a) * d) * k), f(cy + (by + Math.sin(a) * d) * k)];
        if (i % 4 === 0 && o.season !== "spring" && o.season !== "winter") {
          const hy = f(cy + (by + r * .85) * k);
          can += `<path d="M${fx} ${f(hy - 6)} v6" stroke="#7A5338" stroke-width=".8"/>`;
          fy = f(hy + 4);
        }
        can += FRUIT[kind[i % kind.length]](fx, fy);
      }
      L.tree.push(can + "</g>");
      if (st >= 5) {                                   // 새집
        const hx = X - 10, hy = B - T.h * .62;
        L.deco.push(`<g><rect x="${hx - 7}" y="${f(hy - 6)}" width="14" height="13" rx="2" fill="#F1D3A8"/><rect x="${hx - 7}" y="${f(hy - 6)}" width="4" height="13" rx="1.5" fill="#fff" opacity=".25"/>`
          + `<path d="M${hx - 10} ${f(hy - 5)} L${hx} ${f(hy - 14)} L${hx + 10} ${f(hy - 5)}Z" fill="#E06A6A"/><path d="M${hx - 10} ${f(hy - 5)} L${hx} ${f(hy - 14)} L${hx} ${f(hy - 11.5)}Z" fill="#fff" opacity=".2"/>`
          + `<circle cx="${hx}" cy="${f(hy)}" r="2.6" fill="#5A3A28"/><rect x="${hx - .6}" y="${f(hy + 3.4)}" width="1.2" height="3" fill="#7A5338"/>`
          + (winter ? `<path d="M${hx - 10} ${f(hy - 5)} L${hx} ${f(hy - 14)} L${hx + 10} ${f(hy - 5)} L${hx} ${f(hy - 11)}Z" fill="#fff"/>` : "") + `</g>`);
      }
      if (st >= 4) {                                   // 등불 (왼쪽 가지 끝) — 저녁·밤엔 따뜻하게 빛난다
        const lx = f(X - 50 * T.scale), ly = f(top - 4), on = dark > .2;
        L.deco.push(`<g class="swing" style="transform-origin:${lx}px ${ly}px"><path d="M${lx} ${ly} v14" stroke="#6B4A2E" stroke-width=".9"/>`
          + `<path d="M${f(lx - 4)} ${f(ly + 14)} h8 l-1 2 h-6z" fill="#7A5338"/><rect x="${f(lx - 4)}" y="${f(ly + 16)}" width="8" height="10" rx="2.4" fill="${on ? "#FFE7A6" : "#FFF3D6"}" stroke="#B88A4E" stroke-width="1"/>`
          + `<path d="M${lx} ${f(ly + 16)} v10" stroke="#B88A4E" stroke-width=".7"/><path d="M${f(lx - 4)} ${f(ly + 26)} h8 l-1 2 h-6z" fill="#7A5338"/></g>`);
        if (on) L.light.push(`<circle cx="${lx}" cy="${f(ly + 21)}" r="16" fill="#FFC970" opacity="${f(.25 + dark * .3)}" filter="url(#${id}blur)"/><circle cx="${lx}" cy="${f(ly + 21)}" r="3" fill="#FFF3C4" class="tw" style="animation-duration:3.4s"/>`);
      }
      if (st >= 4) {                                   // 그네
        const sx = X + 54 * k, sy = cy + 34 * k;
        L.deco.push(`<g class="swing" style="transform-origin:${f(sx + 11)}px ${f(sy)}px"><path d="M${f(sx)} ${f(sy)} L${f(sx)} ${B - 30} M${f(sx + 22)} ${f(sy)} L${f(sx + 22)} ${B - 30}" stroke="#8C6B4F" stroke-width="1.4"/>`
          + `<rect x="${f(sx - 4)}" y="${B - 32}" width="30" height="6" rx="2.5" fill="#B9835A"/><rect x="${f(sx - 4)}" y="${B - 32}" width="30" height="2" rx="1" fill="#fff" opacity=".3"/>`
          + (winter ? `<rect x="${f(sx - 4)}" y="${B - 34}" width="30" height="3" rx="1.5" fill="#fff"/>` : "") + `</g>`);
      }
      if (st >= 5 && scene === "lake") {               // 호수를 바라보는 벤치
        const bx = X - 108, by = B + 4;
        L.deco.push(`<g><ellipse cx="${bx + 24}" cy="${by + 1}" rx="26" ry="3" fill="#4A2E1E" opacity=".12"/><rect x="${bx}" y="${by - 20}" width="44" height="5" rx="2" fill="#BE8A5E"/><rect x="${bx}" y="${by - 20}" width="44" height="1.6" rx=".8" fill="#fff" opacity=".3"/><rect x="${bx}" y="${by - 13}" width="44" height="5" rx="2" fill="#A8744E"/>`
          + `<rect x="${bx + 4}" y="${by - 10}" width="3.5" height="11" fill="#7E5337"/><rect x="${bx + 36.5}" y="${by - 10}" width="3.5" height="11" fill="#7E5337"/>`
          + (winter ? `<rect x="${bx - 1}" y="${by - 22}" width="46" height="3" rx="1.5" fill="#fff"/>` : "") + `</g>`);
      }
    }

    function drawXmas() {
      const st = Math.min(o.stage, 5), H = { 2: 100, 3: 144, 4: 182, 5: 190 }[st] * (scene === "lake" ? 1 : .88), W = H * .48;
      L.tree.push(shadow(f(W + 16)));
      L.tree.push(`<rect x="${X - 7}" y="${B - 18}" width="14" height="20" rx="2" fill="#7A5338"/>`);
      grad("xfir", [[0, "#48A06F"], [.6, "#2E7D57"], [1, "#1E5E43"]], 1, 1);
      const n = st >= 4 ? 5 : st === 3 ? 4 : 3, step = (H - 18) / n;
      let g = "";
      for (let i = 0; i < n; i++) {
        const yb = B - 14 - i * step * .92, w = W * (1 - i * .2), yt = yb - step * 1.45;
        g += `<path d="M${f(X - w)} ${f(yb)} C${f(X - w * .6)} ${f(yb - step * .5)} ${f(X - 8)} ${f(yt + 10)} ${X} ${f(yt)} C${f(X + 8)} ${f(yt + 10)} ${f(X + w * .6)} ${f(yb - step * .5)} ${f(X + w)} ${f(yb)} `
          + `Q${f(X + w * .5)} ${f(yb + 7)} ${X} ${f(yb + 3)} Q${f(X - w * .5)} ${f(yb + 7)} ${f(X - w)} ${f(yb)}Z" fill="${U("xfir")}"/>`;
        g += `<path d="M${f(X - 3)} ${f(yt + 8)} C${f(X - w * .35)} ${f(yb - step * .6)} ${f(X - w * .7)} ${f(yb - 4)} ${f(X - w * .9)} ${f(yb)}" stroke="#fff" stroke-opacity=".14" stroke-width="4" fill="none"/>`;
        g += `<path d="M${f(X - w)} ${f(yb)} Q${f(X - w * .5)} ${f(yb + 7)} ${X} ${f(yb + 3)} Q${f(X + w * .5)} ${f(yb + 7)} ${f(X + w)} ${f(yb)} Q${f(X + w * .5)} ${f(yb + 1)} ${X} ${f(yb - 2)} Q${f(X - w * .5)} ${f(yb + 1)} ${f(X - w)} ${f(yb)}Z" fill="#FFFDF8" opacity=".95"/>`;
        const gy = yb - step * .55, gw = w * .78;
        g += `<path d="M${f(X - gw)} ${f(gy - 6)} Q${X} ${f(gy + 10)} ${f(X + gw)} ${f(gy - 8)}" stroke="#E9C46A" stroke-width="1.6" fill="none" opacity=".9"/>`;
        for (let j = 0; j <= 6; j++) {
          const t = j / 6, bx = (1 - t) * (1 - t) * (X - gw) + 2 * (1 - t) * t * X + t * t * (X + gw);
          const by = (1 - t) * (1 - t) * (gy - 6) + 2 * (1 - t) * t * (gy + 10) + t * t * (gy - 8);
          const c = ["#FFD86A", "#FF8F7E", "#FFE9B0", "#FFB870"][(i + j) % 4];       // 따뜻한 전구색
          L.light.push(`<circle cx="${f(bx)}" cy="${f(by + 1.5)}" r="2.6" fill="${c}" class="tw" style="animation-duration:${f(1.2 + R() * 1.4)}s;animation-delay:-${f(R() * 2)}s" filter="url(#${id}glow)"/>`);
        }
        for (let j = 0; j < 2 + (st >= 4 ? 1 : 0); j++) {
          const ox = X + (R() - .5) * w * 1.2, oy = yb - step * (.2 + R() * .35), c = ["#D8434A", "#E9B94A", "#F4EEE4"][(i + j) % 3];
          g += drop(ox, oy, 4) + `<circle cx="${f(ox)}" cy="${f(oy)}" r="4" fill="${c}"/><circle cx="${f(ox - 1.3)}" cy="${f(oy - 1.4)}" r="1.3" fill="#fff" opacity=".85"/>`;
        }
      }
      L.tree.push(g);
      const sy = B - 14 - (n - 1) * step * .92 - step * 1.45 - 2;
      L.light.push(`<circle cx="${X}" cy="${f(sy)}" r="20" fill="#FFD77A" opacity=".35" filter="url(#${id}blur)"/><path d="${star(X, sy, 11, 4.6)}" fill="#FFD54F" stroke="#E9A90A" stroke-width="1" filter="url(#${id}glow)" class="tw" style="animation-duration:3s"/>`);
      if (st >= 3) {
        const box = (x, w, h, c, rb) => `<g><rect x="${x}" y="${B - h + 2}" width="${w}" height="${h}" rx="2" fill="${c}"/><rect x="${x}" y="${B - h + 2}" width="${w * .3}" height="${h}" rx="1.5" fill="#fff" opacity=".12"/><rect x="${x + w / 2 - 2}" y="${B - h + 2}" width="4" height="${h}" fill="${rb}"/><rect x="${x}" y="${B - h * .55 + 2}" width="${w}" height="3.5" fill="${rb}"/>`
          + `<path d="M${x + w / 2} ${B - h + 2} q-7 -7 -9 -1 q3 4 9 1 q7 -7 9 -1 q-3 4 -9 1" fill="${rb}"/></g>`;
        L.deco.push(box(X - 52, 24, 20, "#D9534F", "#FFE08A") + box(X + 26, 22, 17, "#4E7FC9", "#FFF6E6") + box(X + 10, 16, 13, "#EBB84A", "#D9534F"));
      }
    }
    function star(cx, cy, r1, r2) {
      let d = "";
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? r2 : r1, a = -Math.PI / 2 + i * Math.PI / 5;
        d += (i ? "L" : "M") + f(cx + Math.cos(a) * r) + " " + f(cy + Math.sin(a) * r);
      }
      return d + "Z";
    }

    /* ---------- 땅 위 작은 것들 ---------- */
    const sandy = scene === "beach" || scene === "market" || scene === "seattle";   // 모래·돌바닥·데크엔 풀꽃을 심지 않는다
    const nFlowers = o.stage >= 3 && !winter && !sandy ? 6 + o.forest * 2 : 0;
    for (let i = 0; i < nFlowers; i++) {
      const x = 20 + R() * 360, y = 274 + R() * 40;
      if (Math.abs(x - X) < 44 && y < 288) continue;
      const c = { spring: ["#FFFFFF", "#FFB7CC", "#FFE27A"], summer: ["#FFE27A", "#FF9E9E", "#FFFFFF"], autumn: ["#FFF8EE", "#F2C14E", "#E2774A"] }[o.season] || ["#fff"];
      L.ground.push(`<path d="M${f(x)} ${f(y)} v-6" stroke="${S.grass}" stroke-width="1.2"/>` + flower(f(x), f(y - 7), 3.6, c[i % 3], "#F2B705"));
    }
    for (let i = 0; i < 18 && !winter && !sandy; i++) {
      const x = 8 + R() * 384, y = 272 + R() * 44, c = i % 3 ? S.grass : mix(S.grass, "#FFF3C8", .4);
      L.ground.push(`<path d="M${f(x - 3)} ${f(y)} q2 -7 3 -9 M${f(x)} ${f(y)} q0 -8 1 -11 M${f(x + 3)} ${f(y)} q-1 -6 2 -8" stroke="${c}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".75"/>`);
    }
    if (o.season === "autumn" && o.stage >= 4) for (let i = 0; i < 4; i++) L.ground.push(FRUIT.kaki(f(X - 60 + R() * 120), f(278 + R() * 12)));
    if (o.season === "winter" && o.stage >= 3 && !xmas && scene === "lake") {      // 눈사람
      L.ground.push(`<g transform="translate(60 292)"><ellipse cx="0" cy="3" rx="13" ry="3" fill="#6E5A7A" opacity=".12"/><circle cx="0" cy="-6" r="10" fill="#FFFDF8"/><circle cx="0" cy="-20" r="7" fill="#FFFDF8"/>`
        + `<path d="M4 -1 a10 10 0 0 1 -9 4" stroke="#DCD3E4" stroke-width="3" fill="none" stroke-linecap="round"/>`
        + `<circle cx="-2.4" cy="-21" r=".9" fill="#3A2E2B"/><circle cx="2.4" cy="-21" r=".9" fill="#3A2E2B"/><path d="M0 -19 l5 1 l-5 1z" fill="#FF9A3C"/>`
        + `<path d="M-6 -15 q6 3 12 0 l1 3 q-7 3 -14 0z" fill="#D9534F"/><rect x="-5" y="-31" width="10" height="5" rx="1" fill="#3A3F5A"/><rect x="-7" y="-27" width="14" height="2" rx="1" fill="#3A3F5A"/>`
        + `<circle cx="-4" cy="-19" r="1.4" fill="#FFB8C8" opacity=".7"/><circle cx="4" cy="-19" r="1.4" fill="#FFB8C8" opacity=".7"/></g>`);
    }
    if (o.forest >= 4) {                                                            // 토끼
      L.ground.push(`<g transform="translate(356 302)"><ellipse cx="0" cy="3" rx="11" ry="2.5" fill="#4A2E1E" opacity=".1"/><ellipse cx="0" cy="-4" rx="9" ry="7" fill="#FFFDF8"/>`
        + `<circle cx="-7" cy="-10" r="5" fill="#FFFDF8"/><ellipse cx="-9" cy="-19" rx="1.8" ry="5.5" fill="#FFFDF8"/><ellipse cx="-5.5" cy="-19" rx="1.8" ry="5.5" fill="#FFFDF8" transform="rotate(12 -5.5 -19)"/>`
        + `<ellipse cx="-9" cy="-19" rx=".8" ry="3.6" fill="#FFC2D4"/><circle cx="-8.6" cy="-10.6" r=".9" fill="#3A2E2B"/><circle cx="-10.4" cy="-8.6" r="1.2" fill="#FFB8C8" opacity=".8"/><circle cx="8" cy="-4" r="2.4" fill="#FFFDF8"/></g>`);
    }
    if (o.stage >= 3 && o.names) {                                                 // 이름 팻말
      // 팻말 자리: 오른쪽 앞 (바다·야시장은 오른쪽에 소품이 많아 왼쪽 앞으로)
      const [px, py] = ["beach", "market", "seollal", "chuseok", "hangul", "newyear"].includes(scene) ? [X - 66, B + 30] : [X + 100, B + 24];
      const w = Math.max(64, o.names.length * 10 + 16);
      L.deco.push(`<g><ellipse cx="${px}" cy="${py + 2}" rx="10" ry="2" fill="#4A2E1E" opacity=".12"/><rect x="${px - 2}" y="${py - 26}" width="4" height="28" rx="1" fill="#7E5337"/>`
        + `<rect x="${px - w / 2}" y="${py - 41}" width="${w}" height="21" rx="5" fill="#5A3A26" opacity=".25"/>`
        + `<rect x="${px - w / 2}" y="${py - 42}" width="${w}" height="21" rx="5" fill="#CC9A68"/><rect x="${px - w / 2}" y="${py - 42}" width="${w}" height="5" rx="2.5" fill="#fff" opacity=".22"/>`
        + (winter ? `<rect x="${px - w / 2 - 1}" y="${py - 44}" width="${w + 2}" height="4.5" rx="2.2" fill="#fff"/>` : "")
        + `<text x="${px}" y="${py - 27.5}" text-anchor="middle" font-family="Jua, 'Noto Sans KR', sans-serif" font-size="11.5" fill="#FFFAF0">${esc(o.names)}</text></g>`);
    }

    /* ---------- 날씨 · 반짝임 ---------- */
    const fall = (n, draw, dur) => {
      for (let i = 0; i < n; i++) {
        const x = R() * 400, d = dur[0] + R() * (dur[1] - dur[0]);
        L.fx.push(`<g transform="translate(${f(x)} 0)"><g class="fall" style="animation-duration:${f(d)}s;animation-delay:-${f(R() * d)}s">${draw(i)}</g></g>`);
      }
    };
    if (scene === "space" || scene === "undersea") {}            // 우주·바닷속엔 눈·꽃잎이 내리지 않는다
    else if (winter) fall(34, () => `<circle cx="0" cy="0" r="${f(1.2 + R() * 2)}" fill="#FFFDF8" opacity=".92"/>`, [9, 16]);
    else if (o.season === "spring") fall(14, () => `<path d="M0 0 c-2 -3 -5 -1 -3 2 l3 3 l3 -3 c2 -3 -1 -5 -3 -2z" fill="#FFCADA"/>`, [10, 16]);
    else if (o.season === "autumn") fall(10, (i) => `<path d="M0 0 c3 -4 8 -4 10 0 c-3 3 -7 3 -10 0z" fill="${["#F59A42", "#DC5F38", "#F7C55A"][i % 3]}"/>`, [9, 15]);
    if (o.season === "summer" && dark > .5) for (let i = 0; i < 14; i++) {
      L.light.push(`<circle cx="${f(30 + R() * 340)}" cy="${f(150 + R() * 140)}" r="1.8" fill="#F8FF9E" class="tw" style="animation-duration:${f(1.6 + R() * 2)}s;animation-delay:-${f(R() * 2)}s" filter="url(#${id}glow)"/>`);
    } else if ((o.season === "summer" || o.season === "spring") && dark < .4) for (let i = 0; i < 2; i++) {
      const bx = 130 + i * 150 + R() * 20, by = 196 + R() * 40, c = i ? "#FFD54F" : "#FFB7CC";
      L.fx.push(`<g transform="translate(${f(bx)} ${f(by)})"><g class="bob" style="animation-delay:-${f(R() * 3)}s"><path d="M0 0 c-6 -8 -12 -2 -6 3 z M0 0 c6 -8 12 -2 6 3 z" fill="${c}" class="flap"/><path d="M0 -3 v6" stroke="#5A4A3A" stroke-width="1"/></g></g>`);
    }
    // 저녁·밤: 따뜻한 빛 알갱이가 천천히 떠다닌다 / 낮: 작은 반짝임
    if (dark > .3) for (let i = 0; i < 10; i++) {
      L.light.push(`<g transform="translate(${f(40 + R() * 320)} ${f(120 + R() * 150)})"><g class="bob" style="animation-duration:${f(5 + R() * 4)}s;animation-delay:-${f(R() * 5)}s">`
        + `<circle r="${f(2 + R() * 3)}" fill="#FFD9A0" opacity="${f(.25 + R() * .3)}" filter="url(#${id}soft)"/></g></g>`);
    } else for (let i = 0; i < 5; i++) {
      L.fx.push(`<path d="${star(40 + R() * 320, 60 + R() * 150, 2.6, 1)}" fill="#FFFBEA" class="tw" style="animation-duration:${f(2.4 + R() * 2)}s;animation-delay:-${f(R() * 3)}s" opacity=".9"/>`);
    }
    if (o.special) {
      const cols = o.special === "anniv" ? ["#FF7C99", "#FF9EB5", "#E8577A"] : ["#FF7C99", "#FFD54F", "#8FDBFF", "#B8F27A"];
      for (let i = 0; i < 5; i++) {
        const bx = 60 + i * 72 + (R() - .5) * 20, by = 110 + R() * 60, c = cols[i % cols.length];
        const shape = o.special === "anniv"
          ? `<path d="M0 8 C-17 -5 -11 -22 0 -12 C11 -22 17 -5 0 8Z" fill="${c}"/><ellipse cx="-5" cy="-10" rx="2.6" ry="3.6" fill="#fff" opacity=".45"/>`
          : `<ellipse cx="0" cy="-5" rx="10" ry="12.5" fill="${c}"/><ellipse cx="-3" cy="-10" rx="2.5" ry="3.6" fill="#fff" opacity=".5"/><path d="M-2 7 h4 l-2 -3z" fill="${c}"/>`;
        L.fx.push(`<g transform="translate(${f(bx)} ${f(by)})"><g class="bob" style="animation-duration:${f(3 + R() * 2)}s;animation-delay:-${f(R() * 3)}s">${shape}<path d="M0 8 q3 10 -1 22" stroke="#9A8A8A" stroke-width=".8" fill="none"/></g></g>`);
      }
    }

    // 마무리: 밤 어둠 · 노을빛 · 왼쪽 위 햇빛 · 가장자리 비네트 · 종이 결
    grad("sunwash", [[0, "#FFE6B0", .22], [.5, "#FFE6B0", 0]], 1, 1);
    rgrad("vig", [[0, "#000", 0], [.62, "#3A2010", 0], [1, "#3A2010", .26]], .5, .46, .78);
    const finish = (dark > 0 ? `<rect width="400" height="320" fill="#11163A" opacity="${f(dark * .36)}"/>` : "")
      + (warm > 0 ? `<rect width="400" height="320" fill="#FF8F5E" opacity="${f(warm * .12)}"/>` : "")
      + (dark < .7 ? `<rect width="400" height="320" fill="${U("sunwash")}" opacity="${f(1 - dark)}"/>` : "")
      + `<rect width="400" height="320" fill="${U("vig")}"/>`
      + `<rect width="400" height="320" filter="url(#${id}grain)" opacity=".12" style="mix-blend-mode:multiply"/>`;
    const css = `.${id} .tw{animation:${id}tw 2s ease-in-out infinite}.${id} .fall{animation:${id}fall 12s linear infinite}`
      + `.${id} .cloud{animation:${id}cloud 24s ease-in-out infinite}.${id} .sway{animation:${id}sway 7s ease-in-out infinite;transform-box:view-box}`
      + `.${id} .swing{animation:${id}swing 4.5s ease-in-out infinite;transform-box:view-box}.${id} .bob{animation:${id}bob 4s ease-in-out infinite}`
      + `.${id} .ray{animation:${id}ray 6s ease-in-out infinite}`
      + `.${id} .fallw{animation:${id}fallw 1.4s linear infinite}@keyframes ${id}fallw{from{transform:translateY(0)}to{transform:translateY(66px)}}`
      + `.${id} .wave{animation:${id}wave 5s ease-in-out infinite}@keyframes ${id}wave{0%,100%{transform:translate(0,0)}50%{transform:translate(-10px,2px)}}`
      + `.${id} .spin{animation:${id}spin 60s linear infinite}@keyframes ${id}spin{to{transform:rotate(360deg)}}`
      + `.${id} .sway2{animation:${id}sway2 9s ease-in-out infinite;transform-box:view-box;transform-origin:200px -60px}@keyframes ${id}sway2{0%,100%{transform:rotate(-.5deg)}50%{transform:rotate(.5deg)}}`
      + `.${id} .burst{animation:${id}burst 3s ease-out infinite}@keyframes ${id}burst{0%{transform:scale(.15);opacity:0}12%{opacity:1}70%{opacity:.9}100%{transform:scale(1.15);opacity:0}}`
      + `.${id} .rise{animation:${id}rise 16s linear infinite}@keyframes ${id}rise{0%{transform:translate(0,30px);opacity:0}15%{opacity:1}85%{opacity:.9}100%{transform:translate(14px,-150px);opacity:0}}`
      + `.${id} .horse{animation:${id}horse 2.4s ease-in-out infinite}@keyframes ${id}horse{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`
      + `.${id} .aurora{animation:${id}aurora 9s ease-in-out infinite}@keyframes ${id}aurora{0%,100%{transform:translate(0,0) scaleY(1);opacity:.55}50%{transform:translate(-14px,6px) scaleY(1.15);opacity:1}}`
      + `.${id} .shoot{animation:${id}shoot 7s ease-in infinite;opacity:0}@keyframes ${id}shoot{0%,80%{transform:translate(0,0);opacity:0}84%{opacity:1}100%{transform:translate(-120px,48px);opacity:0}}`
      + `.${id} .sway3{animation:${id}sway3 5s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes ${id}sway3{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}`
      + `.${id} .swim{animation:${id}swim 18s linear infinite}@keyframes ${id}swim{from{transform:translateX(-120px)}to{transform:translateX(460px)}}`
      + `.${id} .rain{animation:${id}rain 1.2s linear infinite}@keyframes ${id}rain{from{transform:translate(0,-20px)}to{transform:translate(-30px,340px)}}`
      + `.${id} .ripple{animation:${id}ripple 2.4s ease-out infinite;transform-box:fill-box;transform-origin:center}@keyframes ${id}ripple{0%{transform:scale(.3);opacity:.9}100%{transform:scale(2.2);opacity:0}}`
      + `.${id} .drift{animation:${id}drift 14s ease-in-out infinite}.${id} .paddle{animation:${id}paddle 9s ease-in-out infinite}`
      + `.${id} .flap{animation:${id}flap .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}`
      + `@keyframes ${id}tw{0%,100%{opacity:1}50%{opacity:.25}}@keyframes ${id}ray{0%,100%{opacity:.55}50%{opacity:1}}`
      + `@keyframes ${id}fall{0%{transform:translate(0,-20px) rotate(0)}25%{transform:translate(16px,70px) rotate(90deg)}50%{transform:translate(-8px,160px) rotate(180deg)}75%{transform:translate(14px,250px) rotate(270deg)}100%{transform:translate(0,340px) rotate(360deg)}}`
      + `@keyframes ${id}cloud{0%,100%{transform:translateX(-16px)}50%{transform:translateX(16px)}}`
      + `@keyframes ${id}sway{0%,100%{transform:rotate(-.8deg)}50%{transform:rotate(.8deg)}}`
      + `@keyframes ${id}swing{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}`
      + `@keyframes ${id}bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`
      + `@keyframes ${id}drift{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-8px)}}`
      + `@keyframes ${id}paddle{0%,100%{transform:translate(0,0)}50%{transform:translate(26px,2px)}}`
      + `@keyframes ${id}flap{from{transform:scaleY(1)}to{transform:scaleY(.55)}}`
      + `@media (prefers-reduced-motion:reduce){.${id} *{animation:none!important}}`;
    return `<svg class="${id}" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="우리 나무" preserveAspectRatio="xMidYMid slice">`
      + `<defs>${defs.join("")}</defs><style>${css}</style>`
      + L.sky.join("") + L.mtn.join("") + L.far.join("") + L.lake.join("") + L.near.join("") + L.ground.join("")
      + L.tree.join("") + L.deco.join("") + finish + L.light.join("") + L.fx.join("") + `</svg>`;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // 날짜 → 계절 · 배경 (앱이 '자동'일 때 쓴다)
  // 설·추석 연휴 (양력, 앞뒤 하루 포함). 음력이라 해마다 미리 넣어 둔다 — 2032년부터는 여기에 더 넣기
  const HOLIDAYS = [["2027-02-06", "2027-02-08", "seollal"], ["2027-09-14", "2027-09-16", "chuseok"], ["2028-01-25", "2028-01-28", "seollal"], ["2028-10-02", "2028-10-04", "chuseok"],
                    ["2029-02-12", "2029-02-14", "seollal"], ["2029-09-21", "2029-09-23", "chuseok"], ["2030-02-02", "2030-02-04", "seollal"], ["2030-09-11", "2030-09-13", "chuseok"],
                    ["2031-01-22", "2031-01-24", "seollal"], ["2031-09-30", "2031-10-02", "chuseok"]];
  // 날짜 → 계절 · 배경. 우선순위: 기념일(놀이공원) > 설·추석 > 새해 · 한글날 · 발렌타인/화이트데이 > 크리스마스 · 할로윈 > 금·토 밤(야시장) > 달마다 정한 배경
  // start(사귄 날 YYYY-MM-DD)를 주면 100일 단위·주년 날엔 놀이공원(불꽃놀이)
  function sceneFor(d, start) {
    const m = d.getMonth() + 1, day = d.getDate(), y = d.getFullYear();
    const ds = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const season = m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
    const pick = (scene, extra) => Object.assign({ season, scene, christmas: false, special: null }, extra);
    if (start) {
      const [sy, sm, sd] = start.split("-").map(Number), n = Math.round((Date.UTC(y, m - 1, day) - Date.UTC(sy, sm - 1, sd)) / 864e5) + 1;
      if ((n > 1 && n % 100 === 0) || (y > sy && m === sm && day === sd)) return pick("park", { special: "anniv" });
    }
    const hol = HOLIDAYS.find(([a, b]) => ds >= a && ds <= b);
    if (hol) return pick(hol[2], { season: hol[2] === "seollal" ? "winter" : "autumn" });
    if ((m === 12 && day === 31) || (m === 1 && day === 1)) return pick("newyear", { season: "winter", year: m === 12 ? y + 1 : y });
    if (m === 10 && day === 9) return pick("hangul", { season: "autumn" });
    if ((m === 2 && day === 14) || (m === 3 && day === 14)) return pick("sweet");
    if (m === 12 && day <= 25) return pick("london", { season: "winter", christmas: true });
    if (m === 10 && day >= 15) return pick("halloween", { season: "autumn" });
    if ((d.getDay() === 5 || d.getDay() === 6) && d.getHours() >= 18) return pick("market");
    if (season === "spring") return pick("hanriver");
    if (m === 6) return pick("valley");
    if (m === 7 || m === 8) return pick("beach");
    if (m === 11) return pick("seattle");
    if (m === 12 || m <= 2) return pick("cabin");
    return pick("lake");
  }
  // 배경 목록: [id, 이름, 하트, 무리, 계절(고정해서 쓸 때 나무 모습)] — 하트로 열면 언제든 고정해서 쓸 수 있다. 날짜 배경은 그 기간엔 무료로 뜬다
  const CATALOG = [
    ["lake", "🏞️ 계절 호숫가", 0, "기본", null],
    ["hanriver", "🌸 한강 벚꽃", 60, "계절", "spring"], ["valley", "💦 여름 계곡", 60, "계절", "summer"], ["beach", "🏝️ 바다 휴양지", 80, "계절", "summer"],
    ["seattle", "☔ 시애틀의 가을", 80, "계절", "autumn"], ["cabin", "🏔️ 눈 오는 산장", 80, "계절", "winter"],
    ["halloween", "🎃 할로윈", 100, "기념일", "autumn"], ["london", "🎄 런던 크리스마스", 120, "기념일", "winter"],
    ["market", "🏮 야시장", 100, "기념일", null], ["park", "🎡 놀이공원", 150, "기념일", null],
    ["jeju", "🌼 제주 유채꽃", 80, "여행", "spring"], ["palace", "🏯 궁궐 산책", 100, "여행", "autumn"],
    ["paris", "🗼 파리의 오후", 120, "여행", "spring"], ["santorini", "🏛️ 산토리니", 120, "여행", "summer"],
    ["sunflower", "🌻 해바라기 밭", 80, "판타지", "summer"], ["aurora", "🌌 오로라", 150, "판타지", "winter"],
    ["space", "🪐 우주 소풍", 200, "판타지", null], ["undersea", "🐠 바닷속", 200, "판타지", "summer"],
    ["seollal", "🧧 설날", 100, "명절", "winter"], ["chuseok", "🌕 추석 한가위", 100, "명절", "autumn"], ["hangul", "📜 한글날", 80, "명절", "autumn"],
    ["newyear", "🌅 새해 해돋이", 100, "명절", "winter"], ["sweet", "🍫 달콤한 날", 100, "기념일", "winter"],
    ["busan", "🌉 부산 광안리", 80, "한국", "summer"], ["gyeongju", "🏛️ 경주 첨성대", 80, "한국", "spring"],
    ["newyork", "🗽 뉴욕", 150, "세계", "autumn"], ["tokyo", "🗻 도쿄", 120, "세계", "spring"], ["egypt", "🐪 이집트", 150, "세계", "summer"],
    ["rome", "🍦 로마", 120, "세계", "summer"], ["sydney", "🦘 시드니", 150, "세계", "summer"], ["venice", "🛶 베네치아", 150, "세계", "spring"],
    ["alps", "🐄 스위스 알프스", 120, "세계", "summer"],
  ];
  window.DuriseoTree = { svg, skyAt, darkAt, sceneFor, SCENES, CATALOG, HOLIDAYS };
})();
