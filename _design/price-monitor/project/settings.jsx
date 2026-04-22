// Settings page — Discord, Gmail, schedule

const Settings = ({ settings, onChange, onTestDiscord, onTestEmail }) => {
  const [revealPw, setRevealPw] = React.useState(false);
  const [pwDirty, setPwDirty] = React.useState(false);

  const setHour = (h) => onChange({ ...settings, scheduleHour: h });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">How we scrape, when we scrape, and where we ping you.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-side">
          <h3>Schedule</h3>
          <p>Price Monitor runs once a day at the hour you pick. Pick something quiet — like before you wake up.</p>
        </div>
        <div>
          <div className="card setting-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Daily check hour</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>All times in UTC · currently <b style={{ color: "var(--ink)" }}>{String(settings.scheduleHour).padStart(2, "0")}:00 UTC</b> (your local: {((settings.scheduleHour - 4 + 24) % 24).toString().padStart(2, "0")}:00 EDT)</div>
              </div>
              <span className="tag-flat" style={{ background: "var(--drop-bg)", color: "var(--drop)" }}><Icon name="clock" size={11} stroke={2.4}/> active</span>
            </div>
            <div className="hour-grid">
              {Array.from({ length: 24 }, (_, h) => (
                <button key={h} className={`${settings.scheduleHour === h ? "active" : ""} ${h === 13 ? "now" : ""}`} onClick={() => setHour(h)}>
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 8, fontFamily: "var(--font-mono)" }}>orange outline = current UTC hour</div>
          </div>
        </div>

        <div className="setting-side">
          <h3>Discord</h3>
          <p>Post a rich embed to a channel whenever a price hits your target.</p>
        </div>
        <div>
          <div className="card setting-card">
            <div className="field">
              <label>Webhook URL</label>
              <div className="secret-row">
                <input className="input" type={revealPw ? "text" : "password"} defaultValue="https://discord.com/api/webhooks/1234567890/aBcDeFg…" />
                <button className="btn btn-sm btn-icon btn-ghost" onClick={() => setRevealPw(v => !v)} title="Reveal"><Icon name={revealPw ? "eyeOff" : "eye"} size={14} stroke={2}/></button>
                <button className="btn btn-sm btn-icon btn-ghost" title="Copy"><Icon name="copy" size={14} stroke={2}/></button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span className="secret-status"><span className="sdot"></span>Verified · posts to #deals</span>
                <button className="btn btn-sm" onClick={onTestDiscord}><Icon name="zap" size={13}/>Send test</button>
              </div>
            </div>
          </div>
        </div>

        <div className="setting-side">
          <h3>Email</h3>
          <p>Gmail SMTP with an app password. We never store your main password.</p>
        </div>
        <div>
          <div className="card setting-card">
            <div className="row-2">
              <div className="field">
                <label>Gmail address</label>
                <input className="input" defaultValue="you@gmail.com" />
              </div>
              <div className="field">
                <label>App password</label>
                <div className="secret-row">
                  <input
                    className="input mono"
                    type="password"
                    placeholder={pwDirty ? "" : "•••• •••• •••• ••••   (saved)"}
                    onChange={() => setPwDirty(true)}
                    value={pwDirty ? undefined : ""}
                  />
                  <button className="btn btn-sm btn-ghost" onClick={() => setPwDirty(true)}>Replace</button>
                </div>
                <div className="hint">Saved 34 days ago · <a href="#" style={{ color: "var(--ink-2)" }}>how to create one</a></div>
              </div>
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>Send reports to</label>
              <input className="input" defaultValue="you@gmail.com, partner@gmail.com" />
              <div className="hint">Comma-separated · one HTML summary per target hit.</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
              <span className="secret-status"><span className="sdot"></span>SMTP connected · smtp.gmail.com:587</span>
              <button className="btn btn-sm" onClick={onTestEmail}><Icon name="mail" size={13} stroke={2}/>Send test email</button>
            </div>
          </div>
        </div>

        <div className="setting-side">
          <h3>Scraper</h3>
          <p>Tune retries and rate limits for each store.</p>
        </div>
        <div>
          <div className="card setting-card">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { s: "amazon", method: "HTML scraping", retry: 3, delay: "1.5s" },
                { s: "target", method: "Private JSON API", retry: 2, delay: "0.5s" },
                { s: "ebay", method: "HTML scraping", retry: 2, delay: "1.0s" },
              ].map(row => (
                <div key={row.s} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 10px", background: "var(--cream-2)", borderRadius: 10 }}>
                  <StorePill store={row.s} />
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)", flex: 1 }}>{row.method}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>retry ×{row.retry} · delay {row.delay}</div>
                  <span className="secret-status"><span className="sdot"></span>ok</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Settings });
