/* ======================================================================
 * PixelCat.jsx — a canvas-drawn animated pixel-art cat desktop companion,
 * rebuilt from the Python/PyQt6 "OmniAware cat" as a single React component.
 *
 * - 12 animation states, drawn programmatically with canvas fillRect (no images)
 * - smooth roaming, drag, resize, eye-tracking, speech bubble
 * - behavior sensors (keydown / wheel / mouse / idle / battery / CPU-RAM)
 * - retro pixel chat popup with rule-based replies, reminders, and (Premium)
 *   Anthropic AI chat (claude-sonnet-4-6, direct browser fetch)
 * - show/hide toggle + Ctrl+Shift+P, settings modal, all persisted to localStorage
 *
 * Props: { theme, roaming, scale, isPremium, apiKey, aiEnabled,
 *          onReminderFire, onTaskComplete }
 * ==================================================================== */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------------------------------------- themes */
const THEMES = {
  green_clay:  { bg: "#E8F5E8", panel: "#F0FAF0", accent: "#2E9E2E", text: "#1A3A1A", userBubble: "#B8EEB8", catBubble: "#FFFFFF", border: "#2E9E2E" },
  dark_forest: { bg: "#0D1F0D", panel: "#162016", accent: "#4AE04A", text: "#C8F0C8", userBubble: "#1E4A1E", catBubble: "#0A280A", border: "#4AE04A" },
  kali_mint:   { bg: "#0E1117", panel: "#161B22", accent: "#39D353", text: "#E6EDF3", userBubble: "#1C4532", catBubble: "#161B22", border: "#30363D" },
  pixel_pink:  { bg: "#2A0A1A", panel: "#3A1020", accent: "#FF6EC7", text: "#FFE8F8", userBubble: "#5A0030", catBubble: "#3A1020", border: "#FF6EC7" },
};

/* --------------------------------------------------------------- constants */
const STATES = ["sleep","alert","crying","loving","pawing","walk","shy","cheering","cuddling","standing","thinking","chore"];
const FRAME_MS = 125;     // 8 fps
const FRAMES = 24;        // frames per state
const CELL_W = 48, CELL_H = 52, PX = 4; // internal grid → 192x208 canvas
const BASE_W = CELL_W * PX, BASE_H = CELL_H * PX;
const EYE_STATES = new Set(["standing","walk","alert","speaking","pawing","chore","thinking","loving"]);

const IDLE_MSGS = [
  "I believe in you! 💚", "Stay hydrated! 💧", "You're doing amazing ✨",
  "One task at a time 🌱", "Stretch your legs! 🐾", "Don't forget to blink! 👁",
];
const GREETINGS = [
  { until: 6,  text: "Still up? 🌙 Don't forget to sleep!" },
  { until: 12, text: "Good morning!! ☀️ Ready to conquer the day?" },
  { until: 17, text: "Good afternoon! 🍵 Hope your day's going well~" },
  { until: 21, text: "Good evening! 🌙 Still working hard?" },
  { until: 24, text: "Late night? 😴 Don't forget to rest!" },
];
const CAT_GREETS = ["Mrrrow! Hi there! 💚", "Meow~ you're back!", "Purr… hello friend!", "Hi hi! 🐾", "Mrr! Missed you~"];
const FALLBACKS = ["Mrrrow? Tell me more~", "Purr… I'm listening 🐾", "Meow! That's interesting 💚", "I'm just a little cat, but I'm here for you!"];

const SYSTEM_PROMPT =
  "You are Pixel Cat, a cute kawaii pixel art green cat with headphones who lives on the user's screen as their companion. " +
  "Reply in 1-3 short sentences only. Be warm, playful, and supportive. Use cat sounds naturally (mrrrow, purr, meow). " +
  "Use 💚 occasionally. You help track tasks and deadlines. When the user mentions ANY deadline, time, meeting, or task — " +
  "acknowledge it warmly and offer to set a reminder. If they say yes or confirm, reply with exactly: SET_REMINDER:[text]|[HH:MM] " +
  "so the app can parse it. Keep all replies under 40 words.";

/* cat palette (the cat is always green, independent of chat theme) */
const C = {
  body: "#46c95f", bodyDark: "#2e9e3f", outline: "#0e3a18", white: "#ffffff",
  belly: "#eafce9", phone: "#1c2733", phoneHi: "#33485c", nose: "#0e3a18",
  blush: "#ff8fb0", heart: "#ff5a8a", tear: "#7ec8ff",
};

/* small helper: clamp */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ====================================================================== */
/* PIXEL CAT DRAWING — every state animates the body, not just colors      */
/* ====================================================================== */
function drawCat(ctx, state, frame, opts) {
  const { flip = false, eyeDX = 0, eyeDY = 0, showEyes = true } = opts || {};
  ctx.clearRect(0, 0, BASE_W, BASE_H);
  ctx.save();
  if (flip) { ctx.translate(BASE_W, 0); ctx.scale(-1, 1); }

  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x) * PX, Math.round(y) * PX, w * PX, h * PX); };
  const t = frame / FRAMES;               // 0..1
  const sin = Math.sin(t * Math.PI * 2);  // -1..1
  const tri = 1 - Math.abs(((frame % 12) / 6) - 1); // 0..1 triangle (12-frame cycle)

  /* per-state animated offsets */
  let bodyY = 0, headY = 0, squash = 0, swayX = 0, earUp = 0, shrink = 0;
  let legL = 0, legR = 0, armL = 0, armR = 0, pawReach = 0, headTilt = 0;

  switch (state) {
    case "sleep":     bodyY = sin > 0 ? 0 : -1; squash = sin > 0 ? 1 : 0; break;               // slow breathing
    case "standing":  swayX = Math.round(sin); bodyY = -Math.abs(Math.round(sin * 0.5)); break; // idle sway
    case "alert":     earUp = 2; headY = -1; bodyY = -1; break;                                 // tense, ears up
    case "walk":      bodyY = -Math.round(tri); legL = Math.round(tri * 2 - 1); legR = -legL; swayX = Math.round(sin); break;
    case "cheering":  armL = Math.round((frame % 6 < 3) ? -5 : 0); armR = Math.round((frame % 6 < 3) ? 0 : -5); bodyY = -Math.round(tri); break;
    case "crying":    headY = 1 + Math.round(tri); bodyY = 1; break;                            // head droops
    case "loving":    bodyY = -Math.round(tri * 2); break;                                      // happy bounce
    case "pawing":    pawReach = Math.round(tri * 4); break;                                    // paw reaches out
    case "shy":       shrink = Math.round(tri * 3); armL = -4; armR = -4; break;                // shrink + cover face
    case "cuddling":  shrink = 4; squash = 1; bodyY = 1; break;                                 // curled tight
    case "thinking":  armR = -3; headTilt = 1; break;                                           // paw to chin
    case "chore":     armL = (frame % 4 < 2) ? -2 : 2; armR = -armL; break;                     // scrubbing
    default: break;
  }

  const cx = 24;                 // horizontal center
  const topY = 8 + headY + shrink + (state === "cuddling" ? 4 : 0);

  /* ---- ears (perk up on alert) ---- */
  const ey = topY - 4 - earUp;
  px(cx - 9 + swayX, ey, 4, 5, C.body); px(cx - 9 + swayX, ey - 1, 3, 2, C.bodyDark);
  px(cx + 5 + swayX, ey, 4, 5, C.body); px(cx + 6 + swayX, ey - 1, 3, 2, C.bodyDark);

  /* ---- head ---- */
  const hx = cx - 11 + swayX + Math.round(headTilt * sin);
  px(hx, topY, 22, 16, C.body);
  px(hx, topY, 22, 2, C.bodyDark);                 // top shade
  px(hx - 1, topY + 4, 1, 8, C.body); px(hx + 22, topY + 4, 1, 8, C.body); // cheeks

  /* ---- headphones ---- */
  px(hx + 1, topY - 2, 20, 2, C.phone);            // band
  px(hx - 2, topY + 5, 4, 7, C.phone); px(hx - 1, topY + 6, 2, 4, C.phoneHi); // left cup
  px(hx + 20, topY + 5, 4, 7, C.phone); px(hx + 21, topY + 6, 2, 4, C.phoneHi); // right cup

  /* ---- face: muzzle + nose + blush ---- */
  px(hx + 7, topY + 9, 8, 5, C.belly);
  px(hx + 10, topY + 11, 2, 2, C.nose);
  if (state === "loving" || state === "shy") { px(hx + 3, topY + 9, 2, 2, C.blush); px(hx + 17, topY + 9, 2, 2, C.blush); }

  /* ---- eyes (closed for sleep/cuddling/shy/crying) ---- */
  const eyesOpen = showEyes && EYE_STATES.has(state);
  const lex = hx + 5, rex = hx + 14, eyy = topY + 6;
  if (eyesOpen) {
    px(lex, eyy, 4, 4, C.white); px(rex, eyy, 4, 4, C.white);
    const dx = clamp(Math.round(eyeDX), -1, 1), dy = clamp(Math.round(eyeDY), -1, 1);
    px(lex + 1 + dx, eyy + 1 + dy, 2, 2, C.outline);
    px(rex + 1 + dx, eyy + 1 + dy, 2, 2, C.outline);
    if (state === "alert") { px(lex - 1, eyy - 1, 6, 6, "rgba(255,255,255,0)"); } // (wide handled by big whites)
  } else {
    // closed eyes — a happy/asleep line
    px(lex, eyy + 2, 4, 1, C.outline); px(rex, eyy + 2, 4, 1, C.outline);
  }

  /* ---- body ---- */
  const by = topY + 16 + bodyY;
  const bw = 20 - shrink, bx = cx - bw / 2 + swayX;
  px(bx, by, bw, 14 + squash, C.body);
  px(bx, by, bw, 2, C.bodyDark);
  px(bx + 4, by + 3, bw - 8, 8, C.belly);          // belly patch

  /* ---- tail ---- */
  const tailWag = (state === "sleep") ? Math.round(sin * 2) : Math.round(tri * 2);
  px(bx + bw - 1, by + 6 - tailWag, 4, 3, C.body);
  px(bx + bw + 2, by + 4 - tailWag, 2, 3, C.body);

  /* ---- arms / paws ---- */
  // front paws (also used as arms for cheer/shy/chore/thinking via armL/armR)
  px(bx + 1, by + 11 + armL, 5, 4, C.body);
  px(bx + bw - 6, by + 11 + armR, 5, 4, C.body);
  // pawing reaches one paw forward
  if (state === "pawing") px(bx + bw - 2 + pawReach, by + 8, 5, 4, C.body);
  // walking legs
  if (state === "walk") { px(bx + 2, by + 13 + legL, 4, 3, C.bodyDark); px(bx + bw - 6, by + 13 + legR, 4, 3, C.bodyDark); }

  /* ---- overlays per state ---- */
  if (state === "crying") {
    const ty = (frame % 8) * 2;                    // tears fall
    px(lex + 1, eyy + 4 + ty, 2, 3, C.tear);
    px(rex + 1, eyy + 4 + ((frame + 4) % 8) * 2, 2, 3, C.tear);
  }
  if (state === "loving") {
    for (let i = 0; i < 3; i++) {
      const hy = topY - 4 - ((frame + i * 8) % 24);
      const hxx = cx - 8 + i * 7;
      if (hy > -4) { px(hxx, hy, 3, 2, C.heart); px(hxx - 1, hy + 1, 5, 2, C.heart); px(hxx + 1, hy + 3, 1, 1, C.heart); }
    }
  }
  if (state === "thinking") {
    if (frame % 12 < 8) { px(cx + 8, topY - 8, 2, 2, C.outline); px(cx + 9, topY - 7, 2, 2, C.outline); px(cx + 8, topY - 5, 2, 2, C.outline); px(cx + 8, topY - 2, 1, 1, C.outline); }
  }
  if (state === "sleep" || state === "cuddling") {
    const zf = frame % 24;
    if (zf < 18) { const zy = topY - 6 - Math.floor(zf / 2); px(cx + 9, zy, 3, 1, C.outline); px(cx + 9, zy + 2, 3, 1, C.outline); }
  }
  if (state === "cheering") {
    if (frame % 6 < 3) { px(cx - 12, topY - 2, 2, 2, "#ffd84a"); px(cx + 12, topY - 2, 2, 2, "#ffd84a"); }
  }

  ctx.restore();
}

/* ====================================================================== */
/* REMINDER PARSING                                                         */
/* ====================================================================== */
function parseReminder(text) {
  const lower = text.toLowerCase();
  // remind me to X in N minutes/hours
  let m = lower.match(/remind me to (.+?) in (\d+)\s*(min|minute|minutes|hr|hour|hours|h|m)\b/);
  if (m) {
    const n = parseInt(m[2], 10);
    const unit = m[3];
    const ms = (/h/.test(unit) ? n * 3600000 : n * 60000);
    return { text: m[1].trim(), triggerTime: Date.now() + ms };
  }
  // remind me at HH:MM to X   /  remind me to X at HH:MM
  m = lower.match(/remind me (?:to (.+?) )?at (\d{1,2}):(\d{2})/) || lower.match(/remind me at (\d{1,2}):(\d{2}) to (.+)/);
  if (m) {
    let task, hh, mm;
    if (m.length === 4 && m[1] !== undefined && isNaN(Number(m[1]))) { task = m[1]; hh = m[2]; mm = m[3]; }
    else { hh = m[1]; mm = m[2]; task = m[3]; }
    if (hh == null) return null;
    const d = new Date(); d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return { text: (task || "your reminder").trim(), triggerTime: d.getTime() };
  }
  // I need to finish X by Y  /  my deadline for X is Y
  m = lower.match(/(?:i need to finish|my deadline for) (.+?) (?:by|is) (.+)/);
  if (m) {
    const tm = m[2].match(/(\d{1,2}):(\d{2})/);
    let trigger = Date.now() + 3600000;
    if (tm) { const d = new Date(); d.setHours(parseInt(tm[1], 10), parseInt(tm[2], 10), 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); trigger = d.getTime(); }
    return { text: m[1].trim(), triggerTime: trigger };
  }
  return null;
}
const fmtTime = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/* ====================================================================== */
/* COMPONENT                                                                */
/* ====================================================================== */
export default function PixelCat({
  theme = "green_clay",
  roaming = true,
  scale = 1,
  isPremium = false,
  apiKey = "",
  aiEnabled = false,
  onReminderFire,
  onTaskComplete,
}) {
  const TH = THEMES[theme] || THEMES.green_clay;

  /* mount guard — this is a browser-only widget; don't render during SSR */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* hidden state (persisted) */
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem("pixelcat_hidden") === "1"; } catch { return false; }
  });

  /* widget size scale (resizable). Free max 1.5x, premium 4x */
  const maxScale = isPremium ? 4 : 1.5;
  const [sizeScale, setSizeScale] = useState(() => {
    try { return clamp(Number(localStorage.getItem("pixelcat_sizescale")) || scale || 1, 1, isPremium ? 4 : 1.5); } catch { return scale || 1; }
  });
  useEffect(() => { setSizeScale((s) => clamp(s, 1, maxScale)); }, [maxScale]);

  /* React state used in DOM */
  const [bubble, setBubble] = useState(null);
  const [bubblePulse, setBubblePulse] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [menu, setMenu] = useState(null); // {x,y}
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pixelcat_chat") || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pixelcat_reminders") || "[]"); } catch { return []; }
  });
  const [, forceTick] = useState(0); // for position re-render after drag

  /* settings (cooldown / sensitivity / eye tracking) — local to widget */
  const [cfg, setCfg] = useState(() => {
    try { return { cooldown: 1.5, sensitivity: 40, eyes: true, ...JSON.parse(localStorage.getItem("pixelcat_widget_cfg") || "{}") }; }
    catch { return { cooldown: 1.5, sensitivity: 40, eyes: true }; }
  });

  /* ---- mutable animation refs (avoid per-frame React renders) ---- */
  const canvasRef = useRef(null);
  const stateRef = useRef("sleep");
  const frameRef = useRef(0);
  const flipRef = useRef(false);
  const posRef = useRef(loadPos());
  const targetXRef = useRef(posRef.current.x);
  const movingRef = useRef(false);
  const revertRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, t: 0, lastX: 0, lastY: 0 });
  const wiggleRef = useRef({ count: 0, t: 0 });
  const lastActivityRef = useRef(Date.now());
  const idleStageRef = useRef(0); // 0 active, 1 sleep, 2 cuddle
  const dragRef = useRef({ active: false, dx: 0, dy: 0, moved: 0 });
  const resizeRef = useRef({ active: false, startX: 0, startScale: 1 });
  const roamPauseRef = useRef(0);
  const typingBurstRef = useRef({ count: 0, t: 0, longStart: 0 });
  const greetedRef = useRef(false);

  function loadPos() {
    try { const v = JSON.parse(localStorage.getItem("pixelcat_pos") || "null"); if (v && typeof v.x === "number") return v; } catch {}
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    return { x: w - 220, y: h - 230 };
  }
  const savePos = useCallback(() => { try { localStorage.setItem("pixelcat_pos", JSON.stringify(posRef.current)); } catch {} }, []);

  /* ---- speech bubble helper ---- */
  const sayTimer = useRef(null);
  const say = useCallback((text, ms = 4000, pulse = false) => {
    setBubble(text); setBubblePulse(pulse);
    if (sayTimer.current) clearTimeout(sayTimer.current);
    if (ms) sayTimer.current = setTimeout(() => { setBubble(null); setBubblePulse(false); }, ms);
  }, []);

  /* ---- trigger an animation state with auto-revert ---- */
  const idleState = useCallback(() => {
    if (movingRef.current) return "walk";
    if (idleStageRef.current >= 2) return "cuddling";
    return "sleep";
  }, []);
  const trigger = useCallback((name, ms = 2000) => {
    stateRef.current = name; frameRef.current = 0;
    if (revertRef.current) clearTimeout(revertRef.current);
    if (ms) revertRef.current = setTimeout(() => { stateRef.current = idleState(); }, ms);
  }, [idleState]);

  /* mark user activity (resets idle stages) */
  const markActivity = useCallback(() => {
    const wasAway = Date.now() - lastActivityRef.current;
    lastActivityRef.current = Date.now();
    if (idleStageRef.current >= 2 && wasAway > 600000) { trigger("cheering", 2500); say("You're back!! I missed you!! 💚"); }
    idleStageRef.current = 0;
  }, [trigger, say]);

  /* ================= persistence effects ================= */
  useEffect(() => { try { localStorage.setItem("pixelcat_reminders", JSON.stringify(reminders)); } catch {} }, [reminders]);
  useEffect(() => { try { localStorage.setItem("pixelcat_chat", JSON.stringify(messages.slice(-50))); } catch {} }, [messages]);
  useEffect(() => { try { localStorage.setItem("pixelcat_widget_cfg", JSON.stringify(cfg)); } catch {} }, [cfg]);
  useEffect(() => { try { localStorage.setItem("pixelcat_sizescale", String(sizeScale)); } catch {} }, [sizeScale]);
  useEffect(() => { try { localStorage.setItem("pixelcat_hidden", hidden ? "1" : "0"); } catch {} }, [hidden]);

  /* ================= animation + movement loop ================= */
  useEffect(() => {
    if (hidden) return;
    let raf, lastFrame = performance.now();
    const loop = (now) => {
      // advance frame at 8fps
      if (now - lastFrame >= FRAME_MS) {
        lastFrame = now;
        frameRef.current = (frameRef.current + 1) % FRAMES;
        // deep sleep: loop only last 6 frames (tail wag)
        if (idleStageRef.current >= 1 && stateRef.current === "sleep" && frameRef.current < 18) frameRef.current = 18 + (frameRef.current % 6);
      }
      // roaming movement
      const roamingNow = roaming && !dragRef.current.active && Date.now() > roamPauseRef.current && idleStageRef.current < 2;
      if (roamingNow) {
        const dx = targetXRef.current - posRef.current.x;
        if (Math.abs(dx) > 3) {
          movingRef.current = true;
          if (stateRef.current === "sleep" || stateRef.current === "standing") stateRef.current = "walk";
          const step = clamp(dx, -2.5, 2.5);
          posRef.current.x = clamp(posRef.current.x + step, 4, window.innerWidth - BASE_W * sizeScale - 4);
          flipRef.current = step < 0;
        } else {
          if (movingRef.current) { movingRef.current = false; if (stateRef.current === "walk") stateRef.current = idleState(); }
          // pick a new target, turning around at edges
          const margin = BASE_W * sizeScale + 20;
          targetXRef.current = 8 + Math.random() * Math.max(40, window.innerWidth - margin);
        }
      } else if (movingRef.current && !dragRef.current.active) {
        movingRef.current = false; if (stateRef.current === "walk") stateRef.current = idleState();
      }
      // redraw
      const cv = canvasRef.current;
      if (cv) {
        const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
        // eye tracking
        const rect = cv.getBoundingClientRect();
        const ccx = rect.left + rect.width / 2, ccy = rect.top + rect.height / 2;
        let edx = 0, edy = 0;
        if (cfg.eyes) { edx = clamp((mouseRef.current.x - ccx) / 60, -1, 1); edy = clamp((mouseRef.current.y - ccy) / 60, -1, 1); }
        drawCat(ctx, stateRef.current, frameRef.current, { flip: flipRef.current, eyeDX: edx, eyeDY: edy, showEyes: true });
        cv.style.left = posRef.current.x + "px";
        cv.parentElement.style.left = posRef.current.x + "px";
        cv.parentElement.style.top = posRef.current.y + "px";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hidden, roaming, sizeScale, cfg.eyes, idleState]);

  /* ================= behavior sensors ================= */
  useEffect(() => {
    if (hidden) return;
    let cooldownUntil = 0;
    const cd = () => Date.now() < cooldownUntil;
    const setCd = () => { cooldownUntil = Date.now() + cfg.cooldown * 1000; };

    const onKey = (e) => {
      // global shortcut handled separately
      markActivity();
      const now = Date.now();
      // fast burst typing
      if (now - typingBurstRef.current.t < 1000) typingBurstRef.current.count++;
      else { typingBurstRef.current.count = 1; typingBurstRef.current.t = now; }
      if (typingBurstRef.current.count >= 5 && now - (typingBurstRef.current.lastWarn || 0) > 4000) {
        typingBurstRef.current.lastWarn = now; say("Woah slow down!! 🐾", 2500);
      }
      // continuous typing → chore after 5s
      if (!typingBurstRef.current.longStart) typingBurstRef.current.longStart = now;
      if (now - typingBurstRef.current.longStart > 5000) trigger("chore", 2500);
      else if (!cd()) { trigger("pawing", 2000); }
      typingBurstRef.current.lastType = now;
    };
    const onWheel = (e) => {
      markActivity();
      if (!cd()) trigger("chore", 2000);
      if (Math.abs(e.deltaY) > 200) say("Scrolling so fast 🌀", 2000);
    };
    const onMove = (e) => {
      const m = mouseRef.current; const now = performance.now();
      const dt = now - (m.t || now); const dist = Math.hypot(e.clientX - m.x, e.clientY - m.y);
      const speed = dt > 0 ? (dist / dt) * 1000 : 0;
      m.lastX = m.x; m.lastY = m.y; m.x = e.clientX; m.y = e.clientY; m.t = now;
      markActivity();
      // fast cursor → alert
      if (speed > 800 && !cd()) { setCd(); trigger("alert", 1500); say("Woah!! 👀", 1500); }
      // wiggle over cat → loving
      const cv = canvasRef.current; if (!cv) return;
      const r = cv.getBoundingClientRect();
      const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (over && dist < cfg.sensitivity && dist > 2) {
        const w = wiggleRef.current; if (now - w.t < 400) w.count++; else w.count = 1; w.t = now;
        if (w.count >= 4) { trigger("loving", 1500); say("Purrrr~ 💚", 1500); w.count = 0; }
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("wheel", onWheel); window.removeEventListener("mousemove", onMove); };
  }, [hidden, cfg.cooldown, cfg.sensitivity, markActivity, trigger, say]);

  /* idle timers: 30s no-move sleep, 3min deep sleep, 10min cuddle, typing-stop yawn */
  useEffect(() => {
    if (hidden) return;
    const iv = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      // typing stopped for 10s → yawn back to sleep
      const tb = typingBurstRef.current;
      if (tb.lastType && Date.now() - tb.lastType > 10000 && tb.longStart) { tb.longStart = 0; say("zzz... back to napping~", 3000); trigger("sleep", 0); }
      if (idleMs > 600000 && idleStageRef.current < 2) { idleStageRef.current = 2; trigger("cuddling", 0); say("I missed you... 🥺"); }
      else if (idleMs > 180000 && idleStageRef.current < 1) { idleStageRef.current = 1; trigger("sleep", 0); say("zzz 💤", 5000); }
      else if (idleMs > 30000 && idleStageRef.current === 0 && stateRef.current !== "sleep") { trigger("sleep", 0); }
    }, 5000);
    // 45s idle encouragement
    const enc = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 30000) say(IDLE_MSGS[Math.floor(Math.random() * IDLE_MSGS.length)], 3500);
    }, 45000);
    return () => { clearInterval(iv); clearInterval(enc); };
  }, [hidden, say, trigger]);

  /* CPU/RAM spike sim (20% every 30s) */
  useEffect(() => {
    if (hidden) return;
    const iv = setInterval(() => { if (Math.random() < 0.2) { trigger("crying", 4000); say("CPU/RAM 🔥 I'm melting!!", 4000, true); } }, 30000);
    return () => clearInterval(iv);
  }, [hidden, trigger, say]);

  /* battery API */
  useEffect(() => {
    if (hidden || !navigator.getBattery) return;
    let batt, prevCharging;
    let iv;
    navigator.getBattery().then((b) => {
      batt = b; prevCharging = b.charging;
      const check = () => {
        if (b.charging && !prevCharging) { trigger("cheering", 2500); say("Charging! Thank you~ ⚡"); }
        prevCharging = b.charging;
        if (!b.charging && b.level < 0.2) { trigger("crying", 4000); say(`Battery ${Math.round(b.level * 100)}%!! Plug me in!! 🔋`, 4000, true); }
      };
      iv = setInterval(check, 60000); check();
    }).catch(() => {});
    return () => { if (iv) clearInterval(iv); };
  }, [hidden, trigger, say]);

  /* time-of-day reactions (hourly check) */
  useEffect(() => {
    if (hidden) return;
    const iv = setInterval(() => {
      const h = new Date().getHours();
      if (h >= 12 && h < 13) { trigger("thinking", 3000); say("Lunch time? 🍱 Don't skip it!"); }
      else if (h >= 17 && h < 18) { trigger("standing", 3000); say("Almost done for today! 💪"); }
      else if (h >= 22) { trigger("cuddling", 4000); say("It's late... rest soon 🌙"); }
    }, 30 * 60000);
    return () => clearInterval(iv);
  }, [hidden, trigger, say]);

  /* ================= reminders polling + scheduling ================= */
  const fireReminder = useCallback((r) => {
    trigger("alert", 7000);
    say(`⏰ REMINDER: ${r.text}`, 7000, true);
    setMessages((m) => [...m, { role: "assistant", text: `⏰ Reminder: ${r.text}`, ts: Date.now() }]);
    if (onReminderFire) try { onReminderFire(r.text); } catch {}
  }, [trigger, say, onReminderFire]);

  useEffect(() => {
    if (hidden) return;
    const iv = setInterval(() => {
      const now = Date.now();
      let fired = false;
      setReminders((rs) => rs.map((r) => {
        if (!r.done && r.triggerTime <= now && !r.fired) { fireReminder(r); fired = true; return { ...r, fired: true, done: true }; }
        return r;
      }));
      if (fired) {/* state already updated */}
    }, 30000);
    // also a fast 5s check so a just-set short reminder fires promptly
    const fast = setInterval(() => {
      const now = Date.now();
      setReminders((rs) => rs.map((r) => (!r.done && !r.fired && r.triggerTime <= now ? (fireReminder(r), { ...r, fired: true, done: true }) : r)));
    }, 5000);
    return () => { clearInterval(iv); clearInterval(fast); };
  }, [hidden, fireReminder]);

  const addReminder = useCallback((text, triggerTime) => {
    const r = { id: String(Date.now()) + Math.random().toString(36).slice(2, 6), text, triggerTime, done: false, fired: false, createdAt: Date.now() };
    setReminders((rs) => [...rs, r]);
    trigger("cheering", 2000);
    say(`Got it! I'll remind you at ${fmtTime(triggerTime)} ⏰`);
    return r;
  }, [trigger, say]);

  /* ================= chat (free rules + premium AI) ================= */
  const freeReply = useCallback((textRaw) => {
    const text = textRaw.toLowerCase().trim();
    if (/^(hi|hello|hey|sup|yo)\b/.test(text)) return CAT_GREETS[Math.floor(Math.random() * CAT_GREETS.length)];
    if (/how are you/.test(text)) return "I'm purr-fect! 💚";
    const rem = parseReminder(text);
    if (rem) { addReminder(rem.text, rem.triggerTime); return `Okay! Reminder set for "${rem.text}" at ${fmtTime(rem.triggerTime)} ⏰`; }
    if (/\b(done|finished|completed)\b/.test(text)) {
      setReminders((rs) => { const i = rs.findIndex((r) => !r.done); if (i >= 0) { const c = rs.slice(); c[i] = { ...c[i], done: true }; return c; } return rs; });
      trigger("cheering", 2500); if (onTaskComplete) try { onTaskComplete(); } catch {}
      return "Yesss!! You did it!! 🎉";
    }
    if (/\b(cpu|ram|battery|health|status)\b/.test(text)) {
      const cpu = 10 + Math.floor(Math.random() * 60), ram = 30 + Math.floor(Math.random() * 50);
      trigger("thinking", 2000);
      return `CPU ~${cpu}% · RAM ~${ram}% · battery looks fine 🔋 mrr~`;
    }
    if (/what time/.test(text)) return `It's ${new Date().toLocaleTimeString()} ⏰`;
    if (/what day|today/.test(text)) return `Today is ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} 📅`;
    if (/\b(tired|exhausted|burnout|stressed|overwhelmed|deadline)\b/.test(text)) { trigger("shy", 3000); say("Hey... take a breath 🫁 You've got this 💚"); return "Hey… take a breath 🫁 Want a 5-minute break reminder? Just say \"remind me to rest in 5 minutes\"."; }
    if (/\b(stuck|help|lost|confused)\b/.test(text)) { trigger("cheering", 2000); return "You've got this!! Break it into tiny steps — I believe in you 💪💚"; }
    if (/\b(bye|goodbye|night|cya|see you)\b/.test(text)) { trigger("loving", 2000); return "Bye bye~ come back soon! 💚🐾"; }
    if (/my reminders|list reminders/.test(text)) {
      const active = reminders.filter((r) => !r.done);
      if (!active.length) return "No active reminders — you're all caught up! 🌿";
      return "Your reminders:\n" + active.map((r) => `• ${r.text} @ ${fmtTime(r.triggerTime)}`).join("\n");
    }
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }, [addReminder, reminders, trigger, say, onTaskComplete]);

  const callClaude = useCallback(async (history) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: history.slice(-10).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
      }),
    });
    if (!res.ok) throw new Error("api " + res.status);
    const data = await res.json();
    return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  }, [apiKey]);

  const scanForHints = useCallback((history) => {
    if (!isPremium) return;
    const recent = history.slice(-10).filter((m) => m.role === "user").map((m) => m.text).join(" ").toLowerCase();
    const m = recent.match(/(meeting|call|deadline|submit) (?:at |by )?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (m && !reminders.some((r) => !r.done)) {
      const label = m[1];
      setTimeout(() => say(`I noticed you mentioned a ${label} — want me to remind you? 🐾 (say "yes")`, 6000), 800);
    }
  }, [isPremium, reminders, say]);

  const send = useCallback(async () => {
    const text = input.trim(); if (!text) return;
    setInput("");
    const userMsg = { role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    markActivity();

    // "yes" right after a hint → set a default 1h reminder
    if (/^(yes|yeah|yep|sure|ok|okay)\b/i.test(text) && isPremium) {
      const last = [...messages].reverse().find((m) => m.role === "user");
      const rem = parseReminder((last && last.text) || "") || { text: "your task", triggerTime: Date.now() + 3600000 };
      addReminder(rem.text, rem.triggerTime);
    }

    if (aiEnabled && isPremium && apiKey) {
      setTyping(true);
      try {
        const reply = await callClaude([...messages, userMsg]);
        let shown = reply;
        const setM = reply.match(/SET_REMINDER:\[([^\]]+)\]\|\[?(\d{1,2}:\d{2})\]?/);
        if (setM) {
          const [hh, mm] = setM[2].split(":");
          const d = new Date(); d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
          addReminder(setM[1].trim(), d.getTime());
          shown = reply.replace(/SET_REMINDER:.*/g, "").trim() || `Got it! I'll remind you at ${setM[2]} ⏰`;
        }
        setMessages((m) => [...m, { role: "assistant", text: shown || "mrr~ 💚", ts: Date.now() }]);
        scanForHints([...messages, userMsg]);
      } catch {
        setMessages((m) => [...m, { role: "assistant", text: freeReply(text), ts: Date.now() }]);
      } finally { setTyping(false); }
    } else {
      // free / non-premium
      const complex = text.split(" ").length > 8 && !parseReminder(text) && !/^(hi|hello|hey)/.test(text.toLowerCase());
      const reply = (complex && !isPremium) ? "Purr~ upgrade to Premium for AI! 🐾" : freeReply(text);
      setTimeout(() => setMessages((m) => [...m, { role: "assistant", text: reply, ts: Date.now() }]), 250);
    }
  }, [input, messages, aiEnabled, isPremium, apiKey, callClaude, freeReply, addReminder, scanForHints, markActivity]);

  /* ================= external trigger + global shortcut ================= */
  useEffect(() => {
    const onTrigger = (e) => { const s = e?.detail?.state; if (s && STATES.includes(s)) { markActivity(); trigger(s, e?.detail?.ms || 3000); } };
    const onKeyShort = (e) => { if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) { e.preventDefault(); setHidden((h) => !h); } };
    window.addEventListener("pixelcat:trigger", onTrigger);
    window.addEventListener("keydown", onKeyShort);
    return () => { window.removeEventListener("pixelcat:trigger", onTrigger); window.removeEventListener("keydown", onKeyShort); };
  }, [trigger, markActivity]);

  /* startup greeting */
  useEffect(() => {
    if (hidden || greetedRef.current) return;
    greetedRef.current = true;
    const t = setTimeout(() => {
      trigger("cheering", 3000);
      const h = new Date().getHours();
      const g = GREETINGS.find((x) => h < x.until) || GREETINGS[GREETINGS.length - 1];
      say(g.text, 5000);
    }, 2000);
    return () => clearTimeout(t);
  }, [hidden, trigger, say]);

  /* keep cat on screen when window resizes */
  useEffect(() => {
    const onResize = () => {
      posRef.current.x = clamp(posRef.current.x, 4, window.innerWidth - BASE_W * sizeScale - 4);
      posRef.current.y = clamp(posRef.current.y, 4, window.innerHeight - BASE_H * sizeScale - 4);
      savePos();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sizeScale, savePos]);

  /* ================= drag + resize handlers ================= */
  const onCatMouseDown = (e) => {
    if (e.button === 2) return; // right click → context menu
    e.preventDefault();
    dragRef.current = { active: true, dx: e.clientX - posRef.current.x, dy: e.clientY - posRef.current.y, moved: 0 };
    roamPauseRef.current = Infinity;
    const move = (ev) => {
      if (!dragRef.current.active) return;
      const nx = clamp(ev.clientX - dragRef.current.dx, 0, window.innerWidth - BASE_W * sizeScale);
      const ny = clamp(ev.clientY - dragRef.current.dy, 0, window.innerHeight - BASE_H * sizeScale);
      dragRef.current.moved += Math.abs(ev.clientX - (posRef.current.x + dragRef.current.dx)) ;
      posRef.current.x = nx; posRef.current.y = ny;
    };
    const up = (ev) => {
      window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up);
      const moved = Math.hypot(ev.clientX - (dragRef.current.dx + posRef.current.x), 0);
      const wasClick = dragRef.current.moved < 6;
      dragRef.current.active = false;
      savePos();
      roamPauseRef.current = Date.now() + 3000; // resume roaming 3s after drag
      targetXRef.current = posRef.current.x;
      if (wasClick) { setChatOpen((c) => !c); markActivity(); }
    };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };

  const onResizeDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    resizeRef.current = { active: true, startX: e.clientX, startScale: sizeScale };
    const move = (ev) => {
      if (!resizeRef.current.active) return;
      const delta = (ev.clientX - resizeRef.current.startX) / 150;
      setSizeScale(clamp(resizeRef.current.startScale + delta, 1, maxScale));
    };
    const up = () => { resizeRef.current.active = false; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };

  const onContext = (e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); };

  /* ================= styles ================= */
  const pixelFont = '"Press Start 2P", monospace';
  const W = BASE_W * sizeScale, H = BASE_H * sizeScale;
  const chatOnRight = posRef.current.x < 340;

  if (!mounted) return null;

  /* toggle button (always visible) */
  const toggleBtn = (
    <button
      onClick={() => setHidden((h) => !h)}
      title={hidden ? "Show Pixel Cat (Ctrl+Shift+P)" : "Hide Pixel Cat (Ctrl+Shift+P)"}
      style={{
        position: "fixed", right: 16, bottom: 16, zIndex: 10000,
        width: 40, height: 40, cursor: "pointer",
        background: TH.panel, color: TH.text, border: `3px solid ${TH.accent}`,
        borderRadius: 0, fontFamily: pixelFont, fontSize: 16, lineHeight: 1,
        display: "grid", placeItems: "center", padding: 0, boxShadow: "none",
      }}
    >
      {hidden ? "🐱" : "👁"}
    </button>
  );

  if (hidden) {
    return (<><FontInjector /> {toggleBtn}</>);
  }

  return (
    <>
      <FontInjector />
      {toggleBtn}

      {/* ---- cat widget ---- */}
      <div
        style={{ position: "fixed", left: posRef.current.x, top: posRef.current.y, zIndex: 9999, width: W, height: H }}
      >
        {/* speech bubble */}
        {bubble && (
          <div
            onClick={() => setBubble(null)}
            style={{
              position: "absolute", bottom: H + 6, left: "50%", transform: "translateX(-50%)",
              maxWidth: 220, minWidth: 80, background: TH.catBubble, color: TH.text,
              border: `3px solid ${TH.border}`, borderRadius: 0, padding: "8px 10px",
              fontFamily: pixelFont, fontSize: 9, lineHeight: 1.6, whiteSpace: "pre-wrap",
              textAlign: "center", cursor: "pointer", boxShadow: "none",
              animation: bubblePulse ? "pcPulse 1s steps(2) infinite" : "none",
            }}
          >
            {bubble}
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={BASE_W}
          height={BASE_H}
          onMouseDown={onCatMouseDown}
          onContextMenu={onContext}
          style={{ width: W, height: H, imageRendering: "pixelated", cursor: "grab", display: "block", touchAction: "none" }}
        />

        {/* resize handle */}
        <div
          onMouseDown={onResizeDown}
          title="Drag to resize"
          style={{ position: "absolute", right: -2, bottom: -2, width: 12, height: 12, cursor: "nwse-resize", background: TH.accent, border: `2px solid ${TH.panel}`, zIndex: 2 }}
        />
      </div>

      {/* ---- context menu ---- */}
      {menu && (
        <>
          <div onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} style={{ position: "fixed", inset: 0, zIndex: 10001 }} />
          <div style={{ position: "fixed", left: clamp(menu.x, 0, window.innerWidth - 180), top: clamp(menu.y, 0, window.innerHeight - 320), zIndex: 10002, width: 178, background: TH.panel, border: `3px solid ${TH.border}`, fontFamily: pixelFont, fontSize: 8, color: TH.text, maxHeight: 340, overflowY: "auto" }}>
            {STATES.map((s) => (
              <button key={s} onClick={() => { trigger(s, 3000); setMenu(null); }} style={menuItem(TH)}>{s}</button>
            ))}
            <div style={{ height: 2, background: TH.border }} />
            <button onClick={() => { const cpu = 10 + Math.floor(Math.random() * 60), ram = 30 + Math.floor(Math.random() * 50); say(`CPU ${cpu}% · RAM ${ram}% 🔋`, 4000); trigger("thinking", 2000); setMenu(null); }} style={menuItem(TH)}>💻 PC Health</button>
            <button onClick={() => { setSettingsOpen(true); setMenu(null); }} style={menuItem(TH)}>⚙️ Settings</button>
            <button onClick={() => { setHidden(true); setMenu(null); }} style={menuItem(TH)}>❌ Close</button>
          </div>
        </>
      )}

      {/* ---- chat popup ---- */}
      {chatOpen && (
        <ChatPopup
          TH={TH} pixelFont={pixelFont} isPremium={isPremium} chatOnRight={chatOnRight}
          catX={posRef.current.x} catY={posRef.current.y} catH={H}
          messages={messages} input={input} setInput={setInput} send={send} typing={typing}
          reminders={reminders} setReminders={setReminders}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* ---- settings modal ---- */}
      {settingsOpen && (
        <SettingsModal
          TH={TH} pixelFont={pixelFont} cfg={cfg} setCfg={setCfg}
          sizeScale={sizeScale} setSizeScale={setSizeScale} maxScale={maxScale}
          isPremium={isPremium}
          onClearReminders={() => setReminders([])}
          onResetPos={() => { posRef.current = { x: window.innerWidth - 220, y: window.innerHeight - 230 }; savePos(); forceTick((n) => n + 1); }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------- chat */
function ChatPopup({ TH, pixelFont, isPremium, chatOnRight, catX, catY, catH, messages, input, setInput, send, typing, reminders, setReminders, onClose }) {
  const scrollRef = useRef(null);
  const [showReminders, setShowReminders] = useState(false);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, typing]);

  const left = chatOnRight ? clamp(catX + 200, 8, window.innerWidth - 328) : clamp(catX - 332, 8, window.innerWidth - 328);
  const top = clamp(catY + catH - 420, 8, Math.max(8, window.innerHeight - 428));
  const active = reminders.filter((r) => !r.done);

  return (
    <div style={{ position: "fixed", left, top, width: 320, height: 420, zIndex: 10003, background: TH.bg, border: `3px solid ${TH.border}`, fontFamily: pixelFont, color: TH.text, display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ background: TH.panel, borderBottom: `3px solid ${TH.border}`, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 9 }}>
        <span>🐱 Pixel Cat</span>
        {isPremium && <span style={{ background: TH.accent, color: TH.bg, padding: "2px 4px", fontSize: 7 }}>✨ PREMIUM</span>}
        <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: "none", color: TH.text, cursor: "pointer", fontFamily: pixelFont, fontSize: 10 }}>✕</button>
      </div>

      {/* reminders strip */}
      <div style={{ borderBottom: `3px solid ${TH.border}` }}>
        <button onClick={() => setShowReminders((s) => !s)} style={{ width: "100%", textAlign: "left", background: TH.panel, color: TH.text, border: "none", padding: "5px 10px", fontFamily: pixelFont, fontSize: 7, cursor: "pointer" }}>
          {showReminders ? "▼" : "▶"} reminders ({active.length})
        </button>
        {showReminders && (
          <div style={{ maxHeight: 90, overflowY: "auto", padding: active.length ? "4px 8px" : "6px 8px", background: TH.bg, fontSize: 7 }}>
            {active.length === 0 && <div style={{ opacity: 0.7 }}>none yet — say "remind me to…"</div>}
            {active.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", lineHeight: 1.5 }}>
                <button onClick={() => setReminders((rs) => rs.map((x) => (x.id === r.id ? { ...x, done: true } : x)))} title="mark done" style={{ background: "transparent", border: `2px solid ${TH.accent}`, width: 12, height: 12, cursor: "pointer", padding: 0, color: TH.accent }}>✓</button>
                <span style={{ flex: 1 }}>{r.text}</span>
                <span style={{ opacity: 0.7 }}>{fmtTime(r.triggerTime)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && <div style={{ fontSize: 7, opacity: 0.7, lineHeight: 1.8 }}>Mrrrow! Type to chat 🐾{"\n"}Try: "remind me to stretch in 20 minutes"</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div style={{ background: m.role === "user" ? TH.userBubble : TH.catBubble, color: TH.text, border: `3px solid ${TH.border}`, padding: "6px 8px", fontSize: 8, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
            {m.ts && <div style={{ fontSize: 6, opacity: 0.5, marginTop: 2, textAlign: m.role === "user" ? "right" : "left" }}>{fmtTime(m.ts)}</div>}
          </div>
        ))}
        {typing && <div style={{ alignSelf: "flex-start", background: TH.catBubble, border: `3px solid ${TH.border}`, padding: "6px 10px", fontSize: 9 }}><span style={{ animation: "pcDots 1.2s steps(4) infinite" }}>…</span></div>}
      </div>

      {/* input */}
      <div style={{ borderTop: `3px solid ${TH.border}`, padding: 6, display: "flex", gap: 6, background: TH.panel }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="say something…"
          style={{ flex: 1, background: TH.bg, color: TH.text, border: `3px solid ${TH.border}`, padding: "6px 8px", fontFamily: pixelFont, fontSize: 8, outline: "none", borderRadius: 0 }}
        />
        <button onClick={send} style={{ background: TH.accent, color: TH.bg, border: "none", padding: "0 10px", fontFamily: pixelFont, fontSize: 8, cursor: "pointer", borderRadius: 0 }}>►</button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- settings */
function SettingsModal({ TH, pixelFont, cfg, setCfg, sizeScale, setSizeScale, maxScale, isPremium, onClearReminders, onResetPos, onClose }) {
  const row = { marginBottom: 12 };
  const label = { fontSize: 8, marginBottom: 6, display: "block", lineHeight: 1.6 };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10004, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 320, maxHeight: "80vh", overflowY: "auto", background: TH.bg, border: `3px solid ${TH.border}`, fontFamily: pixelFont, color: TH.text, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14, fontSize: 10 }}>
          ⚙️ Settings
          <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: "none", color: TH.text, cursor: "pointer", fontFamily: pixelFont, fontSize: 11 }}>✕</button>
        </div>

        <div style={row}>
          <span style={label}>Reaction cooldown: {cfg.cooldown.toFixed(1)}s</span>
          <input type="range" min={0.5} max={5} step={0.5} value={cfg.cooldown} onChange={(e) => setCfg((c) => ({ ...c, cooldown: Number(e.target.value) }))} style={{ width: "100%", accentColor: TH.accent }} />
        </div>
        <div style={row}>
          <span style={label}>Pat sensitivity: {cfg.sensitivity}px</span>
          <input type="range" min={20} max={80} step={5} value={cfg.sensitivity} onChange={(e) => setCfg((c) => ({ ...c, sensitivity: Number(e.target.value) }))} style={{ width: "100%", accentColor: TH.accent }} />
        </div>
        <div style={row}>
          <span style={label}>Cat size: {sizeScale.toFixed(1)}x {!isPremium && sizeScale >= 1.5 ? "🔒" : ""}</span>
          <input type="range" min={1} max={maxScale} step={0.5} value={sizeScale} onChange={(e) => setSizeScale(Number(e.target.value))} style={{ width: "100%", accentColor: TH.accent }} />
          {!isPremium && <div style={{ fontSize: 6, opacity: 0.7, marginTop: 4 }}>🔒 up to 4x with Premium</div>}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 8, marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={cfg.eyes} onChange={(e) => setCfg((c) => ({ ...c, eyes: e.target.checked }))} style={{ accentColor: TH.accent }} />
          Cursor eye tracking
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClearReminders} style={{ flex: 1, background: TH.panel, color: TH.text, border: `3px solid ${TH.border}`, padding: "8px 4px", fontFamily: pixelFont, fontSize: 7, cursor: "pointer" }}>Clear reminders</button>
          <button onClick={onResetPos} style={{ flex: 1, background: TH.panel, color: TH.text, border: `3px solid ${TH.border}`, padding: "8px 4px", fontFamily: pixelFont, fontSize: 7, cursor: "pointer" }}>Reset position</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- small helpers */
function menuItem(TH) {
  return { display: "block", width: "100%", textAlign: "left", background: "transparent", color: TH.text, border: "none", borderBottom: `1px solid ${TH.border}33`, padding: "6px 8px", fontFamily: '"Press Start 2P", monospace', fontSize: 8, cursor: "pointer" };
}

function FontInjector() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      @keyframes pcPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }
      @keyframes pcDots { 0% { opacity: 0.3 } 50% { opacity: 1 } 100% { opacity: 0.3 } }
    `}</style>
  );
}
