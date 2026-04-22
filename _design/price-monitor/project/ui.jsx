// Small shared UI components

const StorePill = ({ store }) => {
  const cls = store === "amazon" ? "pill-amz" : store === "target" ? "pill-tgt" : "pill-ebay";
  return (
    <span className={`pill ${cls}`}>
      <span className="dot"></span>
      {storeLabel(store)}
    </span>
  );
};

const ChangeTag = ({ cur, prev }) => {
  if (cur === prev) return <span className="tag-flat">—  0.0%</span>;
  const pct = pctChange(cur, prev);
  const abs = Math.abs(pct).toFixed(1);
  if (cur < prev) return <span className="tag-drop"><Icon name="arrowDown" size={11} stroke={2.4}/>{abs}%</span>;
  return <span className="tag-rise"><Icon name="arrowUp" size={11} stroke={2.4}/>{abs}%</span>;
};

const TargetBar = ({ current, target, original, hit }) => {
  // fill = how close current is to target, normalized between original -> target
  const span = Math.max(original - target, 1);
  const remaining = Math.max(0, current - target);
  const pct = Math.max(0, Math.min(100, 100 - (remaining / span) * 100));
  return (
    <div className={`prod-target ${hit ? "hit" : ""}`}>
      <Icon name="target" size={12} />
      <div className="bar"><i style={{ width: `${pct}%` }}></i></div>
      <span>{fmtMoney(target)}</span>
    </div>
  );
};

const PriceBig = ({ value, className = "" }) => {
  const { dollars, cents } = splitMoney(value);
  return <span className={className}>{dollars}<span className="cents">{cents}</span></span>;
};

Object.assign(window, { StorePill, ChangeTag, TargetBar, PriceBig });
