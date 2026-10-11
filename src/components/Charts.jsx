import React, { useState } from "react";
import { colorFor, pct, num } from "../lib/modelData";

const C = {
  c50: "#EEF3FF", c100: "#DAE4FF", c200: "#BDD0FF", c300: "#90B4FF", c400: "#3B82F6",
  c500: "#2563EB", c600: "#1E3A8A", c700: "#172E6D", c800: "#1E3A8A", c900: "#1E3A8A", c950: "#1E3A8A",
};

const chartCss = `
@keyframes rocDraw {
  from { stroke-dashoffset: 600; }
  to { stroke-dashoffset: 0; }
}
@keyframes barGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.roc-line {
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  animation: rocDraw 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.bar-fill {
  transform-origin: left;
  animation: barGrow 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

export function Legend({ models = [] }) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 text-[11px]">
      {models.map((m, i) => (
        <div key={m.key || i} className="flex items-center gap-2 font-semibold transition-transform duration-200 hover:scale-105" style={{ color: C.c950 }}>
          <span className="inline-block h-3 w-3 rounded-[4px] shadow-sm" style={{ background: colorFor(i) }} />
          {m.name}
        </div>
      ))}
    </div>
  );
}

export function SampleTag() {
  return null;
}

export function MetricBars({ models = [] }) {
  const metrics = [
    { key: "accuracy", label: "Accuracy" },
    { key: "precision", label: "Precision" },
    { key: "recall", label: "Recall" },
    { key: "f1", label: "F1 Score" },
    { key: "auc", label: "AUC" },
  ];

  return (
    <div className="space-y-4 pt-1">
      <style>{chartCss}</style>
      {metrics.map((metric, idx) => (
        <div key={metric.key} className="group space-y-1.5 rounded-lg p-2 transition-colors duration-200 hover:bg-white/60">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider" style={{ color: C.c900 }}>
            <span>{metric.label}</span>
          </div>
          <div className="space-y-1.5">
            {models.map((m, i) => {
              const val = m[metric.key] ?? 0;
              return (
                <div key={m.key || i} className="flex items-center gap-2.5">
                  <span className="w-20 truncate text-[11px] font-semibold" style={{ color: C.c950 }}>
                    {m.name}
                  </span>
                  <div className="relative flex-1 h-2.5 rounded-full overflow-hidden shadow-inner" style={{ background: C.c100 }}>
                    <div
                      className="bar-fill h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                      style={{
                        width: `${Math.min(100, Math.max(0, val * 100))}%`,
                        background: colorFor(i),
                        animationDelay: `${0.1 + idx * 0.08 + i * 0.05}s`,
                      }}
                    />
                  </div>
                  <span className="i-mono w-12 text-right text-[11.5px] font-bold" style={{ color: C.c950 }}>
                    {pct(val, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RocChart({ models = [], expanded = false }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const width = expanded ? 560 : 320;
  const height = expanded ? 240 : 220;
  const padding = 34;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const toCoords = (fpr, tpr) => {
    const x = padding + fpr * graphWidth;
    const y = height - padding - tpr * graphHeight;
    return { x, y };
  };

  return (
    <div className="relative flex flex-col items-center">
      <style>{chartCss}</style>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none drop-shadow-sm">
        {/* Subtle grid background fill */}
        <rect x={padding} y={padding} width={graphWidth} height={graphHeight} fill={C.c50} rx="8" />

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
          const y = height - padding - v * graphHeight;
          const x = padding + v * graphWidth;
          return (
            <g key={v}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke={C.c200} strokeWidth="1" strokeDasharray="3 3" />
              <line x1={x} y1={padding} x2={x} y2={height - padding} stroke={C.c200} strokeWidth="1" strokeDasharray="3 3" />
              <text x={padding - 6} y={y + 3} textAnchor="end" className="i-mono text-[8.5px] font-medium" style={{ fill: C.c900 }}>
                {v.toFixed(2)}
              </text>
              <text x={x} y={height - padding + 14} textAnchor="middle" className="i-mono text-[8.5px] font-medium" style={{ fill: C.c900 }}>
                {v.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Diagonal random baseline */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={padding}
          stroke={C.c400}
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Dynamic Animated ROC Lines */}
        {models.map((m, i) => {
          const roc = m.roc || [
            { fpr: 0, tpr: 0 },
            { fpr: 0.05, tpr: 0.8 },
            { fpr: 1, tpr: 1 },
          ];
          const pts = roc.map((p) => toCoords(p.fpr, p.tpr));
          const pointsStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

          return (
            <g key={m.key || i}>
              {/* Dynamic Path with entrance animation */}
              <polyline
                fill="none"
                stroke={colorFor(i)}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsStr}
                className="roc-line cursor-pointer filter drop-shadow"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
              {/* Hover nodes */}
              {pts.map((pt, pIdx) => (
                <circle
                  key={pIdx}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#FFFFFF"
                  stroke={colorFor(i)}
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200 hover:r-6 hover:fill-current"
                  onMouseEnter={() =>
                    setActiveTooltip({
                      name: m.name,
                      fpr: roc[pIdx].fpr,
                      tpr: roc[pIdx].tpr,
                      x: pt.x,
                      y: pt.y,
                      color: colorFor(i),
                    })
                  }
                  onMouseLeave={() => setActiveTooltip(null)}
                />
              ))}
            </g>
          );
        })}

        {/* Axis Titles */}
        <text x={width / 2} y={height + 6} textAnchor="middle" className="text-[9.5px] font-bold uppercase tracking-wider" style={{ fill: C.c900 }}>
          False Positive Rate (FPR)
        </text>
        <text
          x={-height / 2}
          y="10"
          transform="rotate(-90)"
          textAnchor="middle"
          className="text-[9.5px] font-bold uppercase tracking-wider"
          style={{ fill: C.c900 }}
        >
          True Positive Rate (TPR)
        </text>
      </svg>

      {/* Interactive Tooltip Card */}
      {activeTooltip && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xl backdrop-blur-md transition-opacity duration-150"
          style={{
            left: `${activeTooltip.x}px`,
            top: `${activeTooltip.y - 42}px`,
            background: C.c950,
            border: `1px solid ${activeTooltip.color}`,
          }}
        >
          <div className="flex items-center gap-1.5" style={{ color: activeTooltip.color }}>
            ● {activeTooltip.name}
          </div>
          <div className="i-mono text-[10px] text-slate-200">
            FPR: {(activeTooltip.fpr * 100).toFixed(1)}% | TPR: {(activeTooltip.tpr * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

export function SplitBars({ models = [] }) {
  return (
    <div className="space-y-4 pt-1">
      {models.map((m, i) => {
        const total = (m.processed || (m.flagged + m.clear)) || 1;
        const fraudPct = ((m.flagged || 0) / total) * 100;
        const clearPct = 100 - fraudPct;

        return (
          <div key={m.key || i} className="group space-y-1.5 rounded-lg p-2 transition-all duration-200 hover:bg-white/60">
            <div className="flex items-center justify-between text-[11.5px] font-bold">
              <span className="flex items-center gap-2" style={{ color: C.c950 }}>
                <span className="h-3 w-3 rounded-[3px] shadow-sm" style={{ background: colorFor(i) }} />
                {m.name}
              </span>
              <span className="i-mono text-[11px] font-medium" style={{ color: C.c900 }}>
                {num(m.processed)} accounts
              </span>
            </div>

            <div className="h-5 w-full rounded-md overflow-hidden flex shadow-inner p-0.5" style={{ background: C.c100 }}>
              <div
                className="h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700 rounded-l group-hover:brightness-110"
                style={{ width: `${Math.max(fraudPct, 5)}%`, background: C.c700 }}
                title={`Flagged Fraud: ${num(m.flagged)} (${fraudPct.toFixed(1)}%)`}
              >
                {fraudPct > 8 && `${fraudPct.toFixed(1)}%`}
              </div>
              <div
                className="h-full flex items-center justify-center text-[10px] font-bold text-slate-800 transition-all duration-700 rounded-r group-hover:bg-opacity-90"
                style={{ width: `${clearPct}%`, background: C.c200 }}
                title={`Not Fraud: ${num(m.clear)} (${clearPct.toFixed(1)}%)`}
              >
                {clearPct > 15 && `${clearPct.toFixed(1)}%`}
              </div>
            </div>

            <div className="flex justify-between text-[10.5px] font-medium" style={{ color: C.c900 }}>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.c700 }} /> Fraud: {num(m.flagged)}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.c300 }} /> Not Fraud: {num(m.clear)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ConfusionMatrix({ model }) {
  if (!model) return null;
  const tp = model.tp ?? 1042;
  const fp = model.fp ?? 69;
  const fn = model.fn ?? 100;
  const tn = model.tn ?? 11269;
  const total = tp + fp + fn + tn;

  return (
    <div
      className="rounded-[12px] p-4.5 transition-all duration-300 hover:shadow-md"
      style={{ background: C.c50, border: `1px solid ${C.c200}` }}
    >
      <div className="flex items-center justify-between mb-3.5 pb-2" style={{ borderBottom: `1px solid ${C.c200}` }}>
        <span className="text-[13px] font-bold" style={{ color: C.c950 }}>
          {model.name} Confusion Matrix
        </span>
        <span className="i-mono text-[11px] font-medium px-2 py-0.5 rounded" style={{ background: C.c100, color: C.c900 }}>
          Total: {num(total)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-center">
        <div
          className="rounded-lg p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: "#FFFFFF", border: `1.5px solid ${C.c700}` }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.c900 }}>
            True Positives (TP)
          </div>
          <div className="i-mono text-[20px] font-bold mt-1" style={{ color: C.c700 }}>
            {num(tp)}
          </div>
          <div className="text-[10.5px] font-semibold mt-0.5" style={{ color: C.c800 }}>
            {pct(tp / (tp + fn || 1), 1)} Recall
          </div>
        </div>

        <div
          className="rounded-lg p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: "#FFFFFF", border: `1px solid ${C.c200}` }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.c900 }}>
            False Positives (FP)
          </div>
          <div className="i-mono text-[20px] font-bold mt-1" style={{ color: C.c950 }}>
            {num(fp)}
          </div>
          <div className="text-[10.5px] font-medium mt-0.5" style={{ color: C.c900 }}>
            Type I Error
          </div>
        </div>

        <div
          className="rounded-lg p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: "#FFFFFF", border: `1px solid ${C.c200}` }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.c900 }}>
            False Negatives (FN)
          </div>
          <div className="i-mono text-[20px] font-bold mt-1" style={{ color: C.c950 }}>
            {num(fn)}
          </div>
          <div className="text-[10.5px] font-medium mt-0.5" style={{ color: C.c900 }}>
            Type II Error
          </div>
        </div>

        <div
          className="rounded-lg p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: "#FFFFFF", border: `1.5px solid ${C.c600}` }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.c900 }}>
            True Negatives (TN)
          </div>
          <div className="i-mono text-[20px] font-bold mt-1" style={{ color: C.c600 }}>
            {num(tn)}
          </div>
          <div className="text-[10.5px] font-semibold mt-0.5" style={{ color: C.c800 }}>
            {pct(tn / (tn + fp || 1), 1)} Specificity
          </div>
        </div>
      </div>
    </div>
  );
}
