export default function SSAControls({
  groundStations,
  selectedGroundStation,
  onSelectGroundStation,
  onZoneSizeChange,
}) {
  if (!groundStations.length) {
    return null;
  }

  const gs =
    groundStations[selectedGroundStation];

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
        padding: "10px 12px",
        background: "#111827",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          background: "#1f2937",
          padding: "8px 12px",
          borderRadius: "10px",
        }}
      >
        Ground Station:

        <select
          value={selectedGroundStation}
          onChange={(e) =>
            onSelectGroundStation(
              Number(e.target.value)
            )
          }
          style={{
            marginLeft: "6px",
            padding: "5px 8px",
            borderRadius: "6px",
            background: "#374151",
            color: "white",
            border: "1px solid #64748b",
          }}
        >
          {groundStations.map(
            (station, index) => (
              <option
                key={station.id}
                value={index}
              >
                GS {station.id} (G{station.gridId})
              </option>
            )
          )}
        </select>
      </div>

      <div
        style={{
          background: "#1f2937",
          padding: "8px 12px",
          borderRadius: "10px",
        }}
      >
        Zone:{" "}
        <b>{gs.zoneSize}</b> px

        <input
          type="range"
          min="50"
          max="150"
          step="50"
          value={gs.zoneSize}
          onChange={(e) =>
            onZoneSizeChange(
              Number(e.target.value)
            )
          }
          style={{
            width: "150px",
            marginLeft: "8px",
            verticalAlign: "middle",
          }}
        />
      </div>
    </div>
  );
}