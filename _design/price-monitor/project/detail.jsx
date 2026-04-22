// Product detail page

const Detail = ({ product, onBack, onCheckOne, onEdit, onDelete, checking }) => {
  const p = product;
  const hit = p.current <= p.target;
  const delta = p.current - p.last;
  const savings = p.original - p.current;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrowLeft" size={14}/>Back</button>
        <span style={{ color: "var(--ink-4)", fontSize: 13 }}>/ Tracked products / <span style={{ color: "var(--ink-2)" }}>{p.name.slice(0, 40)}…</span></span>
      </div>

      <div className="detail-grid">
        <div>
          <div className="card detail-hero">
            <div className="detail-hero-top">
              <div className="detail-thumb">product<br/>image</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <StorePill store={p.store} />
                  {hit && <span className="tag-hit">Target hit · {fmtMoney(p.current)}</span>}
                </div>
                <h1 className="detail-title">{p.name}</h1>
                <a className="detail-url" href={p.url} target="_blank" rel="noreferrer">
                  <Icon name="external" size={12} stroke={2}/>
                  {p.url.replace(/^https?:\/\//, "")}
                </a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button className={`btn ${hit ? "btn-hit" : "btn-primary"}`} onClick={onCheckOne} disabled={checking}>
                  {checking ? <><span className="spin" style={{ width: 14, height: 14, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}></span>Checking…</> : <><Icon name="refresh" size={14} stroke={2.2}/>Check this now</>}
                </button>
                <button className="btn btn-sm" onClick={onEdit}><Icon name="edit" size={13} stroke={2}/>Edit</button>
              </div>
            </div>

            <div className="price-hero">
              <div>
                <div className="pk">Current</div>
                <div className="pv" style={{ color: hit ? "var(--hit-2)" : "var(--ink)" }}><PriceBig value={p.current} /></div>
                <div className="ps">
                  {delta === 0 ? "no change" : delta < 0 ? <span style={{ color: "var(--drop)" }}>▼ {fmtMoney(Math.abs(delta))} vs. last</span> : <span style={{ color: "var(--rise)" }}>▲ {fmtMoney(delta)} vs. last</span>}
                </div>
              </div>
              <div>
                <div className="pk">Target</div>
                <div className="pv target"><PriceBig value={p.target} /></div>
                <div className="ps">{hit ? "🎯 reached" : `${fmtMoney(p.current - p.target)} to go`}</div>
              </div>
              <div>
                <div className="pk">All-time low</div>
                <div className="pv" style={{ color: "var(--drop)" }}><PriceBig value={p.low} /></div>
                <div className="ps">logged 18 days ago</div>
              </div>
              <div>
                <div className="pk">Savings</div>
                <div className="pv">{fmtMoney(savings).replace(".00","")}</div>
                <div className="ps">vs. original {fmtMoney(p.original)}</div>
              </div>
            </div>
          </div>

          <div className="card chart-card" style={{ marginTop: 14 }}>
            <div className="chart-head">
              <div className="chart-title">90-day price history</div>
              <div className="chart-legend">
                <span><span className="legend-swatch" style={{ background: "var(--hit)" }}></span>price</span>
                <span><span className="legend-swatch" style={{ background: "var(--hit)", borderTop: "1.5px dashed var(--hit)", background: "transparent" }}></span>target</span>
                <span><span className="legend-swatch" style={{ background: "var(--drop)", borderRadius: "50%", width: 8, height: 8 }}></span>low</span>
              </div>
            </div>
            <PriceChart data={p.history} target={p.target} accent="var(--ink)" />
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Every check, logged</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{p.checks} checks since March 2 · one row per daily sweep</div>
              </div>
              <button className="btn btn-sm btn-ghost"><Icon name="filter" size={13} stroke={2}/>Filter</button>
            </div>
            <table className="tbl hist-tbl" style={{ border: 0, borderRadius: 0 }}>
              <thead>
                <tr>
                  <th>When</th>
                  <th className="num">Price</th>
                  <th className="num">Δ</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {p.history.slice(-10).reverse().map((h, i, arr) => {
                  const prev = arr[i+1];
                  const d = prev ? h.price - prev.price : 0;
                  const isHit = h.price <= p.target;
                  return (
                    <tr key={h.date} className={isHit ? "row-hit" : ""}>
                      <td>{h.date} · 09:00 UTC</td>
                      <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(h.price)}</td>
                      <td className="num" style={{ color: d < 0 ? "var(--drop)" : d > 0 ? "var(--rise)" : "var(--ink-4)" }}>
                        {d === 0 ? "—" : d < 0 ? `▼ ${fmtMoney(Math.abs(d))}` : `▲ ${fmtMoney(d)}`}
                      </td>
                      <td>{isHit ? <span className="tag-hit">Hit</span> : <span className="tag-flat" style={{ background: "transparent", color: "var(--ink-3)", padding: 0 }}>ok</span>}</td>
                      <td style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                        {p.store === "target" ? "JSON API" : "HTML scrape"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          <div className="card side-card">
            <h3>Tracking details</h3>
            <dl className="kv">
              <dt>Added</dt><dd>Jan 28, 2026</dd>
              <dt>Checks</dt><dd>{p.checks}</dd>
              <dt>Frequency</dt><dd>daily · 09:00 UTC</dd>
              <dt>Last checked</dt><dd>{p.lastChecked}</dd>
              <dt>Method</dt><dd>{p.store === "target" ? "JSON API" : "HTML"}</dd>
            </dl>
          </div>

          <div className="card side-card" style={{ marginTop: 12 }}>
            <h3>Alert when below</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 34, letterSpacing: "-0.01em", color: hit ? "var(--hit-2)" : "var(--ink)" }}>
                <PriceBig value={p.target} />
              </div>
              {hit && <span className="tag-hit">reached</span>}
            </div>
            <div style={{ marginTop: 10, height: 8, background: "var(--cream-3)", borderRadius: 999, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, Math.max(0, 100 - ((p.current - p.target) / Math.max(p.original - p.target, 1)) * 100))}%`, background: hit ? "var(--hit)" : "var(--drop)", borderRadius: 999 }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
              <span>target {fmtMoney(p.target)}</span>
              <span>now {fmtMoney(p.current)}</span>
              <span>orig {fmtMoney(p.original)}</span>
            </div>
            <button className="btn btn-sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={onEdit}><Icon name="edit" size={13} stroke={2}/>Change target</button>
          </div>

          <div className="card side-card" style={{ marginTop: 12 }}>
            <h3>Notifications</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="discord" size={14}/> Discord</span>
                <span className="secret-status"><span className="sdot"></span>On</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="mail" size={14}/> Email</span>
                <span className="secret-status"><span className="sdot"></span>On</span>
              </div>
              {hit && <div style={{ fontSize: 12, color: "var(--hit-2)", background: "var(--hit-bg)", padding: "8px 10px", borderRadius: 8, fontWeight: 600 }}>
                ✨ Notified 2m ago — price dropped to target
              </div>}
            </div>
          </div>

          <button className="btn btn-sm btn-danger" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={onDelete}>
            <Icon name="trash" size={13} stroke={2}/>Stop tracking
          </button>
        </aside>
      </div>
    </>
  );
};

Object.assign(window, { Detail });
