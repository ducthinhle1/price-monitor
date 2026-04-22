// Main app — routing, state, sidebar

const { useState, useEffect, useRef } = React;

const App = () => {
  const [route, setRoute] = useState(() => {
    const saved = localStorage.getItem("pm_route");
    try { return saved ? JSON.parse(saved) : { page: "dashboard" }; } catch { return { page: "dashboard" }; }
  });
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [checkState, setCheckState] = useState(null);
  const [settings, setSettings] = useState({ scheduleHour: 9 });
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS_RAW);
  const [tweaksVisible, setTweaksVisible] = useState(false);

  useEffect(() => { localStorage.setItem("pm_route", JSON.stringify(route)); }, [route]);

  // Edit mode wiring
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") setTweaksVisible(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksVisible(false);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  const pushTweaks = (next) => {
    setTweaks(next);
    window.parent?.postMessage({ type: "__edit_mode_set_keys", edits: next }, "*");
  };

  const pushToast = (toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, ...toast }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 4000);
  };

  const checkAll = () => {
    if (checkState?.active) return;
    let i = 0;
    const total = products.length;
    setCheckState({ active: true, current: 0, total, label: products[0]?.name.slice(0, 40) + "…" });
    const tick = () => {
      i++;
      if (i >= total) {
        setCheckState(null);
        pushToast({ title: "All 6 prices checked", sub: "1 new target hit · 2 dropped", icon: "check" });
        return;
      }
      setCheckState({ active: true, current: i, total, label: products[i]?.name.slice(0, 40) + "…" });
      setTimeout(tick, 550);
    };
    setTimeout(tick, 550);
  };

  const checkOne = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    pushToast({ title: `Checking ${p.name.slice(0, 30)}…`, sub: `${storeLabel(p.store)} · in progress`, icon: "refresh" });
    setTimeout(() => {
      pushToast({ title: "Price unchanged", sub: `${fmtMoney(p.current)} · next sweep 09:00 UTC`, icon: "check" });
    }, 1400);
  };

  const openProduct = (id) => setRoute({ page: "detail", id });

  const deleteProduct = (id) => {
    const p = products.find(x => x.id === id);
    setProducts(ps => ps.filter(x => x.id !== id));
    pushToast({ title: "Stopped tracking", sub: p?.name.slice(0, 40), icon: "trash" });
    if (route.page === "detail" && route.id === id) setRoute({ page: "dashboard" });
  };

  const saveEdit = (p) => {
    setProducts(ps => ps.map(x => x.id === p.id ? p : x));
    setEditing(null);
    pushToast({ title: "Saved", sub: `Target is now ${fmtMoney(p.target)}`, icon: "check" });
  };

  const addProduct = (data) => {
    const id = "p" + Math.random().toString(36).slice(2, 7);
    const np = {
      id, name: data.name, url: data.url, store: data.store,
      current: data.current, last: data.current, original: data.current, target: data.target,
      low: data.current, high: data.current,
      lastChecked: "just now",
      history: buildHistory(data.current * 1.1, data.current, 14, data.current * 0.95, "flat"),
      checks: 1,
    };
    setProducts(ps => [np, ...ps]);
    setShowAdd(false);
    pushToast({ title: "Now tracking", sub: data.name.slice(0, 40), icon: "target" });
  };

  window.__setLayout = (l) => pushTweaks({ ...tweaks, layout: l });

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", badge: products.length },
    { id: "notifications", label: "Notifications", icon: "bell", badge: products.filter(p => p.current <= p.target).length || null },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  const rootCls = `app accent-${tweaks.accent} ${tweaks.density === "dense" ? "dense" : ""}`;

  return (
    <div className={rootCls}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">₽</div>
          <div className="brand-name">Price<em> Monitor</em></div>
        </div>

        <nav className="nav">
          <div className="nav-label">Workspace</div>
          {nav.map(n => (
            <button key={n.id} className={`nav-item ${route.page === n.id || (n.id === "dashboard" && route.page === "detail") ? "active" : ""}`} onClick={() => setRoute({ page: n.id })}>
              <Icon name={n.icon} size={16} stroke={2}/>
              <span>{n.label}</span>
              {n.badge ? <span className="badge">{n.badge}</span> : null}
            </button>
          ))}
          <div className="nav-label">Quick</div>
          <button className="nav-item" onClick={() => setShowAdd(true)}><Icon name="plus" size={16} stroke={2.4}/>Add product</button>
          <button className="nav-item" onClick={checkAll}><Icon name="refresh" size={16} stroke={2.2}/>Check now</button>
        </nav>

        <div className="sidebar-foot">
          <span className="status-dot"></span>
          <div>
            <div style={{ color: "var(--ink-2)", fontWeight: 600 }}>Scheduler online</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>next · 09:00 UTC</div>
          </div>
        </div>
      </aside>

      <main className="main">
        {route.page === "dashboard" && (
          <Dashboard
            products={products}
            layout={tweaks.layout}
            density={tweaks.density}
            onOpen={openProduct}
            onCheckAll={checkAll}
            onCheckOne={checkOne}
            onEdit={(id) => setEditing(products.find(p => p.id === id))}
            onDelete={deleteProduct}
            onAdd={() => setShowAdd(true)}
            checkState={checkState}
          />
        )}
        {route.page === "detail" && (() => {
          const p = products.find(x => x.id === route.id);
          if (!p) return <Dashboard products={products} layout={tweaks.layout} density={tweaks.density} onOpen={openProduct} onCheckAll={checkAll} onCheckOne={checkOne} onEdit={(id) => setEditing(products.find(p => p.id === id))} onDelete={deleteProduct} onAdd={() => setShowAdd(true)} checkState={checkState} />;
          return <Detail product={p} onBack={() => setRoute({ page: "dashboard" })} onCheckOne={() => checkOne(p.id)} onEdit={() => setEditing(p)} onDelete={() => deleteProduct(p.id)} />;
        })()}
        {route.page === "notifications" && <Notifications products={products} />}
        {route.page === "settings" && <Settings settings={settings} onChange={setSettings} onTestDiscord={() => pushToast({ title: "Test Discord sent", sub: "check #deals", icon: "discord" })} onTestEmail={() => pushToast({ title: "Test email sent", sub: "check your inbox", icon: "mail" })} />}
      </main>

      {showAdd && <AddFlow onClose={() => setShowAdd(false)} onAdd={addProduct} />}
      {editing && <EditFlow product={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}

      <div className="toasts">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <div className="toast-icon"><Icon name={t.icon || "check"} size={15} stroke={2.4}/></div>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.sub && <div className="toast-sub">{t.sub}</div>}
            </div>
            <div className="bar" style={{ width: "100%", animation: "shrink 4s linear forwards" }}></div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>

      {tweaksVisible && <TweaksPanel state={tweaks} onChange={pushTweaks} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
