import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

// Fault injection only: this test never writes to the shared Supabase game.
const baseURL = process.env.SSA_TEST_BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({ channel: process.env.SSA_TEST_BROWSER_CHANNEL || "msedge", headless: true });
let phase = "startup";
try {
  const context = await browser.newContext({ baseURL, viewport: { width: 1024, height: 768 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", () => errors.push("Browser runtime error"));
  let version = 1;
  let reads = 0;
  let hold = false;
  let heldRoute;
  const snapshot = () => ({
    state: { round: version, hitBias: 60, groundStations: [], satellites: [] },
    updated_at: new Date(Date.UTC(2026, 0, 1, 0, 0, version)).toISOString(), canUndo: false,
  });
  await page.route("**/api/ssa/state", async (route) => {
    assert.equal(route.request().method(), "GET", "Viewer must never write");
    reads++;
    if (hold) { heldRoute = route; return; }
    await route.fulfill({ json: snapshot() });
  });
  await page.addInitScript(() => {
    window.ssaStreams = [];
    window.EventSource = class extends EventTarget {
      constructor() { super(); this.closed = false; window.ssaStreams.push(this); }
      close() { this.closed = true; }
    };
    window.ssaEmit = (type, data) => window.ssaStreams.at(-1)
      .dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data) }));
  });
  await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
  await page.goto("/ssa");
  const game = page.getByTestId("ssa-game");
  const status = page.getByTestId("ssa-status");
  await expect(game).toHaveAttribute("data-state-version", snapshot().updated_at);
  await page.clock.pauseAt(new Date("2026-01-01T12:05:00Z"));
  const emit = (type, data = {}) => page.evaluate(({ type, data }) => window.ssaEmit(type, data), { type, data });
  const checkVersion = () => expect(game).toHaveAttribute("data-state-version", snapshot().updated_at);

  phase = "fast backup when Realtime is unavailable";
  version++;
  await page.clock.runFor(2_100);
  await checkVersion();
  console.log("PASS: iPad-sized Viewer catches up on the 2-second backup without a stream");

  phase = "live delivery without waiting for polling";
  await emit("ready");
  await expect(status).toContainText("Live");
  version++;
  const beforeEvent = reads;
  await emit("state", snapshot());
  await checkVersion();
  assert.equal(reads, beforeEvent, "Live state must render without another fetch");
  const afterReady = reads;
  await page.clock.runFor(5_000);
  assert.equal(reads, afterReady, "Healthy streams must not use rapid backup polling");
  console.log("PASS: live events render immediately; healthy connections retain slower safety polling");

  phase = "stream loss and repeated reconnect errors";
  await emit("error");
  await expect(status).toContainText("Reconnecting");
  await expect.poll(() => reads).toBeGreaterThan(afterReady);
  version++;
  for (let i = 0; i < 3; i++) { await emit("error"); await page.clock.runFor(700); }
  await checkVersion();
  console.log("PASS: repeated connection errors do not postpone the fast backup");

  phase = "returning to a suspended tab";
  version++;
  const streams = await page.evaluate(() => window.ssaStreams.length);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await checkVersion();
  assert.equal(await page.evaluate(() => window.ssaStreams.length), streams + 1);
  assert.equal(await page.evaluate(() => window.ssaStreams.filter((stream) => !stream.closed).length), 1);
  console.log("PASS: returning to the tab refreshes immediately and replaces the broken stream");

  phase = "heartbeat and half-open stream recovery";
  await emit("ready");
  await page.clock.runFor(20_000);
  await emit("heartbeat");
  const healthyStreams = await page.evaluate(() => window.ssaStreams.length);
  await page.clock.runFor(20_000);
  assert.equal(await page.evaluate(() => window.ssaStreams.length), healthyStreams);
  await page.clock.runFor(15_100);
  await expect(status).toContainText("Reconnecting");
  assert.equal(await page.evaluate(() => window.ssaStreams.length), healthyStreams + 1);
  console.log("PASS: heartbeats preserve healthy streams; a silent stalled stream is replaced");

  phase = "overlapping and stalled snapshot requests";
  // Allow any previous safety fetch to finish before intentionally holding one.
  version++;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await checkVersion();
  hold = true;
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => Boolean(heldRoute)).toBe(true);
  const duringHold = reads;
  await page.clock.runFor(5_000);
  assert.equal(reads, duringHold, "Reconnect and polling must share the pending request");
  hold = false;
  version++;
  await page.clock.runFor(3_100);
  await expect(status).toContainText("Reconnecting");
  await page.clock.runFor(2_100);
  await checkVersion();
  await heldRoute.abort().catch(() => {});
  assert.equal(errors.length, 0);
  assert.equal(await page.getByRole("button", { name: /NEXT ROUND|RESET GAME|UNDO|DELETE/ }).count(), 0);
  console.log("PASS: stalled reads time out and retry; Viewer stays read-only without runtime errors");
} catch (error) {
  console.error(`FAIL during ${phase}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
