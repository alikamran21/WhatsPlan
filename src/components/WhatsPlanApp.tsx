// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  MessageSquare, Phone, Kanban, Award, Settings as SettingsIcon,
  Search, Plus, Send, Paperclip, Smile, Mic, MoreVertical, Lock,
  Palette, User, LogOut, Flame, Trophy, Star, ShieldCheck, Sparkles,
  Calendar as CalendarIcon, ListChecks, StickyNote, Table as TableIcon,
  GitBranch, Columns3, Pencil, Trash2, Check, X, ChevronRight, ChevronDown,
  Mail, KeyRound, ArrowRight, Bell, Shield, Database, Keyboard, HelpCircle,
  Globe, Type, Wallpaper, Smartphone, Volume2, Eye, Download, Info,
  Clock, Tag, AlignLeft, Zap, MessageCircle, RefreshCw, Share2, Copy, Link as LinkIcon,
  WifiOff, ExternalLink, Pin,
} from "lucide-react";
import { useSession, useChats, useMessages, usePlanner, useBoards, useSyncedDoc, api } from "@/lib/api";

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
    panel: "brutal",
    panelSoft: "bg-white border-[3px] border-black rounded-md",
    accent: "bg-black text-[#25d366]",
    chipActive: "bg-black text-[#25d366] border-[3px] border-black shadow-[4px_4px_0_0_#000]",
    chipIdle: "bg-white text-black border-[3px] border-black hover:bg-[#d9fdd3]",
    bubbleMe: "bg-[#25d366] text-black border-[3px] border-black shadow-[5px_5px_0_0_#000]",
    bubbleThem: "bg-white text-black border-[3px] border-black",
    input: "bg-white border-[3px] border-black text-black placeholder:text-black/70 rounded-md",
    btn: "bg-black text-[#25d366] border-[3px] border-black hover:bg-[#128c7e] hover:text-white shadow-[5px_5px_0_0_#000]",
    btnGhost: "bg-white text-black border-[3px] border-black hover:bg-[#d9fdd3]",
    column: "brutal",
    card: "bg-[#d9fdd3] border-[3px] border-black rounded-md shadow-[5px_5px_0_0_#000]",
    text: "text-black",
    muted: "text-black/75",
    badge: "bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]",
    avatarRing: "ring-2 ring-black",
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
    accent: "glass-strong bg-[#25d366]/60 text-white",
    chipActive: "glass-strong bg-[#25d366]/70 text-white",
    chipIdle: "glass text-white hover:bg-white/20",
    bubbleMe: "glass bg-[#25d366]/50 text-white",
    bubbleThem: "glass bg-white/20 text-white",
    input: "glass text-white placeholder:text-white/60 px-3 py-2",
    btn: "glass-strong bg-[#25d366]/70 text-white hover:bg-[#25d366]/85 font-semibold",
    btnGhost: "glass text-white font-medium",
    column: "glass-strong",
    card: "glass-strong text-white",
    text: "text-white",
    muted: "text-white/80",
    badge: "glass text-white",
    avatarRing: "ring-2 ring-white/60",
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
/* WhatsApp logo                                                           */
/* ====================================================================== */
/* WPLogo — sharp speech-bubble + task grid, visible on all themes */
function WPLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="WhatsPlan">
      <defs>
        <linearGradient id="wpg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#25d366" />
          <stop offset="50%" stopColor="#1eba5a" />
          <stop offset="100%" stopColor="#0d6b4a" />
        </linearGradient>
      </defs>
      {/* dark outline for visibility on all themes */}
      <rect x="5" y="3" width="86" height="78" rx="12" ry="12" fill="none" stroke="#0a3d2a" strokeWidth="2.5" />
      {/* main body */}
      <rect x="6" y="4" width="84" height="76" rx="11" ry="11" fill="url(#wpg)" />
      {/* speech-bubble tail with outline */}
      <polygon points="16,76 10,94 38,76" fill="url(#wpg)" stroke="#0a3d2a" strokeWidth="2" strokeLinejoin="miter" />
      {/* 2×2 task tiles — sharp corners */}
      <rect x="18" y="16" width="27" height="25" rx="3" fill="#fff" stroke="#0a3d2a" strokeWidth="1.2" />
      <rect x="51" y="16" width="27" height="25" rx="3" fill="#fff" stroke="#0a3d2a" strokeWidth="1.2" opacity="0.85" />
      <rect x="18" y="47" width="27" height="25" rx="3" fill="#fff" stroke="#0a3d2a" strokeWidth="1.2" opacity="0.85" />
      <rect x="51" y="47" width="27" height="25" rx="3" fill="#fff" stroke="#0a3d2a" strokeWidth="1.2" />
      {/* sharp checkmarks */}
      <path d="M24 29 l6 6 l11 -12" fill="none" stroke="#0a3d2a" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M57 60 l6 6 l11 -12" fill="none" stroke="#0a3d2a" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
      {/* task text lines */}
      <rect x="56" y="24" width="16" height="3" rx="1" fill="#0a3d2a" opacity="0.5" />
      <rect x="56" y="30" width="11" height="3" rx="1" fill="#0a3d2a" opacity="0.3" />
      <rect x="23" y="55" width="16" height="3" rx="1" fill="#0a3d2a" opacity="0.5" />
      <rect x="23" y="61" width="11" height="3" rx="1" fill="#0a3d2a" opacity="0.3" />
      {/* notification accent dot */}
      <circle cx="84" cy="10" r="10" fill="#ff3b3b" stroke="#0a3d2a" strokeWidth="1.5" />
      <text x="84" y="14" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">!</text>
    </svg>
  );
}
const WALogo = WPLogo; // back-compat alias for any remaining call sites

/* ====================================================================== */
/* Splash / entry animation                                                */
/* ====================================================================== */
function Splash({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0); // 0 aurora, 1 logo, 2 tagline
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 600);
    const t2 = setTimeout(() => setStage(2), 1600);
    const t3 = setTimeout(onDone, 3600);
    const iv = setInterval(() => setProgress((p) => Math.min(100, p + 3)), 90);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(iv); };
  }, [onDone]);

  // particle ring positions
  const particles = useMemo(() => Array.from({ length: 28 }).map((_, i) => ({
    a: (i / 28) * Math.PI * 2,
    r: 180 + (i % 4) * 30,
    d: 0.6 + (i % 5) * 0.12,
    s: 2 + (i % 3),
  })), []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.7 }}
    >
      {/* Aurora */}
      <motion.div className="absolute inset-0"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        style={{
          background:
            "radial-gradient(60% 60% at 30% 30%, #25d36655 0%, transparent 60%)," +
            "radial-gradient(60% 60% at 70% 70%, #128c7e66 0%, transparent 60%)," +
            "radial-gradient(80% 80% at 50% 50%, #0c2d24 0%, #050b09 100%)",
        }}
      />
      <motion.div className="absolute inset-0 opacity-40"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
        style={{
          background: "conic-gradient(from 0deg at 50% 50%, #25d36622, transparent 25%, #5eead422, transparent 50%, #128c7e22, transparent 75%, #25d36622)",
          mixBlendMode: "screen",
        }}
      />

      {/* Concentric ripple rings */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-[#25d366]/40"
          style={{ width: 160, height: 160 }}
          animate={{ scale: [0.5, 6], opacity: [0.7, 0] }}
          transition={{ duration: 2.6, delay: 0.2 + i * 0.5, ease: "easeOut", repeat: Infinity }}
        />
      ))}

      {/* Orbiting particles */}
      <div className="absolute w-0 h-0">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#5eead4]"
            style={{ width: p.s, height: p.s, filter: "drop-shadow(0 0 6px #25d366)" }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: [Math.cos(p.a) * p.r * 0.4, Math.cos(p.a) * p.r],
              y: [Math.sin(p.a) * p.r * 0.4, Math.sin(p.a) * p.r],
              opacity: [0, 1, 0.6],
            }}
            transition={{ duration: 2, delay: 0.4 + p.d * 0.4, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* Floating chat bubble icons */}
      {[
        { x: -260, y: -120, d: 0.8 },
        { x: 240, y: -90, d: 1.0 },
        { x: -200, y: 140, d: 1.2 },
        { x: 220, y: 160, d: 1.4 },
      ].map((b, i) => (
        <motion.div
          key={"bb" + i}
          className="absolute"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: b.x, y: b.y, opacity: [0, 1, 0.85], scale: 1 }}
          transition={{ duration: 1.4, delay: b.d, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl rounded-bl-sm bg-[#25d366]/90 px-3 py-2 shadow-[0_8px_30px_rgba(37,211,102,0.4)]">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      ))}

      {/* Logo morph */}
      <motion.div
        initial={{ scale: 0.05, opacity: 0, rotate: -180, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.3 }}
        className="relative"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-[#25d366]/50 blur-3xl"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <WPLogo size={128} />
        </motion.div>
      </motion.div>

      {/* Tagline + progress */}
      <div className="absolute bottom-24 flex flex-col items-center gap-4 w-[min(420px,80vw)]">
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                className="font-[var(--font-display)] text-5xl font-bold tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #25d366, #5eead4, #25d366)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                WhatsPlan
              </motion.div>
              <div className="mt-2 text-sm text-[#a7f3d0] tracking-widest uppercase">
                Chat · Plan · Win the day
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #128c7e, #25d366, #5eead4)",
              boxShadow: "0 0 12px #25d366",
            }}
          />
        </div>
        <div className="text-[10px] tracking-[0.3em] text-[#5eead4]/80 uppercase">
          {progress < 40 ? "Warming up" : progress < 80 ? "Syncing themes" : "Almost ready"}
        </div>
      </div>
    </motion.div>
  );
}

/* ====================================================================== */
/* Login                                                                    */
/* ====================================================================== */
function Login() {
  const wa = useSession();

  // Auto-boot the WhatsApp session as soon as the backend is reachable.
  useEffect(() => {
    if (wa.online && wa.status === "disconnected") wa.start();
    // eslint-disable-next-line
  }, [wa.online, wa.status]);

  const showQr = wa.online && wa.status === "qr" && wa.qr;
  const ready = wa.status === "ready";

  return (
    <div className="min-h-screen w-full wa-bg-default flex items-center justify-center p-4">
      {/* WhatsApp Web style header strip */}
      <div className="fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-[#00a884] to-[#008069]" />
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#e9edef] overflow-hidden p-7 sm:p-9 flex flex-col items-center"
      >
        <div className="flex items-center gap-3 self-start">
          <WPLogo size={44} />
          <div>
            <div className="font-[var(--font-display)] text-xl font-bold tracking-tight text-[#111b21]">WhatsPlan</div>
            <div className="text-[#54656f] text-xs">Sign in with WhatsApp</div>
          </div>
        </div>

        <div className="text-center mt-6 mb-4">
          <div className="inline-flex items-center gap-2 text-[#008069] font-semibold">
            <Smartphone className="w-4 h-4" /> Link your WhatsApp to continue
          </div>
          <p className="text-xs text-[#54656f] mt-1 max-w-xs">
            Open WhatsApp → <b>Settings</b> → <b>Linked devices</b> → <b>Link a device</b>, then scan the code.
          </p>
        </div>

        {/* QR / status card */}
        <div className="relative p-4 bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,128,105,0.45)] border border-[#d1f0e1]">
          {showQr ? (
            <img src={wa.qr} alt="WhatsApp link QR" width={224} height={224} className="rounded-lg" />
          ) : ready ? (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-16 h-16 rounded-full bg-[#25d366] grid place-items-center"><Check className="w-8 h-8 text-white" /></div>
              <div className="font-semibold text-[#0b3a32]">Linked!</div>
              <div className="text-xs text-[#54656f]">Opening WhatsPlan…</div>
            </div>
          ) : !wa.online ? (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 text-center px-4">
              <WifiOff className="w-10 h-10 text-amber-500" />
              <div className="font-semibold text-[#0b3a32]">Backend offline</div>
              <div className="text-xs text-[#54656f]">Start the server, then this page links automatically.</div>
            </div>
          ) : (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-[#25d366] border-t-transparent animate-spin" />
              <div className="font-semibold text-[#0b3a32]">{wa.status === "authenticated" ? "Authenticating…" : "Starting WhatsApp…"}</div>
              <div className="text-xs text-[#54656f]">Booting a secure session.</div>
            </div>
          )}
          {/* corner accents */}
          {[
            "top-1 left-1 border-t-2 border-l-2",
            "top-1 right-1 border-t-2 border-r-2",
            "bottom-1 left-1 border-b-2 border-l-2",
            "bottom-1 right-1 border-b-2 border-r-2",
          ].map((c, i) => (
            <div key={i} className={`absolute w-5 h-5 border-[#25d366] rounded-md ${c}`} />
          ))}
        </div>

        {(showQr || !wa.online) && (
          <button onClick={wa.start} className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#008069] hover:text-[#006652] font-medium">
            <RefreshCw className="w-3.5 h-3.5" /> {wa.online ? "Refresh code" : "Retry"}
          </button>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] text-[#54656f] max-w-xs">
          {[
            { n: "1", t: "Open WhatsApp" },
            { n: "2", t: "Linked devices" },
            { n: "3", t: "Scan code" },
          ].map((s) => (
            <div key={s.n} className="bg-white border border-[#e9edef] rounded-lg p-2 text-center">
              <div className="w-5 h-5 mx-auto rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center">{s.n}</div>
              <div className="mt-1">{s.t}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-[#f0f2f5] p-3 text-xs text-[#54656f] flex gap-2">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#00a884]" />
          <span>Your WhatsApp number is your WhatsPlan identity — no passwords. We only read your selected chats and never auto-reply.</span>
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

const GAM_DEFAULTS = { earned: [], themesTried: [], streak: { count: 0, last: null }, completed: 0 };

/* Read gamification from localStorage, migrating the legacy per-key storage
   (wp_badges / wp_themes_tried / wp_streak / wp_completed) into one blob. */
function readGamification() {
  if (typeof window === "undefined") return GAM_DEFAULTS;
  try {
    const combined = localStorage.getItem("wp_gamification");
    if (combined) return { ...GAM_DEFAULTS, ...JSON.parse(combined) };
    return {
      earned: JSON.parse(localStorage.getItem("wp_badges") || "[]"),
      themesTried: JSON.parse(localStorage.getItem("wp_themes_tried") || "[]"),
      streak: JSON.parse(localStorage.getItem("wp_streak") || "null") || { count: 0, last: null },
      completed: JSON.parse(localStorage.getItem("wp_completed") || "0"),
    };
  } catch { return GAM_DEFAULTS; }
}

function useGamification() {
  const [state, setState, loaded] = useSyncedDoc("gamification", readGamification());
  const earned = state.earned || [];
  const themesTried = state.themesTried || [];
  const streak = state.streak || { count: 0, last: null };
  const completed = state.completed || 0;

  function grant(id) {
    setState((s) => (s.earned?.includes(id) ? s : { ...s, earned: [...(s.earned || []), id] }));
  }
  function tryTheme(k) {
    setState((s) => (s.themesTried?.includes(k) ? s : { ...s, themesTried: [...(s.themesTried || []), k] }));
  }
  function setCompleted(updater) {
    setState((s) => ({ ...s, completed: typeof updater === "function" ? updater(s.completed || 0) : updater }));
  }

  // streak tick once state has hydrated
  useEffect(() => {
    if (!loaded) return;
    setState((s) => {
      const t = todayKey();
      if (s.streak?.last === t) return s;
      let next;
      if (!s.streak?.last) next = { count: 1, last: t };
      else {
        const d = diffDays(t, s.streak.last);
        next = d === 1 ? { count: (s.streak.count || 0) + 1, last: t } : { count: 1, last: t };
      }
      return { ...s, streak: next };
    });
    // eslint-disable-next-line
  }, [loaded]);

  // derived grants
  useEffect(() => { if (loaded) grant("first_login"); /* eslint-disable-next-line */ }, [loaded]);
  useEffect(() => { if (themesTried.length >= 3) grant("theme_explorer"); /* eslint-disable-next-line */ }, [themesTried]);
  useEffect(() => {
    if ((streak?.count || 0) >= 3) grant("streak_3");
    if ((streak?.count || 0) >= 7) grant("streak_7");
    if ((streak?.count || 0) >= 30) grant("streak_30");
    /* eslint-disable-next-line */
  }, [streak]);
  useEffect(() => { if (completed >= 10) grant("ten_cards"); /* eslint-disable-next-line */ }, [completed]);

  return { earned, grant, streak, tryTheme, themesTried, completed, setCompleted };
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

/* Normalize any item into a Jira-style task (used for converting board styles) */
function normTask(k = {}) {
  return {
    title: k.title || "Untitled",
    done: !!k.done,
    description: k.description || "",
    priority: k.priority || "medium",
    due: k.due || "",
    status: k.status || (k.done ? "done" : "todo"),
    assignee: k.assignee || "",
    mentions: k.mentions || [],
    tags: k.tags || [],
  };
}

/* Flatten any board into a list of tasks. */
function boardItems(board) {
  const out = [];
  if (board.type === "kanban") for (const c of board.columns || []) for (const k of c.cards || []) out.push(normTask(k));
  else if (board.type === "checklist") for (const i of board.items || []) out.push(normTask(i));
  else if (board.type === "roadmap") for (const l of board.lanes || []) for (const i of l.items || []) out.push(normTask(i));
  else if (board.type === "calendar") for (const e of board.events || []) out.push(normTask({ title: e.title, due: e.date, description: e.note }));
  else if (board.type === "table") for (const r of board.rows || []) out.push(normTask({ title: (r.values && r.values[0]) || "Row", assignee: (r.values && r.values[1]) || "" }));
  else if (board.type === "notes") for (const n of board.notes || []) out.push(normTask({ title: (n.text || "Note").split("\n")[0].slice(0, 60) || "Note", description: n.text }));
  return out;
}

/* Convert a board to a different style, preserving its tasks where possible. */
function convertBoard(board, newType) {
  if (board.type === newType) return board;
  const items = boardItems(board);
  const base = { id: board.id, name: board.name, type: newType, createdAt: board.createdAt };
  if (newType === "kanban") {
    const cols = [
      { id: crypto.randomUUID(), name: "To do", cards: [] },
      { id: crypto.randomUUID(), name: "Doing", cards: [] },
      { id: crypto.randomUUID(), name: "Done", cards: [] },
    ];
    for (const it of items) {
      const idx = (it.status === "done" || it.done) ? 2 : (it.status === "in-progress" || it.status === "in-review") ? 1 : 0;
      cols[idx].cards.push({ id: crypto.randomUUID(), ...it });
    }
    return { ...base, columns: cols };
  }
  if (newType === "checklist") return { ...base, items: items.map((it) => ({ id: crypto.randomUUID(), title: it.title, done: it.done, due: it.due })) };
  if (newType === "calendar") return { ...base, events: items.filter((it) => it.due).map((it) => ({ id: crypto.randomUUID(), title: it.title, date: it.due, time: "", color: "#25d366", note: it.description || "" })) };
  if (newType === "roadmap") {
    const lanes = [
      { id: crypto.randomUUID(), name: "Now", items: [] },
      { id: crypto.randomUUID(), name: "Next", items: [] },
      { id: crypto.randomUUID(), name: "Later", items: [] },
    ];
    for (const it of items) lanes[(it.status === "done" || it.done) ? 2 : 0].items.push({ id: crypto.randomUUID(), title: it.title, due: it.due, done: it.done });
    return { ...base, lanes };
  }
  if (newType === "table") return { ...base, columns: ["Title", "Owner", "Status"], rows: items.map((it) => ({ id: crypto.randomUUID(), values: [it.title, it.assignee || "", STATUSES.find((s) => s.id === it.status)?.label || (it.done ? "Done" : "To Do")] })) };
  if (newType === "notes") return { ...base, notes: items.map((it) => ({ id: crypto.randomUUID(), text: it.title + (it.description ? "\n" + it.description : "") })) };
  return { ...base };
}

/* Plain-text summary of a board — shareable into any chat. */
function boardToText(board) {
  const items = boardItems(board);
  let txt = `📋 ${board.name}\n`;
  if (!items.length) return txt + "(empty board)";
  for (const it of items) {
    const box = (it.done || it.status === "done") ? "✅" : "⬜";
    const bits = [];
    if (it.assignee) bits.push("@" + it.assignee);
    if (it.due) bits.push("due " + it.due);
    if (it.priority && it.priority !== "medium") bits.push(it.priority);
    txt += `${box} ${it.title}${bits.length ? "  (" + bits.join(", ") + ")" : ""}\n`;
  }
  return txt.trim();
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
  // Shift a card to another board (Kanban/Checklist/Calendar targets).
  function moveCard(card, fromId, toId) {
    const target = boards.find((b) => b.id === toId);
    if (!target) return;
    const accepts = target.type === "kanban" || target.type === "checklist" || (target.type === "calendar" && card.due);
    if (!accepts) return;
    setBoards(boards.map((b) => {
      if (b.id === fromId && b.type === "kanban") {
        return { ...b, columns: b.columns.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== card.id) })) };
      }
      if (b.id === toId) {
        if (b.type === "kanban") return { ...b, columns: b.columns.map((c, i) => (i === 0 ? { ...c, cards: [{ ...card }, ...c.cards] } : c)) };
        if (b.type === "checklist") return { ...b, items: [{ id: card.id, title: card.title, done: !!card.done, due: card.due }, ...b.items] };
        if (b.type === "calendar") return { ...b, events: [{ id: card.id, title: card.title, date: card.due, time: "", color: "#25d366", note: card.description || "" }, ...b.events] };
      }
      return b;
    }));
  }

  if (open) {
    return <BoardDetail T={T} board={open} onBack={() => setOpenId(null)} onChange={update} gam={gam} allBoards={boards} onMoveCard={moveCard} />;
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
            <button key={t.id} onClick={() => setType(t.id)} onDoubleClick={() => onCreate(t.id, name.trim())}
              title="Double-click to create instantly"
              className={`${active ? T.chipActive : T.chipIdle} rounded-lg p-3 text-left transition`}>
              <div className="flex items-center gap-2"><Icon className="w-4 h-4" /><span className="font-medium text-sm">{t.name}</span></div>
              <div className={`text-xs mt-1 ${active ? "" : T.muted}`}>{t.blurb}</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 mt-4">
        <span className={`text-[11px] ${T.muted}`}>Tip: double-click a style to create it instantly.</span>
        <div className="flex gap-2">
          <button onClick={onCancel} className={`${T.btnGhost} px-4 py-2 rounded-lg text-sm font-medium`}>Cancel</button>
          <button onClick={() => onCreate(type, name.trim())} className={`${T.btn} px-4 py-2 rounded-lg text-sm font-medium`}>Create</button>
        </div>
      </div>
    </div>
  );
}

function BoardDetail({ T, board, onBack, onChange, gam, allBoards, onMoveCard }) {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className={`${T.btnGhost} px-3 py-1.5 rounded-lg text-sm shrink-0`}>← Back</button>
          <input
            value={board.name}
            onChange={(e) => onChange({ ...board, name: e.target.value })}
            className={`bg-transparent font-[var(--font-display)] text-xl sm:text-2xl font-bold ${T.text} outline-none min-w-0 flex-1 truncate`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShareOpen(true)} className={`${T.btnGhost} px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5`}>
            <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
          </button>
          <select value={board.type}
            onChange={(e) => onChange(convertBoard(board, e.target.value))}
            title="Change board style (keeps your tasks)"
            className={`${T.input} rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer`}>
            {BOARD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {board.type === "kanban"    && <KanbanView    T={T} board={board} onChange={onChange} gam={gam} allBoards={allBoards} onMoveCard={onMoveCard} />}
      {board.type === "table"     && <TableView     T={T} board={board} onChange={onChange} gam={gam} />}
      {board.type === "roadmap"   && <RoadmapView   T={T} board={board} onChange={onChange} gam={gam} />}
      {board.type === "calendar"  && <CalendarView  T={T} board={board} onChange={onChange} allBoards={allBoards} />}
      {board.type === "checklist" && <ChecklistView T={T} board={board} onChange={onChange} gam={gam} />}
      {board.type === "notes"     && <NotesView     T={T} board={board} onChange={onChange} />}

      <ShareModal T={T} open={shareOpen} onClose={() => setShareOpen(false)} board={board} />
    </div>
  );
}

/* ---- Board share modal (frontend shell) ---- */
function ShareModal({ T, open, onClose, board }) {
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [email, setEmail] = useState("");
  const [visibility, setVisibility] = useState("private");
  const link = `https://whatsplan.app/board/${board.id}`;
  function copy() {
    try { navigator.clipboard?.writeText(link); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  function copyText() {
    try { navigator.clipboard?.writeText(boardToText(board)); } catch {}
    setCopiedText(true); setTimeout(() => setCopiedText(false), 2000);
  }
  function invite() {
    // TODO: POST /api/boards/:id/share with emails array
    setEmail("");
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div onClick={(e)=>e.stopPropagation()}
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className={`${T.panel} w-full max-w-md p-5 relative`}>
            <button onClick={onClose} className={`${T.muted} absolute top-3 right-3`}><X className="w-5 h-5" /></button>
            <div className={`font-semibold ${T.text} mb-3 inline-flex items-center gap-2`}><Share2 className="w-4 h-4" /> Share board</div>
            <div className="flex gap-2 mb-2">
              <input disabled value={link} className={`${T.input} flex-1 rounded-lg px-3 py-2 text-xs opacity-80`} />
              <button onClick={copy} className={`${T.btn} px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1`}>
                <Copy className="w-3.5 h-3.5" />{copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <div className={`text-[11px] ${T.muted} mb-3`}>The link goes live once the backend is connected.</div>

            <button onClick={copyText} className={`${T.btnGhost} w-full px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 mb-4`}>
              <MessageCircle className="w-4 h-4" /> {copiedText ? "Copied summary!" : "Copy as text — paste into any chat"}
            </button>

            <div className={`text-sm font-medium ${T.text} mb-2`}>Share with…</div>
            <div className="flex gap-2 mb-2 opacity-70">
              <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@email.com" className={`${T.input} flex-1 rounded-lg px-3 py-2 text-sm`} disabled />
              <button onClick={invite} className={`${T.btn} px-3 py-2 rounded-lg text-sm font-medium`} disabled>Invite</button>
            </div>
            <div className={`text-[11px] ${T.muted} mb-4`}>Add people by email once backend is connected.</div>

            <div className={`text-sm font-medium ${T.text} mb-2`}>Board visibility</div>
            <div className="flex gap-2">
              {["private", "anyone-with-link"].map((v) => (
                // TODO: wire to backend
                <button key={v} onClick={()=>setVisibility(v)} className={`${visibility===v?T.chipActive:T.chipIdle} px-3 py-1.5 rounded-full text-xs font-medium`}>
                  {v === "private" ? "Private" : "Anyone with link"}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- Kanban ---- */
/* Jira-style task metadata shared by Kanban (and other views) */
const STATUSES = [
  { id: "todo", label: "To Do", color: "#64748b" },
  { id: "in-progress", label: "In Progress", color: "#3b82f6" },
  { id: "in-review", label: "In Review", color: "#a855f7" },
  { id: "done", label: "Done", color: "#10b981" },
];

function dueMeta(due, done) {
  if (!due) return null;
  const d = new Date(due + "T00:00:00");
  if (isNaN(d.getTime())) return { label: due, color: "#64748b" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  const fmt = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (done) return { label: fmt, color: "#94a3b8" };
  if (diff < 0) return { label: `Overdue · ${fmt}`, color: "#ef4444" };
  if (diff === 0) return { label: "Today", color: "#f59e0b" };
  if (diff <= 2) return { label: `${fmt} · soon`, color: "#f59e0b" };
  return { label: fmt, color: "#64748b" };
}

function MentionEditor({ T, mentions, onChange }) {
  const [v, setV] = useState("");
  function add() {
    const name = v.replace(/^@/, "").trim();
    if (name && !mentions.includes(name)) onChange([...mentions, name]);
    setV("");
  }
  return (
    <div>
      <div className={`text-xs ${T.muted} mb-1 flex items-center gap-1`}><MessageCircle className="w-3 h-3" /> Mention people</div>
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {mentions.map((m) => (
            <span key={m} className={`inline-flex items-center gap-1 ${T.badge} ${T.text} px-2 py-0.5 rounded-full text-xs`}>
              @{m}
              <button onClick={() => onChange(mentions.filter((x) => x !== m))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <input value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        placeholder="@name, then Enter"
        className={`${T.input} w-full rounded-lg px-3 py-2 text-sm`} />
    </div>
  );
}

function KanbanView({ T, board, onChange, gam, allBoards = [], onMoveCard }) {
  const [editing, setEditing] = useState(null); // {colId, cardId}
  function addCard(colId, title) {
    if (!title) return;
    gam.grant("first_card");
    onChange({ ...board, columns: board.columns.map((c) => c.id === colId
      ? { ...c, cards: [...c.cards, { id: crypto.randomUUID(), title, done: false, description: "", priority: "medium", due: "", status: "todo", assignee: "", mentions: [], tags: [] }] } : c) });
  }
  function toggle(colId, cardId) {
    onChange({ ...board, columns: board.columns.map((c) => c.id === colId
      ? { ...c, cards: c.cards.map((k) => k.id === cardId
          ? { ...k, done: !k.done, status: !k.done ? "done" : (k.status === "done" ? "todo" : k.status) } : k) } : c) });
    gam.setCompleted((n) => n + 1);
  }
  function updateCard(colId, cardId, patch) {
    const p = { ...patch };
    if (p.status === "done") p.done = true;
    else if (p.status) p.done = false; // moving out of Done un-completes
    onChange({ ...board, columns: board.columns.map((c) => c.id === colId
      ? { ...c, cards: c.cards.map((k) => k.id === cardId ? { ...k, ...p } : k) } : c) });
  }
  function deleteCard(colId, cardId) {
    onChange({ ...board, columns: board.columns.map((c) => c.id === colId
      ? { ...c, cards: c.cards.filter((k) => k.id !== cardId) } : c) });
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
  const PRIO = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
  const openCard = editing ? board.columns.find(c => c.id === editing.colId)?.cards.find(k => k.id === editing.cardId) : null;
  return (
    <>
      <div className="flex gap-4 overflow-x-auto thin-scroll pb-4">
        {board.columns.map((col) => (
          <div key={col.id} className={`${T.column} p-3 min-w-[280px] w-[280px]`}>
            <div className="flex items-center justify-between mb-2 gap-2">
              <input value={col.name} onChange={(e) => renameColumn(col.id, e.target.value)}
                className={`bg-transparent font-semibold ${T.text} outline-none min-w-0 flex-1`} />
              <span className={`text-xs ${T.muted}`}>{col.cards.length}</span>
              <button onClick={() => deleteColumn(col.id)} className={`${T.muted} hover:text-red-500 shrink-0`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {col.cards.map((c) => (
                <div
                  key={c.id}
                  onDoubleClick={() => setEditing({ colId: col.id, cardId: c.id })}
                  className={`${T.card} p-3 text-sm ${T.text} flex items-start gap-2 cursor-pointer transition hover:scale-[1.01]`}
                  title="Double-click to open"
                >
                  <button onClick={(e) => { e.stopPropagation(); toggle(col.id, c.id); }} className={`mt-0.5 w-4 h-4 rounded border ${c.done ? "bg-[#25d366] border-[#25d366]" : "border-current opacity-40"} flex items-center justify-center shrink-0`}>
                    {c.done && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={c.done ? "line-through opacity-60" : ""}>{c.title}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {c.status && c.status !== "todo" && (() => {
                        const s = STATUSES.find((x) => x.id === c.status);
                        return s ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: s.color + "22", color: s.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} /> {s.label}
                          </span>
                        ) : null;
                      })()}
                      {c.priority && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: PRIO[c.priority] + "22", color: PRIO[c.priority] }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIO[c.priority] }} /> {c.priority}
                        </span>
                      )}
                      {c.due && (() => {
                        const d = dueMeta(c.due, c.done);
                        return <span className="inline-flex items-center gap-1 font-medium" style={{ color: d.color }}><Clock className="w-3 h-3" /> {d.label}</span>;
                      })()}
                      {c.assignee && (
                        <span className="inline-flex items-center gap-1" title={`Assigned to ${c.assignee}`}>
                          <span className="w-4 h-4 rounded-full bg-[#00a884] text-white grid place-items-center text-[8px] font-bold">{c.assignee[0]?.toUpperCase()}</span>
                        </span>
                      )}
                      {c.mentions?.length > 0 && (
                        <span className={`inline-flex items-center gap-0.5 ${T.muted}`} title={c.mentions.map((m) => "@" + m).join(" ")}>
                          <MessageCircle className="w-3 h-3" />{c.mentions.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <AddInline T={T} placeholder="+ Add a card" onAdd={(v) => addCard(col.id, v)} />
          </div>
        ))}
        <button onClick={addColumn} className={`${T.chipIdle} min-w-[160px] rounded-xl p-3 text-sm font-medium self-start`}>
          + Add column
        </button>
      </div>
      <CardModal
        T={T}
        card={openCard}
        allBoards={allBoards}
        currentBoardId={board.id}
        onMove={onMoveCard}
        onClose={() => setEditing(null)}
        onSave={(patch) => updateCard(editing.colId, editing.cardId, patch)}
        onDelete={() => { deleteCard(editing.colId, editing.cardId); setEditing(null); }}
      />
    </>
  );
}

function CardModal({ T, card, onClose, onSave, onDelete, allBoards = [], currentBoardId, onMove }) {
  const moveTargets = allBoards.filter((b) => b.id !== currentBoardId && ["kanban", "checklist", "calendar"].includes(b.type));
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={`${T.panel} w-full max-w-lg p-6 relative max-h-[88vh] overflow-y-auto thin-scroll`}
          >
            <button onClick={onClose} className={`${T.muted} absolute top-3 right-3 hover:text-red-500`}>
              <X className="w-5 h-5" />
            </button>
            <div className={`text-xs uppercase tracking-wider ${T.muted} mb-2`}>Card</div>
            <input
              value={card.title} onChange={(e) => onSave({ title: e.target.value })}
              className={`bg-transparent w-full text-xl font-bold ${T.text} outline-none mb-3`}
              placeholder="Card title"
            />
            <div className="space-y-3">
              <div>
                <div className={`text-xs ${T.muted} mb-1 flex items-center gap-1`}><AlignLeft className="w-3 h-3" /> Description</div>
                <textarea
                  value={card.description || ""} onChange={(e) => onSave({ description: e.target.value })}
                  placeholder="Add notes, context, or links…"
                  className={`${T.input} w-full rounded-lg px-3 py-2 text-sm min-h-[80px]`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={`text-xs ${T.muted} mb-1 flex items-center gap-1`}><Clock className="w-3 h-3" /> Due date</div>
                  <input
                    type="date" value={card.due || ""} onChange={(e) => onSave({ due: e.target.value })}
                    className={`${T.input} w-full rounded-lg px-3 py-2 text-sm`}
                  />
                </div>
                <div>
                  <div className={`text-xs ${T.muted} mb-1 flex items-center gap-1`}><Zap className="w-3 h-3" /> Priority</div>
                  <div className="flex gap-1">
                    {["low", "medium", "high"].map((p) => (
                      <button key={p}
                        onClick={() => onSave({ priority: p })}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium capitalize transition ${card.priority === p ? T.chipActive : T.chipIdle}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className={`text-xs ${T.muted} mb-1 flex items-center gap-1`}><ListChecks className="w-3 h-3" /> Status</div>
                <div className="flex gap-1 flex-wrap">
                  {STATUSES.map((s) => (
                    <button key={s.id} onClick={() => onSave({ status: s.id })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${card.status === s.id ? "text-white" : T.chipIdle}`}
                      style={card.status === s.id ? { background: s.color } : undefined}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={`text-xs ${T.muted} mb-1 flex items-center gap-1`}><User className="w-3 h-3" /> Assignee</div>
                <input value={card.assignee || ""} onChange={(e) => onSave({ assignee: e.target.value })}
                  placeholder="Name (pulls from WhatsApp contacts once connected)"
                  className={`${T.input} w-full rounded-lg px-3 py-2 text-sm`} />
              </div>
              <MentionEditor T={T} mentions={card.mentions || []} onChange={(m) => onSave({ mentions: m })} />
              {onMove && moveTargets.length > 0 && (
                <div>
                  <div className={`text-xs ${T.muted} mb-1 flex items-center gap-1`}><GitBranch className="w-3 h-3" /> Move to board</div>
                  <select value=""
                    onChange={(e) => { if (e.target.value) { onMove(card, currentBoardId, e.target.value); onClose(); } }}
                    className={`${T.input} w-full rounded-lg px-3 py-2 text-sm cursor-pointer`}>
                    <option value="">Keep on this board…</option>
                    {moveTargets.map((b) => <option key={b.id} value={b.id}>{b.name} ({BOARD_TYPES.find((t) => t.id === b.type)?.name})</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-5">
              <button onClick={onDelete} className="text-red-500 text-sm flex items-center gap-1 hover:underline">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button onClick={onClose} className={`${T.btn} px-4 py-2 rounded-lg text-sm font-medium`}>Done</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

/* ---- Calendar ---- */
function CalendarView({ T, board, onChange, allBoards = [] }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [editing, setEditing] = useState(null); // event or new draft
  const [draftDate, setDraftDate] = useState(null);
  const first = new Date(cursor.y, cursor.m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - startDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const monthName = first.toLocaleString(undefined, { month: "long", year: "numeric" });
  const todayIso = new Date().toISOString().slice(0, 10);
  const COLORS = ["#25d366", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  function isoFor(d) { return new Date(cursor.y, cursor.m, d).toISOString().slice(0, 10); }
  function eventsOn(d) { return (board.events || []).filter((e) => e.date === isoFor(d)).sort((a,b)=> (a.time||"").localeCompare(b.time||"")); }
  // Cross-board sync: any dated task from every other board appears here.
  const crossRefs = useMemo(() => {
    const out = [];
    for (const b of allBoards) {
      if (!b || b.id === board.id) continue;
      for (const it of boardItems(b)) if (it.due) out.push({ date: it.due, title: it.title, source: b.name });
    }
    return out;
  }, [allBoards, board.id]);
  function refsOn(d) { const iso = isoFor(d); return crossRefs.filter(r => r.date === iso); }
  function openNew(d) { setDraftDate(isoFor(d)); setEditing({ id: null, date: isoFor(d), title: "", time: "", color: COLORS[0], note: "" }); }
  function saveEvent(ev) {
    if (!ev.title) { setEditing(null); return; }
    const events = board.events || [];
    if (ev.id) onChange({ ...board, events: events.map(e => e.id === ev.id ? ev : e) });
    else onChange({ ...board, events: [...events, { ...ev, id: crypto.randomUUID() }] });
    setEditing(null);
  }
  function deleteEvent(id) { onChange({ ...board, events: (board.events || []).filter(e => e.id !== id) }); setEditing(null); }
  function go(delta) {
    let m = cursor.m + delta, y = cursor.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCursor({ y, m });
  }
  function goToday() { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); }

  const upcoming = useMemo(() => {
    const own = (board.events || []).map((e) => ({ ...e, kind: "event" }));
    const refs = crossRefs.map((r, i) => ({ id: "ref" + i, title: r.title, date: r.date, source: r.source, kind: "ref" }));
    return [...own, ...refs]
      .filter((e) => e.date >= todayIso)
      .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
      .slice(0, 8);
  }, [board.events, crossRefs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className={`${T.panel} p-5`}>
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => go(-1)} className={`${T.btnGhost} px-3 py-1 rounded-lg`}>‹</button>
            <div className={`font-semibold ${T.text} min-w-[160px] text-center`}>{monthName}</div>
            <button onClick={() => go(1)} className={`${T.btnGhost} px-3 py-1 rounded-lg`}>›</button>
          </div>
          <button onClick={goToday} className={`${T.chipIdle} px-3 py-1 rounded-lg text-xs font-medium`}>Today</button>
        </div>
        <div className={`grid grid-cols-7 gap-1 text-xs font-medium mb-1 ${T.muted}`}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => <div key={i} className="text-center py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
             const iso = d ? isoFor(d) : null;
             const isToday = iso === todayIso;
             const evs = d ? eventsOn(d) : [];
             const refs = d ? refsOn(d) : [];
             return (
               <div key={i}
                 className={`${d ? T.panelSoft : "opacity-0 pointer-events-none"} min-h-[48px] sm:min-h-[88px] p-1.5 text-xs ${T.text} ${isToday ? "ring-2 ring-[#25d366]" : ""} relative group`}>
                 {d && (
                   <>
                     <button onClick={() => openNew(d)} className={`w-full text-left font-semibold ${isToday ? "text-[#25d366]" : "opacity-70"} hover:opacity-100`}>
                       {d}{isToday && <span className="ml-1 text-[9px] uppercase tracking-wider">today</span>}
                     </button>
                     <div className="mt-1 space-y-0.5">
                       {evs.slice(0, 3).map((e) => (
                         <button key={e.id}
                           onClick={() => setEditing(e)}
                           className="w-full text-left text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1"
                           style={{ background: (e.color || "#25d366") + "33", color: e.color || "#25d366" }}>
                           {e.time && <span className="font-semibold">{e.time}</span>} {e.title}
                         </button>
                       ))}
                       {refs.slice(0, 2).map((r, ri) => (
                         <div key={"r"+ri} title={`${r.source} · ${r.title}`}
                           className={`text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1 ${T.muted}`}
                           style={{ background: "currentColor", color: "currentColor", backgroundColor: "rgba(37,211,102,0.12)" }}>
                           <span className="opacity-80">↗</span> <span className="truncate">{r.title}</span>
                         </div>
                       ))}
                       {(evs.length + refs.length) > 5 && <div className={`text-[9px] ${T.muted}`}>+{evs.length + refs.length - 5} more</div>}
                     </div>
                   </>
                 )}
               </div>
             );
           })}
        </div>
      </div>

      {/* Sidebar: upcoming */}
      <div className={`${T.panel} p-4 self-start`}>
        <div className={`font-semibold ${T.text} flex items-center gap-2 mb-3`}>
          <Clock className="w-4 h-4" /> Upcoming
        </div>
        {upcoming.length === 0 && <div className={`text-sm ${T.muted}`}>Nothing scheduled. Click any day to add an event.</div>}
        <div className="space-y-2">
          {upcoming.map((e) => {
            const isRef = e.kind === "ref";
            const inner = (
              <>
                <div className="w-1 self-stretch rounded-full" style={{ background: e.color || "#25d366" }} />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium ${T.text} truncate`}>{e.title}</div>
                  <div className={`text-[11px] ${T.muted} truncate`}>{e.date}{e.time ? ` · ${e.time}` : ""}{isRef ? ` · ${e.source}` : ""}</div>
                </div>
                {isRef && <span className="text-[10px] opacity-60 shrink-0">↗</span>}
              </>
            );
            return isRef ? (
              <div key={e.id} title={`From ${e.source}`} className={`${T.panelSoft} w-full p-2 text-left flex items-start gap-2`}>{inner}</div>
            ) : (
              <button key={e.id} onClick={() => setEditing(e)} className={`${T.panelSoft} w-full p-2 text-left flex items-start gap-2`}>{inner}</button>
            );
          })}
        </div>
      </div>

      {/* Event modal */}
      <AnimatePresence>
        {editing && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)}>
            <motion.div onClick={(e)=>e.stopPropagation()}
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className={`${T.panel} w-full max-w-md p-5 relative`}>
              <button onClick={() => setEditing(null)} className={`${T.muted} absolute top-3 right-3`}><X className="w-5 h-5" /></button>
              <div className={`text-xs uppercase tracking-wider ${T.muted} mb-2`}>Event · {editing.date}</div>
              <input autoFocus value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Event title"
                className={`bg-transparent w-full text-lg font-bold ${T.text} outline-none mb-3`} />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className={`text-xs ${T.muted} mb-1`}>Date</div>
                  <input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    className={`${T.input} w-full rounded-lg px-2 py-1.5 text-sm`} />
                </div>
                <div>
                  <div className={`text-xs ${T.muted} mb-1`}>Time</div>
                  <input type="time" value={editing.time || ""} onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                    className={`${T.input} w-full rounded-lg px-2 py-1.5 text-sm`} />
                </div>
              </div>
              <div className="mb-3">
                <div className={`text-xs ${T.muted} mb-1`}>Color</div>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setEditing({ ...editing, color: c })}
                      className={`w-7 h-7 rounded-full border-2 ${editing.color === c ? "border-white scale-110 ring-2 ring-current" : "border-transparent"}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <textarea value={editing.note || ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                placeholder="Notes (optional)"
                className={`${T.input} w-full rounded-lg px-3 py-2 text-sm min-h-[60px] mb-3`} />
              <div className="flex justify-between">
                {editing.id ? (
                  <button onClick={() => deleteEvent(editing.id)} className="text-red-500 text-sm flex items-center gap-1 hover:underline">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                ) : <span />}
                <button onClick={() => saveEvent(editing)} className={`${T.btn} px-4 py-2 rounded-lg text-sm font-medium`}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
/* Chats / Calls placeholder views                                          */
/* ====================================================================== */
/* ====================================================================== */
/* Shared helpers                                                          */
/* ====================================================================== */
function fmtTime(ts) {
  if (!ts) return "";
  try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}
function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* Connection banner shared by Chats and Planner */
/* Linking happens at the login gate, so inside the app you're always linked.
   The only state still worth surfacing here is the backend dropping offline. */
function ConnectBanner({ T, session }) {
  if (session.online) return null;
  return (
    <div className="rounded-lg p-3 bg-amber-500/15 border border-amber-500/40 flex items-center gap-2">
      <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold ${T.text}`}>Backend offline</div>
        <div className={`text-[11px] ${T.muted}`}>Reconnecting… start the server if it's stopped.</div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* ChatsView — wired to the WhatsPlan backend                               */
/* ====================================================================== */
function ChatsView({ T, wallpaper }) {
  const session = useSession();
  const chats = useChats();
  const [selectedChat, setSelectedChat] = useState(null);
  const messages = useMessages(selectedChat?.id);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = useMemo(
    () => chats.filter((c) => (c.name || "").toLowerCase().includes(query.toLowerCase())),
    [chats, query],
  );

  async function handleSend() {
    const text = draft.trim();
    if (!text || !selectedChat) return;
    setDraft("");
    setSending(true);
    try { await api.sendMessage(selectedChat.id, text); }
    catch { setDraft(text); }
    finally { setSending(false); }
  }

  return (
    <div className="flex h-full">
      {/* LEFT panel */}
      <div className={`${T.sidebar} w-full md:w-80 shrink-0 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-3 border-b border-current/10 space-y-3">
          <div className={`${T.input} flex items-center gap-2 rounded-lg px-3 py-1.5`}>
            <Search className="w-4 h-4 opacity-60" />
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search chats" className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <ConnectBanner T={T} session={session} />
        </div>
        <div className="flex-1 overflow-auto thin-scroll">
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <svg viewBox="0 0 64 64" className="w-16 h-16 mx-auto mb-3 opacity-60"><circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M20 28h24M20 36h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <div className={`font-semibold ${T.text}`}>{query ? "No matches" : "No chats yet"}</div>
              <div className={`text-sm ${T.muted} mt-1`}>Your WhatsApp conversations appear here once connected.</div>
            </div>
          ) : (
            <div>
              {filtered.map((c) => {
                const active = selectedChat?.id === c.id;
                return (
                  <button key={c.id} onClick={() => setSelectedChat(c)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 border-b border-current/5 ${active ? T.chipActive : "hover:bg-current/5"}`}>
                    <div className={`${T.accent} w-10 h-10 rounded-full grid place-items-center font-semibold shrink-0`}>
                      {(c.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium truncate ${active ? "" : T.text}`}>{c.name}</span>
                        <span className={`text-[10px] shrink-0 ${active ? "" : T.muted}`}>{fmtTime(c.timestamp)}</span>
                      </div>
                      <div className={`text-xs truncate ${active ? "" : T.muted}`}>{c.lastMessage || (c.isGroup ? "Group" : "")}</div>
                    </div>
                    {c.unread ? <span className="bg-[#25d366] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0">{c.unread}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MAIN panel */}
      <div className={`flex-1 ${T.panel} m-0 md:m-3 flex flex-col ${selectedChat ? "flex" : "hidden md:flex"}`} style={wallpaper ? { background: wallpaper } : undefined}>
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="inline-block"><WPLogo size={80} /></div>
              <div className={`mt-4 font-[var(--font-display)] text-xl font-bold ${T.text}`}>Select a conversation</div>
              <div className={`${T.muted} text-sm mt-1 max-w-sm`}>Your chats appear once WhatsApp is connected.</div>
            </div>
          </div>
        ) : (
          <>
            <header className={`${T.topbar} h-14 flex items-center px-3 gap-3`}>
              <button onClick={()=>setSelectedChat(null)} className={`${T.btnGhost} px-2 py-1 rounded-md text-sm`}>←</button>
              <div className={`${T.accent} w-9 h-9 rounded-full grid place-items-center font-semibold shrink-0`}>
                {(selectedChat.name || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className={`font-semibold ${T.text} truncate`}>{selectedChat?.name || "Chat"}</div>
            </header>
            <div className="flex-1 overflow-auto p-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className={`${T.muted} text-sm`}>No messages yet</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`${m.fromMe ? T.bubbleMe : T.bubbleThem} max-w-[75%] rounded-lg px-3 py-2 text-sm`}>
                        {!m.fromMe && selectedChat?.isGroup && (
                          <div className="text-[11px] font-semibold opacity-70 mb-0.5">{m.fromName || m.from}</div>
                        )}
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className="text-[10px] opacity-60 text-right mt-1">{fmtTime(m.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`${T.topbar} p-2 flex items-center gap-2`}>
              <input value={draft} onChange={(e)=>setDraft(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleSend()}
                disabled={session.status !== "ready" || session.readOnly}
                placeholder={session.readOnly ? "Read-only mode — sending disabled" : session.status === "ready" ? "Type a message" : "Connect WhatsApp to send"}
                className={`${T.input} flex-1 rounded-full px-4 py-2 text-sm disabled:opacity-60`} />
              <button onClick={handleSend} disabled={sending || session.status !== "ready" || session.readOnly}
                className={`${T.btn} w-10 h-10 rounded-full grid place-items-center disabled:opacity-50`}><Send className="w-4 h-4" /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* CallsView — backend-ready shell                                          */
/* ====================================================================== */
function CallsView({ T }) {
  const { status } = useSession();
  const connected = status === "ready";
  // Call history isn't exposed by whatsapp-web.js; reflect connection only.
  const [calls, setCalls] = useState([]);
  const [filter, setFilter] = useState("all");
  const filters = ["all", "missed", "incoming", "outgoing"];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto relative min-h-full">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text}`}>Calls</h2>
        <div className={`${T.badge} px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 ${T.text}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-[#25d366]" : "bg-gray-400"}`} />
          {connected ? "Connected" : "Not connected"}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          // TODO: filter when backend data available
          <button key={f} onClick={()=>setFilter(f)} className={`${filter===f?T.chipActive:T.chipIdle} px-3 py-1 rounded-full text-xs font-medium capitalize`}>{f}</button>
        ))}
      </div>
      <div className={`${T.panel} p-8 text-center`}>
        {calls.length === 0 ? (
          <>
            <svg viewBox="0 0 64 64" className="w-14 h-14 mx-auto mb-3 opacity-60"><path d="M16 14c0-2 2-4 4-4h6l3 9-5 4c2 6 7 11 13 13l4-5 9 3v6c0 2-2 4-4 4C28 44 14 30 14 14z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
            <div className={`font-semibold ${T.text}`}>No call history</div>
            <div className={`${T.muted} text-sm mt-1`}>Call history will appear here once WhatsApp is connected.</div>
          </>
        ) : null}
      </div>
      <button
        onClick={() => { /* TODO: initiate call via backend */ }}
        className={`${T.btn} fixed md:absolute bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full shadow-lg grid place-items-center`}
        aria-label="New call">
        <Phone className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ====================================================================== */
/* Planner view — AI-sorted Meetings / Tasks / Announcements                */
/* ====================================================================== */
const PRIO_COLORS = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };

function SourceLine({ T, item }) {
  return (
    <div className={`mt-2 text-[11px] ${T.muted} flex items-center gap-1.5 flex-wrap`}>
      <MessageCircle className="w-3 h-3 shrink-0" />
      <span className="font-medium">{item.author || "Someone"}</span>
      <span>in {item.chatName}</span>
      {typeof item.confidence === "number" && (
        <span className={`${T.badge} px-1.5 py-0.5 rounded-full`}>{Math.round(item.confidence * 100)}%</span>
      )}
    </div>
  );
}

function PlannerView({ T }) {
  const session = useSession();
  const { meetings, tasks, announcements, patchItem, deleteItem } = usePlanner();
  const [sub, setSub] = useState("meetings");

  const sortedAnns = useMemo(
    () => [...announcements].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [announcements],
  );

  const subs = [
    { id: "meetings", label: "Meetings", icon: CalendarIcon, count: meetings.length },
    { id: "tasks", label: "Tasks", icon: ListChecks, count: tasks.length },
    { id: "announcements", label: "Announcements", icon: StickyNote, count: announcements.length },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-4">
        <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text}`}>Planner</h2>
        <p className={`${T.muted} text-sm`}>Meetings, tasks and announcements the agent pulled from your group chats.</p>
      </div>

      <div className="mb-4"><ConnectBanner T={T} session={session} /></div>

      {/* sub-tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {subs.map((s) => {
          const Icon = s.icon;
          const active = sub === s.id;
          return (
            <button key={s.id} onClick={() => setSub(s.id)}
              className={`${active ? T.chipActive : T.chipIdle} px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2`}>
              <Icon className="w-4 h-4" /> {s.label}
              <span className={`${T.badge} text-[10px] px-1.5 py-0.5 rounded-full`}>{s.count}</span>
            </button>
          );
        })}
      </div>

      {/* MEETINGS */}
      {sub === "meetings" && (
        <div className="space-y-3">
          {meetings.length === 0 && <EmptyState T={T} icon={CalendarIcon} label="No meetings captured yet" hint="Scheduling messages with a time or call link land here." />}
          {meetings.map((m) => (
            <div key={m.id} className={`${T.card} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold ${T.text} flex items-center gap-2 flex-wrap`}>
                    {m.title}
                    {m.incomplete && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600">Incomplete draft</span>}
                  </div>
                  <div className={`mt-1 text-sm ${T.muted} flex flex-col gap-1`}>
                    <label className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {m.datetime ? (
                        <span className={T.text}>{fmtDateTime(m.datetime)}</span>
                      ) : (
                        <input type="datetime-local" onChange={(e) => patchItem("meetings", m.id, { datetime: new Date(e.target.value).toISOString(), incomplete: false })}
                          className={`${T.input} rounded px-2 py-1 text-xs`} />
                      )}
                    </label>
                    {m.location && <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> {m.location}</div>}
                    {m.link && (
                      <a href={m.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#128c7e] hover:underline w-fit">
                        <ExternalLink className="w-3.5 h-3.5" /> Join link
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteItem("meetings", m.id)} className={`${T.muted} hover:text-red-500 shrink-0`}><Trash2 className="w-4 h-4" /></button>
              </div>
              <SourceLine T={T} item={m} />
            </div>
          ))}
        </div>
      )}

      {/* TASKS */}
      {sub === "tasks" && (
        <div className="space-y-2">
          {tasks.length === 0 && <EmptyState T={T} icon={ListChecks} label="No tasks captured yet" hint="Action items and assignments from chats show up here." />}
          {tasks.map((t) => (
            <div key={t.id} className={`${T.card} p-3 flex items-start gap-3`}>
              <button onClick={() => patchItem("tasks", t.id, { done: !t.done })}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${t.done ? "bg-[#25d366] border-[#25d366]" : "border-current opacity-40"}`}>
                {t.done && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${T.text} ${t.done ? "line-through opacity-60" : ""}`}>{t.description}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: PRIO_COLORS[t.priority] + "22", color: PRIO_COLORS[t.priority] }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIO_COLORS[t.priority] }} /> {t.priority}
                  </span>
                  {t.assignee && <span className={`${T.badge} px-1.5 py-0.5 rounded-full ${T.text}`}><User className="w-3 h-3 inline -mt-0.5 mr-0.5" />{t.assignee}</span>}
                  {t.due && <span className={`${T.badge} px-1.5 py-0.5 rounded-full ${T.text}`}><Clock className="w-3 h-3 inline -mt-0.5 mr-0.5" />{fmtDateTime(t.due)}</span>}
                </div>
                <SourceLine T={T} item={t} />
              </div>
              <button onClick={() => deleteItem("tasks", t.id)} className={`${T.muted} hover:text-red-500 shrink-0`}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {sub === "announcements" && (
        <div className="space-y-3">
          {sortedAnns.length === 0 && <EmptyState T={T} icon={StickyNote} label="No announcements yet" hint="Important broadcasts get parked here so they aren't buried." />}
          {sortedAnns.map((a) => (
            <div key={a.id} className={`${T.card} p-4 ${a.pinned ? "ring-2 ring-[#25d366]/40" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`text-sm ${T.text} whitespace-pre-wrap break-words min-w-0 flex-1`}>{a.text}</div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => patchItem("announcements", a.id, { pinned: !a.pinned })}
                    className={`${a.pinned ? "text-[#25d366]" : T.muted} hover:text-[#25d366]`} title={a.pinned ? "Unpin" : "Pin"}>
                    <Pin className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteItem("announcements", a.id)} className={`${T.muted} hover:text-red-500`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <SourceLine T={T} item={a} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ T, icon: Icon, label, hint }) {
  return (
    <div className={`${T.panel} p-10 text-center`}>
      <Icon className={`w-10 h-10 mx-auto mb-3 ${T.muted}`} />
      <div className={`font-semibold ${T.text}`}>{label}</div>
      <div className={`${T.muted} text-sm mt-1`}>{hint}</div>
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
function ToggleRow({ T, label, hint, value, onChange, icon: Icon }) {
  return (
    <div className={`${T.panelSoft} flex items-center gap-3 p-3`}>
      {Icon && <Icon className={`w-4 h-4 ${T.text} shrink-0`} />}
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium ${T.text}`}>{label}</div>
        {hint && <div className={`text-xs ${T.muted}`}>{hint}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`shrink-0 w-10 h-6 rounded-full transition relative ${value ? "bg-[#25d366]" : "bg-black/20"}`}>
        <span className={`absolute top-0.5 ${value ? "left-5" : "left-0.5"} w-5 h-5 rounded-full bg-white shadow transition-all`} />
      </button>
    </div>
  );
}

const GLOW_COLORS = [
  { name: "WhatsApp", c: "#25d366" },
  { name: "Mint",     c: "#5eead4" },
  { name: "Cyan",     c: "#22d3ee" },
  { name: "Violet",   c: "#a78bfa" },
  { name: "Pink",     c: "#f472b6" },
  { name: "Amber",    c: "#fbbf24" },
  { name: "Crimson",  c: "#f87171" },
];

function SettingsView({ T, user, themeKey, setTheme, onLogout, gam, settings, setSettings, glowColor, setGlowColor }) {
  const [section, setSection] = useState("account");
  const sections = [
    { id: "account",       label: "Account",       icon: User },
    { id: "appearance",    label: "Appearance",    icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy",       label: "Privacy",       icon: Shield },
    { id: "chats",         label: "Chats",         icon: MessageSquare },
    { id: "storage",       label: "Storage & data",icon: Database },
    { id: "shortcuts",     label: "Shortcuts",     icon: Keyboard },
    { id: "pet",           label: "Pet companion", icon: Sparkles },
    { id: "density",       label: "Density",       icon: Zap },
    { id: "help",          label: "Help",          icon: HelpCircle },
  ];
  const set = (patch) => setSettings({ ...settings, ...patch });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className={`font-[var(--font-display)] text-2xl font-bold ${T.text} mb-6`}>Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        {/* sidebar */}
        <nav className={`${T.panel} p-2 self-start md:sticky md:top-4`}>
          {sections.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`${active ? T.chipActive : T.chipIdle} w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-1`}>
                <Icon className="w-4 h-4" /> <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {section === "account" && (
            <div className={`${T.panel} p-5`}>
              <div className="flex items-center gap-3">
                <div className={`${T.accent} w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg`}>
                  {(user?.name?.[0] || "U").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold truncate ${T.text}`}>{user?.name || "You"}</div>
                  <div className={`text-xs ${T.muted} truncate`}>{user?.wid ? "+" + String(user.wid).replace(/@.*$/, "") : ""}</div>
                  <div className={`text-[11px] ${T.muted} mt-0.5 inline-flex items-center gap-1`}>
                    <ShieldCheck className="w-3 h-3 text-[#25d366]" /> Signed in with WhatsApp
                  </div>
                </div>
                <button onClick={onLogout} title="Unlinks WhatsApp" className={`${T.btnGhost} px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 shrink-0`}>
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}

          {section === "appearance" && (
            <>
              <div className={`${T.panel} p-5`}>
                <div className="flex items-center gap-2 mb-3"><Palette className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Theme</div></div>
                <p className={`${T.muted} text-sm mb-3`}>All themes use WhatsApp's green palette.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
              </div>

              {themeKey === "neon" && (
                <div className={`${T.panel} p-5`}>
                  <div className="flex items-center gap-2 mb-3"><Zap className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Neon glow color</div></div>
                  <p className={`${T.muted} text-sm mb-3`}>Pick the glow that surrounds your panels and buttons.</p>
                  <div className="flex flex-wrap gap-3">
                    {GLOW_COLORS.map((g) => (
                      <button key={g.c} onClick={() => setGlowColor(g.c)}
                        className={`relative w-12 h-12 rounded-full transition ${glowColor === g.c ? "scale-110 ring-2 ring-white" : ""}`}
                        style={{ background: g.c, boxShadow: `0 0 18px ${g.c}, inset 0 0 12px ${g.c}88` }}
                        title={g.name}
                      >
                        {glowColor === g.c && <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />}
                      </button>
                    ))}
                    <label className="flex items-center gap-2 ml-2">
                      <input type="color" value={glowColor} onChange={(e) => setGlowColor(e.target.value)}
                        className="w-12 h-12 rounded-full border-none cursor-pointer bg-transparent" />
                      <span className={`text-xs ${T.muted}`}>Custom</span>
                    </label>
                  </div>
                </div>
              )}

              <div className={`${T.panel} p-5 space-y-2`}>
                <div className="flex items-center gap-2 mb-2"><Type className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Text & motion</div></div>
                <div>
                  <div className={`text-sm ${T.text} mb-1`}>Font size: <b>{settings.fontSize}px</b></div>
                  <input type="range" min={12} max={20} value={settings.fontSize} onChange={(e) => set({ fontSize: +e.target.value })} className="w-full accent-[#25d366]" />
                </div>
                <ToggleRow T={T} label="Reduce motion" hint="Tone down animations" icon={Sparkles}
                  value={settings.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
                <ToggleRow T={T} label="Show streak in sidebar" icon={Flame}
                  value={settings.showStreak} onChange={(v) => set({ showStreak: v })} />
              </div>
            </>
          )}

          {section === "notifications" && (
            <div className={`${T.panel} p-5 space-y-2`}>
              <div className="flex items-center gap-2 mb-2"><Bell className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Notifications</div></div>
              <ToggleRow T={T} icon={MessageSquare} label="Message notifications" hint="New chats arrive in WhatsPlan" value={settings.notifMessages} onChange={(v) => set({ notifMessages: v })} />
              <ToggleRow T={T} icon={Kanban} label="Board reminders" hint="Due dates and assignments" value={settings.notifBoards} onChange={(v) => set({ notifBoards: v })} />
              <ToggleRow T={T} icon={Volume2} label="Sounds" value={settings.notifSounds} onChange={(v) => set({ notifSounds: v })} />
              <ToggleRow T={T} icon={Eye} label="Show previews" value={settings.notifPreviews} onChange={(v) => set({ notifPreviews: v })} />
            </div>
          )}

          {section === "privacy" && (
            <div className={`${T.panel} p-5 space-y-2`}>
              <div className="flex items-center gap-2 mb-2"><Shield className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Privacy</div></div>
              <ToggleRow T={T} icon={Eye} label="Read receipts" value={settings.readReceipts} onChange={(v) => set({ readReceipts: v })} />
              <ToggleRow T={T} icon={Clock} label="Last seen" value={settings.lastSeen} onChange={(v) => set({ lastSeen: v })} />
              <ToggleRow T={T} icon={Lock} label="Encrypt local boards" hint="PIN required to open WhatsPlan" value={settings.encryptLocal} onChange={(v) => set({ encryptLocal: v })} />
              <ToggleRow T={T} icon={ShieldCheck} label="Disappearing messages" value={settings.disappearing} onChange={(v) => set({ disappearing: v })} />
            </div>
          )}

          {section === "chats" && (
            <div className={`${T.panel} p-5 space-y-2`}>
              <div className="flex items-center gap-2 mb-2"><MessageSquare className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Chats</div></div>
              <div className={`${T.panelSoft} p-3`}>
                <div className={`text-sm font-medium ${T.text} mb-2 flex items-center gap-2`}><Wallpaper className="w-4 h-4" /> Chat wallpaper</div>
                <div className="grid grid-cols-6 gap-2">
                  {["#efeae2", "#d9fdd3", "#0b141a", "#fffdf5", "#e6f4ec", "#050a08"].map((c) => (
                    <button key={c} onClick={() => set({ wallpaper: c })}
                      className={`h-10 rounded-lg border-2 ${settings.wallpaper === c ? "border-[#25d366]" : "border-transparent"}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className={`${T.panelSoft} p-3`}>
                <div className={`text-sm font-medium ${T.text} mb-1 flex items-center gap-2`}><Globe className="w-4 h-4" /> Language</div>
                <select value={settings.language} onChange={(e) => set({ language: e.target.value })}
                  className={`${T.input} w-full rounded-lg px-2 py-1.5 text-sm`}>
                  {["English", "Hindi", "Spanish", "Arabic", "Portuguese", "French"].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <ToggleRow T={T} icon={Sparkles} label="WhatsPlan agent" hint="Auto-surface important conversations into boards" value={settings.agent} onChange={(v) => set({ agent: v })} />
              <ToggleRow T={T} icon={Download} label="Auto-download media" value={settings.autoDownload} onChange={(v) => set({ autoDownload: v })} />
            </div>
          )}

          {section === "storage" && (
            <div className={`${T.panel} p-5 space-y-3`}>
              <div className="flex items-center gap-2"><Database className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Storage & data</div></div>
              <div className={`${T.panelSoft} p-3`}>
                <div className={`text-sm ${T.text} flex justify-between`}><span>Local app data</span><span className="font-semibold">~ {((JSON.stringify(localStorage).length / 1024) | 0)} KB</span></div>
                <div className="h-2 rounded-full bg-black/10 mt-2 overflow-hidden">
                  <div className="h-full bg-[#25d366]" style={{ width: "18%" }} />
                </div>
              </div>
              <button onClick={() => { if (confirm("Clear local boards, badges and settings?")) { localStorage.clear(); location.reload(); } }}
                className="text-red-500 text-sm hover:underline">Clear all local data</button>
            </div>
          )}

          {section === "shortcuts" && (
            <div className={`${T.panel} p-5`}>
              <div className="flex items-center gap-2 mb-3"><Keyboard className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Keyboard shortcuts</div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {[
                  ["New board", "N"], ["Search", "/"], ["Open boards", "G then B"],
                  ["Open chats", "G then C"], ["Settings", ","], ["Toggle theme", "T"],
                ].map(([k, v]) => (
                  <div key={k} className={`${T.panelSoft} p-2 flex justify-between items-center`}>
                    <span className={T.text}>{k}</span>
                    <kbd className={`${T.badge} px-2 py-0.5 rounded text-xs font-mono`}>{v}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "pet" && (
            <div className={`${T.panel} p-5 space-y-3`}>
              <div className="flex items-center gap-2 mb-1"><Sparkles className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>🦊 Fox companion</div></div>
              <ToggleRow T={T} label="Enable pet companion" hint="A floating fox that cheers you on." value={settings.petEnabled} onChange={(v)=>set({ petEnabled: v })} />
              {settings.petEnabled && (
                <>
                  <div className={`${T.panelSoft} p-3 text-xs ${T.muted} flex items-center gap-2`}>
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Showing a drawn fox. Save your exact fox image as <code>public/pets/fox.png</code> to use it pixel-perfect.</span>
                  </div>
                  <div className={`text-xs ${T.muted} mt-2`}>Aura color</div>
                  <div className="flex gap-2 flex-wrap">
                    {AURA_COLORS.map((c) => (
                      <button key={c} onClick={() => set({ petAura: c })}
                        className={`w-7 h-7 rounded-full border ${settings.petAura === c ? "ring-2 ring-[#25d366] ring-offset-2" : "border-black/10"}`}
                        style={{ background: c }} aria-label={`aura ${c}`} />
                    ))}
                  </div>
                  <div className={`text-xs ${T.muted} mt-2`}>Position</div>
                  <div className="flex gap-2">
                    {["left","right"].map((s) => (
                      <button key={s} onClick={() => set({ petSide: s })}
                        className={`${settings.petSide === s ? T.chipActive : T.chipIdle} px-3 py-1.5 rounded-full text-xs font-medium capitalize`}>
                        Bottom {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {section === "density" && (
            <div className={`${T.panel} p-5 space-y-3`}>
              <div className="flex items-center gap-2 mb-1"><Zap className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>⚡ Board density</div></div>
              <ToggleRow T={T} label="Compact mode" hint="Tighter card padding and smaller text on boards." value={settings.compact} onChange={(v)=>set({ compact: v })} />
            </div>
          )}

          {section === "help" && (
            <div className={`${T.panel} p-5 space-y-2`}>
              <div className="flex items-center gap-2 mb-2"><HelpCircle className={`w-4 h-4 ${T.text}`} /><div className={`font-semibold ${T.text}`}>Help & About</div></div>
              <div className={`${T.panelSoft} p-3 text-sm ${T.text}`}>WhatsPlan v1.0 — Frontend preview. Backend coming soon.</div>
              <div className={`${T.panelSoft} p-3 text-sm ${T.text} flex items-center gap-2`}><Info className="w-4 h-4" /> Tip: double-click a card on Kanban boards to edit it.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Main app shell                                                           */
/* ====================================================================== */
const TABS = [
  { id: "chats",   label: "Chats",    icon: MessageSquare },
  { id: "calls",   label: "Calls",    icon: Phone },
  { id: "planner", label: "Planner",  icon: ListChecks },
  { id: "boards",  label: "Boards",   icon: Kanban },
  { id: "badges",  label: "Badges",   icon: Award },
  { id: "settings",label: "Settings", icon: SettingsIcon },
];

const DEFAULT_SETTINGS = {
  fontSize: 14, reduceMotion: false, showStreak: true,
  notifMessages: true, notifBoards: true, notifSounds: true, notifPreviews: true,
  readReceipts: true, lastSeen: true, encryptLocal: false, disappearing: false,
  wallpaper: "#efeae2", language: "English", agent: true, autoDownload: false,
  petEnabled: true, petAura: "#25d366", petSide: "right",
  compact: false,
};

const PET_PRESETS = {
  cat:   { name: "Mochi",  emoji: "🐱", blurb: "Calm and curious." },
  bear:  { name: "Coco",   emoji: "🐻", blurb: "Cuddly companion." },
  ghost: { name: "Casper", emoji: "👻", blurb: "Quietly cheerful." },
};
const AURA_COLORS = ["#25d366", "#00bcd4", "#a855f7", "#ec4899", "#f97316", "#ffffff"];

/* ====================================================================== */
/* Hatchling sprite pet — atlas-driven, with a drawn placeholder fallback   */
/* ====================================================================== */
/* Layout matches /hatch-pet/scripts: 1536×1872 atlas, 192×208 frames,      */
/* 8 cols × 9 rows, one animation state per row, ~10fps.                    */
const HATCH_MANIFEST = {
  src: "/pets/hatchling/atlas.webp",
  frameW: 192, frameH: 208, cols: 8, rows: 9, fps: 10,
  states: {
    idle:            { row: 0, frames: 8 },
    "running-right": { row: 1, frames: 8 },
    "running-left":  { row: 2, frames: 8 },
    waving:          { row: 3, frames: 8 },
    jumping:         { row: 4, frames: 8 },
    failed:          { row: 5, frames: 8 },
    waiting:         { row: 6, frames: 8 },
    running:         { row: 7, frames: 8 },
    review:          { row: 8, frames: 8 },
  },
};

/* Drop your exact fox image here for a pixel-perfect pet; until then the drawn
   fox below is shown. */
const FOX_IMG = "/pets/fox.png";

function petMotion(anim) {
  if (anim === "jumping") return { animate: { y: [0, -16, 0] }, transition: { duration: 0.5, repeat: 2, ease: "easeOut" } };
  if (anim === "waving") return { animate: { rotate: [0, -7, 7, -7, 0] }, transition: { duration: 0.9 } };
  return { animate: { y: [0, -3, 0] }, transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } };
}

/* Drawn chibi fox fallback (resembles the reference; for the exact art drop
   public/pets/fox.png). */
function FoxPlaceholder({ anim, w, h, aura }) {
  const m = petMotion(anim);
  return (
    <motion.div animate={m.animate} transition={m.transition} style={{ width: w, height: h, filter: `drop-shadow(0 0 10px ${aura})` }}>
      <svg viewBox="0 0 120 120" width={w} height={h} aria-hidden="true">
        {/* tail */}
        <path d="M84 64 C112 60 116 92 102 106 C92 116 78 110 80 98 C90 96 96 84 88 76 C84 72 82 68 84 64 Z" fill="#ef6d2e" stroke="#4a3526" strokeWidth="3" strokeLinejoin="round" />
        <path d="M92 98 C100 100 100 110 90 112 C86 106 87 101 92 98 Z" fill="#fff1dd" stroke="#4a3526" strokeWidth="2.5" strokeLinejoin="round" />
        {/* body */}
        <ellipse cx="54" cy="92" rx="32" ry="24" fill="#f6863b" stroke="#4a3526" strokeWidth="3" />
        <ellipse cx="54" cy="92" rx="16" ry="18" fill="#fff1dd" />
        {/* paws */}
        <ellipse cx="40" cy="110" rx="8" ry="6" fill="#f6863b" stroke="#4a3526" strokeWidth="2.5" />
        <ellipse cx="68" cy="110" rx="8" ry="6" fill="#f6863b" stroke="#4a3526" strokeWidth="2.5" />
        {/* head */}
        <path d="M20 50 C20 28 40 20 56 20 C72 20 92 28 92 50 C92 72 76 82 56 82 C36 82 20 72 20 50 Z" fill="#f6863b" stroke="#4a3526" strokeWidth="3" />
        {/* ears */}
        <path d="M22 44 L14 12 L42 32 Z" fill="#f6863b" stroke="#4a3526" strokeWidth="3" strokeLinejoin="round" />
        <path d="M90 44 L98 12 L70 32 Z" fill="#f6863b" stroke="#4a3526" strokeWidth="3" strokeLinejoin="round" />
        <path d="M24 38 L19 20 L34 31 Z" fill="#fff1dd" />
        <path d="M88 38 L93 20 L78 31 Z" fill="#fff1dd" />
        {/* white muzzle */}
        <ellipse cx="56" cy="66" rx="23" ry="14" fill="#fff1dd" />
        {/* blush */}
        <ellipse cx="33" cy="62" rx="6" ry="4" fill="#ff9bb0" opacity="0.85" />
        <ellipse cx="79" cy="62" rx="6" ry="4" fill="#ff9bb0" opacity="0.85" />
        {/* eyes */}
        <ellipse cx="42" cy="54" rx="7.5" ry="9" fill="#3b2417" />
        <ellipse cx="70" cy="54" rx="7.5" ry="9" fill="#3b2417" />
        <circle cx="44" cy="51" r="2.2" fill="#fff" />
        <circle cx="72" cy="51" r="2.2" fill="#fff" />
        <circle cx="40" cy="57" r="1.3" fill="#fff" />
        <circle cx="68" cy="57" r="1.3" fill="#fff" />
        {/* nose + smile */}
        <path d="M53 64 L59 64 L56 68 Z" fill="#4a3526" />
        <path d="M56 68 q-5 6 -10 3 M56 68 q5 6 10 3" fill="none" stroke="#4a3526" strokeWidth="2" strokeLinecap="round" />
        {/* forehead marks */}
        <path d="M40 36 l3 6 M72 36 l-3 6" stroke="#ef6d2e" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

function SpritePet({ aura, side: initialSide }) {
  const [pos, setPos] = useState(() => {
    try { const v = JSON.parse(localStorage.getItem("wp_pet_pos") || "null"); if (v) return v; } catch {}
    return { side: initialSide || "right", y: typeof window !== "undefined" ? window.innerHeight - 170 : 400 };
  });
  const [bubble, setBubble] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [manifest, setManifest] = useState(HATCH_MANIFEST);
  const [atlasReady, setAtlasReady] = useState(false);
  const [foxReady, setFoxReady] = useState(false);
  const [anim, setAnim] = useState("idle");
  const [frame, setFrame] = useState(0);
  const dragRef = useRef({ active: false, dy: 0 });

  // optional manifest override (frame counts / fps) shipped next to the atlas
  useEffect(() => {
    let alive = true;
    fetch(HATCH_MANIFEST.src.replace(/atlas\.webp$/, "atlas.json"))
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => { if (alive && m) setManifest((cur) => ({ ...cur, ...m, states: { ...cur.states, ...(m.states || {}) } })); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // detect the real atlas; fall back to the drawn placeholder if absent
  useEffect(() => {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.onload = () => setAtlasReady(true);
    img.onerror = () => setAtlasReady(false);
    img.src = manifest.src;
  }, [manifest.src]);

  // your exact fox image (public/pets/fox.png) takes priority if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.onload = () => setFoxReady(true);
    img.onerror = () => setFoxReady(false);
    img.src = FOX_IMG;
  }, []);

  // celebrate hook (dispatch `webpet:celebrate` anywhere to trigger)
  useEffect(() => {
    const onCelebrate = (e) => {
      const msg = e?.detail?.message
        || (e?.detail?.type === "first_visit" ? "Hi! I'm your fox. I'll keep you company! 🦊"
          : e?.detail?.type === "streak_milestone" ? "Days in a row — you're unstoppable! 🔥"
          : "Yes!! You did that!! 🎉");
      setBubble(msg);
      setAnim("jumping");
      setTimeout(() => setBubble(null), 4000);
    };
    window.addEventListener("webpet:celebrate", onCelebrate);
    const onKey = (e) => { if (e.key === "Escape") setBubble(null); };
    window.addEventListener("keydown", onKey);
    // gentle first greeting
    const greet = setTimeout(() => { setBubble("Hi! I'm your fox 🦊"); setAnim("waving"); setTimeout(() => setBubble(null), 3500); }, 1200);
    return () => { window.removeEventListener("webpet:celebrate", onCelebrate); window.removeEventListener("keydown", onKey); clearTimeout(greet); };
  }, []);

  // frame ticker
  useEffect(() => {
    const st = manifest.states[anim] || manifest.states.idle;
    const fc = Math.max(1, st.frames || 1);
    setFrame(0);
    const id = setInterval(() => setFrame((f) => (f + 1) % fc), 1000 / (manifest.fps || 10));
    return () => clearInterval(id);
  }, [anim, manifest]);

  // transient states return to idle; idle occasionally waves for liveliness
  useEffect(() => {
    if (anim === "jumping" || anim === "waving") {
      const t = setTimeout(() => setAnim("idle"), 1500);
      return () => clearTimeout(t);
    }
  }, [anim]);
  useEffect(() => {
    const id = setInterval(() => setAnim((cur) => (cur === "idle" && Math.random() < 0.4 ? "waving" : cur)), 9000);
    return () => clearInterval(id);
  }, []);

  // drag to reposition (snaps to nearest side, persists)
  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current.active) return;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      setPos((p) => ({ ...p, y: Math.max(20, Math.min(window.innerHeight - 130, cy - dragRef.current.dy)), _x: cx }));
    }
    function onUp() {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setPos((p) => {
        const side = (p._x ?? 0) < window.innerWidth / 2 ? "left" : "right";
        const next = { side, y: p.y };
        try { localStorage.setItem("wp_pet_pos", JSON.stringify(next)); } catch {}
        return next;
      });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const snoozeUntil = (() => { try { return Number(localStorage.getItem("wp_snooze_until") || 0); } catch { return 0; } })();

  // display geometry
  const displayH = 116;
  const scale = displayH / manifest.frameH;
  const fw = Math.round(manifest.frameW * scale);
  const fh = Math.round(manifest.frameH * scale);
  const st = manifest.states[anim] || manifest.states.idle;
  const spriteStyle = {
    width: fw,
    height: fh,
    backgroundImage: `url(${manifest.src})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${manifest.cols * fw}px ${manifest.rows * fh}px`,
    backgroundPosition: `${-frame * fw}px ${-st.row * fh}px`,
    filter: `drop-shadow(0 0 10px ${aura})`,
  };

  function startDrag(e) {
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { active: true, dy: cy - pos.y };
  }

  if (snoozeUntil > Date.now()) return null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{ [pos.side]: 20, top: pos.y, position: "fixed", zIndex: 9999 }}
        className="w-9 h-9 rounded-full bg-white shadow-lg border border-black/10 grid place-items-center text-base">
        🦊
      </button>
    );
  }

  return (
    <div style={{ [pos.side]: 20, top: pos.y, position: "fixed", zIndex: 9999 }} className="select-none">
      {bubble && (
        <div className="mb-2 max-w-[220px] rounded-xl bg-white text-[#1E293B] text-xs px-3 py-2 shadow-lg border border-black/10 cursor-pointer"
          onClick={() => setBubble(null)}>{bubble}</div>
      )}
      <motion.div
        role="img"
        aria-label="Hatchling, your companion"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onClick={() => { setWiggle(true); setAnim("jumping"); setTimeout(() => setWiggle(false), 320); }}
        onDoubleClick={() => setCollapsed(true)}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen((o) => !o); }}
        animate={{ scale: wiggle ? 1.12 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14 }}
        className="cursor-grab active:cursor-grabbing"
      >
        {foxReady ? (
          (() => { const m = petMotion(anim); return (
            <motion.img src={FOX_IMG} width={fh} height={fh} draggable={false} alt="pet"
              animate={m.animate} transition={m.transition}
              style={{ width: fh, height: fh, objectFit: "contain", filter: `drop-shadow(0 0 8px ${aura})` }} />
          ); })()
        ) : atlasReady ? (
          <div style={spriteStyle} />
        ) : (
          <FoxPlaceholder anim={anim} w={fw} h={fh} aura={aura} />
        )}
      </motion.div>
      {menuOpen && (
        <div className={`absolute ${pos.side === "right" ? "right-0" : "left-0"} mt-2 w-44 rounded-lg bg-white border border-black/10 shadow-xl text-sm overflow-hidden`}>
          <button onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("webpet:open-settings")); }}
            className="w-full text-left px-3 py-2 hover:bg-black/5">Settings</button>
          <button onClick={() => { try { localStorage.setItem("wp_snooze_until", String(Date.now() + 30 * 60 * 1000)); } catch {} window.location.reload(); }}
            className="w-full text-left px-3 py-2 hover:bg-black/5">Snooze 30 min</button>
          <button onClick={() => { setMenuOpen(false); setCollapsed(true); }}
            className="w-full text-left px-3 py-2 hover:bg-black/5">Hide</button>
        </div>
      )}
    </div>
  );
}

function AppShell({ user, themeKey, setTheme, onLogout, gam }) {
  const T = THEMES[themeKey] || THEMES.default;
  const [tab, setTab] = useState("boards");
  const [boards, setBoards] = useBoards();
  const [settings, setSettings] = useLocal("wp_settings", DEFAULT_SETTINGS);
  const [glowColor, setGlowColor] = useLocal("wp_glow", "#25d366");

  // apply neon glow custom color via CSS vars
  const styleVars = themeKey === "neon"
    ? { ["--wa-glow"]: glowColor, fontSize: settings.fontSize }
    : { fontSize: settings.fontSize };

  // Bottom nav set (mobile) — merge calls into chats per spec
  const BOTTOM_TABS = TABS.filter((t) => t.id !== "calls");

  return (
    <div className={`min-h-screen w-full ${T.bg} flex`} style={styleVars}>
      {/* Left rail (md+) */}
      <aside className={`${T.sidebar} hidden md:flex w-20 lg:w-64 shrink-0 flex-col`}>
        <div className="p-3 md:p-4 flex items-center gap-2 justify-center lg:justify-start">
          <WPLogo size={32} />
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
                title={t.label}
                className={`${active ? T.chipActive : T.chipIdle} w-full rounded-lg flex items-center gap-3 px-2 lg:px-3 py-2.5 text-sm font-medium justify-center lg:justify-start`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline">{t.label}</span>
              </button>
            );
          })}
        </nav>
        {settings.showStreak && (
          <div className="p-2 lg:p-3">
            <div className={`${T.panelSoft} p-2 lg:p-3 flex lg:block items-center justify-center gap-2`}>
              <Flame className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="hidden lg:block">
                <div className={`text-xs ${T.muted}`}>Streak</div>
                <div className={`mt-1 text-xl font-bold ${T.text}`}>{gam.streak?.count || 0} <span className={`text-xs font-normal ${T.muted}`}>days</span></div>
              </div>
              <div className={`lg:hidden text-sm font-bold ${T.text}`}>{gam.streak?.count || 0}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col" style={{ minHeight: "100vh" }}>
        <header className={`${T.topbar} h-14 flex items-center px-4 gap-3`}>
          <div className="md:hidden"><WPLogo size={28} /></div>
          <div className={`font-[var(--font-display)] font-semibold ${T.text} capitalize truncate`}>{tab}</div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`${T.badge} px-2.5 py-1 rounded-full text-xs flex items-center gap-1`}>
              <Flame className="w-3.5 h-3.5 text-orange-500" /> <span className={T.text}>{gam.streak?.count || 0}</span>
            </div>
            <div className={`${T.badge} px-2.5 py-1 rounded-full text-xs flex items-center gap-1`}>
              <Trophy className="w-3.5 h-3.5 text-yellow-500" /> <span className={T.text}>{gam.earned.length}</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto thin-scroll pb-16 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: settings.reduceMotion ? 0 : 0.2 }}
              className="h-full"
            >
              {tab === "chats"    && <ChatsView   T={T} wallpaper={settings.wallpaper} />}
              {tab === "calls"    && <CallsView   T={T} />}
              {tab === "planner"  && <PlannerView T={T} />}
              {tab === "boards"   && <BoardsView  T={T} boards={boards} setBoards={setBoards} gam={gam} />}
              {tab === "badges"   && <BadgesView  T={T} gam={gam} />}
              {tab === "settings" && <SettingsView T={T} user={user} themeKey={themeKey} setTheme={setTheme} onLogout={onLogout} gam={gam}
                                       settings={settings} setSettings={setSettings} glowColor={glowColor} setGlowColor={setGlowColor} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile bottom nav (≤768px) */}
      <nav className={`${T.sidebar} md:hidden fixed bottom-0 left-0 right-0 h-14 grid z-30 border-t`} style={{ gridTemplateColumns: `repeat(${BOTTOM_TABS.length}, minmax(0,1fr))` }}>
        {BOTTOM_TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${active ? T.text : T.muted}`}>
              <Icon className={`w-5 h-5 ${active ? "text-[#25d366]" : ""}`} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Hatchling sprite pet floats over everything */}
      {settings.petEnabled && <SpritePet aura={settings.petAura} side={settings.petSide} />}
    </div>
  );
}


/* ====================================================================== */
/* Root                                                                     */
/* ====================================================================== */
export default function WhatsPlanApp() {
  const [splashDone, setSplashDone] = useState(false);
  const [themeKey, setThemeKey] = useLocal("wp_theme", null); // null = not yet picked
  const gam = useGamification();
  const wa = useSession();

  // Your WhatsApp link IS your login. Identity = your WhatsApp account.
  const linked = wa.status === "ready";
  const user = linked ? { id: wa.me, wid: wa.me, name: wa.meName || (wa.me ? wa.me.split("@")[0] : "You") } : null;

  useEffect(() => { document.title = "WhatsPlan"; }, []);

  return (
    <AnimatePresence mode="wait">
      {!splashDone && <Splash key="splash" onDone={() => setSplashDone(true)} />}
      {splashDone && !linked && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Login />
        </motion.div>
      )}
      {splashDone && linked && !themeKey && (
        <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ThemePicker
            current={themeKey}
            onPick={(k) => { setThemeKey(k); gam.tryTheme(k); }}
          />
        </motion.div>
      )}
      {splashDone && linked && themeKey && (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AppShell
            user={user} themeKey={themeKey} setTheme={setThemeKey} gam={gam}
            onLogout={() => { api.logout(); }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
