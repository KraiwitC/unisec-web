import { useCallback, useEffect, useRef, useState } from "react";
import { isValidGameState } from "./gameState";

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

  const accept = useCallback((next) => {
    if (!active.current || !(next.state === null || isValidGameState(next.state))) return;
    // Database timestamps can contain microseconds: retain the full timestamp for CAS.
    if (latest.current?.updated_at && next.updated_at &&
      Date.parse(next.updated_at) < Date.parse(latest.current.updated_at)) return;
    latest.current = next;
    setSnapshot(next);
    setLoaded(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/ssa/state", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      accept(data);
      if (active.current) setError("");
      return true;
    } catch (err) {
      if (active.current) setError(err.message || "Could not load shared game");
      return false;
    }
  }, [accept]);

  useEffect(() => {
    active.current = true;
    void refresh();
    const events = new EventSource("/api/ssa/events");
    const reconnect = () => { setConnection("Reconnecting · backup sync active"); };
    events.addEventListener("ready", () => { setConnection("Live"); void refresh(); });
    events.addEventListener("state", (event) => {
      try { accept(JSON.parse(event.data)); setError(""); } catch { void refresh(); }
    });
    events.addEventListener("refresh", () => { void refresh(); });
    events.addEventListener("unavailable", reconnect);
    events.onerror = reconnect;
    // Repair missed events after device sleep, network loss, or hosted stream expiry.
    const timer = setInterval(refresh, 15_000);
    window.addEventListener("online", refresh);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active.current = false;
      events.close();
      clearInterval(timer);
      window.removeEventListener("online", refresh);
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
