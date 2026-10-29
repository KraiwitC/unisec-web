import { useCallback, useEffect, useRef, useState } from "react";
import { isValidGameState } from "./gameState";

const LIVE_REFRESH_MS = 15_000;
const BACKUP_REFRESH_MS = 2_000;
const STREAM_TIMEOUT_MS = 35_000;
const REQUEST_TIMEOUT_MS = 8_000;

export default function useSharedGame(showControls) {
  const [snapshot, setSnapshot] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connection, setConnection] = useState("Connecting");
  const [error, setError] = useState("");
  const latest = useRef(null);
  const busy = useRef(false);
  const active = useRef(true);
  const pendingRefresh = useRef(null);
  const refreshController = useRef(null);

  const accept = useCallback((next) => {
    if (!active.current || !(next.state === null || isValidGameState(next.state))) return;
    // Database timestamps can contain microseconds: retain the full timestamp for CAS.
    if (latest.current?.updated_at && next.updated_at &&
      Date.parse(next.updated_at) < Date.parse(latest.current.updated_at)) return;
    if (latest.current && latest.current.updated_at === next.updated_at) return;
    latest.current = next;
    setSnapshot(next);
    setLoaded(true);
  }, []);

  const refresh = useCallback(() => {
    // Reconnect, focus and polling can happen together; share one bounded request.
    if (pendingRefresh.current) return pendingRefresh.current;
    const controller = new AbortController();
    refreshController.current = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const request = (async () => {
      try {
        const response = await fetch("/api/ssa/state", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        accept(data);
        if (active.current) setError("");
        return true;
      } catch (err) {
        if (active.current && refreshController.current === controller) setError(controller.signal.aborted
          ? "Shared game request timed out. Retrying…" : err.message || "Could not load shared game");
        return false;
      } finally {
        clearTimeout(timeout);
        if (refreshController.current === controller) {
          refreshController.current = null;
          pendingRefresh.current = null;
        }
      }
    })();
    pendingRefresh.current = request;
    return request;
  }, [accept]);

  useEffect(() => {
    active.current = true;
    let disposed = false;
    let live = false;
    let events;
    let pollTimer;
    let streamTimer;
    let lastActivity = Date.now();
    const schedulePoll = (delay) => {
      clearTimeout(pollTimer);
      pollTimer = setTimeout(async () => {
        await refresh();
        if (!disposed) schedulePoll(live ? LIVE_REFRESH_MS : BACKUP_REFRESH_MS);
      }, delay);
    };
    const reconnect = () => {
      if (disposed) return;
      const wasLive = live;
      live = false;
      setConnection("Reconnecting · backup sync active");
      if (wasLive) {
        void refresh();
        schedulePoll(BACKUP_REFRESH_MS);
      }
    };
    const connect = () => {
      events?.close();
      const stream = new EventSource("/api/ssa/events");
      events = stream;
      const touch = () => {
        lastActivity = Date.now();
        clearTimeout(streamTimer);
        // A half-open stream may never emit an error. Heartbeats detect that case.
        streamTimer = setTimeout(() => {
          reconnect();
          connect();
        }, STREAM_TIMEOUT_MS);
      };
      const on = (name, callback) => stream.addEventListener(name, (event) => {
        if (!disposed && events === stream) callback(event);
      });
      touch();
      on("ready", () => {
        touch();
        live = true;
        setConnection("Live");
        void refresh();
        schedulePoll(LIVE_REFRESH_MS);
      });
      on("heartbeat", touch);
      on("state", (event) => {
        touch();
        try { accept(JSON.parse(event.data)); setError(""); } catch { void refresh(); }
      });
      on("refresh", () => { touch(); void refresh(); });
      on("unavailable", reconnect);
      on("error", reconnect);
    };
    void refresh();
    connect();
    schedulePoll(BACKUP_REFRESH_MS);
    const resume = () => {
      void refresh();
      if (!live || Date.now() - lastActivity >= STREAM_TIMEOUT_MS) {
        reconnect();
        connect();
      }
    };
    window.addEventListener("online", resume);
    window.addEventListener("focus", resume);
    const onVisible = () => { if (document.visibilityState === "visible") resume(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      active.current = false;
      events.close();
      clearTimeout(pollTimer);
      clearTimeout(streamTimer);
      refreshController.current?.abort();
      refreshController.current = null;
      pendingRefresh.current = null;
      window.removeEventListener("online", resume);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [accept, refresh]);

  useEffect(() => {
    if (!showControls) return;
    let cancelled = false;
    fetch("/api/ssa/session", { cache: "no-store" }).then((r) => r.json())
      .then((data) => { if (!cancelled) setAuthenticated(data.authenticated === true); })
      .catch(() => { if (!cancelled) setError("Could not check Admin session"); });
    return () => { cancelled = true; };
  }, [showControls]);

  const login = async (password) => {
    const response = await fetch("/api/ssa/session", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setAuthenticated(true);
    setError("");
    await refresh();
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/ssa/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Sign-out failed");
      setAuthenticated(false);
    } catch { setError("Could not sign out. Try again."); }
  };

  const mutate = async (payload) => {
    if (!showControls || !authenticated || busy.current || !loaded) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/ssa/state", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        // Use the version from the same render as the state being edited. A newer
        // Realtime event must not accidentally authorize saving an older snapshot.
        body: JSON.stringify({ ...payload, expectedUpdatedAt: snapshot?.updated_at ?? null }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) setAuthenticated(false);
        if (response.status === 409) await refresh();
        throw new Error(data.error || "Could not save game");
      }
      accept(data);
      return true;
    } catch (err) { setError(err.message || "Could not save game"); return false; }
    finally { busy.current = false; setSaving(false); }
  };

  const commit = (state) => mutate({ state });
  const undo = () => mutate({ action: "undo" });
  return { state: snapshot?.state, updatedAt: snapshot?.updated_at, canUndo: snapshot?.canUndo === true,
    loaded, authenticated, saving, connection, error, login, logout, commit, undo };
}
