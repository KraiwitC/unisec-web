import assert from "node:assert/strict";

const baseURL = process.env.SSA_TEST_BASE_URL || "http://localhost:3000";
let cookie = "";
let original;
let phase = "API availability";
const streamAbort = new AbortController();
let streamTimeout;
const headers = () => ({ "Content-Type": "application/json", Cookie: cookie });
const getState = async () => {
  const response = await fetch(`${baseURL}/api/ssa/state`);
  assert.equal(response.status, 200, "Shared state must be available");
  assert.equal(response.headers.get("cache-control"), "no-store");
  return response.json();
};
const write = (state, expectedUpdatedAt, extraHeaders = {}) => fetch(`${baseURL}/api/ssa/state`, {
  method: "PUT", headers: { ...headers(), ...extraHeaders },
  body: JSON.stringify({ state, expectedUpdatedAt }),
});

try {
  original = await getState();
  assert.ok(original.state, "Initialize the game from Admin before running the API test");
  for (const path of ["/ssa", "/ssa/admin"]) {
    assert.equal((await fetch(`${baseURL}${path}`)).status, 200);
  }
  assert.equal((await write(original.state, original.updated_at)).status, 401);
  cookie = "ssa_admin=9999999999999.forged";
  assert.equal((await write(original.state, original.updated_at)).status, 401);
  cookie = "";
  let response = await fetch(`${baseURL}/api/ssa/session`, {
    method: "POST", headers: headers(), body: JSON.stringify({ password: process.env.SSA_ADMIN_PASSWORD }),
  });
  assert.equal(response.status, 200, "Admin sign-in must succeed");
  const sessionCookie = response.headers.get("set-cookie");
  assert.ok(sessionCookie.includes("HttpOnly") && sessionCookie.includes("SameSite=Strict"));
  cookie = sessionCookie.split(";")[0];
  assert.equal((await write(original.state, original.updated_at, { Origin: "https://untrusted.example" })).status, 403);
  console.log("PASS: pages, uncached API, Admin session, denied Viewer/forged-cookie/cross-origin writes");

  phase = "Supabase Realtime event stream";
  streamTimeout = setTimeout(() => streamAbort.abort(), 20_000);
  response = await fetch(`${baseURL}/api/ssa/events`, { signal: streamAbort.signal });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("content-type").includes("text/event-stream"));
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const event = async (name) => {
    for (;;) {
      const boundary = buffer.indexOf("\n\n");
      if (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (block.startsWith(`event: ${name}\n`)) return JSON.parse(block.split("\ndata: ")[1]);
        continue;
      }
      const { done, value } = await reader.read();
      assert.ok(!done, "Event stream ended before the expected event");
      buffer += decoder.decode(value, { stream: true });
    }
  };
  await event("ready");
  const current = await getState();
  // Exercise persistence and replication without altering gameplay.
  response = await write(current.state, current.updated_at);
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.canUndo, current.canUndo, "Unchanged writes must not add Undo history");
  assert.ok(!("_undoHistory" in saved.state), "Server history must not be sent to browsers");
  const emitted = await event("state");
  assert.equal(emitted.updated_at, saved.updated_at);
  assert.equal(emitted.canUndo, saved.canUndo);
  assert.deepEqual(emitted.state, current.state);
  assert.deepEqual((await getState()).state, current.state);
  streamAbort.abort();
  clearTimeout(streamTimeout);
  console.log("PASS: writes persist and arrive through Supabase Realtime without exposing or changing Undo history");

  phase = "logout";
  response = await fetch(`${baseURL}/api/ssa/session`, { method: "DELETE", headers: headers() });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  cookie = "";
  assert.equal((await write(current.state, saved.updated_at)).status, 401);
  console.log("PASS: logout clears controller access; game data unchanged");
} catch (error) {
  console.error(`FAIL during ${phase}: ${error.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(streamTimeout);
  streamAbort.abort();
}
