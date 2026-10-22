import { readFile } from "node:fs/promises";

// Run only from a local terminal. Never import this script into application code.
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectURL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const checkOnly = process.argv.includes("--check-only");

async function main() {
  if (!token) {
    throw new Error("Missing SUPABASE_ACCESS_TOKEN. Save a Supabase personal access token with Database read-write access in .env.local; do not share it in chat.");
  }
  let projectRef;
  try {
    const url = new URL(projectURL);
    projectRef = url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1];
    if (url.protocol !== "https:" || !projectRef) throw new Error();
  } catch { throw new Error("Configure the real Supabase project API URL in .env.local."); }

  async function query(sql, readOnly = false) {
    let response;
    try {
      response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql, read_only: readOnly }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch { throw new Error("Supabase Management API could not be reached. No credential details were logged."); }
    if (!response.ok) {
      // Do not echo upstream bodies: they can contain sensitive database details.
      throw new Error(`Supabase Management API returned HTTP ${response.status}. Check the token's project access and Database permissions.`);
    }
    try { return await response.json(); }
    catch { throw new Error("Supabase Management API returned an unexpected response."); }
  }

  if (!checkOnly) {
    const sql = await readFile(new URL("../supabase/migrations/202610170001_ssa_game_state.sql", import.meta.url), "utf8");
    await query(sql);
    console.log("Applied SSA game permissions migration.");
  }

  const rows = await query(`
    select c.relrowsecurity as rls_enabled,
      not exists (
        select 1 from unnest(array['anon', 'authenticated']) as roles(role_name)
        cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) as rights(privilege_name)
        where has_table_privilege(roles.role_name, 'public.ssa_game_state', rights.privilege_name)
      ) as public_access_blocked,
      has_table_privilege('service_role', 'public.ssa_game_state', 'SELECT')
        and has_table_privilege('service_role', 'public.ssa_game_state', 'INSERT')
        and has_table_privilege('service_role', 'public.ssa_game_state', 'UPDATE') as server_access_enabled,
      exists (
        select 1 from pg_publication_tables where pubname = 'supabase_realtime'
          and schemaname = 'public' and tablename = 'ssa_game_state'
      ) as realtime_enabled
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'ssa_game_state';
  `, true);
  const result = rows?.[0];
  if (!result || !["rls_enabled", "public_access_blocked", "server_access_enabled", "realtime_enabled"].every((name) => result[name] === true)) {
    throw new Error("Database verification failed: check RLS, public grants, server grants, and Realtime publication.");
  }
  console.log("Verified: RLS enabled, public access blocked, server access enabled, Supabase Realtime enabled.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
