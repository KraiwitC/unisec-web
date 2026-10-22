import { createClient } from "@supabase/supabase-js";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "ssa_admin";
const SESSION_SECONDS = 8 * 60 * 60;

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || /your[_-]?project|example\.com/i.test(url)) throw new Error("SSA_CONFIGURATION");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function equal(a, b) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export function checkPassword(value) {
  const secret = process.env.SSA_ADMIN_PASSWORD;
  return Boolean(secret && typeof value === "string" && value.length <= 1024 && equal(value, secret));
}

function signature(payload) {
  return createHmac("sha256", process.env.SSA_ADMIN_PASSWORD).update(`ssa-admin-session:${payload}`).digest("base64url");
}

export function isAdmin(req) {
  if (!process.env.SSA_ADMIN_PASSWORD) return false;
  const cookie = req.cookies?.[COOKIE];
  if (typeof cookie !== "string") return false;
  const [expiry, signed, extra] = cookie.split(".");
  return !extra && /^\d+$/.test(expiry) && Number(expiry) > Date.now() &&
    typeof signed === "string" && equal(signed, signature(expiry));
}

export function setSession(req, res, clear = false) {
  const expiry = String(Date.now() + SESSION_SECONDS * 1000);
  const secure = req.headers["x-forwarded-proto"] === "https" || req.socket?.encrypted;
  const value = clear ? "" : `${expiry}.${signature(expiry)}`;
  res.setHeader("Set-Cookie", `${COOKIE}=${value}; Path=/api/ssa; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_SECONDS}${secure ? "; Secure" : ""}`);
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export function databaseFailure(res) {
  // Upstream errors can contain credentials or URLs; never serialize them.
  return res.status(503).json({ error: "Shared game unavailable. Check the Supabase URL, server key, and game table configuration." });
}
