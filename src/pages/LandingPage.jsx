import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

/* GRAFT — single-screen landing. Blue palette only. No scroll on desktop. */

const C = {
  c50: "#EEF3FF",
  c100: "#DAE4FF",
  c200: "#BDD0FF",
  c300: "#90B4FF",
  c400: "#477EFF",
  c500: "#3563FC",
  c600: "#1F41F1",
  c700: "#172DDE",
  c800: "#1926B4",
  c900: "#1A278E",
  c950: "#151A56",
};

const HAIRLINE = "rgba(21,26,86,0.12)";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

.g-root { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.g-mono { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; }

@keyframes gFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes gRow  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes gLive { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

.g-fade { opacity: 0; animation: gFade .7s cubic-bezier(.2,.7,.2,1) forwards; }
.g-row  { animation: gRow .5s cubic-bezier(.2,.7,.2,1) both; }
.g-live { animation: gLive 2.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .g-fade, .g-row, .g-live { animation: none; opacity: 1; }
}
`;

/* ---------- visual-only transaction stream (no backend) ---------- */

const TYPES = ["MONEY TRANSFER", "WIRE TRANSFER", "ACCOUNT TRANSFER"];

const SEED = [
  { id: 20495, type: "WIRE TRANSFER", amount: 27400, risk: "MEDIUM", status: "REVIEW" },
  { id: 20494, type: "MONEY TRANSFER", amount: 91200, risk: "HIGH", status: "FLAGGED" },
  { id: 20493, type: "ACCOUNT TRANSFER", amount: 12800, risk: "LOW", status: "CLEAR" },
  { id: 20492, type: "WIRE TRANSFER", amount: 42600, risk: "MEDIUM", status: "REVIEW" },
  { id: 20491, type: "MONEY TRANSFER", amount: 85000, risk: "HIGH", status: "FLAGGED" },
];

const RISK = {
  HIGH: { bg: C.c700, fg: "#FFFFFF", bd: C.c700, status: "FLAGGED" },
  MEDIUM: { bg: C.c500, fg: "#FFFFFF", bd: C.c500, status: "REVIEW" },
  LOW: { bg: "transparent", fg: C.c800, bd: C.c800, status: "CLEAR" },
};

function makeTxn(id) {
  const r = Math.random();
  let amount =
    r < 0.34 ? 60000 + Math.random() * 45000 :
      r < 0.7 ? 25000 + Math.random() * 30000 :
        4000 + Math.random() * 18000;
  amount = Math.round(amount / 100) * 100;
  const risk = amount >= 60000 ? "HIGH" : amount >= 25000 ? "MEDIUM" : "LOW";
  return {
    id,
    type: TYPES[Math.floor(Math.random() * TYPES.length)],
    amount,
    risk,
    status: RISK[risk].status,
  };
}

const usd = (n) => "$" + n.toLocaleString("en-US");

/* ---------- parts ---------- */

function Intro() {
  return (
    <div className="g-fade max-w-[560px]">
      <div
        className="text-[10.5px] font-semibold uppercase"
        style={{ color: C.c900, letterSpacing: "0.24em" }}
      >
        Financial Intelligence
      </div>

      <h1
        className="mt-5 text-[clamp(30px,min(3vw,5.4vh),50px)] font-bold leading-[1.12]"
        style={{ color: C.c950, letterSpacing: "-0.028em" }}
      >
        Enterprise Fraud Detection
        <br className="hidden xl:block" /> &amp; Investigation Platform
      </h1>

      <p
        className="mt-5 max-w-[400px] text-[14.5px] leading-relaxed"
        style={{ color: C.c900 }}
      >
        Machine-learning powered fraud detection for suspicious financial transactions.
      </p>

      <Link
        to="/upload"
        className="mt-8 inline-flex items-center rounded-[8px] px-5 py-[11px] text-[11.5px] font-semibold uppercase text-white transition-colors duration-200"
        style={{ background: C.c600, letterSpacing: "0.14em" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = C.c700)}
        onMouseLeave={(e) => (e.currentTarget.style.background = C.c600)}
      >
        Get Started&nbsp;→
      </Link>
    </div>
  );
}

function Pill({ risk }) {
  const s = RISK[risk];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, letterSpacing: "0.1em" }}
    >
      {risk}
    </span>
  );
}

function Monitor() {
  const [rows, setRows] = useState(SEED);
  const next = useRef(20496);

  useEffect(() => {
    let t;
    const tick = () => {
      t = setTimeout(() => {
        const row = makeTxn(next.current++);
        setRows((prev) => [row, ...prev].slice(0, 5)); // always exactly 5
        tick();
      }, 3000 + Math.random() * 1000);
    };
    tick();
    return () => clearTimeout(t);
  }, []);

  const grid = "grid grid-cols-[1.35fr_1fr_1.15fr] gap-3";

  return (
    <div
      className="g-fade w-full max-w-[740px] rounded-[18px] p-4 lg:ml-auto"
      style={{
        background: C.c950,
        boxShadow: "0 10px 28px -16px rgba(21,26,86,0.4)",
        animationDelay: "0.15s",
      }}
    >
      <div className="flex items-center justify-between px-3 pb-4 pt-1.5">
        <span
          className="text-[13px] font-semibold uppercase"
          style={{ color: C.c100, letterSpacing: "0.2em" }}
        >
          Transaction Monitor
        </span>
        <span
          className="flex items-center gap-2 text-[11.5px] font-semibold uppercase"
          style={{ color: C.c300, letterSpacing: "0.18em" }}
        >
          <span
            className="g-live inline-block h-[7px] w-[7px] rounded-full"
            style={{ background: C.c400 }}
          />
          Live
        </span>
      </div>

      <div
        className={`${grid} px-5 pb-2.5 text-[11px] font-semibold uppercase`}
        style={{ color: C.c300, letterSpacing: "0.16em" }}
      >
        <span>TXN / Type</span>
        <span>Amount</span>
        <span>Risk / Status</span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`g-row ${grid} h-[clamp(56px,9.5vh,84px)] items-center rounded-[10px] px-5`}
            style={{ background: C.c100, color: C.c950 }}
          >
            <div className="min-w-0">
              <div className="g-mono truncate text-[15px] font-semibold">TXN-{r.id}</div>
              <div
                className="mt-1 truncate text-[11px] font-medium uppercase"
                style={{ color: C.c900, letterSpacing: "0.1em" }}
              >
                {r.type}
              </div>
            </div>

            <div className="g-mono text-[17px] font-semibold">{usd(r.amount)}</div>

            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
              <Pill risk={r.risk} />
              <span
                className="text-[11px] font-semibold uppercase"
                style={{ color: C.c900, letterSpacing: "0.12em" }}
              >
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpis() {
  const items = [
    { v: "248", l: "Transactions" },
    { v: "42", l: "High Risk" },
    { v: "1,284", l: "Monitored" },
    { v: "17", l: "Escalated" },
  ];
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 px-5 pb-6 sm:px-8 lg:grid-cols-4 xl:px-14">
      {items.map((k, i) => (
        <div
          key={k.l}
          className="g-fade rounded-[10px] px-4 py-3"
          style={{
            background: C.c100,
            border: `1px solid ${C.c200}`,
            animationDelay: `${0.35 + i * 0.06}s`,
          }}
        >
          <div
            className="g-mono text-[22px] font-semibold leading-none"
            style={{ color: C.c950 }}
          >
            {k.v}
          </div>
          <div
            className="mt-2 text-[9.5px] font-semibold uppercase"
            style={{ color: C.c900, letterSpacing: "0.16em" }}
          >
            {k.l}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- page ---------- */

export default function LandingPage() {
  return (
    <div
      className="g-root flex min-h-screen w-full flex-col bg-[#EEF3FF] text-[#151A56]"
    >
      <style>{css}</style>
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col px-6 py-6 sm:px-10 lg:px-14">
        {/* Hero Section */}
        <section className="grid grid-cols-1 items-center gap-10 py-6 lg:grid-cols-[1.1fr_1.3fr] lg:gap-12">
          <div className="g-fade max-w-[580px]">
            <div
              className="text-[12px] font-extrabold uppercase tracking-widest text-[#2563EB]"
            >
              FINANCIAL INTELLIGENCE SUITE
            </div>

            <h1
              className="mt-3 text-[36px] sm:text-[46px] font-black uppercase tracking-tight text-[#151A56] leading-[1.08]"
              style={{ letterSpacing: "-0.02em" }}
            >
              ENTERPRISE FRAUD DETECTION &amp; INVESTIGATION
            </h1>

            <p
              className="mt-4 max-w-[480px] text-[15px] font-medium leading-relaxed text-[#334155]"
            >
              Tri-model machine learning architecture combining XGBoost, Deep MLP, and Edge-Graph Neural Networks to detect complex financial crime, layering, and mule account clusters.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A] hover:bg-[#172E6D] px-8 py-3 text-[13.5px] font-bold text-white shadow-md transition-all duration-200"
              >
                Launch Ingestion Pipeline →
              </Link>

              <Link
                to="/investigation"
                className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-[#EEF3FF] px-6 py-3 text-[13.5px] font-bold text-[#1E3A8A] border border-[#CBD5E1] transition-all duration-200"
              >
                Inspect Sample Case
              </Link>
            </div>
          </div>

          <Monitor />
        </section>

        {/* Model Architecture Triad */}
        <section className="mt-10 py-4">
          <div className="mb-4">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#475569]">
              CORE DETECTION ARCHITECTURE
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[14px] border border-[#CBD5E1]/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="h-3 w-3 rounded-sm bg-[#1A2C40]" />
                <span className="font-mono text-[11px] font-bold text-[#1A2C40]">98.2% ACCURACY</span>
              </div>
              <h3 className="mt-2 text-[15px] font-extrabold text-[#1E3A8A]">XGBoost Model</h3>
              <p className="mt-1 text-[12.5px] text-[#475569] leading-normal">
                Gradient boosted decision trees optimized for high-velocity transaction tabular metrics and anomalous velocity bursts.
              </p>
            </div>

            <div className="rounded-[14px] border border-[#CBD5E1]/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="h-3 w-3 rounded-sm bg-[#1A2C40]" />
                <span className="font-mono text-[11px] font-bold text-[#1A2C40]">97.4% ACCURACY</span>
              </div>
              <h3 className="mt-2 text-[15px] font-extrabold text-[#1E3A8A]">Deep MLP Network</h3>
              <p className="mt-1 text-[12.5px] text-[#475569] leading-normal">
                Non-linear feedforward neural network generating high-dimensional latent account embeddings and risk boundaries.
              </p>
            </div>

            <div className="rounded-[14px] border border-[#CBD5E1]/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="h-3 w-3 rounded-sm bg-[#1A2C40]" />
                <span className="font-mono text-[11px] font-bold text-[#1A2C40]">98.8% ACCURACY (BEST)</span>
              </div>
              <h3 className="mt-2 text-[15px] font-extrabold text-[#1E3A8A]">Edge-GNN Architecture</h3>
              <p className="mt-1 text-[12.5px] text-[#475569] leading-normal">
                Inductive graph neural network with edge attention for detecting circular layering loops and coordinated mule rings.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <div className="mt-8 pb-8">
          <Kpis />
        </div>
      </main>
    </div>
  );
}

