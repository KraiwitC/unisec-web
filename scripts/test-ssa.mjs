import assert from "node:assert/strict";
import { chromium, request } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const baseURL = process.env.SSA_TEST_BASE_URL || "http://localhost:3000";
if (!process.env.SSA_ADMIN_PASSWORD) throw new Error("SSA_ADMIN_PASSWORD is required locally");
const browserOptions = { channel: process.env.SSA_TEST_BROWSER_CHANNEL || "msedge", headless: true };
const clients = [];
let original;
let restoreState;
let admin;
let phase = "startup";
const failures = [];
let database;
let storedBackup;
let initialState;
let mutated = false;

async function snapshot(client) {
  const result = await client.get("/api/ssa/state");
  assert.equal(result.status(), 200, "State API must be available");
  return result.json();
}

async function waitFor(predicate, message, timeout = 12_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function waitForVersion(page, version) {
  await waitFor(async () => await page.getByTestId("ssa-game").getAttribute("data-state-version") === version,
    "Browser did not receive the persisted state version");
}

async function action(page, perform) {
  const responsePromise = page.waitForResponse((r) => r.url().endsWith("/api/ssa/state") && r.request().method() === "PUT");
  await perform();
  const response = await responsePromise;
  assert.equal(response.status(), 200, "Admin action must persist successfully");
  const result = await response.json();
  mutated = true;
  await waitForVersion(page, result.updated_at);
  return result;
}

try {
  database = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const backup = await database.from("ssa_game_state").select("state").eq("id", 1).maybeSingle();
  if (backup.error) throw new Error("Could not back up the game and Undo history before testing");
  storedBackup = backup.data;
  const publicAPI = await request.newContext({ baseURL });
  clients.push(publicAPI);
  original = await snapshot(publicAPI);
  restoreState = original.state;
  let response = await publicAPI.put("/api/ssa/state", { data: { state: {}, expectedUpdatedAt: null } });
  assert.equal(response.status(), 401, "Viewer writes must be rejected");
  response = await publicAPI.put("/api/ssa/state", { data: { action: "undo", expectedUpdatedAt: original.updated_at } });
  assert.equal(response.status(), 401, "Viewer Undo must be rejected");
  response = await publicAPI.put("/api/ssa/state", { headers: { "x-ssa-admin-password": process.env.SSA_ADMIN_PASSWORD }, data: {} });
  assert.equal(response.status(), 401, "Legacy password header must not grant write access");
  response = await publicAPI.post("/api/ssa/session", { data: { password: "incorrect-test-password" } });
  assert.equal(response.status(), 401, "Incorrect password must be rejected");
  console.log("PASS: unauthenticated Viewer and invalid login are denied");

  phase = "browser startup";
  const adminBrowser = await chromium.launch(browserOptions);
  clients.push(adminBrowser);
  // Independent processes and storage model separate devices, not shared tabs.
  const viewerBrowser = await chromium.launch(browserOptions);
  clients.push(viewerBrowser);
  const adminContext = await adminBrowser.newContext({ baseURL, viewport: { width: 1366, height: 900 } });
  const viewerContext = await viewerBrowser.newContext({ baseURL, viewport: { width: 1366, height: 900 } });
  const mobileContext = await viewerBrowser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  admin = await adminContext.newPage();
  const viewer = await viewerContext.newPage();
  const mobile = await mobileContext.newPage();
  for (const page of [admin, viewer, mobile]) page.on("pageerror", () => failures.push("Browser runtime error"));
  await Promise.all([admin.goto("/ssa/admin"), viewer.goto("/ssa"), mobile.goto("/ssa")]);
  await admin.getByRole("textbox", { name: "Admin password" }).waitFor();
  assert.equal(await admin.getByRole("button", { name: /NEXT ROUND/ }).count(), 0, "Logged-out Admin must not have controls");
  assert.equal(await viewer.getByRole("button", { name: /NEXT ROUND|RESET GAME|Start Game|Sign in|UNDO|DELETE/ }).count(), 0, "Viewer must have no game controls");
  if (!original.state) {
    await viewer.getByTestId("ssa-status").filter({ hasText: "Waiting for Admin" }).waitFor();
    assert.equal(await viewer.locator('[title^="Satellite "]').count(), 0, "Viewer must not invent an initial game");
  }

  phase = "Admin sign-in and initialization";
  await admin.getByRole("textbox", { name: "Admin password" }).fill(process.env.SSA_ADMIN_PASSWORD);
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await admin.getByRole("button", { name: "Sign out of Admin" }).waitFor();
  const cookies = await adminContext.cookies(`${baseURL}/api/ssa/session`);
  const session = cookies.find((c) => c.name === "ssa_admin");
  assert.ok(session?.httpOnly && session.sameSite === "Strict", "Admin cookie must be HttpOnly and SameSite Strict");
  if (!original.state) {
    await admin.getByRole("button", { name: "Start Game" }).waitFor({ state: "visible" });
    await waitFor(async () => await admin.getByRole("button", { name: "Start Game" }).isEnabled(), "Country data did not load", 30_000);
    await action(admin, () => admin.getByRole("button", { name: "Start Game" }).click());
  } else if (original.state.groundStations.length !== 14 || original.state.satellites.length !== 14) {
    await waitFor(async () => await admin.getByRole("button", { name: /RESET GAME/ }).isEnabled(), "Country data did not load", 30_000);
    await action(admin, () => admin.getByRole("button", { name: /RESET GAME/ }).click());
  }
  let current = await snapshot(publicAPI);
  initialState = current.state;
  restoreState ||= current.state;
  assert.equal(current.state.groundStations.length, 14);
  assert.equal(current.state.satellites.length, 14);
  assert.equal(new Set(current.state.groundStations.map((gs) => gs.gridId)).size, 9);
  await Promise.all([waitForVersion(viewer, current.updated_at), waitForVersion(mobile, current.updated_at)]);
  for (const page of [admin, viewer, mobile]) {
    assert.equal(await page.locator('[title^="GS "]').count(), 14);
    assert.equal(await page.locator('[title^="Satellite "]').count(), 14);
    assert.equal(await page.locator('.leaflet-marker-icon').filter({ hasText: /\bG[1-9]\b/ }).count(), 9);
    await page.getByTestId("ssa-status").filter({ hasText: "Live" }).waitFor();
    const legend = page.getByRole("region", { name: "Team colors" });
    assert.equal(await legend.locator('[data-testid^="team-"]').count(), 14);
    assert.ok((await page.getByTestId("team-1").innerText()).includes("Pink"));
    assert.ok((await page.getByTestId("team-14").innerText()).includes("Dark Brown"));
  }
  console.log("PASS: shared initialization, 14 stations/satellites, 3×3 grid, desktop and mobile Viewer");

  phase = "Realtime round synchronization";
  // Block all backup snapshots so these assertions can only pass through Realtime.
  await Promise.all([viewer.route("**/api/ssa/state", (route) => route.abort()), mobile.route("**/api/ssa/state", (route) => route.abort())]);
  const beforeSatellites = JSON.stringify(current.state.satellites);
  current = await action(admin, () => admin.getByRole("button", { name: /NEXT ROUND/ }).click());
  assert.notEqual(JSON.stringify(current.state.satellites), beforeSatellites);
  await Promise.all([waitForVersion(viewer, current.updated_at), waitForVersion(mobile, current.updated_at)]);
  await viewer.getByTestId("ssa-status").filter({ hasText: `Round: ${current.state.round}` }).waitFor();
  console.log("PASS: NEXT ROUND reaches independent Viewers through Supabase Realtime with polling blocked");

  phase = "coverage zone and hit bias";
  current = await action(admin, async () => {
    const slider = admin.getByRole("slider", { name: "Coverage zone" });
    await slider.fill("150");
    await slider.press("Tab");
  });
  assert.equal(current.state.groundStations[0].zoneSize, 150);
  await Promise.all([waitForVersion(viewer, current.updated_at), waitForVersion(mobile, current.updated_at)]);
  current = await action(admin, async () => {
    const slider = admin.getByRole("slider", { name: "Hit bias" });
    await slider.fill("100");
    await slider.press("Tab");
  });
  assert.equal(current.state.hitBias, 100);
  await waitForVersion(viewer, current.updated_at);
  current = await action(admin, () => admin.getByRole("button", { name: /NEXT ROUND/ }).click());
  assert.equal(new Set(current.state.satellites.map((sat) => sat.targetGroundStation)).size, 14, "100% bias must target all stations once");
  await waitForVersion(viewer, current.updated_at);
  console.log("PASS: zone and bias persist and synchronize; 100% hit bias preserves unique targeting");

  const synchronize = (next) => Promise.all([waitForVersion(admin, next.updated_at), waitForVersion(viewer, next.updated_at), waitForVersion(mobile, next.updated_at)]);
  const undo = async () => {
    current = await action(admin, () => admin.getByRole("button", { name: /UNDO/ }).click());
    await synchronize(current);
  };
  const save = async (state) => {
    const result = await adminContext.request.put("/api/ssa/state", { data: { state, expectedUpdatedAt: current.updated_at } });
    assert.equal(result.status(), 200);
    current = await result.json();
    mutated = true;
    await synchronize(current);
  };

  phase = "independent Satellite deletion and Undo";
  const beforeDeletion = current.state;
  await admin.getByRole("combobox", { name: "Satellite to remove" }).selectOption("1");
  current = await action(admin, () => admin.getByRole("button", { name: "DELETE SATELLITE", exact: true }).click());
  await synchronize(current);
  assert.equal(current.state.satellites.length, 13);
  assert.deepEqual(current.state.groundStations, beforeDeletion.groundStations);
  assert.equal(await viewer.locator('[title="Satellite 1"]').count(), 0);
  assert.equal(await viewer.locator('[title^="GS "]').count(), 14);
  await viewer.getByTestId("team-1").getByLabel("Satellite 1 removed").waitFor();
  await viewer.getByTestId("team-1").getByLabel("GS 1 active").waitFor();
  assert.equal(current.canUndo, true);
  assert.ok(!("_undoHistory" in current.state), "History must be managed on the server");
  await undo();
  assert.deepEqual(current.state, beforeDeletion);
  console.log("PASS: team colors, separate Satellite deletion, live legend status, and Undo restore the exact snapshot");

  phase = "GS deletion, remaining-team movement, and persistent Undo";
  await admin.getByRole("combobox", { name: "GS to remove" }).selectOption("1");
  current = await action(admin, () => admin.getByRole("button", { name: "DELETE GS", exact: true }).click());
  await synchronize(current);
  const withoutGS = current.state;
  assert.equal(withoutGS.groundStations.length, 13);
  assert.equal(withoutGS.satellites.length, 14);
  assert.ok(withoutGS.satellites.every((satellite) => satellite.targetGroundStation !== 1));
  assert.equal(await viewer.locator('[title^="GS 1 •"]').count(), 0);
  assert.equal(await viewer.locator('[title="Satellite 1"]').count(), 1);
  await viewer.getByTestId("team-1").getByLabel("GS 1 removed").waitFor();
  await waitFor(async () => await viewer.locator(".leaflet-coverage-pane > div > div").count() === 39, "Deleted GS coverage remained on the map");
  current = await action(admin, () => admin.getByRole("button", { name: /NEXT ROUND/ }).click());
  await synchronize(current);
  assert.equal(current.state.satellites.length, 14);
  assert.ok(current.state.satellites.every((satellite) => satellite.targetGroundStation !== 1));
  await undo();
  assert.deepEqual(current.state, withoutGS);
  // Team IDs remain stable after deletion; coverage must change GS 14, not array index 14.
  await admin.getByRole("combobox", { name: "Ground Station coverage" }).selectOption("14");
  current = await action(admin, async () => {
    const slider = admin.getByRole("slider", { name: "Coverage zone" });
    await slider.fill("100");
    await slider.press("Tab");
  });
  assert.equal(current.state.groundStations.find((gs) => gs.id === 14).zoneSize, 100);
  await undo();
  assert.deepEqual(current.state, withoutGS);
  await admin.reload();
  await waitForVersion(admin, current.updated_at);
  await undo();
  assert.deepEqual(current.state, beforeDeletion, "Undo history must survive Admin reload");
  console.log("PASS: GS deletion removes coverage independently; stable team IDs, NEXT ROUND, and Undo after reload work");

  phase = "empty entity lists and Undo of Reset";
  await save({ ...current.state, satellites: [] });
  assert.equal(await admin.getByRole("button", { name: "DELETE SATELLITE", exact: true }).isDisabled(), true);
  current = await action(admin, () => admin.getByRole("button", { name: /NEXT ROUND/ }).click());
  await undo();
  await undo();
  assert.deepEqual(current.state, beforeDeletion);
  await save({ ...current.state, groundStations: [], satellites: current.state.satellites.map((satellite) => ({ ...satellite, targetGroundStation: null })) });
  assert.equal(await admin.getByRole("slider", { name: "Coverage zone" }).isDisabled(), true);
  assert.equal(await admin.getByRole("button", { name: "DELETE GS", exact: true }).isDisabled(), true);
  current = await action(admin, () => admin.getByRole("button", { name: /NEXT ROUND/ }).click());
  assert.ok(current.state.satellites.every((satellite) => satellite.targetGroundStation === null));
  await undo();
  await undo();
  assert.deepEqual(current.state, beforeDeletion);
  await save({ ...current.state, groundStations: [], satellites: [] });
  const emptyState = current.state;
  current = await action(admin, () => admin.getByRole("button", { name: /RESET GAME/ }).click());
  assert.equal(current.state.groundStations.length, 14);
  assert.equal(current.state.satellites.length, 14);
  await undo();
  assert.deepEqual(current.state, emptyState, "Undo Reset must restore the deleted entities state");
  await undo();
  assert.deepEqual(current.state, beforeDeletion);
  await mobile.getByRole("region", { name: "Team colors" }).waitFor();
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Mobile Viewer should not overflow horizontally");
  await admin.setViewportSize({ width: 390, height: 844 });
  assert.ok(await admin.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Mobile Admin deletion controls should not overflow horizontally");
  assert.equal(await admin.getByRole("button", { name: "DELETE GS", exact: true }).isEnabled(), true);
  await admin.setViewportSize({ width: 1366, height: 900 });
  console.log("PASS: empty Satellite/GS lists, movement without GS, and Undo of RESET GAME stay synchronized");

  phase = "authorization and stale-write protection";
  const data = { state: current.state, expectedUpdatedAt: current.updated_at };
  response = await adminContext.request.put("/api/ssa/state", { headers: { Origin: "https://untrusted.example" }, data });
  assert.equal(response.status(), 403, "Cross-origin writes must be denied");
  response = await adminContext.request.put("/api/ssa/state", { data: { ...data, state: { ...current.state, hitBias: 101 } } });
  assert.equal(response.status(), 400, "Invalid game state must be denied");
  const unsafe = structuredClone(current.state);
  unsafe.satellites[0].color = 'red;\"><img src=x onerror=alert(1)>';
  response = await adminContext.request.put("/api/ssa/state", { data: { ...data, state: unsafe } });
  assert.equal(response.status(), 400, "Unsafe marker HTML must be denied");
  const concurrent = await Promise.all([adminContext.request.put("/api/ssa/state", { data }), adminContext.request.put("/api/ssa/state", { data })]);
  assert.deepEqual(concurrent.map((r) => r.status()).sort(), [200, 409], "Concurrent writes must produce one winner and one conflict");
  current = await snapshot(publicAPI);
  await waitForVersion(admin, current.updated_at);
  response = await adminContext.request.put("/api/ssa/state", { data: { action: "undo", expectedUpdatedAt: data.expectedUpdatedAt } });
  assert.equal(response.status(), 409, "Stale Undo must not consume another Admin's change");
  console.log("PASS: origin validation, snapshot validation, unsafe marker rejection, atomic concurrent-write protection");

  phase = "reset and persistence";
  current = await action(admin, () => admin.getByRole("button", { name: /RESET GAME/ }).click());
  assert.equal(current.state.round, 1);
  assert.ok(current.state.groundStations.every((gs) => gs.zoneSize === 50));
  assert.ok(current.state.satellites.every((sat, i) => sat.lat === current.state.groundStations[i].lat && sat.lon === current.state.groundStations[i].lon));
  assert.equal(current.state.hitBias, 100, "Reset must preserve the existing hit-bias behavior");
  await Promise.all([waitForVersion(viewer, current.updated_at), waitForVersion(mobile, current.updated_at)]);
  await viewer.unroute("**/api/ssa/state");
  await viewer.reload();
  await waitForVersion(viewer, current.updated_at);
  assert.deepEqual((await snapshot(publicAPI)).state, current.state);
  // Simulate losing the event stream; the fallback must still synchronize.
  await viewer.route("**/api/ssa/events", (route) => route.abort());
  await viewer.reload();
  await waitForVersion(viewer, current.updated_at);
  current = await action(admin, () => admin.getByRole("button", { name: /NEXT ROUND/ }).click());
  await waitFor(async () => await viewer.getByTestId("ssa-game").getAttribute("data-state-version") === current.updated_at,
    "Backup sync did not recover after stream loss", 22_000);
  console.log("PASS: RESET GAME, reload persistence, and recovery without a live stream");

  phase = "logout";
  current = await snapshot(publicAPI);
  response = await adminContext.request.put("/api/ssa/state", { data: { state: restoreState, expectedUpdatedAt: current.updated_at } });
  assert.equal(response.status(), 200, "Original game should be restored");
  restoreState = null;
  await admin.getByRole("button", { name: "Sign out of Admin" }).click();
  await admin.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  response = await adminContext.request.put("/api/ssa/state", { data });
  assert.equal(response.status(), 401, "Logged-out Admin writes must be denied");
  assert.equal(failures.length, 0, "Pages must have no browser runtime errors");
  console.log("PASS: logout removes controller access; browser runtime is error-free");
  console.log("SSA integration tests passed; original valid game restored (or initialized for an empty database).");
} catch (error) {
  // No request bodies, cookies, screenshots, or credentials in diagnostic output.
  console.error(`FAIL during ${phase}: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (mutated && database) {
    try {
      const current = await database.from("ssa_game_state").select("updated_at").eq("id", 1).single();
      if (current.error) throw new Error();
      const state = original?.state ? storedBackup.state : { ...initialState, _undoHistory: [] };
      const updated_at = new Date(Math.max(Date.now(), Date.parse(current.data.updated_at) + 1)).toISOString();
      const result = await database.from("ssa_game_state").update({ state, updated_at }).eq("id", 1)
        .eq("updated_at", current.data.updated_at).select("id").single();
      if (result.error) throw new Error();
      console.log("Restored the original game and its original Undo history after testing.");
    } catch { console.error("Could not restore game; inspect Admin state."); process.exitCode = 1; }
  }
  for (const client of clients.reverse()) {
    if (client.close) await client.close();
    else await client.dispose();
  }
}
