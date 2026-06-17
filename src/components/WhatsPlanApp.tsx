// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { classifyMessages } from "@/lib/classify";
import {
  MessageSquare, Phone, Kanban, Award, Settings as SettingsIcon,
  Search, Plus, Send, Paperclip, Smile, Mic, MoreVertical, Lock,
  Palette, User, LogOut, Flame, Trophy, Star, ShieldCheck, Sparkles,
  Calendar as CalendarIcon, ListChecks, StickyNote, Table as TableIcon,
  GitBranch, Columns3, Pencil, Trash2, Check, X, ChevronRight, ChevronDown,
  Mail, KeyRound, ArrowRight, Heart, Loader2, Zap, AlertTriangle, Info,
  ClipboardPaste, RotateCcw, ExternalLink,
} from "lucide-react";

/* ====================================================================== */
/* THEMES — every theme uses the WhatsApp green palette                   */
/* ====================================================================== */
const THEMES = {
  default: {
    name: "WhatsApp Classic",
    blurb: "The familiar WhatsApp Web look.",
    bg: "wa-bg-default",
    swatch: ["#00a884", "#d9fdd3", "#f0f2f5", "#111b21"],
    sidebar: "bg-white border-r border-[#e9edef]",
    topbar: "bg-[#f0f2f5] text-[#111b21] border-b border-[#e9edef]",
    panel: "bg-white border border-[#e9edef] rounded-xl shadow-sm",
    panelSoft: "bg-[#f7f8fa] border border-[#e9edef] rounded-lg",
    accent: "bg-[#00a884] text-white",
    chipActive: "bg-[#00a884] text-white",
    chipIdle: "bg-white text-[#54656f] border border-[#e9edef] hover:bg-[#f0f2f5]",
    bubbleMe: "bg-[#d9fdd3] text-[#111b21]",
    bubbleThem: "bg-white text-[#111b21] border border-[#e9edef]",
    input: "bg-white border border-[#e9edef] text-[#111b21] placeholder:text-[#8696a0]",
    btn: "bg-[#00a884] text-white hover:bg-[#017561]",
    btnGhost: "bg-transparent text-[#00a884] hover:bg-[#e7f5f1]",
    column: "bg-[#f7f8fa] border border-[#e9edef] rounded-xl",
    card: "bg-white border border-[#e9edef] rounded-lg hover:shadow-md",
    text: "text-[#111b21]",
    muted: "text-[#54656f]",
    badge: "bg-white border border-[#e9edef]",
    avatarRing: "ring-2 ring-[#00a884]/30",
  },
  dark: {
    name: "WhatsApp Dark",
    blurb: "Low-light, easy on the eyes.",
    bg: "wa-bg-dark",
    swatch: ["#005c4b", "#25d366", "#202c33", "#0b141a"],
    sidebar: "bg-[#111b21] border-r border-white/5",
    topbar: "bg-[#202c33] text-[#e9edef] border-b border-white/5",
    panel: "bg-[#111b21] border border-white/5 rounded-xl shadow-xl",
    panelSoft: "bg-[#1a262e] border border-white/5 rounded-lg",
    accent: "bg-[#00a884] text-white",
    chipActive: "bg-[#00a884] text-white",
    chipIdle: "bg-white/5 text-[#aebac1] border border-white/10 hover:bg-white/10",
    bubbleMe: "bg-[#005c4b] text-[#e9edef]",
    bubbleThem: "bg-[#202c33] text-[#e9edef] border border-white/5",
    input: "bg-[#2a3942] border border-white/5 text-[#e9edef] placeholder:text-[#8696a0]",
    btn: "bg-[#00a884] text-[#0b141a] hover:bg-[#25d366]",
    btnGhost: "bg-white/5 text-[#25d366] hover:bg-white/10",
    column: "bg-[#1a262e] border border-white/5 rounded-xl",
    card: "bg-[#202c33] border border-white/5 rounded-lg hover:border-[#00a884]/40",
    text: "text-[#e9edef]",
    muted: "text-[#8696a0]",
    badge: "bg-white/5 border border-white/10 text-[#e9edef]",
    avatarRing: "ring-2 ring-[#25d366]/50",
  },
  brutal: {
    name: "Neo-Brutalist Green",
    blurb: "Bold borders, hard shadows.",
    bg: "wa-bg-brutal",
    swatch: ["#25d366", "#0a0a0a", "#fffbe8", "#128c7e"],
    sidebar: "bg-[#25d366] border-r-[4px] border-black",
    topbar: "bg-white border-b-[4px] border-black",
    panel: "bg-white border-[4px] border-black rounded-lg shadow-[6px_6px_0_0_#000]",
    panelSoft: "bg-[#fffbe8] border-[3px] border-black rounded-lg shadow-[4px_4px_0_0_#000]",
    accent: "bg-black text-[#25d366]",
    chipActive: "bg-black text-[#25d366] border-[3px] border-black shadow-[4px_4px_0_0_#000]",
    chipIdle: "bg-white text-black border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all",
    bubbleMe: "bg-[#25d366] text-black border-[3px] border-black shadow-[4px_4px_0_0_#000]",
    bubbleThem: "bg-white text-black border-[3px] border-black shadow-[4px_4px_0_0_#000]",
    input: "bg-white border-[3px] border-black text-black placeholder:text-black/50 rounded-md font-bold focus:shadow-[4px_4px_0_0_#000] outline-none transition-shadow",
    btn: "bg-[#25d366] text-black border-[3px] border-black hover:bg-[#128c7e] hover:text-white shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all font-bold",
    btnGhost: "bg-white text-black border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:bg-[#d9fdd3] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all font-bold",
    column: "bg-[#fffbe8] border-[4px] border-black rounded-lg shadow-[6px_6px_0_0_#000]",
    card: "bg-[#d9fdd3] border-[3px] border-black rounded-md shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all",
    text: "text-black font-semibold",
    muted: "text-black/70 font-medium",
    badge: "bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] font-bold",
    avatarRing: "ring-[3px] ring-black",
  },
  skeuo: {
    name: "Skeuomorphic",
    blurb: "Glossy, tactile, real.",
    bg: "wa-bg-skeuo",
    swatch: ["#128c7e", "#25d366", "#eaf6ee", "#0b2a22"],
    sidebar: "skeuo",
    topbar: "skeuo",
    panel: "skeuo",
    panelSoft: "skeuo",
    accent: "skeuo-btn",
    chipActive: "skeuo-btn",
    chipIdle: "skeuo",
    bubbleMe: "skeuo-btn",
    bubbleThem: "skeuo",
    input: "bg-white border border-[#b9d3c4] rounded-xl shadow-inner text-[#0b2a22] placeholder:text-[#5a7b6e]",
    btn: "skeuo-btn",
    btnGhost: "skeuo",
    column: "skeuo",
    card: "skeuo",
    text: "text-[#0b2a22]",
    muted: "text-[#5a7b6e]",
    badge: "skeuo",
    avatarRing: "ring-2 ring-[#128c7e]/40",
  },
  clay: {
    name: "Claymorphism",
    blurb: "Soft, puffy, friendly.",
    bg: "wa-bg-clay",
    swatch: ["#25d366", "#a7e3c0", "#e6f4ec", "#11352b"],
    sidebar: "clay",
    topbar: "clay-soft",
    panel: "clay",
    panelSoft: "clay-soft",
    accent: "clay-soft bg-[#25d366]! text-white",
    chipActive: "clay-soft bg-[#25d366] text-white",
    chipIdle: "clay-soft text-[#11352b]",
    bubbleMe: "clay-soft bg-[#bff0d2] text-[#11352b]",
    bubbleThem: "clay-soft text-[#11352b]",
    input: "clay-inset text-[#11352b] placeholder:text-[#5a7b6e] px-4 py-2",
    btn: "clay-soft bg-[#25d366] text-white hover:bg-[#1ec25b]",
    btnGhost: "clay-soft text-[#128c7e]",
    column: "clay",
    card: "clay-soft",
    text: "text-[#11352b]",
    muted: "text-[#5a7b6e]",
    badge: "clay-soft",
    avatarRing: "ring-4 ring-white",
  },
  glass: {
    name: "Glassmorphism",
    blurb: "Frosted glass over green aurora.",
    bg: "wa-bg-glass",
    swatch: ["#25d366", "#ffffff80", "#064e3b", "#ecfdf5"],
    sidebar: "glass",
    topbar: "glass",
    panel: "glass-strong",
    panelSoft: "glass",
    accent: "glass-strong bg-[#25d366]/40 text-white",
    chipActive: "glass-strong bg-[#25d366]/50 text-white",
    chipIdle: "glass text-white/80 hover:bg-white/15",
    bubbleMe: "glass bg-[#25d366]/40 text-white",
    bubbleThem: "glass text-white",
    input: "glass text-white placeholder:text-white/50 px-3 py-2",
    btn: "glass-strong bg-[#25d366]/50 text-white hover:bg-[#25d366]/70",
    btnGhost: "glass text-white",
    column: "glass-strong",
    card: "glass",
    text: "text-white",
    muted: "text-white/70",
    badge: "glass",
    avatarRing: "ring-2 ring-white/50",
  },
  neon: {
    name: "Neon Glow",
    blurb: "Cyberpunk WhatsApp green.",
    bg: "wa-bg-neon",
    swatch: ["#25d366", "#5eead4", "#050a08", "#0a1410"],
    sidebar: "neon",
    topbar: "neon",
    panel: "neon",
    panelSoft: "neon",
    accent: "neon-btn",
    chipActive: "neon-btn neon-text",
    chipIdle: "bg-[#0a1410] border border-[#25d366]/30 text-[#5eead4] hover:border-[#25d366]/60",
    bubbleMe: "neon bg-[#0e3a2e] text-[#5eead4] neon-text",
    bubbleThem: "bg-[#0a1410] border border-[#25d366]/20 text-[#a7f3d0]",
    input: "bg-[#0a1410] border border-[#25d366]/30 text-[#5eead4] placeholder:text-[#5eead4]/40 rounded-lg",
    btn: "neon-btn neon-text",
    btnGhost: "bg-transparent text-[#5eead4] border border-[#25d366]/30 hover:border-[#25d366]/60",
    column: "neon",
    card: "neon",
    text: "text-[#d1fae5]",
    muted: "text-[#5eead4]/60",
    badge: "neon",
    avatarRing: "ring-2 ring-[#25d366]/60",
  },
  paper: {
    name: "Paper & Ink",
    blurb: "Notebook calm.",
    bg: "wa-bg-paper",
    swatch: ["#128c7e", "#1a2a26", "#fffdf5", "#e6dfc8"],
    sidebar: "bg-[#fffdf5] border-r border-[#e6dfc8]",
    topbar: "bg-[#fffdf5] border-b border-[#e6dfc8]",
    panel: "paper",
    panelSoft: "paper",
    accent: "bg-[#128c7e] text-white",
    chipActive: "bg-[#128c7e] text-white",
    chipIdle: "bg-[#fffdf5] text-[#1a2a26] border border-[#e6dfc8] hover:bg-[#f5efdd]",
    bubbleMe: "paper bg-[#e7f5ef] text-[#1a2a26]",
    bubbleThem: "paper text-[#1a2a26]",
    input: "paper text-[#1a2a26] placeholder:text-[#6b6354] px-3 py-2",
    btn: "bg-[#128c7e] text-white hover:bg-[#0e6c61]",
    btnGhost: "bg-transparent text-[#128c7e] hover:bg-[#e7f5ef]",
    column: "paper",
    card: "paper",
    text: "text-[#1a2a26]",
    muted: "text-[#6b6354]",
    badge: "paper",
    avatarRing: "ring-2 ring-[#128c7e]/30",
  },
};

const THEME_KEYS = Object.keys(THEMES);

/* ====================================================================== */
/* Storage helpers                                                         */
/* ====================================================================== */
const LS = {
  get(key, fallback) {
    if (typeof window === "undefined") return fallback;
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

function useLocal(key, initial) {
  const [v, setV] = useState(initial);
  useEffect(() => { setV(LS.get(key, initial)); /* eslint-disable-next-line */ }, []);
  useEffect(() => { LS.set(key, v); }, [key, v]);
  return [v, setV];
}

/* ====================================================================== */
/* WhatsPlan logo                                                          */
/* ====================================================================== */
function WhatsPlanLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="wpg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#25d366" />
          <stop offset="100%" stopColor="#128c7e" />
        </linearGradient>
      </defs>
      <rect x="10" y="20" width="80" height="60" rx="16" fill="url(#wpg)" />
      {/* chat tail */}
      <path d="M10 50 L10 85 L35 80 Z" fill="url(#wpg)" />
      {/* tasks/calendar inside */}
      <rect x="25" y="35" width="20" height="10" rx="3" fill="#ffffff" />
      <rect x="25" y="55" width="40" height="10" rx="3" fill="#ffffff" />
      <rect x="55" y="35" width="20" height="10" rx="3" fill="#ffffff" />
      <circle cx="80" cy="20" r="12" fill="#ff4b4b" />
      <path d="M75 20 L78 23 L85 16" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ====================================================================== */
/* Splash / entry animation                                                */
/* ====================================================================== */
function Splash({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
      style={{ background: "radial-gradient(60% 60% at 50% 50%, #0c2d24 0%, #050b09 100%)" }}
    >
      {/* ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-[#25d366]/40"
          initial={{ width: 80, height: 80, opacity: 0 }}
          animate={{ width: 1200, height: 1200, opacity: [0, 0.5, 0] }}
          transition={{ duration: 2.2, delay: 0.4 + i * 0.35, ease: "easeOut" }}
        />
      ))}
      {/* floating chat bubbles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={"b" + i}
          className="absolute h-3 w-3 rounded-full bg-[#25d366]"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: Math.cos((i / 6) * Math.PI * 2) * 220,
            y: Math.sin((i / 6) * Math.PI * 2) * 220,
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.8, delay: 0.6, ease: "easeOut" }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.2, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 blur-2xl bg-[#25d366]/40 rounded-full" />
        <WhatsPlanLogo size={128} />
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="absolute bottom-28 text-center"
      >
        <div className="font-[var(--font-display)] text-4xl font-bold text-white tracking-tight">
          WhatsPlan
        </div>
        <div className="mt-2 text-sm text-[#a7f3d0]">Chat, plan, win the day.</div>
      </motion.div>
    </motion.div>
  );
}

/* ====================================================================== */
/* Login                                                                    */
/* ====================================================================== */
function Login({ onLogin }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!email || !pwd) { setErr("Enter your email and password."); return; }
    if (!email.includes("@")) { setErr("That doesn't look like an email."); return; }
    if (pwd.length < 4) { setErr("Password should be at least 4 characters."); return; }
    onLogin({ email });
  }

  return (
    <div className="min-h-screen w-full wa-bg-default flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#e9edef] overflow-hidden"
      >
        <div className="bg-gradient-to-br from-[#128c7e] to-[#25d366] p-6 text-white relative overflow-hidden">
          <motion.div
            className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="flex items-center gap-3 relative">
            <WhatsPlanLogo size={44} />
            <div>
              <div className="font-[var(--font-display)] text-2xl font-bold tracking-tight">WhatsPlan</div>
              <div className="text-white/85 text-sm">Welcome back. Let's get planning.</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-1 mb-5 bg-[#f0f2f5] rounded-lg p-1">
            {[
              { k: "signin", label: "Sign in" },
              { k: "signup", label: "Create account" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => { setMode(t.k); setErr(""); }}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition ${
                  mode === t.k ? "bg-white text-[#111b21] shadow-sm" : "text-[#54656f]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-[#54656f]">Email</span>
              <div className="mt-1 flex items-center gap-2 border border-[#e9edef] rounded-lg px-3 py-2 focus-within:border-[#00a884]">
                <Mail className="w-4 h-4 text-[#54656f]" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 outline-none text-sm text-[#111b21] placeholder:text-[#8696a0] bg-transparent"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#54656f]">Password</span>
              <div className="mt-1 flex items-center gap-2 border border-[#e9edef] rounded-lg px-3 py-2 focus-within:border-[#00a884]">
                <KeyRound className="w-4 h-4 text-[#54656f]" />
                <input
                  type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 outline-none text-sm text-[#111b21] placeholder:text-[#8696a0] bg-transparent"
                />
              </div>
            </label>

            {err && <div className="text-xs text-red-600">{err}</div>}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#017561] text-white font-medium py-2.5 rounded-lg transition"
            >
              {mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 rounded-lg bg-[#f0f2f5] p-3 text-xs text-[#54656f] flex gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#00a884]" />
            <span>
              New here? Link your account with <span className="font-semibold text-[#00a884]">WhatsApp</span> to
              auto-sync your contacts and planning boards once the backend is connected.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ====================================================================== */
/* Theme picker (first launch)                                             */
/* ====================================================================== */
function ThemePicker({ onPick, current }) {
  const [hover, setHover] = useState(null);
  const active = hover || current || "default";
  const T = THEMES[active];
  return (
    <div className={`min-h-screen w-full ${T.bg} p-6 md:p-10`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Palette className={`w-6 h-6 ${T.text}`} />
          <h1 className={`font-[var(--font-display)] text-3xl font-bold ${T.text}`}>Pick your vibe</h1>
        </div>
        <p className={`${T.muted} mb-8`}>
          Every theme uses WhatsApp's green palette. You can change it anytime in Settings.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEME_KEYS.map((k) => {
            const t = THEMES[k];
            const selected = current === k;
            return (
              <motion.button
                key={k}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onPick(k)}
                className={`${t.panel} p-4 text-left transition relative`}
              >
                <div className={`${t.bg} rounded-lg h-24 mb-3 flex items-end p-2 gap-1 overflow-hidden`}>
                  {t.swatch.map((c, i) => (
                    <div key={i} className="flex-1 h-8 rounded" style={{ background: c }} />
                  ))}
                </div>
                <div className={`font-semibold ${t.text}`}>{t.name}</div>
                <div className={`text-xs ${t.muted} mt-1`}>{t.blurb}</div>
                {selected && (
                  <div className={`absolute top-2 right-2 ${t.accent} rounded-full p-1`}>
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => onPick(current || "default")}
            className="bg-[#00a884] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#017561] transition flex items-center gap-2"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Badges + Streak                                                         */
/* ====================================================================== */
const ALL_BADGES = [
  { id: "first_login", name: "First Steps", desc: "Sign in for the first time.", icon: Sparkles },
  { id: "theme_explorer", name: "Theme Explorer", desc: "Try 3 different themes.", icon: Palette },
  { id: "first_board", name: "Board Builder", desc: "Create your first board.", icon: Kanban },
  { id: "first_card", name: "Idea Sprout", desc: "Add your first card to a board.", icon: Plus },
  { id: "streak_3", name: "On a Roll", desc: "3-day streak.", icon: Flame },
  { id: "streak_7", name: "Week Warrior", desc: "7-day streak.", icon: Trophy },
  { id: "streak_30", name: "Monthly Master", desc: "30-day streak.", icon: ShieldCheck },
  { id: "ten_cards", name: "Ten Done", desc: "Complete 10 cards.", icon: Star },
];

function todayKey() { return new Date().toISOString().slice(0, 10); }
function diffDays(a, b) { return Math.round((new Date(a) - new Date(b)) / 86400000); }

function useGamification() {
  const [earned, setEarned] = useLocal("wp_badges", []);
  const [themesTried, setThemesTried] = useLocal("wp_themes_tried", []);
  const [streak, setStreak] = useLocal("wp_streak", { count: 0, last: null });
  const [completed, setCompleted] = useLocal("wp_completed", 0);
  const [petEnabled, setPetEnabled] = useLocal("wp_pet_enabled", true);
  const [cheering, setCheering] = useState(false);

  // streak tick on mount (after hydrate)
  useEffect(() => {
    const t = todayKey();
    if (streak?.last === t) return;
    let next;
    if (!streak?.last) next = { count: 1, last: t };
    else {
      const d = diffDays(t, streak.last);
      next = d === 1 ? { count: (streak.count || 0) + 1, last: t } : { count: 1, last: t };
    }
    setStreak(next);
    // eslint-disable-next-line
  }, []);

  function grant(id) {
    setEarned((cur) => (cur.includes(id) ? cur : [...cur, id]));
  }
  function tryTheme(k) {
    setThemesTried((cur) => (cur.includes(k) ? cur : [...cur, k]));
  }

  // derived grants
  useEffect(() => { grant("first_login"); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (themesTried.length >= 3) grant("theme_explorer"); }, [themesTried]);
  useEffect(() => {
    if ((streak?.count || 0) >= 3) grant("streak_3");
    if ((streak?.count || 0) >= 7) grant("streak_7");
    if ((streak?.count || 0) >= 30) grant("streak_30");
  }, [streak]);
  useEffect(() => { if (completed >= 10) grant("ten_cards"); }, [completed]);

  useEffect(() => {
    if (completed > 0) {
      setCheering(true);
      const t = setTimeout(() => setCheering(false), 2500);
      return () => clearTimeout(t);
    }
  }, [completed]);

  return { earned, grant, streak, tryTheme, themesTried, completed, setCompleted, petEnabled, setPetEnabled, cheering };
}

/* ====================================================================== */
/* Boards                                                                  */
/* ====================================================================== */
const BOARD_TYPES = [
  { id: "kanban",    name: "Kanban",     icon: Columns3,    blurb: "Columns of cards." },
  { id: "table",     name: "Table",      icon: TableIcon,   blurb: "Rows and columns." },
  { id: "roadmap",   name: "Roadmap",    icon: GitBranch,   blurb: "Timeline lanes." },
  { id: "calendar",  name: "Calendar",   icon: CalendarIcon,blurb: "Month view." },
  { id: "checklist", name: "Checklist",  icon: ListChecks,  blurb: "Simple to-dos." },
  { id: "notes",     name: "Notes",      icon: StickyNote,  blurb: "Free-form notes." },
];

function newBoard(type, name) {
  const base = { id: crypto.randomUUID(), name, type, createdAt: Date.now() };
  if (type === "kanban") return { ...base, columns: [
    { id: crypto.randomUUID(), name: "To do", cards: [] },
    { id: crypto.randomUUID(), name: "Doing", cards: [] },
    { id: crypto.randomUUID(), name: "Done",  cards: [] },
  ]};
  if (type === "table") return { ...base, columns: ["Title", "Owner", "Status"], rows: [] };
  if (type === "roadmap") return { ...base, lanes: [
    { id: crypto.randomUUID(), name: "Now",   items: [] },
    { id: crypto.randomUUID(), name: "Next",  items: [] },
    { id: crypto.randomUUID(), name: "Later", items: [] },
  ]};
  if (type === "calendar") return { ...base, events: [] };
  if (type === "checklist") return { ...base, items: [] };
  if (type === "notes") return { ...base, notes: [] };
  return base;
}

function BoardsView({ T, boards, setBoards, gam }) {
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const open = boards.find((b) => b.id === openId);

  function create(type, name) {
    const b = newBoard(type, name || "Untitled board");
    setBoards([b, ...boards]);
    setOpenId(b.id);
    setCreating(false);
    gam.grant("first_board");
  }
  function update(updated) { setBoards(boards.map((b) => (b.id === updated.id ? updated : b))); }
  function remove(id) { setBoards(boards.filter((b) => b.id !== id)); if (openId === id) setOpenId(null); }

  if (open) {
    return <BoardDetail T={T} board={open} onBack={() => setOpenId(null)} onChange={update} gam={gam} allBoards={boards} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text}`}>Boards</h2>
          <p className={`${T.muted} text-sm`}>Kanban, tables, roadmaps, calendars, checklists, notes — your call.</p>
        </div>
        <button onClick={() => setCreating(true)} className={`${T.btn} px-4 py-2 rounded-lg font-medium flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> New board
        </button>
      </div>

      {boards.length === 0 && !creating && (
        <div className={`${T.panel} p-10 text-center`}>
          <Kanban className={`w-10 h-10 mx-auto mb-3 ${T.muted}`} />
          <div className={`font-semibold ${T.text}`}>No boards yet</div>
          <div className={`${T.muted} text-sm mt-1`}>Create your first board to start planning.</div>
          <button onClick={() => setCreating(true)} className={`${T.btn} px-4 py-2 rounded-lg font-medium mt-4 inline-flex items-center gap-2`}>
            <Plus className="w-4 h-4" /> Create board
          </button>
        </div>
      )}

      {creating && <BoardCreator T={T} onCancel={() => setCreating(false)} onCreate={create} />}

      {boards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {boards.map((b) => {
            const meta = BOARD_TYPES.find((t) => t.id === b.type);
            const Icon = meta?.icon || Kanban;
            return (
              <div key={b.id} className={`${T.card} p-4 cursor-pointer group`} onClick={() => setOpenId(b.id)}>
                <div className="flex items-start justify-between">
                  <div className={`${T.accent} p-2 rounded-lg`}><Icon className="w-4 h-4" /></div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(b.id); }}
                    className={`${T.muted} opacity-0 group-hover:opacity-100 transition hover:text-red-500`}
                    aria-label="Delete board"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className={`mt-3 font-semibold ${T.text}`}>{b.name}</div>
                <div className={`text-xs ${T.muted} mt-0.5`}>{meta?.name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BoardCreator({ T, onCancel, onCreate }) {
  const [type, setType] = useState("kanban");
  const [name, setName] = useState("");
  return (
    <div className={`${T.panel} p-5 mb-6`}>
      <div className={`font-semibold ${T.text} mb-3`}>New board</div>
      <input
        autoFocus value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Board name (e.g. Q3 launch plan)"
        className={`${T.input} w-full rounded-lg px-3 py-2 text-sm mb-4`}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BOARD_TYPES.map((t) => {
          const Icon = t.icon;
          const active = type === t.id;
          return (
            <button key={t.id} onClick={() => setType(t.id)}
              className={`${active ? T.chipActive : T.chipIdle} rounded-lg p-3 text-left transition`}>
              <div className="flex items-center gap-2"><Icon className="w-4 h-4" /><span className="font-medium text-sm">{t.name}</span></div>
              <div className={`text-xs mt-1 ${active ? "" : T.muted}`}>{t.blurb}</div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className={`${T.btnGhost} px-4 py-2 rounded-lg text-sm font-medium`}>Cancel</button>
        <button onClick={() => onCreate(type, name.trim())} className={`${T.btn} px-4 py-2 rounded-lg text-sm font-medium`}>Create</button>
      </div>
    </div>
  );
}

function BoardDetail({ T, board, onBack, onChange, gam, allBoards }) {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`${T.btnGhost} px-3 py-1.5 rounded-lg text-sm`}>← Back</button>
          <input
            value={board.name}
            onChange={(e) => onChange({ ...board, name: e.target.value })}
            className={`bg-transparent font-[var(--font-display)] text-2xl font-bold ${T.text} outline-none`}
          />
        </div>
        <div className={`${T.badge} px-3 py-1 rounded-full text-xs font-medium ${T.text}`}>
          {BOARD_TYPES.find((b) => b.id === board.type)?.name}
        </div>
      </div>

      {board.type === "kanban"    && <KanbanView    T={T} board={board} onChange={onChange} gam={gam} />}
      {board.type === "table"     && <TableView     T={T} board={board} onChange={onChange} gam={gam} />}
      {board.type === "roadmap"   && <RoadmapView   T={T} board={board} onChange={onChange} gam={gam} />}
      {board.type === "calendar"  && <CalendarView  T={T} board={board} onChange={onChange} allBoards={allBoards} />}
      {board.type === "checklist" && <ChecklistView T={T} board={board} onChange={onChange} gam={gam} />}
      {board.type === "notes"     && <NotesView     T={T} board={board} onChange={onChange} />}
    </div>
  );
}

/* ---- Kanban ---- */
function KanbanView({ T, board, onChange, gam }) {
  function addCard(colId, title, dueDate) {
    if (!title) return;
    gam.grant("first_card");
    onChange({ ...board, columns: board.columns.map((c) => c.id === colId
      ? { ...c, cards: [...c.cards, { id: crypto.randomUUID(), title, done: false, dueDate: dueDate || null }] } : c) });
  }
  function toggle(colId, cardId) {
    onChange({ ...board, columns: board.columns.map((c) => c.id === colId
      ? { ...c, cards: c.cards.map((k) => k.id === cardId ? { ...k, done: !k.done } : k) } : c) });
    gam.setCompleted((n) => n + 1);
  }
  function setCardDate(colId, cardId, dueDate) {
    onChange({ ...board, columns: board.columns.map((c) => c.id === colId
      ? { ...c, cards: c.cards.map((k) => k.id === cardId ? { ...k, dueDate: dueDate || null } : k) } : c) });
  }
  function addColumn() {
    onChange({ ...board, columns: [...board.columns, { id: crypto.randomUUID(), name: "New column", cards: [] }] });
  }
  function renameColumn(id, name) {
    onChange({ ...board, columns: board.columns.map((c) => c.id === id ? { ...c, name } : c) });
  }
  function deleteColumn(id) {
    onChange({ ...board, columns: board.columns.filter((c) => c.id !== id) });
  }
  return (
    <div className="flex gap-4 overflow-x-auto thin-scroll pb-4">
      {board.columns.map((col) => (
        <div key={col.id} className={`${T.column} p-3 min-w-[260px] sm:min-w-[280px] w-[280px]`}>
          <div className="flex items-center justify-between mb-2">
            <input value={col.name} onChange={(e) => renameColumn(col.id, e.target.value)}
              className={`bg-transparent font-semibold ${T.text} outline-none`} />
            <button onClick={() => deleteColumn(col.id)} className={`${T.muted} hover:text-red-500`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {col.cards.map((c) => (
              <div key={c.id} className={`${T.card} p-3 text-sm ${T.text}`}>
                <div className="flex items-start gap-2">
                  <button onClick={() => toggle(col.id, c.id)} className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 ${c.done ? "bg-[#25d366] border-[#25d366]" : "border-current opacity-40"} flex items-center justify-center`}>
                    {c.done && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`flex-1 ${c.done ? "line-through opacity-60" : ""}`}>{c.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <CalendarIcon className="w-3 h-3 opacity-50" />
                  <input
                    type="date"
                    value={c.dueDate || ""}
                    onChange={(e) => setCardDate(col.id, c.id, e.target.value)}
                    className={`bg-transparent text-xs ${T.muted} outline-none cursor-pointer`}
                  />
                  {c.dueDate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#25d366]/20 text-[#128c7e] font-medium">{c.dueDate}</span>}
                </div>
              </div>
            ))}
          </div>
          <AddInlineWithDate T={T} placeholder="+ Add a card" onAdd={(title, date) => addCard(col.id, title, date)} />
        </div>
      ))}
      <button onClick={addColumn} className={`${T.chipIdle} min-w-[160px] rounded-xl p-3 text-sm font-medium self-start`}>
        + Add column
      </button>
    </div>
  );
}

function AddInline({ T, placeholder, onAdd }) {
  const [v, setV] = useState("");
  return (
    <div className="mt-2">
      <input
        value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onAdd(v); setV(""); } }}
        placeholder={placeholder}
        className={`${T.input} w-full text-sm rounded-lg px-2 py-1.5`}
      />
    </div>
  );
}

function AddInlineWithDate({ T, placeholder, onAdd }) {
  const [v, setV] = useState("");
  const [date, setDate] = useState("");
  const [showDate, setShowDate] = useState(false);
  return (
    <div className="mt-2 space-y-1">
      <input
        value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onAdd(v, date); setV(""); setDate(""); setShowDate(false); } }}
        placeholder={placeholder}
        className={`${T.input} w-full text-sm rounded-lg px-2 py-1.5`}
      />
      {v && (
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDate(!showDate)} className={`${T.muted} text-xs flex items-center gap-1 hover:opacity-80`}>
            <CalendarIcon className="w-3 h-3" /> {showDate ? "hide date" : "add due date"}
          </button>
          {showDate && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`bg-transparent text-xs ${T.muted} outline-none`} />}
        </div>
      )}
    </div>
  );
}

/* ---- Table ---- */
function TableView({ T, board, onChange, gam }) {
  function addRow() {
    gam.grant("first_card");
    onChange({ ...board, rows: [...board.rows, { id: crypto.randomUUID(), values: board.columns.map(() => "") }] });
  }
  function setCell(rowId, idx, val) {
    onChange({ ...board, rows: board.rows.map((r) => r.id === rowId
      ? { ...r, values: r.values.map((v, i) => (i === idx ? val : v)) } : r) });
  }
  function addCol() {
    onChange({ ...board, columns: [...board.columns, "Column " + (board.columns.length + 1)],
      rows: board.rows.map((r) => ({ ...r, values: [...r.values, ""] })) });
  }
  function renameCol(i, name) {
    onChange({ ...board, columns: board.columns.map((c, idx) => (idx === i ? name : c)) });
  }
  function deleteRow(id) { onChange({ ...board, rows: board.rows.filter((r) => r.id !== id) }); }
  return (
    <div className={`${T.panel} p-3 overflow-x-auto thin-scroll`}>
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b border-current/10 ${T.text}`}>
            {board.columns.map((c, i) => (
              <th key={i} className="text-left p-2 font-semibold">
                <input value={c} onChange={(e) => renameCol(i, e.target.value)} className="bg-transparent outline-none w-full" />
              </th>
            ))}
            <th className="w-8 p-2">
              <button onClick={addCol} className={`${T.btnGhost} px-2 py-1 rounded`}><Plus className="w-3 h-3" /></button>
            </th>
          </tr>
        </thead>
        <tbody>
          {board.rows.map((r) => (
            <tr key={r.id} className="border-b border-current/5 group">
              {r.values.map((v, i) => (
                <td key={i} className="p-1">
                  <input value={v} onChange={(e) => setCell(r.id, i, e.target.value)}
                    className={`${T.input} rounded px-2 py-1 w-full text-sm`} />
                </td>
              ))}
              <td className="p-1 text-right">
                <button onClick={() => deleteRow(r.id)} className={`${T.muted} opacity-0 group-hover:opacity-100 hover:text-red-500`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className={`${T.chipIdle} mt-3 px-3 py-1.5 rounded-lg text-sm font-medium`}>
        + Add row
      </button>
    </div>
  );
}

/* ---- Roadmap ---- */
function RoadmapView({ T, board, onChange, gam }) {
  function addItem(laneId, title) {
    if (!title) return;
    gam.grant("first_card");
    onChange({ ...board, lanes: board.lanes.map((l) => l.id === laneId
      ? { ...l, items: [...l.items, { id: crypto.randomUUID(), title }] } : l) });
  }
  function addLane() {
    onChange({ ...board, lanes: [...board.lanes, { id: crypto.randomUUID(), name: "New phase", items: [] }] });
  }
  return (
    <div className="space-y-3">
      {board.lanes.map((l, idx) => (
        <div key={l.id} className={`${T.column} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`${T.accent} w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold`}>{idx + 1}</div>
            <input value={l.name} onChange={(e) =>
              onChange({ ...board, lanes: board.lanes.map((x) => x.id === l.id ? { ...x, name: e.target.value } : x) })}
              className={`bg-transparent font-semibold ${T.text} outline-none`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {l.items.map((it) => (
              <div key={it.id} className={`${T.card} px-3 py-2 text-sm ${T.text}`}>{it.title}</div>
            ))}
          </div>
          <AddInline T={T} placeholder="+ Add milestone" onAdd={(v) => addItem(l.id, v)} />
        </div>
      ))}
      <button onClick={addLane} className={`${T.chipIdle} px-3 py-2 rounded-lg text-sm font-medium`}>+ Add phase</button>
    </div>
  );
}

/* ---- Calendar (cross-board aggregation) ---- */
function CalendarView({ T, board, onChange, allBoards }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [addingToDay, setAddingToDay] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState("");

  const first = new Date(cursor.y, cursor.m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - startDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const monthName = first.toLocaleString(undefined, { month: "long", year: "numeric" });

  // Aggregate due-dated items from ALL boards
  const crossBoardItems = useMemo(() => {
    const items = [];
    (allBoards || []).forEach((b) => {
      if (b.id === board.id) return; // skip self
      // kanban cards
      if (b.columns) b.columns.forEach((col) => col.cards?.forEach((card) => {
        if (card.dueDate) items.push({ id: card.id, date: card.dueDate, title: card.title, source: b.name, type: "task" });
      }));
      // checklist items
      if (b.items) b.items.forEach((it) => {
        if (it.dueDate) items.push({ id: it.id, date: it.dueDate, title: it.title, source: b.name, type: "task" });
      });
      // roadmap items
      if (b.lanes) b.lanes.forEach((lane) => lane.items?.forEach((it) => {
        if (it.dueDate) items.push({ id: it.id, date: it.dueDate, title: it.title, source: b.name, type: "task" });
      }));
      // other calendar events
      if (b.events && b.type === "calendar") b.events.forEach((ev) => {
        items.push({ id: ev.id, date: ev.date, title: ev.title, source: b.name, type: "event" });
      });
    });
    return items;
  }, [allBoards, board.id]);

  function eventsOn(d) {
    const iso = new Date(cursor.y, cursor.m, d).toISOString().slice(0, 10);
    const own = board.events.filter((e) => e.date === iso).map(e => ({ ...e, source: null, type: "event" }));
    const cross = crossBoardItems.filter((e) => e.date === iso);
    return [...own, ...cross];
  }
  function saveEvent() {
    if (!newEventTitle || !addingToDay) return;
    const iso = new Date(cursor.y, cursor.m, addingToDay).toISOString().slice(0, 10);
    onChange({ ...board, events: [...board.events, { id: crypto.randomUUID(), date: iso, title: newEventTitle }] });
    setAddingToDay(null);
    setNewEventTitle("");
  }
  function go(delta) {
    let m = cursor.m + delta, y = cursor.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCursor({ y, m });
  }
  return (
    <div className={`${T.panel} p-3 sm:p-5`}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => go(-1)} className={`${T.btnGhost} px-3 py-1 rounded-lg`}>‹</button>
        <div className={`font-semibold ${T.text}`}>{monthName}</div>
        <button onClick={() => go(1)} className={`${T.btnGhost} px-3 py-1 rounded-lg`}>›</button>
      </div>
      {crossBoardItems.length > 0 && (
        <div className={`${T.panelSoft} px-3 py-2 mb-3 rounded-lg text-xs ${T.muted} flex items-center gap-2`}>
          <Zap className="w-3 h-3" /> Showing {crossBoardItems.length} due-dated items from other boards
        </div>
      )}
      <div className={`grid grid-cols-7 gap-1 text-xs font-medium mb-1 ${T.muted}`}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => <div key={i} className="text-center py-1 hidden sm:block">{d}</div>)}
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-center py-1 sm:hidden">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((d, i) => (
          <div key={i} className={`${d ? T.panelSoft : ""} min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 flex flex-col gap-1 text-xs ${T.text} relative group`}>
            {d && (
              <>
                <div className="flex justify-between items-start">
                  <span className="font-semibold opacity-70 group-hover:opacity-100">{d}</span>
                  <button onClick={() => setAddingToDay(d)} className="opacity-0 group-hover:opacity-100 bg-[#25d366] text-white rounded-full p-0.5 shadow-sm transition">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto thin-scroll space-y-1 mt-1">
                  {eventsOn(d).map((e) => (
                    <div key={e.id} className={`${
                      e.source ? "bg-[#128c7e]/20 text-[#128c7e] border border-[#128c7e]/30" : T.accent
                    } px-1.5 py-1 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs truncate shadow-sm`}
                      title={e.source ? `From: ${e.source}` : "This calendar"}
                    >{e.source ? "📋 " : ""}{e.title}</div>
                  ))}
                  {addingToDay === d && (
                    <div className="mt-1">
                      <input
                        autoFocus
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEvent(); if (e.key === "Escape") setAddingToDay(null); }}
                        onBlur={saveEvent}
                        placeholder="New event"
                        className={`${T.input} w-full text-[10px] sm:text-xs rounded px-1 py-1`}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Checklist ---- */
function ChecklistView({ T, board, onChange, gam }) {
  function add(title) {
    if (!title) return;
    gam.grant("first_card");
    onChange({ ...board, items: [...board.items, { id: crypto.randomUUID(), title, done: false }] });
  }
  function toggle(id) {
    onChange({ ...board, items: board.items.map((i) => i.id === id ? { ...i, done: !i.done } : i) });
    gam.setCompleted((n) => n + 1);
  }
  function del(id) { onChange({ ...board, items: board.items.filter((i) => i.id !== id) }); }
  return (
    <div className={`${T.panel} p-5 max-w-2xl`}>
      <div className="space-y-2">
        {board.items.map((it) => (
          <div key={it.id} className={`${T.panelSoft} p-3 flex items-center gap-3 group`}>
            <button onClick={() => toggle(it.id)}
              className={`w-5 h-5 rounded border-2 ${it.done ? "bg-[#25d366] border-[#25d366]" : "border-current opacity-40"} flex items-center justify-center`}>
              {it.done && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className={`flex-1 ${T.text} ${it.done ? "line-through opacity-60" : ""}`}>{it.title}</span>
            <button onClick={() => del(it.id)} className={`${T.muted} opacity-0 group-hover:opacity-100 hover:text-red-500`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <AddInline T={T} placeholder="+ Add an item" onAdd={add} />
    </div>
  );
}

/* ---- Notes ---- */
function NotesView({ T, board, onChange }) {
  function add() {
    onChange({ ...board, notes: [{ id: crypto.randomUUID(), text: "" }, ...board.notes] });
  }
  function update(id, text) {
    onChange({ ...board, notes: board.notes.map((n) => n.id === id ? { ...n, text } : n) });
  }
  function del(id) { onChange({ ...board, notes: board.notes.filter((n) => n.id !== id) }); }
  return (
    <div>
      <button onClick={add} className={`${T.btn} px-3 py-1.5 rounded-lg text-sm font-medium mb-4 inline-flex items-center gap-1`}>
        <Plus className="w-4 h-4" /> New note
      </button>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {board.notes.map((n) => (
          <div key={n.id} className={`${T.card} p-3 group`}>
            <textarea
              value={n.text} onChange={(e) => update(n.id, e.target.value)}
              placeholder="Type here…"
              className={`w-full min-h-[100px] bg-transparent ${T.text} outline-none text-sm resize-none placeholder:${T.muted.replace("text-", "text-")}`}
            />
            <div className="flex justify-end">
              <button onClick={() => del(n.id)} className={`${T.muted} opacity-0 group-hover:opacity-100 hover:text-red-500`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Chats — Real AI Classification                                           */
/* ====================================================================== */
const SAMPLE_CHAT = `Ali: Let's schedule the sprint review for next Friday at 3pm
Sarah: Can someone update the landing page copy by tomorrow?
Ahmed: Great work on the demo everyone! 🎉
Fatima: We need to fix the login bug before the release, it's urgent`;

const TYPE_META = {
  task:  { icon: ListChecks,    color: "bg-blue-500/15 text-blue-700 border-blue-300",   label: "Task" },
  event: { icon: CalendarIcon,  color: "bg-purple-500/15 text-purple-700 border-purple-300", label: "Event" },
  info:  { icon: Info,          color: "bg-gray-500/15 text-gray-600 border-gray-300",   label: "Info" },
};
const PRIO_COLORS = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" };

function ChatsView({ T, boards, setBoards, gam }) {
  const [chatText, setChatText] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [results, setResults] = useState(null); // { error, items }
  const [routed, setRouted] = useState(false);

  async function handleClassify() {
    if (!chatText.trim()) return;
    setClassifying(true);
    setResults(null);
    setRouted(false);
    try {
      const res = await classifyMessages({ data: { text: chatText.trim() } });
      setResults(res);
    } catch (err) {
      setResults({ error: `Request failed: ${err?.message || String(err)}`, items: [] });
    } finally {
      setClassifying(false);
    }
  }

  function handleRouteToBoards() {
    if (!results?.items?.length) return;
    const tasks = results.items.filter(i => i.type === "task");
    const events = results.items.filter(i => i.type === "event");

    let updatedBoards = [...boards];

    if (tasks.length > 0) {
      let taskBoard = updatedBoards.find(b => b.type === "kanban" && b.name === "From Chat");
      if (!taskBoard) {
        taskBoard = newBoard("kanban", "From Chat");
        updatedBoards = [taskBoard, ...updatedBoards];
      }
      const todoCol = taskBoard.columns[0];
      const newCards = tasks.map(t => ({ id: crypto.randomUUID(), title: t.title, done: false, dueDate: t.dueDate || null }));
      taskBoard = {
        ...taskBoard,
        columns: taskBoard.columns.map(c => c.id === todoCol.id ? { ...c, cards: [...c.cards, ...newCards] } : c),
      };
      updatedBoards = updatedBoards.map(b => b.id === taskBoard.id ? taskBoard : b);
      gam.grant("first_board");
      gam.grant("first_card");
    }

    if (events.length > 0) {
      let calBoard = updatedBoards.find(b => b.type === "calendar" && b.name === "From Chat");
      if (!calBoard) {
        calBoard = newBoard("calendar", "From Chat");
        updatedBoards = [calBoard, ...updatedBoards];
      }
      const newEvents = events.map(e => ({ id: crypto.randomUUID(), date: e.dueDate || new Date().toISOString().slice(0, 10), title: e.title }));
      calBoard = { ...calBoard, events: [...calBoard.events, ...newEvents] };
      updatedBoards = updatedBoards.map(b => b.id === calBoard.id ? calBoard : b);
      gam.grant("first_board");
    }

    setBoards(updatedBoards);
    setRouted(true);
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text} flex items-center gap-2`}>
          <Zap className="w-6 h-6" /> AI Chat Classifier
        </h2>
        <p className={`${T.muted} text-sm mt-1`}>
          Paste real chat messages below. The AI classifies each line as a task, event, or info — then routes actionable items directly into your boards.
        </p>
      </div>

      {/* Input area */}
      <div className={`${T.panel} p-4 sm:p-5 mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`font-semibold text-sm ${T.text}`}>Chat Messages</div>
          <button
            onClick={() => setChatText(SAMPLE_CHAT)}
            className={`${T.chipIdle} px-2.5 py-1 rounded text-xs flex items-center gap-1`}
          >
            <ClipboardPaste className="w-3 h-3" /> Load sample
          </button>
        </div>
        <textarea
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          placeholder={"Paste WhatsApp chat lines here…\n\nExample:\nAli: Let's meet tomorrow at 2pm\nSarah: Please update the docs by Friday"}
          rows={6}
          className={`${T.input} w-full rounded-lg px-3 py-2.5 text-sm resize-y`}
        />
        <div className="flex items-center justify-between mt-3">
          <div className={`text-xs ${T.muted}`}>
            {chatText.trim() ? `${chatText.trim().split("\n").filter(Boolean).length} messages` : "No messages"}
          </div>
          <button
            onClick={handleClassify}
            disabled={classifying || !chatText.trim()}
            className={`${T.btn} px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50`}
          >
            {classifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {classifying ? "Classifying…" : "Classify with AI"}
          </button>
        </div>
      </div>

      {/* Error */}
      {results?.error && (
        <div className={`${T.panelSoft} p-4 mb-4 border-l-4 border-amber-500`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className={`font-semibold text-sm ${T.text}`}>Classification Error</div>
              <div className={`text-sm ${T.muted} mt-1`}>{results.error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results?.items?.length > 0 && (
        <div className={`${T.panel} p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`font-semibold ${T.text}`}>
              Classified {results.items.length} item{results.items.length !== 1 ? "s" : ""}
            </div>
            <div className="flex gap-2">
              {!routed ? (
                <button
                  onClick={handleRouteToBoards}
                  className={`${T.btn} px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2`}
                >
                  <ExternalLink className="w-4 h-4" /> Route to Boards
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[#25d366] font-semibold text-sm">
                  <Check className="w-4 h-4" /> Routed!
                </div>
              )}
              <button
                onClick={() => { setResults(null); setChatText(""); setRouted(false); }}
                className={`${T.btnGhost} px-3 py-2 rounded-lg text-sm flex items-center gap-1`}
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {results.items.map((item, idx) => {
              const meta = TYPE_META[item.type] || TYPE_META.info;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`${T.panelSoft} p-3 sm:p-4 flex items-start gap-3`}
                >
                  <div className={`${meta.color} border px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shrink-0`}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${T.text}`}>{item.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {item.dueDate && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[#25d366]/15 text-[#128c7e] font-medium flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" /> {item.dueDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs">
                        <span className={`w-2 h-2 rounded-full ${PRIO_COLORS[item.priority] || PRIO_COLORS.medium}`} />
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CallsView({ T }) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text} mb-1`}>Calls</h2>
      <p className={`${T.muted} text-sm mb-6`}>Call history will sync after backend is connected.</p>
      <div className={`${T.panel} p-10 text-center`}>
        <Phone className={`w-10 h-10 mx-auto mb-3 ${T.muted}`} />
        <div className={`font-semibold ${T.text}`}>No call history</div>
        <div className={`${T.muted} text-sm mt-1`}>Voice and video calls will appear here.</div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Badges view                                                              */
/* ====================================================================== */
function BadgesView({ T, gam }) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text} mb-1`}>Achievements</h2>
      <p className={`${T.muted} text-sm mb-6`}>Badges and streaks are tracked locally on this device.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`${T.panel} p-5`}>
          <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /><span className={`text-sm ${T.muted}`}>Current streak</span></div>
          <div className={`mt-1 text-3xl font-bold ${T.text}`}>{gam.streak?.count || 0} <span className={`text-sm font-normal ${T.muted}`}>days</span></div>
        </div>
        <div className={`${T.panel} p-5`}>
          <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /><span className={`text-sm ${T.muted}`}>Badges earned</span></div>
          <div className={`mt-1 text-3xl font-bold ${T.text}`}>{gam.earned.length}<span className={`text-sm font-normal ${T.muted}`}> / {ALL_BADGES.length}</span></div>
        </div>
        <div className={`${T.panel} p-5`}>
          <div className="flex items-center gap-2"><Check className="w-5 h-5 text-[#25d366]" /><span className={`text-sm ${T.muted}`}>Cards completed</span></div>
          <div className={`mt-1 text-3xl font-bold ${T.text}`}>{gam.completed}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ALL_BADGES.map((b) => {
          const Icon = b.icon;
          const got = gam.earned.includes(b.id);
          return (
            <div key={b.id} className={`${T.panel} p-4 text-center ${got ? "" : "opacity-50 grayscale"}`}>
              <div className={`${got ? T.accent : T.panelSoft} w-12 h-12 rounded-full mx-auto flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className={`mt-2 font-semibold text-sm ${T.text}`}>{b.name}</div>
              <div className={`text-xs ${T.muted} mt-0.5`}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Settings view                                                            */
/* ====================================================================== */
function SettingsView({ T, user, themeKey, setTheme, onLogout, gam }) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text} mb-6`}>Settings</h2>

      <div className={`${T.panel} p-5 mb-4`}>
        <div className="flex items-center gap-3">
          <div className={`${T.accent} w-12 h-12 rounded-full flex items-center justify-center font-bold`}>
            {(user?.email?.[0] || "U").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className={`font-semibold truncate ${T.text}`}>{user?.email || "Guest"}</div>
            <div className={`text-xs ${T.muted}`}>Signed in</div>
          </div>
          <button onClick={onLogout} className={`${T.btnGhost} ml-auto px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1`}>
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      <div className={`${T.panel} p-5`}>
        <div className="flex items-center gap-2 mb-3"><Palette className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Appearance</div></div>
        <p className={`${T.muted} text-sm mb-3`}>All themes use WhatsApp's green palette.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {THEME_KEYS.map((k) => {
            const t = THEMES[k];
            const active = themeKey === k;
            return (
              <button key={k} onClick={() => { setTheme(k); gam.tryTheme(k); }}
                className={`${active ? T.chipActive : T.chipIdle} p-2 rounded-lg text-left`}>
                <div className="flex gap-1 mb-2">
                  {t.swatch.map((c, i) => <div key={i} className="h-3 flex-1 rounded" style={{ background: c }} />)}
                </div>
                <div className="text-xs font-medium">{t.name}</div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-current/10">
          <div>
            <div className={`font-semibold ${T.text}`}>Cheering Pet</div>
            <div className={`text-sm ${T.muted}`}>A little companion to celebrate your task completions.</div>
          </div>
          <button
            onClick={() => gam.setPetEnabled(!gam.petEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${gam.petEnabled ? 'bg-[#25d366]' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${gam.petEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Cheering Pet                                                             */
/* ====================================================================== */
function CheeringPet({ cheering }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-50 pointer-events-none"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
      >
        <motion.div
          animate={
            cheering
              ? { y: [0, -20, 0, -20, 0], scale: [1, 1.1, 1, 1.1, 1], rotate: [0, -10, 10, -10, 0] }
              : { y: [0, -5, 0], transition: { repeat: Infinity, duration: 3 } }
          }
          className="relative"
        >
          {/* Pet Body */}
          <div className="w-16 h-16 bg-[#25d366] rounded-full shadow-lg border-2 border-white flex flex-col items-center justify-center overflow-hidden">
            {/* Eyes */}
            <div className="flex gap-2 mb-1">
              <div className="w-2 h-3 bg-black rounded-full" />
              <div className="w-2 h-3 bg-black rounded-full" />
            </div>
            {/* Mouth */}
            {cheering ? (
              <div className="w-4 h-3 bg-black rounded-full overflow-hidden flex items-end justify-center">
                <div className="w-3 h-2 bg-pink-500 rounded-t-full" />
              </div>
            ) : (
              <div className="w-3 h-1.5 border-b-2 border-black rounded-b-full" />
            )}
          </div>
          {/* Cheering sparks */}
          {cheering && (
            <motion.div
              className="absolute -top-4 -right-4 text-pink-500"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1 }}
            >
              <Heart className="w-6 h-6 fill-current" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ====================================================================== */
/* Main app shell                                                           */
/* ====================================================================== */
const TABS = [
  { id: "chats",   label: "Chats",   icon: MessageSquare },
  { id: "calls",   label: "Calls",   icon: Phone },
  { id: "boards",  label: "Boards",  icon: Kanban },
  { id: "badges",  label: "Badges",  icon: Award },
  { id: "settings",label: "Settings",icon: SettingsIcon },
];

function AppShell({ user, themeKey, setTheme, onLogout, gam }) {
  const T = THEMES[themeKey] || THEMES.default;
  const [tab, setTab] = useState("boards");
  const [boards, setBoards] = useLocal("wp_boards", []);

  return (
    <div className={`min-h-screen w-full ${T.bg} flex`}>
      {/* Left rail */}
      <aside className={`${T.sidebar} w-20 lg:w-64 shrink-0 flex flex-col`}>
        <div className="p-4 flex items-center gap-2 justify-center lg:justify-start">
          <WhatsPlanLogo size={32} />
          <div className={`hidden lg:block font-[var(--font-display)] text-lg font-bold ${T.text}`}>WhatsPlan</div>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`${active ? T.chipActive : T.chipIdle} w-full rounded-lg flex items-center gap-3 px-3 py-2.5 text-sm font-medium`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline">{t.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3">
          <div className={`${T.panelSoft} p-3 hidden lg:block`}>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div className={`text-xs ${T.muted}`}>Streak</div>
            </div>
            <div className={`mt-1 text-xl font-bold ${T.text}`}>{gam.streak?.count || 0} <span className={`text-xs font-normal ${T.muted}`}>days</span></div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className={`${T.topbar} h-14 flex items-center px-4 gap-3`}>
          <div className={`font-[var(--font-display)] font-semibold ${T.text} capitalize`}>{tab}</div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`${T.badge} px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${T.text}`}>
              <Trophy className="w-3.5 h-3.5" /> {gam.earned.length}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto thin-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {tab === "chats"    && <ChatsView   T={T} boards={boards} setBoards={setBoards} gam={gam} />}
              {tab === "calls"    && <CallsView   T={T} />}
              {tab === "boards"   && <BoardsView  T={T} boards={boards} setBoards={setBoards} gam={gam} />}
              {tab === "badges"   && <BadgesView  T={T} gam={gam} />}
              {tab === "settings" && <SettingsView T={T} user={user} themeKey={themeKey} setTheme={setTheme} onLogout={onLogout} gam={gam} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ====================================================================== */
/* Root                                                                     */
/* ====================================================================== */
export default function WhatsPlanApp() {
  const [hydrated, setHydrated] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [user, setUser] = useLocal("wp_user", null);
  const [themeKey, setThemeKey] = useLocal("wp_theme", null); // null = not yet picked
  const gam = useGamification();

  useEffect(() => { setHydrated(true); }, []);
  if (!hydrated) {
    return <div className="min-h-screen wa-bg-default" />;
  }

  return (
    <AnimatePresence mode="wait">
      {!splashDone && <Splash key="splash" onDone={() => setSplashDone(true)} />}
      {splashDone && !user && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Login onLogin={(u) => setUser(u)} />
        </motion.div>
      )}
      {splashDone && user && !themeKey && (
        <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ThemePicker
            current={themeKey}
            onPick={(k) => { setThemeKey(k); gam.tryTheme(k); }}
          />
        </motion.div>
      )}
      {splashDone && user && themeKey && (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AppShell
            user={user} themeKey={themeKey} setTheme={setThemeKey} gam={gam}
            onLogout={() => { setUser(null); }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
