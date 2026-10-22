import { isValidGameState } from "../../../../components/SSA/gameState";
import { databaseFailure, getSupabase } from "../../../lib/ssa/server";
import { gameResponse } from "../../../lib/ssa/history";

// Relay Supabase Realtime over SSE. Browsers need no database credential and
// cannot publish events; the database is the only source of truth.
export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }
  let supabase;
  try { supabase = getSupabase(); } catch { return databaseFailure(res); }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  let closed = false;
  let channel;
  const send = (event, data) => {
    if (!closed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    if (channel) void supabase.removeChannel(channel);
  };
  const heartbeat = setInterval(() => { if (!closed) res.write(": heartbeat\n\n"); }, 15_000);
  res.on("close", cleanup);
  channel = supabase.channel(`ssa-viewer-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "ssa_game_state", filter: "id=eq.1" }, ({ new: row }) => {
      if (isValidGameState(row?.state)) send("state", gameResponse(row));
      else send("refresh", {});
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") send("ready", {});
      if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status) && !closed) {
        send("unavailable", {});
        cleanup();
        res.end();
      }
    });
}

export const config = { api: { responseLimit: false } };
