import assert from "node:assert/strict";
import test from "node:test";
import { COLORS, MIN_GS_DISTANCE, gameSnapshot, isValidGameState } from "../components/SSA/gameState.js";
import { gameResponse, MAX_UNDO_STEPS, saveWithHistory, undoWithHistory } from "../src/lib/ssa/history.js";

const fixture = () => ({
  round: 1, hitBias: 60,
  groundStations: COLORS.map((color, index) => ({ id: index + 1, color, lat: 0, lon: 0, gridId: index % 9 + 1, zoneSize: 50 })),
  satellites: COLORS.map((color, index) => ({ id: index + 1, color, lat: 0, lon: 0, targetGroundStation: index + 1 })),
});

test("state supports independent deletion, stable team identities, and an empty map", () => {
  const state = fixture();
  assert.equal(MIN_GS_DISTANCE, 25);
  assert.ok(isValidGameState(state));
  state.satellites.splice(0, 1);
  assert.ok(isValidGameState(state));
  state.groundStations.splice(0, 1);
  assert.ok(isValidGameState(state));
  assert.ok(isValidGameState({ ...state, groundStations: [], satellites: state.satellites.map((sat) => ({ ...sat, targetGroundStation: null })) }));
  assert.ok(isValidGameState({ ...state, groundStations: [], satellites: [] }));
});

test("validation rejects duplicate IDs, incorrect colors, and dangling GS targets", () => {
  const state = fixture();
  state.satellites[0].id = 2;
  assert.equal(isValidGameState(state), false);
  state.satellites[0] = { ...fixture().satellites[0], color: "red; unsafe" };
  assert.equal(isValidGameState(state), false);
  state.satellites = fixture().satellites;
  state.groundStations.shift();
  assert.equal(isValidGameState(state), false);
});

test("undo survives serialized storage and restores exact snapshots without nested history", () => {
  const original = fixture();
  const first = saveWithHistory(original, { ...original, round: 2 });
  const second = saveWithHistory(first, { ...gameSnapshot(first), satellites: [] });
  const restored = undoWithHistory(JSON.parse(JSON.stringify(second)));
  assert.deepEqual(gameSnapshot(restored), gameSnapshot(first));
  assert.deepEqual(gameSnapshot(undoWithHistory(restored)), original);
  assert.equal(undoWithHistory(original), null);
  assert.ok(!("_undoHistory" in second._undoHistory[0]));
});

test("history is bounded, ignores client-supplied history, and skips unchanged saves", () => {
  let state = fixture();
  for (let i = 0; i < 15; i++) state = saveWithHistory(state, { ...gameSnapshot(state), round: state.round + 1, _undoHistory: [fixture()] });
  assert.equal(state._undoHistory.length, MAX_UNDO_STEPS);
  assert.equal(state._undoHistory.at(-1).round, 15);
  assert.equal(saveWithHistory(state, gameSnapshot(state))._undoHistory.length, MAX_UNDO_STEPS);
  const response = gameResponse({ state, updated_at: "test" });
  assert.equal(response.canUndo, true);
  assert.ok(!("_undoHistory" in response.state));
  assert.equal(gameResponse({ state: fixture() }).canUndo, false);
  assert.equal(gameResponse({ state: {} }).state, null);
  for (let i = 0; i < MAX_UNDO_STEPS; i++) state = undoWithHistory(state);
  assert.equal(undoWithHistory(state), null);
});
