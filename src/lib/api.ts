/* ======================================================================
 * WhatsPlan backend client — REST + Socket.IO + React hooks.
 * The backend lives in /server (see server/README.md). Set VITE_API_URL to
 * override the default. Everything degrades gracefully when the server is
 * offline: hooks just stay empty and `online` reports false.
 * ==================================================================== */
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export const API_URL =
  ((import.meta as any)?.env?.VITE_API_URL as string | undefined) ||
  "http://localhost:4000";

/* ---- Types (loose, mirror the server data shapes) ---- */
export type SessionState = {
  status: "disconnected" | "initializing" | "qr" | "authenticated" | "ready";
  qr: string | null;
  me: string | null;
  meName?: string | null;
  readOnly?: boolean;
};
export type Group = { id: string; name: string; participants: number; watched: boolean };
export type Chat = { id: string; name: string; isGroup: boolean; lastMessage: string; timestamp: number; unread?: number; aiEnabled?: boolean };
export type Verification = { verified: boolean; email: string | null; verifiedAt?: number | null; windowMs?: number };
export type User = { id: string; wid: string | null; name: string | null; email: string | null; verified: boolean; verifiedAt?: number | null };
export type Message = { id: string; chatId: string; chatName: string; isGroup: boolean; from: string; fromName: string; body: string; timestamp: number; fromMe: boolean };
export type Meeting = { id: string; chatId: string; chatName: string; author: string; title: string; datetime: string; link: string; location: string; incomplete: boolean; sourceText: string; confidence: number; createdAt: number };
export type Task = { id: string; chatId: string; chatName: string; author: string; description: string; assignee: string; due: string; priority: "low" | "medium" | "high"; done: boolean; incomplete: boolean; sourceText: string; confidence: number; createdAt: number };
export type Announcement = { id: string; chatId: string; chatName: string; author: string; text: string; pinned: boolean; sourceText: string; confidence: number; createdAt: number };

/* ---- Singleton socket (browser only) ---- */
let socket: Socket | null = null;
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) socket = io(API_URL, { transports: ["websocket", "polling"] });
  return socket;
}

/* ---- REST helper ---- */
async function http(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    // Surface the server's JSON `{ error, code }` so callers can show a real
    // message and branch on codes like VERIFY_REQUIRED.
    let message = `${res.status} ${res.statusText}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      if (body?.code) code = body.code;
    } catch { /* non-JSON error body */ }
    const err = new Error(message) as Error & { status?: number; code?: string };
    err.status = res.status;
    err.code = code;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  getSession: (): Promise<SessionState> => http("/session"),
  startSession: (): Promise<SessionState> => http("/session/start", { method: "POST" }),
  logout: (): Promise<SessionState> => http("/session/logout", { method: "POST" }),

  getGroups: (): Promise<Group[]> => http("/groups"),
  getChats: (): Promise<Chat[]> => http("/chats"),
  getMessages: (chatId: string): Promise<Message[]> => http(`/chats/${encodeURIComponent(chatId)}/messages`),
  sendMessage: (chatId: string, text: string) =>
    http(`/chats/${encodeURIComponent(chatId)}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
  setChatAi: (chatId: string, aiEnabled: boolean): Promise<Chat> =>
    http(`/chats/${encodeURIComponent(chatId)}`, { method: "PATCH", body: JSON.stringify({ aiEnabled }) }),

  getUser: (): Promise<User> => http("/user"),
  putUser: (email: string): Promise<User> =>
    http("/user", { method: "PUT", body: JSON.stringify({ email }) }),

  getVerification: (): Promise<Verification> => http("/verify"),
  // email is optional — passing it sets/updates the stored email before sending.
  requestOtp: (email?: string): Promise<{ ok: boolean; sent: boolean; email: string | null; devCode?: string }> =>
    http("/verify/request", { method: "POST", body: JSON.stringify(email ? { email } : {}) }),
  confirmOtp: (code: string): Promise<Verification> =>
    http("/verify/confirm", { method: "POST", body: JSON.stringify({ code }) }),

  classifyText: (text: string): Promise<{ classification: any; stored: boolean }> =>
    http("/classify", { method: "POST", body: JSON.stringify({ text }) }),

  getMeetings: (): Promise<Meeting[]> => http("/meetings"),
  getTasks: (): Promise<Task[]> => http("/tasks"),
  getAnnouncements: (): Promise<Announcement[]> => http("/announcements"),
  update: (col: string, id: string, patch: Record<string, unknown>) =>
    http(`/${col}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (col: string, id: string) =>
    http(`/${col}/${encodeURIComponent(id)}`, { method: "DELETE" }),

  getBoards: (): Promise<any[]> => http("/boards"),
  putBoard: (id: string, board: any) =>
    http(`/boards/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(board) }),
  deleteBoard: (id: string) => http(`/boards/${encodeURIComponent(id)}`, { method: "DELETE" }),

  getKv: (key: string): Promise<any> => http(`/state/${encodeURIComponent(key)}`),
  putKv: (key: string, doc: any) =>
    http(`/state/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify(doc) }),
};

const BOARDS_LS_KEY = "wp_boards";
function readLocalBoards(): any[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(BOARDS_LS_KEY) || "[]"); } catch { return []; }
}

/* ---- helpers ---- */
function upsertById<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...arr];
  const copy = arr.slice();
  copy[i] = item;
  return copy;
}

/* ======================================================================
 * Hooks
 * ==================================================================== */

/** WhatsApp session state + live updates + connect/logout actions. */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "disconnected", qr: null, me: null });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getSession().then((s) => alive && s && setState(s)).catch(() => {});

    const s = getSocket();
    if (!s) return;
    const merge = (st: Partial<SessionState>) => setState((prev) => ({ ...prev, ...st }));
    const onQr = (qr: string) => setState((prev) => ({ ...prev, qr, status: "qr" }));
    const onConnect = () => { setOnline(true); api.getSession().then((x) => x && setState(x)).catch(() => {}); };
    const onDisconnect = () => setOnline(false);

    s.on("session", merge);
    s.on("status", merge);
    s.on("qr", onQr);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    setOnline(s.connected);

    return () => {
      alive = false;
      s.off("session", merge);
      s.off("status", merge);
      s.off("qr", onQr);
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  const start = useCallback(() => { api.startSession().catch(() => {}); }, []);
  const logout = useCallback(() => { api.logout().catch(() => {}); }, []);

  return { ...state, online, start, logout };
}

/** Watched chats, kept fresh as new messages arrive. */
export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => api.getChats().then((c) => alive && setChats(c || [])).catch(() => {});
    load();
    const s = getSocket();
    if (!s) return;
    const onMsg = () => load();
    const onStatus = (st: SessionState) => { if (st.status === "ready") load(); };
    s.on("message", onMsg);
    s.on("status", onStatus);
    s.on("connect", load);
    return () => { alive = false; s.off("message", onMsg); s.off("status", onStatus); s.off("connect", load); };
  }, []);
  return chats;
}

/** Messages for one chat, appending live ones. */
export function useMessages(chatId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    if (!chatId) { setMessages([]); return; }
    let alive = true;
    api.getMessages(chatId).then((m) => alive && setMessages(m || [])).catch(() => {});
    const s = getSocket();
    if (!s) return;
    const onMsg = (msg: Message) => {
      if (msg.chatId !== chatId) return;
      setMessages((prev) => (prev.some((p) => p.id === msg.id) ? prev : [...prev, msg]));
    };
    s.on("message", onMsg);
    return () => { alive = false; s.off("message", onMsg); };
  }, [chatId]);
  return messages;
}

/** Meetings / tasks / announcements with live inserts + optimistic mutations. */
export function usePlanner() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const reload = useCallback(() => {
    api.getMeetings().then((m) => setMeetings(m || [])).catch(() => {});
    api.getTasks().then((t) => setTasks(t || [])).catch(() => {});
    api.getAnnouncements().then((a) => setAnnouncements(a || [])).catch(() => {});
  }, []);

  useEffect(() => {
    reload();
    const s = getSocket();
    if (!s) return;
    const onItem = ({ type, item }: { type: string; item: any }) => {
      if (type === "meeting") setMeetings((p) => upsertById(p, item));
      else if (type === "task") setTasks((p) => upsertById(p, item));
      else if (type === "announcement") setAnnouncements((p) => upsertById(p, item));
    };
    s.on("item", onItem);
    s.on("connect", reload);
    return () => { s.off("item", onItem); s.off("connect", reload); };
  }, [reload]);

  const setterFor = (col: string) =>
    col === "meetings" ? setMeetings : col === "tasks" ? setTasks : setAnnouncements;

  const patchItem = useCallback(async (col: string, id: string, patch: Record<string, unknown>) => {
    const setter = setterFor(col) as any;
    setter((p: any[]) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try { await api.update(col, id, patch); } catch { reload(); }
  }, [reload]);

  const deleteItem = useCallback(async (col: string, id: string) => {
    const setter = setterFor(col) as any;
    setter((p: any[]) => p.filter((x) => x.id !== id));
    try { await api.remove(col, id); } catch { reload(); }
  }, [reload]);

  return { meetings, tasks, announcements, reload, patchItem, deleteItem };
}

/**
 * Drop-in replacement for the old useLocal("wp_boards", []). Keeps the same
 * [boards, setBoards] shape so callers don't change. Behaviour:
 *  - hydrates instantly from localStorage, then reconciles with the backend
 *  - backend is authoritative when it has data; if it's empty but localStorage
 *    isn't (first run after wiring), the local boards are seeded up to it
 *  - every change is written to localStorage immediately and synced to the
 *    backend debounced (board edits fire on each keystroke), so it keeps
 *    working fully offline and just catches up when the server is reachable
 */
export function useBoards(): [any[], (next: any[] | ((cur: any[]) => any[])) => void] {
  const [boards, setBoardsState] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const prevRef = useRef<any[]>([]);

  // Hydrate: localStorage first, then backend.
  useEffect(() => {
    let alive = true;
    const local = readLocalBoards();
    setBoardsState(local);
    prevRef.current = local;

    api.getBoards()
      .then((remote) => {
        if (!alive || !Array.isArray(remote)) return;
        if (remote.length === 0 && local.length > 0) {
          // First sync: push existing local boards up to the backend.
          local.forEach((b) => api.putBoard(b.id, b).catch(() => {}));
          prevRef.current = local;
        } else {
          setBoardsState(remote);
          prevRef.current = remote;
          try { localStorage.setItem(BOARDS_LS_KEY, JSON.stringify(remote)); } catch {}
        }
      })
      .catch(() => { /* offline — keep local copy */ })
      .finally(() => { if (alive) setLoaded(true); });

    return () => { alive = false; };
  }, []);

  // Persist on change: localStorage immediately, backend debounced.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(BOARDS_LS_KEY, JSON.stringify(boards)); } catch {}

    const handle = setTimeout(() => {
      const prev = prevRef.current;
      const nextIds = new Set(boards.map((b) => b.id));
      for (const b of boards) {
        const old = prev.find((x) => x.id === b.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(b)) api.putBoard(b.id, b).catch(() => {});
      }
      for (const b of prev) {
        if (!nextIds.has(b.id)) api.deleteBoard(b.id).catch(() => {});
      }
      prevRef.current = boards;
    }, 500);

    return () => clearTimeout(handle);
  }, [boards, loaded]);

  const setBoards = useCallback((next: any[] | ((cur: any[]) => any[])) => {
    setBoardsState((cur) => (typeof next === "function" ? (next as any)(cur) : next));
  }, []);

  return [boards, setBoards];
}

/**
 * Email-verification state. A successful verification is only valid for a short
 * window (`windowMs`, default 30s); after that AI reading must be re-verified.
 * `verified` flips itself back to false when the window elapses, so the UI
 * re-prompts for an OTP. `markVerified` lets the OTP dialog grant the window
 * locally the instant a code is confirmed (no refetch needed).
 */
const DEFAULT_VERIFY_WINDOW_MS = 30_000;
export function useVerification() {
  const [email, setEmail] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null);
  const [windowMs, setWindowMs] = useState<number>(DEFAULT_VERIFY_WINDOW_MS);
  const [verified, setVerified] = useState(false);

  const reload = useCallback(() => {
    api.getVerification()
      .then((v) => {
        if (!v) return;
        setEmail(v.email ?? null);
        setWindowMs(v.windowMs ?? DEFAULT_VERIFY_WINDOW_MS);
        setVerifiedAt(v.verifiedAt ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Derive `verified` from the window and auto-expire it when the window ends.
  useEffect(() => {
    if (!verifiedAt) { setVerified(false); return; }
    const remaining = verifiedAt + windowMs - Date.now();
    if (remaining <= 0) { setVerified(false); return; }
    setVerified(true);
    const t = setTimeout(() => setVerified(false), remaining);
    return () => clearTimeout(t);
  }, [verifiedAt, windowMs]);

  const markVerified = useCallback((em: string) => {
    setEmail(em);
    setVerifiedAt(Date.now());
  }, []);

  return { verified, email, verifiedAt, windowMs, reload, markVerified };
}

/**
 * Generic single-document synced state: instant localStorage + backend-backed,
 * debounced. Returns [doc, setDoc, loaded] where setDoc takes a value or an
 * updater fn (like useState's setter). Backend is authoritative when it has a
 * doc; otherwise local state is seeded up. Stored under /api/state/:key and
 * localStorage key "wp_<key>".
 */
export function useSyncedDoc<T extends object>(
  key: string,
  defaults: T,
): [T, (next: T | ((cur: T) => T)) => void, boolean] {
  const [doc, setDoc] = useState<T>(defaults);
  const [loaded, setLoaded] = useState(false);
  const prevRef = useRef<string>("");

  useEffect(() => {
    let alive = true;
    let local = defaults;
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(`wp_${key}`) : null;
      if (v) local = { ...defaults, ...JSON.parse(v) };
    } catch { /* ignore */ }
    setDoc(local);
    prevRef.current = JSON.stringify(local);

    api.getKv(key)
      .then((remote) => {
        if (!alive) return;
        if (remote && typeof remote === "object") {
          const { id: _id, ...rest } = remote as Record<string, unknown>;
          const merged = { ...defaults, ...rest } as T;
          setDoc(merged);
          prevRef.current = JSON.stringify(merged);
          try { localStorage.setItem(`wp_${key}`, JSON.stringify(merged)); } catch {}
        } else if (JSON.stringify(local) !== JSON.stringify(defaults)) {
          // Backend empty but we have local state — seed it up.
          api.putKv(key, local).catch(() => {});
        }
      })
      .catch(() => { /* offline — keep local */ })
      .finally(() => { if (alive) setLoaded(true); });

    return () => { alive = false; };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(`wp_${key}`, JSON.stringify(doc)); } catch {}
    const handle = setTimeout(() => {
      const serial = JSON.stringify(doc);
      if (serial !== prevRef.current) {
        api.putKv(key, doc).catch(() => {});
        prevRef.current = serial;
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [doc, loaded, key]);

  return [doc, setDoc, loaded];
}
