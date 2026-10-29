# SSA shared game

`/ssa` displays the persisted game. `/ssa/admin` displays the same game and offers
password sign-in. Only signed-in Admin sessions can start/reset a game, advance
rounds, change coverage zones, change hit bias, delete entities, or Undo changes. Ground Station selection is a
local Admin preference. An empty database waits for **Start Game**; viewers never
generate or save a game.

## Local setup

1. Configure `.env.local` using `.env.template`. `SUPABASE_URL` is the project API
   URL, not its dashboard URL. The existing `NEXT_PUBLIC_SUPABASE_URL` name is also
   supported. Use a secret key or `SUPABASE_SERVICE_ROLE_KEY`, kept server-side.
2. Apply `supabase/migrations/202610170001_ssa_game_state.sql` in Supabase's SQL
   Editor. It preserves the existing row, enables RLS, revokes public table access,
   and enables the Realtime publication. No public/anonymous key is needed.
3. Run `pnpm dev`. Open `/ssa/admin`, sign in with the locally configured password,
   then **Start Game** if the database is empty. Open `/ssa` in another browser.

Alternatively, save `SUPABASE_ACCESS_TOKEN` in the ignored `.env.local` file and run
`pnpm ssa:migrate`. This uses Supabase's Management API to apply the same migration,
then checks RLS, denied public table privileges, server privileges, and the Realtime
publication. Scope the token to this project with Database read-write access. It is
used only by local tooling; the application does not read it. Never share it in chat
or put it in a `NEXT_PUBLIC_` variable. `pnpm ssa:migrate --check-only` verifies the
permissions without applying the migration.

## Data and security

The singleton row `public.ssa_game_state` (id `1`) contains the remaining Ground
Stations and Satellites (up to 14 each), round, hit bias, and server-managed Undo
history. The original grid, spacing setting
`MIN_GS_DISTANCE = 25`, movement algorithm, and horizontal coverage wrapping remain.
Every write validates the complete snapshot and compares `updated_at` atomically.
A stale Admin receives a conflict and refreshes instead of overwriting another tab.

Both pages show a 14-team color legend with color names and separate GS/Satellite
status. Admin has independent **DELETE SATELLITE** and **DELETE GS** selectors.
Deleting a GS removes its coverage and clears satellite targeting references to it;
the satellite positions remain. Team IDs and colors never shift after deletion.
Next Round moves surviving satellites; targets cycle through surviving GS when
there are fewer GS than satellites. With no GS, movement uses random land points.
With no satellites, the round can still advance. Reset restores all 14 pairs.

**UNDO** restores the previous full game snapshot, including rounds, settings,
deletions, and resets. Up to 10 changes are retained in the existing JSONB row, so
Undo works after reload and across Admin devices without another SQL migration.
There is no Redo. History is managed on the server, never accepted from the browser,
and omitted from public snapshots/events; only `canUndo` is sent with each snapshot.
Unchanged saves do not consume an Undo step. Viewer cannot delete or Undo.

`/api/ssa/session` checks the password on the server and issues an eight-hour,
HttpOnly, SameSite=Strict signed cookie (Secure on HTTPS). Passwords are not stored
in browser storage. Writes require this session and check browser request origin.
Login attempts are limited per server process; add edge rate limiting before a
public deployment. Changing the configured password invalidates existing sessions.

`GET /api/ssa/state` returns a snapshot. `PUT` requires the Admin cookie, a valid
state, and `expectedUpdatedAt` (null for a missing row). No browser receives the
privileged key. `GET /api/ssa/events` subscribes to Supabase Postgres Changes on the
server and relays validated snapshots via read-only Server-Sent Events. Browser
broadcasts cannot control the game. Live events render as soon as they arrive.
Healthy streams retain a 15-second safety fetch; connecting or broken streams use
a 2-second backup fetch (plus request/network time). Reconnection requests a fresh
snapshot and SSE advertises a 1-second reconnect delay. Focus, visibility, and online
listeners catch up immediately after returning to the game. Named heartbeats every
15 seconds let the browser replace a silent stream after 35 seconds. Snapshot reads
are deduplicated and time out after 8 seconds so a hung request cannot block recovery.
An authenticated `PUT` with `{ "action": "undo", "expectedUpdatedAt": "..." }`
restores the last saved snapshot atomically, with the same stale-write protection.

Hosting must support streaming responses. A host with request-duration limits will
periodically close streams; EventSource reconnects and the backup fetch continues.
Each connected page uses one server-side Realtime subscription. Reassess connection
limits before a large public event. This work does not deploy or change hosting.

## Verification

`pnpm test:ssa` tests the local app using separate browser contexts and the actual
Supabase database. Configure `.env.local` first and run the dev or production server
on localhost:3000. The test starts a game only if empty, exercises Admin controls,
denies unauthorized writes, checks Realtime and reload persistence, and restores
the original valid game snapshot and its original Undo history using server-side
test cleanup. It also covers independent deletion, coverage removal, surviving-team
movement, empty lists, Undo of Reset, Undo after reload, and live legend updates.
Credentials are read locally; no test traces,
videos, or screenshots of password entry are saved.

`pnpm lint` and `pnpm build` check the repository and production bundle.
`pnpm test:ssa:state` checks validation, bounded persistent Undo, history isolation,
and stable team identities after deletion without using the database.
`pnpm test:ssa:sync` uses an iPad-sized browser, mocked read-only snapshots/events,
and a controlled clock to check rapid fallback, live delivery, reconnect errors,
tab resume, silent stream recovery, and hung/overlapping reads. It never writes to
the database. It emulates the viewport and touch input, not actual iPad Safari.
`pnpm test:ssa:api` checks authentication, write protection, persistence, and actual
Supabase Realtime delivery without launching a browser or changing game data.
Set `SSA_TEST_BASE_URL` to test another local port (for example a production server
on `http://127.0.0.1:3001`). Browser tests default to installed Microsoft Edge;
set `SSA_TEST_BROWSER_CHANNEL` for another installed Chromium channel.
