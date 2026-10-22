import { useState } from "react";
import { COLOR_NAMES } from "./gameState";

function DeleteControl({ label, entities, onDelete, disabled }) {
  const [selectedId, setSelectedId] = useState(1);
  const id = entities.some((entity) => entity.id === selectedId) ? selectedId : (entities[0]?.id ?? "");
  return (
    <fieldset disabled={disabled || !entities.length} aria-label={`Remove ${label}`}
      style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: "1 1 340px", border: "1px solid #475569", borderRadius: 8, padding: "8px 10px", margin: 0, minWidth: 0 }}>
      <label style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
        {label}
        <select aria-label={`${label} to remove`} value={id} onChange={(event) => setSelectedId(Number(event.target.value))}
          style={{ padding: 6, background: "#374151", color: "white", borderRadius: 6, maxWidth: "100%", minWidth: 0 }}>
          {!entities.length && <option value="">None remaining</option>}
          {entities.map((entity) => <option key={entity.id} value={entity.id}>
            {label} {entity.id} · Team {entity.id} · {COLOR_NAMES[entity.id - 1]}
          </option>)}
        </select>
      </label>
      <button onClick={() => onDelete(id)} style={{ padding: "8px 12px", borderRadius: 6, background: "#b91c1c", color: "white", fontWeight: "bold" }}>
        DELETE {label === "GS" ? "GS" : "SATELLITE"}
      </button>
    </fieldset>
  );
}

export default function SSAEntityControls({ groundStations, satellites, onDeleteSatellite, onDeleteGroundStation, disabled }) {
  return (
    <div aria-label="Remove game entities" style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "10px 12px", background: "#111827", color: "#e5e7eb" }}>
      <DeleteControl label="Satellite" entities={satellites} onDelete={onDeleteSatellite} disabled={disabled} />
      <DeleteControl label="GS" entities={groundStations} onDelete={onDeleteGroundStation} disabled={disabled} />
    </div>
  );
}
