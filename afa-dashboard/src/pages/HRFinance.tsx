import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import {
  DEPT_HR_FINANCE,
  OVERTIME_VS_DELAY,
  WORKFORCE_AVAILABILITY,
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

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "#fff", border: "1px solid #e2e8f0" }}
    >
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div
          key={p.name}
          className="flex items-center gap-2 text-slate-500 mb-0.5"
        >
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

export default function HRFinance() {
  const totalHeadcount = DEPT_HR_FINANCE.reduce((s, d) => s + d.headcount, 0);
  const totalVacancies = DEPT_HR_FINANCE.reduce((s, d) => s + d.vacancies, 0);
  const avgAttrition = (
    DEPT_HR_FINANCE.reduce((s, d) => s + d.attrition, 0) /
    DEPT_HR_FINANCE.length
  ).toFixed(1);
  const totalOT = DEPT_HR_FINANCE.reduce((s, d) => s + d.overtime, 0).toFixed(
    0,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow" />
              <span className="text-xs text-purple-400 font-medium">
                LIVE · HCM + Finance Integration
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              HR & Finance Cross-Intelligence
            </h2>
            <p className="text-sm text-slate-400">
              Workforce analytics, cost correlation, and attrition monitoring
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                val: totalHeadcount.toLocaleString(),
                label: "Total Workforce",
                color: "#8b5cf6",
                bg: "rgba(139,92,246,0.15)",
                border: "rgba(139,92,246,0.3)",
              },
              {
                val: totalVacancies.toString(),
                label: "Open Vacancies",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.15)",
                border: "rgba(245,158,11,0.3)",
              },
              {
                val: `${avgAttrition}%`,
                label: "Avg Attrition",
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
          </div>
        </div>
      </div>

      {/* Dept breakdown */}
      <div className="p-5" style={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">
            Department HR + Cost Snapshot
          </h3>
          <span className="text-xs text-slate-400">HCM · Real-time</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs text-slate-400 uppercase tracking-wider"
                style={{ borderBottom: "1px solid #f1f5f9" }}
              >
                <th className="text-left px-3 py-2.5 font-medium">
                  Department
                </th>
                <th className="text-right px-3 py-2.5 font-medium">
                  Headcount
                </th>
                <th className="text-right px-3 py-2.5 font-medium">
                  OT Hrs/Wk
                </th>
                <th className="text-right px-3 py-2.5 font-medium">
                  Vacancies
                </th>
                <th className="text-right px-3 py-2.5 font-medium">
                  Attrition
                </th>
                <th className="text-right px-3 py-2.5 font-medium">
                  HR Cost (RM M)
                </th>
                <th className="text-left px-3 py-2.5 font-medium">
                  Attrition Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {DEPT_HR_FINANCE.map((d, i) => {
                const riskLevel =
                  d.attrition >= 8
                    ? "high"
                    : d.attrition >= 5
                      ? "medium"
                      : "low";
                const riskColor = {
                  high: "#ef4444",
                  medium: "#f59e0b",
                  low: "#10b981",
                }[riskLevel];
                return (
                  <tr
                    key={d.dept}
                    className="hover:bg-slate-50 transition-colors"
                    style={{
                      borderBottom:
                        i < DEPT_HR_FINANCE.length - 1
                          ? "1px solid #f8fafc"
                          : "none",
                    }}
                  >
                    <td className="px-3 py-3 font-medium text-slate-700">
                      {d.dept}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 font-semibold">
                      {d.headcount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={`text-xs font-semibold ${d.overtime > 25 ? "text-red-600" : d.overtime > 15 ? "text-amber-600" : "text-slate-600"}`}
                      >
                        {d.overtime}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={`text-xs font-semibold ${d.vacancies > 20 ? "text-red-600" : d.vacancies > 10 ? "text-amber-600" : "text-slate-600"}`}
                      >
                        {d.vacancies}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: riskColor }}
                      >
                        {d.attrition}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      RM {d.hrCost}M
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(d.attrition * 10, 100)}%`,
                              background: riskColor,
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-semibold capitalize"
                          style={{ color: riskColor }}
                        >
                          {riskLevel}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* OT vs project delays */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">
            Overtime vs Project Delays Correlation
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Cross-functional intelligence · HCM + Projects
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={OVERTIME_VS_DELAY}
              margin={{ top: 5, right: 15, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                yAxisId="left"
                dataKey="overtime"
                fill="#8b5cf6"
                opacity={0.8}
                radius={[3, 3, 0, 0]}
                name="OT Hrs/Wk"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="delayedProjects"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                name="Delayed Projects"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">
            ↑ Strong correlation: high overtime weeks coincide with increased
            project delays
          </p>
        </div>

        {/* Workforce availability */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">
            Workforce Availability by Dept
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Available vs On-site deployment · Today
          </p>
          <div className="space-y-4 pt-2">
            {WORKFORCE_AVAILABILITY.map((w) => (
              <div key={w.dept}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-slate-700 font-medium">
                    {w.dept}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-emerald-600 font-semibold">
                      {w.available}% avail
                    </span>
                    <span className="text-blue-600 font-semibold">
                      {w.onSite}% on-site
                    </span>
                    <span className="text-slate-400">{w.onLeave}% leave</span>
                  </div>
                </div>
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ background: "#f1f5f9" }}
                >
                  <div className="h-full flex">
                    <div
                      style={{ width: `${w.onSite}%`, background: "#2563eb" }}
                    />
                    <div
                      style={{ width: `${w.onLeave}%`, background: "#f59e0b" }}
                    />
                    <div
                      style={{ width: `${w.bench}%`, background: "#e2e8f0" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded"
                style={{ background: "#2563eb" }}
              />
              On-Site
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded"
                style={{ background: "#f59e0b" }}
              />
              On Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded"
                style={{ background: "#e2e8f0" }}
              />
              Bench
            </span>
          </div>
        </div>
      </div>

      {/* Attrition alerts */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">
          Attrition & Vacancy Alerts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              dept: "IT & Technical",
              attrition: 8.4,
              vacancies: 14,
              days: 45,
              severity: "critical",
              note: "Above 8% threshold. Recruitment urgency HIGH.",
            },
            {
              dept: "Toll Operations",
              attrition: 4.8,
              vacancies: 18,
              days: 32,
              severity: "warning",
              note: "Vacancy aging increasing. Impact on shift coverage.",
            },
            {
              dept: "O&M",
              attrition: 6.1,
              vacancies: 32,
              days: 38,
              severity: "warning",
              note: "Largest unfilled count. Linked to OT surge in south region.",
            },
          ].map((a) => (
            <div
              key={a.dept}
              className="p-4 rounded-xl"
              style={{
                background: a.severity === "critical" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${a.severity === "critical" ? "#fecaca" : "#fde68a"}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-800">
                  {a.dept}
                </span>
                <span
                  className="text-xs font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      a.severity === "critical" ? "#fecaca" : "#fde68a",
                    color: a.severity === "critical" ? "#991b1b" : "#92400e",
                  }}
                >
                  {a.severity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                <div>
                  <div className="font-bold text-lg text-slate-800">
                    {a.attrition}%
                  </div>
                  <div className="text-slate-500">Attrition</div>
                </div>
                <div>
                  <div className="font-bold text-lg text-slate-800">
                    {a.vacancies}
                  </div>
                  <div className="text-slate-500">Vacancies</div>
                </div>
              </div>
              <p className="text-xs text-slate-600">{a.note}</p>
              <p className="text-xs text-slate-400 mt-1">
                Vacancies open avg {a.days} days
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
