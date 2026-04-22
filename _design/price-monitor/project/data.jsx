// Sample data for the prototype

const SAMPLE_PRODUCTS = [
  {
    id: "p1",
    name: "Keychron Q1 Pro Mechanical Keyboard — Wireless, Hot-Swappable",
    store: "amazon",
    url: "https://www.amazon.com/dp/B0BXJXK4P7",
    current: 179.00,
    last: 199.00,
    original: 219.00,
    target: 180.00,
    low: 172.50,
    high: 229.00,
    lastChecked: "2m ago",
    history: buildHistory(219, 179, 90, 172.50, "down"),
    checks: 142,
  },
  {
    id: "p2",
    name: "Hoka Clifton 9 Running Shoes — Women's, Peach Parfait / Chalk",
    store: "target",
    url: "https://www.target.com/p/hoka-clifton-9/-/A-89112233",
    current: 124.99,
    last: 144.99,
    original: 144.99,
    target: 125.00,
    low: 124.99,
    high: 144.99,
    lastChecked: "2m ago",
    history: buildHistory(144.99, 124.99, 90, 124.99, "down"),
    checks: 142,
    hitJustNow: true,
  },
  {
    id: "p3",
    name: "LG C3 65\" OLED evo 4K Smart TV (OLED65C3PUA)",
    store: "ebay",
    url: "https://www.ebay.com/itm/285234997812",
    current: 1649.00,
    last: 1599.00,
    original: 2499.00,
    target: 1500.00,
    low: 1549.00,
    high: 2499.00,
    lastChecked: "2m ago",
    history: buildHistory(2499, 1649, 90, 1549, "mixed"),
    checks: 142,
  },
  {
    id: "p4",
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    store: "amazon",
    url: "https://www.amazon.com/dp/B09XS7JWHH",
    current: 328.00,
    last: 319.99,
    original: 399.99,
    target: 280.00,
    low: 279.99,
    high: 399.99,
    lastChecked: "2m ago",
    history: buildHistory(399.99, 328, 90, 279.99, "mixed"),
    checks: 142,
  },
  {
    id: "p5",
    name: "Lego Architecture Colosseum — 10276",
    store: "target",
    url: "https://www.target.com/p/lego-arch-colosseum/-/A-83044889",
    current: 459.99,
    last: 459.99,
    original: 549.99,
    target: 400.00,
    low: 429.99,
    high: 549.99,
    lastChecked: "2m ago",
    history: buildHistory(549.99, 459.99, 90, 429.99, "flat"),
    checks: 142,
  },
  {
    id: "p6",
    name: "Vitamix A3500 Ascent Series Smart Blender",
    store: "ebay",
    url: "https://www.ebay.com/itm/374821663211",
    current: 549.95,
    last: 499.95,
    original: 649.95,
    target: 450.00,
    low: 479.00,
    high: 649.95,
    lastChecked: "2m ago",
    history: buildHistory(649.95, 549.95, 90, 479, "up"),
    checks: 142,
  },
];

function buildHistory(start, end, days, low, trend) {
  // Deterministic-ish wobble between start and end with a dip to `low`
  const out = [];
  const today = new Date("2026-04-22T00:00:00Z");
  let rng = 42;
  const r = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
  for (let i = days; i >= 0; i--) {
    const t = 1 - (i / days);
    let base;
    if (trend === "down") base = start + (end - start) * (1 - Math.pow(1 - t, 2));
    else if (trend === "up") base = start + (end - start) * Math.pow(t, 1.4);
    else if (trend === "flat") base = start + (end - start) * t;
    else base = start + (end - start) * (0.5 - Math.cos(t * Math.PI * 1.6) * 0.5);
    // occasional dip near low
    if (i === Math.floor(days * 0.35) || i === Math.floor(days * 0.55)) {
      base = Math.max(low, base * 0.93);
    }
    const jitter = (r() - 0.5) * Math.max(2, start * 0.015);
    const price = Math.max(low, Math.min(start, base + jitter));
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out.push({ date: d.toISOString().slice(0,10), price: Math.round(price * 100) / 100 });
  }
  // Ensure last point is exactly `end`
  out[out.length - 1].price = end;
  return out;
}

function fmtMoney(n) {
  if (n == null || isNaN(n)) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function splitMoney(n) {
  const s = n.toFixed(2);
  const [d, c] = s.split(".");
  return { dollars: "$" + Number(d).toLocaleString("en-US"), cents: "." + c };
}
function pctChange(cur, prev) {
  if (!prev) return 0;
  return ((cur - prev) / prev) * 100;
}
function storeLabel(s) {
  return s === "amazon" ? "Amazon" : s === "target" ? "Target" : s === "ebay" ? "eBay" : s;
}

Object.assign(window, { SAMPLE_PRODUCTS, fmtMoney, splitMoney, pctChange, storeLabel });
