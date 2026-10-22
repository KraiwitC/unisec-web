import { booleanPointInPolygon, point } from "@turf/turf";

// =====================================================
// LAND CHECK
// =====================================================

export function isPointOnLand(lat, lon, countriesGeoJSON) {
  if (!countriesGeoJSON) return false;

  const pt = point([lon, lat]);

  for (const feature of countriesGeoJSON.features || []) {
    const geometryType = feature.geometry?.type;

    if (
      geometryType === "Polygon" ||
      geometryType === "MultiPolygon"
    ) {
      if (booleanPointInPolygon(pt, feature)) {
        return true;
      }
    }
  }

  return false;
}


// =====================================================
// SIMPLE DISTANCE
// Same behavior as original game
// =====================================================

export function simpleDistance(a, b) {
  const dx = a.lon - b.lon;
  const dy = a.lat - b.lat;

  return Math.sqrt(dx * dx + dy * dy);
}


// =====================================================
// RANDOM LAND INSIDE ONE GRID
// =====================================================

export function randomLandPointInGrid(
  grid,
  countriesGeoJSON
) {
  // Random sampling first
  for (let tries = 0; tries < 25000; tries++) {
    const lon =
      grid.lonMin +
      Math.random() * (grid.lonMax - grid.lonMin);

    const lat =
      grid.latMin +
      Math.random() * (grid.latMax - grid.latMin);

    if (isPointOnLand(lat, lon, countriesGeoJSON)) {
      return {
        lon,
        lat,
        gridId: grid.id,
      };
    }
  }

  // Fallback systematic scan
  // Prevent sparse-land grids from being skipped
  const scanN = 90;

  for (let y = 0; y <= scanN; y++) {
    for (let x = 0; x <= scanN; x++) {
      const lon =
        grid.lonMin +
        (x / scanN) * (grid.lonMax - grid.lonMin);

      const lat =
        grid.latMin +
        (y / scanN) * (grid.latMax - grid.latMin);

      if (isPointOnLand(lat, lon, countriesGeoJSON)) {
        return {
          lon,
          lat,
          gridId: grid.id,
        };
      }
    }
  }

  return null;
}


// =====================================================
// LAND POINT + SPACING
// =====================================================

export function randomPointInGridWithSpacing(
  grid,
  existing,
  countriesGeoJSON,
  minDistance = 7
) {
  let best = null;
  let bestDistance = -1;

  for (let i = 0; i < 500; i++) {
    const p = randomLandPointInGrid(
      grid,
      countriesGeoJSON
    );

    if (!p) {
      break;
    }

    const nearest = existing.length
      ? Math.min(
          ...existing.map((q) =>
            simpleDistance(p, q)
          )
        )
      : 999;

    // Preferred minimum spacing achieved
    if (nearest >= minDistance) {
      return p;
    }

    // Remember best candidate as fallback
    if (nearest > bestDistance) {
      best = p;
      bestDistance = nearest;
    }
  }

  return (
    best ||
    randomLandPointInGrid(
      grid,
      countriesGeoJSON
    )
  );
}


// =====================================================
// GENERATE 14 GROUND STATIONS
// =====================================================

export function generateGroundStations({
  grids,
  countriesGeoJSON,
  colors,
  nTeams = 14,
  minDistance = 16,
  defaultZoneSize = 50,
}) {
  const out = [];

  // -----------------------------------------------------
  // FIRST 9:
  // One Ground Station in EVERY grid
  // -----------------------------------------------------

  for (
    let gridIndex = 0;
    gridIndex < grids.length;
    gridIndex++
  ) {
    const grid = grids[gridIndex];

    const p = randomPointInGridWithSpacing(
      grid,
      out,
      countriesGeoJSON,
      minDistance
    );

    if (!p) {
      console.warn(
        `No land point found in Grid ${grid.id}`
      );
      continue;
    }

    const id = out.length + 1;

    out.push({
      id,
      name: `Ground Station ${id}`,
      color: colors[id - 1],
      lon: p.lon,
      lat: p.lat,
      gridId: grid.id,
      zoneSize: defaultZoneSize,
    });
  }

  // -----------------------------------------------------
  // EXTRA 5:
  // Random grids
  // -----------------------------------------------------

  while (out.length < nTeams) {
    const grid =
      grids[
        Math.floor(Math.random() * grids.length)
      ];

    const p = randomPointInGridWithSpacing(
      grid,
      out,
      countriesGeoJSON,
      minDistance
    );

    if (!p) {
      continue;
    }

    const id = out.length + 1;

    out.push({
      id,
      name: `Ground Station ${id}`,
      color: colors[id - 1],
      lon: p.lon,
      lat: p.lat,
      gridId: grid.id,
      zoneSize: defaultZoneSize,
    });
  }

  return out;
}