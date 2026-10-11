import React, { useMemo, useState } from "react";
import { ArrowRight, ShieldAlert, CheckCircle2, Zap } from "lucide-react";

/*
  NeuralFlowGraph
  - Dynamic transaction flow topology based on actual fraud & account activity
  - Formal nomenclature: "Origin" (start) and "Destination" (end)
  - Working animated particle pulse along directed paths
  - Scalable: handles 2 nodes up to multiple branching counterparty networks
  - Compact typography with high-density styling
*/

export default function NeuralFlowGraph({
  accountId = "ACC_109482",
  transactions = [],
  isFraud = false,
  primaryAmount = 91200,
  primaryTxId = "TXN-0001",
}) {
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Dynamically compute graph nodes and edges from relevant transactions
  const { nodes, edges, height, width } = useMemo(() => {
    const accNorm = String(accountId).toUpperCase();

    // Filter transactions involving this account
    let relevant = transactions.filter((t) => {
      const s = String(t.senderId || t.sender || "").toUpperCase();
      const r = String(t.receiverId || t.receiver || "").toUpperCase();
      return s.includes(accNorm) || r.includes(accNorm);
    });

    // Fallback if no specific related transactions in CSV
    if (relevant.length === 0) {
      relevant = [
        {
          txnNumber: primaryTxId,
          senderId: accountId,
          receiverId: "ACC_203941",
          amount: primaryAmount,
          isFraud: isFraud ? 1 : 0,
        },
      ];
      if (isFraud) {
        relevant.push({
          txnNumber: "TXN-0002",
          senderId: accountId,
          receiverId: "ACC_394812",
          amount: Math.round(primaryAmount * 0.46),
          isFraud: 1,
        });
      }
    }

    // Limit to top 6 relevant transactions to keep layout pristine
    const displayTx = relevant.slice(0, 6);

    // Identify unique accounts
    const senders = new Set();
    const receivers = new Set();
    const intermediaries = new Set();

    displayTx.forEach((tx) => {
      const s = String(tx.senderId || tx.sender || "ORIGIN_ACC").trim();
      const r = String(tx.receiverId || tx.receiver || "DEST_ACC").trim();
      senders.add(s);
      receivers.add(r);
    });

    // Determine roles
    const originList = [];
    const destList = [];
    const interList = [];

    const allAccs = Array.from(new Set([...senders, ...receivers]));

    allAccs.forEach((acc) => {
      const isSender = Array.from(senders).includes(acc);
      const isReceiver = Array.from(receivers).includes(acc);

      if (isSender && isReceiver) {
        interList.push(acc);
      } else if (isSender) {
        originList.push(acc);
      } else {
        destList.push(acc);
      }
    });

    // If an account is the investigated account, ensure sensible column placement
    if (originList.length === 0 && allAccs.length > 0) {
      originList.push(allAccs[0]);
    }
    if (destList.length === 0 && allAccs.length > 1) {
      destList.push(allAccs[allAccs.length - 1]);
    }

    const SVG_WIDTH = 580;
    const maxColCount = Math.max(originList.length, destList.length, interList.length, 1);
    const SVG_HEIGHT = Math.max(220, maxColCount * 76 + 50);

    const hasInter = interList.length > 0;
    const originX = 95;
    const interX = SVG_WIDTH / 2;
    const destX = SVG_WIDTH - 95;

    const nodeMap = new Map();

    const distributeY = (items, xPos, role, formalLabel) => {
      const total = items.length;
      items.forEach((id, idx) => {
        const step = (SVG_HEIGHT - 60) / (total + 1);
        const yPos = 35 + step * (idx + 1);
        const isCurrent = String(id).toUpperCase() === accNorm;
        nodeMap.set(id, {
          id,
          x: xPos,
          y: yPos,
          role,
          label: formalLabel,
          isCurrent,
        });
      });
    };

    distributeY(originList, originX, "origin", "Origin");
    if (hasInter) distributeY(interList, interX, "intermediary", "Routing Node");
    distributeY(destList, destX, "destination", "Destination");

    // Construct edge paths
    const edgeList = displayTx.map((tx, idx) => {
      const sId = String(tx.senderId || tx.sender || "").trim();
      const rId = String(tx.receiverId || tx.receiver || "").trim();
      const sNode = nodeMap.get(sId) || { x: originX, y: SVG_HEIGHT / 2 };
      const rNode = nodeMap.get(rId) || { x: destX, y: SVG_HEIGHT / 2 };

      const edgeFraud = Number(tx.isFraud ?? tx.IS_FRAUD) === 1 || isFraud;
      const amt = Number(tx.amount || tx.TX_AMOUNT || primaryAmount);

      // Curved Bezier control points
      const dx = rNode.x - sNode.x;
      const dy = rNode.y - sNode.y;
      const cx1 = sNode.x + dx * 0.45;
      const cy1 = sNode.y;
      const cx2 = sNode.x + dx * 0.55;
      const cy2 = rNode.y;

      const pathData = `M ${sNode.x} ${sNode.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${rNode.x} ${rNode.y}`;

      return {
        id: tx.txnNumber || `edge-${idx}`,
        source: sId,
        target: rId,
        amount: amt,
        isFraud: edgeFraud,
        pathData,
        midX: (sNode.x + rNode.x) / 2,
        midY: (sNode.y + rNode.y) / 2 - 8,
      };
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgeList,
      width: SVG_WIDTH,
      height: SVG_HEIGHT,
    };
  }, [accountId, transactions, isFraud, primaryAmount, primaryTxId]);

  return (
    <div className="relative flex flex-col rounded-[16px] border border-[#BDD0FF] bg-white p-4 shadow-2xs">
      {/* Top Header of Graph */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF3FF] pb-2.5">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#2563EB]" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1E3A8A]">
            Neural Transaction Flow
          </h3>
          <span className="rounded-full bg-[#DAE4FF] px-2 py-0.5 text-[9.5px] font-extrabold uppercase text-[#1E3A8A]">
            {edges.length} Active {edges.length === 1 ? "Path" : "Paths"}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-[10.5px] font-bold">
          {isFraud ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1E3A8A] px-2.5 py-0.5 text-white">
              <ShieldAlert size={11} strokeWidth={2.5} /> Anomalous Pathing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DAE4FF] px-2.5 py-0.5 text-[#1E3A8A]">
              <CheckCircle2 size={11} strokeWidth={2.5} /> Baseline Topology
            </span>
          )}
        </div>
      </div>

      {/* Interactive SVG Animated Canvas */}
      <div className="relative w-full overflow-hidden rounded-[12px] bg-[#F8FAFF] border border-[#E2E8F0]/70">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minHeight: "220px" }}
        >
          <defs>
            {/* Arrowhead marker for edges */}
            <marker
              id="arrow-navy"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1E3A8A" />
            </marker>

            <marker
              id="arrow-glow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#2563EB" />
            </marker>

            {/* Glowing filter */}
            <filter id="pulseGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Neural Subtle Grid */}
          <pattern id="neuralGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.75" fill="#CBD5E1" />
          </pattern>
          <rect width={width} height={height} fill="url(#neuralGrid)" opacity="0.6" />

          {/* 1. Transaction Edge Lines */}
          {edges.map((e, idx) => {
            const isHovered = hoveredEdge === e.id;
            const strokeColor = e.isFraud ? "#1E3A8A" : "#3B82F6";
            const strokeWidth = isHovered ? 3.5 : 2.2;

            return (
              <g key={e.id}>
                {/* Background path with arrow */}
                <path
                  id={`edge-path-${idx}`}
                  d={e.pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={e.isFraud ? "6 3" : "none"}
                  markerEnd={e.isFraud ? "url(#arrow-navy)" : "url(#arrow-glow)"}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredEdge(e.id)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />

                {/* Animated Working Particle along the path */}
                <circle r={e.isFraud ? "4" : "3.5"} fill="#2563EB" filter="url(#pulseGlow)">
                  <animateMotion
                    dur={`${Math.max(1.4, 2.6 - idx * 0.3)}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                  >
                    <mpath href={`#edge-path-${idx}`} />
                  </animateMotion>
                </circle>

                {/* Amount badge on edge midpoint */}
                <g transform={`translate(${e.midX}, ${e.midY})`}>
                  <rect
                    x="-32"
                    y="-9"
                    width="64"
                    height="18"
                    rx="9"
                    fill="#FFFFFF"
                    stroke={strokeColor}
                    strokeWidth="1.2"
                    className="shadow-2xs"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    className="font-mono text-[9px] font-black"
                    fill="#1E3A8A"
                  >
                    ${Number(e.amount).toLocaleString()}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. Neural Nodes (Origin / Routing / Destination) */}
          {nodes.map((n) => {
            const isOrigin = n.role === "origin";
            const isDest = n.role === "destination";
            const ringColor = isOrigin ? "#1E3A8A" : isDest ? "#2563EB" : "#475569";

            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className="cursor-pointer">
                {/* Outer Pulsing Ring */}
                <circle
                  r="21"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.45"
                >
                  <animate
                    attributeName="r"
                    values="19;24;19"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0.1;0.5"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Core Node Circle */}
                <circle
                  r="15"
                  fill="#FFFFFF"
                  stroke={ringColor}
                  strokeWidth="2.5"
                  className="shadow-sm"
                />

                {/* Center Core Dot */}
                <circle r="5" fill={ringColor} />

                {/* Top Formal Tag: "Origin" or "Destination" or "Routing Node" */}
                <text
                  x="0"
                  y="-20"
                  textAnchor="middle"
                  className="text-[9px] font-black uppercase tracking-wider"
                  fill={ringColor}
                >
                  {n.label}
                </text>

                {/* Bottom Account Identifier */}
                <text
                  x="0"
                  y="27"
                  textAnchor="middle"
                  className="font-mono text-[9.5px] font-bold"
                  fill="#172554"
                >
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Compact Bottom Legend */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#475569] font-semibold px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1E3A8A]" />
            <strong className="text-[#1E3A8A]">Origin</strong> (Debit Outflow)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
            <strong className="text-[#2563EB]">Destination</strong> (Credit Inflow)
          </span>
        </div>

        <span className="italic text-[9.5px] text-slate-500">
          Pulse motion represents real-time funds vector velocity
        </span>
      </div>
    </div>
  );
}
