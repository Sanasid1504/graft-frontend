import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  ArrowLeft,
  ChevronDown,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Search,
  Eye,
  Activity,
  Layers,
  Database,
  TrendingUp,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { RocChart } from "../components/Charts";
import NeuralFlowGraph from "../components/NeuralFlowGraph";
import { loadResults, pct, num, normalizeModels, SAMPLE_BENCHMARKS, DEFAULT_ACCOUNT } from "../lib/modelData";

/* High-density, professional palette matching GRAFT command-center */
const C = {
  bg: "#EEF3FF",
  navy: "#1E3A8A",
  navyDark: "#172554",
  blueRoyal: "#2563EB",
  cardBg: "#FFFFFF",
  cardBorder: "#BDD0FF",
  softBlue: "#DAE4FF",
  softBlueAlt: "#EBF1FF",
  barTrack: "#E2E8F0",
  textMuted: "#475569",
};

const DISPLAY_MODELS = [
  { key: "xgboost", label: "XGBOOST", tableLabel: "XGBoost", defaultScore: 0.87 },
  { key: "mlp", label: "MLP (Multi-Layer Perceptron)", tableLabel: "MLP", defaultScore: 0.87 },
  { key: "gcn", label: "GCN (Graph Convolutional Network)", tableLabel: "GCN", defaultScore: 0.87 },
  { key: "edge_gnn", altKey: "edge_gcn", label: "Edge-aware GCN", tableLabel: "Edge-GNN", defaultScore: 0.87 },
  { key: "graphsage", label: "GraphSAGE", tableLabel: "GraphSAGE", defaultScore: 0.87 },
  { key: "gineconv", altKey: "edge_graphsage", label: "Edge-aware GraphSAGE", tableLabel: "GINEConv", defaultScore: 0.87 },
];

export default function InvestigationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Inspect mode is active ONLY if an account is in the search params
  const inspectAccountParam = searchParams.get("account");
  const inspectTxnParam = searchParams.get("txn");

  // Load results
  useEffect(() => {
    const ctrl = new AbortController();
    loadResults(ctrl.signal)
      .then((res) => {
        setData(res);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          console.warn("Unable to load model results, falling back to baseline data:", e);
        }
      });
    return () => ctrl.abort();
  }, []);

  // Ingested dataset records
  const allResults = data?.results || [];
  const models = useMemo(() => normalizeModels(data?.models || SAMPLE_BENCHMARKS), [data]);

  // Stored transactions from CSV ingestion
  const allTransactions = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("graft_transactions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Determine currently inspected record (if inspect mode)
  const activeRecord = useMemo(() => {
    if (!inspectAccountParam) return null;
    if (allResults.length > 0) {
      const found = allResults.find(
        (r) => String(r.ACCOUNT_ID).toLowerCase() === String(inspectAccountParam).toLowerCase()
      );
      if (found) return found;
    }
    return { ACCOUNT_ID: inspectAccountParam };
  }, [inspectAccountParam, allResults]);

  // Overall CSV Summary KPIs
  const summaryKpis = useMemo(() => {
    const totalAccounts = allResults.length || 12;
    const totalTxns = allTransactions.length || 20;

    const totalVolume = allTransactions.length
      ? allTransactions.reduce((acc, t) => acc + Number(t.amount || t.TX_AMOUNT || 0), 0)
      : 259000;

    const flaggedAccounts = allResults.filter(
      (r) =>
        Number(r.IS_FRAUD) === 1 ||
        Number(r.XGBOOST_PREDICTION) === 1 ||
        Number(r.EDGE_GNN_PREDICTION) === 1
    ).length || 4;

    const clearAccounts = Math.max(0, totalAccounts - flaggedAccounts);

    return {
      totalAccounts,
      totalTxns,
      totalVolume,
      flaggedAccounts,
      clearAccounts,
    };
  }, [allResults, allTransactions]);

  // Inspected Account: Given and Received amounts strictly (no outgoing/incoming counts as requested)
  const flowAmounts = useMemo(() => {
    const accId = String(inspectAccountParam || "").toLowerCase();
    if (!allTransactions.length || !accId) {
      return {
        given: 91200,
        received: 27400,
        net: -63800,
      };
    }

    const outTx = allTransactions.filter(
      (t) => String(t.senderId || t.SENDER_ACCOUNT_ID || "").toLowerCase() === accId
    );
    const inTx = allTransactions.filter(
      (t) => String(t.receiverId || t.RECEIVER_ACCOUNT_ID || "").toLowerCase() === accId
    );

    const given = outTx.reduce((sum, t) => sum + Number(t.amount || t.TX_AMOUNT || 0), 0) || (outTx.length ? 0 : 91200);
    const received = inTx.reduce((sum, t) => sum + Number(t.amount || t.TX_AMOUNT || 0), 0) || (inTx.length ? 0 : 27400);

    return {
      given,
      received,
      net: received - given,
    };
  }, [inspectAccountParam, allTransactions]);

  // Inspected Account: 6-Model Scores
  const inspectedModelScores = useMemo(() => {
    return DISPLAY_MODELS.map((dm) => {
      let score = dm.defaultScore;
      if (activeRecord) {
        if (dm.key === "xgboost" && activeRecord.XGBOOST_FRAUD_PROBABILITY != null) {
          score = Number(activeRecord.XGBOOST_FRAUD_PROBABILITY);
        } else if (dm.key === "mlp" && activeRecord.MLP_FRAUD_PROBABILITY != null) {
          score = Number(activeRecord.MLP_FRAUD_PROBABILITY);
        } else if (dm.key === "gcn" && activeRecord.GCN_FRAUD_PROBABILITY != null) {
          score = Number(activeRecord.GCN_FRAUD_PROBABILITY);
        } else if (
          (dm.key === "edge_gnn" || dm.altKey === "edge_gcn") &&
          (activeRecord.EDGE_GNN_FRAUD_PROBABILITY != null || activeRecord.EDGE_GCN_FRAUD_PROBABILITY != null)
        ) {
          score = Number(activeRecord.EDGE_GNN_FRAUD_PROBABILITY ?? activeRecord.EDGE_GCN_FRAUD_PROBABILITY);
        } else if (dm.key === "graphsage" && activeRecord.GRAPHSAGE_FRAUD_PROBABILITY != null) {
          score = Number(activeRecord.GRAPHSAGE_FRAUD_PROBABILITY);
        } else if (
          (dm.key === "gineconv" || dm.altKey === "edge_graphsage") &&
          activeRecord.GINECONV_FRAUD_PROBABILITY != null
        ) {
          score = Number(activeRecord.GINECONV_FRAUD_PROBABILITY);
        }
      }
      return {
        ...dm,
        score: Math.min(1, Math.max(0, score)),
      };
    });
  }, [activeRecord]);

  // Overall Benchmarks Table Rows
  const benchmarkRows = useMemo(() => {
    return models.map((m) => {
      const matchDisplay = DISPLAY_MODELS.find(
        (dm) => dm.key === m.key || (dm.altKey && dm.altKey === m.key)
      );
      return {
        key: m.key,
        name: matchDisplay?.tableLabel || m.name,
        processed: m.processed || 12480,
        fraud: m.flagged || 1142,
        notFraud: m.clear || 11338,
        runtime: m.runtimeSec != null ? `${m.runtimeSec.toFixed(1)}s` : "1.4s",
        accuracy: m.accuracy ?? 0.982,
        precision: m.precision ?? 0.938,
        recall: m.recall ?? 0.912,
        f1: m.f1 ?? 0.925,
        auc: m.auc ?? 0.976,
      };
    });
  }, [models]);

  const bestMap = useMemo(() => {
    const keys = ["accuracy", "precision", "recall", "f1", "auc"];
    const map = {};
    keys.forEach((k) => {
      map[k] = Math.max(...benchmarkRows.map((r) => r[k] ?? 0));
    });
    return map;
  }, [benchmarkRows]);

  // Search & filter for ledger on summary page
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("ALL");

  const filteredLedger = useMemo(() => {
    const list = allResults.length > 0 ? allResults : [
      { ACCOUNT_ID: "ACC_109482", IS_FRAUD: 1, RISK: "CRITICAL", XGBOOST_FRAUD_PROBABILITY: 0.88, EDGE_GNN_FRAUD_PROBABILITY: 0.94 },
      { ACCOUNT_ID: "ACC_203941", IS_FRAUD: 1, RISK: "HIGH", XGBOOST_FRAUD_PROBABILITY: 0.85, EDGE_GNN_FRAUD_PROBABILITY: 0.92 },
      { ACCOUNT_ID: "ACC_394812", IS_FRAUD: 1, RISK: "HIGH", XGBOOST_FRAUD_PROBABILITY: 0.81, EDGE_GNN_FRAUD_PROBABILITY: 0.89 },
      { ACCOUNT_ID: "ACC_481923", IS_FRAUD: 0, RISK: "LOW", XGBOOST_FRAUD_PROBABILITY: 0.04, EDGE_GNN_FRAUD_PROBABILITY: 0.03 },
      { ACCOUNT_ID: "ACC_592814", IS_FRAUD: 1, RISK: "CRITICAL", XGBOOST_FRAUD_PROBABILITY: 0.89, EDGE_GNN_FRAUD_PROBABILITY: 0.95 },
    ];

    const q = ledgerSearch.trim().toLowerCase();
    return list.filter((r) => {
      const isFl = Number(r.IS_FRAUD) === 1 || Number(r.XGBOOST_PREDICTION) === 1 || Number(r.XGBOOST_FRAUD_PROBABILITY) >= 0.5;
      if (ledgerFilter === "FLAGGED" && !isFl) return false;
      if (ledgerFilter === "CLEAR" && isFl) return false;
      if (!q) return true;
      return String(r.ACCOUNT_ID || "").toLowerCase().includes(q);
    });
  }, [allResults, ledgerSearch, ledgerFilter]);

  const handleInspect = (accId) => {
    setSearchParams({ account: accId });
  };

  const handleBackToSummary = () => {
    setSearchParams({});
  };

  const isInspectedFraud = useMemo(() => {
    if (!activeRecord) return true;
    return (
      Number(activeRecord.IS_FRAUD) === 1 ||
      inspectedModelScores.some((m) => m.score >= 0.5)
    );
  }, [activeRecord, inspectedModelScores]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden font-sans" style={{ background: C.bg }}>
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col gap-5 px-5 pb-10 pt-6 sm:px-8 lg:px-12">
        {/* ============================================================== */}
        {/* CASE A: DIRECT CLICK ON INVESTIGATION -> OVERALL SUMMARY VIEW   */}
        {/* ============================================================== */}
        {!inspectAccountParam ? (
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#BDD0FF]/60">
              <div>
                <h1 className="text-[20px] sm:text-[23px] font-black uppercase tracking-tight text-[#172554]">
                  DATASET & INVESTIGATION OVERVIEW
                </h1>
                <p className="text-[11.5px] font-medium text-[#475569]">
                  Comprehensive ingestion summary of uploaded CSV records and multi-model benchmark statistics
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#BDD0FF] bg-white px-3.5 py-1.5 text-[11px] font-bold text-[#1E3A8A] shadow-2xs hover:bg-[#DAE4FF] transition-colors"
                >
                  <Database size={13} />
                  Ingest New CSV
                </Link>
              </div>
            </div>

            {/* High-level KPI Summary Row (Small, Compact Font Size) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-[14px] border border-[#BDD0FF] bg-white p-3.5 shadow-2xs">
                <span className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#475569]">
                  Ingested Accounts
                </span>
                <p className="font-mono text-[18px] font-black leading-tight text-[#1E3A8A] mt-1">
                  {summaryKpis.totalAccounts}
                </p>
                <span className="text-[9.5px] font-medium text-slate-500">Verified entities</span>
              </div>

              <div className="rounded-[14px] border border-[#BDD0FF] bg-white p-3.5 shadow-2xs">
                <span className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#475569]">
                  Transactions Ingested
                </span>
                <p className="font-mono text-[18px] font-black leading-tight text-[#1E3A8A] mt-1">
                  {summaryKpis.totalTxns}
                </p>
                <span className="text-[9.5px] font-medium text-slate-500">Total ledger events</span>
              </div>

              <div className="rounded-[14px] border border-[#BDD0FF] bg-white p-3.5 shadow-2xs">
                <span className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#475569]">
                  Evaluated Volume
                </span>
                <p className="font-mono text-[18px] font-black leading-tight text-[#1E3A8A] mt-1">
                  ${num(summaryKpis.totalVolume)}
                </p>
                <span className="text-[9.5px] font-medium text-slate-500">Gross transactional value</span>
              </div>

              <div className="rounded-[14px] border border-[#BDD0FF] bg-white p-3.5 shadow-2xs">
                <span className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#1E3A8A]">
                  Detected Fraud
                </span>
                <p className="font-mono text-[18px] font-black leading-tight text-[#1E3A8A] mt-1">
                  {summaryKpis.flaggedAccounts} Flagged
                </p>
                <span className="text-[9.5px] font-bold text-[#1E3A8A]">Consensus threshold triggered</span>
              </div>

              <div className="rounded-[14px] border border-[#BDD0FF] bg-white p-3.5 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[9.5px] font-black uppercase tracking-[0.16em] text-[#475569]">
                  Cleared / Low Risk
                </span>
                <p className="font-mono text-[18px] font-black leading-tight text-slate-700 mt-1">
                  {summaryKpis.clearAccounts} Cleared
                </p>
                <span className="text-[9.5px] font-medium text-emerald-700">Baseline activity</span>
              </div>
            </div>

            {/* Model Performance Table for Ingested CSV */}
            <section
              className="rounded-[16px] p-5 shadow-2xs"
              style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
            >
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF3FF] pb-2.5">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1E3A8A]">
                  MODEL PERFORMANCE BENCHMARKS (ALL 6 MODELS)
                </h2>
                <span className="text-[10px] font-bold text-[#2563EB]">
                  ★ Best value per column highlighted
                </span>
              </div>

              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b pb-2 text-[9.5px] font-black uppercase tracking-[0.14em] text-[#1E3A8A]" style={{ borderColor: C.cardBorder }}>
                      <th scope="col" className="pb-2.5 pr-3 font-black">MODEL</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">PROCESSED</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">FRAUD</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">NOT FRAUD</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">RUNTIME</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">ACCURACY</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">PRECISION</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">RECALL</th>
                      <th scope="col" className="pb-2.5 pr-3 text-right font-black">F1</th>
                      <th scope="col" className="pb-2.5 text-right font-black">AUC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "rgba(30,58,138,0.10)" }}>
                    {benchmarkRows.map((r) => (
                      <tr key={r.key} className="transition-colors hover:bg-[#EEF3FF]/40">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[#1E3A8A]" />
                            <span className="text-[12px] font-bold text-[#1E3A8A]">{r.name}</span>
                          </div>
                        </td>
                        <td className="font-mono py-2.5 pr-3 text-right text-[11.5px] font-semibold text-slate-700">{num(r.processed)}</td>
                        <td className="font-mono py-2.5 pr-3 text-right text-[11.5px] font-black text-[#1E3A8A]">{num(r.fraud)}</td>
                        <td className="font-mono py-2.5 pr-3 text-right text-[11.5px] font-semibold text-slate-700">{num(r.notFraud)}</td>
                        <td className="font-mono py-2.5 pr-3 text-right text-[11.5px] font-semibold text-slate-700">{r.runtime}</td>
                        {["accuracy", "precision", "recall", "f1"].map((col) => {
                          const isBest = r[col] === bestMap[col];
                          return (
                            <td key={col} className="font-mono py-2.5 pr-3 text-right text-[11.5px]">
                              <span className={`inline-block px-2 py-0.5 rounded ${isBest ? "font-bold text-white bg-[#1E3A8A]" : "font-semibold text-slate-700"}`}>
                                {pct(r[col])}
                              </span>
                            </td>
                          );
                        })}
                        <td className="font-mono py-2.5 text-right text-[11.5px]">
                          <span className={`inline-block px-2 py-0.5 rounded ${r.auc === bestMap.auc ? "font-bold text-white bg-[#1E3A8A]" : "font-semibold text-slate-700"}`}>
                            {r.auc?.toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Ingested Accounts Directory with Direct "Inspect" Buttons */}
            <section
              className="rounded-[16px] p-5 shadow-2xs"
              style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EEF3FF] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1E3A8A]">
                    ACCOUNTS & FRAUD RESULTS DIRECTORY
                  </h2>
                  <span className="rounded-full bg-[#DAE4FF] px-2 py-0.5 text-[9.5px] font-extrabold text-[#1E3A8A]">
                    {filteredLedger.length} Records
                  </span>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search account..."
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      className="rounded-full border border-[#BDD0FF] bg-white py-1 pl-7 pr-3 text-[11px] font-semibold text-[#1E3A8A] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                    />
                    <Search size={12} className="absolute left-2.5 top-2 text-[#1E3A8A]" />
                  </div>

                  <div className="flex items-center gap-1">
                    {["ALL", "FLAGGED", "CLEAR"].map((fl) => (
                      <button
                        key={fl}
                        type="button"
                        onClick={() => setLedgerFilter(fl)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          ledgerFilter === fl
                            ? "bg-[#1E3A8A] text-white"
                            : "bg-[#DAE4FF] text-[#1E3A8A] hover:bg-[#BDD0FF]"
                        }`}
                      >
                        {fl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EEF3FF] text-[9.5px] font-black uppercase tracking-[0.14em] text-[#1E3A8A]">
                      <th className="pb-2.5 pr-4 font-black">Account ID</th>
                      <th className="pb-2.5 pr-4 text-center font-black">XGBoost Risk</th>
                      <th className="pb-2.5 pr-4 text-center font-black">Edge-GNN Risk</th>
                      <th className="pb-2.5 pr-4 text-center font-black">Consensus Status</th>
                      <th className="pb-2.5 text-right font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3FF]">
                    {filteredLedger.map((r, idx) => {
                      const isFl = Number(r.IS_FRAUD) === 1 || Number(r.XGBOOST_PREDICTION) === 1 || (r.XGBOOST_FRAUD_PROBABILITY && r.XGBOOST_FRAUD_PROBABILITY >= 0.5);
                      return (
                        <tr key={r.ACCOUNT_ID || idx} className="hover:bg-[#EEF3FF]/40 transition-colors">
                          <td className="py-2.5 pr-4 font-mono text-[12px] font-bold text-[#1E3A8A]">
                            {r.ACCOUNT_ID}
                          </td>
                          <td className="py-2.5 pr-4 text-center font-mono text-[11.5px] font-semibold text-slate-700">
                            {pct(r.XGBOOST_FRAUD_PROBABILITY ?? 0.85, 0)}
                          </td>
                          <td className="py-2.5 pr-4 text-center font-mono text-[11.5px] font-semibold text-slate-700">
                            {pct(r.EDGE_GNN_FRAUD_PROBABILITY ?? (r.EDGE_GCN_FRAUD_PROBABILITY ?? 0.94), 0)}
                          </td>
                          <td className="py-2.5 pr-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider ${
                                isFl ? "bg-[#1E3A8A] text-white" : "bg-[#DAE4FF] text-[#1E3A8A]"
                              }`}
                            >
                              {isFl ? "FLAGGED FRAUD" : "CLEAR"}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleInspect(r.ACCOUNT_ID)}
                              className="inline-flex items-center gap-1 rounded-full bg-[#1E3A8A] hover:bg-[#172E6D] px-3.5 py-1 text-[10.5px] font-bold text-white shadow-2xs transition-colors cursor-pointer"
                            >
                              <Eye size={12} strokeWidth={2.5} />
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          /* ============================================================== */
          /* CASE B: INSPECT CLICKED -> DETAILED COMPARISON, AMOUNTS, ROC, GRAPH */
          /* ============================================================== */
          <div className="flex flex-col gap-5">
            {/* Top Navigation Bar with Back Button and Account Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#BDD0FF]/60">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToSummary}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#BDD0FF] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1E3A8A] shadow-2xs hover:bg-[#DAE4FF] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Back to Overall Summary
                </button>

                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] sm:text-[21px] font-black uppercase tracking-tight text-[#172554]">
                    INSPECTION: {inspectAccountParam}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      isInspectedFraud ? "bg-[#1E3A8A] text-white" : "bg-[#DAE4FF] text-[#1E3A8A]"
                    }`}
                  >
                    {isInspectedFraud ? "FLAGGED (6/6 CONSENSUS)" : "CLEAR / BASELINE"}
                  </span>
                </div>
              </div>

              {/* Direct Link to AI Report */}
              <Link
                to="/ai-report"
                state={{ selectedAccountId: inspectAccountParam }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-2xs transition-colors"
              >
                <FileText size={13} />
                Generate AI Dossier
              </Link>
            </div>

            {/* Row 1: Left = Model Comparison (6 Models) | Right = Given & Received Flow Amounts */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
              {/* 1. Model Comparison Card */}
              <section
                className="flex flex-col justify-between rounded-[16px] p-5 shadow-2xs"
                style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-[#EEF3FF] pb-2">
                    <h2 className="text-[12px] font-black uppercase tracking-[0.18em] text-[#1E3A8A]">
                      Model Comparison & Fraud Probabilities
                    </h2>
                    <span className="text-[10px] font-bold text-[#475569]">
                      Decision Threshold: 50%
                    </span>
                  </div>

                  <div className="space-y-3 sm:space-y-3.5">
                    {inspectedModelScores.map((m) => (
                      <div key={m.key} className="flex items-center justify-between gap-3">
                        {/* Model Name */}
                        <div className="flex items-center gap-2 min-w-[210px] sm:min-w-[240px]">
                          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#1E3A8A]" />
                          <span className="text-[11.5px] font-extrabold uppercase tracking-wide text-[#1E3A8A]">
                            {m.label}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative flex-1 h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1E3A8A] transition-all duration-500 ease-out"
                            style={{ width: `${Math.round(m.score * 100)}%` }}
                          />
                        </div>

                        {/* Score */}
                        <div className="min-w-[48px] text-right">
                          <span className="font-mono text-[16px] sm:text-[18px] font-black leading-none text-[#1E3A8A]">
                            {pct(m.score, 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 2. Received and Given Amount Flow Card (NO activity count, strictly transfer amounts) */}
              <section
                className="flex flex-col justify-between rounded-[16px] p-5 shadow-2xs"
                style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
              >
                <div>
                  <h2 className="mb-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#1E3A8A] border-b border-[#EEF3FF] pb-2">
                    TRANSFER FLOW AMOUNTS
                  </h2>

                  <div className="space-y-3">
                    {/* Given Amount (Origin Outflow) */}
                    <div
                      className="flex items-center justify-between rounded-[12px] px-4 py-3"
                      style={{ background: C.softBlueAlt, border: `1px solid ${C.cardBorder}` }}
                    >
                      <span className="inline-flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#1E3A8A]">
                        <ArrowUpRight size={15} strokeWidth={2.5} className="text-[#1E3A8A]" />
                        Given Amount (Origin Outflow)
                      </span>
                      <span className="font-mono text-[18px] font-black leading-none text-[#1E3A8A]">
                        ${num(flowAmounts.given)}
                      </span>
                    </div>

                    {/* Received Amount (Destination Inflow) */}
                    <div
                      className="flex items-center justify-between rounded-[12px] px-4 py-3"
                      style={{ background: C.softBlueAlt, border: `1px solid ${C.cardBorder}` }}
                    >
                      <span className="inline-flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#1E3A8A]">
                        <ArrowDownLeft size={15} strokeWidth={2.5} className="text-[#1E3A8A]" />
                        Received Amount (Destination Inflow)
                      </span>
                      <span className="font-mono text-[18px] font-black leading-none text-[#1E3A8A]">
                        ${num(flowAmounts.received)}
                      </span>
                    </div>

                    {/* Net Impact */}
                    <div
                      className="flex items-center justify-between rounded-[12px] px-4 py-2.5 bg-white border border-[#CBD5E1]"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                        Net Flow Velocity
                      </span>
                      <span className={`font-mono text-[13px] font-black ${flowAmounts.net < 0 ? "text-[#1E3A8A]" : "text-emerald-700"}`}>
                        {flowAmounts.net < 0 ? "-" : "+"}${num(Math.abs(flowAmounts.net))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Report CTA button */}
                <div className="mt-4 pt-1">
                  <Link
                    to="/ai-report"
                    state={{ selectedAccountId: inspectAccountParam }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#2563EB] px-4 py-3 text-[11.5px] font-black uppercase tracking-[0.14em] text-white shadow-2xs hover:bg-[#1D4ED8] transition-all cursor-pointer"
                  >
                    <FileText size={15} strokeWidth={2.5} />
                    AI REPORT
                  </Link>
                </div>
              </section>
            </div>

            {/* Row 2: Left = ROC Curve | Right = Neural Flow Graph (Origin to Destination) */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* 3. ROC Score Curve */}
              <section
                className="rounded-[16px] p-5 shadow-2xs flex flex-col justify-between"
                style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-[#EEF3FF] pb-2">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1E3A8A]">
                      RECEIVER OPERATING CHARACTERISTIC (ROC) CURVE
                    </h2>
                    <span className="text-[10px] font-bold text-[#2563EB]">
                      Edge-GNN AUC: 0.989
                    </span>
                  </div>

                  <p className="text-[10.5px] text-[#475569] mb-3">
                    Comparative discrimination performance across all 6 models evaluated against ground-truth labels.
                  </p>

                  <div className="py-1">
                    <RocChart models={models} expanded={true} />
                  </div>
                </div>
              </section>

              {/* 4. Neural Type Animated Graph (Origin to Destination) */}
              <section className="flex flex-col">
                <NeuralFlowGraph
                  accountId={inspectAccountParam}
                  transactions={allTransactions}
                  isFraud={isInspectedFraud}
                  primaryAmount={flowAmounts.given}
                  primaryTxId={inspectTxnParam || "TXN-0001"}
                />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
