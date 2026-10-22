import { COLORS, COLOR_NAMES } from "./gameState";

export default function SSATeamLegend({ groundStations, satellites }) {
  const gsIds = new Set(groundStations.map((gs) => gs.id));
  const satelliteIds = new Set(satellites.map((satellite) => satellite.id));
  const badge = (active) => ({ opacity: active ? 1 : 0.45, textDecoration: active ? "none" : "line-through" });
  return (
    <section aria-label="Team colors" style={{ margin: "12px 0", padding: 12, background: "#111827", color: "#e5e7eb", borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8, fontSize: 13 }}>
        <strong>TEAM COLORS</strong>
        <span>● Ground Stations: {groundStations.length}/14 · ★ Satellites: {satellites.length}/14</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 6 }}>
        {COLORS.map((color, index) => {
          const id = index + 1;
          return (
            <div key={id} data-testid={`team-${id}`} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", background: "#1f2937", borderRadius: 6 }}>
              <span aria-hidden="true" style={{ width: 14, height: 14, flexShrink: 0, borderRadius: "50%", background: color, border: "1px solid #94a3b8" }} />
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <div><b>Team {id}</b> · {COLOR_NAMES[index]}</div>
                <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                  <span aria-label={`GS ${id} ${gsIds.has(id) ? "active" : "removed"}`} style={badge(gsIds.has(id))}>● GS</span>
                  <span aria-label={`Satellite ${id} ${satelliteIds.has(id) ? "active" : "removed"}`} style={badge(satelliteIds.has(id))}>★ SAT</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
