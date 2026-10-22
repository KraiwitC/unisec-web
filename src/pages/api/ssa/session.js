import { checkPassword, isAdmin, sameOrigin, setSession } from "../../../lib/ssa/server";

// Best-effort local protection. Hosted installations should also rate-limit at the edge.
const attempts = new Map();

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") return res.status(200).json({ authenticated: isAdmin(req) });
  if (!["POST", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: "Invalid request origin" });
  if (req.method === "DELETE") {
    setSession(req, res, true);
    return res.status(200).json({ authenticated: false });
  }
  if (!process.env.SSA_ADMIN_PASSWORD) return res.status(503).json({ error: "Admin password is not configured on the server" });
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const ip = req.socket.remoteAddress || "unknown";
  const attempt = attempts.get(ip) || { count: 0, until: now + 60_000 };
  if (attempt.count >= 10) {
    res.setHeader("Retry-After", String(Math.ceil((attempt.until - now) / 1000)));
    return res.status(429).json({ error: "Too many attempts. Try again in a minute." });
  }
  if (!checkPassword(req.body?.password)) {
    attempt.count++;
    attempts.set(ip, attempt);
    return res.status(401).json({ error: "Incorrect Admin password" });
  }
  attempts.delete(ip);
  setSession(req, res);
  return res.status(200).json({ authenticated: true });
}

export const config = { api: { bodyParser: { sizeLimit: "2kb" } } };
