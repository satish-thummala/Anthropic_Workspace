import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  PROJECTS,
  PROJECT_REGION_STATS,
  CONTRACTOR_PERF,
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

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  "on-track": {
    bg: "#f0fdf4",
    text: "#065f46",
    dot: "#10b981",
    label: "On Track",
  },
  delayed: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b", label: "Delayed" },
  overrun: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444", label: "Overrun" },
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "#fff", border: "1px solid #e2e8f0" }}
    >
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-500">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.name}:{" "}
          <span className="text-slate-800 font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ProjectMonitoring() {
  const onTrack = PROJECTS.filter((p) => p.status === "on-track").length;
  const delayed = PROJECTS.filter((p) => p.status === "delayed").length;
  const overrun = PROJECTS.filter((p) => p.status === "overrun").length;
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0);
  const totalSpent = PROJECTS.reduce((s, p) => s + p.spent, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-slow" />
              <span className="text-xs text-blue-400 font-medium">
                LIVE · Projects Module
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Project Monitoring</h2>
            <p className="text-sm text-slate-400">
              38 active projects · All entities · Real-time budget tracking
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                label: "On Track",
                val: onTrack,
                color: "#10b981",
                bg: "rgba(16,185,129,0.15)",
                border: "rgba(16,185,129,0.3)",
              },
              {
                label: "Delayed",
                val: delayed,
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.15)",
                border: "rgba(245,158,11,0.3)",
              },
              {
                label: "Overrun",
                val: overrun,
                color: "#ef4444",
                bg: "rgba(239,68,68,0.15)",
                border: "rgba(239,68,68,0.3)",
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
            <div
              className="px-4 py-2 rounded-xl text-center"
              style={{
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
              }}
            >
              <div className="text-xl font-bold text-blue-400">
                RM {totalBudget.toFixed(0)}M
              </div>
              <div className="text-xs text-blue-300">Total Budget</div>
            </div>
          </div>
        </div>
      </div>

      {/* Region stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PROJECT_REGION_STATS.map((r) => (
          <div key={r.region} className="p-5" style={card}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-800">
                {r.region} Region
              </h4>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                {r.projects} projects
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-lg font-bold text-slate-800">
                  RM {r.budget}M
                </div>
                <div className="text-xs text-slate-400">Budget</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">
                  RM {r.spent}M
                </div>
                <div className="text-xs text-slate-400">Spent</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(r.spent / r.budget) * 100}%`,
                  background: r.spent > r.budget ? "#ef4444" : "#2563eb",
                }}
              />
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-600 font-semibold">
                {r.onTrack} on track
              </span>
              <span className="text-amber-600 font-semibold">
                {r.delayed} delayed
              </span>
              <span className="text-red-600 font-semibold">
                {r.overrun} overrun
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Project table */}
      <div className="p-5" style={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Active Projects</h3>
          <span className="text-xs text-slate-400">
            Budget in RM Millions · Project Module
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs text-slate-400 uppercase tracking-wider"
                style={{ borderBottom: "1px solid #f1f5f9" }}
              >
                <th className="text-left px-3 py-2.5 font-medium">Project</th>
                <th className="text-left px-3 py-2.5 font-medium">Entity</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-left px-3 py-2.5 font-medium">Progress</th>
                <th className="text-left px-3 py-2.5 font-medium">Budget</th>
                <th className="text-left px-3 py-2.5 font-medium">Spent</th>
                <th className="text-left px-3 py-2.5 font-medium">
                  Contractor
                </th>
                <th className="text-left px-3 py-2.5 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((p, i) => {
                const st = STATUS_STYLES[p.status];
                const overrunPct = (
                  ((p.spent - p.budget) / p.budget) *
                  100
                ).toFixed(1);
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                    style={{
                      borderBottom:
                        i < PROJECTS.length - 1 ? "1px solid #f8fafc" : "none",
                    }}
                  >
                    <td className="px-3 py-3">
                      <div className="text-xs font-bold text-slate-400">
                        {p.id}
                      </div>
                      <div className="text-sm font-medium text-slate-700 leading-tight">
                        {p.name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {p.entity}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="flex items-center gap-1.5 text-xs font-semibold w-fit px-2 py-1 rounded-full"
                        style={{ background: st.bg, color: st.text }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: st.dot }}
                        />
                        {st.label}
                        {p.delay > 0 && (
                          <span className="ml-1">+{p.delay}d</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${p.progress}%`,
                              background:
                                p.status === "on-track"
                                  ? "#2563eb"
                                  : p.status === "delayed"
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 font-medium">
                          {p.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-700">
                      RM {p.budget}M
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-xs font-semibold ${p.spent > p.budget ? "text-red-600" : "text-slate-700"}`}
                      >
                        RM {p.spent}M
                      </span>
                      {p.spent > p.budget && (
                        <div className="text-xs text-red-500 font-bold">
                          +{overrunPct}% OVERRUN
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {p.contractor}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {p.dueDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contractor performance */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">
          Contractor Performance Scorecard
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CONTRACTOR_PERF.map((c) => (
            <div
              key={c.name}
              className="p-4 rounded-xl transition-all hover:shadow-md"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <div className="text-sm font-bold text-slate-800 mb-1 leading-tight">
                {c.name}
              </div>
              <div className="text-xs text-slate-400 mb-3">
                {c.projects} projects
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-500">On-time</span>
                    <span className="font-semibold text-slate-700">
                      {c.onTime}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.onTime}%`,
                        background:
                          c.onTime >= 80
                            ? "#10b981"
                            : c.onTime >= 65
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-500">Budget</span>
                    <span className="font-semibold text-slate-700">
                      {c.budget}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.budget}%`,
                        background:
                          c.budget >= 90
                            ? "#10b981"
                            : c.budget >= 75
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    width="12"
                    height="12"
                    fill={star <= Math.round(c.rating) ? "#f59e0b" : "#e2e8f0"}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span className="text-xs text-slate-500 ml-1">{c.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
