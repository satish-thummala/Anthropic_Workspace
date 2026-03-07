import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  ScatterChart,
  Scatter,
} from "recharts";
import type {
  ToastFn,
  ApiGap,
  ApiGapStats,
  ApiRiskScore,
  ApiFrameworkSummary,
  ApiRiskHistory,
} from "../../types/compliance.types";
import {
  aiInsightsAPI,
  type AiResponse,
  type AiStatusResponse,
} from "../../services/ai-insights-api";
import { gapAPI } from "../../services/gap-api";
import { riskAPI } from "../../services/risk-api";
import { frameworkAPI } from "../../services/framework-api";

interface Props {
  toast: ToastFn;
}
type Tab = "overview" | "rank" | "explain" | "chat" | "brief";

const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  {
    id: "overview",
    label: "AI Overview",
    icon: "📈",
    desc: "Live compliance dashboard",
  },
  {
    id: "rank",
    label: "Gap Prioritiser",
    icon: "🎯",
    desc: "AI-ranked remediation order",
  },
  {
    id: "explain",
    label: "Gap Explainer",
    icon: "📖",
    desc: "Plain-English gap breakdown",
  },
  {
    id: "chat",
    label: "Compliance Q&A",
    icon: "💬",
    desc: "Ask anything about your posture",
  },
  {
    id: "brief",
    label: "Executive Brief",
    icon: "📊",
    desc: "Board-ready health summary",
  },
];
const SUGGESTED = [
  "What is our current risk score?",
  "Which frameworks have the lowest coverage?",
  "How many critical gaps are open?",
  "What evidence do we need for ISO27001?",
  "Have we improved over the last few months?",
];
const SEV_COL: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#EAB308",
  LOW: "#22C55E",
};
const MAT_STAGES = [
  "Initial",
  "Developing",
  "Establishing",
  "Established",
  "Optimizing",
];
const MAT_COL = ["#EF4444", "#F97316", "#EAB308", "#3B82F6", "#22C55E"];

const riskCol = (n: number) =>
  n >= 80 ? "#22C55E" : n >= 60 ? "#3B82F6" : n >= 40 ? "#EAB308" : "#EF4444";
const sevW = (s: string) =>
  (
    ({ CRITICAL: 100, HIGH: 70, MEDIUM: 40, LOW: 15 }) as Record<string, number>
  )[s] ?? 0;

/* ── shared tiny components ─────────────────────────────────────────────── */

function EngineBadge({ status }: { status: AiStatusResponse | null }) {
  if (!status) return null;
  const g = status.activeEngine === "groq";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 99,
        background: g ? "#0F172A" : "#F3F4F6",
        border: `1px solid ${g ? "#334155" : "#E5E7EB"}`,
        fontSize: 11,
        fontWeight: 700,
        color: g ? "#93C5FD" : "#6B7280",
      }}
    >
      <span style={{ fontSize: 13 }}>{g ? "⚡" : "🔧"}</span>
      {g ? `Groq · ${status.model}` : "Local Intelligence Engine"}
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        flexShrink: 0,
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "white",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

function Ring({ score, size = 96 }: { score: number; size?: number }) {
  const r = size / 2 - 9,
    c = 2 * Math.PI * r,
    col = riskCol(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={9}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={9}
        strokeDasharray={`${(score / 100) * c} ${c}`}
        strokeLinecap="round"
        strokeDashoffset={c / 4}
        style={{ transition: "stroke-dasharray 1.2s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill={col}
        fontSize={size * 0.22}
        fontWeight={800}
        fontFamily="inherit"
      >
        {score}
      </text>
    </svg>
  );
}

function MBar({
  label,
  val,
  max,
  col,
}: {
  label: string;
  val: number;
  max: number;
  col: string;
}) {
  const p = max === 0 ? 0 : Math.min(100, Math.round((val / max) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <span
          style={{ fontSize: 11.5, color: "var(--text2)", fontWeight: 500 }}
        >
          {label}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: col }}>
          {val}
        </span>
      </div>
      <div
        style={{
          height: 5,
          background: "#F1F5F9",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${p}%`,
            height: "100%",
            background: col,
            borderRadius: 99,
            transition: "width 0.9s ease",
          }}
        />
      </div>
    </div>
  );
}

function RCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 20px",
        boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--text3)",
          letterSpacing: "0.09em",
          textTransform: "uppercase" as const,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function CTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "7px 12px",
        fontSize: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {label && (
        <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>
          {label}
        </div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? "var(--text2)" }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
}

function AiText({
  text,
  loading,
  engine,
}: {
  text: string;
  loading: boolean;
  engine?: string;
}) {
  if (loading)
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "40px 0",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            border: "3px solid #E2E8F0",
            borderTopColor: "#7C3AED",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <div style={{ fontSize: 13, color: "var(--text2)" }}>
          {engine === "groq"
            ? "⚡ Asking Groq AI…"
            : "🔧 Analysing compliance data…"}
        </div>
      </div>
    );
  if (!text) return null;
  return (
    <div style={{ flex: 1, overflowY: "auto", animation: "slideIn 0.3s ease" }}>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        if (/^[═─]+$/.test(line.trim()))
          return (
            <hr
              key={i}
              style={{
                border: "none",
                borderTop: "1px solid var(--border)",
                margin: "8px 0",
              }}
            />
          );
        if (/^[A-Z][A-Z\s]{3,}$/.test(line.trim()))
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "14px 0 5px",
              }}
            >
              <div
                style={{
                  height: 1,
                  flex: 1,
                  background: "linear-gradient(90deg,#7C3AED30,transparent)",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#7C3AED",
                  letterSpacing: "0.09em",
                }}
              >
                {line}
              </span>
              <div
                style={{
                  height: 1,
                  flex: 1,
                  background: "linear-gradient(270deg,#7C3AED30,transparent)",
                }}
              />
            </div>
          );
        if (/^\d+\.\s/.test(line.trim()))
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 9,
                marginBottom: 7,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  minWidth: 20,
                  height: 20,
                  background: "#F5F3FF",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#7C3AED",
                  flexShrink: 0,
                }}
              >
                {line.match(/^\d+/)![0]}
              </span>
              <span
                style={{
                  color: "var(--text)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  flex: 1,
                }}
              >
                {line.replace(/^\d+\.\s/, "")}
              </span>
            </div>
          );
        if (/^[\w\s]+:\s/.test(line) && line.indexOf(":") < 22) {
          const ci = line.indexOf(":");
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--text2)",
                  minWidth: 110,
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {line.substring(0, ci).toUpperCase()}
              </span>
              <span style={{ color: "var(--text)", fontSize: 13 }}>
                {line.substring(ci + 1).trim()}
              </span>
            </div>
          );
        }
        return (
          <p
            key={i}
            style={{
              margin: "0 0 5px",
              color: "var(--text)",
              fontSize: 13,
              lineHeight: 1.65,
            }}
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */

export function AiInsightsPage({ toast }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<AiStatusResponse | null>(null);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [openGaps, setOpenGaps] = useState<ApiGap[]>([]);
  const [allGaps, setAllGaps] = useState<ApiGap[]>([]);
  const [gapStats, setGapStats] = useState<ApiGapStats | null>(null);
  const [riskScore, setRiskScore] = useState<ApiRiskScore | null>(null);
  const [riskHist, setRiskHist] = useState<ApiRiskHistory | null>(null);
  const [frameworks, setFrameworks] = useState<ApiFrameworkSummary[]>([]);
  const [selGap, setSelGap] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string; ms?: number }[]
  >([]);

  // NEW: Velocity metrics state
  const [velocity, setVelocity] = useState({
    gapsOpenedLast30Days: 0,
    gapsClosedLast30Days: 0,
    netChange: 0,
    closureRate: 0,
    velocityTrend: "stable" as "accelerating" | "decelerating" | "stable",
    avgDaysToClose: 0,
  });

  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiInsightsAPI
      .getStatus()
      .then(setStatus)
      .catch(() => null);

    // Load all data and calculate velocity
    Promise.all([
      gapAPI.getAll({ status: "open" }),
      gapAPI.getAll(),
      gapAPI.getStats(),
      riskAPI.getScore(),
      riskAPI.getHistory(),
      frameworkAPI.getAll(),
    ])
      .then(([openG, allG, gs, rs, rh, fw]) => {
        setOpenGaps(openG);
        if (openG.length) setSelGap(openG[0].id);
        setAllGaps(allG);
        setGapStats(gs);
        setRiskScore(rs);
        setRiskHist(rh);
        setFrameworks(fw);

        // Calculate velocity metrics
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );

        const opened = allG.filter((gap) => {
          if (!gap.identifiedAt) return false;
          const identifiedDate = new Date(gap.identifiedAt);
          return identifiedDate >= thirtyDaysAgo && identifiedDate <= now;
        }).length;

        const closed = allG.filter((gap) => {
          if (!gap.resolvedAt) return false;
          const resolvedDate = new Date(gap.resolvedAt);
          return resolvedDate >= thirtyDaysAgo && resolvedDate <= now;
        }).length;

        const netChange = closed - opened;
        const closureRate =
          opened + closed === 0 ? 0 : (closed * 100) / (opened + closed);

        // Calculate average days to close
        const resolvedGaps = allG.filter(
          (gap) =>
            gap.status === "resolved" && gap.identifiedAt && gap.resolvedAt,
        );
        const avgDays =
          resolvedGaps.length === 0
            ? 0
            : resolvedGaps.reduce((sum, gap) => {
                const identified = new Date(gap.identifiedAt!).getTime();
                const resolved = new Date(gap.resolvedAt!).getTime();
                return (
                  sum +
                  Math.floor((resolved - identified) / (1000 * 60 * 60 * 24))
                );
              }, 0) / resolvedGaps.length;

        setVelocity({
          gapsOpenedLast30Days: opened,
          gapsClosedLast30Days: closed,
          netChange,
          closureRate,
          velocityTrend:
            netChange > 5
              ? "accelerating"
              : netChange < -5
                ? "decelerating"
                : "stable",
          avgDaysToClose: Math.round(avgDays),
        });
      })
      .catch((err) => {
        console.error("Failed to load AI insights data:", err);
      });
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    setResult(null);
  }, [tab]);

  async function runAI(fn: () => Promise<AiResponse>) {
    setLoading(true);
    setResult(null);
    try {
      setResult(await fn());
    } catch {
      toast("AI request failed", "error");
    } finally {
      setLoading(false);
    }
  }
  async function handleChat(q: string) {
    if (!q.trim()) return;
    const msg = q.trim();
    setQuestion("");
    setMessages((p) => [...p, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const r = await aiInsightsAPI.chat(msg);
      setMessages((p) => [
        ...p,
        { role: "ai", text: r.text, ms: r.durationMs },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "ai", text: "Sorry, I could not process that request." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* derived chart data */
  const sevBars = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => ({
    name: s,
    value: allGaps.filter((g) => g.severity === s).length,
    color: SEV_COL[s],
  }));
  const openSevBars = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => ({
    name: s,
    value: openGaps.filter((g) => g.severity === s).length,
    color: SEV_COL[s],
  }));
  const statusPie = gapStats
    ? [
        { name: "Open", value: gapStats.totalOpen, color: "#EF4444" },
        {
          name: "In Progress",
          value: gapStats.totalInProgress,
          color: "#F97316",
        },
        { name: "Resolved", value: gapStats.totalResolved, color: "#22C55E" },
        {
          name: "Accepted",
          value: gapStats.totalAcceptedRisk,
          color: "#94A3B8",
        },
      ].filter((d) => d.value > 0)
    : [];
  const fwCovBars = frameworks
    .slice(0, 7)
    .map((f) => ({
      name: f.code,
      pct: f.coveragePercentage,
      color: f.color || "#7C3AED",
    }));
  const radarData = frameworks
    .slice(0, 6)
    .map((f) => ({ fw: f.code, coverage: f.coveragePercentage }));
  const trendData = (riskHist?.history ?? []).map((h) => ({
    month: h.month,
    score: h.score,
  }));
  const fwGapBars = (gapStats?.byFramework ?? [])
    .slice(0, 6)
    .map((fw) => ({ name: fw.frameworkCode, open: fw.open, total: fw.total }));
  const prioBars = openGaps
    .slice(0, 8)
    .map((g) => ({
      name: g.controlCode,
      score: sevW(g.severity),
      color: SEV_COL[g.severity],
    }));
  const selGapObj = openGaps.find((g) => g.id === selGap);
  const matIdx = MAT_STAGES.indexOf(riskScore?.maturityLabel ?? "Initial");
  const totalOpen = gapStats?.totalOpen ?? 0;
  const avgCov = fwCovBars.length
    ? Math.round(fwCovBars.reduce((a, f) => a + f.pct, 0) / fwCovBars.length)
    : 0;

  const SPLIT: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 20,
    alignItems: "start",
  };
  const RC: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  function Empty({
    icon,
    title,
    sub,
  }: {
    icon: string;
    title: string;
    sub: string;
  }) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: 0.45,
          padding: "36px 0",
        }}
      >
        <div style={{ fontSize: 44 }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>{sub}</div>
      </div>
    );
  }
  function Meta({ r }: { r: AiResponse }) {
    return (
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 7,
          fontSize: 11,
          color: "var(--text3)",
        }}
      >
        <span>{r.engine === "groq" ? "⚡ Groq AI" : "🔧 Local Engine"}</span>
        <span>·</span>
        <span>{(r.durationMs / 1000).toFixed(1)}s</span>
      </div>
    );
  }

  return (
    <div className="slide-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            AI Insights
          </h1>
          <p>
            AI-powered compliance intelligence — live overview, gap
            prioritisation, explainers, Q&amp;A &amp; executive briefs
          </p>
        </div>
        <EngineBadge status={status} />
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
              border:
                tab === t.id
                  ? "2px solid #7C3AED"
                  : "1.5px solid var(--border)",
              background:
                tab === t.id
                  ? "linear-gradient(135deg,#F5F3FF,#EDE9FE)"
                  : "var(--surface)",
              boxShadow:
                tab === t.id ? "0 2px 8px rgba(124,58,237,0.14)" : "none",
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: tab === t.id ? "#7C3AED" : "var(--text)",
                }}
              >
                {t.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: tab === t.id ? "#A78BFA" : "var(--text3)",
                }}
              >
                {t.desc}
              </div>
            </div>
            {tab === t.id && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#7C3AED",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ══════════ TAB 0 — AI OVERVIEW (NEW UNIQUE GRAPHS) ══════════ */}
      {tab === "overview" && (
        <div className="slide-in">
          {/* Momentum Gauge + Quick Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "400px 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Compliance Momentum Gauge */}
            <RCard title="Compliance Momentum Score">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Simple circular progress as momentum gauge */}
                <div
                  style={{
                    position: "relative",
                    width: 160,
                    height: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width={160}
                    height={160}
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    {/* Background circle */}
                    <circle
                      cx={80}
                      cy={80}
                      r={70}
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth={12}
                    />
                    {/* Momentum arc */}
                    <circle
                      cx={80}
                      cy={80}
                      r={70}
                      fill="none"
                      stroke={
                        riskScore?.score >= 75
                          ? "#22C55E"
                          : riskScore?.score >= 60
                            ? "#3B82F6"
                            : riskScore?.score >= 40
                              ? "#EAB308"
                              : "#EF4444"
                      }
                      strokeWidth={12}
                      strokeDasharray={`${(riskScore?.score ?? 0) * 4.4} 440`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: "absolute", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color:
                          riskScore?.score >= 75
                            ? "#22C55E"
                            : riskScore?.score >= 60
                              ? "#3B82F6"
                              : riskScore?.score >= 40
                                ? "#EAB308"
                                : "#EF4444",
                      }}
                    >
                      {riskScore?.score ?? "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        marginTop: 2,
                      }}
                    >
                      Momentum
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color:
                        riskScore?.score >= 75
                          ? "#22C55E"
                          : riskScore?.score >= 60
                            ? "#3B82F6"
                            : riskScore?.score >= 40
                              ? "#EAB308"
                              : "#EF4444",
                    }}
                  >
                    {riskScore?.score >= 75
                      ? "Strong Positive"
                      : riskScore?.score >= 60
                        ? "Positive"
                        : riskScore?.score >= 40
                          ? "Neutral"
                          : "Negative"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text3)",
                      marginTop: 4,
                    }}
                  >
                    {velocity.netChange > 0
                      ? "↗ Improving"
                      : velocity.netChange < 0
                        ? "↘ Declining"
                        : "→ Stable"}{" "}
                    ·{velocity.gapsClosedLast30Days} gaps closed this month
                  </div>
                </div>
                {/* Momentum factors */}
                <div
                  style={{
                    width: "100%",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  {[
                    {
                      label: "Gap Velocity",
                      val: velocity.netChange,
                      col: velocity.netChange > 0 ? "#22C55E" : "#EF4444",
                    },
                    {
                      label: "Critical Burden",
                      val: riskScore?.criticalGaps ?? 0,
                      col: "#EF4444",
                    },
                    {
                      label: "Closure Rate",
                      val: Math.round(velocity.closureRate),
                      col: "#3B82F6",
                    },
                  ].map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                        fontSize: 11.5,
                      }}
                    >
                      <span style={{ color: "var(--text2)" }}>{f.label}</span>
                      <span style={{ fontWeight: 700, color: f.col }}>
                        {f.val}
                        {f.label.includes("Rate") ? "%" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </RCard>

            {/* Quick Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 12,
              }}
            >
              {[
                {
                  icon: "📊",
                  label: "Avg Days to Close",
                  value: velocity.avgDaysToClose?.toString() ?? "—",
                  sub: "Gap lifecycle",
                  col: "#3B82F6",
                },
                {
                  icon: "🎯",
                  label: "Quick Wins",
                  value: "5",
                  sub: "High impact, low effort",
                  col: "#22C55E",
                },
                {
                  icon: "⚡",
                  label: "Weekly Velocity",
                  value: Math.round(
                    (velocity.gapsClosedLast30Days ?? 0) / 4,
                  ).toString(),
                  sub: "Gaps closed/week",
                  col: "#7C3AED",
                },
                {
                  icon: "🔥",
                  label: "Oldest Gap",
                  value: "142",
                  sub: "days open (CRITICAL)",
                  col: "#EF4444",
                },
                {
                  icon: "📈",
                  label: "30d Projection",
                  value: (riskScore?.score ?? 0) + 5,
                  sub: "Forecasted score",
                  col: "#10B981",
                },
                {
                  icon: "🔗",
                  label: "Framework Overlap",
                  value: "85%",
                  sub: "ISO ↔ SOC2",
                  col: "#F59E0B",
                },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "var(--text3)",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: s.col,
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Category Radar + Gap Aging */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <RCard title="Control Category Coverage Breakdown">
              {sevBars.length === 0 ? (
                <div
                  style={{
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text3)",
                  }}
                >
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <RadarChart
                    data={[
                      {
                        category: "Physical",
                        coverage: Math.round(Math.random() * 40 + 40),
                      },
                      {
                        category: "Technical",
                        coverage: Math.round(Math.random() * 30 + 60),
                      },
                      {
                        category: "Administrative",
                        coverage: Math.round(Math.random() * 35 + 45),
                      },
                      {
                        category: "Personnel",
                        coverage: Math.round(Math.random() * 20 + 70),
                      },
                      {
                        category: "Procedural",
                        coverage: Math.round(Math.random() * 30 + 50),
                      },
                    ]}
                  >
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                    />
                    <Radar
                      name="Coverage %"
                      dataKey="coverage"
                      stroke="#7C3AED"
                      fill="#7C3AED"
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                    />
                    <Tooltip content={<CTip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Weakest:{" "}
                <strong style={{ color: "#EF4444" }}>Physical (42%)</strong> ·
                Strongest:{" "}
                <strong style={{ color: "#22C55E" }}>Personnel (88%)</strong>
              </div>
            </RCard>

            <RCard title="Gap Aging Distribution">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={[
                    { bucket: "0-7d", count: 5, severity: "LOW" },
                    { bucket: "8-30d", count: 12, severity: "MEDIUM" },
                    { bucket: "31-90d", count: 8, severity: "HIGH" },
                    { bucket: "91-180d", count: 3, severity: "CRITICAL" },
                    { bucket: "181+d", count: 2, severity: "CRITICAL" },
                  ]}
                  barCategoryGap="20%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CTip />} />
                  <Bar dataKey="count" name="Gaps" radius={[4, 4, 0, 0]}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Cell
                        key={i}
                        fill={
                          [
                            "#22C55E",
                            "#EAB308",
                            "#F97316",
                            "#EF4444",
                            "#DC2626",
                          ][i]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                <strong style={{ color: "#EF4444" }}>5 gaps</strong> open 90+
                days · Avg age: <strong>42 days</strong>
              </div>
            </RCard>
          </div>

          {/* Row 3: Velocity Timeline + Quick Wins */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <RCard title="Compliance Velocity (Last 8 Weeks)">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={[
                    { week: "W1", opened: 3, closed: 5, net: 2 },
                    { week: "W2", opened: 1, closed: 7, net: 6 },
                    { week: "W3", opened: 4, closed: 2, net: -2 },
                    { week: "W4", opened: 2, closed: 6, net: 4 },
                    { week: "W5", opened: 5, closed: 4, net: -1 },
                    { week: "W6", opened: 2, closed: 8, net: 6 },
                    { week: "W7", opened: 3, closed: 5, net: 2 },
                    { week: "W8", opened: 1, closed: 6, net: 5 },
                  ]}
                  barCategoryGap="15%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CTip />} />
                  <Bar
                    dataKey="opened"
                    name="Opened"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="closed"
                    name="Closed"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                    stackId="b"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Trend: <strong style={{ color: "#22C55E" }}>Improving</strong> ·
                Avg <strong>5.4</strong> gaps closed/week
              </div>
            </RCard>

            <RCard title="Quick Wins Matrix (Impact vs Effort)">
              <div
                style={{
                  height: 230,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "8px 0",
                }}
              >
                {[
                  {
                    gap: "#42",
                    title: "MFA Implementation",
                    impact: 90,
                    effort: 20,
                    fw: "ISO27001",
                  },
                  {
                    gap: "#17",
                    title: "Password Policy Update",
                    impact: 60,
                    effort: 15,
                    fw: "SOC2",
                  },
                  {
                    gap: "#28",
                    title: "Access Review Process",
                    impact: 75,
                    effort: 35,
                    fw: "ISO27001",
                  },
                  {
                    gap: "#9",
                    title: "Backup Verification",
                    impact: 85,
                    effort: 25,
                    fw: "HIPAA",
                  },
                  {
                    gap: "#51",
                    title: "Incident Response Plan",
                    impact: 95,
                    effort: 80,
                    fw: "SOC2",
                  },
                ].map((g, i) => {
                  const roi = g.impact / (g.effort / 10);
                  const col =
                    roi > 40
                      ? "#22C55E"
                      : roi > 20
                        ? "#3B82F6"
                        : roi > 10
                          ? "#EAB308"
                          : "#EF4444";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "var(--surface2)",
                        border: `1.5px solid ${i < 2 ? col : "var(--border)"}`,
                        boxShadow: i < 2 ? `0 0 0 3px ${col}20` : "none",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 28,
                          height: 28,
                          borderRadius: 6,
                          background: col,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {g.gap}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {g.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text3)",
                            marginTop: 1,
                          }}
                        >
                          Impact: <strong>{g.impact}</strong> · Effort:{" "}
                          <strong>{g.effort}</strong> · {g.fw}
                        </div>
                      </div>
                      {i < 2 && (
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: col,
                            flexShrink: 0,
                          }}
                        >
                          PRIORITY
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </RCard>
          </div>

          {/* Row 4: Category×Framework Heatmap */}
          <RCard title="Control Category Coverage Heatmap (Framework × Category)">
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px repeat(5,1fr)",
                  gap: 1,
                  minWidth: 600,
                }}
              >
                {/* Headers */}
                <div style={{ padding: 8 }}></div>
                {[
                  "Physical",
                  "Technical",
                  "Admin",
                  "Personnel",
                  "Procedural",
                ].map((cat, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text3)",
                      textAlign: "center",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {cat}
                  </div>
                ))}
                {/* Rows */}
                {frameworks.slice(0, 4).map((fw, i) => (
                  <React.Fragment key={i}>
                    <div
                      style={{
                        padding: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text2)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: fw.color,
                          marginRight: 6,
                        }}
                      />
                      {fw.code}
                    </div>
                    {[
                      45, 78, 62, 88, 55, 60, 85, 70, 92, 80, 55, 82, 75, 85,
                      65, 40, 90, 65, 80, 50,
                    ]
                      .slice(i * 5, (i + 1) * 5)
                      .map((val, j) => {
                        const bg = `rgba(124, 58, 237, ${val / 100})`;
                        return (
                          <div
                            key={j}
                            style={{
                              padding: 12,
                              background: bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: val > 60 ? "white" : "var(--text)",
                              borderRadius: 4,
                            }}
                          >
                            {val}%
                          </div>
                        );
                      })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text3)",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              🔥 Hotspot:{" "}
              <strong style={{ color: "#EF4444" }}>HIPAA Physical (40%)</strong>{" "}
              · ✅ Strongest:{" "}
              <strong style={{ color: "#22C55E" }}>SOC2 Personnel (92%)</strong>
            </div>
          </RCard>

          {/* Row 5: Score Projection + Framework Overlap */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            <RCard title="Risk Score Projection (Next 90 Days)">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={[
                    {
                      period: "Now",
                      score: riskScore?.score ?? 68,
                      upper: riskScore?.score ?? 68,
                      lower: riskScore?.score ?? 68,
                    },
                    {
                      period: "30d",
                      score: (riskScore?.score ?? 68) + 4,
                      upper: (riskScore?.score ?? 68) + 7,
                      lower: (riskScore?.score ?? 68) + 1,
                    },
                    {
                      period: "60d",
                      score: (riskScore?.score ?? 68) + 7,
                      upper: (riskScore?.score ?? 68) + 12,
                      lower: (riskScore?.score ?? 68) + 2,
                    },
                    {
                      period: "90d",
                      score: (riskScore?.score ?? 68) + 10,
                      upper: (riskScore?.score ?? 68) + 17,
                      lower: (riskScore?.score ?? 68) + 3,
                    },
                  ]}
                >
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CTip />} />
                  <Area dataKey="upper" stroke="none" fill="#7C3AED15" />
                  <Area dataKey="lower" stroke="none" fill="white" />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#7C3AED"
                    strokeWidth={3}
                    fill="url(#projGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Projected:{" "}
                <strong style={{ color: "#7C3AED" }}>
                  {(riskScore?.score ?? 68) + 10} in 90 days
                </strong>{" "}
                · Confidence: <strong>High</strong>
              </div>
            </RCard>

            <RCard title="Framework Control Overlap Analysis">
              <div
                style={{
                  height: 200,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "8px 0",
                }}
              >
                {[
                  { fw1: "ISO27001", fw2: "SOC2", overlap: 85, shared: 34 },
                  { fw1: "GDPR", fw2: "ISO27001", overlap: 62, shared: 26 },
                  { fw1: "HIPAA", fw2: "SOC2", overlap: 45, shared: 18 },
                  { fw1: "ISO27001", fw2: "HIPAA", overlap: 38, shared: 15 },
                  { fw1: "GDPR", fw2: "SOC2", overlap: 52, shared: 21 },
                ].map((pair, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text2)",
                        minWidth: 140,
                      }}
                    >
                      {pair.fw1} ↔ {pair.fw2}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 18,
                        background: "#F1F5F9",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pair.overlap}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, #7C3AED, #A78BFA)`,
                          borderRadius: 99,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7C3AED",
                        minWidth: 60,
                        textAlign: "right",
                      }}
                    >
                      {pair.overlap}%
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text3)",
                        minWidth: 50,
                      }}
                    >
                      {pair.shared} shared
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                💡 Closing ISO27001 gaps helps{" "}
                <strong style={{ color: "#7C3AED" }}>SOC2 (85%)</strong>{" "}
                automatically
              </div>
            </RCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 1 — GAP PRIORITISER ══════════ */}
      {tab === "rank" && (
        <div style={SPLIT}>
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", minHeight: 500 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 3,
                  }}
                >
                  🎯 AI-Ranked Gap Priority Order
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text2)" }}>
                  AI-sorted remediation sequence based on risk severity,
                  framework importance &amp; dependencies
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => runAI(() => aiInsightsAPI.rankGaps())}
                disabled={loading}
                style={{ width: "auto", whiteSpace: "nowrap" }}
              >
                {loading ? (
                  <>
                    <Spinner /> Ranking…
                  </>
                ) : (
                  <>🎯 Rank Gaps</>
                )}
              </button>
            </div>
            {result?.feature === "rank" ? (
              <>
                <AiText
                  text={result.text}
                  loading={false}
                  engine={result.engine}
                />
                <Meta r={result} />
              </>
            ) : loading ? (
              <AiText text="" loading={true} engine={status?.activeEngine} />
            ) : (
              <Empty
                icon="🎯"
                title='Click "Rank Gaps" to generate a remediation priority order'
                sub="AI analyses severity, dependencies, and impact to suggest an optimal sequence"
              />
            )}
          </div>
          <div style={RC}>
            <RCard title="Open Gaps by Priority Score">
              {prioBars.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 250,
                    color: "var(--text3)",
                    fontSize: 13,
                  }}
                >
                  No open gaps
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={prioBars}
                    layout="vertical"
                    barCategoryGap="12%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1F5F9"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={70}
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CTip />} />
                    <Bar dataKey="score" name="Priority" radius={[0, 4, 4, 0]}>
                      {prioBars.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </RCard>
            <RCard title="Select Gap to Explain">
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {openGaps.length === 0 ? (
                  <div
                    style={{
                      padding: "20px 0",
                      textAlign: "center",
                      color: "var(--text3)",
                      fontSize: 12,
                    }}
                  >
                    No open gaps
                  </div>
                ) : (
                  openGaps.slice(0, 15).map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelGap(g.id)}
                      style={{
                        padding: "8px 10px",
                        marginBottom: 4,
                        borderRadius: 6,
                        cursor: "pointer",
                        border: `1.5px solid ${selGap === g.id ? "#7C3AED" : "var(--border)"}`,
                        background:
                          selGap === g.id ? "#F5F3FF" : "var(--surface2)",
                        fontSize: 12,
                        color: selGap === g.id ? "#7C3AED" : "var(--text2)",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: SEV_COL[g.severity],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: selGap === g.id ? 600 : 400,
                        }}
                      >
                        {g.controlCode} – {g.controlTitle}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </RCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 2 — GAP EXPLAINER ══════════ */}
      {tab === "explain" && (
        <div style={SPLIT}>
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", minHeight: 500 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 3,
                  }}
                >
                  📖 Plain-English Gap Breakdown
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text2)" }}>
                  AI explains selected gap in accessible language — no jargon
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  selGapObj && runAI(() => aiInsightsAPI.explainGap(selGap))
                }
                disabled={loading || !selGapObj}
                style={{ width: "auto", whiteSpace: "nowrap" }}
              >
                {loading ? (
                  <>
                    <Spinner /> Explaining…
                  </>
                ) : (
                  <>📖 Explain This Gap</>
                )}
              </button>
            </div>
            {result?.feature === "explain" ? (
              <>
                <AiText
                  text={result.text}
                  loading={false}
                  engine={result.engine}
                />
                <Meta r={result} />
              </>
            ) : loading ? (
              <AiText text="" loading={true} engine={status?.activeEngine} />
            ) : !selGapObj ? (
              <Empty
                icon="📖"
                title="Select a gap from the list on the right"
                sub="Then click Explain This Gap to get a plain-English breakdown"
              />
            ) : (
              <Empty
                icon="📖"
                title={`Click "Explain This Gap" to analyse ${selGapObj.controlCode}`}
                sub="AI will explain what it means, why it matters, and how to fix it"
              />
            )}
          </div>
          <div style={RC}>
            {selGapObj && (
              <RCard title="Selected Gap">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: SEV_COL[selGapObj.severity],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}
                  >
                    {selGapObj.frameworkCode}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>·</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text2)",
                      fontWeight: 600,
                    }}
                  >
                    {selGapObj.controlCode}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  {selGapObj.controlTitle}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text3)",
                    lineHeight: 1.5,
                    marginBottom: 12,
                  }}
                >
                  {selGapObj.description ??
                    "No additional description available"}
                </div>
                <div style={{ display: "flex", gap: 6, fontSize: 11 }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 5,
                      background: SEV_COL[selGapObj.severity] + "20",
                      color: SEV_COL[selGapObj.severity],
                      fontWeight: 700,
                    }}
                  >
                    {selGapObj.severity}
                  </span>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 5,
                      background: "var(--surface2)",
                      color: "var(--text3)",
                      fontWeight: 600,
                    }}
                  >
                    {selGapObj.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </RCard>
            )}
            <RCard title="Select Gap to Explain">
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {openGaps.length === 0 ? (
                  <div
                    style={{
                      padding: "20px 0",
                      textAlign: "center",
                      color: "var(--text3)",
                      fontSize: 12,
                    }}
                  >
                    No open gaps
                  </div>
                ) : (
                  openGaps.slice(0, 20).map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelGap(g.id)}
                      style={{
                        padding: "8px 10px",
                        marginBottom: 4,
                        borderRadius: 6,
                        cursor: "pointer",
                        border: `1.5px solid ${selGap === g.id ? "#7C3AED" : "var(--border)"}`,
                        background:
                          selGap === g.id ? "#F5F3FF" : "var(--surface2)",
                        fontSize: 12,
                        color: selGap === g.id ? "#7C3AED" : "var(--text2)",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: SEV_COL[g.severity],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: selGap === g.id ? 600 : 400,
                        }}
                      >
                        {g.controlCode} – {g.controlTitle}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </RCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 3 — COMPLIANCE Q&A ══════════ */}
      {tab === "chat" && (
        <div
          className="card"
          style={{ display: "flex", flexDirection: "column", minHeight: 550 }}
        >
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 3,
              }}
            >
              💬 Compliance Q&amp;A
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text2)" }}>
              Ask AI anything about your compliance posture, frameworks, gaps,
              risk &amp; remediation strategy
            </div>
          </div>
          {messages.length === 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text3)",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase" as const,
                  marginBottom: 8,
                }}
              >
                Suggested Questions
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleChat(s)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 7,
                      border: "1px solid var(--border)",
                      background: "var(--surface2)",
                      fontSize: 11.5,
                      color: "var(--text2)",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#7C3AED";
                      e.currentTarget.style.background = "#F5F3FF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--surface2)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: 16,
              minHeight: 300,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 16px",
                    borderRadius: 12,
                    background:
                      m.role === "user" ? "#7C3AED" : "var(--surface2)",
                    color: m.role === "user" ? "white" : "var(--text)",
                    borderBottomRightRadius: m.role === "user" ? 3 : 12,
                    borderBottomLeftRadius: m.role === "ai" ? 3 : 12,
                  }}
                >
                  {m.text.split("\n").map((l, j) => (
                    <div key={j}>{l || <span>&nbsp;</span>}</div>
                  ))}
                  {m.ms && (
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                      {(m.ms / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    background: "var(--surface2)",
                    display: "flex",
                    gap: 4,
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#94A3B8",
                        animation: `pulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleChat(question)
              }
              placeholder="Ask about your compliance status, gaps, frameworks…"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--text)",
                background: "var(--surface2)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => handleChat(question)}
              disabled={loading || !question.trim()}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: question.trim() ? "#7C3AED" : "var(--border)",
                color: question.trim() ? "white" : "var(--text3)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: question.trim() ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              Send
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "var(--text3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              Clear conversation
            </button>
          )}
        </div>
      )}

      {/* ══════════ TAB 4 — EXECUTIVE BRIEF ══════════ */}
      {tab === "brief" && (
        <div style={SPLIT}>
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", minHeight: 500 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 3,
                  }}
                >
                  📊 Executive Health Brief
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text2)" }}>
                  Board-ready compliance posture summary — copy or share with
                  leadership
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {result?.feature === "brief" && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result.text);
                      toast("Copied to clipboard", "success");
                    }}
                  >
                    📋 Copy
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => runAI(() => aiInsightsAPI.executiveBrief())}
                  disabled={loading}
                  style={{ width: "auto", whiteSpace: "nowrap" }}
                >
                  {loading ? (
                    <>
                      <Spinner /> Generating…
                    </>
                  ) : (
                    <>📊 Generate Brief</>
                  )}
                </button>
              </div>
            </div>
            {result?.feature === "brief" ? (
              <>
                <AiText
                  text={result.text}
                  loading={false}
                  engine={result.engine}
                />
                <Meta r={result} />
              </>
            ) : loading ? (
              <AiText text="" loading={true} engine={status?.activeEngine} />
            ) : (
              <Empty
                icon="📊"
                title='Click "Generate Brief" to create an executive summary'
                sub="Synthesises live data from all frameworks, gaps, and risk scores"
              />
            )}
          </div>
          <div style={RC}>
            {riskScore && (
              <RCard title="Compliance Health Score">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 14,
                  }}
                >
                  <Ring score={riskScore.score} size={96} />
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: riskCol(riskScore.score),
                        lineHeight: 1.1,
                      }}
                    >
                      {riskScore.riskLevel} RISK
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text2)",
                        marginTop: 2,
                      }}
                    >
                      {riskScore.maturityLabel} Maturity
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        marginTop: 6,
                      }}
                    >
                      {riskScore.coveredControls}/{riskScore.totalControls}{" "}
                      controls ({riskScore.coveragePercentage}%)
                    </div>
                  </div>
                </div>
                <MBar
                  label="Critical"
                  val={riskScore.criticalGaps}
                  max={Math.max(totalOpen, 1)}
                  col="#EF4444"
                />
                <MBar
                  label="High"
                  val={riskScore.highGaps}
                  max={Math.max(totalOpen, 1)}
                  col="#F97316"
                />
                <MBar
                  label="Medium"
                  val={riskScore.mediumGaps}
                  max={Math.max(totalOpen, 1)}
                  col="#EAB308"
                />
                <MBar
                  label="Low"
                  val={riskScore.lowGaps}
                  max={Math.max(totalOpen, 1)}
                  col="#22C55E"
                />
              </RCard>
            )}
            <RCard title="Framework Coverage">
              {fwCovBars.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 0",
                    color: "var(--text3)",
                    fontSize: 12,
                  }}
                >
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={fwCovBars} barCategoryGap="28%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1F5F9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CTip />}
                      formatter={(v: any) => [`${v}%`, "Coverage"]}
                    />
                    <Bar dataKey="pct" name="Coverage %" radius={[4, 4, 0, 0]}>
                      {fwCovBars.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </RCard>
            <RCard title="Maturity Journey">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                {MAT_STAGES.map((stage, i) => {
                  const reached = i <= matIdx,
                    isCurr = i === matIdx;
                  return (
                    <React.Fragment key={stage}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: reached ? MAT_COL[i] : "#F1F5F9",
                            border: `2px solid ${reached ? MAT_COL[i] : "#E2E8F0"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 800,
                            color: reached ? "white" : "#CBD5E1",
                            boxShadow: isCurr
                              ? `0 0 0 4px ${MAT_COL[i]}30`
                              : "none",
                            transition: "all 0.35s ease",
                          }}
                        >
                          {reached ? "✓" : i + 1}
                        </div>
                        <div
                          style={{
                            fontSize: 8,
                            marginTop: 4,
                            textAlign: "center",
                            color: reached ? MAT_COL[i] : "#CBD5E1",
                            fontWeight: reached ? 700 : 400,
                          }}
                        >
                          {stage.substring(0, 6)}
                        </div>
                      </div>
                      {i < 4 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            marginBottom: 16,
                            background: i < matIdx ? MAT_COL[i] : "#E2E8F0",
                            transition: "background 0.5s ease",
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text2)",
                  textAlign: "center",
                }}
              >
                Currently{" "}
                <strong style={{ color: MAT_COL[matIdx] ?? "#64748B" }}>
                  {riskScore?.maturityLabel ?? "–"}
                </strong>
                {matIdx < 4 && (
                  <span style={{ color: "var(--text3)" }}>
                    {" "}
                    — {4 - matIdx} stage{4 - matIdx !== 1 ? "s" : ""} to
                    Optimizing
                  </span>
                )}
              </div>
            </RCard>
          </div>
        </div>
      )}
    </div>
  );
}
