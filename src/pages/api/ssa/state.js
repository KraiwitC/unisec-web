import { isValidGameState } from "../../../../components/SSA/gameState";
import { databaseFailure, getSupabase, isAdmin, sameOrigin } from "../../../lib/ssa/server";
import { gameResponse, saveWithHistory, undoWithHistory } from "../../../lib/ssa/history";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "PUT"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.method === "PUT") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin sign-in required" });
    if (!sameOrigin(req)) return res.status(403).json({ error: "Invalid request origin" });
    if (![undefined, "undo"].includes(req.body?.action) ||
      (req.body?.action !== "undo" && !isValidGameState(req.body?.state)) ||
      !(req.body.expectedUpdatedAt === null ||
        (typeof req.body.expectedUpdatedAt === "string" && Number.isFinite(Date.parse(req.body.expectedUpdatedAt))))) {
      return res.status(400).json({ error: "Invalid game state or version" });
    }
  }
  try {
    const supabase = getSupabase();
    if (req.method === "GET") {
      const { data, error } = await supabase.from("ssa_game_state").select("state, updated_at").eq("id", 1).maybeSingle();
      if (error) return databaseFailure(res);
      return res.status(200).json(gameResponse(data));
    }
    const { state, expectedUpdatedAt } = req.body;
    const { data: current, error: readError } = await supabase.from("ssa_game_state").select("state, updated_at").eq("id", 1).maybeSingle();
    if (readError) return databaseFailure(res);
    if ((current?.updated_at ?? null) !== expectedUpdatedAt) {
      return res.status(409).json({ error: "The game changed in another Admin tab. State refreshed; try again." });
    }
    const storedState = req.body.action === "undo"
      ? undoWithHistory(current?.state)
      : saveWithHistory(current?.state, state);
    if (!storedState) return res.status(409).json({ error: "Nothing to undo" });
    // Compare-and-swap prevents stale tabs from overwriting another Admin's changes.
    const updated_at = new Date(Math.max(Date.now(), (Date.parse(expectedUpdatedAt) || 0) + 1)).toISOString();
    const row = { state: storedState, updated_at };
    const query = expectedUpdatedAt === null
      ? supabase.from("ssa_game_state").insert({ id: 1, ...row })
      : supabase.from("ssa_game_state").update(row).eq("id", 1).eq("updated_at", expectedUpdatedAt);
    const { data, error } = await query.select("state, updated_at").maybeSingle();
    if (error?.code === "23505" || (!error && !data)) {
      return res.status(409).json({ error: "The game changed in another Admin tab. State refreshed; try again." });
    }
    if (error) return databaseFailure(res);
    return res.status(200).json(gameResponse(data));
  } catch { return databaseFailure(res); }
}

export const config = { api: { bodyParser: { sizeLimit: "32kb" } } };
