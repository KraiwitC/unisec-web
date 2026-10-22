export const N_TEAMS = 14;
export const DEFAULT_ZONE_SIZE = 50;
export const MIN_GS_DISTANCE = 25;
export const COLORS = [
  "#ff66c4", "#ff3131", "#7a72bd", "#8c52ff", "#0097b2", "#38b6ff", "#e4fdfe",
  "#c1ff72", "#00bf63", "#2e6417", "#ffde59", "#ffbd59", "#7a0000", "#351400",
];
export const COLOR_NAMES = [
  "Pink", "Red", "Muted Purple", "Violet", "Teal", "Sky Blue", "Ice Blue",
  "Lime", "Green", "Dark Green", "Yellow", "Light Orange", "Maroon", "Dark Brown",
];

const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
const isPosition = (value) => isRecord(value) &&
  Number.isFinite(value.lat) && value.lat >= -60 && value.lat <= 84 &&
  Number.isFinite(value.lon) && value.lon >= -180 && value.lon <= 180;
const isTeam = (value) => isPosition(value) && Number.isInteger(value.id) &&
  value.id >= 1 && value.id <= N_TEAMS && value.color === COLORS[value.id - 1];
const isTeamList = (values) => Array.isArray(values) && values.length <= N_TEAMS &&
  values.every(isTeam) && new Set(values.map((value) => value.id)).size === values.length;

// Reject unsafe marker HTML and malformed snapshots at both API and browser boundaries.
export function isValidGameState(state) {
  return Boolean(isRecord(state) && Number.isSafeInteger(state.round) && state.round >= 1 &&
    Number.isFinite(state.hitBias) && state.hitBias >= 0 && state.hitBias <= 100 &&
    isTeamList(state.groundStations) &&
    state.groundStations.every((gs) => Number.isInteger(gs.gridId) && gs.gridId >= 1 && gs.gridId <= 9 &&
      [50, 100, 150].includes(gs.zoneSize)) &&
    isTeamList(state.satellites) &&
    state.satellites.every((sat) => sat.targetGroundStation === null ||
      state.groundStations.some((gs) => gs.id === sat.targetGroundStation)));
}

// Only gameplay fields cross the browser boundary. History is managed by the server.
export function gameSnapshot(state) {
  return { round: state.round, hitBias: state.hitBias, groundStations: state.groundStations, satellites: state.satellites };
}
