import { isDeepStrictEqual } from "node:util";
import { gameSnapshot, isValidGameState } from "../../../components/SSA/gameState.js";

export const MAX_UNDO_STEPS = 10;

function historyOf(state) {
  return Array.isArray(state?._undoHistory)
    ? state._undoHistory.filter(isValidGameState).slice(-MAX_UNDO_STEPS).map(gameSnapshot)
    : [];
}

export function gameResponse(row) {
  return {
    state: isValidGameState(row?.state) ? gameSnapshot(row.state) : null,
    updated_at: row?.updated_at ?? null,
    canUndo: isValidGameState(row?.state) && historyOf(row.state).length > 0,
  };
}

export function saveWithHistory(previous, next) {
  const snapshot = gameSnapshot(next);
  const history = historyOf(previous);
  if (isValidGameState(previous) && !isDeepStrictEqual(gameSnapshot(previous), snapshot)) {
    history.push(gameSnapshot(previous));
  }
  return { ...snapshot, _undoHistory: history.slice(-MAX_UNDO_STEPS) };
}

export function undoWithHistory(previous) {
  const history = historyOf(previous);
  if (!history.length) return null;
  return { ...history.pop(), _undoHistory: history };
}
