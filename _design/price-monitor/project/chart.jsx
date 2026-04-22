// Price history chart — custom SVG with target line, low marker, hover crosshair

const PriceChart = ({ data, target, height = 260, accent = "var(--hit)" }) => {
  const [hover, setHover] = React.useState(null);
  const ref = React.useRef(null);

  const W = 820, H = height;
  const pad = { l: 44, r: 18, t: 18, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const prices = data.map(d => d.price);
  const minP = Math.min(...prices, target) * 0.97;
  const maxP = Math.max(...prices, target) * 1.03;
  const xs = (i) => pad.l + (i / (data.length - 1)) * iw;
  const ys = (p) => pad.t + (1 - (p - minP) / (maxP - minP)) * ih;

  const line = data.map((d,i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(d.price)}`).join(" ");
  const area = `${line} L ${xs(data.length-1)} ${pad.t + ih} L ${xs(0)} ${pad.t + ih} Z`;

  const lowIdx = prices.indexOf(Math.min(...prices));
  const lastIdx = data.length - 1;

  // Y gridlines
  const ticks = 4;
  const tickVals = Array.from({length: ticks + 1}, (_, i) => minP + (maxP - minP) * (i / ticks));

  // X ticks (5 evenly spaced dates)
  const xTicks = [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1];

  const onMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    if (x < pad.l || x > pad.l + iw) { setHover(null); return; }
    const t = (x - pad.l) / iw;
    const idx = Math.round(t * (data.length - 1));
    setHover({ idx, x: xs(idx), y: ys(data[idx].price) });
  };

  const onLeave = () => setHover(null);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: "block", cursor: "crosshair" }}>
      <defs>
        <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={pad.l + iw} y1={ys(v)} y2={ys(v)} stroke="rgba(26,22,20,0.07)" strokeDasharray={i === 0 || i === ticks ? "0" : "2 4"} />
          <text x={pad.l - 8} y={ys(v) + 3.5} textAnchor="end" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--ink-4)">{fmtMoney(v)}</text>
        </g>
      ))}
      {/* x ticks */}
      {xTicks.map((i) => (
        <text key={i} x={xs(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--ink-4)">
          {data[i].date.slice(5)}
        </text>
      ))}
      {/* target reference line */}
      <line x1={pad.l} x2={pad.l + iw} y1={ys(target)} y2={ys(target)} stroke="var(--hit)" strokeDasharray="4 4" strokeWidth="1.5" />
      <rect x={pad.l + iw - 70} y={ys(target) - 18} width="70" height="15" fill="var(--hit)" rx="3" />
      <text x={pad.l + iw - 35} y={ys(target) - 7} textAnchor="middle" fontSize="9.5" fontFamily="Inter, sans-serif" fontWeight="700" fill="#fff" letterSpacing="0.5">TARGET {fmtMoney(target)}</text>
      {/* area + line */}
      <path d={area} fill="url(#areaG)" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {/* lowest marker */}
      <circle cx={xs(lowIdx)} cy={ys(data[lowIdx].price)} r="5" fill="var(--drop)" stroke="#fff" strokeWidth="2" />
      <g>
        <rect x={xs(lowIdx) - 34} y={ys(data[lowIdx].price) + 10} width="68" height="18" rx="4" fill="var(--drop)" />
        <text x={xs(lowIdx)} y={ys(data[lowIdx].price) + 22} textAnchor="middle" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#fff">LOW {fmtMoney(data[lowIdx].price)}</text>
      </g>
      {/* last point */}
      <circle cx={xs(lastIdx)} cy={ys(data[lastIdx].price)} r="4.5" fill={accent} stroke="#fff" strokeWidth="2" />
      {/* hover */}
      {hover && (
        <g>
          <line x1={hover.x} x2={hover.x} y1={pad.t} y2={pad.t + ih} stroke="var(--ink)" strokeDasharray="2 3" strokeWidth="1" opacity="0.35" />
          <circle cx={hover.x} cy={hover.y} r="5" fill={accent} stroke="#fff" strokeWidth="2" />
          <g transform={`translate(${Math.min(hover.x + 10, W - 120)}, ${Math.max(hover.y - 44, pad.t + 4)})`}>
            <rect width="110" height="38" rx="6" fill="var(--ink)" />
            <text x="10" y="15" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="rgba(245,239,228,0.65)">{data[hover.idx].date}</text>
            <text x="10" y="30" fontSize="13" fontFamily="Instrument Serif, serif" fill="#fff" fontWeight="500">{fmtMoney(data[hover.idx].price)}</text>
          </g>
        </g>
      )}
    </svg>
  );
};

Object.assign(window, { PriceChart });
