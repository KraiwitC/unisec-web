"use client";

import { useEffect, useState } from "react";
import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Rectangle,
  GeoJSON,
  Marker,
} from "react-leaflet";

import { generateGroundStations } from "./mapUtils";


// =====================================================
// GAME SETTINGS
// =====================================================

const N_TEAMS = 14;

const DEFAULT_ZONE_SIZE = 50;

const MIN_GS_DISTANCE = 18;

const PLAY_LON_MIN = -180;
const PLAY_LON_MAX = 180;

const PLAY_LAT_MIN = -60;
const PLAY_LAT_MAX = 84;

const GRID_ROWS = 3;
const GRID_COLS = 3;


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
// COMPONENT
// =====================================================

export default function SSAMap() {
  const [countries, setCountries] =
    useState(null);

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
    if (!countries) return;

    const stations =
      generateGroundStations({
        grids: GAME_GRIDS,

        countriesGeoJSON:
          countries,

        colors: COLORS,

        nTeams: N_TEAMS,

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
        bounds={playBounds}
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

        maxBoundsViscosity={0.85}

        style={{
          width: "100%",
          height: "100%",
          background: "#cfe8ff",
        }}

        scrollWheelZoom={true}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"

          url=
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* COUNTRY BOUNDARIES */}

        {countries && (
          <GeoJSON
            data={countries}

            style={{
              color: "#ffffff",
              weight: 0.8,
              opacity: 0.5,
              fillOpacity: 0,
            }}
          />
        )}


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
                    color: "#ffffff",
                    weight: 1.8,
                    opacity: 0.75,
                    fill: false,
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

                  interactive={false}
                />

              </div>
            );
          }
        )}


        {/* GROUND STATIONS */}

        {groundStations.map(
          (gs) => (
            <Marker
              key={gs.id}

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