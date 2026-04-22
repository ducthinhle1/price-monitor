// Tweaks panel — wired to the host via postMessage

const TWEAK_DEFAULTS_RAW = /*EDITMODE-BEGIN*/{
  "accent": "orange",
  "density": "medium",
  "layout": "cards",
  "dark": false
}/*EDITMODE-END*/;

const TweaksPanel = ({ state, onChange }) => {
  const accents = [
    { id: "orange", color: "#E6722A" },
    { id: "magenta", color: "#D63384" },
    { id: "violet", color: "#7B55D9" },
    { id: "lime", color: "#87A436" },
    { id: "sky", color: "#2D8BB3" },
  ];
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <span className="tweak-label">Accent</span>
        <div className="swatches">
          {accents.map(a => (
            <button key={a.id} className={`swatch ${state.accent === a.id ? "active" : ""}`} style={{ background: a.color }} onClick={() => onChange({ ...state, accent: a.id })} title={a.id}></button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-label">Density</span>
        <div className="seg" style={{ padding: 2 }}>
          {["medium","dense"].map(d => (
            <button key={d} className={state.density === d ? "active" : ""} style={{ padding: "4px 9px", fontSize: 11.5 }} onClick={() => onChange({ ...state, density: d })}>{d === "medium" ? "Balanced" : "Dense"}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-label">Dashboard</span>
        <div className="seg" style={{ padding: 2 }}>
          {["cards","table"].map(d => (
            <button key={d} className={state.layout === d ? "active" : ""} style={{ padding: "4px 9px", fontSize: 11.5 }} onClick={() => onChange({ ...state, layout: d })}>{d === "cards" ? "Cards" : "Table"}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { TweaksPanel, TWEAK_DEFAULTS_RAW });
