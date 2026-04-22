// Add product modal + Edit product modal

const AddFlow = ({ onClose, onAdd }) => {
  const [url, setUrl] = React.useState("");
  const [detected, setDetected] = React.useState(null);
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [current, setCurrent] = React.useState(0);
  const [target, setTarget] = React.useState("");

  React.useEffect(() => {
    if (!url) { setDetected(null); return; }
    const u = url.toLowerCase();
    const t = setTimeout(() => {
      let store = null;
      if (u.includes("amazon.")) store = "amazon";
      else if (u.includes("target.")) store = "target";
      else if (u.includes("ebay.")) store = "ebay";
      if (!store) { setDetected({ ok: false, msg: "We only support Amazon, Target, and eBay URLs" }); return; }
      setDetected({ ok: true, store, msg: `${storeLabel(store)} · ${store === "target" ? "using JSON API" : "HTML scrape with retry"}` });
    }, 350);
    return () => clearTimeout(t);
  }, [url]);

  const fetchPreview = () => {
    if (!detected?.ok) return;
    // Simulate fetch
    const mock = {
      amazon: { name: "Anker 737 Power Bank (PowerCore 24K) — Built-in USB-C Cable", price: 149.99 },
      target: { name: "Stanley 40 oz Quencher H2.0 FlowState Tumbler — Rose Quartz", price: 44.99 },
      ebay: { name: "Sony PlayStation 5 Slim Digital Edition — 1TB (New, Sealed)", price: 399.00 },
    }[detected.store];
    setName(mock.name);
    setCurrent(mock.price);
    setTarget((mock.price * 0.85).toFixed(2));
    setStep(2);
  };

  const targetN = parseFloat(target) || 0;
  const discount = targetN > 0 && current > 0 ? ((current - targetN) / current) * 100 : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{step === 1 ? "Track a new price" : "Set your target"}</h2>
            <p className="modal-sub">
              {step === 1 ? "Paste a product URL. We'll fetch the name and current price." : `Currently ${fmtMoney(current)} — tell us when to ping you.`}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        {step === 1 && (
          <div className="modal-body">
            <div className="field">
              <label>Product URL</label>
              <input
                className="input mono"
                placeholder="https://www.amazon.com/dp/B0…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                autoFocus
              />
              <div className="hint">Supports Amazon, Target, and eBay product pages.</div>
            </div>

            {detected && (
              <div className={`detect ${detected.ok ? "ok" : ""}`}>
                <Icon name={detected.ok ? "check" : "x"} size={14} stroke={2.4}/>
                {detected.ok ? <>Detected <b>{storeLabel(detected.store)}</b> — {detected.msg.split("·")[1]}</> : detected.msg}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
              <button className="empty-chip" onClick={() => setUrl("https://www.amazon.com/dp/B0C6KKQ7ND")}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amz)" }}></span>Amazon example
              </button>
              <button className="empty-chip" onClick={() => setUrl("https://www.target.com/p/stanley-40oz/-/A-88997733")}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--tgt)" }}></span>Target example
              </button>
              <button className="empty-chip" onClick={() => setUrl("https://www.ebay.com/itm/294712883410")}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ebay)" }}></span>eBay example
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-body">
            <div className="field">
              <label>Product name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="row-2">
              <div className="field">
                <label>Current price (live)</label>
                <div className="input-group">
                  <span className="input-prefix">$</span>
                  <input className="input mono" readOnly value={current.toFixed(2)} />
                </div>
              </div>
              <div className="field">
                <label>Alert when below</label>
                <div className="input-group">
                  <span className="input-prefix">$</span>
                  <input className="input mono" value={target} onChange={e => setTarget(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="target-preview">
              <div>
                {targetN <= 0 ? <span style={{ color: "var(--ink-3)" }}>Set a target to see the savings preview</span>
                : targetN >= current ? <span style={{ color: "var(--rise)" }}>Target must be below current price</span>
                : <><span style={{ color: "var(--ink-3)" }}>You'll be alerted if price drops </span><span className="delta" style={{ color: "var(--hit-2)" }}>{discount.toFixed(1)}% · saving {fmtMoney(current - targetN)}</span></>}
              </div>
              <Icon name="target" size={16} stroke={2}/>
            </div>

            <div style={{ background: "var(--cream-2)", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
              <Icon name="bell" size={16} stroke={2}/>
              <div style={{ fontSize: 12.5 }}>
                You'll get a <b>Discord ping</b> and <b>email</b> the moment it hits. Change this anytime in Settings.
              </div>
            </div>
          </div>
        )}

        <div className="modal-foot">
          {step === 2 && <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}><Icon name="arrowLeft" size={14}/>Back</button>}
          <div className="spacer" style={{ flex: 1 }}></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          {step === 1 ? (
            <button className="btn btn-primary" disabled={!detected?.ok} onClick={fetchPreview}>
              <Icon name="arrowRight" size={14} stroke={2.4}/>Fetch preview
            </button>
          ) : (
            <button className="btn btn-hit" disabled={!targetN || targetN >= current} onClick={() => onAdd({ name, url, store: detected.store, current, target: targetN })}>
              <Icon name="check" size={14} stroke={2.4}/>Start tracking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EditFlow = ({ product, onClose, onSave }) => {
  const [name, setName] = React.useState(product.name);
  const [target, setTarget] = React.useState(product.target);
  const targetN = parseFloat(target) || 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Edit product</h2>
            <p className="modal-sub">Rename or adjust the target — history is preserved.</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Display name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Alert when below</label>
            <div className="input-group">
              <span className="input-prefix">$</span>
              <input className="input mono" value={target} onChange={e => setTarget(e.target.value)} />
            </div>
            <div className="hint">Current price is {fmtMoney(product.current)}. All-time low {fmtMoney(product.low)}.</div>
          </div>
          <div className="target-preview">
            <span style={{ color: "var(--ink-3)", fontSize: 12.5 }}>URL locked — delete & re-add to change source</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-4)" }}>{product.url.slice(0, 42)}…</span>
          </div>
        </div>
        <div className="modal-foot">
          <div className="spacer" style={{ flex: 1 }}></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave({ ...product, name, target: targetN })}>
            <Icon name="check" size={14} stroke={2.4}/>Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { AddFlow, EditFlow });
