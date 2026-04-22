// Dashboard — product list, stat strip, Check Now banner, empty state

const Dashboard = ({ products, layout, density, onOpen, onCheckAll, onCheckOne, onEdit, onDelete, onAdd, checkState }) => {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  const filtered = products.filter(p => {
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "hits") return p.current <= p.target;
    if (filter === "dropping") return p.current < p.last;
    if (filter !== "all") return p.store === filter;
    return true;
  });

  const totalHits = products.filter(p => p.current <= p.target).length;
  const totalDropping = products.filter(p => p.current < p.last).length;
  const totalSaved = products.reduce((s, p) => s + Math.max(0, p.original - p.current), 0);

  if (products.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Good morning — <em>6 things on watch</em></h1>
          <p className="page-sub">Next automated check in 7h 42m · last sweep 2 minutes ago</p>
        </div>
        <div className="head-actions">
          <button className="btn" onClick={onCheckAll}><Icon name="refresh" size={16} stroke={2.2}/>Check now</button>
          <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={16} stroke={2.4}/>Add product</button>
        </div>
      </div>

      {checkState && checkState.active && (
        <div className="check-banner">
          <div className="spin"></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 220 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Checking prices…</div>
            <div className="count">{checkState.current} / {checkState.total} · {checkState.label}</div>
          </div>
          <div className="progress"><i style={{ width: `${(checkState.current / checkState.total) * 100}%` }}></i></div>
          <div className="count">{Math.round((checkState.current / checkState.total) * 100)}%</div>
        </div>
      )}

      <div className="stats">
        <div className="card stat stat-accent">
          <div className="stat-label">Target hits</div>
          <div className="stat-value" style={{ color: "var(--hit)" }}>{totalHits}</div>
          <div className="stat-sub">🎯 2 new since yesterday</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Price drops</div>
          <div className="stat-value" style={{ color: "var(--drop)" }}>{totalDropping}</div>
          <div className="stat-sub">↓ vs. last check</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Tracking</div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-sub">across 3 stores</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Saved so far</div>
          <div className="stat-value">{fmtMoney(totalSaved).replace(".00","")}</div>
          <div className="stat-sub">vs. original prices</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={15} stroke={2}/>
          <input placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="seg" role="tablist">
          {["all", "hits", "dropping", "amazon", "target", "ebay"].map(f => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "hits" ? `🎯 Hits (${totalHits})` : f === "dropping" ? "Dropping" : storeLabel(f)}
            </button>
          ))}
        </div>
        <div className="spacer"></div>
        <div className="seg">
          <button className={layout === "cards" ? "active" : ""} onClick={() => window.__setLayout?.("cards")}>Cards</button>
          <button className={layout === "table" ? "active" : ""} onClick={() => window.__setLayout?.("table")}>Table</button>
        </div>
      </div>

      {layout === "cards"
        ? <ProductCards products={filtered} onOpen={onOpen} onCheckOne={onCheckOne} onEdit={onEdit} onDelete={onDelete} />
        : <ProductTable products={filtered} onOpen={onOpen} onCheckOne={onCheckOne} onEdit={onEdit} onDelete={onDelete} />}
    </>
  );
};

const ProductCards = ({ products, onOpen, onCheckOne, onEdit, onDelete }) => (
  <div className="grid">
    {products.map(p => {
      const hit = p.current <= p.target;
      const delta = p.current - p.last;
      return (
        <article key={p.id} className="card prod" onClick={() => onOpen(p.id)}>
          {hit && <div className="ribbon">Target hit</div>}
          <div className="prod-head">
            <div className="prod-thumb">img</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="prod-title">{p.name}</div>
              <div className="prod-meta">
                <StorePill store={p.store} />
                <ChangeTag cur={p.current} prev={p.last} />
              </div>
            </div>
          </div>
          <div className="prod-price-row">
            <span className="prod-price" style={{ color: hit ? "var(--hit-2)" : "var(--ink)" }}>
              <PriceBig value={p.current} />
            </span>
            {p.original > p.current && <span className="prod-was">was {fmtMoney(p.original)}</span>}
          </div>
          <div className="prod-foot">
            <TargetBar current={p.current} target={p.target} original={p.original} hit={hit} />
            <div className="prod-actions" onClick={e => e.stopPropagation()}>
              <button className="btn btn-ghost btn-sm btn-icon" title="Check now" onClick={() => onCheckOne(p.id)}><Icon name="refresh" size={14} stroke={2.2}/></button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => onEdit(p.id)}><Icon name="edit" size={14} stroke={2}/></button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => onDelete(p.id)}><Icon name="trash" size={14} stroke={2}/></button>
            </div>
          </div>
        </article>
      );
    })}
  </div>
);

const ProductTable = ({ products, onOpen, onCheckOne, onEdit, onDelete }) => (
  <table className="tbl">
    <thead>
      <tr>
        <th>Product</th>
        <th>Store</th>
        <th className="num">Current</th>
        <th className="num">Last</th>
        <th className="num">Target</th>
        <th>Status</th>
        <th>Checked</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {products.map(p => {
        const hit = p.current <= p.target;
        return (
          <tr key={p.id} className={`clickable ${hit ? "row-hit" : ""}`} onClick={() => onOpen(p.id)}>
            <td>
              <div className="row-title">
                <div className="tthumb"></div>
                <div className="tname">{p.name}</div>
              </div>
            </td>
            <td><StorePill store={p.store} /></td>
            <td className="num" style={{ color: hit ? "var(--hit-2)" : "var(--ink)", fontWeight: 600 }}>{fmtMoney(p.current)}</td>
            <td className="num" style={{ color: "var(--ink-3)" }}>{fmtMoney(p.last)}</td>
            <td className="num">{fmtMoney(p.target)}</td>
            <td>{hit ? <span className="tag-hit">Hit</span> : <ChangeTag cur={p.current} prev={p.last} />}</td>
            <td style={{ color: "var(--ink-3)", fontSize: 12.5 }}>{p.lastChecked}</td>
            <td onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onCheckOne(p.id)}><Icon name="refresh" size={14} stroke={2.2}/></button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(p.id)}><Icon name="edit" size={14} stroke={2}/></button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onDelete(p.id)}><Icon name="trash" size={14} stroke={2}/></button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const EmptyState = ({ onAdd }) => (
  <div className="card empty">
    <div className="empty-art">
      <svg viewBox="0 0 180 120" width="180" height="120">
        <defs>
          <linearGradient id="eg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--hit)" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="var(--hit)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M10 90 Q 40 40, 70 70 T 140 40 L 170 25" fill="none" stroke="var(--hit)" strokeWidth="2.2" strokeDasharray="3 3"/>
        <path d="M10 90 Q 40 40, 70 70 T 140 40 L 170 25 L 170 100 L 10 100 Z" fill="url(#eg)" stroke="none"/>
        <circle cx="70" cy="70" r="5" fill="var(--drop)" stroke="#fff" strokeWidth="2"/>
        <circle cx="140" cy="40" r="5" fill="var(--hit)" stroke="#fff" strokeWidth="2"/>
        <text x="148" y="32" fontSize="10" fontFamily="Instrument Serif, serif" fill="var(--hit-2)" fontWeight="600">hit! 🎯</text>
        <text x="16" y="86" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="var(--ink-3)">$219</text>
        <text x="152" y="52" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="var(--drop)">$179</text>
      </svg>
    </div>
    <h2 className="empty-title">Nothing on watch yet.</h2>
    <p className="empty-sub">Paste a product URL from Amazon, Target, or eBay and we'll start tracking the price every morning.</p>
    <button className="btn btn-hit" onClick={onAdd}><Icon name="plus" size={16} stroke={2.4}/>Track your first product</button>
    <div className="empty-examples">
      <span style={{ fontSize: 11.5, color: "var(--ink-4)", width: "100%", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Try one of these</span>
      <button className="empty-chip" onClick={onAdd}><span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amz)" }}></span>amazon.com/dp/B0…</button>
      <button className="empty-chip" onClick={onAdd}><span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--tgt)" }}></span>target.com/p/…</button>
      <button className="empty-chip" onClick={onAdd}><span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ebay)" }}></span>ebay.com/itm/…</button>
    </div>
  </div>
);

Object.assign(window, { Dashboard, EmptyState });
