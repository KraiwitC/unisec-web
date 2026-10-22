import { useEffect, useState } from "react";

export default function SSAControls({
  groundStations,
  selectedGroundStation,
  onSelectGroundStation,
  onZoneSizeChange,
  round,
  onNextRound,
  onResetGame,
  hitBias,
  onHitBiasChange,
  canUndo,
  onUndo,
  disabled = false,
}) {
  const gs = groundStations.find((station) => station.id === selectedGroundStation);
  const [zoneDraft, setZoneDraft] = useState(gs?.zoneSize ?? 50);
  const [biasDraft, setBiasDraft] = useState(hitBias ?? 60);
  useEffect(() => {
    if (!disabled) {
      setZoneDraft(gs?.zoneSize ?? 50);
      setBiasDraft(hitBias ?? 60);
    }
  }, [gs?.id, gs?.zoneSize, hitBias, disabled]);

  // Preview while dragging; persist on release/keyboard completion/blur. This
  // avoids disabling a slider halfway through a drag while a network write runs.
  const commitZone = (event) => {
    const value = Number(event.currentTarget.value);
    if (!disabled && gs && value !== gs.zoneSize) onZoneSizeChange(value);
  };
  const commitBias = (event) => {
    const value = Number(event.currentTarget.value);
    if (!disabled && value !== hitBias) onHitBiasChange?.(value);
  };

  const buttonStyle = {
    padding: "9px 14px",
    border: "none",
    borderRadius: "8px",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const controlStyle = {
    padding: "8px 12px",
    background: "#1f2937",
    borderRadius: "8px",
  };

  return (
    <fieldset
      disabled={disabled}
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
        padding: "10px 12px",
        background: "#111827",
        color: "#e5e7eb",
        border: 0,
        margin: 0,
        minWidth: 0,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {/* NEXT ROUND */}

      <button
        onClick={onNextRound}
        style={{
          ...buttonStyle,
          background: "#22c55e",
        }}
      >
        🛰️ NEXT ROUND
      </button>

      {/* RESET GAME */}

      <button
        onClick={onResetGame}
        style={{
          ...buttonStyle,
          background: "#f59e0b",
        }}
      >
        🔄 RESET GAME
      </button>

      <button onClick={onUndo} disabled={!canUndo} style={{ ...buttonStyle, background: "#93c5fd", opacity: canUndo ? 1 : 0.5 }}>
        ↶ UNDO
      </button>

      {/* ROUND COUNTER */}

      <div style={controlStyle}>
        Round: <b>{round}</b>
      </div>

      {/* GROUND STATION SELECTOR */}

      <div style={controlStyle}>
        Ground Station:

        <select
          aria-label="Ground Station coverage"
          value={gs?.id ?? ""}
          disabled={!gs}
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
          {!gs && <option value="">No Ground Stations</option>}
          {groundStations.map((station) => (
            <option key={station.id} value={station.id}>
              GS {station.id} (G{station.gridId})
            </option>
          ))}
        </select>
      </div>

      {/* COVERAGE ZONE */}

      <div style={controlStyle}>
        Zone: <b>{gs ? zoneDraft : "—"}</b> {gs ? "px" : ""}

        <input
          type="range"
          min="50"
          max="150"
          step="50"
          aria-label="Coverage zone"
          disabled={!gs}
          value={zoneDraft}
          onChange={(e) => setZoneDraft(Number(e.target.value))}
          onPointerUp={commitZone}
          onKeyUp={commitZone}
          onBlur={commitZone}
          style={{
            width: "150px",
            marginLeft: "8px",
            verticalAlign: "middle",
          }}
        />
      </div>

      {/* HIT BIAS */}

      <div style={controlStyle}>
        Hit bias: <b>{biasDraft}%</b>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          aria-label="Hit bias"
          value={biasDraft}
          onChange={(e) => setBiasDraft(Number(e.target.value))}
          onPointerUp={commitBias}
          onKeyUp={commitBias}
          onBlur={commitBias}
          style={{
            width: "150px",
            marginLeft: "8px",
            verticalAlign: "middle",
          }}
        />
      </div>
    </fieldset>
  );
}
