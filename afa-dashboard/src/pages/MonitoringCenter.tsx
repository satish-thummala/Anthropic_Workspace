import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CRITICAL_ALERTS,
  SYSTEM_STATUS,
  PENDING_APPROVALS,
} from "../data/mockData";

const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
};
const darkCard = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
};

const ALERT_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#94a3b8",
};

function LiveTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);
  const msgs = [
    "✓ Finance sync complete · 48,241 records",
    "⚡ Toll Plaza Sg. Besi · 142 vehicles/min",
    "⚠ PRJ-002: Budget threshold exceeded · Review required",
    "✓ Projects refresh · 38 projects updated",
    "📊 AI Engine: Revenue forecast recalculated",
    "⚡ SCADA: Plaza Skudai · Peak hour detected",
  ];
  return (
    <div
      className="text-xs font-medium animate-slide-in"
      style={{ color: "#3b82f6" }}
    >
      {msgs[tick % msgs.length]}
    </div>
  );
}

// Simulated SLA data
const slaData = [
  { t: "06:00", response: 2.1, target: 3 },
  { t: "07:00", response: 2.8, target: 3 },
  { t: "08:00", response: 3.4, target: 3 },
  { t: "09:00", response: 4.2, target: 3 },
  { t: "10:00", response: 3.8, target: 3 },
  { t: "11:00", response: 3.1, target: 3 },
  { t: "12:00", response: 2.9, target: 3 },
];

export default function MonitoringCenter() {
  const [ackedAlerts, setAckedAlerts] = useState<string[]>([]);
  const unacked = CRITICAL_ALERTS.filter(
    (a) => !a.ack && !ackedAlerts.includes(a.id),
  ).length;

  const ack = (id: string) => setAckedAlerts((prev) => [...prev, id]);

  return (
    <div className="space-y-5">
      {/* NOC Header */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-blink" />
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "#ef4444" }}
              >
                LIVE CONTROL TOWER
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Proactive Monitoring Center
            </h2>
            <div className="mt-1">
              <LiveTicker />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                label: "Critical",
                val: CRITICAL_ALERTS.filter((a) => a.severity === "critical")
                  .length,
                color: "#ef4444",
                bg: "rgba(239,68,68,0.15)",
                border: "rgba(239,68,68,0.3)",
              },
              {
                label: "High",
                val: CRITICAL_ALERTS.filter((a) => a.severity === "high")
                  .length,
                color: "#f97316",
                bg: "rgba(249,115,22,0.15)",
                border: "rgba(249,115,22,0.3)",
              },
              {
                label: "Unacked",
                val: unacked,
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.15)",
                border: "rgba(245,158,11,0.3)",
              },
              {
                label: "Systems OK",
                val: `${SYSTEM_STATUS.filter((s) => s.status === "online").length}/8`,
                color: "#10b981",
                bg: "rgba(16,185,129,0.15)",
                border: "rgba(16,185,129,0.3)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="px-4 py-2 rounded-xl text-center"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="text-xl font-bold" style={{ color: s.color }}>
                  {s.val}
                </div>
                <div className="text-xs" style={{ color: s.color }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* All alerts */}
        <div className="xl:col-span-2 p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Alert Feed</h3>
            <span className="text-xs text-slate-400">
              Auto-refreshing · All sources
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {CRITICAL_ALERTS.map((alert) => {
              const isAcked = alert.ack || ackedAlerts.includes(alert.id);
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl transition-all"
                  style={{
                    background: isAcked
                      ? "#f8fafc"
                      : `${ALERT_COLOR[alert.severity]}08`,
                    border: `1px solid ${isAcked ? "#f1f5f9" : ALERT_COLOR[alert.severity] + "30"}`,
                    opacity: isAcked ? 0.65 : 1,
                  }}
                >
                  <div className="shrink-0 mt-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: ALERT_COLOR[alert.severity],
                        boxShadow: isAcked
                          ? "none"
                          : `0 0 8px ${ALERT_COLOR[alert.severity]}`,
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: ALERT_COLOR[alert.severity] }}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {alert.category}
                      </span>
                      <span className="text-xs text-slate-400">{alert.id}</span>
                    </div>
                    <p className="text-sm text-slate-700">{alert.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400">{alert.time}</span>
                    {!isAcked && (
                      <button
                        onClick={() => ack(alert.id)}
                        className="text-xs px-2 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                        style={{
                          background: "#f0f9ff",
                          color: "#0369a1",
                          border: "1px solid #bae6fd",
                        }}
                      >
                        ACK
                      </button>
                    )}
                    {isAcked && (
                      <span className="text-xs text-slate-400">✓ Acked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System + SLA */}
        <div className="space-y-4">
          <div className="p-5" style={card}>
            <h3 className="font-semibold text-slate-800 mb-3">System Uptime</h3>
            <div className="space-y-2">
              {SYSTEM_STATUS.map((sys) => (
                <div
                  key={sys.system}
                  className="flex items-center gap-2 p-2 rounded-xl"
                  style={{ background: "#f8fafc" }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background:
                        sys.status === "online" ? "#10b981" : "#f59e0b",
                      boxShadow: `0 0 5px ${sys.status === "online" ? "#10b981" : "#f59e0b"}`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 truncate">
                      {sys.system}
                    </div>
                    <div className="text-xs text-slate-400">
                      {sys.lastSync} · {sys.latency}ms
                    </div>
                  </div>
                  <div
                    className="text-xs font-bold shrink-0"
                    style={{
                      color: sys.status === "online" ? "#10b981" : "#f59e0b",
                    }}
                  >
                    {sys.uptime}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5" style={card}>
            <h3 className="font-semibold text-slate-800 mb-1">
              O&M SLA Response Time
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Target: &lt;3 hrs · Today
            </p>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart
                data={slaData}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#e2e8f0"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Target (3hr)"
                />
                <Line
                  type="monotone"
                  dataKey="response"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  name="Actual (hrs)"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              SLA breach detected 09:00–10:00
            </div>
          </div>
        </div>
      </div>

      {/* Pending approvals + compliance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Pending Approvals</h3>
            <span className="text-xs px-2 py-1 rounded-full text-amber-700 bg-amber-50 font-semibold">
              {PENDING_APPROVALS.length} require action
            </span>
          </div>
          <div className="space-y-2">
            {PENDING_APPROVALS.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
              >
                <div>
                  <div className="text-xs font-bold text-amber-700">
                    {a.id} · {a.type}
                  </div>
                  <div className="text-sm text-slate-700">{a.description}</div>
                  <div className="text-xs text-slate-500">
                    Requested: {a.requestedBy} · {a.dept} ·{" "}
                    <span className="font-semibold text-amber-700">
                      {a.age}h pending
                    </span>
                  </div>
                </div>
                <div className="ml-auto shrink-0">
                  <div className="text-xs text-right text-amber-800 font-semibold">
                    {a.pending}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">
            Compliance Deadlines
          </h3>
          <div className="space-y-3">
            {[
              {
                deadline: "May 10",
                item: "CIDB submission · PRJ-004",
                urgency: "critical",
                days: 5,
              },
              {
                deadline: "May 15",
                item: "BNM Quarterly Reporting",
                urgency: "warning",
                days: 10,
              },
              {
                deadline: "May 20",
                item: "DOSH Safety Audit · 2 sites",
                urgency: "warning",
                days: 15,
              },
              {
                deadline: "May 31",
                item: "Annual PDPA Review",
                urgency: "ok",
                days: 26,
              },
            ].map((c) => (
              <div
                key={c.deadline}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50"
                style={{ border: "1px solid #f1f5f9" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{
                    background:
                      c.urgency === "critical"
                        ? "#fef2f2"
                        : c.urgency === "warning"
                          ? "#fffbeb"
                          : "#f0fdf4",
                  }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{
                      color:
                        c.urgency === "critical"
                          ? "#dc2626"
                          : c.urgency === "warning"
                            ? "#d97706"
                            : "#16a34a",
                    }}
                  >
                    {c.days}d
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">
                    {c.item}
                  </div>
                  <div className="text-xs text-slate-400">
                    Due: {c.deadline}
                  </div>
                </div>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background:
                      c.urgency === "critical"
                        ? "#ef4444"
                        : c.urgency === "warning"
                          ? "#f59e0b"
                          : "#10b981",
                    boxShadow: `0 0 5px ${c.urgency === "critical" ? "#ef4444" : c.urgency === "warning" ? "#f59e0b" : "#10b981"}`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
