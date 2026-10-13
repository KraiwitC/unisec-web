export default function SSAControls({
  groundStations,
  selectedGroundStation,
  onSelectGroundStation,
  onZoneSizeChange,
  round,
  onNextRound,
  onResetGame,
}) {
  if (!groundStations.length) return null;

  const gs = groundStations[selectedGroundStation];

  const buttonStyle = {
    padding: "9px 14px",
    border: "none",
    borderRadius: "8px",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer",
  };

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
      <button
        onClick={onNextRound}
        style={{
          ...buttonStyle,
          background: "#22c55e",
        }}
      >
        🛰️ NEXT ROUND
      </button>

      <button
        onClick={onResetGame}
        style={{
          ...buttonStyle,
          background: "#f59e0b",
        }}
      >
        🔄 RESET GAME
      </button>

      <div
        style={{
          padding: "8px 12px",
          background: "#1f2937",
          borderRadius: "8px",
        }}
      >
        Round: <b>{round}</b>
      </div>

      <div
        style={{
          padding: "8px 12px",
          background: "#1f2937",
          borderRadius: "8px",
        }}
      >
        Ground Station:

        <select
          value={selectedGroundStation}
          onChange={(e) =>
            onSelectGroundStation(Number(e.target.value))
          }
          style={{
            marginLeft: "8px",
            padding: "5px",
            background: "#374151",
            color: "white",
            borderRadius: "6px",
          }}
        >
          {groundStations.map((station, index) => (
            <option key={station.id} value={index}>
              GS {station.id} (G{station.gridId})
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          padding: "8px 12px",
          background: "#1f2937",
          borderRadius: "8px",
        }}
      >
        Zone: <b>{gs.zoneSize}</b> px

        <input
          type="range"
          min="50"
          max="150"
          step="50"
          value={gs.zoneSize}
          onChange={(e) =>
            onZoneSizeChange(Number(e.target.value))
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