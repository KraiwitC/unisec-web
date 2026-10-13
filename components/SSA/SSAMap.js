"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
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

import { generateGroundStations } from "./mapUtils";


// =====================================================
// GAME SETTINGS
// =====================================================

const N_TEAMS = 14;

const DEFAULT_ZONE_SIZE = 50;

const MIN_GS_DISTANCE = 25;

const PLAY_LON_MIN = -180;
const PLAY_LON_MAX = 180;

const PLAY_LAT_MIN = -60;
const PLAY_LAT_MAX = 84;

const GRID_ROWS = 3;
const GRID_COLS = 3;

const ZONE_ZOOM_FACTOR = 2.0;


const COLORS = [
  "#E6194B", // 1 Red
  "#3CB44B", // 2 Green
  "#4363D8", // 3 Blue
  "#F58231", // 4 Orange
  "#911EB4", // 5 Purple
  "#46F0F0", // 6 Cyan
  "#F032E6", // 7 Magenta
  "#BFEF45", // 8 Lime
  "#FABED4", // 9 Pink
  "#008080", // 10 Teal
  "#E6BEFF", // 11 Lavender
  "#9A6324", // 12 Brown
  "#FFE119", // 13 Yellow
  "#800000", // 14 Maroon
];


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

function CoverageZones({
  groundStations,
}) {
  const map = useMap();

  const overlayRef =
    useRef(null);

  const baseZoneZoomRef =
    useRef(null);


  // -----------------------------------------------------
  // CREATE COVERAGE PANE
  // -----------------------------------------------------

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


    // MapContainer already fitted to playBounds.
    // Use this zoom as the visual baseline.
    const timer =
      setTimeout(() => {
        baseZoneZoomRef.current =
          map.getZoom();
      }, 0);


    return () => {
      clearTimeout(timer);

      if (
        overlay.parentNode
      ) {
        overlay.parentNode.removeChild(
          overlay
        );
      }

      overlayRef.current =
        null;
    };
  }, [map]);


  // -----------------------------------------------------
  // PLAYABLE RECTANGLE IN LAYER PIXELS
  // -----------------------------------------------------

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
        Math.min(
          nw.x,
          se.x
        );

      const right =
        Math.max(
          nw.x,
          se.x
        );

      const top =
        Math.min(
          nw.y,
          se.y
        );

      const bottom =
        Math.max(
          nw.y,
          se.y
        );


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


  // -----------------------------------------------------
  // ZONE RADIUS IN PIXELS
  // -----------------------------------------------------

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

        // Same formula as original game.
        return (
          gs.zoneSize /
          1.1
        ) * scale;

      },
      [map]
    );


  // -----------------------------------------------------
  // DRAW COVERAGE
  // -----------------------------------------------------

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


        // Original position
        // + one copy to the left
        // + one copy to the right.
        //
        // overflow:hidden clips
        // anything outside play area.

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


  // -----------------------------------------------------
  // REDRAW WHEN GS CHANGES
  // -----------------------------------------------------

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
  ]);


  // -----------------------------------------------------
  // REDRAW AFTER MAP MOVES / ZOOMS
  // -----------------------------------------------------

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
// COMPONENT
// =====================================================

export default function SSAMap() {
  const [
    countries,
    setCountries,
  ] = useState(null);

  const [
    groundStations,
    setGroundStations,
  ] = useState([]);


  // -----------------------------------------------------
  // LOAD LAND DATA
  // -----------------------------------------------------

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

      .catch((err) => {

        console.error(
          "Failed to load countries:",
          err
        );

      });

  }, []);


  // -----------------------------------------------------
  // GENERATE 14 GROUND STATIONS
  // -----------------------------------------------------

  useEffect(() => {

    if (!countries) {
      return;
    }


    const stations =
      generateGroundStations({

        grids:
          GAME_GRIDS,

        countriesGeoJSON:
          countries,

        colors:
          COLORS,

        nTeams:
          N_TEAMS,

        minDistance:
          MIN_GS_DISTANCE,

        defaultZoneSize:
          DEFAULT_ZONE_SIZE,

      });


    setGroundStations(
      stations
    );

  }, [countries]);


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
      style={{
        width: "100%",
        height: "80vh",
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

        worldCopyJump={false}

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

      >

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


        {/* COVERAGE BELOW MARKERS */}

        <CoverageZones
          groundStations={
            groundStations
          }
        />


        {/* 3 × 3 GRID */}

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

              <div
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

              </div>

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

      </MapContainer>

    </div>
  );
}