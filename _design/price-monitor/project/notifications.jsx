// Notifications preview — Discord embed + HTML email mock

const Notifications = ({ products }) => {
  const hit = products.find(p => p.current <= p.target) || products[0];
  const drops = products.filter(p => p.current < p.last);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications <em>— preview</em></h1>
          <p className="page-sub">What lands in your Discord and inbox when a target is hit.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm"><Icon name="zap" size={13}/>Send test</button>
        </div>
      </div>

      <div className="notif-grid">
        <div>
          <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="discord" size={13}/>Discord embed
          </div>
          <div className="discord-frame">
            <div className="discord-head">
              <span className="hash">#</span>deals<span style={{ color: "#4E5058" }}>·</span><span style={{ fontSize: 12 }}>price alerts</span>
            </div>
            <div className="discord-msg">
              <div className="discord-ava">🎯</div>
              <div style={{ flex: 1 }}>
                <div>
                  <span className="discord-name">PriceBot</span>
                  <span className="discord-bot">APP</span>
                  <span className="discord-time">Today at 09:04</span>
                </div>
                <div style={{ color: "#DBDEE1", fontSize: 13.5, marginTop: 2 }}>
                  🎯 <b>1 target hit</b> and 2 prices dropped this morning.
                </div>
                <div className="discord-embed">
                  <div className="discord-embed-title">{hit.name}</div>
                  <div className="discord-embed-sub">Price dropped to your target on <b>{storeLabel(hit.store)}</b>. Grab it before it climbs back.</div>
                  <div className="discord-fields">
                    <div className="discord-field">
                      <div className="fk">New price</div>
                      <div className="fv" style={{ color: "#86DDA8" }}>{fmtMoney(hit.current)}</div>
                    </div>
                    <div className="discord-field">
                      <div className="fk">Target</div>
                      <div className="fv">{fmtMoney(hit.target)}</div>
                    </div>
                    <div className="discord-field">
                      <div className="fk">vs. last</div>
                      <div className="fv" style={{ color: "#86DDA8" }}>▼ {fmtMoney(Math.abs(hit.current - hit.last))}</div>
                    </div>
                  </div>
                  <div className="discord-foot">
                    <span>💰 Saving you {fmtMoney(hit.original - hit.current)} vs. original</span>
                    <span style={{ marginLeft: "auto" }}>Price Monitor · 09:04 UTC</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button style={{ background: "#4E5058", color: "#fff", border: 0, padding: "6px 12px", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>View product</button>
                  <button style={{ background: "#4E5058", color: "#fff", border: 0, padding: "6px 12px", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Snooze 7d</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="mail" size={13} stroke={2}/>HTML email report
          </div>
          <div className="email-frame">
            <div className="email-chrome">
              <span><b>From</b> Price Monitor &lt;you@gmail.com&gt;</span>
              <span><b>Subject</b> 🎯 1 target hit · {drops.length} price drops today</span>
            </div>
            <div className="email-body">
              <h2 className="email-title">Good morning.</h2>
              <p className="email-lead">Here's what moved overnight — one product hit your target and a few others slipped.</p>

              <div className="email-hit">
                <div className="email-hit-top">
                  <div>
                    <div className="email-hit-name">{hit.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <StorePill store={hit.store} />
                      <span className="tag-hit">🎯 target hit</span>
                    </div>
                  </div>
                </div>
                <div className="email-hit-prices">
                  <span className="np">{fmtMoney(hit.current)}</span>
                  <span className="op">{fmtMoney(hit.last)}</span>
                  <span style={{ fontSize: 12, color: "var(--hit-2)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>▼ {((1 - hit.current / hit.last) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <a href="#" style={{ background: "var(--hit)", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Buy on {storeLabel(hit.store)} →</a>
                  <a href="#" style={{ padding: "8px 14px", fontSize: 13, color: "var(--ink-3)", textDecoration: "none" }}>Open in Price Monitor</a>
                </div>
              </div>

              <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-3)", fontWeight: 600, margin: "18px 0 4px" }}>Also moved</div>
              {drops.slice(0, 3).map(p => (
                <div key={p.id} className="email-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--cream-2)", flexShrink: 0, border: "1px solid var(--line)" }}></div>
                    <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmtMoney(p.current)}</div>
                  <ChangeTag cur={p.current} prev={p.last} />
                </div>
              ))}

              <div className="email-foot">
                you're getting this because you're watching {products.length} products · adjust in Settings · sent 09:04 UTC
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Notifications });
