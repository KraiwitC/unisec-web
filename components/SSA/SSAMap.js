"use client";

import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Rectangle,
  Polyline,
  GeoJSON,
} from "react-leaflet";

const PLAY_LON_MIN = -180;
const PLAY_LON_MAX = 180;
const PLAY_LAT_MIN = -60;
const PLAY_LAT_MAX = 84;

// แปลง latitude → Web Mercator Y
function latToMercatorY(lat) {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

// แปลง Web Mercator Y → latitude
function mercatorYToLat(y) {
  const rad = 2 * Math.atan(Math.exp(y)) - Math.PI / 2;
  return (rad * 180) / Math.PI;
}

// ทำให้ 3 แถวสูงเท่ากัน "บนแผนที่"
function getGridLatitudes() {
  const yBottom = latToMercatorY(PLAY_LAT_MIN);
  const yTop = latToMercatorY(PLAY_LAT_MAX);

  const step = (yTop - yBottom) / 3;

  return [
    PLAY_LAT_MIN,
    mercatorYToLat(yBottom + step),
    mercatorYToLat(yBottom + step * 2),
    PLAY_LAT_MAX,
  ];
}

export default function SSAMap() {

  const [countries, setCountries] = useState(null);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    )
      .then((res) => res.json())
      .then((data) => setCountries(data))
      .catch((err) => console.error("Failed to load countries:", err));
  }, []);

  const latLines = getGridLatitudes();

  const lonLines = [
    PLAY_LON_MIN,
    -60,
    60,
    PLAY_LON_MAX,
  ];

  const playBounds = [
    [PLAY_LAT_MIN, PLAY_LON_MIN],
    [PLAY_LAT_MAX, PLAY_LON_MAX],
  ];

  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <MapContainer
        bounds={playBounds}
        boundsOptions={{ padding: [10, 10] }}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
        worldCopyJump={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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

        {/* ขอบสนาม */}
        <Rectangle
          bounds={playBounds}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fill: false,
          }}
        />

        {/* เส้นแนวตั้ง */}
        {lonLines.slice(1, -1).map((lon) => (
          <Polyline
            key={`lon-${lon}`}
            positions={[
              [PLAY_LAT_MIN, lon],
              [PLAY_LAT_MAX, lon],
            ]}
            pathOptions={{
              color: "#ffffff",
              weight: 1,
              opacity: 0.7,
            }}
          />
        ))}

        {/* เส้นแนวนอน */}
        {latLines.slice(1, -1).map((lat) => (
          <Polyline
            key={`lat-${lat}`}
            positions={[
              [lat, PLAY_LON_MIN],
              [lat, PLAY_LON_MAX],
            ]}
            pathOptions={{
              color: "#ffffff",
              weight: 1,
              opacity: 0.7,
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}