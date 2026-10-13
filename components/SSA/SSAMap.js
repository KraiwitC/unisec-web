"use client";

import { MapContainer, TileLayer } from "react-leaflet";

export default function SSAMap() {
  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <MapContainer
        center={[15, 100]}
        zoom={2}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
}