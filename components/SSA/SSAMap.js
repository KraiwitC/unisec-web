"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Rectangle,
  GeoJSON,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  generateGroundStations,
  randomLandPointInGrid,
  isPointOnLand,
} from "./mapUtils";

import SSAControls from "./SSAControls";
import SSAEntityControls from "./SSAEntityControls";
import SSATeamLegend from "./SSATeamLegend";
import SSASession from "./SSASession";
import useSharedGame from "./useSharedGame";
import { N_TEAMS, DEFAULT_ZONE_SIZE, MIN_GS_DISTANCE, COLORS } from "./gameState";


// =====================================================
// GAME SETTINGS
// =====================================================


const PLAY_LON_MIN = -180;
const PLAY_LON_MAX = 180;

const PLAY_LAT_MIN = -60;
const PLAY_LAT_MAX = 84;

const GRID_ROWS = 3;
const GRID_COLS = 3;

const ZONE_ZOOM_FACTOR = 2.0;


// =====================================================
// WEB MERCATOR GRID
// =====================================================

function mercatorY(latDeg) {
  const lat =
    Math.max(-85, Math.min(85, latDeg)) *
    Math.PI /
    180;

  return Math.log(
    Math.tan(
      Math.PI / 4 + lat / 2
    )
  );
}


function inverseMercatorY(y) {
  return (
    (
      2 * Math.atan(Math.exp(y)) -
      Math.PI / 2
    ) *
    180 /
    Math.PI
  );
}


function getGameGrids() {
  const gridLonStep =
    (PLAY_LON_MAX - PLAY_LON_MIN) /
    GRID_COLS;

  const mercatorYTop =
    mercatorY(PLAY_LAT_MAX);

  const mercatorYBottom =
    mercatorY(PLAY_LAT_MIN);

  const gridMercatorStep =
    (
      mercatorYTop -
      mercatorYBottom
    ) /
    GRID_ROWS;

  const grids = [];

  // G1 G2 G3
  // G4 G5 G6
  // G7 G8 G9

  for (
    let row = 0;
    row < GRID_ROWS;
    row++
  ) {
    const rowYMax =
      mercatorYTop -
      row * gridMercatorStep;

    const rowYMin =
      rowYMax -
      gridMercatorStep;

    const latMax =
      inverseMercatorY(rowYMax);

    const latMin =
      inverseMercatorY(rowYMin);

    for (
      let col = 0;
      col < GRID_COLS;
      col++
    ) {
      const lonMin =
        PLAY_LON_MIN +
        col * gridLonStep;

      const lonMax =
        lonMin + gridLonStep;

      grids.push({
        id:
          row * GRID_COLS +
          col +
          1,

        row,
        col,

        lonMin,
        lonMax,

        latMin,
        latMax,
      });
    }
  }

  return grids;
}


const GAME_GRIDS = getGameGrids();


// =====================================================
// ICONS
// =====================================================

function createGroundStationIcon(gs) {
  return L.divIcon({
    className: "",

    html: `
      <div
        style="
          width:26px;
          height:26px;
          border-radius:50%;
          border:2px solid #111;
          background:${gs.color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:900;
          color:white;
          text-shadow:
            0 0 2px #000,
            0 0 2px #000;
          box-sizing:border-box;
        "
      >
        ${gs.id}
      </div>
    `,

    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function createSatelliteIcon(satellite) {
  return L.divIcon({
    className: "",

    html: `
      <div
        style="
          width:34px;
          height:34px;
          position:relative;
        "
      >
        <div
          style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:34px;
            line-height:34px;
            color:${satellite.color};
            text-shadow:
              0 0 2px #000,
              0 0 2px #000;
          "
        >
          ★
        </div>

        <div
          style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            padding-top:1px;
            font-size:10px;
            font-weight:900;
            color:white;
            text-shadow:
              -1px -1px 0 #000,
               1px -1px 0 #000,
              -1px  1px 0 #000,
               1px  1px 0 #000;
          "
        >
          ${satellite.id}
        </div>
      </div>
    `,

    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function SatellitePane() {
  const map = useMap();

  useEffect(() => {
    let pane =
      map.getPane("satellitePane");

    if (!pane) {
      pane =
        map.createPane(
          "satellitePane"
        );
    }

    pane.style.zIndex = "700";
  }, [map]);

  return null;
}

function createGridLabelIcon(id) {
  return L.divIcon({
    className: "",

    html: `
      <div
        style="
          color:white;
          font-weight:900;
          font-size:15px;
          text-shadow:
            0 0 3px #000,
            0 0 3px #000;
          background:rgba(15,23,42,.60);
          padding:2px 5px;
          border-radius:5px;
          white-space:nowrap;
        "
      >
        G${id}
      </div>
    `,

    iconSize: [36, 22],
  });
}


// =====================================================
// COLOR HELPER
// =====================================================

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");

  const r =
    parseInt(h.slice(0, 2), 16);

  const g =
    parseInt(h.slice(2, 4), 16);

  const b =
    parseInt(h.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// =====================================================
// COVERAGE ZONES
// =====================================================

function CoverageZones({ groundStations, baseZoneZoomRef }) {
  const map = useMap();
  const overlayRef = useRef(null);


  // CREATE COVERAGE PANE

  useEffect(() => {
    let pane =
      map.getPane("coveragePane");

    if (!pane) {
      pane =
        map.createPane(
          "coveragePane"
        );
    }

    pane.style.zIndex = "450";
    pane.style.pointerEvents =
      "none";


    const overlay =
      document.createElement(
        "div"
      );

    overlay.style.position =
      "absolute";

    overlay.style.pointerEvents =
      "none";

    overlay.style.overflow =
      "hidden";

    pane.appendChild(
      overlay
    );

    overlayRef.current =
      overlay;


    const timer =
      setTimeout(() => {
        baseZoneZoomRef.current =
          map.getZoom();
      }, 0);


    return () => {
      clearTimeout(timer);

      if (overlay.parentNode) {
        overlay.parentNode.removeChild(
          overlay
        );
      }

      overlayRef.current =
        null;
    };
  }, [map, baseZoneZoomRef]);


  // PLAYABLE RECTANGLE IN PIXELS

  const getPlayLayerBounds =
    useCallback(() => {
      const nw =
        map.latLngToLayerPoint([
          PLAY_LAT_MAX,
          PLAY_LON_MIN,
        ]);

      const se =
        map.latLngToLayerPoint([
          PLAY_LAT_MIN,
          PLAY_LON_MAX,
        ]);

      const left =
        Math.min(nw.x, se.x);

      const right =
        Math.max(nw.x, se.x);

      const top =
        Math.min(nw.y, se.y);

      const bottom =
        Math.max(nw.y, se.y);

      return {
        left,
        right,
        top,
        bottom,

        width:
          right - left,

        height:
          bottom - top,
      };
    }, [map]);


  // ZONE RADIUS

  const getZoneRadiusPx =
    useCallback(
      (gs) => {
        const zoom =
          map.getZoom();

        const baseZoom =
          baseZoneZoomRef.current === null
            ? zoom
            : baseZoneZoomRef.current;

        const zoomSteps =
          zoom - baseZoom;

        const scale =
          Math.pow(
            ZONE_ZOOM_FACTOR,
            zoomSteps
          );

        return (
          gs.zoneSize / 1.1
        ) * scale;
      },
      [map, baseZoneZoomRef]
    );


  // DRAW COVERAGE

  const drawCoverageZones =
    useCallback(() => {
      const overlay =
        overlayRef.current;

      if (!overlay) {
        return;
      }

      const bounds =
        getPlayLayerBounds();

      overlay.innerHTML = "";

      overlay.style.left =
        `${bounds.left}px`;

      overlay.style.top =
        `${bounds.top}px`;

      overlay.style.width =
        `${bounds.width}px`;

      overlay.style.height =
        `${bounds.height}px`;


      for (
        const gs of groundStations
      ) {
        const center =
          map.latLngToLayerPoint([
            gs.lat,
            gs.lon,
          ]);

        const localX =
          center.x -
          bounds.left;

        const localY =
          center.y -
          bounds.top;

        const radius =
          getZoneRadiusPx(gs);


        // left / normal / right
        for (
          const shiftX of [
            -bounds.width,
            0,
            bounds.width,
          ]
        ) {
          const circle =
            document.createElement(
              "div"
            );

          circle.style.position =
            "absolute";

          circle.style.borderRadius =
            "50%";

          circle.style.boxSizing =
            "border-box";

          circle.style.pointerEvents =
            "none";


          circle.style.left =
            `${
              localX +
              shiftX -
              radius
            }px`;

          circle.style.top =
            `${
              localY -
              radius
            }px`;

          circle.style.width =
            `${
              radius * 2
            }px`;

          circle.style.height =
            `${
              radius * 2
            }px`;

          circle.style.border =
            `2px solid ${
              hexToRgba(
                gs.color,
                0.4
              )
            }`;

          circle.style.background =
            hexToRgba(
              gs.color,
              0.15
            );

          overlay.appendChild(
            circle
          );
        }
      }
    }, [
      groundStations,
      map,
      getPlayLayerBounds,
      getZoneRadiusPx,
    ]);


  // REDRAW WHEN GS CHANGES

  useEffect(() => {
    const timer =
      setTimeout(() => {
        if (
          baseZoneZoomRef.current === null
        ) {
          baseZoneZoomRef.current =
            map.getZoom();
        }

        drawCoverageZones();
      }, 0);

    return () =>
      clearTimeout(timer);
  }, [
    groundStations,
    map,
    drawCoverageZones,
    baseZoneZoomRef,
  ]);


  useMapEvents({
    zoomend: () => {
      drawCoverageZones();
    },

    moveend: () => {
      drawCoverageZones();
    },
  });


  return null;
}


// =====================================================
// MAIN COMPONENT
// =====================================================
function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function biasedPointNearGroundStation(gs, map, countries, baseZoom) {
  const nw = map.latLngToContainerPoint([PLAY_LAT_MAX, PLAY_LON_MIN]);
  const se = map.latLngToContainerPoint([PLAY_LAT_MIN, PLAY_LON_MAX]);

  const left = Math.min(nw.x, se.x);
  const right = Math.max(nw.x, se.x);
  const top = Math.min(nw.y, se.y);
  const bottom = Math.max(nw.y, se.y);
  const width = right - left;

  if (width <= 0) {
    return { lat: gs.lat, lon: gs.lon };
  }

  const center = map.latLngToContainerPoint([gs.lat, gs.lon]);

  const radius =
    (gs.zoneSize / 1.1) *
    Math.pow(ZONE_ZOOM_FACTOR, map.getZoom() - baseZoom);

  for (let tries = 0; tries < 160; tries++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * radius * 0.82;

    const rawX = center.x - left + Math.cos(angle) * distance;
    const wrappedX = ((rawX % width) + width) % width;
    const y = center.y + Math.sin(angle) * distance;

    // Wrap horizontally only.
    if (y < top || y > bottom) continue;

    const candidate = map.containerPointToLatLng(
      L.point(left + wrappedX, y)
    );

    if (
      candidate.lng >= PLAY_LON_MIN &&
      candidate.lng <= PLAY_LON_MAX &&
      candidate.lat >= PLAY_LAT_MIN &&
      candidate.lat <= PLAY_LAT_MAX &&
      isPointOnLand(candidate.lat, candidate.lng, countries)
    ) {
      return {
        lat: candidate.lat,
        lon: candidate.lng,
      };
    }
  }

  // Fallback remains on land and inside this GS zone.
  return { lat: gs.lat, lon: gs.lon };
}

export default function SSAMap({
  showControls = false,
}) {
  const [
    countries,
    setCountries,
  ] = useState(null);

  const game = useSharedGame(showControls);
  const groundStations = game.state?.groundStations ?? [];
  const satellites = game.state?.satellites ?? [];
  const round = game.state?.round ?? 1;
  const hitBias = game.state?.hitBias ?? 60;
  const [selectedGroundStationId, setSelectedGroundStation] = useState(1);
  const selectedGroundStation = groundStations.some((gs) => gs.id === selectedGroundStationId)
    ? selectedGroundStationId : groundStations[0]?.id;
  const [landError, setLandError] = useState("");
  const mapRef = useRef(null);
  const baseZoneZoomRef = useRef(null);

  // LOAD LAND DATA

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}`
          );
        }

        return res.json();
      })

      .then((data) => {
        setCountries(data);
      })

      .catch(() => {
        setLandError("Could not load country boundaries. Reload to retry.");
      });
  }, []);


  // Only authenticated Admin actions create or mutate the shared game.
  function handleZoneSizeChange(newSize) {
    if (!game.state) return;
    void game.commit({ ...game.state, groundStations: groundStations.map((gs) =>
      gs.id === selectedGroundStation ? { ...gs, zoneSize: newSize } : gs) });
  }

  function handleHitBiasChange(value) {
    if (game.state) void game.commit({ ...game.state, hitBias: value });
  }

  function handleDeleteSatellite(id) {
    if (game.state) void game.commit({ ...game.state, satellites: satellites.filter((satellite) => satellite.id !== id) });
  }

  function handleDeleteGroundStation(id) {
    if (!game.state) return;
    void game.commit({ ...game.state,
      groundStations: groundStations.filter((gs) => gs.id !== id),
      satellites: satellites.map((satellite) => satellite.targetGroundStation === id
        ? { ...satellite, targetGroundStation: null } : satellite),
    });
  }

  function handleNextRound() {
  const map = mapRef.current;

  if (
    !map ||
    !countries || !game.state
  ) {
    return;
  }

  const targets = shuffleArray(groundStations);
  const gridSequence = [
    ...shuffleArray(GAME_GRIDS),
    ...shuffleArray(GAME_GRIDS),
  ];

  const baseZoom = baseZoneZoomRef.current ?? map.getZoom();

  const nextSatellites = satellites.map((satellite, index) => {
    let position;
    let targetGroundStation = null;

    if (targets.length && Math.random() < hitBias / 100) {
      const gs = targets[index % targets.length];

      position = biasedPointNearGroundStation(
        gs,
        map,
        countries,
        baseZoom
      );

      targetGroundStation = gs.id;
    } else {
      position = randomLandPointInGrid(
        gridSequence[index],
        countries
      );

      if (!position) {
        position = {
          lat: satellite.lat,
          lon: satellite.lon,
        };
      }
    }

    return {
      ...satellite,
      lat: position.lat,
      lon: position.lon,
      targetGroundStation,
    };
  });

  void game.commit({ ...game.state, satellites: nextSatellites, round: round + 1 });
}

async function handleResetGame() {
  if (!countries || !game.authenticated || game.saving) return;

  const stations = generateGroundStations({
    grids: GAME_GRIDS,
    countriesGeoJSON: countries,
    colors: COLORS,
    nTeams: N_TEAMS,
    minDistance: MIN_GS_DISTANCE,
    defaultZoneSize: DEFAULT_ZONE_SIZE,
  });

  const startingSatellites = stations.map((gs, index) => ({
    id: index + 1,
    name: `Satellite ${index + 1}`,
    color: COLORS[index],
    lat: gs.lat,
    lon: gs.lon,
    targetGroundStation: gs.id,
  }));

  const saved = await game.commit({ groundStations: stations, satellites: startingSatellites, round: 1, hitBias });
  if (saved) setSelectedGroundStation(1);
}

  const playBounds = [
    [
      PLAY_LAT_MIN,
      PLAY_LON_MIN,
    ],

    [
      PLAY_LAT_MAX,
      PLAY_LON_MAX,
    ],
  ];


  return (
    <div
      data-testid="ssa-game"
      data-state-version={game.updatedAt ?? ""}
      style={{
        width: "100%",
      }}
    >

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <span role="status" data-testid="ssa-status">
          {game.connection} · {game.saving ? "Saving…" : game.state ? `Round: ${round}` : game.loaded ? "Waiting for Admin to start the game" : "Loading shared game…"}
        </span>
        {showControls && <SSASession authenticated={game.authenticated} login={game.login} logout={game.logout} />}
        {showControls && game.authenticated && game.loaded && !game.state &&
          <button onClick={handleResetGame} disabled={!countries || game.saving} style={{ padding: "9px 14px", background: "#22c55e", color: "#111827", borderRadius: 8 }}>
            Start Game
          </button>}
      </div>
      {(game.error || landError) && <p role="alert">{game.error || landError}</p>}

      {/* ADMIN CONTROLS */}

      {showControls && game.authenticated && game.state && (
        <>
        <SSAControls
          disabled={game.saving || !countries || !game.loaded}
          groundStations={
            groundStations
          }

          selectedGroundStation={
            selectedGroundStation
          }

          onSelectGroundStation={
            setSelectedGroundStation
          }

          onZoneSizeChange={
            handleZoneSizeChange
          }

          round={round}

          onNextRound={handleNextRound}

          onResetGame={handleResetGame}

          hitBias={hitBias}

          onHitBiasChange={handleHitBiasChange}
          canUndo={game.canUndo}
          onUndo={game.undo}
        />
        {game.state && <SSAEntityControls
          groundStations={groundStations} satellites={satellites}
          onDeleteSatellite={handleDeleteSatellite} onDeleteGroundStation={handleDeleteGroundStation}
          disabled={game.saving || !game.loaded}
        />}
        </>
      )}

      {game.state && <SSATeamLegend groundStations={groundStations} satellites={satellites} />}

      {/* MAP */}

      <div
        style={{
          width: "100%",

          height:
            showControls
              ? "72vh"
              : "80vh",
        }}
      >

        <MapContainer
          bounds={
            playBounds
          }

          boundsOptions={{
            padding: [4, 4],
          }}

          minZoom={1}
          maxZoom={6}

          worldCopyJump={
            false
          }

          maxBounds={[
            [-62, -180],
            [85, 180],
          ]}

          maxBoundsViscosity={
            0.85
          }

          style={{
            width: "100%",
            height: "100%",
            background:
              "#cfe8ff",
          }}

          scrollWheelZoom={
            true
          }

          ref={mapRef}
        >
            <SatellitePane />

          <TileLayer
            attribution=
              "&copy; OpenStreetMap contributors"

            url=
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {/* COUNTRY BOUNDARIES */}

          {countries && (
            <GeoJSON
              data={
                countries
              }

              style={{
                color:
                  "#ffffff",

                weight:
                  0.8,

                opacity:
                  0.5,

                fillOpacity:
                  0,
              }}
            />
          )}


          {/* COVERAGE */}

          <CoverageZones
            groundStations={groundStations}
            baseZoneZoomRef={baseZoneZoomRef}
          />


          {/* GRID */}

          {GAME_GRIDS.map(
            (grid) => {
              const labelLat =
                grid.latMax -
                (
                  grid.latMax -
                  grid.latMin
                ) *
                0.09;

              const labelLon =
                grid.lonMin +
                (
                  grid.lonMax -
                  grid.lonMin
                ) *
                0.08;

              return (
                <Fragment
                  key={
                    `grid-${grid.id}`
                  }
                >

                  <Rectangle
                    bounds={[
                      [
                        grid.latMin,
                        grid.lonMin,
                      ],

                      [
                        grid.latMax,
                        grid.lonMax,
                      ],
                    ]}

                    pathOptions={{
                      color:
                        "#ffffff",

                      weight:
                        1.8,

                      opacity:
                        0.75,

                      fill:
                        false,

                      dashArray:
                        "8,6",
                    }}
                  />


                  <Marker
                    position={[
                      labelLat,
                      labelLon,
                    ]}

                    icon={
                      createGridLabelIcon(
                        grid.id
                      )
                    }

                    interactive={
                      false
                    }
                  />

                </Fragment>
              );
            }
          )}


          {/* GROUND STATIONS */}

          {groundStations.map(
            (gs) => (
              <Marker
                key={
                  gs.id
                }

                position={[
                  gs.lat,
                  gs.lon,
                ]}

                icon={
                  createGroundStationIcon(
                    gs
                  )
                }

                title={
                  `GS ${gs.id} • Grid ${gs.gridId}`
                }
              />
            )
          )}
          {/* SATELLITES — always above Ground Stations */}
        {satellites.map((satellite) => (
        <Marker
            key={`sat-${satellite.id}`}
            position={[satellite.lat, satellite.lon]}
            icon={createSatelliteIcon(satellite)}
            pane="satellitePane"
            title={`Satellite ${satellite.id}`}
        />
        ))}

        </MapContainer>

      </div>

    </div>
  );
}
